'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const fetchAgencyData = async () => {
    try {
      // Check localStorage for auth
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');
      const storedAgency = localStorage.getItem('agency');

      console.log('AgencyProvider - checking auth:', { 
        hasToken: !!token, 
        hasUser: !!storedUser,
        hasAgency: !!storedAgency 
      });

      if (!token) {
        console.log('AgencyProvider - no token, redirecting to login');
        router.push('/agency/login');
        return;
      }

      // Parse stored user to get agency_id
      let agencyId: string | null = null;
      let userData: User | null = null;

      if (storedUser) {
        userData = JSON.parse(storedUser);
        agencyId = userData?.agency_id || null;
        setUser(userData);
      }

      if (storedAgency) {
        const agencyData = JSON.parse(storedAgency);
        agencyId = agencyId || agencyData?.id;
      }

      if (!agencyId) {
        console.log('AgencyProvider - no agency_id found, redirecting to login');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('agency');
        router.push('/agency/login');
        return;
      }

      // Fetch fresh agency data from backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/${agencyId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        console.log('AgencyProvider - fetch failed, clearing auth');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('agency');
        router.push('/agency/login');
        return;
      }

      const data = await response.json();
      const fetchedAgency = data.agency;

      if (!fetchedAgency) {
        console.log('AgencyProvider - no agency in response');
        router.push('/agency/login');
        return;
      }

      // Update state
      setAgency(fetchedAgency);
      
      // Update localStorage with fresh data
      localStorage.setItem('agency', JSON.stringify(fetchedAgency));

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
      console.error('AgencyProvider - error fetching agency data:', error);
      router.push('/agency/login');
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