import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { DashboardClient } from './dashboard-client';

async function getAgencyData(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single();

  const { count: clientCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .neq('status', 'cancelled');

  const { data: clients } = await supabase
    .from('clients')
    .select('id, calls_this_month')
    .eq('agency_id', agencyId);

  const totalCalls = clients?.reduce((sum, c) => sum + (c.calls_this_month || 0), 0) || 0;

  const { data: activeClients } = await supabase
    .from('clients')
    .select('plan_type')
    .eq('agency_id', agencyId)
    .eq('subscription_status', 'active');

  let mrr = 0;
  if (activeClients && agency) {
    activeClients.forEach((client) => {
      switch (client.plan_type) {
        case 'starter':
          mrr += agency.price_starter || 4900;
          break;
        case 'pro':
          mrr += agency.price_pro || 9900;
          break;
        case 'growth':
          mrr += agency.price_growth || 14900;
          break;
      }
    });
  }

  const { data: recentClients } = await supabase
    .from('clients')
    .select('id, business_name, status, created_at, plan_type, subscription_status')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    agency,
    clientCount: clientCount || 0,
    totalCalls,
    mrr,
    recentClients: recentClients || [],
  };
}

export default async function AgencyDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user || !user.agency_id) {
    redirect('/agency/login');
  }

  const { agency, clientCount, totalCalls, mrr, recentClients } = await getAgencyData(user.agency_id);

  if (!agency) {
    redirect('/agency/login');
  }

  // Extract brand colors with fallbacks
  const branding = {
    primaryColor: agency.primary_color || '#2563eb',
    secondaryColor: agency.secondary_color || '#1e40af',
    accentColor: agency.accent_color || '#3b82f6',
    logoUrl: agency.logo_url,
    name: agency.name,
  };

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'voiceaiconnect.com';
  const signupLink = agency.marketing_domain && agency.domain_verified
    ? `https://${agency.marketing_domain}/signup`
    : `https://${agency.slug}.${platformDomain}/signup`;

  const trialDaysLeft = agency.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(agency.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const stats = [
    {
      label: 'Total Clients',
      value: clientCount.toString(),
      icon: 'users',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(mrr),
      icon: 'dollar',
    },
    {
      label: 'Calls This Month',
      value: totalCalls.toString(),
      icon: 'phone',
    },
  ];

  return (
    <DashboardClient
      branding={branding}
      user={user}
      agency={agency}
      stats={stats}
      recentClients={recentClients}
      signupLink={signupLink}
      trialDaysLeft={trialDaysLeft}
    />
  );
}