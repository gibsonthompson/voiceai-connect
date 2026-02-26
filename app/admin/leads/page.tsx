'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Loader2, Target, DollarSign, Plus, Trash2,
  FileSpreadsheet, BarChart3, Mail, Phone, Globe, Building2,
  ChevronDown, X, Check, Copy, ExternalLink, MessageSquare, Send
} from 'lucide-react';
import CSVImportModal from '@/components/CSVImportModal';
import ComposerModal from '@/components/ComposerModal';

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  source: string;
  status: string;
  estimated_value: number;
  notes: string;
  next_follow_up: string | null;
  created_at: string;
}

interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  totalValue: number;
  recentlyAdded: number;
}

export default function AdminLeadsPage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'email' | 'sms'>('email');
  const [composerLead, setComposerLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [statusFilter]);

  const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const getToken = () => localStorage.getItem('admin_token');

  const fetchLeads = async () => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();

      let url = `${backendUrl}/api/admin/leads?limit=200`;
      if (statusFilter) url += `&status=${statusFilter}`;
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
        if (expandedLead === leadId) setExpandedLead(null);
        fetchStats();
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/api/admin/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        fetchStats();
      }
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const startEdit = (lead: Lead) => {
    setEditingLead(lead.id);
    setEditForm({
      business_name: lead.business_name || '',
      contact_name: lead.contact_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      website: lead.website || '',
      industry: lead.industry || '',
      source: lead.source || '',
      notes: lead.notes || '',
      estimated_value: lead.estimated_value || 0,
      next_follow_up: lead.next_follow_up ? lead.next_follow_up.split('T')[0] : '',
    });
  };

  const handleSave = async (leadId: string) => {
    setSaving(true);
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();

      const payload = {
        ...editForm,
        estimated_value: editForm.estimated_value ? Math.round(Number(editForm.estimated_value)) : null,
        next_follow_up: editForm.next_follow_up || null,
      };

      const response = await fetch(`${backendUrl}/api/admin/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
        setEditingLead(null);
        fetchStats();
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openComposer = (lead: Lead, type: 'email' | 'sms') => {
    setComposerLead(lead);
    setComposerType(type);
    setComposerOpen(true);
  };

  const handleOutreachSent = () => {
    fetchLeads();
    fetchStats();
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
      case 'new': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'contacted': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'qualified': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'proposal': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'won': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'lost': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'New', contacted: 'Contacted', qualified: 'Qualified',
      proposal: 'Proposal', won: 'Won', lost: 'Lost',
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Sales Pipeline</h1>
          <p className="mt-1 text-white/50">Prospective agencies to reach out to</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCSVImport(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 mb-6">
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40">Total Leads</p>
                <p className="mt-1 text-xl font-semibold text-white">{stats.total}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Target className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40">Pipeline Value</p>
                <p className="mt-1 text-xl font-semibold text-emerald-400">{formatCurrency(stats.totalValue || 0)}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40">Active</p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {stats.total - (stats.byStatus?.won || 0) - (stats.byStatus?.lost || 0)}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <BarChart3 className="h-4 w-4 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40">Won</p>
                <p className="mt-1 text-xl font-semibold text-emerald-400">{stats.byStatus?.won || 0}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Check className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40">This Week</p>
                <p className="mt-1 text-xl font-semibold text-white">{stats.recentlyAdded || 0}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Plus className="h-4 w-4 text-amber-400" />
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

      {/* Table */}
      <div className="rounded-xl bg-gray-900 border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-white/20 mb-3" />
            <p className="text-white/50">No leads yet</p>
            <p className="text-sm text-white/30 mt-1">Import a CSV to get started</p>
            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setLoading(true); fetchLeads(); }}
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
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4">Business</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-4 py-4">Contact</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-4 py-4">Industry</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-4 py-4">Status</th>
                  <th className="text-right text-xs font-medium text-white/50 uppercase tracking-wider px-4 py-4">Value</th>
                  <th className="text-left text-xs font-medium text-white/50 uppercase tracking-wider px-4 py-4">Added</th>
                  <th className="text-right text-xs font-medium text-white/50 uppercase tracking-wider px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.map((lead) => (
                  <>
                    <tr 
                      key={lead.id} 
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                            <span className="text-sm font-medium text-blue-400">
                              {lead.business_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{lead.business_name || 'Unnamed'}</p>
                              <ChevronDown className={`h-3.5 w-3.5 text-white/30 transition-transform shrink-0 ${expandedLead === lead.id ? 'rotate-180' : ''}`} />
                            </div>
                            {lead.email && (
                              <p className="text-sm text-white/40 truncate">{lead.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">
                        {lead.contact_name || '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-white/50 capitalize">
                        {lead.industry || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-white/70">
                        {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-white/50">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
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

                    {/* Expanded Row */}
                    {expandedLead === lead.id && (
                      <tr key={`${lead.id}-detail`}>
                        <td colSpan={7} className="px-6 py-0">
                          <div className="py-4 border-t border-white/5">
                            {editingLead === lead.id ? (
                              /* Edit Mode */
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs text-white/40 mb-1">Business Name</label>
                                    <input
                                      type="text"
                                      value={editForm.business_name || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, business_name: e.target.value }))}
                                      className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-white/40 mb-1">Contact Name</label>
                                    <input
                                      type="text"
                                      value={editForm.contact_name || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, contact_name: e.target.value }))}
                                      className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-white/40 mb-1">Email</label>
                                    <input
                                      type="email"
                                      value={editForm.email || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                      className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-white/40 mb-1">Phone</label>
                                    <input
                                      type="text"
                                      value={editForm.phone || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                      className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-white/40 mb-1">Website</label>
                                    <input
                                      type="text"
                                      value={editForm.website || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                                      className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-white/40 mb-1">Industry</label>
                                    <input
                                      type="text"
                                      value={editForm.industry || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, industry: e.target.value }))}
                                      className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-white/40 mb-1">Est. Value (cents)</label>
                                    <input
                                      type="number"
                                      value={editForm.estimated_value || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, estimated_value: parseInt(e.target.value) || 0 }))}
                                      className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-white/40 mb-1">Follow-up Date</label>
                                    <input
                                      type="date"
                                      value={editForm.next_follow_up || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, next_follow_up: e.target.value }))}
                                      className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-white/40 mb-1">Source</label>
                                    <select
                                      value={editForm.source || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, source: e.target.value }))}
                                      className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    >
                                      <option value="">Select...</option>
                                      <option value="cold_outreach">Cold Outreach</option>
                                      <option value="csv_import">CSV Import</option>
                                      <option value="referral">Referral</option>
                                      <option value="social_media">Social Media</option>
                                      <option value="website">Website</option>
                                      <option value="event">Event</option>
                                      <option value="other">Other</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-white/40 mb-1">Notes</label>
                                  <textarea
                                    value={editForm.notes || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleSave(lead.id)}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                                  >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingLead(null)}
                                    className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/10 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* View Mode */
                              <div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                  {/* Contact Info */}
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-medium text-white/40 uppercase tracking-wide">Contact</h4>
                                    {lead.email && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.email, `email-${lead.id}`); }}
                                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                                      >
                                        <Mail className="h-3.5 w-3.5" />
                                        <span className="truncate">{lead.email}</span>
                                        {copiedId === `email-${lead.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-white/20" />}
                                      </button>
                                    )}
                                    {lead.phone && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.phone, `phone-${lead.id}`); }}
                                        className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                                      >
                                        <Phone className="h-3.5 w-3.5" />
                                        <span>{lead.phone}</span>
                                        {copiedId === `phone-${lead.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-white/20" />}
                                      </button>
                                    )}
                                    {lead.website && (
                                      <a
                                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Globe className="h-3.5 w-3.5" />
                                        <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                  </div>

                                  {/* Details */}
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-medium text-white/40 uppercase tracking-wide">Details</h4>
                                    <div className="text-sm text-white/60">
                                      <p>Industry: <span className="text-white/80 capitalize">{lead.industry || '—'}</span></p>
                                      <p>Source: <span className="text-white/80 capitalize">{(lead.source || '—').replace(/_/g, ' ')}</span></p>
                                      <p>Value: <span className="text-emerald-400">{lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}</span></p>
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  <div className="space-y-2 lg:col-span-2">
                                    <h4 className="text-xs font-medium text-white/40 uppercase tracking-wide">Notes</h4>
                                    <p className="text-sm text-white/60 whitespace-pre-wrap">
                                      {lead.notes || 'No notes yet'}
                                    </p>
                                  </div>
                                </div>

                                {/* Outreach Actions */}
                                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                                  {lead.email && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openComposer(lead, 'email'); }}
                                      className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors"
                                    >
                                      <Mail className="h-3.5 w-3.5" />
                                      Send Email
                                      <Send className="h-3 w-3" />
                                    </button>
                                  )}
                                  {lead.phone && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openComposer(lead, 'sms'); }}
                                      className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      Send SMS
                                      <Send className="h-3 w-3" />
                                    </button>
                                  )}
                                  {!lead.email && !lead.phone && (
                                    <span className="text-xs text-white/30">Add email or phone to enable outreach</span>
                                  )}
                                </div>

                                {/* Quick Status + Edit */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((s) => (
                                      <button
                                        key={s}
                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(lead.id, s); }}
                                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                          lead.status === s 
                                            ? getStatusColor(s) 
                                            : 'border-white/5 text-white/30 hover:text-white/60 hover:border-white/20'
                                        }`}
                                      >
                                        {getStatusLabel(s)}
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startEdit(lead); }}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            )}
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
      {!loading && leads.length > 0 && (
        <p className="mt-4 text-sm text-white/40">
          Showing {leads.length} lead{leads.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* CSV Import Modal — no agency needed */}
      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        agencyId="platform"
        onImportComplete={() => { fetchLeads(); fetchStats(); }}
        apiBase="/api/admin"
      />

      {/* Composer Modal — admin mode */}
      {composerLead && (
        <ComposerModal
          isOpen={composerOpen}
          onClose={() => { setComposerOpen(false); setComposerLead(null); }}
          agencyId="platform"
          lead={composerLead}
          type={composerType}
          onSent={handleOutreachSent}
          adminMode
        />
      )}
    </div>
  );
}