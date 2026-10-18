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
  Check, Eye, EyeOff, Building2, X, AlertCircle, Users,
} from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';
import { CustomSelect, type DropdownUI } from '@/components/ui/custom-select';

const AGENT_PERMISSION_PRESET: Record<string, boolean> = {
  dashboard: true, clients: true, leads: false, outreach: false,
  analytics: false, marketing: false, settings: false, billing: false,
};

interface Member {
  id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  visible_password: string | null;
  status: string;
  assigned_client_ids: string[] | null;
  call_delivery: 'browser' | 'phone';
  agent_phone: string | null;
  last_login: string | null;
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
  const { agency } = useAgency();
  const theme = useTheme();
  const agencyId = agency?.id || '';

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

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealPw, setRevealPw] = useState<Record<string, boolean>>({});

  const bizName = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.business_name])), [clients]);

  const loadTeam = useCallback(async () => {
    if (!agencyId) return;
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); if (d.success) setMembers((d.members || []).filter((m: Member) => Array.isArray(m.assigned_client_ids))); }
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
  const agents = members;
  const onlineCount = agents.filter((m) => m.user_id && presence[m.user_id]?.online).length;
  const availableCount = agents.filter((m) => { const p = m.user_id ? presence[m.user_id] : null; return p?.online && p.status === 'available' && !p.busy; }).length;

  const presenceOf = (m: Member) => (m.user_id ? presence[m.user_id] : null);
  const presenceView = (m: Member): { label: string; color: string; dot: boolean } => {
    const p = presenceOf(m);
    if (!p || !p.online) return { label: 'Offline', color: theme.textMuted, dot: false };
    if (p.busy) return { label: p.busyClientId && bizName[p.busyClientId] ? `On a call · ${bizName[p.busyClientId]}` : 'On a call', color: '#f59e0b', dot: true };
    if (p.status === 'available') return { label: 'Available', color: '#22c55e', dot: true };
    return { label: 'Away', color: theme.textMuted, dot: true };
  };

  const addAgent = async () => {
    if (!aName.trim() || !aEmail.trim()) { setError('Name and email are required.'); return; }
    setAdding(true); setError(null); setSuccess(null);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({
          name: aName.trim(), email: aEmail.trim(), phone: aPhone.trim() || null,
          permissions: AGENT_PERMISSION_PRESET,
          assigned_client_ids: aAssigned,
          call_delivery: aDelivery,
          agent_phone: aDelivery === 'phone' ? (aAgentPhone.trim() || null) : null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to add agent');
      setMembers((prev) => [...prev, { ...d.member, user_id: d.member.user_id || null, assigned_client_ids: d.member.assigned_client_ids || [] }]);
      setSuccess(`${d.member.display_name} added.${aPhone ? ' Credentials sent by SMS.' : ' Reveal the temp password on their card to share it.'}`);
      setExpandedId(d.member.id); setRevealPw((p) => ({ ...p, [d.member.id]: true }));
      setAName(''); setAEmail(''); setAPhone(''); setADelivery('browser'); setAAgentPhone(''); setAAssigned([]); setShowAdd(false);
      setTimeout(() => setSuccess(null), 6000);
    } catch (e: any) { setError(e.message || 'Failed to add agent'); }
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

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const Label = ({ children }: { children: React.ReactNode }) => (<label className="block text-[12px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Headset className="h-5 w-5" style={{ color: theme.primary }} /></div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Agents</h1>
            <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>
              {agents.length} {agents.length === 1 ? 'agent' : 'agents'} · <span style={{ color: '#22c55e' }}>{availableCount} available</span> · {onlineCount} online
            </p>
          </div>
        </div>
        <button onClick={() => { setShowAdd((s) => !s); setError(null); }} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Add agent</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      {success && <div className="mb-4 rounded-xl px-4 py-3 text-[13px]" style={{ backgroundColor: `${theme.primary}12`, border: `1px solid ${theme.primary}40`, color: theme.primary }}>{success}</div>}
      {error && <div className="mb-4 rounded-xl px-4 py-3 text-[13px] flex items-center gap-2" style={{ backgroundColor: `${theme.error}12`, border: `1px solid ${theme.error}40`, color: theme.error }}><AlertCircle className="h-4 w-4" /> {error}</div>}

      {/* Add agent form */}
      {showAdd && (
        <div className="mb-5 rounded-2xl p-5 sm:p-6" style={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: theme.text }}>New agent</h2>
            <button onClick={() => setShowAdd(false)} style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Name</Label><input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Jordan Diaz" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Email (their login)</Label><input type="email" value={aEmail} onChange={(e) => setAEmail(e.target.value)} placeholder="jordan@callcenter.com" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Mobile (optional)</Label><input type="tel" value={aPhone} onChange={(e) => setAPhone(e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /><p className="mt-1 text-[11px] leading-snug" style={{ color: theme.textMuted }}>If you add a number, we text them their login details. Otherwise reveal the temp password on their card to share it.</p></div>
            <div><Label>How escalated calls reach them</Label>
              <div className="flex gap-2">
                {([['browser', 'In browser', Monitor], ['phone', 'Ring a phone', Phone]] as const).map(([v, lbl, Icon]) => (
                  <button key={v} onClick={() => setADelivery(v)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[13px] font-medium" style={aDelivery === v ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.hover, color: theme.textMuted }}><Icon className="h-3.5 w-3.5" /> {lbl}</button>
                ))}
              </div>
            </div>
            {aDelivery === 'phone' && <div className="sm:col-span-2"><Label>Agent phone (where escalations ring)</Label><input type="tel" value={aAgentPhone} onChange={(e) => setAAgentPhone(e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>}
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
          <div className="mt-4 flex justify-end">
            <button onClick={addAgent} disabled={adding} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add agent</button>
          </div>
        </div>
      )}

      {/* Roster */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl py-14 flex flex-col items-center justify-center text-center" style={{ border: `1px dashed ${theme.border}` }}>
          <Users className="h-8 w-8 mb-2.5" style={{ color: theme.textSubtle }} />
          <p className="text-sm font-medium" style={{ color: theme.text }}>No agents yet</p>
          <p className="text-[13px] mt-1" style={{ color: theme.textMuted }}>Add your first agent to start taking escalated calls.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((m) => {
            const pv = presenceView(m);
            const assigned = Array.isArray(m.assigned_client_ids) ? m.assigned_client_ids : [];
            const expanded = expandedId === m.id;
            return (
              <div key={m.id} className="rounded-2xl overflow-hidden" style={card}>
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 text-sm font-semibold" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{initials(m.display_name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{m.display_name}</p>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                        {pv.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pv.color }} />}
                        <span style={{ color: pv.color }}>{pv.label}</span>
                      </span>
                    </div>
                    <p className="text-[12px] truncate" style={{ color: theme.textMuted }}>{m.email || 'No email'} · {m.call_delivery === 'phone' ? `rings ${fmtPhone(m.agent_phone) || 'a phone'}` : 'in browser'} · {assigned.length} {assigned.length === 1 ? 'business' : 'businesses'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => setExpandedId(expanded ? null : m.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Manage <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} /></button>
                    <button onClick={() => removeAgent(m)} className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px]" style={{ backgroundColor: theme.hover, color: theme.error }} title="Remove agent"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                {expanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 space-y-4" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                    {/* Routing */}
                    <div className="pt-4">
                      <Label>Call routing</Label>
                      <div className="flex gap-2 mb-2">
                        {([['browser', 'In browser', Monitor], ['phone', 'Ring a phone', Phone]] as const).map(([v, lbl, Icon]) => (
                          <button key={v} onClick={() => setDelivery(m, v)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium" style={m.call_delivery === v ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.hover, color: theme.textMuted }}><Icon className="h-3.5 w-3.5" /> {lbl}</button>
                        ))}
                      </div>
                      {m.call_delivery === 'phone' && (
                        <input defaultValue={m.agent_phone || ''} onBlur={(e) => { if ((e.target.value || '') !== (m.agent_phone || '')) setDelivery(m, 'phone', e.target.value); }} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
                      )}
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
                    </div>
                    {/* Login */}
                    {m.visible_password && (
                      <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                        <span className="text-[12px]" style={{ color: theme.textMuted }}>Temp password</span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-mono" style={{ color: theme.text }}>{revealPw[m.id] ? m.visible_password : '••••••••'}</span>
                          <button onClick={() => setRevealPw((p) => ({ ...p, [m.id]: !p[m.id] }))} style={{ color: theme.textMuted }}>{revealPw[m.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                        </span>
                      </div>
                    )}
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