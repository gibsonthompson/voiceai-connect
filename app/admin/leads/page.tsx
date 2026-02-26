'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Filter, Loader2, ChevronRight, 
  Target, DollarSign, Building2, Plus, Trash2,
  FileSpreadsheet, BarChart3, ArrowRight
} from 'lucide-react';
import CSVImportModal from '@/components/CSVImportModal';

interface Lead {
  id: string;
  agency_id: string;
  agency_name?: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  industry: string;
  source: string;
  status: string;
  estimated_value: number;
  next_follow_up: string | null;
  created_at: string;
  outreach_count?: number;
}

interface Agency {
  id: string;
  name: string;
}

interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  totalValue: number;
}

export default function AdminLeadsPage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [selectedAgencyForImport, setSelectedAgencyForImport] = useState('');
  const [showAgencyPicker, setShowAgencyPicker] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
    fetchAgencies();
    fetchStats();
  }, [statusFilter, agencyFilter]);

  const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const getToken = () => localStorage.getItem('admin_token');

  const fetchLeads = async () => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();

      let url = `${backendUrl}/api/admin/leads?limit=200`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (agencyFilter) url += `&agencyId=${agencyFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load leads');

      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Leads error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/api/admin/agencies?limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAgencies((data.agencies || []).map((a: any) => ({ id: a.id, name: a.name })));
      }
    } catch (error) {
      console.error('Failed to fetch agencies:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/api/admin/leads-stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchLeads();
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;

    setDeletingId(leadId);
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/api/admin/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        fetchStats();
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleImportClick = () => {
    if (agencies.length === 0) return;
    if (agencyFilter) {
      // If already filtering by agency, import into that one
      setSelectedAgencyForImport(agencyFilter);
      setShowCSVImport(true);
    } else {
      // Show agency picker
      setShowAgencyPicker(true);
    }
  };

  const handleAgencyPickForImport = (agencyId: string) => {
    setSelectedAgencyForImport(agencyId);
    setShowAgencyPicker(false);
    setShowCSVImport(true);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
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
      case 'new':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'contacted':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'qualified':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'proposal':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'won':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'lost':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'New', contacted: 'Contacted', qualified: 'Qualified',
      proposal: 'Proposal', won: 'Won', lost: 'Lost',
    };
    return labels[status] || status;
  };

  const getAgencyName = (agencyId: string) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency?.name || 'Unknown';
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Leads</h1>
          <p className="mt-1 text-white/50">Manage leads across all agencies</p>
        </div>
        <button
          onClick={handleImportClick}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Import CSV
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4 lg:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/50">Total Leads</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stats.total}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4 lg:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/50">Pipeline Value</p>
                <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(stats.totalValue || 0)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4 lg:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/50">Active</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {stats.total - (stats.byStatus?.won || 0) - (stats.byStatus?.lost || 0)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4 lg:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/50">Won</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stats.byStatus?.won || 0}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-gray-900 border border-white/10 pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
            />
          </div>
        </form>
        <div className="flex gap-3">
          <select
            value={agencyFilter}
            onChange={(e) => { setAgencyFilter(e.target.value); setLoading(true); }}
            className="appearance-none rounded-lg bg-gray-900 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 max-w-[200px]"
          >
            <option value="">All Agencies</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }}
            className="appearance-none rounded-lg bg-gray-900 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-gray-900 border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-white/20 mb-3" />
            <p className="text-white/50">No leads found</p>
            {(search || statusFilter || agencyFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setAgencyFilter(''); setLoading(true); fetchLeads(); }}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Lead</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Agency</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Value</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Outreach</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Created</th>
                  <th className="text-right text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                          <span className="text-sm font-medium text-blue-400">
                            {lead.business_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{lead.business_name || 'Unnamed'}</p>
                          <p className="text-sm text-white/50">{lead.contact_name || lead.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white/70">
                        <Building2 className="h-4 w-4 text-white/40" />
                        <span className="text-sm">{lead.agency_name || getAgencyName(lead.agency_id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {lead.outreach_count != null ? `${lead.outreach_count} sent` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(lead.id)}
                        disabled={deletingId === lead.id}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-white/40 hover:text-red-400 disabled:opacity-50"
                        title="Delete lead"
                      >
                        {deletingId === lead.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && leads.length > 0 && (
        <p className="mt-4 text-sm text-white/40">
          Showing {leads.length} leads
          {agencyFilter && ` for ${getAgencyName(agencyFilter)}`}
        </p>
      )}

      {/* Agency Picker Modal for Import */}
      {showAgencyPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAgencyPicker(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-gray-900 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Select Agency for Import</h2>
              <p className="text-sm text-white/50 mt-1">Choose which agency to import leads into</p>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-1">
              {agencies.map((agency) => (
                <button
                  key={agency.id}
                  onClick={() => handleAgencyPickForImport(agency.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                    <Building2 className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="font-medium">{agency.name}</span>
                  <ArrowRight className="h-4 w-4 text-white/30 ml-auto" />
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setShowAgencyPicker(false)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {selectedAgencyForImport && (
        <CSVImportModal
          isOpen={showCSVImport}
          onClose={() => { setShowCSVImport(false); setSelectedAgencyForImport(''); }}
          agencyId={selectedAgencyForImport}
          onImportComplete={() => { fetchLeads(); fetchStats(); }}
          apiBase="/api/admin"
        />
      )}
    </div>
  );
}