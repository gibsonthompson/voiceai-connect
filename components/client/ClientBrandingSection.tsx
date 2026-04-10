'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Palette, Loader2, Check, Sparkles, RotateCcw, Trash2, ChevronDown, Sun, Moon } from 'lucide-react';
import { extractColorsFromImage } from '@/lib/colorExtraction';
import { useClient } from '@/lib/client-context';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isValidHex(val: string): boolean {
  return /^#([0-9A-Fa-f]{6})$/.test(val);
}

function safeHex(val: string | undefined | null, fallback: string = '#888888'): string {
  if (!val) return fallback;
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) return val;
  if (/^#[0-9A-Fa-f]{3}$/.test(val)) {
    const c = val.replace('#', '');
    return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
  }
  return fallback;
}

function darkenHex(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getContrastText(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#111827' : '#ffffff';
}

// ============================================================================
// COLOR PICKER — uses local state so the native picker doesn't close on change
// ============================================================================
function ColorPicker({ label, value, onChange, fallback, description }: {
  label: string; value: string; onChange: (v: string) => void; fallback: string; description?: string;
}) {
  const [localColor, setLocalColor] = useState(value);
  const [localText, setLocalText] = useState(value);
  const textRef = useRef<HTMLInputElement>(null);

  // Sync from parent when value changes externally
  useEffect(() => { setLocalColor(value); setLocalText(value); }, [value]);

  const commitColor = useCallback((hex: string) => {
    if (hex && isValidHex(hex)) {
      onChange(hex);
    } else if (!hex) {
      onChange('');
    }
  }, [onChange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-medium" style={{ color: 'var(--tm, #6b7280)' }}>{label}</p>
        {value && <button onClick={() => { setLocalColor(''); setLocalText(''); onChange(''); }} className="text-[10px]" style={{ color: 'var(--tm4, #9ca3af)' }}>Clear</button>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeHex(localColor, safeHex(fallback))}
          onChange={(e) => {
            setLocalColor(e.target.value);
            setLocalText(e.target.value);
          }}
          onBlur={() => commitColor(localColor)}
          // Also commit on change for browsers that only fire onChange on close
          onInput={(e) => {
            const val = (e.target as HTMLInputElement).value;
            setLocalColor(val);
            setLocalText(val);
          }}
          onPointerUp={() => setTimeout(() => commitColor(localColor), 50)}
          className="w-9 h-9 rounded-lg border cursor-pointer flex-shrink-0"
          style={{ borderColor: 'var(--border, #e5e7eb)' }}
        />
        <input
          ref={textRef}
          type="text"
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={() => commitColor(localText)}
          onKeyDown={(e) => { if (e.key === 'Enter') commitColor(localText); }}
          placeholder={fallback}
          className="flex-1 min-w-0 rounded-lg border px-2 py-1.5 text-[11px] font-mono focus:outline-none"
          style={{ borderColor: 'var(--iborder, #e5e7eb)', backgroundColor: 'var(--input, #fff)', color: 'var(--text, #111)' }}
        />
      </div>
      {description && <p className="text-[9px] mt-1" style={{ color: 'var(--tm4, #9ca3af)' }}>{description}</p>}
    </div>
  );
}

interface BrandingOverrides {
  nav_bg?: string; nav_text?: string; button_text?: string;
  page_bg?: string; card_bg?: string; card_border?: string;
  theme?: 'light' | 'dark';
}

interface ClientBrandingSectionProps {
  clientId: string;
  theme: any;
}

export default function ClientBrandingSection({ clientId, theme }: ClientBrandingSectionProps) {
  const { client, branding, refreshClient } = useClient();

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');

  const [navBg, setNavBg] = useState('');
  const [navText, setNavText] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [pageBg, setPageBg] = useState('');
  const [cardBg, setCardBg] = useState('');
  const [cardBorder, setCardBorder] = useState('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | ''>('');

  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // CSS variables for child components
  const cssVars = {
    '--tm': theme.textMuted, '--tm4': theme.textMuted4, '--border': theme.border,
    '--iborder': theme.inputBorder, '--input': theme.input, '--text': theme.text,
  } as React.CSSProperties;

  useEffect(() => {
    if (client) {
      setPrimaryColor(client.primary_color || '');
      setSecondaryColor(client.secondary_color || '');
      setAccentColor(client.accent_color || '');
      const ov = (client as any).branding_overrides as BrandingOverrides | null;
      if (ov) {
        setNavBg(ov.nav_bg || '');
        setNavText(ov.nav_text || '');
        setButtonText(ov.button_text || '');
        setPageBg(ov.page_bg || '');
        setCardBg(ov.card_bg || '');
        setCardBorder(ov.card_border || '');
        setThemeMode(ov.theme || '');
        if (ov.nav_bg || ov.page_bg || ov.card_bg) setAdvancedOpen(true);
      }
    }
  }, [client]);

  // ========================================================================
  // AUTO-DERIVE: When primary changes, auto-populate nav/button/page colors
  // Only auto-fill if the field is currently empty (user hasn't manually set it)
  // ========================================================================
  const prevPrimaryRef = useRef('');
  useEffect(() => {
    if (!primaryColor || !isValidHex(primaryColor)) return;
    if (prevPrimaryRef.current === primaryColor) return;
    const isFirstSet = !prevPrimaryRef.current;
    prevPrimaryRef.current = primaryColor;

    // Only auto-derive if fields are empty (not manually overridden)
    if (!navBg || isFirstSet) setNavBg(darkenHex(primaryColor, 0.7));
    if (!navText || isFirstSet) setNavText(getContrastText(darkenHex(primaryColor, 0.7)));
    if (!buttonText || isFirstSet) setButtonText(getContrastText(primaryColor));
  }, [primaryColor]);

  useEffect(() => {
    if (!client) return;
    const ov = (client as any).branding_overrides as BrandingOverrides | null;
    const changed =
      logoPreview !== null ||
      primaryColor !== (client.primary_color || '') ||
      secondaryColor !== (client.secondary_color || '') ||
      accentColor !== (client.accent_color || '') ||
      navBg !== (ov?.nav_bg || '') ||
      navText !== (ov?.nav_text || '') ||
      buttonText !== (ov?.button_text || '') ||
      pageBg !== (ov?.page_bg || '') ||
      cardBg !== (ov?.card_bg || '') ||
      cardBorder !== (ov?.card_border || '') ||
      themeMode !== (ov?.theme || '');
    setHasChanges(changed);
  }, [logoPreview, primaryColor, secondaryColor, accentColor, navBg, navText, buttonText, pageBg, cardBg, cardBorder, themeMode, client]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl);
      setExtracting(true);
      try {
        const result = await extractColorsFromImage(dataUrl);
        prevPrimaryRef.current = ''; // Reset so auto-derive triggers
        setPrimaryColor(result.primary);
        setSecondaryColor(result.secondary);
        setAccentColor(result.accent);
        setMessage('');
      } catch (err) { console.error('Color extraction failed:', err); }
      finally { setExtracting(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => { setLogoPreview('__remove__'); setMessage(''); };
  const handleClearAll = () => {
    setPrimaryColor(''); setSecondaryColor(''); setAccentColor('');
    setNavBg(''); setNavText(''); setButtonText('');
    setPageBg(''); setCardBg(''); setCardBorder(''); setThemeMode('');
    prevPrimaryRef.current = '';
  };

  const handleSave = async () => {
    setSaving(true); setMessage('');
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

      const body: Record<string, any> = {};
      if (logoPreview === '__remove__') body.logo_url = null;
      else if (logoPreview) body.logo_url = logoPreview;

      body.primary_color = primaryColor || null;
      body.secondary_color = secondaryColor || null;
      body.accent_color = accentColor || null;

      const overrides: BrandingOverrides = {};
      if (navBg) overrides.nav_bg = navBg;
      if (navText) overrides.nav_text = navText;
      if (buttonText) overrides.button_text = buttonText;
      if (pageBg) overrides.page_bg = pageBg;
      if (cardBg) overrides.card_bg = cardBg;
      if (cardBorder) overrides.card_border = cardBorder;
      if (themeMode) overrides.theme = themeMode;
      body.branding_overrides = Object.keys(overrides).length > 0 ? overrides : null;

      const response = await fetch(`${backendUrl}/api/client/${clientId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Branding updated! Reloading...');
        setLogoPreview(null);
        setTimeout(() => window.location.reload(), 600);
      } else {
        setMessage(data.error || 'Failed to save branding');
      }
    } catch (error) {
      console.error('Save branding error:', error);
      setMessage('Error saving branding');
    } finally { setSaving(false); }
  };

  const currentLogo = logoPreview === '__remove__' ? null : (logoPreview || client?.logo_url || null);
  const hasLogo = !!currentLogo;
  const agencyPrimary = client?.agency?.primary_color || '#3b82f6';
  const effectivePrimary = safeHex(primaryColor, agencyPrimary);

  return (
    <section className="mb-4 sm:mb-6" style={cssVars}>
      <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Palette className="w-4 h-4" style={{ color: theme.primary }} /> Branding
      </h2>

      <div className="rounded-xl border p-4 sm:p-5 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
        {message && (
          <div className="mb-4 p-3 rounded-lg text-sm font-medium text-center"
            style={message.includes('updated') || message.includes('Reloading')
              ? { backgroundColor: theme.successBg, color: theme.successText, border: `1px solid ${theme.successBorder}` }
              : { backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }
            }>{message}</div>
        )}

        {/* LOGO */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>Logo</label>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ width: '72px', height: '72px', borderRadius: '16px', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6', border: `2px dashed ${hasLogo ? 'transparent' : theme.border}` }}>
              {hasLogo ? <img src={currentLogo!} alt="Logo" className="w-full h-full object-contain p-2" /> : <Upload className="w-6 h-6" style={{ color: theme.textMuted4 }} />}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80"
                  style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08), color: theme.primary }}>
                  <Upload className="w-3.5 h-3.5" /> {hasLogo ? 'Change' : 'Upload'}
                </span>
              </label>
              {hasLogo && logoPreview !== '__remove__' && (
                <button onClick={handleRemoveLogo} className="inline-flex items-center gap-1.5 text-xs transition hover:opacity-80" style={{ color: theme.error }}>
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
            {extracting && <div className="flex items-center gap-2 text-xs" style={{ color: theme.primary }}><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting...</div>}
          </div>
        </div>

        {/* BRAND COLORS — primary auto-derives nav/button colors */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Brand Colors</label>
            {(primaryColor || secondaryColor || accentColor) && (
              <button onClick={handleClearAll} className="inline-flex items-center gap-1 text-[10px] font-medium transition hover:opacity-80" style={{ color: theme.textMuted4 }}>
                <RotateCcw className="w-3 h-3" /> Reset all
              </button>
            )}
          </div>
          <p className="text-[10px] mb-3" style={{ color: theme.textMuted4 }}>Primary color automatically sets your nav and button colors. Adjust individually below if needed.</p>
          <div className="grid grid-cols-3 gap-3">
            <ColorPicker label="Primary" value={primaryColor} onChange={setPrimaryColor} fallback={agencyPrimary} description="Buttons, links, accents" />
            <ColorPicker label="Secondary" value={secondaryColor} onChange={setSecondaryColor} fallback={client?.agency?.secondary_color || '#1e40af'} />
            <ColorPicker label="Accent" value={accentColor} onChange={setAccentColor} fallback={client?.agency?.accent_color || '#60a5fa'} />
          </div>
        </div>

        {/* APPEARANCE OVERRIDES */}
        <div className="mb-5">
          <button onClick={() => setAdvancedOpen(!advancedOpen)} className="flex items-center justify-between w-full py-2 text-left"
            style={{ borderTop: `1px solid ${theme.border}`, marginTop: '4px', paddingTop: '16px' }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Appearance Details</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} style={{ color: theme.textMuted4 }} />
          </button>

          {advancedOpen && (
            <div className="mt-4 space-y-5">
              {/* Theme */}
              <div>
                <p className="text-[11px] font-medium mb-2" style={{ color: theme.textMuted }}>Theme Mode</p>
                <div className="flex gap-2">
                  {([
                    { value: '' as const, label: 'Agency Default', icon: null },
                    { value: 'dark' as const, label: 'Dark', icon: Moon },
                    { value: 'light' as const, label: 'Light', icon: Sun },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => setThemeMode(opt.value)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                      style={{
                        backgroundColor: themeMode === opt.value ? hexToRgba(theme.primary, 0.12) : theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                        color: themeMode === opt.value ? theme.primary : theme.textMuted,
                        border: `1px solid ${themeMode === opt.value ? hexToRgba(theme.primary, 0.3) : 'transparent'}`,
                      }}>
                      {opt.icon && <opt.icon className="w-3.5 h-3.5" />} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nav */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>Navigation</p>
                <div className="grid grid-cols-2 gap-3">
                  <ColorPicker label="Nav Background" value={navBg} onChange={setNavBg} fallback={darkenHex(effectivePrimary, 0.7)} description="Auto-derived from primary" />
                  <ColorPicker label="Nav Text" value={navText} onChange={setNavText} fallback="#ffffff" description="Menu items" />
                </div>
              </div>

              {/* Buttons */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>Buttons</p>
                <div className="grid grid-cols-2 gap-3">
                  <ColorPicker label="Button Text" value={buttonText} onChange={setButtonText} fallback={getContrastText(effectivePrimary)} description="Auto-derived from primary" />
                  <div className="flex items-end pb-1">
                    <p className="text-[10px] leading-relaxed" style={{ color: theme.textMuted4 }}>Button background = your Primary color</p>
                  </div>
                </div>
              </div>

              {/* Page */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>Page & Cards</p>
                <div className="grid grid-cols-3 gap-3">
                  <ColorPicker label="Page Background" value={pageBg} onChange={setPageBg} fallback={theme.isDark ? '#0a0a0a' : '#f9fafb'} />
                  <ColorPicker label="Card Background" value={cardBg} onChange={setCardBg} fallback={theme.isDark ? '#111111' : '#ffffff'} />
                  <ColorPicker label="Card Border" value={cardBorder} onChange={setCardBorder} fallback={theme.isDark ? '#1a1a1a' : '#e5e7eb'} />
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl p-4" style={{ backgroundColor: safeHex(pageBg, theme.isDark ? '#0a0a0a' : '#f9fafb'), border: `1px solid ${safeHex(cardBorder, '#1a1a1a')}` }}>
                <p className="text-[10px] uppercase tracking-wider font-medium mb-3" style={{ color: theme.textMuted4 }}>Preview</p>
                <div className="flex gap-2 mb-3">
                  <div className="rounded-lg p-2.5 flex-1" style={{ backgroundColor: safeHex(navBg, darkenHex(effectivePrimary, 0.7)) }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: effectivePrimary }} />
                      <span className="text-[10px] font-semibold" style={{ color: safeHex(navText, '#ffffff') }}>Dashboard</span>
                    </div>
                    <span className="text-[9px] block mt-1 opacity-50" style={{ color: safeHex(navText, '#ffffff') }}>Calls</span>
                  </div>
                  <div className="rounded-lg p-2.5 flex-[2]" style={{ backgroundColor: safeHex(cardBg, '#111111'), border: `1px solid ${safeHex(cardBorder, '#1a1a1a')}` }}>
                    <span className="text-[10px]" style={{ color: theme.isDark ? '#fafaf9' : '#111827' }}>Card content</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="rounded-lg px-3 py-1.5 text-[10px] font-semibold"
                    style={{ backgroundColor: effectivePrimary, color: safeHex(buttonText, getContrastText(effectivePrimary)) }}>
                    Primary Button
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SAVE */}
        <button onClick={handleSave} disabled={saving || !hasChanges}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: hasChanges ? theme.primary : theme.bg, color: hasChanges ? theme.primaryText : theme.textMuted4, border: hasChanges ? 'none' : `1px solid ${theme.border}` }}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : hasChanges ? <><Check className="w-4 h-4" /> Save Branding</> : 'No Changes'}
        </button>
      </div>
    </section>
  );
}