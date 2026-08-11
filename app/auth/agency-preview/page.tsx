'use client';

// ============================================================================
// AGENCY LOGIN-AS INGESTION  (/auth/agency-preview)
// Consumes an admin-minted agency-owner token from ?token=, establishes a real
// agency-owner session, and hands off to the agency dashboard. This is the
// agency-side equivalent of /client/preview, and it mirrors what
// /auth/google-success already does for Google logins: store auth_token, verify
// it, store the user, fetch and store the agency, then redirect. Lives under
// /auth/ so it renders standalone (like /auth/set-password), independent of the
// agency layout.
// ============================================================================

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AgencyPreviewContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No login token provided');
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

    (async () => {
      try {
        // 1. Store the token as the active session credential.
        localStorage.setItem('auth_token', token);

        // 2. Verify it and get the user (this is the same check the agency
        //    context runs on bootstrap, so passing here means the dashboard
        //    will accept the session).
        const verifyRes = await fetch(`${backendUrl}/api/auth/verify`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!verifyRes.ok) throw new Error('verify failed');
        const verifyData = await verifyRes.json();
        if (!verifyData?.valid || !verifyData.user) throw new Error('invalid token');

        const user = verifyData.user;
        localStorage.setItem('user', JSON.stringify(user));

        const agencyId = user.agency_id;
        if (!agencyId) throw new Error('token is not an agency session');

        // 3. Fetch the agency so the dashboard has it immediately (the settings
        //    route returns the full agency payload to an owner-scoped token).
        const settingsRes = await fetch(`${backendUrl}/api/agency/${agencyId}/settings`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData?.agency) {
            localStorage.setItem('agency', JSON.stringify(settingsData.agency));
          }
        }

        // 4. Into the agency dashboard as the owner.
        window.location.href = '/agency/dashboard';
      } catch (err) {
        console.error('Agency login-as setup failed:', err);
        setError('Could not open this agency. The login token may have expired.');
      }
    })();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="text-center max-w-sm">
          <p className="text-sm font-medium text-red-600 mb-2">{error}</p>
          <a href="/admin/agencies" className="text-sm text-blue-600 underline">Return to Admin</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: '#9ca3af' }} />
        <p className="text-sm" style={{ color: '#6b7280' }}>Opening agency dashboard...</p>
      </div>
    </div>
  );
}

export default function AgencyPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9ca3af' }} />
      </div>
    }>
      <AgencyPreviewContent />
    </Suspense>
  );
}