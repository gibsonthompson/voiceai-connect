'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Loader2, ArrowRight } from 'lucide-react';

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
      const response = await fetch('/api/auth/agency-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Set auth cookie (server components read from cookies, not localStorage)
      if (data.token) {
        document.cookie = `auth_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      }

      router.push('/agency/dashboard');
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
              href="/signup" 
              className="text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors"
            >
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen flex items-center justify-center px-6 py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-[#f5f5f0]/[0.03] to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-[#111] p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-medium tracking-tight">Welcome Back</h1>
              <p className="mt-2 text-[#f5f5f0]/50">
                Sign in to your agency dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-400 focus:ring-emerald-400/50 focus:ring-offset-0"
                  />
                  <span className="text-sm text-[#f5f5f0]/60">Remember me</span>
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors"
                >
                  Forgot password?
                </Link>
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
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#111] px-4 text-[#f5f5f0]/40">New to VoiceAI Connect?</span>
              </div>
            </div>

            <Link
              href="/signup"
              className="block w-full text-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-base font-medium text-[#f5f5f0] transition-all hover:bg-white/10"
            >
              Create an Agency Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}