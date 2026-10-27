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
  { group: 'Start', items: [['overview', 'Overview'], ['auth', 'Authentication'], ['conventions', 'Conventions']] },
  { group: 'Endpoints', items: [['clients', 'Clients'], ['receptionist', 'Receptionist & KB'], ['calls', 'Calls'], ['appointments', 'Appointments'], ['misc', 'Numbers · Usage'], ['webhook-mgmt', 'Webhook management']] },
  { group: 'Webhooks', items: [['events', 'Event catalog'], ['signature', 'Signature'], ['payloads', 'Payloads']] },
  { group: 'Guides', items: [['calendar', 'Calendar booking'], ['roadmap', 'Roadmap']] },
];

type Ep = { m: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; path: string; rw?: boolean; desc: string };

const CLIENTS: Ep[] = [
  { m: 'GET', path: '/clients', desc: 'List clients (paginated).' },
  { m: 'POST', path: '/clients', rw: true, desc: 'Create and auto-provision a client (assistant + phone number).' },
  { m: 'GET', path: '/clients/:id', desc: 'One client.' },
  { m: 'PATCH', path: '/clients/:id', rw: true, desc: 'Update client fields.' },
  { m: 'DELETE', path: '/clients/:id', rw: true, desc: 'Remove a client.' },
  { m: 'GET', path: '/clients/:id/provisioning-status/:jobId', desc: 'Poll provisioning after a create.' },
];
const RECEPTIONIST: Ep[] = [
  { m: 'GET', path: '/clients/:id/receptionist', desc: 'Current AI config: prompt, voice, greeting, transfer.' },
  { m: 'PATCH', path: '/clients/:id/receptionist', rw: true, desc: 'Update the AI config.' },
  { m: 'GET', path: '/clients/:id/knowledge-base', desc: "The client's knowledge base." },
  { m: 'PUT', path: '/clients/:id/knowledge-base', rw: true, desc: 'Replace the knowledge base.' },
];
const CALLS: Ep[] = [
  { m: 'GET', path: '/calls', desc: 'List calls (paginated). Filter by client_id and date range.' },
  { m: 'GET', path: '/calls/:id', desc: 'One call: outcome, captured details, summary, transcript.' },
  { m: 'GET', path: '/calls/:id/recording', desc: 'A fresh, authenticated recording URL.' },
];
const APPTS: Ep[] = [
  { m: 'GET', path: '/appointments', desc: 'List appointments. Filter by client_id, status, since, until.' },
  { m: 'GET', path: '/appointments/:id', desc: 'One appointment.' },
];
const MISC: Ep[] = [
  { m: 'GET', path: '/numbers', desc: "Phone numbers across the agency's clients." },
  { m: 'GET', path: '/usage', desc: 'Usage: minutes, billable clients.' },
  { m: 'GET', path: '/analytics/calls', desc: 'Call analytics and aggregates.' },
];
const HOOKS: Ep[] = [
  { m: 'GET', path: '/events', desc: 'The event catalog.' },
  { m: 'POST', path: '/webhooks', rw: true, desc: 'Subscribe a URL to events.' },
  { m: 'GET', path: '/webhooks', desc: 'List subscriptions.' },
  { m: 'PATCH', path: '/webhooks/:id', rw: true, desc: 'Update URL, events, or status.' },
  { m: 'DELETE', path: '/webhooks/:id', rw: true, desc: 'Delete a subscription.' },
  { m: 'GET', path: '/webhooks/:id/deliveries', desc: 'Delivery log: status, attempts, response code.' },
  { m: 'POST', path: '/webhooks/:id/ping', rw: true, desc: 'Send a test ping event.' },
];

const EVENTS: [string, string][] = [
  ['call.started', 'A call begins (live event; carries a call_session_id).'],
  ['call.completed', 'A call ends. Enriched with the full call (see payloads).'],
  ['call.transferred', 'The call was transferred to the business line. Enriched.'],
  ['call.escalated', 'A call-center agent took over a live call.'],
  ['appointment.booked', 'The AI booked an appointment. Google Calendar only.'],
  ['client.provisioned', 'A new client finished provisioning.'],
  ['client.provisioning_failed', 'Provisioning failed.'],
  ['client.payment_failed', "A client's payment failed."],
  ['client.subscription_activated', 'A client subscription activated.'],
  ['client.trial_expired', 'A client trial expired.'],
  ['client.canceled', 'A client was canceled.'],
];

const METHOD_COLOR: Record<string, string> = {
  GET: '#01f5d1', POST: '#46c88a', PATCH: '#d9a640', PUT: '#a98bf0', DELETE: '#ef6b5d',
};

const SIGN_CODE =
`// Node
const crypto = require('crypto');
function verify(rawBody, header, secret) {
  const p = Object.fromEntries(header.split(',').map(x => x.split('=')));
  const expected = crypto.createHmac('sha256', secret)
    .update(p.t + '.' + rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(p.v1));
}`;

const SUBSCRIBE_CODE =
`POST /webhooks
{
  "url": "https://yourapp.com/hooks/voiceai",
  "events": ["call.completed", "appointment.booked"],
  "description": "CRM sync"
}`;

const CALL_PAYLOAD =
`id, caller_phone, customer_name, customer_phone, customer_email,
customer_address, service_requested, urgency_level, sentiment,
appointment_booked, appointment_time,
ai_summary, summary, transcript,
recording_url      (short-lived),
recording_api_url  (durable, auth with your API key),
ended_reason, transfer_status, is_spam, spam_reason,
call_language, started_at, ended_at`;

const APPT_PAYLOAD =
`id, client_id, business_name, customer_name, customer_phone,
appointment_time, end_time, duration_minutes, timezone,
service_type, staff_name, notes,
status ("confirmed"), booking_source ("ai_receptionist"),
google_event_id, google_calendar_id, calendar_link, created_at`;

const RECIPE_CODE =
`1. Subscribe a webhook to  call.completed
2. On each event, read:    data.appointment_booked, data.appointment_time,
                           customer_name, customer_phone, service_requested
3. Create the event in your calendar (Microsoft Graph, Acuity,
   Calendly, Cal.com, iCloud) from those fields.`;

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

function CodeBlock({ code, k, copied, onCopy }: { code: string; k: string; copied: string | null; onCopy: (t: string, k: string) => void }) {
  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] my-3">
      <button
        onClick={() => onCopy(code, k)}
        className="absolute top-2.5 right-2.5 font-mono text-[11px] px-2.5 py-1 rounded-md border border-white/[0.12] text-white/55 hover:text-white hover:border-white/30 transition-colors"
      >
        {copied === k ? 'Copied' : 'Copy'}
      </button>
      <pre className="m-0 p-4 overflow-x-auto font-mono text-[12.5px] leading-[1.65] text-white/75 whitespace-pre">{code}</pre>
    </div>
  );
}

function EndpointList({ eps }: { eps: Ep[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] divide-y divide-white/[0.05]">
      {eps.map((e) => (
        <div key={e.m + e.path} className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 px-4 lg:px-5 py-3">
          <span
            className="font-mono text-[10.5px] font-semibold tracking-wide px-2 py-[3px] rounded-md text-[#050505] text-center"
            style={{ background: METHOD_COLOR[e.m], minWidth: 54 }}
          >
            {e.m}
          </span>
          <code className="font-mono text-[12.5px] text-white/90 break-all min-w-0">{e.path}</code>
          {e.rw && <span className="font-mono text-[9.5px] tracking-wide px-1.5 py-[2px] rounded border border-[#a98bf0]/40 text-[#a98bf0]">read_write</span>}
          <span className="basis-full text-[13px] text-white/50 leading-relaxed pl-[66px] max-[520px]:pl-0">{e.desc}</span>
        </div>
      ))}
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
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/agency/settings" className="btn btn-em">Get API keys <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <button
                onClick={() => copy(BASE_URL, 'hero-base')}
                className="btn btn-ghost-dark font-mono text-[12.5px]"
              >
                {copied === 'hero-base' ? 'Copied base URL' : 'Copy base URL'}
              </button>
            </div>
            <div className="mt-9 flex flex-wrap gap-5 text-white/45">
              <span className="inline-flex items-center gap-2 text-[12.5px]"><KeyRound className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> Bearer API key</span>
              <span className="inline-flex items-center gap-2 text-[12.5px]"><Webhook className="w-3.5 h-3.5 text-em" strokeWidth={1.9} /> 11 signed events</span>
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
                <b className="text-white/85"> Settings &rarr; API keys</b>. The full key is shown once at creation; only a
                SHA-256 hash and a short prefix are stored, so a lost key is revoked and replaced, never recovered. Keys
                are agency-scoped.
              </p>
              <CodeBlock k="auth" copied={copied} onCopy={copy} code={'Authorization: Bearer YOUR_API_KEY'} />
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
                  <code className="font-mono text-[13px] text-em">read</code>
                  <p className="text-[13px] text-white/50 mt-1.5">Default. All GET endpoints.</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
                  <code className="font-mono text-[13px]" style={{ color: '#a98bf0' }}>read_write</code>
                  <p className="text-[13px] text-white/50 mt-1.5">POST, PATCH, DELETE. A write with a read key returns 403.</p>
                </div>
              </div>
            </section>

            <section id="conventions" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Conventions</h2>
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-5 mb-1.5">Errors</h3>
              <CodeBlock k="err" copied={copied} onCopy={copy} code={'{ "error": { "type": "insufficient_scope", "message": "This API key is read-only." } }'} />
              <p className="text-[13.5px] text-white/55 leading-relaxed mt-2">
                Status codes: <code className="font-mono text-white/80">401</code> authentication_error,
                <code className="font-mono text-white/80"> 403</code> insufficient_scope,
                <code className="font-mono text-white/80"> 404</code> not_found,
                <code className="font-mono text-white/80"> 400/500</code> api_error.
              </p>
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-6 mb-1.5">Pagination</h3>
              <p className="text-[13.5px] text-white/55 leading-relaxed">
                List endpoints take <code className="font-mono text-white/80">limit</code> (1&ndash;100, default 25) and
                <code className="font-mono text-white/80"> cursor</code>. Pass the returned cursor back to page.
              </p>
              <CodeBlock k="page" copied={copied} onCopy={copy} code={'{ "data": [ ... ], "has_more": true, "next_cursor": "2026-10-20T14:03:00.000Z" }'} />
              <p className="text-[13px] text-white/40 mt-1">Single objects return directly. Only allowlisted public fields are returned; internal IDs and secrets never leave the API.</p>
            </section>

            <section id="clients" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Clients</h2>
              <EndpointList eps={CLIENTS} />
            </section>
            <section id="receptionist" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Receptionist &amp; Knowledge base</h2>
              <EndpointList eps={RECEPTIONIST} />
            </section>
            <section id="calls" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Calls</h2>
              <EndpointList eps={CALLS} />
            </section>
            <section id="appointments" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Appointments <span className="text-white/35 text-[15px] font-normal">(read only)</span></h2>
              <EndpointList eps={APPTS} />
              <p className="text-[13px] text-white/45 mt-3 leading-relaxed">
                There is no endpoint to create or reschedule an appointment. Appointments are created by the AI during
                calls. See <a href="#calendar" className="text-em">Calendar booking</a>.
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
              <CodeBlock k="sub" copied={copied} onCopy={copy} code={SUBSCRIBE_CODE} />
              <p className="text-[13px] text-white/40">Use <code className="font-mono text-white/70">{'"events": ["*"]'}</code> to subscribe to everything.</p>
            </section>

            <section id="events" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-4">Event catalog</h2>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] divide-y divide-white/[0.05]">
                {EVENTS.map(([e, d]) => (
                  <div key={e} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 lg:px-5 py-3">
                    <code className="font-mono text-[12.5px] text-em whitespace-nowrap">{e}</code>
                    <span className="text-[13px] text-white/50 flex-1 min-w-0">{d}</span>
                  </div>
                ))}
              </div>
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-6 mb-1.5">Envelope</h3>
              <CodeBlock k="env" copied={copied} onCopy={copy} code={'{ "id": "evt_uuid", "type": "call.completed", "created_at": "...", "data": { ... } }'} />
            </section>

            <section id="signature" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Signature verification</h2>
              <p className="text-[14px] text-white/60 leading-relaxed">Each delivery is signed. Header:</p>
              <CodeBlock k="sighdr" copied={copied} onCopy={copy} code={'X-VoiceAI-Signature: t=<unix_ts>,v1=<hex>'} />
              <p className="text-[13.5px] text-white/55 leading-relaxed">
                where <code className="font-mono text-white/80">v1 = HMAC-SHA256(secret, t + "." + rawBody)</code>. Verify
                against the raw body before parsing JSON.
              </p>
              <CodeBlock k="sig" copied={copied} onCopy={copy} code={SIGN_CODE} />
              <p className="text-[13px] text-white/40">Deliveries are logged and retried on failure. Stored payloads keep a short-lived recording_url; use recording_api_url or GET /calls/:id/recording for a fresh one.</p>
            </section>

            <section id="payloads" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Payloads</h2>
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-2 mb-1.5"><code className="font-mono text-em text-[13px]">call.completed</code> / <code className="font-mono text-em text-[13px]">call.transferred</code></h3>
              <CodeBlock k="pcall" copied={copied} onCopy={copy} code={CALL_PAYLOAD} />
              <p className="text-[13px] text-white/40">Carries the whole call, so you can ingest it from the webhook alone with no follow-up GET.</p>
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-6 mb-1.5"><code className="font-mono text-em text-[13px]">appointment.booked</code></h3>
              <CodeBlock k="pappt" copied={copied} onCopy={copy} code={APPT_PAYLOAD} />
            </section>

            <section id="calendar" className="scroll-mt-28 mb-14">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Calendar booking</h2>
              <p className="text-[14.5px] text-white/60 leading-relaxed">
                <b className="text-white/85">Automated booking is Google Calendar only.</b> The AI checks live availability
                and writes the event during the call only when the client has Google Calendar connected. Without it, the AI
                captures the request but does not confirm a slot, and <code className="font-mono text-em-deep">appointment.booked</code> does not fire.
              </p>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] divide-y divide-white/[0.05] my-4">
                <div className="px-5 py-3.5">
                  <p className="text-[13.5px] text-white"><b>Google Calendar</b></p>
                  <p className="text-[13px] text-white/50 mt-0.5">Full automated booking. appointment.booked fires with the event link.</p>
                </div>
                <div className="px-5 py-3.5">
                  <p className="text-[13.5px] text-white"><b>Outlook · M365 · Acuity · Calendly · other</b></p>
                  <p className="text-[13px] text-white/50 mt-0.5">No native automated booking yet. Use the recipe below.</p>
                </div>
              </div>
              <h3 className="font-display text-[15px] font-medium text-white/90 mt-5 mb-1.5">Recipe: non-Google calendars</h3>
              <CodeBlock k="recipe" copied={copied} onCopy={copy} code={RECIPE_CODE} />
              <div className="rounded-xl p-4 mt-2" style={{ background: 'rgba(217,166,64,0.07)', border: '1px solid rgba(217,166,64,0.25)' }}>
                <p className="text-[13px] text-white/70 leading-relaxed">
                  The AI did not check that calendar's live availability or confirm a slot on the call, so treat it as a
                  requested appointment, not a double-book-safe confirmed one. Real-time availability against a non-Google
                  calendar needs a native integration.
                </p>
              </div>
            </section>

            <section id="roadmap" className="scroll-mt-28">
              <h2 className="font-display text-[22px] font-semibold text-white tracking-tight mb-3">Roadmap</h2>
              <p className="text-[13.5px] text-white/45 mb-2">Not available yet:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5 text-[13.5px] text-white/60"><Terminal className="w-3.5 h-3.5 text-em shrink-0 mt-1" strokeWidth={2} /> Native automated booking for Microsoft 365 / Outlook, Cal.com, Calendly, Acuity.</li>
                <li className="flex items-start gap-2.5 text-[13.5px] text-white/60"><Terminal className="w-3.5 h-3.5 text-em shrink-0 mt-1" strokeWidth={2} /> A write API for appointments (create / reschedule / cancel) with matching events.</li>
              </ul>
            </section>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
