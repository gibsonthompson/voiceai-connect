'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, ChevronRight, Megaphone, TrendingUp,
  Users, DollarSign, Target, Zap, BarChart3, Phone,
  Mail, Calendar, Globe, Sparkles, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MarketingAgenciesPage() {
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
            <span className="text-[#fafaf9]/60">For Marketing Agencies</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6">
            <Megaphone className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-300/90">Built for Marketing Agencies</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            White-Label AI Receptionist
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              for Marketing Agencies
            </span>
          </h1>
          
          {/* Answer-First Summary Box */}
          <div className="mt-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">Marketing agencies are uniquely positioned to resell AI receptionists:</strong> You already serve local businesses, understand lead generation, and have clients who miss calls from the campaigns you run. Adding AI receptionist as a service completes the lead-to-customer journey, increases your value per client, and adds $150-300/month per client in pure margin—with zero extra delivery work.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-[#fafaf9]/50">
            <span>Updated January 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span>9 min read</span>
          </div>
        </div>
      </section>

      {/* The Marketing Agency Advantage */}
      <section className="py-12 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-center mb-8">Why Marketing Agencies Have the Edge</h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Existing Client Base', description: 'You already have businesses who trust you and need this service' },
              { icon: Target, title: 'Lead Gen Expertise', description: 'You understand the value of capturing every lead you generate' },
              { icon: Megaphone, title: 'Outbound Skills', description: 'Selling is what you do—you know how to pitch local businesses' },
              { icon: BarChart3, title: 'Results Tracking', description: 'You can show clients exactly how AI improves their lead capture' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 mx-auto mb-3">
                  <item.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* The Problem You're Already Solving (Partially) */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Target className="h-5 w-5 text-emerald-400" />
              </span>
              You Generate Leads. They Miss the Calls.
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Here's the frustrating reality: you run great campaigns. Google Ads, Facebook, SEO—leads are coming in. 
              But when those leads call your clients, what happens?
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { stat: '34%', label: 'of calls go unanswered', sublabel: 'during business hours' },
                { stat: '67%', label: 'of after-hours calls', sublabel: 'are never returned' },
                { stat: '85%', label: 'of callers won\'t', sublabel: 'leave a voicemail' },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                  <p className="text-2xl font-semibold text-red-400">{item.stat}</p>
                  <p className="text-sm text-[#fafaf9]/70 mt-1">{item.label}</p>
                  <p className="text-xs text-[#fafaf9]/40">{item.sublabel}</p>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
              <p className="text-[#fafaf9]/70">
                <strong className="text-amber-300">The hard truth:</strong> Your clients blame their marketing when leads don't convert. 
                But often the problem isn't your campaigns—it's their inability to answer the phone. AI receptionist 
                fixes this blind spot and makes your marketing look even better.
              </p>
            </div>
          </div>

          {/* How It Amplifies Your Services */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </span>
              AI Receptionist Makes Your Marketing More Valuable
            </h2>

            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Think of AI receptionist as the conversion layer that completes your marketing funnel. 
              Every service you offer becomes more effective when paired with 24/7 call capture.
            </p>

            <div className="space-y-4">
              {[
                {
                  service: 'Google Ads / PPC',
                  problem: 'Expensive clicks wasted when calls go unanswered',
                  solution: 'AI answers every call from your ads. Lower cost-per-acquisition, higher ROAS to report.',
                  impact: 'Show clients 30-50% more leads from same ad spend',
                },
                {
                  service: 'SEO / Local Search',
                  problem: 'Organic rankings drive calls, but only during business hours',
                  solution: 'AI captures after-hours searches. Weekend warriors finally convert.',
                  impact: 'Unlock 20-30% more conversions from organic traffic',
                },
                {
                  service: 'Social Media Marketing',
                  problem: 'Posts go viral at 9pm. Nobody answers at 9pm.',
                  solution: 'AI is always on. Captures impulse callers whenever they see your content.',
                  impact: 'Convert social engagement into actual leads',
                },
                {
                  service: 'Website Development',
                  problem: 'Beautiful site, but click-to-call goes to voicemail',
                  solution: 'Every call from the site gets answered. Appointments booked automatically.',
                  impact: 'Website ROI becomes measurable through call conversions',
                },
              ].map((item) => (
                <div key={item.service} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{item.service}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">{item.impact}</span>
                  </div>
                  <p className="text-sm text-red-300/70 mb-2">❌ {item.problem}</p>
                  <p className="text-sm text-emerald-300/70">✓ {item.solution}</p>
                </div>
              ))}
            </div>
          </div>

          {/* The Revenue Opportunity */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </span>
              The Revenue Math for Marketing Agencies
            </h2>

            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Most marketing agencies have 15-50 active clients. Here's what adding AI receptionist 
              looks like as an upsell:
            </p>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] mb-6">
              <h3 className="font-semibold mb-4">Scenario: 30-Client Marketing Agency</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">Active marketing clients</span>
                  <span className="text-xl font-semibold">30</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">AI receptionist adoption (conservative 30%)</span>
                  <span className="text-xl font-semibold">9 clients</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">Average price you charge</span>
                  <span className="text-xl font-semibold">$199/mo</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">New monthly revenue</span>
                  <span className="text-xl font-semibold">$1,791</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">Platform cost</span>
                  <span className="text-xl font-semibold text-[#fafaf9]/40">−$199</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium">New monthly profit</span>
                  <span className="text-2xl font-semibold text-emerald-400">$1,592</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                <p className="text-sm text-[#fafaf9]/70">
                  <strong className="text-emerald-300">That's $19,104/year in new profit</strong> from your existing client base. 
                  No new client acquisition. No extra delivery hours. The AI runs itself 24/7.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { size: 'Small Agency (15 clients)', adopt: '4-5 clients', profit: '$596-795/mo' },
                { size: 'Mid Agency (30 clients)', adopt: '9-12 clients', profit: '$1,592-2,189/mo' },
                { size: 'Large Agency (50 clients)', adopt: '15-20 clients', profit: '$2,786-3,781/mo' },
              ].map((item) => (
                <div key={item.size} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <p className="text-sm text-[#fafaf9]/50">{item.size}</p>
                  <p className="text-xs text-[#fafaf9]/40 mt-1">~{item.adopt} adopt</p>
                  <p className="text-xl font-semibold text-emerald-400 mt-2">{item.profit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Industries Your Clients Are In */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Globe className="h-5 w-5 text-emerald-400" />
              </span>
              Perfect for Your Client Verticals
            </h2>

            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Marketing agencies typically serve local service businesses—exactly the clients who benefit most 
              from AI receptionist. Here's how to position it for each vertical:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  industry: 'Home Services (HVAC, Plumbing, Electrical)',
                  hook: '"Your emergency calls at 2am are going to voicemail. AI answers and dispatches."',
                  price: '$149-179/mo',
                },
                {
                  industry: 'Dental & Medical Practices',
                  hook: '"Patients calling for appointments reach voicemail 40% of the time. AI books them."',
                  price: '$199-249/mo',
                },
                {
                  industry: 'Law Firms',
                  hook: '"A potential client calling at 8pm isn\'t leaving a voicemail. They\'re calling your competitor."',
                  price: '$249-299/mo',
                },
                {
                  industry: 'Real Estate Agents',
                  hook: '"Buyers calling on a listing won\'t wait. AI qualifies and schedules showings instantly."',
                  price: '$129-149/mo',
                },
                {
                  industry: 'Auto Services',
                  hook: '"Customer calling about a flat tire needs help now. AI captures every roadside call."',
                  price: '$149-179/mo',
                },
                {
                  industry: 'Contractors & Trades',
                  hook: '"You miss calls when you\'re on a job site. AI books the next job while you work."',
                  price: '$149-179/mo',
                },
              ].map((item) => (
                <div key={item.industry} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{item.industry}</h4>
                    <span className="text-xs text-emerald-400">{item.price}</span>
                  </div>
                  <p className="text-sm text-[#fafaf9]/50 italic">{item.hook}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bundle or Standalone */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </span>
              How to Package It: Bundle vs Standalone
            </h2>

            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
                <h3 className="font-semibold mb-4">Option A: Bundle with Marketing</h3>
                <p className="text-sm text-[#fafaf9]/50 mb-4">
                  Include AI receptionist in your marketing packages at a premium.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-white/[0.03]">
                    <p className="text-[#fafaf9]/70">Basic Package: $1,500/mo</p>
                    <p className="text-xs text-[#fafaf9]/40">SEO + Social (no AI)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20">
                    <p className="text-emerald-300">Growth Package: $1,800/mo</p>
                    <p className="text-xs text-[#fafaf9]/40">SEO + Social + AI Receptionist</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs text-[#fafaf9]/40">
                    <strong className="text-[#fafaf9]/60">Best for:</strong> Upselling existing clients, 
                    creating premium tiers, reducing price sensitivity.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
                <h3 className="font-semibold mb-4">Option B: Standalone Service</h3>
                <p className="text-sm text-[#fafaf9]/50 mb-4">
                  Offer AI receptionist as a separate line item or to non-marketing clients.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-white/[0.03]">
                    <p className="text-[#fafaf9]/70">Marketing Services: $1,500/mo</p>
                    <p className="text-xs text-[#fafaf9]/40">Your existing package</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20">
                    <p className="text-emerald-300">AI Receptionist Add-On: $199/mo</p>
                    <p className="text-xs text-[#fafaf9]/40">Billed separately</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs text-[#fafaf9]/40">
                    <strong className="text-[#fafaf9]/60">Best for:</strong> Clients who only want AI, 
                    referrals outside your marketing niche, clear revenue attribution.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[#fafaf9]/70">
                <strong className="text-[#fafaf9]">Pro tip:</strong> Start with Option B (standalone) to test adoption. 
                Once you have 5-10 clients on AI receptionist, you'll understand the value prop well enough 
                to confidently bundle it into premium packages.
              </p>
            </div>
          </div>

          {/* Pitch Script for Marketing Agencies */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Phone className="h-5 w-5 text-emerald-400" />
              </span>
              The Marketing Agency Pitch Script
            </h2>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <p className="text-xs font-medium text-[#fafaf9]/40 uppercase mb-4">For Your Monthly Client Calls</p>
              <div className="text-sm text-[#fafaf9]/70 font-mono leading-relaxed space-y-4">
                <p>"[Name], I wanted to show you something we're rolling out that I think could really amplify the results we're getting you.</p>
                
                <p>Looking at your campaigns, we're driving [X] calls per month. But here's what I've noticed—about [30%] of those are going to voicemail, especially after 5pm and on weekends.</p>
                
                <p>That's leads we're paying for that aren't converting.</p>
                
                <p>We now offer an AI receptionist that answers every single call, 24/7. It sounds natural, can answer questions about your services, captures their info, and can even book appointments on your calendar.</p>
                
                <p>The result? Every lead we generate actually gets a shot at converting.</p>
                
                <p>It's $199/month on top of what you're paying now. Want me to set up a demo number so you can call and test it yourself?"</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-10">
            Questions from Marketing Agencies
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'How do I prove AI receptionist is working to my clients?',
                a: 'You get a dashboard showing every call: when it came in, what the AI said, caller info captured, and outcomes. Run a comparison—show them the "before" (missed calls, voicemails) vs "after" (captured leads, booked appointments). It\'s concrete, measurable proof.',
              },
              {
                q: 'What if the AI says something wrong about my client\'s business?',
                a: 'You customize the AI\'s knowledge base for each client. It learns their services, pricing, hours, and FAQs. You control exactly what it knows and says. Test calls before going live ensure quality.',
              },
              {
                q: 'Do I need to provide support for this?',
                a: 'Minimal support. The platform handles the AI and technical infrastructure. Most client questions are simple ("how do I listen to a call recording?") and the dashboard is intuitive. Plan for maybe 30 minutes/month per client.',
              },
              {
                q: 'Can I white-label this so clients don\'t know where it comes from?',
                a: 'Yes—that\'s the point. Your brand is on everything: the dashboard clients log into, the emails they receive, the invoices. They see "[Your Agency] AI Receptionist," not VoiceAI Connect.',
              },
              {
                q: 'What if a client already uses an answering service?',
                a: 'Great angle: AI is 80% cheaper than human answering services and available 24/7 with no wait times. Position it as an upgrade, not a replacement. Many clients use both—AI for routine calls, humans for complex situations.',
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
                Complete your marketing funnel
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  with AI-powered call capture
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#fafaf9]/50">
                Start your free trial and offer AI receptionist to your clients this week.
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
                title: 'Adding AI Voice to Your Agency Stack',
                description: 'General guide for all agency types.',
                href: '/add-ai-voice-to-agency',
              },
              {
                title: 'AI Receptionist Agency Pricing Models',
                description: 'How to structure and set your pricing.',
                href: '/ai-receptionist-agency-pricing',
              },
              {
                title: 'White-Label AI for GoHighLevel',
                description: 'For agencies using GHL.',
                href: '/gohighlevel-ai-receptionist',
              },
              {
                title: 'Platform Features & Pricing',
                description: 'See what VoiceAI Connect offers.',
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