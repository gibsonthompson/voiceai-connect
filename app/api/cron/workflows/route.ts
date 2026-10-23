import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Runs every minute: advances workflow runs whose timer is due (the next
// message in a drip, a send held for quiet hours, an elapsed wait). The
// immediate missed-call text goes out inline at enrollment, so this scheduler
// only drives the delayed steps. Proxies to the backend, guarded by CRON_SECRET.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || '';

  try {
    const response = await fetch(`${backendUrl}/api/cron/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || '',
      },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Workflows cron proxy error:', error);
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 500 });
  }
}
