'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  Lock,
  Building,
  ChevronDown
} from 'lucide-react';

// ============================================================================
// REFERRAL SOURCE OPTIONS
// ============================================================================
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
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
// STEP DEFINITIONS (trimmed to 2 steps)
// ============================================================================
const steps = [
  { id: 1, name: 'Agency', icon: Building, description: 'Name your agency' },
  { id: 2, name: 'Password', icon: Lock, description: 'Secure & start trial' },
];

// ============================================================================
// PROGRESS COMPONENT
// ============================================================================
function OnboardingProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-10 sm:mb-12">
      <div className="flex items-center justify-center gap-1">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all duration-300 ${
                step.id < currentStep
                  ? 'bg-emerald-500 text-[#050505]'
                  : step.id === currentStep
                  ? 'bg-white/10 text-[#fafaf9] ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#050505]'
                  : 'bg-white/[0.03] text-[#fafaf9]/30'
              }`}
            >
              {step.id < currentStep ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-1.5 transition-colors duration-300 ${
                  step.id < currentStep ? 'bg-emerald-500' : 'bg-white/[0.06]'
                }`}
              />
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

// ============================================================================
// MAIN ONBOARDING CONTENT
// ============================================================================
function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyData, setAgencyData] = useState<any>(null);
  
  const [agencyDetails, setAgencyDetails] = useState({
    name: '',
    phone: '',
    referralSource: '',
  });

  // ==========================================================================
  // Accept ?agency= URL param as fallback for localStorage.
  // ==========================================================================
  useEffect(() => {
    const fetchAgency = async () => {
      if (!sessionId) {
        const storedAgencyId = localStorage.getItem('onboarding_agency_id');
        const urlAgencyId = searchParams.get('agency');
        const resolvedAgencyId = storedAgencyId || urlAgencyId;

        if (resolvedAgencyId) {
          setAgencyId(resolvedAgencyId);
          if (!storedAgencyId && urlAgencyId) {
            localStorage.setItem('onboarding_agency_id', resolvedAgencyId);
          }
          await loadAgencyData(resolvedAgencyId);
        } else {
          router.push('/signup');
        }
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
      } catch (err) {
        console.error('Failed to verify session:', err);
      }
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
        
        // If agency already has a real name, they've done step 1 — go to step 2
        if (data.agency.name && !data.agency.name.includes("'s Agency") && data.agency.name !== 'My Agency') {
          setAgencyDetails({
            name: data.agency.name || '',
            phone: data.agency.phone || '',
            referralSource: data.agency.referral_source || '',
          });
          setCurrentStep(2);
        } else {
          setCurrentStep(1);
        }
      }
    } catch (err) {
      console.error('Failed to load agency:', err);
    }
  };

  const saveStep = async (step: number, data: any) => {
    if (!agencyId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: agencyId,
          step,
          data,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save');
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep !== 1) return;

    if (!agencyDetails.name.trim()) { setError('Please enter your agency name'); return; }
    if (!agencyDetails.phone.trim()) { setError('Please enter your phone number'); return; }
    if (!agencyDetails.referralSource) { setError('Please select how you heard about us'); return; }

    const result = await saveStep(1, { 
      name: agencyDetails.name.trim(),
      phone: agencyDetails.phone,
      referral_source: agencyDetails.referralSource,
    });
    
    if (result?.success) {
      setCurrentStep(2);
    }
  };

  // ==========================================================================
  // FIX: Use relative URL so this hits Next.js API route, NOT Express backend.
  // The Express backend has no /api/agency/start-trial route — only Next.js does.
  // The old code used `${backendUrl}/api/agency/start-trial` which 404'd silently,
  // leaving subscription_status stuck at 'pending' and triggering the dashboard gate.
  // ==========================================================================
  const startDefaultTrial = async () => {
    if (!agencyId) return;
    try {
      const response = await fetch('/api/agency/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, planType: 'starter' }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('⚠️ Trial start failed:', data.error);
        return;
      }
      
      console.log('✅ Trial started with default plan (starter)');
    } catch (err) {
      console.error('⚠️ Failed to start trial:', err);
    }
  };

  const handleSetPassword = async () => {
    setLoading(true);
    
    // Start trial FIRST — this flips pending → trialing so the dashboard gate won't block
    await startDefaultTrial();
    
    const token = localStorage.getItem('agency_password_token');
    
    if (token && agencyId) {
      localStorage.removeItem('agency_password_token');
      const returnTo = encodeURIComponent('/agency/dashboard');
      // Use window.location for a clean navigation (no flash/jump)
      window.location.href = `/auth/set-password?token=${token}&returnTo=${returnTo}`;
    } else if (agencyId) {
      // No token means they already have a password (e.g. Google OAuth or forgot-password flow)
      localStorage.removeItem('onboarding_agency_id');
      window.location.href = '/agency/dashboard';
    } else {
      window.location.href = '/signup';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
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
                  <input
                    type="text"
                    value={agencyDetails.name}
                    onChange={(e) => { setAgencyDetails({ ...agencyDetails, name: e.target.value }); setError(''); }}
                    placeholder="SmartCall Solutions"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-12 pr-4 py-4 text-lg text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
                  />
                </div>
                <p className="mt-2 text-xs text-[#fafaf9]/40">This appears on your signup pages, client dashboard, and emails</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#fafaf9]/30" />
                  <input
                    type="tel"
                    value={agencyDetails.phone}
                    onChange={(e) => { setAgencyDetails({ ...agencyDetails, phone: e.target.value }); setError(''); }}
                    placeholder="(555) 123-4567"
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-12 pr-4 py-4 text-lg text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
                  />
                </div>
                <p className="mt-2 text-xs text-[#fafaf9]/40">For support, account updates, and important notifications</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">How did you hear about us?</label>
                <div className="relative">
                  <select
                    value={agencyDetails.referralSource}
                    onChange={(e) => { setAgencyDetails({ ...agencyDetails, referralSource: e.target.value }); setError(''); }}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-lg text-[#fafaf9] focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all appearance-none cursor-pointer"
                  >
                    {REFERRAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[#1a1a1a] text-[#fafaf9]">{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#fafaf9]/30 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Preview */}
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

            {/* Continue Button */}
            <div className="flex justify-center">
              <button
                onClick={handleNext}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Set Your Password</h2>
              <p className="mt-2 text-[#fafaf9]/50">Create a password and your 14-day free trial begins</p>
            </div>
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-[#fafaf9]/60">Full platform access for 14 days</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-[#fafaf9]/60">No credit card required</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-[#fafaf9]/60">Customize branding, pricing & more in your dashboard</p>
                </div>
              </div>
              <button
                onClick={handleSetPassword}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting your trial...
                  </>
                ) : (
                  <>
                    Set Password & Start Trial
                    <ArrowRight className="w-5 h-5" />
                  </>
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
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center text-sm text-red-400 max-w-md mx-auto">
          {error}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {renderStepContent()}
      </div>
    </>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]" style={{ zoom: 0.75 }}>
      {/* Grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[128px]" />
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
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="relative mx-auto max-w-4xl">
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