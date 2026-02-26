'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Search, Filter, Users, ExternalLink,
  Loader2, ChevronRight, ChevronDown, MoreVertical, UserCheck, Ban,
  Phone, DollarSign, Target, PhoneCall, Globe, Clock, CreditCard,
  Mail, Shield, TrendingUp, BarChart3, Calendar, Zap,
  Copy, Check
} from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  email: string;
  slug: string;
  phone: string | null;
  plan_type: string;
  subscription_status: string;
  status: string;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_onboarding_complete: boolean;
  onboarding_completed: boolean;
  onboarding_step: number | null;
  marketing_domain: string | null;
  domain_verified: boolean;
  primary_color: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  last_login_at: string | null;
  created_at: string;
  referral_code: string | null;
  referred_by: string | null;
  referral_earnings_cents: number | null;
  demo_phone_number: string | null;
  byot_enabled: boolean;
  // Aggregate counts from enriched endpoint
  client_count: number;
  call_count: number;
  lead_count: number;
  total_revenue: number;
  payment_count: number;
  user_count: number;
}

interface Summary {
  total_agencies: number;
  active: number;
  trialing: number;
  past_due: number;
  canceled: number;
  pending: number;
  total_clients: number;
  total_calls: number;
  total_leads: number;
  total_revenue: number;
  stripe_connected: number;
}

export default function AdminAgenciesPage() {
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgencies();
  }, [statusFilter]);

  const fetchAgencies = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      
      let url = `${backendUrl}/api/admin/agencies?limit=100`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load agencies');

      const data = await response.json();
      setAgencies(data.agencies || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Agencies error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchAgencies();
  };

  const handleStatusUpdate = async (agencyId: string, newStatus: string, newSubStatus: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

      await fetch(`${backendUrl}/api/admin/agencies/${agencyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, subscription_status: newSubStatus }),
      });

      fetchAgencies();
      setActionMenu(null);
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const handleImpersonate = async (agencyId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

      const response = await fetch(`${backendUrl}/api/admin/agencies/${agencyId}/impersonate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.loginUrl) {
        window.open(data.loginUrl, '_blank');
      }
      setActionMenu(null);
    } catch (error) {
      console.error('Impersonate error:', error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(date);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
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
      case 'pending':
      case 'pending_payment':
        return 'bg-white/5 text-white/50 border-white/10';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      starter: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      professional: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      enterprise: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    return colors[plan] || colors.starter;
  };

  const filteredAgencies = agencies.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.phone?.includes(q);
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Agencies</h1>
        <p className="mt-1 text-white/50">Manage all platform agencies</p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-6 mb-6">
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <p className="text-xs text-white/40 uppercase tracking-wide">Agencies</p>
            <p className="mt-1 text-xl font-semibold text-white">{summary.total_agencies}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-emerald-400">{summary.active} active</span>
              <span className="text-white/20">·</span>
              <span className="text-blue-400">{summary.trialing} trial</span>
            </div>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <p className="text-xs text-white/40 uppercase tracking-wide">Clients</p>
            <p className="mt-1 text-xl font-semibold text-white">{summary.total_clients}</p>
            <p className="mt-1 text-xs text-white/30">across all agencies</p>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <p className="text-xs text-white/40 uppercase tracking-wide">Total Calls</p>
            <p className="mt-1 text-xl font-semibold text-white">{summary.total_calls.toLocaleString()}</p>
            <p className="mt-1 text-xs text-white/30">all time</p>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <p className="text-xs text-white/40 uppercase tracking-wide">Leads</p>
            <p className="mt-1 text-xl font-semibold text-white">{summary.total_leads}</p>
            <p className="mt-1 text-xs text-white/30">in CRM</p>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <p className="text-xs text-white/40 uppercase tracking-wide">Revenue</p>
            <p className="mt-1 text-xl font-semibold text-emerald-400">{formatCurrency(summary.total_revenue)}</p>
            <p className="mt-1 text-xs text-white/30">collected</p>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <p className="text-xs text-white/40 uppercase tracking-wide">Stripe</p>
            <p className="mt-1 text-xl font-semibold text-white">{summary.stripe_connected}</p>
            <p className="mt-1 text-xs text-white/30">connected</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <input
              type="text"
              placeholder="Search agencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-gray-900 border border-white/10 pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
            />
          </div>
        </form>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }}
            className="appearance-none rounded-lg bg-gray-900 border border-white/10 pl-10 pr-10 py-2.5 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trial</option>
            <option value="past_due">Past Due</option>
            <option value="pending">Pending</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-gray-900 border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : filteredAgencies.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-white/20 mb-3" />
            <p className="text-white/50">No agencies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Agency</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-4 py-4">Plan</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-4 py-4">Status</th>
                  <th className="text-center text-xs font-medium text-white/50 uppercase tracking-wider px-3 py-4">Clients</th>
                  <th className="text-center text-xs font-medium text-white/50 uppercase tracking-wider px-3 py-4">Calls</th>
                  <th className="text-center text-xs font-medium text-white/50 uppercase tracking-wider px-3 py-4">Leads</th>
                  <th className="text-right text-xs font-medium text-white/50 uppercase tracking-wider px-4 py-4">Revenue</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-4 py-4">Last Login</th>
                  <th className="text-right text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAgencies.map((agency) => (
                  <>
                    <tr 
                      key={agency.id} 
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === agency.id ? null : agency.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                            {agency.primary_color ? (
                              <div 
                                className="h-5 w-5 rounded" 
                                style={{ backgroundColor: agency.primary_color }} 
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-blue-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{agency.name}</p>
                              <ChevronDown 
                                className={`h-3.5 w-3.5 text-white/30 transition-transform shrink-0 ${expandedRow === agency.id ? 'rotate-180' : ''}`} 
                              />
                            </div>
                            <p className="text-sm text-white/50 truncate">{agency.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPlanBadge(agency.plan_type)}`}>
                          {agency.plan_type || 'starter'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(agency.subscription_status || agency.status)}`}>
                          {agency.subscription_status || agency.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-sm text-white/70">{agency.client_count}</span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-sm text-white/70">{agency.call_count}</span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-sm text-white/70">{agency.lead_count}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-sm ${agency.total_revenue > 0 ? 'text-emerald-400' : 'text-white/30'}`}>
                          {agency.total_revenue > 0 ? formatCurrency(agency.total_revenue) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-white/50">
                          {agency.last_login_at ? timeAgo(agency.last_login_at) : 'Never'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenu(actionMenu === agency.id ? null : agency.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-5 w-5 text-white/50" />
                          </button>
                          
                          {actionMenu === agency.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActionMenu(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-800 border border-white/10 shadow-xl z-20">
                                <Link
                                  href={`/admin/agencies/${agency.id}`}
                                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                  View Details
                                </Link>
                                <button
                                  onClick={() => handleImpersonate(agency.id)}
                                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5 w-full text-left"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Login as Agency
                                </button>
                                {agency.marketing_domain && (
                                  <a
                                    href={`https://${agency.marketing_domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5"
                                  >
                                    <Globe className="h-4 w-4" />
                                    Visit Site
                                  </a>
                                )}
                                <div className="border-t border-white/10 my-1" />
                                {agency.status !== 'suspended' ? (
                                  <button
                                    onClick={() => handleStatusUpdate(agency.id, 'suspended', 'canceled')}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 w-full text-left"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Suspend Agency
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusUpdate(agency.id, 'active', 'active')}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-400 hover:bg-white/5 w-full text-left"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                    Activate Agency
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {expandedRow === agency.id && (
                      <tr key={`${agency.id}-detail`}>
                        <td colSpan={9} className="px-6 py-0">
                          <div className="py-4 border-t border-white/5">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              
                              {/* Contact & Identity */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wide">Contact</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-white/30" />
                                    <span className="text-white/70 truncate">{agency.email}</span>
                                  </div>
                                  {agency.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3.5 w-3.5 text-white/30" />
                                      <span className="text-white/70">{agency.phone}</span>
                                    </div>
                                  )}
                                  {agency.country && (
                                    <div className="flex items-center gap-2">
                                      <Globe className="h-3.5 w-3.5 text-white/30" />
                                      <span className="text-white/70">{agency.country} {agency.currency ? `(${agency.currency.toUpperCase()})` : ''}</span>
                                    </div>
                                  )}
                                  {agency.timezone && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-3.5 w-3.5 text-white/30" />
                                      <span className="text-white/70">{agency.timezone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Stripe & Billing */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wide">Billing</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-3.5 w-3.5 text-white/30" />
                                    <span className={agency.stripe_charges_enabled ? 'text-emerald-400' : 'text-white/40'}>
                                      {agency.stripe_charges_enabled ? 'Charges Enabled' : 'Charges Off'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-3.5 w-3.5 text-white/30" />
                                    <span className={agency.stripe_payouts_enabled ? 'text-emerald-400' : 'text-white/40'}>
                                      {agency.stripe_payouts_enabled ? 'Payouts Enabled' : 'Payouts Off'}
                                    </span>
                                  </div>
                                  {agency.stripe_account_id && (
                                    <button
                                      onClick={() => copyToClipboard(agency.stripe_account_id!, `stripe-${agency.id}`)}
                                      className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors"
                                    >
                                      {copiedId === `stripe-${agency.id}` ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                      <span className="text-xs font-mono truncate">
                                        {agency.stripe_account_id.slice(0, 20)}...
                                      </span>
                                    </button>
                                  )}
                                  {agency.current_period_end && (
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3.5 w-3.5 text-white/30" />
                                      <span className="text-white/50 text-xs">
                                        Period ends: {formatDate(agency.current_period_end)}
                                      </span>
                                    </div>
                                  )}
                                  {agency.trial_ends_at && (
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3.5 w-3.5 text-blue-400/50" />
                                      <span className="text-blue-400/70 text-xs">
                                        Trial ends: {formatDate(agency.trial_ends_at)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Platform Config */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wide">Platform</h4>
                                <div className="space-y-2 text-sm">
                                  {agency.slug && (
                                    <div className="flex items-center gap-2">
                                      <Globe className="h-3.5 w-3.5 text-white/30" />
                                      <span className="text-white/50 text-xs font-mono">/{agency.slug}</span>
                                    </div>
                                  )}
                                  {agency.marketing_domain && (
                                    <div className="flex items-center gap-2">
                                      <Globe className="h-3.5 w-3.5 text-white/30" />
                                      <a 
                                        href={`https://${agency.marketing_domain}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 text-xs hover:underline"
                                      >
                                        {agency.marketing_domain}
                                      </a>
                                      {agency.domain_verified && (
                                        <Shield className="h-3 w-3 text-emerald-400" />
                                      )}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Zap className="h-3.5 w-3.5 text-white/30" />
                                    <span className={agency.onboarding_completed ? 'text-emerald-400' : 'text-amber-400'}>
                                      {agency.onboarding_completed 
                                        ? 'Onboarding Complete' 
                                        : `Onboarding Step ${agency.onboarding_step || 0}`}
                                    </span>
                                  </div>
                                  {agency.demo_phone_number && (
                                    <div className="flex items-center gap-2">
                                      <PhoneCall className="h-3.5 w-3.5 text-white/30" />
                                      <span className="text-white/50 text-xs">Demo: {agency.demo_phone_number}</span>
                                    </div>
                                  )}
                                  {agency.byot_enabled && (
                                    <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400">
                                      BYOT Enabled
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Usage & Activity */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wide">Usage</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/40">Users</span>
                                    <span className="text-white/70">{agency.user_count}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/40">Clients</span>
                                    <span className="text-white/70">{agency.client_count}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/40">Total Calls</span>
                                    <span className="text-white/70">{agency.call_count}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/40">Leads</span>
                                    <span className="text-white/70">{agency.lead_count}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/40">Revenue</span>
                                    <span className="text-emerald-400">{formatCurrency(agency.total_revenue)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/40">Payments</span>
                                    <span className="text-white/70">{agency.payment_count}</span>
                                  </div>
                                  {agency.referral_code && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-white/40">Referral</span>
                                      <span className="text-white/50 text-xs font-mono">{agency.referral_code}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="pt-2 border-t border-white/5 text-xs text-white/30">
                                  Created: {formatDateTime(agency.created_at)}
                                  {agency.last_login_at && (
                                    <> · Last login: {timeAgo(agency.last_login_at)}</>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Agency ID - copyable */}
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3">
                              <span className="text-xs text-white/30">ID:</span>
                              <button
                                onClick={() => copyToClipboard(agency.id, `id-${agency.id}`)}
                                className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white/60 transition-colors"
                              >
                                {agency.id}
                                {copiedId === `id-${agency.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && filteredAgencies.length > 0 && (
        <p className="mt-4 text-sm text-white/40">
          Showing {filteredAgencies.length} agenc{filteredAgencies.length === 1 ? 'y' : 'ies'}
        </p>
      )}
    </div>
  );
}