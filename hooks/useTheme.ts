// ============================================================================
// useTheme() - Centralized Theme System for Agency Dashboard
// ============================================================================
// 
// Replaces the pattern of every page doing:
//   const isDark = agency?.website_theme !== 'light';
//   const textColor = isDark ? '#fafaf9' : '#111827';
//   ... 8 more lines
//
// Usage:
//   import { useTheme } from '@/hooks/useTheme';
//   const theme = useTheme();
//   <div style={{ backgroundColor: theme.bg, color: theme.text }}>
//
// The theme is derived from TWO agency settings:
//   1. website_theme: 'dark' | 'light' (base mode - set in branding settings)
//   2. primary_color: hex string (brand color - buttons, accents, active states)
//
// Everything else (backgrounds, text, borders, surfaces) is auto-calculated.
// ============================================================================

'use client';

import { useMemo } from 'react';
import { useAgency } from '@/app/agency/context';

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
  primary10: string; // very subtle bg
  primary15: string; // icon/avatar bg, badge bg
  primary20: string; // border accent
  primary30: string; // stronger border
  primary80: string; // muted icon color

  // Core layout colors
  bg: string;         // page background
  text: string;       // primary text
  textMuted: string;  // secondary/muted text
  textSubtle: string; // even more subtle (timestamps, hints)

  // Surface colors (cards, modals, sections)
  card: string;       // card/section background
  cardHover: string;  // card hover state

  // Input/form colors
  input: string;      // input background
  inputBorder: string; // input border
  inputFocus: string; // input focus ring (uses primary)

  // Border colors
  border: string;     // default border
  borderSubtle: string; // very subtle dividers

  // Interactive states
  hover: string;      // generic hover bg
  active: string;     // active/selected bg (uses primary)

  // Status colors (not affected by theme - universal)
  success: string;
  warning: string;
  error: string;
  info: string;

  // Status text (slightly different in dark/light for readability)
  successText: string;
  warningText: string;
  errorText: string;
  infoText: string;

  // Status backgrounds
  successBg: string;
  warningBg: string;
  errorBg: string;
  infoBg: string;

  // Status borders
  successBorder: string;
  warningBorder: string;
  errorBorder: string;
  infoBorder: string;

  // Sidebar-specific (may differ slightly from main content)
  sidebarBg: string;
  sidebarBorder: string;

  // Utility function: get contrast text for any color
  getContrastText: (hex: string) => string;
  // Utility function: create alpha variant of any color
  withAlpha: (hex: string, alpha: number) => string;
}

// ============================================================================
// DARK THEME GENERATOR
// ============================================================================
function buildDarkTheme(primary: string): Theme {
  return {
    isDark: true,
    primary,
    primaryText: getContrastText(primary, true),
    primary10: withAlpha(primary, 0.10),
    primary15: withAlpha(primary, 0.15),
    primary20: withAlpha(primary, 0.20),
    primary30: withAlpha(primary, 0.30),
    primary80: withAlpha(primary, 0.80),

    bg: '#050505',
    text: '#fafaf9',
    textMuted: 'rgba(250,250,249,0.5)',
    textSubtle: 'rgba(250,250,249,0.35)',

    card: 'rgba(255,255,255,0.02)',
    cardHover: 'rgba(255,255,255,0.04)',

    input: 'rgba(255,255,255,0.04)',
    inputBorder: 'rgba(255,255,255,0.08)',
    inputFocus: withAlpha(primary, 0.3),

    border: 'rgba(255,255,255,0.06)',
    borderSubtle: 'rgba(255,255,255,0.04)',

    hover: 'rgba(255,255,255,0.04)',
    active: withAlpha(primary, 0.15),

    // Status colors - dark mode variants
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

    sidebarBg: '#050505',
    sidebarBorder: 'rgba(255,255,255,0.06)',

    getContrastText: (hex: string) => getContrastText(hex, true),
    withAlpha,
  };
}

// ============================================================================
// LIGHT THEME GENERATOR
// ============================================================================
function buildLightTheme(primary: string): Theme {
  return {
    isDark: false,
    primary,
    primaryText: getContrastText(primary, false),
    primary10: withAlpha(primary, 0.10),
    primary15: withAlpha(primary, 0.15),
    primary20: withAlpha(primary, 0.20),
    primary30: withAlpha(primary, 0.30),
    primary80: withAlpha(primary, 0.80),

    bg: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    textSubtle: '#9ca3af',

    card: '#ffffff',
    cardHover: '#f9fafb',

    input: '#ffffff',
    inputBorder: '#e5e7eb',
    inputFocus: withAlpha(primary, 0.3),

    border: '#e5e7eb',
    borderSubtle: '#f3f4f6',

    hover: 'rgba(0,0,0,0.02)',
    active: withAlpha(primary, 0.15),

    // Status colors - light mode variants
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

    sidebarBg: '#ffffff',
    sidebarBorder: '#e5e7eb',

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
 * 
 * Returns a Theme object with all colors pre-computed.
 * Memoized so it only recalculates when inputs change.
 * 
 * Example migration:
 * 
 * BEFORE (in every page):
 *   const isDark = agency?.website_theme !== 'light';
 *   const primaryColor = branding.primaryColor || '#10b981';
 *   const textColor = isDark ? '#fafaf9' : '#111827';
 *   const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
 *   const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
 *   const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
 *   const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
 *   const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
 *   ...
 *   <div style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
 * 
 * AFTER:
 *   const theme = useTheme();
 *   ...
 *   <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
 */
export function useTheme(): Theme {
  const { agency, branding } = useAgency();

  const mode = agency?.website_theme !== 'light' ? 'dark' : 'light';
  const primary = branding.primaryColor || '#10b981';

  const theme = useMemo(() => {
    return mode === 'dark' ? buildDarkTheme(primary) : buildLightTheme(primary);
  }, [mode, primary]);

  return theme;
}

// ============================================================================
// STANDALONE THEME BUILDER (for use outside React components)
// ============================================================================

/**
 * buildTheme() — same logic as useTheme() but doesn't require React context.
 * Useful for server-side rendering, utility functions, or non-component code.
 */
export function buildTheme(mode: 'dark' | 'light', primary: string = '#10b981'): Theme {
  return mode === 'dark' ? buildDarkTheme(primary) : buildLightTheme(primary);
}