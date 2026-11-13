'use client';

/**
 * In-dashboard Developer Reference for the agency-facing REST API (/api/v1)
 * and outbound webhooks. This is the single source of truth operators land on
 * from Settings > API ("Developer Reference") and Settings > Webhooks.
 *
 * Everything here mirrors the deployed backend exactly:
 *   - routes:      voiceai-connect-backend/src/routes/v1/index.js
 *   - auth:        voiceai-connect-backend/src/middleware/api-auth.js
 *   - webhooks:    voiceai-connect-backend/src/lib/webhooks.js
 * When the backend changes, update this page in the same change.
 *
 * It reuses the agency context + theme, and gates on Scale (or any call-center
 * account) using the same rule as ApiKeysTab/WebhooksTab.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Code, Key, Webhook, ShieldCheck, AlertTriangle, ListTree, Gauge, Layers,
  Phone, CalendarClock, BookOpen, Database, Radio, Copy, Check, ChevronRight,
  Terminal, ArrowLeft, Lock, Download,
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';
import UpgradeGate from '@/components/agency/UpgradeGate';

// Production API origin. Falls back to the live backend so every example shows
// a full URL with its domain even before the env var is wired in a preview.
const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://urchin-app-bqb4i.ondigitalocean.app';
const BASE = `${API_ORIGIN}/api/v1`;

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function CopyButton({ text, theme }: { text: string; theme: any }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium flex-shrink-0 transition-colors"
      style={{ backgroundColor: 'transparent', border: `1px solid ${theme.inputBorder}`, color: copied ? theme.primary : theme.textMuted }}
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function Code2({ children, theme }: { children: React.ReactNode; theme: any }) {
  return (
    <code
      className="rounded-md px-1.5 py-0.5 text-[12px] font-mono"
      style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: theme.text }}
    >
      {children}
    </code>
  );
}

function CodeBlock({ code, label, theme }: { code: string; label?: string; theme: any }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderBottom: `1px solid ${theme.inputBorder}` }}>
        <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: theme.textMuted }}>{label || 'Example'}</span>
        <CopyButton text={code} theme={theme} />
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-[12px] leading-relaxed" style={{ backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : '#fff' }}>
        <code className="font-mono whitespace-pre" style={{ color: theme.text }}>{code}</code>
      </pre>
    </div>
  );
}

const METHOD_COLORS: Record<string, { bg: string; fg: string }> = {
  GET: { bg: 'rgba(59,130,246,0.15)', fg: '#3b82f6' },
  POST: { bg: 'rgba(34,197,94,0.15)', fg: '#22c55e' },
  PATCH: { bg: 'rgba(234,179,8,0.18)', fg: '#ca8a04' },
  PUT: { bg: 'rgba(234,179,8,0.18)', fg: '#ca8a04' },
  DELETE: { bg: 'rgba(239,68,68,0.15)', fg: '#ef4444' },
};

function MethodPill({ method }: { method: string }) {
  const c = METHOD_COLORS[method] || METHOD_COLORS.GET;
  return (
    <span className="text-[10px] font-bold font-mono px-2 py-1 rounded-md flex-shrink-0" style={{ backgroundColor: c.bg, color: c.fg }}>
      {method}
    </span>
  );
}

function ScopePill({ scope, theme }: { scope: 'read' | 'read_write'; theme: any }) {
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: theme.primary15, color: theme.primary }}
      title={scope === 'read_write' ? 'Requires a Read & write key' : 'Any valid key (read is enough)'}
    >
      {scope === 'read_write' ? 'read & write' : 'read'}
    </span>
  );
}

// A row in a parameters / fields table.
interface Field { name: string; type: string; note: string; }

function FieldsTable({ title, rows, theme }: { title: string; rows: Field[]; theme: any }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: theme.textMuted }}>{title}</p>
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
        {rows.map((f, i) => (
          <div
            key={f.name}
            className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-3 gap-y-1 px-3 py-2.5"
            style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.inputBorder}`, backgroundColor: i % 2 === 1 ? (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)') : 'transparent' }}
          >
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-[12px] font-mono font-medium break-all" style={{ color: theme.text }}>{f.name}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-mono" style={{ color: theme.primary }}>{f.type}</span>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: theme.textMuted }}>{f.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// One endpoint block.
interface EndpointDef {
  method: string;
  path: string;
  scope: 'read' | 'read_write';
  summary: string;
  query?: Field[];
  body?: Field[];
  example: string;
  response?: string;
  notes?: string[];
}

function Endpoint({ ep, theme }: { ep: EndpointDef; theme: any }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
      <div className="flex items-center gap-2 flex-wrap">
        <MethodPill method={ep.method} />
        <code className="text-[13px] font-mono font-medium break-all" style={{ color: theme.text }}>{ep.path}</code>
        <ScopePill scope={ep.scope} theme={theme} />
      </div>
      <p className="text-[13px] mt-2.5 leading-relaxed" style={{ color: theme.textMuted }}>{ep.summary}</p>

      {ep.query && <FieldsTable title="Query parameters" rows={ep.query} theme={theme} />}
      {ep.body && <FieldsTable title="Body fields" rows={ep.body} theme={theme} />}

      {ep.notes && ep.notes.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {ep.notes.map((n, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed" style={{ color: theme.textMuted }}>
              <ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3">
        <CodeBlock code={ep.example} label="Request" theme={theme} />
        {ep.response && <CodeBlock code={ep.response} label="Response" theme={theme} />}
      </div>
    </div>
  );
}

function SectionHeading({ id, icon: Icon, title, theme, sub }: { id: string; icon: any; title: string; theme: any; sub?: string }) {
  return (
    <div id={id} className="scroll-mt-24 pt-2">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <Icon className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold" style={{ color: theme.text }}>{title}</h2>
      </div>
      {sub && <p className="text-[13px] mt-2 leading-relaxed" style={{ color: theme.textMuted }}>{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Webhook event catalog (mirrors EVENT_TYPES + each dispatch site's data shape)
// ---------------------------------------------------------------------------
interface EventDef { type: string; when: string; payload: string; }

function EventCard({ ev, theme }: { ev: EventDef; theme: any }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
      <div className="flex items-center gap-2 flex-wrap">
        <Radio className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />
        <code className="text-[13px] font-mono font-semibold" style={{ color: theme.text }}>{ev.type}</code>
      </div>
      <p className="text-[13px] mt-2 leading-relaxed" style={{ color: theme.textMuted }}>{ev.when}</p>
      <div className="mt-3">
        <CodeBlock code={ev.payload} label="Payload" theme={theme} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown export
// ---------------------------------------------------------------------------
// Builds the entire reference as a single Markdown document from the same
// structured data the page renders, so the export never drifts from the UI.
// Markdown is the most useful format to paste or upload into an AI assistant:
// it's plain text, keeps the endpoint/field/example structure, and carries no
// binary overhead.
function referenceMarkdown(
  groups: Array<{ id: string; title: string; sub?: string; endpoints: EndpointDef[] }>,
  events: EventDef[],
): string {
  const H = 'Authorization: Bearer YOUR_API_KEY';
  const out: string[] = [];
  const p = (s = '') => out.push(s);

  p('# VoiceAI Connect - API & Webhooks Reference');
  p('');
  p('The complete REST API and webhooks reference for VoiceAI Connect, exported as plain Markdown so it can be uploaded into an AI assistant as context.');
  p('');
  p('## Basics');
  p('');
  p(`- Base URL: \`${BASE}\` - every path below is relative to this. The current version is v1 and stays stable; breaking changes ship under a new version prefix.`);
  p(`- Authentication: send \`${H}\` on every request. Create and manage keys under Settings > API.`);
  p('- Scopes: a `read` key can call every GET endpoint; a `read_write` key can also create and change data. Calling a write endpoint with a read-only key returns `403 insufficient_scope`.');
  p('- Pagination: list endpoints are cursor-paginated. Pass `limit` (1 to 100) and `cursor` (the `next_cursor` from the previous page).');
  p('- Rate limits: responses carry rate-limit headers; a `429` means you have hit the limit, retry after the window resets.');
  p('');

  for (const g of groups) {
    p(`## ${g.title}`);
    if (g.sub) { p(''); p(g.sub); }
    p('');
    for (const ep of g.endpoints) {
      p(`### ${ep.method} ${ep.path}  (${ep.scope})`);
      p('');
      p(ep.summary);
      p('');
      if (ep.query && ep.query.length) {
        p('Query parameters:');
        for (const f of ep.query) p(`- \`${f.name}\` (${f.type}): ${f.note}`);
        p('');
      }
      if (ep.body && ep.body.length) {
        p('Body fields:');
        for (const f of ep.body) p(`- \`${f.name}\` (${f.type}): ${f.note}`);
        p('');
      }
      p('Example:');
      p('');
      p('```bash');
      p(ep.example);
      p('```');
      p('');
      if (ep.response) {
        p('Response:');
        p('');
        p('```json');
        p(ep.response);
        p('```');
        p('');
      }
      if (ep.notes && ep.notes.length) {
        p('Notes:');
        for (const n of ep.notes) p(`- ${n}`);
        p('');
      }
    }
  }

  p('## Webhook Events');
  p('');
  p('Events are delivered as JSON POSTs to the endpoints you configure under Settings > Webhooks. Every event has an `id`, a `type`, a `created_at`, and a `data` object.');
  p('');
  for (const ev of events) {
    p(`### ${ev.type}`);
    p('');
    p(ev.when);
    p('');
    p('Payload:');
    p('');
    p('```json');
    p(ev.payload);
    p('```');
    p('');
  }

  return out.join('\n');
}

// Page
// ---------------------------------------------------------------------------
export default function DeveloperReferencePage() {
  const { agency } = useAgency();
  const theme = useTheme();

  const isTrialing = ['trialing', 'trial'].includes(agency?.subscription_status || '');
  const isScale = ((isTrialing ? 'scale' : agency?.plan_type) === 'scale') || agency?.is_call_center === true;

  // -------------------------------------------------------------------------
  // Endpoint data (grouped). Kept verbatim-accurate to /api/v1.
  // -------------------------------------------------------------------------
  const groups = useMemo(() => buildGroups(theme), [theme]);
  const events = useMemo(() => buildEvents(), []);

  // Download the whole reference as a single Markdown file, ready to upload into
  // an AI assistant.
  const exportReference = () => {
    const md = referenceMarkdown(groups, events);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voiceai-connect-api-reference.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const nav = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'base-url', label: 'Base URL', icon: Code },
    { id: 'auth', label: 'Authentication', icon: Key },
    { id: 'scopes', label: 'Scopes & Access', icon: ShieldCheck },
    { id: 'rate-limits', label: 'Rate Limits', icon: Gauge },
    { id: 'errors', label: 'Errors', icon: AlertTriangle },
    { id: 'pagination', label: 'Pagination', icon: Layers },
    { id: 'ep-account', label: 'Account', icon: ListTree },
    { id: 'ep-clients', label: 'Clients', icon: ListTree },
    { id: 'ep-calls', label: 'Calls', icon: Phone },
    { id: 'ep-receptionist', label: 'Receptionist', icon: ListTree },
    { id: 'ep-kb', label: 'Knowledge Base', icon: ListTree },
    { id: 'ep-numbers', label: 'Phone Numbers', icon: Phone },
    { id: 'ep-usage', label: 'Usage & Analytics', icon: Gauge },
    { id: 'ep-appointments', label: 'Appointments', icon: CalendarClock },
    { id: 'ep-webhooks', label: 'Webhook Endpoints', icon: Webhook },
    { id: 'objects', label: 'Object Reference', icon: Database },
    { id: 'webhooks', label: 'Webhooks Guide', icon: Radio },
    { id: 'events', label: 'Event Catalog', icon: Radio },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/agency/settings?tab=developer"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium mb-4"
            style={{ color: theme.textMuted }}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
          </Link>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-11 w-11 rounded-2xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
                <Terminal className="h-6 w-6" style={{ color: theme.primary }} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: theme.text }}>Developer Reference</h1>
                <p className="text-[13px] mt-0.5" style={{ color: theme.textMuted }}>The complete API and webhooks reference for VoiceAI Connect.</p>
              </div>
            </div>
            {isScale && (
              <button
                onClick={exportReference}
                title="Download the full reference as Markdown, ready to upload into an AI assistant"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold flex-shrink-0 transition-colors"
                style={{ backgroundColor: theme.primary15, color: theme.primary, border: `1px solid ${theme.primary}` }}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export for AI</span>
              </button>
            )}
          </div>
        </div>

        <UpgradeGate
          locked={!isScale}
          tier="scale"
          theme={theme}
          title="Unlock the API with Scale"
          description="The REST API and webhooks give you programmatic access to clients, calls, appointments, usage, and real-time events so you can drive your own CRM, dashboards, and automations. Scale unlocks the full developer platform."
        >
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
            {/* Section nav */}
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                {nav.map((n) => (
                  <a
                    key={n.id}
                    href={`#${n.id}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] sm:text-[13px] font-medium whitespace-nowrap transition-colors"
                    style={{ color: theme.textMuted }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    <n.icon className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />
                    {n.label}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="min-w-0 space-y-10">

              {/* OVERVIEW */}
              <section className="space-y-3">
                <SectionHeading id="overview" icon={BookOpen} title="Overview" theme={theme} />
                <p className="text-[14px] leading-relaxed" style={{ color: theme.text }}>
                  The VoiceAI Connect API is a REST interface over your agency account. Every request is scoped to your agency by your API key, so you only ever see and change your own clients, calls, and data. Responses are JSON. Requests with a body send JSON and set <Code2 theme={theme}>Content-Type: application/json</Code2>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { k: 'Base URL', v: BASE },
                    { k: 'Auth', v: 'Bearer API key' },
                    { k: 'Format', v: 'JSON over HTTPS' },
                  ].map((c) => (
                    <div key={c.k} className="rounded-xl p-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textMuted }}>{c.k}</p>
                      <p className="text-[12px] font-mono mt-1 break-all" style={{ color: theme.text }}>{c.v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
                  <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
                  <p className="text-[12.5px] leading-relaxed" style={{ color: theme.text }}>
                    The API and webhooks are part of the Scale plan. Call-center accounts get them on any plan. Manage your keys under Settings, API, and your endpoints under Settings, Webhooks.
                  </p>
                </div>
              </section>

              {/* BASE URL */}
              <section className="space-y-3">
                <SectionHeading id="base-url" icon={Code} title="Base URL and Versioning" theme={theme}
                  sub="All endpoints are relative to the versioned base. The current version is v1. When a breaking change ships it lands under a new version prefix, so v1 stays stable." />
                <CodeBlock theme={theme} label="Base URL" code={BASE} />
                <p className="text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>
                  A path like <Code2 theme={theme}>/clients</Code2> in this reference means <Code2 theme={theme}>{`${BASE}/clients`}</Code2>.
                </p>
              </section>

              {/* AUTH */}
              <section className="space-y-3">
                <SectionHeading id="auth" icon={Key} title="Authentication" theme={theme}
                  sub="Create a key under Settings, API. The full key is shown once at creation, so copy it then. Only a prefix is stored for display afterward, and the key itself is kept as a one-way hash, so it can never be read back. Treat a key like a password." />
                <p className="text-[13px] leading-relaxed" style={{ color: theme.text }}>Send your key on every request. Either header works:</p>
                <CodeBlock theme={theme} label="Authorization header (preferred)" code={`curl ${BASE}/account \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />
                <CodeBlock theme={theme} label="x-api-key header (alternative)" code={`curl ${BASE}/account \\
  -H "x-api-key: YOUR_API_KEY"`} />
                <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.textMuted }} />
                  <p className="text-[12.5px] leading-relaxed" style={{ color: theme.textMuted }}>
                    A missing or invalid key returns <Code2 theme={theme}>401 authentication_error</Code2>. A key on a suspended account returns <Code2 theme={theme}>403 account_suspended</Code2>. A key on a plan without API access returns <Code2 theme={theme}>403 upgrade_required</Code2>.
                  </p>
                </div>
              </section>

              {/* SCOPES */}
              <section className="space-y-3">
                <SectionHeading id="scopes" icon={ShieldCheck} title="Scopes and Access" theme={theme}
                  sub="Each key has a scope. Pick the narrowest one that does the job." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                    <div className="flex items-center gap-2 mb-1.5"><ScopePill scope="read" theme={theme} /><span className="text-[13px] font-semibold" style={{ color: theme.text }}>Read only</span></div>
                    <p className="text-[12.5px] leading-relaxed" style={{ color: theme.textMuted }}>Can call every GET endpoint: list and fetch clients, calls, appointments, usage, numbers, and webhook config. Cannot create or change anything.</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                    <div className="flex items-center gap-2 mb-1.5"><ScopePill scope="read_write" theme={theme} /><span className="text-[13px] font-semibold" style={{ color: theme.text }}>Read & write</span></div>
                    <p className="text-[12.5px] leading-relaxed" style={{ color: theme.textMuted }}>Everything a read key can do, plus create clients, update receptionist settings, book, reschedule and cancel appointments, and manage webhook endpoints.</p>
                  </div>
                </div>
                <p className="text-[12.5px] leading-relaxed" style={{ color: theme.textMuted }}>
                  Endpoints that change data are marked <ScopePill scope="read_write" theme={theme} /> in this reference. Calling one with a read-only key returns <Code2 theme={theme}>403 insufficient_scope</Code2>.
                </p>
              </section>

              {/* RATE LIMITS */}
              <section className="space-y-3">
                <SectionHeading id="rate-limits" icon={Gauge} title="Rate Limits" theme={theme}
                  sub="Each API key is limited to 120 requests per minute. Every response carries your current standing in headers." />
                <FieldsTable theme={theme} title="Rate-limit headers" rows={[
                  { name: 'X-RateLimit-Limit', type: 'number', note: 'Your ceiling per minute (120).' },
                  { name: 'X-RateLimit-Remaining', type: 'number', note: 'Requests left in the current window.' },
                  { name: 'X-RateLimit-Reset', type: 'unix seconds', note: 'When the window resets and the count returns to the full limit.' },
                ]} />
                <p className="text-[13px] leading-relaxed" style={{ color: theme.text }}>
                  Going over the limit returns <Code2 theme={theme}>429 rate_limit_exceeded</Code2> with a <Code2 theme={theme}>Retry-After</Code2> header (seconds to wait). Back off and retry after that delay.
                </p>
                <CodeBlock theme={theme} label="429 response" code={`HTTP/1.1 429 Too Many Requests
Retry-After: 23
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0

{
  "error": {
    "type": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in a moment."
  }
}`} />
              </section>

              {/* ERRORS */}
              <section className="space-y-3">
                <SectionHeading id="errors" icon={AlertTriangle} title="Errors" theme={theme}
                  sub="Every error uses the same envelope. Switch on error.type in code, and show error.message to a human." />
                <CodeBlock theme={theme} label="Error envelope" code={`{
  "error": {
    "type": "invalid_request",
    "message": "client_id is required."
  }
}`} />
                <FieldsTable theme={theme} title="Status codes and types" rows={[
                  { name: '400 invalid_request', type: 'bad input', note: 'A required field is missing or a value is malformed. The message says which.' },
                  { name: '401 authentication_error', type: 'auth', note: 'Missing, malformed, or unknown API key.' },
                  { name: '403 account_suspended', type: 'access', note: 'The account tied to this key is suspended.' },
                  { name: '403 upgrade_required', type: 'access', note: 'The plan does not include API access. Response also carries upgrade_required: true and current_plan.' },
                  { name: '403 insufficient_scope', type: 'access', note: 'A read-only key called a write endpoint.' },
                  { name: '404 not_found', type: 'missing', note: 'No such resource, or it does not belong to your agency.' },
                  { name: '409 slot_unavailable', type: 'conflict', note: 'Appointment time is taken. Response may include available_slots.' },
                  { name: '409 calendar_not_connected', type: 'conflict', note: 'Live availability was requested for a client with no connected calendar.' },
                  { name: '429 rate_limit_exceeded', type: 'throttle', note: 'Too many requests. Honor Retry-After.' },
                  { name: '500 api_error', type: 'server', note: 'Something failed on our side. Safe to retry with backoff.' },
                  { name: '501 not_implemented', type: 'unavailable', note: 'Endpoint is intentionally not available yet (client deletion).' },
                  { name: '502 calendar_error', type: 'upstream', note: 'The client calendar provider could not be reached.' },
                ]} />
              </section>

              {/* PAGINATION */}
              <section className="space-y-3">
                <SectionHeading id="pagination" icon={Layers} title="Pagination" theme={theme}
                  sub="List endpoints are cursor-paginated and newest-first. Ask for a page with limit, then follow next_cursor until has_more is false." />
                <FieldsTable theme={theme} title="Query parameters" rows={[
                  { name: 'limit', type: 'number, 1 to 100', note: 'Page size. Defaults to 25.' },
                  { name: 'cursor', type: 'string', note: 'The next_cursor from the previous page. Omit for the first page.' },
                ]} />
                <CodeBlock theme={theme} label="List envelope" code={`{
  "data": [ /* ...items, newest first... */ ],
  "has_more": true,
  "next_cursor": "2026-11-01T18:22:03.511Z"
}`} />
                <CodeBlock theme={theme} label="Walking pages" code={`# first page
curl "${BASE}/calls?limit=50" -H "Authorization: Bearer YOUR_API_KEY"

# next page, using next_cursor from the response above
curl "${BASE}/calls?limit=50&cursor=2026-11-01T18:22:03.511Z" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />
              </section>

              {/* ENDPOINT GROUPS */}
              {groups.map((g) => (
                <section key={g.id} className="space-y-4">
                  <SectionHeading id={g.id} icon={g.icon} title={g.title} theme={theme} sub={g.sub} />
                  <div className="space-y-3">
                    {g.endpoints.map((ep, i) => <Endpoint key={i} ep={ep} theme={theme} />)}
                  </div>
                </section>
              ))}

              {/* OBJECT REFERENCE */}
              <section className="space-y-4">
                <SectionHeading id="objects" icon={Database} title="Object Reference" theme={theme}
                  sub="The exact fields returned for the main objects. Only these allowlisted fields are ever exposed, so internal columns never leak." />
                <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <p className="text-[13px] font-semibold mb-1" style={{ color: theme.text }}>The Client object</p>
                  <FieldsTable theme={theme} title="Fields" rows={CLIENT_FIELDS} />
                </div>
                <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <p className="text-[13px] font-semibold mb-1" style={{ color: theme.text }}>The Call object</p>
                  <FieldsTable theme={theme} title="Fields" rows={CALL_FIELDS} />
                </div>
                <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <p className="text-[13px] font-semibold mb-1" style={{ color: theme.text }}>The Appointment object</p>
                  <FieldsTable theme={theme} title="Fields" rows={APPOINTMENT_FIELDS} />
                </div>
                <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <p className="text-[13px] font-semibold mb-1" style={{ color: theme.text }}>The Receptionist object</p>
                  <FieldsTable theme={theme} title="Fields" rows={RECEPTIONIST_FIELDS} />
                </div>
              </section>

              {/* WEBHOOKS GUIDE */}
              <section className="space-y-3">
                <SectionHeading id="webhooks" icon={Radio} title="Webhooks Guide" theme={theme}
                  sub="Instead of polling, register an endpoint and we POST a signed JSON event to it the moment something happens: a call finishes, an appointment is booked, a client is provisioned, billing changes." />

                <p className="text-[13px] font-semibold" style={{ color: theme.text }}>The event envelope</p>
                <p className="text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>Every event, for every type, arrives in the same shape. The per-event detail lives in <Code2 theme={theme}>data</Code2>.</p>
                <CodeBlock theme={theme} label="Envelope" code={`{
  "id": "0e8c...uuid",          // unique event id
  "type": "call.completed",     // one of the event types below
  "created_at": "2026-11-07T15:04:22.118Z",
  "data": { /* event-specific, see the catalog */ }
}`} />

                <p className="text-[13px] font-semibold pt-1" style={{ color: theme.text }}>Delivery headers</p>
                <FieldsTable theme={theme} title="Headers on every POST" rows={[
                  { name: 'X-VoiceAI-Signature', type: 'string', note: 'Signature to verify the body. Format: t=<unix>,v1=<hex>. See below.' },
                  { name: 'X-VoiceAI-Event', type: 'string', note: 'The event type, so you can route before parsing.' },
                  { name: 'X-VoiceAI-Delivery', type: 'string', note: 'The delivery id, useful for logging and idempotency.' },
                  { name: 'User-Agent', type: 'string', note: 'VoiceAIConnect-Webhooks/1' },
                ]} />

                <p className="text-[13px] font-semibold pt-1" style={{ color: theme.text }}>Verify the signature</p>
                <p className="text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>
                  The header is <Code2 theme={theme}>t=&lt;unix&gt;,v1=&lt;hmac&gt;</Code2>. Recompute the HMAC with your endpoint secret (shown once when you add the endpoint) over the exact string <Code2 theme={theme}>{`\${t}.\${rawBody}`}</Code2> using SHA-256, then compare. Use the raw request body, not a re-serialized object, or the signature will not match.
                </p>
                <CodeBlock theme={theme} label="Node.js (Express)" code={`const crypto = require('crypto');

// Capture the RAW body for this route (do not JSON-parse first):
//   app.use('/webhooks/voiceai', express.raw({ type: 'application/json' }));

function verify(req, secret) {
  const header = req.get('X-VoiceAI-Signature') || '';
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  const raw = req.body.toString('utf8');            // Buffer -> string
  const expected = crypto.createHmac('sha256', secret)
    .update(parts.t + '.' + raw)
    .digest('hex');
  // constant-time compare
  const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 || ''));
  if (!ok) throw new Error('bad signature');
  return JSON.parse(raw);
}`} />
                <CodeBlock theme={theme} label="Python (Flask)" code={`import hmac, hashlib

def verify(request, secret):
    header = request.headers.get("X-VoiceAI-Signature", "")
    parts = dict(p.split("=", 1) for p in header.split(","))
    raw = request.get_data()                       # raw bytes
    expected = hmac.new(
        secret.encode(),
        f"{parts['t']}.".encode() + raw,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, parts.get("v1", "")):
        raise ValueError("bad signature")
    return raw`} />

                <p className="text-[13px] font-semibold pt-1" style={{ color: theme.text }}>Responding, retries, and ordering</p>
                <ul className="space-y-1.5">
                  {[
                    'Return a 2xx quickly (within 10 seconds). Any non-2xx, a timeout, or a connection error counts as a failure.',
                    'Failed deliveries retry up to 6 attempts with backoff of 1, 5, 30, 120, 360, then 720 minutes. After the sixth the delivery is marked failed.',
                    'Do the real work asynchronously. Acknowledge first, process after, so a slow job never trips the 10-second timeout.',
                    'Events can arrive more than once. Use the event id (or X-VoiceAI-Delivery) to dedupe, and treat handling as idempotent.',
                    'Your endpoint must be a public http(s) URL. Localhost and private or internal addresses are rejected.',
                    'Inspect recent attempts with GET /webhooks/:id/deliveries, or send a test with POST /webhooks/:id/ping.',
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed" style={{ color: theme.textMuted }}>
                      <ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: theme.primary }} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-[13px] font-semibold pt-1" style={{ color: theme.text }}>The ping event</p>
                <p className="text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>Sending a test delivers a <Code2 theme={theme}>ping</Code2> event. It uses the same envelope and signature so you can validate your handler end to end before real traffic.</p>
                <CodeBlock theme={theme} label="ping payload" code={`{
  "id": "e2b1...uuid",
  "type": "ping",
  "created_at": "2026-11-07T15:04:22.118Z",
  "data": { "message": "Test event from VoiceAI Connect." }
}`} />
              </section>

              {/* EVENT CATALOG */}
              <section className="space-y-4">
                <SectionHeading id="events" icon={Radio} title="Event Catalog" theme={theme}
                  sub="The 14 event types and the data each one carries. Subscribe to specific types, or to all of them with a single asterisk when you create the endpoint." />
                <div className="space-y-3">
                  {events.map((ev) => <EventCard key={ev.type} ev={ev} theme={theme} />)}
                </div>
              </section>

              <div className="pt-4 text-center">
                <p className="text-[12px]" style={{ color: theme.textMuted }}>
                  Questions, or a field you need that is not exposed yet? Reach out and we will add it.
                </p>
              </div>
            </div>
          </div>
        </UpgradeGate>
      </div>
    </div>
  );
}

// ===========================================================================
// DATA
// ===========================================================================

const CLIENT_FIELDS: Field[] = [
  { name: 'id', type: 'string', note: 'Client id. Use it everywhere a :id client path or client_id filter is needed.' },
  { name: 'business_name', type: 'string', note: 'The business name.' },
  { name: 'email', type: 'string', note: 'Client account email.' },
  { name: 'owner_name', type: 'string', note: 'Business owner name (used as a transfer fallback).' },
  { name: 'owner_phone', type: 'string', note: 'Owner phone in E.164.' },
  { name: 'notification_phone', type: 'string', note: 'Where call recap texts go.' },
  { name: 'industry', type: 'string', note: 'Industry key, for example pest_control.' },
  { name: 'status', type: 'string', note: 'Provisioning/account status, for example active.' },
  { name: 'subscription_status', type: 'string', note: 'Billing status, for example active, trialing, past_due.' },
  { name: 'plan_type', type: 'string', note: 'The client plan.' },
  { name: 'is_test_client', type: 'boolean', note: 'True for a test client.' },
  { name: 'business_city / business_state / country', type: 'string', note: 'Business location.' },
  { name: 'business_website', type: 'string', note: 'Website URL.' },
  { name: 'phone_number', type: 'string', note: 'The provisioned AI receptionist number, E.164. Null until provisioned.' },
  { name: 'forwarding_confirmed', type: 'boolean', note: 'Whether call forwarding has been verified.' },
  { name: 'created_at', type: 'ISO 8601', note: 'When the client was created.' },
];

const CALL_FIELDS: Field[] = [
  { name: 'id', type: 'string', note: 'Call id.' },
  { name: 'client_id', type: 'string', note: 'Which client took the call.' },
  { name: 'caller_phone', type: 'string', note: 'The caller number.' },
  { name: 'customer_name / customer_phone / customer_email / customer_address', type: 'string', note: 'Caller details captured by the AI, when given.' },
  { name: 'service_requested', type: 'string', note: 'What the caller asked for.' },
  { name: 'call_status', type: 'string', note: 'completed, transferred, and so on.' },
  { name: 'urgency_level', type: 'string', note: 'AI-assessed urgency.' },
  { name: 'sentiment', type: 'string', note: 'AI-assessed sentiment.' },
  { name: 'appointment_booked', type: 'boolean', note: 'Whether the call booked an appointment.' },
  { name: 'appointment_time', type: 'ISO 8601', note: 'The booked time, if any.' },
  { name: 'duration_seconds', type: 'number', note: 'Call length in seconds.' },
  { name: 'started_at / ended_at', type: 'ISO 8601', note: 'Call start and end.' },
  { name: 'ai_summary / summary', type: 'string', note: 'AI summary of the call.' },
  { name: 'transcript', type: 'string', note: 'Full transcript.' },
  { name: 'recording_url', type: 'string', note: 'A short-lived signed link to the recording. Expires, so refetch when needed.' },
  { name: 'recording_api_url', type: 'string', note: 'A stable endpoint that returns a fresh recording link on demand.' },
  { name: 'ended_reason', type: 'string', note: 'Why the call ended.' },
  { name: 'transfer_status', type: 'string', note: 'Outcome if the call was transferred.' },
  { name: 'is_spam / spam_reason', type: 'boolean / string', note: 'Spam flag and why.' },
  { name: 'call_language', type: 'string', note: 'Detected language, for example en or es.' },
  { name: 'created_at', type: 'ISO 8601', note: 'When the call row was created.' },
];

const APPOINTMENT_FIELDS: Field[] = [
  { name: 'id', type: 'string', note: 'Appointment id.' },
  { name: 'client_id', type: 'string', note: 'Which client the appointment belongs to.' },
  { name: 'customer_name / customer_phone / customer_email', type: 'string', note: 'Who the appointment is for.' },
  { name: 'appointment_time', type: 'ISO 8601', note: 'Start time.' },
  { name: 'end_time', type: 'ISO 8601', note: 'Derived from start plus duration, so you get a ready-to-use window.' },
  { name: 'duration / duration_minutes', type: 'number', note: 'Length in minutes (both names carry the same value).' },
  { name: 'service_type', type: 'string', note: 'Service booked.' },
  { name: 'status', type: 'string', note: 'confirmed, canceled, and so on.' },
  { name: 'notes', type: 'string', note: 'Free-text notes.' },
  { name: 'staff_name', type: 'string', note: 'Assigned staff, if any.' },
  { name: 'booking_source', type: 'string', note: 'How it was booked, for example ai_receptionist.' },
  { name: 'google_event_id / google_calendar_id', type: 'string', note: 'Google Calendar linkage when the client has a connected calendar.' },
  { name: 'calcom_booking_id', type: 'string', note: 'Cal.com booking id when applicable.' },
  { name: 'created_at / updated_at', type: 'ISO 8601', note: 'Timestamps.' },
];

const RECEPTIONIST_FIELDS: Field[] = [
  { name: 'client_id', type: 'string', note: 'The client this config belongs to.' },
  { name: 'greeting_message', type: 'string', note: 'The opening line the AI says.' },
  { name: 'voice_id', type: 'string', note: 'The TTS voice id.' },
  { name: 'human_handoff', type: "'transfer' | 'message'", note: 'What happens when a caller wants a human: dial the transfer number, or take a message.' },
  { name: 'transfer_phone', type: 'string', note: 'Number to transfer to when handoff is transfer. E.164.' },
  { name: 'forwarding_mode', type: 'string', note: 'How calls reach the AI.' },
  { name: 'business_hours', type: 'object', note: 'Hours config, same JSON shape the dashboard uses.' },
];

// -- Endpoint groups --------------------------------------------------------
function buildGroups(_theme: any): Array<{ id: string; title: string; sub?: string; icon: any; endpoints: EndpointDef[] }> {
  const H = 'Authorization: Bearer YOUR_API_KEY';
  return [
    {
      id: 'ep-account', title: 'Account', icon: ListTree,
      sub: 'Confirm which agency a key belongs to and what it can do.',
      endpoints: [
        {
          method: 'GET', path: '/account', scope: 'read',
          summary: 'Return the agency tied to this key, its plan and billing status, and the key scope and API version.',
          example: `curl ${BASE}/account -H "${H}"`,
          response: `{
  "id": "age_...",
  "name": "Acme Agency",
  "slug": "acme",
  "plan_type": "scale",
  "subscription_status": "active",
  "api": { "scope": "read_write", "version": "v1" }
}`,
        },
      ],
    },
    {
      id: 'ep-clients', title: 'Clients', icon: ListTree,
      sub: 'List, create, read, and update the businesses under your agency.',
      endpoints: [
        {
          method: 'GET', path: '/clients', scope: 'read',
          summary: 'List your clients, newest first.',
          query: [
            { name: 'status', type: 'string', note: 'Filter by account status, for example active.' },
            { name: 'industry', type: 'string', note: 'Filter by industry key.' },
            { name: 'limit', type: 'number', note: '1 to 100, default 25.' },
            { name: 'cursor', type: 'string', note: 'next_cursor from the previous page.' },
          ],
          example: `curl "${BASE}/clients?status=active&limit=25" -H "${H}"`,
          response: `{
  "data": [
    {
      "id": "cli_...",
      "business_name": "Bob's Pest Control",
      "industry": "pest_control",
      "status": "active",
      "phone_number": "+15125550194",
      "created_at": "2026-10-02T12:00:00.000Z"
    }
  ],
  "has_more": false,
  "next_cursor": null
}`,
        },
        {
          method: 'POST', path: '/clients', scope: 'read_write',
          summary: 'Create a client. This kicks off full provisioning (number, AI assistant, billing), so it responds 202 with a provisioning job id you can poll.',
          body: [
            { name: 'first_name', type: 'string, required', note: 'Owner first name.' },
            { name: 'last_name', type: 'string', note: 'Owner last name.' },
            { name: 'email', type: 'string, required', note: 'Client account email.' },
            { name: 'phone', type: 'string', note: 'Owner phone.' },
            { name: 'business_name', type: 'string, required', note: 'The business name.' },
            { name: 'industry', type: 'string', note: 'Industry key, for example pest_control.' },
            { name: 'business_city / business_state / business_country', type: 'string', note: 'Business location.' },
            { name: 'website_url', type: 'string', note: 'Business website.' },
            { name: 'plan_type', type: 'string', note: "Client plan. Defaults to 'starter'." },
            { name: 'pricing_mode', type: 'string', note: "'plan' (default) or 'custom'." },
            { name: 'custom_pricing', type: 'object', note: 'Custom pricing, when pricing_mode is custom.' },
            { name: 'temp_password', type: 'string', note: 'Optional. Login is normally set in-app, so a throwaway is generated if omitted.' },
          ],
          example: `curl -X POST ${BASE}/clients \\
  -H "${H}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "Bob",
    "email": "bob@bobspest.com",
    "business_name": "Bob'"'"'s Pest Control",
    "industry": "pest_control",
    "business_city": "Austin",
    "business_state": "TX",
    "plan_type": "starter"
  }'`,
          response: `HTTP/1.1 202 Accepted
{
  "job_id": "job_...",
  "status": "processing"
}

# then poll:
# GET /clients/:id/provisioning-status/:jobId`,
        },
        {
          method: 'GET', path: '/clients/:id', scope: 'read',
          summary: 'Fetch one client by id.',
          example: `curl ${BASE}/clients/cli_123 -H "${H}"`,
          response: `{
  "id": "cli_123",
  "business_name": "Bob's Pest Control",
  "status": "active",
  "phone_number": "+15125550194",
  "subscription_status": "active"
}`,
        },
        {
          method: 'PATCH', path: '/clients/:id', scope: 'read_write',
          summary: 'Update editable client fields. Provisioning-owned fields (number, assistant ids, billing) are not editable here.',
          body: [
            { name: 'business_name', type: 'string', note: 'Business name.' },
            { name: 'industry', type: 'string', note: 'Industry key.' },
            { name: 'business_city / business_state / country', type: 'string', note: 'Location.' },
            { name: 'business_website', type: 'string', note: 'Website URL.' },
            { name: 'owner_name / owner_phone', type: 'string', note: 'Owner contact (transfer fallback).' },
            { name: 'notification_phone', type: 'string', note: 'Where recap texts go.' },
            { name: 'email', type: 'string', note: 'Account email.' },
            { name: 'post_call_sms_enabled', type: 'boolean', note: 'Toggle the post-call recap text.' },
          ],
          example: `curl -X PATCH ${BASE}/clients/cli_123 \\
  -H "${H}" \\
  -H "Content-Type: application/json" \\
  -d '{ "notification_phone": "+15125550123", "post_call_sms_enabled": true }'`,
          response: `{
  "id": "cli_123",
  "business_name": "Bob's Pest Control",
  "notification_phone": "+15125550123"
}`,
        },
        {
          method: 'DELETE', path: '/clients/:id', scope: 'read_write',
          summary: 'Not available via the API yet. Deleting a client tears down its paid number, AI assistant, and billing, and a partial delete would orphan a number, so this returns 501. Remove a client from the dashboard instead.',
          example: `curl -X DELETE ${BASE}/clients/cli_123 -H "${H}"`,
          response: `HTTP/1.1 501 Not Implemented
{
  "error": {
    "type": "not_implemented",
    "message": "Deleting a client via the API is not available yet. Remove the client from your dashboard so its number and assistant are released cleanly."
  }
}`,
        },
        {
          method: 'GET', path: '/clients/:id/provisioning-status/:jobId', scope: 'read',
          summary: 'Poll the provisioning job returned by POST /clients until status is done or error.',
          example: `curl ${BASE}/clients/cli_123/provisioning-status/job_456 -H "${H}"`,
          response: `{
  "id": "job_456",
  "status": "done",
  "result": { "client_id": "cli_123", "phone_number": "+15125550194" },
  "created_at": "2026-11-07T15:00:00.000Z"
}`,
        },
      ],
    },
    {
      id: 'ep-calls', title: 'Calls', icon: Phone,
      sub: 'Read calls handled by your clients AI receptionists, and fetch recordings.',
      endpoints: [
        {
          method: 'GET', path: '/calls', scope: 'read',
          summary: 'List calls across your clients, newest first.',
          query: [
            { name: 'client_id', type: 'string', note: 'Only this client. Must be one of yours.' },
            { name: 'since', type: 'ISO 8601', note: 'Calls created on or after this time.' },
            { name: 'until', type: 'ISO 8601', note: 'Calls created on or before this time.' },
            { name: 'limit', type: 'number', note: '1 to 100, default 25.' },
            { name: 'cursor', type: 'string', note: 'next_cursor from the previous page.' },
          ],
          example: `curl "${BASE}/calls?client_id=cli_123&since=2026-11-01T00:00:00Z&limit=50" -H "${H}"`,
          response: `{
  "data": [
    {
      "id": "call_...",
      "client_id": "cli_123",
      "caller_phone": "+15125550111",
      "call_status": "completed",
      "duration_seconds": 142,
      "appointment_booked": true,
      "ai_summary": "Caller booked a quarterly pest treatment.",
      "created_at": "2026-11-05T14:21:00.000Z"
    }
  ],
  "has_more": true,
  "next_cursor": "2026-11-05T14:21:00.000Z"
}`,
        },
        {
          method: 'GET', path: '/calls/:id', scope: 'read',
          summary: 'Fetch one call in full, including transcript, summary, and a fresh recording link when one exists.',
          example: `curl ${BASE}/calls/call_789 -H "${H}"`,
          response: `{
  "id": "call_789",
  "client_id": "cli_123",
  "caller_phone": "+15125550111",
  "customer_name": "Jane Doe",
  "service_requested": "Ant treatment",
  "call_status": "completed",
  "sentiment": "positive",
  "duration_seconds": 142,
  "transcript": "AI: Thanks for calling...",
  "recording_url": "https://.../signed.mp3",
  "recording_api_url": "${BASE}/calls/call_789/recording",
  "call_language": "en",
  "created_at": "2026-11-05T14:21:00.000Z"
}`,
        },
        {
          method: 'GET', path: '/calls/:id/recording', scope: 'read',
          summary: 'Return just a fresh, playable recording URL for a call. The link is short-lived, so fetch it when you are about to use it. Returns 404 if the call has no recording.',
          example: `curl ${BASE}/calls/call_789/recording -H "${H}"`,
          response: `{ "url": "https://.../signed.mp3" }`,
        },
      ],
    },
    {
      id: 'ep-receptionist', title: 'Receptionist', icon: ListTree,
      sub: 'Read and update a client AI receptionist settings. Changes take effect on the next call, no rebuild needed.',
      endpoints: [
        {
          method: 'GET', path: '/clients/:id/receptionist', scope: 'read',
          summary: 'Fetch the receptionist config for a client.',
          example: `curl ${BASE}/clients/cli_123/receptionist -H "${H}"`,
          response: `{
  "client_id": "cli_123",
  "greeting_message": "Thanks for calling Bob's Pest Control!",
  "voice_id": "voice_abc",
  "human_handoff": "transfer",
  "transfer_phone": "+15125550123",
  "forwarding_mode": "always",
  "business_hours": { "mon": ["09:00","17:00"] }
}`,
        },
        {
          method: 'PATCH', path: '/clients/:id/receptionist', scope: 'read_write',
          summary: 'Update one or more receptionist fields. Send only what you want to change.',
          body: [
            { name: 'greeting_message', type: 'string', note: 'Opening line.' },
            { name: 'voice_id', type: 'string or null', note: 'TTS voice id.' },
            { name: 'human_handoff', type: "'transfer' | 'message'", note: 'Dial a human, or take a message.' },
            { name: 'transfer_phone', type: 'string or null', note: '10-digit US number or E.164. Null/empty clears it.' },
            { name: 'business_hours', type: 'object', note: 'Same JSON shape the dashboard uses.' },
          ],
          example: `curl -X PATCH ${BASE}/clients/cli_123/receptionist \\
  -H "${H}" \\
  -H "Content-Type: application/json" \\
  -d '{ "human_handoff": "transfer", "transfer_phone": "512-555-0123" }'`,
          response: `{
  "client_id": "cli_123",
  "human_handoff": "transfer",
  "transfer_phone": "+15125550123"
}`,
        },
      ],
    },
    {
      id: 'ep-kb', title: 'Knowledge Base', icon: ListTree,
      sub: 'The text knowledge base the AI draws on for a client.',
      endpoints: [
        {
          method: 'GET', path: '/clients/:id/knowledge-base', scope: 'read',
          summary: 'Read a client current knowledge-base content and when it last changed.',
          example: `curl ${BASE}/clients/cli_123/knowledge-base -H "${H}"`,
          response: `{
  "client_id": "cli_123",
  "content": "We service residential and commercial...",
  "updated_at": "2026-10-20T09:00:00.000Z"
}`,
        },
        {
          method: 'PUT', path: '/clients/:id/knowledge-base', scope: 'read_write',
          summary: 'Replace the knowledge-base content. Writing it rebuilds the AI file and tooling behind the scenes, so send the full content you want, not a diff.',
          body: [
            { name: 'content', type: 'string, required', note: 'The full knowledge-base text.' },
          ],
          example: `curl -X PUT ${BASE}/clients/cli_123/knowledge-base \\
  -H "${H}" \\
  -H "Content-Type: application/json" \\
  -d '{ "content": "We service residential and commercial properties across Travis County..." }'`,
          response: `{
  "client_id": "cli_123",
  "content": "We service residential and commercial properties across Travis County..."
}`,
        },
      ],
    },
    {
      id: 'ep-numbers', title: 'Phone Numbers', icon: Phone,
      sub: 'The provisioned receptionist numbers across your clients.',
      endpoints: [
        {
          method: 'GET', path: '/numbers', scope: 'read',
          summary: 'List every client that has a provisioned phone number.',
          example: `curl ${BASE}/numbers -H "${H}"`,
          response: `{
  "data": [
    {
      "client_id": "cli_123",
      "business_name": "Bob's Pest Control",
      "phone_number": "+15125550194",
      "status": "active",
      "created_at": "2026-10-02T12:00:00.000Z"
    }
  ]
}`,
        },
      ],
    },
    {
      id: 'ep-usage', title: 'Usage and Analytics', icon: Gauge,
      sub: 'Billing-grade usage minutes and simple call analytics over a window. Both default to the trailing 30 days.',
      endpoints: [
        {
          method: 'GET', path: '/usage', scope: 'read',
          summary: 'Total minutes and record counts over a window, broken down per client. Drawn from billing records.',
          query: [
            { name: 'billing_month', type: 'string, YYYY-MM', note: 'A specific billing month. When set, the since/until window is ignored.' },
            { name: 'since', type: 'ISO 8601', note: 'Window start. Defaults to 30 days ago.' },
            { name: 'until', type: 'ISO 8601', note: 'Window end. Defaults to now.' },
          ],
          example: `curl "${BASE}/usage?billing_month=2026-10" -H "${H}"`,
          response: `{
  "period": { "billing_month": "2026-10" },
  "total_records": 412,
  "total_minutes": 938.5,
  "total_seconds": 56310,
  "by_client": [
    { "client_id": "cli_123", "business_name": "Bob's Pest Control", "records": 120, "minutes": 274.2, "seconds": 16452 }
  ]
}`,
        },
        {
          method: 'GET', path: '/analytics/calls', scope: 'read',
          summary: 'Call counts, total minutes, spam count, and a breakdown by status over a window.',
          query: [
            { name: 'since', type: 'ISO 8601', note: 'Window start. Defaults to 30 days ago.' },
            { name: 'until', type: 'ISO 8601', note: 'Window end. Defaults to now.' },
          ],
          example: `curl "${BASE}/analytics/calls?since=2026-10-01T00:00:00Z" -H "${H}"`,
          response: `{
  "period": { "since": "2026-10-01T00:00:00Z", "until": "2026-11-07T15:00:00Z" },
  "total_calls": 412,
  "total_minutes": 939,
  "spam_calls": 11,
  "by_status": { "completed": 380, "transferred": 21, "unknown": 11 }
}`,
        },
      ],
    },
    {
      id: 'ep-appointments', title: 'Appointments', icon: CalendarClock,
      sub: 'Read and manage appointments booked for your clients. Clients with a connected Google Calendar get live availability checks and real calendar events; clients with no calendar get clean record-only appointments, so the same calls work for everyone.',
      endpoints: [
        {
          method: 'GET', path: '/clients/:id/availability', scope: 'read',
          summary: 'Open slots for a client on a date. Needs a connected calendar; a record-only client returns 409 calendar_not_connected.',
          query: [
            { name: 'date', type: 'string, YYYY-MM-DD, required', note: 'The day to check.' },
            { name: 'duration', type: 'number', note: 'Slot length in minutes to check against.' },
          ],
          example: `curl "${BASE}/clients/cli_123/availability?date=2026-11-12&duration=30" -H "${H}"`,
          response: `{
  "client_id": "cli_123",
  "date": "2026-11-12",
  "slots": ["09:00", "09:30", "10:30", "14:00"],
  "message": null
}`,
        },
        {
          method: 'GET', path: '/appointments', scope: 'read',
          summary: 'List appointments across your clients, newest first.',
          query: [
            { name: 'client_id', type: 'string', note: 'Only this client.' },
            { name: 'status', type: 'string', note: 'Filter by status, for example confirmed or canceled.' },
            { name: 'since / until', type: 'ISO 8601', note: 'Filter by appointment time.' },
            { name: 'limit / cursor', type: '', note: 'Standard pagination.' },
          ],
          example: `curl "${BASE}/appointments?client_id=cli_123&status=confirmed" -H "${H}"`,
          response: `{
  "data": [
    {
      "id": "appt_...",
      "client_id": "cli_123",
      "customer_name": "Jane Doe",
      "appointment_time": "2026-11-12T15:00:00.000Z",
      "end_time": "2026-11-12T15:30:00.000Z",
      "duration_minutes": 30,
      "service_type": "Ant treatment",
      "status": "confirmed",
      "booking_source": "ai_receptionist"
    }
  ],
  "has_more": false,
  "next_cursor": null
}`,
        },
        {
          method: 'GET', path: '/appointments/:id', scope: 'read',
          summary: 'Fetch one appointment by id.',
          example: `curl ${BASE}/appointments/appt_456 -H "${H}"`,
          response: `{
  "id": "appt_456",
  "client_id": "cli_123",
  "customer_name": "Jane Doe",
  "appointment_time": "2026-11-12T15:00:00.000Z",
  "end_time": "2026-11-12T15:30:00.000Z",
  "duration_minutes": 30,
  "status": "confirmed"
}`,
        },
        {
          method: 'POST', path: '/appointments', scope: 'read_write',
          summary: 'Book an appointment. Give the day and time as separate fields. On a Google-connected client this writes a real calendar event after an availability check; on a record-only client it just stores the appointment.',
          body: [
            { name: 'client_id', type: 'string, required', note: 'Which client to book for.' },
            { name: 'customer_name', type: 'string', note: 'Who the appointment is for.' },
            { name: 'customer_phone / customer_email', type: 'string', note: 'Customer contact.' },
            { name: 'date', type: 'string, YYYY-MM-DD', note: 'The day.' },
            { name: 'time', type: 'string', note: 'The time, for example "2:30 PM" or "14:30".' },
            { name: 'service_type', type: 'string', note: 'Service being booked.' },
            { name: 'staff_name', type: 'string', note: 'Assign to a staff member.' },
            { name: 'notes', type: 'string', note: 'Free-text notes.' },
            { name: 'duration_minutes', type: 'number', note: 'Length. Falls back to the client default.' },
            { name: 'check_availability', type: 'boolean', note: 'Set false to skip the pre-write availability check. Defaults true.' },
          ],
          example: `curl -X POST ${BASE}/appointments \\
  -H "${H}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "cli_123",
    "customer_name": "Jane Doe",
    "customer_phone": "+15125550111",
    "date": "2026-11-12",
    "time": "2:30 PM",
    "service_type": "Ant treatment",
    "duration_minutes": 30
  }'`,
          response: `HTTP/1.1 201 Created
{
  "id": "appt_456",
  "client_id": "cli_123",
  "customer_name": "Jane Doe",
  "appointment_time": "2026-11-12T20:30:00.000Z",
  "end_time": "2026-11-12T21:00:00.000Z",
  "duration_minutes": 30,
  "status": "confirmed",
  "booking_source": "ai_receptionist"
}

# if the slot is taken:
# HTTP/1.1 409  { "error": { "type": "slot_unavailable", ... }, "available_slots": [...] }`,
        },
        {
          method: 'PATCH', path: '/appointments/:id', scope: 'read_write',
          summary: 'Reschedule to a new day and time. Patches the Google event when there is one, otherwise just moves the record.',
          body: [
            { name: 'date', type: 'string, YYYY-MM-DD', note: 'New day.' },
            { name: 'time', type: 'string', note: 'New time, for example "2:30 PM" or "14:30".' },
            { name: 'duration_minutes', type: 'number', note: 'New length, optional.' },
            { name: 'check_availability', type: 'boolean', note: 'Set false to skip the availability check. Defaults true.' },
          ],
          example: `curl -X PATCH ${BASE}/appointments/appt_456 \\
  -H "${H}" \\
  -H "Content-Type: application/json" \\
  -d '{ "date": "2026-11-13", "time": "10:00 AM" }'`,
          response: `{
  "id": "appt_456",
  "appointment_time": "2026-11-13T16:00:00.000Z",
  "end_time": "2026-11-13T16:30:00.000Z",
  "status": "confirmed"
}`,
        },
        {
          method: 'POST', path: '/appointments/:id/cancel', scope: 'read_write',
          summary: 'Cancel an appointment. Deletes the Google event when present and marks the record canceled (kept for history).',
          body: [
            { name: 'reason', type: 'string', note: 'Optional cancellation reason.' },
          ],
          example: `curl -X POST ${BASE}/appointments/appt_456/cancel \\
  -H "${H}" \\
  -H "Content-Type: application/json" \\
  -d '{ "reason": "Customer requested" }'`,
          response: `{
  "id": "appt_456",
  "status": "canceled"
}`,
        },
      ],
    },
    {
      id: 'ep-webhooks', title: 'Webhook Endpoints', icon: Webhook,
      sub: 'Register and manage the endpoints we POST events to. See the Webhooks Guide below for the envelope, signing, and the full event catalog.',
      endpoints: [
        {
          method: 'GET', path: '/events', scope: 'read',
          summary: 'The catalog of event types you can subscribe to.',
          example: `curl ${BASE}/events -H "${H}"`,
          response: `{
  "data": [
    "call.started", "call.completed", "call.transferred", "call.escalated",
    "appointment.booked", "appointment.rescheduled", "appointment.canceled",
    "client.provisioned", "client.provisioning_failed", "client.payment_failed",
    "client.subscription_activated", "client.trial_expired", "client.canceled"
  ]
}`,
        },
        {
          method: 'POST', path: '/webhooks', scope: 'read_write',
          summary: 'Register an endpoint. The signing secret is returned once, right here, so store it now. The URL must be a public http(s) address.',
          body: [
            { name: 'url', type: 'string, required', note: 'Public https endpoint to receive events.' },
            { name: 'events', type: 'string[]', note: "Event types to send, or ['*'] for all. Defaults to all." },
            { name: 'description', type: 'string', note: 'Optional label, up to 200 chars.' },
          ],
          example: `curl -X POST ${BASE}/webhooks \\
  -H "${H}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-server.com/webhooks/voiceai",
    "events": ["call.completed", "appointment.booked"],
    "description": "CRM sync"
  }'`,
          response: `HTTP/1.1 201 Created
{
  "id": "wh_...",
  "url": "https://your-server.com/webhooks/voiceai",
  "events": ["call.completed", "appointment.booked"],
  "status": "active",
  "description": "CRM sync",
  "created_at": "2026-11-07T15:00:00.000Z",
  "secret": "whsec_7f3a...only-shown-once"
}`,
        },
        {
          method: 'GET', path: '/webhooks', scope: 'read',
          summary: 'List your registered endpoints. Secrets are never returned here.',
          example: `curl ${BASE}/webhooks -H "${H}"`,
          response: `{
  "data": [
    {
      "id": "wh_...",
      "url": "https://your-server.com/webhooks/voiceai",
      "events": ["call.completed", "appointment.booked"],
      "status": "active",
      "description": "CRM sync",
      "created_at": "2026-11-07T15:00:00.000Z",
      "last_delivery_at": "2026-11-07T15:40:00.000Z",
      "last_error": null
    }
  ]
}`,
        },
        {
          method: 'GET', path: '/webhooks/:id', scope: 'read',
          summary: 'Fetch one endpoint by id.',
          example: `curl ${BASE}/webhooks/wh_123 -H "${H}"`,
          response: `{
  "id": "wh_123",
  "url": "https://your-server.com/webhooks/voiceai",
  "events": ["call.completed"],
  "status": "active",
  "last_delivery_at": "2026-11-07T15:40:00.000Z",
  "last_error": null
}`,
        },
        {
          method: 'PATCH', path: '/webhooks/:id', scope: 'read_write',
          summary: 'Update an endpoint URL, event list, status, or description. Send only what changes.',
          body: [
            { name: 'url', type: 'string', note: 'New public https URL.' },
            { name: 'events', type: 'string[]', note: "New event list, or ['*']." },
            { name: 'status', type: "'active' | 'disabled'", note: 'Pause or resume deliveries.' },
            { name: 'description', type: 'string', note: 'New label.' },
          ],
          example: `curl -X PATCH ${BASE}/webhooks/wh_123 \\
  -H "${H}" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "disabled" }'`,
          response: `{
  "id": "wh_123",
  "status": "disabled"
}`,
        },
        {
          method: 'DELETE', path: '/webhooks/:id', scope: 'read_write',
          summary: 'Delete an endpoint. Deliveries stop immediately.',
          example: `curl -X DELETE ${BASE}/webhooks/wh_123 -H "${H}"`,
          response: `{ "deleted": true, "id": "wh_123" }`,
        },
        {
          method: 'GET', path: '/webhooks/:id/deliveries', scope: 'read',
          summary: 'Recent delivery attempts for one endpoint, newest first. Use it to debug failures.',
          query: [
            { name: 'limit / cursor', type: '', note: 'Standard pagination.' },
          ],
          example: `curl ${BASE}/webhooks/wh_123/deliveries -H "${H}"`,
          response: `{
  "data": [
    {
      "id": "del_...",
      "event_id": "0e8c...",
      "event_type": "call.completed",
      "status": "success",
      "attempts": 1,
      "response_status": 200,
      "last_attempt_at": "2026-11-07T15:40:00.000Z",
      "next_attempt_at": null,
      "delivered_at": "2026-11-07T15:40:00.000Z",
      "created_at": "2026-11-07T15:40:00.000Z",
      "payload": { "id": "0e8c...", "type": "call.completed", "data": { } }
    }
  ],
  "has_more": false,
  "next_cursor": null
}`,
        },
        {
          method: 'POST', path: '/webhooks/:id/ping', scope: 'read_write',
          summary: 'Send a test ping event to the endpoint, signed exactly like a real event, so you can validate your handler.',
          example: `curl -X POST ${BASE}/webhooks/wh_123/ping -H "${H}"`,
          response: `{ "ok": true, "delivery_id": "del_..." }`,
        },
      ],
    },
  ];
}

// -- Event catalog ----------------------------------------------------------
function buildEvents(): EventDef[] {
  const env = (type: string, data: string) =>
`{
  "id": "evt_...",
  "type": "${type}",
  "created_at": "2026-11-07T15:04:22.118Z",
  "data": ${data}
}`;
  return [
    {
      type: 'call.started',
      when: 'A call just started and the caller leg is up. A real-time event for live wallboards. It carries a call_session_id, not a final call id.',
      payload: env('call.started', `{
    "call_session_id": "sess_...",
    "client_id": "cli_123",
    "caller_phone": "+15125550111",
    "office_number": "+15125550194",
    "started_at": "2026-11-07T15:04:22.000Z",
    "status": "in_progress"
  }`),
    },
    {
      type: 'call.completed',
      when: 'A call finished. The payload is enriched with the full call record, so you can ingest everything about the call from this event alone, no follow-up GET needed.',
      payload: env('call.completed', `{
    "id": "call_789",
    "client_id": "cli_123",
    "call_status": "completed",
    "duration_seconds": 142,
    "caller_phone": "+15125550111",
    "customer_name": "Jane Doe",
    "customer_phone": "+15125550111",
    "service_requested": "Ant treatment",
    "urgency_level": "normal",
    "sentiment": "positive",
    "appointment_booked": true,
    "appointment_time": "2026-11-12T20:30:00.000Z",
    "ai_summary": "Caller booked a quarterly treatment.",
    "transcript": "AI: Thanks for calling...",
    "recording_url": "https://.../signed.mp3",
    "recording_api_url": "${BASE}/calls/call_789/recording",
    "ended_reason": "customer-ended-call",
    "is_spam": false,
    "call_language": "en",
    "started_at": "2026-11-07T15:04:22.000Z",
    "ended_at": "2026-11-07T15:06:44.000Z",
    "created_at": "2026-11-07T15:06:45.000Z"
  }`),
    },
    {
      type: 'call.transferred',
      when: 'A call was handed to the business line. Fired in real time at handoff (session-keyed, shown here), and again enriched at end of call with the full call record like call.completed but call_status transferred.',
      payload: env('call.transferred', `{
    "call_session_id": "sess_...",
    "vapi_call_id": "vapi_...",
    "client_id": "cli_123",
    "business_name": "Bob's Pest Control",
    "caller_phone": "+15125550111",
    "handoff_type": "business",
    "delivery": "phone",
    "handled_by": null,
    "reason": "caller asked for a human",
    "transfer_status": "transferred",
    "occurred_at": "2026-11-07T15:05:40.000Z"
  }`),
    },
    {
      type: 'call.escalated',
      when: 'A call-center agent took over a live call (browser jump-in, or their phone was rung). Distinct from call.transferred, which dials the business line.',
      payload: env('call.escalated', `{
    "call_session_id": "sess_...",
    "vapi_call_id": "vapi_...",
    "client_id": "cli_123",
    "business_name": "Bob's Pest Control",
    "caller_phone": "+15125550111",
    "handoff_type": "agent",
    "delivery": "browser",
    "handled_by": "Maria G.",
    "reason": "complex billing question",
    "transfer_status": "transferred",
    "occurred_at": "2026-11-07T15:05:40.000Z"
  }`),
    },
    {
      type: 'appointment.booked',
      when: 'An appointment was booked, by the AI on a call or through the API. Carries the full booking so a CRM can sync it in one shot.',
      payload: env('appointment.booked', `{
    "id": "appt_456",
    "client_id": "cli_123",
    "business_name": "Bob's Pest Control",
    "customer_name": "Jane Doe",
    "customer_phone": "+15125550111",
    "appointment_time": "2026-11-12T20:30:00.000Z",
    "end_time": "2026-11-12T21:00:00.000Z",
    "duration_minutes": 30,
    "timezone": "America/Chicago",
    "service_type": "Ant treatment",
    "staff_name": null,
    "notes": null,
    "status": "confirmed",
    "booking_source": "ai_receptionist",
    "google_event_id": "g_evt_...",
    "google_calendar_id": "primary"
  }`),
    },
    {
      type: 'appointment.rescheduled',
      when: 'An appointment moved to a new time. Includes the previous time alongside the new one.',
      payload: env('appointment.rescheduled', `{
    "id": "appt_456",
    "client_id": "cli_123",
    "business_name": "Bob's Pest Control",
    "customer_name": "Jane Doe",
    "appointment_time": "2026-11-13T16:00:00.000Z",
    "end_time": "2026-11-13T16:30:00.000Z",
    "duration_minutes": 30,
    "timezone": "America/Chicago",
    "service_type": "Ant treatment",
    "status": "confirmed",
    "booking_source": "ai_receptionist",
    "previous_appointment_time": "2026-11-12T20:30:00.000Z"
  }`),
    },
    {
      type: 'appointment.canceled',
      when: 'An appointment was canceled. Includes the reason when one was given.',
      payload: env('appointment.canceled', `{
    "id": "appt_456",
    "client_id": "cli_123",
    "business_name": "Bob's Pest Control",
    "customer_name": "Jane Doe",
    "appointment_time": "2026-11-12T20:30:00.000Z",
    "end_time": "2026-11-12T21:00:00.000Z",
    "duration_minutes": 30,
    "status": "canceled",
    "booking_source": "ai_receptionist",
    "cancel_reason": "Customer requested"
  }`),
    },
    {
      type: 'client.provisioned',
      when: 'A new client finished provisioning and is live, with its number assigned.',
      payload: env('client.provisioned', `{
    "id": "cli_123",
    "business_name": "Bob's Pest Control",
    "phone_number": "+15125550194",
    "status": "active",
    "created_at": "2026-11-07T15:00:00.000Z"
  }`),
    },
    {
      type: 'client.provisioning_failed',
      when: 'A client provisioning job failed. Carries the error so you can surface or retry it.',
      payload: env('client.provisioning_failed', `{
    "agency_id": "age_...",
    "error": "No phone numbers available in that area code."
  }`),
    },
    {
      type: 'client.payment_failed',
      when: 'A client payment failed. The subject is the client business, not a caller.',
      payload: env('client.payment_failed', `{ "client_id": "cli_123" }`),
    },
    {
      type: 'client.subscription_activated',
      when: 'A client subscription became active (new paid plan, or a trial converting). Includes the plan.',
      payload: env('client.subscription_activated', `{
    "client_id": "cli_123",
    "plan": "starter"
  }`),
    },
    {
      type: 'client.trial_expired',
      when: 'A client trial ended.',
      payload: env('client.trial_expired', `{ "client_id": "cli_123" }`),
    },
    {
      type: 'client.canceled',
      when: 'A client subscription was canceled. Includes the reason when one was captured.',
      payload: env('client.canceled', `{
    "client_id": "cli_123",
    "reason": "Switched providers"
  }`),
    },
  ];
}
