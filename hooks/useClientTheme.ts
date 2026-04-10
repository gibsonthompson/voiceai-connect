'use client';

import { useMemo } from 'react';
import { useClient } from '@/lib/client-context';

// ============================================================================
// UTILITY FUNCTIONS
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

function luminance(hex: string): number {
  const c = hex.replace('#', '').trim();
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function isLight(hex: string): boolean {
  return luminance(hex) > 0.5;
}

function contrastText(hex: string): string {
  return isLight(hex) ? '#111827' : '#ffffff';
}

function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '').trim();
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ============================================================================
// THE HOOK
//
// Inputs:
//   - client.primary_color (THE color — everything derives from this)
//   - client.nav_bg, nav_text, button_text, page_bg, card_bg, card_border
//     (explicit overrides — used as-is when set)
//   - client.theme_mode ('light' | 'dark' | null)
//   - agency fallbacks for primary, theme
//
// Derivation:
//   1. Primary color = client.primary_color → agency.primary_color → #3b82f6
//   2. Nav bg = client.nav_bg → auto-darken(primary, 65%) → default
//   3. Nav text = client.nav_text → auto-contrast(navBg) → default
//   4. Button text = client.button_text → auto-contrast(primary) → default
//   5. Page bg / card bg / card border = client override → theme default
//   6. Theme = client.theme_mode → agency.website_theme → dark
//
// That's it. No JSONB. No injection. No multi-layer cascade.
// ============================================================================

export function useClientTheme() {
  const { client, branding } = useClient();

  return useMemo(() => {
    const primary = branding.primaryColor || '#3b82f6';

    // ── Theme mode ──────────────────────────────────────────────────
    const themeMode = client?.theme_mode || null;
    const isDark = themeMode
      ? themeMode === 'dark'
      : (branding.websiteTheme || 'dark') === 'dark';

    // ── Nav ─────────────────────────────────────────────────────────
    const autoNavBg = darken(primary, 0.65);
    const navBg = (isValidHex(client?.nav_bg) ? client!.nav_bg! : null) || autoNavBg;
    const isNavDark = !isLight(navBg);
    const navText = (isValidHex(client?.nav_text) ? client!.nav_text! : null) || (isNavDark ? '#fafaf9' : '#111827');
    const navTextMuted = isNavDark ? 'rgba(250,250,249,0.6)' : '#6b7280';
    const navBorder = isNavDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
    const navHover = isNavDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)';

    // Active item: use primary if it has enough contrast against nav bg, else white
    const primaryContrastOk = Math.abs(luminance(primary) - luminance(navBg)) > 0.25;
    const navActiveColor = primaryContrastOk ? primary : '#ffffff';
    const navActiveItemBg = isNavDark
      ? (primaryContrastOk ? hexToRgba(primary, 0.15) : 'rgba(255,255,255,0.1)')
      : hexToRgba(primary, 0.15);

    // ── Buttons ─────────────────────────────────────────────────────
    const buttonText = (isValidHex(client?.button_text) ? client!.button_text! : null) || contrastText(primary);

    // ── Page ────────────────────────────────────────────────────────
    const bg = (isValidHex(client?.page_bg) ? client!.page_bg! : null) || (isDark ? '#0a0a0a' : '#f9fafb');
    const card = (isValidHex(client?.card_bg) ? client!.card_bg! : null) || (isDark ? '#111111' : '#ffffff');
    const border = (isValidHex(client?.card_border) ? client!.card_border! : null) || (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb');

    // ── Text ────────────────────────────────────────────────────────
    const text = isDark ? '#fafaf9' : '#111827';
    const textMuted = isDark ? 'rgba(250,250,249,0.7)' : '#6b7280';
    const textMuted4 = isDark ? 'rgba(250,250,249,0.5)' : '#9ca3af';

    return {
      // Core
      isDark,
      primary,
      primaryText: contrastText(primary),
      primary15: hexToRgba(primary, 0.15),
      primary20: hexToRgba(primary, 0.2),
      primary30: hexToRgba(primary, 0.3),

      // Page
      bg,
      text,
      textMuted,
      textMuted4,
      border,
      borderSubtle: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
      card,
      hover: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
      input: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
      inputBorder: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',

      // Nav
      navBg,
      navText,
      navTextMuted,
      navBorder,
      navHover,
      navActiveColor,
      navActiveItemBg,
      isNavDark,

      // Buttons
      buttonText,

      // Semantic — error
      error: isDark ? '#f87171' : '#dc2626',
      errorBg: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
      errorText: isDark ? '#f87171' : '#dc2626',
      errorBorder: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca',

      // Semantic — warning
      warning: isDark ? '#fbbf24' : '#d97706',
      warningBg: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.1)',
      warningText: isDark ? '#fcd34d' : '#92400e',
      warningBorder: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.2)',

      // Semantic — success
      success: isDark ? '#34d399' : '#059669',
      successBg: isDark ? 'rgba(52,211,153,0.1)' : 'rgba(52,211,153,0.1)',
      successText: isDark ? '#34d399' : '#059669',
      successBorder: isDark ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.2)',

      // Semantic — info
      info: isDark ? '#60a5fa' : '#2563eb',
      infoBg: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)',
      infoText: isDark ? '#93c5fd' : '#1e40af',
      infoBorder: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.2)',
    };
  }, [
    branding.primaryColor,
    branding.websiteTheme,
    client?.primary_color,
    client?.nav_bg,
    client?.nav_text,
    client?.button_text,
    client?.page_bg,
    client?.card_bg,
    client?.card_border,
    client?.theme_mode,
  ]);
}