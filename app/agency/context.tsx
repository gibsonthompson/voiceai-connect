'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Agency {
  id: string;
  name: string;
  slug: string;
  email: string;
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
  marketing_domain: string | null;
  domain_verified: boolean;
  price_starter: number;
  price_pro: number;
  price_growth: number;
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
  created_at: string;
  // Marketing website content
  company_tagline: string | null;
  website_headline: string | null;
  website_subheadline: string | null;
  marketing_config: Record<string, unknown> | null;
  // Theme settings
  website_theme: 'auto' | 'light' | 'dark' | null;
  logo_background_color: string | null;
}

interface User {
  id: string;
  email: string;
  role: string;
  agency_id: string;
  first_name?: string;
  last_name?: string;
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
  refreshAgency: () => Promise<void>;
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
  refreshAgency: async () => {},
});

export function useAgency() {
  const context = useContext(AgencyContext);
  if (!context) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return context;
}

export function AgencyProvider({ children }: { children: ReactNode }) {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const fetchAgencyData = async () => {
    try {
      // Check localStorage for auth (matching client pattern exactly)
      const token = localStorage.getItem('auth_token');
      const storedAgency = localStorage.getItem('agency');

      // If either is missing, redirect to login
      if (!token || !storedAgency) {
        window.location.href = '/agency/login';
        return;
      }

      // Parse stored agency to get ID
      const agencyData = JSON.parse(storedAgency);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      // Fetch fresh agency data from backend
      const response = await fetch(`${backendUrl}/api/agency/${agencyData.id}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        // Clear auth and redirect
        localStorage.removeItem('auth_token');
        localStorage.removeItem('agency');
        localStorage.removeItem('user');
        window.location.href = '/agency/login';
        return;
      }

      const data = await response.json();
      const fetchedAgency = data.agency || agencyData; // Fallback to stored data

      if (!fetchedAgency) {
        window.location.href = '/agency/login';
        return;
      }

      // Set state
      setAgency(fetchedAgency);
      
      // Get user from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Set branding
      setBranding({
        primaryColor: fetchedAgency.primary_color || '#10b981',
        secondaryColor: fetchedAgency.secondary_color || '#059669',
        accentColor: fetchedAgency.accent_color || '#34d399',
        logoUrl: fetchedAgency.logo_url || null,
        name: fetchedAgency.name || 'VoiceAI Connect',
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching agency data:', error);
      window.location.href = '/agency/login';
    }
  };

  useEffect(() => {
    fetchAgencyData();
  }, []);

  return (
    <AgencyContext.Provider value={{ agency, user, branding, loading, refreshAgency: fetchAgencyData }}>
      {children}
    </AgencyContext.Provider>
  );
}