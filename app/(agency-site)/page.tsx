import Link from 'next/link';
import { headers } from 'next/headers';
import { Phone, CheckCircle, Zap, Shield, Clock, MessageSquare } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function getAgencyFromHeaders() {
  const headersList = await headers();
  const agencyId = headersList.get('x-agency-id');
  
  if (!agencyId) return null;

  const supabase = await createServerSupabaseClient();
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single();

  return agency;
}

export default async function AgencySitePage() {
  const agency = await getAgencyFromHeaders();

  // Fallback values if agency not found
  const name = agency?.name || 'AI Receptionist';
  const primaryColor = agency?.primary_color || '#2563eb';
  const logoUrl = agency?.logo_url;
  const tagline = agency?.company_tagline || 'Never Miss Another Call';
  const headline = agency?.website_headline || 'AI-Powered Phone Receptionist for Your Business';
  const subheadline = agency?.website_subheadline || 
    'Professional call handling 24/7. Capture leads, book appointments, and delight customers—all while you focus on what matters most.';
  
  const starterPrice = agency?.price_starter ? agency.price_starter / 100 : 49;
  const proPrice = agency?.price_pro ? agency.price_pro / 100 : 99;
  const growthPrice = agency?.price_growth ? agency.price_growth / 100 : 149;

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic CSS for agency colors */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --agency-primary: ${primaryColor};
        }
        .bg-agency { background-color: var(--agency-primary); }
        .text-agency { color: var(--agency-primary); }
        .border-agency { border-color: var(--agency-primary); }
        .ring-agency { --tw-ring-color: var(--agency-primary); }
      `}} />

      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={name} className="h-9 w-9 rounded-lg object-contain" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-agency">
                  <Phone className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="text-xl font-bold text-gray-900">{name}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/client/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Client Login
              </Link>
              <Link 
                href="/get-started" 
                className="rounded-lg bg-agency px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-agency uppercase tracking-wide">{tagline}</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              {headline}
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {subheadline}
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/get-started"
                className="rounded-lg bg-agency px-6 py-3 text-base font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              >
                Start Free Trial
              </Link>
              <Link
                href="#pricing"
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                View Pricing
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">7-day free trial • No credit card required</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Everything Your Business Needs
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Professional call handling that works around the clock.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Clock,
                title: '24/7 Availability',
                description: 'Never miss a call again. Your AI receptionist answers every call, day or night.',
              },
              {
                icon: MessageSquare,
                title: 'Natural Conversations',
                description: 'Advanced AI that sounds human and handles complex inquiries with ease.',
              },
              {
                icon: Zap,
                title: 'Instant SMS Alerts',
                description: 'Get notified immediately when someone calls with lead details.',
              },
              {
                icon: Shield,
                title: 'Professional Image',
                description: 'Custom greetings and responses that match your brand voice.',
              },
              {
                icon: CheckCircle,
                title: 'Appointment Booking',
                description: 'Let callers schedule appointments directly during the call.',
              },
              {
                icon: Phone,
                title: 'Call Transcripts',
                description: 'Review every conversation with full transcripts and AI summaries.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-agency/10">
                  <feature.icon className="h-6 w-6 text-agency" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose the plan that fits your business.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                name: 'Starter',
                price: starterPrice,
                description: 'For small businesses',
                features: ['100 minutes/month', 'SMS notifications', 'Call transcripts', 'Email support'],
                highlighted: false,
              },
              {
                name: 'Pro',
                price: proPrice,
                description: 'Most popular',
                features: ['300 minutes/month', 'Everything in Starter', 'Appointment booking', 'Priority support', 'Custom greeting'],
                highlighted: true,
              },
              {
                name: 'Growth',
                price: growthPrice,
                description: 'For busy businesses',
                features: ['1000 minutes/month', 'Everything in Pro', 'Calendar integration', 'Dedicated support', 'Advanced analytics'],
                highlighted: false,
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-8 ${
                  tier.highlighted
                    ? 'border-agency ring-2 ring-agency'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {tier.highlighted && (
                  <p className="mb-4 text-sm font-semibold text-agency">Most Popular</p>
                )}
                <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{tier.description}</p>
                <p className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
                  <span className="text-gray-600">/month</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-agency" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/get-started?plan=${tier.name.toLowerCase()}`}
                  className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? 'bg-agency text-white hover:opacity-90'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-agency py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Never Miss Another Call?</h2>
          <p className="mt-4 text-lg text-white/80">
            Join hundreds of businesses already using AI to handle their calls.
          </p>
          <Link
            href="/get-started"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={name} className="h-8 w-8 rounded-lg object-contain" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-agency">
                  <Phone className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="font-semibold text-gray-900">{name}</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/terms" className="hover:text-gray-900">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
              {agency?.support_email && (
                <a href={`mailto:${agency.support_email}`} className="hover:text-gray-900">Contact</a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
