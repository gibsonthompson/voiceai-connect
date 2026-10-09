'use client';

// ============================================================================
// AGENCY INBOX, the unified iMessage-style messaging center.
// One conversation list across every channel the agency talks on:
//   - VoiceAI Connect (platform support thread), pinned on top
//   - each client (in-app two-way thread)
//   - prospects (in-app contact-form requests)
//   - carrier SMS on the agency demo number (follow-ups + replies)
// Compose can start a thread with a client, any phone number (SMS from the demo
// number), or VoiceAI Connect. Backend: GET /inbox, POST /inbox/send,
// POST /inbox/read on agencyRouter.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Loader2, ArrowLeft, Send, Plus, MessageSquare, Phone, X, Sparkles, Building2, Hash
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';

interface InboxMessage { id: string; sender: 'in' | 'out'; body: string; at: string; }
interface Conversation {
  key: string;
  type: 'platform' | 'client' | 'prospect' | 'sms';
  name: string | null;
  phone: string | null;
  clientId?: string;
  pinned?: boolean;
  target: string | null;
  messages: InboxMessage[];
  unread: number;
  lastAt: string | null;
  lastDirection: 'in' | 'out' | null;
  lastPreview: string;
  needsReply: boolean;
}
interface ClientRow { id: string; business_name: string | null; owner_name: string | null; owner_phone: string | null; }

function hexToRgba(hex: string, alpha: number): string {
  const c = (hex || '#10b981').replace('#', '');
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const r = parseInt(full.slice(0, 2), 16), g = parseInt(full.slice(2, 4), 16), b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(16,185,129,${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function formatPhone(phone: string): string {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  return phone;
}
function listTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr), now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - msgDay.getTime()) / 86400000);
  if (diff === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function msgTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function factDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function factMoney(cents: number): string {
  const whole = cents % 100 === 0;
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}/mo`;
}
function trialDaysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}
function prettyStatus(s: string | null): string {
  if (!s) return '';
  if (s === 'trialing') return 'Trial';
  if (s === 'active') return 'Active';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function AgencyInboxPage() {
  const { agency, loading: agencyLoading } = useAgency();
  const theme = useTheme();
  const primaryColor = theme.primary || '#10b981';
  const textMuted2 = (theme as any).textMuted4 || theme.textMuted;
  const hairline = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const glass = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', border: `1px solid ${hairline}` };

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const agencyId = agency?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  // Quick facts about the open thread's client or prospect, shown at the top of
  // the thread so the agency has context while replying.
  const [facts, setFacts] = useState<any>(null);

  // Compose
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<'root' | 'client' | 'number'>('root');
  const [composeNumber, setComposeNumber] = useState('');
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const token = () => localStorage.getItem('auth_token');

  const onThreadScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    stickRef.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < 80;
  };

  const fetchInbox = useCallback(async () => {
    if (!agencyId) return;
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/inbox`, { headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) {
        const d = await r.json();
        const convos: Conversation[] = d.conversations || [];
        setConversations(convos);
        setActive(cur => {
          if (!cur) return cur;
          const fresh = convos.find(c => c.key === cur.key);
          // Keep a virtual (not-yet-persisted) conversation until it appears.
          return fresh ? fresh : cur;
        });
      }
    } catch {} finally { setLoading(false); }
  }, [agencyId, backendUrl]);

  useEffect(() => { if (agencyId) fetchInbox(); }, [agencyId, fetchInbox]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => { fetchInbox(); }, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchInbox]);

  // Load quick facts when switching to a client or prospect thread. Keyed on
  // active.key so the 8s inbox poll (which replaces the active object) does not
  // refetch; a stale response for a thread we've left is dropped.
  useEffect(() => {
    if (!active || !agencyId || (active.type !== 'client' && active.type !== 'prospect')) { setFacts(null); return; }
    const target = active.type === 'client' ? (active.clientId || active.target) : active.target;
    if (!target) { setFacts(null); return; }
    const forKey = active.key;
    setFacts(null);
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${backendUrl}/api/agency/${agencyId}/inbox/facts?type=${active.type}&target=${encodeURIComponent(String(target))}`, { headers: { Authorization: `Bearer ${token()}` } });
        if (r.ok && !cancelled) { const d = await r.json(); if (!cancelled) setFacts(d.facts || null); }
      } catch {}
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.key, agencyId]);

  useEffect(() => { stickRef.current = true; }, [active?.key]);
  useEffect(() => { const el = scrollRef.current; if (el && stickRef.current) el.scrollTop = el.scrollHeight; }, [active]);

  const markRead = async (c: Conversation) => {
    if (c.type === 'sms' || !c.unread) return;
    try { await fetch(`${backendUrl}/api/agency/${agencyId}/inbox/read`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ type: c.type, target: c.type === 'client' ? (c.clientId || c.target) : c.target }) }); } catch {}
    setConversations(prev => prev.map(x => x.key === c.key ? { ...x, unread: 0 } : x));
  };

  const openConvo = (c: Conversation) => { setActive(c); setNewMessage(''); markRead(c); };

  const handleSend = async () => {
    if (!active || !newMessage.trim() || sending) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    const optimistic: InboxMessage = { id: `temp-${Date.now()}`, sender: 'out', body: text, at: new Date().toISOString() };
    setActive(prev => prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev);
    try {
      const target = active.type === 'client' ? (active.clientId || active.target) : active.target;
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/inbox/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ type: active.type, target, body: text }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) {
        setActive(prev => prev ? { ...prev, messages: prev.messages.filter(m => m.id !== optimistic.id) } : prev);
        setNewMessage(text);
      } else {
        await fetchInbox();
      }
    } catch {
      setActive(prev => prev ? { ...prev, messages: prev.messages.filter(m => m.id !== optimistic.id) } : prev);
      setNewMessage(text);
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const loadClients = useCallback(async () => {
    if (clientsLoaded || !agencyId) return;
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/clients`, { headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) { const d = await r.json(); setClients(d.clients || []); }
    } catch {} finally { setClientsLoaded(true); }
  }, [agencyId, backendUrl, clientsLoaded]);

  const openCompose = () => { setComposeMode('root'); setComposeNumber(''); setClientSearch(''); setShowCompose(true); };

  const startPlatform = () => {
    setShowCompose(false);
    const existing = conversations.find(c => c.type === 'platform');
    openConvo(existing || { key: 'platform', type: 'platform', name: 'VoiceAI Connect', phone: null, pinned: true, target: null, messages: [], unread: 0, lastAt: null, lastDirection: null, lastPreview: '', needsReply: false });
  };
  const startClient = (c: ClientRow) => {
    setShowCompose(false);
    const existing = conversations.find(x => x.key === `client-${c.id}`);
    openConvo(existing || { key: `client-${c.id}`, type: 'client', name: c.business_name || c.owner_name || 'Client', phone: c.owner_phone, clientId: c.id, target: c.id, messages: [], unread: 0, lastAt: null, lastDirection: null, lastPreview: '', needsReply: false });
  };
  const startNumber = () => {
    const digits = composeNumber.replace(/\D/g, '');
    if (digits.length < 10) return;
    setShowCompose(false);
    const key = `sms-${digits.slice(-10)}`;
    const existing = conversations.find(x => x.key === key);
    openConvo(existing || { key, type: 'sms', name: null, phone: composeNumber.trim(), target: composeNumber.trim(), messages: [], unread: 0, lastAt: null, lastDirection: null, lastPreview: '', needsReply: false });
  };

  const typeLabel = (t: Conversation['type']) => t === 'platform' ? 'VoiceAI Connect' : t === 'client' ? 'Client' : t === 'sms' ? 'Text' : 'Prospect';
  const convoTitle = (c: Conversation) => c.name || (c.phone ? formatPhone(c.phone) : 'Conversation');
  const avatarInitial = (c: Conversation) => c.type === 'platform' ? 'V' : (convoTitle(c).charAt(0).toUpperCase() || '?');

  const Avatar = ({ c, size }: { c: Conversation; size: number }) => {
    if (c.type === 'platform') {
      return (
        <div className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#ffffff', border: `1px solid ${hairline}` }}>
          <img src="/icon-192x192.png" alt="VoiceAI Connect" className="object-contain" style={{ width: Math.round(size * 0.68), height: Math.round(size * 0.68) }} />
        </div>
      );
    }
    return (
      <div className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold" style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.14 : 0.1), color: primaryColor }}>
        {c.type === 'sms' ? <Hash style={{ width: size * 0.5, height: size * 0.5 }} /> : avatarInitial(c)}
      </div>
    );
  };

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return convoTitle(c).toLowerCase().includes(q) || (c.phone || '').includes(q) || c.lastPreview.toLowerCase().includes(q);
  });
  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true;
    const q = clientSearch.toLowerCase();
    return (c.business_name || '').toLowerCase().includes(q) || (c.owner_name || '').toLowerCase().includes(q) || (c.owner_phone || '').includes(q);
  });

  if (agencyLoading || !agency) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: textMuted2 }} /></div>;

  const showThread = !!active;

  return (
    <div className="flex flex-col" style={{ backgroundColor: theme.bg, zoom: 1.2, height: 'calc((100vh - 64px) / 1.2)' }}>
      <div className="flex flex-1 min-h-0">

        {/* List */}
        <div className={`${showThread ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 lg:border-r min-h-0`} style={{ borderColor: hairline }}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Inbox</h1>
            <button onClick={openCompose} className="flex items-center justify-center h-9 w-9 rounded-full transition hover:opacity-90" style={{ backgroundColor: primaryColor, color: theme.primaryText || '#fff' }} title="New message"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: textMuted2 }} />
              <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none" style={{ ...glass, color: theme.text }} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: textMuted2 }} /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 px-6">
                <MessageSquare className="h-9 w-9 mx-auto mb-2" style={{ color: textMuted2, opacity: 0.4 }} />
                <p className="text-sm font-medium" style={{ color: theme.textMuted }}>No conversations yet</p>
                <p className="text-xs mt-1" style={{ color: textMuted2 }}>Start one with the + button</p>
              </div>
            ) : (
              filtered.map(c => (
                <button key={c.key} onClick={() => openConvo(c)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
                  style={{ backgroundColor: active?.key === c.key ? hexToRgba(primaryColor, theme.isDark ? 0.08 : 0.04) : c.pinned ? hexToRgba(primaryColor, theme.isDark ? 0.03 : 0.02) : 'transparent', borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}` }}>
                  <Avatar c={c} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: theme.text }}>
                        {convoTitle(c)}
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: hexToRgba(primaryColor, 0.12), color: primaryColor }}>{typeLabel(c.type)}</span>
                      </span>
                      <span className="text-[10px] flex-shrink-0" style={{ color: textMuted2 }}>{listTime(c.lastAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs truncate" style={{ color: (c.unread > 0 || c.needsReply) ? theme.text : textMuted2 }}>{c.lastDirection === 'out' ? 'You: ' : ''}{c.lastPreview || 'No messages yet'}</span>
                      {c.unread > 0 ? (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: primaryColor, color: theme.primaryText || '#fff' }}>{c.unread > 9 ? '9+' : c.unread}</span>
                      ) : c.needsReply ? (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                      ) : null}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={`${showThread ? 'flex' : 'hidden lg:flex'} flex-col flex-1 min-h-0`}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: textMuted2 }} />
                <p className="text-sm font-medium" style={{ color: theme.textMuted }}>Select a conversation</p>
                <p className="text-xs mt-1" style={{ color: textMuted2 }}>Clients, prospects, texts, and VoiceAI Connect, all here</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${hairline}` }}>
                <button onClick={() => setActive(null)} className="lg:hidden p-1" style={{ color: theme.textMuted }}><ArrowLeft className="h-5 w-5" /></button>
                <Avatar c={active} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{convoTitle(active)}</p>
                  <p className="text-[11px]" style={{ color: textMuted2 }}>{active.type === 'platform' ? 'Platform support' : active.type === 'client' ? 'Client' : active.type === 'sms' ? `Text, from your demo number` : 'Prospect'}{active.phone && active.type !== 'platform' ? ` · ${formatPhone(active.phone)}` : ''}</p>
                </div>
                {active.phone && active.type !== 'platform' && (
                  <a href={`tel:${active.phone}`} className="p-2 rounded-xl transition hover:opacity-80" style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.06), color: primaryColor }}><Phone className="h-4 w-4" /></a>
                )}
              </div>

              <div ref={scrollRef} onScroll={onThreadScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {facts && (active.type === 'client' || active.type === 'prospect') && (() => {
                  const rows: { label: string; value: string }[] = [];
                  if (active.type === 'client') {
                    if (facts.plan) rows.push({ label: 'Plan', value: facts.plan });
                    const statusVal = (facts.status === 'trialing' && facts.trialEndsAt) ? `Trial, ${trialDaysLeft(facts.trialEndsAt)}d left` : prettyStatus(facts.status);
                    if (statusVal) rows.push({ label: 'Status', value: statusVal });
                    if (facts.priceCents != null) rows.push({ label: 'Billing', value: factMoney(facts.priceCents) });
                    if (facts.aiPhone) rows.push({ label: 'AI number', value: formatPhone(facts.aiPhone) });
                    if (facts.ownerPhone) rows.push({ label: 'Owner', value: formatPhone(facts.ownerPhone) });
                    if (facts.memberSince) rows.push({ label: 'Client since', value: factDate(facts.memberSince) });
                    if (facts.callsThisMonth != null) rows.push({ label: 'Calls this mo.', value: facts.monthlyCallLimit != null ? `${facts.callsThisMonth} / ${facts.monthlyCallLimit}` : `${facts.callsThisMonth}` });
                    if (facts.lastCallAt) rows.push({ label: 'Last call', value: factDate(facts.lastCallAt) });
                  } else {
                    if (facts.contact) rows.push({ label: /@/.test(facts.contact) ? 'Email' : 'Phone', value: /@/.test(facts.contact) ? facts.contact : formatPhone(facts.contact) });
                    if (facts.status) rows.push({ label: 'Status', value: prettyStatus(facts.status) });
                    if (facts.createdAt) rows.push({ label: 'Requested', value: factDate(facts.createdAt) });
                  }
                  const hasMsg = active.type === 'prospect' && facts.firstMessage;
                  if (rows.length === 0 && !hasMsg) return null;
                  return (
                    <div className="rounded-2xl p-3.5 mb-1" style={{ ...glass }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: textMuted2 }}>{active.type === 'client' ? 'About this client' : 'About this prospect'}</span>
                        {active.type === 'client' && facts.isTest && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: hexToRgba(primaryColor, 0.12), color: primaryColor }}>Test</span>
                        )}
                      </div>
                      {rows.length > 0 && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {rows.map((r, i) => {
                            const lastOdd = i === rows.length - 1 && rows.length % 2 === 1;
                            return (
                              <div key={r.label} className={lastOdd ? 'col-span-2' : ''}>
                                <p className="text-[10px] uppercase tracking-wide" style={{ color: textMuted2 }}>{r.label}</p>
                                <p className="text-[13px] font-medium truncate" style={{ color: theme.text }}>{r.value}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {hasMsg && (
                        <div className={`${rows.length > 0 ? 'mt-2 pt-2' : ''}`} style={rows.length > 0 ? { borderTop: `1px solid ${hairline}` } : undefined}>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: textMuted2 }}>What they asked</p>
                          <p className="text-[12px] leading-relaxed" style={{ color: theme.textMuted }}>{facts.firstMessage}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {active.messages.length === 0 ? (
                  <div className="text-center py-12"><p className="text-xs" style={{ color: textMuted2 }}>No messages yet. Send the first one below.</p></div>
                ) : (
                  active.messages.map(m => {
                    const out = m.sender === 'out';
                    return (
                      <div key={m.id} className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[75%] sm:max-w-[65%]">
                          <div className="rounded-2xl px-3.5 py-2.5" style={{ backgroundColor: out ? primaryColor : theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', color: out ? (theme.primaryText || '#fff') : theme.text, borderBottomRightRadius: out ? 4 : 16, borderBottomLeftRadius: out ? 16 : 4 }}>
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.body}</p>
                          </div>
                          <div className={`mt-0.5 px-1 ${out ? 'text-right' : ''}`}><span className="text-[10px]" style={{ color: textMuted2 }}>{msgTime(m.at)}</span></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-3" style={{ borderTop: `1px solid ${hairline}` }}>
                <div className="flex items-end gap-2">
                  <textarea ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={active.type === 'sms' ? 'Send a text...' : `Message ${convoTitle(active)}...`} rows={1} className="flex-1 px-4 py-2.5 rounded-2xl text-sm resize-none focus:outline-none max-h-24" style={{ ...glass, color: theme.text }} />
                  <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0" style={{ backgroundColor: primaryColor, color: theme.primaryText || '#fff' }}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                </div>
                <p className="text-[10px] mt-1 text-center" style={{ color: textMuted2 }}>
                  {active.type === 'sms' ? 'Sent as a text from your demo number' : active.type === 'platform' ? 'Goes to VoiceAI Connect support' : 'Delivered in-app, the recipient is notified'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setShowCompose(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ backgroundColor: theme.isDark ? '#141414' : '#ffffff', border: `1px solid ${hairline}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: theme.text }}>{composeMode === 'client' ? 'Message a client' : composeMode === 'number' ? 'Text a number' : 'New message'}</h3>
              <button onClick={() => composeMode === 'root' ? setShowCompose(false) : setComposeMode('root')} style={{ color: theme.textMuted }}>{composeMode === 'root' ? <X className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}</button>
            </div>

            {composeMode === 'root' && (
              <div className="space-y-2">
                <button onClick={startPlatform} className="w-full flex items-center gap-3 p-2.5 rounded-xl transition hover:opacity-90" style={{ border: `1px solid ${hairline}` }}>
                  <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#ffffff', border: `1px solid ${hairline}` }}><img src="/icon-192x192.png" alt="VoiceAI Connect" className="object-contain" style={{ width: 24, height: 24 }} /></div>
                  <div className="text-left"><p className="text-sm font-medium" style={{ color: theme.text }}>VoiceAI Connect</p><p className="text-[10px]" style={{ color: textMuted2 }}>Message platform support</p></div>
                </button>
                <button onClick={() => { setComposeMode('client'); loadClients(); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl transition hover:opacity-90" style={{ border: `1px solid ${hairline}` }}>
                  <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(primaryColor, 0.12), color: primaryColor }}><Building2 className="h-4 w-4" /></div>
                  <div className="text-left"><p className="text-sm font-medium" style={{ color: theme.text }}>A client</p><p className="text-[10px]" style={{ color: textMuted2 }}>Message one of your clients in-app</p></div>
                </button>
                <button onClick={() => setComposeMode('number')} className="w-full flex items-center gap-3 p-2.5 rounded-xl transition hover:opacity-90" style={{ border: `1px solid ${hairline}` }}>
                  <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(primaryColor, 0.12), color: primaryColor }}><Hash className="h-4 w-4" /></div>
                  <div className="text-left"><p className="text-sm font-medium" style={{ color: theme.text }}>A phone number</p><p className="text-[10px]" style={{ color: textMuted2 }}>Text any number from your demo line</p></div>
                </button>
              </div>
            )}

            {composeMode === 'client' && (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: textMuted2 }} />
                  <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients" className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none" style={{ ...glass, color: theme.text }} />
                </div>
                <div className="max-h-64 overflow-y-auto -mx-1">
                  {!clientsLoaded ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-4 w-4 animate-spin" style={{ color: textMuted2 }} /></div>
                  ) : filteredClients.length === 0 ? (
                    <p className="text-xs text-center py-6" style={{ color: textMuted2 }}>No clients found</p>
                  ) : filteredClients.map(c => (
                    <button key={c.id} onClick={() => startClient(c)} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition" onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold" style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}>{(c.business_name || c.owner_name || '?').charAt(0).toUpperCase()}</div>
                      <div className="min-w-0"><p className="text-sm truncate" style={{ color: theme.text }}>{c.business_name || c.owner_name}</p>{c.owner_phone && <p className="text-[10px]" style={{ color: textMuted2 }}>{formatPhone(c.owner_phone)}</p>}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {composeMode === 'number' && (
              <div>
                <label className="text-[10px] uppercase tracking-wide" style={{ color: textMuted2 }}>Phone number</label>
                <input value={composeNumber} onChange={e => setComposeNumber(e.target.value)} placeholder="+1 555 123 4567" className="w-full mt-1 mb-4 px-3 py-2 rounded-xl text-sm focus:outline-none" style={{ ...glass, color: theme.text }} />
                <button onClick={startNumber} disabled={composeNumber.replace(/\D/g, '').length < 10} className="w-full py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50" style={{ backgroundColor: primaryColor, color: theme.primaryText || '#fff' }}>Open conversation</button>
                <p className="text-[10px] mt-2 text-center" style={{ color: textMuted2 }}>Texts go out from your demo number.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}