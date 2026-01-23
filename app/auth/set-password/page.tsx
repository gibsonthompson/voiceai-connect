'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

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
          // Main platform domain - no agency branding
          setIsAgencySubdomain(false);
          return;
        }
        
        // Try to fetch agency info for this host
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        
        if (response.ok) {
          const data = await response.json();
          setAgency(data.agency);
          setIsAgencySubdomain(true);
        }
      } catch (err) {
        console.error('Failed to detect agency context:', err);
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

      // Set the auth token as a cookie (critical for server-side auth)
      if (data.token) {
        document.cookie = `auth_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
        
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (data.client) {
          localStorage.setItem('client', JSON.stringify(data.client));
        }
      }

      setSuccess(true);

      // Redirect based on returnTo param or user role
      setTimeout(() => {
        if (returnTo) {
          router.push(returnTo);
        } else if (data.user?.role === 'client') {
          router.push('/client/dashboard');
        } else if (data.user?.role === 'agency_owner' || data.user?.role === 'agency_staff') {
          router.push('/agency/dashboard');
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

  // Dynamic colors based on agency or platform
  const primaryColor = agency?.primary_color || '#10b981'; // emerald for platform
  const primaryLight = isLightColor(primaryColor);
  const brandName = agency?.name || 'VoiceAI Connect';
  const loginUrl = isAgencySubdomain ? '/client/login' : '/agency/login';

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-[#111] p-8 text-center">
            <div 
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: `${primaryColor}1A` }}
            >
              <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
            <h1 className="text-2xl font-medium tracking-tight mb-2">Password Set!</h1>
            <p className="text-[#f5f5f0]/50">Redirecting you to your dashboard...</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4" style={{ color: primaryColor }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {agency?.logo_url ? (
                <img src={agency.logo_url} alt={agency.name} className="h-9 w-9 rounded-lg object-contain" />
              ) : (
                <div className="relative">
                  {!isAgencySubdomain && <div className="absolute inset-0 bg-[#f5f5f0] blur-lg opacity-20" />}
                  <div 
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: isAgencySubdomain ? primaryColor : '#f5f5f0' }}
                  >
                    <Phone className="h-4 w-4" style={{ color: isAgencySubdomain ? (primaryLight ? '#0a0a0a' : '#f5f5f0') : '#0a0a0a' }} />
                  </div>
                </div>
              )}
              <span className="text-lg font-medium tracking-tight">{brandName}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative min-h-screen flex items-center justify-center px-6 py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-[0.07]"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        <div className="relative w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-[#111] p-8">
            <div className="text-center mb-8">
              <div 
                className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}1A` }}
              >
                <Lock className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <h1 className="text-2xl font-medium tracking-tight">Set Your Password</h1>
              <p className="mt-2 text-[#f5f5f0]/50">
                Create a secure password to access your dashboard
              </p>
            </div>

            {!token ? (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center">
                {error}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
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
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-12 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:outline-none transition-colors"
                      style={{ 
                        borderColor: 'rgba(255,255,255,0.1)',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = `${primaryColor}80`;
                        e.target.style.boxShadow = `0 0 0 1px ${primaryColor}80`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5f5f0]/40 hover:text-[#f5f5f0]/70"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-[#f5f5f0]/40">At least 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:outline-none transition-colors"
                    onFocus={(e) => {
                      e.target.style.borderColor = `${primaryColor}80`;
                      e.target.style.boxShadow = `0 0 0 1px ${primaryColor}80`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: primaryColor,
                    color: primaryLight ? '#0a0a0a' : '#f5f5f0',
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

          <p className="mt-6 text-center text-sm text-[#f5f5f0]/40">
            Already have a password?{' '}
            <Link 
              href={loginUrl} 
              className="transition-colors hover:opacity-80"
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
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}