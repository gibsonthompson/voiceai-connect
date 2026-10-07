'use client';

// ============================================================================
// MARKETING KIT (Phase 1)
//
// Auto-branded, downloadable assets an agency hands out to land their first
// clients: QR codes (call the demo, sign up, visit site), a print-ready
// one-pager, and ready-to-send scripts. Everything is branded from the agency's
// existing logo / colors / demo number, no setup required.
//
// Lives in the get-clients area (linked from Outreach + a dashboard button).
// QR images come from a public QR endpoint for now; we can move generation
// in-house (reusing the Puppeteer render service) in a later phase.
// ============================================================================

import { useState } from 'react';
import Link from 'next/link';
import {
  Megaphone, QrCode, Download, Copy, Check, Phone, ExternalLink,
  Printer, Sparkles, ArrowLeft, Loader2, Calculator, ChevronRight,
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

// Public QR image. encodeURIComponent so tel: URIs and query strings survive.
function qrImg(data: string, size = 600): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(data)}`;
}

export default function MarketingKitPage() {
  const { agency, branding, loading } = useAgency();
  const theme = useTheme();
  const [copied, setCopied] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  if (loading || !agency) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const name = branding.name || agency.name || 'Your Agency';
  const primary = branding.primaryColor || '#10b981';
  const logoUrl = branding.logoUrl || agency.logo_url || null;
  const demo = agency.demo_phone_number || null;

  const base = agency.marketing_domain && agency.domain_verified
    ? `https://${agency.marketing_domain}`
    : `https://${agency.slug}.${PLATFORM_DOMAIN}`;
  const signupUrl = `${base}/signup`;
  const siteUrl = base;

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch { /* clipboard blocked */ }
  };

  // Try a real file download; fall back to opening the image if the host blocks
  // cross-origin fetch, so the user can still right-click and save.
  const downloadQr = async (key: string, data: string, filename: string) => {
    setDownloading(key);
    try {
      const res = await fetch(qrImg(data, 1000));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrImg(data, 1000), '_blank');
    } finally {
      setDownloading((d) => (d === key ? null : d));
    }
  };

  const smsScript = demo
    ? `Hey, quick one. Call ${demo} and tell it what your business does. It's an AI receptionist that'll answer your phones 24/7 and even book jobs. Took me 2 minutes to set up. Curious what you think.`
    : `Hey, quick one. I set up an AI receptionist that answers your phones 24/7 and books jobs for you. Want me to send you a link to try it free?`;

  const emailScript = `Subject: Never miss another call

Hi [First Name],

Most ${'{trade}'} businesses lose real money to missed and after-hours calls. I set up an AI receptionist that answers every call 24/7, sounds natural, and books jobs straight onto your calendar.

${demo ? `Want to hear it? Call ${demo} and tell it what your business does, it'll answer as your receptionist on the spot.\n\n` : ''}If you like it, you can be live in about a day: ${signupUrl}

Worth a 2-minute call?

- ${name}`;

  const qrCards = [
    demo ? { key: 'demo', label: 'Call the live demo', sub: 'They scan, call, and hear the AI answer.', data: telHref(demo), caption: demo } : null,
    { key: 'signup', label: 'Sign up', sub: 'Scan to start a free trial.', data: signupUrl, caption: signupUrl.replace(/^https?:\/\//, '') },
    { key: 'site', label: 'Visit website', sub: 'Scan to open your marketing site.', data: siteUrl, caption: siteUrl.replace(/^https?:\/\//, '') },
  ].filter(Boolean) as { key: string; label: string; sub: string; data: string; caption: string }[];

  const cardStyle: React.CSSProperties = { backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16 };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px]">
      {/* Print styles: when printing, show only the one-pager. */}
      <style>{`@media print { body * { visibility: hidden !important; } #mk-onepager, #mk-onepager * { visibility: visible !important; } #mk-onepager { position: absolute !important; inset: 0 !important; margin: 0 !important; width: 100% !important; box-shadow: none !important; border: none !important; } @page { margin: 0.5in; } }`}</style>

      <Link href="/agency/outreach" className="inline-flex items-center gap-2 text-sm mb-4 transition-colors" style={{ color: theme.textMuted }}>
        <ArrowLeft className="h-4 w-4" /> Back to Outreach
      </Link>

      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.primary15 }}>
          <Megaphone className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Marketing Kit</h1>
          <p className="mt-0.5 text-sm" style={{ color: theme.textMuted }}>Branded assets to hand out and land your first clients. Everything below uses your logo, colors, and demo number automatically.</p>
        </div>
      </div>

      {!demo && (
        <div className="mb-6 rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
          <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.warningText }} />
          <p className="text-[13px]" style={{ color: theme.warningText }}>You don&apos;t have a demo number yet. Set one up to unlock the strongest asset, a QR that lets a prospect call and hear your AI answer. The signup and website assets below still work.</p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {demo && (
          <div className="p-4" style={cardStyle}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Demo number</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-bold" style={{ color: theme.text }}>{demo}</span>
              <button onClick={() => copy('demo-num', demo)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: copied === 'demo-num' ? theme.primary : theme.textMuted }}>{copied === 'demo-num' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === 'demo-num' ? 'Copied' : 'Copy'}</button>
            </div>
          </div>
        )}
        <div className="p-4" style={cardStyle}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Signup link</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate" style={{ color: theme.text }}>{signupUrl.replace(/^https?:\/\//, '')}</span>
            <button onClick={() => copy('signup', signupUrl)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium flex-shrink-0" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: copied === 'signup' ? theme.primary : theme.textMuted }}>{copied === 'signup' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === 'signup' ? 'Copied' : 'Copy'}</button>
          </div>
        </div>
      </div>

      {/* Tools */}
      <Link href="/agency/marketing-kit/calculator" className="flex items-center justify-between gap-3 rounded-xl p-4 mb-8 transition-colors" style={cardStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.hover)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.card)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Calculator className="h-5 w-5" style={{ color: theme.primary }} /></div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold" style={{ color: theme.text }}>Missed-Call Revenue Calculator</h3>
            <p className="text-xs truncate" style={{ color: theme.textMuted }}>Show a prospect what missed calls cost them, then print a branded result sheet.</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 flex-shrink-0" style={{ color: theme.textMuted }} />
      </Link>

      {/* QR codes */}
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="h-4 w-4" style={{ color: theme.primary }} />
        <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>QR codes</h2>
      </div>
      <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Download and drop these on cards, flyers, or signs. Each one is ready to print.</p>
      <div className="grid gap-4 mb-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {qrCards.map((c) => (
          <div key={c.key} className="p-5 flex flex-col items-center text-center" style={cardStyle}>
            <div style={{ background: '#fff', padding: 10, borderRadius: 12, border: `1px solid ${theme.border}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImg(c.data, 300)} alt={`${c.label} QR code`} width={160} height={160} style={{ display: 'block', width: 160, height: 160 }} />
            </div>
            <h3 className="text-sm font-semibold mt-4" style={{ color: theme.text }}>{c.label}</h3>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>{c.sub}</p>
            <p className="text-[11px] mt-1 font-mono truncate max-w-full" style={{ color: theme.textMuted }}>{c.caption}</p>
            <button onClick={() => downloadQr(c.key, c.data, `${agency.slug || 'agency'}-${c.key}-qr.png`)} disabled={downloading === c.key}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: primary }}>
              {downloading === c.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download PNG
            </button>
          </div>
        ))}
      </div>

      {/* One-pager */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: theme.primary }} />
          <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Printable one-pager</h2>
        </div>
        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: primary }}>
          <Printer className="h-4 w-4" /> Download / Print
        </button>
      </div>
      <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Hand this to a prospect or leave it behind. Click Download / Print and choose &ldquo;Save as PDF.&rdquo;</p>

      <div id="mk-onepager" style={{ background: '#ffffff', color: '#111827', border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden', maxWidth: 820 }}>
        <div style={{ background: primary, color: '#fff', padding: '28px 36px', display: 'flex', alignItems: 'center', gap: 16 }}>
          {logoUrl
            ? <img src={logoUrl} alt={name} style={{ height: 44, maxWidth: 220, objectFit: 'contain' }} />
            : <span style={{ fontSize: 24, fontWeight: 800 }}>{name}</span>}
        </div>
        <div style={{ padding: '36px' }}>
          <h3 style={{ fontSize: 34, lineHeight: 1.1, margin: 0, fontWeight: 800, color: '#0f172a' }}>Never miss another call.</h3>
          <p style={{ fontSize: 17, color: '#475569', marginTop: 14, lineHeight: 1.6 }}>
            An AI receptionist that answers every call 24/7, sounds natural, handles questions, and books jobs straight onto your calendar. Set up in about a day.
          </p>
          <ul style={{ margin: '22px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
            {['Answers 24/7, even after hours and weekends', 'Books appointments and captures every lead', 'Sounds like a real receptionist, not a robot'].map((b) => (
              <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, color: '#1f2937' }}>
                <span style={{ width: 20, height: 20, borderRadius: 999, background: primary, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>✓</span>
                {b}
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 30, alignItems: 'center' }}>
            {demo && (
              <div style={{ textAlign: 'center' }}>
                <img src={qrImg(telHref(demo), 300)} alt="Call the demo" width={130} height={130} style={{ display: 'block', width: 130, height: 130, border: '1px solid #e5e7eb', borderRadius: 10, padding: 6, background: '#fff' }} />
                <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Scan to hear it answer</p>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <img src={qrImg(signupUrl, 300)} alt="Sign up" width={130} height={130} style={{ display: 'block', width: 130, height: 130, border: '1px solid #e5e7eb', borderRadius: 10, padding: 6, background: '#fff' }} />
              <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Scan to get started</p>
            </div>
            {demo && (
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>Hear it live</p>
                <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: primary }}>{demo}</p>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#475569' }}>Call and tell it what your business does.</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e5e7eb', fontSize: 14, color: '#475569' }}>
            <strong style={{ color: '#0f172a' }}>{name}</strong>
            {agency.phone ? ` · ${agency.phone}` : ''} · {signupUrl.replace(/^https?:\/\//, '')}
          </div>
        </div>
      </div>

      {/* Scripts */}
      <div className="flex items-center gap-2 mt-10 mb-3">
        <Megaphone className="h-4 w-4" style={{ color: theme.primary }} />
        <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Ready-to-send scripts</h2>
      </div>
      <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Copy, tweak the bracketed bits, and send. For more, see your <Link href="/agency/outreach" className="underline" style={{ color: theme.primary }}>Outreach templates</Link>.</p>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {[{ key: 'sms', label: 'Text message', body: smsScript }, { key: 'email', label: 'Email', body: emailScript }].map((s) => (
          <div key={s.key} className="p-4" style={cardStyle}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>{s.label}</span>
              <button onClick={() => copy(s.key, s.body)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: copied === s.key ? theme.primary : theme.textMuted }}>{copied === s.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === s.key ? 'Copied' : 'Copy'}</button>
            </div>
            <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: theme.text, opacity: 0.85 }}>{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: theme.primary }}>
          <ExternalLink className="h-4 w-4" /> Preview your marketing site
        </a>
      </div>
    </div>
  );
}