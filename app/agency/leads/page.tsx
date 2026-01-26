'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Plus, ChevronRight, Loader2, ArrowUpRight,
  Target, Phone, Mail, Calendar, DollarSign, TrendingUp,
  ExternalLink, BookOpen, Lightbulb, Filter, AlertCircle, X,
  CheckCircle2
} from 'lucide-react';
import { useAgency } from '../context';

interface Lead {
  id: string;
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
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  proposal: number;
  won: number;
  lost: number;
  totalEstimatedValue: number;
  followUpsToday: number;
  overdueFollowUps: number;
}

// Tips & Resources - Blog posts for lead generation (correct URLs)
const LEAD_TIPS = [
  {
    title: 'How to Pitch AI Receptionists to Home Service Businesses',
    description: 'The pain points that matter, the ROI arguments that close deals, and objection handling.',
    url: '/blog/pitch-ai-receptionists-home-services',
    category: 'Sales',
  },
  {
    title: '5 Cold Outreach Templates That Actually Work',
    description: 'Data-backed email templates with 10-15% reply rates. Includes follow-up sequences.',
    url: '/blog/cold-outreach-templates-that-work',
    category: 'Outreach',
  },
  {
    title: 'Building a Referral Program for Your Agency',
    description: 'Systematic approach to getting client referrals with incentive structures and templates.',
    url: '/blog/building-referral-program-agency',
    category: 'Growth',
  },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

const getStatusStyle = (status: string) => {
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
      return 'bg-white/[0.06] text-[#fafaf9]/50 border-white/[0.08]';
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal: 'Proposal',
    won: 'Won',
    lost: 'Lost',
  };
  return labels[status] || status;
};

// Check if a date is today
function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// Check if a date is overdue (before today)
function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

// Filter types for special views
type FilterMode = 'all' | 'follow-up-today' | 'overdue' | 'active';

export default function AgencyLeadsPage() {
  const { agency, loading: contextLoading } = useAgency();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showTips, setShowTips] = useState(true);

  useEffect(() => {
    if (agency) {
      fetchLeads();
    }
  }, [agency]);

  const fetchLeads = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
        
        // Calculate stats including overdue
        const allLeads = data.leads || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const calculatedStats: LeadStats = {
          total: allLeads.length,
          new: allLeads.filter((l: Lead) => l.status === 'new').length,
          contacted: allLeads.filter((l: Lead) => l.status === 'contacted').length,
          qualified: allLeads.filter((l: Lead) => l.status === 'qualified').length,
          proposal: allLeads.filter((l: Lead) => l.status === 'proposal').length,
          won: allLeads.filter((l: Lead) => l.status === 'won').length,
          lost: allLeads.filter((l: Lead) => l.status === 'lost').length,
          totalEstimatedValue: allLeads
            .filter((l: Lead) => l.status !== 'lost')
            .reduce((sum: number, l: Lead) => sum + (l.estimated_value || 0), 0),
          followUpsToday: allLeads.filter((l: Lead) => {
            if (!l.next_follow_up) return false;
            return isToday(l.next_follow_up);
          }).length,
          overdueFollowUps: allLeads.filter((l: Lead) => {
            if (!l.next_follow_up) return false;
            if (['won', 'lost'].includes(l.status)) return false;
            return isOverdue(l.next_follow_up);
          }).length,
        };
        
        setStats(calculatedStats);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter leads based on all criteria
  const filteredLeads = leads.filter(lead => {
    // Search filter
    const matchesSearch = !searchQuery || 
      lead.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    
    // Special filter modes
    let matchesFilterMode = true;
    if (filterMode === 'follow-up-today') {
      matchesFilterMode = lead.next_follow_up ? isToday(lead.next_follow_up) : false;
    } else if (filterMode === 'overdue') {
      matchesFilterMode = lead.next_follow_up ? isOverdue(lead.next_follow_up) && !['won', 'lost'].includes(lead.status) : false;
    } else if (filterMode === 'active') {
      matchesFilterMode = !['won', 'lost'].includes(lead.status);
    }
    
    return matchesSearch && matchesStatus && matchesFilterMode;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setFilterMode('all');
  };

  // Handle stat card clicks
  const handleStatClick = (mode: FilterMode) => {
    setFilterMode(mode);
    setStatusFilter(null); // Clear status filter when using special modes
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const hasActiveFilters = searchQuery || statusFilter || filterMode !== 'all';

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-[#fafaf9]/50">
            {stats?.total || 0} total leads
            {stats && stats.overdueFollowUps > 0 && (
              <span className="text-amber-400 ml-2">
                {stats.overdueFollowUps} overdue
              </span>
            )}
          </p>
        </div>
        
        <Link
          href="/agency/leads/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </Link>
      </div>

      {/* Overdue Alert Banner */}
      {stats && stats.overdueFollowUps > 0 && filterMode !== 'overdue' && (
        <button
          onClick={() => handleStatClick('overdue')}
          className="w-full mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between hover:bg-amber-500/15 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <div>
              <p className="font-medium text-amber-400">
                {stats.overdueFollowUps} overdue follow-up{stats.overdueFollowUps > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-[#fafaf9]/50">Click to view leads that need attention</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-amber-400" />
        </button>
      )}

      {/* Tips Section */}
      {showTips && !hasActiveFilters && (
        <div className="mb-8 rounded-xl border border-white/[0.06] bg-gradient-to-r from-purple-500/[0.08] to-transparent overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20">
                <Lightbulb className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium">Lead Generation Resources</h3>
                <p className="text-sm text-[#fafaf9]/50">Guides to help you grow your pipeline</p>
              </div>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-sm text-[#fafaf9]/40 hover:text-[#fafaf9]/60 transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {LEAD_TIPS.map((tip, index) => (
              <a
                key={index}
                href={tip.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                    {tip.category}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#fafaf9]/30 group-hover:text-[#fafaf9]/50 transition-colors" />
                </div>
                <h4 className="font-medium text-sm mb-1 line-clamp-2">{tip.title}</h4>
                <p className="text-xs text-[#fafaf9]/40 line-clamp-2">{tip.description}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid - All clickable */}
      {stats && stats.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Active Leads */}
          <button
            onClick={() => handleStatClick('active')}
            className={`rounded-xl border p-5 text-left transition-all ${
              filterMode === 'active'
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-[#fafaf9]/50">Active Leads</p>
                <p className="text-xl font-semibold">
                  {stats.total - stats.won - stats.lost}
                </p>
              </div>
            </div>
          </button>
          
          {/* Qualified */}
          <button
            onClick={() => {
              setFilterMode('all');
              setStatusFilter(statusFilter === 'qualified' ? null : 'qualified');
            }}
            className={`rounded-xl border p-5 text-left transition-all ${
              statusFilter === 'qualified'
                ? 'border-purple-500/50 bg-purple-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-[#fafaf9]/50">Qualified</p>
                <p className="text-xl font-semibold">{stats.qualified + stats.proposal}</p>
              </div>
            </div>
          </button>
          
          {/* Pipeline Value - Not clickable, just display */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-[#fafaf9]/50">Pipeline Value</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(stats.totalEstimatedValue)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Follow-ups Today - Clickable */}
          <button
            onClick={() => handleStatClick('follow-up-today')}
            className={`rounded-xl border p-5 text-left transition-all ${
              filterMode === 'follow-up-today'
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-[#fafaf9]/50">Follow-ups Today</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-semibold">{stats.followUpsToday}</p>
                  {stats.followUpsToday > 0 && filterMode !== 'follow-up-today' && (
                    <span className="text-xs text-amber-400">Click to view</span>
                  )}
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Active Filter Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-[#fafaf9]/50">Filtering by:</span>
          
          {filterMode === 'follow-up-today' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-400">
              <Calendar className="h-3 w-3" />
              Follow-ups Today
            </span>
          )}
          
          {filterMode === 'overdue' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </span>
          )}
          
          {filterMode === 'active' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
              <Target className="h-3 w-3" />
              Active Only
            </span>
          )}
          
          {statusFilter && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(statusFilter)}`}>
              {getStatusLabel(statusFilter)}
            </span>
          )}
          
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1 text-xs font-medium text-[#fafaf9]/70">
              <Search className="h-3 w-3" />
              "{searchQuery}"
            </span>
          )}
          
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors ml-2"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none transition-colors"
          />
        </div>
        
        <select
          value={statusFilter || ''}
          onChange={(e) => {
            setStatusFilter(e.target.value || null);
            if (e.target.value) {
              setFilterMode('all'); // Clear special mode when selecting status
            }
          }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-[#fafaf9]/70 focus:outline-none focus:border-emerald-500/50 transition-colors"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        {!showTips && (
          <button
            onClick={() => setShowTips(true)}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-[#fafaf9]/70 hover:bg-white/[0.06] transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Show Tips
          </button>
        )}
      </div>

      {/* Leads List */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              {hasActiveFilters ? (
                <Filter className="h-8 w-8 text-emerald-400/50" />
              ) : (
                <Target className="h-8 w-8 text-emerald-400/50" />
              )}
            </div>
            <p className="mt-4 font-medium text-[#fafaf9]/70">
              {hasActiveFilters ? 'No leads match your filters' : 'No leads yet'}
            </p>
            <p className="text-sm text-[#fafaf9]/40 mt-1 mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search query' 
                : 'Start building your pipeline by adding your first lead'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 text-sm font-medium text-[#fafaf9]/70 hover:bg-white/[0.04] transition-colors"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            ) : (
              <Link
                href="/agency/leads/new"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Your First Lead
              </Link>
            )}
          </div>
        ) : (
          <div>
            {/* Table Header - Desktop */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium uppercase tracking-wide text-[#fafaf9]/40 border-b border-white/[0.06]">
              <div className="col-span-3">Business</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Value</div>
              <div className="col-span-2">Follow-up</div>
              <div className="col-span-1"></div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y divide-white/[0.04]">
              {filteredLeads.map((lead) => {
                const followUpToday = lead.next_follow_up && isToday(lead.next_follow_up);
                const followUpOverdue = lead.next_follow_up && isOverdue(lead.next_follow_up) && !['won', 'lost'].includes(lead.status);
                
                return (
                  <Link
                    key={lead.id}
                    href={`/agency/leads/${lead.id}`}
                    className={`block lg:grid lg:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors ${
                      followUpOverdue ? 'bg-red-500/[0.03]' : ''
                    }`}
                  >
                    {/* Mobile Layout */}
                    <div className="lg:hidden flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                          <span className="text-sm font-medium text-blue-400">
                            {lead.business_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{lead.business_name}</p>
                          <p className="text-sm text-[#fafaf9]/50">{lead.contact_name || 'No contact'}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#fafaf9]/30" />
                    </div>
                    <div className="lg:hidden flex items-center justify-between text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                      <div className="flex items-center gap-2">
                        {followUpOverdue && (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                        {followUpToday && (
                          <Calendar className="h-4 w-4 text-amber-400" />
                        )}
                        <span className="text-[#fafaf9]/40">
                          {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:flex col-span-3 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <span className="text-sm font-medium text-blue-400">
                          {lead.business_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{lead.business_name}</p>
                        <p className="text-sm text-[#fafaf9]/40 capitalize">{lead.industry || 'No industry'}</p>
                      </div>
                    </div>
                    
                    <div className="hidden lg:block col-span-2">
                      <p className="text-sm">{lead.contact_name || '—'}</p>
                      <p className="text-xs text-[#fafaf9]/40 truncate">{lead.email || '—'}</p>
                    </div>
                    
                    <div className="hidden lg:block col-span-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </div>
                    
                    <div className="hidden lg:block col-span-2">
                      <p className="text-sm">
                        {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                      </p>
                      {lead.estimated_value && (
                        <p className="text-xs text-[#fafaf9]/40">/month</p>
                      )}
                    </div>
                    
                    <div className="hidden lg:block col-span-2">
                      {lead.next_follow_up ? (
                        <div className="flex items-center gap-2">
                          {followUpOverdue && (
                            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                          )}
                          {followUpToday && !followUpOverdue && (
                            <Calendar className="h-4 w-4 text-amber-400 flex-shrink-0" />
                          )}
                          <div>
                            <p className={`text-sm ${followUpOverdue ? 'text-red-400' : followUpToday ? 'text-amber-400' : ''}`}>
                              {new Date(lead.next_follow_up).toLocaleDateString()}
                            </p>
                            {followUpOverdue && (
                              <p className="text-xs text-red-400">Overdue</p>
                            )}
                            {followUpToday && !followUpOverdue && (
                              <p className="text-xs text-amber-400">Today</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[#fafaf9]/30">Not set</p>
                      )}
                    </div>
                    
                    <div className="hidden lg:flex col-span-1 justify-end">
                      <ChevronRight className="h-4 w-4 text-[#fafaf9]/20" />
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