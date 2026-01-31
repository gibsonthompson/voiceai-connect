'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function GoogleSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    const passwordToken = searchParams.get('passwordToken');
    const agencyId = searchParams.get('agencyId');
    const redirect = searchParams.get('redirect') || '/agency/dashboard';

    if (token) {
      // Store auth token
      localStorage.setItem('auth_token', token);
      
      // Store password token if provided (for optional password setup later)
      if (passwordToken) {
        localStorage.setItem('agency_password_token', passwordToken);
      }
      
      // Store agency ID for onboarding
      if (agencyId) {
        localStorage.setItem('onboarding_agency_id', agencyId);
      }
      
      // Redirect to specified page
      router.push(redirect);
    } else {
      // No token - redirect to signup with error
      router.push('/signup?error=no_token');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
        <p className="mt-4 text-sm text-[#fafaf9]/60">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function GoogleSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    }>
      <GoogleSuccessContent />
    </Suspense>
  );
}