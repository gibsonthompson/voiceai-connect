import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ClientsPageClient } from './clients-client';

// Prevent caching to ensure fresh auth check on each request
export const dynamic = 'force-dynamic';

async function getAgencyClients(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single();

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  return {
    agency,
    clients: clients || [],
  };
}

export default async function AgencyClientsPage() {
  const user = await getCurrentUser();
  
  if (!user || !user.agency_id) {
    redirect('/agency/login');
  }

  const { agency, clients } = await getAgencyClients(user.agency_id);

  if (!agency) {
    redirect('/agency/login');
  }

  const branding = {
    primaryColor: agency.primary_color || '#2563eb',
    secondaryColor: agency.secondary_color || '#1e40af',
    accentColor: agency.accent_color || '#3b82f6',
    logoUrl: agency.logo_url,
    name: agency.name,
  };

  return (
    <ClientsPageClient
      branding={branding}
      agency={agency}
      clients={clients}
    />
  );
}