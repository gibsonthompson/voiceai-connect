'use client';

import { useState, useRef } from 'react';
import { 
  Upload, Check, AlertCircle, ExternalLink,
  Palette, CreditCard, Globe, Building, Loader2, DollarSign
} from 'lucide-react';
import { useAgency } from '../context';

type SettingsTab = 'profile' | 'branding' | 'pricing' | 'payments' | 'domain';

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

  // Form states - initialize with empty, update when agency loads
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
  
  const [customDomain, setCustomDomain] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form values when agency loads
  useState(() => {
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
      setCustomDomain(agency.marketing_domain || '');
    }
  });

  // Update form when agency changes
  if (agency && agencyName === '' && agency.name) {
    setAgencyName(agency.name);
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
    setCustomDomain(agency.marketing_domain || '');
  }

  const settingsTabs = [
    { id: 'profile' as SettingsTab, label: 'Agency Profile', icon: Building },
    { id: 'branding' as SettingsTab, label: 'Branding', icon: Palette },
    { id: 'pricing' as SettingsTab, label: 'Client Pricing', icon: DollarSign },
    { id: 'payments' as SettingsTab, label: 'Payments', icon: CreditCard },
    { id: 'domain' as SettingsTab, label: 'Custom Domain', icon: Globe },
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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
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
      } else if (activeTab === 'domain') {
        payload.marketing_domain = customDomain;
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

      // Refresh agency data
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
    
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${backendUrl}/api/agency/connect/onboard`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ agency_id: agency.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to start Stripe Connect onboarding');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Stripe');
    }
  };

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

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
              <AlertCircle className="h-5 w-5 text-red-400" />
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

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#635BFF]">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Stripe Connect</p>
                        <p className="text-sm text-[#fafaf9]/50">
                          {agency?.stripe_account_id 
                            ? 'Connected - Receiving payments' 
                            : 'Not connected - Set up to receive payments'}
                        </p>
                      </div>
                    </div>
                    
                    {agency?.stripe_account_id ? (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Check className="h-5 w-5" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleStripeConnect}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors bg-[#635BFF] hover:bg-[#5851e6]"
                      >
                        Connect Stripe
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {agency?.stripe_account_id && (
                  <div className="text-sm text-[#fafaf9]/50">
                    <p>Stripe Account ID: <span className="font-mono">{agency.stripe_account_id}</span></p>
                    <a 
                      href="https://dashboard.stripe.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Open Stripe Dashboard
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Domain Tab */}
            {activeTab === 'domain' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-1">Custom Domain</h3>
                  <p className="text-sm text-[#fafaf9]/50">
                    Use your own domain for client signup pages.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Custom Domain</label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="app.youragency.com"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none transition-colors"
                  />
                  <p className="mt-2 text-xs text-[#fafaf9]/40">
                    Add a CNAME record pointing to <span className="font-mono">cname.{platformDomain}</span>
                  </p>
                </div>

                {agency?.marketing_domain && (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{agency.marketing_domain}</p>
                        <p className="text-sm text-[#fafaf9]/50">
                          {agency.domain_verified ? 'Domain verified' : 'Pending verification'}
                        </p>
                      </div>
                      {agency.domain_verified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                          <Check className="h-4 w-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
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