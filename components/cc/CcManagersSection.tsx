'use client';

// ============================================================================
// components/cc/CcManagersSection.tsx
//
// Manager management, rendered inside /cc/settings. A call center has a handful
// of managers (people who run the dashboard) and many agents (who take calls),
// so managers live here in Settings while agents get their own high-volume page
// at /cc/agents.
//
// A manager is a team member with is_manager = true. The owner (and any manager
// granted "Create & manage team") adds managers here, sets which tabs each one
// can reach, and grants or revokes the right to manage the team. Everything goes
// through the same /api/agency/:id/team endpoints the agents page uses; the
// backend fail-closes the manage-team gate. Self-gates: renders nothing unless
// the viewer can manage the team.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Loader2, X, Check, Copy, Eye, EyeOff, RotateCcw,
  Trash2, ChevronDown, ExternalLink, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { useAgency } from '../../app/agency/context';

// A manager's default access: full dashboard, but NOT the ability to manage the
// team (the owner grants that per manager with the toggle).
const MANAGER_PERMISSION_PRESET: Record<string, boolean> = {
  dashboard: true, clients: true, analytics: true, settings: true, manage_team: false,
};
const MANAGER_PERMISSION_ROWS: { key: string; label: string; desc: string }[] = [
  { key: 'dashboard', label: 'Dashboard', desc: 'The call-center overview' },
  { key: 'clients', label: 'Businesses', desc: 'View and edit the businesses you answer for' },
  { key: 'analytics', label: 'Analytics', desc: 'Call stats and reports' },
  { key: 'settings', label: 'Settings & branding', desc: 'Account settings, branding, API keys, webhooks' },
  { key: 'manage_team', label: 'Create & manage team', desc: 'Add, edit, and remove managers and agents' },
];

interface Manager {
  id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  visible_password: string | null;
  status: string;
  is_manager?: boolean;
  last_login: string | null;
  permissions?: Record<string, boolean> | null;
}

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

export default function CcManagersSection({ theme }: { theme: any }) {
  const { agency, canManageTeam } = useAgency();
  const agencyId = agency?.id || '';

  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [aName, setAName] = useState('');
  const [aEmail, setAEmail] = useState('');
  const [aPhone, setAPhone] = useState('');
  const [aPerms, setAPerms] = useState<Record<string, boolean>>({ ...MANAGER_PERMISSION_PRESET });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealPw, setRevealPw] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);

  const ax = agency as any;
  const loginUrl = ax?.marketing_domain && ax?.domain_verified
    ? `https://${ax.marketing_domain}/agency/login`
    : `https://${ax?.slug || 'app'}.myvoiceaiconnect.com/agency/login`;

  const load = useCallback(async () => {
    if (!agencyId) return;
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); if (d.success) setManagers((d.members || []).filter((m: Manager) => m.is_manager === true)); }
    } catch { /* keep last good */ } finally { setLoading(false); }
  }, [agencyId]);
  useEffect(() => { load(); }, [load]);

  const addManager = async () => {
    if (!aName.trim() || !aEmail.trim()) { setError('Name and email are required.'); return; }
    setAdding(true); setError(null); setSuccess(null);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ name: aName.trim(), email: aEmail.trim(), phone: aPhone.trim() || null, is_manager: true, permissions: aPerms }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to add manager');
      setManagers((prev) => [...prev, { ...d.member, user_id: d.member.user_id || null }]);
      setSuccess(`${d.member.display_name} added as a manager.${aPhone ? ' Credentials sent by SMS.' : ' Reveal the temp password on their card to share it.'}`);
      setExpandedId(d.member.id); setRevealPw((p) => ({ ...p, [d.member.id]: true }));
      setAName(''); setAEmail(''); setAPhone(''); setAPerms({ ...MANAGER_PERMISSION_PRESET }); setShowAdd(false);
      setTimeout(() => setSuccess(null), 6000);
    } catch (e: any) { setError(e.message || 'Failed to add manager'); }
    finally { setAdding(false); }
  };

  const removeManager = async (m: Manager) => {
    if (!confirm(`Remove ${m.display_name}? They lose access immediately.`)) return;
    const prev = managers;
    setManagers((list) => list.filter((x) => x.id !== m.id));
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (!r.ok) throw new Error();
    } catch { setManagers(prev); setError('Could not remove the manager.'); }
  };

  const togglePermission = async (m: Manager, key: string) => {
    const cur = (m.permissions && typeof m.permissions === 'object') ? m.permissions : {};
    const next = { ...cur, [key]: !cur[key] };
    setManagers((list) => list.map((x) => (x.id === m.id ? { ...x, permissions: next } : x)));
    try { const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify({ permissions: next }) }); if (!r.ok) throw new Error(); }
    catch { setManagers((list) => list.map((x) => (x.id === m.id ? { ...x, permissions: cur } : x))); setError('Could not update permissions.'); }
  };

  const resetPassword = async (m: Manager) => {
    setResetting(m.id);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/team/${m.id}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify({}) });
      const d = await r.json();
      if (r.ok && d.success) { setManagers((list) => list.map((x) => (x.id === m.id ? { ...x, visible_password: d.visible_password } : x))); setRevealPw((pw) => ({ ...pw, [m.id]: true })); setSuccess('New password generated. Reveal and share it.'); setTimeout(() => setSuccess(null), 6000); }
      else throw new Error();
    } catch { setError('Could not reset the password.'); } finally { setResetting(null); }
  };

  const copyText = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500); } catch { setError('Copy failed. Select and copy it manually.'); }
  };

  const initials = (n: string) => { const p = (n || '').trim().split(/\s+/); return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?'; };

  // Only the owner / a manager with manage-team can see manager management.
  if (!canManageTeam) return null;

  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const Label = ({ children }: { children: React.ReactNode }) => (<label className="block text-[12px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>);
  const Switch = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick} className="relative rounded-full flex-shrink-0 transition-colors" style={{ backgroundColor: on ? theme.primary : theme.hover, width: '2.5rem', height: '1.5rem' }}>
      <span className="absolute rounded-full bg-white shadow-sm transition-all" style={{ width: '1.125rem', height: '1.125rem', top: '0.1875rem', left: on ? 'calc(100% - 1.3125rem)' : '0.1875rem' }} />
    </button>
  );

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Users className="h-4 w-4" style={{ color: theme.primary }} /></span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold" style={{ color: theme.text }}>Managers</h2>
            <p className="text-[12px]" style={{ color: theme.textMuted }}>{managers.length} {managers.length === 1 ? 'manager' : 'managers'} who run the dashboard. Agents are managed on the Agents page.</p>
          </div>
        </div>
        <button onClick={() => { setShowAdd((s) => !s); setError(null); }} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Add manager</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      {success && <div className="mt-4 rounded-xl px-4 py-3 text-[13px]" style={{ backgroundColor: `${theme.primary}12`, border: `1px solid ${theme.primary}40`, color: theme.primary }}>{success}</div>}
      {error && <div className="mt-4 rounded-xl px-4 py-3 text-[13px] flex items-center gap-2" style={{ backgroundColor: `${theme.error}12`, border: `1px solid ${theme.error}40`, color: theme.error }}><AlertCircle className="h-4 w-4" /> {error}</div>}

      {/* Add-manager form */}
      {showAdd && (
        <div className="mt-4 rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: theme.text }}>New manager</h3>
            <button onClick={() => setShowAdd(false)} style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Name</Label><input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Jordan Diaz" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div><Label>Email (their login)</Label><input type="email" value={aEmail} onChange={(e) => setAEmail(e.target.value)} placeholder="jordan@callcenter.com" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
            <div className="sm:col-span-2"><Label>Mobile (optional)</Label><input type="tel" value={aPhone} onChange={(e) => setAPhone(e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /><p className="mt-1 text-[11px] leading-snug" style={{ color: theme.textMuted }}>If you add a number, we text them their login details. Otherwise reveal the temp password on their card to share it.</p></div>
          </div>
          <div className="mt-4">
            <Label>What this manager can access</Label>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.card }}>
              {MANAGER_PERMISSION_ROWS.map((pr, i) => {
                const on = aPerms[pr.key] !== false;
                const critical = pr.key === 'manage_team';
                return (
                  <div key={pr.key} className="flex items-center justify-between gap-3 px-3 py-2.5" style={{ ...(i > 0 ? { borderTop: `1px solid ${theme.borderSubtle}` } : {}), ...(critical ? { backgroundColor: theme.primary15 } : {}) }}>
                    <div className="min-w-0"><p className="text-[13px] font-medium" style={{ color: theme.text }}>{pr.label}</p><p className="text-[11px]" style={{ color: theme.textMuted }}>{pr.desc}</p></div>
                    <Switch on={on} onClick={() => setAPerms((p) => ({ ...p, [pr.key]: !on }))} />
                  </div>
                );
              })}
            </div>
            <p className="text-[11.5px] mt-1.5" style={{ color: theme.textSubtle }}>Turn on "Create & manage team" to let this manager add and manage other managers and agents. Leave tabs off to hide them from this manager's dashboard.</p>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={addManager} disabled={adding} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add manager</button>
          </div>
        </div>
      )}

      {/* Roster */}
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm py-6" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading managers...</div>
        ) : managers.length === 0 ? (
          <div className="rounded-2xl py-10 flex flex-col items-center justify-center text-center" style={{ border: `1px dashed ${theme.border}` }}>
            <Users className="h-7 w-7 mb-2" style={{ color: theme.textSubtle }} />
            <p className="text-[13px] font-medium" style={{ color: theme.text }}>No managers yet</p>
            <p className="text-[12px] mt-1 max-w-[260px]" style={{ color: theme.textMuted }}>You run the dashboard as the owner. Add a manager to delegate parts of it.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {managers.map((m) => {
              const expanded = expandedId === m.id;
              const canTeam = !!(m.permissions && m.permissions.manage_team);
              return (
                <div key={m.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
                  <div className="flex items-center gap-3 p-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 text-[13px] font-semibold" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{initials(m.display_name)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{m.display_name}</p>
                        {canTeam && <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: theme.primary15, color: theme.primary }}><ShieldCheck className="h-2.5 w-2.5" /> Can manage team</span>}
                      </div>
                      <p className="text-[12px] truncate" style={{ color: theme.textMuted }}>{m.email || 'No email'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setExpandedId(expanded ? null : m.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Manage <ChevronDown className="h-3.5 w-3.5 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} /></button>
                      <button onClick={() => removeManager(m)} className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px]" style={{ backgroundColor: theme.hover, color: theme.error }} title="Remove manager"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="px-3.5 pb-4 pt-1 space-y-4" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                      {/* Access */}
                      <div className="pt-3">
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
                      </div>

                      {/* Login & access */}
                      <div>
                        <Label>Login &amp; access</Label>
                        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
                          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <div className="min-w-0"><p className="text-[11px]" style={{ color: theme.textMuted }}>Login page</p><p className="text-[13px] truncate" style={{ color: theme.text }}>{loginUrl}</p></div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <a href={loginUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px]" style={{ backgroundColor: theme.hover, color: theme.textMuted }} title="Open"><ExternalLink className="h-3.5 w-3.5" /></a>
                              <button onClick={() => copyText(`url-${m.id}`, loginUrl)} className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px]" style={{ backgroundColor: theme.hover, color: copied === `url-${m.id}` ? '#22c55e' : theme.textMuted }} title="Copy">{copied === `url-${m.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 px-3 py-2.5" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                            <div className="min-w-0"><p className="text-[11px]" style={{ color: theme.textMuted }}>Email</p><p className="text-[13px] truncate" style={{ color: theme.text }}>{m.email || '—'}</p></div>
                            {m.email && <button onClick={() => copyText(`email-${m.id}`, m.email!)} className="inline-flex items-center justify-center rounded-lg h-[30px] w-[30px] flex-shrink-0" style={{ backgroundColor: theme.hover, color: copied === `email-${m.id}` ? '#22c55e' : theme.textMuted }} title="Copy">{copied === `email-${m.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>}
                          </div>
                          <div className="flex items-center justify-between gap-3 px-3 py-2.5" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                            <div className="min-w-0"><p className="text-[11px]" style={{ color: theme.textMuted }}>Temp password</p><p className="text-[13px] font-mono truncate" style={{ color: theme.text }}>{m.visible_password ? (revealPw[m.id] ? m.visible_password : '••••••••') : 'Set by the manager'}</p></div>
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
