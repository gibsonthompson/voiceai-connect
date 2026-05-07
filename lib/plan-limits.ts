// lib/plan-limits.ts
// Centralized plan configuration for feature gating
// REWRITTEN: 2026-05-06 — Pricing Restructure (free/pro/scale + usage-based billing)
// IMPORTANT: Includes legacy aliases (starter/professional/enterprise) so existing
//            UI code compiles during transition. Remove after Phase 2 UI migration.

// ============================================================================
// PLAN FEATURE GATES
// ============================================================================

const FREE_FEATURES = {
  maxClients: Infinity,
  whiteLabel: false,
  customDomain: false,
  customBranding: false,
  marketingSite: false,
  demoPhoneNumber: false,
  leadFinderBasic: false,
  leadFinderAdvanced: false,
  aiLab: false,
  industryTemplates: false,
  maxTeamMembers: 0,
  basicAnalytics: true,
  fullAnalytics: false,
  apiAccess: false,
  aiReceptionist: true,
  callNotificationsSms: true,
  callNotificationsEmail: true,
  spamDetection: true,
  callerRecognition: true,
  clientManagement: true,
  supportLevel: 'community' as const,
  prioritySupport: false,
} as const;

const PRO_FEATURES = {
  maxClients: Infinity,
  whiteLabel: true,
  customDomain: true,
  customBranding: true,
  marketingSite: true,
  demoPhoneNumber: true,
  leadFinderBasic: true,
  leadFinderAdvanced: false,
  aiLab: false,
  industryTemplates: false,
  maxTeamMembers: 5,
  basicAnalytics: true,
  fullAnalytics: true,
  apiAccess: false,
  aiReceptionist: true,
  callNotificationsSms: true,
  callNotificationsEmail: true,
  spamDetection: true,
  callerRecognition: true,
  clientManagement: true,
  supportLevel: 'email' as const,
  prioritySupport: false,
} as const;

const SCALE_FEATURES = {
  maxClients: Infinity,
  whiteLabel: true,
  customDomain: true,
  customBranding: true,
  marketingSite: true,
  demoPhoneNumber: true,
  leadFinderBasic: true,
  leadFinderAdvanced: true,
  aiLab: true,
  industryTemplates: true,
  maxTeamMembers: Infinity,
  basicAnalytics: true,
  fullAnalytics: true,
  apiAccess: true,
  aiReceptionist: true,
  callNotificationsSms: true,
  callNotificationsEmail: true,
  spamDetection: true,
  callerRecognition: true,
  clientManagement: true,
  supportLevel: 'priority' as const,
  prioritySupport: true,
} as const;

export const PLAN_LIMITS = {
  // New plan names
  free: FREE_FEATURES,
  pro: PRO_FEATURES,
  scale: SCALE_FEATURES,
  // Legacy aliases (same feature objects — keeps all existing UI code compiling)
  starter: FREE_FEATURES,
  professional: PRO_FEATURES,
  enterprise: SCALE_FEATURES,
};

// ============================================================================
// PRICING
// ============================================================================
export const PLAN_PRICES = {
  free: 0,
  pro: 199,
  scale: 499,
  starter: 0,
  professional: 199,
  enterprise: 499,
} as const;

export const PLAN_RATES = {
  free:  { perClient: 39.99, perMinute: 0.12 },
  pro:   { perClient: 9.99,  perMinute: 0.10 },
  scale: { perClient: 0,     perMinute: 0.05 },
  starter:      { perClient: 39.99, perMinute: 0.12 },
  professional: { perClient: 9.99,  perMinute: 0.10 },
  enterprise:   { perClient: 0,     perMinute: 0.05 },
} as const;

export const PLAN_NAMES = {
  free: 'Free',
  pro: 'Pro',
  scale: 'Scale',
  starter: 'Free',
  professional: 'Pro',
  enterprise: 'Scale',
} as const;

// ============================================================================
// TYPES — includes both new and legacy names so all existing code compiles
// ============================================================================
export type PlanType = keyof typeof PLAN_LIMITS;
//  = 'free' | 'pro' | 'scale' | 'starter' | 'professional' | 'enterprise'

export type PlanFeature = keyof typeof FREE_FEATURES;

// ============================================================================
// PLAN HIERARCHY
// ============================================================================
export const PLAN_HIERARCHY: PlanType[] = ['free', 'pro', 'scale'];
export const LEGACY_PLAN_HIERARCHY: PlanType[] = ['starter', 'professional', 'enterprise'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function canAccessFeature(plan: PlanType, feature: PlanFeature): boolean {
  const planLimits = PLAN_LIMITS[plan];
  if (!planLimits) return false;
  const value = planLimits[feature];
  return typeof value === 'boolean' ? value : true;
}

export function getClientLimit(plan: PlanType): number {
  return Infinity;
}

export function getClientLimitDisplay(plan: PlanType): string {
  return 'Unlimited';
}

export function getTeamMemberLimit(plan: PlanType): number {
  const planLimits = PLAN_LIMITS[plan];
  if (!planLimits) return 0;
  return planLimits.maxTeamMembers;
}

export function getTeamMemberLimitDisplay(plan: PlanType): string {
  const limit = getTeamMemberLimit(plan);
  return limit === Infinity ? 'Unlimited' : limit.toString();
}

export function getPlanPrice(plan: PlanType): number {
  return PLAN_PRICES[plan] ?? 0;
}

export function getPlanRates(plan: PlanType) {
  return PLAN_RATES[plan] || PLAN_RATES.free;
}

export function isAtClientLimit(plan: PlanType, currentClients: number): boolean {
  return false;
}

export function hasWhiteLabel(plan: PlanType): boolean {
  const limits = PLAN_LIMITS[plan];
  return limits?.whiteLabel ?? false;
}

export function isPlanHigherOrEqual(currentPlan: PlanType, requiredPlan: PlanType): boolean {
  const norm = (p: PlanType): PlanType => (LEGACY_PLAN_MAP[p] as PlanType) || p;
  const currentIndex = PLAN_HIERARCHY.indexOf(norm(currentPlan));
  const requiredIndex = PLAN_HIERARCHY.indexOf(norm(requiredPlan));
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
  return 'scale';
}

export function getUpgradeReason(plan: PlanType, feature: PlanFeature): string | null {
  if (canAccessFeature(plan, feature)) return null;

  const featureNames: Record<string, string> = {
    whiteLabel: 'white-label branding',
    customDomain: 'custom domain',
    customBranding: 'custom branding',
    marketingSite: 'marketing website',
    demoPhoneNumber: 'demo phone number',
    leadFinderBasic: 'lead finder',
    leadFinderAdvanced: 'advanced lead finder',
    aiLab: 'AI Lab',
    industryTemplates: 'industry templates',
    maxTeamMembers: 'team members',
    fullAnalytics: 'full analytics',
    apiAccess: 'API access',
    prioritySupport: 'priority support',
  };

  const name = featureNames[feature] || feature;
  const minimumPlan = getMinimumPlanForFeature(feature);
  return `Upgrade to ${PLAN_NAMES[minimumPlan]} to unlock ${name}`;
}

// ============================================================================
// LEGACY PLAN MAPPING (old names → new names for normalization)
// ============================================================================
export const LEGACY_PLAN_MAP: Record<string, PlanType> = {
  starter: 'free',
  professional: 'pro',
  enterprise: 'scale',
};

export function normalizePlanType(plan: string | undefined | null): PlanType {
  if (!plan) return 'free';
  const lower = plan.toLowerCase();
  if (lower in PLAN_LIMITS) return lower as PlanType;
  return 'free';
}