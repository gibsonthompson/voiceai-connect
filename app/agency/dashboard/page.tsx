'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, DollarSign, PhoneCall, Clock, Copy, Check,
  ChevronRight, ArrowUpRight, Loader2
} from 'lucide-react';
import { useAgency } from '../context';

interface RecentClient {
  id: string;
  business_name: string;
  status: string;
  created_at: string;
  plan_type: string;
  subscription_status: string;
}

interface DashboardStats {
  clientCount: number;
  mrr: number;
  totalCalls: number;
  recentClients: RecentClient[];
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function AgencyDashboardPage() {
  const { agency, user, branding, loading: contextLoading } = useAgency();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (agency) {
      fetchDashboardData();
    }
  }, [agency]);

  const fetchDashboardData = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          clientCount: data.clientCount || 0,
          mrr: data.mrr || 0,
          totalCalls: data.totalCalls || 0,
          recentClients: data.recentClients || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
  const signupLink = agency?.marketing_domain && agency?.domain_verified
    ? `https://${agency.marketing_domain}/signup`
    : `https://${agency?.slug}.${platformDomain}/signup`;

  const copySignupLink = () => {
    navigator.clipboard.writeText(signupLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const trialDaysLeft = agency?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(agency.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Clients',
      value: stats?.clientCount || 0,
      icon: Users,
      color: '#10b981',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(stats?.mrr || 0),
      icon: DollarSign,
      color: '#f59e0b',
    },
    {
      label: 'Calls This Month',
      value: stats?.totalCalls || 0,
      icon: PhoneCall,
      color: '#3b82f6',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}! 👋
        </h1>
        <p className="mt-1 text-sm sm:text-base text-[#fafaf9]/50">
          Here&apos;s how your agency is performing.
        </p>
      </div>

      {/* Trial Banner */}
      {agency?.subscription_status === 'trial' && trialDaysLeft !== null && (
        <div className="mb-6 sm:mb-8 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-500/20 flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-sm sm:text-base text-amber-200">
                {trialDaysLeft > 0 ? `${trialDaysLeft} days left in your trial` : 'Your trial has ended'}
              </p>
              <p className="text-xs sm:text-sm text-amber-300/60">
                Upgrade to keep your agency active and access all features.
              </p>
            </div>
          </div>
          <Link 
            href="/agency/settings/billing"
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-[#050505] hover:bg-amber-400 transition-colors text-center sm:text-left"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Signup Link Card */}
      <div className="mb-6 sm:mb-8 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] to-transparent p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-[#fafaf9]/50 mb-1">Your Client Signup Link</p>
            <p className="text-sm sm:text-lg font-medium text-emerald-300 truncate">
              {signupLink}
            </p>
          </div>
          <button
            onClick={copySignupLink}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6"
          >
            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
              <div className="order-2 sm:order-1">
                <p className="text-xs sm:text-sm text-[#fafaf9]/50">{stat.label}</p>
                <p className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-semibold">{stat.value}</p>
              </div>
              <div 
                className="order-1 sm:order-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Clients */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-4 sm:p-5">
          <h2 className="font-medium text-sm sm:text-base">Recent Clients</h2>
          <Link 
            href="/agency/clients" 
            className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="p-4 sm:p-5">
          {!stats?.recentClients || stats.recentClients.length === 0 ? (
            <div className="py-8 sm:py-12 text-center">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[#fafaf9]/30" />
              </div>
              <p className="mt-4 font-medium text-sm sm:text-base text-[#fafaf9]/60">No clients yet</p>
              <p className="text-xs sm:text-sm text-[#fafaf9]/40 mb-4">
                Share your signup link to start acquiring clients.
              </p>
              <button
                onClick={copySignupLink}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copy Signup Link
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {stats.recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/agency/clients/${client.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-emerald-500/10 flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-emerald-400">
                        {client.business_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{client.business_name}</p>
                      <p className="text-xs sm:text-sm text-[#fafaf9]/50 capitalize">
                        {client.plan_type || 'starter'} plan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span
                      className={`rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium ${
                        client.subscription_status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : client.subscription_status === 'trial'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-white/[0.06] text-[#fafaf9]/50'
                      }`}
                    >
                      {client.subscription_status || 'pending'}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#fafaf9]/30 hidden sm:block" />
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