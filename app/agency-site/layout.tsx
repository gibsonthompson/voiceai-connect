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

  if (!agency) {
    return {
      title: 'AI Phone Answering',
      description: 'Professional AI receptionist that answers every call 24/7.',
    };
  }

  const title = agency.og_title || `${agency.name} - AI Phone Answering`;
  const description =
    agency.og_description ||
    agency.company_tagline ||
    'Professional AI receptionist that answers every call 24/7. Never miss another customer.';
  const image = agency.og_image_url || agency.logo_url || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
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
        Inline script to prevent white flash on dark-themed agency sites.
        Reads cached theme from sessionStorage BEFORE React hydrates.
        This runs synchronously before paint.
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
                }
              } catch(e) {}
            })();
          `,
        }}
      />
      <div style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </>
  );
}