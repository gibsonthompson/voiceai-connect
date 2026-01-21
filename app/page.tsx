import Link from 'next/link';
import { Phone, ArrowRight, Check, Play, Star, Zap, Shield, Clock, Users, DollarSign, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0] overflow-hidden">
      {/* Subtle grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#f5f5f0] blur-lg opacity-20" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f5f0]">
                  <Phone className="h-4 w-4 text-[#0a0a0a]" />
                </div>
              </div>
              <span className="text-lg font-medium tracking-tight">VoiceAI Connect</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#how-it-works" className="text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors">
                How It Works
              </Link>
              <Link href="#pricing" className="text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors">
                Pricing
              </Link>
              <Link href="#faq" className="text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors">
                FAQ
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/agency/login" className="text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors">
                Login
              </Link>
              <Link 
                href="/signup" 
                className="group relative inline-flex items-center gap-2 rounded-full bg-[#f5f5f0] px-5 py-2.5 text-sm font-medium text-[#0a0a0a] transition-all hover:bg-white"
              >
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#f5f5f0]/[0.03] to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm mb-8">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#f5f5f0]/70">Join 500+ agencies already reselling</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.1]">
              Resell AI Receptionists
              <span className="block mt-2 text-[#f5f5f0]/40">Under Your Brand</span>
            </h1>
            
            <p className="mt-8 text-xl text-[#f5f5f0]/60 max-w-2xl mx-auto leading-relaxed">
              The complete white-label platform to start your AI voice agency. 
              We handle the tech. You keep 100% of what you charge.
            </p>

            {/* Value props row */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-[#f5f5f0]/50">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Zero code required
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Your brand everywhere
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Set your own prices
              </span>
            </div>

            {/* CTA buttons */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup" 
                className="group relative inline-flex items-center gap-3 rounded-full bg-[#f5f5f0] px-8 py-4 text-base font-medium text-[#0a0a0a] transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Your 14-Day Free Trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-[#f5f5f0] transition-all hover:bg-white/10">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Play className="h-3 w-3 fill-current ml-0.5" />
                </span>
                Watch Demo
              </button>
            </div>

            <p className="mt-6 text-sm text-[#f5f5f0]/40">
              No credit card required · Cancel anytime
            </p>
          </div>

          {/* Dashboard preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-2xl border border-white/10 bg-[#111] overflow-hidden shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white/5 text-xs text-[#f5f5f0]/40">
                    dashboard.youragency.com
                  </div>
                </div>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-[#111] to-[#0a0a0a] flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
                    <Phone className="h-8 w-8 text-[#f5f5f0]/40" />
                  </div>
                  <p className="text-[#f5f5f0]/40 text-lg">Your branded agency dashboard</p>
                  <p className="text-[#f5f5f0]/20 text-sm mt-2">Manage clients, view analytics, configure AI agents</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-white/5 bg-white/[0.02] py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-semibold">$2.4M+</p>
                <p className="text-sm text-[#f5f5f0]/40 mt-1">Revenue generated by partners</p>
              </div>
              <div className="h-12 w-px bg-white/10 hidden md:block" />
              <div className="text-center">
                <p className="text-3xl font-semibold">847</p>
                <p className="text-sm text-[#f5f5f0]/40 mt-1">Active agencies</p>
              </div>
              <div className="h-12 w-px bg-white/10 hidden md:block" />
              <div className="text-center">
                <p className="text-3xl font-semibold">12,400+</p>
                <p className="text-sm text-[#f5f5f0]/40 mt-1">Businesses served</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-sm text-[#f5f5f0]/60">4.9/5 from 200+ reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-medium text-emerald-400 tracking-wide uppercase mb-4">The Opportunity</p>
              <h2 className="text-4xl lg:text-5xl font-medium tracking-tight leading-tight">
                Local businesses are desperate for this technology
              </h2>
              <p className="mt-6 text-lg text-[#f5f5f0]/60 leading-relaxed">
                Every plumber, dentist, and contractor misses calls. They know it costs them thousands. 
                But they don&apos;t know how to fix it—and they don&apos;t want to learn AI.
              </p>
              <p className="mt-4 text-lg text-[#f5f5f0]/60 leading-relaxed">
                That&apos;s where you come in. You sell them the solution. We power it behind the scenes. 
                They never know we exist.
              </p>
              
              <div className="mt-10 space-y-4">
                {[
                  'Charge $99-299/month per client',
                  'Pay us a flat $199/month (unlimited profit)',
                  'No technical skills needed whatsoever',
                  'We handle support, updates, and infrastructure',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[#f5f5f0]/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-[#111] p-8">
                <p className="text-sm text-[#f5f5f0]/40 uppercase tracking-wide mb-6">Quick Math</p>
                <div className="space-y-6">
                  <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                    <span className="text-[#f5f5f0]/60">10 clients × $149/mo</span>
                    <span className="text-2xl font-semibold">$1,490</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                    <span className="text-[#f5f5f0]/60">Your platform cost</span>
                    <span className="text-2xl font-semibold text-[#f5f5f0]/40">-$199</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-[#f5f5f0]/80 font-medium">Monthly profit</span>
                    <span className="text-3xl font-semibold text-emerald-400">$1,291</span>
                  </div>
                </div>
                <p className="mt-8 text-sm text-[#f5f5f0]/40">
                  Scale to 50 clients? That&apos;s $7,251/mo profit. Same $199 platform fee.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get vs What They See */}
      <section className="py-24 lg:py-32 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-emerald-400 tracking-wide uppercase mb-4">Platform Overview</p>
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight">
              Two dashboards. One platform.
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Your Dashboard */}
            <div className="rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
              <div className="border-b border-white/5 px-6 py-4">
                <p className="text-sm text-emerald-400 font-medium">What You See</p>
                <p className="text-xl font-medium mt-1">Agency Admin Dashboard</p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  'Manage all client accounts in one place',
                  'Set custom pricing per client',
                  'White-label branding controls',
                  'Revenue and usage analytics',
                  'Stripe integration for billing',
                  'Custom domain setup',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-[#f5f5f0]/70">
                    <ChevronRight className="h-4 w-4 text-emerald-400" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Client Dashboard */}
            <div className="rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
              <div className="border-b border-white/5 px-6 py-4">
                <p className="text-sm text-[#f5f5f0]/40 font-medium">What Your Clients See</p>
                <p className="text-xl font-medium mt-1">Their Branded Dashboard</p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  'Your logo and brand colors',
                  'Their AI phone number',
                  'Call history and recordings',
                  'Transcripts and AI summaries',
                  'SMS notification settings',
                  'No mention of VoiceAI Connect',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-[#f5f5f0]/70">
                    <ChevronRight className="h-4 w-4 text-[#f5f5f0]/30" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 lg:py-32 border-t border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-emerald-400 tracking-wide uppercase mb-4">Simple Process</p>
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight">
              Launch in under 24 hours
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up',
                description: 'Create your agency account. Takes 2 minutes. No credit card for trial.',
              },
              {
                step: '02',
                title: 'Brand It',
                description: 'Upload your logo, set your colors, connect your domain. 10 minutes.',
              },
              {
                step: '03',
                title: 'Set Prices',
                description: 'Decide what to charge. $99? $199? $299? You keep everything above our fee.',
              },
              {
                step: '04',
                title: 'Start Selling',
                description: 'Share your signup link. Client signs up, AI is live in 60 seconds. Automated.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-white/[0.03] absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-8">
                  <p className="text-sm text-emerald-400 font-medium mb-2">Step {item.step}</p>
                  <h3 className="text-xl font-medium mb-3">{item.title}</h3>
                  <p className="text-[#f5f5f0]/50 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 lg:py-32 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-emerald-400 tracking-wide uppercase mb-4">Everything Included</p>
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight">
              We built it. You sell it.
            </h2>
            <p className="mt-4 text-lg text-[#f5f5f0]/50 max-w-2xl mx-auto">
              Millions invested in R&D so you don&apos;t have to. Just add your brand and start selling.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Fully White-Labeled',
                description: 'Your logo, colors, and domain. Clients never see our brand anywhere.',
              },
              {
                icon: DollarSign,
                title: 'Stripe Rebilling',
                description: 'Payments go directly to your Stripe. Set any price. Keep 100%.',
              },
              {
                icon: Zap,
                title: 'Instant Provisioning',
                description: 'Client signs up, AI receptionist is live in under 60 seconds.',
              },
              {
                icon: Clock,
                title: '24/7 AI Coverage',
                description: 'Never miss a call. Natural conversations that book appointments.',
              },
              {
                icon: Users,
                title: 'Unlimited Clients',
                description: 'No per-seat fees. Scale to 100 clients, same platform price.',
              },
              {
                icon: Phone,
                title: 'Dedicated Numbers',
                description: 'Each client gets their own local or toll-free number.',
              },
            ].map((feature) => (
              <div 
                key={feature.title} 
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 mb-4 transition-colors group-hover:bg-emerald-400/10">
                  <feature.icon className="h-6 w-6 text-[#f5f5f0]/60 transition-colors group-hover:text-emerald-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-[#f5f5f0]/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 lg:py-32 border-t border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-emerald-400 tracking-wide uppercase mb-4">Simple Pricing</p>
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight">
              One price. Unlimited upside.
            </h2>
            <p className="mt-4 text-lg text-[#f5f5f0]/50">
              No per-client fees. No revenue share. Scale without limits.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                {
                  name: 'Starter',
                  price: 199,
                  description: 'For new agencies',
                  features: ['Up to 25 clients', 'White-label branding', 'Subdomain included', 'Email support', 'Basic analytics'],
                  highlighted: false,
                },
                {
                  name: 'Growth',
                  price: 299,
                  description: 'Most popular',
                  features: ['Up to 100 clients', 'Everything in Starter', 'Custom domain', 'Priority support', 'Advanced analytics', 'API access'],
                  highlighted: true,
                },
                {
                  name: 'Scale',
                  price: 499,
                  description: 'For established agencies',
                  features: ['Unlimited clients', 'Everything in Growth', 'White-label emails', 'Dedicated success manager', 'Custom integrations', 'SLA guarantee'],
                  highlighted: false,
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl border p-6 transition-all ${
                    tier.highlighted
                      ? 'border-emerald-400/50 bg-emerald-400/5'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-medium text-[#0a0a0a]">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <p className="text-sm text-[#f5f5f0]/50">{tier.description}</p>
                    <p className="text-2xl font-medium mt-1">{tier.name}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-semibold">${tier.price}</span>
                    <span className="text-[#f5f5f0]/50">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-[#f5f5f0]/70">
                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`block w-full rounded-full py-3 text-center text-sm font-medium transition-all ${
                      tier.highlighted
                        ? 'bg-[#f5f5f0] text-[#0a0a0a] hover:bg-white'
                        : 'bg-white/10 text-[#f5f5f0] hover:bg-white/20'
                    }`}
                  >
                    Start Free Trial
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center mt-8 text-sm text-[#f5f5f0]/40">
              All plans include 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 lg:py-32 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-1 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="text-2xl lg:text-3xl font-medium leading-relaxed">
            &ldquo;I started with zero technical skills. Now I have 23 clients paying me $149/month each. 
            VoiceAI Connect handles everything—I just focus on sales.&rdquo;
          </blockquote>
          <div className="mt-8">
            <p className="font-medium">Marcus Chen</p>
            <p className="text-sm text-[#f5f5f0]/50">Founder, LocalAI Solutions · $3,400/mo profit</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 lg:py-32 border-t border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-medium tracking-tight">
              Questions & Answers
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'Do I need technical skills?',
                a: 'No. If you can use Canva, you can use this. Upload logo, pick colors, share link. That\'s it.',
              },
              {
                q: 'How do I get clients?',
                a: 'We provide sales scripts and training. Most partners find clients through cold outreach to local businesses, Facebook ads, or YouTube content.',
              },
              {
                q: 'What do my clients see?',
                a: 'Only your brand. Your logo, your colors, your domain. We\'re completely invisible to them.',
              },
              {
                q: 'How does billing work?',
                a: 'Connect your Stripe account. Set your prices. Clients pay you directly. We charge you a flat monthly fee regardless of how many clients you have.',
              },
              {
                q: 'Can I really charge $99-299/month?',
                a: 'Yes. A single missed call can cost a business $500+. $149/month for 24/7 coverage is a no-brainer. Our top partners charge $299+.',
              },
              {
                q: 'What if I need help?',
                a: 'Every partner gets access to our support team. Growth and Scale plans include priority support and dedicated success managers.',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="text-lg font-medium mb-3">{item.q}</h3>
                <p className="text-[#f5f5f0]/60 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 lg:py-32 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-medium tracking-tight">
            Ready to start your AI agency?
          </h2>
          <p className="mt-6 text-xl text-[#f5f5f0]/50">
            Join 847 agencies already building recurring revenue with VoiceAI Connect.
          </p>
          <div className="mt-10">
            <Link 
              href="/signup" 
              className="group inline-flex items-center gap-3 rounded-full bg-[#f5f5f0] px-8 py-4 text-base font-medium text-[#0a0a0a] transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <p className="mt-6 text-sm text-[#f5f5f0]/40">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f0]">
                <Phone className="h-4 w-4 text-[#0a0a0a]" />
              </div>
              <span className="font-medium">VoiceAI Connect</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#f5f5f0]/40">
              <Link href="/terms" className="hover:text-[#f5f5f0] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#f5f5f0] transition-colors">Privacy</Link>
              <a href="mailto:support@voiceaiconnect.com" className="hover:text-[#f5f5f0] transition-colors">Contact</a>
            </div>
            <p className="text-sm text-[#f5f5f0]/30">
              © 2026 VoiceAI Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}