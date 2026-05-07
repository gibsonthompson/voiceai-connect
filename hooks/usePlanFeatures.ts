// hooks/usePlanFeatures.ts
// React hook for checking plan features and limits
// REWRITTEN: 2026-05-06 — Pricing Restructure (free/pro/scale)

import { useAgency } from '@/app/agency/context';
import {
  PLAN_LIMITS,
  PLAN_PRICES,
  PLAN_RATES,
  PLAN_NAMES,
  PlanType,
  PlanFeature,
  canAccessFeature,
  getTeamMemberLimit,
  getTeamMemberLimitDisplay,
  getUpgradeReason,
  isPlanHigherOrEqual,
  getMinimumPlanForFeature,
  hasWhiteLabel,
  normalizePlanType,
} from '@/lib/plan-limits';

export function usePlanFeatures() {
  const { agency, effectivePlan } = useAgency();
  const agencyData = agency as any;

  // Use effectivePlan from context (scale during trial, real plan after)
  const plan = normalizePlanType(effectivePlan);
  const limits = PLAN_LIMITS[plan];
  const rates = PLAN_RATES[plan];

  return {
    // ── Current plan info ──────────────────────────────────────────────
    plan,
    planName: PLAN_NAMES[plan],
    planPrice: PLAN_PRICES[plan],
    limits,
    rates,

    // ── Usage-based pricing info ───────────────────────────────────────
    perClientRate: rates.perClient,
    perMinuteRate: rates.perMinute,
    platformFee: PLAN_PRICES[plan],

    // ── Team capacity ──────────────────────────────────────────────────
    teamMemberLimit: getTeamMemberLimit(plan),
    teamMemberLimitDisplay: getTeamMemberLimitDisplay(plan),

    // ── White-label ────────────────────────────────────────────────────
    hasWhiteLabel: hasWhiteLabel(plan),
    isVoiceAIBranded: !hasWhiteLabel(plan), // Free tier = VoiceAI Connect branding

    // ── Feature checks — boolean flags ─────────────────────────────────
    // White-label & Branding
    canUseWhiteLabel: limits.whiteLabel,
    canUseCustomDomain: limits.customDomain,
    canUseCustomBranding: limits.customBranding,

    // Marketing & Sales
    canUseMarketingSite: limits.marketingSite,
    canUseDemoPhoneNumber: limits.demoPhoneNumber,

    // Lead Generation
    canUseLeadFinderBasic: limits.leadFinderBasic,
    canUseLeadFinderAdvanced: limits.leadFinderAdvanced,
    canUseLeadFinder: limits.leadFinderBasic, // alias

    // AI Lab
    canUseAiLab: limits.aiLab,
    canUseIndustryTemplates: limits.industryTemplates,

    // Analytics
    canUseFullAnalytics: limits.fullAnalytics,

    // Integrations
    canUseApiAccess: limits.apiAccess,

    // Support
    hasPrioritySupport: limits.prioritySupport,
    supportLevel: limits.supportLevel,

    // ── Generic feature check ──────────────────────────────────────────
    canAccess: (feature: PlanFeature) => canAccessFeature(plan, feature),

    // ── Upgrade helpers ────────────────────────────────────────────────
    needsUpgradeFor: (feature: PlanFeature) => !canAccessFeature(plan, feature),
    getUpgradeMessage: (feature: PlanFeature) => getUpgradeReason(plan, feature),
    getMinimumPlan: (feature: PlanFeature) => getMinimumPlanForFeature(feature),

    // ── Plan comparison ────────────────────────────────────────────────
    isPlanHigherOrEqual: (requiredPlan: PlanType) => isPlanHigherOrEqual(plan, requiredPlan),
    isFree: plan === 'free',
    isPro: plan === 'pro',
    isScale: plan === 'scale',

    // ── Legacy aliases (for code that still checks old names) ──────────
    isStarter: plan === 'free',
    isProfessional: plan === 'pro',
    isEnterprise: plan === 'scale',
  };
}

// Type for the hook return value
export type PlanFeatures = ReturnType<typeof usePlanFeatures>;

// Re-export for use without hook (e.g., in API routes or server components)
export {
  PLAN_LIMITS,
  PLAN_PRICES,
  PLAN_RATES,
  PLAN_NAMES,
  canAccessFeature,
  getTeamMemberLimit,
  getTeamMemberLimitDisplay,
  getUpgradeReason,
  isPlanHigherOrEqual,
  getMinimumPlanForFeature,
  hasWhiteLabel,
  normalizePlanType,
};

export type { PlanType, PlanFeature };