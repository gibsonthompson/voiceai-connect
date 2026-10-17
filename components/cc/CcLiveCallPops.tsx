'use client';

// ============================================================================
// components/cc/CcLiveCallPops.tsx
//
// Real-time live-call pop-ups for a call-center MANAGER. Mounted once in the /cc
// shell, so it rides along on every /cc page: whatever the manager is doing, a
// card pops for each call in progress, with the business, caller, a running
// elapsed timer, and a jump straight to the live monitor (listen in + take
// over). Managers only, agents already get the escalation screen-pop.
//
// Real-time + cross-tab:
//  - In the app: it polls the same live-calls endpoint the wallboard uses (4s)
//    and renders over any /cc page, so a manager on another cc tab still sees it.
//  - Outside the app: when a NEW call starts it fires a desktop notification
//    (Notifications API), so it surfaces even when the manager is on a different
//    browser tab or app. Calls already live when the dashboard opens are shown
//    in-app but do not fire a notification (no burst on load).
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Phone, X, Headphones, Bell, Check, FileText } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');
const POLL_MS = 4000;

interface LiveCall {
  sessionId: string;
  clientId: string;
  businessName: string;
  callerNumber: string | null;
  status: string;
  humanOnCall: boolean;
  beingMonitored: boolean;
  startedAt: string;
}

function fmtElapsed(fromIso: string, now: number): string {
  const start = Date.parse(fromIso);
  if (!start) return '';
  const s = Math.max(0, Math.floor((now - start) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function fmtPhone(p: string | null): string {
  if (!p) return 'Unknown caller';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : p;
}

export default function CcLiveCallPops({ agencyId }: { agencyId?: string }) {
  const theme = useTheme();
  const [calls, setCalls] = useState<LiveCall[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const [notifyPerm, setNotifyPerm] = useState<NotificationPermission | 'unsupported'>('unsupported');
  // Calls that were live and have just ended — kept briefly as a "completed"
  // card with a link to the summary, so a finished call does not just vanish.
  const [ended, setEnded] = useState<{ call: LiveCall; endedAt: number }[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const seededRef = useRef(false);
  const prevActiveRef = useRef<Map<string, LiveCall>>(new Map());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) setNotifyPerm(Notification.permission);
  }, []);

  const load = useCallback(async () => {
    if (!agencyId) return;
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/live-calls`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (!r.ok) return;
      const d = await r.json();
      const list: LiveCall[] = Array.isArray(d.calls) ? d.calls : [];
      setCalls(list);

      const active = new Set(list.map((c) => c.sessionId));
      if (!seededRef.current) {
        // First load: treat everything already live as "seen" so we show the
        // cards in-app but do not fire a burst of desktop notifications.
        list.forEach((c) => seenRef.current.add(c.sessionId));
        seededRef.current = true;
      } else {
        for (const c of list) {
          if (!seenRef.current.has(c.sessionId)) {
            seenRef.current.add(c.sessionId);
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                const n = new Notification(`Live call: ${c.businessName}`, {
                  body: `${fmtPhone(c.callerNumber)} is on the line now.`,
                  tag: `cc-live-${c.sessionId}`,
                });
                n.onclick = () => { try { window.focus(); } catch {} window.location.href = `/live/${c.clientId}?mode=monitor`; };
              } catch { /* notifications are best-effort */ }
            }
          }
        }
      }
      // A call that was live last poll and is gone now has ended: surface a
      // "completed" card (with a summary link) instead of letting it vanish.
      const endedNow: { call: LiveCall; endedAt: number }[] = [];
      prevActiveRef.current.forEach((c, id) => { if (!active.has(id)) endedNow.push({ call: c, endedAt: Date.now() }); });
      if (endedNow.length) {
        setEnded((prev) => {
          const have = new Set(prev.map((e) => e.call.sessionId));
          const add = endedNow.filter((e) => !have.has(e.call.sessionId));
          return add.length ? [...prev, ...add] : prev;
        });
      }
      prevActiveRef.current = new Map(list.map((c) => [c.sessionId, c]));

      // Forget ended calls so a later call from the same business pops again.
      seenRef.current.forEach((id) => { if (!active.has(id)) seenRef.current.delete(id); });
    } catch { /* keep last good */ }
  }, [agencyId]);

  useEffect(() => {
    if (!agencyId) return;
    load();
    const p = setInterval(load, POLL_MS);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(p); clearInterval(t); };
  }, [agencyId, load]);

  // Drop dismissals for calls that have ended.
  useEffect(() => {
    const active = new Set(calls.map((c) => c.sessionId));
    setDismissed((prev) => {
      const next = new Set([...prev].filter((id) => active.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [calls]);

  // Auto-expire the "completed" cards after ~45s so they don't pile up.
  useEffect(() => {
    if (!ended.length) return;
    const t = setInterval(() => setEnded((prev) => prev.filter((e) => Date.now() - e.endedAt < 45000)), 2000);
    return () => clearInterval(t);
  }, [ended.length]);

  if (!agencyId) return null;

  const visible = calls.filter((c) => !dismissed.has(c.sessionId));
  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const showEnable = notifyPerm === 'default';
  const fmtDuration = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  if (visible.length === 0 && ended.length === 0 && !showEnable) return null;

  return (
    <div className="fixed z-[95] flex flex-col gap-2" style={{ right: '1rem', top: '1rem', maxWidth: 'calc(100vw - 2rem)' }}>
      {showEnable && (
        <button
          onClick={() => { try { Notification.requestPermission().then((perm) => setNotifyPerm(perm)); } catch {} }}
          className="w-80 max-w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold shadow-lg transition"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
          title="Get a desktop alert when a new call comes in, even on another tab"
        >
          <Bell className="h-3.5 w-3.5" style={{ color: theme.primary }} /> Enable alerts for new calls
        </button>
      )}

      {visible.slice(0, 4).map((c) => (
        <div key={c.sessionId} className="w-80 max-w-full rounded-2xl p-4 shadow-xl" style={card}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Phone className="h-4 w-4" style={{ color: theme.primary }} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: c.humanOnCall ? '#f59e0b' : '#22c55e' }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.humanOnCall ? '#f59e0b' : '#22c55e' }}>{c.humanOnCall ? 'Agent on call' : 'In progress'}</span>
                <span className="text-[11px] tabular-nums ml-auto" style={{ color: theme.textMuted }}>{fmtElapsed(c.startedAt, now)}</span>
              </div>
              <p className="text-sm font-semibold truncate mt-1" style={{ color: theme.text }}>{c.businessName}</p>
              <p className="text-[12px] truncate" style={{ color: theme.textMuted }}>{fmtPhone(c.callerNumber)}{c.beingMonitored ? ' · being monitored' : ''}</p>
            </div>
            <button onClick={() => setDismissed((prev) => new Set(prev).add(c.sessionId))} className="p-1 -mr-1 -mt-1 flex-shrink-0 rounded-lg" style={{ color: theme.textMuted }} title="Dismiss"><X className="h-4 w-4" /></button>
          </div>
          <Link
            href={`/live/${c.clientId}?mode=monitor`}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            <Headphones className="h-4 w-4" /> Listen in / take over
          </Link>
        </div>
      ))}

      {/* Completed calls: a call that just ended, with a link to its summary. */}
      {ended.slice(-4).map((e) => (
        <div key={`ended-${e.call.sessionId}`} className="w-80 max-w-full rounded-2xl p-4 shadow-xl" style={card}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.hover }}><Check className="h-4 w-4" style={{ color: theme.textMuted }} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.textSubtle }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Call completed</span>
                <span className="text-[11px] tabular-nums ml-auto" style={{ color: theme.textMuted }}>{fmtDuration(e.endedAt - Date.parse(e.call.startedAt))}</span>
              </div>
              <p className="text-sm font-semibold truncate mt-1" style={{ color: theme.text }}>{e.call.businessName}</p>
              <p className="text-[12px] truncate" style={{ color: theme.textMuted }}>{fmtPhone(e.call.callerNumber)}</p>
            </div>
            <button onClick={() => setEnded((prev) => prev.filter((x) => x.call.sessionId !== e.call.sessionId))} className="p-1 -mr-1 -mt-1 flex-shrink-0 rounded-lg" style={{ color: theme.textMuted }} title="Dismiss"><X className="h-4 w-4" /></button>
          </div>
          <Link
            href="/cc/calls"
            onClick={() => setEnded((prev) => prev.filter((x) => x.call.sessionId !== e.call.sessionId))}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: theme.hover, color: theme.text }}
          >
            <FileText className="h-4 w-4" /> View call summary
          </Link>
        </div>
      ))}
    </div>
  );
}