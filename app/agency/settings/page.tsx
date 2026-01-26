'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Upload, Check, AlertCircle, ExternalLink,
  Palette, CreditCard, Globe, Building, Loader2, DollarSign,
  Copy, RefreshCw, Trash2
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
  
  // Domain state
  const [customDomain, setCustomDomain] = useState('');
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [dnsConfig, setDnsConfig] = useState<{ aRecord: string; cname: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

  // Fetch DNS config when domain changes
  useEffect(() => {
    const fetchDnsConfig = async () => {
      if (!backendUrl) return;
      
      try {
        // Pass domain parameter to get project-specific values (not generic 76.76.21.21)
        const domainParam = agency?.marketing_domain ? `?domain=${agency.marketing_domain}` : '';
        const response = await fetch(`${backendUrl}/api/domain/dns-config${domainParam}`);
        if (response.ok) {
          const data = await response.json();
          setDnsConfig({
            aRecord: data.a_record || '76.76.21.21',
            cname: data.cname_record || 'cname.vercel-dns.com'
          });
          console.log('📋 DNS Config loaded:', data.source, data.a_record);
        }
      } catch (error) {
        console.error('Failed to fetch DNS config:', error);
        setDnsConfig({
          aRecord: '76.76.21.21',
          cname: 'cname.vercel-dns.com'
        });
      }
    };
    fetchDnsConfig();
  }, [backendUrl, agency?.marketing_domain]);

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
      setCustomDomain(agency.marketing_domain || '');
    }
  }, [agency]);

  const settingsTabs = [
    { id: 'profile' as SettingsTab, label: 'Agency Profile', icon: Building },
    { id: 'branding' as SettingsTab, label: 'Branding', icon: Palette },
    { id: 'pricing' as SettingsTab, label: 'Client Pricing', icon: DollarSign },
    { id: 'payments' as SettingsTab, label: 'Payments', icon: CreditCard },
    { id: 'domain' as SettingsTab, label: 'Custom Domain', icon: Globe },
  ];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

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

  // Domain Management Functions
  const handleAddDomain = async () => {
    if (!agency || !customDomain.trim()) return;
    
    setDomainSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      console.log('🌐 Adding domain:', customDomain.trim());
      console.log('📡 API URL:', `${backendUrl}/api/agency/${agency.id}/domain`);
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/domain`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ domain: customDomain.trim() }),
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add domain');
      }

      // Update DNS config with project-specific values from the response
      if (data.dns_config) {
        setDnsConfig({
          aRecord: data.dns_config.a_record,
          cname: data.dns_config.cname_record
        });
        console.log('📋 Updated DNS config:', data.dns_config.source, data.dns_config.a_record);
      }

      await refreshAgency();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('❌ Add domain error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setDomainSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!agency) return;
    
    setDomainVerifying(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/domain/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      
      if (data.verified) {
        await refreshAgency();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.message || 'DNS records not found. Please check your configuration.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setDomainVerifying(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!agency || !confirm('Are you sure you want to remove this custom domain?')) return;
    
    setDomainSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/domain`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setCustomDomain('');
        await refreshAgency();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove domain');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove domain');
    } finally {
      setDomainSaving(false);
    }
  };

  const handleStripeConnect = async () => {
    if (!agency) return;
    
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

  const hasDomain = !!agency?.marketing_domain;
  const domainVerified = agency?.domain_verified;

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
                    Use your own domain for your marketing website and client signup pages.
                  </p>
                </div>

                {!hasDomain ? (
                  // No domain configured - show input
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Domain Name</label>
                      <input
                        type="text"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="yourdomain.com"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleAddDomain}
                      disabled={!customDomain.trim() || domainSaving}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {domainSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      Add Custom Domain
                    </button>
                  </div>
                ) : (
                  // Domain configured - show status and DNS instructions
                  <div className="space-y-4">
                    {/* Domain Status Card */}
                    <div className={`rounded-xl border p-4 ${
                      domainVerified 
                        ? 'border-emerald-500/30 bg-emerald-500/10' 
                        : 'border-amber-500/30 bg-amber-500/10'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {domainVerified ? (
                            <Check className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-400" />
                          )}
                          <div>
                            <p className={`font-medium ${domainVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {domainVerified ? 'Domain Connected' : 'Pending Verification'}
                            </p>
                            <p className="text-sm text-[#fafaf9]/70 font-mono">{agency.marketing_domain}</p>
                          </div>
                        </div>
                        {domainVerified && (
                          <a
                            href={`https://${agency.marketing_domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* DNS Instructions (show when pending) */}
                    {!domainVerified && (
                      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                        <h4 className="font-medium mb-3">DNS Configuration</h4>
                        <p className="text-sm text-[#fafaf9]/50 mb-4">
                          Add the following DNS records with your domain registrar:
                        </p>
                        
                        <div className="space-y-3">
                          {/* A Record */}
                          <div className="grid grid-cols-3 gap-4 text-sm p-3 rounded-lg bg-white/[0.02]">
                            <div>
                              <p className="text-[#fafaf9]/50 text-xs uppercase mb-1">Type</p>
                              <p className="text-[#fafaf9] font-mono font-medium">A</p>
                            </div>
                            <div>
                              <p className="text-[#fafaf9]/50 text-xs uppercase mb-1">Name</p>
                              <p className="text-[#fafaf9] font-mono">@</p>
                            </div>
                            <div>
                              <p className="text-[#fafaf9]/50 text-xs uppercase mb-1">Value</p>
                              <div className="flex items-center gap-2">
                                <p className="text-[#fafaf9] font-mono text-xs">{dnsConfig?.aRecord || '76.76.21.21'}</p>
                                <button
                                  onClick={() => copyToClipboard(dnsConfig?.aRecord || '76.76.21.21', 'arecord')}
                                  className="text-[#fafaf9]/50 hover:text-[#fafaf9]"
                                >
                                  {copied === 'arecord' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* CNAME Record */}
                          <p className="text-xs text-[#fafaf9]/40">Optional: Add www redirect</p>
                          <div className="grid grid-cols-3 gap-4 text-sm p-3 rounded-lg bg-white/[0.02]">
                            <div>
                              <p className="text-[#fafaf9]/50 text-xs uppercase mb-1">Type</p>
                              <p className="text-[#fafaf9] font-mono font-medium">CNAME</p>
                            </div>
                            <div>
                              <p className="text-[#fafaf9]/50 text-xs uppercase mb-1">Name</p>
                              <p className="text-[#fafaf9] font-mono">www</p>
                            </div>
                            <div>
                              <p className="text-[#fafaf9]/50 text-xs uppercase mb-1">Value</p>
                              <div className="flex items-center gap-2">
                                <p className="text-[#fafaf9] font-mono text-xs">{dnsConfig?.cname || 'cname.vercel-dns.com'}</p>
                                <button
                                  onClick={() => copyToClipboard(dnsConfig?.cname || 'cname.vercel-dns.com', 'cname')}
                                  className="text-[#fafaf9]/50 hover:text-[#fafaf9]"
                                >
                                  {copied === 'cname' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-[#fafaf9]/40 mt-4">
                          DNS changes can take up to 48 hours to propagate worldwide.
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {!domainVerified && (
                        <button
                          onClick={handleVerifyDomain}
                          disabled={domainVerifying}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors disabled:opacity-50"
                        >
                          {domainVerifying ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Verify Domain
                        </button>
                      )}
                      <button
                        onClick={handleRemoveDomain}
                        disabled={domainSaving}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove Domain
                      </button>
                    </div>
                  </div>
                )}

                {/* Current URL Info */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                  <p className="text-sm text-[#fafaf9]/50 mb-2">Your current marketing URL:</p>
                  <p className="font-mono text-sm">
                    {hasDomain && domainVerified 
                      ? `https://${agency.marketing_domain}`
                      : `https://${agency?.slug}.${platformDomain}`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Save Button - Not shown for domain or payments tabs */}
            {activeTab !== 'payments' && activeTab !== 'domain' && (
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