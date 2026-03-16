'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  // Client-level branding (overrides agency branding when set)
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
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
    plan_features?: Record<string, Record<string, boolean>>;
    branding_overrides?: {
      nav_bg?: string;
      nav_text?: string;
      page_bg?: string;
      card_bg?: string;
      card_border?: string;
      button_text?: string;
      text_primary?: string;
      text_muted?: string;
    } | null;
  } | null;
}

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  agencyName: string;
  businessName: string;
  logoUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  websiteTheme: 'light' | 'dark' | 'auto';
}

// ============================================================================
// PLAN FEATURE GATING TYPES & DEFAULTS
// ============================================================================
type ClientFeatureKey = 
  | 'sms_notifications'
  | 'email_summaries'
  | 'custom_greeting'
  | 'custom_voice'
  | 'knowledge_base'
  | 'business_hours'
  | 'advanced_analytics'
  | 'priority_support';

const DEFAULT_PLAN_FEATURES: Record<string, Record<string, boolean>> = {
  starter: {
    sms_notifications: true,
    email_summaries: true,
    custom_greeting: true,
    custom_voice: false,
    knowledge_base: true,
    business_hours: true,
    advanced_analytics: false,
    priority_support: false,
  },
  pro: {
    sms_notifications: true,
    email_summaries: true,
    custom_greeting: true,
    custom_voice: true,
    knowledge_base: true,
    business_hours: true,
    advanced_analytics: true,
    priority_support: false,
  },
  growth: {
    sms_notifications: true,
    email_summaries: true,
    custom_greeting: true,
    custom_voice: true,
    knowledge_base: true,
    business_hours: true,
    advanced_analytics: true,
    priority_support: true,
  },
};

const CLIENT_FEATURE_LABELS: Record<ClientFeatureKey, { title: string; description: string }> = {
  sms_notifications: {
    title: 'SMS Notifications',
    description: 'Receive text message alerts when calls come in.',
  },
  email_summaries: {
    title: 'Email Summaries',
    description: 'Get detailed email summaries after each call.',
  },
  custom_greeting: {
    title: 'Custom Greeting',
    description: 'Personalize the opening message your AI uses when answering calls.',
  },
  custom_voice: {
    title: 'Custom Voice',
    description: 'Choose from a variety of AI voices for your receptionist.',
  },
  knowledge_base: {
    title: 'Knowledge Base',
    description: 'Teach your AI about your services, pricing, and FAQs.',
  },
  business_hours: {
    title: 'Business Hours',
    description: 'Set your operating hours so your AI knows when you\'re available.',
  },
  advanced_analytics: {
    title: 'Advanced Analytics',
    description: 'Get deeper insights into call patterns and trends.',
  },
  priority_support: {
    title: 'Priority Support',
    description: 'Get faster response times from the support team.',
  },
};

// ============================================================================
// TRIAL STATUS HELPERS
// ============================================================================

/** Check if subscription is in a trial state (handles both 'trial' and 'trialing') */
function isTrialStatus(status: string | null | undefined): boolean {
  return status === 'trial' || status === 'trialing';
}

/** Check if client's trial is currently active (not expired) */
function isTrialActive(client: Client | null): boolean {
  if (!client) return false;
  if (!isTrialStatus(client.subscription_status)) return false;
  if (!client.trial_ends_at) return false;
  return new Date(client.trial_ends_at) > new Date();
}

/** Get the effective plan for feature gating.
 *  During active trial → 'growth' (full access, same pattern as agency effectivePlan = 'enterprise')
 *  Otherwise → client's actual plan_type */
function getEffectivePlan(client: Client | null): string {
  if (!client) return 'starter';
  if (isTrialActive(client)) return 'growth';
  return client.plan_type || 'starter';
}

// ============================================================================
// CONTEXT
// ============================================================================

interface ClientContextType {
  client: Client | null;
  branding: Branding;
  loading: boolean;
  refreshClient: () => Promise<void>;
  isFeatureEnabled: (feature: ClientFeatureKey) => boolean;
  getFeatureLabel: (feature: ClientFeatureKey) => { title: string; description: string };
  planType: string;
  /** Effective plan for feature gating — 'growth' during active trial, otherwise actual plan */
  effectivePlan: string;
}

const defaultBranding: Branding = {
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  accentColor: '#60a5fa',
  agencyName: 'VoiceAI',
  businessName: '',
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
  isFeatureEnabled: () => true,
  getFeatureLabel: (f) => CLIENT_FEATURE_LABELS[f] || { title: f, description: '' },
  planType: 'pro',
  effectivePlan: 'growth',
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
      // Client-level branding takes priority over agency branding
      setBranding({
        primaryColor: fetchedClient.primary_color || agency?.primary_color || '#3b82f6',
        secondaryColor: fetchedClient.secondary_color || agency?.secondary_color || '#1e40af',
        accentColor: fetchedClient.accent_color || agency?.accent_color || '#60a5fa',
        agencyName: agency?.name || 'VoiceAI',
        businessName: fetchedClient.business_name || '',
        logoUrl: fetchedClient.logo_url || agency?.logo_url || null,
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

  // ============================================================================
  // EFFECTIVE PLAN — 'growth' during active trial, otherwise actual plan
  // ============================================================================
  const effectivePlan = getEffectivePlan(client);

  const isFeatureEnabled = useCallback((feature: ClientFeatureKey): boolean => {
    if (!client) return true;
    
    // Use effectivePlan instead of raw plan_type for feature gating
    const plan = getEffectivePlan(client);
    const agencyFeatures = client.agency?.plan_features;
    
    const features = agencyFeatures?.[plan] || DEFAULT_PLAN_FEATURES[plan];
    
    if (!features) return true;
    
    return features[feature] !== false;
  }, [client]);

  const getFeatureLabel = useCallback((feature: ClientFeatureKey) => {
    return CLIENT_FEATURE_LABELS[feature] || { title: feature, description: '' };
  }, []);

  const planType = client?.plan_type || 'pro';

  return (
    <ClientContext.Provider value={{ 
      client, 
      branding, 
      loading, 
      refreshClient: fetchClientData,
      isFeatureEnabled,
      getFeatureLabel,
      planType,
      effectivePlan,
    }}>
      <DynamicFavicon logoUrl={branding.logoUrl} primaryColor={branding.primaryColor} />
      {children}
    </ClientContext.Provider>
  );
}

export type { ClientFeatureKey, Client, Branding };
export { CLIENT_FEATURE_LABELS, DEFAULT_PLAN_FEATURES, isTrialStatus, isTrialActive };