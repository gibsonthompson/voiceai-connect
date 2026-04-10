'use client';

import { useMemo } from 'react';
import { useClient } from '@/lib/client-context';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#050505' : '#ffffff';
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function isValidHex(val: string | undefined | null): val is string {
  if (!val) return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val);
}

function contrastDiff(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const c = hex.replace('#', '');
    if (c.length < 6) return 0;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  return Math.abs(lum(hex1) - lum(hex2));
}

function isUsablePrimary(hex: string): boolean {
  if (!hex || hex.length < 7) return false;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance >= 0.08 && luminance <= 0.92;
}

/** Darken a hex color by a fraction (0-1) */
function darkenHex(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function useClientTheme() {
  const { client, branding } = useClient();

  return useMemo(() => {
    // ========================================================================
    // OVERRIDE CASCADE:
    //   client.branding_overrides → auto-derived from client primary → 
    //   agency.branding_overrides → defaults
    // ========================================================================
    const clientOv = (client as any)?.branding_overrides as Record<string, string> | null;
    const agencyOv = client?.agency?.branding_overrides;

    // Does this client have their OWN primary color set? (not inherited from agency)
    const clientHasOwnPrimary = isValidHex(client?.primary_color) && isUsablePrimary(client!.primary_color!);

    const resolve = (key: string): string | null => {
      // 1. Client manual override
      if (isValidHex(clientOv?.[key])) return clientOv![key];
      // 2. Agency override
      if (isValidHex((agencyOv as any)?.[key])) return (agencyOv as any)[key];
      return null;
    };

    // Theme: client override → agency → default
    const themeOverride = clientOv?.theme as string | undefined;
    const isDark = themeOverride
      ? themeOverride === 'dark'
      : branding.websiteTheme === 'dark';

    const rawPrimary = branding.primaryColor || '#3b82f6';
    const primary = isUsablePrimary(rawPrimary) ? rawPrimary : '#3b82f6';

    // ========================================================================
    // NAV COLORS
    // If client has their own primary_color, auto-derive nav from it.
    // This means picking a primary color immediately changes the nav —
    // no separate branding_overrides save needed.
    // Manual overrides (client.branding_overrides.nav_bg) still take priority.
    // ========================================================================
    const clientNavBgOverride = isValidHex(clientOv?.nav_bg) ? clientOv!.nav_bg : null;
    const agencyNavBg = isValidHex((agencyOv as any)?.nav_bg) ? (agencyOv as any).nav_bg : null;

    // Auto-derive: darken the client's primary by 70% for a deep nav
    const autoDerivedNavBg = clientHasOwnPrimary ? darkenHex(primary, 0.65) : null;

    const navBgResolved = clientNavBgOverride || autoDerivedNavBg || agencyNavBg || (isDark ? '#0a0a0a' : '#ffffff');
    const isNavDark = !isLightColor(navBgResolved);

    const clientNavTextOverride = isValidHex(clientOv?.nav_text) ? clientOv!.nav_text : null;
    const agencyNavText = isValidHex((agencyOv as any)?.nav_text) ? (agencyOv as any).nav_text : null;
    // Auto-derive nav text from nav bg
    const autoDerivedNavText = clientHasOwnPrimary ? getContrastColor(navBgResolved) : null;

    const navTextResolved = clientNavTextOverride || autoDerivedNavText || agencyNavText || (isNavDark ? '#fafaf9' : '#111827');
    const navTextMuted = isNavDark ? 'rgba(250,250,249,0.6)' : '#6b7280';
    const navBorder = isNavDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
    const navHover = isNavDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)';

    const primaryContrastOk = contrastDiff(primary, navBgResolved) > 0.25;
    const navActiveColor = primaryContrastOk ? primary : '#ffffff';
    const navActiveItemBg = isNavDark
      ? (primaryContrastOk ? hexToRgba(primary, 0.15) : 'rgba(255,255,255,0.1)')
      : hexToRgba(primary, 0.15);

    // Button text: client override → auto from primary → agency override → contrast default
    const autoDerivedButtonText = clientHasOwnPrimary ? getContrastColor(primary) : null;
    const buttonTextResolved = resolve('button_text') || autoDerivedButtonText || getContrastColor(primary);

    return {
      isDark,
      primary,
      primaryText: getContrastColor(primary),
      primary15: hexToRgba(primary, 0.15),
      primary20: hexToRgba(primary, 0.2),
      primary30: hexToRgba(primary, 0.3),

      bg: resolve('page_bg') || (isDark ? '#0a0a0a' : '#f9fafb'),
      text: resolve('text_primary') || (isDark ? '#fafaf9' : '#111827'),
      textMuted: resolve('text_muted') || (isDark ? 'rgba(250,250,249,0.7)' : '#6b7280'),
      textMuted4: isDark ? 'rgba(250,250,249,0.5)' : '#9ca3af',
      border: resolve('card_border') || (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'),
      borderSubtle: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
      card: resolve('card_bg') || (isDark ? '#111111' : '#ffffff'),
      hover: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
      input: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
      inputBorder: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',

      navBg: navBgResolved,
      navText: navTextResolved,
      navTextMuted,
      navBorder,
      navHover,
      navActiveColor,
      navActiveItemBg,
      isNavDark,
      buttonText: buttonTextResolved,

      error: isDark ? '#f87171' : '#dc2626',
      errorBg: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
      errorText: isDark ? '#f87171' : '#dc2626',
      errorBorder: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca',

      warning: isDark ? '#fbbf24' : '#d97706',
      warningBg: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.1)',
      warningText: isDark ? '#fcd34d' : '#92400e',
      warningBorder: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.2)',

      success: isDark ? '#34d399' : '#059669',
      successBg: isDark ? 'rgba(52,211,153,0.1)' : 'rgba(52,211,153,0.1)',
      successText: isDark ? '#34d399' : '#059669',
      successBorder: isDark ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.2)',

      info: isDark ? '#60a5fa' : '#2563eb',
      infoBg: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)',
      infoText: isDark ? '#93c5fd' : '#1e40af',
      infoBorder: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.2)',
    };
  }, [branding, client?.agency?.branding_overrides, (client as any)?.branding_overrides, client?.primary_color]);
}