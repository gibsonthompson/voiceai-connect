'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, X, ChevronRight, Scale,
  Users, DollarSign, Building2, Zap, Shield,
  Menu, X as XIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function VsynthflowPage() {
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
            <span className="text-[#fafaf9]/60">vs Synthflow</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6">
            <Scale className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-300/90">Comparison Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            VoiceAI Connect vs Synthflow:
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              Which Is Right for You?
            </span>
          </h1>
          
          {/* Answer-First Summary Box */}
          <div className="mt-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">These are different products for different goals.</strong> Synthflow is an AI voice platform for businesses who want to deploy AI calling for their own use. VoiceAI Connect is a white-label platform for agencies and entrepreneurs who want to resell AI receptionist services to multiple clients under their own brand. If you want to USE AI—consider Synthflow. If you want to SELL AI as a business—VoiceAI Connect is built for that.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-[#fafaf9]/50">
            <span>Updated January 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span>8 min read</span>
          </div>
        </div>
      </section>

      {/* Quick Comparison */}
      <section className="py-12 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-center mb-8">The Fundamental Difference</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <h3 className="font-semibold text-lg mb-2">Synthflow</h3>
              <p className="text-sm text-[#fafaf9]/50 mb-4">AI voice platform for direct use</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/60">Deploy AI for your own business</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/60">Pay per usage (minutes/calls)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/60">Technical setup required</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/60">You are the end user</span>
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05]">
              <h3 className="font-semibold text-lg mb-2 text-emerald-300">VoiceAI Connect</h3>
              <p className="text-sm text-[#fafaf9]/50 mb-4">White-label platform for resellers</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/70">Resell AI to your own clients</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/70">Flat monthly fee, you set client pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/70">No-code client onboarding</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[#fafaf9]/70">You build a business serving many clients</span>
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
              Who Each Platform Is For
            </h2>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
                <h3 className="font-semibold text-lg mb-4">Choose Synthflow If You...</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Own a business that needs AI phone coverage',
                    'Want to deploy AI for internal use only',
                    'Have technical resources to set up and maintain',
                    'Need advanced customization of AI behavior',
                    'Are comfortable with per-minute pricing models',
                    'Don\'t plan to resell to other businesses',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#fafaf9]/40 shrink-0 mt-0.5" />
                      <span className="text-[#fafaf9]/60">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05]">
                <h3 className="font-semibold text-lg mb-4 text-emerald-300">Choose VoiceAI Connect If You...</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Want to start an AI receptionist agency',
                    'Already run an agency and want to add AI services',
                    'Want to resell under your own brand name',
                    'Need to manage multiple client accounts',
                    'Want predictable costs regardless of call volume',
                    'Plan to build recurring revenue from many clients',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#fafaf9]/70">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Scale className="h-5 w-5 text-emerald-400" />
              </span>
              Feature Comparison
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-4 pr-4 font-medium text-[#fafaf9]/50">Feature</th>
                    <th className="text-center py-4 px-4 font-medium text-[#fafaf9]/50">Synthflow</th>
                    <th className="text-center py-4 pl-4 font-medium text-emerald-400">VoiceAI Connect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {[
                    { feature: 'Primary use case', synthflow: 'Direct deployment', voiceai: 'Reselling to clients' },
                    { feature: 'White-label branding', synthflow: 'Limited', voiceai: 'Full (your brand everywhere)' },
                    { feature: 'Multi-client management', synthflow: 'Not built for this', voiceai: 'Core feature' },
                    { feature: 'Client billing/invoicing', synthflow: 'You handle separately', voiceai: 'Built-in Stripe Connect' },
                    { feature: 'Client-facing dashboard', synthflow: 'No', voiceai: 'Yes (white-labeled)' },
                    { feature: 'Pricing model', synthflow: 'Per minute/call', voiceai: 'Flat monthly fee' },
                    { feature: 'Technical setup', synthflow: 'Developer-friendly', voiceai: 'No-code for you and clients' },
                    { feature: 'Target user', synthflow: 'Businesses, developers', voiceai: 'Agencies, resellers' },
                    { feature: 'Revenue model', synthflow: 'Cost center', voiceai: 'Profit center' },
                  ].map((row) => (
                    <tr key={row.feature}>
                      <td className="py-4 pr-4 text-[#fafaf9]/70">{row.feature}</td>
                      <td className="py-4 px-4 text-center text-[#fafaf9]/50">{row.synthflow}</td>
                      <td className="py-4 pl-4 text-center text-emerald-400">{row.voiceai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Model Differences */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </span>
              The Pricing Model Difference
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              This is where the two platforms diverge most significantly—and it determines 
              whether you're running a cost center or building a profit center.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
                <h3 className="font-semibold text-lg mb-4">Synthflow: Usage-Based</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Pricing model</span>
                    <span className="text-[#fafaf9]/70">Per minute of AI usage</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Typical cost</span>
                    <span className="text-[#fafaf9]/70">$0.10-0.15/minute</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">100 calls × 3 min avg</span>
                    <span className="text-[#fafaf9]/70">$30-45/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#fafaf9]/50">500 calls × 3 min avg</span>
                    <span className="text-[#fafaf9]/70">$150-225/month</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#fafaf9]/40">
                  Good for: Single business with predictable, lower volume
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05]">
                <h3 className="font-semibold text-lg mb-4 text-emerald-300">VoiceAI Connect: Flat Fee</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Pricing model</span>
                    <span className="text-[#fafaf9]/70">Flat monthly platform fee</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">Platform cost</span>
                    <span className="text-[#fafaf9]/70">$199-499/month</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/50">You charge clients</span>
                    <span className="text-emerald-400">$149-299/month each</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#fafaf9]/50">10 clients × $179 avg</span>
                    <span className="text-emerald-400">$1,790 revenue/month</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-emerald-400/70">
                  Good for: Agencies building recurring revenue business
                </p>
              </div>
            </div>
          </div>

          {/* The Business Model Difference */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Building2 className="h-5 w-5 text-emerald-400" />
              </span>
              The Real Question: What Are You Building?
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              The choice between these platforms isn't about features—it's about your business model.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
                <h3 className="font-semibold text-lg mb-4">Using AI for Your Business</h3>
                <p className="text-sm text-[#fafaf9]/50 mb-4">
                  You own a business (dental practice, law firm, HVAC company) and want AI to answer your phones.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-[#fafaf9]/60">→ Synthflow or similar platforms work fine</p>
                  <p className="text-[#fafaf9]/60">→ You pay for what you use</p>
                  <p className="text-[#fafaf9]/60">→ AI is a cost/expense</p>
                  <p className="text-[#fafaf9]/60">→ No reseller infrastructure needed</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05]">
                <h3 className="font-semibold text-lg mb-4 text-emerald-300">Building a Business Selling AI</h3>
                <p className="text-sm text-[#fafaf9]/50 mb-4">
                  You want to offer AI receptionist services to other businesses as your product.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-emerald-400/80">→ VoiceAI Connect is purpose-built for this</p>
                  <p className="text-emerald-400/80">→ You set prices and keep the margin</p>
                  <p className="text-emerald-400/80">→ AI is your revenue stream</p>
                  <p className="text-emerald-400/80">→ Full white-label, client management, billing</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[#fafaf9]/70">
                <strong className="text-[#fafaf9]">Bottom line:</strong> Synthflow is a tool. VoiceAI Connect is a business-in-a-box. 
                You wouldn't compare a hammer to a construction company—they solve different problems. 
                Know which problem you're solving.
              </p>
            </div>
          </div>

          {/* Can You Use Both? */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Zap className="h-5 w-5 text-emerald-400" />
              </span>
              Can You Use Both?
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Technically yes, but it rarely makes sense:
            </p>

            <div className="space-y-4">
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <h4 className="font-medium mb-2">Scenario: You have your own business AND want to resell</h4>
                <p className="text-sm text-[#fafaf9]/60 mb-3">
                  Some agency owners run their own local business (e.g., marketing agency owner also owns a restaurant).
                </p>
                <p className="text-sm text-emerald-400/80">
                  → Just use VoiceAI Connect for both. Set up your own business as one of your clients. 
                  Simpler billing, one platform, and your business gets the same quality your clients get.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <h4 className="font-medium mb-2">Scenario: You want to test AI before reselling</h4>
                <p className="text-sm text-[#fafaf9]/60 mb-3">
                  You're considering starting an AI agency but want to try the technology first.
                </p>
                <p className="text-sm text-emerald-400/80">
                  → Start with VoiceAI Connect's free trial. Test with your own business or a friendly client. 
                  No need to learn two platforms.
                </p>
              </div>
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
                q: 'Is Synthflow a competitor to VoiceAI Connect?',
                a: 'Not really. They serve different markets. Synthflow competes with other direct-use AI voice tools (like Bland AI, Retell, etc.). VoiceAI Connect competes with other white-label reseller platforms. A business owner choosing an AI tool and an entrepreneur choosing a reseller platform are making fundamentally different decisions.',
              },
              {
                q: 'Is VoiceAI Connect more expensive than Synthflow?',
                a: 'For a single business using AI for themselves, Synthflow\'s per-minute pricing might be cheaper. But VoiceAI Connect isn\'t designed for that use case. For agencies serving multiple clients, VoiceAI Connect\'s flat fee becomes dramatically more profitable—your 10th client costs you nothing extra, but you charge them $179/month.',
              },
              {
                q: 'Can I white-label Synthflow?',
                a: 'Synthflow has some white-label options, but it\'s not their core focus. VoiceAI Connect is built from the ground up for white-labeling: your domain, your branding, your client dashboard, your billing. It\'s the difference between "has white-label" and "is a white-label platform."',
              },
              {
                q: 'What if my client asks which AI I\'m using?',
                a: 'With VoiceAI Connect, they don\'t need to know. Everything is branded as your company. If they press, you can say "proprietary AI technology"—because at that point, it is yours. You\'ve customized it, you support it, you sell it.',
              },
              {
                q: 'Which has better AI quality?',
                a: 'Both use similar underlying AI models (GPT-4, Claude, etc.) with voice synthesis. The quality difference is minimal. What matters more is how well you configure the AI for each client\'s business—and VoiceAI Connect\'s no-code setup makes that easy.',
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
                Ready to build your
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  AI receptionist business?
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#fafaf9]/50">
                VoiceAI Connect gives you everything you need to start reselling AI today.
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
                  Learn About White-Label
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
                title: 'VoiceAI Connect vs Bland AI',
                description: 'Another direct-use AI voice platform comparison.',
                href: '/voiceai-connect-vs-bland-ai',
              },
              {
                title: 'VoiceAI Connect vs Retell AI',
                description: 'How we compare to Retell\'s developer-focused platform.',
                href: '/voiceai-connect-vs-retell',
              },
              {
                title: 'White-Label vs Building Your Own',
                description: 'Should you build custom AI infrastructure?',
                href: '/white-label-vs-build-your-own',
              },
              {
                title: 'Best White-Label AI Platforms',
                description: 'Full comparison of reseller platforms.',
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