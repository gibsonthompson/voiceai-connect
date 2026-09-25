'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight, ArrowDown, ArrowRight, Check, X as XIcon, Phone,
  Mic, CreditCard, Plus,
  Globe, Wand2, BarChart3, Lock, Smartphone, Map, Palette, MonitorSmartphone, Rocket, Calendar,
  ShieldCheck, PhoneCall,
} from 'lucide-react';
import { usePrice } from '@/hooks/usePrice';
import { AGENCY_PLAN_TIER_LIST } from '@/lib/plan-features';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';
import WhiteLabelStack from '@/components/white-label-stack';


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

const SITE_URL = 'https://www.myvoiceaiconnect.com';

// Platform demo line: the callable number a prospect dials to hear the AI live.
// SET BOTH to the real provisioned platform demo number before deploy.
const PLATFORM_DEMO_NUMBER = '(404) 671-9089';
const PLATFORM_DEMO_TEL = '+14046719089';

const FAQ_ITEMS = [
                { q: 'What is VoiceAI Connect?', a: 'VoiceAI Connect is a white-label AI receptionist platform built for agencies and resellers. Agencies use the platform to brand and resell AI receptionist subscriptions to local service businesses for $99 to $299 per month. The platform automatically provisions the AI voice agent, dedicated phone number, and client-facing dashboard at signup. Subscription payments flow directly to the agency through Stripe Connect, and the underlying infrastructure, voice synthesis, telephony, payments, database, hosting, is operated by VoiceAI Connect as a single integrated product.' },
                { q: 'Do my clients get their own dashboard?', a: 'Yes. Every business you onboard receives their own fully branded dashboard, call recordings, time-coded transcripts, AI-generated summaries, contact management, and configurable SMS and email alerts. They never see your other clients or your agency backend. You get a separate agency dashboard where you manage all clients, revenue, branding, and operations from one interface.' },
                { q: 'How does the white-label experience work?', a: 'Every client-facing surface is configured per agency: logo, color palette, custom domain with auto-provisioned SSL, transactional emails, marketing website, and the phone experience itself. End clients interact only with the agency&apos;s brand. VoiceAI Connect is not visible to the businesses you serve at any point in the lifecycle, from signup through ongoing usage to billing.' },
                { q: 'Does the AI filter spam and robocalls?', a: 'Yes, automatically, on every plan. The AI detects telemarketers, robocalls, and solicitors and ends those calls immediately. Spam calls are not counted against the client&apos;s monthly limit. The business owner receives a notification when spam is blocked, and you can see spam metrics across all clients in the agency dashboard. No configuration required, it works out of the box.' },
                { q: 'Can the AI handle multiple calls at the same time?', a: 'Unlimited simultaneous calls. Unlike a human receptionist who can only answer one call at a time, the AI handles as many concurrent calls as needed, no busy signals, no hold music, no missed calls during peak hours. This is one of the strongest selling points to local businesses, especially restaurants, medical offices, and home service companies with high call volume.' },
                { q: 'Do my clients need a website?', a: 'No. Clients just need a phone number. They forward their existing business line to the AI number, or use the AI number directly. There is nothing to install, no website required, and no technical setup on their end. If they do have a website, the AI can scan it automatically to learn about their business, but it is not required.' },
                { q: 'What happens if the AI transfers a call and nobody picks up?', a: 'The AI stays on the line. Instead of sending the caller to voicemail or dropping the call, it says something like "It looks like the team isn&apos;t available right now, I can take a message for you." It collects the caller&apos;s name, phone number, and what they need, then sends the business owner a text summary. The caller never hits a dead end.' },
                { q: 'What information do I need from each client to get them set up?', a: 'Just the basics: business name, industry, phone number, and some information about their services, hours, and common questions. Everything is entered through the branded signup flow, no files to send back and forth. If the client has a website, the AI scans it automatically. The entire client onboarding completes in under sixty seconds.' },
                { q: 'Can I onboard multiple clients at once?', a: 'Yes, no bottleneck. Each client gets their own AI receptionist, phone number, and dashboard within seconds of signing up through your branded page. You can onboard one client or fifty in the same afternoon. The platform provisions everything automatically.' },
                { q: 'Who handles client support, me or VoiceAI Connect?', a: 'You are the point of contact for your clients, that is the white-label model. Your clients interact with your brand through their dashboard and never contact VoiceAI Connect directly. On our side, we provide platform support to you as the agency operator. If you hit a technical issue, we resolve it. Your clients see you as the provider.' },
                { q: 'How is VoiceAI Connect different from GoHighLevel?', a: 'GoHighLevel is a multi-purpose marketing platform, CRM, funnels, email, SMS, websites, designed for marketing agencies to manage client campaigns. VoiceAI Connect is purpose-built for one product: AI receptionist resale. Three concrete differences: end clients receive their own branded dashboard (GoHighLevel does not provide one), client onboarding completes in under sixty seconds (GoHighLevel requires per-client A2P registration that can take days), and the agency interface is mobile-first (GoHighLevel is desktop-bound).' },
                { q: 'Does the AI receptionist integrate with Google Calendar?', a: 'Yes, and it is included on every plan, including Free. When a caller requests an appointment, the AI checks the business owner&apos;s Google Calendar for available time slots in real time, offers options to the caller, and creates the calendar event automatically with the caller&apos;s name, phone number, and reason for the appointment. The booking appears in Google Calendar instantly, which means it also syncs automatically to any connected CRM, HubSpot, Salesforce, Pipedrive, and can trigger downstream automations via Zapier or Make.' },
                { q: 'Does the AI work in Spanish?', a: 'Yes, automatic English and Spanish on every plan, no configuration required. The AI detects when a caller speaks Spanish and switches to Spanish for the entire conversation. It collects names, phone numbers, appointment requests, and everything else in Spanish, then sends the business owner a summary in English. This is especially valuable for home services, medical, dental, and restaurant businesses serving Spanish-speaking communities.' },
                { q: 'What does it cost to start an AI receptionist agency?', a: 'The platform offers three tiers. The Free tier has no platform fee, agencies pay $29.99 per client per month plus $0.12 per minute of voice usage, making it zero-risk to start. The Pro tier costs $99 per month and includes full white-label branding, a marketing website, and a demo phone line, with reduced per-client ($9.99) and per-minute ($0.10) rates. The Scale tier at $499 per month eliminates per-client fees entirely at $0.05 per minute. Pro and Scale both include a 14-day free trial, you add a card to start it and aren&apos;t charged until the trial ends. On the client side, every plan includes a 7-day free trial for the businesses you onboard, giving your clients a risk-free way to experience the AI receptionist before their first billing cycle. Google Calendar integration is included on all tiers.' },
                { q: 'How many team members can I add to my agency?', a: 'Team-member capacity scales with your plan. The Free plan is solo, just you as the agency owner. The Pro plan includes up to 3 team members, which is enough for most operators to bring on a sales partner, a client success manager, and a virtual assistant for outreach. The Scale plan includes unlimited team members for high-volume agencies running larger operations. Each member gets their own login and configurable permissions: dashboard, clients, leads, outreach, analytics, marketing, settings, and billing can all be toggled per member, so you can give a VA access to outreach without exposing your Stripe revenue, or give a sales rep client management without settings access. Separately, the businesses you onboard each receive their own team-member slots, included on Pro (2 per client) and unlimited on Scale, so your clients can give their own employees dashboard access without an additional charge.' },
                { q: 'How do free trials work, and why is a card required?', a: 'There are two separate trials. At the agency level, the Pro and Scale plans include a 14-day free trial: you add a card to start it and are not charged until day 14, with full access to white-label branding, the marketing site, CRM, and every feature, and you can cancel anytime before day 14 at no cost. The card keeps the trial reserved for operators seriously building an agency, since trials cost real money to run, phone numbers, voice minutes, and infrastructure, and it lets us keep platform pricing low. The Free plan needs no card and starts immediately, there is no platform fee to trial against. At the client level, every plan (Free, Pro, and Scale) includes a 7-day free trial for the businesses you onboard: when a local business signs up through your branded page, they get seven days of full AI receptionist service before their first billing cycle begins, which increases conversion from prospect to paying subscriber.' },
                { q: 'Can VoiceAI Connect be used internationally?', a: 'Yes, both the operator and the phone numbers. Agency operators in any country can sign up and run a workspace, an operator based in India, the Philippines, or anywhere else can run a US-focused agency remotely, and Stripe Connect supports payouts to most major countries. For numbers, US lines are provisioned automatically via Telnyx; for UK, Canadian, or other international numbers, agencies connect their own Twilio account by pasting their API credentials in the dashboard, and the platform routes those clients through Twilio automatically. End-client coverage is available in the United States, United Kingdom, and Canada, with identical AI behavior, dashboards, billing, and onboarding.' },
                { q: 'How do agencies acquire clients on the platform?', a: 'The platform includes a built-in lead generation CRM with thirteen pre-written outreach templates, a Google Maps business prospecting tool, sales scripts, and reply tracking. The strongest conversion tool is the interactive AI demo phone line, included on the Pro tier, prospects call the demo number, experience the AI receptionist firsthand, and typically convert without requiring a sales call.' },
                { q: 'Are technical skills required to operate the platform?', a: 'No. Configuration is point-and-click: upload a logo, select a color palette, set pricing tiers, share a signup link. The platform handles AI agent configuration, phone number provisioning, billing setup, and ongoing operations automatically. There is no code to write and no infrastructure to manage.' },
                { q: 'What integrations and infrastructure power the platform?', a: 'VoiceAI Connect orchestrates sixteen enterprise infrastructure providers behind a single application: Anthropic Claude for reasoning, ElevenLabs for voice synthesis, Deepgram for real-time speech-to-text, OpenAI Whisper for batch transcription, Telnyx for US phone numbers and SIP trunking, Twilio for UK and international numbers, Google Calendar for real-time appointment booking, Stripe Connect for subscription billing, Supabase for Postgres and authentication, Make and n8n for workflow automation, Vercel and Cloudflare for the edge layer, Brevo for transactional email, Sentry for error monitoring, and PostHog for product analytics.' },
                { q: 'What happens if I cancel my subscription?', a: 'Cancellation is available at any time, with no holdback period or penalty. Operators retain ownership of their client list, custom domain, Stripe Connect account, and all client data. Existing clients can be migrated to another platform or terminated at the operator&apos;s discretion.' },
];

const decodeEntities = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');

const HOME_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'VoiceAI Connect',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512x512.png`, width: 512, height: 512 },
      description: 'White-label AI receptionist platform for marketing agencies and resellers.',
      email: 'support@myvoiceaiconnect.com',
      sameAs: ['https://www.linkedin.com/company/voiceai-connect/'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'VoiceAI Connect',
      description: 'The white-label AI receptionist platform for agencies.',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: 'VoiceAI Connect',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      description: 'Multi-tenant voice AI platform for agencies to brand, resell, and manage AI receptionist subscriptions for local service businesses.',
      publisher: { '@id': `${SITE_URL}/#organization` },
      offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', description: 'No platform fee. Usage-based per-client and per-minute pricing.' },
        { '@type': 'Offer', name: 'Pro', price: '99', priceCurrency: 'USD', description: 'Full white-label branding, marketing website, and demo phone line.' },
        { '@type': 'Offer', name: 'Scale', price: '499', priceCurrency: 'USD', description: 'No per-client fees, lowest per-minute rate, unlimited team members.' },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: decodeEntities(item.q),
        acceptedAnswer: { '@type': 'Answer', text: decodeEntities(item.a) },
      })),
    },
  ],
};

export default function HomePage() {
  const { formatPrice } = usePrice();

  const [clients, setClients] = useState(50);
  const [pricePerClient, setPricePerClient] = useState(149);
  const monthlyPlatformFee = 99;
  const perClientCost = 9.99;
  const monthlyRevenue = clients * pricePerClient;
  const monthlyPlatformCost = monthlyPlatformFee + (clients * perClientCost);
  const monthlyProfit = monthlyRevenue - monthlyPlatformCost;
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
  const r10 = useInView();

  /* ─── Tower layers, outcome-focused copy ─── */
  const layers = [
    { n: '01', icon: Palette, title: 'Your brand on every surface', sub: 'Logo, color palette, custom domain, transactional emails, and the client phone experience are all configured per agency. End clients see your business at every touchpoint, VoiceAI Connect remains invisible from signup through ongoing usage.', features: ['Token-level color customization across the entire interface', 'Custom domain with auto-provisioned SSL certificates', 'Branded transactional emails and notification SMS'] },
    { n: '02', icon: Globe, title: 'A marketing website that closes for you', sub: 'Each agency receives a complete white-label marketing site, hero, pricing tiers, testimonials, and FAQ, with an interactive AI demo phone line that lets prospects experience the product before they ever speak to a human.', features: ['Conversion-optimized landing page deployed on signup', 'Dedicated AI demo phone number per agency', 'SEO metadata, Open Graph, and sitemap auto-generated'] },
    { n: '03', icon: Rocket, title: 'From signup to live AI in sixty seconds', sub: 'Local businesses fill out a branded form. The platform provisions everything in under a minute: AI voice agent configured for their business, dedicated phone number, dashboard credentials, and welcome sequence triggered. No A2P registration delay, no manual setup.', features: ['White-labeled signup flow tied to your domain', 'Automatic phone number provisioning, no A2P delay', 'Triggered welcome and activation email sequence'] },
    { n: '04', icon: Mic, title: 'An AI receptionist that never sleeps', sub: "The voice agent answers calls 24/7, automatically detects English or Spanish callers and responds in their language, books appointments directly to the client's Google Calendar, transfers urgent matters to the business owner in real time, and writes a summary on every interaction.", features: ['Sub-two-second response latency on every call', 'Google Calendar integration, books appointments in real time', 'Automatic English & Spanish with real-time detection'] },
    { n: '05', icon: MonitorSmartphone, title: 'What end clients log in to every day', sub: 'Each business receives a fully branded dashboard showing call recordings, time-coded transcripts, AI-generated summaries with intent and sentiment, lead categorization, and configurable SMS or email alerts on every interaction.', features: ['Full call recordings and time-coded transcripts', 'AI summary with intent and sentiment per call', 'SMS and email alerts on configurable triggers'] },
    { n: '06', icon: BarChart3, title: 'Run the entire agency from your phone', sub: 'The agency control surface shows every client, every call, and every dollar in a mobile-first interface. Add clients, modify branding, listen to recordings, and review revenue from anywhere, without ever opening a laptop.', features: ['Real-time MRR, churn, and revenue analytics', 'Per-client call volume and conversion tracking', 'Mobile-optimized layout with offline-capable PWA'] },
    { n: '07', icon: CreditCard, title: 'Money lands in your bank, not ours', sub: 'Stripe Connect routes every client subscription directly into your account at the price tier you set. Zero revenue share, zero holdbacks, zero middleman. The platform never sees the money, your clients pay you.', features: ['Direct-to-agency Stripe Connect deposits', 'Configurable subscription pricing per tier', 'Automated invoicing on every client signup'] },
    { n: '08', icon: Map, title: 'Find clients before your competition does', sub: 'The built-in CRM pulls local businesses directly from Google Maps, runs them through outreach sequences using thirteen conversion-tested email templates, and tracks every reply through a visual pipeline, all without leaving the platform.', features: ['Google Maps prospecting by category and radius', '13 conversion-tested outreach email templates', 'Visual pipeline with reply detection and follow-ups'] },
  ];

  return (
    <main className="min-h-screen bg-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSONLD) }} />
      <MarketingNav />

      {/* ════════ HERO ════════ */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-20 lg:pb-32 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={r1} className="fade-up max-w-4xl">
            <span className="racing-line" />
            <h1 className="t-h1 text-white max-w-[18ch]">
              The white-label AI receptionist platform for agencies.
            </h1>
            <p className="t-body mt-8 max-w-2xl text-[1rem]">
              VoiceAI Connect is a multi-tenant voice AI platform purpose-built for agencies and resellers. Brand the product as your own, onboard local businesses in under sixty seconds, and collect monthly recurring revenue while we operate the underlying infrastructure. Sixteen enterprise vendors integrated and shipped as a single agency-ready application.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-em">Get started free <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="#earnings" className="btn btn-ghost-dark">Project earnings <ArrowDown className="w-3.5 h-3.5" /></Link>
            </div>
            <Link href="/interactive-demo" className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-em mt-6 hover:opacity-80 transition-opacity">
              Or try the interactive demo <ArrowRight className="w-3 h-3" />
            </Link>
            <p className="font-mono text-[11px] text-white/35 mt-7">Start free · no card to begin · upgrade anytime</p>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 mt-24 lg:mt-32 relative">
          <p className="t-eyebrow text-white/35 mb-8 text-center">Built on enterprise infrastructure</p>
          <div className="trust-row">
            {([
              { n: 'Anthropic', d: 'anthropic.com' },
              { n: 'ElevenLabs', d: 'elevenlabs.io' },
              { n: 'Deepgram', d: 'deepgram.com' },
              { n: 'OpenAI', d: 'openai.com' },
              { n: 'Telnyx', img: '/telnyx.png' },
              { n: 'Twilio', d: 'twilio.com' },
              { n: 'Stripe', d: 'stripe.com' },
              { n: 'Supabase', d: 'supabase.com' },
              { n: 'Google', d: 'google.com' },
              { n: 'Vercel', d: 'vercel.com' },
              { n: 'Cloudflare', d: 'cloudflare.com' },
              { n: 'Sentry', d: 'sentry.io' },
              { n: 'PostHog', d: 'posthog.com' },
              { n: 'Brevo', d: 'brevo.com' },
              { n: 'Make', d: 'make.com' },
              { n: 'n8n', d: 'n8n.io' },
            ] as { n: string; d?: string; img?: string }[]).map(b => (
              <div key={b.n} className="trust-item">
                <img
                  src={b.img ?? `https://icons.duckduckgo.com/ip3/${b.d}.ico`}
                  alt={`${b.n} logo`}
                  width={22}
                  height={22}
                  loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  style={{ width: 22, height: 22, objectFit: 'contain' }}
                />
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
                      <p className="font-mono text-[11px] text-white/40 mt-2.5">Net of {formatPrice(monthlyPlatformFee)} platform + {formatPrice(perClientCost)}/client</p>
                    </div>
                    <div className="min-w-0">
                      <p className="t-eyebrow text-white/40 mb-2">Annualized</p>
                      <p className="text-white t-numeric font-display font-medium" style={{ fontSize: 'clamp(1.875rem, 3.6vw, 2.875rem)', lineHeight: 1, letterSpacing: '-0.04em' }}>{formatPrice(yearlyProfit)}</p>
                      <p className="font-mono text-[11px] text-white/40 mt-2.5">{margin}% gross margin · Pro plan</p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="calc-bar-row">
                      <span className="font-mono text-[10px] text-white/35 w-32 uppercase tracking-wider">Client revenue</span>
                      <div className="calc-bar-track"><div className="calc-bar-fill" style={{ width: '100%' }} /></div>
                      <span className="font-mono text-[11px] text-white/65 w-20 text-right">{formatPrice(monthlyRevenue)}</span>
                    </div>
                    <div className="calc-bar-row">
                      <span className="font-mono text-[10px] text-white/35 w-32 uppercase tracking-wider">Platform cost</span>
                      <div className="calc-bar-track"><div className="calc-bar-fill" style={{ width: `${Math.min(100, (monthlyPlatformCost / monthlyRevenue) * 100)}%`, background: 'rgba(255,255,255,0.22)' }} /></div>
                      <span className="font-mono text-[11px] text-white/65 w-20 text-right">−{formatPrice(monthlyPlatformCost)}</span>
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
              <p className="t-eyebrow text-em mb-6">What we run for you</p>
              <h2 className="t-h2 text-white">You never touch the infrastructure. We run all of it.</h2>
            </div>
            <div className="lg:col-span-6 lg:pt-2">
              <p className="t-body max-w-lg">
                VoiceAI Connect orchestrates sixteen specialized infrastructure providers behind a single agency-facing application. Anthropic&apos;s Claude handles reasoning. ElevenLabs synthesizes voice. Deepgram transcribes calls in real time. Telnyx routes US numbers, Twilio handles UK and international. Stripe Connect, Supabase, Vercel, and Cloudflare run the platform layer. Google Calendar powers real-time appointment booking. Sentry and PostHog cover monitoring and analytics, billed to you as a single flat fee.
              </p>
            </div>
          </div>

          <WhiteLabelStack />
        </div>
      </section>

      {/* ════════ WHITE-LABEL TOWER ════════ */}
      <section ref={towerSectionRef} className="bg-ink relative border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-28 lg:pt-40">
          <div className="max-w-2xl">
            <p className="t-eyebrow text-em mb-6">How it comes together</p>
            <h2 className="t-h2 text-white">Your entire agency, live in one onboarding.</h2>
            <p className="t-body mt-6 max-w-xl">
              Activate your workspace and everything you need to sell AI receptionists goes live at once: your brand, your marketing site, client onboarding, the AI receptionist, client and agency dashboards, Stripe billing, and lead generation. Integrated end to end, white-labeled to your brand, and packaged as one product to sell to local businesses.
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
                      <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(0, 227, 170, 0.35), transparent)' }} />
                    </div>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(0, 227, 170, 0.08)', border: '1px solid rgba(0, 227, 170, 0.18)' }}>
                        <l.icon className="w-4 h-4 text-em" strokeWidth={1.7} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-[22px] sm:text-[28px] lg:text-[32px] font-medium text-white leading-[1.1] tracking-tight break-words capitalize">{l.title}</h3>
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
                    {Array.from({ length: NUM_LAYERS }).map((_, i) => (<div key={i} className="tower-rail-tick" />))}
                  </div>

                  <div ref={towerStageRef} className="tower-stage">
                    <div className="tower-counter"><strong><span ref={towerCounterRef}>01</span></strong><span>/ 08</span></div>
                    <div className="tower-ground" />

                    <div className="tower-floor"><div className="tower-floor-row"><span className="tower-floor-num">01</span><span className="tower-floor-title">Brand identity</span><span className="tower-floor-meta">your-brand.com</span></div><div className="tower-floor-row mt-2"><span className="tower-floor-num" style={{ visibility: 'hidden' }}>01</span><div className="tower-color-row">{['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#0a0a0a'].map(c => (<span key={c} style={{ background: c }} />))}</div><span className="tower-floor-sub">Logo · palette · typography</span></div></div>
                    <div className="tower-floor"><div className="tower-floor-row"><span className="tower-floor-num">02</span><span className="tower-floor-title">Marketing website</span><span className="tower-floor-meta">+ AI demo line</span></div><div className="tower-floor-row mt-2"><span className="tower-floor-num" style={{ visibility: 'hidden' }}>02</span><div className="tower-mini-browser"><div className="tower-mini-browser-bar"><span /><span /><span /></div><div className="tower-mini-browser-body" /></div><span className="tower-floor-sub">Hero, pricing, testimonials, CTA</span></div></div>
                    <div className="tower-floor"><div className="tower-floor-row"><span className="tower-floor-num">03</span><span className="tower-floor-title">Self-serve onboarding</span><span className="tower-floor-meta text-em">60s</span></div><div className="tower-floor-row mt-2"><span className="tower-floor-num" style={{ visibility: 'hidden' }}>03</span><div className="tower-progress"><div className="tower-progress-fill" /></div><span className="tower-floor-sub">Signup → AI live + phone provisioned</span></div></div>
                    <div className="tower-floor"><div className="tower-floor-row"><span className="tower-floor-num">04</span><span className="tower-floor-title">AI receptionist</span><span className="tower-badge">Voice</span></div><div className="tower-floor-row mt-2"><span className="tower-floor-num" style={{ visibility: 'hidden' }}>04</span><div className="waveform">{Array.from({ length: 14 }).map((_, j) => (<span key={j} className="waveform-bar" style={{ animationDelay: `${j * 80}ms` }} />))}</div><span className="tower-floor-sub">English + Spanish · Google Calendar</span></div></div>
                    <div className="tower-floor"><div className="tower-floor-row"><span className="tower-floor-num">05</span><span className="tower-floor-title">Client dashboard</span><span className="tower-floor-meta">Per client</span></div><div className="tower-floor-row mt-2"><span className="tower-floor-num" style={{ visibility: 'hidden' }}>05</span><div className="tower-bar-row">{[3, 5, 7, 4, 6, 8, 5, 7, 9, 6, 4, 7].map((h, j) => (<span key={j} style={{ height: `${h * 1.6}px` }} />))}</div><span className="tower-floor-sub">Recordings · transcripts · summaries</span></div></div>
                    <div className="tower-floor"><div className="tower-floor-row"><span className="tower-floor-num">06</span><span className="tower-floor-title">Agency dashboard</span></div><div className="tower-floor-row mt-2"><span className="tower-floor-num" style={{ visibility: 'hidden' }}>06</span><span className="tower-stat">MRR</span><span className="tower-stat">Clients</span><span className="tower-stat">Call volume</span></div></div>
                    <div className="tower-floor"><div className="tower-floor-row"><span className="tower-floor-num">07</span><span className="tower-floor-title">Stripe Connect billing</span><span className="tower-badge">Connected</span></div><div className="tower-floor-row mt-2"><span className="tower-floor-num" style={{ visibility: 'hidden' }}>07</span><span className="font-mono text-[11px] text-white/55">Direct deposit to your bank, no holdback</span></div></div>
                    <div className="tower-floor"><div className="tower-floor-row"><span className="tower-floor-num">08</span><span className="tower-floor-title">Lead generation CRM</span><span className="tower-floor-meta">13 templates</span></div><div className="tower-floor-row mt-2"><span className="tower-floor-num" style={{ visibility: 'hidden' }}>08</span><div className="tower-pipeline"><span /><span /><span /></div><span className="tower-floor-sub">Maps prospecting + outreach templates</span></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-12 lg:pt-20 pb-28 lg:pb-40">
          <div className="border-t border-white/[0.06] pt-10 max-w-3xl">
            <p className="font-display text-[22px] sm:text-[26px] font-medium text-white leading-tight tracking-tight max-w-2xl">
              One platform to run. <span className="text-em">Your brand on it, your price, your recurring revenue.</span>
            </p>
            <Link href="/signup" className="btn btn-em mt-7">Get started <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      </section>

      {/* ════════ BENTO PLATFORM ════════ */}
      <section id="platform" className="bg-ink py-28 lg:py-40 border-t border-white/[0.04] scroll-mt-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r4} className="fade-up max-w-3xl mb-16">
            <p className="t-eyebrow text-em mb-6">Also included</p>
            <h2 className="t-h2 text-white">The rest of the operating system, included.</h2>
          </div>

          <div className="bento">
            <div className="bento-cell bento-c2"><div className="bento-cell-content"><p className="t-eyebrow text-em">Margin</p><p className="t-stat text-white mt-3 t-numeric">90<span className="text-em text-2xl align-top font-display">%+</span></p><p className="text-[12px] text-white/45 mt-3 leading-relaxed">Usage-based platform pricing. Your margin compounds as you add clients.</p></div></div>
            <div className="bento-cell bento-c2"><div className="bento-cell-content"><p className="t-eyebrow text-em flex items-center gap-2"><Lock className="w-3 h-3" />Security</p><p className="font-display text-[15px] text-white mt-3 leading-snug font-medium">Postgres row-level security. Encrypted, reputable cloud infrastructure. PII never persisted in logs.</p></div></div>
            <div className="bento-cell bento-c2"><div className="bento-cell-content"><p className="t-eyebrow text-em flex items-center gap-2"><Globe className="w-3 h-3" />Multilingual</p><p className="font-display text-[15px] text-white mt-3 leading-snug font-medium">Automatic English and Spanish with real-time language detection. The AI switches mid-call.</p></div></div>
            <div className="bento-cell bento-c2"><div className="bento-cell-content"><p className="t-eyebrow text-em flex items-center gap-2"><ShieldCheck className="w-3 h-3" />Spam filtering</p><p className="font-display text-[15px] text-white mt-3 leading-snug font-medium">Robocalls and telemarketers are detected and ended automatically. Spam never counts against a client&apos;s limit.</p></div></div>
            <div className="bento-cell bento-c2"><div className="bento-cell-content"><p className="t-eyebrow text-em flex items-center gap-2"><PhoneCall className="w-3 h-3" />Concurrent calls</p><p className="font-display text-[15px] text-white mt-3 leading-snug font-medium">Unlimited simultaneous calls. No busy signals, no hold music, no missed calls at peak hours.</p></div></div>
            <div className="bento-cell bento-c2"><div className="bento-cell-content"><p className="t-eyebrow text-em flex items-center gap-2"><Wand2 className="w-3 h-3" />Automation</p><p className="font-display text-[15px] text-white mt-3 leading-snug font-medium">Booked appointments flow from Google Calendar into your clients&apos; connected CRMs and tools automatically.</p></div></div>
            <div className="bento-cell bento-c6"><div className="bento-cell-content"><p className="t-eyebrow text-em mb-5">Also included on every plan</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3.5">{['Run it all from your phone', 'Google Calendar booking on every plan', 'Direct Stripe Connect payouts, no revenue share', '60-second client onboarding, no A2P delay', 'Branded AI demo phone line (Pro)', 'White-label marketing website'].map(x => (<div key={x} className="flex items-center gap-2.5 text-[13px] text-white/70"><Check className="w-3.5 h-3.5 text-em flex-shrink-0" strokeWidth={2.5} />{x}</div>))}</div></div></div>
          </div>
        </div>
      </section>

      {/* ════════ PLATFORM DEMO ════════ */}
      <section className="bg-ink py-28 lg:py-40 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mb-14">
            <p className="t-eyebrow text-em mb-4">Try it yourself</p>
            <span className="racing-line" />
            <h2 className="t-h2 text-white">Two ways to see exactly what you would sell.</h2>
            <p className="t-body mt-6 max-w-xl">
              No signup, no sales call. Call the live line to hear the AI answer like a real receptionist, or click through the actual dashboards your clients would use.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Call the demo line */}
            <div className="calc-shell p-8 lg:p-10 flex flex-col">
              <p className="t-eyebrow text-em mb-5">Call the demo line</p>
              <h3 className="font-display text-[24px] sm:text-[28px] font-medium text-white leading-tight tracking-tight">Hear the AI answer, live.</h3>
              <p className="text-[14px] text-white/60 mt-4 leading-relaxed max-w-md">
                Call and talk to it, it&apos;s the same voice AI your clients get. Ask it anything, and it will connect you to a live receptionist demo so you hear exactly what a caller experiences. Sixty seconds, from your own phone.
              </p>
              <a href={`tel:${PLATFORM_DEMO_TEL}`} className="mt-8 group inline-flex items-center gap-4 rounded-2xl border border-white/[0.09] bg-white/[0.015] px-6 py-5 hover:border-white/25 transition-colors self-start">
                <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,227,170,0.1)', border: '1px solid rgba(0,227,170,0.25)' }}><Phone className="w-5 h-5 text-em" /></span>
                <span>
                  <span className="block font-mono text-[10px] tracking-[0.14em] uppercase text-white/40">Tap to call, no signup</span>
                  <span className="block font-display text-[22px] sm:text-[26px] font-medium text-white t-numeric tracking-tight">{PLATFORM_DEMO_NUMBER}</span>
                </span>
                <span className="ml-2 waveform">{Array.from({ length: 10 }).map((_, j) => (<span key={j} className="waveform-bar" style={{ animationDelay: `${j * 80}ms` }} />))}</span>
              </a>
              <div className="mt-auto pt-8 flex flex-wrap gap-x-6 gap-y-2">
                {['Answers 24/7', 'Natural, human-sounding voice', 'Connects you to a live demo'].map(x => (
                  <span key={x} className="flex items-center gap-2 text-[12.5px] text-white/55"><Check className="w-3.5 h-3.5 text-em flex-shrink-0" strokeWidth={2.5} />{x}</span>
                ))}
              </div>
            </div>

            {/* Explore the dashboard */}
            <Link href="/interactive-demo" className="calc-shell p-8 lg:p-10 flex flex-col">
              <p className="t-eyebrow text-em mb-5">Explore the dashboard</p>
              <h3 className="font-display text-[24px] sm:text-[28px] font-medium text-white leading-tight tracking-tight">Click through the real product.</h3>
              <p className="text-[14px] text-white/60 mt-4 leading-relaxed max-w-md">
                Walk the agency and client dashboards with live sample data. Add a client, watch the AI book an appointment, then toggle into the white-labeled client view to see what you are selling.
              </p>
              <div className="mt-7 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-white/[0.025]"><span className="w-2 h-2 rounded-full bg-red-400/60" /><span className="w-2 h-2 rounded-full bg-yellow-400/60" /><span className="w-2 h-2 rounded-full bg-emerald-400/60" /><span className="ml-3 font-mono text-[10px] text-white/40">app.your-brand.com</span></div>
                <div className="p-4 grid grid-cols-3 gap-2.5">
                  {[['MRR', '$12,480'], ['Clients', '34'], ['Calls', '2,911']].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-white/[0.07] bg-white/[0.012] p-2.5"><p className="font-mono text-[8px] tracking-[0.12em] text-white/40 uppercase">{k}</p><p className="font-display text-[15px] font-medium text-white mt-0.5 t-numeric">{v}</p></div>
                  ))}
                </div>
              </div>
              <span className="mt-auto pt-8 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] uppercase text-em">Open the interactive demo <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ TIME BACK (human) ════════ */}
      <section className="bg-ink py-28 lg:py-40 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mb-14">
            <p className="t-eyebrow text-em mb-4">What you&apos;re really selling</p>
            <span className="racing-line" />
            <h2 className="t-h2 text-white">You&apos;re not selling AI. You&apos;re selling their time back.</h2>
            <p className="t-body mt-6 max-w-xl">
              The businesses you sign up stop dropping everything to answer the phone. The AI knows their calendar and books the estimate, the appointment, the callback, while they&apos;re on a job, mid-haircut, or at dinner. And when a call genuinely needs the owner, it escalates and transfers, so they&apos;re only interrupted when it actually matters.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { Icon: Calendar, t: 'Books straight to their calendar', d: 'Estimates, appointments, and callbacks land on their Google Calendar in real time, during the call.' },
              { Icon: PhoneCall, t: 'Handles the calls they used to stop for', d: 'The repetitive questions and bookings get answered 24/7, so they never drop what they are doing to pick up.' },
              { Icon: ArrowUpRight, t: 'Escalates only what truly needs them', d: 'Emergencies and VIPs get transferred through. Everything else is handled, then summarized to them by text.' },
            ].map(c => (
              <div key={c.t} className="bento-cell">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,227,170,0.1)', border: '1px solid rgba(0,227,170,0.2)' }}><c.Icon className="w-5 h-5 text-em" /></div>
                <h3 className="font-display text-[16px] text-white mt-4 font-medium">{c.t}</h3>
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--steel-300)' }}>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ GOOGLE CALENDAR + INTEGRATIONS ════════ */}
      <section className="section-graphite py-28 lg:py-40 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r10} className="fade-up grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            <div className="lg:col-span-5">
              <p className="t-eyebrow text-em mb-6">Scheduling &amp; integrations</p>
              <h2 className="t-h2 text-white">Every appointment booked. Straight to Google Calendar.</h2>
              <p className="t-body mt-6 max-w-md">
                When a caller says &quot;I need to schedule an appointment,&quot; the AI checks the business owner&apos;s Google Calendar in real time, offers available slots, and books it on the spot. The event appears instantly, complete with the caller&apos;s name, phone number, and reason for the visit.
              </p>
              <p className="t-body mt-4 max-w-md">
                No back-and-forth. No missed bookings. No third-party scheduling tool required. Google Calendar integration is <strong className="text-white">included on every plan, including Free.</strong>
              </p>
              <Link href="/signup" className="btn btn-em mt-9">Start free, includes calendar <ArrowUpRight className="w-3.5 h-3.5" /></Link>
            </div>

            <div className="lg:col-span-7">
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 lg:p-8">
                  <p className="font-mono text-[10px] text-em tracking-[0.16em] uppercase mb-6">How it works during a call</p>
                  <div className="space-y-5">
                    {[
                      { step: '01', label: 'Caller requests appointment', detail: '"I\'d like to schedule a consultation for next week"' },
                      { step: '02', label: 'AI checks Google Calendar', detail: 'Reads real-time availability across all connected calendars' },
                      { step: '03', label: 'Offers available slots', detail: '"I have Tuesday at 10am or Thursday at 2pm, which works better?"' },
                      { step: '04', label: 'Books and confirms', detail: 'Event created with caller name, phone, and reason, owner notified instantly' },
                    ].map(s => (
                      <div key={s.step} className="flex gap-4 items-start">
                        <span className="font-mono text-[11px] text-em mt-1 w-6 flex-shrink-0">{s.step}</span>
                        <div>
                          <p className="font-display text-[15px] text-white font-medium">{s.label}</p>
                          <p className="text-[13px] text-white/50 mt-1">{s.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 lg:p-8">
                  <p className="font-mono text-[10px] text-em tracking-[0.16em] uppercase mb-3">Beyond the calendar</p>
                  <p className="text-[14px] text-white/60 leading-relaxed mb-6">
                    Google Calendar is the hub. Every appointment the AI books automatically flows into the business owner&apos;s existing tools, CRM records created, follow-up emails triggered, team notifications sent. The phone call becomes the start of a complete digital pipeline.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'HubSpot', desc: 'Auto-create CRM contacts' },
                      { name: 'Salesforce', desc: 'Sync deals and activities' },
                      { name: 'Zapier', desc: 'Connect 6,000+ apps' },
                      { name: 'Make', desc: 'Visual workflow automation' },
                      { name: 'Google Meet', desc: 'Auto-add video links' },
                      { name: 'Slack', desc: 'Team booking notifications' },
                    ].map(int => (
                      <div key={int.name} className="rounded-lg p-3 border border-white/[0.06] bg-white/[0.008]">
                        <p className="font-display text-[13px] text-white font-medium">{int.name}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{int.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[12px] text-white/35 mt-4">Google Calendar syncs natively with these platforms. Appointments booked by the AI flow through automatically, no additional configuration required from your clients.</p>
                </div>
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
            <p className="t-body mt-6 max-w-xl">The path from signup to a fully branded, billable AI receptionist agency is short and self-serve. Most operators complete the entire setup over a weekend.</p>
          </div>
          <div className="rail">
            {[
              { s: '01', t: 'Configure your brand identity', d: 'Upload a logo, define a color palette, set pricing tiers, and connect a custom domain. The complete agency surface deploys under your brand.', icon: Wand2 },
              { s: '02', t: 'Connect your Stripe account', d: 'Authorize VoiceAI Connect via Stripe OAuth. Client subscriptions deposit directly into your account. We never custody funds.', icon: CreditCard },
              { s: '03', t: 'Distribute your signup link', d: 'Send prospects to your white-labeled onboarding page. Once they complete the form, the platform provisions their AI agent and phone number in under 60 seconds.', icon: ArrowUpRight },
              { s: '04', t: 'Collect monthly recurring revenue', d: 'Calls flow into client dashboards. You scale by adding more clients to the same workspace. Margin compounds as you grow.', icon: BarChart3 },
            ].map((c) => (
              <article key={c.s} className="rail-card" style={{ background: '#fafafa', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between mb-7"><span className="font-mono text-[11px] text-black/40 tracking-[0.16em] uppercase">Step {c.s}</span><c.icon className="w-4 h-4 text-emerald-700" strokeWidth={1.7} /></div>
                <h3 className="font-display text-[22px] font-medium text-black leading-tight tracking-tight">{c.t}</h3>
                <p className="text-[14px] text-black/60 leading-relaxed mt-4">{c.d}</p>
                <div className="mt-auto pt-8 font-mono text-[40px] font-medium text-black/[0.06] leading-none tracking-tight">{c.s}</div>
              </article>
            ))}
          </div>
          <p className="font-mono text-[11px] text-black/30 mt-6 uppercase tracking-[0.16em]">→ scroll for steps 02 to 04</p>
        </div>
      </section>

      {/* ════════ COMPARISON ════════ */}
      <section id="compare" className="bg-paper-soft py-28 lg:py-40 scroll-mt-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r6} className="fade-up max-w-3xl mb-14">
            <p className="t-eyebrow text-em-deep mb-4">Comparison</p>
            <span className="racing-line" />
            <h2 className="t-h2 text-black">Most platforms make white-label expensive. We make it the entry point.</h2>
            <p className="t-body mt-6 max-w-xl">White-label starts at $99 a month here. Synthflow gates it behind a roughly $2,000 a month add-on, and general agency tools bolt receptionist resale onto a product built for direct sale. VoiceAI Connect was built for agency-to-client resale from day one.</p>
          </div>

          {/* Desktop table (hidden on smaller screens, it does not fit) */}
          <div className="hidden lg:block bg-paper rounded-3xl border border-black/[0.05] overflow-hidden">
            <div className="compare-row compare-row-head">
              <div className="font-mono text-[10px] tracking-[0.16em] text-black/40 uppercase">Feature</div>
              <div className="text-center compare-cell-em font-display text-[14px] font-medium text-black px-3 py-2">VoiceAI Connect</div>
              <div className="text-center font-display text-[13px] text-black/55">Synthflow</div>
              <div className="text-center font-display text-[13px] text-black/55">GoHighLevel</div>
              <div className="text-center font-display text-[13px] text-black/55">Vapi / Retell</div>
            </div>
            {[
              ['White-label from $99/mo, not a $2,000 add-on', true, false, false, false],
              ['Each end client gets their own branded dashboard', true, false, false, false],
              ['Client live in under 60 seconds, no per-client A2P', true, false, false, false],
              ['Subscriptions pay you directly via Stripe Connect', true, false, true, false],
              ['Built-in lead-gen CRM (Maps prospecting + outreach)', true, false, true, false],
              ['Purpose-built for AI receptionist resale', true, false, false, false],
              ['Turnkey, no engineering required', true, true, true, false],
            ].map(([f, v, sy, g, b]) => (
              <div key={f as string} className="compare-row text-[13.5px] text-black/72">
                <div className="pr-4">{f as string}</div>
                <div className="text-center compare-cell-em px-3 py-3">{v ? <Check className="w-4 h-4 mx-auto" style={{ color: '#00c596' }} strokeWidth={2.5} /> : <XIcon className="w-3.5 h-3.5 text-black/20 mx-auto" />}</div>
                <div className="text-center">{sy ? <Check className="w-4 h-4 text-black/45 mx-auto" /> : <XIcon className="w-3.5 h-3.5 text-black/15 mx-auto" />}</div>
                <div className="text-center">{g ? <Check className="w-4 h-4 text-black/45 mx-auto" /> : <XIcon className="w-3.5 h-3.5 text-black/15 mx-auto" />}</div>
                <div className="text-center">{b ? <Check className="w-4 h-4 text-black/45 mx-auto" /> : <XIcon className="w-3.5 h-3.5 text-black/15 mx-auto" />}</div>
              </div>
            ))}
          </div>

          {/* Mobile: the full table does not fit, so show the wedge as bullets */}
          <div className="lg:hidden space-y-3">
            {[
              'White-label from $99/mo, not a $2,000 add-on',
              'Every end client gets their own branded dashboard',
              'First client live today, no per-client A2P delay',
              'Subscriptions pay you directly via Stripe Connect',
              'Purpose-built for AI receptionist resale, not a bolted-on feature',
            ].map(x => (
              <div key={x} className="flex items-start gap-3 rounded-xl border border-black/[0.06] bg-paper px-4 py-3.5">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#00c596' }} strokeWidth={2.5} />
                <span className="text-[14px] text-black/72 leading-snug">{x}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PRICING ════════ */}
      <section id="pricing" className="bg-ink py-28 lg:py-40 scroll-mt-24 border-t border-white/[0.04] relative overflow-hidden">
        <div className="pricing-wash" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={r7} className="fade-up max-w-2xl mb-14">
            <p className="t-eyebrow text-em mb-6">Pricing</p>
            <h2 className="t-h2 text-white">Start free. Scale when ready.</h2>
            <p className="t-body mt-6 max-w-lg">
              Start free with per-usage billing, or lock in lower rates with a 14-day Pro or Scale trial. Every plan includes a 7-day free trial for the clients you onboard. No revenue share, no hidden fees.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 max-w-5xl">
            {AGENCY_PLAN_TIER_LIST.map(t => (
              <div key={t.name} className={`price-card ${t.popular ? 'price-card-em' : ''}`}>
                {t.popular && (
                  <div className="absolute -top-3 left-7">
                    <span className="rounded-full text-black px-3 py-1 font-mono text-[10px] tracking-[0.14em] font-medium uppercase" style={{ background: '#00e3aa' }}>Most popular</span>
                  </div>
                )}
                <p className={`font-mono text-[11px] tracking-[0.14em] uppercase ${t.popular ? 'text-em' : 'text-white/40'}`}>{t.description}</p>
                <p className="font-display text-lg font-medium mt-1.5 text-white">{t.name}</p>
                {t.trial && <p className="font-mono text-[11px] text-em mt-3 tracking-[0.04em]">{t.trial}</p>}
                <div className="my-6 flex items-baseline gap-1">
                  {t.price === 0 ? (
                    <span className="font-display font-medium t-numeric text-white" style={{ fontSize: 'clamp(2.25rem, 4vw, 3rem)', letterSpacing: '-0.04em' }}>Free</span>
                  ) : (
                    <>
                      <span className="font-display font-medium t-numeric text-white" style={{ fontSize: 'clamp(2.25rem, 4vw, 3rem)', letterSpacing: '-0.04em' }}>{formatPrice(t.price)}</span>
                      <span className="text-base text-white/45">/mo</span>
                    </>
                  )}
                </div>
                <ul className="space-y-2.5 mb-7">
                  {t.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px]"><Check className="w-3.5 h-3.5 shrink-0 mt-1 text-em" strokeWidth={2.5} /><span className="text-white/75">{f}</span></li>
                  ))}
                  <li className="flex items-start gap-2.5 text-[13px]"><Check className="w-3.5 h-3.5 shrink-0 mt-1 text-em" strokeWidth={2.5} /><span className="text-white/75">{t.rate}</span></li>
                  {t.limitations.map(l => (
                    <li key={l} className="flex items-start gap-2.5 text-[13px]"><XIcon className="w-3.5 h-3.5 shrink-0 mt-1 text-white/20" /><span className="text-white/30">{l}</span></li>
                  ))}
                </ul>
                <Link href="/signup" className={`block w-full text-center rounded-full py-3 font-mono text-[11px] tracking-[0.12em] uppercase font-medium transition-all ${t.popular ? 'text-black hover:brightness-110' : 'border border-white/15 text-white hover:bg-white hover:text-black hover:border-white'}`} style={t.popular ? { background: '#00e3aa' } : undefined}>
                  {t.price === 0 ? 'Start free' : 'Start 14-day trial'}
                </Link>
              </div>
            ))}
          </div>
          <p className="font-mono text-[11px] text-white/35 mt-12 text-center uppercase tracking-[0.14em]">Start free, no card · 14-day Pro &amp; Scale trials (card required) · 7-day client trials</p>
        </div>
      </section>

      {/* ════════ DEVELOPERS ════════ */}
      <section className="bg-ink py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-5">
              <p className="t-eyebrow text-em mb-6">For developers</p>
              <h2 className="t-h2 text-white">Wire it into your own stack.</h2>
              <p className="t-body mt-6 max-w-md">
                Beyond the no-code dashboard, VoiceAI Connect gives you a REST API and signed webhooks, so you can automate client onboarding and push call and booking data into your own systems. Available on the Scale plan.
              </p>
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.012] p-6 flex flex-col">
                <p className="t-eyebrow text-em mb-3">REST API</p>
                <p className="text-[14px] text-white/70 leading-relaxed">Generate scoped API keys (read or read and write) from your dashboard and manage clients, calls, and leads programmatically.</p>
                <div className="mt-auto pt-5 font-mono text-[11px] text-white/55 rounded-lg border border-white/[0.07] bg-black/40 px-3 py-2.5">Authorization: Bearer vac_live_...</div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.012] p-6 flex flex-col">
                <p className="t-eyebrow text-em mb-3">Signed webhooks</p>
                <p className="text-[14px] text-white/70 leading-relaxed">Subscribe an endpoint to real-time events. Every payload is HMAC-SHA256 signed, so you can verify it came from us.</p>
                <div className="mt-auto pt-5 flex flex-wrap gap-1.5">
                  {['call.completed', 'call.transferred', 'appointment.booked', 'client.provisioned'].map(e => (
                    <span key={e} className="font-mono text-[10px] text-white/60 rounded-md border border-white/[0.07] bg-white/[0.012] px-2 py-1">{e}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FAQ ════════ */}
      <section className="bg-ink py-28 lg:py-40 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r8} className="fade-up grid lg:grid-cols-12 gap-12 lg:gap-20">
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-32">
                <p className="t-eyebrow text-em mb-6">Frequently asked questions</p>
                <h2 className="t-h2 text-white">Frequently asked questions.</h2>
                <p className="t-body mt-6 max-w-sm">Have a question that isn&apos;t answered here? Email <a href="mailto:support@myvoiceaiconnect.com" className="text-em underline-offset-4 hover:underline">support@myvoiceaiconnect.com</a>. A team member responds within one business day.</p>
              </div>
            </aside>

            <div className="lg:col-span-8">
              {FAQ_ITEMS.map((item, i) => (
                <details key={i} className="faq-item">
                  <summary className="flex items-start justify-between gap-6 py-6 cursor-pointer select-none">
                    <span className="font-display text-[17px] sm:text-[18px] text-white/90 leading-snug font-medium" dangerouslySetInnerHTML={{ __html: item.q }} />
                    <Plus className="faq-chev w-5 h-5 text-white/30 shrink-0 mt-1 transition-transform duration-300" />
                  </summary>
                  <div className="pb-6 -mt-1 max-w-2xl"><p className="text-[14px] text-white/55 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.a }} /></div>
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
            <h2 className="t-h1 text-white">Your brand, your clients, your recurring revenue.</h2>
            <p className="t-body mt-7 max-w-lg">
              Start free with usage-based billing and no card, then unlock full white-label branding, your own domain, and a marketing site on a 14-day Pro trial. Connect Stripe Connect, share your signup link, and add your first client whenever you&apos;re ready.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/signup" className="btn btn-em">Get started free <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/interactive-demo" className="btn btn-ghost-dark">Watch demo <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}