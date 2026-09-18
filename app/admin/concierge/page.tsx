'use client';

// ============================================================================
// ADMIN — CONCIERGE LINE
// Prospects calling the VoiceAI Connect demo number (the concierge / demo line).
// Reads /api/admin/demo-calls (list) and /api/admin/demo-calls/:id (detail).
// Distinct from /admin/growth "demos", those are agency-side demo calls; these
// are people evaluating the PLATFORM. Same admin design system + fetch pattern
// as the rest of the console.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Loader2, PhoneForwarded, PhoneMissed, X, Sparkles } from 'lucide-react';
import { formatPhone, timeAgo, formatDuration } from '@/lib/admin/format';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');
async function adminGet(path: string) {
  const res = await fetch(`${backendUrl()}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json();
}

interface DemoCall {
  id: string; caller_phone: string | null; summary: string | null;
  duration_seconds: number | null; transferred: boolean; ended_reason: string | null;
  recording_url: string | null; created_at: string;
}
interface DemoCallDetail extends DemoCall { transcript: string | null; vapi_call_id: string | null; }

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'true', label: 'Heard a demo' },
  { key: 'false', label: 'Questions only' },
];

export default function ConciergePage() {
  const [calls, setCalls] = useState<DemoCall[]>([]);
  const [stats, setStats] = useState<{ total: number; transferred: number }>({ total: 0, transferred: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchList = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const q = f === 'all' ? '' : `&transferred=${f}`;
      const data = await adminGet(`/api/admin/demo-calls?limit=50${q}`);
      setCalls(data.calls || []);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(filter); }, [filter, fetchList]);

  const transferRate = stats.total > 0 ? Math.round((stats.transferred / stats.total) * 100) : 0;

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-ink)]">Concierge Line</h1>
      <p className="mt-1 text-sm text-[var(--a-dim)]">Prospects calling the VoiceAI Connect demo number, and whether they went on to hear a live receptionist.</p>

      {/* OP STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
        <div className="a-card p-4">
          <div className="text-[12px] font-semibold text-[var(--a-muted)]">Total Demo Calls</div>
          <div className="a-num mt-2 text-[33px] font-bold leading-none text-[var(--a-ink)]">{stats.total}</div>
          <div className="text-[11.5px] mt-1.5 font-medium text-[var(--a-dim)]">people who called the line</div>
        </div>
        <div className="a-card p-4" style={{ background: 'linear-gradient(160deg,var(--a-em-soft),#fff)', borderColor: 'var(--a-em-line)' }}>
          <div className="text-[12px] font-semibold text-[var(--a-muted)]">Heard a Live Demo</div>
          <div className="a-num mt-2 text-[33px] font-bold leading-none text-[var(--a-em-deep)]">{stats.transferred}</div>
          <div className="text-[11.5px] mt-1.5 font-medium text-[var(--a-dim)]">transferred into a receptionist</div>
        </div>
        <div className="a-card p-4">
          <div className="text-[12px] font-semibold text-[var(--a-muted)]">Demo Rate</div>
          <div className="a-num mt-2 text-[33px] font-bold leading-none text-[var(--a-ink)]">{transferRate}<span className="text-[20px] align-top">%</span></div>
          <div className="text-[11.5px] mt-1.5 font-medium text-[var(--a-dim)]">callers who asked to hear it</div>
        </div>
      </div>

      {/* CALL LIST */}
      <div className="a-eyebrow mt-8">Calls</div>
      <div className="a-panel">
        <div className="flex items-center gap-3 p-4 border-b border-[var(--a-line)] flex-wrap">
          <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Demo Line Calls</h3>
          <div className="flex gap-1.5 flex-wrap ml-auto">
            {FILTERS.map((f) => (
              <button key={f.key} className="a-chip" data-on={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="a-table">
            <thead>
              <tr>
                <th>Time</th><th>Caller</th><th>What happened</th><th>Summary</th><th className="r">Duration</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--a-em)]" /></div></td></tr>
              ) : calls.length === 0 ? (
                <tr><td colSpan={5}><div className="py-12 text-center text-[var(--a-dim)]">No demo-line calls yet.</div></td></tr>
              ) : calls.map((c) => (
                <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer">
                  <td>{timeAgo(c.created_at)}</td>
                  <td><span className="font-semibold text-[var(--a-ink)] a-num">{formatPhone(c.caller_phone)}</span></td>
                  <td>
                    {c.transferred ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--a-em-deep)]"><PhoneForwarded className="h-3.5 w-3.5" /> Heard a demo</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--a-dim)]"><PhoneMissed className="h-3.5 w-3.5" /> Questions only</span>
                    )}
                  </td>
                  <td><span className="text-[12.5px] text-[var(--a-dim)] line-clamp-1 max-w-[420px] inline-block align-middle">{c.summary || '\u2013'}</span></td>
                  <td className="r a-num">{formatDuration(c.duration_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openId && <DemoCallDrawer callId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

// ── detail drawer ─────────────────────────────────────────────────────────────
function DemoCallDrawer({ callId, onClose }: { callId: string; onClose: () => void }) {
  const [call, setCall] = useState<DemoCallDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    adminGet(`/api/admin/demo-calls/${callId}`)
      .then((d) => { if (live) setCall(d.call || null); })
      .catch((e) => console.error(e))
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [callId]);

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(10,12,14,0.35)' }} onClick={onClose} />
      <div className="admin-scope fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] overflow-y-auto shadow-2xl" style={{ background: 'var(--a-bg, #fff)' }}>
        <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)] sticky top-0" style={{ background: 'var(--a-bg, #fff)' }}>
          <Sparkles className="h-4 w-4 text-[var(--a-em-deep)]" />
          <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Demo line call</h3>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-[#F6FCF9]"><X className="h-4 w-4 text-[var(--a-dim)]" /></button>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--a-em)]" /></div>
        ) : !call ? (
          <div className="py-16 text-center text-[var(--a-dim)]">Call not found.</div>
        ) : (
          <div className="p-4 space-y-5">
            {/* header facts */}
            <div className="grid grid-cols-2 gap-3">
              <Fact label="Caller" value={formatPhone(call.caller_phone)} />
              <Fact label="When" value={timeAgo(call.created_at)} />
              <Fact label="Duration" value={formatDuration(call.duration_seconds)} />
              <Fact label="Outcome" value={call.transferred ? 'Heard a demo' : 'Questions only'} tone={call.transferred ? 'em' : undefined} />
            </div>

            {/* recording */}
            {call.recording_url ? (
              <div>
                <div className="a-eyebrow mb-2">Recording</div>
                <audio controls preload="none" src={call.recording_url} className="w-full" />
              </div>
            ) : (
              <div className="text-[12px] text-[var(--a-dim)]">No recording available.</div>
            )}

            {/* summary */}
            {call.summary && (
              <div>
                <div className="a-eyebrow mb-2">Summary</div>
                <p className="text-[13.5px] text-[var(--a-ink)] leading-relaxed">{call.summary}</p>
              </div>
            )}

            {/* transcript */}
            <div>
              <div className="a-eyebrow mb-2">Transcript</div>
              {call.transcript ? (
                <pre className="text-[12.5px] text-[var(--a-ink)] leading-relaxed whitespace-pre-wrap font-sans rounded-xl p-3.5 border border-[var(--a-line)]" style={{ background: '#FAFBFB' }}>{call.transcript}</pre>
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

function Fact({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl p-3 border border-[var(--a-line)]" style={{ background: '#FAFBFB' }}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--a-muted)]">{label}</div>
      <div className={`text-[14px] font-semibold mt-1 ${tone === 'em' ? 'text-[var(--a-em-deep)]' : 'text-[var(--a-ink)]'}`}>{value}</div>
    </div>
  );
}