import type { Metadata } from 'next';
import Link from 'next/link';
import { SAMPLE_SITES } from '@/lib/sample-sites';

// Index of the reusable sample business sites. Pick an industry to open a full
// demo website you can scrape or screen-share in a video.
export const metadata: Metadata = {
  title: 'Sample Business Sites',
  description: 'Reusable demo websites per industry for testing scraping and for demos.',
};

export default function SampleSiteIndex() {
  return (
    <main style={{ minHeight: '100vh', background: '#f9fafb', color: '#111827', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 20px' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12, fontWeight: 700, color: '#2563eb', margin: 0 }}>Demo & scraping test</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, margin: '12px 0 0' }}>Sample business websites</h1>
        <p style={{ fontSize: 17, color: '#4b5563', marginTop: 14, maxWidth: 640 }}>
          Each link opens a full, realistic business site with services, hours, staff, service area, and contact info. Paste one into a client&apos;s website field to test scraping, or open it to screen-share in a demo.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginTop: 36 }}>
          {SAMPLE_SITES.map((s) => (
            <Link key={s.slug} href={`/sample-site/${s.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 22, height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: s.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{s.name.charAt(0)}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: s.accent }}>{s.industry}</span>
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: '14px 0 4px' }}>{s.name}</h2>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>{s.tagline}</p>
                <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 14 }}>/sample-site/{s.slug}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}