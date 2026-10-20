'use client';

// ============================================================================
// components/cc/CcEscalationLayer.tsx
//
// Mounted once inside the /cc shell. For an AGENT it drives their presence
// heartbeat, subscribes them to escalation offers, renders the screen-pop over
// whatever page they are on, and gives them an available / away toggle. For a
// manager it renders nothing here (managers oversee via the presence bar; they
// are not in the call-taking rotation).
// ============================================================================

import { Bell } from 'lucide-react';
import { useAgency } from '../../app/agency/context';
import { useTheme } from '../../hooks/useTheme';
import { useAgentPresence } from '../../hooks/useAgentPresence';
import EscalationScreenPop from './EscalationScreenPop';

const GREEN = '#22c55e';

export default function CcEscalationLayer() {
  const { agency, isAgent } = useAgency();
  const theme = useTheme();
  const enabled = !!(agency?.is_call_center && isAgent);
  const { offers, status, setStatus, setOverride, claim, decline, dismiss, connected, schedule, notifySupported, notifyPermission, requestNotify } = useAgentPresence(enabled);

  if (!enabled) return null;

  const available = status === 'available';
  // One truthful state: are you actually in the rotation right now? That means
  // you are available AND (no schedule, or inside your hours, or override on).
  const takingCalls = available && (!schedule.enabled || schedule.onSchedule || schedule.override);

  // One tap flips you on or off. Turning on while outside your hours also flips
  // the override, so "on" always means you really are taking calls.
  const toggle = () => {
    if (takingCalls) { setStatus('away'); return; }
    setStatus('available');
    if (schedule.enabled && !schedule.onSchedule && !schedule.override) setOverride(true);
  };

  const showEnableAlerts = notifySupported && notifyPermission === 'default';

  return (
    <>
      {/* A single, truthful on/off control, bottom-left, out of the pop's way. */}
      <div className="fixed z-[90] flex items-center gap-2" style={{ left: '1rem', bottom: '1rem' }}>
        <button
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-full pl-2.5 pr-3.5 py-2 text-[13px] font-semibold shadow-lg transition"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
          title={takingCalls
            ? (connected ? 'You are taking calls. Tap to pause.' : 'Taking calls (reconnecting...). Tap to pause.')
            : 'You are not taking calls. Tap to start - even outside your set hours.'}
        >
          <span className="relative flex h-2.5 w-2.5">
            {takingCalls && connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: GREEN }} />}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: takingCalls ? GREEN : theme.textSubtle }} />
          </span>
          {takingCalls ? 'Taking calls' : 'Paused'}
        </button>

        {showEnableAlerts && (
          <button
            onClick={requestNotify}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold shadow-lg transition"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            title="Get a desktop alert when a caller needs you, even on another tab"
          >
            <Bell className="h-3.5 w-3.5" /> Enable alerts
          </button>
        )}
      </div>

      <EscalationScreenPop offers={offers} claim={claim} decline={decline} dismiss={dismiss} />
    </>
  );
}