// app/api/cc-manifest/route.ts
//
// Per-call-center PWA manifest for the /cc dashboard (the operations console a
// call center and its agents install). Mirrors /api/agency-manifest but scoped
// to /cc so the installed app opens on the live board, not the reseller or
// client dashboard. Carries the call center's OWN name, icon, and brand color,
// resolved by host with the service role.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const hostname = request.headers.get('host') || '';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const fullOrigin = `${protocol}://${hostname}`;

    let appName = 'Call Center';
    let themeColor = '#050505';
    let backgroundColor = '#050505';

    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
    const subdomainMatch = hostname.match(new RegExp(`^([^.]+)\\.${platformDomain.replace('.', '\\.')}$`));

    let agency = null;
    const cols = 'id, name, slug, app_name, app_icon_url, logo_url, primary_color, website_theme';
    if (subdomainMatch) {
      const { data } = await supabase.from('agencies').select(cols).eq('slug', subdomainMatch[1]).single();
      agency = data;
    } else {
      const cleanHostname = hostname.replace('www.', '').split(':')[0];
      const { data } = await supabase.from('agencies').select(cols).eq('marketing_domain', cleanHostname).eq('domain_verified', true).single();
      agency = data;
    }

    if (agency) {
      const custom = (agency.app_name || '').trim();
      const fallbackName = (agency.name || '').trim();
      appName = (custom || fallbackName || 'Call Center').slice(0, 45);
      themeColor = agency.primary_color || themeColor;
      backgroundColor = agency.website_theme === 'light' ? '#ffffff' : '#050505';
    }

    const shortName = appName.slice(0, 18);

    const manifest = {
      id: '/cc/app',
      name: appName,
      short_name: shortName,
      description: `${appName} call center`,
      start_url: `${fullOrigin}/cc/dashboard`,
      scope: `${fullOrigin}/cc`,
      display: 'standalone',
      background_color: backgroundColor,
      theme_color: themeColor,
      orientation: 'portrait',
      icons: [
        { src: `${fullOrigin}/api/agency-app-icon?size=192`, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: `${fullOrigin}/api/agency-app-icon?size=512`, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: `${fullOrigin}/api/agency-app-icon?size=192`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: `${fullOrigin}/api/agency-app-icon?size=512`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    };

    return NextResponse.json(manifest, {
      headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch (error) {
    console.error('CC manifest error:', error);
    return NextResponse.json(
      { name: 'Call Center', short_name: 'Call Center', description: 'AI call center console', start_url: '/cc/dashboard', display: 'standalone', background_color: '#050505', theme_color: '#050505', icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }] },
      { headers: { 'Content-Type': 'application/manifest+json' } }
    );
  }
}
