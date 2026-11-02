// app/agency-site/layout.tsx
import type { Metadata } from 'next';
import { headers } from 'next/headers';

// ============================================================================
// SERVER-SIDE AGENCY FETCH (for metadata only)
// Read fresh (no-store) so title / OG / favicon reflect dashboard edits right
// away, matching page.tsx.
// ============================================================================
async function getAgencyByHost(host: string) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (!backendUrl || !host) return null;

  try {
    const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.agency || ['suspended', 'deleted'].includes(data.agency.status)) return null;
    return data.agency;
  } catch {
    return null;
  }
}

// ============================================================================
// EXTRACT <meta> TAGS FROM THE AGENCY'S CUSTOM HEAD SCRIPTS
// The dashboard's Website -> Tracking -> Custom Head Scripts field is injected
// as a <script> in the BODY by the marketing page, so a verification <meta>
// pasted there (e.g. Google Search Console's HTML-tag method) never reaches the
// real <head> and crawlers cannot see it ("meta tag is not in the <head>").
// Pull any <meta name= content=> tags out here so they can be emitted
// server-side into the <head> via Next's Metadata API. google-site-verification
// is collected separately (as an array, since an agency may need to verify more
// than one Search Console property) and maps to verification.google; everything
// else (bing msvalidate.01, facebook-domain-verification, p:domain_verify, etc.)
// goes to `other`. Attribute order and single/double quotes are both handled.
// Reserved names Next already manages are skipped so we never emit a duplicate
// or conflicting viewport/charset/description tag.
// ============================================================================
const RESERVED_META_NAMES = new Set(['viewport', 'charset', 'description']);

function extractHeadMeta(raw: string | null | undefined): {
  googleVerification: string[];
  other: Record<string, string>;
} {
  const result = { googleVerification: [] as string[], other: {} as Record<string, string> };
  if (!raw || typeof raw !== 'string') return result;
  const metaTagRe = /<meta\b[^>]*>/gi;
  const nameRe = /\bname\s*=\s*["']([^"']+)["']/i;
  const contentRe = /\bcontent\s*=\s*["']([^"']*)["']/i;
  let match: RegExpExecArray | null;
  while ((match = metaTagRe.exec(raw)) !== null) {
    const tag = match[0];
    const name = (tag.match(nameRe) || [])[1];
    const contentMatch = tag.match(contentRe);
    if (!name || !contentMatch) continue;
    const content = contentMatch[1];
    const lname = name.toLowerCase();
    if (lname === 'google-site-verification') {
      if (content && !result.googleVerification.includes(content)) result.googleVerification.push(content);
    } else if (!RESERVED_META_NAMES.has(lname)) {
      result.other[name] = content;
    }
  }
  return result;
}

// ============================================================================
// GENERATE METADATA (server-side, crawlers can read these)
// ============================================================================
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';

  const agency = await getAgencyByHost(host);

  // metadataBase = the agency host so the OG image URL (served by
  // app/agency-site/opengraph-image.tsx) resolves to THIS host. That image
  // route reads the host to render the agency's own card, so it must be hit
  // on the agency host, not the platform.
  const base = host ? { metadataBase: new URL(`https://${host}`) } : {};

  // Canonical + alternates must point at the AGENCY's own host, not the platform.
  // The root layout hardcodes the canonical to myvoiceaiconnect.com and a
  // "VoiceAI Connect Blog" RSS alternate; a white-label page that set no
  // alternates of its own inherited both, telling Google its canonical home was
  // the platform and advertising the platform's feed. Setting `alternates` here
  // replaces that inherited object wholesale, so each agency page gets its own
  // canonical and the platform RSS alternate is dropped on white-label hosts.
  const canonicalPath = headersList.get('x-pathname') || '/';
  const alternates = host ? { alternates: { canonical: `https://${host}${canonicalPath}` } } : {};

  if (!agency) {
    return {
      ...base,
      ...alternates,
      title: { absolute: 'AI Phone Answering' },
      description: 'Professional AI receptionist that answers every call 24/7.',
    };
  }

  const title = agency.og_title || `${agency.name} - AI Phone Answering`;
  const description =
    agency.og_description ||
    agency.company_tagline ||
    'Professional AI receptionist that answers every call 24/7. Never miss another customer.';

  // Surface any verification / meta tags the agency pasted into Custom Head
  // Scripts as REAL <meta> tags in the server-rendered <head>, so Search Console
  // (and Bing, etc.) can actually detect them.
  const { googleVerification, other: otherMeta } = extractHeadMeta(agency.custom_head_scripts);
  const googleVerify = googleVerification.length === 1 ? googleVerification[0] : googleVerification;

  return {
    ...base,
    ...alternates,
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(host ? { url: `https://${host}` } : {}),
      // OG image intentionally NOT set here. app/agency-site/opengraph-image.tsx
      // owns it: it re-serves the agency's uploaded og_image_url when present,
      // else renders a clean agency card. Using the file convention guarantees
      // it overrides the root VoiceAI sales image (closest image file wins),
      // which config-based images are not guaranteed to do.
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    // icons intentionally NOT set here. Pointing them at agency.logo_url emitted
    // the agency's WIDE wordmark as the browser-tab favicon, squished into the
    // square tab and unreadable. Omitting the override lets the file-convention
    // routes (app/agency-site/icon.tsx + apple-icon.tsx) and the host-aware
    // /api/agency-favicon route render the SQUARE app icon (app_icon_url, falling
    // back to the contained logo) instead.
    ...(googleVerification.length ? { verification: { google: googleVerify } } : {}),
    ...(Object.keys(otherMeta).length ? { other: otherMeta } : {}),
  };
}

// ============================================================================
// LAYOUT
// ============================================================================
export default function AgencySiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 
        Inline script to prevent flash on themed agency sites.
        Sets background on <html> BEFORE React hydrates so the
        body's default dark background from globals.css doesn't bleed through.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var t = sessionStorage.getItem('agency_theme');
                if (t === 'dark') {
                  document.documentElement.style.backgroundColor = '#0f0f0f';
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.style.backgroundColor = '#ffffff';
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch(e) {
                document.documentElement.style.backgroundColor = '#ffffff';
              }
            })();
          `,
        }}
      />
      <div style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </>
  );
}