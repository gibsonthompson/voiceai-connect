import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, Users, DollarSign, PhoneCall, 
  Settings, LogOut, Copy, ExternalLink,
  TrendingUp, Clock, AlertCircle
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

async function getAgencyData(agencyId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Get agency details
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single();

  // Get client count
  const { count: clientCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .neq('status', 'cancelled');

  // Get total calls this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: clients } = await supabase
    .from('clients')
    .select('id, calls_this_month')
    .eq('agency_id', agencyId);

  const totalCalls = clients?.reduce((sum, c) => sum + (c.calls_this_month || 0), 0) || 0;

  // Calculate MRR (simplified - count active clients by plan)
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

  // Get recent clients
  const { data: recentClients } = await supabase
    .from('clients')
    .select('id, business_name, status, created_at, plan_type')
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

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'voiceaiconnect.com';
  const signupLink = agency.marketing_domain && agency.domain_verified
    ? `https://${agency.marketing_domain}/signup`
    : `https://${agency.slug}.${platformDomain}/signup`;

  const trialDaysLeft = agency.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(agency.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          {agency.logo_url ? (
            <img src={agency.logo_url} alt={agency.name} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: agency.primary_color || '#2563eb' }}
            >
              <Phone className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="font-semibold text-gray-900 truncate">{agency.name}</span>
        </div>

        <nav className="p-4 space-y-1">
          <Link
            href="/agency/dashboard"
            className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600"
          >
            <TrendingUp className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/agency/clients"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <Users className="h-5 w-5" />
            Clients
          </Link>
          <Link
            href="/agency/revenue"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <DollarSign className="h-5 w-5" />
            Revenue
          </Link>
          <Link
            href="/agency/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back{user.first_name ? `, ${user.first_name}` : ''}! 👋
            </h1>
            <p className="mt-1 text-gray-600">Here&apos;s how your agency is doing.</p>
          </div>

          {/* Trial Banner */}
          {agency.subscription_status === 'trial' && trialDaysLeft !== null && (
            <div className="mb-8 rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    {trialDaysLeft > 0 ? `${trialDaysLeft} days left in your trial` : 'Your trial has ended'}
                  </p>
                  <p className="text-sm text-blue-700">Upgrade to keep your agency running.</p>
                </div>
              </div>
              <Button size="sm">Upgrade Now</Button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Clients</p>
                    <p className="text-3xl font-bold text-gray-900">{clientCount}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(mrr)}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Calls This Month</p>
                    <p className="text-3xl font-bold text-gray-900">{totalCalls.toLocaleString()}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <PhoneCall className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signup Link */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Your Client Signup Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-mono text-sm">
                  {signupLink}
                </div>
                <Button variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <a 
                  href={signupLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-gray-300 bg-white hover:bg-gray-50 h-9 px-3"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview
                </a>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Share this link with potential clients to let them sign up for your AI receptionist service.
              </p>
            </CardContent>
          </Card>

          {/* Recent Clients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Clients</CardTitle>
              <Link href="/agency/clients" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {recentClients.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-gray-600">No clients yet</p>
                  <p className="text-sm text-gray-500">Share your signup link to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{client.business_name}</p>
                        <p className="text-sm text-gray-500">
                          {client.plan_type} plan • {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          client.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : client.status === 'trial'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
