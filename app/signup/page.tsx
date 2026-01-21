'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, ArrowRight, Loader2, Check } from 'lucide-react';

export default function AgencySignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    agencyName: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/agency/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      router.push(`/signup/plan?agency=${data.agencyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
            <Link 
              href="/agency/login" 
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
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-emerald-500/[0.07] to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-md">
          {/* Progress Indicator */}
          <div className="mb-8 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`h-2 w-12 rounded-full transition-colors ${
                    s === 1 ? 'bg-emerald-400' : 'bg-white/10'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-[#111] p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-medium tracking-tight">Create Your Agency</h1>
              <p className="mt-2 text-[#f5f5f0]/50">
                Start your 14-day free trial. No credit card required.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                  Agency Name
                </label>
                <input
                  name="agencyName"
                  type="text"
                  placeholder="SmartCall Solutions"
                  value={formData.agencyName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
              </div>
              
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
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
                <p className="mt-1.5 text-xs text-[#f5f5f0]/40">At least 8 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#f5f5f0]/70 mb-2">
                  Phone Number <span className="text-[#f5f5f0]/30">(optional)</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f5f5f0] px-6 py-3.5 text-base font-medium text-[#0a0a0a] transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Continue
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
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6">
            <h3 className="font-medium text-[#f5f5f0]">What you get with your free trial:</h3>
            <ul className="mt-4 space-y-3">
              {[
                'Full platform access for 14 days',
                'White-label branding',
                'Up to 5 test clients',
                'No credit card required',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#f5f5f0]/70">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10">
                    <Check className="h-3 w-3 text-emerald-400" />
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