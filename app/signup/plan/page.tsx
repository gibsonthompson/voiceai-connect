'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Phone, Check, Loader2, ArrowRight } from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 199,
    description: 'For new agencies',
    features: [
      'Up to 25 clients',
      'White-label branding',
      'Subdomain included',
      'Email support',
      'Basic analytics',
    ],
    highlighted: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    description: 'Most popular',
    features: [
      'Up to 100 clients',
      'Everything in Starter',
      'Custom domain',
      'Priority support',
      'Advanced analytics',
      'API access',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    description: 'For established agencies',
    features: [
      'Unlimited clients',
      'Everything in Professional',
      'White-label emails',
      'Dedicated success manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    highlighted: false,
  },
];

function PlanSelectionContent() {
  const searchParams = useSearchParams();
  const agencyId = searchParams.get('agency');
  
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!agencyId) {
      window.location.href = '/signup';
    }
  }, [agencyId]);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          planType: planId,
        }),
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
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">Choose Your Plan</h1>
        <p className="mt-3 text-lg text-[#f5f5f0]/50">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>

      {error && (
        <div className="mb-8 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => !loading && setSelectedPlan(plan.id)}
            className={`relative rounded-2xl border p-6 cursor-pointer transition-all ${
              plan.highlighted
                ? 'border-emerald-400/50 bg-emerald-400/5'
                : selectedPlan === plan.id
                ? 'border-white/30 bg-white/[0.04]'
                : 'border-white/10 bg-[#111] hover:border-white/20'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-medium text-[#0a0a0a]">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="mb-6">
              <p className="text-sm text-[#f5f5f0]/50">{plan.description}</p>
              <p className="text-2xl font-medium mt-1">{plan.name}</p>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-semibold">${plan.price}</span>
              <span className="text-[#f5f5f0]/50">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-[#f5f5f0]/70">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPlan(plan.id);
              }}
              disabled={loading}
              className={`group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
                plan.highlighted || selectedPlan === plan.id
                  ? 'bg-[#f5f5f0] text-[#0a0a0a] hover:bg-white'
                  : 'bg-white/10 text-[#f5f5f0] hover:bg-white/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
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

      <p className="mt-10 text-center text-sm text-[#f5f5f0]/40">
        All plans include a 14-day free trial. Cancel anytime.
      </p>
      
      <p className="mt-4 text-center text-sm text-[#f5f5f0]/40">
        Questions? Contact us at{' '}
        <a href="mailto:support@voiceaiconnect.com" className="text-emerald-400 hover:text-emerald-300 transition-colors">
          support@voiceaiconnect.com
        </a>
      </p>
    </>
  );
}

export default function PlanSelectionPage() {
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

      {/* Main Content */}
      <main className="relative pt-32 pb-16 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-500/[0.07] to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          {/* Progress Indicator */}
          <div className="mb-12 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-colors ${
                  s <= 2 ? 'bg-emerald-400' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <Suspense fallback={
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          }>
            <PlanSelectionContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}