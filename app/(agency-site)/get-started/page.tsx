'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

function ClientSignupForm() {
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'pro';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agencyId, setAgencyId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    industry: 'home_services',
    plan: selectedPlan,
  });

  useEffect(() => {
    // Get agency ID from cookie (set by middleware)
    const cookies = document.cookie.split(';');
    const agencyCookie = cookies.find(c => c.trim().startsWith('agency_id='));
    if (agencyCookie) {
      setAgencyId(agencyCookie.split('=')[1]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/client/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          agencyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to Stripe checkout or success
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        window.location.href = '/get-started/success';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="businessName"
        label="Business Name"
        placeholder="Acme Plumbing"
        value={formData.businessName}
        onChange={handleChange}
        required
      />
      
      <Input
        name="ownerName"
        label="Your Name"
        placeholder="John Smith"
        value={formData.ownerName}
        onChange={handleChange}
        required
      />
      
      <Input
        name="email"
        type="email"
        label="Email Address"
        placeholder="john@acmeplumbing.com"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <Input
        name="phone"
        type="tel"
        label="Phone Number"
        placeholder="(555) 123-4567"
        value={formData.phone}
        onChange={handleChange}
        required
        hint="We'll send call notifications here"
      />

      <div className="w-full">
        <label htmlFor="industry" className="mb-1.5 block text-sm font-medium text-gray-700">
          Industry
        </label>
        <select
          id="industry"
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="home_services">Home Services</option>
          <option value="medical">Medical / Healthcare</option>
          <option value="legal">Legal</option>
          <option value="restaurant">Restaurant / Food Service</option>
          <option value="real_estate">Real Estate</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="w-full">
        <label htmlFor="plan" className="mb-1.5 block text-sm font-medium text-gray-700">
          Plan
        </label>
        <select
          id="plan"
          name="plan"
          value={formData.plan}
          onChange={handleChange}
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="starter">Starter</option>
          <option value="pro">Pro (Most Popular)</option>
          <option value="growth">Growth</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            Start Free Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}

export default function ClientSignupPage() {
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
              <span className="text-xl font-bold text-gray-900">AI Receptionist</span>
            </Link>
            <Link href="/client/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Get Your AI Receptionist</CardTitle>
            <CardDescription>
              Start your 7-day free trial. No credit card required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            }>
              <ClientSignupForm />
            </Suspense>

            <p className="mt-6 text-center text-sm text-gray-500">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
