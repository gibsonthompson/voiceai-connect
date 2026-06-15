// app/agency-site/opengraph-image.tsx
//
// Overrides the root app/opengraph-image.tsx (the VoiceAI sales card) for the
// agency marketing site. No VoiceAI branding ever appears here.
//
// Behavior, host-aware (metadataBase is set to the host in layout.tsx so this
// runs on the agency host):
//   1. Agency uploaded og_image_url  -> re-serve that exact image.
//   2. Otherwise                     -> generate a clean agency card.
//   3. No agency / platform host     -> neutral card, still no VoiceAI.

import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const alt = 'AI Phone Answering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://urchin-app-bqb4i.ondigitalocean.app';

export default async function Image() {
  let name = 'AI Phone Answering';
  let tagline = 'Never miss another call';
  let primary = '#6366f1';
  let ogImageUrl: string | null = null;

  try {
    const h = await headers();
    const host = (h.get('host') || h.get('x-forwarded-host') || '').toLowerCase();
    const isPlatform =
      !host || host === PLATFORM_DOMAIN || host === `www.${PLATFORM_DOMAIN}` || host.startsWith('localhost');

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

  // 2./3. Clean generated card. Agency name + tagline + color, never VoiceAI.
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
    { ...size }
  );
}