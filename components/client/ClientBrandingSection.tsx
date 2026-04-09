'use client';

import { useState, useEffect } from 'react';
import { Upload, Palette, Loader2, Check, Sparkles, RotateCcw, Trash2 } from 'lucide-react';
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

export default function ClientBrandingSection({ clientId, theme }: ClientBrandingSectionProps) {
  const { client, branding, refreshClient } = useClient();

  // Local state for editing
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');

  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize from current client data
  useEffect(() => {
    if (client) {
      setPrimaryColor(client.primary_color || '');
      setSecondaryColor(client.secondary_color || '');
      setAccentColor(client.accent_color || '');
    }
  }, [client]);

  // Track changes
  useEffect(() => {
    if (!client) return;
    const changed =
      logoPreview !== null ||
      (primaryColor !== (client.primary_color || '')) ||
      (secondaryColor !== (client.secondary_color || '')) ||
      (accentColor !== (client.accent_color || ''));
    setHasChanges(changed);
  }, [logoPreview, primaryColor, secondaryColor, accentColor, client]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setMessage('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl);

      // Auto-extract colors
      setExtracting(true);
      try {
        const result = await extractColorsFromImage(dataUrl);
        setPrimaryColor(result.primary);
        setSecondaryColor(result.secondary);
        setAccentColor(result.accent);
        setMessage('');
      } catch (err) {
        console.error('Color extraction failed:', err);
      } finally {
        setExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview('__remove__'); // Sentinel to clear on save
    setMessage('');
  };

  const handleReExtract = async () => {
    const url = logoPreview || client?.logo_url;
    if (!url || url === '__remove__') return;

    setExtracting(true);
    try {
      const result = await extractColorsFromImage(url);
      setPrimaryColor(result.primary);
      setSecondaryColor(result.secondary);
      setAccentColor(result.accent);
    } catch (err) {
      console.error('Re-extraction failed:', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleClearColors = () => {
    setPrimaryColor('');
    setSecondaryColor('');
    setAccentColor('');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

      const body: Record<string, any> = {};

      // Logo: send new data URL, null to clear, or omit to keep
      if (logoPreview === '__remove__') {
        body.logo_url = null;
      } else if (logoPreview) {
        body.logo_url = logoPreview;
      }

      // Colors: send value or null to clear (falls back to agency)
      body.primary_color = primaryColor || null;
      body.secondary_color = secondaryColor || null;
      body.accent_color = accentColor || null;

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
        setMessage('Branding updated!');
        setLogoPreview(null);
        // Refresh client context so the whole UI updates with new branding
        await refreshClient();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to save branding');
      }
    } catch (error) {
      console.error('Save branding error:', error);
      setMessage('Error saving branding');
    } finally {
      setSaving(false);
    }
  };

  const currentLogo = logoPreview === '__remove__' ? null : (logoPreview || client?.logo_url || null);
  const hasLogo = !!currentLogo;
  const hasColors = !!(primaryColor || secondaryColor || accentColor);
  const agencyPrimary = client?.agency?.primary_color || '#3b82f6';

  return (
    <section className="mb-4 sm:mb-6">
      <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Palette className="w-4 h-4" style={{ color: theme.primary }} />
        Branding
      </h2>

      <div className="rounded-xl border p-4 sm:p-5 shadow-sm" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
        {/* Status message */}
        {message && (
          <div
            className="mb-4 p-3 rounded-lg text-sm font-medium text-center"
            style={message.includes('updated') || message.includes('Updated')
              ? { backgroundColor: theme.successBg, color: theme.successText, border: `1px solid ${theme.successBorder}` }
              : { backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }
            }
          >
            {message}
          </div>
        )}

        {/* Logo Section */}
        <div className="mb-5">
          <label className="block text-xs font-medium uppercase tracking-wider mb-3" style={{ color: theme.textMuted }}>
            Business Logo
          </label>
          <div className="flex items-center gap-4">
            {/* Logo Preview */}
            <div
              className="flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '16px',
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                border: `2px dashed ${hasLogo ? 'transparent' : theme.border}`,
              }}
            >
              {hasLogo ? (
                <img src={currentLogo!} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Upload className="w-6 h-6" style={{ color: theme.textMuted4 }} />
              )}
            </div>

            {/* Upload / Remove buttons */}
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80"
                  style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08), color: theme.primary }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {hasLogo ? 'Change' : 'Upload'}
                </span>
              </label>
              {hasLogo && logoPreview !== '__remove__' && (
                <button
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center gap-1.5 text-xs transition hover:opacity-80"
                  style={{ color: theme.error }}
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            {extracting && (
              <div className="flex items-center gap-2 text-xs" style={{ color: theme.primary }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Extracting colors...
              </div>
            )}
          </div>
          <p className="text-[10px] mt-2" style={{ color: theme.textMuted4 }}>
            PNG, JPG, or SVG. Recommended 400×400px. Used in your sidebar, PWA icon, and emails.
          </p>
        </div>

        {/* Colors Section */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>
              Brand Colors
            </label>
            <div className="flex items-center gap-2">
              {hasLogo && (
                <button
                  onClick={handleReExtract}
                  disabled={extracting}
                  className="inline-flex items-center gap-1 text-[10px] font-medium transition hover:opacity-80 disabled:opacity-50"
                  style={{ color: theme.primary }}
                >
                  <Sparkles className="w-3 h-3" /> Re-extract
                </button>
              )}
              {hasColors && (
                <button
                  onClick={handleClearColors}
                  className="inline-flex items-center gap-1 text-[10px] font-medium transition hover:opacity-80"
                  style={{ color: theme.textMuted4 }}
                >
                  <RotateCcw className="w-3 h-3" /> Reset to agency
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'primary', label: 'Primary', value: primaryColor, set: setPrimaryColor, fallback: agencyPrimary },
              { key: 'secondary', label: 'Secondary', value: secondaryColor, set: setSecondaryColor, fallback: client?.agency?.secondary_color || '#1e40af' },
              { key: 'accent', label: 'Accent', value: accentColor, set: setAccentColor, fallback: client?.agency?.accent_color || '#60a5fa' },
            ].map(({ key, label, value, set, fallback }) => (
              <div key={key}>
                <p className="text-[10px] mb-1.5" style={{ color: theme.textMuted4 }}>{label}</p>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={value || fallback}
                      onChange={(e) => set(e.target.value)}
                      className="w-9 h-9 rounded-lg border cursor-pointer appearance-none bg-transparent"
                      style={{ borderColor: theme.border, backgroundColor: value || fallback }}
                    />
                  </div>
                  <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => set(e.target.value)}
                    placeholder={fallback}
                    className="flex-1 min-w-0 rounded-lg border px-2 py-1.5 text-[10px] font-mono focus:outline-none"
                    style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }}
                  />
                </div>
              </div>
            ))}
          </div>

          {!hasColors && (
            <p className="text-[10px] mt-2" style={{ color: theme.textMuted4 }}>
              No custom colors set — using your agency&apos;s default colors. Upload a logo to auto-detect, or pick manually.
            </p>
          )}
        </div>

        {/* Color Preview */}
        {hasColors && (
          <div className="mb-5 p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
            <p className="text-[10px] uppercase tracking-wider font-medium mb-2" style={{ color: theme.textMuted4 }}>Preview</p>
            <div className="flex items-center gap-2">
              <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: primaryColor || agencyPrimary }} />
              <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: secondaryColor || client?.agency?.secondary_color || '#1e40af' }} />
              <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: accentColor || client?.agency?.accent_color || '#60a5fa' }} />
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backgroundColor: hasChanges ? theme.primary : theme.bg,
            color: hasChanges ? theme.primaryText : theme.textMuted4,
            border: hasChanges ? 'none' : `1px solid ${theme.border}`,
          }}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : hasChanges ? (
            <><Check className="w-4 h-4" /> Save Branding</>
          ) : (
            'No Changes'
          )}
        </button>
      </div>
    </section>
  );
}