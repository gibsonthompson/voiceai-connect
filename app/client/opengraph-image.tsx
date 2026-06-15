// app/client/opengraph-image.tsx
//
// Overrides the root app/opengraph-image.tsx (the VoiceAI sales card) for every
// /client route. Renders an AGENCY-branded card with zero VoiceAI branding, so
// when a client shares or previews a dashboard/login link there is nothing
// platform-branded in the preview.
//
// Host-aware: the og:image URL resolves to the agency host (metadataBase is set
// to the host in app/client/layout.tsx), so this handler runs on that host,
// reads it, and renders that agency's name + color. No agency / platform host
// falls back to a neutral "Client Portal" card (still no VoiceAI).

import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const alt = 'Client dashboard';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://urchin-app-bqb4i.ondigitalocean.app';

export default async function Image() {
  let name = 'Client Portal';
  let primary = '#6366f1';

  try {
    const h = await headers();
    const host = (h.get('host') || '').toLowerCase();
    const isPlatform =
      !host || host === PLATFORM_DOMAIN || host === `www.${PLATFORM_DOMAIN}` || host.startsWith('localhost');

    if (!isPlatform) {
      const res = await fetch(
        `${BACKEND_URL}/api/agency/by-host?host=${encodeURIComponent(host)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const a = (await res.json())?.agency;
        if (a) {
          name = a.name || name;
          primary = a.primary_color || primary;
        }
      }
    }
  } catch {}

  const initial = (name.trim()[0] || 'C').toUpperCase();

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
            width: '640px',
            height: '420px',
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
            maxWidth: '960px',
            lineHeight: 1.1,
            display: 'flex',
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: '20px',
            fontSize: '28px',
            color: 'rgba(250,250,250,0.55)',
            display: 'flex',
          }}
        >
          Client Dashboard
        </div>
      </div>
    ),
    { ...size }
  );
}