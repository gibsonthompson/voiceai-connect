'use client';

// ============================================================================
// ADMIN OVERVIEW (operations console)
// The front door. Answers "is everything working, who just signed up, and what
// needs action" in one screen. Reads the new /api/admin/calls and /demos feeds
// plus the existing /dashboard and /agencies routes. The action queue is
// derived client-side from real agency fields (past due, trial ending, zero
// clients) plus the needs-attention call count and hot demos, so every row maps
// to something real, not a placeholder.
//
// Shared logic comes from lib/admin/format and lib/admin/status so labels,
// colors, and call-outcome derivation match every other page.
//
// NOTE: the call detail drawer here will be extracted into a shared component
// (components/admin/CallDrawer) when the Calls page is built, since both use it.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Loader2, Clock, UserPlus, Sparkles, DollarSign, ArrowRight,
  Mail, CheckCircle2, Circle, X,
} from 'lucide-react';
import {
  formatPhone, timeAgo, formatDuration, formatUSD, formatNumber, getPhoneLocation,
} from '@/lib/admin/format';
import {
  deriveCallOutcome, getPlanDisplayName, getDemoInterest, CALL_FILTERS,
} from '@/lib/admin/status';
import CallDrawer from '@/components/admin/CallDrawer';

// ── data plumbing (same pattern as the other admin pages) ───────────────────
const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');
async function adminGet(path: string) {
  const res = await fetch(`${backendUrl()}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json();
}

// ── types (only the fields this page reads) ─────────────────────────────────
interface Stats {
  totalAgencies: number; activeAgencies: number; trialAgencies: number;
  totalClients: number; activeClients: number; platformMRR: number;
  callsThisMonth: number; recentAgencies: number; recentClients: number;
}
interface CallRow {
  id: string; created_at: string; customer_name: string; customer_phone: string;
  duration_seconds: number | null; call_status: string | null; urgency_level: string | null;
  ended_reason: string | null; transfer_status: string | null; is_spam: boolean | null;
  outcome: string; needs_attention: boolean; has_recording: boolean; vapi_cost: number | null;
  business_name: string | null; agency_name: string | null;
}
interface Agency {
  id: string; name: string; email: string; phone: string | null; country: string | null;
  plan_type: string; access_plan?: string | null; subscription_status: string; created_at: string;
  trial_ends_at: string | null; client_count: number; referral_source: string | null;
  last_admin_outreach_at?: string | null;
}
interface DemoRow {
  id: string; created_at: string; caller_phone: string; business_name: string | null;
  business_type: string | null; interest_level: string | null; agency_name: string | null;
  vapi_success_score: string | null;
}

// A free agency does not get a demo line (it provisions a real phone number, a
// paid-plan feature), so the outreach cannot tell them to put their demo in
// front of a prospect. Paid (pro / scale) agencies have one, so that is the
// whole pitch. access_plan (admin-granted) wins over plan_type.
function isFreeAgency(a: Agency): boolean {
  const plan = String(a.access_plan || a.plan_type || '').toLowerCase().trim();
  return plan === 'free' || plan === '';
}

// Founder-style first-touch message for a fresh signup, copied and sent from the
// admin's own email. Two versions: paid agencies get the demo-line pitch, free
// agencies get the "upgrade unlocks the demo line" path instead.
function buildOutreach(a: Agency): { subject: string; body: string } {
  const name = a.name || 'your agency';
  if (isFreeAgency(a)) {
    return {
      subject: 'Welcome to VoiceAI Connect',
      body: [
        'Hey,',
        '',
        `Saw you just set up ${name} on VoiceAI Connect. Quick note from me directly.`,
        '',
        'You are on the free plan right now, so have a look around and get a feel for how it all works.',
        '',
        'When you are ready to start landing clients, upgrading unlocks your own demo line and white-label site. That demo line is what closes deals: a prospect calls it, hears the AI answer as their own business, and sells themselves.',
        '',
        'Tell me the kind of client you are going after and I will point you to the setup that converts best.',
        '',
        'Gibson',
      ].join('\n'),
    };
  }
  return {
    subject: 'Welcome to VoiceAI Connect',
    body: [
      'Hey,',
      '',
      `Saw you just set up ${name} on VoiceAI Connect. Quick note from me directly.`,
      '',
      'The fastest way to land your first paying client is to get your demo receptionist in front of one prospect this week. They call your demo line, hear the AI answer as their business, and the value sells itself.',
      '',
      'You do not need a finished website or a full client list for that. You need one phone call.',
      '',
      'Tell me the kind of client you are going after and I will point you to the setup that converts best for them.',
      '',
      'Gibson',
    ].join('\n'),
  };
}

export default function AdminOverviewPage() {
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [attentionCount, setAttentionCount] = useState(0);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [feedLoading, setFeedLoading] = useState(true);
  // Per-section load flags so each panel paints the instant its OWN request
  // lands, instead of the whole page blocking on the slowest one. Every request
  // fires in parallel on mount (see the effect below).
  const [agenciesLoading, setAgenciesLoading] = useState(true);
  const [demosLoading, setDemosLoading] = useState(true);

  // drawer (shared component owns fetch + escape handling)
  const [openId, setOpenId] = useState<string | null>(null);
  const [openAgencyId, setOpenAgencyId] = useState<string | null>(null);

  // Reach-out modal: copy/paste the email + message, then log it so the row
  // shows "reached out Xd ago". Template is editable before sending.
  const [reachOut, setReachOut] = useState<Agency | null>(null);
  const [oSubject, setOSubject] = useState('');
  const [oBody, setOBody] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);

  const openReachOut = (a: Agency) => {
    const t = buildOutreach(a);
    setOSubject(t.subject); setOBody(t.body); setCopied(null); setReachOut(a);
  };
  const copyText = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500); } catch {}
  };
  const logOutreach = async (a: Agency, subject: string, body: string) => {
    setLogging(true);
    try {
      await fetch(`${backendUrl()}/api/admin/agencies/${a.id}/log-email`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, recipient_email: a.email, template_key: isFreeAgency(a) ? 'signup_outreach_free' : 'signup_outreach_paid' }),
      });
      const now = new Date().toISOString();
      setAgencies((prev) => prev.map((x) => (x.id === a.id ? { ...x, last_admin_outreach_at: now } : x)));
      setReachOut(null);
    } catch { /* keep modal open on failure */ } finally { setLogging(false); }
  };

  // Resolve a call's agency to an id from the loaded agency list so the drawer
  // can deep-link to the agency without the calls feed returning agency_id.
  const agencyIdByName = useMemo(() => {
    const m: Record<string, string> = {};
    agencies.forEach((a) => { if (a.name) m[a.name.toLowerCase()] = a.id; });
    return m;
  }, [agencies]);
  const openCall = (c: CallRow) => {
    setOpenId(c.id);
    setOpenAgencyId(c.agency_name ? agencyIdByName[c.agency_name.toLowerCase()] || null : null);
  };

  const fetchCalls = useCallback(async (f: string) => {
    setFeedLoading(true);
    try {
      const data = await adminGet(`/api/admin/calls?limit=25&filter=${f}`);
      setCalls(data.calls || []);
    } catch (e) {
      console.error(e);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // Fire every request in parallel on mount and let each panel update the
  // instant its own response lands (progressive paint). The call feed is no
  // longer awaited after the others; it was a fifth request in series, one
  // extra round-trip on the critical path, and now races with the rest.
  useEffect(() => {
    adminGet('/api/admin/agencies?limit=100')
      .then((d) => setAgencies(d.agencies || []))
      .catch((e) => console.error(e))
      .finally(() => setAgenciesLoading(false));

    adminGet('/api/admin/calls?filter=attention&limit=1')
      .then((d) => setAttentionCount(d.total || 0))
      .catch((e) => console.error(e));

    adminGet(`/api/admin/demos?interest=high&since=${new Date(Date.now() - 7 * 864e5).toISOString()}&limit=5`)
      .then((d) => setDemos(d.demos || []))
      .catch((e) => console.error(e))
      .finally(() => setDemosLoading(false));

    adminGet('/api/admin/billing-overview')
      .then((d) => setBilling(d))
      .catch((e) => console.error(e));

    fetchCalls('all');
  }, [fetchCalls]);

  const changeFilter = (f: string) => { setFilter(f); fetchCalls(f); };

  // ── recent signups: newest agencies, with location from area code ─────────
  const signups = useMemo(() => {
    return [...agencies]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [agencies]);

  // ── action queue: derived from real agency fields + attention + demos ─────
  const actions = useMemo(() => {
    const items: { id: string; icon: any; tone: string; title: string; detail: string; href?: string }[] = [];
    const now = Date.now();

    if (attentionCount > 0) {
      items.push({
        id: 'attn', icon: AlertTriangle, tone: 'danger',
        title: `${attentionCount} call${attentionCount === 1 ? '' : 's'} need attention`,
        detail: 'Failed or no outcome captured', href: '#call-feed',
      });
    }

    agencies.forEach((a) => {
      if (a.subscription_status === 'past_due') {
        items.push({
          id: `pd-${a.id}`, icon: DollarSign, tone: 'danger',
          title: `${a.name} payment past due`, detail: 'Billing needs attention',
          href: `/admin/agencies?expand=${a.id}`,
        });
      }
    });

    agencies.forEach((a) => {
      if (['trial', 'trialing'].includes(a.subscription_status) && a.trial_ends_at) {
        const days = Math.ceil((new Date(a.trial_ends_at).getTime() - now) / 864e5);
        if (days >= 0 && days <= 7 && a.client_count > 0) {
          items.push({
            id: `trial-${a.id}`, icon: Clock, tone: 'warn',
            title: `${a.name} trial ends in ${days}d`, detail: `${a.client_count} client${a.client_count === 1 ? '' : 's'} live, worth converting`,
            href: `/admin/agencies?expand=${a.id}`,
          });
        }
      }
    });

    agencies.forEach((a) => {
      const ageDays = (now - new Date(a.created_at).getTime()) / 864e5;
      if (a.client_count === 0 && ageDays >= 2) {
        items.push({
          id: `zero-${a.id}`, icon: UserPlus, tone: 'info',
          title: `${a.name} has 0 clients`, detail: `Signed up ${Math.round(ageDays)}d ago, never activated`,
          href: `/admin/agencies?expand=${a.id}`,
        });
      }
    });

    demos.forEach((d) => {
      const aid = d.agency_name ? agencyIdByName[d.agency_name.toLowerCase()] || null : null;
      items.push({
        id: `demo-${d.id}`, icon: Sparkles, tone: 'em',
        title: `Hot demo: ${d.business_name || d.business_type || 'unknown business'}`,
        detail: `${timeAgo(d.created_at)}, follow up fast`,
        href: aid ? `/admin/agencies?expand=${aid}` : undefined,
      });
    });

    return items.slice(0, 8);
  }, [agencies, attentionCount, demos, agencyIdByName]);

  const billDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; } };

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-ink)]">Overview</h1>
      <p className="mt-1 text-sm text-[var(--a-dim)]">Is everything working, who just signed up, and what needs action.</p>

      {/* RECENT SIGNUPS (hero) */}
      <div className="a-eyebrow mt-8">Who Just Signed Up</div>
      <div className="a-panel">
        <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)]">
          <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Recent Signups</h3>
          <span className="text-[11px] text-[var(--a-dim)]">reach out while they are warm</span>
          <Link href="/admin/agencies" className="ml-auto text-[11px] font-semibold text-[var(--a-em-deep)]">View All</Link>
        </div>
        <div className="p-1.5 grid grid-cols-1 lg:grid-cols-2 gap-0.5">
          {agenciesLoading ? (
            <div className="py-10 flex justify-center lg:col-span-2"><Loader2 className="h-5 w-5 animate-spin text-[var(--a-em)]" /></div>
          ) : signups.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[var(--a-dim)] lg:col-span-2">No agencies yet.</div>
          ) : signups.map((a) => {
            const loc = getPhoneLocation(a.phone, a.country);
            const activated = (a.client_count || 0) > 0;
            return (
              <div key={a.id} className="flex gap-3 p-3 rounded-xl hover:bg-[#F6FCF9] items-center">
                <Link href={`/admin/agencies?expand=${a.id}`} className="flex gap-3 items-start min-w-0 flex-1">
                  <span className="h-9 w-9 rounded-[10px] flex items-center justify-center font-semibold text-[12px] shrink-0" style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }}>
                    {(a.name || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[13px] font-semibold text-[var(--a-ink)] truncate">{a.name}</span>
                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5" style={activated ? { background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' } : { background: '#FBF0D6', color: 'var(--a-amber)' }}>
                        {activated ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                        {activated ? `${a.client_count} client${a.client_count === 1 ? '' : 's'}` : 'No clients yet'}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-[var(--a-em-deep)] font-semibold truncate">{a.email}</div>
                    <div className="text-[11.5px] text-[var(--a-dim)] truncate">
                      {[loc, getPlanDisplayName(a.plan_type), a.referral_source ? a.referral_source.replace(/_/g, ' ') : null, timeAgo(a.created_at)].filter(Boolean).join(' \u00b7 ')}
                    </div>
                  </div>
                </Link>
                {a.last_admin_outreach_at ? (
                  <button onClick={(e) => { e.stopPropagation(); openReachOut(a); }} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors hover:brightness-95" style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }} title={`Reached out ${timeAgo(a.last_admin_outreach_at)} · reach out again`}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Reached out {timeAgo(a.last_admin_outreach_at)}
                  </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); openReachOut(a); }} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors hover:brightness-95" style={{ background: 'var(--a-em)', color: '#04140D' }} title={`Email ${a.email}`}>
                    <Mail className="h-3.5 w-3.5" /> Reach Out
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CALL FEED */}
      <div id="call-feed" className="a-eyebrow mt-8">Live Call Feed</div>
      <div className="a-panel">
        <div className="flex items-center gap-3 p-4 border-b border-[var(--a-line)] flex-wrap">
          <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">All Calls</h3>
          <div className="flex gap-1.5 flex-wrap ml-auto">
            {CALL_FILTERS.map((f) => (
              <button
                key={f.key}
                className="a-chip"
                data-on={filter === f.key}
                data-tone={f.key === 'attention' ? 'danger' : undefined}
                onClick={() => changeFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="a-table">
            <thead>
              <tr>
                <th>Time</th><th>Caller</th><th>Client / Agency</th><th>Outcome</th>
                <th className="r">Duration</th><th className="r">Cost</th>
              </tr>
            </thead>
            <tbody>
              {feedLoading ? (
                <tr><td colSpan={6}><div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--a-em)]" /></div></td></tr>
              ) : calls.length === 0 ? (
                <tr><td colSpan={6}><div className="py-12 text-center text-[var(--a-dim)]">No calls match this filter.</div></td></tr>
              ) : (
                calls.map((c) => {
                  const o = deriveCallOutcome(c);
                  const aid = c.agency_name ? agencyIdByName[c.agency_name.toLowerCase()] || null : null;
                  return (
                    <tr key={c.id} onClick={() => openCall(c)} className="cursor-pointer">
                      <td>
                        {timeAgo(c.created_at)}
                        {c.needs_attention && <span className="a-dot ml-2 align-middle" style={{ background: 'var(--a-red)' }} />}
                      </td>
                      <td><span className="font-semibold text-[var(--a-ink)] a-num">{formatPhone(c.customer_phone)}</span></td>
                      <td>
                        <div className="text-[var(--a-ink)]">{c.business_name || 'Unknown client'}</div>
                        {aid ? (
                          <Link href={`/admin/agencies?expand=${aid}`} onClick={(e) => e.stopPropagation()} className="text-[11.5px] text-[var(--a-dim)] hover:text-[var(--a-em-deep)] transition-colors">{c.agency_name}</Link>
                        ) : (
                          <div className="text-[11.5px] text-[var(--a-dim)]">{c.agency_name || 'No agency'}</div>
                        )}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: o.color }}>
                          <span className="a-dot" style={{ background: o.color }} />{o.label}
                        </span>
                      </td>
                      <td className="r a-num">{formatDuration(c.duration_seconds)}</td>
                      <td className="r a-num">{c.vapi_cost != null ? formatUSD(c.vapi_cost) : '\u2013'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTIONS / HOT DEMOS */}
      <div className="a-eyebrow mt-8">Pipeline &amp; Actions</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* action queue */}
        <div className="a-panel">
          <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)]">
            <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Action Queue</h3>
            {!agenciesLoading && actions.length > 0 && (
              <span className="ml-auto text-[11px] font-bold text-white rounded-full px-2 py-0.5 a-num" style={{ background: 'var(--a-red)' }}>{actions.length}</span>
            )}
          </div>
          <div className="p-1.5">
            {agenciesLoading ? (
              <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--a-em)]" /></div>
            ) : actions.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[var(--a-dim)]">Nothing needs action. Clear.</div>
            ) : actions.map((a) => {
              const inner = (
                <>
                  <span className="rounded-[10px] flex items-center justify-center shrink-0" style={{ background: flagBg(a.tone), width: 34, height: 34 }}>
                    <a.icon className="h-4 w-4" style={{ color: flagColor(a.tone) }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-[var(--a-ink)]">{a.title}</div>
                    <div className="text-[11.5px] text-[var(--a-dim)]">{a.detail}</div>
                  </div>
                  {a.href && <ArrowRight className="h-3.5 w-3.5 text-[var(--a-dim)] mt-1 shrink-0" />}
                </>
              );
              const cls = "flex gap-3 p-3 rounded-xl hover:bg-[#F6FCF9] items-start w-full text-left";
              if (a.href && a.href.startsWith('/')) return <Link key={a.id} href={a.href} className={cls}>{inner}</Link>;
              if (a.href === '#call-feed') return <button key={a.id} onClick={() => changeFilter('attention')} className={cls}>{inner}</button>;
              return <div key={a.id} className={cls}>{inner}</div>;
            })}
          </div>
        </div>

        {/* hot demos */}
        <div className="a-panel">
          <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)]">
            <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Hot Demos</h3>
            <Link href="/admin/growth" className="ml-auto text-[11px] font-semibold text-[var(--a-em-deep)]">View All</Link>
          </div>
          <div className="p-1.5">
            {demosLoading ? (
              <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--a-em)]" /></div>
            ) : demos.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[var(--a-dim)]">No high-interest demos in the last 7 days.</div>
            ) : demos.map((d) => {
              const interest = getDemoInterest(d.interest_level);
              return (
                <div key={d.id} className="flex gap-3 p-3 rounded-xl hover:bg-[#F6FCF9] items-start">
                  <span className="rounded-[10px] flex items-center justify-center shrink-0" style={{ background: interest.bg, width: 34, height: 34 }}>
                    <Sparkles className="h-4 w-4" style={{ color: interest.color }} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--a-ink)] truncate">{d.business_name || d.business_type || 'Unknown business'}</div>
                    <div className="text-[11.5px] text-[var(--a-dim)] truncate">
                      {[formatPhone(d.caller_phone), d.agency_name, timeAgo(d.created_at)].filter(Boolean).join(' \u00b7 ')}
                    </div>
                    <div className="text-[11px] font-semibold mt-0.5" style={{ color: interest.color }}>{interest.followUp}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BILLING & TRIALS (agencies) ── */}
      <div className="a-eyebrow mt-8">Billing &amp; Trials</div>
      {billing && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 items-start">
            <div className="a-panel">
              <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)]"><h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Trials ending soon</h3><span className="text-[11px] text-[var(--a-dim)]">{billing.nearExpiringTrials.length}</span></div>
              {billing.nearExpiringTrials.length === 0 ? <div className="p-4 text-[13px] text-[var(--a-dim)]">No active agency trials.</div> : billing.nearExpiringTrials.slice(0, 10).map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-[13px]" style={{ borderTop: i ? '1px solid var(--a-line)' : 'none' }}>
                  <span className="text-[var(--a-ink)] truncate mr-3">{t.name}</span>
                  <span style={{ whiteSpace: 'nowrap', color: t.days_left != null && t.days_left <= 3 ? '#ef4444' : t.days_left != null && t.days_left <= 7 ? '#f59e0b' : 'var(--a-dim)' }}>{t.days_left == null ? '—' : t.days_left < 0 ? 'ended' : t.days_left === 0 ? 'today' : `${t.days_left}d`}{t.trial_ends_at ? ` · ${billDate(t.trial_ends_at)}` : ''}</span>
                </div>
              ))}
            </div>
            <div className="a-panel">
              <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)]"><h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Upcoming renewals</h3><span className="text-[11px] text-[var(--a-dim)]">{billing.upcomingRenewals.length}</span></div>
              {billing.upcomingRenewals.length === 0 ? <div className="p-4 text-[13px] text-[var(--a-dim)]">No upcoming renewals on file.</div> : billing.upcomingRenewals.slice(0, 10).map((u: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-[13px]" style={{ borderTop: i ? '1px solid var(--a-line)' : 'none' }}>
                  <span className="text-[var(--a-ink)] truncate mr-3">{u.name}</span>
                  <span className="text-[var(--a-dim)]" style={{ whiteSpace: 'nowrap' }}>{u.current_period_end ? billDate(u.current_period_end) : ''}{u.days_until != null ? ` (${u.days_until}d)` : ''} · {u.plan_type}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 items-start">
            <div className="a-panel">
              <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)]"><h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Signed up, not paid</h3><span className="text-[11px] text-[var(--a-dim)]">{billing.pendingPayment.length}</span></div>
              {billing.pendingPayment.length === 0 ? <div className="p-4 text-[13px] text-[var(--a-dim)]">Nobody pending.</div> : billing.pendingPayment.slice(0, 10).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-[13px]" style={{ borderTop: i ? '1px solid var(--a-line)' : 'none' }}>
                  <span className="text-[var(--a-ink)] truncate mr-3">{p.name}</span><span style={{ whiteSpace: 'nowrap', color: '#f59e0b' }}>{p.days_waiting}d waiting</span>
                </div>
              ))}
            </div>
            <div className="a-panel">
              <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)]"><h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Overdue</h3><span className="text-[11px] text-[var(--a-dim)]">{billing.pastDue.length}</span></div>
              {billing.pastDue.length === 0 ? <div className="p-4 text-[13px] text-[var(--a-dim)]">Nobody overdue.</div> : billing.pastDue.slice(0, 10).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-[13px]" style={{ borderTop: i ? '1px solid var(--a-line)' : 'none' }}>
                  <span className="text-[var(--a-ink)] truncate mr-3">{p.name}</span><span style={{ whiteSpace: 'nowrap', color: '#ef4444' }}>payment failed · {p.plan_type}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="a-panel mt-4">
            <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)]"><h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Free agencies</h3><span className="text-[11px] text-[var(--a-dim)]">{billing.freeAgencies.length} · upgrade targets</span></div>
            {billing.freeAgencies.length === 0 ? <div className="p-4 text-[13px] text-[var(--a-dim)]">No free-tier agencies.</div> : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0.5 p-1.5">
                {billing.freeAgencies.slice(0, 20).map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-[13px]">
                    <span className="text-[var(--a-ink)] truncate mr-3">{a.name}</span><span className="text-[var(--a-dim)]" style={{ whiteSpace: 'nowrap' }}>{a.days_since}d old</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* REACH-OUT MODAL (copy/paste + log) */}
      {reachOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setReachOut(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-[var(--a-card)] overflow-hidden" style={{ border: '1px solid var(--a-line)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--a-line)' }}>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-[var(--a-ink)] truncate">Reach out to {reachOut.name}</h3>
                <p className="text-[11.5px] text-[var(--a-dim)]">{isFreeAgency(reachOut) ? 'Free plan template' : 'Pro / Scale template'}{reachOut.last_admin_outreach_at ? ` · last reached out ${timeAgo(reachOut.last_admin_outreach_at)}` : ''}</p>
              </div>
              <button onClick={() => setReachOut(null)} className="p-1.5 rounded-lg hover:bg-black/5 shrink-0"><X className="h-4 w-4 text-[var(--a-dim)]" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--a-dim)]">To</label>
                <div className="mt-1 flex items-center gap-2">
                  <input readOnly value={reachOut.email} className="a-input flex-1" />
                  <button onClick={() => copyText(reachOut.email, 'email')} className="shrink-0 rounded-lg px-3 py-2 text-[12px] font-semibold" style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }}>{copied === 'email' ? 'Copied' : 'Copy'}</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--a-dim)]">Subject</label>
                <div className="mt-1 flex items-center gap-2">
                  <input value={oSubject} onChange={(e) => setOSubject(e.target.value)} className="a-input flex-1" />
                  <button onClick={() => copyText(oSubject, 'subject')} className="shrink-0 rounded-lg px-3 py-2 text-[12px] font-semibold" style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }}>{copied === 'subject' ? 'Copied' : 'Copy'}</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--a-dim)]">Message</label>
                <textarea value={oBody} onChange={(e) => setOBody(e.target.value)} rows={11} className="a-input w-full mt-1 resize-none" style={{ lineHeight: 1.6 }} />
                <div className="mt-2 flex justify-end">
                  <button onClick={() => copyText(oBody, 'body')} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold" style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }}>{copied === 'body' ? 'Copied' : 'Copy message'}</button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-5 py-4 border-t" style={{ borderColor: 'var(--a-line)' }}>
              <p className="text-[11px] text-[var(--a-dim)] hidden sm:block">Copy, send from your email, then mark it logged.</p>
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setReachOut(null)} className="rounded-lg px-3 py-2 text-[12px] font-semibold text-[var(--a-dim)] hover:bg-black/5">Cancel</button>
                <button onClick={() => logOutreach(reachOut, oSubject, oBody)} disabled={logging} className="rounded-lg px-4 py-2 text-[12px] font-semibold disabled:opacity-50" style={{ background: 'var(--a-em)', color: '#04140D' }}>{logging ? 'Saving...' : 'Mark as reached out'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER (shared component) */}
      <CallDrawer callId={openId} agencyId={openAgencyId} onClose={() => { setOpenId(null); setOpenAgencyId(null); }} />
    </div>
  );
}


// ── flag tints for the action queue ─────────────────────────────────────────
function flagBg(tone: string) {
  return tone === 'danger' ? '#FBE3E3' : tone === 'warn' ? '#FBF0D6' : tone === 'info' ? '#DBF1F6' : 'var(--a-em-soft)';
}
function flagColor(tone: string) {
  return tone === 'danger' ? 'var(--a-red)' : tone === 'warn' ? 'var(--a-amber)' : tone === 'info' ? 'var(--a-cyan)' : 'var(--a-em-deep)';
}