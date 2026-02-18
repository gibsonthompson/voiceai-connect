'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAgency } from '../context';
import { useTheme, buildTheme, BrandingOverrides, isValidHex } from '../../../hooks/useTheme';
import {
  Save, RotateCcw, Loader2, Check, AlertCircle, Paintbrush, Eye,
  PanelLeft, LayoutDashboard, Type, Square, MousePointer,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ColorField {
  key: keyof BrandingOverrides;
  label: string;
  description: string;
  group: 'sidebar' | 'page' | 'cards' | 'text' | 'buttons';
  icon: typeof PanelLeft;
}

const COLOR_FIELDS: ColorField[] = [
  // Sidebar
  { key: 'nav_bg', label: 'Sidebar Background', description: 'Navigation sidebar background color', group: 'sidebar', icon: PanelLeft },
  { key: 'nav_text', label: 'Sidebar Text', description: 'Text color in the navigation sidebar', group: 'sidebar', icon: Type },
  // Page
  { key: 'page_bg', label: 'Page Background', description: 'Main content area background', group: 'page', icon: LayoutDashboard },
  // Cards
  { key: 'card_bg', label: 'Card Background', description: 'Background color for cards and panels', group: 'cards', icon: Square },
  { key: 'card_border', label: 'Card Border', description: 'Border color for cards and panels', group: 'cards', icon: Square },
  // Text
  { key: 'text_primary', label: 'Primary Text', description: 'Main body text color', group: 'text', icon: Type },
  { key: 'text_muted', label: 'Muted Text', description: 'Secondary/muted text color', group: 'text', icon: Type },
  // Buttons
  { key: 'button_text', label: 'Button Text', description: 'Text color on primary-colored buttons', group: 'buttons', icon: MousePointer },
];

const GROUPS = [
  { key: 'sidebar', label: 'Sidebar / Navigation', icon: PanelLeft },
  { key: 'page', label: 'Page Background', icon: LayoutDashboard },
  { key: 'cards', label: 'Cards & Surfaces', icon: Square },
  { key: 'text', label: 'Text Colors', icon: Type },
  { key: 'buttons', label: 'Buttons', icon: MousePointer },
] as const;

// ============================================================================
// COLOR INPUT COMPONENT
// ============================================================================

function ColorInput({
  field,
  value,
  defaultValue,
  onChange,
  onClear,
  theme,
}: {
  field: ColorField;
  value: string | undefined;
  defaultValue: string;
  onChange: (key: keyof BrandingOverrides, val: string) => void;
  onClear: (key: keyof BrandingOverrides) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const isOverridden = !!value && isValidHex(value);
  const displayColor = isOverridden ? value : defaultValue;

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setInputValue(hex);
    onChange(field.key, hex);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Auto-prepend # if they're typing a hex
    if (val && !val.startsWith('#')) {
      val = '#' + val;
    }
    setInputValue(val);
    if (isValidHex(val)) {
      onChange(field.key, val);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onClear(field.key);
  };

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors"
      style={{
        backgroundColor: isOverridden ? theme.active : 'transparent',
        border: `1px solid ${isOverridden ? theme.primary30 : theme.border}`,
      }}
    >
      {/* Color swatch + native picker */}
      <div className="relative flex-shrink-0">
        <div
          className="w-9 h-9 rounded-lg border cursor-pointer"
          style={{
            backgroundColor: displayColor,
            borderColor: theme.border,
          }}
        />
        <input
          type="color"
          value={displayColor.startsWith('#') ? displayColor : '#000000'}
          onChange={handleColorPickerChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title={`Pick ${field.label}`}
        />
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: theme.text }}>
            {field.label}
          </span>
          {isOverridden && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: theme.primary15, color: theme.primary }}
            >
              Custom
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: theme.textMuted }}>
          {field.description}
        </p>
      </div>

      {/* Hex input */}
      <input
        type="text"
        value={inputValue || ''}
        onChange={handleTextChange}
        placeholder={defaultValue}
        className="w-[90px] text-xs font-mono rounded-lg px-2 py-1.5 text-center outline-none transition-colors"
        style={{
          backgroundColor: theme.input,
          border: `1px solid ${theme.inputBorder}`,
          color: theme.text,
        }}
        maxLength={7}
      />

      {/* Clear button */}
      {isOverridden && (
        <button
          onClick={handleClear}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
          style={{ color: theme.textMuted }}
          title="Reset to default"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// LIVE PREVIEW COMPONENT
// ============================================================================

function LivePreview({
  previewTheme,
  primaryColor,
}: {
  previewTheme: ReturnType<typeof buildTheme>;
  primaryColor: string;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: previewTheme.border }}
    >
      {/* Mini layout preview */}
      <div className="flex" style={{ height: '280px' }}>
        {/* Mini sidebar */}
        <div
          className="w-[140px] flex-shrink-0 flex flex-col p-3 gap-1.5"
          style={{
            backgroundColor: previewTheme.sidebarBg,
            borderRight: `1px solid ${previewTheme.sidebarBorder}`,
          }}
        >
          {/* Logo placeholder */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <div
              className="w-6 h-6 rounded-md flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}20` }}
            />
            <div
              className="h-2.5 rounded-full flex-1"
              style={{ backgroundColor: previewTheme.sidebarText, opacity: 0.6 }}
            />
          </div>

          {/* Nav items */}
          {['Dashboard', 'Clients', 'Settings'].map((label, i) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5"
              style={
                i === 0
                  ? { backgroundColor: previewTheme.sidebarActiveItemBg, color: previewTheme.sidebarActiveItemColor }
                  : { color: previewTheme.sidebarTextMuted }
              }
            >
              <div
                className="w-3.5 h-3.5 rounded"
                style={{
                  backgroundColor: i === 0 ? previewTheme.sidebarActiveItemColor : previewTheme.sidebarTextMuted,
                  opacity: i === 0 ? 1 : 0.5,
                }}
              />
              <span className="text-[10px] font-medium">{label}</span>
            </div>
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Plan badge */}
          <div
            className="rounded-lg px-2 py-1.5"
            style={{
              backgroundColor: `${primaryColor}10`,
              border: `1px solid ${primaryColor}30`,
            }}
          >
            <span className="text-[9px]" style={{ color: `${primaryColor}99` }}>Plan</span>
            <p className="text-[10px] font-medium" style={{ color: primaryColor }}>Enterprise</p>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 p-4" style={{ backgroundColor: previewTheme.bg }}>
          {/* Page title */}
          <div
            className="h-3 w-24 rounded-full mb-4"
            style={{ backgroundColor: previewTheme.text, opacity: 0.7 }}
          />

          {/* Cards grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-lg p-3"
                style={{
                  backgroundColor: previewTheme.card,
                  border: `1px solid ${previewTheme.border}`,
                }}
              >
                <div
                  className="h-2 w-12 rounded-full mb-2"
                  style={{ backgroundColor: previewTheme.textMuted, opacity: 0.5 }}
                />
                <div
                  className="h-4 w-16 rounded-full mb-2"
                  style={{ backgroundColor: previewTheme.text, opacity: 0.6 }}
                />
                <div
                  className="h-1.5 w-full rounded-full"
                  style={{ backgroundColor: previewTheme.border }}
                />
              </div>
            ))}
          </div>

          {/* Button preview */}
          <div className="mt-3 flex gap-2">
            <div
              className="rounded-lg px-3 py-1.5"
              style={{
                backgroundColor: primaryColor,
                color: previewTheme.primaryText,
              }}
            >
              <span className="text-[10px] font-medium">Primary Button</span>
            </div>
            <div
              className="rounded-lg px-3 py-1.5"
              style={{
                backgroundColor: previewTheme.card,
                border: `1px solid ${previewTheme.border}`,
                color: previewTheme.text,
              }}
            >
              <span className="text-[10px] font-medium">Secondary</span>
            </div>
          </div>

          {/* Text sample */}
          <div className="mt-3">
            <p className="text-[10px] font-medium" style={{ color: previewTheme.text }}>
              Primary text looks like this
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: previewTheme.textMuted }}>
              Muted text looks like this
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN BRANDING PAGE
// ============================================================================

export default function BrandingPage() {
  const { agency, branding, refreshAgency } = useAgency();
  const theme = useTheme();

  // Backend URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  // Local overrides state (working copy)
  const [overrides, setOverrides] = useState<BrandingOverrides>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from agency data
  useEffect(() => {
    if (agency?.branding_overrides) {
      setOverrides({ ...agency.branding_overrides });
    } else {
      setOverrides({});
    }
  }, [agency?.branding_overrides]);

  // Determine base mode + primary for preview computation
  const mode = agency?.website_theme !== 'light' ? 'dark' : 'light';
  const primaryColor = branding.primaryColor || '#10b981';

  // Build a live preview theme from current working overrides
  const previewTheme = useMemo(() => {
    return buildTheme(mode as 'dark' | 'light', primaryColor, overrides);
  }, [mode, primaryColor, overrides]);

  // Get default values (theme with NO overrides) for placeholder display
  const defaultTheme = useMemo(() => {
    return buildTheme(mode as 'dark' | 'light', primaryColor);
  }, [mode, primaryColor]);

  // Map field keys to their default theme values
  const getDefaultForField = useCallback((key: keyof BrandingOverrides): string => {
    const map: Record<keyof BrandingOverrides, string> = {
      nav_bg: defaultTheme.sidebarBg,
      nav_text: defaultTheme.sidebarText,
      page_bg: defaultTheme.bg,
      card_bg: defaultTheme.card,
      card_border: defaultTheme.border,
      button_text: defaultTheme.primaryText,
      text_primary: defaultTheme.text,
      text_muted: defaultTheme.textMuted,
    };
    return map[key] || '#000000';
  }, [defaultTheme]);

  // Check if anything has changed from saved state
  const hasChanges = useMemo(() => {
    const saved = agency?.branding_overrides || {};
    for (const field of COLOR_FIELDS) {
      const savedVal = (saved as any)[field.key];
      const currentVal = overrides[field.key];
      if ((savedVal || '') !== (currentVal || '')) return true;
    }
    return false;
  }, [overrides, agency?.branding_overrides]);

  // Count active overrides
  const activeCount = COLOR_FIELDS.filter(f => isValidHex(overrides[f.key])).length;

  // Handlers
  const handleChange = (key: keyof BrandingOverrides, value: string) => {
    setOverrides(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const handleClear = (key: keyof BrandingOverrides) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaved(false);
    setError(null);
  };

  const handleResetAll = () => {
    setOverrides({});
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!agency) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const token = localStorage.getItem('auth_token');

      // Build clean overrides (only valid hex values)
      const cleanOverrides: BrandingOverrides = {};
      for (const field of COLOR_FIELDS) {
        const val = overrides[field.key];
        if (isValidHex(val)) {
          cleanOverrides[field.key] = val;
        }
      }

      // Send null if empty (resets to defaults)
      const payload = {
        branding_overrides: Object.keys(cleanOverrides).length > 0 ? cleanOverrides : null,
      };

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save branding');
      }

      await refreshAgency();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.primary15 }}
            >
              <Paintbrush className="h-5 w-5" style={{ color: theme.primary }} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: theme.text }}>
                Dashboard Branding
              </h1>
              <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>
                Customize colors for your agency and client dashboards
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={handleResetAll}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: theme.card,
                border: `1px solid ${theme.border}`,
                color: theme.textMuted,
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset All
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: theme.primary,
              color: theme.primaryText,
            }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center gap-3"
          style={{
            backgroundColor: theme.errorBg,
            border: `1px solid ${theme.errorBorder}`,
          }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: theme.error }} />
          <p className="text-sm" style={{ color: theme.errorText }}>{error}</p>
        </div>
      )}

      {/* Two-column layout: controls + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Color controls - 3 cols */}
        <div className="lg:col-span-3 space-y-5">
          {/* Status bar */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{
              backgroundColor: theme.card,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div className="flex items-center gap-2">
              <Paintbrush className="h-4 w-4" style={{ color: theme.textMuted }} />
              <span className="text-sm" style={{ color: theme.textMuted }}>
                {activeCount === 0
                  ? 'Using default theme colors'
                  : `${activeCount} custom color${activeCount !== 1 ? 's' : ''} active`}
              </span>
            </div>
            <span
              className="text-xs px-2 py-1 rounded-full font-medium capitalize"
              style={{
                backgroundColor: theme.primary10,
                color: theme.primary,
              }}
            >
              {mode} mode
            </span>
          </div>

          {/* Color groups */}
          {GROUPS.map((group) => {
            const fields = COLOR_FIELDS.filter(f => f.group === group.key);
            const GroupIcon = group.icon;

            return (
              <div
                key={group.key}
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: theme.card,
                  border: `1px solid ${theme.border}`,
                }}
              >
                {/* Group header */}
                <div
                  className="px-4 py-3 flex items-center gap-2"
                  style={{ borderBottom: `1px solid ${theme.border}` }}
                >
                  <GroupIcon className="h-4 w-4" style={{ color: theme.primary }} />
                  <span className="text-sm font-semibold" style={{ color: theme.text }}>
                    {group.label}
                  </span>
                </div>

                {/* Fields */}
                <div className="p-3 space-y-2">
                  {fields.map((field) => (
                    <ColorInput
                      key={field.key}
                      field={field}
                      value={overrides[field.key]}
                      defaultValue={getDefaultForField(field.key)}
                      onChange={handleChange}
                      onClear={handleClear}
                      theme={theme}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview - 2 cols */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            {/* Preview header */}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" style={{ color: theme.primary }} />
              <span className="text-sm font-semibold" style={{ color: theme.text }}>
                Live Preview
              </span>
              {hasChanges && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: theme.warningBg, color: theme.warningText, border: `1px solid ${theme.warningBorder}` }}
                >
                  Unsaved
                </span>
              )}
            </div>

            {/* Preview panel */}
            <LivePreview previewTheme={previewTheme} primaryColor={primaryColor} />

            {/* Info note */}
            <div
              className="rounded-xl p-3"
              style={{
                backgroundColor: theme.infoBg,
                border: `1px solid ${theme.infoBorder}`,
              }}
            >
              <p className="text-xs leading-relaxed" style={{ color: theme.infoText }}>
                Changes apply to both your agency dashboard and all your client dashboards.
                Colors auto-derive complementary values — you only need to set the ones you want to customize.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}