'use client';

// ============================================================================
// AGENCY CLIENT THREAD — the agency side of two-way agency <-> client messaging.
// Embedded in the Inbox "From clients" expanded row (NOT a separate page), below
// the status/notes grid, for requests that came from a real client (user_type
// 'client'), since only a client has a portal to see the reply. The client's
// original message is the seed; the agency's replies text the client "Respond
// from your dashboard inbox" (no link). Mirrors PlatformMessages one level down.
//
//   GET  /api/agency/:agencyId/support-requests/:id/thread
//   POST /api/agency/:agencyId/support-requests/:id/reply
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface ThreadMessage {
  id: string;
  sender: 'agency' | 'client';
  body: string;
  created_at: string;
  seed?: boolean;
}

interface Props {
  agencyId: string;
  backendUrl: string;
  requestId: string;
  requesterName?: string | null;
  recipientKind?: 'client' | 'visitor';
  onReplied?: () => void;
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

export default function AgencyClientThread({ agencyId, backendUrl, requestId, requesterName, recipientKind = 'client', onReplied }: Props) {
  const theme = useTheme();
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/support-requests/${requestId}/thread`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setMessages(data.thread || []);
    } catch (e) {
      console.error('Client thread load error:', e);
    } finally {
      setLoading(false);
    }
  }, [agencyId, backendUrl, requestId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendReply = async () => {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/support-requests/${requestId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error('send failed');
      const data = await res.json();
      if (data.message) setMessages(prev => [...prev, data.message]);
      setReply('');
      onReplied?.();
    } catch (e) {
      console.error('Client thread reply error:', e);
    } finally {
      setSending(false);
    }
  };

  const theirLabel = requesterName || (recipientKind === 'visitor' ? 'visitor' : 'Client');

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
      <div className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: theme.textMuted, borderBottom: `1px solid ${theme.border}` }}>
        Conversation with {theirLabel}
      </div>

      <div className="px-4 py-4 space-y-3 max-h-[min(50vh,460px)] overflow-y-auto">
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} /></div>
        ) : messages.map(m => {
          const mine = m.sender === 'agency';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%]">
                <div className="text-[11px] mb-1" style={{ color: theme.textMuted, textAlign: mine ? 'right' : 'left' }}>
                  {mine ? 'You' : theirLabel} · {fmt(m.created_at)}
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
          placeholder={`Reply to ${theirLabel}...`}
          className="flex-1 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
          style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
        />
        <button onClick={sendReply} disabled={!reply.trim() || sending}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: theme.primary, color: '#fff' }}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
        </button>
      </div>
      <div className="px-4 pb-3 text-[11px]" style={{ color: theme.textMuted }}>
        {recipientKind === 'visitor'
          ? 'This visitor has no dashboard, so your reply is texted straight to their number.'
          : 'Your reply is sent to the client in their dashboard and they get a text to check it.'}
      </div>
    </div>
  );
}
