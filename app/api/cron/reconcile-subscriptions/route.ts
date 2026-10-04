import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Daily sweep: cancels clients whose Stripe subscription is gone/canceled and
// releases their numbers, so a manual Stripe cancel (or a missed webhook) can't
// leave a ghost client billing forever. Proxies to the backend reconcile
// endpoint, which is itself idempotent and guarded by CRON_SECRET.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || '';

  try {
    const response = await fetch(`${backendUrl}/api/cron/reconcile-subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || '',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reconcile-subscriptions cron proxy error:', error);
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 500 });
  }
}
