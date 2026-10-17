'use client';

// White-label branding for the call center, so a manager can set their own
// look without contacting us (parity with the agency Profile tab, which is the
// only place this lived before). A call center is an agency row with
// is_call_center=true, so everything saves through the same endpoint the agency
// Profile tab uses: PUT /api/agency/:id/settings with the branding keys. Logo
// and app icon are stored as data URLs in logo_url / app_icon_url (there is no
// separate upload route). refreshAgency() reloads the branding the /cc layout
// reads, so the sidebar logo/colors update in place.
//
// Self-contained card. On logo upload we pre-fill brand colors from the image
// (manager can still fine-tune with the pickers). Subdomain saves on its own
// (it has its own validation + taken/reserved errors), like the agency tab.

import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Check, Loader2, Sparkles, Info, Building2, Smartphone, AlertCircle, Palette } from 'lucide-react';

const API = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

const SLUG_FORMAT = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const isSlugFormatValid = (s: string) => s.length >= 3 && s.length <= 63 && SLUG_FORMAT.test(s);

function rgbToHex(r: number, g: number, b: number) { return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join(''); }
function adjustBrightness(hex: string, percent: number) {
  const num = parseInt(hex.replace('#', ''), 16); const amt = Math.round(2.55 * percent);
  return rgbToHex(((num >> 16) & 0xff) + amt, ((num >> 8) & 0xff) + amt, (num & 0xff) + amt);
}
// Pick a representative brand color from the logo: the most saturated pixel that
// is not near-white or near-black, then derive a darker secondary and lighter
// accent. Good enough to pre-fill; the pickers below let the manager adjust.
function extractColorsFromImage(dataUrl: string): Promise<{ primary: string; secondary: string; accent: string } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const S = 64; const c = document.createElement('canvas'); c.width = S; c.height = S;
        const ctx = c.getContext('2d'); if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, S, S);
        const { data } = ctx.getImageData(0, 0, S, S);
        let best = { score: -1, r: 16, g: 185, b: 129 };
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const lum = (r + g + b) / 3;
          if (lum > 240 || lum < 15) continue;
          const score = sat + (1 - Math.abs(lum - 128) / 128) * 0.3;
          if (score > best.score) best = { score, r, g, b };
        }
        const primary = rgbToHex(best.r, best.g, best.b);
        resolve({ primary, secondary: adjustBrightness(primary, -12), accent: adjustBrightness(primary, 18) });
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export default function CcBrandingSection({ agency, refreshAgency, theme }: { agency: any; refreshAgency: () => Promise<void> | void; theme: any }) {
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [colors, setColors] = useState({ primary: '#10b981', secondary: '#059669', accent: '#34d399' });
  const [appName, setAppName] = useState('');
  const [appIconUrl, setAppIconUrl] = useState('');
  const [appIconPreview, setAppIconPreview] = useState<string | null>(null);

  const [slug, setSlug] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugSaved, setSlugSaved] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const logoInput = useRef<HTMLInputElement>(null);
  const iconInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!agency) return;
    setLogoUrl(agency.logo_url || '');
    setLogoPreview(agency.logo_url || null);
    setAppName(agency.app_name || '');
    setAppIconUrl(agency.app_icon_url || '');
    setAppIconPreview(agency.app_icon_url || null);
    setColors({ primary: agency.primary_color || '#10b981', secondary: agency.secondary_color || '#059669', accent: agency.accent_color || '#34d399' });
    setSlug(agency.slug || '');
  }, [agency?.id]);

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl); setLogoUrl(dataUrl); setExtracting(true);
      try { const c = await extractColorsFromImage(dataUrl); if (c) setColors(c); } finally { setExtracting(false); }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = async () => {
    if (!agency?.id) return;
    setRemovingLogo(true); setErr(null);
    try {
      const r = await fetch(`${API()}/api/agency/${agency.id}/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ logo_url: null, favicon_url: null, logo_background_color: null, primary_color: '#10b981', secondary_color: '#059669', accent_color: '#34d399', branding_overrides: null }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Failed to remove logo'); }
      setLogoUrl(''); setLogoPreview(null); setColors({ primary: '#10b981', secondary: '#059669', accent: '#34d399' });
      await refreshAgency();
    } catch (e: any) { setErr(e.message || 'Failed to remove logo'); } finally { setRemovingLogo(false); }
  };

  // App icon: fit (contain) onto a 512x512 transparent square in-browser.
  const onIcon = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const src = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        try {
          const S = 512; const canvas = document.createElement('canvas'); canvas.width = S; canvas.height = S;
          const ctx = canvas.getContext('2d'); if (!ctx) { setAppIconUrl(src); setAppIconPreview(src); return; }
          const scale = Math.min(S / img.width, S / img.height); const w = img.width * scale, h = img.height * scale;
          ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
          const out = canvas.toDataURL('image/png'); setAppIconUrl(out); setAppIconPreview(out);
        } catch { setAppIconUrl(src); setAppIconPreview(src); }
      };
      img.onerror = () => { setAppIconUrl(src); setAppIconPreview(src); };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!agency?.id) return;
    setSaving(true); setErr(null); setSaved(false);
    try {
      const r = await fetch(`${API()}/api/agency/${agency.id}/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({
          logo_url: logoUrl || null,
          app_name: appName.trim() || null,
          app_icon_url: appIconUrl || null,
          primary_color: colors.primary,
          secondary_color: colors.secondary,
          accent_color: colors.accent,
        }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || d.error || 'Failed to save branding'); }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      await refreshAgency();
    } catch (e: any) { setErr(e.message || 'Failed to save branding'); } finally { setSaving(false); }
  };

  const saveSlug = async () => {
    if (!agency?.id) return;
    const s = slug.trim().toLowerCase();
    setSlugError(null); setSlugSaved(false);
    if (!isSlugFormatValid(s)) { setSlugError('Use 3 to 63 characters: lowercase letters, numbers, and hyphens, not starting or ending with a hyphen.'); return; }
    setSlugSaving(true);
    try {
      const r = await fetch(`${API()}/api/agency/${agency.id}/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ slug: s }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d.error === 'slug_taken') setSlugError('That subdomain is already taken. Try another.');
        else if (d.error === 'slug_reserved') setSlugError('That subdomain is reserved. Try another.');
        else if (d.error === 'slug_invalid') setSlugError(d.message || 'That subdomain is not valid.');
        else setSlugError(d.error || 'Failed to update subdomain.');
        return;
      }
      await refreshAgency(); setSlugSaved(true); setTimeout(() => setSlugSaved(false), 6000);
    } catch (e: any) { setSlugError(e.message || 'Failed to update subdomain.'); } finally { setSlugSaving(false); }
  };

  const slugNorm = slug.trim().toLowerCase();
  const slugChanged = slugNorm !== (agency?.slug || '').toLowerCase();
  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const input = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;

  const swatch = (label: string, key: 'primary' | 'secondary' | 'accent') => (
    <div>
      <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{label}</label>
      <div className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={input}>
        <div className="relative h-7 w-7 rounded-lg flex-shrink-0 overflow-hidden" style={{ backgroundColor: colors[key], border: `1px solid ${theme.border}` }}>
          <input type="color" value={colors[key]} onChange={(e) => setColors((p) => ({ ...p, [key]: e.target.value }))} className="absolute inset-0 h-full w-full opacity-0 cursor-pointer" />
        </div>
        <input type="text" value={colors[key]} onChange={(e) => setColors((p) => ({ ...p, [key]: e.target.value }))} spellCheck={false} className="min-w-0 flex-1 bg-transparent text-[13px] font-mono outline-none" style={{ color: theme.text }} />
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={card}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Palette className="h-4 w-4" style={{ color: theme.primary }} /></div>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Branding</h2>
          <p className="text-[12px]" style={{ color: theme.textMuted }}>Your logo and colors across the whole call center. Upload a logo and we pull your colors from it.</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Logo */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: theme.text }}>Logo</label>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={input}>
              {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" /> : <Building2 className="h-7 w-7" style={{ color: theme.textMuted }} />}
            </div>
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <input ref={logoInput} type="file" accept="image/*" onChange={onLogo} className="hidden" />
              <button onClick={() => logoInput.current?.click()} className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium" style={input}><Upload className="h-4 w-4" /> Upload</button>
              {logoPreview && <button onClick={removeLogo} disabled={removingLogo} className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium disabled:opacity-50" style={{ ...input, color: theme.textMuted }}>{removingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remove</button>}
              <span className="w-full text-[11px]" style={{ color: theme.textMuted }}>PNG or JPG up to 2MB</span>
            </div>
          </div>
          {extracting && <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: theme.primary }}><Loader2 className="h-4 w-4 animate-spin" /> Pulling your brand colors...</div>}
        </div>

        {/* Colors */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: theme.text }}>Brand colors</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {swatch('Primary', 'primary')}
            {swatch('Secondary', 'secondary')}
            {swatch('Accent', 'accent')}
          </div>
        </div>

        {/* App name + icon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: theme.text }}>App name</label>
            <input type="text" value={appName} onChange={(e) => setAppName(e.target.value.slice(0, 30))} placeholder={agency?.name || 'Your call center'} maxLength={30} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={input} />
            <p className="text-[11px] mt-1.5" style={{ color: theme.textMuted }}>Shown under the icon when the dashboard is installed to a home screen.</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: theme.text }}>App icon</label>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={input}>
                {appIconPreview ? <img src={appIconPreview} alt="App icon" className="h-full w-full object-contain" /> : <Smartphone className="h-5 w-5" style={{ color: theme.textMuted }} />}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input ref={iconInput} type="file" accept="image/*" onChange={onIcon} className="hidden" />
                <button onClick={() => iconInput.current?.click()} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium" style={input}><Upload className="h-4 w-4" /> Upload</button>
                {appIconPreview && <button onClick={() => { setAppIconUrl(''); setAppIconPreview(null); }} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium" style={{ ...input, color: theme.textMuted }}><Trash2 className="h-4 w-4" /> Remove</button>}
              </div>
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: theme.textMuted }}>Square works best. Leave blank to use your logo.</p>
          </div>
        </div>

        {/* Save branding */}
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{saving ? 'Saving...' : saved ? 'Saved' : 'Save branding'}
          </button>
          {err && <span className="text-xs" style={{ color: theme.error }}>{err}</span>}
        </div>

        {/* Subdomain */}
        <div className="pt-4" style={{ borderTop: `1px solid ${theme.borderSubtle || theme.border}` }}>
          <label className="block text-xs font-medium mb-1.5" style={{ color: theme.text }}>Subdomain</label>
          <p className="text-[11px] mb-2" style={{ color: theme.textMuted }}>Your white-label address. Lowercase letters, numbers, and hyphens, 3 to 63 characters.</p>
          <div className="flex items-stretch rounded-xl overflow-hidden" style={{ border: `1px solid ${slugError ? theme.errorBorder : theme.inputBorder}` }}>
            <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugError(null); setSlugSaved(false); }} spellCheck={false} autoCapitalize="none" autoCorrect="off" placeholder="your-call-center" className="flex-1 min-w-0 px-3.5 py-2.5 text-sm outline-none" style={{ backgroundColor: theme.input, color: theme.text }} />
            <div className="flex items-center px-3 text-xs whitespace-nowrap" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', color: theme.textMuted, borderLeft: `1px solid ${theme.inputBorder}` }}>.{PLATFORM_DOMAIN}</div>
          </div>
          <p className="mt-1.5 text-[11px] break-all" style={{ color: theme.textMuted }}>Preview: https://{slugNorm || 'your-call-center'}.{PLATFORM_DOMAIN}/signup</p>
          {slugError && <div className="mt-2 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText || theme.error }} /><p className="text-sm" style={{ color: theme.errorText || theme.error }}>{slugError}</p></div>}
          {slugSaved && <div className="mt-2 rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30 || theme.border}` }}><Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} /><p className="text-sm" style={{ color: theme.primary }}>Subdomain updated. Your old address stops working, update it anywhere you shared it.</p></div>}
          <button onClick={saveSlug} disabled={slugSaving || !slugChanged || !isSlugFormatValid(slugNorm)} className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{slugSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Check className="h-4 w-4" /> Save subdomain</>}</button>
        </div>

        <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.border}` }}>
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
          <p className="text-[12px] leading-relaxed" style={{ color: theme.textMuted }}>Your logo and colors apply across the call center dashboard and anything your agents see. When a logo is set, the sidebar shows it in place of your name.</p>
        </div>
      </div>
    </div>
  );
}
