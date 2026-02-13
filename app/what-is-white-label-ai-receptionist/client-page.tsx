'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, ChevronRight, Building2, Smartphone, 
  DollarSign, Palette, Shield, Zap, Users, Globe, Star,
  Phone, MessageSquare, BarChart3, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WhatIsWhiteLabelPage() {
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
            <span className="text-[#fafaf9]/60">Resources</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            What Is a White-Label
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              AI Receptionist Platform?
            </span>
          </h1>
          
          {/* Answer-First Summary Box - Critical for AEO */}
          <div className="mt-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">A white-label AI receptionist platform</strong> is a business-to-business (B2B) software solution that allows agencies, entrepreneurs, and resellers to offer AI-powered phone answering services under their own brand name. You get the technology; your clients see only your company. The platform handles all the AI infrastructure while you set your own pricing, branding, and customer relationships.
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
          <div className="prose prose-invert max-w-none">
            
            {/* How It Differs Section */}
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Zap className="h-5 w-5 text-emerald-400" />
                </span>
                How White-Label Differs from Direct AI Services
              </h2>
              
              <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
                When a business buys directly from an AI receptionist company (like Smith.ai or Ruby), they interact with that company's brand, pay that company, and get support from that company. The relationship is between the end-user and the AI provider.
              </p>
              
              <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-8">
                With a white-label platform, you become the provider. Your clients never know the underlying technology exists. They sign up on your website, pay you directly, see your logo in their dashboard, and contact you for support. You're building a real business asset, not just referring customers to someone else.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <h4 className="font-medium mb-3 text-[#fafaf9]/80">Direct AI Service</h4>
                  <ul className="space-y-2 text-sm text-[#fafaf9]/50">
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Provider's brand visible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Payments go to provider</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>No recurring revenue for you</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>Customer relationship with provider</span>
                    </li>
                  </ul>
                </div>
                <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05]">
                  <h4 className="font-medium mb-3 text-[#fafaf9]">White-Label Platform</h4>
                  <ul className="space-y-2 text-sm text-[#fafaf9]/70">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>100% your branding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Clients pay you directly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Build recurring MRR</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Own the customer relationship</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* What's Included Section */}
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                </span>
                What a White-Label Platform Typically Includes
              </h2>

              <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-8">
                A complete white-label AI receptionist platform provides everything you need to run an AI answering service business without building any technology yourself. Here's what to expect:
              </p>

              <div className="grid gap-4">
                {[
                  {
                    icon: Palette,
                    title: 'Complete Brand Customization',
                    description: 'Your logo, colors, domain name, and company identity across all customer touchpoints. Clients never see the underlying platform.',
                  },
                  {
                    icon: Smartphone,
                    title: 'Client-Facing Dashboard',
                    description: 'A professional web and mobile app where your clients view calls, transcripts, recordings, and analytics—all branded as your product.',
                  },
                  {
                    icon: Phone,
                    title: 'AI Voice Technology',
                    description: 'State-of-the-art voice AI that answers calls naturally, captures information, answers questions, and can book appointments.',
                  },
                  {
                    icon: DollarSign,
                    title: 'Payment Infrastructure',
                    description: 'Integrated billing (usually via Stripe Connect) so clients pay you directly. Set your own prices with no revenue sharing.',
                  },
                  {
                    icon: Globe,
                    title: 'Marketing Tools',
                    description: 'Done-for-you marketing website, demo phone numbers, and sales materials to help you acquire customers.',
                  },
                  {
                    icon: BarChart3,
                    title: 'Agency Management Dashboard',
                    description: 'Backend tools to manage all your clients, track revenue, monitor usage, and scale your business.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                      <item.icon className="h-5 w-5 text-[#fafaf9]/60" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">{item.title}</h4>
                      <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Who Uses This Section */}
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Users className="h-5 w-5 text-emerald-400" />
                </span>
                Who Uses White-Label AI Receptionist Platforms?
              </h2>

              <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-8">
                White-label platforms attract entrepreneurs and existing service providers who want to add AI answering services to their offerings without the massive investment of building proprietary technology.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Digital Marketing Agencies',
                    description: 'Agencies already serving local businesses can add AI receptionist services as a high-margin upsell. Clients trust them, and this becomes another recurring revenue stream.',
                  },
                  {
                    title: 'GoHighLevel / SaaS Resellers',
                    description: 'Entrepreneurs building software businesses for local markets. AI voice fits perfectly alongside CRM, websites, and automation tools.',
                  },
                  {
                    title: 'Answering Service Companies',
                    description: 'Traditional call centers looking to modernize with AI. White-label lets them offer 24/7 coverage without hiring night staff.',
                  },
                  {
                    title: 'Business Consultants',
                    description: 'Consultants who advise small businesses on operations. Adding AI receptionist services creates stickier, longer-term client relationships.',
                  },
                ].map((item) => (
                  <div key={item.title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <h4 className="font-medium mb-2">{item.title}</h4>
                    <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Economics Section */}
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </span>
                The Economics of White-Label AI Receptionist Reselling
              </h2>

              <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-8">
                The business model is straightforward: you pay a flat monthly platform fee, then charge your clients whatever the market will bear. The difference is your profit.
              </p>

              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
                <p className="text-sm text-[#fafaf9]/40 uppercase tracking-wider mb-4">Example Monthly Economics</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/60">20 clients × $149/month average</span>
                    <span className="text-xl font-semibold">$2,980</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                    <span className="text-[#fafaf9]/60">Platform fee (typical)</span>
                    <span className="text-xl font-semibold text-[#fafaf9]/40">−$199</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-medium">Net monthly profit</span>
                    <span className="text-2xl font-semibold text-emerald-400">$2,781</span>
                  </div>
                </div>
                
                <p className="mt-6 text-sm text-[#fafaf9]/50">
                  Unlike affiliate programs or referral fees, you're building an actual asset. A portfolio of 50+ paying clients has real enterprise value if you ever want to sell.
                </p>
              </div>
            </div>

            {/* What to Look For Section */}
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Shield className="h-5 w-5 text-emerald-400" />
                </span>
                What to Look for in a White-Label Platform
              </h2>

              <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-8">
                Not all white-label platforms are created equal. When evaluating options, consider these critical factors:
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: 'Depth of White-Labeling',
                    description: 'Does every touchpoint show your brand? Check the client dashboard, emails, invoices, support docs, and phone experience. Some platforms only white-label partially.',
                  },
                  {
                    title: 'Payment Flexibility',
                    description: 'Can you set your own prices? Do clients pay you directly via your Stripe account? Avoid platforms that take a cut of your revenue.',
                  },
                  {
                    title: 'AI Quality',
                    description: 'Test the actual voice AI. Does it sound natural? Can it handle interruptions, complex questions, and edge cases? Poor AI quality will hurt your reputation.',
                  },
                  {
                    title: 'Onboarding Speed',
                    description: 'How fast can you get a new client live? The best platforms let you onboard clients in under 5 minutes with minimal friction.',
                  },
                  {
                    title: 'Scalability',
                    description: 'What happens when you hit 50 or 100 clients? Look for flat-fee pricing that doesn\'t punish you for growing.',
                  },
                  {
                    title: 'Support & Training',
                    description: 'Do they provide sales scripts, marketing materials, and training? The best partners help you succeed, not just sell you software.',
                  },
                ].map((item) => (
                  <div key={item.title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <h4 className="font-medium mb-2">{item.title}</h4>
                    <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{item.description}</p>
                  </div>
                ))}
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
                q: 'Do I need technical skills to run a white-label AI receptionist business?',
                a: 'No. Quality white-label platforms handle all the technical complexity—AI training, telephony infrastructure, app hosting, and updates. Your job is sales, marketing, and client relationships. If you can use basic business software, you can run this business.',
              },
              {
                q: 'How is this different from being an affiliate or reseller?',
                a: 'Affiliates refer customers to another company and get a one-time commission. Resellers typically sell under someone else\'s brand with a markup. White-label means you ARE the brand. Clients have no idea the underlying platform exists. You control pricing, relationships, and build equity in your own business.',
              },
              {
                q: 'What do my clients actually experience?',
                a: 'Your clients sign up on your website, see your logo and branding throughout their dashboard, receive invoices from your company, and contact you for support. The AI answers calls using scripts customized to their business. They never interact with or even know about the white-label platform behind it.',
              },
              {
                q: 'How much can I realistically charge clients?',
                a: 'Most resellers charge between $99 and $299 per month depending on features and call volume. For context: a human receptionist costs $3,000+/month, and a single missed call can cost a business $500+ in lost revenue. AI receptionist pricing is compelling by comparison.',
              },
              {
                q: 'What happens if the platform has technical issues?',
                a: 'Look for platforms with strong uptime guarantees and redundant infrastructure. Issues do happen, so understand the SLA and how quickly they resolve problems. Your reputation depends on their reliability.',
              },
              {
                q: 'Can I switch platforms later if I\'m not happy?',
                a: 'Technically yes, but it\'s painful. You\'d need to migrate all clients to new software and potentially re-train them. Choose carefully upfront. Look for platforms with strong reviews and case studies from existing agency partners.',
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
                Ready to launch your
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  white-label AI receptionist business?
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#fafaf9]/50">
                VoiceAI Connect provides everything covered above—and you can start free.
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
                  Read: How to Start an AI Agency
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
                title: 'How to Start an AI Receptionist Agency',
                description: 'Step-by-step guide to launching and growing your AI voice business.',
                href: '/how-to-start-ai-receptionist-agency',
              },
              {
                title: 'White-Label vs Building Your Own',
                description: 'Compare the costs and tradeoffs of white-label vs custom development.',
                href: '/white-label-vs-build-your-own',
              },
              {
                title: 'AI Receptionist Agency Pricing Models',
                description: 'How to price your services for maximum profit and client retention.',
                href: '/ai-receptionist-agency-pricing',
              },
              {
                title: 'Platform Features & Pricing',
                description: 'Explore what VoiceAI Connect offers agency partners.',
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