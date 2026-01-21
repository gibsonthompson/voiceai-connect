'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AgencyBranding {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  // Computed colors for UI
  bgColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  cardBg: string;
  navBg: string;
}

interface BrandingContextType {
  branding: AgencyBranding | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultBranding: AgencyBranding = {
  id: '',
  name: 'VoiceAI Connect',
  slug: '',
  logoUrl: null,
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#3b82f6',
  bgColor: '#0a0a0a',
  textColor: '#f5f5f0',
  mutedTextColor: 'rgba(245, 245, 240, 0.5)',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  cardBg: 'rgba(255, 255, 255, 0.02)',
  navBg: '#111111',
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
  error: null,
  refetch: async () => {},
});

export function useBranding() {
  return useContext(BrandingContext);
}

// Helper to determine if a color is light or dark
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// Darken a hex color
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

// Lighten a hex color
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

// Generate UI colors from brand primary color
function generateUIColors(primaryColor: string): Partial<AgencyBranding> {
  const isLight = isLightColor(primaryColor);
  
  // For the nav, use a very dark version of primary or keep dark theme
  const navBg = darkenColor(primaryColor, 70);
  
  return {
    navBg,
    bgColor: '#0a0a0a', // Keep main bg dark for now
    textColor: '#f5f5f0',
    mutedTextColor: 'rgba(245, 245, 240, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    cardBg: 'rgba(255, 255, 255, 0.02)',
  };
}

interface BrandingProviderProps {
  children: ReactNode;
  agencyId?: string;
}

export function BrandingProvider({ children, agencyId }: BrandingProviderProps) {
  const [branding, setBranding] = useState<AgencyBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = async () => {
    if (!agencyId) {
      setBranding(defaultBranding);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/${agencyId}/settings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch agency branding');
      }

      const data = await response.json();
      const agency = data.agency;

      const uiColors = generateUIColors(agency.primary_color || '#2563eb');

      setBranding({
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        logoUrl: agency.logo_url,
        primaryColor: agency.primary_color || '#2563eb',
        secondaryColor: agency.secondary_color || '#1e40af',
        accentColor: agency.accent_color || '#3b82f6',
        ...uiColors,
      } as AgencyBranding);
    } catch (err) {
      console.error('Branding fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load branding');
      setBranding(defaultBranding);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, [agencyId]);

  return (
    <BrandingContext.Provider value={{ branding, loading, error, refetch: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

// CSS variable injection component
export function BrandingStyles() {
  const { branding } = useBranding();

  if (!branding) return null;

  return (
    <style jsx global>{`
      :root {
        --brand-primary: ${branding.primaryColor};
        --brand-secondary: ${branding.secondaryColor};
        --brand-accent: ${branding.accentColor};
        --brand-bg: ${branding.bgColor};
        --brand-text: ${branding.textColor};
        --brand-muted: ${branding.mutedTextColor};
        --brand-border: ${branding.borderColor};
        --brand-card-bg: ${branding.cardBg};
        --brand-nav-bg: ${branding.navBg};
      }
    `}</style>
  );
}