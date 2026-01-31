import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const hostname = request.headers.get('host') || '';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const fullOrigin = `${protocol}://${hostname}`;
    
    // Default manifest
    let name = 'Dashboard';
    let shortName = 'Dashboard';
    let themeColor = '#3b82f6';
    let backgroundColor = '#f9fafb';
    let iconUrl = '/icon.png';
    
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
    
    // Check if this is an agency subdomain
    const subdomainMatch = hostname.match(new RegExp(`^([^.]+)\\.${platformDomain.replace('.', '\\.')}$`));
    
    let agency = null;
    
    if (subdomainMatch) {
      // It's a subdomain like bobjweb.myvoiceaiconnect.com
      const slug = subdomainMatch[1];
      
      const { data } = await supabase
        .from('agencies')
        .select('id, name, slug, logo_url, primary_color')
        .eq('slug', slug)
        .single();
      
      agency = data;
    } else {
      // Check if it's a custom domain
      const cleanHostname = hostname.replace('www.', '').split(':')[0];
      
      const { data } = await supabase
        .from('agencies')
        .select('id, name, slug, logo_url, primary_color')
        .eq('marketing_domain', cleanHostname)
        .eq('domain_verified', true)
        .single();
      
      agency = data;
    }
    
    if (agency) {
      name = `${agency.name}`;
      shortName = agency.name.split(' ')[0] || 'Dashboard';
      themeColor = agency.primary_color || themeColor;
      
      // Use agency logo if available
      if (agency.logo_url) {
        iconUrl = agency.logo_url;
      }
    }
    
    // CRITICAL: start_url must be the FULL URL to keep user on this domain
    const manifest = {
      name: name,
      short_name: shortName,
      description: 'Manage your AI receptionist',
      start_url: `${fullOrigin}/client/dashboard`,
      scope: `${fullOrigin}/`,
      display: 'standalone',
      background_color: backgroundColor,
      theme_color: themeColor,
      orientation: 'portrait-primary',
      icons: [
        {
          src: iconUrl.startsWith('http') ? iconUrl : `${fullOrigin}${iconUrl}`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: iconUrl.startsWith('http') ? iconUrl : `${fullOrigin}${iconUrl}`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Client manifest error:', error);
    
    // Return default manifest on error
    return NextResponse.json({
      name: 'Dashboard',
      short_name: 'Dashboard',
      description: 'Manage your AI receptionist',
      start_url: '/client/dashboard',
      display: 'standalone',
      background_color: '#f9fafb',
      theme_color: '#3b82f6',
      icons: [
        { src: '/icon.png', sizes: '192x192', type: 'image/png' }
      ]
    }, {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    });
  }
}