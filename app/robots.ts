import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.myvoiceaiconnect.com'

  return {
    rules: [
      {
        // Single wildcard rule. This intentionally covers AI crawlers too
        // (GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot,
        // Google-Extended, etc.). A per-bot block would make that bot ignore
        // this shared disallow list, so keeping one rule is both simpler and
        // safer while still allowing every AI/search crawler full access to
        // the public marketing and blog surface.
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',              // API routes
          '/admin/',            // platform admin console
          '/agency/',           // agency dashboard + login (app UI, not content)
          '/client/',           // client dashboard (app UI, not content)
          '/auth/',             // auth flows
          '/onboarding/',       // post-signup onboarding flow
          '/signup/success',    // post-conversion confirmation page
          '/site-unavailable',  // suspended/inactive agency host fallback
          '/_next/',            // Next.js build assets
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}