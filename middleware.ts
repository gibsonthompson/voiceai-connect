import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Platform domain configuration
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'voiceaiconnect.com';
const PLATFORM_DOMAINS = [
  PLATFORM_DOMAIN,
  `www.${PLATFORM_DOMAIN}`,
  'localhost:3000',
  'localhost',
];

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
    // Serve platform landing pages
    // Routes: /, /pricing, /features, /signup, /login
    return response;
  }

  // 2. Check for agency subdomain (xxx.voiceaiconnect.com)
  const subdomainMatch = hostname.match(new RegExp(`^([^.]+)\\.${PLATFORM_DOMAIN.replace('.', '\\.')}$`));
  if (subdomainMatch) {
    const slug = subdomainMatch[1];
    
    // Skip www subdomain
    if (slug === 'www') {
      return response;
    }
    
    // Look up agency by slug
    const { data: agency } = await supabase
      .from('agencies')
      .select('id, name, status, slug')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();
    
    if (agency) {
      // Set agency context in headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-agency-id', agency.id);
      requestHeaders.set('x-agency-name', agency.name);
      requestHeaders.set('x-agency-slug', agency.slug || '');
      
      // Rewrite to agency-site routes
      const url = request.nextUrl.clone();
      
      // Map routes to agency-site folder
      if (pathname === '/') {
        url.pathname = '/(agency-site)';
      } else if (pathname.startsWith('/signup')) {
        url.pathname = `/(agency-site)${pathname}`;
      } else if (pathname.startsWith('/agency') || pathname.startsWith('/client')) {
        // Protected dashboard routes - pass through
        url.pathname = pathname;
      } else {
        url.pathname = `/(agency-site)${pathname}`;
      }
      
      response = NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
      
      // Set agency ID cookie for client-side access
      response.cookies.set('agency_id', agency.id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      return response;
    }
  }

  // 3. Check for custom agency domain
  const { data: customDomainAgency } = await supabase
    .from('agencies')
    .select('id, name, status, slug, marketing_domain')
    .eq('marketing_domain', hostname.replace('www.', ''))
    .eq('domain_verified', true)
    .eq('status', 'active')
    .single();

  if (customDomainAgency) {
    // Set agency context
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-agency-id', customDomainAgency.id);
    requestHeaders.set('x-agency-name', customDomainAgency.name);
    requestHeaders.set('x-agency-slug', customDomainAgency.slug || '');
    
    const url = request.nextUrl.clone();
    
    // Map routes to agency-site folder
    if (pathname === '/') {
      url.pathname = '/(agency-site)';
    } else if (pathname.startsWith('/signup')) {
      url.pathname = `/(agency-site)${pathname}`;
    } else if (pathname.startsWith('/agency') || pathname.startsWith('/client')) {
      // Protected dashboard routes
      url.pathname = pathname;
    } else {
      url.pathname = `/(agency-site)${pathname}`;
    }
    
    response = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
    
    response.cookies.set('agency_id', customDomainAgency.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return response;
  }

  // 4. Unknown domain - could be local dev or misconfigured
  // Allow through but log for debugging
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
