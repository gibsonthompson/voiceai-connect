'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Wraps every page so client-side navigations cross-fade in instead of hard
 * cutting. template.tsx (unlike layout.tsx) re-mounts on every navigation,
 * which is what lets us animate each arrival.
 *
 * Notes on the two deliberate constraints:
 *  - Opacity ONLY, never transform/filter. The marketing nav is position:fixed
 *    and lives inside this wrapper; a transform/filter on an ancestor would
 *    re-anchor it and cause the exact jump we are trying to remove. Opacity
 *    does not establish a containing block for fixed descendants, so it is safe.
 *  - Skipped on the authenticated app shell (/agency, /client, /admin,
 *    /platform), which does intentional instant, no-flash navigation. Those
 *    routes render children with no wrapper at all, so their layout is untouched.
 *  - Skipped on the very first paint of the session (LCP), so initial load is
 *    not delayed by a fade.
 */
const APP_SHELL = /^\/(agency|client|admin|platform)(\/|$)/;

// Module scope: false on the first paint, true for every navigation after.
let hasNavigated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppShell = APP_SHELL.test(pathname || '');
  const animate = hasNavigated && !isAppShell;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hasNavigated = true;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !animate) return;
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      el.style.opacity = '1';
      return;
    }
    const anim = el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 240,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    });
    return () => {
      try {
        anim.cancel();
      } catch {
        /* no-op */
      }
    };
  }, [animate, pathname]);

  if (isAppShell) return <>{children}</>;

  return (
    <div ref={ref} style={{ opacity: animate ? 0 : 1 }}>
      {children}
    </div>
  );
}