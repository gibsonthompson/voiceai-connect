'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Palette,
  Type,
  DollarSign,
  Settings2,
  Save,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useAgency } from '../context';

type ActiveTab = 'overview' | 'content' | 'theme' | 'domain';

export default function MarketingWebsitePage() {
  const { agency, branding, refreshAgency } = useAgency();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  
  // Domain state
  const [customDomain, setCustomDomain] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [domainStatus, setDomainStatus] = useState<'none' | 'pending' | 'verified'>('none');

  // Content state
  const [tagline, setTagline] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [savingContent, setSavingContent] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);

  // Theme state
  const [websiteTheme, setWebsiteTheme] = useState<'auto' | 'light' | 'dark'>('auto');
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const subdomainUrl = `https://${agency?.slug}.${platformDomain}`;

  useEffect(() => {
    if (agency) {
      // Load domain
      if (agency.marketing_domain) {
        setCustomDomain(agency.marketing_domain);
        setDomainStatus(agency.domain_verified ? 'verified' : 'pending');
      }
      // Load content
      setTagline(agency.company_tagline || '');
      setHeadline(agency.website_headline || '');
      setSubheadline(agency.website_subheadline || '');
      // Load theme
      setWebsiteTheme(agency.website_theme || 'auto');
    }
  }, [agency]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveContent = async () => {
    if (!agency) return;
    
    setSavingContent(true);
    setContentSaved(false);
    
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_tagline: tagline,
          website_headline: headline,
          website_subheadline: subheadline,
        }),
      });
      
      if (response.ok) {
        await refreshAgency();
        setContentSaved(true);
        setTimeout(() => setContentSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setSavingContent(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!agency) return;
    
    setSavingTheme(true);
    setThemeSaved(false);
    
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          website_theme: websiteTheme,
        }),
      });
      
      if (response.ok) {
        await refreshAgency();
        setThemeSaved(true);
        setTimeout(() => setThemeSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setSavingTheme(false);
    }
  };

  const handleSaveCustomDomain = async () => {
    if (!customDomain.trim() || !agency) return;
    
    setSavingDomain(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ marketing_domain: customDomain.trim().toLowerCase() }),
      });
      
      if (response.ok) {
        setDomainStatus('pending');
        await refreshAgency();
      }
    } catch (error) {
      console.error('Failed to save domain:', error);
    } finally {
      setSavingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!agency) return;
    
    setVerifyingDomain(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/domain/verify`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      setDomainStatus(data.verified ? 'verified' : 'pending');
      await refreshAgency();
    } catch (error) {
      console.error('Failed to verify domain:', error);
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!agency) return;
    
    setSavingDomain(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ marketing_domain: null, domain_verified: false }),
      });
      
      if (response.ok) {
        setCustomDomain('');
        setDomainStatus('none');
        await refreshAgency();
      }
    } catch (error) {
      console.error('Failed to remove domain:', error);
    } finally {
      setSavingDomain(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#fafaf9]">Marketing Website</h1>
        <p className="mt-1 text-[#fafaf9]/50">
          Your public website where potential clients can learn about your AI receptionist service
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Live Site Card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Globe className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <h3 className="font-medium text-[#fafaf9] mb-1">Your Website</h3>
          <p className="text-sm text-[#fafaf9]/50 mb-4 truncate">{subdomainUrl}</p>
          <div className="flex gap-2">
            <a
              href={subdomainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View Site
            </a>
            <button
              onClick={() => copyToClipboard(subdomainUrl, 'subdomain')}
              className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#fafaf9]/70 hover:bg-white/10 transition-colors"
            >
              {copied === 'subdomain' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Branding Card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Palette className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <h3 className="font-medium text-[#fafaf9] mb-1">Branding</h3>
          <p className="text-sm text-[#fafaf9]/50 mb-4">Logo, colors, and company name</p>
          <a
            href="/agency/settings"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/10 transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            Edit in Settings
          </a>
        </div>

        {/* Pricing Card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          <h3 className="font-medium text-[#fafaf9] mb-1">Pricing</h3>
          <p className="text-sm text-[#fafaf9]/50 mb-4">Set your plan prices and limits</p>
          <a
            href="/agency/settings"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/10 transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            Edit in Settings
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-6">
        <nav className="flex gap-6">
          {[
            { id: 'overview' as ActiveTab, label: 'Overview', icon: Globe },
            { id: 'content' as ActiveTab, label: 'Website Content', icon: Type },
            { id: 'theme' as ActiveTab, label: 'Theme', icon: Palette },
            { id: 'domain' as ActiveTab, label: 'Custom Domain', icon: LinkIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-[#fafaf9]/50 hover:text-[#fafaf9]/70'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* What's Included */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-medium text-[#fafaf9] mb-4">Your marketing website includes:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Hero Section', desc: 'Eye-catching headline with live demo call button' },
                { title: 'Features Overview', desc: 'Showcase all AI receptionist capabilities' },
                { title: 'How It Works', desc: '4-step process to get started' },
                { title: 'Pricing Plans', desc: 'Your Starter, Pro, and Growth tiers' },
                { title: 'Testimonials', desc: 'Social proof from satisfied customers' },
                { title: 'FAQ Section', desc: 'Answer common questions' },
                { title: 'Industry Cards', desc: 'Show which industries you serve' },
                { title: 'Comparison Table', desc: 'Compare vs competitors' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[#fafaf9] text-sm">{item.title}</p>
                    <p className="text-xs text-[#fafaf9]/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Settings Preview */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-medium text-[#fafaf9] mb-4">Current Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-2">Brand Name</p>
                <p className="text-[#fafaf9]">{agency?.name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-2">Primary Color</p>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-6 w-6 rounded border border-white/20"
                    style={{ backgroundColor: branding.primaryColor || '#10b981' }}
                  />
                  <span className="text-[#fafaf9]">{branding.primaryColor || '#10b981'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-2">Theme</p>
                <p className="text-[#fafaf9] capitalize">{agency?.website_theme || 'Auto'}</p>
              </div>
              <div>
                <p className="text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-2">Logo</p>
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="h-8 w-8 rounded object-contain bg-white/10" />
                ) : (
                  <span className="text-[#fafaf9]/50">Not uploaded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-medium text-[#fafaf9] mb-2">Website Content</h3>
            <p className="text-sm text-[#fafaf9]/50 mb-6">
              Customize the text that appears on your marketing website
            </p>

            <div className="space-y-5">
              {/* Tagline / Badge */}
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                  Tagline / Badge
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="AI-Powered Phone Answering"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <p className="mt-1.5 text-xs text-[#fafaf9]/40">
                  Appears as a badge above your main headline
                </p>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Never Miss Another Call"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <p className="mt-1.5 text-xs text-[#fafaf9]/40">
                  The main headline in your hero section
                </p>
              </div>

              {/* Subheadline */}
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                  Subheadline
                </label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="AI Receptionist Starting at $49/month"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <p className="mt-1.5 text-xs text-[#fafaf9]/40">
                  Appears below the headline with pricing info
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
              {contentSaved && (
                <span className="flex items-center gap-2 text-sm text-emerald-400">
                  <Check className="h-4 w-4" />
                  Content saved
                </span>
              )}
              <button
                onClick={handleSaveContent}
                disabled={savingContent}
                className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {savingContent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Content
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-medium text-[#fafaf9] mb-2">Website Theme</h3>
            <p className="text-sm text-[#fafaf9]/50 mb-6">
              Choose how your marketing website looks
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Auto */}
              <button
                onClick={() => setWebsiteTheme('auto')}
                className={`relative rounded-xl border p-5 text-left transition-all ${
                  websiteTheme === 'auto'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {websiteTheme === 'auto' && (
                  <div className="absolute top-3 right-3">
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 mb-3">
                  <Monitor className="h-5 w-5 text-[#fafaf9]/70" />
                </div>
                <h4 className="font-medium text-[#fafaf9] mb-1">Auto</h4>
                <p className="text-xs text-[#fafaf9]/50">
                  Automatically detect theme based on your logo background
                </p>
              </button>

              {/* Light */}
              <button
                onClick={() => setWebsiteTheme('light')}
                className={`relative rounded-xl border p-5 text-left transition-all ${
                  websiteTheme === 'light'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {websiteTheme === 'light' && (
                  <div className="absolute top-3 right-3">
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white mb-3">
                  <Sun className="h-5 w-5 text-amber-500" />
                </div>
                <h4 className="font-medium text-[#fafaf9] mb-1">Light</h4>
                <p className="text-xs text-[#fafaf9]/50">
                  Clean, professional look with light backgrounds
                </p>
              </button>

              {/* Dark */}
              <button
                onClick={() => setWebsiteTheme('dark')}
                className={`relative rounded-xl border p-5 text-left transition-all ${
                  websiteTheme === 'dark'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {websiteTheme === 'dark' && (
                  <div className="absolute top-3 right-3">
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 mb-3">
                  <Moon className="h-5 w-5 text-blue-400" />
                </div>
                <h4 className="font-medium text-[#fafaf9] mb-1">Dark</h4>
                <p className="text-xs text-[#fafaf9]/50">
                  Modern, premium look with dark backgrounds
                </p>
              </button>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
              {themeSaved && (
                <span className="flex items-center gap-2 text-sm text-emerald-400">
                  <Check className="h-4 w-4" />
                  Theme saved
                </span>
              )}
              <button
                onClick={handleSaveTheme}
                disabled={savingTheme}
                className="ml-auto flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {savingTheme ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Theme
              </button>
            </div>
          </div>

          {/* Theme Note */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-amber-400 text-sm">About Auto Theme</p>
                <p className="text-sm text-[#fafaf9]/50 mt-1">
                  Auto mode detects your logo's background color. If your logo has a dark background, your website will use dark mode. If your logo has a light or transparent background, your website will use light mode.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'domain' && (
        <div className="space-y-6">
          {/* Subdomain Info */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-medium text-[#fafaf9] mb-2">Default Subdomain</h3>
            <p className="text-sm text-[#fafaf9]/50 mb-4">
              Your website is always available at this URL
            </p>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <Globe className="h-5 w-5 text-[#fafaf9]/50" />
              <span className="flex-1 text-[#fafaf9] font-mono text-sm">{subdomainUrl}</span>
              <button
                onClick={() => copyToClipboard(subdomainUrl, 'subdomain2')}
                className="text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors"
              >
                {copied === 'subdomain2' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Custom Domain */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-medium text-[#fafaf9] mb-2">Custom Domain</h3>
            <p className="text-sm text-[#fafaf9]/50 mb-4">
              Connect your own domain to your marketing website
            </p>

            {domainStatus === 'none' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                    Domain Name
                  </label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="www.yourdomain.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                  <p className="mt-1.5 text-xs text-[#fafaf9]/40">
                    Enter your domain without https://
                  </p>
                </div>
                <button
                  onClick={handleSaveCustomDomain}
                  disabled={!customDomain.trim() || savingDomain}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingDomain ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  Add Custom Domain
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Domain Status */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  domainStatus === 'verified' 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  {domainStatus === 'verified' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${domainStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {domainStatus === 'verified' ? 'Domain Connected' : 'Pending Verification'}
                    </p>
                    <p className="text-sm text-[#fafaf9]/70 font-mono">{customDomain}</p>
                  </div>
                  {domainStatus === 'verified' && (
                    <a
                      href={`https://${customDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* DNS Instructions */}
                {domainStatus === 'pending' && (
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                    <h4 className="font-medium text-[#fafaf9] mb-3">DNS Configuration</h4>
                    <p className="text-sm text-[#fafaf9]/50 mb-4">
                      Add the following CNAME record to your domain's DNS settings:
                    </p>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-[#fafaf9]/50 text-xs uppercase mb-1">Type</p>
                          <p className="text-[#fafaf9] font-mono">CNAME</p>
                        </div>
                        <div>
                          <p className="text-[#fafaf9]/50 text-xs uppercase mb-1">Name</p>
                          <p className="text-[#fafaf9] font-mono">
                            {customDomain.startsWith('www.') ? 'www' : '@'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#fafaf9]/50 text-xs uppercase mb-1">Value</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[#fafaf9] font-mono text-xs truncate">
                              cname.{platformDomain}
                            </p>
                            <button
                              onClick={() => copyToClipboard(`cname.${platformDomain}`, 'cname')}
                              className="text-[#fafaf9]/50 hover:text-[#fafaf9]"
                            >
                              {copied === 'cname' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={handleVerifyDomain}
                        disabled={verifyingDomain}
                        className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                      >
                        {verifyingDomain ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Verify Domain
                      </button>
                      <button
                        onClick={handleRemoveDomain}
                        disabled={savingDomain}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/10 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Verified Actions */}
                {domainStatus === 'verified' && (
                  <button
                    onClick={handleRemoveDomain}
                    disabled={savingDomain}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove custom domain
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}