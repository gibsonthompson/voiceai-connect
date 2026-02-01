'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, DollarSign, Users, Wallet, CreditCard, 
  ChevronRight, Loader2
} from 'lucide-react';
import { useAgency } from '../context';

interface Stats {
  mrr: number;
  totalEarned: number;
  pendingPayout: number;
  activeClients: number;
  trialClients: number;
  totalClients: number;
}

interface Payment {
  id: string;
  client_id: string;
  amount: number;
  status: string;
  type: string;
  created_at: string;
  paid_out: boolean;
}

interface Client {
  id: string;
  business_name: string;
  plan_type: string;
  subscription_status: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function AgencyAnalyticsPage() {
  const { agency, branding, loading: contextLoading } = useAgency();
  const [stats, setStats] = useState<Stats>({
    mrr: 0,
    totalEarned: 0,
    pendingPayout: 0,
    activeClients: 0,
    trialClients: 0,
    totalClients: 0,
  });
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; amount: number }[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';

  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';

  useEffect(() => {
    if (agency) {
      fetchRevenueData();
    }
  }, [agency]);

  const fetchRevenueData = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setRevenueByMonth(data.revenueByMonth || []);
        setPayments(data.payments || []);
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanPrice = (planType: string) => {
    if (!agency) return 0;
    switch (planType) {
      case 'starter': return agency.price_starter || 4900;
      case 'pro': return agency.price_pro || 9900;
      case 'growth': return agency.price_growth || 14900;
      default: return 0;
    }
  };

  const maxRevenue = Math.max(...revenueByMonth.map(r => r.amount), 1);

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Analytics & Revenue</h1>
        <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>Track your earnings and client metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        {/* MRR */}
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div 
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: primaryColor }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Monthly Recurring</p>
              <p className="text-lg sm:text-2xl font-semibold truncate">{formatCurrency(stats.mrr)}</p>
            </div>
          </div>
        </div>

        {/* Total Earned */}
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div 
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
            >
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: isDark ? '#60a5fa' : '#2563eb' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Total Earned</p>
              <p className="text-lg sm:text-2xl font-semibold truncate">{formatCurrency(stats.totalEarned)}</p>
            </div>
          </div>
        </div>

        {/* Pending Payout */}
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div 
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}
            >
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Pending Payout</p>
              <p className="text-lg sm:text-2xl font-semibold truncate">{formatCurrency(stats.pendingPayout)}</p>
            </div>
          </div>
        </div>

        {/* Active Clients */}
        <div 
          className="rounded-xl p-3 sm:p-5"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <div 
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(168,85,247,0.1)' }}
            >
              <Users className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: isDark ? '#a78bfa' : '#7c3aed' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Paying Clients</p>
              <p className="text-lg sm:text-2xl font-semibold">{stats.activeClients}</p>
              {stats.trialClients > 0 && (
                <p className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>+{stats.trialClients} in trial</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div 
          className="lg:col-span-2 rounded-xl p-4 sm:p-6"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <h3 className="font-medium mb-4 sm:mb-6 text-sm sm:text-base">Revenue Over Time</h3>
          
          {revenueByMonth.length === 0 ? (
            <div className="h-32 sm:h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: mutedTextColor }}>No revenue data yet</p>
            </div>
          ) : (
            <div className="h-32 sm:h-48">
              <div className="flex items-end justify-between h-full gap-1 sm:gap-2">
                {revenueByMonth.map((item, index) => {
                  const height = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-24 sm:h-36">
                        <div 
                          className="w-full max-w-[32px] sm:max-w-[40px] rounded-t-lg transition-all duration-300"
                          style={{ 
                            height: `${Math.max(height, 2)}%`,
                            backgroundColor: primaryColor,
                            opacity: 0.6 + (index / revenueByMonth.length) * 0.4,
                          }}
                          title={formatCurrency(item.amount)}
                        />
                      </div>
                      <span className="text-[8px] sm:text-xs" style={{ color: mutedTextColor }}>
                        {formatMonth(item.month)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Revenue by Plan */}
        <div 
          className="rounded-xl p-4 sm:p-6"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Revenue by Plan</h3>
          
          <div className="space-y-3 sm:space-y-4">
            {['starter', 'pro', 'growth'].map((plan) => {
              const planClients = clients.filter(
                c => c.plan_type === plan && c.subscription_status === 'active'
              );
              const planRevenue = planClients.length * getPlanPrice(plan);
              const percentage = stats.mrr > 0 ? (planRevenue / stats.mrr) * 100 : 0;
              
              const planColor = plan === 'starter' 
                ? (isDark ? '#60a5fa' : '#2563eb')
                : plan === 'pro' 
                ? primaryColor
                : (isDark ? '#a78bfa' : '#7c3aed');
              
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs sm:text-sm capitalize">{plan}</span>
                    <span className="text-xs sm:text-sm font-medium">{formatCurrency(planRevenue)}</span>
                  </div>
                  <div 
                    className="h-1.5 sm:h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: planColor,
                      }}
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: mutedTextColor }}>
                    {planClients.length} client{planClients.length !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div 
        className="mt-4 sm:mt-6 rounded-xl overflow-hidden"
        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      >
        <div 
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <h3 className="font-medium text-sm sm:text-base">Recent Transactions</h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div 
              className="mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: `${primaryColor}80` }} />
            </div>
            <p className="text-sm" style={{ color: isDark ? 'rgba(250,250,249,0.6)' : '#6b7280' }}>No transactions yet</p>
            <p className="text-xs sm:text-sm mt-1" style={{ color: mutedTextColor }}>
              Transactions will appear here when clients pay
            </p>
          </div>
        ) : (
          <div>
            {/* Table Header - Desktop */}
            <div 
              className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide"
              style={{ color: mutedTextColor, borderBottom: `1px solid ${borderColor}` }}
            >
              <div className="col-span-4">Client</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2 text-right">Date</div>
            </div>

            {/* Table Rows */}
            <div>
              {payments.slice(0, 10).map((payment, idx) => {
                const client = clients.find(c => c.id === payment.client_id);
                const statusColor = payment.status === 'succeeded'
                  ? { bg: `${primaryColor}15`, text: primaryColor }
                  : payment.status === 'pending'
                  ? { bg: 'rgba(245,158,11,0.1)', text: isDark ? '#fbbf24' : '#d97706' }
                  : { bg: 'rgba(239,68,68,0.1)', text: isDark ? '#f87171' : '#dc2626' };
                
                return (
                  <div
                    key={payment.id}
                    className="px-4 sm:px-6 py-3 sm:py-4"
                    style={{ borderBottom: idx < Math.min(payments.length, 10) - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'}` : 'none' }}
                  >
                    {/* Mobile layout */}
                    <div className="lg:hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            {client?.business_name?.charAt(0) || '?'}
                          </div>
                          <span className="truncate text-sm">{client?.business_name || 'Unknown'}</span>
                        </div>
                        <span className="font-medium text-sm">{formatCurrency(payment.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm pl-10 sm:pl-11">
                        <span 
                          className="rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium capitalize"
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                        >
                          {payment.status}
                        </span>
                        <span style={{ color: mutedTextColor }}>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                        >
                          {client?.business_name?.charAt(0) || '?'}
                        </div>
                        <span className="truncate">{client?.business_name || 'Unknown'}</span>
                      </div>
                      
                      <div className="col-span-2 font-medium">
                        {formatCurrency(payment.amount)}
                      </div>
                      
                      <div className="col-span-2">
                        <span 
                          className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                        >
                          {payment.status}
                        </span>
                      </div>
                      
                      <div className="col-span-2 capitalize" style={{ color: mutedTextColor }}>
                        {payment.type || 'subscription'}
                      </div>
                      
                      <div className="col-span-2 text-right" style={{ color: mutedTextColor }}>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stripe Connect Status */}
      {agency && !agency.stripe_account_id && (
        <div 
          className="mt-4 sm:mt-6 rounded-xl p-4 sm:p-6"
          style={{ 
            backgroundColor: isDark ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}
              >
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base" style={{ color: isDark ? '#fde68a' : '#92400e' }}>Connect Stripe to receive payouts</p>
                <p className="text-xs sm:text-sm" style={{ color: isDark ? 'rgba(253,230,138,0.6)' : '#b45309' }}>
                  Set up Stripe Connect to receive payments from your clients
                </p>
              </div>
            </div>
            <Link
              href="/agency/settings"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors w-full sm:w-auto"
              style={{ backgroundColor: isDark ? '#fbbf24' : '#f59e0b', color: '#050505' }}
            >
              Set Up Payments
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}