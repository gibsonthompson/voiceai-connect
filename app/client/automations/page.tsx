'use client';

// ============================================================================
// CLIENT AUTOMATIONS - the business owner's view of their text automations.
// They can see what's running, toggle their OWN automations on/off, and watch
// activity. Building/editing stays with the agency. Agency-wide automations show
// read-only ("set by your agency").
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';
import {
  Zap, Phone, MessageSquare, CalendarCheck, Star, Loader2, Activity, ChevronDown,
  AlertCircle, CheckCircle2, RefreshCw, ShieldCheck,
} from 'lucide-react';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const authHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
});

interface WF { id: string; name: string; description: string | null; trigger_type: string; status: string; template_key: string | null; scope: string; }
interface Stats { total: number; active: number; completed: number; stopped: number; failed: number; messages_sent: number; }
interface Run { id: string; contact_phone: string | null; status: string; stopped_reason: string | null; enrolled_at: string; }

const ICONS: Record<string, typeof Phone> = {
  missed_call_followup: Phone, post_call_followup: MessageSquare, appointment_confirmation: CalendarCheck, review_request: Star,
};
function triggerLabel(t: string): string {
  if (t === 'call.completed') return 'After a call';
  if (t === 'appointment.booked') return 'When an appointment is booked';
  return t;
}
function maskPhone(p: string | null): string { if (!p) return 'Unknown'; const d = p.replace(/\D/g, ''); return d.length < 4 ? 'Unknown' : `(***) ***-${d.slice(-4)}`; }
function fmtWhen(iso: string): string { try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return ''; } }

export default function ClientAutomationsPage() {
  const { client } = useClient();
  const theme = useClientTheme();
  const clientId = client?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [own, setOwn] = useState<WF[]>([]);
  const [agencyWide, setAgencyWide] = useState<WF[]>([]);
  const [statsByWf, setStatsByWf] = useState<Record<string, Stats>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runsByWf, setRunsByWf] = useState<Record<string, Run[]>>({});

  const load = useCallback(async () => {
    if (!clientId) return;
    setError(null);
    try {
      const res = await fetch(`${backendUrl()}/api/client/${clientId}/workflows`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      const ownList: WF[] = data.own || [];
      setOwn(ownList);
      setAgencyWide(data.agency_wide || []);
      const all = [...ownList, ...(data.agency_wide || [])];
      const entries = await Promise.all(all.map(async (w: WF) => {
        try {
          const r = await fetch(`${backendUrl()}/api/client/${clientId}/workflows/${w.id}/stats`, { headers: authHeaders() });
          if (!r.ok) return null;
          const s = await r.json();
          return [w.id, s.stats as Stats] as const;
        } catch { return null; }
      }));
      const map: Record<string, Stats> = {};
      entries.forEach((e) => { if (e) map[e[0]] = e[1]; });
      setStatsByWf(map);
    } catch (e: any) {
      setError(e?.message || 'Could not load your automations');
    } finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(null), 4000); return () => clearTimeout(id); }, [notice]);

  async function toggle(w: WF) {
    if (!clientId || busyId) return;
    const turningOn = w.status !== 'active';
    setBusyId(w.id);
    try {
      const res = await fetch(`${backendUrl()}/api/client/${clientId}/workflows/${w.id}/${turningOn ? 'activate' : 'pause'}`, { method: 'POST', headers: authHeaders() });
      const out = await res.json();
      if (!res.ok) { setNotice({ kind: 'err', text: out.error || 'Could not update that' }); return; }
      setNotice({ kind: 'ok', text: turningOn ? `${w.name} is on` : `${w.name} paused` });
      await load();
    } catch (e: any) {
      setNotice({ kind: 'err', text: e?.message || 'Something went wrong' });
    } finally { setBusyId(null); }
  }

  async function toggleActivity(w: WF) {
    if (expanded === w.id) { setExpanded(null); return; }
    setExpanded(w.id);
    if (!runsByWf[w.id]) {
      try {
        const r = await fetch(`${backendUrl()}/api/client/${clientId}/workflows/${w.id}/runs?limit=25`, { headers: authHeaders() });
        const data = await r.json();
        setRunsByWf((prev) => ({ ...prev, [w.id]: data.runs || [] }));
      } catch { /* leave empty */ }
    }
  }

  const Switch = ({ on, busy, onClick }: { on: boolean; busy: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick} disabled={busy} aria-pressed={on}
      className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0"
      style={{ backgroundColor: on ? theme.primary : theme.border, cursor: busy ? 'not-allowed' : 'pointer' }}>
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-transform" style={{ backgroundColor: '#fff', transform: on ? 'translateX(22px)' : 'translateX(3px)' }}>
        {busy && <Loader2 className="h-3 w-3 animate-spin" style={{ color: theme.primary }} />}
      </span>
    </button>
  );

  const card = (w: WF, canToggle: boolean) => {
    const Icon = (w.template_key && ICONS[w.template_key]) || Zap;
    const isOn = w.status === 'active';
    const stats = statsByWf[w.id];
    return (
      <div key={w.id} className="rounded-2xl p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isOn ? theme.primary : theme.hover }}>
              <Icon className="h-5 w-5" style={{ color: isOn ? theme.primaryText : theme.textMuted }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate" style={{ color: theme.text }}>{w.name}</h3>
              <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: theme.textMuted }}><Zap className="h-3 w-3" /> {triggerLabel(w.trigger_type)}</p>
            </div>
          </div>
          {canToggle
            ? <Switch on={isOn} busy={busyId === w.id} onClick={() => toggle(w)} />
            : <span className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0" style={{ backgroundColor: theme.hover, color: theme.textMuted }}><ShieldCheck className="h-3 w-3" /> By your agency</span>}
        </div>
        {w.description && <p className="text-sm mt-3 leading-relaxed" style={{ color: theme.textMuted }}>{w.description}</p>}
        <div className="mt-4 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: `1px solid ${theme.border}` }}>
          <div className="rounded-xl px-3 py-2" style={{ backgroundColor: theme.hover }}>
            <div className="text-lg font-semibold" style={{ color: theme.text }}>{stats ? stats.messages_sent : 0}</div>
            <div className="text-xs" style={{ color: theme.textMuted }}>Texts sent</div>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ backgroundColor: theme.hover }}>
            <div className="text-lg font-semibold" style={{ color: theme.text }}>{stats ? stats.active : 0}</div>
            <div className="text-xs" style={{ color: theme.textMuted }}>In progress</div>
          </div>
        </div>
        <button type="button" onClick={() => toggleActivity(w)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: theme.primary }}>
          <Activity className="h-3.5 w-3.5" /> Activity
          <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ transform: expanded === w.id ? 'rotate(180deg)' : 'none' }} />
        </button>
        {expanded === w.id && (
          <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
            {(runsByWf[w.id] || []).length === 0 ? (
              <div className="text-xs text-center py-6" style={{ color: theme.textMuted }}>No one has gone through this yet.</div>
            ) : (runsByWf[w.id] || []).map((run) => (
              <div key={run.id} className="flex items-center justify-between px-3 py-2 text-sm" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ color: theme.text }}>{maskPhone(run.contact_phone)}</span>
                <span className="text-xs" style={{ color: theme.textMuted }}>{fmtWhen(run.enrolled_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.text }}>
            <Zap className="h-6 w-6" style={{ color: theme.primary }} /> Automations
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Automatic text follow-ups for your customers after they call.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl" style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm" style={{ backgroundColor: notice.kind === 'ok' ? theme.hover : (theme.errorBg || theme.hover), color: notice.kind === 'ok' ? theme.text : theme.error, border: `1px solid ${theme.border}` }}>
          {notice.kind === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{notice.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.textMuted }} /></div>
      ) : error ? (
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: theme.error }} />
          <p className="text-sm mb-4" style={{ color: theme.textMuted }}>{error}</p>
          <button type="button" onClick={() => { setLoading(true); load(); }} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><RefreshCw className="h-4 w-4" /> Try again</button>
        </div>
      ) : (own.length === 0 && agencyWide.length === 0) ? (
        <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <Zap className="h-8 w-8 mx-auto mb-3" style={{ color: theme.textMuted }} />
          <p className="text-sm" style={{ color: theme.textMuted }}>Your agency hasn't set up any automations for you yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {own.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: theme.textMuted }}>Yours</h2>
              <div className="grid sm:grid-cols-2 gap-4">{own.map((w) => card(w, true))}</div>
            </div>
          )}
          {agencyWide.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: theme.textMuted }}>Set up by your agency</h2>
              <div className="grid sm:grid-cols-2 gap-4">{agencyWide.map((w) => card(w, false))}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
