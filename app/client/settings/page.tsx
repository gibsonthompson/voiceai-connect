'use client';

import { Loader2 } from 'lucide-react';
import { useClient } from '../context';
import { ClientSettingsContent } from './settings-content';

export default function ClientSettingsPage() {
  const { client, branding, loading } = useClient();

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: '#f9fafb' }}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return <ClientSettingsContent client={client} branding={branding} />;
}