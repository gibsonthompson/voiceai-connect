// app/agency-site/apple-icon.tsx
//
// Apple touch icon for agency hosts (also what SMS/iMessage link previews show).
// Uses the SQUARE app-icon renderer (app_icon_url, falling back to the contained
// logo) instead of the wide wordmark, so the icon reads cleanly.
import { headers } from 'next/headers';
import { renderAgencyAppIcon } from '@/lib/agency-app-icon';

export const runtime = 'nodejs';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const h = await headers();
  const host = (h.get('host') || h.get('x-forwarded-host') || '').toLowerCase();
  return renderAgencyAppIcon({ host, size: 180 });
}
