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

// Runs before hydration, before any client page reads its token. In a PREVIEW
// tab (flagged in sessionStorage by /client/preview), it redirects the auth-key
// reads/writes that client pages make against localStorage over to
// sessionStorage instead. localStorage is shared across every tab on the origin,
// so the old behavior of writing the client's preview token into
// localStorage.auth_token overwrote the agency's own token in their other tab
// and signed them out. sessionStorage is tab-scoped, so the preview credential
// stays inside the preview tab and the agency's session is never disturbed.
// In a NORMAL tab it also clears any legacy preview flags a pre-fix build may
// have left in localStorage, so a real client is never shown a stale banner.
const PREVIEW_AUTH_BOOTSTRAP = `(function(){try{
var ss=window.sessionStorage,ls=window.localStorage;
if(ss.getItem('preview_mode')==='true'){
var M={auth_token:'preview_auth_token',client:'preview_client',user:'preview_user',preview_mode:'preview_mode'};
var g=ls.getItem.bind(ls),s=ls.setItem.bind(ls),r=ls.removeItem.bind(ls);
ls.getItem=function(k){return M[k]?ss.getItem(M[k]):g(k);};
ls.setItem=function(k,v){if(M[k]){ss.setItem(M[k],v);return;}return s(k,v);};
ls.removeItem=function(k){if(M[k]){ss.removeItem(M[k]);return;}return r(k);};
}else{
ls.removeItem('preview_mode');ls.removeItem('agency_auth_backup');ls.removeItem('agency_data_backup');ls.removeItem('agency_user_backup');ls.removeItem('agency_client_backup');
}
}catch(e){}})();`;

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PREVIEW_AUTH_BOOTSTRAP }} />
      <ClientShell>{children}</ClientShell>
    </>
  );
}