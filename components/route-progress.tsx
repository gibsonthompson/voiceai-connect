'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global navigation progress bar for the public/marketing site.
 *
 * The App Router blocks on client-side navigations to dynamic routes that have
 * no loading.js (e.g. Start Trial -> /signup): the old page stays frozen with
 * no feedback, then hard-swaps. This bar starts on the link click and completes
 * when the new route commits, so there is a continuous signal instead of a
 * dead hang followed by a jump.
 *
 * Scoped OUT of the authenticated app shell (/agency, /client, /admin,
 * /platform), which does intentional instant, no-transition navigation.
 */
const APP_SHELL = /^\/(agency|client|admin|platform)(\/|$)/;

export default function RouteProgress() {
  const pathname = usePathname();
  const isAppShell = APP_SHELL.test(pathname || '');

  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const firstRun = useRef(true);

  const clear = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
  };

  const start = () => {
    clear();
    setVisible(true);
    setWidth(8);
    trickle.current = setInterval(() => {
      setWidth((w) => (w < 90 ? w + (90 - w) * 0.08 : w));
    }, 200);
    // Safety net: never let the bar hang if a navigation is cancelled.
    timers.current.push(setTimeout(() => finish(), 10000));
  };

  const finish = () => {
    clear();
    setWidth(100);
    timers.current.push(setTimeout(() => setVisible(false), 220));
    timers.current.push(setTimeout(() => setWidth(0), 460));
  };

  // Start the bar the moment an internal link is clicked (capture phase, before
  // Next intercepts the navigation).
  useEffect(() => {
    if (isAppShell) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as Element | null;
      const a = target?.closest?.('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      if (a.getAttribute('target') === '_blank' || a.hasAttribute('download')) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [isAppShell]);

  // Complete when the route actually commits (pathname changes).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    finish();
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => () => clear(), []);

  if (isAppShell || !visible) return null;

  return (
    <div
      aria-hidden
      style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2.5, zIndex: 2147483647, pointerEvents: 'none' }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, #059669, #34d399)',
          boxShadow: '0 0 8px rgba(52,211,153,0.7), 0 0 4px rgba(52,211,153,0.5)',
          borderTopRightRadius: 2,
          borderBottomRightRadius: 2,
          transition: 'width 0.2s ease, opacity 0.25s ease',
          opacity: width >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}