import Link from 'next/link';
import { 
  Check, X, ArrowRight, Phone, Mic, BarChart3, Headphones, Users, Building2, 
  Zap, Shield, Crown, Sparkles, Code, Palette
} from 'lucide-react';

// Waveform icon component matching the logo
function WaveformIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" />
      <rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" />
      <rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export const metadata = {
  title: 'Features & Pricing Comparison | VoiceAI Connect',
  description: 'Compare VoiceAI Connect plans and features. Find the perfect white-label AI receptionist platform for your agency. Starter, Professional, and Scale plans with detailed feature breakdown.',
  keywords: 'AI receptionist, white-label voice AI, agency platform, pricing comparison, features, AI phone answering, voice AI platform',
  openGraph: {
    title: 'Features & Pricing | VoiceAI Connect',
    description: 'Compare all features across VoiceAI Connect plans. Launch your AI voice agency today.',
  },
};

// Feature comparison data
const featureCategories = [
  {
    name: 'Client Capacity',
    icon: Users,
    features: [
      { name: 'Maximum clients', starter: '25', professional: '100', scale: 'Unlimited' },
    ],
  },
  {
    name: 'Branding & Customization',
    icon: Palette,
    features: [
      { name: 'White-label branding', starter: true, professional: true, scale: true },
      { name: 'Custom logo & colors', starter: true, professional: true, scale: true },
      { name: 'Full marketing website', starter: false, professional: true, scale: true },
      { name: 'Custom domain support', starter: false, professional: true, scale: true },
      { name: 'White-label emails', starter: false, professional: false, scale: true },
      { name: 'Embeddable signup widget', starter: true, professional: true, scale: true },
    ],
  },
  {
    name: 'AI Receptionist Features',
    icon: Mic,
    features: [
      { name: '24/7 AI answering', starter: true, professional: true, scale: true },
      { name: 'Natural voice conversations', starter: true, professional: true, scale: true },
      { name: 'Call recordings', starter: true, professional: true, scale: true },
      { name: 'Call transcripts', starter: true, professional: true, scale: true },
      { name: 'AI call summaries', starter: true, professional: true, scale: true },
      { name: 'SMS notifications', starter: true, professional: true, scale: true },
      { name: 'Knowledge base from website', starter: true, professional: true, scale: true },
      { name: 'Custom AI greeting', starter: true, professional: true, scale: true },
      { name: 'Appointment booking', starter: true, professional: true, scale: true },
    ],
  },
  {
    name: 'Phone Numbers',
    icon: Phone,
    features: [
      { name: 'Dedicated phone numbers', starter: true, professional: true, scale: true },
      { name: 'Local number options', starter: true, professional: true, scale: true },
      { name: 'Toll-free numbers', starter: false, professional: true, scale: true },
      { name: 'Demo phone number', starter: false, professional: true, scale: true },
      { name: 'Number porting', starter: false, professional: true, scale: true },
    ],
  },
  {
    name: 'Dashboard & Analytics',
    icon: BarChart3,
    features: [
      { name: 'Agency dashboard', starter: true, professional: true, scale: true },
      { name: 'Client dashboards', starter: true, professional: true, scale: true },
      { name: 'Basic analytics', starter: true, professional: true, scale: true },
      { name: 'Advanced analytics', starter: false, professional: true, scale: true },
      { name: 'Revenue tracking', starter: true, professional: true, scale: true },
      { name: 'Call volume trends', starter: false, professional: true, scale: true },
      { name: 'Custom reports', starter: false, professional: false, scale: true },
    ],
  },
  {
    name: 'Payments & Billing',
    icon: Building2,
    features: [
      { name: 'Stripe Connect integration', starter: true, professional: true, scale: true },
      { name: 'Set your own pricing', starter: true, professional: true, scale: true },
      { name: 'Keep 100% of client revenue', starter: true, professional: true, scale: true },
      { name: 'Automated client billing', starter: true, professional: true, scale: true },
      { name: 'Invoice customization', starter: false, professional: true, scale: true },
    ],
  },
  {
    name: 'Integrations & API',
    icon: Code,
    features: [
      { name: 'Calendar integrations', starter: true, professional: true, scale: true },
      { name: 'CRM integrations', starter: false, professional: true, scale: true },
      { name: 'API access', starter: false, professional: true, scale: true },
      { name: 'Webhooks', starter: false, professional: true, scale: true },
      { name: 'Custom integrations', starter: false, professional: false, scale: true },
      { name: 'Zapier integration', starter: false, professional: true, scale: true },
    ],
  },
  {
    name: 'Support',
    icon: Headphones,
    features: [
      { name: 'Email support', starter: true, professional: true, scale: true },
      { name: 'Priority support', starter: false, professional: true, scale: true },
      { name: 'Phone support', starter: false, professional: false, scale: true },
      { name: 'Dedicated success manager', starter: false, professional: false, scale: true },
      { name: 'SLA guarantee', starter: false, professional: false, scale: true },
      { name: 'Onboarding assistance', starter: 'Self-serve', professional: 'Guided', scale: 'White-glove' },
    ],
  },
];

// Plan data
const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 199,
    description: 'For new agencies testing the waters',
    icon: Zap,
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    description: 'Most popular for serious agencies',
    icon: Shield,
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 499,
    description: 'For established agencies',
    icon: Crown,
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      {/* Premium grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full blur-[128px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-xl overflow-hidden border border-white/10">
                  <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link 
                href="/agency/login" 
                className="hidden sm:block px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:shadow-lg hover:shadow-white/10"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Compare All Plans</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Features & Pricing
            </h1>
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-[#fafaf9]/50 max-w-2xl mx-auto">
              Everything you need to launch and scale your AI voice agency. 
              Choose the plan that fits your goals.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 sm:p-8 transition-all ${
                  plan.highlighted
                    ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.08] to-transparent scale-[1.02] lg:scale-105'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-[#050505] shadow-lg shadow-emerald-500/30">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${
                    plan.highlighted ? 'bg-emerald-500/20' : 'bg-white/[0.05]'
                  }`}>
                    <plan.icon className={`h-6 w-6 ${plan.highlighted ? 'text-emerald-400' : 'text-[#fafaf9]'}`} />
                  </div>
                  <p className="text-sm text-[#fafaf9]/50">{plan.description}</p>
                  <h3 className="text-xl font-semibold mt-1">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-[#fafaf9]/50">/month</span>
                  </div>
                </div>

                <Link
                  href={plan.id === 'scale' ? '/contact' : '/signup'}
                  className={`mt-6 block w-full rounded-full py-3.5 text-center text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    plan.highlighted
                      ? 'bg-white text-[#050505] hover:bg-[#fafaf9] hover:shadow-lg hover:shadow-white/10'
                      : 'bg-white/[0.06] text-[#fafaf9] hover:bg-white/[0.12] border border-white/[0.08]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          
          <p className="text-center mt-8 text-sm text-[#fafaf9]/40">
            All plans include 14-day free trial. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="relative py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Detailed Feature Comparison
            </h2>
            <p className="mt-3 text-[#fafaf9]/50">
              See exactly what&apos;s included in each plan
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
              {/* Table Header */}
              <div className="grid grid-cols-4 bg-white/[0.02] border-b border-white/[0.06]">
                <div className="p-6 font-medium text-[#fafaf9]/70">Features</div>
                {plans.map((plan) => (
                  <div 
                    key={plan.id} 
                    className={`p-6 text-center ${plan.highlighted ? 'bg-emerald-500/[0.05]' : ''}`}
                  >
                    <p className="font-semibold text-lg">{plan.name}</p>
                    <p className="text-[#fafaf9]/40 text-sm">${plan.price}/mo</p>
                  </div>
                ))}
              </div>

              {/* Feature Categories */}
              {featureCategories.map((category) => (
                <div key={category.name}>
                  {/* Category Header */}
                  <div className="grid grid-cols-4 bg-white/[0.01] border-b border-white/[0.06]">
                    <div className="p-4 flex items-center gap-3">
                      <category.icon className="h-5 w-5 text-emerald-400" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="bg-transparent" />
                    <div className="bg-emerald-500/[0.02]" />
                    <div className="bg-transparent" />
                  </div>

                  {/* Features */}
                  {category.features.map((feature, idx) => (
                    <div 
                      key={feature.name} 
                      className={`grid grid-cols-4 ${idx < category.features.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                    >
                      <div className="p-4 pl-14 text-[#fafaf9]/60 text-sm">{feature.name}</div>
                      {(['starter', 'professional', 'scale'] as const).map((planId, i) => {
                        const value = feature[planId];
                        return (
                          <div 
                            key={planId} 
                            className={`p-4 flex items-center justify-center ${i === 1 ? 'bg-emerald-500/[0.02]' : ''}`}
                          >
                            {value === true ? (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                                <Check className="h-4 w-4 text-emerald-400" />
                              </div>
                            ) : value === false ? (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.03]">
                                <X className="h-4 w-4 text-[#fafaf9]/20" />
                              </div>
                            ) : (
                              <span className="text-sm text-[#fafaf9]/70">{value}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-6">
            {featureCategories.map((category) => (
              <div key={category.name} className="rounded-xl border border-white/[0.08] overflow-hidden">
                <div className="p-4 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-3">
                  <category.icon className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {category.features.map((feature) => (
                    <div key={feature.name} className="p-4">
                      <p className="text-sm text-[#fafaf9]/70 mb-3">{feature.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        {(['starter', 'professional', 'scale'] as const).map((planId) => {
                          const value = feature[planId];
                          const planName = planId.charAt(0).toUpperCase() + planId.slice(1);
                          return (
                            <div key={planId} className="rounded-lg bg-white/[0.02] p-2">
                              <p className="text-[#fafaf9]/40 mb-1">{planName}</p>
                              {value === true ? (
                                <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                              ) : value === false ? (
                                <X className="h-4 w-4 text-[#fafaf9]/20 mx-auto" />
                              ) : (
                                <span className="text-[#fafaf9]/70">{value}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Perfect For These Agencies
            </h2>
            <p className="mt-3 text-[#fafaf9]/50">
              VoiceAI Connect powers agencies across industries
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Marketing Agencies',
                description: 'Add AI receptionist services as a new revenue stream for your existing clients.',
                icon: BarChart3,
              },
              {
                title: 'Business Consultants',
                description: 'Help small businesses improve customer service while building recurring revenue.',
                icon: Building2,
              },
              {
                title: 'IT Service Providers',
                description: 'Bundle voice AI with your existing tech services for a complete business solution.',
                icon: Code,
              },
              {
                title: 'Local Service Providers',
                description: 'Serve home services, medical offices, and local businesses in your area.',
                icon: Phone,
              },
              {
                title: 'Franchise Consultants',
                description: 'Deploy AI receptionists across multiple franchise locations efficiently.',
                icon: Users,
              },
              {
                title: 'Virtual Assistant Agencies',
                description: 'Scale your services with AI that handles calls 24/7 without additional staff.',
                icon: Mic,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-white/[0.15] transition-colors">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 mb-4">
                  <item.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Yes! You can change your plan at any time. When upgrading, you\'ll get immediate access to new features. When downgrading, changes take effect at your next billing cycle.',
              },
              {
                q: 'What happens if I exceed my client limit?',
                a: 'We\'ll notify you when you\'re approaching your limit. You can either upgrade to a higher plan or we\'ll work with you to find a solution that fits your needs.',
              },
              {
                q: 'Do you offer annual billing discounts?',
                a: 'Yes! Annual billing saves you 20% compared to monthly billing. Contact us after signup to switch to annual billing.',
              },
              {
                q: 'What\'s included in the 14-day trial?',
                a: 'You get full access to all features in your chosen plan during the trial. You can set up clients, test the AI receptionist, and explore the entire platform.',
              },
              {
                q: 'How does Stripe Connect work for payments?',
                a: 'Stripe Connect allows you to collect payments directly from your clients. You set your own pricing, and 100% of client payments go directly to your Stripe account.',
              },
              {
                q: 'Can I get a custom enterprise plan?',
                a: 'Absolutely. For agencies with specific requirements or volume needs, we offer custom plans. Contact our sales team to discuss.',
              },
              {
                q: 'What kind of support do you offer?',
                a: 'All plans include email support. Professional plans get priority support with faster response times. Scale plans include dedicated success managers and phone support.',
              },
              {
                q: 'How long does it take to set up a client?',
                a: 'Most clients can be set up in under 10 minutes. The AI learns from their website automatically, and phone numbers are provisioned instantly.',
              },
            ].map((item, i) => (
              <details 
                key={i} 
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <h3 className="font-medium pr-4">{item.q}</h3>
                  <ArrowRight className="h-5 w-5 text-[#fafaf9]/40 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 pt-0">
                  <p className="text-[#fafaf9]/60 leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Ready to launch your AI voice agency?
          </h2>
          <p className="mt-4 text-lg text-[#fafaf9]/50">
            Join hundreds of agencies already building recurring revenue with VoiceAI Connect.
          </p>
          <div className="mt-8">
            <Link 
              href="/signup" 
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                <WaveformIcon className="w-5 h-5" />
              </div>
              <span className="font-semibold">VoiceAI Connect</span>
            </Link>
            
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-[#fafaf9]/40">
              <Link href="/features" className="hover:text-[#fafaf9] transition-colors">Features</Link>
              <Link href="/#pricing" className="hover:text-[#fafaf9] transition-colors">Pricing</Link>
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
              <a href="mailto:support@myvoiceaiconnect.com" className="hover:text-[#fafaf9] transition-colors">Contact</a>
            </div>
            
            <p className="text-sm text-[#fafaf9]/30">
              © 2025 VoiceAI Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}