import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, Users, DollarSign, PhoneCall, 
  Settings, LogOut, TrendingUp, ArrowLeft,
  Calendar, Globe, Mail, Clock, Play, Pause
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';

async function getClientData(clientId: string, agencyId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single();

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('agency_id', agencyId)
    .single();

  const { data: recentCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    agency,
    client,
    recentCalls: recentCalls || [],
  };
}

export default async function ClientDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  if (!user || !user.agency_id) {
    redirect('/agency/login');
  }

  const { agency, client, recentCalls } = await getClientData(id, user.agency_id);

  if (!agency) {
    redirect('/agency/login');
  }

  if (!client) {
    notFound();
  }

  const navItems = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: TrendingUp, active: false },
    { href: '/agency/clients', label: 'Clients', icon: Users, active: true },
    { href: '/agency/revenue', label: 'Revenue', icon: DollarSign, active: false },
    { href: '/agency/settings', label: 'Settings', icon: Settings, active: false },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case 'trial':
        return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case 'past_due':
        return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
      case 'suspended':
      case 'cancelled':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      default:
        return 'bg-white/10 text-[#f5f5f0]/60 border-white/10';
    }
  };

  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case 'starter':
        return agency.price_starter || 4900;
      case 'pro':
        return agency.price_pro || 9900;
      case 'growth':
        return agency.price_growth || 14900;
      default:
        return 0;
    }
  };

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f0]">
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
          {/* Back Button & Header */}
          <div className="mb-8">
            <Link 
              href="/agency/clients"
              className="inline-flex items-center gap-2 text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Link>
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5">
                  <span className="text-2xl font-medium text-[#f5f5f0]/70">
                    {client.business_name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-medium tracking-tight">{client.business_name}</h1>
                  <p className="mt-1 text-[#f5f5f0]/50">{client.email}</p>
                </div>
              </div>
              
              <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium ${getStatusColor(client.subscription_status || client.status)}`}>
                {client.subscription_status || client.status}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <div className="rounded-xl border border-white/10 bg-[#111] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10">
                  <Phone className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-[#f5f5f0]/50">AI Phone</p>
                  <p className="font-medium">{client.vapi_phone_number || 'Not assigned'}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-[#111] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10">
                  <PhoneCall className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-[#f5f5f0]/50">Calls This Month</p>
                  <p className="font-medium">{client.calls_this_month || 0} / {client.monthly_call_limit || 50}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-[#111] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-400/10">
                  <DollarSign className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-[#f5f5f0]/50">Plan</p>
                  <p className="font-medium capitalize">{client.plan_type || 'starter'} - {formatCurrency(getPlanPrice(client.plan_type))}/mo</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/10 bg-[#111] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
                  <Calendar className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-[#f5f5f0]/50">Member Since</p>
                  <p className="font-medium">{new Date(client.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Client Details */}
            <div className="lg:col-span-1 rounded-xl border border-white/10 bg-[#111] p-6">
              <h3 className="font-medium mb-4">Business Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#f5f5f0]/40">Owner</p>
                  <p className="mt-1">{client.owner_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#f5f5f0]/40">Phone</p>
                  <p className="mt-1">{client.owner_phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#f5f5f0]/40">Location</p>
                  <p className="mt-1">{client.business_city}, {client.business_state}</p>
                </div>
                <div>
                  <p className="text-sm text-[#f5f5f0]/40">Industry</p>
                  <p className="mt-1 capitalize">{client.industry || 'Not specified'}</p>
                </div>
                {client.business_website && (
                  <div>
                    <p className="text-sm text-[#f5f5f0]/40">Website</p>
                    <a 
                      href={client.business_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-4 w-4" />
                      {client.business_website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Calls */}
            <div className="lg:col-span-2 rounded-xl border border-white/10 bg-[#111]">
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <h3 className="font-medium">Recent Calls</h3>
                <Link 
                  href={`/agency/clients/${client.id}/calls`}
                  className="text-sm text-blue-400 hover:underline"
                >
                  View All
                </Link>
              </div>
              
              {recentCalls.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                    <PhoneCall className="h-6 w-6 text-[#f5f5f0]/30" />
                  </div>
                  <p className="mt-4 text-[#f5f5f0]/50">No calls yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentCalls.map((call: any) => (
                    <div key={call.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                          <PhoneCall className="h-5 w-5 text-[#f5f5f0]/50" />
                        </div>
                        <div>
                          <p className="font-medium">{call.caller_phone || 'Unknown'}</p>
                          <p className="text-sm text-[#f5f5f0]/50">
                            {call.duration ? `${Math.round(call.duration / 60)} min` : 'No duration'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#f5f5f0]/50">
                          {new Date(call.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-[#f5f5f0]/30">
                          {new Date(call.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
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