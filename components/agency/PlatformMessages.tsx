'use client';

// ============================================================================
// PLATFORM MESSAGES — the agency side of two-way platform <-> agency threads.
// Rendered inside the agency Inbox under the "VoiceAI Connect" channel toggle
// (NOT a separate page). Lists this agency's threads with the platform, opens
// one as a conversation, and lets the agency reply back.
//
//   GET  /api/agency/:agencyId/platform-threads        list + unread_total
//   GET  /api/agency/:agencyId/platform-threads/:id    seed + messages (marks read)
//   POST /api/agency/:agencyId/platform-threads/:id/reply
//
// onUnreadChange lets the parent (the Inbox toggle badge, and indirectly the
// dashboard) reflect the live unread count after reads/replies.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, ArrowLeft, Send, MessageSquare, ShieldCheck, Plus } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface ThreadRow {
  id: string;
  message: string;
  status: string;
  source: string | null;
  created_at: string;
  last_reply_at: string | null;
  last_sender: string | null;
  agency_unread: number;
}
interface ThreadMessage {
  id: string;
  sender: 'admin' | 'agency';
  body: string;
  created_at: string;
  seed?: boolean;
}

function rgba(hex: string, a: number): string {
  const c = (hex || '#10b981').replace('#', '');
  const f = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const r = parseInt(f.slice(0, 2), 16), g = parseInt(f.slice(2, 4), 16), b = parseInt(f.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(16,185,129,${a})`;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmt(date: string): string {
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function PlatformMessages({
  agencyId,
  backendUrl,
  onUnreadChange,
}: {
  agencyId: string;
  backendUrl: string;
  onUnreadChange?: (n: number) => void;
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeText, setComposeText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

  const loadThreads = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/platform-threads`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setThreads(data.threads || []);
      onUnreadChange?.(data.unread_total || 0);
    } catch (e) {
      console.error('Platform threads error:', e);
    } finally {
      setLoading(false);
    }
  }, [agencyId, backendUrl, onUnreadChange]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const sendNew = async () => {
    const body = composeText.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/platform-threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error('send failed');
      setComposeText('');
      setComposing(false);
      await loadThreads();
    } catch (e) {
      console.error('New platform message error:', e);
    } finally {
      setSending(false);
    }
  };
  useEffect(() => { if (openId) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, openId]);

  const openThread = async (id: string) => {
    setOpenId(id);
    setThreadLoading(true);
    setMessages([]);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/platform-threads/${id}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error('thread failed');
      const data = await res.json();
      setMessages(data.thread || []);
      // Opening clears this thread's unread server-side; reflect it locally.
      setThreads(prev => prev.map(t => (t.id === id ? { ...t, agency_unread: 0 } : t)));
      onUnreadChange?.(threads.reduce((n, t) => n + (t.id === id ? 0 : t.agency_unread || 0), 0));
    } catch (e) {
      console.error('Open thread error:', e);
    } finally {
      setThreadLoading(false);
    }
  };

  const sendReply = async () => {
    const body = reply.trim();
    if (!body || !openId || sending) return;
    setSending(true);
    // Optimistic append.
    const optimistic: ThreadMessage = { id: `tmp-${Date.now()}`, sender: 'agency', body, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setReply('');
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/platform-threads/${openId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error('reply failed');
    } catch (e) {
      console.error('Reply error:', e);
      // Roll the optimistic message back and restore the draft so nothing is lost.
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setReply(body);
    } finally {
      setSending(false);
    }
  };

  const panel: React.CSSProperties = {
    backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden',
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] p-12 flex items-center justify-center" style={panel}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  // ---- Compose a new message to the platform ----
  if (composing) {
    return (
      <div className="max-w-[1400px]" style={panel}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <button onClick={() => { setComposing(false); setComposeText(''); }} className="inline-flex items-center gap-1.5 text-sm" style={{ color: theme.textMuted }}>
            <ArrowLeft className="h-4 w-4" /> All messages
          </button>
          <span className="text-sm font-medium" style={{ color: theme.text }}>Message VoiceAI Connect</span>
        </div>
        <div className="p-4 space-y-3">
          <textarea value={composeText} onChange={(e) => setComposeText(e.target.value)} rows={5} autoFocus
            placeholder="What do you need help with? The VoiceAI Connect team will see this and reply right here."
            className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
            style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : theme.card, border: `1px solid ${theme.border}`, color: theme.text }} />
          <div className="flex justify-end">
            <button onClick={sendNew} disabled={!composeText.trim() || sending}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: theme.primary, color: '#fff' }}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Thread detail ----
  if (openId) {
    const row = threads.find(t => t.id === openId);
    return (
      <div className="max-w-[1400px]" style={panel}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <button onClick={() => { setOpenId(null); loadThreads(); }}
            className="inline-flex items-center gap-1.5 text-sm" style={{ color: theme.textMuted }}>
            <ArrowLeft className="h-4 w-4" /> All messages
          </button>
          <div className="ml-auto inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
            style={{ color: theme.primary, backgroundColor: rgba(theme.primary, 0.1), border: `1px solid ${rgba(theme.primary, 0.3)}` }}>
            <ShieldCheck className="h-3.5 w-3.5" /> VoiceAI Connect
          </div>
        </div>

        <div className="px-4 py-4 space-y-3 max-h-[min(60vh,560px)] overflow-y-auto">
          {threadLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} /></div>
          ) : messages.map(m => {
            const mine = m.sender === 'agency';
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%]">
                  <div className="text-[11px] mb-1" style={{ color: theme.textMuted, textAlign: mine ? 'right' : 'left' }}>
                    {mine ? 'You' : 'VoiceAI Connect'} · {fmt(m.created_at)}
                  </div>
                  <div className="rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap"
                    style={mine
                      ? { backgroundColor: theme.primary, color: '#fff' }
                      : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.border}` }}>
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="px-4 py-3 flex items-end gap-2" style={{ borderTop: `1px solid ${theme.border}` }}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendReply(); } }}
            rows={2}
            placeholder="Write a reply to VoiceAI Connect..."
            className="flex-1 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
            style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
          />
          <button onClick={sendReply} disabled={!reply.trim() || sending}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: theme.primary, color: '#fff' }}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </div>
        {row && row.status === 'resolved' && (
          <div className="px-4 pb-3 text-[11px]" style={{ color: theme.textMuted }}>
            This thread was marked resolved. Replying reopens it.
          </div>
        )}
      </div>
    );
  }

  // ---- Thread list ----
  if (threads.length === 0) {
    return (
      <div className="max-w-[1400px] p-16 text-center" style={panel}>
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
          style={{ backgroundColor: rgba(theme.primary, 0.1), border: `1px solid ${rgba(theme.primary, 0.25)}` }}>
          <MessageSquare className="h-7 w-7" style={{ color: theme.primary }} />
        </div>
        <p className="text-sm" style={{ color: theme.text }}>No messages from VoiceAI Connect yet</p>
        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
          Replies to your support requests and platform updates will show up here.
        </p>
        <button onClick={() => setComposing(true)} className="mt-5 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium" style={{ backgroundColor: theme.primary, color: '#fff' }}>
          <Plus className="h-4 w-4" /> New message to VoiceAI Connect
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px]" style={panel}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <span className="text-sm font-medium" style={{ color: theme.text }}>VoiceAI Connect</span>
        <button onClick={() => setComposing(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: rgba(theme.primary, 0.1), border: `1px solid ${rgba(theme.primary, 0.3)}`, color: theme.primary }}>
          <Plus className="h-3.5 w-3.5" /> New message
        </button>
      </div>
      <div className="divide-y" style={{ borderColor: theme.border }}>
      {threads.map(t => {
        const unread = (t.agency_unread || 0) > 0;
        const last = t.last_reply_at || t.created_at;
        return (
          <button key={t.id} onClick={() => openThread(t.id)}
            className="w-full text-left px-4 py-4 flex items-start gap-3 transition-colors"
            style={{ borderColor: theme.border, backgroundColor: unread ? rgba(theme.primary, 0.05) : 'transparent' }}>
            <div className="mt-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: unread ? theme.primary : 'transparent' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate" style={{ color: theme.text }}>VoiceAI Connect</span>
                {t.status === 'resolved' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }}>Resolved</span>
                )}
                <span className="ml-auto text-[11px] shrink-0" style={{ color: theme.textMuted }}>{timeAgo(last)}</span>
              </div>
              <p className="text-sm mt-0.5 truncate" style={{ color: unread ? theme.text : theme.textMuted, fontWeight: unread ? 500 : 400 }}>
                {t.last_sender === 'admin' ? 'VoiceAI Connect: ' : ''}{t.message}
              </p>
            </div>
          </button>
        );
      })}
      </div>
    </div>
  );
}