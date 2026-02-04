// hooks/usePlanFeatures.ts
// React hook for checking plan features and limits

import { useAgency } from '@/app/agency/context';
import { 
  PLAN_LIMITS, 
  PLAN_PRICES,
  PLAN_NAMES,
  PlanType, 
  PlanFeature,
  canAccessFeature,
  getClientLimit,
  getClientLimitDisplay,
  isAtClientLimit,
  getUpgradeReason,
  isPlanHigherOrEqual,
  getMinimumPlanForFeature,
  normalizePlanType,
} from '@/lib/plan-limits';

export function usePlanFeatures() {
  const { agency } = useAgency();
  const agencyData = agency as any;
  
  // Normalize plan type to handle legacy 'scale' values
  const rawPlan = agencyData?.plan_type || agencyData?.plan || 'starter';
  const plan = normalizePlanType(rawPlan);
  const limits = PLAN_LIMITS[plan];
  const currentClients = agencyData?.client_count || 0;
  
  return {
    // Current plan info
    plan,
    planName: PLAN_NAMES[plan],
    planPrice: PLAN_PRICES[plan],
    limits,
    
    // Client capacity
    clientLimit: getClientLimit(plan),
    clientLimitDisplay: getClientLimitDisplay(plan),
    currentClients,
    isAtClientLimit: isAtClientLimit(plan, currentClients),
    clientsRemaining: Math.max(0, getClientLimit(plan) - currentClients),
    
    // Feature checks - boolean flags for easy use
    canUseCustomDomain: limits.customDomain,
    canUseMarketingSite: limits.marketingSite,
    canUseDemoPhoneNumber: limits.demoPhoneNumber,
    canUseSampleRecordings: limits.sampleRecordings,
    canUseWhitelabelEmails: limits.whitelabelEmails,
    canUseTollFreeNumbers: limits.tollFreeNumbers,
    canUseNumberPorting: limits.numberPorting,
    canUseAdvancedAnalytics: limits.advancedAnalytics,
    canUseCallVolumeTrends: limits.callVolumeTrends,
    canUseCustomReports: limits.customReports,
    canUseApiAccess: limits.apiAccess,
    canUseWebhooks: limits.webhooks,
    canUseCrmIntegrations: limits.crmIntegrations,
    canUseZapierIntegration: limits.zapierIntegration,
    canUseCustomIntegrations: limits.customIntegrations,
    canUseInvoiceCustomization: limits.invoiceCustomization,
    hasPrioritySupport: limits.prioritySupport,
    hasPhoneSupport: limits.phoneSupport,
    hasDedicatedSuccessManager: limits.dedicatedSuccessManager,
    hasSlaGuarantee: limits.slaGuarantee,
    supportLevel: limits.supportLevel,
    onboardingType: limits.onboardingType,
    
    // Generic feature check
    canAccess: (feature: PlanFeature) => canAccessFeature(plan, feature),
    
    // Upgrade helpers
    needsUpgradeFor: (feature: PlanFeature) => !canAccessFeature(plan, feature),
    getUpgradeMessage: (feature: PlanFeature) => getUpgradeReason(plan, feature),
    getMinimumPlan: (feature: PlanFeature) => getMinimumPlanForFeature(feature),
    
    // Plan comparison
    isPlanHigherOrEqual: (requiredPlan: PlanType) => isPlanHigherOrEqual(plan, requiredPlan),
    isStarter: plan === 'starter',
    isProfessional: plan === 'professional',
    isEnterprise: plan === 'enterprise',  // CHANGED from isScale
  };
}

// Type for the hook return value
export type PlanFeatures = ReturnType<typeof usePlanFeatures>;

// Export for use without hook (e.g., in API routes)
export {
  PLAN_LIMITS,
  PLAN_PRICES,
  PLAN_NAMES,
  canAccessFeature,
  getClientLimit,
  getClientLimitDisplay,
  isAtClientLimit,
  getUpgradeReason,
  isPlanHigherOrEqual,
  getMinimumPlanForFeature,
};

export type { PlanType, PlanFeature };