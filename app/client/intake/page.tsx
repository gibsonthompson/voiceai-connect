'use client';

import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';
import IntakeManager from '@/components/agency/IntakeManager';
import { Loader2 } from 'lucide-react';

export default function ClientIntakePage() {
  const { client, loading } = useClient();
  const theme = useClientTheme();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  if (loading || !client) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: (theme as any).primary }} /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight mb-1" style={{ color: (theme as any).text }}>Orders & Requests</h1>
      <p className="text-sm mb-6" style={{ color: (theme as any).cardTextMuted || (theme as any).textMuted }}>What your AI receptionist captures from calls, and the form it follows.</p>
      <IntakeManager
        theme={theme}
        configUrl={`${backendUrl}/api/client/${client.id}/intake`}
        recordsUrl={`${backendUrl}/api/client/${client.id}/intake/records`}
        templatesUrl={`${backendUrl}/api/client/${client.id}/intake/templates`}
      />
    </div>
  );
}
