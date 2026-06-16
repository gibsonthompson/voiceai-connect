'use client';

import { useState, useEffect } from 'react';
import {
  Users, Plus, Loader2, Trash2, Eye, EyeOff, RefreshCw,
  Check, CheckCircle2, Circle, AlertCircle, Mail, Copy,
  Lock, Bell, BellOff, ChevronDown, ChevronUp, Info, Phone
} from 'lucide-react';
import { useClient } from '@/lib/client-context';

interface TeamMember { id: string; display_name: string; phone: string | null; email: string | null; visible_password: string | null; permissions: Record<string, boolean>; notification_prefs: Record<string, boolean>; status: 'active' | 'invited' | 'disabled'; last_login: string | null; created_at: string; }
interface TeamLimits { allowed: boolean; current: number; max: number; }
interface Props { clientId: string; theme: any; }

const CLIENT_PERMISSIONS: Record<string, { label: string; description: string; sensitive?: boolean }> = {
  dashboard: { label: 'Dashboard', description: 'View dashboard stats' },
  calls: { label: 'Calls', description: 'View call history and details' },
  contacts: { label: 'Contacts', description: 'View and manage contacts' },
  messages: { label: 'Messages', description: 'View and send messages' },
  my_business: { label: 'My Business', description: 'Edit hours, services, staff, knowledge base', sensitive: true },
  ai_agent: { label: 'AI Agent', description: 'Configure AI voice, greeting, knowledge base', sensitive: true },
  settings: { label: 'Settings', description: 'Edit business settings', sensitive: true },
  billing: { label: 'Billing', description: 'Manage subscription & payments', sensitive: true },
};

const NOTIFICATION_LABELS: Record<string, string> = { sms_new_call: 'Call notifications' };

export default function ClientTeamSection({ clientId, theme }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [limits, setLimits] = useState<TeamLimits>({ allowed: true, current: 0, max: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState(''); const [addEmail, setAddEmail] = useState(''); const [addPhone, setAddPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const { client } = useClient();
  const agency = client?.agency;
  const loginUrl = agency?.marketing_domain && agency?.domain_verified
    ? `https://${agency.marketing_domain}/client/login`
    : agency?.slug
      ? `https://${agency.slug}.myvoiceaiconnect.com/client/login`
      : '/client/login';

  const fetchTeam = async () => { try { setLoading(true); const res = await fetch(`${backendUrl}/api/client/${clientId}/team`, { headers: { 'Authorization': `Bearer ${token}` } }); if (!res.ok) throw new Error('Failed to fetch team'); const data = await res.json(); setMembers(data.members || []); setLimits(data.limits || { allowed: true, current: 0, max: 0 }); } catch (err) { setError('Failed to load team members'); } finally { setLoading(false); } };
  useEffect(() => { fetchTeam(); }, [clientId]);

  const handleAdd = async () => { if (!addName.trim() || !addEmail.trim()) { setError('Name and email are required'); return; } setAdding(true); setError(null); try { const res = await fetch(`${backendUrl}/api/client/${clientId}/team`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name: addName.trim(), email: addEmail.trim(), phone: addPhone.trim() || null }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Failed to add'); setMembers(prev => [...prev, data.member]); setLimits(prev => ({ ...prev, current: prev.current + 1 })); setSuccess(`${data.member.display_name} added! ${addPhone ? 'Credentials sent via SMS.' : 'Share the credentials below.'}`); setAddName(''); setAddEmail(''); setAddPhone(''); setShowAddForm(false); setExpandedId(data.member.id); setTimeout(() => setSuccess(null), 5000); } catch (err: any) { setError(err.message); } finally { setAdding(false); } };

  // Surface the backend's real error (e.g. the owner-only 403) instead of a
  // generic "Failed to update". A 403 here almost always means the request
  // carried a non-owner token — common causes: viewing in agency preview, or
  // a second tab logged in as a team member overwriting the shared auth_token.
  const togglePermission = async (memberId: string, key: string, currentValue: boolean) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const newPerms = { ...member.permissions, [key]: !currentValue };
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, permissions: newPerms } : m));
    try {
      const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ permissions: newPerms }) });
      if (!res.ok) {
        let msg = res.status === 403 ? 'Only the account owner can change permissions.' : 'Failed to update permissions';
        try { const data = await res.json(); if (data?.error) msg = data.error; } catch {}
        throw new Error(msg);
      }
      setSuccess('Page access saved'); setTimeout(() => setSuccess(null), 1500);
    } catch (err: any) {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, permissions: member.permissions } : m));
      setError(err?.message || 'Failed to update permissions');
    }
  };
  const toggleNotification = async (memberId: string, key: string, currentValue: boolean) => { const member = members.find(m => m.id === memberId); if (!member) return; const newPrefs = { ...member.notification_prefs, [key]: !currentValue }; setMembers(prev => prev.map(m => m.id === memberId ? { ...m, notification_prefs: newPrefs } : m)); try { const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ notification_prefs: newPrefs }) }); if (!res.ok) throw new Error('Failed to update'); setSuccess('Saved'); setTimeout(() => setSuccess(null), 1200); } catch { setMembers(prev => prev.map(m => m.id === memberId ? { ...m, notification_prefs: member.notification_prefs } : m)); setError('Failed to update notifications'); } };
  const savePhone = async (memberId: string) => { const member = members.find(m => m.id === memberId); if (!member) return; const value = phoneDraft.trim(); const prevPhone = member.phone; setSavingPhone(true); setError(null); setMembers(prev => prev.map(m => m.id === memberId ? { ...m, phone: value || null } : m)); try { const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ phone: value || null }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || (res.status === 403 ? 'Only the account owner can change team members.' : 'Failed to update phone')); setEditingPhoneId(null); setPhoneDraft(''); setSuccess(value ? 'Phone number updated' : 'Phone number removed'); setTimeout(() => setSuccess(null), 2500); } catch (err: any) { setMembers(prev => prev.map(m => m.id === memberId ? { ...m, phone: prevPhone } : m)); setError(err.message || 'Failed to update phone'); } finally { setSavingPhone(false); } };
  const resetPassword = async (memberId: string, customPassword?: string) => { try { const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(customPassword ? { password: customPassword } : {}) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Failed to reset'); setMembers(prev => prev.map(m => m.id === memberId ? { ...m, visible_password: data.visible_password } : m)); setVisiblePasswords(prev => ({ ...prev, [memberId]: true })); setEditingPasswordId(null); setNewPassword(''); setSuccess(customPassword ? 'Password updated!' : 'Password reset! New credentials sent via SMS.'); setTimeout(() => setSuccess(null), 4000); } catch (err: any) { setError(err.message); } };
  const toggleStatus = async (memberId: string, currentStatus: string) => { const newStatus = currentStatus === 'active' ? 'disabled' : 'active'; try { const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) }); if (!res.ok) throw new Error('Failed to update status'); setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: newStatus as any } : m)); setSuccess(newStatus === 'disabled' ? 'Login disabled — this user can no longer sign in' : 'Login enabled — this user can sign in again'); setTimeout(() => setSuccess(null), 2800); } catch (err: any) { setError(err.message); } };
  const removeMember = async (memberId: string, name: string) => { if (!confirm(`Remove ${name}? This will delete their account.`)) return; try { const res = await fetch(`${backendUrl}/api/client/${clientId}/team/${memberId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (!res.ok) throw new Error('Failed to remove'); setMembers(prev => prev.filter(m => m.id !== memberId)); setLimits(prev => ({ ...prev, current: Math.max(0, prev.current - 1) })); setSuccess(`${name} removed`); setTimeout(() => setSuccess(null), 3000); } catch (err: any) { setError(err.message); } };
  const copyText = async (text: string) => { try { await navigator.clipboard.writeText(text); setSuccess('Copied!'); setTimeout(() => setSuccess(null), 1500); } catch {} };

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted }} /></div>;

  // Plan doesn't include users — show upgrade prompt instead of hiding
  if (limits.max === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: theme.primary }} />
          <h2 className="text-sm sm:text-base font-semibold" style={{ color: theme.text }}>Users</h2>
        </div>
        <div className="rounded-xl border-2 border-dashed p-5 text-center" style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}>
          <Lock className="w-5 h-5 mx-auto mb-2" style={{ color: theme.textMuted }} />
          <p className="text-sm font-medium mb-1" style={{ color: theme.text }}>Dashboard Users</p>
          <p className="text-xs mb-3" style={{ color: theme.textMuted }}>Add users who can log into this dashboard with their own credentials. Available on Pro and Growth plans.</p>
          <div className="rounded-lg p-2.5 inline-flex items-start gap-2 text-left" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: theme.textMuted }} />
            <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Different from Staff Directory — users get login access to this dashboard. Staff members are people your AI knows about for call routing and scheduling.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2" style={{ color: theme.text }}>
            <Users className="w-4 h-4" style={{ color: theme.primary }} />Users
          </h2>
          <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>Dashboard login accounts — {limits.current} of {limits.max}</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} disabled={!limits.allowed} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><Plus className="h-3.5 w-3.5" />Add</button>
      </div>

      {/* Distinction info */}
      <div className="rounded-lg p-2.5 flex items-start gap-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: theme.textMuted }} />
        <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Users can log into this dashboard with their own email and password. To add people your AI references on calls (for routing, scheduling, and referrals), use the <a href="/client/my-business" style={{fontWeight:600,textDecoration:'underline'}}>Staff Directory</a> in My Business.</p>
      </div>

      {/* Login page link */}
      <div className="rounded-lg p-2.5 flex items-center justify-between gap-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
        <div className="min-w-0">
          <p className="text-[10px]" style={{ color: theme.textMuted }}>Login page</p>
          <p className="text-[10px] sm:text-xs font-mono truncate" style={{ color: theme.text }}>{loginUrl}</p>
        </div>
        <button onClick={() => copyText(loginUrl)} className="flex-shrink-0 p-1.5 rounded-lg transition-colors" style={{ color: theme.textMuted }}><Copy className="h-3.5 w-3.5" /></button>
      </div>

      {error && (<div className="rounded-lg p-2.5 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-xs" style={{ color: theme.errorText }}>{error}</p><button onClick={() => setError(null)} className="ml-auto text-xs" style={{ color: theme.errorText }}>×</button></div>)}
      {success && (<div className="rounded-lg p-2.5 flex items-center gap-2" style={{ backgroundColor: theme.successBg, border: `1px solid ${theme.successBorder}` }}><Check className="h-3.5 w-3.5" style={{ color: theme.success }} /><p className="text-xs" style={{ color: theme.success }}>{success}</p></div>)}

      {showAddForm && (
        <div className="rounded-xl border p-3 sm:p-4" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
          <h3 className="text-xs sm:text-sm font-medium mb-3" style={{ color: theme.text }}>Add User</h3>
          <div className="space-y-2.5">
            <div><label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Full Name *</label><input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="John Smith" className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 transition" style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} /></div>
            <div><label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Email *</label><input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="john@business.com" className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 transition" style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} /></div>
            <div><label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Phone (for SMS credentials)</label><input type="tel" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} placeholder="+1 (555) 123-4567" className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 transition" style={{ borderColor: theme.inputBorder, backgroundColor: theme.input, color: theme.text }} /></div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={handleAdd} disabled={adding} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}{adding ? 'Adding...' : 'Add'}</button>
            <button onClick={() => { setShowAddForm(false); setAddName(''); setAddEmail(''); setAddPhone(''); }} className="rounded-lg px-3 py-2 text-xs sm:text-sm" style={{ color: theme.textMuted }}>Cancel</button>
          </div>
        </div>
      )}

      {members.length > 0 && (
        <div className="space-y-2">
          {members.map((member) => { const isExpanded = expandedId === member.id; const showPw = visiblePasswords[member.id] || false; return (
            <div key={member.id} className="rounded-xl border overflow-hidden transition-all" style={{ borderColor: member.status === 'disabled' ? theme.errorBorder : theme.border, backgroundColor: theme.card, opacity: member.status === 'disabled' ? 0.7 : 1 }}>
              <button onClick={() => setExpandedId(isExpanded ? null : member.id)} className="w-full flex items-center justify-between p-3 text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold" style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}>{member.display_name.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0"><div className="flex items-center gap-1.5"><p className="text-xs sm:text-sm font-medium truncate" style={{ color: theme.text }}>{member.display_name}</p>{member.status === 'disabled' && (<span className="text-[9px] px-1 py-0.5 rounded-full" style={{ backgroundColor: theme.errorBg, color: theme.errorText }}>Off</span>)}</div><p className="text-[10px] sm:text-xs truncate" style={{ color: theme.textMuted4 }}>{member.email}</p></div>
                </div>
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.textMuted4 }} /> : <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.textMuted4 }} />}
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                  <div className="pt-2.5">
                    <p className="text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted4 }}>Login Credentials</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: theme.bg }}><Mail className="h-3 w-3 flex-shrink-0" style={{ color: theme.textMuted4 }} /><span className="text-[10px] sm:text-xs truncate" style={{ color: theme.text }}>{member.email}</span><button onClick={() => copyText(member.email || '')} className="ml-auto flex-shrink-0"><Copy className="h-3 w-3" style={{ color: theme.textMuted4 }} /></button></div>
                      <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: theme.bg }}><Lock className="h-3 w-3 flex-shrink-0" style={{ color: theme.textMuted4 }} />{member.visible_password ? (<><span className="text-[10px] sm:text-xs font-mono" style={{ color: theme.text }}>{showPw ? member.visible_password : '••••••••••'}</span><button onClick={() => setVisiblePasswords(prev => ({ ...prev, [member.id]: !showPw }))} className="ml-auto flex-shrink-0">{showPw ? <EyeOff className="h-3 w-3" style={{ color: theme.textMuted4 }} /> : <Eye className="h-3 w-3" style={{ color: theme.textMuted4 }} />}</button><button onClick={() => copyText(member.visible_password || '')} className="flex-shrink-0"><Copy className="h-3 w-3" style={{ color: theme.textMuted4 }} /></button></>) : (<span className="text-[10px] sm:text-xs italic" style={{ color: theme.textMuted4 }}>Changed by user</span>)}</div>
                    </div>
                    {editingPasswordId === member.id ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" autoFocus className="flex-1 rounded-lg px-2 py-1 text-[10px] sm:text-xs font-mono" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, minWidth: 0 }} />
                        <button onClick={() => { if (newPassword.trim().length >= 6) resetPassword(member.id, newPassword.trim()); else setError('Password must be at least 6 characters'); }} className="rounded-lg px-2 py-1 text-[10px] sm:text-xs font-medium" style={{ backgroundColor: theme.primary, color: theme.primaryText || '#fff' }}>Save</button>
                        <button onClick={() => { setEditingPasswordId(null); setNewPassword(''); }} className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Cancel</button>
                      </div>
                    ) : (
                      <div className="mt-1.5 flex items-center gap-3">
                        <button onClick={() => { setEditingPasswordId(member.id); setNewPassword(''); }} className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium" style={{ color: theme.primary }}><Lock className="h-3 w-3" /> Edit Password</button>
                        <button onClick={() => resetPassword(member.id)} className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium" style={{ color: theme.textMuted }}><RefreshCw className="h-3 w-3" /> Generate Random</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted4 }}>Phone (SMS notifications)</p>
                    {editingPhoneId === member.id ? (
                      <div className="flex items-center gap-1.5">
                        <input type="tel" value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} placeholder="+1 (555) 123-4567" autoFocus className="flex-1 rounded-lg px-2.5 py-1.5 text-[10px] sm:text-xs" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, minWidth: 0 }} />
                        <button onClick={() => savePhone(member.id)} disabled={savingPhone} className="rounded-lg px-2.5 py-1.5 text-[10px] sm:text-xs font-medium disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText || '#fff' }}>{savingPhone ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => { setEditingPhoneId(null); setPhoneDraft(''); }} className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: theme.bg }}>
                        <Phone className="h-3 w-3 flex-shrink-0" style={{ color: theme.textMuted4 }} />
                        <span className="text-[10px] sm:text-xs truncate" style={{ color: member.phone ? theme.text : theme.textMuted4 }}>{member.phone || 'No phone number set'}</span>
                        <button onClick={() => { setEditingPhoneId(member.id); setPhoneDraft(member.phone || ''); }} className="ml-auto flex-shrink-0 text-[10px] sm:text-xs font-medium" style={{ color: theme.primary }}>{member.phone ? 'Edit' : 'Add'}</button>
                      </div>
                    )}
                    <p className="text-[10px] mt-1" style={{ color: theme.textMuted4 }}>When Call notifications is on, alerts are texted to this number.</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium mb-0.5" style={{ color: theme.textMuted4 }}>Page Access</p>
                    <p className="text-[10px] mb-1.5" style={{ color: theme.textMuted4 }}>Which tabs this user can open. Tap to toggle — each change saves on its own. Takes effect the next time they sign in. This is separate from disabling their login below.</p>
                    <div className="grid grid-cols-2 gap-1.5">{Object.entries(CLIENT_PERMISSIONS).map(([key, info]) => { const enabled = member.permissions[key] ?? false; return (<button key={key} onClick={() => togglePermission(member.id, key, enabled)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors" style={{ backgroundColor: enabled ? `${theme.primary}10` : theme.bg, border: `1px solid ${enabled ? `${theme.primary}30` : theme.border}` }}>{enabled ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} /> : <Circle className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted4 }} />}<span className="text-[10px] sm:text-xs font-medium truncate" style={{ color: enabled ? theme.text : theme.textMuted4 }}>{info.label}</span></button>); })}</div>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted4 }}>Notifications</p>
                    <div className="space-y-1">{Object.entries(NOTIFICATION_LABELS).map(([key, label]) => { const enabled = member.notification_prefs[key] ?? false; return (<div key={key} className="flex items-center justify-between py-1 px-0.5"><div className="flex items-center gap-1.5">{enabled ? <Bell className="h-3 w-3" style={{ color: theme.primary }} /> : <BellOff className="h-3 w-3" style={{ color: theme.textMuted4 }} />}<span className="text-[10px] sm:text-xs" style={{ color: enabled ? theme.text : theme.textMuted4 }}>{label}</span></div><button onClick={() => toggleNotification(member.id, key, enabled)} className="relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full transition-colors" style={{ backgroundColor: enabled ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db') }}><span className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition" style={{ transform: enabled ? 'translate(12px, 2px)' : 'translate(2px, 2px)' }} /></button></div>); })}</div>
                  </div>
                  <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${theme.border}` }}>
                    <p className="text-[10px] sm:text-xs font-medium" style={{ color: theme.textMuted4 }}>Account</p>
                    <p className="text-[10px]" style={{ color: theme.textMuted4 }}>{member.status === 'active' ? 'This user can sign in. Disabling blocks their login entirely, but keeps their page access for when you re-enable them.' : 'This user is blocked from signing in. Their page access is preserved for when you re-enable them.'}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleStatus(member.id, member.status)} className="rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-colors" style={{ backgroundColor: member.status === 'active' ? theme.warningBg : theme.successBg, color: member.status === 'active' ? theme.warning : theme.success, border: `1px solid ${member.status === 'active' ? theme.warningBorder : theme.successBorder}` }}>{member.status === 'active' ? 'Disable Login' : 'Enable Login'}</button>
                      <button onClick={() => removeMember(member.id, member.display_name)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-colors" style={{ backgroundColor: theme.errorBg, color: theme.error, border: `1px solid ${theme.errorBorder}` }}><Trash2 className="h-3 w-3" /> Remove</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ); })}
        </div>
      )}

      {members.length === 0 && !showAddForm && (
        <div className="rounded-xl border p-4 text-center" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
          <Users className="h-6 w-6 mx-auto mb-1.5" style={{ color: theme.textMuted4 }} />
          <p className="text-xs sm:text-sm font-medium" style={{ color: theme.text }}>No users yet</p>
          <p className="text-[10px] sm:text-xs mt-0.5 mb-2.5" style={{ color: theme.textMuted4 }}>Add users to share dashboard access with your team.</p>
          <button onClick={() => setShowAddForm(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><Plus className="h-3 w-3" /> Add First User</button>
        </div>
      )}
    </div>
  );
}