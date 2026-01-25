'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Plus, ChevronRight, Loader2, ArrowUpRight,
  Target, Phone, Mail, Calendar, DollarSign, TrendingUp,
  ExternalLink, BookOpen, Lightbulb, Filter
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
}

// Tips & Resources - Blog posts for lead generation
const LEAD_TIPS = [
  {
    title: 'How to Pitch AI Receptionists to Home Service Businesses',
    description: 'Learn the key pain points and ROI arguments that resonate with plumbers, HVAC, and electricians.',
    url: '/blog/pitch-ai-receptionists-home-services',
    category: 'Sales',
  },
  {
    title: '5 Cold Outreach Templates That Actually Work',
    description: 'Proven email and LinkedIn message templates for reaching decision makers.',
    url: '/blog/cold-outreach-templates',
    category: 'Outreach',
  },
  {
    title: 'Building a Referral Program for Your Agency',
    description: 'How to incentivize existing clients to refer new business your way.',
    url: '/blog/referral-program-guide',
    category: 'Growth',
  },
  {
    title: 'Local SEO Strategies for Agency Lead Generation',
    description: 'Rank for "AI receptionist" searches in your target markets.',
    url: '/blog/local-seo-lead-generation',
    category: 'Marketing',
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

export default function AgencyLeadsPage() {
  const { agency, loading: contextLoading } = useAgency();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
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
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || lead.status === statusFilter;
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
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-[#fafaf9]/50">
            {stats?.total || 0} total leads · {stats?.followUpsToday || 0} follow-ups today
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

      {/* Tips Section */}
      {showTips && (
        <div className="mb-8 rounded-xl border border-white/[0.06] bg-gradient-to-r from-purple-500/[0.08] to-transparent overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20">
                <Lightbulb className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium">Lead Generation Tips</h3>
                <p className="text-sm text-[#fafaf9]/50">Resources to help you grow your pipeline</p>
              </div>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-sm text-[#fafaf9]/40 hover:text-[#fafaf9]/60 transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Stats Grid */}
      {stats && stats.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
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
          </div>
          
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-[#fafaf9]/50">Qualified</p>
                <p className="text-xl font-semibold">{stats.qualified + stats.proposal}</p>
              </div>
            </div>
          </div>
          
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
          
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-[#fafaf9]/50">Follow-ups Today</p>
                <p className="text-xl font-semibold">{stats.followUpsToday}</p>
              </div>
            </div>
          </div>
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
          onChange={(e) => setStatusFilter(e.target.value || null)}
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
              <Target className="h-8 w-8 text-emerald-400/50" />
            </div>
            <p className="mt-4 font-medium text-[#fafaf9]/70">
              {searchQuery || statusFilter ? 'No leads match your search' : 'No leads yet'}
            </p>
            <p className="text-sm text-[#fafaf9]/40 mt-1 mb-4">
              {searchQuery || statusFilter 
                ? 'Try adjusting your filters' 
                : 'Start building your pipeline by adding your first lead'}
            </p>
            {!searchQuery && !statusFilter && (
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
              {filteredLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/agency/leads/${lead.id}`}
                  className="block lg:grid lg:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
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
                    <span className="text-[#fafaf9]/40">
                      {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                    </span>
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
                    <p className="text-xs text-[#fafaf9]/40">/month</p>
                  </div>
                  
                  <div className="hidden lg:block col-span-2">
                    {lead.next_follow_up ? (
                      <p className="text-sm">
                        {new Date(lead.next_follow_up).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-sm text-[#fafaf9]/30">Not set</p>
                    )}
                  </div>
                  
                  <div className="hidden lg:flex col-span-1 justify-end">
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