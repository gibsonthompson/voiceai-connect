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

import { Bell, Clock } from 'lucide-react';
import { useAgency } from '../../app/agency/context';
import { useTheme } from '../../hooks/useTheme';
import { useAgentPresence } from '../../hooks/useAgentPresence';
import EscalationScreenPop from './EscalationScreenPop';

export default function CcEscalationLayer() {
  const { agency, isAgent } = useAgency();
  const theme = useTheme();
  const enabled = !!(agency?.is_call_center && isAgent);
  const { offers, status, setStatus, claim, decline, dismiss, connected, schedule, notifySupported, notifyPermission, requestNotify } = useAgentPresence(enabled);

  if (!enabled) return null;

  const available = status === 'available';
  // Scheduled off: a schedule is set, we are outside it, and no manager override.
  const offHours = schedule.enabled && !schedule.onSchedule && !schedule.override;
  // Offer to turn on desktop alerts until the agent has answered the prompt.
  const showEnableAlerts = notifySupported && notifyPermission === 'default';

  return (
    <>
      {/* Status + alerts controls, bottom-left, out of the way of the pop. */}
      <div className="fixed z-[90] flex items-center gap-2" style={{ left: '1rem', bottom: '1rem' }}>
        {offHours && (
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold shadow-lg"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.textMuted }}
            title="You're outside your scheduled working hours, so you won't be offered calls right now. Your manager sets these hours."
          >
            <Clock className="h-3.5 w-3.5" /> Outside your hours
          </div>
        )}
        <button
          onClick={() => setStatus(available ? 'away' : 'available')}
          className="inline-flex items-center gap-2 rounded-full pl-2.5 pr-3.5 py-2 text-[13px] font-semibold shadow-lg transition"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
          title={connected ? 'Connected to live escalations' : 'Reconnecting...'}
        >
          <span className="relative flex h-2.5 w-2.5">
            {available && connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: '#22c55e' }} />}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: available ? '#22c55e' : theme.textSubtle }} />
          </span>
          {available ? 'Available' : 'Away'}
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