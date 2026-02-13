'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, ChevronRight, Headphones, TrendingUp,
  Users, DollarSign, Clock, Phone, Shield, Zap,
  BarChart3, Moon, Sun, AlertTriangle, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AnsweringServiceResellerPage() {
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
            <span className="text-[#fafaf9]/60">For Answering Services</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6">
            <Headphones className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-300/90">For Answering Service Companies</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            AI Receptionist for
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              Answering Service Resellers
            </span>
          </h1>
          
          {/* Answer-First Summary Box */}
          <div className="mt-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">For existing answering service companies looking to modernize:</strong> AI receptionist isn't here to replace your agents—it's here to handle the overflow, after-hours calls, and routine inquiries that strain your capacity. White-label AI lets you offer 24/7 coverage without hiring night staff, reduce per-call costs by 80%, and create a new revenue tier for price-sensitive clients who can't afford full human service.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-[#fafaf9]/50">
            <span>Updated January 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span>11 min read</span>
          </div>
        </div>
      </section>

      {/* The Industry Challenge */}
      <section className="py-12 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-center mb-8">The Answering Service Industry Challenge</h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { stat: '$15-25', label: 'Cost per agent hour', sublabel: 'rising with labor costs' },
              { stat: '40%', label: 'Night shift turnover', sublabel: 'hard to retain staff' },
              { stat: '3x', label: 'After-hours cost premium', sublabel: 'for overnight coverage' },
              { stat: '60%', label: 'Calls are routine', sublabel: 'basic info & scheduling' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-3xl font-semibold text-amber-400">{item.stat}</p>
                <p className="text-sm text-[#fafaf9]/70 mt-1">{item.label}</p>
                <p className="text-xs text-[#fafaf9]/40">{item.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* The Shift in the Industry */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </span>
              The Answering Service Industry Is Changing
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              You've built your business on human operators providing personal service. That's still valuable—
              but the economics are shifting. Labor costs are up. Client expectations are higher. 
              And a new wave of AI-only competitors are undercutting on price.
            </p>

            <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-200">The threat is real</p>
                  <p className="text-sm text-[#fafaf9]/60 mt-1">
                    AI-only answering services are offering 24/7 coverage for $99-149/month. 
                    They can't match your quality for complex calls—but for price-sensitive clients 
                    who just need basic coverage, they're compelling. You need an answer.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.05]">
                <h4 className="font-medium mb-3 text-red-300">If You Ignore AI</h4>
                <ul className="space-y-2 text-sm text-[#fafaf9]/50">
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Lose price-sensitive clients to AI competitors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Keep paying premium for after-hours staffing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Miss the opportunity to differentiate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Watch margins erode as labor costs rise</span>
                  </li>
                </ul>
              </div>
              <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05]">
                <h4 className="font-medium mb-3 text-emerald-300">If You Embrace AI</h4>
                <ul className="space-y-2 text-sm text-[#fafaf9]/70">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Create a competitive "AI tier" for budget clients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Eliminate expensive overnight shifts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Offer "AI + Human" hybrid at premium pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Scale capacity without scaling headcount</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Three Ways to Use AI */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Zap className="h-5 w-5 text-emerald-400" />
              </span>
              Three Ways Answering Services Use AI
            </h2>

            {/* Strategy 1 */}
            <div className="mb-6 p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Moon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Strategy 1: After-Hours AI</h3>
                  <p className="text-sm text-[#fafaf9]/50">AI handles nights and weekends, humans handle business hours</p>
                </div>
              </div>
              
              <p className="text-sm text-[#fafaf9]/60 mb-4">
                This is the easiest way to start. Keep your daytime operations exactly as they are. 
                AI takes over when your agents go home—no more overnight shifts, no more weekend premiums.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.03]">
                  <p className="text-xs text-[#fafaf9]/40 mb-2">Before: Overnight Staffing</p>
                  <p className="text-lg font-semibold">$18/hr × 8 hrs × 365</p>
                  <p className="text-sm text-red-400">= $52,560/year</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                  <p className="text-xs text-[#fafaf9]/40 mb-2">After: AI After-Hours</p>
                  <p className="text-lg font-semibold">$199/month × 12</p>
                  <p className="text-sm text-emerald-400">= $2,388/year</p>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-emerald-400">
                → Save $50,000+/year while providing better coverage (AI never calls in sick)
              </p>
            </div>

            {/* Strategy 2 */}
            <div className="mb-6 p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Strategy 2: Overflow Handling</h3>
                  <p className="text-sm text-[#fafaf9]/50">AI catches calls when all agents are busy</p>
                </div>
              </div>
              
              <p className="text-sm text-[#fafaf9]/60 mb-4">
                During peak times, calls stack up and clients get put on hold—or worse, voicemail. 
                AI handles the overflow instantly, so no caller ever waits. Agents focus on complex calls.
              </p>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03]">
                <div className="flex-1">
                  <p className="text-sm text-[#fafaf9]/70">Call comes in during peak</p>
                  <p className="text-xs text-[#fafaf9]/40 mt-1">All agents busy</p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#fafaf9]/30" />
                <div className="flex-1">
                  <p className="text-sm text-[#fafaf9]/70">AI answers immediately</p>
                  <p className="text-xs text-[#fafaf9]/40 mt-1">Captures info, schedules callback</p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#fafaf9]/30" />
                <div className="flex-1">
                  <p className="text-sm text-[#fafaf9]/70">Agent calls back</p>
                  <p className="text-xs text-[#fafaf9]/40 mt-1">With full context</p>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-blue-400">
                → Zero missed calls. Zero hold times. Better client satisfaction.
              </p>
            </div>

            {/* Strategy 3 */}
            <div className="mb-6 p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <DollarSign className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Strategy 3: New "AI Tier" Pricing</h3>
                  <p className="text-sm text-[#fafaf9]/50">Offer AI-only service for price-sensitive clients</p>
                </div>
              </div>
              
              <p className="text-sm text-[#fafaf9]/60 mb-4">
                Some clients want answering services but can't afford $500-1,000/month for human operators. 
                Instead of losing them to competitors, offer an AI tier at $149-199/month.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { tier: 'AI Basic', price: '$149/mo', features: '24/7 AI answering, call summaries' },
                  { tier: 'AI + Human', price: '$349/mo', features: 'AI after-hours, human 9-5', highlight: true },
                  { tier: 'Full Human', price: '$599/mo', features: '24/7 human operators' },
                ].map((item) => (
                  <div 
                    key={item.tier} 
                    className={`p-4 rounded-xl ${
                      item.highlight 
                        ? 'bg-emerald-500/[0.06] border border-emerald-500/20' 
                        : 'bg-white/[0.03]'
                    }`}
                  >
                    <p className="text-sm text-[#fafaf9]/50">{item.tier}</p>
                    <p className={`text-xl font-semibold mt-1 ${item.highlight ? 'text-emerald-400' : ''}`}>
                      {item.price}
                    </p>
                    <p className="text-xs text-[#fafaf9]/40 mt-2">{item.features}</p>
                  </div>
                ))}
              </div>
              
              <p className="mt-4 text-sm text-amber-400">
                → Capture budget clients you were losing. High margin on AI tier.
              </p>
            </div>
          </div>

          {/* The Economics */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
              </span>
              The Economics: AI vs Human Operators
            </h2>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-4 pr-4 font-medium text-[#fafaf9]/50">Metric</th>
                    <th className="text-center py-4 px-4 font-medium text-[#fafaf9]/50">Human Operator</th>
                    <th className="text-center py-4 pl-4 font-medium text-emerald-400">AI Receptionist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {[
                    { metric: 'Cost per call (high volume)', human: '$1.50-3.00', ai: '$0.15-0.30' },
                    { metric: 'Cost per call (low volume)', human: '$3.00-8.00', ai: '$0.15-0.30' },
                    { metric: 'Night/weekend premium', human: '1.5-2x', ai: 'None (flat rate)' },
                    { metric: 'Answer speed', human: '10-30 seconds', ai: '<1 second' },
                    { metric: 'Sick days / turnover', human: 'Constant issue', ai: 'None' },
                    { metric: 'Training time', human: '2-4 weeks', ai: '1 hour setup' },
                    { metric: 'Scaling capacity', human: 'Hire more staff', ai: 'Instant' },
                    { metric: 'Complex/emotional calls', human: 'Excellent', ai: 'Limited' },
                  ].map((row) => (
                    <tr key={row.metric}>
                      <td className="py-4 pr-4 text-[#fafaf9]/70">{row.metric}</td>
                      <td className="py-4 px-4 text-center text-[#fafaf9]/60">{row.human}</td>
                      <td className="py-4 pl-4 text-center text-emerald-400">{row.ai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[#fafaf9]/70">
                <strong className="text-[#fafaf9]">The smart play:</strong> AI handles the 60% of calls that are routine 
                (basic info, scheduling, after-hours messages). Humans handle the 40% that need empathy, 
                judgment, or complex problem-solving. You get the best of both worlds.
              </p>
            </div>
          </div>

          {/* White-Label Benefits */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-400" />
              </span>
              Why White-Label Matters for Answering Services
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              You've built your brand and client relationships. White-label AI means your clients 
              never know you're using a platform—they see only your company.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Your Brand Everywhere',
                  description: 'AI greets callers as "[Your Company]." Dashboard shows your logo. Invoices come from you.',
                },
                {
                  title: 'Your Pricing, Your Margins',
                  description: 'Set any price you want. No per-call fees eating into profits. Flat platform cost regardless of volume.',
                },
                {
                  title: 'Seamless Client Experience',
                  description: 'Clients don\'t need to know anything changed. AI feels like an extension of your existing service.',
                },
                {
                  title: 'Competitive Differentiation',
                  description: 'Offer "AI + Human" hybrid that pure AI companies can\'t match. Best of both worlds.',
                },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <h4 className="font-medium">{item.title}</h4>
                  </div>
                  <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation Roadmap */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Clock className="h-5 w-5 text-emerald-400" />
              </span>
              30-Day Implementation Roadmap
            </h2>

            <div className="space-y-4">
              {[
                {
                  week: 'Week 1',
                  title: 'Setup & Configuration',
                  tasks: [
                    'Sign up for white-label platform',
                    'Configure branding (logo, colors, domain)',
                    'Build AI scripts for your most common call types',
                    'Test calls internally until quality is perfect',
                  ],
                },
                {
                  week: 'Week 2',
                  title: 'Pilot with Select Clients',
                  tasks: [
                    'Identify 3-5 friendly clients for pilot',
                    'Offer free AI after-hours coverage for 2 weeks',
                    'Gather feedback and refine scripts',
                    'Document what works and what needs adjustment',
                  ],
                },
                {
                  week: 'Week 3',
                  title: 'Soft Launch',
                  tasks: [
                    'Roll out to all existing clients as optional upgrade',
                    'Position as "enhanced after-hours coverage"',
                    'Offer introductory pricing for first 3 months',
                    'Monitor call quality and client satisfaction',
                  ],
                },
                {
                  week: 'Week 4+',
                  title: 'Scale & Optimize',
                  tasks: [
                    'Launch AI-only tier for new price-sensitive leads',
                    'Create hybrid "AI + Human" premium packages',
                    'Reduce overnight staffing costs',
                    'Market AI capabilities to prospects',
                  ],
                },
              ].map((phase) => (
                <div key={phase.week} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
                      {phase.week}
                    </span>
                    <h4 className="font-medium">{phase.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {phase.tasks.map((task) => (
                      <li key={task} className="flex items-start gap-2 text-sm text-[#fafaf9]/60">
                        <Check className="h-4 w-4 text-emerald-400/50 shrink-0 mt-0.5" />
                        {task}
                      </li>
                    ))}
                  </ul>
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
            Questions from Answering Service Owners
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Will AI replace my human operators?',
                a: 'Not entirely—and that\'s not the goal. AI handles routine calls (info requests, basic scheduling, after-hours messages) that don\'t require human judgment. Your operators focus on complex calls, upset callers, and situations that need empathy. The result: happier operators doing meaningful work, and better coverage overall.',
              },
              {
                q: 'What if the AI makes a mistake?',
                a: 'AI isn\'t perfect, but neither are humans (especially tired overnight staff). You can review all transcripts and recordings. Set up escalation rules so uncertain calls get transferred to a human. Most clients find AI error rates are comparable to or lower than human error rates for routine calls.',
              },
              {
                q: 'How do my clients know when they\'re talking to AI vs human?',
                a: 'That\'s your choice. Some answering services are transparent ("You\'ve reached our after-hours AI assistant"). Others position it as seamless. Either way, the AI sounds natural and handles calls professionally. Most callers don\'t know or care—they just want their call answered.',
              },
              {
                q: 'What about HIPAA and sensitive industries?',
                a: 'AI can be configured for HIPAA compliance, with encrypted storage and audit logs. For highly sensitive calls (medical emergencies, legal intake), set up immediate transfer rules to human operators. AI handles the routine; humans handle the sensitive.',
              },
              {
                q: 'How do I price the AI tier without cannibalizing my premium services?',
                a: 'Create clear differentiation. AI-only tier: basic coverage, limited customization. Hybrid tier: AI after-hours + human daytime. Premium: 24/7 human with AI backup. Position AI as "entry level" that clients can upgrade from—not a downgrade from human service.',
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
                Modernize your answering service
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  with AI-powered coverage
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#fafaf9]/50">
                Start your free trial. See how AI fits into your operation.
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
                title: 'What Is a White-Label AI Receptionist Platform?',
                description: 'Understand the business model.',
                href: '/what-is-white-label-ai-receptionist',
              },
              {
                title: 'AI Receptionist Agency Pricing Models',
                description: 'How to structure pricing tiers.',
                href: '/ai-receptionist-agency-pricing',
              },
              {
                title: 'How Much Can You Make?',
                description: 'Revenue projections and calculator.',
                href: '/how-much-can-you-make-ai-receptionist-reseller',
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