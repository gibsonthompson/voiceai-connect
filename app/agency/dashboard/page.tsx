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

// Helper to check if subscription is in trial state (handles both 'trial' and 'trialing')
function isTrialStatus(status: string | null | undefined): boolean {
  return status === 'trial' || status === 'trialing';
}

// Helper to check if subscription is expired
function isExpiredStatus(status: string | null | undefined): boolean {
  return status === 'expired' || status === 'trial_expired' || status === 'canceled' || status === 'cancelled';
}

export default function AgencyDashboardPage() {
  const { agency, user, branding, loading: contextLoading } = useAgency();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';

  // Agency colors
  const primaryColor = branding.primaryColor || '#10b981';

  // Theme-based colors
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';

  // Check for expired trial and redirect
  useEffect(() => {
    if (!contextLoading && agency) {
      // Check if subscription is expired
      if (isExpiredStatus(agency.subscription_status)) {
        window.location.href = '/agency/settings/billing?expired=true';
        return;
      }
      
      // Check if trial has ended (past trial_ends_at date)
      if (isTrialStatus(agency.subscription_status) && agency.trial_ends_at) {
        const trialEnd = new Date(agency.trial_ends_at);
        if (trialEnd < new Date()) {
          window.location.href = '/agency/settings/billing?expired=true';
          return;
        }
      }
    }
  }, [agency, contextLoading]);

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
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Clients',
      value: stats?.clientCount || 0,
      icon: Users,
      color: primaryColor,
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
        <p className="mt-1 text-sm sm:text-base" style={{ color: mutedTextColor }}>
          Here&apos;s how your agency is performing.
        </p>
      </div>

      {/* Trial Banner - Check for both 'trial' and 'trialing' */}
      {isTrialStatus(agency?.subscription_status) && trialDaysLeft !== null && (
        <div 
          className="mb-6 sm:mb-8 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{ backgroundColor: 'rgba(245,158,11,0.2)' }}
            >
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
            </div>
            <div>
              <p className="font-medium text-sm sm:text-base" style={{ color: isDark ? '#fde68a' : '#92400e' }}>
                {trialDaysLeft > 0 ? `${trialDaysLeft} days left in your trial` : 'Your trial has ended'}
              </p>
              <p className="text-xs sm:text-sm" style={{ color: isDark ? 'rgba(253,230,138,0.6)' : '#b45309' }}>
                Upgrade to keep your agency active and access all features.
              </p>
            </div>
          </div>
          {/* Use <a> tag for proper navigation */}
          <a 
            href="/agency/settings/billing"
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors text-center sm:text-left"
            style={{ 
              backgroundColor: '#f59e0b',
              color: '#050505',
            }}
          >
            Upgrade Now
          </a>
        </div>
      )}

      {/* Signup Link Card */}
      <div 
        className="mb-6 sm:mb-8 rounded-xl p-4 sm:p-5"
        style={{
          background: isDark 
            ? `linear-gradient(to right, ${primaryColor}12, transparent)` 
            : `linear-gradient(to right, ${primaryColor}08, transparent)`,
          border: `1px solid ${primaryColor}30`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm mb-1" style={{ color: mutedTextColor }}>Your Client Signup Link</p>
            <p className="text-sm sm:text-lg font-medium truncate" style={{ color: primaryColor }}>
              {signupLink}
            </p>
          </div>
          <button
            onClick={copySignupLink}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex-shrink-0"
            style={{
              backgroundColor: `${primaryColor}15`,
              border: `1px solid ${primaryColor}40`,
              color: primaryColor,
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
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
              <div className="order-2 sm:order-1">
                <p className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>{stat.label}</p>
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
      <div 
        className="rounded-xl"
        style={{ 
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div 
          className="flex items-center justify-between p-4 sm:p-5"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <h2 className="font-medium text-sm sm:text-base">Recent Clients</h2>
          <a 
            href="/agency/clients" 
            className="flex items-center gap-1 text-xs sm:text-sm transition-colors"
            style={{ color: primaryColor }}
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
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Users className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: mutedTextColor }} />
              </div>
              <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: isDark ? 'rgba(250,250,249,0.6)' : '#374151' }}>
                No clients yet
              </p>
              <p className="text-xs sm:text-sm mb-4" style={{ color: mutedTextColor }}>
                Share your signup link to start acquiring clients.
              </p>
              <button
                onClick={copySignupLink}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: primaryColor, 
                  color: isDark ? '#050505' : '#ffffff',
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
                  className={`flex items-center justify-between rounded-xl p-3 sm:p-4 transition-colors ${
                    isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
                  }`}
                  style={{ 
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full flex-shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <span className="text-xs sm:text-sm font-medium" style={{ color: primaryColor }}>
                        {client.business_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{client.business_name}</p>
                      <p className="text-xs sm:text-sm capitalize" style={{ color: mutedTextColor }}>
                        {client.plan_type || 'starter'} plan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span
                      className="rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium"
                      style={
                        client.subscription_status === 'active'
                          ? { backgroundColor: `${primaryColor}15`, color: primaryColor }
                          : client.subscription_status === 'trial' || client.subscription_status === 'trialing'
                          ? { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: isDark ? '#fbbf24' : '#d97706' }
                          : { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: mutedTextColor }
                      }
                    >
                      {client.subscription_status === 'trialing' ? 'trial' : (client.subscription_status || 'pending')}
                    </span>
                    <ArrowUpRight className="h-4 w-4 hidden sm:block" style={{ color: mutedTextColor }} />
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