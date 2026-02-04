'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Users, PhoneCall, DollarSign, 
  TrendingUp, Clock, ArrowRight, Loader2,
  ChevronRight
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
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'trialing':
      case 'trial':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'past_due':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'canceled':
      case 'suspended':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Platform Overview</h1>
        <p className="mt-1 text-white/50">Monitor your agencies and clients</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Total Agencies"
          value={stats?.totalAgencies || 0}
          subtext={`${stats?.trialAgencies || 0} on trial`}
          icon={Building2}
          color="blue"
        />
        <StatCard
          label="Total Clients"
          value={stats?.totalClients || 0}
          subtext={`${stats?.activeClients || 0} active`}
          icon={Users}
          color="emerald"
        />
        <StatCard
          label="Platform MRR"
          value={formatCurrency(stats?.platformMRR || 0)}
          subtext={`${stats?.activeAgencies || 0} paying`}
          icon={DollarSign}
          color="amber"
        />
        <StatCard
          label="Calls This Month"
          value={stats?.callsThisMonth || 0}
          subtext="Across all clients"
          icon={PhoneCall}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{stats?.recentAgencies || 0}</p>
              <p className="text-sm text-white/50">New agencies (7d)</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{stats?.recentClients || 0}</p>
              <p className="text-sm text-white/50">New clients (7d)</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{stats?.trialAgencies || 0}</p>
              <p className="text-sm text-white/50">Trials ending soon</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <DollarSign className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">
                {formatCurrency((stats?.platformMRR || 0) * 12)}
              </p>
              <p className="text-sm text-white/50">Projected ARR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Agencies */}
      <div className="rounded-xl bg-gray-900 border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 p-4 lg:p-6">
          <h2 className="font-semibold text-white">Recent Agencies</h2>
          <Link 
            href="/admin/agencies"
            className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="p-4 lg:p-6">
          {recentAgencies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/50">No agencies yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAgencies.map((agency) => (
                <Link
                  key={agency.id}
                  href={`/admin/agencies/${agency.id}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Building2 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{agency.name}</p>
                      <p className="text-sm text-white/50">{agency.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(agency.subscription_status)}`}>
                      {agency.subscription_status || 'pending'}
                    </span>
                    <span className="text-sm text-white/40 hidden sm:block">
                      {formatDate(agency.created_at)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-white/30" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  subtext, 
  icon: Icon, 
  color 
}: { 
  label: string;
  value: string | number;
  subtext: string;
  icon: any;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="rounded-xl bg-gray-900 border border-white/10 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/50">{label}</p>
          <p className="mt-1 text-2xl lg:text-3xl font-semibold text-white">{value}</p>
          <p className="mt-1 text-sm text-white/40">{subtext}</p>
        </div>
        <div className={`flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
        </div>
      </div>
    </div>
  );
}