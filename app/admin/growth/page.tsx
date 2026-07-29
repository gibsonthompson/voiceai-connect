'use client';

// ============================================================================
// GROWTH: DEMOS
// Demo calls are leads. This is the platform-wide demo surface: who called a
// demo number, how interested they were, and the follow-up window. Reads
// /api/admin/demos. Lives at /admin/growth so the Overview hot-demos link
// resolves here. Row click opens the shared DemoDrawer.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';
import { formatPhone, timeAgo, formatDuration } from '@/lib/admin/format';
import { getDemoInterest } from '@/lib/admin/status';
import DemoDrawer from '@/components/admin/DemoDrawer';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');
async function adminGet(path: string) {
  const res = await fetch(`${backendUrl()}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json();
}

interface DemoRow {
  id: string; created_at: string; caller_phone: string; caller_name: string | null;
  business_name: string | null; business_type: string | null; interest_level: string | null;
  service_discussed: string | null; asked_questions: boolean; vapi_success_score: string | null;
  duration_seconds: number | null; agency_name: string | null;
}

const INTEREST_FILTERS = [
  { key: '', label: 'All' },
  { key: 'high', label: 'High interest' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

const PAGE_SIZE = 30;

export default function AdminGrowthDemosPage() {
  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [interest, setInterest] = useState('');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchDemos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));
      if (interest) params.set('interest', interest);
      const data = await adminGet(`/api/admin/demos?${params.toString()}`);
      setDemos(data.demos || []);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [page, interest]);

  useEffect(() => { fetchDemos(); }, [fetchDemos]);

  const changeInterest = (k: string) => { setInterest(k); setPage(0); };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-ink)]">Demos</h1>
      <p className="mt-1 text-sm text-[var(--a-dim)]">{total.toLocaleString()} demo calls. These are leads: someone called a demo line and heard the AI.</p>

      <div className="flex gap-1.5 flex-wrap mt-6">
        {INTEREST_FILTERS.map((f) => (
          <button key={f.key || 'all'} className="a-chip" data-on={interest === f.key} data-tone={f.key === 'high' ? 'danger' : undefined} onClick={() => changeInterest(f.key)}>{f.label}</button>
        ))}
      </div>

      <div className="a-panel mt-5">
        <div className="overflow-x-auto">
          <table className="a-table">
            <thead>
              <tr>
                <th>Time</th><th>Business / Caller</th><th>Agency</th><th>Interest</th>
                <th className="r">Score</th><th className="r">Duration</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="py-14 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div></td></tr>
              ) : demos.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="py-16 text-center">
                    <Sparkles className="h-7 w-7 mx-auto text-[var(--a-dim)] mb-3" />
                    <p className="text-sm text-[var(--a-muted)]">No demos match this filter.</p>
                  </div>
                </td></tr>
              ) : (
                demos.map((d) => {
                  const it = getDemoInterest(d.interest_level);
                  return (
                    <tr key={d.id} onClick={() => setOpenId(d.id)} className="cursor-pointer">
                      <td>{timeAgo(d.created_at)}</td>
                      <td>
                        <div className="text-[var(--a-ink)] font-medium">{d.business_name || d.business_type || 'Unknown business'}</div>
                        <div className="text-[11.5px] text-[var(--a-dim)] a-num flex items-center gap-1.5">
                          {formatPhone(d.caller_phone)}
                          {d.asked_questions && <><span>&middot;</span><HelpCircle className="h-3 w-3" /> asked</>}
                        </div>
                      </td>
                      <td className="text-[var(--a-muted)]">{d.agency_name || '\u2013'}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: it.color }}>
                          <span className="a-dot" style={{ background: it.color }} />{it.label}
                        </span>
                      </td>
                      <td className="r a-num">{d.vapi_success_score ? `${d.vapi_success_score}/10` : '\u2013'}</td>
                      <td className="r a-num">{formatDuration(d.duration_seconds)}</td>
                    </tr>
                  );
                })
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

      <DemoDrawer demoId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}