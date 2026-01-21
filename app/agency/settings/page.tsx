import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SettingsPageClient } from './settings-client';

// Prevent caching to ensure fresh auth check on each request
export const dynamic = 'force-dynamic';

async function getAgencySettings(agencyId: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single();

  const { data: user } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('id', userId)
    .single();

  return {
    agency,
    user,
  };
}

export default async function AgencySettingsPage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser || !currentUser.agency_id) {
    redirect('/agency/login');
  }

  const { agency, user } = await getAgencySettings(currentUser.agency_id, currentUser.id);

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
    <SettingsPageClient
      branding={branding}
      agency={agency}
      user={user}
    />
  );
}