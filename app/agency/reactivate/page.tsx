'use client';

// ============================================================================
// AGENCY REACTIVATION PAGE  (app/agency/reactivate/page.tsx)
// ----------------------------------------------------------------------------
// A single, self-contained upgrade page for a suspended (lapsed-billing) agency.
// Rendered OUTSIDE the dashboard shell: app/agency/layout.tsx returns children
// directly for this path, so there is no AgencyProvider, no access gates, and
// no session teardown to fight. That is deliberate: the dashboard shell is built
// around active/trial agencies, and dropping a suspended agency into it is what
// caused the payment-required flash and the log-me-back-out loop.
//
// It brands itself from the agency JSON the login page wrote to localStorage
// (logo, primary color, light/dark theme) and starts a REAL Stripe Checkout via
// POST /api/agency/checkout with skipTrial:true. That is the same endpoint the
// trial-expired plan picker uses and it works for an agency with no live
// subscription. It intentionally does NOT call /api/agency/portal (the billing
// portal 400s when there is no subscription to manage), which was the failure
// the settings-tab route hit.
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

export default function AgencyReactivatePage() {
  const [agency, setAgency] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      const rawAgency = localStorage.getItem('agency');
      const rawUser = localStorage.getItem('user');
      if (!token || !rawAgency || !rawUser) {
        window.location.href = '/agency/login';
        return;
      }
      setAgency(JSON.parse(rawAgency));
      setReady(true);
    } catch {
      window.location.href = '/agency/login';
    }
  }, []);

  const isDark = (agency?.website_theme || 'dark') !== 'light';
  const primary = agency?.primary_color || '#10b981';
  const primaryText = readableTextOn(primary);
  const logoUrl = agency?.logo_url || null;
  const agencyName = agency?.name || 'Your Agency';

  const theme = {
    bg: isDark ? '#050505' : '#f9fafb',
    card: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
    cardBorder: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    text: isDark ? '#fafaf9' : '#111827',
    textMuted: isDark ? 'rgba(250,250,249,0.55)' : '#6b7280',
  };

  // Only paid tiers make sense on a reactivation screen; drop Free.
  const paidPlans = (AGENCY_PLAN_TIER_LIST as any[]).filter((p) => p.id !== 'free');

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setLoadingPlan(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agency_id: agency?.id, plan: planId, skipTrial: true }),
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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050505' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#10b981' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="mb-6">
            {logoUrl ? (
              <img src={logoUrl} alt={agencyName} style={{ height: '48px', width: 'auto' }} className="object-contain mx-auto" />
            ) : (
              <img src="/icon-512x512.png" alt="VoiceAI Connect" style={{ height: '56px', width: '56px' }} className="rounded-2xl mx-auto" />
            )}
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${primary}1a` }}>
            <CreditCard className="h-7 w-7" style={{ color: primary }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: theme.text }}>Reactivate your account</h1>
          <p className="mb-2 text-base max-w-lg mx-auto" style={{ color: theme.textMuted }}>
            Your account is paused. Choose a plan to restore your clients, phone numbers, and AI receptionists.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 rounded-xl p-3 text-sm text-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-3xl mx-auto">
          {paidPlans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isLoading = loadingPlan && isSelected;
            const PlanIcon = plan.icon;
            return (
              <div
                key={plan.id}
                className="relative rounded-2xl border p-5 sm:p-6"
                style={{ backgroundColor: theme.card, borderColor: plan.popular ? primary : theme.cardBorder, transform: plan.popular ? 'scale(1.02)' : undefined }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: primary, color: primaryText }}>Recommended</span>
                  </div>
                )}
                <div className="text-center mb-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: `${primary}20` }}>
                    {PlanIcon ? <PlanIcon className="h-5 w-5" style={{ color: primary }} /> : <CreditCard className="h-5 w-5" style={{ color: primary }} />}
                  </div>
                  <p className="text-xs mb-1" style={{ color: theme.textMuted }}>{plan.description}</p>
                  <h3 className="text-lg font-semibold" style={{ color: theme.text }}>{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold" style={{ color: theme.text }}>${plan.price}</span>
                    <span className="text-sm" style={{ color: theme.textMuted }}>/mo</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-5">
                  {(plan.features || []).map((feature: string) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full mt-0.5" style={{ backgroundColor: `${primary}26` }}>
                        <Check className="h-3 w-3" style={{ color: primary }} />
                      </div>
                      <span style={{ color: theme.textMuted }}>{feature}</span>
                    </li>
                  ))}
                  {plan.rate && (
                    <li className="flex items-start gap-2.5 text-sm">
                      <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full mt-0.5" style={{ backgroundColor: `${primary}26` }}>
                        <Check className="h-3 w-3" style={{ color: primary }} />
                      </div>
                      <span style={{ color: theme.textMuted }}>{plan.rate}</span>
                    </li>
                  )}
                </ul>
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primary, color: primaryText }}
                >
                  {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Redirecting...</>) : (<><CreditCard className="h-4 w-4" />Subscribe - ${plan.price}/mo</>)}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Cancel anytime. Your clients and settings are preserved.</p>
          <button onClick={handleSignOut} className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-70" style={{ color: theme.textMuted }}>
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </div>
      </div>
    </div>
  );
}