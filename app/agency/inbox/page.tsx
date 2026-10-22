'use client';

// ============================================================================
// AGENCY INBOX, the agency's own messaging center.
// One iMessage-style surface that merges every channel the agency talks on:
//   - VoiceAI Connect : the two-way support thread with the platform
//   - Client          : the in-app thread with each of the agency's clients
//   - Prospect        : a contact-form request from someone with no portal
//   - Text            : carrier SMS on the agency demo number
// Backend (all agency-scoped, auth_token + agency.id):
//   GET  /api/agency/:id/inbox            conversations (messages already merged)
//   POST /api/agency/:id/inbox/send       { type, target, body } routes the reply
//   POST /api/agency/:id/inbox/read       { type, target } clears unread
//   GET  /api/agency/:id/inbox/facts      context for a client/prospect thread
// New-message compose can START a conversation with a client, a texted number,
// or the platform, so "message VoiceAI Connect" is one option, not the only one.
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  MessageSquare, Send, ArrowLeft, Loader2, RefreshCw, Phone, Building2,
  User, Headphones, PenSquare, X,
} from 'lucide-react';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';
import { CustomSelect } from '@/components/ui/custom-select';

type ConvType = 'platform' | 'client' | 'prospect' | 'sms';
interface InboxMessage { id: string; sender: 'in' | 'out'; body: string; at: string; }
interface Conversation {
  key: string;
  type: ConvType;
  name: string | null;
  phone: string | null;
  target: string | null;
  clientId?: string | null;
  pinned?: boolean;
  messages: InboxMessage[];
  unread: number;
  lastAt: string | null;
  lastDirection: 'in' | 'out' | null;
  lastPreview: string;
  needsReply: boolean;
}
interface ClientFacts {
  businessName?: string | null; ownerName?: string | null; plan?: string | null;
  status?: string | null; trialEndsAt?: string | null; aiPhone?: string | null;
  ownerPhone?: string | null; callsThisMonth?: number | null; monthlyCallLimit?: number | null;
  lastCallAt?: string | null; priceCents?: number | null; isTest?: boolean;
}
interface AgencyClient { id: string; business_name?: string | null; name?: string | null; owner_phone?: string | null; }

const TYPE_META: Record<ConvType, { label: string; short: string }> = {
  platform: { label: 'VoiceAI Connect', short: 'Platform' },
  client: { label: 'Client', short: 'Client' },
  prospect: { label: 'Prospect', short: 'Prospect' },
  sms: { label: 'Text', short: 'Text' },
};

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
}
function fmtPhone(p?: string | null): string {
  if (!p) return '';
  const d = String(p).replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(p);
}
function money(cents?: number | null): string {
  if (cents == null) return '';
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function AgencyInboxPage() {
  const { agency } = useAgency();
  const theme = useTheme();
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const agencyId = agency?.id || '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Compose (new message) panel.
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeChannel, setComposeChannel] = useState<'client' | 'sms' | 'platform'>('client');
  const [composeClientId, setComposeClientId] = useState('');
  const [composePhone, setComposePhone] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);

  // Facts for the open client/prospect thread.
  const [facts, setFacts] = useState<ClientFacts | null>(null);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);
  const stickRef = useRef(true);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
    return { Authorization: `Bearer ${token}` };
  }, []);

  const selected = useMemo(() => conversations.find((c) => c.key === selectedKey) || null, [conversations, selectedKey]);
  const currentDraft = selected ? (drafts[selected.key] ?? '') : '';
  const setDraft = (key: string, val: string) => setDrafts((p) => ({ ...p, [key]: val }));
  const clearDraft = (key: string) => setDrafts((p) => { const n = { ...p }; delete n[key]; return n; });

  const selectUi = useMemo(() => ({
    inputStyle: { background: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text },
    text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border,
    hover: theme.hover, accent: theme.primary, isDark: theme.isDark,
  }), [theme]);

  // Drafts persist per conversation so switching threads never loses unsent text.
  useEffect(() => {
    try { const raw = localStorage.getItem('agency_inbox_drafts'); if (raw) setDrafts(JSON.parse(raw) || {}); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('agency_inbox_drafts', JSON.stringify(drafts)); } catch {}
  }, [drafts]);

  const load = useCallback(async () => {
    if (!agencyId) return;
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/inbox`, { headers: authHeaders() });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      const convos: Conversation[] = data.conversations || [];
      setConversations(convos);
      setError('');
      // Prune drafts for conversations that no longer exist (guarded by a
      // non-empty load so a transient failure never wipes what you're typing).
      if (convos.length) {
        setDrafts((prev) => {
          const keys = new Set(convos.map((c) => c.key));
          let changed = false; const next: Record<string, string> = {};
          for (const k in prev) { if (keys.has(k)) next[k] = prev[k]; else changed = true; }
          return changed ? next : prev;
        });
      }
    } catch {
      setError('Could not load your inbox.');
    } finally {
      setLoadingList(false);
    }
  }, [agencyId, api, authHeaders]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  // Honor /agency/inbox?channel=platform from the Support handoff.
  useEffect(() => {
    if (selectedKey || !conversations.length) return;
    try {
      const ch = new URLSearchParams(window.location.search).get('channel');
      if (ch === 'platform') { const p = conversations.find((c) => c.type === 'platform'); if (p) openConversation(p); }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length]);

  useEffect(() => { stickRef.current = true; }, [selectedKey]);
  useEffect(() => { if (stickRef.current) threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected?.messages.length, selectedKey]);
  useEffect(() => {
    const el = replyRef.current; if (!el) return;
    el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [currentDraft, selectedKey]);

  const markRead = useCallback(async (c: Conversation) => {
    if (!c.unread || c.type === 'sms') return;
    try {
      await fetch(`${api}/api/agency/${agencyId}/inbox/read`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: c.type, target: c.target }),
      });
    } catch {}
    setConversations((prev) => prev.map((x) => (x.key === c.key ? { ...x, unread: 0 } : x)));
  }, [api, agencyId, authHeaders]);

  const loadFacts = useCallback(async (c: Conversation) => {
    setFacts(null);
    if (c.type !== 'client' && c.type !== 'prospect') return;
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/inbox/facts?type=${c.type}&target=${encodeURIComponent(c.target || '')}`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.facts) setFacts(data.facts);
    } catch {}
  }, [api, agencyId, authHeaders]);

  function openConversation(c: Conversation) {
    setSelectedKey(c.key);
    markRead(c);
    loadFacts(c);
  }

  const send = async () => {
    if (!selected || sending) return;
    const key = selected.key;
    const text = (drafts[key] || '').trim();
    if (!text) return;
    setSending(true);
    const optimistic: InboxMessage = { id: `tmp-${Date.now()}`, sender: 'out', body: text, at: new Date().toISOString() };
    setConversations((prev) => prev.map((x) => (x.key === key ? { ...x, messages: [...x.messages, optimistic] } : x)));
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/inbox/send`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selected.type, target: selected.target, body: text }),
      });
      if (!res.ok) throw new Error('send failed');
      clearDraft(key);
      await load();
    } catch {
      setConversations((prev) => prev.map((x) => (x.key === key ? { ...x, messages: x.messages.filter((m) => m.id !== optimistic.id) } : x)));
      setError('Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  // ---- Compose (new conversation) ----
  const openCompose = async () => {
    setComposeOpen(true);
    setComposeBody(''); setComposePhone(''); setComposeClientId('');
    if (!clientsLoaded) {
      try {
        const res = await fetch(`${api}/api/agency/${agencyId}/clients`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          const list: AgencyClient[] = Array.isArray(data) ? data : (data.clients || []);
          setClients(list);
          if (!list.length) setComposeChannel('sms');
        }
      } catch {}
      setClientsLoaded(true);
    }
  };

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.business_name || c.name || 'Client' })).sort((a, b) => a.label.localeCompare(b.label)),
    [clients]
  );
  const channelOptions = [
    { value: 'client', label: 'Message a client' },
    { value: 'sms', label: 'Text a number' },
    { value: 'platform', label: 'Message VoiceAI Connect' },
  ];

  const composeValid = composeBody.trim().length > 0 && (
    composeChannel === 'platform' ||
    (composeChannel === 'client' && !!composeClientId) ||
    (composeChannel === 'sms' && composePhone.replace(/\D/g, '').length >= 10)
  );

  const startNew = async () => {
    if (!composeValid || composeSending) return;
    setComposeSending(true);
    const payload =
      composeChannel === 'client' ? { type: 'client', target: composeClientId, body: composeBody.trim() }
      : composeChannel === 'sms' ? { type: 'sms', target: composePhone.trim(), body: composeBody.trim() }
      : { type: 'platform', target: '', body: composeBody.trim() };
    try {
      const res = await fetch(`${api}/api/agency/${agencyId}/inbox/send`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'send failed'); }
      setComposeOpen(false);
      await load();
      // Select the conversation we just wrote to.
      const wantKey =
        composeChannel === 'client' ? `client-${composeClientId}`
        : composeChannel === 'platform' ? 'platform'
        : `sms-${composePhone.replace(/\D/g, '').slice(-10)}`;
      setSelectedKey(wantKey);
    } catch (e: any) {
      setError(e?.message === 'No demo number on this agency yet' ? 'You need a demo number before you can text from the platform.' : 'Could not send the message.');
    } finally {
      setComposeSending(false);
    }
  };

  const totalUnread = conversations.reduce((n, c) => n + (c.unread || 0), 0);

  const TypeTag = ({ type }: { type: ConvType }) => (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
      style={type === 'platform'
        ? { background: theme.primary15, color: theme.primary }
        : { background: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: theme.textMuted }}>
      {TYPE_META[type].short}
    </span>
  );
  const ConvIcon = ({ type }: { type: ConvType }) =>
    type === 'platform' ? <Headphones className="h-4 w-4" />
    : type === 'client' ? <Building2 className="h-4 w-4" />
    : type === 'sms' ? <MessageSquare className="h-4 w-4" />
    : <User className="h-4 w-4" />;

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden" style={{ color: theme.text, background: theme.bg }}>
      {/* Conversation list */}
      <aside className={`${selected ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 shrink-0 flex-col border-r`} style={{ borderColor: theme.border, background: theme.card }}>
        <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" style={{ color: theme.primary }} />
            <h1 className="text-sm font-semibold">Inbox</h1>
            {totalUnread > 0 && (<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: theme.primary, color: theme.primaryText }}>{totalUnread}</span>)}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={openCompose} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold" style={{ background: theme.primary, color: theme.primaryText }} aria-label="New message">
              <PenSquare className="h-3.5 w-3.5" /> New
            </button>
            <button onClick={load} className="p-1.5 rounded-lg" style={{ color: theme.textMuted }} aria-label="Refresh"
              onMouseEnter={(e) => (e.currentTarget.style.background = theme.hover)} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted }} /></div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm" style={{ color: theme.textMuted }}>
              No conversations yet. Messages with your clients, prospects, and the VoiceAI Connect team all land here.
            </div>
          ) : (
            conversations.map((c) => (
              <button key={c.key} onClick={() => openConversation(c)} className="w-full text-left px-4 py-3 border-b transition-colors"
                style={{ borderColor: theme.border, background: selectedKey === c.key ? theme.primary15 : 'transparent' }}
                onMouseEnter={(e) => { if (selectedKey !== c.key) e.currentTarget.style.background = theme.hover; }}
                onMouseLeave={(e) => { if (selectedKey !== c.key) e.currentTarget.style.background = 'transparent'; }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-sm truncate ${c.unread > 0 ? 'font-semibold' : 'font-medium'}`} style={{ color: theme.text }}>
                      {c.name || fmtPhone(c.phone) || TYPE_META[c.type].label}
                    </span>
                    <TypeTag type={c.type} />
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: theme.textMuted }}>{fmtTime(c.lastAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs truncate" style={{ color: (c.unread > 0 || c.needsReply) ? theme.text : theme.textMuted }}>
                    {c.lastDirection === 'out' ? 'You: ' : ''}{c.lastPreview || 'No messages yet'}
                  </span>
                  {c.unread > 0 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0" style={{ background: theme.primary, color: theme.primaryText }}>{c.unread > 99 ? '99+' : c.unread}</span>
                  ) : c.needsReply ? (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: theme.primary }} />
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Thread */}
      <main className={`${selected ? 'flex' : 'hidden sm:flex'} flex-1 flex-col min-w-0`} style={{ background: theme.bg }}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6" style={{ color: theme.textMuted }}>
            <MessageSquare className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">Select a conversation to read and reply.</p>
            <button onClick={openCompose} className="mt-4 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold" style={{ background: theme.primary, color: theme.primaryText }}>
              <PenSquare className="h-4 w-4" /> New message
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0" style={{ borderColor: theme.border, background: theme.card }}>
              <button onClick={() => setSelectedKey(null)} className="sm:hidden p-1.5 -ml-1.5 rounded-lg" style={{ color: theme.textMuted }} aria-label="Back"><ArrowLeft className="h-4 w-4" /></button>
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: theme.primary15, color: theme.primary }}>
                <ConvIcon type={selected.type} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: theme.text }}>
                  {selected.name || fmtPhone(selected.phone) || TYPE_META[selected.type].label}<TypeTag type={selected.type} />
                </div>
                <div className="text-[11px] flex items-center gap-x-3 gap-y-0.5 flex-wrap" style={{ color: theme.textMuted }}>
                  {selected.type === 'platform' && <span>VoiceAI Connect support</span>}
                  {selected.phone && (<span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{fmtPhone(selected.phone)}</span>)}
                  {facts?.aiPhone && selected.type === 'client' && (<span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />AI {fmtPhone(facts.aiPhone)}</span>)}
                </div>
              </div>
            </div>

            {/* Client facts strip */}
            {selected.type === 'client' && facts && (
              <div className="shrink-0 border-b px-4 py-2 grid grid-cols-2 sm:grid-cols-4 gap-2" style={{ borderColor: theme.border, background: theme.card }}>
                {[
                  { label: 'Plan', value: facts.plan || '--' },
                  { label: 'Status', value: facts.status || '--' },
                  { label: 'Calls this mo.', value: facts.callsThisMonth != null ? `${facts.callsThisMonth}${facts.monthlyCallLimit != null ? ` / ${facts.monthlyCallLimit}` : ''}` : '--' },
                  { label: 'Monthly', value: facts.priceCents != null ? money(facts.priceCents) : '--' },
                ].map((f) => (
                  <div key={f.label} className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wide truncate" style={{ color: theme.textMuted }}>{f.label}</div>
                    <div className="text-xs font-medium truncate capitalize" style={{ color: theme.text }}>{f.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {selected.messages.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-sm" style={{ color: theme.textMuted }}>No messages yet. Say hello below.</div>
              ) : (
                selected.messages.map((m) => {
                  const isIn = m.sender === 'in';
                  return (
                    <div key={m.id} className={`flex ${isIn ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[78%]">
                        <div className="rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words"
                          style={isIn
                            ? { background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, borderBottomLeftRadius: 4 }
                            : { background: theme.primary, color: theme.primaryText, borderBottomRightRadius: 4 }}>
                          {m.body}
                        </div>
                        <div className={`mt-1 text-[10px] ${isIn ? 'text-left' : 'text-right'}`} style={{ color: theme.textMuted }}>{fmtTime(m.at)}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Composer */}
            <div className="border-t p-3 shrink-0" style={{ borderColor: theme.border, background: theme.card }}>
              <div className="flex items-end gap-2">
                <textarea ref={replyRef} value={currentDraft} onChange={(e) => selected && setDraft(selected.key, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
                  rows={1} placeholder={selected.type === 'platform' ? 'Message the VoiceAI Connect team...' : selected.type === 'sms' ? 'Send a text...' : 'Write a message...'}
                  className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ background: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text, maxHeight: '45vh', overflowY: 'auto' }} />
                <button onClick={send} disabled={sending || !currentDraft.trim()} className="flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-40" style={{ background: theme.primary, color: theme.primaryText }}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[10px]" style={{ color: theme.textMuted }}>
                {selected.type === 'platform' ? 'Goes to the VoiceAI Connect team. Replies land right here.'
                  : selected.type === 'sms' ? 'Sends as a text from your demo number.'
                  : selected.type === 'client' ? 'Lands in your client\'s dashboard inbox, and texts them a heads-up.'
                  : 'Texts the prospect your reply.'}
              </p>
            </div>
          </>
        )}
      </main>

      {/* Compose modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => !composeSending && setComposeOpen(false)}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ background: theme.card, border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 h-12 border-b" style={{ borderColor: theme.border }}>
              <span className="text-sm font-semibold" style={{ color: theme.text }}>New message</span>
              <button onClick={() => setComposeOpen(false)} className="p-1.5 rounded-lg" style={{ color: theme.textMuted }} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>Send to</label>
                <CustomSelect value={composeChannel} onChange={(v) => setComposeChannel(v as any)} options={channelOptions} ui={selectUi} />
              </div>

              {composeChannel === 'client' && (
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>Client</label>
                  {clientOptions.length ? (
                    <CustomSelect value={composeClientId} onChange={setComposeClientId} options={clientOptions} placeholder="Choose a client" ui={selectUi} />
                  ) : (
                    <p className="text-xs" style={{ color: theme.textMuted }}>No clients yet. Add a client first, or text a number instead.</p>
                  )}
                </div>
              )}

              {composeChannel === 'sms' && (
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>Phone number</label>
                  <input value={composePhone} onChange={(e) => setComposePhone(e.target.value)} inputMode="tel" placeholder="(404) 555-0100"
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none" style={{ background: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                </div>
              )}

              {composeChannel === 'platform' && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: theme.primary15, color: theme.text }}>
                  This goes to the VoiceAI Connect team. Their reply lands in your inbox.
                </p>
              )}

              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>Message</label>
                <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} rows={4} placeholder="Type your message..."
                  className="w-full resize-none rounded-xl px-3.5 py-2.5 text-sm focus:outline-none" style={{ background: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={() => setComposeOpen(false)} className="rounded-lg px-3.5 py-2 text-sm font-medium" style={{ border: `1px solid ${theme.border}`, color: theme.text }}>Cancel</button>
                <button onClick={startNew} disabled={!composeValid || composeSending} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40" style={{ background: theme.primary, color: theme.primaryText }}>
                  {composeSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] rounded-lg px-4 py-2 text-sm text-white flex items-center gap-2" style={{ background: '#dc2626' }}>
          {error}
          <button onClick={() => setError('')} aria-label="Dismiss"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}
