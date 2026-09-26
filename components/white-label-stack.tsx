'use client';

/**
 * WhiteLabelStack
 *
 * The one grand set-piece on the homepage. As the visitor scrolls, the four
 * layers of the value chain assemble with weight: infrastructure, then the
 * platform on top of it, then the agency's brand painting over the platform
 * (the white-label swap made visible), then the end business whose phone gets
 * answered. Money flows up, brand flows down. Scroll-scrubbed and re-watchable.
 *
 * Engineering choices (deliberate):
 *  - Pin = CSS position: sticky inside a tall container. Natural scroll is
 *    never hijacked; the user scrubs at their own pace.
 *  - Progress is read in a single requestAnimationFrame loop off a passive
 *    scroll listener, batched with a ticking flag.
 *  - Only transform and opacity are animated (compositor properties), with
 *    direct style writes via refs so React never re-renders per frame.
 *  - Native CSS scroll-timelines were considered, but Firefox still gates them
 *    behind a flag, so the JS driver is the universal base.
 *  - Under 1024px or with prefers-reduced-motion, a static labeled diagram
 *    renders instead. Same text, no pin, no motion.
 *
 * Grandeur comes from physics and light, not noise: a real 3D lean to the
 * pile, layers beneath compressing when a new one lands, vendor names absorbed
 * upward into the platform, a teal bloom at the brand moment, a slow light
 * sheen, a blueprint ground the pile sits on. Easing is cubic settle, never
 * overshoot.
 */

import { useEffect, useRef } from 'react';
import { Phone, Calendar, Check, MessageSquare } from 'lucide-react';

const VENDORS = [
  'Anthropic', 'ElevenLabs', 'Deepgram', 'OpenAI', 'Telnyx', 'Twilio', 'Stripe', 'Supabase',
  'Google', 'Vercel', 'Cloudflare', 'Sentry', 'PostHog', 'Brevo', 'Make', 'n8n',
];

const BEATS = [
  { k: 'Sixteen enterprise vendors.', s: 'The foundation. Raw capability: models, voices, telephony, payments. Powerful, unbranded, and complex.' },
  { k: 'One platform. The complexity disappears.', s: 'VoiceAI Connect turns sixteen vendors into a single product: onboarding, billing, dashboards, and the receptionist itself. Built to carry your name.' },
  { k: 'Your brand. Your pricing. Your margin.', s: 'You put your logo, your domain, and your price on it. VoiceAI Connect vanishes from everything your clients see.' },
  { k: 'Their phone gets answered.', s: 'The business you sign up sees only you. Every call answered, every appointment booked, around the clock.' },
  { k: 'The whole business. Under your name.', s: 'Revenue flows up to you. Your brand flows down to your clients. Everything underneath, we run.' },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const eo = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic: settles, never bounces
// visible window: fade in a..b, hold b..c, fade out c..d
const win = (p: number, a: number, b: number, c: number, d: number) =>
  p < a ? 0 : p < b ? eo(seg(p, a, b)) : p < c ? 1 : p < d ? 1 - eo(seg(p, c, d)) : 0;
// a brief physical press: sin-shaped dip over width w starting at t0
const bump = (p: number, t0: number, w = 0.07) => { const t = (p - t0) / w; return t < 0 || t > 1 ? 0 : Math.sin(t * Math.PI); };

type Refs = Record<string, HTMLElement | null>;

export default function WhiteLabelStack() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Refs>({});
  const set = (name: string) => (el: HTMLElement | null) => { refs.current[name] = el; };

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
    let active = mq.matches;
    let ticking = false;
    let last = -1;
    let lastBeat = -1;

    const DROP = 110;
    // isometric lean: each lower layer sits a little further left
    const OFFX = [-42, -28, -14, 0];

    const drop = (el: HTMLElement | null, t: number, offX: number, press: number) => {
      if (!el) return;
      const e = eo(t);
      el.style.opacity = String(e);
      el.style.transform = `translate(${offX}px, ${(1 - e) * -DROP}px) scale(${(0.96 + 0.04 * e) * press})`;
    };
    const fade = (el: HTMLElement | null, o: number) => { if (el) el.style.opacity = String(o); };

    const apply = (p: number) => {
      const r = refs.current;

      // Beat headlines crossfade
      fade(r.l0, win(p, 0.00, 0.03, 0.16, 0.22));
      fade(r.l1, win(p, 0.20, 0.26, 0.38, 0.44));
      fade(r.l2, win(p, 0.42, 0.48, 0.62, 0.68));
      fade(r.l3, win(p, 0.68, 0.74, 0.90, 0.94));
      fade(r.l4, win(p, 0.93, 0.98, 1.01, 1.02));

      // Beat counter (large, faint telemetry)
      const beat = p < 0.20 ? 0 : p < 0.42 ? 1 : p < 0.68 ? 2 : 3;
      if (beat !== lastBeat && r.counter) { r.counter.textContent = `0${beat + 1}`; lastBeat = beat; }
      fade(r.counter, eo(seg(p, 0.0, 0.08)) * (1 - 0.6 * eo(seg(p, 0.92, 1.0))));

      // Weight: layers beneath compress briefly as each new layer lands
      const press0 = 1 - 0.014 * (bump(p, 0.38) + bump(p, 0.54) + bump(p, 0.78));
      const press1 = 1 - 0.014 * (bump(p, 0.54) + bump(p, 0.78));
      const press2 = 1 - 0.014 * bump(p, 0.78);

      // Slabs drop in, one per beat
      drop(r.s0, seg(p, 0.02, 0.18), OFFX[0], press0);
      drop(r.s1, seg(p, 0.22, 0.38), OFFX[1], press1);
      drop(r.s2, seg(p, 0.42, 0.54), OFFX[2], press2);
      drop(r.s3, seg(p, 0.68, 0.78), OFFX[3], 1);

      // Foundation dims; vendor names are absorbed upward into the platform
      const dim = eo(seg(p, 0.28, 0.40));
      if (r.s0 && p > 0.22) r.s0.style.opacity = String(1 - 0.45 * dim);
      if (r.vendors) { r.vendors.style.opacity = String(1 - dim); r.vendors.style.transform = `translateY(${-16 * dim}px)`; }

      // Ground grid and shadow pool build as the pile grows
      fade(r.ground, eo(seg(p, 0.0, 0.16)) * 0.9);
      fade(r.pool, 0.25 + 0.55 * eo(seg(p, 0.2, 0.78)));

      // The white-label swap: teal paints the agency slab, a bloom swells, the platform wordmark dissolves
      const wash = eo(seg(p, 0.50, 0.64));
      if (r.wash) r.wash.style.transform = `scaleX(${wash})`;
      if (r.bloom) { r.bloom.style.opacity = String(wash * 0.55 * (1 - 0.5 * eo(seg(p, 0.90, 1.0)))); r.bloom.style.transform = `scale(${0.8 + 0.3 * wash})`; }
      fade(r.platformMark, 1 - eo(seg(p, 0.52, 0.62)));
      fade(r.platformGone, eo(seg(p, 0.56, 0.64)));
      fade(r.agencyName, eo(seg(p, 0.56, 0.64)));
      fade(r.agencyDim, 1 - eo(seg(p, 0.52, 0.62)));
      fade(r.cost, 1 - eo(seg(p, 0.58, 0.68)));
      fade(r.price, eo(seg(p, 0.58, 0.68)));

      // End business: the call completes. Ring, answer, book, summarize, notify.
      const ring = seg(p, 0.74, 0.82);
      if (r.phone) r.phone.style.transform = `scale(${1 + 0.07 * Math.sin(ring * Math.PI * 3) * (1 - eo(seg(p, 0.80, 0.84)))})`;
      fade(r.ringing, 1 - eo(seg(p, 0.80, 0.85)));
      fade(r.answered, win(p, 0.80, 0.85, 0.87, 0.91));
      fade(r.done, eo(seg(p, 0.88, 0.92)));
      const chip = (el: HTMLElement | null, a: number, b: number) => {
        if (!el) return;
        const t = eo(seg(p, a, b));
        el.style.opacity = String(t);
        el.style.transform = `translateY(${(1 - t) * 6}px) scale(${0.94 + 0.06 * t})`;
      };
      chip(r.cal, 0.82, 0.87);
      chip(r.summary, 0.85, 0.90);
      chip(r.notified, 0.88, 0.93);

      // A slow light sheen crosses the pile with scroll
      if (r.sheen) r.sheen.style.transform = `translateX(${-60 + 200 * p}%) skewX(-18deg)`;

      // Pull back: the whole pile eases out to reveal the flows
      const back = eo(seg(p, 0.92, 1.0));
      if (r.stack) r.stack.style.transform = `perspective(1500px) rotateX(${12 - 6 * back}deg) scale(${1 - 0.12 * back}) translateY(${-14 * back}px)`;
      fade(r.flows, back);
      if (r.flowA) r.flowA.style.transform = `scaleX(${eo(seg(p, 0.93, 0.98))})`;
      if (r.flowB) r.flowB.style.transform = `scaleX(${eo(seg(p, 0.96, 1.0))})`;

      // Progress rail
      if (r.rail) r.rail.style.transform = `scaleX(${p})`;
    };

    const measure = () => {
      const el = wrapRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      return clamp(-rect.top / Math.max(total, 1));
    };

    const tick = () => {
      ticking = false;
      if (!active) return;
      const p = measure();
      if (p !== last) { last = p; apply(p); }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
    const onChange = () => { active = mq.matches; last = -1; onScroll(); };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    mq.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      mq.removeEventListener('change', onChange);
    };
  }, []);

  return (
    <>
      {/* ───────── Animated (desktop, motion allowed) ───────── */}
      <div ref={wrapRef} className="wls-anim relative" style={{ height: '460vh' }}>
        <div className="sticky top-0 h-screen overflow-hidden flex items-center">
          <div className="w-full grid lg:grid-cols-12 gap-16 items-center">

            {/* Beat copy (left). All five are in the DOM; they crossfade. */}
            <div className="lg:col-span-5 relative min-h-[300px]">
              {BEATS.map((b, i) => (
                <div key={b.k} ref={set(`l${i}`)} className="absolute inset-x-0 top-0" style={{ opacity: i === 0 ? 1 : 0 }}>
                  <span className="racing-line" />
                  <h3 className="font-display text-[32px] lg:text-[44px] font-medium text-white leading-[1.05] tracking-tight">{b.k}</h3>
                  <p className="t-body mt-6 max-w-md text-[16px] leading-[1.65]">{b.s}</p>
                </div>
              ))}
            </div>

            {/* The pile (right) */}
            <div className="lg:col-span-7 relative wls-scene">
              {/* Blueprint ground the pile sits on */}
              <div ref={set('ground')} className="wls-ground" style={{ opacity: 0 }} aria-hidden />
              {/* Shadow pool that deepens as layers stack */}
              <div ref={set('pool')} className="wls-pool" style={{ opacity: 0.25 }} aria-hidden />
              {/* Teal bloom at the brand moment */}
              <div ref={set('bloom')} className="wls-bloom" style={{ opacity: 0, transform: 'scale(0.8)' }} aria-hidden />
              {/* Beat counter */}
              <div className="absolute -top-2 right-0 flex items-baseline gap-2 select-none" aria-hidden>
                <span ref={set('counter')} className="font-display text-[72px] leading-none font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.07)', opacity: 0 }}>01</span>
                <span className="telemetry text-[11px]" style={{ color: 'var(--steel-700)' }}>/ 04</span>
              </div>

              <div ref={set('stack')} className="wls-stack relative" style={{ transform: 'perspective(1500px) rotateX(12deg)' }}>

                {/* 4: End business (top of the pile). The call completes: ring, answer, book, summarize, notify. */}
                <div ref={set('s3')} className="wls-slab" style={{ opacity: 0 }}>
                  <div className="flex items-center gap-5">
                    <div ref={set('phone')} className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,227,170,0.1)', border: '1px solid rgba(0,227,170,0.25)' }}>
                      <Phone className="w-6 h-6 text-em" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="telemetry text-[11px] uppercase">End business</p>
                      <div className="relative h-8 mt-2">
                        <p ref={set('ringing')} className="absolute inset-0 font-display text-[19px] text-white font-medium whitespace-nowrap">Incoming call, ringing</p>
                        <p ref={set('answered')} className="absolute inset-0 font-display text-[19px] text-white font-medium whitespace-nowrap" style={{ opacity: 0 }}>Answered. Job booked.</p>
                        <p ref={set('done')} className="absolute inset-0 font-display text-[19px] text-white font-medium whitespace-nowrap" style={{ opacity: 0 }}>Summary texted. No interruption.</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <div ref={set('cal')} className="flex items-center gap-2 rounded-lg border px-3 py-1.5" style={{ opacity: 0, borderColor: 'rgba(0,227,170,0.25)', background: 'rgba(0,227,170,0.06)' }}>
                          <Calendar className="w-3.5 h-3.5 text-em" /><span className="telemetry text-[10px]">Thu 2:00 PM</span>
                        </div>
                        <div ref={set('summary')} className="flex items-center gap-2 rounded-lg border px-3 py-1.5" style={{ opacity: 0, borderColor: 'var(--hairline-strong)', background: 'rgba(255,255,255,0.03)' }}>
                          <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--steel-300)' }} /><span className="telemetry text-[10px]">Summary texted</span>
                        </div>
                        <div ref={set('notified')} className="flex items-center gap-2 rounded-lg border px-3 py-1.5" style={{ opacity: 0, borderColor: 'var(--hairline-strong)', background: 'rgba(255,255,255,0.03)' }}>
                          <Check className="w-3.5 h-3.5 text-em" strokeWidth={2.5} /><span className="telemetry text-[10px]">Owner never picked up</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3: Your agency (paints teal) */}
                <div ref={set('s2')} className="wls-slab relative overflow-hidden" style={{ opacity: 0 }}>
                  <div ref={set('wash')} className="absolute inset-0 origin-left" style={{ transform: 'scaleX(0)', background: 'linear-gradient(90deg, rgba(0,227,170,0.18), rgba(0,227,170,0.05))' }} />
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: 'var(--color-em-400)' }} />
                  <div className="relative flex items-center justify-between gap-6">
                    <div className="min-w-0">
                      <p className="telemetry text-[11px] uppercase">Your agency</p>
                      <div className="relative h-8 mt-2">
                        <p ref={set('agencyDim')} className="absolute inset-0 font-display text-[19px] font-medium whitespace-nowrap" style={{ color: 'var(--steel-500)' }}>Unbranded, waiting for you</p>
                        <p ref={set('agencyName')} className="absolute inset-0 font-display text-[19px] text-white font-medium whitespace-nowrap" style={{ opacity: 0 }}>Your Brand <span className="telemetry text-[11px] ml-3" style={{ color: 'var(--steel-300)' }}>your-brand.com</span></p>
                      </div>
                    </div>
                    <div className="relative h-8 w-[170px] text-right flex-shrink-0">
                      <p ref={set('cost')} className="absolute inset-0 telemetry text-[12px]">Your cost: $99/mo</p>
                      <p ref={set('price')} className="absolute inset-0 telemetry text-[12px]" style={{ opacity: 0, color: 'var(--color-em-400)' }}>Your price: $299/mo</p>
                    </div>
                  </div>
                </div>

                {/* 2: VoiceAI Connect (the wordmark dissolves when the agency paints) */}
                <div ref={set('s1')} className="wls-slab" style={{ opacity: 0 }}>
                  <div className="flex items-center justify-between gap-6">
                    <div className="min-w-0">
                      <p className="telemetry text-[11px] uppercase">Platform</p>
                      <div className="relative h-8 mt-2">
                        <p ref={set('platformMark')} className="absolute inset-0 font-display text-[19px] text-white font-medium whitespace-nowrap">VoiceAI Connect</p>
                        <p ref={set('platformGone')} className="absolute inset-0 font-display text-[19px] font-medium whitespace-nowrap" style={{ opacity: 0, color: 'var(--steel-700)' }}>Invisible to your clients</p>
                      </div>
                    </div>
                    <p className="telemetry text-[12px] text-right flex-shrink-0 max-w-[220px] leading-relaxed">Onboarding, billing, dashboards, the receptionist</p>
                  </div>
                </div>

                {/* 1: Infrastructure (the foundation) */}
                <div ref={set('s0')} className="wls-slab" style={{ opacity: 0 }}>
                  <p className="telemetry text-[11px] uppercase">Infrastructure</p>
                  <p ref={set('vendors')} className="telemetry text-[12px] mt-3 leading-[1.9]" style={{ color: 'var(--steel-500)' }}>
                    {VENDORS.join(' · ')}
                  </p>
                </div>
              </div>

              {/* Light sheen across the pile */}
              <div className="wls-sheen-clip" aria-hidden>
                <div ref={set('sheen')} className="wls-sheen" style={{ transform: 'translateX(-60%) skewX(-18deg)' }} />
              </div>

              {/* Flows revealed on pull-back. Hairlines draw themselves. No glyphs. */}
              <div ref={set('flows')} className="absolute -left-4 top-2 bottom-2 hidden xl:flex flex-col justify-between py-8" style={{ opacity: 0 }}>
                <div className="flex items-center gap-3">
                  <span ref={set('flowA')} className="block w-12 h-px origin-left" style={{ background: 'var(--color-em-400)', transform: 'scaleX(0)' }} />
                  <span className="telemetry text-[11px] uppercase" style={{ color: 'var(--color-em-400)' }}>Money flows up</span>
                </div>
                <div className="flex items-center gap-3">
                  <span ref={set('flowB')} className="block w-12 h-px origin-left" style={{ background: 'var(--steel-500)', transform: 'scaleX(0)' }} />
                  <span className="telemetry text-[11px] uppercase">Brand flows down</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress rail */}
          <div className="absolute left-0 right-0 bottom-0 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div ref={set('rail')} className="h-full origin-left" style={{ transform: 'scaleX(0)', background: 'var(--color-em-400)' }} />
          </div>
        </div>
      </div>

      {/* ───────── Static (mobile, reduced motion). Same content, no pin. ───────── */}
      <div className="wls-static">
        <div className="space-y-4">
          {[
            { t: 'End business', d: 'Their phone gets answered around the clock and appointments get booked. They only ever see you.' },
            { t: 'Your agency', d: 'Your brand, your domain, your price. You buy the platform at your cost and sell it at your price.' },
            { t: 'VoiceAI Connect', d: 'One platform: onboarding, billing, dashboards, the receptionist. Invisible to your clients.' },
            { t: 'Infrastructure', d: VENDORS.join(', ') + '. Sixteen vendors, run for you, never your problem.' },
          ].map((l) => (
            <div key={l.t} className="wls-slab">
              <p className="telemetry text-[11px] uppercase">{l.t}</p>
              <p className="text-[14px] mt-2 leading-relaxed" style={{ color: 'var(--steel-300)' }}>{l.d}</p>
            </div>
          ))}
        </div>
        <p className="telemetry text-[11px] mt-6" style={{ color: 'var(--steel-500)' }}>Revenue flows up to you. Your brand flows down to your clients. Everything underneath, we run.</p>
      </div>
    </>
  );
}