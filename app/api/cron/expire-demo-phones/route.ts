import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Daily sweep: releases Free-tier demo lines whose 30-day window has passed
// (number freed on Telnyx + VAPI, demo fields cleared) so free demos stop
// billing on their own. Proxies to the backend endpoint with ?apply=true so it
// actually releases (no query = dry run). The backend is idempotent and guarded
// by CRON_SECRET.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || '';

  try {
    const response = await fetch(`${backendUrl}/api/cron/expire-demo-phones?apply=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Expire-demo-phones cron proxy error:', error);
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 500 });
  }
}