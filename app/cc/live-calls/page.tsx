'use client';

// /cc/live-calls - the live wallboard, reused as-is from the agency tree. It is
// theme-aware and scopes itself to the viewer (agents see only their assigned
// businesses), so it behaves correctly inside the call-center shell too.
import AgencyLiveWallboard from '../../agency/live-calls/page';

export default function CallCenterLiveCalls() {
  return <AgencyLiveWallboard />;
}
