// lib/plan-features.ts
// Canonical agency-tier plan data — Free / Pro / Scale.
// SINGLE SOURCE OF TRUTH for what these tiers display on the public homepage,
// the agency signup plan picker, the onboarding step 2 cards, and the
// trial-expired plan picker inside the agency dashboard layout. Before this
// existed, each surface defined its own feature array and they drifted —
// notably /signup/plan was still showing Pro at $179.
//
// IMPORTANT: This file is ONLY for the agency tier (the platform fee an
// agency pays to use VoiceAI Connect). The CLIENT tier — local businesses
// signing up with an agency for AI receptionist service — uses dynamic
// per-agency pricing from agency.price_starter / price_pro / price_growth
// and the agency's own plan_features map in the DB. That system stays as is.
//
// Created 2026-06-04 alongside the pricing drift cleanup pass.

import { Zap, Shield, Crown, type LucideIcon } from 'lucide-react';
import { PLAN_PRICES, PLAN_RATES } from './plan-limits';

export type AgencyPlanId = 'free' | 'pro' | 'scale';

export interface AgencyPlanTier {
  id: AgencyPlanId;
  name: string;
  /** Monthly platform fee in DOLLARS (not cents). 0 for Free. */
  price: number;
  icon: LucideIcon;
  /** Short tagline shown above the plan name. */
  description: string;
  /** Per-client / per-minute rate line, e.g. "$9.99/client/mo + $0.10/min".
   * Some surfaces elevate this under the price; others want it inline in
   * the features list — render however each surface prefers. */
  rate: string;
  /** Trial copy, e.g. "14-day free trial — card required". null for Free. */
  trial: string | null;
  /** Whether to render a "Most Popular" / "Recommended" badge. */
  popular: boolean;
  /** Included feature bullets. Does NOT include the rate line — use `rate`. */
  features: string[];
  /** Excluded feature bullets. Render as crossed out / muted. */
  limitations: string[];
}

export const AGENCY_PLAN_TIERS: Record<AgencyPlanId, AgencyPlanTier> = {
  free: {
    id: 'free',
    name: 'Free',
    price: PLAN_PRICES.free, // 0
    icon: Zap,
    description: 'Start selling — zero commitment',
    rate: `$${PLAN_RATES.free.perClient}/client/mo + $${PLAN_RATES.free.perMinute}/min`,
    trial: null,
    popular: false,
    features: [
      'AI receptionist for every client',
      'Google Calendar appointment booking',
      'Call notifications + spam detection',
      'Caller recognition + after-hours mode',
      '7-day free trial for your clients',
      'Stripe Connect billing',
    ],
    limitations: [
      'No white-label branding',
      'No marketing site',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: PLAN_PRICES.pro, // 99
    icon: Shield,
    description: 'A complete white-label business',
    rate: `$${PLAN_RATES.pro.perClient}/client/mo + $${PLAN_RATES.pro.perMinute}/min`,
    trial: '14-day free trial — card required',
    popular: true,
    features: [
      'Full white-label branding',
      'Custom domain',
      'Marketing website + AI demo line',
      'Google Calendar integration',
      'Lead generation CRM',
      'Up to 5 team members',
      '7-day free trial for your clients',
    ],
    limitations: [],
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: PLAN_PRICES.scale, // 499
    icon: Crown,
    description: 'All-in for high-volume agencies',
    rate: `$0/client + $${PLAN_RATES.scale.perMinute}/min only`,
    trial: '14-day free trial — card required',
    popular: false,
    features: [
      'Everything in Pro',
      'AI Lab + industry templates',
      'Unlimited team members',
      'International numbers',
      '7-day free trial for your clients',
      'Priority support',
    ],
    limitations: [],
  },
};

/** Ordered list — Free first, Pro middle, Scale last. Use for .map() in price grids. */
export const AGENCY_PLAN_TIER_LIST: AgencyPlanTier[] = [
  AGENCY_PLAN_TIERS.free,
  AGENCY_PLAN_TIERS.pro,
  AGENCY_PLAN_TIERS.scale,
];

/** Helper: tier by id with safe fallback to Free. */
export function getAgencyPlanTier(id: string | null | undefined): AgencyPlanTier {
  if (id && id in AGENCY_PLAN_TIERS) return AGENCY_PLAN_TIERS[id as AgencyPlanId];
  return AGENCY_PLAN_TIERS.free;
}