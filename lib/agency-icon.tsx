// lib/agency-icon.tsx
//
// Shared renderer for host-aware favicons / apple-touch-icons on agency hosts.
// A link preview (SMS, iMessage, etc.) shows the site's apple-touch-icon or
// favicon, NOT the OG image. Those are set globally to VoiceAI in the root
// layout, so without a per-host override an agency subdomain's link preview
// shows the VoiceAI icon. The nested icon/apple-icon files under /agency-site
// and /client call this so those route groups emit the AGENCY logo instead.
// Never renders VoiceAI branding.

import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://urchin-app-bqb4i.ondigitalocean.app';

export async function renderAgencyIcon(size: number) {
  let name = '';
  let primary = '#6366f1';
  let logoUrl: string | null = null;
  let logoBg: string | null = null;

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
          name = a.name || '';
          primary = a.primary_color || primary;
          logoUrl = a.logo_url || null;
          logoBg = a.logo_background_color || null;
        }
      }
    }
  } catch {}

  // Composite the agency logo onto a square so non-square / transparent logos
  // read cleanly at icon size.
  if (logoUrl) {
    const inner = Math.round(size * 0.82);
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: logoBg || '#ffffff',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={inner} height={inner} style={{ objectFit: 'contain' }} />
        </div>
      ),
      { width: size, height: size }
    );
  }

  // No logo: agency initial on the agency color. Still never VoiceAI.
  const initial = (name.trim()[0] || 'A').toUpperCase();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: primary,
          color: '#ffffff',
          fontSize: Math.round(size * 0.5),
          fontWeight: 700,
        }}
      >
        {initial}
      </div>
    ),
    { width: size, height: size }
  );
}