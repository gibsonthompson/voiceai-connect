'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, ArrowRight, ArrowLeft, Loader2, Check, PhoneCall, Zap, Rocket } from 'lucide-react';
import DynamicFavicon from '@/components/DynamicFavicon';

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
  stripe_account_id: string | null;
}

interface SignupData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  industry: string;
  agency_id: string;
  agency_slug: string;
}

type PlanType = 'starter' | 'pro' | 'growth';

// Get backend URL - check multiple env vars for compatibility
const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 
         process.env.NEXT_PUBLIC_API_URL || 
         'https://urchin-app-bqb4i.ondigitalocean.app';
};

function ClientPlanSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agencySlug = searchParams.get('agency');
  
  const [loading, setLoading] = useState(false);
  const [agencyLoading, setAgencyLoading] = useState(true);
  const [error, setError] = useState('');
  const [agency, setAgency] = useState<Agency | null>(null);
  const [signupData, setSignupData] = useState<SignupData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');

  // Load signup data from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem('client_signup_data');
    if (storedData) {
      setSignupData(JSON.parse(storedData));
    } else {
      // Redirect back to signup if no data
      router.push(`/client/signup${agencySlug ? `?agency=${agencySlug}` : ''}`);
    }
  }, [router, agencySlug]);

  // Fetch agency info
  useEffect(() => {
    const fetchAgency = async () => {
      try {
        const backendUrl = getBackendUrl();
        let url = '';
        
        if (agencySlug) {
          url = `${backendUrl}/api/agency/by-host?host=${agencySlug}.voiceaiconnect.com`;
        } else {
          const host = window.location.host;
          url = `${backendUrl}/api/agency/by-host?host=${host}`;
        }
        
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
  }, [agencySlug]);

  const handleContinue = async () => {
    if (!agency || !signupData) return;
    
    setLoading(true);
    setError('');

    try {
      const backendUrl = getBackendUrl();
      
      // Map frontend field names to backend expected names
      const payload = {
        firstName: signupData.ownerName.split(' ')[0],
        lastName: signupData.ownerName.split(' ').slice(1).join(' ') || '',
        email: signupData.email,
        phone: signupData.phone,
        businessName: signupData.businessName,
        businessCity: signupData.city,
        businessState: signupData.state,
        industry: signupData.industry,
        agencyId: signupData.agency_id,
        plan_type: selectedPlan,
      };
      
      // Create client
      const response = await fetch(`${backendUrl}/api/client/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Something went wrong');
      }

      // Clear signup data from session
      sessionStorage.removeItem('client_signup_data');

      // Redirect to set-password page with token
      if (data.token) {
        router.push(`/auth/set-password?token=${data.token}`);
      } else {
        // Fallback: show success message and redirect to login
        router.push(`/client/login?signup=success`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  // Helper functions
  const isLightColor = (hex: string): boolean => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const primaryColor = agency?.primary_color || '#2563eb';
  const accentColor = agency?.accent_color || '#3b82f6';
  const primaryLight = isLightColor(primaryColor);

  const plans = agency ? [
    {
      id: 'starter' as PlanType,
      name: 'Starter',
      price: agency.price_starter || 4900,
      calls: agency.limit_starter || 50,
      icon: PhoneCall,
      features: [
        `${agency.limit_starter || 50} calls/month`,
        'AI receptionist',
        'SMS notifications',
        'Call summaries',
        'Business hours routing',
      ],
    },
    {
      id: 'pro' as PlanType,
      name: 'Pro',
      price: agency.price_pro || 9900,
      calls: agency.limit_pro || 150,
      icon: Zap,
      popular: true,
      features: [
        `${agency.limit_pro || 150} calls/month`,
        'Everything in Starter',
        'Priority support',
        'Custom greeting',
        'After-hours handling',
        'Appointment scheduling',
      ],
    },
    {
      id: 'growth' as PlanType,
      name: 'Growth',
      price: agency.price_growth || 14900,
      calls: agency.limit_growth || 500,
      icon: Rocket,
      features: [
        `${agency.limit_growth || 500} calls/month`,
        'Everything in Pro',
        'Multiple locations',
        'Advanced analytics',
        'CRM integration',
        'Dedicated support',
      ],
    },
  ] : [];

  if (agencyLoading) {
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      <DynamicFavicon logoUrl={agency?.logo_url} primaryColor={primaryColor} />
      
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
            <div className="flex items-center gap-3">
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
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-16 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-[0.05]"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl">
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

          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-medium tracking-tight">Choose Your Plan</h1>
            <p className="mt-2 text-[#f5f5f0]/50">
              Select the plan that fits your business needs
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl border p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? 'scale-[1.02]' 
                    : 'hover:border-white/20'
                }`}
                style={{
                  borderColor: selectedPlan === plan.id ? primaryColor : 'rgba(255,255,255,0.1)',
                  backgroundColor: selectedPlan === plan.id ? `${primaryColor}0D` : '#111',
                }}
              >
                {'popular' in plan && plan.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: accentColor, color: isLightColor(accentColor) ? '#0a0a0a' : '#f5f5f0' }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${primaryColor}1A` }}
                  >
                    <plan.icon className="h-6 w-6" style={{ color: primaryColor }} />
                  </div>
                  {selectedPlan === plan.id && (
                    <div 
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Check className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                  <span className="text-[#f5f5f0]/50">/month</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[#f5f5f0]/70">
                      <Check className="h-4 w-4 flex-shrink-0" style={{ color: primaryColor }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="max-w-md mx-auto mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Continue Button */}
          <div className="flex justify-center">
            <button
              onClick={handleContinue}
              disabled={loading}
              className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: primaryColor,
                color: primaryLight ? '#0a0a0a' : '#f5f5f0',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating your account...
                </>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>

          {/* Trial note */}
          <p className="mt-6 text-center text-sm text-[#f5f5f0]/40">
            7-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ClientPlanSelectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    }>
      <ClientPlanSelectionContent />
    </Suspense>
  );
}