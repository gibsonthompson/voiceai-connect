'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowRight, Check, Play, Zap, Clock, Users, DollarSign, 
  ChevronRight, Phone, Mic, Globe, Smartphone, BarChart3, 
  Sparkles, Menu, X, Shield, FileText, Mail, Target
} from 'lucide-react';
import { usePrice } from '@/hooks/usePrice';

// ============================================================================
// STACKING CARDS HOOK — Cross-browser (sticky + scroll listener)
// Based on CodyHouse technique: position sticky on cards, scale on scroll
// ============================================================================
function useStackingCards(cardCount: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scales, setScales] = useState<number[]>(Array(cardCount).fill(1));

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const cards = container.querySelectorAll<HTMLElement>('[data-stack-card]');
    if (!cards.length) return;

    const containerTop = container.getBoundingClientRect().top;
    const newScales: number[] = [];

    cards.forEach((card, i) => {
      const cardTop = card.getBoundingClientRect().top;
      const stickyTop = 80; // matches sticky top offset
      const scrollPast = stickyTop - cardTop;
      
      if (scrollPast > 0 && i < cards.length - 1) {
        // Card is stuck — scale it down as user scrolls past
        const scale = Math.max(0.9, 1 - scrollPast * 0.0004);
        newScales.push(scale);
      } else {
        newScales.push(1);
      }
    });

    setScales(newScales);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { containerRef, scales };
}

// ============================================================================
// COUNTER ANIMATION HOOK
// ============================================================================
function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return { count, ref };
}

// ============================================================================
// FADE IN ON SCROLL HOOK
// ============================================================================
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.1 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ============================================================================
// MAIN LANDING PAGE
// ============================================================================
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBottomCta, setShowBottomCta] = useState(false);
  const { formatPrice: fmtPrice } = usePrice();
  const { containerRef, scales } = useStackingCards(4);

  // Counter animations
  const stat1 = useCountUp(34, 1500);
  const stat2 = useCountUp(106, 2000);
  const stat3 = useCountUp(85, 1800);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBottomCta(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Platform', href: '/platform' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9] overflow-hidden" style={{ fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* ═══ NAVIGATION ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled ? 'bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.06]' : 'bg-transparent'
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img src="/icon-512x512.png" alt="VoiceAI Connect" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-xl" />
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>VoiceAI Connect</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => (
                <Link key={item.name} href={item.href} className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors rounded-lg hover:bg-white/[0.03]">{item.name}</Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link href="/agency/login" className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">Sign In</Link>
              <Link href="/signup" className="group relative inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:shadow-lg hover:shadow-white/10">
                Start Free Trial<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 -mr-2 text-[#fafaf9]/60 hover:text-[#fafaf9]" aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-50 bg-[#050505]/98 backdrop-blur-xl">
            <div className="flex flex-col h-full px-6 pt-8 pb-10">
              <div className="space-y-1 flex-1">
                {navLinks.map((item) => (
                  <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-2 py-4 text-lg text-[#fafaf9]/80 hover:text-[#fafaf9] border-b border-white/[0.04]">{item.name}</Link>
                ))}
                <Link href="/agency/login" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-4 text-lg text-[#fafaf9]/50 hover:text-[#fafaf9]">Sign In</Link>
              </div>
              <div className="pt-6">
                <Link href="/signup" className="flex items-center justify-center gap-2 w-full bg-white text-[#050505] font-medium rounded-full py-4 text-base" onClick={() => setMobileMenuOpen(false)}>
                  Start Free Trial<ArrowRight className="h-5 w-5" />
                </Link>
                <p className="mt-3 text-center text-xs text-[#fafaf9]/30">No credit card required</p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════
          HERO — "Build Your AI Receptionist Agency"
          ═══════════════════════════════════════ */}
      <section className="relative pt-28 sm:pt-36 lg:pt-44 pb-16 sm:pb-28">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-to-b from-emerald-500/[0.06] via-emerald-500/[0.02] to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-1.5 text-sm mb-6 sm:mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-emerald-300/90">White-label AI receptionist platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-[2.5rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight leading-[0.95]" style={{ fontFamily: 'var(--font-sora)' }}>
              <span className="block">Build Your AI</span>
              <span className="block mt-1 sm:mt-3 bg-gradient-to-r from-emerald-400 via-emerald-300 to-white bg-clip-text text-transparent">
                Receptionist Agency
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-[#fafaf9]/55 max-w-2xl mx-auto leading-relaxed">
              The white-label platform that handles the AI, the phone numbers, and the client dashboard. 
              You sell to local businesses and keep every dollar.
            </p>

            {/* Proof points */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#fafaf9]/45">
              {['No coding required', 'Clients live in 60 seconds', 'Keep 100% revenue'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />{item}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href="/signup" className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold text-[#050505] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]">
                Start Your Free Trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/interactive-demo" className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-7 py-4 text-base font-medium text-[#fafaf9] transition-all hover:bg-white/[0.06] hover:border-white/20">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </span>
                Watch Demo
              </Link>
            </div>

            <p className="mt-5 text-sm text-[#fafaf9]/35">No credit card required · 14-day free trial · Cancel anytime</p>
          </div>

          {/* Trust logos */}
          <div className="mt-16 sm:mt-20">
            <p className="text-center text-xs uppercase tracking-[0.2em] text-[#fafaf9]/25 mb-6">Built on enterprise infrastructure</p>
            <div className="flex items-center justify-center gap-8 sm:gap-12 opacity-40 grayscale">
              {['VAPI', 'Telnyx', 'Stripe', 'Supabase'].map((name) => (
                <span key={name} className="text-sm sm:text-base font-semibold tracking-wide text-[#fafaf9]/60" style={{ fontFamily: 'var(--font-sora)' }}>{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          STACKING CARDS — "How It Works"
          Telnyx-inspired scroll-driven stacking
          ═══════════════════════════════════════ */}
      <section id="how-it-works" className="relative border-t border-white/[0.06] scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">How It Works</span>
          </div>
          <h2 className="text-center text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--font-sora)' }}>
            From signup to revenue.
          </h2>
          <p className="text-center text-lg text-[#fafaf9]/45 max-w-xl mx-auto mb-4">
            Four steps. One afternoon. Your first client could come this week.
          </p>
        </div>

        {/* Stacking cards container */}
        <div ref={containerRef} className="mx-auto max-w-4xl px-4 sm:px-6 pb-16 sm:pb-32">
          {[
            {
              step: '01',
              title: 'Brand it as yours',
              description: 'Upload your logo, pick your colors, set your pricing. The signup page, client dashboard, and marketing site all show your brand. VoiceAI Connect is invisible.',
              accent: 'from-emerald-500/20 to-emerald-500/5',
              border: 'border-emerald-500/20',
              icon: Sparkles,
              iconColor: 'text-emerald-400',
              detail: '10 minutes to set up',
            },
            {
              step: '02',
              title: 'Connect Stripe',
              description: 'Link your Stripe account. When clients subscribe, money goes directly to you. No middleman, no revenue share, no per-client fees. You set the price.',
              accent: 'from-blue-500/20 to-blue-500/5',
              border: 'border-blue-500/20',
              icon: DollarSign,
              iconColor: 'text-blue-400',
              detail: '5 minutes',
            },
            {
              step: '03',
              title: 'Share your signup link',
              description: "Send your branded page to a local business. They fill out a form, the platform provisions their AI receptionist and phone number automatically. They're live in 60 seconds.",
              accent: 'from-amber-500/20 to-amber-500/5',
              border: 'border-amber-500/20',
              icon: Users,
              iconColor: 'text-amber-400',
              detail: 'Fully automated',
            },
            {
              step: '04',
              title: 'Collect recurring revenue',
              description: "Payments hit your Stripe monthly. The AI answers calls 24/7. Clients see their own dashboard with recordings, transcripts, and summaries. You focus on adding more clients.",
              accent: 'from-purple-500/20 to-purple-500/5',
              border: 'border-purple-500/20',
              icon: BarChart3,
              iconColor: 'text-purple-400',
              detail: 'Every month',
            },
          ].map((card, i) => (
            <div key={card.step} data-stack-card className="sticky mb-6 sm:mb-8" style={{ top: `${80 + i * 20}px`, zIndex: 10 + i }}>
              <div
                className={`relative rounded-2xl sm:rounded-3xl border ${card.border} bg-gradient-to-br ${card.accent} backdrop-blur-sm p-6 sm:p-10 transition-transform duration-300 ease-out`}
                style={{
                  transform: `scale(${scales[i] || 1})`,
                  transformOrigin: 'center top',
                  backgroundColor: 'rgba(10,10,10,0.85)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl sm:text-6xl font-bold text-white/[0.04]" style={{ fontFamily: 'var(--font-sora)' }}>{card.step}</span>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08]`}>
                        <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-semibold mb-3" style={{ fontFamily: 'var(--font-sora)' }}>{card.title}</h3>
                    <p className="text-[#fafaf9]/55 leading-relaxed text-base">{card.description}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm text-[#fafaf9]/35">
                      <Clock className="h-3.5 w-3.5" />
                      {card.detail}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Post-stack CTA */}
        <div className="text-center pb-16 sm:pb-24">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] px-6 py-4">
            <Zap className="h-5 w-5 text-emerald-400" />
            <p className="text-base">
              <span className="text-emerald-300 font-medium">Zero fulfillment.</span>
              <span className="text-[#fafaf9]/50 ml-1">The platform handles AI setup, phone provisioning, and client support.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          THE PROBLEM — Revenue opportunity
          ═══════════════════════════════════════ */}
      <section className="py-16 sm:py-24 lg:py-32 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.008] to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — the problem */}
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">The Opportunity</span>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]" style={{ fontFamily: 'var(--font-sora)' }}>
                Local businesses lose money
                <span className="block text-[#fafaf9]/35 mt-1">every time the phone rings.</span>
              </h2>
              <p className="mt-6 text-lg text-[#fafaf9]/50 leading-relaxed">
                Every plumber, dentist, and contractor misses calls. A single missed call can cost $500+. 
                They need 24/7 coverage but a human receptionist costs $3,000/month.
              </p>
              <p className="mt-4 text-lg text-[#fafaf9]/50 leading-relaxed">
                You offer them an AI receptionist at $99-299/month. They save money. You build recurring revenue. 
                The platform makes it possible without writing a line of code.
              </p>

              {/* Animated stats */}
              <div className="mt-10 grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-3xl sm:text-4xl font-bold text-emerald-400" ref={stat1.ref as any} style={{ fontFamily: 'var(--font-sora)' }}>{stat1.count}%</p>
                  <p className="text-xs text-[#fafaf9]/40 mt-1">of calls go unanswered</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-3xl sm:text-4xl font-bold text-emerald-400" ref={stat2.ref as any} style={{ fontFamily: 'var(--font-sora)' }}>${stat2.count}B</p>
                  <p className="text-xs text-[#fafaf9]/40 mt-1">lost annually to missed calls</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-3xl sm:text-4xl font-bold text-emerald-400" ref={stat3.ref as any} style={{ fontFamily: 'var(--font-sora)' }}>{stat3.count}%</p>
                  <p className="text-xs text-[#fafaf9]/40 mt-1">won&apos;t call back if unanswered</p>
                </div>
              </div>
            </div>

            {/* Right — revenue calculator */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 sm:p-8">
                <p className="text-xs uppercase tracking-[0.2em] text-[#fafaf9]/30 mb-8" style={{ fontFamily: 'var(--font-sora)' }}>Revenue Calculator</p>
                <div className="space-y-6">
                  <div className="flex justify-between items-baseline border-b border-white/[0.06] pb-5">
                    <span className="text-[#fafaf9]/55">50 clients × $149/mo</span>
                    <span className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-sora)' }}>$7,450</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-white/[0.06] pb-5">
                    <span className="text-[#fafaf9]/55">Your platform cost</span>
                    <span className="text-2xl font-semibold text-[#fafaf9]/35" style={{ fontFamily: 'var(--font-sora)' }}>−$199</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-[#fafaf9]/70 font-medium">Monthly profit</span>
                    <span className="text-4xl font-bold text-emerald-400" style={{ fontFamily: 'var(--font-sora)' }}>$7,251</span>
                  </div>
                </div>
                <div className="mt-8 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                  <p className="text-sm text-emerald-300/80 leading-relaxed">
                    <strong className="text-emerald-300">That&apos;s 97% margin.</strong> Same $199 platform fee 
                    whether you have 10 clients or 100. Revenue scales. Costs don&apos;t.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          COMPARISON TABLE — vs GoHighLevel & others
          ═══════════════════════════════════════ */}
      <section className="py-16 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">Competition</span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
              Not retrofitted for resale.
              <span className="block text-[#fafaf9]/35 mt-1">Built for it.</span>
            </h2>
            <p className="mt-4 text-lg text-[#fafaf9]/45 max-w-2xl mx-auto">
              Most platforms bolt on white-labeling as an afterthought. VoiceAI Connect was architected 
              for agency-to-client resale from day one.
            </p>
          </div>

          {/* Comparison grid */}
          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-4 pr-4 text-[#fafaf9]/40 font-medium w-[240px]">Feature</th>
                  <th className="py-4 px-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="font-semibold text-emerald-300" style={{ fontFamily: 'var(--font-sora)' }}>VoiceAI Connect</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center text-[#fafaf9]/50">GoHighLevel</th>
                  <th className="py-4 px-4 text-center text-[#fafaf9]/50">Autocalls</th>
                  <th className="py-4 px-4 text-center text-[#fafaf9]/50 hidden sm:table-cell">echowin</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Client-facing dashboard', vaic: true, ghl: false, auto: false, echo: false },
                  { feature: '60-second client onboarding', vaic: true, ghl: false, auto: false, echo: false },
                  { feature: 'No A2P registration required', vaic: true, ghl: false, auto: true, echo: true },
                  { feature: 'Built-in leads CRM + templates', vaic: true, ghl: false, auto: false, echo: false },
                  { feature: 'Mobile-first design', vaic: true, ghl: false, auto: true, echo: true },
                  { feature: 'Interactive demo phone line', vaic: true, ghl: false, auto: false, echo: false },
                  { feature: 'Flat pricing (no per-client fees)', vaic: true, ghl: false, auto: true, echo: false },
                  { feature: 'White-label marketing website', vaic: true, ghl: false, auto: true, echo: true },
                  { feature: 'Stripe Connect (direct payments)', vaic: true, ghl: true, auto: false, echo: false },
                ].map((row, i) => (
                  <tr key={row.feature} className={`border-b border-white/[0.04] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="py-3.5 pr-4 text-[#fafaf9]/60">{row.feature}</td>
                    <td className="py-3.5 px-4 text-center">
                      {row.vaic ? <Check className="h-5 w-5 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-[#fafaf9]/20 mx-auto" />}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.ghl ? <Check className="h-5 w-5 text-[#fafaf9]/40 mx-auto" /> : <X className="h-4 w-4 text-[#fafaf9]/20 mx-auto" />}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {row.auto ? <Check className="h-5 w-5 text-[#fafaf9]/40 mx-auto" /> : <X className="h-4 w-4 text-[#fafaf9]/20 mx-auto" />}
                    </td>
                    <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                      {row.echo ? <Check className="h-5 w-5 text-[#fafaf9]/40 mx-auto" /> : <X className="h-4 w-4 text-[#fafaf9]/20 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRICING
          ═══════════════════════════════════════ */}
      <section id="pricing" className="py-16 sm:py-24 lg:py-32 border-t border-white/[0.06] scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">Pricing</span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
              Flat fee. No surprises.
            </h2>
            <p className="mt-4 text-lg text-[#fafaf9]/45">
              Same price whether you have 10 clients or 100. No per-client fees. No revenue share.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-5">
            {[
              {
                name: 'Starter', price: 99, description: 'Test the waters',
                features: ['Up to 25 clients', 'White-label client dashboard', 'Leads CRM + email templates', 'Stripe Connect payments', 'Email support'],
                limits: ['Subdomain only', 'No marketing site'],
              },
              {
                name: 'Professional', price: 199, description: 'Most agencies start here', popular: true,
                features: ['Up to 100 clients', '3 agency + 2 client team members', 'Full marketing website', 'Interactive AI demo line', 'Custom domain', 'API access', 'Priority support'],
                limits: [],
              },
              {
                name: 'Enterprise', price: 499, description: 'Scale without limits',
                features: ['Unlimited clients', '10 agency + 5 client team members', 'Everything in Professional', 'Dedicated success manager', 'SLA guarantee', 'Phone support'],
                limits: [],
              },
            ].map((tier) => (
              <div key={tier.name} className={`relative rounded-2xl border p-6 sm:p-8 transition-all ${
                tier.popular
                  ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.06] to-transparent lg:scale-105'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
              }`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-[#050505]">Most Popular</span>
                  </div>
                )}
                <p className="text-sm text-[#fafaf9]/45">{tier.description}</p>
                <p className="text-xl font-semibold mt-1" style={{ fontFamily: 'var(--font-sora)' }}>{tier.name}</p>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold" style={{ fontFamily: 'var(--font-sora)' }}>{fmtPrice(tier.price)}</span>
                  <span className="text-[#fafaf9]/45">/mo</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#fafaf9]/65">{f}</span>
                    </li>
                  ))}
                  {tier.limits?.map((l) => (
                    <li key={l} className="flex items-start gap-2.5 text-sm">
                      <X className="h-4 w-4 text-[#fafaf9]/15 shrink-0 mt-0.5" />
                      <span className="text-[#fafaf9]/30">{l}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`block w-full rounded-full py-3.5 text-center text-sm font-medium transition-all ${
                  tier.popular
                    ? 'bg-white text-[#050505] hover:bg-[#fafaf9] hover:shadow-lg hover:shadow-white/10'
                    : 'bg-white/[0.06] text-[#fafaf9] hover:bg-white/[0.12] border border-white/[0.08]'
                }`}>
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-[#fafaf9]/35">
            All plans include a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FAQ
          ═══════════════════════════════════════ */}
      <section id="faq" className="py-16 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>Common Questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Wait — is this another 'make money with AI' thing?", a: "No courses. No upsells. No guru nonsense. VoiceAI Connect is infrastructure — the same way Shopify lets you start a store without building an e-commerce platform from scratch. You get a real white-label platform, real clients pay you real money every month, and you keep 100% of what you charge. The math is simple and the business model is proven: local businesses need phone coverage, and AI does it for a fraction of what a human receptionist costs." },
              { q: "What exactly is VoiceAI Connect?", a: "It's the complete infrastructure for running an AI receptionist agency. Think of it as 'Shopify for AI receptionists.' You brand the platform as your own company, find local businesses that miss phone calls (plumbers, dentists, lawyers, etc.), and sell them an AI receptionist service at $99-299/month. When they sign up through your branded page, the platform automatically configures their AI, provisions a phone number, and creates their dashboard. You collect the payment. We handle everything else." },
              { q: "Do my clients know about VoiceAI Connect?", a: "No. Your logo, your colors, your domain. The client dashboard, emails, marketing site, and phone experience all show your brand. VoiceAI Connect is completely invisible. As far as your clients know, you built the technology." },
              { q: "How do I actually get clients?", a: "We provide sales scripts, 13+ email/SMS outreach templates, and a built-in leads CRM to track prospects. Most agencies use cold outreach to local businesses (plumbers, dentists, lawyers), Facebook/Instagram ads, or content marketing. The interactive AI demo phone line is your secret weapon — prospects call it, tell the AI about their business, and it transforms into their receptionist right on the call. It sells itself." },
              { q: "What's the difference between this and GoHighLevel?", a: "GoHighLevel is a Swiss Army knife for marketing agencies — CRMs, funnels, email, SMS, websites, and more. If you need all of that, GHL is great. VoiceAI Connect does one thing extremely well: AI receptionist resale. The key differences: clients get their own dashboard (GHL has none), onboarding takes 60 seconds (GHL takes days due to A2P registration), and you run the whole business from your phone (GHL is desktop-first). If you're building specifically an AI receptionist agency, you don't need a Swiss Army knife — you need a scalpel." },
              { q: "Do I need technical skills?", a: "No. If you can use Instagram, you can run this business. Upload your logo, pick colors, set prices, share your link. That's the entire technical requirement. The platform handles AI configuration, phone number provisioning, call routing, and everything else automatically." },
              { q: "How does pricing work?", a: "You pay us a flat monthly fee ($99-499 depending on your plan). You charge your clients whatever you want — most agencies charge $99-299/month per client. There are no per-client fees, no usage fees, and no revenue share. 10 clients or 100, your platform cost stays the same." },
              { q: "Can I really charge $99-299/month for this?", a: "Yes, and many charge more. A single missed call can cost a business $500+. A part-time human receptionist costs $2,000-3,000/month. For 24/7 AI coverage at $149/month? It's a no-brainer for them. You're not selling software — you're selling the solution to a problem that's already costing them money." },
            ].map((item, i) => (
              <details key={i} className="group rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
                <summary className="flex items-center justify-between p-5 sm:p-6 cursor-pointer list-none select-none">
                  <h3 className="text-base font-medium pr-4">{item.q}</h3>
                  <ChevronRight className="h-5 w-5 text-[#fafaf9]/30 shrink-0 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <p className="text-sm text-[#fafaf9]/55 leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════ */}
      <section className="py-16 sm:py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-emerald-500/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
                This is how you start
                <span className="block mt-1 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                  an AI business.
                </span>
              </h2>
              <p className="mt-6 text-lg text-[#fafaf9]/50 max-w-lg mx-auto">
                Real infrastructure. Real clients. Real recurring revenue. 
                Not a course — a platform.
              </p>
              <div className="mt-10">
                <Link href="/signup" className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#050505] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]">
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <p className="mt-5 text-sm text-[#fafaf9]/35">No credit card required · 14-day free trial · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] py-10 sm:py-12 pb-28 sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <img src="/icon-512x512.png" alt="VoiceAI Connect" className="h-7 w-7 rounded-lg" />
                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-sora)' }}>VoiceAI Connect</span>
              </Link>
              <p className="text-xs text-[#fafaf9]/35 leading-relaxed">The white-label platform for AI receptionist agencies.</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#fafaf9]/25 mb-3">Product</p>
              <div className="space-y-2">
                {[['Platform', '/platform'], ['Features', '/features'], ['Pricing', '/#pricing'], ['Blog', '/blog']].map(([name, href]) => (
                  <Link key={name} href={href} className="block text-sm text-[#fafaf9]/40 hover:text-[#fafaf9] transition-colors">{name}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#fafaf9]/25 mb-3">Compare</p>
              <div className="space-y-2">
                {[['vs GoHighLevel', '/blog/voiceai-connect-vs-gohighlevel'], ['vs Autocalls', '/blog/voiceai-connect-vs-autocalls'], ['vs echowin', '/blog/voiceai-connect-vs-echowin']].map(([name, href]) => (
                  <Link key={name} href={href} className="block text-sm text-[#fafaf9]/40 hover:text-[#fafaf9] transition-colors">{name}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#fafaf9]/25 mb-3">Legal</p>
              <div className="space-y-2">
                {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Contact', 'mailto:support@voiceaiconnect.com']].map(([name, href]) => (
                  <Link key={name} href={href} className="block text-sm text-[#fafaf9]/40 hover:text-[#fafaf9] transition-colors">{name}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/[0.06] text-center">
            <p className="text-xs text-[#fafaf9]/20">© 2026 VoiceAI Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
        showBottomCta && !mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}>
        <div className="bg-[#050505]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 pt-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <Link href="/signup" className="flex items-center justify-center gap-2 w-full bg-white text-[#050505] font-medium rounded-full py-3.5 text-sm active:scale-[0.98] transition-transform">
            Start Free Trial — No Card Required<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}