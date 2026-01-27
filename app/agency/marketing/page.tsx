'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, ExternalLink, Copy, Check, Eye, Link as LinkIcon,
  AlertCircle, CheckCircle2, Loader2, RefreshCw, Palette, Type, Save,
  Sun, Moon, Wand2
} from 'lucide-react';
import { useAgency } from '../context';

type ActiveTab = 'overview' | 'content' | 'colors' | 'domain';

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

  // Colors state
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#059669');
  const [accentColor, setAccentColor] = useState('#34d399');
  const [websiteTheme, setWebsiteTheme] = useState<'light' | 'dark'>('light');
  const [savingColors, setSavingColors] = useState(false);
  const [colorsSaved, setColorsSaved] = useState(false);

  const [dnsConfig, setDnsConfig] = useState<{ aRecord: string; cname: string } | null>(null);

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.myvoiceaiconnect.com';
  const subdomainUrl = `https://${agency?.slug}.${platformDomain}`;

  useEffect(() => {
    const fetchDnsConfig = async () => {
      try {
        const domainParam = agency?.marketing_domain ? `?domain=${agency.marketing_domain}` : '';
        const response = await fetch(`/api/domain/dns-config${domainParam}`);
        if (response.ok) {
          const data = await response.json();
          setDnsConfig({
            aRecord: data.a_record || '76.76.21.21',
            cname: data.cname_record || 'cname.vercel-dns.com'
          });
        }
      } catch (error) {
        setDnsConfig({ aRecord: '76.76.21.21', cname: 'cname.vercel-dns.com' });
      }
    };
    fetchDnsConfig();
  }, [agency?.marketing_domain]);

  useEffect(() => {
    if (agency) {
      if (agency.marketing_domain) {
        setCustomDomain(agency.marketing_domain);
        setDomainStatus(agency.domain_verified ? 'verified' : 'pending');
      }
      setTagline(agency.company_tagline || '');
      setHeadline(agency.website_headline || '');
      setSubheadline(agency.website_subheadline || '');
      setPrimaryColor(agency.primary_color || '#10b981');
      setSecondaryColor(agency.secondary_color || '#059669');
      setAccentColor(agency.accent_color || '#34d399');
      setWebsiteTheme(agency.website_theme === 'dark' ? 'dark' : 'light');
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
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          company_tagline: tagline || null,
          website_headline: headline || null,
          website_subheadline: subheadline || null,
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

  const handleSaveColors = async () => {
    if (!agency) return;
    setSavingColors(true);
    setColorsSaved(false);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
          website_theme: websiteTheme,
        }),
      });
      
      if (response.ok) {
        await refreshAgency();
        setColorsSaved(true);
        setTimeout(() => setColorsSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save colors:', error);
    } finally {
      setSavingColors(false);
    }
  };

  const handleSaveCustomDomain = async () => {
    if (!customDomain.trim() || !agency) return;
    setSavingDomain(true);
    
    try {
      const response = await fetch(`/api/agency/${agency.id}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: customDomain.trim() }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDomainStatus('pending');
        if (data.dns_config) {
          setDnsConfig({ aRecord: data.dns_config.a_record, cname: data.dns_config.cname_record });
        }
        await refreshAgency();
      } else {
        alert(data.error || 'Failed to save domain');
      }
    } catch (error) {
      alert('Failed to connect to server.');
    } finally {
      setSavingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!agency) return;
    setVerifyingDomain(true);
    
    try {
      const response = await fetch(`/api/agency/${agency.id}/domain/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      setDomainStatus(data.verified ? 'verified' : 'pending');
      
      if (!data.verified) {
        alert(data.message || 'DNS records not found.');
      }
      await refreshAgency();
    } catch (error) {
      console.error('Failed to verify domain:', error);
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!agency || !confirm('Remove this custom domain?')) return;
    setSavingDomain(true);
    
    try {
      const response = await fetch(`/api/agency/${agency.id}/domain`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCustomDomain('');
        setDomainStatus('none');
        await refreshAgency();
      } else {
        alert(data.error || 'Failed to remove domain');
      }
    } catch (error) {
      alert('Failed to remove domain.');
    } finally {
      setSavingDomain(false);
    }
  };

  const [extractingColors, setExtractingColors] = useState(false);

  const extractColorsFromLogo = async () => {
    if (!branding.logoUrl) return;
    setExtractingColors(true);
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = branding.logoUrl!;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const size = Math.min(img.width, img.height, 100);
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      const pixels = imageData.data;
      const colors: { r: number; g: number; b: number; count: number }[] = [];
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
        if (a < 128) continue;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        if (luminance > 240 || luminance < 15) continue;
        
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        
        const existing = colors.find(c => c.r === qr && c.g === qg && c.b === qb);
        if (existing) existing.count++;
        else colors.push({ r: qr, g: qg, b: qb, count: 1 });
      }
      
      colors.sort((a, b) => b.count - a.count);
      if (colors.length === 0) return;
      
      const toHex = (c: { r: number; g: number; b: number }) => 
        '#' + [c.r, c.g, c.b].map(x => Math.min(255, x).toString(16).padStart(2, '0')).join('');
      
      const darken = (c: { r: number; g: number; b: number }, amt: number) => ({
        r: Math.max(0, c.r - amt), g: Math.max(0, c.g - amt), b: Math.max(0, c.b - amt)
      });
      
      const lighten = (c: { r: number; g: number; b: number }, amt: number) => ({
        r: Math.min(255, c.r + amt), g: Math.min(255, c.g + amt), b: Math.min(255, c.b + amt)
      });
      
      const primary = colors[0];
      setPrimaryColor(toHex(primary));
      setSecondaryColor(toHex(darken(primary, 40)));
      setAccentColor(colors.length > 1 ? toHex(colors[1]) : toHex(lighten(primary, 60)));
    } catch (error) {
      console.error('Failed to extract colors:', error);
    } finally {
      setExtractingColors(false);
    }
  };

  const colorPresets = [
    { name: 'Emerald', primary: '#10b981', secondary: '#059669', accent: '#34d399' },
    { name: 'Blue', primary: '#3b82f6', secondary: '#2563eb', accent: '#60a5fa' },
    { name: 'Purple', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa' },
    { name: 'Red', primary: '#ef4444', secondary: '#dc2626', accent: '#f87171' },
    { name: 'Orange', primary: '#f97316', secondary: '#ea580c', accent: '#fb923c' },
    { name: 'Teal', primary: '#14b8a6', secondary: '#0d9488', accent: '#2dd4bf' },
    { name: 'Navy', primary: '#122092', secondary: '#0d1666', accent: '#f6b828' },
    { name: 'Rose', primary: '#f43f5e', secondary: '#e11d48', accent: '#fb7185' },
  ];

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#fafaf9]">Marketing Website</h1>
        <p className="mt-1 text-sm text-[#fafaf9]/50">
          Your public website where clients learn about your service
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Live Site Card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
            </div>
            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 sm:py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <h3 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-1">Your Website</h3>
          <p className="text-xs sm:text-sm text-[#fafaf9]/50 mb-3 sm:mb-4 truncate">{subdomainUrl}</p>
          <div className="flex gap-2">
            <a
              href={subdomainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View
            </a>
            <button
              onClick={() => copyToClipboard(subdomainUrl, 'subdomain')}
              className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[#fafaf9]/70 hover:bg-white/10 transition-colors"
            >
              {copied === 'subdomain' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Theme Preview Card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
              <Palette className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: primaryColor }} />
            </div>
          </div>
          <h3 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-1">Current Theme</h3>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex gap-0.5 sm:gap-1">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded border border-white/20" style={{ backgroundColor: primaryColor }} />
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded border border-white/20" style={{ backgroundColor: secondaryColor }} />
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded border border-white/20" style={{ backgroundColor: accentColor }} />
            </div>
            <span className="text-xs sm:text-sm text-[#fafaf9]/50 capitalize flex items-center gap-1">
              {websiteTheme === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
              {websiteTheme}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('colors')}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm font-medium text-[#fafaf9]/70 hover:bg-white/10 transition-colors"
          >
            <Palette className="h-4 w-4" />
            Customize
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-4 sm:mb-6 overflow-x-auto">
        <nav className="flex gap-4 sm:gap-6 min-w-max">
          {[
            { id: 'overview' as ActiveTab, label: 'Overview', icon: Globe },
            { id: 'content' as ActiveTab, label: 'Content', icon: Type },
            { id: 'colors' as ActiveTab, label: 'Colors', icon: Palette },
            { id: 'domain' as ActiveTab, label: 'Domain', icon: LinkIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
            <h3 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-3 sm:mb-4">Your website includes:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { title: 'Hero Section', desc: 'Eye-catching headline with CTAs' },
                { title: 'Features Overview', desc: 'AI receptionist capabilities' },
                { title: 'How It Works', desc: '4-step process to get started' },
                { title: 'Pricing Plans', desc: 'Starter, Pro, and Growth tiers' },
                { title: 'Testimonials', desc: 'Social proof section' },
                { title: 'FAQ Section', desc: 'Common questions answered' },
                { title: 'Industry Cards', desc: 'Industries you serve' },
                { title: 'Comparison Table', desc: 'Compare vs competitors' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-xs sm:text-sm text-[#fafaf9]">{item.title}</p>
                    <p className="text-[10px] sm:text-xs text-[#fafaf9]/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
            <h3 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-3 sm:mb-4">Current Settings</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-1 sm:mb-2">Tagline</p>
                <p className="text-xs sm:text-sm text-[#fafaf9] truncate">{agency?.company_tagline || 'AI-Powered Phone Answering'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-1 sm:mb-2">Headline</p>
                <p className="text-xs sm:text-sm text-[#fafaf9] truncate">{agency?.website_headline || 'Never Miss Another Call'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-1 sm:mb-2">Theme</p>
                <p className="text-xs sm:text-sm text-[#fafaf9] capitalize">{agency?.website_theme === 'dark' ? 'Dark' : 'Light'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-1 sm:mb-2">Logo</p>
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="h-6 sm:h-8 w-auto rounded object-contain bg-white/10 p-1" />
                ) : (
                  <span className="text-xs sm:text-sm text-[#fafaf9]/50">Not uploaded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
            <h3 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-1 sm:mb-2">Website Content</h3>
            <p className="text-xs sm:text-sm text-[#fafaf9]/50 mb-4 sm:mb-6">
              Customize the text on your marketing website.
            </p>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#fafaf9]/70 mb-1.5 sm:mb-2">
                  Tagline / Badge
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="AI-Powered Phone Answering"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#fafaf9]/70 mb-1.5 sm:mb-2">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Never Miss Another Call"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#fafaf9]/70 mb-1.5 sm:mb-2">
                  Subheadline
                </label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="AI Receptionist Starting at $49/month"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {contentSaved && (
                <span className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400">
                  <Check className="h-4 w-4" />
                  Saved!
                </span>
              )}
              <button
                onClick={handleSaveContent}
                disabled={savingContent}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 sm:py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors w-full sm:w-auto sm:ml-auto"
              >
                {savingContent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Content
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'colors' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Theme Selection */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
            <h3 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-1 sm:mb-2">Website Theme</h3>
            <p className="text-xs sm:text-sm text-[#fafaf9]/50 mb-3 sm:mb-4">
              Choose light or dark mode
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => setWebsiteTheme('light')}
                className={`relative rounded-xl border p-4 sm:p-5 text-left transition-all ${
                  websiteTheme === 'light'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {websiteTheme === 'light' && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                  </div>
                )}
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white border border-gray-200 mb-2 sm:mb-3">
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                </div>
                <h4 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-0.5 sm:mb-1">Light</h4>
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/50">Clean, white backgrounds</p>
              </button>

              <button
                onClick={() => setWebsiteTheme('dark')}
                className={`relative rounded-xl border p-4 sm:p-5 text-left transition-all ${
                  websiteTheme === 'dark'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {websiteTheme === 'dark' && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                  </div>
                )}
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gray-900 mb-2 sm:mb-3">
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <h4 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-0.5 sm:mb-1">Dark</h4>
                <p className="text-[10px] sm:text-xs text-[#fafaf9]/50">Modern, dark backgrounds</p>
              </button>
            </div>
          </div>

          {/* Color Presets */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
              <h3 className="font-medium text-sm sm:text-base text-[#fafaf9]">Color Presets</h3>
              {branding.logoUrl && (
                <button
                  onClick={extractColorsFromLogo}
                  disabled={extractingColors}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-medium text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all w-full sm:w-auto justify-center"
                >
                  {extractingColors ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  Extract from Logo
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`p-2 sm:p-3 rounded-lg border transition-all hover:scale-105 ${
                    primaryColor === preset.primary
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="flex gap-0.5 mb-1 sm:mb-2 justify-center">
                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-[#fafaf9]/70 text-center truncate">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
            <h3 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-3 sm:mb-4">Custom Colors</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { label: 'Primary', value: primaryColor, setter: setPrimaryColor, desc: 'Buttons, links' },
                { label: 'Secondary', value: secondaryColor, setter: setSecondaryColor, desc: 'Hover states' },
                { label: 'Accent', value: accentColor, setter: setAccentColor, desc: 'Highlights' },
              ].map((color) => (
                <div key={color.label}>
                  <label className="block text-xs sm:text-sm font-medium text-[#fafaf9]/70 mb-1.5 sm:mb-2">{color.label}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={color.value}
                      onChange={(e) => color.setter(e.target.value)}
                      className="h-9 sm:h-10 w-12 sm:w-14 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color.value}
                      onChange={(e) => color.setter(e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#fafaf9] font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <p className="mt-1 text-[10px] sm:text-xs text-[#fafaf9]/40">{color.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {colorsSaved && (
                <span className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400">
                  <Check className="h-4 w-4" />
                  Colors saved!
                </span>
              )}
              <button
                onClick={handleSaveColors}
                disabled={savingColors}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 sm:py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors w-full sm:w-auto sm:ml-auto"
              >
                {savingColors ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Colors
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'domain' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Subdomain Info */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
            <h3 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-1 sm:mb-2">Default Subdomain</h3>
            <p className="text-xs sm:text-sm text-[#fafaf9]/50 mb-3 sm:mb-4">Always available at this URL</p>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-[#fafaf9]/50 flex-shrink-0" />
              <span className="flex-1 text-xs sm:text-sm text-[#fafaf9] font-mono truncate">{subdomainUrl}</span>
              <button
                onClick={() => copyToClipboard(subdomainUrl, 'subdomain2')}
                className="text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors flex-shrink-0"
              >
                {copied === 'subdomain2' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Custom Domain */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
            <h3 className="font-medium text-sm sm:text-base text-[#fafaf9] mb-1 sm:mb-2">Custom Domain</h3>
            <p className="text-xs sm:text-sm text-[#fafaf9]/50 mb-3 sm:mb-4">Connect your own domain</p>

            {domainStatus === 'none' ? (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#fafaf9]/70 mb-1.5 sm:mb-2">Domain Name</label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSaveCustomDomain}
                  disabled={!customDomain.trim() || savingDomain}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 sm:py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                >
                  {savingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                  Add Domain
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border ${
                  domainStatus === 'verified' 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  {domainStatus === 'verified' ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${domainStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {domainStatus === 'verified' ? 'Connected' : 'Pending'}
                    </p>
                    <p className="text-xs sm:text-sm text-[#fafaf9]/70 font-mono truncate">{customDomain}</p>
                  </div>
                  {domainStatus === 'verified' && (
                    <a href={`https://${customDomain}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 flex-shrink-0">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {domainStatus === 'pending' && (
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 sm:p-4">
                    <h4 className="font-medium text-sm text-[#fafaf9] mb-2 sm:mb-3">DNS Configuration</h4>
                    <p className="text-xs text-[#fafaf9]/50 mb-3 sm:mb-4">Add these records with your registrar:</p>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs p-2 sm:p-3 rounded-lg bg-white/[0.02]">
                        <div>
                          <p className="text-[#fafaf9]/50 text-[10px] uppercase mb-0.5 sm:mb-1">Type</p>
                          <p className="text-[#fafaf9] font-mono font-medium">A</p>
                        </div>
                        <div>
                          <p className="text-[#fafaf9]/50 text-[10px] uppercase mb-0.5 sm:mb-1">Name</p>
                          <p className="text-[#fafaf9] font-mono">@</p>
                        </div>
                        <div>
                          <p className="text-[#fafaf9]/50 text-[10px] uppercase mb-0.5 sm:mb-1">Value</p>
                          <div className="flex items-center gap-1">
                            <p className="text-[#fafaf9] font-mono text-[10px] truncate">{dnsConfig?.aRecord}</p>
                            <button onClick={() => copyToClipboard(dnsConfig?.aRecord || '', 'arecord')} className="text-[#fafaf9]/50 hover:text-[#fafaf9] flex-shrink-0">
                              {copied === 'arecord' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-[#fafaf9]/40 mt-3">DNS changes can take up to 48 hours.</p>
                    
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={handleVerifyDomain}
                        disabled={verifyingDomain}
                        className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                      >
                        {verifyingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Verify
                      </button>
                      <button
                        onClick={handleRemoveDomain}
                        disabled={savingDomain}
                        className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/10 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

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