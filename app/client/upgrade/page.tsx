'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, AlertTriangle, Phone, Clock, Zap } from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  price_starter: number;
  price_pro: number;
  price_growth: number;
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
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

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function ClientUpgradePage() {
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === 'true';
  const canceled = searchParams.get('canceled') === 'true';
  
  const [client, setClient] = useState<Client | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Theme
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = agency?.primary_color || '#10b981';

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        window.location.href = '/client/login';
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

      // Verify token and get client ID
      const verifyResponse = await fetch(`${backendUrl}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!verifyResponse.ok) {
        localStorage.removeItem('auth_token');
        window.location.href = '/client/login';
        return;
      }

      const verifyData = await verifyResponse.json();
      const clientId = verifyData.client?.id || verifyData.clientId;

      if (!clientId) {
        window.location.href = '/client/login';
        return;
      }

      // Fetch client data (includes agency info)
      const clientResponse = await fetch(`${backendUrl}/api/client/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!clientResponse.ok) {
        throw new Error('Failed to fetch client data');
      }

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
    
    setCheckoutLoading(planTier);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');

      // Call the Next.js API route which forwards to backend
      const response = await fetch('/api/client/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: client.id,
          planTier: planTier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: isDark ? '#050505' : '#f9fafb' }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
          <p style={{ color: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!client || !agency) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: isDark ? '#050505' : '#f9fafb' }}
      >
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h1 className="text-xl font-semibold mb-2" style={{ color: isDark ? '#fafaf9' : '#111827' }}>
            Unable to load account
          </h1>
          <p className="mb-4" style={{ color: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280' }}>
            {error || 'Please try logging in again.'}
          </p>
          <a
            href="/client/login"
            className="inline-flex items-center px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: primaryColor, color: '#ffffff' }}
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: agency.price_starter,
      limit: agency.limit_starter,
      features: [
        `${agency.limit_starter} calls/month`,
        '24/7 AI receptionist',
        'Call summaries & transcripts',
        'SMS notifications',
        'Basic analytics',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Professional',
      price: agency.price_pro,
      limit: agency.limit_pro,
      features: [
        `${agency.limit_pro} calls/month`,
        'Everything in Starter',
        'Priority support',
        'Advanced analytics',
        'Custom greeting',
      ],
      popular: true,
    },
    {
      id: 'growth',
      name: 'Growth',
      price: agency.price_growth,
      limit: agency.limit_growth,
      features: [
        `${agency.limit_growth} calls/month`,
        'Everything in Professional',
        'Dedicated support',
        'API access',
        'Custom integrations',
      ],
      popular: false,
    },
  ];

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: isDark ? '#050505' : '#f9fafb' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {agency.logo_url && (
            <img 
              src={agency.logo_url} 
              alt={agency.name}
              className="h-12 mx-auto mb-4 object-contain"
            />
          )}
          
          {expired && (
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{
                backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                color: isDark ? '#fca5a5' : '#991b1b',
              }}
            >
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Your trial has ended</span>
            </div>
          )}

          {canceled && (
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{
                backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb',
                color: isDark ? '#fcd34d' : '#92400e',
              }}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Checkout was canceled</span>
            </div>
          )}
          
          <h1 
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: isDark ? '#fafaf9' : '#111827' }}
          >
            {expired ? 'Choose a Plan to Continue' : 'Upgrade Your Plan'}
          </h1>
          <p style={{ color: isDark ? 'rgba(250,250,249,0.6)' : '#6b7280' }}>
            Keep your AI receptionist answering calls 24/7
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-6 p-4 rounded-lg flex items-center gap-3"
            style={{
              backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm" style={{ color: isDark ? '#fca5a5' : '#991b1b' }}>{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 transition-all ${
                plan.popular ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                border: `1px solid ${plan.popular ? primaryColor : (isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb')}`,
                ringColor: primaryColor,
              }}
            >
              {plan.popular && (
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: primaryColor, color: '#ffffff' }}
                >
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: isDark ? '#fafaf9' : '#111827' }}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span 
                    className="text-4xl font-bold"
                    style={{ color: primaryColor }}
                  >
                    {formatPrice(plan.price)}
                  </span>
                  <span style={{ color: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280' }}>/mo</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check 
                      className="h-5 w-5 flex-shrink-0 mt-0.5" 
                      style={{ color: primaryColor }} 
                    />
                    <span 
                      className="text-sm"
                      style={{ color: isDark ? 'rgba(250,250,249,0.8)' : '#374151' }}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id as 'starter' | 'pro' | 'growth')}
                disabled={checkoutLoading !== null}
                className="w-full py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: plan.popular ? primaryColor : 'transparent',
                  color: plan.popular ? '#ffffff' : primaryColor,
                  border: plan.popular ? 'none' : `2px solid ${primaryColor}`,
                }}
              >
                {checkoutLoading === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Select {plan.name}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2" style={{ color: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280' }}>
              <Phone className="h-5 w-5" />
              <span className="text-sm">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280' }}>
              <Check className="h-5 w-5" />
              <span className="text-sm">No setup fees</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280' }}>
              <Clock className="h-5 w-5" />
              <span className="text-sm">Instant activation</span>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <a
            href="/client/dashboard"
            className="text-sm hover:underline"
            style={{ color: isDark ? 'rgba(250,250,249,0.5)' : '#6b7280' }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}