'use client';

// ============================================================================
// GROWTH: CONCIERGE LINE
// The platform's OWN demo number (the concierge/SDR line prospects call to
// evaluate VoiceAI Connect). Distinct from /admin/growth "Demos", which is the
// per-agency demo-call leads feed. Reads /api/admin/demo-calls (backed by the
// platform_demo_calls table, populated by vapi-concierge-webhook.js). Row click
// opens a drawer with the full transcript + recording.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Headphones, Loader2, ArrowLeft, ArrowRight, PhoneForwarded, X } from 'lucide-react';
import { formatPhone, timeAgo, formatDuration } from '@/lib/admin/format';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');
async function adminGet(path: string) {
  const res = await fetch(`${backendUrl()}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json();
}

interface ConciergeCall {
  id: string;
  created_at: string;
  caller_phone: string | null;
  summary: string | null;
  duration_seconds: number | null;
  transferred: boolean;
  ended_reason: string | null;
  recording_url: string | null;
  transcript?: string | null;
  vapi_call_id?: string | null;
}

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'true', label: 'Transferred to demo' },
  { key: 'false', label: 'No transfer' },
];

const PAGE_SIZE = 30;

export default function AdminConciergePage() {
  const [calls, setCalls] = useState<ConciergeCall[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{ total: number; transferred: number }>({ total: 0, transferred: 0 });
  const [loading, setLoading] = useState(true);
  const [transferred, setTransferred] = useState('');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));
      if (transferred) params.set('transferred', transferred);
      const data = await adminGet(`/api/admin/demo-calls?${params.toString()}`);
      setCalls(data.calls || []);
      setTotal(data.total || 0);
      if (data.stats) setStats({ total: data.stats.total || 0, transferred: data.stats.transferred || 0 });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [page, transferred]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const changeFilter = (k: string) => { setTransferred(k); setPage(0); };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-ink)]">Concierge Line</h1>
      <p className="mt-1 text-sm text-[var(--a-dim)]">Prospects who called the platform demo number and talked to the AI concierge.</p>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        <div className="a-panel p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--a-dim)]">Total calls</div>
          <div className="mt-1 text-[24px] font-semibold text-[var(--a-ink)] a-num">{stats.total.toLocaleString()}</div>
        </div>
        <div className="a-panel p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--a-dim)]">Transferred to a demo</div>
          <div className="mt-1 text-[24px] font-semibold text-[var(--a-ink)] a-num">{stats.transferred.toLocaleString()}</div>
        </div>
        <div className="a-panel p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--a-dim)]">Transfer rate</div>
          <div className="mt-1 text-[24px] font-semibold text-[var(--a-ink)] a-num">
            {stats.total > 0 ? `${Math.round((stats.transferred / stats.total) * 100)}%` : '\u2013'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap mt-6">
        {FILTERS.map((f) => (
          <button key={f.key || 'all'} className="a-chip" data-on={transferred === f.key} onClick={() => changeFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="a-panel mt-5">
        <div className="overflow-x-auto">
          <table className="a-table">
            <thead>
              <tr>
                <th>Time</th><th>Caller</th><th>Summary</th><th>Outcome</th><th className="r">Duration</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="py-14 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div></td></tr>
              ) : calls.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="py-16 text-center">
                    <Headphones className="h-7 w-7 mx-auto text-[var(--a-dim)] mb-3" />
                    <p className="text-sm text-[var(--a-muted)]">No concierge calls yet.</p>
                    <p className="text-[12px] text-[var(--a-dim)] mt-1">Calls to the platform demo number show up here.</p>
                  </div>
                </td></tr>
              ) : (
                calls.map((c) => (
                  <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer">
                    <td className="whitespace-nowrap">{timeAgo(c.created_at)}</td>
                    <td className="a-num whitespace-nowrap">{formatPhone(c.caller_phone || '') || 'Unknown'}</td>
                    <td>
                      <div className="text-[var(--a-muted)] line-clamp-1 max-w-[520px]">{c.summary || '\u2013'}</div>
                    </td>
                    <td>
                      {c.transferred ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--a-em)]">
                          <PhoneForwarded className="h-3.5 w-3.5" /> Transferred
                        </span>
                      ) : (
                        <span className="text-[12px] text-[var(--a-dim)]">{c.ended_reason || 'Ended'}</span>
                      )}
                    </td>
                    <td className="r a-num whitespace-nowrap">{formatDuration(c.duration_seconds)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[var(--a-dim)]">Page {page + 1} of {totalPages} &middot; {total.toLocaleString()} total</p>
          <div className="flex items-center gap-2">
            <button className="a-btn-ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={page === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}><ArrowLeft className="h-3.5 w-3.5" /> Prev</button>
            <button className="a-btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} style={page >= totalPages - 1 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>Next <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}

      <ConciergeDrawer callId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

// ============================================================================
// DETAIL DRAWER — full transcript + recording for one concierge call.
// Fetches /api/admin/demo-calls/:id on open.
// ============================================================================
function ConciergeDrawer({ callId, onClose }: { callId: string | null; onClose: () => void }) {
  const [call, setCall] = useState<ConciergeCall | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!callId) { setCall(null); return; }
    let cancelled = false;
    setLoading(true);
    adminGet(`/api/admin/demo-calls/${callId}`)
      .then((d) => { if (!cancelled) setCall(d.call || null); })
      .catch((e) => { console.error(e); if (!cancelled) setCall(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [callId]);

  if (!callId) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div
        className="admin-scope fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto shadow-2xl"
        style={{ background: 'var(--a-card)', borderLeft: '1px solid var(--a-line)' }}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 h-14 border-b border-[var(--a-line)]" style={{ background: 'var(--a-card)' }}>
          <span className="text-sm font-semibold text-[var(--a-ink)]">Concierge call</span>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--a-muted)] hover:bg-[var(--a-em-soft)]">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div>
        ) : !call ? (
          <div className="py-20 text-center text-sm text-[var(--a-muted)]">Could not load this call.</div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Caller" value={formatPhone(call.caller_phone || '') || 'Unknown'} mono />
              <Field label="When" value={timeAgo(call.created_at)} />
              <Field label="Duration" value={formatDuration(call.duration_seconds)} mono />
              <Field label="Outcome" value={call.transferred ? 'Transferred to demo' : (call.ended_reason || 'Ended')} />
            </div>

            {call.recording_url && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--a-dim)] mb-2">Recording</div>
                <audio controls preload="none" src={call.recording_url} className="w-full" />
                <a href={call.recording_url} target="_blank" rel="noreferrer" className="text-[12px] text-[var(--a-em)] mt-1 inline-block">Open recording</a>
              </div>
            )}

            {call.summary && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--a-dim)] mb-2">Summary</div>
                <p className="text-sm text-[var(--a-muted)] leading-relaxed">{call.summary}</p>
              </div>
            )}

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--a-dim)] mb-2">Transcript</div>
              {call.transcript ? (
                <pre className="text-[12.5px] text-[var(--a-muted)] leading-relaxed whitespace-pre-wrap font-sans">{call.transcript}</pre>
              ) : (
                <p className="text-[12px] text-[var(--a-dim)]">No transcript captured.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--a-dim)]">{label}</div>
      <div className={`mt-0.5 text-sm text-[var(--a-ink)] ${mono ? 'a-num' : ''}`}>{value}</div>
    </div>
  );
}