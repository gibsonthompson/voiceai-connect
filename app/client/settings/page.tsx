import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ClientSettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function ClientSettingsPage() {
  const user = await getCurrentUser();
  
  if (!user || !user.client_id) {
    redirect('/client/login');
  }

  const supabase = await createServerSupabaseClient();
  
  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      agency:agencies(
        id, name, slug, logo_url,
        primary_color, secondary_color, accent_color,
        support_email, support_phone
      )
    `)
    .eq('id', user.client_id)
    .single();

  if (!client) {
    redirect('/client/login');
  }

  const branding = {
    primaryColor: client.agency?.primary_color || '#3b82f6',
    accentColor: client.agency?.accent_color || '#60a5fa',
    agencyName: client.agency?.name || 'VoiceAI',
    logoUrl: client.agency?.logo_url || null,
    supportEmail: client.agency?.support_email || null,
    supportPhone: client.agency?.support_phone || null,
  };

  return (
    <ClientSettingsClient
      client={client}
      branding={branding}
    />
  );
}