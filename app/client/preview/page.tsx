'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Base64url + UTF-8 safe JWT payload decode. The previous version used
// atob(token.split('.')[1]) directly, which assumes standard base64. JWT
// segments are base64url (- and _ instead of + and /, and no = padding), so
// atob throws or mis-decodes whenever the payload encodes to a segment that
// contains those characters. That silently broke the preview. This normalizes
// the alphabet, restores padding, and decodes as UTF-8 before JSON.parse.
function decodeJwtPayload(token: string): any {
  const segment = token.split('.')[1];
  if (!segment) throw new Error('Malformed token');
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const json = new TextDecoder('utf-8').decode(bytes);
  return JSON.parse(json);
}

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
      // Back up current agency auth so we can restore it later. (When an admin
      // opens this, auth_token is empty because admin uses admin_token, so there
      // is simply nothing to back up and the admin session is untouched.)
      const currentToken = localStorage.getItem('auth_token');
      const currentAgency = localStorage.getItem('agency');
      const currentUser = localStorage.getItem('user');
      const currentClient = localStorage.getItem('client');

      if (currentToken) localStorage.setItem('agency_auth_backup', currentToken);
      if (currentAgency) localStorage.setItem('agency_data_backup', currentAgency);
      if (currentUser) localStorage.setItem('agency_user_backup', currentUser);
      if (currentClient) localStorage.setItem('agency_client_backup', currentClient);

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

      // Decode the token to get clientId + userId (base64url-safe).
      let payload: any;
      try {
        payload = decodeJwtPayload(token);
      } catch (decodeErr) {
        console.error('Preview token decode failed:', decodeErr);
        setError('Invalid preview token');
        return;
      }

      const clientId = payload.clientId;
      if (!clientId) {
        setError('Invalid preview token');
        return;
      }

      // Fetch full client data. The token itself is the credential.
      fetch(`${backendUrl}/api/client/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to load client data');
          return res.json();
        })
        .then(data => {
          const clientRecord = data.client || data;
          // Set client auth in localStorage.
          localStorage.setItem('auth_token', token);
          localStorage.setItem('client', JSON.stringify(clientRecord));
          localStorage.setItem('user', JSON.stringify({
            id: payload.userId,
            email: clientRecord?.email,
            role: 'client',
            client_id: clientId,
          }));
          localStorage.setItem('preview_mode', 'true');

          // Redirect to client dashboard.
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