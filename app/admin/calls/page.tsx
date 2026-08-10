'use client';

// ============================================================================
// CALLS PAGE (full platform call log)
// The complete, paginated call feed: filter chips, search, agency filter, and
// the shared CallDrawer for detail. Reads /api/admin/calls. Outcome badges use
// deriveCallOutcome so they match the Overview and the SQL feed exactly.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Search, Loader2, PhoneCall, ArrowLeft, ArrowRight, Building2 } from 'lucide-react';
import { formatPhone, timeAgo, formatDuration, formatUSD } from '@/lib/admin/format';
import { deriveCallOutcome, CALL_FILTERS } from '@/lib/admin/status';
import CallDrawer from '@/components/admin/CallDrawer';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');
async function adminGet(path: string) {
  const res = await fetch(`${backendUrl()}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json();
}

interface CallRow {
  id: string; created_at: string; customer_name: string; customer_phone: string;
  duration_seconds: number | null; call_status: string | null; urgency_level: string | null;
  ended_reason: string | null; transfer_status: string | null; is_spam: boolean | null;
  outcome: string; needs_attention: boolean; vapi_cost: number | null;
  business_name: string | null; agency_name: string | null;
}

const PAGE_SIZE = 30;

export default function AdminCallsPage() {
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openAgencyId, setOpenAgencyId] = useState<string | null>(null);

  // Resolve a call's agency to an id from the agency list already loaded for
  // the filter dropdown, so a call can deep-link to its agency without the
  // feed needing to return agency_id. (Swap to a real agency_id if the calls
  // RPC starts selecting one.)
  const agencyIdByName = useMemo(() => {
    const m: Record<string, string> = {};
    agencies.forEach((a) => { if (a.name) m[a.name.toLowerCase()] = a.id; });
    return m;
  }, [agencies]);
  const resolveAgencyId = (name: string | null) => (name ? agencyIdByName[name.toLowerCase()] || null : null);

  const openCall = (c: CallRow) => { setOpenId(c.id); setOpenAgencyId(resolveAgencyId(c.agency_name)); };

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));
      params.set('filter', filter);
      if (appliedSearch) params.set('search', appliedSearch);
      if (agencyId) params.set('agency_id', agencyId);
      const data = await adminGet(`/api/admin/calls?${params.toString()}`);
      setCalls(data.calls || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filter, appliedSearch, agencyId]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  // agency dropdown, fetched once
  useEffect(() => {
    (async () => {
      try {
        const data = await adminGet('/api/admin/agencies?limit=200');
        setAgencies((data.agencies || []).map((a: any) => ({ id: a.id, name: a.name })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const changeFilter = (f: string) => { setFilter(f); setPage(0); };
  const changeAgency = (id: string) => { setAgencyId(id); setPage(0); };
  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); setAppliedSearch(search.trim()); setPage(0); };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-ink)]">Calls</h1>
      <p className="mt-1 text-sm text-[var(--a-dim)]">{total.toLocaleString()} calls across all agencies</p>

      {/* controls */}
      <div className="flex flex-col lg:flex-row gap-3 mt-6">
        <form onSubmit={submitSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
            <input
              className="a-input pl-10"
              placeholder="Search caller number, name, client, or agency"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>
        <select className="a-input lg:w-[240px]" value={agencyId} onChange={(e) => changeAgency(e.target.value)}>
          <option value="">All agencies</option>
          {agencies.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
        </select>
      </div>

      {/* filter chips */}
      <div className="flex gap-1.5 flex-wrap mt-4">
        {CALL_FILTERS.map((f) => (
          <button
            key={f.key}
            className="a-chip"
            data-on={filter === f.key}
            data-tone={f.key === 'attention' ? 'danger' : undefined}
            onClick={() => changeFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* table */}
      <div className="a-panel mt-5">
        <div className="overflow-x-auto">
          <table className="a-table">
            <thead>
              <tr>
                <th>Time</th><th>Caller</th><th>Client / Agency</th><th>Outcome</th>
                <th className="r">Duration</th><th className="r">Cost</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="py-14 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div></td></tr>
              ) : calls.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="py-16 text-center">
                    <PhoneCall className="h-7 w-7 mx-auto text-[var(--a-dim)] mb-3" />
                    <p className="text-sm text-[var(--a-muted)]">No calls match these filters.</p>
                  </div>
                </td></tr>
              ) : (
                calls.map((c) => {
                  const o = deriveCallOutcome(c);
                  const aid = resolveAgencyId(c.agency_name);
                  return (
                    <tr key={c.id} onClick={() => openCall(c)} className="cursor-pointer">
                      <td>
                        {timeAgo(c.created_at)}
                        {c.needs_attention && <span className="a-dot ml-2 align-middle" style={{ background: 'var(--a-red)' }} />}
                      </td>
                      <td><span className="font-semibold text-[var(--a-ink)] a-num">{formatPhone(c.customer_phone)}</span></td>
                      <td>
                        <div className="text-[var(--a-ink)]">{c.business_name || 'Unknown client'}</div>
                        {aid ? (
                          <Link href={`/admin/agencies?expand=${aid}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[11.5px] text-[var(--a-dim)] hover:text-[var(--a-em-deep)] transition-colors">
                            <Building2 className="h-3 w-3" />{c.agency_name}
                          </Link>
                        ) : (
                          <div className="text-[11.5px] text-[var(--a-dim)]">{c.agency_name || 'No agency'}</div>
                        )}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: o.color }}>
                          <span className="a-dot" style={{ background: o.color }} />{o.label}
                        </span>
                      </td>
                      <td className="r a-num">{formatDuration(c.duration_seconds)}</td>
                      <td className="r a-num">{c.vapi_cost != null ? formatUSD(c.vapi_cost) : '\u2013'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* pagination */}
      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[var(--a-dim)]">Page {page + 1} of {totalPages} &middot; {total.toLocaleString()} total</p>
          <div className="flex items-center gap-2">
            <button className="a-btn-ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} style={page === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
              <ArrowLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button className="a-btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} style={page >= totalPages - 1 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <CallDrawer callId={openId} agencyId={openAgencyId} onClose={() => { setOpenId(null); setOpenAgencyId(null); }} />
    </div>
  );
}