'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Phone, CheckCircle, Loader2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 199,
    description: 'Perfect for testing the waters',
    features: [
      '25 client seats',
      'White-label branding',
      'Subdomain (you.voiceaiconnect.com)',
      'Email support',
      'Basic analytics',
    ],
    highlighted: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    description: 'For serious agency builders',
    features: [
      '100 client seats',
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
      'Unlimited client seats',
      'Everything in Professional',
      'White-label emails',
      'Dedicated support',
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
      // Redirect to signup if no agency ID
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

      // Redirect to Stripe Checkout
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
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mt-2 text-gray-600">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>

      {error && (
        <div className="mb-8 rounded-lg bg-red-50 p-4 text-center text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              plan.highlighted
                ? 'border-blue-600 ring-2 ring-blue-600'
                : 'hover:border-gray-300'
            } ${selectedPlan === plan.id ? 'ring-2 ring-blue-600' : ''}`}
            onClick={() => !loading && setSelectedPlan(plan.id)}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
              
              <p className="mt-4">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-600">/month</span>
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6 w-full"
                variant={plan.highlighted || selectedPlan === plan.id ? 'default' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlan(plan.id);
                }}
                disabled={loading}
              >
                {loading && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Start Free Trial'
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Questions? Contact us at{' '}
        <a href="mailto:support@voiceaiconnect.com" className="text-blue-600 hover:underline">
          support@voiceaiconnect.com
        </a>
      </p>
    </>
  );
}

export default function PlanSelectionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">VoiceAI Connect</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-16">
        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full ${
                s <= 2 ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        }>
          <PlanSelectionContent />
        </Suspense>
      </main>
    </div>
  );
}
