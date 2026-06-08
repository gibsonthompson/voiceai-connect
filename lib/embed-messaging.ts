// lib/embed-messaging.ts
// ============================================================================
// IFRAME ↔ PARENT MESSAGING for the embeddable signup widget.
//
// When a signup page is loaded with ?embed=true, it's running inside an
// iframe on the agency's marketing site. This hook handles the runtime
// bridge between the iframe and the host page:
//
//   - Resize: post the iframe's current scrollHeight to the parent so the
//     parent can grow/shrink the <iframe> element. Runs on every layout
//     change via ResizeObserver, debounced to one frame.
//
//   - Step changes: post a `voiceai:step_change` event when the user moves
//     between wizard steps so the host can fire analytics (GTM dataLayer,
//     Meta Pixel, etc).
//
// The actual postMessage emissions go to '*' because we don't know which
// origin is hosting us. The corresponding embed.js loader verifies origin
// on the RECEIVING side, which is where security matters.
//
// We never put auth tokens or PII into postMessage payloads — those stay
// inside the iframe.
// ============================================================================

import { useEffect } from 'react';

export type EmbedMessageType =
  | 'voiceai:ready'
  | 'voiceai:resize'
  | 'voiceai:step_change'
  | 'voiceai:signup_complete'
  | 'voiceai:auth_complete'
  | 'voiceai:error';

export interface EmbedMessage {
  type: EmbedMessageType;
  [key: string]: any;
}

/**
 * Post a message from the iframe to its parent. Safe to call from non-iframe
 * contexts — it just no-ops if window.parent === window.
 */
export function postToParent(message: EmbedMessage): void {
  if (typeof window === 'undefined') return;
  if (window.parent === window) return; // not in an iframe
  try {
    window.parent.postMessage(message, '*');
  } catch (err) {
    // Cross-origin restrictions can throw; ignore. The host won't get this
    // event, which is the worst-case outcome — no security implication.
    // eslint-disable-next-line no-console
    console.warn('[embed] postMessage failed:', err);
  }
}

/**
 * Mount this in every page that supports ?embed=true.
 *
 *   const isEmbed = useSearchParams().get('embed') === 'true';
 *   useEmbedMessaging(isEmbed, currentStep);
 *
 * - `isEmbed` is the gate; the hook no-ops when false so it's safe to mount
 *   unconditionally.
 * - `step` is optional; if provided, fires `voiceai:step_change` whenever it
 *   changes. Used to wire GTM events on the host site.
 */
export function useEmbedMessaging(isEmbed: boolean, step?: number | string): void {
  useEffect(() => {
    if (!isEmbed) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Announce that we've mounted. Host can use this to hide a skeleton.
    postToParent({ type: 'voiceai:ready' });

    let lastHeight = 0;
    let rafId: number | null = null;

    const sendHeight = () => {
      // Use the documentElement scrollHeight rather than body — body can be
      // 0-height when content is absolutely positioned, but documentElement
      // reflects what the iframe actually needs to render.
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0
      );
      if (h !== lastHeight && h > 0) {
        lastHeight = h;
        postToParent({ type: 'voiceai:resize', height: h });
      }
    };

    const scheduleSend = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        sendHeight();
      });
    };

    // Initial measurement after the first layout settles.
    scheduleSend();

    // Watch the body for any layout change. ResizeObserver is supported
    // everywhere modern; fall back to window resize event if missing.
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleSend);
      observer.observe(document.documentElement);
      if (document.body) observer.observe(document.body);
    } else {
      window.addEventListener('resize', scheduleSend);
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', scheduleSend);
    };
  }, [isEmbed]);

  // Separate effect for step changes so we don't reinstall the observer
  // on every step transition.
  useEffect(() => {
    if (!isEmbed) return;
    if (step === undefined || step === null) return;
    postToParent({ type: 'voiceai:step_change', step });
  }, [isEmbed, step]);
}