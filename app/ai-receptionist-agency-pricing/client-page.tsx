'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, ChevronRight, DollarSign, TrendingUp,
  Users, Calculator, Lightbulb, Target, BarChart3, 
  AlertTriangle, Zap, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PricingModelsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9] overflow-hidden">
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
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled ? 'bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.06]' : 'bg-transparent'
      }`}>
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

            <div className="hidden lg:flex items-center gap-1">
              {[
                { name: 'Platform', href: '/platform' },
                { name: 'How It Works', href: '/#how-it-works' },
                { name: 'Pricing', href: '/#pricing' },
                { name: 'Resources', href: '/blog' },
              ].map((item) => (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors rounded-lg hover:bg-white/[0.03]"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link href="/agency/login" className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="group relative inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:shadow-lg hover:shadow-white/10"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -mr-2 text-[#fafaf9]/60 hover:text-[#fafaf9]"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden transition-all duration-300 ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-4 pb-6 pt-2 space-y-1 bg-[#050505]/95 backdrop-blur-xl border-b border-white/[0.06]">
            {[
              { name: 'Platform', href: '/platform' },
              { name: 'How It Works', href: '/#how-it-works' },
              { name: 'Pricing', href: '/#pricing' },
              { name: 'Resources', href: '/blog' },
            ].map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-[#fafaf9]/70 hover:text-[#fafaf9] hover:bg-white/[0.03] rounded-lg transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/agency/login" className="px-4 py-3 text-center text-[#fafaf9]/70 hover:text-[#fafaf9] rounded-lg border border-white/10">
                Sign In
              </Link>
              <Link href="/signup" className="px-4 py-3 text-center bg-white text-[#050505] font-medium rounded-full">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 lg:pt-40 pb-16 sm:pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/[0.07] via-amber-500/[0.03] to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#fafaf9]/40 mb-6">
            <Link href="/" className="hover:text-[#fafaf9] transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#fafaf9]/60">Pricing Strategy</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            AI Receptionist Agency
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              Pricing Models & Strategies
            </span>
          </h1>
          
          {/* Answer-First Summary Box */}
          <div className="mt-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">Most successful AI receptionist agencies charge $99-299/month</strong> using a tiered pricing model based on call volume or features. The sweet spot for most local businesses is $149-199/month—expensive enough to signal quality, cheap enough to be a no-brainer compared to human receptionists ($3,000+/month) or missed revenue from unanswered calls.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-[#fafaf9]/50">
            <span>Updated January 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span>12 min read</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* The Pricing Psychology Section */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Lightbulb className="h-5 w-5 text-emerald-400" />
              </span>
              Pricing Psychology: Why $149 Beats $49
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              New agency owners often underprice out of fear. They think lower prices mean more customers. 
              In reality, pricing too low signals low quality and attracts price-sensitive clients who churn quickly.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.05]">
                <h4 className="font-medium mb-3 text-red-300">❌ Why $49/month Fails</h4>
                <ul className="space-y-2 text-sm text-[#fafaf9]/50">
                  <li>• Attracts bargain hunters who churn fast</li>
                  <li>• Signals "cheap" or "experimental" product</li>
                  <li>• Need 40+ clients just to make $2K/month</li>
                  <li>• No room for discounts or special offers</li>
                  <li>• Clients don't take the service seriously</li>
                </ul>
              </div>
              <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05]">
                <h4 className="font-medium mb-3 text-emerald-300">✓ Why $149/month Wins</h4>
                <ul className="space-y-2 text-sm text-[#fafaf9]/70">
                  <li>• Attracts serious business owners</li>
                  <li>• Still 95% cheaper than human receptionist</li>
                  <li>• Only need 15 clients for $2K/month</li>
                  <li>• Room for annual discounts (2 months free)</li>
                  <li>• Perceived as professional-grade solution</li>
                </ul>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[#fafaf9]/70">
                <strong className="text-[#fafaf9]">The anchor that matters:</strong> Your competition isn't other AI services—it's the cost of the alternative. 
                A human receptionist is $3,000-4,000/month. A single missed call costs $200-500 in lost revenue. 
                At $149/month, you're offering enterprise-grade coverage for less than the cost of one missed opportunity.
              </p>
            </div>
          </div>

          {/* The Three Pricing Models */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
              </span>
              Three Pricing Models That Work
            </h2>

            {/* Model 1: Tiered by Call Volume */}
            <div className="mb-8 p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 text-sm font-semibold">1</span>
                <h3 className="font-semibold text-lg">Tiered by Call Volume</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">Most Popular</span>
              </div>
              
              <p className="text-sm text-[#fafaf9]/60 mb-4">
                Charge based on monthly call volume. Simple to understand, scales naturally with client success.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {[
                  { name: 'Starter', calls: 'Up to 50 calls', price: '$99' },
                  { name: 'Growth', calls: 'Up to 150 calls', price: '$179' },
                  { name: 'Pro', calls: 'Up to 300 calls', price: '$279' },
                ].map((tier) => (
                  <div key={tier.name} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-sm text-[#fafaf9]/50">{tier.name}</p>
                    <p className="text-xl font-semibold mt-1">{tier.price}<span className="text-sm font-normal text-[#fafaf9]/40">/mo</span></p>
                    <p className="text-xs text-[#fafaf9]/40 mt-1">{tier.calls}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-[#fafaf9]/60"><strong className="text-[#fafaf9]/80">Best for:</strong> General agencies targeting mixed industries with varying call volumes.</span>
              </div>
            </div>

            {/* Model 2: Tiered by Features */}
            <div className="mb-8 p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 text-sm font-semibold">2</span>
                <h3 className="font-semibold text-lg">Tiered by Features</h3>
              </div>
              
              <p className="text-sm text-[#fafaf9]/60 mb-4">
                All tiers get unlimited calls, but higher tiers unlock advanced capabilities.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {[
                  { name: 'Essential', features: 'Answering + SMS alerts', price: '$129' },
                  { name: 'Professional', features: '+ Calendar booking', price: '$199' },
                  { name: 'Enterprise', features: '+ CRM integration', price: '$299' },
                ].map((tier) => (
                  <div key={tier.name} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-sm text-[#fafaf9]/50">{tier.name}</p>
                    <p className="text-xl font-semibold mt-1">{tier.price}<span className="text-sm font-normal text-[#fafaf9]/40">/mo</span></p>
                    <p className="text-xs text-[#fafaf9]/40 mt-1">{tier.features}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-[#fafaf9]/60"><strong className="text-[#fafaf9]/80">Best for:</strong> Agencies with sophisticated clients who value integrations (law firms, medical practices).</span>
              </div>
            </div>

            {/* Model 3: Industry-Specific */}
            <div className="mb-8 p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 text-sm font-semibold">3</span>
                <h3 className="font-semibold text-lg">Industry-Specific Pricing</h3>
              </div>
              
              <p className="text-sm text-[#fafaf9]/60 mb-4">
                One price per vertical with features tailored to that industry. Simplifies sales conversations.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {[
                  { name: 'For Contractors', features: 'Job intake + scheduling', price: '$179' },
                  { name: 'For Dentists', features: 'Appointment booking', price: '$229' },
                  { name: 'For Lawyers', features: 'Intake + conflict check', price: '$299' },
                ].map((tier) => (
                  <div key={tier.name} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-sm text-[#fafaf9]/50">{tier.name}</p>
                    <p className="text-xl font-semibold mt-1">{tier.price}<span className="text-sm font-normal text-[#fafaf9]/40">/mo</span></p>
                    <p className="text-xs text-[#fafaf9]/40 mt-1">{tier.features}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-[#fafaf9]/60"><strong className="text-[#fafaf9]/80">Best for:</strong> Niche-focused agencies who specialize in one or two verticals.</span>
              </div>
            </div>
          </div>

          {/* Setup Fees & Add-Ons */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Calculator className="h-5 w-5 text-emerald-400" />
              </span>
              Setup Fees & Add-Ons: Hidden Profit Centers
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Monthly recurring revenue is the foundation, but setup fees and add-ons can significantly 
              boost your average revenue per client.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <h4 className="font-medium mb-4">One-Time Setup Fees</h4>
                <div className="space-y-3">
                  {[
                    { item: 'Basic onboarding', range: '$0-99', note: 'Many waive this to reduce friction' },
                    { item: 'Custom AI training', range: '$199-499', note: 'For complex business rules' },
                    { item: 'Website integration', range: '$149-299', note: 'Chat widget, click-to-call' },
                    { item: 'CRM setup', range: '$199-399', note: 'Connect to their existing tools' },
                  ].map((fee) => (
                    <div key={fee.item} className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-[#fafaf9]/80">{fee.item}</p>
                        <p className="text-xs text-[#fafaf9]/40">{fee.note}</p>
                      </div>
                      <span className="text-sm font-medium text-emerald-400">{fee.range}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <h4 className="font-medium mb-4">Monthly Add-Ons</h4>
                <div className="space-y-3">
                  {[
                    { item: 'Additional phone number', range: '$15-29/mo', note: 'For multi-location businesses' },
                    { item: 'Bilingual support', range: '$49-99/mo', note: 'Spanish, French, etc.' },
                    { item: 'After-hours only', range: '$79-129/mo', note: 'Supplement existing staff' },
                    { item: 'Priority support', range: '$49-99/mo', note: 'Faster response times' },
                  ].map((addon) => (
                    <div key={addon.item} className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-[#fafaf9]/80">{addon.item}</p>
                        <p className="text-xs text-[#fafaf9]/40">{addon.note}</p>
                      </div>
                      <span className="text-sm font-medium text-emerald-400">{addon.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-200">Pro Tip: The "Waived Setup Fee" Close</p>
                  <p className="text-sm text-[#fafaf9]/60 mt-1">
                    Quote a $299 setup fee, then "waive it" if they sign up within 48 hours or commit to annual billing. 
                    This creates urgency and perceived value without actually reducing your revenue.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Annual vs Monthly */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </span>
              Annual vs Monthly: Optimizing for Cash Flow
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Offering annual plans improves cash flow, reduces churn, and increases customer lifetime value. 
              The key is making the discount compelling without giving away too much margin.
            </p>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] mb-6">
              <h3 className="font-semibold mb-4">Recommended Annual Discount Structure</h3>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-[#fafaf9]/50 mb-3">Monthly Billing</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#fafaf9]/70">$179/month × 12</span>
                      <span className="font-medium">$2,148/year</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#fafaf9]/50 mb-3">Annual Billing (2 months free)</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#fafaf9]/70">$179 × 10 months</span>
                      <span className="font-medium">$1,790/year</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Client saves</span>
                      <span className="font-medium">$358 (17% off)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <p className="text-sm text-[#fafaf9]/60">
                  <strong className="text-[#fafaf9]">Why "2 months free" beats "17% off":</strong> Framing matters. 
                  "Get 2 months free" sounds like a gift. "17% discount" sounds like a negotiation. Same math, better psychology.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { metric: '40-60%', label: 'of clients choose annual', sublabel: 'when offered properly' },
                { metric: '3-5%', label: 'monthly churn rate', sublabel: 'vs 20-30% annual churn' },
                { metric: '$1,790', label: 'cash upfront', sublabel: 'vs $179/month trickle' },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                  <p className="text-2xl font-semibold text-emerald-400">{stat.metric}</p>
                  <p className="text-sm text-[#fafaf9]/70 mt-1">{stat.label}</p>
                  <p className="text-xs text-[#fafaf9]/40">{stat.sublabel}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Common Pricing Mistakes */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </span>
              Pricing Mistakes That Kill Agencies
            </h2>

            <div className="space-y-4">
              {[
                {
                  mistake: 'Racing to the bottom on price',
                  why: 'You attract price-sensitive clients who churn at the first issue and leave negative reviews. Meanwhile, you can\'t afford to provide good service at $49/month.',
                  fix: 'Compete on value and service, not price. Emphasize ROI: "$149/month to never miss a $500 job."',
                },
                {
                  mistake: 'No pricing page on your website',
                  why: 'Prospects assume you\'re expensive or hiding something. You waste time on calls with unqualified leads who can\'t afford you.',
                  fix: 'Display pricing clearly. Qualified leads self-select in; unqualified leads self-select out.',
                },
                {
                  mistake: 'Unlimited everything at one price',
                  why: 'Your best clients subsidize your worst. Heavy users drain resources while light users feel overcharged.',
                  fix: 'Create tiers that let light users pay less and heavy users pay more. Everyone feels they\'re getting fair value.',
                },
                {
                  mistake: 'Discounting when asked',
                  why: 'Trains clients to always ask for discounts. Signals your pricing isn\'t firm. Attracts negotiators.',
                  fix: 'Hold the line on monthly price. Offer value-adds instead: "I can\'t discount, but I\'ll include the CRM integration free."',
                },
                {
                  mistake: 'Not raising prices annually',
                  why: 'Your costs increase (platform fees, support time) but revenue stays flat. Margins erode over time.',
                  fix: 'Raise prices 5-10% annually for new customers. Grandfather existing clients or give them smaller increases.',
                },
              ].map((item) => (
                <div key={item.mistake} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <h4 className="font-medium text-red-300 mb-2">❌ {item.mistake}</h4>
                  <p className="text-sm text-[#fafaf9]/50 mb-3">{item.why}</p>
                  <p className="text-sm text-emerald-400/80">✓ <strong>Fix:</strong> {item.fix}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing by Industry */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Target className="h-5 w-5 text-emerald-400" />
              </span>
              What Top Agencies Charge by Industry
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Different industries have different price sensitivities and value perceptions. 
              Here's what the market typically bears:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-4 pr-4 font-medium text-[#fafaf9]/50">Industry</th>
                    <th className="text-center py-4 px-4 font-medium text-[#fafaf9]/50">Typical Range</th>
                    <th className="text-center py-4 px-4 font-medium text-[#fafaf9]/50">Sweet Spot</th>
                    <th className="text-left py-4 pl-4 font-medium text-[#fafaf9]/50">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {[
                    { industry: 'Home Services (HVAC, Plumbing)', range: '$99-199', sweet: '$149', notes: 'High volume, price sensitive' },
                    { industry: 'Dental Practices', range: '$149-279', sweet: '$199', notes: 'Value appointment booking' },
                    { industry: 'Law Firms', range: '$199-399', sweet: '$279', notes: 'High value per lead, less price sensitive' },
                    { industry: 'Medical Practices', range: '$179-329', sweet: '$229', notes: 'HIPAA considerations add value' },
                    { industry: 'Real Estate Agents', range: '$99-179', sweet: '$129', notes: 'Individual agents are budget conscious' },
                    { industry: 'Auto Repair Shops', range: '$99-179', sweet: '$149', notes: 'Appointment scheduling critical' },
                  ].map((row) => (
                    <tr key={row.industry}>
                      <td className="py-4 pr-4 text-[#fafaf9]/80">{row.industry}</td>
                      <td className="py-4 px-4 text-center text-[#fafaf9]/60">{row.range}</td>
                      <td className="py-4 px-4 text-center text-emerald-400 font-medium">{row.sweet}</td>
                      <td className="py-4 pl-4 text-[#fafaf9]/50 text-xs">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-10">
            Pricing Strategy FAQ
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Should I charge setup fees?',
                a: 'It depends on your positioning. Setup fees qualify serious buyers and add immediate revenue. But they also create friction. Many agencies quote a setup fee and then "waive" it as a closing incentive. Test both approaches and see what converts better for your market.',
              },
              {
                q: 'How do I handle price objections?',
                a: 'Reframe the conversation around ROI. "I understand $149/month feels like an expense. But you told me you miss about 15 calls a month. If even one of those was a $500 job, you\'re losing $500 to save $149. That\'s not a good trade." Always anchor to the cost of the alternative, not competitors.',
              },
              {
                q: 'Should I publish prices on my website?',
                a: 'Yes. Published pricing pre-qualifies leads, saves time, and builds trust. Hiding prices feels sketchy and attracts people who just want to "get a quote" without real intent to buy. The only exception is if you exclusively target enterprise clients with custom pricing.',
              },
              {
                q: 'When should I raise prices?',
                a: 'Raise prices for new customers when you\'re closing more than 50% of proposals (you\'re too cheap), when you\'re at capacity and need to be selective, or annually to keep up with costs. Existing customers can be grandfathered or given smaller increases with advance notice.',
              },
              {
                q: 'What about offering a free tier?',
                a: 'Generally, avoid free tiers for AI receptionist services. Free attracts non-serious users who drain support resources and never convert. A free trial (14 days) is fine—it lets people test quality. But perpetually free users rarely become paying customers.',
              },
            ].map((item, i) => (
              <details 
                key={i} 
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 sm:p-6 cursor-pointer list-none">
                  <h3 className="text-base sm:text-lg font-medium pr-4">{item.q}</h3>
                  <ChevronRight className="h-5 w-5 text-[#fafaf9]/40 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <p className="text-sm sm:text-base text-[#fafaf9]/60 leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 blur-3xl" />
            
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
                Ready to set your prices
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  and start selling?
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#fafaf9]/50">
                VoiceAI Connect lets you set any price you want—and keep 100% of what you charge.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/signup" 
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10"
                >
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link 
                  href="/how-much-can-you-make-ai-receptionist-reseller" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium transition-all hover:bg-white/[0.06]"
                >
                  See Revenue Calculator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl font-semibold mb-8">Related Resources</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'How Much Can You Make Reselling AI Receptionists?',
                description: 'Revenue projections and profit calculations.',
                href: '/how-much-can-you-make-ai-receptionist-reseller',
              },
              {
                title: 'How to Start an AI Receptionist Agency',
                description: 'Complete guide from zero to first client.',
                href: '/how-to-start-ai-receptionist-agency',
              },
              {
                title: 'Adding AI Voice to Your Agency Stack',
                description: 'For existing agencies adding AI services.',
                href: '/add-ai-voice-to-agency',
              },
              {
                title: 'Platform Features & Pricing',
                description: 'See what VoiceAI Connect offers partners.',
                href: '/#pricing',
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
              >
                <h4 className="font-medium mb-1 group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
              </Link>
            ))}
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
              <Link href="/platform" className="hover:text-[#fafaf9] transition-colors">Platform</Link>
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
              <Link href="/blog" className="hover:text-[#fafaf9] transition-colors">Blog</Link>
              <a href="mailto:support@voiceaiconnect.com" className="hover:text-[#fafaf9] transition-colors">Contact</a>
            </div>
            
            <p className="text-sm text-[#fafaf9]/30">
              © 2026 VoiceAI Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

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