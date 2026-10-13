'use client';

import { useState, useEffect } from 'react';
import {
  Users, Plus, Loader2, Trash2, Eye, EyeOff, RefreshCw,
  Check, AlertCircle, CheckCircle2, Circle, Phone, Mail, Copy,
  Lock, Bell, BellOff, ChevronDown, ChevronUp, Building2, Headphones
} from 'lucide-react';
import UpgradeGate from './UpgradeGate';
import { useAgency } from '@/app/agency/context';

// ============================================================================
// TYPES
// ============================================================================
interface TeamMember {
  id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  visible_password: string | null;
  permissions: Record<string, boolean>;
  notification_prefs: Record<string, boolean>;
  status: 'active' | 'invited' | 'disabled';
  // Call-center agent scoping: the businesses this agent may see/handle.
  // null = unrestricted (not an agent). Only used for call-center agencies.
  assigned_client_ids: string[] | null;
  last_login: string | null;
  created_at: string;
}

interface AgencyClientLite { id: string; business_name: string; }

// Permission preset applied to a call-center agent. They need dashboard (to load
// their wallboard) and clients (to open their assigned businesses); everything
// else off. Their actual reach is then narrowed to assigned_client_ids server-side.
const AGENT_PERMISSION_PRESET: Record<string, boolean> = {
  dashboard: true, clients: true, leads: false, outreach: false,
  analytics: false, marketing: false, settings: false, billing: false,
};

interface TeamLimits {
  allowed: boolean;
  current: number;
  max: number; // -1 = unlimited (Scale tier or trial), 0 = blocked, >0 = finite cap
}

interface Props {
  agencyId: string;
  theme: any; // useTheme() return type
}

// ============================================================================
// PERMISSION & NOTIFICATION LABELS
// ============================================================================
const AGENCY_PERMISSIONS: Record<string, { label: string; description: string; sensitive?: boolean }> = {
  dashboard: { label: 'Dashboard', description: 'View dashboard stats' },
  clients: { label: 'Clients', description: 'View and manage clients' },
  leads: { label: 'Leads', description: 'View and manage leads' },
  outreach: { label: 'Outreach', description: 'Access outreach tools' },
  analytics: { label: 'Analytics', description: 'View revenue analytics' },
  marketing: { label: 'Marketing Website', description: 'Edit marketing site' },
  settings: { label: 'Settings', description: 'Edit agency settings (except billing)', sensitive: true },
  billing: { label: 'Billing', description: 'Manage subscription & payments', sensitive: true },
};

const NOTIFICATION_LABELS: Record<string, string> = {
  sms_new_call: 'SMS on new calls',
  sms_missed_call: 'SMS on missed calls',
  email_new_call: 'Email on new calls',
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function AgencyTeamTab({ agencyId, theme }: Props) {
  const { agency } = useAgency();
  // A call-center agency manages AGENTS: every team member is an agent scoped to
  // the businesses the manager assigns them. Plain reseller agencies keep the
  // original Page-Access team model untouched.
  const isCallCenter = agency?.is_call_center === true;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [limits, setLimits] = useState<TeamLimits>({ allowed: true, current: 0, max: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Agency businesses, for the agent assignment picker (call center only).
  const [clients, setClients] = useState<AgencyClientLite[]>([]);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addAssigned, setAddAssigned] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  // Expanded cards
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Password visibility per member
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // ============================================================================
  // FETCH
  // ============================================================================
  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/team`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch team');
      const data = await res.json();
      setMembers(data.members || []);
      setLimits(data.limits || { allowed: true, current: 0, max: 0 });
    } catch (err) {
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  // Load the agency's businesses once, for the agent assignment picker.
  const fetchClients = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: AgencyClientLite[] = (data.clients || [])
        .map((c: any) => ({ id: c.id, business_name: c.business_name || 'Business' }))
        .sort((a: AgencyClientLite, b: AgencyClientLite) => a.business_name.localeCompare(b.business_name));
      setClients(list);
    } catch { /* non-fatal: picker just shows no businesses */ }
  };

  useEffect(() => { fetchTeam(); }, [agencyId]);
  useEffect(() => { if (isCallCenter) fetchClients(); }, [agencyId, isCallCenter]);

  // ============================================================================
  // ADD MEMBER
  // ============================================================================
  const handleAdd = async () => {
    if (!addName.trim() || !addEmail.trim()) {
      setError('Name and email are required');
      return;
    }
    setAdding(true);
    setError(null);
    try {
      // Call-center agents are created with the agent permission preset and their
      // assigned businesses. Plain reseller members keep the server's defaults.
      const body: any = { name: addName.trim(), email: addEmail.trim(), phone: addPhone.trim() || null };
      if (isCallCenter) {
        body.permissions = AGENT_PERMISSION_PRESET;
        body.assigned_client_ids = addAssigned;
      }
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add team member');

      setMembers(prev => [...prev, data.member]);
      setLimits(prev => ({ ...prev, current: prev.current + 1 }));
      const noun = isCallCenter ? 'Agent' : '';
      setSuccess(`${data.member.display_name} added${noun ? ` as an ${noun.toLowerCase()}` : ''}! ${addPhone ? 'Credentials sent via SMS.' : 'Share the credentials below.'}`);
      setAddName(''); setAddEmail(''); setAddPhone(''); setAddAssigned([]);
      setShowAddForm(false);
      setExpandedId(data.member.id); // Auto-expand new member to show password
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // ============================================================================
  // UPDATE PERMISSIONS
  // ============================================================================
  const togglePermission = async (memberId: string, key: string, currentValue: boolean) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const newPerms = { ...member.permissions, [key]: !currentValue };
    
    // Optimistic update
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, permissions: newPerms } : m));

    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ permissions: newPerms }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      // Revert
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, permissions: member.permissions } : m));
      setError('Failed to update permissions');
    }
  };

  // ============================================================================
  // UPDATE AGENT BUSINESS ASSIGNMENTS (call center)
  // ============================================================================
  const toggleAssignment = async (memberId: string, clientId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const current = Array.isArray(member.assigned_client_ids) ? member.assigned_client_ids : [];
    const next = current.includes(clientId)
      ? current.filter(id => id !== clientId)
      : [...current, clientId];

    // Optimistic
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, assigned_client_ids: next } : m));

    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ assigned_client_ids: next }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, assigned_client_ids: current } : m));
      setError('Failed to update assigned businesses');
    }
  };

  // ============================================================================
  // TOGGLE NOTIFICATION PREF
  // ============================================================================
  const toggleNotification = async (memberId: string, key: string, currentValue: boolean) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const newPrefs = { ...member.notification_prefs, [key]: !currentValue };
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, notification_prefs: newPrefs } : m));

    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notification_prefs: newPrefs }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, notification_prefs: member.notification_prefs } : m));
    }
  };

  // ============================================================================
  // RESET PASSWORD
  // ============================================================================
  const resetPassword = async (memberId: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/team/${memberId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset');
      
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, visible_password: data.visible_password } : m
      ));
      setVisiblePasswords(prev => ({ ...prev, [memberId]: true }));
      setSuccess('Password reset! New credentials sent via SMS.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ============================================================================
  // TOGGLE STATUS (active/disabled)
  // ============================================================================
  const toggleStatus = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: newStatus as any } : m));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ============================================================================
  // REMOVE MEMBER
  // ============================================================================
  const removeMember = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from your team? This will delete their account.`)) return;
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/team/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove');
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setLimits(prev => ({ ...prev, current: Math.max(0, prev.current - 1) }));
      setSuccess(`${name} removed from team`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ============================================================================
  // COPY TO CLIPBOARD
  // ============================================================================
  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied!');
      setTimeout(() => setSuccess(null), 1500);
    } catch {}
  };

  // ============================================================================
  // DERIVED LIMIT STATE
  // -1 is the "unlimited" sentinel returned by routes/team.js checkTeamLimit
  // for Scale tier and any agency currently on a trial. Treat unlimited as
  // "can add members" and render "Unlimited" instead of the literal -1.
  // ============================================================================
  const isUnlimited = limits.max === -1;
  const canAddMembers = isUnlimited || limits.max > 0;
  const countText = isUnlimited
    ? `${limits.current} team members (Unlimited)`
    : `${limits.current} of ${limits.max} team members`;
  // Free agencies come back with max 0 (blocked). Gate the whole panel so it
  // reads the same as the API / white-label locks instead of an inline card.
  const locked = limits.max === 0;

  // ============================================================================
  // RENDER
  // ============================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  return (
    <UpgradeGate
      locked={locked}
      tier="pro"
      title="Unlock team members with Pro"
      description="Invite your staff into the agency dashboard with their own logins, decide exactly which pages each person can see, and route call notifications to the right people. Pro unlocks team members so you can delegate day-to-day work without handing out your own password."
      theme={theme}
    >
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-medium mb-1">{isCallCenter ? 'Agents' : 'Team Members'}</h3>
          <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
            {limits.max === 0
              ? `Upgrade your plan to add ${isCallCenter ? 'agents' : 'team members'}.`
              : isCallCenter
                ? `${countText.replace('team members', 'agents')} · each sees only the businesses you assign them`
                : countText}
          </p>
        </div>
        {canAddMembers && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={!limits.allowed}
            className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            <Plus className="h-4 w-4" />
            {isCallCenter ? 'Add Agent' : 'Add Member'}
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} />
          <p className="text-sm" style={{ color: theme.errorText }}>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-sm" style={{ color: theme.errorText }}>×</button>
        </div>
      )}
      {success && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
          <Check className="h-4 w-4" style={{ color: theme.primary }} />
          <p className="text-sm" style={{ color: theme.primary }}>{success}</p>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-xl p-4" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
          <h4 className="text-sm font-medium mb-3">{isCallCenter ? 'Add Agent' : 'Add Team Member'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: theme.textMuted }}>Full Name *</label>
              <input
                type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
                placeholder="John Smith"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: theme.isDark ? '#050505' : '#ffffff', border: `1px solid ${theme.inputBorder}`, color: theme.text }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: theme.textMuted }}>Email *</label>
              <input
                type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                placeholder="john@company.com"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: theme.isDark ? '#050505' : '#ffffff', border: `1px solid ${theme.inputBorder}`, color: theme.text }}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs mb-1" style={{ color: theme.textMuted }}>Phone (for SMS credentials)</label>
            <input
              type="tel" value={addPhone} onChange={(e) => setAddPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full sm:w-1/2 rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: theme.isDark ? '#050505' : '#ffffff', border: `1px solid ${theme.inputBorder}`, color: theme.text }}
            />
            <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>Login credentials will be sent here via SMS</p>
          </div>

          {/* Agent business assignment (call center) */}
          {isCallCenter && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Building2 className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                <label className="block text-xs font-medium" style={{ color: theme.text }}>Assigned businesses</label>
              </div>
              <p className="text-[10px] mb-2" style={{ color: theme.textMuted }}>
                This agent will only see and handle the businesses you check here. You can change this anytime.
              </p>
              {clients.length === 0 ? (
                <p className="text-xs italic rounded-lg px-3 py-2" style={{ color: theme.textMuted, backgroundColor: theme.hover }}>
                  No businesses yet. Add a client first, then assign it here.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <button type="button" onClick={() => setAddAssigned(clients.map(c => c.id))} className="text-[11px] font-medium" style={{ color: theme.primary }}>Select all</button>
                    <button type="button" onClick={() => setAddAssigned([])} className="text-[11px] font-medium" style={{ color: theme.textMuted }}>Clear</button>
                    <span className="text-[11px] ml-auto" style={{ color: theme.textMuted }}>{addAssigned.length} of {clients.length} selected</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto rounded-lg divide-y" style={{ border: `1px solid ${theme.inputBorder}`, borderColor: theme.inputBorder }}>
                    {clients.map(c => {
                      const sel = addAssigned.includes(c.id);
                      return (
                        <button
                          key={c.id} type="button"
                          onClick={() => setAddAssigned(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                          style={{ backgroundColor: sel ? theme.primary15 : 'transparent' }}
                        >
                          {sel
                            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />
                            : <Circle className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />}
                          <span className="text-xs truncate" style={{ color: sel ? theme.text : theme.textMuted }}>{c.business_name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd} disabled={adding}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {adding ? 'Adding...' : 'Add Member'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddName(''); setAddEmail(''); setAddPhone(''); setAddAssigned([]); }}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ color: theme.textMuted }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Team member list */}
      {members.length > 0 && (
        <div className="space-y-3">
          {members.map((member) => {
            const isExpanded = expandedId === member.id;
            const showPw = visiblePasswords[member.id] || false;

            return (
              <div
                key={member.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  backgroundColor: theme.input,
                  border: `1px solid ${member.status === 'disabled' ? theme.errorBorder : theme.inputBorder}`,
                  opacity: member.status === 'disabled' ? 0.7 : 1,
                }}
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : member.id)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                      style={{ backgroundColor: theme.primary15, color: theme.primary }}
                    >
                      {member.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{member.display_name}</p>
                        {member.status === 'disabled' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.errorBg, color: theme.errorText }}>Disabled</span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: theme.textMuted }}>{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {member.last_login && (
                      <span className="text-[10px] hidden sm:inline" style={{ color: theme.textMuted }}>
                        Last login: {new Date(member.last_login).toLocaleDateString()}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" style={{ color: theme.textMuted }} /> : <ChevronDown className="h-4 w-4" style={{ color: theme.textMuted }} />}
                  </div>
                </button>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${theme.border}` }}>

                    {/* Credentials */}
                    <div className="pt-3">
                      <p className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>Login Credentials</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: theme.hover }}>
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.textMuted }} />
                          <span className="text-xs truncate" style={{ color: theme.text }}>{member.email}</span>
                          <button onClick={() => copyText(member.email || '')} className="ml-auto flex-shrink-0">
                            <Copy className="h-3 w-3" style={{ color: theme.textMuted }} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: theme.hover }}>
                          <Lock className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.textMuted }} />
                          {member.visible_password ? (
                            <>
                              <span className="text-xs font-mono" style={{ color: theme.text }}>
                                {showPw ? member.visible_password : '••••••••••'}
                              </span>
                              <button
                                onClick={() => setVisiblePasswords(prev => ({ ...prev, [member.id]: !showPw }))}
                                className="ml-auto flex-shrink-0"
                              >
                                {showPw ? <EyeOff className="h-3 w-3" style={{ color: theme.textMuted }} /> : <Eye className="h-3 w-3" style={{ color: theme.textMuted }} />}
                              </button>
                              <button onClick={() => copyText(member.visible_password || '')} className="flex-shrink-0">
                                <Copy className="h-3 w-3" style={{ color: theme.textMuted }} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs italic" style={{ color: theme.textMuted }}>Changed by user</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => resetPassword(member.id)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                        style={{ color: theme.primary }}
                      >
                        <RefreshCw className="h-3 w-3" /> Reset Password
                      </button>
                    </div>

                    {/* Call center: assigned businesses. Reseller: Page Access. */}
                    {isCallCenter ? (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Building2 className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                          <p className="text-xs font-medium" style={{ color: theme.textMuted }}>Assigned businesses</p>
                          <span className="text-[11px] ml-auto" style={{ color: theme.textMuted }}>
                            {(member.assigned_client_ids?.length ?? 0)} of {clients.length}
                          </span>
                        </div>
                        {clients.length === 0 ? (
                          <p className="text-xs italic rounded-lg px-3 py-2" style={{ color: theme.textMuted, backgroundColor: theme.hover }}>
                            No businesses yet. Add a client first, then assign it here.
                          </p>
                        ) : (
                          <>
                            {(member.assigned_client_ids?.length ?? 0) === 0 && (
                              <div className="flex items-start gap-2 rounded-lg px-3 py-2 mb-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: theme.warningText }} />
                                <p className="text-[11px]" style={{ color: theme.warningText }}>No businesses assigned — this agent sees an empty board until you assign at least one.</p>
                              </div>
                            )}
                            <div className="max-h-44 overflow-y-auto rounded-lg divide-y" style={{ border: `1px solid ${theme.border}`, borderColor: theme.border }}>
                              {clients.map(c => {
                                const sel = (member.assigned_client_ids || []).includes(c.id);
                                return (
                                  <button
                                    key={c.id} type="button"
                                    onClick={() => toggleAssignment(member.id, c.id)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                                    style={{ backgroundColor: sel ? theme.primary15 : 'transparent' }}
                                  >
                                    {sel
                                      ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />
                                      : <Circle className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />}
                                    <span className="text-xs truncate" style={{ color: sel ? theme.text : theme.textMuted }}>{c.business_name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>Page Access</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(AGENCY_PERMISSIONS).map(([key, info]) => {
                          const enabled = member.permissions[key] ?? false;
                          return (
                            <button
                              key={key}
                              onClick={() => togglePermission(member.id, key, enabled)}
                              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors"
                              style={{
                                backgroundColor: enabled ? theme.primary15 : theme.hover,
                                border: `1px solid ${enabled ? theme.primary30 : theme.border}`,
                              }}
                            >
                              {enabled
                                ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />
                                : <Circle className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
                              }
                              <div className="min-w-0">
                                <span className="text-xs font-medium block truncate" style={{ color: enabled ? theme.text : theme.textMuted }}>
                                  {info.label}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    )}

                    {/* Notifications */}
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>Notifications</p>
                      <div className="space-y-1.5">
                        {Object.entries(NOTIFICATION_LABELS).map(([key, label]) => {
                          const enabled = member.notification_prefs[key] ?? false;
                          return (
                            <div key={key} className="flex items-center justify-between py-1.5 px-1">
                              <div className="flex items-center gap-2">
                                {enabled
                                  ? <Bell className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                                  : <BellOff className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                                }
                                <span className="text-xs" style={{ color: enabled ? theme.text : theme.textMuted }}>{label}</span>
                              </div>
                              <button
                                onClick={() => toggleNotification(member.id, key, enabled)}
                                className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors"
                                style={{ backgroundColor: enabled ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db') }}
                              >
                                <span className="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition"
                                  style={{ transform: enabled ? 'translate(16px, 3px)' : 'translate(3px, 3px)' }} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                      <button
                        onClick={() => toggleStatus(member.id, member.status)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: member.status === 'active' ? theme.warningBg : theme.primary15,
                          color: member.status === 'active' ? theme.warningText : theme.primary,
                          border: `1px solid ${member.status === 'active' ? theme.warningBorder : theme.primary30}`,
                        }}
                      >
                        {member.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => removeMember(member.id, member.display_name)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{ backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }}
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state — shows when the agency can add members but has none */}
      {members.length === 0 && (canAddMembers || locked) && !showAddForm && (
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
          {isCallCenter ? <Headphones className="h-8 w-8 mx-auto mb-2" style={{ color: theme.textMuted }} /> : <Users className="h-8 w-8 mx-auto mb-2" style={{ color: theme.textMuted }} />}
          <p className="text-sm font-medium mb-1" style={{ color: theme.text }}>{isCallCenter ? 'No agents yet' : 'No team members yet'}</p>
          <p className="text-xs mb-3" style={{ color: theme.textMuted }}>{isCallCenter ? 'Add agents and assign each one the businesses they should monitor.' : 'Add team members to give them access to your agency dashboard.'}</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            <Plus className="h-3.5 w-3.5" /> {isCallCenter ? 'Add First Agent' : 'Add First Member'}
          </button>
        </div>
      )}
    </div>
    </UpgradeGate>
  );
}