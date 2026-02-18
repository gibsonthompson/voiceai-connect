'use client';

import { useMemo } from 'react';
import { useClient } from '@/app/client/context';

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

export function useClientTheme() {
  const { client, branding } = useClient();

  return useMemo(() => {
    const isDark = branding.websiteTheme === 'dark';
    const primary = branding.primaryColor || '#3b82f6';
    const overrides = client?.agency?.branding_overrides;

    return {
      isDark,
      primary,
      primaryText: getContrastColor(primary),
      primary15: hexToRgba(primary, 0.15),
      primary20: hexToRgba(primary, 0.2),
      primary30: hexToRgba(primary, 0.3),

      // Core colors - with override support
      bg: overrides?.page_bg || (isDark ? '#0a0a0a' : '#f9fafb'),
      text: overrides?.text_primary || (isDark ? '#fafaf9' : '#111827'),
      textMuted: overrides?.text_muted || (isDark ? 'rgba(250,250,249,0.7)' : '#6b7280'),
      textMuted4: isDark ? 'rgba(250,250,249,0.5)' : '#9ca3af',
      border: overrides?.card_border || (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'),
      borderSubtle: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
      card: overrides?.card_bg || (isDark ? '#111111' : '#ffffff'),
      hover: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
      input: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
      inputBorder: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',

      // Nav
      navBg: overrides?.nav_bg || (isDark ? '#0a0a0a' : '#ffffff'),
      navText: overrides?.nav_text || (isDark ? '#fafaf9' : '#111827'),
      buttonText: overrides?.button_text || getContrastColor(primary),

      // Semantic colors
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
  }, [branding, client?.agency?.branding_overrides]);
}
