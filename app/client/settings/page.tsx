'use client';

import { Loader2 } from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';
import { ClientSettingsContent } from './settings-content';

export default function ClientSettingsPage() {
  const { client, branding, loading } = useClient();
  const theme = useClientTheme();

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted }} />
      </div>
    );
  }

  return <ClientSettingsContent client={client} branding={branding} />;
}