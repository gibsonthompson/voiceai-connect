'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowRight, Check, DollarSign, Users, Repeat, Zap } from 'lucide-react';
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

export default function ReferralProgramPage() {
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
            <p className="t-eyebrow text-em mb-7">Referral program</p>
            <h1 className="t-h1 text-white max-w-[15ch]">Send agencies our way. Get paid every month.</h1>
            <p className="t-body mt-8 max-w-2xl text-[1rem]">
              Refer an agency operator to VoiceAI Connect and earn 40% recurring commission for the lifetime of their subscription. No caps, no clawbacks, no expiration. Your commission builds up automatically every time they get billed, and you withdraw it to your Stripe Connect account whenever you want.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-em">Become a referrer <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/#pricing" className="btn btn-ghost-dark">See pricing <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <p className="font-mono text-[11px] text-white/35 mt-7">For agencies on a paid plan · sign up first</p>
          </div>
        </div>
      </section>

      {/* THE NUMBERS */}
      <section className="bg-ink py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r2} className="fade-up grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <p className="t-eyebrow text-em mb-6">The math</p>
              <h2 className="t-h2 text-white">Every referral compounds.</h2>
              <p className="t-body mt-6 max-w-md">
                40% recurring on every paid plan. Your commission jumps when a referral moves up to Scale, and it keeps paying for as long as they pay us. Ten referrals on the Pro plan covers your own subscription four times over.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-7 lg:p-8">
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    { label: 'Per Pro referral', value: '$39.60', sub: '/mo recurring (40% of $99)' },
                    { label: 'Per Scale referral', value: '$199.60', sub: '/mo recurring (40% of $499)' },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/40">{s.label}</p>
                      <p className="font-display font-medium text-em t-numeric mt-2" style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', letterSpacing: '-0.04em' }}>
                        {s.value}
                      </p>
                      <p className="font-mono text-[11px] text-white/45 mt-1">{s.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 pt-6 border-t border-white/[0.06]">
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/40 mb-3">Example</p>
                  <p className="text-[14px] text-white/65 leading-relaxed">
                    Refer 10 Pro operators. <span className="text-em font-medium">$396/mo</span> recurring commission, paid every month they stay active. After 12 months, you&apos;ve earned <span className="text-em font-medium">$4,752</span> from one round of outreach.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-paper py-28 lg:py-40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div ref={r3} className="fade-up max-w-3xl mb-14">
            <p className="t-eyebrow text-em-deep mb-6">Mechanics</p>
            <h2 className="t-h2 text-black">Simple. Tracked. Automatic.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl">
            {[
              { icon: Users, title: 'Grab your link', desc: 'Open the Referrals tab in your agency dashboard. Your tracked link is already there, nothing to switch on.', n: '01' },
              { icon: Zap, title: 'Share your link', desc: 'The link is tied to your account. Paste it in cold emails, blog posts, video descriptions, social.', n: '02' },
              { icon: Repeat, title: 'Get attributed for life', desc: 'Anyone who signs up via your link is permanently attributed. No 30-day cookie nonsense.', n: '03' },
              { icon: DollarSign, title: 'Get paid, on repeat', desc: '40% of every payment they make lands in your balance automatically. Withdraw to Stripe Connect any time you clear $10.', n: '04' },
            ].map(s => (
              <div key={s.n} className="rounded-2xl border border-black/[0.06] bg-white p-6">
                <p className="font-mono text-[11px] tracking-[0.14em] text-black/35">{s.n}</p>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mt-4 mb-4" style={{ background: 'rgba(0, 161, 155, 0.06)', border: '1px solid rgba(0, 161, 155, 0.18)' }}>
                  <s.icon className="w-4 h-4" style={{ color: '#0a5a54' }} strokeWidth={1.9} />
                </div>
                <h3 className="font-display text-[15.5px] font-medium text-black tracking-tight">{s.title}</h3>
                <p className="text-[13.5px] text-black/60 leading-relaxed mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RULES */}
      <section className="bg-ink py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <p className="t-eyebrow text-em mb-6">The rules</p>
              <h2 className="t-h2 text-white">Straightforward. Honest.</h2>
              <p className="t-body mt-6 max-w-md">
                No hidden conditions and no surprise clawbacks. The terms below are the entire contract.
              </p>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {[
                'Recurring 40% commission for the lifetime of the referred subscription, on every paid plan.',
                'Self-referrals are not eligible. Your own subscription does not earn commission.',
                'Attribution is permanent. Once an agency signs up via your link, they are tied to your account forever.',
                'Commission accrues automatically each time a referred agency is billed. Withdraw it to your Stripe Connect account whenever your balance is at least $10.',
                'No cap on referrals or earnings. Refer one agency or refer a hundred.',
                'If a referred agency cancels, the commission stream stops. There is no clawback for prior months earned.',
                'Referrals are tracked via a unique URL parameter and stored in our database, not via cookies. Cross-device and cross-session attribution works.',
              ].map((rule, i) => (
                <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-5 flex gap-4 items-start">
                  <Check className="w-4 h-4 text-em shrink-0 mt-1" strokeWidth={2.5} />
                  <p className="text-[14px] text-white/72 leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink canvas-dot py-32 lg:py-40 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <div ref={r4} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Get your link</p>
            <h2 className="t-h1 text-white">Sign up. Refer. Get paid.</h2>
            <p className="t-body mt-7 max-w-lg">
              Already running a workspace on the Pro or Scale plan? Your referral link is sitting in the Referrals tab, ready to go. Not yet a customer? Start a free trial, then your link unlocks the moment you move to a paid plan.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/agency/login" className="btn btn-ghost-dark">Log in to dashboard <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
