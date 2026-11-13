// app/agency-site/industry/[slug]/page.tsx
// ============================================================================
// SERVER COMPONENT: an agency's landing page served on the agency host at a
// single-segment slug (the middleware rewrites those slugs here). The slug
// resolves to one of three things, in order:
//   1. a built-in industry page (lib/industry-pages: /auto, /medspa, /law), or
//   2. the agency's own custom page (marketing_config.customPages[slug]), or
//   3. nothing -> 404.
// Either kind reuses the agency's branded homepage renderer with its copy
// overlaid, and emits its own SEO title / description / canonical.
//
// Draft custom pages 404 publicly; they render only when the editor/preview
// loads the page with ?preview=1 or ?editor=1 (the in-context editor's iframe).
// ============================================================================
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AgencySiteClient from '../../client-page';
import { getIndustryPage } from '@/lib/industry-pages';
import type { CustomPage } from '@/types/marketing';

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

// Pull the agency's custom page for this slug out of marketing_config, if any.
function getCustomPage(agency: any, slug: string): CustomPage | null {
  const pages = agency?.marketing_config?.customPages;
  if (!pages || typeof pages !== 'object') return null;
  const page = pages[slug];
  if (!page || typeof page !== 'object' || !page.slug) return null;
  return page as CustomPage;
}

// The serializable page data the renderer reads. `custom` tells the client to
// overlay from marketing_config.customPages instead of industryPages.
function builtInToData(page: ReturnType<typeof getIndustryPage>) {
  if (!page) return null;
  // Pass the whole rich page minus the server-only meta functions (which cannot
  // cross the RSC boundary). The client renders the dedicated industry layout.
  const { metaTitle, metaDescription, ...rest } = page;
  return { ...rest, custom: false };
}
function customToData(page: CustomPage) {
  return {
    slug: page.slug,
    industryValue: '',
    label: page.label,
    headline: page.headline,
    subheadline: page.subheadline,
    problems: page.problems,
    sampleCall: page.sampleCall,
    faqs: page.faqs,
    custom: true,
  };
}

function isPreviewRequest(searchParams: Record<string, string | string[] | undefined>): boolean {
  const flag = (k: string) => {
    const v = searchParams[k];
    return v === '1' || v === 'true' || (Array.isArray(v) && (v.includes('1') || v.includes('true')));
  };
  return flag('preview') || flag('editor');
}

export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
  const agency = await getAgencyByHost(host);
  if (!agency || agency.marketing_site_enabled === false || !hasMarketingSiteAccess(agency)) return {};

  const base = host ? { metadataBase: new URL(`https://${host}`) } : {};
  const canonical = host ? `https://${host}/${slug}` : undefined;

  const builtIn = getIndustryPage(slug);
  if (builtIn) {
    const title = builtIn.metaTitle(agency.name);
    const description = builtIn.metaDescription(agency.name);
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

  const custom = getCustomPage(agency, slug);
  if (!custom) return {};
  // Drafts (and any preview load) are never indexed.
  const published = custom.status === 'published';
  if (!published && !isPreviewRequest(sp)) return {};
  const title = `${custom.label} | ${agency.name}`;
  const description = custom.subheadline || '';
  return {
    ...base,
    title: { absolute: title },
    description,
    alternates: published && canonical ? { canonical } : undefined,
    robots: { index: published, follow: published },
    openGraph: { title, description, type: 'website', ...(canonical ? { url: canonical } : {}) },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function AgencyLandingPage(
  { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const { slug } = await params;
  const sp = await searchParams;

  const headersList = await headers();
  const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
  const agency = await getAgencyByHost(host);
  if (!agency || agency.marketing_site_enabled === false || !hasMarketingSiteAccess(agency)) notFound();

  // Built-in industry page wins over any custom page with the same slug.
  const builtIn = builtInToData(getIndustryPage(slug));
  if (builtIn) {
    return <AgencySiteClient agency={agency} industry={builtIn as any} />;
  }

  const custom = getCustomPage(agency, slug);
  if (!custom) notFound();
  // Drafts only render inside the editor/preview; publicly they 404.
  if (custom.status !== 'published' && !isPreviewRequest(sp)) notFound();

  return <AgencySiteClient agency={agency} industry={customToData(custom) as any} />;
}
