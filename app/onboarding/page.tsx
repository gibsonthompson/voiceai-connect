'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, Loader2, ArrowRight, Lock,
  Building, ChevronDown, Zap, Shield, Crown, Check, ArrowLeft, Search
} from 'lucide-react';
import { PLAN_PRICES, PLAN_RATES } from '@/lib/plan-limits';
import { AGENCY_PLAN_TIERS } from '@/lib/plan-features';

const REFERRAL_OPTIONS = [
  { value: '', label: 'Select an option...' },
  { value: 'google_search', label: 'Google Search' },
  { value: 'ai_recommendation', label: 'AI Recommendation (ChatGPT, Claude, Perplexity)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'facebook_instagram', label: 'Facebook / Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'friend_colleague', label: 'Friend / Colleague' },
  { value: 'blog_article', label: 'Blog / Article' },
  { value: 'other', label: 'Other' },
];

const steps = [
  { id: 1, name: 'Agency', icon: Building, description: 'Name your agency' },
  { id: 2, name: 'Plan', icon: Zap, description: 'Choose your plan' },
  { id: 3, name: 'Password', icon: Lock, description: 'Set password & go' },
];

// Countries the platform can actually format and route SMS/voice for. This is
// the display-side mirror of COUNTRY_CALLING_CODES in the backend notifications
// lib; keep the two in sync when adding support for a new country. A curated
// list (not a raw 200-country dump) is both better UX and matches what the
// system can deliver to.
type Country = { iso: string; name: string; dial: string; flag: string; example?: string };

const SUPPORTED_COUNTRIES: Country[] = [
  { iso: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', example: '(555) 123-4567' },
  { iso: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', example: '(555) 123-4567' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', example: '07911 123456' },
  { iso: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺', example: '0412 345 678' },
  { iso: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿', example: '021 123 4567' },
  { iso: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪', example: '085 123 4567' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { iso: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
  { iso: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
  { iso: 'BG', name: 'Bulgaria', dial: '+359', flag: '🇧🇬' },
  { iso: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { iso: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { iso: 'CY', name: 'Cyprus', dial: '+357', flag: '🇨🇾' },
  { iso: 'CZ', name: 'Czechia', dial: '+420', flag: '🇨🇿' },
  { iso: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { iso: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
  { iso: 'EE', name: 'Estonia', dial: '+372', flag: '🇪🇪' },
  { iso: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { iso: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
  { iso: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { iso: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
  { iso: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
  { iso: 'HR', name: 'Croatia', dial: '+385', flag: '🇭🇷' },
  { iso: 'HU', name: 'Hungary', dial: '+36', flag: '🇭🇺' },
  { iso: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { iso: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { iso: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { iso: 'LT', name: 'Lithuania', dial: '+370', flag: '🇱🇹' },
  { iso: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺' },
  { iso: 'LV', name: 'Latvia', dial: '+371', flag: '🇱🇻' },
  { iso: 'MT', name: 'Malta', dial: '+356', flag: '🇲🇹' },
  { iso: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { iso: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { iso: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { iso: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
  { iso: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
  { iso: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { iso: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴' },
  { iso: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
  { iso: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { iso: 'SI', name: 'Slovenia', dial: '+386', flag: '🇸🇮' },
  { iso: 'SK', name: 'Slovakia', dial: '+421', flag: '🇸🇰' },
  { iso: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
];

function getCountry(iso: string): Country {
  return SUPPORTED_COUNTRIES.find((c) => c.iso === iso) || SUPPORTED_COUNTRIES[0];
}

// Custom, searchable country picker. Deliberately NOT a native <select>: a
// 40-plus row native dropdown is unstyleable and reads as an afterthought.
// This is keyboard-navigable (up/down/enter/escape), type-to-filter, closes on
// outside click, and fuses to the left of the phone input as a flag + dial code
// control, matching the intl-tel pattern people already know.
function CountrySelect({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = getCountry(value);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? SUPPORTED_COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.dial.replace('+', '').includes(q.replace('+', ''))
      )
    : SUPPORTED_COUNTRIES;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const idx = SUPPORTED_COUNTRIES.findIndex((c) => c.iso === value);
    setActiveIndex(idx < 0 ? 0 : idx);
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open, value]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const choose = (iso: string) => { onChange(iso); setOpen(false); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(filtered.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const c = filtered[activeIndex]; if (c) choose(c.iso); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 h-full pl-4 pr-3 border-r border-white/[0.08] rounded-l-xl text-[#fafaf9] hover:bg-white/[0.04] transition-colors focus:outline-none focus:bg-white/[0.04]"
      >
        <span className="text-xl leading-none" aria-hidden="true">{selected.flag}</span>
        <span className="text-[15px] text-[#fafaf9]/70 tabular-nums">{selected.dial}</span>
        <ChevronDown className={`h-4 w-4 text-[#fafaf9]/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[360px] max-w-[calc(100vw-3rem)] rounded-xl border border-white/[0.08] bg-[#0e0e0e] shadow-2xl shadow-black/70 overflow-hidden">
          <div className="p-2 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                onKeyDown={onKeyDown}
                placeholder="Search countries"
                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] pl-9 pr-3 py-2.5 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-white/20"
              />
            </div>
          </div>
          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.map((c, i) => (
              <li
                key={c.iso}
                data-idx={i}
                role="option"
                aria-selected={c.iso === value}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(c.iso)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${i === activeIndex ? 'bg-emerald-500/10' : ''}`}
              >
                <span className="text-xl leading-none" aria-hidden="true">{c.flag}</span>
                <span className="flex-1 text-[15px] text-[#fafaf9]/85 leading-snug">{c.name}</span>
                <span className="text-[13px] text-[#fafaf9]/40 tabular-nums">{c.dial}</span>
                {c.iso === value && <Check className="h-4 w-4 text-emerald-400" />}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-[#fafaf9]/40">No countries match that search</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function OnboardingProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-10 sm:mb-12">
      <div className="flex items-center justify-center gap-1">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all duration-300 ${
              step.id < currentStep ? 'bg-emerald-500 text-[#050505]'
                : step.id === currentStep ? 'bg-white/10 text-[#fafaf9] ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#050505]'
                : 'bg-white/[0.03] text-[#fafaf9]/30'
            }`}>
              {step.id < currentStep ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-1.5 transition-colors duration-300 ${step.id < currentStep ? 'bg-emerald-500' : 'bg-white/[0.06]'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
          <span className="text-emerald-400 text-sm font-medium">Step {currentStep} of {steps.length}</span>
          <span className="text-[#fafaf9]/30">·</span>
          <span className="text-sm text-[#fafaf9]/60">{steps[currentStep - 1]?.name}</span>
        </div>
      </div>
    </div>
  );
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyData, setAgencyData] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [agencyDetails, setAgencyDetails] = useState({ name: '', phone: '', referralSource: '', country: 'US' });
  const selectedCountry = getCountry(agencyDetails.country);

  useEffect(() => {
    const fetchAgency = async () => {
      if (!sessionId) {
        const storedAgencyId = localStorage.getItem('onboarding_agency_id');
        const urlAgencyId = searchParams.get('agency');
        const resolvedAgencyId = storedAgencyId || urlAgencyId;
        if (resolvedAgencyId) {
          setAgencyId(resolvedAgencyId);
          if (!storedAgencyId && urlAgencyId) localStorage.setItem('onboarding_agency_id', resolvedAgencyId);
          await loadAgencyData(resolvedAgencyId);
        } else { router.push('/signup'); }
        return;
      }
      try {
        const response = await fetch(`/api/onboarding/verify?session_id=${sessionId}`);
        const data = await response.json();
        if (data.agencyId) {
          setAgencyId(data.agencyId);
          localStorage.setItem('onboarding_agency_id', data.agencyId);
          await loadAgencyData(data.agencyId);
        }
      } catch (err) { console.error('Failed to verify session:', err); }
    };
    fetchAgency();
  }, [sessionId, router]);

  const loadAgencyData = async (id: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/${id}/settings`);
      if (response.ok) {
        const data = await response.json();
        setAgencyData(data.agency);
        if (data.agency.name && !data.agency.name.includes("'s Agency") && data.agency.name !== 'My Agency') {
          setAgencyDetails({ name: data.agency.name || '', phone: data.agency.phone || '', referralSource: data.agency.referral_source || '', country: data.agency.country || 'US' });
          setCurrentStep(2);
        } else { setCurrentStep(1); }
      }
    } catch (err) { console.error('Failed to load agency:', err); }
  };

  const saveStep = async (step: number, data: any) => {
    if (!agencyId) return;
    setLoading(true); setError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/onboarding`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agency_id: agencyId, step, data }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save');
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      return null;
    } finally { setLoading(false); }
  };

  const handleStep1Next = async () => {
    if (!agencyDetails.name.trim()) { setError('Please enter your agency name'); return; }
    if (!agencyDetails.phone.trim()) { setError('Please enter your phone number'); return; }
    if (!agencyDetails.referralSource) { setError('Please select how you heard about us'); return; }
    const result = await saveStep(1, { name: agencyDetails.name.trim(), phone: agencyDetails.phone, referral_source: agencyDetails.referralSource, country: agencyDetails.country });
    if (result?.success) {
      // NOTE: The test client is no longer auto-provisioned here. It is now an
      // on-demand "activate when you're ready" tool — just like the demo phone —
      // surfaced in the dashboard onboarding checklist. This means a signup that
      // never gets serious costs zero Telnyx numbers.
      setCurrentStep(2);
    }
  };

  const handleSelectPlan = (planId: string) => { setSelectedPlan(planId); setCurrentStep(3); };

  // Free only. Pro/Scale require a card and go through Stripe Checkout instead
  // (see handleSetPassword). The start-trial route rejects paid plans as defense.
  const startTrial = async (planType: string) => {
    if (!agencyId) return;
    try {
      const response = await fetch('/api/agency/start-trial', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, planType }),
      });
      if (!response.ok) { const data = await response.json(); console.error('⚠️ Trial start failed:', data.error); return; }
      console.log(`✅ Trial started with plan: ${planType}`);
    } catch (err) { console.error('⚠️ Failed to start trial:', err); }
  };

  const handleSetPassword = async () => {
    setLoading(true);
    const token = localStorage.getItem('agency_password_token');

    // FREE — no card. Activate immediately, then set password → dashboard.
    if (selectedPlan === 'free') {
      await startTrial('free');
      if (token && agencyId) {
        localStorage.removeItem('agency_password_token');
        const returnTo = encodeURIComponent('/agency/dashboard');
        window.location.href = `/auth/set-password?token=${token}&returnTo=${returnTo}`;
      } else if (agencyId) {
        localStorage.removeItem('onboarding_agency_id');
        window.location.href = '/agency/dashboard';
      } else {
        window.location.href = '/signup';
      }
      return;
    }

    // PRO / SCALE — card required. Send to Stripe Checkout (card on file, $0 for
    // 14 days, auto-converts on day 14). After payment, Stripe returns the user
    // to set-password (token carried in the success URL), then the dashboard.
    // We intentionally do NOT clear the localStorage token/agency id here, so a
    // canceled checkout can recover via the cancel URL and retry.
    if ((selectedPlan === 'pro' || selectedPlan === 'scale') && agencyId) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const returnPath = token
          ? `/auth/set-password?token=${token}&returnTo=${encodeURIComponent('/agency/dashboard?trial=started')}`
          : '/agency/dashboard?trial=started';
        const response = await fetch(`${backendUrl}/api/agency/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agency_id: agencyId,
            plan: selectedPlan,
            successUrl: `${window.location.origin}${returnPath}`,
            cancelUrl: `${window.location.origin}/onboarding?agency=${agencyId}`,
          }),
        });
        const data = await response.json();
        if (response.ok && data.url) {
          window.location.href = data.url;
          return;
        }
        setError(data.error || 'Could not start checkout. Please try again.');
      } catch (err) {
        setError('Could not start checkout. Please try again.');
      }
      setLoading(false);
      return;
    }

    // Fallback — no plan selected.
    setLoading(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      // ================================================================
      // STEP 1 — agency details (test client no longer provisioned here)
      // ================================================================
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Name Your Agency</h2>
              <p className="mt-2 text-[#fafaf9]/50">This is how clients will see your brand</p>
            </div>
            <div className="max-w-md mx-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">Agency Name</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#fafaf9]/30" />
                  <input type="text" value={agencyDetails.name}
                    onChange={(e) => { setAgencyDetails({ ...agencyDetails, name: e.target.value }); setError(''); }}
                    placeholder="SmartCall Solutions"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-12 pr-4 py-4 text-lg text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all" />
                </div>
                <p className="mt-2 text-xs text-[#fafaf9]/40">This appears on your signup pages, client dashboard, and emails</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">Phone Number</label>
                <div className="flex items-stretch rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-white/20 focus-within:bg-white/[0.05] transition-all">
                  <CountrySelect
                    value={agencyDetails.country}
                    onChange={(iso) => { setAgencyDetails({ ...agencyDetails, country: iso }); setError(''); }}
                  />
                  <input type="tel" value={agencyDetails.phone}
                    onChange={(e) => { setAgencyDetails({ ...agencyDetails, phone: e.target.value }); setError(''); }}
                    placeholder={selectedCountry.example || 'Phone number'} required
                    className="flex-1 min-w-0 bg-transparent rounded-r-xl pl-3 pr-4 py-4 text-lg text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none" />
                </div>
                <p className="mt-2 text-xs text-[#fafaf9]/40">We use your country to route your calls and texts correctly, and for support and account notifications.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">How did you hear about us?</label>
                <div className="relative">
                  <select value={agencyDetails.referralSource}
                    onChange={(e) => { setAgencyDetails({ ...agencyDetails, referralSource: e.target.value }); setError(''); }}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-lg text-[#fafaf9] focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all appearance-none cursor-pointer">
                    {REFERRAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[#1a1a1a] text-[#fafaf9]">{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#fafaf9]/30 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="max-w-md mx-auto p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-xs text-[#fafaf9]/40 mb-3 uppercase tracking-wider">Preview</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Building className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-[#fafaf9]">{agencyDetails.name || 'Your Agency Name'}</p>
                  <p className="text-sm text-[#fafaf9]/50">AI Voice Agency</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <button onClick={handleStep1Next} disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : (<>Continue<ArrowRight className="w-4 h-4" /></>)}
              </button>
            </div>
          </div>
        );

      // ================================================================
      // STEP 2 — plan selection (copy made card-accurate)
      // ================================================================
      case 2:
        return (
          <div className="space-y-10" style={{ maxWidth: '1080px', margin: '0 auto' }}>
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Choose Your Plan</h2>
              <p className="mt-3 text-base text-[#fafaf9]/50">Start free with no card &mdash; or try Pro &amp; Scale free for 14 days.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">

              {/* FREE */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-9 flex flex-col">
                <div className="mb-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl bg-white/[0.05] flex items-center justify-center">
                      <Zap className="h-5 w-5 text-[#fafaf9]/60" />
                    </div>
                    <span className="text-lg font-semibold text-[#fafaf9]/80">{AGENCY_PLAN_TIERS.free.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-[56px] font-bold tracking-tight leading-none">$0</span>
                    <span className="text-lg text-[#fafaf9]/30">/mo</span>
                  </div>
                  <p className="text-[15px] text-[#fafaf9]/40">{AGENCY_PLAN_TIERS.free.rate}</p>
                </div>
                <div className="h-px bg-white/[0.06] mb-7" />
                <ul className="space-y-5 mb-9 flex-1">
                  {AGENCY_PLAN_TIERS.free.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="h-[18px] w-[18px] mt-0.5 text-[#fafaf9]/30 shrink-0" />
                      <span className="text-[15px] text-[#fafaf9]/60 leading-snug">{f}</span>
                    </li>
                  ))}
                  {AGENCY_PLAN_TIERS.free.limitations.map((l) => (
                    <li key={l} className="flex items-start gap-3">
                      <span className="h-[18px] w-[18px] mt-0.5 shrink-0 flex items-center justify-center text-[#fafaf9]/20 text-xs">—</span>
                      <span className="text-[15px] text-[#fafaf9]/30 leading-snug">{l}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleSelectPlan('free')}
                  className="w-full rounded-full py-4 text-base font-semibold border border-white/[0.1] text-[#fafaf9]/80 bg-transparent hover:bg-white/[0.05] hover:border-white/[0.2] transition-all hover:scale-[1.01] active:scale-[0.99]">
                  Get Started Free
                </button>
              </div>

              {/* PRO */}
              <div className="rounded-2xl relative overflow-hidden flex flex-col md:-mt-5 md:mb-0"
                style={{
                  background: 'linear-gradient(180deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.03) 40%, rgba(5,5,5,0.95) 100%)',
                  border: '1.5px solid rgba(16,185,129,0.35)',
                  boxShadow: '0 0 60px -10px rgba(16,185,129,0.15), 0 20px 60px -20px rgba(0,0,0,0.5)',
                }}>
                <div className="h-1 bg-emerald-500 w-full" />
                <div className="flex justify-center pt-5">
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-500 text-[#050505]">Popular</span>
                </div>
                <div className="p-9 pt-5 flex flex-col flex-1">
                  <div className="mb-7">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-11 w-11 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-emerald-400" />
                      </div>
                      <span className="text-lg font-semibold text-[#fafaf9]">{AGENCY_PLAN_TIERS.pro.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-[56px] font-bold tracking-tight leading-none">${AGENCY_PLAN_TIERS.pro.price}</span>
                      <span className="text-lg text-[#fafaf9]/30">/mo</span>
                    </div>
                    <p className="text-[15px] text-emerald-400/70">{AGENCY_PLAN_TIERS.pro.rate}</p>
                  </div>
                  <div className="h-px bg-emerald-500/20 mb-7" />
                  <ul className="space-y-5 mb-9 flex-1">
                    {AGENCY_PLAN_TIERS.pro.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Check className="h-[18px] w-[18px] mt-0.5 text-emerald-400 shrink-0" />
                        <span className="text-[15px] text-[#fafaf9]/80 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleSelectPlan('pro')}
                    className="group w-full rounded-full py-[18px] text-base font-bold bg-emerald-500 text-[#050505] hover:bg-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ boxShadow: '0 4px 24px rgba(16,185,129,0.3)' }}>
                    Start 14-Day Free Trial
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* SCALE */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-9 flex flex-col">
                <div className="mb-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl bg-white/[0.05] flex items-center justify-center">
                      <Crown className="h-5 w-5 text-[#fafaf9]/60" />
                    </div>
                    <span className="text-lg font-semibold text-[#fafaf9]/80">{AGENCY_PLAN_TIERS.scale.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-[56px] font-bold tracking-tight leading-none">${AGENCY_PLAN_TIERS.scale.price}</span>
                    <span className="text-lg text-[#fafaf9]/30">/mo</span>
                  </div>
                  <p className="text-[15px] text-[#fafaf9]/40">{AGENCY_PLAN_TIERS.scale.rate}</p>
                </div>
                <div className="h-px bg-white/[0.06] mb-7" />
                <ul className="space-y-5 mb-9 flex-1">
                  {AGENCY_PLAN_TIERS.scale.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="h-[18px] w-[18px] mt-0.5 text-[#fafaf9]/30 shrink-0" />
                      <span className="text-[15px] text-[#fafaf9]/60 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleSelectPlan('scale')}
                  className="w-full rounded-full py-4 text-base font-semibold border border-white/[0.1] text-[#fafaf9]/80 bg-transparent hover:bg-white/[0.05] hover:border-white/[0.2] transition-all hover:scale-[1.01] active:scale-[0.99]">
                  Start 14-Day Free Trial
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <div className="inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[15px] text-[#fafaf9]/40">
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400/60" />Free plan needs no card</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400/60" />Paid trials: $0 for 14 days</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400/60" />Cancel anytime</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button onClick={() => setCurrentStep(1)} className="inline-flex items-center gap-2 text-[15px] text-[#fafaf9]/40 hover:text-[#fafaf9]/70 transition-colors">
                <ArrowLeft className="h-4 w-4" />Back
              </button>
            </div>
          </div>
        );

      // ================================================================
      // STEP 3 — confirm & continue (Free → set password; Pro/Scale → checkout)
      // ================================================================
      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {selectedPlan === 'free' ? 'Set Your Password' : "You're Almost In"}
              </h2>
              <p className="mt-2 text-[#fafaf9]/50">
                {selectedPlan === 'free'
                  ? 'Create a password and start building your agency'
                  : 'Add your card to start your 14-day free trial — you won\u2019t be charged today'}
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
                {selectedPlan === 'free' && <Zap className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
                {selectedPlan === 'pro' && <Shield className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
                {selectedPlan === 'scale' && <Crown className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
                <div>
                  <p className="text-sm font-medium text-[#fafaf9]">
                    {selectedPlan === 'free' ? 'Free Plan' : selectedPlan === 'pro' ? 'Pro Plan — 14-day trial' : 'Scale Plan — 14-day trial'}
                  </p>
                  <p className="text-xs text-[#fafaf9]/50">
                    {selectedPlan === 'free' ? 'No platform fee — pay per usage' : `$${PLAN_PRICES[selectedPlan as keyof typeof PLAN_PRICES]}/mo after trial`}
                  </p>
                </div>
                <button onClick={() => setCurrentStep(2)} className="ml-auto text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Change</button>
              </div>
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-[#fafaf9]/60">{selectedPlan === 'free' ? 'Instant access to your dashboard' : 'Full platform access for 14 days'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-[#fafaf9]/60">{selectedPlan === 'free' ? 'No credit card required' : 'You won\u2019t be charged for 14 days'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-[#fafaf9]/60">{selectedPlan === 'free' ? 'Upgrade to Pro or Scale anytime' : 'Cancel anytime before your trial ends'}</p>
                </div>
              </div>
              <button onClick={handleSetPassword} disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98] disabled:opacity-50">
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />{selectedPlan === 'free' ? 'Setting up...' : 'Redirecting to secure checkout...'}</>
                ) : (
                  <>{selectedPlan === 'free' ? 'Set Password & Go' : 'Add Card & Start Trial'}<ArrowRight className="w-5 h-5" /></>
                )}
              </button>
              {selectedPlan !== 'free' && (
                <p className="text-center text-xs text-[#fafaf9]/40">
                  Secure checkout by Stripe. You set your password right after.
                </p>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <OnboardingProgress currentStep={currentStep} />
      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center text-sm text-red-400 max-w-md mx-auto">{error}</div>
      )}
      <div className="mx-auto" style={{ maxWidth: '1080px' }}>{renderStepContent()}</div>
    </>
  );
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]" style={{ zoom: 0.75 }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[128px]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-512x512.png" alt="VoiceAI Connect" width={40} height={40} className="rounded-xl sm:w-[44px] sm:h-[44px]" />
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="relative mx-auto" style={{ maxWidth: '1160px' }}>
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          }>
            <OnboardingContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}