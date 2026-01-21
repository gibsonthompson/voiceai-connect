import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RevenuePageClient } from './revenue-client';

// Prevent caching to ensure fresh auth check on each request
export const dynamic = 'force-dynamic';

async function getRevenueData(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single();

  // Get all clients with their subscription info
  const { data: clients } = await supabase
    .from('clients')
    .select('id, business_name, plan_type, subscription_status, created_at, calls_this_month')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  // Calculate MRR from active subscriptions
  const activeClients = clients?.filter(c => c.subscription_status === 'active') || [];
  const trialClients = clients?.filter(c => c.subscription_status === 'trial') || [];
  
  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case 'starter': return agency?.price_starter || 4900;
      case 'pro': return agency?.price_pro || 9900;
      case 'growth': return agency?.price_growth || 14900;
      default: return 0;
    }
  };

  const mrr = activeClients.reduce((sum, c) => sum + getPlanPrice(c.plan_type), 0);
  
  // Get payments/transactions if you have a payments table
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculate totals
  const totalEarned = payments?.reduce((sum, p) => {
    if (p.status === 'succeeded') return sum + (p.amount || 0);
    return sum;
  }, 0) || 0;

  const pendingPayout = payments?.reduce((sum, p) => {
    if (p.status === 'succeeded' && !p.paid_out) return sum + (p.amount || 0);
    return sum;
  }, 0) || 0;

  // Group revenue by month for chart
  const monthlyRevenue: { [key: string]: number } = {};
  payments?.forEach(p => {
    if (p.status === 'succeeded') {
      const month = new Date(p.created_at).toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (p.amount || 0);
    }
  });

  // Convert to array sorted by month
  const revenueByMonth = Object.entries(monthlyRevenue)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months

  return {
    agency,
    stats: {
      mrr,
      totalEarned,
      pendingPayout,
      activeClients: activeClients.length,
      trialClients: trialClients.length,
      totalClients: clients?.length || 0,
    },
    revenueByMonth,
    payments: payments || [],
    clients: clients || [],
  };
}

export default async function AgencyRevenuePage() {
  const user = await getCurrentUser();
  
  if (!user || !user.agency_id) {
    redirect('/agency/login');
  }

  const { agency, stats, revenueByMonth, payments, clients } = await getRevenueData(user.agency_id);

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
    <RevenuePageClient
      branding={branding}
      agency={agency}
      stats={stats}
      revenueByMonth={revenueByMonth}
      payments={payments}
      clients={clients}
    />
  );
}
