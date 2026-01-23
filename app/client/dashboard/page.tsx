'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ClientDashboardClient } from './dashboard-client';

export default function ClientDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [stats, setStats] = useState({
    callsThisMonth: 0,
    highUrgency: 0,
    callLimit: 50,
    trialDaysLeft: null as number | null,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');
        const storedClient = localStorage.getItem('client');
        
        if (!token || !storedClient) {
          console.log('No token or client in localStorage');
          router.push('/client/login');
          return;
        }

        const clientData = JSON.parse(storedClient);
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

        // Fetch full client data
        const response = await fetch(`${backendUrl}/api/client/${clientData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.log('API returned error, redirecting to login');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('client');
          localStorage.removeItem('user');
          router.push('/client/login');
          return;
        }

        const data = await response.json();
        const fetchedClient = data.client;

        if (!fetchedClient) {
          router.push('/client/login');
          return;
        }

        setClient(fetchedClient);

        // Set branding
        const agency = fetchedClient.agency;
        setBranding({
          primaryColor: agency?.primary_color || '#3b82f6',
          secondaryColor: agency?.secondary_color || '#1e40af',
          accentColor: agency?.accent_color || '#60a5fa',
          logoUrl: agency?.logo_url || null,
          agencyName: agency?.name || 'VoiceAI',
          supportEmail: agency?.support_email || null,
          supportPhone: agency?.support_phone || null,
        });

        // Fetch calls
        try {
          const callsResponse = await fetch(`${backendUrl}/api/client/${clientData.id}/calls`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (callsResponse.ok) {
            const callsData = await callsResponse.json();
            setRecentCalls(callsData.calls || []);
            setStats({
              callsThisMonth: callsData.stats?.callsThisMonth || 0,
              highUrgency: callsData.stats?.highUrgency || 0,
              callLimit: fetchedClient.monthly_call_limit || 50,
              trialDaysLeft: fetchedClient.trial_ends_at
                ? Math.max(0, Math.ceil((new Date(fetchedClient.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : null,
            });
          }
        } catch (e) {
          console.log('Failed to fetch calls, continuing with empty');
        }

        setLoading(false);
      } catch (error) {
        console.error('Dashboard load error:', error);
        router.push('/client/login');
      }
    };

    loadDashboard();
  }, [router]);

  if (loading || !client || !branding) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
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