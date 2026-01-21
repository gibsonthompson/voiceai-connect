'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Phone, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verify the session and set up the agency
    const verifySession = async () => {
      if (!sessionId) {
        setError('Invalid session');
        setLoading(false);
        return;
      }

      try {
        // Could verify with backend here
        // For now, just show success
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600">Setting up your account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
        <Link href="/signup" className="mt-4 text-blue-600 hover:underline">
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <h1 className="mt-6 text-3xl font-bold text-gray-900">
        Welcome to VoiceAI Connect! 🎉
      </h1>
      
      <p className="mt-4 text-lg text-gray-600 max-w-md mx-auto">
        Your agency account has been created. Let&apos;s set up your branding and start acquiring clients.
      </p>

      <div className="mt-8 rounded-xl bg-blue-50 border border-blue-200 p-6 max-w-md mx-auto text-left">
        <h3 className="font-semibold text-gray-900">Your 14-day trial includes:</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            Full platform access
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            White-label branding
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            Up to 5 test clients
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            Custom subdomain
          </li>
        </ul>
      </div>

      <div className="mt-8">
        <Link href="/agency/onboarding">
          <Button size="lg">
            Complete Setup
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Need help? Contact us at{' '}
        <a href="mailto:support@voiceaiconnect.com" className="text-blue-600 hover:underline">
          support@voiceaiconnect.com
        </a>
      </p>
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">VoiceAI Connect</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-16">
        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-2 w-16 rounded-full bg-blue-600"
            />
          ))}
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  );
}
