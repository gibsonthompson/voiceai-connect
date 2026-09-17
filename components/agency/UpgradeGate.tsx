'use client';

import { Sparkles, ExternalLink } from 'lucide-react';

// Shared locked-feature overlay. The real feature UI shows through, blurred and
// dimmed, so it's clear what's behind the lock. A dark, near-solid card floats
// over it. The card itself carries the contrast (dark fill + backdrop blur +
// shadow), NOT a scrim over the whole panel, so what's underneath stays visible.
// Used by the API / Webhooks (Scale) and Team (Pro) locks. tier drives the copy.
export default function UpgradeGate({
  locked,
  tier = 'pro',
  title,
  description,
  theme,
  children,
}: {
  locked: boolean;
  tier?: 'pro' | 'scale';
  title: string;
  description: string;
  theme: any;
  children: React.ReactNode;
}) {
  if (!locked) return <>{children}</>;
  const tierLabel = tier === 'scale' ? 'Scale' : 'Pro';
  return (
    <div className="relative">
      {/* Blurred, dimmed preview of the real feature. Height-capped so the lock
          never leaves a tall empty box around the card. */}
      <div
        className="pointer-events-none select-none overflow-hidden"
        style={{ filter: 'blur(2px)', opacity: 0.5, maxHeight: 440 }}
        aria-hidden="true"
      >
        {children}
      </div>
      {/* Dark, near-solid card centered over the preview. No background scrim. */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="rounded-2xl p-5 sm:p-6 pointer-events-auto w-full max-w-md"
          style={{
            backgroundColor: theme.isDark ? 'rgba(10,12,14,0.97)' : 'rgba(255,255,255,0.98)',
            border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.09)' : theme.border}`,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: theme.isDark
              ? '0 30px 70px rgba(0,0,0,0.78), 0 0 0 1px rgba(255,255,255,0.03)'
              : '0 24px 60px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}cc 100%)` }}
            >
              <Sparkles className="h-5 w-5" style={{ color: theme.primaryText }} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>{title}</p>
              <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Available on {tierLabel}{tier === 'pro' ? ' and above' : ''}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm mb-4 leading-relaxed" style={{ color: theme.textMuted }}>{description}</p>
          <a
            href="/agency/settings?tab=billing"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            Upgrade to {tierLabel}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}