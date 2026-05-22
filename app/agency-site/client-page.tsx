// app/agency-site/client-page.tsx
'use client';

import { useEffect } from 'react';
import MarketingPage from '@/components/MarketingPage';
import AgencySupportWidget from '@/components/AgencySupportWidget';
import { MarketingConfig, defaultMarketingConfig } from '@/types/marketing';
import { getCurrencySymbol } from '@/lib/currency-symbols';

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
  display_currency: string | null;
  marketing_config: Partial<MarketingConfig> | null;
  marketing_template: string | null;
  demo_phone: string | null;
  demo_phone_number: string | null;
  logo_background_color: string | null;
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
// TEMPLATE ROUTING
// Import additional templates here as they're built:
//   import MarketingPageModern from '@/components/MarketingPageModern';
//   import MarketingPageBold from '@/components/MarketingPageBold';
// ============================================================================
const TEMPLATES: Record<string, React.ComponentType<{ config: Partial<MarketingConfig> }>> = {
  classic: MarketingPage,
  // modern: MarketingPageModern,
  // bold: MarketingPageBold,
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

  // Currency symbol
  const currencySymbol = getCurrencySymbol(agency.display_currency || 'USD');

  // Build pricing from agency price columns
  const agencyPricing = [];
  if (agency.price_starter) {
    agencyPricing.push({
      ...defaultMarketingConfig.pricing[0],
      price: Math.round(agency.price_starter / 100),
    });
  }
  if (agency.price_pro) {
    agencyPricing.push({
      ...defaultMarketingConfig.pricing[1],
      price: Math.round(agency.price_pro / 100),
    });
  }
  if (agency.price_growth) {
    agencyPricing.push({
      ...defaultMarketingConfig.pricing[2],
      price: Math.round(agency.price_growth / 100),
    });
  }

  // Logo background color
  const logoBgColor = (agency.logo_background_color && agency.logo_background_color !== '#000000' && agency.logo_background_color !== '#000')
    ? agency.logo_background_color
    : 'transparent';

  // Build marketing config
  const marketingConfig: Partial<MarketingConfig> = {
    theme: agency.website_theme || 'light',
    currencySymbol,
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
      subtitle: `AI Receptionist Starting at ${currencySymbol}${agencyPricing.length > 0 ? agencyPricing[0].price : defaultMarketingConfig.pricing[0].price}/month`,
      demoPhone,
    },
    ...(agencyPricing.length > 0 ? { pricing: agencyPricing } : {}),
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
    clientLoginPath: '/client/login',
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
  };

  // Resolve FAQs for the support widget — from marketing_config or defaults
  const widgetFaqs = (marketingConfig as any).faqs || (agency.marketing_config as any)?.faqs || defaultMarketingConfig.faqs || [];
  const widgetFaqsCleaned = widgetFaqs.map((f: any) => ({
    question: f.question || '',
    answer: f.answer || '',
  }));

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
        faqs={widgetFaqsCleaned}
      />
    </>
  );
}