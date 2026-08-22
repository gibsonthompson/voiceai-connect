'use client';

// First-touch attribution capture for AGENCY signups.
//
// Mounted once in the root layout, so it runs site-wide. On a visitor's first
// page it records UTM params, the external referrer, and the landing path into
// a first-party cookie, before that context is lost. It never overwrites an
// existing first-touch value.
//
// It flushes to /api/attribution when the visitor reaches /onboarding, which is
// where agency signups land after account creation (both the email path and the
// Google OAuth path redirect there). The self-report answer and first-touch
// data ride along in cookies, so they survive the redirect. A once-ever cookie
// guard prevents duplicate rows if onboarding is revisited.
//
// Cookie-only and scoped to platform routes, so it is safe on agency
// white-label hosts (no branding, and /onboarding is a platform-only route).

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ATTR_COOKIE = 'vac_attr';        // first-touch UTM / referrer / landing (JSON)
const SR_COOKIE = 'vac_sr';            // self-report answer (plain string)
const AID_COOKIE = 'vac_aid';          // anonymous visitor id
const FLUSH_COOKIE = 'vac_attr_flushed'; // set once after a successful flush
const MAX_AGE = 60 * 60 * 24 * 90;     // 90 days

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string, maxAge = MAX_AGE) {
  document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=' + maxAge + '; samesite=lax';
}

function makeAnonId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return 'aid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export default function AttributionCapture() {
  const pathname = usePathname();

  // First-touch capture and anon id, once per browser.
  useEffect(() => {
    if (!getCookie(AID_COOKIE)) setCookie(AID_COOKIE, makeAnonId());

    if (getCookie(ATTR_COOKIE)) return; // preserve the original first touch

    const q = new URLSearchParams(window.location.search);
    let referrer = '';
    const ref = document.referrer || '';
    try {
      if (ref && new URL(ref).host !== window.location.host) referrer = ref;
    } catch {
      referrer = ref;
    }

    const attr: Record<string, string> = {};
    const put = (k: string, v: string | null) => { if (v) attr[k] = v; };
    put('utm_source', q.get('utm_source'));
    put('utm_medium', q.get('utm_medium'));
    put('utm_campaign', q.get('utm_campaign'));
    put('utm_term', q.get('utm_term'));
    put('utm_content', q.get('utm_content'));
    put('gclid', q.get('gclid'));
    put('fbclid', q.get('fbclid'));
    put('referrer', referrer);
    put('landing_path', window.location.pathname);
    attr.captured_at = new Date().toISOString();

    setCookie(ATTR_COOKIE, JSON.stringify(attr));
  }, []);

  // Flush when an agency signup completes (lands on /onboarding). Keyed on
  // pathname so it fires on client-side navigation, not only a hard load.
  useEffect(() => {
    if (!pathname) return;
    if (!pathname.startsWith('/onboarding')) return;
    if (getCookie(FLUSH_COOKIE)) return; // already flushed once for this browser

    let attr: Record<string, unknown> = {};
    try {
      const raw = getCookie(ATTR_COOKIE);
      if (raw) attr = JSON.parse(raw);
    } catch {
      attr = {};
    }

    const payload = {
      anon_id: getCookie(AID_COOKIE) || undefined,
      agency_id: readLocalStorage('onboarding_agency_id') || undefined,
      self_report: getCookie(SR_COOKIE) || undefined,
      ...attr,
    };

    // Mark flushed first so a fast re-render or revisit cannot double-post.
    setCookie(FLUSH_COOKIE, '1');

    fetch('/api/attribution', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* best-effort; never block onboarding */ });
  }, [pathname]);

  return null;
}