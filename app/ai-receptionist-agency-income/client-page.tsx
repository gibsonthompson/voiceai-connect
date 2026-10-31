'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, ArrowRight, TrendingUp, PhoneOff, Tag, Users, Zap, Server, Wallet } from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

// ---------------------------------------------------------------------------
// One linked model. A single input set (industry + call volume) drives three
// outcomes in sequence: what a local business loses to missed calls, what to
// charge that business for an AI receptionist, and what the agency keeps.
//
// Numbers are kept in sync with the rest of the site on purpose:
//   - Industry presets mirror components/MissedCallCalculator.tsx (PRESETS)
//   - Plan economics mirror app/agency-revenue-calculator (lib/plan-limits.ts)
//       Pro:   $99/mo  + $9.99/client/mo + $0.10/min
//       Scale: $499/mo + $0/client/mo    + $0.05/min
// If either source changes, update here too.
// ---------------------------------------------------------------------------
type PresetKey = 'plumbing' | 'hvac' | 'electrical' | 'roofing' | 'general';
const PRESETS: Record<PresetKey, { job: number; missed: number; close: number; label: string }> = {
  plumbing:   { job: 650,  missed: 30, close: 45, label: 'Plumbing' },
  hvac:       { job: 850,  missed: 35, close: 40, label: 'HVAC' },
  electrical: { job: 550,  missed: 28, close: 45, label: 'Electrical' },
  roofing:    { job: 9000, missed: 25, close: 30, label: 'Roofing' },
  general:    { job: 500,  missed: 30, close: 40, label: 'Other' },
};

const PLANS = {
  pro: { name: 'Pro', fee: 99, perClient: 9.99, perMinute: 0.10 },
  scale: { name: 'Scale', fee: 499, perClient: 0, perMinute: 0.05 },
} as const;
type PlanId = keyof typeof PLANS;

// Fixed assumptions (kept off the controls so the page stays simple).
const RECOVER = 0.70;   // share of missed calls an always-on AI wins back
const AVG_MIN = 3.2;    // average answered-call length, minutes
const WEEKS = 4.33;     // weeks per month

const money0 = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const roundTo = (v: number, step: number) => Math.round(v / step) * step;

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

function Slider({
  label, value, min, max, step, onChange, format, hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string; hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-black/45">{label}</span>
        <span className="font-display text-xl font-medium text-black tabular-nums tracking-tight">{format(value)}</span>
      </div>
      <input
        type="range"
        className="calc-range w-full"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pct']: `${pct}%` } as unknown as React.CSSProperties}
        aria-label={label}
      />
      {hint && <p className="text-[11px] text-black/40 mt-2">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({
  options, value, onChange,
}: { options: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-black/[0.08] bg-black/[0.03] p-1">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
            style={active ? { background: '#050505', color: '#fff' } : { background: 'transparent', color: 'rgba(0,0,0,0.5)' }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Row({ label, value, em, strong }: { label: string; value: string; em?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`text-[13px] ${em ? 'text-white font-medium' : 'text-white/55'}`}>{label}</span>
      <span className={`tabular-nums ${em ? 'text-em font-semibold text-[17px]' : strong ? 'text-white font-medium text-[14px]' : 'text-white/70 text-[14px]'}`}>{value}</span>
    </div>
  );
}

function ResultCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl p-7 lg:p-8 flex flex-col h-full" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </div>
  );
}

function Calculator() {
  const [industry, setIndustry] = useState<PresetKey>('plumbing');
  const [calls, setCalls] = useState(40);
  const [price, setPrice] = useState(297);
  const [clients, setClients] = useState(25);
  const [plan, setPlan] = useState<PlanId>('scale');

  const pr = PRESETS[industry];

  // 1) What the business loses.
  const missedMo = calls * (pr.missed / 100) * WEEKS;
  const lostMo = missedMo * pr.job * (pr.close / 100);
  const lostYr = lostMo * 12;
  const backMo = lostMo * RECOVER;

  // 2) What to charge. Recommended sits at ~12% of the monthly loss, held inside
  // a believable local-business band, rounded to a clean number.
  const recommended = clamp(roundTo(lostMo * 0.05, 25), 199, 499);
  const clientNet = backMo - price; // what the client still keeps after paying the agency

  // 3) What the agency keeps.
  const minutesMo = calls * WEEKS * AVG_MIN;
  const pl = PLANS[plan];
  const costPerClient = pl.perClient + minutesMo * pl.perMinute;
  const revenue = clients * price;
  const totalCost = pl.fee + clients * pl.perClient + clients * minutesMo * pl.perMinute;
  const profit = revenue - totalCost;
  const annual = profit * 12;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const scaleAt = (n: number) => n * price - (pl.fee + n * pl.perClient + n * minutesMo * pl.perMinute);

  const otherId: PlanId = plan === 'pro' ? 'scale' : 'pro';
  const o = PLANS[otherId];
  const otherProfit = revenue - (o.fee + clients * o.perClient + clients * minutesMo * o.perMinute);

  return (
    <div className="flex flex-col gap-5">
      <style>{`
        input.calc-range { -webkit-appearance:none; -moz-appearance:none; appearance:none; width:100%; height:8px; border-radius:999px; outline:none; cursor:pointer; accent-color:#00c6b2; margin:0;
          background: linear-gradient(90deg, #00c6b2 0%, #00c6b2 var(--pct,0%), rgba(5,5,5,0.14) var(--pct,0%), rgba(5,5,5,0.14) 100%); }
        input.calc-range::-webkit-slider-runnable-track { height:8px; border-radius:999px; background:transparent; }
        input.calc-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:22px; height:22px; margin-top:-7px; border-radius:50%; background:#050505; border:3px solid #fff; box-shadow:0 1px 5px rgba(0,0,0,0.3); cursor:pointer; }
        input.calc-range::-moz-range-track { height:8px; border-radius:999px; background:rgba(5,5,5,0.14); }
        input.calc-range::-moz-range-progress { height:8px; border-radius:999px; background:#00c6b2; }
        input.calc-range::-moz-range-thumb { width:22px; height:22px; border-radius:50%; background:#050505; border:3px solid #fff; box-shadow:0 1px 5px rgba(0,0,0,0.3); cursor:pointer; }
      `}</style>

      {/* Industry picker drives the whole model */}
      <div className="rounded-2xl border border-black/[0.08] bg-white/70 p-6 lg:p-7">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-black/45 mb-3">Pick the kind of business you will sell to</p>
        <Segmented
          options={(Object.keys(PRESETS) as PresetKey[]).map((k) => ({ id: k, label: PRESETS[k].label }))}
          value={industry}
          onChange={setIndustry}
        />
      </div>

      {/* STEP 1 — the problem */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl border border-black/[0.08] bg-white/70 p-7 lg:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-semibold" style={{ background: '#050505', color: '#fff' }}>1</span>
            <h3 className="font-display text-[17px] font-medium text-black tracking-tight">What a {pr.label.toLowerCase()} business loses to missed calls</h3>
          </div>
          <Slider label="Calls it gets a week" value={calls} min={5} max={200} step={5} onChange={setCalls} format={(v) => `${v}`} hint={`Assumes a ${PRESETS[industry].job.toLocaleString('en-US')} average job, ${pr.missed}% of calls missed, ${pr.close}% becoming work. Industry benchmarks you can defend.`} />
          <p className="text-[13px] text-black/50 leading-relaxed mt-auto">
            Small businesses miss 20 to 60% of calls during busy hours, and about 8 in 10 callers who hit voicemail never call back. That is money walking to a competitor.
          </p>
        </div>
        <ResultCard>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-white/40 mb-4">Walking out the door</p>
          <div className="flex items-end gap-2">
            <p className="t-stat text-white" style={{ fontSize: 'clamp(2.5rem, 6.5vw, 4.25rem)' }}>{money0(lostMo)}</p>
            <span className="font-mono text-sm text-white/45 mb-3">/mo</span>
          </div>
          <p className="text-[15px] text-white/60 mt-2">
            That is <span className="text-white font-medium">{money0(lostYr)}</span> a year, from about{' '}
            <span className="text-white font-medium">{Math.round(missedMo)}</span> missed calls a month.
          </p>
          <div className="mt-auto pt-7 flex items-center gap-2.5 rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <PhoneOff className="w-4 h-4 text-white/50 shrink-0" />
            <p className="text-[13px] text-white/60">This is the number you put in front of an owner. It sells the service for you.</p>
          </div>
        </ResultCard>
      </div>

      {/* STEP 2 — what to charge */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl border border-black/[0.08] bg-white/70 p-7 lg:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-semibold" style={{ background: '#050505', color: '#fff' }}>2</span>
            <h3 className="font-display text-[17px] font-medium text-black tracking-tight">What to charge for it</h3>
          </div>
          <Slider label="Your price to the client / mo" value={price} min={99} max={1500} step={1} onChange={setPrice} format={money0} />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-black/40">Suggested</span>
            <button
              type="button"
              onClick={() => setPrice(recommended)}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors"
              style={{ background: 'rgba(0,198,178,0.12)', color: '#047a6e', border: '1px solid rgba(0,198,178,0.3)' }}
            >
              Use {money0(recommended)}/mo
            </button>
          </div>
          <p className="text-[13px] text-black/50 leading-relaxed mt-auto">
            Price to a slice of what they are losing, not to your cost. A business bleeding {money0(lostMo)}/mo will not blink at {money0(recommended)}, and it is still a fraction of the {money0(3000)}/mo a full-time receptionist costs.
          </p>
        </div>
        <ResultCard>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-white/40 mb-4">Why they say yes</p>
          <p className="text-[15px] text-white/60">At {money0(price)}/mo, the owner still keeps</p>
          <div className="flex items-end gap-2 mt-1">
            <p className="t-stat text-em" style={{ fontSize: 'clamp(2.25rem, 6vw, 3.75rem)' }}>{money0(Math.max(0, clientNet))}</p>
            <span className="font-mono text-sm text-white/45 mb-2.5">/mo</span>
          </div>
          <p className="text-[14px] text-white/55 mt-2">of recovered work, after paying you.</p>
          <div className="mt-7 pt-6 space-y-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Row label="Work an AI wins back / mo" value={money0(backMo)} strong />
            <Row label="Your fee" value={`- ${money0(price)}`} />
            <div className="pt-2.5 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Row label="They come out ahead by" value={money0(Math.max(0, clientNet))} em />
            </div>
          </div>
        </ResultCard>
      </div>

      {/* STEP 3 — what the agency keeps */}
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl border border-black/[0.08] bg-white/70 p-7 lg:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-semibold" style={{ background: '#050505', color: '#fff' }}>3</span>
            <h3 className="font-display text-[17px] font-medium text-black tracking-tight">What your agency keeps</h3>
          </div>
          <Slider label="Clients you sign" value={clients} min={1} max={100} step={1} onChange={setClients} format={(v) => `${v}`} />
          <div>
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-black/45 mb-3">Your plan</p>
            <Segmented
              options={(Object.keys(PLANS) as PlanId[]).map((id) => ({ id, label: <>{PLANS[id].name} <span className="font-mono text-[11px] opacity-60">${PLANS[id].fee}/mo</span></> }))}
              value={plan}
              onChange={setPlan}
            />
          </div>
          <p className="text-[13px] text-black/50 leading-relaxed mt-auto">
            Your cost to run it is {money0(pl.fee)} base{pl.perClient > 0 ? ` + ${money(pl.perClient)}/client` : ''} + {money(pl.perMinute)}/min of talk time. You set the price, so the spread is yours.
          </p>
        </div>
        <ResultCard>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-white/40 mb-4">Your monthly profit</p>
          <div className="flex items-end gap-2">
            <p className="t-stat text-em" style={{ fontSize: 'clamp(2.75rem, 7vw, 4.75rem)' }}>{money0(profit)}</p>
            <span className="font-mono text-sm text-white/45 mb-3">/mo</span>
          </div>
          <p className="text-[15px] text-white/60 mt-2">
            <span className="text-em font-medium">{money0(annual)}</span> a year, at a{' '}
            <span className="text-em font-medium">{Math.round(margin)}%</span> margin.
          </p>
          <div className="mt-7 pt-6 space-y-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Row label={`Revenue (${clients} x ${money0(price)})`} value={money0(revenue)} strong />
            <Row label={`Platform fee (${pl.name})`} value={`- ${money0(pl.fee)}`} />
            {pl.perClient > 0 && <Row label={`Per-client fees (${clients} x ${money(pl.perClient)})`} value={`- ${money0(clients * pl.perClient)}`} />}
            <Row label={`Voice minutes (~${Math.round(clients * minutesMo).toLocaleString('en-US')} min)`} value={`- ${money0(clients * minutesMo * pl.perMinute)}`} />
            <div className="pt-2.5 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Row label="You keep" value={money0(profit)} em />
            </div>
          </div>
          {otherProfit > profit && (
            <div className="mt-6 flex items-center gap-2.5 rounded-xl p-3.5" style={{ background: 'rgba(1,245,209,0.05)', border: '1px solid rgba(1,245,209,0.18)' }}>
              <TrendingUp className="w-4 h-4 text-em shrink-0" />
              <p className="text-[13px] text-white/70">
                At this scale the <span className="text-em font-medium">{PLANS[otherId].name}</span> plan nets{' '}
                <span className="text-em font-medium">{money0(otherProfit - profit)}/mo</span> more.
              </p>
            </div>
          )}
        </ResultCard>
      </div>

      {/* Scale strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[5, 25, 50].map((n) => (
          <div key={n} className="rounded-2xl border border-black/[0.08] bg-white/70 p-6">
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-black/45">{n} clients</p>
            <p className="t-stat text-black mt-2" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>{money0(Math.max(0, scaleAt(n)))}<span className="font-mono text-sm text-black/40">/mo</span></p>
            <p className="text-[13px] text-black/50 mt-1">{money0(Math.max(0, scaleAt(n) * 12))} a year at {money0(price)}/client</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgencyIncomePage() {
  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-16 lg:pb-20 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <FadeIn className="max-w-4xl">
            <p className="t-eyebrow text-em mb-7">AI receptionist agency income</p>
            <h1 className="t-h1 text-white max-w-[18ch]">What to charge for AI receptionists, and what you keep.</h1>
            <p className="t-body mt-8 max-w-2xl text-[1rem]">
              Pick the kind of local business you want to sell to. See what it loses to missed calls, what to charge it for an AI receptionist that answers every one, and what your agency pockets after the platform takes its cut. Every number moves as you drag.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="#calculator" className="btn btn-ghost-dark">Run the numbers <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CALCULATOR */}
      <section id="calculator" className="bg-paper py-24 lg:py-32 scroll-mt-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-12">
            <p className="t-eyebrow text-em-deep mb-6">The numbers</p>
            <h2 className="t-h2 text-black">Problem, price, profit.</h2>
            <p className="t-body mt-5">
              One set of inputs runs the whole story. Start with the business you are targeting, and the page walks from what they are losing to what you take home.
            </p>
          </FadeIn>
          <FadeIn>
            <Calculator />
          </FadeIn>
          <FadeIn>
            <p className="text-[12px] text-black/40 mt-6 max-w-3xl">
              Estimates for illustration. Loss figures use industry benchmarks (missed-call rates, average job values, close rates) you can adjust. Platform costs are VoiceAI Connect published rates (Pro: $99/mo + $9.99/client + $0.10/min; Scale: $499/mo + $0.05/min, no per-client fee). Assumes an AI wins back 70% of missed calls and roughly 3 minutes a call. Your results depend on what you charge and real usage, and do not include your own outreach or payment-processing costs.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* HOW TO PRICE */}
      <section className="bg-ink py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-14">
            <p className="t-eyebrow text-em mb-6">How to price it</p>
            <h2 className="t-h2 text-white">Three rules that make the sale easy.</h2>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Tag, title: 'Price to their loss, not your cost', desc: 'The owner does not care what the platform charges you. They care that they are losing thousands a month. Anchor your price to that number and it looks small.' },
                { icon: Wallet, title: 'Stay under the receptionist', desc: 'A full-time human runs about $3,000 a month and answers one call at a time. Sit well under that and you are the obvious choice, not a splurge.' },
                { icon: Zap, title: 'Charge flat, monthly', desc: 'One predictable price per month, not per minute or per call. Easy for them to say yes to, and it is recurring revenue you can count on.' },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.012] p-6">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(1,245,209,0.06)', border: '1px solid rgba(1,245,209,0.18)' }}>
                    <c.icon className="w-4 h-4 text-em" strokeWidth={1.9} />
                  </div>
                  <h3 className="font-display text-[16px] font-medium text-white tracking-tight">{c.title}</h3>
                  <p className="text-[13.5px] text-white/55 leading-relaxed mt-2.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* WHY THE MARGIN HOLDS */}
      <section className="bg-paper py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-14">
            <p className="t-eyebrow text-em-deep mb-6">Why the margin holds</p>
            <h2 className="t-h2 text-black">Recurring revenue with almost no delivery cost.</h2>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Zap, title: 'No work per call', desc: 'The AI answers, books, and texts on its own. Adding clients does not add hours, so your margin holds as you grow.' },
                { icon: Server, title: 'Flat, predictable cost', desc: 'A base fee plus cents per minute is all you pay. You set the client price, so the spread between the two is yours.' },
                { icon: Users, title: 'You own the client', desc: 'Clients pay you directly through your own Stripe at the price you set. The platform never touches the relationship or the rate.' },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border border-black/[0.07] bg-white/70 p-6">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(0,198,178,0.08)', border: '1px solid rgba(0,198,178,0.22)' }}>
                    <c.icon className="w-4 h-4" style={{ color: '#047a6e' }} strokeWidth={1.9} />
                  </div>
                  <h3 className="font-display text-[16px] font-medium text-black tracking-tight">{c.title}</h3>
                  <p className="text-[13.5px] text-black/55 leading-relaxed mt-2.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink canvas-dot py-32 lg:py-40 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <FadeIn className="max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Start building</p>
            <h2 className="t-h1 text-white">Your brand. Your prices. Your margin.</h2>
            <p className="t-body mt-7 max-w-lg">
              Launch your own AI receptionist agency on VoiceAI Connect. White-label everything, set your own pricing, and keep the spread on every client you sign.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/#pricing" className="btn btn-ghost-dark">See plans <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
