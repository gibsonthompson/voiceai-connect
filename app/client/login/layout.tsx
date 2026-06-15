// app/client/login/layout.tsx
//
// SERVER component (no 'use client'). Its only job is to emit per-agency
// Open Graph / link-preview metadata that lives in the initial server HTML,
// so link-preview scrapers (iMessage, Slack, etc.) that do NOT run JavaScript
// see the agency's name and logo instead of the platform default.
//
// The interactive login UI itself is the client component in page.tsx; this
// layout just wraps it and contributes metadata.
//
// Why here: the client login page is fully client-rendered and middleware
// skips /client/*, so without this the only metadata in the server HTML is
// the root VoiceAI Connect title + the site-wide opengraph-image card.

import type { Metadata } from 'next';
import { headers } from 'next/headers';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://urchin-app-bqb4i.ondigitalocean.app';

function isPlatformHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === PLATFORM_DOMAIN ||
    h === `www.${PLATFORM_DOMAIN}` ||
    h.startsWith('localhost')
  );
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const h = await headers();
    const host = (h.get('host') || '').toLowerCase();

    // Platform domain (or local dev): leave the root VoiceAI metadata in place.
    if (!host || isPlatformHost(host)) return {};

    const res = await fetch(
      `${BACKEND_URL}/api/agency/by-host?host=${encodeURIComponent(host)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return {};

    const data = await res.json();
    const agency = data?.agency;
    if (!agency) return {};

    const name: string = agency.name || 'Client Portal';
    const title = `${name} — Client Login`;
    const description = `Sign in to your ${name} dashboard.`;
    const url = `https://${host}/client/login`;
    const logo: string | null = agency.logo_url || null;

    const meta: Metadata = {
      // `absolute` bypasses the root layout's title template
      // ("%s | VoiceAI Connect"), which would otherwise append the platform
      // brand onto the agency's title (and onto the <title> that iMessage
      // falls back to when og:title is absent).
      title: { absolute: title },
      description,
      // Override the root metadataBase so any relative URLs resolve to this
      // agency host. (og:image / og:url below are absolute anyway.)
      metadataBase: new URL(`https://${host}`),
      openGraph: {
        type: 'website',
        url,
        siteName: name,
        title,
        description,
        // Defining openGraph here overrides the root segment's openGraph,
        // including the site-wide VoiceAI opengraph-image, for this route.
        ...(logo ? { images: [{ url: logo }] } : {}),
      },
      twitter: {
        card: 'summary',
        title,
        description,
        ...(logo ? { images: [logo] } : {}),
      },
      // Agency logo as the link-preview icon (the small favicon slot iMessage
      // shows next to the card). Absolute URL, so no host-resolution problem.
      // NOTE: the root layout also emits VoiceAI favicon links (hardcoded
      // <link> tags plus the app/icon.* file conventions) on every route, which
      // coexist with these. If the small icon still resolves to VoiceAI, those
      // sources have to be suppressed for this route (see app/icon.tsx /
      // app/apple-icon.tsx).
      ...(logo ? { icons: { icon: [{ url: logo }], shortcut: [{ url: logo }], apple: [{ url: logo }] } } : {}),
    };

    return meta;
  } catch {
    // Any failure: fall back to inherited (root) metadata rather than break the page.
    return {};
  }
}

export default function ClientLoginMetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}