import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await clearAuthCookie();
  
  // Get the referer to determine where to redirect
  const referer = request.headers.get('referer') || '';
  
  // If coming from agency dashboard, redirect to agency login
  if (referer.includes('/agency/')) {
    return NextResponse.redirect(new URL('/agency/login', request.url));
  }
  
  // If coming from client dashboard, redirect to client login
  if (referer.includes('/client/')) {
    return NextResponse.redirect(new URL('/client/login', request.url));
  }
  
  // Default redirect to home
  return NextResponse.redirect(new URL('/', request.url));
}

export async function POST(request: NextRequest) {
  await clearAuthCookie();
  
  return NextResponse.json({ success: true });
}
