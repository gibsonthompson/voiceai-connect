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
 *  - Only transform and opacity are animated. Both are compositor properties,
 *    so nothing repaints or re-lays-out per frame.
 *  - Direct style writes via refs, so React never re-renders per frame.
 *  - Native CSS scroll-timelines were considered, but Firefox still gates them
 *    behind a flag (~1 in 6 visitors), so the JS driver is the universal base.
 *  - Under 1024px or with prefers-reduced-motion, a static labeled diagram
 *    renders instead. Same text, no pin, no motion.
 *
 * Easing is restrained on purpose (cubic settle, no overshoot). Precision,
 * not bounce.
 */

import { useEffect, useRef } from 'react';
import { Phone, Calendar, Check } from 'lucide-react';

const VENDORS = [
  'Anthropic', 'ElevenLabs', 'Deepgram', 'OpenAI', 'Telnyx', 'Twilio', 'Stripe', 'Supabase',
  'Google', 'Vercel', 'Cloudflare', 'Sentry', 'PostHog', 'Brevo', 'Make', 'n8n',
];

const BEATS = [
  { k: 'Sixteen enterprise vendors.', s: 'The foundation. Raw capability, unbranded, and complex. This is what VoiceAI Connect stands on.' },
  { k: 'One platform. The complexity disappears.', s: 'VoiceAI Connect turns sixteen vendors into one clean, brandable product: onboarding, billing, dashboards, the receptionist itself.' },
  { k: 'Your brand. Your pricing. Your margin.', s: 'You paint it. Your logo, your domain, your price. VoiceAI Connect disappears from the surface your clients see.' },
  { k: 'Their phone gets answered.', s: 'The business you sign up sees only you. Calls answered around the clock, appointments booked while they work.' },
  { k: 'That is the whole business. You own the middle.', s: 'Money flows up to you. Your brand flows down to them. The infrastructure underneath is never your problem.' },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const eo = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic: settles, never bounces
// visible window: fade in a..b, hold b..c, fade out c..d
const win = (p: number, a: number, b: number, c: number, d: number) =>
  p < a ? 0 : p < b ? eo(seg(p, a, b)) : p < c ? 1 : p < d ? 1 - eo(seg(p, c, d)) : 0;

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

    const drop = (el: HTMLElement | null, t: number) => {
      if (!el) return;
      const e = eo(t);
      el.style.opacity = String(e);
      el.style.transform = `translateY(${(1 - e) * -72}px) scale(${0.97 + 0.03 * e})`;
    };
    const fade = (el: HTMLElement | null, o: number) => { if (el) el.style.opacity = String(o); };

    const apply = (p: number) => {
      const r = refs.current;

      // Beat headlines crossfade
      fade(r.l0, win(p, 0.00, 0.03, 0.18, 0.25));
      fade(r.l1, win(p, 0.22, 0.29, 0.42, 0.49));
      fade(r.l2, win(p, 0.46, 0.53, 0.70, 0.77));
      fade(r.l3, win(p, 0.72, 0.79, 0.86, 0.92));
      fade(r.l4, win(p, 0.90, 0.97, 1.01, 1.02));

      // Slabs drop in, one per beat
      drop(r.s0, seg(p, 0.02, 0.20));
      drop(r.s1, seg(p, 0.24, 0.42));
      drop(r.s2, seg(p, 0.46, 0.60));
      drop(r.s3, seg(p, 0.72, 0.84));

      // Foundation dims and its vendor names fade once the platform is on top
      const dim = eo(seg(p, 0.30, 0.44));
      if (r.s0 && p > 0.24) r.s0.style.opacity = String(1 - 0.45 * dim);
      fade(r.vendors, 1 - dim);

      // The white-label swap: teal paints the agency slab while the platform wordmark dissolves
      const wash = eo(seg(p, 0.54, 0.70));
      if (r.wash) r.wash.style.transform = `scaleX(${wash})`;
      fade(r.platformMark, 1 - eo(seg(p, 0.56, 0.66)));
      fade(r.platformGone, eo(seg(p, 0.60, 0.70)));
      fade(r.agencyName, eo(seg(p, 0.60, 0.70)));
      fade(r.agencyDim, 1 - eo(seg(p, 0.56, 0.66)));
      // Price flips from your cost to your price
      fade(r.cost, 1 - eo(seg(p, 0.64, 0.74)));
      fade(r.price, eo(seg(p, 0.64, 0.74)));

      // End business: phone pulses, gets answered, calendar fills
      const ring = seg(p, 0.76, 0.86);
      if (r.phone) r.phone.style.transform = `scale(${1 + 0.06 * Math.sin(ring * Math.PI * 3) * (1 - eo(seg(p, 0.84, 0.88)))})`;
      fade(r.ringing, 1 - eo(seg(p, 0.82, 0.88)));
      fade(r.answered, eo(seg(p, 0.82, 0.88)));
      const cal = eo(seg(p, 0.84, 0.90));
      if (r.cal) { r.cal.style.opacity = String(cal); r.cal.style.transform = `scale(${0.9 + 0.1 * cal})`; }

      // Pull back: the whole stack eases out to reveal the flows
      const back = eo(seg(p, 0.88, 1.0));
      if (r.stack) r.stack.style.transform = `perspective(1400px) rotateX(${8 - 4 * back}deg) scale(${1 - 0.1 * back}) translateY(${-8 * back}px)`;
      fade(r.flows, back);

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

  const slab = 'wls-slab';

  return (
    <>
      {/* ───────── Animated (desktop, motion allowed) ───────── */}
      <div ref={wrapRef} className="wls-anim relative" style={{ height: '400vh' }}>
        <div className="sticky top-0 h-screen overflow-hidden flex items-center">
          <div className="w-full grid lg:grid-cols-12 gap-12 items-center">

            {/* Beat copy (left). All five are in the DOM; they crossfade. */}
            <div className="lg:col-span-5 relative min-h-[220px]">
              {BEATS.map((b, i) => (
                <div key={b.k} ref={set(`l${i}`)} className="absolute inset-x-0 top-0" style={{ opacity: i === 0 ? 1 : 0 }}>
                  <span className="racing-line" />
                  <h3 className="font-display text-[28px] lg:text-[36px] font-medium text-white leading-[1.05] tracking-tight">{b.k}</h3>
                  <p className="t-body mt-5 max-w-md">{b.s}</p>
                </div>
              ))}
            </div>

            {/* The stack (right) */}
            <div className="lg:col-span-7 relative">
              <div ref={set('stack')} className="wls-stack" style={{ transform: 'perspective(1400px) rotateX(8deg)' }}>

                {/* 4: End business (top of the pile) */}
                <div ref={set('s3')} className={slab} style={{ opacity: 0 }}>
                  <div className="flex items-center gap-4">
                    <div ref={set('phone')} className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,227,170,0.1)', border: '1px solid rgba(0,227,170,0.25)' }}>
                      <Phone className="w-5 h-5 text-em" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="telemetry text-[10px] uppercase">End business</p>
                      <div className="relative h-6 mt-1">
                        <p ref={set('ringing')} className="absolute inset-0 font-display text-[15px] text-white font-medium">Incoming call, ringing</p>
                        <p ref={set('answered')} className="absolute inset-0 font-display text-[15px] text-white font-medium" style={{ opacity: 0 }}>Answered. Job booked.</p>
                      </div>
                    </div>
                    <div ref={set('cal')} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ opacity: 0, borderColor: 'rgba(0,227,170,0.25)', background: 'rgba(0,227,170,0.06)' }}>
                      <Calendar className="w-3.5 h-3.5 text-em" />
                      <span className="telemetry text-[10px]">Thu 2:00 PM</span>
                      <Check className="w-3.5 h-3.5 text-em" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                {/* 3: Your agency (paints teal) */}
                <div ref={set('s2')} className={`${slab} relative overflow-hidden`} style={{ opacity: 0 }}>
                  <div ref={set('wash')} className="absolute inset-0 origin-left" style={{ transform: 'scaleX(0)', background: 'linear-gradient(90deg, rgba(0,227,170,0.16), rgba(0,227,170,0.05))' }} />
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: 'var(--color-em-400)' }} />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="telemetry text-[10px] uppercase">Your agency</p>
                      <div className="relative h-7 mt-1">
                        <p ref={set('agencyDim')} className="absolute inset-0 font-display text-[17px] font-medium" style={{ color: 'var(--steel-500)' }}>Unbranded, waiting for you</p>
                        <p ref={set('agencyName')} className="absolute inset-0 font-display text-[17px] text-white font-medium" style={{ opacity: 0 }}>Your Brand <span className="telemetry text-[11px] ml-2" style={{ color: 'var(--steel-300)' }}>your-brand.com</span></p>
                      </div>
                    </div>
                    <div className="relative h-10 w-[150px] text-right">
                      <p ref={set('cost')} className="absolute inset-0 telemetry text-[11px]">Your cost: $99/mo</p>
                      <p ref={set('price')} className="absolute inset-0 telemetry text-[11px]" style={{ opacity: 0, color: 'var(--color-em-400)' }}>Your price: $299/mo</p>
                    </div>
                  </div>
                </div>

                {/* 2: VoiceAI Connect (the wordmark dissolves when the agency paints) */}
                <div ref={set('s1')} className={slab} style={{ opacity: 0 }}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="telemetry text-[10px] uppercase">Platform</p>
                      <div className="relative h-7 mt-1">
                        <p ref={set('platformMark')} className="absolute inset-0 font-display text-[17px] text-white font-medium">VoiceAI Connect</p>
                        <p ref={set('platformGone')} className="absolute inset-0 font-display text-[17px] font-medium" style={{ opacity: 0, color: 'var(--steel-700)' }}>Invisible to your clients</p>
                      </div>
                    </div>
                    <p className="telemetry text-[11px] text-right">Onboarding, billing, dashboards, receptionist</p>
                  </div>
                </div>

                {/* 1: Infrastructure (the foundation) */}
                <div ref={set('s0')} className={slab} style={{ opacity: 0 }}>
                  <p className="telemetry text-[10px] uppercase">Infrastructure</p>
                  <p ref={set('vendors')} className="telemetry text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--steel-500)' }}>
                    {VENDORS.join(' · ')}
                  </p>
                </div>
              </div>

              {/* Flows revealed on pull-back. Text and hairlines, no glyphs. */}
              <div ref={set('flows')} className="absolute -left-2 top-0 bottom-0 hidden xl:flex flex-col justify-between py-6" style={{ opacity: 0 }}>
                <div className="flex items-center gap-3">
                  <span className="block w-8 h-px" style={{ background: 'var(--color-em-400)' }} />
                  <span className="telemetry text-[10px] uppercase" style={{ color: 'var(--color-em-400)' }}>Money flows up</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="block w-8 h-px" style={{ background: 'var(--steel-500)' }} />
                  <span className="telemetry text-[10px] uppercase">Brand flows down</span>
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
        <div className="space-y-3">
          {[
            { t: 'End business', d: 'Their phone gets answered around the clock and appointments get booked. They only ever see you.' },
            { t: 'Your agency', d: 'Your brand, your domain, your price. You buy the platform at your cost and sell it at your price.' },
            { t: 'VoiceAI Connect', d: 'One platform: onboarding, billing, dashboards, the receptionist. Invisible to your clients.' },
            { t: 'Infrastructure', d: VENDORS.join(', ') + '. Sixteen vendors, run for you, never your problem.' },
          ].map((l) => (
            <div key={l.t} className="wls-slab">
              <p className="telemetry text-[10px] uppercase">{l.t}</p>
              <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: 'var(--steel-300)' }}>{l.d}</p>
            </div>
          ))}
        </div>
        <p className="telemetry text-[11px] mt-5" style={{ color: 'var(--steel-500)' }}>Money flows up to you. Brand flows down to them.</p>
      </div>
    </>
  );
}