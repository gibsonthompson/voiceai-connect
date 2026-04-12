'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Palette, Upload, Loader2, ChevronDown, RotateCcw, Eye,
  Sun, Moon, Check, Paintbrush
} from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { extractColorsFromImage } from '@/lib/colorExtraction';

// ============================================================================
// HELPERS
// ============================================================================

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '').trim();
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isValidHex(val: string | null | undefined): val is string {
  if (!val) return false;
  return /^#[0-9A-Fa-f]{6}$/.test(val.trim());
}

function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '').trim();
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function contrastText(hex: string): string {
  const c = hex.replace('#', '').trim();
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#111827' : '#ffffff';
}

function isLight(hex: string): boolean {
  const c = hex.replace('#', '').trim();
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

// ============================================================================
// COLOR PICKER — uses local state so native picker doesn't close on every change
// ============================================================================

function ColorPicker({ 
  label, value, onChange, previewDerived, theme 
}: { 
  label: string; 
  value: string; 
  onChange: (hex: string) => void; 
  previewDerived?: string;
  theme: any;
}) {
  const [localColor, setLocalColor] = useState(value || '#3b82f6');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isValidHex(value)) setLocalColor(value);
  }, [value]);

  const handleChange = (hex: string) => {
    setLocalColor(hex);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(hex), 80);
  };

  const displayColor = isValidHex(localColor) ? localColor : '#3b82f6';

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div 
          className="w-8 h-8 rounded-lg flex-shrink-0 border"
          style={{ 
            backgroundColor: displayColor,
            borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }} 
        />
        <div className="min-w-0">
          <p className="text-[12px] font-medium" style={{ color: theme.text }}>{label}</p>
          {previewDerived && !isValidHex(value) && (
            <p className="text-[10px]" style={{ color: theme.textMuted4 }}>Auto: {previewDerived}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={localColor}
          onChange={(e) => {
            const v = e.target.value;
            setLocalColor(v);
            if (isValidHex(v)) onChange(v);
          }}
          className="w-[80px] px-2 py-1 text-[11px] font-mono rounded-lg text-center focus:outline-none"
          style={{
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
            border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            color: theme.text,
          }}
        />
        <input
          type="color"
          value={displayColor}
          onChange={(e) => handleChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
          style={{ backgroundColor: 'transparent' }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  clientId: string;
  theme: any;
}

export default function ClientBrandingSection({ clientId, theme }: Props) {
  const { client, branding, refreshClient } = useClient();

  // ── State: brand colors ───────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState(client?.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(client?.primary_color || branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(client?.secondary_color || branding.secondaryColor);
  const [accentColor, setAccentColor] = useState(client?.accent_color || branding.accentColor);

  // ── State: advanced overrides (flat columns) ──────────────────────
  const [navBg, setNavBg] = useState(client?.nav_bg || '');
  const [navText, setNavText] = useState(client?.nav_text || '');
  const [buttonText, setButtonText] = useState(client?.button_text || '');
  const [pageBg, setPageBg] = useState(client?.page_bg || '');
  const [cardBg, setCardBg] = useState(client?.card_bg || '');
  const [cardBorder, setCardBorder] = useState(client?.card_border || '');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | ''>(
    (client?.theme_mode as 'light' | 'dark') || ''
  );

  // ── UI state ──────────────────────────────────────────────────────
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sync from client when data refreshes ──────────────────────────
  useEffect(() => {
    if (client) {
      setLogoUrl(client.logo_url || '');
      setPrimaryColor(client.primary_color || branding.primaryColor);
      setSecondaryColor(client.secondary_color || branding.secondaryColor);
      setAccentColor(client.accent_color || branding.accentColor);
      setNavBg(client.nav_bg || '');
      setNavText(client.nav_text || '');
      setButtonText(client.button_text || '');
      setPageBg(client.page_bg || '');
      setCardBg(client.card_bg || '');
      setCardBorder(client.card_border || '');
      setThemeMode((client.theme_mode as 'light' | 'dark') || '');
    }
  }, [client?.id]);

  // ── Derived preview values (what the theme hook would compute) ────
  const previewPrimary = isValidHex(primaryColor) ? primaryColor : '#3b82f6';
  const derivedNavBg = darken(previewPrimary, 0.65);
  const derivedNavText = contrastText(derivedNavBg);
  const derivedButtonText = contrastText(previewPrimary);
  const effectiveNavBg = isValidHex(navBg) ? navBg : derivedNavBg;
  const effectiveNavText = isValidHex(navText) ? navText : derivedNavText;

  // ── Logo upload ───────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('❌ Please upload an image file');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ Image must be under 5MB');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setUploading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const token = localStorage.getItem('auth_token');
      
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('clientId', clientId);

      const response = await fetch(`${backendUrl}/api/upload/logo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      if (data.url) {
        setLogoUrl(data.url);

        // Auto-extract brand colors from logo
        try {
          const colors = await extractColorsFromImage(data.url);
          if (colors?.primary && isValidHex(colors.primary)) {
            setPrimaryColor(colors.primary);
            if (colors.secondary && isValidHex(colors.secondary)) setSecondaryColor(colors.secondary);
            if (colors.accent && isValidHex(colors.accent)) setAccentColor(colors.accent);
            setMessage('✅ Logo uploaded! Colors extracted automatically');
          } else {
            setMessage('✅ Logo uploaded');
          }
        } catch {
          setMessage('✅ Logo uploaded');
        }
      }
    } catch (err) {
      setMessage('❌ Failed to upload logo');
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // ── Save all branding ─────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const token = localStorage.getItem('auth_token');

      const body: Record<string, any> = {
        logo_url: logoUrl || null,
        primary_color: isValidHex(primaryColor) ? primaryColor.trim() : null,
        secondary_color: isValidHex(secondaryColor) ? secondaryColor.trim() : null,
        accent_color: isValidHex(accentColor) ? accentColor.trim() : null,
        nav_bg: isValidHex(navBg) ? navBg.trim() : null,
        nav_text: isValidHex(navText) ? navText.trim() : null,
        button_text: isValidHex(buttonText) ? buttonText.trim() : null,
        page_bg: isValidHex(pageBg) ? pageBg.trim() : null,
        card_bg: isValidHex(cardBg) ? cardBg.trim() : null,
        card_border: isValidHex(cardBorder) ? cardBorder.trim() : null,
        theme_mode: themeMode || null,
      };

      const response = await fetch(`${backendUrl}/api/client/${clientId}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Branding saved!');
        // Update localStorage cache so theme updates immediately
        try {
          const cached = localStorage.getItem('client');
          if (cached) {
            const parsed = JSON.parse(cached);
            Object.assign(parsed, data.client || body);
            localStorage.setItem('client', JSON.stringify(parsed));
          }
        } catch {}
        // Refresh context so theme hook recalculates
        await refreshClient();
      } else {
        setMessage(`❌ ${data.error || 'Failed to save'}`);
      }
    } catch (err) {
      setMessage('❌ Error saving branding');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // ── Reset advanced to auto-derived ────────────────────────────────
  const handleResetAdvanced = () => {
    setNavBg('');
    setNavText('');
    setButtonText('');
    setPageBg('');
    setCardBg('');
    setCardBorder('');
    setThemeMode('');
  };

  const hasAdvancedOverrides = navBg || navText || buttonText || pageBg || cardBg || cardBorder || themeMode;

  // ── Glass card style ──────────────────────────────────────────────
  const glass = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
    WebkitBackdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
  };

  return (
    <section className="mb-4 sm:mb-6">
      <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Palette className="w-4 h-4" style={{ color: theme.primary }} />
        Branding
      </h2>

      <div className="rounded-xl border p-4 sm:p-5 shadow-sm space-y-5" style={{ borderColor: theme.border, backgroundColor: theme.card }}>

        {/* Status message */}
        {message && (
          <div
            className="p-3 rounded-xl text-center font-medium text-sm"
            style={message.includes('✅')
              ? { backgroundColor: theme.successBg, color: theme.successText, border: `1px solid ${theme.successBorder}` }
              : { backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }
            }
          >
            {message}
          </div>
        )}

        {/* ── Logo Upload ──────────────────────────────────────────── */}
        <div>
          <label className="text-[12px] font-semibold uppercase tracking-wider block mb-2" style={{ color: theme.textMuted }}>
            Logo
          </label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6', border: `1px solid ${theme.border}` }}
              >
                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6', border: `1px dashed ${theme.border}` }}
              >
                <Upload className="w-5 h-5" style={{ color: theme.textMuted4 }} />
              </div>
            )}
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}
              >
                {uploading ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Uploading...</> : 'Upload Logo'}
              </button>
              <p className="text-[10px] mt-1" style={{ color: theme.textMuted4 }}>
                PNG, JPG, or SVG · Max 5MB · Colors auto-extracted
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </div>
        </div>

        {/* ── Brand Colors ─────────────────────────────────────────── */}
        <div>
          <label className="text-[12px] font-semibold uppercase tracking-wider block mb-3" style={{ color: theme.textMuted }}>
            Brand Colors
          </label>
          <div className="space-y-3">
            <ColorPicker label="Primary Color" value={primaryColor} onChange={setPrimaryColor} theme={theme} />
            <ColorPicker label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} theme={theme} />
            <ColorPicker label="Accent Color" value={accentColor} onChange={setAccentColor} theme={theme} />
          </div>
          <p className="text-[10px] mt-2" style={{ color: theme.textMuted4 }}>
            Primary color auto-derives your nav background, nav text, and button text.
          </p>
        </div>

        {/* ── Advanced Appearance ───────────────────────────────────── */}
        <div>
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center gap-2">
              <Paintbrush className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
              <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                Advanced Appearance
              </span>
              {hasAdvancedOverrides && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: hexToRgba(theme.primary, 0.12), color: theme.primary }}>
                  CUSTOM
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
              style={{ color: theme.textMuted4 }}
            />
          </button>

          {advancedOpen && (
            <div className="mt-4 space-y-4">
              {/* Theme Mode */}
              <div>
                <label className="text-[11px] font-medium block mb-2" style={{ color: theme.textMuted }}>Theme Mode</label>
                <div className="flex gap-2">
                  {[
                    { value: '', label: 'Auto', icon: null },
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setThemeMode(opt.value as any)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition"
                      style={{
                        backgroundColor: themeMode === opt.value
                          ? hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08)
                          : theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                        color: themeMode === opt.value ? theme.primary : theme.textMuted,
                        border: `1px solid ${themeMode === opt.value ? hexToRgba(theme.primary, 0.3) : 'transparent'}`,
                      }}
                    >
                      {opt.icon && <opt.icon className="w-3 h-3" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] mt-1" style={{ color: theme.textMuted4 }}>Auto inherits from agency setting</p>
              </div>

              {/* Nav Colors */}
              <div>
                <label className="text-[11px] font-medium block mb-2" style={{ color: theme.textMuted }}>Navigation</label>
                <div className="space-y-2.5">
                  <ColorPicker label="Nav Background" value={navBg} onChange={setNavBg} previewDerived={derivedNavBg} theme={theme} />
                  <ColorPicker label="Nav Text" value={navText} onChange={setNavText} previewDerived={derivedNavText} theme={theme} />
                </div>
              </div>

              {/* Button */}
              <div>
                <label className="text-[11px] font-medium block mb-2" style={{ color: theme.textMuted }}>Buttons</label>
                <ColorPicker label="Button Text" value={buttonText} onChange={setButtonText} previewDerived={derivedButtonText} theme={theme} />
              </div>

              {/* Page */}
              <div>
                <label className="text-[11px] font-medium block mb-2" style={{ color: theme.textMuted }}>Page</label>
                <div className="space-y-2.5">
                  <ColorPicker label="Page Background" value={pageBg} onChange={setPageBg} theme={theme} />
                  <ColorPicker label="Card Background" value={cardBg} onChange={setCardBg} theme={theme} />
                  <ColorPicker label="Card Border" value={cardBorder} onChange={setCardBorder} theme={theme} />
                </div>
              </div>

              {/* Reset */}
              {hasAdvancedOverrides && (
                <button
                  onClick={handleResetAdvanced}
                  className="flex items-center gap-1.5 text-[11px] font-medium"
                  style={{ color: theme.textMuted4 }}
                >
                  <RotateCcw className="w-3 h-3" /> Reset to auto-derived
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Live Preview ─────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setPreviewOpen(!previewOpen)}
            className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider"
            style={{ color: theme.textMuted }}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Preview
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${previewOpen ? 'rotate-180' : ''}`} />
          </button>

          {previewOpen && (
            <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: theme.border }}>
              {/* Preview Nav */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ backgroundColor: effectiveNavBg }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-7 w-7 rounded-lg object-contain" />
                ) : (
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: effectiveNavText }}
                  >
                    {(client?.business_name || 'B').charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium" style={{ color: effectiveNavText }}>
                  {client?.business_name || 'Your Business'}
                </span>
              </div>
              {/* Preview nav items */}
              <div className="px-3 py-2" style={{ backgroundColor: effectiveNavBg }}>
                {['Dashboard', 'Calls', 'Settings'].map((item, i) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium mb-0.5"
                    style={{
                      backgroundColor: i === 0 ? hexToRgba(previewPrimary, 0.15) : 'transparent',
                      color: i === 0 ? previewPrimary : (isLight(effectiveNavBg) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'),
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
              {/* Preview content area */}
              <div
                className="p-4 space-y-2"
                style={{
                  backgroundColor: isValidHex(pageBg) ? pageBg : (themeMode === 'light' ? '#f9fafb' : themeMode === 'dark' ? '#0a0a0a' : theme.bg),
                }}
              >
                <div
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: isValidHex(cardBg) ? cardBg : (theme.isDark ? '#111111' : '#ffffff'),
                    border: `1px solid ${isValidHex(cardBorder) ? cardBorder : theme.border}`,
                  }}
                >
                  <p className="text-[11px] font-medium" style={{ color: theme.text }}>Sample Card</p>
                  <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>This shows your card and page colors</p>
                </div>
                <button
                  className="w-full py-2 rounded-lg text-[11px] font-semibold"
                  style={{
                    backgroundColor: previewPrimary,
                    color: isValidHex(buttonText) ? buttonText : derivedButtonText,
                  }}
                >
                  Sample Button
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Reset to Agency Defaults ──────────────────────────────── */}
        {(isValidHex(primaryColor) && primaryColor !== branding.primaryColor) || logoUrl || navBg || navText || buttonText || pageBg || cardBg || cardBorder || themeMode ? (
          <button
            onClick={() => {
              // Clear all client-level overrides
              setLogoUrl('');
              setPrimaryColor(client?.agency?.primary_color || '#3b82f6');
              setSecondaryColor(client?.agency?.secondary_color || '#1e40af');
              setAccentColor(client?.agency?.accent_color || '#60a5fa');
              handleResetAdvanced();
            }}
            className="w-full py-2 rounded-xl text-xs font-medium transition hover:opacity-80 flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
              color: theme.textMuted,
              border: `1px solid ${theme.border}`,
            }}
          >
            <RotateCcw className="w-3 h-3" /> Reset to Agency Defaults
          </button>
        ) : null}

        {/* ── Save Button ──────────────────────────────────────────── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: theme.primary, color: theme.primaryText }}
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Branding</>}
        </button>
      </div>
    </section>
  );
}