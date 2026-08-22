// app/agency-site/client-page.tsx
'use client';

import { useEffect } from 'react';
import MarketingPage from '@/components/MarketingPage';
import MarketingPageBeside from '@/components/MarketingPageBeside';
import AgencySupportWidget from '@/components/AgencySupportWidget';
import { MarketingConfig, defaultMarketingConfig } from '@/types/marketing';
import { getCurrencySymbol } from '@/lib/currency-symbols';
import { getCurrencyForCountry, currencies } from '@/lib/currency';

// ============================================================================
// TYPES
// ============================================================================
interface Agency {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscription_status: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  company_tagline: string | null;
  website_headline: string | null;
  website_theme: 'light' | 'dark' | 'auto' | null;
  support_email: string | null;
  support_phone: string | null;
  price_starter: number | null;
  price_pro: number | null;
  price_growth: number | null;
  country: string | null;
  display_currency: string | null;
  marketing_config: Partial<MarketingConfig> | null;
  marketing_template: string | null;
  demo_phone: string | null;
  demo_phone_number: string | null;
  logo_background_color: string | null;
  // Custom domain
  marketing_domain: string | null;
  domain_verified: boolean | null;
  // Custom marketing nav links (external header/footer links)
  custom_nav_links: { label: string; url: string }[] | null;
  // Analytics fields
  gtm_id: string | null;
  fb_pixel_id: string | null;
  google_analytics_id: string | null;
  custom_head_scripts: string | null;
  custom_body_scripts: string | null;
  // OG meta fields (handled server-side in layout.tsx generateMetadata)
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  // Plan
  plan_type: string | null;
}

const PLATFORM_DEMO_PHONE = '(470) 487-4561';

// ============================================================================
// HELPERS
// ============================================================================
function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length === 10) {
    return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  }
  return phone;
}

function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

function setCachedTheme(theme: 'light' | 'dark' | 'auto' | null) {
  if (typeof window === 'undefined') return;
  try {
    const resolved = theme === 'dark' ? 'dark' : 'light';
    sessionStorage.setItem('agency_theme', resolved);
  } catch (e) {}
}

function setFavicon(url: string) {
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => link.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = url;
  document.head.appendChild(link);
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = url;
  document.head.appendChild(appleLink);
}

function setPageTitle(title: string) {
  document.title = title;
}

// ============================================================================
// Resolve the homepage URL for logo links.
// If the agency has a verified custom domain, use it (so users on the subdomain
// get redirected to the custom domain when clicking the logo). If the user is
// already on the custom domain, use '/' to avoid a full-URL reload.
// ============================================================================
function resolveHomepageUrl(agency: Agency): string {
  const domain = agency.marketing_domain?.trim();
  if (!domain || agency.domain_verified !== true) return '/';

  // If we're already on the custom domain, use relative path
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname.replace(/^www\./, '');
    if (currentHost === domain.replace(/^www\./, '')) return '/';
  }

  return `https://${domain}`;
}

// ============================================================================
// Resolve the client login URL.
// Priority: verified custom domain first, then the agency subdomain.
// Always absolute so the client lands on a stable host for auth, regardless
// of which host the marketing page was viewed on.
// ============================================================================
function resolveLoginUrl(agency: Agency): string {
  const path = '/client/login';
  const domain = agency.marketing_domain?.trim();
  if (domain && agency.domain_verified === true) {
    const clean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    return `https://${clean}${path}`;
  }
  if (agency.slug) {
    return `https://${agency.slug}.myvoiceaiconnect.com${path}`;
  }
  return path;
}

// ============================================================================
// TEMPLATE ROUTING
// Register additional templates here as they're built. Each template accepts
// the same MarketingConfig contract, so signup, demo, login, pricing, currency,
// custom nav links, analytics, and theming all flow in from config.
// Keep this map in sync with the picker (app/agency/marketing/page.tsx) and the
// backend validTemplates list (routes/agency-settings.js).
//   import MarketingPageModern from '@/components/MarketingPageModern';
// ============================================================================
const TEMPLATES: Record<string, React.ComponentType<{ config: Partial<MarketingConfig> }>> = {
  classic: MarketingPage,
  beside: MarketingPageBeside,
};

// ============================================================================
// CLIENT COMPONENT
// Receives agency data as prop (fetched server-side by page.tsx)
// Builds MarketingConfig and renders the correct template
// ============================================================================
export default function AgencySiteClient({ agency }: { agency: Agency }) {
  // Client-side branding (favicon, title, theme cache)
  useEffect(() => {
    if (agency.logo_url) setFavicon(agency.logo_url);
    setPageTitle(`${agency.name} - AI Phone Answering`);
    setCachedTheme(agency.website_theme);
  }, [agency]);

  // Resolve demo phone: manual override → auto-provisioned → platform fallback
  const rawDemoPhone = agency.demo_phone || agency.demo_phone_number || PLATFORM_DEMO_PHONE;
  const demoPhone = formatPhoneDisplay(rawDemoPhone);

  // Currency resolution.
  // Priority: the currency the agency explicitly picked in Settings, then the
  // currency implied by the agency's country (so a GB agency shows GBP without
  // ever opening Settings), then USD as a last resort. The old code fell straight
  // to 'USD', which is why UK/EU agencies that never touched the dropdown showed "$".
  const currencyCode = agency.display_currency || getCurrencyForCountry(agency.country || 'US').code || 'USD';
  const currencySymbol = getCurrencySymbol(currencyCode);
  const currencyRate = currencies[currencyCode]?.rate ?? 1;
  const currencySymbolPosition = currencies[currencyCode]?.symbolPosition ?? 'before';

  // Homepage URL (custom domain if verified, otherwise /)
  const homepageUrl = resolveHomepageUrl(agency);

  // Client login URL (custom domain first, then subdomain)
  const loginUrl = resolveLoginUrl(agency);

  // Pricing resolution.
  // The dedicated price_* columns (written by Settings > Pricing) are the
  // source of truth for PRICE. Tier copy (names/features/subtitle) comes from
  // the agency's generated marketing_config when present, otherwise defaults.
  // We overlay the column price onto that base by index. This resolved array is
  // applied AFTER the marketing_config spread below so a stale `pricing` array
  // baked into that JSONB can never override what the agency sets in Settings.
  // (Same rule already used for customNavLinks and clientLoginPath.)
  const basePricing = (agency.marketing_config?.pricing && agency.marketing_config.pricing.length > 0)
    ? agency.marketing_config.pricing
    : defaultMarketingConfig.pricing;
  const priceCents = [agency.price_starter, agency.price_pro, agency.price_growth];
  const resolvedPricing = basePricing.map((tier, i) =>
    priceCents[i] != null ? { ...tier, price: Math.round((priceCents[i] as number) / 100) } : tier
  );

  // Logo background color
  const logoBgColor = (agency.logo_background_color && agency.logo_background_color !== '#000000' && agency.logo_background_color !== '#000')
    ? agency.logo_background_color
    : 'transparent';

  // Build marketing config
  const marketingConfig: Partial<MarketingConfig> = {
    theme: agency.website_theme || 'light',
    currencySymbol,
    currencyCode,
    currencyRate,
    currencySymbolPosition,
    homepageUrl,
    branding: {
      name: agency.name,
      logoUrl: agency.logo_url || '',
      logoBackgroundColor: logoBgColor,
      primaryColor: agency.primary_color || '#10b981',
      primaryHoverColor: agency.secondary_color || adjustColor(agency.primary_color || '#10b981', -15),
      accentColor: agency.accent_color || '#34d399',
    },
    hero: {
      ...defaultMarketingConfig.hero,
      badge: agency.company_tagline || defaultMarketingConfig.hero.badge,
      headline: agency.website_headline
        ? agency.website_headline.split('\n').length > 1
          ? agency.website_headline.split('\n')
          : [agency.website_headline]
        : defaultMarketingConfig.hero.headline,
      subtitle: `AI Receptionist Starting at ${currencySymbol}${resolvedPricing[0].price}/month`,
      demoPhone,
    },
    footer: {
      ...defaultMarketingConfig.footer,
      phone: agency.support_phone || '',
      email: agency.support_email || '',
      companyLinks: [
        ...(agency.support_email ? [{ label: 'Contact', href: `mailto:${agency.support_email}` }] : [{ label: 'Contact', href: '#' }]),
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms & Conditions', href: '/terms' },
      ],
    },
    analytics: {
      gtmId: agency.gtm_id || undefined,
      fbPixelId: agency.fb_pixel_id || undefined,
      googleAnalyticsId: agency.google_analytics_id || undefined,
      customHeadScripts: agency.custom_head_scripts || undefined,
      customBodyScripts: agency.custom_body_scripts || undefined,
    },
    // Merge any advanced config the agency has set via marketing_config JSONB
    // This is where unique generated copy lives
    ...(agency.marketing_config || {}),
    // Login URL last so the custom-domain/subdomain resolution always wins
    clientLoginPath: loginUrl,
    // After the marketing_config spread so the dedicated column always wins
    // over any stale value living in that JSONB.
    customNavLinks: Array.isArray(agency.custom_nav_links) ? agency.custom_nav_links : [],
    // Same rule for pricing: the price_* columns (Settings > Pricing) always win
    // over any stale `pricing` array baked into marketing_config by marketing-copy
    // generation. Without this, editing prices in Settings does nothing on the site.
    pricing: resolvedPricing,
  };

  // Resolve theme
  const isDark = (agency.website_theme || 'light') === 'dark';

  // Route to the correct template
  const templateKey = agency.marketing_template || 'classic';
  const TemplateComponent = TEMPLATES[templateKey] || TEMPLATES.classic;

  return (
    <>
      <TemplateComponent config={marketingConfig} />
      <AgencySupportWidget
        agencyName={agency.name}
        agencyLogo={agency.logo_url}
        primaryColor={agency.primary_color || '#10b981'}
        supportEmail={agency.support_email}
        isDark={isDark}
        pricing={(marketingConfig.pricing && marketingConfig.pricing.length > 0) ? marketingConfig.pricing : defaultMarketingConfig.pricing}
        currencySymbol={currencySymbol}
      />
    </>
  );
}