// lib/plan-features-meta.ts
// ============================================================================
// CLIENT-tier plan metadata and helpers.
//
// Sibling module to lib/plan-features.ts.
//
//   lib/plan-features.ts       → AGENCY tier (Free / Pro / Scale platform fee)
//                                 Static. Three fixed tiers Anthropic-style.
//                                 Uses DOLLARS in `price`.
//
//   lib/plan-features-meta.ts  → CLIENT tier (what an agency sells to its
//                                 local businesses). Dynamic per-agency:
//                                 price, limit, feature toggles, plan name,
//                                 plan description all come from the agency
//                                 row. Uses CENTS in `price` because that's
//                                 what the DB stores.
//
// This module is the SINGLE SOURCE OF TRUTH for:
//   - Which 13 client features exist (FEATURE_LABELS keys)
//   - What they're called and described to the user (label / description)
//   - The display order across signup widget, /upgrade-required, and the
//     Agency Settings > Pricing tab
//   - The universal core features every plan gets regardless of toggles
//   - The shape of a rendered plan tile (buildClientPlans return type)
//
// Before this module existed, FEATURE_LABELS was redefined in 3+ places and
// drifted. The Plan tiles even invented an `sms_notifications` key that
// didn't exist anywhere in the Settings UI. Importing from here eliminates
// the drift surface.
// ============================================================================

export type ClientPlanId = 'starter' | 'pro' | 'growth';
export const CLIENT_PLAN_IDS: ClientPlanId[] = ['starter', 'pro', 'growth'];

// ============================================================================
// FEATURE_LABELS
// The full set of per-plan feature toggles surfaced in the Settings UI.
// Each toggle is a boolean in agency.plan_features[planId][featureKey].
//
// When adding a new feature key: add it here AND to FEATURE_ORDER below.
// The Settings UI iterates FEATURE_ORDER to render its toggle grid, so this
// is enough to wire a new feature end-to-end.
// ============================================================================

export interface FeatureLabel {
  label: string;
  description: string;
}

export const FEATURE_LABELS: Record<string, FeatureLabel> = {
  google_calendar: {
    label: 'Google Calendar Booking',
    description: 'AI books appointments directly into your calendar during the call',
  },
  knowledge_base: {
    label: 'Knowledge Base',
    description: 'Train the AI on your website, FAQs, and documents',
  },
  custom_voice: {
    label: 'Custom Voice',
    description: 'Choose from 30+ premium AI voices to match your brand',
  },
  custom_greeting: {
    label: 'Custom Greeting',
    description: 'Personalize exactly how the AI answers each call',
  },
  business_hours: {
    label: 'Business Hours Routing',
    description: 'Different behavior in and out of business hours',
  },
  after_hours_mode: {
    label: 'After-Hours Mode',
    description: 'Custom AI behavior for evenings and weekends',
  },
  call_transfer: {
    label: 'Live Call Transfer',
    description: 'AI forwards calls to your team when needed',
  },
  transfer_fallback: {
    label: 'Transfer Fallback',
    description: 'Capture a voicemail if the transfer goes unanswered',
  },
  caller_recognition: {
    label: 'Caller Recognition',
    description: 'AI remembers returning callers and personalizes greetings',
  },
  spam_detection: {
    label: 'Spam & Robocall Detection',
    description: 'AI filters out junk calls automatically',
  },
  email_summaries: {
    label: 'Email Call Summaries',
    description: 'AI-generated summaries emailed to you after each call',
  },
  advanced_analytics: {
    label: 'Advanced Analytics',
    description: 'Call intent breakdowns, peak times, conversion tracking',
  },
  priority_support: {
    label: 'Priority Support',
    description: 'Direct line for setup help and troubleshooting',
  },
};

// ============================================================================
// FEATURE_ORDER
// Display order across all surfaces. Most user-facing / value-driving first.
// ============================================================================

export const FEATURE_ORDER: string[] = [
  'google_calendar',
  'knowledge_base',
  'custom_voice',
  'custom_greeting',
  'business_hours',
  'after_hours_mode',
  'call_transfer',
  'transfer_fallback',
  'caller_recognition',
  'spam_detection',
  'email_summaries',
  'advanced_analytics',
  'priority_support',
];

// ============================================================================
// CORE_CLIENT_FEATURES
// Universal bullets that every client plan gets. These aren't toggleable —
// they're always on. Rendered above the per-plan feature list.
// ============================================================================

export const CORE_CLIENT_FEATURES: string[] = [
  'AI receptionist available 24/7',
  'Dedicated business phone number',
  'Call recordings & transcripts',
  'AI-powered call summaries',
  'Call history dashboard',
];

// ============================================================================
// Default plan presentation when the agency row is missing values.
// Kept in cents to match the DB convention.
// ============================================================================

const DEFAULT_PLAN_NAMES: Record<ClientPlanId, string> = {
  starter: 'Starter',
  pro: 'Professional',
  growth: 'Growth',
};

const DEFAULT_PLAN_PRICES: Record<ClientPlanId, number> = {
  starter: 4900,
  pro: 9900,
  growth: 14900,
};

const DEFAULT_PLAN_LIMITS: Record<ClientPlanId, number> = {
  starter: 50,
  pro: 150,
  growth: 500,
};

// ============================================================================
// ClientPlanTile — the rendered shape every consumer uses.
//
// NOTE: `price` is in CENTS (DB convention). lib/plan-features.ts uses
// dollars for AGENCY tiers — different convention, intentional. Format at
// render time with Intl.NumberFormat.
// ============================================================================

export interface ClientPlanTile {
  id: ClientPlanId;
  /** Display name. Falls back to "Starter" / "Professional" / "Growth". */
  name: string;
  /** Optional one-line tagline shown under the name. null if unset. */
  description: string | null;
  /** Monthly price in CENTS. */
  price: number;
  /** -1 = unlimited. */
  callLimit: number;
  /** Whether to render the "Most Popular" badge. Pro by default. */
  popular: boolean;
  /** Bullets to render with a check mark. */
  included: string[];
  /** Bullets to render crossed out / muted. */
  excluded: string[];
  /** Team-member seat count for this tier, if > 0. */
  teamMembers: number;
}

// ============================================================================
// buildClientPlans
// Turn an agency row into three rendered plan tiles.
//
// Reads (all optional, all with safe fallbacks):
//   - price_starter / price_pro / price_growth         (number, cents)
//   - limit_starter / limit_pro / limit_growth         (number; -1 unlimited)
//   - plan_starter_name / plan_pro_name / plan_growth_name       (string)
//   - plan_starter_description / plan_pro_description / plan_growth_description (string)
//   - plan_features                                    (JSONB; see below)
//
// plan_features shape (per the Settings UI):
//   {
//     starter: { google_calendar: false, knowledge_base: true, ..., team_members: 0 },
//     pro:     { google_calendar: true,  knowledge_base: true, ..., team_members: 2 },
//     growth:  { google_calendar: true,  knowledge_base: true, ..., team_members: 5 },
//   }
// ============================================================================

export function buildClientPlans(agency: Record<string, any> | null | undefined): ClientPlanTile[] {
  const safeAgency: Record<string, any> = agency || {};
  const planFeatures: Record<string, any> = safeAgency.plan_features || {};

  return CLIENT_PLAN_IDS.map((id): ClientPlanTile => {
    // Resolve all the per-tier values
    const rawPrice = safeAgency[`price_${id}`];
    const price = (typeof rawPrice === 'number' && !isNaN(rawPrice)) ? rawPrice : DEFAULT_PLAN_PRICES[id];

    const rawLimit = safeAgency[`limit_${id}`];
    const callLimit = (typeof rawLimit === 'number' && !isNaN(rawLimit)) ? rawLimit : DEFAULT_PLAN_LIMITS[id];

    const name = (safeAgency[`plan_${id}_name`] || '').toString().trim() || DEFAULT_PLAN_NAMES[id];

    const rawDesc = (safeAgency[`plan_${id}_description`] || '').toString().trim();
    const description = rawDesc.length > 0 ? rawDesc : null;

    const featuresForTier: Record<string, any> = (planFeatures[id] && typeof planFeatures[id] === 'object') ? planFeatures[id] : {};

    // Build the included / excluded bullet lists
    const included: string[] = [...CORE_CLIENT_FEATURES];
    included.push(callLimit === -1 ? 'Unlimited calls per month' : `Up to ${callLimit.toLocaleString()} calls per month`);

    const excluded: string[] = [];

    for (const key of FEATURE_ORDER) {
      const meta = FEATURE_LABELS[key];
      if (!meta) continue;
      if (featuresForTier[key] === true) {
        included.push(meta.label);
      } else {
        excluded.push(meta.label);
      }
    }

    // team_members is a number, not a boolean — render specially.
    const teamMembersRaw = featuresForTier.team_members;
    const teamMembers = (typeof teamMembersRaw === 'number' && teamMembersRaw > 0) ? teamMembersRaw : 0;
    if (teamMembers > 0) {
      included.push(`Up to ${teamMembers} team member${teamMembers === 1 ? '' : 's'}`);
    }

    return {
      id,
      name,
      description,
      price,
      callLimit,
      popular: id === 'pro', // Pro is "Most Popular" by default. Future: agency override column.
      included,
      excluded,
      teamMembers,
    };
  });
}

// ============================================================================
// Helper: format a callLimit value for display anywhere outside buildClientPlans.
// ============================================================================
export function formatCallLimit(limit: number | null | undefined): string {
  if (limit === undefined || limit === null || isNaN(limit) || limit === -1) return 'Unlimited';
  return limit.toLocaleString();
}