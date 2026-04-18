// app/sitemap.ts
import { createClient } from '@supabase/supabase-js';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.myvoiceaiconnect.com';

  // Fetch auto-generated blog posts from Supabase
  let generatedEntries: MetadataRoute.Sitemap = [];
  const hardcodedBlogSlugs = new Set<string>();

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
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
      }
    }
  } catch { /* non-critical */ }

  // All hardcoded blog slugs for dedup
  const blogSlugs = [
    'white-label-ai-receptionist-pricing-breakdown', 'best-white-label-ai-receptionist-platforms-ranked',
    'how-to-resell-ai-receptionist-services', 'white-label-ai-receptionist-lead-gen-agencies',
    'set-up-white-label-ai-receptionist-business-24-hours', 'white-label-ai-receptionist-compliance-guide',
    'how-to-choose-white-label-ai-receptionist-platform', 'white-label-ai-voice-agent-platform-agencies',
    'voiceai-connect-vs-autocalls', 'voiceai-connect-vs-echowin', 'voiceai-connect-vs-voxtell',
    'voiceai-connect-vs-callin-io', 'voiceai-connect-vs-insighto',
    'missed-call-cost-small-business', 'ai-receptionist-vs-ivr-vs-answering-service',
    'how-to-sell-ai-to-local-businesses', 'what-is-ai-receptionist-how-it-works',
    'how-to-set-up-ai-receptionist', 'what-can-ai-receptionist-handle',
    'ai-receptionist-prompt-templates', 'smma-profit-margins-2026', 'ai-agency-profit-margins-2026',
    'how-to-find-leads-google-maps', 'ai-receptionist-agency-vs-smma', 'best-industries-ai-receptionist',
    'best-recurring-revenue-business-ideas-2026', 'building-referral-program-agency',
    'cold-outreach-templates-that-work', 'how-much-do-ai-receptionist-agencies-make',
    'how-to-price-ai-receptionist-services', 'how-to-start-ai-receptionist-agency',
    'my-ai-front-desk-alternative', 'phone-only-business-ai-agency',
    'pitch-ai-receptionists-home-services', 'white-label-ai-receptionist-platform',
    'white-label-vs-build-ai-receptionist', 'best-online-businesses-no-experience',
    'ai-agency-vs-dropshipping', 'recurring-revenue-business-no-code',
    'first-month-ai-receptionist-agency', 'can-you-start-ai-business-no-technical-skills',
    'voiceai-connect-vs-trillet', 'voiceai-connect-vs-goodcall', 'voiceai-connect-vs-smith-ai',
    'best-ai-receptionist-platforms-compared-2026', 'why-agencies-switch-answering-services-to-ai',
    'sell-ai-receptionist-to-plumbers', 'sell-ai-receptionist-to-dental-offices',
    'sell-ai-receptionist-to-law-firms', 'sell-ai-receptionist-to-restaurants',
    'sell-ai-receptionist-to-auto-shops', 'complete-guide-white-label-ai-receptionist-business',
    'ai-receptionist-agency-profit-calculator', 'ai-receptionist-vs-human-receptionist-cost',
    'signs-ai-receptionist-agency-is-right-for-you', 'mistakes-new-ai-agency-owners-make',
    'white-label-saas-business-model-explained', 'start-ai-receptionist-agency-from-india',
    'start-ai-business-from-anywhere', 'ai-receptionist-for-plumbers',
    'ai-receptionist-for-dentists', 'ai-receptionist-for-lawyers',
    'ai-receptionist-for-hvac', 'ai-receptionist-for-real-estate',
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
      url: `${baseUrl}/features/${f}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7,
    })),
    { url: `${baseUrl}/features/white-label`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },

    // Blog Index
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },

    // Blog Posts — all existing hardcoded
    ...blogSlugs.map(slug => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
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
      url: `${baseUrl}/${slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8,
    })),

    // Auto-generated posts from blog-farm (deduplicated)
    ...generatedEntries.filter(e => {
      const slug = e.url.split('/blog/')[1];
      return slug && !hardcodedBlogSlugs.has(slug);
    }),
  ];
}