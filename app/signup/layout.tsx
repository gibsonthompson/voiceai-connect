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

  // Agency host: re-base to the agency origin and serve the agency card.
  const ogUrl = `https://${host}/api/agency-og`;
  return {
    metadataBase: new URL(`https://${host}`),
    openGraph: {
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogUrl],
    },
  };
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}