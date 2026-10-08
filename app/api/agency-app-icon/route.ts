// app/api/agency-app-icon/route.ts
//
// Serves the square PWA / home-screen icon for the current host. Composites the
// agency's app icon (or logo, or a client's logo) onto a square so it is never
// stretched. Referenced by /api/agency-manifest, /api/client-manifest, and the
// agency apple-touch-icon.
//
//   /api/agency-app-icon?size=512
//   /api/agency-app-icon?size=180&clientId=<uuid>
//
// size is clamped to a small set of sane values; anything else falls back to
// 512. clientId is optional and lets a client install carry their own logo.

import { NextRequest } from 'next/server';
import { renderAgencyAppIcon } from '@/lib/agency-app-icon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_SIZES = [96, 180, 192, 256, 384, 512];

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const rawSize = parseInt(request.nextUrl.searchParams.get('size') || '512', 10);
  const size = ALLOWED_SIZES.includes(rawSize) ? rawSize : 512;
  const clientId = request.nextUrl.searchParams.get('clientId');

  const res = await renderAgencyAppIcon({ host, size, clientId });

  // ImageResponse sets its own content-type; add a short cache so the OS and
  // link-preview fetchers do not hammer the renderer, while still picking up an
  // icon change within the hour.
  res.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  return res;
}
