'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export interface TourStep {
  id: string;
  route: string | null;                 // navigate here if not already on it; null = stay
  target: string | null;                // data-tour anchor; null = centered card
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  title: string;
  body: string;
}

interface TourCtx {
  active: boolean;
  stepIndex: number;
  steps: TourStep[];
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
}

const Ctx = createContext<TourCtx | null>(null);
export const useTour = () => useContext(Ctx);

// Auto-open stops once the tour has been dismissed this many times. The agency
// can still launch it manually from the sidebar afterward.
const DISMISS_CAP = 2;

function backendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
}
function authToken() {
  try { return localStorage.getItem('auth_token'); } catch { return null; }
}

// Holds tour state above the pages so it survives route changes. When a step's
// route differs from the current path it navigates there; the overlay then waits
// for the target element on the new page.
//
// Whether the tour AUTO-OPENS is decided by server-persisted state on the agency
// (dismiss count + completed), NOT localStorage: logout clears localStorage, so
// a localStorage-only cap reset on every login and the tour kept reappearing
// forever. The server state survives logout and syncs across devices. Once the
// agency has dismissed it DISMISS_CAP times (or completed it), it never
// auto-opens again. localStorage is still used, but only to resume an
// in-progress tour across a refresh within the same session.
export function TourProvider({ steps, storageKey, agencyId, autoStart = true, children }: {
  steps: TourStep[]; storageKey: string; agencyId?: string | null; autoStart?: boolean; children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const lsKey = `vac_tour_${storageKey}`;
  const stepRef = useRef(0);
  useEffect(() => { stepRef.current = stepIndex; }, [stepIndex]);

  // localStorage holds only the in-progress position so a refresh resumes; the
  // auto-open decision lives on the server (see report/hydrate below).
  const persistLocal = useCallback((a: boolean, i: number, completed: boolean) => {
    try { localStorage.setItem(lsKey, JSON.stringify({ active: a, stepIndex: i, completed })); } catch {}
  }, [lsKey]);

  // Record a dismissal or completion on the agency record (best effort,
  // keepalive so it still sends if the tab is closing).
  const report = useCallback((body: { dismissed?: boolean; completed?: boolean }) => {
    if (!agencyId) return;
    try {
      fetch(`${backendUrl()}/api/agency/${agencyId}/tour-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [agencyId]);

  // Decide whether to auto-open. Resume an in-progress tour from localStorage
  // right away; otherwise ask the server whether this agency has already
  // dismissed/completed the tour and only auto-open on the dashboard if not.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    let saved: any = null;
    try { const raw = localStorage.getItem(lsKey); if (raw) saved = JSON.parse(raw); } catch {}
    // Mid-tour refresh: resume exactly where they were.
    if (saved && saved.active && typeof saved.stepIndex === 'number') {
      setActive(true);
      setStepIndex(Math.min(saved.stepIndex, Math.max(0, steps.length - 1)));
      setHydrated(true);
      return;
    }
    // Completed in this session already: don't reopen.
    if (saved && saved.completed) { setHydrated(true); return; }

    const onDashboard = pathname === '/agency/dashboard' || pathname === '/agency';
    if (!autoStart || steps.length === 0 || !onDashboard || !agencyId) { setHydrated(true); return; }

    (async () => {
      let dismissCount = 0;
      let completed = false;
      let ok = false;
      try {
        const r = await fetch(`${backendUrl()}/api/agency/${agencyId}/tour-state`, { headers: { Authorization: `Bearer ${authToken()}` } });
        if (r.ok) { const d = await r.json(); dismissCount = d.dismiss_count || 0; completed = d.completed === true; ok = true; }
      } catch { /* ok stays false */ }
      if (cancelled) return;
      setHydrated(true);
      // Fail closed: only auto-open when the server confirmed the agency has not
      // yet hit the cap or completed it. A failed lookup never pops the tour.
      if (!ok || completed || dismissCount >= DISMISS_CAP) return;
      timer = setTimeout(() => { if (!cancelled) { setActive(true); setStepIndex(0); persistLocal(true, 0, false); } }, 1400);
    })();

    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to the active step's route when needed.
  useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (step && step.route && pathname !== step.route) router.push(step.route);
  }, [active, stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    setActive(true); setStepIndex(0); persistLocal(true, 0, false);
    const first = steps[0];
    if (first && first.route && pathname !== first.route) router.push(first.route);
  }, [steps, pathname, persistLocal, router]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) { setActive(false); persistLocal(false, i, true); report({ completed: true }); return i; }
      persistLocal(true, i + 1, false);
      return i + 1;
    });
  }, [steps.length, persistLocal, report]);

  const prev = useCallback(() => {
    setStepIndex((i) => { const n = Math.max(0, i - 1); persistLocal(true, n, false); return n; });
  }, [persistLocal]);

  const skip = useCallback(() => {
    setActive(false);
    persistLocal(false, stepRef.current, false);
    // Count the dismissal on the server so the cap holds across logins/devices.
    report({ dismissed: true });
  }, [persistLocal, report]);

  return (
    <Ctx.Provider value={{ active: active && hydrated, stepIndex, steps, start, next, prev, skip }}>
      {children}
    </Ctx.Provider>
  );
}
