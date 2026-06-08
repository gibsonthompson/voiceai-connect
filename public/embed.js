/* ============================================================================
 * VoiceAI Connect — Embeddable Signup Widget Loader
 *
 * Agencies paste this on their marketing site:
 *
 *   <div data-voiceai-signup data-agency="AGENCY_UUID"></div>
 *   <script src="https://myvoiceaiconnect.com/embed.js" async></script>
 *
 * Optional attributes on the <div>:
 *   data-theme              "light" | "dark" | "auto"
 *   data-default-plan       "starter" | "pro" | "growth"
 *   data-redirect-on-success URL to redirect parent window to after signup
 *
 * What this does:
 *   1. Finds every [data-voiceai-signup] container on the host page
 *   2. Injects an <iframe> into it, pointed at our /get-started page with
 *      ?embed=true&agency=<uuid> (plus optional theme / default_plan params)
 *   3. Listens for postMessage events from the iframe (origin-locked) and:
 *        - voiceai:ready          — initial paint complete
 *        - voiceai:resize         — adjust iframe height to match content
 *        - voiceai:step_change    — push GTM dataLayer event
 *        - voiceai:signup_complete — push GTM dataLayer event, optional redirect
 *        - voiceai:auth_complete  — optional top-frame redirect to dashboard
 *
 * Security:
 *   - Origin verification on every inbound message
 *   - referrerpolicy="no-referrer-when-downgrade" on the iframe
 *   - No auth tokens are passed via postMessage; they flow inside the iframe
 *     via the password-reset → set-password JWT path
 *
 * Cache-Control: public, max-age=300, s-maxage=3600 (set at the Vercel layer)
 * ============================================================================ */

(function () {
  'use strict';

  // Embedded by `https://myvoiceaiconnect.com/embed.js`. Change here if the
  // platform domain ever moves. This is also the ONLY origin we accept
  // postMessages from inside the iframe.
  var PLATFORM_ORIGIN = 'https://myvoiceaiconnect.com';
  var IFRAME_PATH = '/get-started';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Idempotency — multiple <script> tags on the same page shouldn't double-inject.
  if (window.__voiceaiEmbedLoaded) return;
  window.__voiceaiEmbedLoaded = true;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function buildIframeSrc(container) {
    var params = new URLSearchParams();
    params.set('embed', 'true');

    var agency = container.getAttribute('data-agency');
    if (agency) params.set('agency', agency);

    var theme = container.getAttribute('data-theme');
    if (theme) params.set('theme', theme);

    var defaultPlan = container.getAttribute('data-default-plan');
    if (defaultPlan) params.set('default_plan', defaultPlan);

    return PLATFORM_ORIGIN + IFRAME_PATH + '?' + params.toString();
  }

  function pushDataLayer(event) {
    if (!window.dataLayer || typeof window.dataLayer.push !== 'function') return;
    try { window.dataLayer.push(event); } catch (_) { /* swallow */ }
  }

  function mount(container) {
    var agencyId = container.getAttribute('data-agency');
    if (!agencyId) {
      console.error('[VoiceAI] [data-voiceai-signup] requires a data-agency="..." attribute');
      return;
    }

    // Don't double-mount inside the same container.
    if (container.querySelector('iframe[data-voiceai-iframe]')) return;

    var redirectOnSuccess = container.getAttribute('data-redirect-on-success');

    var iframe = document.createElement('iframe');
    iframe.src = buildIframeSrc(container);
    iframe.setAttribute('data-voiceai-iframe', 'true');
    iframe.setAttribute('title', 'Sign up for AI receptionist');
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('frameborder', '0');
    iframe.style.cssText = [
      'width: 100%',
      'border: 0',
      'min-height: 600px',
      'display: block',
      'background: transparent',
      'transition: height 200ms ease'
    ].join(';');

    container.appendChild(iframe);

    // ────────────────────────────────────────────────────────────────────
    // postMessage handler — origin-locked to PLATFORM_ORIGIN.
    // ────────────────────────────────────────────────────────────────────
    function onMessage(e) {
      if (e.origin !== PLATFORM_ORIGIN) return;
      if (e.source !== iframe.contentWindow) return; // only THIS iframe's events
      if (!e.data || typeof e.data !== 'object') return;
      if (typeof e.data.type !== 'string') return;

      switch (e.data.type) {
        case 'voiceai:ready':
          // Initial paint complete; nothing to do, but useful for hosts
          // that want to remove a skeleton loader.
          pushDataLayer({ event: 'voiceai_ready', agency_id: agencyId });
          break;

        case 'voiceai:resize':
          if (typeof e.data.height === 'number' && e.data.height > 100) {
            iframe.style.height = e.data.height + 'px';
          }
          break;

        case 'voiceai:step_change':
          pushDataLayer({
            event: 'voiceai_signup_step',
            step: e.data.step,
            agency_id: agencyId
          });
          break;

        case 'voiceai:signup_complete':
          pushDataLayer({
            event: 'voiceai_signup_complete',
            agency_id: agencyId,
            client_id: e.data.clientId || null,
            phone: e.data.phone || null,
            business: e.data.business || null,
            plan: e.data.plan || null
          });
          if (redirectOnSuccess) {
            // Redirect the TOP frame (the host site), not the iframe.
            try { window.top.location.href = redirectOnSuccess; } catch (_) {
              window.location.href = redirectOnSuccess;
            }
          }
          break;

        case 'voiceai:auth_complete':
          // The iframe is asking the parent to navigate the top frame to
          // the dashboard URL it provides. URL is a same-platform URL
          // (already validated by sender), but we sanity-check it begins
          // with https:// to avoid javascript: shenanigans.
          if (typeof e.data.url === 'string' && /^https:\/\//.test(e.data.url)) {
            pushDataLayer({ event: 'voiceai_auth_complete', agency_id: agencyId });
            try { window.top.location.href = e.data.url; } catch (_) {
              window.location.href = e.data.url;
            }
          }
          break;

        case 'voiceai:error':
          pushDataLayer({
            event: 'voiceai_signup_error',
            agency_id: agencyId,
            reason: e.data.reason || 'unknown'
          });
          break;
      }
    }

    window.addEventListener('message', onMessage);
  }

  ready(function () {
    var containers = document.querySelectorAll('[data-voiceai-signup]');
    for (var i = 0; i < containers.length; i++) mount(containers[i]);
  });
})();