// ============================================================================
// components/CustomScripts.tsx
// Robust injector for an agency's Custom Head / Body Scripts.
//
// WHY THIS EXISTS
// The dashboard fields let an agency paste arbitrary tracking snippets (Hotjar,
// Microsoft Clarity, chat widgets, custom pixels). The old render path dumped
// the raw value inside a single <script dangerouslySetInnerHTML> tag, which
// breaks two very common cases:
//   1. A snippet WRAPPED in its own <script>...</script> tags: the inner
//      </script> closes the outer tag early, so the rest leaks onto the page as
//      text and nothing runs.
//   2. An EXTERNAL <script src="..."> snippet: a script written via innerHTML
//      never executes, so the external file is never loaded.
// Raw JavaScript with no tags happened to work, so most agencies had to know to
// strip the wrapper, which almost nobody does.
//
// WHAT THIS DOES
// On mount it parses the pasted markup and rebuilds it as REAL DOM nodes so the
// browser actually runs it:
//   - <script> (inline OR external src) is recreated via createElement so it
//     executes, with all attributes (async/defer/type/crossorigin/...) preserved
//     and in document order.
//   - <noscript>, <link>, <img> and other non-script elements are cloned as-is
//     (covers e.g. the Facebook pixel <noscript> fallback or a preconnect link).
//   - <meta> is intentionally SKIPPED: verification/meta tags are emitted into
//     the real server-rendered <head> by app/agency-site/layout.tsx, so cloning
//     them here too would create duplicates.
//   - Markup with no element tags at all is treated as raw inline JS (the
//     backward-compatible case) and run in an inline <script>.
//
// Injection is guarded by a module-level set keyed on target + content hash, so
// React re-renders, StrictMode double-mounts, and SPA navigations never inject
// the same snippet twice. Runs client-side only (returns null on the server);
// third-party tags belong on the client, and head meta is already server-side.
// ============================================================================
'use client';

import { useEffect } from 'react';

const injectedPayloads = new Set<string>();

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}

export default function CustomScripts({
  html,
  target = 'head',
}: {
  html?: string | null;
  target?: 'head' | 'body';
}) {
  useEffect(() => {
    if (!html || typeof html !== 'string' || !html.trim()) return;

    const key = `${target}:${hashString(html)}`;
    if (injectedPayloads.has(key)) return;
    injectedPayloads.add(key);

    const root = target === 'body' ? document.body : document.head;
    if (!root) return;

    try {
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      const nodes = Array.from(tpl.content.childNodes);
      const hasElement = nodes.some((n) => n.nodeType === Node.ELEMENT_NODE);

      // No tags at all -> treat the whole value as raw inline JS (old behavior).
      if (!hasElement) {
        const s = document.createElement('script');
        s.textContent = html;
        root.appendChild(s);
        return;
      }

      nodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as Element;
        const tag = el.tagName.toLowerCase();

        if (tag === 'script') {
          // Recreate so it actually executes (template-parsed and innerHTML
          // scripts are inert). Preserve attributes + inline body + order.
          const fresh = document.createElement('script');
          for (const attr of Array.from(el.attributes)) {
            fresh.setAttribute(attr.name, attr.value);
          }
          if (!el.getAttribute('src')) {
            fresh.textContent = el.textContent || '';
          }
          root.appendChild(fresh);
        } else if (tag === 'meta') {
          // Skip: handled server-side in the real <head> to avoid duplicates.
        } else {
          // link / noscript / img / etc. - clone as-is.
          root.appendChild(el.cloneNode(true));
        }
      });
    } catch (err) {
      // Never let a malformed snippet break the page.
      // eslint-disable-next-line no-console
      console.warn('CustomScripts injection failed:', (err as Error)?.message);
    }
  }, [html, target]);

  return null;
}
