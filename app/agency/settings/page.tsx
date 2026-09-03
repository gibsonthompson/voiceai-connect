'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload, Check, AlertCircle, ExternalLink, CreditCard, Building, Loader2, DollarSign, AlertTriangle, RefreshCw, Trash2, Receipt, XCircle, Eye, EyeOff, Phone, Users, Globe, Info, MessageSquare, Send, Sparkles, Lock, Code, Search, ChevronDown, LifeBuoy } from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';
import { PLAN_NAMES, deriveAgencyTeamLimit, formatTeamLimit } from '@/lib/plan-limits';
import { FEATURE_LABELS, FEATURE_ORDER } from '@/lib/plan-features-meta';
import BYOTSettings from '@/components/BYOTSettings';
import AgencyTeamTab from '@/components/agency/AgencyTeamTab';
import CancelSubscriptionModal from '@/components/CancelSubscriptionModal';

type SettingsTab = 'profile' | 'pricing' | 'payments' | 'billing' | 'twilio' | 'embed' | 'team' | 'demo' | 'support';
interface StripeStatus { connected: boolean; account_id?: string; onboarding_complete: boolean; charges_enabled: boolean; payouts_enabled: boolean; details_submitted?: boolean; }
interface FeedbackItem { id: string; message: string; created_at: string; }
function isTrialStatus(status: string | null | undefined): boolean { return status === 'trial' || status === 'trialing'; }

const PLAN_PRICING: Record<string, number> = { free: 0, pro: 99, scale: 499, starter: 0, professional: 99, enterprise: 499 };
const DEFAULT_PLAN_FEATURES: Record<string, Record<string, boolean | number>> = {
  starter: { email_summaries: true, custom_greeting: false, custom_voice: false, knowledge_base: false, business_hours: true, google_calendar: false, advanced_analytics: false, priority_support: false, caller_recognition: true, spam_detection: true, call_transfer: false, transfer_fallback: false, after_hours_mode: true, team_members: 0 },
  pro: { email_summaries: true, custom_greeting: true, custom_voice: false, knowledge_base: true, business_hours: true, google_calendar: true, advanced_analytics: true, priority_support: false, caller_recognition: true, spam_detection: true, call_transfer: true, transfer_fallback: true, after_hours_mode: true, team_members: 2 },
  growth: { email_summaries: true, custom_greeting: true, custom_voice: true, knowledge_base: true, business_hours: true, google_calendar: true, advanced_analytics: true, priority_support: true, caller_recognition: true, spam_detection: true, call_transfer: true, transfer_fallback: true, after_hours_mode: true, team_members: 5 },
};

const PLAN_NAME_DEFAULTS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Professional',
  growth: 'Growth',
};

// Slug (white-label subdomain) client-side guards. These mirror the backend
// checks in routes/agency-settings.js so the Save button can gate obvious
// problems before a request, but the backend stays the source of truth for
// the reserved list and uniqueness. Format: 3-63 chars, lowercase a-z 0-9 and
// hyphen, no leading/trailing hyphen.
const SLUG_FORMAT = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
function isSlugFormatValid(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 63 && SLUG_FORMAT.test(slug);
}

// Countries the platform's Stripe Connect supports (mirrors the backend's
// countryCurrencyMap in routes/stripe-connect.js). The agency picks one before
// connecting; it is sent to /api/agency/connect/onboard and fixes the Stripe
// account's country and currency. Sorted by name.
const CONNECT_COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' }, { code: 'BG', name: 'Bulgaria' }, { code: 'CA', name: 'Canada' },
  { code: 'HR', name: 'Croatia' }, { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' }, { code: 'EE', name: 'Estonia' }, { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' }, { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' }, { code: 'IN', name: 'India' },
  { code: 'IE', name: 'Ireland' }, { code: 'IT', name: 'Italy' }, { code: 'JP', name: 'Japan' },
  { code: 'LV', name: 'Latvia' }, { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MT', name: 'Malta' }, { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' }, { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'RO', name: 'Romania' },
  { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' }, { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
  { code: 'TH', name: 'Thailand' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
];

function rgbToHex(r: number, g: number, b: number): string { return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''); }
function adjustColorBrightness(hex: string, percent: number): string { const num = parseInt(hex.replace('#', ''), 16); const amt = Math.round(2.55 * percent); const R = Math.min(255, Math.max(0, (num >> 16) + amt)); const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt)); const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt)); return rgbToHex(R, G, B); }
function detectLogoBackground(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): { r: number; g: number; b: number; isTransparent: boolean } { const w = canvas.width; const h = canvas.height; const step = Math.max(1, Math.floor(Math.min(w, h) / 20)); const edgePixels: ImageData[] = []; for (let x = 0; x < w; x += step) { edgePixels.push(ctx.getImageData(x, 0, 1, 1)); edgePixels.push(ctx.getImageData(x, h - 1, 1, 1)); } for (let y = 0; y < h; y += step) { edgePixels.push(ctx.getImageData(0, y, 1, 1)); edgePixels.push(ctx.getImageData(w - 1, y, 1, 1)); } const transparentCount = edgePixels.filter(p => p.data[3] < 128).length; if (transparentCount > edgePixels.length * 0.5) return { r: 0, g: 0, b: 0, isTransparent: true }; let r = 0, g = 0, b = 0, count = 0; edgePixels.forEach(p => { if (p.data[3] >= 128) { r += p.data[0]; g += p.data[1]; b += p.data[2]; count++; } }); return count > 0 ? { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count), isTransparent: false } : { r: 255, g: 255, b: 255, isTransparent: false }; }
async function extractColorsFromImage(imageUrl: string): Promise<{ primary: string; secondary: string; accent: string; logoBgColor: string; suggestedTheme: 'light' | 'dark'; }> { const fallback = { primary: '#10b981', secondary: '#059669', accent: '#34d399', logoBgColor: '#000000', suggestedTheme: 'dark' as const }; return new Promise((resolve) => { const img = new Image(); img.crossOrigin = 'Anonymous'; img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); if (!ctx) { resolve(fallback); return; } const size = 150; canvas.width = size; canvas.height = size; ctx.drawImage(img, 0, 0, size, size); const bg = detectLogoBackground(canvas, ctx); const bgHex = bg.isTransparent ? '#000000' : rgbToHex(bg.r, bg.g, bg.b); let suggestedTheme: 'light' | 'dark' = 'dark'; if (!bg.isTransparent) { const luminance = (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) / 255; suggestedTheme = luminance > 0.5 ? 'light' : 'dark'; } const pixels = ctx.getImageData(0, 0, size, size).data; const colorData: Record<string, { count: number; r: number; g: number; b: number; saturation: number; lightness: number; }> = {}; for (let i = 0; i < pixels.length; i += 4) { const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3]; if (a < 128) continue; const bgDist = Math.sqrt(Math.pow(r - bg.r, 2) + Math.pow(g - bg.g, 2) + Math.pow(b - bg.b, 2)); if (bgDist < 50) continue; const br = Math.round(r / 25) * 25; const bg2 = Math.round(g / 25) * 25; const bb = Math.round(b / 25) * 25; const max = Math.max(br, bg2, bb) / 255; const min = Math.min(br, bg2, bb) / 255; const lightness = (max + min) / 2; const saturation = max === min ? 0 : lightness > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min); if (lightness < 0.15 || lightness > 0.65) continue; if (saturation < 0.25) continue; const key = `${br},${bg2},${bb}`; if (!colorData[key]) colorData[key] = { count: 0, r: br, g: bg2, b: bb, saturation, lightness }; colorData[key].count++; } const colors = Object.values(colorData).filter(c => c.count >= 5).sort((a, b) => (b.saturation * Math.log(b.count)) - (a.saturation * Math.log(a.count))).slice(0, 6).map(c => rgbToHex(c.r, c.g, c.b)); if (!colors.length) { resolve({ ...fallback, logoBgColor: bgHex, suggestedTheme }); return; } const primary = colors[0]; const secondary = colors[1] || adjustColorBrightness(primary, -25); const accent = colors[2] || adjustColorBrightness(primary, 30); resolve({ primary, secondary, accent, logoBgColor: bgHex, suggestedTheme }); }; img.onerror = () => resolve(fallback); img.src = imageUrl; }); }

function FeatureToggle({ featureKey, enabled, onToggle, theme }: { featureKey: string; enabled: boolean; onToggle: () => void; theme: any; }) { const info = FEATURE_LABELS[featureKey]; if (!info) return null; return (<div className="flex items-center justify-between py-2.5 px-1 group"><div className="flex-1 min-w-0 mr-3"><p className="text-sm font-medium" style={{ color: enabled ? theme.text : theme.textMuted }}>{info.label}</p></div><button type="button" onClick={onToggle} className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none" style={{ backgroundColor: enabled ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db') }}><span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out" style={{ transform: enabled ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} /></button></div>); }

// Official Stripe-branded connect button: Stripe blurple (#635BFF) + the Stripe
// wordmark. Agency owners recognise it as Stripe's own secure flow, which lifts
// trust and completion versus a generic themed button.
// Verified Stripe mark (Bootstrap Icons path): the rounded-square "S". Renders
// reliably at any size. `color` fills the square; the S is the cut-out.
function StripeMark({ className = '', color = '#635BFF' }: { className?: string; color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill={color} className={className} role="img" aria-label="Stripe">
      <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.226 5.385c-.584 0-.937.164-.937.593 0 .468.607.674 1.36.93 1.228.415 2.844.963 2.851 2.993C11.5 11.868 9.924 13 7.63 13a7.7 7.7 0 0 1-3.009-.626V9.758c.926.506 2.095.88 3.01.88.617 0 1.058-.165 1.058-.671 0-.518-.658-.755-1.453-1.041C6.026 8.49 4.5 7.94 4.5 6.11 4.5 4.165 5.988 3 8.226 3a7.3 7.3 0 0 1 2.734.505v2.583c-.838-.45-1.896-.703-2.734-.703"/>
    </svg>
  );
}

function StripeConnectButton({ onClick, loading, disabled, label = 'Connect with Stripe', className = '' }: { onClick: () => void; loading?: boolean; disabled?: boolean; label?: string; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${className}`}
      style={{ backgroundColor: '#635BFF' }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <StripeMark color="#fff" className="h-4 w-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

// Searchable country picker. A plain native <select> with 40+ options is a
// poor mobile experience (the iOS wheel especially), so this is a button that
// opens a type-to-filter list. Used once, before Stripe Connect onboarding, to
// choose the account country. Closes on outside click or selection.
function CountrySelect({ value, onChange, theme }: { value: string; onChange: (code: string) => void; theme: any }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = CONNECT_COUNTRIES.find((c) => c.code === value) || null;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? CONNECT_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
    : CONNECT_COUNTRIES;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors"
        style={{ backgroundColor: theme.isDark ? '#050505' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: selected ? theme.text : theme.textMuted }}
      >
        <span>{selected ? selected.name : 'Select your country'}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform" style={{ color: theme.textMuted, transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1.5 w-full rounded-xl overflow-hidden"
          style={{ backgroundColor: theme.isDark ? '#0a0a0a' : '#ffffff', border: `1px solid ${theme.inputBorder}`, boxShadow: '0 16px 40px rgba(0,0,0,0.30)' }}
        >
          <div className="p-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ backgroundColor: theme.input }}>
              <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.textMuted }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search countries"
                className="w-full bg-transparent text-sm focus:outline-none"
                style={{ color: theme.text }}
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs" style={{ color: theme.textMuted }}>No matches</p>
            ) : (
              filtered.map((c) => {
                const active = c.code === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { onChange(c.code); setOpen(false); setQuery(''); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors"
                    style={{ color: theme.text, backgroundColor: active ? theme.primary15 : 'transparent' }}
                    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    <span>{c.name}</span>
                    {active && <Check className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProUpgradeCard({ title, description, theme }: { title?: string; description: string; theme: any }) {
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 pointer-events-auto w-full max-w-md"
      style={{
        backgroundColor: theme.card,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.isDark
          ? '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 24px 60px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}cc 100%)` }}
        >
          <Sparkles className="h-5 w-5" style={{ color: theme.primaryText }} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>{title || 'Unlock with Pro'}</p>
          <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Available on Pro and above</p>
        </div>
      </div>
      <p className="text-xs sm:text-sm mb-4 leading-relaxed" style={{ color: theme.textMuted }}>{description}</p>
      <a
        href="/agency/settings?tab=billing"
        className="inline-flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        style={{ backgroundColor: theme.primary, color: theme.primaryText }}
      >
        Upgrade to Pro
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function ProFeatureGate({ isFreePlan, title, description, theme, children }: { isFreePlan: boolean; title?: string; description: string; theme: any; children: React.ReactNode }) {
  if (!isFreePlan) return <>{children}</>;
  return (
    <div className="relative">
      <div
        className="opacity-40 pointer-events-none select-none"
        style={{ filter: 'blur(1.5px)' }}
        aria-hidden="true"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-6 sm:pt-10 px-4 pointer-events-none">
        <ProUpgradeCard title={title} description={description} theme={theme} />
      </div>
    </div>
  );
}

function AgencySettingsContent() {
  const { agency, user, branding, loading: contextLoading, refreshAgency, demoMode, toggleDemoMode, hasPermission } = useAgency();
  const theme = useTheme();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
  const validTabs: SettingsTab[] = ['profile', 'pricing', 'payments', 'billing', 'twilio', 'embed', 'team', 'demo', 'support'];
  const [activeTab, setActiveTab] = useState<SettingsTab>(validTabs.includes(initialTab) ? initialTab : 'profile');
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null); const [loadingStripeStatus, setLoadingStripeStatus] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false); const [disconnectingStripe, setDisconnectingStripe] = useState(false);
  // Country for a NEW Stripe Connect account. A connected account's country is
  // immutable, so it is chosen before connecting and posted to the onboard
  // endpoint. Initialized from the agency's stored country, else US.
  const [connectCountry, setConnectCountry] = useState('US');
  const [showCancelModal, setShowCancelModal] = useState(false); const [portalLoading, setPortalLoading] = useState(false);
  const [agencyName, setAgencyName] = useState(''); const [logoUrl, setLogoUrl] = useState(''); const [logoPreview, setLogoPreview] = useState<string | null>(null); const [removingLogo, setRemovingLogo] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false); const [extractedColors, setExtractedColors] = useState<{ primary: string; secondary: string; accent: string } | null>(null);
  const [brandColors, setBrandColors] = useState({ primary: '#10b981', secondary: '#059669', accent: '#34d399' });
  const [priceStarter, setPriceStarter] = useState('99'); const [pricePro, setPricePro] = useState('149'); const [priceGrowth, setPriceGrowth] = useState('299');
  // One-time client setup fee, in dollars (empty = no fee). Saved to
  // setup_fee_cents (cents) with the Pricing tab Save button.
  const [setupFee, setSetupFee] = useState('');
  const [limitStarter, setLimitStarter] = useState('50'); const [limitPro, setLimitPro] = useState('150'); const [limitGrowth, setLimitGrowth] = useState('500');
  const [unlimitedStarter, setUnlimitedStarter] = useState(false); const [unlimitedPro, setUnlimitedPro] = useState(false); const [unlimitedGrowth, setUnlimitedGrowth] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<Record<string, Record<string, boolean | number>>>(DEFAULT_PLAN_FEATURES);

  // Editable white-label subdomain (slug). Own state + own Save action, like
  // the password and per-minute sections, so it can show inline taken/invalid/
  // reserved errors without going through the profile Save. Posts { slug } to
  // the settings PUT; the backend normalizes, checks the reserved list, and
  // enforces case-insensitive uniqueness.
  const [slugInput, setSlugInput] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugSaved, setSlugSaved] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  // require_card_for_trial toggle. When true, /api/client/signup creates a
  // Stripe Connect Checkout with trial_period_days=7 instead of inserting a
  // DB-only trial. Requires stripe_charges_enabled=true to take effect.
  // Backend silently no-ops if Stripe Connect isn't ready (falls back to
  // no-card trial so signups don't break).
  const [requireCardForTrial, setRequireCardForTrial] = useState(false);

  // Client per-minute billing (Payments tab). Rate is collected in dollars and
  // converted to cents on save. Included minutes are per-plan integers. The
  // master switch (minutePassThrough) is NOT saved via the settings PUT: it
  // goes through POST /api/agency/:id/minute-pass-through, which validates,
  // creates the connected-account meter, and sweeps existing clients.
  const [minutePassThrough, setMinutePassThrough] = useState(false);
  const [clientMinuteRate, setClientMinuteRate] = useState('');
  const [includedStarter, setIncludedStarter] = useState('0');
  const [includedPro, setIncludedPro] = useState('0');
  const [includedGrowth, setIncludedGrowth] = useState('0');
  const [minuteSaving, setMinuteSaving] = useState(false);
  const [minuteSaved, setMinuteSaved] = useState(false);
  const [minuteToggleLoading, setMinuteToggleLoading] = useState(false);
  const [minuteError, setMinuteError] = useState<string | null>(null);
  const [minuteSweepMsg, setMinuteSweepMsg] = useState<string | null>(null);

  // Client billing mode. 'connect' (default) routes NEW clients through Stripe
  // Connect checkout; 'manual' onboards NEW clients with no Stripe step (the
  // agency bills them itself by invoice / payment link). Saved via the settings
  // PUT (client_billing_mode) with its own toggle action, since the Payments
  // tab has no shared Save button. Switching affects only clients added
  // afterward; existing clients keep their stamped billing mode.
  const [clientBillingMode, setClientBillingMode] = useState<'connect' | 'manual'>('connect');
  const [billingModeLoading, setBillingModeLoading] = useState(false);
  const [billingModeError, setBillingModeError] = useState<string | null>(null);
  const [billingModeSaved, setBillingModeSaved] = useState(false);

  const [planStarterName, setPlanStarterName] = useState('Starter');
  const [planProName, setPlanProName] = useState('Professional');
  const [planGrowthName, setPlanGrowthName] = useState('Growth');
  const [planStarterDescription, setPlanStarterDescription] = useState('');
  const [planProDescription, setPlanProDescription] = useState('');
  const [planGrowthDescription, setPlanGrowthDescription] = useState('');

  const [feedbackMessage, setFeedbackMessage] = useState(''); const [sendingFeedback, setSendingFeedback] = useState(false); const [feedbackSent, setFeedbackSent] = useState(false); const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]); const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Change password (self-service, logged-in agency user). Posts to
  // /api/auth/change-password, which reads the caller from the Bearer JWT and
  // verifies currentPassword server-side before writing the new hash.
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [embedCopied, setEmbedCopied] = useState(false);
  const [usageData, setUsageData] = useState<any>(null); const [usageLoading, setUsageLoading] = useState(false); const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [clientHeaderMode, setClientHeaderMode] = useState<'agency_name' | 'business_name'>('agency_name');
  const [allowClientBranding, setAllowClientBranding] = useState(false);
  const [detectedWebsiteTheme, setDetectedWebsiteTheme] = useState<'light' | 'dark' | null>(null); const [detectedLogoBgColor, setDetectedLogoBgColor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const isOnTrial = isTrialStatus(agency?.subscription_status);
  const trialDaysLeft = agency?.trial_ends_at ? Math.max(0, Math.ceil((new Date(agency.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const planPrice = PLAN_PRICING[agency?.plan_type || 'starter'] || 99;
  const isFreePlan = agency?.plan_type === 'free' || agency?.plan_type === 'starter';

  // Card-required toggle is only meaningful when the agency has Stripe Connect
  // set up AND can accept charges. UI grays out the toggle when this is false
  // and shows a link to the Payments tab.
  const canEnableCardRequired = !!(agency?.stripe_account_id && (agency as any)?.stripe_charges_enabled);

  // Per-minute pass-through gating. The toggle can only be turned ON when
  // Stripe Connect can accept charges AND a rate is already SAVED (> 0). It can
  // always be turned OFF. savedRateCents reads the persisted agency value (not
  // the local input), so a rate typed but not yet saved does not unlock it.
  const connectChargesReady = !!(stripeStatus?.charges_enabled || (agency as any)?.stripe_charges_enabled);
  const savedRateCents = Number((agency as any)?.client_minute_rate_cents) || 0;
  const canEnableMinutePassThrough = connectChargesReady && savedRateCents > 0;

  // Slug derived state. Normalized against the stored value so the Save button
  // only enables on a real, well-formed change.
  const slugNormalized = slugInput.trim().toLowerCase();
  const slugChanged = slugNormalized !== (agency?.slug || '').toLowerCase();
  const slugFormatOk = isSlugFormatValid(slugNormalized);

  useEffect(() => { if (agency) { setAgencyName(agency.name || ''); setSlugInput(agency.slug || ''); setLogoUrl(agency.logo_url || ''); setLogoPreview(agency.logo_url); setPriceStarter(agency.price_starter != null ? (agency.price_starter / 100).toString() : ''); setPricePro(agency.price_pro != null ? (agency.price_pro / 100).toString() : ''); setPriceGrowth(agency.price_growth != null ? (agency.price_growth / 100).toString() : ''); setSetupFee((((agency as any).setup_fee_cents ?? 0) as number) > 0 ? (((agency as any).setup_fee_cents as number) / 100).toString() : ''); const ls = agency.limit_starter; const lp = agency.limit_pro; const lg = agency.limit_growth; setUnlimitedStarter(ls === -1); setUnlimitedPro(lp === -1); setUnlimitedGrowth(lg === -1); setLimitStarter(ls === -1 ? '50' : (ls || 50).toString()); setLimitPro(lp === -1 ? '150' : (lp || 150).toString()); setLimitGrowth(lg === -1 ? '500' : (lg || 500).toString()); setPlanFeatures((agency as any).plan_features || DEFAULT_PLAN_FEATURES); setBrandColors({ primary: agency.primary_color || '#10b981', secondary: agency.secondary_color || '#059669', accent: agency.accent_color || '#34d399' }); setClientHeaderMode((agency as any).client_header_mode || 'agency_name'); setAllowClientBranding((agency as any).allow_client_branding || false); setPlanStarterName((agency as any).plan_starter_name || 'Starter'); setPlanProName((agency as any).plan_pro_name || 'Professional'); setPlanGrowthName((agency as any).plan_growth_name || 'Growth'); setPlanStarterDescription((agency as any).plan_starter_description || ''); setPlanProDescription((agency as any).plan_pro_description || ''); setPlanGrowthDescription((agency as any).plan_growth_description || ''); setRequireCardForTrial((agency as any).require_card_for_trial === true); setMinutePassThrough((agency as any).minute_pass_through === true); const _rc = Number((agency as any).client_minute_rate_cents); setClientMinuteRate(_rc > 0 ? (_rc / 100).toString() : ''); setIncludedStarter(String((agency as any).included_minutes_starter ?? 0)); setIncludedPro(String((agency as any).included_minutes_pro ?? 0)); setIncludedGrowth(String((agency as any).included_minutes_growth ?? 0)); setClientBillingMode((agency as any).client_billing_mode === 'manual' ? 'manual' : 'connect'); } }, [agency?.branding_overrides]);
  useEffect(() => { if (activeTab === 'payments' && agency?.id) fetchStripeStatus(); }, [activeTab, agency?.id]);
  useEffect(() => { if (agency) setConnectCountry(((((agency as any).country as string) || 'US')).toUpperCase()); }, [agency?.id]);
  useEffect(() => { if (activeTab === 'support' && agency?.id) fetchFeedbackHistory(); }, [activeTab, agency?.id]);
  useEffect(() => { if (activeTab === 'billing' && agency?.id) fetchUsageData(); }, [activeTab, agency?.id]);

  const handleTabChange = (tab: SettingsTab) => { setActiveTab(tab); const url = new URL(window.location.href); url.searchParams.set('tab', tab); window.history.replaceState({}, '', url.toString()); };
  const fetchStripeStatus = async () => { if (!agency) return; setLoadingStripeStatus(true); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/connect/status/${agency.id}`, { headers: { 'Authorization': `Bearer ${token}` } }); if (response.ok) setStripeStatus(await response.json()); } catch (err) { console.error('Failed to fetch Stripe status:', err); } finally { setLoadingStripeStatus(false); } };
  const fetchFeedbackHistory = async () => { if (!agency) return; setLoadingFeedback(true); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/${agency.id}/feedback`, { headers: { 'Authorization': `Bearer ${token}` } }); if (response.ok) { const data = await response.json(); setFeedbackHistory(data.feedback || []); } } catch (err) { console.error('Failed to fetch feedback:', err); } finally { setLoadingFeedback(false); } };
  const fetchUsageData = async () => { if (!agency) return; setUsageLoading(true); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/${agency.id}/usage`, { headers: { 'Authorization': `Bearer ${token}` } }); if (response.ok) { const data = await response.json(); setUsageData(data.usage); } } catch (err) { console.error('Failed to fetch usage:', err); } finally { setUsageLoading(false); } };
  const handleUpgrade = async (targetPlan: string) => { if (!agency) return; setUpgradeLoading(targetPlan); setError(null); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ agency_id: agency.id, plan: targetPlan }) }); const data = await response.json(); if (data.url) window.location.href = data.url; else setError(data.error || 'Failed to start upgrade'); } catch (err) { setError('Failed to connect to billing'); } finally { setUpgradeLoading(null); } };
  const handleSendFeedback = async () => { if (!agency || !feedbackMessage.trim()) return; setSendingFeedback(true); setFeedbackError(null); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/${agency.id}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ message: feedbackMessage.trim() }) }); if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to send feedback'); } const data = await response.json(); setFeedbackSent(true); setFeedbackMessage(''); if (data.feedback) setFeedbackHistory(prev => [data.feedback, ...prev]); setTimeout(() => setFeedbackSent(false), 3000); } catch (err) { setFeedbackError(err instanceof Error ? err.message : 'Failed to send feedback'); } finally { setSendingFeedback(false); } };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordChanged(false);

    if (!currentPassword || !newPassword) {
      setPasswordError('Enter your current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from your current one.');
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password');

      setPasswordChanged(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordChanged(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Save just the slug via the settings PUT. Kept separate from the profile
  // Save so the taken/invalid/reserved errors can render inline next to the
  // field. On success, refreshAgency() pulls the new slug back so slugChanged
  // recomputes and the button disables again.
  const handleSaveSlug = async () => {
    if (!agency) return;
    setSlugError(null);
    setSlugSaved(false);

    const slug = slugInput.trim().toLowerCase();
    if (!isSlugFormatValid(slug)) {
      setSlugError('Use 3 to 63 characters: lowercase letters, numbers, and hyphens, not starting or ending with a hyphen.');
      return;
    }

    setSavingSlug(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'slug_taken') setSlugError('That subdomain is already taken. Try another.');
        else if (data.error === 'slug_reserved') setSlugError('That subdomain is reserved. Try another.');
        else if (data.error === 'slug_invalid') setSlugError(data.message || 'That subdomain is not valid.');
        else setSlugError(data.error || 'Failed to update subdomain.');
        return;
      }
      await refreshAgency();
      setSlugSaved(true);
      setTimeout(() => setSlugSaved(false), 6000);
    } catch (err) {
      setSlugError(err instanceof Error ? err.message : 'Failed to update subdomain.');
    } finally {
      setSavingSlug(false);
    }
  };

  const settingsTabs = [{ id: 'profile' as SettingsTab, label: 'Profile', icon: Building }, { id: 'pricing' as SettingsTab, label: 'Pricing', icon: DollarSign }, { id: 'payments' as SettingsTab, label: 'Payments', icon: CreditCard }, { id: 'billing' as SettingsTab, label: 'Billing', icon: Receipt }, { id: 'twilio' as SettingsTab, label: 'Twilio', icon: Globe }, { id: 'embed' as SettingsTab, label: 'Embed', icon: Code }, { id: 'team' as SettingsTab, label: 'Team', icon: Users }, { id: 'demo' as SettingsTab, label: 'Demo Mode', icon: Eye }, { id: 'support' as SettingsTab, label: 'Support', icon: LifeBuoy }].filter(tab => { if (tab.id === 'team' && user?.role === 'agency_staff') return false; if (tab.id === 'embed' && !isFreePlan) return false; if (tab.id === 'billing') return hasPermission('billing'); return hasPermission('settings'); });

  // If the requested tab (e.g. from a ?tab= URL) isn't one this member is
  // allowed to see, fall back to the first permitted tab so the gated content
  // can't render behind a hidden tab button. Owners pass every check, so this
  // only ever moves a restricted staff member.
  useEffect(() => {
    if (settingsTabs.length > 0 && !settingsTabs.some(t => t.id === activeTab)) {
      setActiveTab(settingsTabs[0].id);
    }
  }, [settingsTabs, activeTab]);

  const handleRemoveLogo = async () => {
    if (!agency) return;
    setRemovingLogo(true); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ logo_url: null, favicon_url: null, logo_background_color: null, primary_color: '#10b981', secondary_color: '#059669', accent_color: '#34d399', branding_overrides: null }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to remove logo'); }
      setLogoUrl(''); setLogoPreview(null); setExtractedColors(null); setBrandColors({ primary: '#10b981', secondary: '#059669', accent: '#34d399' }); setDetectedLogoBgColor(null); setDetectedWebsiteTheme(null);
      await refreshAgency();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to remove logo'); }
    finally { setRemovingLogo(false); }
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = async () => { const dataUrl = reader.result as string; setLogoPreview(dataUrl); setLogoUrl(dataUrl); setExtractingColors(true); try { const result = await extractColorsFromImage(dataUrl); setExtractedColors({ primary: result.primary, secondary: result.secondary, accent: result.accent }); setBrandColors({ primary: result.primary, secondary: result.secondary, accent: result.accent }); setDetectedWebsiteTheme(result.suggestedTheme); setDetectedLogoBgColor(result.logoBgColor); } catch (err) { console.error('Color extraction failed:', err); } finally { setExtractingColors(false); } }; reader.readAsDataURL(file); } };
  const toggleFeature = (plan: string, feature: string) => { setPlanFeatures(prev => ({ ...prev, [plan]: { ...prev[plan], [feature]: !prev[plan]?.[feature] } })); };
  const resetPlanFeatures = () => setPlanFeatures(DEFAULT_PLAN_FEATURES);
  const deriveCalendarEnabledPlans = (features: Record<string, Record<string, boolean | number>>): string[] => { return Object.entries(features).filter(([, fm]) => fm.google_calendar).map(([plan]) => plan); };

  const handleSave = async () => {
    if (!agency) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const token = localStorage.getItem('auth_token');
      const payload: any = {};

      if (activeTab === 'profile') {
        payload.name = agencyName;
        payload.logo_url = logoUrl;
        if (extractedColors) {
          payload.primary_color = brandColors.primary;
          payload.secondary_color = brandColors.secondary;
          payload.accent_color = brandColors.accent;
        }
        if (detectedWebsiteTheme) payload.website_theme = detectedWebsiteTheme;
        if (detectedLogoBgColor) payload.logo_background_color = detectedLogoBgColor;
        payload.client_header_mode = clientHeaderMode;
        payload.allow_client_branding = allowClientBranding;
      } else if (activeTab === 'pricing') {
        payload.price_starter = priceStarter.trim() === '' ? null : Math.round(parseFloat(priceStarter) * 100);
        payload.price_pro = pricePro.trim() === '' ? null : Math.round(parseFloat(pricePro) * 100);
        payload.price_growth = priceGrowth.trim() === '' ? null : Math.round(parseFloat(priceGrowth) * 100);
        // One-time setup fee: dollars in the input, cents to the backend. Blank
        // or non-numeric clears it (null = no fee).
        const _setupTrim = setupFee.trim();
        const _setupParsed = parseFloat(_setupTrim);
        payload.setup_fee_cents = (_setupTrim === '' || Number.isNaN(_setupParsed))
          ? null
          : Math.round(_setupParsed * 100);
        payload.limit_starter = unlimitedStarter ? -1 : parseInt(limitStarter);
        payload.limit_pro = unlimitedPro ? -1 : parseInt(limitPro);
        payload.limit_growth = unlimitedGrowth ? -1 : parseInt(limitGrowth);
        payload.plan_features = planFeatures;
        payload.calendar_enabled_plans = deriveCalendarEnabledPlans(planFeatures);
        payload.plan_starter_name = planStarterName.trim() || PLAN_NAME_DEFAULTS.starter;
        payload.plan_pro_name = planProName.trim() || PLAN_NAME_DEFAULTS.pro;
        payload.plan_growth_name = planGrowthName.trim() || PLAN_NAME_DEFAULTS.growth;
        payload.plan_starter_description = planStarterDescription.trim() || null;
        payload.plan_pro_description = planProDescription.trim() || null;
        payload.plan_growth_description = planGrowthDescription.trim() || null;
        // Client trial card requirement. Backend silently ignores this if
        // stripe_charges_enabled is false (falls back to no-card trial at
        // signup time), but we persist the preference so it takes effect
        // as soon as Connect is configured.
        payload.require_card_for_trial = !!requireCardForTrial;
      }

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to save settings'); }
      await refreshAgency();
      setSaved(true);
      setDetectedWebsiteTheme(null);
      setDetectedLogoBgColor(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Save the rate + per-plan included minutes via the settings PUT. The column
  // is cents, so dollars are multiplied by 100 before sending. Empty rate saves
  // as null (clears it). refreshAgency() pulls the persisted values back so
  // savedRateCents (which gates the toggle) reflects the new rate immediately.
  const handleSaveMinuteBilling = async () => {
    if (!agency) return;
    setMinuteSaving(true); setMinuteError(null); setMinuteSaved(false); setMinuteSweepMsg(null);
    try {
      const token = localStorage.getItem('auth_token');
      const dollars = parseFloat(clientMinuteRate);
      const rateCents = (clientMinuteRate.trim() === '' || Number.isNaN(dollars))
        ? null
        : Math.round(dollars * 1000000) / 10000;
      const payload = {
        client_minute_rate_cents: rateCents,
        included_minutes_starter: parseInt(includedStarter) || 0,
        included_minutes_pro: parseInt(includedPro) || 0,
        included_minutes_growth: parseInt(includedGrowth) || 0,
      };
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to save'); }
      await refreshAgency();
      setMinuteSaved(true);
      setTimeout(() => setMinuteSaved(false), 3000);
    } catch (err) {
      setMinuteError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setMinuteSaving(false);
    }
  };

  // Flip the master switch. The toggle does NOT change visually until the POST
  // succeeds, so a 400 (rate_required / stripe_not_ready) leaves it where it
  // was. On enable success the backend returns a sweep result (how many
  // existing clients got the metered item); surface it.
  const handleToggleMinutePassThrough = async () => {
    if (!agency) return;
    const next = !minutePassThrough;
    setMinuteToggleLoading(true); setMinuteError(null); setMinuteSaved(false); setMinuteSweepMsg(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/minute-pass-through`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'rate_required') setMinuteError('Set and save a per-minute rate above 0 before turning this on.');
        else if (data.error === 'stripe_not_ready') setMinuteError('Finish Stripe Connect setup before turning this on.');
        else setMinuteError(data.error || 'Failed to update');
        return; // leave the toggle where it was
      }
      setMinutePassThrough(next);
      if (next && data.sweep) {
        const n = data.sweep.attached || 0;
        setMinuteSweepMsg(`Enabled. Applied to ${n} existing ${n === 1 ? 'client' : 'clients'}.`);
      }
      await refreshAgency();
    } catch (err) {
      setMinuteError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setMinuteToggleLoading(false);
    }
  };

  // Flip client billing mode ('connect' <-> 'manual') via the settings PUT.
  // No retroactive side effects: each client is stamped its billing mode at
  // creation, so this only changes what NEW clients get. The toggle flips only
  // after the PUT succeeds; a failure leaves it where it was. refreshAgency()
  // pulls the persisted value back so the toggle reflects the saved state.
  const handleToggleClientBillingMode = async () => {
    if (!agency) return;
    const next = clientBillingMode === 'manual' ? 'connect' : 'manual';
    setBillingModeLoading(true); setBillingModeError(null); setBillingModeSaved(false);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ client_billing_mode: next }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }
      setClientBillingMode(next);
      setBillingModeSaved(true);
      await refreshAgency();
      setTimeout(() => setBillingModeSaved(false), 3000);
    } catch (err) {
      setBillingModeError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setBillingModeLoading(false);
    }
  };

  const handleStripeConnect = async () => { if (!agency) return; setConnectingStripe(true); setError(null); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/connect/onboard`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ agency_id: agency.id, country: connectCountry }) }); if (!response.ok) { const data = await response.json(); throw new Error(data.message || data.error || 'Failed to start Stripe onboarding'); } const data = await response.json(); window.location.href = data.url; } catch (err) { setError(err instanceof Error ? err.message : 'Failed to connect Stripe'); setConnectingStripe(false); } };
  const handleStripeDisconnect = async () => { if (!agency) return; if (!confirm('Disconnect Stripe? You won\'t receive payments until you reconnect.')) return; setDisconnectingStripe(true); setError(null); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/${agency.id}/connect/disconnect`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }); if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to disconnect Stripe'); } await refreshAgency(); setStripeStatus(null); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to disconnect Stripe'); } finally { setDisconnectingStripe(false); } };
  const handleManageSubscription = async () => { if (!agency) return; setPortalLoading(true); setError(null); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/portal`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ agency_id: agency.id }) }); if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to open billing portal'); } const data = await response.json(); if (data.url) window.location.href = data.url; else if (data.needs_payment_method) setError('Add a payment method first. Use the upgrade options below.'); else setError('Failed to open billing portal'); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to open billing portal'); } finally { setPortalLoading(false); } };

  if (contextLoading) return (<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} /></div>);

  const getStripeStatusDisplay = () => { if (!stripeStatus?.connected && !agency?.stripe_account_id) return { status: 'not_connected', label: 'Not Connected', color: theme.textMuted }; if (stripeStatus?.charges_enabled && stripeStatus?.payouts_enabled) return { status: 'active', label: 'Active', color: '#34d399' }; if (stripeStatus?.connected || agency?.stripe_account_id) return { status: 'restricted', label: 'Setup Incomplete', color: '#fbbf24' }; return { status: 'not_connected', label: 'Not Connected', color: theme.textMuted }; };
  const stripeDisplay = getStripeStatusDisplay();
  const getSubscriptionDisplay = () => { const status = agency?.subscription_status; if (status === 'active') return { label: 'Active', color: '#34d399', bgColor: 'rgba(52,211,153,0.1)' }; if (isTrialStatus(status)) return { label: 'Trial', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.1)' }; if (status === 'past_due') return { label: 'Past Due', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)' }; if (status === 'canceled' || status === 'cancelled') return { label: 'Canceled', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)' }; return { label: status || 'Unknown', color: theme.textMuted, bgColor: theme.input }; };
  const subscriptionDisplay = getSubscriptionDisplay();
  const demoFeatures = [{ label: 'Dashboard', desc: '32 clients, $3,200 MRR, 2,417 total calls' }, { label: 'Clients', desc: '32 realistic service businesses with plans & call data' }, { label: 'Call History', desc: '10 calls with AI summaries, urgency levels, transcripts' }, { label: 'Analytics', desc: 'Revenue charts, plan breakdown, payment history' }, { label: 'Leads', desc: '8 leads across all pipeline stages with follow-ups' }, { label: 'Referrals', desc: '6 referred agencies, commissions, payout history' }];
  const dynamicStyles = `.agency-settings ::selection { background-color: #3b82f640; color: inherit; } .agency-settings input:focus, .agency-settings select:focus, .agency-settings textarea:focus { outline: none; border-color: ${theme.primary} !important; box-shadow: 0 0 0 3px ${theme.primary}20 !important; }`;
  const getFeatureCount = (plan: string) => Object.entries(planFeatures[plan] || {}).filter(([k, v]) => k !== 'team_members' && v === true).length;

  const pricingPlans = [
    { key: 'starter', defaultLabel: 'Starter', price: priceStarter, setPrice: setPriceStarter, limit: limitStarter, setLimit: setLimitStarter, unlimited: unlimitedStarter, setUnlimited: setUnlimitedStarter, highlight: false, name: planStarterName, setName: setPlanStarterName, description: planStarterDescription, setDescription: setPlanStarterDescription },
    { key: 'pro', defaultLabel: 'Professional', price: pricePro, setPrice: setPricePro, limit: limitPro, setLimit: setLimitPro, unlimited: unlimitedPro, setUnlimited: setUnlimitedPro, highlight: true, name: planProName, setName: setPlanProName, description: planProDescription, setDescription: setPlanProDescription },
    { key: 'growth', defaultLabel: 'Growth', price: priceGrowth, setPrice: setPriceGrowth, limit: limitGrowth, setLimit: setLimitGrowth, unlimited: unlimitedGrowth, setUnlimited: setUnlimitedGrowth, highlight: false, name: planGrowthName, setName: setPlanGrowthName, description: planGrowthDescription, setDescription: setPlanGrowthDescription },
  ];

  return (
    <div className="agency-settings p-4 sm:p-6 lg:p-8">
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />

      {/* Cancel Subscription modal. Self-contained component: step 1 is confirm
          with an optional free-text note (POST /api/agency/cancel), step 2 is
          the post-cancel screen with optional reason chips
          (POST /api/agency/cancel-category). It owns its own state, API calls,
          and session teardown on finish. */}
      {showCancelModal && (
        <CancelSubscriptionModal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          agencyId={agency?.id || ''}
          isOnTrial={isOnTrial}
          theme={theme}
          backendUrl={backendUrl}
        />
      )}

      <div className="mb-6 sm:mb-8"><h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Settings</h1><p className="mt-1 text-sm" style={{ color: theme.textMuted }}>Manage your agency settings</p></div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:w-48 flex-shrink-0"><nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">{settingsTabs.map((tab) => (<button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab !== tab.id ? (theme.isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]') : ''}`} style={activeTab === tab.id ? { backgroundColor: theme.primary15, color: theme.primary } : { color: theme.textMuted }}><tab.icon className="h-4 w-4" />{tab.label}{tab.id === 'demo' && demoMode && (<div className="w-2 h-2 rounded-full ml-auto flex-shrink-0" style={{ backgroundColor: theme.primary }} />)}</button>))}</nav></div>

        <div className="flex-1 max-w-2xl">
          {error && (<div className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-sm" style={{ color: theme.errorText }}>{error}</p></div>)}
          {saved && (<div className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><Check className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.primary }} /><p className="text-sm" style={{ color: theme.primary }}>Settings saved!</p></div>)}

          <div className="rounded-xl p-4 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>

            {activeTab === 'profile' && (<div className="space-y-4 sm:space-y-6"><div><h3 className="text-base sm:text-lg font-medium mb-1">Agency Profile</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Basic information about your agency.</p></div><div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Agency Name</label><input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} /></div><ProFeatureGate isFreePlan={isFreePlan} theme={theme} description="Brand the platform as your own. Upload your logo, set custom colors, get a branded subdomain at yourname.myvoiceaiconnect.com, and customize how your clients see their dashboard. Pro unlocks full white-label so prospects never see VoiceAI Connect."><div className="space-y-4 sm:space-y-6"><div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Logo</label><div className="flex items-center gap-3 sm:gap-4"><div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>{logoPreview ? (<img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />) : (<Building className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.textMuted }} />)}</div><div className="min-w-0"><input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className={`inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${theme.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'}`} style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}><Upload className="h-4 w-4" />Upload</button>{logoPreview && (<button onClick={handleRemoveLogo} disabled={removingLogo} title="Remove logo and reset colors and favicon to default" className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ml-2 disabled:opacity-50" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>{removingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Remove</button>)}<p className="mt-1.5 text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>PNG, JPG up to 2MB</p></div></div>{extractingColors && (<div className="mt-3 flex items-center gap-2 text-sm" style={{ color: theme.primary }}><Loader2 className="h-4 w-4 animate-spin" /><span>Extracting brand colors...</span></div>)}{extractedColors && !extractingColors && (<div className="mt-4 rounded-xl p-4" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-sm font-medium" style={{ color: theme.primary }}>Colors extracted, saved with profile</span></div><div className="flex items-center gap-4">{([['Primary', 'primary'], ['Secondary', 'secondary'], ['Accent', 'accent']] as const).map(([label, key]) => (<div key={key} className="flex items-center gap-2"><div className="relative"><div className="w-8 h-8 rounded-lg border cursor-pointer" style={{ backgroundColor: brandColors[key], borderColor: theme.border }} /><input type="color" value={brandColors[key]} onChange={(e) => setBrandColors(prev => ({ ...prev, [key]: e.target.value }))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div><div><p className="text-[10px] font-medium" style={{ color: theme.text }}>{label}</p><p className="text-[9px] font-mono" style={{ color: theme.textMuted }}>{brandColors[key]}</p></div></div>))}</div>{detectedWebsiteTheme && (<div className="mt-3 flex items-center gap-2"><div className={`w-4 h-4 rounded border ${detectedWebsiteTheme === 'light' ? 'bg-white border-gray-300' : 'bg-[#050505] border-white/20'}`} /><p className="text-xs" style={{ color: theme.textMuted }}>Theme: <span className="font-medium" style={{ color: theme.primary }}>{detectedWebsiteTheme === 'light' ? 'Light' : 'Dark'}</span></p></div>)}<p className="text-xs mt-2" style={{ color: theme.textMuted }}>These update your Branding tab palette. Fine-tune there after saving.</p></div>)}</div><div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Subdomain</label><p className="text-[10px] sm:text-xs mb-2" style={{ color: theme.textMuted }}>Your white-label address. Lowercase letters, numbers, and hyphens, 3 to 63 characters.</p><div className="flex items-stretch rounded-xl overflow-hidden" style={{ border: `1px solid ${slugError ? theme.errorBorder : theme.inputBorder}` }}><input type="text" value={slugInput} onChange={(e) => { setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugError(null); setSlugSaved(false); }} spellCheck={false} autoCapitalize="none" autoCorrect="off" placeholder="your-agency" className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none" style={{ backgroundColor: theme.input, border: 'none', color: theme.text }} /><div className="flex items-center px-3 text-xs sm:text-sm whitespace-nowrap" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', color: theme.textMuted, borderLeft: `1px solid ${theme.inputBorder}` }}>.{platformDomain}</div></div><p className="mt-1.5 text-[10px] sm:text-xs break-all" style={{ color: theme.textMuted }}>Preview: https://{slugNormalized || 'your-agency'}.{platformDomain}/get-started</p>{slugError && (<div className="mt-2 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-xs sm:text-sm" style={{ color: theme.errorText }}>{slugError}</p></div>)}{slugSaved && (<div className="mt-2 rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} /><div className="text-xs sm:text-sm" style={{ color: theme.primary }}><p className="font-medium">Subdomain updated.</p><p style={{ color: theme.textMuted }}>Your old address stops working. Update it anywhere you shared it. Your embed code keeps working.</p></div></div>)}<button onClick={handleSaveSlug} disabled={savingSlug || !slugChanged || !slugFormatOk} className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{savingSlug ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Check className="h-4 w-4" />Save subdomain</>}</button></div><div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Client Dashboard Header</label><p className="text-[10px] sm:text-xs mb-3" style={{ color: theme.textMuted }}>What name appears in your clients&apos; dashboard sidebar and header.</p><div className="flex gap-2">{([{ value: 'agency_name' as const, label: 'Agency Name', desc: 'Shows your agency brand' }, { value: 'business_name' as const, label: 'Business Name', desc: "Shows each client's own name" }]).map((option) => (<button key={option.value} type="button" onClick={() => setClientHeaderMode(option.value)} className="flex-1 rounded-xl p-3 text-left transition-all" style={{ backgroundColor: clientHeaderMode === option.value ? theme.primary15 : theme.input, border: `2px solid ${clientHeaderMode === option.value ? theme.primary : theme.inputBorder}` }}><p className="text-sm font-medium" style={{ color: clientHeaderMode === option.value ? theme.primary : theme.text }}>{option.label}</p><p className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>{option.desc}</p></button>))}</div></div><div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Client Branding</label><p className="text-[10px] sm:text-xs mb-3" style={{ color: theme.textMuted }}>Allow clients to customize their own logo, colors, and theme in their dashboard settings.</p><div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: allowClientBranding ? theme.primary15 : theme.input, border: `1px solid ${allowClientBranding ? theme.primary30 : theme.inputBorder}` }}><div><p className="text-sm font-medium" style={{ color: allowClientBranding ? theme.primary : theme.text }}>Allow client branding</p><p className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>Clients can upload their own logo and set custom colors</p></div><button type="button" onClick={() => setAllowClientBranding(!allowClientBranding)} className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none" style={{ backgroundColor: allowClientBranding ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db') }}><span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out" style={{ transform: allowClientBranding ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} /></button></div></div></div></ProFeatureGate>

              {/* Change Password - self-service, available on every plan (account
                  security, not a Pro feature, so it sits OUTSIDE ProFeatureGate).
                  POST /api/auth/change-password reads the caller from the Bearer
                  JWT and verifies currentPassword server-side, so this is safe
                  from an unlocked screen. Backend minimum is 6 characters. */}
              <div className="pt-4 sm:pt-6" style={{ borderTop: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-4 w-4" style={{ color: theme.primary }} />
                  <h3 className="text-base sm:text-lg font-medium">Change Password</h3>
                </div>
                <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>Update the password you use to sign in to your agency dashboard.</p>

                {passwordError && (
                  <div className="mb-4 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
                    <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} />
                    <p className="text-sm" style={{ color: theme.errorText }}>{passwordError}</p>
                  </div>
                )}
                {passwordChanged && (
                  <div className="mb-4 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
                    <Check className="h-4 w-4" style={{ color: theme.primary }} />
                    <p className="text-sm" style={{ color: theme.primary }}>Password changed.</p>
                  </div>
                )}

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-11 text-sm transition-colors"
                        style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: theme.textMuted }}
                        aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors"
                      style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                    />
                    <p className="mt-1.5 text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>At least 6 characters.</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Confirm New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors"
                      style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                    />
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                  >
                    {changingPassword ? <><Loader2 className="h-4 w-4 animate-spin" />Changing...</> : <><Lock className="h-4 w-4" />Change Password</>}
                  </button>
                </div>
              </div>
            </div>)}

            {activeTab === 'pricing' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-1">Client Plans</h3>
                  <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Set pricing, call limits, and features for each plan your clients can choose.</p>
                </div>
                <div className="rounded-xl p-3 sm:p-4 flex items-start gap-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} />
                  <p className="text-xs sm:text-sm" style={{ color: theme.infoText }}>Every client gets the core AI receptionist regardless of plan. The features below are extras you can include or exclude per plan.</p>
                </div>

                {/* ─────────────────────────────────────────────────────────
                    Trial Setup - require_card_for_trial toggle.
                    Controls whether new embed-widget signups must enter a
                    card to start their 7-day trial. Toggle is gated on
                    Stripe Connect being set up (canEnableCardRequired).
                ───────────────────────────────────────────────────────── */}
                <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="h-4 w-4" style={{ color: theme.primary }} />
                    <h4 className="font-medium text-sm sm:text-base">Client Trial Setup</h4>
                  </div>
                  <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>
                    Control whether new clients need to enter a credit card to start their 7-day trial.
                    <br />
                    <strong style={{ color: theme.text }}>Affects only signups from your embed widget or marketing site</strong>, not clients you add manually from the dashboard.
                  </p>

                  <div className="flex items-start justify-between rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: requireCardForTrial && canEnableCardRequired ? theme.primary15 : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'), border: `1px solid ${requireCardForTrial && canEnableCardRequired ? theme.primary30 : theme.border}`, opacity: canEnableCardRequired ? 1 : 0.6 }}>
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium" style={{ color: requireCardForTrial && canEnableCardRequired ? theme.primary : theme.text }}>
                        Require credit card to start trial
                      </p>
                      <p className="text-[11px] sm:text-xs mt-1 leading-relaxed" style={{ color: theme.textMuted }}>
                        {requireCardForTrial
                          ? 'Clients enter a card during signup, get a 7-day free trial, and Stripe auto-charges them at day 7. Best for filtering serious leads.'
                          : 'Clients get a 7-day no-card trial via the embed widget. They must manually upgrade before or after trial ends to keep service.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => canEnableCardRequired && setRequireCardForTrial(!requireCardForTrial)}
                      disabled={!canEnableCardRequired}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
                      style={{
                        backgroundColor: requireCardForTrial && canEnableCardRequired ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'),
                        cursor: canEnableCardRequired ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <span
                        className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                        style={{ transform: requireCardForTrial && canEnableCardRequired ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }}
                      />
                    </button>
                  </div>

                  {!canEnableCardRequired && (
                    <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.warningText }} />
                      <div className="text-xs sm:text-sm" style={{ color: theme.warningText }}>
                        <p className="font-medium mb-0.5">Stripe Connect required</p>
                        <p style={{ color: theme.textMuted }}>
                          You need to connect Stripe before clients can be charged.{' '}
                          <a href="/agency/settings?tab=payments" className="underline" style={{ color: theme.primary }}>Set up Stripe Connect</a>
                        </p>
                      </div>
                    </div>
                  )}

                  {canEnableCardRequired && requireCardForTrial && (
                    <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} />
                      <div className="text-xs sm:text-sm" style={{ color: theme.infoText }}>
                        <p className="font-medium mb-0.5">How it works</p>
                        <ol className="space-y-0.5 list-decimal list-inside" style={{ color: theme.textMuted }}>
                          <li>Client fills out signup form on your site</li>
                          <li>Redirected to Stripe to enter card details</li>
                          <li>7-day free trial begins after card is on file</li>
                          <li>Stripe auto-charges on day 7 (client can cancel anytime before)</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>

                {/* One-Time Setup Fee. Optional one-time onboarding charge on top
                    of the monthly plan, billed on the client's first paid invoice
                    on the agency's connected account (they keep 100 percent). It
                    saves with the Pricing Save button (setup_fee_cents). Blank or
                    0 means no fee. Applies to Stripe-checkout (connect) clients;
                    a manual-billing agency collects any setup fee itself. */}
                <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4" style={{ color: theme.primary }} />
                    <h4 className="font-medium text-sm sm:text-base">One-Time Setup Fee</h4>
                  </div>
                  <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>
                    Optional. Charge each new client a one-time onboarding fee on top of their monthly plan. It is collected on their first paid invoice through your own Stripe account, so you keep 100 percent of it, and it shows as its own line at checkout. Leave blank for no setup fee.
                  </p>
                  <div className="mb-3">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Setup fee ($)</label>
                    <input
                      type="number" min="0" step="1"
                      value={setupFee}
                      onChange={(e) => setSetupFee(e.target.value)}
                      placeholder="0"
                      className="w-full sm:w-40 rounded-xl px-3 py-2 text-sm"
                      style={{ backgroundColor: theme.isDark ? '#050505' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                    />
                    <p className="mt-1 text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Charged once, when the client starts paying. Not charged during a free trial.</p>
                  </div>
                  <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} />
                    <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                      Applies to clients who pay through Stripe checkout. If you bill your clients yourself (manual billing), collect any setup fee on your own invoice.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {pricingPlans.map((plan) => (
                    <div key={plan.key} className="rounded-xl p-3 sm:p-4" style={plan.highlight ? { backgroundColor: `${theme.primary}08`, border: `1px solid ${theme.primary30}` } : { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm sm:text-base">{plan.name || plan.defaultLabel}</h4>
                          {plan.highlight && <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primary20, color: theme.primary }}>Popular</span>}
                        </div>
                        <span className="text-xs" style={{ color: theme.textMuted }}>{getFeatureCount(plan.key)} features</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Display Name</label>
                          <input
                            type="text"
                            value={plan.name}
                            onChange={(e) => plan.setName(e.target.value)}
                            placeholder={plan.defaultLabel}
                            maxLength={50}
                            className="w-full rounded-xl px-3 py-2 text-sm"
                            style={{ backgroundColor: theme.isDark ? '#050505' : plan.highlight ? '#ffffff' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                          />
                          <p className="mt-1 text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>What clients see on the signup widget</p>
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Tagline</label>
                          <input
                            type="text"
                            value={plan.description}
                            onChange={(e) => plan.setDescription(e.target.value)}
                            placeholder="e.g. Best for solo operators"
                            maxLength={200}
                            className="w-full rounded-xl px-3 py-2 text-sm"
                            style={{ backgroundColor: theme.isDark ? '#050505' : plan.highlight ? '#ffffff' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                          />
                          <p className="mt-1 text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Optional. Shows under the plan name.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                        <div>
                          <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Price ($/mo)</label>
                          <input type="number" value={plan.price} onChange={(e) => plan.setPrice(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: theme.isDark ? '#050505' : plan.highlight ? '#ffffff' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }} /><p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>Leave blank to hide this plan on your site.</p>
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Calls/mo</label>
                          {plan.unlimited ? (
                            <div className="w-full rounded-xl px-3 py-2 text-sm font-medium flex items-center justify-center" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}`, color: theme.primary, height: '38px' }}>Unlimited</div>
                          ) : (
                            <input type="number" value={plan.limit} onChange={(e) => plan.setLimit(e.target.value)} min="1" className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: theme.isDark ? '#050505' : plan.highlight ? '#ffffff' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                          )}
                          <button type="button" onClick={() => plan.setUnlimited(!plan.unlimited)} className="mt-1.5 text-[10px] sm:text-xs transition-colors" style={{ color: plan.unlimited ? theme.primary : theme.textMuted }}>
                            {plan.unlimited ? '✓ Unlimited' : 'Set unlimited'}
                          </button>
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Team Members</label>
                          <input type="number" min="0" value={Number(planFeatures[plan.key]?.team_members) || 0} onChange={(e) => setPlanFeatures(prev => ({ ...prev, [plan.key]: { ...prev[plan.key], team_members: parseInt(e.target.value) || 0 } }))} className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: theme.isDark ? '#050505' : plan.highlight ? '#ffffff' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                          <p className="mt-1.5 text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>0 = no team access</p>
                        </div>
                      </div>

                      <div className="rounded-lg px-3 py-1" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                        <p className="text-[10px] sm:text-xs font-medium py-2" style={{ color: theme.textMuted }}>Included Features</p>
                        <div className="divide-y" style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                          {FEATURE_ORDER.map((featureKey) => (
                            <div key={featureKey}>
                              {featureKey === 'caller_recognition' && (
                                <div className="pt-2 pb-1 mt-1" style={{ borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                                  <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.primary }}>AI Tools</p>
                                </div>
                              )}
                              <FeatureToggle featureKey={featureKey} enabled={!!planFeatures[plan.key]?.[featureKey]} onToggle={() => toggleFeature(plan.key, featureKey)} theme={theme} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button onClick={resetPlanFeatures} className="text-xs transition-colors" style={{ color: theme.textMuted }}>Reset features to defaults</button>
                </div>

                <div className="rounded-xl p-4 mt-2" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} />
                    <div>
                      <p className="text-xs sm:text-sm font-medium" style={{ color: theme.infoText }}>Team Members</p>
                      <p className="text-xs sm:text-sm mt-1" style={{ color: theme.textMuted }}>Your agency plan includes <strong style={{ color: theme.text }}>{formatTeamLimit(deriveAgencyTeamLimit({ maxTeamMembersAgency: (agency as any)?.max_team_members_agency, subscriptionStatus: agency?.subscription_status, planType: agency?.plan_type }))} agency team members</strong>. Client team limits are set per plan tier above.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4 sm:space-y-6">
                <div><h3 className="text-base sm:text-lg font-medium mb-1">Payment Settings</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Connect Stripe to receive payments from your clients.</p></div>
                {loadingStripeStatus ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} /></div>
                ) : (
                  <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                    <div className="flex items-center gap-4">
                      <StripeMark className="h-12 w-12 flex-shrink-0" color="#635BFF" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base">Stripe Connect</p>
                        <div className="flex items-center gap-2 mt-0.5"><div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stripeDisplay.color }} /><p className="text-xs sm:text-sm" style={{ color: stripeDisplay.color }}>{stripeDisplay.label}</p></div>
                      </div>
                      {stripeDisplay.status === 'active' ? (
                        <button onClick={handleStripeDisconnect} disabled={disconnectingStripe} className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.errorBg, color: theme.errorText }}>{disconnectingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Disconnect</button>
                      ) : stripeDisplay.status === 'restricted' ? (
                        <StripeConnectButton onClick={handleStripeConnect} loading={connectingStripe} label="Finish Stripe setup" />
                      ) : null}
                    </div>
                    {stripeDisplay.status === 'active' && (
                      <div className="mt-4 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                        <div className="flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}><span style={{ color: theme.textMuted }}>Charges</span><span className="flex items-center gap-1" style={{ color: '#34d399' }}><Check className="h-3 w-3" />Enabled</span></div>
                        <div className="flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}><span style={{ color: theme.textMuted }}>Payouts</span><span className="flex items-center gap-1" style={{ color: '#34d399' }}><Check className="h-3 w-3" />Enabled</span></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Client Billing Mode. How the agency bills its OWN clients.
                    Default 'connect' routes new clients through Stripe Connect
                    checkout. 'manual' onboards new clients with no Stripe step:
                    the agency bills them itself (invoice / payment link), which
                    is the option for agencies that cannot or will not use Stripe
                    Connect OAuth. Own toggle action (the Payments tab has no
                    shared Save). Only affects clients added afterward; existing
                    clients keep their stamped billing mode, and the agency's own
                    platform plan is billed the same either way. */}
                <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Receipt className="h-4 w-4" style={{ color: theme.primary }} />
                    <h4 className="font-medium text-sm sm:text-base">How You Bill Your Clients</h4>
                  </div>
                  <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>
                    By default, your clients pay through Stripe Connect. If you would rather bill them yourself with your own invoices or payment links, turn this on and new clients are set up with no card and no checkout.
                  </p>

                  {billingModeError && (
                    <div className="mb-3 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
                      <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} />
                      <p className="text-sm" style={{ color: theme.errorText }}>{billingModeError}</p>
                    </div>
                  )}
                  {billingModeSaved && (
                    <div className="mb-3 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
                      <Check className="h-4 w-4" style={{ color: theme.primary }} />
                      <p className="text-sm" style={{ color: theme.primary }}>Saved.</p>
                    </div>
                  )}

                  <div className="flex items-start justify-between rounded-xl px-4 py-3" style={{ backgroundColor: clientBillingMode === 'manual' ? theme.primary15 : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'), border: `1px solid ${clientBillingMode === 'manual' ? theme.primary30 : theme.border}` }}>
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium" style={{ color: clientBillingMode === 'manual' ? theme.primary : theme.text }}>Bill my clients myself</p>
                      <p className="text-[11px] sm:text-xs mt-1 leading-relaxed" style={{ color: theme.textMuted }}>
                        {clientBillingMode === 'manual'
                          ? 'On. New clients go live immediately with no card or checkout. You collect payment from them however you like (invoice, payment link).'
                          : 'Off. New clients pay through Stripe Connect checkout as usual.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleClientBillingMode}
                      disabled={billingModeLoading}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
                      style={{ backgroundColor: clientBillingMode === 'manual' ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'), cursor: billingModeLoading ? 'not-allowed' : 'pointer' }}
                    >
                      <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out" style={{ transform: clientBillingMode === 'manual' ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} />
                    </button>
                  </div>

                  {billingModeLoading && (
                    <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}><Loader2 className="h-3.5 w-3.5 animate-spin" />Updating...</div>
                  )}

                  <div className="mt-3 rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} />
                    <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                      This only changes clients you add from now on. Clients you already have keep their current billing. You are still billed by the platform the same either way.
                    </p>
                  </div>
                </div>

                {/* Country selector. A connected account's country is fixed at
                    creation and cannot be changed later, so the agency picks it
                    BEFORE connecting. Posted to /api/agency/connect/onboard,
                    which creates the Stripe account in this country. Shown only
                    before an account exists; once connected the country locks. */}
                {stripeDisplay.status === 'not_connected' && !loadingStripeStatus && (
                  <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Globe className="h-4 w-4" style={{ color: theme.primary }} />
                      <label className="text-sm font-medium" style={{ color: theme.text }}>Your country</label>
                    </div>
                    <p className="text-xs sm:text-sm mb-3" style={{ color: theme.textMuted }}>
                      Where your business or bank account is based. This sets up your Stripe account for the right country and currency.
                    </p>
                    <CountrySelect value={connectCountry} onChange={setConnectCountry} theme={theme} />
                    <p className="mt-2 text-[11px] sm:text-xs flex items-start gap-1.5" style={{ color: theme.textMuted }}>
                      <Info className="h-3.5 w-3.5 mt-px flex-shrink-0" />
                      This cannot be changed after you connect. To switch countries later you would disconnect and set up Stripe again.
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <StripeConnectButton onClick={handleStripeConnect} loading={connectingStripe} label="Connect with Stripe" className="w-full sm:w-auto" />
                      <p className="text-[11px] sm:text-xs" style={{ color: theme.textMuted }}>Takes about 2 minutes. Stripe handles the secure onboarding.</p>
                    </div>
                  </div>
                )}

                {/* No-LLC reassurance. Shown until Stripe is fully active, since
                    "I don't have an LLC yet" is the usual reason an agency owner
                    stalls here. Sole proprietors can onboard as an individual
                    with an SSN and a personal checking account. The account must
                    be in their own name, which is the detail that actually
                    causes failed payouts when it's wrong. Copy is country-aware:
                    US agencies see SSN/EIN wording, everyone else sees generic
                    individual/sole-trader wording. */}
                {stripeDisplay.status !== 'active' && !loadingStripeStatus && (
                  <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
                    <div className="flex items-start gap-3">
                      <Building className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: theme.infoText }}>No company registration needed to start</p>
                        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                          {connectCountry === 'US' ? (
                            <>You can connect as an individual and use your personal checking account, as long as the account is in your own name. Stripe asks for a US address and your SSN, or your EIN if you already have one. If you form an LLC later, you can update your business details in Stripe then.</>
                          ) : (
                            <>You can connect as an individual or sole trader with a bank account in your selected country, as long as the account is in your own name. Stripe asks for that country's standard identity and address details, not US details like an SSN. If you register a company later, you can update your business details in Stripe then.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl p-3 sm:p-4 flex items-start gap-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}><Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} /><p className="text-xs sm:text-sm" style={{ color: theme.infoText }}>Payments from your clients go directly to your Stripe account. The platform never holds your funds.</p></div>

                {/* Client Per-Minute Billing. Optional: charge your OWN clients
                    per voice minute on top of their flat plan, billed on your
                    connected Stripe account (you keep 100 percent). Rate + the
                    per-plan included minutes save via the settings PUT. The
                    master switch goes through the dedicated toggle endpoint,
                    which validates, creates the connected meter, and applies to
                    existing clients. */}
                <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <DollarSign className="h-4 w-4" style={{ color: theme.primary }} />
                    <h4 className="font-medium text-sm sm:text-base">Client Per-Minute Billing</h4>
                  </div>
                  <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>
                    Charge your clients per voice minute on top of their monthly plan. Charges run on your connected Stripe account, so you keep 100 percent of what you bill. Leave this off to absorb minutes yourself and bill only the flat plan.
                  </p>

                  {minuteError && (
                    <div className="mb-3 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
                      <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} />
                      <p className="text-sm" style={{ color: theme.errorText }}>{minuteError}</p>
                    </div>
                  )}
                  {minuteSaved && (
                    <div className="mb-3 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
                      <Check className="h-4 w-4" style={{ color: theme.primary }} />
                      <p className="text-sm" style={{ color: theme.primary }}>Saved.</p>
                    </div>
                  )}

                  {/* Rate (dollars) */}
                  <div className="mb-4">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Rate per minute ($)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={clientMinuteRate}
                      onChange={(e) => setClientMinuteRate(e.target.value)}
                      placeholder="0.35"
                      className="w-full sm:w-40 rounded-xl px-3 py-2 text-sm"
                      style={{ backgroundColor: theme.isDark ? '#050505' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                    />
                    <p className="mt-1 text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>What each client pays per voice minute beyond their included minutes.</p>
                  </div>

                  {/* Included minutes per plan */}
                  <div className="mb-4">
                    <label className="block text-xs sm:text-sm font-medium mb-1.5">Included minutes per plan</label>
                    <p className="text-[10px] sm:text-xs mb-2" style={{ color: theme.textMuted }}>Free minutes each plan includes before per-minute charges apply. Set 0 for pure per-minute.</p>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { label: planStarterName || 'Starter', value: includedStarter, set: setIncludedStarter },
                        { label: planProName || 'Professional', value: includedPro, set: setIncludedPro },
                        { label: planGrowthName || 'Growth', value: includedGrowth, set: setIncludedGrowth },
                      ]).map((p) => (
                        <div key={p.label}>
                          <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>{p.label}</label>
                          <input type="number" min="0" step="1" value={p.value} onChange={(e) => p.set(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: theme.isDark ? '#050505' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveMinuteBilling}
                    disabled={minuteSaving}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 mb-5"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                  >
                    {minuteSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Check className="h-4 w-4" />Save rate and minutes</>}
                  </button>

                  {/* Master toggle */}
                  <div className="flex items-start justify-between rounded-xl px-4 py-3" style={{ backgroundColor: minutePassThrough ? theme.primary15 : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'), border: `1px solid ${minutePassThrough ? theme.primary30 : theme.border}`, opacity: (!minutePassThrough && !canEnableMinutePassThrough) ? 0.6 : 1 }}>
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium" style={{ color: minutePassThrough ? theme.primary : theme.text }}>Charge clients per minute</p>
                      <p className="text-[11px] sm:text-xs mt-1 leading-relaxed" style={{ color: theme.textMuted }}>
                        {minutePassThrough
                          ? 'On. New and existing clients are billed per minute above their included minutes.'
                          : 'Off. You absorb minutes and bill clients only their flat plan.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleMinutePassThrough}
                      disabled={minuteToggleLoading || (!minutePassThrough && !canEnableMinutePassThrough)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
                      style={{ backgroundColor: minutePassThrough ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'), cursor: (minuteToggleLoading || (!minutePassThrough && !canEnableMinutePassThrough)) ? 'not-allowed' : 'pointer' }}
                    >
                      <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out" style={{ transform: minutePassThrough ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} />
                    </button>
                  </div>

                  {minuteToggleLoading && (
                    <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}><Loader2 className="h-3.5 w-3.5 animate-spin" />Updating...</div>
                  )}
                  {minuteSweepMsg && !minuteToggleLoading && (
                    <div className="mt-3 rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
                      <p className="text-xs sm:text-sm" style={{ color: theme.primary }}>{minuteSweepMsg}</p>
                    </div>
                  )}

                  {!connectChargesReady && (
                    <div className="mt-3 rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.warningText }} />
                      <div className="text-xs sm:text-sm" style={{ color: theme.warningText }}>
                        <p className="font-medium mb-0.5">Connect Stripe first</p>
                        <p style={{ color: theme.textMuted }}>Finish Stripe Connect setup above before you can charge clients per minute.</p>
                      </div>
                    </div>
                  )}
                  {connectChargesReady && savedRateCents <= 0 && !minutePassThrough && (
                    <div className="mt-3 rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} />
                      <p className="text-xs sm:text-sm" style={{ color: theme.infoText }}>Set a rate above 0 and save it before turning this on.</p>
                    </div>
                  )}

                  <div className="mt-3 rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} />
                    <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                      Turning this off stops new per-minute charges right away. Minutes already used this cycle still bill, and the per-minute line item drops off at each client's next renewal.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-4 sm:space-y-6">
                <div><h3 className="text-base sm:text-lg font-medium mb-1">Subscription & Billing</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Manage your VoiceAI Connect subscription.</p></div>
                <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Current Plan</p><p className="text-xl sm:text-2xl font-semibold mt-1 capitalize">{PLAN_NAMES[(agency?.plan_type || '') as keyof typeof PLAN_NAMES] || agency?.plan_type || 'Free'}</p></div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: subscriptionDisplay.bgColor, color: subscriptionDisplay.color }}>{subscriptionDisplay.label}</span>
                  </div>
                  {isOnTrial && trialDaysLeft !== null && (
                    <div className="mt-4 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}><p className="text-xs sm:text-sm" style={{ color: '#3b82f6' }}>{trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left in your trial</p></div>
                  )}
                  <div className="mt-4 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                    <div className="rounded-lg px-3 py-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}><p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Price</p><p className="font-medium text-sm sm:text-base">${planPrice}/mo</p></div>
                    <div className="rounded-lg px-3 py-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}><p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Status</p><p className="font-medium text-sm sm:text-base capitalize">{agency?.subscription_status || 'Active'}</p></div>
                  </div>
                </div>

                {usageLoading ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} /></div>
                ) : usageData ? (
                  <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                    <p className="text-sm font-medium mb-3">Current Usage</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-1"><span style={{ color: theme.textMuted }}>Clients</span><span>{usageData.clients?.current ?? 0}{usageData.clients?.limit === -1 ? '' : ` / ${usageData.clients?.limit ?? 0}`}</span></div>
                        {usageData.clients?.limit !== -1 && (<div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, ((usageData.clients?.current ?? 0) / (usageData.clients?.limit || 1)) * 100)}%`, backgroundColor: theme.primary }} /></div>)}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleManageSubscription} disabled={portalLoading} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}Manage Subscription</button>
                  {(isOnTrial || agency?.subscription_status === 'active') && (
                    <button onClick={() => setShowCancelModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.errorText }}><XCircle className="h-4 w-4" />Cancel {isOnTrial ? 'Trial' : 'Subscription'}</button>
                  )}
                </div>

                {isFreePlan && (
                  <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
                    <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4" style={{ color: theme.primary }} /><p className="font-medium text-sm" style={{ color: theme.primary }}>Upgrade to Pro</p></div>
                    <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>Unlock white-label branding, custom domains, and full client customization.</p>
                    <button onClick={() => handleUpgrade('pro')} disabled={upgradeLoading === 'pro'} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{upgradeLoading === 'pro' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Upgrade to Pro</button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'twilio' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
                  <Globe className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.infoText }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.infoText }}>For international numbers only</p>
                    <p className="text-xs mt-1" style={{ color: theme.infoText, opacity: 0.75 }}>Connect Twilio only if your clients are outside the US and need local numbers from another country. US numbers are provisioned automatically, so if you serve US clients you can skip this.</p>
                  </div>
                </div>
                <BYOTSettings agencyId={agency?.id || ''} planType={agency?.plan_type || ''} subscriptionStatus={agency?.subscription_status || ''} theme={theme} />
              </div>
            )}

            {activeTab === 'embed' && (
              <div className="space-y-4 sm:space-y-6">
                <div><h3 className="text-base sm:text-lg font-medium mb-1">Embed Widget</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Add a signup widget to your existing website. Clients sign up without leaving your site.</p></div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Embed Code</label>
                  <div className="relative">
                    <pre className="rounded-xl p-3 sm:p-4 text-[10px] sm:text-xs overflow-x-auto" style={{ backgroundColor: theme.isDark ? '#050505' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }}>{`<script src="https://${platformDomain}/embed.js" data-agency="${agency?.id}"></script>`}</pre>
                    <button onClick={() => { navigator.clipboard.writeText(`<script src="https://${platformDomain}/embed.js" data-agency="${agency?.id}"></script>`); setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2000); }} className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: embedCopied ? theme.primary : theme.text }}>{embedCopied ? <><Check className="h-3.5 w-3.5" />Copied</> : 'Copy'}</button>
                  </div>
                </div>
                <div className="rounded-xl p-3 sm:p-4 flex items-start gap-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}><Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} /><p className="text-xs sm:text-sm" style={{ color: theme.infoText }}>Paste this snippet into your website&apos;s HTML, just before the closing body tag. It stays valid even if you change your subdomain.</p></div>
              </div>
            )}

            {activeTab === 'team' && (
              <AgencyTeamTab agencyId={agency?.id || ''} theme={theme} />
            )}

            {activeTab === 'demo' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3"><div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Eye className="h-5 w-5" style={{ color: theme.primary }} /></div><div><h3 className="text-base sm:text-lg font-medium">Demo Mode</h3><p className="text-xs sm:text-sm mt-0.5" style={{ color: theme.textMuted }}>Preview your dashboard with realistic sample data.</p></div></div>
                  <button type="button" onClick={toggleDemoMode} className="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none" style={{ backgroundColor: demoMode ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db') }}><span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out" style={{ transform: demoMode ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} /></button>
                </div>
                {demoMode && (<div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.primary }} /><span className="text-sm font-medium" style={{ color: theme.primary }}>Demo mode is active, all pages show sample data</span></div>)}
                <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <p className="text-sm font-medium mb-3">What demo mode shows:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {demoFeatures.map((f) => (<div key={f.label} className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} /><div><p className="text-xs sm:text-sm font-medium">{f.label}</p><p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>{f.desc}</p></div></div>))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-4 sm:space-y-6">
                <div><h3 className="text-base sm:text-lg font-medium mb-1">Contact Support</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Questions or need a hand? Send us a message and our team will get back to you.</p></div>
                {feedbackError && (<div className="rounded-xl p-3 sm:p-4 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-sm" style={{ color: theme.errorText }}>{feedbackError}</p></div>)}
                {feedbackSent && (<div className="rounded-xl p-3 sm:p-4 flex items-center gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><Check className="h-4 w-4" style={{ color: theme.primary }} /><p className="text-sm" style={{ color: theme.primary }}>Message sent, we'll get back to you!</p></div>)}
                <div>
                  <textarea value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} placeholder="How can we help?" rows={5} maxLength={2000} className="w-full rounded-xl px-3 sm:px-4 py-2.5 text-sm resize-none transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: theme.textMuted }}>{feedbackMessage.length}/2000</span>
                    <button onClick={handleSendFeedback} disabled={sendingFeedback || !feedbackMessage.trim()} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{sendingFeedback ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : <><Send className="h-4 w-4" />Send</>}</button>
                  </div>
                </div>
                {loadingFeedback ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} /></div>
                ) : feedbackHistory.length > 0 ? (
                  <div><p className="text-sm font-medium mb-3">Your previous messages</p><div className="space-y-2">{feedbackHistory.map((item) => (<div key={item.id} className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}><p className="text-sm">{item.message}</p><p className="text-[10px] sm:text-xs mt-2" style={{ color: theme.textMuted }}>{new Date(item.created_at).toLocaleDateString()}</p></div>))}</div></div>
                ) : null}
              </div>
            )}

            {/* Save button - profile & pricing tabs only. Password change,
                subdomain, cancel, feedback, Stripe, per-minute billing, client
                billing mode, and demo toggle each have their own action and do
                not go through handleSave. */}
            {(activeTab === 'profile' || activeTab === 'pricing') && (
              <div className="mt-6 pt-6 flex justify-end" style={{ borderTop: `1px solid ${theme.border}` }}>
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-5 sm:px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto justify-center" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Check className="h-4 w-4" />Save Changes</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgencySettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
      <AgencySettingsContent />
    </Suspense>
  );
}