'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function PreviewContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No preview token provided');
      return;
    }

    try {
      // Back up current agency auth so we can restore it later
      const currentToken = localStorage.getItem('auth_token');
      const currentAgency = localStorage.getItem('agency');
      const currentUser = localStorage.getItem('user');
      const currentClient = localStorage.getItem('client');

      if (currentToken) localStorage.setItem('agency_auth_backup', currentToken);
      if (currentAgency) localStorage.setItem('agency_data_backup', currentAgency);
      if (currentUser) localStorage.setItem('agency_user_backup', currentUser);
      if (currentClient) localStorage.setItem('agency_client_backup', currentClient);

      // Fetch client data using the preview token
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

      // Decode token to get clientId (JWT payload is base64)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const clientId = payload.clientId;

      if (!clientId) {
        setError('Invalid preview token');
        return;
      }

      // Fetch full client data
      fetch(`${backendUrl}/api/client/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to load client data');
          return res.json();
        })
        .then(data => {
          // Set client auth in localStorage
          localStorage.setItem('auth_token', token);
          localStorage.setItem('client', JSON.stringify(data.client));
          localStorage.setItem('user', JSON.stringify({
            id: payload.userId,
            email: data.client.email,
            role: 'client',
            client_id: clientId,
          }));
          localStorage.setItem('preview_mode', 'true');

          // Redirect to client dashboard
          window.location.href = '/client/dashboard';
        })
        .catch(err => {
          console.error('Preview setup failed:', err);
          setError('Failed to load client dashboard. The preview token may have expired.');
        });
    } catch (err) {
      console.error('Preview error:', err);
      setError('Something went wrong setting up the preview.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f9fafb' }}>
        <div className="text-center max-w-sm">
          <p className="text-sm font-medium text-red-600 mb-2">{error}</p>
          <a href="/agency/dashboard" className="text-sm text-blue-600 underline">Return to Agency Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: '#9ca3af' }} />
        <p className="text-sm" style={{ color: '#6b7280' }}>Loading client dashboard preview...</p>
      </div>
    </div>
  );
}

export default function ClientPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9ca3af' }} />
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}