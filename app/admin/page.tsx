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
  plan_type: string; subscription_status: string; created_at: string;
  trial_ends_at: string | null; client_count: number; referral_source: string | null;
}
interface DemoRow {
  id: string; created_at: string; caller_phone: string; business_name: string | null;
  business_type: string | null; interest_level: string | null; agency_name: string | null;
  vapi_success_score: string | null;
}

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [attentionCount, setAttentionCount] = useState(0);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [feedLoading, setFeedLoading] = useState(false);

  // drawer (shared component owns fetch + escape handling)
  const [openId, setOpenId] = useState<string | null>(null);
  const [openAgencyId, setOpenAgencyId] = useState<string | null>(null);

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

  useEffect(() => {
    (async () => {
      try {
        const [dash, attention, ag, dm] = await Promise.all([
          adminGet('/api/admin/dashboard'),
          adminGet('/api/admin/calls?filter=attention&limit=1'),
          adminGet('/api/admin/agencies?limit=100'),
          adminGet(`/api/admin/demos?interest=high&since=${new Date(Date.now() - 7 * 864e5).toISOString()}&limit=5`),
        ]);
        setStats(dash.stats || null);
        setAttentionCount(attention.total || 0);
        setAgencies(ag.agencies || []);
        setDemos(dm.demos || []);
        await fetchCalls('all');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchCalls]);

  const changeFilter = (f: string) => { setFilter(f); fetchCalls(f); };

  // ── recent signups: newest agencies, with location from area code ─────────
  const signups = useMemo(() => {
    return [...agencies]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
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
      items.push({
        id: `demo-${d.id}`, icon: Sparkles, tone: 'em',
        title: `Hot demo: ${d.business_name || d.business_type || 'unknown business'}`,
        detail: `${timeAgo(d.created_at)}, follow up fast`,
      });
    });

    return items.slice(0, 8);
  }, [agencies, attentionCount, demos]);

  if (loading) {
    return (
      <div className="admin-scope min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" />
      </div>
    );
  }

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-ink)]">Overview</h1>
      <p className="mt-1 text-sm text-[var(--a-dim)]">Is everything working, who just signed up, and what needs action.</p>

      {/* OP STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
        <OpTile label="Calls this month" value={formatNumber(stats?.callsThisMonth)} foot={`${stats?.totalClients || 0} clients answering`} tone="hero" />
        <OpTile label="Needs attention" value={String(attentionCount)} foot="Failed or no outcome" tone="alert" onClick={() => changeFilter('attention')} />
        <OpTile label="New signups (7d)" value={String((stats?.recentAgencies || 0) + (stats?.recentClients || 0))} foot={`${stats?.recentAgencies || 0} agencies, ${stats?.recentClients || 0} clients`} tone="grow" />
        <OpTile label="Active agencies" value={String(stats?.activeAgencies || 0)} foot={`${stats?.trialAgencies || 0} on trial`} />
      </div>

      {/* SIGNUPS / ACTIONS / HOT DEMOS */}
      <div className="a-eyebrow mt-8">Pipeline &amp; actions</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* recent signups */}
        <div className="a-panel">
          <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)]">
            <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Recent signups</h3>
            <span className="text-[11px] text-[var(--a-dim)] ml-auto">last few</span>
          </div>
          <div className="p-1.5">
            {signups.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-[var(--a-dim)]">No agencies yet.</div>
            ) : signups.map((a) => {
              const loc = getPhoneLocation(a.phone, a.country);
              return (
                <Link key={a.id} href={`/admin/agencies?expand=${a.id}`} className="flex gap-3 p-3 rounded-xl hover:bg-[#F6FCF9] items-start">
                  <span className="h-9 w-9 rounded-[10px] flex items-center justify-center font-semibold text-[12px] shrink-0" style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }}>
                    {(a.name || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--a-ink)] truncate">{a.name}</div>
                    <div className="text-[11.5px] text-[var(--a-em-deep)] font-semibold truncate">{a.email}</div>
                    <div className="text-[11.5px] text-[var(--a-dim)] truncate">
                      {[loc, getPlanDisplayName(a.plan_type), a.referral_source ? a.referral_source.replace(/_/g, ' ') : null, timeAgo(a.created_at)].filter(Boolean).join(' \u00b7 ')}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--a-dim)] ml-auto mt-1 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* action queue */}
        <div className="a-panel">
          <div className="flex items-center gap-2 p-4 border-b border-[var(--a-line)]">
            <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Action queue</h3>
            {actions.length > 0 && (
              <span className="ml-auto text-[11px] font-bold text-white rounded-full px-2 py-0.5 a-num" style={{ background: 'var(--a-red)' }}>{actions.length}</span>
            )}
          </div>
          <div className="p-1.5">
            {actions.length === 0 ? (
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
            <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">Hot demos</h3>
            <Link href="/admin/growth" className="ml-auto text-[11px] font-semibold text-[var(--a-em-deep)]">View all</Link>
          </div>
          <div className="p-1.5">
            {demos.length === 0 ? (
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

      {/* CALL FEED */}
      <div id="call-feed" className="a-eyebrow mt-8">Live call feed</div>
      <div className="a-panel">
        <div className="flex items-center gap-3 p-4 border-b border-[var(--a-line)] flex-wrap">
          <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">All calls</h3>
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
                  return (
                    <tr key={c.id} onClick={() => openCall(c)} className="cursor-pointer">
                      <td>
                        {timeAgo(c.created_at)}
                        {c.needs_attention && <span className="a-dot ml-2 align-middle" style={{ background: 'var(--a-red)' }} />}
                      </td>
                      <td><span className="font-semibold text-[var(--a-ink)] a-num">{formatPhone(c.customer_phone)}</span></td>
                      <td>
                        <div className="text-[var(--a-ink)]">{c.business_name || 'Unknown client'}</div>
                        <div className="text-[11.5px] text-[var(--a-dim)]">{c.agency_name || 'No agency'}</div>
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

      {/* DRAWER (shared component) */}
      <CallDrawer callId={openId} agencyId={openAgencyId} onClose={() => { setOpenId(null); setOpenAgencyId(null); }} />
    </div>
  );
}

// ── op tile ─────────────────────────────────────────────────────────────────
function OpTile({ label, value, foot, tone, onClick }: { label: string; value: string; foot: string; tone?: string; onClick?: () => void }) {
  const isHero = tone === 'hero';
  const cls =
    tone === 'hero' ? 'text-white' :
    tone === 'alert' ? 'text-[var(--a-red)]' :
    tone === 'grow' ? 'text-[var(--a-em-deep)]' : 'text-[var(--a-ink)]';
  const bg =
    tone === 'hero' ? { background: 'linear-gradient(150deg,#10b981,#0B9668)', border: 'none' } :
    tone === 'alert' ? { background: 'linear-gradient(160deg,#FFF3F3,#fff)', borderColor: '#F3C9C9' } :
    tone === 'grow' ? { background: 'linear-gradient(160deg,var(--a-em-soft),#fff)', borderColor: 'var(--a-em-line)' } :
    undefined;
  return (
    <button onClick={onClick} className="a-card text-left p-4 transition-transform hover:-translate-y-px" style={bg}>
      <div className={`text-[12px] font-semibold ${isHero ? 'text-white/85' : 'text-[var(--a-muted)]'}`}>{label}</div>
      <div className={`a-num mt-2 text-[33px] font-bold leading-none ${cls}`}>{value}</div>
      <div className={`text-[11.5px] mt-1.5 font-medium ${isHero ? 'text-white/80' : 'text-[var(--a-dim)]'}`}>{foot}</div>
    </button>
  );
}

// ── flag tints for the action queue ─────────────────────────────────────────
function flagBg(tone: string) {
  return tone === 'danger' ? '#FBE3E3' : tone === 'warn' ? '#FBF0D6' : tone === 'info' ? '#DBF1F6' : 'var(--a-em-soft)';
}
function flagColor(tone: string) {
  return tone === 'danger' ? 'var(--a-red)' : tone === 'warn' ? 'var(--a-amber)' : tone === 'info' ? 'var(--a-cyan)' : 'var(--a-em-deep)';
}