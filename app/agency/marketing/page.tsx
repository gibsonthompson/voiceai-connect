'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Globe, ExternalLink, Copy, Check, Eye, Link as LinkIcon,
  AlertCircle, CheckCircle2, Loader2, RefreshCw, Palette, Type, Save,
  Sun, Moon, Wand2
} from 'lucide-react';
import { useAgency } from '../context';
import { usePlanFeatures } from '../../../hooks/usePlanFeatures';
import LockedFeature from '@/components/LockedFeature';

type ActiveTab = 'overview' | 'content' | 'colors' | 'domain';

export default function MarketingWebsitePage() {
  const router = useRouter();
  const { agency, branding, loading: agencyLoading, refreshAgency, demoMode } = useAgency();
  const { canUseMarketingSite, planName } = usePlanFeatures();
  
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
  const [extractingColors, setExtractingColors] = useState(false);

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';
  const agencyPrimaryColor = branding.primaryColor || '#10b981';

  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.myvoiceaiconnect.com';
  const subdomainUrl = `https://${agency?.slug || 'demo'}.${platformDomain}`;

  // Demo mode: grant access even if plan doesn't allow it
  const hasAccess = canUseMarketingSite || demoMode;

  useEffect(() => {
    // Skip DNS fetch in demo mode
    if (demoMode) {
      setDnsConfig({ aRecord: '76.76.21.21', cname: 'cname.vercel-dns.com' });
      return;
    }

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
        console.error('Failed to fetch DNS config:', error);
        setDnsConfig({ aRecord: '76.76.21.21', cname: 'cname.vercel-dns.com' });
      }
    };
    if (agency) fetchDnsConfig();
  }, [agency?.marketing_domain, demoMode]);

  useEffect(() => {
    // Demo mode: seed with sample content values
    if (demoMode) {
      setTagline('AI-Powered Phone Answering');
      setHeadline('Never Miss Another Call');
      setSubheadline('Our AI receptionist answers calls 24/7, books appointments, and captures leads — starting at just $49/month.');
      setCustomDomain('voiceai.youragency.com');
      setDomainStatus('verified');
      setPrimaryColor(agency?.primary_color || '#10b981');
      setSecondaryColor(agency?.secondary_color || '#059669');
      setAccentColor(agency?.accent_color || '#34d399');
      setWebsiteTheme(agency?.website_theme === 'dark' ? 'dark' : 'light');
      return;
    }

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
  }, [agency, demoMode]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveContent = async () => {
    // Block mutations in demo mode
    if (demoMode) {
      setContentSaved(true);
      setTimeout(() => setContentSaved(false), 3000);
      return;
    }

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
    // Block mutations in demo mode
    if (demoMode) {
      setColorsSaved(true);
      setTimeout(() => setColorsSaved(false), 3000);
      return;
    }

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
    // Block mutations in demo mode
    if (demoMode) {
      setDomainStatus('pending');
      return;
    }

    if (!customDomain.trim() || !agency) return;
    setSavingDomain(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/agency/${agency.id}/domain`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ domain: customDomain.trim() }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDomainStatus('pending');
        if (data.dns_config) {
          setDnsConfig({ 
            aRecord: data.dns_config.a_record, 
            cname: data.dns_config.cname_record 
          });
        }
        await refreshAgency();
      } else {
        alert(data.error || 'Failed to save domain');
      }
    } catch (error) {
      console.error('Failed to add domain:', error);
      alert('Failed to connect to server.');
    } finally {
      setSavingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    // Block mutations in demo mode
    if (demoMode) {
      setDomainStatus('verified');
      return;
    }

    if (!agency) return;
    setVerifyingDomain(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/agency/${agency.id}/domain/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      setDomainStatus(data.verified ? 'verified' : 'pending');
      
      if (!data.verified) {
        alert(data.message || 'DNS records not found. Please check your configuration and try again.');
      }
      await refreshAgency();
    } catch (error) {
      console.error('Failed to verify domain:', error);
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    // Block mutations in demo mode
    if (demoMode) {
      setCustomDomain('');
      setDomainStatus('none');
      return;
    }

    if (!agency || !confirm('Remove this custom domain? Your site will only be accessible via the subdomain.')) return;
    setSavingDomain(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/agency/${agency.id}/domain`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
      console.error('Failed to remove domain:', error);
      alert('Failed to remove domain.');
    } finally {
      setSavingDomain(false);
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

  // Preview content for locked state
  const PreviewContent = () => (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: textColor }}>Marketing Website</h1>
        <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
          Your public website where clients learn about your service
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Live Site Card */}
        <div 
          className="rounded-xl p-4 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${agencyPrimaryColor}15`, color: agencyPrimaryColor }}
            >
              <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span 
              className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full"
              style={{ backgroundColor: `${agencyPrimaryColor}15`, color: agencyPrimaryColor }}
            >
              <span 
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: agencyPrimaryColor }}
              />
              Live
            </span>
          </div>
          <h3 className="font-medium text-sm sm:text-base mb-1" style={{ color: textColor }}>Your Website</h3>
          <p className="text-xs sm:text-sm mb-3 sm:mb-4 truncate" style={{ color: mutedTextColor }}>{subdomainUrl}</p>
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-white"
              style={{ backgroundColor: agencyPrimaryColor }}
            >
              <Eye className="h-4 w-4" />
              View
            </div>
            <div
              className="flex items-center justify-center rounded-lg px-3 py-2"
              style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
            >
              <Copy className="h-4 w-4" style={{ color: mutedTextColor }} />
            </div>
          </div>
        </div>

        {/* Theme Preview Card */}
        <div 
          className="rounded-xl p-4 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <h3 className="font-medium text-sm sm:text-base mb-1" style={{ color: textColor }}>Current Theme</h3>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex gap-0.5 sm:gap-1">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded" style={{ backgroundColor: primaryColor }} />
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded" style={{ backgroundColor: secondaryColor }} />
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded" style={{ backgroundColor: accentColor }} />
            </div>
            <span className="text-xs sm:text-sm capitalize flex items-center gap-1" style={{ color: mutedTextColor }}>
              {websiteTheme === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
              {websiteTheme}
            </span>
          </div>
          <div
            className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium"
            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: mutedTextColor }}
          >
            <Palette className="h-4 w-4" />
            Customize
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 sm:mb-6 overflow-x-auto" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <nav className="flex gap-4 sm:gap-6 min-w-max">
          {[
            { id: 'overview' as ActiveTab, label: 'Overview', icon: Globe },
            { id: 'content' as ActiveTab, label: 'Content', icon: Type },
            { id: 'colors' as ActiveTab, label: 'Colors', icon: Palette },
            { id: 'domain' as ActiveTab, label: 'Domain', icon: LinkIcon },
          ].map((tab) => (
            <div
              key={tab.id}
              className="flex items-center gap-1.5 sm:gap-2 pb-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap"
              style={tab.id === 'overview' ? {
                borderColor: agencyPrimaryColor,
                color: agencyPrimaryColor,
              } : {
                borderColor: 'transparent',
                color: mutedTextColor,
              }}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </div>
          ))}
        </nav>
      </div>

      {/* Overview Content */}
      <div className="space-y-4 sm:space-y-6">
        <div 
          className="rounded-xl p-4 sm:p-6"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <h3 className="font-medium text-sm sm:text-base mb-3 sm:mb-4" style={{ color: textColor }}>Your website includes:</h3>
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
                <span style={{ color: agencyPrimaryColor }}><CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" /></span>
                <div>
                  <p className="font-medium text-xs sm:text-sm" style={{ color: textColor }}>{item.title}</p>
                  <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Show loading while checking access
  if (agencyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  // If no access (and not in demo mode), show locked overlay with preview
  if (!hasAccess) {
    return (
      <LockedFeature
        title="Marketing Website"
        description="Get a fully-branded marketing website to attract and convert clients."
        requiredPlan="Professional"
        features={[
          'Fully branded landing page',
          'Customizable colors & content',
          'Connect your own domain',
          'Built-in pricing & signup',
        ]}
      >
        <PreviewContent />
      </LockedFeature>
    );
  }

  // Full access - render full interactive page
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold">Marketing Website</h1>
        <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
          Your public website where clients learn about your service
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Live Site Card */}
        <div 
          className="rounded-xl p-4 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${agencyPrimaryColor}15`, color: agencyPrimaryColor }}
            >
              <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span 
              className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full"
              style={{ backgroundColor: `${agencyPrimaryColor}15`, color: agencyPrimaryColor }}
            >
              <span 
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: agencyPrimaryColor }}
              />
              Live
            </span>
          </div>
          <h3 className="font-medium text-sm sm:text-base mb-1">Your Website</h3>
          <p className="text-xs sm:text-sm mb-3 sm:mb-4 truncate" style={{ color: mutedTextColor }}>{subdomainUrl}</p>
          <div className="flex gap-2">
            <a
              href={demoMode ? '#' : subdomainUrl}
              target={demoMode ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={demoMode ? (e) => e.preventDefault() : undefined}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: agencyPrimaryColor }}
            >
              <Eye className="h-4 w-4" />
              View
            </a>
            <button
              onClick={() => copyToClipboard(subdomainUrl, 'subdomain')}
              className={`flex items-center justify-center rounded-lg px-3 py-2 transition-colors ${
                isDark ? 'hover:bg-white/[0.1]' : 'hover:bg-black/[0.05]'
              }`}
              style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
            >
              {copied === 'subdomain' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Theme Preview Card */}
        <div 
          className="rounded-xl p-4 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <h3 className="font-medium text-sm sm:text-base mb-1">Current Theme</h3>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex gap-0.5 sm:gap-1">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded" style={{ backgroundColor: primaryColor, border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb'}` }} />
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded" style={{ backgroundColor: secondaryColor, border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb'}` }} />
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded" style={{ backgroundColor: accentColor, border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb'}` }} />
            </div>
            <span className="text-xs sm:text-sm capitalize flex items-center gap-1" style={{ color: mutedTextColor }}>
              {websiteTheme === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
              {websiteTheme}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('colors')}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
              isDark ? 'hover:bg-white/[0.1]' : 'hover:bg-black/[0.05]'
            }`}
            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
          >
            <Palette className="h-4 w-4" />
            Customize
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 sm:mb-6 overflow-x-auto" style={{ borderBottom: `1px solid ${borderColor}` }}>
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
              className="flex items-center gap-1.5 sm:gap-2 pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
              style={activeTab === tab.id ? {
                borderColor: agencyPrimaryColor,
                color: agencyPrimaryColor,
              } : {
                borderColor: 'transparent',
                color: mutedTextColor,
              }}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium text-sm sm:text-base mb-3 sm:mb-4">Your website includes:</h3>
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
                  <span style={{ color: agencyPrimaryColor }}><CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" /></span>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">{item.title}</p>
                    <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium text-sm sm:text-base mb-3 sm:mb-4">Current Settings</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-wide mb-1 sm:mb-2" style={{ color: mutedTextColor }}>Tagline</p>
                <p className="text-xs sm:text-sm truncate">{tagline || agency?.company_tagline || 'AI-Powered Phone Answering'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-wide mb-1 sm:mb-2" style={{ color: mutedTextColor }}>Headline</p>
                <p className="text-xs sm:text-sm truncate">{headline || agency?.website_headline || 'Never Miss Another Call'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-wide mb-1 sm:mb-2" style={{ color: mutedTextColor }}>Theme</p>
                <p className="text-xs sm:text-sm capitalize">{websiteTheme === 'dark' ? 'Dark' : 'Light'}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-wide mb-1 sm:mb-2" style={{ color: mutedTextColor }}>Logo</p>
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="h-6 sm:h-8 w-auto rounded object-contain p-1" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6' }} />
                ) : (
                  <span className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>Not uploaded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content - Content */}
      {activeTab === 'content' && (
        <div className="space-y-4 sm:space-y-6">
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">Website Content</h3>
            <p className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: mutedTextColor }}>
              Customize the text on your marketing website.
            </p>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>
                  Tagline / Badge
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="AI-Powered Phone Answering"
                  className="w-full rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm transition-colors focus:outline-none"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>
                  Main Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Never Miss Another Call"
                  className="w-full rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm transition-colors focus:outline-none"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>
                  Subheadline
                </label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="AI Receptionist Starting at $49/month"
                  className="w-full rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm transition-colors focus:outline-none"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                />
              </div>
            </div>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderTop: `1px solid ${borderColor}` }}>
              {contentSaved && (
                <span className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: agencyPrimaryColor }}>
                  <Check className="h-4 w-4" />
                  {demoMode ? 'Saved! (demo)' : 'Saved!'}
                </span>
              )}
              <button
                onClick={handleSaveContent}
                disabled={savingContent}
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 sm:py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors w-full sm:w-auto sm:ml-auto"
                style={{ backgroundColor: agencyPrimaryColor }}
              >
                {savingContent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content - Colors */}
      {activeTab === 'colors' && (
        <div className="space-y-4 sm:space-y-6">
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium text-sm sm:text-base mb-3 sm:mb-4">Color Presets</h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-2 sm:p-3 rounded-lg transition-all hover:scale-105"
                  style={primaryColor === preset.primary ? {
                    backgroundColor: `${agencyPrimaryColor}15`,
                    border: `2px solid ${agencyPrimaryColor}`,
                  } : {
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div className="flex gap-0.5 mb-1 sm:mb-2 justify-center">
                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full" style={{ backgroundColor: preset.secondary }} />
                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-center truncate" style={{ color: mutedTextColor }}>{preset.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div 
            className="rounded-xl p-4 sm:p-6 flex justify-end"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            {colorsSaved && (
              <span className="flex items-center gap-2 text-xs sm:text-sm mr-4" style={{ color: agencyPrimaryColor }}>
                <Check className="h-4 w-4" />
                {demoMode ? 'Saved! (demo)' : 'Saved!'}
              </span>
            )}
            <button
              onClick={handleSaveColors}
              disabled={savingColors}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 sm:py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors"
              style={{ backgroundColor: agencyPrimaryColor }}
            >
              {savingColors ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Colors
            </button>
          </div>
        </div>
      )}

      {/* Tab Content - Domain */}
      {activeTab === 'domain' && (
        <div className="space-y-4 sm:space-y-6">
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">Default Subdomain</h3>
            <p className="text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: mutedTextColor }}>Always available at this URL</p>
            <div 
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg"
              style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}` }}
            >
              <span style={{ color: mutedTextColor }}><Globe className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /></span>
              <span className="flex-1 text-xs sm:text-sm font-mono truncate">{subdomainUrl}</span>
              <button
                onClick={() => copyToClipboard(subdomainUrl, 'subdomain2')}
                className="flex-shrink-0 transition-colors"
                style={{ color: mutedTextColor }}
              >
                {copied === 'subdomain2' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <h3 className="font-medium text-sm sm:text-base">Custom Domain</h3>
              {domainStatus === 'verified' && (
                <span 
                  className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
                  style={{ backgroundColor: `${agencyPrimaryColor}15`, color: agencyPrimaryColor }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
              {domainStatus === 'pending' && (
                <span 
                  className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: isDark ? '#fbbf24' : '#d97706' }}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Pending
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: mutedTextColor }}>Connect your own domain</p>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>Domain Name</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="w-full rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm transition-colors focus:outline-none"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {domainStatus === 'none' && (
                  <button
                    onClick={handleSaveCustomDomain}
                    disabled={!customDomain.trim() || savingDomain}
                    className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 sm:py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ backgroundColor: agencyPrimaryColor }}
                  >
                    {savingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                    Add Domain
                  </button>
                )}
                {domainStatus === 'pending' && (
                  <>
                    <button
                      onClick={handleVerifyDomain}
                      disabled={verifyingDomain}
                      className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 sm:py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                      style={{ backgroundColor: agencyPrimaryColor }}
                    >
                      {verifyingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Verify DNS
                    </button>
                    <button
                      onClick={handleRemoveDomain}
                      disabled={savingDomain}
                      className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 sm:py-2.5 text-sm font-medium transition-colors"
                      style={{ 
                        color: isDark ? '#f87171' : '#dc2626',
                        backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                        border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
                      }}
                    >
                      Remove
                    </button>
                  </>
                )}
                {domainStatus === 'verified' && (
                  <button
                    onClick={handleRemoveDomain}
                    disabled={savingDomain}
                    className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 sm:py-2.5 text-sm font-medium transition-colors"
                    style={{ 
                      color: isDark ? '#f87171' : '#dc2626',
                      backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                      border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
                    }}
                  >
                    Remove Domain
                  </button>
                )}
              </div>
            </div>

            {/* DNS Instructions for pending */}
            {domainStatus === 'pending' && dnsConfig && (
              <div 
                className="mt-4 rounded-lg p-4"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', border: `1px solid ${borderColor}` }}
              >
                <p className="text-xs font-medium mb-3" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>
                  Add these DNS records at your domain registrar:
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: inputBg }}>
                    <span style={{ color: mutedTextColor }}>A Record → {dnsConfig.aRecord}</span>
                    <button onClick={() => copyToClipboard(dnsConfig.aRecord, 'a-record')} style={{ color: mutedTextColor }}>
                      {copied === 'a-record' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: inputBg }}>
                    <span style={{ color: mutedTextColor }}>CNAME → {dnsConfig.cname}</span>
                    <button onClick={() => copyToClipboard(dnsConfig.cname, 'cname')} style={{ color: mutedTextColor }}>
                      {copied === 'cname' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}