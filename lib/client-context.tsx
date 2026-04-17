'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DynamicFavicon from '@/components/DynamicFavicon';

// ============================================================================
// TYPES
// ============================================================================

interface Client {
  id: string;
  business_name: string;
  email: string;
  owner_name?: string;
  owner_phone: string;
  industry: string;
  business_city: string;
  business_state: string;
  vapi_phone_number: string;
  vapi_assistant_id?: string;
  subscription_status: string;
  plan_type: string;
  trial_ends_at: string | null;
  monthly_call_limit: number;
  calls_this_month: number;
  google_calendar_connected: boolean;
  call_mode?: string;
  ring_timeout?: number;
  created_at: string;

  // Branding — flat columns, no JSONB
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  nav_bg: string | null;
  nav_text: string | null;
  button_text: string | null;
  page_bg: string | null;
  card_bg: string | null;
  card_border: string | null;
  theme_mode: string | null; // 'light' | 'dark' | null

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
    client_header_mode?: 'agency_name' | 'business_name' | null;
    plan_features?: Record<string, Record<string, boolean>>;
  } | null;
}

interface User {
  id: string;
  email: string;
  role: string;
  client_id: string;
  first_name?: string;
  last_name?: string;
  permissions?: Record<string, boolean> | null;
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
  clientHeaderMode: 'agency_name' | 'business_name';
}

// ============================================================================
// FEATURE GATING
// ============================================================================

type ClientFeatureKey =
  | 'sms_notifications' | 'email_summaries' | 'custom_greeting' | 'custom_voice'
  | 'knowledge_base' | 'business_hours' | 'advanced_analytics' | 'priority_support';

const DEFAULT_PLAN_FEATURES: Record<string, Record<string, boolean>> = {
  starter: { sms_notifications: true, email_summaries: true, custom_greeting: true, custom_voice: false, knowledge_base: true, business_hours: true, advanced_analytics: false, priority_support: false },
  pro: { sms_notifications: true, email_summaries: true, custom_greeting: true, custom_voice: true, knowledge_base: true, business_hours: true, advanced_analytics: true, priority_support: false },
  growth: { sms_notifications: true, email_summaries: true, custom_greeting: true, custom_voice: true, knowledge_base: true, business_hours: true, advanced_analytics: true, priority_support: true },
};

const CLIENT_FEATURE_LABELS: Record<ClientFeatureKey, { title: string; description: string }> = {
  sms_notifications: { title: 'SMS Notifications', description: 'Receive text message alerts when calls come in.' },
  email_summaries: { title: 'Email Summaries', description: 'Get detailed email summaries after each call.' },
  custom_greeting: { title: 'Custom Greeting', description: 'Personalize the opening message your AI uses when answering calls.' },
  custom_voice: { title: 'Custom Voice', description: 'Choose from a variety of AI voices for your receptionist.' },
  knowledge_base: { title: 'Knowledge Base', description: 'Teach your AI about your services, pricing, and FAQs.' },
  business_hours: { title: 'Business Hours', description: 'Set your operating hours so your AI knows when you\'re available.' },
  advanced_analytics: { title: 'Advanced Analytics', description: 'Get deeper insights into call patterns and trends.' },
  priority_support: { title: 'Priority Support', description: 'Get faster response times from the support team.' },
};

// ============================================================================
// HELPERS
// ============================================================================

function isUsableBrandColor(hex: string | null | undefined): hex is string {
  if (!hex || hex.trim().length < 7) return false;
  const c = hex.trim().replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum < 0.12 || lum > 0.88) return false;
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === 0) return false;
  if ((max - min) / max < 0.15) return false;
  return true;
}

function isTrialStatus(status: string | null | undefined): boolean {
  return status === 'trial' || status === 'trialing';
}

function isTrialActive(client: Client | null): boolean {
  if (!client) return false;
  if (!isTrialStatus(client.subscription_status)) return false;
  if (!client.trial_ends_at) return false;
  return new Date(client.trial_ends_at) > new Date();
}

function getEffectivePlan(client: Client | null): string {
  if (!client) return 'starter';
  if (isTrialActive(client)) return 'growth';
  return client.plan_type || 'starter';
}

function buildBranding(c: any): Branding {
  const agency = c.agency;
  return {
    primaryColor:
      (isUsableBrandColor(c.primary_color) ? c.primary_color.trim() : null)
      || agency?.primary_color
      || '#3b82f6',
    secondaryColor:
      (isUsableBrandColor(c.secondary_color) ? c.secondary_color.trim() : null)
      || agency?.secondary_color
      || '#1e40af',
    accentColor:
      (isUsableBrandColor(c.accent_color) ? c.accent_color.trim() : null)
      || agency?.accent_color
      || '#60a5fa',
    agencyName: agency?.name || '',
    businessName: c.business_name || '',
    logoUrl: c.logo_url || agency?.logo_url || null,
    supportEmail: agency?.support_email || null,
    supportPhone: agency?.support_phone || null,
    websiteTheme: agency?.website_theme || 'dark',
    clientHeaderMode: agency?.client_header_mode || 'agency_name',
  };
}

// ============================================================================
// CONTEXT
// ============================================================================

interface ClientContextType {
  client: Client | null;
  user: User | null;
  branding: Branding;
  loading: boolean;
  refreshClient: () => Promise<void>;
  isFeatureEnabled: (feature: ClientFeatureKey) => boolean;
  getFeatureLabel: (feature: ClientFeatureKey) => { title: string; description: string };
  planType: string;
  effectivePlan: string;
  hasPermission: (key: string) => boolean;
}

// FIXED: agencyName was 'VoiceAI' which caused "V" initial to show during loading
const defaultBranding: Branding = {
  primaryColor: '#3b82f6', secondaryColor: '#1e40af', accentColor: '#60a5fa',
  agencyName: '', businessName: '', logoUrl: null,
  supportEmail: null, supportPhone: null, websiteTheme: 'dark', clientHeaderMode: 'agency_name',
};

const ClientContext = createContext<ClientContextType>({
  client: null, user: null, branding: defaultBranding, loading: true,
  refreshClient: async () => {},
  isFeatureEnabled: () => true,
  getFeatureLabel: (f) => CLIENT_FEATURE_LABELS[f] || { title: f, description: '' },
  planType: 'pro', effectivePlan: 'growth', hasPermission: () => true,
});

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) throw new Error('useClient must be used within a ClientProvider');
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

export function ClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Instant load from localStorage cache — no loading flash
  const [client, setClient] = useState<Client | null>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('client') : null;
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  const [branding, setBranding] = useState<Branding>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('client') : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.agency) return buildBranding(parsed);
      }
    } catch {}
    return defaultBranding;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('auth_token') : false;
      const hasCached = typeof window !== 'undefined' ? !!localStorage.getItem('client') : false;
      if (hasCached) return false;
      if (!hasToken) return false;
      return true;
    } catch { return true; }
  });

  const fetchClientData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const storedClient = localStorage.getItem('client');
      if (!token || !storedClient) { router.push('/client/login'); return; }

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
      if (!fetchedClient) { router.push('/client/login'); return; }

      setClient(fetchedClient);
      setBranding(buildBranding(fetchedClient));
      setLoading(false);

      try { localStorage.setItem('client', JSON.stringify(fetchedClient)); } catch {}

      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error('Error fetching client data:', error);
      if (!client) router.push('/client/login');
    }
  };

  useEffect(() => { fetchClientData(); }, []);

  const effectivePlan = getEffectivePlan(client);

  const isFeatureEnabled = useCallback((feature: ClientFeatureKey): boolean => {
    if (!client) return true;
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

  const hasPermission = useCallback((key: string): boolean => {
    if (!user) return false;
    if (user.role === 'client' || user.role === 'super_admin') return true;
    if (!user.permissions) return true;
    return user.permissions[key] !== false;
  }, [user]);

  return (
    <ClientContext.Provider value={{
      client, user, branding, loading,
      refreshClient: fetchClientData,
      isFeatureEnabled, getFeatureLabel,
      planType, effectivePlan, hasPermission,
    }}>
      <DynamicFavicon logoUrl={branding.logoUrl} primaryColor={branding.primaryColor} />
      {children}
    </ClientContext.Provider>
  );
}

export type { ClientFeatureKey, Client, Branding, User };
export { CLIENT_FEATURE_LABELS, DEFAULT_PLAN_FEATURES, isTrialStatus, isTrialActive };