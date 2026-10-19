'use client';

// ============================================================================
// /cc/agents - the call center's agent console.
//
// A native operations view (not the reseller team tab): a live roster of every
// agent with real presence (Available / Away / On a call / Offline), the
// businesses each one is assigned to, and how escalated calls reach them
// (in-browser over WebRTC, or rung at a phone number). Managers add agents,
// assign businesses, set routing, reveal the temp login, and remove agents
// inline. A test-pop tool fires a sample escalation so the screen-pop + claim
// can be verified before a real caller triggers one.
//
// Data: GET /api/agency/:id/team (agents) + GET /api/agency/:id/clients
// (business names) + GET /api/cc/:id/agents/presence (live, polled). Writes go
// to the same /team endpoints the reseller tab uses. Theme-aware (white-label).
// Managers only (the /cc layout confines agents away from here).
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Headset, Radio, Loader2, Send, UserPlus, Phone, Monitor, Trash2, ChevronDown,
  Check, Eye, EyeOff, Building2, X, AlertCircle, Users, Copy, RotateCcw,
  Smartphone, ExternalLink, Clock, Plus, Save, Zap, HelpCircle,
} from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';
import { CustomSelect, type DropdownUI } from '@/components/ui/custom-select';

const AGENT_PERMISSION_PRESET: Record<string, boolean> = {
  dashboard: true, clients: true, leads: false, outreach: false,
  analytics: false, marketing: false, settings: false, billing: false,
};

// A MANAGER runs the dashboard (not an agent who takes calls). Default: full
// dashboard access, but NOT the ability to manage the team (the owner grants
// that per manager with the toggle below).
const MANAGER_PERMISSION_PRESET: Record<string, boolean> = {
  dashboard: true, clients: true, analytics: true, settings: true, manage_team: false,
};
// The tabs + rights a manager's access is built from (shown as toggles).
const MANAGER_PERMISSION_ROWS: { key: string; label: string; desc: string }[] = [
  { key: 'dashboard', label: 'Dashboard', desc: 'The call-center overview' },
  { key: 'clients', label: 'Businesses', desc: 'View and edit the businesses you answer for' },
  { key: 'analytics', label: 'Analytics', desc: 'Call stats and reports' },
  { key: 'settings', label: 'Settings & branding', desc: 'Account settings, branding, API keys, webhooks' },
  { key: 'manage_team', label: 'Create & manage team', desc: 'Add, edit, and remove managers and agents' },
];

// The permission keys that actually gate a call-center agent's /cc access
// (requireAgencyAccess reads these). Shown as toggles in Manage.
const PERMISSION_ROWS: { key: string; label: string; desc: string }[] = [
  { key: 'dashboard', label: 'Live calls', desc: 'See and take escalated calls on the live board' },
  { key: 'clients', label: 'Businesses', desc: 'View the businesses they handle' },
  { key: 'settings', label: 'Edit business settings', desc: "Change a business's AI config, not just view it" },
  { key: 'analytics', label: 'Analytics', desc: 'Call stats and reports' },
];

interface Member {
  id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  visible_password: string | null;
  status: string;
  is_manager?: boolean;
  assigned_client_ids: string[] | null;
  call_delivery: 'browser' | 'phone';
  agent_phone: string | null;
  last_login: string | null;
  permissions?: Record<string, boolean> | null;
  availability_hours?: { enabled: boolean; override?: boolean; days: Record<string, { on: boolean; windows: { start: string; end: string }[] }> } | null;
}
interface Presence {
  memberUserId: string;
  status: string;
  busy: boolean;
  busyClientId: string | null;
  online: boolean;
}
interface Biz { id: string; business_name: string; }

function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}
function fmtPhone(p: string | null): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}

const DAY_DEFS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' }, { key: 'sun', label: 'Sun' },
];
const DOW_MAP: Record<string, string> = { Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat' };
const DEFAULT_HOURS = { enabled: true, override: false, days: Object.fromEntries(['mon','tue','wed','thu','fri','sat','sun'].map((k) => [k, { on: ['mon','tue','wed','thu','fri'].includes(k), windows: [{ start: '09:00', end: '17:00' }] }])) } as { enabled: boolean; override: boolean; days: Record<string, { on: boolean; windows: { start: string; end: string }[] }> };
function nowInTz(tz: string) {
  let parts;
  try { parts = new Intl.DateTimeFormat('en-US', { timeZone: tz || 'America/New_York', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()); }
  catch { parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()); }
  const wd = parts.find((x) => x.type === 'weekday')?.value || 'Mon';
  let H = parseInt(parts.find((x) => x.type === 'hour')?.value || '0', 10); if (H === 24) H = 0;
  const M = parseInt(parts.find((x) => x.type === 'minute')?.value || '0', 10);
  return { day: DOW_MAP[wd] || 'mon', minutes: H * 60 + M };
}
function hmMin(v: string): number | null { const m = /^(\d{1,2}):(\d{2})$/.exec(v || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
function onSchedule(ah: Member['availability_hours'], tz: string): boolean {
  if (!ah || ah.enabled !== true || !ah.days) return true;
  if ((ah as any).override === true) return true; // manager override
  const { day, minutes } = nowInTz(tz); const d: any = (ah.days as any)[day];
  if (!d || d.on !== true) return false;
  const wins: { start: string; end: string }[] = Array.isArray(d.windows) ? d.windows : ((d.start && d.end) ? [{ start: d.start, end: d.end }] : []);
  for (const w of wins) {
    const st = hmMin(w.start), en = hmMin(w.end);
    if (st == null || en == null) continue;
    if (en <= st ? (minutes >= st || minutes < en) : (minutes >= st && minutes < en)) return true;
  }
  return false;
}

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

// ----------------------------------------------------------------------------
// Test escalation pop (manager tool, unchanged behavior).
// ----------------------------------------------------------------------------
function TestEscalationPop({ agencyId, businesses, theme }: { agencyId: string; businesses: Biz[]; theme: ReturnType<typeof useTheme> }) {
  const [clientId, setClientId] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  useEffect(() => { if (businesses[0] && !clientId) setClientId(businesses[0].id); }, [businesses]);

  const send = async () => {
    if (!clientId) return;
    setSending(true); setResult(null);
    try {
      const r = await fetch(`${API()}/api/cc/${agencyId}/agents/test-offer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ clientId }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) setResult(d.offered > 0 ? `Sent to ${d.offered} available agent${d.offered === 1 ? '' : 's'}.` : (d.note || 'No available agents assigned to that business.'));
      else setResult(d.error || 'Could not send the test pop.');
    } catch { setResult('Could not send the test pop.'); }
    finally { setSending(false); }
  };
  if (businesses.length === 0) return null;
  return (
    <div className="mt-6 rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-2 mb-1"><Radio className="h-4 w-4" style={{ color: theme.primary }} /><h3 className="text-sm font-semibold" style={{ color: theme.text }}>Test the escalation pop</h3></div>
      <p className="text-[13px] mb-3" style={{ color: theme.textMuted }}>Fire a sample pop at the available agents assigned to a business. They see the same screen-pop a real escalation produces, with no live caller.</p>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1">
          <CustomSelect value={clientId} onChange={setClientId}
            options={businesses.map((b) => ({ value: b.id, label: b.business_name }))}
            ui={{ inputStyle: { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }, text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark }} />
        </div>
        <button onClick={send} disabled={sending || !clientId} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send test pop
        </button>
      </div>
      {result && <p className="text-[13px] mt-2.5" style={{ color: theme.textMuted }}>{result}</p>}
    </div>
  );
}

export default function CallCenterAgents() {
  const { agency, canManageTeam } = useAgency();
  const theme = useTheme();
  const agencyId = agency?.id || '';
  const tz = (agency as any)?.timezone || 'America/New_York';

  const [members, setMembers] = useState<Member[]>([]);
  const [clients, setClients] = useState<Biz[]>([]);
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [aName, setAName] = useState('');
  const [aEmail, setAEmail] = useState('');
  const [aPhone, setAPhone] = useState('');
  const [aDelivery, setADelivery] = useState<'browser' | 'phone'>('browser');
  const [aAgentPhone, setAAgentPhone] = useState('');
  const [aAssigned, setAAssigned] = useState<string[]>([]);
  const [aRole, setARole] = useState<'agent' | 'manager'>('agent');
  const [aManagerPerms, setAManagerPerms] = useState<Record<string, boolean>>({ ...MANAGER_PERMISSION_PRESET });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealPw, setRevealPw] = useState<Record<string, boolean>>({});
  const [helpOpen, setHelpOpen] = useState(false);

  const bizName = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.business_name])), [clients]);

  const loadTeam = useCallback(async () => {
    if (!agencyId) return;
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); if (d.success) setMembers((d.members || []).filter((m: Member) => m.is_manager === true || Array.isArray(m.assigned_client_ids))); }
    } catch { /* keep last good */ } finally { setLoading(false); }
  }, [agencyId]);

  const loadClients = useCallback(async () => {
    if (!agencyId) return;
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/clients`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); setClients((d.clients || []).map((c: any) => ({ id: c.id, business_name: c.business_name || 'Business' })).sort((a: Biz, b: Biz) => a.business_name.localeCompare(b.business_name))); }
    } catch { /* non-fatal */ }
  }, [agencyId]);

  const loadPresence = useCallback(async () => {
    if (!agencyId) return;
    try {
      const r = await fetch(`${API()}/api/cc/${agencyId}/agents/presence`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); if (d.success) setPresence(Object.fromEntries((d.agents || []).map((a: Presence) => [a.memberUserId, a]))); }
    } catch { /* presence is best-effort */ }
  }, [agencyId]);

  useEffect(() => { loadTeam(); loadClients(); }, [loadTeam, loadClients]);
  useEffect(() => { loadPresence(); const iv = setInterval(loadPresence, 15000); return () => clearInterval(iv); }, [loadPresence]);

  // Agents only: a call-center agent always has an assigned_client_ids array
  // (managers/owner have no team row). Note we already filtered in loadTeam.
  const isMgrRow = (m: Member) => m.is_manager === true;
  const agents = members.filter((m) => !isMgrRow(m));
  const managers = members.filter(isMgrRow);
  const onlineCount = agents.filter((m) => m.user_id && presence[m.user_id]?.online).length;
  const availableCount = agents.filter((m) => { const p = m.user_id ? presence[m.user_id] : null; return !!(p?.online && p.status === 'available' && !p.busy && onSchedule(m.availability_hours, tz)); }).length;

  const presenceOf = (m: Member) => (m.user_id ? presence[m.user_id] : null);
  const presenceView = (m: Member): { label: string; color: string; dot: boolean } => {
    const p = presenceOf(m);
    if (!p || !p.online) return { label: 'Offline', color: theme.textMuted, dot: false };
    if (p.busy) return { label: p.busyClientId && bizName[p.busyClientId] ? `On a call · ${bizName[p.busyClientId]}` : 'On a call', color: '#f59e0b', dot: true };
    if (p.status === 'available') {
      if (!onSchedule(m.availability_hours, tz)) return { label: 'Off hours', color: theme.textMuted, dot: true };
      return { label: 'Available', color: '#22c55e', dot: true };
    }
    return { label: 'Away', color: theme.textMuted, dot: true };
  };

  const addAgent = async () => {
    if (!aName.trim() || !aEmail.trim()) { setError('Name and email are required.'); return; }
    const asManager = aRole === 'manager';
    setAdding(true); setError(null); setSuccess(null);
    try {
      const body: any = {
        name: aName.trim(), email: aEmail.trim(), phone: aPhone.trim() || null,
        is_manager: asManager,
        permissions: asManager ? aManagerPerms : AGENT_PERMISSION_PRESET,
      };
      if (!asManager) {
        // Agent-only fields: which businesses they handle and how calls reach them.
        body.assigned_client_ids = aAssigned;
        body.call_delivery = aDelivery;
        body.agent_phone = aDelivery === 'phone' ? (aAgentPhone.trim() || null) : null;
      }
      const r = await fetch(`${API()}/api/agency/${agencyId}/team`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Failed to add ${asManager ? 'manager' : 'agent'}`);
      setMembers((prev) => [...prev, { ...d.member, user_id: d.member.user_id || null, assigned_client_ids: d.member.assigned_client_ids || [] }]);
      setSuccess(`${d.member.display_name} added as ${asManager ? 'a manager' : 'an agent'}.${aPhone ? ' Credentials sent by SMS.' : ' Reveal the temp password on their card to share it.'}`);
      setExpandedId(d.member.id); setRevealPw((p) => ({ ...p, [d.member.id]: true }));
      setAName(''); setAEmail(''); setAPhone(''); setADelivery('browser'); setAAgentPhone(''); setAAssigned([]); setARole('agent'); setAManagerPerms({ ...MANAGER_PERMISSION_PRESET }); setShowAdd(false);
      setTimeout(() => setSuccess(null), 6000);
    } catch (e: any) { setError(e.message || 'Failed to add team member'); }
    finally { setAdding(false); }
  };

  const removeAgent = async (m: Member) => {
    if (!confirm(`Remove ${m.display_name}? They lose access immediately.`)) return;
    const prev = members;
    setMembers((list) => list.filter((x) => x.id !== m.id));
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (!r.ok) throw new Error();
    } catch { setMembers(prev); setError('Could not remove the agent.'); }
  };

  const toggleAssignment = async (m: Member, clientId: string) => {
    const current = Array.isArray(m.assigned_client_ids) ? m.assigned_client_ids : [];
    const next = current.includes(clientId) ? current.filter((id) => id !== clientId) : [...current, clientId];
    setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, assigned_client_ids: next } : x)));
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ assigned_client_ids: next }),
      });
      if (!r.ok) throw new Error();
    } catch { setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, assigned_client_ids: current } : x))); setError('Could not update assigned businesses.'); }
  };

  const setDelivery = async (m: Member, call_delivery: 'browser' | 'phone', agent_phone?: string) => {
    const prevD = m.call_delivery; const prevP = m.agent_phone;
    const phone = call_delivery === 'phone' ? (agent_phone ?? m.agent_phone ?? '') : null;
    setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, call_delivery, agent_phone: phone } : x)));
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ call_delivery, agent_phone: phone }),
      });
      if (!r.ok) throw new Error();
    } catch { setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, call_delivery: prevD, agent_phone: prevP } : x))); setError('Could not update call routing.'); }
  };

  const [copied, setCopied] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);

  // Branded login URL agents use (custom domain if verified, else the subdomain).
  const ax = agency as any;
  const loginUrl = ax?.marketing_domain && ax?.domain_verified
    ? `https://${ax.marketing_domain}/agency/login`
    : `https://${ax?.slug || 'app'}.myvoiceaiconnect.com/agency/login`;

  const copyText = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500); } catch { setError('Copy failed. Select and copy it manually.'); }
  };

  const resetPassword = async (m: Member) => {
    if (!confirm(`Reset ${m.display_name}'s password? Their current one stops working immediately.`)) return;
    setResetting(m.id); setError(null);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify({}) });
      const d = await r.json();
      if (r.ok && d.success) { setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, visible_password: d.visible_password } : x))); setRevealPw((pw) => ({ ...pw, [m.id]: true })); setSuccess('New password generated. Reveal and share it.'); setTimeout(() => setSuccess(null), 6000); }
      else setError(d.error || 'Could not reset the password.');
    } catch { setError('Could not reset the password.'); }
    finally { setResetting(null); }
  };

  const updatePhone = async (m: Member, phone: string) => {
    const next = phone.trim() || null;
    if ((next || '') === (m.phone || '')) return;
    const prev = m.phone;
    setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, phone: next } : x)));
    try { const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify({ phone: next }) }); if (!r.ok) throw new Error(); }
    catch { setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, phone: prev } : x))); setError('Could not update the contact number.'); }
  };

  const togglePermission = async (m: Member, key: string) => {
    const cur = (m.permissions && typeof m.permissions === 'object') ? m.permissions : {};
    const next = { ...cur, [key]: !cur[key] };
    setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, permissions: next } : x)));
    try { const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify({ permissions: next }) }); if (!r.ok) throw new Error(); }
    catch { setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, permissions: cur } : x))); setError('Could not update permissions.'); }
  };

  // Working hours edit as a per-agent DRAFT, committed by an explicit Save.
  const [hoursDraft, setHoursDraft] = useState<Record<string, any>>({});
  const [hoursSaving, setHoursSaving] = useState<string | null>(null);
  const [hoursSaved, setHoursSaved] = useState<string | null>(null);
  const effHours = (m: Member): any => (hoursDraft[m.id] !== undefined ? hoursDraft[m.id] : (m.availability_hours || null));
  const hoursDirty = (m: Member) => hoursDraft[m.id] !== undefined && JSON.stringify(hoursDraft[m.id] || null) !== JSON.stringify(m.availability_hours || null);
  const setDraft = (m: Member, next: any) => setHoursDraft((d) => ({ ...d, [m.id]: next }));
  const curHours = (m: Member): any => { const e = effHours(m); return (e && e.enabled) ? e : DEFAULT_HOURS; };
  const patchDay = (m: Member, key: string, dayNext: { on: boolean; windows: { start: string; end: string }[] }) => {
    const cur = curHours(m);
    setDraft(m, { enabled: true, override: cur.override === true, days: { ...cur.days, [key]: dayNext } });
  };
  const setDayOn = (m: Member, key: string, on: boolean) => {
    const d = curHours(m).days?.[key] || { on: false, windows: [{ start: '09:00', end: '17:00' }] };
    patchDay(m, key, { on, windows: (d.windows && d.windows.length) ? d.windows : [{ start: '09:00', end: '17:00' }] });
  };
  const setWindow = (m: Member, key: string, idx: number, patch: Partial<{ start: string; end: string }>) => {
    const d = curHours(m).days?.[key] || { on: true, windows: [] as any[] };
    const wins = [...(d.windows || [])]; wins[idx] = { ...wins[idx], ...patch };
    patchDay(m, key, { on: true, windows: wins });
  };
  const addWindow = (m: Member, key: string) => {
    const d = curHours(m).days?.[key] || { on: true, windows: [] as any[] };
    patchDay(m, key, { on: true, windows: [...(d.windows || []), { start: '13:00', end: '17:00' }] });
  };
  const removeWindow = (m: Member, key: string, idx: number) => {
    const d = curHours(m).days?.[key] || { on: true, windows: [] as any[] };
    const wins = (d.windows || []).filter((_: any, i: number) => i !== idx);
    patchDay(m, key, { on: true, windows: wins.length ? wins : [{ start: '09:00', end: '17:00' }] });
  };
  const setMasterHours = (m: Member, on: boolean) => {
    const e = effHours(m);
    setDraft(m, on ? (e && e.days ? { ...e, enabled: true } : DEFAULT_HOURS) : { ...(e || DEFAULT_HOURS), enabled: false });
  };
  const saveHours = async (m: Member) => {
    const next = hoursDraft[m.id];
    if (next === undefined) return;
    setHoursSaving(m.id); setError(null);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify({ availability_hours: next }) });
      if (!r.ok) throw new Error();
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, availability_hours: next } : x)));
      setHoursDraft((d) => { const c = { ...d }; delete c[m.id]; return c; });
      setHoursSaved(m.id); setTimeout(() => setHoursSaved((sv) => (sv === m.id ? null : sv)), 3000);
    } catch { setError('Could not save working hours.'); }
    finally { setHoursSaving(null); }
  };
  // "Make active now": flip the agent's schedule-override so they are offered
  // calls regardless of their working hours. Saves immediately (no draft/Save
  // step, so it works as a quick control), and if the hours editor is open with
  // unsaved day edits, syncs ONLY the override flag onto that draft so the two
  // never disagree, without persisting the unsaved day edits.
  const toggleActiveNow = async (m: Member) => {
    const saved: any = (m.availability_hours && (m.availability_hours as any).days) ? m.availability_hours : DEFAULT_HOURS;
    const nextOverride = !(saved.override === true);
    const next = { ...saved, enabled: saved.enabled !== false, override: nextOverride };
    const prev = m.availability_hours;
    setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, availability_hours: next } : x)));
    setHoursDraft((d) => (d[m.id] !== undefined ? { ...d, [m.id]: { ...d[m.id], override: nextOverride } } : d));
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify({ availability_hours: next }) });
      if (!r.ok) throw new Error();
    } catch {
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, availability_hours: prev } : x)));
      setError('Could not update active override.');
    }
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const Label = ({ children }: { children: React.ReactNode }) => (<label className="block text-[12px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>);
  const Switch = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick} className="relative rounded-full flex-shrink-0 transition-colors" style={{ backgroundColor: on ? theme.primary : theme.hover, width: '2.5rem', height: '1.5rem' }}>
      <span className="absolute rounded-full bg-white shadow-sm transition-all" style={{ width: '1.125rem', height: '1.125rem', top: '0.1875rem', left: on ? 'calc(100% - 1.3125rem)' : '0.1875rem' }} />
    </button>
  );

  // Belt-and-suspenders: the /cc layout already confines anyone without the
  // manage-team right away from here, but guard the surface itself too so the
  // roster never flashes for a manager who lacks the permission.
  if (agency && !canManageTeam) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div className="rounded-2xl p-8 max-w-sm text-center" style={{ border: `1px solid ${theme.border}` }}>
          <Users className="h-8 w-8 mx-auto mb-3" style={{ color: theme.textSubtle }} />
          <p className="text-sm font-semibold" style={{ color: theme.text }}>Team management is restricted</p>
          <p className="text-[13px] mt-1.5" style={{ color: theme.textMuted }}>You don&apos;t have permission to add or manage the team. Ask the account owner if you need access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Headset className="h-5 w-5" style={{ color: theme.primary }} /></div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Team</h1>
            <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>
              {managers.length > 0 && <>{managers.length} {managers.length === 1 ? 'manager' : 'managers'} · </>}{agents.length} {agents.length === 1 ? 'agent' : 'agents'} · <span style={{ color: '#22c55e' }}>{availableCount} available</span> · {onlineCount} online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setHelpOpen((s) => !s)} aria-label="How agent availability works" title="How agent availability works" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium" style={{ backgroundColor: helpOpen ? theme.primary15 : theme.hover, color: helpOpen ? theme.primary : theme.textMuted }}>
            <HelpCircle className="h-4 w-4" /> <span className="hidden sm:inline">How this works</span>
          </button>
          <button onClick={() => { setShowAdd((s) => !s); setError(null); }} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Add teammate</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Help: what actually decides whether an agent gets a call. */}
      {helpOpen && (
        <div className="mb-5 rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary}40` }}>
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <h2 className="text-sm font-semibold inline-flex items-center gap-2" style={{ color: theme.text }}><HelpCircle className="h-4 w-4" style={{ color: theme.primary }} /> How an agent gets a call</h2>
            <button onClick={() => setHelpOpen(false)} style={{ color: theme.textMuted }} aria-label="Close help"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-2.5 text-[12.5px] leading-relaxed" style={{ color: theme.textMuted }}>
            <p><span className="font-semibold" style={{ color: theme.text }}>Online + Available</span> is what makes an agent reachable. An agent is only offered an escalated call when their console is open (online) and they have set themselves Available. Closing their tabs makes them go Offline on their own.</p>
            <p><span className="font-semibold" style={{ color: theme.text }}>Working hours</span> sit on top of that: when set, an online, Available agent is offered calls only during those hours. Outside them they are skipped, and the call goes to other available agents, then your overflow action. Hours do not make anyone active on their own, and they apply the same whether calls ring in-browser or on a phone.</p>
            <p><span className="font-semibold" style={{ color: theme.text }}>Make active now</span> (in Manage) overrides the hours, so the agent is offered calls regardless of schedule, until you turn it off. They still need to be online and Available.</p>
            <p><span className="font-semibold" style={{ color: theme.text }}>Call routing</span> (in-browser or ring a phone) only decides how a chosen agent is reached, a screen-pop in their browser, or a call to their number. It does not change when they are offered calls.</p>
          </div>
        </div>
      )}

      {success && <div className="mb-4 rounded-xl px-4 py-3 text-[13px]" style={{ backgroundColor: `${theme.primary}12`, border: `1px solid ${theme.primary}40`, color: theme.primary }}>{success}</div>}
      {error && <div className="mb-4 rounded-xl px-4 py-3 text-[13px] flex items-center gap-2" style={{ backgroundColor: `${theme.error}12`, border: `1px solid ${theme.error}40`, color: theme.error }}><AlertCircle className="h-4 w-4" /> {error}</div>}

      {/* Add agent form */}
      {showAdd && (
        <div className="mb-5 rounded-2xl p-5 sm:p-6" style={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: theme.text }}>New {aRole === 'manager' ? 'manager' : 'agent'}</h2>
            <button onClick={() => setShowAdd(false)} style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>
          </div>

          {/* Role: agent (takes calls) vs manager (runs the dashboard). */}
          <div className="mb-4">
            <Label>Role</Label>
            <div className="grid grid-cols-2 gap-2">
              {([['agent', 'Agent', 'Takes escalated calls, scoped to assigned businesses', Headset], ['manager', 'Manager', 'Runs the dashboard, no live calls', Users]] as const).map(([v, lbl, sub, Icon]) => (
                <button key={v} onClick={() => setARole(v)} className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-left transition-colors" style={aRole === v ? { backgroundColor: theme.primary15, border: `1px solid ${theme.primary}55` } : { backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
                  <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: aRole === v ? theme.primary : theme.textMuted }} />
                  <span className="min-w-0"><span className="block text-[13px] font-medium" style={{ color: aRole === v ? theme.primary : theme.text }}>{lbl}</span><span className="block text-[11px]" style={{ color: theme.textMuted }}>{sub}</span></span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Name</Label><input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Jordan Diaz" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Email (their login)</Label><input type="email" value={aEmail} onChange={(e) => setAEmail(e.target.value)} placeholder="jordan@callcenter.com" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div className="sm:col-span-2"><Label>Mobile (optional)</Label><input type="tel" value={aPhone} onChange={(e) => setAPhone(e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /><p className="mt-1 text-[11px] leading-snug" style={{ color: theme.textMuted }}>If you add a number, we text them their login details. Otherwise reveal the temp password on their card to share it.</p></div>
          </div>

          {aRole === 'agent' ? (
            <>
              <div className="mt-4">
                <Label>How escalated calls reach them</Label>
                <div className="flex gap-2">
                  {([['browser', 'In browser', Monitor], ['phone', 'Ring a phone', Phone]] as const).map(([v, lbl, Icon]) => (
                    <button key={v} onClick={() => setADelivery(v)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-medium" style={aDelivery === v ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.hover, color: theme.textMuted }}><Icon className="h-3.5 w-3.5" /> {lbl}</button>
                  ))}
                </div>
                {aDelivery === 'phone' && <div className="mt-3"><Label>Agent phone (where escalations ring)</Label><input type="tel" value={aAgentPhone} onChange={(e) => setAAgentPhone(e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>}
              </div>
              <div className="mt-4">
                <Label>Assigned businesses ({aAssigned.length} selected)</Label>
                {clients.length === 0 ? (
                  <p className="text-[12px]" style={{ color: theme.textSubtle }}>No businesses yet. Add one first, then assign it here.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {clients.map((c) => {
                      const on = aAssigned.includes(c.id);
                      return <button key={c.id} onClick={() => setAAssigned((p) => on ? p.filter((x) => x !== c.id) : [...p, c.id])} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium" style={on ? { backgroundColor: theme.primary15, color: theme.primary, border: `1px solid ${theme.primary}55` } : { backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid ${theme.border}` }}>{on && <Check className="h-3 w-3" />}{c.business_name}</button>;
                    })}
                  </div>
                )}
                <p className="text-[11.5px] mt-1.5" style={{ color: theme.textSubtle }}>An agent only sees and handles calls for the businesses you assign. Change anytime.</p>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <Label>What this manager can access</Label>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
                {MANAGER_PERMISSION_ROWS.map((pr, i) => {
                  const on = aManagerPerms[pr.key] !== false;
                  const critical = pr.key === 'manage_team';
                  return (
                    <div key={pr.key} className="flex items-center justify-between gap-3 px-3 py-2.5" style={{ ...(i > 0 ? { borderTop: `1px solid ${theme.borderSubtle}` } : {}), ...(critical ? { backgroundColor: theme.primary15 } : {}) }}>
                      <div className="min-w-0"><p className="text-[13px] font-medium" style={{ color: theme.text }}>{pr.label}</p><p className="text-[11px]" style={{ color: theme.textMuted }}>{pr.desc}</p></div>
                      <Switch on={on} onClick={() => setAManagerPerms((p) => ({ ...p, [pr.key]: !on }))} />
                    </div>
                  );
                })}
              </div>
              <p className="text-[11.5px] mt-1.5" style={{ color: theme.textSubtle }}>A manager runs the dashboard and never takes calls. Turn on "Create & manage team" to let them add and manage other managers and agents.</p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button onClick={addAgent} disabled={adding} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add {aRole === 'manager' ? 'manager' : 'agent'}</button>
          </div>
        </div>
      )}

      {/* Roster */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading team...</div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl py-14 flex flex-col items-center justify-center text-center" style={{ border: `1px dashed ${theme.border}` }}>
          <Users className="h-8 w-8 mb-2.5" style={{ color: theme.textSubtle }} />
          <p className="text-sm font-medium" style={{ color: theme.text }}>No team members yet</p>
          <p className="text-[13px] mt-1" style={{ color: theme.textMuted }}>Add a manager to help run the dashboard, or an agent to take escalated calls.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...managers, ...agents].map((m) => {
            const isMgr = m.is_manager === true;
            const pv = presenceView(m);
            const assigned = Array.isArray(m.assigned_client_ids) ? m.assigned_client_ids : [];
            const expanded = expandedId === m.id;
            const schedEnabled = !!(m.availability_hours && m.availability_hours.enabled);
            const ovOn = !!(m.availability_hours && m.availability_hours.override);
            return (
              <div key={m.id} className="rounded-2xl overflow-hidden" style={card}>
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 text-sm font-semibold" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{initials(m.display_name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{m.display_name}</p>
                      {isMgr
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: theme.primary15, color: theme.primary }}><Users className="h-2.5 w-2.5" /> Manager{m.permissions?.manage_team ? ' · can manage team' : ''}</span>
                        : <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Agent</span>}
                      {!isMgr && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                          {pv.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pv.color }} />}
                          <span style={{ color: pv.color }}>{pv.label}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] truncate" style={{ color: theme.textMuted }}>{isMgr ? (m.email || 'No email') + ' · runs the dashboard' : `${m.email || 'No email'} · ${m.call_delivery === 'phone' ? `calls ring ${fmtPhone(m.agent_phone) || 'their phone'}` : 'calls ring in-browser'} · ${assigned.length} ${assigned.length === 1 ? 'business' : 'businesses'}`}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!isMgr && ovOn && (
                      <span title="Active override is on: this agent is offered calls regardless of their working hours. Change it under Manage." className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: theme.primary15, color: theme.primary }}><Zap className="h-3 w-3" /> Active</span>
                    )}
                    <button onClick={() => setExpandedId(expanded ? null : m.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Manage <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} /></button>
                    <button onClick={() => removeAgent(m)} className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px]" style={{ backgroundColor: theme.hover, color: theme.error }} title={isMgr ? 'Remove manager' : 'Remove agent'}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                {expanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 space-y-5" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                    {/* Login & access */}
                    <div className="pt-4">
                      <Label>Login &amp; access</Label>
                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
                        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-[11px]" style={{ color: theme.textMuted }}>Login page</p>
                            <p className="text-[13px] truncate" style={{ color: theme.text }}>{loginUrl}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <a href={loginUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px]" style={{ backgroundColor: theme.hover, color: theme.textMuted }} title="Open"><ExternalLink className="h-3.5 w-3.5" /></a>
                            <button onClick={() => copyText(`url-${m.id}`, loginUrl)} className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px]" style={{ backgroundColor: theme.hover, color: copied === `url-${m.id}` ? '#22c55e' : theme.textMuted }} title="Copy">{copied === `url-${m.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 px-3 py-2.5" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                          <div className="min-w-0">
                            <p className="text-[11px]" style={{ color: theme.textMuted }}>Email</p>
                            <p className="text-[13px] truncate" style={{ color: theme.text }}>{m.email || '—'}</p>
                          </div>
                          {m.email && <button onClick={() => copyText(`email-${m.id}`, m.email!)} className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px] flex-shrink-0" style={{ backgroundColor: theme.hover, color: copied === `email-${m.id}` ? '#22c55e' : theme.textMuted }} title="Copy">{copied === `email-${m.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>}
                        </div>
                        <div className="flex items-center justify-between gap-3 px-3 py-2.5" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                          <div className="min-w-0">
                            <p className="text-[11px]" style={{ color: theme.textMuted }}>Temp password</p>
                            <p className="text-[13px] font-mono truncate" style={{ color: theme.text }}>{m.visible_password ? (revealPw[m.id] ? m.visible_password : '••••••••') : 'Set by the agent'}</p>
                          </div>
                          {m.visible_password && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button onClick={() => setRevealPw((pw) => ({ ...pw, [m.id]: !pw[m.id] }))} className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px]" style={{ backgroundColor: theme.hover, color: theme.textMuted }} title={revealPw[m.id] ? 'Hide' : 'Reveal'}>{revealPw[m.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                              <button onClick={() => copyText(`pw-${m.id}`, m.visible_password!)} className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px]" style={{ backgroundColor: theme.hover, color: copied === `pw-${m.id}` ? '#22c55e' : theme.textMuted }} title="Copy">{copied === `pw-${m.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        {m.visible_password && m.email && (
                          <button onClick={() => copyText(`all-${m.id}`, `Login: ${loginUrl}\nEmail: ${m.email}\nPassword: ${m.visible_password}`)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                            {copied === `all-${m.id}` ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy login details</>}
                          </button>
                        )}
                        <button onClick={() => resetPassword(m)} disabled={resetting === m.id} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold disabled:opacity-60" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
                          {resetting === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Reset password
                        </button>
                      </div>
                      <p className="text-[11px] mt-1.5" style={{ color: theme.textSubtle }}>{m.last_login ? `Last signed in ${new Date(m.last_login).toLocaleDateString()}` : "Hasn't signed in yet."}</p>
                    </div>

                    {/* Contact mobile */}
                    <div>
                      <Label>Contact mobile</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textSubtle }} />
                        <input defaultValue={m.phone || ''} onBlur={(e) => updatePhone(m, e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" style={field} />
                      </div>
                      <p className="text-[11px] mt-1.5" style={{ color: theme.textSubtle }}>Where we text their login details. This is not where calls ring, set that under Call routing.</p>
                    </div>

                    {/* Manager access (managers run the dashboard, no call routing). */}
                    {isMgr && (
                      <div>
                        <Label>What this manager can access</Label>
                        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
                          {MANAGER_PERMISSION_ROWS.map((pr, i) => {
                            const on = !!(m.permissions && m.permissions[pr.key]);
                            const critical = pr.key === 'manage_team';
                            return (
                              <div key={pr.key} className="flex items-center justify-between gap-3 px-3 py-2.5" style={{ ...(i > 0 ? { borderTop: `1px solid ${theme.borderSubtle}` } : {}), ...(critical ? { backgroundColor: theme.primary15 } : {}) }}>
                                <div className="min-w-0"><p className="text-[13px] font-medium" style={{ color: theme.text }}>{pr.label}</p><p className="text-[11px]" style={{ color: theme.textMuted }}>{pr.desc}</p></div>
                                <Switch on={on} onClick={() => togglePermission(m, pr.key)} />
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[11px] mt-1.5" style={{ color: theme.textSubtle }}>"Create & manage team" lets this manager add and manage other managers and agents. Turn tabs off to hide them from this manager's dashboard.</p>
                      </div>
                    )}

                    {/* Agent-only controls: call routing, call permissions, assignments, hours. */}
                    {!isMgr && (<>
                    {/* Call routing */}
                    <div>
                      <Label>Call routing</Label>
                      <div className="flex gap-2 mb-2">
                        {([['browser', 'In browser', Monitor], ['phone', 'Ring a phone', Phone]] as const).map(([v, lbl, Icon]) => (
                          <button key={v} onClick={() => setDelivery(m, v)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium" style={m.call_delivery === v ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.hover, color: theme.textMuted }}><Icon className="h-3.5 w-3.5" /> {lbl}</button>
                        ))}
                      </div>
                      {m.call_delivery === 'phone' && (
                        <input defaultValue={m.agent_phone || ''} onBlur={(e) => { if ((e.target.value || '') !== (m.agent_phone || '')) setDelivery(m, 'phone', e.target.value); }} placeholder="(555) 555-5555 (where escalations ring)" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
                      )}
                    </div>

                    {/* Permissions */}
                    <div>
                      <Label>Permissions</Label>
                      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
                        {PERMISSION_ROWS.map((pr, i) => {
                          const on = !!(m.permissions && m.permissions[pr.key]);
                          return (
                            <div key={pr.key} className="flex items-center justify-between gap-3 px-3 py-2.5" style={i > 0 ? { borderTop: `1px solid ${theme.borderSubtle}` } : undefined}>
                              <div className="min-w-0"><p className="text-[13px] font-medium" style={{ color: theme.text }}>{pr.label}</p><p className="text-[11px]" style={{ color: theme.textMuted }}>{pr.desc}</p></div>
                              <Switch on={on} onClick={() => togglePermission(m, pr.key)} />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Assigned businesses */}
                    <div>
                      <Label>Assigned businesses ({assigned.length})</Label>
                      {clients.length === 0 ? (
                        <p className="text-[12px]" style={{ color: theme.textSubtle }}>No businesses yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                          {clients.map((c) => {
                            const on = assigned.includes(c.id);
                            return <button key={c.id} onClick={() => toggleAssignment(m, c.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium" style={on ? { backgroundColor: theme.primary15, color: theme.primary, border: `1px solid ${theme.primary}55` } : { backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid ${theme.border}` }}>{on && <Check className="h-3 w-3" />}{c.business_name}</button>;
                          })}
                        </div>
                      )}
                      <p className="text-[11px] mt-1.5" style={{ color: theme.textSubtle }}>An agent only handles calls for the businesses you assign here.</p>
                    </div>

                    {/* Availability (live) + "make active now" override */}
                    <div>
                      <Label>Availability</Label>
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                        {pv.dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pv.color }} />}
                        <span className="text-[13px] font-medium" style={{ color: pv.color }}>{pv.label}</span>
                      </div>
                      <p className="text-[11px] mt-1.5" style={{ color: theme.textSubtle }}>Live status, set by the agent in their own console. They are only offered a call when online and Available{schedEnabled ? ', and inside their working hours below, unless you make them active now' : ''}.</p>

                      {schedEnabled ? (
                        <div className="mt-2.5 rounded-xl p-3" style={{ border: `1px solid ${ovOn ? theme.primary + '55' : theme.inputBorder}`, backgroundColor: ovOn ? theme.primary15 : 'transparent' }}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex items-start gap-2">
                              <Zap className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: ovOn ? theme.primary : theme.textMuted }} />
                              <div>
                                <p className="text-[13px] font-medium" style={{ color: theme.text }}>Make active now</p>
                                <p className="text-[11px]" style={{ color: theme.textMuted }}>{ovOn ? 'On: offered calls regardless of the working hours below. They still need to be online (console open) and Available.' : 'Off: offered calls only inside their working hours below.'}</p>
                              </div>
                            </div>
                            <button onClick={() => toggleActiveNow(m)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold flex-shrink-0 transition-colors" style={ovOn ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.hover, color: theme.text }}>
                              <Zap className="h-3.5 w-3.5" /> {ovOn ? 'Active now' : 'Make active'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] mt-2" style={{ color: theme.textSubtle }}>No working hours set, so this agent is offered calls whenever they are online and Available. Turn on working hours below to limit that to a schedule.</p>
                      )}
                    </div>

                    {/* Working hours */}
                    <div>
                      <Label>Working hours</Label>
                      {(() => {
                        const eff = effHours(m);
                        const hoursOn = !!(eff && eff.enabled);
                        return (
                          <div className="rounded-xl p-3" style={{ border: `1px solid ${theme.inputBorder}` }}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex items-start gap-2">
                                <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: hoursOn ? theme.primary : theme.textMuted }} />
                                <div><p className="text-[13px] font-medium" style={{ color: theme.text }}>Set specific hours</p><p className="text-[11px]" style={{ color: theme.textMuted }}>{hoursOn ? 'Only offered calls during these hours.' : 'Off: available whenever they are online.'}</p></div>
                              </div>
                              <Switch on={hoursOn} onClick={() => setMasterHours(m, !hoursOn)} />
                            </div>
                            {hoursOn && (
                              <div className="mt-3 space-y-2.5">
                                {eff?.override && (
                                  <div className="rounded-lg px-3 py-2 mb-1.5 text-[11.5px]" style={{ backgroundColor: theme.primary15, color: theme.primary }}>Active override is on, this agent is offered calls regardless of the hours below.</div>
                                )}
                                {DAY_DEFS.map((dd) => {
                                  const d: any = (eff?.days?.[dd.key]) || { on: false, windows: [{ start: '09:00', end: '17:00' }] };
                                  const wins: { start: string; end: string }[] = (d.windows && d.windows.length) ? d.windows : [{ start: '09:00', end: '17:00' }];
                                  return (
                                    <div key={dd.key}>
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => setDayOn(m, dd.key, !d.on)} className="min-w-[52px] inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-[12px] font-medium" style={d.on ? { backgroundColor: theme.primary15, color: theme.primary } : { backgroundColor: theme.hover, color: theme.textMuted }}>{dd.label}</button>
                                        {!d.on && <span className="text-[12px]" style={{ color: theme.textSubtle }}>Off</span>}
                                      </div>
                                      {d.on && (
                                        <div className="mt-1.5 ml-2 space-y-1.5">
                                          {wins.map((w, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                              <input type="time" value={w.start} onChange={(e) => setWindow(m, dd.key, idx, { start: e.target.value })} className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-[13px] outline-none" style={field} />
                                              <span className="text-[13px] flex-shrink-0" style={{ color: theme.textMuted }}>to</span>
                                              <input type="time" value={w.end} onChange={(e) => setWindow(m, dd.key, idx, { end: e.target.value })} className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-[13px] outline-none" style={field} />
                                              {wins.length > 1 && <button onClick={() => removeWindow(m, dd.key, idx)} className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px] flex-shrink-0" style={{ color: theme.textMuted }} title="Remove block"><X className="h-3.5 w-3.5" /></button>}
                                            </div>
                                          ))}
                                          <button onClick={() => addWindow(m, dd.key)} className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: theme.primary }}><Plus className="h-3 w-3" /> Add a break / second block</button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                <p className="text-[11px] mt-1.5" style={{ color: theme.textSubtle }}>Times are in {tz.replace(/_/g, ' ')} (your agency timezone). A day can have more than one block, the gap between blocks (say 12 to 1) is their break. Outside these hours the agent is skipped, and the call falls to other available agents, then your overflow action. To offer them calls regardless of these hours, use <span className="font-medium" style={{ color: theme.textMuted }}>Make active now</span> under Availability above.</p>
                              </div>
                            )}
                            {(hoursDirty(m) || hoursSaved === m.id) && (
                              <div className="flex items-center justify-end gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                                {hoursSaved === m.id
                                  ? <span className="text-[12px] mr-auto inline-flex items-center gap-1.5" style={{ color: '#22c55e' }}><Check className="h-3.5 w-3.5" /> Saved</span>
                                  : <span className="text-[12px] mr-auto" style={{ color: theme.textMuted }}>Unsaved changes</span>}
                                <button onClick={() => saveHours(m)} disabled={hoursSaving === m.id || !hoursDirty(m)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                                  {hoursSaving === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save hours
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    </>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TestEscalationPop agencyId={agencyId} businesses={clients} theme={theme} />
    </div>
  );
}