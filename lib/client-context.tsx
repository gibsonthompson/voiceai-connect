'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DynamicFavicon from '@/components/DynamicFavicon';

function isUsableBrandColor(hex: string | null | undefined): hex is string {
  if (!hex || hex.length < 7) return false;
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.12) return false;
  if (luminance > 0.88) return false;
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation < 0.15) return false;
  return true;
}

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
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  branding_overrides?: {
    nav_bg?: string;
    nav_text?: string;
    button_text?: string;
    page_bg?: string;
    card_bg?: string;
    card_border?: string;
    text_primary?: string;
    text_muted?: string;
    theme?: 'light' | 'dark';
  } | null;
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

function buildBranding(fetchedClient: any): Branding {
  const agency = fetchedClient.agency;
  const clientPrimary = isUsableBrandColor(fetchedClient.primary_color) ? fetchedClient.primary_color : null;
  const clientSecondary = isUsableBrandColor(fetchedClient.secondary_color) ? fetchedClient.secondary_color : null;
  const clientAccent = isUsableBrandColor(fetchedClient.accent_color) ? fetchedClient.accent_color : null;

  return {
    primaryColor: clientPrimary || agency?.primary_color || '#3b82f6',
    secondaryColor: clientSecondary || agency?.secondary_color || '#1e40af',
    accentColor: clientAccent || agency?.accent_color || '#60a5fa',
    agencyName: agency?.name || 'VoiceAI',
    businessName: fetchedClient.business_name || '',
    logoUrl: fetchedClient.logo_url || agency?.logo_url || null,
    supportEmail: agency?.support_email || null,
    supportPhone: agency?.support_phone || null,
    websiteTheme: agency?.website_theme || 'dark',
    clientHeaderMode: agency?.client_header_mode || 'agency_name',
  };
}

// ============================================================================
// AUTO-DERIVE NAV COLORS FROM PRIMARY
// If client has their own primary_color, inject nav_bg, nav_text, button_text
// into branding_overrides IN MEMORY so the theme hook picks them up.
// Manual overrides are NOT replaced.
// ============================================================================
function darkenHex(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getContrastText(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#111827' : '#ffffff';
}

function injectDerivedOverrides(clientObj: any): any {
  if (!clientObj) return clientObj;
  const primary = clientObj.primary_color;
  if (!isUsableBrandColor(primary)) return clientObj;

  const existing = clientObj.branding_overrides || {};
  const derivedNavBg = darkenHex(primary, 0.65);

  clientObj.branding_overrides = {
    nav_bg: existing.nav_bg || derivedNavBg,
    nav_text: existing.nav_text || getContrastText(derivedNavBg),
    button_text: existing.button_text || getContrastText(primary),
    // Preserve any other manual overrides
    ...(existing.page_bg ? { page_bg: existing.page_bg } : {}),
    ...(existing.card_bg ? { card_bg: existing.card_bg } : {}),
    ...(existing.card_border ? { card_border: existing.card_border } : {}),
    ...(existing.theme ? { theme: existing.theme } : {}),
    ...(existing.text_primary ? { text_primary: existing.text_primary } : {}),
    ...(existing.text_muted ? { text_muted: existing.text_muted } : {}),
  };

  return clientObj;
}

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

const defaultBranding: Branding = {
  primaryColor: '#3b82f6', secondaryColor: '#1e40af', accentColor: '#60a5fa',
  agencyName: 'VoiceAI', businessName: '', logoUrl: null,
  supportEmail: null, supportPhone: null, websiteTheme: 'dark', clientHeaderMode: 'agency_name',
};

const ClientContext = createContext<ClientContextType>({
  client: null, user: null, branding: defaultBranding, loading: true,
  refreshClient: async () => {}, isFeatureEnabled: () => true,
  getFeatureLabel: (f) => CLIENT_FEATURE_LABELS[f] || { title: f, description: '' },
  planType: 'pro', effectivePlan: 'growth', hasPermission: () => true,
});

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) throw new Error('useClient must be used within a ClientProvider');
  return context;
}

export function ClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // ========================================================================
  // INSTANT LOAD: Use cached client data from localStorage immediately.
  // No loading screen. Page renders with cached data, then silently refreshes.
  // ========================================================================
  const [client, setClient] = useState<Client | null>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('client') : null;
      return cached ? injectDerivedOverrides(JSON.parse(cached)) : null;
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
        const parsed = injectDerivedOverrides(JSON.parse(cached));
        if (parsed.agency) return buildBranding(parsed);
      }
    } catch {}
    return defaultBranding;
  });

  // loading = true ONLY if we have no cached data at all (first ever visit)
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('auth_token') : false;
      const hasCached = typeof window !== 'undefined' ? !!localStorage.getItem('client') : false;
      // If we have cached data, don't show loading
      if (hasCached) return false;
      // If no token at all, don't show loading (will redirect)
      if (!hasToken) return false;
      // Token but no cache = first load, show loading
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
      const response = await fetch(`${backendUrl}/api/client/${clientData.id}`, { headers: { 'Authorization': `Bearer ${token}` } });

      if (!response.ok) {
        localStorage.removeItem('auth_token'); localStorage.removeItem('client'); localStorage.removeItem('user');
        router.push('/client/login'); return;
      }

      const data = await response.json();
      const fetchedClient = injectDerivedOverrides(data.client);
      if (!fetchedClient) { router.push('/client/login'); return; }

      // Update state with fresh data
      setClient(fetchedClient);
      setBranding(buildBranding(fetchedClient));
      setLoading(false);

      // Update localStorage cache for next visit
      try { localStorage.setItem('client', JSON.stringify(fetchedClient)); } catch {}

      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error('Error fetching client data:', error);
      // If we have cached data, keep showing it. Only redirect if no cache.
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
      client, user, branding, loading, refreshClient: fetchClientData,
      isFeatureEnabled, getFeatureLabel, planType, effectivePlan, hasPermission,
    }}>
      <DynamicFavicon logoUrl={branding.logoUrl} primaryColor={branding.primaryColor} />
      {children}
    </ClientContext.Provider>
  );
}

export type { ClientFeatureKey, Client, Branding, User };
export { CLIENT_FEATURE_LABELS, DEFAULT_PLAN_FEATURES, isTrialStatus, isTrialActive };