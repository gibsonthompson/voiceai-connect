'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Phone, CheckCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        setError('Invalid session');
        setLoading(false);
        return;
      }

      try {
        // Could verify with backend here
        setLoading(false);
      } catch (err) {
        setError('Something went wrong');
        setLoading(false);
      }
    };

    verifySession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="mt-4 text-[#f5f5f0]/60">Setting up your account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error}</p>
        <Link href="/signup" className="mt-4 text-emerald-400 hover:text-emerald-300 transition-colors">
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Success icon with glow */}
      <div className="relative mx-auto w-fit">
        <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-30" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle className="h-10 w-10 text-emerald-400" />
        </div>
      </div>
      
      <h1 className="mt-8 text-3xl sm:text-4xl font-medium tracking-tight">
        Welcome to VoiceAI Connect! 🎉
      </h1>
      
      <p className="mt-4 text-lg text-[#f5f5f0]/60 max-w-md mx-auto">
        Your agency account has been created. Let&apos;s set up your branding and start acquiring clients.
      </p>

      {/* Trial benefits card */}
      <div className="mt-10 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 max-w-md mx-auto text-left">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="font-medium text-[#f5f5f0]">Your 14-day trial includes:</h3>
        </div>
        <ul className="space-y-3">
          {[
            'Full platform access',
            'White-label branding',
            'Up to 5 test clients',
            'Custom subdomain',
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-[#f5f5f0]/70">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
              </div>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <Link 
          href="/agency/onboarding"
          className="group inline-flex items-center gap-3 rounded-full bg-[#f5f5f0] px-8 py-4 text-base font-medium text-[#0a0a0a] transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
        >
          Complete Setup
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <p className="mt-8 text-sm text-[#f5f5f0]/40">
        Need help? Contact us at{' '}
        <a href="mailto:support@voiceaiconnect.com" className="text-emerald-400 hover:text-emerald-300 transition-colors">
          support@voiceaiconnect.com
        </a>
      </p>
    </div>
  );
}

export default function SignupSuccessPage() {
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
      <main className="relative min-h-screen flex items-center justify-center px-6 py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-emerald-500/[0.1] to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-2xl">
          {/* Progress Indicator */}
          <div className="mb-12 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-2 w-12 rounded-full bg-emerald-400"
              />
            ))}
          </div>

          <Suspense fallback={
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          }>
            <SuccessContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}