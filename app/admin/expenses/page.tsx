'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingDown, AlertTriangle, Loader2, Settings2,
  Check, X, PhoneCall, Zap, ShieldCheck, ShieldOff,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface VoiceCost {
  blended_per_minute: number;
  telnyx?: number;
  vapi?: number;
  elevenlabs?: number;
  deepgram?: number;
}
interface AgencyExpense {
  agency_id: string;
  name: string;
  plan_type: string;
  subscription_status: string;
  usage_billing_enabled: boolean;
  billable_clients: number;
  all_time: { minutes: number; calls: number; est_cost: number };
  this_month: { minutes: number; calls: number; est_cost: number };
  plan_rates: { platform_fee: number; per_client: number; per_minute: number };
  would_bill_month: number;
  usage_margin_month: number;
  recovering: boolean;
}
interface Totals {
  blended_per_minute: number;
  total_agencies: number;
  all_time: { minutes: number; est_cost: number };
  this_month: {
    minutes: number; est_cost: number; would_bill: number;
    exposure: number; recovering_count: number; not_recovering_count: number;
  };
}

export default function AdminExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<AgencyExpense[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [voiceCost, setVoiceCost] = useState<VoiceCost | null>(null);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${backendUrl}/api/admin/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load expenses');
      const data = await res.json();
      setAgencies(data.agencies || []);
      setTotals(data.totals || null);
      setVoiceCost(data.voice_cost || null);
      setRateInput(String(data.voice_cost?.blended_per_minute ?? ''));
    } catch (err) {
      console.error('Expenses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveRate = async () => {
    const n = parseFloat(rateInput);
    if (isNaN(n) || n < 0) return;
    setSavingRate(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${backendUrl}/api/admin/expenses/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ blended_per_minute: n }),
      });
      if (res.ok) {
        setEditingRate(false);
        setLoading(true);
        await fetchExpenses();
      }
    } catch (err) {
      console.error('Save rate error:', err);
    } finally {
      setSavingRate(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);
  const fmtNum = (n: number) => (n || 0).toLocaleString();
  const planLabel = (p: string) => ({ free: 'Free', pro: 'Pro', scale: 'Scale', starter: 'Free', professional: 'Pro', enterprise: 'Scale' } as Record<string, string>)[p] || p;
  const planBadge = (p: string) => {
    const map: Record<string, string> = {
      free: 'bg-white/[0.04] text-white/40 border-white/[0.06]',
      pro: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      scale: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    };
    return map[planLabel(p).toLowerCase()] || map.free;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-white/40">Voice cost per agency vs. what you bill — and what you&apos;re eating.</p>
        </div>

        {/* Blended cost rate editor */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] px-4 py-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/[0.08]">
            <Settings2 className="h-4 w-4 text-amber-400/80" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.1em]">Blended cost / min</p>
            {editingRate ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-white/40 text-sm">$</span>
                <input
                  autoFocus
                  type="number"
                  step="0.001"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-20 rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500/30"
                />
                <button onClick={saveRate} disabled={savingRate} className="p-1 rounded-md hover:bg-emerald-500/10 text-emerald-400">
                  {savingRate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => { setEditingRate(false); setRateInput(String(voiceCost?.blended_per_minute ?? '')); }} className="p-1 rounded-md hover:bg-white/[0.06] text-white/40">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingRate(true)} className="text-lg font-semibold text-white tabular-nums hover:text-emerald-400 transition-colors">
                ${(voiceCost?.blended_per_minute ?? 0).toFixed(3)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {totals && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Exposure — hero / warning */}
          <div className="relative col-span-2 lg:col-span-1 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.1] to-transparent" />
            <div className="relative border border-red-500/[0.15] rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-red-400/70 uppercase tracking-[0.12em]">Exposure / mo</p>
                <AlertTriangle className="h-4 w-4 text-red-400/60" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-white tracking-tight">{fmt(totals.this_month.exposure)}</p>
              <p className="mt-1.5 text-[11px] text-white/40">
                <span className="text-red-400/80">{totals.this_month.not_recovering_count}</span> agencies not metered
              </p>
            </div>
          </div>

          <SummaryCard label="Cost This Month" value={fmt(totals.this_month.est_cost)} sub={`${fmtNum(totals.this_month.minutes)} min`} icon={TrendingDown} tint="amber" />
          <SummaryCard label="Cost All-Time" value={fmt(totals.all_time.est_cost)} sub={`${fmtNum(totals.all_time.minutes)} min`} icon={PhoneCall} tint="white" />
          <SummaryCard label="Recovering" value={`${totals.this_month.recovering_count}/${totals.total_agencies}`} sub={`would bill ${fmt(totals.this_month.would_bill)}`} icon={ShieldCheck} tint="emerald" />
        </div>
      )}

      {/* Per-agency table */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b border-white/[0.04] flex items-center gap-2.5">
          <DollarSign className="h-4 w-4 text-white/35" />
          <h2 className="text-sm font-semibold text-white/80">Cost by Agency</h2>
          <span className="text-[11px] text-white/30">sorted by all-time cost</span>
        </div>

        {agencies.length === 0 ? (
          <div className="p-16 text-center text-sm text-white/40">No usage data yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-6 py-3.5">Agency</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Plan</th>
                  <th className="text-center text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-3 py-3.5">Min (mo)</th>
                  <th className="text-center text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-3 py-3.5">Min (all)</th>
                  <th className="text-right text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Cost (mo)</th>
                  <th className="text-right text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Cost (all)</th>
                  <th className="text-right text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Would Bill (mo)</th>
                  <th className="text-right text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Usage Margin</th>
                  <th className="text-center text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Metered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {agencies.map((a) => (
                  <tr key={a.agency_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="text-[13px] font-medium text-white/85 truncate max-w-[200px]">{a.name}</p>
                      <p className="text-[11px] text-white/30">{a.billable_clients} billable client{a.billable_clients !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${planBadge(a.plan_type)}`}>{planLabel(a.plan_type)}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center text-xs text-white/60 tabular-nums">{fmtNum(a.this_month.minutes)}</td>
                    <td className="px-3 py-3.5 text-center text-xs text-white/40 tabular-nums">{fmtNum(a.all_time.minutes)}</td>
                    <td className="px-4 py-3.5 text-right text-xs text-amber-400/80 tabular-nums">{fmt(a.this_month.est_cost)}</td>
                    <td className="px-4 py-3.5 text-right text-xs text-white/60 tabular-nums">{fmt(a.all_time.est_cost)}</td>
                    <td className="px-4 py-3.5 text-right text-xs text-white/50 tabular-nums">{fmt(a.would_bill_month)}</td>
                    <td className="px-4 py-3.5 text-right text-xs tabular-nums">
                      <span className={a.usage_margin_month >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}>
                        {a.usage_margin_month >= 0 ? '+' : ''}{fmt(a.usage_margin_month)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {a.recovering ? (
                        <span title="Usage billing enabled" className="inline-flex"><ShieldCheck className="h-4 w-4 text-emerald-400/70" /></span>
                      ) : (
                        <span title="Not metered — you're eating this" className="inline-flex"><ShieldOff className="h-4 w-4 text-red-400/60" /></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-white/30">
        Cost = voice minutes × blended rate ({voiceCost ? `$${voiceCost.blended_per_minute.toFixed(3)}/min` : '—'}). &quot;Would Bill&quot; is platform fee + per-client + per-minute at the agency&apos;s plan rates. Usage margin excludes the flat platform fee.
      </p>
    </div>
  );
}

/* ─── Summary Card ─── */
function SummaryCard({ label, value, sub, icon: Icon, tint }: {
  label: string; value: string; sub: string; icon: any; tint: 'amber' | 'emerald' | 'white' | 'red';
}) {
  const tints = {
    amber: 'bg-amber-500/[0.08] text-amber-400/80',
    emerald: 'bg-emerald-500/[0.08] text-emerald-400/80',
    white: 'bg-white/[0.05] text-white/50',
    red: 'bg-red-500/[0.08] text-red-400/80',
  };
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium text-white/50 uppercase tracking-[0.1em]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
          <p className="mt-1 text-[11px] text-white/40">{sub}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tints[tint]}`}>
          <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        </div>
      </div>
    </div>
  );
}