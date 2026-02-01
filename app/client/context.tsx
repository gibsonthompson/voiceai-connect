'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import DynamicFavicon from '@/components/DynamicFavicon';

interface Client {
  id: string;
  business_name: string;
  email: string;
  owner_phone: string;
  industry: string;
  business_city: string;
  business_state: string;
  vapi_phone_number: string;
  subscription_status: string;
  plan_type: string;
  trial_ends_at: string | null;
  monthly_call_limit: number;
  calls_this_month: number;
  google_calendar_connected: boolean;
  created_at: string;
  agency: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    support_email: string | null;
    support_phone: string | null;
    website_theme: 'light' | 'dark' | 'auto' | null;
  } | null;
}

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  agencyName: string;
  logoUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  websiteTheme: 'light' | 'dark' | 'auto';
}

interface ClientContextType {
  client: Client | null;
  branding: Branding;
  loading: boolean;
  refreshClient: () => Promise<void>;
}

const defaultBranding: Branding = {
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  accentColor: '#60a5fa',
  agencyName: 'VoiceAI',
  logoUrl: null,
  supportEmail: null,
  supportPhone: null,
  websiteTheme: 'dark',
};

const ClientContext = createContext<ClientContextType>({
  client: null,
  branding: defaultBranding,
  loading: true,
  refreshClient: async () => {},
});

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}

export function ClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const fetchClientData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const storedClient = localStorage.getItem('client');

      if (!token || !storedClient) {
        router.push('/client/login');
        return;
      }

      const clientData = JSON.parse(storedClient);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/client/${clientData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('client');
        localStorage.removeItem('user');
        router.push('/client/login');
        return;
      }

      const data = await response.json();
      const fetchedClient = data.client;

      if (!fetchedClient) {
        router.push('/client/login');
        return;
      }

      setClient(fetchedClient);
      
      const agency = fetchedClient.agency;
      setBranding({
        primaryColor: agency?.primary_color || '#3b82f6',
        secondaryColor: agency?.secondary_color || '#1e40af',
        accentColor: agency?.accent_color || '#60a5fa',
        agencyName: agency?.name || 'VoiceAI',
        logoUrl: agency?.logo_url || null,
        supportEmail: agency?.support_email || null,
        supportPhone: agency?.support_phone || null,
        websiteTheme: agency?.website_theme || 'dark',
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching client data:', error);
      router.push('/client/login');
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  return (
    <ClientContext.Provider value={{ client, branding, loading, refreshClient: fetchClientData }}>
      <DynamicFavicon logoUrl={branding.logoUrl} primaryColor={branding.primaryColor} />
      {children}
    </ClientContext.Provider>
  );
}