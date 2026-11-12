// app/agency-site/industry/[slug]/page.tsx
// ============================================================================
// SERVER COMPONENT: an agency's industry-specific landing page, served on the
// agency host at /auto, /medspa, /law, etc. (the middleware rewrites those
// slugs here). Reuses the agency's own branded homepage renderer with the
// industry copy overlaid, and emits its own SEO title / description / canonical
// so each page stands on its own instead of competing with the homepage.
// ============================================================================
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AgencySiteClient from '../../client-page';
import { getIndustryPage } from '@/lib/industry-pages';

export const dynamic = 'force-dynamic';

async function getAgencyByHost(host: string) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (!backendUrl || !host) return null;
  try {
    const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.agency || ['suspended', 'deleted'].includes(data.agency.status)) return null;
    return data.agency;
  } catch {
    return null;
  }
}

function hasMarketingSiteAccess(agency: any): boolean {
  const status = agency.subscription_status;
  if (status === 'trial' || status === 'trialing') return true;
  const plan = (agency.plan_type || '').toLowerCase();
  return ['professional', 'enterprise', 'scale', 'pro'].includes(plan);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getIndustryPage(slug);
  if (!page) return {};
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
  const agency = await getAgencyByHost(host);
  if (!agency || agency.marketing_site_enabled === false || !hasMarketingSiteAccess(agency)) return {};

  const base = host ? { metadataBase: new URL(`https://${host}`) } : {};
  const canonical = host ? `https://${host}/${page.slug}` : undefined;
  const title = page.metaTitle(agency.name);
  const description = page.metaDescription(agency.name);

  return {
    ...base,
    title: { absolute: title },
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: { index: true, follow: true },
    openGraph: { title, description, type: 'website', ...(canonical ? { url: canonical } : {}) },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function AgencyIndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getIndustryPage(slug);
  if (!page) notFound();

  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
  const agency = await getAgencyByHost(host);
  if (!agency || agency.marketing_site_enabled === false || !hasMarketingSiteAccess(agency)) notFound();

  return <AgencySiteClient agency={agency} industry={page} />;
}
