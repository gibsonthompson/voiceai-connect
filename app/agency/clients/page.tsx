'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, PhoneCall, Search, Plus, ChevronRight, Loader2, ArrowUpRight
} from 'lucide-react';
import { useAgency } from '../context';

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
  const { agency, loading: contextLoading } = useAgency();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    if (agency) {
      fetchClients();
    }
  }, [agency]);

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
        return 'bg-emerald-500/10 text-emerald-400';
      case 'trial':
        return 'bg-amber-500/10 text-amber-400';
      case 'past_due':
        return 'bg-orange-500/10 text-orange-400';
      case 'suspended':
      case 'cancelled':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-white/[0.06] text-[#fafaf9]/50';
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-[#fafaf9]/50">{clients.length} total clients</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none transition-colors"
            />
          </div>
          
          {/* Filter */}
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-[#fafaf9]/70 focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="past_due">Past Due</option>
            <option value="suspended">Suspended</option>
          </select>
          
          {/* Add Client */}
          <Link
            href="/agency/clients/new"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Link>
        </div>
      </div>

      {/* Clients List */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <Users className="h-8 w-8 text-emerald-400/50" />
            </div>
            <p className="mt-4 font-medium text-[#fafaf9]/70">
              {searchQuery || statusFilter ? 'No clients match your search' : 'No clients yet'}
            </p>
            <p className="text-sm text-[#fafaf9]/40 mt-1">
              {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Share your signup link to get started!'}
            </p>
          </div>
        ) : (
          <div>
            {/* Table Header - Desktop */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium uppercase tracking-wide text-[#fafaf9]/40 border-b border-white/[0.06]">
              <div className="col-span-4">Business</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-2">Calls</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Added</div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y divide-white/[0.04]">
              {filteredClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/agency/clients/${client.id}`}
                  className="block lg:grid lg:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Mobile Layout */}
                  <div className="lg:hidden flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <span className="text-sm font-medium text-emerald-400">
                          {client.business_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{client.business_name}</p>
                        <p className="text-sm text-[#fafaf9]/50">{client.email}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#fafaf9]/30" />
                  </div>
                  <div className="lg:hidden flex items-center justify-between text-sm">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(client.subscription_status || client.status)}`}>
                      {client.subscription_status || client.status}
                    </span>
                    <span className="text-[#fafaf9]/40">{client.calls_this_month || 0} calls</span>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:flex col-span-4 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <span className="text-sm font-medium text-emerald-400">
                        {client.business_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{client.business_name}</p>
                      <p className="text-sm text-[#fafaf9]/50">{client.email}</p>
                    </div>
                  </div>
                  
                  <div className="hidden lg:block col-span-2">
                    <p className="text-sm capitalize">{client.plan_type || 'starter'}</p>
                    <p className="text-xs text-[#fafaf9]/40">
                      ${(getPlanPrice(client.plan_type) / 100).toFixed(0)}/mo
                    </p>
                  </div>
                  
                  <div className="hidden lg:flex col-span-2 items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-[#fafaf9]/30" />
                    <span className="text-sm">{client.calls_this_month || 0}</span>
                    <span className="text-xs text-[#fafaf9]/40">this month</span>
                  </div>
                  
                  <div className="hidden lg:block col-span-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(client.subscription_status || client.status)}`}>
                      {client.subscription_status || client.status}
                    </span>
                  </div>
                  
                  <div className="hidden lg:flex col-span-2 items-center justify-end gap-2">
                    <span className="text-sm text-[#fafaf9]/50">
                      {new Date(client.created_at).toLocaleDateString()}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#fafaf9]/20" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}