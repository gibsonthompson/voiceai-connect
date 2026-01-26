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
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  // Marketing config (stored in agency or separate table)
  marketing_config?: Partial<MarketingConfig>;
  // Pricing
  price_starter: number;
  price_pro: number;
  price_growth: number;
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
  // Contact
  support_email?: string;
  support_phone?: string;
  city?: string;
  state?: string;
}

export default function AgencySiteHomePage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Build marketing config from agency data
  const marketingConfig: Partial<MarketingConfig> = {
    branding: {
      name: agency.name,
      logoUrl: agency.logo_url || '',
      primaryColor: agency.primary_color || '#122092',
      primaryHoverColor: adjustColor(agency.primary_color || '#122092', -20),
      accentColor: agency.accent_color || '#f6b828',
    },
    hero: {
      badge: agency.marketing_config?.hero?.badge || 'Trusted by local businesses',
      headline: agency.marketing_config?.hero?.headline || ['Run Your Business.', "We'll Answer Your Calls."],
      subtitle: agency.marketing_config?.hero?.subtitle || `AI Receptionist • Starting at $${agency.price_starter}/Month`,
      description: agency.marketing_config?.hero?.description || 
        'Professional AI that answers every call, books appointments, and sends you instant summaries—24/7. Setup in 10 minutes.',
      demoPhone: agency.marketing_config?.hero?.demoPhone || agency.support_phone || '770-809-2820',
      demoInstructions: agency.marketing_config?.hero?.demoInstructions ||
        "Tell our AI your business, and it'll answer your test call like it's been your receptionist for years. Try it in 30 seconds.",
      trustItems: agency.marketing_config?.hero?.trustItems || ['10-Minute Setup', 'No Credit Card Required', '24/7 Call Answering'],
    },
    pricing: [
      {
        name: 'Starter',
        price: agency.price_starter,
        subtitle: 'Perfect for solo operators',
        features: [
          '1 AI phone number',
          `Up to ${agency.limit_starter} calls per month`,
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
        price: agency.price_pro,
        subtitle: 'For growing businesses',
        isPopular: true,
        features: [
          'Everything in Starter, plus:',
          `Up to ${agency.limit_pro} calls per month`,
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
        price: agency.price_growth,
        subtitle: 'For high-volume operations',
        features: [
          'Everything in Professional, plus:',
          `Up to ${agency.limit_growth} calls per month`,
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
      address: agency.city && agency.state ? `${agency.city}, ${agency.state}` : '',
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
        { label: 'Contact', href: `mailto:${agency.support_email || ''}` },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms & Conditions', href: '/terms' },
      ],
    },
    // Merge any custom config the agency has set
    ...agency.marketing_config,
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