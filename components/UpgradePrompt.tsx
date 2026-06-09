// ============================================================================
// components/UpgradePrompt.tsx
//
// Reusable component shown when a client tries to access a feature
// NOT included in their plan tier (starter/pro/growth). Renders the feature
// name + description and a CTA to /client/upgrade-required.
//
// Phase 5 changes:
//   - Source label + description from lib/plan-features-meta so this surface
//     can't drift from the Settings UI and the signup widget.
//   - Fix CTA link: /client/upgrade → /client/upgrade-required (Bug 10).
//   - Drop sms_notifications (phantom key from Bug 11 — never existed in
//     plan_features JSONB).
//   - Add icons for the 6 keys that DO exist in plan_features but weren't
//     in the old FEATURE_INFO map: google_calendar, caller_recognition,
//     spam_detection, call_transfer, transfer_fallback, after_hours_mode.
//
// Usage (unchanged):
//   import UpgradePrompt from '@/components/UpgradePrompt';
//   import { useClientPlanFeatures } from '@/hooks/useClientPlanFeatures';
//
//   const { isFeatureEnabled } = useClientPlanFeatures(client, agency);
//
//   {!isFeatureEnabled('knowledge_base') ? (
//     <UpgradePrompt
//       feature="knowledge_base"
//       primaryColor={agency.primary_color}
//     />
//   ) : (
//     <KnowledgeBaseEditor ... />
//   )}
// ============================================================================

'use client';

import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { FEATURE_LABELS } from '@/lib/plan-features-meta';

interface UpgradePromptProps {
  // Accepts any string so callers don't break if they pass a stale key.
  // We look it up in FEATURE_LABELS and fall back gracefully.
  feature: string;
  primaryColor?: string;
  isDark?: boolean;
  /** Optional custom message override */
  message?: string;
  /** Optional custom CTA text */
  ctaText?: string;
}

// Icons live here, not in plan-features-meta, because the meta module is also
// imported on the server side (no JSX, no emoji baggage). Keys mirror
// FEATURE_LABELS in lib/plan-features-meta.ts — keep these two in sync when
// adding new client feature toggles.
const FEATURE_ICONS: Record<string, string> = {
  google_calendar: '📅',
  knowledge_base: '📚',
  custom_voice: '🎙️',
  custom_greeting: '👋',
  business_hours: '🕐',
  after_hours_mode: '🌙',
  caller_recognition: '👤',
  call_transfer: '📞',
  transfer_fallback: '↪️',
  spam_detection: '🛡️',
  email_summaries: '📧',
  advanced_analytics: '📊',
  priority_support: '⚡',
};

// Default fallback icon if a caller passes a feature key we don't recognize.
// Better than rendering nothing — at least the user sees the upgrade CTA.
const FALLBACK_ICON = '🔒';

// Convert a snake_case key into Title Case as a last-resort label fallback.
// Only used if the caller passes a feature key that isn't in FEATURE_LABELS.
function titleCaseFromKey(key: string): string {
  return key
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function UpgradePrompt({
  feature,
  primaryColor = '#2563eb',
  isDark = false,
  message,
  ctaText = 'Upgrade Your Plan',
}: UpgradePromptProps) {
  // Look up label + description from the canonical meta module. If the caller
  // passes a feature key that isn't there (e.g. legacy `sms_notifications`),
  // fall back to a title-cased version of the key so we still render
  // something useful rather than returning null and breaking the UI.
  const meta = FEATURE_LABELS[feature];
  const title = meta?.label ?? titleCaseFromKey(feature);
  const description = meta?.description ?? 'This feature is available on higher plans.';
  const icon = FEATURE_ICONS[feature] ?? FALLBACK_ICON;

  const bgColor = isDark ? 'rgba(255,255,255,0.02)' : '#fafafa';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const lockBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  return (
    <div
      className="rounded-xl p-5 sm:p-6 text-center"
      style={{
        backgroundColor: bgColor,
        border: `1px dashed ${borderColor}`,
      }}
    >
      <div
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
        style={{ backgroundColor: lockBg }}
      >
        <div className="relative">
          <span className="text-2xl">{icon}</span>
          <div
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: `1px solid ${borderColor}` }}
          >
            <Lock className="h-3 w-3" style={{ color: mutedColor }} />
          </div>
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: textColor }}>
        {title}
      </h3>

      <p className="text-sm mb-5 max-w-sm mx-auto" style={{ color: mutedColor }}>
        {message || description}
      </p>

      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
        style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
      >
        <Sparkles className="h-3 w-3" />
        Available on higher plans
      </div>

      <div>
        {/*
          Bug 10 fix: was href="/client/upgrade" which 404s. The actual route
          is /client/upgrade-required and has been since the Phase 1 currency
          fix shipped.
        */}
        <a
          href="/client/upgrade-required"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: primaryColor,
            color: '#ffffff',
          }}
        >
          {ctaText}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}