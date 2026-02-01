'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, 
  Upload, 
  Palette, 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  Lock,
  Info,
  Building
} from 'lucide-react';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function getColorLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return rgbToHex(R, G, B);
}

async function extractColorsFromImage(imageUrl: string): Promise<{ primary: string; secondary: string; accent: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ primary: '#10b981', secondary: '#059669', accent: '#34d399' });
        return;
      }

      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      const colorCounts: Map<string, { count: number; r: number; g: number; b: number }> = new Map();
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a < 128) continue;

        const luminance = getColorLuminance(r, g, b);
        if (luminance > 0.9 || luminance < 0.1) continue;

        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;

        const existing = colorCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          colorCounts.set(key, { count: 1, r: qr, g: qg, b: qb });
        }
      }

      const sortedColors = Array.from(colorCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (sortedColors.length === 0) {
        resolve({ primary: '#10b981', secondary: '#059669', accent: '#34d399' });
        return;
      }

      const primary = sortedColors[0];
      const primaryHex = rgbToHex(primary.r, primary.g, primary.b);
      const secondaryHex = adjustColorBrightness(primaryHex, -20);
      let accentHex = adjustColorBrightness(primaryHex, 20);
      if (sortedColors.length > 1) {
        const accent = sortedColors[1];
        accentHex = rgbToHex(accent.r, accent.g, accent.b);
      }

      resolve({
        primary: primaryHex,
        secondary: secondaryHex,
        accent: accentHex,
      });
    };

    img.onerror = () => {
      resolve({ primary: '#10b981', secondary: '#059669', accent: '#34d399' });
    };

    img.src = imageUrl;
  });
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
// STEP DEFINITIONS
// ============================================================================
const steps = [
  { id: 1, name: 'Agency', icon: Building, description: 'Name your agency' },
  { id: 2, name: 'Logo', icon: ImageIcon, description: 'Upload your brand' },
  { id: 3, name: 'Colors', icon: Palette, description: 'Set your palette' },
  { id: 4, name: 'Pricing', icon: DollarSign, description: 'Configure plans' },
  { id: 5, name: 'Payments', icon: CreditCard, description: 'Connect Stripe' },
  { id: 6, name: 'Password', icon: Lock, description: 'Secure account' },
  { id: 7, name: 'Complete', icon: CheckCircle2, description: 'All done!' },
];

// ============================================================================
// PROGRESS COMPONENT
// ============================================================================
function OnboardingProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-10 sm:mb-12">
      <div className="hidden sm:flex items-center justify-center gap-1">
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
                className={`w-4 sm:w-6 h-0.5 mx-1 transition-colors duration-300 ${
                  step.id < currentStep ? 'bg-emerald-500' : 'bg-white/[0.06]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="sm:hidden">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step.id === currentStep ? 'w-6 bg-emerald-500' : 'w-1.5'
              } ${step.id < currentStep ? 'bg-emerald-500' : step.id > currentStep ? 'bg-white/10' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
          <span className="text-emerald-400 text-sm font-medium">Step {currentStep}</span>
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
  });
  
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [extractingColors, setExtractingColors] = useState(false);
  
  const [colors, setColors] = useState({
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
  });
  
  const [pricing, setPricing] = useState({
    starter: 49,
    pro: 99,
    growth: 149,
    limitStarter: 50,
    limitPro: 150,
    limitGrowth: 500,
  });

  useEffect(() => {
    const fetchAgency = async () => {
      if (!sessionId) {
        const storedAgencyId = localStorage.getItem('onboarding_agency_id');
        if (storedAgencyId) {
          setAgencyId(storedAgencyId);
          await loadAgencyData(storedAgencyId);
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
        
        if (!data.agency.name || data.agency.name.includes("'s Agency") || data.agency.name === 'My Agency') {
          setCurrentStep(1);
        } else {
          setCurrentStep(data.agency.onboarding_step || 1);
        }
        
        if (data.agency.name && !data.agency.name.includes("'s Agency")) {
          setAgencyDetails({
            name: data.agency.name || '',
            phone: data.agency.phone || '',
          });
        }
        if (data.agency.logo_url) setLogoUrl(data.agency.logo_url);
        if (data.agency.primary_color) {
          setColors({
            primary: data.agency.primary_color,
            secondary: data.agency.secondary_color || '#059669',
            accent: data.agency.accent_color || '#34d399',
          });
        }
        if (data.agency.price_starter) {
          setPricing({
            starter: data.agency.price_starter / 100,
            pro: data.agency.price_pro / 100,
            growth: data.agency.price_growth / 100,
            limitStarter: data.agency.limit_starter || 50,
            limitPro: data.agency.limit_pro || 150,
            limitGrowth: data.agency.limit_growth || 500,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load agency:', err);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        
        setExtractingColors(true);
        try {
          const extractedColors = await extractColorsFromImage(dataUrl);
          setColors(extractedColors);
        } catch (err) {
          console.error('Color extraction failed:', err);
        } finally {
          setExtractingColors(false);
        }
      };
      reader.readAsDataURL(file);
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
    let stepData = {};
    
    switch (currentStep) {
      case 1:
        if (!agencyDetails.name.trim()) {
          setError('Please enter your agency name');
          return;
        }
        stepData = { 
          name: agencyDetails.name.trim(),
          phone: agencyDetails.phone,
        };
        break;
      case 2:
        stepData = { logo_url: logoPreview || logoUrl };
        break;
      case 3:
        stepData = {
          primary_color: colors.primary,
          secondary_color: colors.secondary,
          accent_color: colors.accent,
        };
        break;
      case 4:
        stepData = {
          price_starter: pricing.starter * 100,
          price_pro: pricing.pro * 100,
          price_growth: pricing.growth * 100,
          limit_starter: pricing.limitStarter,
          limit_pro: pricing.limitPro,
          limit_growth: pricing.limitGrowth,
        };
        break;
      case 5:
        break;
    }

    const result = await saveStep(currentStep, stepData);
    
    if (result?.success) {
      if (currentStep < 7) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStripeConnect = async () => {
    if (!agencyId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/connect/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agency_id: agencyId }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to start Stripe Connect');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const handleSkipConnect = async () => {
    await saveStep(5, {});
    setCurrentStep(6);
  };

  // FIXED: Pass agency ID to plan page
  const handleSetPassword = () => {
    const token = localStorage.getItem('agency_password_token');
    const agencyIdForPlan = agencyId;
    
    if (token && agencyIdForPlan) {
      localStorage.removeItem('agency_password_token');
      
      const returnTo = encodeURIComponent(`/signup/plan?agency=${agencyIdForPlan}`);
      router.push(`/auth/set-password?token=${token}&returnTo=${returnTo}`);
    } else if (agencyIdForPlan) {
      localStorage.removeItem('onboarding_agency_id');
      router.push(`/signup/plan?agency=${agencyIdForPlan}`);
    } else {
      router.push('/signup');
    }
  };

  // FIXED: Go to plan page with agency ID
  const handleComplete = () => {
    if (agencyId) {
      localStorage.removeItem('onboarding_agency_id');
      localStorage.removeItem('agency_password_token');
      router.push(`/signup/plan?agency=${agencyId}`);
    } else {
      router.push('/signup');
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
                    onChange={(e) => setAgencyDetails({ ...agencyDetails, name: e.target.value })}
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
                    onChange={(e) => setAgencyDetails({ ...agencyDetails, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-12 pr-4 py-4 text-lg text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
                  />
                </div>
                <p className="mt-2 text-xs text-[#fafaf9]/40">For support and account verification (optional)</p>
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Upload Your Logo</h2>
              <p className="mt-2 text-[#fafaf9]/50">This appears on your client portal, emails, and marketing site</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/[0.02] overflow-hidden transition-colors group-hover:border-white/30">
                  {logoPreview || logoUrl ? (
                    <img src={logoPreview || logoUrl} alt="Logo preview" className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-10 h-10 text-[#fafaf9]/20 mx-auto mb-2" />
                      <p className="text-xs text-[#fafaf9]/30">Drop logo here</p>
                    </div>
                  )}
                </div>
              </div>

              <label className="cursor-pointer group">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-6 py-3 text-sm font-medium hover:bg-white/[0.1] hover:border-white/[0.15] transition-all group-hover:scale-[1.02]">
                  <Upload className="w-4 h-4" />
                  {logoPreview || logoUrl ? 'Change Logo' : 'Upload Logo'}
                </span>
              </label>

              <p className="text-sm text-[#fafaf9]/30">PNG, JPG or SVG • Recommended: 400×400px</p>

              {extractingColors && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting brand colors...
                </div>
              )}
              
              {(logoPreview || logoUrl) && !extractingColors && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] w-full max-w-xs">
                  <div className="flex items-center gap-2 text-sm text-emerald-400 mb-3">
                    <Sparkles className="w-4 h-4" />
                    Colors extracted from logo
                  </div>
                  <div className="flex gap-2 justify-center">
                    {[colors.primary, colors.secondary, colors.accent].map((color, i) => (
                      <div key={i} className="w-10 h-10 rounded-xl border border-white/10 shadow-lg" style={{ backgroundColor: color }} title={['Primary', 'Secondary', 'Accent'][i]} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Brand Colors</h2>
              <p className="mt-2 text-[#fafaf9]/50">Customize how your portal looks to clients</p>
            </div>

            {(logoPreview || logoUrl) && (
              <div className="flex justify-center">
                <button
                  onClick={async () => {
                    setExtractingColors(true);
                    try {
                      const extractedColors = await extractColorsFromImage(logoPreview || logoUrl);
                      setColors(extractedColors);
                    } catch (err) {
                      console.error('Color extraction failed:', err);
                    } finally {
                      setExtractingColors(false);
                    }
                  }}
                  disabled={extractingColors}
                  className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                >
                  {extractingColors ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Re-extract from logo
                </button>
              </div>
            )}

            <div className="space-y-4 max-w-md mx-auto">
              {[
                { key: 'primary', label: 'Primary Color', desc: 'Buttons & main accents' },
                { key: 'secondary', label: 'Secondary Color', desc: 'Hover states & backgrounds' },
                { key: 'accent', label: 'Accent Color', desc: 'Highlights & links' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="relative">
                    <input
                      type="color"
                      value={colors[key as keyof typeof colors]}
                      onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                      className="w-12 h-12 rounded-xl border-2 border-white/10 cursor-pointer bg-transparent appearance-none"
                      style={{ backgroundColor: colors[key as keyof typeof colors] }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-[#fafaf9]/40">{desc}</p>
                  </div>
                  <input
                    type="text"
                    value={colors[key as keyof typeof colors]}
                    onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                    className="w-24 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-mono text-center"
                  />
                </div>
              ))}
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] max-w-md mx-auto">
              <p className="text-xs text-[#fafaf9]/40 mb-4 uppercase tracking-wider">Preview</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 rounded-lg text-sm font-medium transition-transform hover:scale-105" style={{ backgroundColor: colors.primary, color: '#fff' }}>Primary Button</button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium transition-transform hover:scale-105" style={{ backgroundColor: colors.secondary, color: '#fff' }}>Secondary</button>
                <span className="px-4 py-2 text-sm font-medium underline underline-offset-2" style={{ color: colors.accent }}>Accent Link</span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Set Your Pricing</h2>
              <p className="mt-2 text-[#fafaf9]/50">What you charge clients — you keep 100%</p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              {[
                { key: 'starter', label: 'Starter Plan', limitKey: 'limitStarter', recommended: false },
                { key: 'pro', label: 'Pro Plan', limitKey: 'limitPro', recommended: true },
                { key: 'growth', label: 'Growth Plan', limitKey: 'limitGrowth', recommended: false },
              ].map(({ key, label, limitKey, recommended }) => (
                <div key={key} className={`p-5 rounded-xl border transition-all ${recommended ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-medium">{label}</p>
                    {recommended && <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Most Popular</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#fafaf9]/40 mb-2">Monthly Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#fafaf9]/40 text-sm">$</span>
                        <input
                          type="number"
                          value={pricing[key as keyof typeof pricing]}
                          onChange={(e) => setPricing({ ...pricing, [key]: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-8 pr-4 py-3 text-lg font-semibold focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#fafaf9]/40 mb-2">Calls / Month</label>
                      <input
                        type="number"
                        value={pricing[limitKey as keyof typeof pricing]}
                        onChange={(e) => setPricing({ ...pricing, [limitKey]: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-lg font-semibold focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] max-w-2xl mx-auto">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-[#fafaf9]/60">
                <span className="text-amber-400 font-medium">Tip:</span> Most agencies charge $99-149 for Pro plans. A missed call can cost a business $500+, so pricing at $149/mo is a no-brainer for them.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Connect Stripe</h2>
              <p className="mt-2 text-[#fafaf9]/50">Receive payments directly from clients</p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div className="p-6 rounded-xl border border-[#635BFF]/30 bg-[#635BFF]/[0.05]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#635BFF]/20 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-[#635BFF]" />
                  </div>
                  <div>
                    <h3 className="font-medium">Stripe Connect</h3>
                    <p className="mt-1 text-sm text-[#fafaf9]/50">Client payments go directly to your Stripe account. You keep 100% minus standard Stripe fees (2.9% + 30¢).</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStripeConnect}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#635BFF] px-6 py-4 text-base font-medium text-white hover:bg-[#5851ea] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect with Stripe
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>

              <button onClick={handleSkipConnect} className="w-full text-sm text-[#fafaf9]/40 hover:text-[#fafaf9]/60 transition-colors py-2">
                Skip for now — set up later in settings
              </button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Secure Your Account</h2>
              <p className="mt-2 text-[#fafaf9]/50">Create a password to access your dashboard</p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-sm text-[#fafaf9]/60">You're almost done! Click below to set your password and select your plan.</p>
              </div>

              <button
                onClick={handleSetPassword}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
              >
                Set Password & Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-8 text-center">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-500 animate-ping opacity-20" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Almost There!</h2>
              <p className="mt-2 text-[#fafaf9]/50">Select your plan to complete setup</p>
            </div>

            <button
              onClick={handleComplete}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 active:scale-[0.98]"
            >
              Choose Your Plan
              <ArrowRight className="w-5 h-5" />
            </button>
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

      {currentStep < 6 && (
        <div className="mt-10 sm:mt-12 flex justify-center gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-6 py-3.5 text-sm font-medium hover:bg-white/[0.1] transition-all disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          
          {currentStep < 5 && (
            <button
              onClick={handleNext}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
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
          )}
        </div>
      )}
    </>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[128px]" />
      </div>

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