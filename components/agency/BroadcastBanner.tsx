'use client';

// ============================================================================
// Platform broadcast banner, shown on the agency dashboard.
// Pulls the current admin announcement (if any), shows a live countdown to its
// expiry, and lets the agency dismiss it. A dismissed banner does not return;
// the next broadcast shows again (the backend tracks the last dismissed id).
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { Megaphone, X, Clock, ArrowRight } from 'lucide-react';
import { useAgency } from '../../app/agency/context';
import { useTheme } from '../../hooks/useTheme';

interface Broadcast {
  id: string;
  title: string | null;
  body: string | null;
  link_url: string | null;
  link_label: string | null;
  expires_at: string | null;
  created_at: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const c = (hex || '#10b981').replace('#', '');
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const r = parseInt(full.slice(0, 2), 16), g = parseInt(full.slice(2, 4), 16), b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(16,185,129,${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// "2d 3h", "3h 14m", "14m", or "" when there is no expiry.
function formatCountdown(expiresAt: string | null, nowMs: number): string {
  if (!expiresAt) return '';
  const ms = new Date(expiresAt).getTime() - nowMs;
  if (!(ms > 0)) return '';
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function BroadcastBanner() {
  const { agency } = useAgency();
  const theme = useTheme();
  const primary = theme.primary || '#10b981';

  const [bc, setBc] = useState<Broadcast | null>(null);
  const [hidden, setHidden] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

  const fetchBroadcast = useCallback(async () => {
    if (!agency?.id) return;
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agency.id}/broadcast`, { headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) { const d = await r.json(); setBc(d.broadcast || null); }
    } catch {}
  }, [agency?.id, backendUrl]);

  useEffect(() => { fetchBroadcast(); }, [fetchBroadcast]);

  // Tick once a minute so the countdown stays live and the banner self-hides
  // the moment it expires, without a page refresh.
  useEffect(() => {
    if (!bc?.expires_at) return;
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, [bc?.expires_at]);

  const dismiss = async () => {
    setHidden(true);
    if (!agency?.id || !bc?.id) return;
    try {
      await fetch(`${backendUrl}/api/agency/${agency.id}/broadcast/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ id: bc.id }),
      });
    } catch {}
  };

  if (!bc || hidden) return null;
  // Expired between fetch and now: hide.
  if (bc.expires_at && new Date(bc.expires_at).getTime() <= nowMs) return null;

  const countdown = formatCountdown(bc.expires_at, nowMs);
  const isExternal = !!bc.link_url && /^https?:\/\//i.test(bc.link_url);

  return (
    <div className="mb-4 rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4"
      style={{ backgroundColor: hexToRgba(primary, theme.isDark ? 0.1 : 0.06), border: `1px solid ${hexToRgba(primary, theme.isDark ? 0.25 : 0.18)}` }}>
      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl flex-shrink-0"
        style={{ backgroundColor: hexToRgba(primary, theme.isDark ? 0.18 : 0.12) }}>
        <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: primary }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {bc.title && <p className="text-sm sm:text-[15px] font-semibold leading-snug" style={{ color: theme.text }}>{bc.title}</p>}
            {bc.body && <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: theme.textMuted }}>{bc.body}</p>}
          </div>
          <button onClick={dismiss} aria-label="Dismiss" title="Dismiss"
            className="flex-shrink-0 -mt-0.5 -mr-0.5 p-1 rounded-lg transition hover:opacity-70" style={{ color: theme.textMuted }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {(bc.link_url || countdown) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2.5">
            {bc.link_url && (
              <a href={bc.link_url} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition hover:opacity-90"
                style={{ backgroundColor: primary, color: theme.primaryText || '#fff' }}>
                {bc.link_label || 'Open'} <ArrowRight className="h-3.5 w-3.5" />
              </a>
            )}
            {countdown && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: theme.textMuted }}>
                <Clock className="h-3 w-3" /> Available for {countdown}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}