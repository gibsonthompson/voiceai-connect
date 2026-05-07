// lib/plan-limits.ts
// Centralized plan configuration for feature gating
// REWRITTEN: 2026-05-06 — Pricing Restructure (free/pro/scale + usage-based billing)
// IMPORTANT: Plan names must match backend (free, pro, scale)

// ============================================================================
// PLAN FEATURE GATES
// ============================================================================
export const PLAN_LIMITS = {
  free: {
    // Capacity
    maxClients: Infinity, // No client limit — usage-based billing

    // White-label & Branding
    whiteLabel: false,      // VoiceAI Connect branding hardcoded
    customDomain: false,
    customBranding: false,  // logo, colors, name

    // Marketing & Sales Tools
    marketingSite: false,
    demoPhoneNumber: false,

    // Lead Generation
    leadFinderBasic: false,
    leadFinderAdvanced: false,

    // AI Lab
    aiLab: false,
    industryTemplates: false,

    // Team
    maxTeamMembers: 0,

    // Analytics
    basicAnalytics: true,
    fullAnalytics: false,

    // Integrations
    apiAccess: false,

    // Core Features (included on all tiers)
    aiReceptionist: true,
    callNotificationsSms: true,
    callNotificationsEmail: true,
    spamDetection: true,
    callerRecognition: true,
    clientManagement: true,

    // Support
    supportLevel: 'community' as const,
    prioritySupport: false,
  },

  pro: {
    // Capacity
    maxClients: Infinity, // No client limit — usage-based billing

    // White-label & Branding
    whiteLabel: true,
    customDomain: true,
    customBranding: true,

    // Marketing & Sales Tools
    marketingSite: true,
    demoPhoneNumber: true,

    // Lead Generation
    leadFinderBasic: true,
    leadFinderAdvanced: false,

    // AI Lab
    aiLab: false,
    industryTemplates: false,

    // Team
    maxTeamMembers: 5,

    // Analytics
    basicAnalytics: true,
    fullAnalytics: true,

    // Integrations
    apiAccess: false,

    // Core Features
    aiReceptionist: true,
    callNotificationsSms: true,
    callNotificationsEmail: true,
    spamDetection: true,
    callerRecognition: true,
    clientManagement: true,

    // Support
    supportLevel: 'email' as const,
    prioritySupport: false,
  },

  scale: {
    // Capacity
    maxClients: Infinity, // No client limit — usage-based billing

    // White-label & Branding
    whiteLabel: true,
    customDomain: true,
    customBranding: true,

    // Marketing & Sales Tools
    marketingSite: true,
    demoPhoneNumber: true,

    // Lead Generation
    leadFinderBasic: true,
    leadFinderAdvanced: true,

    // AI Lab
    aiLab: true,
    industryTemplates: true,

    // Team
    maxTeamMembers: Infinity,

    // Analytics
    basicAnalytics: true,
    fullAnalytics: true,

    // Integrations
    apiAccess: true,

    // Core Features
    aiReceptionist: true,
    callNotificationsSms: true,
    callNotificationsEmail: true,
    spamDetection: true,
    callerRecognition: true,
    clientManagement: true,

    // Support
    supportLevel: 'priority' as const,
    prioritySupport: true,
  },
} as const;

// ============================================================================
// PRICING (platform fees — per-client and per-minute are in usage tracker)
// ============================================================================
export const PLAN_PRICES = {
  free: 0,
  pro: 199,
  scale: 499,
  // Legacy aliases (layout.tsx, sidebar, etc. still reference old names)
  starter: 0,
  professional: 199,
  enterprise: 499,
} as const;

export const PLAN_RATES = {
  free:  { perClient: 39.99, perMinute: 0.12 },
  pro:   { perClient: 9.99,  perMinute: 0.10 },
  scale: { perClient: 0,     perMinute: 0.05 },
  // Legacy aliases
  starter:      { perClient: 39.99, perMinute: 0.12 },
  professional: { perClient: 9.99,  perMinute: 0.10 },
  enterprise:   { perClient: 0,     perMinute: 0.05 },
} as const;

export const PLAN_NAMES = {
  free: 'Free',
  pro: 'Pro',
  scale: 'Scale',
  // Legacy aliases (layout.tsx, sidebar, etc. still reference old names)
  starter: 'Free',
  professional: 'Pro',
  enterprise: 'Scale',
} as const;

// ============================================================================
// TYPES
// ============================================================================
export type PlanType = keyof typeof PLAN_LIMITS;
export type PlanFeature = keyof typeof PLAN_LIMITS.free;

// ============================================================================
// PLAN HIERARCHY
// ============================================================================
export const PLAN_HIERARCHY: PlanType[] = ['free', 'pro', 'scale'];

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
  return Infinity; // All tiers are usage-based — no client cap
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
  return false; // No client limits in new pricing
}

export function hasWhiteLabel(plan: PlanType): boolean {
  return plan === 'pro' || plan === 'scale';
}

export function isPlanHigherOrEqual(currentPlan: PlanType, requiredPlan: PlanType): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan);
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlan);
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
// LEGACY PLAN MAPPING (old names → new names)
// ============================================================================
export const LEGACY_PLAN_MAP: Record<string, PlanType> = {
  starter: 'free',
  professional: 'pro',
  enterprise: 'scale',
};

export function normalizePlanType(plan: string | undefined | null): PlanType {
  if (!plan) return 'free';
  const lower = plan.toLowerCase();
  if (LEGACY_PLAN_MAP[lower]) return LEGACY_PLAN_MAP[lower];
  if (PLAN_HIERARCHY.includes(lower as PlanType)) return lower as PlanType;
  return 'free';
}