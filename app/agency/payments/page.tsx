'use client';

import { useState, useEffect } from 'react';
import {
  Wallet, Clock, ArrowDownToLine, Calendar, Loader2, ExternalLink,
  CreditCard, RefreshCw, AlertCircle, CheckCircle2, Receipt, Info,
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';

interface BalanceAmount { amount: number; currency: string; }
interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrival_date: number | null;
  created: number | null;
}
interface Charge {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paid: boolean;
  refunded: boolean;
  created: number | null;
  customer_name: string | null;
  customer_email: string | null;
  description: string | null;
}
interface PayoutSchedule {
  interval?: string;
  delay_days?: number;
  weekly_anchor?: string;
  monthly_anchor?: number;
}
interface Financials {
  connected: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  display_currency?: string;
  available?: BalanceAmount[];
  pending?: BalanceAmount[];
  instant_available?: BalanceAmount[];
  payout_schedule?: PayoutSchedule | null;
  next_payout?: Payout | null;
  recent_payouts?: Payout[];
  recent_charges?: Charge[];
}

function formatMoney(cents: number, currency = 'usd'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((cents || 0) / 100);
  } catch {
    return `$${((cents || 0) / 100).toFixed(2)}`;
  }
}

function formatDate(ms: number | null): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sumByCurrency(list: BalanceAmount[] | undefined, currency: string): number {
  return (list || []).filter((b) => b.currency === currency).reduce((s, b) => s + (b.amount || 0), 0);
}

function scheduleLabel(s: PayoutSchedule | null | undefined): string {
  if (!s || !s.interval) return 'Set by Stripe';
  if (s.interval === 'manual') return 'Manual';
  if (s.interval === 'daily') {
    return `Automatic, daily${typeof s.delay_days === 'number' ? ` (${s.delay_days} day rolling)` : ''}`;
  }
  if (s.interval === 'weekly') {
    const day = s.weekly_anchor ? s.weekly_anchor.charAt(0).toUpperCase() + s.weekly_anchor.slice(1) : '';
    return `Automatic, weekly${day ? ` on ${day}` : ''}`;
  }
  if (s.interval === 'monthly') {
    return `Automatic, monthly${s.monthly_anchor ? ` on day ${s.monthly_anchor}` : ''}`;
  }
  return 'Automatic';
}

function payoutStatusStyle(status: string, theme: any): { bg: string; color: string; label: string } {
  switch (status) {
    case 'paid':       return { bg: theme.successBg, color: theme.success, label: 'Paid' };
    case 'pending':    return { bg: theme.infoBg, color: theme.info, label: 'Pending' };
    case 'in_transit': return { bg: theme.infoBg, color: theme.info, label: 'In transit' };
    case 'failed':     return { bg: theme.errorBg, color: theme.errorText, label: 'Failed' };
    case 'canceled':   return { bg: theme.hover, color: theme.textMuted, label: 'Canceled' };
    default:           return { bg: theme.hover, color: theme.textMuted, label: status };
  }
}

// Demo data so Demo Mode has something to render (mirrors the dashboard's
// approach of short-circuiting to sample data when demoMode is on).
const DEMO_FINANCIALS: Financials = {
  connected: true,
  charges_enabled: true,
  payouts_enabled: true,
  display_currency: 'usd',
  available: [{ amount: 284700, currency: 'usd' }],
  pending: [{ amount: 91200, currency: 'usd' }],
  instant_available: [{ amount: 284700, currency: 'usd' }],
  payout_schedule: { interval: 'daily', delay_days: 2 },
  next_payout: { id: 'po_demo1', amount: 91200, currency: 'usd', status: 'in_transit', arrival_date: Date.now() + 2 * 86400000, created: Date.now() },
  recent_payouts: [
    { id: 'po_demo1', amount: 91200, currency: 'usd', status: 'in_transit', arrival_date: Date.now() + 2 * 86400000, created: Date.now() },
    { id: 'po_demo2', amount: 149000, currency: 'usd', status: 'paid', arrival_date: Date.now() - 3 * 86400000, created: Date.now() - 5 * 86400000 },
    { id: 'po_demo3', amount: 132500, currency: 'usd', status: 'paid', arrival_date: Date.now() - 10 * 86400000, created: Date.now() - 12 * 86400000 },
  ],
  recent_charges: [
    { id: 'ch_demo1', amount: 14900, currency: 'usd', status: 'succeeded', paid: true, refunded: false, created: Date.now() - 86400000, customer_name: 'Summit Plumbing', customer_email: 'ops@summitplumbing.com', description: 'AI Receptionist - Pro' },
    { id: 'ch_demo2', amount: 9900, currency: 'usd', status: 'succeeded', paid: true, refunded: false, created: Date.now() - 2 * 86400000, customer_name: 'Harbor Dental', customer_email: 'front@harbordental.com', description: 'AI Receptionist - Starter' },
    { id: 'ch_demo3', amount: 29900, currency: 'usd', status: 'succeeded', paid: true, refunded: false, created: Date.now() - 4 * 86400000, customer_name: 'Peak Roofing', customer_email: 'admin@peakroofing.com', description: 'AI Receptionist - Growth' },
  ],
};

export default function AgencyPaymentsPage() {
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const [data, setData] = useState<Financials | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  useEffect(() => {
    if (!agency) return;
    if (demoMode) { setData(DEMO_FINANCIALS); setLoading(false); return; }
    fetchFinancials(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agency, demoMode]);

  const fetchFinancials = async (isRefresh: boolean) => {
    if (!agency) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/connect/financials/${agency.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to load payment data');
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // NOT CONNECTED: send them to Settings to onboard Stripe Connect.
  // ---------------------------------------------------------------------------
  if (!data?.connected) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Payments</h1>
          <p className="mt-1 text-sm sm:text-base" style={{ color: theme.textMuted }}>Your balance, payouts, and client payments.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.errorText }} />
            <p className="text-sm" style={{ color: theme.errorText }}>{error}</p>
          </div>
        )}

        <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ backgroundColor: theme.primary15 }}>
            <CreditCard className="h-7 w-7" style={{ color: theme.primary }} />
          </div>
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>Connect Stripe to see your money</h2>
          <p className="mt-1.5 text-sm max-w-md mx-auto" style={{ color: theme.textMuted }}>
            Once Stripe Connect is set up, your available balance, upcoming payouts, and every client payment show up here. Payments go straight to your own Stripe account.
          </p>
          <a
            href="/agency/settings?tab=payments"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            Set up Stripe Connect
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // CONNECTED
  // ---------------------------------------------------------------------------
  const cur = data.display_currency || 'usd';
  const available = sumByCurrency(data.available, cur);
  const pending = sumByCurrency(data.pending, cur);
  const instant = sumByCurrency(data.instant_available, cur);
  const otherAvailable = (data.available || []).filter((b) => b.currency !== cur && b.amount !== 0);
  const payouts = data.recent_payouts || [];
  const charges = data.recent_charges || [];
  const setupIncomplete = data.charges_enabled === false || data.payouts_enabled === false;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Payments</h1>
          <p className="mt-1 text-sm sm:text-base" style={{ color: theme.textMuted }}>Your balance, payouts, and client payments.</p>
        </div>
        <button
          onClick={() => fetchFinancials(true)}
          disabled={refreshing || demoMode}
          className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors flex-shrink-0 disabled:opacity-50"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.errorText }} />
          <p className="text-sm" style={{ color: theme.errorText }}>{error}</p>
        </div>
      )}

      {setupIncomplete && (
        <div className="mb-6 rounded-xl p-3 sm:p-4 flex items-start gap-3" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.warningText }} />
          <div className="text-xs sm:text-sm" style={{ color: theme.warningText }}>
            <p className="font-medium mb-0.5">Stripe setup is incomplete</p>
            <p style={{ color: theme.textMuted }}>
              {data.charges_enabled === false ? 'Charges are not enabled yet. ' : ''}
              {data.payouts_enabled === false ? 'Payouts are not enabled yet. ' : ''}
              <a href="/agency/settings?tab=payments" className="underline" style={{ color: theme.primary }}>Finish setup</a>
            </p>
          </div>
        </div>
      )}

      {/* Balance + payout cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        {/* Available (hero) */}
        <div className="relative col-span-2 rounded-2xl p-5 sm:p-6 overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.primary30}` }}>
          <div className="absolute inset-0" style={{ background: theme.isDark ? `linear-gradient(135deg, ${theme.primary}12 0%, transparent 60%)` : `linear-gradient(135deg, ${theme.primary}08 0%, transparent 60%)` }} />
          <div className="relative flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Available balance</p>
              <p className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: theme.text }}>{formatMoney(available, cur)}</p>
              <p className="mt-1.5 text-xs sm:text-sm" style={{ color: theme.textMuted }}>Ready to pay out to your bank</p>
              {otherAvailable.length > 0 && (
                <p className="mt-1 text-[11px]" style={{ color: theme.textMuted }}>
                  Plus {otherAvailable.map((b) => formatMoney(b.amount, b.currency)).join(', ')}
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15 }}>
              <Wallet className="h-5 w-5" style={{ color: theme.primary }} />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Pending</p>
              <p className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>{formatMoney(pending, cur)}</p>
              <p className="mt-1 text-[11px] sm:text-xs" style={{ color: theme.textMuted }}>Clearing soon</p>
            </div>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: theme.infoBg }}>
              <Clock className="h-4 w-4" style={{ color: theme.info }} />
            </div>
          </div>
        </div>

        {/* Next payout */}
        <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Next payout</p>
              {data.next_payout ? (
                <>
                  <p className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>{formatMoney(data.next_payout.amount, data.next_payout.currency)}</p>
                  <p className="mt-1 text-[11px] sm:text-xs" style={{ color: theme.textMuted }}>
                    {data.next_payout.arrival_date ? `Arrives ${formatDate(data.next_payout.arrival_date)}` : 'In transit'}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-lg sm:text-xl font-semibold tracking-tight" style={{ color: theme.textMuted }}>None scheduled</p>
                  <p className="mt-1 text-[11px] sm:text-xs" style={{ color: theme.textMuted }}>{scheduleLabel(data.payout_schedule)}</p>
                </>
              )}
            </div>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: theme.primary15 }}>
              <ArrowDownToLine className="h-4 w-4" style={{ color: theme.primary }} />
            </div>
          </div>
        </div>
      </div>

      {/* Payout schedule + instant strip */}
      <div className="mb-6 sm:mb-8 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
          <span className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Payout schedule:</span>
          <span className="text-xs sm:text-sm font-medium" style={{ color: theme.text }}>{scheduleLabel(data.payout_schedule)}</span>
        </div>
        {instant > 0 && (
          <div className="flex items-center gap-2.5 sm:ml-auto">
            <span className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Instant payout available:</span>
            <span className="text-xs sm:text-sm font-medium" style={{ color: theme.text }}>{formatMoney(instant, cur)}</span>
          </div>
        )}
      </div>

      {/* Recent payouts */}
      <div className="mb-6 sm:mb-8 rounded-xl" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-2.5 p-4 sm:p-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <ArrowDownToLine className="h-4 w-4" style={{ color: theme.textMuted }} />
          <h2 className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>Recent payouts</h2>
        </div>
        <div className="p-4 sm:p-5">
          {payouts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: theme.textMuted }}>No payouts yet. They appear once you have an available balance and Stripe sends it to your bank.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map((p) => {
                const s = payoutStatusStyle(p.status, theme);
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-xl p-3 sm:p-4" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: theme.card }}>
                        <ArrowDownToLine className="h-4 w-4" style={{ color: theme.textMuted }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm" style={{ color: theme.text }}>{formatMoney(p.amount, p.currency)}</p>
                        <p className="text-xs" style={{ color: theme.textMuted }}>
                          {p.status === 'paid'
                            ? `Paid ${formatDate(p.arrival_date)}`
                            : p.arrival_date ? `Expected ${formatDate(p.arrival_date)}` : `Initiated ${formatDate(p.created)}`}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-medium flex-shrink-0" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent client payments */}
      <div className="rounded-xl" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-2.5 p-4 sm:p-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <Receipt className="h-4 w-4" style={{ color: theme.textMuted }} />
          <h2 className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>Recent client payments</h2>
        </div>
        <div className="p-4 sm:p-5">
          {charges.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: theme.textMuted }}>No payments yet. Client subscription charges show up here as they come in.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {charges.map((c) => {
                const ok = c.status === 'succeeded' && c.paid && !c.refunded;
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-xl p-3 sm:p-4" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: ok ? theme.successBg : theme.hover }}>
                        {ok ? <CheckCircle2 className="h-4 w-4" style={{ color: theme.success }} /> : <CreditCard className="h-4 w-4" style={{ color: theme.textMuted }} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: theme.text }}>
                          {c.customer_name || c.customer_email || 'Client payment'}
                        </p>
                        <p className="text-xs truncate" style={{ color: theme.textMuted }}>
                          {c.description || 'Subscription'}{c.created ? ` · ${formatDate(c.created)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-sm" style={{ color: theme.text }}>{formatMoney(c.amount, c.currency)}</p>
                      {c.refunded && <p className="text-[10px]" style={{ color: theme.textMuted }}>Refunded</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footnote */}
      <div className="mt-6 rounded-xl p-3 sm:p-4 flex items-start gap-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} />
        <p className="text-xs sm:text-sm" style={{ color: theme.infoText }}>
          Client payments go directly to your own Stripe account and pay out to your bank on your schedule. The platform never holds your funds.
        </p>
      </div>
    </div>
  );
}