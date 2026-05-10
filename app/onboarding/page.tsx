'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, CheckCircle2, Loader2, ArrowRight, Lock,
  Building, ChevronDown, Zap, Shield, Crown, Check, ArrowLeft
} from 'lucide-react';
import { PLAN_PRICES, PLAN_RATES } from '@/lib/plan-limits';

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
  const [agencyDetails, setAgencyDetails] = useState({ name: '', phone: '', referralSource: '' });

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
          setAgencyDetails({ name: data.agency.name || '', phone: data.agency.phone || '', referralSource: data.agency.referral_source || '' });
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
    const result = await saveStep(1, { name: agencyDetails.name.trim(), phone: agencyDetails.phone, referral_source: agencyDetails.referralSource });
    if (result?.success) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      fetch(`${backendUrl}/api/agency/${agencyId}/provision-test-client`, { method: 'POST' })
        .then(() => console.log('✅ Test client provisioning started'))
        .catch(() => console.warn('⚠️ Test client provisioning failed (non-blocking)'));
      setCurrentStep(2);
    }
  };

  const handleSelectPlan = (planId: string) => { setSelectedPlan(planId); setCurrentStep(3); };

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
    if (selectedPlan && selectedPlan !== 'free') await startTrial(selectedPlan);
    const token = localStorage.getItem('agency_password_token');
    if (token && agencyId) {
      localStorage.removeItem('agency_password_token');
      const returnTo = encodeURIComponent('/agency/dashboard');
      window.location.href = `/auth/set-password?token=${token}&returnTo=${returnTo}`;
    } else if (agencyId) {
      localStorage.removeItem('onboarding_agency_id');
      window.location.href = '/agency/dashboard';
    } else { window.location.href = '/signup'; }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      // ================================================================
      // STEP 1 — unchanged
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
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#fafaf9]/30" />
                  <input type="tel" value={agencyDetails.phone}
                    onChange={(e) => { setAgencyDetails({ ...agencyDetails, phone: e.target.value }); setError(''); }}
                    placeholder="(555) 123-4567" required
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-12 pr-4 py-4 text-lg text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all" />
                </div>
                <p className="mt-2 text-xs text-[#fafaf9]/40">For support, account updates, and important notifications</p>
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
      // STEP 2 — SCALED UP to match steps 1/3
      // ================================================================
      case 2:
        return (
          <div className="space-y-10" style={{ maxWidth: '1080px', margin: '0 auto' }}>
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Choose Your Plan</h2>
              <p className="mt-3 text-base text-[#fafaf9]/50">No credit card required. Start free or try Pro for 14 days.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">

              {/* FREE */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-9 flex flex-col">
                <div className="mb-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl bg-white/[0.05] flex items-center justify-center">
                      <Zap className="h-5 w-5 text-[#fafaf9]/60" />
                    </div>
                    <span className="text-lg font-semibold text-[#fafaf9]/80">Free</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-[56px] font-bold tracking-tight leading-none">$0</span>
                    <span className="text-lg text-[#fafaf9]/30">/mo</span>
                  </div>
                  <p className="text-[15px] text-[#fafaf9]/40">${PLAN_RATES.free.perClient}/client + ${PLAN_RATES.free.perMinute}/min</p>
                </div>
                <div className="h-px bg-white/[0.06] mb-7" />
                <ul className="space-y-5 mb-9 flex-1">
                  {['AI receptionist for every client', 'Demo phone line included', 'Call summaries via SMS + email', 'Spam detection & caller ID', 'Industry templates included'].map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="h-[18px] w-[18px] mt-0.5 text-[#fafaf9]/30 shrink-0" />
                      <span className="text-[15px] text-[#fafaf9]/60 leading-snug">{f}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3">
                    <span className="h-[18px] w-[18px] mt-0.5 shrink-0 flex items-center justify-center text-[#fafaf9]/20 text-xs">—</span>
                    <span className="text-[15px] text-[#fafaf9]/30 leading-snug">VoiceAI Connect branding</span>
                  </li>
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
                      <span className="text-lg font-semibold text-[#fafaf9]">Pro</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-[56px] font-bold tracking-tight leading-none">$179</span>
                      <span className="text-lg text-[#fafaf9]/30">/mo</span>
                    </div>
                    <p className="text-[15px] text-emerald-400/70">${PLAN_RATES.pro.perClient}/client + ${PLAN_RATES.pro.perMinute}/min</p>
                  </div>
                  <div className="h-px bg-emerald-500/20 mb-7" />
                  <ul className="space-y-5 mb-9 flex-1">
                    {['Everything in Free', 'Your brand on everything', 'Custom domain + marketing site', 'Lead finder to grow pipeline', 'Team members'].map((f) => (
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
                    <span className="text-lg font-semibold text-[#fafaf9]/80">Scale</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-[56px] font-bold tracking-tight leading-none">$499</span>
                    <span className="text-lg text-[#fafaf9]/30">/mo</span>
                  </div>
                  <p className="text-[15px] text-[#fafaf9]/40">$0/client + ${PLAN_RATES.scale.perMinute}/min</p>
                </div>
                <div className="h-px bg-white/[0.06] mb-7" />
                <ul className="space-y-5 mb-9 flex-1">
                  {['Everything in Pro', 'Advanced lead finder + API', 'Unlimited team members', 'Industry templates included', 'Priority support'].map((f) => (
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
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400/60" />No credit card required</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400/60" />Upgrade anytime</span>
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
      // STEP 3 — unchanged
      // ================================================================
      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Set Your Password</h2>
              <p className="mt-2 text-[#fafaf9]/50">
                {selectedPlan === 'free' ? 'Create a password and start building your agency' : 'Create a password and your 14-day free trial begins'}
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
                  <p className="text-sm text-[#fafaf9]/60">No credit card required</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-[#fafaf9]/60">{selectedPlan === 'free' ? 'Upgrade to Pro or Scale anytime' : 'Customize branding, pricing & more'}</p>
                </div>
              </div>
              <button onClick={handleSetPassword} disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98] disabled:opacity-50">
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />{selectedPlan === 'free' ? 'Setting up...' : 'Starting your trial...'}</>
                ) : (
                  <>{selectedPlan === 'free' ? 'Set Password & Go' : 'Set Password & Start Trial'}<ArrowRight className="w-5 h-5" /></>
                )}
              </button>
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