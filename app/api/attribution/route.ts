// POST /api/attribution
//
// Persists a signup attribution row to Supabase. Called best-effort by
// AttributionCapture when a signup reaches /signup/success. Decoupled from the
// signup write path: it only inserts into signup_attribution and never blocks
// or alters account creation. Writes with the service role, so row-level
// security on the table can stay locked to service-role-only.

import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function clip(v: unknown, n: number): string | null {
  return typeof v === 'string' && v.length > 0 ? v.slice(0, n) : null;
}

export async function POST(req: Request) {
  try {
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const row = {
      anon_id: clip(b.anon_id, 64),
      agency_id: clip(b.agency_id, 64),
      email: clip(b.email, 255),
      self_report: clip(b.self_report, 120),
      utm_source: clip(b.utm_source, 120),
      utm_medium: clip(b.utm_medium, 120),
      utm_campaign: clip(b.utm_campaign, 200),
      utm_term: clip(b.utm_term, 200),
      utm_content: clip(b.utm_content, 200),
      gclid: clip(b.gclid, 255),
      fbclid: clip(b.fbclid, 255),
      referrer: clip(b.referrer, 500),
      landing_path: clip(b.landing_path, 255),
      user_agent: clip(req.headers.get('user-agent'), 400),
    };

    if (!row.anon_id) {
      return Response.json({ ok: false, error: 'missing anon_id' }, { status: 400 });
    }

    const { error } = await supabase.from('signup_attribution').insert(row);
    if (error) {
      return Response.json({ ok: false }, { status: 500 });
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
