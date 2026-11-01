import { NextResponse } from 'next/server';

// Vercel cron -> forwards to the DO backend, which polls the bank-alert email
// inbox over IMAP and writes any new transactions into HQ. Same pattern as the
// other cron forwarders. Scheduled in vercel.json (every 15 min).
export async function GET(request: Request) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const response = await fetch(`${backendUrl}/api/cron/finance-email-poll`, {
      method: 'POST',
      headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
