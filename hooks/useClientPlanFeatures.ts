// ============================================================================
// hooks/useClientPlanFeatures.ts
// 
// Client-side hook to check if a feature is enabled for the current client's
// plan. Uses the agency's plan_features config + client's plan_type.
//
// Usage in client pages:
//   const { isFeatureEnabled, loading } = useClientPlanFeatures();
//   
//   if (!isFeatureEnabled('knowledge_base')) {
//     return <UpgradePrompt feature="knowledge_base" />;
//   }
//
// This is for CLIENT dashboard pages (not agency dashboard).
// Agency-level feature gating uses the existing usePlanFeatures.ts hook.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

// Feature keys that can be gated per client plan
export type ClientFeatureKey = 
  | 'sms_notifications'
  | 'email_summaries'
  | 'custom_greeting'
  | 'custom_voice'
  | 'knowledge_base'
  | 'business_hours'
  | 'advanced_analytics'
  | 'priority_support';

// Human-readable labels for upgrade prompts
export const CLIENT_FEATURE_LABELS: Record<ClientFeatureKey, string> = {
  sms_notifications: 'SMS Notifications',
  email_summaries: 'Email Summaries',
  custom_greeting: 'Custom Greeting',
  custom_voice: 'Custom Voice',
  knowledge_base: 'Knowledge Base',
  business_hours: 'Business Hours',
  advanced_analytics: 'Advanced Analytics',
  priority_support: 'Priority Support',
};

// Fallback: if agency hasn't configured plan_features yet,
// use these defaults so nothing breaks
const DEFAULT_PLAN_FEATURES: Record<string, Record<string, boolean>> = {
  starter: {
    sms_notifications: true,
    email_summaries: false,
    custom_greeting: false,
    custom_voice: false,
    knowledge_base: false,
    business_hours: false,
    advanced_analytics: false,
    priority_support: false,
  },
  pro: {
    sms_notifications: true,
    email_summaries: true,
    custom_greeting: true,
    custom_voice: false,
    knowledge_base: true,
    business_hours: true,
    advanced_analytics: true,
    priority_support: false,
  },
  growth: {
    sms_notifications: true,
    email_summaries: true,
    custom_greeting: true,
    custom_voice: true,
    knowledge_base: true,
    business_hours: true,
    advanced_analytics: true,
    priority_support: true,
  },
};

interface UseClientPlanFeaturesReturn {
  /** Check if a specific feature is enabled for this client's plan */
  isFeatureEnabled: (feature: ClientFeatureKey) => boolean;
  /** All features and their enabled state for this client's plan */
  features: Record<string, boolean>;
  /** Client's current plan type */
  planType: string;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
}

/**
 * Hook to check client plan features.
 * 
 * Requires the client context to provide:
 * - client.plan_type (e.g., 'starter', 'pro', 'growth')
 * - agency.plan_features (the JSONB config from the agencies table)
 * 
 * @param client - Client object with plan_type
 * @param agency - Agency object with plan_features
 */
export function useClientPlanFeatures(
  client: { plan_type?: string } | null,
  agency: { plan_features?: Record<string, Record<string, boolean>> } | null
): UseClientPlanFeaturesReturn {
  const planType = client?.plan_type || 'starter';
  const agencyFeatures = agency?.plan_features || DEFAULT_PLAN_FEATURES;
  
  const features = agencyFeatures[planType] || DEFAULT_PLAN_FEATURES[planType] || DEFAULT_PLAN_FEATURES.starter;

  const isFeatureEnabled = useCallback(
    (feature: ClientFeatureKey): boolean => {
      return features[feature] ?? false;
    },
    [features]
  );

  return {
    isFeatureEnabled,
    features,
    planType,
    loading: !client || !agency,
    error: null,
  };
}

/**
 * Standalone function (non-hook) for use in API routes or server components.
 * Checks if a feature is enabled for a given plan under a given agency's config.
 */
export function checkClientFeature(
  planType: string,
  featureKey: ClientFeatureKey,
  agencyPlanFeatures?: Record<string, Record<string, boolean>>
): boolean {
  const features = agencyPlanFeatures || DEFAULT_PLAN_FEATURES;
  const planFeatures = features[planType] || DEFAULT_PLAN_FEATURES[planType] || {};
  return planFeatures[featureKey] ?? false;
}