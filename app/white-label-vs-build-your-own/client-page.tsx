'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, ChevronRight, X, Clock, DollarSign,
  Code, Wrench, Shield, TrendingUp, AlertTriangle, Zap,
  Users, Building2, Scale, Menu
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WhiteLabelVsBuildPage() {
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
            <span className="text-[#fafaf9]/60">Guides</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            White-Label vs Building
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              Your Own AI Voice Platform
            </span>
          </h1>
          
          {/* Answer-First Summary Box */}
          <div className="mt-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">For most agencies, white-label is the clear winner.</strong> Building a custom AI voice platform costs $150,000-500,000+ and takes 12-18 months. White-label platforms cost $99-499/month and you can launch in a weekend. Unless you have deep AI/telephony expertise and millions in funding, white-label delivers faster time-to-revenue with dramatically lower risk.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-[#fafaf9]/50">
            <span>Updated January 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span>10 min read</span>
          </div>
        </div>
      </section>

      {/* Quick Comparison Table */}
      <section className="py-12 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-6 text-center">At a Glance</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-4 pr-4 font-medium text-[#fafaf9]/50">Factor</th>
                  <th className="text-center py-4 px-4 font-medium">
                    <span className="inline-flex items-center gap-2 text-emerald-400">
                      <Building2 className="h-4 w-4" />
                      White-Label
                    </span>
                  </th>
                  <th className="text-center py-4 pl-4 font-medium">
                    <span className="inline-flex items-center gap-2 text-amber-400">
                      <Code className="h-4 w-4" />
                      Build Custom
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {[
                  { factor: 'Upfront Cost', whiteLabel: '$0 - $500', custom: '$150,000 - $500,000+' },
                  { factor: 'Monthly Cost', whiteLabel: '$99 - $499', custom: '$5,000 - $20,000+' },
                  { factor: 'Time to Launch', whiteLabel: '1-7 days', custom: '12-18 months' },
                  { factor: 'Technical Skills Required', whiteLabel: 'None', custom: 'AI, ML, Telephony, DevOps' },
                  { factor: 'Team Size Needed', whiteLabel: '1 person', custom: '3-8 engineers' },
                  { factor: 'Ongoing Maintenance', whiteLabel: 'Platform handles it', custom: 'Your responsibility' },
                  { factor: 'AI Model Updates', whiteLabel: 'Automatic', custom: 'You manage & pay' },
                  { factor: 'Scalability Risk', whiteLabel: 'Low (proven infra)', custom: 'High (untested systems)' },
                  { factor: 'Customization Level', whiteLabel: 'Brand + some features', custom: 'Unlimited' },
                  { factor: 'Competitive Moat', whiteLabel: 'Sales & service', custom: 'Technology ownership' },
                ].map((row) => (
                  <tr key={row.factor}>
                    <td className="py-4 pr-4 text-[#fafaf9]/70">{row.factor}</td>
                    <td className="py-4 px-4 text-center text-emerald-300/80">{row.whiteLabel}</td>
                    <td className="py-4 pl-4 text-center text-amber-300/80">{row.custom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* The Real Cost of Building */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </span>
              The Real Cost of Building Your Own
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Most entrepreneurs drastically underestimate what it takes to build a production-ready AI voice platform. 
              Here's what you're actually signing up for:
            </p>

            <div className="space-y-4 mb-8">
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">AI/ML Infrastructure</h4>
                  <span className="text-amber-400 font-semibold">$50,000 - $150,000</span>
                </div>
                <p className="text-sm text-[#fafaf9]/50">
                  Speech-to-text, natural language understanding, text-to-speech, conversation management, 
                  knowledge base systems. Either build models or pay for API costs that scale with usage.
                </p>
              </div>
              
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Telephony System</h4>
                  <span className="text-amber-400 font-semibold">$30,000 - $80,000</span>
                </div>
                <p className="text-sm text-[#fafaf9]/50">
                  SIP trunking, phone number provisioning, call routing, voicemail, recording storage, 
                  failover systems. Twilio/Vonage integrations are complex and expensive at scale.
                </p>
              </div>
              
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Web/Mobile Applications</h4>
                  <span className="text-amber-400 font-semibold">$40,000 - $100,000</span>
                </div>
                <p className="text-sm text-[#fafaf9]/50">
                  Client dashboard, admin panel, mobile apps (iOS + Android), real-time notifications, 
                  reporting and analytics. Needs to be polished enough that clients trust your product.
                </p>
              </div>
              
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Billing & Multi-Tenancy</h4>
                  <span className="text-amber-400 font-semibold">$20,000 - $50,000</span>
                </div>
                <p className="text-sm text-[#fafaf9]/50">
                  Subscription management, usage metering, invoicing, white-label support for agencies, 
                  data isolation between tenants. Stripe integration alone is weeks of work.
                </p>
              </div>
              
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">DevOps & Security</h4>
                  <span className="text-amber-400 font-semibold">$15,000 - $40,000</span>
                </div>
                <p className="text-sm text-[#fafaf9]/50">
                  Cloud infrastructure, CI/CD pipelines, monitoring, backup systems, security audits, 
                  compliance (HIPAA if serving healthcare). Ongoing costs of $2,000-10,000/month.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-200">Hidden Costs Most Miss</p>
                  <ul className="mt-2 space-y-1 text-sm text-[#fafaf9]/60">
                    <li>• Hiring engineers: $150,000-250,000/year each, minimum 3-5 needed</li>
                    <li>• Ongoing API costs: OpenAI/Claude/ElevenLabs can be $10,000+/month at scale</li>
                    <li>• Legal & compliance: $20,000-50,000 for proper terms, privacy policies, contracts</li>
                    <li>• Bug fixes and support: 40%+ of engineering time goes to maintenance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Time Investment */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Clock className="h-5 w-5 text-emerald-400" />
              </span>
              The Time Factor: 18 Months vs 18 Hours
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Time is the hidden killer. Every month you spend building is a month you're not selling. 
              And in a fast-moving market, being 18 months late could mean missing the window entirely.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05]">
                <div className="flex items-center gap-3 mb-4">
                  <Code className="h-6 w-6 text-amber-400" />
                  <h3 className="font-semibold text-lg">Build Custom Timeline</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { phase: 'Planning & Architecture', time: '2-3 months' },
                    { phase: 'Core AI Development', time: '4-6 months' },
                    { phase: 'Telephony Integration', time: '2-3 months' },
                    { phase: 'Dashboard & Apps', time: '3-4 months' },
                    { phase: 'Testing & QA', time: '1-2 months' },
                    { phase: 'Beta & Bug Fixes', time: '2-3 months' },
                  ].map((item) => (
                    <div key={item.phase} className="flex justify-between text-sm">
                      <span className="text-[#fafaf9]/60">{item.phase}</span>
                      <span className="text-amber-300/80">{item.time}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-white/[0.06] flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-amber-400">14-21 months</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-6 w-6 text-emerald-400" />
                  <h3 className="font-semibold text-lg">White-Label Timeline</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { phase: 'Sign up & account setup', time: '10 minutes' },
                    { phase: 'Upload logo & set colors', time: '15 minutes' },
                    { phase: 'Configure domain', time: '30 minutes' },
                    { phase: 'Connect Stripe', time: '15 minutes' },
                    { phase: 'Set up marketing site', time: '1-2 hours' },
                    { phase: 'Test demo calls', time: '30 minutes' },
                  ].map((item) => (
                    <div key={item.phase} className="flex justify-between text-sm">
                      <span className="text-[#fafaf9]/60">{item.phase}</span>
                      <span className="text-emerald-300/80">{item.time}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-white/[0.06] flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-emerald-400">3-4 hours</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[#fafaf9]/70">
                <strong className="text-[#fafaf9]">The opportunity cost is massive.</strong> At $149/client average, 
                signing 20 clients in 18 months of white-label operation generates ~$53,000 in revenue. Meanwhile, 
                you'd still be debugging telephony issues on a custom build.
              </p>
            </div>
          </div>

          {/* When Building Makes Sense */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Scale className="h-5 w-5 text-amber-400" />
              </span>
              When Building Custom Actually Makes Sense
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Building your own isn't always wrong—it's just wrong for most agencies. 
              Here's when custom development becomes a legitimate strategy:
            </p>

            <div className="space-y-4">
              {[
                {
                  scenario: 'You have $2M+ in funding specifically for product development',
                  why: 'Investors sometimes want proprietary technology as a competitive moat. If you\'ve raised specifically to build, and have a technical co-founder, custom might be the play.',
                  verdict: 'Consider custom',
                },
                {
                  scenario: 'You need features no white-label platform offers',
                  why: 'Highly specialized industries (medical diagnostics, legal discovery) might need capabilities that don\'t exist on platforms. Validate this need thoroughly first.',
                  verdict: 'Maybe custom',
                },
                {
                  scenario: 'You plan to license your technology to other agencies',
                  why: 'If your end game is becoming a platform yourself, you\'ll eventually need proprietary tech. But consider: start white-label, validate the market, then build.',
                  verdict: 'Start white-label, then custom',
                },
                {
                  scenario: 'You have an existing engineering team with AI expertise',
                  why: 'If you already employ ML engineers and telephony experts, the marginal cost of building is lower. But factor in opportunity cost—could they build something more valuable?',
                  verdict: 'Analyze opportunity cost',
                },
              ].map((item) => (
                <div key={item.scenario} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <h4 className="font-medium mb-2">{item.scenario}</h4>
                  <p className="text-sm text-[#fafaf9]/50 mb-3">{item.why}</p>
                  <span className="inline-flex px-3 py-1 rounded-full bg-white/[0.06] text-xs font-medium text-[#fafaf9]/70">
                    Verdict: {item.verdict}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-xl border border-red-500/20 bg-red-500/[0.05]">
              <div className="flex items-start gap-3">
                <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-300">Don't Build Custom If...</p>
                  <ul className="mt-2 space-y-1 text-sm text-[#fafaf9]/60">
                    <li>• You're a non-technical founder without $500K+ budget</li>
                    <li>• You want to start generating revenue in the next 6 months</li>
                    <li>• Your main differentiation will be sales/marketing, not technology</li>
                    <li>• You're testing whether this market is viable for you</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Why White-Label Wins for Most */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </span>
              Why White-Label Wins for 95% of Agencies
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                {
                  icon: Zap,
                  title: 'Speed to Revenue',
                  description: 'Start selling this week, not next year. Cash flow positive in 30-60 days is realistic.',
                },
                {
                  icon: Shield,
                  title: 'Proven Technology',
                  description: 'Platform handles millions of calls. You benefit from battle-tested infrastructure.',
                },
                {
                  icon: TrendingUp,
                  title: 'Continuous Improvement',
                  description: 'AI models improve automatically. New features ship regularly. You get better without lifting a finger.',
                },
                {
                  icon: DollarSign,
                  title: 'Predictable Costs',
                  description: 'Flat monthly fee regardless of complexity. No surprise API bills or infrastructure costs.',
                },
                {
                  icon: Users,
                  title: 'Focus on Your Strengths',
                  description: 'Most agency owners are great at sales and relationships, not debugging TensorFlow models.',
                },
                {
                  icon: Wrench,
                  title: 'Zero Maintenance',
                  description: 'Server goes down at 2am? Not your problem. Security patch needed? Handled automatically.',
                },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 mb-3">
                    <item.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h4 className="font-medium mb-1">{item.title}</h4>
                  <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* The Hybrid Approach */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6">The Smart Hybrid Approach</h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              The most successful agencies we've seen use white-label to validate and grow, 
              then make strategic technology investments only where it creates real competitive advantage.
            </p>

            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
              <h3 className="font-semibold mb-4">Recommended Path</h3>
              <div className="space-y-4">
                {[
                  {
                    phase: 'Phase 1: Launch (Month 1-3)',
                    action: 'Go white-label. Get 10-20 clients. Learn what they actually need.',
                    outcome: 'Revenue flowing, market validated',
                  },
                  {
                    phase: 'Phase 2: Scale (Month 4-12)',
                    action: 'Double down on sales. Build operational excellence. Hit 50-100 clients.',
                    outcome: '$5,000-15,000 MRR, clear product-market fit',
                  },
                  {
                    phase: 'Phase 3: Optimize (Year 2+)',
                    action: 'Identify gaps in white-label offering. Build custom features only where critical.',
                    outcome: 'Competitive moat without rebuilding the wheel',
                  },
                ].map((item) => (
                  <div key={item.phase} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
                      {item.phase.split(' ')[1].replace(':', '')}
                    </div>
                    <div>
                      <p className="font-medium">{item.phase}</p>
                      <p className="text-sm text-[#fafaf9]/50 mt-1">{item.action}</p>
                      <p className="text-sm text-emerald-400/70 mt-1">→ {item.outcome}</p>
                    </div>
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
            Common Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Can I switch from white-label to custom later?',
                a: 'Yes, and many do. White-label validates your market quickly. Once you have revenue and clear requirements, you can selectively build custom components. You might keep using white-label for core AI while building custom integrations or dashboards.',
              },
              {
                q: 'Will my clients know I\'m using a white-label platform?',
                a: 'No. Quality white-label platforms are completely invisible. Your clients see your brand, your domain, your invoices. They have no way of knowing what technology powers the backend—just like they don\'t know what cloud provider their bank uses.',
              },
              {
                q: 'What if the white-label platform shuts down?',
                a: 'A valid concern. Mitigate this by choosing established platforms with funding, strong customer bases, and transparent business practices. That said, the same risk exists with custom infrastructure—your AWS bill is still a dependency.',
              },
              {
                q: 'Is the profit margin good enough with white-label?',
                a: 'Excellent margins are possible. If you pay $199/month for the platform and charge $149/client, you profit $1,291/month with just 10 clients. At 50 clients, that\'s $7,251/month profit. Custom builds require years to achieve these margins after recouping development costs.',
              },
              {
                q: 'Can I get VC funding with a white-label business?',
                a: 'It\'s harder—VCs often want proprietary technology. But many successful bootstrapped businesses don\'t need VC funding. If funding is your goal, use white-label to prove the market, then build custom tech with the revenue generated.',
              },
              {
                q: 'How do I compete with others using the same platform?',
                a: 'Competition happens at the sales and service layer, not the technology layer. Your branding, target market, pricing, support quality, and marketing are your differentiators. Most local businesses will never compare platforms—they\'ll compare you to other vendors they meet.',
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
                Ready to launch with
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  zero technical overhead?
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#fafaf9]/50">
                Skip the $200K development cost. Start your AI agency this weekend.
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
                  How to Start Guide
                </Link>
              </div>
              
              <p className="mt-6 text-sm text-[#fafaf9]/40">
                14-day free trial · No credit card required
              </p>
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
                description: 'Deep dive into how white-label platforms work.',
                href: '/what-is-white-label-ai-receptionist',
              },
              {
                title: 'How to Start an AI Receptionist Agency',
                description: 'Step-by-step guide to launching your business.',
                href: '/how-to-start-ai-receptionist-agency',
              },
              {
                title: 'AI Receptionist Agency Pricing Models',
                description: 'How to price your services for maximum profit.',
                href: '/ai-receptionist-agency-pricing',
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