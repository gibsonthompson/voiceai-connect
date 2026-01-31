import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://myvoiceaiconnect.com'

  const entries: MetadataRoute.Sitemap = []

  // Core Pages
  const corePages = [
    { url: '', changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: '/platform', changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: '/how-it-works', changeFrequency: 'monthly' as const, priority: 0.9 },
    { url: '/features', changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: '/faq', changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: '/signup', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  ]

  corePages.forEach((page) => {
    entries.push({
      url: `${baseUrl}${page.url}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })
  })

  // Feature Pages (31)
  const featureSlugs = [
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
  ]

  featureSlugs.forEach((slug) => {
    entries.push({
      url: `${baseUrl}/features/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  })

  // Blog Index
  entries.push({
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  })

  // Blog Posts (14)
  const blogSlugs = [
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
  ]

  blogSlugs.forEach((slug) => {
    entries.push({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  })

  // SEO Landing Pages (11)
  const seoSlugs = [
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
  ]

  seoSlugs.forEach((slug) => {
    entries.push({
      url: `${baseUrl}/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  })

  // Agency Public Site
  entries.push({
    url: `${baseUrl}/agency-site`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  })

  entries.push({
    url: `${baseUrl}/agency-site/get-started`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  })

  return entries
}