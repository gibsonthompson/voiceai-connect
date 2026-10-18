'use client';

// ============================================================================
// Call-center Live Wallboard - /agency/live-calls
//
// Every call live right now across all the businesses this call center serves.
// Managers watch all businesses; an assigned agent sees only theirs. Opening a
// call hands off to the per-call live monitor at /live/[client].
//
// Theming: uses the agency theme (useTheme) with inline styles, exactly like the
// rest of the dashboard, so it white-labels correctly in both light and dark.
// (It must NOT use Tailwind `dark:` classes - those follow the browser/system
// dark mode, not the agency's chosen website_theme, which is what turned this
// page black on a light-theme agency.)
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Headphones, PhoneCall, Radio, UserCheck, Loader2, CircleDot, Building2, ChevronRight } from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '../../../hooks/useTheme';

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

interface Business {
  clientId: string;
  businessName: string;
  live: boolean;
}

const POLL_MS = 4000;
const LIVE_GREEN = '#22c55e';
const HUMAN_AMBER = '#f59e0b';

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
  const { agency, isAgent } = useAgency();
  const theme = useTheme();
  const accent = theme.primary;
  const [calls, setCalls] = useState<LiveCall[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [capacity, setCapacity] = useState<{ active: number; limit: number | null } | null>(null);
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
        if (d.success) {
          setCalls(Array.isArray(d.calls) ? d.calls : []);
          setBusinesses(Array.isArray(d.businesses) ? d.businesses : []);
          setCapacity(d.capacity || null);
        }
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
    if (c.humanOnCall) return HUMAN_AMBER;
    if (c.beingMonitored) return accent;
    return LIVE_GREEN;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-7">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
            <Headphones className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight truncate" style={{ color: theme.text }}>Live Calls</h1>
            <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Every call happening right now across {isAgent ? 'the businesses assigned to you' : 'your businesses'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {capacity && !isAgent && (() => {
            const active = capacity.active ?? 0;
            const limit = capacity.limit;
            const pct = limit && limit > 0 ? Math.min(100, Math.round((active / limit) * 100)) : 0;
            const barColor = !limit ? accent : pct >= 90 ? '#ef4444' : pct >= 70 ? HUMAN_AMBER : LIVE_GREEN;
            return (
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: theme.hover, color: theme.textMuted }} title={limit ? `${active} of ${limit} concurrent lines in use` : `${active} concurrent lines in use (no account cap)`}>
                {limit ? (
                  <>
                    <span className="h-1.5 w-12 rounded-full overflow-hidden" style={{ backgroundColor: theme.border }}>
                      <span className="block h-full rounded-full" style={{ width: `${Math.max(2, pct)}%`, backgroundColor: barColor }} />
                    </span>
                    <span style={{ color: theme.text }}>{active}/{limit} lines</span>
                  </>
                ) : (
                  <span style={{ color: theme.text }}>{active} lines in use</span>
                )}
              </span>
            );
          })()}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: theme.primary15, color: accent }}>
            <Radio className="h-3.5 w-3.5" /> {calls.length} live
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading the board...</div>
      ) : (
        <>
          {/* Live now */}
          {calls.length === 0 ? (
            <div className="rounded-2xl py-12 flex flex-col items-center justify-center text-center" style={{ border: `1px dashed ${theme.border}` }}>
              <CircleDot className="h-8 w-8 mb-2.5" style={{ color: theme.textSubtle }} />
              <p className="text-sm font-medium" style={{ color: theme.text }}>No live calls right now</p>
              <p className="text-[13px] mt-1" style={{ color: theme.textMuted }}>When a caller reaches one of {isAgent ? 'your assigned businesses' : 'your businesses'}, it appears here instantly.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {calls.map((c) => (
                <a
                  key={c.sessionId}
                  href={`/live/${c.clientId}?mode=monitor&back=/agency/live-calls`}
                  target="_blank"
                  rel="noopener"
                  className="group rounded-2xl p-4 sm:p-5 transition"
                  style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = theme.primary30; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-[15px] truncate" style={{ color: theme.text }}>{c.businessName}</p>
                      <p className="text-[13px] truncate" style={{ color: theme.textMuted }}>{fmtPhone(c.callerNumber)}</p>
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums px-2 py-1 rounded-lg flex-shrink-0" style={{ color: theme.textMuted, backgroundColor: theme.hover }}>
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

          {/* Business roster - open any business even when it is quiet. */}
          {businesses.length > 0 && (
            <div className="mt-7 sm:mt-9">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4" style={{ color: theme.textMuted }} />
                <h2 className="text-[13px] sm:text-sm font-semibold" style={{ color: theme.text }}>
                  {isAgent ? 'Your businesses' : 'All businesses'}
                </h2>
                <span className="text-[12px]" style={{ color: theme.textMuted }}>{businesses.length}</span>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.card }}>
                {businesses.map((b, i) => (
                  <a
                    key={b.clientId}
                    href={`/live/${b.clientId}?mode=monitor&back=/agency/live-calls`}
                    target="_blank"
                    rel="noopener"
                    className="group flex items-center justify-between gap-3 px-4 py-3 transition"
                    style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.hover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.live ? LIVE_GREEN : theme.textSubtle }} />
                      <span className="text-sm truncate" style={{ color: theme.text }}>{b.businessName}</span>
                      {b.live && <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ backgroundColor: `${LIVE_GREEN}1a`, color: LIVE_GREEN }}>Live</span>}
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textSubtle }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}