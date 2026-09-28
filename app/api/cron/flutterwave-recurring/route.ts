// Vercel Cron target for Flutterwave recurring billing. Vercel invokes this on the
// schedule in vercel.json. It verifies the Vercel cron secret (if set), then
// triggers the backend's recurring-charge job with the shared x-cron-secret.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;

  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is
  // set in the project env. Reject anything else so the endpoint can't be poked.
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const backend =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    '';
  if (!backend) {
    return Response.json({ ok: false, error: 'backend URL not configured' }, { status: 500 });
  }

  try {
    const r = await fetch(`${backend}/api/cron/flutterwave-recurring`, {
      method: 'POST',
      headers: { 'x-cron-secret': secret || '' },
    });
    const d = await r.json().catch(() => ({}));
    return Response.json({ ok: r.ok, ...d }, { status: r.ok ? 200 : 502 });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'request failed' }, { status: 502 });
  }
}