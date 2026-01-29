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

// ============================================================================
// REFERRAL TRACKING HELPERS
// ============================================================================
const REFERRAL_STORAGE_KEY = 'voiceai_referral_code';
const REFERRAL_EXPIRY_DAYS = 90;

function captureReferralCode(code: string) {
  if (typeof window === 'undefined') return;
  
  const data = {
    code: code.toLowerCase().trim(),
    timestamp: Date.now(),
  };
  
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

function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  icon: Icon,
  maxLength,
  className = '',
  accentColor = '#10b981',
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  maxLength?: number;
  className?: string;
  accentColor?: string;
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
          maxLength={maxLength}
          className={`w-full rounded-xl border border-white/[0.08] bg-white/[0.03] ${
            Icon ? 'pl-11' : 'pl-4'
          } pr-4 py-3.5 text-[#fafaf9] placeholder:text-[#fafaf9]/30 
          focus:outline-none focus:border-white/20 focus:bg-white/[0.05] focus:ring-1 focus:ring-white/10
          transition-all duration-200`}
          style={{
            // @ts-ignore
            '--tw-ring-color': `${accentColor}40`,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// CLIENT SIGNUP FORM (for agency subdomains)
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
          {/* Progress */}
          <div className="mb-8">
            <ProgressSteps currentStep={1} accentColor={primaryColor} />
          </div>

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
                accentColor={primaryColor}
              />

              <FormInput
                label="Your Name"
                name="ownerName"
                placeholder="John Smith"
                value={formData.ownerName}
                onChange={handleChange}
                required
                icon={User}
                accentColor={primaryColor}
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
                  accentColor={primaryColor}
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
                  accentColor={primaryColor}
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
                  accentColor={primaryColor}
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
                  <option value="home_services">Home Services (Plumbing, HVAC, etc.)</option>
                  <option value="medical">Medical/Dental</option>
                  <option value="legal">Legal Services</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="salon_spa">Salon/Spa</option>
                  <option value="automotive">Automotive</option>
                  <option value="fitness">Fitness</option>
                  <option value="retail">Retail</option>
                  <option value="professional_services">Professional Services</option>
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
                className="group relative w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-medium transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ 
                  backgroundColor: primaryColor,
                  color: primaryLight ? '#050505' : '#fafaf9',
                  boxShadow: `0 0 40px ${primaryColor}30`,
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
              <Link href="/terms" className="text-[#fafaf9]/60 hover:text-[#fafaf9] underline underline-offset-2 transition-colors">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#fafaf9]/60 hover:text-[#fafaf9] underline underline-offset-2 transition-colors">Privacy Policy</Link>
            </p>
          </div>

          {/* Benefits Card */}
          <div 
            className="mt-6 rounded-2xl border p-5 sm:p-6"
            style={{ 
              borderColor: `${accentColor}25`,
              backgroundColor: `${accentColor}08`,
            }}
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
// AGENCY SIGNUP FORM (for platform domain)
// ============================================================================
function AgencySignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    agencyName: '',
    email: '',
    phone: '',
  });

  // Capture referral code from URL on mount
  useEffect(() => {
    const refFromUrl = searchParams.get('ref') || searchParams.get('referral');
    
    if (refFromUrl) {
      // Store it for persistence (90 day window)
      captureReferralCode(refFromUrl);
      setReferralCode(refFromUrl.toLowerCase().trim());
      
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      url.searchParams.delete('referral');
      window.history.replaceState({}, '', url.toString());
    } else {
      // Check for previously stored referral
      const stored = getStoredReferralCode();
      if (stored) {
        setReferralCode(stored);
      }
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
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
          name: formData.agencyName,
          email: formData.email,
          phone: formData.phone,
          firstName: formData.firstName,
          lastName: formData.lastName,
          referralCode: referralCode, // Include referral code
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Clear stored referral code on successful signup
      clearReferralCode();

      if (data.token) {
        localStorage.setItem('agency_password_token', data.token);
      }

      router.push(`/signup/plan?agency=${data.agencyId}`);
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

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.07] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[128px]" />
      </div>

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
                <span className="hidden sm:inline">Already have an account? </span>Sign in
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="relative mx-auto max-w-lg">
          {/* Progress */}
          <div className="mb-8">
            <ProgressSteps currentStep={1} accentColor="#10b981" />
          </div>

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
                Create Your Agency
              </h1>
              <p className="mt-2 text-[#fafaf9]/50">
                Launch your AI voice business in minutes
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                label="Agency Name"
                name="agencyName"
                placeholder="SmartCall Solutions"
                value={formData.agencyName}
                onChange={handleChange}
                required
                icon={Building}
              />
              
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
              
              <FormInput
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                required
                icon={Phone}
              />

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#fafaf9]/40">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-[#fafaf9]/60 hover:text-[#fafaf9] underline underline-offset-2 transition-colors">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#fafaf9]/60 hover:text-[#fafaf9] underline underline-offset-2 transition-colors">Privacy Policy</Link>
            </p>
          </div>

          {/* Benefits Card */}
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5 sm:p-6">
            <h3 className="font-medium text-[#fafaf9] mb-4">What you get with your free trial:</h3>
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
// MAIN COMPONENT - Detects context and renders appropriate form
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
        
        const platformDomains = [
          platformDomain,
          `www.${platformDomain}`,
          'localhost:3000',
          'localhost',
        ];
        
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

  if (isAgencySubdomain && agency) {
    return <ClientSignupForm agency={agency} />;
  }

  return <AgencySignupForm />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-4 text-sm text-[#fafaf9]/40">Loading...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}