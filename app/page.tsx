'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, ArrowRight, Check, Play, Star, Zap, Shield, Clock, Users, 
  DollarSign, ChevronRight, MessageSquare, FileText, Mic, Globe, 
  Smartphone, BarChart3, Calendar, Bell, Headphones, Code, Mail,
  Building2, Sparkles, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

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
                  {/* Replace with actual logo */}
                  <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {['Features', 'How It Works', 'Pricing', 'FAQ'].map((item) => (
                <Link 
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors rounded-lg hover:bg-white/[0.03]"
                >
                  {item}
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
            {['Features', 'How It Works', 'Pricing', 'FAQ'].map((item) => (
              <Link 
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-[#fafaf9]/70 hover:text-[#fafaf9] hover:bg-white/[0.03] rounded-lg transition-colors"
              >
                {item}
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
              <span className="text-emerald-300/90">Now serving 12,000+ businesses worldwide</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
              <span className="block">Launch Your Own</span>
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                AI Voice Agency
              </span>
            </h1>
            
            <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-[#fafaf9]/60 max-w-2xl mx-auto leading-relaxed px-4">
              The complete white-label platform to resell AI receptionists under your brand. 
              We build the technology. You keep 100% of what you charge.
            </p>

            {/* Value props row */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-sm text-[#fafaf9]/50">
              {[
                'Zero code required',
                'Your brand everywhere', 
                'Keep 100% revenue'
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup" 
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 sm:px-8 py-4 text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
              >
                <span>Start Your 14-Day Free Trial</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-6 sm:px-8 py-4 text-base font-medium text-[#fafaf9] transition-all hover:bg-white/[0.06] hover:border-white/20">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </span>
                <span>Watch Demo</span>
              </button>
            </div>

            <p className="mt-5 sm:mt-6 text-sm text-[#fafaf9]/40">
              No credit card required · Setup in under 5 minutes
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 sm:mt-20 lg:mt-24 relative">
            {/* Glow behind dashboard */}
            <div className="absolute -inset-x-20 -top-20 h-[400px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-2xl pointer-events-none" />
            
            <div className="relative">
              {/* Browser chrome */}
              <div className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden shadow-2xl shadow-black/50">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 bg-[#0a0a0a]">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-white/10 hover:bg-red-500/50 transition-colors" />
                    <div className="h-3 w-3 rounded-full bg-white/10 hover:bg-yellow-500/50 transition-colors" />
                    <div className="h-3 w-3 rounded-full bg-white/10 hover:bg-green-500/50 transition-colors" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-[#fafaf9]/40 font-mono">
                      app.youragency.com
                    </div>
                  </div>
                  <div className="w-[52px]" /> {/* Spacer for symmetry */}
                </div>
                
                {/* Dashboard mockup */}
                <div className="aspect-[16/9] sm:aspect-[16/8] bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] p-4 sm:p-8">
                  <div className="h-full rounded-xl border border-white/[0.06] bg-[#080808] overflow-hidden">
                    {/* Sidebar */}
                    <div className="flex h-full">
                      <div className="hidden sm:block w-48 lg:w-56 border-r border-white/[0.06] bg-[#070707] p-4">
                        <div className="flex items-center gap-2 mb-8">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500" />
                          <span className="text-sm font-medium text-[#fafaf9]/80">Your Agency</span>
                        </div>
                        <div className="space-y-1">
                          {['Dashboard', 'Clients', 'Analytics', 'Settings'].map((item, i) => (
                            <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${i === 0 ? 'bg-white/[0.06] text-[#fafaf9]' : 'text-[#fafaf9]/40'}`}>
                              <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-emerald-400' : 'bg-white/20'}`} />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Main content */}
                      <div className="flex-1 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <p className="text-[#fafaf9]/40 text-xs sm:text-sm">Welcome back</p>
                            <p className="text-lg sm:text-xl font-medium">Agency Dashboard</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="hidden sm:block px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                              23 Active Clients
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          {[
                            { label: 'Monthly Revenue', value: '$4,312', change: '+12%' },
                            { label: 'Total Clients', value: '23', change: '+3' },
                            { label: 'Calls This Month', value: '1,847', change: '+23%' },
                            { label: 'Avg. Call Duration', value: '2:34', change: '' },
                          ].map((stat) => (
                            <div key={stat.label} className="p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                              <p className="text-[#fafaf9]/40 text-xs mb-1">{stat.label}</p>
                              <div className="flex items-end gap-2">
                                <p className="text-lg sm:text-xl font-semibold">{stat.value}</p>
                                {stat.change && (
                                  <span className="text-emerald-400 text-xs mb-0.5">{stat.change}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm shadow-xl">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[#fafaf9]/70">Your clients see <span className="text-[#fafaf9]">your brand</span>, not ours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-white/[0.06] bg-white/[0.01] py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="grid grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
              {[
                { value: '$2.4M+', label: 'Revenue for partners' },
                { value: '847', label: 'Active agencies' },
                { value: '12,400+', label: 'Businesses served' },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-2xl sm:text-3xl font-semibold tracking-tight">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-[#fafaf9]/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-sm text-[#fafaf9]/60">4.9/5 from 200+ reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* What Your Clients Get - Feature Showcase */}
      <section id="features" className="py-20 sm:py-24 lg:py-32">
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
        </div>
      </section>

      {/* Agency Features - What You Get */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300/90">Agency Tools</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                Everything you need
                <span className="block text-[#fafaf9]/40">to run your agency</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 leading-relaxed">
                Beyond just reselling — get a complete business platform. 
                Marketing site, client management, payments, and support. All white-labeled.
              </p>
              
              <div className="mt-8 sm:mt-10 space-y-4">
                {[
                  {
                    title: 'Branded Marketing Site',
                    description: 'Professional plan includes a complete marketing website with demo phone number and sample calls. Starter plan gets an embeddable signup widget.',
                    badge: 'Pro+',
                  },
                  {
                    title: 'Custom Domain',
                    description: 'Use your own domain (youragency.com) for your marketing site and client dashboards.',
                    badge: 'Pro+',
                  },
                  {
                    title: 'Stripe Connect Payments',
                    description: 'Clients pay you directly. Set your own prices — $99, $149, $299. Keep everything.',
                    badge: null,
                  },
                  {
                    title: 'Client Management CRM',
                    description: 'View all clients, their usage, subscription status, and revenue in one dashboard.',
                    badge: null,
                  },
                  {
                    title: 'Revenue Analytics',
                    description: 'Track MRR, churn, growth, and client lifetime value. Know your numbers.',
                    badge: null,
                  },
                  {
                    title: 'White-Label Emails',
                    description: 'Welcome emails, notifications, and invoices come from your domain.',
                    badge: 'Scale',
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{feature.title}</h4>
                        {feature.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-medium text-[#fafaf9]/60">
                            {feature.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#fafaf9]/50">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-white/[0.06]">
                  <p className="text-[#fafaf9]/40 text-sm mb-2">Your Marketing Site</p>
                  <p className="text-xl sm:text-2xl font-semibold">smartcallsolutions.com</p>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-lg font-bold">SC</span>
                    </div>
                    <div>
                      <p className="font-medium">SmartCall Solutions</p>
                      <p className="text-sm text-[#fafaf9]/40">AI-Powered Answering Service</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="h-3 w-full rounded-full bg-white/[0.06]" />
                    <div className="h-3 w-4/5 rounded-full bg-white/[0.06]" />
                    <div className="h-3 w-3/5 rounded-full bg-white/[0.06]" />
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-sm text-[#fafaf9]/60 mb-3">🎧 Try our demo line:</p>
                    <p className="text-lg font-mono font-medium text-emerald-400">(555) 123-DEMO</p>
                  </div>
                  
                  <button className="w-full py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium">
                    Get Started — $99/mo
                  </button>
                </div>
              </div>
              
              {/* Badge */}
              <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 px-3 sm:px-4 py-2 rounded-xl bg-emerald-500 text-[#050505] text-xs sm:text-sm font-medium shadow-lg shadow-emerald-500/30">
                Fully white-labeled ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 sm:p-8">
                  <p className="text-sm text-[#fafaf9]/40 uppercase tracking-wider mb-6">Revenue Calculator</p>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-baseline border-b border-white/[0.06] pb-4">
                      <span className="text-[#fafaf9]/60">10 clients × $149/mo</span>
                      <span className="text-2xl font-semibold">$1,490</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-white/[0.06] pb-4">
                      <span className="text-[#fafaf9]/60">Your platform cost</span>
                      <span className="text-2xl font-semibold text-[#fafaf9]/40">−$299</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2">
                      <span className="text-[#fafaf9]/80 font-medium">Monthly profit</span>
                      <span className="text-3xl sm:text-4xl font-semibold text-emerald-400">$1,191</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                    <p className="text-sm text-emerald-300/80">
                      <strong className="text-emerald-300">Scale to 50 clients?</strong> That's $7,251/mo profit. 
                      Same $299 platform fee. Unlimited upside.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
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
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300/90">Simple Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Launch in under 24 hours
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              No technical skills required. If you can use social media, you can run an AI agency.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up',
                description: 'Create your agency account in 2 minutes. No credit card needed for trial.',
                time: '2 min',
              },
              {
                step: '02',
                title: 'Brand It',
                description: 'Upload logo, pick colors, set your prices. Configure your marketing site.',
                time: '10 min',
              },
              {
                step: '03',
                title: 'Connect Payments',
                description: 'Link Stripe to receive payments directly. No revenue share, ever.',
                time: '5 min',
              },
              {
                step: '04',
                title: 'Start Selling',
                description: 'Share your link. When clients sign up, their AI is live in 60 seconds.',
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
                  price: 199,
                  description: 'For new agencies testing the waters',
                  features: [
                    'Up to 25 clients',
                    'Embeddable signup widget',
                    'White-label client dashboard',
                    'Your branding & colors',
                    'Stripe Connect payments',
                    'Email support',
                  ],
                  limitations: [
                    'No marketing site',
                    'Subdomain only',
                  ],
                  highlighted: false,
                  cta: 'Start Free Trial',
                },
                {
                  name: 'Professional',
                  price: 299,
                  description: 'Most popular for serious agencies',
                  features: [
                    'Up to 100 clients',
                    'Full marketing website',
                    'Demo phone number',
                    'Sample call recordings',
                    'Custom domain support',
                    'Priority support',
                    'Advanced analytics',
                    'API access',
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
                    'Everything in Professional',
                    'White-label emails',
                    'Dedicated success manager',
                    'Custom integrations',
                    'SLA guarantee',
                    'Phone support',
                    'Early feature access',
                  ],
                  limitations: [],
                  highlighted: false,
                  cta: 'Contact Sales',
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
                    href={tier.name === 'Scale' ? '/contact' : '/signup'}
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
              All plans include 14-day free trial. No credit card required to start.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonial */}
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
            tech headaches.&rdquo;
          </blockquote>
          <div className="mt-6 sm:mt-8">
            <p className="font-semibold text-lg">Jonathan Rowe</p>
            <p className="text-sm text-[#fafaf9]/50 mt-1">Founder, CallBird AI</p>
            <p className="text-sm text-emerald-400 mt-1">First client in 11 days • Profitable from month 1</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Do I need any technical skills?',
                a: 'Absolutely not. If you can use Canva or social media, you can run this business. Upload your logo, pick colors, set prices, share your link. That\'s the entire technical requirement.',
              },
              {
                q: 'What\'s the difference between Starter and Professional?',
                a: 'Starter gives you an embeddable widget to add to your existing website. Professional includes a complete marketing website with a demo phone number potential clients can call to experience the AI. Most agencies upgrade to Professional within their trial.',
              },
              {
                q: 'How do I get clients?',
                a: 'We provide sales scripts, email templates, and training. Most successful partners use cold outreach to local businesses (plumbers, dentists, lawyers), Facebook ads targeting business owners, or YouTube content about AI solutions.',
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
              {
                q: 'What happens when my clients\' customers call?',
                a: 'The AI answers in 500ms, has a natural conversation, captures caller info, can answer questions from the business\'s knowledge base, and can even book appointments. After the call, your client gets an SMS summary and the full recording appears in their dashboard.',
              },
              {
                q: 'What if I need help?',
                a: 'Starter includes email support. Professional adds priority support. Scale includes a dedicated success manager and phone support. We\'re invested in your success.',
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
                Ready to launch your
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  AI voice agency?
                </span>
              </h2>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-[#fafaf9]/50">
                Join 847 agencies already building recurring revenue with VoiceAI Connect.
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
                  href="/demo" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-[#fafaf9]/70 hover:text-[#fafaf9] transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Call Our Demo Line
                </Link>
              </div>
              
              <p className="mt-5 sm:mt-6 text-sm text-[#fafaf9]/40">
                14-day free trial · No credit card required · Cancel anytime
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
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
              <Link href="/blog" className="hover:text-[#fafaf9] transition-colors">Blog</Link>
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