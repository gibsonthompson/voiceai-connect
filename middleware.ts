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

// Stripe-supported countries (for geo-detection validation)
const SUPPORTED_COUNTRIES = new Set([
  'US','CA','MX','GB','AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR',
  'DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','NO','PL','PT','RO',
  'SK','SI','ES','SE','CH','AU','NZ','JP','SG','HK','MY','TH','IN','AE','BR',
]);

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Skip static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // Create a response that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // =========================================================================
  // GEO-DETECTION: Set country cookie from Vercel headers
  // =========================================================================
  const existingCountryCookie = request.cookies.get('vc_country')?.value;
  if (!existingCountryCookie) {
    const detectedCountry = request.headers.get('x-vercel-ip-country') || 'US';
    // Only set if it's a Stripe-supported country, otherwise default to US
    const validCountry = SUPPORTED_COUNTRIES.has(detectedCountry) ? detectedCountry : 'US';
    response.cookies.set('vc_country', validCountry, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });
  }

  // Create Supabase client for middleware
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
  // ROUTING LOGIC
  // =========================================================================

  // 1. Check if this is the main platform domain
  if (PLATFORM_DOMAINS.includes(hostname)) {
    // Platform domain - serve platform pages directly
    // No rewrites needed, no agency cookie
    return response;
  }

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
      // Set agency context in headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-agency-id', agency.id);
      requestHeaders.set('x-agency-name', agency.name);
      requestHeaders.set('x-agency-slug', agency.slug || '');
      
      // Set agency ID cookie for client-side access
      response.cookies.set('agency_id', agency.id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      // Only rewrite routes that exist in (agency-site) folder
      // /signup pages are unified and detect context client-side
      if (pathname === '/' || pathname.startsWith('/get-started')) {
        const url = request.nextUrl.clone();
        url.pathname = `/agency-site${pathname}`;
        
        // Preserve geo cookie on rewrite response
        const rewriteResponse = NextResponse.rewrite(url, {
          request: {
            headers: requestHeaders,
          },
        });
        
        // Copy cookies to rewrite response
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
      
      // For all other routes (/signup, /agency, /client, /login, etc.)
      // Just pass through with the agency cookie set - pages handle context detection
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
        headers: response.headers,
      });
    }
  }

  // 3. Check for custom agency domain
  const { data: customDomainAgency } = await supabase
    .from('agencies')
    .select('id, name, status, slug, marketing_domain')
    .eq('marketing_domain', hostname.replace('www.', ''))
    .eq('domain_verified', true)
    .in('status', ['active', 'trial'])
    .single();

  if (customDomainAgency) {
    // Set agency context in headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-agency-id', customDomainAgency.id);
    requestHeaders.set('x-agency-name', customDomainAgency.name);
    requestHeaders.set('x-agency-slug', customDomainAgency.slug || '');
    
    // Set agency ID cookie for client-side access
    response.cookies.set('agency_id', customDomainAgency.id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
    
    // Only rewrite routes that exist in (agency-site) folder
    if (pathname === '/' || pathname.startsWith('/get-started')) {
      const url = request.nextUrl.clone();
      url.pathname = `/agency-site${pathname}`;
      
      const rewriteResponse = NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
      
      // Copy cookies to rewrite response
      if (!existingCountryCookie) {
        const detectedCountry = request.headers.get('x-vercel-ip-country') || 'US';
        const validCountry = SUPPORTED_COUNTRIES.has(detectedCountry) ? detectedCountry : 'US';
        rewriteResponse.cookies.set('vc_country', validCountry, {
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
          sameSite: 'lax',
        });
      }
      rewriteResponse.cookies.set('agency_id', customDomainAgency.id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      return rewriteResponse;
    }
    
    // For all other routes, pass through with agency cookie
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
      headers: response.headers,
    });
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
  ],
};