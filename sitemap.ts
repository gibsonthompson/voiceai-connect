import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://myvoiceaiconnect.com'

  // Core Pages
  const corePages = [
    { url: '', changeFrequency: 'weekly', priority: 1.0 },
    { url: '/platform', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/how-it-works', changeFrequency: 'monthly', priority: 0.9 },
    { url: '/features', changeFrequency: 'weekly', priority: 0.9 },
    { url: '/faq', changeFrequency: 'monthly', priority: 0.7 },
    { url: '/signup', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { url: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Feature Pages (31)
  const featurePages = [
    '24-7-coverage',
    'ai-demo',
    'ai-intelligence',
    'ai-summaries',
    'analytics',
    'api-access',
    'appointments',
    'auto-provisioning',
    'backups',
    'business-hours',
    'call-recordings',
    'client-crm',
    'exports',
    'hipaa',
    'industries',
    'instant-answer',
    'knowledge-base',
    'marketing-site',
    'mobile-dashboard',
    'notifications',
    'phone-numbers',
    'security',
    'sms-summaries',
    'stripe-connect',
    'transcripts',
    'uptime',
    'urgency-detection',
    'voice-options',
    'voicemail',
    'white-label',
  ].map((slug) => ({
    url: `/features/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Blog Posts (14)
  const blogPosts = [
    'ai-receptionist-agency-vs-smma',
    'best-industries-ai-receptionist',
    'best-recurring-revenue-business-ideas-2026',
    'building-referral-program-agency',
    'cold-outreach-templates-that-work',
    'how-much-do-ai-receptionist-agencies-make',
    'how-to-price-ai-receptionist-services',
    'how-to-start-ai-receptionist-agency',
    'my-ai-front-desk-alternative',
    'phone-only-business-ai-agency',
    'pitch-ai-receptionists-home-services',
    'white-label-ai-receptionist-platform',
    'white-label-vs-build-ai-receptionist',
  ].map((slug) => ({
    url: `/blog/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Blog Index
  const blogIndex = [
    { url: '/blog', changeFrequency: 'weekly' as const, priority: 0.8 },
  ]

  // SEO Landing Pages (11)
  const seoPages = [
    'ai-receptionist-agency-pricing',
    'ai-receptionist-answering-service-reseller',
    'best-white-label-ai-receptionist-platforms',
    'gohighlevel-ai-receptionist',
    'how-much-can-you-make-ai-receptionist-reseller',
    'how-to-start-ai-receptionist-agency',
    'voiceai-connect-vs-bland-ai',
    'voiceai-connect-vs-synthflow',
    'what-is-white-label-ai-receptionist',
    'white-label-ai-receptionist-marketing-agencies',
    'white-label-vs-build-your-own',
  ].map((slug) => ({
    url: `/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Agency Public Site
  const agencySite = [
    { url: '/agency-site', changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: '/agency-site/get-started', changeFrequency: 'monthly' as const, priority: 0.5 },
  ]

  // Combine all and add base URL + lastModified
  const allPages = [
    ...corePages,
    ...featurePages,
    ...blogIndex,
    ...blogPosts,
    ...seoPages,
    ...agencySite,
  ]

  return allPages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}