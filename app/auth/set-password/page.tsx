'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

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
// LOADING SCREEN COMPONENT
// ============================================================================
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
        <p className="text-[#fafaf9]/30 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const returnTo = searchParams.get('returnTo');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Agency context for branding
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isAgencySubdomain, setIsAgencySubdomain] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);

  // Detect agency context on mount
  useEffect(() => {
    const detectContext = async () => {
      try {
        const host = window.location.host;
        const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
        
        const platformDomains = [
          platformDomain,
          `www.${platformDomain}`,
          'localhost:3000',
          'localhost',
        ];
        
        if (platformDomains.includes(host)) {
          setIsAgencySubdomain(false);
          setContextLoading(false);
          return;
        }
        
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        
        if (response.ok) {
          const data = await response.json();
          setAgency(data.agency);
          setIsAgencySubdomain(true);
        }
      } catch (err) {
        console.error('Failed to detect agency context:', err);
      } finally {
        setContextLoading(false);
      }
    };

    detectContext();
  }, []);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token. Please use the link from your welcome message.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password');
      }

      if (data.token) {
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.token }),
        });
        
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (data.client) {
          localStorage.setItem('client', JSON.stringify(data.client));
        }
      }

      setSuccess(true);

      // Determine redirect destination
      setTimeout(() => {
        if (returnTo) {
          // Explicit return URL takes priority
          router.push(returnTo);
        } else if (data.user?.role === 'client') {
          // Client goes to client dashboard
          router.push('/client/dashboard');
        } else if (data.user?.role === 'agency_owner' || data.user?.role === 'agency_staff') {
          // Agency owner/staff coming from onboarding - send to plans
          // Plans page will redirect to dashboard if already subscribed
          router.push('/plans');
        } else {
          router.push('/');
        }
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (contextLoading) {
    return <LoadingScreen />;
  }

  // Dynamic colors based on agency or platform
  const primaryColor = agency?.primary_color || '#10b981';
  const primaryLight = isLightColor(primaryColor);
  const brandName = agency?.name || 'VoiceAI Connect';
  const loginUrl = isAgencySubdomain ? '/client/login' : '/agency/login';

  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#fafaf9] flex items-center justify-center px-4 sm:px-6">
        {/* Grain overlay */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-8 text-center">
            <div 
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: `${primaryColor}1A` }}
            >
              <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Password Set!</h1>
            <p className="text-[#fafaf9]/50">Redirecting you...</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4" style={{ color: primaryColor }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9] overflow-hidden">
      {/* Premium grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[128px] opacity-[0.07]"
          style={{ backgroundColor: primaryColor }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              {agency?.logo_url ? (
                <img src={agency.logo_url} alt={agency.name} className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-contain" />
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-xl overflow-hidden border border-white/10">
                    <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                      <WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>
                </div>
              )}
              <span className="text-base sm:text-lg font-semibold tracking-tight">{brandName}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-32">
        <div className="relative w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div 
                className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Lock className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Set Your Password</h1>
              <p className="mt-3 text-[#fafaf9]/50">
                Create a secure password to access your dashboard
              </p>
            </div>

            {!token ? (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center">
                {error}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 pr-12 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#fafaf9]/40 hover:text-[#fafaf9]/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[#fafaf9]/40">At least 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-medium transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ 
                    backgroundColor: primaryColor,
                    color: primaryLight ? '#050505' : '#fafaf9',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Setting password...
                    </>
                  ) : (
                    'Set Password & Continue'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer Link */}
          <p className="mt-6 text-center text-sm text-[#fafaf9]/40">
            Already have a password?{' '}
            <Link 
              href={loginUrl} 
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: primaryColor }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SetPasswordContent />
    </Suspense>
  );
}