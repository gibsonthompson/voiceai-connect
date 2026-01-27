'use client';

import Link from 'next/link';
import { 
  Phone, ArrowRight, Check, Star, Zap, Shield, Clock, Users, 
  DollarSign, ChevronRight, MessageSquare, FileText, Mic, Globe, 
  Smartphone, BarChart3, Calendar, Bell, Headphones, Code, Mail,
  Building2, Sparkles, Menu, X, Play, Gauge, BrainCircuit, 
  PhoneCall, Volume2, FileAudio, Search, Download, AlertTriangle,
  Timer, Voicemail, Settings, Palette, Link2, CreditCard, 
  PieChart, TrendingUp, UserPlus, Webhook, Database, Lock,
  Server, Cloud, RefreshCw, CheckCircle2, ArrowUpRight,
  Bot, Layers, Workflow, CircuitBoard, Boxes
} from 'lucide-react';
import { useState, useEffect } from 'react';

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

export default function FeaturesPage() {
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
                  <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {[
                { name: 'Platform', href: '/platform' },
                { name: 'How It Works', href: '/#how-it-works' },
                { name: 'Pricing', href: '/#pricing' },
                { name: 'FAQ', href: '/#faq' },
              ].map((item) => (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`px-4 py-2 text-sm transition-colors rounded-lg hover:bg-white/[0.03] ${
                    item.href === '/platform' ? 'text-[#fafaf9]' : 'text-[#fafaf9]/60 hover:text-[#fafaf9]'
                  }`}
                >
                  {item.name}
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
            {['Platform', 'How It Works', 'Pricing', 'FAQ'].map((item) => (
              <Link 
                key={item}
                href={item === 'Platform' ? '/platform' : `/#${item.toLowerCase().replace(/\s+/g, '-')}`}
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
      <section className="relative pt-28 sm:pt-32 lg:pt-40 pb-16 sm:pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/[0.07] via-amber-500/[0.03] to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6 sm:mb-8">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Complete Platform Features</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
              <span className="block">Everything You Need.</span>
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                Nothing You Don&apos;t.
              </span>
            </h1>
            
            <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-[#fafaf9]/60 max-w-2xl mx-auto leading-relaxed px-4">
              A complete white-label AI receptionist platform with 40+ features built in. 
              Your clients get enterprise-grade tools. You get a turnkey business.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-sm text-[#fafaf9]/50">
              {[
                '40+ Features Included',
                'Zero Development Required', 
                'Launch in 24 Hours'
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup" 
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 sm:px-8 py-4 text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
              >
                <span>Start Your 14-Day Free Trial</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link 
                href="/#pricing"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-6 sm:px-8 py-4 text-base font-medium text-[#fafaf9] transition-all hover:bg-white/[0.06] hover:border-white/20"
              >
                <span>View Pricing</span>
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="border-y border-white/[0.06] bg-white/[0.01] py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {[
              { value: '500ms', label: 'Average answer time' },
              { value: '99.9%', label: 'Platform uptime' },
              { value: '40+', label: 'Built-in features' },
              { value: '60 sec', label: 'Client provisioning' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-400">{stat.value}</p>
                <p className="text-xs sm:text-sm text-[#fafaf9]/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Voice Features - What Businesses Experience */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Bot className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300/90">AI Voice Technology</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              State-of-the-art voice AI
              <span className="block mt-1 sm:mt-2 text-[#fafaf9]/40">that sounds genuinely human</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Powered by the latest conversational AI. Callers can&apos;t tell the difference.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: Zap,
                title: '500ms Answer Time',
                description: 'AI picks up before the second ring. No waiting, no hold music, no frustration.',
                stat: '< 0.5 sec',
              },
              {
                icon: Volume2,
                title: 'Natural Voice',
                description: 'Premium ElevenLabs voices that sound warm, professional, and human.',
                stat: '16+ voices',
              },
              {
                icon: BrainCircuit,
                title: 'Context Awareness',
                description: 'Remembers conversation context and handles complex multi-turn dialogues.',
                stat: 'GPT-4 powered',
              },
              {
                icon: Globe,
                title: 'Multi-Industry',
                description: 'Pre-trained for healthcare, legal, home services, real estate, and more.',
                stat: '12+ industries',
              },
            ].map((feature) => (
              <div 
                key={feature.title} 
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                    <feature.icon className="h-5 w-5 text-[#fafaf9]/60" />
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                    {feature.stat}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client-Facing Features - What Their Customers Get */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Client Dashboard Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Everything your clients need
              <span className="block mt-1 sm:mt-2 text-[#fafaf9]/40">to manage their AI receptionist</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              A beautiful, branded dashboard where businesses monitor calls, 
              train their AI, and never miss an opportunity.
            </p>
          </div>

          {/* Main features grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: FileAudio,
                title: 'Call Recordings',
                description: 'Every call recorded and stored. One-click playback in the browser. Download for records.',
                highlight: true,
              },
              {
                icon: MessageSquare,
                title: 'SMS Call Summaries',
                description: 'Instant text after every call with caller name, phone, reason, and urgency level.',
                highlight: true,
              },
              {
                icon: FileText,
                title: 'Full Transcripts',
                description: 'Word-for-word transcription of every conversation. Searchable and exportable to CSV.',
                highlight: true,
              },
              {
                icon: Sparkles,
                title: 'AI Call Summaries',
                description: 'Intelligent extraction of key details: name, contact info, service needed, action items.',
                highlight: false,
              },
              {
                icon: Search,
                title: 'Knowledge Base',
                description: 'AI scrapes their website and learns services, pricing, hours, and FAQs automatically.',
                highlight: false,
              },
              {
                icon: Phone,
                title: 'Dedicated Number',
                description: 'Each client gets their own local or toll-free number. Port existing numbers too.',
                highlight: false,
              },
              {
                icon: Clock,
                title: '24/7 AI Coverage',
                description: 'Never miss a call. AI answers instantly—nights, weekends, holidays. Always on.',
                highlight: false,
              },
              {
                icon: Calendar,
                title: 'Appointment Booking',
                description: 'AI checks Google Calendar availability and books appointments in real-time.',
                highlight: false,
              },
              {
                icon: Bell,
                title: 'Real-time Alerts',
                description: 'Push notifications, email alerts, and SMS for urgent calls and new bookings.',
                highlight: false,
              },
              {
                icon: BarChart3,
                title: 'Call Analytics',
                description: 'Volume trends, peak hours, common requests, call outcomes, and conversion rates.',
                highlight: false,
              },
              {
                icon: AlertTriangle,
                title: 'Urgency Detection',
                description: 'AI identifies emergency calls and escalates via text/email immediately.',
                highlight: false,
              },
              {
                icon: Voicemail,
                title: 'Voicemail Transcription',
                description: 'When AI can\'t help, voicemails are transcribed and delivered as text.',
                highlight: false,
              },
              {
                icon: Timer,
                title: 'Business Hours',
                description: 'Custom greetings and behaviors for open hours, after hours, and holidays.',
                highlight: false,
              },
              {
                icon: Smartphone,
                title: 'Mobile Responsive',
                description: 'Full dashboard access on any device. Check calls from anywhere.',
                highlight: false,
              },
              {
                icon: Download,
                title: 'Export Everything',
                description: 'Download call logs, transcripts, and analytics as CSV for their records.',
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
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Building2 className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300/90">Agency Business Tools</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Run your agency like a pro
              <span className="block mt-1 sm:mt-2 text-[#fafaf9]/40">with enterprise-grade tools</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Beyond reselling—get everything you need to market, sell, and manage 
              your AI receptionist business.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left column - Branding & Marketing */}
            <div>
              <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                <Palette className="h-5 w-5 text-emerald-400" />
                Branding & Marketing
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: 'Complete White-Label',
                    description: 'Your logo, colors, and domain everywhere. VoiceAI Connect is invisible.',
                    badge: null,
                  },
                  {
                    title: 'Marketing Website',
                    description: 'Professional landing page with your branding, features, and pricing.',
                    badge: 'Pro+',
                  },
                  {
                    title: 'Demo Phone Number',
                    description: 'Let prospects call and experience the AI before they buy.',
                    badge: 'Pro+',
                  },
                  {
                    title: 'Custom Domain',
                    description: 'Use youragency.com for your site and client dashboards.',
                    badge: 'Pro+',
                  },
                  {
                    title: 'Sample Recordings',
                    description: 'Pre-recorded demo calls to showcase on your marketing site.',
                    badge: 'Pro+',
                  },
                  {
                    title: 'White-Label Emails',
                    description: 'All notifications come from your domain, not ours.',
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

            {/* Right column - Business & Payments */}
            <div>
              <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                Payments & Management
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: 'Stripe Connect',
                    description: 'Clients pay you directly. Set any price. Keep 100% of revenue.',
                    badge: null,
                  },
                  {
                    title: 'Custom Pricing Tiers',
                    description: 'Create Starter, Pro, Growth plans at your own price points.',
                    badge: null,
                  },
                  {
                    title: 'Client CRM',
                    description: 'View all clients, usage, subscription status, and revenue.',
                    badge: null,
                  },
                  {
                    title: 'Revenue Analytics',
                    description: 'Track MRR, churn, growth trends, and lifetime value.',
                    badge: null,
                  },
                  {
                    title: 'Auto Provisioning',
                    description: 'When clients sign up, their AI is live in 60 seconds. Zero manual setup.',
                    badge: null,
                  },
                  {
                    title: 'API Access',
                    description: 'Integrate with your existing systems via REST API.',
                    badge: 'Pro+',
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
          </div>
        </div>
      </section>

      {/* What You Don't Have to Build */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
                <Code className="h-4 w-4 text-red-400" />
                <span className="text-red-300/90">Build vs. Buy</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                What you don&apos;t have to build
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 leading-relaxed">
                Building this yourself would take 6-12 months and $50K+ in development costs. 
                We&apos;ve done the hard work so you can focus on sales.
              </p>
              
              <div className="mt-8 p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-[#fafaf9]/60">Build yourself</span>
                  <span className="text-xl font-semibold text-red-400">$50,000+</span>
                </div>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
                  <span className="text-sm text-[#fafaf9]/60">Development time</span>
                  <span className="text-xl font-semibold text-red-400">6-12 months</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-[#fafaf9]/60">VoiceAI Connect</span>
                  <span className="text-xl font-semibold text-emerald-400">$199/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#fafaf9]/60">Time to launch</span>
                  <span className="text-xl font-semibold text-emerald-400">24 hours</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: Lock, label: 'Auth System' },
                { icon: Database, label: 'Multi-tenant DB' },
                { icon: Phone, label: 'VAPI Integration' },
                { icon: CreditCard, label: 'Stripe Connect' },
                { icon: PhoneCall, label: 'Phone Provisioning' },
                { icon: FileText, label: 'Transcription' },
                { icon: MessageSquare, label: 'SMS Gateway' },
                { icon: FileAudio, label: 'Recording Storage' },
                { icon: Search, label: 'Knowledge Base' },
                { icon: UserPlus, label: 'Client Onboarding' },
                { icon: Mail, label: 'Email System' },
                { icon: BarChart3, label: 'Analytics Engine' },
                { icon: Webhook, label: 'Webhook System' },
                { icon: Calendar, label: 'Calendar Integration' },
                { icon: Shield, label: 'Security Layer' },
                { icon: Server, label: 'Infrastructure' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                    <item.icon className="h-4 w-4 text-red-400" />
                  </div>
                  <span className="text-sm text-[#fafaf9]/70">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Features - Enterprise Grade */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <CircuitBoard className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Enterprise Infrastructure</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Built for scale and reliability
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              The same infrastructure that powers enterprise contact centers—
              now available for your agency.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: Gauge,
                title: '99.9% Uptime',
                description: 'SLA-backed reliability with redundant systems worldwide.',
              },
              {
                icon: Shield,
                title: 'SOC 2 Compliant',
                description: 'Enterprise-grade security with encrypted data at rest and in transit.',
              },
              {
                icon: Cloud,
                title: 'Global CDN',
                description: 'Fast load times everywhere with edge caching on 200+ nodes.',
              },
              {
                icon: RefreshCw,
                title: 'Auto Scaling',
                description: 'Handle traffic spikes automatically. No performance degradation.',
              },
              {
                icon: Lock,
                title: 'HIPAA Ready',
                description: 'Healthcare-compliant infrastructure for medical practices.',
              },
              {
                icon: Database,
                title: 'Daily Backups',
                description: 'Automatic backups with 30-day retention and instant recovery.',
              },
              {
                icon: Webhook,
                title: 'Webhook Events',
                description: 'Real-time events for call starts, ends, transcripts, and bookings.',
              },
              {
                icon: Code,
                title: 'REST API',
                description: 'Full API access for custom integrations and automations.',
              },
            ].map((feature) => (
              <div 
                key={feature.title} 
                className="p-5 sm:p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 mb-4">
                  <feature.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Partners */}
      <section className="py-20 sm:py-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Powered by industry leaders
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#fafaf9]/50">
              We integrate with the best tools so you don&apos;t have to.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-14 lg:gap-20">
            {/* ElevenLabs */}
            <div className="opacity-50 hover:opacity-100 transition-opacity duration-300">
              <svg className="h-6 sm:h-8 w-auto" viewBox="0 0 130 28" fill="currentColor">
                <path d="M0 0h5.64v28H0zM9.4 0H15v28H9.4zM26.32 22.32h12.56V28H20.04V0h6.28zM58.4 22.32h12.56V28H52.12V0h6.28zM44.68 0h6.28v28h-6.28zM89.12 0h-6.28v28h18.84v-5.68H89.12zM116.12 17.2h6.44v4.72c-1.24.96-3.08 1.48-5.08 1.48-4.68 0-7.64-3.12-7.64-8.4 0-5.16 3.12-8.4 7.8-8.4 2.64 0 4.8.96 6.2 2.8l4.52-3.68C125.44 2.28 121.6 0 116.12 0 107.6 0 102.04 5.96 102.04 14s5.56 14 14.08 14c4.88 0 9.08-1.72 12.04-4.76V12h-12.04v5.2z"/>
              </svg>
            </div>
            
            {/* OpenAI */}
            <div className="opacity-50 hover:opacity-100 transition-opacity duration-300">
              <svg className="h-6 sm:h-8 w-auto" viewBox="0 0 120 28" fill="currentColor">
                <path d="M14 0C6.27 0 0 6.27 0 14s6.27 14 14 14 14-6.27 14-14S21.73 0 14 0zm0 24.5C8.2 24.5 3.5 19.8 3.5 14S8.2 3.5 14 3.5 24.5 8.2 24.5 14 19.8 24.5 14 24.5zm5.23-16.89l-1.65-.95-5.23 9.06-2.12-1.22 5.23-9.06-1.65-.95-5.23 9.06L7.5 13l5.23-9.06-1.65-.95L5.85 12.05c-.95 1.65-.39 3.76 1.26 4.71l.95.55c-.13.43-.2.89-.2 1.36 0 2.6 2.12 4.71 4.71 4.71s4.71-2.12 4.71-4.71c0-.47-.07-.93-.2-1.36l.95-.55c1.65-.95 2.21-3.06 1.26-4.71l-5.23-9.06zm-6.56 15.2c-1.56 0-2.83-1.27-2.83-2.83 0-.24.03-.47.09-.69l2.74 1.58 2.74-1.58c.06.22.09.45.09.69 0 1.56-1.27 2.83-2.83 2.83z"/>
                <path d="M44.8 7.84c-3.92 0-6.72 2.94-6.72 7.14v.14c0 4.2 2.8 7.14 6.72 7.14s6.72-2.94 6.72-7.14v-.14c0-4.2-2.8-7.14-6.72-7.14zm0 11.2c-2.1 0-3.36-1.68-3.36-4.06v-.14c0-2.38 1.26-4.06 3.36-4.06s3.36 1.68 3.36 4.06v.14c0 2.38-1.26 4.06-3.36 4.06zM60.48 7.84c-1.96 0-3.36.98-4.06 2.38V8.12h-3.22v13.72h3.36v-7.28c0-2.1 1.12-3.36 2.8-3.36 1.68 0 2.66 1.12 2.66 3.08v7.56h3.36v-8.26c0-3.64-2.1-5.74-4.9-5.74zM75.6 17.36c-.84 1.12-1.82 1.68-3.08 1.68-2.1 0-3.5-1.68-3.5-4.06v-.14c0-2.38 1.4-4.06 3.5-4.06 1.26 0 2.24.56 3.08 1.68l2.38-2.1c-1.26-1.68-3.08-2.52-5.46-2.52-3.92 0-6.86 2.94-6.86 7.14v.14c0 4.2 2.94 7.14 6.86 7.14 2.38 0 4.2-.84 5.46-2.52l-2.38-2.38zM88.76 7.84c-1.96 0-3.5.84-4.34 2.24V8.12h-3.22v13.72h3.36v-7c0-2.24 1.26-3.64 3.22-3.64 1.82 0 2.94 1.12 2.94 3.22v7.42h3.36v-8.26c0-3.78-2.24-5.74-5.32-5.74zM106.68 2.8h-3.36v18.76h3.36V2.8z"/>
              </svg>
            </div>
            
            {/* Stripe */}
            <div className="opacity-50 hover:opacity-100 transition-opacity duration-300">
              <svg className="h-6 sm:h-8 w-auto" viewBox="0 0 60 25" fill="currentColor">
                <path d="M5 10.14c0-.67.55-1.1 1.45-1.1.96 0 2.16.37 3.12.98V6.74c-1.05-.42-2.09-.58-3.12-.58C3.56 6.16 1.5 7.84 1.5 10.38c0 4.01 5.52 3.37 5.52 5.1 0 .79-.69 1.1-1.65 1.1-1.43 0-3.26-.59-4.7-1.38v3.34c1.6.69 3.22.98 4.7.98 2.98 0 5.04-1.48 5.04-4.05-.01-4.33-5.53-3.56-5.53-5.19l.12-.14zM15.74 6.96l-2.54.54v2.58l2.54-.54v-2.58zm0 3.3h-2.54v9.6h2.54v-9.6zM22.84 10.26l-.16-.8h-2.23v9.6h2.54v-6.51c.6-.78 1.62-1.02 2.73-.84v-2.4c-1.15-.21-2.29.17-2.88.95zM28.24 6.3l-2.5.53v12.69c0 2.35 1.76 3.22 3.52 3.22.92 0 1.6-.17 1.6-.17v-2.06s-.46.08-.97.08c-.81 0-1.65-.32-1.65-1.62v-4.85h2.62v-2.05h-2.62V6.3zM39.24 6.16c-1.48 0-2.43.7-2.96 1.18l-.13-.93h-2.22v13.25l2.54-.54v-3.21c.54.39 1.34.94 2.67.94 2.7 0 5.16-2.17 5.16-6.95 0-4.39-2.5-5.74-5.06-5.74zm-.89 8.87c-.89 0-1.41-.32-1.78-.72v-5.67c.4-.44.94-.8 1.78-.8 1.36 0 2.3 1.52 2.3 3.6 0 2.12-.92 3.59-2.3 3.59zM52.08 6.16c-2.92 0-4.77 2.49-4.77 5.8 0 3.82 2.13 5.78 5.19 5.78 1.49 0 2.62-.34 3.48-.81v-2.02c-.86.42-1.85.67-3.1.67-1.23 0-2.31-.43-2.45-1.93h6.02c.02-.17.04-.84.04-1.14 0-3.31-1.6-5.35-4.41-5.35zm-1.69 4.63c0-1.42.87-2.02 1.65-2.02.75 0 1.58.6 1.58 2.02h-3.23z"/>
              </svg>
            </div>
            
            {/* Twilio */}
            <div className="opacity-50 hover:opacity-100 transition-opacity duration-300">
              <svg className="h-6 sm:h-8 w-auto" viewBox="0 0 80 28" fill="currentColor">
                <path d="M14 0C6.27 0 0 6.27 0 14s6.27 14 14 14 14-6.27 14-14S21.73 0 14 0zm0 24.5C8.2 24.5 3.5 19.8 3.5 14S8.2 3.5 14 3.5 24.5 8.2 24.5 14 19.8 24.5 14 24.5zm-3.5-14a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm7 0a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm-7 7a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm7 0a3.5 3.5 0 110 7 3.5 3.5 0 010-7z"/>
                <path d="M36.4 8.4h2.8v11.2h-2.8V8.4zm5.6 3.92h2.66v1.26c.56-.84 1.54-1.54 3.08-1.54v2.66c-.14-.028-.42-.056-.7-.056-1.12 0-2.1.7-2.1 2.52v4.48h-2.8v-9.24h-.14zm11.76 9.52c-2.94 0-4.9-2.1-4.9-4.9s1.96-4.9 4.76-4.9c2.94 0 4.62 2.1 4.62 5.18v.7h-6.58c.28 1.4 1.26 2.1 2.52 2.1.98 0 1.68-.42 2.1-1.12l2.1 1.26c-.84 1.26-2.38 1.68-4.62 1.68zm-2.1-5.88h3.92c-.14-1.26-.98-2.1-1.96-2.1s-1.82.84-1.96 2.1zm12.04 5.88c-2.94 0-4.9-2.1-4.9-4.9s1.96-4.9 4.76-4.9c2.94 0 4.62 2.1 4.62 5.18v.7h-6.58c.28 1.4 1.26 2.1 2.52 2.1.98 0 1.68-.42 2.1-1.12l2.1 1.26c-.84 1.26-2.38 1.68-4.62 1.68zm-2.1-5.88h3.92c-.14-1.26-.98-2.1-1.96-2.1s-1.82.84-1.96 2.1z"/>
              </svg>
            </div>
            
            {/* Google */}
            <div className="opacity-50 hover:opacity-100 transition-opacity duration-300">
              <svg className="h-6 sm:h-8 w-auto" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
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
                40+ features. Zero development.
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  One flat monthly fee.
                </span>
              </h2>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-[#fafaf9]/50">
                Join 800+ agencies building recurring revenue with VoiceAI Connect.
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
                  href="/#pricing" 
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium text-[#fafaf9] transition-all hover:bg-white/[0.06] hover:border-white/20"
                >
                  View Pricing
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
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
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                <WaveformIcon className="w-5 h-5" />
              </div>
              <span className="font-semibold">VoiceAI Connect</span>
            </Link>
            
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-[#fafaf9]/40">
              <Link href="/platform" className="text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">Platform</Link>
              <Link href="/#pricing" className="hover:text-[#fafaf9] transition-colors">Pricing</Link>
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
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