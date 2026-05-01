'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight, ArrowDown, ArrowRight, Check, X as XIcon, Phone,
  Mic, CreditCard, Plus,
  Globe, Wand2, BarChart3, Lock, Smartphone, Map, Palette, MonitorSmartphone, Rocket,
} from 'lucide-react';
import { usePrice } from '@/hooks/usePrice';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

/* ─── Brand icons — monochrome, currentColor, 24x24 viewBox ─────────────── */

const BRAND_ICONS: Record<string, React.ReactNode> = {
  // ElevenLabs — two parallel bars (their actual mark)
  elevenlabs: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="3" width="4.2" height="18" rx="0.4" />
      <rect x="13.8" y="3" width="4.2" height="18" rx="0.4" />
    </svg>
  ),
  // Anthropic — 12-ray radial burst (matches their distinctive asterisk mark)
  anthropic: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x="11.4"
          y="2.4"
          width="1.2"
          height="9.5"
          rx="0.6"
          transform={`rotate(${i * 30} 12 12)`}
        />
      ))}
    </svg>
  ),
  // OpenAI — abstract hex with internal radii (suggestive, not literal)
  openai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
      <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  // Telnyx — geometric T mark
  telnyx: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="3" y="4" width="18" height="3.6" rx="0.4" />
      <rect x="10.2" y="4" width="3.6" height="16" rx="0.4" />
    </svg>
  ),
  twilio: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.4a9.6 9.6 0 1 0 0 19.2 9.6 9.6 0 0 0 0-19.2zm0 17.4a7.8 7.8 0 1 1 0-15.6 7.8 7.8 0 0 1 0 15.6z" />
      <circle cx="9" cy="9" r="1.6" />
      <circle cx="15" cy="9" r="1.6" />
      <circle cx="9" cy="15" r="1.6" />
      <circle cx="15" cy="15" r="1.6" />
    </svg>
  ),
  stripe: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 9.9c-1.6-.6-2.5-1-2.5-1.7 0-.6.5-.9 1.3-.9 1.5 0 3 .6 4 1.1L17 4.8c-1-.4-2.9-.8-4.8-.8C9 4 6.7 5.7 6.7 8.5c0 5 6.9 4.2 6.9 6.3 0 .7-.7 1.1-1.6 1.1-1.6 0-3.7-.7-5.2-1.5l-.6 4.1c1.2.6 3.5 1.2 5.7 1.2 3.4 0 5.7-1.7 5.7-4.5 0-3.1-3.1-3.7-4.1-4.2z" />
    </svg>
  ),
  supabase: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.6 2.5c.4-.5 1.2-.2 1.2.5v8h6.5c.6 0 1 .7.6 1.2l-7.5 9.3c-.4.5-1.2.2-1.2-.5v-8H4.7c-.6 0-1-.7-.6-1.2l7.5-9.3z" />
    </svg>
  ),
  // Make — concentric arches (suggests their wave/automation mark)
  make: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M3 17a9 9 0 0 1 18 0" />
      <path d="M6.5 17a5.5 5.5 0 0 1 11 0" />
      <path d="M10 17a2 2 0 0 1 4 0" />
    </svg>
  ),
  n8n: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <circle cx="4.5" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="6" r="2" fill="currentColor" />
      <circle cx="12" cy="18" r="2" fill="currentColor" />
      <circle cx="19.5" cy="12" r="2" fill="currentColor" />
      <path d="M6.3 11.2 10.4 7M6.3 12.8 10.4 17M13.6 7l4.1 4.2M13.6 17l4.1-4.2" />
    </svg>
  ),
  vercel: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3.5 22 20.5H2L12 3.5z" />
    </svg>
  ),
  cloudflare: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.7 12.5c-.4 0-.8.05-1.2.15A6 6 0 0 0 4 14a3.5 3.5 0 0 0-3 3.5A3.5 3.5 0 0 0 4.5 21h13a4 4 0 0 0 4-4 4 4 0 0 0-4.8-3.95v-.55z" />
    </svg>
  ),
  brevo: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 3h6.5c2.6 0 4.7 1.9 4.7 4.4 0 1.4-.7 2.7-1.7 3.5 1.6.7 2.8 2.4 2.8 4.3 0 2.7-2.3 4.8-5.1 4.8H5V3zm2.7 2.5v4.7h3.6c1.4 0 2.5-1 2.5-2.35S12.7 5.5 11.3 5.5H7.7zm0 7.2v5.5h4.4c1.7 0 3-1.2 3-2.75s-1.3-2.75-3-2.75H7.7z" />
    </svg>
  ),

  // Deepgram — stylized D with sound waves
  deepgram: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.5 4h6.5c4.7 0 8.5 3.6 8.5 8s-3.8 8-8.5 8H3.5V4zm3 3v10h3.5c2.8 0 5-2.2 5-5s-2.2-5-5-5h-3.5z" />
      <rect x="14" y="10.4" width="1.3" height="3.2" rx="0.4" />
      <rect x="16.4" y="9" width="1.3" height="6" rx="0.4" />
      <rect x="18.8" y="10.4" width="1.3" height="3.2" rx="0.4" />
    </svg>
  ),

  // Sentry — mountain peak in hex frame
  sentry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
      <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" />
      <path d="M8 17h8L12 9z" fill="currentColor" stroke="none" />
    </svg>
  ),

  // PostHog — bar chart (analytics)
  posthog: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="3.5" y="14" width="4" height="6.5" rx="0.6" />
      <rect x="10" y="9" width="4" height="11.5" rx="0.6" />
      <rect x="16.5" y="3.5" width="4" height="17" rx="0.6" />
    </svg>
  ),
};

function BrandIcon({ name }: { name: string }) {
  return <>{BRAND_ICONS[name] ?? null}</>;
}

/* ─── Hooks ─────────────────────────────────────────────────────────────── */

function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); obs.unobserve(el); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { formatPrice } = usePrice();

  const [clients, setClients] = useState(50);
  const [pricePerClient, setPricePerClient] = useState(149);
  const monthlyPlatformFee = 199;
  const monthlyRevenue = clients * pricePerClient;
  const monthlyProfit = monthlyRevenue - monthlyPlatformFee;
  const yearlyProfit = monthlyProfit * 12;
  const margin = monthlyRevenue > 0 ? Math.round((monthlyProfit / monthlyRevenue) * 100) : 0;

  /* ─── Tower scroll engine ─── */
  const towerSectionRef = useRef<HTMLDivElement>(null);
  const towerStageRef = useRef<HTMLDivElement>(null);
  const towerTextsRef = useRef<HTMLDivElement>(null);
  const towerRailRef = useRef<HTMLDivElement>(null);
  const towerCounterRef = useRef<HTMLSpanElement>(null);
  const NUM_LAYERS = 8;

  useEffect(() => {
    const sect = towerSectionRef.current;
    const stage = towerStageRef.current;
    const texts = towerTextsRef.current;
    const rail = towerRailRef.current;
    const counter = towerCounterRef.current;
    if (!sect || !stage || !texts || !rail || !counter) return;

    const FLOOR_OFFSET = 96;
    const SLIDE_PX = 120;

    let raf = 0;
    const tick = () => {
      raf = 0;

      // Below lg, the sticky tower doesn't apply — render as a static stacked list.
      // Clear any inline styles JS previously set so CSS media queries take over.
      if (window.innerWidth < 1024) {
        const floorsM = stage.querySelectorAll<HTMLElement>('.tower-floor');
        floorsM.forEach((floor) => {
          floor.style.bottom = '';
          floor.style.transform = '';
          floor.style.opacity = '';
          floor.style.zIndex = '';
          floor.dataset.active = 'false';
        });
        const framesM = texts.querySelectorAll<HTMLElement>('.layer-text-frame');
        framesM.forEach((frame) => { frame.dataset.state = 'active'; });
        return;
      }

      const rect = sect.getBoundingClientRect();
      const winH = window.innerHeight;
      const total = rect.height - winH;
      if (total <= 0) return;
      const p = Math.max(0, Math.min(1, -rect.top / total));

      const floors = stage.querySelectorAll<HTMLElement>('.tower-floor');
      const N = floors.length;
      let activeIndex = 0;

      floors.forEach((floor, i) => {
        const start = i / N;
        const end = (i + 0.65) / N;
        const lpRaw = (p - start) / (end - start);
        const lp = Math.max(0, Math.min(1, lpRaw));
        const eased = 1 - Math.pow(1 - lp, 3);
        const targetBottom = i * FLOOR_OFFSET;
        const offsetY = (1 - eased) * SLIDE_PX;
        const scale = 0.96 + 0.04 * eased;
        floor.style.bottom = `${targetBottom}px`;
        floor.style.transform = `translateY(${offsetY}px) scale(${scale})`;
        floor.style.opacity = String(0.05 + 0.95 * eased);
        floor.style.zIndex = String(i + 1);
        if (lp >= 0.5) activeIndex = i;
      });

      floors.forEach((floor, i) => {
        floor.dataset.active = i === activeIndex && p > 0.01 && p < 0.99 ? 'true' : 'false';
      });

      const frames = texts.querySelectorAll<HTMLElement>('.layer-text-frame');
      frames.forEach((frame, i) => {
        frame.dataset.state = i === activeIndex ? 'active' : 'dim';
      });

      const ticks = rail.querySelectorAll<HTMLElement>('.tower-rail-tick');
      ticks.forEach((tickEl, i) => {
        tickEl.dataset.active = i === activeIndex ? 'true' : 'false';
        tickEl.dataset.passed = i < activeIndex ? 'true' : 'false';
      });

      counter.textContent = String(activeIndex + 1).padStart(2, '0');
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    };

    tick();
    requestAnimationFrame(tick);
    setTimeout(tick, 60);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const r1 = useInView();
  const r2 = useInView();
  const r3 = useInView();
  const r4 = useInView();
  const r5 = useInView();
  const r6 = useInView();
  const r7 = useInView();
  const r8 = useInView();
  const r9 = useInView();

  /* ─── Tower layers — outcome-focused copy ─── */
  const layers = [
    {
      n: '01', icon: Palette,
      title: 'Your brand on every surface',
      sub: 'Logo, color palette, custom domain, transactional emails, and the client phone experience are all configured per agency. End clients see your business at every touchpoint — VoiceAI Connect remains invisible from signup through ongoing usage.',
      features: [
        'Token-level color customization across the entire interface',
        'Custom domain with auto-provisioned SSL certificates',
        'Branded transactional emails and notification SMS',
      ],
    },
    {
      n: '02', icon: Globe,
      title: 'A marketing website that closes for you',
      sub: 'Each agency receives a complete white-label marketing site — hero, pricing tiers, testimonials, and FAQ — with an interactive AI demo phone line that lets prospects experience the product before they ever speak to a human.',
      features: [
        'Conversion-optimized landing page deployed on signup',
        'Dedicated AI demo phone number per agency',
        'SEO metadata, Open Graph, and sitemap auto-generated',
      ],
    },
    {
      n: '03', icon: Rocket,
      title: 'From signup to live AI in sixty seconds',
      sub: 'Local businesses fill out a branded form. The platform provisions everything in under a minute: AI voice agent configured for their business, dedicated phone number, dashboard credentials, and welcome sequence triggered. No A2P registration delay, no manual setup.',
      features: [
        'White-labeled signup flow tied to your domain',
        'Automatic phone number provisioning, no A2P delay',
        'Triggered welcome and activation email sequence',
      ],
    },
    {
      n: '04', icon: Mic,
      title: 'An AI receptionist that never sleeps',
      sub: "The voice agent answers calls 24/7 in multiple languages, books appointments directly to the client's calendar, transfers urgent matters to the business owner in real time, and writes a summary on every interaction.",
      features: [
        'Sub-two-second response latency on every call',
        'Native calendar and CRM integrations',
        'Multilingual voice synthesis included',
      ],
    },
    {
      n: '05', icon: MonitorSmartphone,
      title: 'What end clients log in to every day',
      sub: 'Each business receives a fully branded dashboard showing call recordings, time-coded transcripts, AI-generated summaries with intent and sentiment, lead categorization, and configurable SMS or email alerts on every interaction.',
      features: [
        'Full call recordings and time-coded transcripts',
        'AI summary with intent and sentiment per call',
        'SMS, email, and webhook alerts on configurable triggers',
      ],
    },
    {
      n: '06', icon: BarChart3,
      title: 'Run the entire agency from your phone',
      sub: 'The agency control surface shows every client, every call, and every dollar in a mobile-first interface. Add clients, modify branding, listen to recordings, and review revenue from anywhere — without ever opening a laptop.',
      features: [
        'Real-time MRR, churn, and revenue analytics',
        'Per-client call volume and conversion tracking',
        'Mobile-optimized layout with offline-capable PWA',
      ],
    },
    {
      n: '07', icon: CreditCard,
      title: 'Money lands in your bank, not ours',
      sub: 'Stripe Connect routes every client subscription directly into your account at the price tier you set. Zero revenue share, zero holdbacks, zero middleman. The platform never sees the money — your clients pay you.',
      features: [
        'Direct-to-agency Stripe Connect deposits',
        'Configurable subscription pricing per tier',
        'Automated invoicing on every client signup',
      ],
    },
    {
      n: '08', icon: Map,
      title: 'Find clients before your competition does',
      sub: 'The built-in CRM pulls local businesses directly from Google Maps, runs them through outreach sequences using thirteen conversion-tested email templates, and tracks every reply through a visual pipeline — all without leaving the platform.',
      features: [
        'Google Maps prospecting by category and radius',
        '13 conversion-tested outreach email templates',
        'Visual pipeline with reply detection and follow-ups',
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* ════════ HERO ════════ */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-20 lg:pb-32 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={r1} className="fade-up max-w-4xl">
            <h1 className="t-h1 text-white max-w-[18ch]">
              The white-label AI receptionist platform for agencies.
            </h1>
            <p className="t-body mt-8 max-w-2xl text-[1rem]">
              VoiceAI Connect is a multi-tenant voice AI platform purpose-built for agencies and resellers. Brand the product as your own, onboard local businesses in under sixty seconds, and collect monthly recurring revenue while we operate the underlying infrastructure — twelve enterprise vendors integrated and shipped as a single agency-ready application.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="#earnings" className="btn btn-ghost-dark">Project earnings <ArrowDown className="w-3.5 h-3.5" /></Link>
            </div>
            <Link href="/interactive-demo" className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-em mt-6 hover:opacity-80 transition-opacity">
              Or try the interactive demo <ArrowRight className="w-3 h-3" />
            </Link>
            <p className="font-mono text-[11px] text-white/35 mt-7">14-day free trial · no credit card required · cancel anytime</p>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 mt-24 lg:mt-32 relative">
          <p className="t-eyebrow text-white/35 mb-8 text-center">Built on enterprise infrastructure</p>
          <div className="trust-row">
            {[
              { n: 'Anthropic', i: 'anthropic' },
              { n: 'ElevenLabs', i: 'elevenlabs' },
              { n: 'Deepgram', i: 'deepgram' },
              { n: 'OpenAI', i: 'openai' },
              { n: 'Telnyx', i: 'telnyx' },
              { n: 'Twilio', i: 'twilio' },
              { n: 'Stripe', i: 'stripe' },
              { n: 'Supabase', i: 'supabase' },
              { n: 'Vercel', i: 'vercel' },
              { n: 'Cloudflare', i: 'cloudflare' },
              { n: 'Sentry', i: 'sentry' },
              { n: 'PostHog', i: 'posthog' },
            ].map(b => (
              <div key={b.n} className="trust-item">
                <BrandIcon name={b.i} />
                <span className="trust-item-name">{b.n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ EARNINGS CALCULATOR ════════ */}
      <section id="earnings" className="bg-ink py-28 lg:py-40 scroll-mt-24 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r2} className="fade-up grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            <div className="lg:col-span-5">
              <p className="t-eyebrow text-em mb-6">Earnings model</p>
              <h2 className="t-h2 text-white">Project your monthly recurring revenue.</h2>
              <p className="t-body mt-6 max-w-md">
                Industry data places the cost of a single missed call at roughly <span className="font-mono text-white/85">$500</span> for a small service business. A full-time human receptionist runs approximately <span className="font-mono text-white/85">$3,000</span> per month. AI receptionist coverage at <span className="font-mono text-em">$149</span> is a clear yes for most local businesses.
              </p>
              <Link href="/signup" className="btn btn-em mt-9">Start a free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
            </div>

            <div className="lg:col-span-7">
              <div className="calc-shell p-7 lg:p-10 relative">
                <div className="space-y-8 relative z-10">
                  <div>
                    <div className="flex items-baseline justify-between mb-3.5">
                      <span className="t-eyebrow text-white/55">Active clients</span>
                      <span className="font-display text-3xl text-white t-numeric font-medium">{clients}</span>
                    </div>
                    <input type="range" min={5} max={200} value={clients} onChange={e => setClients(Number(e.target.value))} className="calc-range" />
                    <div className="flex justify-between font-mono text-[10px] text-white/30 mt-2.5">
                      <span>5</span><span>50</span><span>100</span><span>200</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-3.5">
                      <span className="t-eyebrow text-white/55">Monthly price per client</span>
                      <span className="font-display text-3xl text-white t-numeric font-medium">{formatPrice(pricePerClient)}<span className="text-white/40 text-base font-normal">/mo</span></span>
                    </div>
                    <input type="range" min={49} max={399} step={10} value={pricePerClient} onChange={e => setPricePerClient(Number(e.target.value))} className="calc-range" />
                    <div className="flex justify-between font-mono text-[10px] text-white/30 mt-2.5">
                      <span>$49</span><span>$149</span><span>$249</span><span>$399</span>
                    </div>
                  </div>

                  <div className="pt-7 border-t border-white/[0.07] grid grid-cols-1 sm:grid-cols-2 gap-7 sm:gap-10">
                    <div className="min-w-0">
                      <p className="t-eyebrow text-white/40 mb-2">Monthly profit</p>
                      <p className="text-em t-numeric font-display font-medium" style={{ fontSize: 'clamp(1.875rem, 3.6vw, 2.875rem)', lineHeight: 1, letterSpacing: '-0.04em' }}>{formatPrice(monthlyProfit)}</p>
                      <p className="font-mono text-[11px] text-white/40 mt-2.5">Net of {formatPrice(monthlyPlatformFee)} platform fee</p>
                    </div>
                    <div className="min-w-0">
                      <p className="t-eyebrow text-white/40 mb-2">Annualized</p>
                      <p className="text-white t-numeric font-display font-medium" style={{ fontSize: 'clamp(1.875rem, 3.6vw, 2.875rem)', lineHeight: 1, letterSpacing: '-0.04em' }}>{formatPrice(yearlyProfit)}</p>
                      <p className="font-mono text-[11px] text-white/40 mt-2.5">{margin}% gross margin · zero overhead</p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="calc-bar-row">
                      <span className="font-mono text-[10px] text-white/35 w-32 uppercase tracking-wider">Client revenue</span>
                      <div className="calc-bar-track"><div className="calc-bar-fill" style={{ width: '100%' }} /></div>
                      <span className="font-mono text-[11px] text-white/65 w-20 text-right">{formatPrice(monthlyRevenue)}</span>
                    </div>
                    <div className="calc-bar-row">
                      <span className="font-mono text-[10px] text-white/35 w-32 uppercase tracking-wider">Platform fee</span>
                      <div className="calc-bar-track"><div className="calc-bar-fill" style={{ width: `${Math.min(100, (monthlyPlatformFee / monthlyRevenue) * 100)}%`, background: 'rgba(255,255,255,0.22)' }} /></div>
                      <span className="font-mono text-[11px] text-white/65 w-20 text-right">−{formatPrice(monthlyPlatformFee)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ INFRASTRUCTURE ════════ */}
      <section className="bg-ink py-28 lg:py-40 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r3} className="fade-up grid lg:grid-cols-12 gap-10 lg:gap-16 mb-16 lg:mb-20">
            <div className="lg:col-span-6">
              <p className="t-eyebrow text-em mb-6">Infrastructure</p>
              <h2 className="t-h2 text-white">Fifteen enterprise vendors. One platform interface.</h2>
            </div>
            <div className="lg:col-span-6 lg:pt-2">
              <p className="t-body max-w-lg">
                VoiceAI Connect orchestrates fifteen specialized infrastructure providers behind a single agency-facing application. Anthropic&apos;s Claude handles reasoning. ElevenLabs synthesizes voice. Deepgram transcribes calls in real time. Telnyx routes US numbers, Twilio handles UK and international. Stripe Connect, Supabase, Vercel, and Cloudflare run the platform layer. Sentry and PostHog cover monitoring and analytics — billed to you as a single flat fee.
              </p>
            </div>
          </div>

          {/* ── Architecture stack: Agency → VoiceAI Connect → Infrastructure ── */}
          <div className="arch-stack">
            {/* Tier 1 — Agency layer */}
            <div className="arch-tier">
              <div className="arch-tier-head">
                <span className="arch-tier-label">Tier 1 · Agency</span>
                <span className="arch-tier-tag">Your brand</span>
              </div>
              <p className="arch-tier-title">Your brand, your domain, your clients</p>
              <p className="arch-tier-sub">White-labeled marketing site, dashboards, and phone experience — VoiceAI Connect remains invisible to your end clients.</p>
            </div>

            <div className="arch-arrow">
              <span className="arch-arrow-line" />
              <span className="arch-arrow-label">orchestrated by</span>
              <span className="arch-arrow-line" />
            </div>

            {/* Tier 2 — VoiceAI Connect orchestration */}
            <div className="arch-tier arch-tier-em">
              <div className="arch-tier-head">
                <span className="arch-tier-label arch-tier-label-em">Tier 2 · Platform</span>
                <span className="arch-tier-tag arch-tier-tag-em">Multi-tenant orchestration</span>
              </div>
              <p className="arch-tier-title">VoiceAI Connect</p>
              <p className="arch-tier-sub">Agency dashboard · client onboarding · lead generation CRM · Stripe Connect billing · branding engine</p>
            </div>

            <div className="arch-arrow">
              <span className="arch-arrow-line" />
              <span className="arch-arrow-label">powered by</span>
              <span className="arch-arrow-line" />
            </div>

            {/* Tier 3 — Infrastructure providers, grouped */}
            <div className="arch-base">
              {[
                {
                  label: 'Voice & reasoning',
                  vendors: [
                    { n: 'Anthropic', r: 'Claude reasoning', i: 'anthropic' },
                    { n: 'ElevenLabs', r: 'Voice synthesis', i: 'elevenlabs' },
                    { n: 'Deepgram', r: 'Real-time STT', i: 'deepgram' },
                    { n: 'OpenAI', r: 'Whisper batch STT', i: 'openai' },
                  ],
                },
                {
                  label: 'Telephony',
                  vendors: [
                    { n: 'Telnyx', r: 'US numbers + SIP', i: 'telnyx' },
                    { n: 'Twilio', r: 'UK + international', i: 'twilio' },
                  ],
                },
                {
                  label: 'Backend & observability',
                  vendors: [
                    { n: 'Supabase', r: 'Postgres + auth', i: 'supabase' },
                    { n: 'Stripe', r: 'Connect + billing', i: 'stripe' },
                    { n: 'Brevo', r: 'Transactional email', i: 'brevo' },
                    { n: 'Sentry', r: 'Error monitoring', i: 'sentry' },
                    { n: 'PostHog', r: 'Product analytics', i: 'posthog' },
                  ],
                },
                {
                  label: 'Edge & automation',
                  vendors: [
                    { n: 'Vercel', r: 'Edge hosting', i: 'vercel' },
                    { n: 'Cloudflare', r: 'CDN + WAF', i: 'cloudflare' },
                    { n: 'Make', r: 'Workflow automation', i: 'make' },
                    { n: 'n8n', r: 'Custom integrations', i: 'n8n' },
                  ],
                },
              ].map(group => (
                <div key={group.label} className="arch-base-card">
                  <p className="arch-base-label">{group.label}</p>
                  <div className="arch-vendor-list">
                    {group.vendors.map(v => (
                      <div key={v.n} className="arch-vendor">
                        <BrandIcon name={v.i} />
                        <div className="min-w-0">
                          <p className="arch-vendor-name">{v.n}</p>
                          <p className="arch-vendor-role">{v.r}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ WHITE-LABEL TOWER ════════ */}
      <section ref={towerSectionRef} className="bg-ink relative border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-28 lg:pt-40">
          <div className="max-w-2xl">
            <p className="t-eyebrow text-em mb-6">Platform architecture</p>
            <h2 className="t-h2 text-white">Eight platform layers. Delivered in a single onboarding.</h2>
            <p className="t-body mt-6 max-w-xl">
              When an agency activates a workspace on VoiceAI Connect, eight independently-developed products go live at once — integrated end to end, white-labeled to the agency&apos;s brand, and packaged as a single product to sell to local businesses.
            </p>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 mt-16 lg:mt-24">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            <div ref={towerTextsRef} className="lg:col-span-5">
              {layers.map((l) => (
                <div key={l.n} className="layer-text-frame" data-state="dim">
                  <div className="max-w-md">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="font-mono text-[10px] text-em tracking-[0.16em] uppercase">Layer {l.n}</span>
                      <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(74, 234, 188, 0.35), transparent)' }} />
                    </div>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(74, 234, 188, 0.08)', border: '1px solid rgba(74, 234, 188, 0.18)' }}>
                        <l.icon className="w-4 h-4 text-em" strokeWidth={1.7} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-[22px] sm:text-[28px] lg:text-[32px] font-medium text-white leading-[1.1] tracking-tight break-words">{l.title}</h3>
                        <p className="text-[14px] text-white/60 mt-3 leading-relaxed">{l.sub}</p>
                      </div>
                    </div>
                    <ul className="mt-6 space-y-2.5 ml-12 sm:ml-[52px]">
                      {l.features.map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-[13px] text-white/65">
                          <Check className="w-3.5 h-3.5 text-em flex-shrink-0" strokeWidth={2.5} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-7 relative">
              <div className="lg:sticky lg:top-0 lg:h-screen flex items-center justify-center py-16">
                <div className="relative">
                  <div ref={towerRailRef} className="tower-rail">
                    {Array.from({ length: NUM_LAYERS }).map((_, i) => (
                      <div key={i} className="tower-rail-tick" />
                    ))}
                  </div>

                  <div ref={towerStageRef} className="tower-stage">
                    <div className="tower-counter">
                      <strong><span ref={towerCounterRef}>01</span></strong>
                      <span>/ 08</span>
                    </div>

                    <div className="tower-ground" />

                    <div className="tower-floor">
                      <div className="tower-floor-row">
                        <span className="tower-floor-num">01</span>
                        <span className="tower-floor-title">Brand identity</span>
                        <span className="tower-floor-meta">your-brand.com</span>
                      </div>
                      <div className="tower-floor-row mt-2">
                        <span className="tower-floor-num" style={{ visibility: 'hidden' }}>01</span>
                        <div className="tower-color-row">
                          {['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#0a0a0a'].map(c => (
                            <span key={c} style={{ background: c }} />
                          ))}
                        </div>
                        <span className="tower-floor-sub">Logo · palette · typography</span>
                      </div>
                    </div>

                    <div className="tower-floor">
                      <div className="tower-floor-row">
                        <span className="tower-floor-num">02</span>
                        <span className="tower-floor-title">Marketing website</span>
                        <span className="tower-floor-meta">+ AI demo line</span>
                      </div>
                      <div className="tower-floor-row mt-2">
                        <span className="tower-floor-num" style={{ visibility: 'hidden' }}>02</span>
                        <div className="tower-mini-browser">
                          <div className="tower-mini-browser-bar"><span /><span /><span /></div>
                          <div className="tower-mini-browser-body" />
                        </div>
                        <span className="tower-floor-sub">Hero, pricing, testimonials, CTA</span>
                      </div>
                    </div>

                    <div className="tower-floor">
                      <div className="tower-floor-row">
                        <span className="tower-floor-num">03</span>
                        <span className="tower-floor-title">Self-serve onboarding</span>
                        <span className="tower-floor-meta text-em">47s avg</span>
                      </div>
                      <div className="tower-floor-row mt-2">
                        <span className="tower-floor-num" style={{ visibility: 'hidden' }}>03</span>
                        <div className="tower-progress"><div className="tower-progress-fill" /></div>
                        <span className="tower-floor-sub">Signup → AI live + phone provisioned</span>
                      </div>
                    </div>

                    <div className="tower-floor">
                      <div className="tower-floor-row">
                        <span className="tower-floor-num">04</span>
                        <span className="tower-floor-title">AI receptionist</span>
                        <span className="tower-badge">Voice</span>
                      </div>
                      <div className="tower-floor-row mt-2">
                        <span className="tower-floor-num" style={{ visibility: 'hidden' }}>04</span>
                        <div className="waveform">
                          {Array.from({ length: 14 }).map((_, j) => (
                            <span key={j} className="waveform-bar" style={{ animationDelay: `${j * 80}ms` }} />
                          ))}
                        </div>
                        <span className="tower-floor-sub">2.1s response · multilingual</span>
                      </div>
                    </div>

                    <div className="tower-floor">
                      <div className="tower-floor-row">
                        <span className="tower-floor-num">05</span>
                        <span className="tower-floor-title">Client dashboard</span>
                        <span className="tower-floor-meta">Per client</span>
                      </div>
                      <div className="tower-floor-row mt-2">
                        <span className="tower-floor-num" style={{ visibility: 'hidden' }}>05</span>
                        <div className="tower-bar-row">
                          {[3, 5, 7, 4, 6, 8, 5, 7, 9, 6, 4, 7].map((h, j) => (
                            <span key={j} style={{ height: `${h * 1.6}px` }} />
                          ))}
                        </div>
                        <span className="tower-floor-sub">Recordings · transcripts · summaries</span>
                      </div>
                    </div>

                    <div className="tower-floor">
                      <div className="tower-floor-row">
                        <span className="tower-floor-num">06</span>
                        <span className="tower-floor-title">Agency dashboard</span>
                      </div>
                      <div className="tower-floor-row mt-2">
                        <span className="tower-floor-num" style={{ visibility: 'hidden' }}>06</span>
                        <span className="tower-stat">23 clients</span>
                        <span className="tower-stat">$3.4k MRR</span>
                        <span className="tower-stat">47 calls</span>
                      </div>
                    </div>

                    <div className="tower-floor">
                      <div className="tower-floor-row">
                        <span className="tower-floor-num">07</span>
                        <span className="tower-floor-title">Stripe Connect billing</span>
                        <span className="tower-badge">Connected</span>
                      </div>
                      <div className="tower-floor-row mt-2">
                        <span className="tower-floor-num" style={{ visibility: 'hidden' }}>07</span>
                        <span className="font-mono text-[11px] text-white/55">Direct deposit to your bank — no holdback</span>
                      </div>
                    </div>

                    <div className="tower-floor">
                      <div className="tower-floor-row">
                        <span className="tower-floor-num">08</span>
                        <span className="tower-floor-title">Lead generation CRM</span>
                        <span className="tower-floor-meta">14 leads</span>
                      </div>
                      <div className="tower-floor-row mt-2">
                        <span className="tower-floor-num" style={{ visibility: 'hidden' }}>08</span>
                        <div className="tower-pipeline">
                          <span /><span /><span />
                        </div>
                        <span className="tower-floor-sub">Maps prospecting + outreach templates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-12 lg:pt-20 pb-28 lg:pb-40">
          <div className="border-t border-white/[0.06] pt-10 max-w-3xl">
            <p className="font-mono text-[11px] text-white/35 mb-3 uppercase tracking-[0.16em]">Outcome</p>
            <p className="font-display text-[22px] sm:text-[26px] font-medium text-white leading-tight tracking-tight max-w-2xl">
              Eight independent products. Integrated end to end. <span className="text-em">Sold under your brand.</span>
            </p>
            <Link href="/signup" className="btn btn-em mt-7">Activate a workspace <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      </section>

      {/* ════════ BENTO PLATFORM ════════ */}
      <section id="platform" className="bg-ink py-28 lg:py-40 border-t border-white/[0.04] scroll-mt-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r4} className="fade-up max-w-3xl mb-16">
            <p className="t-eyebrow text-em mb-6">Platform capabilities</p>
            <h2 className="t-h2 text-white">A complete operating system for AI agencies.</h2>
          </div>

          <div className="bento">
            <div className="bento-cell bento-c4 bento-r2">
              <div className="bento-cell-content">
                <p className="t-eyebrow text-em">White-label</p>
                <h3 className="t-h3 text-white mt-4 max-w-md font-medium">Your brand, end to end.</h3>
                <p className="text-[14px] text-white/55 mt-3 max-w-md leading-relaxed">
                  Logo, color palette, custom domain, transactional emails, and the client phone experience are all configured per agency. VoiceAI Connect remains invisible to the businesses you serve.
                </p>

                <div className="mt-7 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.025]">
                    <span className="w-2 h-2 rounded-full bg-red-400/60" />
                    <span className="w-2 h-2 rounded-full bg-yellow-400/60" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400/60" />
                    <span className="ml-3 font-mono text-[10px] text-white/40">your-brand.com</span>
                  </div>
                  <div className="px-4 py-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-5 h-5 rounded" style={{ background: 'linear-gradient(135deg, #4aeabc, #047857)' }} />
                      <span className="font-display font-medium text-white text-[12px]">Acme Receptionist</span>
                    </div>
                    <p className="font-display text-[15px] text-white leading-tight font-medium">Never miss<br />another call.</p>
                  </div>
                </div>

                <div className="mt-auto pt-7 flex items-end justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#0a0a0a'].map(c => (
                      <span key={c} className="brand-swatch" style={{ background: c }} />
                    ))}
                  </div>
                  <code className="font-mono text-[11px] text-white/40">your-brand.com</code>
                </div>
              </div>
            </div>

            <div className="bento-cell bento-c2">
              <div className="bento-cell-content">
                <p className="t-eyebrow text-em">Onboarding</p>
                <p className="t-stat text-white mt-3 t-numeric">60<span className="text-em text-2xl align-top font-display">s</span></p>
                <p className="text-[12px] text-white/45 mt-3 leading-relaxed">From client signup to a provisioned AI agent and live phone number. No A2P registration delay.</p>
              </div>
            </div>

            <div className="bento-cell bento-c2">
              <div className="bento-cell-content">
                <p className="t-eyebrow text-em">Margin</p>
                <p className="t-stat text-white mt-3 t-numeric">97<span className="text-em text-2xl align-top font-display">%</span></p>
                <p className="text-[12px] text-white/45 mt-3 leading-relaxed">Flat platform fee. Your margin compounds as you add clients.</p>
              </div>
            </div>

            <div className="bento-cell bento-c3">
              <div className="bento-cell-content">
                <p className="t-eyebrow text-em flex items-center gap-2"><CreditCard className="w-3 h-3" />Stripe Connect</p>
                <h3 className="font-display text-lg text-white mt-3 font-medium">Direct payment processing.</h3>
                <p className="text-[13px] text-white/50 mt-2 leading-relaxed">Subscription revenue flows from each client&apos;s card to your bank account. No middleman, no holdbacks, no revenue share.</p>
                <div className="mt-auto pt-5 space-y-1.5">
                  {[['Sep 01', '$3,427.00'], ['Aug 01', '$3,128.00'], ['Jul 01', '$2,890.00']].map(([d, a]) => (
                    <div key={d} className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-white/40">{d} · payout</span>
                      <span className="text-white/85">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bento-cell bento-c3">
              <div className="bento-cell-content">
                <p className="t-eyebrow text-em flex items-center gap-2"><Smartphone className="w-3 h-3" />Mobile-first</p>
                <h3 className="font-display text-lg text-white mt-3 font-medium">Mobile-first agency operations.</h3>
                <p className="text-[13px] text-white/50 mt-2 leading-relaxed">Add clients, change branding, and listen to call recordings from anywhere. GoHighLevel still requires a desktop.</p>
                <div className="mt-auto pt-5 flex items-end gap-3">
                  <div className="flex-1 minichart">
                    {[5, 8, 6, 9, 7, 11, 9, 14, 11, 13, 16, 14, 18].map((h, j) => (
                      <span key={j} className="minichart-bar" style={{ height: `${h * 1.4}px` }} />
                    ))}
                  </div>
                  <span className="font-mono text-[11px] text-white/55">+18% MoM</span>
                </div>
              </div>
            </div>

            <div className="bento-cell bento-c3">
              <div className="bento-cell-content">
                <p className="t-eyebrow text-em flex items-center gap-2"><Map className="w-3 h-3" />Lead generation</p>
                <h3 className="font-display text-lg text-white mt-3 font-medium">Built-in prospecting and outreach.</h3>
                <p className="text-[13px] text-white/50 mt-2 leading-relaxed">Pull local businesses directly from Google Maps, run them through outreach sequences, and track replies — all in one workflow.</p>
                <div className="mt-auto pt-5 grid grid-cols-3 gap-2">
                  {[['NEW', '4'], ['HOT', '6'], ['CLOSE', '4']].map(([s, n]) => (
                    <div key={s} className="rounded-lg p-2.5 border border-white/[0.07] bg-white/[0.012]">
                      <p className="font-mono text-[9px] tracking-[0.18em] text-white/40">{s}</p>
                      <p className="font-display text-[18px] font-medium text-white mt-0.5">{n}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bento-cell bento-c3 relative">
              <div className="bento-cell-content">
                <p className="t-eyebrow text-em flex items-center gap-2"><Phone className="w-3 h-3" />AI demo line</p>
                <h3 className="font-display text-lg text-white mt-3 font-medium">A self-demonstrating sales tool.</h3>
                <p className="text-[13px] text-white/50 mt-2 leading-relaxed">The Professional tier ships with a branded demo phone number. Prospects experience the AI receptionist firsthand and convert without a sales call.</p>
                <div className="mt-auto pt-5 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.012] px-3.5 py-3">
                  <span className="font-mono text-[11px] text-white/65">(555) 123-DEMO</span>
                  <div className="ml-auto waveform">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <span key={j} className="waveform-bar" style={{ animationDelay: `${j * 75}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-cell bento-c2">
              <div className="bento-cell-content">
                <p className="t-eyebrow text-em flex items-center gap-2"><Lock className="w-3 h-3" />Security</p>
                <p className="font-display text-[15px] text-white mt-3 leading-snug font-medium">Postgres row-level security. SOC2-compliant vendors. PII never persisted in logs.</p>
              </div>
            </div>

            <div className="bento-cell bento-c2">
              <div className="bento-cell-content">
                <p className="t-eyebrow text-em flex items-center gap-2"><Globe className="w-3 h-3" />Multilingual</p>
                <p className="font-display text-[15px] text-white mt-3 leading-snug font-medium">English, Spanish, French, and German voice support included.</p>
              </div>
            </div>

            <div className="bento-cell bento-c2">
              <div className="bento-cell-content">
                <p className="t-eyebrow text-em flex items-center gap-2"><Wand2 className="w-3 h-3" />Automation</p>
                <p className="font-display text-[15px] text-white mt-3 leading-snug font-medium">Make and n8n event hooks for every platform action.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="bg-paper py-28 lg:py-40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r5} className="fade-up max-w-3xl mb-14">
            <p className="t-eyebrow text-em-deep mb-6">Setup process</p>
            <h2 className="t-h2 text-black">Four steps to launch.</h2>
            <p className="t-body mt-6 max-w-xl">
              The path from signup to a fully branded, billable AI receptionist agency is short and self-serve. Most operators complete the entire setup over a weekend.
            </p>
          </div>

          <div className="rail">
            {[
              { s: '01', t: 'Configure your brand identity', d: 'Upload a logo, define a color palette, set pricing tiers, and connect a custom domain. The complete agency surface deploys under your brand.', icon: Wand2 },
              { s: '02', t: 'Connect your Stripe account', d: 'Authorize VoiceAI Connect via Stripe OAuth. Client subscriptions deposit directly into your account. We never custody funds.', icon: CreditCard },
              { s: '03', t: 'Distribute your signup link', d: 'Send prospects to your white-labeled onboarding page. Once they complete the form, the platform provisions their AI agent and phone number in under 60 seconds.', icon: ArrowUpRight },
              { s: '04', t: 'Collect monthly recurring revenue', d: 'Calls flow into client dashboards. You scale by adding more clients to the same workspace. Margin compounds without per-client cost.', icon: BarChart3 },
            ].map((c) => (
              <article key={c.s} className="rail-card" style={{ background: '#fafafa', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between mb-7">
                  <span className="font-mono text-[11px] text-black/40 tracking-[0.16em] uppercase">Step {c.s}</span>
                  <c.icon className="w-4 h-4 text-emerald-700" strokeWidth={1.7} />
                </div>
                <h3 className="font-display text-[22px] font-medium text-black leading-tight tracking-tight">{c.t}</h3>
                <p className="text-[14px] text-black/60 leading-relaxed mt-4">{c.d}</p>
                <div className="mt-auto pt-8 font-mono text-[40px] font-medium text-black/[0.06] leading-none tracking-tight">{c.s}</div>
              </article>
            ))}
          </div>

          <p className="font-mono text-[11px] text-black/30 mt-6 uppercase tracking-[0.16em]">→ scroll for steps 02 — 04</p>
        </div>
      </section>

      {/* ════════ COMPARISON ════════ */}
      <section id="compare" className="bg-paper-soft py-28 lg:py-40 scroll-mt-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r6} className="fade-up max-w-3xl mb-14">
            <p className="t-eyebrow text-em-deep mb-6">Comparison</p>
            <h2 className="t-h2 text-black">Purpose-built for AI receptionist resale.</h2>
            <p className="t-body mt-6 max-w-xl">
              Most platforms in this space retrofit white-labeling onto products designed for direct sale. VoiceAI Connect was architected for agency-to-client resale from day one — and the difference shows in every feature comparison.
            </p>
          </div>

          <div className="bg-paper rounded-3xl border border-black/[0.05] overflow-hidden">
            <div className="compare-row compare-row-head">
              <div className="font-mono text-[10px] tracking-[0.16em] text-black/40 uppercase">Feature</div>
              <div className="text-center compare-cell-em font-display text-[14px] font-medium text-black px-3 py-2">VoiceAI Connect</div>
              <div className="text-center font-display text-[13px] text-black/55">GoHighLevel</div>
              <div className="text-center font-display text-[13px] text-black/55 compare-hide-sm">Autocalls</div>
              <div className="text-center font-display text-[13px] text-black/55 compare-hide-md">echowin</div>
            </div>
            {[
              ['Branded client-facing dashboard for end businesses', true, false, false, false],
              ['Sub-60-second automated client onboarding', true, false, false, false],
              ['No A2P registration required (per client)', true, false, true, true],
              ['Built-in lead generation CRM with templates', true, false, false, false],
              ['Mobile-first agency interface', true, false, true, true],
              ['Interactive AI demo phone line included', true, false, false, false],
              ['Flat-rate pricing, no per-client fees', true, false, true, false],
              ['White-label marketing website included', true, false, true, true],
              ['Direct Stripe Connect payouts to agency', true, true, false, false],
            ].map(([f, v, g, a, e]) => (
              <div key={f as string} className="compare-row text-[13.5px] text-black/72">
                <div className="pr-4">{f as string}</div>
                <div className="text-center compare-cell-em px-3 py-3">
                  {v ? <Check className="w-4 h-4 mx-auto" style={{ color: '#10b981' }} strokeWidth={2.5} /> : <XIcon className="w-3.5 h-3.5 text-black/20 mx-auto" />}
                </div>
                <div className="text-center">{g ? <Check className="w-4 h-4 text-black/45 mx-auto" /> : <XIcon className="w-3.5 h-3.5 text-black/15 mx-auto" />}</div>
                <div className="text-center compare-hide-sm">{a ? <Check className="w-4 h-4 text-black/45 mx-auto" /> : <XIcon className="w-3.5 h-3.5 text-black/15 mx-auto" />}</div>
                <div className="text-center compare-hide-md">{e ? <Check className="w-4 h-4 text-black/45 mx-auto" /> : <XIcon className="w-3.5 h-3.5 text-black/15 mx-auto" />}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PRICING — DARK + EMERALD ════════ */}
      <section id="pricing" className="bg-ink py-28 lg:py-40 scroll-mt-24 border-t border-white/[0.04] relative overflow-hidden">
        <div className="pricing-wash" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={r7} className="fade-up max-w-2xl mb-14">
            <p className="t-eyebrow text-em mb-6">Pricing</p>
            <h2 className="t-h2 text-white">Transparent flat-rate pricing.</h2>
            <p className="t-body mt-6 max-w-lg">
              Identical monthly platform fee whether you serve 10 clients or 100. Your margin compounds as you grow — ours stays the same. No per-client fees, no per-seat tiers, no revenue share.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 max-w-5xl">
            {[
              { name: 'Starter', price: 99, desc: 'Solo operators getting started', features: ['Up to 10 clients', 'White-label client dashboard', 'Lead generation CRM and templates', 'Stripe Connect billing', 'Email support'], limits: ['Subdomain only', 'No marketing site'] },
              { name: 'Professional', price: 199, desc: 'Growing agencies, 10–50 clients', pop: true, features: ['Up to 100 clients', '3 agency + 2 client team members', 'Full white-label marketing website', 'Interactive AI demo phone line', 'Custom domain', 'API access', 'Priority support'], limits: [] },
              { name: 'Enterprise', price: 499, desc: 'Established agencies at scale', features: ['Unlimited clients', '10 agency + 5 client team members', 'Everything in Professional', 'Dedicated success manager', 'SLA guarantee', 'Phone support'], limits: [] },
            ].map(t => (
              <div key={t.name} className={`price-card ${t.pop ? 'price-card-em' : ''}`}>
                {t.pop && (
                  <div className="absolute -top-3 left-7">
                    <span className="rounded-full text-black px-3 py-1 font-mono text-[10px] tracking-[0.14em] font-medium uppercase" style={{ background: '#4aeabc' }}>Most popular</span>
                  </div>
                )}
                <p className={`font-mono text-[11px] tracking-[0.14em] uppercase ${t.pop ? 'text-em' : 'text-white/40'}`}>{t.desc}</p>
                <p className="font-display text-lg font-medium mt-1.5 text-white">{t.name}</p>
                <div className="my-6 flex items-baseline gap-1">
                  <span className="font-display font-medium t-numeric text-white" style={{ fontSize: 'clamp(2.25rem, 4vw, 3rem)', letterSpacing: '-0.04em' }}>{formatPrice(t.price)}</span>
                  <span className="text-base text-white/45">/mo</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {t.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="w-3.5 h-3.5 shrink-0 mt-1 text-em" strokeWidth={2.5} />
                      <span className="text-white/75">{f}</span>
                    </li>
                  ))}
                  {t.limits?.map(l => (
                    <li key={l} className="flex items-start gap-2.5 text-[13px]">
                      <XIcon className="w-3.5 h-3.5 shrink-0 mt-1 text-white/20" />
                      <span className="text-white/30">{l}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`block w-full text-center rounded-full py-3 font-mono text-[11px] tracking-[0.12em] uppercase font-medium transition-all ${t.pop ? 'text-black hover:brightness-110' : 'border border-white/15 text-white hover:bg-white hover:text-black hover:border-white'}`} style={t.pop ? { background: '#4aeabc' } : undefined}>
                  Start trial
                </Link>
              </div>
            ))}
          </div>
          <p className="font-mono text-[11px] text-white/35 mt-12 text-center uppercase tracking-[0.14em]">14-day free trial · no credit card required · cancel anytime</p>
        </div>
      </section>

      {/* ════════ FAQ — AEO-optimized definitional answers ════════ */}
      <section className="bg-ink py-28 lg:py-40 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r8} className="fade-up grid lg:grid-cols-12 gap-12 lg:gap-20">
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-32">
                <p className="t-eyebrow text-em mb-6">Frequently asked questions</p>
                <h2 className="t-h2 text-white">Frequently asked questions.</h2>
                <p className="t-body mt-6 max-w-sm">
                  Have a question that isn&apos;t answered here? Email <a href="mailto:support@myvoiceaiconnect.com" className="text-em underline-offset-4 hover:underline">support@myvoiceaiconnect.com</a>. A team member responds within one business day.
                </p>
              </div>
            </aside>

            <div className="lg:col-span-8">
              {[
                {
                  q: 'What is VoiceAI Connect?',
                  a: 'VoiceAI Connect is a white-label AI receptionist platform built for agencies and resellers. Agencies use the platform to brand and resell AI receptionist subscriptions to local service businesses for $99 to $299 per month. The platform automatically provisions the AI voice agent, dedicated phone number, and client-facing dashboard at signup. Subscription payments flow directly to the agency through Stripe Connect, and the underlying infrastructure — voice synthesis, telephony, payments, database, hosting — is operated by VoiceAI Connect as a single integrated product.',
                },
                {
                  q: 'How does the white-label experience work?',
                  a: 'Every client-facing surface is configured per agency: logo, color palette, custom domain with auto-provisioned SSL, transactional emails, marketing website, and the phone experience itself. End clients interact only with the agency&apos;s brand. VoiceAI Connect is not visible to the businesses you serve at any point in the lifecycle — from signup through ongoing usage to billing.',
                },
                {
                  q: 'How is VoiceAI Connect different from GoHighLevel?',
                  a: 'GoHighLevel is a multi-purpose marketing platform — CRM, funnels, email, SMS, websites — designed for marketing agencies to manage client campaigns. VoiceAI Connect is purpose-built for one product: AI receptionist resale. Three concrete differences: end clients receive their own branded dashboard (GoHighLevel does not provide one), client onboarding completes in under sixty seconds (GoHighLevel requires per-client A2P registration that can take days), and the agency interface is mobile-first (GoHighLevel is desktop-bound).',
                },
                {
                  q: 'What does it cost to start an AI receptionist agency?',
                  a: 'The platform fee starts at $99 per month for the Starter tier and $199 per month for Professional, which is where most agencies begin. There are no per-client fees, no setup fees, and no revenue share. A 14-day free trial is available without a credit card. Total cost to launch is the platform subscription plus whatever marketing or sales effort the operator chooses to invest.',
                },
                {
                  q: 'Does VoiceAI Connect support international phone numbers?',
                  a: 'Yes. The default integration uses Telnyx for US-based phone numbers and provisions them automatically. For UK, Canadian, or other international numbers, agencies connect their own Twilio account by adding their API credentials in the dashboard. The platform then routes calls for those clients through Twilio automatically — the AI receptionist behavior, client dashboards, billing, and onboarding flow all function identically. No additional configuration is required beyond pasting in the Twilio key.',
                },
                {
                  q: 'Can VoiceAI Connect be used from outside the United States?',
                  a: 'Yes. The platform is available globally — agency operators in any country can sign up, build a brand, and run a workspace. End-client coverage is available in the United States, United Kingdom, and Canada. An operator based in India, the Philippines, or anywhere else can run a US-focused agency remotely, selling AI receptionist subscriptions to American local businesses without leaving their home country. Stripe Connect supports payouts to most major countries.',
                },
                {
                  q: 'How do agencies acquire clients on the platform?',
                  a: 'The platform includes a built-in lead generation CRM with thirteen pre-written outreach templates, a Google Maps business prospecting tool, sales scripts, and reply tracking. The strongest conversion tool is the interactive AI demo phone line, included on the Professional tier — prospects call the demo number, experience the AI receptionist firsthand, and typically convert without requiring a sales call.',
                },
                {
                  q: 'Are technical skills required to operate the platform?',
                  a: 'No. Configuration is point-and-click: upload a logo, select a color palette, set pricing tiers, share a signup link. The platform handles AI agent configuration, phone number provisioning, billing setup, and ongoing operations automatically. There is no code to write and no infrastructure to manage.',
                },
                {
                  q: 'Can local businesses realistically be charged $99 to $299 per month?',
                  a: 'Yes. Industry research places the cost of a single missed call at approximately $500 in lost revenue for a small service business. A full-time human receptionist costs roughly $3,000 per month inclusive of payroll taxes and benefits. AI receptionist coverage at $149 per month delivers 24/7 availability for a fraction of either alternative — making it a clear yes for most local service businesses.',
                },
                {
                  q: 'Is this another &quot;make money with AI&quot; product?',
                  a: 'No. VoiceAI Connect is software infrastructure, not a course or a coaching program. The platform functions as the operating system for an actual service business — comparable to how Shopify functions as the operating system for an actual e-commerce business. There are no upsells, community fees, or playbooks to purchase. Operators do real sales work and provide a real service to local businesses.',
                },
                {
                  q: 'What integrations and infrastructure power the platform?',
                  a: 'VoiceAI Connect orchestrates fifteen enterprise infrastructure providers behind a single application: Anthropic Claude for reasoning, ElevenLabs for voice synthesis, Deepgram for real-time speech-to-text, OpenAI Whisper for batch transcription, Telnyx for US phone numbers and SIP trunking, Twilio for UK and international numbers, Stripe Connect for subscription billing, Supabase for Postgres and authentication, Make and n8n for workflow automation, Vercel and Cloudflare for the edge layer, Brevo for transactional email, Sentry for error monitoring, and PostHog for product analytics.',
                },
                {
                  q: 'What happens if I cancel my subscription?',
                  a: 'Cancellation is available at any time, with no holdback period or penalty. Operators retain ownership of their client list, custom domain, Stripe Connect account, and all client data. Existing clients can be migrated to another platform or terminated at the operator&apos;s discretion.',
                },
              ].map((item, i) => (
                <details key={i} className="faq-item">
                  <summary className="flex items-start justify-between gap-6 py-6 cursor-pointer select-none">
                    <span className="font-display text-[17px] sm:text-[18px] text-white/90 leading-snug font-medium" dangerouslySetInnerHTML={{ __html: item.q }} />
                    <Plus className="faq-chev w-5 h-5 text-white/30 shrink-0 mt-1 transition-transform duration-300" />
                  </summary>
                  <div className="pb-6 -mt-1 max-w-2xl">
                    <p className="text-[14px] text-white/55 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.a }} />
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className="bg-ink canvas-dot py-32 lg:py-44 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <div ref={r9} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Get started</p>
            <h2 className="t-h1 text-white">Launch your AI receptionist agency this week.</h2>
            <p className="t-body mt-7 max-w-lg">
              Begin with a 14-day free trial. By Friday you can have a fully branded platform live, Stripe Connect authorized, and a public signup link ready to distribute to local businesses.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/interactive-demo" className="btn btn-ghost-dark">Watch demo <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
