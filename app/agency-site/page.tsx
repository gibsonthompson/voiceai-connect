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
  // Advanced config (JSONB)
  marketing_config?: Partial<MarketingConfig>;
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

export default function AgencySiteHomePage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detectedLogoBackground, setDetectedLogoBackground] = useState<string | null>(null);
  const [detectedTheme, setDetectedTheme] = useState<'light' | 'dark'>('light');

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
        setAgency(data.agency);
        
        // Set page title
        setPageTitle(`${data.agency.name} - AI Receptionist`);
        
        // Set favicon - prefer favicon_url, fall back to logo_url
        const faviconUrl = data.agency.favicon_url || data.agency.logo_url;
        if (faviconUrl) {
          setFavicon(faviconUrl);
        }
        
        // Detect logo background color if we have a logo
        if (data.agency.logo_url) {
          const bgColor = await detectLogoBackgroundColor(data.agency.logo_url);
          setDetectedLogoBackground(bgColor);
          
          // Only set dark theme if explicitly configured (not auto-detect)
          // Auto now defaults to light for better readability
        }
      } catch (err) {
        console.error('Failed to fetch agency:', err);
        setError('Unable to load. Please check the URL.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgency();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Site Not Found</h1>
          <p className="text-gray-500">Please check the URL and try again.</p>
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
  // 'auto' and 'light' both result in light theme for better default experience

  // Use stored or detected logo background color
  const logoBackgroundColor = agency.logo_background_color || detectedLogoBackground;

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
      demoPhone: agency.support_phone || '',
      demoInstructions: agency.support_phone 
        ? "Call now to hear our AI in action. Tell it about your business and see how it handles calls."
        : "",
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
      phone: agency.support_phone || '',
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
        { label: 'Get Started', href: '/client/signup' },
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