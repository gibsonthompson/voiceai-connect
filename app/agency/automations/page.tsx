'use client';

// ============================================================================
// AUTOMATIONS - agency-facing workflow control
//
// The template-first surface (never a blank canvas): the starter recipes as
// enable/disable cards, each with live stats and an activity feed. Talks to
// /api/agency/:agencyId/workflows. Plan gating mirrors the backend: Free is
// locked, Pro is capped + basic recipes, Scale is unlimited. The visual canvas
// builds on top of this later; this ships the capability today.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAgency } from '../context';
import { useTheme } from '../../../hooks/useTheme';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import LockedFeature from '@/components/LockedFeature';
import {
  Phone, MessageSquare, CalendarCheck, Star, Loader2, Activity,
  ChevronDown, CheckCircle2, AlertCircle, Zap, Send, Clock, RefreshCw, Sparkles,
  Plus, SlidersHorizontal, Building2, Check,
} from 'lucide-react';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const authHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
});

// ---------------------------------------------------------------------------
// types
// ---------------------------------------------------------------------------
interface TemplateCard {
  key: string;
  name: string;
  description: string;
  tier: string;
  trigger_type: string;
  subject?: string;
  activated: boolean;
  workflow_id: string | null;
  workflow_status: string | null;
}
interface Entitlements { plan: string; max_workflows: number | null; allowed_tiers: string[]; has_access: boolean; }
interface Stats { total: number; active: number; completed: number; stopped: number; failed: number; messages_sent: number; }
interface Run { id: string; contact_phone: string | null; status: string; stopped_reason: string | null; enrolled_at: string; completed_at: string | null; }

const ICONS: Record<string, typeof Phone> = {
  missed_call_followup: Phone,
  post_call_followup: MessageSquare,
  appointment_confirmation: CalendarCheck,
  review_request: Star,
};
function triggerLabel(t: string): string {
  if (t === 'call.completed') return 'After a call';
  if (t === 'appointment.booked') return 'When an appointment is booked';
  return t;
}
function maskPhone(p: string | null): string {
  if (!p) return 'Unknown';
  const d = p.replace(/\D/g, '');
  if (d.length < 4) return 'Unknown';
  return `(***) ***-${d.slice(-4)}`;
}
function fmtWhen(iso: string): string {
  try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
}

// Scope picker: "All clients" or one business (custom, no native select).
function ScopeDropdown({ clients, value, onChange, theme }: { clients: { id: string; business_name: string }[]; value: string | null; onChange: (v: string | null) => void; theme: any }) {
  const [open, setOpen] = useState(false);
  const label = value ? (clients.find((c) => c.id === value)?.business_name || 'Business') : 'All clients';
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
        <Building2 className="h-4 w-4" style={{ color: theme.textMuted }} />
        <span className="font-medium truncate max-w-[200px]">{label}</span>
        <ChevronDown className="h-4 w-4" style={{ color: theme.textMuted }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-64 max-h-72 overflow-y-auto rounded-xl shadow-lg" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <button type="button" onClick={() => { onChange(null); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center justify-between" style={{ color: theme.text, backgroundColor: value === null ? theme.hover : 'transparent' }}>
              All clients {value === null && <Check className="h-3.5 w-3.5" style={{ color: theme.primary }} />}
            </button>
            {clients.length === 0 && <div className="px-3 py-2 text-xs" style={{ color: theme.textMuted }}>No businesses yet.</div>}
            {clients.map((c) => (
              <button key={c.id} type="button" onClick={() => { onChange(c.id); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2" style={{ color: theme.text, backgroundColor: value === c.id ? theme.hover : 'transparent' }}>
                <span className="truncate">{c.business_name}</span>{value === c.id && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: theme.primary }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AutomationsPage() {
  const { agency } = useAgency();
  const theme = useTheme();
  const pf = usePlanFeatures();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [statsByWf, setStatsByWf] = useState<Record<string, Stats>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runsByWf, setRunsByWf] = useState<Record<string, Run[]>>({});
  const [loadingRuns, setLoadingRuns] = useState(false);

  const agencyId = agency?.id;
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [clients, setClients] = useState<{ id: string; business_name: string }[]>([]);
  const [scopeClientId, setScopeClientId] = useState<string | null>(null); // null = all clients
  // Category split: customer-facing (runs for a client's callers) vs account/
  // internal (runs on a client's billing + lifecycle events, agency-wide).
  const [category, setCategory] = useState<'customer' | 'account'>('customer');

  useEffect(() => {
    if (!agencyId) return;
    (async () => {
      try {
        const r = await fetch(`${backendUrl()}/api/agency/${agencyId}/clients`, { headers: authHeaders() });
        if (!r.ok) return;
        const d = await r.json();
        setClients((d.clients || []).map((c: any) => ({ id: c.id, business_name: c.business_name || 'Unnamed business' })));
      } catch { /* ignore */ }
    })();
  }, [agencyId]);

  async function createBlank() {
    if (!agencyId || creating) return;
    setCreating(true);
    try {
      const res = await fetch(`${backendUrl()}/api/agency/${agencyId}/workflows`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: 'New automation', client_id: category === 'account' ? undefined : (scopeClientId || undefined), trigger_type: category === 'account' ? 'client.payment_failed' : 'call.completed' }),
      });
      const data = await res.json();
      if (!res.ok) { setNotice({ kind: 'err', text: data.error || 'Could not create' }); return; }
      router.push(`/agency/automations/${data.workflow.id}`);
    } catch (e: any) {
      setNotice({ kind: 'err', text: e?.message || 'Something went wrong' });
    } finally { setCreating(false); }
  }

  const loadAll = useCallback(async () => {
    if (!agencyId) return;
    setError(null);
    try {
      const scopeParam = category === 'account' ? null : scopeClientId;
      const res = await fetch(`${backendUrl()}/api/agency/${agencyId}/workflows/templates${scopeParam ? `?client_id=${scopeParam}` : ''}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      const tpls: TemplateCard[] = data.templates || [];
      setTemplates(tpls);
      setEnt(data.entitlements || null);
      // Pull stats for every activated workflow in parallel.
      const activated = tpls.filter((t) => t.workflow_id);
      const statsEntries = await Promise.all(activated.map(async (t) => {
        try {
          const r = await fetch(`${backendUrl()}/api/agency/${agencyId}/workflows/${t.workflow_id}/stats`, { headers: authHeaders() });
          if (!r.ok) return null;
          const s = await r.json();
          return [t.workflow_id as string, s.stats as Stats] as const;
        } catch { return null; }
      }));
      const map: Record<string, Stats> = {};
      statsEntries.forEach((e) => { if (e) map[e[0]] = e[1]; });
      setStatsByWf(map);
    } catch (e: any) {
      setError(e?.message || 'Could not load automations');
    } finally {
      setLoading(false);
    }
  }, [agencyId, scopeClientId, category]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-dismiss the notice banner.
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(id);
  }, [notice]);

  const shownTemplates = templates.filter((t) => (t.subject || 'customer') === category);
  const activeCount = templates.filter((t) => t.workflow_status === 'active').length;
  const capReached = !!(ent && ent.max_workflows !== null && activeCount >= ent.max_workflows);
  const totalSent = Object.values(statsByWf).reduce((n, s) => n + (s.messages_sent || 0), 0);
  const totalReached = Object.values(statsByWf).reduce((n, s) => n + (s.total || 0), 0);

  async function toggle(t: TemplateCard) {
    if (!agencyId || busyKey) return;
    const turningOn = t.workflow_status !== 'active';
    if (turningOn && !t.activated && capReached) {
      setNotice({ kind: 'err', text: `Your plan runs ${ent?.max_workflows} automations at once. Upgrade to Scale for unlimited.` });
      return;
    }
    setBusyKey(t.key);
    try {
      let workflowId = t.workflow_id;
      // Create from template the first time.
      if (!t.activated || !workflowId) {
        const createRes = await fetch(`${backendUrl()}/api/agency/${agencyId}/workflows`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify({ template_key: t.key, client_id: category === 'account' ? undefined : (scopeClientId || undefined) }),
        });
        const created = await createRes.json();
        if (!createRes.ok) {
          setNotice({ kind: 'err', text: created.error || 'Could not set that up' });
          return;
        }
        workflowId = created.workflow.id;
      }
      const action = turningOn ? 'activate' : 'pause';
      const res = await fetch(`${backendUrl()}/api/agency/${agencyId}/workflows/${workflowId}/${action}`, {
        method: 'POST', headers: authHeaders(),
      });
      const out = await res.json();
      if (!res.ok) {
        setNotice({ kind: 'err', text: out.error || 'Could not update that' });
        return;
      }
      setNotice({ kind: 'ok', text: turningOn ? `${t.name} is on` : `${t.name} paused` });
      await loadAll();
    } catch (e: any) {
      setNotice({ kind: 'err', text: e?.message || 'Something went wrong' });
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleActivity(t: TemplateCard) {
    const wfId = t.workflow_id;
    if (!wfId) return;
    if (expanded === wfId) { setExpanded(null); return; }
    setExpanded(wfId);
    if (!runsByWf[wfId]) {
      setLoadingRuns(true);
      try {
        const r = await fetch(`${backendUrl()}/api/agency/${agencyId}/workflows/${wfId}/runs?limit=25`, { headers: authHeaders() });
        const data = await r.json();
        setRunsByWf((prev) => ({ ...prev, [wfId]: data.runs || [] }));
      } catch { /* leave empty */ } finally { setLoadingRuns(false); }
    }
  }

  // -------------------------------------------------------------------------
  // render helpers
  // -------------------------------------------------------------------------
  const statusPill = (status: string | null) => {
    const map: Record<string, { label: string; bg: string; fg: string }> = {
      active: { label: 'Active', bg: theme.primary, fg: theme.primaryText },
      paused: { label: 'Paused', bg: theme.warningBg || theme.hover, fg: theme.warningText || theme.text },
    };
    const s = status ? map[status] : null;
    if (!s) return <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Off</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>;
  };

  const runStatusChip = (run: Run) => {
    const palette: Record<string, string> = { active: theme.primary, completed: theme.textMuted, stopped: theme.textMuted, failed: theme.error };
    const color = palette[run.status] || theme.textMuted;
    const label = run.status === 'stopped' && run.stopped_reason === 'goal_reply' ? 'Replied'
      : run.status === 'stopped' && run.stopped_reason === 'goal_booked' ? 'Booked'
      : run.status === 'active' ? 'In progress'
      : run.status.charAt(0).toUpperCase() + run.status.slice(1);
    return <span className="text-xs font-medium" style={{ color }}>{label}</span>;
  };

  // Custom toggle switch (no native input).
  const Switch = ({ on, busy, disabled, onClick }: { on: boolean; busy: boolean; disabled?: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      aria-pressed={on}
      className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0"
      style={{
        backgroundColor: on ? theme.primary : theme.border,
        opacity: disabled && !on ? 0.45 : 1,
        cursor: busy || disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-transform"
        style={{ backgroundColor: '#fff', transform: on ? 'translateX(22px)' : 'translateX(3px)' }}
      >
        {busy && <Loader2 className="h-3 w-3 animate-spin" style={{ color: theme.primary }} />}
      </span>
    </button>
  );

  // -------------------------------------------------------------------------
  // card (shared by the live grid and the locked preview)
  // -------------------------------------------------------------------------
  const renderCard = (t: TemplateCard, interactive: boolean) => {
    const Icon = ICONS[t.key] || Zap;
    const isOn = t.workflow_status === 'active';
    const wfId = t.workflow_id;
    const stats = wfId ? statsByWf[wfId] : null;
    const disableSwitch = !interactive || (!isOn && !t.activated && capReached);
    return (
      <div key={t.key} className="rounded-2xl p-5 flex flex-col" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isOn ? theme.primary : theme.hover }}>
              <Icon className="h-5 w-5" style={{ color: isOn ? theme.primaryText : theme.textMuted }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate" style={{ color: theme.text }}>{t.name}</h3>
                {statusPill(t.workflow_status)}
              </div>
              <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: theme.textMuted }}>
                <Zap className="h-3 w-3" /> {triggerLabel(t.trigger_type)}
              </p>
            </div>
          </div>
          <Switch on={isOn} busy={busyKey === t.key} disabled={disableSwitch} onClick={() => toggle(t)} />
        </div>

        <p className="text-sm mt-3 leading-relaxed" style={{ color: theme.textMuted }}>{t.description}</p>

        {t.activated && (
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl px-3 py-2" style={{ backgroundColor: theme.hover }}>
                <div className="text-lg font-semibold" style={{ color: theme.text }}>{stats ? stats.messages_sent : 0}</div>
                <div className="text-xs" style={{ color: theme.textMuted }}>Texts sent</div>
              </div>
              <div className="rounded-xl px-3 py-2" style={{ backgroundColor: theme.hover }}>
                <div className="text-lg font-semibold" style={{ color: theme.text }}>{stats ? stats.active : 0}</div>
                <div className="text-xs" style={{ color: theme.textMuted }}>In progress</div>
              </div>
            </div>
            {wfId && (
              <>
                <div className="mt-3 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => interactive && toggleActivity(t)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: theme.primary }}
                  >
                    <Activity className="h-3.5 w-3.5" /> Activity
                    <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ transform: expanded === wfId ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  {interactive && (
                    <a href={`/agency/automations/${wfId}`} className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: theme.textMuted }}>
                      <SlidersHorizontal className="h-3.5 w-3.5" /> Edit steps
                    </a>
                  )}
                </div>

                {expanded === wfId && (
                  <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
                    {loadingRuns && !runsByWf[wfId] ? (
                      <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.textMuted }} /></div>
                    ) : (runsByWf[wfId] || []).length === 0 ? (
                      <div className="text-xs text-center py-6" style={{ color: theme.textMuted }}>No one has gone through this yet.</div>
                    ) : (
                      (runsByWf[wfId] || []).map((run) => (
                        <div key={run.id} className="flex items-center justify-between px-3 py-2 text-sm" style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <span style={{ color: theme.text }}>{maskPhone(run.contact_phone)}</span>
                          <div className="flex items-center gap-3">
                            {runStatusChip(run)}
                            <span className="text-xs" style={{ color: theme.textMuted }}>{fmtWhen(run.enrolled_at)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // locked (Free plan): show the recipes as a preview behind the upgrade gate
  // -------------------------------------------------------------------------
  if (pf.isFree) {
    const preview: TemplateCard[] = [
      { key: 'missed_call_followup', name: 'Missed-call follow-up', description: 'Text the caller back when they wanted a human, left a message, or hung up before we resolved it.', tier: 'basic', trigger_type: 'call.completed', activated: false, workflow_id: null, workflow_status: null },
      { key: 'post_call_followup', name: 'Post-call follow-up', description: 'Send a short thank-you after any real call and invite a reply.', tier: 'basic', trigger_type: 'call.completed', activated: false, workflow_id: null, workflow_status: null },
      { key: 'appointment_confirmation', name: 'Appointment confirmation', description: 'Text a confirmation the moment an appointment is booked.', tier: 'basic', trigger_type: 'appointment.booked', activated: false, workflow_id: null, workflow_status: null },
      { key: 'review_request', name: 'Review request', description: 'A day after a booked call, ask the customer for a quick review.', tier: 'basic', trigger_type: 'call.completed', activated: false, workflow_id: null, workflow_status: null },
    ];
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <LockedFeature
          title="Automations"
          description="Follow up with every caller automatically over text: missed-call text-backs, post-call follow-ups, appointment confirmations, and review requests. Set up once, runs across all your clients."
          requiredPlan="Pro"
          features={[
            'Missed-call text-back grounded in the AI call outcome',
            'Appointment confirmations and review requests',
            'Quiet hours, opt-out, and stop-on-reply built in',
          ]}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {preview.map((t) => renderCard(t, false))}
          </div>
        </LockedFeature>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // main
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.text }}>
            <Zap className="h-6 w-6" style={{ color: theme.primary }} /> Automations
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
            {category === 'account'
              ? "Automations that run on your clients' billing and account events. Internal to your agency, they text the business owner."
              : scopeClientId
                ? 'Customer follow-ups for this one business. Its own automations override your agency-wide ones.'
                : "Customer follow-ups that run after your clients' calls. Pick a business to set up automations just for it."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={loadAll} className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl" style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button type="button" onClick={createBlank} disabled={creating} className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium" style={{ backgroundColor: theme.primary, color: theme.primaryText, opacity: creating ? 0.6 : 1 }}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Build your own
          </button>
        </div>
      </div>

      {/* category: customer-facing vs account/internal (GHL-style split) */}
      <div className="mb-5 inline-flex rounded-xl p-1 gap-1" style={{ backgroundColor: theme.hover }}>
        {([
          { id: 'customer', label: 'Customer follow-ups', icon: Phone },
          { id: 'account', label: 'Account & billing', icon: Building2 },
        ] as const).map((c) => {
          const on = category === c.id;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: on ? theme.card : 'transparent', color: on ? theme.text : theme.textMuted, border: `1px solid ${on ? theme.border : 'transparent'}` }}
            >
              <Icon className="h-4 w-4" /> {c.label}
            </button>
          );
        })}
      </div>

      {/* scope: customer automations target all clients or one business;
          account automations are agency-wide. */}
      {category === 'customer' ? (
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium" style={{ color: theme.text }}>Set up for</span>
          <ScopeDropdown clients={clients} value={scopeClientId} onChange={setScopeClientId} theme={theme} />
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
          <Building2 className="h-4 w-4" /> Runs across your whole agency, on your clients&apos; billing events.
        </div>
      )}

      {notice && (
        <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm" style={{
          backgroundColor: notice.kind === 'ok' ? (theme.infoBg || theme.hover) : (theme.errorBg || theme.hover),
          color: notice.kind === 'ok' ? (theme.info || theme.text) : theme.error,
          border: `1px solid ${notice.kind === 'ok' ? (theme.infoBorder || theme.border) : (theme.errorBorder || theme.border)}`,
        }}>
          {notice.kind === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.textMuted }} /></div>
      ) : error ? (
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: theme.error }} />
          <p className="text-sm mb-4" style={{ color: theme.textMuted }}>{error}</p>
          <button type="button" onClick={() => { setLoading(true); loadAll(); }} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : (
        <>
          {/* summary tiles: three across so the row is always filled */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-2xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 text-xs mb-1" style={{ color: theme.textMuted }}><Zap className="h-3.5 w-3.5" /> Active</div>
              <div className="text-2xl font-bold" style={{ color: theme.text }}>
                {activeCount}{ent && ent.max_workflows !== null ? <span className="text-base font-normal" style={{ color: theme.textMuted }}> / {ent.max_workflows}</span> : <span className="text-base font-normal" style={{ color: theme.textMuted }}> / unlimited</span>}
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 text-xs mb-1" style={{ color: theme.textMuted }}><Send className="h-3.5 w-3.5" /> Texts sent</div>
              <div className="text-2xl font-bold" style={{ color: theme.text }}>{totalSent}</div>
            </div>
            <div className="rounded-2xl p-4" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 text-xs mb-1" style={{ color: theme.textMuted }}><Activity className="h-3.5 w-3.5" /> Contacts reached</div>
              <div className="text-2xl font-bold" style={{ color: theme.text }}>{totalReached}</div>
            </div>
          </div>

          {/* Pro: note that advanced steps live on Scale */}
          {pf.isPro && (
            <div className="mb-5 rounded-xl px-4 py-3 flex items-center gap-2 text-sm" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
              <Sparkles className="h-4 w-4 shrink-0" style={{ color: theme.primary }} />
              You can run {ent?.max_workflows} automations at once on Pro. Scale unlocks unlimited automations plus AI-written messages and webhooks.
            </div>
          )}

          {shownTemplates.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <Zap className="h-8 w-8 mx-auto mb-3" style={{ color: theme.textMuted }} />
              <p className="text-sm" style={{ color: theme.textMuted }}>No recipes in this category yet. Use Build your own to start from scratch.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {shownTemplates.map((t) => renderCard(t, true))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
