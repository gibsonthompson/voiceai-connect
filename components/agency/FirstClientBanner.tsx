'use client';

// Compact, dismissible entry point to the First Client command center. Dropped at
// the top of the pages an agency works from (demo phone, leads, outreach) so the
// playbook is one click away. Dismiss is remembered per browser.

import { useState, useEffect } from 'react';
import { Rocket, ChevronRight, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const KEY = 'fc_banner_dismissed';

export default function FirstClientBanner() {
  const theme = useTheme();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem(KEY) === '1') setDismissed(true); } catch { /* ignore */ }
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="mb-5 rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: theme.isDark ? `linear-gradient(90deg, ${theme.primary15}, transparent)` : `linear-gradient(90deg, ${theme.primary10}, transparent)`, border: `1px solid ${theme.primary30}` }}>
      <span className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
        <Rocket className="h-4 w-4" style={{ color: theme.primary }} />
      </span>
      <div className="min-w-0 flex-1">
        <a href="/agency/first-client" className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: theme.text }}>
          Land your first client <ChevronRight className="h-3.5 w-3.5" style={{ color: theme.primary }} />
        </a>
        <p className="text-[12px]" style={{ color: theme.textMuted }}>Your funnel, demo-call leads, and the step-by-step play in one place.</p>
      </div>
      <button onClick={dismiss} aria-label="Dismiss" className="flex-shrink-0 p-1 rounded-md transition-colors" style={{ color: theme.textMuted }}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
