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
interface Client { id: string; business_name: string; email: string; subscription_status: string; plan_type: string | null; agency_id: string; }

// Phase 1: formatPrice accepts currency. Falls back to USD. Uppercases the
// code because Intl.NumberFormat requires the ISO 4217 form and the DB stores
// lowercase ('usd', 'eur').
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

  const isDark = agency?.website_theme === 'dark';
  const primaryColor = agency?.primary_color || '#6366f1';
  const primaryText = useMemo(() => getContrastColor(primaryColor), [primaryColor]);

  // Phase 1: resolved currency used by every formatPrice call below.
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
    if (agency?.name) document.title = `${agency.name} — Upgrade Your Plan`;
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

      // ──────────────────────────────────────────────────────────────
      // Phase 1: Active-subscription guard — frontend half.
      // If the client already has an active sub (webhook fired, status flipped
      // to 'active'), bounce them to the dashboard before rendering the plan
      // tiles. Without this, a user who came back here after Stripe checkout
      // (state lost, refresh, back-button) could pick a DIFFERENT plan and
      // create a second sub. Backend has a matching 409 guard as a backstop.
      // To change plans, they go through the billing portal from the dashboard.
      // ──────────────────────────────────────────────────────────────
      if (clientData?.subscription_status === 'active') {
        window.location.href = '/client/dashboard';
        return;
      }

      setClient(clientData || null);
      setAgency(cd.agency || (cd.client as any)?.agency);
    } catch (err) { setError('Failed to load account'); }
    finally { setLoading(false); }
  };

  const handleSelectPlan = async (planTier: 'starter' | 'pro' | 'growth') => {
    if (!client) { setError('Account not loaded. Please refresh.'); return; }
    setCheckoutLoading(planTier); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const r = await fetch(`${backendUrl}/api/client/checkout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: client.id, plan: planTier }) });

      if (!r.ok) {
        // Read body ONCE (response stream can only be consumed once)
        let errData: any = {};
        try { errData = await r.json(); } catch {}

        // ─────────────────────────────────────────────────────────────
        // Phase 1: backend says we already have an active subscription.
        // Open the billing portal so the user can change plans there
        // instead of creating a duplicate sub.
        // ─────────────────────────────────────────────────────────────
        if (r.status === 409 && errData.error === 'active_subscription_exists') {
          setError('You already have an active subscription. Opening your billing portal…');
          const portalRes = await fetch(`${backendUrl}/api/client/portal`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: client.id }),
          });
          if (portalRes.ok) {
            const portalData = await portalRes.json();
            if (portalData.url) { window.location.href = portalData.url; return; }
          }
          setError("You already have an active subscription, but we couldn't open the billing portal. Please contact support.");
          setCheckoutLoading(null);
          return;
        }

        throw new Error(errData.error || 'Failed');
      }

      const { url } = await r.json(); if (url) window.location.href = url; else throw new Error('No checkout URL returned');
    } catch (err: any) { setError(err.message || 'Checkout failed'); setCheckoutLoading(null); }
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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2" style={{ color: theme.text }}>{expired ? 'Choose a Plan to Continue' : 'Upgrade Your Plan'}</h1>
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
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-4xl font-bold" style={{ color: primaryColor, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(plan.price, currencyCode)}</span>
                  <span className="text-sm" style={{ color: theme.textMuted4 }}>/mo</span>
                </div>
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

              <button onClick={() => handleSelectPlan(plan.id)} disabled={checkoutLoading !== null}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: plan.popular ? primaryColor : 'transparent', color: plan.popular ? primaryText : primaryColor, border: plan.popular ? 'none' : `2px solid ${primaryColor}` }}>
                {checkoutLoading === plan.id ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><Zap className="h-4 w-4" />Select {plan.name}</>}
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