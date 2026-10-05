import { headers } from 'next/headers';
import MissedCallCalculator from '@/components/MissedCallCalculator';

export const dynamic = 'force-dynamic';

async function fetchAgency(url: string) {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.agency || ['suspended', 'deleted'].includes(d.agency.status)) return null;
    return d.agency;
  } catch { return null; }
}

// Public, brandable calculator. Reachable on every host:
//  - on an agency's own domain/subdomain, middleware sets x-agency-id, so it
//    auto-brands with no params.
//  - shared from the dashboard origin, ?a={agencyId} carries the brand.
//  - price / CTA ride along as params (set in the Get Clients dashboard page).
export default async function CalculatorPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const backend = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  const h = await headers();
  const headerAgencyId = h.get('x-agency-id') || '';
  const host = h.get('host') || h.get('x-forwarded-host') || '';
  const sp = await searchParams;
  const paramId = sp.a || '';

  let agency: any = null;
  if (backend) {
    if (headerAgencyId) agency = await fetchAgency(`${backend}/api/agency/by-id?id=${encodeURIComponent(headerAgencyId)}`);
    if (!agency && paramId) agency = await fetchAgency(`${backend}/api/agency/by-id?id=${encodeURIComponent(paramId)}`);
    if (!agency && host) agency = await fetchAgency(`${backend}/api/agency/by-host?host=${encodeURIComponent(host)}`);
  }

  const price = sp.price ? Math.max(0, parseInt(sp.price, 10) || 0) : 297;
  const ctaText = sp.ctatext || 'Set up a test line you can call';
  const ctaUrl = sp.ctaurl || undefined;

  const businessName = agency?.business_name || agency?.name || '';
  const accentColor = agency?.accent_color || agency?.primary_color || '#3B82F6';
  const logoUrl = agency?.logo_url || null;

  return (
    <main style={{ minHeight: '100vh', background: '#F5F6F8', padding: '28px 16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: 1040 }}>
        <MissedCallCalculator
          businessName={businessName}
          accentColor={accentColor}
          logoUrl={logoUrl}
          clientPrice={price}
          ctaText={ctaText}
          ctaUrl={ctaUrl}
        />
      </div>
    </main>
  );
}
