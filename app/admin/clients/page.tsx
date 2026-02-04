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
    if (!phone) return '-';
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
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'trial_expired':
      case 'past_due':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'canceled':
      case 'suspended':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Clients</h1>
        <p className="mt-1 text-white/50">All clients across all agencies</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <input
              type="text"
              placeholder="Search clients..."
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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg bg-gray-900 border border-white/10 pl-10 pr-10 py-2.5 text-white focus:outline-none focus:border-blue-500"
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
      <div className="rounded-xl bg-gray-900 border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-white/20 mb-3" />
            <p className="text-white/50">No clients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Client</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Agency</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">AI Phone</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Calls</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Created</th>
                  <th className="text-right text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                          <Users className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{client.business_name}</p>
                          <p className="text-sm text-white/50">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/admin/agencies/${client.agency_id}`}
                        className="flex items-center gap-2 text-white/70 hover:text-white"
                      >
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">{client.agencies?.name || 'Unknown'}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(client.subscription_status)}`}>
                        {client.subscription_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {client.vapi_phone_number ? (
                        <div className="flex items-center gap-2 text-white/70">
                          <Phone className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm">{formatPhone(client.vapi_phone_number)}</span>
                        </div>
                      ) : (
                        <span className="text-white/40 text-sm">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white/70">
                        <PhoneCall className="h-4 w-4" />
                        <span className="text-sm">
                          {client.calls_this_month || 0} / {client.monthly_call_limit || 50}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActionMenu(actionMenu === client.id ? null : client.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-white/50" />
                        </button>
                        
                        {actionMenu === client.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActionMenu(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-800 border border-white/10 shadow-xl z-20">
                              <Link
                                href={`/admin/clients/${client.id}`}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5"
                              >
                                <ChevronRight className="h-4 w-4" />
                                View Details
                              </Link>
                              <div className="border-t border-white/10 my-1" />
                              {client.status !== 'suspended' ? (
                                <button
                                  onClick={() => handleStatusUpdate(client.id, 'suspended', 'canceled')}
                                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 w-full text-left"
                                >
                                  <Ban className="h-4 w-4" />
                                  Suspend Client
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusUpdate(client.id, 'active', 'active')}
                                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-400 hover:bg-white/5 w-full text-left"
                                >
                                  <UserCheck className="h-4 w-4" />
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
        <p className="mt-4 text-sm text-white/40">
          Showing {clients.length} clients
        </p>
      )}
    </div>
  );
}