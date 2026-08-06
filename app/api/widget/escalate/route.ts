import { NextRequest, NextResponse } from 'next/server';

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/widget/escalate
   Destination: app/api/widget/escalate/route.ts  (FULL REPLACEMENT)

   REWRITTEN: this route no longer sends email (Resend removed). It now forwards
   the marketing-site support widget submission to the backend, which persists
   it to the owning agency's dashboard Inbox (agency_support_requests). The
   feature is UI + information exchange only; the agency reads the message in
   their dashboard and reaches out on their own.

   The agency is resolved server-side from the request host (subdomain or
   verified custom domain) by the backend intake endpoint, so this route just
   passes the host through. Same-origin from the widget's perspective, so no
   CORS and no client-visible backend URL beyond the usual public API base.

   Still returns a non-2xx when the backend can't persist, so the widget shows
   its error state (and the visitor can use the email fallback) instead of being
   told the message was delivered when it wasn't.
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const { name, contact, message, conversationSummary, agencyId } = await req.json();

    if (!contact) {
      return NextResponse.json({ error: 'Contact info is required' }, { status: 400 });
    }

    const host = req.headers.get('host') || req.headers.get('x-forwarded-host') || '';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || '';

    if (!backendUrl) {
      console.error('NEXT_PUBLIC_API_URL not set - support intake NOT forwarded. Undelivered:',
        JSON.stringify({ host, name, contact, message: message || null }));
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const resp = await fetch(`${backendUrl}/api/agency/support-requests/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // agencyId is optional; the backend falls back to host resolution.
        agencyId: agencyId || undefined,
        host,
        name,
        contact,
        message,
        conversationSummary,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('Support intake forward failed:', resp.status, errText);
      // Log the full lead so it's recoverable from server logs.
      console.error('Undelivered contact:',
        JSON.stringify({ host, name, contact, message: message || null }));
      return NextResponse.json({ error: 'Failed to send message' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Escalation route error:', err);
    return NextResponse.json({ error: 'Failed to process escalation' }, { status: 500 });
  }
}