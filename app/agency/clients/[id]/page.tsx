import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, Users, DollarSign, PhoneCall, 
  Settings, LogOut, TrendingUp, Search, 
  Plus, ChevronRight, Filter
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

  const navItems = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: TrendingUp, active: false },
    { href: '/agency/clients', label: 'Clients', icon: Users, active: true },
    { href: '/agency/revenue', label: 'Revenue', icon: DollarSign, active: false },
    { href: '/agency/settings', label: 'Settings', icon: Settings, active: false },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-400/10 text-emerald-400';
      case 'trial':
        return 'bg-blue-400/10 text-blue-400';
      case 'past_due':
        return 'bg-amber-400/10 text-amber-400';
      case 'suspended':
      case 'cancelled':
        return 'bg-red-400/10 text-red-400';
      default:
        return 'bg-white/10 text-[#f5f5f0]/60';
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
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium tracking-tight">Clients</h1>
              <p className="mt-1 text-[#f5f5f0]/50">{clients.length} total clients</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f5f5f0]/40" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-64 rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 transition-colors"
                />
              </div>
              
              {/* Filter */}
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#f5f5f0]/70 hover:bg-white/10 hover:text-[#f5f5f0] transition-colors">
                <Filter className="h-4 w-4" />
                Filter
              </button>
              
              {/* Add Client */}
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#f5f5f0] px-4 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-white transition-colors">
                <Plus className="h-4 w-4" />
                Add Client
              </button>
            </div>
          </div>

          {/* Clients List */}
          <div className="rounded-xl border border-white/10 bg-[#111]">
            {clients.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Users className="h-8 w-8 text-[#f5f5f0]/30" />
                </div>
                <p className="mt-4 font-medium text-[#f5f5f0]/70">No clients yet</p>
                <p className="text-sm text-[#f5f5f0]/40">Share your signup link to get started!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium text-[#f5f5f0]/40 uppercase tracking-wide">
                  <div className="col-span-4">Business</div>
                  <div className="col-span-2">Plan</div>
                  <div className="col-span-2">Calls</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Added</div>
                </div>
                
                {/* Table Rows */}
                {clients.map((client) => (
                  <Link
                    key={client.id}
                    href={`/agency/clients/${client.id}`}
                    className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                          <span className="text-sm font-medium text-[#f5f5f0]/70">
                            {client.business_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{client.business_name}</p>
                          <p className="text-sm text-[#f5f5f0]/50">{client.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <p className="text-sm capitalize">{client.plan_type || 'starter'}</p>
                      <p className="text-xs text-[#f5f5f0]/40">
                        ${(getPlanPrice(client.plan_type) / 100).toFixed(0)}/mo
                      </p>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-[#f5f5f0]/40" />
                        <span className="text-sm">{client.calls_this_month || 0}</span>
                        <span className="text-xs text-[#f5f5f0]/40">this month</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="text-sm text-[#f5f5f0]/50">
                        {new Date(client.created_at).toLocaleDateString()}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#f5f5f0]/30" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}