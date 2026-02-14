'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Upload, Check, AlertCircle, ExternalLink,
  Palette, CreditCard, Building, Loader2, DollarSign,
  AlertTriangle, RefreshCw, Trash2, Sun, Moon, Monitor,
  Receipt, XCircle, Eye, Phone, Users, ChevronRight,
  Globe, ToggleLeft, ToggleRight, Info
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';
import BYOTSettings from '@/components/BYOTSettings';

type SettingsTab = 'profile' | 'branding' | 'pricing' | 'payments' | 'billing' | 'twilio' | 'demo';

interface StripeStatus {
  connected: boolean;
  account_id?: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted?: boolean;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function isTrialStatus(status: string | null | undefined): boolean {
  return status === 'trial' || status === 'trialing';
}

const PLAN_PRICING: Record<string, number> = {
  starter: 99,
  professional: 199,
  enterprise: 299,
};

// ============================================================================
// PLAN FEATURE GATING CONSTANTS
// ============================================================================
const DEFAULT_PLAN_FEATURES: Record<string, Record<string, boolean>> = {
  starter: {
    email_summaries: false,
    custom_greeting: false,
    custom_voice: false,
    knowledge_base: false,
    business_hours: false,
    advanced_analytics: false,
    priority_support: false,
  },
  pro: {
    email_summaries: true,
    custom_greeting: true,
    custom_voice: false,
    knowledge_base: true,
    business_hours: true,
    advanced_analytics: true,
    priority_support: false,
  },
  growth: {
    email_summaries: true,
    custom_greeting: true,
    custom_voice: true,
    knowledge_base: true,
    business_hours: true,
    advanced_analytics: true,
    priority_support: true,
  },
};

const FEATURE_LABELS: Record<string, { label: string; description: string }> = {
  email_summaries: {
    label: 'Email Summaries',
    description: 'Detailed email with call summary, transcript, and caller details',
  },
  custom_greeting: {
    label: 'Custom Greeting',
    description: 'Client can write their own AI opening message',
  },
  custom_voice: {
    label: 'Custom Voice',
    description: 'Client can choose from multiple AI voice options',
  },
  knowledge_base: {
    label: 'Knowledge Base',
    description: 'Client can upload business FAQs for the AI to reference',
  },
  business_hours: {
    label: 'Business Hours',
    description: 'Client can configure hours and after-hours behavior',
  },
  advanced_analytics: {
    label: 'Advanced Analytics',
    description: 'Detailed reporting beyond basic call counts',
  },
  priority_support: {
    label: 'Priority Support',
    description: 'Faster response times from your support team',
  },
};

const FEATURE_ORDER = [
  'email_summaries',
  'custom_greeting',
  'custom_voice',
  'knowledge_base',
  'business_hours',
  'advanced_analytics',
  'priority_support',
];

// ============================================================================
// FEATURE TOGGLE COMPONENT
// ============================================================================
function FeatureToggle({ 
  featureKey, 
  enabled, 
  onToggle, 
  theme 
}: { 
  featureKey: string; 
  enabled: boolean; 
  onToggle: () => void; 
  theme: any;
}) {
  const info = FEATURE_LABELS[featureKey];
  if (!info) return null;

  return (
    <div 
      className="flex items-center justify-between py-2.5 px-1 group"
    >
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-sm font-medium" style={{ color: enabled ? theme.text : theme.textMuted }}>
          {info.label}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
        style={{ 
          backgroundColor: enabled ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'),
        }}
      >
        <span
          className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
          style={{ 
            transform: enabled ? 'translate(22px, 4px)' : 'translate(4px, 4px)',
          }}
        />
      </button>
    </div>
  );
}

function AgencySettingsContent() {
  const { agency, user, branding, loading: contextLoading, refreshAgency, demoMode, toggleDemoMode } = useAgency();
  const theme = useTheme();
  const searchParams = useSearchParams();
  
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
  const validTabs: SettingsTab[] = ['profile', 'branding', 'pricing', 'payments', 'billing', 'twilio', 'demo'];
  
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    validTabs.includes(initialTab) ? initialTab : 'profile'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [disconnectingStripe, setDisconnectingStripe] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const [agencyName, setAgencyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#059669');
  const [accentColor, setAccentColor] = useState('#34d399');
  const [websiteTheme, setWebsiteTheme] = useState<'light' | 'dark' | 'auto'>('dark');
  
  const [priceStarter, setPriceStarter] = useState('49');
  const [pricePro, setPricePro] = useState('99');
  const [priceGrowth, setPriceGrowth] = useState('149');
  const [limitStarter, setLimitStarter] = useState('50');
  const [limitPro, setLimitPro] = useState('150');
  const [limitGrowth, setLimitGrowth] = useState('500');

  // Plan features state
  const [planFeatures, setPlanFeatures] = useState<Record<string, Record<string, boolean>>>(DEFAULT_PLAN_FEATURES);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

  const isOnTrial = isTrialStatus(agency?.subscription_status);
  const trialDaysLeft = agency?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(agency.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const planPrice = PLAN_PRICING[agency?.plan_type || 'starter'] || 99;

  useEffect(() => {
    if (agency) {
      setAgencyName(agency.name || '');
      setLogoUrl(agency.logo_url || '');
      setLogoPreview(agency.logo_url);
      setPrimaryColor(agency.primary_color || '#10b981');
      setSecondaryColor(agency.secondary_color || '#059669');
      setAccentColor(agency.accent_color || '#34d399');
      setWebsiteTheme(agency.website_theme || 'dark');
      setPriceStarter(((agency.price_starter || 4900) / 100).toString());
      setPricePro(((agency.price_pro || 9900) / 100).toString());
      setPriceGrowth(((agency.price_growth || 14900) / 100).toString());
      setLimitStarter((agency.limit_starter || 50).toString());
      setLimitPro((agency.limit_pro || 150).toString());
      setLimitGrowth((agency.limit_growth || 500).toString());
      setPlanFeatures((agency as any).plan_features || DEFAULT_PLAN_FEATURES);
    }
  }, [agency]);

  useEffect(() => {
    if (activeTab === 'payments' && agency?.id) {
      fetchStripeStatus();
    }
  }, [activeTab, agency?.id]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const fetchStripeStatus = async () => {
    if (!agency) return;
    setLoadingStripeStatus(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/connect/status/${agency.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch Stripe status:', err);
    } finally {
      setLoadingStripeStatus(false);
    }
  };

  const settingsTabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: Building },
    { id: 'branding' as SettingsTab, label: 'Branding', icon: Palette },
    { id: 'pricing' as SettingsTab, label: 'Pricing', icon: DollarSign },
    { id: 'payments' as SettingsTab, label: 'Payments', icon: CreditCard },
    { id: 'billing' as SettingsTab, label: 'Billing', icon: Receipt },
    { id: 'twilio' as SettingsTab, label: 'Twilio', icon: Globe },
    { id: 'demo' as SettingsTab, label: 'Demo Mode', icon: Eye },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        setLogoUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle a feature for a specific plan
  const toggleFeature = (plan: string, feature: string) => {
    setPlanFeatures(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        [feature]: !prev[plan]?.[feature],
      }
    }));
  };

  // Reset plan features to defaults
  const resetPlanFeatures = () => {
    setPlanFeatures(DEFAULT_PLAN_FEATURES);
  };

  const handleSave = async () => {
    if (!agency) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const token = localStorage.getItem('auth_token');
      const payload: any = {};
      
      if (activeTab === 'profile') {
        payload.name = agencyName;
        payload.logo_url = logoUrl;
      } else if (activeTab === 'branding') {
        payload.primary_color = primaryColor;
        payload.secondary_color = secondaryColor;
        payload.accent_color = accentColor;
        payload.website_theme = websiteTheme;
      } else if (activeTab === 'pricing') {
        payload.price_starter = Math.round(parseFloat(priceStarter) * 100);
        payload.price_pro = Math.round(parseFloat(pricePro) * 100);
        payload.price_growth = Math.round(parseFloat(priceGrowth) * 100);
        payload.limit_starter = parseInt(limitStarter);
        payload.limit_pro = parseInt(limitPro);
        payload.limit_growth = parseInt(limitGrowth);
        payload.plan_features = planFeatures;
      }

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      await refreshAgency();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleStripeConnect = async () => {
    if (!agency) return;
    setConnectingStripe(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/connect/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ agency_id: agency.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start Stripe onboarding');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Stripe');
      setConnectingStripe(false);
    }
  };

  const handleStripeDisconnect = async () => {
    if (!agency) return;
    if (!confirm('Disconnect Stripe? You won\'t receive payments until you reconnect.')) return;
    
    setDisconnectingStripe(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/connect/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disconnect Stripe');
      }

      await refreshAgency();
      setStripeStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Stripe');
    } finally {
      setDisconnectingStripe(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!agency) return;
    setPortalLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ agency_id: agency.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to open billing portal');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  const handleCancelTrial = async () => {
    if (!agency) return;
    setCancelLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ agency_id: agency.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      localStorage.removeItem('auth_token');
      localStorage.removeItem('agency');
      localStorage.removeItem('user');
      window.location.href = '/agency/login?canceled=true';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
      setCancelLoading(false);
      setShowCancelModal(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const getStripeStatusDisplay = () => {
    if (!stripeStatus?.connected && !agency?.stripe_account_id) {
      return { status: 'not_connected', label: 'Not Connected', color: theme.textMuted };
    }
    if (stripeStatus?.charges_enabled && stripeStatus?.payouts_enabled) {
      return { status: 'active', label: 'Active', color: '#34d399' };
    }
    if (stripeStatus?.connected || agency?.stripe_account_id) {
      return { status: 'restricted', label: 'Setup Incomplete', color: '#fbbf24' };
    }
    return { status: 'not_connected', label: 'Not Connected', color: theme.textMuted };
  };

  const stripeDisplay = getStripeStatusDisplay();

  const getSubscriptionDisplay = () => {
    const status = agency?.subscription_status;
    if (status === 'active') {
      return { label: 'Active', color: '#34d399', bgColor: 'rgba(52,211,153,0.1)' };
    }
    if (isTrialStatus(status)) {
      return { label: 'Trial', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)' };
    }
    if (status === 'past_due') {
      return { label: 'Past Due', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)' };
    }
    if (status === 'canceled' || status === 'cancelled') {
      return { label: 'Canceled', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)' };
    }
    return { label: status || 'Unknown', color: theme.textMuted, bgColor: theme.input };
  };

  const subscriptionDisplay = getSubscriptionDisplay();

  const demoFeatures = [
    { label: 'Dashboard', desc: '14 clients, $1,185 MRR, 847 total calls' },
    { label: 'Clients', desc: '14 realistic service businesses with plans & call data' },
    { label: 'Call History', desc: '10 calls with AI summaries, urgency levels, transcripts' },
    { label: 'Analytics', desc: 'Revenue charts, plan breakdown, payment history' },
    { label: 'Leads', desc: '8 leads across all pipeline stages with follow-ups' },
    { label: 'Referrals', desc: '3 referred agencies, commissions, payout history' },
  ];

  const dynamicStyles = `
    .agency-settings ::selection {
      background-color: ${theme.primary}40;
      color: inherit;
    }
    .agency-settings input:focus,
    .agency-settings select:focus,
    .agency-settings textarea:focus {
      outline: none;
      border-color: ${theme.primary} !important;
      box-shadow: 0 0 0 3px ${theme.primary}20 !important;
    }
  `;

  const previewIsDark = websiteTheme !== 'light';
  const previewBg = previewIsDark ? '#050505' : '#f9fafb';
  const previewText = previewIsDark ? '#fafaf9' : '#111827';
  const previewMuted = previewIsDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const previewCard = previewIsDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const previewBorder = previewIsDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const previewSidebar = previewIsDark ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const previewPrimaryText = isLightColor(primaryColor) ? '#050505' : '#ffffff';

  // Count enabled features per plan (for summary display)
  const getFeatureCount = (plan: string) => {
    const features = planFeatures[plan] || {};
    return Object.values(features).filter(Boolean).length;
  };

  return (
    <div className="agency-settings p-4 sm:p-6 lg:p-8">
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      
      {/* Cancel Trial Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !cancelLoading && setShowCancelModal(false)}
          />
          <div 
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{ 
              backgroundColor: theme.isDark ? '#0a0a0a' : '#ffffff',
              border: `1px solid ${theme.border}`,
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.errorBg }}
              >
                <AlertTriangle className="h-6 w-6" style={{ color: theme.errorText }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: theme.text }}>Cancel Trial?</h3>
                <p className="text-sm" style={{ color: theme.textMuted }}>This action cannot be undone.</p>
              </div>
            </div>

            <div 
              className="rounded-xl p-4 mb-6"
              style={{ backgroundColor: theme.errorBg }}
            >
              <p className="text-sm" style={{ color: theme.errorText }}>
                If you cancel now:
              </p>
              <ul className="mt-2 space-y-1 text-sm" style={{ color: theme.errorText }}>
                <li>• You'll lose access to your agency dashboard immediately</li>
                <li>• All client AI receptionists will be disabled</li>
                <li>• You won't be charged</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: theme.input, 
                  border: `1px solid ${theme.inputBorder}`,
                  color: theme.text,
                }}
              >
                Keep My Trial
              </button>
              <button
                onClick={handleCancelTrial}
                disabled={cancelLoading}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  'Yes, Cancel Trial'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>Manage your agency settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Settings Tabs */}
        <div className="lg:w-48 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab !== tab.id ? (theme.isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]') : ''
                }`}
                style={activeTab === tab.id ? {
                  backgroundColor: theme.primary15,
                  color: theme.primary,
                } : {
                  color: theme.textMuted,
                }}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'demo' && demoMode && (
                  <div 
                    className="w-2 h-2 rounded-full ml-auto flex-shrink-0"
                    style={{ backgroundColor: theme.primary }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 max-w-2xl">
          {error && (
            <div 
              className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
              style={{
                backgroundColor: theme.errorBg,
                border: `1px solid ${theme.errorBorder}`,
              }}
            >
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.errorText }} />
              <p className="text-sm" style={{ color: theme.errorText }}>{error}</p>
            </div>
          )}
          
          {saved && (
            <div 
              className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
              style={{
                backgroundColor: theme.primary15,
                border: `1px solid ${theme.primary30}`,
              }}
            >
              <Check className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.primary }} />
              <p className="text-sm" style={{ color: theme.primary }}>Settings saved!</p>
            </div>
          )}

          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ 
              backgroundColor: theme.card, 
              border: `1px solid ${theme.border}`,
              boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Agency Profile</h3>
                  <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Basic information about your agency.</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Agency Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors"
                    style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Logo</label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div 
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Building className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.textMuted }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${theme.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'}`}
                        style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </button>
                      <p className="mt-1.5 text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Slug</label>
                  <div className="rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>
                    {agency?.slug}
                  </div>
                  <p className="mt-1.5 text-[10px] sm:text-xs break-all" style={{ color: theme.textMuted }}>
                    URL: https://{agency?.slug}.{platformDomain}/signup
                  </p>
                </div>
              </div>
            )}

            {/* Branding Tab - same as original */}
            {activeTab === 'branding' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Dashboard Branding</h3>
                  <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                    These colors apply to your agency dashboard and client portal.
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Dashboard Style</label>
                  <p className="text-[10px] sm:text-xs mb-2" style={{ color: theme.textMuted }}>
                    Controls the background, text, and surface colors across your entire dashboard.
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun, desc: 'White backgrounds' },
                      { value: 'dark', label: 'Dark', icon: Moon, desc: 'Dark backgrounds' },
                      { value: 'auto', label: 'Auto', icon: Monitor, desc: 'System preference' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setWebsiteTheme(option.value as 'light' | 'dark' | 'auto')}
                        className="flex flex-col items-center gap-1.5 rounded-xl p-3 sm:p-4 transition-all"
                        style={websiteTheme === option.value ? {
                          backgroundColor: `${primaryColor}15`,
                          border: `2px solid ${primaryColor}`,
                        } : {
                          backgroundColor: theme.input,
                          border: `1px solid ${theme.inputBorder}`,
                        }}
                      >
                        <option.icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: websiteTheme === option.value ? primaryColor : theme.textMuted }} />
                        <span className="text-xs sm:text-sm font-medium" style={{ color: websiteTheme === option.value ? primaryColor : theme.text }}>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Primary Color', desc: 'Buttons, active nav items, badges, links, and icon backgrounds.', value: primaryColor, setter: setPrimaryColor },
                    { label: 'Secondary Color', desc: 'Hover states, gradient endpoints, and secondary button styles.', value: secondaryColor, setter: setSecondaryColor },
                    { label: 'Accent Color', desc: 'Highlights and emphasis on the marketing website.', value: accentColor, setter: setAccentColor },
                  ].map((color) => (
                    <div key={color.label}>
                      <label className="block text-xs sm:text-sm font-medium mb-0.5">{color.label}</label>
                      <p className="text-[10px] sm:text-xs mb-2" style={{ color: theme.textMuted }}>{color.desc}</p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input type="color" value={color.value} onChange={(e) => color.setter(e.target.value)} className="h-9 sm:h-10 w-12 sm:w-14 rounded cursor-pointer border-0 bg-transparent" />
                        <input type="text" value={color.value} onChange={(e) => color.setter(e.target.value)} className="flex-1 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-mono transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Preview */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Live Preview</label>
                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
                    <div className="flex" style={{ minHeight: '220px' }}>
                      <div className="w-[140px] sm:w-[160px] flex-shrink-0 p-3 space-y-1.5 hidden sm:block" style={{ backgroundColor: previewSidebar, borderRight: `1px solid ${previewBorder}` }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                            <Phone className="h-3 w-3" style={{ color: previewPrimaryText }} />
                          </div>
                          <span className="text-[10px] font-semibold truncate" style={{ color: previewText }}>{agencyName || 'Agency'}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ backgroundColor: `${primaryColor}15` }}>
                          <Users className="h-3 w-3" style={{ color: primaryColor }} />
                          <span className="text-[10px] font-medium" style={{ color: primaryColor }}>Clients</span>
                        </div>
                        {['Analytics', 'Settings'].map((item) => (
                          <div key={item} className="flex items-center gap-2 px-2 py-1.5">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: previewBorder }} />
                            <span className="text-[10px]" style={{ color: previewMuted }}>{item}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 p-3 sm:p-4 space-y-3" style={{ backgroundColor: previewBg }}>
                        <div className="rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: previewCard, border: `1px solid ${previewBorder}` }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                            <Users className="h-4 w-4" style={{ color: primaryColor }} />
                          </div>
                          <div>
                            <p className="text-[10px]" style={{ color: previewMuted }}>Total Clients</p>
                            <p className="text-sm font-semibold" style={{ color: previewText }}>24</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className="px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium" style={{ backgroundColor: primaryColor, color: previewPrimaryText }}>Primary Button</button>
                          <span className="px-2 py-1 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>Active Badge</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]" style={{ color: previewMuted }}>Link example:</span>
                          <span className="text-[10px] font-medium" style={{ color: primaryColor }}>View all clients →</span>
                        </div>
                        <div className="rounded-lg p-2.5 flex items-center justify-between" style={{ backgroundColor: previewCard, border: `1px solid ${previewBorder}` }}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-medium" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>A</div>
                            <div>
                              <p className="text-[10px] font-medium" style={{ color: previewText }}>Acme Plumbing</p>
                              <p className="text-[8px]" style={{ color: previewMuted }}>Pro plan</p>
                            </div>
                          </div>
                          <ChevronRight className="h-3 w-3" style={{ color: previewMuted }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================ */}
            {/* PRICING TAB - WITH PLAN FEATURE GATING                          */}
            {/* ================================================================ */}
            {activeTab === 'pricing' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Client Plans</h3>
                  <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Set pricing, call limits, and features for each plan your clients can choose.</p>
                </div>

                {/* Info banner */}
                <div 
                  className="rounded-xl p-3 sm:p-4 flex items-start gap-3"
                  style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}
                >
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} />
                  <div>
                    <p className="text-xs sm:text-sm" style={{ color: theme.infoText }}>
                      Every client gets the core AI receptionist (24/7 call answering, dedicated phone number, call history, recordings, and transcripts) regardless of plan. The features below are extras you can include or exclude per plan.
                    </p>
                  </div>
                </div>

                {/* Plan Cards */}
                <div className="space-y-4">
                  {[
                    { key: 'starter', label: 'Starter', price: priceStarter, setPrice: setPriceStarter, limit: limitStarter, setLimit: setLimitStarter, highlight: false },
                    { key: 'pro', label: 'Pro', price: pricePro, setPrice: setPricePro, limit: limitPro, setLimit: setLimitPro, highlight: true },
                    { key: 'growth', label: 'Growth', price: priceGrowth, setPrice: setPriceGrowth, limit: limitGrowth, setLimit: setLimitGrowth, highlight: false },
                  ].map((plan) => (
                    <div 
                      key={plan.key}
                      className="rounded-xl p-3 sm:p-4"
                      style={plan.highlight ? { 
                        backgroundColor: `${theme.primary}08`, 
                        border: `1px solid ${theme.primary30}` 
                      } : { 
                        backgroundColor: theme.input, 
                        border: `1px solid ${theme.inputBorder}` 
                      }}
                    >
                      {/* Plan Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm sm:text-base">{plan.label} Plan</h4>
                          {plan.highlight && (
                            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primary20, color: theme.primary }}>Popular</span>
                          )}
                        </div>
                        <span className="text-xs" style={{ color: theme.textMuted }}>
                          {getFeatureCount(plan.key)} features included
                        </span>
                      </div>

                      {/* Price & Calls */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div>
                          <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Price ($/mo)</label>
                          <input 
                            type="number" 
                            value={plan.price} 
                            onChange={(e) => plan.setPrice(e.target.value)} 
                            className="w-full rounded-xl px-3 py-2 text-sm" 
                            style={{ backgroundColor: theme.isDark ? '#050505' : plan.highlight ? '#ffffff' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }} 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Calls/mo</label>
                          <input 
                            type="number" 
                            value={plan.limit} 
                            onChange={(e) => plan.setLimit(e.target.value)} 
                            className="w-full rounded-xl px-3 py-2 text-sm" 
                            style={{ backgroundColor: theme.isDark ? '#050505' : plan.highlight ? '#ffffff' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }} 
                          />
                        </div>
                      </div>

                      {/* Feature Toggles */}
                      <div 
                        className="rounded-lg px-3 py-1"
                        style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                      >
                        <p className="text-[10px] sm:text-xs font-medium py-2" style={{ color: theme.textMuted }}>Included Features</p>
                        <div className="divide-y" style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                          {FEATURE_ORDER.map((featureKey) => (
                            <FeatureToggle
                              key={featureKey}
                              featureKey={featureKey}
                              enabled={planFeatures[plan.key]?.[featureKey] ?? false}
                              onToggle={() => toggleFeature(plan.key, featureKey)}
                              theme={theme}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reset to defaults */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={resetPlanFeatures}
                    className="text-xs transition-colors"
                    style={{ color: theme.textMuted }}
                  >
                    Reset features to defaults
                  </button>
                </div>
              </div>
            )}

            {/* Payments Tab - same as original */}
            {activeTab === 'payments' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Payment Settings</h3>
                  <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Connect Stripe to receive payments.</p>
                </div>

                <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center bg-[#635BFF] flex-shrink-0">
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">Stripe Connect</p>
                        <p className="text-xs sm:text-sm" style={{ color: stripeDisplay.color }}>{loadingStripeStatus ? 'Loading...' : stripeDisplay.label}</p>
                      </div>
                    </div>
                    {stripeDisplay.status === 'active' && <Check className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.primary }} />}
                    {stripeDisplay.status === 'restricted' && <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 flex-shrink-0" />}
                  </div>

                  {(stripeStatus?.connected || agency?.stripe_account_id) && (
                    <div className="mt-4 pt-4 space-y-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="flex items-center justify-between rounded-lg px-2 sm:px-3 py-1.5 sm:py-2" style={{ backgroundColor: theme.hover }}>
                          <span style={{ color: theme.textMuted }}>Charges</span>
                          {stripeStatus?.charges_enabled ? <span className="flex items-center gap-1" style={{ color: theme.primary }}><Check className="h-3 w-3" /> OK</span> : <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3 w-3" /> No</span>}
                        </div>
                        <div className="flex items-center justify-between rounded-lg px-2 sm:px-3 py-1.5 sm:py-2" style={{ backgroundColor: theme.hover }}>
                          <span style={{ color: theme.textMuted }}>Payouts</span>
                          {stripeStatus?.payouts_enabled ? <span className="flex items-center gap-1" style={{ color: theme.primary }}><Check className="h-3 w-3" /> OK</span> : <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="h-3 w-3" /> No</span>}
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs break-all" style={{ color: theme.textMuted }}>ID: {agency?.stripe_account_id}</p>
                      {stripeDisplay.status === 'restricted' && (
                        <div className="rounded-lg p-2 sm:p-3" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                          <p className="text-xs sm:text-sm" style={{ color: theme.warningText }}>Complete setup to receive payments.</p>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {stripeDisplay.status === 'restricted' && (
                          <button onClick={handleStripeConnect} disabled={connectingStripe} className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white transition-colors bg-[#635BFF] hover:bg-[#5851e6] disabled:opacity-50">
                            {connectingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                            Complete
                          </button>
                        )}
                        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${theme.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'}`} style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>
                          <ExternalLink className="h-4 w-4" />Dashboard
                        </a>
                        <button onClick={fetchStripeStatus} disabled={loadingStripeStatus} className={`inline-flex items-center justify-center rounded-xl p-2 transition-colors ${theme.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'}`} style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }} title="Refresh">
                          <RefreshCw className={`h-4 w-4 ${loadingStripeStatus ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {stripeDisplay.status === 'not_connected' && (
                    <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
                      <button onClick={handleStripeConnect} disabled={connectingStripe} className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-colors bg-[#635BFF] hover:bg-[#5851e6] disabled:opacity-50">
                        {connectingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                        Connect Stripe
                      </button>
                      <p className="mt-2 text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>You'll be redirected to Stripe.</p>
                    </div>
                  )}
                </div>

                {(stripeStatus?.connected || agency?.stripe_account_id) && (
                  <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm" style={{ color: theme.errorText }}>Disconnect Stripe</p>
                        <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>You won't receive payments until reconnected.</p>
                      </div>
                      <button onClick={handleStripeDisconnect} disabled={disconnectingStripe} className="inline-flex items-center justify-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}`, color: theme.errorText }}>
                        {disconnectingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Billing Tab - same as original */}
            {activeTab === 'billing' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Subscription & Billing</h3>
                  <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Manage your VoiceAI Connect subscription.</p>
                </div>

                <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm" style={{ color: theme.textMuted }}>Current Plan</p>
                      <p className="text-xl sm:text-2xl font-semibold capitalize mt-1">{agency?.plan_type || 'Starter'}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: subscriptionDisplay.bgColor, color: subscriptionDisplay.color }}>{subscriptionDisplay.label}</span>
                  </div>

                  {isOnTrial && trialDaysLeft !== null && (
                    <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" style={{ color: theme.infoText }} />
                        <p className="text-sm font-medium" style={{ color: theme.infoText }}>{trialDaysLeft} days left in trial</p>
                      </div>
                      <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Your card will be charged automatically on {agency?.trial_ends_at ? new Date(agency.trial_ends_at).toLocaleDateString() : 'trial end'}.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg px-3 py-2" style={{ backgroundColor: theme.hover }}>
                      <p className="text-xs" style={{ color: theme.textMuted }}>Price</p>
                      <p className="font-medium">${planPrice}/mo</p>
                    </div>
                    <div className="rounded-lg px-3 py-2" style={{ backgroundColor: theme.hover }}>
                      <p className="text-xs" style={{ color: theme.textMuted }}>Status</p>
                      <p className="font-medium capitalize">{agency?.subscription_status || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
                    <button onClick={handleManageSubscription} disabled={portalLoading} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                      {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      Manage Subscription
                    </button>
                    <p className="mt-2 text-xs" style={{ color: theme.textMuted }}>Update payment method, view invoices, or change plan.</p>
                  </div>
                </div>

                {isOnTrial && (
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm" style={{ color: theme.errorText }}>Cancel Trial</p>
                        <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>You'll lose access immediately and won't be charged.</p>
                      </div>
                      <button onClick={() => setShowCancelModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors flex-shrink-0" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}`, color: theme.errorText }}>
                        <XCircle className="h-4 w-4" />
                        Cancel Trial
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Twilio / BYOT Tab */}
            {activeTab === 'twilio' && (
              <BYOTSettings
                agencyId={agency?.id || ''}
                planType={agency?.plan_type || 'starter'}
                subscriptionStatus={agency?.subscription_status || ''}
                theme={theme}
              />
            )}

            {/* Demo Mode Tab - same as original */}
            {activeTab === 'demo' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: demoMode ? theme.primary15 : theme.hover }}
                    >
                      <Eye className="h-5 w-5" style={{ color: demoMode ? theme.primary : theme.textMuted }} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-medium">Demo Mode</h3>
                      <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                        Preview your dashboard with realistic sample data
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={toggleDemoMode}
                    className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
                    style={{ 
                      backgroundColor: demoMode ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'),
                    }}
                  >
                    <span
                      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
                      style={{ 
                        transform: demoMode ? 'translate(22px, 4px)' : 'translate(4px, 4px)',
                      }}
                    />
                  </button>
                </div>

                <div 
                  className="rounded-xl px-4 py-3 flex items-center gap-2"
                  style={{ 
                    backgroundColor: demoMode ? `${theme.primary}10` : theme.hover,
                    border: `1px solid ${demoMode ? theme.primary30 : theme.border}`,
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: demoMode ? theme.primary : theme.textMuted }}
                  />
                  <span className="text-sm font-medium" style={{ color: demoMode ? theme.primary : theme.textMuted }}>
                    {demoMode ? 'Demo mode is active — all pages show sample data' : 'Demo mode is off — showing your real data'}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-3">What demo mode shows</h4>
                  <div className="space-y-2.5">
                    {demoFeatures.map((f) => (
                      <div key={f.label} className="flex items-start gap-3">
                        <div 
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div>
                          <span className="text-sm font-medium">{f.label}</span>
                          <span className="text-sm ml-2" style={{ color: theme.textMuted }}>{f.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div 
                  className="rounded-xl p-4 flex items-start gap-3"
                  style={{ 
                    backgroundColor: theme.infoBg,
                    border: `1px solid ${theme.infoBorder}`,
                  }}
                >
                  <div className="mt-0.5 text-lg flex-shrink-0" style={{ color: theme.infoText }}>ℹ</div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.infoText }}>Display only</p>
                    <p className="text-sm" style={{ color: theme.textMuted }}>
                      Demo mode only changes what you see. It doesn't affect your real data, clients, or billing. 
                      Toggle it off anytime from the sidebar or this page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            {activeTab !== 'payments' && activeTab !== 'billing' && activeTab !== 'twilio' && activeTab !== 'demo' && (
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 flex justify-end" style={{ borderTop: `1px solid ${theme.border}` }}>
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto justify-center" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Check className="h-4 w-4" />Save Changes</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );
}

export default function AgencySettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <AgencySettingsContent />
    </Suspense>
  );
}