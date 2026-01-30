'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, Play, Zap, Shield, Clock, Users, 
  DollarSign, ChevronRight, MessageSquare, FileText, Mic, Globe, 
  Smartphone, BarChart3, Calendar, Bell, Headphones, Building2, 
  Sparkles, Menu, X, Upload, Palette, CreditCard, Link2, Share2,
  Phone, UserPlus, Settings, CheckCircle2, Rocket, Gift,
  MousePointer, Eye, PhoneCall, Bot, ArrowDown, Timer, Coffee, Palmtree
} from 'lucide-react';
import { useState, useEffect } from 'react';

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

export default function HowItWorksPage() {
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
                { name: 'How It Works', href: '/how-it-works' },
                { name: 'Pricing', href: '/#pricing' },
                { name: 'Blog', href: '/blog' },
              ].map((item) => (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`px-4 py-2 text-sm transition-colors rounded-lg hover:bg-white/[0.03] ${
                    item.href === '/how-it-works' ? 'text-[#fafaf9]' : 'text-[#fafaf9]/60 hover:text-[#fafaf9]'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link 
                href="/agency/login" 
                className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
              >
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
              { name: 'How It Works', href: '/how-it-works' },
              { name: 'Pricing', href: '/#pricing' },
              { name: 'Blog', href: '/blog' },
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
              <Link 
                href="/agency/login" 
                className="px-4 py-3 text-center text-[#fafaf9]/70 hover:text-[#fafaf9] rounded-lg border border-white/10"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-4 py-3 text-center bg-white text-[#050505] font-medium rounded-full"
              >
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
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6 sm:mb-8">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Zero Fulfillment Model</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
              <span className="block">You Sell. We Handle</span>
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                Everything Else.
              </span>
            </h1>
            
            <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-[#fafaf9]/60 max-w-2xl mx-auto leading-relaxed px-4">
              From signup to your first paying client in under 24 hours. 
              No coding, no fulfillment work—just sales and profit.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-sm text-[#fafaf9]/50">
              {[
                'Launch in 24 hours',
                'Run from your phone', 
                'Zero tech skills needed'
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Two Journeys Overview */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Two Simple Journeys
            </h2>
            <p className="mt-4 text-[#fafaf9]/50 max-w-2xl mx-auto">
              Understanding how both you and your clients experience the platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <Link href="#agency-journey" className="group p-6 sm:p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Building2 className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Your Journey</h3>
                  <p className="text-sm text-[#fafaf9]/50">Setup once, earn forever</p>
                </div>
              </div>
              <p className="text-[#fafaf9]/60 mb-4">
                How you set up your white-label agency, customize branding, 
                connect payments, and start finding clients—all from your phone.
              </p>
              <span className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium group-hover:gap-3 transition-all">
                See the process <ArrowDown className="h-4 w-4" />
              </span>
            </Link>
            
            <Link href="#client-journey" className="group p-6 sm:p-8 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                  <Users className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Your Client&apos;s Journey</h3>
                  <p className="text-sm text-[#fafaf9]/50">Fully automated onboarding</p>
                </div>
              </div>
              <p className="text-[#fafaf9]/60 mb-4">
                What your clients experience when they sign up. Spoiler: you do nothing. 
                The platform handles everything automatically.
              </p>
              <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-medium group-hover:gap-3 transition-all">
                See the process <ArrowDown className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Agency Journey */}
      <section id="agency-journey" className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-emerald-500/[0.02] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Your Setup (One Time)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Your journey to launch
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Setup takes 30 minutes. After that, your only job is finding clients. 
              The platform handles literally everything else.
            </p>
          </div>

          {/* Agency Steps */}
          <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-8">
            {[
              {
                step: '01',
                icon: UserPlus,
                title: 'Create Your Account',
                time: '2 minutes',
                description: 'Sign up with your email. Instant access to your phone-native agency dashboard.',
                details: [
                  'Enter your name and email',
                  'Choose your agency name',
                  'Verify your email',
                  'Access dashboard on any device',
                ],
              },
              {
                step: '02',
                icon: Palette,
                title: 'Customize Your Brand',
                time: '10 minutes',
                description: 'Upload your logo, set your colors. Everything your clients see is 100% your brand.',
                details: [
                  'Upload your logo (PNG or SVG)',
                  'Set primary and accent colors',
                  'Preview your branded dashboard',
                  'Customize from your phone',
                ],
              },
              {
                step: '03',
                icon: CreditCard,
                title: 'Connect Payments',
                time: '5 minutes',
                description: 'Link your Stripe account. Set your own prices. Keep 100% of what you charge.',
                details: [
                  'Connect Stripe in one click',
                  'Set prices for each tier',
                  'No revenue share to us',
                  'Get paid directly to your bank',
                ],
              },
              {
                step: '04',
                icon: Rocket,
                title: 'Start Selling',
                time: 'Your only job',
                description: 'Share your signup link. When clients subscribe, everything is automatic. You just collect money.',
                details: [
                  'Get your personalized URL',
                  'Share via any channel',
                  'Clients onboard themselves',
                  'You earn recurring revenue',
                ],
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
                )}
                
                <div className="relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all h-full">
                  <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[#050505] text-sm font-bold">
                    {item.step}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4 pt-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                      <item.icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      {item.time}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-[#fafaf9]/50 mb-4">{item.description}</p>
                  
                  <ul className="space-y-2">
                    {item.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-sm text-[#fafaf9]/60">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Phone-First Management */}
          <div className="mt-16 p-6 sm:p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03]">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1 text-xs mb-4">
                  <Smartphone className="h-3 w-3 text-amber-400" />
                  <span className="text-amber-300/90">Phone-Native</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-4">
                  Manage your entire agency from your phone
                </h3>
                <p className="text-[#fafaf9]/60 mb-6">
                  VoiceAI Connect is built phone-first. Check clients, track revenue, 
                  and manage everything while you&apos;re out living your life.
                </p>
                <div className="space-y-3">
                  {[
                    { time: 'Morning', icon: Coffee, text: 'Check overnight signups from bed' },
                    { time: 'Afternoon', icon: Palmtree, text: 'Close a deal while at the pool' },
                    { time: 'Evening', icon: BarChart3, text: 'Quick revenue check—done for the day' },
                  ].map((item) => (
                    <div key={item.time} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <item.icon className="h-4 w-4 text-amber-400" />
                      <span className="text-sm text-[#fafaf9]/70">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-[#fafaf9]/40">Agency Dashboard</span>
                    <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">Live</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-xs text-[#fafaf9]/40 mb-1">Monthly Revenue</p>
                      <p className="text-xl font-semibold">$4,312</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-xs text-[#fafaf9]/40 mb-1">Active Clients</p>
                      <p className="text-xl font-semibold">23</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-xs text-[#fafaf9]/40 mb-1">Calls This Month</p>
                      <p className="text-xl font-semibold">1,847</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-xs text-[#fafaf9]/40 mb-1">Work This Week</p>
                      <p className="text-xl font-semibold text-emerald-400">~12 hrs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Journey */}
      <section id="client-journey" className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-amber-500/[0.02] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Users className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300/90">Zero Fulfillment</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Your client&apos;s experience
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              When a business signs up through your link, the platform handles everything. 
              Their AI receptionist is live in under 60 seconds. You do nothing.
            </p>
          </div>

          {/* Client Steps */}
          <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-8">
            {[
              {
                step: '01',
                icon: MousePointer,
                title: 'Visit Your Signup Page',
                time: '30 seconds',
                description: 'Client clicks your link and sees your branded signup page with your logo and pricing.',
                details: [
                  'Your branding, not ours',
                  'Clear pricing you set',
                  'Simple signup form',
                  'Secure payment via Stripe',
                ],
                youDo: 'Nothing',
              },
              {
                step: '02',
                icon: Globe,
                title: 'Enter Business Details',
                time: '2 minutes',
                description: 'They enter their business name and website. Our AI automatically learns from their site.',
                details: [
                  'Business name & industry',
                  'Website URL for AI training',
                  'AI scrapes services/hours/FAQs',
                  'Zero manual configuration',
                ],
                youDo: 'Nothing',
              },
              {
                step: '03',
                icon: Phone,
                title: 'Get Their Phone Number',
                time: '10 seconds',
                description: 'A dedicated local or toll-free number is instantly provisioned. Ready for calls immediately.',
                details: [
                  'Instant number provisioning',
                  'Local or toll-free options',
                  'Easy call forwarding setup',
                  'Number porting available',
                ],
                youDo: 'Nothing',
              },
              {
                step: '04',
                icon: Bot,
                title: 'AI Goes Live',
                time: 'Instant',
                description: 'Their AI receptionist is immediately active. Answers calls, takes messages, books appointments 24/7.',
                details: [
                  'Answers in under 500ms',
                  'Knows their business instantly',
                  'SMS summaries after calls',
                  'Full recordings & transcripts',
                ],
                youDo: 'Collect payment',
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
                )}
                
                <div className="relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all h-full">
                  <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-[#050505] text-sm font-bold">
                    {item.step}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4 pt-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                      <item.icon className="h-5 w-5 text-amber-400" />
                    </div>
                    <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                      {item.time}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-[#fafaf9]/50 mb-4">{item.description}</p>
                  
                  <ul className="space-y-2 mb-4">
                    {item.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-sm text-[#fafaf9]/60">
                        <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-3 border-t border-white/[0.06]">
                    <span className="text-xs text-[#fafaf9]/40">What you do: </span>
                    <span className="text-xs font-medium text-emerald-400">{item.youDo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* What Happens on a Call */}
          <div className="mt-16">
            <h3 className="text-xl sm:text-2xl font-semibold mb-8 text-center">
              What happens when someone calls your client
            </h3>
            
            <div className="relative max-w-3xl mx-auto">
              <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-emerald-500/50 to-amber-500/50 sm:-translate-x-px" />
              
              <div className="space-y-8">
                {[
                  { icon: PhoneCall, title: 'Customer calls', description: 'Someone dials your client\'s AI number—maybe a homeowner needing plumbing help at 2am.', time: '0:00', color: 'amber' },
                  { icon: Zap, title: 'AI answers instantly', description: 'Within 500ms, the AI picks up with a warm, professional greeting customized for the business.', time: '0:01', color: 'emerald' },
                  { icon: MessageSquare, title: 'Natural conversation', description: 'The AI gathers information: name, issue, urgency. It can answer FAQs from the knowledge base.', time: '0:30', color: 'emerald' },
                  { icon: Calendar, title: 'Books appointment (if needed)', description: 'If enabled, AI checks real-time calendar availability and schedules the appointment.', time: '1:30', color: 'emerald' },
                  { icon: Bell, title: 'Instant notification', description: 'Your client gets an SMS with caller details, reason, and urgency level—immediately.', time: '2:00', color: 'amber' },
                  { icon: FileText, title: 'Full documentation', description: 'Recording, transcript, and AI summary appear in the dashboard. Nothing is ever lost.', time: '2:01', color: 'amber' },
                ].map((item, i) => (
                  <div key={item.title} className={`relative flex gap-6 sm:gap-8 ${i % 2 === 1 ? 'sm:flex-row-reverse' : ''}`}>
                    <div className={`absolute left-4 sm:left-1/2 w-3 h-3 rounded-full border-2 -translate-x-1/2 ${
                      item.color === 'amber' ? 'bg-amber-500 border-amber-400' : 'bg-emerald-500 border-emerald-400'
                    }`} style={{ top: '1.5rem' }} />
                    
                    <div className={`flex-1 ml-10 sm:ml-0 ${i % 2 === 1 ? 'sm:pr-12 sm:text-right' : 'sm:pl-12'}`}>
                      <div className={`inline-flex items-center gap-2 mb-2 ${i % 2 === 1 ? 'sm:flex-row-reverse' : ''}`}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          item.color === 'amber' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                        }`}>
                          <item.icon className={`h-4 w-4 ${
                            item.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'
                          }`} />
                        </div>
                        <span className={`text-xs font-mono ${
                          item.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>{item.time}</span>
                      </div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
                    </div>
                    
                    <div className="hidden sm:block flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Clients Section */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Your Only Job</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              How do I get clients?
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Since the platform handles everything else, you can focus 100% on sales. 
              Here are the proven strategies our most successful agencies use.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: 'Cold Outreach', description: 'Direct email and LinkedIn messages to local business owners. We provide templates that convert.', stat: '40%', statLabel: 'of agencies start here' },
              { icon: Globe, title: 'Local SEO & Ads', description: 'Target "[industry] answering service" keywords in your area. Low competition, high intent.', stat: '25%', statLabel: 'use paid ads' },
              { icon: Users, title: 'Referrals', description: 'Happy clients refer other business owners. Offer a discount for referrals to accelerate growth.', stat: '3.2x', statLabel: 'avg. referral rate' },
              { icon: Share2, title: 'Social Media', description: 'Short videos showing AI in action get massive engagement. TikTok and Instagram Reels work great.', stat: '500K+', statLabel: 'views on top posts' },
              { icon: Building2, title: 'Industry Events', description: 'Local business meetups, trade shows, and chamber of commerce events are goldmines.', stat: '5-10', statLabel: 'leads per event' },
              { icon: Gift, title: 'Free Trials', description: 'Let prospects try the AI for a week. Once they see missed calls drop to zero, they convert.', stat: '68%', statLabel: 'trial conversion' },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                    <item.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-emerald-400">{item.stat}</p>
                    <p className="text-xs text-[#fafaf9]/40">{item.statLabel}</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 sm:py-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Your first month timeline
            </h2>
            <p className="mt-4 text-[#fafaf9]/50">
              What a realistic path to profitability looks like
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {[
                { day: 'Day 1', title: 'Sign up & setup', description: 'Create account, brand your dashboard, connect Stripe (30 min total)' },
                { day: 'Day 2-3', title: 'Learn the platform', description: 'Explore features, test the AI, prepare your pitch' },
                { day: 'Day 4-7', title: 'Start outreach', description: 'Send 50-100 cold emails to local businesses' },
                { day: 'Day 8-14', title: 'First demos', description: 'Schedule calls with interested prospects, show them the AI' },
                { day: 'Day 15-21', title: 'First clients', description: 'Most agencies sign 2-5 clients in the first 3 weeks' },
                { day: 'Day 22-30', title: 'Optimize & grow', description: 'Refine your pitch, ask for referrals, scale what works' },
              ].map((item, i) => (
                <div key={item.day} className="flex gap-6">
                  <div className="w-24 shrink-0 text-right">
                    <span className="text-sm font-medium text-emerald-400">{item.day}</span>
                  </div>
                  <div className="relative flex-1 pb-6">
                    {i < 5 && (
                      <div className="absolute left-0 top-3 bottom-0 w-px bg-white/[0.06]" />
                    )}
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-emerald-500 -translate-x-[3px]" />
                    <div className="pl-6">
                      <h4 className="font-medium mb-1">{item.title}</h4>
                      <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 blur-3xl" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
                Ready to get started?
              </h2>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-[#fafaf9]/50">
                Join 800+ agencies building recurring revenue. 
                Your first client is closer than you think.
              </p>
              
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/signup" 
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
                >
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link 
                  href="/#pricing" 
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium text-[#fafaf9] transition-all hover:bg-white/[0.06] hover:border-white/20"
                >
                  View Pricing
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              
              <p className="mt-5 sm:mt-6 text-sm text-[#fafaf9]/40">
                14-day free trial · Cancel anytime
              </p>
            </div>
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
              <Link href="/how-it-works" className="text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">How It Works</Link>
              <Link href="/blog" className="hover:text-[#fafaf9] transition-colors">Blog</Link>
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
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