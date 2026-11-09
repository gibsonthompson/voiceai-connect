'use client';

// ============================================================================
// PlanUpgrade: in-app plan + billing-interval control for the agency billing tab.
// Theme-aware (matches the settings page's useTheme inline-style pattern).
// ----------------------------------------------------------------------------
// Plan changes (Pro <-> Scale, Free -> paid):
//   - Pro <-> Scale: in-app swap via POST /api/agency/change-plan (Stripe
//     prorates; the subscription webhook syncs plan_type/per-client/seats).
//   - Free -> paid: no subscription yet, so POST /api/agency/checkout -> Stripe.
//   - No downgrade to Free here (cancel lives in the billing tab's Cancel button).
//
// Billing interval (Monthly <-> Annual) via POST /api/agency/change-billing-interval:
//   - Annual billing is Pro/Scale only (Free has no flat fee to bill yearly).
//   - Annual = a yearly flat subscription + the existing monthly usage sub, so
//     the switch is handled server-side; here we just confirm and call it.
//   - A Free agency can't go straight to annual (no paid subscription yet), so
//     the switch is offered only once they're on Pro or Scale. Free -> paid
//     always starts monthly; they switch to annual afterward.
//   - While on annual, plan changes are blocked server-side (one plan's flat fee
//     is the yearly sub), so the plan buttons are disabled with a note to switch
//     to monthly first.
//
// Usage in the billing tab:
//   <PlanUpgrade
//     agencyId={agency?.id || ''}
//     currentPlan={agency?.plan_type || 'free'}
//     currentInterval={agency?.billing_interval || 'monthly'}
//     theme={theme}
//     onChanged={() => window.location.reload()}
//   />
// ============================================================================

import { useState } from 'react';
import { Check, Loader2, Sparkles, ShieldCheck, ArrowRight, ArrowLeft, AlertCircle, X, RefreshCw } from 'lucide-react';

type PlanKey = 'free' | 'pro' | 'scale';
const RANK: Record<string, number> = { free: 0, starter: 0, pro: 1, scale: 2 };

const PLANS: {
  key: PlanKey; name: string; price: string; priceAnnual: string; usage: string; tagline: string;
  features: string[]; highlight?: boolean;
}[] = [
  {
    key: 'free', name: 'Free', price: '$0', priceAnnual: '$0', usage: '$29.99 / client · $0.12 / min',
    tagline: 'Launch with no platform fee.',
    features: ['24/7 AI receptionist', 'Two-way texting + call summaries', 'Google Calendar booking', 'Client dashboard + Stripe Connect', 'Unlimited clients (usage-based)'],
  },
  {
    key: 'pro', name: 'Pro', price: '$99', priceAnnual: '$891', usage: '$9.99 / client · $0.10 / min',
    tagline: 'Your brand, your marketing site.',
    features: ['Everything in Free', 'Full white-label branding + domain', 'Marketing website + AI demo line', 'Lead gen CRM + AI Lab', 'Up to 3 team members'],
  },
  {
    key: 'scale', name: 'Scale', price: '$499', priceAnnual: '$4,491', usage: '$0 / client · $0.05 / min',
    tagline: 'No per-client fees. Built to grow.',
    highlight: true,
    features: ['Everything in Pro', 'No per-client fees at all', 'Unlimited team members', 'Developer API + webhooks', 'Industry templates + priority support'],
  },
];

// Small, recognisable card-brand marks (real SVG, not text pills).
function CardBrands() {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label="Visa, Mastercard, American Express and Discover accepted">
      <svg width="30" height="20" viewBox="0 0 30 20" role="img" aria-label="Visa"><rect width="30" height="20" rx="3" fill="#1A1F71" /><text x="15" y="14" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="9" fontStyle="italic" fontWeight="700" fill="#fff" letterSpacing="0.5">VISA</text></svg>
      <svg width="30" height="20" viewBox="0 0 30 20" role="img" aria-label="Mastercard"><rect width="30" height="20" rx="3" fill="#111" /><circle cx="12.5" cy="10" r="5.5" fill="#EB001B" /><circle cx="17.5" cy="10" r="5.5" fill="#F79E1B" /><path d="M15 5.6a5.5 5.5 0 0 1 0 8.8 5.5 5.5 0 0 1 0-8.8z" fill="#FF5F00" /></svg>
      <svg width="30" height="20" viewBox="0 0 30 20" role="img" aria-label="American Express"><rect width="30" height="20" rx="3" fill="#2E77BC" /><text x="15" y="13.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="7" fontWeight="700" fill="#fff" letterSpacing="0.3">AMEX</text></svg>
      <svg width="30" height="20" viewBox="0 0 30 20" role="img" aria-label="Discover"><rect width="30" height="20" rx="3" fill="#EFEFEF" /><text x="4" y="13" fontFamily="Arial, Helvetica, sans-serif" fontSize="7" fontWeight="800" fill="#231F20">DISC</text><circle cx="24" cy="10" r="4.5" fill="#F76B1C" /></svg>
    </span>
  );
}

interface Props {
  agencyId: string;
  currentPlan: string;
  currentInterval?: string; // 'monthly' | 'annual'
  theme: any;
  token?: string;
  backendUrl?: string;
  onChanged?: () => void;
}

export default function PlanUpgrade({ agencyId, currentPlan, currentInterval, theme, token, backendUrl, onChanged }: Props) {
  const curIntervalAnnual = (currentInterval || 'monthly') === 'annual';
  const [interval, setPlanInterval] = useState<'month' | 'year'>(curIntervalAnnual ? 'year' : 'month');
  const [confirm, setConfirm] = useState<PlanKey | null>(null);        // plan change awaiting confirmation
  const [intervalConfirm, setIntervalConfirm] = useState<'year' | 'month' | null>(null); // interval switch awaiting confirmation
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const base = backendUrl || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '');
  const cur = (currentPlan || 'free').toLowerCase();
  const onFree = RANK[cur] === 0;
  const isAnnual = interval === 'year';
  // The interval the agency is actually on right now, as a toggle value.
  const curIntervalValue: 'year' | 'month' = curIntervalAnnual ? 'year' : 'month';
  // A switch is offered only for a paid agency whose selected toggle differs
  // from the interval they're on. Free agencies have no flat fee to bill yearly.
  const canSwitchInterval = !onFree && interval !== curIntervalValue;

  // Free is only ever shown when you're actually on it (as the current-plan
  // marker). We never offer a downgrade to Free from a paid plan.
  const visiblePlans = PLANS.filter((p) => p.key !== 'free' || onFree);

  const softBg = theme && theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const planByKey = (k: PlanKey) => PLANS.find((p) => p.key === k)!;
  const priceOf = (p: typeof PLANS[number]) => (isAnnual ? p.priceAnnual : p.price);

  async function post(path: string, body: any) {
    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || json.message || ('Request failed (' + res.status + ')'));
    return json;
  }

  async function startCheckout(plan: PlanKey) {
    const successUrl = window.location.origin + '/agency/settings?tab=billing&upgraded=' + plan;
    const cancelUrl = window.location.origin + '/agency/settings?tab=billing&canceled=true';
    // Free -> paid always starts MONTHLY (direct free -> annual isn't supported;
    // they switch to annual afterward). skipTrial mirrors the prior behavior.
    const json = await post('/api/agency/checkout', { agency_id: agencyId, plan, interval: 'month', successUrl, cancelUrl, skipTrial: !onFree });
    if (json.url) { window.location.href = json.url; return; }
    throw new Error('Could not start checkout.');
  }

  // The confirmation copy differs by direction so it's clear what will happen.
  function confirmCopy(plan: PlanKey): { title: string; body: string; cta: string } {
    const name = planByKey(plan).name;
    if (onFree) {
      return {
        title: 'Start your 14-day free trial?',
        body: 'Full ' + name + ' access free for 14 days. $0 today, then ' + planByKey(plan).price + '/mo after the trial. Cancel anytime before it ends. You add a card on Stripe to start. You can switch to annual billing (3 months free) once your plan is active.',
        cta: 'Start free trial',
      };
    }
    if (RANK[plan] > RANK[cur]) {
      return {
        title: 'Upgrade to ' + name + '?',
        body: 'Your plan changes to ' + name + ' right away. Stripe prorates the difference for the rest of this billing period and adds it to your next invoice, and your per-client and per-minute rates drop to the ' + name + ' rates.',
        cta: 'Upgrade to ' + name,
      };
    }
    return {
      title: 'Switch to ' + name + '?',
      body: 'Your plan changes to ' + name + ' right away. Stripe credits the unused difference toward your next invoice, and your per-client and per-minute rates move to the ' + name + ' rates. You can switch back anytime.',
      cta: 'Switch to ' + name,
    };
  }

  async function runChange(plan: PlanKey) {
    setBusy(true);
    setResult(null);
    try {
      // Always ask the backend. It swaps the plan in place whenever there's an
      // active subscription to switch (Pro <-> Scale, and a Free agency that
      // already set up billing -> paid), and only returns needs_checkout when
      // there is no subscription yet, in which case we run Stripe Checkout to
      // create one.
      const json = await post('/api/agency/change-plan', { agency_id: agencyId, plan });
      if (json.needs_checkout) { await startCheckout(plan); return; } // redirects away
      setConfirm(null);
      setResult({ ok: true, msg: 'You’re now on ' + planByKey(plan).name + '. Refreshing…' });
      setTimeout(() => { onChanged && onChanged(); }, 1600);
    } catch (e: any) {
      setResult({ ok: false, msg: (e && e.message) || 'Something went wrong. Your plan was not changed.' });
      setBusy(false);
    }
  }

  async function runIntervalSwitch(target: 'year' | 'month') {
    setBusy(true);
    setResult(null);
    try {
      await post('/api/agency/change-billing-interval', { agency_id: agencyId, interval: target });
      setIntervalConfirm(null);
      setResult({ ok: true, msg: (target === 'year' ? 'You’re now on annual billing. Refreshing…' : 'You’re now on monthly billing. Refreshing…') });
      setTimeout(() => { onChanged && onChanged(); }, 1600);
    } catch (e: any) {
      setResult({ ok: false, msg: (e && e.message) || 'Something went wrong. Your billing interval was not changed.' });
      setBusy(false);
    }
  }

  const confirmData = confirm ? confirmCopy(confirm) : null;

  return (
    <div className="w-full">
      <div className="mb-3">
        <h3 className="text-base sm:text-lg font-medium mb-1">Plans</h3>
        <p className="text-xs sm:text-sm" style={{ color: theme?.textMuted }}>Upgrade or switch anytime. Changes are prorated by Stripe.</p>
      </div>

      {/* Result banner (success or error) */}
      {result && (
        <div className="mb-3 rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: result.ok ? theme?.primary15 : (theme?.errorBg || 'rgba(220,38,38,0.1)'), border: '1px solid ' + (result.ok ? theme?.primary30 : (theme?.errorBorder || 'rgba(220,38,38,0.3)')) }}>
          {result.ok ? <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme?.primary }} /> : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme?.errorText || '#dc2626' }} />}
          <p className="text-[13px]" style={{ color: result.ok ? theme?.primary : (theme?.errorText || '#dc2626') }}>{result.msg}</p>
        </div>
      )}

      {/* Monthly / Annual toggle */}
      <div className="mb-4 flex items-center justify-center">
        <div className="inline-flex items-center rounded-full p-1" style={{ backgroundColor: softBg, border: '1px solid ' + theme?.inputBorder }}>
          {(['month', 'year'] as const).map((iv) => {
            const active = interval === iv;
            return (
              <button key={iv} type="button" onClick={() => { setResult(null); setPlanInterval(iv); }}
                className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
                style={active ? { backgroundColor: theme?.primary, color: theme?.primaryText } : { color: theme?.textMuted }}>
                {iv === 'month' ? 'Monthly' : 'Annual'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Three months free indicator, shown above the plans when annual is selected */}
      {isAnnual && (
        <p className="mb-4 text-center text-[13px] font-semibold" style={{ color: theme?.primary }}>Three months free on every annual plan</p>
      )}

      {/* Billing-interval switch CTA (paid agencies, when the toggle differs from
          the interval they're on) + the free-agency note. */}
      {canSwitchInterval && (
        <div className="mb-4 rounded-xl p-3.5 flex items-start justify-between gap-3" style={{ backgroundColor: theme?.primary15, border: '1px solid ' + theme?.primary30 }}>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: theme?.text }}>
              {interval === 'year' ? 'Switch to annual billing' : 'Switch to monthly billing'}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: theme?.textMuted }}>
              {interval === 'year'
                ? 'Pay for ' + planByKey(cur as PlanKey).name + ' yearly (' + planByKey(cur as PlanKey).priceAnnual + '/yr). Your per-minute usage stays billed monthly.'
                : 'Move ' + planByKey(cur as PlanKey).name + ' back to monthly billing (' + planByKey(cur as PlanKey).price + '/mo).'}
            </p>
          </div>
          <button type="button" onClick={() => { setResult(null); setIntervalConfirm(interval); }} disabled={busy}
            className="rounded-xl text-[13px] font-semibold px-3.5 py-2 inline-flex items-center gap-1.5 flex-shrink-0 transition-colors disabled:opacity-60"
            style={{ backgroundColor: theme?.primary, color: theme?.primaryText }}>
            <RefreshCw className="h-3.5 w-3.5" /> {interval === 'year' ? 'Go annual' : 'Go monthly'}
          </button>
        </div>
      )}
      {onFree && isAnnual && (
        <div className="mb-4 rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: softBg, border: '1px solid ' + theme?.inputBorder }}>
          <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme?.primary }} />
          <p className="text-[12px]" style={{ color: theme?.textMuted }}>Annual billing (3 months free) is available on Pro and Scale. Start a paid plan, then switch to annual anytime from here.</p>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${visiblePlans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {visiblePlans.map((p) => {
          const isCurrent = p.key === cur;
          const isUpgrade = RANK[p.key] > RANK[cur];
          const border = isCurrent ? theme?.primary : (p.highlight ? theme?.primary30 : theme?.inputBorder);
          // Plan changes are blocked while on annual (one plan's flat fee is the
          // yearly sub). Disable the action and explain, so the switch can't 409.
          const planLocked = curIntervalAnnual && !isCurrent;
          const showAnnualPrice = isAnnual && p.key !== 'free';
          return (
            <div
              key={p.key}
              className="relative rounded-xl p-4 sm:p-5 flex flex-col"
              style={{ backgroundColor: p.highlight ? theme?.primary15 : theme?.input, border: '1px solid ' + border, boxShadow: isCurrent ? '0 0 0 1px ' + theme?.primary : 'none' }}
            >
              {p.highlight && (
                <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1" style={{ backgroundColor: theme?.primary, color: theme?.primaryText }}>
                  <Sparkles className="h-3 w-3" /> Most capable
                </span>
              )}
              <div className="text-sm font-semibold" style={{ color: theme?.textMuted }}>{p.name}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight">{priceOf(p)}</span>
                <span className="text-sm" style={{ color: theme?.textMuted }}>{showAnnualPrice ? '/yr' : '/mo'}</span>
              </div>
              <div className="mt-1 text-[12px] font-medium" style={{ color: theme?.textMuted }}>{p.usage}</div>
              <p className="mt-2 text-[13px]" style={{ color: theme?.textMuted }}>{p.tagline}</p>

              <ul className="mt-4 space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px]">
                    <Check className="h-4 w-4 flex-none mt-0.5" style={{ color: theme?.primary }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <div className="w-full text-center rounded-xl text-sm font-semibold py-2.5" style={{ backgroundColor: softBg, color: theme?.textMuted }}>
                    Current plan{curIntervalAnnual ? ' · annual' : ''}
                  </div>
                ) : planLocked ? (
                  <div className="w-full text-center rounded-xl text-[12px] py-2.5 px-2" style={{ backgroundColor: softBg, color: theme?.textMuted }}>
                    Switch to monthly billing to change plans
                  </div>
                ) : (
                  <button
                    onClick={() => { setResult(null); setConfirm(p.key); }}
                    disabled={busy}
                    className="w-full rounded-xl text-sm font-semibold py-2.5 inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                    style={isUpgrade
                      ? { backgroundColor: theme?.primary, color: theme?.primaryText }
                      : { backgroundColor: theme?.input, border: '1px solid ' + theme?.inputBorder, color: theme?.text }}
                  >
                    {isUpgrade ? (<>Upgrade to {p.name} <ArrowRight className="h-4 w-4" /></>) : (<><ArrowLeft className="h-4 w-4" /> Switch to {p.name}</>)}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan-change confirmation dialog */}
      {confirm && confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => { if (!busy) { setConfirm(null); } }}>
          <div className="w-full max-w-md rounded-2xl p-5 sm:p-6" style={{ backgroundColor: theme?.card || (theme?.isDark ? '#0a0a0a' : '#fff'), border: '1px solid ' + theme?.border }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="text-base sm:text-lg font-semibold">{confirmData.title}</h4>
              <button onClick={() => { if (!busy) setConfirm(null); }} className="p-1 rounded-lg flex-shrink-0" style={{ color: theme?.textMuted }} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-[13px] sm:text-sm leading-relaxed" style={{ color: theme?.textMuted }}>{confirmData.body}</p>

            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <button
                onClick={() => { if (!busy) setConfirm(null); }}
                disabled={busy}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto"
                style={{ backgroundColor: theme?.input, border: '1px solid ' + theme?.inputBorder, color: theme?.text }}
              >
                Cancel
              </button>
              <button
                onClick={() => runChange(confirm)}
                disabled={busy}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                style={{ backgroundColor: theme?.primary, color: theme?.primaryText }}
              >
                {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Working...</>) : confirmData.cta}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing-interval switch confirmation dialog */}
      {intervalConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => { if (!busy) { setIntervalConfirm(null); } }}>
          <div className="w-full max-w-md rounded-2xl p-5 sm:p-6" style={{ backgroundColor: theme?.card || (theme?.isDark ? '#0a0a0a' : '#fff'), border: '1px solid ' + theme?.border }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="text-base sm:text-lg font-semibold">{intervalConfirm === 'year' ? 'Switch to annual billing?' : 'Switch to monthly billing?'}</h4>
              <button onClick={() => { if (!busy) setIntervalConfirm(null); }} className="p-1 rounded-lg flex-shrink-0" style={{ color: theme?.textMuted }} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-[13px] sm:text-sm leading-relaxed" style={{ color: theme?.textMuted }}>
              {intervalConfirm === 'year'
                ? 'Your ' + planByKey(cur as PlanKey).name + ' plan moves to yearly billing at ' + planByKey(cur as PlanKey).priceAnnual + '/yr. You’re charged for the year now, with the unused part of your current month credited by Stripe. Your per-minute usage keeps billing monthly, and the plan auto-renews yearly. You can switch back to monthly anytime.'
                : 'Your ' + planByKey(cur as PlanKey).name + ' plan moves back to monthly billing at ' + planByKey(cur as PlanKey).price + '/mo. Stripe credits the unused part of your annual payment toward future invoices. Your per-minute usage is unaffected.'}
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <button
                onClick={() => { if (!busy) setIntervalConfirm(null); }}
                disabled={busy}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto"
                style={{ backgroundColor: theme?.input, border: '1px solid ' + theme?.inputBorder, color: theme?.text }}
              >
                Cancel
              </button>
              <button
                onClick={() => runIntervalSwitch(intervalConfirm)}
                disabled={busy}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                style={{ backgroundColor: theme?.primary, color: theme?.primaryText }}
              >
                {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Working...</>) : (intervalConfirm === 'year' ? 'Switch to annual' : 'Switch to monthly')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe trust bar */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl px-4 py-3" style={{ backgroundColor: softBg, border: '1px solid ' + theme?.inputBorder }}>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: theme?.textMuted }}>
          <ShieldCheck className="h-4 w-4" style={{ color: theme?.primary }} /> Secure billing
        </span>
        <CardBrands />
        <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: theme?.textMuted }}>
          Powered by <span className="font-bold tracking-tight" style={{ color: '#635BFF' }}>stripe</span>
        </span>
      </div>
      <p className="mt-2 text-center text-[11px]" style={{ color: theme?.textMuted }}>
        Payment details never touch our servers, they&apos;re handled by Stripe.
      </p>
    </div>
  );
}
