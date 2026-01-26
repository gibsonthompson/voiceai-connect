'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Upload, Check, AlertCircle, ExternalLink,
  Palette, CreditCard, Building, Loader2, DollarSign,
  AlertTriangle, RefreshCw, Trash2
} from 'lucide-react';
import { useAgency } from '../context';

type SettingsTab = 'profile' | 'branding' | 'pricing' | 'payments';

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

export default function AgencySettingsPage() {
  const { agency, user, branding, loading: contextLoading, refreshAgency } = useAgency();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stripe Connect status
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loadingStripeStatus, setLoadingStripeStatus] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [disconnectingStripe, setDisconnectingStripe] = useState(false);

  // Form states
  const [agencyName, setAgencyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#059669');
  const [accentColor, setAccentColor] = useState('#34d399');
  
  const [priceStarter, setPriceStarter] = useState('49');
  const [pricePro, setPricePro] = useState('99');
  const [priceGrowth, setPriceGrowth] = useState('149');
  const [limitStarter, setLimitStarter] = useState('50');
  const [limitPro, setLimitPro] = useState('150');
  const [limitGrowth, setLimitGrowth] = useState('500');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

  // Initialize form values when agency loads
  useEffect(() => {
    if (agency) {
      setAgencyName(agency.name || '');
      setLogoUrl(agency.logo_url || '');
      setLogoPreview(agency.logo_url);
      setPrimaryColor(agency.primary_color || '#10b981');
      setSecondaryColor(agency.secondary_color || '#059669');
      setAccentColor(agency.accent_color || '#34d399');
      setPriceStarter(((agency.price_starter || 4900) / 100).toString());
      setPricePro(((agency.price_pro || 9900) / 100).toString());
      setPriceGrowth(((agency.price_growth || 14900) / 100).toString());
      setLimitStarter((agency.limit_starter || 50).toString());
      setLimitPro((agency.limit_pro || 150).toString());
      setLimitGrowth((agency.limit_growth || 500).toString());
    }
  }, [agency]);

  // Fetch Stripe Connect status when on payments tab
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
      // Note: Backend route is /api/agency/connect/status/:agencyId
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
    { id: 'profile' as SettingsTab, label: 'Agency Profile', icon: Building },
    { id: 'branding' as SettingsTab, label: 'Branding', icon: Palette },
    { id: 'pricing' as SettingsTab, label: 'Client Pricing', icon: DollarSign },
    { id: 'payments' as SettingsTab, label: 'Payments', icon: CreditCard },
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ agency_id: agency.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start Stripe Connect onboarding');
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
    
    if (!confirm('Are you sure you want to disconnect your Stripe account? You will not be able to receive payments from clients until you reconnect.')) {
      return;
    }
    
    setDisconnectingStripe(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      // Note: Backend route is /api/agency/:agencyId/connect/disconnect
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/connect/disconnect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  // Determine Stripe status display
  const getStripeStatusDisplay = () => {
    if (!stripeStatus?.connected && !agency?.stripe_account_id) {
      return { status: 'not_connected', label: 'Not Connected', color: 'text-[#fafaf9]/50' };
    }
    
    if (stripeStatus?.charges_enabled && stripeStatus?.payouts_enabled) {
      return { status: 'active', label: 'Active - Receiving Payments', color: 'text-emerald-400' };
    }
    
    if (stripeStatus?.connected || agency?.stripe_account_id) {
      return { status: 'restricted', label: 'Restricted - Setup Incomplete', color: 'text-amber-400' };
    }
    
    return { status: 'not_connected', label: 'Not Connected', color: 'text-[#fafaf9]/50' };
  };

  const stripeDisplay = getStripeStatusDisplay();

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-[#fafaf9]/50">Manage your agency settings and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-[#fafaf9]/50 hover:bg-white/[0.04] hover:text-[#fafaf9]'
                }`}
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
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400">{error}</p>
            </div>
          )}
          
          {saved && (
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-400" />
              <p className="text-emerald-400">Settings saved successfully!</p>
            </div>
          )}

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-1">Agency Profile</h3>
                  <p className="text-sm text-[#fafaf9]/50">
                    Basic information about your agency.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Agency Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Building className="h-8 w-8 text-[#fafaf9]/30" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium hover:bg-white/[0.06] transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Logo
                      </button>
                      <p className="mt-2 text-xs text-[#fafaf9]/40">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Agency Slug</label>
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-[#fafaf9]/50">
                    {agency?.slug}
                  </div>
                  <p className="mt-2 text-xs text-[#fafaf9]/40">
                    Your client signup URL: https://{agency?.slug}.{platformDomain}/signup
                  </p>
                </div>
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-1">Brand Colors</h3>
                  <p className="text-sm text-[#fafaf9]/50">
                    Customize the colors used throughout your client portal.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-10 w-14 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-mono text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-10 w-14 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-mono text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-10 w-14 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-mono text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium mb-2">Preview</label>
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 space-y-3">
                    <div className="flex gap-2">
                      <button 
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        style={{ backgroundColor: primaryColor, color: isLightColor(primaryColor) ? '#0a0a0a' : '#fff' }}
                      >
                        Primary Button
                      </button>
                      <button 
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        style={{ backgroundColor: secondaryColor, color: isLightColor(secondaryColor) ? '#0a0a0a' : '#fff' }}
                      >
                        Secondary
                      </button>
                    </div>
                    <p className="text-sm">
                      This is an <span style={{ color: accentColor }} className="font-medium">accent link</span> in your brand color.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-1">Client Pricing</h3>
                  <p className="text-sm text-[#fafaf9]/50">
                    Set the prices and call limits for your client plans.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Starter Plan */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                    <h4 className="font-medium mb-3">Starter Plan</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1 text-[#fafaf9]/50">Monthly Price ($)</label>
                        <input
                          type="number"
                          value={priceStarter}
                          onChange={(e) => setPriceStarter(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-2 text-sm text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#fafaf9]/50">Call Limit</label>
                        <input
                          type="number"
                          value={limitStarter}
                          onChange={(e) => setLimitStarter(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-2 text-sm text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-medium">Pro Plan</h4>
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Popular</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1 text-[#fafaf9]/50">Monthly Price ($)</label>
                        <input
                          type="number"
                          value={pricePro}
                          onChange={(e) => setPricePro(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-2 text-sm text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#fafaf9]/50">Call Limit</label>
                        <input
                          type="number"
                          value={limitPro}
                          onChange={(e) => setLimitPro(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-2 text-sm text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Growth Plan */}
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                    <h4 className="font-medium mb-3">Growth Plan</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1 text-[#fafaf9]/50">Monthly Price ($)</label>
                        <input
                          type="number"
                          value={priceGrowth}
                          onChange={(e) => setPriceGrowth(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-2 text-sm text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1 text-[#fafaf9]/50">Call Limit</label>
                        <input
                          type="number"
                          value={limitGrowth}
                          onChange={(e) => setLimitGrowth(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-[#050505] px-4 py-2 text-sm text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-1">Payment Settings</h3>
                  <p className="text-sm text-[#fafaf9]/50">
                    Connect your Stripe account to receive payments from clients.
                  </p>
                </div>

                {/* Stripe Connect Card */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#635BFF]">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Stripe Connect</p>
                        <p className={`text-sm ${stripeDisplay.color}`}>
                          {loadingStripeStatus ? 'Loading...' : stripeDisplay.label}
                        </p>
                      </div>
                    </div>
                    
                    {/* Status Icon */}
                    {stripeDisplay.status === 'active' && (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                    {stripeDisplay.status === 'restricted' && (
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {/* Status Details */}
                  {(stripeStatus?.connected || agency?.stripe_account_id) && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                      {/* Status Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                          <span className="text-[#fafaf9]/50">Charges</span>
                          {stripeStatus?.charges_enabled ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Check className="h-3.5 w-3.5" /> Enabled
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" /> Disabled
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                          <span className="text-[#fafaf9]/50">Payouts</span>
                          {stripeStatus?.payouts_enabled ? (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Check className="h-3.5 w-3.5" /> Enabled
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" /> Disabled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Account ID */}
                      <p className="text-xs text-[#fafaf9]/40">
                        Account ID: <span className="font-mono">{agency?.stripe_account_id}</span>
                      </p>

                      {/* Warning if restricted */}
                      {stripeDisplay.status === 'restricted' && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                          <p className="text-sm text-amber-400">
                            Your Stripe account setup is incomplete. Complete the onboarding process to start receiving payments.
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        {stripeDisplay.status === 'restricted' && (
                          <button
                            onClick={handleStripeConnect}
                            disabled={connectingStripe}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors bg-[#635BFF] hover:bg-[#5851e6] disabled:opacity-50"
                          >
                            {connectingStripe ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                            Complete Setup
                          </button>
                        )}
                        
                        <a 
                          href="https://dashboard.stripe.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/[0.06] transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Stripe Dashboard
                        </a>

                        <button
                          onClick={fetchStripeStatus}
                          disabled={loadingStripeStatus}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[#fafaf9]/50 hover:bg-white/[0.06] transition-colors"
                          title="Refresh status"
                        >
                          <RefreshCw className={`h-4 w-4 ${loadingStripeStatus ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Connect Button (when not connected) */}
                  {stripeDisplay.status === 'not_connected' && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <button
                        onClick={handleStripeConnect}
                        disabled={connectingStripe}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors bg-[#635BFF] hover:bg-[#5851e6] disabled:opacity-50"
                      >
                        {connectingStripe ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        Connect Stripe Account
                      </button>
                      <p className="mt-2 text-xs text-[#fafaf9]/40">
                        You'll be redirected to Stripe to complete the setup process.
                      </p>
                    </div>
                  )}
                </div>

                {/* Disconnect Option */}
                {(stripeStatus?.connected || agency?.stripe_account_id) && (
                  <div className="rounded-xl border border-red-500/10 bg-red-500/[0.02] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-red-400">Disconnect Stripe</p>
                        <p className="text-sm text-[#fafaf9]/50 mt-1">
                          Remove this Stripe account from your agency. You will not be able to receive client payments until you reconnect.
                        </p>
                      </div>
                      <button
                        onClick={handleStripeDisconnect}
                        disabled={disconnectingStripe}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex-shrink-0"
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

            {/* Save Button - Not shown for payments tab */}
            {activeTab !== 'payments' && (
              <div className="mt-8 pt-6 border-t border-white/[0.06] flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors disabled:opacity-50"
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