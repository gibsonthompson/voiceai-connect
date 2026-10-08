// lib/agency-app-icon.tsx
//
// Single source of truth for the SQUARE home-screen / PWA app icon on agency
// and client hosts. Every consumer (the agency manifest, the client manifest,
// the iOS apple-touch-icon) points here so the installed-app icon is always a
// clean square, never a stretched wordmark.
//
// Why this exists: the raw agency/client logo is usually a WIDE wordmark. When
// it is declared directly at 192x192 / 512x512 (old manifests) or set as the
// apple-touch-icon, the OS scales that wide image to fill a square box and it
// stretches. Here we composite the chosen image onto a real square with
// object-fit: contain and a solid background, so the aspect ratio is preserved
// and the icon reads cleanly at any size and under a maskable crop.
//
// Icon source precedence:
//   client.logo_url (when a clientId is given and the client has its own logo)
//   -> agency.app_icon_url (the dedicated square icon the agency uploads)
//   -> agency.logo_url (the wordmark, contained so it still does not stretch)
//   -> the agency initial on the brand color (never VoiceAI branding)
//
// Resolved by host (subdomain or verified marketing domain) with the service
// role, exactly like /api/client-manifest, so no backend round-trip is needed.

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface IconAgency {
  name: string | null;
  logo_url: string | null;
  app_icon_url: string | null;
  primary_color: string | null;
  logo_background_color: string | null;
  website_theme: 'auto' | 'light' | 'dark' | null;
}

async function resolveAgency(host: string): Promise<IconAgency | null> {
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const cols = 'name, logo_url, app_icon_url, primary_color, logo_background_color, website_theme';

  const subdomainMatch = host.match(new RegExp(`^([^.]+)\\.${platformDomain.replace('.', '\\.')}$`));
  if (subdomainMatch) {
    const { data } = await supabase
      .from('agencies')
      .select(cols)
      .eq('slug', subdomainMatch[1])
      .single();
    if (data) return data as IconAgency;
  }

  const cleanHostname = host.replace('www.', '').split(':')[0];
  const { data } = await supabase
    .from('agencies')
    .select(cols)
    .eq('marketing_domain', cleanHostname)
    .eq('domain_verified', true)
    .single();
  return (data as IconAgency) || null;
}

interface RenderOpts {
  host: string;
  size: number;
  clientId?: string | null;
}

/**
 * Renders a square app icon as a PNG ImageResponse. Always square, never
 * stretched. Safe to call from a route handler or a metadata icon file.
 */
export async function renderAgencyAppIcon({ host, size, clientId }: RenderOpts) {
  let name = '';
  let primary = '#10b981';
  let iconSrc: string | null = null;
  let bg: string | null = null;
  let isDark = false;

  try {
    const agency = host ? await resolveAgency(host) : null;
    if (agency) {
      name = agency.name || '';
      primary = agency.primary_color || primary;
      isDark = agency.website_theme === 'dark';
      bg = agency.logo_background_color || null;
      // Dedicated square app icon wins over the wordmark logo.
      iconSrc = agency.app_icon_url || agency.logo_url || null;
    }

    // Client override: a client with its own logo installs with their brand.
    if (clientId) {
      const { data: client } = await supabase
        .from('clients')
        .select('logo_url, primary_color, logo_background_color')
        .eq('id', clientId)
        .single();
      if (client) {
        if (client.logo_url) iconSrc = client.logo_url;
        if (client.primary_color) primary = client.primary_color;
        if (client.logo_background_color) bg = client.logo_background_color;
      }
    }
  } catch {
    // Fall through to the default initial tile below.
  }

  const background = bg || (isDark ? '#0a0a0a' : '#ffffff');

  if (iconSrc) {
    // 0.78 keeps the artwork inside the maskable safe zone (center 80%), so a
    // maskable crop trims only the background, never the logo. The solid
    // background fills edge-to-edge for the same reason.
    const inner = Math.round(size * 0.78);
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconSrc} width={inner} height={inner} style={{ objectFit: 'contain' }} />
        </div>
      ),
      { width: size, height: size }
    );
  }

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
