// ============================================================================
// lib/page-templates.ts
// ----------------------------------------------------------------------------
// Starting templates for agency-created custom pages. "Create New Page" seeds a
// whole page with Lorem Ipsum placeholder copy across every section, so the
// agency gets a real, laid-out page from the first second and then overwrites
// the Latin with their own text in the in-context editor.
//
// Two seeds are offered:
//   - 'industry': the SEO vertical layout (hero + pain points + sample call +
//     industry FAQs), the same shape as the built-in lib/industry-pages pages.
//   - 'generic':  a general landing page (hero + value points + sample call +
//     FAQs) for anything else, a campaign, an "about", a service page.
//
// Both render through the same overlay path as the built-in industry pages, so
// the seed only differs in the placeholder copy, not the layout.
//
// Pure data (no React/node imports) so it is safe to import anywhere.
// ============================================================================
import type { CustomPage } from '@/types/marketing';
import { INDUSTRY_PAGE_SLUGS } from '@/lib/industry-pages';

// First path segments that already belong to real routes on an agency host, so a
// custom page may never claim them. Middleware uses this to decide which single-
// segment slugs to route to the page resolver, and the create flow uses it (via
// isReservedSlug) to reject a colliding slug before saving.
export const RESERVED_FIRST_SEGMENTS: Set<string> = new Set([
  // Infrastructure / assets.
  'api', 'assets', 'static', 'images', 'fonts', 'icon', 'og', 'embed', 'preview',
  'favicon', 'robots', 'sitemap', '_next', 'feed',
  // App surfaces + auth + client.
  'signup', 'auth', 'client', 'webcall', 'admin', 'dashboard', 'login', 'logout',
  'onboarding', 'agency', 'agency-site', 'agency-opportunity', 'cc', 'setup',
  // Every top-level marketing/SEO route, so a custom page can never shadow one.
  'blog', 'demo', 'faq', 'terms', 'privacy', 'billing-policy', 'calculator',
  'developers', 'features', 'how-it-works', 'interactive-demo', 'live', 'platform',
  'referral-program', 'sample-site', 'site-unavailable', 'support',
  'agency-revenue-calculator', 'ai-receptionist-agency-income',
  'ai-receptionist-agency-pricing', 'ai-receptionist-answering-service-reseller',
  'best-white-label-ai-receptionist-platforms', 'gohighlevel-ai-receptionist',
  'how-much-can-you-make-ai-receptionist-reseller', 'how-to-start-ai-receptionist-agency',
  'voiceai-connect-vs-bland-ai', 'voiceai-connect-vs-synthflow',
  'what-is-white-label-ai-receptionist', 'white-label-ai-receptionist-marketing-agencies',
  'white-label-vs-build-your-own',
]);

// A slug that cannot be used for a custom page: empty, dotted (a file), a
// reserved route, or one of the built-in industry verticals.
export function isReservedSlug(slug: string): boolean {
  if (!slug) return true;
  if (slug.includes('.')) return true;
  if (RESERVED_FIRST_SEGMENTS.has(slug)) return true;
  if (INDUSTRY_PAGE_SLUGS.includes(slug)) return true;
  return false;
}

// A small pool of Lorem Ipsum so each seeded field reads as placeholder copy the
// agency is meant to replace, not as real content that could ship by accident.
const LOREM_SHORT = 'Lorem ipsum dolor sit amet';
const LOREM_SENTENCE =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const LOREM_PARAGRAPH =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.';

// Chooser metadata for the "Create New Page" UI.
export const PAGE_TEMPLATES: { id: CustomPage['template']; name: string; description: string }[] = [
  {
    id: 'industry',
    name: 'Industry Landing Page',
    description: 'The proven SEO layout: hero, pain points, a sample call, and industry FAQs. Best for a specific vertical you serve.',
  },
  {
    id: 'generic',
    name: 'Generic Landing Page',
    description: 'A general page: hero, value points, a sample call, and FAQs. Use it for a campaign, an about page, or any other page.',
  },
];

// Build a full Lorem-filled page for the chosen template. The agency picks the
// slug and a human label; everything else starts as placeholder copy.
export function createCustomPage(template: CustomPage['template'], slug: string, label: string): CustomPage {
  const headline =
    template === 'industry'
      ? ['The AI Receptionist', `for ${label || 'Your Industry'}`]
      : [label || 'Your New Page', 'Lorem Ipsum Dolor'];

  const subheadline =
    template === 'industry'
      ? `Lorem ipsum receptionist for ${label || 'your industry'}. ${LOREM_SENTENCE}`
      : LOREM_SENTENCE;

  const problems =
    template === 'industry'
      ? [
          { title: 'Lorem Ipsum Problem One', description: LOREM_PARAGRAPH },
          { title: 'Consectetur Adipiscing Two', description: LOREM_PARAGRAPH },
          { title: 'Tempor Incididunt Three', description: LOREM_PARAGRAPH },
        ]
      : [
          { title: 'Lorem Ipsum Value One', description: LOREM_PARAGRAPH },
          { title: 'Dolor Sit Value Two', description: LOREM_PARAGRAPH },
          { title: 'Amet Consectetur Value Three', description: LOREM_PARAGRAPH },
        ];

  const sampleCall = {
    customerName: 'Lorem Ipsum',
    service: LOREM_SHORT,
    summary: LOREM_SENTENCE,
  };

  const faqs = [
    { question: 'Lorem ipsum dolor sit amet?', answer: `<p>${LOREM_PARAGRAPH}</p>` },
    { question: 'Consectetur adipiscing elit sed?', answer: `<p>${LOREM_PARAGRAPH}</p>` },
    { question: 'Ut enim ad minim veniam quis?', answer: `<p>${LOREM_PARAGRAPH}</p>` },
    { question: 'Duis aute irure dolor in?', answer: `<p>${LOREM_PARAGRAPH}</p>` },
  ];

  return {
    slug,
    label: label || slug,
    template,
    status: 'draft',
    headline,
    subheadline,
    problems,
    sampleCall,
    faqs,
  };
}

// Normalize a user-entered slug: lowercase, spaces/underscores to hyphens, strip
// anything that is not a-z 0-9 or hyphen, collapse repeats, trim hyphens.
export function normalizePageSlug(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
