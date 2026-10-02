// app/api/agency-og/route.tsx
//
// Host-aware Open Graph image for AGENCY hosts. This is the OG analogue of
// /api/agency-favicon: middleware rewrites /opengraph-image to this route on
// agency hosts, and the /signup and /auth layouts also point og:image straight
// here, so an agency's shared link (e.g. dealerview.com/signup) never shows the
// VoiceAI sales card. No VoiceAI branding ever appears here.
//
// Behavior (reads the request host, which is the agency host because the tag
// URL is re-based to the agency origin by those layouts):
//   1. Agency uploaded og_image_url -> re-serve that exact image.
//   2. Otherwise                    -> generate a clean agency card
//                                       (logo if present, else initial).
//   3. Platform host / no agency    -> neutral card, still no VoiceAI.
//
// Mirrors app/agency-site/opengraph-image.tsx so both the /agency-site routes
// and the pass-through routes render the same agency card from one code path.

import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://urchin-app-bqb4i.ondigitalocean.app';

const SIZE = { width: 1200, height: 630 };

export async function GET() {
  let name = 'AI Phone Answering';
  let primary = '#6366f1';
  let logoUrl: string | null = null;
  let ogImageUrl: string | null = null;
  let ogTitle: string | null = null;
  let ogDescription: string | null = null;
  let websiteTheme: string | null = null;

  try {
    const h = await headers();
    const host = (h.get('host') || h.get('x-forwarded-host') || '').toLowerCase();
    const isPlatform =
      !host ||
      host === PLATFORM_DOMAIN ||
      host === `www.${PLATFORM_DOMAIN}` ||
      host.startsWith('localhost');

    if (!isPlatform) {
      const res = await fetch(`${BACKEND_URL}/api/agency/by-host?host=${encodeURIComponent(host)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const a = (await res.json())?.agency;
        if (a) {
          name = a.name || name;
          primary = a.primary_color || primary;
          logoUrl = a.logo_url || null;
          ogImageUrl = a.og_image_url || null;
          ogTitle = a.og_title || null;
          ogDescription = a.og_description || null;
          websiteTheme = a.website_theme || null;
        }
      }
    }
  } catch {}

  const titleText = (ogTitle || '').trim();
  const descText = (ogDescription || '').trim();
  // The logo carries the brand. Only show the name as text when there's no logo,
  // and only show title/description when the agency actually wrote them.
  const headlineText = titleText || (logoUrl ? '' : name);
  const showHeadline = !!headlineText;
  const showDesc = !!descText;
  const logoMb = (showHeadline || showDesc) ? '36px' : '0';
  const logoSize = (showHeadline || showDesc) ? 300 : 480;
  const descMt = showHeadline ? '20px' : '0';
  const dark = (websiteTheme || 'light') === 'dark';
  const cardBg = dark ? '#0a0a0a' : '#ffffff';
  const cardFg = dark ? '#fafafa' : '#111827';
  const cardSub = dark ? 'rgba(250,250,250,0.65)' : '#6b7280';

  // 1. Re-serve the agency's own uploaded OG image verbatim if they have one.
  if (ogImageUrl) {
    try {
      const r = await fetch(ogImageUrl, { cache: 'no-store' });
      if (r.ok) {
        const buf = await r.arrayBuffer();
        return new Response(buf, {
          headers: {
            'Content-Type': r.headers.get('content-type') || 'image/png',
            'Cache-Control': 'public, max-age=300',
          },
        });
      }
    } catch {}
  }

  // 2./3. Clean generated card: agency logo (or initial) + name + tagline.
  const initial = (name.trim()[0] || 'A').toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: cardBg,
          position: 'relative',
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} width={logoSize} height={logoSize} style={{ objectFit: 'contain', marginBottom: logoMb }} alt="" />
        ) : (
          <div
            style={{
              width: '132px',
              height: '132px',
              borderRadius: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: primary,
              color: '#ffffff',
              fontSize: '64px',
              fontWeight: 700,
              marginBottom: logoMb,
            }}
          >
            {initial}
          </div>
        )}

        {showHeadline && (
          <div
            style={{
              fontSize: '64px',
              fontWeight: 700,
              color: cardFg,
              textAlign: 'center',
              maxWidth: '980px',
              lineHeight: 1.1,
              display: 'flex',
            }}
          >
            {headlineText}
          </div>
        )}
        {showDesc && (
          <div
            style={{
              marginTop: descMt,
              fontSize: '30px',
              color: cardSub,
              textAlign: 'center',
              maxWidth: '900px',
              display: 'flex',
            }}
          >
            {descText}
          </div>
        )}
      </div>
    ),
    { ...SIZE }
  );
}