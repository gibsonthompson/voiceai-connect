import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Platform domain configuration
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
const PLATFORM_DOMAINS = [
  PLATFORM_DOMAIN,
  `www.${PLATFORM_DOMAIN}`,
  'localhost:3000',
  'localhost',
];

// Fixed icon paths that link-preview crawlers (SMS / iMessage) request by
// convention. They are physical files in /public, so they serve the same
// VoiceAI icon on every host. On an agency host we rewrite them to a
// host-aware route that renders the agency logo. (The matcher below also
// has to allow these through, since the default pattern excludes images.)
const ICON_PATHS = new Set([
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
]);

// Stripe-supported countries (for geo-detection validation)
const SUPPORTED_COUNTRIES = new Set([
  'US','CA','MX','GB','AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR',
  'DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','NO','PL','PT','RO',
  'SK','SI','ES','SE','CH','AU','NZ','JP','SG','HK','MY','TH','IN','AE','BR',
]);

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // =========================================================================
  // HOST-AWARE ICONS (must run BEFORE the static-file skip below).
  // Platform hosts pass through to the real /public files. Agency hosts get
  // the icon path rewritten to /api/agency-favicon, which reads the host and
  // renders that agency's logo. This is what makes the SMS link-preview icon
  // agency-branded, and it also makes the hardcoded /favicon-*.png <link> tags
  // in app/layout.tsx resolve to the agency logo on agency hosts.
  // =========================================================================
  if (ICON_PATHS.has(pathname)) {
    if (PLATFORM_DOMAINS.includes(hostname)) {
      return NextResponse.next();
    }
    const iconUrl = request.nextUrl.clone();
    iconUrl.pathname = '/api/agency-favicon';
    iconUrl.search = '';
    return NextResponse.rewrite(iconUrl);
  }

  // Skip static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // =========================================================================
  // Skip /client/* routes entirely — client dashboard pages don't need
  // subdomain context. They get all data from localStorage + backend API.
  // This prevents middleware from modifying headers/cookies on client page
  // requests (including RSC navigation fetches), which was corrupting
  // client-side navigation and causing the double-click tab switching bug.
  // =========================================================================
  if (pathname.startsWith('/client')) {
    return NextResponse.next();
  }

  // =========================================================================
  // Skip ALL internal Next.js navigation requests (RSC payloads from <Link>)
  // Comprehensive detection: headers, URL params, and accept types.
  // =========================================================================
  const isInternalNavigation =
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-State-Tree') ||
    request.headers.get('Next-Router-Prefetch') === '1' ||
    request.headers.get('accept')?.includes('text/x-component') ||
    request.nextUrl.searchParams.has('_rsc');

  if (isInternalNavigation) {
    return NextResponse.next();
  }

  // =========================================================================
  // GEO-DETECTION: Set country cookie from Vercel headers
  // =========================================================================
  const existingCountryCookie = request.cookies.get('vc_country')?.value;

  // =========================================================================
  // PLATFORM DOMAIN — return immediately, no Supabase needed
  // =========================================================================
  if (PLATFORM_DOMAINS.includes(hostname)) {
    if (!existingCountryCookie) {
      const detectedCountry = request.headers.get('x-vercel-ip-country') || 'US';
      const validCountry = SUPPORTED_COUNTRIES.has(detectedCountry) ? detectedCountry : 'US';
      const response = NextResponse.next();
      response.cookies.set('vc_country', validCountry, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
      return response;
    }
    return NextResponse.next();
  }

  // =========================================================================
  // SUBDOMAIN / CUSTOM DOMAIN — Supabase needed for agency lookup
  // =========================================================================

  // Create a response that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!existingCountryCookie) {
    const detectedCountry = request.headers.get('x-vercel-ip-country') || 'US';
    const validCountry = SUPPORTED_COUNTRIES.has(detectedCountry) ? detectedCountry : 'US';
    response.cookies.set('vc_country', validCountry, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
  }

  // Create Supabase client for middleware (only for subdomain/custom domain lookups)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // =========================================================================
  // HELPER: Rewrite to agency-site with all cookies/headers set
  // =========================================================================
  function rewriteToAgencySite(agency: { id: string; name: string; slug: string }) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-agency-id', agency.id);
    requestHeaders.set('x-agency-name', agency.name);
    requestHeaders.set('x-agency-slug', agency.slug || '');

    // Static marketing routes that live under /agency-site/.
    //
    // NOTE: /signup (the wizard entry point) and its siblings (/signup/plan,
    // /signup/success) are deliberately NOT in this list. They pass through
    // to the canonical multi-step wizard at app/signup/page.tsx so the
    // pages themselves can call /api/agency/by-host to resolve agency
    // context from the request host. The legacy /get-started URL is
    // handled at the next.config.ts redirect layer (308 to /signup with
    // query params preserved), so middleware never sees it.
    if (
      pathname === '/' ||
      pathname.startsWith('/demo') ||
      pathname.startsWith('/faq') ||
      pathname.startsWith('/terms') ||
      pathname.startsWith('/privacy')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/agency-site${pathname}`;

      const rewriteResponse = NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });

      if (!existingCountryCookie) {
        const detectedCountry = request.headers.get('x-vercel-ip-country') || 'US';
        const validCountry = SUPPORTED_COUNTRIES.has(detectedCountry) ? detectedCountry : 'US';
        rewriteResponse.cookies.set('vc_country', validCountry, {
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
          sameSite: 'lax',
        });
      }
      rewriteResponse.cookies.set('agency_id', agency.id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return rewriteResponse;
    }

    // For everything else (including /signup, /signup/plan, /signup/success,
    // /auth/*, etc.) pass through with the agency_id cookie set. The pages
    // themselves call /api/agency/by-host to resolve agency context from
    // the request host.
    const passResponse = NextResponse.next({
      request: { headers: requestHeaders },
      headers: response.headers,
    });
    passResponse.cookies.set('agency_id', agency.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return passResponse;
  }

  // =========================================================================
  // HELPER: Rewrite to site-unavailable page
  // =========================================================================
  function rewriteToUnavailable() {
    const url = request.nextUrl.clone();
    url.pathname = '/site-unavailable';
    return NextResponse.rewrite(url);
  }

  // =========================================================================
  // ROUTING LOGIC — subdomain and custom domain handling
  // (Platform domain already returned above before Supabase client creation)
  // =========================================================================

  // 2. Check for agency subdomain (xxx.myvoiceaiconnect.com)
  const subdomainMatch = hostname.match(new RegExp(`^([^.]+)\\.${PLATFORM_DOMAIN.replace('.', '\\.')}$`));
  if (subdomainMatch) {
    const slug = subdomainMatch[1];
    
    // Skip www subdomain
    if (slug === 'www') {
      return response;
    }
    
    // Look up agency by slug (allow active or trial status)
    const { data: agency } = await supabase
      .from('agencies')
      .select('id, name, status, slug')
      .eq('slug', slug)
      .in('status', ['active', 'trial'])
      .single();
    
    if (agency) {
      return rewriteToAgencySite(agency);
    }

    // Agency exists but not active — check if suspended/canceled
    const { data: inactiveAgency } = await supabase
      .from('agencies')
      .select('id, status')
      .eq('slug', slug)
      .single();

    if (inactiveAgency) {
      return rewriteToUnavailable();
    }
  }

  // 3. Check for custom agency domain
  const cleanHostname = hostname.replace('www.', '');

  const { data: customDomainAgency } = await supabase
    .from('agencies')
    .select('id, name, status, slug, marketing_domain')
    .eq('marketing_domain', cleanHostname)
    .eq('domain_verified', true)
    .in('status', ['active', 'trial'])
    .single();

  if (customDomainAgency) {
    return rewriteToAgencySite(customDomainAgency);
  }

  // Agency exists with this domain but not active — show unavailable
  const { data: inactiveCustomDomain } = await supabase
    .from('agencies')
    .select('id, status')
    .eq('marketing_domain', cleanHostname)
    .eq('domain_verified', true)
    .single();

  if (inactiveCustomDomain) {
    return rewriteToUnavailable();
  }

  // 4. Unknown domain - could be local dev or misconfigured
  console.log(`[Middleware] Unknown hostname: ${hostname}, pathname: ${pathname}`);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Icon paths are matched explicitly so they run through middleware and can
    // be made host-aware on agency hosts. The pattern above otherwise excludes
    // .ico/.png/.svg, so without these entries the rewrite would never fire.
    '/favicon.ico',
    '/favicon.svg',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
  ],
};