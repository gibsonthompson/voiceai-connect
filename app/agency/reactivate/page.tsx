'use client';

// ============================================================================
// AGENCY REACTIVATION PAGE  (app/agency/reactivate/page.tsx)
// ----------------------------------------------------------------------------
// A single, self-contained upgrade page for a suspended (lapsed-billing) agency.
// Rendered OUTSIDE the dashboard shell (app/agency/layout.tsx returns children
// directly for this path), so there is no AgencyProvider, no access gates, and
// no session teardown to fight. It brands itself from the agency JSON the login
// page wrote to localStorage (logo, primary color, light/dark theme) and starts
// a REAL Stripe Checkout via POST /api/agency/checkout with skipTrial:true (the
// same working endpoint the trial-expired picker uses, now no repeat trial). It
// deliberately does NOT call /api/agency/portal (that 400s with no live
// subscription to manage).
//
// POST-PAYMENT RACE
//   Stripe redirects back the instant payment succeeds, but the account is
//   flipped off 'suspended' by the checkout.session.completed WEBHOOK, which
//   lands a second or two later. If we sent them straight to /agency/dashboard,
//   the shell would still read 'suspended' and bounce them right back here.
//   So checkout success returns to THIS page with ?status=activating, which
//   shows a short "Activating" screen and polls the agency until its status is
//   no longer suspended, then forwards to the dashboard. No flash, no bounce.
// ============================================================================

import { useState, useEffect } from 'react';
import { Loader2, Check, CreditCard, LogOut } from 'lucide-react';
import { AGENCY_PLAN_TIER_LIST } from '@/lib/plan-features';

// Pick black or white text for a filled button, based on the brand color's
// luminance, so the label stays readable whatever primary_color the agency set.
function readableTextOn(hex: string): string {
  try {
    const h = (hex || '').replace('#', '');
    if (h.length < 6) return '#ffffff';
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#050505' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

function isStillSuspended(status: string | null | undefined): boolean {
  return status === 'suspended' || status === 'canceled' || status === 'cancelled';
}

type Mode = 'loading' | 'plans' | 'finalizing';

export default function AgencyReactivatePage() {
  const [agency, setAgency] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('loading');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let parsedAgency: any = null;
    let agencyId: string | null = null;
    try {
      const token = localStorage.getItem('auth_token');
      const rawAgency = localStorage.getItem('agency');
      const rawUser = localStorage.getItem('user');
      if (!token || !rawAgency || !rawUser) {
        window.location.href = '/agency/login';
        return;
      }
      parsedAgency = JSON.parse(rawAgency);
      setAgency(parsedAgency);
      try {
        const u = JSON.parse(rawUser);
        setUserEmail(u?.email || null);
        agencyId = parsedAgency?.id || u?.agency_id || null;
      } catch {
        agencyId = parsedAgency?.id || null;
      }
    } catch {
      window.location.href = '/agency/login';
      return;
    }

    // Returned from a successful Stripe Checkout: wait for the webhook to flip
    // the account active, then go to the dashboard.
    const activating =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('status') === 'activating';

    if (activating && agencyId) {
      setMode('finalizing');
      pollUntilActive(agencyId);
      return;
    }

    setMode('plans');
  }, []);

  // Poll the agency until its status is no longer suspended (the webhook has
  // landed), refresh the cached agency, and forward to the dashboard. Times out
  // to the dashboard after ~40s as a safety valve; the layout re-checks status
  // there and, in the rare case the webhook is still not done, sends them back
  // here to the plans.
  const pollUntilActive = async (agencyId: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const token = localStorage.getItem('auth_token');
    const deadline = Date.now() + 40000;

    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${backendUrl}/api/agency/${agencyId}/settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          const fresh = data?.agency;
          if (fresh && !isStillSuspended(fresh.status)) {
            try { localStorage.setItem('agency', JSON.stringify(fresh)); } catch {}
            window.location.href = '/agency/dashboard';
            return;
          }
        }
      } catch {
        // keep polling
      }
      await new Promise((r) => setTimeout(r, 1500));
    }

    window.location.href = '/agency/dashboard';
  };

  const isDark = (agency?.website_theme || 'dark') !== 'light';
  const primary = agency?.primary_color || '#10b981';
  const primaryText = readableTextOn(primary);
  const logoUrl = agency?.logo_url || null;
  const agencyName = agency?.name || 'Your Agency';

  const t = {
    bg: isDark ? '#050505' : '#f9fafb',
    card: isDark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.024), rgba(255,255,255,0.006))'
      : '#ffffff',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    text: isDark ? '#fafaf9' : '#0a0a0a',
    textMuted: isDark ? 'rgba(255,255,255,0.55)' : '#6b7280',
    textFaint: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af',
    logoTile: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    logoTileBorder: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    ghostBtn: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };

  const LogoTile = () => (
    <div
      className="flex items-center justify-center"
      style={{ height: '52px', width: '52px', borderRadius: '14px', background: t.logoTile, border: `1px solid ${t.logoTileBorder}`, overflow: 'hidden' }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={agencyName} style={{ height: '36px', width: 'auto' }} className="object-contain" />
      ) : (
        <img src="/icon-512x512.png" alt="VoiceAI Connect" style={{ height: '52px', width: '52px' }} className="object-cover" />
      )}
    </div>
  );

  // Only paid tiers make sense on a reactivation screen; drop Free.
  const paidPlans = (AGENCY_PLAN_TIER_LIST as any[]).filter((p) => p.id !== 'free');

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setLoadingPlan(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = localStorage.getItem('auth_token');
      const origin = window.location.origin;
      const response = await fetch(`${backendUrl}/api/agency/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          agency_id: agency?.id,
          plan: planId,
          skipTrial: true,
          successUrl: `${origin}/agency/reactivate?status=activating`,
          cancelUrl: `${origin}/agency/reactivate`,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || 'Could not start checkout. Please try again.');
      setLoadingPlan(false);
      setSelectedPlan(null);
    } catch {
      setError('Could not reach billing. Please try again.');
      setLoadingPlan(false);
      setSelectedPlan(null);
    }
  };

  const handleSignOut = () => {
    try { localStorage.clear(); } catch {}
    window.location.href = '/agency/login';
  };

  // ── Loading ─────────────────────────────────────────────────────────
  if (mode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050505' }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: '#10b981' }} />
      </div>
    );
  }

  // ── Finalizing (post-payment) ───────────────────────────────────────
  if (mode === 'finalizing') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: t.bg, zoom: 0.8 } as React.CSSProperties}
      >
        <div className="flex flex-col items-center text-center" style={{ maxWidth: '420px' }}>
          <div className="mb-6"><LogoTile /></div>
          <div className="mb-6">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: primary }} />
          </div>
          <h1 className="mb-3" style={{ fontSize: '1.6rem', lineHeight: 1.1, letterSpacing: '-0.03em', fontWeight: 600, color: t.text }}>
            Activating {agencyName}
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: t.textMuted }}>
            Payment received. Restoring your dashboard, clients, and phone numbers. This takes just a moment.
          </p>
        </div>
      </div>
    );
  }

  // ── Plans ───────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: t.bg, zoom: 0.8 } as React.CSSProperties}
    >
      <div className="w-full" style={{ maxWidth: '820px' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="mb-6"><LogoTile /></div>

          <span
            className="inline-flex items-center gap-2 mb-5"
            style={{ fontFamily: "'Geist Mono', ui-monospace, monospace", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: t.textFaint, padding: '5px 12px', borderRadius: '999px', border: `1px solid ${t.cardBorder}` }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: '#fbbf24', display: 'inline-block' }} />
            Account paused
          </span>

          <h1
            className="mb-3"
            style={{ fontSize: '2rem', lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 600, color: t.text }}
          >
            Reactivate {agencyName}
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: t.textMuted, maxWidth: '460px' }}>
            Choose a plan to restore your clients, phone numbers, and AI receptionists. Everything is preserved exactly as you left it.
          </p>
        </div>

        {error && (
          <div
            className="mx-auto mb-6 rounded-xl px-4 py-3 text-sm text-center"
            style={{ maxWidth: '420px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        {/* ── Plans ──────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8 items-stretch">
          {paidPlans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isLoading = loadingPlan && isSelected;
            const PlanIcon = plan.icon;
            const popular = !!plan.popular;
            const features = [...(plan.features || [])];
            if (plan.rate) features.push(plan.rate);
            return (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-2xl p-6"
                style={{
                  background: t.card,
                  border: `1px solid ${popular ? primary : t.cardBorder}`,
                  boxShadow: popular ? (isDark ? `0 0 0 1px ${primary}26, 0 30px 70px -28px ${primary}40` : '0 20px 50px -24px rgba(0,0,0,0.18)') : 'none',
                }}
              >
                {popular && (
                  <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '-11px' }}>
                    <span
                      style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.01em', backgroundColor: primary, color: primaryText, padding: '4px 12px', borderRadius: '999px', whiteSpace: 'nowrap' }}
                    >
                      Recommended
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-5">
                  <div className="inline-flex items-center justify-center shrink-0" style={{ height: '38px', width: '38px', borderRadius: '11px', backgroundColor: `${primary}1f` }}>
                    {PlanIcon ? <PlanIcon className="h-[18px] w-[18px]" style={{ color: primary }} /> : <CreditCard className="h-[18px] w-[18px]" style={{ color: primary }} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-tight" style={{ color: t.text }}>{plan.name}</h3>
                    <p className="text-xs truncate" style={{ color: t.textFaint }}>{plan.description}</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-5">
                  <span style={{ fontSize: '2.25rem', fontWeight: 600, letterSpacing: '-0.04em', color: t.text }}>${plan.price}</span>
                  <span className="text-sm" style={{ color: t.textFaint }}>/mo</span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {features.map((feature: string) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13.5px]">
                      <span className="flex items-center justify-center shrink-0 mt-[3px]" style={{ height: '16px', width: '16px', borderRadius: '999px', backgroundColor: `${primary}24` }}>
                        <Check className="h-2.5 w-2.5" style={{ color: primary }} strokeWidth={3} />
                      </span>
                      <span style={{ color: t.textMuted }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={popular
                    ? { backgroundColor: primary, color: primaryText }
                    : { backgroundColor: t.ghostBtn, color: t.text, border: `1px solid ${t.cardBorder}` }}
                >
                  {isLoading
                    ? (<><Loader2 className="h-4 w-4 animate-spin" />Redirecting...</>)
                    : (<><CreditCard className="h-4 w-4" />Subscribe ${plan.price}/mo</>)}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[13px]" style={{ color: t.textFaint }}>Billed today. Cancel anytime. Your clients and settings stay intact.</p>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-[13px] transition-opacity hover:opacity-70"
            style={{ color: t.textMuted }}
          >
            <LogOut className="h-3.5 w-3.5" />
            {userEmail ? `Sign out (${userEmail})` : 'Sign out'}
          </button>
        </div>

      </div>
    </div>
  );
}