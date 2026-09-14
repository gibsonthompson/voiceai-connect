'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, Loader2, RefreshCw, Phone } from 'lucide-react';

interface Conversation {
  agencyId: string;
  agencyName: string;
  phone: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}
interface Message {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  at: string;
  type: string;
  status: string;
}

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''}`,
});

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function AdminRepliesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl()}/api/admin/platform-inbox`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setConversations(data.conversations || []);
      setError('');
    } catch {
      setError('Could not load the inbox.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, 20000);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openThread = async (c: Conversation) => {
    setSelected(c);
    setMessages([]);
    setLoadingThread(true);
    setConversations((prev) => prev.map((x) => (x.agencyId === c.agencyId ? { ...x, unread: 0 } : x)));
    try {
      const res = await fetch(`${backendUrl()}/api/admin/platform-inbox/${c.agencyId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setError('Could not load the conversation.');
    } finally {
      setLoadingThread(false);
    }
  };

  const send = async () => {
    const text = reply.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${backendUrl()}/api/admin/platform-inbox/${selected.agencyId}/reply`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error('send failed');
      setMessages((prev) => [
        ...prev,
        { id: `tmp-${Date.now()}`, body: text, direction: 'outbound', at: new Date().toISOString(), type: 'admin_reply', status: 'sent' },
      ]);
      setReply('');
      loadConversations();
    } catch {
      setError('Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden" style={{ color: 'var(--a-ink)' }}>
      {/* Conversation list */}
      <aside
        className={`${selected ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 shrink-0 flex-col border-r`}
        style={{ borderColor: 'var(--a-line)', background: 'white' }}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: 'var(--a-line)' }}>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" style={{ color: 'var(--a-em-deep)' }} />
            <h1 className="text-sm font-semibold">Replies</h1>
            {totalUnread > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--a-em)' }}>
                {totalUnread}
              </span>
            )}
          </div>
          <button onClick={loadConversations} className="p-1.5 rounded-lg hover:bg-black/5" aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--a-dim)' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--a-dim)' }} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm" style={{ color: 'var(--a-dim)' }}>
              No replies yet. When an agency owner texts back the platform number, it lands here.
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.agencyId}
                onClick={() => openThread(c)}
                className="w-full text-left px-4 py-3 border-b transition-colors hover:bg-black/[0.02]"
                style={{
                  borderColor: 'var(--a-line)',
                  background: selected?.agencyId === c.agencyId ? 'var(--a-em-soft)' : 'transparent',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${c.unread > 0 ? 'font-semibold' : 'font-medium'}`}>{c.agencyName}</span>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--a-dim)' }}>{fmtTime(c.lastAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs truncate" style={{ color: c.unread > 0 ? 'var(--a-ink)' : 'var(--a-dim)' }}>
                    {c.lastMessage}
                  </span>
                  {c.unread > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: 'var(--a-em)' }}>
                      {c.unread}
                    </span>
                  )}
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
              <button onClick={() => setSelected(null)} className="sm:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-black/5" aria-label="Back">
                <ArrowLeft className="h-4 w-4" style={{ color: 'var(--a-dim)' }} />
              </button>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{selected.agencyName}</div>
                {selected.phone && (
                  <div className="text-[11px] flex items-center gap-1" style={{ color: 'var(--a-dim)' }}>
                    <Phone className="h-3 w-3" />
                    {selected.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingThread ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--a-dim)' }} />
                </div>
              ) : (
                messages.map((m) => {
                  const isIn = m.direction === 'inbound';
                  const isAuto = !isIn && m.type !== 'admin_reply';
                  return (
                    <div key={m.id} className={`flex ${isIn ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[78%]">
                        <div
                          className="rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words"
                          style={
                            isIn
                              ? { background: 'white', border: '1px solid var(--a-line)', color: 'var(--a-ink)' }
                              : { background: 'var(--a-em)', color: 'white' }
                          }
                        >
                          {m.body}
                        </div>
                        <div className={`mt-1 text-[10px] flex items-center gap-1.5 ${isIn ? 'justify-start' : 'justify-end'}`} style={{ color: 'var(--a-dim)' }}>
                          {isAuto && <span className="uppercase tracking-wide">Automated</span>}
                          <span>{fmtTime(m.at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            <div className="border-t p-3 shrink-0" style={{ borderColor: 'var(--a-line)', background: 'white' }}>
              <div className="flex items-end gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Reply as VoiceAI Connect..."
                  className="flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--a-line)', color: 'var(--a-ink)', maxHeight: '8rem' }}
                />
                <button
                  onClick={send}
                  disabled={sending || !reply.trim()}
                  className="flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                  style={{ background: 'var(--a-em)' }}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[10px]" style={{ color: 'var(--a-dim)' }}>
                Sends from your platform number. Cmd/Ctrl + Enter to send.
              </p>
            </div>
          </>
        )}
      </main>

      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg px-4 py-2 text-sm text-white" style={{ background: '#dc2626' }}>
          {error}
        </div>
      )}
    </div>
  );
}