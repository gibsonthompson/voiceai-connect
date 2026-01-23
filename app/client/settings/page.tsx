'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ClientSettingsClient } from './settings-client';

export default function ClientSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const storedClient = localStorage.getItem('client');
        
        if (!token || !storedClient) {
          router.push('/client/login');
          return;
        }

        const clientData = JSON.parse(storedClient);
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

        const response = await fetch(`${backendUrl}/api/client/${clientData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
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
        setBranding({
          primaryColor: fetchedClient.agency?.primary_color || '#3b82f6',
          accentColor: fetchedClient.agency?.accent_color || '#60a5fa',
          agencyName: fetchedClient.agency?.name || 'VoiceAI',
          logoUrl: fetchedClient.agency?.logo_url || null,
          supportEmail: fetchedClient.agency?.support_email || null,
          supportPhone: fetchedClient.agency?.support_phone || null,
        });

        setLoading(false);
      } catch (error) {
        console.error('Settings load error:', error);
        router.push('/client/login');
      }
    };

    loadSettings();
  }, [router]);

  if (loading || !client || !branding) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return <ClientSettingsClient client={client} branding={branding} />;
}