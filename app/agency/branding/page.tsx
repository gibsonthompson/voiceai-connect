'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAgency, clampLogoScale, LOGO_SCALE_MIN, LOGO_SCALE_MAX } from '../context';
import { useTheme, buildTheme, BrandingOverrides, isValidHex } from '../../../hooks/useTheme';
import {
  Save, RotateCcw, Loader2, Check, AlertCircle, Paintbrush, Eye,
  PanelLeft, LayoutDashboard, Type, Square, MousePointer, Shuffle, Sparkles,
  Sun, Moon, RefreshCw, Maximize2, ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import LockedFeature from '@/components/LockedFeature';
import FontSelect from '@/components/cc/FontSelect';
import { fontStack, googleFontsHref } from '@/lib/brandFonts';
import { type DropdownUI } from '@/components/ui/custom-select';
import { ICON_SETS, previewIcons } from '@/components/cc/navIcons';
import { extractPalette } from '@/lib/colorExtraction';

interface ColorField { key: keyof BrandingOverrides; label: string; description: string; group: 'sidebar' | 'page' | 'cards' | 'text' | 'buttons'; icon: typeof PanelLeft; }

const COLOR_FIELDS: ColorField[] = [
  { key: 'nav_bg', label: 'Sidebar Background', description: 'Navigation sidebar background color', group: 'sidebar', icon: PanelLeft },
  { key: 'nav_text', label: 'Sidebar Text', description: 'Text color in the navigation sidebar', group: 'sidebar', icon: Type },
  { key: 'nav_accent', label: 'Active Item Highlight', description: 'Color of the selected nav item (defaults to your brand color)', group: 'sidebar', icon: MousePointer },
  { key: 'page_bg', label: 'Page Background', description: 'Main content area background', group: 'page', icon: LayoutDashboard },
  { key: 'card_bg', label: 'Card Background', description: 'Background color for cards and panels', group: 'cards', icon: Square },
  { key: 'card_border', label: 'Card Border', description: 'Border color for cards and panels', group: 'cards', icon: Square },
  { key: 'text_primary', label: 'Primary Text', description: 'Main body text color', group: 'text', icon: Type },
  { key: 'text_muted', label: 'Muted Text', description: 'Secondary/muted text color', group: 'text', icon: Type },
  { key: 'button_text', label: 'Button Text', description: 'Text color on primary-colored buttons', group: 'buttons', icon: MousePointer },
];

const GROUPS = [
  { key: 'sidebar', label: 'Sidebar / Navigation', icon: PanelLeft },
  { key: 'page', label: 'Page Background', icon: LayoutDashboard },
  { key: 'cards', label: 'Cards & Surfaces', icon: Square },
  { key: 'text', label: 'Text Colors', icon: Type },
  { key: 'buttons', label: 'Buttons', icon: MousePointer },
] as const;

function darken(hex: string, factor: number): string { const c = hex.replace('#', ''); const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - factor))); const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - factor))); const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - factor))); return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`; }
function lighten(hex: string, factor: number): string { const c = hex.replace('#', ''); const r = Math.min(255, Math.round(parseInt(c.substring(0, 2), 16) + (255 - parseInt(c.substring(0, 2), 16)) * factor)); const g = Math.min(255, Math.round(parseInt(c.substring(2, 4), 16) + (255 - parseInt(c.substring(2, 4), 16)) * factor)); const b = Math.min(255, Math.round(parseInt(c.substring(4, 6), 16) + (255 - parseInt(c.substring(4, 6), 16)) * factor)); return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`; }
function mixColors(hex1: string, hex2: string, weight: number): string { const c1 = hex1.replace('#', ''); const c2 = hex2.replace('#', ''); const r = Math.round(parseInt(c1.substring(0, 2), 16) * (1 - weight) + parseInt(c2.substring(0, 2), 16) * weight); const g = Math.round(parseInt(c1.substring(2, 4), 16) * (1 - weight) + parseInt(c2.substring(2, 4), 16) * weight); const b = Math.round(parseInt(c1.substring(4, 6), 16) * (1 - weight) + parseInt(c2.substring(4, 6), 16) * weight); return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`; }
function isLight(hex: string): boolean { const c = hex.replace('#', ''); const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5; }

interface PaletteRecipe { name: string; build: (primary: string, secondary: string, accent: string, isDark: boolean) => BrandingOverrides; }

const PALETTE_RECIPES: PaletteRecipe[] = [
  { name: 'Brand Sidebar', build: (p, s, a, dark) => ({ nav_bg: darken(p, 0.6), nav_text: '#ffffff', page_bg: dark ? '#0a0a0a' : '#f8f9fa', card_bg: dark ? darken(p, 0.85) : '#ffffff', card_border: dark ? darken(p, 0.7) : lighten(p, 0.85), text_primary: dark ? '#f0f0f0' : '#111827', text_muted: dark ? '#a0a0a0' : '#6b7280', button_text: isLight(p) ? '#050505' : '#ffffff' }) },
  { name: 'Secondary Nav', build: (p, s, a, dark) => ({ nav_bg: darken(s, 0.5), nav_text: '#ffffff', page_bg: dark ? '#070707' : '#fafafa', card_bg: dark ? darken(s, 0.8) : '#ffffff', card_border: dark ? darken(s, 0.65) : lighten(s, 0.8), text_primary: dark ? '#f5f5f5' : '#1a1a1a', text_muted: dark ? '#999999' : '#707070', button_text: isLight(p) ? '#050505' : '#ffffff' }) },
  { name: 'Accent Sidebar', build: (p, s, a, dark) => ({ nav_bg: darken(a, 0.55), nav_text: '#ffffff', page_bg: dark ? '#080808' : '#f9fafb', card_bg: dark ? darken(a, 0.82) : '#ffffff', card_border: dark ? darken(a, 0.68) : lighten(a, 0.82), text_primary: dark ? '#ebebeb' : '#111827', text_muted: dark ? '#a5a5a5' : '#6b7280', button_text: isLight(p) ? '#050505' : '#ffffff' }) },
  { name: 'Deep Brand', build: (p, s, a, dark) => ({ nav_bg: darken(p, 0.75), nav_text: lighten(p, 0.7), page_bg: dark ? darken(p, 0.9) : lighten(p, 0.95), card_bg: dark ? darken(p, 0.82) : '#ffffff', card_border: dark ? darken(p, 0.65) : lighten(p, 0.8), text_primary: dark ? lighten(p, 0.8) : darken(p, 0.7), text_muted: dark ? lighten(p, 0.5) : darken(p, 0.4), button_text: isLight(p) ? '#050505' : '#ffffff' }) },
  { name: 'Warm Blend', build: (p, s, a, dark) => ({ nav_bg: darken(mixColors(p, s, 0.5), 0.6), nav_text: '#ffffff', page_bg: dark ? '#0b0b0b' : lighten(a, 0.95), card_bg: dark ? darken(mixColors(p, a, 0.3), 0.8) : '#ffffff', card_border: dark ? darken(s, 0.6) : lighten(s, 0.8), text_primary: dark ? '#f0f0f0' : '#111827', text_muted: dark ? '#999999' : '#6b7280', button_text: isLight(p) ? '#050505' : '#ffffff' }) },
  { name: 'Soft Tint', build: (p, s, a, dark) => ({ nav_bg: dark ? darken(s, 0.7) : lighten(s, 0.9), nav_text: dark ? lighten(s, 0.7) : darken(s, 0.5), page_bg: dark ? '#060606' : lighten(p, 0.96), card_bg: dark ? darken(p, 0.88) : '#ffffff', card_border: dark ? darken(p, 0.7) : lighten(p, 0.85), text_primary: dark ? '#e8e8e8' : '#1a1a1a', text_muted: dark ? '#888888' : '#777777', button_text: isLight(p) ? '#050505' : '#ffffff' }) },
  { name: 'Bold Accent', build: (p, s, a, dark) => ({ nav_bg: darken(a, 0.65), nav_text: lighten(a, 0.75), page_bg: dark ? darken(s, 0.92) : lighten(s, 0.96), card_bg: dark ? darken(a, 0.85) : '#ffffff', card_border: dark ? darken(a, 0.6) : lighten(a, 0.8), text_primary: dark ? '#f0f0f0' : '#111827', text_muted: dark ? '#a0a0a0' : '#6b7280', button_text: isLight(p) ? '#050505' : '#ffffff' }) },
  { name: 'Midnight Brand', build: (p, s, a, dark) => ({ nav_bg: darken(p, 0.82), nav_text: a, page_bg: dark ? '#050508' : '#f7f8fa', card_bg: dark ? darken(p, 0.88) : '#ffffff', card_border: dark ? darken(p, 0.72) : lighten(p, 0.88), text_primary: dark ? '#e5e5e5' : '#111827', text_muted: dark ? '#909090' : '#6b7280', button_text: isLight(p) ? '#050505' : '#ffffff' }) },
  { name: 'Tri-Tone', build: (p, s, a, dark) => ({ nav_bg: darken(s, 0.65), nav_text: lighten(a, 0.6), page_bg: dark ? darken(p, 0.92) : lighten(a, 0.96), card_bg: dark ? darken(s, 0.83) : '#ffffff', card_border: dark ? mixColors(darken(p, 0.6), darken(a, 0.6), 0.5) : lighten(p, 0.82), text_primary: dark ? lighten(a, 0.7) : darken(s, 0.6), text_muted: dark ? lighten(s, 0.4) : darken(a, 0.3), button_text: isLight(p) ? '#050505' : '#ffffff' }) },
  { name: 'Clean Slate', build: (p, s, a, dark) => ({ nav_bg: dark ? '#111111' : '#ffffff', nav_text: dark ? '#e0e0e0' : '#333333', page_bg: dark ? '#080808' : '#f5f5f5', card_bg: dark ? '#141414' : '#ffffff', card_border: dark ? '#222222' : '#e0e0e0', text_primary: dark ? '#f0f0f0' : '#111111', text_muted: dark ? '#888888' : '#777777', button_text: isLight(p) ? '#050505' : '#ffffff' }) },
];

function ColorInput({ field, value, defaultValue, onChange, onClear, theme }: { field: ColorField; value: string | undefined; defaultValue: string; onChange: (key: keyof BrandingOverrides, val: string) => void; onClear: (key: keyof BrandingOverrides) => void; theme: ReturnType<typeof useTheme>; }) {
  const [inputValue, setInputValue] = useState(value || '');
  const isOverridden = !!value && isValidHex(value);
  const displayColor = isOverridden ? value : defaultValue;
  useEffect(() => { setInputValue(value || ''); }, [value]);
  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => { const hex = e.target.value; setInputValue(hex); onChange(field.key, hex); };
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => { let val = e.target.value; if (val && !val.startsWith('#')) { val = '#' + val; } setInputValue(val); if (isValidHex(val)) { onChange(field.key, val); } };
  const handleClear = () => { setInputValue(''); onClear(field.key); };
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors" style={{ backgroundColor: isOverridden ? theme.active : 'transparent', border: `1px solid ${isOverridden ? theme.primary30 : theme.border}` }}>
      <div className="relative flex-shrink-0"><div className="w-9 h-9 rounded-lg border cursor-pointer" style={{ backgroundColor: displayColor, borderColor: theme.border }} /><input type="color" value={displayColor.startsWith('#') ? displayColor : '#000000'} onChange={handleColorPickerChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title={`Pick ${field.label}`} /></div>
      <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-sm font-medium" style={{ color: theme.text }}>{field.label}</span>{isOverridden && (<span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: theme.primary15, color: theme.primary }}>Custom</span>)}</div><p className="text-xs mt-0.5 truncate" style={{ color: theme.textMuted }}>{field.description}</p></div>
      <input type="text" value={inputValue || ''} onChange={handleTextChange} placeholder={defaultValue} className="w-[90px] text-xs font-mono rounded-lg px-2 py-1.5 text-center outline-none transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} maxLength={7} />
      {isOverridden && (<button onClick={handleClear} className="flex-shrink-0 p-1.5 rounded-lg transition-colors" style={{ color: theme.textMuted }} title="Reset to default"><RotateCcw className="h-3.5 w-3.5" /></button>)}
    </div>
  );
}

function LivePreview({ previewTheme, primaryColor }: { previewTheme: ReturnType<typeof buildTheme>; primaryColor: string; }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: previewTheme.border }}>
      <div className="flex" style={{ height: '280px' }}>
        <div className="w-[140px] flex-shrink-0 flex flex-col p-3 gap-1.5" style={{ backgroundColor: previewTheme.sidebarBg, borderRight: `1px solid ${previewTheme.sidebarBorder}` }}>
          <div className="flex items-center gap-2 mb-3 px-1"><div className="w-6 h-6 rounded-md flex-shrink-0" style={{ backgroundColor: `${primaryColor}20` }} /><div className="h-2.5 rounded-full flex-1" style={{ backgroundColor: previewTheme.sidebarText, opacity: 0.6 }} /></div>
          {['Dashboard', 'Clients', 'Settings'].map((label, i) => (<div key={label} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={i === 0 ? { backgroundColor: previewTheme.sidebarActiveItemBg, color: previewTheme.sidebarActiveItemColor } : { color: previewTheme.sidebarText }}><div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: i === 0 ? previewTheme.sidebarActiveItemColor : previewTheme.sidebarText, opacity: i === 0 ? 1 : 0.5 }} /><span className="text-[10px] font-medium">{label}</span></div>))}
          <div className="flex-1" />
          <div className="rounded-lg px-2 py-1.5" style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}><span className="text-[9px]" style={{ color: `${primaryColor}99` }}>Plan</span><p className="text-[10px] font-medium" style={{ color: primaryColor }}>Enterprise</p></div>
        </div>
        <div className="flex-1 p-4" style={{ backgroundColor: previewTheme.bg }}>
          <div className="h-3 w-24 rounded-full mb-4" style={{ backgroundColor: previewTheme.text, opacity: 0.7 }} />
          <div className="grid grid-cols-2 gap-2.5">{[1, 2, 3, 4].map((n) => (<div key={n} className="rounded-lg p-3" style={{ backgroundColor: previewTheme.card, border: `1px solid ${previewTheme.border}` }}><div className="h-2 w-12 rounded-full mb-2" style={{ backgroundColor: previewTheme.textMuted, opacity: 0.5 }} /><div className="h-4 w-16 rounded-full mb-2" style={{ backgroundColor: previewTheme.text, opacity: 0.6 }} /><div className="h-1.5 w-full rounded-full" style={{ backgroundColor: previewTheme.border }} /></div>))}</div>
          <div className="mt-3 flex gap-2"><div className="rounded-lg px-3 py-1.5" style={{ backgroundColor: primaryColor, color: previewTheme.primaryText }}><span className="text-[10px] font-medium">Primary Button</span></div><div className="rounded-lg px-3 py-1.5" style={{ backgroundColor: previewTheme.card, border: `1px solid ${previewTheme.border}`, color: previewTheme.text }}><span className="text-[10px] font-medium">Secondary</span></div></div>
          <div className="mt-3"><p className="text-[10px] font-medium" style={{ color: previewTheme.text }}>Primary text looks like this</p><p className="text-[9px] mt-0.5" style={{ color: previewTheme.textMuted }}>Muted text looks like this</p></div>
        </div>
      </div>
    </div>
  );
}

export default function BrandingPage() {
  const { agency, branding, refreshAgency } = useAgency();
  const theme = useTheme();
  const { hasWhiteLabel } = usePlanFeatures();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  const [overrides, setOverrides] = useState<BrandingOverrides>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastShuffleIndex, setLastShuffleIndex] = useState(-1);
  const [switchingTheme, setSwitchingTheme] = useState(false);
  const [displayFont, setDisplayFont] = useState<string | null>(null);
  const [bodyFont, setBodyFont] = useState<string | null>(null);
  const [iconStyle, setIconStyle] = useState<string>('lucide');
  const [brandKit, setBrandKit] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [logoScale, setLogoScale] = useState<number>(1);

  useEffect(() => { if (agency?.branding_overrides) { setOverrides({ ...agency.branding_overrides }); } else { setOverrides({}); } }, [agency?.branding_overrides]);
  useEffect(() => { setLogoScale(clampLogoScale(agency?.branding_overrides?.logo_scale)); }, [agency?.branding_overrides]);
  useEffect(() => { setDisplayFont(agency?.display_font || null); setBodyFont(agency?.body_font || null); }, [agency?.display_font, agency?.body_font]);
  useEffect(() => { setIconStyle(agency?.icon_style || 'lucide'); setBrandKit(agency?.brand_kit || null); }, [agency?.icon_style, agency?.brand_kit]);

  // Regenerate the brand kit from the agency's logo (fonts + nav icon set + vibe).
  // Colors stay managed in the agency's own color settings, so we don't touch them.
  const analyzeBrand = async () => {
    const logoSrc = agency?.logo_url;
    if (!logoSrc || !agency?.id) return;
    setAnalyzing(true); setError(null);
    try {
      const palette = await extractPalette(logoSrc).catch(() => null);
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${backendUrl}/api/agency/${agency.id}/branding/analyze-logo`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ logo: logoSrc, palette, name: agency?.name || undefined }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success && d.kit) {
        const k = d.kit;
        if (k.fonts?.display) setDisplayFont(k.fonts.display);
        if (k.fonts?.body) setBodyFont(k.fonts.body);
        if (k.icon_style) setIconStyle(k.icon_style);
        setBrandKit(k); setSaved(false);
      }
    } catch { /* best effort; nothing changes on failure */ }
    finally { setAnalyzing(false); }
  };
  // Load the chosen fonts so the preview + picker render in them.
  useEffect(() => { const href = googleFontsHref([displayFont, bodyFont]); if (!href) return; const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link); return () => { if (link.parentNode) link.parentNode.removeChild(link); }; }, [displayFont, bodyFont]);

  const mode = agency?.website_theme !== 'light' ? 'dark' : 'light';
  const primaryColor = branding.primaryColor || '#00a19b';
  const secondaryColor = branding.secondaryColor || '#007e77';
  const accentColor = branding.accentColor || '#01f5d1';
  const previewTheme = useMemo(() => buildTheme(mode as 'dark' | 'light', primaryColor, overrides), [mode, primaryColor, overrides]);
  const defaultTheme = useMemo(() => buildTheme(mode as 'dark' | 'light', primaryColor), [mode, primaryColor]);
  const getDefaultForField = useCallback((key: keyof BrandingOverrides): string => { const map: Record<keyof BrandingOverrides, string> = { nav_bg: defaultTheme.sidebarBg, nav_text: defaultTheme.sidebarText, nav_accent: defaultTheme.sidebarActiveItemColor, page_bg: defaultTheme.bg, card_bg: defaultTheme.card, card_border: defaultTheme.border, button_text: defaultTheme.primaryText, text_primary: defaultTheme.text, text_muted: defaultTheme.textMuted }; return map[key] || '#000000'; }, [defaultTheme]);
  const hasChanges = useMemo(() => { const savedOverrides = agency?.branding_overrides || {}; for (const field of COLOR_FIELDS) { const savedVal = (savedOverrides as any)[field.key]; const currentVal = overrides[field.key]; if ((savedVal || '') !== (currentVal || '')) return true; } return false; }, [overrides, agency?.branding_overrides]);
  const activeCount = COLOR_FIELDS.filter(f => isValidHex(overrides[f.key])).length;

  const ddInput = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const ddUI: DropdownUI = { inputStyle: ddInput, text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark };
  const dispVal = displayFont || 'Sora';
  const bodyVal = bodyFont || 'Inter';
  const fontsChanged = (agency?.display_font || null) !== displayFont || (agency?.body_font || null) !== bodyFont;
  const kitChanged = (agency?.icon_style || 'lucide') !== iconStyle || JSON.stringify(agency?.brand_kit || null) !== JSON.stringify(brandKit || null);
  const logoScaleChanged = clampLogoScale(agency?.branding_overrides?.logo_scale) !== logoScale;
  const dirty = hasChanges || fontsChanged || kitChanged || logoScaleChanged;

  const handleShuffle = () => { const isDark = mode === 'dark'; let idx = Math.floor(Math.random() * PALETTE_RECIPES.length); if (PALETTE_RECIPES.length > 1) { while (idx === lastShuffleIndex) { idx = Math.floor(Math.random() * PALETTE_RECIPES.length); } } setLastShuffleIndex(idx); const recipe = PALETTE_RECIPES[idx]; const result = recipe.build(primaryColor, secondaryColor, accentColor, isDark); setOverrides(result); setSaved(false); setError(null); };
  const handleThemeSwitch = async (newMode: 'light' | 'dark') => { if (mode === newMode || !agency) return; setSwitchingTheme(true); setError(null); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ website_theme: newMode }) }); if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to update theme'); } await refreshAgency(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update theme mode'); } finally { setSwitchingTheme(false); } };
  const handleChange = (key: keyof BrandingOverrides, value: string) => { setOverrides(prev => ({ ...prev, [key]: value })); setSaved(false); setError(null); };
  const handleClear = (key: keyof BrandingOverrides) => { setOverrides(prev => { const next = { ...prev }; delete next[key]; return next; }); setSaved(false); setError(null); };
  const handleResetAll = () => { setOverrides({}); setSaved(false); setError(null); };
  const handleSave = async () => { if (!agency) return; setSaving(true); setError(null); setSaved(false); try { const token = localStorage.getItem('auth_token'); const cleanOverrides: BrandingOverrides = {}; for (const field of COLOR_FIELDS) { const val = overrides[field.key]; if (isValidHex(val)) { cleanOverrides[field.key] = val; } } if (logoScale > 1) { (cleanOverrides as any).logo_scale = Math.round(logoScale * 100) / 100; } const payload = { branding_overrides: Object.keys(cleanOverrides).length > 0 ? cleanOverrides : null, display_font: displayFont || null, body_font: bodyFont || null, icon_style: iconStyle || null, brand_kit: brandKit || null }; const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) }); if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to save branding'); } await refreshAgency(); setSaved(true); setTimeout(() => setSaved(false), 3000); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); } finally { setSaving(false); } };

  // ── LOCKED FOR FREE PLAN ────────────────────────────────────────────
  if (!hasWhiteLabel) {
    return (
      <LockedFeature title="Dashboard Branding" description="Customize your dashboard colors, sidebar, and theme to match your agency brand." requiredPlan="Pro"
        features={['Custom sidebar & page colors', 'Light/dark theme toggle', 'Auto-generate palettes from brand colors', 'Live preview']}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primary15 }}><Paintbrush className="h-5 w-5" style={{ color: theme.primary }} /></div><div><h1 className="text-xl sm:text-2xl font-bold" style={{ color: theme.text }}>Dashboard Branding</h1><p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>Customize colors for your agency and client dashboards</p></div></div>
          <div className="rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Moon className="h-4 w-4" style={{ color: theme.primary }} /></div><div><p className="text-sm font-medium" style={{ color: theme.text }}>Dashboard Theme</p><p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Applies to both your agency dashboard and all client dashboards</p></div></div></div>
          <div className="rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Sparkles className="h-4 w-4" style={{ color: theme.primary }} /></div><div><p className="text-sm font-medium" style={{ color: theme.text }}>Auto-generate a palette</p><p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Shuffles your brand colors into different arrangements</p></div></div></div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6"><div className="lg:col-span-3 space-y-5">{GROUPS.map((group) => (<div key={group.key} className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${theme.border}` }}><group.icon className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-sm font-semibold" style={{ color: theme.text }}>{group.label}</span></div><div className="p-3 space-y-2">{COLOR_FIELDS.filter(f => f.group === group.key).map(f => (<div key={f.key} className="flex items-center gap-3 rounded-xl px-3 py-3" style={{ border: `1px solid ${theme.border}` }}><div className="w-9 h-9 rounded-lg" style={{ backgroundColor: theme.textMuted, opacity: 0.3 }} /><div className="flex-1"><span className="text-sm font-medium" style={{ color: theme.text }}>{f.label}</span><p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{f.description}</p></div></div>))}</div></div>))}</div><div className="lg:col-span-2"><LivePreview previewTheme={previewTheme} primaryColor={primaryColor} /></div></div>
        </div>
      </LockedFeature>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"><div><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primary15 }}><Paintbrush className="h-5 w-5" style={{ color: theme.primary }} /></div><div><h1 className="text-xl sm:text-2xl font-bold" style={{ color: theme.text }}>Dashboard Branding</h1><p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>Customize colors for your agency and client dashboards</p></div></div></div><div className="flex items-center gap-2 flex-wrap">{activeCount > 0 && (<button onClick={handleResetAll} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}><RotateCcw className="h-4 w-4" />Reset All</button>)}<button onClick={handleSave} disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}</button></div></div>

      {error && (<div className="rounded-xl p-4 mb-6 flex items-center gap-3" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: theme.error }} /><p className="text-sm" style={{ color: theme.errorText }}>{error}</p></div>)}

      <div className="rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>{mode === 'dark' ? <Moon className="h-4 w-4" style={{ color: theme.primary }} /> : <Sun className="h-4 w-4" style={{ color: theme.primary }} />}</div><div><p className="text-sm font-medium" style={{ color: theme.text }}>Dashboard Theme</p><p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Applies to both your agency dashboard and all client dashboards</p></div></div><div className="flex items-center gap-1 rounded-xl p-1" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>{(['light', 'dark'] as const).map((m) => (<button key={m} onClick={() => handleThemeSwitch(m)} disabled={switchingTheme} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-70" style={{ backgroundColor: mode === m ? theme.primary : 'transparent', color: mode === m ? theme.primaryText : theme.textMuted }}>{m === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{m.charAt(0).toUpperCase() + m.slice(1)}{switchingTheme && mode !== m && <Loader2 className="h-3 w-3 animate-spin ml-1" />}</button>))}</div></div>

      <div className="rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Sparkles className="h-4.5 w-4.5" style={{ color: theme.primary }} /></div><div><p className="text-sm font-medium" style={{ color: theme.text }}>Auto-generate a palette</p><p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Shuffles your brand colors ({primaryColor}, {secondaryColor}, {accentColor}) into different arrangements. Press multiple times for different combos.</p></div></div><button onClick={handleShuffle} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><Shuffle className="h-4 w-4" />Shuffle</button></div>

      {/* Logo size: scale the nav logo. The top logo box grows to fit, the nav itself is unchanged. */}
      <div className="rounded-xl p-4 sm:p-5 mb-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Maximize2 className="h-4 w-4" style={{ color: theme.primary }} /></div>
          <p className="text-sm font-medium" style={{ color: theme.text }}>Logo size</p>
        </div>

        {agency?.logo_url ? (
          <>
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${theme.border}` }}>
              <div className="flex items-center px-5 py-3" style={{ minHeight: '64px', backgroundColor: theme.sidebarBg, borderBottom: `1px solid ${theme.sidebarBorder}` }}>
                <img src={agency.logo_url} alt="Logo preview" style={{ height: `${Math.round(32 * logoScale)}px`, width: 'auto', maxWidth: '100%' }} className="object-contain" />
              </div>
            </div>

            <style>{`
              input.logo-range { -webkit-appearance:none; appearance:none; height:6px; border-radius:999px; outline:none; cursor:pointer; background: linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor} var(--pct,0%), ${theme.border} var(--pct,0%), ${theme.border} 100%); }
              input.logo-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:18px; height:18px; border-radius:50%; background:${primaryColor}; border:3px solid ${theme.card}; box-shadow:0 1px 4px rgba(0,0,0,0.3); cursor:pointer; }
              input.logo-range::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:${primaryColor}; border:3px solid ${theme.card}; cursor:pointer; }
              input.logo-range::-moz-range-track { height:6px; border-radius:999px; background:transparent; }
            `}</style>
            <div className="flex items-center gap-4">
              <input
                type="range"
                className="logo-range flex-1"
                min={LOGO_SCALE_MIN}
                max={LOGO_SCALE_MAX}
                step={0.1}
                value={logoScale}
                onChange={(e) => { setLogoScale(clampLogoScale(Number(e.target.value))); setSaved(false); setError(null); }}
                style={{ ['--pct']: `${((logoScale - LOGO_SCALE_MIN) / (LOGO_SCALE_MAX - LOGO_SCALE_MIN)) * 100}%` } as unknown as React.CSSProperties}
                aria-label="Logo size"
              />
              <span className="text-sm font-medium tabular-nums w-12 text-right" style={{ color: theme.text }}>{logoScale.toFixed(1)}x</span>
            </div>
          </>
        ) : (
          <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>
            <span className="inline-flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Upload a logo in <Link href="/agency/settings?tab=profile" className="underline" style={{ color: theme.primary }}>Settings &rarr; Profile</Link> to size it here.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 min-w-0"><Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} /><div><span className="text-sm font-semibold" style={{ color: theme.text }}>Brand kit</span><p className="text-[11.5px]" style={{ color: theme.textMuted }}>Fonts and nav-icon style for your agency and client dashboards. Match them to your logo, or tweak below.</p></div></div>
              <button onClick={analyzeBrand} disabled={!agency?.logo_url || analyzing} title={agency?.logo_url ? 'Match fonts and icons to your logo' : 'Upload a logo first'} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium flex-shrink-0 disabled:opacity-50" style={ddInput}>
                {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate
              </button>
            </div>
            <div className="p-4">
              {analyzing && (<div className="flex items-center gap-2 text-[12.5px] mb-3" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Reading your logo and matching fonts and icons...</div>)}

              {brandKit?.vibe && ((brandKit.vibe.words && brandKit.vibe.words.length) || brandKit.vibe.description) && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">{(brandKit.vibe.words || []).map((w: string) => (<span key={w} className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-medium capitalize" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{w}</span>))}</div>
                  {brandKit.vibe.description && <p className="text-[12px]" style={{ color: theme.textMuted }}>{brandKit.vibe.description}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Display font (headlines + nav)</label>
                  <FontSelect value={dispVal} onChange={(v) => { setDisplayFont(v); setSaved(false); setError(null); }} slot="display" ui={ddUI} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Body font</label>
                  <FontSelect value={bodyVal} onChange={(v) => { setBodyFont(v); setSaved(false); setError(null); }} slot="body" ui={ddUI} />
                </div>
              </div>

              <div className="mt-3 rounded-xl p-4" style={ddInput}>
                <p style={{ fontFamily: fontStack(dispVal, 'display'), fontWeight: 700, fontSize: '1.35rem', color: theme.text, lineHeight: 1.1 }}>{agency?.name || 'Your Brand'}</p>
                <p className="mt-1" style={{ fontFamily: fontStack(bodyVal, 'body'), fontSize: '0.88rem', color: theme.textMuted }}>Clear headlines and readable body text, applied across your agency dashboard and all your client dashboards.</p>
              </div>

              <div className="mt-4">
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Nav icon set</label>
                <div className="grid grid-cols-3 gap-2">
                  {ICON_SETS.filter((s) => s.key !== 'none').map((s) => {
                    const on = iconStyle === s.key;
                    return (
                      <button key={s.key} onClick={() => { setIconStyle(s.key); setSaved(false); setError(null); }} title={s.note} className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 transition-colors" style={on ? { backgroundColor: theme.primary15, border: `1px solid ${theme.primary}55` } : { ...ddInput }}>
                        <span className="flex items-center justify-center gap-1.5 h-5" style={{ color: on ? theme.primary : theme.textMuted }}>{previewIcons(s.key).map((Ic, i) => <Ic key={i} size={18} />)}</span>
                        <span className="text-[11px] font-medium" style={{ color: on ? theme.primary : theme.textMuted }}>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => { setIconStyle('none'); setSaved(false); setError(null); }} className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 transition-colors" style={iconStyle === 'none' ? { backgroundColor: theme.primary15, border: `1px solid ${theme.primary}55` } : { ...ddInput }}>
                  <span className="text-[13px] font-semibold tracking-wide" style={{ color: iconStyle === 'none' ? theme.primary : theme.textMuted }}>Aa</span>
                  <span className="text-[12px] font-medium" style={{ color: iconStyle === 'none' ? theme.primary : theme.textMuted }}>Text only (no icons)</span>
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="flex items-center gap-2"><Paintbrush className="h-4 w-4" style={{ color: theme.textMuted }} /><span className="text-sm" style={{ color: theme.textMuted }}>{activeCount === 0 ? 'Using default theme colors' : `${activeCount} custom color${activeCount !== 1 ? 's' : ''} active`}</span></div><span className="text-xs px-2 py-1 rounded-full font-medium capitalize" style={{ backgroundColor: theme.primary10, color: theme.primary }}>{mode} mode</span></div>
          {GROUPS.map((group) => { const fields = COLOR_FIELDS.filter(f => f.group === group.key); const GroupIcon = group.icon; return (<div key={group.key} className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${theme.border}` }}><GroupIcon className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-sm font-semibold" style={{ color: theme.text }}>{group.label}</span></div><div className="p-3 space-y-2">{fields.map((field) => (<ColorInput key={field.key} field={field} value={overrides[field.key]} defaultValue={getDefaultForField(field.key)} onChange={handleChange} onClear={handleClear} theme={theme} />))}</div></div>); })}
        </div>
        <div className="lg:col-span-2"><div className="sticky top-6 space-y-4"><div className="flex items-center gap-2"><Eye className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-sm font-semibold" style={{ color: theme.text }}>Live Preview</span>{dirty && (<span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.warningBg, color: theme.warningText, border: `1px solid ${theme.warningBorder}` }}>Unsaved</span>)}</div><LivePreview previewTheme={previewTheme} primaryColor={primaryColor} /><div className="rounded-xl p-3" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}><p className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>Your brand colors</p><div className="flex gap-2">{[{ label: 'Primary', color: primaryColor }, { label: 'Secondary', color: secondaryColor }, { label: 'Accent', color: accentColor }].map(({ label, color }) => (<div key={label} className="flex items-center gap-1.5 flex-1"><div className="w-5 h-5 rounded-md flex-shrink-0 border" style={{ backgroundColor: color, borderColor: theme.border }} /><div><p className="text-[10px] font-medium" style={{ color: theme.text }}>{label}</p><p className="text-[9px] font-mono" style={{ color: theme.textMuted }}>{color}</p></div></div>))}</div></div><div className="rounded-xl p-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}><p className="text-xs leading-relaxed" style={{ color: theme.infoText }}>Changes apply to both your agency dashboard and all your client dashboards. Use Shuffle to auto-arrange your brand colors, then fine-tune individual fields.</p></div></div></div>
      </div>
    </div>
  );
}