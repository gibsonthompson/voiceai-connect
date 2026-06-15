// app/client/layout.tsx
//
// SERVER layout for the entire /client route group (dashboard + login + all
// client pages). Its job is to emit AGENCY-branded metadata so these pages
// never show "VoiceAI Connect" branding — that platform branding belongs only
// on the platform marketing site and blog, not on a client's dashboard.
//
// The interactive layout (sidebar, ClientProvider, route guard, etc.) lives in
// client-shell.tsx, a client component. Client components can't export
// metadata, which is the only reason this server wrapper exists.
//
// These routes are already dynamic (auth-gated, not statically generated for
// SEO), so reading the host here costs nothing — it does NOT deopt the static
// blog/marketing pages, which live in other route groups and keep their own
// (VoiceAI) metadata untouched.
//
// The OG image is provided by app/client/opengraph-image.tsx (host-aware,
// agency-branded). We set metadataBase to the request host so that image URL
// resolves to the agency's own host.

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import ClientShell from './client-shell';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://urchin-app-bqb4i.ondigitalocean.app';

function isPlatformHost(host: string): boolean {
  const h = host.toLowerCase();
  return !h || h === PLATFORM_DOMAIN || h === `www.${PLATFORM_DOMAIN}` || h.startsWith('localhost');
}

export async function generateMetadata(): Promise<Metadata> {
  // Client dashboards must never be indexed as part of the platform.
  const robots = { index: false, follow: false } as const;

  try {
    const h = await headers();
    const host = (h.get('host') || '').toLowerCase();

    // Clients normally never reach /client on the platform host. If they do,
    // fall back to a neutral title — never the VoiceAI marketing title.
    if (isPlatformHost(host)) {
      return { title: { absolute: 'Client Portal' }, robots };
    }

    let agency: any = null;
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/agency/by-host?host=${encodeURIComponent(host)}`,
        { cache: 'no-store' }
      );
      if (res.ok) agency = (await res.json())?.agency;
    } catch {}

    const name: string = agency?.name || 'Client Portal';
    const description = `Sign in to your ${name} dashboard.`;
    const logo: string | null = agency?.logo_url || null;

    return {
      // `absolute` bypasses the root "%s | VoiceAI Connect" template so the
      // <title> (and the share-card title) is the agency, not the platform.
      title: { absolute: name },
      description,
      // Make the OG image URL (from opengraph-image.tsx) resolve to this host.
      metadataBase: new URL(`https://${host}`),
      robots,
      openGraph: {
        type: 'website',
        url: `https://${host}`,
        siteName: name,
        title: name,
        description,
        // images intentionally omitted — app/client/opengraph-image.tsx
        // supplies the agency-branded card and overrides the root one.
      },
      twitter: {
        card: 'summary',
        title: name,
        description,
      },
      // Agency logo as the favicon/link-preview icon for client pages.
      ...(logo
        ? { icons: { icon: [{ url: logo }], shortcut: [{ url: logo }], apple: [{ url: logo }] } }
        : {}),
    };
  } catch {
    return { title: { absolute: 'Client Portal' }, robots };
  }
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}