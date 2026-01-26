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
  Phone,
  FileText,
  Settings2
} from 'lucide-react';
import { useAgency } from '../context';

export default function MarketingWebsitePage() {
  const { agency, branding } = useAgency();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'domain' | 'content'>('overview');
  
  // Domain state
  const [customDomain, setCustomDomain] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [domainStatus, setDomainStatus] = useState<'none' | 'pending' | 'verified'>('none');

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const subdomainUrl = `https://${agency?.slug}.${platformDomain}`;

  useEffect(() => {
    // Load existing custom domain if set
    if (agency?.marketing_domain) {
      setCustomDomain(agency.marketing_domain);
      setDomainStatus(agency.domain_verified ? 'verified' : 'pending');
    }
  }, [agency]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveCustomDomain = async () => {
    if (!customDomain.trim()) return;
    
    setSavingDomain(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agency/${agency?.id}/domain`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ marketing_domain: customDomain.trim().toLowerCase() }),
      });
      
      if (response.ok) {
        setDomainStatus('pending');
      }
    } catch (error) {
      console.error('Failed to save domain:', error);
    } finally {
      setSavingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    setVerifyingDomain(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agency/${agency?.id}/domain/verify`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      const data = await response.json();
      setDomainStatus(data.verified ? 'verified' : 'pending');
    } catch (error) {
      console.error('Failed to verify domain:', error);
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleRemoveDomain = async () => {
    setSavingDomain(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agency/${agency?.id}/domain`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        setCustomDomain('');
        setDomainStatus('none');
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
            href="/agency/settings/branding"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/10 transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            Edit Branding
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
            href="/agency/settings/pricing"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/10 transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            Edit Pricing
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-6">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'domain', label: 'Custom Domain', icon: LinkIcon },
            { id: 'content', label: 'Content (Coming Soon)', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              disabled={tab.id === 'content'}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : tab.id === 'content'
                  ? 'border-transparent text-[#fafaf9]/30 cursor-not-allowed'
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {activeTab === 'content' && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mx-auto mb-4">
            <FileText className="h-6 w-6 text-[#fafaf9]/50" />
          </div>
          <h3 className="font-medium text-[#fafaf9] mb-2">Content Editor Coming Soon</h3>
          <p className="text-sm text-[#fafaf9]/50 max-w-md mx-auto">
            You'll be able to customize headlines, descriptions, testimonials, FAQs, and more directly from this dashboard.
          </p>
        </div>
      )}
    </div>
  );
}