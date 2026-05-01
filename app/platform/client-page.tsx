'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import {
  ArrowUpRight, ArrowRight, ArrowDown, Check, Phone,
  Palette, Globe, Rocket, Mic, MonitorSmartphone, BarChart3, CreditCard, Map,
  Smartphone, Users, Wand2, Lock, Zap, MessageSquare, FileText, Bell,
} from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

/* ─── Reveal hook ─── */
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

export default function PlatformPage() {
  const r1 = useInView();
  const r2 = useInView();
  const r3 = useInView();
  const r4 = useInView();
  const r5 = useInView();
  const r6 = useInView();
  const r7 = useInView();

  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* ════════ HERO ════════ */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-20 lg:pb-32 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={r1} className="fade-up max-w-4xl">
            <p className="t-eyebrow text-em mb-7">The platform</p>
            <h1 className="t-h1 text-white max-w-[18ch]">
              Everything you need to run an AI receptionist agency.
            </h1>
            <p className="t-body mt-8 max-w-2xl text-[1rem]">
              The Platform tier is what an agency operator actually receives at signup. White-label branding, automated client onboarding, end-client dashboards, payment processing, lead generation, and the AI receptionist itself — wired together and shipped as a single multi-tenant application. You manage the business; the platform manages the work.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/#earnings" className="btn btn-ghost-dark">Project earnings <ArrowDown className="w-3.5 h-3.5" /></Link>
            </div>
            <Link href="/interactive-demo" className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-em mt-6 hover:opacity-80 transition-opacity">
              Or try the interactive demo <ArrowRight className="w-3 h-3" />
            </Link>
            <p className="font-mono text-[11px] text-white/35 mt-7">14-day free trial · no credit card required · cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ════════ TWO TRACKS — agency vs end client ════════ */}
      <section className="bg-ink py-28 lg:py-40 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r2} className="fade-up max-w-3xl mb-14">
            <p className="t-eyebrow text-em mb-6">Two audiences. One platform.</p>
            <h2 className="t-h2 text-white">Built for the operator and the customer.</h2>
            <p className="t-body mt-6 max-w-xl">
              VoiceAI Connect is multi-tenant from the first commit. Agency operators get a control surface to run the business; end clients (the local businesses you sell to) get a fully branded interface to review their calls. Both surfaces ship at the same time.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Agency owner card */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-7 lg:p-9">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(74, 234, 188, 0.1)', border: '1px solid rgba(74, 234, 188, 0.22)' }}>
                  <Users className="w-4 h-4 text-em" strokeWidth={2} />
                </div>
                <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-em">For the agency owner</p>
              </div>
              <h3 className="font-display text-[24px] font-medium text-white tracking-tight leading-tight">
                Run a real business from one screen.
              </h3>
              <p className="text-[14px] text-white/55 leading-relaxed mt-4">
                Configure your brand, set pricing, share a signup link, and watch new clients deploy themselves. The agency dashboard shows every client, every call, every dollar — designed to fit on a phone.
              </p>
              <ul className="mt-7 space-y-2.5">
                {[
                  'Branding engine — logo, palette, custom domain',
                  'Stripe Connect — clients pay you direct',
                  'Self-serve onboarding flow under your domain',
                  'Lead generation CRM with Maps prospecting',
                  'Real-time MRR, churn, and per-client analytics',
                  'Mobile-first agency interface',
                ].map(line => (
                  <li key={line} className="flex items-start gap-2.5 text-[13.5px] text-white/70">
                    <Check className="w-3.5 h-3.5 text-em shrink-0 mt-1" strokeWidth={2.5} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* End client card */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-7 lg:p-9">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <Phone className="w-4 h-4 text-white/70" strokeWidth={2} />
                </div>
                <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-white/55">For their end client</p>
              </div>
              <h3 className="font-display text-[24px] font-medium text-white tracking-tight leading-tight">
                A receptionist that never closes.
              </h3>
              <p className="text-[14px] text-white/55 leading-relaxed mt-4">
                Each end client (the local business you sold to) receives a fully branded dashboard, dedicated phone number, and AI voice agent trained on their specific business — provisioned the moment they finish your signup form.
              </p>
              <ul className="mt-7 space-y-2.5">
                {[
                  'Dedicated phone number provisioned on signup',
                  'AI voice agent answers 24/7 in 4 languages',
                  'Branded dashboard — under your domain',
                  'Recording, transcript, and summary on every call',
                  'SMS and email alerts on configurable triggers',
                  'Calendar booking and CRM hooks',
                ].map(line => (
                  <li key={line} className="flex items-start gap-2.5 text-[13.5px] text-white/70">
                    <Check className="w-3.5 h-3.5 text-em shrink-0 mt-1" strokeWidth={2.5} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ AGENCY CAPABILITIES — bento on light ════════ */}
      <section className="bg-paper py-28 lg:py-40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r3} className="fade-up max-w-3xl mb-14">
            <p className="t-eyebrow text-em-deep mb-6">Agency control surface</p>
            <h2 className="t-h2 text-black">The tools you operate the business with.</h2>
            <p className="t-body mt-6 max-w-xl">
              These are the modules an agency owner uses every week. They&apos;re not optional add-ons or tier-locked extras — they ship with the workspace at signup.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Palette, title: 'White-label branding', desc: 'Logo, color palette, custom domain with auto-provisioned SSL, transactional emails, and the entire client surface re-skinned per agency.' },
              { icon: Rocket, title: 'Self-serve onboarding', desc: 'Branded signup page tied to your domain. Local businesses fill out a form; the platform provisions everything in under 60 seconds.' },
              { icon: CreditCard, title: 'Stripe Connect billing', desc: 'OAuth-connected Stripe account. Subscriptions deposit directly into your bank. Zero revenue share, zero holdbacks.' },
              { icon: BarChart3, title: 'Agency dashboard', desc: 'Real-time MRR, churn, per-client call volume. Designed mobile-first — manage clients from a coffee shop.' },
              { icon: Map, title: 'Lead generation CRM', desc: 'Google Maps prospecting by category and radius. 13 outreach templates. Visual pipeline with reply detection.' },
              { icon: Globe, title: 'Marketing website', desc: 'Pre-built conversion-tuned site with hero, pricing, testimonials, FAQ, and an interactive AI demo phone line.' },
              { icon: Smartphone, title: 'Mobile-first PWA', desc: 'Add clients, change branding, listen to call recordings, and review revenue from anywhere. No desktop required.' },
              { icon: Users, title: 'Team members', desc: 'Invite agency teammates and shared client-side users on Pro and Enterprise tiers.' },
              { icon: Wand2, title: 'Workflow automation', desc: 'Make and n8n event hooks fire on every platform action — onboarding, billing, calls, churn.' },
            ].map(c => (
              <div key={c.title} className="rounded-2xl border border-black/[0.06] bg-white p-6 transition-colors hover:border-black/[0.16]">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-5" style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.18)' }}>
                  <c.icon className="w-4 h-4" style={{ color: '#047857' }} strokeWidth={1.9} />
                </div>
                <h3 className="font-display text-[16px] font-medium text-black tracking-tight">{c.title}</h3>
                <p className="text-[13.5px] text-black/60 leading-relaxed mt-2">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CLIENT EXPERIENCE — bento on dark ════════ */}
      <section className="bg-ink py-28 lg:py-40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r4} className="fade-up max-w-3xl mb-14">
            <p className="t-eyebrow text-em mb-6">End-client experience</p>
            <h2 className="t-h2 text-white">What the local business actually sees.</h2>
            <p className="t-body mt-6 max-w-xl">
              The end client never logs into VoiceAI Connect. Every surface they touch — the signup form, the dashboard, the phone experience, the alert emails — is branded as your agency. We&apos;re invisible.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Mic, title: 'AI voice receptionist', desc: 'Sub-2-second response. Answers, books appointments, transfers urgent calls, writes a summary on every interaction.' },
              { icon: Phone, title: 'Dedicated phone number', desc: 'A real local number per client, provisioned at signup. Telnyx for US, Twilio for UK and international.' },
              { icon: MonitorSmartphone, title: 'Branded dashboard', desc: 'Each client logs into a workspace under your domain. Recent calls, transcripts, summaries, lead categorization.' },
              { icon: FileText, title: 'Call recordings + transcripts', desc: 'Full audio archive plus time-coded transcripts. Searchable, exportable, and tied to the original phone number.' },
              { icon: Zap, title: 'AI call summaries', desc: 'Every call ends with an AI-written summary capturing intent, sentiment, key requests, and recommended follow-up.' },
              { icon: Bell, title: 'SMS + email alerts', desc: 'Configurable triggers — urgent call, new lead, missed appointment. Delivered via the agency&apos;s sender domain.' },
              { icon: Globe, title: 'Multilingual voice', desc: 'English, Spanish, French, and German voice synthesis included. The agent matches the caller automatically.' },
              { icon: MessageSquare, title: 'Calendar + CRM hooks', desc: 'Native integration with Google Calendar, Cal.com, and HubSpot for appointment booking and lead routing.' },
              { icon: Lock, title: 'Encrypted by default', desc: 'Postgres row-level security per agency. SOC2-compliant infrastructure. PII never written to logs.' },
            ].map(c => (
              <div key={c.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.022] p-6 transition-colors hover:border-white/[0.18]">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-5" style={{ background: 'rgba(74, 234, 188, 0.08)', border: '1px solid rgba(74, 234, 188, 0.2)' }}>
                  <c.icon className="w-4 h-4 text-em" strokeWidth={1.9} />
                </div>
                <h3 className="font-display text-[16px] font-medium text-white tracking-tight">{c.title}</h3>
                <p className="text-[13.5px] text-white/55 leading-relaxed mt-2">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ LIFECYCLE WALKTHROUGH ════════ */}
      <section className="bg-paper-soft py-28 lg:py-40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r5} className="fade-up max-w-3xl mb-14">
            <p className="t-eyebrow text-em-deep mb-6">Client lifecycle</p>
            <h2 className="t-h2 text-black">From signup to recurring revenue.</h2>
            <p className="t-body mt-6 max-w-xl">
              What happens between a prospect clicking your signup link and a deposit landing in your Stripe account.
            </p>
          </div>

          <div className="space-y-3 max-w-4xl">
            {[
              { n: '01', title: 'Prospect lands on your branded signup page', desc: 'They see your logo, your colors, your domain, and your pricing tiers. The page is hosted by VoiceAI Connect but the prospect has no way of knowing that.', meta: 'Your domain · your brand' },
              { n: '02', title: 'They complete the form in under 90 seconds', desc: 'Business name, phone style, hours, calendar integration. The platform validates, charges the first month via Stripe, and starts provisioning.', meta: '~90s' },
              { n: '03', title: 'Platform provisions everything in under a minute', desc: 'Telnyx (or Twilio, for non-US) issues a phone number. The AI agent is configured for their specific business. Welcome email sequence triggers. Dashboard credentials sent.', meta: '<60s · automated' },
              { n: '04', title: 'AI receptionist goes live on the new number', desc: 'Calls flow into the AI agent, get transcribed by Deepgram, reasoned by Claude, summarized, and written to the client dashboard in real time.', meta: '24/7 coverage' },
              { n: '05', title: 'Stripe deposits land in your account monthly', desc: 'Subscription renewals process automatically. The platform never custodies funds — Stripe Connect routes payment directly to the agency&apos;s bank.', meta: 'Direct to your bank' },
            ].map(step => (
              <div key={step.n} className="rounded-2xl border border-black/[0.07] bg-white p-6 lg:p-7 flex gap-5 lg:gap-7 items-start">
                <div className="font-mono text-[12px] tracking-[0.14em] text-black/35 shrink-0 pt-1.5 w-10">{step.n}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-3 justify-between">
                    <h3 className="font-display text-[18px] font-medium text-black tracking-tight leading-snug">{step.title}</h3>
                    <span className="font-mono text-[11px] tracking-[0.04em] text-black/45 whitespace-nowrap">{step.meta}</span>
                  </div>
                  <p className="text-[14px] text-black/60 leading-relaxed mt-3">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ INFRASTRUCTURE CALLOUT ════════ */}
      <section className="bg-ink py-28 lg:py-40 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r6} className="fade-up grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-6">
              <p className="t-eyebrow text-em mb-6">Infrastructure</p>
              <h2 className="t-h2 text-white">Fifteen vendors. One bill.</h2>
              <p className="t-body mt-6 max-w-lg">
                Anthropic Claude for reasoning. ElevenLabs for voice synthesis. Deepgram for real-time transcription. Telnyx and Twilio for telephony. Stripe Connect for billing. Supabase for data. Vercel and Cloudflare for the edge. Sentry and PostHog for monitoring. Make and n8n for automation. Brevo for transactional email.
              </p>
              <p className="t-body mt-4 max-w-lg">
                Each one is the category leader. Together they would cost an agency thousands per month and a quarter of engineering time to integrate. You get them as one product, billed as one flat fee.
              </p>
              <Link href="/#platform" className="btn btn-ghost-dark mt-9">See the full stack <ArrowUpRight className="w-3.5 h-3.5" /></Link>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-7 lg:p-8">
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    'Anthropic', 'ElevenLabs', 'Deepgram', 'OpenAI', 'Telnyx', 'Twilio',
                    'Stripe', 'Supabase', 'Brevo', 'Vercel', 'Cloudflare', 'Sentry',
                    'PostHog', 'Make', 'n8n',
                  ].map(name => (
                    <div key={name} className="rounded-lg border border-white/[0.06] bg-white/[0.012] px-3 py-3 text-center">
                      <p className="font-display text-[12px] font-medium text-white/85 tracking-tight">{name}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-3 gap-3">
                  <div>
                    <p className="font-display text-[20px] font-medium text-white t-numeric">15</p>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/40 mt-1">Vendors</p>
                  </div>
                  <div>
                    <p className="font-display text-[20px] font-medium text-em t-numeric">1</p>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/40 mt-1">Bill</p>
                  </div>
                  <div>
                    <p className="font-display text-[20px] font-medium text-white t-numeric">0</p>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/40 mt-1">Setup</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className="bg-ink canvas-dot py-32 lg:py-44 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <div ref={r7} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Get started</p>
            <h2 className="t-h1 text-white">Ship your white-label agency this week.</h2>
            <p className="t-body mt-7 max-w-lg">
              14-day free trial. No credit card. No setup fee. Activate a workspace, brand it, hook up Stripe, and your signup link is ready to share by Friday.
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
