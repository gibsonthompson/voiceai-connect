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
    
    let name = 'Dashboard';
    let shortName = 'Dashboard';
    let themeColor = '#3b82f6';
    let backgroundColor = '#f9fafb';
    let iconUrl = '/icon.png';
    
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

    // The root layout links THIS route as the manifest for every host (it used
    // to link the static /manifest.json, whose start_url is /agency/dashboard).
    // On the platform domain the installer is an AGENCY OWNER, so keep the old
    // platform manifest: VoiceAI branding + start_url /agency/dashboard. Only
    // agency client hosts (subdomain / custom domain) fall through to the
    // client-scoped manifest below (start_url /client/dashboard, agency brand).
    const isPlatformHost =
      hostname === platformDomain ||
      hostname === `www.${platformDomain}` ||
      hostname.startsWith('localhost');

    if (isPlatformHost) {
      return NextResponse.json({
        id: '/agency/app',
        name: 'VoiceAI Connect',
        short_name: 'VoiceAI',
        description: 'AI Voice Receptionist Platform',
        start_url: `${fullOrigin}/agency/dashboard`,
        scope: `${fullOrigin}/`,
        display: 'standalone',
        background_color: '#050505',
        theme_color: '#050505',
        orientation: 'portrait',
        icons: [
          { src: `${fullOrigin}/icon-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${fullOrigin}/icon-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${fullOrigin}/icon-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: `${fullOrigin}/icon-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      }, {
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    const subdomainMatch = hostname.match(new RegExp(`^([^.]+)\\.${platformDomain.replace('.', '\\.')}$`));
    
    let agency = null;
    
    if (subdomainMatch) {
      const slug = subdomainMatch[1];
      const { data } = await supabase
        .from('agencies')
        .select('id, name, slug, logo_url, primary_color')
        .eq('slug', slug)
        .single();
      agency = data;
    } else {
      const cleanHostname = hostname.replace('www.', '').split(':')[0];
      const { data } = await supabase
        .from('agencies')
        .select('id, name, slug, logo_url, primary_color')
        .eq('marketing_domain', cleanHostname)
        .eq('domain_verified', true)
        .single();
      agency = data;
    }
    
    if (agency) {
      name = agency.name;
      shortName = agency.name.split(' ')[0] || 'Dashboard';
      themeColor = agency.primary_color || themeColor;
      if (agency.logo_url) iconUrl = agency.logo_url;
    }

    // ========================================================================
    // CLIENT OVERRIDE: If ?clientId= is provided, use client's business name,
    // logo, and color for the PWA install so it shows their brand, not the agency's.
    // ========================================================================
    const clientId = request.nextUrl.searchParams.get('clientId');
    
    if (clientId) {
      const { data: client } = await supabase
        .from('clients')
        .select('business_name, logo_url, primary_color')
        .eq('id', clientId)
        .single();
      
      if (client) {
        if (client.business_name) {
          name = client.business_name;
          shortName = client.business_name.split(' ')[0] || shortName;
        }
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
      name,
      short_name: shortName,
      description: 'Manage your AI receptionist',
      start_url: `${fullOrigin}/client/dashboard`,
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
      name: 'Dashboard',
      short_name: 'Dashboard',
      description: 'Manage your AI receptionist',
      start_url: '/client/dashboard',
      display: 'standalone',
      background_color: '#f9fafb',
      theme_color: '#3b82f6',
      icons: [{ src: '/icon.png', sizes: '192x192', type: 'image/png' }]
    }, {
      headers: { 'Content-Type': 'application/manifest+json' },
    });
  }
}