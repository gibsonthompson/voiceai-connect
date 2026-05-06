'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Agency {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  status: string;
  plan_type: string;
  subscription_status: string;
  trial_ends_at: string | null;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  country: string | null;
  marketing_domain: string | null;
  domain_verified: boolean;
  price_starter: number;
  price_pro: number;
  price_growth: number;
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
  created_at: string;
  company_tagline: string | null;
  website_headline: string | null;
  website_subheadline: string | null;
  marketing_config: Record<string, unknown> | null;
  website_theme: 'auto' | 'light' | 'dark' | null;
  logo_background_color: string | null;
  branding_overrides: {
    nav_bg?: string;
    nav_text?: string;
    page_bg?: string;
    card_bg?: string;
    card_border?: string;
    button_text?: string;
    text_primary?: string;
    text_muted?: string;
  } | null;
  demo_phone_number: string | null;
  demo_assistant_id: string | null;
  demo_vapi_phone_id: string | null;
  gtm_id: string | null;
  fb_pixel_id: string | null;
  google_analytics_id: string | null;
  custom_head_scripts: string | null;
  custom_body_scripts: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
}

interface User {
  id: string;
  email: string;
  role: string;
  agency_id: string;
  first_name?: string;
  last_name?: string;
  permissions?: Record<string, boolean> | null;
}

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  name: string;
}

interface AgencyContextType {
  agency: Agency | null;
  user: User | null;
  branding: Branding;
  loading: boolean;
  isTrialActive: boolean;
  isExpired: boolean;
  trialDaysLeft: number | null;
  effectivePlan: string;
  refreshAgency: () => Promise<void>;
  demoMode: boolean;
  toggleDemoMode: () => void;
  hasPermission: (key: string) => boolean;
}

const defaultBranding: Branding = {
  primaryColor: '#10b981',
  secondaryColor: '#059669',
  accentColor: '#34d399',
  logoUrl: null,
  name: 'VoiceAI Connect',
};

const AgencyContext = createContext<AgencyContextType>({
  agency: null,
  user: null,
  branding: defaultBranding,
  loading: true,
  isTrialActive: false,
  isExpired: false,
  trialDaysLeft: null,
  effectivePlan: 'starter',
  refreshAgency: async () => {},
  demoMode: false,
  toggleDemoMode: () => {},
  hasPermission: () => true,
});

export function useAgency() {
  const context = useContext(AgencyContext);
  if (!context) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return context;
}

function isTrialStatus(status: string | null | undefined): boolean {
  return status === 'trial' || status === 'trialing';
}

function isExpiredStatus(status: string | null | undefined): boolean {
  return status === 'expired' || status === 'trial_expired' || status === 'canceled' || status === 'cancelled';
}

function calculateTrialDays(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function buildBranding(agency: any): Branding {
  return {
    primaryColor: agency.primary_color || '#10b981',
    secondaryColor: agency.secondary_color || '#059669',
    accentColor: agency.accent_color || '#34d399',
    logoUrl: agency.logo_url || null,
    name: agency.name || 'VoiceAI Connect',
  };
}

export function AgencyProvider({ children }: { children: ReactNode }) {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('voiceai_demo_mode');
      if (stored === 'true') setDemoMode(true);
    } catch {}
  }, []);

  const toggleDemoMode = () => {
    setDemoMode(prev => {
      const next = !prev;
      try { localStorage.setItem('voiceai_demo_mode', next.toString()); } catch {}
      return next;
    });
  };

  // =========================================================================
  // Stale-while-revalidate: use localStorage cache immediately, then refresh
  // in the background. This eliminates the loading skeleton on every navigation
  // when using <a> tags (full page reloads).
  // =========================================================================
  const fetchAgencyData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const storedAgency = localStorage.getItem('agency');

      if (!token || !storedAgency) {
        window.location.href = '/agency/login';
        return;
      }

      const agencyData = JSON.parse(storedAgency);

      // Get user from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Use cached data IMMEDIATELY — skip the loading skeleton
      setAgency(agencyData);
      setBranding(buildBranding(agencyData));
      setLoading(false);

      // Then refresh from server in the background (silent update)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/${agencyData.id}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        // Token expired or invalid — clear and redirect
        localStorage.removeItem('auth_token');
        localStorage.removeItem('agency');
        localStorage.removeItem('user');
        window.location.href = '/agency/login';
        return;
      }

      const data = await response.json();
      const freshAgency = data.agency;

      if (freshAgency) {
        // Update state with fresh data
        setAgency(freshAgency);
        setBranding(buildBranding(freshAgency));
        // Update localStorage cache for next navigation
        localStorage.setItem('agency', JSON.stringify(freshAgency));
      }
    } catch (error) {
      console.error('Error fetching agency data:', error);
      // Only redirect if we don't already have cached data
      if (!agency) {
        window.location.href = '/agency/login';
      }
    }
  };

  useEffect(() => {
    fetchAgencyData();
  }, []);

  const trialDaysLeft = calculateTrialDays(agency?.trial_ends_at || null);
  const isTrialActive = isTrialStatus(agency?.subscription_status) && (trialDaysLeft === null || trialDaysLeft > 0);
  const isExpired = isExpiredStatus(agency?.subscription_status) || 
    (isTrialStatus(agency?.subscription_status) && trialDaysLeft !== null && trialDaysLeft <= 0);
  const effectivePlan = isTrialActive ? 'enterprise' : (agency?.plan_type || 'starter');

  const hasPermission = (key: string): boolean => {
    if (!user) return false;
    if (user.role === 'agency_owner' || user.role === 'super_admin') return true;
    if (!user.permissions) return true;
    return user.permissions[key] !== false;
  };

  return (
    <AgencyContext.Provider value={{ 
      agency, 
      user, 
      branding, 
      loading, 
      isTrialActive,
      isExpired,
      trialDaysLeft,
      effectivePlan,
      refreshAgency: fetchAgencyData,
      demoMode,
      toggleDemoMode,
      hasPermission,
    }}>
      {children}
    </AgencyContext.Provider>
  );
}