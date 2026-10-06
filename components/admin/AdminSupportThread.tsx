'use client';

// ============================================================================
// ADMIN SUPPORT THREAD — the platform side of two-way platform <-> agency
// messaging, rendered inside the admin Support page's expanded request row.
// Shows the conversation (the agency's original message as the seed, then every
// admin/agency reply) and a reply box. A reply posts to the agency's dashboard
// and texts them.
//
//   GET  /api/admin/support-requests/:id/thread
//   POST /api/admin/support-requests/:id/reply
// Auth: admin_token (platform_admin).
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader, Send } from 'lucide-react';

interface Msg { id: string; sender: 'admin' | 'agency'; body: string; created_at: string; seed?: boolean; }

const backend = () => (process.env.NEXT_PUBLIC_API_URL || '');
const fmt = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function AdminSupportThread({ requestId, agencyId }: { requestId: string; agencyId: string | null }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backend()}/api/admin/support-requests/${requestId}/thread`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) { const d = await res.json(); setMessages(d.thread || []); }
    } catch (e) { console.error('Thread load error:', e); } finally { setLoading(false); }
  }, [requestId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    const optimistic: Msg = { id: `tmp-${Date.now()}`, sender: 'admin', body, created_at: new Date().toISOString() };
    setMessages(p => [...p, optimistic]);
    setReply('');
    try {
      const res = await fetch(`${backend()}/api/admin/support-requests/${requestId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error('reply failed');
    } catch (e) {
      console.error('Reply error:', e);
      setMessages(p => p.filter(m => m.id !== optimistic.id));
      setReply(body);
    } finally { setSending(false); }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Conversation</h4>
      <div className="rounded-xl bg-[var(--a-card)] border border-[var(--a-line)] p-3 space-y-2.5 max-h-[320px] overflow-y-auto">
        {loading ? (
          <div className="py-6 flex justify-center"><Loader className="h-4 w-4 animate-spin text-[var(--a-dim)]" /></div>
        ) : messages.map(m => {
          const mine = m.sender === 'admin';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%]">
                <div className="text-[10px] mb-0.5 text-[var(--a-dim)]" style={{ textAlign: mine ? 'right' : 'left' }}>
                  {mine ? 'You' : 'Agency'} · {fmt(m.created_at)}
                </div>
                <div className={`rounded-2xl px-3 py-2 text-[12px] whitespace-pre-wrap ${mine
                  ? 'bg-[var(--a-em-soft)] border border-[var(--a-em-line)] text-[var(--a-em-deep)]'
                  : 'bg-[var(--a-card)] border border-[var(--a-line-2)] text-[var(--a-ink)]'}`}>
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="mt-2 flex items-end gap-2">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
          rows={2}
          placeholder="Reply to the agency (lands on their dashboard + texts them)..."
          className="flex-1 rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-3 py-2.5 text-xs text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)] resize-none"
        />
        <button
          onClick={send}
          disabled={!reply.trim() || sending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--a-em-soft)] border border-[var(--a-em-line)] px-3 py-2.5 text-xs font-medium text-[var(--a-em-deep)] transition-colors hover:bg-[var(--a-em-line)] disabled:opacity-40 disabled:cursor-default"
        >
          {sending ? <Loader className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Reply
        </button>
      </div>
      {!agencyId && (
        <p className="mt-1.5 text-[10px] text-[var(--a-dim)]">
          Not linked to an agency dashboard, so this reply won&apos;t appear in-app. Use the email link in Details instead.
        </p>
      )}
    </div>
  );
}