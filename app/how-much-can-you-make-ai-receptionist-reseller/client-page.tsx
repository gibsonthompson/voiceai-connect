'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, ChevronRight, Plus, TrendingUp,
  Users, DollarSign, Layers, Target, Zap, Shield,
  MessageSquare, PieChart, Lightbulb, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AddAIVoiceToAgencyPage() {
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
            <span className="text-[#fafaf9]/60">For Agencies</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            Add AI Voice Services to
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
              Your Existing Agency
            </span>
          </h1>
          
          {/* Answer-First Summary Box */}
          <div className="mt-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">For marketing, web design, and service agencies:</strong> AI receptionist services are the highest-margin, lowest-effort upsell you can add to your existing client base. Your clients already trust you. Offer them 24/7 AI call coverage under your brand for $149-299/month—no extra delivery work required. Agencies typically convert 20-40% of existing clients, adding $2,000-8,000/month in pure profit.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-[#fafaf9]/50">
            <span>Updated January 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span>10 min read</span>
          </div>
        </div>
      </section>

      {/* Why This Works for Existing Agencies */}
      <section className="py-12 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-4 gap-6 text-center">
            {[
              { stat: '0', label: 'Extra delivery hours', sublabel: 'AI runs itself 24/7' },
              { stat: '85%+', label: 'Profit margin', sublabel: 'on each client' },
              { stat: '20-40%', label: 'Client conversion', sublabel: 'on first offer' },
              { stat: '< 3%', label: 'Monthly churn', sublabel: 'sticky service' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-3xl sm:text-4xl font-semibold text-emerald-400">{item.stat}</p>
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
          
          {/* Why AI Voice is Perfect for Agencies */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Layers className="h-5 w-5 text-emerald-400" />
              </span>
              Why AI Receptionist is the Perfect Agency Add-On
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Most agency services (SEO, ads, social media, web design) require ongoing work for each client. 
              AI receptionist is fundamentally different—and that's what makes it so profitable.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/[0.05]">
                <h4 className="font-medium mb-3 text-red-300">Typical Agency Services</h4>
                <ul className="space-y-2 text-sm text-[#fafaf9]/50">
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Hours of work per client per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Need to hire as you scale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Quality depends on your team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Margins compress under pressure</span>
                  </li>
                </ul>
              </div>
              <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05]">
                <h4 className="font-medium mb-3 text-emerald-300">AI Receptionist Service</h4>
                <ul className="space-y-2 text-sm text-[#fafaf9]/70">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Zero ongoing delivery work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Infinite scale, same overhead</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Consistent quality from platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>85%+ margins at any scale</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[#fafaf9]/70">
                <strong className="text-[#fafaf9]">The key insight:</strong> AI receptionist isn't competing for your team's time. 
                Adding 20 AI receptionist clients doesn't require hiring anyone or taking on more work. 
                It's pure incremental revenue on top of your existing business.
              </p>
            </div>
          </div>

          {/* How to Position It */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Target className="h-5 w-5 text-emerald-400" />
              </span>
              How to Position AI Receptionist to Existing Clients
            </h2>

            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Your existing clients already trust you. That's your superpower. Here's how to introduce AI voice 
              services in a way that feels like a natural extension of your relationship:
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  title: 'For Marketing Agency Clients',
                  pitch: '"We\'re driving more leads to your business, but I noticed you miss quite a few calls. What if I could guarantee every lead gets answered, 24/7, and booked on your calendar? It would make our marketing work even harder for you."',
                  angle: 'Protect your marketing investment',
                },
                {
                  title: 'For Web Design Clients',
                  pitch: '"Your new website is generating calls, which is great. But are you catching all of them? I can add an AI receptionist that answers instantly and captures every lead—so your website investment actually converts."',
                  angle: 'Maximize website ROI',
                },
                {
                  title: 'For SEO Clients',
                  pitch: '"We\'ve got you ranking for high-intent keywords. But when someone calls from a Google search, who answers? If it goes to voicemail, they\'re calling your competitor next. Let me show you how we can fix that."',
                  angle: 'Complete the conversion funnel',
                },
                {
                  title: 'For Social Media Clients',
                  pitch: '"Your social presence is driving awareness, but what happens when someone actually calls? AI receptionist ensures every inquiry gets a professional response, even at 10pm when they see your post."',
                  angle: 'Don\'t waste social engagement',
                },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{item.title}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">{item.angle}</span>
                  </div>
                  <p className="text-sm text-[#fafaf9]/50 italic">"{item.pitch}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* The Email Template */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
              </span>
              Email Template: Introducing AI to Existing Clients
            </h2>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <p className="text-xs font-medium text-[#fafaf9]/40 uppercase mb-4">Copy & Customize</p>
              <div className="text-sm text-[#fafaf9]/70 font-mono leading-relaxed space-y-4">
                <p><strong className="text-[#fafaf9]">Subject:</strong> Quick idea to capture more leads from [your service]</p>
                
                <p>Hi [Name],</p>
                
                <p>I've been thinking about how to help you get even more from the [marketing/website/SEO] work we're doing together.</p>
                
                <p>One thing I've noticed across my clients: about 30% of phone calls go unanswered, especially after hours and during busy periods. That's potential revenue walking away.</p>
                
                <p>I'm now offering AI-powered call coverage as an add-on service. Here's what it does:</p>
                
                <p className="pl-4 border-l-2 border-emerald-500/30">
                  • Answers every call instantly, 24/7<br/>
                  • Captures caller info and reason for calling<br/>
                  • Can answer questions about your services<br/>
                  • Books appointments directly on your calendar<br/>
                  • Sends you a text summary after each call
                </p>
                
                <p>It's $[149-199]/month and takes about 5 minutes to set up.</p>
                
                <p>Would you like me to set up a demo so you can call and test it yourself? I can have it ready for [Business Name] by tomorrow.</p>
                
                <p>
                  [Your name]<br/>
                  <span className="text-[#fafaf9]/40">P.S. - This pairs really well with the [service] we're already doing. Means no lead falls through the cracks.</span>
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-[#fafaf9]/60">
                  <strong className="text-amber-300">Pro tip:</strong> Send this to your 10 best clients first. 
                  Get a few wins, collect testimonials, then roll out to your full list.
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Impact Calculator */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <PieChart className="h-5 w-5 text-emerald-400" />
              </span>
              Revenue Impact: Real Numbers
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Let's say you have 30 active clients and offer AI receptionist at $179/month. 
              Here's what conservative adoption looks like:
            </p>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] mb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">Existing clients</span>
                  <span className="text-xl font-semibold">30</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">Conservative conversion (25%)</span>
                  <span className="text-xl font-semibold">7-8 clients</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">Monthly revenue (8 × $179)</span>
                  <span className="text-xl font-semibold">$1,432</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">Platform cost</span>
                  <span className="text-xl font-semibold text-[#fafaf9]/40">−$199</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium">New monthly profit</span>
                  <span className="text-2xl font-semibold text-emerald-400">$1,233</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <p className="text-sm text-[#fafaf9]/50">
                  <strong className="text-[#fafaf9]/70">That's $14,796/year in pure profit</strong> from sending one email to your existing client list. 
                  No new client acquisition. No extra delivery work. No hiring.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { scenario: 'Conservative (20%)', clients: 6, profit: '$878/mo', annual: '$10,536' },
                { scenario: 'Moderate (30%)', clients: 9, profit: '$1,412/mo', annual: '$16,944' },
                { scenario: 'Optimistic (40%)', clients: 12, profit: '$1,949/mo', annual: '$23,388' },
              ].map((item) => (
                <div key={item.scenario} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                  <p className="text-sm text-[#fafaf9]/50">{item.scenario}</p>
                  <p className="text-xs text-[#fafaf9]/40 mt-1">{item.clients} clients adopt</p>
                  <p className="text-xl font-semibold text-emerald-400 mt-2">{item.profit}</p>
                  <p className="text-xs text-[#fafaf9]/40">{item.annual}/year</p>
                </div>
              ))}
            </div>
          </div>

          {/* Integration with Your Stack */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Zap className="h-5 w-5 text-emerald-400" />
              </span>
              Fits Into Your Existing Tool Stack
            </h2>

            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              If you're already using tools like GoHighLevel, HubSpot, or other CRMs, AI receptionist data 
              flows right into your existing systems.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  tool: 'GoHighLevel',
                  integration: 'Call data syncs to contacts. Triggers automations. Appointments book to GHL calendar.',
                  benefit: 'Unified client view',
                },
                {
                  tool: 'HubSpot / Salesforce',
                  integration: 'Create contacts from calls. Log activities. Update deal stages.',
                  benefit: 'CRM stays current',
                },
                {
                  tool: 'Google Calendar',
                  integration: 'AI books appointments directly. Sends confirmations. Checks availability.',
                  benefit: 'No double-booking',
                },
                {
                  tool: 'Slack / Email',
                  integration: 'Instant notifications for calls. Daily summaries. Urgent call alerts.',
                  benefit: 'Never miss important calls',
                },
              ].map((item) => (
                <div key={item.tool} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{item.tool}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/[0.06] text-[#fafaf9]/60">{item.benefit}</span>
                  </div>
                  <p className="text-sm text-[#fafaf9]/50">{item.integration}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Objection Handling */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-400" />
              </span>
              Handling Client Objections
            </h2>

            <div className="space-y-4">
              {[
                {
                  objection: '"I already have staff answering phones"',
                  response: 'Great—this isn\'t about replacing them. It\'s about covering the times they can\'t: after hours, lunch breaks, weekends, sick days. Think of it as backup that never calls in sick.',
                },
                {
                  objection: '"My customers want to talk to a real person"',
                  response: 'Totally understand. Here\'s the thing: 85% of callers who hit voicemail never call back. They\'d rather talk to helpful AI than leave a message that might not get returned. Plus, urgent calls can transfer to your cell.',
                },
                {
                  objection: '"$179/month is a lot for answering calls"',
                  response: 'Let me flip that: how much does a missed call cost you? If even one $500 job walks because no one answered, that\'s 3 months of the service. Most businesses miss 10-20 calls a month.',
                },
                {
                  objection: '"I need to think about it"',
                  response: 'Of course. How about this—let me set up a demo number you can call yourself. Test it out, see how it handles your questions. Takes 5 minutes and there\'s no commitment.',
                },
              ].map((item) => (
                <div key={item.objection} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <p className="text-sm font-medium text-red-300 mb-2">❌ "{item.objection}"</p>
                  <p className="text-sm text-emerald-400/80">✓ {item.response}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step by Step Rollout */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </span>
              7-Day Rollout Plan
            </h2>

            <div className="space-y-4">
              {[
                {
                  day: 'Day 1',
                  task: 'Set up your white-label platform',
                  details: 'Upload logo, configure branding, connect Stripe. Takes 30-60 minutes.',
                },
                {
                  day: 'Day 2',
                  task: 'Create your AI receptionist demo',
                  details: 'Set up a demo business so clients can call and experience the AI firsthand.',
                },
                {
                  day: 'Day 3',
                  task: 'Identify your top 10 clients',
                  details: 'Pick clients who miss calls, have high call volume, or would benefit most.',
                },
                {
                  day: 'Day 4-5',
                  task: 'Send personalized outreach',
                  details: 'Email or call your top 10. Use the templates above. Offer demos.',
                },
                {
                  day: 'Day 6',
                  task: 'Conduct demos and close',
                  details: 'Let them call your demo line. Show the dashboard. Handle objections.',
                },
                {
                  day: 'Day 7',
                  task: 'Onboard first clients',
                  details: 'Set up their AI receptionist. 5 minutes each. Celebrate your new MRR.',
                },
              ].map((item, i) => (
                <div key={item.day} className="flex gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-emerald-400">{item.day}</span>
                      <span className="font-medium">{item.task}</span>
                    </div>
                    <p className="text-sm text-[#fafaf9]/50">{item.details}</p>
                  </div>
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
            Questions from Agency Owners
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Will this cannibalize my other services?',
                a: 'No—it complements them. AI receptionist makes your marketing, SEO, and web services MORE valuable by ensuring leads convert. Clients see better results from everything you do, which increases retention and referrals.',
              },
              {
                q: 'What if a client has a problem with the AI?',
                a: 'The platform handles most support automatically. For edge cases, you can adjust settings or reach out to platform support. In practice, agencies report spending less than 1 hour/month on AI receptionist support across all clients.',
              },
              {
                q: 'Should I bundle it with my other services or sell separately?',
                a: 'Both work. Some agencies add it to packages at a small premium. Others offer it standalone to clients who only need call coverage. Test both and see what your market prefers.',
              },
              {
                q: 'Do I need to become an AI expert?',
                a: 'Not at all. The platform handles the AI complexity. You just need to understand the value proposition—which you already do if you understand marketing and lead conversion.',
              },
              {
                q: 'What if clients want to cancel?',
                a: 'Churn is low (3-5% monthly) because the value is obvious and immediate. Clients see their missed calls captured. That said, some will cancel—that\'s normal. Keep your sales pipeline active.',
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
                Ready to add AI voice
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  to your agency?
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#fafaf9]/50">
                Start your free trial. Offer AI receptionist to your clients this week.
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
                  href="/ai-receptionist-agency-pricing" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium transition-all hover:bg-white/[0.06]"
                >
                  See Pricing Strategies
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
                title: 'AI Receptionist Agency Pricing Models',
                description: 'How to structure and set your pricing.',
                href: '/ai-receptionist-agency-pricing',
              },
              {
                title: 'How Much Can You Make Reselling AI Receptionists?',
                description: 'Revenue projections and profit calculator.',
                href: '/how-much-can-you-make-ai-receptionist-reseller',
              },
              {
                title: 'White-Label AI for GoHighLevel Agencies',
                description: 'Specifically for GHL users.',
                href: '/gohighlevel-ai-receptionist',
              },
              {
                title: 'Platform Features & Pricing',
                description: 'See what VoiceAI Connect offers partners.',
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