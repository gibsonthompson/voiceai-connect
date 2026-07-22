'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Loader2, ChevronDown, ChevronRight,
  Phone, AlertTriangle, Check, Pencil, X,
} from 'lucide-react';

// ============================================================================
// PLATFORM ADMIN: MARGIN / UNIT ECONOMICS PAGE
// Reads GET /api/admin/margin (per-agency revenue, actual VAPI cost, Telnyx
// leg, margin) and GET/PUT /api/admin/margin/settings (editable Telnyx rate).
// Cost comes from VAPI's own reported per-call figure captured on the webhook,
// so margin is actual, not estimated. Rows sort worst-margin first so loss
// makers surface immediately. Per-agency drill-in shows which clients burn cost.
// ============================================================================

interface AgencyRow {
  agency_id: string;
  agency_name: string;
  plan_type: string;
  billable_clients: number;
  minutes: number;
  revenue: number;
  vapi_cost: number;
  telnyx_cost: number;
  total_cost: number;
  margin: number;
  margin_pct: number | null;
  cost_capture_complete: boolean;
  usage_rows: number;
  cost_captured_rows: number;
}

interface ClientRow {
  client_id: string;
  voice_routing: string;
  minutes: number;
  vapi_cost: number;
  telnyx_cost: number;
  total_cost: number;
  cost_capture_complete: boolean;
}

interface Totals {
  minutes: number;
  revenue: number;
  vapi_cost: number;
  telnyx_cost: number;
  total_cost: number;
  margin: number;
  margin_pct: number | null;
}

interface MarginResponse {
  billing_month: string;
  telnyx_rate_per_min: number;
  agencies: AgencyRow[];
  totals: Totals;
}

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);

const marginColor = (pct: number | null) => {
  if (pct === null) return 'text-white/60';
  if (pct < 0) return 'text-red-400';
  if (pct < 30) return 'text-amber-400';
  return 'text-emerald-400';
};

function backendUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
}
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
  return { Authorization: `Bearer ${token}` };
}

export default function AdminMarginPage() {
  const [data, setData] = useState<MarginResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [clientRows, setClientRows] = useState<Record<string, ClientRow[]>>({});
  const [clientLoading, setClientLoading] = useState<string | null>(null);

  const [rate, setRate] = useState<number | null>(null);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  const fetchMargin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl()}/api/admin/margin`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load margin');
      const json: MarginResponse = await res.json();
      setData(json);
      setRate(json.telnyx_rate_per_min);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMargin(); }, [fetchMargin]);

  const toggleAgency = async (agencyId: string) => {
    if (expanded === agencyId) { setExpanded(null); return; }
    setExpanded(agencyId);
    if (clientRows[agencyId]) return;
    setClientLoading(agencyId);
    try {
      const res = await fetch(`${backendUrl()}/api/admin/margin?agencyId=${agencyId}`, { headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        setClientRows((prev) => ({ ...prev, [agencyId]: json.clients || [] }));
      }
    } catch {
      // leave empty on failure
    } finally {
      setClientLoading(null);
    }
  };

  const saveRate = async () => {
    const parsed = parseFloat(rateInput);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setSavingRate(true);
    try {
      const res = await fetch(`${backendUrl()}/api/admin/margin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ telnyx_cost_per_minute: parsed }),
      });
      if (res.ok) {
        setEditingRate(false);
        await fetchMargin(); // recompute margin with the new rate
      }
    } finally {
      setSavingRate(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-[1400px]">
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-400">
          {error || 'No data'}
        </div>
      </div>
    );
  }

  const t = data.totals;
  const anyPending = data.agencies.some((a) => !a.cost_capture_complete);
  const sorted = [...data.agencies].sort((a, b) => {
    const am = a.margin_pct === null ? Infinity : a.margin_pct;
    const bm = b.margin_pct === null ? Infinity : b.margin_pct;
    return am - bm;
  });

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span className="text-white/40 text-sm">Unit economics</span>
          <h1 className="text-[26px] font-semibold text-white tracking-tight">Margin</h1>
          <p className="mt-1 text-xs text-white/40">Billing month {data.billing_month}. Cost is VAPI&apos;s actual reported per-call cost.</p>
        </div>
        {/* Telnyx rate editor */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 min-w-[220px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-white/40">Telnyx rate / min</span>
            {!editingRate && (
              <button
                onClick={() => { setRateInput(String(rate ?? '')); setEditingRate(true); }}
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {editingRate ? (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-white/50 text-sm">$</span>
              <input
                type="number"
                step="0.001"
                min="0"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="w-20 rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500/40"
                autoFocus
              />
              <button onClick={saveRate} disabled={savingRate} className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50">
                {savingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
              <button onClick={() => setEditingRate(false)} className="p-1 rounded-md text-white/40 hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="mt-1 text-lg font-semibold text-white tabular-nums">${(rate ?? 0).toFixed(4)}</p>
          )}
          <p className="mt-1 text-[10px] text-white/30">Applied to whisper (telnyx_cc) minutes only</p>
        </div>
      </div>

      {anyPending && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300/90">
            Some calls this month have no captured cost yet. VAPI cost is captured on new calls going forward, so margin fills in as calls come in. Rows with incomplete capture are marked.
          </p>
        </div>
      )}

      {/* Totals */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <TotalCard label="Revenue" value={money(t.revenue)} icon={DollarSign} tone="neutral" />
        <TotalCard label="Total Cost" value={money(t.total_cost)} icon={Phone} tone="neutral" sub={`VAPI ${money(t.vapi_cost)} + Telnyx ${money(t.telnyx_cost)}`} />
        <TotalCard
          label="Margin"
          value={money(t.margin)}
          icon={t.margin >= 0 ? TrendingUp : TrendingDown}
          tone={t.margin >= 0 ? 'good' : 'bad'}
        />
        <TotalCard
          label="Margin %"
          value={t.margin_pct === null ? 'n/a' : `${t.margin_pct}%`}
          icon={t.margin_pct !== null && t.margin_pct >= 0 ? TrendingUp : TrendingDown}
          tone={t.margin_pct === null ? 'neutral' : t.margin_pct < 0 ? 'bad' : t.margin_pct < 30 ? 'warn' : 'good'}
        />
      </div>

      {/* Per-agency table */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <h2 className="text-sm font-semibold text-white/80">By Agency</h2>
          <p className="text-[11px] text-white/35 mt-0.5">Sorted by thinnest margin first</p>
        </div>

        <div className="hidden md:grid grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr_0.9fr_0.9fr_0.9fr_0.7fr] gap-2 px-5 py-2.5 text-[10px] uppercase tracking-wider text-white/35 border-b border-white/[0.03]">
          <div>Agency</div><div>Plan</div><div className="text-right">Clients</div><div className="text-right">Minutes</div>
          <div className="text-right">Revenue</div><div className="text-right">Cost</div><div className="text-right">Margin</div><div className="text-right">%</div>
        </div>

        <div className="divide-y divide-white/[0.03]">
          {sorted.map((a) => {
            const isOpen = expanded === a.agency_id;
            return (
              <div key={a.agency_id}>
                <button
                  onClick={() => toggleAgency(a.agency_id)}
                  className="w-full grid grid-cols-2 md:grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr_0.9fr_0.9fr_0.9fr_0.7fr] gap-2 px-5 py-3 text-left hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-white/30 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />}
                    <span className="text-sm text-white/85 truncate">{a.agency_name}</span>
                    {!a.cost_capture_complete && (
                      <span className="flex-shrink-0 rounded-full bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0.5">partial</span>
                    )}
                  </div>
                  <div className="text-xs text-white/50 capitalize hidden md:block">{a.plan_type}</div>
                  <div className="text-sm text-white/70 tabular-nums text-right hidden md:block">{a.billable_clients}</div>
                  <div className="text-sm text-white/70 tabular-nums text-right hidden md:block">{a.minutes}</div>
                  <div className="text-sm text-white/85 tabular-nums text-right hidden md:block">{money(a.revenue)}</div>
                  <div className="text-sm text-white/70 tabular-nums text-right hidden md:block">{money(a.total_cost)}</div>
                  <div className={`text-sm tabular-nums text-right font-medium ${marginColor(a.margin_pct)} hidden md:block`}>{money(a.margin)}</div>
                  <div className={`text-sm tabular-nums text-right ${marginColor(a.margin_pct)} hidden md:block`}>
                    {a.margin_pct === null ? 'n/a' : `${a.margin_pct}%`}
                  </div>
                  {/* mobile compact right cell */}
                  <div className="md:hidden text-right">
                    <div className={`text-sm font-medium ${marginColor(a.margin_pct)}`}>{money(a.margin)}</div>
                    <div className="text-[11px] text-white/40">{a.minutes} min · {money(a.revenue)}</div>
                  </div>
                </button>

                {isOpen && (
                  <div className="bg-black/20 px-5 py-3 border-t border-white/[0.03]">
                    {clientLoading === a.agency_id ? (
                      <div className="flex items-center gap-2 text-xs text-white/40 py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading clients...
                      </div>
                    ) : (clientRows[a.agency_id] && clientRows[a.agency_id].length > 0) ? (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.9fr] gap-2 text-[10px] uppercase tracking-wider text-white/30 pb-1">
                          <div>Client</div><div>Routing</div><div className="text-right">Minutes</div><div className="text-right">VAPI</div><div className="text-right">Total Cost</div>
                        </div>
                        {clientRows[a.agency_id].map((c) => (
                          <div key={c.client_id} className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.9fr] gap-2 text-xs items-center py-1">
                            <div className="text-white/60 truncate font-mono text-[11px]">{c.client_id.slice(0, 8)}</div>
                            <div className="text-white/40">{c.voice_routing === 'telnyx_cc' ? 'whisper' : 'direct'}</div>
                            <div className="text-white/60 tabular-nums text-right">{c.minutes}</div>
                            <div className="text-white/60 tabular-nums text-right">{money(c.vapi_cost)}</div>
                            <div className="text-white/80 tabular-nums text-right">{money(c.total_cost)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/30 py-2">No usage this month.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-white/40">No agencies with usage this month.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalCard({
  label, value, icon: Icon, tone, sub,
}: {
  label: string;
  value: string;
  icon: any;
  tone: 'neutral' | 'good' | 'bad' | 'warn';
  sub?: string;
}) {
  const toneClass =
    tone === 'good' ? 'text-emerald-400' :
    tone === 'bad' ? 'text-red-400' :
    tone === 'warn' ? 'text-amber-400' : 'text-white/90';
  const iconBg =
    tone === 'good' ? 'bg-emerald-500/10' :
    tone === 'bad' ? 'bg-red-500/10' :
    tone === 'warn' ? 'bg-amber-500/10' : 'bg-white/[0.05]';
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/50 uppercase tracking-[0.1em]">{label}</p>
          <p className={`mt-2 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
          {sub && <p className="mt-1.5 text-[11px] text-white/35 truncate">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${toneClass}`} />
        </div>
      </div>
    </div>
  );
}