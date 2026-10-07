'use client';

// ============================================================================
// MARKETING KIT (Phase 1)
//
// Auto-branded, downloadable assets an agency hands out to land their first
// clients: QR codes (call the demo, sign up, visit site), a print-ready
// one-pager, a leave-behind, and a business card. Everything is branded from
// the agency's logo / colors / demo number, no setup required.
//
// Customize panel: the agency picks the material color and toggles which
// details (business name, demo number, contact phone, signup link) print on
// the materials. Choices are saved per agency (localStorage) so they stick and
// apply to every material here and any added later.
//
// Lives in the get-clients area (linked from Outreach + a dashboard button).
// QR images come from a public QR endpoint for now; we can move generation
// in-house (reusing the Puppeteer render service) in a later phase.
// ============================================================================

import { useState, useEffect, useRef } from 'react';
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

// Display a US number as (XXX) XXX-XXXX. Leaves anything that isn't a 10-digit
// (or 1 + 10) number untouched so international / short numbers aren't mangled.
function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return phone;
}

// Readable text color (dark or white) for a given background hex.
function getContrastColor(hex: string): string {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#0f172a' : '#ffffff';
  } catch { return '#ffffff'; }
}

// Public QR image. encodeURIComponent so tel: URIs and query strings survive.
function qrImg(data: string, size = 600): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(data)}`;
}

// Print only the element with the given id (hide everything else). Injected on
// demand and cleaned up after, so several printable pieces can share one page.
function printOnly(id: string) {
  const css = `@media print { body * { visibility: hidden !important; } #${id}, #${id} * { visibility: visible !important; } #${id} { position: absolute !important; inset: 0 !important; margin: 0 !important; width: 100% !important; box-shadow: none !important; border: none !important; } @page { margin: 0.5in; } }`;
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
  const cleanup = () => { try { el.remove(); } catch { /* ignore */ } window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(cleanup, 2000);
}

// Small on/off chip used in the Customize panel.
function ToggleChip({ label, on, onClick, theme }: { label: string; on: boolean; onClick: () => void; theme: any }) {
  return (
    <button onClick={onClick} type="button" className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
      style={{ backgroundColor: on ? theme.primary15 : theme.hover, border: `1px solid ${on ? theme.primary + '55' : theme.border}`, color: on ? theme.primary : theme.textMuted }}>
      <span>{label}</span>
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: on ? theme.primary : 'transparent', border: on ? 'none' : `1px solid ${theme.border}` }}>
        {on && <Check className="h-3 w-3" style={{ color: theme.primaryText || '#fff' }} />}
      </span>
    </button>
  );
}

export default function MarketingKitPage() {
  const { agency, branding, loading } = useAgency();
  const theme = useTheme();
  const [copied, setCopied] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Customize state. Defaults: show everything, color falls back to brand below.
  const [matColor, setMatColor] = useState<string>('');
  const [showBusinessName, setShowBusinessName] = useState(true);
  const [showDemoNumber, setShowDemoNumber] = useState(true);
  const [showSignupLink, setShowSignupLink] = useState(true);
  const [showContactPhone, setShowContactPhone] = useState(true);
  const skipSaveRef = useRef(true);

  const prefsKey = agency ? `mk_prefs_${agency.id}` : '';

  // Load saved prefs once the agency is known.
  useEffect(() => {
    if (!prefsKey) return;
    try {
      const raw = localStorage.getItem(prefsKey);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.matColor === 'string') setMatColor(p.matColor);
        if (typeof p.showBusinessName === 'boolean') setShowBusinessName(p.showBusinessName);
        if (typeof p.showDemoNumber === 'boolean') setShowDemoNumber(p.showDemoNumber);
        if (typeof p.showSignupLink === 'boolean') setShowSignupLink(p.showSignupLink);
        if (typeof p.showContactPhone === 'boolean') setShowContactPhone(p.showContactPhone);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsKey]);

  // Save on change (skip the initial mount so we never overwrite saved prefs
  // with defaults before they load).
  useEffect(() => {
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }
    if (!prefsKey) return;
    try { localStorage.setItem(prefsKey, JSON.stringify({ matColor, showBusinessName, showDemoNumber, showSignupLink, showContactPhone })); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matColor, showBusinessName, showDemoNumber, showSignupLink, showContactPhone]);

  if (loading || !agency) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const name = branding.name || agency.name || 'Your Agency';
  const primary = branding.primaryColor || '#10b981';
  const brandSecondary = branding.secondaryColor || null;
  const brandAccent = branding.accentColor || null;
  const logoUrl = branding.logoUrl || agency.logo_url || null;
  const demo = agency.demo_phone_number || null;
  const demoDisplay = formatPhone(demo);

  const base = agency.marketing_domain && agency.domain_verified
    ? `https://${agency.marketing_domain}`
    : `https://${agency.slug}.${PLATFORM_DOMAIN}`;
  const signupUrl = `${base}/signup`;
  const siteUrl = base;
  const calcUrl = `${base}/tools/missed-call-calculator`;

  // Material color (what prints on the assets) + readable text on top of it.
  const mat = /^#[0-9a-fA-F]{6}$/.test(matColor) ? matColor : primary;
  const matText = getContrastColor(mat);

  // Color swatches offered in the Customize panel: the agency's own brand
  // colors first, then a few neutral options, de-duped.
  const swatches = ([primary, brandSecondary, brandAccent, '#0f172a', '#334155', '#1e3a8a']
    .filter(Boolean) as string[])
    .filter((c, i, a) => a.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i);

  // Footer detail bits (everything except the business name, which renders bold).
  const contactBits = [
    showContactPhone && agency.phone ? formatPhone(agency.phone) : null,
    showSignupLink ? signupUrl.replace(/^https?:\/\//, '') : null,
  ].filter(Boolean) as string[];
  const showFooter = showBusinessName || contactBits.length > 0;

  // Keep the toggle grid balanced (never a single chip alone on a row).
  const toggleCount = 2 + (demo ? 1 : 0) + (agency.phone ? 1 : 0);
  const toggleCols = toggleCount === 4 ? 'grid-cols-2 sm:grid-cols-4' : toggleCount === 3 ? 'grid-cols-3' : 'grid-cols-2';

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

  const qrCards = [
    demo ? { key: 'demo', label: 'Call the live demo', sub: 'They scan, call, and hear the AI answer.', data: telHref(demo), caption: demoDisplay } : null,
    { key: 'signup', label: 'Sign up', sub: 'Scan to start a free trial.', data: signupUrl, caption: signupUrl.replace(/^https?:\/\//, '') },
    { key: 'site', label: 'Visit website', sub: 'Scan to open your marketing site.', data: siteUrl, caption: siteUrl.replace(/^https?:\/\//, '') },
    { key: 'calc', label: 'Missed-call calculator', sub: 'Scan to see what missed calls cost.', data: calcUrl, caption: calcUrl.replace(/^https?:\/\//, '') },
  ].filter(Boolean) as { key: string; label: string; sub: string; data: string; caption: string }[];

  const cardStyle: React.CSSProperties = { backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16 };

  // Shared footer renderer for the one-pager and leave-behind.
  const Footer = ({ style }: { style: React.CSSProperties }) => (
    showFooter ? (
      <div style={style}>
        {showBusinessName && <strong style={{ color: '#0f172a' }}>{name}</strong>}
        {showBusinessName && contactBits.length > 0 ? ' · ' : ''}
        {contactBits.join(' · ')}
      </div>
    ) : null
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px]">
      <Link href="/agency/outreach" className="inline-flex items-center gap-2 text-sm mb-4 transition-colors" style={{ color: theme.textMuted }}>
        <ArrowLeft className="h-4 w-4" /> Back to Outreach
      </Link>

      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 mt-0.5 overflow-hidden" style={{ backgroundColor: theme.primary15 }}>
          {logoUrl ? <img src={logoUrl} alt={name} className="h-7 w-7 object-contain" /> : <Megaphone className="h-5 w-5" style={{ color: theme.primary }} />}
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

      {/* Customize */}
      <div className="mb-8 p-4 sm:p-5" style={cardStyle}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4" style={{ color: theme.primary }} />
          <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Customize</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: theme.textMuted }}>These apply to every printable below and are saved for next time.</p>

        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Color</p>
          <div className="flex items-center gap-2 flex-wrap">
            {swatches.map((c) => {
              const active = mat.toLowerCase() === c.toLowerCase();
              return (
                <button key={c} type="button" onClick={() => setMatColor(c)} aria-label={`Use ${c}`}
                  className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, border: `2px solid ${active ? theme.text : theme.border}`, boxShadow: active ? `0 0 0 2px ${theme.card}` : 'none' }} />
              );
            })}
            <label className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer relative" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: mat, display: 'inline-block', border: `1px solid ${theme.border}` }} />
              Custom
              <input type="color" value={mat} onChange={(e) => setMatColor(e.target.value)} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
            </label>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Show on materials</p>
          <div className={`grid ${toggleCols} gap-2`}>
            <ToggleChip label="Business name" on={showBusinessName} onClick={() => setShowBusinessName((v) => !v)} theme={theme} />
            {demo && <ToggleChip label="Demo number" on={showDemoNumber} onClick={() => setShowDemoNumber((v) => !v)} theme={theme} />}
            {agency.phone && <ToggleChip label="Contact phone" on={showContactPhone} onClick={() => setShowContactPhone((v) => !v)} theme={theme} />}
            <ToggleChip label="Signup link" on={showSignupLink} onClick={() => setShowSignupLink((v) => !v)} theme={theme} />
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {demo && (
          <div className="p-4" style={cardStyle}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Demo number</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-bold" style={{ color: theme.text }}>{demoDisplay}</span>
              <button onClick={() => copy('demo-num', demoDisplay)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: copied === 'demo-num' ? theme.primary : theme.textMuted }}>{copied === 'demo-num' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === 'demo-num' ? 'Copied' : 'Copy'}</button>
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
        <button onClick={() => printOnly('mk-onepager')} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: primary }}>
          <Printer className="h-4 w-4" /> Download / Print
        </button>
      </div>
      <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Hand this to a prospect or leave it behind. Click Download / Print and choose &ldquo;Save as PDF.&rdquo;</p>

      <div id="mk-onepager" style={{ background: '#ffffff', color: '#111827', border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden', maxWidth: 820 }}>
        <div style={{ background: mat, color: matText, padding: '28px 36px', display: 'flex', alignItems: 'center', gap: 16 }}>
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
                <span style={{ width: 20, height: 20, borderRadius: 999, background: mat, color: matText, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>✓</span>
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
            {demo && showDemoNumber && (
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>Hear it live</p>
                <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: mat }}>{demoDisplay}</p>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#475569' }}>Call and tell it what your business does.</p>
              </div>
            )}
          </div>

          <Footer style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e5e7eb', fontSize: 14, color: '#475569' }} />
        </div>
      </div>

      {/* Leave-behind card */}
      <div className="flex items-center justify-between gap-3 mb-3 mt-10 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: theme.primary }} />
          <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Leave-behind card</h2>
        </div>
        <button onClick={() => printOnly('mk-leavebehind')} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: primary }}>
          <Printer className="h-4 w-4" /> Download / Print
        </button>
      </div>
      <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Leave this at a business you stopped by or couldn&apos;t reach.</p>
      <div id="mk-leavebehind" style={{ background: '#ffffff', color: '#111827', border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden', maxWidth: 520 }}>
        <div style={{ background: mat, color: matText, padding: '18px 28px', textAlign: 'center' }}>
          {logoUrl ? <img src={logoUrl} alt={name} style={{ height: 34, maxWidth: 200, objectFit: 'contain' }} /> : <span style={{ fontSize: 20, fontWeight: 800 }}>{name}</span>}
        </div>
        <div style={{ padding: '28px', textAlign: 'center' }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0f172a' }}>Sorry we missed you.</h3>
          <p style={{ fontSize: 15, color: '#475569', marginTop: 10, lineHeight: 1.6 }}>
            How many calls does your business miss? We set up an AI receptionist that answers every one, 24/7, and books the job.
          </p>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginTop: 18 }}>
            <img src={qrImg(demo ? telHref(demo) : signupUrl, 240)} alt="QR" width={120} height={120} style={{ width: 120, height: 120, border: '1px solid #e5e7eb', borderRadius: 10, padding: 6, background: '#fff' }} />
            <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{demo ? 'Scan to hear it answer' : 'Scan to get started'}</p>
          </div>
          {demo && showDemoNumber && <p style={{ margin: '14px 0 0', fontSize: 22, fontWeight: 800, color: mat }}>{demoDisplay}</p>}
          <Footer style={{ margin: '12px 0 0', fontSize: 12, color: '#64748b' }} />
        </div>
      </div>

      {/* Business card */}
      <div className="flex items-center justify-between gap-3 mb-3 mt-10 flex-wrap">
        <div className="flex items-center gap-2">
          <QrCode className="h-4 w-4" style={{ color: theme.primary }} />
          <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Business card</h2>
        </div>
        <button onClick={() => printOnly('mk-card')} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: primary }}>
          <Printer className="h-4 w-4" /> Download / Print
        </button>
      </div>
      <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Front and back, standard 3.5 x 2 in. Print, then cut to size (or send to any printer).</p>
      <div id="mk-card" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Front */}
        <div style={{ width: 336, height: 192, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logoUrl ? <img src={logoUrl} alt={name} style={{ height: 30, maxWidth: 150, objectFit: 'contain' }} /> : <span style={{ fontSize: 17, fontWeight: 800 }}>{name}</span>}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', fontWeight: 700 }}>AI Receptionist</p>
            {demo && showDemoNumber && <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: mat }}>{demoDisplay}</p>}
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>{siteUrl.replace(/^https?:\/\//, '')}</p>
          </div>
        </div>
        {/* Back */}
        <div style={{ width: 336, height: 192, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', background: mat, color: matText, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={qrImg(demo ? telHref(demo) : signupUrl, 240)} alt="QR" width={110} height={110} style={{ width: 110, height: 110, borderRadius: 8, background: '#fff', padding: 6 }} />
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>Never miss another call.</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.9 }}>{demo ? 'Scan to hear your AI answer.' : 'Scan to get started.'}</p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: theme.primary }}>
          <ExternalLink className="h-4 w-4" /> Preview your marketing site
        </a>
      </div>
    </div>
  );
}