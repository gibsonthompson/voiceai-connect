// app/signup/layout.tsx
//
// Host-aware metadata for the signup wizard (/signup, /signup/plan,
// /signup/success). This route is NOT rewritten to /agency-site by middleware,
// so on an agency host it would otherwise inherit the root layout's platform
// metadataBase and emit the VoiceAI opengraph-image on the agency's own domain
// (an agency's dealerview.com/signup link showing the VoiceAI sales card). That
// is the white-label leak this layout closes.
//
// On an AGENCY host it:
//   - re-bases metadataBase to the agency host, so any relative image URL
//     (including the root file-convention /opengraph-image) resolves to the
//     agency origin, where middleware rewrites it to /api/agency-og; and
//   - explicitly points openGraph/twitter images at /api/agency-og.
// Both point at the agency card, so whichever tag a crawler picks, it is the
// agency's card, never VoiceAI.
//
// On the PLATFORM host it returns no overrides, so the redesigned root
// VoiceAI card (app/opengraph-image.tsx) applies unchanged.

import type { Metadata } from 'next';
import { headers } from 'next/headers';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

function isPlatformHost(host: string): boolean {
  return (
    !host ||
    host === PLATFORM_DOMAIN ||
    host === `www.${PLATFORM_DOMAIN}` ||
    host.startsWith('localhost')
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = (headersList.get('host') || headersList.get('x-forwarded-host') || '').toLowerCase();

  // Platform host: no override, root VoiceAI metadata/image applies.
  if (isPlatformHost(host)) return {};

  // Agency host: the <title> must be the agency's name, never the root
  // "VoiceAI Connect: White-Label..." default. Start from a neutral agency-host
  // title so that even if the agency lookup fails we never leak the platform title.
  const ogUrl = `https://${host}/api/agency-og`;
  const meta: Metadata = {
    metadataBase: new URL(`https://${host}`),
    title: { absolute: 'Get Started' },
    openGraph: { images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', images: [ogUrl] },
  };

  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
    if (BACKEND_URL) {
      const res = await fetch(`${BACKEND_URL}/api/agency/by-host?host=${encodeURIComponent(host)}`, { cache: 'no-store' });
      if (res.ok) {
        const agency = (await res.json())?.agency;
        if (agency && !['suspended', 'deleted'].includes(agency.status) && agency.name) {
          // `absolute` bypasses the root "%s | VoiceAI Connect" title template.
          meta.title = { absolute: agency.name };
          meta.description = agency.company_tagline || agency.og_description || `Start your AI receptionist with ${agency.name}.`;
          (meta.openGraph as any).title = agency.name;
          (meta.openGraph as any).siteName = agency.name;
          (meta.twitter as any).title = agency.name;
          if (agency.logo_url) meta.icons = { icon: agency.logo_url, apple: agency.logo_url };
        }
      }
    }
  } catch { /* keep the neutral agency-host metadata above */ }

  return meta;
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}