// ============================================================================
// BUYER TYPES (platform / admin outreach)
// The audience persona a platform outreach template targets. Stored on
// outreach_templates.buyer_type for rows where agency_id IS NULL. Lets the admin
// template library be grouped and filtered by who the message is written for
// (an existing marketing agency reads very differently from a first-time
// entrepreneur). Agency-level templates reuse the same column but store a
// canonical industry value instead (see lib/industries.ts) — the meaning is
// contextual to whether the template is platform- or agency-owned.
//
// To add/rename a persona, edit this list. Values are stable keys (stored in the
// DB); labels are display-only and safe to change.
// ============================================================================

export interface BuyerType {
  value: string;
  label: string;
  description?: string;
}

export const BUYER_TYPES: BuyerType[] = [
  { value: 'marketing_agency', label: 'Existing marketing agency', description: 'Already runs an agency, adding AI receptionists as a service' },
  { value: 'new_entrepreneur', label: 'New entrepreneur', description: 'First real business, drawn in by recurring revenue' },
  { value: 'agency_owner', label: 'Scaling agency owner', description: 'Has clients, wants to grow MRR and retention' },
  { value: 'call_center', label: 'Call center / answering service', description: 'Existing phone operation modernizing with AI' },
  { value: 'freelancer', label: 'Freelancer / consultant', description: 'Solo operator productizing a service' },
  { value: 'reseller', label: 'Reseller / affiliate', description: 'Wants to resell or refer rather than operate' },
];

// Value used in the UI to mean "no specific persona / shows for everyone".
// Stored as NULL in the database.
export const BUYER_TYPE_ANY = '';

const BUYER_TYPE_BY_VALUE: Record<string, BuyerType> = (() => {
  const m: Record<string, BuyerType> = {};
  for (const b of BUYER_TYPES) m[b.value] = b;
  return m;
})();

// Display label for a stored buyer_type. Empty / unknown => "All buyers".
export function getBuyerTypeLabel(raw?: string | null): string {
  if (!raw) return 'All buyers';
  return BUYER_TYPE_BY_VALUE[raw]?.label ?? raw;
}

export function isKnownBuyerType(raw?: string | null): boolean {
  return !!raw && !!BUYER_TYPE_BY_VALUE[raw];
}
