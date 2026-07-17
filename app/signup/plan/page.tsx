'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Phone, ArrowRight, Loader2, Check, ArrowLeft, Sparkles, 
  Zap, Shield, Users, Crown, X
} from 'lucide-react';
import { formatPrice as formatLocalPrice, getCurrencyForCountry } from '@/lib/currency';
import { getCountryFromCookie } from '@/lib/geo';
import { AGENCY_PLAN_TIER_LIST } from '@/lib/plan-features';
import { buildClientPlans, type ClientPlanTile } from '@/lib/plan-features-meta';
import { useEmbedMessaging, postToParent } from '@/lib/embed-messaging';

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
  country: string | null;
  price_starter: number;
  price_pro: number;
  price_growth: number;
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
  plan_features?: Record<string, Record<string, boolean | number>>;
  plan_starter_name?: string | null;
  plan_pro_name?: string | null;
  plan_growth_name?: string | null;
  plan_starter_description?: string | null;
  plan_pro_description?: string | null;
  plan_growth_description?: string | null;
  // Trial billing. When require_card_for_trial is true AND Stripe charges are
  // enabled, the client signup runs the card-required flow (a card is taken and
  // auto-charged after the 7-day trial), so the consent checkbox must include
  // the auto-renew disclosure. Both come from the public agency shape.
  stripe_charges_enabled?: boolean;
  require_card_for_trial?: boolean;
}

interface SignupData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country?: string;
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

function formatAgencyPrice(cents: number, agencyCountry: string = 'US'): string {
  const currency = getCurrencyForCountry(agencyCountry);
  const amount = Math.round(cents / 100);
  const formatted = amount.toLocaleString();
  
  if (currency.symbolPosition === 'before') {
    return `${currency.symbol}${formatted}`;
  }
  return `${formatted} ${currency.symbol}`;
}

// Carry embed flag forward when navigating between wizard steps. Without
// this, transitioning from /signup/plan to /auth/set-password drops the
// iframe context and the parent stops receiving step/resize events.
function buildEmbedAwareUrl(path: string, isEmbed: boolean, extras: Record<string, string> = {}): string {
  const url = new URL(path, window.location.origin);
  if (isEmbed) {
    url.searchParams.set('embed', 'true');
    // Embed context propagation: see buildNextUrl in signup-page.tsx — agency
    // UUID and parent_origin must ride through every internal navigation.
    const current = new URLSearchParams(window.location.search);
    const agencyParam = current.get('agency');
    if (agencyParam) url.searchParams.set('agency', agencyParam);
    const parentOrigin = current.get('parent_origin');
    if (parentOrigin) url.searchParams.set('parent_origin', parentOrigin);
  }
  for (const [k, v] of Object.entries(extras)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }
  return url.toString();
}

// Map plan id → presentation icon. Pure visual decision, kept local rather
// than coupled to lib/plan-features-meta.ts which is environment-agnostic.
const PLAN_ICON: Record<string, any> = {
  starter: Zap,
  pro: Shield,
  growth: Crown,
};

// ============================================================================
// THEME CACHING HELPERS
// ============================================================================
function getCachedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    const cached = sessionStorage.getItem('agency_theme');
    if (cached === 'dark') return 'dark';
  } catch (e) {}
  return 'light';
}

function setCachedTheme(theme: 'light' | 'dark' | 'auto' | null) {
  if (typeof window === 'undefined') return;
  try {
    const resolved = theme === 'dark' ? 'dark' : 'light';
    sessionStorage.setItem('agency_theme', resolved);
  } catch (e) {}
}

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
          style={{ color: '#10b981' }}
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
// CLIENT PLAN SELECTION (for agency subdomains)
// Refactored to use buildClientPlans from lib/plan-features-meta.ts — the
// single source of truth for client-tier plan rendering. Fixes Bug 11
// (phantom sms_notifications key) by removing the inline FEATURE_DISPLAY
// dict that drifted from the Settings UI's feature list.
// ============================================================================
function ClientPlanSelection({ agency, signupData, isEmbed }: { agency: Agency; signupData: SignupData; isEmbed: boolean }) {
  useEmbedMessaging(isEmbed, 2);

  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  // Affirmative consent (required). Gates plan selection: the client must agree
  // to Terms/Privacy + SMS consent, and for card-required trials to the
  // auto-renew disclosure, before any signup POST fires.
  const [consentAgreed, setConsentAgreed] = useState(false);
  
  const isMountedRef = React.useRef(true);
  
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const theme: 'light' | 'dark' = agency.website_theme === 'dark' ? 'dark' : 'light';
  const isDark = theme === 'dark';
  const primaryColor = agency.primary_color || '#10b981';
  const accentColor = agency.accent_color || primaryColor;
  const primaryLight = isLightColor(primaryColor);
  const agencyCountry = agency.country || 'US';

  // Embed mode: transparent so the host page is the visible background;
  // skip the fixed header and ambient blobs.
  const bgColor = isEmbed ? 'transparent' : (isDark ? '#050505' : '#ffffff');
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const cardBg = isDark ? '#0a0a0a' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';

  // Card-required trial => the auto-renew disclosure must be part of the consent
  // text. Mirrors the backend gate in handleClientSignup (require_card_for_trial
  // AND stripe_charges_enabled) so the checkbox shown matches the flow that runs.
  const isCardRequired = agency.require_card_for_trial === true && agency.stripe_charges_enabled === true;

  // The exact string recorded as consent (stored verbatim server-side via
  // consent_text). The rendered label below shows the same wording with
  // Terms/Privacy as links; the stored copy is plain text.
  const consentText = isCardRequired
    ? `I agree to the Terms of Service and Privacy Policy and consent to receive service and account text messages (message and data rates may apply, reply STOP to opt out). I understand that after my 7-day free trial, ${agency.name} will automatically charge my card the monthly price of the plan I select unless I cancel before the trial ends.`
    : `I agree to the Terms of Service and Privacy Policy and consent to receive service and account text messages (message and data rates may apply, reply STOP to opt out).`;

  // Override body background to match — but go transparent in embed mode.
  useEffect(() => {
    if (isEmbed) {
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.style.backgroundColor = 'transparent';
      return () => {
        document.documentElement.style.backgroundColor = '';
        document.body.style.backgroundColor = '';
      };
    }
  }, [isEmbed]);

  const safeRedirect = (url: string) => {
    setRedirecting(true);
    setTimeout(() => { window.location.replace(url); }, 100);
  };

  // For Stripe-Connect-Checkout redirects (card-required trial mode), Stripe
  // blocks iframe embedding via X-Frame-Options, so we cannot navigate within
  // the iframe. In embed mode we postMessage the parent with
  // voiceai:auth_complete and the Stripe URL, embed.js handles the
  // window.top.location.href = url redirect (with sanity-check for https://).
  // In standalone mode we just safeRedirect since we're already top-level.
  // Sets redirecting=true so the spinner state shows during the round-trip.
  const navigateForCheckout = (url: string) => {
    setRedirecting(true);
    if (isEmbed) {
      postToParent({ type: 'voiceai:auth_complete', url });
      // Belt-and-suspenders: if for any reason the parent doesn't catch the
      // message (script error, blocked, etc), fall back to a direct
      // window.top navigation a beat later.
      setTimeout(() => {
        try { (window.top as Window).location.href = url; }
        catch (_) { window.location.href = url; }
      }, 400);
    } else {
      setTimeout(() => { window.location.replace(url); }, 100);
    }
  };

  const handleSelectPlan = async (planType: string) => {
    if (loading || redirecting) return;

    // Consent is required before any signup POST. Belt-and-suspenders: the plan
    // buttons are also disabled until the box is checked, so this guard only
    // fires if something bypasses the disabled state.
    if (!consentAgreed) {
      setError('Please agree to the terms to continue.');
      return;
    }
    
    setSelectedPlan(planType);
    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const nameParts = signupData.ownerName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const requestBody = {
        firstName, lastName,
        email: signupData.email,
        phone: signupData.phone,
        businessName: signupData.businessName,
        businessCity: signupData.city,
        businessState: signupData.state,
        businessCountry: signupData.country || agencyCountry,
        industry: signupData.industry,
        agencyId: agency.id,
        planType: planType,
        // Affirmative consent captured on this step. consent_text is stored
        // verbatim server-side (client_consents); consent_agreed hard-gates the
        // card-required flow in handleClientSignup.
        consent_agreed: consentAgreed,
        consent_text: consentText,
      };
      
      const response = await fetch(`${backendUrl}/api/client/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.errors?.join(', ') || 'Failed to create account');
      }

      sessionStorage.removeItem('client_signup_data');

      // ──────────────────────────────────────────────────────────────────
      // Card-required trial mode: agency has require_card_for_trial=true.
      // Backend created a Stripe Connect Checkout with trial_period_days=7
      // and returned checkout_url. Client must enter a card to activate the
      // trial. After completing checkout, Stripe redirects to
      // {agencyUrl}/client/welcome?trial=started and our webhook flips the
      // client from 'pending_payment' to 'trial'.
      // ──────────────────────────────────────────────────────────────────
      if (data.requires_card && data.checkout_url) {
        navigateForCheckout(data.checkout_url);
        return;
      }

      // Bug 13 (Phase 5): handleClientSignup ALWAYS returns data.token on
      // success (no-card trial mode). The earlier four-branch handler had
      // dead code for data.checkoutUrl, data.sessionToken, data.exists, and
      // data.clientId shapes the backend has never returned. The 'already
      // exists' case arrives as a 409 + Account already exists message —
      // caught by the !response.ok branch above and surfaced in the error
      // state, so the UI's includes('already exists') check still renders
      // the Sign In link.
      if (data.token) {
        // Trial flow: redirect within iframe to /auth/set-password, which
        // emits voiceai:auth_complete after the password is set. Embed
        // flag carried forward.
        const setPasswordUrl = buildEmbedAwareUrl('/auth/set-password', isEmbed, {
          token: data.token,
          returnTo: '/client/dashboard',
        });
        safeRedirect(setPasswordUrl);
        return;
      }

      // Defensive fallback. If we ever get a 2xx response without a token, the
      // backend invariant has drifted — log it and degrade gracefully to the
      // login screen rather than leaving the user stuck on a spinner.
      console.error('Unexpected /api/client/signup response shape (no token):', data);
      safeRedirect('/client/login?message=account-created');
      
    } catch (err) {
      if (isMountedRef.current && !redirecting) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setSelectedPlan(null);
        setLoading(false);
      }
    }
  };
  
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: primaryColor }} />
          <p className="mt-4 text-sm" style={{ color: mutedTextColor }}>Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Build plans from the canonical helper. Tiles already include
  // included/excluded feature labels, custom name, tagline, popular flag,
  // and team-member count. Icon mapping is added locally for presentation.
  const plans: (ClientPlanTile & { icon: any })[] = buildClientPlans(agency as any).map(tile => ({
    ...tile,
    icon: PLAN_ICON[tile.id] || Shield,
  }));

  const wrapperClass = isEmbed ? '' : 'min-h-screen';
  const mainPaddingClass = isEmbed
    ? 'relative min-h-0 py-2 px-2 sm:px-4'
    : 'relative min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-6';

  return (
    <div className={wrapperClass} style={{ backgroundColor: bgColor, color: textColor }}>
      {isDark && !isEmbed && (
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      )}
      {isDark && !isEmbed && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[128px] opacity-[0.07]" style={{ backgroundColor: primaryColor }} />
        </div>
      )}

      {!isEmbed && (
        <header className="fixed top-0 left-0 right-0 z-40 border-b backdrop-blur-xl"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', backgroundColor: isDark ? 'rgba(5,5,5,0.8)' : 'rgba(255,255,255,0.8)' }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 sm:h-20 items-center justify-between">
              <a href="/" className="flex items-center gap-2.5 sm:gap-3 group">
                {agency.logo_url ? (
                  <img src={agency.logo_url} alt={agency.name} className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain"
                    style={{ backgroundColor: agency.logo_background_color || 'transparent', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)' }} />
                ) : (
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: primaryColor, border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: primaryLight ? '#050505' : '#fafaf9' }} />
                  </div>
                )}
                <span className="text-base sm:text-lg font-semibold tracking-tight">{agency.name}</span>
              </a>
            </div>
          </div>
        </header>
      )}

      <main className={mainPaddingClass}>
        <div className="relative mx-auto max-w-6xl">
          {!isEmbed && (
            <a href={buildEmbedAwareUrl('/get-started', isEmbed)} className="inline-flex items-center gap-2 text-sm transition-colors mb-6 sm:mb-8" style={{ color: mutedTextColor }}>
              <ArrowLeft className="h-4 w-4" /><span>Back to signup</span>
            </a>
          )}

          <div className="mb-8 sm:mb-10">
            <ProgressSteps currentStep={2} accentColor={primaryColor} />
          </div>

          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-4"
              style={{ backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}>
              <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
              <span style={{ color: primaryColor }}>7-day free trial included</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">Choose Your Plan</h1>
            <p className="mt-3 text-base sm:text-lg max-w-xl mx-auto" style={{ color: mutedTextColor }}>
              Select the plan that fits your business. Upgrade or downgrade anytime.
            </p>
          </div>

          {error && (
            <div className="mb-8 rounded-xl p-4 text-sm text-center max-w-md mx-auto"
              style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', border: isDark ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid #fecaca', color: isDark ? '#f87171' : '#dc2626' }}>
              {error}
              {error.includes('already exists') && (
                <div className="mt-3"><a href="/client/login" className="underline font-medium" style={{ color: primaryColor }}>Sign in to your account</a></div>
              )}
            </div>
          )}

          {/* CONSENT (required). Gates plan selection. Always shown so TCPA/SMS
              consent is captured for every signup; for card-required agencies
              the text also carries the auto-renew disclosure. The stored
              consent_text mirrors this wording (links rendered as plain text). */}
          <div className="max-w-2xl mx-auto mb-8">
            <label className="flex items-start gap-3 rounded-2xl border p-4 sm:p-5 cursor-pointer transition-colors"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', borderColor: consentAgreed ? primaryColor : cardBorder }}>
              <input type="checkbox" checked={consentAgreed}
                onChange={(e) => { setConsentAgreed(e.target.checked); if (e.target.checked) setError(''); }}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer"
                style={{ accentColor: primaryColor }} />
              <span className="text-sm leading-relaxed" style={{ color: mutedTextColor }}>
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: primaryColor }}>Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: primaryColor }}>Privacy Policy</a>
                {' '}and consent to receive service and account text messages (message and data rates may apply, reply STOP to opt out).
                {isCardRequired && (
                  <> I understand that after my 7-day free trial, {agency.name} will automatically charge my card the monthly price of the plan I select unless I cancel before the trial ends.</>
                )}
              </span>
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className="relative rounded-2xl sm:rounded-3xl border p-5 sm:p-6 lg:p-8 transition-all duration-300"
                style={{
                  backgroundColor: plan.popular ? cardBg : (isDark ? 'rgba(10,10,10,0.5)' : '#fafafa'),
                  borderColor: plan.popular ? (isDark ? `${primaryColor}40` : primaryColor) : cardBorder,
                  transform: plan.popular ? 'scale(1.02)' : undefined,
                  boxShadow: plan.popular ? (isDark ? `0 0 60px ${primaryColor}10` : '0 25px 50px -12px rgba(0,0,0,0.1)') : undefined,
                }}>
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg"
                      style={{ backgroundColor: primaryColor, color: primaryLight ? '#050505' : '#fafaf9', boxShadow: `0 0 20px ${primaryColor}40` }}>
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4"
                    style={{ backgroundColor: plan.popular ? `${primaryColor}20` : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') }}>
                    <plan.icon className="h-6 w-6" style={{ color: plan.popular ? primaryColor : textColor }} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">{plan.name}</h3>
                  {plan.description && (
                    <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>{plan.description}</p>
                  )}
                  <div className="mt-3">
                    <span className="text-3xl sm:text-4xl font-bold">{formatAgencyPrice(plan.price, agencyCountry)}</span>
                    <span className="text-sm" style={{ color: mutedTextColor }}>/month</span>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: isDark ? 'rgba(250,250,249,0.4)' : '#9ca3af' }}>
                    {plan.callLimit === -1 ? 'Unlimited calls' : `${plan.callLimit} calls included`}
                  </p>
                </div>
                <ul className="space-y-3 mb-4">
                  {plan.included.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5" style={{ backgroundColor: `${accentColor}15` }}>
                        <Check className="h-3 w-3" style={{ color: accentColor }} />
                      </div>
                      <span style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#4b5563' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.excluded && plan.excluded.length > 0 && (
                  <ul className="space-y-3 mb-6">
                    {plan.excluded.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                          <X className="h-3 w-3" style={{ color: isDark ? 'rgba(250,250,249,0.2)' : '#d1d5db' }} />
                        </div>
                        <span style={{ color: isDark ? 'rgba(250,250,249,0.3)' : '#9ca3af' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {(!plan.excluded || plan.excluded.length === 0) && <div className="mb-6" />}
                <button onClick={() => handleSelectPlan(plan.id)} disabled={loading || !consentAgreed}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 sm:py-4 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={plan.popular ? { backgroundColor: primaryColor, color: primaryLight ? '#050505' : '#fafaf9', boxShadow: isDark ? `0 0 30px ${primaryColor}30` : `0 4px 14px ${primaryColor}40` } : { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: textColor, border: `1px solid ${cardBorder}` }}>
                  {loading && selectedPlan === plan.id ? (<><Loader2 className="h-4 w-4 animate-spin" />Processing...</>) : (<>Get Started<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>)}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-12 text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" style={{ color: isDark ? 'rgba(250,250,249,0.4)' : '#9ca3af' }}>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" />7-day free trial</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" />Cancel anytime</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" />Setup in minutes</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// AGENCY PLAN SELECTION (for platform domain) - ALWAYS DARK THEME
// UPDATED: Free/Pro/Scale pricing (2026-05-08)
// ============================================================================
function AgencyPlanSelection({ agencyId }: { agencyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [countryCode, setCountryCode] = useState('US');

  useEffect(() => {
    const detected = getCountryFromCookie();
    if (detected) setCountryCode(detected);
  }, []);

  const fmtPrice = (dollars: number) => formatLocalPrice(dollars, countryCode);

  const handleSelectPlan = async (planType: string) => {
    setSelectedPlan(planType);
    setLoading(true);
    setError('');

    try {
      // FREE — no card required. Hit start-trial, land on signup success.
      if (planType === 'free') {
        const response = await fetch('/api/agency/start-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agencyId, planType }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to start trial');
        window.location.href = '/signup/success';
        return;
      }

      // PRO / SCALE — card required. Go through Stripe Checkout. The
      // start-trial route rejects paid plans by design, so calling it for
      // pro/scale (which the old code did) would have errored. We mirror the
      // onboarding flow: if a password token is queued in localStorage,
      // chain through set-password after checkout; otherwise land directly
      // on the dashboard. cancelUrl returns to this page so a canceled
      // checkout can retry without losing context.
      const token = typeof window !== 'undefined' ? localStorage.getItem('agency_password_token') : null;
      const returnPath = token
        ? `/auth/set-password?token=${token}&returnTo=${encodeURIComponent('/agency/dashboard?trial=started')}`
        : '/agency/dashboard?trial=started';
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: agencyId,
          plan: planType,
          successUrl: `${window.location.origin}${returnPath}`,
          cancelUrl: `${window.location.origin}/signup/plan?agency=${agencyId}`,
        }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data.error || 'Could not start checkout. Please try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSelectedPlan(null);
      setLoading(false);
    }
  };

  // Plans are now sourced from the canonical shared module so this surface
  // can't drift from the homepage / onboarding / trial-expired picker. The
  // subtitle ("Pay per usage" / "Unlimited clients") is derived here since
  // it's purely a visual layout concern on this surface and not part of the
  // tier's marketing data.
  const plans = AGENCY_PLAN_TIER_LIST.map(t => ({
    id: t.id,
    name: t.name,
    price: t.price,
    subtitle: t.id === 'free' ? 'Pay per usage' : 'Unlimited clients',
    icon: t.icon,
    popular: t.popular,
    description: t.description,
    rate: t.rate,
    features: t.features,
    limitations: t.limitations,
  }));

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[128px]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
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

      <main className="relative min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="relative mx-auto max-w-6xl">
          <a href="/signup" className="inline-flex items-center gap-2 text-sm text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors mb-6 sm:mb-8">
            <ArrowLeft className="h-4 w-4" /><span>Back</span>
          </a>

          <div className="mb-8 sm:mb-10">
            <ProgressSteps currentStep={2} accentColor="#10b981" />
          </div>

          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-4">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">Start free, no card &mdash; or try Pro &amp; Scale free for 14 days</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">Choose Your Plan</h1>
            <p className="mt-3 text-base sm:text-lg text-[#fafaf9]/50 max-w-xl mx-auto">
              Start free or unlock everything with a 14-day trial. Upgrade anytime.
            </p>
          </div>

          {error && (
            <div className="mb-8 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center max-w-md mx-auto">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div key={plan.id}
                className={`relative rounded-2xl sm:rounded-3xl border p-5 sm:p-6 lg:p-8 transition-all duration-300 ${
                  plan.popular 
                    ? 'border-emerald-500/30 bg-[#0a0a0a] md:scale-[1.02] shadow-2xl' 
                    : 'border-white/[0.08] bg-[#0a0a0a]/50 hover:border-white/[0.15] hover:bg-[#0a0a0a]'
                }`}
                style={plan.popular ? { boxShadow: '0 0 60px rgba(16, 185, 129, 0.1)' } : undefined}>
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500 text-[#050505] shadow-lg shadow-emerald-500/30">Most Popular</span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${plan.popular ? 'bg-emerald-500/20' : 'bg-white/[0.05]'}`}>
                    <plan.icon className={`h-6 w-6 ${plan.popular ? 'text-emerald-400' : 'text-[#fafaf9]'}`} />
                  </div>
                  <p className="text-sm text-[#fafaf9]/50 mb-1">{plan.description}</p>
                  <h3 className="text-lg sm:text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-3">
                    {plan.price === 0 ? (
                      <span className="text-3xl sm:text-4xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl font-bold">{fmtPrice(plan.price)}</span>
                        <span className="text-[#fafaf9]/50 text-sm">/month</span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[#fafaf9]/40">{plan.subtitle}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 bg-emerald-500/10">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      <span className="text-[#fafaf9]/70">{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3 text-sm">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 bg-emerald-500/10">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="text-[#fafaf9]/70">{plan.rate}</span>
                  </li>
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-3 text-sm">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 bg-white/[0.03]">
                        <X className="h-3 w-3 text-[#fafaf9]/20" />
                      </div>
                      <span className="text-[#fafaf9]/40">{limitation}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleSelectPlan(plan.id)} disabled={loading}
                  className={`group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 sm:py-4 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    plan.popular 
                      ? 'bg-white text-[#050505] hover:bg-[#fafaf9] hover:shadow-xl hover:shadow-white/10' 
                      : 'bg-white/[0.06] text-[#fafaf9] hover:bg-white/[0.12] border border-white/[0.08]'
                  }`}>
                  {loading && selectedPlan === plan.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Processing...</>
                  ) : (
                    <>{plan.price === 0 ? 'Start Free' : 'Start 14-Day Trial'}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-12 text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#fafaf9]/40">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" />Free plan needs no card</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" />Paid trials: $0 for 14 days</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" />Cancel anytime</span>
            </div>
          </div>

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
  const isEmbed = searchParams.get('embed') === 'true';
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [signupData, setSignupData] = useState<SignupData | null>(null);
  const [isAgencySubdomain, setIsAgencySubdomain] = useState(false);
  const [agencyIdFromUrl, setAgencyIdFromUrl] = useState<string | null>(null);
  const [cachedTheme, setCachedThemeState] = useState<'light' | 'dark'>('light');

  // Set when an embed lookup explicitly fails. We render an "unavailable"
  // state instead of falling through to AgencyPlanSelection (which would
  // show Free/Pro/Scale agency tiers to someone expecting client tiers).
  const [embedError, setEmbedError] = useState<string | null>(null);

  useEffect(() => {
    setCachedThemeState(getCachedTheme());
  }, []);

  useEffect(() => {
    const detectContext = async () => {
      try {
        const host = window.location.host;
        const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
        const agencyParam = searchParams.get('agency');
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

        const platformDomains = [platformDomain, `www.${platformDomain}`, 'localhost:3000', 'localhost'];

        if (platformDomains.includes(host)) {
          // ── Path A: embed mode on platform domain. Look up agency by ID
          // (no host context to derive) and render ClientPlanSelection. We
          // must NOT route to AgencyPlanSelection here — that flow is for an
          // agency picking their OWN tier (Free/Pro/Scale), totally different
          // semantic. Without isEmbed, ?agency= continues to mean "the agency
          // is on this page picking their own tier post-signup."
          if (isEmbed && agencyParam) {
            const res = await fetch(`${backendUrl}/api/agency/by-id?id=${encodeURIComponent(agencyParam)}`);
            if (res.ok) {
              const data = await res.json();
              setAgency(data.agency);
              setIsAgencySubdomain(true);
              setCachedTheme(data.agency.website_theme);

              const stored = sessionStorage.getItem('client_signup_data');
              if (stored) {
                setSignupData(JSON.parse(stored));
              } else {
                // Lost step-1 data — bounce back to /get-started preserving embed flag
                window.location.href = buildEmbedAwareUrl('/get-started', isEmbed, { agency: agencyParam });
                return;
              }
            } else if (res.status === 403) {
              setEmbedError('This signup form is currently unavailable.');
            } else {
              setEmbedError('Signup form could not be loaded.');
            }
            setLoading(false);
            return;
          }

          // Non-embed: ?agency= is the agency's own tier-pick flow (Agency tier).
          if (agencyParam) {
            setAgencyIdFromUrl(agencyParam);
            setIsAgencySubdomain(false);
            setLoading(false);
            return;
          }

          const stored = sessionStorage.getItem('client_signup_data');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.agency_slug) {
              window.location.href = `https://${data.agency_slug}.${platformDomain}/signup/plan`;
              return;
            }
          }

          setIsAgencySubdomain(false);
          setLoading(false);
          return;
        }

        const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        
        if (response.ok) {
          const data = await response.json();
          setAgency(data.agency);
          setIsAgencySubdomain(true);
          setCachedTheme(data.agency.website_theme);
          
          const faviconUrl = data.agency.favicon_url || data.agency.logo_url;
          if (faviconUrl && !isEmbed) setFavicon(faviconUrl);
          
          const stored = sessionStorage.getItem('client_signup_data');
          if (stored) {
            setSignupData(JSON.parse(stored));
          } else {
            window.location.href = buildEmbedAwareUrl('/get-started', isEmbed);
            return;
          }
        } else {
          setIsAgencySubdomain(false);
        }
      } catch (err) {
        console.error('Error detecting context:', err);
        setIsAgencySubdomain(false);
      } finally {
        setLoading(false);
      }
    };

    detectContext();
  }, [searchParams, router, isEmbed]);

  if (loading) return <ThemedLoading theme={cachedTheme} />;
  if (embedError) {
    return (
      <div className="flex items-center justify-center py-12 px-4 text-center">
        <div>
          <p className="text-sm font-medium text-neutral-700">{embedError}</p>
          <p className="text-xs text-neutral-500 mt-1">Please contact the site owner.</p>
        </div>
      </div>
    );
  }
  if (isAgencySubdomain && agency && signupData) return <ClientPlanSelection agency={agency} signupData={signupData} isEmbed={isEmbed} />;
  if (agencyIdFromUrl) return <AgencyPlanSelection agencyId={agencyIdFromUrl} />;

  if (typeof window !== 'undefined') window.location.href = buildEmbedAwareUrl('/get-started', isEmbed);
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