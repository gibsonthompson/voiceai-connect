'use client';

// ============================================================================
// Call-center Live Wallboard — /agency/live-calls
//
// Every call live right now across all the businesses this call center serves.
// Managers (and, in a later phase, assigned agents) watch this and open any call
// to listen or jump in. Polls the agency live-calls endpoint for a near-live
// board; opening a call hands off to the per-call live monitor at /live/[client].
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Headphones, PhoneCall, Radio, UserCheck, Loader2, CircleDot } from 'lucide-react';
import { useAgency } from '../context';

interface LiveCall {
  sessionId: string;
  clientId: string;
  businessName: string;
  callerNumber: string | null;
  status: string;
  humanOnCall: boolean;
  beingMonitored: boolean;
  startedAt: string;
  vapiCallId: string | null;
}

const POLL_MS = 4000;

function fmtElapsed(fromIso: string, now: number): string {
  const start = Date.parse(fromIso);
  if (!start) return '';
  const s = Math.max(0, Math.floor((now - start) / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function fmtPhone(p: string | null): string {
  if (!p) return 'Unknown caller';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}

export default function AgencyLiveWallboard() {
  const { agency } = useAgency();
  const accent = (agency as any)?.primary_color || '#10b981';
  const [calls, setCalls] = useState<LiveCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef<any>(null);

  const load = useCallback(async () => {
    if (!agency?.id) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${backendUrl}/api/agency/${agency.id}/live-calls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json();
        if (d.success) setCalls(Array.isArray(d.calls) ? d.calls : []);
      }
    } catch { /* keep the last good board */ }
    finally { setLoading(false); }
  }, [agency?.id]);

  // Poll the board, and tick a clock every second so the live timers advance.
  useEffect(() => {
    load();
    const poll = setInterval(load, POLL_MS);
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(poll); if (timerRef.current) clearInterval(timerRef.current); };
  }, [load]);

  const statusLabel = (c: LiveCall) => {
    if (c.humanOnCall) return 'Teammate on the call';
    if (c.beingMonitored) return 'Being monitored';
    return 'AI handling';
  };
  const statusColor = (c: LiveCall) => {
    if (c.humanOnCall) return '#f59e0b';
    if (c.beingMonitored) return accent;
    return '#22c55e';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-[#0f0f0e]">
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-7">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: `${accent}1a` }}>
            <Headphones className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white truncate">Live Calls</h1>
            <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400">Every call happening right now across your businesses</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: `${accent}14`, color: accent }}>
          <Radio className="h-3.5 w-3.5" /> {calls.length} live
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading the board...</div>
      ) : calls.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 py-20 flex flex-col items-center justify-center text-center">
          <CircleDot className="h-9 w-9 mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">No live calls right now</p>
          <p className="text-[13px] mt-1 text-gray-500 dark:text-gray-400">When a caller reaches one of your businesses, it appears here instantly.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {calls.map((c) => (
            <a
              key={c.sessionId}
              href={`/live/${c.clientId}?mode=monitor`}
              className="group rounded-2xl p-4 sm:p-5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-[15px] text-gray-900 dark:text-white truncate">{c.businessName}</p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{fmtPhone(c.callerNumber)}</p>
                </div>
                <span className="text-[11px] font-semibold tabular-nums px-2 py-1 rounded-lg flex-shrink-0 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5">
                  {fmtElapsed(c.startedAt, now)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
                  <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: statusColor(c) }} />
                  <span style={{ color: statusColor(c) }}>{statusLabel(c)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition" style={{ color: accent }}>
                  {c.beingMonitored ? <UserCheck className="h-4 w-4" /> : <PhoneCall className="h-4 w-4" />}
                  Open
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}