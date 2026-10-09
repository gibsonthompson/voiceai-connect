'use client';

// ============================================================================
// app/live/[clientId]/page.tsx
//
// The clean, no-nav, full-screen stage for the live call demo / monitor. It
// deliberately lives OUTSIDE app/agency, so none of the agency dashboard chrome
// (sidebar, nav, other clients) renders here. That makes it safe to screenshare
// to a prospect or drop next to a video call: all they see is the branded live
// call console.
//
//   /live/<clientId>              -> demo mode (talk to the AI in the browser)
//   /live/<clientId>?mode=monitor -> monitor a real phone call in progress
// ============================================================================

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import LiveCallMonitor from '@/components/live/LiveCallMonitor';

function LiveInner() {
  const params = useParams();
  const search = useSearchParams();
  const clientId = (params?.clientId as string) || '';
  const mode = search.get('mode') === 'monitor' ? 'monitor' : 'demo';

  if (!clientId) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0b0f] text-white/60 text-sm">
        No client selected.
      </div>
    );
  }
  return <LiveCallMonitor clientId={clientId} mode={mode} />;
}

export default function LiveCallPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#0a0b0f]" />}>
      <LiveInner />
    </Suspense>
  );
}
