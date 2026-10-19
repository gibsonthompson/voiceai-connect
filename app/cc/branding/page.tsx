'use client';

// /cc/branding - the call center's branding on its own page (logo, colors, AI
// brand kit: fonts + nav icon set, app identity). Deep-linked from Settings.
// Renders the self-contained CcBrandingSection with the page header above it,
// so the section's own card header is suppressed to avoid a duplicate title.

import { Palette } from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';
import CcBrandingSection from '@/components/cc/CcBrandingSection';

export default function CcBrandingPage() {
  const { agency, refreshAgency } = useAgency();
  const theme = useTheme();

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <Palette className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Branding</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Your logo, colors, fonts, and nav icons across the whole call center. Upload a logo and we match the rest.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CcBrandingSection agency={agency} refreshAgency={refreshAgency} theme={theme} hideHeader />
      </div>
    </div>
  );
}
