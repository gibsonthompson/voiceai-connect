'use client';

// ============================================================================
// /cc/availability - the agent's own availability page.
//
// An agent's self-service surface. Their working hours are set by their manager
// (on the Agents page), but from here an agent can OVERRIDE those hours to make
// themselves available right now - take calls even though they are outside their
// set hours - and turn it back off when they are done. It also shows their
// current status and whether they are on schedule, so the quiet is never a
// mystery.
//
// Read-only snapshot comes from GET /api/cc/agent/me; the override is written
// with POST /api/cc/agent/override (both agent-token scoped). Status itself is
// toggled from the always-on control in the corner of the console (that control
// owns the presence heartbeat), so here status is shown, not changed, to avoid
// two writers fighting over it.
//
// Theme-aware (useTheme inline styles) so it white-labels in light and dark.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Clock, Loader2, CheckCircle2, AlertCircle, CalendarClock, Zap } from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';

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
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

// "09:00" -> "9:00 AM". Tolerates bad input by echoing it back.
function fmtHM(hm: string | undefined): string {
  if (!hm || typeof hm !== 'string' || !hm.includes(':')) return hm || '';
  const [hRaw, mRaw] = hm.split(':');
  const h = Number(hRaw); const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return hm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// A day's windows, tolerating the legacy single {start,end} shape.
function windowsFor(d: DayCfg | undefined): Win[] {
  if (!d) return [];
  if (Array.isArray(d.windows) && d.windows.length) return d.windows;
  if (d.start && d.end) return [{ start: d.start, end: d.end }];
  return [];
}

export default function AgentAvailability() {
  const { isAgent, user } = useAgency();
  const theme = useTheme();

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${base}/api/cc/agent/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok && d.success) setMe(d as Me);
    } catch { /* keep last good */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isAgent) load(); else setLoading(false); }, [isAgent, load]);
  // Reflect a change made from the corner status control / a manager edit.
  useEffect(() => {
    if (!isAgent) return;
    const iv = setInterval(load, 20000);
    return () => clearInterval(iv);
  }, [isAgent, load]);

  const setOverride = useCallback(async (next: boolean) => {
    setSaving(true); setErr(null);
    // Optimistic: flip locally so the page responds instantly.
    setMe((m) => (m ? { ...m, override: next } : m));
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${base}/api/cc/agent/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ override: next }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.error || 'Could not update your availability.');
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Could not update your availability.');
      await load(); // reconcile to the server truth
    } finally { setSaving(false); }
  }, [load]);

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;

  if (!isAgent) return null;

  const name = me?.displayName
    || [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()
    || user?.email
    || 'You';

  const available = me?.status !== 'away';
  const scheduleEnabled = !!me?.scheduleEnabled;
  const override = !!me?.override;
  const onSchedule = me?.onSchedule !== false;
  // "Eligible for calls right now" = Available AND (no schedule, or on schedule, or override on).
  const eligibleNow = available && (!scheduleEnabled || onSchedule || override);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <Clock className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Availability</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>{name} · Agent</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: theme.textMuted }}>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your availability...
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {/* At-a-glance: are you getting calls right now? */}
          <div className="rounded-2xl p-5 sm:p-6" style={card}>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: eligibleNow ? theme.successBg : theme.hover }}>
                {eligibleNow
                  ? <CheckCircle2 className="h-5 w-5" style={{ color: theme.success }} />
                  : <AlertCircle className="h-5 w-5" style={{ color: theme.textMuted }} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: theme.text }}>
                  {eligibleNow ? 'You can take calls right now' : 'You are not being offered calls'}
                </p>
                <p className="text-[12.5px] mt-0.5 leading-relaxed" style={{ color: theme.textMuted }}>
                  {!available
                    ? 'You are set to Away. Use the status control in the corner of the console to go Available.'
                    : scheduleEnabled && !onSchedule && !override
                    ? 'You are outside your set working hours. Turn on "Available now" below to take calls anyway.'
                    : override
                    ? 'You are available outside your set hours (override on).'
                    : scheduleEnabled
                    ? 'You are within your set working hours.'
                    : 'You have no set working hours, so you are available whenever your status is Available.'}
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: available ? theme.successBg : theme.hover, color: available ? theme.success : theme.textMuted }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: available ? theme.success : theme.textSubtle }} />
                {available ? 'Available' : 'Away'}
              </span>
            </div>
          </div>

          {/* The override: make myself available now, outside my hours. */}
          {scheduleEnabled && (
            <div className="rounded-2xl p-5 sm:p-6" style={card}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text }}>
                    <Zap className="h-4 w-4" style={{ color: theme.primary }} /> Available now
                  </p>
                  <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: theme.textMuted }}>
                    {override
                      ? 'On: you will be offered calls even when you are outside your set hours. This stays on until you turn it off.'
                      : 'Turn this on to take calls now even though you are outside your set working hours. It stays on until you turn it off.'}
                  </p>
                </div>
                <button
                  onClick={() => setOverride(!override)}
                  disabled={saving}
                  role="switch"
                  aria-checked={override}
                  aria-label="Available now, outside my hours"
                  className="relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition disabled:opacity-50"
                  style={{ backgroundColor: override ? theme.primary : theme.hover }}
                >
                  <span className="inline-block h-5 w-5 transform rounded-full bg-white transition"
                    style={{ transform: override ? 'translateX(22px)' : 'translateX(3px)', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                </button>
              </div>

              {/* A direct CTA when they are off-hours and the override is off. */}
              {!override && !onSchedule && (
                <button
                  onClick={() => setOverride(true)}
                  disabled={saving}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50"
                  style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Make me available now
                </button>
              )}
              {err && <p className="text-[12px] mt-3" style={{ color: theme.error }}>{err}</p>}
            </div>
          )}

          {/* The schedule itself (read-only; the manager sets it). */}
          <div className="rounded-2xl p-5 sm:p-6" style={card}>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="h-4 w-4" style={{ color: theme.textMuted }} />
              <p className="text-sm font-semibold" style={{ color: theme.text }}>Your working hours</p>
            </div>
            {!scheduleEnabled ? (
              <p className="text-[12.5px] leading-relaxed" style={{ color: theme.textMuted }}>
                You do not have set working hours. You are available for calls whenever your status is Available.
                Your manager can set working hours for you from the Agents page.
              </p>
            ) : (
              <>
                <p className="text-[12px] mb-3" style={{ color: theme.textSubtle }}>
                  Set by your manager{me?.timezone ? ` · times shown in ${me.timezone}` : ''}.
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
                          {on && wins.length
                            ? wins.map((w) => `${fmtHM(w.start)} - ${fmtHM(w.end)}`).join(', ')
                            : 'Off'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11.5px] mt-3 leading-relaxed" style={{ color: theme.textSubtle }}>
                  Need your hours changed for good? Ask your manager. For a one-off, use "Available now" above.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
