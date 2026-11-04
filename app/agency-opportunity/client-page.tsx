'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useMemo, type ReactNode } from 'react';
import {
  ArrowUpRight, ArrowRight, PhoneMissed, TrendingUp, Wallet, Server, Zap,
  ShieldCheck, Sparkles, LayoutDashboard, Clock, PhoneCall,
} from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

// ---------------------------------------------------------------------------
// Numbers are the real ones used across the product.
// Missed-call model mirrors components/MissedCallCalculator.tsx (same benchmarks).
// Platform cost mirrors lib/plan-limits.ts via the agency revenue calculator:
//   Pro:   $99/mo  + $9.99/client/mo + $0.10/min
//   Scale: $499/mo + $0/client/mo    + $0.05/min
// ---------------------------------------------------------------------------
const PLANS = {
  pro: { name: 'Pro', fee: 99, perClient: 9.99, perMinute: 0.10 },
  scale: { name: 'Scale', fee: 499, perClient: 0, perMinute: 0.05 },
} as const;
type PlanId = keyof typeof PLANS;

type PresetKey = 'plumbing' | 'hvac' | 'electrical' | 'roofing' | 'general';
const PRESETS: Record<PresetKey, { job: number; missed: number; close: number; calls: number; label: string }> = {
  plumbing:   { job: 650,  missed: 30, close: 45, calls: 40, label: 'Plumbing' },
  hvac:       { job: 850,  missed: 35, close: 40, calls: 38, label: 'HVAC' },
  electrical: { job: 550,  missed: 28, close: 45, calls: 35, label: 'Electrical' },
  roofing:    { job: 9000, missed: 25, close: 30, calls: 18, label: 'Roofing' },
  general:    { job: 500,  missed: 30, close: 40, calls: 40, label: 'Other' },
};

const RECOVER = 0.6;        // AI saves 60% of the calls that currently go to voicemail
const MIN_PER_CLIENT = 300; // typical answered minutes per client per month

const money0 = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Smoothly tween a number toward its target so results "count up" as you drag.
function useCountUp(value: number, duration = 450) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

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

// Robust slider: a real rail + mint fill + solid thumb. Works the same in every browser.
function Slider({
  label, value, min, max, step, onChange, format, hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string; hint?: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3.5">
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-black/45">{label}</span>
        <span className="font-display text-2xl font-medium text-black tabular-nums tracking-tight">{format(value)}</span>
      </div>
      <div className="ao-rail">
        <div className="ao-fill" style={{ width: `${pct}%` }} />
        <input
          type="range"
          className="ao-input"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
      </div>
      {hint && <p className="text-[12px] text-black/40 mt-3 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Row({ label, value, em }: { label: string; value: string; em?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`text-[13px] ${em ? 'text-white font-medium' : 'text-white/55'}`}>{label}</span>
      <span className={`tabular-nums ${em ? 'text-em font-semibold text-[18px]' : 'text-white/70 text-[14px]'}`}>{value}</span>
    </div>
  );
}

// One step of the flow: number badge + connecting line, inputs on the left, live result on the right.
function Step({ n, last, kicker, title, inputs, result }: {
  n: number; last?: boolean; kicker: string; title: string; inputs: ReactNode; result: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-6 sm:gap-8">
      {/* rail */}
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg font-semibold shrink-0"
          style={{ background: '#050505', color: '#01f5d1', border: '1px solid rgba(1,245,209,0.3)' }}>
          {n}
        </div>
        {!last && <div className="w-px flex-1 mt-3" style={{ background: 'linear-gradient(180deg, rgba(5,5,5,0.14), rgba(5,5,5,0.02))' }} />}
      </div>

      {/* body */}
      <div className={last ? '' : 'pb-16 lg:pb-20'}>
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-em-deep mb-3">{kicker}</p>
        <h3 className="font-display text-[26px] lg:text-[30px] font-medium text-black tracking-tight leading-tight max-w-[22ch]">{title}</h3>
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mt-9">
          <div className="flex flex-col gap-8">{inputs}</div>
          <div>{result}</div>
        </div>
      </div>
    </div>
  );
}

function MasterCalculator() {
  const [preset, setPreset] = useState<PresetKey>('plumbing');
  const [calls, setCalls] = useState(PRESETS.plumbing.calls);
  const [job, setJob] = useState(PRESETS.plumbing.job);
  const [price, setPrice] = useState(297);
  const [clients, setClients] = useState(15);
  const [plan, setPlan] = useState<PlanId>('pro');

  const applyPreset = (k: PresetKey) => { const p = PRESETS[k]; setPreset(k); setCalls(p.calls); setJob(p.job); };

  const c = useMemo(() => {
    const p = PRESETS[preset];
    const missedMo = calls * (p.missed / 100) * 4.33;
    const lostMo = missedMo * job * (p.close / 100);
    const lostYr = lostMo * 12;
    const recoveredMo = lostMo * RECOVER;
    const clientNet = recoveredMo - price;

    const pl = PLANS[plan];
    const revenue = clients * price;
    const platformCost = pl.fee + clients * pl.perClient + clients * MIN_PER_CLIENT * pl.perMinute;
    const mrr = revenue - platformCost;
    const annual = mrr * 12;
    const margin = revenue > 0 ? (mrr / revenue) * 100 : 0;

    const other: PlanId = plan === 'pro' ? 'scale' : 'pro';
    const op = PLANS[other];
    const otherMrr = revenue - (op.fee + clients * op.perClient + clients * MIN_PER_CLIENT * op.perMinute);

    return { missedMo, lostMo, lostYr, recoveredMo, clientNet, revenue, platformCost, mrr, annual, margin, other, otherMrr };
  }, [preset, calls, job, price, clients, plan]);

  const pl = PLANS[plan];

  const lostYrA = useCountUp(c.lostYr);
  const clientNetA = useCountUp(c.clientNet);
  const recoveredA = useCountUp(c.recoveredMo);
  const mrrA = useCountUp(c.mrr);
  const annualA = useCountUp(c.annual);

  return (
    <div>
      <style>{`
        .ao-rail { position: relative; height: 12px; border-radius: 999px; background: rgba(5,5,5,0.10); }
        .ao-fill { position: absolute; left: 0; top: 0; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #00c6b2, #01f5d1); pointer-events: none; }
        .ao-input { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 100%; height: 30px; margin: 0; background: transparent; -webkit-appearance: none; -moz-appearance: none; appearance: none; cursor: pointer; }
        .ao-input:focus { outline: none; }
        .ao-input::-webkit-slider-runnable-track { background: transparent; height: 30px; border: none; }
        .ao-input::-moz-range-track { background: transparent; height: 30px; border: none; }
        .ao-input::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; border-radius: 50%; background: #050505; border: 4px solid #fff; box-shadow: 0 3px 10px rgba(0,0,0,0.28); cursor: pointer; }
        .ao-input::-moz-range-thumb { width: 28px; height: 28px; border-radius: 50%; background: #050505; border: 4px solid #fff; box-shadow: 0 3px 10px rgba(0,0,0,0.28); cursor: pointer; }
        .ao-chip { border-radius: 999px; padding: 10px 20px; font-size: 15px; font-weight: 500; transition: all .15s ease; border: 1px solid rgba(0,0,0,0.12); background: transparent; color: rgba(0,0,0,0.55); cursor: pointer; }
        .ao-chip[data-active="true"] { background: #050505; color: #fff; border-color: #050505; }
        .ao-res { border-radius: 22px; padding: 36px; background: #050505; border: 1px solid rgba(255,255,255,0.07); }
      `}</style>

      {/* STEP 1 */}
      <Step
        n={1}
        kicker="Start here"
        title="Pick a business in your city. Watch what it's quietly losing."
        inputs={
          <>
            <div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-black/45 mb-3.5">Who you'd sell to</p>
              <div className="flex flex-wrap gap-2.5">
                {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
                  <button key={k} type="button" className="ao-chip" data-active={preset === k} onClick={() => applyPreset(k)}>
                    {PRESETS[k].label}
                  </button>
                ))}
              </div>
            </div>
            <Slider label="Their calls / week" value={calls} min={10} max={200} step={1} onChange={setCalls} format={(v) => `${v}`} hint="Roughly how many calls this business gets in a normal week." />
            <Slider label="Their average job value" value={job} min={100} max={15000} step={50} onChange={setJob} format={money0} hint="What one booked job is worth to them." />
          </>
        }
        result={
          <div className="ao-res">
            <div className="flex items-center gap-2 mb-5">
              <PhoneMissed className="w-4 h-4" style={{ color: '#f87171' }} strokeWidth={1.9} />
              <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-white/40">What they lose every year</p>
            </div>
            <div className="flex items-end gap-2.5">
              <p className="t-stat" style={{ color: '#f87171', fontSize: 'clamp(2.75rem, 7vw, 5rem)' }}>{money0(lostYrA)}</p>
              <span className="font-mono text-sm text-white/45 mb-3">/yr</span>
            </div>
            <p className="text-[15px] text-white/60 mt-4 leading-relaxed">
              That's <span className="text-white font-medium">{Math.round(c.missedMo)} calls a month</span> going to voicemail. Roughly 8 in 10 of those callers never try again, they just dial the next name on the list.
            </p>
          </div>
        }
      />

      {/* STEP 2 */}
      <Step
        n={2}
        kicker="So you offer to fix it"
        title="You put your AI receptionist on their phone. They can't say no."
        inputs={
          <>
            <Slider label="What you charge them / mo" value={price} min={99} max={1000} step={1} onChange={setPrice} format={money0} hint="Your monthly price for their AI receptionist. You set it, you keep the spread." />
            <div className="rounded-2xl p-5" style={{ background: 'rgba(0,198,178,0.06)', border: '1px solid rgba(0,198,178,0.18)' }}>
              <p className="text-[13.5px] text-black/60 leading-relaxed">
                The AI answers every call, 24/7, books the job and texts them the details. You never pick up a phone. You just set the price and collect.
              </p>
            </div>
          </>
        }
        result={
          <div className="ao-res">
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-white/40 mb-5">They pay you {money0(price)}/mo, and still come out ahead</p>
            <div className="flex items-end gap-2.5">
              <p className="t-stat text-em" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.25rem)' }}>{money0(clientNetA)}</p>
              <span className="font-mono text-sm text-white/45 mb-3">/mo they keep</span>
            </div>
            <p className="text-[15px] text-white/60 mt-4 leading-relaxed">
              Your AI recovers about <span className="text-em font-medium">{money0(recoveredA)}/mo</span> of the calls that were going to voicemail. After your fee, that's money back in their pocket that used to walk out the door. For them, you pay for yourself many times over.
            </p>
          </div>
        }
      />

      {/* STEP 3 */}
      <Step
        n={3}
        last
        kicker="Then do it again, and again"
        title="Each client is recurring revenue you barely have to service."
        inputs={
          <>
            <Slider label="Clients like this" value={clients} min={1} max={100} step={1} onChange={setClients} format={(v) => `${v}`} hint="How many you sign. Drag it up and watch your income move." />
            <div>
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-black/45 mb-3.5">Your plan</p>
              <div className="inline-flex rounded-full border border-black/[0.08] bg-black/[0.03] p-1">
                {(Object.keys(PLANS) as PlanId[]).map((id) => (
                  <button key={id} type="button" onClick={() => setPlan(id)}
                    className="rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
                    style={plan === id ? { background: '#050505', color: '#fff' } : { background: 'transparent', color: 'rgba(0,0,0,0.5)' }}>
                    {PLANS[id].name} <span className="font-mono text-[11px] opacity-60">${PLANS[id].fee}/mo</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        }
        result={
          <div className="ao-res">
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-white/40 mb-5">Your agency at {clients} {clients === 1 ? 'client' : 'clients'}</p>
            <div className="flex items-end gap-2.5">
              <p className="t-stat text-em" style={{ fontSize: 'clamp(2.75rem, 7vw, 5rem)' }}>{money0(mrrA)}</p>
              <span className="font-mono text-sm text-white/45 mb-3">/mo</span>
            </div>
            <p className="text-[15px] text-white/60 mt-4">
              <span className="text-em font-medium">{money0(annualA)}</span> a year, at a <span className="text-em font-medium">{Math.round(c.margin)}%</span> margin.
            </p>
            <div className="mt-7 pt-6 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Row label="Your revenue" value={money0(c.revenue)} />
              <Row label={`What the platform costs you (${pl.name})`} value={`- ${money0(c.platformCost)}`} />
              <div className="pt-3 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Row label="You keep" value={money0(c.mrr)} em />
              </div>
            </div>
            {c.otherMrr > c.mrr && (
              <div className="mt-6 flex items-center gap-2.5 rounded-xl p-4" style={{ background: 'rgba(1,245,209,0.05)', border: '1px solid rgba(1,245,209,0.18)' }}>
                <TrendingUp className="w-4 h-4 text-em shrink-0" />
                <p className="text-[13px] text-white/70">
                  At this scale the <span className="text-em font-medium">{PLANS[c.other].name}</span> plan nets you <span className="text-em font-medium">{money0(c.otherMrr - c.mrr)}/mo</span> more.
                </p>
              </div>
            )}
            <Link href="/signup" className="btn btn-em mt-8 self-start">Start your 14-day free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
        }
      />
    </div>
  );
}

export default function AgencyOpportunityPage() {
  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-44 lg:pt-56 pb-24 lg:pb-36 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <FadeIn className="max-w-4xl">
            <p className="t-eyebrow text-em mb-8">Build your own AI receptionist agency</p>
            <h1 className="t-h1 text-white max-w-[20ch] leading-[1.05]">Every missed call is money. You&apos;re the one who catches it.</h1>
            <p className="t-body mt-10 max-w-2xl text-[1.05rem] leading-relaxed">
              Local businesses lose thousands every month to calls they never pick up. You put your own AI receptionist in front of them, it answers every call around the clock, and you keep the margin. No code, no call center, no answering a single phone yourself.
            </p>
            <div className="mt-12 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-em">Start your 14-day free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="#calculator" className="btn btn-ghost-dark">Run your numbers <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="bg-paper py-32 lg:py-48 scroll-mt-24">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-20 lg:mb-28">
            <p className="t-eyebrow text-em-deep mb-7">See it in real numbers</p>
            <h2 className="t-h2 text-black leading-tight">Their losses become your income. Watch it happen.</h2>
            <p className="t-body mt-7 leading-relaxed">
              Three steps. Set a real business&apos;s numbers, set what you&apos;d charge, then set how many clients you sign. Every number updates live as you drag.
            </p>
          </FadeIn>
          <FadeIn>
            <MasterCalculator />
          </FadeIn>
          <FadeIn>
            <p className="text-[12px] text-black/40 mt-16 max-w-3xl leading-relaxed">
              Estimates for illustration. Missed-call figures use industry benchmarks (small businesses miss 20 to 62% of calls; the average missed call to a home-services business is worth roughly $1,200 in lifetime value; about 8 in 10 callers who hit voicemail never leave a message, per Invoca, CallRail, and a Forbes SMB study, 2024 to 2025). We assume the AI recovers 60% of missed calls and about {MIN_PER_CLIENT} answered minutes per client per month. Platform costs are VoiceAI Connect&apos;s published rates (Pro: $99/mo + $9.99/client + $0.10/min; Scale: $499/mo + $0.05/min). Your real profit depends on what you charge and actual usage, and does not include your own costs like outreach or payment processing.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* THE STAKES */}
      <section className="bg-ink py-32 lg:py-48 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-20">
            <p className="t-eyebrow text-em mb-7">Why this is the easiest sale you&apos;ll make</p>
            <h2 className="t-h2 text-white leading-tight">Every business in your city is already losing this money. They just can&apos;t see it.</h2>
            <p className="t-body mt-8 max-w-xl text-white/55 leading-relaxed">
              You don&apos;t have to convince anyone a problem exists. The phone is already ringing while they&apos;re on a job, closed for the night, or stuck on another call. You just show them the number, and offer to answer it.
            </p>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
              {[
                { stat: '20–62%', label: 'of calls to local businesses go unanswered during the day.' },
                { stat: '8 in 10', label: 'callers who hit voicemail never leave a message. They call a competitor instead.' },
                { stat: '~$1,200', label: 'average lifetime value of a single missed call for a home-services business.' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.012] p-9">
                  <p className="t-stat text-white" style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3rem)' }}>{s.stat}</p>
                  <p className="text-[15px] text-white/55 leading-relaxed mt-4">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* WHY THE MARGIN HOLDS */}
      <section className="bg-paper py-32 lg:py-48">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-20">
            <p className="t-eyebrow text-em-deep mb-7">Why it actually pays you</p>
            <h2 className="t-h2 text-black leading-tight">Recurring revenue with almost no work per client.</h2>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
              {[
                { icon: Zap, title: 'You never answer a phone', desc: 'The AI picks up every call, books the job, and texts the details. Signing another client does not add hours to your week.' },
                { icon: Server, title: 'Your cost is flat and tiny', desc: 'A base fee plus cents per minute. You set the price, so the spread between what you charge and what it costs you is yours to keep.' },
                { icon: Wallet, title: 'You own the client', desc: 'They pay you directly through your own Stripe, on your brand. The platform stays invisible and never touches your rate or your relationship.' },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border border-black/[0.07] bg-white p-9">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(0,198,178,0.08)', border: '1px solid rgba(0,198,178,0.2)' }}>
                    <c.icon className="w-5 h-5" style={{ color: '#008f81' }} strokeWidth={1.9} />
                  </div>
                  <h3 className="font-display text-[18px] font-medium text-black tracking-tight">{c.title}</h3>
                  <p className="text-[14.5px] text-black/55 leading-relaxed mt-3">{c.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="bg-ink py-32 lg:py-48 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-20">
            <p className="t-eyebrow text-em mb-7">Everything is already built</p>
            <h2 className="t-h2 text-white leading-tight">You bring the clients. We run everything behind your brand.</h2>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
              {[
                { icon: Sparkles, title: 'Your brand, start to finish', desc: 'Your logo, your colors, your domain. Clients never see VoiceAI Connect. It looks like software you built.' },
                { icon: Clock, title: '60-second client onboarding', desc: 'A client signs up and their AI receptionist and phone number go live in about a minute. No paperwork marathon.' },
                { icon: LayoutDashboard, title: 'Dashboards clients love', desc: 'Every client sees their own calls, recordings, transcripts, and summaries. It feels premium, which is why they stay.' },
                { icon: PhoneCall, title: 'A demo line that sells for you', desc: 'A live number you hand prospects so they can hear the AI answer for themselves. One call closes more than any pitch.' },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.012] p-9 flex gap-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(1,245,209,0.06)', border: '1px solid rgba(1,245,209,0.18)' }}>
                    <c.icon className="w-5 h-5 text-em" strokeWidth={1.9} />
                  </div>
                  <div>
                    <h3 className="font-display text-[18px] font-medium text-white tracking-tight">{c.title}</h3>
                    <p className="text-[14.5px] text-white/55 leading-relaxed mt-2.5">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn>
            <div className="mt-10 flex items-start gap-4 rounded-2xl p-8 max-w-3xl" style={{ background: 'rgba(1,245,209,0.04)', border: '1px solid rgba(1,245,209,0.14)' }}>
              <ShieldCheck className="w-5 h-5 text-em shrink-0 mt-0.5" strokeWidth={1.9} />
              <p className="text-[15px] text-white/70 leading-relaxed">
                This is a platform, not a program. You find the clients and own the relationship. The AI answers their calls and books their jobs. Because the delivery runs itself, the margin on every client is yours to keep.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink canvas-dot py-36 lg:py-52 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <FadeIn className="max-w-3xl">
            <p className="t-eyebrow text-em mb-7">Start today</p>
            <h2 className="t-h1 text-white leading-[1.05]">The calls are already being missed. Go be the one who answers.</h2>
            <p className="t-body mt-9 max-w-lg leading-relaxed">
              Launch your white-label agency, grab your demo line, and sign your first client. Your first 14 days are free.
            </p>
            <div className="flex flex-wrap gap-3 mt-12">
              <Link href="/signup" className="btn btn-em">Start your 14-day free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="#calculator" className="btn btn-ghost-dark">Run your numbers again <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
