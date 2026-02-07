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
import { DEMO_LEADS, DEMO_LEAD_STATS } from '../demoData';

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

const LEAD_TIPS = [
  {
    title: 'How to Find Leads on Google Maps',
    description: 'Free method to find 50+ qualified leads per hour.',
    url: '/blog/how-to-find-leads-google-maps',
    category: 'Prospecting',
  },
  {
    title: 'How to Pitch AI Receptionists',
    description: 'Pain points, ROI arguments, and objection handling.',
    url: '/blog/pitch-ai-receptionists-home-services',
    category: 'Sales',
  },
  {
    title: '5 Cold Outreach Templates',
    description: 'Email templates with 10-15% reply rates.',
    url: '/blog/cold-outreach-templates-that-work',
    category: 'Outreach',
  },
];

// Helper to determine text color based on background luminance
const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#050505' : '#ffffff';
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

type FilterMode = 'all' | 'follow-up-today' | 'overdue' | 'active';

export default function AgencyLeadsPage() {
  const { agency, branding, loading: contextLoading, demoMode } = useAgency();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showTips, setShowTips] = useState(true);

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';
  const buttonTextColor = getContrastColor(primaryColor);

  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'new':
        return { bg: 'rgba(59,130,246,0.1)', text: isDark ? '#60a5fa' : '#2563eb', border: 'rgba(59,130,246,0.2)' };
      case 'contacted':
        return { bg: 'rgba(245,158,11,0.1)', text: isDark ? '#fbbf24' : '#d97706', border: 'rgba(245,158,11,0.2)' };
      case 'qualified':
        return { bg: 'rgba(168,85,247,0.1)', text: isDark ? '#a78bfa' : '#7c3aed', border: 'rgba(168,85,247,0.2)' };
      case 'proposal':
        return { bg: 'rgba(6,182,212,0.1)', text: isDark ? '#22d3ee' : '#0891b2', border: 'rgba(6,182,212,0.2)' };
      case 'won':
        return { bg: `${primaryColor}15`, text: primaryColor, border: `${primaryColor}30` };
      case 'lost':
        return { bg: 'rgba(239,68,68,0.1)', text: isDark ? '#f87171' : '#dc2626', border: 'rgba(239,68,68,0.2)' };
      default:
        return { bg: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', text: mutedTextColor, border: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb' };
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

  useEffect(() => {
    if (!agency) return;

    // Demo mode: use sample data
    if (demoMode) {
      setLeads(DEMO_LEADS as Lead[]);
      setStats(DEMO_LEAD_STATS as LeadStats);
      setLoading(false);
      return;
    }

    fetchLeads();
  }, [agency, demoMode]);

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
        
        const allLeads = data.leads || [];
        
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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    
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

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setFilterMode('all');
  };

  const handleStatClick = (mode: FilterMode) => {
    setFilterMode(mode);
    setStatusFilter(null);
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  const hasActiveFilters = searchQuery || statusFilter || filterMode !== 'all';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Leads</h1>
            <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
              {stats?.total || 0} total leads
              {stats && stats.overdueFollowUps > 0 && (
                <span className="ml-2" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>
                  {stats.overdueFollowUps} overdue
                </span>
              )}
            </p>
          </div>
          
          <Link
            href="/agency/leads/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors w-full sm:w-auto"
            style={{ backgroundColor: primaryColor, color: buttonTextColor }}
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </Link>
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {stats && stats.overdueFollowUps > 0 && filterMode !== 'overdue' && (
        <button
          onClick={() => handleStatClick('overdue')}
          className="w-full mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center justify-between transition-colors text-left"
          style={{
            backgroundColor: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>
                {stats.overdueFollowUps} overdue follow-up{stats.overdueFollowUps > 1 ? 's' : ''}
              </p>
              <p className="text-xs hidden sm:block" style={{ color: mutedTextColor }}>Click to view leads that need attention</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
        </button>
      )}

      {/* Tips Section */}
      {showTips && !hasActiveFilters && (
        <div 
          className="mb-6 sm:mb-8 rounded-xl overflow-hidden"
          style={{ 
            backgroundColor: isDark ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.05)',
            border: `1px solid ${borderColor}`,
          }}
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(168,85,247,0.2)' }}
              >
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Lead Generation Tips</h3>
                <p className="text-xs hidden sm:block" style={{ color: mutedTextColor }}>Guides to grow your pipeline</p>
              </div>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-xs transition-colors"
              style={{ color: mutedTextColor }}
            >
              Hide
            </button>
          </div>
          <div className="grid gap-2 sm:gap-3 p-3 sm:p-5 sm:grid-cols-3">
            {LEAD_TIPS.map((tip, index) => (
              <a
                key={index}
                href={tip.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group rounded-lg p-3 sm:p-4 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'}`}
                style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
              >
                <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                  <span 
                    className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: isDark ? '#a78bfa' : '#7c3aed' }}
                  >
                    {tip.category}
                  </span>
                  <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 transition-colors" style={{ color: mutedTextColor }} />
                </div>
                <h4 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-2">{tip.title}</h4>
                <p className="text-[10px] sm:text-xs line-clamp-2 hidden sm:block" style={{ color: mutedTextColor }}>{tip.description}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && stats.total > 0 && (
        <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-8">
          {/* Active Leads */}
          <button
            onClick={() => handleStatClick('active')}
            className="rounded-xl p-3 sm:p-5 text-left transition-all"
            style={filterMode === 'active' ? {
              backgroundColor: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.5)',
            } : {
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
              >
                <Target className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: isDark ? '#60a5fa' : '#2563eb' }} />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Active</p>
                <p className="text-lg sm:text-xl font-semibold">
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
            className="rounded-xl p-3 sm:p-5 text-left transition-all"
            style={statusFilter === 'qualified' ? {
              backgroundColor: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.5)',
            } : {
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(168,85,247,0.1)' }}
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: isDark ? '#a78bfa' : '#7c3aed' }} />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Qualified</p>
                <p className="text-lg sm:text-xl font-semibold">{stats.qualified + stats.proposal}</p>
              </div>
            </div>
          </button>
          
          {/* Pipeline Value */}
          <div 
            className="rounded-xl p-3 sm:p-5"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: primaryColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Pipeline</p>
                <p className="text-lg sm:text-xl font-semibold truncate">
                  {formatCurrency(stats.totalEstimatedValue)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Follow-ups Today */}
          <button
            onClick={() => handleStatClick('follow-up-today')}
            className="rounded-xl p-3 sm:p-5 text-left transition-all"
            style={filterMode === 'follow-up-today' ? {
              backgroundColor: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.5)',
            } : {
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}
              >
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm" style={{ color: mutedTextColor }}>Today</p>
                <p className="text-lg sm:text-xl font-semibold">{stats.followUpsToday}</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Active Filter Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
          <span className="text-xs sm:text-sm" style={{ color: mutedTextColor }}>Filtering:</span>
          
          {filterMode === 'follow-up-today' && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: isDark ? '#fbbf24' : '#d97706' }}
            >
              <Calendar className="h-3 w-3" />
              Today
            </span>
          )}
          
          {filterMode === 'overdue' && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: isDark ? '#f87171' : '#dc2626' }}
            >
              <AlertCircle className="h-3 w-3" />
              Overdue
            </span>
          )}
          
          {filterMode === 'active' && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: isDark ? '#60a5fa' : '#2563eb' }}
            >
              <Target className="h-3 w-3" />
              Active
            </span>
          )}
          
          {statusFilter && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
              style={{ 
                backgroundColor: getStatusStyle(statusFilter).bg,
                border: `1px solid ${getStatusStyle(statusFilter).border}`,
                color: getStatusStyle(statusFilter).text,
              }}
            >
              {getStatusLabel(statusFilter)}
            </span>
          )}
          
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs transition-colors ml-1"
            style={{ color: mutedTextColor }}
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none"
            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter || ''}
            onChange={(e) => {
              setStatusFilter(e.target.value || null);
              if (e.target.value) setFilterMode('all');
            }}
            className="flex-1 sm:flex-none rounded-xl px-3 sm:px-4 py-2.5 text-sm focus:outline-none transition-colors"
            style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
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
              className={`flex items-center justify-center rounded-xl px-3 py-2.5 transition-colors ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'}`}
              style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
            >
              <BookOpen className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Leads List */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
      >
        {filteredLeads.length === 0 ? (
          <div className="py-12 sm:py-20 text-center px-4">
            <div 
              className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              {hasActiveFilters ? (
                <Filter className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: `${primaryColor}80` }} />
              ) : (
                <Target className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: `${primaryColor}80` }} />
              )}
            </div>
            <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>
              {hasActiveFilters ? 'No leads match your filters' : 'No leads yet'}
            </p>
            <p className="text-xs sm:text-sm mt-1 mb-4" style={{ color: mutedTextColor }}>
              {hasActiveFilters 
                ? 'Try adjusting your filters' 
                : 'Start building your pipeline'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
                }`}
                style={{ border: `1px solid ${inputBorder}`, color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            ) : (
              <Link
                href="/agency/leads/new"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{ backgroundColor: primaryColor, color: buttonTextColor }}
              >
                <Plus className="h-4 w-4" />
                Add First Lead
              </Link>
            )}
          </div>
        ) : (
          <div>
            {/* Table Header - Desktop */}
            <div 
              className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium uppercase tracking-wide"
              style={{ color: mutedTextColor, borderBottom: `1px solid ${borderColor}` }}
            >
              <div className="col-span-3">Business</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Value</div>
              <div className="col-span-2">Follow-up</div>
              <div className="col-span-1"></div>
            </div>
            
            {/* Table Rows */}
            <div>
              {filteredLeads.map((lead, idx) => {
                const followUpToday = lead.next_follow_up && isToday(lead.next_follow_up);
                const followUpOverdue = lead.next_follow_up && isOverdue(lead.next_follow_up) && !['won', 'lost'].includes(lead.status);
                const statusStyle = getStatusStyle(lead.status);
                
                return (
                  <Link
                    key={lead.id}
                    href={`/agency/leads/${lead.id}`}
                    className={`block px-4 sm:px-6 py-3 sm:py-4 transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.01]'}`}
                    style={{ 
                      borderBottom: idx < filteredLeads.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'}` : 'none',
                      backgroundColor: followUpOverdue ? (isDark ? 'rgba(239,68,68,0.03)' : 'rgba(239,68,68,0.02)') : 'transparent',
                    }}
                  >
                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div 
                            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
                            style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
                          >
                            <span className="text-xs sm:text-sm font-medium" style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>
                              {lead.business_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{lead.business_name}</p>
                            <p className="text-xs truncate" style={{ color: mutedTextColor }}>{lead.contact_name || 'No contact'}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 flex-shrink-0" style={{ color: mutedTextColor }} />
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm pl-11 sm:pl-[52px]">
                        <div className="flex items-center gap-2">
                          <span 
                            className="rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                          >
                            {getStatusLabel(lead.status)}
                          </span>
                          {followUpOverdue && (
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
                          )}
                          {followUpToday && !followUpOverdue && (
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
                          )}
                        </div>
                        <span style={{ color: mutedTextColor }}>
                          {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                      <div className="col-span-3 flex items-center gap-3">
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
                        >
                          <span className="text-sm font-medium" style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>
                            {lead.business_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lead.business_name}</p>
                          <p className="text-sm capitalize truncate" style={{ color: mutedTextColor }}>{lead.industry || 'No industry'}</p>
                        </div>
                      </div>
                      
                      <div className="col-span-2 min-w-0">
                        <p className="text-sm truncate">{lead.contact_name || '—'}</p>
                        <p className="text-xs truncate" style={{ color: mutedTextColor }}>{lead.email || '—'}</p>
                      </div>
                      
                      <div className="col-span-2">
                        <span 
                          className="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {getStatusLabel(lead.status)}
                        </span>
                      </div>
                      
                      <div className="col-span-2">
                        <p className="text-sm">
                          {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                        </p>
                        {lead.estimated_value && (
                          <p className="text-xs" style={{ color: mutedTextColor }}>/month</p>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        {lead.next_follow_up ? (
                          <div className="flex items-center gap-2">
                            {followUpOverdue && (
                              <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
                            )}
                            {followUpToday && !followUpOverdue && (
                              <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
                            )}
                            <div>
                              <p 
                                className="text-sm"
                                style={{ color: followUpOverdue ? (isDark ? '#f87171' : '#dc2626') : followUpToday ? (isDark ? '#fbbf24' : '#d97706') : textColor }}
                              >
                                {new Date(lead.next_follow_up).toLocaleDateString()}
                              </p>
                              {followUpOverdue && (
                                <p className="text-xs" style={{ color: isDark ? '#f87171' : '#dc2626' }}>Overdue</p>
                              )}
                              {followUpToday && !followUpOverdue && (
                                <p className="text-xs" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>Today</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm" style={{ color: mutedTextColor }}>Not set</p>
                        )}
                      </div>
                      
                      <div className="col-span-1 flex justify-end">
                        <ChevronRight className="h-4 w-4" style={{ color: mutedTextColor }} />
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