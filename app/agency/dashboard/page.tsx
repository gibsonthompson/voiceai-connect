'use client';

import { useState, useEffect } from 'react';
import { 
  Users, DollarSign, PhoneCall, Clock, Copy, Check,
  ChevronRight, ArrowUpRight, Loader2
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '../../../hooks/useTheme';
import { DEMO_DASHBOARD } from '../demoData';

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

// Helper to check if subscription is in trial state (handles both 'trial' and 'trialing')
function isTrialStatus(status: string | null | undefined): boolean {
  return status === 'trial' || status === 'trialing';
}

export default function AgencyDashboardPage() {
  const { agency, user, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!agency) return;

    if (demoMode) {
      setStats(DEMO_DASHBOARD as DashboardStats);
      setLoading(false);
      return;
    }

    fetchDashboardData();
  }, [agency, demoMode]);

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
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Clients',
      value: stats?.clientCount || 0,
      icon: Users,
      color: theme.primary,
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(stats?.mrr || 0),
      icon: DollarSign,
      color: theme.warning,
    },
    {
      label: 'Calls This Month',
      value: stats?.totalCalls || 0,
      icon: PhoneCall,
      color: theme.info,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}! 👋
        </h1>
        <p className="mt-1 text-sm sm:text-base" style={{ color: theme.textMuted }}>
          Here&apos;s how your agency is performing.
        </p>
      </div>

      {/* Trial Info Banner */}
      {!demoMode && isTrialStatus(agency?.subscription_status) && trialDaysLeft !== null && (
        <div 
          className="mb-6 sm:mb-8 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{
            backgroundColor: theme.infoBg,
            border: `1px solid ${theme.infoBorder}`,
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{ backgroundColor: theme.infoBg }}
            >
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.info }} />
            </div>
            <div>
              <p className="font-medium text-sm sm:text-base" style={{ color: theme.infoText }}>
                {trialDaysLeft} days remaining in your trial
              </p>
              <p className="text-xs sm:text-sm" style={{ color: theme.infoText, opacity: 0.7 }}>
                Your card will be charged automatically when the trial ends. No action needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signup Link Card */}
      <div 
        className="mb-6 sm:mb-8 rounded-xl p-4 sm:p-5"
        style={{
          background: theme.isDark 
            ? `linear-gradient(to right, ${theme.primary}12, transparent)` 
            : `linear-gradient(to right, ${theme.primary}08, transparent)`,
          border: `1px solid ${theme.primary30}`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm mb-1" style={{ color: theme.textMuted }}>Your Client Signup Link</p>
            <p className="text-sm sm:text-lg font-medium truncate" style={{ color: theme.primary }}>
              {signupLink}
            </p>
          </div>
          <button
            onClick={copySignupLink}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex-shrink-0"
            style={{
              backgroundColor: theme.primary15,
              border: `1px solid ${theme.primary}40`,
              color: theme.primary,
            }}
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
            className="rounded-xl p-4 sm:p-6"
            style={{ 
              backgroundColor: theme.card,
              border: `1px solid ${theme.border}`,
              boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
              <div className="order-2 sm:order-1">
                <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>{stat.label}</p>
                <p className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-semibold" style={{ color: theme.text }}>{stat.value}</p>
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
      <div 
        className="rounded-xl"
        style={{ 
          backgroundColor: theme.card,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div 
          className="flex items-center justify-between p-4 sm:p-5"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <h2 className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>Recent Clients</h2>
          <a 
            href="/agency/clients" 
            className="flex items-center gap-1 text-xs sm:text-sm transition-colors"
            style={{ color: theme.primary }}
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        
        <div className="p-4 sm:p-5">
          {!stats?.recentClients || stats.recentClients.length === 0 ? (
            <div className="py-8 sm:py-12 text-center">
              <div 
                className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.primary15 }}
              >
                <Users className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.textMuted }} />
              </div>
              <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: theme.text, opacity: 0.7 }}>
                No clients yet
              </p>
              <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>
                Share your signup link to start acquiring clients.
              </p>
              <button
                onClick={copySignupLink}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: theme.primary, 
                  color: theme.primaryText,
                }}
              >
                <Copy className="h-4 w-4" />
                Copy Signup Link
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {stats.recentClients.map((client) => (
                <a
                  key={client.id}
                  href={`/agency/clients/${client.id}`}
                  className="flex items-center justify-between rounded-xl p-3 sm:p-4 transition-colors"
                  style={{ 
                    backgroundColor: theme.card,
                    border: `1px solid ${theme.border}`,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.card}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full flex-shrink-0"
                      style={{ backgroundColor: theme.primary15 }}
                    >
                      <span className="text-xs sm:text-sm font-medium" style={{ color: theme.primary }}>
                        {client.business_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate" style={{ color: theme.text }}>{client.business_name}</p>
                      <p className="text-xs sm:text-sm capitalize" style={{ color: theme.textMuted }}>
                        {client.plan_type || 'starter'} plan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span
                      className="rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium"
                      style={
                        client.subscription_status === 'active'
                          ? { backgroundColor: theme.successBg, color: theme.success }
                          : client.subscription_status === 'trial' || client.subscription_status === 'trialing'
                          ? { backgroundColor: theme.infoBg, color: theme.info }
                          : { backgroundColor: theme.hover, color: theme.textMuted }
                      }
                    >
                      {client.subscription_status === 'trialing' ? 'trial' : (client.subscription_status || 'pending')}
                    </span>
                    <ArrowUpRight className="h-4 w-4 hidden sm:block" style={{ color: theme.textMuted }} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}