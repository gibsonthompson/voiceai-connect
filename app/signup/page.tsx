'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Phone, ArrowRight, Loader2, Check, Building, Mail, User, MapPin,
  ArrowLeft, Sparkles, Shield, Clock, Zap
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
  price_starter: number;
  price_pro: number;
  price_growth: number;
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
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

// Google icon
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// ============================================================================
// REFERRAL TRACKING HELPERS
// ============================================================================
const REFERRAL_STORAGE_KEY = 'voiceai_referral_code';
const REFERRAL_EXPIRY_DAYS = 90;

function captureReferralCode(code: string) {
  if (typeof window === 'undefined') return;
  const data = { code: code.toLowerCase().trim(), timestamp: Date.now() };
  localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(data));
}

function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    const daysSinceCapture = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceCapture > REFERRAL_EXPIRY_DAYS) {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }
    return data.code;
  } catch {
    return null;
  }
}

function clearReferralCode() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  icon: Icon,
  className = '',
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#fafaf9]/30" />
        )}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full rounded-xl border border-white/[0.08] bg-white/[0.03] ${
            Icon ? 'pl-11' : 'pl-4'
          } pr-4 py-3.5 text-[#fafaf9] placeholder:text-[#fafaf9]/30 
          focus:outline-none focus:border-white/20 focus:bg-white/[0.05] focus:ring-1 focus:ring-white/10
          transition-all duration-200`}
        />
      </div>
    </div>
  );
}

// ============================================================================
// CLIENT SIGNUP FORM (for agency subdomains) - UNCHANGED
// ============================================================================
function ClientSignupForm({ agency }: { agency: Agency }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    industry: 'general',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      sessionStorage.setItem('client_signup_data', JSON.stringify({
        ...formData,
        agency_id: agency.id,
        agency_slug: agency.slug,
      }));
      router.push('/signup/plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const primaryColor = agency.primary_color || '#10b981';
  const accentColor = agency.accent_color || primaryColor;
  const primaryLight = isLightColor(primaryColor);

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
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[128px] opacity-[0.07]"
          style={{ backgroundColor: primaryColor }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              {agency.logo_url ? (
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
              <span className="text-base sm:text-lg font-semibold tracking-tight">{agency.name}</span>
            </Link>
            <Link 
              href="/client/login"
              className="text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
            >
              <span className="hidden sm:inline">Already have an account? </span>Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="relative mx-auto max-w-lg">
          {/* Form Card */}
          <div className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/20">
            <div className="text-center mb-8">
              <div 
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-4"
                style={{ 
                  backgroundColor: `${primaryColor}15`,
                  border: `1px solid ${primaryColor}30`,
                }}
              >
                <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
                <span style={{ color: primaryColor }}>7-day free trial</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Get Your AI Receptionist
              </h1>
              <p className="mt-2 text-[#fafaf9]/50">
                Start your free trial with {agency.name}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <FormInput
                label="Business Name"
                name="businessName"
                placeholder="Acme Plumbing Services"
                value={formData.businessName}
                onChange={handleChange}
                required
                icon={Building}
              />

              <FormInput
                label="Your Name"
                name="ownerName"
                placeholder="John Smith"
                value={formData.ownerName}
                onChange={handleChange}
                required
                icon={User}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="you@business.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  icon={Mail}
                />
                <FormInput
                  label="Phone"
                  name="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  icon={Phone}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="City"
                  name="city"
                  placeholder="Atlanta"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  icon={MapPin}
                />
                <div>
                  <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">State</label>
                  <input
                    name="state"
                    type="text"
                    placeholder="GA"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    maxLength={2}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all uppercase text-center font-medium tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">Industry</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-[#fafaf9] focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.25rem',
                  }}
                >
                  <option value="general">General Business</option>
                  <option value="home_services">Home Services</option>
                  <option value="medical">Medical/Dental</option>
                  <option value="legal">Legal Services</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="salon_spa">Salon/Spa</option>
                  <option value="automotive">Automotive</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-medium transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
                style={{ 
                  backgroundColor: primaryColor,
                  color: primaryLight ? '#050505' : '#fafaf9',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    Continue to Plans
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#fafaf9]/40">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-[#fafaf9]/60 hover:text-[#fafaf9] underline underline-offset-2">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#fafaf9]/60 hover:text-[#fafaf9] underline underline-offset-2">Privacy Policy</Link>
            </p>
          </div>

          {/* Benefits Card */}
          <div 
            className="mt-6 rounded-2xl border p-5 sm:p-6"
            style={{ borderColor: `${accentColor}25`, backgroundColor: `${accentColor}08` }}
          >
            <h3 className="font-medium text-[#fafaf9] mb-4">What you&apos;ll get:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Phone, text: 'AI receptionist 24/7' },
                { icon: Zap, text: 'Instant SMS notifications' },
                { icon: Shield, text: 'Professional call handling' },
                { icon: Clock, text: 'Detailed call summaries' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-[#fafaf9]/70">
                  <div 
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <item.icon className="h-4 w-4" style={{ color: accentColor }} />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// AGENCY SIGNUP FORM (SIMPLIFIED - just name + email + Google)
// ============================================================================
function AgencySignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  // Check for errors from Google OAuth
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'google_auth_failed': 'Google sign in failed. Please try again.',
        'no_code': 'Google sign in was cancelled.',
        'no_email': 'Could not get email from Google.',
        'account_exists': 'An account with this email already exists. Please sign in.',
      };
      setError(errorMessages[errorParam] || 'Something went wrong.');
      
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Capture referral code
  useEffect(() => {
    const refFromUrl = searchParams.get('ref') || searchParams.get('referral');
    if (refFromUrl) {
      captureReferralCode(refFromUrl);
      setReferralCode(refFromUrl.toLowerCase().trim());
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      url.searchParams.delete('referral');
      window.history.replaceState({}, '', url.toString());
    } else {
      const stored = getStoredReferralCode();
      if (stored) setReferralCode(stored);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleGoogleSignup = () => {
    setGoogleLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    // Include referral code in state
    const state = referralCode ? `?ref=${referralCode}` : '';
    window.location.href = `${backendUrl}/api/auth/google${state}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          referralCode: referralCode,
          // No agency name or phone - collected in onboarding
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      clearReferralCode();

      if (data.token) {
        localStorage.setItem('agency_password_token', data.token);
      }
      if (data.agencyId) {
        localStorage.setItem('onboarding_agency_id', data.agencyId);
      }

      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.07] rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                <WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#fafaf9]" />
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="hidden sm:flex items-center gap-1.5 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <Link 
                href="/agency/login" 
                className="text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="relative mx-auto max-w-md">
          {/* Referral Banner */}
          {referralCode && (
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 flex-shrink-0">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-emerald-300 text-sm">You were referred!</p>
                <p className="text-xs text-emerald-300/60">Your referral has been applied</p>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#0a0a0a]/50 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300/90">14-day free trial</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Get Started Free
              </h1>
              <p className="mt-2 text-[#fafaf9]/50">
                Launch your AI voice agency in minutes
              </p>
            </div>

            {/* Google Sign Up Button */}
            <button
              onClick={handleGoogleSignup}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white px-6 py-3.5 text-base font-medium text-gray-800 hover:bg-gray-50 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 mb-6"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0a0a0a] px-3 text-[#fafaf9]/40">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="First Name"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  label="Last Name"
                  name="lastName"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                icon={Mail}
              />

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Continue with Email
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#fafaf9]/40">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-[#fafaf9]/60 hover:text-[#fafaf9] underline underline-offset-2">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#fafaf9]/60 hover:text-[#fafaf9] underline underline-offset-2">Privacy Policy</Link>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5 sm:p-6">
            <h3 className="font-medium text-[#fafaf9] mb-4">What you get:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Zap, text: 'Full platform access' },
                { icon: Shield, text: 'White-label branding' },
                { icon: Clock, text: 'Up to 5 test clients' },
                { icon: Check, text: 'Cancel anytime' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-[#fafaf9]/70">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <item.icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#fafaf9]/40">
              Join <span className="text-[#fafaf9]/60 font-medium">847 agencies</span> already using VoiceAI Connect
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SignupContent() {
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (isAgencySubdomain && agency) {
    return <ClientSignupForm agency={agency} />;
  }

  return <AgencySignupForm />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}