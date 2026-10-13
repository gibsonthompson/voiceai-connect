'use client';

// /cc/agents - agent management for the call center. Renders the shared team
// component (same team model, call-center labelling and per-agent business
// assignment). Self-contained so it has no cross-page import dependency.

import { Headset } from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';
import AgencyTeamTab from '@/components/agency/AgencyTeamTab';

export default function CallCenterAgents() {
  const { agency } = useAgency();
  const theme = useTheme();

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <Headset className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Agents</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Add agents and assign each one the businesses they monitor and handle calls for.</p>
        </div>
      </div>
      <div className="max-w-3xl">
        <AgencyTeamTab agencyId={agency?.id || ''} theme={theme} />
      </div>
    </div>
  );
}
