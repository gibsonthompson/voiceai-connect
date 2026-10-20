'use client';

// ============================================================================
// components/cc/CcAgentSettings.tsx
//
// A call-center agent's own settings, shown at /cc/settings for agents (managers
// get the manager settings on the same route). Sections:
//   - Account & security: name, email, change password.
//   - Availability: current status, working hours (read-only, manager-set), and
//     the "Available now" override so an agent can take calls outside their set
//     hours and turn it back off.
//   - Notifications: enable desktop alerts for incoming call pops.
//   - How calls reach you: take calls in the browser or on your phone.
//
// Reads a snapshot from GET /api/cc/agent/me; writes with POST /api/cc/agent/override,
// POST /api/cc/agent/delivery, and POST /api/auth/change-password. Presence status
// itself is owned by the heartbeat control in the corner (shown here, not changed),
// so the two never fight over it.
//
// Theme-aware (useTheme inline styles) so it white-labels in light and dark.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Clock, Loader2, CheckCircle2, AlertCircle, CalendarClock, Zap, Lock, Eye, EyeOff,
  Bell, BellOff, Monitor, Smartphone, Save, Check, User,
} from 'lucide-react';
import { useAgency } from '../../app/agency/context';
import { useTheme } from '../../hooks/useTheme';

interface Win { start: string; end: string }
interface DayCfg { on?: boolean; windows?: Win[]; start?: string; end?: string }
interface Hours { enabled?: boolean; override?: boolean; days?: Record<string, DayCfg> }
interface Me {
  displayName: string | null;
  callDelivery: string | null;
  agentPhone: string | null;
  availabilityHours: Hours | null;
  scheduleEnabled: boolean;
  override: boolean;
  onSchedule: boolean;
  status: 'available' | 'away';
  timezone: string | null;
}

const DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Monday' }, { key: 'tue', label: 'Tuesday' }, { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' }, { key: 'fri', label: 'Friday' }, { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

function fmtHM(hm: string | undefined): string {
  if (!hm || typeof hm !== 'string' || !hm.includes(':')) return hm || '';
  const [h, m] = hm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
function windowsFor(d: DayCfg | undefined): Win[] {
  if (!d) return [];
  if (Array.isArray(d.windows) && d.windows.length) return d.windows;
  if (d.start && d.end) return [{ start: d.start, end: d.end }];
  return [];
}
function fmtPhone(p: string): string {
  const d = (p || '').replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}

const API = process.env.NEXT_PUBLIC_API_URL || '';
function authToken(): string | null { try { return localStorage.getItem('auth_token'); } catch { return null; } }

export default function CcAgentSettings() {
  const { user } = useAgency();
  const theme = useTheme();

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  // Availability override
  const [savingOverride, setSavingOverride] = useState(false);
  const [overrideErr, setOverrideErr] = useState<string | null>(null);

  // Call delivery
  const [delivery, setDelivery] = useState<'browser' | 'phone'>('browser');
  const [agentPhone, setAgentPhone] = useState('');
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [deliveryMsg, setDeliveryMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Notifications
  const notifySupported = typeof window !== 'undefined' && 'Notification' in window;
  const [notifPerm, setNotifPerm] = useState<string>(notifySupported ? Notification.permission : 'denied');

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/cc/agent/me`, { headers: { Authorization: `Bearer ${authToken()}` } });
      const d = await r.json();
      if (r.ok && d.success) {
        setMe(d as Me);
        setDelivery(d.callDelivery === 'phone' ? 'phone' : 'browser');
        setAgentPhone(d.agentPhone ? fmtPhone(d.agentPhone) : '');
      }
    } catch { /* keep last good */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 20000); return () => clearInterval(iv); }, [load]);

  const setOverride = useCallback(async (next: boolean) => {
    setSavingOverride(true); setOverrideErr(null);
    setMe((m) => (m ? { ...m, override: next } : m));
    try {
      const r = await fetch(`${API}/api/cc/agent/override`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
        body: JSON.stringify({ override: next }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Could not update your availability.');
      await load();
    } catch (e: any) { setOverrideErr(e?.message || 'Could not update your availability.'); await load(); }
    finally { setSavingOverride(false); }
  }, [load]);

  const saveDelivery = useCallback(async () => {
    setSavingDelivery(true); setDeliveryMsg(null);
    try {
      const r = await fetch(`${API}/api/cc/agent/delivery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
        body: JSON.stringify({ callDelivery: delivery, agentPhone: delivery === 'phone' ? agentPhone : '' }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Could not update call delivery.');
      setDeliveryMsg({ ok: true, text: 'Saved.' });
      setTimeout(() => setDeliveryMsg(null), 2500);
      await load();
    } catch (e: any) { setDeliveryMsg({ ok: false, text: e?.message || 'Could not save.' }); }
    finally { setSavingDelivery(false); }
  }, [delivery, agentPhone, load]);

  const changePassword = useCallback(async () => {
    setPwMsg(null);
    if (!curPw) { setPwMsg({ ok: false, text: 'Enter your current password.' }); return; }
    if (!newPw || newPw.length < 8) { setPwMsg({ ok: false, text: 'New password must be at least 8 characters.' }); return; }
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: 'New passwords do not match.' }); return; }
    setSavingPw(true);
    try {
      const r = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !(d.success || d.message)) throw new Error(d.error || 'Could not change password.');
      setPwMsg({ ok: true, text: 'Password changed.' });
      setCurPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwMsg(null), 3000);
    } catch (e: any) { setPwMsg({ ok: false, text: e?.message || 'Could not change password.' }); }
    finally { setSavingPw(false); }
  }, [curPw, newPw, confirmPw]);

  const requestNotif = useCallback(async () => {
    if (!notifySupported) return;
    try { const p = await Notification.requestPermission(); setNotifPerm(p); } catch { /* ignore */ }
  }, [notifySupported]);

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;

  const name = me?.displayName || [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.email || 'You';
  const available = me?.status !== 'away';
  const scheduleEnabled = !!me?.scheduleEnabled;
  const override = !!me?.override;
  const onSchedule = me?.onSchedule !== false;
  const eligibleNow = available && (!scheduleEnabled || onSchedule || override);
  const deliveryDirty = me ? (delivery !== (me.callDelivery === 'phone' ? 'phone' : 'browser') || (delivery === 'phone' && agentPhone.replace(/\D/g, '') !== (me.agentPhone || '').replace(/\D/g, ''))) : false;

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <User className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Settings</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>{name} · Agent</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: theme.textMuted }}>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your settings...
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">

          {/* ---- Availability: are you getting calls right now? ---- */}
          <div className="rounded-2xl p-5 sm:p-6" style={card}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4" style={{ color: theme.textMuted }} />
              <p className="text-sm font-semibold" style={{ color: theme.text }}>Availability</p>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: eligibleNow ? theme.successBg : theme.hover, color: eligibleNow ? theme.success : theme.textMuted }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: eligibleNow ? theme.success : theme.textSubtle }} />
                {eligibleNow ? 'Taking calls' : 'Paused'}
              </span>
            </div>

            <div className="flex items-start gap-3 rounded-xl p-3.5" style={{ backgroundColor: theme.hover }}>
              {eligibleNow
                ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.success }} />
                : <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.textMuted }} />}
              <div className="min-w-0">
                <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                  {eligibleNow ? 'You can take calls right now' : 'You are not being offered calls'}
                </p>
                <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: theme.textMuted }}>
                  {!available
                    ? 'You are paused. Tap the "Taking calls" control in the bottom corner of the console to start.'
                    : scheduleEnabled && !onSchedule && !override
                    ? 'You are outside your set working hours. Turn on "Take calls outside my hours" below to take calls anyway.'
                    : override ? 'You are taking calls outside your set hours.'
                    : scheduleEnabled ? 'You are within your set working hours.'
                    : 'You have no set working hours, so you take calls whenever you are on.'}
                </p>
              </div>
            </div>

            {/* The override - one clean row: label + toggle. */}
            {scheduleEnabled && (
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium flex items-center gap-2 min-w-0" style={{ color: theme.text }}>
                    <Zap className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />
                    <span className="truncate">Take calls outside my hours</span>
                  </p>
                  <button onClick={() => setOverride(!override)} disabled={savingOverride} role="switch" aria-checked={override}
                    aria-label="Take calls outside my hours"
                    className="relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition disabled:opacity-50"
                    style={{ backgroundColor: override ? theme.primary : theme.hover }}>
                    {savingOverride
                      ? <Loader2 className="h-4 w-4 animate-spin mx-auto" style={{ color: override ? theme.primaryText : theme.textMuted }} />
                      : <span className="inline-block h-5 w-5 rounded-full bg-white transition"
                          style={{ transform: override ? 'translateX(22px)' : 'translateX(3px)', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />}
                  </button>
                </div>
                {overrideErr && <p className="text-[12px] mt-2" style={{ color: theme.error }}>{overrideErr}</p>}
              </div>
            )}

            {/* Working hours (read-only).
                FUTURE (noted, not built): these hours could drive real
                scheduling - e.g. an agent-editable schedule with a "last updated"
                stamp, shift swaps, or auto-clearing the override at the end of a
                shift. For now hours are manager-set and display-only, and the
                override is a manual on/off. */}
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
              <div className="flex items-center gap-2 mb-1">
                <CalendarClock className="h-4 w-4" style={{ color: theme.textMuted }} />
                <p className="text-[13px] font-medium" style={{ color: theme.text }}>Your working hours</p>
              </div>
              {!scheduleEnabled ? (
                <p className="text-[12px] leading-relaxed" style={{ color: theme.textMuted }}>
                  You do not have set working hours, so you take calls whenever you are on.
                  Your manager can set working hours for you from the Agents page.
                </p>
              ) : (
                <>
                  <p className="text-[11.5px] mb-2.5" style={{ color: theme.textSubtle }}>
                    Set by your manager{me?.timezone ? ` · times in ${me.timezone}` : ''}.
                  </p>
                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.borderSubtle}` }}>
                    {DAYS.map((day, i) => {
                      const cfg = me?.availabilityHours?.days?.[day.key];
                      const on = !!(cfg && cfg.on);
                      const wins = on ? windowsFor(cfg) : [];
                      return (
                        <div key={day.key} className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                          style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}>
                          <span className="text-[13px] font-medium" style={{ color: theme.text }}>{day.label}</span>
                          <span className="text-[12.5px] text-right" style={{ color: on && wins.length ? theme.textMuted : theme.textSubtle }}>
                            {on && wins.length ? wins.map((w) => `${fmtHM(w.start)} - ${fmtHM(w.end)}`).join(', ') : 'Off'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ---- How calls reach you ---- */}
          <div className="rounded-2xl p-5 sm:p-6" style={card}>
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="h-4 w-4" style={{ color: theme.textMuted }} />
              <p className="text-sm font-semibold" style={{ color: theme.text }}>How calls reach you</p>
            </div>
            <p className="text-[12px] mb-3 leading-relaxed" style={{ color: theme.textMuted }}>
              When you take an escalated caller, do you want them in your browser or on your phone?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {([['browser', 'In the browser', Monitor], ['phone', 'On my phone', Smartphone]] as const).map(([val, lbl, Icon]) => {
                const active = delivery === val;
                return (
                  <button key={val} onClick={() => setDelivery(val)}
                    className="flex items-center gap-2 rounded-xl px-3.5 py-3 text-[13px] font-medium transition"
                    style={active
                      ? { backgroundColor: theme.primary15, color: theme.primary, border: `1px solid ${theme.primary}` }
                      : { backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid transparent` }}>
                    <Icon className="h-4 w-4 flex-shrink-0" /> {lbl}
                  </button>
                );
              })}
            </div>
            {delivery === 'phone' && (
              <div className="mt-3">
                <Label>Your phone number</Label>
                <input value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} placeholder="(555) 555-5555"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
              </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
              {deliveryMsg && (
                <span className="text-[12px] mr-auto inline-flex items-center gap-1.5" style={{ color: deliveryMsg.ok ? theme.success : theme.error }}>
                  {deliveryMsg.ok && <Check className="h-3.5 w-3.5" />}{deliveryMsg.text}
                </span>
              )}
              <button onClick={saveDelivery} disabled={savingDelivery || !deliveryDirty}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                {savingDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
            </div>
          </div>

          {/* ---- Notifications ---- */}
          <div className="rounded-2xl p-5 sm:p-6" style={card}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text }}>
                  <Bell className="h-4 w-4" style={{ color: theme.textMuted }} /> Desktop alerts
                </p>
                <p className="text-[12px] mt-1 leading-relaxed" style={{ color: theme.textMuted }}>
                  Get a desktop notification when a caller is offered to you, even if this tab is in the background.
                </p>
              </div>
              {!notifySupported ? (
                <span className="text-[12px] flex-shrink-0" style={{ color: theme.textSubtle }}>Not supported</span>
              ) : notifPerm === 'granted' ? (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold flex-shrink-0" style={{ color: theme.success }}>
                  <CheckCircle2 className="h-4 w-4" /> On
                </span>
              ) : notifPerm === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 text-[12px] flex-shrink-0" style={{ color: theme.textMuted }}>
                  <BellOff className="h-4 w-4" /> Blocked in browser
                </span>
              ) : (
                <button onClick={requestNotif}
                  className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold flex-shrink-0 transition"
                  style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  <Bell className="h-4 w-4" /> Enable
                </button>
              )}
            </div>
            {notifPerm === 'denied' && (
              <p className="text-[11.5px] mt-3 leading-relaxed" style={{ color: theme.textSubtle }}>
                Alerts are blocked for this site in your browser. Turn them on in your browser's site settings, then reload.
              </p>
            )}
          </div>

          {/* ---- Account & security ---- */}
          <div className="rounded-2xl p-5 sm:p-6" style={card}>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4" style={{ color: theme.textMuted }} />
              <p className="text-sm font-semibold" style={{ color: theme.text }}>Account &amp; security</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <Label>Name</Label>
                <div className="rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>{name}</div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="rounded-xl px-3 py-2.5 text-sm truncate" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>{user?.email || '-'}</div>
              </div>
            </div>

            <p className="text-[12.5px] font-medium mb-2.5" style={{ color: theme.text }}>Change password</p>
            <div className="space-y-2.5">
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={curPw} onChange={(e) => setCurPw(e.target.value)}
                  placeholder="Current password" className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm outline-none" style={field} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} aria-label={showPw ? 'Hide passwords' : 'Show passwords'}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input type={showPw ? 'text' : 'password'} value={newPw} onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min 8 characters)" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
              <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Confirm new password" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              {pwMsg && (
                <span className="text-[12px] mr-auto inline-flex items-center gap-1.5" style={{ color: pwMsg.ok ? theme.success : theme.error }}>
                  {pwMsg.ok && <Check className="h-3.5 w-3.5" />}{pwMsg.text}
                </span>
              )}
              <button onClick={changePassword} disabled={savingPw || !(curPw || newPw || confirmPw)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Change password
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
