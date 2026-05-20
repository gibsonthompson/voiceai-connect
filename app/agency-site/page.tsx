// app/agency-site/page.tsx
// ============================================================================
// SERVER COMPONENT — Fetches agency data server-side for SEO/AEO
// Crawlers (Google, ChatGPT, Perplexity, etc.) see full content on first load.
// Previously this was a 'use client' component that fetched in useEffect,
// meaning crawlers only saw a loading spinner.
// ============================================================================
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AgencySiteClient from './client-page';

// ============================================================================
// SERVER-SIDE AGENCY FETCH (cached 5 minutes via ISR)
// Same pattern as layout.tsx generateMetadata
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
// PLAN ACCESS CHECK
// ============================================================================
function hasMarketingSiteAccess(agency: any): boolean {
  const status = agency.subscription_status;
  if (status === 'trial' || status === 'trialing') return true;
  const plan = agency.plan_type;
  if (!plan) return false;
  return ['professional', 'enterprise', 'scale', 'pro'].includes(plan.toLowerCase());
}

// ============================================================================
// PAGE (Server Component)
// ============================================================================
export default async function AgencySitePage() {
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';

  const agency = await getAgencyByHost(host);

  if (!agency) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Site not found</h1>
          <p style={{ color: '#6b7280' }}>This site is not available.</p>
        </div>
      </div>
    );
  }

  // If agency doesn't have marketing site access, redirect to signup
  if (!hasMarketingSiteAccess(agency)) {
    redirect('/get-started');
  }

  // Pass full agency data to client component for config building + rendering
  return <AgencySiteClient agency={agency} />;
}