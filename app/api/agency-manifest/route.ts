// app/api/agency-manifest/route.ts
//
// Per-agency PWA manifest for the AGENCY portal (the dashboard an agency and
// its staff install to their home screen). Replaces the static /manifest.json,
// whose name was pinned to "VoiceAI Connect" and whose icon was the platform
// waveform. Now the installed app carries the agency's OWN name and icon.
//
//   name       -> agencies.app_name (what shows under the home-screen icon),
//                 falling back to the agency name, then "VoiceAI".
//   icons      -> /api/agency-app-icon (square, never stretched; resolves the
//                 agency's app_icon_url or logo by host).
//   theme/bg   -> the agency brand color + light/dark splash.
//
// Resolved by host with the service role, exactly like /api/client-manifest.

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

    let appName = 'VoiceAI';
    let themeColor = '#050505';
    let backgroundColor = '#050505';

    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
    const subdomainMatch = hostname.match(new RegExp(`^([^.]+)\\.${platformDomain.replace('.', '\\.')}$`));

    let agency = null;

    if (subdomainMatch) {
      const { data } = await supabase
        .from('agencies')
        .select('id, name, slug, app_name, app_icon_url, logo_url, primary_color, website_theme')
        .eq('slug', subdomainMatch[1])
        .single();
      agency = data;
    } else {
      const cleanHostname = hostname.replace('www.', '').split(':')[0];
      const { data } = await supabase
        .from('agencies')
        .select('id, name, slug, app_name, app_icon_url, logo_url, primary_color, website_theme')
        .eq('marketing_domain', cleanHostname)
        .eq('domain_verified', true)
        .single();
      agency = data;
    }

    if (agency) {
      // Custom PWA name first, then the agency's own name, then the generic
      // fallback. Trimmed and length-capped so a stray value cannot produce a
      // broken home-screen label.
      const custom = (agency.app_name || '').trim();
      const fallbackName = (agency.name || '').trim();
      appName = (custom || fallbackName || 'VoiceAI').slice(0, 45);
      themeColor = agency.primary_color || themeColor;
      backgroundColor = agency.website_theme === 'light' ? '#ffffff' : '#050505';
    }

    // A short_name must stay compact on a home screen; cap it harder.
    const shortName = appName.slice(0, 18);

    const manifest = {
      id: '/agency/app',
      name: appName,
      short_name: shortName,
      description: `${appName} dashboard`,
      start_url: `${fullOrigin}/agency/dashboard`,
      scope: `${fullOrigin}/agency`,
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
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Agency manifest error:', error);
    return NextResponse.json(
      {
        name: 'VoiceAI',
        short_name: 'VoiceAI',
        description: 'AI Voice Receptionist Platform',
        start_url: '/agency/dashboard',
        display: 'standalone',
        background_color: '#050505',
        theme_color: '#050505',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
      { headers: { 'Content-Type': 'application/manifest+json' } }
    );
  }
}
