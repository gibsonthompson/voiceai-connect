'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload, Check, AlertCircle, ExternalLink, CreditCard, Building, Loader2, DollarSign, AlertTriangle, RefreshCw, Trash2, Receipt, XCircle, Eye, EyeOff, Phone, Users, Globe, Info, MessageSquare, Send, Sparkles, Lock, Code } from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';
import { PLAN_NAMES, deriveAgencyTeamLimit, formatTeamLimit } from '@/lib/plan-limits';
import { FEATURE_LABELS, FEATURE_ORDER } from '@/lib/plan-features-meta';
import BYOTSettings from '@/components/BYOTSettings';
import AgencyTeamTab from '@/components/agency/AgencyTeamTab';

type SettingsTab = 'profile' | 'pricing' | 'payments' | 'billing' | 'twilio' | 'embed' | 'team' | 'demo' | 'feedback';
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

// Cancellation reasons match Stripe's cancellation_details.feedback enum
// so the in-app cancel path and the Stripe portal cancel path produce the
// same vocabulary in the backend subscription_cancellations table.
const CANCEL_REASONS: Array<{ value: string; label: string }> = [
  { value: 'too_expensive',    label: 'Too expensive' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'switched_service', label: 'Switching to another service' },
  { value: 'unused',           label: "I'm not using it enough" },
  { value: 'too_complex',      label: 'Too complex to use' },
  { value: 'customer_service', label: 'Customer service issues' },
  { value: 'low_quality',      label: 'Quality issues' },
  { value: 'other',            label: 'Other' },
];

function rgbToHex(r: number, g: number, b: number): string { return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''); }
function adjustColorBrightness(hex: string, percent: number): string { const num = parseInt(hex.replace('#', ''), 16); const amt = Math.round(2.55 * percent); const R = Math.min(255, Math.max(0, (num >> 16) + amt)); const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt)); const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt)); return rgbToHex(R, G, B); }
function detectLogoBackground(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): { r: number; g: number; b: number; isTransparent: boolean } { const w = canvas.width; const h = canvas.height; const step = Math.max(1, Math.floor(Math.min(w, h) / 20)); const edgePixels: ImageData[] = []; for (let x = 0; x < w; x += step) { edgePixels.push(ctx.getImageData(x, 0, 1, 1)); edgePixels.push(ctx.getImageData(x, h - 1, 1, 1)); } for (let y = 0; y < h; y += step) { edgePixels.push(ctx.getImageData(0, y, 1, 1)); edgePixels.push(ctx.getImageData(w - 1, y, 1, 1)); } const transparentCount = edgePixels.filter(p => p.data[3] < 128).length; if (transparentCount > edgePixels.length * 0.5) return { r: 0, g: 0, b: 0, isTransparent: true }; let r = 0, g = 0, b = 0, count = 0; edgePixels.forEach(p => { if (p.data[3] >= 128) { r += p.data[0]; g += p.data[1]; b += p.data[2]; count++; } }); return count > 0 ? { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count), isTransparent: false } : { r: 255, g: 255, b: 255, isTransparent: false }; }
async function extractColorsFromImage(imageUrl: string): Promise<{ primary: string; secondary: string; accent: string; logoBgColor: string; suggestedTheme: 'light' | 'dark'; }> { const fallback = { primary: '#10b981', secondary: '#059669', accent: '#34d399', logoBgColor: '#000000', suggestedTheme: 'dark' as const }; return new Promise((resolve) => { const img = new Image(); img.crossOrigin = 'Anonymous'; img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); if (!ctx) { resolve(fallback); return; } const size = 150; canvas.width = size; canvas.height = size; ctx.drawImage(img, 0, 0, size, size); const bg = detectLogoBackground(canvas, ctx); const bgHex = bg.isTransparent ? '#000000' : rgbToHex(bg.r, bg.g, bg.b); let suggestedTheme: 'light' | 'dark' = 'dark'; if (!bg.isTransparent) { const luminance = (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) / 255; suggestedTheme = luminance > 0.5 ? 'light' : 'dark'; } const pixels = ctx.getImageData(0, 0, size, size).data; const colorData: Record<string, { count: number; r: number; g: number; b: number; saturation: number; lightness: number; }> = {}; for (let i = 0; i < pixels.length; i += 4) { const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3]; if (a < 128) continue; const bgDist = Math.sqrt(Math.pow(r - bg.r, 2) + Math.pow(g - bg.g, 2) + Math.pow(b - bg.b, 2)); if (bgDist < 50) continue; const br = Math.round(r / 25) * 25; const bg2 = Math.round(g / 25) * 25; const bb = Math.round(b / 25) * 25; const max = Math.max(br, bg2, bb) / 255; const min = Math.min(br, bg2, bb) / 255; const lightness = (max + min) / 2; const saturation = max === min ? 0 : lightness > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min); if (lightness < 0.15 || lightness > 0.65) continue; if (saturation < 0.25) continue; const key = `${br},${bg2},${bb}`; if (!colorData[key]) colorData[key] = { count: 0, r: br, g: bg2, b: bb, saturation, lightness }; colorData[key].count++; } const colors = Object.values(colorData).filter(c => c.count >= 5).sort((a, b) => (b.saturation * Math.log(b.count)) - (a.saturation * Math.log(a.count))).slice(0, 6).map(c => rgbToHex(c.r, c.g, c.b)); if (!colors.length) { resolve({ ...fallback, logoBgColor: bgHex, suggestedTheme }); return; } const primary = colors[0]; const secondary = colors[1] || adjustColorBrightness(primary, -25); const accent = colors[2] || adjustColorBrightness(primary, 30); resolve({ primary, secondary, accent, logoBgColor: bgHex, suggestedTheme }); }; img.onerror = () => resolve(fallback); img.src = imageUrl; }); }

function FeatureToggle({ featureKey, enabled, onToggle, theme }: { featureKey: string; enabled: boolean; onToggle: () => void; theme: any; }) { const info = FEATURE_LABELS[featureKey]; if (!info) return null; return (<div className="flex items-center justify-between py-2.5 px-1 group"><div className="flex-1 min-w-0 mr-3"><p className="text-sm font-medium" style={{ color: enabled ? theme.text : theme.textMuted }}>{info.label}</p></div><button type="button" onClick={onToggle} className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none" style={{ backgroundColor: enabled ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db') }}><span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out" style={{ transform: enabled ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} /></button></div>); }

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
  const validTabs: SettingsTab[] = ['profile', 'pricing', 'payments', 'billing', 'twilio', 'embed', 'team', 'demo', 'feedback'];
  const [activeTab, setActiveTab] = useState<SettingsTab>(validTabs.includes(initialTab) ? initialTab : 'profile');
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null); const [loadingStripeStatus, setLoadingStripeStatus] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false); const [disconnectingStripe, setDisconnectingStripe] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false); const [cancelLoading, setCancelLoading] = useState(false); const [portalLoading, setPortalLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>(''); const [cancelFeedback, setCancelFeedback] = useState<string>('');
  const [agencyName, setAgencyName] = useState(''); const [logoUrl, setLogoUrl] = useState(''); const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [extractingColors, setExtractingColors] = useState(false); const [extractedColors, setExtractedColors] = useState<{ primary: string; secondary: string; accent: string } | null>(null);
  const [brandColors, setBrandColors] = useState({ primary: '#10b981', secondary: '#059669', accent: '#34d399' });
  const [priceStarter, setPriceStarter] = useState('99'); const [pricePro, setPricePro] = useState('149'); const [priceGrowth, setPriceGrowth] = useState('299');
  const [limitStarter, setLimitStarter] = useState('50'); const [limitPro, setLimitPro] = useState('150'); const [limitGrowth, setLimitGrowth] = useState('500');
  const [unlimitedStarter, setUnlimitedStarter] = useState(false); const [unlimitedPro, setUnlimitedPro] = useState(false); const [unlimitedGrowth, setUnlimitedGrowth] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<Record<string, Record<string, boolean | number>>>(DEFAULT_PLAN_FEATURES);

  // require_card_for_trial toggle. When true, /api/client/signup creates a
  // Stripe Connect Checkout with trial_period_days=7 instead of inserting a
  // DB-only trial. Requires stripe_charges_enabled=true to take effect.
  // Backend silently no-ops if Stripe Connect isn't ready (falls back to
  // no-card trial so signups don't break).
  const [requireCardForTrial, setRequireCardForTrial] = useState(false);

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

  useEffect(() => { if (agency) { setAgencyName(agency.name || ''); setLogoUrl(agency.logo_url || ''); setLogoPreview(agency.logo_url); setPriceStarter(((agency.price_starter || 9900) / 100).toString()); setPricePro(((agency.price_pro || 14900) / 100).toString()); setPriceGrowth(((agency.price_growth || 29900) / 100).toString()); const ls = agency.limit_starter; const lp = agency.limit_pro; const lg = agency.limit_growth; setUnlimitedStarter(ls === -1); setUnlimitedPro(lp === -1); setUnlimitedGrowth(lg === -1); setLimitStarter(ls === -1 ? '50' : (ls || 50).toString()); setLimitPro(lp === -1 ? '150' : (lp || 150).toString()); setLimitGrowth(lg === -1 ? '500' : (lg || 500).toString()); setPlanFeatures((agency as any).plan_features || DEFAULT_PLAN_FEATURES); setBrandColors({ primary: agency.primary_color || '#10b981', secondary: agency.secondary_color || '#059669', accent: agency.accent_color || '#34d399' }); setClientHeaderMode((agency as any).client_header_mode || 'agency_name'); setAllowClientBranding((agency as any).allow_client_branding || false); setPlanStarterName((agency as any).plan_starter_name || 'Starter'); setPlanProName((agency as any).plan_pro_name || 'Professional'); setPlanGrowthName((agency as any).plan_growth_name || 'Growth'); setPlanStarterDescription((agency as any).plan_starter_description || ''); setPlanProDescription((agency as any).plan_pro_description || ''); setPlanGrowthDescription((agency as any).plan_growth_description || ''); setRequireCardForTrial((agency as any).require_card_for_trial === true); } }, [agency?.branding_overrides]);
  useEffect(() => { if (activeTab === 'payments' && agency?.id) fetchStripeStatus(); }, [activeTab, agency?.id]);
  useEffect(() => { if (activeTab === 'feedback' && agency?.id) fetchFeedbackHistory(); }, [activeTab, agency?.id]);
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

  const settingsTabs = [{ id: 'profile' as SettingsTab, label: 'Profile', icon: Building }, { id: 'pricing' as SettingsTab, label: 'Pricing', icon: DollarSign }, { id: 'payments' as SettingsTab, label: 'Payments', icon: CreditCard }, { id: 'billing' as SettingsTab, label: 'Billing', icon: Receipt }, { id: 'twilio' as SettingsTab, label: 'Twilio', icon: Globe }, { id: 'embed' as SettingsTab, label: 'Embed', icon: Code }, { id: 'team' as SettingsTab, label: 'Team', icon: Users }, { id: 'demo' as SettingsTab, label: 'Demo Mode', icon: Eye }, { id: 'feedback' as SettingsTab, label: 'Feedback', icon: MessageSquare }].filter(tab => { if (tab.id === 'team' && user?.role === 'agency_staff') return false; if (tab.id === 'embed' && !isFreePlan) return false; if (tab.id === 'billing') return hasPermission('billing'); return hasPermission('settings'); });

  // If the requested tab (e.g. from a ?tab= URL) isn't one this member is
  // allowed to see, fall back to the first permitted tab so the gated content
  // can't render behind a hidden tab button. Owners pass every check, so this
  // only ever moves a restricted staff member.
  useEffect(() => {
    if (settingsTabs.length > 0 && !settingsTabs.some(t => t.id === activeTab)) {
      setActiveTab(settingsTabs[0].id);
    }
  }, [settingsTabs, activeTab]);

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
        payload.price_starter = Math.round(parseFloat(priceStarter) * 100);
        payload.price_pro = Math.round(parseFloat(pricePro) * 100);
        payload.price_growth = Math.round(parseFloat(priceGrowth) * 100);
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

  const handleStripeConnect = async () => { if (!agency) return; setConnectingStripe(true); setError(null); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/connect/onboard`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ agency_id: agency.id }) }); if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to start Stripe onboarding'); } const data = await response.json(); window.location.href = data.url; } catch (err) { setError(err instanceof Error ? err.message : 'Failed to connect Stripe'); setConnectingStripe(false); } };
  const handleStripeDisconnect = async () => { if (!agency) return; if (!confirm('Disconnect Stripe? You won\'t receive payments until you reconnect.')) return; setDisconnectingStripe(true); setError(null); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/${agency.id}/connect/disconnect`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }); if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to disconnect Stripe'); } await refreshAgency(); setStripeStatus(null); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to disconnect Stripe'); } finally { setDisconnectingStripe(false); } };
  const handleManageSubscription = async () => { if (!agency) return; setPortalLoading(true); setError(null); try { const token = localStorage.getItem('auth_token'); const response = await fetch(`${backendUrl}/api/agency/portal`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ agency_id: agency.id }) }); if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to open billing portal'); } const data = await response.json(); if (data.url) window.location.href = data.url; else if (data.needs_payment_method) setError('Add a payment method first. Use the upgrade options below.'); else setError('Failed to open billing portal'); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to open billing portal'); } finally { setPortalLoading(false); } };

  // Send the chosen reason and free-text feedback to /api/agency/cancel.
  // Backend writes a row in subscription_cancellations and SMS's the
  // platform owner. On success, clear local session and redirect.
  const handleCancelTrial = async () => {
    if (!agency) return;
    if (!cancelReason) {
      setError('Please select a reason for canceling.');
      return;
    }
    setCancelLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          agency_id: agency.id,
          reason: cancelReason,
          feedback: cancelFeedback.trim() || null,
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      localStorage.removeItem('auth_token');
      localStorage.removeItem('agency');
      localStorage.removeItem('user');
      window.location.href = '/agency/login?canceled=true';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
      setCancelLoading(false);
      setShowCancelModal(false);
    }
  };

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

      {/* Cancel Subscription modal. Reason is required (dropdown), feedback
          is optional (textarea). Both are sent to /api/agency/cancel and
          recorded server-side + SMS'd to the platform owner. */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !cancelLoading && setShowCancelModal(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: theme.isDark ? '#0a0a0a' : '#ffffff', border: `1px solid ${theme.border}` }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.errorBg }}
              >
                <AlertTriangle className="h-6 w-6" style={{ color: theme.errorText }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
                  Cancel {isOnTrial ? 'Trial' : 'Subscription'}?
                </h3>
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  We're sorry to see you go.
                </p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: theme.errorBg }}>
              <p className="text-sm" style={{ color: theme.errorText }}>If you cancel now:</p>
              <ul className="mt-2 space-y-1 text-sm" style={{ color: theme.errorText }}>
                <li>• You&apos;ll lose access to your agency dashboard immediately</li>
                <li>• All client AI receptionists will be disabled</li>
                <li>• You won&apos;t be charged</li>
              </ul>
            </div>

            {/* Reason dropdown (required) */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                Why are you canceling? <span style={{ color: theme.errorText }}>*</span>
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={cancelLoading}
                className="w-full rounded-xl px-3 py-2.5 text-sm transition-colors"
                style={{
                  backgroundColor: theme.input,
                  border: `1px solid ${theme.inputBorder}`,
                  color: theme.text,
                }}
              >
                <option value="">Select a reason...</option>
                {CANCEL_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Feedback textarea (optional, free-form) */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                Anything specific we could improve? <span style={{ color: theme.textMuted }}>(optional)</span>
              </label>
              <textarea
                value={cancelFeedback}
                onChange={(e) => setCancelFeedback(e.target.value)}
                disabled={cancelLoading}
                placeholder="Tell us what didn't work, what was missing, or what would have made you stay."
                rows={4}
                maxLength={1000}
                className="w-full rounded-xl px-3 py-2.5 text-sm resize-none transition-colors"
                style={{
                  backgroundColor: theme.input,
                  border: `1px solid ${theme.inputBorder}`,
                  color: theme.text,
                }}
              />
              <p className="mt-1 text-xs text-right" style={{ color: theme.textMuted }}>
                {cancelFeedback.length}/1000
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
              >
                Keep My {isOnTrial ? 'Trial' : 'Subscription'}
              </button>
              <button
                onClick={handleCancelTrial}
                disabled={cancelLoading || !cancelReason}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 sm:mb-8"><h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Settings</h1><p className="mt-1 text-sm" style={{ color: theme.textMuted }}>Manage your agency settings</p></div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:w-48 flex-shrink-0"><nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">{settingsTabs.map((tab) => (<button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab !== tab.id ? (theme.isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]') : ''}`} style={activeTab === tab.id ? { backgroundColor: theme.primary15, color: theme.primary } : { color: theme.textMuted }}><tab.icon className="h-4 w-4" />{tab.label}{tab.id === 'demo' && demoMode && (<div className="w-2 h-2 rounded-full ml-auto flex-shrink-0" style={{ backgroundColor: theme.primary }} />)}</button>))}</nav></div>

        <div className="flex-1 max-w-2xl">
          {error && (<div className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-sm" style={{ color: theme.errorText }}>{error}</p></div>)}
          {saved && (<div className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><Check className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.primary }} /><p className="text-sm" style={{ color: theme.primary }}>Settings saved!</p></div>)}

          <div className="rounded-xl p-4 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>

            {activeTab === 'profile' && (<div className="space-y-4 sm:space-y-6"><div><h3 className="text-base sm:text-lg font-medium mb-1">Agency Profile</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Basic information about your agency.</p></div><div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Agency Name</label><input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} /></div><ProFeatureGate isFreePlan={isFreePlan} theme={theme} description="Brand the platform as your own. Upload your logo, set custom colors, get a branded subdomain at yourname.myvoiceaiconnect.com, and customize how your clients see their dashboard. Pro unlocks full white-label so prospects never see VoiceAI Connect."><div className="space-y-4 sm:space-y-6"><div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Logo</label><div className="flex items-center gap-3 sm:gap-4"><div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>{logoPreview ? (<img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />) : (<Building className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.textMuted }} />)}</div><div className="min-w-0"><input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className={`inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${theme.isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'}`} style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}><Upload className="h-4 w-4" />Upload</button><p className="mt-1.5 text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>PNG, JPG up to 2MB</p></div></div>{extractingColors && (<div className="mt-3 flex items-center gap-2 text-sm" style={{ color: theme.primary }}><Loader2 className="h-4 w-4 animate-spin" /><span>Extracting brand colors...</span></div>)}{extractedColors && !extractingColors && (<div className="mt-4 rounded-xl p-4" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4" style={{ color: theme.primary }} /><span className="text-sm font-medium" style={{ color: theme.primary }}>Colors extracted, saved with profile</span></div><div className="flex items-center gap-4">{([['Primary', 'primary'], ['Secondary', 'secondary'], ['Accent', 'accent']] as const).map(([label, key]) => (<div key={key} className="flex items-center gap-2"><div className="relative"><div className="w-8 h-8 rounded-lg border cursor-pointer" style={{ backgroundColor: brandColors[key], borderColor: theme.border }} /><input type="color" value={brandColors[key]} onChange={(e) => setBrandColors(prev => ({ ...prev, [key]: e.target.value }))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /></div><div><p className="text-[10px] font-medium" style={{ color: theme.text }}>{label}</p><p className="text-[9px] font-mono" style={{ color: theme.textMuted }}>{brandColors[key]}</p></div></div>))}</div>{detectedWebsiteTheme && (<div className="mt-3 flex items-center gap-2"><div className={`w-4 h-4 rounded border ${detectedWebsiteTheme === 'light' ? 'bg-white border-gray-300' : 'bg-[#050505] border-white/20'}`} /><p className="text-xs" style={{ color: theme.textMuted }}>Theme: <span className="font-medium" style={{ color: theme.primary }}>{detectedWebsiteTheme === 'light' ? 'Light' : 'Dark'}</span></p></div>)}<p className="text-xs mt-2" style={{ color: theme.textMuted }}>These update your Branding tab palette. Fine-tune there after saving.</p></div>)}</div><div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Slug</label><div className="rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>{agency?.slug}</div><p className="mt-1.5 text-[10px] sm:text-xs break-all" style={{ color: theme.textMuted }}>URL: https://{agency?.slug}.{platformDomain}/get-started</p></div><div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Client Dashboard Header</label><p className="text-[10px] sm:text-xs mb-3" style={{ color: theme.textMuted }}>What name appears in your clients&apos; dashboard sidebar and header.</p><div className="flex gap-2">{([{ value: 'agency_name' as const, label: 'Agency Name', desc: 'Shows your agency brand' }, { value: 'business_name' as const, label: 'Business Name', desc: "Shows each client's own name" }]).map((option) => (<button key={option.value} type="button" onClick={() => setClientHeaderMode(option.value)} className="flex-1 rounded-xl p-3 text-left transition-all" style={{ backgroundColor: clientHeaderMode === option.value ? theme.primary15 : theme.input, border: `2px solid ${clientHeaderMode === option.value ? theme.primary : theme.inputBorder}` }}><p className="text-sm font-medium" style={{ color: clientHeaderMode === option.value ? theme.primary : theme.text }}>{option.label}</p><p className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>{option.desc}</p></button>))}</div></div><div><label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Client Branding</label><p className="text-[10px] sm:text-xs mb-3" style={{ color: theme.textMuted }}>Allow clients to customize their own logo, colors, and theme in their dashboard settings.</p><div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: allowClientBranding ? theme.primary15 : theme.input, border: `1px solid ${allowClientBranding ? theme.primary30 : theme.inputBorder}` }}><div><p className="text-sm font-medium" style={{ color: allowClientBranding ? theme.primary : theme.text }}>Allow client branding</p><p className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>Clients can upload their own logo and set custom colors</p></div><button type="button" onClick={() => setAllowClientBranding(!allowClientBranding)} className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none" style={{ backgroundColor: allowClientBranding ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db') }}><span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out" style={{ transform: allowClientBranding ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} /></button></div></div></div></ProFeatureGate>

              {/* Change Password — self-service, available on every plan (account
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
                    Trial Setup — require_card_for_trial toggle.
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
                    {' '}<strong style={{ color: theme.text }}>Affects only signups from your embed widget</strong>, not clients you add manually from the dashboard.
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
                          <input type="number" value={plan.price} onChange={(e) => plan.setPrice(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: theme.isDark ? '#050505' : plan.highlight ? '#ffffff' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
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
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#635BFF' }}><CreditCard className="h-6 w-6 text-white" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base">Stripe Connect</p>
                        <div className="flex items-center gap-2 mt-0.5"><div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stripeDisplay.color }} /><p className="text-xs sm:text-sm" style={{ color: stripeDisplay.color }}>{stripeDisplay.label}</p></div>
                      </div>
                      {stripeDisplay.status === 'active' ? (
                        <button onClick={handleStripeDisconnect} disabled={disconnectingStripe} className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.errorBg, color: theme.errorText }}>{disconnectingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Disconnect</button>
                      ) : (
                        <button onClick={handleStripeConnect} disabled={connectingStripe} className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{connectingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}{stripeDisplay.status === 'restricted' ? 'Complete Setup' : 'Connect'}</button>
                      )}
                    </div>
                    {stripeDisplay.status === 'active' && (
                      <div className="mt-4 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                        <div className="flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}><span style={{ color: theme.textMuted }}>Charges</span><span className="flex items-center gap-1" style={{ color: '#34d399' }}><Check className="h-3 w-3" />Enabled</span></div>
                        <div className="flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}><span style={{ color: theme.textMuted }}>Payouts</span><span className="flex items-center gap-1" style={{ color: '#34d399' }}><Check className="h-3 w-3" />Enabled</span></div>
                      </div>
                    )}
                  </div>
                )}
                <div className="rounded-xl p-3 sm:p-4 flex items-start gap-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}><Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} /><p className="text-xs sm:text-sm" style={{ color: theme.infoText }}>Payments from your clients go directly to your Stripe account. The platform never holds your funds.</p></div>
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
              <BYOTSettings agencyId={agency?.id || ''} backendUrl={backendUrl} theme={theme} />
            )}

            {activeTab === 'embed' && (
              <div className="space-y-4 sm:space-y-6">
                <div><h3 className="text-base sm:text-lg font-medium mb-1">Embed Widget</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Add a signup widget to your existing website. Clients sign up without leaving your site.</p></div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Embed Code</label>
                  <div className="relative">
                    <pre className="rounded-xl p-3 sm:p-4 text-[10px] sm:text-xs overflow-x-auto" style={{ backgroundColor: theme.isDark ? '#050505' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text }}>{`<script src="https://${platformDomain}/embed.js" data-agency="${agency?.slug}"></script>`}</pre>
                    <button onClick={() => { navigator.clipboard.writeText(`<script src="https://${platformDomain}/embed.js" data-agency="${agency?.slug}"></script>`); setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2000); }} className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: embedCopied ? theme.primary : theme.text }}>{embedCopied ? <><Check className="h-3.5 w-3.5" />Copied</> : 'Copy'}</button>
                  </div>
                </div>
                <div className="rounded-xl p-3 sm:p-4 flex items-start gap-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}><Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.infoText }} /><p className="text-xs sm:text-sm" style={{ color: theme.infoText }}>Paste this snippet into your website&apos;s HTML, just before the closing body tag.</p></div>
              </div>
            )}

            {activeTab === 'team' && (
              <AgencyTeamTab agencyId={agency?.id || ''} backendUrl={backendUrl} theme={theme} />
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

            {activeTab === 'feedback' && (
              <div className="space-y-4 sm:space-y-6">
                <div><h3 className="text-base sm:text-lg font-medium mb-1">Send Feedback</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Questions, issues, or feature requests, we read every message.</p></div>
                {feedbackError && (<div className="rounded-xl p-3 sm:p-4 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-sm" style={{ color: theme.errorText }}>{feedbackError}</p></div>)}
                {feedbackSent && (<div className="rounded-xl p-3 sm:p-4 flex items-center gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}><Check className="h-4 w-4" style={{ color: theme.primary }} /><p className="text-sm" style={{ color: theme.primary }}>Feedback sent, thank you!</p></div>)}
                <div>
                  <textarea value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} placeholder="What's on your mind?" rows={5} maxLength={2000} className="w-full rounded-xl px-3 sm:px-4 py-2.5 text-sm resize-none transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: theme.textMuted }}>{feedbackMessage.length}/2000</span>
                    <button onClick={handleSendFeedback} disabled={sendingFeedback || !feedbackMessage.trim()} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{sendingFeedback ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : <><Send className="h-4 w-4" />Send</>}</button>
                  </div>
                </div>
                {loadingFeedback ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} /></div>
                ) : feedbackHistory.length > 0 ? (
                  <div><p className="text-sm font-medium mb-3">Previous Feedback</p><div className="space-y-2">{feedbackHistory.map((item) => (<div key={item.id} className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}><p className="text-sm">{item.message}</p><p className="text-[10px] sm:text-xs mt-2" style={{ color: theme.textMuted }}>{new Date(item.created_at).toLocaleDateString()}</p></div>))}</div></div>
                ) : null}
              </div>
            )}

            {/* Save button — profile & pricing tabs only. Password change,
                cancel, feedback, Stripe, and demo toggle each have their own
                action and do not go through handleSave. */}
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