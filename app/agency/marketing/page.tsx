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
  Save,
  Sun,
  Moon,
  Wand2,
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

  // DNS config (fetched from backend)
  const [dnsConfig, setDnsConfig] = useState<{ aRecord: string; cname: string } | null>(null);

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.myvoiceaiconnect.com';
  const subdomainUrl = `https://${agency?.slug}.${platformDomain}`;

  // Fetch DNS config when domain changes
  useEffect(() => {
    const fetchDnsConfig = async () => {
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
        // Use defaults
        setDnsConfig({
          aRecord: '76.76.21.21',
          cname: 'cname.vercel-dns.com'
        });
      }
    };
    fetchDnsConfig();
  }, [backendUrl, agency?.marketing_domain]);

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
      // Load colors
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
      } else {
        const data = await response.json();
        console.error('Failed to save content:', data);
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
      } else {
        const data = await response.json();
        console.error('Failed to save colors:', data);
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
    console.log('🌐 Saving domain:', customDomain.trim());
    console.log('🔗 Backend URL:', backendUrl);
    console.log('🏢 Agency ID:', agency.id);
    
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = `${backendUrl}/api/agency/${agency.id}/domain`;
      console.log('📡 API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
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
      
      if (response.ok && data.success) {
        setDomainStatus('pending');
        // Update DNS config if returned
        if (data.dns_instructions?.primary) {
          const primary = data.dns_instructions.primary;
          if (primary.type === 'A') {
            setDnsConfig(prev => prev ? { ...prev, aRecord: primary.value } : { aRecord: primary.value, cname: 'cname.vercel-dns.com' });
          }
        }
        await refreshAgency();
      } else {
        console.error('❌ Failed to save domain:', data.error);
        alert(data.error || 'Failed to save domain');
      }
    } catch (error) {
      console.error('❌ Failed to save domain:', error);
      alert('Failed to connect to server. Check console for details.');
    } finally {
      setSavingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!agency) return;
    
    setVerifyingDomain(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/domain/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const data = await response.json();
      setDomainStatus(data.verified ? 'verified' : 'pending');
      
      if (!data.verified) {
        // Show helpful message
        alert(data.message || 'DNS records not found. Please check your configuration.');
      }
      
      await refreshAgency();
    } catch (error) {
      console.error('Failed to verify domain:', error);
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!agency) {
      console.log('❌ No agency');
      return;
    }
    
    if (!confirm('Are you sure you want to remove this custom domain?')) {
      console.log('❌ User cancelled');
      return;
    }
    
    console.log('🗑️ Removing domain...');
    console.log('📡 API URL:', `${backendUrl}/api/agency/${agency.id}/domain`);
    
    setSavingDomain(true);
    try {
      const token = localStorage.getItem('auth_token');
      console.log('🔑 Token exists:', !!token);
      
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/domain`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (response.ok && data.success) {
        setCustomDomain('');
        setDomainStatus('none');
        await refreshAgency();
      } else {
        console.error('❌ Failed to remove domain:', data.error);
        alert(data.error || 'Failed to remove domain');
      }
    } catch (error) {
      console.error('❌ Failed to remove domain:', error);
      alert('Failed to remove domain. Check console for details.');
    } finally {
      setSavingDomain(false);
    }
  };

  const [extractingColors, setExtractingColors] = useState(false);

  // Extract colors from logo
  const extractColorsFromLogo = async () => {
    if (!branding.logoUrl) return;
    
    setExtractingColors(true);
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load logo'));
        img.src = branding.logoUrl!;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Sample at reasonable size
      const size = Math.min(img.width, img.height, 100);
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      const pixels = imageData.data;
      
      // Collect colors (skip transparent and near-white/black)
      const colors: { r: number; g: number; b: number; count: number }[] = [];
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        // Skip transparent pixels
        if (a < 128) continue;
        
        // Skip near-white and near-black
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        if (luminance > 240 || luminance < 15) continue;
        
        // Quantize to reduce similar colors
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        
        const existing = colors.find(c => c.r === qr && c.g === qg && c.b === qb);
        if (existing) {
          existing.count++;
        } else {
          colors.push({ r: qr, g: qg, b: qb, count: 1 });
        }
      }
      
      // Sort by frequency
      colors.sort((a, b) => b.count - a.count);
      
      if (colors.length === 0) {
        console.log('No suitable colors found in logo');
        return;
      }
      
      // Convert to hex
      const toHex = (c: { r: number; g: number; b: number }) => 
        '#' + [c.r, c.g, c.b].map(x => Math.min(255, x).toString(16).padStart(2, '0')).join('');
      
      // Darken a color
      const darken = (c: { r: number; g: number; b: number }, amount: number) => ({
        r: Math.max(0, c.r - amount),
        g: Math.max(0, c.g - amount),
        b: Math.max(0, c.b - amount),
      });
      
      // Lighten a color
      const lighten = (c: { r: number; g: number; b: number }, amount: number) => ({
        r: Math.min(255, c.r + amount),
        g: Math.min(255, c.g + amount),
        b: Math.min(255, c.b + amount),
      });
      
      // Use top color as primary
      const primary = colors[0];
      setPrimaryColor(toHex(primary));
      
      // Secondary is darker version of primary
      setSecondaryColor(toHex(darken(primary, 40)));
      
      // Accent is second most common or lighter version of primary
      if (colors.length > 1) {
        setAccentColor(toHex(colors[1]));
      } else {
        setAccentColor(toHex(lighten(primary, 60)));
      }
      
    } catch (error) {
      console.error('Failed to extract colors:', error);
    } finally {
      setExtractingColors(false);
    }
  };

  // Color presets
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#fafaf9]">Marketing Website</h1>
        <p className="mt-1 text-[#fafaf9]/50">
          Your public website where potential clients can learn about your AI receptionist service
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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

        {/* Theme Preview Card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
              <Palette className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
          </div>
          <h3 className="font-medium text-[#fafaf9] mb-1">Current Theme</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex gap-1">
              <div className="h-6 w-6 rounded border border-white/20" style={{ backgroundColor: primaryColor }} title="Primary" />
              <div className="h-6 w-6 rounded border border-white/20" style={{ backgroundColor: secondaryColor }} title="Secondary" />
              <div className="h-6 w-6 rounded border border-white/20" style={{ backgroundColor: accentColor }} title="Accent" />
            </div>
            <span className="text-sm text-[#fafaf9]/50 capitalize flex items-center gap-1">
              {websiteTheme === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
              {websiteTheme} mode
            </span>
          </div>
          <button
            onClick={() => setActiveTab('colors')}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/10 transition-colors"
          >
            <Palette className="h-4 w-4" />
            Customize Colors
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-6">
        <nav className="flex gap-6">
          {[
            { id: 'overview' as ActiveTab, label: 'Overview', icon: Globe },
            { id: 'content' as ActiveTab, label: 'Content', icon: Type },
            { id: 'colors' as ActiveTab, label: 'Colors & Theme', icon: Palette },
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
                { title: 'Hero Section', desc: 'Eye-catching headline with call-to-action buttons' },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-2">Tagline</p>
                <p className="text-[#fafaf9] text-sm">{agency?.company_tagline || 'AI-Powered Phone Answering'}</p>
              </div>
              <div>
                <p className="text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-2">Headline</p>
                <p className="text-[#fafaf9] text-sm">{agency?.website_headline || 'Never Miss Another Call'}</p>
              </div>
              <div>
                <p className="text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-2">Theme</p>
                <p className="text-[#fafaf9] text-sm capitalize">{agency?.website_theme === 'dark' ? 'Dark' : 'Light'}</p>
              </div>
              <div>
                <p className="text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-2">Logo</p>
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto rounded object-contain bg-white/10 p-1" />
                ) : (
                  <span className="text-[#fafaf9]/50 text-sm">Not uploaded</span>
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
              Customize the text that appears on your marketing website. Leave blank to use defaults.
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
              <div>
                {contentSaved && (
                  <span className="flex items-center gap-2 text-sm text-emerald-400">
                    <Check className="h-4 w-4" />
                    Content saved successfully
                  </span>
                )}
              </div>
              <button
                onClick={handleSaveContent}
                disabled={savingContent}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
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

      {activeTab === 'colors' && (
        <div className="space-y-6">
          {/* Theme Selection */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-medium text-[#fafaf9] mb-2">Website Theme</h3>
            <p className="text-sm text-[#fafaf9]/50 mb-4">
              Choose light or dark mode for your marketing website
            </p>

            <div className="grid grid-cols-2 gap-4">
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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 mb-3">
                  <Sun className="h-5 w-5 text-amber-500" />
                </div>
                <h4 className="font-medium text-[#fafaf9] mb-1">Light Mode</h4>
                <p className="text-xs text-[#fafaf9]/50">
                  Clean, professional look with white backgrounds
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
                <h4 className="font-medium text-[#fafaf9] mb-1">Dark Mode</h4>
                <p className="text-xs text-[#fafaf9]/50">
                  Modern, premium look with dark backgrounds
                </p>
              </button>
            </div>
          </div>

          {/* Color Presets */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[#fafaf9]">Color Presets</h3>
              {branding.logoUrl && (
                <button
                  onClick={extractColorsFromLogo}
                  disabled={extractingColors}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-medium text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
                >
                  {extractingColors ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Extract from Logo
                </button>
              )}
            </div>
            <p className="text-sm text-[#fafaf9]/50 mb-4">
              {branding.logoUrl 
                ? 'Extract colors from your logo or choose a preset below'
                : 'Choose a preset or customize individual colors below'}
            </p>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {!branding.logoUrl && (
                <div className="col-span-4 md:col-span-8 mb-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400">
                    💡 Upload a logo in Settings → Branding to enable automatic color extraction
                  </p>
                </div>
              )}
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-lg border transition-all hover:scale-105 ${
                    primaryColor === preset.primary
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="flex gap-0.5 mb-2 justify-center">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <p className="text-[10px] text-[#fafaf9]/70 text-center truncate">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-medium text-[#fafaf9] mb-4">Custom Colors</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-14 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#fafaf9] font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#fafaf9]/40">
                  Buttons, links, accents
                </p>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-14 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#fafaf9] font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#fafaf9]/40">
                  Hover states, gradients
                </p>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-14 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#fafaf9] font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#fafaf9]/40">
                  Highlights, badges
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
              <p className="text-xs text-[#fafaf9]/50 uppercase tracking-wide mb-3">Preview</p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="px-4 py-2 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Secondary Button
                </button>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  Accent Badge
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
              <div>
                {colorsSaved && (
                  <span className="flex items-center gap-2 text-sm text-emerald-400">
                    <Check className="h-4 w-4" />
                    Colors saved successfully
                  </span>
                )}
              </div>
              <button
                onClick={handleSaveColors}
                disabled={savingColors}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {savingColors ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Colors & Theme
              </button>
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
                    placeholder="yourdomain.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
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
                      Add the following DNS records with your domain registrar:
                    </p>
                    
                    {/* Show different instructions based on domain type */}
                    {customDomain.startsWith('www.') ? (
                      // WWW subdomain - just CNAME
                      <div className="space-y-3">
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
                    ) : (
                      // Apex domain - needs A record
                      <div className="space-y-3">
                        {/* A Record for apex */}
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
                        
                        {/* Optional CNAME for www redirect */}
                        <p className="text-xs text-[#fafaf9]/40 mt-2">Optional: Add www redirect</p>
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
                    )}
                    
                    <p className="text-xs text-[#fafaf9]/40 mt-4">
                      DNS changes can take up to 48 hours to propagate worldwide.
                    </p>
                    
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