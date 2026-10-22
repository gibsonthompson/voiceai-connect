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
  branding_overrides: Record<string, string> | null;
}

async function resolveAgency(host: string): Promise<IconAgency | null> {
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const cols = 'name, logo_url, app_icon_url, primary_color, logo_background_color, website_theme, branding_overrides';

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

// Resolve the agency directly by id. The dashboard knows the logged-in agency,
// but its host is the platform domain, where resolveAgency(host) cannot match a
// subdomain slug or a verified marketing domain, so it would fall through to the
// default tile. Passing the id resolves the right agency regardless of host.
async function resolveAgencyById(id: string): Promise<IconAgency | null> {
  const cols = 'name, logo_url, app_icon_url, primary_color, logo_background_color, website_theme, branding_overrides';
  const { data } = await supabase.from('agencies').select(cols).eq('id', id).single();
  return (data as IconAgency) || null;
}

function isValidHexColor(v?: string | null): boolean {
  return typeof v === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());
}
function isLightHex(hex: string): boolean {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}
// The dashboard page background the agency actually sees, mirroring
// hooks/useTheme.ts, so the favicon square matches the color scheme instead of
// the logo_background_color tile (which can be black on a light theme, the bug
// this fixes). Mode follows website_theme the same way the dashboard does
// (anything not 'light' is dark), and a page_bg override only applies when its
// brightness fits the mode, exactly like the theme's mode-gating.
function resolveThemeBg(agency: IconAgency): string {
  const mode: 'dark' | 'light' = agency.website_theme === 'light' ? 'light' : 'dark';
  const baseBg = mode === 'dark' ? '#050505' : '#f9fafb';
  const override = agency.branding_overrides ? agency.branding_overrides.page_bg : null;
  if (isValidHexColor(override)) {
    const light = isLightHex(override as string);
    if (mode === 'dark' ? !light : light) return override as string;
  }
  return baseBg;
}

interface RenderOpts {
  host: string;
  size: number;
  clientId?: string | null;
  agencyId?: string | null;
}

/**
 * Renders a square app icon as a PNG ImageResponse. Always square, never
 * stretched. Safe to call from a route handler or a metadata icon file.
 */
export async function renderAgencyAppIcon({ host, size, clientId, agencyId }: RenderOpts) {
  let name = '';
  let primary = '#10b981';
  let iconSrc: string | null = null;
  let bg: string | null = null;

  try {
    const agency = agencyId ? await resolveAgencyById(agencyId) : (host ? await resolveAgency(host) : null);
    if (agency) {
      name = agency.name || '';
      primary = agency.primary_color || primary;
      bg = resolveThemeBg(agency);
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

  const background = bg || '#f9fafb';

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
