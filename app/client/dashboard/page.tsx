'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useClient } from '../context';
import { ClientDashboardClient } from './dashboard-content';

export default function ClientDashboardPage() {
  const { client, branding, loading } = useClient();
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [stats, setStats] = useState({
    callsThisMonth: 0,
    highUrgency: 0,
    callLimit: 50,
    trialDaysLeft: null as number | null,
  });

  useEffect(() => {
    if (client) {
      fetchCalls();
    }
  }, [client]);

  const fetchCalls = async () => {
    if (!client) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/client/${client.id}/calls`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentCalls(data.calls || []);
        setStats({
          callsThisMonth: data.stats?.callsThisMonth || client.calls_this_month || 0,
          highUrgency: data.stats?.highUrgency || 0,
          callLimit: client.monthly_call_limit || 50,
          trialDaysLeft: client.trial_ends_at
            ? Math.max(0, Math.ceil((new Date(client.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : null,
        });
      }
    } catch (e) {
      console.error('Failed to fetch calls:', e);
    }
  };

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <ClientDashboardClient
      client={client}
      branding={branding}
      recentCalls={recentCalls}
      stats={stats}
    />
  );
}