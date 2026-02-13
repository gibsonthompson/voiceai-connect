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
  Bot, Layers, Workflow, CircuitBoard, Boxes, Coffee, Palmtree
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

export default function PlatformPage() {
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
                { name: 'Referral Program', href: '/referral-program' },
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

            <div className="hidden lg:flex items-center gap-3">
              <Link href="/agency/login" className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">
                Sign In
              </Link>
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
              { name: 'Referral Program', href: '/referral-program' },
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
              <Link href="/agency/login" className="px-4 py-3 text-center text-[#fafaf9]/70 hover:text-[#fafaf9] rounded-lg border border-white/10">Sign In</Link>
              <Link href="/signup" className="px-4 py-3 text-center bg-white text-[#050505] font-medium rounded-full">Start Free Trial</Link>
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
              <span className="text-emerald-300/90">Complete Platform Overview</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
              <span className="block">The Only Platform</span>
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                You Can Run From Your Phone
              </span>
            </h1>
            
            <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-[#fafaf9]/60 max-w-2xl mx-auto leading-relaxed px-4">
              40+ features. Zero fulfillment work. A complete AI receptionist business 
              you manage entirely from your phone. We handle the tech—you just sell.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-sm text-[#fafaf9]/50">
              {['Phone-first dashboard', 'Zero client setup work', 'Launch in 24 hours'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 sm:px-8 py-4 text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]">
                <span>Start Your 14-Day Free Trial</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/#pricing" className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-6 sm:px-8 py-4 text-base font-medium text-[#fafaf9] transition-all hover:bg-white/[0.06] hover:border-white/20">
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
              { value: '60 sec', label: 'Client auto-provisioning' },
              { value: '40+', label: 'Built-in features' },
              { value: '~12 hrs', label: 'Avg. work per week' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-400">{stat.value}</p>
                <p className="text-xs sm:text-sm text-[#fafaf9]/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zero Fulfillment Section */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300/90">Zero Fulfillment</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
                You sell.
                <span className="block text-[#fafaf9]/40">We handle everything else.</span>
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 leading-relaxed">
                Most white-label platforms still make you do the work. VoiceAI Connect 
                handles client setup, technical support, and ongoing maintenance automatically.
              </p>
              
              <div className="mt-8 space-y-4">
                {[
                  { trigger: 'Client signs up', result: 'Platform auto-configures their AI, provisions phone number, imports business info—all in 60 seconds.' },
                  { trigger: 'Client has an issue', result: 'Platform handles support directly. You stay informed, not involved.' },
                  { trigger: 'Client wants changes', result: 'They self-serve in their dashboard. No work for you.' },
                ].map((item) => (
                  <div key={item.trigger} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-sm font-medium text-emerald-400 mb-1">{item.trigger}</p>
                    <p className="text-sm text-[#fafaf9]/60">{item.result}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Phone mockup */}
            <div className="relative flex justify-center">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative w-72 sm:w-80">
                <div className="rounded-[3rem] border-4 border-white/10 bg-[#0a0a0a] p-3 shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#0a0a0a] rounded-b-2xl z-10" />
                  <div className="rounded-[2.5rem] bg-[#080808] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-2 text-xs">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-2 border border-white/40 rounded-sm">
                          <div className="w-3/4 h-full bg-emerald-400 rounded-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pb-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500" />
                        <div>
                          <p className="text-sm font-medium">Your Agency</p>
                          <p className="text-xs text-[#fafaf9]/40">Dashboard</p>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs text-emerald-400 font-medium">New client signup</span>
                        </div>
                        <p className="text-sm font-medium">Smith Plumbing</p>
                        <p className="text-xs text-[#fafaf9]/50 mt-1">Auto-configured • AI live • $149/mo</p>
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
                        <p className="text-xs text-[#fafaf9]/40 mb-1">This Month</p>
                        <p className="text-2xl font-semibold">$6,903</p>
                        <p className="text-xs text-emerald-400 mt-1">↑ 18% • 47 clients</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                          <Users className="h-4 w-4 mx-auto mb-1 text-[#fafaf9]/60" />
                          <span className="text-xs text-[#fafaf9]/60">Clients</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.03] text-center">
                          <BarChart3 className="h-4 w-4 mx-auto mb-1 text-[#fafaf9]/60" />
                          <span className="text-xs text-[#fafaf9]/60">Analytics</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 px-4 py-2 rounded-xl bg-emerald-500 text-[#050505] text-sm font-medium shadow-lg shadow-emerald-500/30">
                  <Smartphone className="h-4 w-4 inline mr-1.5" />
                  Phone-first ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* White-Label Marketing Site + AI Demo */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Globe className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300/90">Professional Plan Feature</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Your branded marketing site
              <span className="block mt-1 sm:mt-2 text-[#fafaf9]/40">with an AI demo that sells for you</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Professional and Scale plans include a complete white-label marketing website.
              But the killer feature? The interactive AI demo line.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="p-6 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
                    <Phone className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-300 mb-2">The Role-Playing AI Demo</h3>
                    <p className="text-sm text-[#fafaf9]/60 leading-relaxed mb-4">
                      When prospects call your demo line, the AI asks about their business—name, 
                      type, hours, common questions. Then it <span className="text-[#fafaf9]/80">transforms into their 
                      receptionist</span> right on the call.
                    </p>
                    <p className="text-sm text-[#fafaf9]/60 leading-relaxed">
                      They can test it, ask questions, and experience exactly what their callers 
                      will hear. It sells itself—prospects convert because they&apos;ve already felt the value.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[#fafaf9]/70 mb-4">Marketing site includes:</h4>
                {[
                  { icon: Sparkles, text: 'Your logo, colors, and branding everywhere' },
                  { icon: Globe, text: 'Custom domain support (youragency.com)' },
                  { icon: Phone, text: 'Interactive AI demo phone number' },
                  { icon: Mic, text: 'Sample call recordings to showcase' },
                  { icon: Code, text: 'Fully editable from your agency dashboard' },
                  { icon: Smartphone, text: 'Mobile-optimized, fast-loading design' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <item.icon className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-[#fafaf9]/70">{item.text}</span>
                  </div>
                ))}
              </div>

              <Link href="/features/marketing-site" className="inline-flex items-center gap-2 mt-6 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                Learn more about the marketing site
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Marketing site mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 bg-[#080808]">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                    <div className="h-3 w-3 rounded-full bg-white/10" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-lg bg-white/[0.03] text-xs text-[#fafaf9]/40 font-mono">
                      smartcallsolutions.com
                    </div>
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-bold">SC</span>
                      </div>
                      <span className="font-semibold">SmartCall Solutions</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Never Miss Another Call</h3>
                    <p className="text-sm text-[#fafaf9]/50">AI-powered receptionist for your business</p>
                  </div>
                  
                  <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                        <Phone className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-300">Try Our AI Demo</span>
                        <p className="text-xs text-[#fafaf9]/50">Experience it as YOUR receptionist</p>
                      </div>
                    </div>
                    <p className="text-2xl font-mono font-semibold text-[#fafaf9]">(555) 123-DEMO</p>
                  </div>
                  
                  <button className="w-full py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium">
                    Get Started — $149/mo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Voice Features */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Bot className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">AI Voice Technology</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              State-of-the-art voice AI
              <span className="block mt-1 sm:mt-2 text-[#fafaf9]/40">that sounds genuinely human</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Zap, title: '500ms Answer Time', description: 'AI picks up before the second ring.', stat: '< 0.5 sec', href: '/features/instant-answer' },
              { icon: Volume2, title: 'Natural Voice', description: 'Premium ElevenLabs voices.', stat: '16+ voices', href: '/features/voice-options' },
              { icon: BrainCircuit, title: 'Context Awareness', description: 'Handles complex conversations.', stat: 'GPT-4 powered', href: '/features/ai-intelligence' },
              { icon: Globe, title: 'Multi-Industry', description: 'Pre-trained for 12+ industries.', stat: '12+ industries', href: '/features/industries' },
            ].map((feature) => (
              <Link key={feature.title} href={feature.href} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.04]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] group-hover:bg-emerald-500/10 transition-colors">
                    <feature.icon className="h-5 w-5 text-[#fafaf9]/60 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">{feature.stat}</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
                <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{feature.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Client Dashboard Features */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-amber-300/90">What Your Clients Get</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Everything businesses need
              <span className="block mt-1 sm:mt-2 text-[#fafaf9]/40">to manage their AI receptionist</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: FileAudio, title: 'Call Recordings', description: 'Every call recorded. One-click playback and download.', highlight: true, href: '/features/call-recordings' },
              { icon: MessageSquare, title: 'SMS Call Summaries', description: 'Instant text after every call with caller details.', highlight: true, href: '/features/sms-summaries' },
              { icon: FileText, title: 'Full Transcripts', description: 'Word-for-word transcription. Searchable and exportable.', highlight: true, href: '/features/transcripts' },
              { icon: Sparkles, title: 'AI Call Summaries', description: 'Intelligent extraction of key details and action items.', highlight: false, href: '/features/ai-summaries' },
              { icon: Search, title: 'Knowledge Base', description: 'AI learns from their website automatically.', highlight: false, href: '/features/knowledge-base' },
              { icon: Phone, title: 'Dedicated Number', description: 'Local or toll-free number for each client.', highlight: false, href: '/features/phone-numbers' },
              { icon: Clock, title: '24/7 AI Coverage', description: 'Never miss a call. Nights, weekends, holidays.', highlight: false, href: '/features/24-7-coverage' },
              { icon: Calendar, title: 'Appointment Booking', description: 'AI books appointments in real-time.', highlight: false, href: '/features/appointments' },
              { icon: BarChart3, title: 'Call Analytics', description: 'Volume trends, peak hours, conversion rates.', highlight: false, href: '/features/analytics' },
            ].map((feature) => (
              <Link key={feature.title} href={feature.href} className={`group relative rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${feature.highlight ? 'border-emerald-500/20 bg-emerald-500/[0.03] hover:border-emerald-500/40 hover:bg-emerald-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'}`}>
                <div className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl mb-4 transition-colors ${feature.highlight ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-white/[0.04] group-hover:bg-white/[0.08]'}`}>
                  <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${feature.highlight ? 'text-emerald-400' : 'text-[#fafaf9]/60'}`} />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
                <p className="text-sm text-[#fafaf9]/50 leading-relaxed">{feature.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/features" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              View all 40+ features
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Agency Tools */}
      <section className="py-20 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4 sm:mb-6">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Agency Business Tools</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Run your agency like a pro
              <span className="block mt-1 sm:mt-2 text-[#fafaf9]/40">all from your phone</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                <Palette className="h-5 w-5 text-emerald-400" />
                Branding & Marketing
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Complete White-Label', description: 'Your logo, colors, domain. We\'re invisible.', badge: null },
                  { title: 'Marketing Website', description: 'Professional site with your branding and pricing.', badge: 'Pro+' },
                  { title: 'Interactive AI Demo', description: 'Demo line that transforms into prospects\' receptionist.', badge: 'Pro+' },
                  { title: 'Custom Domain', description: 'Use youragency.com for everything.', badge: 'Pro+' },
                  { title: 'White-Label Emails', description: 'All notifications from your domain.', badge: 'Scale' },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{feature.title}</h4>
                        {feature.badge && <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-medium text-[#fafaf9]/60">{feature.badge}</span>}
                      </div>
                      <p className="text-sm text-[#fafaf9]/50">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                Payments & Management
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Stripe Connect', description: 'Clients pay you directly. Keep 100%.', badge: null },
                  { title: 'Custom Pricing', description: 'Set your own price tiers.', badge: null },
                  { title: 'Client CRM', description: 'View clients, usage, and revenue.', badge: null },
                  { title: 'Auto Provisioning', description: 'Clients go live in 60 seconds. Zero setup.', badge: null },
                  { title: 'API Access', description: 'Integrate with your systems.', badge: 'Pro+' },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{feature.title}</h4>
                        {feature.badge && <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-medium text-[#fafaf9]/60">{feature.badge}</span>}
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

      {/* Build vs Buy */}
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
                Building this yourself would take 6-12 months and $50K+ in development.
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
                  <span className="text-xl font-semibold text-emerald-400">From $99/mo</span>
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

      {/* Enterprise Infrastructure */}
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
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Gauge, title: '99.9% Uptime', description: 'SLA-backed reliability.' },
              { icon: Shield, title: 'SOC 2 Compliant', description: 'Enterprise-grade security.' },
              { icon: Cloud, title: 'Global CDN', description: 'Fast loads everywhere.' },
              { icon: RefreshCw, title: 'Auto Scaling', description: 'Handles traffic spikes.' },
              { icon: Lock, title: 'HIPAA Ready', description: 'Healthcare compliant.' },
              { icon: Database, title: 'Daily Backups', description: '30-day retention.' },
              { icon: Webhook, title: 'Webhook Events', description: 'Real-time integrations.' },
              { icon: Code, title: 'REST API', description: 'Full API access.' },
            ].map((feature) => (
              <div key={feature.title} className="p-5 sm:p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 mb-4">
                  <feature.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-[#fafaf9]/50">{feature.description}</p>
              </div>
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
                40+ features. Zero fulfillment.
                <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  Manage it all from your phone.
                </span>
              </h2>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-[#fafaf9]/50">
                Join 800+ agencies building recurring revenue with VoiceAI Connect.
              </p>
              
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup" className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]">
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/#pricing" className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium text-[#fafaf9] transition-all hover:bg-white/[0.06] hover:border-white/20">
                  View Pricing
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
              <Link href="/platform" className="text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">Platform</Link>
              <Link href="/#pricing" className="hover:text-[#fafaf9] transition-colors">Pricing</Link>
              <Link href="/blog" className="hover:text-[#fafaf9] transition-colors">Blog</Link>
              <Link href="/referral-program" className="hover:text-[#fafaf9] transition-colors">Referral Program</Link>
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
              <a href="mailto:support@voiceaiconnect.com" className="hover:text-[#fafaf9] transition-colors">Contact</a>
            </div>
            
            <p className="text-sm text-[#fafaf9]/30">© 2026 VoiceAI Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}