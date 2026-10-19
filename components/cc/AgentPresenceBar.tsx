'use client';

// ============================================================================
// components/cc/AgentPresenceBar.tsx
//
// A slim strip for managers showing which agents are on the floor right now:
// how many are online and available, with each agent's state (available / away
// / on a call). It reads the same presence the escalation router uses to route
// callers, so what a manager sees here is exactly who can be handed a call.
//
// Hover an agent for the full picture: who they are, their status, how long
// they've been active, their last activity, how many calls they've answered this
// session, and how calls reach them. The strip is sticky across the top on
// desktop and sits flush under the header with no dividing line.
//
// Managers only (an agent's console shows their own pop + status toggle instead).
// Theme-aware inline styles, polled every few seconds.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { Users, CircleDot, Monitor, Phone, Clock, PhoneCall, History } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface PresenceAgent {
  memberUserId: string;
  displayName: string | null;
  status: 'available' | 'away';
  busy: boolean;
  online: boolean;
  scheduleEnabled?: boolean;
  onSchedule?: boolean;
  override?: boolean;
  callDelivery?: 'browser' | 'phone';
  agentPhone?: string | null;
  lastSeen?: string | null;
  onlineSince?: string | null;
  sessionCalls?: number;
}

const POLL_MS = 5000;
const GREEN = '#22c55e';
const AMBER = '#f59e0b';

function initials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0].toUpperCase();
}
function fmtPhone(p: string | null | undefined): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : p;
}
function fmtSince(iso: string | null | undefined): string {
  if (!iso) return '—';
  const s = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return '<1m';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d`;
}
function fmtAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const s = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AgentPresenceBar({ agencyId }: { agencyId: string | undefined }) {
  const theme = useTheme();
  const [agents, setAgents] = useState<PresenceAgent[]>([]);
  const [avail, setAvail] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [hover, setHover] = useState<{ a: PresenceAgent; x: number; y: number } | null>(null);

  const load = useCallback(async () => {
    if (!agencyId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${base}/api/cc/${agencyId}/agents/presence`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        if (d.success) {
          setAgents(Array.isArray(d.agents) ? d.agents : []);
          setAvail(typeof d.available === 'number' ? d.available : 0);
        }
      }
    } catch { /* keep last good */ }
    finally { setLoaded(true); }
  }, [agencyId]);

  useEffect(() => { load(); const iv = setInterval(load, POLL_MS); return () => clearInterval(iv); }, [load]);

  const online = agents.filter((a) => a.online);
  if (!loaded || agents.length === 0) return null;

  const offHours = (a: PresenceAgent) => !!(a.scheduleEnabled && a.onSchedule === false && !a.override);
  const dot = (a: PresenceAgent) => (a.busy ? AMBER : offHours(a) ? theme.textSubtle : a.status === 'available' ? GREEN : theme.textSubtle);
  const label = (a: PresenceAgent) => (a.busy ? 'On a call' : offHours(a) ? 'Off hours' : a.status === 'available' ? (a.override ? 'Available (override)' : 'Available') : 'Away');

  const enter = (e: React.MouseEvent, a: PresenceAgent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHover({ a, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
  };

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto md:sticky md:top-0 z-20"
        style={{ backgroundColor: theme.bg }}
      >
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold flex-shrink-0" style={{ color: theme.textMuted }}>
          <Users className="h-3.5 w-3.5" /> Agents
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold flex-shrink-0 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GREEN}1a`, color: GREEN }}>
          <CircleDot className="h-3 w-3" /> {avail} available
        </span>
        <span className="text-[12px] flex-shrink-0" style={{ color: theme.textSubtle }}>{online.length} online</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {online.slice(0, 16).map((a) => (
            <div
              key={a.memberUserId}
              onMouseEnter={(e) => enter(e, a)}
              onMouseLeave={() => setHover(null)}
              className="relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold flex-shrink-0 cursor-default"
              style={{ backgroundColor: theme.primary15, color: theme.primary }}
            >
              {initials(a.displayName)}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full" style={{ backgroundColor: dot(a), border: `1.5px solid ${theme.bg}` }} />
            </div>
          ))}
          {online.length > 16 && (
            <span className="text-[11px] flex-shrink-0 ml-0.5" style={{ color: theme.textSubtle }}>+{online.length - 16}</span>
          )}
        </div>
      </div>

      {/* Hover card, fixed-positioned so the strip's horizontal scroll can't clip it. */}
      {hover && (
        <div
          className="fixed z-[80] w-[250px] rounded-2xl p-3.5 shadow-xl pointer-events-none"
          style={{ left: hover.x, top: hover.y, transform: 'translateX(-50%)', backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold flex-shrink-0" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{initials(hover.a.displayName)}</div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold truncate" style={{ color: theme.text }}>{hover.a.displayName || 'Agent'}</p>
              <p className="inline-flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: dot(hover.a) }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot(hover.a) }} /> {label(hover.a)}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <Stat theme={theme} icon={Clock} label="Active since" value={fmtSince(hover.a.onlineSince)} />
            <Stat theme={theme} icon={PhoneCall} label="Calls this session" value={String(hover.a.sessionCalls ?? 0)} />
            <Stat theme={theme} icon={History} label="Last active" value={fmtAgo(hover.a.lastSeen)} />
            <Stat theme={theme} icon={hover.a.callDelivery === 'phone' ? Phone : Monitor} label="Calls reach them"
              value={hover.a.callDelivery === 'phone' ? (fmtPhone(hover.a.agentPhone) || 'their phone') : 'In browser'} />
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ theme, icon: Icon, label, value }: { theme: any; icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: theme.textMuted }}><Icon className="h-3.5 w-3.5" style={{ color: theme.textSubtle }} /> {label}</span>
      <span className="text-[12px] font-semibold tabular-nums text-right" style={{ color: theme.text }}>{value}</span>
    </div>
  );
}
