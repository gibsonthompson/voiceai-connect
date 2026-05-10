'use client';

// ============================================================================
// GLOBAL ERROR HANDLER — app/global-error.tsx
// Catches errors in the ROOT layout. Required by Next.js App Router.
// Reports to backend which sends SMS alert.
// ============================================================================
import { useEffect } from 'react';

function reportError(error: Error, context: string) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  fetch(`${backendUrl}/api/admin/error-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack?.slice(0, 500),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      component: context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : 'unknown',
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {}); // Fire and forget
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
    reportError(error, 'global-error');
  }, [error]);

  return (
    <html>
      <body style={{ backgroundColor: '#050505', color: '#fafaf9', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ color: 'rgba(250,250,249,0.5)', fontSize: '14px', marginBottom: '24px' }}>
            We've been notified and are looking into it.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#10b981', color: '#050505', border: 'none',
              padding: '12px 24px', borderRadius: '9999px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
