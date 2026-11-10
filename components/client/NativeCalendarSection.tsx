'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Loader2, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { SectionCard } from '@/components/client/SectionCard';

// The built-in VoiceAI Connect calendar: the AI books straight into the
// platform's own schedule, no external calendar needed. Bookings still flow
// into the automations engine exactly like Google/GHL bookings do. Business
// hours are shared with the rest of the dashboard (set on My Business), so this
// card only selects the provider, sets the default appointment length, and
// points to where the schedule lives.
interface NativeSettings {
  is_native: boolean;
  provider: string | null;
  google_connected: boolean;
  ghl_connected: boolean;
  show_client_calendar: boolean;
  appointment_duration: number;
  timezone: string;
}

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function NativeCalendarSection({ client, theme, primaryColor }: { client: any; theme: any; primaryColor: string }) {
  const [settings, setSettings] = useState<NativeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingDuration, setSavingDuration] = useState(false);
  const [durationSaved, setDurationSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const getAuthToken = () => localStorage.getItem('auth_token');
  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  const fetchSettings = async () => {
    if (!client?.id) return;
    setLoading(true);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/calendar/settings`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (r.ok) {
        const d = await r.json();
        if (d.success) setSettings(d);
      }
    } catch { /* leave null, card shows the default enable state */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [client?.id]);

  const enable = async () => {
    if (!client?.id) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/calendar/native/enable`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({}),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Could not turn on the calendar');
      await fetchSettings();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  const disable = async () => {
    if (!client?.id) return;
    if (!confirm('Turn off the built-in calendar? Your AI will stop booking here. Existing appointments are kept.')) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/calendar/native/disable`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({}),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Could not turn off the calendar');
      await fetchSettings();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  const saveDuration = async (minutes: number) => {
    if (!client?.id) return;
    setSettings(s => (s ? { ...s, appointment_duration: minutes } : s));
    setSavingDuration(true); setDurationSaved(false); setErr(null);
    try {
      const r = await fetch(`${getBackendUrl()}/api/client/${client.id}/calendar/native/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` }, body: JSON.stringify({ appointment_duration: minutes }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Could not save');
      setDurationSaved(true); setTimeout(() => setDurationSaved(false), 2200);
    } catch (e: any) { setErr(e.message); } finally { setSavingDuration(false); }
  };

  const isNative = !!settings?.is_native;
  const otherProvider = settings?.google_connected ? 'Google Calendar' : (settings?.ghl_connected ? 'your CRM calendar' : null);

  return (
    <SectionCard
      icon={CalendarCheck}
      title="VoiceAI Connect Calendar"
      subtitle={isNative ? 'Your AI books into the built-in calendar' : 'A built-in calendar, no outside account needed'}
      live={isNative}
      theme={theme}
      primaryColor={primaryColor}
    >
      {loading ? (
        <div className="flex items-center justify-center py-3"><Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.textMuted4 || theme.textMuted }} /></div>
      ) : isNative ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl p-3 sm:p-3.5" style={{ backgroundColor: theme.successBg, border: `1px solid ${theme.successBorder}` }}>
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: theme.success }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: theme.success }} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight" style={{ color: theme.successText }}>Built-in calendar active</p>
              <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: theme.textMuted }}>The AI books on the call and every booking triggers your automations.</p>
            </div>
          </div>

          {/* Default appointment length */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold" style={{ color: theme.text }}>Default appointment length</p>
              {savingDuration ? (
                <span className="text-[11px] flex items-center gap-1" style={{ color: theme.textMuted }}><Loader2 className="w-3 h-3 animate-spin" /> Saving</span>
              ) : durationSaved ? (
                <span className="text-[11px] flex items-center gap-1" style={{ color: theme.successText }}><Check className="w-3 h-3" /> Saved</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map(m => {
                const active = (settings?.appointment_duration || 30) === m;
                return (
                  <button key={m} onClick={() => saveDuration(m)} disabled={savingDuration}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition disabled:opacity-60"
                    style={{ backgroundColor: active ? primaryColor : (theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'), color: active ? theme.primaryText : theme.textMuted }}>
                    {m} min
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-lg text-[11px] sm:text-xs leading-relaxed" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.textMuted }}>
            Your open times come from the business hours on your{' '}
            <a href="/client/my-business" className="font-semibold underline" style={{ color: primaryColor }}>My Business</a> page. See and manage every booking on the{' '}
            <a href="/client/calendar" className="font-semibold underline" style={{ color: primaryColor }}>Calendar</a> tab.
          </div>

          <button onClick={disable} disabled={busy}
            className="w-full py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: theme.errorBg, color: theme.error, border: `1px solid ${theme.errorBorder}` }}>
            {busy ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Turning off...</span> : 'Turn off built-in calendar'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
            No calendar account to connect. Turn this on and your AI books appointments straight into VoiceAI Connect, 24/7, using your business hours, then texts you the details and runs your automations.
          </p>

          {otherProvider && (
            <div className="p-2.5 sm:p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
              <p className="text-xs sm:text-sm font-medium" style={{ color: theme.warningText }}>You currently book into {otherProvider}. Turning on the built-in calendar makes it the one your AI uses instead.</p>
            </div>
          )}

          <button onClick={enable} disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
            style={{ backgroundColor: primaryColor, color: theme.primaryText }}>
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Turning on...</> : <>Use the built-in calendar <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      )}

      {err && <p className="mt-2 text-[11px] font-medium text-center" style={{ color: theme.error }}>{err}</p>}
    </SectionCard>
  );
}
