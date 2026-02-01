'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Phone, ArrowRight, Loader2, Building2, User, Mail, MapPin, Briefcase
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;  // Added for favicon support
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  website_theme: 'light' | 'dark' | 'auto' | null;
  logo_background_color: string | null;
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

// Waveform icon component
function WaveformIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill={color || 'currentColor'} opacity="0.6" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill={color || 'currentColor'} opacity="0.8" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill={color || 'currentColor'} />
      <rect x="11" y="6" width="2" height="12" rx="1" fill={color || 'currentColor'} />
      <rect x="14" y="3" width="2" height="18" rx="1" fill={color || 'currentColor'} />
      <rect x="17" y="7" width="2" height="10" rx="1" fill={color || 'currentColor'} opacity="0.8" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill={color || 'currentColor'} opacity="0.6" />
    </svg>
  );
}

// ============================================================================
// HELPER: Get cached theme from sessionStorage
// ============================================================================
function getCachedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    const cached = sessionStorage.getItem('agency_theme');
    if (cached === 'dark') return 'dark';
  } catch (e) {
    // sessionStorage not available
  }
  return 'light';
}

function setCachedTheme(theme: 'light' | 'dark' | 'auto' | null) {
  if (typeof window === 'undefined') return;
  try {
    const resolved = theme === 'dark' ? 'dark' : 'light';
    sessionStorage.setItem('agency_theme', resolved);
  } catch (e) {
    // sessionStorage not available
  }
}

// Set dynamic favicon
function setFavicon(url: string) {
  // Remove existing favicons
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => link.remove());
  
  // Add new favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = url;
  document.head.appendChild(link);
  
  // Also add apple-touch-icon
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = url;
  document.head.appendChild(appleLink);
}

// ============================================================================
// PROGRESS STEPS
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
              backgroundColor: step <= currentStep ? accentColor : 'rgba(128,128,128,0.2)' 
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// THEMED INPUT COMPONENT
// ============================================================================
function ThemedInput({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  hint,
  icon: Icon,
  theme,
  primaryColor,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  hint?: string;
  icon?: React.ElementType;
  theme: 'light' | 'dark';
  primaryColor: string;
}) {
  const isDark = theme === 'dark';
  
  return (
    <div className="w-full">
      <label 
        htmlFor={name} 
        className={`mb-1.5 block text-sm font-medium ${isDark ? 'text-[#fafaf9]/70' : 'text-gray-700'}`}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon 
            className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-[#fafaf9]/30' : 'text-gray-400'}`} 
          />
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`flex h-12 w-full rounded-xl border px-4 ${Icon ? 'pl-11' : ''} text-base transition-all focus:outline-none focus:ring-2 ${
            isDark 
              ? 'border-white/[0.08] bg-white/[0.03] text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-white/20 focus:bg-white/[0.05]'
              : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-300'
          }`}
          style={{
            '--tw-ring-color': `${primaryColor}30`,
          } as React.CSSProperties}
        />
      </div>
      {hint && (
        <p className={`mt-1.5 text-xs ${isDark ? 'text-[#fafaf9]/40' : 'text-gray-500'}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// THEMED SELECT COMPONENT
// ============================================================================
function ThemedSelect({
  name,
  label,
  value,
  onChange,
  options,
  theme,
  primaryColor,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  theme: 'light' | 'dark';
  primaryColor: string;
}) {
  const isDark = theme === 'dark';
  
  return (
    <div className="w-full">
      <label 
        htmlFor={name} 
        className={`mb-1.5 block text-sm font-medium ${isDark ? 'text-[#fafaf9]/70' : 'text-gray-700'}`}
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`flex h-12 w-full rounded-xl border px-4 text-base transition-all focus:outline-none focus:ring-2 ${
          isDark 
            ? 'border-white/[0.08] bg-white/[0.03] text-[#fafaf9] focus:border-white/20 focus:bg-white/[0.05]'
            : 'border-gray-200 bg-white text-gray-900 focus:border-gray-300'
        }`}
        style={{
          '--tw-ring-color': `${primaryColor}30`,
        } as React.CSSProperties}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// SIGNUP FORM CONTENT
// ============================================================================
function SignupFormContent({ agency }: { agency: Agency }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'pro';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    industry: 'home_services',
  });

  // Theme and colors
  const theme: 'light' | 'dark' = agency.website_theme === 'dark' ? 'dark' : 'light';
  const isDark = theme === 'dark';
  const primaryColor = agency.primary_color || '#10b981';
  const accentColor = agency.accent_color || primaryColor;
  const primaryLight = isLightColor(primaryColor);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.businessName || !formData.ownerName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Store signup data for plan selection page
    sessionStorage.setItem('client_signup_data', JSON.stringify({
      ...formData,
      agency_id: agency.id,
      agency_slug: agency.slug,
    }));

    // Navigate to plan selection
    router.push(`/signup/plan`);
  };

  const industryOptions = [
    { value: 'home_services', label: 'Home Services' },
    { value: 'medical', label: 'Medical / Healthcare' },
    { value: 'legal', label: 'Legal' },
    { value: 'restaurant', label: 'Restaurant / Food Service' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'other', label: 'Other' },
  ];

  // Background and text colors based on theme
  const bgColor = isDark ? '#050505' : '#ffffff';
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Grain overlay for dark theme */}
      {isDark && (
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Ambient glow for dark theme */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[128px] opacity-[0.07]"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
      )}

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-xl ${
          isDark ? 'border-white/[0.06] bg-[#050505]/80' : 'border-gray-100 bg-white/80'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              {agency.logo_url ? (
                <img 
                  src={agency.logo_url} 
                  alt={agency.name} 
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain"
                  style={{
                    backgroundColor: agency.logo_background_color || 'transparent',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                  }}
                />
              ) : (
                <div 
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl"
                  style={{ 
                    backgroundColor: primaryColor,
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  }}
                >
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: primaryLight ? '#050505' : '#fafaf9' }} />
                </div>
              )}
              <span className="text-base sm:text-lg font-semibold tracking-tight">{agency.name}</span>
            </Link>
            <Link 
              href="/client/login" 
              className={`text-sm font-medium transition-colors ${isDark ? 'text-[#fafaf9]/60 hover:text-[#fafaf9]' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-28 sm:py-32">
        <div className="relative w-full max-w-md">
          {/* Progress */}
          <div className="mb-8">
            <ProgressSteps currentStep={1} accentColor={primaryColor} />
          </div>

          {/* Card */}
          <div 
            className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Get Your AI Receptionist
              </h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: mutedTextColor }}>
                Start your 7-day free trial. Setup takes just 5 minutes.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <ThemedInput
                name="businessName"
                label="Business Name"
                placeholder="Acme Plumbing"
                value={formData.businessName}
                onChange={handleChange}
                required
                icon={Building2}
                theme={theme}
                primaryColor={primaryColor}
              />
              
              <ThemedInput
                name="ownerName"
                label="Your Name"
                placeholder="John Smith"
                value={formData.ownerName}
                onChange={handleChange}
                required
                icon={User}
                theme={theme}
                primaryColor={primaryColor}
              />
              
              <ThemedInput
                name="email"
                label="Email Address"
                type="email"
                placeholder="john@acmeplumbing.com"
                value={formData.email}
                onChange={handleChange}
                required
                icon={Mail}
                theme={theme}
                primaryColor={primaryColor}
              />
              
              <ThemedInput
                name="phone"
                label="Phone Number"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                required
                icon={Phone}
                hint="We'll send call notifications here"
                theme={theme}
                primaryColor={primaryColor}
              />

              <div className="grid grid-cols-2 gap-3">
                <ThemedInput
                  name="city"
                  label="City"
                  placeholder="Atlanta"
                  value={formData.city}
                  onChange={handleChange}
                  icon={MapPin}
                  theme={theme}
                  primaryColor={primaryColor}
                />
                
                <ThemedInput
                  name="state"
                  label="State"
                  placeholder="GA"
                  value={formData.state}
                  onChange={handleChange}
                  theme={theme}
                  primaryColor={primaryColor}
                />
              </div>

              <ThemedSelect
                name="industry"
                label="Industry"
                value={formData.industry}
                onChange={handleChange}
                options={industryOptions}
                theme={theme}
                primaryColor={primaryColor}
              />

              {/* Error */}
              {error && (
                <div 
                  className="rounded-xl p-3 text-sm"
                  style={{
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                    color: isDark ? '#f87171' : '#dc2626',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                style={{
                  backgroundColor: primaryColor,
                  color: primaryLight ? '#050505' : '#fafaf9',
                  boxShadow: isDark ? `0 0 40px ${primaryColor}30` : `0 4px 14px ${primaryColor}40`,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Plans
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Terms */}
            <p className="mt-6 text-center text-xs" style={{ color: mutedTextColor }}>
              By signing up, you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-2" style={{ color: primaryColor }}>
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-2" style={{ color: primaryColor }}>
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Support note */}
          <p className="mt-6 text-center text-sm" style={{ color: mutedTextColor }}>
            Questions? Contact{' '}
            <span style={{ color: isDark ? '#fafaf9' : '#111827' }}>{agency.name}</span>
            {' '}for help.
          </p>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// THEMED LOADING COMPONENT
// ============================================================================
function ThemedLoading({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: isDark ? '#050505' : '#ffffff' }}
    >
      <div className="text-center">
        <Loader2 
          className="h-8 w-8 animate-spin mx-auto" 
          style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
        />
        <p 
          className="mt-4 text-sm"
          style={{ color: isDark ? '#6b7280' : '#6b7280' }}
        >
          Loading...
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT - Detects agency and loads appropriate theme
// ============================================================================
function SignupContent() {
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [error, setError] = useState('');
  const [cachedTheme, setCachedThemeState] = useState<'light' | 'dark'>('light');

  // Get cached theme on mount (client-side only)
  useEffect(() => {
    setCachedThemeState(getCachedTheme());
  }, []);

  useEffect(() => {
    const fetchAgency = async () => {
      try {
        const host = window.location.host;
        const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
        
        // Check if on platform domain (not agency subdomain)
        const platformDomains = [platformDomain, `www.${platformDomain}`, 'localhost:3000', 'localhost'];
        
        if (platformDomains.includes(host)) {
          // This is platform signup - redirect to agency signup flow
          window.location.href = '/';
          return;
        }
        
        // Fetch agency by host (subdomain or custom domain)
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        
        if (!response.ok) {
          throw new Error('Agency not found');
        }
        
        const data = await response.json();
        setAgency(data.agency);
        
        // Cache the theme for future page loads
        setCachedTheme(data.agency.website_theme);
        
        // Set favicon - prefer favicon_url, fall back to logo_url
        const faviconUrl = data.agency.favicon_url || data.agency.logo_url;
        if (faviconUrl) {
          setFavicon(faviconUrl);
        }
      } catch (err) {
        console.error('Failed to fetch agency:', err);
        setError('Unable to load signup page. Please check the URL.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgency();
  }, []);

  // Loading state - use cached theme (respects dark mode if previously visited)
  if (loading) {
    return <ThemedLoading theme={cachedTheme} />;
  }

  if (error || !agency) {
    const isDark = cachedTheme === 'dark';
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: isDark ? '#050505' : '#ffffff' }}
      >
        <div className="text-center">
          <h1 
            className="text-2xl font-medium mb-2"
            style={{ color: isDark ? '#fafaf9' : '#111827' }}
          >
            Page Not Found
          </h1>
          <p style={{ color: isDark ? '#6b7280' : '#6b7280' }}>
            {error || 'Please check the URL and try again.'}
          </p>
        </div>
      </div>
    );
  }

  return <SignupFormContent agency={agency} />;
}

export default function ClientSignupPage() {
  // Note: Suspense fallback can't use hooks, so we default to light theme
  // The actual loading state in SignupContent will use cached theme
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}