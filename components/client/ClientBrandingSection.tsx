'use client';

import { useState, useEffect } from 'react';
import { Upload, Palette, Loader2, Check, Sparkles, RotateCcw, Trash2, ChevronDown, Sun, Moon } from 'lucide-react';
import { extractColorsFromImage } from '@/lib/colorExtraction';
import { useClient } from '@/lib/client-context';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ClientBrandingSectionProps {
  clientId: string;
  theme: any;
}

interface BrandingOverrides {
  nav_bg?: string;
  nav_text?: string;
  button_text?: string;
  page_bg?: string;
  card_bg?: string;
  card_border?: string;
  theme?: 'light' | 'dark';
}

export default function ClientBrandingSection({ clientId, theme }: ClientBrandingSectionProps) {
  const { client, branding, refreshClient } = useClient();

  // Logo + colors
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');

  // Overrides
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

  // Initialize from client data
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
        if (ov.nav_bg || ov.nav_text || ov.button_text || ov.page_bg || ov.card_bg || ov.card_border) {
          setAdvancedOpen(true);
        }
      }
    }
  }, [client]);

  // Track changes
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

  const handleReExtract = async () => {
    const url = logoPreview || client?.logo_url;
    if (!url || url === '__remove__') return;
    setExtracting(true);
    try {
      const result = await extractColorsFromImage(url);
      setPrimaryColor(result.primary);
      setSecondaryColor(result.secondary);
      setAccentColor(result.accent);
    } catch (err) { console.error('Re-extraction failed:', err); }
    finally { setExtracting(false); }
  };

  const handleClearColors = () => {
    setPrimaryColor(''); setSecondaryColor(''); setAccentColor('');
  };

  const handleClearOverrides = () => {
    setNavBg(''); setNavText(''); setButtonText('');
    setPageBg(''); setCardBg(''); setCardBorder(''); setThemeMode('');
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

      // Build overrides object
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
        setMessage('Branding updated!');
        setLogoPreview(null);
        await refreshClient();
        setTimeout(() => setMessage(''), 3000);
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
  const hasColors = !!(primaryColor || secondaryColor || accentColor);
  const hasOverrides = !!(navBg || navText || buttonText || pageBg || cardBg || cardBorder || themeMode);

  // Color picker row component
  const ColorRow = ({ label, value, onChange, placeholder, description }: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string; description?: string;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-medium" style={{ color: theme.textMuted }}>{label}</p>
        {value && (
          <button onClick={() => onChange('')} className="text-[10px]" style={{ color: theme.textMuted4 }}>Clear</button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border cursor-pointer appearance-none bg-transparent flex-shrink-0"
          style={{ borderColor: theme.border, backgroundColor: value || placeholder }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 rounded-lg border px-2 py-1.5 text-[11px] font-mono focus:outline-none"
          style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }}
        />
      </div>
      {description && <p className="text-[9px] mt-1" style={{ color: theme.textMuted4 }}>{description}</p>}
    </div>
  );

  return (
    <section className="mb-4 sm:mb-6">
      <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Palette className="w-4 h-4" style={{ color: theme.primary }} />
        Branding
      </h2>

      <div className="rounded-xl border p-4 sm:p-5 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
        {message && (
          <div className="mb-4 p-3 rounded-lg text-sm font-medium text-center"
            style={message.includes('updated') || message.includes('Updated')
              ? { backgroundColor: theme.successBg, color: theme.successText, border: `1px solid ${theme.successBorder}` }
              : { backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }
            }>{message}</div>
        )}

        {/* ================================================================
            LOGO SECTION
            ================================================================ */}
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
            {extracting && (
              <div className="flex items-center gap-2 text-xs" style={{ color: theme.primary }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting...
              </div>
            )}
          </div>
          <p className="text-[10px] mt-2" style={{ color: theme.textMuted4 }}>PNG, JPG, or SVG. Used in sidebar, PWA icon, and emails.</p>
        </div>

        {/* ================================================================
            BRAND COLORS
            ================================================================ */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Brand Colors</label>
            <div className="flex items-center gap-2">
              {hasLogo && (
                <button onClick={handleReExtract} disabled={extracting}
                  className="inline-flex items-center gap-1 text-[10px] font-medium transition hover:opacity-80 disabled:opacity-50" style={{ color: theme.primary }}>
                  <Sparkles className="w-3 h-3" /> Re-extract
                </button>
              )}
              {hasColors && (
                <button onClick={handleClearColors} className="inline-flex items-center gap-1 text-[10px] font-medium transition hover:opacity-80" style={{ color: theme.textMuted4 }}>
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ColorRow label="Primary" value={primaryColor} onChange={setPrimaryColor} placeholder={client?.agency?.primary_color || '#3b82f6'} />
            <ColorRow label="Secondary" value={secondaryColor} onChange={setSecondaryColor} placeholder={client?.agency?.secondary_color || '#1e40af'} />
            <ColorRow label="Accent" value={accentColor} onChange={setAccentColor} placeholder={client?.agency?.accent_color || '#60a5fa'} />
          </div>
          {!hasColors && (
            <p className="text-[10px] mt-2" style={{ color: theme.textMuted4 }}>No custom colors — using agency defaults. Upload a logo to auto-detect, or pick manually.</p>
          )}
        </div>

        {/* ================================================================
            ADVANCED: NAV, BUTTONS, PAGE, CARDS
            ================================================================ */}
        <div className="mb-5">
          <button onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center justify-between w-full py-2 text-left"
            style={{ borderTop: `1px solid ${theme.border}`, marginTop: '4px', paddingTop: '16px' }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
              Advanced Appearance
            </span>
            <div className="flex items-center gap-2">
              {hasOverrides && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: hexToRgba(theme.primary, 0.12), color: theme.primary }}>
                  Customized
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} style={{ color: theme.textMuted4 }} />
            </div>
          </button>

          {advancedOpen && (
            <div className="mt-4 space-y-5">
              {/* Theme Toggle */}
              <div>
                <p className="text-[11px] font-medium mb-2" style={{ color: theme.textMuted }}>Theme Mode</p>
                <div className="flex gap-2">
                  {[
                    { value: '', label: 'Agency Default', icon: null },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'light', label: 'Light', icon: Sun },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setThemeMode(opt.value as any)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                      style={{
                        backgroundColor: themeMode === opt.value ? hexToRgba(theme.primary, 0.12) : theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                        color: themeMode === opt.value ? theme.primary : theme.textMuted,
                        border: `1px solid ${themeMode === opt.value ? hexToRgba(theme.primary, 0.3) : 'transparent'}`,
                      }}>
                      {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>Navigation</p>
                <div className="grid grid-cols-2 gap-3">
                  <ColorRow label="Nav Background" value={navBg} onChange={setNavBg} placeholder={theme.navBg} description="Sidebar/header background" />
                  <ColorRow label="Nav Text" value={navText} onChange={setNavText} placeholder={theme.navText} description="Menu items and labels" />
                </div>
              </div>

              {/* Buttons */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>Buttons</p>
                <div className="grid grid-cols-2 gap-3">
                  <ColorRow label="Button Text" value={buttonText} onChange={setButtonText} placeholder={theme.buttonText} description="Text inside primary buttons" />
                  <div>
                    <p className="text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Button Background</p>
                    <p className="text-[10px]" style={{ color: theme.textMuted4 }}>Uses your Primary color above</p>
                  </div>
                </div>
              </div>

              {/* Page & Cards */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>Page & Cards</p>
                <div className="grid grid-cols-3 gap-3">
                  <ColorRow label="Page Background" value={pageBg} onChange={setPageBg} placeholder={theme.bg} />
                  <ColorRow label="Card Background" value={cardBg} onChange={setCardBg} placeholder={theme.card} />
                  <ColorRow label="Card Border" value={cardBorder} onChange={setCardBorder} placeholder={theme.border} />
                </div>
              </div>

              {/* Reset all overrides */}
              {hasOverrides && (
                <button onClick={handleClearOverrides}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium transition hover:opacity-80"
                  style={{ color: theme.textMuted4 }}>
                  <RotateCcw className="w-3 h-3" /> Reset all appearance to agency defaults
                </button>
              )}

              {/* Preview */}
              <div className="rounded-xl p-4" style={{ backgroundColor: pageBg || theme.bg, border: `1px solid ${cardBorder || theme.border}` }}>
                <p className="text-[10px] uppercase tracking-wider font-medium mb-3" style={{ color: theme.textMuted4 }}>Live Preview</p>
                <div className="flex gap-2 mb-3">
                  {/* Nav preview */}
                  <div className="rounded-lg p-2 flex-1" style={{ backgroundColor: navBg || theme.navBg }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor || theme.primary }} />
                      <span className="text-[10px] font-medium" style={{ color: navText || theme.navText }}>Dashboard</span>
                    </div>
                    <span className="text-[9px] block mt-1" style={{ color: navText ? hexToRgba(navText, 0.5) : theme.navTextMuted }}>Calls</span>
                  </div>
                  {/* Card preview */}
                  <div className="rounded-lg p-2 flex-[2]" style={{ backgroundColor: cardBg || theme.card, border: `1px solid ${cardBorder || theme.border}` }}>
                    <span className="text-[10px]" style={{ color: theme.text }}>Card content</span>
                  </div>
                </div>
                {/* Button preview */}
                <div className="flex gap-2">
                  <div className="rounded-lg px-3 py-1.5 text-[10px] font-semibold"
                    style={{ backgroundColor: primaryColor || theme.primary, color: buttonText || theme.buttonText }}>
                    Primary Button
                  </div>
                  <div className="rounded-lg px-3 py-1.5 text-[10px] font-medium"
                    style={{ backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${cardBorder || theme.border}` }}>
                    Secondary
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================
            SAVE BUTTON
            ================================================================ */}
        <button onClick={handleSave} disabled={saving || !hasChanges}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: hasChanges ? theme.primary : theme.bg, color: hasChanges ? theme.primaryText : theme.textMuted4, border: hasChanges ? 'none' : `1px solid ${theme.border}` }}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : hasChanges ? <><Check className="w-4 h-4" /> Save Branding</> : 'No Changes'}
        </button>
      </div>
    </section>
  );
}