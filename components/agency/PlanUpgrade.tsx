'use client';

// ============================================================================
// PlanUpgrade — in-app plan selection / upgrade for the agency billing tab.
// Theme-aware (matches the settings page's useTheme inline-style pattern).
// ----------------------------------------------------------------------------
// - Pro <-> Scale: in-app switch via POST /api/agency/change-plan (no redirect;
//   Stripe prorates, the subscription webhook syncs plan_type/per-client/seats).
// - Free -> paid: no subscription yet, so it runs POST /api/agency/checkout and
//   redirects to Stripe.
// - Downgrade to Free: routed to onManageBilling (cancel/teardown lives there).
//
// Usage in the billing tab:
//   <PlanUpgrade
//     agencyId={agency?.id || ''}
//     currentPlan={agency?.plan_type || 'free'}
//     theme={theme}
//     onChanged={() => window.location.reload()}
//     onManageBilling={handleManageSubscription}
//   />
// ============================================================================

import { useState } from 'react';
import { Check, Loader2, Sparkles, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

type PlanKey = 'free' | 'pro' | 'scale';
const RANK: Record<string, number> = { free: 0, pro: 1, scale: 2 };

const PLANS: {
  key: PlanKey; name: string; price: string; usage: string; tagline: string;
  features: string[]; highlight?: boolean;
}[] = [
  {
    key: 'free', name: 'Free', price: '$0', usage: '$29.99 / client · $0.12 / min',
    tagline: 'Launch with no platform fee.',
    features: ['24/7 AI receptionist', 'Google Calendar booking', 'Call summaries by text', 'Unlimited clients (usage-based)'],
  },
  {
    key: 'pro', name: 'Pro', price: '$99', usage: '$9.99 / client · $0.10 / min',
    tagline: 'Your brand, your marketing site.',
    features: ['Everything in Free', 'Full white-label branding', 'Marketing website', 'Branded demo phone line', 'Lower per-client + per-minute rates'],
  },
  {
    key: 'scale', name: 'Scale', price: '$499', usage: '$0 / client · $0.05 / min',
    tagline: 'No per-client fees. Built to grow.',
    highlight: true,
    features: ['Everything in Pro', 'No per-client fees at all', 'Lowest per-minute rate', 'API access + webhooks', 'Unlimited team members'],
  },
];

interface Props {
  agencyId: string;
  currentPlan: string;
  theme: any;
  token?: string;
  backendUrl?: string;
  onChanged?: () => void;
  onManageBilling?: () => void;
}

export default function PlanUpgrade({ agencyId, currentPlan, theme, token, backendUrl, onChanged, onManageBilling }: Props) {
  const [busy, setBusy] = useState<PlanKey | null>(null);
  const [done, setDone] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const base = backendUrl || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '');
  const cur = (currentPlan || 'free').toLowerCase();

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
    const json = await post('/api/agency/checkout', { agency_id: agencyId, plan, successUrl, cancelUrl });
    if (json.url) { window.location.href = json.url; return; }
    throw new Error('Could not start checkout.');
  }

  async function handleSelect(plan: PlanKey) {
    setError(null);
    if (plan === cur) return;
    if (plan === 'free') {
      if (onManageBilling) onManageBilling();
      else setError('To downgrade to Free, use Manage Subscription.');
      return;
    }
    setBusy(plan);
    try {
      if (RANK[cur] === 0) { await startCheckout(plan); return; }        // Free -> paid
      const json = await post('/api/agency/change-plan', { agency_id: agencyId, plan }); // paid -> paid
      if (json.needs_checkout) { await startCheckout(plan); return; }
      setDone(plan);
      setTimeout(() => { setBusy(null); onChanged && onChanged(); }, 2600);
    } catch (e: any) {
      setError((e && e.message) || 'Something went wrong.');
      setBusy(null);
    }
  }

  const softBg = theme && theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';

  return (
    <div className="w-full">
      <div className="mb-3">
        <h3 className="text-base sm:text-lg font-medium mb-1">Plans</h3>
        <p className="text-xs sm:text-sm" style={{ color: theme?.textMuted }}>Upgrade or switch anytime. Changes are prorated.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {PLANS.map((p) => {
          const isCurrent = p.key === cur;
          const isUpgrade = RANK[p.key] > RANK[cur];
          const isBusy = busy === p.key;
          const isDone = done === p.key;
          const border = isCurrent ? theme?.primary : (p.highlight ? theme?.primary30 : theme?.inputBorder);
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
                <span className="text-2xl sm:text-3xl font-bold tracking-tight">{p.price}</span>
                <span className="text-sm" style={{ color: theme?.textMuted }}>/mo</span>
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
                    Current plan
                  </div>
                ) : isDone ? (
                  <div className="w-full text-center rounded-xl text-sm font-semibold py-2.5 inline-flex items-center justify-center gap-1.5" style={{ backgroundColor: theme?.primary, color: theme?.primaryText }}>
                    <Check className="h-4 w-4" /> You&apos;re on {p.name}
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelect(p.key)}
                    disabled={!!busy}
                    className="w-full rounded-xl text-sm font-semibold py-2.5 inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                    style={isUpgrade
                      ? { backgroundColor: theme?.primary, color: theme?.primaryText }
                      : { backgroundColor: theme?.input, border: '1px solid ' + theme?.inputBorder, color: theme?.text }}
                  >
                    {isBusy ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Working…</>
                    ) : p.key === 'free' ? (
                      'Downgrade'
                    ) : isUpgrade ? (
                      <>Upgrade to {p.name} <ArrowRight className="h-4 w-4" /></>
                    ) : (
                      'Switch to ' + p.name
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-[13px]" style={{ color: theme?.errorText || '#dc2626' }}>{error}</p>}

      {/* Stripe trust bar */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl px-4 py-3" style={{ backgroundColor: softBg, border: '1px solid ' + theme?.inputBorder }}>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: theme?.textMuted }}>
          <ShieldCheck className="h-4 w-4" style={{ color: theme?.primary }} /> Secure billing
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: theme?.textMuted }}>
          <Lock className="h-3.5 w-3.5" /> 256-bit encryption
        </span>
        {/* Card brands (drop in official SVGs if you want the exact marks). */}
        <span className="inline-flex items-center gap-1.5">
          {['Visa', 'Mastercard', 'Amex', 'Discover'].map((c) => (
            <span key={c} className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ border: '1px solid ' + theme?.inputBorder, color: theme?.textMuted, backgroundColor: theme?.input }}>{c}</span>
          ))}
        </span>
        <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: theme?.textMuted }}>
          Powered by{' '}
          {/* Stripe wordmark, brand purple. Swap for the official SVG from stripe.com/newsroom/brand-assets for the exact logo. */}
          <span className="font-bold tracking-tight" style={{ color: '#635BFF' }}>stripe</span>
        </span>
      </div>
      <p className="mt-2 text-center text-[11px]" style={{ color: theme?.textMuted }}>
        Payment details never touch our servers, they&apos;re handled by Stripe.
      </p>
    </div>
  );
}