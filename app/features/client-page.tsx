'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import {
  ArrowUpRight, ArrowRight, ArrowDown,
  Mic, Phone, MessageSquare, FileText, Bell, Volume2, Calendar, Globe, Bot,
  Palette, Rocket, CreditCard, BarChart3, Map, Smartphone, Users, Wand2,
  Lock, Database, Cloud, Gauge, Zap, RefreshCw, Search, Download, Server,
} from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

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

type Feature = { icon: React.ElementType; title: string; desc: string; href?: string };
type Group = { eyebrow: string; label: string; features: Feature[] };

const GROUPS: Group[] = [
  {
    eyebrow: 'AI receptionist',
    label: 'The voice agent',
    features: [
      { icon: Mic, title: 'AI voice receptionist', desc: 'Sub-2-second response. Answers, books, transfers, summarizes every call.', href: '/features/ai-intelligence' },
      { icon: Volume2, title: 'Voice options', desc: 'Multiple ElevenLabs voices per agency. Match tone to the brand.', href: '/features/voice-options' },
      { icon: Globe, title: 'Multilingual', desc: 'English, Spanish, French, and German included. Auto-detected per caller.' },
      { icon: Calendar, title: 'Appointment booking', desc: 'Native integration with Google Calendar, Cal.com, and HubSpot.', href: '/features/appointments' },
      { icon: Bell, title: 'Urgency detection', desc: 'AI flags emergency or high-priority calls and routes them to the owner.', href: '/features/urgency-detection' },
      { icon: Bot, title: 'Knowledge base', desc: 'Per-client trained context. Answers business-specific questions accurately.', href: '/features/knowledge-base' },
    ],
  },
  {
    eyebrow: 'Call records',
    label: 'What happens after the call',
    features: [
      { icon: FileText, title: 'Recordings + transcripts', desc: 'Time-coded transcript on every call. Full audio archive.', href: '/features/call-recordings' },
      { icon: Zap, title: 'AI summaries', desc: 'Intent, sentiment, requests, and follow-up — written automatically.', href: '/features/ai-summaries' },
      { icon: MessageSquare, title: 'SMS summaries', desc: 'Owner gets a text recap immediately after each call.', href: '/features/sms-summaries' },
      { icon: Search, title: 'Searchable archive', desc: 'Search by phone number, business, intent, or transcript text.' },
      { icon: Download, title: 'Exports', desc: 'CSV and JSON export per client or across the agency.', href: '/features/exports' },
      { icon: Phone, title: 'Voicemail handling', desc: 'AI takes voicemail when configured to escalate to owner asynchronously.', href: '/features/voicemail' },
    ],
  },
  {
    eyebrow: 'Agency tools',
    label: 'Run the business',
    features: [
      { icon: Palette, title: 'White-label branding', desc: 'Logo, palette, custom domain, transactional emails — all configurable.', href: '/features/white-label' },
      { icon: Rocket, title: 'Auto-provisioning', desc: 'Client signs up → AI live + phone number ready in under 60 seconds.', href: '/features/auto-provisioning' },
      { icon: CreditCard, title: 'Stripe Connect billing', desc: 'Direct subscriptions to your bank. No revenue share.', href: '/features/stripe-connect' },
      { icon: BarChart3, title: 'Agency dashboard', desc: 'MRR, churn, per-client volume — mobile-first.', href: '/features/mobile-dashboard' },
      { icon: Map, title: 'Lead generation CRM', desc: 'Google Maps prospecting + 13 outreach templates + reply tracking.', href: '/features/leads-crm' },
      { icon: Globe, title: 'Marketing site', desc: 'Pre-built conversion-tuned site with embedded AI demo number.', href: '/features/marketing-site' },
      { icon: Smartphone, title: 'Mobile-first PWA', desc: 'Run the agency from a phone. Offline-capable.' },
      { icon: Users, title: 'Team members', desc: 'Invite teammates and shared client users on Pro and Enterprise.' },
    ],
  },
  {
    eyebrow: 'End-client experience',
    label: 'What clients see',
    features: [
      { icon: Phone, title: 'Dedicated phone numbers', desc: 'Real local numbers per client — Telnyx for US, Twilio for international.', href: '/features/phone-numbers' },
      { icon: Smartphone, title: 'Branded client dashboard', desc: 'End-client portal under your domain with their own logins.', href: '/features/client-crm' },
      { icon: Bell, title: 'SMS + email alerts', desc: 'Configurable triggers — urgent calls, new leads, missed appointments.', href: '/features/notifications' },
      { icon: Gauge, title: 'Business hours', desc: 'Per-client schedule. AI handles after-hours, transfers in-hours.', href: '/features/business-hours' },
      { icon: RefreshCw, title: '24/7 coverage', desc: 'No staffing gaps, no off-hours, no holidays.', href: '/features/24-7-coverage' },
      { icon: Phone, title: 'Live AI demo line', desc: 'Pro tier ships a branded demo number prospects can call.', href: '/features/ai-demo' },
    ],
  },
  {
    eyebrow: 'Platform & infrastructure',
    label: 'The substrate',
    features: [
      { icon: Lock, title: 'Encryption + RLS', desc: 'Postgres row-level security per agency. PII never written to logs.', href: '/features/security' },
      { icon: Server, title: 'Industry compliance', desc: 'HIPAA-ready architecture. SOC2-compliant vendors throughout.', href: '/features/hipaa' },
      { icon: Cloud, title: '99.99% uptime', desc: 'Vercel edge + Cloudflare. Sentry monitors every request.', href: '/features/uptime' },
      { icon: Wand2, title: 'API access', desc: 'REST API for agency operations and client provisioning. Pro+ tier.', href: '/features/api-access' },
      { icon: Database, title: 'Workflow automations', desc: 'Make and n8n event hooks fire on every platform action.' },
      { icon: Zap, title: 'Industry templates', desc: 'Pre-built agent prompts for medical, legal, home services, and more.', href: '/features/industries' },
    ],
  },
];

export default function FeaturesIndexPage() {
  const r1 = useInView();
  const r2 = useInView();

  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-16 lg:pb-24 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={r1} className="fade-up max-w-4xl">
            <p className="t-eyebrow text-em mb-7">Features</p>
            <h1 className="t-h1 text-white max-w-[16ch]">Every feature, in one place.</h1>
            <p className="t-body mt-8 max-w-2xl text-[1rem]">
              The complete catalog of what ships with a VoiceAI Connect workspace — grouped by who uses it. The AI voice agent, the agency control surface, the end-client portal, and the platform underneath. Click any feature for a deep dive.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/platform" className="btn btn-ghost-dark">Platform overview <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE GROUPS */}
      <section className="bg-ink py-16 lg:py-24 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-20 lg:space-y-28">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <div className="max-w-3xl mb-10">
                <p className="t-eyebrow text-em mb-5">{g.eyebrow}</p>
                <h2 className="font-display font-medium text-white tracking-tight" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.25rem)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  {g.label}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.features.map((f) => {
                  const inner = (
                    <>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-5" style={{ background: 'rgba(74, 234, 188, 0.08)', border: '1px solid rgba(74, 234, 188, 0.2)' }}>
                        <f.icon className="w-4 h-4 text-em" strokeWidth={1.9} />
                      </div>
                      <h3 className="font-display text-[15.5px] font-medium text-white tracking-tight">{f.title}</h3>
                      <p className="text-[13.5px] text-white/55 leading-relaxed mt-2">{f.desc}</p>
                      {f.href && (
                        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-em mt-4 inline-flex items-center gap-1">
                          Read more <ArrowUpRight className="w-3 h-3" />
                        </p>
                      )}
                    </>
                  );
                  return f.href ? (
                    <Link key={f.title} href={f.href} className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-6 transition-colors hover:border-white/[0.18] block">
                      {inner}
                    </Link>
                  ) : (
                    <div key={f.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-6 transition-colors hover:border-white/[0.18]">
                      {inner}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink canvas-dot py-32 lg:py-40 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <div ref={r2} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Get started</p>
            <h2 className="t-h1 text-white">All of it, on day one.</h2>
            <p className="t-body mt-7 max-w-lg">
              No add-on fees, no feature unlocks, no upsell modals. The Starter tier ships every feature on this page. Upper tiers raise client and team-member limits.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/#pricing" className="btn btn-ghost-dark">See pricing <ArrowDown className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
