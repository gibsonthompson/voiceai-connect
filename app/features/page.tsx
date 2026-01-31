'use client';

import Link from 'next/link';
import { 
  Phone, ArrowRight, Check, Zap, Shield, Clock, Users, 
  ChevronRight, MessageSquare, FileText, Mic, Globe, 
  Smartphone, BarChart3, Calendar, Bell, Headphones, Code,
  Building2, Sparkles, Menu, X, Volume2, BrainCircuit,
  FileAudio, Search, AlertTriangle, Voicemail, Timer,
  Palette, CreditCard, UserPlus, Webhook, Database, Lock,
  Cloud, RefreshCw, Gauge, Mail, Settings, Download,
  Bot, Layers, CircuitBoard, Play
} from 'lucide-react';
import { useState, useEffect } from 'react';

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

export default function FeaturesIndexPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featureCategories = [
    {
      title: 'AI Voice Technology',
      description: 'State-of-the-art conversational AI that sounds genuinely human',
      icon: Bot,
      color: 'emerald',
      features: [
        { icon: Zap, title: '500ms Answer Time', description: 'AI picks up before the second ring. No waiting, no hold music.', href: '/features/instant-answer', stat: '< 0.5 sec' },
        { icon: Volume2, title: 'Natural Voice Options', description: 'Premium ElevenLabs voices that sound warm and professional.', href: '/features/voice-options', stat: '16+ voices' },
        { icon: BrainCircuit, title: 'AI Intelligence', description: 'GPT-4 powered conversations that handle complex dialogues.', href: '/features/ai-intelligence', stat: 'GPT-4' },
        { icon: Globe, title: 'Multi-Industry Training', description: 'Pre-trained for healthcare, legal, home services, and more.', href: '/features/industries', stat: '12+ industries' },
      ],
    },
    {
      title: 'Call Management',
      description: 'Everything your clients need to manage their calls',
      icon: Phone,
      color: 'amber',
      features: [
        { icon: FileAudio, title: 'Call Recordings', description: 'Every call recorded and stored. One-click playback and download.', href: '/features/call-recordings', stat: 'Unlimited' },
        { icon: MessageSquare, title: 'SMS Call Summaries', description: 'Instant text after every call with caller name, phone, and reason.', href: '/features/sms-summaries', stat: 'Real-time' },
        { icon: FileText, title: 'Full Transcripts', description: 'Word-for-word transcription. Searchable and exportable.', href: '/features/transcripts', stat: '99% accuracy' },
        { icon: Sparkles, title: 'AI Call Summaries', description: 'Intelligent extraction of key details and action items.', href: '/features/ai-summaries', stat: 'Auto-generated' },
        { icon: AlertTriangle, title: 'Urgency Detection', description: 'AI identifies emergency calls and escalates immediately.', href: '/features/urgency-detection', stat: 'Instant alerts' },
        { icon: Voicemail, title: 'Voicemail Transcription', description: 'When needed, voicemails are transcribed and delivered.', href: '/features/voicemail', stat: 'Included' },
      ],
    },
    {
      title: 'Business Operations',
      description: 'Tools that help businesses run more efficiently',
      icon: Building2,
      color: 'emerald',
      features: [
        { icon: Phone, title: 'Dedicated Phone Numbers', description: 'Local or toll-free number for each client. Instant provisioning.', href: '/features/phone-numbers', stat: 'Instant setup' },
        { icon: Clock, title: '24/7 AI Coverage', description: 'Never miss a call. Nights, weekends, holidays. Always on.', href: '/features/24-7-coverage', stat: '365 days/year' },
        { icon: Calendar, title: 'Appointment Booking', description: 'AI checks Google Calendar and books appointments in real-time.', href: '/features/appointments', stat: 'Auto-booking' },
        { icon: Search, title: 'Knowledge Base', description: 'AI scrapes their website and learns services, pricing, hours, FAQs.', href: '/features/knowledge-base', stat: 'Auto-learning' },
        { icon: Timer, title: 'Business Hours', description: 'Custom greetings for open hours, after hours, and holidays.', href: '/features/business-hours', stat: 'Customizable' },
        { icon: Bell, title: 'Real-time Notifications', description: 'Push, email, and SMS alerts for urgent calls and bookings.', href: '/features/notifications', stat: 'Multi-channel' },
      ],
    },
    {
      title: 'Analytics & Insights',
      description: 'Data to understand and grow the business',
      icon: BarChart3,
      color: 'amber',
      features: [
        { icon: BarChart3, title: 'Call Analytics', description: 'Volume trends, peak hours, common requests, conversion rates.', href: '/features/analytics', stat: 'Real-time' },
        { icon: Download, title: 'Export Everything', description: 'Download call logs, transcripts, and analytics as CSV.', href: '/features/exports', stat: 'One-click' },
        { icon: Smartphone, title: 'Mobile Dashboard', description: 'Full access on any device. Check calls from anywhere.', href: '/features/mobile-dashboard', stat: 'Responsive' },
      ],
    },
    {
      title: 'Agency Tools',
      description: 'Everything you need to run your white-label business',
      icon: Layers,
      color: 'emerald',
      features: [
        { icon: Palette, title: 'Complete White-Label', description: 'Your logo, colors, and domain everywhere. We\'re invisible.', href: '/features/white-label', stat: '100% yours' },
        { icon: Globe, title: 'Marketing Website', description: 'Professional landing page with your branding and pricing.', href: '/features/marketing-site', stat: 'Pro+', badge: 'Pro+' },
        { icon: Play, title: 'Interactive AI Demo', description: 'Demo line where prospects experience AI as their receptionist.', href: '/features/ai-demo', stat: '3x conversion', badge: 'Pro+' },
        { icon: CreditCard, title: 'Stripe Connect', description: 'Clients pay you directly. Set any price. Keep 100%.', href: '/features/stripe-connect', stat: 'No fees' },
        { icon: Users, title: 'Client CRM', description: 'View all clients, usage, subscriptions, and revenue.', href: '/features/client-crm', stat: 'Included' },
        { icon: UserPlus, title: 'Auto Provisioning', description: 'Clients go live in 60 seconds. Zero manual setup.', href: '/features/auto-provisioning', stat: '60 seconds' },
        { icon: Webhook, title: 'API & Webhooks', description: 'Full REST API for custom integrations and automations.', href: '/features/api-access', stat: 'Full access', badge: 'Pro+' },
      ],
    },
    {
      title: 'Enterprise Infrastructure',
      description: 'Built for scale and reliability',
      icon: CircuitBoard,
      color: 'amber',
      features: [
        { icon: Gauge, title: '99.9% Uptime', description: 'SLA-backed reliability with redundant systems.', href: '/features/uptime', stat: 'Guaranteed' },
        { icon: Shield, title: 'SOC 2 Compliant', description: 'Enterprise-grade security with encrypted data.', href: '/features/security', stat: 'Certified' },
        { icon: Lock, title: 'HIPAA Ready', description: 'Healthcare-compliant infrastructure for medical practices.', href: '/features/hipaa', stat: 'Available' },
        { icon: Database, title: 'Daily Backups', description: 'Automatic backups with 30-day retention.', href: '/features/backups', stat: '30 days' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9] overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full blur-[128px]" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
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
                <Link key={item.name} href={item.href} className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors rounded-lg hover:bg-white/[0.03]">
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link href="/agency/login" className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">Sign In</Link>
              <Link href="/signup" className="group relative inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:shadow-lg hover:shadow-white/10">
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 -mr-2 text-[#fafaf9]/60 hover:text-[#fafaf9]">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <div className={`lg:hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-4 pb-6 pt-2 space-y-1 bg-[#050505]/95 backdrop-blur-xl border-b border-white/[0.06]">
            {[
              { name: 'Platform', href: '/platform' },
              { name: 'How It Works', href: '/how-it-works' },
              { name: 'Pricing', href: '/#pricing' },
              { name: 'Blog', href: '/blog' },
            ].map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-[#fafaf9]/70 hover:text-[#fafaf9] hover:bg-white/[0.03] rounded-lg transition-colors">
                {item.name}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/agency/login" className="px-4 py-3 text-center text-[#fafaf9]/70 hover:text-[#fafaf9] rounded-lg border border-white/10">Sign In</Link>
              <Link href="/signup" className="px-4 py-3 text-center bg-white text-[#050505] font-medium rounded-full">Start Free Trial</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 lg:pt-40 pb-16 sm:pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/[0.07] via-amber-500/[0.03] to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6 sm:mb-8">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">40+ Features</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
              <span className="block">Everything You Need</span>
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                Nothing You Don&apos;t
              </span>
            </h1>
            
            <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-[#fafaf9]/60 max-w-2xl mx-auto leading-relaxed px-4">
              A complete AI receptionist platform with every feature your clients need—and 
              every tool you need to run a profitable agency.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-sm text-[#fafaf9]/50">
              {[
                'Zero fulfillment work',
                'Phone-native dashboard', 
                'All plans include core features'
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="border-y border-white/[0.06] bg-white/[0.01] py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {[
              { value: '40+', label: 'Built-in features' },
              { value: '500ms', label: 'Answer time' },
              { value: '60 sec', label: 'Client setup' },
              { value: '99.9%', label: 'Uptime SLA' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-400">{stat.value}</p>
                <p className="text-xs sm:text-sm text-[#fafaf9]/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      {featureCategories.map((category, categoryIdx) => (
        <section 
          key={category.title} 
          className={`py-16 sm:py-20 lg:py-24 border-b border-white/[0.06] ${
            categoryIdx % 2 === 0 ? '' : 'bg-gradient-to-b from-white/[0.01] to-transparent'
          }`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-8 sm:mb-12">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                category.color === 'emerald' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
              }`}>
                <category.icon className={`h-6 w-6 ${
                  category.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
                }`} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{category.title}</h2>
                <p className="text-[#fafaf9]/50 mt-1">{category.description}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {category.features.map((feature) => (
                <Link 
                  key={feature.title}
                  href={feature.href}
                  className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                      category.color === 'emerald' 
                        ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' 
                        : 'bg-amber-500/10 group-hover:bg-amber-500/20'
                    }`}>
                      <feature.icon className={`h-5 w-5 ${
                        category.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
                      }`} />
                    </div>
                    <div className="flex items-center gap-2">
                      {'badge' in feature && feature.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-medium text-[#fafaf9]/60">
                          {feature.badge}
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        category.color === 'emerald' 
                          ? 'text-emerald-400 bg-emerald-400/10' 
                          : 'text-amber-400 bg-amber-400/10'
                      }`}>
                        {feature.stat}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium mb-2 group-hover:text-emerald-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{feature.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Compare Plans CTA */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
            See what&apos;s included in each plan
          </h2>
          <p className="text-[#fafaf9]/50 mb-8">
            Compare features across Starter, Professional, and Scale plans
          </p>
          <Link 
            href="/pricing"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium transition-all hover:bg-white/[0.06] hover:border-white/20"
          >
            View Pricing & Compare Plans
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 blur-3xl" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
                40+ features. Zero fulfillment.
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  All from your phone.
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
                  href="/platform" 
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium text-[#fafaf9] transition-all hover:bg-white/[0.06] hover:border-white/20"
                >
                  Platform Overview
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              
              <p className="mt-5 sm:mt-6 text-sm text-[#fafaf9]/40">
                14-day free trial · Cancel anytime
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
              <Link href="/platform" className="hover:text-[#fafaf9] transition-colors">Platform</Link>
              <Link href="/features" className="text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">Features</Link>
              <Link href="/how-it-works" className="hover:text-[#fafaf9] transition-colors">How It Works</Link>
              <Link href="/blog" className="hover:text-[#fafaf9] transition-colors">Blog</Link>
              <Link href="/pricing" className="hover:text-[#fafaf9] transition-colors">Pricing</Link>
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