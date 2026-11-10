'use client';

// ============================================================================
// PwaUpdater - keeps the installed (home-screen) PWA from getting stuck on an
// old version. iOS caches the app shell and won't pick up a new deploy until the
// app is deleted and re-added. This checks the server's current build id against
// the one baked into the running bundle and, when a newer build has shipped,
// does a cache-busting reload so the fresh version loads, no reinstall.
//
// It only checks on load and when the app is brought back to the foreground (not
// on a timer), so it never yanks someone out of work mid-task; it refreshes at
// the natural moment, when you reopen the app.
// ============================================================================

import { useEffect } from 'react';

const BUILD = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';

export default function PwaUpdater() {
  useEffect(() => {
    let checking = false;

    const check = async () => {
      if (checking || typeof window === 'undefined') return;
      checking = true;
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const serverBuild = data && data.build;
        if (!serverBuild || serverBuild === BUILD) return;

        // A newer build is live. Guard against reload loops within this session,
        // then reload with a cache-busting param so iOS fetches the fresh shell.
        const key = `pwa_reloaded_${serverBuild}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
        const url = new URL(window.location.href);
        url.searchParams.set('__v', serverBuild);
        window.location.replace(url.toString());
      } catch {
        /* offline or transient; try again next foreground */
      } finally {
        checking = false;
      }
    };

    check();
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
      window.removeEventListener('pageshow', check);
    };
  }, []);

  return null;
}
