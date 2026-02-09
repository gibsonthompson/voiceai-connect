'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, PhoneCall, Search, Plus, ChevronRight, Loader2, ArrowUpRight
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';
import { DEMO_CLIENTS } from '../demoData';

interface Client {
  id: string;
  business_name: string;
  email: string;
  owner_name: string;
  owner_phone: string;
  plan_type: string;
  subscription_status: string;
  status: string;
  calls_this_month: number;
  created_at: string;
  vapi_phone_number: string;
}

export default function AgencyClientsPage() {
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!agency) return;

    if (demoMode) {
      setClients(DEMO_CLIENTS as Client[]);
      setLoading(false);
      return;
    }

    fetchClients();
  }, [agency, demoMode]);

  const fetchClients = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanPrice = (planType: string) => {
    if (!agency) return 0;
    switch (planType) {
      case 'starter':
        return agency.price_starter || 4900;
      case 'pro':
        return agency.price_pro || 9900;
      case 'growth':
        return agency.price_growth || 14900;
      default:
        return 0;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: theme.primary15, text: theme.primary, border: theme.primary30 };
      case 'trial':
        return { bg: theme.warningBg, text: theme.warningText, border: theme.warningBorder };
      case 'past_due':
        return { bg: theme.warningBg, text: theme.warningText, border: theme.warningBorder };
      case 'suspended':
      case 'cancelled':
        return { bg: theme.errorBg, text: theme.errorText, border: theme.errorBorder };
      default:
        return { bg: theme.hover, text: theme.textMuted, border: theme.border };
    }
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || 
      client.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || 
      client.subscription_status === statusFilter || 
      client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Clients</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>{clients.length} total clients</p>
          </div>
          
          <Link
            href="/agency/clients/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors w-full sm:w-auto"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Link>
        </div>
        
        {/* Search & Filter Row */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none"
              style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
            />
          </div>
          
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none w-full sm:w-auto"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="past_due">Past Due</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Clients List */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
      >
        {filteredClients.length === 0 ? (
          <div className="py-16 sm:py-20 text-center px-4">
            <div 
              className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.primary15 }}
            >
              <Users className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: theme.primary80 }} />
            </div>
            <p className="mt-4 font-medium" style={{ color: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>
              {searchQuery || statusFilter ? 'No clients match your search' : 'No clients yet'}
            </p>
            <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
              {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Share your signup link to get started!'}
            </p>
          </div>
        ) : (
          <div>
            {/* Table Header - Desktop Only */}
            <div 
              className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium uppercase tracking-wide"
              style={{ color: theme.textMuted, borderBottom: `1px solid ${theme.border}` }}
            >
              <div className="col-span-4">Business</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-2">Calls</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Added</div>
            </div>
            
            {/* Client Rows */}
            <div>
              {filteredClients.map((client, idx) => {
                const statusStyle = getStatusStyle(client.subscription_status || client.status);
                return (
                  <Link
                    key={client.id}
                    href={`/agency/clients/${client.id}`}
                    className="block px-4 sm:px-6 py-4 transition-colors"
                    style={{ 
                      borderBottom: idx < filteredClients.length - 1 ? `1px solid ${theme.borderSubtle}` : 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                            style={{ backgroundColor: theme.primary15 }}
                          >
                            <span className="text-sm font-medium" style={{ color: theme.primary }}>
                              {client.business_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{client.business_name}</p>
                            <p className="text-sm truncate" style={{ color: theme.textMuted }}>{client.email}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
                      </div>
                      <div className="flex items-center justify-between text-sm pl-[52px]">
                        <span 
                          className="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {client.subscription_status || client.status}
                        </span>
                        <div className="flex items-center gap-3" style={{ color: theme.textMuted }}>
                          <span className="capitalize">{client.plan_type || 'starter'}</span>
                          <span>•</span>
                          <span>{client.calls_this_month || 0} calls</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: theme.primary15 }}
                        >
                          <span className="text-sm font-medium" style={{ color: theme.primary }}>
                            {client.business_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{client.business_name}</p>
                          <p className="text-sm truncate" style={{ color: theme.textMuted }}>{client.email}</p>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <p className="text-sm capitalize">{client.plan_type || 'starter'}</p>
                        <p className="text-xs" style={{ color: theme.textMuted }}>
                          ${(getPlanPrice(client.plan_type) / 100).toFixed(0)}/mo
                        </p>
                      </div>
                      
                      <div className="col-span-2 flex items-center gap-2">
                        <PhoneCall className="h-4 w-4" style={{ color: theme.textMuted }} />
                        <span className="text-sm">{client.calls_this_month || 0}</span>
                        <span className="text-xs" style={{ color: theme.textMuted }}>this month</span>
                      </div>
                      
                      <div className="col-span-2">
                        <span 
                          className="inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {client.subscription_status || client.status}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="text-sm" style={{ color: theme.textMuted }}>
                          {new Date(client.created_at).toLocaleDateString()}
                        </span>
                        <ChevronRight className="h-4 w-4" style={{ color: theme.textMuted }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}