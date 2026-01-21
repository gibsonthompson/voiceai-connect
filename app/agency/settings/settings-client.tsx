'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Phone, Users, DollarSign, Settings, LogOut, TrendingUp,
  Sun, Moon, Upload, Check, AlertCircle, ExternalLink,
  Palette, CreditCard, Globe, User, Building, Loader2
} from 'lucide-react';

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  name: string;
}

interface SettingsPageClientProps {
  branding: Branding;
  agency: any;
  user: any;
}

// Helper functions
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type SettingsTab = 'profile' | 'branding' | 'pricing' | 'payments' | 'domain';

export function SettingsPageClient({
  branding,
  agency,
  user,
}: SettingsPageClientProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [agencyName, setAgencyName] = useState(agency.name || '');
  const [logoUrl, setLogoUrl] = useState(agency.logo_url || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(agency.logo_url);
  
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(branding.secondaryColor);
  const [accentColor, setAccentColor] = useState(branding.accentColor);
  
  const [priceStarter, setPriceStarter] = useState(((agency.price_starter || 4900) / 100).toString());
  const [pricePro, setPricePro] = useState(((agency.price_pro || 9900) / 100).toString());
  const [priceGrowth, setPriceGrowth] = useState(((agency.price_growth || 14900) / 100).toString());
  const [limitStarter, setLimitStarter] = useState((agency.limit_starter || 50).toString());
  const [limitPro, setLimitPro] = useState((agency.limit_pro || 150).toString());
  const [limitGrowth, setLimitGrowth] = useState((agency.limit_growth || 500).toString());
  
  const [customDomain, setCustomDomain] = useState(agency.marketing_domain || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load theme preference
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-theme');
    if (saved) {
      setDarkMode(saved === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('dashboard-theme', newMode ? 'dark' : 'light');
  };

  // Theme colors
  const theme = {
    bg: darkMode ? '#0a0a0a' : '#f8f8f6',
    text: darkMode ? '#f5f5f0' : '#1a1a1a',
    textMuted: darkMode ? 'rgba(245, 245, 240, 0.5)' : 'rgba(26, 26, 26, 0.5)',
    textMuted4: darkMode ? 'rgba(245, 245, 240, 0.4)' : 'rgba(26, 26, 26, 0.4)',
    textMuted6: darkMode ? 'rgba(245, 245, 240, 0.6)' : 'rgba(26, 26, 26, 0.6)',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    cardBg: darkMode ? '#111' : 'rgba(255, 255, 255, 0.8)',
    inputBg: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  };

  const primaryLight = isLightColor(branding.primaryColor);
  const sidebarBg = darkenColor(branding.primaryColor, 65);

  const navItems = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: TrendingUp, active: false },
    { href: '/agency/clients', label: 'Clients', icon: Users, active: false },
    { href: '/agency/revenue', label: 'Revenue', icon: DollarSign, active: false },
    { href: '/agency/settings', label: 'Settings', icon: Settings, active: true },
  ];

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
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleStripeConnect = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/connect/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full border transition-all hover:scale-105"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Sidebar */}
      <aside 
        className="fixed inset-y-0 left-0 z-40 w-64 border-r transition-colors duration-200"
        style={{ backgroundColor: sidebarBg, borderColor: hexToRgba(branding.primaryColor, 0.2) }}
      >
        <div 
          className="flex h-16 items-center gap-3 border-b px-6"
          style={{ borderColor: hexToRgba(branding.primaryColor, 0.2) }}
        >
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Phone className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
            </div>
          )}
          <span className="font-medium text-[#f5f5f0] truncate">{branding.name}</span>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: item.active ? hexToRgba(branding.primaryColor, 0.3) : 'transparent',
                color: item.active ? '#f5f5f0' : 'rgba(245, 245, 240, 0.6)',
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div 
          className="absolute bottom-0 left-0 right-0 border-t p-4"
          style={{ borderColor: hexToRgba(branding.primaryColor, 0.2) }}
        >
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium tracking-tight">Settings</h1>
            <p className="mt-1" style={{ color: theme.textMuted }}>Manage your agency settings and preferences.</p>
          </div>

          <div className="flex gap-8">
            {/* Settings Tabs */}
            <div className="w-56 flex-shrink-0">
              <nav className="space-y-1">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left"
                    style={{
                      backgroundColor: activeTab === tab.id ? hexToRgba(branding.primaryColor, 0.1) : 'transparent',
                      color: activeTab === tab.id ? branding.primaryColor : theme.textMuted6,
                    }}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 max-w-2xl">
              {/* Error/Success Messages */}
              {error && (
                <div className="mb-6 rounded-lg border border-red-400/20 bg-red-400/10 p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-red-400">{error}</p>
                </div>
              )}
              
              {saved && (
                <div className="mb-6 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 flex items-center gap-3">
                  <Check className="h-5 w-5 text-emerald-400" />
                  <p className="text-emerald-400">Settings saved successfully!</p>
                </div>
              )}

              <div 
                className="rounded-xl border p-6"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
              >
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-1">Agency Profile</h3>
                      <p className="text-sm" style={{ color: theme.textMuted }}>
                        Basic information about your agency.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Agency Name</label>
                      <input
                        type="text"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none"
                        style={{ borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Logo</label>
                      <div className="flex items-center gap-4">
                        <div 
                          className="h-20 w-20 rounded-xl border flex items-center justify-center overflow-hidden"
                          style={{ borderColor: theme.border, backgroundColor: theme.inputBg }}
                        >
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                          ) : (
                            <Building className="h-8 w-8" style={{ color: theme.textMuted4 }} />
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
                            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                            style={{ borderColor: theme.border, backgroundColor: theme.inputBg }}
                          >
                            <Upload className="h-4 w-4" />
                            Upload Logo
                          </button>
                          <p className="mt-2 text-xs" style={{ color: theme.textMuted4 }}>
                            PNG, JPG up to 2MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Agency Slug</label>
                      <div 
                        className="rounded-lg border px-4 py-2.5 text-sm"
                        style={{ borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.textMuted }}
                      >
                        {agency.slug}
                      </div>
                      <p className="mt-2 text-xs" style={{ color: theme.textMuted4 }}>
                        Your client signup URL: https://{agency.slug}.voiceaiconnect.com/signup
                      </p>
                    </div>
                  </div>
                )}

                {/* Branding Tab */}
                {activeTab === 'branding' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-1">Brand Colors</h3>
                      <p className="text-sm" style={{ color: theme.textMuted }}>
                        Customize the colors used throughout your agency portal.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Primary Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-10 w-14 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-mono transition-colors focus:outline-none"
                            style={{ borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }}
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
                            className="h-10 w-14 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-mono transition-colors focus:outline-none"
                            style={{ borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }}
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
                            className="h-10 w-14 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-mono transition-colors focus:outline-none"
                            style={{ borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Preview</label>
                      <div 
                        className="rounded-lg border p-4 space-y-3"
                        style={{ borderColor: theme.border, backgroundColor: theme.inputBg }}
                      >
                        <div className="flex gap-2">
                          <button 
                            className="px-4 py-2 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: primaryColor, color: isLightColor(primaryColor) ? '#0a0a0a' : '#fff' }}
                          >
                            Primary Button
                          </button>
                          <button 
                            className="px-4 py-2 rounded-lg text-sm font-medium"
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
                      <p className="text-sm" style={{ color: theme.textMuted }}>
                        Set the prices and call limits for your client plans.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Starter Plan */}
                      <div 
                        className="rounded-lg border p-4"
                        style={{ borderColor: theme.border, backgroundColor: theme.inputBg }}
                      >
                        <h4 className="font-medium mb-3">Starter Plan</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm mb-1" style={{ color: theme.textMuted }}>Monthly Price ($)</label>
                            <input
                              type="number"
                              value={priceStarter}
                              onChange={(e) => setPriceStarter(e.target.value)}
                              className="w-full rounded-lg border px-4 py-2 text-sm focus:outline-none"
                              style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1" style={{ color: theme.textMuted }}>Call Limit</label>
                            <input
                              type="number"
                              value={limitStarter}
                              onChange={(e) => setLimitStarter(e.target.value)}
                              className="w-full rounded-lg border px-4 py-2 text-sm focus:outline-none"
                              style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pro Plan */}
                      <div 
                        className="rounded-lg border p-4"
                        style={{ borderColor: theme.border, backgroundColor: theme.inputBg }}
                      >
                        <h4 className="font-medium mb-3">Pro Plan</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm mb-1" style={{ color: theme.textMuted }}>Monthly Price ($)</label>
                            <input
                              type="number"
                              value={pricePro}
                              onChange={(e) => setPricePro(e.target.value)}
                              className="w-full rounded-lg border px-4 py-2 text-sm focus:outline-none"
                              style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1" style={{ color: theme.textMuted }}>Call Limit</label>
                            <input
                              type="number"
                              value={limitPro}
                              onChange={(e) => setLimitPro(e.target.value)}
                              className="w-full rounded-lg border px-4 py-2 text-sm focus:outline-none"
                              style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Growth Plan */}
                      <div 
                        className="rounded-lg border p-4"
                        style={{ borderColor: theme.border, backgroundColor: theme.inputBg }}
                      >
                        <h4 className="font-medium mb-3">Growth Plan</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm mb-1" style={{ color: theme.textMuted }}>Monthly Price ($)</label>
                            <input
                              type="number"
                              value={priceGrowth}
                              onChange={(e) => setPriceGrowth(e.target.value)}
                              className="w-full rounded-lg border px-4 py-2 text-sm focus:outline-none"
                              style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1" style={{ color: theme.textMuted }}>Call Limit</label>
                            <input
                              type="number"
                              value={limitGrowth}
                              onChange={(e) => setLimitGrowth(e.target.value)}
                              className="w-full rounded-lg border px-4 py-2 text-sm focus:outline-none"
                              style={{ borderColor: theme.border, backgroundColor: theme.bg, color: theme.text }}
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
                      <p className="text-sm" style={{ color: theme.textMuted }}>
                        Connect your Stripe account to receive payments from clients.
                      </p>
                    </div>

                    <div 
                      className="rounded-lg border p-5"
                      style={{ borderColor: theme.border, backgroundColor: theme.inputBg }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="h-12 w-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#635BFF' }}
                          >
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Stripe Connect</p>
                            <p className="text-sm" style={{ color: theme.textMuted }}>
                              {agency.stripe_account_id 
                                ? 'Connected - Receiving payments' 
                                : 'Not connected - Set up to receive payments'}
                            </p>
                          </div>
                        </div>
                        
                        {agency.stripe_account_id ? (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Check className="h-5 w-5" />
                            <span className="text-sm font-medium">Connected</span>
                          </div>
                        ) : (
                          <button
                            onClick={handleStripeConnect}
                            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                            style={{ backgroundColor: '#635BFF' }}
                          >
                            Connect Stripe
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {agency.stripe_account_id && (
                      <div>
                        <p className="text-sm" style={{ color: theme.textMuted }}>
                          Stripe Account ID: <span className="font-mono">{agency.stripe_account_id}</span>
                        </p>
                        <a 
                          href="https://dashboard.stripe.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm mt-2 hover:underline"
                          style={{ color: branding.accentColor }}
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
                      <p className="text-sm" style={{ color: theme.textMuted }}>
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
                        className="w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none"
                        style={{ borderColor: theme.border, backgroundColor: theme.inputBg, color: theme.text }}
                      />
                      <p className="mt-2 text-xs" style={{ color: theme.textMuted4 }}>
                        Add a CNAME record pointing to <span className="font-mono">cname.voiceaiconnect.com</span>
                      </p>
                    </div>

                    {agency.marketing_domain && (
                      <div 
                        className="rounded-lg border p-4"
                        style={{ borderColor: theme.border, backgroundColor: theme.inputBg }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{agency.marketing_domain}</p>
                            <p className="text-sm" style={{ color: theme.textMuted }}>
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
                  <div className="mt-8 pt-6 border-t flex justify-end" style={{ borderColor: theme.border }}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ 
                        backgroundColor: branding.primaryColor,
                        color: primaryLight ? '#0a0a0a' : '#f5f5f0',
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
      </main>
    </div>
  );
}