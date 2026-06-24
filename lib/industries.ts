// ============================================================================
// lib/industries.ts
// ----------------------------------------------------------------------------
// Single source of truth for industries across the whole app. Every dropdown,
// label, icon, and "What Your AI Knows" intelligence card reads from here.
//
// To add an industry: add ONE entry to the INDUSTRIES array below (value,
// label, icon, description, intelligence, optional aliases). Nothing else in
// the frontend needs to change. The `value` must match a key the backend
// INDUSTRY_MAPPING accepts so call provisioning resolves it.
//
// Legacy and drifted values (e.g. beauty_wellness, financial_services,
// restaurant vs restaurants, the old long GoHighLevel label strings) are
// folded to the canonical value via each entry's `aliases`, so previously
// stored client rows keep displaying correctly with no database migration.
// ============================================================================

import type { ElementType } from 'react';
import {
  Wrench, Droplets, Truck, Stethoscope, Smile, Scale, Home, Building2,
  Calculator, Briefcase, UtensilsCrossed, Sparkles, Dumbbell, ShoppingBag,
  Car, Package, HardHat, Hammer, Trash2,
} from 'lucide-react';

// String name -> lucide component. Backend endpoints return icon names as
// strings (e.g. the AI Lab packaged-receptionist grid), so icons are always
// referenced by name and resolved through this one map.
export const INDUSTRY_ICON_MAP: Record<string, ElementType> = {
  Wrench, Droplets, Truck, Stethoscope, Smile, Scale, Home, Building2,
  Calculator, Briefcase, UtensilsCrossed, Sparkles, Dumbbell, ShoppingBag,
  Car, Package, HardHat, Hammer, Trash2,
};

export interface IndustryIntelligence {
  services: number;
  faqs: number;
  terms: number;
  features: string[];
}

export interface Industry {
  // Canonical value, sent to the backend and stored on the client row.
  value: string;
  // Display label for dropdowns and headings.
  label: string;
  // Key into INDUSTRY_ICON_MAP.
  icon: string;
  // Short descriptor used on cards.
  description: string;
  // Metadata for the "What Your AI Knows" card.
  intelligence: IndustryIntelligence;
  // Legacy or drifted stored values that fold to this canonical value.
  aliases?: string[];
  // Whether this appears in the signup / add-client / detail dropdowns.
  // Defaults to true when omitted.
  selectable?: boolean;
}

export const INDUSTRIES: Industry[] = [
  {
    value: 'home_services',
    label: 'Home Services',
    icon: 'Wrench',
    description: 'HVAC, plumbing, electrical, roofing',
    intelligence: { services: 47, faqs: 10, terms: 9, features: ['Emergency Triage', 'Seasonal Awareness', 'Urgency Detection'] },
    aliases: ['Home Services (plumbing, HVAC, contractors)', 'homeservices', 'home services'],
  },
  {
    value: 'waterproofing',
    label: 'Waterproofing & Foundation Repair',
    icon: 'Droplets',
    description: 'Waterproofing, foundation repair, mold',
    intelligence: { services: 30, faqs: 10, terms: 11, features: ['Active-Water Triage', 'Free Inspection Booking', 'Foundation & Moisture Terms'] },
    aliases: ['waterproofing_foundation', 'foundation_repair', 'mold_remediation', 'mold'],
  },
  {
    value: 'junk_removal',
    label: 'Junk Removal & Dumpster Rental',
    icon: 'Truck',
    description: 'Junk hauling and dumpster rental',
    intelligence: { services: 25, faqs: 10, terms: 7, features: ['Volume Estimating', 'Dumpster Sizing', 'Prohibited-Item Screening'] },
    aliases: ['junk_removal_dumpster', 'dumpster_rental', 'junk'],
  },
  {
    value: 'medical',
    label: 'Medical',
    icon: 'Stethoscope',
    description: 'Clinics, practices, specialists',
    intelligence: { services: 38, faqs: 11, terms: 8, features: ['HIPAA Compliant', 'Emergency Triage', 'Insurance Terminology'] },
    aliases: ['medical_dental', 'Medical/Dental'],
  },
  {
    value: 'dental',
    label: 'Dental & Orthodontics',
    icon: 'Smile',
    description: 'Dental and orthodontic offices',
    intelligence: { services: 30, faqs: 10, terms: 8, features: ['HIPAA Compliant', 'Appointment Booking', 'Insurance Terminology'] },
    aliases: ['dentist', 'orthodontics'],
  },
  {
    value: 'legal',
    label: 'Legal',
    icon: 'Scale',
    description: 'Law firms, attorneys, paralegals',
    intelligence: { services: 35, faqs: 8, terms: 10, features: ['Privilege Compliant', 'No Legal Advice', 'Intake Flow'] },
    aliases: ['legal_services'],
  },
  {
    value: 'real_estate',
    label: 'Real Estate',
    icon: 'Home',
    description: 'Agents, brokers, property management',
    intelligence: { services: 24, faqs: 10, terms: 12, features: ['Buyer/Seller Routing', 'Seasonal Market', 'Mortgage Referrals'] },
    aliases: ['realestate'],
  },
  {
    value: 'financial',
    label: 'Financial Services',
    icon: 'Calculator',
    description: 'Accounting, tax, financial advisors',
    intelligence: { services: 30, faqs: 10, terms: 10, features: ['Compliance Safe', 'Tax Season Aware', 'No Financial Advice'] },
    aliases: ['financial_services'],
  },
  {
    value: 'restaurants',
    label: 'Restaurant & Food Service',
    icon: 'UtensilsCrossed',
    description: 'Restaurants, catering, food service',
    intelligence: { services: 12, faqs: 12, terms: 7, features: ['Allergen Awareness', 'Reservation Logic', 'Peak Hour Handling'] },
    aliases: ['restaurant', 'Restaurants/Food Service', 'restaurants_food'],
  },
  {
    value: 'salon_spa',
    label: 'Salon & Spa',
    icon: 'Sparkles',
    description: 'Salons, barbershops, day spas',
    intelligence: { services: 42, faqs: 11, terms: 6, features: ['Duration Estimates', 'Upsell Suggestions', 'Cancellation Policy'] },
    aliases: ['beauty_wellness', 'salon', 'spa', 'Salon/Spa (hair, nails, skincare)'],
  },
  {
    value: 'automotive',
    label: 'Automotive',
    icon: 'Car',
    description: 'Auto repair, dealerships, detailing',
    intelligence: { services: 40, faqs: 12, terms: 10, features: ['Safety Priority', 'Maintenance Schedules', 'OEM/Aftermarket'] },
    aliases: ['auto'],
  },
  {
    value: 'fitness',
    label: 'Fitness & Recreation',
    icon: 'Dumbbell',
    description: 'Gyms, studios, personal training',
    intelligence: { services: 28, faqs: 12, terms: 9, features: ['Trial Offers', 'Class Schedules', 'Membership Freeze'] },
    aliases: ['gym'],
  },
  {
    value: 'retail',
    label: 'Retail',
    icon: 'ShoppingBag',
    description: 'Shops, boutiques, e-commerce',
    intelligence: { services: 10, faqs: 11, terms: 5, features: ['Inventory Checks', 'Return Policy', 'Order Status Handling'] },
    aliases: ['Retail/E-commerce', 'ecommerce', 'e-commerce'],
  },
  {
    value: 'professional_services',
    label: 'Professional Services',
    icon: 'Briefcase',
    description: 'Consulting and other professional services',
    intelligence: { services: 32, faqs: 8, terms: 7, features: ['Engagement Flow', 'NDA Awareness', 'Retainer Handling'] },
    aliases: ['Professional Services (legal, accounting)', 'professional'],
  },
  {
    value: 'general',
    label: 'General Business',
    icon: 'Building2',
    description: 'Any business type',
    intelligence: { services: 12, faqs: 8, terms: 5, features: ['Smart Call Routing', 'Message Taking', 'Business Hours'] },
  },
  {
    value: 'other',
    label: 'Other',
    icon: 'Building2',
    description: 'Something else',
    intelligence: { services: 12, faqs: 8, terms: 5, features: ['Smart Call Routing', 'Message Taking', 'Business Hours'] },
  },
];

// ── Derived lookups (built once) ────────────────────────────────────────────

const INDUSTRY_BY_VALUE: Record<string, Industry> = (() => {
  const m: Record<string, Industry> = {};
  for (const ind of INDUSTRIES) m[ind.value] = ind;
  return m;
})();

// Lowercased alias -> canonical value. Includes each canonical value itself.
const ALIAS_LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const ind of INDUSTRIES) {
    m[ind.value.toLowerCase()] = ind.value;
    for (const a of ind.aliases ?? []) m[a.toLowerCase()] = ind.value;
  }
  return m;
})();

// Industries offered in the signup / add-client / detail dropdowns, in order.
export const SELECTABLE_INDUSTRIES: Industry[] = INDUSTRIES.filter(i => i.selectable !== false);

// Fold any stored or incoming industry value to its canonical value. Unknown
// or empty values resolve to 'general' so callers always get a real entry.
export function normalizeIndustry(raw?: string | null): string {
  if (!raw) return 'general';
  const key = String(raw).toLowerCase().trim();
  return ALIAS_LOOKUP[key] ?? 'general';
}

// Resolve a stored value to its full Industry entry (after alias folding).
export function getIndustry(raw?: string | null): Industry {
  return INDUSTRY_BY_VALUE[normalizeIndustry(raw)];
}

export function getIndustryLabel(raw?: string | null): string {
  return getIndustry(raw).label;
}

export function getIndustryIcon(raw?: string | null): ElementType {
  return INDUSTRY_ICON_MAP[getIndustry(raw).icon] ?? Building2;
}