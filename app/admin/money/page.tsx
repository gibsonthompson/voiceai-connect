'use client';

// ============================================================================
// MONEY PAGE (merges Expenses + Margin)
// Two views of the same question: are we making money on voice.
//   Estimate  reads /api/admin/expenses. Cost is voice minutes times an
//             editable blended per-minute rate. Surfaces exposure (agencies
//             not metered, whose usage you are eating).
//   Actual    reads /api/admin/margin. Cost is VAPI's real reported per-call
//             figure plus an editable Telnyx rate for whisper minutes. Rows
//             sort thinnest-margin first and drill into per-client cost.
// Emerald on white, shared formatters. Money here is in dollars, not cents.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { JSX } from 'react';
import Link from 'next/link';
import {
  DollarSign, TrendingDown, TrendingUp, AlertTriangle, Loader2, Settings2,
  Check, X, PhoneCall, ShieldCheck, ShieldOff, Pencil, ChevronDown, ChevronRight, Phone,
  Users, Clock, ExternalLink, Layers, Building2, CreditCard, Gift, Ban,
} from 'lucide-react';
import { formatUSD, formatNumber, formatCurrencyCents, formatDate } from '@/lib/admin/format';
import { getPlanBadge, getPlanDisplayName, getStatusBadge } from '@/lib/admin/status';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const authHeaders = (): Record<string, string> => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}` });

// ── Estimate (expenses) types ───────────────────────────────────────────────
interface VoiceCost { blended_per_minute: number; }
interface ExpAgency { agency_id: string; name: string; plan_type: string; billable_clients: number; all_time: { minutes: number; est_cost: number }; this_month: { minutes: number; est_cost: number }; would_bill_month: number; usage_margin_month: number; recovering: boolean; }
interface ExpTotals { total_agencies: number; all_time: { minutes: number; est_cost: number }; this_month: { minutes: number; est_cost: number; would_bill: number; exposure: number; recovering_count: number; not_recovering_count: number }; }

// ── Actual (margin) types ───────────────────────────────────────────────────
interface MarginAgency { agency_id: string; agency_name: string; plan_type: string; billable_clients: number; minutes: number; revenue: number; vapi_cost: number; telnyx_cost: number; total_cost: number; margin: number; margin_pct: number | null; cost_capture_complete: boolean; }
interface ClientRow { client_id: string; voice_routing: string; minutes: number; vapi_cost: number; telnyx_cost: number; total_cost: number; cost_capture_complete: boolean; }
interface MarginTotals { minutes: number; revenue: number; vapi_cost: number; telnyx_cost: number; total_cost: number; margin: number; margin_pct: number | null; }
interface MarginResponse { billing_month: string; telnyx_rate_per_min: number; agencies: MarginAgency[]; totals: MarginTotals; }

const marginColor = (pct: number | null) => {
  if (pct === null) return 'var(--a-muted)';
  if (pct < 0) return 'var(--a-red)';
  if (pct < 30) return 'var(--a-amber)';
  return 'var(--a-em-deep)';
};

// ── Overview (plan + billing status master roster) types ────────────────────
// Reads /api/admin/agencies (the same enriched shape the Agencies page uses).
// total_revenue is integer cents here, so format it with formatCurrencyCents.
interface RosterAgency {
  id: string; name: string; email: string; plan_type: string;
  subscription_status: string; status: string;
  trial_ends_at: string | null; current_period_end: string | null;
  total_revenue: number; client_count: number; created_at: string;
  primary_color: string | null;
}

type StatusBucketKey = 'active' | 'trialing' | 'past_due' | 'canceled' | 'pending' | 'other';

function statusBucket(a: RosterAgency): StatusBucketKey {
  const s = a.subscription_status || a.status || '';
  if (s === 'active') return 'active';
  if (s === 'trial' || s === 'trialing') return 'trialing';
  if (s === 'past_due') return 'past_due';
  if (s === 'canceled' || s === 'suspended') return 'canceled';
  if (s === 'pending' || s === 'pending_payment') return 'pending';
  return 'other';
}

// A paying agency is on an active paid plan (Free active is counted as Free,
// not paying, since Free has no platform fee).
function isPaying(a: RosterAgency) {
  return statusBucket(a) === 'active' && getPlanDisplayName(a.plan_type) !== 'Free';
}

function trialDaysLeft(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5);
}

const ROSTER_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paying', label: 'Paying' },
  { key: 'trialing', label: 'On trial' },
  { key: 'free', label: 'Free plan' },
  { key: 'past_due', label: 'Past due' },
  { key: 'canceled', label: 'Canceled' },
];

export default function AdminMoneyPage() {
  const [view, setView] = useState<'overview' | 'estimate' | 'actual'>('overview');
  const [loading, setLoading] = useState(true);

  // overview (plan + billing status roster)
  const [roster, setRoster] = useState<RosterAgency[]>([]);
  const [rosterFilter, setRosterFilter] = useState('all');

  // estimate
  const [expAgencies, setExpAgencies] = useState<ExpAgency[]>([]);
  const [expTotals, setExpTotals] = useState<ExpTotals | null>(null);
  const [voiceCost, setVoiceCost] = useState<VoiceCost | null>(null);
  const [editingBlended, setEditingBlended] = useState(false);
  const [blendedInput, setBlendedInput] = useState('');
  const [savingBlended, setSavingBlended] = useState(false);

  // actual
  const [margin, setMargin] = useState<MarginResponse | null>(null);
  const [editingTelnyx, setEditingTelnyx] = useState(false);
  const [telnyxInput, setTelnyxInput] = useState('');
  const [savingTelnyx, setSavingTelnyx] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clientRows, setClientRows] = useState<Record<string, ClientRow[]>>({});
  const [clientLoading, setClientLoading] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl()}/api/admin/expenses`, { headers: authHeaders() });
      if (!res.ok) throw new Error('expenses failed');
      const data = await res.json();
      setExpAgencies(data.agencies || []);
      setExpTotals(data.totals || null);
      setVoiceCost(data.voice_cost || null);
      setBlendedInput(String(data.voice_cost?.blended_per_minute ?? ''));
    } catch (e) { console.error(e); }
  }, []);

  const fetchMargin = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl()}/api/admin/margin`, { headers: authHeaders() });
      if (!res.ok) throw new Error('margin failed');
      const data: MarginResponse = await res.json();
      setMargin(data);
      setTelnyxInput(String(data.telnyx_rate_per_min ?? ''));
    } catch (e) { console.error(e); }
  }, []);

  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl()}/api/admin/agencies?limit=200`, { headers: authHeaders() });
      if (!res.ok) throw new Error('agencies failed');
      const data = await res.json();
      setRoster(data.agencies || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    (async () => { await Promise.all([fetchExpenses(), fetchMargin(), fetchRoster()]); setLoading(false); })();
  }, [fetchExpenses, fetchMargin, fetchRoster]);

  const saveBlended = async () => {
    const n = parseFloat(blendedInput);
    if (Number.isNaN(n) || n < 0) return;
    setSavingBlended(true);
    try {
      const res = await fetch(`${backendUrl()}/api/admin/expenses/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ blended_per_minute: n }) });
      if (res.ok) { setEditingBlended(false); await fetchExpenses(); }
    } catch (e) { console.error(e); } finally { setSavingBlended(false); }
  };

  const saveTelnyx = async () => {
    const n = parseFloat(telnyxInput);
    if (Number.isNaN(n) || n < 0) return;
    setSavingTelnyx(true);
    try {
      const res = await fetch(`${backendUrl()}/api/admin/margin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ telnyx_cost_per_minute: n }) });
      if (res.ok) { setEditingTelnyx(false); await fetchMargin(); }
    } catch (e) { console.error(e); } finally { setSavingTelnyx(false); }
  };

  const toggleAgency = async (agencyId: string) => {
    if (expanded === agencyId) { setExpanded(null); return; }
    setExpanded(agencyId);
    if (clientRows[agencyId]) return;
    setClientLoading(agencyId);
    try {
      const res = await fetch(`${backendUrl()}/api/admin/margin?agencyId=${agencyId}`, { headers: authHeaders() });
      if (res.ok) { const json = await res.json(); setClientRows((p) => ({ ...p, [agencyId]: json.clients || [] })); }
    } catch (e) { console.error(e); } finally { setClientLoading(null); }
  };

  const planBadge = (p: string) => { const b = getPlanBadge(p); return <span className="rounded-md border px-2 py-0.5 text-[10px] font-medium" style={{ color: b.color, background: b.bg, borderColor: b.border }}>{getPlanDisplayName(p)}</span>; };

  if (loading) {
    return <div className="admin-scope p-6 flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div>;
  }

  const sortedMargin = margin ? [...margin.agencies].sort((a, b) => (a.margin_pct === null ? Infinity : a.margin_pct) - (b.margin_pct === null ? Infinity : b.margin_pct)) : [];
  const anyPending = margin?.agencies.some((a) => !a.cost_capture_complete);

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--a-ink)] tracking-tight">Money</h1>
          <p className="mt-1 text-sm text-[var(--a-dim)]">{view === 'overview' ? 'Who is paying, who is on trial, and who is on Free, at a glance.' : view === 'estimate' ? 'Modeled voice cost vs what you bill, and what you are eating.' : `Actual margin from VAPI reported cost. Billing month ${margin?.billing_month || ''}.`}</p>
        </div>

        {view === 'overview' ? null : view === 'estimate' ? (
          <div className="a-card px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--a-amber-soft)' }}><Settings2 className="h-4 w-4" style={{ color: 'var(--a-amber)' }} /></div>
            <div>
              <p className="text-[10px] text-[var(--a-dim)] uppercase tracking-[0.1em]">Blended cost / min</p>
              {editingBlended ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[var(--a-dim)] text-sm">$</span>
                  <input autoFocus type="number" step="0.001" value={blendedInput} onChange={(e) => setBlendedInput(e.target.value)} className="w-20 a-input !h-8 !px-2" />
                  <button onClick={saveBlended} disabled={savingBlended} className="p-1 rounded-md" style={{ color: 'var(--a-em-deep)' }}>{savingBlended ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}</button>
                  <button onClick={() => { setEditingBlended(false); setBlendedInput(String(voiceCost?.blended_per_minute ?? '')); }} className="p-1 rounded-md text-[var(--a-dim)]"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <button onClick={() => setEditingBlended(true)} className="text-lg font-semibold text-[var(--a-ink)] a-num hover:text-[var(--a-em-deep)] transition-colors">${(voiceCost?.blended_per_minute ?? 0).toFixed(3)}</button>
              )}
            </div>
          </div>
        ) : (
          <div className="a-card p-3 min-w-[220px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[var(--a-dim)]">Telnyx rate / min</span>
              {!editingTelnyx && <button onClick={() => { setTelnyxInput(String(margin?.telnyx_rate_per_min ?? '')); setEditingTelnyx(true); }} className="text-[var(--a-dim)] hover:text-[var(--a-muted)] transition-colors"><Pencil className="h-3.5 w-3.5" /></button>}
            </div>
            {editingTelnyx ? (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[var(--a-muted)] text-sm">$</span>
                <input type="number" step="0.001" min="0" value={telnyxInput} onChange={(e) => setTelnyxInput(e.target.value)} className="w-20 a-input !h-8 !px-2" autoFocus />
                <button onClick={saveTelnyx} disabled={savingTelnyx} className="p-1 rounded-md" style={{ color: 'var(--a-em-deep)' }}>{savingTelnyx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}</button>
                <button onClick={() => setEditingTelnyx(false)} className="p-1 rounded-md text-[var(--a-dim)]"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <p className="mt-1 text-lg font-semibold text-[var(--a-ink)] a-num">${(margin?.telnyx_rate_per_min ?? 0).toFixed(4)}</p>
            )}
            <p className="mt-1 text-[10px] text-[var(--a-dim)]">Applied to whisper (telnyx_cc) minutes only</p>
          </div>
        )}
      </div>

      {/* view toggle */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        <button className="a-chip" data-on={view === 'overview'} onClick={() => setView('overview')}>Overview (plans &amp; status)</button>
        <button className="a-chip" data-on={view === 'estimate'} onClick={() => setView('estimate')}>Estimate (cost model)</button>
        <button className="a-chip" data-on={view === 'actual'} onClick={() => setView('actual')}>Actual (VAPI cost)</button>
      </div>

      {view === 'overview' && (
        <MoneyOverview roster={roster} filter={rosterFilter} setFilter={setRosterFilter} planBadge={planBadge} />
      )}

      {view === 'estimate' && expTotals && (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="col-span-2 lg:col-span-1 a-card p-5" style={{ background: 'linear-gradient(160deg,#FFF3F3,#fff)', borderColor: '#F3C9C9' }}>
              <div className="flex items-center justify-between"><p className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: 'var(--a-red)' }}>Exposure / mo</p><AlertTriangle className="h-4 w-4" style={{ color: 'var(--a-red)' }} /></div>
              <p className="mt-2 text-3xl font-semibold text-[var(--a-ink)] tracking-tight a-num">{formatUSD(expTotals.this_month.exposure)}</p>
              <p className="mt-1.5 text-[11px] text-[var(--a-dim)]"><span style={{ color: 'var(--a-red)' }}>{expTotals.this_month.not_recovering_count}</span> agencies not metered</p>
            </div>
            <MoneyCard label="Cost This Month" value={formatUSD(expTotals.this_month.est_cost)} sub={`${formatNumber(expTotals.this_month.minutes)} min`} icon={TrendingDown} tint="amber" />
            <MoneyCard label="Cost All-Time" value={formatUSD(expTotals.all_time.est_cost)} sub={`${formatNumber(expTotals.all_time.minutes)} min`} icon={PhoneCall} tint="slate" />
            <MoneyCard label="Recovering" value={`${expTotals.this_month.recovering_count}/${expTotals.total_agencies}`} sub={`would bill ${formatUSD(expTotals.this_month.would_bill)}`} icon={ShieldCheck} tint="em" />
          </div>

          <div className="a-panel">
            <div className="px-5 lg:px-6 py-4 border-b border-[var(--a-line)] flex items-center gap-2.5"><DollarSign className="h-4 w-4 text-[var(--a-dim)]" /><h2 className="text-sm font-semibold text-[var(--a-ink)]">Cost by Agency</h2><span className="text-[11px] text-[var(--a-dim)]">sorted by all-time cost</span></div>
            {expAgencies.length === 0 ? (<div className="p-16 text-center text-sm text-[var(--a-dim)]">No usage data yet</div>) : (
              <div className="overflow-x-auto"><table className="a-table"><thead><tr><th>Agency</th><th>Plan</th><th className="r">Min (mo)</th><th className="r">Min (all)</th><th className="r">Cost (mo)</th><th className="r">Cost (all)</th><th className="r">Would Bill (mo)</th><th className="r">Usage Margin</th><th className="r">Metered</th></tr></thead>
                <tbody>
                  {expAgencies.map((a) => (
                    <tr key={a.agency_id}>
                      <td><Link href={`/admin/agencies?expand=${a.agency_id}`} className="inline-block max-w-[200px] truncate text-[13px] font-semibold text-[var(--a-ink)] hover:text-[var(--a-em-deep)] hover:underline">{a.name}</Link><p className="text-[11px] text-[var(--a-dim)]">{a.billable_clients} billable client{a.billable_clients !== 1 ? 's' : ''}</p></td>
                      <td>{planBadge(a.plan_type)}</td>
                      <td className="r a-num">{formatNumber(a.this_month.minutes)}</td>
                      <td className="r a-num" style={{ color: 'var(--a-dim)' }}>{formatNumber(a.all_time.minutes)}</td>
                      <td className="r a-num" style={{ color: 'var(--a-amber)' }}>{formatUSD(a.this_month.est_cost)}</td>
                      <td className="r a-num">{formatUSD(a.all_time.est_cost)}</td>
                      <td className="r a-num" style={{ color: 'var(--a-dim)' }}>{formatUSD(a.would_bill_month)}</td>
                      <td className="r a-num" style={{ color: a.usage_margin_month >= 0 ? 'var(--a-em-deep)' : 'var(--a-red)' }}>{a.usage_margin_month >= 0 ? '+' : ''}{formatUSD(a.usage_margin_month)}</td>
                      <td className="r">{a.recovering ? <span title="Usage billing enabled" className="inline-flex"><ShieldCheck className="h-4 w-4" style={{ color: 'var(--a-em-deep)' }} /></span> : <span title="Not metered, you are eating this" className="inline-flex"><ShieldOff className="h-4 w-4" style={{ color: 'var(--a-red)' }} /></span>}</td>
                    </tr>
                  ))}
                </tbody></table></div>
            )}
          </div>
          <p className="mt-4 text-xs text-[var(--a-dim)]">Cost = voice minutes times blended rate ({voiceCost ? `$${voiceCost.blended_per_minute.toFixed(3)}/min` : '\u2013'}). "Would Bill" is platform fee plus per-client plus per-minute at the agency plan rates. Usage margin excludes the flat platform fee.</p>
        </>
      )}

      {view === 'actual' && margin && (
        <>
          {anyPending && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl p-3 border" style={{ background: 'var(--a-amber-soft)', borderColor: '#F0DCA8' }}>
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--a-amber)' }} />
              <p className="text-xs" style={{ color: 'var(--a-amber)' }}>Some calls this month have no captured cost yet. VAPI cost is captured on new calls going forward, so margin fills in as calls come in. Rows with incomplete capture are marked.</p>
            </div>
          )}

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
            <MarginTotal label="Revenue" value={formatUSD(margin.totals.revenue)} icon={DollarSign} tone="neutral" />
            <MarginTotal label="Total Cost" value={formatUSD(margin.totals.total_cost)} icon={Phone} tone="neutral" sub={`VAPI ${formatUSD(margin.totals.vapi_cost)} + Telnyx ${formatUSD(margin.totals.telnyx_cost)}`} />
            <MarginTotal label="Margin" value={formatUSD(margin.totals.margin)} icon={margin.totals.margin >= 0 ? TrendingUp : TrendingDown} tone={margin.totals.margin >= 0 ? 'good' : 'bad'} />
            <MarginTotal label="Margin %" value={margin.totals.margin_pct === null ? 'n/a' : `${margin.totals.margin_pct}%`} icon={margin.totals.margin_pct !== null && margin.totals.margin_pct >= 0 ? TrendingUp : TrendingDown} tone={margin.totals.margin_pct === null ? 'neutral' : margin.totals.margin_pct < 0 ? 'bad' : margin.totals.margin_pct < 30 ? 'warn' : 'good'} />
          </div>

          <div className="a-panel">
            <div className="px-5 py-4 border-b border-[var(--a-line)]"><h2 className="text-sm font-semibold text-[var(--a-ink)]">By Agency</h2><p className="text-[11px] text-[var(--a-dim)] mt-0.5">Sorted by thinnest margin first</p></div>
            <div className="hidden md:grid grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr_0.9fr_0.9fr_0.9fr_0.7fr] gap-2 px-5 py-2.5 text-[10px] uppercase tracking-wider text-[var(--a-dim)] border-b border-[var(--a-line)]" style={{ background: '#F8FCFA' }}>
              <div>Agency</div><div>Plan</div><div className="text-right">Clients</div><div className="text-right">Minutes</div><div className="text-right">Revenue</div><div className="text-right">Cost</div><div className="text-right">Margin</div><div className="text-right">%</div>
            </div>
            <div className="divide-y divide-[var(--a-line)]">
              {sortedMargin.map((a) => {
                const isOpen = expanded === a.agency_id;
                return (
                  <div key={a.agency_id}>
                    <div role="button" tabIndex={0} onClick={() => toggleAgency(a.agency_id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAgency(a.agency_id); } }} className="w-full grid grid-cols-2 md:grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr_0.9fr_0.9fr_0.9fr_0.7fr] gap-2 px-5 py-3 text-left hover:bg-[#F6FCF9] transition-colors items-center cursor-pointer">
                      <div className="flex items-center gap-2 min-w-0">
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-[var(--a-dim)] flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-[var(--a-dim)] flex-shrink-0" />}
                        <Link href={`/admin/agencies?expand=${a.agency_id}`} onClick={(e) => e.stopPropagation()} className="text-sm text-[var(--a-ink)] truncate hover:text-[var(--a-em-deep)] hover:underline">{a.agency_name}</Link>
                        {!a.cost_capture_complete && <span className="flex-shrink-0 rounded-full text-[9px] px-1.5 py-0.5" style={{ background: 'var(--a-amber-soft)', color: 'var(--a-amber)' }}>partial</span>}
                      </div>
                      <div className="text-xs text-[var(--a-muted)] capitalize hidden md:block">{getPlanDisplayName(a.plan_type)}</div>
                      <div className="text-sm text-[var(--a-muted)] a-num text-right hidden md:block">{a.billable_clients}</div>
                      <div className="text-sm text-[var(--a-muted)] a-num text-right hidden md:block">{a.minutes}</div>
                      <div className="text-sm text-[var(--a-ink)] a-num text-right hidden md:block">{formatUSD(a.revenue)}</div>
                      <div className="text-sm text-[var(--a-muted)] a-num text-right hidden md:block">{formatUSD(a.total_cost)}</div>
                      <div className="text-sm a-num text-right font-medium hidden md:block" style={{ color: marginColor(a.margin_pct) }}>{formatUSD(a.margin)}</div>
                      <div className="text-sm a-num text-right hidden md:block" style={{ color: marginColor(a.margin_pct) }}>{a.margin_pct === null ? 'n/a' : `${a.margin_pct}%`}</div>
                      <div className="md:hidden text-right"><div className="text-sm font-medium" style={{ color: marginColor(a.margin_pct) }}>{formatUSD(a.margin)}</div><div className="text-[11px] text-[var(--a-dim)]">{a.minutes} min &middot; {formatUSD(a.revenue)}</div></div>
                    </div>
                    {isOpen && (
                      <div className="px-5 py-3 border-t border-[var(--a-line)]" style={{ background: '#F8FCFA' }}>
                        {clientLoading === a.agency_id ? (
                          <div className="flex items-center gap-2 text-xs text-[var(--a-dim)] py-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading clients...</div>
                        ) : (clientRows[a.agency_id] && clientRows[a.agency_id].length > 0) ? (
                          <div className="space-y-1.5">
                            <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.9fr] gap-2 text-[10px] uppercase tracking-wider text-[var(--a-dim)] pb-1"><div>Client</div><div>Routing</div><div className="text-right">Minutes</div><div className="text-right">VAPI</div><div className="text-right">Total Cost</div></div>
                            {clientRows[a.agency_id].map((c) => (
                              <div key={c.client_id} className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.9fr] gap-2 text-xs items-center py-1">
                                <div className="text-[var(--a-muted)] truncate font-mono text-[11px]">{c.client_id.slice(0, 8)}</div>
                                <div className="text-[var(--a-dim)]">{c.voice_routing === 'telnyx_cc' ? 'whisper' : 'direct'}</div>
                                <div className="text-[var(--a-muted)] a-num text-right">{c.minutes}</div>
                                <div className="text-[var(--a-muted)] a-num text-right">{formatUSD(c.vapi_cost)}</div>
                                <div className="text-[var(--a-ink)] a-num text-right">{formatUSD(c.total_cost)}</div>
                              </div>
                            ))}
                          </div>
                        ) : (<p className="text-xs text-[var(--a-dim)] py-2">No usage this month.</p>)}
                      </div>
                    )}
                  </div>
                );
              })}
              {sortedMargin.length === 0 && <div className="px-5 py-12 text-center text-sm text-[var(--a-dim)]">No agencies with usage this month.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MoneyCard({ label, value, sub, icon: Icon, tint }: { label: string; value: string; sub: string; icon: any; tint: 'amber' | 'em' | 'slate' }) {
  const tints: Record<string, { bg: string; color: string }> = {
    amber: { bg: 'var(--a-amber-soft)', color: 'var(--a-amber)' },
    em: { bg: 'var(--a-em-soft)', color: 'var(--a-em-deep)' },
    slate: { bg: '#EEF3EF', color: 'var(--a-muted)' },
  };
  return (
    <div className="a-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[10px] font-medium text-[var(--a-muted)] uppercase tracking-[0.1em]">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--a-ink)] a-num">{value}</p><p className="mt-1 text-[11px] text-[var(--a-dim)]">{sub}</p></div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: tints[tint].bg }}><Icon className="h-[18px] w-[18px]" style={{ color: tints[tint].color }} /></div>
      </div>
    </div>
  );
}

function MarginTotal({ label, value, icon: Icon, tone, sub }: { label: string; value: string; icon: any; tone: 'neutral' | 'good' | 'bad' | 'warn'; sub?: string }) {
  const color = tone === 'good' ? 'var(--a-em-deep)' : tone === 'bad' ? 'var(--a-red)' : tone === 'warn' ? 'var(--a-amber)' : 'var(--a-ink)';
  const bg = tone === 'good' ? 'var(--a-em-soft)' : tone === 'bad' ? 'var(--a-red-soft)' : tone === 'warn' ? 'var(--a-amber-soft)' : '#EEF3EF';
  return (
    <div className="a-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-medium text-[var(--a-muted)] uppercase tracking-[0.1em]">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight a-num" style={{ color }}>{value}</p>{sub && <p className="mt-1.5 text-[11px] text-[var(--a-dim)] truncate">{sub}</p>}</div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: bg }}><Icon className="h-5 w-5" style={{ color }} /></div>
      </div>
    </div>
  );
}

// ============================================================================
// MONEY OVERVIEW (master roster)
// The billing-status answer: who is Paying, who is on Trial, who is on Free,
// who is Past due, and who is Canceled. Built entirely from real agency fields
// (plan_type, subscription_status, trial_ends_at, total_revenue in cents), so
// every number maps to a row you can click straight into.
// ============================================================================
function MoneyOverview({
  roster, filter, setFilter, planBadge,
}: {
  roster: RosterAgency[];
  filter: string;
  setFilter: (f: string) => void;
  planBadge: (p: string) => JSX.Element;
}) {
  const total = roster.length;
  const paying = roster.filter(isPaying).length;
  const trialing = roster.filter(a => statusBucket(a) === 'trialing').length;
  const free = roster.filter(a => getPlanDisplayName(a.plan_type) === 'Free').length;
  const pastDue = roster.filter(a => statusBucket(a) === 'past_due').length;
  const canceled = roster.filter(a => statusBucket(a) === 'canceled').length;
  const collected = roster.reduce((s, a) => s + (a.total_revenue || 0), 0);

  // plan x status matrix
  const planOrder = ['Free', 'Pro', 'Scale'];
  const present = Array.from(new Set(roster.map(a => getPlanDisplayName(a.plan_type))));
  const plans = [...planOrder.filter(p => present.includes(p)), ...present.filter(p => !planOrder.includes(p))];
  const cols: { key: StatusBucketKey; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'trialing', label: 'Trial' },
    { key: 'past_due', label: 'Past due' },
    { key: 'pending', label: 'Pending' },
    { key: 'canceled', label: 'Canceled' },
  ];
  const cell = (plan: string, key: StatusBucketKey) => roster.filter(a => getPlanDisplayName(a.plan_type) === plan && statusBucket(a) === key).length;
  const planTotal = (plan: string) => roster.filter(a => getPlanDisplayName(a.plan_type) === plan).length;
  const planRevenue = (plan: string) => roster.filter(a => getPlanDisplayName(a.plan_type) === plan).reduce((s, a) => s + (a.total_revenue || 0), 0);

  // roster list (filtered)
  const filtered = roster.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'paying') return isPaying(a);
    if (filter === 'free') return getPlanDisplayName(a.plan_type) === 'Free';
    return statusBucket(a) === filter;
  });
  const sorted = filter === 'trialing'
    ? [...filtered].sort((a, b) => (trialDaysLeft(a.trial_ends_at) ?? 9999) - (trialDaysLeft(b.trial_ends_at) ?? 9999))
    : [...filtered].sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0) || (a.name || '').localeCompare(b.name || ''));

  if (total === 0) {
    return <div className="a-panel p-16 text-center text-sm text-[var(--a-dim)]">No agencies yet.</div>;
  }

  return (
    <>
      {/* status tiles */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-6 mb-8">
        <OverviewTile label="Total agencies" value={String(total)} sub="on the platform" icon={Building2} tint="slate" />
        <OverviewTile label="Paying" value={String(paying)} sub="active paid plan" icon={CreditCard} tint="em" onClick={() => setFilter('paying')} active={filter === 'paying'} />
        <OverviewTile label="On trial" value={String(trialing)} sub="worth converting" icon={Clock} tint="cyan" onClick={() => setFilter('trialing')} active={filter === 'trialing'} />
        <OverviewTile label="Free plan" value={String(free)} sub="no platform fee" icon={Gift} tint="slate" onClick={() => setFilter('free')} active={filter === 'free'} />
        <OverviewTile label="Past due" value={String(pastDue)} sub="billing needs action" icon={AlertTriangle} tint="red" onClick={() => setFilter('past_due')} active={filter === 'past_due'} />
        <OverviewTile label="Collected" value={formatCurrencyCents(collected)} sub="all time" icon={DollarSign} tint="em" />
      </div>

      {/* plan x status matrix */}
      <div className="a-panel mb-8">
        <div className="px-5 lg:px-6 py-4 border-b border-[var(--a-line)] flex items-center gap-2.5">
          <Layers className="h-4 w-4 text-[var(--a-dim)]" />
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">Plan and status breakdown</h2>
          <span className="text-[11px] text-[var(--a-dim)]">counts by plan, collected revenue at right</span>
        </div>
        <div className="overflow-x-auto">
          <table className="a-table">
            <thead>
              <tr>
                <th>Plan</th>
                {cols.map(c => <th key={c.key} className="r">{c.label}</th>)}
                <th className="r">Total</th>
                <th className="r">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan}>
                  <td>{planBadge(plan.toLowerCase())}</td>
                  {cols.map(c => {
                    const n = cell(plan, c.key);
                    return <td key={c.key} className="r a-num" style={{ color: n === 0 ? 'var(--a-dim)' : c.key === 'past_due' ? 'var(--a-amber)' : c.key === 'canceled' ? 'var(--a-red)' : 'var(--a-ink)' }}>{n || '\u2013'}</td>;
                  })}
                  <td className="r a-num font-semibold text-[var(--a-ink)]">{planTotal(plan)}</td>
                  <td className="r a-num" style={{ color: planRevenue(plan) > 0 ? 'var(--a-em-deep)' : 'var(--a-dim)' }}>{planRevenue(plan) > 0 ? formatCurrencyCents(planRevenue(plan)) : '\u2013'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* roster */}
      <div className="a-panel">
        <div className="px-5 py-4 border-b border-[var(--a-line)] flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5"><Users className="h-4 w-4 text-[var(--a-dim)]" /><h2 className="text-sm font-semibold text-[var(--a-ink)]">Roster</h2></div>
          <div className="flex gap-1.5 flex-wrap ml-auto">
            {ROSTER_FILTERS.map(f => (
              <button key={f.key} className="a-chip" data-on={filter === f.key} data-tone={f.key === 'past_due' ? 'danger' : undefined} onClick={() => setFilter(f.key)}>{f.label}</button>
            ))}
          </div>
        </div>
        <div className="p-1.5">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[var(--a-dim)]">No agencies in this bucket.</div>
          ) : sorted.map(a => {
            const b = getStatusBadge(a.subscription_status || a.status);
            const days = trialDaysLeft(a.trial_ends_at);
            const isTrial = statusBucket(a) === 'trialing';
            return (
              <Link key={a.id} href={`/admin/agencies?expand=${a.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F6FCF9] transition-colors">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] shrink-0 border border-[var(--a-line)] bg-white">
                  {a.primary_color ? <span className="h-3.5 w-3.5 rounded" style={{ backgroundColor: a.primary_color }} /> : <Building2 className="h-3.5 w-3.5 text-[var(--a-dim)]" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-[var(--a-ink)] truncate">{a.name || 'Unnamed'}</span>
                    {planBadge(a.plan_type)}
                  </div>
                  <div className="text-[11.5px] text-[var(--a-dim)] truncate">
                    {[a.email, `${a.client_count} client${a.client_count === 1 ? '' : 's'}`].filter(Boolean).join(' \u00b7 ')}
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end shrink-0">
                  <span className="a-num text-[13px] font-semibold" style={{ color: a.total_revenue > 0 ? 'var(--a-em-deep)' : 'var(--a-dim)' }}>{a.total_revenue > 0 ? formatCurrencyCents(a.total_revenue) : '\u2013'}</span>
                  {isTrial && days != null ? (
                    <span className="text-[11px]" style={{ color: days <= 3 ? 'var(--a-red)' : 'var(--a-cyan)' }}>{days < 0 ? 'trial expired' : days === 0 ? 'ends today' : `${days}d left`}</span>
                  ) : a.current_period_end ? (
                    <span className="text-[11px] text-[var(--a-dim)]">renews {formatDate(a.current_period_end)}</span>
                  ) : null}
                </div>
                <span className="rounded-md border px-2 py-0.5 text-[10px] font-medium shrink-0" style={{ color: b.color, background: b.bg, borderColor: b.border }}>{b.label}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-xs text-[var(--a-dim)]">Paying counts agencies on an active paid plan. Free active agencies are counted under Free, not Paying. Revenue is collected payments to date, not projected MRR.</p>
    </>
  );
}

function OverviewTile({
  label, value, sub, icon: Icon, tint, onClick, active,
}: {
  label: string; value: string; sub: string; icon: any;
  tint: 'em' | 'cyan' | 'red' | 'slate'; onClick?: () => void; active?: boolean;
}) {
  const tints: Record<string, { bg: string; color: string }> = {
    em: { bg: 'var(--a-em-soft)', color: 'var(--a-em-deep)' },
    cyan: { bg: 'var(--a-cyan-soft)', color: 'var(--a-cyan)' },
    red: { bg: 'var(--a-red-soft)', color: 'var(--a-red)' },
    slate: { bg: '#EEF3EF', color: 'var(--a-muted)' },
  };
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick} className="a-card p-4 text-left transition-transform hover:-translate-y-px" style={active ? { borderColor: tints[tint].color } : undefined}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium text-[var(--a-muted)] uppercase tracking-[0.1em]">{label}</p>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ background: tints[tint].bg }}><Icon className="h-3.5 w-3.5" style={{ color: tints[tint].color }} /></div>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight a-num" style={{ color: tints[tint].color }}>{value}</p>
      <p className="mt-1 text-[11px] text-[var(--a-dim)]">{sub}</p>
    </Comp>
  );
}