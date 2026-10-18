'use client';

// ============================================================================
// components/cc/AgentPresenceBar.tsx
//
// A slim strip for managers showing which agents are on the floor right now:
// how many are online and available, with each agent's state (available / away
// / on a call). It reads the same presence the escalation router uses to route
// callers, so what a manager sees here is exactly who can be handed a call.
//
// Managers only (an agent's console shows their own pop + status toggle instead).
// Theme-aware inline styles, polled every few seconds.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { Users, CircleDot } from 'lucide-react';
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
}

const POLL_MS = 5000;
const GREEN = '#22c55e';
const AMBER = '#f59e0b';

function initials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0].toUpperCase();
}

export default function AgentPresenceBar({ agencyId }: { agencyId: string | undefined }) {
  const theme = useTheme();
  const [agents, setAgents] = useState<PresenceAgent[]>([]);
  const [avail, setAvail] = useState(0);
  const [loaded, setLoaded] = useState(false);

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
  // Nothing to show until we know there is at least one agent with presence.
  if (!loaded || agents.length === 0) return null;

  // An agent who is online but outside their working hours (and not overridden)
  // is present but not being offered calls; show that distinctly.
  const offHours = (a: PresenceAgent) => !!(a.scheduleEnabled && a.onSchedule === false && !a.override);
  const dot = (a: PresenceAgent) => (a.busy ? AMBER : offHours(a) ? theme.textSubtle : a.status === 'available' ? GREEN : theme.textSubtle);
  const label = (a: PresenceAgent) => (a.busy ? 'On a call' : offHours(a) ? 'Off hours' : a.status === 'available' ? (a.override ? 'Available (override)' : 'Available') : 'Away');

  return (
    <div
      className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto"
      style={{ backgroundColor: theme.card, borderBottom: `1px solid ${theme.borderSubtle}` }}
    >
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold flex-shrink-0" style={{ color: theme.textMuted }}>
        <Users className="h-3.5 w-3.5" /> Agents
      </span>
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold flex-shrink-0 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GREEN}1a`, color: GREEN }}>
        <CircleDot className="h-3 w-3" /> {avail} available
      </span>
      <span className="text-[12px] flex-shrink-0" style={{ color: theme.textSubtle }}>{online.length} online</span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {online.slice(0, 12).map((a) => (
          <div
            key={a.memberUserId}
            title={`${a.displayName || 'Agent'} - ${label(a)}`}
            className="relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold flex-shrink-0"
            style={{ backgroundColor: theme.primary15, color: theme.primary }}
          >
            {initials(a.displayName)}
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full" style={{ backgroundColor: dot(a), border: `1.5px solid ${theme.card}` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
