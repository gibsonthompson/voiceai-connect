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
  let tagline = 'Never miss another call';
  let primary = '#6366f1';
  let logoUrl: string | null = null;
  let logoBg: string | null = null;
  let ogImageUrl: string | null = null;

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
          tagline = a.company_tagline || tagline;
          primary = a.primary_color || primary;
          logoUrl = a.logo_url || null;
          logoBg = a.logo_background_color || null;
          ogImageUrl = a.og_image_url || null;
        }
      }
    }
  } catch {}

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
          background: '#0a0a0a',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '680px',
            height: '440px',
            background: `radial-gradient(circle, ${primary}33 0%, transparent 70%)`,
            borderRadius: '50%',
          }}
        />

        {logoUrl ? (
          <div
            style={{
              width: '132px',
              height: '132px',
              borderRadius: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: logoBg || '#ffffff',
              marginBottom: '40px',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} width={108} height={108} style={{ objectFit: 'contain' }} alt="" />
          </div>
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
              marginBottom: '40px',
            }}
          >
            {initial}
          </div>
        )}

        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#fafafa',
            textAlign: 'center',
            maxWidth: '980px',
            lineHeight: 1.1,
            display: 'flex',
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: '20px',
            fontSize: '30px',
            color: 'rgba(250,250,250,0.6)',
            textAlign: 'center',
            maxWidth: '900px',
            display: 'flex',
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    { ...SIZE }
  );
}