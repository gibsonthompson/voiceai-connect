'use client';

// ============================================================================
// PAGE ERROR BOUNDARY — app/error.tsx
// Catches errors within page components (not root layout — that's global-error).
// Reports to backend for SMS alert.
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
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
    reportError(error, 'page-error');
  }, [error]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Something went wrong</h2>
        <p style={{ color: 'rgba(250,250,249,0.5)', fontSize: '13px', marginBottom: '20px' }}>
          We've been notified and are looking into it.
        </p>
        <button
          onClick={reset}
          style={{
            backgroundColor: '#10b981', color: '#050505', border: 'none',
            padding: '10px 20px', borderRadius: '9999px', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
