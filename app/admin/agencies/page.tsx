'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Search, Filter, Users, ExternalLink,
  Loader2, ChevronRight, MoreVertical, UserCheck, Ban
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
  client_count: number;
  created_at: string;
  trial_ends_at: string | null;
}

export default function AdminAgenciesPage() {
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);

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

      // Refresh list
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      starter: 'bg-gray-500/10 text-gray-400',
      professional: 'bg-blue-500/10 text-blue-400',
      enterprise: 'bg-purple-500/10 text-purple-400',
    };
    return colors[plan] || colors.starter;
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Agencies</h1>
        <p className="mt-1 text-white/50">Manage all platform agencies</p>
      </div>

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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg bg-gray-900 border border-white/10 pl-10 pr-10 py-2.5 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trial</option>
            <option value="past_due">Past Due</option>
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
        ) : agencies.length === 0 ? (
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
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Plan</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Clients</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Stripe</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Created</th>
                  <th className="text-right text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {agencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                          <Building2 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{agency.name}</p>
                          <p className="text-sm text-white/50">{agency.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPlanBadge(agency.plan_type)}`}>
                        {agency.plan_type || 'starter'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(agency.subscription_status)}`}>
                        {agency.subscription_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white/70">
                        <Users className="h-4 w-4" />
                        <span>{agency.client_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {agency.stripe_charges_enabled ? (
                        <span className="text-emerald-400 text-sm">Connected</span>
                      ) : (
                        <span className="text-white/40 text-sm">Not connected</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {formatDate(agency.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && agencies.length > 0 && (
        <p className="mt-4 text-sm text-white/40">
          Showing {agencies.length} agencies
        </p>
      )}
    </div>
  );
}