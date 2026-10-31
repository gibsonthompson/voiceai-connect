import type { NextConfig } from "next";

// ============================================================================
// SEO CONSOLIDATION REDIRECTS (Oct 2026)
// Built in two phases, both represented here so this file is the single source
// of truth for every 301 (deploy this and the sitemap's REDIRECTED_BLOG_SLUGS
// together; they must stay in sync).
//
// Phase 1 - cannibalization: thin blog duplicates folded into the one page that
//   should own each commercial term.
// Phase 2 - cluster cleanup: the 42 "sell AI receptionist to [vertical]" posts
//   (6 clicks total) and the "VoiceAI Connect vs [competitor]" posts (0 clicks)
//   folded into their hub. ~40% of the blog that earned ~6 clicks and diluted
//   authority. This also disposes of the fabricated pricing that was densest in
//   the "sell-to" posts.
// Every source below earns ~0 Search Console clicks, so nothing with traffic is
// redirected, only merged.
// ============================================================================

// Phase 1: cannibalization, blog dupe -> owner page.
const CANNIBALIZATION_REDIRECTS: { source: string; destination: string }[] = [
  { source: "/blog/white-label-ai-receptionist-platform", destination: "/platform" },
  { source: "/blog/white-label-ai-voice-agent-platform-agencies", destination: "/platform" },
  { source: "/blog/best-white-label-ai-receptionist-platforms-ranked", destination: "/best-white-label-ai-receptionist-platforms" },
  { source: "/blog/how-to-choose-white-label-ai-receptionist-platform", destination: "/best-white-label-ai-receptionist-platforms" },
  { source: "/blog/white-label-vs-build-ai-receptionist", destination: "/white-label-vs-build-your-own" },
  { source: "/blog/what-is-ai-receptionist-how-it-works", destination: "/how-it-works" },
  { source: "/blog/how-to-start-ai-receptionist-agency", destination: "/how-to-start-ai-receptionist-agency" },
  { source: "/blog/start-ai-receptionist-agency-from-india", destination: "/how-to-start-ai-receptionist-agency" },
  { source: "/blog/voiceai-connect-vs-synthflow", destination: "/voiceai-connect-vs-synthflow" },
  { source: "/blog/ai-receptionist-agency-pricing-tiers", destination: "/ai-receptionist-agency-pricing" },
  { source: "/blog/ai-agency-profit-margins-2026", destination: "/blog/smma-profit-margins-2026" },
];

// Phase 2a: "sell AI receptionist to [vertical]" posts -> the industry hub that
// actually ranks. (Keep this list in sync with the sitemap.)
const SELL_TO_SLUGS: string[] = [
  "sell-ai-receptionist-to-accounting-firms",
  "sell-ai-receptionist-to-auto-shops",
  "sell-ai-receptionist-to-car-dealerships",
  "sell-ai-receptionist-to-chiropractors",
  "sell-ai-receptionist-to-churches",
  "sell-ai-receptionist-to-cleaning-companies",
  "sell-ai-receptionist-to-daycare-and-childcare-centers",
  "sell-ai-receptionist-to-dental-offices",
  "sell-ai-receptionist-to-electricians",
  "sell-ai-receptionist-to-financial-advisors",
  "sell-ai-receptionist-to-funeral-homes",
  "sell-ai-receptionist-to-general-contractors",
  "sell-ai-receptionist-to-gyms-fitness-studios",
  "sell-ai-receptionist-to-home-care-agencies",
  "sell-ai-receptionist-to-home-service-contractors",
  "sell-ai-receptionist-to-hotels-and-resorts",
  "sell-ai-receptionist-to-hvac-companies",
  "sell-ai-receptionist-to-insurance-agencies",
  "sell-ai-receptionist-to-landscaping-lawn-care-companies",
  "sell-ai-receptionist-to-law-firms",
  "sell-ai-receptionist-to-massage-therapy-studios",
  "sell-ai-receptionist-to-med-spas",
  "sell-ai-receptionist-to-medical-practices",
  "sell-ai-receptionist-to-mortgage-brokers",
  "sell-ai-receptionist-to-moving-companies",
  "sell-ai-receptionist-to-nail-salons",
  "sell-ai-receptionist-to-optometrists",
  "sell-ai-receptionist-to-pest-control-companies",
  "sell-ai-receptionist-to-photography-studios",
  "sell-ai-receptionist-to-physical-therapy-clinics",
  "sell-ai-receptionist-to-plumbers",
  "sell-ai-receptionist-to-plumbing-companies",
  "sell-ai-receptionist-to-property-management-companies",
  "sell-ai-receptionist-to-restaurants",
  "sell-ai-receptionist-to-roofing-contractors",
  "sell-ai-receptionist-to-salons-and-spas",
  "sell-ai-receptionist-to-tattoo-studios",
  "sell-ai-receptionist-to-trucking-companies",
  "sell-ai-receptionist-to-tutoring-centers",
  "sell-ai-receptionist-to-urgent-care-centers",
  "sell-ai-receptionist-to-veterinary-clinics",
  "sell-ai-receptionist-to-wedding-venues",
];
const SELL_TO_HUB = "/blog/best-industries-ai-receptionist";

// Phase 2b: "VoiceAI Connect vs [competitor]" posts -> the comparison hub.
// (synthflow is already handled in Phase 1, so it is not repeated here.)
const VS_SLUGS: string[] = [
  "voiceai-connect-vs-autocalls",
  "voiceai-connect-vs-callin-io",
  "voiceai-connect-vs-echowin",
  "voiceai-connect-vs-goodcall",
  "voiceai-connect-vs-insighto",
  "voiceai-connect-vs-smith-ai",
  "voiceai-connect-vs-trillet",
  "voiceai-connect-vs-voxtell",
];
const VS_HUB = "/best-white-label-ai-receptionist-platforms";

const nextConfig: NextConfig = {
  experimental: {
    // Disable aggressive Router Cache that causes stale pages on client-side navigation.
    // Without this, Next.js caches RSC payloads from prefetched routes and reuses them,
    // which can result in URL changing but page content not updating (the double-click bug).
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  async redirects() {
    return [
      // Legacy /get-started URL. The canonical wizard entry point is /signup.
      // /signup/plan and /signup/success are sibling routes in the same
      // directory. Embed.js (current version) loads /signup directly and
      // skips this redirect. Older embed.js files cached on agency
      // marketing sites still reference /get-started; this rule routes
      // them to the canonical path with all query params preserved
      // (embed=true, agency, parent_origin, etc).
      //
      // The :path* rule below is defensive. No sub-paths currently exist
      // under /get-started, but if anyone ever links to /get-started/foo
      // by accident or in a future regression, it'll still resolve.
      {
        source: "/get-started",
        destination: "/signup",
        permanent: true,
      },
      {
        source: "/get-started/:path*",
        destination: "/signup/:path*",
        permanent: true,
      },
      // The /features/* landing pages (and some blog posts) link their nav and
      // CTA to /pricing, but the plans live in the homepage #pricing section and
      // no /pricing route exists, so those links were 404ing (a visitor clicking
      // "Pricing" from a feature page hit Next's not-found page, which read as
      // "the pricing page errored"). Send /pricing and /plans to the real section.
      {
        source: "/pricing",
        destination: "/#pricing",
        permanent: true,
      },
      {
        source: "/plans",
        destination: "/#pricing",
        permanent: true,
      },

      // SEO consolidation, Phase 1 (cannibalization).
      ...CANNIBALIZATION_REDIRECTS.map((r) => ({
        source: r.source,
        destination: r.destination,
        permanent: true,
      })),

      // SEO consolidation, Phase 2a (sell-to verticals -> industry hub).
      ...SELL_TO_SLUGS.map((slug) => ({
        source: `/blog/${slug}`,
        destination: SELL_TO_HUB,
        permanent: true,
      })),

      // SEO consolidation, Phase 2b (vs competitor -> comparison hub).
      ...VS_SLUGS.map((slug) => ({
        source: `/blog/${slug}`,
        destination: VS_HUB,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
