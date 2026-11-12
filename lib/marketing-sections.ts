// lib/marketing-sections.ts
// -----------------------------------------------------------------------------
// Shared section-ordering model for the marketing templates and the in-context
// editor. Each template renders its body sections (everything between the nav/
// hero and the footer) in the order given by config.sectionOrder, falling back
// to that template's built-in default when nothing is saved - so existing sites
// never change until someone actually reorders.
//
// Keys are canonical across templates; a template only renders the keys it
// actually has. `valueCards` is Editorial-only (its benefit cards sit apart
// from the Features block) and shares the Features on/off flag.
// -----------------------------------------------------------------------------

export type SectionKey =
  | 'proofStrip'
  | 'problemSolution'
  | 'howItWorks'
  | 'features'
  | 'commandCenter'
  | 'valueCards'
  | 'industries'
  | 'comparison'
  | 'testimonials'
  | 'roiCalculator'
  | 'aiWebCall'
  | 'pricing'
  | 'faq'
  | 'finalCta';

// Each template's default body order - the exact order these sections render in
// today. Changing config.sectionOrder reorders against this baseline.
export const SECTION_ORDER: Record<string, SectionKey[]> = {
  classic: ['problemSolution', 'howItWorks', 'commandCenter', 'features', 'industries', 'comparison', 'roiCalculator', 'aiWebCall', 'pricing', 'faq', 'finalCta'],
  beside: ['proofStrip', 'problemSolution', 'howItWorks', 'features', 'commandCenter', 'industries', 'comparison', 'roiCalculator', 'aiWebCall', 'pricing', 'faq', 'finalCta'],
  editorial: ['features', 'howItWorks', 'valueCards', 'industries', 'testimonials', 'aiWebCall', 'pricing', 'faq', 'finalCta'],
};

// Short labels for the editor's reorder/toggle list.
export const SECTION_LABELS: Record<SectionKey, string> = {
  proofStrip: 'Stats bar',
  problemSolution: 'Problem & solution',
  howItWorks: 'How it works',
  features: 'Features',
  commandCenter: 'Command center',
  valueCards: 'Value cards',
  industries: 'Industries',
  comparison: 'Comparison table',
  testimonials: 'Testimonial',
  roiCalculator: 'ROI calculator',
  aiWebCall: 'AI web call',
  pricing: 'Pricing',
  faq: 'FAQ',
  finalCta: 'Final call to action',
};

/**
 * Resolve the order a template should render in. Starts from the saved order
 * (keeping only keys this template actually has, de-duplicated), then appends
 * any default keys the saved order is missing - so a section added after the
 * agency last reordered still shows up, in its default slot relative to the
 * tail. Unset/empty saved order returns the template default unchanged.
 */
export function resolveSectionOrder(saved: unknown, template: string): SectionKey[] {
  const def = SECTION_ORDER[template] || SECTION_ORDER.classic;
  if (!Array.isArray(saved) || saved.length === 0) return def;
  const inDef = new Set<string>(def);
  const seen = new Set<string>();
  const out: SectionKey[] = [];
  for (const k of saved) {
    if (typeof k === 'string' && inDef.has(k) && !seen.has(k)) { out.push(k as SectionKey); seen.add(k); }
  }
  for (const k of def) { if (!seen.has(k)) out.push(k); }
  return out;
}
