import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, PhoneCall, Settings, LogOut, 
  TrendingUp, Search, Filter, ChevronRight
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function getClientCalls(clientId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      agency:agencies(name, logo_url, primary_color, support_email)
    `)
    .eq('id', clientId)
    .single();

  const { data: calls } = await supabase
    .from('calls')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  return {
    client,
    calls: calls || [],
  };
}

export default async function ClientCallsPage() {
  const user = await getCurrentUser();
  
  if (!user || !user.client_id) {
    redirect('/client/login');
  }

  const { client, calls } = await getClientCalls(user.client_id);

  if (!client) {
    redirect('/client/login');
  }

  const agency = client.agency;

  const navItems = [
    { href: '/client/dashboard', label: 'Dashboard', icon: TrendingUp, active: false },
    { href: '/client/calls', label: 'Calls', icon: PhoneCall, active: true },
    { href: '/client/settings', label: 'Settings', icon: Settings, active: false },
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
          {agency?.logo_url ? (
            <img src={agency.logo_url} alt={agency.name} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f0]">
              <Phone className="h-4 w-4 text-[#0a0a0a]" />
            </div>
          )}
          <span className="font-medium text-[#f5f5f0] truncate">{client.business_name}</span>
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

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
          {agency && (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-xs text-[#f5f5f0]/40">Powered by</p>
              <p className="text-sm font-medium text-[#f5f5f0]/70">{agency.name}</p>
            </div>
          )}
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f5f5f0]/60 hover:bg-white/5 hover:text-[#f5f5f0] transition-colors border-t border-white/5 pt-4"
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
              <h1 className="text-2xl font-medium tracking-tight">Call History</h1>
              <p className="mt-1 text-[#f5f5f0]/50">{calls.length} total calls</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#f5f5f0]/40" />
                <input
                  type="text"
                  placeholder="Search calls..."
                  className="w-64 rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-[#f5f5f0] placeholder:text-[#f5f5f0]/30 focus:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/50 transition-colors"
                />
              </div>
              
              {/* Filter */}
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#f5f5f0]/70 hover:bg-white/10 hover:text-[#f5f5f0] transition-colors">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Calls List */}
          <div className="rounded-xl border border-white/10 bg-[#111]">
            {calls.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <PhoneCall className="h-8 w-8 text-[#f5f5f0]/30" />
                </div>
                <p className="mt-4 font-medium text-[#f5f5f0]/70">No calls yet</p>
                <p className="text-sm text-[#f5f5f0]/40">Your call history will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {calls.map((call) => (
                  <Link
                    key={call.id}
                    href={`/client/calls/${call.id}`}
                    className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        call.urgency_level === 'high' || call.urgency_level === 'emergency'
                          ? 'bg-red-400/10'
                          : call.urgency_level === 'medium'
                          ? 'bg-amber-400/10'
                          : 'bg-white/5'
                      }`}>
                        <PhoneCall className={`h-6 w-6 ${
                          call.urgency_level === 'high' || call.urgency_level === 'emergency'
                            ? 'text-red-400'
                            : call.urgency_level === 'medium'
                            ? 'text-amber-400'
                            : 'text-[#f5f5f0]/50'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{call.customer_name || 'Unknown Caller'}</p>
                        <p className="text-sm text-[#f5f5f0]/50">
                          {call.customer_phone || call.caller_phone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-[#f5f5f0]/70">{call.service_requested || 'General inquiry'}</p>
                        <p className="text-xs text-[#f5f5f0]/40">
                          {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '—'}
                        </p>
                      </div>
                      
                      <div className="text-right min-w-[100px]">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            call.urgency_level === 'high' || call.urgency_level === 'emergency'
                              ? 'bg-red-400/10 text-red-400'
                              : call.urgency_level === 'medium'
                              ? 'bg-amber-400/10 text-amber-400'
                              : 'bg-white/10 text-[#f5f5f0]/60'
                          }`}
                        >
                          {call.urgency_level || 'normal'}
                        </span>
                        <p className="mt-1 text-xs text-[#f5f5f0]/40">
                          {new Date(call.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-[#f5f5f0]/30" />
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