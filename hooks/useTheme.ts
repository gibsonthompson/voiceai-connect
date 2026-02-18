// ============================================================================
// useTheme() - Centralized Theme System for Agency Dashboard
// WITH BRANDING OVERRIDES SUPPORT
// ============================================================================
// 
// The theme is derived from THREE agency settings:
//   1. website_theme: 'dark' | 'light' (base mode)
//   2. primary_color: hex string (brand color - buttons, accents, active states)
//   3. branding_overrides: JSON object with optional color overrides
//
// Branding overrides let agencies customize:
//   - nav_bg / nav_text           → Sidebar/navigation colors
//   - page_bg                     → Main content area background
//   - card_bg / card_border       → Card/surface colors
//   - button_text                 → Text color on primary-colored buttons
//   - text_primary / text_muted   → Main text colors
//
// Everything auto-calculates from the base theme, then overrides are applied
// on top. Pages using useTheme() get overrides automatically.
// ============================================================================

'use client';

import { useMemo } from 'react';
import { useAgency } from '@/app/agency/context';

// ============================================================================
// BRANDING OVERRIDES INTERFACE
// ============================================================================

export interface BrandingOverrides {
  // Navigation / Sidebar
  nav_bg?: string;
  nav_text?: string;

  // Page background
  page_bg?: string;

  // Cards / Surfaces
  card_bg?: string;
  card_border?: string;

  // Button text (on primary-colored buttons)
  button_text?: string;

  // Text colors
  text_primary?: string;
  text_muted?: string;
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Check if a hex color is "light" (luminance > 0.5)
 * Used to determine if text on top of this color should be dark or light
 */
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/**
 * Get the right text color to put ON TOP of a given background color
 * Returns dark text for light backgrounds, white text for dark backgrounds
 */
function getContrastText(hex: string, darkMode: boolean): string {
  return isLightColor(hex) ? '#050505' : '#ffffff';
}

/**
 * Create a transparent version of a hex color
 * e.g. withAlpha('#10b981', 0.15) → 'rgba(16,185,129,0.15)'
 */
function withAlpha(hex: string, alpha: number): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Validate that a string looks like a hex color
 */
function isValidHex(val: string | undefined | null): val is string {
  if (!val) return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val);
}

/**
 * Auto-compute a subtle hover/muted variant from a solid background color.
 * Used when overrides provide a nav_bg but not nav_text, etc.
 */
function autoNavText(navBg: string): string {
  return isLightColor(navBg) ? '#111827' : '#fafaf9';
}

function autoNavTextMuted(navBg: string): string {
  return isLightColor(navBg) ? '#6b7280' : 'rgba(250,250,249,0.6)';
}

function autoNavBorder(navBg: string): string {
  return isLightColor(navBg) ? '#e5e7eb' : 'rgba(255,255,255,0.08)';
}

function autoNavHover(navBg: string): string {
  return isLightColor(navBg) ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
}

function autoCardHover(cardBg: string, isDark: boolean): string {
  if (isLightColor(cardBg)) {
    return '#f3f4f6';
  }
  return 'rgba(255,255,255,0.04)';
}

function autoInputBg(cardBg: string, isDark: boolean): string {
  // Input bg is usually slightly different from card bg
  if (isDark) return 'rgba(255,255,255,0.04)';
  return '#ffffff';
}

function autoInputBorder(cardBorder: string | undefined, isDark: boolean): string {
  if (cardBorder) return cardBorder;
  if (isDark) return 'rgba(255,255,255,0.08)';
  return '#e5e7eb';
}

// ============================================================================
// THEME INTERFACE
// ============================================================================

export interface Theme {
  // Mode
  isDark: boolean;

  // Primary brand color (from agency settings)
  primary: string;

  // Text on top of primary color buttons
  primaryText: string;

  // Primary with various opacities (for backgrounds, borders, badges)
  primary10: string;
  primary15: string;
  primary20: string;
  primary30: string;
  primary80: string;

  // Core layout colors
  bg: string;
  text: string;
  textMuted: string;
  textSubtle: string;

  // Surface colors (cards, modals, sections)
  card: string;
  cardHover: string;

  // Input/form colors
  input: string;
  inputBorder: string;
  inputFocus: string;

  // Border colors
  border: string;
  borderSubtle: string;

  // Interactive states
  hover: string;
  active: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  successText: string;
  warningText: string;
  errorText: string;
  infoText: string;

  successBg: string;
  warningBg: string;
  errorBg: string;
  infoBg: string;

  successBorder: string;
  warningBorder: string;
  errorBorder: string;
  infoBorder: string;

  // Sidebar-specific
  sidebarBg: string;
  sidebarBorder: string;
  sidebarText: string;
  sidebarTextMuted: string;
  sidebarHover: string;
  sidebarActiveItemBg: string;
  sidebarActiveItemColor: string;

  // Utility functions
  getContrastText: (hex: string) => string;
  withAlpha: (hex: string, alpha: number) => string;
}

// ============================================================================
// DARK THEME GENERATOR
// ============================================================================
function buildDarkTheme(primary: string, overrides?: BrandingOverrides): Theme {
  // Base values
  const baseBg = '#050505';
  const baseText = '#fafaf9';
  const baseTextMuted = 'rgba(250,250,249,0.5)';
  const baseCard = 'rgba(255,255,255,0.02)';
  const baseBorder = 'rgba(255,255,255,0.06)';
  const baseSidebarBg = '#050505';

  // Apply overrides
  const pageBg = isValidHex(overrides?.page_bg) ? overrides!.page_bg : baseBg;
  const textPrimary = isValidHex(overrides?.text_primary) ? overrides!.text_primary : baseText;
  const textMuted = isValidHex(overrides?.text_muted) ? overrides!.text_muted : baseTextMuted;
  const cardBg = isValidHex(overrides?.card_bg) ? overrides!.card_bg : baseCard;
  const cardBorder = isValidHex(overrides?.card_border) ? overrides!.card_border : baseBorder;
  const buttonText = isValidHex(overrides?.button_text) ? overrides!.button_text : getContrastText(primary, true);

  // Sidebar overrides — auto-derive text/border from bg if not specified
  const navBg = isValidHex(overrides?.nav_bg) ? overrides!.nav_bg : baseSidebarBg;
  const hasNavBgOverride = isValidHex(overrides?.nav_bg);
  const navText = isValidHex(overrides?.nav_text) ? overrides!.nav_text : (hasNavBgOverride ? autoNavText(navBg) : baseText);
  const navTextMuted = hasNavBgOverride ? autoNavTextMuted(navBg) : 'rgba(250,250,249,0.5)';
  const navBorder = hasNavBgOverride ? autoNavBorder(navBg) : baseBorder;
  const navHover = hasNavBgOverride ? autoNavHover(navBg) : 'rgba(255,255,255,0.04)';

  return {
    isDark: true,
    primary,
    primaryText: buttonText,
    primary10: withAlpha(primary, 0.10),
    primary15: withAlpha(primary, 0.15),
    primary20: withAlpha(primary, 0.20),
    primary30: withAlpha(primary, 0.30),
    primary80: withAlpha(primary, 0.80),

    bg: pageBg,
    text: textPrimary,
    textMuted: textMuted,
    textSubtle: 'rgba(250,250,249,0.35)',

    card: cardBg,
    cardHover: autoCardHover(cardBg, true),

    input: autoInputBg(cardBg, true),
    inputBorder: autoInputBorder(cardBorder !== baseBorder ? cardBorder : undefined, true),
    inputFocus: withAlpha(primary, 0.3),

    border: cardBorder,
    borderSubtle: 'rgba(255,255,255,0.04)',

    hover: 'rgba(255,255,255,0.04)',
    active: withAlpha(primary, 0.15),

    // Status colors — universal, not affected by overrides
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#93c5fd',

    successText: '#34d399',
    warningText: '#fbbf24',
    errorText: '#f87171',
    infoText: '#93c5fd',

    successBg: 'rgba(52,211,153,0.1)',
    warningBg: 'rgba(251,191,36,0.1)',
    errorBg: 'rgba(239,68,68,0.1)',
    infoBg: 'rgba(59,130,246,0.08)',

    successBorder: 'rgba(52,211,153,0.2)',
    warningBorder: 'rgba(251,191,36,0.2)',
    errorBorder: 'rgba(239,68,68,0.2)',
    infoBorder: 'rgba(59,130,246,0.2)',

    // Sidebar
    sidebarBg: navBg,
    sidebarBorder: navBorder,
    sidebarText: navText,
    sidebarTextMuted: navTextMuted,
    sidebarHover: navHover,
    sidebarActiveItemBg: withAlpha(primary, 0.15),
    sidebarActiveItemColor: primary,

    getContrastText: (hex: string) => getContrastText(hex, true),
    withAlpha,
  };
}

// ============================================================================
// LIGHT THEME GENERATOR
// ============================================================================
function buildLightTheme(primary: string, overrides?: BrandingOverrides): Theme {
  // Base values
  const baseBg = '#f9fafb';
  const baseText = '#111827';
  const baseTextMuted = '#6b7280';
  const baseCard = '#ffffff';
  const baseBorder = '#e5e7eb';
  const baseSidebarBg = '#ffffff';

  // Apply overrides
  const pageBg = isValidHex(overrides?.page_bg) ? overrides!.page_bg : baseBg;
  const textPrimary = isValidHex(overrides?.text_primary) ? overrides!.text_primary : baseText;
  const textMuted = isValidHex(overrides?.text_muted) ? overrides!.text_muted : baseTextMuted;
  const cardBg = isValidHex(overrides?.card_bg) ? overrides!.card_bg : baseCard;
  const cardBorder = isValidHex(overrides?.card_border) ? overrides!.card_border : baseBorder;
  const buttonText = isValidHex(overrides?.button_text) ? overrides!.button_text : getContrastText(primary, false);

  // Sidebar overrides
  const navBg = isValidHex(overrides?.nav_bg) ? overrides!.nav_bg : baseSidebarBg;
  const hasNavBgOverride = isValidHex(overrides?.nav_bg);
  const navText = isValidHex(overrides?.nav_text) ? overrides!.nav_text : (hasNavBgOverride ? autoNavText(navBg) : baseText);
  const navTextMuted = hasNavBgOverride ? autoNavTextMuted(navBg) : '#6b7280';
  const navBorder = hasNavBgOverride ? autoNavBorder(navBg) : baseBorder;
  const navHover = hasNavBgOverride ? autoNavHover(navBg) : 'rgba(0,0,0,0.02)';

  return {
    isDark: false,
    primary,
    primaryText: buttonText,
    primary10: withAlpha(primary, 0.10),
    primary15: withAlpha(primary, 0.15),
    primary20: withAlpha(primary, 0.20),
    primary30: withAlpha(primary, 0.30),
    primary80: withAlpha(primary, 0.80),

    bg: pageBg,
    text: textPrimary,
    textMuted: textMuted,
    textSubtle: '#9ca3af',

    card: cardBg,
    cardHover: autoCardHover(cardBg, false),

    input: autoInputBg(cardBg, false),
    inputBorder: autoInputBorder(cardBorder !== baseBorder ? cardBorder : undefined, false),
    inputFocus: withAlpha(primary, 0.3),

    border: cardBorder,
    borderSubtle: '#f3f4f6',

    hover: 'rgba(0,0,0,0.02)',
    active: withAlpha(primary, 0.15),

    // Status colors — light mode variants
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#1d4ed8',

    successText: '#059669',
    warningText: '#d97706',
    errorText: '#dc2626',
    infoText: '#1d4ed8',

    successBg: 'rgba(16,185,129,0.1)',
    warningBg: 'rgba(245,158,11,0.1)',
    errorBg: '#fef2f2',
    infoBg: 'rgba(59,130,246,0.1)',

    successBorder: 'rgba(16,185,129,0.2)',
    warningBorder: 'rgba(245,158,11,0.2)',
    errorBorder: '#fecaca',
    infoBorder: 'rgba(59,130,246,0.2)',

    // Sidebar
    sidebarBg: navBg,
    sidebarBorder: navBorder,
    sidebarText: navText,
    sidebarTextMuted: navTextMuted,
    sidebarHover: navHover,
    sidebarActiveItemBg: withAlpha(primary, 0.15),
    sidebarActiveItemColor: primary,

    getContrastText: (hex: string) => getContrastText(hex, false),
    withAlpha,
  };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useTheme() — returns a fully-computed theme object based on agency settings.
 * 
 * Reads from AgencyContext:
 *   - agency.website_theme → 'dark' | 'light' (defaults to 'dark')
 *   - branding.primaryColor → hex string (defaults to '#10b981')
 *   - agency.branding_overrides → BrandingOverrides object (optional)
 * 
 * Returns a Theme object with all colors pre-computed, including sidebar-specific
 * colors that layout.tsx can consume directly.
 */
export function useTheme(): Theme {
  const { agency, branding } = useAgency();

  const mode = agency?.website_theme !== 'light' ? 'dark' : 'light';
  const primary = branding.primaryColor || '#10b981';
  const overrides = (agency as any)?.branding_overrides as BrandingOverrides | undefined;

  const theme = useMemo(() => {
    return mode === 'dark' 
      ? buildDarkTheme(primary, overrides) 
      : buildLightTheme(primary, overrides);
  }, [mode, primary, overrides]);

  return theme;
}

// ============================================================================
// STANDALONE THEME BUILDER (for use outside React components)
// ============================================================================

export function buildTheme(
  mode: 'dark' | 'light', 
  primary: string = '#10b981',
  overrides?: BrandingOverrides
): Theme {
  return mode === 'dark' ? buildDarkTheme(primary, overrides) : buildLightTheme(primary, overrides);
}

// Re-export utilities for use in components that need them directly
export { isLightColor, withAlpha, getContrastText, isValidHex };