// app/agency-site/page.tsx
'use client';

import { useState, useEffect } from 'react';
import MarketingPage from '@/components/MarketingPage';
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
  demo_phone: string | null;
  demo_phone_number: string | null;
  logo_background_color: string | null;
  // Analytics fields
  gtm_id: string | null;
  fb_pixel_id: string | null;
  google_analytics_id: string | null;
  custom_head_scripts: string | null;
  custom_body_scripts: string | null;
  // OG meta fields
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  // Plan
  plan_type: string | null;
}

const PLATFORM_DEMO_PHONE = '(470) 487-4561';

// ============================================================================
// HELPER: Format E.164 phone to display format
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

// ============================================================================
// HELPER: Check if agency has marketing site access
// ============================================================================
function hasMarketingSiteAccess(planType: string | null | undefined): boolean {
  if (!planType) return false;
  const plan = planType.toLowerCase();
  return plan === 'professional' || plan === 'enterprise' || plan === 'scale';
}

// ============================================================================
// HELPER: Cache theme for subsequent pages
// ============================================================================
function setCachedTheme(theme: 'light' | 'dark' | 'auto' | null) {
  if (typeof window === 'undefined') return;
  try {
    const resolved = theme === 'dark' ? 'dark' : 'light';
    sessionStorage.setItem('agency_theme', resolved);
  } catch (e) {
    // sessionStorage not available
  }
}

function getCachedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    const cached = sessionStorage.getItem('agency_theme');
    if (cached === 'dark') return 'dark';
  } catch (e) {
    // sessionStorage not available
  }
  return 'light';
}

// Set dynamic favicon
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

// Set dynamic page title
function setPageTitle(title: string) {
  document.title = title;
}

// Set OG meta tags dynamically
function setOGMeta(agency: Agency) {
  // Remove existing OG tags
  document.querySelectorAll('meta[property^="og:"]').forEach(el => el.remove());
  document.querySelectorAll('meta[name^="twitter:"]').forEach(el => el.remove());
  document.querySelector('meta[name="description"]')?.remove();

  const title = agency.og_title || `${agency.name} - AI Phone Answering`;
  const description = agency.og_description || agency.company_tagline || 'Professional AI receptionist that answers every call 24/7.';
  const image = agency.og_image_url || agency.logo_url || '';

  const tags = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    ...(image ? [{ property: 'og:image', content: image }] : []),
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    ...(image ? [{ name: 'twitter:image', content: image }] : []),
  ];

  tags.forEach(attrs => {
    const meta = document.createElement('meta');
    Object.entries(attrs).forEach(([key, val]) => meta.setAttribute(key, val));
    document.head.appendChild(meta);
  });

  // Also set standard description meta
  const descMeta = document.createElement('meta');
  descMeta.setAttribute('name', 'description');
  descMeta.setAttribute('content', description);
  document.head.appendChild(descMeta);
}

// ============================================================================
// HELPER: Darken/lighten hex
// ============================================================================
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

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function AgencySitePage() {
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgency() {
      try {
        const host = window.location.hostname;
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        
        // Check sessionStorage cache first (5-min TTL for marketing page data)
        const cacheKey = `agency_site_${host}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < 5 * 60 * 1000) { // 5 min cache
              setAgency(data);
              applyAgencyBranding(data);
              setLoading(false);
              return;
            }
          } catch {}
        }

        const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        if (!response.ok) {
          setError('Site not found');
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (!data.agency || ['suspended', 'deleted'].includes(data.agency.status)) {
          setError('Site not available');
          setLoading(false);
          return;
        }

        // Cache for 5 minutes
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: data.agency, ts: Date.now() }));
        } catch {}

        setAgency(data.agency);
        applyAgencyBranding(data.agency);
      } catch (err) {
        setError('Failed to load site');
      } finally {
        setLoading(false);
      }
    }

    loadAgency();
  }, []);

  function applyAgencyBranding(agency: Agency) {
    if (agency.logo_url) setFavicon(agency.logo_url);
    setPageTitle(`${agency.name} - AI Phone Answering`);
    setCachedTheme(agency.website_theme);
    setOGMeta(agency);
  }

  if (loading) {
    const cachedTheme = getCachedTheme();
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh',
        background: cachedTheme === 'dark' ? '#0f0f0f' : '#ffffff',
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid transparent',
          borderTopColor: '#10b981', borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{error || 'Site not found'}</h1>
          <p style={{ color: '#6b7280' }}>This site is not available.</p>
        </div>
      </div>
    );
  }

  // If agency is on Starter plan, redirect to /get-started instead of showing marketing page
  if (!hasMarketingSiteAccess(agency.plan_type)) {
    if (typeof window !== 'undefined') {
      window.location.href = '/get-started';
    }
    return null;
  }

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

  // Use logo_background_color from DB (pre-computed) instead of detecting on every load
  const logoBgColor = agency.logo_background_color || '';

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
    // Client login path — agency-domain specific
    clientLoginPath: '/client/login',
    // Analytics config
    analytics: {
      gtmId: agency.gtm_id || undefined,
      fbPixelId: agency.fb_pixel_id || undefined,
      googleAnalyticsId: agency.google_analytics_id || undefined,
      customHeadScripts: agency.custom_head_scripts || undefined,
      customBodyScripts: agency.custom_body_scripts || undefined,
    },
    // OG config
    og: {
      title: agency.og_title || undefined,
      description: agency.og_description || undefined,
      imageUrl: agency.og_image_url || undefined,
    },
    // Merge any advanced config the agency has set via marketing_config JSONB
    ...(agency.marketing_config || {}),
  };

  return <MarketingPage config={marketingConfig} />;
}