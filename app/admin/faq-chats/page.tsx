'use client';

// ============================================================================
// ADMIN: FAQ Chats. What prospects ask the public FAQ bot (the SupportWidget on
// the signup/marketing pages) grouped into conversations, newest first, with
// escalations flagged. Reads GET /api/admin/widget-chats. Platform/prospect
// data, not agency-scoped.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, ArrowUpRight, ChevronDown, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');
const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface Msg { session_id: string; role: 'user' | 'assistant' | 'escalation'; content: string; created_at: string; }
interface Session { session_id: string; escalated: boolean; first_at: string; last_at: string; question_count: number; messages: Msg[]; }

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
}

export default function FaqChatsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalatedCount, setEscalatedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [onlyEscalated, setOnlyEscalated] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/admin/widget-chats?limit=100`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setSessions(data.sessions || []);
      setEscalatedCount(data.escalated_count || 0);
      setTotal(data.total_sessions || 0);
    } catch (e) {
      console.error('FAQ chats load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = onlyEscalated ? sessions.filter((s) => s.escalated) : sessions;

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--a-ink)] tracking-tight">FAQ Chats</h1>
          <p className="text-sm text-[var(--a-ink)]/60 mt-1">What prospects ask the FAQ bot on your signup and marketing pages. Escalations that handed off to you are flagged.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm shrink-0" style={{ border: '1px solid var(--a-em-line)', color: 'var(--a-em-deep)' }}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6 text-sm">
        <span className="text-[var(--a-ink)]/70">{total} conversation{total === 1 ? '' : 's'}</span>
        <button
          onClick={() => setOnlyEscalated((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
          style={onlyEscalated ? { background: 'var(--a-em-soft)', border: '1px solid var(--a-em-line)', color: 'var(--a-em-deep)' } : { border: '1px solid var(--a-em-line)', color: 'var(--a-ink)' }}
        >
          <ArrowUpRight className="h-3.5 w-3.5" /> {escalatedCount} escalated
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--a-em-deep)' }} /></div>
      ) : shown.length === 0 ? (
        <div className="py-20 text-center text-[var(--a-ink)]/50">
          <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>{onlyEscalated ? 'No escalated conversations.' : 'No FAQ bot conversations yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((s) => {
            const isOpen = open === s.session_id;
            const firstQ = s.messages.find((m) => m.role === 'user');
            return (
              <div key={s.session_id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--a-em-line)' }}>
                <button onClick={() => setOpen(isOpen ? null : s.session_id)} className="w-full text-left px-4 py-3 flex items-center gap-3">
                  {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-[var(--a-ink)]/50" /> : <ChevronRight className="h-4 w-4 shrink-0 text-[var(--a-ink)]/50" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate text-[var(--a-ink)]">{firstQ ? firstQ.content : '(no question)'}</div>
                    <div className="text-xs text-[var(--a-ink)]/50 mt-0.5">{fmt(s.last_at)} · {s.question_count} question{s.question_count === 1 ? '' : 's'}</div>
                  </div>
                  {s.escalated && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }}>
                      <ArrowUpRight className="h-3 w-3" /> Escalated
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-2 space-y-2" style={{ borderTop: '1px solid var(--a-em-line)' }}>
                    {[...s.messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((m, i) => m.role === 'escalation' ? (
                      <div key={i} className="text-[12px] rounded-lg px-3 py-2" style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }}>
                        <ArrowUpRight className="h-3.5 w-3.5 inline mr-1" />{m.content}
                      </div>
                    ) : (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[78%]">
                          <div className="text-[10px] mb-1 text-[var(--a-ink)]/40" style={{ textAlign: m.role === 'user' ? 'right' : 'left' }}>{m.role === 'user' ? 'Prospect' : 'Bot'} · {fmt(m.created_at)}</div>
                          <div className="rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap" style={m.role === 'user' ? { background: 'var(--a-em-deep)', color: '#fff' } : { background: 'var(--a-em-soft)', color: 'var(--a-ink)' }}>{m.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}