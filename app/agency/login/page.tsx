'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';

// Waveform Icon to match branding
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

export default function AgencyLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
      // Call backend directly (not Next.js API route)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/auth/agency/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      console.log('FULL API RESPONSE:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Store auth in localStorage (CRITICAL for dashboard auth)
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      if (data.agency) {
        localStorage.setItem('agency', JSON.stringify(data.agency));
      }

      // Also set cookie as backup
      if (data.token) {
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: data.token }),
        });
      }

      router.push('/agency/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      {/* Grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                <WaveformIcon className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-base font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>
            <Link 
              href="/signup" 
              className="text-sm text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors"
            >
              Don&apos;t have an account? <span className="text-emerald-400">Sign up</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-32">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/[0.03] rounded-full blur-[100px]" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
              <p className="mt-2 text-[#fafaf9]/50">
                Sign in to your agency dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 focus:ring-offset-transparent"
                  />
                  <span className="text-sm text-[#fafaf9]/50 group-hover:text-[#fafaf9]/70 transition-colors">Remember me</span>
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-[#fafaf9]/50 hover:text-emerald-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-base font-medium text-[#050505] transition-all duration-200 hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#050505] px-4 text-[#fafaf9]/40">New to VoiceAI Connect?</span>
              </div>
            </div>

            <Link
              href="/signup"
              className="block w-full text-center rounded-full border border-white/[0.08] bg-white/[0.05] px-6 py-3.5 text-base font-medium text-[#fafaf9] transition-all duration-200 hover:bg-white/[0.1] hover:border-white/[0.12]"
            >
              Create an Agency Account
            </Link>
          </div>

          {/* Footer text */}
          <p className="mt-8 text-center text-sm text-[#fafaf9]/30">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-[#fafaf9]/50 hover:text-emerald-400 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#fafaf9]/50 hover:text-emerald-400 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}