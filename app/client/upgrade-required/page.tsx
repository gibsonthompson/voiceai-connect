'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, AlertTriangle, Phone, Clock, Zap, X } from 'lucide-react';
import { buildClientPlans, type ClientPlanTile } from '@/lib/plan-features-meta';

function getContrastColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.45 ? '#1f2937' : '#ffffff';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Phase 3: Agency now also carries the plan rebranding columns + plan_features
// so buildClientPlans can render agency-specific tier names, taglines, and
// the actual toggled features instead of the invented hardcoded list that
// used to live here.
interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  price_starter?: number;
  price_pro?: number;
  price_growth?: number;
  limit_starter?: number;
  limit_pro?: number;
  limit_growth?: number;
  website_theme?: string;
  country?: string | null;
  currency?: string | null;
  display_currency?: string | null;
  plan_starter_name?: string | null;
  plan_pro_name?: string | null;
  plan_growth_name?: string | null;
  plan_starter_description?: string | null;
  plan_pro_description?: string | null;
  plan_growth_description?: string | null;
  plan_features?: Record<string, Record<string, boolean | number>> | null;
}
interface Client { id: string; business_name: string; email: string; subscription_status: string; plan_type: string | null; agency_id: string; stripe_connected_subscription_id?: string | null; }

// formatPrice accepts currency. Falls back to USD. Uppercases the code because
// Intl.NumberFormat requires the ISO 4217 form and the DB stores lowercase
// ('usd', 'eur').
function formatPrice(cents: number | undefined | null, currency?: string | null): string {
  const value = cents ?? 0;
  if (isNaN(value)) return '$--';
  const code = (currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, minimumFractionDigits: 0 }).format(value / 100);
  } catch {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value / 100);
  }
}

const ANIM_CSS = `@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .45s ease-out both}.fu1{animation-delay:40ms}.fu2{animation-delay:80ms}.fu3{animation-delay:120ms}`;

function ClientUpgradeContent() {
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === 'true';
  const canceled = searchParams.get('canceled') === 'true';
  const [client, setClient] = useState<Client | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Plan tile pending confirmation for an in-app plan change (active clients).
  const [confirmPlan, setConfirmPlan] = useState<ClientPlanTile | null>(null);
  // True while /api/client/change-plan is in flight for the confirmed plan.
  const [changing, setChanging] = useState(false);

  // An active client already has a live connected subscription, so selecting a
  // plan here modifies that subscription (proration) rather than creating a new
  // one. Everyone else (expired trial, canceled, no sub) goes to checkout.
  const isActive =
    client?.subscription_status === 'active' ||
    !!client?.stripe_connected_subscription_id;

  const isDark = agency?.website_theme === 'dark';
  const primaryColor = agency?.primary_color || '#6366f1';
  const primaryText = useMemo(() => getContrastColor(primaryColor), [primaryColor]);

  // Resolved currency used by formatPrice below (agency display currency, then
  // the raw currency column, then USD).
  const currencyCode = agency?.display_currency || agency?.currency || 'USD';

  // Phase 3: single source of truth for plan tiles. buildClientPlans handles
  // pricing defaults, the rebranded name/description, the call-limit display,
  // and converting the plan_features JSONB into included/excluded label lists.
  // useMemo so it doesn't rebuild on every render while checkout is loading.
  const plans: ClientPlanTile[] = useMemo(
    () => (agency ? buildClientPlans(agency) : []),
    [agency]
  );

  const theme = useMemo(() => ({
    bg: isDark ? '#050505' : '#f9fafb', text: isDark ? '#fafaf9' : '#111827', textMuted: isDark ? 'rgba(250,250,249,0.6)' : '#6b7280',
    textMuted4: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280', textSubtle: isDark ? 'rgba(250,250,249,0.8)' : '#374151',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    card: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    errorBg: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', errorText: isDark ? '#fca5a5' : '#991b1b', errorBorder: 'rgba(239,68,68,0.3)',
    warningBg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', warningText: isDark ? '#fcd34d' : '#92400e',
    excludedBg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    excludedText: isDark ? 'rgba(250,250,249,0.3)' : '#9ca3af',
    excludedIcon: isDark ? 'rgba(250,250,249,0.2)' : '#d1d5db',
  }), [isDark]);

  const glass = { backgroundColor: theme.card, border: `1px solid ${theme.border}`, backdropFilter: isDark ? 'blur(20px)' : 'blur(12px)', WebkitBackdropFilter: isDark ? 'blur(20px)' : 'blur(12px)' };

  useEffect(() => { fetchClientData(); }, []);

  useEffect(() => {
    if (agency?.name) document.title = `${agency.name} - ${isActive ? 'Change Your Plan' : 'Upgrade Your Plan'}`;
    if (agency?.logo_url) {
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = agency.logo_url;
      document.head.appendChild(link);
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = agency.logo_url;
      document.head.appendChild(appleLink);
    }
  }, [agency]);

  const fetchClientData = async () => {
    try {
      const token = localStorage.getItem('auth_token'); const storedClient = localStorage.getItem('client');
      if (!token) { window.location.href = '/client/login'; return; }
      let clientId: string | null = null;
      if (storedClient) { try { clientId = JSON.parse(storedClient).id; } catch {} }
      if (!clientId) {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const vr = await fetch(`${backendUrl}/api/auth/verify`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!vr.ok) { localStorage.removeItem('auth_token'); localStorage.removeItem('client'); localStorage.removeItem('user'); window.location.href = '/client/login'; return; }
        const vd = await vr.json(); clientId = vd.user?.client_id;
      }
      if (!clientId) { window.location.href = '/client/login'; return; }
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const cr = await fetch(`${backendUrl}/api/client/${clientId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!cr.ok) throw new Error('Failed');
      const cd = await cr.json();
      const clientData: Client | undefined = cd.client || cd;

      // Active clients are NOT bounced anymore. Previously an active sub sent
      // the user to the dashboard to avoid creating a duplicate subscription on
      // the checkout path. Now selecting a plan while active routes to
      // /api/client/change-plan (see handleSelectPlan), which modifies the
      // existing subscription in place, so there is no duplicate-sub risk and
      // this page doubles as the in-app plan switcher. The backend 409 guard on
      // checkout still stands as a backstop if state is stale.

      setClient(clientData || null);
      setAgency(cd.agency || (cd.client as any)?.agency);
    } catch (err) { setError('Failed to load account'); }
    finally { setLoading(false); }
  };

  const handleSelectPlan = async (planTier: 'starter' | 'pro' | 'growth') => {
    if (!client) { setError('Account not loaded. Please refresh.'); return; }
    setError(null);

    // Active client: this is a plan CHANGE, not a new checkout. Open the
    // confirm dialog for the selected tile; the actual swap runs in
    // confirmChangePlan against /api/client/change-plan.
    if (isActive) {
      if (planTier === client.plan_type) return; // already on this plan
      setConfirmPlan(plans.find(p => p.id === planTier) || null);
      return;
    }

    // No live subscription (expired trial / canceled / never subscribed):
    // create one via Stripe checkout.
    setCheckoutLoading(planTier);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const r = await fetch(`${backendUrl}/api/client/checkout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: client.id, plan: planTier }) });

      if (!r.ok) {
        // Read body ONCE (response stream can only be consumed once)
        let errData: any = {};
        try { errData = await r.json(); } catch {}

        // Stale local state: the backend says a subscription is already active.
        // The billing portal has no plan switch configured, so instead of that
        // dead end, drop the user into the in-app change-plan confirm for the
        // tile they picked.
        if (r.status === 409 && errData.error === 'active_subscription_exists') {
          setCheckoutLoading(null);
          setConfirmPlan(plans.find(p => p.id === planTier) || null);
          return;
        }

        throw new Error(errData.error || 'Failed');
      }

      const { url } = await r.json(); if (url) window.location.href = url; else throw new Error('No checkout URL returned');
    } catch (err: any) { setError(err.message || 'Checkout failed'); setCheckoutLoading(null); }
  };

  // Confirmed in-app plan change for an active subscription. The backend swaps
  // the subscription item with proration and writes plan_type +
  // monthly_call_limit together, so those never desync from Stripe. On success
  // we send the client back to the dashboard.
  const confirmChangePlan = async () => {
    if (!client || !confirmPlan) return;
    setChanging(true); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const r = await fetch(`${backendUrl}/api/client/change-plan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.id, plan: confirmPlan.id }),
      });
      if (!r.ok) {
        let errData: any = {};
        try { errData = await r.json(); } catch {}
        throw new Error(errData.error || 'Could not change your plan. Please contact support.');
      }
      window.location.href = '/client/dashboard?plan_changed=true';
    } catch (err: any) {
      setError(err.message || 'Could not change your plan. Please contact support.');
      setChanging(false);
      setConfirmPlan(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9ca3af' }} /></div>;
  if (!client || !agency) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
      <div className="text-center"><AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" /><h1 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>Unable to load account</h1><p className="mb-4" style={{ color: theme.textMuted4 }}>{error || 'Please try logging in again.'}</p><a href="/client/login" className="inline-flex items-center px-4 py-2 rounded-xl font-medium" style={{ backgroundColor: primaryColor, color: primaryText }}>Go to Login</a></div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS + `\n::selection { background-color: ${primaryColor}40; color: inherit; }` }} />
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 fu fu1">
          {agency.logo_url && <img src={agency.logo_url} alt={agency.name} className="h-12 mx-auto mb-4 object-contain" />}
          {expired && <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: theme.errorBg, color: theme.errorText }}><Clock className="h-4 w-4" /><span className="text-sm font-medium">Your trial has ended</span></div>}
          {canceled && <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: theme.warningBg, color: theme.warningText }}><AlertTriangle className="h-4 w-4" /><span className="text-sm font-medium">Checkout was canceled</span></div>}
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2" style={{ color: theme.text }}>{expired ? 'Choose a Plan to Continue' : isActive ? 'Change Your Plan' : 'Upgrade Your Plan'}</h1>
          <p className="text-[15px]" style={{ color: theme.textMuted }}>Keep your AI receptionist answering calls 24/7</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl flex items-center gap-3 fu fu1" style={{ ...glass, borderColor: theme.errorBorder }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: theme.errorText }} />
            <p className="text-sm" style={{ color: theme.errorText }}>{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5 fu fu2">
          {plans.map(plan => (
            <div key={plan.id} className="relative rounded-2xl p-6 transition-all"
              style={{ ...glass, borderColor: plan.popular ? primaryColor : theme.border, borderWidth: plan.popular ? '2px' : '1px', boxShadow: plan.popular ? `0 0 0 1px ${primaryColor}, 0 8px 30px ${hexToRgba(primaryColor, 0.12)}` : 'none' }}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: primaryColor, color: primaryText }}>Most Popular</div>}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-1 tracking-tight" style={{ color: theme.text }}>{plan.name}</h3>
                {/* Phase 3: agency-provided tagline. Skipped silently if null. */}
                {plan.description && (
                  <p className="text-[12px] mb-3" style={{ color: theme.textMuted }}>{plan.description}</p>
                )}
                {/* Price pulled from the agency's per-tier pricing via
                    buildClientPlans (plan.price), formatted in the agency's
                    currency. */}
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-4xl font-bold" style={{ color: primaryColor, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(plan.price, currencyCode)}</span>
                  <span className="text-sm" style={{ color: theme.textMuted4 }}>/mo</span>
                </div>
                {isActive && client?.plan_type === plan.id && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: hexToRgba(primaryColor, 0.12), color: primaryColor }}>
                    <Check className="h-3 w-3" />Current plan
                  </div>
                )}
              </div>

              {/* Included features — sourced from buildClientPlans so it reflects
                  exactly what the agency toggled in Settings → Pricing. The
                  call-limit string and team-member count are already inlined. */}
              <ul className="space-y-2.5 mb-4">
                {plan.included.map((f, i) => (
                  <li key={`inc-${i}`} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                    <span className="text-[13px]" style={{ color: theme.textSubtle }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Excluded features — greyed out so the user can see what they'd
                  gain by picking a higher tier. Same pattern as /signup/plan. */}
              {plan.excluded.length > 0 && (
                <ul className="space-y-2.5 mb-6">
                  {plan.excluded.map((f, i) => (
                    <li key={`exc-${i}`} className="flex items-start gap-2.5">
                      <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full mt-0.5" style={{ backgroundColor: theme.excludedBg }}>
                        <X className="h-2.5 w-2.5" style={{ color: theme.excludedIcon }} />
                      </div>
                      <span className="text-[13px]" style={{ color: theme.excludedText }}>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              {plan.excluded.length === 0 && <div className="mb-6" />}

              <button onClick={() => handleSelectPlan(plan.id)} disabled={(isActive && client?.plan_type === plan.id) || checkoutLoading !== null || changing}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                style={{ backgroundColor: plan.popular ? primaryColor : 'transparent', color: plan.popular ? primaryText : primaryColor, border: plan.popular ? 'none' : `2px solid ${primaryColor}` }}>
                {checkoutLoading === plan.id
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>
                  : (isActive && client?.plan_type === plan.id)
                    ? <>Current Plan</>
                    : <><Zap className="h-4 w-4" />{isActive ? `Switch to ${plan.name}` : `Select ${plan.name}`}</>}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center fu fu3">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[{ icon: Phone, label: 'Cancel anytime' }, { icon: Check, label: 'No setup fees' }, { icon: Clock, label: 'Instant activation' }].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2" style={{ color: theme.textMuted4 }}><Icon className="h-4 w-4" /><span className="text-sm">{label}</span></div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center"><a href="/client/dashboard" className="text-sm hover:underline" style={{ color: theme.textMuted4 }}>← Back to Dashboard</a></div>
      </div>

      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => { if (!changing) setConfirmPlan(null); }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ ...glass, backgroundColor: isDark ? '#0c0c0c' : '#ffffff' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text }}>Switch to {confirmPlan.name}?</h3>
            <p className="text-sm mb-5" style={{ color: theme.textMuted }}>Your plan changes right away and your AI receptionist keeps running. Your next invoice is adjusted automatically for the part of the cycle you have already used.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmPlan(null)} disabled={changing}
                className="flex-1 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: 'transparent', color: theme.textSubtle, border: `1px solid ${theme.border}` }}>
                Cancel
              </button>
              <button onClick={confirmChangePlan} disabled={changing}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor, color: primaryText }}>
                {changing ? <><Loader2 className="h-4 w-4 animate-spin" />Switching...</> : <>Confirm switch</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientUpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#6b7280' }} /></div>}>
      <ClientUpgradeContent />
    </Suspense>
  );
}