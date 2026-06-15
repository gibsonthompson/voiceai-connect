// app/api/agency-favicon/route.ts
//
// Host-aware icon endpoint. Middleware rewrites the fixed icon paths
// (/apple-touch-icon.png, /favicon-*.png, /favicon.ico, /favicon.svg) here on
// agency hosts. It reads the request host, resolves the agency, and renders
// that agency's logo, so SMS / link-preview crawlers that fetch those fixed
// paths get the agency icon instead of the platform's VoiceAI icon.

import { renderAgencyIcon } from '@/lib/agency-icon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return renderAgencyIcon(256);
}