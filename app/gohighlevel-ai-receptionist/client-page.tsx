'use client';

import Link from 'next/link';
import { 
  ArrowRight, Check, ChevronRight, Zap, TrendingUp,
  Users, DollarSign, Layers, Phone, Calendar, 
  MessageSquare, BarChart3, Settings, Database,
  Workflow, Menu, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function GoHighLevelPage() {
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
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[128px]" />
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
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-500/[0.07] via-emerald-500/[0.03] to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#fafaf9]/40 mb-6">
            <Link href="/" className="hover:text-[#fafaf9] transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#fafaf9]/60">Integrations</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.08] px-4 py-1.5 text-sm mb-6">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-blue-300/90">GoHighLevel Integration</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            White-Label AI Receptionist
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              for GoHighLevel Agencies
            </span>
          </h1>
          
          {/* Answer-First Summary Box */}
          <div className="mt-8 p-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05]">
            <p className="text-lg sm:text-xl text-[#fafaf9]/80 leading-relaxed">
              <strong className="text-[#fafaf9]">For GHL agency owners and SaaS Mode users:</strong> Add AI receptionist as a new revenue stream alongside your existing GoHighLevel offerings. Call data syncs directly to GHL contacts, triggers workflows, and books to GHL calendars. Your sub-accounts get 24/7 call coverage that feels native to the platform—while you earn $150-300/month per client with zero delivery work.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm text-[#fafaf9]/50">
            <span>Updated January 2026</span>
            <span className="h-1 w-1 rounded-full bg-[#fafaf9]/30" />
            <span>10 min read</span>
          </div>
        </div>
      </section>

      {/* GHL Integration Highlights */}
      <section className="py-12 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-center mb-8">Native GoHighLevel Integration</h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { icon: Database, title: 'Contact Sync', description: 'Calls create/update GHL contacts automatically' },
              { icon: Workflow, title: 'Trigger Workflows', description: 'Fire automations based on call outcomes' },
              { icon: Calendar, title: 'Calendar Booking', description: 'AI books directly to GHL calendars' },
              { icon: MessageSquare, title: 'Conversation Logs', description: 'Call transcripts sync to contact records' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 mx-auto mb-3">
                  <item.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* Why GHL Agencies Are Perfect for This */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Layers className="h-5 w-5 text-blue-400" />
              </span>
              Why GoHighLevel Agencies Are Perfectly Positioned
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              You already sell software and automations to local businesses. You understand recurring revenue. 
              Your clients trust you with their tech stack. AI receptionist is a natural extension—and it 
              integrates directly with the GHL ecosystem you already manage.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                {
                  title: 'You Already Sell SaaS',
                  description: 'Your clients pay monthly for software. AI receptionist is just another line item in that relationship.',
                },
                {
                  title: 'You Manage Their Tech',
                  description: 'You\'re already in their GHL account. Adding AI receptionist is a natural expansion of your service.',
                },
                {
                  title: 'You Understand MRR',
                  description: 'Unlike project-based agencies, you think in recurring revenue. AI receptionist fits your model perfectly.',
                },
                {
                  title: 'You Have the Client Base',
                  description: 'Local businesses using GHL for CRM and marketing are exactly who needs AI call coverage.',
                },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4 text-blue-400" />
                    <h4 className="font-medium">{item.title}</h4>
                  </div>
                  <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How the Integration Works */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Settings className="h-5 w-5 text-blue-400" />
              </span>
              How AI Receptionist Integrates with GoHighLevel
            </h2>

            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              The integration is designed to feel native to GHL. Your clients get AI-powered call handling 
              that feeds directly into the CRM and automations they already use.
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  step: '1',
                  title: 'Call Comes In',
                  description: 'AI answers in under 500ms with a natural, customized greeting for the business.',
                },
                {
                  step: '2',
                  title: 'AI Has Conversation',
                  description: 'Handles inquiries, captures caller info, qualifies leads, answers FAQs from knowledge base.',
                },
                {
                  step: '3',
                  title: 'Data Syncs to GHL',
                  description: 'Contact created/updated in GHL with name, phone, email, call reason, transcript, and recording.',
                },
                {
                  step: '4',
                  title: 'Workflows Trigger',
                  description: 'Custom tags applied, automations fired, tasks created—whatever you\'ve built in GHL.',
                },
                {
                  step: '5',
                  title: 'Appointment Booked',
                  description: 'If requested, AI checks GHL calendar availability and books directly. Confirmations sent via GHL.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{item.title}</h4>
                    <p className="text-sm text-[#fafaf9]/50">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <h3 className="font-semibold mb-4">Data That Syncs to GHL Contacts</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Caller name',
                  'Phone number',
                  'Email (if captured)',
                  'Call reason/intent',
                  'Full transcript',
                  'Call recording URL',
                  'Call duration',
                  'Custom tags',
                  'Lead score',
                  'Appointment details',
                  'Follow-up tasks',
                  'Urgency level',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-[#fafaf9]/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SaaS Mode Opportunity */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </span>
              The SaaS Mode Opportunity
            </h2>
            
            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              If you're running GHL in SaaS Mode, you're already selling software to local businesses 
              under your brand. AI receptionist fits perfectly into this model.
            </p>

            <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] mb-6">
              <h3 className="font-semibold mb-4">Typical GHL SaaS Mode Stack + AI</h3>
              
              <div className="space-y-3">
                {[
                  { service: 'CRM & Pipeline', price: '$97', included: true },
                  { service: 'Website Builder', price: '$47', included: true },
                  { service: 'Marketing Automations', price: '$97', included: true },
                  { service: 'Reputation Management', price: '$47', included: true },
                  { service: 'AI Receptionist', price: '$149-199', highlight: true },
                ].map((item) => (
                  <div 
                    key={item.service} 
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      item.highlight 
                        ? 'bg-emerald-500/10 border border-emerald-500/20' 
                        : 'bg-white/[0.03]'
                    }`}
                  >
                    <span className={item.highlight ? 'text-emerald-300 font-medium' : 'text-[#fafaf9]/70'}>
                      {item.service}
                    </span>
                    <span className={item.highlight ? 'text-emerald-400 font-medium' : 'text-[#fafaf9]/50'}>
                      {item.price}/mo
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Potential Monthly Revenue Per Client</span>
                  <span className="text-xl font-semibold text-emerald-400">$437-487</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[#fafaf9]/70">
                <strong className="text-[#fafaf9]">The positioning that works:</strong> "Our platform now includes AI-powered 
                call handling. Never miss a lead again—even at 2am. It integrates directly with your CRM and automations."
              </p>
            </div>
          </div>

          {/* Revenue Math */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </span>
              Revenue Impact for GHL Agencies
            </h2>

            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Most GHL agencies have 20-100 sub-accounts. Here's what adding AI receptionist looks like:
            </p>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a] mb-6">
              <h3 className="font-semibold mb-4">Scenario: 40-Client GHL Agency</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">Active sub-accounts</span>
                  <span className="text-xl font-semibold">40</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">AI receptionist adoption (30%)</span>
                  <span className="text-xl font-semibold">12 clients</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">Price per client</span>
                  <span className="text-xl font-semibold">$179/mo</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">New monthly revenue</span>
                  <span className="text-xl font-semibold">$2,148</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.06]">
                  <span className="text-[#fafaf9]/60">Platform cost</span>
                  <span className="text-xl font-semibold text-[#fafaf9]/40">−$199</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium">New monthly profit</span>
                  <span className="text-2xl font-semibold text-emerald-400">$1,949</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                <p className="text-sm text-[#fafaf9]/70">
                  <strong className="text-emerald-300">That's $23,388/year in new profit</strong> with zero additional 
                  delivery work. The AI runs 24/7. GHL handles the CRM. You just collect the recurring revenue.
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Examples */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Workflow className="h-5 w-5 text-blue-400" />
              </span>
              GHL Workflow Examples
            </h2>

            <p className="text-[#fafaf9]/60 text-lg leading-relaxed mb-6">
              Here's how GHL agencies are using AI receptionist data to power automations:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  name: 'Hot Lead Alert',
                  trigger: 'AI tags call as "urgent" or "high value"',
                  action: 'Instant SMS to business owner + Slack notification + task created',
                },
                {
                  name: 'Appointment Confirmation',
                  trigger: 'AI books appointment via GHL calendar',
                  action: 'Confirmation email + SMS reminder sequence + add to pipeline',
                },
                {
                  name: 'Missed Opportunity Recovery',
                  trigger: 'Caller hangs up before completing',
                  action: 'SMS follow-up: "Sorry we missed you, can we call you back?"',
                },
                {
                  name: 'After-Hours Handling',
                  trigger: 'Call comes in outside business hours',
                  action: 'Tag contact + schedule callback task + send "we got your message" SMS',
                },
                {
                  name: 'Service Request Routing',
                  trigger: 'AI identifies service type (e.g., "emergency repair")',
                  action: 'Route to specific pipeline + assign to on-call technician',
                },
                {
                  name: 'New Customer Onboarding',
                  trigger: 'First-time caller identified',
                  action: 'Add to nurture sequence + send welcome email + create opportunity',
                },
              ].map((item) => (
                <div key={item.name} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <h4 className="font-medium mb-2">{item.name}</h4>
                  <p className="text-sm text-blue-300/70 mb-1">Trigger: {item.trigger}</p>
                  <p className="text-sm text-emerald-300/70">Action: {item.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How to Pitch to Sub-Accounts */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Phone className="h-5 w-5 text-blue-400" />
              </span>
              How to Pitch AI Receptionist to Your Sub-Accounts
            </h2>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0a]">
              <p className="text-xs font-medium text-[#fafaf9]/40 uppercase mb-4">Email Template for GHL Clients</p>
              <div className="text-sm text-[#fafaf9]/70 font-mono leading-relaxed space-y-4">
                <p><strong className="text-[#fafaf9]">Subject:</strong> New feature: AI answers your calls 24/7</p>
                
                <p>Hey [Name],</p>
                
                <p>Quick update on something we just added to your [Platform Name] account.</p>
                
                <p>You can now add an AI receptionist that answers every single call to your business—24/7, 
                even when you're busy or it's after hours.</p>
                
                <p>Here's what it does:</p>
                
                <p className="pl-4 border-l-2 border-blue-500/30">
                  • Answers in under 1 second (no hold music, no voicemail)<br/>
                  • Captures caller name, number, and reason for calling<br/>
                  • Can answer questions about your services<br/>
                  • Books appointments directly on your calendar<br/>
                  • All call data syncs into your CRM automatically
                </p>
                
                <p>It's $179/month. Based on the leads you're getting, I think it would pay for itself 
                within the first week by capturing calls you're currently missing.</p>
                
                <p>Want me to set up a demo so you can call and test it? Takes 5 minutes.</p>
                
                <p>[Your name]</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-10">
            Questions from GHL Agencies
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'Does this work with GHL SaaS Mode?',
                a: 'Yes. You can offer AI receptionist as an add-on to your SaaS Mode clients just like any other feature. Pricing is flexible—charge what you want, bill through your existing Stripe integration, and keep the margin.',
              },
              {
                q: 'How does the calendar integration work?',
                a: 'AI checks availability in your client\'s GHL calendar before offering times. When a caller wants to book, AI confirms the slot is open, creates the appointment, and GHL handles confirmations and reminders through your existing workflow.',
              },
              {
                q: 'Can I set up different AI configurations for different sub-accounts?',
                a: 'Absolutely. Each sub-account gets its own AI configuration: custom greeting, business-specific knowledge base, unique call handling rules, and individual GHL integration settings.',
              },
              {
                q: 'What if my client already uses GHL\'s built-in calling features?',
                a: 'They work together. GHL tracks calls and provides analytics. AI receptionist handles the actual answering and conversation. Think of it as adding a smart layer on top of GHL\'s telephony infrastructure.',
              },
              {
                q: 'How do I manage this across all my sub-accounts?',
                a: 'You get a master dashboard showing all clients, their AI usage, call volumes, and revenue. Manage everything from one place. Individual clients only see their own data in their GHL-branded dashboard.',
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
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 blur-3xl" />
            
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
                Add AI receptionist to your
                <span className="block mt-1 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  GoHighLevel stack
                </span>
              </h2>
              <p className="mt-4 text-lg text-[#fafaf9]/50">
                Start your free trial. Offer AI to your sub-accounts this week.
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
                title: 'White-Label AI for Marketing Agencies',
                description: 'For agencies focused on marketing services.',
                href: '/white-label-ai-receptionist-marketing-agencies',
              },
              {
                title: 'Adding AI Voice to Your Agency Stack',
                description: 'General guide for all agency types.',
                href: '/add-ai-voice-to-agency',
              },
              {
                title: 'How Much Can You Make Reselling AI?',
                description: 'Revenue projections and profit calculator.',
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