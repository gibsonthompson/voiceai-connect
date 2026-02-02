'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Upload, Check, AlertCircle, ExternalLink,
  Palette, CreditCard, Building, Loader2, DollarSign,
  AlertTriangle, RefreshCw, Trash2, Sun, Moon, Monitor,
  Receipt, XCircle
} from 'lucide-react';
import { useAgency } from '../context';

type SettingsTab = 'profile' | 'branding' | 'pricing' | 'payments' | 'billing';

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

// Helper to check if subscription is in trial state
function isTrialStatus(status: string | null | undefined): boolean {
  return status === 'trial' || status === 'trialing';
}

export default function AgencySettingsPage() {
  const { agency, user, branding, loading: contextLoading, refreshAgency } = useAgency();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [disconnectingStripe, setDisconnectingStripe] = useState(false);

  // Billing state
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';

  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';

  // Trial calculations
  const isOnTrial = isTrialStatus(agency?.subscription_status);
  const trialDaysLeft = agency?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(agency.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

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
    }
  }, [agency]);

  useEffect(() => {
    if (activeTab === 'payments' && agency?.id) {
      fetchStripeStatus();
    }
  }, [activeTab, agency?.id]);

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

  // FIXED: Changed from /api/agency/billing/portal to /api/agency/portal
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

  // FIXED: Changed from /api/agency/billing/cancel to /api/agency/cancel
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

      // Clear auth and redirect
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
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: branding.primaryColor }} />
      </div>
    );
  }

  const getStripeStatusDisplay = () => {
    if (!stripeStatus?.connected && !agency?.stripe_account_id) {
      return { status: 'not_connected', label: 'Not Connected', color: mutedTextColor };
    }
    if (stripeStatus?.charges_enabled && stripeStatus?.payouts_enabled) {
      return { status: 'active', label: 'Active', color: '#34d399' };
    }
    if (stripeStatus?.connected || agency?.stripe_account_id) {
      return { status: 'restricted', label: 'Setup Incomplete', color: '#fbbf24' };
    }
    return { status: 'not_connected', label: 'Not Connected', color: mutedTextColor };
  };

  const stripeDisplay = getStripeStatusDisplay();
  const primaryColorValue = branding.primaryColor || '#10b981';

  // Get subscription status display
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
    return { label: status || 'Unknown', color: mutedTextColor, bgColor: inputBg };
  };

  const subscriptionDisplay = getSubscriptionDisplay();

  // Dynamic styles for selection and focus - uses agency primary color
  const dynamicStyles = `
    .agency-settings ::selection {
      background-color: ${primaryColorValue}40;
      color: inherit;
    }
    .agency-settings ::-moz-selection {
      background-color: ${primaryColorValue}40;
      color: inherit;
    }
    .agency-settings input:focus,
    .agency-settings select:focus,
    .agency-settings textarea:focus {
      outline: none;
      border-color: ${primaryColorValue} !important;
      box-shadow: 0 0 0 3px ${primaryColorValue}20 !important;
    }
    .agency-settings input::selection,
    .agency-settings textarea::selection {
      background-color: ${primaryColorValue}40;
    }
  `;

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
              backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
              border: `1px solid ${borderColor}`,
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
              >
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: textColor }}>Cancel Trial?</h3>
                <p className="text-sm" style={{ color: mutedTextColor }}>This action cannot be undone.</p>
              </div>
            </div>

            <div 
              className="rounded-xl p-4 mb-6"
              style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.05)' : '#fef2f2' }}
            >
              <p className="text-sm" style={{ color: isDark ? '#fca5a5' : '#991b1b' }}>
                If you cancel now:
              </p>
              <ul className="mt-2 space-y-1 text-sm" style={{ color: isDark ? 'rgba(252,165,165,0.8)' : '#b91c1c' }}>
                <li>• You'll lose access to your agency dashboard immediately</li>
                <li>• All client AI receptionists will be disabled</li>
                <li>• You won't be charged</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'
                }`}
                style={{ 
                  backgroundColor: inputBg, 
                  border: `1px solid ${inputBorder}`,
                  color: textColor,
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
        <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>Manage your agency settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Settings Tabs */}
        <div className="lg:w-48 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  !activeTab || activeTab !== tab.id
                    ? (isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]')
                    : ''
                }`}
                style={activeTab === tab.id ? {
                  backgroundColor: `${primaryColorValue}15`,
                  color: primaryColorValue,
                } : {
                  color: mutedTextColor,
                }}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 max-w-2xl">
          {/* Error/Success Messages */}
          {error && (
            <div 
              className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
              style={{
                backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
              }}
            >
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
              <p className="text-sm" style={{ color: isDark ? '#f87171' : '#dc2626' }}>{error}</p>
            </div>
          )}
          
          {saved && (
            <div 
              className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
              style={{
                backgroundColor: `${primaryColorValue}15`,
                border: `1px solid ${primaryColorValue}30`,
              }}
            >
              <Check className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: primaryColorValue }} />
              <p className="text-sm" style={{ color: primaryColorValue }}>Settings saved!</p>
            </div>
          )}

          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ 
              backgroundColor: cardBg, 
              border: `1px solid ${borderColor}`,
              boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Agency Profile</h3>
                  <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>Basic information about your agency.</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Agency Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors"
                    style={{ 
                      backgroundColor: inputBg, 
                      border: `1px solid ${inputBorder}`,
                      color: textColor,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Logo</label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div 
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Building className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: mutedTextColor }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                          isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'
                        }`}
                        style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </button>
                      <p className="mt-1.5 text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Slug</label>
                  <div 
                    className="rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: mutedTextColor }}
                  >
                    {agency?.slug}
                  </div>
                  <p className="mt-1.5 text-[10px] sm:text-xs break-all" style={{ color: mutedTextColor }}>
                    URL: https://{agency?.slug}.{platformDomain}/signup
                  </p>
                </div>
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Brand Colors</h3>
                  <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>Customize your client portal colors.</p>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Theme Mode</label>
                  <p className="text-xs mb-3" style={{ color: mutedTextColor }}>
                    Choose the color scheme for your dashboard and client-facing pages.
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'auto', label: 'Auto', icon: Monitor },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setWebsiteTheme(option.value as 'light' | 'dark' | 'auto')}
                        className={`flex flex-col items-center gap-2 rounded-xl p-3 sm:p-4 transition-all ${
                          websiteTheme === option.value ? '' : (isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]')
                        }`}
                        style={websiteTheme === option.value ? {
                          backgroundColor: `${primaryColorValue}15`,
                          border: `2px solid ${primaryColorValue}`,
                        } : {
                          backgroundColor: inputBg,
                          border: `1px solid ${inputBorder}`,
                        }}
                      >
                        <option.icon 
                          className="h-5 w-5 sm:h-6 sm:w-6" 
                          style={{ color: websiteTheme === option.value ? primaryColorValue : mutedTextColor }} 
                        />
                        <span 
                          className="text-xs sm:text-sm font-medium"
                          style={{ color: websiteTheme === option.value ? primaryColorValue : textColor }}
                        >
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {[
                    { label: 'Primary', value: primaryColor, setter: setPrimaryColor },
                    { label: 'Secondary', value: secondaryColor, setter: setSecondaryColor },
                    { label: 'Accent', value: accentColor, setter: setAccentColor },
                  ].map((color) => (
                    <div key={color.label}>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">{color.label} Color</label>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <input
                          type="color"
                          value={color.value}
                          onChange={(e) => color.setter(e.target.value)}
                          className="h-9 sm:h-10 w-12 sm:w-14 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={color.value}
                          onChange={(e) => color.setter(e.target.value)}
                          className="flex-1 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-mono transition-colors"
                          style={{ 
                            backgroundColor: inputBg, 
                            border: `1px solid ${inputBorder}`,
                            color: textColor,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Preview</label>
                  <div 
                    className="rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
                  >
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors"
                        style={{ backgroundColor: primaryColor, color: isLightColor(primaryColor) ? '#0a0a0a' : '#fff' }}
                      >
                        Primary
                      </button>
                      <button 
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors"
                        style={{ backgroundColor: secondaryColor, color: isLightColor(secondaryColor) ? '#0a0a0a' : '#fff' }}
                      >
                        Secondary
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm">
                      An <span style={{ color: accentColor }} className="font-medium">accent link</span> example
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Client Pricing</h3>
                  <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>Set prices and limits for your plans.</p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {/* Starter Plan */}
                  <div 
                    className="rounded-xl p-3 sm:p-4"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
                  >
                    <h4 className="font-medium text-sm sm:text-base mb-2 sm:mb-3">Starter Plan</h4>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] sm:text-sm mb-1" style={{ color: mutedTextColor }}>Price ($)</label>
                        <input
                          type="number"
                          value={priceStarter}
                          onChange={(e) => setPriceStarter(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm"
                          style={{ 
                            backgroundColor: isDark ? '#050505' : '#f9fafb', 
                            border: `1px solid ${inputBorder}`,
                            color: textColor,
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-sm mb-1" style={{ color: mutedTextColor }}>Calls</label>
                        <input
                          type="number"
                          value={limitStarter}
                          onChange={(e) => setLimitStarter(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm"
                          style={{ 
                            backgroundColor: isDark ? '#050505' : '#f9fafb', 
                            border: `1px solid ${inputBorder}`,
                            color: textColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div 
                    className="rounded-xl p-3 sm:p-4"
                    style={{ 
                      backgroundColor: `${primaryColorValue}08`,
                      border: `1px solid ${primaryColorValue}30`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <h4 className="font-medium text-sm sm:text-base">Pro Plan</h4>
                      <span 
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${primaryColorValue}20`, color: primaryColorValue }}
                      >
                        Popular
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] sm:text-sm mb-1" style={{ color: mutedTextColor }}>Price ($)</label>
                        <input
                          type="number"
                          value={pricePro}
                          onChange={(e) => setPricePro(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm"
                          style={{ 
                            backgroundColor: isDark ? '#050505' : '#ffffff', 
                            border: `1px solid ${inputBorder}`,
                            color: textColor,
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-sm mb-1" style={{ color: mutedTextColor }}>Calls</label>
                        <input
                          type="number"
                          value={limitPro}
                          onChange={(e) => setLimitPro(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm"
                          style={{ 
                            backgroundColor: isDark ? '#050505' : '#ffffff', 
                            border: `1px solid ${inputBorder}`,
                            color: textColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Growth Plan */}
                  <div 
                    className="rounded-xl p-3 sm:p-4"
                    style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
                  >
                    <h4 className="font-medium text-sm sm:text-base mb-2 sm:mb-3">Growth Plan</h4>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] sm:text-sm mb-1" style={{ color: mutedTextColor }}>Price ($)</label>
                        <input
                          type="number"
                          value={priceGrowth}
                          onChange={(e) => setPriceGrowth(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm"
                          style={{ 
                            backgroundColor: isDark ? '#050505' : '#f9fafb', 
                            border: `1px solid ${inputBorder}`,
                            color: textColor,
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-sm mb-1" style={{ color: mutedTextColor }}>Calls</label>
                        <input
                          type="number"
                          value={limitGrowth}
                          onChange={(e) => setLimitGrowth(e.target.value)}
                          className="w-full rounded-xl px-3 py-2 text-sm"
                          style={{ 
                            backgroundColor: isDark ? '#050505' : '#f9fafb', 
                            border: `1px solid ${inputBorder}`,
                            color: textColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Payment Settings</h3>
                  <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>Connect Stripe to receive payments.</p>
                </div>

                {/* Stripe Connect Card */}
                <div 
                  className="rounded-xl p-4 sm:p-5"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center bg-[#635BFF] flex-shrink-0">
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">Stripe Connect</p>
                        <p className="text-xs sm:text-sm" style={{ color: stripeDisplay.color }}>
                          {loadingStripeStatus ? 'Loading...' : stripeDisplay.label}
                        </p>
                      </div>
                    </div>
                    
                    {stripeDisplay.status === 'active' && (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: primaryColorValue }} />
                    )}
                    {stripeDisplay.status === 'restricted' && (
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 flex-shrink-0" />
                    )}
                  </div>

                  {(stripeStatus?.connected || agency?.stripe_account_id) && (
                    <div className="mt-4 pt-4 space-y-3" style={{ borderTop: `1px solid ${borderColor}` }}>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div 
                          className="flex items-center justify-between rounded-lg px-2 sm:px-3 py-1.5 sm:py-2"
                          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}
                        >
                          <span style={{ color: mutedTextColor }}>Charges</span>
                          {stripeStatus?.charges_enabled ? (
                            <span className="flex items-center gap-1" style={{ color: primaryColorValue }}>
                              <Check className="h-3 w-3" /> OK
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400">
                              <AlertTriangle className="h-3 w-3" /> No
                            </span>
                          )}
                        </div>
                        <div 
                          className="flex items-center justify-between rounded-lg px-2 sm:px-3 py-1.5 sm:py-2"
                          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}
                        >
                          <span style={{ color: mutedTextColor }}>Payouts</span>
                          {stripeStatus?.payouts_enabled ? (
                            <span className="flex items-center gap-1" style={{ color: primaryColorValue }}>
                              <Check className="h-3 w-3" /> OK
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400">
                              <AlertTriangle className="h-3 w-3" /> No
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[10px] sm:text-xs break-all" style={{ color: mutedTextColor }}>
                        ID: {agency?.stripe_account_id}
                      </p>

                      {stripeDisplay.status === 'restricted' && (
                        <div 
                          className="rounded-lg p-2 sm:p-3"
                          style={{
                            backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.2)',
                          }}
                        >
                          <p className="text-xs sm:text-sm text-amber-400">
                            Complete setup to receive payments.
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {stripeDisplay.status === 'restricted' && (
                          <button
                            onClick={handleStripeConnect}
                            disabled={connectingStripe}
                            className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white transition-colors bg-[#635BFF] hover:bg-[#5851e6] disabled:opacity-50"
                          >
                            {connectingStripe ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                            Complete
                          </button>
                        )}
                        
                        <a 
                          href="https://dashboard.stripe.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                            isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'
                          }`}
                          style={{ 
                            backgroundColor: inputBg, 
                            border: `1px solid ${inputBorder}`,
                            color: isDark ? 'rgba(250,250,249,0.7)' : '#374151',
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Dashboard
                        </a>

                        <button
                          onClick={fetchStripeStatus}
                          disabled={loadingStripeStatus}
                          className={`inline-flex items-center justify-center rounded-xl p-2 transition-colors ${
                            isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'
                          }`}
                          style={{ 
                            backgroundColor: inputBg, 
                            border: `1px solid ${inputBorder}`,
                            color: mutedTextColor,
                          }}
                          title="Refresh"
                        >
                          <RefreshCw className={`h-4 w-4 ${loadingStripeStatus ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {stripeDisplay.status === 'not_connected' && (
                    <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                      <button
                        onClick={handleStripeConnect}
                        disabled={connectingStripe}
                        className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-colors bg-[#635BFF] hover:bg-[#5851e6] disabled:opacity-50"
                      >
                        {connectingStripe ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        Connect Stripe
                      </button>
                      <p className="mt-2 text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>
                        You'll be redirected to Stripe.
                      </p>
                    </div>
                  )}
                </div>

                {/* Disconnect Option */}
                {(stripeStatus?.connected || agency?.stripe_account_id) && (
                  <div 
                    className="rounded-xl p-3 sm:p-4"
                    style={{
                      backgroundColor: isDark ? 'rgba(239,68,68,0.02)' : '#fef2f2',
                      border: isDark ? '1px solid rgba(239,68,68,0.1)' : '1px solid #fecaca',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm" style={{ color: isDark ? '#f87171' : '#dc2626' }}>Disconnect Stripe</p>
                        <p className="text-xs mt-0.5" style={{ color: mutedTextColor }}>
                          You won't receive payments until reconnected.
                        </p>
                      </div>
                      <button
                        onClick={handleStripeDisconnect}
                        disabled={disconnectingStripe}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                        style={{
                          backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)',
                          border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(239,68,68,0.2)',
                          color: isDark ? '#f87171' : '#dc2626',
                        }}
                      >
                        {disconnectingStripe ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Subscription & Billing</h3>
                  <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>Manage your VoiceAI Connect subscription.</p>
                </div>

                {/* Current Plan Card */}
                <div 
                  className="rounded-xl p-4 sm:p-5"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm" style={{ color: mutedTextColor }}>Current Plan</p>
                      <p className="text-xl sm:text-2xl font-semibold capitalize mt-1">
                        {agency?.plan_type || 'Starter'}
                      </p>
                    </div>
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: subscriptionDisplay.bgColor,
                        color: subscriptionDisplay.color,
                      }}
                    >
                      {subscriptionDisplay.label}
                    </span>
                  </div>

                  {/* Trial Info */}
                  {isOnTrial && trialDaysLeft !== null && (
                    <div 
                      className="rounded-lg p-3 mb-4"
                      style={{
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4" style={{ color: '#3b82f6' }} />
                        <p className="text-sm font-medium" style={{ color: '#3b82f6' }}>
                          {trialDaysLeft} days left in trial
                        </p>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgba(59,130,246,0.8)' }}>
                        Your card will be charged automatically on {agency?.trial_ends_at ? new Date(agency.trial_ends_at).toLocaleDateString() : 'trial end'}.
                      </p>
                    </div>
                  )}

                  {/* Plan Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div 
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}
                    >
                      <p className="text-xs" style={{ color: mutedTextColor }}>Price</p>
                      <p className="font-medium">
                        ${agency?.plan_type === 'professional' ? '199' : agency?.plan_type === 'enterprise' ? '299' : '99'}/mo
                      </p>
                    </div>
                    <div 
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}
                    >
                      <p className="text-xs" style={{ color: mutedTextColor }}>Status</p>
                      <p className="font-medium capitalize">{agency?.subscription_status || 'Unknown'}</p>
                    </div>
                  </div>

                  {/* Manage Subscription Button */}
                  <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: primaryColorValue, 
                        color: isLightColor(primaryColorValue) ? '#050505' : '#ffffff',
                      }}
                    >
                      {portalLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      Manage Subscription
                    </button>
                    <p className="mt-2 text-xs" style={{ color: mutedTextColor }}>
                      Update payment method, view invoices, or change plan.
                    </p>
                  </div>
                </div>

                {/* Cancel Trial Option - Only show during trial */}
                {isOnTrial && (
                  <div 
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: isDark ? 'rgba(239,68,68,0.02)' : '#fef2f2',
                      border: isDark ? '1px solid rgba(239,68,68,0.1)' : '1px solid #fecaca',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                          Cancel Trial
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: mutedTextColor }}>
                          You'll lose access immediately and won't be charged.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors flex-shrink-0"
                        style={{
                          backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)',
                          border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(239,68,68,0.2)',
                          color: isDark ? '#f87171' : '#dc2626',
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel Trial
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            {activeTab !== 'payments' && activeTab !== 'billing' && (
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 flex justify-end" style={{ borderTop: `1px solid ${borderColor}` }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
                  style={{ 
                    backgroundColor: primaryColorValue, 
                    color: isLightColor(primaryColorValue) ? '#050505' : '#ffffff',
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}