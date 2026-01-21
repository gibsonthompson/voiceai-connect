import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, PhoneCall, Settings, LogOut, 
  Clock, Copy, TrendingUp, MessageSquare,
  ChevronRight, Calendar, AlertCircle
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function getClientData(clientId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Get client details
  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      agency:agencies(name, logo_url, primary_color, support_email)
    `)
    .eq('id', clientId)
    .single();

  // Get recent calls
  const { data: recentCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get call stats for this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: callsThisMonth } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('created_at', startOfMonth.toISOString());

  const { count: highUrgency } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('urgency_level', 'high')
    .gte('created_at', startOfMonth.toISOString());

  return {
    client,
    recentCalls: recentCalls || [],
    callsThisMonth: callsThisMonth || 0,
    highUrgency: highUrgency || 0,
  };
}

export default async function ClientDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user || !user.client_id) {
    redirect('/client/login');
  }

  const { client, recentCalls, callsThisMonth, highUrgency } = await getClientData(user.client_id);

  if (!client) {
    redirect('/client/login');
  }

  const agency = client.agency;
  const trialDaysLeft = client.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(client.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const navItems = [
    { href: '/client/dashboard', label: 'Dashboard', icon: TrendingUp, active: true },
    { href: '/client/calls', label: 'Calls', icon: PhoneCall, active: false },
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
          <div className="mb-8">
            <h1 className="text-2xl font-medium tracking-tight">
              Welcome back! 👋
            </h1>
            <p className="mt-1 text-[#f5f5f0]/50">Here&apos;s your AI receptionist activity.</p>
          </div>

          {/* Trial Banner */}
          {client.subscription_status === 'trial' && trialDaysLeft !== null && (
            <div className="mb-8 rounded-xl border border-blue-400/20 bg-blue-400/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-[#f5f5f0]">
                    {trialDaysLeft > 0 ? `${trialDaysLeft} days left in your trial` : 'Your trial has ended'}
                  </p>
                  <p className="text-sm text-[#f5f5f0]/50">Upgrade to keep your AI receptionist active.</p>
                </div>
              </div>
              <button className="rounded-full bg-blue-400 px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-all hover:bg-blue-300">
                Upgrade Now
              </button>
            </div>
          )}

          {/* Phone Number Card */}
          <div className="mb-8 rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 to-transparent p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/20">
                <Phone className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-[#f5f5f0]/50">Your AI Phone Number</p>
                <p className="text-2xl font-semibold tracking-tight">{client.vapi_phone_number || '(Not assigned)'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#f5f5f0]/70 hover:bg-white/10 hover:text-[#f5f5f0] transition-colors">
                <Copy className="h-4 w-4" />
                Copy Number
              </button>
              <p className="text-sm text-[#f5f5f0]/40">Forward your business calls to this number</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {[
              {
                label: 'Calls This Month',
                value: callsThisMonth,
                subtext: `of ${client.monthly_call_limit || 50} included`,
                icon: PhoneCall,
                color: 'text-blue-400',
                bgColor: 'bg-blue-400/10',
              },
              {
                label: 'High Priority',
                value: highUrgency,
                subtext: 'Urgent calls',
                icon: AlertCircle,
                color: 'text-amber-400',
                bgColor: 'bg-amber-400/10',
              },
              {
                label: 'Appointments',
                value: '—',
                subtext: 'Connect calendar to track',
                icon: Calendar,
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
                    <p className="mt-1 text-xs text-[#f5f5f0]/40">{stat.subtext}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Calls */}
          <div className="rounded-xl border border-white/10 bg-[#111]">
            <div className="flex items-center justify-between border-b border-white/5 p-6">
              <h2 className="font-medium">Recent Calls</h2>
              <Link 
                href="/client/calls" 
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="p-6">
              {recentCalls.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                    <PhoneCall className="h-8 w-8 text-[#f5f5f0]/30" />
                  </div>
                  <p className="mt-4 font-medium text-[#f5f5f0]/70">No calls yet</p>
                  <p className="text-sm text-[#f5f5f0]/40">Forward calls to your AI number to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCalls.map((call) => (
                    <Link
                      key={call.id}
                      href={`/client/calls/${call.id}`}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                          <PhoneCall className="h-5 w-5 text-[#f5f5f0]/50" />
                        </div>
                        <div>
                          <p className="font-medium">{call.customer_name || 'Unknown Caller'}</p>
                          <p className="text-sm text-[#f5f5f0]/50">
                            {call.customer_phone || call.caller_phone} • {call.service_requested || 'General inquiry'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
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