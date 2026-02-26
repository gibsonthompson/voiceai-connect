'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Users, PhoneCall, DollarSign, 
  TrendingUp, Clock, ArrowRight, Loader2,
  ChevronRight, ArrowUpRight, Zap
} from 'lucide-react';

interface DashboardStats {
  totalAgencies: number;
  activeAgencies: number;
  trialAgencies: number;
  totalClients: number;
  activeClients: number;
  platformMRR: number;
  callsThisMonth: number;
  recentAgencies: number;
  recentClients: number;
}

interface Agency {
  id: string;
  name: string;
  email: string;
  plan_type: string;
  subscription_status: string;
  created_at: string;
}

// Inline waveform logo for header area
function WaveformIcon({ size = 20, color = '#10b981' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="9" width="2" height="6" rx="1" fill={color} opacity="0.5" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill={color} opacity="0.7" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill={color} opacity="0.9" />
      <rect x="11" y="6" width="2" height="12" rx="1" fill={color} />
      <rect x="14" y="3" width="2" height="18" rx="1" fill={color} />
      <rect x="17" y="7" width="2" height="10" rx="1" fill={color} opacity="0.7" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill={color} opacity="0.5" />
    </svg>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAgencies, setRecentAgencies] = useState<Agency[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      
      const response = await fetch(`${backendUrl}/api/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load dashboard');

      const data = await response.json();
      setStats(data.stats);
      setRecentAgencies(data.recentAgencyList || []);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'trialing':
      case 'trial':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'past_due':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'canceled':
      case 'suspended':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const getPlanLabel = (plan: string) => {
    return plan?.charAt(0).toUpperCase() + plan?.slice(1) || 'Starter';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
      </div>
    );
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white/40 text-sm">{greeting}, Gibson</span>
        </div>
        <h1 className="text-[26px] font-semibold text-white tracking-tight">Platform Overview</h1>
      </div>

      {/* Hero Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {/* MRR — hero card */}
        <div className="relative col-span-2 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-600/[0.04] to-transparent" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/[0.06] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative border border-emerald-500/[0.1] rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-400/70 uppercase tracking-[0.15em]">Monthly Recurring Revenue</p>
                <p className="mt-2 text-4xl lg:text-5xl font-semibold text-white tracking-tight">
                  {formatCurrency(stats?.platformMRR || 0)}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-sm text-white/50">
                    <span className="text-emerald-400 font-medium">{stats?.activeAgencies || 0}</span> paying
                  </span>
                  <span className="text-white/15">·</span>
                  <span className="text-sm text-white/50">
                    ARR {formatCurrency((stats?.platformMRR || 0) * 12)}
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/10">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Agencies */}
        <StatCard
          label="Agencies"
          value={stats?.totalAgencies || 0}
          detail={`${stats?.activeAgencies || 0} active · ${stats?.trialAgencies || 0} trial`}
          icon={Building2}
          accentClass="text-white/90"
          iconBg="bg-white/[0.05] border-white/[0.08]"
        />

        {/* Calls */}
        <StatCard
          label="Calls This Month"
          value={(stats?.callsThisMonth || 0).toLocaleString()}
          detail="Across all clients"
          icon={PhoneCall}
          accentClass="text-white/90"
          iconBg="bg-white/[0.05] border-white/[0.08]"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <MiniStat 
          label="Total Clients" 
          value={stats?.totalClients || 0} 
          sub={`${stats?.activeClients || 0} active`}
          icon={Users}
          color="emerald"
        />
        <MiniStat 
          label="New Agencies" 
          value={stats?.recentAgencies || 0} 
          sub="Last 7 days"
          icon={TrendingUp}
          color="cyan"
        />
        <MiniStat 
          label="New Clients" 
          value={stats?.recentClients || 0} 
          sub="Last 7 days"
          icon={Zap}
          color="violet"
        />
        <MiniStat 
          label="Trials Active" 
          value={stats?.trialAgencies || 0} 
          sub="Converting soon"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Recent Agencies */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-5 lg:px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-white/35" />
            <h2 className="text-sm font-semibold text-white/80">Recent Agencies</h2>
          </div>
          <Link 
            href="/admin/agencies"
            className="flex items-center gap-1 text-xs font-medium text-emerald-400/70 hover:text-emerald-400 transition-colors"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        
        {recentAgencies.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="relative inline-flex">
              <div className="absolute inset-0 blur-2xl bg-emerald-500/10 rounded-full" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <Building2 className="h-7 w-7 text-white/20" />
              </div>
            </div>
            <p className="mt-4 text-sm text-white/40">No agencies yet</p>
            <p className="mt-1 text-xs text-white/30">They&apos;ll appear here as they sign up</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {recentAgencies.map((agency, i) => (
              <Link
                key={agency.id}
                href={`/admin/agencies?expand=${agency.id}`}
                className="group flex items-center justify-between px-5 lg:px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  {/* Numbered index */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] font-semibold text-white/30">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/85 group-hover:text-white transition-colors">{agency.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{agency.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${getStatusColor(agency.subscription_status)}`}>
                    {agency.subscription_status || 'pending'}
                  </span>
                  <span className="text-[11px] text-white/30 hidden sm:block tabular-nums">
                    {formatDate(agency.created_at)}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/15 group-hover:text-emerald-400/50 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ 
  label, value, detail, icon: Icon, accentClass, iconBg,
}: { 
  label: string;
  value: string | number;
  detail: string;
  icon: any;
  accentClass: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-white/50 uppercase tracking-[0.1em]">{label}</p>
          <p className={`mt-2 text-3xl font-semibold tracking-tight ${accentClass}`}>{value}</p>
          <p className="mt-1.5 text-xs text-white/40">{detail}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${iconBg}`}>
          <Icon className="h-5 w-5 text-white/35" />
        </div>
      </div>
    </div>
  );
}

/* ─── Mini Stat ─── */
function MiniStat({ 
  label, value, sub, icon: Icon, color 
}: { 
  label: string;
  value: number;
  sub: string;
  icon: any;
  color: 'emerald' | 'cyan' | 'violet' | 'amber';
}) {
  const colors = {
    emerald: { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/[0.08]' },
    cyan:    { dot: 'bg-cyan-400',    text: 'text-cyan-400',    bg: 'bg-cyan-500/[0.08]' },
    violet:  { dot: 'bg-violet-400',  text: 'text-violet-400',  bg: 'bg-violet-500/[0.08]' },
    amber:   { dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-500/[0.08]' },
  };

  const c = colors[color];

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 flex items-center gap-3.5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
        <Icon className={`h-4.5 w-4.5 ${c.text}`} style={{ width: 18, height: 18 }} />
      </div>
      <div>
        <p className="text-xl font-semibold text-white/90 tabular-nums">{value}</p>
        <p className="text-[11px] text-white/35 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}