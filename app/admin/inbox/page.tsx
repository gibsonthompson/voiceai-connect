'use client';

// ============================================================================
// ADMIN INBOX, one unified iMessage-style inbox for all platform comms.
// One conversation per agency (in-app support thread + SMS replies merged),
// plus the public FAQ-bot prospect chats as read-only conversations. A reply
// routes to the channel the agency last used: in-app (their dashboard "VoiceAI
// Connect" conversation) or SMS from the platform number.
// Backend: GET /api/admin/inbox, POST /api/admin/inbox/send, /inbox/read.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, Loader2, RefreshCw, Phone, Building2, Bot } from 'lucide-react';

interface InboxMessage { id: string; sender: 'in' | 'out'; body: string; at: string; kind: 'inapp' | 'sms' | 'faq' | 'feedback'; }
interface Conversation {
  key: string;
  type: 'agency' | 'faq';
  agencyId: string | null;
  name: string;
  phone: string | null;
  messages: InboxMessage[];
  unread: number;
  lastAt: string | null;
  lastDirection: 'in' | 'out' | null;
  lastPreview: string;
  lastInboundKind?: 'inapp' | 'sms' | 'faq' | 'feedback';
  needsReply: boolean;
  readOnly?: boolean;
  escalated?: boolean;
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

export default function AdminInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl()}/api/admin/inbox`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const convos: Conversation[] = data.conversations || [];
      setConversations(convos);
      setSelected((cur) => (cur ? convos.find((c) => c.key === cur.key) || cur : cur));
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

  useEffect(() => { stickRef.current = true; }, [selected?.key]);
  useEffect(() => { if (stickRef.current) threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected]);

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

  const open = (c: Conversation) => { setSelected(c); setReply(''); markRead(c); };

  const send = async () => {
    const text = reply.trim();
    if (!text || !selected || selected.type !== 'agency' || !selected.agencyId || sending) return;
    setSending(true);
    const optimistic: InboxMessage = { id: `tmp-${Date.now()}`, sender: 'out', body: text, at: new Date().toISOString(), kind: selected.lastInboundKind === 'sms' ? 'sms' : 'inapp' };
    setSelected((prev) => (prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev));
    try {
      const res = await fetch(`${backendUrl()}/api/admin/inbox/send`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId: selected.agencyId, channel: selected.lastInboundKind === 'sms' ? 'sms' : 'inapp', body: text }),
      });
      if (!res.ok) throw new Error('send failed');
      setReply('');
      await load();
    } catch {
      setSelected((prev) => (prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimistic.id) } : prev));
      setError('Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce((n, c) => n + (c.unread || 0), 0);

  const TypeTag = ({ c }: { c: Conversation }) => (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
      style={c.type === 'faq'
        ? { background: '#eef2ff', color: '#4338ca' }
        : { background: 'var(--a-em-soft, #ecfdf5)', color: 'var(--a-em-deep, #047857)' }}>
      {c.type === 'faq' ? (c.escalated ? 'FAQ, escalated' : 'FAQ') : 'Agency'}
    </span>
  );

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden" style={{ color: 'var(--a-ink)' }}>
      {/* Conversation list */}
      <aside className={`${selected ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 shrink-0 flex-col border-r`} style={{ borderColor: 'var(--a-line)', background: 'white' }}>
        <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: 'var(--a-line)' }}>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" style={{ color: 'var(--a-em-deep)' }} />
            <h1 className="text-sm font-semibold">Inbox</h1>
            {totalUnread > 0 && (<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--a-em)' }}>{totalUnread}</span>)}
          </div>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-black/5" aria-label="Refresh"><RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--a-dim)' }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--a-dim)' }} /></div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm" style={{ color: 'var(--a-dim)' }}>No conversations yet. Agency messages (in-app + SMS) and FAQ chats land here.</div>
          ) : (
            conversations.map((c) => (
              <button key={c.key} onClick={() => open(c)} className="w-full text-left px-4 py-3 border-b transition-colors hover:bg-black/[0.02]"
                style={{ borderColor: 'var(--a-line)', background: selected?.key === c.key ? 'var(--a-em-soft)' : 'transparent' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-sm truncate ${c.unread > 0 ? 'font-semibold' : 'font-medium'}`}>{c.name}</span>
                    <TypeTag c={c} />
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--a-dim)' }}>{fmtTime(c.lastAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs truncate" style={{ color: (c.unread > 0 || c.needsReply) ? 'var(--a-ink)' : 'var(--a-dim)' }}>
                    {c.lastDirection === 'out' ? 'You: ' : ''}{c.lastPreview}
                  </span>
                  {c.unread > 0 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: 'var(--a-em)' }}>{c.unread}</span>
                  ) : c.needsReply ? (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--a-em)' }} />
                  ) : null}
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
            <div className="flex items-center gap-3 px-4 h-14 border-b shrink-0" style={{ borderColor: 'var(--a-line)', background: 'white' }}>
              <button onClick={() => setSelected(null)} className="sm:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5" aria-label="Back"><ArrowLeft className="h-4 w-4" style={{ color: 'var(--a-dim)' }} /></button>
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--a-em-soft, #ecfdf5)', color: 'var(--a-em-deep, #047857)' }}>
                {selected.type === 'faq' ? <Bot className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate flex items-center gap-1.5">{selected.name}<TypeTag c={selected} /></div>
                <div className="text-[11px] flex items-center gap-1" style={{ color: 'var(--a-dim)' }}>
                  {selected.type === 'faq' ? 'Prospect, public FAQ bot' : (selected.phone ? (<><Phone className="h-3 w-3" />{selected.phone}</>) : 'Agency')}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {selected.messages.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--a-dim)' }}>No messages yet.</div>
              ) : (
                selected.messages.map((m) => {
                  const isIn = m.sender === 'in';
                  return (
                    <div key={m.id} className={`flex ${isIn ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[78%]">
                        <div className="rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words"
                          style={isIn ? { background: 'white', border: '1px solid var(--a-line)', color: 'var(--a-ink)' } : { background: 'var(--a-em)', color: 'white' }}>
                          {m.body}
                        </div>
                        <div className={`mt-1 text-[10px] flex items-center gap-1.5 ${isIn ? 'justify-start' : 'justify-end'}`} style={{ color: 'var(--a-dim)' }}>
                          {m.kind === 'sms' && <span className="uppercase tracking-wide">Text</span>}
                          {m.kind === 'feedback' && <span className="uppercase tracking-wide" style={{ color: '#92400e' }}>Feedback</span>}
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
                Read-only, this is a prospect chat with the public FAQ bot.
              </div>
            ) : (
              <div className="border-t p-3 shrink-0" style={{ borderColor: 'var(--a-line)', background: 'white' }}>
                <div className="flex items-end gap-2">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
                    rows={1} placeholder="Reply as VoiceAI Connect..." className="flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--a-line)', color: 'var(--a-ink)', maxHeight: '8rem' }} />
                  <button onClick={send} disabled={sending || !reply.trim()} className="flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40" style={{ background: 'var(--a-em)' }}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px]" style={{ color: 'var(--a-dim)' }}>
                  {selected.lastInboundKind === 'sms' ? 'Replies go out as a text from your platform number.' : 'Replies land in the agency dashboard inbox.'} Cmd/Ctrl + Enter to send.
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