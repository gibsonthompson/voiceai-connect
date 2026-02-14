'use client';

import { Lock, ArrowUpRight } from 'lucide-react';
import type { ClientFeatureKey } from '@/app/client/context';
import { CLIENT_FEATURE_LABELS } from '@/app/client/context';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

interface UpgradePromptProps {
  feature: ClientFeatureKey;
  primaryColor: string;
  isDark: boolean;
  message?: string;
}

export default function UpgradePrompt({ feature, primaryColor, isDark, message }: UpgradePromptProps) {
  const featureInfo = CLIENT_FEATURE_LABELS[feature];
  const primaryLight = isLightColor(primaryColor);
  
  const theme = isDark ? {
    text: '#fafaf9',
    textMuted: 'rgba(250, 250, 249, 0.5)',
  } : {
    text: '#111827',
    textMuted: '#9ca3af',
  };

  return (
    <div 
      className="rounded-xl border-2 border-dashed p-5 sm:p-6 text-center"
      style={{ 
        borderColor: hexToRgba(primaryColor, 0.3),
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb',
      }}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: hexToRgba(primaryColor, isDark ? 0.15 : 0.1) }}
      >
        <Lock className="w-5 h-5" style={{ color: primaryColor }} />
      </div>
      
      <h4 className="font-semibold text-sm sm:text-base mb-1" style={{ color: theme.text }}>
        {featureInfo?.title || feature}
      </h4>
      
      <p className="text-xs sm:text-sm mb-4 max-w-sm mx-auto" style={{ color: theme.textMuted }}>
        {message || featureInfo?.description || 'This feature is available on a higher plan.'}
      </p>
      
      <div 
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3"
        style={{ 
          backgroundColor: hexToRgba(primaryColor, isDark ? 0.1 : 0.08),
          color: primaryColor,
        }}
      >
        <Lock className="w-3 h-3" />
        Available on a higher plan
      </div>
      
      <div>
        <a
          href="/client/upgrade"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition hover:opacity-90"
          style={{ 
            backgroundColor: primaryColor, 
            color: primaryLight ? '#111827' : '#ffffff',
          }}
        >
          Upgrade Your Plan
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}