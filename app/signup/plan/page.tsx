'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, ArrowRight, Loader2, Check, ArrowLeft } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const isLightColor = (hex: string): boolean => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
};

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

// ============================================================================
// CLIENT PLAN SELECTION (for agency subdomains)
// ============================================================================
function ClientPlanSelection({ agency, signupData }: { agency: Agency; signupData: SignupData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSelectPlan = async (planType: string) => {
    setSelectedPlan(planType);
    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      // Map frontend field names to backend expected names
      const nameParts = signupData.ownerName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const response = await fetch(`${backendUrl}/api/client/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: signupData.email,
          phone: signupData.phone,
          password: signupData.password,
          businessName: signupData.businessName,
          businessCity: signupData.city,
          businessState: signupData.state,
          industry: signupData.industry,
          agencyId: agency.id,
          planType: planType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.errors?.join(', ') || 'Failed to create account');
      }

      sessionStorage.removeItem('client_signup_data');

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.client) {
        // Redirect to success with phone number
        const params = new URLSearchParams({
          phone: data.client.phone_number || '',
          business: data.client.business_name || '',
        });
        router.push(`/signup/success?${params.toString()}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = agency.primary_color || '#2563eb';
  const accentColor = agency.accent_color || '#3b82f6';
  const primaryLight = isLightColor(primaryColor);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: agency.price_starter || 4900,
      calls: agency.limit_starter || 50,
      features: ['AI receptionist', `Up to ${agency.limit_starter || 50} calls/month`, 'SMS notifications', 'Call transcripts', 'Basic analytics'],
    },
    {
      id: 'pro',
      name: 'Professional',
      price: agency.price_pro || 9900,
      calls: agency.limit_pro || 150,
      popular: true,
      features: ['Everything in Starter', `Up to ${agency.limit_pro || 150} calls/month`, 'Priority support', 'Custom greeting', 'Advanced analytics'],
    },
    {
      id: 'growth',
      name: 'Growth',
      price: agency.price_growth || 14900,
      calls: agency.limit_growth || 500,
      features: ['Everything in Professional', `Up to ${agency.limit_growth || 500} calls/month`, 'Dedicated support', 'API access', 'Custom integrations'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {agency.logo_url ? (
                <img src={agency.logo_url} alt={agency.name} className="h-9 w-9 rounded-lg object-contain" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: primaryColor }}>
                  <Phone className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
                </div>
              )}
              <span className="text-lg font-medium tracking-tight">{agency.name}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative pt-32 pb-16 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl opacity-[0.07]" style={{ backgroundColor: primaryColor }} />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <Link href="/signup" className="inline-flex items-center gap-2 text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to signup
          </Link>

          <div className="mb-8 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="h-2 w-12 rounded-full transition-colors" style={{ backgroundColor: s <= 2 ? primaryColor : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>

          <div className="text-center mb-12">
            <h1 className="text-3xl font-medium tracking-tight">Choose Your Plan</h1>
            <p className="mt-3 text-lg text-[#f5f5f0]/50">Start with a 7-day free trial. Cancel anytime.</p>
          </div>

          {error && (
            <div className="mb-8 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center">{error}</div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 transition-all ${plan.popular ? 'border-white/20 bg-[#111] scale-105' : 'border-white/10 bg-[#0d0d0d] hover:border-white/20'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}>
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-[#f5f5f0]/50">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-[#f5f5f0]/50">{plan.calls} calls included</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[#f5f5f0]/70">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5" style={{ backgroundColor: `${accentColor}1A` }}>
                        <Check className="h-3 w-3" style={{ color: accentColor }} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading}
                  className={`group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${plan.popular ? '' : 'bg-white/10 text-[#f5f5f0] hover:bg-white/20'}`}
                  style={plan.popular ? { backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' } : undefined}
                >
                  {loading && selectedPlan === plan.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <>Start Free Trial <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-[#f5f5f0]/40">✓ 7-day free trial &nbsp;•&nbsp; ✓ No credit card required to start &nbsp;•&nbsp; ✓ Cancel anytime</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// AGENCY PLAN SELECTION (for platform domain)
// ============================================================================
function AgencyPlanSelection({ agencyId }: { agencyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSelectPlan = async (planType: string) => {
    setSelectedPlan(planType);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, planType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { id: 'starter', name: 'Starter', price: 9900, clients: 25, features: ['25 client seats', 'Basic support', 'White-label branding', 'Agency dashboard'] },
    { id: 'professional', name: 'Professional', price: 19900, clients: 100, popular: true, features: ['100 client seats', 'Priority support', 'Custom domain', 'Advanced analytics'] },
    { id: 'enterprise', name: 'Enterprise', price: 49900, clients: 'Unlimited', features: ['Unlimited clients', 'Dedicated support', 'API access', 'Custom integrations'] },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#f5f5f0] blur-lg opacity-20" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f5f0]">
                  <Phone className="h-4 w-4 text-[#0a0a0a]" />
                </div>
              </div>
              <span className="text-lg font-medium tracking-tight">VoiceAI Connect</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative pt-32 pb-16 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-500/[0.07] to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <Link href="/signup" className="inline-flex items-center gap-2 text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="mb-8 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 w-12 rounded-full transition-colors ${s <= 2 ? 'bg-emerald-400' : 'bg-white/10'}`} />
            ))}
          </div>

          <div className="text-center mb-12">
            <h1 className="text-3xl font-medium tracking-tight">Choose Your Plan</h1>
            <p className="mt-3 text-lg text-[#f5f5f0]/50">Start with a 14-day free trial. Cancel anytime.</p>
          </div>

          {error && (
            <div className="mb-8 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center">{error}</div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 transition-all ${plan.popular ? 'border-emerald-400/30 bg-[#111] scale-105' : 'border-white/10 bg-[#0d0d0d] hover:border-white/20'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-400 text-[#0a0a0a]">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-[#f5f5f0]/50">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-[#f5f5f0]/50">{plan.clients} clients</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[#f5f5f0]/70">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 bg-emerald-400/10">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading}
                  className={`group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${plan.popular ? 'bg-emerald-400 text-[#0a0a0a]' : 'bg-white/10 text-[#f5f5f0] hover:bg-white/20'}`}
                >
                  {loading && selectedPlan === plan.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <>Start Free Trial <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-[#f5f5f0]/40">✓ 14-day free trial &nbsp;•&nbsp; ✓ Cancel anytime &nbsp;•&nbsp; ✓ No setup fees</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function PlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [signupData, setSignupData] = useState<SignupData | null>(null);
  const [isAgencySubdomain, setIsAgencySubdomain] = useState(false);
  const [agencyIdFromUrl, setAgencyIdFromUrl] = useState<string | null>(null);

  useEffect(() => {
    const detectContext = async () => {
      try {
        const host = window.location.host;
        const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
        const agencyParam = searchParams.get('agency');
        
        const platformDomains = [platformDomain, `www.${platformDomain}`, 'localhost:3000', 'localhost'];
        
        if (platformDomains.includes(host)) {
          // Check for agency ID in URL (from agency signup flow)
          if (agencyParam) {
            setAgencyIdFromUrl(agencyParam);
            setIsAgencySubdomain(false);
            setLoading(false);
            return;
          }
          
          // Check for client signup data in sessionStorage (shouldn't happen on platform domain, but just in case)
          const stored = sessionStorage.getItem('client_signup_data');
          if (stored) {
            // Redirect to the agency's subdomain
            const data = JSON.parse(stored);
            if (data.agency_slug) {
              window.location.href = `https://${data.agency_slug}.${platformDomain}/signup/plan`;
              return;
            }
          }
          
          setIsAgencySubdomain(false);
          setLoading(false);
          return;
        }
        
        // Try to fetch agency info and load signup data
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        
        if (response.ok) {
          const data = await response.json();
          setAgency(data.agency);
          setIsAgencySubdomain(true);
          
          // Load signup data from sessionStorage
          const stored = sessionStorage.getItem('client_signup_data');
          if (stored) {
            setSignupData(JSON.parse(stored));
          } else {
            // No signup data, redirect back to signup
            router.push('/signup');
            return;
          }
        } else {
          setIsAgencySubdomain(false);
        }
      } catch (err) {
        console.error('Failed to detect context:', err);
        setIsAgencySubdomain(false);
      } finally {
        setLoading(false);
      }
    };

    detectContext();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  // Client plan selection (agency subdomain)
  if (isAgencySubdomain && agency && signupData) {
    return <ClientPlanSelection agency={agency} signupData={signupData} />;
  }

  // Agency plan selection (platform)
  if (agencyIdFromUrl) {
    return <AgencyPlanSelection agencyId={agencyIdFromUrl} />;
  }

  // No context - redirect to signup
  router.push('/signup');
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-white/50" />
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    }>
      <PlanContent />
    </Suspense>
  );
}