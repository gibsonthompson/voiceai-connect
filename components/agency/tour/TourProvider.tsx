'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

// Holds tour state above the pages so it survives route changes. When a step's
// route differs from the current path it navigates there; the overlay then waits
// for the target element on the new page. State persists per agency in
// localStorage so a refresh or tab-close resumes where they left off.
export function TourProvider({ steps, storageKey, autoStart = true, children }: {
  steps: TourStep[]; storageKey: string; autoStart?: boolean; children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const lsKey = `vac_tour_${storageKey}`;

  const persist = useCallback((a: boolean, i: number, completed: boolean) => {
    try { localStorage.setItem(lsKey, JSON.stringify({ active: a, stepIndex: i, completed })); } catch {}
  }, [lsKey]);

  // Hydrate from storage; resume an in-progress tour, or first-run auto-start
  // (only when landing on the dashboard, so a deep link doesn't trigger it).
  useEffect(() => {
    let saved: any = null;
    try { const raw = localStorage.getItem(lsKey); if (raw) saved = JSON.parse(raw); } catch {}
    if (saved && saved.active && typeof saved.stepIndex === 'number') {
      setActive(true);
      setStepIndex(Math.min(saved.stepIndex, Math.max(0, steps.length - 1)));
      setHydrated(true);
      return;
    }
    if (autoStart && steps.length > 0 && !(saved && saved.completed) && (pathname === '/agency/dashboard' || pathname === '/agency')) {
      const t = setTimeout(() => { setActive(true); setStepIndex(0); persist(true, 0, false); }, 1400);
      setHydrated(true);
      return () => clearTimeout(t);
    }
    setHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to the active step's route when needed.
  useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (step && step.route && pathname !== step.route) router.push(step.route);
  }, [active, stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    setActive(true); setStepIndex(0); persist(true, 0, false);
    const first = steps[0];
    if (first && first.route && pathname !== first.route) router.push(first.route);
  }, [steps, pathname, persist, router]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) { setActive(false); persist(false, i, true); return i; }
      persist(true, i + 1, false);
      return i + 1;
    });
  }, [steps.length, persist]);

  const prev = useCallback(() => {
    setStepIndex((i) => { const n = Math.max(0, i - 1); persist(true, n, false); return n; });
  }, [persist]);

  const skip = useCallback(() => { setActive(false); persist(false, stepIndex, true); }, [persist, stepIndex]);

  return (
    <Ctx.Provider value={{ active: active && hydrated, stepIndex, steps, start, next, prev, skip }}>
      {children}
    </Ctx.Provider>
  );
}
