'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import {
  ArrowUpRight, ArrowRight, Check, Wand2, CreditCard, Rocket, BarChart3,
  Phone, Mic, Users, Globe, Smartphone,
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

const STEPS = [
  {
    n: '01',
    icon: Wand2,
    title: 'Configure your brand identity',
    duration: '~30 minutes',
    intro: 'Activate a workspace, then walk through the branding wizard.',
    details: [
      'Upload your logo (SVG or PNG, transparent background recommended)',
      'Define your color palette via hex tokens — primary, accent, surface',
      'Set your subscription tiers and per-client pricing',
      'Connect your custom domain — we handle SSL automatically',
      'Customize transactional email sender name and reply-to address',
    ],
    note: 'Every surface your end clients touch — signup form, dashboard, marketing site, alert emails, phone hold music — uses these tokens automatically.',
  },
  {
    n: '02',
    icon: CreditCard,
    title: 'Connect your Stripe account',
    duration: '~5 minutes',
    intro: 'OAuth into your existing Stripe account or create a new one. The platform never custodies your funds.',
    details: [
      'Authorize Stripe Connect via the standard OAuth flow',
      'Set monthly subscription pricing per tier (e.g. $99 / $149 / $249)',
      'Configure trial period — 7, 14, or 30 days',
      'Enable optional setup fee or annual billing discount',
      'Stripe Tax auto-applies if enabled in your account',
    ],
    note: 'Subscriptions deposit directly to your bank on Stripe&apos;s schedule. Zero revenue share, zero holdbacks, zero middleman.',
  },
  {
    n: '03',
    icon: Rocket,
    title: 'Distribute your branded signup link',
    duration: 'You decide',
    intro: 'Your white-labeled signup page is live at a URL under your domain. Send prospects there however you generate leads.',
    details: [
      'Built-in lead generation CRM with Google Maps prospecting',
      '13 conversion-tested outreach email templates',
      'Interactive AI demo phone line (Pro tier) — prospects experience the AI live',
      'Pre-built marketing site with hero, pricing, testimonials, FAQ',
      'Webhook on every signup — fire any downstream automation',
    ],
    note: 'Most agencies use the demo phone line as their primary close. A 30-second call with the AI converts better than a sales deck.',
  },
  {
    n: '04',
    icon: BarChart3,
    title: 'Collect monthly recurring revenue',
    duration: 'Automatic',
    intro: 'When a prospect completes the signup form, the platform takes over.',
    details: [
      'Stripe charges the first month and starts the subscription',
      'Telnyx (or Twilio for non-US) provisions a dedicated phone number',
      'AI voice agent is configured for the client&apos;s business',
      'Welcome and activation emails fire from your sender domain',
      'Client receives dashboard credentials and a phone number to test',
    ],
    note: 'Total elapsed time from form submission to live AI receptionist: under sixty seconds. The agency owner does nothing except watch the deposits.',
  },
];

const PROVISIONING = [
  { t: '+0s', label: 'Stripe charges first month', desc: 'Subscription starts. Charge confirmation hits the agency&apos;s Stripe dashboard.' },
  { t: '+8s', label: 'Phone number assigned', desc: 'Telnyx or Twilio issues a real local number — area code based on the client&apos;s business.' },
  { t: '+22s', label: 'AI agent provisioned', desc: 'Voice agent configured per the signup answers. Knowledge base seeded with business name, hours, services.' },
  { t: '+38s', label: 'Dashboard ready', desc: 'Client workspace created. Credentials emailed. End-client portal ready under the agency&apos;s domain.' },
  { t: '+52s', label: 'Welcome sequence triggers', desc: 'Onboarding email fires. SMS test invitation sent. AI is ready to take its first call.' },
];

export default function HowItWorksPage() {
  const r1 = useInView();
  const r2 = useInView();
  const r3 = useInView();
  const r4 = useInView();

  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-20 lg:pb-32 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={r1} className="fade-up max-w-4xl">
            <p className="t-eyebrow text-em mb-7">How it works</p>
            <h1 className="t-h1 text-white max-w-[14ch]">From signup to revenue. In a weekend.</h1>
            <p className="t-body mt-8 max-w-2xl text-[1rem]">
              Four steps to launch a fully branded AI receptionist agency. The first three are setup — they take about an hour. The fourth runs forever, on autopilot. Below: every detail of what happens at each step.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/platform" className="btn btn-ghost-dark">Platform overview <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <p className="font-mono text-[11px] text-white/35 mt-7">14-day free trial · no credit card · cancel anytime</p>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="bg-ink py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r2} className="fade-up max-w-3xl mb-14">
            <p className="t-eyebrow text-em mb-6">The four steps</p>
            <h2 className="t-h2 text-white">A weekend of setup. A decade of recurring revenue.</h2>
          </div>

          <div className="space-y-3 max-w-5xl">
            {STEPS.map(step => (
              <article key={step.n} className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-7 lg:p-9">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                  <div className="lg:col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-[12px] tracking-[0.14em] text-white/35">STEP {step.n}</div>
                      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(74, 234, 188, 0.35), transparent)' }} />
                    </div>
                    <div className="mt-5 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(74, 234, 188, 0.08)', border: '1px solid rgba(74, 234, 188, 0.2)' }}>
                        <step.icon className="w-4 h-4 text-em" strokeWidth={1.9} />
                      </div>
                      <div>
                        <h3 className="font-display font-medium text-white text-[20px] tracking-tight leading-tight">{step.title}</h3>
                        <p className="font-mono text-[11px] text-white/40 mt-1.5">{step.duration}</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8">
                    <p className="text-[15px] text-white/65 leading-relaxed">{step.intro}</p>
                    <ul className="mt-5 space-y-2.5">
                      {step.details.map(d => (
                        <li key={d} className="flex items-start gap-2.5 text-[13.5px] text-white/65">
                          <Check className="w-3.5 h-3.5 text-em shrink-0 mt-1" strokeWidth={2.5} />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 pt-5 border-t border-white/[0.06] text-[13px] text-white/50 leading-relaxed italic" dangerouslySetInnerHTML={{ __html: step.note }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PROVISIONING TIMELINE */}
      <section className="bg-paper py-28 lg:py-40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r3} className="fade-up max-w-3xl mb-14">
            <p className="t-eyebrow text-em-deep mb-6">Inside step four</p>
            <h2 className="t-h2 text-black">What happens in the first sixty seconds.</h2>
            <p className="t-body mt-6 max-w-xl">
              The moment a client clicks &ldquo;Sign up&rdquo; on your branded page, the platform starts provisioning. Here&apos;s the timeline.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl">
            {PROVISIONING.map(s => (
              <div key={s.t} className="rounded-xl border border-black/[0.07] bg-white p-5 lg:p-6 flex gap-5 items-start">
                <div className="font-mono text-[13px] tracking-[0.04em] text-black shrink-0 pt-0.5 w-12" style={{ color: '#047857' }}>
                  {s.t}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-[15px] font-medium text-black tracking-tight">{s.label}</h3>
                  <p className="text-[13.5px] text-black/60 leading-relaxed mt-1.5" dangerouslySetInnerHTML={{ __html: s.desc }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO USES WHAT */}
      <section className="bg-ink py-28 lg:py-40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl mb-14">
            <p className="t-eyebrow text-em mb-6">After launch</p>
            <h2 className="t-h2 text-white">Three audiences. Three interfaces.</h2>
            <p className="t-body mt-6 max-w-xl">
              VoiceAI Connect is multi-tenant from the first commit. Each role has its own login, its own UI, its own permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {[
              { icon: Users, eyebrow: 'You (the agency)', title: 'Agency dashboard', desc: 'Add clients, modify branding, listen to recordings, review revenue. Designed mobile-first.' },
              { icon: Smartphone, eyebrow: 'Your end client', title: 'Branded client portal', desc: 'Each business gets a dashboard under your domain — calls, transcripts, summaries, alerts.' },
              { icon: Phone, eyebrow: 'Their callers', title: 'The phone experience', desc: 'Customers call the dedicated number and speak to the AI agent — sub-2-second responses, multilingual, 24/7.' },
            ].map(c => (
              <div key={c.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-7">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-5" style={{ background: 'rgba(74, 234, 188, 0.08)', border: '1px solid rgba(74, 234, 188, 0.2)' }}>
                  <c.icon className="w-4 h-4 text-em" strokeWidth={1.9} />
                </div>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-em">{c.eyebrow}</p>
                <h3 className="font-display text-[18px] font-medium text-white tracking-tight mt-2">{c.title}</h3>
                <p className="text-[13.5px] text-white/55 leading-relaxed mt-3">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink canvas-dot py-32 lg:py-40 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <div ref={r4} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Ready to ship</p>
            <h2 className="t-h1 text-white">Start now. Sell by Friday.</h2>
            <p className="t-body mt-7 max-w-lg">
              Activate a workspace, configure your brand, hook up Stripe, and your branded signup link is live. Most operators have their first prospect call by the end of the trial period.
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
