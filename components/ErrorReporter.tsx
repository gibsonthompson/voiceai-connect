'use client';

// ============================================================================
// ERROR REPORTER — components/ErrorReporter.tsx
// Drop into your root layout to catch:
//   - window.onerror (uncaught JS errors)
//   - unhandledrejection (unhandled promise rejections)
//
// Usage in app/layout.tsx:
//   import ErrorReporter from '@/components/ErrorReporter';
//   // Add inside <body>: <ErrorReporter />
// ============================================================================
import { useEffect } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const reported = new Set<string>(); // Dedup within session

function report(message: string, stack?: string, context?: string) {
  const key = `${message}:${context}`;
  if (reported.has(key)) return;
  reported.add(key);

  fetch(`${BACKEND_URL}/api/admin/error-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      stack: stack?.slice(0, 500),
      url: window.location.href,
      component: context || 'window',
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});
}

export default function ErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      report(
        event.message || 'Unknown error',
        event.error?.stack,
        `window:${event.filename}:${event.lineno}`
      );
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      report(
        err?.message || String(err) || 'Unhandled rejection',
        err?.stack,
        'unhandled-rejection'
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null; // Renders nothing — just installs listeners
}
