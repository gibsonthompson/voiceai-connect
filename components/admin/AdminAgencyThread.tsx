'use client';

// One continuous conversation with an agency: every support request and every
// feedback submission, merged chronologically, with client tags on the messages
// that reference a specific client. A reply attaches to the agency's most recent
// request. Full-height pane (header + messages + reply) for the 2-pane inbox.
//   GET   /api/admin/agency-threads/:agencyId
//   POST  /api/admin/support-requests/:latestRequestId/reply
//   PATCH /api/admin/support-requests/:id   { status }

import { useState, useEffect, useRef, useCallback } from 'react';

interface Msg {
  id: string; request_id: string; sender: 'admin' | 'agency'; body: string;
  created_at: string; seed?: boolean; kind?: string; client_name?: string | null;
}

export default function AdminAgencyThread({
  agencyId, agencyName, onChanged,
}: { agencyId: string; agencyName?: string | null; onChanged?: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [latestRequestId, setLatestRequestId] = useState<string | null>(null);
  const [requestIds, setRequestIds] = useState<string[]>([]);
  const [name, setName] = useState<string | null>(agencyName || null);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const backend = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backend()}/api/admin/agency-threads/${agencyId}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) {
        const d = await res.json();
        setMessages(d.thread || []);
        setLatestRequestId(d.latest_request_id || null);
        setRequestIds(d.request_ids || []);
        setOpen(d.open !== false);
        setName(d.agency?.name || agencyName || null);
      }
    } finally { setLoading(false); }
  }, [agencyId, agencyName]);

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
      await load(); onChanged?.();
    } catch { setMessages((p) => p.filter((m) => m.id !== optimistic.id)); setReply(body); }
    finally { setSending(false); }
  };

  const setStatus = async (status: 'resolved' | 'open') => {
    if (resolving || !requestIds.length) return;
    setResolving(true);
    try {
      await Promise.all(requestIds.map((id) =>
        fetch(`${backend()}/api/admin/support-requests/${id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ status }),
        }),
      ));
      await load(); onChanged?.();
    } finally { setResolving(false); }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--a-line)', background: 'var(--a-card)' }}>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--a-ink)] truncate">{name || 'Agency'}</p>
          <p className="text-[11px] text-[var(--a-dim)]">{open ? 'Open' : 'Resolved'} {'\u00b7'} {requestIds.length} {requestIds.length === 1 ? 'request' : 'requests'}</p>
        </div>
        {requestIds.length > 0 && (
          <button
            onClick={() => setStatus(open ? 'resolved' : 'open')}
            disabled={resolving}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ border: '1px solid var(--a-line)', color: 'var(--a-ink)', background: 'var(--a-card)', opacity: resolving ? 0.6 : 1 }}
          >
            {resolving ? 'Saving...' : open ? 'Mark resolved' : 'Reopen'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-4 min-h-0" style={{ background: 'var(--a-bg)' }}>
        {loading ? (
          <div className="text-[12px] text-[var(--a-dim)] py-3 text-center">Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div className="text-[12px] text-[var(--a-dim)] py-3 text-center">No messages yet.</div>
        ) : messages.map((m) => {
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
                <div className="rounded-2xl px-3.5 py-2 text-[13px] whitespace-pre-wrap break-words" style={mine ? { background: 'var(--a-em-deep)', color: '#fff' } : { background: '#F1F5F4', color: 'var(--a-ink)', border: '1px solid var(--a-line)' }}>{m.body}</div>
                <div className={`mt-0.5 text-[10px] text-[var(--a-dim)] ${mine ? 'text-right' : ''}`}>{new Date(m.created_at).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Reply */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--a-line)', background: 'var(--a-card)' }}>
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
            rows={2}
            placeholder={latestRequestId ? 'Reply to this agency...  (Cmd/Ctrl+Enter to send)' : 'No request to reply to yet'}
            disabled={!latestRequestId}
            className="flex-1 rounded-lg px-3 py-2 text-[13px] resize-none focus:outline-none"
            style={{ border: '1px solid var(--a-line)', background: 'var(--a-bg)', color: 'var(--a-ink)' }}
          />
          <button onClick={send} disabled={sending || !reply.trim() || !latestRequestId} className="shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold" style={{ background: 'var(--a-em-deep)', color: '#fff', opacity: (sending || !reply.trim() || !latestRequestId) ? 0.6 : 1 }}>{sending ? 'Sending...' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}