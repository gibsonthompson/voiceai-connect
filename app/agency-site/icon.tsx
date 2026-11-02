// app/agency-site/icon.tsx
//
// Browser-tab favicon for agency hosts. Uses the SQUARE app-icon renderer
// (app_icon_url, falling back to the contained logo) instead of the wide
// wordmark, so the tab icon is readable instead of a squished logo.
import { headers } from 'next/headers';
import { renderAgencyAppIcon } from '@/lib/agency-app-icon';

export const runtime = 'nodejs';
export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default async function Icon() {
  const h = await headers();
  const host = (h.get('host') || h.get('x-forwarded-host') || '').toLowerCase();
  return renderAgencyAppIcon({ host, size: 192 });
}
