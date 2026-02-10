'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function GoogleSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const passwordToken = searchParams.get('passwordToken');
      const agencyId = searchParams.get('agencyId');
      const redirect = searchParams.get('redirect') || '/agency/dashboard';

      if (!token) {
        router.push('/signup?error=no_token');
        return;
      }

      // IMPORTANT: Clear ALL old auth/agency data first to prevent wrong agency bug
      localStorage.removeItem('auth_token');
      localStorage.removeItem('agency_password_token');
      localStorage.removeItem('onboarding_agency_id');
      localStorage.removeItem('user');
      localStorage.removeItem('agency');
      localStorage.removeItem('client');
      
      // Now store fresh data
      localStorage.setItem('auth_token', token);
      
      // Store password token if provided (for optional password setup later)
      if (passwordToken) {
        localStorage.setItem('agency_password_token', passwordToken);
      }
      
      // Store agency ID for onboarding
      if (agencyId) {
        localStorage.setItem('onboarding_agency_id', agencyId);
      }

      // Fetch user and agency data so login page doesn't loop
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const verifyRes = await fetch(`${backendUrl}/api/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ token }),
        });

        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          
          if (verifyData.user) {
            localStorage.setItem('user', JSON.stringify(verifyData.user));
          }

          // Fetch agency settings if we have an agency ID
          const resolvedAgencyId = agencyId || verifyData.user?.agency_id;
          if (resolvedAgencyId) {
            const agencyRes = await fetch(`${backendUrl}/api/agency/${resolvedAgencyId}/settings`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });

            if (agencyRes.ok) {
              const agencyData = await agencyRes.json();
              const agency = agencyData.agency || agencyData;
              localStorage.setItem('agency', JSON.stringify(agency));
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user/agency data (non-blocking):', err);
        // Non-blocking — the dashboard context will fetch it anyway
      }

      // Redirect to specified page
      window.location.href = redirect;
    };

    handleAuth();
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