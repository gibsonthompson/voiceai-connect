'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, AlertTriangle, Phone, Clock, Zap } from 'lucide-react';

function getContrastColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.45 ? '#1f2937' : '#ffffff';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Agency { id: string; name: string; logo_url: string | null; primary_color: string; accent_color: string; price_starter?: number; price_pro?: number; price_growth?: number; limit_starter?: number; limit_pro?: number; limit_growth?: number; website_theme?: string; }
interface Client { id: string; business_name: string; email: string; subscription_status: string; plan_type: string | null; agency_id: string; }

function formatPrice(cents: number | undefined | null): string {
  if (cents === undefined || cents === null || isNaN(cents)) return '$--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}
function formatLimit(limit: number | undefined | null): string {
  if (limit === undefined || limit === null || isNaN(limit) || limit === -1) return 'Unlimited';
  return limit.toLocaleString();
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

  const isDark = agency?.website_theme !== 'light';
  const primaryColor = agency?.primary_color || '#10b981';
  const primaryText = useMemo(() => getContrastColor(primaryColor), [primaryColor]);

  const theme = useMemo(() => ({
    bg: isDark ? '#050505' : '#f9fafb', text: isDark ? '#fafaf9' : '#111827', textMuted: isDark ? 'rgba(250,250,249,0.6)' : '#6b7280',
    textMuted4: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280', textSubtle: isDark ? 'rgba(250,250,249,0.8)' : '#374151',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    card: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    errorBg: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', errorText: isDark ? '#fca5a5' : '#991b1b', errorBorder: 'rgba(239,68,68,0.3)',
    warningBg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', warningText: isDark ? '#fcd34d' : '#92400e',
  }), [isDark]);

  const glass = { backgroundColor: theme.card, border: `1px solid ${theme.border}`, backdropFilter: isDark ? 'blur(20px)' : 'blur(12px)', WebkitBackdropFilter: isDark ? 'blur(20px)' : 'blur(12px)' };

  const isPricingConfigured = agency && typeof agency.price_starter === 'number' && typeof agency.price_pro === 'number' && typeof agency.price_growth === 'number' && !isNaN(agency.price_starter) && !isNaN(agency.price_pro) && !isNaN(agency.price_growth);

  useEffect(() => { fetchClientData(); }, []);

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
      const cd = await cr.json(); setClient(cd.client || cd); setAgency(cd.agency || cd.client?.agency);
    } catch (err) { setError('Failed to load account'); }
    finally { setLoading(false); }
  };

  const handleSelectPlan = async (planTier: 'starter' | 'pro' | 'growth') => {
    if (!client || !isPricingConfigured) { setError('Pricing not configured. Contact support.'); return; }
    setCheckoutLoading(planTier); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      // FIXED: was hitting relative /api/client/create-checkout with wrong field names
      // Backend expects POST /api/client/checkout with { client_id, plan }
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const r = await fetch(`${backendUrl}/api/client/checkout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: client.id, plan: planTier }) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed'); }
      const { url } = await r.json(); if (url) window.location.href = url; else throw new Error('No URL');
    } catch (err: any) { setError(err.message || 'Checkout failed'); setCheckoutLoading(null); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} /></div>;
  if (!client || !agency) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
      <div className="text-center"><AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" /><h1 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>Unable to load account</h1><p className="mb-4" style={{ color: theme.textMuted4 }}>{error || 'Please try logging in again.'}</p><a href="/client/login" className="inline-flex items-center px-4 py-2 rounded-xl font-medium" style={{ backgroundColor: primaryColor, color: primaryText }}>Go to Login</a></div>
    </div>
  );

  const plans = [
    { id: 'starter', name: 'Starter', price: agency.price_starter, limit: agency.limit_starter, popular: false, features: [`${formatLimit(agency.limit_starter)} calls/month`, '24/7 AI receptionist', 'Call summaries & transcripts', 'SMS notifications', 'Basic analytics'] },
    { id: 'pro', name: 'Professional', price: agency.price_pro, limit: agency.limit_pro, popular: true, features: [`${formatLimit(agency.limit_pro)} calls/month`, 'Everything in Starter', 'Priority support', 'Advanced analytics', 'Custom greeting'] },
    { id: 'growth', name: 'Growth', price: agency.price_growth, limit: agency.limit_growth, popular: false, features: [`${formatLimit(agency.limit_growth)} calls/month`, 'Everything in Professional', 'Dedicated support', 'API access', 'Custom integrations'] },
  ];

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5 fu fu2">
          {plans.map(plan => (
            <div key={plan.id} className="relative rounded-2xl p-6 transition-all"
              style={{ ...glass, borderColor: plan.popular ? primaryColor : theme.border, borderWidth: plan.popular ? '2px' : '1px', boxShadow: plan.popular ? `0 0 0 1px ${primaryColor}, 0 8px 30px ${hexToRgba(primaryColor, 0.12)}` : 'none' }}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: primaryColor, color: primaryText }}>Most Popular</div>}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2 tracking-tight" style={{ color: theme.text }}>{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold" style={{ color: primaryColor, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(plan.price)}</span>
                  <span className="text-sm" style={{ color: theme.textMuted4 }}>/mo</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                    <span className="text-[13px]" style={{ color: theme.textSubtle }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSelectPlan(plan.id as any)} disabled={checkoutLoading !== null}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: plan.popular ? primaryColor : 'transparent', color: plan.popular ? primaryText : primaryColor, border: plan.popular ? 'none' : `2px solid ${primaryColor}` }}>
                {checkoutLoading === plan.id ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><Zap className="h-4 w-4" />Select {plan.name}</>}
              </button>
            </div>
          ))}
        </div>

        {/* Trust */}
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