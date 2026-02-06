'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, DollarSign, Users, Zap, ChevronRight, 
  BarChart3, Clock, Gift, Repeat, Star, TrendingUp, 
  Smartphone, Globe, Shield, Menu, X, Play, Sparkles,
  Mail, MessageSquare, Youtube, Target, Megaphone, Award
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ReferralProgramPage() {
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
                  className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors rounded-lg hover:bg-white/[0.03]"
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
      <section className="relative pt-28 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 lg:pb-32">
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
              <span className="text-emerald-300/90">Agency Referral Program</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
              <span className="block">Earn 40% Recurring</span>
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                For Every Agency You Refer
              </span>
            </h1>
            
            <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-[#fafaf9]/60 max-w-2xl mx-auto leading-relaxed px-4">
              Refer entrepreneurs, creators, and agencies to VoiceAI Connect and earn 
              40% recurring commission on every payment—for the lifetime of their subscription.
            </p>

            {/* Value props row */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-sm text-[#fafaf9]/50">
              {[
                '40% recurring forever',
                '90-day cookie window', 
                'Real-time dashboard'
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link 
                href="/signup" 
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 rounded-full bg-white px-5 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
              >
                <span>Start Your Free Trial</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link 
                href="#how-it-works"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium text-[#fafaf9] transition-all hover:bg-white/[0.06] hover:border-white/20"
              >
                See How It Works
              </Link>
            </div>

            <p className="mt-5 sm:mt-6 text-sm text-[#fafaf9]/40">
              Free to join · No minimum referrals · Payouts every month
            </p>
          </div>

          {/* Earnings preview card */}
          <div className="mt-16 sm:mt-20 lg:mt-24 max-w-3xl mx-auto relative">
            <div className="absolute -inset-x-20 -top-20 h-[300px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-2xl pointer-events-none" />
            
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 sm:px-6 py-3 bg-[#080808]">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                  <div className="h-3 w-3 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-lg bg-white/[0.03] text-xs text-[#fafaf9]/40 font-mono">
                    referrals.myvoiceaiconnect.com/dashboard
                  </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-[#fafaf9]/40">Your Referral Dashboard</p>
                    <p className="text-lg font-semibold mt-1">Welcome back, Alex 👋</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    40% Commission
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Referrals', value: '82', color: 'text-[#fafaf9]' },
                    { label: 'Active Subscriptions', value: '73', color: 'text-[#fafaf9]' },
                    { label: 'This Month', value: '$5,572', color: 'text-emerald-400' },
                    { label: 'All Time', value: '$47,219', color: 'text-emerald-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-xs text-[#fafaf9]/40">{stat.label}</p>
                      <p className={`text-lg sm:text-xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-[#fafaf9]/40">Recent Referrals</p>
                  {[
                    { name: 'Sarah K.', plan: 'Professional', commission: '$79.60/mo', time: '2 days ago', status: 'Active' },
                    { name: 'Mike R.', plan: 'Scale', commission: '$199.60/mo', time: '5 days ago', status: 'Active' },
                    { name: 'James T.', plan: 'Starter', commission: '$39.60/mo', time: '1 week ago', status: 'Active' },
                  ].map((referral) => (
                    <div key={referral.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/20 flex items-center justify-center text-xs font-medium">
                          {referral.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{referral.name}</p>
                          <p className="text-xs text-[#fafaf9]/40">{referral.plan} · {referral.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-400">{referral.commission}</p>
                        <p className="text-xs text-emerald-400/60">{referral.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm shadow-xl">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[#fafaf9]/70">Track every referral in <span className="text-[#fafaf9]">real-time</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Breakdown */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Commission Structure</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              40% of every payment.
              <span className="block text-[#fafaf9]/40">Forever.</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Not a one-time bonus. Not limited to the first year. You earn 40% of every 
              subscription payment your referral makes—for as long as they&apos;re a customer.
            </p>
          </div>

          {/* Commission cards per plan */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            {[
              {
                plan: 'Starter',
                price: 99,
                commission: 39.60,
                highlighted: false,
              },
              {
                plan: 'Professional',
                price: 199,
                commission: 79.60,
                highlighted: true,
              },
              {
                plan: 'Scale',
                price: 499,
                commission: 199.60,
                highlighted: false,
              },
            ].map((tier) => (
              <div
                key={tier.plan}
                className={`relative rounded-2xl border p-6 sm:p-8 text-center transition-all ${
                  tier.highlighted
                    ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.08] to-transparent scale-[1.02] lg:scale-105'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-[#050505]">
                      Most Referred
                    </span>
                  </div>
                )}
                <p className="text-sm text-[#fafaf9]/50">{tier.plan} Plan</p>
                <p className="text-[#fafaf9]/40 mt-2">${tier.price}/mo subscription</p>
                <div className="mt-4 mb-2">
                  <span className="text-4xl sm:text-5xl font-semibold text-emerald-400">${tier.commission.toFixed(2)}</span>
                </div>
                <p className="text-sm text-[#fafaf9]/50">per month, per referral</p>
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs text-[#fafaf9]/40">Annual earnings per referral</p>
                  <p className="text-lg font-semibold text-emerald-400 mt-1">${(tier.commission * 12).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Earnings calculator */}
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 sm:p-8">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative">
                <p className="text-sm text-[#fafaf9]/40 uppercase tracking-wider mb-6">Referral Earnings Calculator</p>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-baseline border-b border-white/[0.06] pb-4">
                    <span className="text-[#fafaf9]/60">70 referrals × $199/mo (Professional)</span>
                    <span className="text-2xl font-semibold">$13,930</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-white/[0.06] pb-4">
                    <span className="text-[#fafaf9]/60">Your 40% commission</span>
                    <span className="text-2xl font-semibold text-emerald-400">$5,572/mo</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-[#fafaf9]/80 font-medium">Annual passive income</span>
                    <span className="text-3xl sm:text-4xl font-semibold text-emerald-400">$66,864</span>
                  </div>
                </div>
                
                <div className="mt-8 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                  <p className="text-sm text-emerald-300/80">
                    <strong className="text-emerald-300">$5,572/month in passive recurring income.</strong> Referrals 
                    compound over time—each new agency you refer adds to your monthly earnings permanently. 
                    Your 40% commission never expires.
                  </p>
                </div>
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
              <span className="text-amber-300/90">How the Referral Program Works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Three steps to recurring income
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Sign up, share your link, and earn 40% of every payment your referrals make. No caps, no limits, no expiry.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Get Your Referral Link',
                description: 'Sign up for VoiceAI Connect (or log in if you\'re already a customer). Your unique referral link is generated instantly—share it anywhere.',
                icon: Gift,
              },
              {
                step: '02',
                title: 'Share With Your Audience',
                description: 'Mention VoiceAI Connect in videos, emails, blog posts, tweets, DMs—wherever your audience is. When someone clicks your link and signs up, they\'re tracked to you automatically.',
                icon: Megaphone,
              },
              {
                step: '03',
                title: 'Earn 40% Every Month',
                description: 'For every referral that becomes a paying subscriber, you earn 40% of their monthly payment. Commissions are paid out monthly via PayPal, Wise, or bank transfer.',
                icon: Repeat,
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
        </div>
      </section>

      {/* Why This Referral Program Is Different */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
                <Award className="h-4 w-4 text-amber-400" />
                <span className="text-amber-300/90">Why Partners Love It</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                Not just another
                <span className="block text-[#fafaf9]/40">affiliate program.</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 leading-relaxed">
                Most SaaS affiliate programs offer 20% for 12 months and call it generous. We offer 40% recurring 
                with no cap and no expiry—because we want partners who build with us for the long term.
              </p>
              
              <div className="mt-8 sm:mt-10 space-y-4">
                {[
                  {
                    icon: Repeat,
                    title: 'Lifetime Recurring Commissions',
                    description: 'No 12-month cap. Earn 40% for as long as your referral stays subscribed.',
                  },
                  {
                    icon: Clock,
                    title: '90-Day Cookie Window',
                    description: 'If someone clicks your link and signs up within 90 days, you get credit. No rush.',
                  },
                  {
                    icon: BarChart3,
                    title: 'Real-Time Tracking Dashboard',
                    description: 'See every click, signup, and commission in real-time. Full transparency.',
                  },
                  {
                    icon: Shield,
                    title: 'Monthly Payouts, No Minimum',
                    description: 'Get paid every month via PayPal, Wise, or bank transfer. No minimum threshold.',
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                      <feature.icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                      <p className="text-xs text-[#fafaf9]/50">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison table */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden shadow-2xl">
                <div className="p-6 sm:p-8">
                  <p className="text-sm text-[#fafaf9]/40 uppercase tracking-wider mb-6">How We Compare</p>
                  
                  <div className="space-y-0">
                    {/* Header */}
                    <div className="grid grid-cols-3 gap-4 pb-4 border-b border-white/[0.06]">
                      <div className="text-xs text-[#fafaf9]/40"></div>
                      <div className="text-center">
                        <p className="text-xs text-[#fafaf9]/40">Typical SaaS</p>
                        <p className="text-xs text-[#fafaf9]/40">Affiliate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-emerald-400 font-medium">VoiceAI</p>
                        <p className="text-xs text-emerald-400 font-medium">Connect</p>
                      </div>
                    </div>

                    {[
                      { label: 'Commission', typical: '20%', voiceai: '40%' },
                      { label: 'Duration', typical: '12 months', voiceai: 'Lifetime' },
                      { label: 'Cookie', typical: '30 days', voiceai: '90 days' },
                      { label: 'Payout', typical: 'Net 60', voiceai: 'Monthly' },
                      { label: 'Min. Payout', typical: '$100+', voiceai: '$0' },
                      { label: 'Earnings Cap', typical: 'Often yes', voiceai: 'None' },
                    ].map((row) => (
                      <div key={row.label} className="grid grid-cols-3 gap-4 py-3 border-b border-white/[0.04]">
                        <div className="text-sm text-[#fafaf9]/60">{row.label}</div>
                        <div className="text-center text-sm text-[#fafaf9]/40">{row.typical}</div>
                        <div className="text-center text-sm text-emerald-400 font-medium">{row.voiceai}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is This For */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Who Should Join</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Perfect for creators, agencies,
              <span className="block text-[#fafaf9]/40">and entrepreneurs</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Whether you have an audience of 500 or 500,000—if they&apos;re interested in starting 
              an AI business, you can earn serious recurring income.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Youtube,
                title: 'YouTubers & Content Creators',
                description: 'Create tutorials, reviews, or "how I built my AI agency" content. Your audience is already looking for the next opportunity.',
                highlight: true,
              },
              {
                icon: Target,
                title: 'Agency Owners',
                description: 'Already using VoiceAI Connect? Refer other entrepreneurs you meet at events, in communities, or in your network.',
                highlight: true,
              },
              {
                icon: Megaphone,
                title: 'Marketing & Business Coaches',
                description: 'Recommend VoiceAI Connect as a turnkey business model to your coaching clients and course students.',
                highlight: true,
              },
              {
                icon: MessageSquare,
                title: 'Community Leaders',
                description: 'Run a Discord, Facebook group, or forum about AI, SaaS, or entrepreneurship? Share your link with your community.',
                highlight: false,
              },
              {
                icon: Mail,
                title: 'Newsletter Writers',
                description: 'Feature VoiceAI Connect in your newsletter. One mention to 5,000 subscribers could generate dozens of referrals.',
                highlight: false,
              },
              {
                icon: Globe,
                title: 'Bloggers & SEO Affiliates',
                description: 'Write comparison posts, reviews, and guides about AI receptionist platforms. Rank and earn passively.',
                highlight: false,
              },
            ].map((persona) => (
              <div 
                key={persona.title} 
                className={`group relative rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
                  persona.highlight 
                    ? 'border-emerald-500/20 bg-emerald-500/[0.03] hover:border-emerald-500/40 hover:bg-emerald-500/[0.06]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl mb-4 transition-colors ${
                  persona.highlight 
                    ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
                    : 'bg-white/[0.04] group-hover:bg-white/[0.08]'
                }`}>
                  <persona.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    persona.highlight ? 'text-emerald-400' : 'text-[#fafaf9]/60'
                  }`} />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">{persona.title}</h3>
                <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{persona.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You're Promoting */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300/90">What You&apos;re Promoting</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                A product that
                <span className="block text-[#fafaf9]/40">sells itself.</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 leading-relaxed">
                VoiceAI Connect is a white-label platform that lets anyone start an AI receptionist agency. 
                Agencies pay $99-499/month, resell to local businesses for $99-299/month each, and the platform 
                handles all the tech, fulfillment, and support.
              </p>
              
              <div className="mt-8 sm:mt-10 space-y-3">
                {[
                  'White-label AI receptionist platform',
                  'Zero technical skills required',
                  'Agencies keep 100% of client revenue',
                  'Built-in leads CRM with 13+ outreach templates',
                  'Marketing site with interactive AI demo line',
                  '97% profit margins for agencies',
                  '14-day free trial, cancel anytime',
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-[#fafaf9]/70">{point}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link 
                  href="/"
                  className="inline-flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/20 rounded-full px-5 py-2.5 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.1]"
                >
                  See the full platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link 
                  href="/#pricing"
                  className="inline-flex items-center justify-center gap-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors border border-white/10 rounded-full px-5 py-2.5 hover:bg-white/[0.03]"
                >
                  View pricing plans
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {/* Stats card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative space-y-4">
                <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
                  <p className="text-sm text-[#fafaf9]/40 mb-4">Why agencies love VoiceAI Connect</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: '97%', label: 'Profit margins' },
                      { value: '< 5 min', label: 'Setup time' },
                      { value: '$0', label: 'Fulfillment work' },
                      { value: '24/7', label: 'AI coverage' },
                    ].map((stat) => (
                      <div key={stat.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-xl sm:text-2xl font-semibold text-emerald-400">{stat.value}</p>
                        <p className="text-xs text-[#fafaf9]/40 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03]">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-[#fafaf9]/80 leading-relaxed italic">
                    &ldquo;VoiceAI Connect let me launch my AI agency in a weekend. Signed my first paying 
                    client within 11 days—that one client covered my entire monthly cost.&rdquo;
                  </p>
                  <p className="text-sm font-medium mt-3">Jonathan Rowe</p>
                  <p className="text-xs text-[#fafaf9]/40">Founder, SmartDesk AI</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Resources */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300/90">Partner Resources</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Everything you need to promote
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              We arm you with marketing assets, talking points, and data so you can create 
              compelling content that converts.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: BarChart3,
                title: 'Affiliate Dashboard',
                description: 'Real-time tracking of clicks, signups, conversions, and earnings.',
              },
              {
                icon: Smartphone,
                title: 'Demo Access',
                description: 'Full platform access so you can show the product in your content.',
              },
              {
                icon: TrendingUp,
                title: 'Sales Data & Stats',
                description: 'Industry stats, ROI numbers, and case studies to reference.',
              },
              {
                icon: Users,
                title: 'Dedicated Support',
                description: 'Direct line to our team for questions from you or your referrals.',
              },
            ].map((resource) => (
              <div key={resource.title} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 mb-3">
                  <resource.icon className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="font-medium text-sm mb-1">{resource.title}</h3>
                <p className="text-xs text-[#fafaf9]/50 leading-relaxed">{resource.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Referral Program FAQ
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How much can I earn with the VoiceAI Connect referral program?',
                a: 'You earn 40% of every subscription payment your referrals make—for the lifetime of their subscription. On a single Professional plan referral ($199/month), that\'s $79.60/month or $955/year. With 70 Professional referrals, you\'d earn $5,572/month—$66,864/year in passive recurring income. There\'s no cap on how many people you can refer or how much you can earn.',
              },
              {
                q: 'Do I need to be a VoiceAI Connect customer to join?',
                a: 'No. Anyone can join the referral program—you don\'t need to be an active subscriber. That said, many of our most successful partners are also customers. Using the platform yourself makes your content more authentic and gives you firsthand experience to share.',
              },
              {
                q: 'How does tracking work?',
                a: 'When you join, you get a unique referral link. Anyone who clicks that link has a 90-day cookie window to sign up. Once they subscribe to a paid plan, the referral is attributed to you. You can track everything—clicks, signups, conversions, and earnings—in your real-time dashboard.',
              },
              {
                q: 'When and how do I get paid?',
                a: 'Commissions are calculated at the end of each month and paid out within the first two weeks of the following month. You can receive payments via PayPal, Wise, or direct bank transfer. There\'s no minimum payout threshold.',
              },
              {
                q: 'Is the 40% commission really recurring forever?',
                a: 'Yes. Unlike most SaaS affiliate programs that cap commissions at 12 months, we pay 40% for the entire lifetime of the referred customer\'s subscription. As long as they\'re paying, you\'re earning.',
              },
              {
                q: 'What if my referral upgrades their plan?',
                a: 'Your commission automatically adjusts. If someone signs up for Starter ($99/month) and later upgrades to Professional ($199/month), your monthly commission increases from $39.60 to $79.60.',
              },
              {
                q: 'Can I promote VoiceAI Connect in YouTube videos?',
                a: 'Absolutely. Many of our top partners are YouTubers who create content about AI businesses, agency models, and making money online. We encourage video content—it converts extremely well. You can show the dashboard, walk through the platform, and share your honest experience.',
              },
              {
                q: 'Are there any restrictions on how I can promote?',
                a: 'We ask that partners don\'t make unsubstantiated income claims (e.g., "guaranteed $10K your first month"). Be authentic and honest. Other than that, you\'re free to promote through any channel: YouTube, blogs, newsletters, social media, podcasts, email, communities, or word of mouth.',
              },
              {
                q: 'What makes this different from other agency referral programs?',
                a: 'Three things: (1) 40% recurring commission with no cap or expiry—most programs offer 20% for 12 months. (2) 90-day cookie window—most offer 30 days. (3) The product itself is easy to sell—agencies get a turnkey AI business with 97% margins and zero fulfillment work.',
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
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 blur-3xl" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
                Ready to earn 40% recurring
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  on every referral?
                </span>
              </h2>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-[#fafaf9]/50">
                Join the VoiceAI Connect agency referral program today. Free to join, no minimums, lifetime commissions.
              </p>
              
              <div className="mt-8 sm:mt-10">
                <Link 
                  href="/signup" 
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 rounded-full bg-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
                >
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              
              <p className="mt-5 sm:mt-6 text-sm text-[#fafaf9]/40">
                Free to join · 40% recurring forever · No cap on earnings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Data for SEO / AI Discoverability */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "VoiceAI Connect Agency Referral Program — Earn 40% Recurring Commission",
            "description": "Join the VoiceAI Connect agency referral program and earn 40% lifetime recurring commissions for every agency you refer. Free to join, no minimums, 90-day cookie, monthly payouts.",
            "url": "https://myvoiceaiconnect.com/referral-program",
            "mainEntity": {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How much can I earn with the VoiceAI Connect referral program?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You earn 40% of every subscription payment your referrals make for the lifetime of their subscription. On a single Professional plan referral ($199/month), that's $79.60/month or $955/year. With 70 Professional referrals, you'd earn $5,572/month or $66,864/year in passive recurring income. There's no cap on earnings."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Do I need to be a VoiceAI Connect customer to join the referral program?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Anyone can join the referral program. You don't need to be an active subscriber, though many successful partners are also customers since it makes content more authentic."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is the 40% commission really recurring forever?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Unlike most SaaS affiliate programs that cap commissions at 12 months, VoiceAI Connect pays 40% for the entire lifetime of the referred customer's subscription."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What makes this different from other agency referral programs?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Three things: 40% recurring commission with no cap or expiry (most programs offer 20% for 12 months), 90-day cookie window (most offer 30 days), and the product itself is easy to sell with agencies getting 97% margins and zero fulfillment work."
                  }
                },
                {
                  "@type": "Question",
                  "name": "When and how do I get paid?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Commissions are calculated monthly and paid within the first two weeks of the following month via PayPal, Wise, or direct bank transfer. There is no minimum payout threshold."
                  }
                }
              ]
            },
            "publisher": {
              "@type": "Organization",
              "name": "VoiceAI Connect",
              "url": "https://myvoiceaiconnect.com"
            }
          })
        }}
      />

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
              <Link href="/features" className="hover:text-[#fafaf9] transition-colors">Features</Link>
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
              <Link href="/blog" className="hover:text-[#fafaf9] transition-colors">Blog</Link>
              <Link href="/demo" className="hover:text-[#fafaf9] transition-colors">Book a Demo</Link>
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