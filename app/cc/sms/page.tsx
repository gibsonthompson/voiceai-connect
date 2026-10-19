'use client';

// ============================================================================
// /cc/sms - the call-center TEXTS inbox.
//
// Two-way SMS across every business the call center serves, in one place. The
// AI line (the client's provisioned number) is the business's text line: the AI
// and agents text customers from it, and customer replies land here. A manager
// sees every business; an agent sees only the businesses assigned to them
// (scoped server-side). Two-pane: conversation list on the left, the thread and
// composer on the right (full-screen thread on mobile).
//
// Data: /api/agency/:id/cc/sms/* (list, thread, send, read, archive). Outbound
// goes through the same shared send path the reseller dashboard uses, so the
// customer always sees the business's number. Theme-aware (white-labels).
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare, Search, Loader2, Building2, Send, ChevronLeft, Archive,
  ArchiveRestore, CircleDot, Inbox as InboxIcon, AlertCircle, Phone,
} from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';
import { CustomSelect, type DropdownUI } from '@/components/ui/custom-select';

interface Row {
  id: string;
  clientId: string;
  businessName: string;
  caller: string | null;
  callerPhone: string | null;
  lastPreview: string | null;
  lastAt: string | null;
  lastDirection: string | null;
  unread: number;
  archived: boolean;
}
interface Msg {
  id: string;
  direction: 'inbound' | 'outbound' | string;
  content: string;
  status: string;
  error: string | null;
  at: string;
}
interface ActiveConv {
  id: string;
  clientId: string;
  businessName: string;
  caller: string | null;
  callerPhone: string | null;
  archived: boolean;
}
interface Biz { clientId: string; businessName: string; }

const TABS = [
  { v: 'inbox', label: 'Inbox' },
  { v: 'archived', label: 'Archived' },
];

function fmtPhone(p: string | null): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}
function fmtWhen(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}
function fmtMsgTime(iso: string): string {
  try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
}

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => { try { return localStorage.getItem('auth_token'); } catch { return null; } };

export default function CallCenterTexts() {
  const { agency } = useAgency();
  const theme = useTheme();
  const agencyId = agency?.id || '';

  const [rows, setRows] = useState<Row[]>([]);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const [tab, setTab] = useState<'inbox' | 'archived'>('inbox');
  const [business, setBusiness] = useState('');
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [active, setActive] = useState<ActiveConv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { const chk = () => setIsMobile(window.innerWidth < 768); chk(); window.addEventListener('resize', chk); return () => window.removeEventListener('resize', chk); }, []);
  useEffect(() => { const t = setTimeout(() => setQDebounced(q.trim()), 350); return () => clearTimeout(t); }, [q]);

  // ---- list -----------------------------------------------------------------
  const reqRef = useRef(0);
  const loadList = useCallback(async (quiet = false) => {
    if (!agencyId) return;
    const my = ++reqRef.current;
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams({ archived: tab === 'archived' ? 'true' : 'false', limit: '50' });
      if (qDebounced) params.set('q', qDebounced);
      if (business) params.set('business', business);
      const r = await fetch(`${API()}/api/agency/${agencyId}/cc/sms/conversations?${params.toString()}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (my !== reqRef.current) return;
      if (r.ok) {
        const d = await r.json();
        if (d.success) {
          setRows(Array.isArray(d.rows) ? d.rows : []);
          setTotal(d.total || 0);
          setUnreadTotal(d.unreadTotal || 0);
          if (Array.isArray(d.businesses)) setBusinesses(d.businesses);
          setListError(null);
        }
      } else {
        setListError('Could not load texts.');
      }
    } catch {
      if (my === reqRef.current) setListError('Could not load texts.');
    } finally {
      if (my === reqRef.current && !quiet) setLoading(false);
    }
  }, [agencyId, tab, business, qDebounced]);

  useEffect(() => { loadList(); }, [loadList]);
  // Light poll so inbound replies surface without a manual refresh.
  useEffect(() => {
    if (!agencyId) return;
    const iv = setInterval(() => loadList(true), 15000);
    return () => clearInterval(iv);
  }, [agencyId, loadList]);

  // ---- thread ---------------------------------------------------------------
  const markRead = useCallback(async (id: string) => {
    try {
      await fetch(`${API()}/api/agency/${agencyId}/cc/sms/conversations/${id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN()}` } });
      setRows((list) => list.map((x) => (x.id === id ? { ...x, unread: 0 } : x)));
    } catch { /* non-fatal */ }
  }, [agencyId]);

  const loadThread = useCallback(async (id: string, quiet = false) => {
    if (!agencyId) return;
    if (!quiet) { setThreadLoading(true); setThreadError(null); }
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/cc/sms/conversations/${id}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) {
        const d = await r.json();
        if (d.success) {
          setActive(d.conversation);
          setMessages(Array.isArray(d.messages) ? d.messages : []);
          setThreadError(null);
        } else if (!quiet) setThreadError('Could not load this conversation.');
      } else if (!quiet) setThreadError('Could not load this conversation.');
    } catch {
      if (!quiet) setThreadError('Could not load this conversation.');
    } finally {
      if (!quiet) setThreadLoading(false);
    }
  }, [agencyId]);

  // Open a conversation: load it and clear its unread.
  const openConversation = useCallback((id: string) => {
    setSelectedId(id);
    setDraft('');
    loadThread(id);
    markRead(id);
  }, [loadThread, markRead]);

  // Deep-link: /cc/sms?c=<conversationId> opens that thread (from the new-text
  // toast in the shell). Runs once the agency is ready.
  useEffect(() => {
    if (!agencyId) return;
    try {
      const c = new URLSearchParams(window.location.search).get('c');
      if (c) openConversation(c);
    } catch { /* no-op */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId]);

  // Poll the open thread so a customer's reply appears while it's on screen.
  useEffect(() => {
    if (!selectedId) return;
    const iv = setInterval(() => loadThread(selectedId, true), 10000);
    return () => clearInterval(iv);
  }, [selectedId, loadThread]);

  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, selectedId]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/cc/sms/conversations/${selectedId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ message: text }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) { setThreadError(d.error || 'Could not send the text.'); return; }
      setDraft('');
      if (d.message) setMessages((m) => [...m, d.message]);
      loadThread(selectedId, true);
      loadList(true);
    } catch {
      setThreadError('Could not send the text.');
    } finally {
      setSending(false);
    }
  };

  const toggleArchive = async () => {
    if (!active || archiving) return;
    setArchiving(true);
    const next = !active.archived;
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/cc/sms/conversations/${active.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ archived: next }),
      });
      if (r.ok) {
        setActive((a) => (a ? { ...a, archived: next } : a));
        // The row leaves the current tab; drop the selection and refresh.
        setSelectedId(null); setActive(null); setMessages([]);
        loadList(true);
      }
    } catch { /* non-fatal */ } finally { setArchiving(false); }
  };

  const selStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const ddUI: DropdownUI = { inputStyle: selStyle, text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark };
  const titleOf = (r: { caller: string | null; callerPhone: string | null }) => r.caller || fmtPhone(r.callerPhone) || 'Unknown number';

  // ---- conversation list pane ----------------------------------------------
  const listPane = (
    <div className="flex flex-col min-h-0 h-full">
      {/* Tabs + filters */}
      <div className="space-y-3 mb-3">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: theme.hover }}>
          {TABS.map((t) => {
            const on = tab === t.v;
            return (
              <button key={t.v} onClick={() => { setTab(t.v as any); setSelectedId(null); setActive(null); }}
                className="flex-1 px-4 py-1.5 rounded-lg text-sm font-medium transition"
                style={on ? { backgroundColor: theme.card, color: theme.text, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: theme.textMuted }}>
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textSubtle }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, number, or text"
            className="w-full rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none" style={selStyle} />
        </div>
        <CustomSelect value={business} onChange={setBusiness}
          options={[{ value: '', label: 'All businesses' }, ...businesses.map((b) => ({ value: b.clientId, label: b.businessName }))]}
          ui={ddUI} />
      </div>

      <p className="text-[12px] mb-2" style={{ color: theme.textMuted }}>
        {loading ? 'Loading...' : `${total.toLocaleString()} conversation${total === 1 ? '' : 's'}`}
      </p>

      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 space-y-2">
        {loading && rows.length === 0 ? (
          <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: theme.textMuted }}>
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : listError ? (
          <div className="rounded-xl px-4 py-3 text-[13px] flex items-center gap-2" style={{ backgroundColor: `${theme.error}12`, border: `1px solid ${theme.error}40`, color: theme.error }}>
            <AlertCircle className="h-4 w-4" /> {listError}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl py-12 flex flex-col items-center justify-center text-center" style={{ border: `1px dashed ${theme.border}` }}>
            <InboxIcon className="h-8 w-8 mb-2.5" style={{ color: theme.textSubtle }} />
            <p className="text-sm font-medium" style={{ color: theme.text }}>{tab === 'archived' ? 'Nothing archived' : 'No texts yet'}</p>
            <p className="text-[13px] mt-1 max-w-[220px]" style={{ color: theme.textMuted }}>{tab === 'archived' ? 'Archived conversations show up here.' : 'Texts to and from your businesses show up here.'}</p>
          </div>
        ) : (
          rows.map((r) => {
            const on = selectedId === r.id;
            const unread = r.unread > 0;
            return (
              <button key={r.id} onClick={() => openConversation(r.id)}
                className="w-full text-left rounded-xl p-3 transition"
                style={on ? { backgroundColor: theme.primary15, border: `1px solid ${theme.primary}55` } : { backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-semibold truncate" style={{ color: theme.text }}>{titleOf(r)}</p>
                  <span className="text-[11px] flex-shrink-0 flex items-center gap-1.5" style={{ color: unread ? theme.primary : theme.textSubtle }}>
                    {unread && <CircleDot className="h-3 w-3" />}{fmtWhen(r.lastAt)}
                  </span>
                </div>
                <p className="text-[11.5px] truncate flex items-center gap-1 mt-0.5" style={{ color: theme.textMuted }}>
                  <Building2 className="h-3 w-3 flex-shrink-0" /> {r.businessName}
                </p>
                {r.lastPreview && (
                  <p className="text-[12.5px] truncate mt-1" style={{ color: unread ? theme.text : theme.textMuted, fontWeight: unread ? 600 : 400 }}>
                    {r.lastDirection === 'outbound' ? 'You: ' : ''}{r.lastPreview}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ---- thread pane ----------------------------------------------------------
  const threadPane = (
    <div className="flex flex-col min-h-0 h-full rounded-2xl" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      {!selectedId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <MessageSquare className="h-9 w-9 mb-3" style={{ color: theme.textSubtle }} />
          <p className="text-sm font-medium" style={{ color: theme.text }}>Pick a conversation</p>
          <p className="text-[13px] mt-1 max-w-[260px]" style={{ color: theme.textMuted }}>Select a text thread on the left to read it and reply.</p>
        </div>
      ) : (
        <>
          {/* Thread header */}
          <div className="flex items-center gap-3 p-4" style={{ borderBottom: `1px solid ${theme.borderSubtle}` }}>
            {isMobile && (
              <button onClick={() => { setSelectedId(null); setActive(null); }} className="inline-flex items-center justify-center rounded-lg h-9 w-9 flex-shrink-0" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{active ? titleOf(active) : ''}</p>
              <p className="text-[12px] truncate flex items-center gap-2" style={{ color: theme.textMuted }}>
                <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {active?.businessName}</span>
                {active?.callerPhone && <a href={`tel:${active.callerPhone}`} className="inline-flex items-center gap-1" style={{ color: theme.primary }}><Phone className="h-3 w-3" /> {fmtPhone(active.callerPhone)}</a>}
              </p>
            </div>
            {active && (
              <button onClick={toggleArchive} disabled={archiving} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium flex-shrink-0 disabled:opacity-50" style={{ backgroundColor: theme.hover, color: theme.textMuted }} title={active.archived ? 'Unarchive' : 'Archive'}>
                {archiving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : active.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{active.archived ? 'Unarchive' : 'Archive'}</span>
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5">
            {threadLoading && messages.length === 0 ? (
              <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
            ) : threadError && messages.length === 0 ? (
              <div className="rounded-xl px-4 py-3 text-[13px] flex items-center gap-2" style={{ backgroundColor: `${theme.error}12`, border: `1px solid ${theme.error}40`, color: theme.error }}><AlertCircle className="h-4 w-4" /> {threadError}</div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-[13px]" style={{ color: theme.textMuted }}>No messages in this thread yet.</div>
            ) : (
              messages.map((m) => {
                const out = m.direction === 'outbound';
                const failed = m.status === 'failed';
                return (
                  <div key={m.id} className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[78%]">
                      <div className="rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug whitespace-pre-wrap break-words"
                        style={out
                          ? { backgroundColor: failed ? theme.error : theme.primary, color: failed ? '#fff' : theme.primaryText, borderBottomRightRadius: 4 }
                          : { backgroundColor: theme.hover, color: theme.text, borderBottomLeftRadius: 4 }}>
                        {m.content}
                      </div>
                      <p className="text-[10.5px] mt-1 px-1" style={{ color: theme.textSubtle, textAlign: out ? 'right' : 'left' }}>
                        {fmtMsgTime(m.at)}{out && failed ? ' · Failed to send' : out && m.status === 'delivered' ? ' · Delivered' : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={threadEndRef} />
          </div>

          {/* Composer */}
          <div className="p-3" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
            {threadError && messages.length > 0 && (
              <p className="text-[12px] mb-2 flex items-center gap-1.5" style={{ color: theme.error }}><AlertCircle className="h-3.5 w-3.5" /> {threadError}</p>
            )}
            <div className="flex items-end gap-2">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1} maxLength={1600} placeholder="Write a reply..."
                className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none resize-none max-h-32" style={selStyle} />
              <button onClick={send} disabled={sending || !draft.trim()} className="inline-flex items-center justify-center rounded-xl h-[42px] w-[42px] flex-shrink-0 disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: theme.textSubtle }}>Sends from this business's number. Enter to send, Shift+Enter for a new line.</p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen flex flex-col" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
            <MessageSquare className="h-5 w-5" style={{ color: theme.primary }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Texts</h1>
            <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Two-way texts across your businesses, sent from each business's own line.</p>
          </div>
        </div>
        {unreadTotal > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
            <CircleDot className="h-3.5 w-3.5" /> {unreadTotal} unread
          </span>
        )}
      </div>

      {/* Two-pane on desktop; one pane at a time on mobile. */}
      <div className="flex-1 min-h-0">
        {isMobile ? (
          <div className="h-[calc(100vh-180px)]">{selectedId ? threadPane : listPane}</div>
        ) : (
          <div className="grid grid-cols-[minmax(300px,380px)_1fr] gap-5 h-[calc(100vh-180px)]">
            {listPane}
            {threadPane}
          </div>
        )}
      </div>
    </div>
  );
}
