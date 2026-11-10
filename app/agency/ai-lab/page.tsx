'use client';

// ============================================================================
// AI Lab home — the clean, ChatGPT-style landing. This is the FIRST thing you
// see in AI Lab: one centered prompt bar. The full industry-template grid lives
// at /agency/templates, one click away via "browse all industry templates".
// ============================================================================

import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';
import { Loader2 } from 'lucide-react';
import AILabBuilder from '@/components/agency/AILabBuilder';

export default function AILabHomePage() {
  const { agency, branding, loading } = useAgency();
  const theme = useTheme();
  const api = process.env.NEXT_PUBLIC_API_URL || '';

  if (loading || !agency) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.cardTextMuted }} />
      </div>
    );
  }

  return <AILabBuilder agencyId={agency.id} api={api} theme={theme} logoUrl={branding?.logoUrl || agency.logo_url || null} />;
}
