import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ClientDashboardClient } from './dashboard-client';

// Prevent caching to ensure fresh auth check
export const dynamic = 'force-dynamic';

async function getClientData(clientId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Get client with agency details
  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      agency:agencies(
        id, name, slug, logo_url, favicon_url,
        primary_color, secondary_color, accent_color,
        support_email, support_phone
      )
    `)
    .eq('id', clientId)
    .single();

  if (!client) return { 
    client: null, 
    recentCalls: [], 
    stats: { callsThisMonth: 0, highUrgency: 0, callLimit: 50, trialDaysLeft: null } 
  };

  // Get recent calls
  const { data: recentCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get call stats for this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: callsThisMonth } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('created_at', startOfMonth.toISOString());

  const { count: highUrgency } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('urgency_level', 'high')
    .gte('created_at', startOfMonth.toISOString());

  // Calculate trial days left
  let trialDaysLeft = null;
  if (client.trial_ends_at) {
    trialDaysLeft = Math.max(0, Math.ceil(
      (new Date(client.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));
  }

  return {
    client,
    recentCalls: recentCalls || [],
    stats: {
      callsThisMonth: callsThisMonth || 0,
      highUrgency: highUrgency || 0,
      callLimit: client.monthly_call_limit || 50,
      trialDaysLeft,
    },
  };
}

export default async function ClientDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user || !user.client_id) {
    redirect('/client/login');
  }

  const { client, recentCalls, stats } = await getClientData(user.client_id);

  if (!client) {
    redirect('/client/login');
  }

  const agency = client.agency;
  
  const branding = {
    primaryColor: agency?.primary_color || '#3b82f6',
    secondaryColor: agency?.secondary_color || '#1e40af',
    accentColor: agency?.accent_color || '#60a5fa',
    logoUrl: agency?.logo_url || null,
    agencyName: agency?.name || 'VoiceAI',
    supportEmail: agency?.support_email || null,
    supportPhone: agency?.support_phone || null,
  };

  return (
    <ClientDashboardClient
      client={client}
      branding={branding}
      recentCalls={recentCalls}
      stats={stats}
    />
  );
}