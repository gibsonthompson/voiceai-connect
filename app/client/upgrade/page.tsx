'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, AlertTriangle, Phone, Clock, Zap } from 'lucide-react';

// ============================================================================
// COLOR UTILITIES
// ============================================================================

function getContrastColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.45 ? '#1f2937' : '#ffffff';
}

// ============================================================================
// INTERFACES
// ============================================================================

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
}

interface Client {
  id: string;
  business_name: string;
  email: string;
  subscription_status: string;
  plan_type: string | null;
  agency_id: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatPrice(cents: number | undefined | null): string {
  if (cents === undefined || cents === null || isNaN(cents)) return '$--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

function formatLimit(limit: number | undefined | null): string {
  if (limit === undefined || limit === null || isNaN(limit)) return 'Unlimited';
  return limit.toLocaleString();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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

  // Local theme (this page is outside ClientProvider)
  const theme = useMemo(() => ({
    bg: isDark ? '#050505' : '#f9fafb',
    text: isDark ? '#fafaf9' : '#111827',
    textMuted: isDark ? 'rgba(250,250,249,0.6)' : '#6b7280',
    textMuted4: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280',
    textSubtle: isDark ? 'rgba(250,250,249,0.8)' : '#374151',
    border: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb',
    card: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
    errorBg: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
    errorText: isDark ? '#fca5a5' : '#991b1b',
    errorBorder: 'rgba(239,68,68,0.3)',
    warningBg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb',
    warningText: isDark ? '#fcd34d' : '#92400e',
  }), [isDark]);

  const isPricingConfigured = agency && 
    typeof agency.price_starter === 'number' && 
    typeof agency.price_pro === 'number' && 
    typeof agency.price_growth === 'number' &&
    !isNaN(agency.price_starter) && !isNaN(agency.price_pro) && !isNaN(agency.price_growth);

  useEffect(() => { fetchClientData(); }, []);

  const fetchClientData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const storedClient = localStorage.getItem('client');
      
      if (!token) { window.location.href = '/client/login'; return; }

      let clientId: string | null = null;
      
      if (storedClient) {
        try { clientId = JSON.parse(storedClient).id; } catch (e) { console.error('Failed to parse stored client:', e); }
      }

      if (!clientId) {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const verifyResponse = await fetch(`${backendUrl}/api/auth/verify`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!verifyResponse.ok) {
          localStorage.removeItem('auth_token'); localStorage.removeItem('client'); localStorage.removeItem('user');
          window.location.href = '/client/login'; return;
        }
        const verifyData = await verifyResponse.json();
        clientId = verifyData.user?.client_id;
      }

      if (!clientId) { window.location.href = '/client/login'; return; }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const clientResponse = await fetch(`${backendUrl}/api/client/${clientId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!clientResponse.ok) throw new Error('Failed to fetch client data');

      const clientData = await clientResponse.json();
      setClient(clientData.client || clientData);
      setAgency(clientData.agency || clientData.client?.agency);
    } catch (err) {
      console.error('Error fetching client data:', err);
      setError('Failed to load your account information');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planTier: 'starter' | 'pro' | 'growth') => {
    if (!client) return;
    if (!isPricingConfigured) { setError('Pricing plans are not yet configured. Please contact support.'); return; }
    setCheckoutLoading(planTier);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/client/create-checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, planTier }),
      });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Failed to create checkout session'); }
      const { url } = await response.json();
      if (url) { window.location.href = url; } else { throw new Error('No checkout URL returned'); }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
          <p style={{ color: theme.textMuted4 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!client || !agency) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h1 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>Unable to load account</h1>
          <p className="mb-4" style={{ color: theme.textMuted4 }}>{error || 'Please try logging in again.'}</p>
          <a href="/client/login" className="inline-flex items-center px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: primaryColor, color: primaryText }}>
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: 'starter', name: 'Starter', price: agency.price_starter, limit: agency.limit_starter, popular: false,
      features: [`${formatLimit(agency.limit_starter)} calls/month`, '24/7 AI receptionist', 'Call summaries & transcripts', 'SMS notifications', 'Basic analytics'],
    },
    {
      id: 'pro', name: 'Professional', price: agency.price_pro, limit: agency.limit_pro, popular: true,
      features: [`${formatLimit(agency.limit_pro)} calls/month`, 'Everything in Starter', 'Priority support', 'Advanced analytics', 'Custom greeting'],
    },
    {
      id: 'growth', name: 'Growth', price: agency.price_growth, limit: agency.limit_growth, popular: false,
      features: [`${formatLimit(agency.limit_growth)} calls/month`, 'Everything in Professional', 'Dedicated support', 'API access', 'Custom integrations'],
    },
  ];

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: theme.bg }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {agency.logo_url && <img src={agency.logo_url} alt={agency.name} className="h-12 mx-auto mb-4 object-contain" />}
          
          {expired && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: theme.errorBg, color: theme.errorText }}>
              <Clock className="h-4 w-4" /><span className="text-sm font-medium">Your trial has ended</span>
            </div>
          )}

          {canceled && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: theme.warningBg, color: theme.warningText }}>
              <AlertTriangle className="h-4 w-4" /><span className="text-sm font-medium">Checkout was canceled</span>
            </div>
          )}
          
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: theme.text }}>
            {expired ? 'Choose a Plan to Continue' : 'Upgrade Your Plan'}
          </h1>
          <p style={{ color: theme.textMuted }}>Keep your AI receptionist answering calls 24/7</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: theme.errorText }} />
            <p className="text-sm" style={{ color: theme.errorText }}>{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl p-6 transition-all"
              style={{
                backgroundColor: theme.card,
                border: `2px solid ${plan.popular ? primaryColor : theme.border}`,
                boxShadow: plan.popular ? `0 0 0 1px ${primaryColor}, 0 4px 20px ${primaryColor}20` : 'none',
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: primaryColor, color: primaryText }}>
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text }}>{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold" style={{ color: primaryColor }}>{formatPrice(plan.price)}</span>
                  <span style={{ color: theme.textMuted4 }}>/mo</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                    <span className="text-sm" style={{ color: theme.textSubtle }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id as 'starter' | 'pro' | 'growth')}
                disabled={checkoutLoading !== null}
                className="w-full py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: plan.popular ? primaryColor : 'transparent',
                  color: plan.popular ? primaryText : primaryColor,
                  border: plan.popular ? 'none' : `2px solid ${primaryColor}`,
                }}
              >
                {checkoutLoading === plan.id ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>
                ) : (
                  <><Zap className="h-4 w-4" />Select {plan.name}</>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: Phone, label: 'Cancel anytime' },
              { icon: Check, label: 'No setup fees' },
              { icon: Clock, label: 'Instant activation' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2" style={{ color: theme.textMuted4 }}>
                <Icon className="h-5 w-5" /><span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/client/dashboard" className="text-sm hover:underline" style={{ color: theme.textMuted4 }}>← Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
}

function UpgradePageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export default function ClientUpgradePage() {
  return (
    <Suspense fallback={<UpgradePageLoading />}>
      <ClientUpgradeContent />
    </Suspense>
  );
}