'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, X, Clock,
  User, Phone, Mail, Trash2, Pencil, AlertCircle, Check,
} from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';
import { CustomSelect } from '@/components/ui/custom-select';

interface Appt {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  appointment_time: string;
  duration: number | null;
  service_type: string | null;
  staff_name: string | null;
  notes: string | null;
  status: string;
  booking_source: string | null;
  external: boolean;
}

const DURATIONS = [15, 30, 45, 60, 90, 120];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Local date key (YYYY-MM-DD) of a UTC instant, in a given timezone.
function localDateKey(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
  } catch { return (iso || '').slice(0, 10); }
}
// Local time label (h:mm AM) of a UTC instant, in a given timezone.
function localTimeLabel(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso));
  } catch { return ''; }
}
function pad(n: number) { return String(n).padStart(2, '0'); }
function ymd(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function friendly(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function ClientCalendarPage() {
  const { client, loading: clientLoading } = useClient();
  const theme = useClientTheme();
  const primaryColor = theme.primary;

  const tz = (client as any)?.timezone || 'America/New_York';
  const defaultDuration = (client as any)?.appointment_duration || 30;

  const getAuthToken = () => localStorage.getItem('auth_token');
  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const todayKey = ymd(today.getFullYear(), today.getMonth(), today.getDate());
  const [selected, setSelected] = useState<string>(todayKey);

  // Redirect away if the agency has not enabled the calendar for this client.
  useEffect(() => {
    if (!clientLoading && client && (client as any).show_client_calendar !== true) {
      window.location.replace('/client/dashboard');
    }
  }, [clientLoading, client]);

  // Build the 6-week grid for the visible month.
  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startDow = first.getDay();
    const gridStart = new Date(cursor.y, cursor.m, 1 - startDow);
    const cells: { key: string; day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const dte = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      cells.push({ key: ymd(dte.getFullYear(), dte.getMonth(), dte.getDate()), day: dte.getDate(), inMonth: dte.getMonth() === cursor.m });
    }
    return cells;
  }, [cursor]);

  const fetchAppts = useCallback(async () => {
    if (!client?.id || grid.length === 0) return;
    setLoading(true);
    try {
      const from = grid[0].key;
      const to = grid[grid.length - 1].key;
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/calendar/appointments?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (r.ok) { const d = await r.json(); if (d.success) setAppts(d.appointments || []); }
    } catch { /* keep prior */ } finally { setLoading(false); }
  }, [client?.id, grid]);

  useEffect(() => { fetchAppts(); }, [fetchAppts]);

  // Bucket appointments by local date key.
  const byDay = useMemo(() => {
    const map: Record<string, Appt[]> = {};
    for (const a of appts) {
      const k = localDateKey(a.appointment_time, tz);
      (map[k] = map[k] || []).push(a);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    return map;
  }, [appts, tz]);

  const selectedAppts = byDay[selected] || [];
  const activeCount = (list: Appt[]) => list.filter(a => a.status !== 'canceled' && a.status !== 'cancelled').length;

  // ── Create / reschedule modal ──────────────────────────────────────────
  const [modal, setModal] = useState<null | { mode: 'create' | 'reschedule'; appt?: Appt }>(null);

  if (clientLoading || !client) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Hero */}
      <div className="mb-5 sm:mb-7 text-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
          <CalendarDays className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Calendar</h2>
        <p className="text-xs sm:text-[13px] mt-0.5" style={{ color: theme.textMuted }}>Appointments booked by your AI and by hand</p>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Month header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setCursor(c => { const d = new Date(c.y, c.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition hover:opacity-80" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }} aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCursor(c => { const d = new Date(c.y, c.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition hover:opacity-80" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }} aria-label="Next month">
              <ChevronRight className="w-4 h-4" />
            </button>
            <h3 className="text-base sm:text-lg font-semibold ml-1" style={{ color: theme.text }}>{MONTHS[cursor.m]} {cursor.y}</h3>
            {loading && <Loader2 className="w-4 h-4 animate-spin ml-1" style={{ color: theme.textMuted }} />}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setCursor({ y: today.getFullYear(), m: today.getMonth() }); setSelected(todayKey); }}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition hover:opacity-80" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
              Today
            </button>
            <button onClick={() => setModal({ mode: 'create' })}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition hover:opacity-90 flex items-center gap-1.5" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
          {/* Month grid */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="grid grid-cols-7">
              {WEEKDAYS.map(w => (
                <div key={w} className="py-2 text-center text-[11px] font-semibold" style={{ color: theme.textMuted4 || theme.textMuted, borderBottom: `1px solid ${theme.border}` }}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((cell, i) => {
                const dayAppts = byDay[cell.key] || [];
                const count = activeCount(dayAppts);
                const isSel = cell.key === selected;
                const isToday = cell.key === todayKey;
                return (
                  <button key={cell.key + i} onClick={() => setSelected(cell.key)}
                    className="min-h-[64px] sm:min-h-[84px] p-1.5 sm:p-2 text-left transition relative"
                    style={{
                      borderBottom: `1px solid ${theme.border}`, borderRight: (i % 7 !== 6) ? `1px solid ${theme.border}` : 'none',
                      backgroundColor: isSel ? (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)') : 'transparent',
                      opacity: cell.inMonth ? 1 : 0.4,
                    }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] sm:text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full"
                        style={isToday ? { backgroundColor: primaryColor, color: theme.primaryText } : { color: theme.text }}>{cell.day}</span>
                      {count > 0 && <span className="text-[10px] font-bold" style={{ color: primaryColor }}>{count}</span>}
                    </div>
                    <div className="mt-1 space-y-0.5 hidden sm:block">
                      {dayAppts.slice(0, 2).map(a => {
                        const canceled = a.status === 'canceled' || a.status === 'cancelled';
                        return (
                          <div key={a.id} className="text-[10px] truncate px-1 py-0.5 rounded" style={{ backgroundColor: canceled ? 'transparent' : (theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'), color: canceled ? theme.textMuted4 || theme.textMuted : theme.textMuted, textDecoration: canceled ? 'line-through' : 'none' }}>
                            {localTimeLabel(a.appointment_time, tz)} {a.customer_name || ''}
                          </div>
                        );
                      })}
                      {dayAppts.length > 2 && <div className="text-[10px] px-1" style={{ color: theme.textMuted4 || theme.textMuted }}>+{dayAppts.length - 2} more</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day panel */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold" style={{ color: theme.text }}>{friendly(selected)}</h4>
              <button onClick={() => setModal({ mode: 'create' })} className="text-xs font-semibold flex items-center gap-1 transition hover:opacity-80" style={{ color: primaryColor }}>
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            {selectedAppts.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarDays className="w-8 h-8 mx-auto mb-2" style={{ color: theme.textMuted4 || theme.textMuted, opacity: 0.5 }} />
                <p className="text-xs" style={{ color: theme.textMuted }}>No appointments this day</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedAppts.map(a => {
                  const canceled = a.status === 'canceled' || a.status === 'cancelled';
                  return (
                    <div key={a.id} className="rounded-xl p-3" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, opacity: canceled ? 0.6 : 1 }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primaryColor }} />
                            <span className="text-sm font-semibold" style={{ color: theme.text, textDecoration: canceled ? 'line-through' : 'none' }}>{localTimeLabel(a.appointment_time, tz)}</span>
                            {a.duration ? <span className="text-[11px]" style={{ color: theme.textMuted }}>· {a.duration} min</span> : null}
                          </div>
                          <p className="text-sm mt-1 truncate" style={{ color: theme.text }}>{a.customer_name || 'Appointment'}</p>
                          {a.service_type && <p className="text-[11px] mt-0.5 truncate" style={{ color: theme.textMuted }}>{a.service_type}{a.staff_name ? ` · ${a.staff_name}` : ''}</p>}
                          {a.customer_phone && <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: theme.textMuted }}><Phone className="w-3 h-3" /> {a.customer_phone}</p>}
                          {canceled && <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.errorBg, color: theme.error }}>Canceled</span>}
                          {a.external && !canceled && <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: theme.textMuted }}>External calendar</span>}
                        </div>
                        {!canceled && (
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <ApptActions appt={a} clientId={client!.id} tz={tz} theme={theme} primaryColor={primaryColor} onChanged={fetchAppts} onReschedule={() => setModal({ mode: 'reschedule', appt: a })} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {modal && client && (
        <BookingModal
          mode={modal.mode}
          appt={modal.appt}
          clientId={client.id}
          tz={tz}
          defaultDate={selected}
          defaultDuration={defaultDuration}
          theme={theme}
          primaryColor={primaryColor}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAppts(); }}
        />
      )}
    </div>
  );
}

// Per-appointment reschedule/cancel controls.
function ApptActions({ appt, clientId, tz, theme, primaryColor, onChanged, onReschedule }: any) {
  const [canceling, setCanceling] = useState(false);
  const getAuthToken = () => localStorage.getItem('auth_token');
  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const cancel = async () => {
    if (!confirm('Cancel this appointment? The customer is not notified automatically.')) return;
    setCanceling(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${clientId}/calendar/appointments/${appt.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (r.ok) onChanged();
    } finally { setCanceling(false); }
  };
  return (
    <>
      <button onClick={onReschedule} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMuted }} title="Reschedule">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={cancel} disabled={canceling} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80 disabled:opacity-50" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}`, color: theme.error }} title="Cancel">
        {canceling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </>
  );
}

// Create or reschedule modal. Pulls live availability for the chosen date and
// duration; a manual override lets the user book a time the engine would skip.
function BookingModal({ mode, appt, clientId, tz, defaultDate, defaultDuration, theme, primaryColor, onClose, onSaved }: any) {
  const getAuthToken = () => localStorage.getItem('auth_token');
  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  const isReschedule = mode === 'reschedule';
  const initialDate = isReschedule && appt ? new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(appt.appointment_time)) : defaultDate;
  const initialTime = isReschedule && appt ? new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(appt.appointment_time)) : '';

  const [date, setDate] = useState<string>(initialDate);
  const [time, setTime] = useState<string>(initialTime);
  const [duration, setDuration] = useState<number>(appt?.duration || defaultDuration);
  const [name, setName] = useState<string>(appt?.customer_name || '');
  const [phone, setPhone] = useState<string>(appt?.customer_phone || '');
  const [email, setEmail] = useState<string>(appt?.customer_email || '');
  const [service, setService] = useState<string>(appt?.service_type || '');
  const [staffName, setStaffName] = useState<string>(appt?.staff_name || '');
  const [notes, setNotes] = useState<string>(appt?.notes || '');
  const [override, setOverride] = useState(false);

  // Real services + staff for this client, so a manual booking carries the same
  // service (duration/kind) and provider the AI would set on a call.
  const [services, setServices] = useState<{ id: string; name: string; duration_minutes?: number | null; booking_mode?: string | null }[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role?: string | null }[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [sr, tr] = await Promise.all([
          fetch(`${getBackendUrl()}/api/client/${clientId}/services`, { headers: { Authorization: `Bearer ${getAuthToken()}` } }),
          fetch(`${getBackendUrl()}/api/client/${clientId}/staff`, { headers: { Authorization: `Bearer ${getAuthToken()}` } }),
        ]);
        if (sr.ok) { const d = await sr.json(); if (alive && d.success) setServices(d.services || []); }
        if (tr.ok) { const d = await tr.json(); if (alive && d.success) setStaffList(d.staff || []); }
      } catch { /* dropdowns fall back to free text / hidden */ }
    })();
    return () => { alive = false; };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [clientId]);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    if (!date) return;
    setSlotsLoading(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${clientId}/calendar/availability?date=${date}&duration=${duration}`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (r.ok) { const d = await r.json(); setSlots(d.success ? (d.slots || []) : []); }
      else setSlots([]);
    } catch { setSlots([]); } finally { setSlotsLoading(false); }
  }, [date, duration, clientId]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const submit = async () => {
    setErr(null);
    if (!isReschedule && !name.trim()) { setErr('Customer name is required.'); return; }
    if (!date || !time) { setErr('Pick a date and time.'); return; }
    setSaving(true);
    try {
      let r: Response;
      if (isReschedule) {
        r = await fetch(`${getBackendUrl()}/api/client/${clientId}/calendar/appointments/${appt.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify({ date, time, duration_minutes: duration, check_availability: !override }),
        });
      } else {
        r = await fetch(`${getBackendUrl()}/api/client/${clientId}/calendar/appointments`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify({ date, time, duration_minutes: duration, customer_name: name, customer_phone: phone || null, customer_email: email || null, service_type: service || null, staff_name: staffName || null, notes: notes || null, check_availability: !override }),
        });
      }
      const d = await r.json();
      if (!r.ok || !d.success) {
        if (d.code === 'slot_unavailable') setErr('That time is not open. Pick an open slot, or turn on "Let me book any time".');
        else setErr(d.error || 'Could not save the appointment.');
        return;
      }
      onSaved();
    } catch (e: any) { setErr(e.message || 'Could not save the appointment.'); } finally { setSaving(false); }
  };

  const inputStyle = { backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.text } as const;
  const ui = {
    inputStyle: { ...inputStyle },
    text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border,
    hover: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', accent: primaryColor, isDark: theme.isDark,
  };
  const durationOptions = DURATIONS.map(m => ({ value: String(m), label: `${m} min` }));
  const serviceOptions = [{ value: '', label: 'No specific service' }, ...services.map(s => ({ value: s.name, label: s.name }))];
  const staffOptions = [{ value: '', label: 'No preference' }, ...staffList.map(s => ({ value: s.name, label: s.role ? `${s.name} (${s.role})` : s.name }))];

  // Picking a service sets its name and, when the service defines one, its
  // default length, matching how a call booking derives duration from service.
  const onPickService = (name: string) => {
    setService(name);
    const svc = services.find(s => s.name === name);
    if (svc && svc.duration_minutes) { setDuration(Number(svc.duration_minutes)); setTime(''); }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }} onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between p-4 sm:p-5" style={{ backgroundColor: theme.card, borderBottom: `1px solid ${theme.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: theme.text }}>{isReschedule ? 'Reschedule appointment' : 'New appointment'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80" style={{ color: theme.textMuted }}><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {!isReschedule && (
            <>
              <Field label="Customer name" icon={User} theme={theme}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Phone" icon={Phone} theme={theme}>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
                </Field>
                <Field label="Email" icon={Mail} theme={theme}>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Service" theme={theme}>
                  {services.length > 0 ? (
                    <CustomSelect value={service} onChange={onPickService} options={serviceOptions} placeholder="No specific service" ui={ui} />
                  ) : (
                    <input value={service} onChange={e => setService(e.target.value)} placeholder="Consultation" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
                  )}
                </Field>
                {staffList.length > 0 ? (
                  <Field label="Staff" theme={theme}>
                    <CustomSelect value={staffName} onChange={setStaffName} options={staffOptions} placeholder="No preference" ui={ui} />
                  </Field>
                ) : (
                  <Field label="Staff (optional)" theme={theme}>
                    <input value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="Anyone" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
                  </Field>
                )}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Field label="Date" theme={theme}>
              <input type="date" value={date} onChange={e => { setDate(e.target.value); setTime(''); }} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Length" theme={theme}>
              <CustomSelect value={String(duration)} onChange={v => { setDuration(Number(v)); setTime(''); }} options={durationOptions} ui={ui} />
            </Field>
          </div>

          <div>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: theme.text }}>Time</p>
            {slotsLoading ? (
              <div className="py-3 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.textMuted }} /></div>
            ) : slots.length === 0 ? (
              <div className="p-2.5 rounded-lg flex items-start gap-2 mb-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
                <p className="text-[11px]" style={{ color: theme.warningText }}>No open times on this date. Turn on the override below to book anyway.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {slots.map(s => (
                  <button key={s} onClick={() => setTime(s)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition"
                    style={{ backgroundColor: time === s ? primaryColor : (theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'), color: time === s ? theme.primaryText : theme.textMuted }}>{s}</button>
                ))}
              </div>
            )}
            {override && (
              <input value={time} onChange={e => setTime(e.target.value)} placeholder="e.g. 2:30 PM" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            )}
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={override} onChange={e => { setOverride(e.target.checked); if (!e.target.checked) setTime(''); }} className="accent-current" style={{ accentColor: primaryColor }} />
              <span className="text-[11px]" style={{ color: theme.textMuted }}>Let me book any time (skip the open-slots check)</span>
            </label>
          </div>

          <Field label="Notes (optional)" theme={theme}>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={inputStyle} />
          </Field>

          {err && <p className="text-[11px] font-medium" style={{ color: theme.error }}>{err}</p>}

          <button onClick={submit} disabled={saving} className="w-full py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> {isReschedule ? 'Save new time' : 'Book appointment'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, theme, children }: any) {
  return (
    <div>
      <p className="text-[11px] font-semibold mb-1 flex items-center gap-1" style={{ color: theme.text }}>
        {Icon && <Icon className="w-3 h-3" style={{ color: theme.textMuted }} />} {label}
      </p>
      {children}
    </div>
  );
}
