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
  marketing_template: string | null;
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
  effectivePlan: 'free',
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

// Hard wipe everything in localStorage so nothing leaks across sessions or
// across an account switch in the same browser. Tolerates Safari/private
// mode where localStorage can throw.
function wipeSession() {
  try { localStorage.clear(); } catch {}
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

  // ────────────────────────────────────────────────────────────────────
  // fetchAgencyData
  //
  // The previous version of this function pre-rendered the dashboard from
  // localStorage and only THEN fetched fresh data. That was the source of
  // the "blackout after login" bug: if a previous session in the same
  // browser left behind another agency's JSON (or this same agency's row
  // from before a plan change), the layout's gates, branding, theme, and
  // child fetches all ran against stale or wrong-account data for the
  // ~200ms before the backend response landed. In the worst case, child
  // components fired requests for the WRONG agency id, errored out, and
  // tore down the page tree (the locked-screen symptom).
  //
  // The fix has three parts:
  //   1. Only pre-render from cache when the cached agency.id matches the
  //      current session's user.agency_id. Otherwise the cache is from a
  //      different account — drop it and wait for the backend.
  //   2. Always fetch using user.agency_id (the value tied to the current
  //      token), never the cached agency.id, so a stale cache can't even
  //      direct the request at the wrong row.
  //   3. On any auth failure / load error with no trustworthy cache, wipe
  //      ALL localStorage (not just three keys) and bounce to login. The
  //      old removeItem-of-three-specific-keys approach left behind every
  //      other per-session value any component had ever written, which is
  //      how the leftover Pro-plan state survived into a new Free session.
  // ────────────────────────────────────────────────────────────────────
  const fetchAgencyData = async () => {
    let cacheMatchesSession = false;

    try {
      const token = localStorage.getItem('auth_token');
      const storedUserRaw = localStorage.getItem('user');

      if (!token || !storedUserRaw) {
        wipeSession();
        window.location.href = '/agency/login';
        return;
      }

      let storedUser: User;
      try {
        storedUser = JSON.parse(storedUserRaw);
      } catch {
        wipeSession();
        window.location.href = '/agency/login';
        return;
      }

      if (!storedUser || !storedUser.agency_id) {
        wipeSession();
        window.location.href = '/agency/login';
        return;
      }

      setUser(storedUser);

      // ── Stale-cache guard ─────────────────────────────────────────────
      // Only paint from the cached agency JSON when it belongs to the same
      // account as the current token. Anything else is from a different
      // session and would cause the cross-account blackout described above.
      const storedAgencyRaw = localStorage.getItem('agency');
      if (storedAgencyRaw) {
        try {
          const cached = JSON.parse(storedAgencyRaw);
          if (cached?.id && cached.id === storedUser.agency_id) {
            cacheMatchesSession = true;
            setAgency(cached);
            setBranding(buildBranding(cached));
            setLoading(false);
          } else {
            // Cache is for a different agency — discard before rendering.
            localStorage.removeItem('agency');
          }
        } catch {
          localStorage.removeItem('agency');
        }
      }

      // Always pull fresh data so plan changes, status changes, and
      // post-checkout webhook updates are reflected on this render —
      // never let the dashboard live on cached billing state.
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(
        `${backendUrl}/api/agency/${storedUser.agency_id}/settings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        // Token rejected, agency missing, or anything else server-side.
        // Anything less than a full wipe risks leaving behind another
        // user's JSON the next render can latch onto.
        wipeSession();
        window.location.href = '/agency/login';
        return;
      }

      const data = await response.json();
      const freshAgency = data.agency;

      if (freshAgency) {
        setAgency(freshAgency);
        setBranding(buildBranding(freshAgency));
        try { localStorage.setItem('agency', JSON.stringify(freshAgency)); } catch {}
      }

      if (!cacheMatchesSession) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching agency data:', error);
      // Network blip with a session-matched cache → keep the cached view
      // so a transient failure doesn't kick a logged-in user. No safe
      // cache → wipe and bounce so they can't see another account's data.
      if (!cacheMatchesSession) {
        wipeSession();
        window.location.href = '/agency/login';
      } else {
        setLoading(false);
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

  const effectivePlan = isTrialActive ? 'scale' : (agency?.plan_type || 'free');

  // Free plan = full VoiceAI Connect branding (name, colors, logo)
  // Pro/Scale = agency's own branding
  const resolvedBranding = effectivePlan === 'free'
    ? defaultBranding
    : branding;

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
      branding: resolvedBranding,
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