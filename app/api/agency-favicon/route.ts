// app/api/agency-favicon/route.ts
//
// Host-aware icon endpoint. Middleware rewrites the fixed icon paths
// (/apple-touch-icon.png, /favicon-*.png, /favicon.ico, /favicon.svg) here on
// agency hosts. It reads the request host, resolves the agency, and renders
// that agency's SQUARE app icon (app_icon_url, falling back to the contained
// logo) so the browser tab, SMS, and link-preview crawlers get a clean square
// icon instead of the agency's wide wordmark squished into a square.

import { headers } from 'next/headers';
import { renderAgencyAppIcon } from '@/lib/agency-app-icon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const h = await headers();
  const host = (h.get('host') || h.get('x-forwarded-host') || '').toLowerCase();
  return renderAgencyAppIcon({ host, size: 256 });
}
