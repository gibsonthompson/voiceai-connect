'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Filter, Phone, Building2,
  Loader2, ChevronRight, MoreVertical, UserCheck, Ban, PhoneCall
} from 'lucide-react';

interface Client {
  id: string;
  business_name: string;
  email: string;
  owner_name: string;
  owner_phone: string;
  vapi_phone_number: string | null;
  industry: string;
  plan_type: string;
  subscription_status: string;
  status: string;
  calls_this_month: number;
  monthly_call_limit: number;
  trial_ends_at: string | null;
  created_at: string;
  agency_id: string;
  agencies: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function AdminClientsPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, [statusFilter]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      
      let url = `${backendUrl}/api/admin/clients?limit=100`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load clients');

      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Clients error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchClients();
  };

  const handleStatusUpdate = async (clientId: string, newStatus: string, newSubStatus: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

      await fetch(`${backendUrl}/api/admin/clients/${clientId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, subscription_status: newSubStatus }),
      });

      // Refresh list
      fetchClients();
      setActionMenu(null);
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'trial':
      case 'trialing':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'trial_expired':
      case 'past_due':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'canceled':
      case 'suspended':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/[0.04] text-white/40 border-white/[0.06]';
    }
  };

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-white tracking-tight">Clients</h1>
        <p className="mt-1 text-sm text-white/30">All clients across all agencies</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/30 transition-colors"
            />
          </div>
        </form>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl bg-white/[0.03] border border-white/[0.06] pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/30"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="trial_expired">Trial Expired</option>
            <option value="past_due">Past Due</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
          </div>
        ) : clients.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 blur-2xl bg-emerald-500/10 rounded-full" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <Users className="h-7 w-7 text-white/15" />
              </div>
            </div>
            <p className="text-sm text-white/40">No clients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] font-medium text-white/25 uppercase tracking-[0.1em] px-5 py-3.5">Client</th>
                  <th className="text-left text-[10px] font-medium text-white/25 uppercase tracking-[0.1em] px-5 py-3.5">Agency</th>
                  <th className="text-left text-[10px] font-medium text-white/25 uppercase tracking-[0.1em] px-5 py-3.5">Status</th>
                  <th className="text-left text-[10px] font-medium text-white/25 uppercase tracking-[0.1em] px-5 py-3.5">AI Phone</th>
                  <th className="text-left text-[10px] font-medium text-white/25 uppercase tracking-[0.1em] px-5 py-3.5">Calls</th>
                  <th className="text-left text-[10px] font-medium text-white/25 uppercase tracking-[0.1em] px-5 py-3.5">Created</th>
                  <th className="text-right text-[10px] font-medium text-white/25 uppercase tracking-[0.1em] px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/[0.08] shrink-0">
                          <Users className="h-4 w-4 text-emerald-400/70" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-white/80">{client.business_name}</p>
                          <p className="text-[11px] text-white/25">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link 
                        href={`/admin/agencies?expand=${client.agency_id}`}
                        className="flex items-center gap-1.5 text-white/40 hover:text-white/60 transition-colors"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="text-xs">{client.agencies?.name || 'Unknown'}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${getStatusColor(client.subscription_status)}`}>
                        {client.subscription_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {client.vapi_phone_number ? (
                        <div className="flex items-center gap-1.5 text-white/50">
                          <Phone className="h-3.5 w-3.5 text-emerald-400/60" />
                          <span className="text-xs tabular-nums">{formatPhone(client.vapi_phone_number)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-white/20">Not assigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span className="text-xs tabular-nums">
                          {client.calls_this_month || 0} / {client.monthly_call_limit || 50}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/30">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActionMenu(actionMenu === client.id ? null : client.id)}
                          className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-white/25" />
                        </button>
                        
                        {actionMenu === client.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActionMenu(null)}
                            />
                            <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#111] border border-white/[0.08] shadow-2xl z-20 overflow-hidden">
                              <Link
                                href={`/admin/clients/${client.id}`}
                                className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/70 hover:bg-white/[0.04]"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                                View Details
                              </Link>
                              <div className="mx-2 border-t border-white/[0.04]" />
                              {client.status !== 'suspended' ? (
                                <button
                                  onClick={() => handleStatusUpdate(client.id, 'suspended', 'canceled')}
                                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-400/80 hover:bg-red-500/[0.06] w-full text-left"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  Suspend Client
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusUpdate(client.id, 'active', 'active')}
                                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-emerald-400/80 hover:bg-emerald-500/[0.06] w-full text-left"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Activate Client
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && clients.length > 0 && (
        <p className="mt-4 text-xs text-white/20">
          Showing {clients.length} clients
        </p>
      )}
    </div>
  );
}