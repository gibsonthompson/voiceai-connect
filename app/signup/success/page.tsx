'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Phone, Loader2, CheckCircle2, ArrowRight, Copy, Check } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const isLightColor = (hex: string): boolean => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
};

// ============================================================================
// CLIENT SUCCESS PAGE (for agency subdomains)
// ============================================================================
function ClientSuccessPage({ agency }: { agency: Agency | null }) {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  
  const phoneNumber = searchParams.get('phone');
  const businessName = searchParams.get('business');

  const handleCopyPhone = () => {
    if (phoneNumber) {
      navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const primaryColor = agency?.primary_color || '#2563eb';
  const accentColor = agency?.accent_color || '#3b82f6';
  const primaryLight = isLightColor(primaryColor);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {agency?.logo_url ? (
                <img src={agency.logo_url} alt={agency.name} className="h-9 w-9 rounded-lg object-contain" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: primaryColor }}>
                  <Phone className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
                </div>
              )}
              <span className="text-lg font-medium tracking-tight">{agency?.name || 'AI Receptionist'}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative min-h-screen flex items-center justify-center px-6 py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-[0.07]" style={{ backgroundColor: primaryColor }} />
        </div>

        <div className="relative w-full max-w-lg">
          <div className="mb-8 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="h-2 w-12 rounded-full transition-colors" style={{ backgroundColor: primaryColor }} />
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111] p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${accentColor}1A` }}>
              <CheckCircle2 className="h-8 w-8" style={{ color: accentColor }} />
            </div>

            <h1 className="text-2xl font-medium tracking-tight mb-2">You&apos;re All Set!</h1>
            <p className="text-[#f5f5f0]/50 mb-8">
              {businessName ? `Your AI receptionist for ${businessName} is ready.` : 'Your AI receptionist is ready to take calls.'}
            </p>

            {phoneNumber && (
              <div className="mb-8">
                <p className="text-sm text-[#f5f5f0]/50 mb-2">Your AI Phone Number</p>
                <div className="inline-flex items-center gap-3 rounded-xl px-6 py-4" style={{ backgroundColor: `${primaryColor}15` }}>
                  <span className="text-2xl font-bold" style={{ color: primaryColor }}>{phoneNumber}</span>
                  <button onClick={handleCopyPhone} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Copy phone number">
                    {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5 text-[#f5f5f0]/50" />}
                  </button>
                </div>
              </div>
            )}

            <div className="text-left mb-8">
              <h3 className="font-medium mb-4">Next Steps:</h3>
              <ul className="space-y-3">
                {['Check your email for login instructions', 'Forward your business calls to your AI number', 'Log into your dashboard to view calls'].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#f5f5f0]/70">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium" style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}>
                      {i + 1}
                    </div>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/login"
              className="group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-[#f5f5f0]/40">
            Need help? Contact {agency?.name || 'support'} for assistance.
          </p>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// AGENCY SUCCESS PAGE (for platform domain)
// ============================================================================
function AgencySuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#f5f5f0] blur-lg opacity-20" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f5f0]">
                  <Phone className="h-4 w-4 text-[#0a0a0a]" />
                </div>
              </div>
              <span className="text-lg font-medium tracking-tight">VoiceAI Connect</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative min-h-screen flex items-center justify-center px-6 py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-emerald-500/[0.07] to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-lg">
          <div className="mb-8 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="h-2 w-12 rounded-full bg-emerald-400" />
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111] p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-emerald-400/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>

            <h1 className="text-2xl font-medium tracking-tight mb-2">Welcome to VoiceAI Connect!</h1>
            <p className="text-[#f5f5f0]/50 mb-8">
              Your agency account has been created. Let&apos;s get you set up.
            </p>

            <div className="text-left mb-8">
              <h3 className="font-medium mb-4">Next Steps:</h3>
              <ul className="space-y-3">
                {[
                  'Complete your agency branding (logo, colors)',
                  'Set your pricing for clients',
                  'Connect your Stripe account to receive payments',
                  'Share your signup link with potential clients',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#f5f5f0]/70">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium bg-emerald-400/10 text-emerald-400">
                      {i + 1}
                    </div>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/agency/dashboard"
              className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3.5 text-base font-medium text-[#0a0a0a] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-[#f5f5f0]/40">
            Need help? Check out our getting started guide or contact support.
          </p>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SuccessContent() {
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isAgencySubdomain, setIsAgencySubdomain] = useState(false);

  useEffect(() => {
    const detectContext = async () => {
      try {
        const host = window.location.host;
        const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
        
        const platformDomains = [platformDomain, `www.${platformDomain}`, 'localhost:3000', 'localhost'];
        
        if (platformDomains.includes(host)) {
          setIsAgencySubdomain(false);
          setLoading(false);
          return;
        }
        
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        
        if (response.ok) {
          const data = await response.json();
          setAgency(data.agency);
          setIsAgencySubdomain(true);
        } else {
          setIsAgencySubdomain(false);
        }
      } catch (err) {
        console.error('Failed to detect context:', err);
        setIsAgencySubdomain(false);
      } finally {
        setLoading(false);
      }
    };

    detectContext();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (isAgencySubdomain) {
    return <ClientSuccessPage agency={agency} />;
  }

  return <AgencySuccessPage />;
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}