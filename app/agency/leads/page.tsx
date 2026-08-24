'use client';

import { useState, useEffect, type CSSProperties, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Plus, ChevronRight, ChevronDown, Loader2, ArrowUpRight,
  Target, Phone, Mail, MessageSquare, Calendar, DollarSign, TrendingUp,
  ExternalLink, BookOpen, Lightbulb, Filter, AlertCircle, X, Lock, Clock,
  CheckCircle2, FileSpreadsheet
} from 'lucide-react';
import { useAgency } from '../context';
import LockedFeatureOverlay from '@/components/LockedFeature';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useTheme } from '../../../hooks/useTheme';
import { getDemoLeads, getDemoLeadStats } from '../demoData';
import CSVImportModal from '@/components/CSVImportModal';
import ComposerModal from '@/components/ComposerModal';

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
  outreach?: {
    last_contacted?: string | null;
    email_count?: number;
    sms_count?: number;
    call_count?: number;
  };
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

interface FollowUpItem {
  lead_id: string;
  business_name: string;
  contact_name: string;
  next_type: string;
  next_template_name: string;
  next_sequence_order: number;
  due_date: string;
  urgency: 'overdue' | 'due_today' | 'upcoming';
  days_overdue: number;
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

function timeSince(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

type FilterMode = 'all' | 'follow-up-today' | 'overdue' | 'active' | 'sequence-due';

// ---------------------------------------------------------------------------
// Presentational pieces for the leads page. These are theme-agnostic: every
// colour comes from the --lp-* CSS variables set once on the page root, so
// hover and active states are pure CSS. No per-element inline styles and no
// JS onMouseEnter/onMouseLeave handlers.
// ---------------------------------------------------------------------------

type StatTone = 'default' | 'primary' | 'warning' | 'error' | 'info';

const STAT_TONE: Record<StatTone, { icon: string; iconBg: string; activeBg: string; activeBorder: string }> = {
  default: { icon: 'text-[var(--lp-muted)]',   iconBg: 'bg-[var(--lp-hover)]',       activeBg: 'bg-[var(--lp-card)]',       activeBorder: 'border-[var(--lp-border)]' },
  primary: { icon: 'text-[var(--lp-primary)]', iconBg: 'bg-[var(--lp-primary-15)]',  activeBg: 'bg-[var(--lp-primary-15)]', activeBorder: 'border-[var(--lp-primary)]' },
  warning: { icon: 'text-[var(--lp-warning)]', iconBg: 'bg-[var(--lp-warning-bg)]',  activeBg: 'bg-[var(--lp-warning-bg)]', activeBorder: 'border-[var(--lp-warning)]' },
  error:   { icon: 'text-[var(--lp-error)]',   iconBg: 'bg-[var(--lp-error-bg)]',    activeBg: 'bg-[var(--lp-error-bg)]',   activeBorder: 'border-[var(--lp-error)]' },
  info:    { icon: 'text-[var(--lp-info)]',    iconBg: 'bg-[var(--lp-info-bg)]',     activeBg: 'bg-[var(--lp-info-bg)]',    activeBorder: 'border-[var(--lp-info)]' },
};

function StatCard({ label, value, icon: Icon, tone = 'default', active = false, onClick }: {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  tone?: StatTone;
  active?: boolean;
  onClick?: () => void;
}) {
  const t = STAT_TONE[tone];
  const shell = active ? `${t.activeBg} border ${t.activeBorder}` : 'bg-[var(--lp-card)] border border-[var(--lp-border)]';
  const inner = (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0 ${t.iconBg}`}>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${t.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-sm text-[var(--lp-muted)]">{label}</p>
        <p className="text-lg sm:text-xl font-semibold truncate text-[var(--lp-text)]">{value}</p>
      </div>
    </div>
  );
  if (!onClick) return <div className={`rounded-xl p-3 sm:p-5 ${shell}`}>{inner}</div>;
  return (
    <button onClick={onClick} className={`rounded-xl p-3 sm:p-5 text-left w-full transition-colors hover:brightness-[0.98] ${shell}`}>
      {inner}
    </button>
  );
}

function OverdueBanner({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 flex items-center justify-between text-left transition-colors bg-[var(--lp-warning-bg)] border border-[var(--lp-warning-border)] hover:brightness-[0.98]"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[var(--lp-warning)]" />
        <div>
          <p className="font-medium text-sm text-[var(--lp-warning-text)]">{count} overdue follow-up{count > 1 ? 's' : ''}</p>
          <p className="text-xs hidden sm:block text-[var(--lp-muted)]">Click to view leads that need attention</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[var(--lp-warning)]" />
    </button>
  );
}

function TipsPanel({ tips, onHide }: { tips: typeof LEAD_TIPS; onHide: () => void }) {
  return (
    <div className="mb-6 sm:mb-8 rounded-xl overflow-hidden bg-[var(--lp-primary-15)] border border-[var(--lp-border)]">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--lp-border)]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg flex-shrink-0 bg-[var(--lp-primary-15)]">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--lp-primary)]" />
          </div>
          <div>
            <h3 className="font-medium text-sm text-[var(--lp-text)]">Lead Generation Tips</h3>
            <p className="text-xs hidden sm:block text-[var(--lp-muted)]">Guides to grow your pipeline</p>
          </div>
        </div>
        <button onClick={onHide} className="text-xs transition-colors text-[var(--lp-muted)] hover:text-[var(--lp-text)]">Hide</button>
      </div>
      <div className="grid gap-2 sm:gap-3 p-3 sm:p-5 sm:grid-cols-3">
        {tips.map((tip, index) => (
          <a
            key={index}
            href={tip.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg p-3 sm:p-4 transition-colors bg-[var(--lp-card)] border border-[var(--lp-border)] hover:bg-[var(--lp-hover)]"
          >
            <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded bg-[var(--lp-primary-15)] text-[var(--lp-primary)]">{tip.category}</span>
              <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 text-[var(--lp-muted)]" />
            </div>
            <h4 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-2 text-[var(--lp-text)]">{tip.title}</h4>
            <p className="text-[10px] sm:text-xs line-clamp-2 hidden sm:block text-[var(--lp-muted)]">{tip.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function InlineStatusSelect({ value, bg, text, options, onChange }: {
  value: string;
  bg: string;
  text: string;
  options: { value: string; label: string; color: string }[];
  onChange: (status: string) => void;
}) {
  // Native <select> on purpose: the leads list uses overflow-hidden for its
  // rounded corners, which would clip a custom dropdown. The browser renders a
  // native select's menu in its own layer, so it never gets clipped, and it
  // works on touch. The trigger is styled as a coloured status pill.
  return (
    <span className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <select
        value={value}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none cursor-pointer rounded-full pl-3 pr-6 py-1 text-xs font-medium focus:outline-none"
        style={{ backgroundColor: bg, color: text }}
        aria-label="Change lead status"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#ffffff', color: '#111827' }}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 opacity-70" style={{ color: text }} />
    </span>
  );
}

function LeadRow({ lead, statusBg, statusText, statusOptions, onStatusChange, onComposer, followUpToday, followUpOverdue, queueItem, isLast }: {
  lead: Lead;
  statusBg: string;
  statusText: string;
  statusOptions: { value: string; label: string; color: string }[];
  onStatusChange: (leadId: string, status: string) => void;
  onComposer: (lead: Lead, type: 'email' | 'sms') => void;
  followUpToday: boolean;
  followUpOverdue: boolean;
  queueItem?: FollowUpItem;
  isLast: boolean;
}) {
  const queueColor = queueItem && queueItem.urgency === 'overdue' ? 'text-[var(--lp-error)]' : 'text-[var(--lp-primary)]';
  return (
    <Link
      href={`/agency/leads/${lead.id}`}
      prefetch={false}
      className={`group block px-4 sm:px-6 py-3 sm:py-4 transition-colors hover:bg-[var(--lp-hover)] ${isLast ? '' : 'border-b border-[var(--lp-border-subtle)]'}`}
    >
      {/* Mobile */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0 bg-[var(--lp-info-bg)]">
              <span className="text-xs sm:text-sm font-medium text-[var(--lp-info)]">{lead.business_name?.charAt(0) || '?'}</span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate text-[var(--lp-text)]">{lead.business_name}</p>
              <p className="text-xs truncate text-[var(--lp-muted)]">{lead.contact_name || 'No contact'}</p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-[var(--lp-muted)]" />
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm pl-11 sm:pl-[52px]">
          <div className="flex items-center gap-2">
            <InlineStatusSelect value={lead.status} bg={statusBg} text={statusText} options={statusOptions} onChange={(s) => onStatusChange(lead.id, s)} />
            {followUpOverdue && <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--lp-error)]" />}
            {followUpToday && !followUpOverdue && <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--lp-warning)]" />}
            {!followUpOverdue && !followUpToday && queueItem && <Mail className={`h-3 w-3 sm:h-4 sm:w-4 ${queueColor}`} />}
            {!lead.next_follow_up && !queueItem && (
              <span className="text-[10px] text-[var(--lp-muted)] truncate">{lead.outreach?.last_contacted ? `Contacted ${timeSince(lead.outreach.last_contacted)}` : 'Never contacted'}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {lead.email && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onComposer(lead, 'email'); }} className="p-1 rounded-md transition-colors hover:bg-[var(--lp-hover)]" title="Send email" aria-label="Send email"><Mail className="h-4 w-4 text-[var(--lp-muted)]" /></button>
            )}
            {lead.phone && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onComposer(lead, 'sms'); }} className="p-1 rounded-md transition-colors hover:bg-[var(--lp-hover)]" title="Send SMS" aria-label="Send SMS"><MessageSquare className="h-4 w-4 text-[var(--lp-muted)]" /></button>
            )}
            <span className="text-[var(--lp-muted)] ml-0.5">{lead.estimated_value ? formatCurrency(lead.estimated_value) : '\u2013'}</span>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
        <div className="col-span-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--lp-info-bg)]">
            <span className="text-sm font-medium text-[var(--lp-info)]">{lead.business_name?.charAt(0) || '?'}</span>
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate text-[var(--lp-text)]">{lead.business_name}</p>
            <p className="text-sm capitalize truncate text-[var(--lp-muted)]">{lead.industry || 'No industry'}</p>
          </div>
        </div>

        <div className="col-span-2 min-w-0">
          <p className="text-sm truncate text-[var(--lp-text)]">{lead.contact_name || '\u2013'}</p>
          <p className="text-xs truncate text-[var(--lp-muted)]">{lead.email || '\u2013'}</p>
        </div>

        <div className="col-span-2">
          <InlineStatusSelect value={lead.status} bg={statusBg} text={statusText} options={statusOptions} onChange={(s) => onStatusChange(lead.id, s)} />
        </div>

        <div className="col-span-2">
          <p className="text-sm text-[var(--lp-text)]">{lead.estimated_value ? formatCurrency(lead.estimated_value) : '\u2013'}</p>
          {lead.estimated_value ? <p className="text-xs text-[var(--lp-muted)]">/month</p> : null}
        </div>

        <div className="col-span-2">
          {lead.next_follow_up ? (
            <div className="flex items-center gap-2">
              {followUpOverdue && <AlertCircle className="h-4 w-4 flex-shrink-0 text-[var(--lp-error)]" />}
              {followUpToday && !followUpOverdue && <Calendar className="h-4 w-4 flex-shrink-0 text-[var(--lp-warning)]" />}
              <div>
                <p className={`text-sm ${followUpOverdue ? 'text-[var(--lp-error)]' : followUpToday ? 'text-[var(--lp-warning)]' : 'text-[var(--lp-text)]'}`}>{new Date(lead.next_follow_up).toLocaleDateString()}</p>
                {followUpOverdue && <p className="text-xs text-[var(--lp-error)]">Overdue</p>}
                {followUpToday && !followUpOverdue && <p className="text-xs text-[var(--lp-warning)]">Today</p>}
              </div>
            </div>
          ) : queueItem ? (
            <div className="flex items-center gap-2">
              <Mail className={`h-4 w-4 flex-shrink-0 ${queueColor}`} />
              <div>
                <p className={`text-sm truncate ${queueColor}`}>{queueItem.next_template_name}</p>
                <p className={`text-xs ${queueItem.urgency === 'overdue' ? 'text-[var(--lp-error)]' : 'text-[var(--lp-muted)]'}`}>{queueItem.urgency === 'overdue' ? `${queueItem.days_overdue}d overdue` : queueItem.urgency === 'due_today' ? 'Due today' : 'Due soon'}</p>
              </div>
            </div>
          ) : lead.outreach?.last_contacted ? (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0 text-[var(--lp-muted)]" />
              <p className="text-sm text-[var(--lp-muted)]">Contacted {timeSince(lead.outreach.last_contacted)}</p>
            </div>
          ) : (
            <p className="text-sm text-[var(--lp-muted)]">Never contacted</p>
          )}
        </div>

        <div className="col-span-1 flex justify-end items-center">
          <ChevronRight className="h-4 w-4 text-[var(--lp-muted)] group-hover:hidden" />
          <div className="hidden group-hover:flex items-center gap-0.5">
            {lead.email && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onComposer(lead, 'email'); }} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--lp-hover)]" title="Send email" aria-label="Send email"><Mail className="h-3.5 w-3.5 text-[var(--lp-muted)]" /></button>
            )}
            {lead.phone && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onComposer(lead, 'sms'); }} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--lp-hover)]" title="Send SMS" aria-label="Send SMS"><MessageSquare className="h-3.5 w-3.5 text-[var(--lp-muted)]" /></button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AgencyLeadsPage() {
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const { canUseLeadFinder } = usePlanFeatures();
  const isFreePlan = !canUseLeadFinder;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showTips, setShowTips] = useState(true);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'email' | 'sms'>('email');
  const [composerLead, setComposerLead] = useState<Lead | null>(null);

  // Follow-up queue (sequence-based)
  const [followUpQueue, setFollowUpQueue] = useState<FollowUpItem[]>([]);
  const [followUpSummary, setFollowUpSummary] = useState<{ overdue: number; due_today: number; upcoming: number; total: number } | null>(null);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'new':
        return { bg: theme.infoBg, text: theme.info, border: theme.infoBorder };
      case 'contacted':
        return { bg: theme.warningBg, text: theme.warning, border: theme.warningBorder };
      case 'qualified':
        return { bg: theme.primary15, text: theme.primary, border: theme.primary30 };
      case 'proposal':
        return { bg: 'rgba(6,182,212,0.1)', text: theme.isDark ? '#22d3ee' : '#0891b2', border: 'rgba(6,182,212,0.2)' };
      case 'won':
        return { bg: theme.primary15, text: theme.primary, border: theme.primary30 };
      case 'lost':
        return { bg: theme.errorBg, text: theme.error, border: theme.errorBorder };
      default:
        return { bg: theme.hover, text: theme.textMuted, border: theme.border };
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

    // Demo mode OR Free plan → render demo leads so the page is alive
    // behind the LockedFeatureOverlay (or in normal demo mode for Pro/Scale).
    // Real fetch only runs once they upgrade.
    if (demoMode || isFreePlan) {
      setLeads(getDemoLeads() as Lead[]);
      setStats(getDemoLeadStats() as LeadStats);
      setLoading(false);
      return;
    }

    fetchLeads();
    fetchFollowUpQueue();
  }, [agency, demoMode, isFreePlan]);

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

  const fetchFollowUpQueue = async () => {
    if (!agency || demoMode) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/follow-up-queue`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFollowUpQueue(data.queue || []);
        setFollowUpSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch follow-up queue:', error);
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
    } else if (filterMode === 'sequence-due') {
      matchesFilterMode = followUpQueue.some(q => q.lead_id === lead.id);
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

  // Inline status change from the leads list. Optimistic local update, then
  // PATCH the confirmed endpoint. In demo / free mode the leads are demo data,
  // so we update locally only and skip the network call.
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l)));
    if (demoMode || isFreePlan || !agency) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${backendUrl}/api/agency/${agency.id}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchLeads();
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  const openComposer = (lead: Lead, type: 'email' | 'sms') => {
    setComposerLead(lead);
    setComposerType(type);
    setComposerOpen(true);
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const hasActiveFilters = searchQuery || statusFilter || filterMode !== 'all';

  // Full Leads UI – used as the LockedFeatureOverlay children when Free
  // (populated with demo data via the useEffect above), AND as the direct
  // return for Pro/Scale agencies with real data.
  // Theme tokens exposed once as CSS variables so the markup below (and the
  // extracted components) can style with plain classes and CSS :hover instead
  // of per-element inline styles and JS hover handlers.
  const lpVars = {
    '--lp-primary': theme.primary,
    '--lp-primary-text': theme.primaryText,
    '--lp-primary-15': theme.primary15,
    '--lp-primary-30': theme.primary30,
    '--lp-card': theme.card,
    '--lp-border': theme.border,
    '--lp-border-subtle': theme.borderSubtle,
    '--lp-text': theme.text,
    '--lp-muted': theme.textMuted,
    '--lp-hover': theme.hover,
    '--lp-input': theme.input,
    '--lp-input-border': theme.inputBorder,
    '--lp-warning': theme.warning,
    '--lp-warning-bg': theme.warningBg,
    '--lp-warning-border': theme.warningBorder,
    '--lp-warning-text': theme.warningText,
    '--lp-error': theme.error,
    '--lp-error-bg': theme.errorBg,
    '--lp-error-border': theme.errorBorder,
    '--lp-info': theme.info,
    '--lp-info-bg': theme.infoBg,
  } as CSSProperties;

  const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((v) => ({
    value: v,
    label: getStatusLabel(v),
    color: getStatusStyle(v).text,
  }));

  const pageContent = (
    <div className="p-4 sm:p-6 lg:p-8" style={lpVars}>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--lp-text)]">Leads</h1>
            <p className="mt-1 text-sm text-[var(--lp-muted)]">
              {stats?.total || 0} total leads
              {stats && stats.overdueFollowUps > 0 && (
                <span className="ml-2 text-[var(--lp-warning)]">{stats.overdueFollowUps} overdue</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/agency/leads/finder" prefetch={false} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-[filter] bg-[var(--lp-primary)] text-[var(--lp-primary-text)] hover:brightness-95">
              <Search className="h-4 w-4" />
              Find Leads
            </Link>
            <button onClick={() => setShowCSVImport(true)} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors bg-[var(--lp-input)] border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
              <FileSpreadsheet className="h-4 w-4" />
              Import CSV
            </button>
            <Link href="/agency/leads/new" prefetch={false} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors bg-[var(--lp-input)] border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
              <Plus className="h-4 w-4" />
              Add Lead
            </Link>
          </div>
        </div>
      </div>

      {/* Overdue banner */}
      {stats && stats.overdueFollowUps > 0 && filterMode !== 'overdue' && (
        <OverdueBanner count={stats.overdueFollowUps} onClick={() => handleStatClick('overdue')} />
      )}

      {/* Tips */}
      {showTips && !hasActiveFilters && (
        <TipsPanel tips={LEAD_TIPS} onHide={() => setShowTips(false)} />
      )}

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-5 mb-4 sm:mb-8">
          <StatCard label="Active" value={stats.total - stats.won - stats.lost} icon={Target} tone="info" active={filterMode === 'active'} onClick={() => handleStatClick('active')} />
          <StatCard label="Qualified" value={stats.qualified + stats.proposal} icon={TrendingUp} tone="primary" active={statusFilter === 'qualified'} onClick={() => { setFilterMode('all'); setStatusFilter(statusFilter === 'qualified' ? null : 'qualified'); }} />
          <StatCard label="Pipeline" value={formatCurrency(stats.totalEstimatedValue)} icon={DollarSign} tone="primary" />
          {followUpSummary && followUpSummary.total > 0 && (
            <StatCard label="Sequence Due" value={followUpSummary.total} icon={Mail} tone={followUpSummary.overdue > 0 ? 'error' : 'primary'} active={filterMode === 'sequence-due'} onClick={() => handleStatClick('sequence-due')} />
          )}
          <StatCard label="Today" value={stats.followUpsToday} icon={Calendar} tone="warning" active={filterMode === 'follow-up-today'} onClick={() => handleStatClick('follow-up-today')} />
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
          <span className="text-xs sm:text-sm text-[var(--lp-muted)]">Filtering:</span>
          {filterMode === 'follow-up-today' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-[var(--lp-warning-bg)] border border-[var(--lp-warning-border)] text-[var(--lp-warning)]"><Calendar className="h-3 w-3" />Today</span>
          )}
          {filterMode === 'overdue' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-[var(--lp-error-bg)] border border-[var(--lp-error-border)] text-[var(--lp-error)]"><AlertCircle className="h-3 w-3" />Overdue</span>
          )}
          {filterMode === 'active' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-[var(--lp-info-bg)] border border-[var(--lp-info)] text-[var(--lp-info)]"><Target className="h-3 w-3" />Active</span>
          )}
          {filterMode === 'sequence-due' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-[var(--lp-primary-15)] border border-[var(--lp-primary-30)] text-[var(--lp-primary)]"><Mail className="h-3 w-3" />Sequence Due</span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium" style={{ backgroundColor: getStatusStyle(statusFilter).bg, border: `1px solid ${getStatusStyle(statusFilter).border}`, color: getStatusStyle(statusFilter).text }}>{getStatusLabel(statusFilter)}</span>
          )}
          <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs transition-colors ml-1 text-[var(--lp-muted)] hover:text-[var(--lp-text)]"><X className="h-3 w-3" />Clear</button>
        </div>
      )}

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--lp-muted)]" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none bg-[var(--lp-input)] border border-[var(--lp-input-border)] text-[var(--lp-text)]"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter || ''}
            onChange={(e) => {
              setStatusFilter(e.target.value || null);
              if (e.target.value) setFilterMode('all');
            }}
            className="flex-1 sm:flex-none rounded-xl px-3 sm:px-4 py-2.5 text-sm focus:outline-none transition-colors bg-[var(--lp-input)] border border-[var(--lp-input-border)] text-[var(--lp-muted)]"
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
              className="flex items-center justify-center rounded-xl px-3 py-2.5 transition-colors bg-[var(--lp-input)] border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]"
            >
              <BookOpen className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Leads list */}
      <div className="rounded-xl overflow-hidden bg-[var(--lp-card)] border border-[var(--lp-border)]">
        {filteredLeads.length === 0 ? (
          <div className="py-12 sm:py-20 text-center px-4">
            <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[var(--lp-primary-15)]">
              {hasActiveFilters ? (
                <Filter className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--lp-primary)]" />
              ) : (
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--lp-primary)]" />
              )}
            </div>
            <p className="mt-4 font-medium text-sm sm:text-base text-[var(--lp-text)]">
              {hasActiveFilters ? 'No leads match your filters' : 'No leads yet'}
            </p>
            <p className="text-xs sm:text-sm mt-1 mb-4 text-[var(--lp-muted)]">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Start building your pipeline'}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            ) : (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/agency/leads/finder" prefetch={false} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[filter] bg-[var(--lp-primary)] text-[var(--lp-primary-text)] hover:brightness-95">
                  <Search className="h-4 w-4" />
                  Find Leads
                </Link>
                <Link href="/agency/leads/new" prefetch={false} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
                  <Plus className="h-4 w-4" />
                  Add Lead
                </Link>
                <button onClick={() => setShowCSVImport(true)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
                  <FileSpreadsheet className="h-4 w-4" />
                  Import CSV
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop column header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium uppercase tracking-wide text-[var(--lp-muted)] border-b border-[var(--lp-border)]">
              <div className="col-span-3">Business</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Value</div>
              <div className="col-span-2">Follow-up</div>
              <div className="col-span-1"></div>
            </div>

            <div>
              {filteredLeads.map((lead, idx) => {
                const followUpToday = !!(lead.next_follow_up && isToday(lead.next_follow_up));
                const followUpOverdue = !!(lead.next_follow_up && isOverdue(lead.next_follow_up) && !['won', 'lost'].includes(lead.status));
                const ss = getStatusStyle(lead.status);
                const queueItem = followUpQueue.find(q => q.lead_id === lead.id);
                return (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    statusBg={ss.bg}
                    statusText={ss.text}
                    statusOptions={statusOptions}
                    onStatusChange={handleStatusChange}
                    onComposer={openComposer}
                    followUpToday={followUpToday}
                    followUpOverdue={followUpOverdue}
                    queueItem={queueItem}
                    isLast={idx === filteredLeads.length - 1}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      {agency && (
        <CSVImportModal
          isOpen={showCSVImport}
          onClose={() => setShowCSVImport(false)}
          agencyId={agency.id}
          onImportComplete={() => { fetchLeads(); fetchFollowUpQueue(); }}
          theme={theme}
        />
      )}

      {/* Quick outreach (email / SMS) via the shared composer, agency mode */}
      {agency && composerLead && (
        <ComposerModal
          isOpen={composerOpen}
          onClose={() => { setComposerOpen(false); setComposerLead(null); }}
          agencyId={agency.id}
          lead={composerLead}
          type={composerType}
          onSent={() => { fetchLeads(); fetchFollowUpQueue(); }}
        />
      )}
    </div>
  );

  // Free plan: wrap the populated-with-demo-data UI in the LockedFeatureOverlay.
  if (!canUseLeadFinder) {
    return (
      <LockedFeatureOverlay
        title="Lead Generation"
        description="Find local businesses on Google Maps, run outreach sequences with conversion-tested templates, and track your entire pipeline from one dashboard."
        requiredPlan="Pro"
        features={[
          'Google Maps business prospecting',
          '13 email + SMS outreach templates',
          'Visual pipeline with follow-up tracking',
          'CSV import and export',
        ]}
      >
        {pageContent}
      </LockedFeatureOverlay>
    );
  }

  return pageContent;
}