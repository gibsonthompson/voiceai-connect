'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, X, ChevronRight, Scale,
  Users, DollarSign, Building2, Code, Briefcase,
  Menu, X as XIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function VsBlandAIPage() {
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
              {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
            <Link href="/comparisons" className="hover:text-[#fafaf9] transition-colors">Comparisons</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#fafaf9]/60">vs Bland AI</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6">
            <Scale className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-300/90">Comparison Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            VoiceAI Connect vs Bland AI:
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              Different Tools, Different Goals
            </span>
          </h1>
          
          {/* Answer-First Summary Box */}
          <div className="mt-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">Bland AI is a developer API for building AI phone agents. VoiceAI Connect is a white-label platform for selling AI receptionist services.</strong> Bland gives you raw infrastructure to build on—you need developers. VoiceAI Connect gives you a complete business-in-a-box—you need clients. If you're a developer building a product, look at Bland. If you're an agency or entrepreneur selling to local businesses, VoiceAI Connect is ready to go.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-[#fafaf9]/50">
            <span>Updated January 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span>7 min read</span>
          </div>
        </div>
      </section>

      {/* Quick Comparison */}
      <section className="py-12 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-center mb-8">At a Glance</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <h3 className="font-semibold text-lg mb-2">Bland AI</h3>
              <p className="text-sm text-[#fafaf9]/50 mb-4">Developer infrastructure for AI phone calls</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Code className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/60">API-first, requires coding</span>
                </li>
                <li className="flex items-start gap-2">
                  <Code className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/60">Build your own application on top</span>
                </li>
                <li className="flex items-start gap-2">
                  <Code className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/60">Per-minute pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Code className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/60">You build the client-facing layer</span>
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05]">
              <h3 className="font-semibold text-lg mb-2 text-emerald-300">VoiceAI Connect</h3>
              <p className="text-sm text-[#fafaf9]/50 mb-4">White-label platform for reselling AI receptionist</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/70">No-code, ready to sell today</span>
                </li>
                <li className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/70">Complete client dashboard included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/70">Flat monthly platform fee</span>
                </li>
                <li className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/70">Client billing & management built-in</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* Who Each Is For */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-400" />
              </span>
              Two Very Different Users
            </h2>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
                <h3 className="font-semibold text-lg mb-4">Bland AI Is For...</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Developers building AI phone products',
                    'Startups creating custom voice applications',
                    'Companies with engineering teams',
                    'Products that need deep API customization',
                    'Teams comfortable with code deployment',
                    'Building proprietary technology',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                      <span className="text-[#fafaf9]/60">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-[#fafaf9]/40 italic">
                  Think: "We have developers and want to build a unique AI phone product."
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05]">
                <h3 className="font-semibold text-lg mb-4 text-emerald-300">VoiceAI Connect Is For...</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Marketing agencies adding AI services',
                    'Entrepreneurs starting AI receptionist businesses',
                    'Consultants expanding their offerings',
                    'Resellers who need turnkey solutions',
                    'Non-technical founders with sales skills',
                    'Building a client service business',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#fafaf9]/70">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-emerald-400/70 italic">
                  Think: "I want to sell AI receptionist services, not build AI technology."
                </p>
              </div>
            </div>
          </div>

          {/* What You Get */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Scale className="h-5 w-5 text-emerald-400" />
              </span>
              What You Actually Get
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-4 pr-4 font-medium text-[#fafaf9]/50">Component</th>
                    <th className="text-center py-4 px-4 font-medium text-[#fafaf9]/50">Bland AI</th>
                    <th className="text-center py-4 pl-4 font-medium text-emerald-400">VoiceAI Connect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {[
                    { component: 'AI phone calling engine', bland: '✓ Core product', voiceai: '✓ Included' },
                    { component: 'Dashboard for your clients', bland: '✗ Build yourself', voiceai: '✓ White-labeled' },
                    { component: 'Client billing system', bland: '✗ Build yourself', voiceai: '✓ Stripe Connect' },
                    { component: 'Multi-tenant architecture', bland: '✗ Build yourself', voiceai: '✓ Included' },
                    { component: 'Client onboarding flow', bland: '✗ Build yourself', voiceai: '✓ No-code setup' },
                    { component: 'Call analytics & reporting', bland: 'Basic API access', voiceai: '✓ Full dashboard' },
                    { component: 'White-label branding', bland: 'Partial (API level)', voiceai: '✓ Complete' },
                    { component: 'Calendar integrations', bland: '✗ Build yourself', voiceai: '✓ Built-in' },
                    { component: 'CRM integrations', bland: '✗ Build yourself', voiceai: '✓ GHL, HubSpot, etc.' },
                    { component: 'Time to first revenue', bland: '2-6 months dev time', voiceai: 'Same week' },
                  ].map((row) => (
                    <tr key={row.component}>
                      <td className="py-4 pr-4 text-[#fafaf9]/70">{row.component}</td>
                      <td className="py-4 px-4 text-center text-[#fafaf9]/50">{row.bland}</td>
                      <td className="py-4 pl-4 text-center text-emerald-400">{row.voiceai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[#fafaf9]/70">
                <strong className="text-[#fafaf9]">The key insight:</strong> Bland gives you an engine. VoiceAI Connect gives you the whole car. 
                If you're a mechanic who wants to build custom vehicles, get the engine. If you want to start a taxi company 
                tomorrow, get the car.
              </p>
            </div>
          </div>

          {/* The Technical Gap */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Code className="h-5 w-5 text-emerald-400" />
              </span>
              The Technical Reality
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Let's be honest about what it takes to turn Bland AI into a sellable product:
            </p>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] mb-6">
              <h3 className="font-semibold text-lg mb-4">Building on Bland AI Requires:</h3>
              <div className="space-y-4">
                {[
                  {
                    item: 'Frontend development',
                    time: '2-4 weeks',
                    description: 'Client dashboard, admin portal, onboarding flows',
                  },
                  {
                    item: 'Backend development',
                    time: '4-8 weeks',
                    description: 'Multi-tenancy, user management, data isolation',
                  },
                  {
                    item: 'Billing integration',
                    time: '1-2 weeks',
                    description: 'Stripe/payment processing, subscription management',
                  },
                  {
                    item: 'Integrations',
                    time: '2-4 weeks',
                    description: 'Calendar, CRM, notification systems',
                  },
                  {
                    item: 'Testing & deployment',
                    time: '2-4 weeks',
                    description: 'QA, security, hosting infrastructure',
                  },
                ].map((task) => (
                  <div key={task.item} className="flex items-start gap-4 pb-4 border-b border-white/[0.06] last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium text-[#fafaf9]/80">{task.item}</p>
                      <p className="text-sm text-[#fafaf9]/40">{task.description}</p>
                    </div>
                    <span className="text-sm text-amber-400 shrink-0">{task.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Estimated total development time</span>
                  <span className="text-lg font-semibold text-amber-400">3-6 months</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Estimated development cost</span>
                  <span className="text-lg font-semibold text-amber-400">$50,000-150,000</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05]">
              <h3 className="font-semibold text-lg mb-4 text-emerald-300">VoiceAI Connect Timeline:</h3>
              <div className="space-y-3">
                {[
                  { item: 'Sign up and configure branding', time: '30 minutes' },
                  { item: 'Connect Stripe and set pricing', time: '15 minutes' },
                  { item: 'Create first client account', time: '10 minutes' },
                  { item: 'Onboard client with AI receptionist', time: '15 minutes' },
                ].map((task) => (
                  <div key={task.item} className="flex justify-between items-center">
                    <span className="text-[#fafaf9]/70">{task.item}</span>
                    <span className="text-sm text-emerald-400">{task.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Time to first paying client</span>
                  <span className="text-lg font-semibold text-emerald-400">Same day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Comparison */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </span>
              Cost Comparison
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
                <h3 className="font-semibold text-lg mb-4">Bland AI Total Cost</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Development (one-time)</span>
                    <span className="text-[#fafaf9]/70">$50,000-150,000</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Bland API usage</span>
                    <span className="text-[#fafaf9]/70">$0.09/min+</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Hosting & infrastructure</span>
                    <span className="text-[#fafaf9]/70">$200-500/mo</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Ongoing maintenance</span>
                    <span className="text-[#fafaf9]/70">$2,000-5,000/mo</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#fafaf9]/40">
                  Plus: developer salaries, bug fixes, feature updates
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05]">
                <h3 className="font-semibold text-lg mb-4 text-emerald-300">VoiceAI Connect Total Cost</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Development</span>
                    <span className="text-emerald-400">$0</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Platform fee</span>
                    <span className="text-emerald-400">$199-499/mo</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Hosting & infrastructure</span>
                    <span className="text-emerald-400">$0 (included)</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Maintenance & updates</span>
                    <span className="text-emerald-400">$0 (included)</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-emerald-400/70">
                  Flat fee regardless of usage. You keep 100% of client revenue.
                </p>
              </div>
            </div>
          </div>

          {/* When to Choose Bland */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Building2 className="h-5 w-5 text-emerald-400" />
              </span>
              When Bland AI Actually Makes Sense
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Bland is a good product—for the right use case. Consider Bland if:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'You\'re building a unique product',
                  description: 'Not just receptionist—something novel that doesn\'t exist yet',
                },
                {
                  title: 'You have engineering resources',
                  description: 'In-house developers or budget for contractors',
                },
                {
                  title: 'You need deep customization',
                  description: 'Custom AI behaviors that go beyond receptionist use cases',
                },
                {
                  title: 'You\'re VC-funded',
                  description: 'Have runway to invest in development before revenue',
                },
                {
                  title: 'You want to own the tech',
                  description: 'Building proprietary technology is part of your moat',
                },
                {
                  title: 'You\'re okay with timeline',
                  description: '3-6 months to market is acceptable',
                },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <h4 className="font-medium mb-1">{item.title}</h4>
                  <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
              <p className="text-[#fafaf9]/70">
                <strong className="text-amber-300">The honest take:</strong> If you're reading this comparison trying to decide 
                how to start selling AI receptionist services to local businesses, Bland is probably overkill. 
                You don't need to build a car factory to start a taxi company.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Can I switch from Bland to VoiceAI Connect later?',
                a: 'Yes, but you\'d be abandoning custom development work. If you\'re unsure which path to take, start with VoiceAI Connect—you can always build custom later if you outgrow it. Starting with Bland means committing to development before validating the business.',
              },
              {
                q: 'Is VoiceAI Connect built on Bland AI?',
                a: 'No. VoiceAI Connect has its own AI infrastructure. We\'re a complete platform, not a layer on top of another API. This means better reliability, consistent pricing, and no dependency on third-party API changes.',
              },
              {
                q: 'What if I want features VoiceAI Connect doesn\'t have?',
                a: 'Talk to us. Our roadmap is driven by partner feedback. Custom features may be possible for larger partners. But honestly, for 90% of AI receptionist use cases, the platform already does what you need.',
              },
              {
                q: 'Is the AI quality comparable?',
                a: 'Yes. Both use state-of-the-art language models and voice synthesis. The AI quality difference between platforms is minimal—what matters more is how well the AI is configured for each business, which VoiceAI Connect makes easy.',
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
                Skip the development
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  Start selling today
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#fafaf9]/50">
                VoiceAI Connect is ready to go. Your first client can be live this week.
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
                  href="/how-to-start-ai-receptionist-agency" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium transition-all hover:bg-white/[0.06]"
                >
                  Read the Getting Started Guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Comparisons */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl font-semibold mb-8">Other Comparisons</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'VoiceAI Connect vs Synthflow',
                description: 'Another direct-use AI voice platform.',
                href: '/voiceai-connect-vs-synthflow',
              },
              {
                title: 'VoiceAI Connect vs Retell AI',
                description: 'Developer-focused voice AI platform.',
                href: '/voiceai-connect-vs-retell',
              },
              {
                title: 'White-Label vs Building Your Own',
                description: 'Full build vs buy analysis.',
                href: '/white-label-vs-build-your-own',
              },
              {
                title: 'Best White-Label AI Platforms',
                description: 'Comparison of reseller platforms.',
                href: '/best-white-label-ai-receptionist-platforms',
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