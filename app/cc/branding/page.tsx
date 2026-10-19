'use client';

// /cc/branding - white-label the call-center dashboard. The call center sets its
// own name, logo, brand colors, app (PWA) name + icon, light/dark theme, whether
// end-business clients may set their own branding, and a custom domain. Everything
// saves to the agency row via PUT /api/agency/:id/settings (the manager token is
// authorized), and the dashboard re-themes immediately. Colors auto-extract from
// the uploaded logo. No native pickers: colors are hex fields with a swatch.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Palette, Loader2, Save, Check, Trash2, Upload, Image as ImageIcon, Smartphone, AlertCircle,
  Sparkles, RefreshCw, Type, LayoutDashboard, Building2, BarChart3,
} from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';
import { CustomSelect, type DropdownUI } from '@/components/ui/custom-select';
import { extractColorsFromImage, extractPalette } from '@/lib/colorExtraction';
import { fontOptions, fontStack, googleFontsHref, ICON_STROKE } from '@/lib/brandFonts';
import CcDomain from '@/components/cc/CcDomain';

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export default function CcBranding() {
  const { agency, refreshAgency } = useAgency();
  const theme = useTheme();
  const agencyId = agency?.id || '';

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [appIconUrl, setAppIconUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState('');
  const [primary, setPrimary] = useState('#10b981');
  const [secondary, setSecondary] = useState('#059669');
  const [accent, setAccent] = useState('#34d399');
  const [logoBg, setLogoBg] = useState<string | null>(null);
  const [websiteTheme, setWebsiteTheme] = useState<'dark' | 'light'>('dark');
  const [allowClientBranding, setAllowClientBranding] = useState(false);

  // AI brand kit
  const [displayFont, setDisplayFont] = useState<string | null>(null);
  const [bodyFont, setBodyFont] = useState<string | null>(null);
  const [iconStyle, setIconStyle] = useState<string>('regular');
  const [brandKit, setBrandKit] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/settings`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) {
        const a = await r.json();
        const g = a.agency || a;
        setName(g.name || '');
        setLogoUrl(g.logo_url || null);
        setAppIconUrl(g.app_icon_url || null);
        setAppName(g.app_name || '');
        setPrimary(g.primary_color || '#10b981');
        setSecondary(g.secondary_color || '#059669');
        setAccent(g.accent_color || '#34d399');
        setLogoBg(g.logo_background_color || null);
        setWebsiteTheme(g.website_theme === 'light' ? 'light' : 'dark');
        setAllowClientBranding(g.allow_client_branding === true);
        setDisplayFont(g.display_font || null);
        setBodyFont(g.body_font || null);
        setIconStyle(g.icon_style || 'regular');
        setBrandKit(g.brand_kit || null);
      }
    } catch { /* keep */ } finally { setLoading(false); }
  }, [agencyId]);

  useEffect(() => { load(); }, [load]);

  // Load the chosen fonts so the preview on this page renders in them.
  useEffect(() => {
    const href = googleFontsHref([displayFont, bodyFont]);
    if (!href) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href;
    document.head.appendChild(link);
    return () => { if (link.parentNode) link.parentNode.removeChild(link); };
  }, [displayFont, bodyFont]);

  // Run the AI brand analyzer on a logo (data URL or saved URL): extract the
  // pixel palette in the browser, send logo + palette to the backend Claude
  // call, and apply the proposed kit (colors, fonts, nav icon weight, vibe).
  // Best-effort: on any failure the instant pixel colors already applied stand.
  const analyzeBrand = useCallback(async (logoSrc: string) => {
    if (!logoSrc || !agencyId) return;
    setAnalyzing(true); setErr(null);
    try {
      const palette = await extractPalette(logoSrc).catch(() => null);
      const r = await fetch(`${API()}/api/agency/${agencyId}/branding/analyze-logo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ logo: logoSrc, palette, name: name || undefined }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success && d.kit) {
        const k = d.kit;
        if (k.colors) {
          if (HEX.test(k.colors.primary || '')) setPrimary(k.colors.primary);
          if (HEX.test(k.colors.secondary || '')) setSecondary(k.colors.secondary);
          if (HEX.test(k.colors.accent || '')) setAccent(k.colors.accent);
          if (k.colors.theme === 'light' || k.colors.theme === 'dark') setWebsiteTheme(k.colors.theme);
          if (k.colors.logo_background_color) setLogoBg(k.colors.logo_background_color);
        }
        if (k.fonts?.display) setDisplayFont(k.fonts.display);
        if (k.fonts?.body) setBodyFont(k.fonts.body);
        if (k.icon_style) setIconStyle(k.icon_style);
        setBrandKit(k);
      }
    } catch { /* best-effort; keep the instant pixel colors */ }
    finally { setAnalyzing(false); }
  }, [agencyId, name]);

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      setLogoUrl(dataUrl);
      // Instant pixel colors for a responsive feel, then the richer AI kit.
      try {
        const c = await extractColorsFromImage(dataUrl);
        setPrimary(c.primary); setSecondary(c.secondary); setAccent(c.accent);
        setLogoBg(c.logoBgColor || null); setWebsiteTheme(c.suggestedTheme === 'light' ? 'light' : 'dark');
      } catch { /* extraction is best-effort */ }
      analyzeBrand(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const onIcon = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const size = 512;
        const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d'); if (!ctx) { setAppIconUrl(String(reader.result || '')); return; }
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        setAppIconUrl(canvas.toDataURL('image/png'));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    for (const [lbl, v] of [['Primary', primary], ['Secondary', secondary], ['Accent', accent]] as const) {
      if (!HEX.test(v)) { setErr(`${lbl} color must be a hex value like #10b981.`); return; }
    }
    setSaving(true); setErr(null); setSaved(false);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({
          name: name.trim() || undefined,
          logo_url: logoUrl || null,
          app_name: appName.trim() || null,
          app_icon_url: appIconUrl || null,
          primary_color: primary, secondary_color: secondary, accent_color: accent,
          website_theme: websiteTheme,
          logo_background_color: logoBg || null,
          allow_client_branding: allowClientBranding,
          display_font: displayFont || null,
          body_font: bodyFont || null,
          icon_style: iconStyle || null,
          brand_kit: brandKit || null,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || d.error || 'Could not save');
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      try { await refreshAgency(); } catch { /* best-effort */ }
    } catch (e: any) { setErr(e.message || 'Could not save'); } finally { setSaving(false); }
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const ddUI: DropdownUI = { inputStyle: field, text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark };
  const dispVal = displayFont || 'Sora';
  const bodyVal = bodyFont || 'Inter';
  const Label = ({ children }: { children: React.ReactNode }) => (<label className="block text-[12px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>);
  const SectionHead = ({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Icon className="h-4 w-4" style={{ color: theme.primary }} /></div>
      <div><h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>{title}</h2>{sub && <p className="text-[12px]" style={{ color: theme.textMuted }}>{sub}</p>}</div>
    </div>
  );
  const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <span className="h-9 w-9 rounded-lg flex-shrink-0" style={{ backgroundColor: HEX.test(value) ? value : 'transparent', border: `1px solid ${theme.inputBorder}` }} />
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#10b981" className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none font-mono" style={field} />
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.textMuted }} /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Palette className="h-5 w-5" style={{ color: theme.primary }} /></div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Branding</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Make the dashboard your own. Your agents and the businesses you serve see your brand, not ours.</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-4 sm:space-y-5">
        {/* Identity + logo */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={ImageIcon} title="Brand" sub="Your name and logo across the dashboard, sign-in, and the businesses you serve." />
          <div className="mb-4"><Label>Brand name</Label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Answering" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: logoBg || theme.hover, border: `1px solid ${theme.inputBorder}` }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" /> : <ImageIcon className="h-6 w-6" style={{ color: theme.textSubtle }} />}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => logoRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium" style={{ backgroundColor: theme.hover, color: theme.text }}><Upload className="h-4 w-4" /> Upload</button>
              {logoUrl && <button onClick={() => { setLogoUrl(null); setLogoBg(null); }} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium" style={{ backgroundColor: theme.hover, color: theme.error }}><Trash2 className="h-4 w-4" /> Remove</button>}
              <input ref={logoRef} type="file" accept="image/*" onChange={onLogo} className="hidden" />
            </div>
          </div>
          <p className="text-[11.5px] mt-2" style={{ color: theme.textSubtle }}>PNG or JPG. Uploading a logo auto-fills your brand colors below, adjust them if needed.</p>
        </div>

        {/* Colors */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Palette} title="Colors" sub="Your palette drives buttons, highlights, and accents everywhere." />
          <div className="grid sm:grid-cols-3 gap-3">
            <ColorField label="Primary" value={primary} onChange={setPrimary} />
            <ColorField label="Secondary" value={secondary} onChange={setSecondary} />
            <ColorField label="Accent" value={accent} onChange={setAccent} />
          </div>
          <div className="mt-4"><Label>Dashboard theme</Label>
            <CustomSelect value={websiteTheme} onChange={(v) => setWebsiteTheme(v as 'dark' | 'light')} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} ui={ddUI} />
          </div>
        </div>

        {/* AI brand kit: fonts, nav icons, vibe */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <SectionHead icon={Sparkles} title="Brand kit" sub="Fonts and nav-icon style matched to your logo. Upload a logo and we analyze it; tweak anything below." />
            <button onClick={() => logoUrl && analyzeBrand(logoUrl)} disabled={!logoUrl || analyzing} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium flex-shrink-0 disabled:opacity-50" style={{ backgroundColor: theme.hover, color: theme.text }}>
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Regenerate
            </button>
          </div>

          {analyzing && (
            <div className="flex items-center gap-2 text-[13px] mb-4" style={{ color: theme.textMuted }}>
              <Loader2 className="h-4 w-4 animate-spin" /> Reading your logo and matching fonts, colors, and icons...
            </div>
          )}

          {brandKit?.vibe && ((brandKit.vibe.words && brandKit.vibe.words.length) || brandKit.vibe.description) && (
            <div className="mb-4">
              <Label>Vibe</Label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {(brandKit.vibe.words || []).map((w: string) => (
                  <span key={w} className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium capitalize" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{w}</span>
                ))}
              </div>
              {brandKit.vibe.description && <p className="text-[12.5px]" style={{ color: theme.textMuted }}>{brandKit.vibe.description}</p>}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Display font (headlines + nav)</Label>
              <CustomSelect value={dispVal} onChange={setDisplayFont} options={fontOptions('display')} ui={ddUI} />
            </div>
            <div>
              <Label>Body font</Label>
              <CustomSelect value={bodyVal} onChange={setBodyFont} options={fontOptions('body')} ui={ddUI} />
            </div>
          </div>
          {brandKit?.fonts?.rationale && <p className="text-[11.5px] mt-2 flex items-start gap-1.5" style={{ color: theme.textSubtle }}><Type className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> {brandKit.fonts.rationale}</p>}

          <div className="mt-3 rounded-xl p-4" style={{ border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.input }}>
            <p style={{ fontFamily: fontStack(dispVal, 'display'), fontWeight: 700, fontSize: '1.4rem', color: theme.text, lineHeight: 1.1 }}>{name || 'Your Brand'}</p>
            <p className="mt-1" style={{ fontFamily: fontStack(bodyVal, 'body'), fontSize: '0.9rem', color: theme.textMuted }}>Clear headlines and readable body text, matched to your logo across the whole dashboard.</p>
          </div>

          <div className="mt-4">
            <Label>Nav icon style</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['fine', 'regular', 'bold'] as const).map((s) => {
                const on = iconStyle === s;
                const sw = ICON_STROKE[s];
                return (
                  <button key={s} onClick={() => setIconStyle(s)} className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 transition-colors" style={on ? { backgroundColor: theme.primary15, border: `1px solid ${theme.primary}55` } : { backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
                    <span className="flex items-center gap-2" style={{ color: on ? theme.primary : theme.textMuted }}>
                      <LayoutDashboard className="h-5 w-5" strokeWidth={sw} />
                      <Building2 className="h-5 w-5" strokeWidth={sw} />
                      <BarChart3 className="h-5 w-5" strokeWidth={sw} />
                    </span>
                    <span className="text-[11px] font-medium capitalize" style={{ color: on ? theme.primary : theme.textMuted }}>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* App identity */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <SectionHead icon={Smartphone} title="Installed app" sub="When you or your agents add the dashboard to a home screen, this is its name and icon." />
          <div className="mb-4"><Label>App name</Label><input value={appName} onChange={(e) => setAppName(e.target.value)} maxLength={30} placeholder={name || 'Acme Answering'} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
          <Label>App icon</Label>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden flex-shrink-0" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.inputBorder}` }}>
              {appIconUrl ? <img src={appIconUrl} alt="App icon" className="h-full w-full object-cover" /> : <Smartphone className="h-6 w-6" style={{ color: theme.textSubtle }} />}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => iconRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium" style={{ backgroundColor: theme.hover, color: theme.text }}><Upload className="h-4 w-4" /> Upload</button>
              {appIconUrl && <button onClick={() => setAppIconUrl(null)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium" style={{ backgroundColor: theme.hover, color: theme.error }}><Trash2 className="h-4 w-4" /> Remove</button>}
              <input ref={iconRef} type="file" accept="image/*" onChange={onIcon} className="hidden" />
            </div>
          </div>
          <p className="text-[11.5px] mt-2" style={{ color: theme.textSubtle }}>Square works best. We fit it onto a 512px canvas so it is never stretched. Falls back to your logo if left empty.</p>
        </div>

        {/* Client branding */}
        <div className="rounded-2xl p-5 sm:p-6" style={card}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Let businesses set their own branding</h2>
              <p className="text-[12px] mt-0.5" style={{ color: theme.textMuted }}>When on, each business you serve can set its own logo and colors in its dashboard. When off, they all carry your brand.</p>
            </div>
            <button type="button" onClick={() => setAllowClientBranding((v) => !v)} className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none" style={{ backgroundColor: allowClientBranding ? theme.primary : theme.hover }}>
              <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200" style={{ transform: allowClientBranding ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} />
            </button>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px]" style={{ color: err ? theme.error : theme.textMuted }}>
            {err ? <span className="inline-flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> {err}</span> : saved ? <span className="inline-flex items-center gap-1.5" style={{ color: theme.success }}><Check className="h-4 w-4" /> Saved, the dashboard will re-theme.</span> : ''}
          </span>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save branding
          </button>
        </div>

        {/* Custom domain (self-contained) */}
        <CcDomain agencyId={agencyId} theme={theme} />
      </div>
    </div>
  );
}
