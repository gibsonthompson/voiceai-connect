'use client';

// ============================================================================
// MARKETING KIT
//
// Auto-branded, downloadable assets an agency hands out to land their first
// clients: QR codes (call the demo, sign up, visit site), a print-ready
// one-pager, a leave-behind, and a business card. Everything is branded from
// the agency's logo / colors / demo number, no setup required.
//
// Customize panel:
//   - Colors: pick the card Background, Accent (header band + highlights), and
//     Text color independently. White is a first-class option on each, plus a
//     custom picker. Text defaults to Auto (readable on whatever background is
//     chosen). Dark backgrounds work (text + hairlines flip automatically).
//   - Logo background: the logo sits on a white plaque on colored bands so it
//     is always legible (transparent / dark logos no longer vanish).
//   - Edit contents: turn on to edit any text inline and remove individual
//     sections (headline, subhead, each bullet, QR blocks, labels). Removed
//     sections show a Restore chip while editing. A single Reset restores
//     every customization back to brand defaults.
//
// All choices are saved per agency (localStorage) so they stick and apply to
// every material here. Edit chrome never prints.
//
// QR images come from a public QR endpoint for now; we can move generation
// in-house (reusing the Puppeteer render service) in a later phase.
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Megaphone, QrCode, Download, Copy, Check, Phone, ExternalLink,
  Printer, Sparkles, ArrowLeft, Loader2, Calculator, ChevronRight,
  Pencil, RotateCcw, Plus,
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme, isValidHex, isLightColor, withAlpha } from '@/hooks/useTheme';

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

// 0..1 relative luminance of a hex color (used for contrast fallbacks).
function lum(hex: string): number {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  } catch { return 0; }
}

// Public QR image. encodeURIComponent so tel: URIs and query strings survive.
function qrImg(data: string, size = 600): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(data)}`;
}

// Print only the element with the given id (hide everything else). Injected on
// demand and cleaned up after, so several printable pieces can share one page.
function printOnly(id: string) {
  const css = `@media print { body * { visibility: hidden !important; } #${id}, #${id} * { visibility: visible !important; } #${id} { position: absolute !important; inset: 0 !important; margin: 0 !important; width: 100% !important; box-shadow: none !important; border: none !important; } #${id} .no-print { display: none !important; } @page { margin: 0.5in; } }`;
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

// A row of color swatches + custom picker for one color setting. White is a
// first-class swatch (with a visible ring so it's findable on a white panel).
// An optional "Auto" chip clears the value back to automatic.
function ColorRow({
  label, value, swatches, onPick, autoLabel, theme,
}: {
  label: string; value: string; swatches: (string | null | undefined)[];
  onPick: (c: string) => void; autoLabel?: string; theme: any;
}) {
  const isAuto = !value;
  const uniq = (swatches.filter(Boolean) as string[])
    .filter((c, i, a) => a.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i);
  const customActive = !isAuto && !uniq.some((c) => c.toLowerCase() === value.toLowerCase());
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>{label}</p>
      {/* One scrollable row so swatches never wrap onto a second line in the narrow rail. */}
      <div className="mk-swatches flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-0.5">
        {autoLabel && (
          <button type="button" onClick={() => onPick('')} className="flex-shrink-0 inline-flex items-center rounded-md px-2 h-7 text-[11px] font-semibold transition-colors"
            style={{ backgroundColor: isAuto ? theme.primary15 : theme.hover, border: `1px solid ${isAuto ? theme.primary + '55' : theme.border}`, color: isAuto ? theme.primary : theme.textMuted }}>
            {autoLabel}
          </button>
        )}
        {uniq.map((c) => {
          const active = !isAuto && value.toLowerCase() === c.toLowerCase();
          const isWhite = c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#fff';
          return (
            <button key={c} type="button" onClick={() => onPick(c)} aria-label={`Use ${c}`} title={c}
              className="flex-shrink-0 h-7 w-7 rounded-full transition-transform hover:scale-110"
              style={{ backgroundColor: c, border: `2px solid ${active ? theme.text : (isWhite ? '#cbd5e1' : theme.border)}`, boxShadow: active ? `0 0 0 2px ${theme.card}` : 'none' }} />
          );
        })}
        <label title="Custom color" className="flex-shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full cursor-pointer relative"
          style={{ background: customActive ? value : theme.hover, border: `2px solid ${customActive ? theme.text : theme.border}`, boxShadow: customActive ? `0 0 0 2px ${theme.card}` : 'none' }}>
          {!customActive && <Plus className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />}
          <input type="color" value={isValidHex(value) ? value : '#ffffff'} onChange={(e) => onPick(e.target.value)} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
        </label>
      </div>
    </div>
  );
}

// Inline-editable text. Uncontrolled contentEditable: the DOM text is seeded
// once per (value, nonce) and only read back on blur, so typing never triggers
// a re-render and the caret never jumps. `nonce` bumps on Reset to re-seed the
// defaults. Edit chrome and placeholders never print.
function Editable({
  value, editing, nonce, onSave, as = 'span', multiline = false, style, className, placeholder,
}: {
  value: string; editing: boolean; nonce: number; onSave: (v: string) => void;
  as?: any; multiline?: boolean; style?: React.CSSProperties; className?: string; placeholder?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) {
      el.textContent = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, nonce, editing]);
  const Tag: any = as;
  return (
    <Tag
      ref={ref as any}
      data-mk-edit
      data-ph={placeholder || ''}
      contentEditable={editing}
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e: any) => onSave((e.currentTarget.textContent ?? '').replace(/\s+$/,''))}
      onKeyDown={(e: any) => { if (!multiline && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      className={className}
      style={{ ...style, outline: 'none', cursor: editing ? 'text' : undefined }}
    />
  );
}

// Wraps a removable section. Hidden + not editing -> nothing renders (and never
// prints). Hidden + editing -> a Restore chip. Visible + editing -> the content
// with a small × in the corner. The × and chip carry `no-print`.
function Removable({
  id, hidden, editing, onToggle, label, children, style, inline = false,
}: {
  id: string; hidden: string[]; editing: boolean; onToggle: (id: string) => void;
  label: string; children: React.ReactNode; style?: React.CSSProperties; inline?: boolean;
}) {
  const isHidden = hidden.includes(id);
  if (isHidden && !editing) return null;
  if (isHidden) {
    return (
      <button type="button" onClick={() => onToggle(id)} className="mk-restore no-print" title={`Restore ${label}`}>
        <RotateCcw style={{ width: 11, height: 11 }} /> {label}
      </button>
    );
  }
  return (
    <div style={{ position: 'relative', ...(inline ? { display: 'inline-block' } : {}), ...style }}>
      {children}
      {editing && (
        <button type="button" onClick={() => onToggle(id)} aria-label={`Remove ${label}`} className="mk-x no-print">×</button>
      )}
    </div>
  );
}

export default function MarketingKitPage() {
  const { agency, branding, loading } = useAgency();
  const theme = useTheme();
  const [copied, setCopied] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Customize state. Defaults: Auto colors, logo plaque on, everything shown.
  const [bgColor, setBgColor] = useState<string>('');        // card sheet background
  const [accentColor, setAccentColor] = useState<string>(''); // header band + highlights
  const [textColor, setTextColor] = useState<string>('');     // '' = auto (readable on bg)
  const [logoPlaque, setLogoPlaque] = useState(true);
  const [showBusinessName, setShowBusinessName] = useState(true);
  const [showDemoNumber, setShowDemoNumber] = useState(true);
  const [showSignupLink, setShowSignupLink] = useState(true);
  const [showContactPhone, setShowContactPhone] = useState(true);

  // Content editing: per-element text overrides + removed section ids.
  const [editMode, setEditMode] = useState(false);
  const [textOv, setTextOv] = useState<Record<string, string>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [resetNonce, setResetNonce] = useState(0);

  const skipSaveRef = useRef(true);
  const prefsKey = agency ? `mk_prefs_${agency.id}` : '';

  // Load saved prefs once the agency is known. Migrates the old single
  // `matColor` field onto `accentColor`.
  useEffect(() => {
    if (!prefsKey) return;
    try {
      const raw = localStorage.getItem(prefsKey);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.accentColor === 'string') setAccentColor(p.accentColor);
        else if (typeof p.matColor === 'string') setAccentColor(p.matColor); // migrate
        if (typeof p.bgColor === 'string') setBgColor(p.bgColor);
        if (typeof p.textColor === 'string') setTextColor(p.textColor);
        if (typeof p.logoPlaque === 'boolean') setLogoPlaque(p.logoPlaque);
        if (typeof p.showBusinessName === 'boolean') setShowBusinessName(p.showBusinessName);
        if (typeof p.showDemoNumber === 'boolean') setShowDemoNumber(p.showDemoNumber);
        if (typeof p.showSignupLink === 'boolean') setShowSignupLink(p.showSignupLink);
        if (typeof p.showContactPhone === 'boolean') setShowContactPhone(p.showContactPhone);
        if (p.textOv && typeof p.textOv === 'object') setTextOv(p.textOv);
        if (Array.isArray(p.hidden)) setHidden(p.hidden.filter((x: any) => typeof x === 'string'));
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsKey]);

  // Save on change (skip the initial mount so we never overwrite saved prefs
  // with defaults before they load).
  useEffect(() => {
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }
    if (!prefsKey) return;
    try {
      localStorage.setItem(prefsKey, JSON.stringify({
        bgColor, accentColor, textColor, logoPlaque,
        showBusinessName, showDemoNumber, showSignupLink, showContactPhone,
        textOv, hidden,
      }));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgColor, accentColor, textColor, logoPlaque, showBusinessName, showDemoNumber, showSignupLink, showContactPhone, textOv, hidden]);

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

  // ── Resolved material colors ──────────────────────────────────────────
  // sheetBg  = the card/paper background (default white)
  // accent   = header band + highlights (default brand primary)
  // text     = headings/body; '' means auto (readable on the chosen sheet)
  const sheetBg = isValidHex(bgColor) ? bgColor : '#ffffff';
  const sheetLight = isLightColor(sheetBg);
  const accent = isValidHex(accentColor) ? accentColor : primary;
  const accentText = getContrastColor(accent);
  const headingColor = isValidHex(textColor) ? textColor : (sheetLight ? '#0f172a' : '#ffffff');
  const bodyColor = isValidHex(textColor) ? withAlpha(textColor, 0.82) : (sheetLight ? '#475569' : 'rgba(255,255,255,0.82)');
  const subtleColor = isValidHex(textColor) ? withAlpha(textColor, 0.6) : (sheetLight ? '#64748b' : 'rgba(255,255,255,0.6)');
  const hairline = sheetLight ? '#e5e7eb' : 'rgba(255,255,255,0.14)';
  // Number/emphasis uses the accent, unless it would be unreadable on the
  // sheet (e.g. a white or very light accent on a white sheet).
  const emphasis = Math.abs(lum(accent) - lum(sheetBg)) > 0.22 ? accent : headingColor;

  // Swatch palettes. Agency brand first, then neutrals + white. The platform's
  // F1 neutrals are offered so an agency can reach that look, without forcing it.
  // Trimmed so each row fits on one line in the narrow rail (the Auto chip
  // already covers White for background and Brand for accent). Custom covers
  // anything else.
  const bgSwatches = ['#0A0E0F', primary, brandSecondary, brandAccent];
  const accentSwatches = [primary, brandSecondary, brandAccent, '#0f172a', '#ffffff'];
  const textSwatches = ['#0f172a', '#ffffff'];

  // Content helpers.
  const getText = (id: string, def: string) => (id in textOv ? textOv[id] : def);
  const setText = (id: string, val: string, def: string) => setTextOv((prev) => {
    const next = { ...prev };
    if (val === def) delete next[id]; else next[id] = val;
    return next;
  });
  const toggleHidden = (id: string) => setHidden((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const hasCustomizations = !!(bgColor || accentColor || textColor || !logoPlaque
    || Object.keys(textOv).length || hidden.length
    || !showBusinessName || !showDemoNumber || !showSignupLink || !showContactPhone);

  const resetAll = () => {
    if (hasCustomizations && !window.confirm('Reset all customizations back to your brand defaults? This clears text edits, removed sections, and colors.')) return;
    setBgColor(''); setAccentColor(''); setTextColor(''); setLogoPlaque(true);
    setShowBusinessName(true); setShowDemoNumber(true); setShowSignupLink(true); setShowContactPhone(true);
    setTextOv({}); setHidden([]);
    setResetNonce((n) => n + 1);
  };

  // Color swatches offered for the material color (kept for compatibility with
  // older behavior where `mat` drove the band).

  // Footer detail bits (everything except the business name, which renders bold).
  const contactBits = [
    showContactPhone && agency.phone ? formatPhone(agency.phone) : null,
    showSignupLink ? signupUrl.replace(/^https?:\/\//, '') : null,
  ].filter(Boolean) as string[];
  const showFooter = showBusinessName || contactBits.length > 0;

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

  // Logo rendered for a colored band: on a white plaque (default) so it is
  // always legible, or bare if the plaque is turned off. Falls back to the
  // business name when there's no logo.
  const BandLogo = ({ h, maxW }: { h: number; maxW: number }) => {
    if (!logoUrl) return <span style={{ fontSize: h >= 40 ? 24 : 20, fontWeight: 800, color: accentText }}>{name}</span>;
    const img = <img src={logoUrl} alt={name} style={{ height: h, maxWidth: maxW, objectFit: 'contain', display: 'block' }} />;
    return logoPlaque
      ? <span style={{ background: '#ffffff', borderRadius: 10, padding: '8px 12px', display: 'inline-flex', alignItems: 'center' }}>{img}</span>
      : img;
  };

  // Shared footer renderer for the one-pager and leave-behind.
  const Footer = ({ style }: { style: React.CSSProperties }) => (
    showFooter ? (
      <div style={style}>
        {showBusinessName && <strong style={{ color: headingColor }}>{name}</strong>}
        {showBusinessName && contactBits.length > 0 ? ' · ' : ''}
        {contactBits.join(' · ')}
      </div>
    ) : null
  );

  const edProps = (id: string, def: string) => ({
    value: getText(id, def), editing: editMode, nonce: resetNonce,
    onSave: (v: string) => setText(id, v, def),
  });

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-[1100px] ${editMode ? 'mk-editing' : ''}`}>
      <style>{`
        .mk-swatches { scrollbar-width: none; -ms-overflow-style: none; }
        .mk-swatches::-webkit-scrollbar { display: none; }
        .mk-editing [data-mk-edit]:hover { box-shadow: inset 0 0 0 1px rgba(99,102,241,0.45); border-radius: 4px; }
        [data-mk-edit]:focus { box-shadow: inset 0 0 0 2px #6366f1; border-radius: 4px; }
        [data-mk-edit]:empty:before { content: attr(data-ph); color: #cbd5e1; }
        .mk-x { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 999px; background: #ef4444; color: #fff; font-size: 13px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer; z-index: 6; }
        .mk-restore { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; color: #6366f1; background: rgba(99,102,241,0.1); border: 1px dashed rgba(99,102,241,0.5); border-radius: 8px; padding: 5px 9px; cursor: pointer; margin: 4px 0; }
        @media print { .no-print { display: none !important; } [data-mk-edit] { box-shadow: none !important; } [data-mk-edit]:empty:before { content: '' !important; } }
      `}</style>

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

      {/* ===== Builder: sticky controls + live canvas ===== */}
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="h-4 w-4" style={{ color: theme.primary }} />
        <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Branded print materials</h2>
      </div>
      <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Edit colors and content on the left; the materials on the right update live. Saved for next time.</p>
      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6 lg:items-start">
        {/* Customize (sticky control rail) */}
        <div className="mb-6 lg:mb-0 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto p-4 sm:p-5" style={cardStyle}>
          <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: theme.primary }} />
              <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Customize</h2>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setEditMode((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors"
                style={{ backgroundColor: editMode ? theme.primary : theme.hover, border: `1px solid ${editMode ? theme.primary : theme.border}`, color: editMode ? (theme.primaryText || '#fff') : theme.textMuted }}>
                <Pencil className="h-3.5 w-3.5" /> {editMode ? 'Done editing' : 'Edit contents'}
              </button>
              <button type="button" onClick={resetAll} disabled={!hasCustomizations}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40"
                style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
            {editMode
              ? 'Click any text on the materials to edit it. Hover a section and click × to remove it (a Restore chip brings it back). Reset restores brand defaults.'
              : 'These apply to every material here and are saved for next time.'}
          </p>

          <div className="space-y-4">
            <ColorRow label="Card background" value={bgColor} swatches={bgSwatches} onPick={setBgColor} autoLabel="White" theme={theme} />
            <ColorRow label="Accent (header + highlights)" value={accentColor} swatches={accentSwatches} onPick={setAccentColor} autoLabel="Brand" theme={theme} />
            <ColorRow label="Text" value={textColor} swatches={textSwatches} onPick={setTextColor} autoLabel="Auto" theme={theme} />
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Show on materials</p>
            {/* Full-width stack: label left, check right. Can't cram or wrap at
                any width, so it reads the same in the narrow rail and on mobile. */}
            <div className="grid grid-cols-1 gap-2">
              <ToggleChip label="Business name" on={showBusinessName} onClick={() => setShowBusinessName((v) => !v)} theme={theme} />
              {demo && <ToggleChip label="Demo number" on={showDemoNumber} onClick={() => setShowDemoNumber((v) => !v)} theme={theme} />}
              {agency.phone && <ToggleChip label="Contact phone" on={showContactPhone} onClick={() => setShowContactPhone((v) => !v)} theme={theme} />}
              <ToggleChip label="Signup link" on={showSignupLink} onClick={() => setShowSignupLink((v) => !v)} theme={theme} />
              <ToggleChip label="Logo on white background" on={logoPlaque} onClick={() => setLogoPlaque((v) => !v)} theme={theme} />
            </div>
          </div>
        </div>

        {/* Canvas: the materials being customized, update live */}
        <div className="min-w-0">
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

      <div id="mk-onepager" style={{ background: sheetBg, color: bodyColor, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden', maxWidth: 820 }}>
        <div style={{ background: accent, color: accentText, padding: '28px 36px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <BandLogo h={44} maxW={220} />
        </div>
        <div style={{ padding: '36px' }}>
          <Editable {...edProps('op-headline', 'Never miss another call.')} as="h3" placeholder="Headline"
            style={{ fontSize: 34, lineHeight: 1.1, margin: 0, fontWeight: 800, color: headingColor }} />
          <Editable {...edProps('op-subhead', 'An AI receptionist that answers every call 24/7, sounds natural, handles questions, and books jobs straight onto your calendar. Set up in about a day.')} as="p" multiline placeholder="Supporting text"
            style={{ fontSize: 17, color: bodyColor, marginTop: 14, lineHeight: 1.6 }} />

          <ul style={{ margin: '22px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
              {[
                ['op-b1', 'Answers 24/7, even after hours and weekends'],
                ['op-b2', 'Books appointments and captures every lead'],
                ['op-b3', 'Sounds like a real receptionist, not a robot'],
              ].map(([id, def]) => (
                hidden.includes(id) && !editMode ? null : (
                  hidden.includes(id) ? (
                    <li key={id}><button type="button" onClick={() => toggleHidden(id)} className="mk-restore no-print"><RotateCcw style={{ width: 11, height: 11 }} /> Bullet</button></li>
                  ) : (
                    <li key={id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, color: headingColor, paddingRight: editMode ? 26 : 0 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 999, background: accent, color: accentText, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>✓</span>
                      <Editable {...edProps(id, def)} as="span" placeholder="Bullet" style={{ flex: 1 }} />
                      {editMode && <button type="button" onClick={() => toggleHidden(id)} aria-label="Remove bullet" className="mk-x no-print" style={{ top: '50%', transform: 'translateY(-50%)', right: 2 }}>×</button>}
                    </li>
                  )
                )
              ))}
          </ul>

          {/* Natural widths, no flex-grow: removing any QR just closes the row
              up and left-packs the rest instead of leaving a gap. */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 30, alignItems: 'flex-start' }}>
            {demo && (
              <Removable id="op-demoqr" hidden={hidden} editing={editMode} onToggle={toggleHidden} label="Demo QR" style={{ textAlign: 'center' }}>
                <img src={qrImg(telHref(demo), 300)} alt="Call the demo" width={130} height={130} style={{ display: 'block', width: 130, height: 130, border: '1px solid #e5e7eb', borderRadius: 10, padding: 6, background: '#fff' }} />
                <Editable {...edProps('op-demoqr-cap', 'Scan to hear it answer')} as="p" placeholder="Caption" style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 700, color: headingColor }} />
              </Removable>
            )}
            <Removable id="op-signupqr" hidden={hidden} editing={editMode} onToggle={toggleHidden} label="Signup QR" style={{ textAlign: 'center' }}>
              <img src={qrImg(signupUrl, 300)} alt="Sign up" width={130} height={130} style={{ display: 'block', width: 130, height: 130, border: '1px solid #e5e7eb', borderRadius: 10, padding: 6, background: '#fff' }} />
              <Editable {...edProps('op-signupqr-cap', 'Scan to get started')} as="p" placeholder="Caption" style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 700, color: headingColor }} />
            </Removable>
            {demo && showDemoNumber && (
              <Removable id="op-hearlive" hidden={hidden} editing={editMode} onToggle={toggleHidden} label="Call-now block" style={{ minWidth: 180, maxWidth: 320 }}>
                <Editable {...edProps('op-hearlive-label', 'Hear it live')} as="p" placeholder="Label" style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: subtleColor, fontWeight: 700 }} />
                <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: emphasis }}>{demoDisplay}</p>
                <Editable {...edProps('op-hearlive-sub', 'Call and tell it what your business does.')} as="p" multiline placeholder="Subtext" style={{ margin: '4px 0 0', fontSize: 14, color: bodyColor }} />
              </Removable>
            )}
          </div>

          <Footer style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${hairline}`, fontSize: 14, color: bodyColor }} />
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
      <div id="mk-leavebehind" style={{ background: sheetBg, color: bodyColor, border: `1px solid ${theme.border}`, borderRadius: 16, overflow: 'hidden', maxWidth: 520 }}>
        <div style={{ background: accent, color: accentText, padding: '18px 28px', textAlign: 'center' }}>
          <BandLogo h={34} maxW={200} />
        </div>
        <div style={{ padding: '28px', textAlign: 'center' }}>
          <Editable {...edProps('lb-headline', 'Sorry we missed you.')} as="h3" placeholder="Headline" style={{ fontSize: 24, fontWeight: 800, margin: 0, color: headingColor }} />
          <Editable {...edProps('lb-subhead', 'How many calls does your business miss? We set up an AI receptionist that answers every one, 24/7, and books the job.')} as="p" multiline placeholder="Supporting text" style={{ fontSize: 15, color: bodyColor, marginTop: 10, lineHeight: 1.6 }} />
          <Removable id="lb-qr" hidden={hidden} editing={editMode} onToggle={toggleHidden} label="QR" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginTop: 18 }}>
            <img src={qrImg(demo ? telHref(demo) : signupUrl, 240)} alt="QR" width={120} height={120} style={{ width: 120, height: 120, border: '1px solid #e5e7eb', borderRadius: 10, padding: 6, background: '#fff' }} />
            <Editable {...edProps('lb-qr-cap', demo ? 'Scan to hear it answer' : 'Scan to get started')} as="p" placeholder="Caption" style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 700, color: headingColor }} />
          </Removable>
          {demo && showDemoNumber && <p style={{ margin: '14px 0 0', fontSize: 22, fontWeight: 800, color: emphasis }}>{demoDisplay}</p>}
          <Footer style={{ margin: '12px 0 0', fontSize: 12, color: subtleColor }} />
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
        <div style={{ width: 336, height: 192, borderRadius: 12, overflow: 'hidden', border: `1px solid ${hairline}`, background: sheetBg, color: headingColor, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logoUrl
              ? (logoPlaque
                  ? <span style={{ background: '#ffffff', borderRadius: 8, padding: '5px 8px', display: 'inline-flex', alignItems: 'center' }}><img src={logoUrl} alt={name} style={{ height: 28, maxWidth: 140, objectFit: 'contain', display: 'block' }} /></span>
                  : <img src={logoUrl} alt={name} style={{ height: 30, maxWidth: 150, objectFit: 'contain' }} />)
              : <span style={{ fontSize: 17, fontWeight: 800, color: headingColor }}>{name}</span>}
          </div>
          <div>
            <Editable {...edProps('bc-label', 'AI Receptionist')} as="p" placeholder="Label" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: subtleColor, fontWeight: 700 }} />
            {demo && showDemoNumber && <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: emphasis }}>{demoDisplay}</p>}
            <p style={{ margin: '4px 0 0', fontSize: 12, color: bodyColor }}>{siteUrl.replace(/^https?:\/\//, '')}</p>
          </div>
        </div>
        {/* Back */}
        <div style={{ width: 336, height: 192, borderRadius: 12, overflow: 'hidden', border: `1px solid ${hairline}`, background: accent, color: accentText, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={qrImg(demo ? telHref(demo) : signupUrl, 240)} alt="QR" width={110} height={110} style={{ width: 110, height: 110, borderRadius: 8, background: '#fff', padding: 6 }} />
          <div>
            <Editable {...edProps('bc-back-headline', 'Never miss another call.')} as="p" multiline placeholder="Headline" style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.2, color: accentText }} />
            <Editable {...edProps('bc-back-sub', demo ? 'Scan to hear your AI answer.' : 'Scan to get started.')} as="p" placeholder="Subtext" style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.9, color: accentText }} />
          </div>
        </div>
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