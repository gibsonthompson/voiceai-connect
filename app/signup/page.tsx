'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, ArrowRight, Loader2, Check, Building, Mail, User, MapPin } from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  price_starter: number;
  price_pro: number;
  price_growth: number;
  limit_starter: number;
  limit_pro: number;
  limit_growth: number;
}

export default function ClientSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agencySlug = searchParams.get('agency');
  
  const [loading, setLoading] = useState(false);
  const [agencyLoading, setAgencyLoading] = useState(true);
  const [error, setError] = useState('');
  const [agency, setAgency] = useState<Agency | null>(null);
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    state: '',
    industry: 'general',
  });

  // Fetch agency info
  useEffect(() => {
    const fetchAgency = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        let url = '';
        
        // Check if we have an agency slug in the URL params
        if (agencySlug) {
          url = `${backendUrl}/api/agency/by-host?host=${agencySlug}.voiceaiconnect.com`;
        } else {
          // Use current host (for subdomain or custom domain)
          const host = window.location.host;
          url = `${backendUrl}/api/agency/by-host?host=${host}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Agency not found');
        }
        
        const data = await response.json();
        setAgency(data.agency);
      } catch (err) {
        console.error('Failed to fetch agency:', err);
        setError('Unable to load agency information. Please check the URL.');
      } finally {
        setAgencyLoading(false);
      }
    };

    fetchAgency();
  }, [agencySlug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;
    
    setLoading(true);
    setError('');

    try {
      // Store form data in sessionStorage for the plan selection page
      sessionStorage.setItem('client_signup_data', JSON.stringify({
        ...formData,
        agency_id: agency.id,
        agency_slug: agency.slug,
      }));

      router.push(`/client/signup/plan${agencySlug ? `?agency=${agencySlug}` : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  // Helper functions for colors
  const isLightColor = (hex: string): boolean => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
  };

  const primaryColor = agency?.primary_color || '#2563eb';
  const accentColor = agency?.accent_color || '#3b82f6';
  const primaryLight = isLightColor(primaryColor);

  if (agencyLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-2">Agency Not Found</h1>
          <p className="text-white/50">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-3">
              {agency.logo_url ? (
                <img src={agency.logo_url} alt={agency.name} className="h-9 w-9 rounded-lg object-contain" />
              ) : (
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Phone className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
                </div>
              )}
              <span className="text-lg font-medium tracking-tight">{agency.name}</span>
            </div>
            <Link 
              href={`/client/login${agencySlug ? `?agency=${agencySlug}` : ''}`}
              className="text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-16 px-6">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-[0.07]"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        <div className="relative mx-auto max-w-lg">
          {/* Progress Indicator */}
          <div className="mb-8 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className="h-2 w-12 rounded-full transition-colors"
                  style={{ backgroundColor: s === 1 ? primaryColor : 'rgba(255,255,255,0.1)' }}
                />
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-[#111] p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-medium tracking-tight">Get Your AI Receptionist</h1>
              <p className="mt-2 text-[#f5f5f0]/50">
                Start your free trial with {agency.name}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                  Business Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#f5f5f0]/30" />
                  <input
                    name="businessName"
                    type="text"
                    placeholder="Acme Plumbing Services"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#f5f5f0]/30" />
                  <input
                    name="ownerName"
                    type="text"
                    placeholder="John Smith"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>
              
              {/* Email & Phone Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#f5f5f0]/30" />
                    <input
                      name="email"
                      type="email"
                      placeholder="you@business.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#f5f5f0]/30" />
                    <input
                      name="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:outline-none focus:border-white/20 transition-colors"
                />
                <p className="mt-1.5 text-xs text-[#f5f5f0]/40">At least 6 characters</p>
              </div>

              {/* Location Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#f5f5f0]/30" />
                    <input
                      name="city"
                      type="text"
                      placeholder="Atlanta"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                    State
                  </label>
                  <input
                    name="state"
                    type="text"
                    placeholder="GA"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    maxLength={2}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:outline-none focus:border-white/20 transition-colors uppercase"
                  />
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                  Industry
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#f5f5f0] focus:outline-none focus:border-white/20 transition-colors"
                >
                  <option value="general">General Business</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="hvac">HVAC</option>
                  <option value="electrical">Electrical</option>
                  <option value="roofing">Roofing</option>
                  <option value="landscaping">Landscaping</option>
                  <option value="cleaning">Cleaning Services</option>
                  <option value="automotive">Automotive</option>
                  <option value="medical">Medical/Dental</option>
                  <option value="legal">Legal Services</option>
                  <option value="realestate">Real Estate</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="salon">Salon/Spa</option>
                  <option value="fitness">Fitness</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ 
                  backgroundColor: primaryColor,
                  color: primaryLight ? '#0a0a0a' : '#f5f5f0',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    Continue to Plans
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#f5f5f0]/40">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Benefits */}
          <div 
            className="mt-8 rounded-2xl border p-6"
            style={{ 
              borderColor: `${accentColor}33`,
              backgroundColor: `${accentColor}0D`,
            }}
          >
            <h3 className="font-medium text-[#f5f5f0]">What you&apos;ll get:</h3>
            <ul className="mt-4 space-y-3">
              {[
                'AI receptionist that answers 24/7',
                'Professional call handling',
                'Instant SMS notifications',
                'Detailed call summaries',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#f5f5f0]/70">
                  <div 
                    className="flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${accentColor}1A` }}
                  >
                    <Check className="h-3 w-3" style={{ color: accentColor }} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}