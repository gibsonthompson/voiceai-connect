// app/agency-site/layout.tsx
import type { Metadata } from 'next';
import { headers } from 'next/headers';

// ============================================================================
// SERVER-SIDE AGENCY FETCH (for metadata only)
// ============================================================================
async function getAgencyByHost(host: string) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (!backendUrl || !host) return null;

  try {
    const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.agency || ['suspended', 'deleted'].includes(data.agency.status)) return null;
    return data.agency;
  } catch {
    return null;
  }
}

// ============================================================================
// GENERATE METADATA (server-side — crawlers can read these)
// ============================================================================
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';

  const agency = await getAgencyByHost(host);

  // metadataBase = the agency host so the OG image URL (served by
  // app/agency-site/opengraph-image.tsx) resolves to THIS host. That image
  // route reads the host to render the agency's own card, so it must be hit
  // on the agency host, not the platform.
  const base = host ? { metadataBase: new URL(`https://${host}`) } : {};

  if (!agency) {
    return {
      ...base,
      title: 'AI Phone Answering',
      description: 'Professional AI receptionist that answers every call 24/7.',
    };
  }

  const title = agency.og_title || `${agency.name} - AI Phone Answering`;
  const description =
    agency.og_description ||
    agency.company_tagline ||
    'Professional AI receptionist that answers every call 24/7. Never miss another customer.';

  return {
    ...base,
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(host ? { url: `https://${host}` } : {}),
      // OG image intentionally NOT set here. app/agency-site/opengraph-image.tsx
      // owns it: it re-serves the agency's uploaded og_image_url when present,
      // else renders a clean agency card. Using the file convention guarantees
      // it overrides the root VoiceAI sales image (closest image file wins),
      // which config-based images are not guaranteed to do.
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    ...(agency.logo_url
      ? {
          icons: {
            icon: agency.logo_url,
            apple: agency.logo_url,
          },
        }
      : {}),
  };
}

// ============================================================================
// LAYOUT
// ============================================================================
export default function AgencySiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 
        Inline script to prevent flash on themed agency sites.
        Sets background on <html> BEFORE React hydrates so the
        body's default dark background from globals.css doesn't bleed through.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var t = sessionStorage.getItem('agency_theme');
                if (t === 'dark') {
                  document.documentElement.style.backgroundColor = '#0f0f0f';
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.style.backgroundColor = '#ffffff';
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch(e) {
                document.documentElement.style.backgroundColor = '#ffffff';
              }
            })();
          `,
        }}
      />
      <div style={{ minHeight: '100vh',  }}>
        {children}
      </div>
    </>
  );
}