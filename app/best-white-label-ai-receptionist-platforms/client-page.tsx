'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, ChevronRight, Trophy, Star,
  Users, DollarSign, Zap, Shield, Clock, Layers,
  Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BestWhiteLabelPlatformsPage() {
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
            <Link href="/comparisons" className="hover:text-[#fafaf9] transition-colors">Comparisons</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#fafaf9]/60">Best Platforms</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-6">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-amber-300/90">2026 Comparison Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            Best White-Label AI Receptionist
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              Platforms for Agencies (2026)
            </span>
          </h1>
          
          {/* Answer-First Summary Box */}
          <div className="mt-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">The best white-label AI receptionist platform for most agencies is VoiceAI Connect</strong>—it offers complete branding control, built-in client billing via Stripe Connect, a no-code setup process, and flat-rate pricing that makes unit economics predictable. For agencies prioritizing ease of use and speed to revenue over technical customization, it's the clear leader. This guide compares the top platforms for reselling AI receptionist services.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-[#fafaf9]/50">
            <span>Updated January 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span>12 min read</span>
          </div>
        </div>
      </section>

      {/* What Makes a Good White-Label Platform */}
      <section className="py-12 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-center mb-8">What We Evaluated</h2>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Layers, title: 'White-Label Depth', description: 'How complete is the branding?' },
              { icon: DollarSign, title: 'Pricing Model', description: 'Flat fee vs per-use costs' },
              { icon: Clock, title: 'Time to Launch', description: 'How fast can you sell?' },
              { icon: Users, title: 'Client Management', description: 'Multi-tenant features' },
              { icon: Zap, title: 'AI Quality', description: 'Voice naturalness & accuracy' },
              { icon: Shield, title: 'Support', description: 'Help when you need it' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] mx-auto mb-2">
                  <item.icon className="h-5 w-5 text-[#fafaf9]/60" />
                </div>
                <h3 className="font-medium text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-[#fafaf9]/40">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Rankings */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* #1 VoiceAI Connect */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#050505] font-bold text-xl">
                1
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold">VoiceAI Connect</h2>
                <p className="text-sm text-emerald-400">Best Overall for Agencies</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05]">
              <div className="grid sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'White-Label', score: '10/10' },
                  { label: 'Ease of Use', score: '10/10' },
                  { label: 'Pricing Model', score: '9/10' },
                  { label: 'Client Tools', score: '10/10' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-white/[0.03]">
                    <p className="text-xs text-[#fafaf9]/40">{item.label}</p>
                    <p className="text-lg font-semibold text-emerald-400">{item.score}</p>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3 text-emerald-300">Strengths</h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      'Complete white-label (domain, dashboard, emails)',
                      'Built-in Stripe Connect for client billing',
                      'No-code setup—live in under an hour',
                      'Flat monthly fee, unlimited clients',
                      'Client-facing dashboard included',
                      'Industry-specific AI templates',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[#fafaf9]/70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-[#fafaf9]/50">Considerations</h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      'Less customization than developer-focused tools',
                      'Focused on receptionist use case specifically',
                      'Newer platform (launched 2024)',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-[#fafaf9]/30">•</span>
                        <span className="text-[#fafaf9]/50">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div>
                  <p className="text-sm text-[#fafaf9]/50">Platform Cost</p>
                  <p className="text-xl font-semibold">$199-499/month</p>
                </div>
                <Link 
                  href="/signup" 
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#050505] hover:bg-[#fafaf9] transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-4 text-sm text-[#fafaf9]/60">
                <strong className="text-[#fafaf9]">Bottom line:</strong> VoiceAI Connect is purpose-built for the agency/reseller use case. 
                If you want to start selling AI receptionist services this week without writing code or hiring developers, 
                this is the platform.
              </p>
            </div>
          </div>

          {/* #2 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-[#050505] font-bold text-xl">
                2
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold">AIReception Pro</h2>
                <p className="text-sm text-[#fafaf9]/50">Good for Tech-Savvy Agencies</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="grid sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'White-Label', score: '8/10' },
                  { label: 'Ease of Use', score: '6/10' },
                  { label: 'Pricing Model', score: '7/10' },
                  { label: 'Client Tools', score: '7/10' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-white/[0.03]">
                    <p className="text-xs text-[#fafaf9]/40">{item.label}</p>
                    <p className="text-lg font-semibold text-[#fafaf9]/70">{item.score}</p>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3 text-[#fafaf9]/70">Strengths</h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      'Strong API for custom integrations',
                      'Advanced call flow customization',
                      'Multi-language support',
                      'Detailed analytics',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                        <span className="text-[#fafaf9]/60">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-[#fafaf9]/50">Considerations</h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      'Steeper learning curve',
                      'Per-minute pricing adds up',
                      'Client dashboard is basic',
                      'White-label requires higher tier',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-[#fafaf9]/30">•</span>
                        <span className="text-[#fafaf9]/50">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#fafaf9]/50">Platform Cost</p>
                    <p className="text-xl font-semibold">$299/mo + $0.12/min</p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-[#fafaf9]/60">
                <strong className="text-[#fafaf9]">Bottom line:</strong> Solid platform if you have technical resources and want more customization. 
                The per-minute pricing makes unit economics less predictable than flat-fee alternatives.
              </p>
            </div>
          </div>

          {/* #3 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-[#fafaf9] font-bold text-xl">
                3
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold">CallBot Agency</h2>
                <p className="text-sm text-[#fafaf9]/50">Budget-Friendly Option</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="grid sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'White-Label', score: '6/10' },
                  { label: 'Ease of Use', score: '8/10' },
                  { label: 'Pricing Model', score: '8/10' },
                  { label: 'Client Tools', score: '5/10' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-white/[0.03]">
                    <p className="text-xs text-[#fafaf9]/40">{item.label}</p>
                    <p className="text-lg font-semibold text-[#fafaf9]/70">{item.score}</p>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3 text-[#fafaf9]/70">Strengths</h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      'Lowest cost entry point',
                      'Simple interface',
                      'Quick setup',
                      'Good for testing the market',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                        <span className="text-[#fafaf9]/60">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-[#fafaf9]/50">Considerations</h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      'Limited white-label options',
                      'Basic AI capabilities',
                      'No client billing integration',
                      'Limited scalability',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-[#fafaf9]/30">•</span>
                        <span className="text-[#fafaf9]/50">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#fafaf9]/50">Platform Cost</p>
                    <p className="text-xl font-semibold">$99-199/month</p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-[#fafaf9]/60">
                <strong className="text-[#fafaf9]">Bottom line:</strong> Good starting point if budget is tight, but you'll likely outgrow it. 
                Limited white-labeling means clients may see the platform branding in places.
              </p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6">Side-by-Side Comparison</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-4 pr-4 font-medium text-[#fafaf9]/50">Feature</th>
                    <th className="text-center py-4 px-3 font-medium text-emerald-400">VoiceAI Connect</th>
                    <th className="text-center py-4 px-3 font-medium text-[#fafaf9]/50">AIReception Pro</th>
                    <th className="text-center py-4 pl-3 font-medium text-[#fafaf9]/50">CallBot Agency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {[
                    { feature: 'Starting Price', v1: '$199/mo', v2: '$299/mo + usage', v3: '$99/mo' },
                    { feature: 'Custom Domain', v1: '✓', v2: '✓ (Pro plan)', v3: '✗' },
                    { feature: 'Branded Dashboard', v1: '✓', v2: '✓', v3: 'Partial' },
                    { feature: 'Client Billing', v1: 'Stripe Connect', v2: 'Manual', v3: 'Manual' },
                    { feature: 'Setup Time', v1: '< 1 hour', v2: '2-4 hours', v3: '1-2 hours' },
                    { feature: 'API Access', v1: 'Basic', v2: 'Full', v3: 'None' },
                    { feature: 'CRM Integrations', v1: 'GHL, HubSpot, etc.', v2: 'Zapier only', v3: 'Limited' },
                    { feature: 'Client Limit', v1: 'Unlimited', v2: 'Unlimited', v3: '25 on base plan' },
                    { feature: 'Support', v1: 'Priority + Slack', v2: 'Email', v3: 'Email' },
                    { feature: 'Free Trial', v1: '14 days', v2: '7 days', v3: 'Demo only' },
                  ].map((row) => (
                    <tr key={row.feature}>
                      <td className="py-3 pr-4 text-[#fafaf9]/70">{row.feature}</td>
                      <td className="py-3 px-3 text-center text-emerald-400">{row.v1}</td>
                      <td className="py-3 px-3 text-center text-[#fafaf9]/50">{row.v2}</td>
                      <td className="py-3 pl-3 text-center text-[#fafaf9]/50">{row.v3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* What to Look For */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6">What to Look for in a White-Label Platform</h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Not all "white-label" platforms are created equal. Here's what actually matters when you're building 
              a business reselling AI receptionist services:
            </p>

            <div className="space-y-4">
              {[
                {
                  title: 'Complete Branding Control',
                  description: 'Can you use your own domain? Your logo on the dashboard? Your company in all client emails? If clients ever see the platform\'s name, it\'s not truly white-label.',
                  importance: 'Critical',
                },
                {
                  title: 'Built-in Client Billing',
                  description: 'Managing invoices manually for 50 clients is a nightmare. Look for Stripe Connect or similar integration where clients pay you directly and it\'s all automated.',
                  importance: 'Critical',
                },
                {
                  title: 'Flat vs Usage-Based Pricing',
                  description: 'Per-minute pricing makes it hard to predict costs and set client prices. Flat monthly fees let you know exactly what you\'ll pay regardless of how much clients use the service.',
                  importance: 'High',
                },
                {
                  title: 'Client Dashboard',
                  description: 'Your clients need somewhere to see their calls, update settings, and access recordings. Building this yourself takes months. It should come included.',
                  importance: 'High',
                },
                {
                  title: 'Setup & Onboarding Speed',
                  description: 'Can you have your first client live in a day, or does it take weeks of configuration? Fast time-to-revenue matters when you\'re building a business.',
                  importance: 'Medium',
                },
                {
                  title: 'Integration Ecosystem',
                  description: 'Your clients likely use calendars, CRMs, and other tools. Native integrations (especially GoHighLevel for agencies) save tons of setup time.',
                  importance: 'Medium',
                },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{item.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.importance === 'Critical' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : item.importance === 'High'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-white/[0.06] text-[#fafaf9]/50'
                    }`}>
                      {item.importance}
                    </span>
                  </div>
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
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Why isn\'t [Synthflow/Bland AI/Retell] on this list?',
                a: 'Those are direct-use AI voice platforms, not white-label reseller platforms. They\'re designed for businesses to use AI themselves, not for agencies to resell to multiple clients. We have separate comparison pages for those tools.',
              },
              {
                q: 'Can I switch platforms later?',
                a: 'Yes, but it involves migrating clients to new numbers and systems—which is disruptive. Choose carefully upfront. The best approach: start with a platform that can scale with you so you don\'t have to switch.',
              },
              {
                q: 'Do I need technical skills?',
                a: 'For VoiceAI Connect and similar no-code platforms, no. For developer-focused options like building on Bland AI, yes—significant development resources required. Know your strengths.',
              },
              {
                q: 'How do I make money with these platforms?',
                a: 'You pay the platform a flat fee (e.g., $199/month), then charge your clients whatever you want (e.g., $149-299/month each). With 20 clients at $179/month, you\'re making $3,580 revenue against $199 cost = $3,381 profit.',
              },
              {
                q: 'What\'s the catch with flat-fee pricing?',
                a: 'Usually client limits or feature restrictions on lower tiers. With VoiceAI Connect, higher tiers unlock more features but client count is unlimited on all plans. Read the fine print.',
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
                Try VoiceAI Connect free for 14 days. No credit card required.
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

      {/* Related Resources */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl font-semibold mb-8">Related Resources</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'What Is a White-Label AI Receptionist Platform?',
                description: 'Understand the business model.',
                href: '/what-is-white-label-ai-receptionist',
              },
              {
                title: 'How to Start an AI Receptionist Agency',
                description: 'Step-by-step launch guide.',
                href: '/how-to-start-ai-receptionist-agency',
              },
              {
                title: 'VoiceAI Connect vs Synthflow',
                description: 'Reseller platform vs direct tool.',
                href: '/voiceai-connect-vs-synthflow',
              },
              {
                title: 'How Much Can You Make Reselling AI?',
                description: 'Revenue calculator and projections.',
                href: '/how-much-can-you-make-ai-receptionist-reseller',
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