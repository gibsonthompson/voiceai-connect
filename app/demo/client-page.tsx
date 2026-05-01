'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, Clock, Video } from 'lucide-react';
import MarketingFooter from '@/components/marketing-footer';

export default function DemoPage() {
  // Load Calendly widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      const existing = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <main className="min-h-screen bg-ink">
      {/* ════════ THIN BOOKING NAV ════════ */}
      <nav className="relative z-10 border-b border-white/[0.05] bg-black/40 backdrop-blur-xl">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/interactive-demo" className="flex items-center gap-2.5 group">
            <img src="/icon-512x512.png" alt="VoiceAI Connect" className="w-8 h-8 rounded-md" />
            <span className="font-display font-medium text-[15px] text-white tracking-tight">VoiceAI Connect</span>
          </Link>
          <Link
            href="/interactive-demo"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-white/55 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to interactive demo</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section className="canvas-dot relative pt-16 lg:pt-24 pb-10 lg:pb-14 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div className="max-w-3xl mx-auto text-center">
            <p className="t-eyebrow text-em mb-6">Schedule a call</p>
            <h1 className="font-display font-medium text-white tracking-tight" style={{ fontSize: 'clamp(2rem, 4.2vw, 3.5rem)', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
              Have questions? Let&apos;s talk.
            </h1>
            <p className="t-body mt-6 max-w-xl mx-auto">
              Bring your questions about pricing, white-labeling, integrations, or the agency model. We&apos;ll bring honest answers — and walk through the platform live if it&apos;s useful.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                style={{ background: 'rgba(74, 234, 188, 0.08)', border: '1px solid rgba(74, 234, 188, 0.22)' }}
              >
                <Clock className="w-3.5 h-3.5 text-em" />
                <span className="font-mono text-[11px] tracking-[0.06em] text-em">30 Minutes</span>
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
              >
                <Video className="w-3.5 h-3.5 text-white/70" />
                <span className="font-mono text-[11px] tracking-[0.06em] text-white/70">Google Meet</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ CALENDLY EMBED ════════ */}
      <section className="bg-ink pb-16 lg:pb-24">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-6 lg:px-10">
          <div
            className="relative rounded-xl lg:rounded-2xl border border-white/[0.08] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
            style={{ background: 'linear-gradient(180deg, rgba(20,20,20,0.5), rgba(8,8,8,0.7))' }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(74, 234, 188, 0.04), transparent 60%)' }}
            />
            <div
              className="calendly-inline-widget relative"
              data-url="https://calendly.com/gibsonthompson1/30min?hide_gdpr_banner=1&background_color=0a0a0a&text_color=fafaf9&primary_color=10b981"
              style={{ minWidth: '320px', height: '700px' }}
            />
          </div>

          <p className="mt-8 text-center font-mono text-[11.5px] text-white/35">
            Can&apos;t find a time?{' '}
            <a
              href="mailto:support@myvoiceaiconnect.com"
              className="text-em underline-offset-4 hover:underline"
            >
              Email us directly
            </a>
            {' '}— a person reads it.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
