'use client';

// ============================================================================
// COMPARISON PAGE: one shared, data-driven template for every "VoiceAI Connect
// vs X" page. Uses the real marketing nav and footer, the paper/display/emerald
// design system, and pulls VoiceAI Connect pricing from VAC_PRICING via usePrice
// so numbers are local-currency correct and can never drift page to page.
// ============================================================================

import Link from 'next/link';
import { Check, X, ArrowUpRight } from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';
import { usePrice } from '@/hooks/usePrice';
import { Competitor, VAC_PRICING } from '@/lib/comparison-data';

function Cell({ good, text }: { good: boolean; text: string }) {
  return (
    <div className="flex items-start gap-2">
      {good ? (
        <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-em" />
      ) : (
        <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-black/25" />
      )}
      <span className="text-[13px] leading-snug text-black/70">{text}</span>
    </div>
  );
}

export default function ComparisonPage({ data }: { data: Competitor }) {
  const { formatPrice } = usePrice();

  const tiers = [
    { ...VAC_PRICING.free, highlight: false, blurb: 'Dashboard, clients, leads, demo line. Pay only per active client.' },
    { ...VAC_PRICING.pro, highlight: true, blurb: 'Full white-label, custom domain, marketing site, branded demo line.' },
    { ...VAC_PRICING.scale, highlight: false, blurb: 'Everything, no per-client fee, AI Lab, industry templates, API.' },
  ];

  return (
    <div className="bg-black">
      <MarketingNav />

      {/* HERO */}
      <section className="relative bg-black text-white pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-2 text-[12px] text-white/40 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/70">vs {data.name}</span>
          </div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-em mb-5">COMPARISON</p>
          <h1 className="font-display text-[40px] sm:text-[56px] lg:text-[72px] font-medium tracking-tight leading-[1.05] max-w-4xl">
            VoiceAI Connect <span className="text-white/40">vs</span> {data.name}
          </h1>
          <p className="mt-7 text-[17px] sm:text-[19px] text-white/70 leading-relaxed max-w-3xl">
            {data.heroSub}
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link href="/signup" className="btn btn-em justify-center sm:justify-start">
              Start Your Free Trial <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link href="/#pricing" className="btn btn-ghost-dark justify-center sm:justify-start">
              See Pricing
            </Link>
          </div>
          <p className="mt-6 text-[12px] text-white/35">Updated {data.updated}</p>
        </div>
      </section>

      {/* AT A GLANCE */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <h2 className="font-display text-[28px] sm:text-[36px] font-medium tracking-tight text-black text-center">
            The Short Version
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 gap-5">
            <div className="rounded-2xl p-7 border-2 border-em-400/30 bg-em-400/[0.04]">
              <p className="font-mono text-[10px] tracking-[0.16em] text-em-deep mb-3">VOICEAI CONNECT</p>
              <p className="text-[15px] text-black/75 leading-relaxed">{data.whatVac}</p>
              <div className="mt-5 pt-5 border-t border-black/[0.08]">
                <p className="text-[12px] text-black/45 mb-1">Best for</p>
                <p className="text-[14px] text-black/80 font-medium leading-snug">{data.vacBestFor}</p>
              </div>
            </div>
            <div className="rounded-2xl p-7 border border-black/[0.1] bg-white">
              <p className="font-mono text-[10px] tracking-[0.16em] text-black/40 mb-3">{data.name.toUpperCase()}</p>
              <p className="text-[15px] text-black/75 leading-relaxed">{data.whatThem}</p>
              <div className="mt-5 pt-5 border-t border-black/[0.08]">
                <p className="text-[12px] text-black/45 mb-1">Best for</p>
                <p className="text-[14px] text-black/80 font-medium leading-snug">{data.themBestFor}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="bg-paper-soft py-20 lg:py-28">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <h2 className="font-display text-[28px] sm:text-[36px] font-medium tracking-tight text-black text-center">
            Feature by Feature
          </h2>
          <div className="mt-12 rounded-2xl overflow-hidden border border-black/[0.08] bg-white">
            {/* header (sm and up) */}
            <div className="hidden sm:grid sm:grid-cols-[1.5fr_1fr_1fr] bg-black text-white">
              <div className="px-5 py-4 text-[12px] font-medium text-white/60">Feature</div>
              <div className="px-5 py-4 text-[13px] font-display font-medium bg-em-400/[0.14] text-white">VoiceAI Connect</div>
              <div className="px-5 py-4 text-[13px] font-display font-medium text-white/80">{data.name}</div>
            </div>
            {data.rows.map((r, i) => (
              <div
                key={r.label}
                className={`grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr] ${i % 2 ? 'bg-black/[0.015]' : 'bg-white'} border-t border-black/[0.06]`}
              >
                <div className="px-5 pt-4 pb-1 sm:py-4 text-[13px] font-medium text-black/80">{r.label}</div>
                <div className="px-5 py-2 sm:py-4 sm:bg-em-400/[0.05]">
                  <span className="sm:hidden text-[11px] text-em-deep font-medium block mb-1">VoiceAI Connect</span>
                  <Cell good={r.vacGood !== false} text={r.vac} />
                </div>
                <div className="px-5 pt-2 pb-4 sm:py-4">
                  <span className="sm:hidden text-[11px] text-black/40 font-medium block mb-1">{data.name}</span>
                  <Cell good={r.themGood === true} text={r.them} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHICH SHOULD YOU CHOOSE */}
      <section className="bg-black text-white py-20 lg:py-28">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <h2 className="font-display text-[28px] sm:text-[36px] font-medium tracking-tight text-center">
            Which Should You Choose?
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 gap-5">
            <div className="rounded-2xl p-7 border border-white/[0.1] bg-white/[0.03]">
              <p className="font-display text-[18px] font-medium mb-3">Choose {data.name}</p>
              <p className="text-[15px] text-white/65 leading-relaxed">{data.chooseThem}</p>
            </div>
            <div className="rounded-2xl p-7 border-2 border-em-400/40 bg-em-400/[0.06]">
              <p className="font-display text-[18px] font-medium mb-3 text-white">Choose VoiceAI Connect</p>
              <p className="text-[15px] text-white/75 leading-relaxed">{data.chooseVac}</p>
            </div>
          </div>
        </div>
      </section>

      {/* VAC PRICING */}
      <section className="bg-paper-soft py-20 lg:py-28">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <h2 className="font-display text-[28px] sm:text-[36px] font-medium tracking-tight text-black text-center">
            VoiceAI Connect Pricing
          </h2>
          <p className="mt-4 text-center text-[15px] text-black/55 max-w-xl mx-auto">
            One flat platform fee. No revenue share, no holdbacks. You set and keep whatever you charge your clients.
          </p>
          <div className="mt-12 grid sm:grid-cols-3 gap-5">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`rounded-2xl p-7 flex flex-col ${t.highlight ? 'border-2 border-em-400/40 bg-white shadow-sm' : 'border border-black/[0.1] bg-white'}`}
              >
                {t.highlight && <p className="font-mono text-[10px] tracking-[0.16em] text-em-deep mb-3">MOST POPULAR</p>}
                <p className="font-display text-[15px] font-medium text-black">{t.name}</p>
                <p className="mt-3 font-display text-[40px] font-medium text-black tracking-tight leading-none t-numeric">
                  {t.platform === 0 ? formatPrice(0) : formatPrice(t.platform)}
                  <span className="text-[15px] text-black/40 font-normal">/mo</span>
                </p>
                <p className="mt-3 text-[13px] text-black/55 leading-relaxed">{t.blurb}</p>
                <div className="mt-5 pt-5 border-t border-black/[0.08] space-y-1.5 text-[13px] text-black/65">
                  <p>{t.perClient === 0 ? 'No per-client fee' : `${formatPrice(t.perClient)} per active client`}</p>
                  <p>{formatPrice(t.perMin)} per minute of voice</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[13px] text-black/45">
            Paid plans include a {VAC_PRICING.trialDays}-day free trial.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/signup" className="btn btn-em">
              Start Your Free Trial <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="max-w-[820px] mx-auto px-6 lg:px-10">
          <h2 className="font-display text-[28px] sm:text-[36px] font-medium tracking-tight text-black text-center">
            Common Questions
          </h2>
          <div className="mt-12 space-y-4">
            {data.faqs.map((f) => (
              <div key={f.q} className="rounded-2xl p-6 border border-black/[0.08] bg-white">
                <p className="font-display text-[16px] font-medium text-black leading-snug">{f.q}</p>
                <p className="mt-2 text-[14px] text-black/65 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-black text-white py-24 lg:py-32">
        <div className="max-w-[820px] mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display text-[32px] sm:text-[44px] font-medium tracking-tight leading-[1.1]">
            Start Selling AI Receptionists
          </h2>
          <p className="mt-5 text-[16px] text-white/65 leading-relaxed max-w-xl mx-auto">
            Not a course. Not a guru program. A real platform you brand as your own and sell to local businesses. Start free and add clients in under a minute.
          </p>
          <div className="mt-9 flex justify-center">
            <Link href="/signup" className="btn btn-em">
              Start Your Free Trial <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
