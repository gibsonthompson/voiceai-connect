// lib/plan-limits.ts
// Centralized plan configuration for feature gating
// IMPORTANT: Plan names must match backend (starter, professional, enterprise)

export const PLAN_LIMITS = {
  starter: {
    // Capacity - matches backend (25 clients)
    maxClients: 25,
    
    // Branding & Marketing
    customDomain: false,
    marketingSite: false,
    demoPhoneNumber: false,
    sampleRecordings: false,
    whitelabelEmails: false,
    
    // Phone Features
    tollFreeNumbers: false,
    numberPorting: false,
    
    // Analytics & Reporting
    advancedAnalytics: false,
    callVolumeTrends: false,
    customReports: false,
    
    // Integrations
    apiAccess: false,
    webhooks: false,
    crmIntegrations: false,
    zapierIntegration: false,
    customIntegrations: false,
    
    // Billing
    invoiceCustomization: false,
    
    // Support
    supportLevel: 'email' as const,
    prioritySupport: false,
    phoneSupport: false,
    dedicatedSuccessManager: false,
    slaGuarantee: false,
    onboardingType: 'self-serve' as const,
  },
  
  professional: {
    // Capacity - matches backend (100 clients)
    maxClients: 100,
    
    // Branding & Marketing
    customDomain: true,
    marketingSite: true,
    demoPhoneNumber: true,
    sampleRecordings: true,
    whitelabelEmails: false,
    
    // Phone Features
    tollFreeNumbers: true,
    numberPorting: true,
    
    // Analytics & Reporting
    advancedAnalytics: true,
    callVolumeTrends: true,
    customReports: false,
    
    // Integrations
    apiAccess: true,
    webhooks: true,
    crmIntegrations: true,
    zapierIntegration: true,
    customIntegrations: false,
    
    // Billing
    invoiceCustomization: true,
    
    // Support
    supportLevel: 'priority' as const,
    prioritySupport: true,
    phoneSupport: false,
    dedicatedSuccessManager: false,
    slaGuarantee: false,
    onboardingType: 'guided' as const,
  },
  
  // RENAMED from 'scale' to 'enterprise' to match backend
  enterprise: {
    // Capacity - matches backend (unlimited)
    maxClients: Infinity,
    
    // Branding & Marketing
    customDomain: true,
    marketingSite: true,
    demoPhoneNumber: true,
    sampleRecordings: true,
    whitelabelEmails: true,
    
    // Phone Features
    tollFreeNumbers: true,
    numberPorting: true,
    
    // Analytics & Reporting
    advancedAnalytics: true,
    callVolumeTrends: true,
    customReports: true,
    
    // Integrations
    apiAccess: true,
    webhooks: true,
    crmIntegrations: true,
    zapierIntegration: true,
    customIntegrations: true,
    
    // Billing
    invoiceCustomization: true,
    
    // Support
    supportLevel: 'dedicated' as const,
    prioritySupport: true,
    phoneSupport: true,
    dedicatedSuccessManager: true,
    slaGuarantee: true,
    onboardingType: 'white-glove' as const,
  },
} as const;

export const PLAN_PRICES = {
  starter: 99,
  professional: 199,
  enterprise: 499,  // RENAMED from 'scale'
} as const;

export const PLAN_NAMES = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',  // RENAMED from 'Scale'
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
export type PlanFeature = keyof typeof PLAN_LIMITS.starter;

// Helper functions
export function canAccessFeature(plan: PlanType, feature: PlanFeature): boolean {
  const planLimits = PLAN_LIMITS[plan];
  if (!planLimits) return false;
  const value = planLimits[feature];
  return typeof value === 'boolean' ? value : true;
}

export function getClientLimit(plan: PlanType): number {
  const planLimits = PLAN_LIMITS[plan];
  if (!planLimits) return 25; // Default to starter limit
  return planLimits.maxClients;
}

export function getClientLimitDisplay(plan: PlanType): string {
  const limit = getClientLimit(plan);
  return limit === Infinity ? 'Unlimited' : limit.toString();
}

export function getPlanPrice(plan: PlanType): number {
  return PLAN_PRICES[plan] || 99;
}

export function isAtClientLimit(plan: PlanType, currentClients: number): boolean {
  return currentClients >= getClientLimit(plan);
}

export function getUpgradeReason(plan: PlanType, feature: PlanFeature): string | null {
  if (canAccessFeature(plan, feature)) return null;
  
  const featureNames: Record<PlanFeature, string> = {
    maxClients: 'more clients',
    customDomain: 'custom domain',
    marketingSite: 'marketing website',
    demoPhoneNumber: 'demo phone number',
    sampleRecordings: 'sample recordings',
    whitelabelEmails: 'white-label emails',
    tollFreeNumbers: 'toll-free numbers',
    numberPorting: 'number porting',
    advancedAnalytics: 'advanced analytics',
    callVolumeTrends: 'call volume trends',
    customReports: 'custom reports',
    apiAccess: 'API access',
    webhooks: 'webhooks',
    crmIntegrations: 'CRM integrations',
    zapierIntegration: 'Zapier integration',
    customIntegrations: 'custom integrations',
    invoiceCustomization: 'invoice customization',
    supportLevel: 'upgraded support',
    prioritySupport: 'priority support',
    phoneSupport: 'phone support',
    dedicatedSuccessManager: 'dedicated success manager',
    slaGuarantee: 'SLA guarantee',
    onboardingType: 'guided onboarding',
  };
  
  return `Upgrade to unlock ${featureNames[feature]}`;
}

// Plan hierarchy for comparison
export const PLAN_HIERARCHY: PlanType[] = ['starter', 'professional', 'enterprise'];

export function isPlanHigherOrEqual(currentPlan: PlanType, requiredPlan: PlanType): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan);
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
  // Handle unknown plans gracefully
  if (currentIndex === -1) return false;
  if (requiredIndex === -1) return true;
  return currentIndex >= requiredIndex;
}

export function getMinimumPlanForFeature(feature: PlanFeature): PlanType {
  for (const plan of PLAN_HIERARCHY) {
    if (canAccessFeature(plan, feature)) {
      return plan;
    }
  }
  return 'enterprise';
}

// Legacy alias for backwards compatibility (if any code still uses 'scale')
export const LEGACY_PLAN_MAP: Record<string, PlanType> = {
  'scale': 'enterprise',
};

export function normalizePlanType(plan: string): PlanType {
  if (LEGACY_PLAN_MAP[plan]) {
    return LEGACY_PLAN_MAP[plan];
  }
  if (PLAN_HIERARCHY.includes(plan as PlanType)) {
    return plan as PlanType;
  }
  return 'starter'; // Default fallback
}