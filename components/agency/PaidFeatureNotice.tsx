'use client';

// components/agency/PaidFeatureNotice.tsx
// Reusable "this is a paid-plan feature" card, themed to match the agency
// dashboard (works in both light and dark agency themes via the theme object).
// Used anywhere a free-plan agency hits a paid-only feature (test AI, demos)
// so they see a friendly upgrade prompt instead of a button that fails or a
// red error box. The backend enforces the same gate (403 upgrade_required);
// this is the matching front-end surface.

import Link from 'next/link';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';

interface PaidFeatureNoticeProps {
  theme: any;
  title: string;
  message: string;
  cta?: string;
  // Optional custom icon (e.g. a FlaskConical for Test AI). Defaults to Sparkles.
  icon?: React.ReactNode;
  className?: string;
}

// Single source of truth for where "upgrade" sends the agency. Matches the
// existing UpgradeBanner / billing links across the dashboard.
const BILLING_HREF = '/agency/settings?tab=billing';

export default function PaidFeatureNotice({
  theme,
  title,
  message,
  cta = 'Upgrade to unlock',
  icon,
  className = '',
}: PaidFeatureNoticeProps) {
  return (
    <div
      className={`rounded-xl p-4 sm:p-5 overflow-hidden ${className}`}
      style={{
        background: theme.isDark
          ? `linear-gradient(135deg, ${theme.primary}12 0%, ${theme.primary}04 100%)`
          : `linear-gradient(135deg, ${theme.primary}08 0%, ${theme.primary}02 100%)`,
        border: `1px solid ${theme.primary}30`,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
          style={{ backgroundColor: theme.primary15 }}
        >
          {icon || <Sparkles className="h-4 w-4" style={{ color: theme.primary }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>
              {title}
            </h3>
            <span
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider"
              style={{ backgroundColor: theme.primary15, color: theme.primary }}
            >
              <Lock className="h-2.5 w-2.5" />
              Paid plans
            </span>
          </div>
          <p className="text-xs sm:text-sm mb-3 sm:max-w-[640px]" style={{ color: theme.textMuted }}>
            {message}
          </p>
          <Link
            href={BILLING_HREF}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            {cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}