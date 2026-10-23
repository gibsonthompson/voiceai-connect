'use client';

// ============================================================================
// ADMIN INBOX, one unified iMessage-style inbox for all platform comms.
// One conversation per agency: the in-app support thread, SMS, feedback and
// help-bot chats are ALL merged into a single thread (no tabs) so nothing is
// split off and context stays together. Plus the public FAQ-bot prospect chats
// as read-only conversations. Each conversation can be marked as a support item
// and resolved; resolved persists until a newer message arrives.
// Backend: GET /api/admin/inbox, POST /inbox/send, /inbox/read,
// /inbox/mark-support, /inbox/resolve, /inbox/reopen.
// ============================================================================

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import {
  MessageSquare, Send, ArrowLeft, Loader2, RefreshCw, Phone, Building2, Bot,
  ExternalLink, Mail, LifeBuoy, CheckCircle2, RotateCcw, ChevronDown,
} from 'lucide-react';

type SupportStatus = 'none' | 'support' | 'resolved';
interface InboxMessage { id: string; sender: 'in' | 'out'; body: string; at: string; kind: 'inapp' | 'sms' | 'faq' | 'feedback' | 'help'; source?: string | null; }

// A clear, unambiguous label for where each bubble came from, so the admin can
// tell an automated help-bot answer from the agency's own message from their own
// reply at a glance. Returns null for the admin's own in-app replies (obvious).
function msgLabel(m: InboxMessage): { text: string; color: string } | null {
  if (m.kind === 'sms') return { text: 'Text', color: '#0f766e' };
  if (m.kind === 'help') {
    return m.sender === 'in'
      ? { text: 'Via help bot', color: '#4338ca' }          // the agency asked the bot
      : { text: 'Help bot answer', color: '#4338ca' };      // the BOT answered, not you
  }
  if (m.kind === 'feedback') return { text: 'Feedback', color: '#92400e' };
  if (m.kind === 'inapp' && m.sender === 'in') {
    if (m.source === 'feedback') return { text: 'Feedback', color: '#92400e' };
    if (m.source === 'widget' || m.source === 'support_chat') return { text: 'Support request', color: '#92400e' };
    if (m.source === 'inbox') return { text: 'Direct message', color: '#334155' };
  }
  return null; // admin's own reply, or a plain message
}
interface Conversation {
  key: string;
  type: 'agency' | 'faq';
  agencyId: string | null;
  planType?: string | null;
  name: string;
  phone: string | null;
  contactPhone?: string | null;
  email?: string | null;
  messages: InboxMessage[];
  unread: number;
  lastAt: string | null;
  lastDirection: 'in' | 'out' | null;
  lastPreview: string;
  lastInboundKind?: 'inapp' | 'sms' | 'faq' | 'feedback' | 'help';
  needsReply: boolean;
  readOnly?: boolean;
  escalated?: boolean;
  supportStatus?: SupportStatus;
  faqOrigin?: { userType: string | null; source: string | null; agencyName: string | null; tag: string; visitorName?: string | null; visitorContact?: string | null } | null;
  facts?: AgencyFacts | null;
}
interface AgencyFacts {
  plan: string | null; subscriptionStatus: string | null; status: string | null;
  trialEndsAt: string | null; currentPeriodEnd: string | null; createdAt: string | null;
  clientCount: number; country: string | null; email: string | null; phone: string | null;
  names: string[]; minutePassThrough: boolean; minuteRateCents: number | null;
  usageBillingEnabled: boolean; billMinutesDuringTrial: boolean;
}

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''}`,
});

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
}
function fmtDate(iso: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; }
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime(); if (isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}
function titleCase(s: string | null): string {
  if (!s) return '';
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Agency context panel for the admin inbox. Everything worth knowing before you
// reply to an agency: plan, where they are in their trial, account status, how
// many clients they run, how long they have been on the platform, and their
// per-minute billing setup. Collapsible, open by default.
function AgencyPanel({ facts }: { facts: AgencyFacts }) {
  const [open, setOpen] = useState(true);
  const inTrial = facts.subscriptionStatus === 'trial' || facts.subscriptionStatus === 'trialing';
  const trialDays = inTrial ? daysUntil(facts.trialEndsAt) : null;
  const rate = facts.minuteRateCents != null ? `$${(facts.minuteRateCents / 100).toFixed(2)}/min` : null;
  const akas = (facts.names || []).slice(1);

  const Chip = ({ text, bg, color }: { text: string; bg: string; color: string }) => (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: bg, color }}>{text}</span>
  );
  const Fact = ({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) => (
    <div className={wide ? 'col-span-2 sm:col-span-3' : ''}>
      <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--a-dim)' }}>{label}</div>
      <div className="text-[11px]" style={{ color: 'var(--a-ink)' }}>{value || '—'}</div>
    </div>
  );

  return (
    <div className="border-b shrink-0" style={{ borderColor: 'var(--a-line)', background: 'white' }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-4 py-2 text-left hover:bg-black/[0.02] transition-colors">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {facts.plan && <Chip text={titleCase(facts.plan)} bg="#f1f5f9" color="#334155" />}
          {inTrial ? (
            <Chip text={trialDays != null ? `Trial · ${trialDays}d left` : 'Trial'} bg="var(--a-amber-soft)" color="var(--a-amber)" />
          ) : facts.subscriptionStatus ? (
            <Chip text={titleCase(facts.subscriptionStatus)} bg="var(--a-em-soft)" color="var(--a-em-deep)" />
          ) : null}
          <span className="text-[11px]" style={{ color: 'var(--a-dim)' }}>{facts.clientCount} client{facts.clientCount === 1 ? '' : 's'}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--a-dim)' }} />
      </button>
      {open && (
        <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
          <Fact label="Plan" value={titleCase(facts.plan)} />
          <Fact label="Account status" value={titleCase(facts.status)} />
          <Fact label="Subscription" value={titleCase(facts.subscriptionStatus)} />
          <Fact label="Trial ends" value={facts.trialEndsAt ? `${fmtDate(facts.trialEndsAt)}${trialDays != null ? ` (${trialDays}d)` : ''}` : null} />
          <Fact label="Renews" value={fmtDate(facts.currentPeriodEnd)} />
          <Fact label="On platform since" value={fmtDate(facts.createdAt)} />
          <Fact label="Clients" value={String(facts.clientCount)} />
          <Fact label="Country" value={facts.country} />
          <Fact label="Per-minute billing" value={facts.minutePassThrough ? `On${rate ? ` · ${rate}` : ''}${facts.billMinutesDuringTrial ? ' · during trial' : ''}` : 'Off'} />
          {akas.length > 0 && <Fact label="Also known as" value={akas.join(', ')} wide />}
          <Fact label="Email" value={facts.email} />
          <Fact label="Phone" value={facts.phone} />
        </div>
      )}
    </div>
  );
}

export default function AdminInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  // Per-conversation drafts: clicking out of a thread to answer another must
  // not lose what you typed. Each thread's unsent text is kept by its key, and
  // mirrored to localStorage so a refresh, or opening the Account tab and
  // coming back, keeps it too.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  // One inbox, filterable. 'all' shows everything; the rest narrow it so the
  // old separate Support / FAQ-chats / Replies views are just views of this list.
  const [filter, setFilter] = useState<'all' | 'unread' | 'support' | 'bot'>('all');
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef(true);           // is the reader near the bottom?
  const prevKeyRef = useRef<string | null>(null);
  const prevCountRef = useRef(0);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);

  const currentDraft = selected ? (drafts[selected.key] ?? '') : '';
  const setDraft = (key: string, val: string) => setDrafts((prev) => ({ ...prev, [key]: val }));
  const clearDraft = (key: string) => setDrafts((prev) => { const next = { ...prev }; delete next[key]; return next; });

  // Hydrate drafts once on mount, then persist on every change. Wrapped because
  // localStorage can throw (private mode) and must never break the inbox.
  useEffect(() => {
    try { const raw = localStorage.getItem('admin_inbox_drafts'); if (raw) setDrafts(JSON.parse(raw) || {}); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('admin_inbox_drafts', JSON.stringify(drafts)); } catch {}
  }, [drafts]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl()}/api/admin/inbox`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const convos: Conversation[] = data.conversations || [];
      setConversations(convos);
      setSelected((cur) => (cur ? convos.find((c) => c.key === cur.key) || cur : cur));
      // Drop drafts for conversations that no longer exist, so storage stays
      // tidy. Guarded by a non-empty load so a transient empty/failed fetch
      // never wipes a draft you are in the middle of writing.
      if (convos.length) {
        setDrafts((prev) => {
          const keys = new Set(convos.map((c) => c.key));
          let changed = false; const next: Record<string, string> = {};
          for (const k in prev) { if (keys.has(k)) next[k] = prev[k]; else changed = true; }
          return changed ? next : prev;
        });
      }
      setError('');
    } catch {
      setError('Could not load the inbox.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  // Scroll behavior. The list polls every 15s and setSelected hands back a fresh
  // object each time, so keying the scroll effect off `selected` (as before) made
  // the thread jump to the bottom on every poll, even mid-read. Instead: jump to
  // the bottom only when you OPEN a different thread (key change), or when a NEW
  // message actually arrives AND you were already near the bottom. A poll that
  // changes nothing no longer scrolls.
  const onThreadScroll = () => {
    const el = threadScrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };
  useEffect(() => {
    const el = threadScrollRef.current;
    const key = selected?.key ?? null;
    const count = selected?.messages.length ?? 0;
    const keyChanged = key !== prevKeyRef.current;
    const grew = count > prevCountRef.current;
    if (el && selected) {
      if (keyChanged) { el.scrollTop = el.scrollHeight; stickRef.current = true; } // opened a thread
      else if (grew && stickRef.current) { threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }
    }
    prevKeyRef.current = key;
    prevCountRef.current = count;
  }, [selected?.key, selected?.messages.length]);
  // Auto-grow the reply box as you type so the whole message stays visible.
  // The composer is shrink-0 and the thread above is flex-1, so as the box
  // grows the conversation gives up height (and scrolls) to make room. Caps at
  // ~45vh, then the textarea scrolls internally instead of eating the panel.
  useEffect(() => {
    const el = replyRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [currentDraft, selected?.key]);

  const markRead = async (c: Conversation) => {
    if (c.type !== 'agency' || !c.agencyId || !c.unread) return;
    try {
      await fetch(`${backendUrl()}/api/admin/inbox/read`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId: c.agencyId }),
      });
    } catch {}
    setConversations((prev) => prev.map((x) => (x.key === c.key ? { ...x, unread: 0 } : x)));
  };

  // Select a thread. The draft is NOT cleared, each thread keeps its own unsent
  // text, so switching away and back restores exactly what you had typed.
  const open = (c: Conversation) => { setSelected(c); markRead(c); };

  // Support / resolved: mark a thread as a support item, resolve it, or reopen
  // it. Optimistic so the badge flips immediately; the backend persists it.
  const setThreadStatus = async (c: Conversation, action: 'mark-support' | 'resolve' | 'reopen') => {
    const next: SupportStatus = action === 'resolve' ? 'resolved' : 'support';
    setConversations((prev) => prev.map((x) => (x.key === c.key ? { ...x, supportStatus: next } : x)));
    setSelected((prev) => (prev && prev.key === c.key ? { ...prev, supportStatus: next } : prev));
    try {
      await fetch(`${backendUrl()}/api/admin/inbox/${action}`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadKey: c.key }),
      });
    } catch { setError('Could not update status.'); }
  };

  const send = async () => {
    if (!selected || selected.type !== 'agency' || !selected.agencyId || sending) return;
    const key = selected.key;
    const text = (drafts[key] || '').trim();
    if (!text) return;
    setSending(true);
    const optimistic: InboxMessage = { id: `tmp-${Date.now()}`, sender: 'out', body: text, at: new Date().toISOString(), kind: selected.lastInboundKind === 'sms' ? 'sms' : 'inapp' };
    setSelected((prev) => (prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev));
    try {
      const res = await fetch(`${backendUrl()}/api/admin/inbox/send`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId: selected.agencyId, channel: selected.lastInboundKind === 'sms' ? 'sms' : 'inapp', body: text }),
      });
      if (!res.ok) throw new Error('send failed');
      clearDraft(key);
      await load();
    } catch {
      setSelected((prev) => (prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimistic.id) } : prev));
      setError('Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce((n, c) => n + (c.unread || 0), 0);
  const shown = conversations.filter((c) => {
    if (filter === 'unread') return c.unread > 0 || c.needsReply;
    if (filter === 'support') return c.supportStatus === 'support';
    if (filter === 'bot') return c.type === 'faq' || c.lastInboundKind === 'help';
    return true;
  });

  const TypeTag = ({ c }: { c: Conversation }) => (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
      style={c.type === 'faq'
        ? { background: '#eef2ff', color: '#4338ca' }
        : { background: 'var(--a-em-soft, #e9fefb)', color: 'var(--a-em-deep, #0a5a54)' }}>
      {c.type === 'faq' ? `${c.faqOrigin?.tag || 'Help bot'}${c.escalated ? ', escalated' : ''}` : 'Agency'}
    </span>
  );

  // Small status chip for the list + header.
  const StatusChip = ({ status }: { status?: SupportStatus }) => {
    // Only an open support item surfaces a chip. Once resolved (or never
    // flagged) the row is clean, no "Resolved" badge lingering on the thread.
    if (status === 'support') return (<span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 inline-flex items-center gap-0.5" style={{ background: '#FBF0D6', color: 'var(--a-amber, #92400e)' }}><LifeBuoy className="h-2.5 w-2.5" />Support</span>);
    return null;
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden" style={{ color: 'var(--a-ink)' }}>
      {/* Conversation list */}
      <aside className={`${selected ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 shrink-0 flex-col border-r`} style={{ borderColor: 'var(--a-line)', background: 'white' }}>
        <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: 'var(--a-line)' }}>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" style={{ color: 'var(--a-em-deep)' }} />
            <h1 className="text-sm font-semibold">Inbox</h1>
            {totalUnread > 0 && (<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--a-em)', color: 'var(--a-em-ink)' }}>{totalUnread}</span>)}
          </div>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-black/5" aria-label="Refresh"><RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--a-dim)' }} /></button>
        </div>

        {/* Filter chips: the whole inbox in one place, narrowed on demand. */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b overflow-x-auto" style={{ borderColor: 'var(--a-line)' }}>
          {([['all', 'All'], ['unread', 'Needs reply'], ['support', 'Support'], ['bot', 'Bot chats']] as const).map(([k, label]) => {
            const on = filter === k;
            return (
              <button key={k} onClick={() => setFilter(k)} className="text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
                style={on ? { background: 'var(--a-em)', color: 'var(--a-em-ink)' } : { background: 'var(--a-bg)', color: 'var(--a-muted)', border: '1px solid var(--a-line)' }}>
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--a-dim)' }} /></div>
          ) : shown.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm" style={{ color: 'var(--a-dim)' }}>{filter === 'all' ? 'No conversations yet. Agency messages (in-app + SMS) and help-bot chats land here.' : 'Nothing matches this filter.'}</div>
          ) : (
            shown.map((c) => (
              <button key={c.key} onClick={() => open(c)} className="w-full text-left px-4 py-3 border-b transition-colors hover:bg-black/[0.02]"
                style={{ borderColor: 'var(--a-line)', background: selected?.key === c.key ? 'var(--a-em-soft)' : 'transparent' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-sm truncate ${c.unread > 0 ? 'font-semibold' : 'font-medium'}`}>{c.name}</span>
                    <TypeTag c={c} />
                    {c.type === 'agency' && c.planType && (<span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 capitalize" style={{ background: '#f1f5f9', color: '#334155' }}>{c.planType}</span>)}
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--a-dim)' }}>{fmtTime(c.lastAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs truncate" style={{ color: (c.unread > 0 || c.needsReply) ? 'var(--a-ink)' : 'var(--a-dim)' }}>
                    {c.lastDirection === 'out' ? 'You: ' : ''}{c.lastPreview}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusChip status={c.supportStatus} />
                    {c.unread > 0 ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ background: 'var(--a-em)', color: 'var(--a-em-ink)' }}>{c.unread > 99 ? '99+' : c.unread}</span>
                    ) : c.needsReply ? (
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--a-em)' }} />
                    ) : null}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Thread */}
      <main className={`${selected ? 'flex' : 'hidden sm:flex'} flex-1 flex-col min-w-0`} style={{ background: 'var(--a-em-soft, #f8f8f6)' }}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6" style={{ color: 'var(--a-dim)' }}>
            <MessageSquare className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">Select a conversation to read and reply.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0" style={{ borderColor: 'var(--a-line)', background: 'white' }}>
              <button onClick={() => setSelected(null)} className="sm:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5" aria-label="Back"><ArrowLeft className="h-4 w-4" style={{ color: 'var(--a-dim)' }} /></button>
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--a-em-soft, #e9fefb)', color: 'var(--a-em-deep, #0a5a54)' }}>
                {selected.type === 'faq' ? <Bot className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate flex items-center gap-1.5">{selected.name}<TypeTag c={selected} /><StatusChip status={selected.supportStatus} /></div>
                <div className="text-[11px] flex items-center gap-x-3 gap-y-0.5 flex-wrap" style={{ color: 'var(--a-dim)' }}>
                  {selected.type === 'faq' && (
                    <span>{selected.faqOrigin?.source === 'marketing' || selected.faqOrigin?.userType === 'prospect'
                      ? 'Prospect, public marketing site'
                      : selected.faqOrigin?.agencyName
                        ? `${selected.faqOrigin.agencyName}, in-dashboard help`
                        : 'In-dashboard help widget'}</span>
                  )}
                  {selected.contactPhone && (<span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{selected.contactPhone}</span>)}
                  {selected.email && (<span className="inline-flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{selected.email}</span>)}
                  {selected.type === 'agency' && !selected.contactPhone && !selected.email && <span>Agency</span>}
                </div>
              </div>

              {/* Support / resolve controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                {selected.supportStatus === 'resolved' ? (
                  <button onClick={() => setThreadStatus(selected, 'reopen')} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-black/5" style={{ border: '1px solid var(--a-line)', color: 'var(--a-ink)' }} title="Reopen this thread">
                    <RotateCcw className="h-3 w-3" /> Reopen
                  </button>
                ) : selected.supportStatus === 'support' ? (
                  <button onClick={() => setThreadStatus(selected, 'resolve')} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:brightness-95" style={{ background: 'var(--a-em)', color: 'var(--a-em-ink)' }} title="Mark resolved">
                    <CheckCircle2 className="h-3 w-3" /> Resolve
                  </button>
                ) : (
                  <button onClick={() => setThreadStatus(selected, 'mark-support')} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-black/5" style={{ border: '1px solid var(--a-line)', color: 'var(--a-ink)' }} title="Mark as a support item">
                    <LifeBuoy className="h-3 w-3" /> Mark support
                  </button>
                )}
                {selected.type === 'agency' && selected.agencyId && (
                  <a href={`/admin/agencies?expand=${selected.agencyId}`} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-black/5"
                     style={{ border: '1px solid var(--a-line)', color: 'var(--a-ink)' }} title="Open this agency's account">
                    <span>Account</span>
                    <ExternalLink className="h-3 w-3" style={{ color: 'var(--a-dim)' }} />
                  </a>
                )}
              </div>
            </div>

            {selected.type === 'agency' && selected.facts && <AgencyPanel facts={selected.facts} />}

            <div ref={threadScrollRef} onScroll={onThreadScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {selected.messages.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--a-dim)' }}>No messages yet.</div>
              ) : (
                selected.messages.map((m) => {
                  const isIn = m.sender === 'in';
                  return (
                    <div key={m.id} className={`flex ${isIn ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[78%]">
                        <div className="rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words"
                          style={isIn ? { background: 'white', border: '1px solid var(--a-line)', color: 'var(--a-ink)' } : { background: 'var(--a-em)', color: 'var(--a-em-ink)' }}>
                          {m.body}
                        </div>
                        <div className={`mt-1 text-[10px] flex items-center gap-1.5 ${isIn ? 'justify-start' : 'justify-end'}`} style={{ color: 'var(--a-dim)' }}>
                          {(() => { const lbl = msgLabel(m); return lbl ? <span className="uppercase tracking-wide" style={{ color: lbl.color }}>{lbl.text}</span> : null; })()}
                          <span>{fmtTime(m.at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {selected.readOnly || selected.type === 'faq' ? (
              <div className="border-t p-3 shrink-0 text-center text-[11px]" style={{ borderColor: 'var(--a-line)', background: 'white', color: 'var(--a-dim)' }}>
                {selected.faqOrigin?.source === 'marketing' || selected.faqOrigin?.userType === 'prospect'
                  ? 'Read-only. A prospect chat with the help bot on the public marketing site.'
                  : selected.faqOrigin?.agencyName
                    ? `Read-only. ${selected.faqOrigin.agencyName} used the help bot inside their dashboard. To reply, message them in their agency conversation.`
                    : 'Read-only. A logged-in user asked the help bot inside their dashboard (not a public prospect).'}
              </div>
            ) : (
              <div className="border-t p-3 shrink-0" style={{ borderColor: 'var(--a-line)', background: 'white' }}>
                <div className="flex items-end gap-2">
                  <textarea ref={replyRef} value={currentDraft} onChange={(e) => selected && setDraft(selected.key, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
                    rows={1} placeholder="Reply as VoiceAI Connect..." className="flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--a-line)', color: 'var(--a-ink)', maxHeight: '45vh', overflowY: 'auto' }} />
                  <button onClick={send} disabled={sending || !currentDraft.trim()} className="flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-40" style={{ background: 'var(--a-em)', color: 'var(--a-em-ink)' }}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px]" style={{ color: 'var(--a-dim)' }}>
                  {selected.lastInboundKind === 'sms' ? 'Replies go out as a text from your platform number.' : 'Replies land in the agency dashboard inbox.'}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {error && (<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg px-4 py-2 text-sm text-white" style={{ background: '#dc2626' }}>{error}</div>)}
    </div>
  );
}