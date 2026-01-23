'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Phone, Loader2, CheckCircle2, ArrowRight, Copy, Check, 
  Sparkles, MessageSquare, LayoutDashboard, PhoneForwarded,
  PartyPopper, Rocket
} from 'lucide-react';

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

// Waveform icon component matching the logo
function WaveformIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" />
      <rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" />
      <rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
function ProgressSteps({ currentStep, totalSteps = 3, accentColor = '#10b981' }: { 
  currentStep: number; 
  totalSteps?: number;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              step === currentStep ? 'w-8' : 'w-2'
            }`}
            style={{ 
              backgroundColor: step <= currentStep ? accentColor : 'rgba(255,255,255,0.1)' 
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ConfettiEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'][i % 5],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// CLIENT SUCCESS PAGE (for agency subdomains)
// ============================================================================
function ClientSuccessPage({ agency }: { agency: Agency | null }) {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  
  const phoneNumber = searchParams.get('phone');
  const businessName = searchParams.get('business');

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyPhone = () => {
    if (phoneNumber) {
      navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const primaryColor = agency?.primary_color || '#10b981';
  const accentColor = agency?.accent_color || primaryColor;
  const primaryLight = isLightColor(primaryColor);

  const nextSteps = [
    {
      icon: MessageSquare,
      title: 'Check your phone',
      description: 'We sent you a text with login instructions',
    },
    {
      icon: PhoneForwarded,
      title: 'Forward your calls',
      description: 'Set up call forwarding to your AI number',
    },
    {
      icon: LayoutDashboard,
      title: 'Explore your dashboard',
      description: 'View calls, transcripts, and analytics',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      {/* Premium grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[128px] opacity-[0.1]"
          style={{ backgroundColor: primaryColor }}
        />
      </div>

      {/* Confetti */}
      {showConfetti && <ConfettiEffect />}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              {agency?.logo_url ? (
                <img 
                  src={agency.logo_url} 
                  alt={agency.name} 
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain border border-white/10" 
                />
              ) : (
                <div 
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-white/10"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: primaryLight ? '#050505' : '#fafaf9' }} />
                </div>
              )}
              <span className="text-base sm:text-lg font-semibold tracking-tight">{agency?.name || 'AI Receptionist'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-28 sm:py-32">
        <div className="relative w-full max-w-lg">
          {/* Progress */}
          <div className="mb-8">
            <ProgressSteps currentStep={3} accentColor={primaryColor} />
          </div>

          {/* Success Card */}
          <div className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/20 text-center">
            {/* Success icon */}
            <div 
              className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-6 relative"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: accentColor }} />
              <div 
                className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                style={{ backgroundColor: accentColor }}
              />
            </div>

            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-4"
              style={{ 
                backgroundColor: `${primaryColor}15`,
                border: `1px solid ${primaryColor}30`,
              }}
            >
              <PartyPopper className="h-4 w-4" style={{ color: primaryColor }} />
              <span style={{ color: primaryColor }}>Setup Complete</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
              You&apos;re All Set!
            </h1>
            <p className="text-[#fafaf9]/50 mb-6 sm:mb-8">
              {businessName 
                ? `Your AI receptionist for ${businessName} is ready to take calls.` 
                : 'Your AI receptionist is ready to take calls.'}
            </p>

            {/* Phone Number Display */}
            {phoneNumber && (
              <div className="mb-6 sm:mb-8">
                <p className="text-sm text-[#fafaf9]/50 mb-3">Your AI Phone Number</p>
                <div 
                  className="inline-flex items-center gap-3 rounded-xl px-5 sm:px-6 py-4 border"
                  style={{ 
                    backgroundColor: `${primaryColor}10`,
                    borderColor: `${primaryColor}30`,
                  }}
                >
                  <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                  <span 
                    className="text-xl sm:text-2xl font-bold font-mono tracking-wide"
                    style={{ color: primaryColor }}
                  >
                    {phoneNumber}
                  </span>
                  <button 
                    onClick={handleCopyPhone} 
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors ml-1"
                    title="Copy phone number"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Copy className="h-5 w-5 text-[#fafaf9]/40 hover:text-[#fafaf9]/70" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-400 mt-2 animate-fade-in">
                    Copied to clipboard!
                  </p>
                )}
              </div>
            )}

            {/* Next Steps */}
            <div className="text-left mb-6 sm:mb-8">
              <h3 className="font-medium mb-4 text-center sm:text-left">Next Steps</h3>
              <div className="space-y-3">
                {nextSteps.map((step, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${accentColor}10` }}
                    >
                      <step.icon className="h-5 w-5" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-sm text-[#fafaf9]/50">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/client/login"
              className="group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-medium transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              style={{ 
                backgroundColor: primaryColor, 
                color: primaryLight ? '#050505' : '#fafaf9',
                boxShadow: `0 0 40px ${primaryColor}30`,
              }}
            >
              Go to Dashboard
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Support note */}
          <p className="mt-6 text-center text-sm text-[#fafaf9]/40">
            Need help? Contact{' '}
            <span className="text-[#fafaf9]/60">{agency?.name || 'support'}</span>
            {' '}for assistance.
          </p>
        </div>
      </main>

      {/* Confetti animation styles */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// AGENCY SUCCESS PAGE (for platform domain)
// ============================================================================
function AgencySuccessPage() {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const nextSteps = [
    {
      icon: Sparkles,
      title: 'Set up your branding',
      description: 'Upload logo and customize colors',
    },
    {
      icon: Phone,
      title: 'Configure pricing',
      description: 'Set what you charge clients',
    },
    {
      icon: LayoutDashboard,
      title: 'Connect Stripe',
      description: 'Start receiving payments directly',
    },
    {
      icon: Rocket,
      title: 'Share your link',
      description: 'Start acquiring clients',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      {/* Premium grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.1] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/[0.05] rounded-full blur-[128px]" />
      </div>

      {/* Confetti */}
      {showConfetti && <ConfettiEffect />}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                  <WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#fafaf9]" />
                </div>
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-28 sm:py-32">
        <div className="relative w-full max-w-lg">
          {/* Progress */}
          <div className="mb-8">
            <ProgressSteps currentStep={3} accentColor="#10b981" />
          </div>

          {/* Success Card */}
          <div className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/20 text-center">
            {/* Success icon */}
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-6 bg-emerald-500/15 relative">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400" />
              <div className="absolute inset-0 rounded-2xl bg-emerald-500 animate-ping opacity-20" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4">
              <Rocket className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Account Created</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
              Welcome to VoiceAI Connect!
            </h1>
            <p className="text-[#fafaf9]/50 mb-6 sm:mb-8">
              Your agency account is ready. Let&apos;s get you set up for success.
            </p>

            {/* Next Steps */}
            <div className="text-left mb-6 sm:mb-8">
              <h3 className="font-medium mb-4 text-center sm:text-left">Getting Started</h3>
              <div className="space-y-3">
                {nextSteps.map((step, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <step.icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{step.title}</p>
                        <span className="text-xs text-[#fafaf9]/30 bg-white/[0.05] px-2 py-0.5 rounded-full">
                          Step {i + 1}
                        </span>
                      </div>
                      <p className="text-sm text-[#fafaf9]/50">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href="/agency/dashboard"
              className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
            >
              Go to Dashboard
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Support note */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-[#fafaf9]/40">
              Need help getting started?
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link href="/docs" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                View Guide
              </Link>
              <span className="text-[#fafaf9]/20">•</span>
              <Link href="/support" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Confetti animation styles */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-4 text-sm text-[#fafaf9]/40">Loading...</p>
        </div>
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-4 text-sm text-[#fafaf9]/40">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}