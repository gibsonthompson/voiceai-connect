'use client';

// ============================================================================
// Call-center Agents - /agency/agents
//
// Top-level home for managing agents (call-center staff): add an agent, assign
// them their businesses, reset credentials, enable/disable. This is the same
// team-management surface that reseller agencies keep under Settings, but for a
// call center it is a first-class operations screen, so it lives in the top-level
// nav instead of being buried in Settings. The nav item is shown only for
// call-center agencies; agents themselves never reach this (their nav is just
// Live Calls, and the route guard keeps them on it).
// ============================================================================

import { Headset } from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '../../../hooks/useTheme';
import AgencyTeamTab from '@/components/agency/AgencyTeamTab';

export default function AgencyAgentsPage() {
  const { agency } = useAgency();
  const theme = useTheme();
  const accent = theme.primary;

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div className="flex items-center gap-3 mb-5 sm:mb-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <Headset className="h-5 w-5" style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight truncate" style={{ color: theme.text }}>Agents</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Add agents and assign each one the businesses they monitor and handle calls for.</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <AgencyTeamTab agencyId={agency?.id || ''} theme={theme} />
      </div>
    </div>
  );
}
