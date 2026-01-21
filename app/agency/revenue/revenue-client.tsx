'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Phone, Users, DollarSign, Settings, LogOut, TrendingUp,
  Sun, Moon, ArrowUpRight, ArrowDownRight, CreditCard,
  Calendar, ChevronRight, Building, Wallet
} from 'lucide-react';

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  name: string;
}

interface Stats {
  mrr: number;
  totalEarned: number;
  pendingPayout: number;
  activeClients: number;
  trialClients: number;
  totalClients: number;
}

interface RevenuePageClientProps {
  branding: Branding;
  agency: any;
  stats: Stats;
  revenueByMonth: { month: string; amount: number }[];
  payments: any[];
  clients: any[];
}

// Helper functions
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function RevenuePageClient({
  branding,
  agency,
  stats,
  revenueByMonth,
  payments,
  clients,
}: RevenuePageClientProps) {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard-theme');
    if (saved) {
      setDarkMode(saved === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('dashboard-theme', newMode ? 'dark' : 'light');
  };

  // Theme colors
  const theme = {
    bg: darkMode ? '#0a0a0a' : '#f8f8f6',
    text: darkMode ? '#f5f5f0' : '#1a1a1a',
    textMuted: darkMode ? 'rgba(245, 245, 240, 0.5)' : 'rgba(26, 26, 26, 0.5)',
    textMuted4: darkMode ? 'rgba(245, 245, 240, 0.4)' : 'rgba(26, 26, 26, 0.4)',
    textMuted6: darkMode ? 'rgba(245, 245, 240, 0.6)' : 'rgba(26, 26, 26, 0.6)',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    cardBg: darkMode ? '#111' : 'rgba(255, 255, 255, 0.8)',
    inputBg: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  };

  const primaryLight = isLightColor(branding.primaryColor);
  const sidebarBg = darkenColor(branding.primaryColor, 65);
  const primaryBg = hexToRgba(branding.primaryColor, 0.1);
  const accentBg = hexToRgba(branding.accentColor, 0.1);

  const navItems = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: TrendingUp, active: false },
    { href: '/agency/clients', label: 'Clients', icon: Users, active: false },
    { href: '/agency/revenue', label: 'Revenue', icon: DollarSign, active: true },
    { href: '/agency/settings', label: 'Settings', icon: Settings, active: false },
  ];

  // Calculate max for chart scaling
  const maxRevenue = Math.max(...revenueByMonth.map(r => r.amount), 1);

  // Get plan price helper
  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case 'starter': return agency.price_starter || 4900;
      case 'pro': return agency.price_pro || 9900;
      case 'growth': return agency.price_growth || 14900;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full border transition-all hover:scale-105"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Sidebar */}
      <aside 
        className="fixed inset-y-0 left-0 z-40 w-64 border-r transition-colors duration-200"
        style={{ backgroundColor: sidebarBg, borderColor: hexToRgba(branding.primaryColor, 0.2) }}
      >
        <div 
          className="flex h-16 items-center gap-3 border-b px-6"
          style={{ borderColor: hexToRgba(branding.primaryColor, 0.2) }}
        >
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Phone className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
            </div>
          )}
          <span className="font-medium text-[#f5f5f0] truncate">{branding.name}</span>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: item.active ? hexToRgba(branding.primaryColor, 0.3) : 'transparent',
                color: item.active ? '#f5f5f0' : 'rgba(245, 245, 240, 0.6)',
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div 
          className="absolute bottom-0 left-0 right-0 border-t p-4"
          style={{ borderColor: hexToRgba(branding.primaryColor, 0.2) }}
        >
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors"
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
            <h1 className="text-2xl font-medium tracking-tight">Revenue</h1>
            <p className="mt-1" style={{ color: theme.textMuted }}>Track your earnings and payouts.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            {/* MRR */}
            <div 
              className="rounded-2xl border p-6"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)' }}
                >
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: theme.textMuted }}>Monthly Recurring</p>
                  <p className="text-2xl font-semibold">{formatCurrency(stats.mrr)}</p>
                </div>
              </div>
            </div>

            {/* Total Earned */}
            <div 
              className="rounded-2xl border p-6"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: primaryBg }}
                >
                  <DollarSign className="h-6 w-6" style={{ color: branding.primaryColor }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: theme.textMuted }}>Total Earned</p>
                  <p className="text-2xl font-semibold">{formatCurrency(stats.totalEarned)}</p>
                </div>
              </div>
            </div>

            {/* Pending Payout */}
            <div 
              className="rounded-2xl border p-6"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: accentBg }}
                >
                  <Wallet className="h-6 w-6" style={{ color: branding.accentColor }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: theme.textMuted }}>Pending Payout</p>
                  <p className="text-2xl font-semibold">{formatCurrency(stats.pendingPayout)}</p>
                </div>
              </div>
            </div>

            {/* Active Clients */}
            <div 
              className="rounded-2xl border p-6"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                >
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: theme.textMuted }}>Paying Clients</p>
                  <p className="text-2xl font-semibold">{stats.activeClients}</p>
                  {stats.trialClients > 0 && (
                    <p className="text-xs" style={{ color: theme.textMuted4 }}>
                      +{stats.trialClients} in trial
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Revenue Chart */}
            <div 
              className="lg:col-span-2 rounded-2xl border p-6"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <h3 className="font-medium mb-6">Revenue Over Time</h3>
              
              {revenueByMonth.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p style={{ color: theme.textMuted }}>No revenue data yet</p>
                </div>
              ) : (
                <div className="h-48">
                  <div className="flex items-end justify-between h-full gap-2">
                    {revenueByMonth.map((item, index) => {
                      const height = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;
                      return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full flex flex-col items-center justify-end h-36">
                            <div 
                              className="w-full max-w-[40px] rounded-t-lg transition-all duration-300"
                              style={{ 
                                height: `${Math.max(height, 2)}%`,
                                backgroundColor: branding.primaryColor,
                                opacity: 0.8 + (index / revenueByMonth.length) * 0.2,
                              }}
                              title={formatCurrency(item.amount)}
                            />
                          </div>
                          <span className="text-xs" style={{ color: theme.textMuted4 }}>
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
              className="rounded-2xl border p-6"
              style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
            >
              <h3 className="font-medium mb-4">Revenue by Plan</h3>
              
              <div className="space-y-4">
                {['starter', 'pro', 'growth'].map((plan) => {
                  const planClients = clients.filter(
                    c => c.plan_type === plan && c.subscription_status === 'active'
                  );
                  const planRevenue = planClients.length * getPlanPrice(plan);
                  const percentage = stats.mrr > 0 ? (planRevenue / stats.mrr) * 100 : 0;
                  
                  return (
                    <div key={plan}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm capitalize">{plan}</span>
                        <span className="text-sm font-medium">{formatCurrency(planRevenue)}</span>
                      </div>
                      <div 
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: theme.inputBg }}
                      >
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: plan === 'starter' 
                              ? branding.accentColor 
                              : plan === 'pro' 
                              ? branding.primaryColor 
                              : branding.secondaryColor,
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: theme.textMuted4 }}>
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
            className="mt-6 rounded-2xl border"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div 
              className="flex items-center justify-between border-b p-6"
              style={{ borderColor: theme.border }}
            >
              <h3 className="font-medium">Recent Transactions</h3>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center">
                <div 
                  className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: primaryBg }}
                >
                  <CreditCard className="h-6 w-6" style={{ color: branding.primaryColor }} />
                </div>
                <p style={{ color: theme.textMuted }}>No transactions yet</p>
                <p className="text-sm mt-1" style={{ color: theme.textMuted4 }}>
                  Transactions will appear here when clients pay
                </p>
              </div>
            ) : (
              <div>
                {/* Table Header */}
                <div 
                  className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide border-b"
                  style={{ color: theme.textMuted4, borderColor: theme.border }}
                >
                  <div className="col-span-4">Client</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2 text-right">Date</div>
                </div>

                {/* Table Rows */}
                {payments.slice(0, 10).map((payment, index) => {
                  const client = clients.find(c => c.id === payment.client_id);
                  return (
                    <div
                      key={payment.id}
                      className="grid grid-cols-12 gap-4 items-center px-6 py-4"
                      style={{ borderTop: index > 0 ? `1px solid ${theme.border}` : 'none' }}
                    >
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                            style={{ backgroundColor: primaryBg, color: branding.primaryColor }}
                          >
                            {client?.business_name?.charAt(0) || '?'}
                          </div>
                          <span className="truncate">{client?.business_name || 'Unknown'}</span>
                        </div>
                      </div>
                      
                      <div className="col-span-2 font-medium">
                        {formatCurrency(payment.amount)}
                      </div>
                      
                      <div className="col-span-2">
                        <span 
                          className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                          style={
                            payment.status === 'succeeded'
                              ? { backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }
                              : payment.status === 'pending'
                              ? { backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }
                              : { backgroundColor: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }
                          }
                        >
                          {payment.status}
                        </span>
                      </div>
                      
                      <div className="col-span-2 capitalize" style={{ color: theme.textMuted6 }}>
                        {payment.type || 'subscription'}
                      </div>
                      
                      <div className="col-span-2 text-right" style={{ color: theme.textMuted }}>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stripe Connect Status */}
          {!agency.stripe_account_id && (
            <div 
              className="mt-6 rounded-2xl border p-6"
              style={{ borderColor: 'rgba(251, 191, 36, 0.3)', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-amber-400/10">
                    <CreditCard className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium">Connect Stripe to receive payouts</p>
                    <p className="text-sm" style={{ color: theme.textMuted }}>
                      Set up Stripe Connect to receive payments from your clients
                    </p>
                  </div>
                </div>
                <Link
                  href="/agency/settings"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{ backgroundColor: branding.primaryColor, color: primaryLight ? '#0a0a0a' : '#f5f5f0' }}
                >
                  Set Up Payments
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
