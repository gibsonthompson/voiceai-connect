'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Check, Loader2 } from 'lucide-react';
import DynamicFavicon from '@/components/DynamicFavicon';

type PlanTier = 'starter' | 'pro' | 'growth';

interface AgencyPricing {
  price_starter: number;
  price_pro: number;
  price_growth: number;
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
  name: string;
  primary_color: string;
  support_email: string;
  logo_url: string | null;
}

const DEFAULT_PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    calls: 50,
    features: [
      'Up to 50 calls per month',
      '24/7 AI receptionist',
      'Call recordings & transcripts',
      'SMS notifications',
      'Basic analytics',
    ],
  },
  pro: {
    name: 'Pro',
    price: 99,
    calls: 150,
    popular: true,
    features: [
      'Everything in Starter, plus:',
      'Up to 150 calls per month',
      'Priority call handling',
      'Advanced analytics',
      'Custom greeting',
      'Lead qualification',
    ],
  },
  growth: {
    name: 'Growth',
    price: 149,
    calls: 500,
    features: [
      'Everything in Pro, plus:',
      'Up to 500 calls per month',
      'Multiple phone numbers',
      'CRM integrations',
      'Custom AI training',
      'Priority support',
    ],
  },
};

export default function UpgradeRequiredPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('pro');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agency, setAgency] = useState<AgencyPricing | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // Fetch client and agency info
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('client_auth_token');
        if (!token) {
          router.push('/client/login?redirect=/client/upgrade');
          return;
        }

        // Get client info from token or API
        const response = await fetch('/api/client/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          router.push('/client/login?redirect=/client/upgrade');
          return;
        }

        const data = await response.json();
        setClientId(data.client.id);
        
        // Get agency pricing
        if (data.client.agency) {
          setAgency({
            price_starter: data.client.agency.price_starter || 4900,
            price_pro: data.client.agency.price_pro || 9900,
            price_growth: data.client.agency.price_growth || 14900,
            limit_starter: data.client.agency.limit_starter || 50,
            limit_pro: data.client.agency.limit_pro || 150,
            limit_growth: data.client.agency.limit_growth || 500,
            name: data.client.agency.name,
            primary_color: data.client.agency.primary_color || '#2563eb',
            support_email: data.client.agency.support_email || 'support@example.com',
            logo_url: data.client.agency.logo_url || null,
          });
        }
      } catch (err) {
        console.error('Failed to fetch client data:', err);
        setError('Failed to load. Please refresh the page.');
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Build plans with agency pricing
  const plans = {
    starter: {
      ...DEFAULT_PLANS.starter,
      price: agency ? agency.price_starter / 100 : DEFAULT_PLANS.starter.price,
      calls: agency?.limit_starter || DEFAULT_PLANS.starter.calls,
    },
    pro: {
      ...DEFAULT_PLANS.pro,
      price: agency ? agency.price_pro / 100 : DEFAULT_PLANS.pro.price,
      calls: agency?.limit_pro || DEFAULT_PLANS.pro.calls,
    },
    growth: {
      ...DEFAULT_PLANS.growth,
      price: agency ? agency.price_growth / 100 : DEFAULT_PLANS.growth.price,
      calls: agency?.limit_growth || DEFAULT_PLANS.growth.calls,
    },
  };

  const handleUpgrade = async () => {
    if (!clientId) {
      setError('Please log in to continue.');
      router.push('/client/login?redirect=/client/upgrade');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('client_auth_token');
      
      const response = await fetch('/api/client/create-checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          planTier: selectedPlan,
          clientId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        throw new Error('No checkout URL returned');
      }

      // Redirect to Stripe Checkout (on agency's Connect account)
      window.location.href = data.url;

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  const primaryColor = agency?.primary_color || '#2563eb';

  return (
    <div className="min-h-screen bg-gray-50">
      <DynamicFavicon logoUrl={agency?.logo_url} primaryColor={primaryColor} />
      
      {/* Hero Section */}
      <div 
        className="text-white py-8 sm:py-12 md:py-20 px-4"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/20">
              <Phone className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold">{agency?.name || 'AI Receptionist'}</span>
          </div>

          {/* Warning Badge */}
          <div className="inline-flex items-center bg-amber-500/20 backdrop-blur-sm border border-amber-300/30 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 mb-4 sm:mb-5">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-xs sm:text-sm md:text-base text-amber-300">Trial Ended</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 px-2 sm:px-4">
            Your AI Receptionist is Paused
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-5 sm:mb-6 md:mb-8 px-2 sm:px-4">
            Reactivate now to continue answering calls 24/7
          </p>

          {/* Impact Stats */}
          <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:flex-wrap md:justify-center md:gap-6 text-sm sm:text-base px-2 sm:px-4">
            <div className="flex items-center justify-center text-white/90">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0 text-green-400" />
              <span>Stop losing leads to voicemail</span>
            </div>
            <div className="flex items-center justify-center text-white/90">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0 text-green-400" />
              <span>Resume 24/7 call answering</span>
            </div>
            <div className="flex items-center justify-center text-white/90">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0 text-green-400" />
              <span>Keep your business phone number</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 sm:py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-center text-red-700 text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <div className="py-8 sm:py-12 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
              Choose Your Plan
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">Select a plan to reactivate your AI receptionist</p>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3 md:gap-8 mb-6 sm:mb-8">
            {(Object.keys(plans) as PlanTier[]).map((tier) => {
              const plan = plans[tier];
              const isSelected = selectedPlan === tier;
              const isPopular = 'popular' in plan && plan.popular;

              return (
                <div
                  key={tier}
                  onClick={() => setSelectedPlan(tier)}
                  className={`relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 sm:ring-4 shadow-lg sm:shadow-xl scale-[1.01] sm:scale-[1.02]'
                      : 'border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  } ${isPopular ? 'md:-mt-4 order-first md:order-none' : ''}`}
                  style={{
                    borderColor: isSelected ? primaryColor : undefined,
                    boxShadow: isSelected ? `0 0 0 4px ${primaryColor}40` : undefined,
                  }}
                >
                  {isPopular && (
                    <div 
                      className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 text-white px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap"
                      style={{ backgroundColor: primaryColor }}
                    >
                      ⭐ Most Popular
                    </div>
                  )}

                  <div className="text-center mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">Up to {plan.calls} calls/month</p>
                    
                    <div className="flex items-baseline justify-center">
                      <span className="text-gray-400 text-lg sm:text-xl mr-0.5 sm:mr-1">$</span>
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-400 text-base sm:text-lg ml-0.5 sm:ml-1">/mo</span>
                    </div>
                  </div>

                  <ul className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-xs sm:text-sm">
                        {feature.includes('Everything') ? (
                          <span className="font-semibold text-gray-700">{feature}</span>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 mr-1.5 sm:mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600">{feature}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>

                  {isSelected && (
                    <div 
                      className="flex items-center justify-center font-bold mb-1 sm:mb-2 text-xs sm:text-sm"
                      style={{ color: primaryColor }}
                    >
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                      Selected
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="max-w-md mx-auto">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  Processing...
                </span>
              ) : (
                `Reactivate with ${plans[selectedPlan].name} Plan`
              )}
            </button>

            <p className="text-center text-gray-500 text-xs sm:text-sm mt-3 sm:mt-4">
              Questions?{' '}
              <a 
                href={`mailto:${agency?.support_email || 'support@example.com'}`} 
                className="hover:underline font-medium"
                style={{ color: primaryColor }}
              >
                Contact Support
              </a>
            </p>

            <p className="text-center text-gray-400 text-[10px] sm:text-xs mt-3 sm:mt-4 space-x-1 sm:space-x-2">
              <span>✓ Secure payment via Stripe</span>
              <span>•</span>
              <span>✓ Cancel anytime</span>
              <span>•</span>
              <span>✓ Instant reactivation</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}