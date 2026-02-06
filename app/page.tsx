'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, ArrowRight, Check, Play, Star, Zap, Shield, Clock, Users, 
  DollarSign, ChevronRight, MessageSquare, FileText, Mic, Globe, 
  Smartphone, BarChart3, Calendar, Bell, Headphones, Code, Mail,
  Building2, Sparkles, Menu, X, Target
} from 'lucide-react';
import { useState, useEffect } from 'react';
import DashboardSandbox from '@/components/dashboard-sandbox';

export default function LandingPage() {
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
            {/* Logo */}
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

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {[
                { name: 'Platform', href: '/platform' },
                { name: 'How It Works', href: '/how-it-works' },
                { name: 'Pricing', href: '#pricing' },
                { name: 'Blog', href: '/blog' },
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

            {/* Desktop CTA */}
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

            {/* Mobile menu button */}
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
              { name: 'Pricing', href: '#pricing' },
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
      <section className="relative pt-28 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 lg:pb-32">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/[0.07] via-amber-500/[0.03] to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6 sm:mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-emerald-300/90">White-label AI receptionist platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
              <span className="block">Sell AI Receptionists</span>
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                To Local Businesses
              </span>
            </h1>
            
            <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-[#fafaf9]/60 max-w-2xl mx-auto leading-relaxed px-4">
              The white-label platform that lets you start an AI receptionist agency. 
              We handle the tech and fulfillment. You sell and keep 100% of what you charge.
            </p>

            {/* Value props row */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-sm text-[#fafaf9]/50">
              {[
                'Run from your phone',
                'Zero fulfillment work', 
                'Keep 100% revenue'
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>

            {/* CTA buttons - Mobile optimized */}
            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link 
                href="/signup" 
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 rounded-full bg-white px-5 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
              >
                <span>Start Your 14-Day Free Trial</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button 
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium text-[#fafaf9] transition-all hover:bg-white/[0.06] hover:border-white/20"
              >
                <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                  <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current ml-0.5" />
                </span>
                <span>Watch Demo</span>
              </button>
            </div>

            <p className="mt-5 sm:mt-6 text-sm text-[#fafaf9]/40">
              Setup in under 5 minutes · Cancel anytime
            </p>
          </div>

          {/* Interactive Dashboard Demo */}
          <div id="demo" className="mt-16 sm:mt-20 lg:mt-24 relative scroll-mt-24">
            {/* Glow behind dashboard */}
            <div className="absolute -inset-x-20 -top-20 h-[400px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-2xl pointer-events-none" />
            
            <div className="relative">
              <DashboardSandbox />
              
              {/* Floating badge */}
              <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm shadow-xl">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[#fafaf9]/70">Your clients see <span className="text-[#fafaf9]">your brand</span>, not ours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">How It Works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              You sell. We handle everything else.
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              When a client signs up, the platform automatically configures their AI, 
              provisions their phone number, and handles ongoing support. Your only job is finding clients.
            </p>
          </div>

          {/* Three column - what happens */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Client Signs Up',
                description: 'They click your link and subscribe. The platform automatically configures their AI receptionist, provisions a phone number, and imports their business info—all in 60 seconds.',
                icon: Users,
              },
              {
                step: '02',
                title: 'AI Answers Calls',
                description: 'Their new AI receptionist starts taking calls immediately. It answers questions, books appointments, captures leads, and sends summaries—24/7, no setup needed.',
                icon: Phone,
              },
              {
                step: '03',
                title: 'You Get Paid',
                description: 'Payments go directly to your Stripe. You keep 100% of what you charge. The platform handles client support, so you can focus on growing.',
                icon: DollarSign,
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 overflow-hidden">
                <div className="text-6xl font-bold text-white/[0.03] absolute -top-2 -left-1 select-none">
                  {item.step}
                </div>
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 mb-4">
                    <item.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom callout */}
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] text-center">
              <p className="text-lg font-medium">
                <span className="text-emerald-400">Zero fulfillment.</span> No tech work. No client support tickets.
              </p>
              <p className="mt-2 text-[#fafaf9]/50">
                The platform handles setup, maintenance, and support. You focus on sales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Phone-Only Section */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
                <Smartphone className="h-4 w-4 text-amber-400" />
                <span className="text-amber-300/90">Phone-First Platform</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                Manage everything
                <span className="block text-[#fafaf9]/40">from your phone.</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 leading-relaxed">
                VoiceAI Connect is built phone-first. Check on clients, track revenue, 
                and manage your entire agency from anywhere. No laptop required.
              </p>
              
              <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-3">
                {[
                  'Complete dashboard access',
                  'Real-time push notifications',
                  'Client onboarding flow',
                  'Revenue & analytics tracking',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="text-sm text-[#fafaf9]/70">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link 
                href="/platform"
                className="inline-flex items-center gap-2 mt-6 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                Explore the full platform
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            {/* Phone mockup */}
            <div className="relative flex justify-center">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative w-72 sm:w-80">
                {/* Phone frame */}
                <div className="rounded-[3rem] border-4 border-white/10 bg-[#0a0a0a] p-3 shadow-2xl">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#0a0a0a] rounded-b-2xl z-10" />
                  
                  {/* Screen */}
                  <div className="rounded-[2.5rem] bg-[#080808] overflow-hidden">
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 py-2 text-xs">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-2 border border-white/40 rounded-sm">
                          <div className="w-3/4 h-full bg-emerald-400 rounded-sm" />
                        </div>
                      </div>
                    </div>
                    
                    {/* App content */}
                    <div className="px-5 pb-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500" />
                        <div>
                          <p className="text-sm font-medium">Your Agency</p>
                          <p className="text-xs text-[#fafaf9]/40">Dashboard</p>
                        </div>
                      </div>
                      
                      {/* Revenue card */}
                      <div className="p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 mb-4">
                        <p className="text-xs text-emerald-400/70">This Month</p>
                        <p className="text-3xl font-semibold mt-1">$6,903</p>
                        <p className="text-xs text-emerald-400 mt-1">↑ 18% from last month</p>
                      </div>
                      
                      {/* Quick stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <p className="text-xs text-[#fafaf9]/40">Clients</p>
                          <p className="text-lg font-semibold">47</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <p className="text-xs text-[#fafaf9]/40">Calls Today</p>
                          <p className="text-lg font-semibold">127</p>
                        </div>
                      </div>
                      
                      {/* Recent activity */}
                      <div className="space-y-2">
                        <p className="text-xs text-[#fafaf9]/40">Recent</p>
                        {[
                          { name: 'Smith Plumbing', action: 'signed up', time: '2m ago' },
                          { name: 'Ace HVAC', action: 'payment received', time: '1h ago' },
                        ].map((item) => (
                          <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-[#fafaf9]/40">{item.action}</p>
                            </div>
                            <span className="text-xs text-[#fafaf9]/30">{item.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Badge */}
                <div className="absolute -bottom-4 -right-4 px-4 py-2 rounded-xl bg-amber-500 text-[#050505] text-sm font-medium shadow-lg shadow-amber-500/30">
                  <Smartphone className="h-4 w-4 inline mr-1.5" />
                  Phone-native ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Your Clients Get - Feature Showcase */}
      <section id="features" className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300/90">What You Sell</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              A complete AI receptionist
              <span className="block mt-1 sm:mt-2 text-[#fafaf9]/40">your clients will love</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Every feature businesses need to never miss a call again. 
              All branded as your product.
            </p>
          </div>

          {/* Main features grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Smartphone,
                title: 'Mobile & Web App',
                description: 'Your clients get a beautiful dashboard to view calls, transcripts, and analytics from any device.',
                highlight: true,
              },
              {
                icon: Mic,
                title: 'Call Recordings',
                description: 'Every call is recorded and stored. Clients can replay conversations anytime in their dashboard.',
                highlight: true,
              },
              {
                icon: MessageSquare,
                title: 'SMS Summaries',
                description: 'Instant text notifications after each call with caller info, reason, and urgency level.',
                highlight: true,
              },
              {
                icon: FileText,
                title: 'Full Transcripts',
                description: 'Complete word-for-word transcripts of every conversation, searchable and exportable.',
                highlight: false,
              },
              {
                icon: Sparkles,
                title: 'AI Call Summaries',
                description: 'Intelligent summaries that extract key details: name, contact, service needed, and urgency.',
                highlight: false,
              },
              {
                icon: Globe,
                title: 'Knowledge Base',
                description: 'AI learns from their website to answer questions about services, hours, and pricing.',
                highlight: false,
              },
              {
                icon: Phone,
                title: 'Dedicated Phone Number',
                description: 'Each client gets their own local or toll-free number that forwards to the AI.',
                highlight: false,
              },
              {
                icon: Clock,
                title: '24/7 AI Coverage',
                description: 'Never miss a call. The AI answers instantly, day or night, weekends and holidays.',
                highlight: false,
              },
              {
                icon: Calendar,
                title: 'Appointment Booking',
                description: 'AI can check availability and book appointments directly into their calendar.',
                highlight: false,
              },
              {
                icon: Bell,
                title: 'Real-time Notifications',
                description: 'Push notifications, email alerts, and SMS updates for every important call.',
                highlight: false,
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                description: 'Call volume trends, peak hours, common requests, and conversion insights.',
                highlight: false,
              },
              {
                icon: Headphones,
                title: 'Natural Conversations',
                description: 'State-of-the-art voice AI that sounds human and handles complex inquiries.',
                highlight: false,
              },
            ].map((feature) => (
              <div 
                key={feature.title} 
                className={`group relative rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
                  feature.highlight 
                    ? 'border-emerald-500/20 bg-emerald-500/[0.03] hover:border-emerald-500/40 hover:bg-emerald-500/[0.06]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl mb-4 transition-colors ${
                  feature.highlight 
                    ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
                    : 'bg-white/[0.04] group-hover:bg-white/[0.08]'
                }`}>
                  <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    feature.highlight ? 'text-emerald-400' : 'text-[#fafaf9]/60'
                  }`} />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <Link 
              href="/platform"
              className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all 40+ features
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* White-Label Marketing Site Section */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
                <Globe className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300/90">Professional Plan Feature</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                Your own marketing site.
                <span className="block text-[#fafaf9]/40">With an AI demo that sells.</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 leading-relaxed">
                Professional and Scale plans include a complete white-label marketing website—your logo, 
                your colors, your domain. But the real magic? The interactive AI demo line.
              </p>
              
              <div className="mt-8 sm:mt-10 space-y-6">
                <div className="p-5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                      <Phone className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-300 mb-2">The Role-Playing AI Demo</h4>
                      <p className="text-sm text-[#fafaf9]/60 leading-relaxed">
                        When prospects call your demo line, the AI asks about their business—name, hours, 
                        common questions. Then it <span className="text-[#fafaf9]/80">transforms into their receptionist</span> right 
                        on the call. They can test it, ask questions, and experience exactly what their 
                        callers will hear. It sells itself.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Sparkles, text: 'Your logo & colors everywhere' },
                    { icon: Globe, text: 'Custom domain (youragency.com)' },
                    { icon: Phone, text: 'Interactive demo phone number' },
                    { icon: Mic, text: 'Sample call recordings' },
                    { icon: Code, text: 'Editable from your dashboard' },
                    { icon: Smartphone, text: 'Mobile-optimized design' },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                      <item.icon className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-sm text-[#fafaf9]/70">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Link 
                href="/platform"
                className="inline-flex items-center gap-2 mt-6 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Learn more about the marketing site
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            {/* Marketing site mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden shadow-2xl">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 bg-[#080808]">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-lg bg-white/[0.03] text-xs text-[#fafaf9]/40 font-mono">
                      smartcallsolutions.com
                    </div>
                  </div>
                </div>
                
                {/* Site content */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-bold">SC</span>
                      </div>
                      <span className="font-semibold">SmartCall Solutions</span>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-medium">
                      Get Started
                    </div>
                  </div>
                  
                  {/* Hero */}
                  <div className="pt-4">
                    <h3 className="text-xl sm:text-2xl font-semibold mb-2">Never Miss Another Call</h3>
                    <p className="text-sm text-[#fafaf9]/50">AI-powered receptionist for your business</p>
                  </div>
                  
                  {/* Demo CTA */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                        <Phone className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-blue-300">Try Our AI Demo</span>
                    </div>
                    <p className="text-lg font-mono font-semibold text-[#fafaf9] mb-2">(555) 123-DEMO</p>
                    <p className="text-xs text-[#fafaf9]/50">
                      Call now—tell the AI about your business and watch it become your receptionist
                    </p>
                  </div>
                  
                  {/* Features preview */}
                  <div className="grid grid-cols-3 gap-3">
                    {['24/7 Coverage', 'Call Recording', 'SMS Alerts'].map((feature) => (
                      <div key={feature} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                        <span className="text-xs text-[#fafaf9]/60">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Badge */}
              <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 px-3 sm:px-4 py-2 rounded-xl bg-emerald-500 text-[#050505] text-xs sm:text-sm font-medium shadow-lg shadow-emerald-500/30">
                100% your brand ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built-in Leads CRM Section */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* CRM Mockup */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-emerald-500/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden shadow-2xl">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 bg-[#080808]">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-lg bg-white/[0.03] text-xs text-[#fafaf9]/40 font-mono">
                      app.youragency.com/leads
                    </div>
                  </div>
                </div>
                
                {/* Template Preview */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-sm">Email Composer</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Variables auto-fill</span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[#fafaf9]/40 text-xs mb-1">Subject</p>
                      <p className="text-[#fafaf9]/80">Quick question about <span className="text-emerald-400 font-mono text-xs bg-emerald-500/10 px-1 rounded">{'{lead_business_name}'}</span></p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[#fafaf9]/40 text-xs mb-2">Body</p>
                      <p className="text-[#fafaf9]/60 text-xs leading-relaxed">
                        Hi <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1 rounded">{'{lead_contact_first_name}'}</span>,<br /><br />
                        I came across <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1 rounded">{'{lead_business_name}'}</span> while researching <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1 rounded">{'{lead_industry}'}</span> businesses...<br /><br />
                        Best,<br />
                        <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1 rounded">{'{agency_owner_name}'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 py-2 rounded-lg bg-emerald-500 text-[#050505] text-xs font-medium">Copy & Log as Sent</button>
                    <button className="px-4 py-2 rounded-lg border border-white/10 text-xs text-[#fafaf9]/60">Edit</button>
                  </div>
                </div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -bottom-3 -right-3 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-500/30">
                <Target className="h-4 w-4 inline mr-1.5" />
                Find clients faster
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
                <Target className="h-4 w-4 text-blue-400" />
                <span className="text-blue-300/90">All Plans</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                Built-in leads CRM.
                <span className="block text-[#fafaf9]/40">Find and close more clients.</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 leading-relaxed">
                Track prospects, send personalized outreach with pre-built templates, and follow up until they convert. 
                Everything you need to grow your agency—included on all plans.
              </p>
              
              <div className="mt-8 space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                      <FileText className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">13+ Pre-built Templates</h4>
                      <p className="text-xs text-[#fafaf9]/50">Email sequences, follow-ups, SMS intros—all written and ready to send.</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                      <Zap className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Smart Variable System</h4>
                      <p className="text-xs text-[#fafaf9]/50"><code className="text-emerald-400">{'{lead_business_name}'}</code>, <code className="text-emerald-400">{'{agency_name}'}</code>—auto-fills from your lead data.</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <Clock className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Activity Timeline</h4>
                      <p className="text-xs text-[#fafaf9]/50">Every email, note, and status change logged. Never lose context on a lead.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link 
                href="/features/leads-crm"
                className="inline-flex items-center gap-2 mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Learn more about the leads CRM
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300/90">The Opportunity</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                Local businesses need this.
                <span className="block text-[#fafaf9]/40">They just don&apos;t know it yet.</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 leading-relaxed">
                Every plumber, dentist, and contractor misses calls. A single missed call can cost them $500+. 
                They need 24/7 coverage but can&apos;t afford a receptionist.
              </p>
              <p className="mt-4 text-base sm:text-lg text-[#fafaf9]/50 leading-relaxed">
                You sell them the solution. We power it invisibly. They pay you $99-299/month 
                and never miss another opportunity.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { value: '34%', label: 'of calls go unanswered' },
                  { value: '$106B', label: 'lost annually to missed calls' },
                  { value: '85%', label: 'won\'t call back if no answer' },
                  { value: '24/7', label: 'coverage they can\'t afford' },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-xl sm:text-2xl font-semibold text-emerald-400">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-[#fafaf9]/40 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 sm:p-8">
                  <p className="text-sm text-[#fafaf9]/40 uppercase tracking-wider mb-6">Revenue Calculator</p>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-baseline border-b border-white/[0.06] pb-4">
                      <span className="text-[#fafaf9]/60">50 clients × $149/mo</span>
                      <span className="text-2xl font-semibold">$7,450</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-white/[0.06] pb-4">
                      <span className="text-[#fafaf9]/60">Your platform cost</span>
                      <span className="text-2xl font-semibold text-[#fafaf9]/40">−$199</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2">
                      <span className="text-[#fafaf9]/80 font-medium">Monthly profit</span>
                      <span className="text-3xl sm:text-4xl font-semibold text-emerald-400">$7,251</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                    <p className="text-sm text-emerald-300/80">
                      <strong className="text-emerald-300">That&apos;s 97% profit margin.</strong> Same $199 platform fee 
                      whether you have 10 clients or 100. Your revenue scales, your costs don&apos;t.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Launch Steps */}
      <section id="how-it-works" className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300/90">Get Started</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Launch in under 24 hours
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              From signup to your first client—all from your phone.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up',
                description: 'Create your agency account in 2 minutes. Works on your phone.',
                time: '2 min',
              },
              {
                step: '02',
                title: 'Brand It',
                description: 'Upload logo, pick colors, set prices. All from your phone.',
                time: '10 min',
              },
              {
                step: '03',
                title: 'Connect Stripe',
                description: 'Link Stripe to receive payments directly. No revenue share.',
                time: '5 min',
              },
              {
                step: '04',
                title: 'Start Selling',
                description: 'Share your link. Platform handles everything else automatically.',
                time: 'Automated',
              },
            ].map((item, i) => (
              <div key={item.step} className="relative group">
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}
                
                <div className="relative">
                  <div className="text-6xl sm:text-7xl font-bold text-white/[0.02] absolute -top-2 -left-2 select-none group-hover:text-emerald-500/[0.05] transition-colors">
                    {item.step}
                  </div>
                  <div className="relative pt-6 sm:pt-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                        Step {item.step}
                      </span>
                      <span className="text-xs text-[#fafaf9]/30">{item.time}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Simple Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Flat monthly fee.
              <span className="block text-[#fafaf9]/40">Unlimited profit potential.</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#fafaf9]/50">
              No per-client fees. No revenue share. Scale without limits.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                {
                  name: 'Starter',
                  price: 99,
                  description: 'For new agencies testing the waters',
                  features: [
                    'Up to 15 clients',
                    'Embeddable signup widget',
                    'White-label client dashboard',
                    'Phone-native management',
                    'Stripe Connect payments',
                    'Basic analytics',
                    'Email support',
                  ],
                  limitations: [
                    'No marketing site',
                    'Subdomain only',
                    'No API access',
                  ],
                  highlighted: false,
                  cta: 'Start Free Trial',
                },
                {
                  name: 'Professional',
                  price: 199,
                  description: 'Most popular for serious agencies',
                  features: [
                    'Up to 100 clients',
                    'Full marketing website',
                    'Interactive AI demo line',
                    'Sample call recordings',
                    'Custom domain support',
                    'Advanced analytics',
                    'API access & webhooks',
                    'Priority support',
                  ],
                  limitations: [],
                  highlighted: true,
                  cta: 'Start Free Trial',
                },
                {
                  name: 'Scale',
                  price: 499,
                  description: 'For established agencies',
                  features: [
                    'Unlimited clients',
                    'Unlimited calls & minutes',
                    'Everything in Professional',
                    'Dedicated success manager',
                    'Phone support',
                    'SLA guarantee',
                    'Early feature access',
                  ],
                  limitations: [],
                  highlighted: false,
                  cta: 'Start Free Trial',
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl border p-6 sm:p-8 transition-all ${
                    tier.highlighted
                      ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.08] to-transparent scale-[1.02] lg:scale-105'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-[#050505] shadow-lg shadow-emerald-500/30">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <p className="text-sm text-[#fafaf9]/50">{tier.description}</p>
                    <p className="text-2xl font-semibold mt-1">{tier.name}</p>
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-4xl sm:text-5xl font-semibold">${tier.price}</span>
                    <span className="text-[#fafaf9]/50">/month</span>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[#fafaf9]/70">{feature}</span>
                      </li>
                    ))}
                    {tier.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-start gap-3 text-sm">
                        <X className="h-4 w-4 text-[#fafaf9]/20 shrink-0 mt-0.5" />
                        <span className="text-[#fafaf9]/40">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href={tier.name === 'Scale' ? '/signup?plan=enterprise' : '/signup'}
                    className={`block w-full rounded-full py-3.5 text-center text-sm font-medium transition-all ${
                      tier.highlighted
                        ? 'bg-white text-[#050505] hover:bg-[#fafaf9] hover:shadow-lg hover:shadow-white/10'
                        : 'bg-white/[0.06] text-[#fafaf9] hover:bg-white/[0.12] border border-white/[0.08]'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
            
            <p className="text-center mt-8 text-sm text-[#fafaf9]/40">
              All plans include 14-day free trial. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonial - Original */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-1 mb-6 sm:mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 sm:h-6 sm:w-6 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed">
            &ldquo;I didn&apos;t want to spend 6 months building my own AI platform from scratch. 
            VoiceAI Connect let me launch CallBird in a weekend. Signed my first paying client 
            within 11 days—that one client covered my entire monthly cost. Saved so much time 
            and tech headaches.&rdquo;
          </blockquote>
          <div className="mt-6 sm:mt-8">
            <p className="font-semibold text-lg">Jonathan Rowe</p>
            <p className="text-sm text-[#fafaf9]/50 mt-1">Founder, SmartDesk AI</p>
            <p className="text-sm text-emerald-400 mt-1">First client in 11 days • Profitable from month 1</p>
          </div>
        </div>
      </section>

      {/* From the Blog - NEW */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                From the Blog
              </h2>
              <p className="mt-2 text-[#fafaf9]/50">
                Guides and insights for building your AI receptionist agency.
              </p>
            </div>
            <Link 
              href="/blog" 
              className="hidden sm:inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all posts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                slug: 'how-much-do-ai-receptionist-agencies-make',
                title: 'How Much Do AI Receptionist Agencies Make? Real Numbers',
                excerpt: 'Realistic income breakdown: $3,000-$15,000/month within 12 months. See month-by-month progression and profit margins.',
                category: 'Guide',
                readTime: '12 min',
              },
              {
                slug: 'ai-receptionist-agency-vs-smma',
                title: 'AI Receptionist Agency vs SMMA: Which Model Wins?',
                excerpt: '80-96% margins vs 20-40%. Compare time requirements, competition, and which business model suits you.',
                category: 'Guide',
                readTime: '14 min',
              },
              {
                slug: 'how-to-start-ai-receptionist-agency',
                title: 'How to Start an AI Receptionist Agency in 2026',
                excerpt: 'Complete guide from finding your first clients to scaling to $50k/month recurring revenue.',
                category: 'Guide',
                readTime: '12 min',
              },
            ].map((post) => (
              <Link 
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group relative block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    {post.category}
                  </span>
                  <span className="text-xs text-[#fafaf9]/40">{post.readTime}</span>
                </div>
                <h3 className="text-lg font-semibold group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-[#fafaf9]/50 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Read more
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-sm text-emerald-400"
            >
              View all posts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'What is the interactive AI demo line?',
                a: 'Professional and Scale plans include a demo phone number on your marketing site. When prospects call, the AI asks about their business—name, type, hours, common questions—then transforms into their receptionist right on the call. They can test it by asking questions and experience exactly what their callers will hear. It\'s incredibly effective at converting prospects into clients.',
              },
              {
                q: 'Can I really run this from my phone?',
                a: 'Yes. Our dashboard is built phone-first. Sign up clients, track revenue, manage settings—all from your phone. Many of our most successful agencies have never used a laptop to manage their business.',
              },
              {
                q: 'What do I actually have to do?',
                a: 'Find clients and collect payments. That\'s it. When someone signs up through your link, the platform automatically configures their AI, provisions their phone number, and handles all the technical setup. When they have questions or issues, the platform handles support. Your job is sales.',
              },
              {
                q: 'Do I need any technical skills?',
                a: 'None. If you can use Instagram, you can run this business. Upload your logo, pick colors, set prices, share your link. That\'s the entire technical requirement. We handle everything else.',
              },
              {
                q: 'What\'s the difference between Starter and Professional?',
                a: 'Starter ($99/mo) gives you up to 15 clients and an embeddable widget. Professional ($199/mo) includes up to 100 clients, a complete marketing website with a demo phone number, custom domain support, API access, and advanced analytics. Most agencies upgrade to Professional within their trial.',
              },
              {
                q: 'How do I get clients?',
                a: 'We provide sales scripts, email templates, and training. Most successful partners use cold outreach to local businesses (plumbers, dentists, lawyers), Facebook/Instagram ads targeting business owners, or content about AI solutions. All outreach can be done from your phone.',
              },
              {
                q: 'What do my clients actually see?',
                a: 'Only your brand. Your logo, your colors, your domain. The client dashboard, emails, and phone experience all show your branding. VoiceAI Connect is completely invisible to them.',
              },
              {
                q: 'How does payment work?',
                a: 'You connect your own Stripe account. When clients subscribe, money goes directly to you. Set any price you want—$99, $149, $299. We charge you a flat monthly platform fee. No per-client costs, no revenue share.',
              },
              {
                q: 'Can I really charge $99-299/month?',
                a: 'Yes, and many charge more. A single missed call can cost a business $500+. For 24/7 AI coverage at $149/month? That\'s cheaper than one hour of a human receptionist. It sells itself.',
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

      {/* Final CTA */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 blur-3xl" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
                Ready to start your
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  AI receptionist agency?
                </span>
              </h2>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-[#fafaf9]/50">
                Launch your AI receptionist agency in under 24 hours.
              </p>
              
              <div className="mt-8 sm:mt-10">
                <Link 
                  href="/signup" 
                  className="group inline-flex items-center justify-center gap-2 sm:gap-3 rounded-full bg-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
                >
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
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
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                <WaveformIcon className="w-5 h-5" />
              </div>
              <span className="font-semibold">VoiceAI Connect</span>
            </Link>
            
            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-[#fafaf9]/40">
              <Link href="/platform" className="hover:text-[#fafaf9] transition-colors">Platform</Link>
              <Link href="/features" className="hover:text-[#fafaf9] transition-colors">Features</Link>
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
              <Link href="/blog" className="hover:text-[#fafaf9] transition-colors">Blog</Link>
              <Link href="/demo" className="hover:text-[#fafaf9] transition-colors">Book a Demo</Link>
              <a href="mailto:support@voiceaiconnect.com" className="hover:text-[#fafaf9] transition-colors">Contact</a>
            </div>
            
            {/* Copyright */}
            <p className="text-sm text-[#fafaf9]/30">
              © 2026 VoiceAI Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

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