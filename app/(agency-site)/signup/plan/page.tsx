'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, ArrowRight, Loader2, Check, ArrowLeft } from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  price_starter: number;
  price_pro: number;
  price_growth: number;
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
}

interface SignupData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  state: string;
  industry: string;
  agency_id: string;
  agency_slug: string;
}

function PlanSelectionContent() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(true);
  const [error, setError] = useState('');
  const [agency, setAgency] = useState<Agency | null>(null);
  const [signupData, setSignupData] = useState<SignupData | null>(null);

  // Load signup data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('client_signup_data');
    if (stored) {
      setSignupData(JSON.parse(stored));
    } else {
      // No signup data, redirect back to signup
      router.push('/signup');
    }
  }, [router]);

  // Fetch agency info based on current hostname
  useEffect(() => {
    const fetchAgency = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const host = window.location.host;
        const url = `${backendUrl}/api/agency/by-host?host=${host}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Agency not found');
        }
        
        const data = await response.json();
        setAgency(data.agency);
      } catch (err) {
        console.error('Failed to fetch agency:', err);
        setError('Unable to load agency information.');
      } finally {
        setAgencyLoading(false);
      }
    };

    fetchAgency();
  }, []);

  const handleSelectPlan = async (planType: string) => {
    if (!agency || !signupData) return;
    
    setSelectedPlan(planType);
    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      // Create client and get Stripe checkout URL
      const response = await fetch(`${backendUrl}/api/client/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...signupData,
          plan_type: planType,
          agency_id: agency.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Clear stored data
      sessionStorage.removeItem('client_signup_data');

      // Redirect to Stripe checkout or success page
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.client) {
        // Trial without payment - redirect to success/dashboard
        router.push('/signup/success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for colors
  const isLightColor = (hex: string): boolean => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const primaryColor = agency?.primary_color || '#2563eb';
  const accentColor = agency?.accent_color || '#3b82f6';
  const primaryLight = isLightColor(primaryColor);

  if (agencyLoading || !signupData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-2">Agency Not Found</h1>
          <p className="text-white/50">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: agency.price_starter || 4900,
      calls: agency.limit_starter || 50,
      features: [
        'AI receptionist',
        `Up to ${agency.limit_starter || 50} calls/month`,
        'SMS notifications',
        'Call transcripts',
        'Basic analytics',
      ],
    },
    {
      id: 'pro',
      name: 'Professional',
      price: agency.price_pro || 9900,
      calls: agency.limit_pro || 150,
      popular: true,
      features: [
        'Everything in Starter',
        `Up to ${agency.limit_pro || 150} calls/month`,
        'Priority support',
        'Custom greeting',
        'Advanced analytics',
      ],
    },
    {
      id: 'growth',
      name: 'Growth',
      price: agency.price_growth || 14900,
      calls: agency.limit_growth || 500,
      features: [
        'Everything in Professional',
        `Up to ${agency.limit_growth || 500} calls/month`,
        'Dedicated support',
        'API access',
        'Custom integrations',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      {/* Subtle grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {agency.logo_url ? (
                <img src={agency.logo_url} alt={agency.name} className="h-9 w-9 rounded-lg object-contain" />
              ) : (
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Phone className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
                </div>
              )}
              <span className="text-lg font-medium tracking-tight">{agency.name}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-16 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl opacity-[0.07]"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Back Button */}
          <Link 
            href="/signup"
            className="inline-flex items-center gap-2 text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to signup
          </Link>

          {/* Progress Indicator */}
          <div className="mb-8 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className="h-2 w-12 rounded-full transition-colors"
                  style={{ backgroundColor: s <= 2 ? primaryColor : 'rgba(255,255,255,0.1)' }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-medium tracking-tight">Choose Your Plan</h1>
            <p className="mt-3 text-lg text-[#f5f5f0]/50">
              Start with a 7-day free trial. Cancel anytime.
            </p>
          </div>

          {error && (
            <div className="mb-8 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Plan Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 transition-all ${
                  plan.popular 
                    ? 'border-white/20 bg-[#111] scale-105' 
                    : 'border-white/10 bg-[#0d0d0d] hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: primaryColor,
                      color: primaryLight ? '#0a0a0a' : '#f5f5f0',
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-[#f5f5f0]/50">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-[#f5f5f0]/50">
                    {plan.calls} calls included
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[#f5f5f0]/70">
                      <div 
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5"
                        style={{ backgroundColor: `${accentColor}1A` }}
                      >
                        <Check className="h-3 w-3" style={{ color: accentColor }} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading}
                  className={`group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    plan.popular
                      ? ''
                      : 'bg-white/10 text-[#f5f5f0] hover:bg-white/20'
                  }`}
                  style={plan.popular ? { 
                    backgroundColor: primaryColor,
                    color: primaryLight ? '#0a0a0a' : '#f5f5f0',
                  } : undefined}
                >
                  {loading && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-12 text-center">
            <p className="text-sm text-[#f5f5f0]/40">
              ✓ 7-day free trial &nbsp;•&nbsp; ✓ No credit card required to start &nbsp;•&nbsp; ✓ Cancel anytime
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AgencySitePlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    }>
      <PlanSelectionContent />
    </Suspense>
  );
}