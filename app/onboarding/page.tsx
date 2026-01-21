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
  Sparkles
} from 'lucide-react';

// Color extraction utilities
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
        resolve({ primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' });
        return;
      }

      // Scale down for performance
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Collect colors (skip transparent and near-white/black)
      const colorCounts: Map<string, { count: number; r: number; g: number; b: number }> = new Map();
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // Skip near-white and near-black
        const luminance = getColorLuminance(r, g, b);
        if (luminance > 0.9 || luminance < 0.1) continue;

        // Quantize colors to reduce variations (group similar colors)
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

      // Sort by frequency
      const sortedColors = Array.from(colorCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (sortedColors.length === 0) {
        resolve({ primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' });
        return;
      }

      // Pick primary (most frequent), then find contrasting secondary and accent
      const primary = sortedColors[0];
      const primaryHex = rgbToHex(primary.r, primary.g, primary.b);

      // Secondary: darker version of primary
      const secondaryHex = adjustColorBrightness(primaryHex, -20);

      // Accent: find a different color or lighter version
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
      resolve({ primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' });
    };

    img.src = imageUrl;
  });
}

// Step definitions
const steps = [
  { id: 1, name: 'Logo', icon: ImageIcon },
  { id: 2, name: 'Colors', icon: Palette },
  { id: 3, name: 'Pricing', icon: DollarSign },
  { id: 4, name: 'Payments', icon: CreditCard },
  { id: 5, name: 'Complete', icon: CheckCircle2 },
];

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyData, setAgencyData] = useState<any>(null);
  
  // Form state
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  
  const [colors, setColors] = useState({
    primary: '#2563eb',
    secondary: '#1e40af',
    accent: '#3b82f6',
  });
  
  const [pricing, setPricing] = useState({
    starter: 49,
    pro: 99,
    growth: 149,
    limitStarter: 50,
    limitPro: 150,
    limitGrowth: 500,
  });

  // Fetch agency data on mount
  useEffect(() => {
    const fetchAgency = async () => {
      if (!sessionId) {
        // Try to get agency from localStorage or redirect
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
        // Verify checkout session and get agency
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
        setCurrentStep(data.agency.onboarding_step || 1);
        
        // Pre-fill form with existing data
        if (data.agency.logo_url) setLogoUrl(data.agency.logo_url);
        if (data.agency.primary_color) {
          setColors({
            primary: data.agency.primary_color,
            secondary: data.agency.secondary_color || '#1e40af',
            accent: data.agency.accent_color || '#3b82f6',
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

  const [extractingColors, setExtractingColors] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        
        // Auto-extract colors from logo
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
      case 1: // Logo
        // TODO: Upload logo to storage first, then save URL
        stepData = { logo_url: logoPreview || logoUrl };
        break;
      case 2: // Colors
        stepData = {
          primary_color: colors.primary,
          secondary_color: colors.secondary,
          accent_color: colors.accent,
        };
        break;
      case 3: // Pricing
        stepData = {
          price_starter: pricing.starter * 100,
          price_pro: pricing.pro * 100,
          price_growth: pricing.growth * 100,
          limit_starter: pricing.limitStarter,
          limit_pro: pricing.limitPro,
          limit_growth: pricing.limitGrowth,
        };
        break;
      case 4: // Stripe Connect - handled separately
        break;
    }

    const result = await saveStep(currentStep, stepData);
    
    if (result?.success) {
      if (currentStep < 5) {
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
    await saveStep(4, {});
    setCurrentStep(5);
  };

  const handleComplete = () => {
    localStorage.removeItem('onboarding_agency_id');
    router.push('/agency/dashboard');
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-medium">Upload Your Logo</h2>
              <p className="mt-2 text-[#f5f5f0]/50">
                This will appear on your client portal and emails
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative w-40 h-40 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 overflow-hidden">
                {logoPreview || logoUrl ? (
                  <img 
                    src={logoPreview || logoUrl} 
                    alt="Logo preview" 
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <Upload className="w-10 h-10 text-[#f5f5f0]/30" />
                )}
              </div>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors">
                  <Upload className="w-4 h-4" />
                  {logoPreview || logoUrl ? 'Change Logo' : 'Upload Logo'}
                </span>
              </label>

              <p className="text-sm text-[#f5f5f0]/40">
                PNG, JPG or SVG. Recommended size: 400x400px
              </p>

              {/* Color extraction feedback */}
              {extractingColors && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting brand colors...
                </div>
              )}
              
              {(logoPreview || logoUrl) && !extractingColors && (
                <div className="p-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5">
                  <div className="flex items-center gap-2 text-sm text-emerald-400 mb-3">
                    <Sparkles className="w-4 h-4" />
                    Brand colors extracted from your logo
                  </div>
                  <div className="flex gap-2">
                    <div 
                      className="w-10 h-10 rounded-lg border border-white/10" 
                      style={{ backgroundColor: colors.primary }}
                      title="Primary"
                    />
                    <div 
                      className="w-10 h-10 rounded-lg border border-white/10" 
                      style={{ backgroundColor: colors.secondary }}
                      title="Secondary"
                    />
                    <div 
                      className="w-10 h-10 rounded-lg border border-white/10" 
                      style={{ backgroundColor: colors.accent }}
                      title="Accent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-medium">Brand Colors</h2>
              <p className="mt-2 text-[#f5f5f0]/50">
                Customize your client portal appearance
              </p>
            </div>

            {/* Re-extract from logo button */}
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
                  {extractingColors ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Re-extract colors from logo
                </button>
              </div>
            )}

            <div className="grid gap-6 max-w-md mx-auto">
              {[
                { key: 'primary', label: 'Primary Color', desc: 'Main buttons and accents' },
                { key: 'secondary', label: 'Secondary Color', desc: 'Hover states and backgrounds' },
                { key: 'accent', label: 'Accent Color', desc: 'Highlights and links' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={colors[key as keyof typeof colors]}
                      onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                      className="w-14 h-14 rounded-xl border border-white/10 cursor-pointer bg-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-[#f5f5f0]/50">{desc}</p>
                  </div>
                  <input
                    type="text"
                    value={colors[key as keyof typeof colors]}
                    onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                    className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono"
                  />
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="mt-8 p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <p className="text-sm text-[#f5f5f0]/50 mb-4">Preview</p>
              <div className="flex gap-3">
                <button 
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: colors.primary }}
                >
                  Primary Button
                </button>
                <button 
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: colors.secondary }}
                >
                  Secondary
                </button>
                <span 
                  className="px-4 py-2 text-sm font-medium"
                  style={{ color: colors.accent }}
                >
                  Accent Link
                </span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-medium">Set Your Pricing</h2>
              <p className="mt-2 text-[#f5f5f0]/50">
                What you'll charge your clients (you keep 100%)
              </p>
            </div>

            <div className="grid gap-6 max-w-2xl mx-auto">
              {[
                { key: 'starter', label: 'Starter Plan', limitKey: 'limitStarter' },
                { key: 'pro', label: 'Pro Plan', limitKey: 'limitPro' },
                { key: 'growth', label: 'Growth Plan', limitKey: 'limitGrowth' },
              ].map(({ key, label, limitKey }) => (
                <div key={key} className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                  <p className="font-medium mb-4">{label}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#f5f5f0]/50 mb-2">
                        Monthly Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f5f5f0]/50">$</span>
                        <input
                          type="number"
                          value={pricing[key as keyof typeof pricing]}
                          onChange={(e) => setPricing({ ...pricing, [key]: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-4 py-2.5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-[#f5f5f0]/50 mb-2">
                        Monthly Call Limit
                      </label>
                      <input
                        type="number"
                        value={pricing[limitKey as keyof typeof pricing]}
                        onChange={(e) => setPricing({ ...pricing, [limitKey]: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-medium">Connect Stripe</h2>
              <p className="mt-2 text-[#f5f5f0]/50">
                Receive payments directly from your clients
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#635BFF]/20 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-[#635BFF]" />
                  </div>
                  <div>
                    <h3 className="font-medium">Stripe Connect</h3>
                    <p className="mt-1 text-sm text-[#f5f5f0]/50">
                      When your clients pay, the money goes directly to your Stripe account. You keep 100% minus Stripe's standard fees.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStripeConnect}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#635BFF] px-6 py-3.5 text-sm font-medium text-white hover:bg-[#5851ea] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect with Stripe
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={handleSkipConnect}
                className="w-full text-sm text-[#f5f5f0]/50 hover:text-[#f5f5f0]/70 transition-colors"
              >
                Skip for now (you can set this up later)
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-2xl font-medium">You're All Set!</h2>
              <p className="mt-2 text-[#f5f5f0]/50">
                Your agency is ready to start signing up clients
              </p>
            </div>

            <div className="max-w-md mx-auto p-6 rounded-xl border border-white/10 bg-white/[0.02] text-left">
              <h3 className="font-medium mb-3">Next Steps</h3>
              <ul className="space-y-3 text-sm text-[#f5f5f0]/70">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-400/10 flex items-center justify-center flex-shrink-0 text-emerald-400 text-xs font-medium">1</span>
                  Share your signup link with potential clients
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-400/10 flex items-center justify-center flex-shrink-0 text-emerald-400 text-xs font-medium">2</span>
                  Customize your client portal further in settings
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-400/10 flex items-center justify-center flex-shrink-0 text-emerald-400 text-xs font-medium">3</span>
                  Set up a custom domain for your portal
                </li>
              </ul>
            </div>

            <button
              onClick={handleComplete}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5f5f0] px-8 py-3.5 text-sm font-medium text-[#0a0a0a] hover:bg-white transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
    }
  };

  return (
    <>
      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  step.id < currentStep
                    ? 'bg-emerald-400 text-[#0a0a0a]'
                    : step.id === currentStep
                    ? 'bg-white/10 text-[#f5f5f0] ring-2 ring-emerald-400'
                    : 'bg-white/5 text-[#f5f5f0]/30'
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
                  className={`w-12 h-0.5 mx-1 transition-colors ${
                    step.id < currentStep ? 'bg-emerald-400' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-3">
          <p className="text-sm text-[#f5f5f0]/50">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.name}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-center text-red-400">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="max-w-2xl mx-auto">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="mt-12 flex justify-center gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          
          {currentStep < 4 && (
            <button
              onClick={handleNext}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f0] px-6 py-3 text-sm font-medium text-[#0a0a0a] hover:bg-white transition-colors disabled:opacity-50"
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

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      {/* Subtle grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#f5f5f0] blur-lg opacity-20" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f5f0]">
                  <Phone className="h-4 w-4 text-[#0a0a0a]" />
                </div>
              </div>
              <span className="text-lg font-medium tracking-tight">VoiceAI Connect</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-16 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-500/[0.07] to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <Suspense fallback={
            <div className="flex justify-center py-20">
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