'use client';

// Google Calendar connection for the call-center business config. Shows whether
// the business has a calendar connected (and which account), and lets the
// manager start the OAuth connect or disconnect. Connect is a full-page redirect
// to the backend OAuth route (it carries this page as the return URL), so the
// business lands back here when Google finishes. Status/disconnect are keyed by
// clientId. Self-contained card.
//
// Granular consent: Google lets the user UNCHECK the calendar permission while
// still signing in. If they do, we get tokens but no calendar access, so the AI
// can't actually book. The backend now refuses to mark that "connected" (returns
// ?error=calendar_scope_missing), and the status endpoint reports calendar_access
// so an already-bad connection surfaces a reconnect prompt here.

import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Loader2, Check, Link2, Link2Off, AlertTriangle } from 'lucide-react';

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

export default function CcCalendar({ clientId, theme }: { clientId: string; theme: any }) {
  const [connected, setConnected] = useState(false);
  const [calendarAccess, setCalendarAccess] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  const [scopeError, setScopeError] = useState(false);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API()}/api/auth/google-calendar/status/${clientId}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); setConnected(!!d.connected); setEmail(d.email || null); setCalendarAccess(d.calendar_access !== false); }
    } catch { /* keep */ } finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  // Returning from the OAuth round-trip lands here with ?success=calendar_connected
  // or, when the calendar permission was not granted, ?error=calendar_scope_missing.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const clean = (key: string) => { const url = new URL(window.location.href); url.searchParams.delete(key); window.history.replaceState({}, '', url.toString()); };
    if (sp.get('success') === 'calendar_connected') {
      setJustConnected(true); clean('success');
      setTimeout(() => setJustConnected(false), 4000);
    }
    if (sp.get('error') === 'calendar_scope_missing') {
      setScopeError(true); clean('error');
    }
  }, []);

  const connect = () => {
    setScopeError(false);
    const ret = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `${API()}/api/auth/google-calendar/connect?clientId=${clientId}&return=${ret}`;
  };

  const disconnect = async () => {
    if (!confirm('Disconnect Google Calendar for this business? The AI will stop booking into it.')) return;
    setBusy(true);
    try {
      const r = await fetch(`${API()}/api/auth/google-calendar/disconnect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ clientId }),
      });
      if (r.ok) { setConnected(false); setEmail(null); setCalendarAccess(true); }
    } catch { /* non-fatal */ } finally { setBusy(false); }
  };

  // Reconnect = fully revoke the existing grant, THEN start a fresh connect, so
  // Google shows the complete consent screen again (including the calendar
  // permission checkbox). A plain re-connect can skip the granular checkboxes
  // when a partial grant already exists on the account.
  const reconnect = async () => {
    setBusy(true);
    try {
      await fetch(`${API()}/api/auth/google-calendar/disconnect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ clientId }),
      });
    } catch { /* non-fatal: still try a fresh connect */ }
    connect();
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  // "connected" but the calendar scope was never granted: tokens exist, booking can't work.
  const needsReconnect = connected && !calendarAccess;

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={card}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><CalendarDays className="h-4 w-4" style={{ color: theme.primary }} /></div>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Google Calendar</h2>
          <p className="text-[12px]" style={{ color: theme.textMuted }}>Connect the business owner&apos;s calendar so the AI can check availability and book.</p>
        </div>
      </div>

      {(scopeError || needsReconnect) && (
        <div className="rounded-xl p-3 mb-3 flex items-start gap-2.5" style={{ backgroundColor: theme.warningBg, border: `1px solid ${theme.warningBorder}` }}>
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: theme.warning }} />
          <div className="text-[12px] leading-relaxed" style={{ color: theme.warning }}>
            <span className="font-semibold">Calendar access was not granted.</span> The sign-in worked, but the box for &quot;View and edit events on all your calendars&quot; was left unchecked, so the AI can&apos;t actually book yet. Reconnect and check that box to finish.
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-2" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Checking connection...</div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
          <div className="min-w-0 flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: needsReconnect ? theme.warning : connected ? theme.success : theme.textSubtle }} />
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: theme.text }}>{needsReconnect ? 'Connected, but no calendar access' : connected ? 'Connected' : 'Not connected'}</p>
              {connected && email && <p className="text-[12px] truncate" style={{ color: theme.textMuted }}>{email}</p>}
              {!connected && <p className="text-[12px]" style={{ color: theme.textMuted }}>The AI will collect requests but cannot auto-book until a calendar is connected.</p>}
            </div>
          </div>
          {needsReconnect ? (
            <button onClick={reconnect} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold flex-shrink-0 disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Reconnect
            </button>
          ) : connected ? (
            <button onClick={disconnect} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium flex-shrink-0 disabled:opacity-50" style={{ backgroundColor: theme.hover, color: theme.text }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />} Disconnect
            </button>
          ) : (
            <button onClick={connect} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              <Link2 className="h-4 w-4" /> Connect
            </button>
          )}
        </div>
      )}
      {justConnected && <p className="text-[12px] mt-2 inline-flex items-center gap-1.5" style={{ color: theme.success }}><Check className="h-3.5 w-3.5" /> Calendar connected.</p>}
    </div>
  );
}