'use client';

import { useState, useEffect } from 'react';
import {
  Users, Plus, Loader2, Trash2, Eye, EyeOff, RefreshCw,
  Check, AlertCircle, Shield, ShieldOff, Mail, Copy,
  Lock, Bell, BellOff, ChevronDown, ChevronUp
} from 'lucide-react';

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
  last_login: string | null;
  created_at: string;
}

interface TeamLimits {
  allowed: boolean;
  current: number;
  max: number;
}

interface Props {
  clientId: string;
  theme: any;
}

// ============================================================================
// PERMISSION & NOTIFICATION LABELS
// ============================================================================
const CLIENT_PERMISSIONS: Record<string, { label: string; description: string; sensitive?: boolean }> = {
  dashboard: { label: 'Dashboard', description: 'View dashboard stats' },
  calls: { label: 'Calls', description: 'View call history and details' },
  contacts: { label: 'Contacts', description: 'View and manage contacts' },
  ai_agent: { label: 'AI Agent', description: 'Configure AI voice, greeting, knowledge base', sensitive: true },
  settings: { label: 'Settings', description: 'Edit business settings', sensitive: true },
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
export default function ClientTeamSection({ clientId, theme }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [limits, setLimits] = useState<TeamLimits>({ allowed: true, current: 0, max: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [adding, setAdding] = useState(false);

  // Expanded cards
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Password visibility per member
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // ============================================================================
  // FETCH
  // ============================================================================
  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/api/client/${clientId}/team`, {
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

  useEffect(() => { fetchTeam(); }, [clientId]);

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
      const res = await fetch(`${backendUrl}/api/client/${clientId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: addName.trim(), email: addEmail.trim(), phone: addPhone.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add team member');
      
      setMembers(prev => [...prev, data.member]);
      setLimits(prev => ({ ...prev, current: prev.current + 1 }));
      setSuccess(`${data.member.display_name} added! ${addPhone ? 'Credentials sent via SMS.' : 'Share the credentials below.'}`);
      setAddName(''); setAddEmail(''); setAddPhone('');
      setShowAddForm(false);
      setExpandedId(data.member.id);
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
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, permissions: newPerms } : m));

    try {
      const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ permissions: newPerms }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, permissions: member.permissions } : m));
      setError('Failed to update permissions');
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
      const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}`, {
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
      const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}/reset-password`, {
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
  // TOGGLE STATUS
  // ============================================================================
  const toggleStatus = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}`, {
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
    if (!confirm(`Remove ${name}? This will delete their account.`)) return;
    try {
      const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove');
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setLimits(prev => ({ ...prev, current: Math.max(0, prev.current - 1) }));
      setSuccess(`${name} removed`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied!');
      setTimeout(() => setSuccess(null), 1500);
    } catch {}
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted }} />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2" style={{ color: theme.text }}>
            <Users className="w-4 h-4" style={{ color: theme.primary }} />
            Team Members
          </h2>
          {limits.max > 0 && (
            <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>
              {limits.current} of {limits.max} members
            </p>
          )}
        </div>
        {limits.max > 0 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={!limits.allowed}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg p-2.5 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.errorText }} />
          <p className="text-xs" style={{ color: theme.errorText }}>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-xs" style={{ color: theme.errorText }}>×</button>
        </div>
      )}
      {success && (
        <div className="rounded-lg p-2.5 flex items-center gap-2" style={{ backgroundColor: theme.successBg, border: `1px solid ${theme.successBorder}` }}>
          <Check className="h-3.5 w-3.5" style={{ color: theme.success }} />
          <p className="text-xs" style={{ color: theme.success }}>{success}</p>
        </div>
      )}

      {/* Plan gate */}
      {limits.max === 0 && (
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
          <Users className="h-6 w-6 mx-auto mb-1.5" style={{ color: theme.textMuted4 }} />
          <p className="text-xs sm:text-sm font-medium" style={{ color: theme.text }}>Team members not available</p>
          <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.textMuted4 }}>
            Contact your provider to upgrade and unlock team access.
          </p>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-xl border p-3 sm:p-4" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
          <h3 className="text-xs sm:text-sm font-medium mb-3" style={{ color: theme.text }}>Add Team Member</h3>
          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Full Name *</label>
              <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="John Smith"
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 transition"
                style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Email *</label>
              <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="john@business.com"
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 transition"
                style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Phone (for SMS credentials)</label>
              <input type="tel" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="+1 (555) 123-4567"
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 transition"
                style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={handleAdd} disabled={adding}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button onClick={() => { setShowAddForm(false); setAddName(''); setAddEmail(''); setAddPhone(''); }}
              className="rounded-lg px-3 py-2 text-xs sm:text-sm" style={{ color: theme.textMuted }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Member list */}
      {members.length > 0 && (
        <div className="space-y-2">
          {members.map((member) => {
            const isExpanded = expandedId === member.id;
            const showPw = visiblePasswords[member.id] || false;

            return (
              <div key={member.id} className="rounded-xl border overflow-hidden transition-all"
                style={{ borderColor: member.status === 'disabled' ? theme.errorBorder : theme.border, backgroundColor: theme.card, opacity: member.status === 'disabled' ? 0.7 : 1 }}>
                
                {/* Header row */}
                <button onClick={() => setExpandedId(isExpanded ? null : member.id)} className="w-full flex items-center justify-between p-3 text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                      style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}>
                      {member.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-medium truncate" style={{ color: theme.text }}>{member.display_name}</p>
                        {member.status === 'disabled' && (
                          <span className="text-[9px] px-1 py-0.5 rounded-full" style={{ backgroundColor: theme.errorBg, color: theme.errorText }}>Off</span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs truncate" style={{ color: theme.textMuted4 }}>{member.email}</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.textMuted4 }} /> : <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.textMuted4 }} />}
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3" style={{ borderTop: `1px solid ${theme.border}` }}>

                    {/* Credentials */}
                    <div className="pt-2.5">
                      <p className="text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted4 }}>Login Credentials</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: theme.bg }}>
                          <Mail className="h-3 w-3 flex-shrink-0" style={{ color: theme.textMuted4 }} />
                          <span className="text-[10px] sm:text-xs truncate" style={{ color: theme.text }}>{member.email}</span>
                          <button onClick={() => copyText(member.email || '')} className="ml-auto flex-shrink-0">
                            <Copy className="h-3 w-3" style={{ color: theme.textMuted4 }} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: theme.bg }}>
                          <Lock className="h-3 w-3 flex-shrink-0" style={{ color: theme.textMuted4 }} />
                          {member.visible_password ? (
                            <>
                              <span className="text-[10px] sm:text-xs font-mono" style={{ color: theme.text }}>
                                {showPw ? member.visible_password : '••••••••••'}
                              </span>
                              <button onClick={() => setVisiblePasswords(prev => ({ ...prev, [member.id]: !showPw }))} className="ml-auto flex-shrink-0">
                                {showPw ? <EyeOff className="h-3 w-3" style={{ color: theme.textMuted4 }} /> : <Eye className="h-3 w-3" style={{ color: theme.textMuted4 }} />}
                              </button>
                              <button onClick={() => copyText(member.visible_password || '')} className="flex-shrink-0">
                                <Copy className="h-3 w-3" style={{ color: theme.textMuted4 }} />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] sm:text-xs italic" style={{ color: theme.textMuted4 }}>Changed by user</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => resetPassword(member.id)}
                        className="mt-1.5 inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium" style={{ color: theme.primary }}>
                        <RefreshCw className="h-3 w-3" /> Reset Password
                      </button>
                    </div>

                    {/* Permissions */}
                    <div>
                      <p className="text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted4 }}>Page Access</p>
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(CLIENT_PERMISSIONS).map(([key, info]) => {
                          const enabled = member.permissions[key] ?? false;
                          return (
                            <button key={key} onClick={() => togglePermission(member.id, key, enabled)}
                              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors"
                              style={{ backgroundColor: enabled ? `${theme.primary}10` : theme.bg, border: `1px solid ${enabled ? `${theme.primary}30` : 'transparent'}` }}>
                              {enabled
                                ? <Shield className="h-3 w-3 flex-shrink-0" style={{ color: theme.primary }} />
                                : <ShieldOff className="h-3 w-3 flex-shrink-0" style={{ color: theme.textMuted4 }} />
                              }
                              <span className="text-[10px] sm:text-xs font-medium truncate" style={{ color: enabled ? theme.primary : theme.textMuted4 }}>
                                {info.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notifications */}
                    <div>
                      <p className="text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted4 }}>Notifications</p>
                      <div className="space-y-1">
                        {Object.entries(NOTIFICATION_LABELS).map(([key, label]) => {
                          const enabled = member.notification_prefs[key] ?? false;
                          return (
                            <div key={key} className="flex items-center justify-between py-1 px-0.5">
                              <div className="flex items-center gap-1.5">
                                {enabled ? <Bell className="h-3 w-3" style={{ color: theme.primary }} /> : <BellOff className="h-3 w-3" style={{ color: theme.textMuted4 }} />}
                                <span className="text-[10px] sm:text-xs" style={{ color: enabled ? theme.text : theme.textMuted4 }}>{label}</span>
                              </div>
                              <button onClick={() => toggleNotification(member.id, key, enabled)}
                                className="relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full transition-colors"
                                style={{ backgroundColor: enabled ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db') }}>
                                <span className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition"
                                  style={{ transform: enabled ? 'translate(12px, 2px)' : 'translate(2px, 2px)' }} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                      <button onClick={() => toggleStatus(member.id, member.status)}
                        className="rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-colors"
                        style={{ backgroundColor: member.status === 'active' ? theme.warningBg : theme.successBg, color: member.status === 'active' ? theme.warning : theme.success, border: `1px solid ${member.status === 'active' ? theme.warningBorder : theme.successBorder}` }}>
                        {member.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => removeMember(member.id, member.display_name)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-colors"
                        style={{ backgroundColor: theme.errorBg, color: theme.error, border: `1px solid ${theme.errorBorder}` }}>
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

      {/* Empty state */}
      {members.length === 0 && limits.max > 0 && !showAddForm && (
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
          <Users className="h-6 w-6 mx-auto mb-1.5" style={{ color: theme.textMuted4 }} />
          <p className="text-xs sm:text-sm font-medium" style={{ color: theme.text }}>No team members yet</p>
          <p className="text-[10px] sm:text-xs mt-0.5 mb-2.5" style={{ color: theme.textMuted4 }}>Add team members to share dashboard access.</p>
          <button onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            <Plus className="h-3 w-3" /> Add First Member
          </button>
        </div>
      )}
    </div>
  );
}