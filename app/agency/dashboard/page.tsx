import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, Users, DollarSign, PhoneCall, 
  Settings, LogOut, Copy, ExternalLink,
  TrendingUp, Clock, ChevronRight, Zap
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';

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

  const navItems = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: TrendingUp, active: true },
    { href: '/agency/clients', label: 'Clients', icon: Users, active: false },
    { href: '/agency/revenue', label: 'Revenue', icon: DollarSign, active: false },
    { href: '/agency/settings', label: 'Settings', icon: Settings, active: false },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      {/* Subtle grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5 bg-[#0a0a0a]">
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
          {agency.logo_url ? (
            <img src={agency.logo_url} alt={agency.name} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f0]"
            >
              <Phone className="h-4 w-4 text-[#0a0a0a]" />
            </div>
          )}
          <span className="font-medium text-[#f5f5f0] truncate">{agency.name}</span>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-white/10 text-[#f5f5f0]'
                  : 'text-[#f5f5f0]/60 hover:bg-white/5 hover:text-[#f5f5f0]'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 p-4">
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f5f5f0]/60 hover:bg-white/5 hover:text-[#f5f5f0] transition-colors"
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
            <h1 className="text-2xl font-medium tracking-tight">
              Welcome back{user.first_name ? `, ${user.first_name}` : ''}! 👋
            </h1>
            <p className="mt-1 text-[#f5f5f0]/50">Here&apos;s how your agency is doing.</p>
          </div>

          {/* Trial Banner */}
          {agency.subscription_status === 'trial' && trialDaysLeft !== null && (
            <div className="mb-8 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
                  <Clock className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-[#f5f5f0]">
                    {trialDaysLeft > 0 ? `${trialDaysLeft} days left in your trial` : 'Your trial has ended'}
                  </p>
                  <p className="text-sm text-[#f5f5f0]/50">Upgrade to keep your agency running.</p>
                </div>
              </div>
              <button className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-all hover:bg-emerald-300">
                Upgrade Now
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {[
              {
                label: 'Total Clients',
                value: clientCount,
                icon: Users,
                color: 'text-blue-400',
                bgColor: 'bg-blue-400/10',
              },
              {
                label: 'Monthly Revenue',
                value: formatCurrency(mrr),
                icon: DollarSign,
                color: 'text-emerald-400',
                bgColor: 'bg-emerald-400/10',
              },
              {
                label: 'Calls This Month',
                value: totalCalls.toLocaleString(),
                icon: PhoneCall,
                color: 'text-purple-400',
                bgColor: 'bg-purple-400/10',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-[#111] p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#f5f5f0]/50">{stat.label}</p>
                    <p className="mt-1 text-3xl font-semibold">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Signup Link */}
          <div className="rounded-xl border border-white/10 bg-[#111] p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-medium">Your Client Signup Link</h2>
                <p className="text-sm text-[#f5f5f0]/50">Share this with potential clients</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-[#f5f5f0]/70 overflow-hidden overflow-ellipsis">
                {signupLink}
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#f5f5f0]/70 hover:bg-white/10 hover:text-[#f5f5f0] transition-colors">
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <a 
                href={signupLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#f5f5f0]/70 hover:bg-white/10 hover:text-[#f5f5f0] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Preview
              </a>
            </div>
          </div>

          {/* Recent Clients */}
          <div className="rounded-xl border border-white/10 bg-[#111]">
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <h2 className="font-medium">Recent Clients</h2>
              <Link 
                href="/agency/clients" 
                className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="p-6">
              {recentClients.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <Users className="h-8 w-8 text-[#f5f5f0]/30" />
                  </div>
                  <p className="mt-4 font-medium text-[#f5f5f0]/70">No clients yet</p>
                  <p className="text-sm text-[#f5f5f0]/40">Share your signup link to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/agency/clients/${client.id}`}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
                    >
                      <div>
                        <p className="font-medium">{client.business_name}</p>
                        <p className="text-sm text-[#f5f5f0]/50">
                          {client.plan_type} plan • {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          client.status === 'active'
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : client.status === 'trial'
                            ? 'bg-blue-400/10 text-blue-400'
                            : 'bg-white/10 text-[#f5f5f0]/60'
                        }`}
                      >
                        {client.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}