import { NextRequest, NextResponse } from 'next/server';

/* ===========================================================================
   POST /api/widget/escalate
   Destination: app/api/widget/escalate/route.ts  (FULL REPLACEMENT)

   FIXED 2026-08-17: this route previously forwarded to the backend's agency
   inbox intake (/api/agency/support-requests/intake), which resolves an agency
   from the request host. On the PLATFORM marketing site (myvoiceaiconnect.com)
   there is no agency, so that intake always 404'd and every "Talk to a person"
   submit failed with the email-fallback error.

   It now forwards to the PLATFORM support path (/api/help/message), which
   persists the request to support_requests (the admin Support queue) AND texts
   the platform owner (SUPPORT_PHONE) so a prospect asking for a callback is
   reachable fast. That backend endpoint accepts an anonymous prospect's
   name / contact / message (no auth token required).

   Server-to-server call, so no CORS and no client-visible backend URL beyond
   the usual public API base. Returns a non-2xx when the backend cannot capture
   the request, so the widget shows its error state (and the email fallback)
   instead of claiming delivery that did not happen.
   =========================================================================== */

export async function POST(req: NextRequest) {
  try {
    const { name, contact, message, conversationSummary } = await req.json();

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

    const resp = await fetch(`${backendUrl}/api/help/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No Authorization header: this is an anonymous marketing-site prospect.
      // /api/help/message treats a token-less request with name/contact as a
      // prospect and composes the record + SMS from these fields.
      body: JSON.stringify({
        name: name || undefined,
        contact,
        message: message || undefined,
        conversationSummary: conversationSummary || undefined,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error(
        'Support escalation forward failed:',
        resp.status,
        errText,
        JSON.stringify({ name, contact, message: message || null })
      );
      return NextResponse.json({ error: 'Failed to send message' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Escalation route error:', err);
    return NextResponse.json({ error: 'Failed to process escalation' }, { status: 500 });
  }
}