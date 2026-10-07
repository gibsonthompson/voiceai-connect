'use client';

// ============================================================================
// ADMIN: Sample Sites launcher (admin-only entry point).
//
// The sample business sites at /sample-site/<slug> are intentionally PUBLIC so
// the scraper (Jina) can fetch them, but they are unlisted everywhere agencies
// or clients can see. This admin-only page is the private launcher: open one to
// screen-share in a demo, or copy its URL to paste into a client's website
// field to test scraping.
// ============================================================================

import { useState } from 'react';
import { ExternalLink, Copy, Check, Globe } from 'lucide-react';
import { SAMPLE_SITES } from '@/lib/sample-sites';

export default function AdminSampleSitesPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const urlFor = (slug: string) => `${origin}/sample-site/${slug}`;

  const copy = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(urlFor(slug));
      setCopied(slug);
      setTimeout(() => setCopied((c) => (c === slug ? null : c)), 1800);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1100px]">
      <div className="flex items-center gap-2 mb-1">
        <Globe className="h-5 w-5 text-[var(--a-em-deep)]" />
        <h1 className="text-xl font-semibold text-[var(--a-ink)]">Sample Sites</h1>
      </div>
      <p className="text-sm text-[var(--a-muted)] mb-5 max-w-[680px]">
        Realistic demo business websites for screen-sharing in a video or testing the scraper. Each one is a full public page with services, hours, staff, service area, and contact info. Open one to demo it, or copy its URL and paste it into a client&apos;s website field to watch the knowledge base build.
      </p>

      <div className="mb-6 rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ background: 'var(--a-em-soft)', border: '1px solid var(--a-em-line)' }}>
        <Globe className="h-4 w-4 mt-0.5 shrink-0 text-[var(--a-em-deep)]" />
        <p className="text-[13px] text-[var(--a-ink)]">
          These pages are public so the scraper can reach them, but nothing links to them outside this admin page, so agencies and clients never see them.
        </p>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {SAMPLE_SITES.map((s) => (
          <div key={s.slug} className="rounded-2xl p-4" style={{ background: 'var(--a-card)', border: '1px solid var(--a-line)' }}>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-white shrink-0" style={{ background: s.accent }}>{s.name.charAt(0)}</div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: s.accent }}>{s.industry}</p>
                <h2 className="text-[15px] font-semibold text-[var(--a-ink)] truncate">{s.name}</h2>
              </div>
            </div>
            <p className="text-[12px] text-[var(--a-dim)] mt-2 font-mono truncate">/sample-site/{s.slug}</p>
            <div className="flex items-center gap-2 mt-3">
              <a href={urlFor(s.slug)} target="_blank" rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--a-em-deep)' }}>
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </a>
              <button onClick={() => copy(s.slug)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                style={{ background: 'var(--a-bg)', border: '1px solid var(--a-line)', color: copied === s.slug ? 'var(--a-em-deep)' : 'var(--a-muted)' }}>
                {copied === s.slug ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy URL</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}