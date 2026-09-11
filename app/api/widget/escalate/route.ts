import { NextRequest, NextResponse } from 'next/server';

/* ===========================================================================
   POST /api/widget/escalate
   Destination: app/api/widget/escalate/route.ts  (FULL REPLACEMENT)

   Routes a "talk to a person" submit to the right queue based on WHERE it was
   sent from:

     - Agency marketing site (a real agency host, or an explicit agencyId from
       the agency support widget)  ->  backend AGENCY INBOX intake
       (/api/agency/support-requests/intake). The backend resolves the agency
       by agencyId first, then by host, and inserts an agency_support_requests
       row (source 'marketing_site') that shows in that agency's dashboard Inbox.

     - Platform marketing site (myvoiceaiconnect.com / previews / local)  ->
       PLATFORM support (/api/help/message), which persists to the admin
       Support queue and texts the platform owner.

   HISTORY: a prior version forwarded ONLY to the agency intake, which resolved
   by host and therefore 404'd on the platform site (no agency there), failing
   every platform submit. The following version over-corrected and forwarded
   EVERYTHING to the platform queue, so agency-site prospect messages silently
   landed in VoiceAI Connect's admin queue instead of the agency's inbox. This
   version branches so BOTH surfaces reach their correct destination.

   Server-to-server call, so no CORS and no client-visible backend URL beyond
   the usual public API base. Returns non-2xx when the backend cannot capture
   the request, so the widget shows its error state (and the email fallback)
   instead of claiming a delivery that did not happen.
   =========================================================================== */

const PLATFORM_HOSTS = new Set(['myvoiceaiconnect.com', 'www.myvoiceaiconnect.com']);

// True for the platform's own marketing site and non-agency dev/preview hosts,
// where there is no owning agency to route an inbox message to.
function isPlatformHost(host: string): boolean {
  if (!host) return true;
  const h = host.toLowerCase().split(':')[0].trim();
  if (h === 'localhost' || h === '127.0.0.1') return true;
  if (h.endsWith('.vercel.app')) return true;
  return PLATFORM_HOSTS.has(h);
}

export async function POST(req: NextRequest) {
  try {
    const { name, contact, message, conversationSummary, agencyId } = await req.json();

    if (!contact || !String(contact).trim()) {
      return NextResponse.json({ error: 'Contact info is required' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || '';

    if (!backendUrl) {
      // Nothing to forward to. Log the full lead so it is recoverable from
      // server logs, and tell the widget it failed (it shows the email fallback).
      console.error(
        'NEXT_PUBLIC_API_URL not set - escalation NOT forwarded. Undelivered:',
        JSON.stringify({ name, contact, message: message || null })
      );
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // The widget POSTs from the browser on whatever site it is embedded in, so
    // this Host header is the agency's marketing host (subdomain or verified
    // custom domain) on an agency site, or a platform host on ours.
    const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
      .split(',')[0]
      .trim();

    // An explicit agencyId (sent by the agency support widget) or a non-platform
    // host means this belongs in an agency inbox, not the platform admin queue.
    const toAgencyInbox = Boolean(agencyId) || !isPlatformHost(host);

    const url = toAgencyInbox
      ? `${backendUrl}/api/agency/support-requests/intake`
      : `${backendUrl}/api/help/message`;

    const payload = toAgencyInbox
      ? {
          // Backend resolves the agency by agencyId first, then host.
          agencyId: agencyId || undefined,
          host: host || undefined,
          name: name || undefined,
          contact,
          message: message || undefined,
          conversationSummary: conversationSummary || undefined,
        }
      : {
          name: name || undefined,
          contact,
          message: message || undefined,
          conversationSummary: conversationSummary || undefined,
        };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No Authorization header: this is an anonymous marketing-site prospect.
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error(
        'Support escalation forward failed:',
        resp.status,
        errText,
        JSON.stringify({ toAgencyInbox, host, name, contact, message: message || null })
      );
      return NextResponse.json({ error: 'Failed to send message' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Escalation route error:', err);
    return NextResponse.json({ error: 'Failed to process escalation' }, { status: 500 });
  }
}