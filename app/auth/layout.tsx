// app/auth/layout.tsx
//
// Host-aware metadata for the auth routes (/auth/set-password,
// /auth/forgot-password, /auth/callback, /auth/google-success,
// /auth/agency-preview). Same white-label fix as app/signup/layout.tsx: these
// routes are not rewritten to /agency-site, so without this an agency-host auth
// link would emit the VoiceAI opengraph-image on the agency's own domain.
//
// On an AGENCY host it re-bases metadataBase to the agency origin and points
// og:image at /api/agency-og (the agency card). On the PLATFORM host it returns
// no overrides, so the root VoiceAI card applies unchanged.

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

  if (isPlatformHost(host)) return {};

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

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}