'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';

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

// Google icon
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function AgencyLoginPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('auth_token');
    const agency = localStorage.getItem('agency');
    if (token && agency) {
      window.location.href = '/agency/dashboard';
      return;
    }

    // Check for error params (from Google OAuth redirect)
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'google_auth_failed': 'Google sign in failed. Please try again.',
        'no_code': 'Google sign in was cancelled.',
        'no_email': 'Could not get email from Google.',
        'account_exists': 'An account with this email already exists.',
      };
      setError(errorMessages[errorParam] || 'Something went wrong.');
      
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }

    setPageLoading(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/auth/agency/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Invalid credentials');
      }

      if (!data.token) {
        throw new Error('No token received from server');
      }

      // Store everything in localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.agency) {
        localStorage.setItem('agency', JSON.stringify(data.agency));
      }

      console.log('Login successful, redirecting...');
      
      // Use window.location.href for FULL page reload (matches client login)
      window.location.href = '/agency/dashboard';
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

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
              <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                <WaveformIcon className="h-5 w-5 text-[#fafaf9]" />
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

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white px-6 py-3.5 text-base font-medium text-gray-800 hover:bg-gray-50 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 mb-6"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#050505] px-3 text-[#fafaf9]/40">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#fafaf9]/30" />
                  <input
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] pl-11 pr-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#fafaf9]/70 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#fafaf9]/30" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] pl-11 pr-12 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#fafaf9]/40 hover:text-[#fafaf9]/70"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
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
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
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
                disabled={loading || googleLoading}
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