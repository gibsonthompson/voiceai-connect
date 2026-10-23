// app/sitemap.js
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// HOST-AWARE SITEMAP
// /sitemap.xml is served by this one route for every host (middleware skips
// paths with a dot, so it is NOT rewritten to /agency-site on agency hosts).
// We branch on the requesting host: the platform domain gets the full VoiceAI
// marketing + blog sitemap; an agency subdomain or custom marketing domain gets
// a sitemap of ITS OWN pages, based on the host it was requested from, so each
// agency can submit https://<their-domain>/sitemap.xml to Search Console and
// get their real pages indexed (not the platform's).
// ============================================================================
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
const PLATFORM_HOSTS = new Set([
  PLATFORM_DOMAIN,
  `www.${PLATFORM_DOMAIN}`,
  'localhost:3000',
  'localhost',
]);

// ============================================================================
// REDIRECTED BLOG SLUGS (SEO consolidation, Oct 2026)
// These /blog/<slug> URLs are now 301'd to a stronger owner page in
// next.config.ts to kill keyword cannibalization on the commercial head
// terms. A sitemap must never advertise a URL that redirects, so we filter
// them out of BOTH the hardcoded blog list and the auto-generated blog feed.
// Keep this set in exact sync with the SEO CONSOLIDATION block in
// next.config.ts: one entry here per 301 source whose path starts /blog/.
// ============================================================================
const REDIRECTED_BLOG_SLUGS = new Set([
  'white-label-ai-receptionist-platform',
  'white-label-ai-voice-agent-platform-agencies',
  'best-white-label-ai-receptionist-platforms-ranked',
  'how-to-choose-white-label-ai-receptionist-platform',
  'white-label-vs-build-ai-receptionist',
  'what-is-ai-receptionist-how-it-works',
  'how-to-start-ai-receptionist-agency',
  'start-ai-receptionist-agency-from-india',
  'voiceai-connect-vs-synthflow',
  'ai-receptionist-agency-pricing-tiers',
  'ai-agency-profit-margins-2026',
]);

function isPlatformHost(host) {
  if (!host) return true; // no host (e.g. build-time) -> platform sitemap
  return PLATFORM_HOSTS.has(host);
}

// ============================================================================
// AGENCY SITEMAP - the public marketing pages an agency host actually serves.
// These are the routes middleware rewrites to /agency-site plus the signup
// wizard that resolves agency context from the host. Uses the requested host
// as the base so it is correct for both subdomains and custom domains, and for
// www vs apex (whatever host Google fetched the sitemap from).
// ============================================================================
function agencySitemap(host) {
  const base = `https://${host}`;
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/demo`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}

// ============================================================================
// PLATFORM SITEMAP - the full VoiceAI Connect marketing + blog sitemap.
// ============================================================================
async function platformSitemap() {
  const baseUrl = 'https://www.myvoiceaiconnect.com';

  // Fetch auto-generated blog posts from Supabase
  let generatedEntries = [];
  const hardcodedBlogSlugs = new Set();

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: biz } = await supabase.from('blog_businesses').select('id').eq('slug', 'voiceai-connect').single();
      if (biz) {
        const { data: posts } = await supabase.from('blog_generated_posts')
          .select('slug, publish_date').eq('business_id', biz.id).eq('status', 'published');
        generatedEntries = (posts || []).map(p => ({
          url: `${baseUrl}/blog/${p.slug}`,
          lastModified: p.publish_date ? new Date(p.publish_date) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        }));
      }
    }
  } catch (e) { /* non-critical, return hardcoded entries only */ }

  const blogSlugs = [
    'white-label-ai-receptionist-pricing-breakdown', 'best-white-label-ai-receptionist-platforms-ranked', 'how-to-resell-ai-receptionist-services',
    'white-label-ai-receptionist-lead-gen-agencies', 'set-up-white-label-ai-receptionist-business-24-hours', 'white-label-ai-receptionist-compliance-guide',
    'how-to-choose-white-label-ai-receptionist-platform', 'white-label-ai-voice-agent-platform-agencies', 'voiceai-connect-vs-autocalls',
    'voiceai-connect-vs-echowin', 'voiceai-connect-vs-voxtell', 'voiceai-connect-vs-callin-io',
    'voiceai-connect-vs-insighto', 'missed-call-cost-small-business', 'ai-receptionist-vs-ivr-vs-answering-service',
    'how-to-sell-ai-to-local-businesses', 'what-is-ai-receptionist-how-it-works', 'how-to-set-up-ai-receptionist',
    'what-can-ai-receptionist-handle', 'ai-receptionist-prompt-templates', 'smma-profit-margins-2026',
    'ai-agency-profit-margins-2026', 'how-to-find-leads-google-maps', 'ai-receptionist-agency-vs-smma',
    'best-industries-ai-receptionist', 'best-recurring-revenue-business-ideas-2026', 'building-referral-program-agency',
    'cold-outreach-templates-that-work', 'how-much-do-ai-receptionist-agencies-make', 'how-to-price-ai-receptionist-services',
    'how-to-start-ai-receptionist-agency', 'my-ai-front-desk-alternative', 'phone-only-business-ai-agency',
    'pitch-ai-receptionists-home-services', 'white-label-ai-receptionist-platform', 'white-label-vs-build-ai-receptionist',
    'best-online-businesses-no-experience', 'ai-agency-vs-dropshipping', 'recurring-revenue-business-no-code',
    'first-month-ai-receptionist-agency', 'can-you-start-ai-business-no-technical-skills', 'voiceai-connect-vs-trillet',
    'voiceai-connect-vs-goodcall', 'voiceai-connect-vs-smith-ai', 'why-agencies-switch-answering-services-to-ai',
    'sell-ai-receptionist-to-plumbers', 'sell-ai-receptionist-to-dental-offices', 'sell-ai-receptionist-to-law-firms',
    'sell-ai-receptionist-to-restaurants', 'sell-ai-receptionist-to-auto-shops', 'complete-guide-white-label-ai-receptionist-business',
    'ai-receptionist-agency-profit-calculator', 'ai-receptionist-vs-human-receptionist-cost', 'signs-ai-receptionist-agency-is-right-for-you',
    'mistakes-new-ai-agency-owners-make', 'white-label-saas-business-model-explained', 'start-ai-receptionist-agency-from-india',
    'start-ai-business-from-anywhere',
  ];

  blogSlugs.forEach(s => hardcodedBlogSlugs.add(s));

  return [
    // Core Pages
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/platform`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },

    // Features Index
    { url: `${baseUrl}/features`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },

    // Features Pages
    ...['24-7-coverage', 'ai-demo', 'ai-intelligence', 'ai-summaries', 'analytics', 'api-access',
      'appointments', 'auto-provisioning', 'business-hours', 'call-recordings', 'client-crm',
      'exports', 'hipaa', 'industries', 'instant-answer', 'knowledge-base', 'leads-crm',
      'marketing-site', 'mobile-dashboard', 'notifications', 'phone-numbers', 'security',
      'sms-summaries', 'stripe-connect', 'transcripts', 'uptime', 'urgency-detection',
      'voice-options', 'voicemail',
    ].map(f => ({
      url: `${baseUrl}/features/${f}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7,
    })),
    { url: `${baseUrl}/features/white-label`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },

    // Blog Index
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },

    // Blog Posts, all existing hardcoded (minus any now 301'd by the SEO
    // consolidation; those must not appear in the sitemap).
    ...blogSlugs
      .filter(slug => !REDIRECTED_BLOG_SLUGS.has(slug))
      .map(slug => ({
        url: `${baseUrl}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: ['pricing-breakdown', 'platforms-ranked', 'resell'].some(k => slug.includes(k)) ? 0.7 : 0.6,
      })),

    // SEO Landing Pages
    ...['ai-receptionist-agency-pricing', 'ai-receptionist-answering-service-reseller',
      'best-white-label-ai-receptionist-platforms', 'gohighlevel-ai-receptionist',
      'how-much-can-you-make-ai-receptionist-reseller', 'how-to-start-ai-receptionist-agency',
      'voiceai-connect-vs-bland-ai', 'voiceai-connect-vs-synthflow',
      'what-is-white-label-ai-receptionist', 'white-label-ai-receptionist-marketing-agencies',
      'white-label-vs-build-your-own',
    ].map(slug => ({
      url: `${baseUrl}/${slug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8,
    })),

    // Auto-generated posts from blog-farm (deduplicated, and with any 301'd
    // slugs filtered out so the sitemap never advertises a redirecting URL).
    ...generatedEntries.filter(e => {
      const slug = e.url.split('/blog/')[1];
      return slug && !hardcodedBlogSlugs.has(slug) && !REDIRECTED_BLOG_SLUGS.has(slug);
    }),
  ];
}

export default async function sitemap() {
  // Read the host this sitemap was requested from. Awaited so it works whether
  // headers() is sync (Next 14) or a promise (Next 15).
  let host = '';
  try {
    const h = await headers();
    host = h.get('host') || h.get('x-forwarded-host') || '';
  } catch (e) { /* no request context -> platform sitemap */ }

  if (!isPlatformHost(host)) {
    return agencySitemap(host);
  }
  return platformSitemap();
}
