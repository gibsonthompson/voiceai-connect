'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Phone, ArrowRight, Loader2, Check, ArrowLeft, Sparkles, 
  Zap, Shield, Users, Crown, X
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;
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

interface SignupData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  industry: string;
  agency_id: string;
  agency_slug: string;
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

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

// ============================================================================
// THEME CACHING HELPERS
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
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => link.remove());
  
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = url;
  document.head.appendChild(link);
  
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = url;
  document.head.appendChild(appleLink);
}

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
// THEMED LOADING COMPONENT
// ============================================================================
function ThemedLoading({ theme, message = 'Loading plans...' }: { theme: 'light' | 'dark'; message?: string }) {
  const isDark = theme === 'dark';
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: isDark ? '#050505' : '#ffffff' }}
    >
      <div className="text-center">
        <Loader2 
          className="h-8 w-8 animate-spin mx-auto" 
          style={{ color: isDark ? '#10b981' : '#10b981' }}
        />
        <p 
          className="mt-4 text-sm"
          style={{ color: isDark ? 'rgba(250,250,249,0.4)' : '#6b7280' }}
        >
          {message}
        </p>
      </div>
    </div>
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
              backgroundColor: step <= currentStep ? accentColor : 'rgba(128,128,128,0.2)' 
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// CLIENT PLAN SELECTION (for agency subdomains) - NOW WITH THEME SUPPORT
// ============================================================================
function ClientPlanSelection({ agency, signupData }: { agency: Agency; signupData: SignupData }) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  
  // Use ref to track if component is mounted (prevents state updates after unmount)
  const isMountedRef = React.useRef(true);
  
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Theme detection
  const theme: 'light' | 'dark' = agency.website_theme === 'dark' ? 'dark' : 'light';
  const isDark = theme === 'dark';
  const primaryColor = agency.primary_color || '#10b981';
  const accentColor = agency.accent_color || primaryColor;
  const primaryLight = isLightColor(primaryColor);

  // Theme-based colors
  const bgColor = isDark ? '#050505' : '#ffffff';
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const cardBg = isDark ? '#0a0a0a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const cardHoverBorder = isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db';

  // Safe redirect function that prevents React state updates
  const safeRedirect = (url: string) => {
    console.log('[ClientSignup] Redirecting to:', url);
    setRedirecting(true);
    // Use setTimeout to let React finish current render cycle before navigation
    setTimeout(() => {
      window.location.replace(url);
    }, 100);
  };

  const handleSelectPlan = async (planType: string) => {
    if (loading || redirecting) return; // Prevent double-clicks
    
    setSelectedPlan(planType);
    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      // Debug logging
      console.log('[ClientSignup] Starting signup with:', {
        backendUrl,
        agencyId: agency.id,
        planType,
        email: signupData.email,
      });
      
      const nameParts = signupData.ownerName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const requestBody = {
        firstName: firstName,
        lastName: lastName,
        email: signupData.email,
        phone: signupData.phone,
        businessName: signupData.businessName,
        businessCity: signupData.city,
        businessState: signupData.state,
        industry: signupData.industry,
        agencyId: agency.id,
        planType: planType,
      };
      
      console.log('[ClientSignup] Request body:', requestBody);
      
      const response = await fetch(`${backendUrl}/api/client/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[ClientSignup] Response status:', response.status);
      
      const data = await response.json();
      
      console.log('[ClientSignup] Response data:', {
        hasToken: !!data.token,
        hasCheckoutUrl: !!data.checkoutUrl,
        hasSessionToken: !!data.sessionToken,
        hasError: !!data.error,
        keys: Object.keys(data),
        fullData: data, // Log full response for debugging
      });

      if (!response.ok) {
        const errorMsg = data.error || data.errors?.join(', ') || 'Failed to create account';
        console.error('[ClientSignup] API error:', errorMsg);
        throw new Error(errorMsg);
      }

      // Clear signup data from session storage
      sessionStorage.removeItem('client_signup_data');

      // Handle the response - check for token first (password setup flow)
      if (data.token) {
        console.log('[ClientSignup] Has token, redirecting to set-password');
        const returnTo = encodeURIComponent('/client/dashboard');
        safeRedirect(`/auth/set-password?token=${data.token}&returnTo=${returnTo}`);
        return;
      }
      
      // Check for Stripe checkout URL (paid plan flow)
      if (data.checkoutUrl) {
        console.log('[ClientSignup] Has checkoutUrl, redirecting to Stripe');
        safeRedirect(data.checkoutUrl);
        return;
      }
      
      // If user already exists and has password, they may get a session token
      if (data.sessionToken) {
        console.log('[ClientSignup] Has sessionToken, setting session');
        try {
          await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: data.sessionToken }),
          });
        } catch (sessionErr) {
          console.error('[ClientSignup] Failed to set session:', sessionErr);
        }
        safeRedirect('/client/dashboard');
        return;
      }
      
      // Fallback: if we got here with a successful response but no token/checkout
      console.warn('[ClientSignup] No token or checkout URL in response');
      console.warn('[ClientSignup] Full response was:', JSON.stringify(data, null, 2));
      
      // Check if response indicates user already exists
      if (data.message?.includes('already exists') || data.exists) {
        if (isMountedRef.current) {
          setError('An account with this email already exists. Please sign in.');
          setLoading(false);
          setSelectedPlan(null);
        }
        return;
      }
      
      // Check if we got a client ID back (successful creation but no token?)
      if (data.clientId || data.client?.id) {
        console.log('[ClientSignup] Got client ID but no token - backend may need to return token');
        // Try redirecting to login as fallback
        safeRedirect('/client/login?message=account-created');
        return;
      }
      
      // Last resort fallback
      console.warn('[ClientSignup] Falling back to login redirect');
      safeRedirect('/client/login');
      
    } catch (err) {
      console.error('[ClientSignup] Error:', err);
      if (isMountedRef.current && !redirecting) {
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
        setError(errorMessage);
        setSelectedPlan(null);
        setLoading(false);
      }
    }
  };
  
  // Show redirecting state
  if (redirecting) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <div className="text-center">
          <Loader2 
            className="h-8 w-8 animate-spin mx-auto" 
            style={{ color: primaryColor }}
          />
          <p 
            className="mt-4 text-sm"
            style={{ color: mutedTextColor }}
          >
            Setting up your account...
          </p>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: agency.price_starter || 4900,
      calls: agency.limit_starter || 50,
      icon: Zap,
      features: [
        'AI receptionist 24/7',
        `Up to ${agency.limit_starter || 50} calls/month`,
        'SMS notifications',
        'Call transcripts',
        'Basic analytics',
      ],
      limitations: [],
    },
    {
      id: 'pro',
      name: 'Professional',
      price: agency.price_pro || 9900,
      calls: agency.limit_pro || 150,
      icon: Shield,
      popular: true,
      features: [
        'Everything in Starter',
        `Up to ${agency.limit_pro || 150} calls/month`,
        'Priority support',
        'Custom AI greeting',
        'Advanced analytics',
        'Call recordings',
      ],
      limitations: [],
    },
    {
      id: 'growth',
      name: 'Growth',
      price: agency.price_growth || 14900,
      calls: agency.limit_growth || 500,
      icon: Crown,
      features: [
        'Everything in Professional',
        `Up to ${agency.limit_growth || 500} calls/month`,
        'Dedicated support',
        'API access',
        'Custom integrations',
        'White-glove onboarding',
      ],
      limitations: [],
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Premium grain overlay - dark theme only */}
      {isDark && (
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Ambient glow - dark theme only */}
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
        className="fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-xl"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          backgroundColor: isDark ? 'rgba(5,5,5,0.8)' : 'rgba(255,255,255,0.8)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* Use <a> instead of <Link> to ensure proper navigation */}
            <a href="/" className="flex items-center gap-2.5 sm:gap-3 group">
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
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="relative mx-auto max-w-6xl">
          {/* Back link - use <a> tag */}
          <a 
            href="/get-started" 
            className="inline-flex items-center gap-2 text-sm transition-colors mb-6 sm:mb-8"
            style={{ color: mutedTextColor }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to signup</span>
          </a>

          {/* Progress */}
          <div className="mb-8 sm:mb-10">
            <ProgressSteps currentStep={2} accentColor={primaryColor} />
          </div>

          {/* Header */}
          <div className="text-center mb-10 sm:mb-12">
            <div 
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-4"
              style={{ 
                backgroundColor: `${primaryColor}15`,
                border: `1px solid ${primaryColor}30`,
              }}
            >
              <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
              <span style={{ color: primaryColor }}>7-day free trial included</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
              Choose Your Plan
            </h1>
            <p className="mt-3 text-base sm:text-lg max-w-xl mx-auto" style={{ color: mutedTextColor }}>
              Select the plan that fits your business. Upgrade or downgrade anytime.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div 
              className="mb-8 rounded-xl p-4 text-sm text-center max-w-md mx-auto"
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                border: isDark ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid #fecaca',
                color: isDark ? '#f87171' : '#dc2626',
              }}
            >
              {error}
              {error.includes('already exists') && (
                <div className="mt-3">
                  <a 
                    href="/client/login" 
                    className="underline font-medium"
                    style={{ color: primaryColor }}
                  >
                    Sign in to your account
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="relative rounded-2xl sm:rounded-3xl border p-5 sm:p-6 lg:p-8 transition-all duration-300"
                style={{
                  backgroundColor: plan.popular ? cardBg : (isDark ? 'rgba(10,10,10,0.5)' : '#fafafa'),
                  borderColor: plan.popular ? (isDark ? `${primaryColor}40` : primaryColor) : cardBorder,
                  transform: plan.popular ? 'scale(1.02)' : undefined,
                  boxShadow: plan.popular 
                    ? (isDark ? `0 0 60px ${primaryColor}10` : `0 25px 50px -12px rgba(0,0,0,0.1)`)
                    : undefined,
                }}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <span 
                      className="px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg"
                      style={{ 
                        backgroundColor: primaryColor, 
                        color: primaryLight ? '#050505' : '#fafaf9',
                        boxShadow: `0 0 20px ${primaryColor}40`,
                      }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6">
                  <div 
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4"
                    style={{ 
                      backgroundColor: plan.popular ? `${primaryColor}20` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                    }}
                  >
                    <plan.icon 
                      className="h-6 w-6" 
                      style={{ color: plan.popular ? primaryColor : textColor }} 
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-3xl sm:text-4xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-sm" style={{ color: mutedTextColor }}>/month</span>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: isDark ? 'rgba(250,250,249,0.4)' : '#9ca3af' }}>
                    {plan.calls} calls included
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div 
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5"
                        style={{ backgroundColor: `${accentColor}15` }}
                      >
                        <Check className="h-3 w-3" style={{ color: accentColor }} />
                      </div>
                      <span style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#4b5563' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 sm:py-4 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={plan.popular ? { 
                    backgroundColor: primaryColor, 
                    color: primaryLight ? '#050505' : '#fafaf9',
                    boxShadow: isDark ? `0 0 30px ${primaryColor}30` : `0 4px 14px ${primaryColor}40`,
                  } : {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    color: textColor,
                    border: `1px solid ${cardBorder}`,
                  }}
                >
                  {loading && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-10 sm:mt-12 text-center">
            <div 
              className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
              style={{ color: isDark ? 'rgba(250,250,249,0.4)' : '#9ca3af' }}
            >
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                7-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                Setup in minutes
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// AGENCY PLAN SELECTION (for platform domain) - ALWAYS DARK THEME
// ============================================================================
function AgencyPlanSelection({ agencyId }: { agencyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSelectPlan = async (planType: string) => {
    setSelectedPlan(planType);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, planType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { 
      id: 'starter', 
      name: 'Starter', 
      price: 19900, 
      clients: '25',
      icon: Zap,
      description: 'For new agencies',
      features: [
        'Up to 25 clients',
        'Embeddable signup widget',
        'White-label branding',
        'Agency dashboard',
        'Email support',
      ],
      limitations: [
        'No marketing site',
        'Subdomain only',
      ],
    },
    { 
      id: 'professional', 
      name: 'Professional', 
      price: 29900, 
      clients: '100', 
      icon: Shield,
      popular: true,
      description: 'Most popular',
      features: [
        'Up to 100 clients',
        'Full marketing website',
        'Demo phone number',
        'Custom domain support',
        'Priority support',
        'Advanced analytics',
        'API access',
      ],
      limitations: [],
    },
    { 
      id: 'enterprise', 
      name: 'Scale', 
      price: 49900, 
      clients: 'Unlimited',
      icon: Crown,
      description: 'For established agencies',
      features: [
        'Unlimited clients',
        'Everything in Professional',
        'White-label emails',
        'Dedicated success manager',
        'Custom integrations',
        'SLA guarantee',
        'Phone support',
      ],
      limitations: [],
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* Use <a> instead of <Link> */}
            <a href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                  <WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#fafaf9]" />
                </div>
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="relative mx-auto max-w-6xl">
          {/* Back link - use <a> tag */}
          <a 
            href="/signup" 
            className="inline-flex items-center gap-2 text-sm text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors mb-6 sm:mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </a>

          {/* Progress */}
          <div className="mb-8 sm:mb-10">
            <ProgressSteps currentStep={2} accentColor="#10b981" />
          </div>

          {/* Header */}
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">14-day free trial included</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
              Choose Your Plan
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[#fafaf9]/50 max-w-xl mx-auto">
              Scale your agency with the right plan. Upgrade anytime as you grow.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center max-w-md mx-auto">
              {error}
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl sm:rounded-3xl border p-5 sm:p-6 lg:p-8 transition-all duration-300 ${
                  plan.popular 
                    ? 'border-emerald-500/30 bg-[#0a0a0a] md:scale-[1.02] shadow-2xl' 
                    : 'border-white/[0.08] bg-[#0a0a0a]/50 hover:border-white/[0.15] hover:bg-[#0a0a0a]'
                }`}
                style={plan.popular ? { 
                  boxShadow: '0 0 60px rgba(16, 185, 129, 0.1)',
                } : undefined}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500 text-[#050505] shadow-lg shadow-emerald-500/30">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6">
                  <div 
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${
                      plan.popular ? 'bg-emerald-500/20' : 'bg-white/[0.05]'
                    }`}
                  >
                    <plan.icon 
                      className={`h-6 w-6 ${plan.popular ? 'text-emerald-400' : 'text-[#fafaf9]'}`}
                    />
                  </div>
                  <p className="text-sm text-[#fafaf9]/50 mb-1">{plan.description}</p>
                  <h3 className="text-lg sm:text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-3xl sm:text-4xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-[#fafaf9]/50 text-sm">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-[#fafaf9]/40">
                    {plan.clients} clients
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 bg-emerald-500/10">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      <span className="text-[#fafaf9]/70">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-3 text-sm">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 bg-white/[0.03]">
                        <X className="h-3 w-3 text-[#fafaf9]/20" />
                      </div>
                      <span className="text-[#fafaf9]/40">{limitation}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading}
                  className={`group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 sm:py-4 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    plan.popular 
                      ? 'bg-white text-[#050505] hover:bg-[#fafaf9] hover:shadow-xl hover:shadow-white/10' 
                      : 'bg-white/[0.06] text-[#fafaf9] hover:bg-white/[0.12] border border-white/[0.08]'
                  }`}
                >
                  {loading && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {plan.id === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-10 sm:mt-12 text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#fafaf9]/40">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                14-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                No setup fees
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-400" />
                Cancel anytime
              </span>
            </div>
          </div>

          {/* Comparison link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#fafaf9]/30">
              Not sure which plan? <a href="/features" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Compare all features</a>
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
function PlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [signupData, setSignupData] = useState<SignupData | null>(null);
  const [isAgencySubdomain, setIsAgencySubdomain] = useState(false);
  const [agencyIdFromUrl, setAgencyIdFromUrl] = useState<string | null>(null);
  const [cachedTheme, setCachedThemeState] = useState<'light' | 'dark'>('light');

  // Get cached theme on mount (client-side only)
  useEffect(() => {
    setCachedThemeState(getCachedTheme());
  }, []);

  useEffect(() => {
    const detectContext = async () => {
      try {
        const host = window.location.host;
        const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
        const agencyParam = searchParams.get('agency');
        
        console.log('[PlanPage] Detecting context:', { host, platformDomain, agencyParam });
        
        const platformDomains = [platformDomain, `www.${platformDomain}`, 'localhost:3000', 'localhost'];
        
        if (platformDomains.includes(host)) {
          if (agencyParam) {
            console.log('[PlanPage] Platform domain with agency param - showing agency plan selection');
            setAgencyIdFromUrl(agencyParam);
            setIsAgencySubdomain(false);
            setLoading(false);
            return;
          }
          
          const stored = sessionStorage.getItem('client_signup_data');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.agency_slug) {
              console.log('[PlanPage] Redirecting to agency subdomain:', data.agency_slug);
              window.location.href = `https://${data.agency_slug}.${platformDomain}/signup/plan`;
              return;
            }
          }
          
          console.log('[PlanPage] Platform domain, no agency context');
          setIsAgencySubdomain(false);
          setLoading(false);
          return;
        }
        
        // Agency subdomain - fetch agency data
        console.log('[PlanPage] Agency subdomain detected:', host);
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[PlanPage] Agency data loaded:', data.agency?.name);
          setAgency(data.agency);
          setIsAgencySubdomain(true);
          
          // Cache the theme
          setCachedTheme(data.agency.website_theme);
          
          // Set favicon
          const faviconUrl = data.agency.favicon_url || data.agency.logo_url;
          if (faviconUrl) {
            setFavicon(faviconUrl);
          }
          
          const stored = sessionStorage.getItem('client_signup_data');
          if (stored) {
            console.log('[PlanPage] Signup data found in session');
            setSignupData(JSON.parse(stored));
          } else {
            console.log('[PlanPage] No signup data, redirecting to get-started');
            window.location.href = '/get-started';
            return;
          }
        } else {
          console.error('[PlanPage] Failed to load agency:', response.status);
          setIsAgencySubdomain(false);
        }
      } catch (err) {
        console.error('[PlanPage] Error detecting context:', err);
        setIsAgencySubdomain(false);
      } finally {
        setLoading(false);
      }
    };

    detectContext();
  }, [searchParams, router]);

  if (loading) {
    return <ThemedLoading theme={cachedTheme} />;
  }

  if (isAgencySubdomain && agency && signupData) {
    return <ClientPlanSelection agency={agency} signupData={signupData} />;
  }

  if (agencyIdFromUrl) {
    return <AgencyPlanSelection agencyId={agencyIdFromUrl} />;
  }

  // Use window.location for redirect to ensure middleware runs
  if (typeof window !== 'undefined') {
    window.location.href = '/get-started';
  }
  
  return <ThemedLoading theme={cachedTheme} message="Redirecting..." />;
}

export default function PlanPage() {
  const [cachedTheme, setCachedThemeState] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    setCachedThemeState(getCachedTheme());
  }, []);
  
  return (
    <Suspense fallback={<ThemedLoading theme={cachedTheme} />}>
      <PlanContent />
    </Suspense>
  );
}