'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, ArrowRight, TrendingUp, Wallet, Server, Zap } from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

// ---------------------------------------------------------------------------
// Cost model (what the agency pays VoiceAI Connect). Mirrors lib/plan-limits.ts
// PLAN_PRICES + PLAN_RATES. Keep in sync if those change.
//   Pro:   $99/mo  + $9.99/client/mo + $0.10/min
//   Scale: $499/mo + $0/client/mo    + $0.05/min
// ---------------------------------------------------------------------------
const PLANS = {
  pro: { name: 'Pro', fee: 99, perClient: 9.99, perMinute: 0.10 },
  scale: { name: 'Scale', fee: 499, perClient: 0, perMinute: 0.05 },
} as const;
type PlanId = keyof typeof PLANS;

const money0 = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

// Themed range slider (no native OS look). Fill + thumb in the mint accent.
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

function Calculator() {
  const [plan, setPlan] = useState<PlanId>('pro');
  const [clients, setClients] = useState(10);
  const [price, setPrice] = useState(500);
  const [minutes, setMinutes] = useState(400);

  const p = PLANS[plan];
  const revenue = clients * price;
  const feeCost = p.fee;
  const clientCost = clients * p.perClient;
  const minuteCost = clients * minutes * p.perMinute;
  const totalCost = feeCost + clientCost + minuteCost;
  const profit = revenue - totalCost;
  const annual = profit * 12;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  // Which plan nets more at these exact inputs (helps the prospect choose).
  const otherId: PlanId = plan === 'pro' ? 'scale' : 'pro';
  const o = PLANS[otherId];
  const otherProfit = revenue - (o.fee + clients * o.perClient + clients * minutes * o.perMinute);
  const betterPlan = otherProfit > profit ? otherId : plan;

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
      <style>{`
        input.calc-range { -webkit-appearance:none; appearance:none; height:8px; border-radius:999px; outline:none; cursor:pointer;
          background: linear-gradient(90deg, #00c6b2 0%, #00c6b2 var(--pct,0%), rgba(0,0,0,0.09) var(--pct,0%), rgba(0,0,0,0.09) 100%); }
        input.calc-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%; background:#050505; border:3px solid #fff; box-shadow:0 1px 5px rgba(0,0,0,0.3); cursor:pointer; }
        input.calc-range::-moz-range-thumb { width:22px; height:22px; border-radius:50%; background:#050505; border:3px solid #fff; box-shadow:0 1px 5px rgba(0,0,0,0.3); cursor:pointer; }
        input.calc-range::-moz-range-track { height:8px; border-radius:999px; background:transparent; }
      `}</style>

      {/* Controls */}
      <div className="flex flex-col gap-7">
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-black/45 mb-3">Your plan</p>
          <div className="inline-flex rounded-full border border-black/[0.08] bg-black/[0.03] p-1">
            {(Object.keys(PLANS) as PlanId[]).map((id) => {
              const active = plan === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlan(id)}
                  className="rounded-full px-5 py-2 text-sm font-medium transition-colors"
                  style={active ? { background: '#050505', color: '#fff' } : { background: 'transparent', color: 'rgba(0,0,0,0.5)' }}
                >
                  {PLANS[id].name} <span className="font-mono text-[11px] opacity-60">${PLANS[id].fee}/mo</span>
                </button>
              );
            })}
          </div>
        </div>

        <Slider label="Clients" value={clients} min={1} max={100} step={1} onChange={setClients} format={(v) => `${v}`} />
        <Slider label="You charge each / mo" value={price} min={99} max={2000} step={1} onChange={setPrice} format={money0} hint="What you bill each client for their AI receptionist." />
        <Slider label="Avg call minutes / client / mo" value={minutes} min={0} max={2000} step={50} onChange={setMinutes} format={(v) => `${v.toLocaleString('en-US')} min`} hint="Most local businesses run a few hundred answered minutes a month." />

        <p className="text-[13px] text-black/50 leading-relaxed mt-auto">
          {clients} {clients === 1 ? 'client' : 'clients'} at {money0(price)}/mo on the {p.name} plan.
          Your cost to us: {money0(p.fee)} base{p.perClient > 0 ? ` + ${money(p.perClient)}/client` : ''} + {money(p.perMinute)}/min.
        </p>
      </div>

      {/* Result */}
      <div className="rounded-2xl p-8 lg:p-10 flex flex-col" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.07)' }}>
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
          <Row label="Revenue" value={money0(revenue)} strong />
          <Row label={`Platform fee (${p.name})`} value={`- ${money0(feeCost)}`} />
          {p.perClient > 0 && <Row label={`Per-client fees (${clients} x ${money(p.perClient)})`} value={`- ${money0(clientCost)}`} />}
          <Row label={`Voice minutes (${(clients * minutes).toLocaleString('en-US')} min x ${money(p.perMinute)})`} value={`- ${money0(minuteCost)}`} />
          <div className="pt-2.5 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Row label="Your profit" value={money0(profit)} em />
          </div>
        </div>

        {betterPlan !== plan && (
          <div className="mt-6 flex items-center gap-2.5 rounded-xl p-3.5" style={{ background: 'rgba(1,245,209,0.05)', border: '1px solid rgba(1,245,209,0.18)' }}>
            <TrendingUp className="w-4 h-4 text-em shrink-0" />
            <p className="text-[13px] text-white/70">
              At this scale the <span className="text-em font-medium">{PLANS[betterPlan].name}</span> plan nets you{' '}
              <span className="text-em font-medium">{money0(otherProfit - profit)}/mo</span> more.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strong, em }: { label: string; value: string; strong?: boolean; em?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`text-[13px] ${em ? 'text-white font-medium' : 'text-white/55'}`}>{label}</span>
      <span className={`tabular-nums ${em ? 'text-em font-semibold text-[17px]' : strong ? 'text-white font-medium text-[14px]' : 'text-white/70 text-[14px]'}`}>{value}</span>
    </div>
  );
}

export default function ResellerCalculatorPage() {
  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-16 lg:pb-20 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <FadeIn className="max-w-4xl">
            <p className="t-eyebrow text-em mb-7">Reseller earnings calculator</p>
            <h1 className="t-h1 text-white max-w-[16ch]">See what you&apos;d make reselling AI receptionists.</h1>
            <p className="t-body mt-8 max-w-2xl text-[1rem]">
              You charge the client. You keep the margin. This is the real math: your revenue minus exactly what the platform costs you, including per-client fees and voice minutes. Drag the sliders.
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
            <p className="t-eyebrow text-em-deep mb-6">The math</p>
            <h2 className="t-h2 text-black">Your profit, end to end.</h2>
            <p className="t-body mt-5">
              Set your plan, how many clients you have, what you charge, and how much they talk. Everything below updates live, revenue, every platform cost, and what you actually keep.
            </p>
          </FadeIn>
          <FadeIn>
            <Calculator />
          </FadeIn>
          <FadeIn>
            <p className="text-[12px] text-black/40 mt-6 max-w-3xl">
              Estimate only. Platform costs shown are VoiceAI Connect&apos;s published rates (Pro: $99/mo + $9.99/client + $0.10/min; Scale: $499/mo + $0.05/min, no per-client fee). Your actual profit depends on what you charge and real usage. Does not include your own costs like outreach or payment processing.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* WHY THE MARGINS HOLD */}
      <section className="bg-ink py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <FadeIn className="max-w-2xl mb-14">
            <p className="t-eyebrow text-em mb-6">Why the margin stays high</p>
            <h2 className="t-h2 text-white">Recurring revenue with almost no delivery cost.</h2>
          </FadeIn>
          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Zap, title: 'No work per call', desc: 'The AI answers every call, books, and texts. Adding clients does not add hours, so margin holds as you scale.' },
                { icon: Server, title: 'Flat, predictable cost', desc: 'Your cost is a base fee plus cents per minute. You set the price, so the spread between the two is yours.' },
                { icon: Wallet, title: 'You own the billing', desc: 'Clients pay you directly through your own Stripe. The platform never touches your client relationship or your rate.' },
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

      {/* CTA */}
      <section className="bg-ink canvas-dot py-32 lg:py-40 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <FadeIn className="max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Start building</p>
            <h2 className="t-h1 text-white">Your brand. Your prices. Your margin.</h2>
            <p className="t-body mt-7 max-w-lg">
              Launch your own AI receptionist agency on VoiceAI Connect. White-label everything, set your own pricing, and keep the spread on every client.
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
