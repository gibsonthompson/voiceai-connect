'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowUpRight, ArrowRight, Check, TrendingUp, Wallet,
  Link2, Share2, Youtube, Phone, ShieldCheck, Clock,
  DollarSign, ChevronDown,
} from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

// ---------------------------------------------------------------------------
// Program facts (single source of truth for the copy on this page). These match
// the live system: 40% recurring on the agency's platform fee, real plans are
// Pro ($99) and Scale ($499), manual withdraw at a $10 minimum via Stripe
// Connect. Do not drift these without checking the backend (COMMISSION_RATE).
// ---------------------------------------------------------------------------
const RATE = 0.40;
const PLANS = {
  pro: { name: 'Pro', price: 99 },
  scale: { name: 'Scale', price: 499 },
} as const;
type PlanId = keyof typeof PLANS;

const money0 = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const money2 = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

function FadeIn({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useInView<HTMLDivElement>();
  return <div ref={ref} className={`fade-up ${className}`}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Earnings calculator (the funnel hook). Plan picker is a custom segmented
// control, never a native select. The count is a range slider plus quick
// presets. Everything recomputes live.
// ---------------------------------------------------------------------------
function EarningsCalculator() {
  const [plan, setPlan] = useState<PlanId>('pro');
  const [count, setCount] = useState(10);

  const planPrice = PLANS[plan].price;
  const perReferral = planPrice * RATE;
  const monthly = perReferral * count;
  const yearly = monthly * 12;
  const coversOwn = RATE * count; // identical for both plans

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
      {/* Controls */}
      <div className="flex flex-col gap-7">
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-black/40 mb-3">Their plan</p>
          <div className="inline-flex rounded-full border border-black/[0.08] bg-black/[0.03] p-1">
            {(Object.keys(PLANS) as PlanId[]).map((id) => {
              const active = plan === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlan(id)}
                  className="rounded-full px-5 py-2 text-sm font-medium transition-colors"
                  style={active
                    ? { background: '#050505', color: '#fff' }
                    : { background: 'transparent', color: 'rgba(0,0,0,0.5)' }}
                >
                  {PLANS[id].name} <span className="font-mono text-[11px] opacity-60">${PLANS[id].price}/mo</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-3">
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-black/40">Agencies you refer</p>
            <p className="font-display text-2xl font-medium text-black tabular-nums tracking-tight">{count}</p>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: '#00c6b2' }}
            aria-label="Number of agencies you refer"
          />
          <div className="flex items-center justify-between mt-2 font-mono text-[10px] text-black/30">
            <span>1</span>
            <span>100</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {[5, 10, 25, 50].map((n) => {
              const active = count === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border"
                  style={active
                    ? { background: 'rgba(0,198,178,0.12)', borderColor: 'rgba(0,198,178,0.4)', color: '#0a5a54' }
                    : { background: 'transparent', borderColor: 'rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.5)' }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[13px] text-black/50 leading-relaxed mt-auto">
          {count} referred {count === 1 ? 'agency' : 'agencies'} on the {PLANS[plan].name} plan, at {money2(perReferral)} each per month ({Math.round(RATE * 100)}% of {money0(planPrice)}).
        </p>
      </div>

      {/* Result (dark card for contrast inside the light section) */}
      <div className="rounded-2xl p-8 lg:p-10 flex flex-col justify-center" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-white/40 mb-4">Your recurring commission</p>
        <div className="flex items-end gap-2">
          <p className="t-stat text-em" style={{ fontSize: 'clamp(2.75rem, 7vw, 4.75rem)' }}>{money0(monthly)}</p>
          <span className="font-mono text-sm text-white/45 mb-3">/mo</span>
        </div>
        <p className="text-[15px] text-white/60 mt-2">
          <span className="text-em font-medium">{money0(yearly)}</span> a year, paid every month they stay subscribed.
        </p>
        <div className="mt-7 pt-6 flex items-center gap-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <TrendingUp className="w-4 h-4 text-em shrink-0" />
          <p className="text-[13px] text-white/55">
            That covers your own {PLANS[plan].name} subscription{' '}
            <span className="text-white font-medium">
              {Number.isInteger(coversOwn) ? coversOwn : coversOwn.toFixed(1)}x
            </span>{' '}
            over.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ accordion (objection handling).
// ---------------------------------------------------------------------------
const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do I need to be a VoiceAI Connect customer to earn?',
    a: 'Yes. Your referral link lives inside your agency workspace and unlocks on the Pro and Scale plans. Start a free trial, move to a paid plan, and your link is waiting in the Referrals tab of your dashboard.',
  },
  {
    q: 'How much do I earn, and is it actually recurring?',
    a: 'You earn 40% of what every agency you refer pays us, every month they stay subscribed. That is $39.60/mo for a Pro agency and $199.60/mo for a Scale agency, and it keeps paying for the life of their subscription. This is recurring revenue, not a one-time bounty.',
  },
  {
    q: 'When and how do I get paid?',
    a: 'Commission builds up in your balance automatically each time a referred agency is billed. You withdraw it to your Stripe Connect account any time your balance is at least $10. You decide when to pull it, there is no waiting on a monthly cycle.',
  },
  {
    q: 'What happens if an agency I referred cancels?',
    a: 'The monthly commission for that agency stops when they stop paying us. There is no clawback, everything you already earned stays yours.',
  },
  {
    q: 'Is there a cap on referrals or earnings?',
    a: 'No cap. Refer one agency or refer a hundred. Your commission scales with every active referral, and it stacks month after month.',
  },
  {
    q: 'How is a referral tracked?',
    a: 'Every signup through your link is tied to your account in our database, permanently. It is not a 30-day cookie, so attribution holds across devices and sessions and never expires.',
  },
  {
    q: 'Can I refer myself?',
    a: 'No. Self-referrals are not eligible, your own subscription does not earn commission.',
  },
  {
    q: 'What counts as a referral?',
    a: 'An agency that signs up through your link and becomes a paying customer. You start earning the first time they are billed, and again on every invoice after that.',
  },
];

function FaqList() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2.5 max-w-3xl">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.015] overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-[15px] text-white/90 font-medium">{item.q}</span>
              <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 -mt-1">
                <p className="text-[14px] text-white/60 leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ReferralProgramPage() {
  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-16 lg:pb-20 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <FadeIn className="max-w-4xl">
            <p className="t-eyebrow text-em mb-7">Referral program</p>
            <h1 className="t-h1 text-white max-w-[13ch]">Refer once. Get paid every month.</h1>
            <p className="t-body mt-8 max-w-2xl text-[1rem]">
              Send an agency operator to VoiceAI Connect and earn 40% of what they pay us, every month they stay subscribed. It is real recurring commission, not a one-time bounty. No cap on how many you refer, and no clawback on what you have already earned.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-em">Become a referrer <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="#calculator" className="btn btn-ghost-dark">Run the numbers <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <p className="font-mono text-[11px] text-white/35 mt-7">On the Pro and Scale plans · your link is already in the dashboard</p>
          </FadeIn>
        </div>
      </section>

      {/* TRUST STRIP (the terms, up front, in place of fabricated social proof) */}
      <section className="bg-ink pb-20 lg:pb-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] px-6 py-5 lg:px-8 lg:py-6">
              <div className="flex flex-wrap items-center gap-x-7 gap-y-3.5">
                {[
                  { icon: DollarSign, label: '40% recurring commission' },
                  { icon: Clock, label: 'Paid every month they stay' },
                  { icon: ShieldCheck, label: 'Lifetime attribution, no cookies' },
                  { icon: TrendingUp, label: 'No cap on referrals' },
                  { icon: Wallet, label: 'Withdraw at $10 via Stripe Connect' },
                ].map((c) => (
                  <span key={c.label} className="inline-flex items-center gap-2 text-[13px] text-white/70">
                    <c.icon className="w-3.5 h-3.5 text-em shrink-0" />
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="bg-paper py-24 lg:py-32 scroll-mt-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-12">
            <p className="t-eyebrow text-em-deep mb-6">The math</p>
            <h2 className="t-h2 text-black">See what it adds up to.</h2>
            <p className="t-body mt-5">
              Drag the slider and pick a plan. This is 40% of each agency&apos;s monthly fee, paid to you every month they stay. Your real number depends on who you refer and which plan they choose.
            </p>
          </FadeIn>
          <FadeIn>
            <EarningsCalculator />
          </FadeIn>
        </div>
      </section>

      {/* RECURRING VS BOUNTY */}
      <section className="bg-ink py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-12">
            <p className="t-eyebrow text-em mb-6">Why it adds up</p>
            <h2 className="t-h2 text-white">Most programs pay you once. We pay you every month.</h2>
          </FadeIn>
          <FadeIn>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.012] p-7 lg:p-8">
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/35 mb-4">The usual deal</p>
                <h3 className="font-display text-[19px] font-medium text-white/80 tracking-tight">One-time bounty</h3>
                <p className="text-[14px] text-white/50 leading-relaxed mt-3">
                  You refer someone, you get a single flat payout, and that is the end of it. If they stay for three years, you still got paid once. Every month your income resets to zero and you start the hunt over.
                </p>
              </div>
              <div className="rounded-2xl p-7 lg:p-8" style={{ background: 'rgba(1,245,209,0.05)', border: '1px solid rgba(1,245,209,0.18)' }}>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-em mb-4">How we do it</p>
                <h3 className="font-display text-[19px] font-medium text-white tracking-tight">40% recurring</h3>
                <p className="text-[14px] text-white/65 leading-relaxed mt-3">
                  You refer an agency once and earn 40% of their bill every month they stay. Ten active Pro referrals is <span className="text-em font-medium">$396/mo</span> that shows up whether or not you lift a finger that month. The longer they stay, the more one referral is worth.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-paper py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-14">
            <p className="t-eyebrow text-em-deep mb-6">How it works</p>
            <h2 className="t-h2 text-black">Simple. Tracked. Yours to withdraw.</h2>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl">
              {[
                { icon: Link2, title: 'Get your link', desc: 'Open the Referrals tab in your dashboard. Your tracked link is already there, nothing to switch on.', n: '01' },
                { icon: Share2, title: 'Share it anywhere', desc: 'Drop it in cold emails, video descriptions, posts, your link in bio. One link, every channel.', n: '02' },
                { icon: ShieldCheck, title: 'Attributed for life', desc: 'Anyone who signs up through it is tied to your account permanently. No 30-day cookie, no expiry.', n: '03' },
                { icon: Wallet, title: 'Get paid, on repeat', desc: '40% lands in your balance every time they are billed. Withdraw to Stripe Connect any time you clear $10.', n: '04' },
              ].map((s) => (
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
          </FadeIn>
        </div>
      </section>

      {/* WAYS TO DRIVE REFERRALS */}
      <section className="bg-ink py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-14">
            <p className="t-eyebrow text-em mb-6">Where referrals come from</p>
            <h2 className="t-h2 text-white">The link earns. Content feeds it.</h2>
            <p className="t-body mt-5 max-w-xl">
              The link does the paying, but something has to send people to it. These three compound the longer you do them.
            </p>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Youtube, title: 'Make YouTube videos', desc: 'Tutorials and walkthroughs like "how I run an AI receptionist agency" with your link in the description. One video keeps sending signups for years after you post it.' },
                { icon: Share2, title: 'Post short-form clips', desc: 'Reels, TikToks, Shorts and LinkedIn posts of the AI handling a real call. Show it working, then drop your link. One clip that lands can bring dozens of signups.' },
                { icon: Phone, title: 'Show the live demo', desc: 'Point prospects at demo mode so they can call and hear the AI answer before they commit. It sells itself, and they sign up through your link right after.' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.012] p-6">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(1,245,209,0.06)', border: '1px solid rgba(1,245,209,0.18)' }}>
                    <s.icon className="w-4 h-4 text-em" strokeWidth={1.9} />
                  </div>
                  <h3 className="font-display text-[16px] font-medium text-white tracking-tight">{s.title}</h3>
                  <p className="text-[13.5px] text-white/55 leading-relaxed mt-2.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* THE TERMS */}
      <section className="bg-paper py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <FadeIn className="lg:col-span-5">
              <p className="t-eyebrow text-em-deep mb-6">The fine print</p>
              <h2 className="t-h2 text-black">The whole deal, in plain English.</h2>
              <p className="t-body mt-6 max-w-md">
                No hidden conditions and no surprise clawbacks. The lines on the right are the entire agreement.
              </p>
            </FadeIn>

            <FadeIn className="lg:col-span-7 space-y-3">
              {[
                'Recurring 40% commission for the lifetime of the referred subscription, on every paid plan.',
                'Commission accrues automatically each time a referred agency is billed, and you withdraw it to Stripe Connect whenever your balance is at least $10.',
                'Attribution is permanent. Once an agency signs up through your link, they are tied to your account forever.',
                'If a referred agency cancels, the commission stream stops. There is no clawback on prior months earned.',
                'No cap on referrals or earnings. Refer one agency or refer a hundred.',
                'Self-referrals are not eligible. Your own subscription does not earn commission.',
                'Referrals are tracked by a unique link and stored in our database, not via cookies, so cross-device and cross-session attribution works.',
              ].map((rule, i) => (
                <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-5 flex gap-4 items-start">
                  <Check className="w-4 h-4 text-em-deep shrink-0 mt-1" strokeWidth={2.5} />
                  <p className="text-[14px] text-black/70 leading-relaxed">{rule}</p>
                </div>
              ))}
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-ink py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-12">
            <p className="t-eyebrow text-em mb-6">Questions</p>
            <h2 className="t-h2 text-white">The things people ask first.</h2>
          </FadeIn>
          <FadeIn>
            <FaqList />
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink canvas-dot py-32 lg:py-40 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <FadeIn className="max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Get your link</p>
            <h2 className="t-h1 text-white">Sign up. Refer. Get paid.</h2>
            <p className="t-body mt-7 max-w-lg">
              Already on the Pro or Scale plan? Your referral link is sitting in the Referrals tab, ready to share. Not a customer yet? Start a free trial, then your link unlocks the moment you move to a paid plan.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/agency/login" className="btn btn-ghost-dark">Log in to dashboard <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
