'use client';

// One continuous conversation with an agency: every support request and every
// feedback submission, merged chronologically, with client tags on the messages
// that reference a specific client. A reply attaches to the agency's most recent
// request, so it reads as one running thread rather than per-ticket.
//   GET  /api/admin/agency-threads/:agencyId
//   POST /api/admin/support-requests/:latestRequestId/reply

import { useState, useEffect, useRef, useCallback } from 'react';

interface Msg {
  id: string; request_id: string; sender: 'admin' | 'agency'; body: string;
  created_at: string; seed?: boolean; kind?: string; client_name?: string | null;
}

export default function AdminAgencyThread({ agencyId }: { agencyId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [latestRequestId, setLatestRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const backend = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${backend()}/api/admin/agency-threads/${agencyId}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) { const d = await res.json(); setMessages(d.thread || []); setLatestRequestId(d.latest_request_id || null); }
    } finally { setLoading(false); }
  }, [agencyId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const body = reply.trim();
    if (!body || sending || !latestRequestId) return;
    setSending(true); setReply('');
    const optimistic: Msg = { id: `tmp-${Date.now()}`, request_id: latestRequestId, sender: 'admin', body, created_at: new Date().toISOString() };
    setMessages((p) => [...p, optimistic]);
    try {
      const res = await fetch(`${backend()}/api/admin/support-requests/${latestRequestId}/reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error('send failed');
      await load();
    } catch { setMessages((p) => p.filter((m) => m.id !== optimistic.id)); setReply(body); }
    finally { setSending(false); }
  };

  if (loading) return <div className="text-[12px] text-[var(--a-dim)] px-1 py-3">Loading conversation...</div>;

  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-[440px] overflow-y-auto flex flex-col gap-2 pr-1">
        {messages.map((m) => {
          const mine = m.sender === 'admin';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[82%]">
                {m.seed && (m.kind === 'feedback' || m.client_name) && (
                  <div className={`mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--a-dim)] ${mine ? 'justify-end' : ''}`}>
                    {m.kind === 'feedback' && <span className="rounded px-1.5 py-0.5" style={{ background: 'var(--a-violet-soft)', color: 'var(--a-violet)' }}>Feedback</span>}
                    {m.client_name && <span>re: {m.client_name}</span>}
                  </div>
                )}
                <div className="rounded-xl px-3 py-2 text-[13px] whitespace-pre-wrap break-words" style={mine ? { background: 'var(--a-em)', color: '#04140D' } : { background: '#F6FCF9', color: 'var(--a-ink)', border: '1px solid var(--a-line)' }}>{m.body}</div>
                <div className={`mt-0.5 text-[10px] text-[var(--a-dim)] ${mine ? 'text-right' : ''}`}>{new Date(m.created_at).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="flex items-end gap-2">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
          rows={2}
          placeholder={latestRequestId ? 'Reply to this agency...' : 'No request to reply to yet'}
          disabled={!latestRequestId}
          className="flex-1 rounded-lg px-3 py-2 text-[13px] resize-none focus:outline-none"
          style={{ border: '1px solid var(--a-line)', background: '#fff', color: 'var(--a-ink)' }}
        />
        <button onClick={send} disabled={sending || !reply.trim() || !latestRequestId} className="a-btn shrink-0" style={{ opacity: (sending || !reply.trim() || !latestRequestId) ? 0.6 : 1 }}>{sending ? 'Sending...' : 'Send'}</button>
      </div>
    </div>
  );
}