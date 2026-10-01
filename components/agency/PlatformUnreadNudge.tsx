'use client';

// ============================================================================
// PLATFORM UNREAD NUDGE — a small dashboard banner showing how many unread
// messages the agency has from VoiceAI Connect, linking straight into the
// inbox's VoiceAI Connect channel. Deliberately fails silent: no agency, no
// token, a fetch error, or zero unread all render nothing, so a nudge can never
// break the dashboard.
// ============================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

function rgba(hex: string, a: number): string {
  const c = (hex || '#10b981').replace('#', '');
  const f = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const r = parseInt(f.slice(0, 2), 16), g = parseInt(f.slice(2, 4), 16), b = parseInt(f.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(16,185,129,${a})`;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default function PlatformUnreadNudge({ agencyId }: { agencyId?: string }) {
  const theme = useTheme();
  const [unread, setUnread] = useState(0);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (!agencyId) return;
    let cancelled = false;
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) return;
        const res = await fetch(`${backendUrl}/api/agency/${agencyId}/platform-threads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelled) setUnread(Number(d.unread_total) || 0);
      } catch {
        /* non-blocking: never break the dashboard over a nudge */
      }
    })();
    return () => { cancelled = true; };
  }, [agencyId, backendUrl]);

  if (unread <= 0) return null;

  return (
    <Link
      href="/agency/inbox?channel=platform"
      className="mb-6 sm:mb-8 flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors"
      style={{ backgroundColor: rgba(theme.primary, 0.08), border: `1px solid ${rgba(theme.primary, 0.3)}` }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: rgba(theme.primary, 0.15) }}>
        <MessageSquare className="h-4 w-4" style={{ color: theme.primary }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: theme.text }}>
          {unread} new message{unread !== 1 ? 's' : ''} from VoiceAI Connect
        </p>
        <p className="text-xs" style={{ color: theme.textMuted }}>Open your inbox to read and reply.</p>
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />
    </Link>
  );
}
