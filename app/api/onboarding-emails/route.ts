// ============================================================================
// VERCEL CRON ENTRYPOINT: onboarding email sequence
// ----------------------------------------------------------------------------
// Vercel invokes this once a day (see vercel.json) with an
//   Authorization: Bearer <CRON_SECRET>
// header. We verify it, then POST to the backend cron endpoint with the
// x-cron-secret header the backend expects, so the schedule lives in the repo
// and no external cron service is required.
//
// REQUIRED env vars on Vercel:
//   CRON_SECRET   -> the SAME value as the backend's CRON_SECRET
//   BACKEND_URL   -> https://<your-backend-host>  (falls back to
//                    NEXT_PUBLIC_API_URL / NEXT_PUBLIC_BACKEND_URL if unset)
//
// The backend does the actual work; this route just triggers it and returns
// the result, so it stays well within the function time limit.
// ============================================================================

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Only Vercel Cron (which sends the bearer token) or a caller who knows the
  // secret may trigger this.
  const auth = request.headers.get('authorization');
  if (secret && auth !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const backend =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    '';

  if (!backend) {
    return Response.json({ ok: false, error: 'Backend URL not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`${backend}/api/cron/onboarding-emails`, {
      method: 'POST',
      headers: { 'x-cron-secret': secret || '', 'Content-Type': 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    return Response.json({ ok: res.ok, status: res.status, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fetch failed';
    return Response.json({ ok: false, error: message }, { status: 502 });
  }
}