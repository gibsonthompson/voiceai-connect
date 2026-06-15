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

    // Home-screen name is intentionally pinned to "VoiceAI" (per request). The
    // icon and colors stay agency/client branded; only the text label is fixed.
    const APP_NAME = 'VoiceAI';

    let themeColor = '#3b82f6';
    let backgroundColor = '#f9fafb';
    let iconUrl = '/icon.png';

    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
    const subdomainMatch = hostname.match(new RegExp(`^([^.]+)\\.${platformDomain.replace('.', '\\.')}$`));

    let agency = null;

    if (subdomainMatch) {
      const slug = subdomainMatch[1];
      const { data } = await supabase
        .from('agencies')
        .select('id, name, slug, logo_url, primary_color, website_theme')
        .eq('slug', slug)
        .single();
      agency = data;
    } else {
      const cleanHostname = hostname.replace('www.', '').split(':')[0];
      const { data } = await supabase
        .from('agencies')
        .select('id, name, slug, logo_url, primary_color, website_theme')
        .eq('marketing_domain', cleanHostname)
        .eq('domain_verified', true)
        .single();
      agency = data;
    }

    if (agency) {
      themeColor = agency.primary_color || themeColor;
      if (agency.logo_url) iconUrl = agency.logo_url;
      // Match the launch splash to the agency theme so the icon tap opens onto
      // the agency's own background instead of a generic light/dark flash.
      backgroundColor = agency.website_theme === 'light' ? '#ffffff' : '#0a0a0a';
    }

    // ========================================================================
    // CLIENT OVERRIDE: If ?clientId= is provided, use the client's logo and
    // color so the installed PWA carries their brand (icon/color), not the
    // agency's. The text name stays "VoiceAI" per request.
    // ========================================================================
    const clientId = request.nextUrl.searchParams.get('clientId');

    if (clientId) {
      const { data: client } = await supabase
        .from('clients')
        .select('business_name, logo_url, primary_color')
        .eq('id', clientId)
        .single();

      if (client) {
        if (client.logo_url) iconUrl = client.logo_url;
        if (client.primary_color) themeColor = client.primary_color;
      }
    }

    // Per-install identity. Without an explicit id, every client on a shared
    // agency subdomain installs with the SAME identity (same start_url/scope),
    // so installs collide. Keying id by clientId keeps each client's install
    // distinct on the same origin.
    const manifestId = clientId ? `/client/app/${clientId}` : '/client/app';
    const resolvedIcon = iconUrl.startsWith('http') ? iconUrl : `${fullOrigin}${iconUrl}`;

    const manifest = {
      id: manifestId,
      name: APP_NAME,
      short_name: APP_NAME,
      description: 'Manage your AI receptionist',
      // Open at the login route, not the dashboard. A fresh standalone install
      // has no session; starting at /client/dashboard mounts the dark dashboard
      // shell and then bounces to login (a dark-to-light flash). The login page
      // redirects an already-authenticated user straight to the dashboard, so
      // returning users are unaffected.
      start_url: `${fullOrigin}/client/login`,
      scope: `${fullOrigin}/`,
      display: 'standalone',
      background_color: backgroundColor,
      theme_color: themeColor,
      orientation: 'portrait-primary',
      // 'any' and 'maskable' as separate entries. A combined 'any maskable'
      // purpose makes Android treat the icon as maskable and crop it to the
      // safe zone; splitting lets non-maskable contexts show it uncropped.
      icons: [
        { src: resolvedIcon, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: resolvedIcon, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: resolvedIcon, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: resolvedIcon, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Client manifest error:', error);

    return NextResponse.json({
      name: 'VoiceAI',
      short_name: 'VoiceAI',
      description: 'Manage your AI receptionist',
      start_url: '/client/login',
      display: 'standalone',
      background_color: '#f9fafb',
      theme_color: '#3b82f6',
      icons: [{ src: '/icon.png', sizes: '192x192', type: 'image/png' }]
    }, {
      headers: { 'Content-Type': 'application/manifest+json' },
    });
  }
}