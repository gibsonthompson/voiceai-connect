'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import MarketingPage from '@/components/MarketingPage';
import { MarketingConfig } from '@/types/marketing';

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;
  logo_background_color: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  // Content
  company_tagline: string | null;
  website_headline: string | null;
  website_subheadline: string | null;
  website_theme: 'auto' | 'light' | 'dark' | null;
  // Plan type (for feature gating)
  plan_type: string | null;
  // Pricing (stored in cents)
  price_starter: number;
  price_pro: number;
  price_growth: number;
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
  // Contact
  support_email: string | null;
  support_phone: string | null;
  // Demo phone — auto-provisioned via Demo Phone tab
  demo_phone_number: string | null;
  // Legacy manual override (if agency set one manually)
  demo_phone: string | null;
  // Advanced config (JSONB)
  marketing_config?: Partial<MarketingConfig>;
}

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
  // Remove existing favicons
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => link.remove());
  
  // Add new favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = url;
  document.head.appendChild(link);
  
  // Also add apple-touch-icon
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = url;
  document.head.appendChild(appleLink);
}

// Set dynamic page title
function setPageTitle(title: string) {
  document.title = title;
}

// Detect if a color is dark
function isDarkColor(color: string): boolean {
  // Handle rgb format
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0]);
      const g = parseInt(matches[1]);
      const b = parseInt(matches[2]);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }
  }
  // Handle hex format
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }
  return false;
}

// Detect logo background color from image
function detectLogoBackgroundColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Sample corners to detect background
        const corners = [
          [0, 0],
          [img.width - 1, 0],
          [0, img.height - 1],
          [img.width - 1, img.height - 1],
        ];
        
        let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
        let count = 0;
        
        corners.forEach(([x, y]) => {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          totalR += pixel[0];
          totalG += pixel[1];
          totalB += pixel[2];
          totalA += pixel[3];
          count++;
        });
        
        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);
        const avgA = Math.round(totalA / count);
        
        // If mostly transparent, no background color needed
        if (avgA < 128) {
          resolve(null);
          return;
        }
        
        // If it's white or very light, no wrapper needed on light theme
        if (avgR > 240 && avgG > 240 && avgB > 240) {
          resolve(null);
          return;
        }
        
        resolve(`rgb(${avgR}, ${avgG}, ${avgB})`);
      } catch (e) {
        console.error('Error detecting logo background:', e);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      resolve(null);
    };
    
    img.src = imageUrl;
  });
}

// ============================================================================
// THEMED LOADING COMPONENT
// ============================================================================
function ThemedLoading({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: isDark ? '#050505' : '#ffffff' }}
    >
      <Loader2 
        className="h-8 w-8 animate-spin" 
        style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
      />
    </div>
  );
}

export default function AgencySiteHomePage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [detectedLogoBackground, setDetectedLogoBackground] = useState<string | null>(null);
  const [detectedTheme, setDetectedTheme] = useState<'light' | 'dark'>('light');
  const [cachedTheme, setCachedThemeState] = useState<'light' | 'dark'>('light');

  // Get cached theme on mount (client-side only)
  useEffect(() => {
    setCachedThemeState(getCachedTheme());
  }, []);

  useEffect(() => {
    const fetchAgency = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const host = window.location.host;
        const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        
        if (!response.ok) {
          throw new Error('Agency not found');
        }
        
        const data = await response.json();
        const agencyData = data.agency;
        
        // ============================================================
        // FEATURE GATE: Redirect Starter plan to /get-started
        // ============================================================
        if (!hasMarketingSiteAccess(agencyData.plan_type)) {
          console.log('📍 Starter plan detected - redirecting to /get-started');
          setRedirecting(true);
          window.location.href = '/get-started';
          return; // Don't continue processing
        }
        
        setAgency(agencyData);
        
        // Cache the theme for subsequent pages (get-started, etc.)
        setCachedTheme(agencyData.website_theme);
        
        // Set page title
        setPageTitle(`${agencyData.name} - AI Receptionist`);
        
        // Set favicon - prefer favicon_url, fall back to logo_url
        const faviconUrl = agencyData.favicon_url || agencyData.logo_url;
        if (faviconUrl) {
          setFavicon(faviconUrl);
        }
        
        // Detect logo background color if we have a logo
        if (agencyData.logo_url) {
          const bgColor = await detectLogoBackgroundColor(agencyData.logo_url);
          setDetectedLogoBackground(bgColor);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch agency:', err);
        setError('Unable to load. Please check the URL.');
        setLoading(false);
      }
    };

    fetchAgency();
  }, []);

  // Show blank loading screen while redirecting
  if (redirecting || loading) {
    return <ThemedLoading theme={cachedTheme} />;
  }

  if (error || !agency) {
    const isDark = cachedTheme === 'dark';
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: isDark ? '#050505' : '#ffffff' }}
      >
        <div className="text-center">
          <h1 
            className="text-2xl font-medium mb-2"
            style={{ color: isDark ? '#fafaf9' : '#111827' }}
          >
            Site Not Found
          </h1>
          <p style={{ color: isDark ? '#6b7280' : '#6b7280' }}>
            Please check the URL and try again.
          </p>
        </div>
      </div>
    );
}

  // Convert cents to dollars for display
  const starterPrice = (agency.price_starter || 4900) / 100;
  const proPrice = (agency.price_pro || 9900) / 100;
  const growthPrice = (agency.price_growth || 14900) / 100;

  // Determine final theme - default to light unless explicitly set to dark
  let theme: 'light' | 'dark' = 'light';
  if (agency.website_theme === 'dark') {
    theme = 'dark';
  }

  // Use stored or detected logo background color
  const logoBackgroundColor = agency.logo_background_color || detectedLogoBackground;

  // ============================================================================
  // DEMO PHONE RESOLUTION
  // Priority: manual override (demo_phone) → auto-provisioned (demo_phone_number)
  // If neither exists → NO demo section (don't show platform's 770 number)
  // ============================================================================
  const rawDemoPhone = agency.demo_phone || agency.demo_phone_number || null;
  const demoPhone = rawDemoPhone ? formatPhoneDisplay(rawDemoPhone) : undefined;

  // Build marketing config from agency data
  const marketingConfig: Partial<MarketingConfig> = {
    theme,
    branding: {
      name: agency.name,
      logoUrl: agency.logo_url || '',
      logoBackgroundColor: logoBackgroundColor || undefined,
      primaryColor: agency.primary_color || '#10b981',
      primaryHoverColor: adjustColor(agency.primary_color || '#10b981', -15),
      accentColor: agency.accent_color || '#34d399',
    },
    hero: {
      badge: agency.company_tagline || 'AI-Powered Phone Answering',
      headline: agency.website_headline 
        ? [agency.website_headline] 
        : ['Never Miss', 'Another Call'],
      subtitle: agency.website_subheadline || `AI Receptionist Starting at $${starterPrice}/month`,
      description: `Professional AI that answers every call, books appointments, and sends you instant summaries—24/7. Setup takes just 10 minutes.`,
      // Only show demo if agency has their own number — empty string hides the section
      demoPhone: demoPhone || '',
      demoInstructions: demoPhone
        ? "Call now to hear our AI in action. Tell it about your business and see how it handles calls."
        : '',
      trustItems: ['10-Minute Setup', 'No Credit Card Required', '24/7 Call Answering'],
    },
    pricing: [
      {
        name: 'Starter',
        price: starterPrice,
        subtitle: 'Perfect for solo operators',
        features: [
          '1 AI phone number',
          `Up to ${agency.limit_starter || 50} calls per month`,
          'Basic appointment booking',
          'Google Calendar integration',
          'Emergency call transfer',
          'Text summaries after each call',
          'Mobile app access',
          'Call recordings & transcripts',
          'Email support',
        ],
      },
      {
        name: 'Professional',
        price: proPrice,
        subtitle: 'For growing businesses',
        isPopular: true,
        features: [
          'Everything in Starter, plus:',
          `Up to ${agency.limit_pro || 150} calls per month`,
          'Advanced appointment booking',
          'Multiple calendar integration',
          'Custom business hours',
          'Lead qualification questions',
          'Priority call transfer rules',
          'Analytics dashboard',
          'Priority email support',
        ],
      },
      {
        name: 'Growth',
        price: growthPrice,
        subtitle: 'For high-volume operations',
        features: [
          'Everything in Professional, plus:',
          `Up to ${agency.limit_growth || 500} calls per month`,
          'Up to 3 AI phone numbers',
          'Advanced CRM integration',
          'Custom AI training',
          'Multi-language support',
          'Dedicated account manager',
          'Custom reporting',
          'Priority phone support',
        ],
        note: 'Best value for high call volume',
      },
    ],
    footer: {
      address: '',
      // Footer phone: use support_phone if available, or demo phone, or empty
      phone: agency.support_phone || (demoPhone ? demoPhone : ''),
      email: agency.support_email || '',
      productLinks: [
        { label: 'Features', href: '#features' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'FAQ', href: '#faq' },
      ],
      industryLinks: [
        { label: 'Home Services', href: '#' },
        { label: 'Medical & Dental', href: '#' },
        { label: 'Restaurants', href: '#' },
        { label: 'Professional Services', href: '#' },
      ],
      companyLinks: [
        { label: 'Get Started', href: '/get-started' },
        { label: 'Contact', href: agency.support_email ? `mailto:${agency.support_email}` : '#' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms & Conditions', href: '/terms' },
      ],
    },
    // Merge any advanced config the agency has set
    ...(agency.marketing_config || {}),
  };

  return <MarketingPage config={marketingConfig} />;
}

// Helper to darken/lighten a hex color
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