'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, KeyRound, Webhook, CalendarClock, Terminal } from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

const BASE_URL = 'https://urchin-app-bqb4i.ondigitalocean.app/api/v1';

function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); obs.unobserve(el); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

const NAV = [
  { group: 'Start', items: [['overview', 'Overview'], ['auth', 'Authentication'], ['conventions', 'Conventions'], ['limits', 'Rate limits']] },
  { group: 'Endpoints', items: [['clients', 'Clients'], ['receptionist', 'Receptionist & KB'], ['calls', 'Calls'], ['appointments', 'Appointments'], ['misc', 'Numbers · Usage'], ['webhook-mgmt', 'Webhook management']] },
  { group: 'Webhooks', items: [['events', 'Event catalog'], ['signature', 'Signature'], ['payloads', 'Payloads']] },
  { group: 'Recipes', items: [['recipes', 'Integration recipes'], ['calendar', 'Calendar booking']] },
  { group: 'Reference', items: [['summary', 'Quick reference'], ['roadmap', 'Roadmap']] },
];

type Ep = { m: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; path: string; rw?: boolean; desc: string; use: string };

const CLIENTS: Ep[] = [
  { m: 'GET', path: '/clients', desc: 'List clients (paginated). Filter by status or industry.', use: 'An agency pulls its whole client roster into its own CRM or billing dashboard each night, so a plumber it onboarded in VoiceAI shows up in its system with no manual entry. Filter ?status=active to skip clients still provisioning, or ?industry=hvac to sync one vertical at a time.' },
  { m: 'POST', path: '/clients', rw: true, desc: 'Create and auto-provision a client (assistant + phone number). Returns 202 with a provisioning job id.', use: 'A new HVAC company signs up on the agency’s own website and this creates the client and provisions its AI number in the background, no logging into VoiceAI. The call returns a job id immediately; poll provisioning-status to show a live "setting up your receptionist" state instead of freezing the signup form.' },
  { m: 'GET', path: '/clients/:id', desc: 'One client.', use: "Show one client's live details, provisioned AI number, plan, and status inside the agency's own dashboard, so they never log into VoiceAI to check a single account. Good for a per-client detail page." },
  { m: 'PATCH', path: '/clients/:id', rw: true, desc: 'Update a whitelist of client fields (name, city, notification phone, post-call SMS, etc.).', use: "A restoration client updates their business name or after-hours notification number in the agency's portal, and this pushes it back to VoiceAI so the records stay in sync. Provisioning-owned fields (the number, assistant ids, billing) stay locked." },
  { m: 'DELETE', path: '/clients/:id', rw: true, desc: 'Not available yet. Returns 501 not_implemented.', use: 'Deletion has to tear down the paid phone number, the assistant, and billing cleanly, so for now offboard a client from the dashboard. A write path for this is coming.' },
  { m: 'GET', path: '/clients/:id/provisioning-status/:jobId', desc: 'Poll a provisioning job after a create.', use: 'Drive the onboarding screen right after a create: "finding a local number... building your receptionist... ready." Stop polling when status is done, and read the provisioned phone number from the result to show the new client the number to forward their line to.' },
];
const RECEPTIONIST: Ep[] = [
  { m: 'GET', path: '/clients/:id/receptionist', desc: 'Current AI config: greeting, voice, human-handoff mode, transfer number, business hours.', use: "Show a client's current greeting, voice, and after-hours transfer in the agency's own settings screen, so they can review how a restoration company's emergency line is set up without leaving their tool." },
  { m: 'PATCH', path: '/clients/:id/receptionist', rw: true, desc: 'Update the AI config. Takes effect on the next call, no rebuild.', use: 'A med spa wants a warmer greeting and calls sent to the front desk after 5pm; the agency changes it from their own panel and it lands on the very next call, no rebuild. Also how an agency bulk-applies one on-brand greeting across every client in a vertical.' },
  { m: 'GET', path: '/clients/:id/knowledge-base', desc: "The client's knowledge base content.", use: "Export what the AI knows about a plumbing client (hours, service area, pricing) so the agency can review or back it up before a big edit." },
  { m: 'PUT', path: '/clients/:id/knowledge-base', rw: true, desc: 'Replace the knowledge base content.', use: "Sync a junk-removal client's pricing and service list from the agency's own source of truth, so when they change their dump fees in one place the AI starts quoting the new number. Writing it rebuilds the assistant knowledge file in the background, so it is heavier than a receptionist edit." },
];
const CALLS: Ep[] = [
  { m: 'GET', path: '/calls', desc: 'List calls (paginated). Filter by client_id, since, until.', use: "An HVAC agency pulls every call each night so a missed-call lead becomes a morning follow-up task in their CRM. A restoration company syncs full transcripts into a warehouse to audit how the AI handled emergency water-damage calls. Walk pages with cursor and bound each run with ?since so you only fetch new calls." },
  { m: 'GET', path: '/calls/:id', desc: 'One call: outcome, captured customer details, summary, transcript, recording.', use: "Open one call's transcript, summary, and captured details in your app, for when a septic client asks \"did the AI actually book that pumping job?\" and the agency needs the full record. This fetch also resolves a fresh recording link." },
  { m: 'GET', path: '/calls/:id/recording', desc: 'A fresh, authenticated recording URL.', use: "Stored links expire, so call this the instant a user hits play, for example an agency QAing a salon's bookings by listening to the actual calls, or attaching a recording to a dispute." },
];
const APPTS: Ep[] = [
  { m: 'GET', path: '/clients/:id/availability', desc: 'Open slots for a client on a date. ?date=YYYY-MM-DD (&duration=30).', use: "Before booking, show a caller's real options, say a plumbing client's open 2-hour windows tomorrow, in your own flow or chatbot. Needs a connected calendar to read against; a client on no calendar returns 409 so you can fall back to just capturing the request." },
  { m: 'GET', path: '/appointments', desc: 'List appointments. Filter by client_id, status, since, until.', use: "Put a lawn-care client's upcoming jobs on an ops board, or reconcile what the AI booked against the crew's schedule every morning. Filter ?since/?until for a given week." },
  { m: 'GET', path: '/appointments/:id', desc: 'One appointment.', use: "Pull one booking's full details (customer, time, service, where it landed) when a client asks the agency to confirm a specific appointment." },
  { m: 'POST', path: '/appointments', rw: true, desc: 'Create an appointment. Writes the real calendar event when the client has one connected.', use: "Book from your own flow, not just the phone AI: a restoration company's website chatbot or the agency's intake form creates the appointment here. A Google-connected client gets a real calendar event (availability-checked); a client with no calendar gets a recorded booking so the call still succeeds. Fires appointment.booked so your reminders and CRM sync run either way." },
  { m: 'PATCH', path: '/appointments/:id', rw: true, desc: 'Reschedule to a new date/time.', use: "A customer calls back to move their HVAC tune-up to Thursday; reschedule here and the Google event moves with it (a record-only booking just updates). Fires appointment.rescheduled with the old time." },
  { m: 'POST', path: '/appointments/:id/cancel', rw: true, desc: 'Cancel an appointment (kept for history).', use: "A caller cancels their junk pickup; this frees the slot, removes the calendar event, and fires appointment.canceled so the agency's reminder sequence stops texting them. Optional body: reason." },
];
const MISC: Ep[] = [
  { m: 'GET', path: '/numbers', desc: "Provisioned phone numbers across the agency's clients.", use: "Audit which AI number every client runs on across the whole agency, and catch any client still stuck without a provisioned number." },
  { m: 'GET', path: '/usage', desc: 'Minutes and records per client over a window or billing month.', use: "Bill your own clients from real minute usage: an agency pulls each HVAC client's monthly minutes to mark up and invoice. Pass ?billing_month=YYYY-MM for a clean monthly total, or ?since/?until for a custom window." },
  { m: 'GET', path: '/analytics/calls', desc: 'Call aggregates: totals, minutes, spam, by status.', use: "Feed call volume, spam counts, and outcomes into an agency reporting dashboard, so they can show a plumbing client \"42 calls answered, 11 jobs booked\" this month without exporting every call row." },
];
const HOOKS: Ep[] = [
  { m: 'GET', path: '/events', desc: 'The event catalog (array of event-type strings).', use: 'Let an AI assistant or a dynamic settings screen discover the exact event names before subscribing, instead of hardcoding a list that could drift.' },
  { m: 'POST', path: '/webhooks', rw: true, desc: 'Subscribe a URL to events. Returns the signing secret once.', use: 'Wire VoiceAI into Zapier, Make, n8n, GoHighLevel, or your own endpoint, e.g. an agency subscribes call.completed to drop every lead into its GoHighLevel workflow. The response includes a whsec_ secret exactly once, store it then, it is never shown again.' },
  { m: 'GET', path: '/webhooks', desc: 'List subscriptions.', use: "See every subscription plus each endpoint's last delivery and last error, so an agency can tell at a glance whether its CRM sync is healthy." },
  { m: 'GET', path: '/webhooks/:id', desc: 'One subscription.', use: 'Check a single subscription config and health.' },
  { m: 'PATCH', path: '/webhooks/:id', rw: true, desc: 'Update URL, events, or status (active / disabled).', use: 'Move your endpoint to a new URL or change which events you get without re-creating the subscription or minting a new secret. Set status disabled to pause delivery during maintenance, then active again.' },
  { m: 'DELETE', path: '/webhooks/:id', rw: true, desc: 'Delete a subscription.', use: 'Turn a subscription off for good when an agency drops an integration.' },
  { m: 'GET', path: '/webhooks/:id/deliveries', desc: 'Delivery log: status, attempts, response code, stored payload.', use: "Debug why your endpoint missed an event, for when a restoration company says \"the booking never hit our CRM.\" Each row shows the attempt count, your endpoint's response code, and the exact payload sent." },
  { m: 'POST', path: '/webhooks/:id/ping', rw: true, desc: 'Send a test ping event to the endpoint.', use: "Fire a test event to confirm your endpoint and signature check work before going live, so the first real customer call is not also your first test. The ping has type \"ping\", not a catalog event." },
];

// [event, description, when-you-would-use-it]
const EVENTS: [string, string, string][] = [
  ['call.started', 'A call begins (live event; carries a call_session_id, not a calls row id).', 'Flash a live-call light on the agency wall board, or start a screen-pop so a restoration dispatcher sees a call coming in before they answer. Lightweight live signal, not enriched with call details.'],
  ['call.completed', 'A call ends. Enriched with the full call (see payloads).', 'The main real-time hook. The second an HVAC call ends: create a CRM activity from the summary, text the owner if urgency_level is high (a no-heat call in winter), and if the AI captured an appointment push it to a non-Google calendar, all from this one enriched event with no follow-up GET.'],
  ['call.transferred', 'The call was transferred to the business line. Enriched like call.completed.', 'Track how often a plumbing client’s calls reach a live person and when, for staffing. Or alert the owner that a transferred call is ringing their cell so they answer knowing it is a real customer, not spam.'],
  ['call.escalated', 'A call-center agent took over a live call (browser jump-in or their phone was rung).', 'Alert a call-center manager the moment an agent jumps into a live call, for live-floor staffing and QA. Distinct from call.transferred, which is a dial out to the business line.'],
  ['appointment.booked', 'An appointment was created (by the AI on a call, or via POST /appointments).', 'Mirror the booking into the agency’s ops calendar, fire a confirmation text, and start a reminder sequence, e.g. a salon booking kicks off a 24-hour "see you tomorrow" SMS and a same-day reminder.'],
  ['appointment.rescheduled', 'An appointment moved to a new time (via PATCH /appointments/:id). Carries previous_appointment_time.', 'Move the booking everywhere you mirror it and re-send a confirmation for the new time. previous_appointment_time lets you clear the exact old slot, not guess which one moved.'],
  ['appointment.canceled', 'An appointment was canceled (via POST /appointments/:id/cancel). Carries cancel_reason.', 'Free the slot in your own system and stop the reminder sequence, so a canceled junk pickup never gets a "see you tomorrow" text. cancel_reason feeds your reporting on why jobs fall through.'],
  ['client.provisioned', 'A new client finished provisioning and is live.', 'Kick off the agency’s welcome sequence the moment a client goes live: send the "your receptionist is ready, here is your number to forward" email and create the onboarding checklist.'],
  ['client.provisioning_failed', 'Provisioning failed for a client.', 'Page the agency if a setup breaks (no local number found, assistant build failed) so they fix it before the client ever notices their line is not answering.'],
  ['client.payment_failed', "A client's payment failed.", 'Trigger a dunning sequence from the agency’s billing tool the moment a card fails, before the account lapses and the AI stops answering.'],
  ['client.subscription_activated', 'A client subscription activated.', 'Mark a client as paying in the agency’s CRM, end any trial messaging, and start the paid-onboarding flow.'],
  ['client.trial_expired', 'A client trial expired.', 'Start a win-back sequence the instant a trial lapses: "your receptionist is paused, reactivate to keep answering calls."'],
  ['client.canceled', 'A client was canceled.', 'Update churn tracking, stop the agency’s own billing for that client, and trigger an exit survey to learn why they left.'],
];

const METHOD_COLOR: Record<string, string> = {
  GET: '#01f5d1', POST: '#46c88a', PATCH: '#d9a640', PUT: '#a98bf0', DELETE: '#ef6b5d',
};

const SIGN_CODE =
`// Node, verify a delivery before trusting it
const crypto = require('crypto');
function verify(rawBody, header, secret) {
  const p = Object.fromEntries(header.split(',').map(x => x.split('=')));
  const expected = crypto.createHmac('sha256', secret)
    .update(p.t + '.' + rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(p.v1));
}
// Pass the exact raw request body, not the re-stringified JSON.`;

// ── curl examples (accurate to the live API) ────────────────────────────────
const CURL_LIST =
`curl ${BASE_URL}/calls?limit=25 \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Next page: pass the cursor you got back
curl "${BASE_URL}/calls?limit=25&cursor=2026-10-20T14:03:00.000Z" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

const LIST_RESP =
`{
  "data": [ { "id": "c1a2...", "client_id": "9f3b...", "caller_phone": "+14045551212", "... ": "..." } ],
  "has_more": true,
  "next_cursor": "2026-10-20T14:03:00.000Z"
}`;

const CURL_CREATE =
`curl -X POST ${BASE_URL}/clients \\
  -H "Authorization: Bearer YOUR_READ_WRITE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "Dana",
    "last_name": "Reyes",
    "email": "dana@brightplumbing.com",
    "phone": "+14045550199",
    "business_name": "Bright Plumbing",
    "industry": "plumbing",
    "business_city": "Atlanta",
    "business_state": "GA",
    "plan_type": "starter"
  }'`;

const CREATE_RESP =
`// 202 Accepted, provisioning runs in the background
{ "client_id": "9f3b...", "job_id": "prov_8c21...", "status": "processing" }

// Then poll:
// GET /clients/9f3b.../provisioning-status/prov_8c21...
// -> { "id": "...", "status": "done", "result": { "phone_number": "+1..." }, "created_at": "..." }`;

const CURL_SUBSCRIBE =
`curl -X POST ${BASE_URL}/webhooks \\
  -H "Authorization: Bearer YOUR_READ_WRITE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourapp.com/hooks/voiceai",
    "events": ["call.completed", "appointment.booked"],
    "description": "CRM sync"
  }'`;

const SUBSCRIBE_RESP =
`// 201 Created, secret is shown ONCE, store it now
{
  "id": "wh_7a9c...",
  "url": "https://yourapp.com/hooks/voiceai",
  "events": ["call.completed", "appointment.booked"],
  "status": "active",
  "description": "CRM sync",
  "created_at": "2026-10-27T15:12:00.000Z",
  "secret": "whsec_1f2e3d4c..."
}`;

// ── worked webhook payloads (realistic, field-accurate) ─────────────────────
const CALL_PAYLOAD_JSON =
`{
  "id": "evt_6b1f9c2a-...",
  "type": "call.completed",
  "created_at": "2026-10-27T15:42:11.904Z",
  "data": {
    "id": "a7c4e0d2-...",
    "client_id": "9f3b1d88-...",
    "caller_phone": "+14045551212",
    "customer_name": "Marcus Hale",
    "customer_phone": "+14045551212",
    "customer_email": "marcus.hale@gmail.com",
    "customer_address": "812 Oak Ridge Dr, Atlanta, GA",
    "service_requested": "Water heater leaking, wants someone out today",
    "urgency_level": "high",
    "sentiment": "anxious",
    "appointment_booked": true,
    "appointment_time": "2026-10-27T21:00:00.000Z",
    "ai_summary": "Caller has an active leak. Booked an emergency visit for 5pm.",
    "summary": "Emergency water heater call, same-day visit booked.",
    "transcript": "AI: Thanks for calling Bright Plumbing...",
    "recording_url": "https://storage.vapi.ai/....mp3?token=... (short-lived)",
    "recording_api_url": "${BASE_URL}/calls/a7c4e0d2-.../recording",
    "ended_reason": "customer-ended-call",
    "transfer_status": null,
    "is_spam": false,
    "spam_reason": null,
    "call_language": "en",
    "started_at": "2026-10-27T15:40:02.000Z",
    "ended_at": "2026-10-27T15:42:10.000Z"
  }
}`;

const APPT_PAYLOAD_JSON =
`{
  "id": "evt_2d8a7f10-...",
  "type": "appointment.booked",
  "created_at": "2026-10-27T15:42:09.511Z",
  "data": {
    "id": "appt_5e9b...",
    "client_id": "9f3b1d88-...",
    "business_name": "Bright Plumbing",
    "customer_name": "Marcus Hale",
    "customer_phone": "+14045551212",
    "appointment_time": "2026-10-27T21:00:00.000Z",
    "end_time": "2026-10-27T22:00:00.000Z",
    "duration_minutes": 60,
    "timezone": "America/New_York",
    "service_type": "Emergency water heater",
    "staff_name": null,
    "notes": "Active leak, caller will be home.",
    "status": "confirmed",
    "booking_source": "ai_receptionist",
    "google_event_id": "abc123def456",
    "google_calendar_id": "primary",
    "calendar_link": "https://calendar.google.com/event?eid=...",
    "created_at": "2026-10-27T15:42:09.000Z"
  }
}`;

// ── integration recipes ─────────────────────────────────────────────────────
const RECIPE_CRM =
`1. Create a read key.
2. On a schedule (hourly/nightly), GET /calls?since=<last run>&limit=100
3. Walk pages with next_cursor until has_more is false.
4. Upsert each call by its id into your CRM; store ended_at as the sync mark.
   Tip: the row already carries customer_name/phone/email, service_requested,
   summary and transcript, so no per-call follow-up is needed.`;

const RECIPE_REALTIME =
`1. Create a read_write key.
2. POST /webhooks with events ["call.completed"] and your endpoint URL.
   Store the whsec_ secret from the response.
3. On each delivery: verify the signature against the raw body, then act, e.g.
   - create a CRM activity from data.summary + data.service_requested
   - text the owner if data.urgency_level is "high" or "emergency"
   - if data.appointment_booked is true, push it to your calendar
4. Return 2xx fast. Non-2xx is retried with backoff (up to 6 attempts).`;

const RECIPE_SCHEDULE =
`1. Create a read_write key.
2. GET /clients/:id/availability?date=YYYY-MM-DD to show open slots.
3. POST /appointments with client_id, customer_name, date, time (+ service_type,
   duration_minutes). Google-connected client -> real calendar event; no calendar
   connected -> record-only appointment. Fires appointment.booked.
4. PATCH /appointments/:id to move it (appointment.rescheduled);
   POST /appointments/:id/cancel to cancel (appointment.canceled).`;

const RECIPE_NONGOOGLE =
`Interim, until native writes for your calendar land via the aggregator:
1. Subscribe a webhook to call.completed.
2. On each event where data.appointment_booked is true, read:
   data.appointment_time, customer_name, customer_phone, service_requested.
3. Create the event in your calendar (Microsoft Graph, Acuity, Calendly,
   Cal.com, iCloud) from those fields.
Caveat: the AI did not check that calendar's live availability, so treat it
as a requested slot, not a double-book-safe confirmed one.`;

const RECIPE_ONBOARD =
`1. Create a read_write key.
2. On your own signup form submit: POST /clients with the business details.
3. Take the job_id from the 202 response and poll
   GET /clients/:id/provisioning-status/:jobId every few seconds.
4. When status is "done", show the provisioned number from result and tell
   the client to forward their existing line to it.`;

// ── machine-readable quick reference (for AI assistants reading this page) ───
const QUICK_REF =
`VoiceAI Connect Developer API, v1
base_url: ${BASE_URL}
auth: Authorization: Bearer <api_key>   (or x-api-key: <api_key>)
plan: Scale only (call-center agencies any plan; trialing = Scale); else 403 upgrade_required
scopes: read (GET), read_write (POST/PATCH/PUT/DELETE)
rate_limit: 120 req/min per key; headers X-RateLimit-Limit/Remaining/Reset; 429 rate_limit_exceeded
pagination: ?limit=1-100 (default 25) & ?cursor=<next_cursor>; list -> { data, has_more, next_cursor }
errors: { error: { type, message } }; types: authentication_error(401), insufficient_scope(403),
        upgrade_required(403), account_suspended(403), not_found(404), invalid_request(400),
        rate_limit_exceeded(429), not_implemented(501), api_error(400/500)

endpoints:
  GET    /account
  GET    /clients            POST /clients(rw)
  GET    /clients/:id        PATCH /clients/:id(rw)    DELETE /clients/:id(rw -> 501 not_implemented)
  GET    /clients/:id/provisioning-status/:jobId
  GET    /clients/:id/receptionist     PATCH /clients/:id/receptionist(rw)
  GET    /clients/:id/knowledge-base   PUT   /clients/:id/knowledge-base(rw)
  GET    /calls   GET /calls/:id   GET /calls/:id/recording
  GET    /clients/:id/availability?date=YYYY-MM-DD
  GET    /appointments   GET /appointments/:id
  POST   /appointments(rw)   PATCH /appointments/:id(rw)   POST /appointments/:id/cancel(rw)
  GET    /numbers   GET /usage   GET /analytics/calls
  GET    /events
  POST   /webhooks(rw)   GET /webhooks   GET /webhooks/:id
  PATCH  /webhooks/:id(rw)   DELETE /webhooks/:id(rw)
  GET    /webhooks/:id/deliveries   POST /webhooks/:id/ping(rw)

events: call.started, call.completed, call.transferred, call.escalated,
        appointment.booked, appointment.rescheduled, appointment.canceled,
        client.provisioned, client.provisioning_failed, client.payment_failed,
        client.subscription_activated, client.trial_expired, client.canceled
webhook_signature: header X-VoiceAI-Signature: t=<unix>,v1=<hex>; v1 = HMAC-SHA256(secret, t + "." + rawBody)
webhook_headers_also: X-VoiceAI-Event, X-VoiceAI-Delivery
webhook_retries: up to 6 attempts, backoff 1/5/30/120/360/720 min, 10s timeout, needs 2xx
calendar: appointment writes hit the client's connected calendar (Google live now; Outlook/Acuity/Calendly via aggregator coming). No calendar connected = record-only appointment.
docs: https://www.myvoiceaiconnect.com/developers`;

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    const done = () => { setCopied(key); setTimeout(() => setCopied(null), 1200); };
    try {
      navigator.clipboard.writeText(text).then(done, () => fallback(text, done));
    } catch { fallback(text, done); }
  };
  return { copied, copy };
}
function fallback(text: string, cb: () => void) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta); cb();
  } catch { /* clipboard unavailable */ }
}

function CodeBlock({ code, k, copied, onCopy, label }: { code: string; k: string; copied: string | null; onCopy: (t: string, k: string) => void; label?: string }) {
  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] my-3">
      {label && <span className="absolute top-2.5 left-3 font-mono text-[9.5px] tracking-[0.12em] uppercase text-white/30">{label}</span>}
      <button
        onClick={() => onCopy(code, k)}
        className="absolute top-2.5 right-2.5 font-mono text-[11px] px-2.5 py-1 rounded-md border border-white/[0.12] text-white/55 hover:text-white hover:border-white/30 transition-colors"
      >
        {copied === k ? 'Copied' : 'Copy'}
      </button>
      <pre className={`m-0 p-4 overflow-x-auto font-mono text-[12.5px] leading-[1.65] text-white/75 whitespace-pre ${label ? 'pt-7' : ''}`}>{code}</pre>
    </div>
  );
}

function WhenLine({ text }: { text: string }) {
  return (
    <span className="basis-full flex items-baseline gap-2 pl-[66px] max-[520px]:pl-0 mt-0.5">
      <span className="font-mono text-[9px] tracking-[0.12em] uppercase shrink-0" style={{ color: 'rgba(1,245,209,0.7)' }}>When</span>
      <span className="text-[12.5px] text-white/40 leading-relaxed">{text}</span>
    </span>
  );
}

function EndpointList({ eps }: { eps: Ep[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] divide-y divide-white/[0.05]">
      {eps.map((e) => (
        <div key={e.m + e.path} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 lg:px-5 py-3.5">
          <span
            className="font-mono text-[10.5px] font-semibold tracking-wide px-2 py-[3px] rounded-md text-[#050505] text-center"
            style={{ background: METHOD_COLOR[e.m], minWidth: 54 }}
          >
            {e.m}
          </span>
          <code className="font-mono text-[12.5px] text-white/90 break-all min-w-0">{e.path}</code>
          {e.rw && <span className="font-mono text-[9.5px] tracking-wide px-1.5 py-[2px] rounded border border-[#a98bf0]/40 text-[#a98bf0]">read_write</span>}
          <span className="basis-full text-[13px] text-white/55 leading-relaxed pl-[66px] max-[520px]:pl-0">{e.desc}</span>
          <WhenLine text={e.use} />
        </div>
      ))}
    </div>
  );
}

function RecipeCard({ title, sub, code, k, copied, onCopy }: { title: string; sub: string; code: string; k: string; copied: string | null; onCopy: (t: string, k: string) => void }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">
      <h3 className="font-display text-[15.5px] font-medium text-white/90 mb-0.5">{title}</h3>
      <p className="text-[12.5px] text-white/45 mb-1">{sub}</p>
      <CodeBlock k={k} copied={copied} onCopy={onCopy} code={code} />
    </div>
  );
}

export default function DevelopersPage() {
  const heroRef = useInView();
  const { copied, copy } = useCopy();
  const [active, setActive] = useState('overview');

  useEffect(() => {
    const ids = NAV.flatMap((g) => g.items.map((i) => i[0]));
    const secs = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
      },
      { rootMargin: '-72px 0px -70% 0px', threshold: 0 }
    );
    secs.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-16 lg:pb-24 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={heroRef} className="fade-up max-w-4xl">
            <p className="t-eyebrow text-em mb-7">Developers</p>
            <h1 className="t-h1 text-white max-w-[18ch]">REST API and webhooks.</h1>
            <p className="t-body mt-8 max-w-2xl text-[1rem]">
              Read and manage everything on your agency account, and push real-time call and booking events
              into any outside system. A Scale-plan feature, with API keys, scoped access, and signed webhooks.
              Every endpoint and event below lists a short "when you would use it", plus copyable curl, worked
              JSON, and named integration recipes, so you (or an AI assistant) can wire up an integration fast.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/agency/settings?tab=developer" className="btn btn-em">Get API keys <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <button
                onClick={() => copy(BASE_URL, 'hero-base')}
                className="btn btn-ghost-dark font-mono text-[12.5px]"
              >
                {copied === 'hero-base' ? 'Copied base URL' : 'Copy base URL'}
              </button>
            </div>
            <div className="mt-9 flex flex-wrap gap-5 text-white/45">
              <span className="inline-flex items-center gap-2 text-[12.5px]"><KeyRound className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> Bearer API key</span>
              <span className="inline-flex items-center gap-2 text-[12.5px]"><Webhook className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> 13 signed events</span>
              <span className="inline-flex items-center gap-2 text-[12.5px]"><CalendarClock className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> Live booking data</span>
            </div>
          </div>
        </div>
      </section>

      {/* DOCS */}
      <section className="bg-ink pb-28 border-t border-white/[0.04]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid lg:grid-cols-[210px_minmax(0,1fr)] gap-10 lg:gap-14 pt-12">
          {/* SIDEBAR */}
          <nav className="hidden lg:block sticky top-28 self-start h-[calc(100vh-140px)] overflow-y-auto pr-2">
            {NAV.map((g) => (
              <div key={g.group} className="mb-6">
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/30 mb-2.5">{g.group}</p>
                <div className="flex flex-col gap-0.5">
                  {g.items.map(([id, label]) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="text-[13px] py-1 px-2.5 rounded-md transition-colors"
                      style={active === id
                        ? { color: '#01f5d1', background: 'rgba(1,245,209,0.08)' }
                        : { color: 'rgba(255,255,255,0.5)' }}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* CONTENT */}
          <div className="min-w-0 max-w-[760px]">
            <section id="overview" className="scroll-mt-28 mb-14">
              <div className="rounded-2xl p-5 lg:p-6" style={{ background: 'rgba(1,245,209,0.06)', border: '1px solid rgba(1,245,209,0.18)' }}>
                <p className="font-mono text-[11px] tracking-wide uppercase text-em mb-2">Plan</p>
                <p className="text-[14px] text-white/75 leading-relaxed">
                  API keys, the REST API, and webhooks are a <b className="text-white">Scale plan</b> feature. Call-center
                  agencies get them on any plan, and agencies on a free trial are treated as Scale while trialing. Below
                  that, requests return <code className="font-mono text-em-deep">upgrade_required</code>.
                </p>
              </div>
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mt-10 mb-3">Base URL</h2>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-wide text-white/35">Base</span>
                <code className="font-mono text-[13px] text-white/90 break-all flex-1 min-w-0">{BASE_URL}</code>
                <button onClick={() => copy(BASE_URL, 'base')} className="font-mono text-[11px] px-2.5 py-1 rounded-md border border-white/[0.12] text-white/55 hover:text-white hover:border-white/30 transition-colors">
                  {copied === 'base' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[13px] text-white/40 mt-2.5">All paths below are relative to this base.</p>
            </section>

            <section id="auth" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Authentication</h2>
              <p className="text-[14.5px] text-white/60 leading-relaxed">
                Every request authenticates with an API key, created in the agency dashboard under
                <b className="text-white/85"> Settings &rarr; API</b>. The full key is shown once at creation; only a
                SHA-256 hash and a short prefix are stored, so a lost key is revoked and replaced, never recovered. Keys
                are agency-scoped.
              </p>
              <CodeBlock k="auth" copied={copied} onCopy={copy} code={'Authorization: Bearer YOUR_API_KEY\n# or, equivalently:\nx-api-key: YOUR_API_KEY'} />
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
                  <code className="font-mono text-[13px] text-em">read</code>
                  <p className="text-[13px] text-white/50 mt-1.5">Default. All GET endpoints.</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
                  <code className="font-mono text-[13px]" style={{ color: '#a98bf0' }}>read_write</code>
                  <p className="text-[13px] text-white/50 mt-1.5">POST, PATCH, PUT, DELETE. A write with a read key returns 403 insufficient_scope.</p>
                </div>
              </div>
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-6 mb-1.5">Your first request</h3>
              <CodeBlock k="firstreq" copied={copied} onCopy={copy} label="curl" code={`curl ${BASE_URL}/account \\\n  -H "Authorization: Bearer YOUR_API_KEY"`} />
              <p className="text-[13px] text-white/40">Returns the authenticated agency: id, name, plan_type, subscription_status, and the key's scope.</p>
            </section>

            <section id="conventions" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Conventions</h2>
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-5 mb-1.5">Errors</h3>
              <CodeBlock k="err" copied={copied} onCopy={copy} code={'{ "error": { "type": "insufficient_scope", "message": "This API key is read-only." } }'} />
              <p className="text-[13.5px] text-white/55 leading-relaxed mt-2">
                Every error uses that envelope. Types you may see:
              </p>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] divide-y divide-white/[0.05] mt-3">
                {[
                  ['401', 'authentication_error', 'Missing, invalid, or revoked key.'],
                  ['403', 'insufficient_scope', 'Write attempted with a read-only key.'],
                  ['403', 'upgrade_required', 'Account is below the Scale plan.'],
                  ['403', 'account_suspended', 'Agency account is suspended.'],
                  ['404', 'not_found', 'No such object, or not owned by your agency.'],
                  ['400', 'invalid_request', 'Bad or missing fields in the request.'],
                  ['429', 'rate_limit_exceeded', 'Over 120 requests/min on this key.'],
                  ['501', 'not_implemented', 'Endpoint exists but is not available yet (e.g. DELETE /clients).'],
                  ['400/500', 'api_error', 'A query or internal error.'],
                ].map(([code, type, note]) => (
                  <div key={type} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 lg:px-5 py-2.5">
                    <code className="font-mono text-[11.5px] text-white/80 shrink-0" style={{ minWidth: 54 }}>{code}</code>
                    <code className="font-mono text-[12px] text-em-deep shrink-0">{type}</code>
                    <span className="basis-full sm:basis-auto text-[12.5px] text-white/45 sm:flex-1 pl-[66px] sm:pl-0">{note}</span>
                  </div>
                ))}
              </div>
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-6 mb-1.5">Pagination</h3>
              <p className="text-[13.5px] text-white/55 leading-relaxed">
                List endpoints take <code className="font-mono text-white/80">limit</code> (1&ndash;100, default 25) and
                <code className="font-mono text-white/80"> cursor</code>. Pass the returned cursor back to page.
              </p>
              <CodeBlock k="page" copied={copied} onCopy={copy} code={'{ "data": [ ... ], "has_more": true, "next_cursor": "2026-10-20T14:03:00.000Z" }'} />
              <p className="text-[13px] text-white/40 mt-1">Single objects return directly. Only allowlisted public fields are returned; internal IDs and secrets never leave the API. (Numbers, usage, analytics, and the event catalog return a plain <code className="font-mono text-white/70">{'{ data }'}</code> or object, not a cursor page.)</p>
            </section>

            <section id="limits" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Rate limits</h2>
              <p className="text-[14px] text-white/60 leading-relaxed">
                Each API key is limited to <b className="text-white/85">120 requests per minute</b>. Every response carries
                the current budget, and going over returns <code className="font-mono text-em-deep">429 rate_limit_exceeded</code> with a <code className="font-mono text-white/80">Retry-After</code> header.
              </p>
              <CodeBlock k="rl" copied={copied} onCopy={copy} code={'X-RateLimit-Limit: 120\nX-RateLimit-Remaining: 118\nX-RateLimit-Reset: 1793114400'} />
              <p className="text-[13px] text-white/40">For a large nightly sync, page with the max <code className="font-mono text-white/70">limit=100</code> and, if you hit a 429, wait the window out using Retry-After rather than hammering.</p>
            </section>

            <section id="clients" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Clients</h2>
              <EndpointList eps={CLIENTS} />
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-6 mb-1.5">Example: create a client</h3>
              <CodeBlock k="createcurl" copied={copied} onCopy={copy} label="curl" code={CURL_CREATE} />
              <CodeBlock k="createresp" copied={copied} onCopy={copy} label="response" code={CREATE_RESP} />
            </section>
            <section id="receptionist" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Receptionist &amp; Knowledge base</h2>
              <EndpointList eps={RECEPTIONIST} />
            </section>
            <section id="calls" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Calls</h2>
              <EndpointList eps={CALLS} />
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-6 mb-1.5">Example: list and page</h3>
              <CodeBlock k="listcurl" copied={copied} onCopy={copy} label="curl" code={CURL_LIST} />
              <CodeBlock k="listresp" copied={copied} onCopy={copy} label="response" code={LIST_RESP} />
            </section>
            <section id="appointments" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Appointments</h2>
              <EndpointList eps={APPTS} />
              <p className="text-[13px] text-white/45 mt-3 leading-relaxed">
                Appointments are created by the AI during calls and, now, directly through the API. How a write reaches a
                real calendar depends on what the client has connected. See <a href="#calendar" className="text-em">Calendar booking</a>.
              </p>
            </section>
            <section id="misc" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Numbers · Usage · Analytics</h2>
              <EndpointList eps={MISC} />
            </section>

            <section id="webhook-mgmt" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Webhook management</h2>
              <EndpointList eps={HOOKS} />
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-6 mb-1.5">Subscribe</h3>
              <CodeBlock k="subcurl" copied={copied} onCopy={copy} label="curl" code={CURL_SUBSCRIBE} />
              <CodeBlock k="subresp" copied={copied} onCopy={copy} label="response" code={SUBSCRIBE_RESP} />
              <p className="text-[13px] text-white/40">Use <code className="font-mono text-white/70">{'"events": ["*"]'}</code> to subscribe to everything. The <code className="font-mono text-white/70">secret</code> is returned only on this create call.</p>
            </section>

            <section id="events" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Event catalog</h2>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] divide-y divide-white/[0.05]">
                {EVENTS.map(([e, d, u]) => (
                  <div key={e} className="px-4 lg:px-5 py-3.5">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <code className="font-mono text-[12.5px] text-em whitespace-nowrap">{e}</code>
                      <span className="text-[13px] text-white/55 flex-1 min-w-0">{d}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-mono text-[9px] tracking-[0.12em] uppercase shrink-0" style={{ color: 'rgba(1,245,209,0.7)' }}>When</span>
                      <span className="text-[12.5px] text-white/40 leading-relaxed">{u}</span>
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-6 mb-1.5">Envelope</h3>
              <CodeBlock k="env" copied={copied} onCopy={copy} code={'{ "id": "evt_uuid", "type": "call.completed", "created_at": "...", "data": { ... } }'} />
            </section>

            <section id="signature" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Signature verification</h2>
              <p className="text-[14px] text-white/60 leading-relaxed">Each delivery is signed. Three headers are sent:</p>
              <CodeBlock k="sighdr" copied={copied} onCopy={copy} code={'X-VoiceAI-Signature: t=<unix_ts>,v1=<hex>\nX-VoiceAI-Event:     call.completed\nX-VoiceAI-Delivery:  <delivery_id>'} />
              <p className="text-[13.5px] text-white/55 leading-relaxed">
                where <code className="font-mono text-white/80">v1 = HMAC-SHA256(secret, t + "." + rawBody)</code>. Verify
                against the raw body before parsing JSON.
              </p>
              <CodeBlock k="sig" copied={copied} onCopy={copy} code={SIGN_CODE} />
              <p className="text-[13px] text-white/40 leading-relaxed">
                Deliveries are logged and retried on failure: up to 6 attempts with a 1 / 5 / 30 / 120 / 360 / 720 minute
                backoff and a 10-second timeout, so your endpoint should return a 2xx quickly and do slow work after.
                Stored payloads keep a short-lived <code className="font-mono text-white/70">recording_url</code>; use
                <code className="font-mono text-white/70"> recording_api_url</code> or GET /calls/:id/recording for a fresh one.
              </p>
            </section>

            <section id="payloads" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Payloads</h2>
              <p className="text-[13.5px] text-white/50 leading-relaxed mb-1">
                <code className="font-mono text-em text-[13px]">call.completed</code> and <code className="font-mono text-em text-[13px]">call.transferred</code> carry
                the whole call, so you can ingest from the webhook alone with no follow-up GET.
              </p>
              <CodeBlock k="pcall" copied={copied} onCopy={copy} label="call.completed" code={CALL_PAYLOAD_JSON} />
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-6 mb-1.5"><code className="font-mono text-em text-[13px]">appointment.booked</code></h3>
              <p className="text-[13px] text-white/45 mb-1">Fires on any create, whether from the AI on a call or POST /appointments. appointment.rescheduled and appointment.canceled carry the same shape (plus previous_appointment_time / cancel_reason). google_event_id and calendar_link are null for a record-only appointment.</p>
              <CodeBlock k="pappt" copied={copied} onCopy={copy} label="appointment.booked" code={APPT_PAYLOAD_JSON} />
            </section>

            <section id="recipes" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Integration recipes</h2>
              <div className="grid gap-4">
                <RecipeCard title="Schedule appointments via the API" sub="availability, create, reschedule, cancel" k="r0" copied={copied} onCopy={copy} code={RECIPE_SCHEDULE} />
                <RecipeCard title="Sync calls to your CRM" sub="GET /calls, scheduled pull" k="r1" copied={copied} onCopy={copy} code={RECIPE_CRM} />
                <RecipeCard title="Real-time alerts via call.completed" sub="Webhook, for Zapier / Make / your own endpoint" k="r2" copied={copied} onCopy={copy} code={RECIPE_REALTIME} />
                <RecipeCard title="Book into a not-yet-native calendar" sub="interim: call.completed, capture then create" k="r3" copied={copied} onCopy={copy} code={RECIPE_NONGOOGLE} />
                <RecipeCard title="Onboard clients via the API" sub="POST /clients, then poll provisioning" k="r4" copied={copied} onCopy={copy} code={RECIPE_ONBOARD} />
              </div>
            </section>

            <section id="calendar" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Calendar booking</h2>
              <p className="text-[14.5px] text-white/60 leading-relaxed">
                An appointment write (create, reschedule, cancel) reaches a real calendar based on what the client has
                connected. The behavior is the same whether the booking comes from the AI on a call or from the API.
              </p>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] divide-y divide-white/[0.05] my-4">
                <div className="px-5 py-3.5">
                  <p className="text-[13.5px] text-white"><b>Google Calendar (live)</b></p>
                  <p className="text-[13px] text-white/50 mt-0.5">Full calendar write. Create checks live availability, reschedule patches the event, cancel removes it. The matching event fires with the event link.</p>
                </div>
                <div className="px-5 py-3.5">
                  <p className="text-[13.5px] text-white"><b>Outlook · M365 · Acuity · Calendly · other (coming)</b></p>
                  <p className="text-[13px] text-white/50 mt-0.5">Native writes to these are being added through a calendar aggregator. The API is already provider-agnostic, so these plug in with no change to your integration.</p>
                </div>
                <div className="px-5 py-3.5">
                  <p className="text-[13.5px] text-white"><b>No calendar connected</b></p>
                  <p className="text-[13px] text-white/50 mt-0.5">A write creates a record-only appointment (a real row, no calendar event), so the API still succeeds. Availability returns 409 calendar_not_connected.</p>
                </div>
              </div>
              <div className="rounded-xl p-4 mt-2" style={{ background: 'rgba(217,166,64,0.07)', border: '1px solid rgba(217,166,64,0.25)' }}>
                <p className="text-[13px] text-white/70 leading-relaxed">
                  A record-only appointment was not checked against any live calendar, so treat it as a requested slot, not a
                  double-book-safe confirmed one, until the client connects a calendar.
                </p>
              </div>
            </section>

            <section id="summary" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Quick reference</h2>
              <p className="text-[13.5px] text-white/50 leading-relaxed mb-1">
                A compact, copyable map of the whole API, handy to paste into an AI assistant you are building an
                integration with.
              </p>
              <CodeBlock k="quickref" copied={copied} onCopy={copy} code={QUICK_REF} />
            </section>

            <section id="roadmap" className="scroll-mt-28">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Roadmap</h2>
              <p className="text-[13.5px] text-white/45 mb-2">Not available yet:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-[13.5px] text-white/60"><Terminal className="w-3.5 h-3.5 text-em shrink-0 mt-1" strokeWidth={2} /> Native calendar writes for Microsoft 365 / Outlook, Cal.com, Calendly, Acuity (in progress via a calendar aggregator; the appointment API already supports them without a change on your side).</li>
                <li className="flex items-start gap-2.5 text-[13.5px] text-white/60"><Terminal className="w-3.5 h-3.5 text-em shrink-0 mt-1" strokeWidth={2} /> A call.followup_required event for calls that need a human (voicemail, callback requested, unanswered, complaint, abandoned).</li>
                <li className="flex items-start gap-2.5 text-[13.5px] text-white/60"><Terminal className="w-3.5 h-3.5 text-em shrink-0 mt-1" strokeWidth={2} /> Client deletion via the API (today DELETE /clients returns 501; offboard from the dashboard).</li>
              </ul>
            </section>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}