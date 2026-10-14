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

import { useAgency } from '../../app/agency/context';
import { useTheme } from '../../hooks/useTheme';
import { useAgentPresence } from '../../hooks/useAgentPresence';
import EscalationScreenPop from './EscalationScreenPop';

export default function CcEscalationLayer() {
  const { agency, isAgent } = useAgency();
  const theme = useTheme();
  const enabled = !!(agency?.is_call_center && isAgent);
  const { offers, status, setStatus, claim, decline, dismiss, connected } = useAgentPresence(enabled);

  if (!enabled) return null;

  const available = status === 'available';

  return (
    <>
      {/* Available / away toggle, bottom-left, out of the way of the pop. */}
      <button
        onClick={() => setStatus(available ? 'away' : 'available')}
        className="fixed z-[90] inline-flex items-center gap-2 rounded-full pl-2.5 pr-3.5 py-2 text-[13px] font-semibold shadow-lg transition"
        style={{ left: '1rem', bottom: '1rem', backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
        title={connected ? 'Connected to live escalations' : 'Reconnecting...'}
      >
        <span className="relative flex h-2.5 w-2.5">
          {available && connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: '#22c55e' }} />}
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: available ? '#22c55e' : theme.textSubtle }} />
        </span>
        {available ? 'Available' : 'Away'}
      </button>

      <EscalationScreenPop offers={offers} claim={claim} decline={decline} dismiss={dismiss} />
    </>
  );
}
