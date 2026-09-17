'use client';

import { Sparkles, ExternalLink } from 'lucide-react';

// Shared locked-feature overlay, matching the settings ProFeatureGate exactly:
// the real feature UI renders blurred behind a scrim, with an upgrade card
// floating over it. Used by the API (Scale) and Team (Pro) locks so every gated
// feature in the dashboard reads the same way. tier drives the plan copy.
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
      {/* Blurred preview of what the feature looks like, so it's clear what's behind the lock. */}
      <div className="opacity-30 pointer-events-none select-none" style={{ filter: 'blur(3px)' }} aria-hidden="true">
        {children}
      </div>
      {/* Scrim: separates the blurred preview from the card so the modal reads clearly. */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{ backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-start justify-center pt-6 sm:pt-10 px-4 pointer-events-none">
        <div
          className="rounded-2xl p-5 sm:p-6 pointer-events-auto w-full max-w-md"
          style={{
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.isDark
              ? '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)'
              : '0 24px 60px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.04)',
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