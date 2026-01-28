'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, ChevronRight, Target, Rocket, 
  DollarSign, Users, MessageSquare, TrendingUp, Lightbulb,
  CheckCircle2, Clock, Zap, BarChart3, Phone, Mail,
  Calendar, FileText, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HowToStartAgencyPage() {
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

      {/* Hero Section with Answer-First Content */}
      <section className="relative pt-28 sm:pt-32 lg:pt-40 pb-16 sm:pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/[0.07] via-amber-500/[0.03] to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#fafaf9]/40 mb-6">
            <Link href="/" className="hover:text-[#fafaf9] transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#fafaf9]/60">Guides</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            How to Start an
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              AI Receptionist Agency
            </span>
          </h1>
          
          {/* Answer-First Summary Box */}
          <div className="mt-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">To start an AI receptionist agency:</strong> Choose a white-label platform that provides the technology, customize it with your branding, connect your payment processor, then acquire clients through cold outreach, content marketing, or paid ads. Most agencies reach profitability with 5-10 clients, achievable within 30-60 days with consistent effort. No technical skills required.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[#fafaf9]/50">
            <span>Updated January 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span>15 min read</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span className="text-emerald-400">Complete Guide</span>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-[#fafaf9]/40 uppercase tracking-wider mb-4">In This Guide</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { num: '01', title: 'Why Now Is the Time', href: '#why-now' },
              { num: '02', title: 'Choose Your Platform', href: '#platform' },
              { num: '03', title: 'Set Up Your Brand', href: '#branding' },
              { num: '04', title: 'Define Your Pricing', href: '#pricing' },
              { num: '05', title: 'Get Your First Clients', href: '#clients' },
              { num: '06', title: 'Scale & Optimize', href: '#scale' },
            ].map((item) => (
              <a 
                key={item.num}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
              >
                <span className="text-xs font-medium text-emerald-400/60">{item.num}</span>
                <span className="text-sm text-[#fafaf9]/70 group-hover:text-[#fafaf9] transition-colors">{item.title}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* Section 1: Why Now */}
          <div id="why-now" className="mb-20 scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-400">01</span>
              <h2 className="text-2xl sm:text-3xl font-semibold">Why 2026 Is the Perfect Time to Start</h2>
            </div>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              The AI receptionist market is in a rare sweet spot: the technology is mature enough to deliver real value, but adoption is still early enough that most local businesses have never heard of it. This creates a massive opportunity for first movers.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { stat: '34%', label: 'of business calls go unanswered', subtext: 'Source: Invoca 2025' },
                { stat: '$106B', label: 'lost annually to missed calls', subtext: 'Source: Forbes Research' },
                { stat: '85%', label: 'of callers won\'t call back', subtext: 'if they reach voicemail' },
                { stat: '<5%', label: 'of SMBs use AI answering', subtext: 'Massive untapped market' },
              ].map((item) => (
                <div key={item.label} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <p className="text-2xl sm:text-3xl font-semibold text-emerald-400">{item.stat}</p>
                  <p className="text-sm text-[#fafaf9]/70 mt-1">{item.label}</p>
                  <p className="text-xs text-[#fafaf9]/40 mt-1">{item.subtext}</p>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-200">The Opportunity</p>
                  <p className="text-sm text-[#fafaf9]/60 mt-1">
                    Local businesses desperately need 24/7 call coverage but can't afford $3,000+/month for a human receptionist. 
                    AI gives them enterprise-level coverage for $99-299/month. You're not selling a nice-to-have—you're solving 
                    a painful, expensive problem.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Choose Your Platform */}
          <div id="platform" className="mb-20 scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-400">02</span>
              <h2 className="text-2xl sm:text-3xl font-semibold">Choose Your White-Label Platform</h2>
            </div>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Your platform choice determines everything: the quality of AI your clients experience, how much you can charge, 
              how fast you can onboard, and ultimately your profit margins. Take this decision seriously.
            </p>

            <h3 className="text-xl font-semibold mb-4">Key Evaluation Criteria</h3>
            
            <div className="space-y-4 mb-8">
              {[
                {
                  title: 'White-Label Depth',
                  description: 'Every touchpoint should show YOUR brand—client dashboard, emails, invoices, phone experience. Partial white-labeling creates a confusing, unprofessional experience.',
                  priority: 'Critical',
                },
                {
                  title: 'AI Voice Quality',
                  description: 'Call the demo line. Does it sound natural? Can it handle interruptions, accents, and complex questions? Poor AI quality will destroy your reputation with clients.',
                  priority: 'Critical',
                },
                {
                  title: 'Payment Structure',
                  description: 'Look for platforms where clients pay YOU directly via your Stripe. Avoid revenue sharing—it kills margins at scale. Flat platform fees are ideal.',
                  priority: 'Critical',
                },
                {
                  title: 'Client Onboarding Speed',
                  description: 'How fast can you get a new client live? The best platforms enable <5 minute setup. Slow onboarding means lost deals and frustrated clients.',
                  priority: 'High',
                },
                {
                  title: 'Marketing Support',
                  description: 'Does the platform provide a marketing website, demo numbers, sales scripts, and training? The best partners invest in your success.',
                  priority: 'High',
                },
                {
                  title: 'Scalability',
                  description: 'What happens at 50 or 100 clients? Look for flat-fee tiers that don\'t punish growth. Per-client fees eat into margins as you scale.',
                  priority: 'Medium',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        item.priority === 'Critical' 
                          ? 'bg-red-500/10 text-red-400' 
                          : item.priority === 'High'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-white/[0.06] text-[#fafaf9]/60'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
              <p className="font-medium mb-2">Why VoiceAI Connect?</p>
              <p className="text-sm text-[#fafaf9]/60 mb-4">
                We built VoiceAI Connect specifically for agencies who want to own their AI receptionist business. 
                Complete white-labeling, direct Stripe payments, flat monthly fees, and marketing tools included.
              </p>
              <Link 
                href="/signup" 
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Start your free trial <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Section 3: Set Up Your Brand */}
          <div id="branding" className="mb-20 scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-400">03</span>
              <h2 className="text-2xl sm:text-3xl font-semibold">Set Up Your Brand & Identity</h2>
            </div>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              This is where you transform a generic platform into YOUR product. Your brand creates perceived value, 
              builds trust, and differentiates you from competitors.
            </p>

            <h3 className="text-xl font-semibold mb-4">Branding Checklist</h3>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { task: 'Company Name', description: 'Choose something that communicates "AI" + "answering/receptionist"', example: 'e.g., CallBird AI, SmartAnswer Pro, ReceptionistAI' },
                { task: 'Logo & Colors', description: 'Clean, professional design that works at small sizes', example: 'Use Canva, Looka, or hire on Fiverr ($20-50)' },
                { task: 'Domain Name', description: 'Match your company name, .com preferred', example: 'e.g., callbird.ai, smartanswerpro.com' },
                { task: 'Tagline/Positioning', description: 'One sentence that explains your value', example: 'e.g., "24/7 AI answering for growing businesses"' },
              ].map((item) => (
                <div key={item.task} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <h4 className="font-medium">{item.task}</h4>
                  </div>
                  <p className="text-sm text-[#fafaf9]/50 mb-2">{item.description}</p>
                  <p className="text-xs text-emerald-400/70">{item.example}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold mb-4">Platform Configuration (30 Minutes)</h3>
            
            <div className="space-y-3">
              {[
                'Upload your logo (PNG with transparent background)',
                'Set your brand colors (primary, secondary, accent)',
                'Configure your custom domain (or use provided subdomain to start)',
                'Customize email templates with your voice and branding',
                'Set up your marketing website (if platform provides)',
                'Configure demo phone number for prospect testing',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium">{i + 1}</span>
                  <span className="text-sm text-[#fafaf9]/70">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Define Your Pricing */}
          <div id="pricing" className="mb-20 scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-400">04</span>
              <h2 className="text-2xl sm:text-3xl font-semibold">Define Your Pricing Strategy</h2>
            </div>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Pricing is where many new agencies undercharge. Remember: you're not selling "AI software"—you're 
              selling 24/7 call coverage that prevents lost revenue. Price accordingly.
            </p>

            <h3 className="text-xl font-semibold mb-4">Recommended Pricing Tiers</h3>
            
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                {
                  name: 'Starter',
                  price: '$99',
                  desc: '/month',
                  features: ['Up to 50 calls/month', 'Basic AI greeting', 'SMS notifications', 'Call recordings'],
                  target: 'Low-volume businesses, testing the waters',
                },
                {
                  name: 'Professional',
                  price: '$199',
                  desc: '/month',
                  features: ['Up to 200 calls/month', 'Custom AI training', 'Calendar integration', 'Priority support'],
                  target: 'Most small businesses, best value',
                  popular: true,
                },
                {
                  name: 'Enterprise',
                  price: '$299+',
                  desc: '/month',
                  features: ['Unlimited calls', 'Advanced integrations', 'Multiple locations', 'Dedicated support'],
                  target: 'Growing businesses, agencies',
                },
              ].map((tier) => (
                <div 
                  key={tier.name} 
                  className={`p-5 rounded-xl border ${
                    tier.popular 
                      ? 'border-emerald-500/30 bg-emerald-500/[0.05]' 
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  {tier.popular && (
                    <span className="text-xs font-medium text-emerald-400 mb-2 block">Most Popular</span>
                  )}
                  <p className="text-sm text-[#fafaf9]/50">{tier.name}</p>
                  <p className="text-2xl font-semibold mt-1">{tier.price}<span className="text-sm font-normal text-[#fafaf9]/40">{tier.desc}</span></p>
                  <ul className="mt-4 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[#fafaf9]/60">
                        <Check className="h-3 w-3 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-[#fafaf9]/40">{tier.target}</p>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-200">Pricing Psychology</p>
                  <p className="text-sm text-[#fafaf9]/60 mt-1">
                    A human receptionist costs $3,000-4,000/month. A missed call can cost $500+ in lost business. 
                    Even your highest tier is a massive bargain compared to the alternatives. Don't apologize for 
                    your pricing—own it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Get Your First Clients */}
          <div id="clients" className="mb-20 scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-400">05</span>
              <h2 className="text-2xl sm:text-3xl font-semibold">Get Your First 10 Clients</h2>
            </div>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Your first 10 clients are the hardest. After that, you'll have testimonials, case studies, and referrals. 
              Here are the three most effective acquisition channels for new agencies:
            </p>

            {/* Channel 1: Cold Outreach */}
            <div className="mb-8 p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Channel 1: Cold Email & LinkedIn Outreach</h3>
                  <p className="text-sm text-[#fafaf9]/50">Best for: Fast results, predictable pipeline</p>
                </div>
              </div>
              
              <p className="text-sm text-[#fafaf9]/60 mb-4">
                Target local service businesses: plumbers, HVAC, dentists, lawyers, contractors. These businesses 
                miss calls constantly and feel the pain directly in lost revenue.
              </p>
              
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs font-medium text-[#fafaf9]/40 uppercase mb-2">Sample Email Template</p>
                <p className="text-sm text-[#fafaf9]/70 font-mono leading-relaxed">
                  Subject: Quick question about [Business Name]<br/><br/>
                  Hi [Name],<br/><br/>
                  I noticed [Business Name] doesn't have 24/7 call coverage. Do you know how many calls you're missing after hours and on weekends?<br/><br/>
                  For businesses like yours, that's usually 15-20 missed calls per month—each worth $200-500 in potential revenue.<br/><br/>
                  We help [industry] businesses capture every call with AI that answers instantly, takes messages, and can even book appointments. All for less than a single missed job would cost you.<br/><br/>
                  Worth a 10-minute call to see if it's a fit?<br/><br/>
                  [Your name]
                </p>
              </div>
            </div>

            {/* Channel 2: Content Marketing */}
            <div className="mb-8 p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Channel 2: YouTube & Content Marketing</h3>
                  <p className="text-sm text-[#fafaf9]/50">Best for: Long-term authority, inbound leads</p>
                </div>
              </div>
              
              <p className="text-sm text-[#fafaf9]/60 mb-4">
                Create educational content about AI for local businesses. YouTube videos rank well for local queries, 
                and establish you as an expert before prospects even contact you.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  '"How AI Answering Services Work for [Industry]"',
                  '"I Tested AI Receptionist for My [Business Type]"',
                  '"Why [Industry] Businesses Are Switching to AI"',
                  '"AI vs Human Receptionist: Honest Comparison"',
                ].map((title) => (
                  <div key={title} className="p-3 rounded-lg bg-white/[0.03] text-sm text-[#fafaf9]/60">
                    {title}
                  </div>
                ))}
              </div>
            </div>

            {/* Channel 3: Local Networking */}
            <div className="mb-8 p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Users className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Channel 3: Local Business Networking</h3>
                  <p className="text-sm text-[#fafaf9]/50">Best for: High-trust sales, referral chains</p>
                </div>
              </div>
              
              <p className="text-sm text-[#fafaf9]/60 mb-4">
                BNI chapters, Chamber of Commerce events, and industry meetups put you in front of business owners 
                who are actively looking to improve their operations.
              </p>
              
              <ul className="space-y-2">
                {[
                  'Bring a tablet so prospects can call your demo line on the spot',
                  'Focus on one or two industries at first—become "the AI guy" for dentists or plumbers',
                  'Ask for referrals explicitly: "Who else in your network struggles with missed calls?"',
                  'Offer a special deal for referrals to create a flywheel effect',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-[#fafaf9]/60">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05]">
              <p className="font-medium mb-2">Timeline Expectations</p>
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-emerald-400">Week 1-2</p>
                  <p className="text-sm text-[#fafaf9]/50 mt-1">Platform setup, branding, first 50 outreach emails</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-emerald-400">Week 3-4</p>
                  <p className="text-sm text-[#fafaf9]/50 mt-1">First demos booked, 1-3 clients signed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-emerald-400">Month 2-3</p>
                  <p className="text-sm text-[#fafaf9]/50 mt-1">10+ clients, positive ROI, referrals starting</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Scale & Optimize */}
          <div id="scale" className="mb-16 scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-400">06</span>
              <h2 className="text-2xl sm:text-3xl font-semibold">Scale to 50+ Clients</h2>
            </div>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Once you've validated the model with 10 clients, it's time to systematize and scale. 
              The good news: marginal cost per client approaches zero since the platform handles everything.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: TrendingUp,
                  title: 'Systematize Outreach',
                  description: 'Use tools like Instantly, Lemlist, or Apollo to automate cold email at scale. Set up sequences that run daily without your involvement.',
                },
                {
                  icon: BarChart3,
                  title: 'Track Your Numbers',
                  description: 'Know your CAC (customer acquisition cost), LTV (lifetime value), and churn rate. These metrics tell you exactly where to invest.',
                },
                {
                  icon: Users,
                  title: 'Build a Referral Engine',
                  description: 'Offer clients a free month for every referral that signs up. Happy clients are your best salespeople.',
                },
                {
                  icon: Target,
                  title: 'Niche Down',
                  description: 'Become THE AI receptionist provider for dentists, or plumbers, or lawyers. Specialization commands premium pricing.',
                },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] mb-3">
                    <item.icon className="h-5 w-5 text-[#fafaf9]/60" />
                  </div>
                  <h4 className="font-medium mb-2">{item.title}</h4>
                  <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-10">
            Common Questions About Starting
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'How much money do I need to start?',
                a: 'Most white-label platforms cost $99-299/month. Add $50-100 for a domain, logo, and basic tools. You can start a legitimate AI receptionist agency for under $500 total investment. Many agencies become profitable within their first month by signing just 2-3 clients.',
              },
              {
                q: 'Do I need any technical background?',
                a: 'No. Modern white-label platforms handle all the technology. If you can use Canva and send emails, you have all the technical skills required. The business skills—sales, marketing, client relationships—matter far more.',
              },
              {
                q: 'How do I handle support when clients have issues?',
                a: 'Most issues are handled by the platform automatically. For questions you can\'t answer, good white-label partners provide resources and escalation paths. As you grow, you\'ll learn the common issues and build FAQ docs for clients.',
              },
              {
                q: 'What if a client wants to cancel?',
                a: 'Some churn is normal (expect 3-5% monthly). Focus on onboarding clients well and checking in regularly. The businesses that see real value—missed calls captured, appointments booked—rarely cancel. If someone does leave, learn why and improve.',
              },
              {
                q: 'Can I do this part-time while keeping my job?',
                a: 'Absolutely. Many successful agency owners started with 10-15 hours per week while employed. Cold outreach and content creation can be done evenings and weekends. Once you hit 10-15 clients ($1,500-3,000/month), you can evaluate going full-time.',
              },
              {
                q: 'How is this different from starting an SMMA?',
                a: 'Social media marketing agencies require ongoing work for each client—posting, managing ads, reporting. AI receptionist agencies have minimal ongoing work once clients are onboarded. The AI runs 24/7 without your involvement. It\'s much more scalable.',
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
                Ready to start your
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  AI receptionist agency?
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#fafaf9]/50">
                VoiceAI Connect gives you everything you need. Start your free trial today.
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
                  href="/what-is-white-label-ai-receptionist" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium transition-all hover:bg-white/[0.06]"
                >
                  What is White-Label AI?
                </Link>
              </div>
              
              <p className="mt-6 text-sm text-[#fafaf9]/40">
                14-day free trial · No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl font-semibold mb-8">Continue Learning</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'What Is a White-Label AI Receptionist Platform?',
                description: 'Understand the business model and technology behind white-label AI.',
                href: '/what-is-white-label-ai-receptionist',
              },
              {
                title: 'AI Receptionist Agency Pricing Models',
                description: 'Deep dive into pricing strategies that maximize profit.',
                href: '/ai-receptionist-agency-pricing',
              },
              {
                title: 'White-Label vs Building Your Own',
                description: 'Compare the costs and tradeoffs of each approach.',
                href: '/white-label-vs-build-your-own',
              },
              {
                title: 'Platform Features & Pricing',
                description: 'See what VoiceAI Connect offers agency partners.',
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