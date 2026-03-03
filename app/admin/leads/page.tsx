'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Loader2, Target, DollarSign, Plus, Trash2,
  FileSpreadsheet, BarChart3, Mail, Phone, Globe, Building2,
  ChevronDown, ChevronRight, X, Check, Copy, ExternalLink, 
  MessageSquare, Send, Clock, AlertTriangle, Flame, Snowflake,
  Calendar, ArrowRight, Eye, Pencil, MoreHorizontal
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
  last_outreach_at: string | null;
  last_outreach_type: string | null;
  created_at: string;
}

interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  totalValue: number;
  recentlyAdded: number;
}

interface PipelineData {
  queue: {
    overdue: Lead[];
    today: Lead[];
    upcoming: Lead[];
    untouched: Lead[];
    cold: Lead[];
  };
  counts: {
    action: number;
    active: number;
    closed: number;
  };
}

type Tab = 'action' | 'active' | 'closed' | 'all';

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatDateShort = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDateShort(date);
}

function daysUntil(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new: { label: 'New', color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.15)' },
  contacted: { label: 'Contacted', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)' },
  qualified: { label: 'Qualified', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
  proposal: { label: 'Proposal', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.15)' },
  won: { label: 'Won', color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.15)' },
  lost: { label: 'Lost', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.15)' },
};

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${small ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]'}`}
      style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ============================================================================
// FOLLOW-UP QUEUE CARD
// ============================================================================

function QueueCard({ 
  lead, 
  accent, 
  badge,
  onEmail, 
  onSms, 
  onSetFollowUp 
}: { 
  lead: Lead; 
  accent: string;
  badge: string;
  onEmail: () => void; 
  onSms: () => void; 
  onSetFollowUp: () => void;
}) {
  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3 group"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Avatar */}
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
        style={{ backgroundColor: `${accent}15` }}
      >
        <span className="text-sm font-semibold" style={{ color: accent }}>
          {(lead.business_name || lead.contact_name || '?').charAt(0)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white/85 truncate">
            {lead.business_name || lead.contact_name || 'Unnamed'}
          </p>
          <StatusBadge status={lead.status} small />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/40 mt-0.5">
          <span>{badge}</span>
          {lead.last_outreach_at && (
            <>
              <span>·</span>
              <span>
                {lead.last_outreach_type === 'email' ? '✉️' : '💬'} {timeAgo(lead.last_outreach_at)}
              </span>
            </>
          )}
          {!lead.last_outreach_at && <span>· No outreach yet</span>}
        </div>
        {lead.website && (
          <a
            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-emerald-400/60 hover:text-emerald-400 mt-0.5 transition-colors"
          >
            <Globe className="h-3 w-3" />
            <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {lead.email && (
          <button
            onClick={(e) => { e.stopPropagation(); onEmail(); }}
            className="p-2 rounded-lg hover:bg-violet-500/10 transition-colors"
            title="Send email"
          >
            <Mail className="h-4 w-4 text-violet-400/70" />
          </button>
        )}
        {lead.phone && (
          <button
            onClick={(e) => { e.stopPropagation(); onSms(); }}
            className="p-2 rounded-lg hover:bg-cyan-500/10 transition-colors"
            title="Send SMS"
          >
            <MessageSquare className="h-4 w-4 text-cyan-400/70" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onSetFollowUp(); }}
          className="p-2 rounded-lg hover:bg-amber-500/10 transition-colors"
          title="Set follow-up"
        >
          <Calendar className="h-4 w-4 text-amber-400/70" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// QUEUE SECTION
// ============================================================================

function QueueSection({ 
  title, 
  icon: Icon, 
  iconColor, 
  leads, 
  badge,
  defaultOpen,
  onEmail,
  onSms,
  onSetFollowUp,
}: { 
  title: string; 
  icon: any; 
  iconColor: string; 
  leads: Lead[]; 
  badge: (lead: Lead) => string;
  defaultOpen?: boolean;
  onEmail: (lead: Lead) => void;
  onSms: (lead: Lead) => void;
  onSetFollowUp: (lead: Lead) => void;
}) {
  const [open, setOpen] = useState(defaultOpen ?? leads.length > 0);

  if (leads.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 mb-2 group"
      >
        <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: iconColor }}>
          {title}
        </span>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${iconColor}20`, color: iconColor }}
        >
          {leads.length}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-white/30 transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && (
        <div className="space-y-1.5">
          {leads.map((lead) => (
            <QueueCard
              key={lead.id}
              lead={lead}
              accent={iconColor}
              badge={badge(lead)}
              onEmail={() => onEmail(lead)}
              onSms={() => onSms(lead)}
              onSetFollowUp={() => onSetFollowUp(lead)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FOLLOW-UP DATE PICKER (inline)
// ============================================================================

function FollowUpPicker({ 
  lead, 
  onSet 
}: { 
  lead: Lead; 
  onSet: (leadId: string, date: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(lead.next_follow_up?.split('T')[0] || '');

  if (!editing) {
    if (lead.next_follow_up) {
      const days = daysUntil(lead.next_follow_up);
      const isOverdue = days < 0;
      return (
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="text-[11px] flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-white/[0.04] transition-colors"
          style={{ color: isOverdue ? '#f87171' : days === 0 ? '#fbbf24' : 'rgba(255,255,255,0.5)' }}
        >
          <Calendar className="h-3 w-3" />
          {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
        </button>
      );
    }
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="text-[11px] text-white/25 hover:text-white/50 rounded-md px-1.5 py-0.5 hover:bg-white/[0.04] transition-colors flex items-center gap-1"
      >
        <Calendar className="h-3 w-3" />
        Set
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="bg-white/[0.04] border border-white/[0.08] rounded-md px-1.5 py-0.5 text-[11px] text-white focus:outline-none focus:border-emerald-500/30 w-[110px]"
        autoFocus
      />
      <button
        onClick={() => { onSet(lead.id, value || null); setEditing(false); }}
        className="p-0.5 rounded hover:bg-emerald-500/10 text-emerald-400"
      >
        <Check className="h-3 w-3" />
      </button>
      <button
        onClick={() => { setEditing(false); if (lead.next_follow_up) { onSet(lead.id, null); } }}
        className="p-0.5 rounded hover:bg-red-500/10 text-white/30"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ============================================================================
// INLINE STATUS DROPDOWN
// ============================================================================

function InlineStatusSelect({ 
  lead, 
  onChange 
}: { 
  lead: Lead; 
  onChange: (leadId: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors hover:brightness-125"
        style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}
      >
        {cfg.label}
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute z-20 mt-1 right-0 rounded-xl shadow-xl py-1 min-w-[120px]"
            style={{ backgroundColor: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <button
                key={key}
                onClick={() => { onChange(lead.id, key); setOpen(false); }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/[0.04] flex items-center gap-2 transition-colors"
                style={{ color: lead.status === key ? val.color : 'rgba(255,255,255,0.6)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: val.color }} />
                {val.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// EXPANDED DETAIL ROW
// ============================================================================

function ExpandedDetail({
  lead,
  onEdit,
  onDelete,
  onEmail,
  onSms,
  copiedId,
  onCopy,
}: {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
  onEmail: () => void;
  onSms: () => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  return (
    <div className="py-5 border-t border-white/[0.03]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
        <div className="space-y-2">
          <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Contact</h4>
          {lead.email && (
            <button
              onClick={() => onCopy(lead.email, `e-${lead.id}`)}
              className="flex items-center gap-2 text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{lead.email}</span>
              {copiedId === `e-${lead.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-white/20" />}
            </button>
          )}
          {lead.phone && (
            <button
              onClick={() => onCopy(lead.phone, `p-${lead.id}`)}
              className="flex items-center gap-2 text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{lead.phone}</span>
              {copiedId === `p-${lead.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-white/20" />}
            </button>
          )}
          {lead.website && (
            <a
              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="space-y-2">
          <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Details</h4>
          <div className="text-xs text-white/50 space-y-1">
            <p>Industry: <span className="text-white/70 capitalize">{lead.industry || '—'}</span></p>
            <p>Source: <span className="text-white/70 capitalize">{(lead.source || '—').replace(/_/g, ' ')}</span></p>
            <p>Value: <span className="text-emerald-400/80">{lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}</span></p>
          </div>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Notes</h4>
          <p className="text-xs text-white/50 whitespace-pre-wrap">{lead.notes || 'No notes yet'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.03]">
        <div className="flex items-center gap-2">
          {lead.email && (
            <button onClick={onEmail} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium bg-violet-500/[0.08] border border-violet-500/[0.12] text-violet-400/80 hover:bg-violet-500/[0.12] transition-colors">
              <Mail className="h-3 w-3" /> Email <Send className="h-2.5 w-2.5" />
            </button>
          )}
          {lead.phone && (
            <button onClick={onSms} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium bg-cyan-500/[0.08] border border-cyan-500/[0.12] text-cyan-400/80 hover:bg-cyan-500/[0.12] transition-colors">
              <MessageSquare className="h-3 w-3" /> SMS <Send className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="text-[11px] text-emerald-400/60 hover:text-emerald-400 transition-colors">Edit</button>
          <button onClick={onDelete} className="text-[11px] text-red-400/40 hover:text-red-400 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AdminLeadsPage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('action');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [queueOpen, setQueueOpen] = useState(true);

  // Composer
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'email' | 'sms'>('email');
  const [composerLead, setComposerLead] = useState<Lead | null>(null);

  const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const getToken = () => localStorage.getItem('admin_token');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchLeads = useCallback(async () => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();
      let url = `${backendUrl}/api/admin/leads?limit=200`;

      // Tab-based status filtering
      if (tab === 'active') {
        url += '&status=contacted&status=qualified&status=proposal';
      } else if (tab === 'closed') {
        url += '&status=won&status=lost';
      } else if (tab === 'action') {
        // Action tab shows all non-closed — we filter visually via the queue
        // but the table below shows everything relevant
      } else if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Leads error:', error);
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter, search]);

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
    } catch (error) { console.error('Stats error:', error); }
  };

  const fetchPipeline = async () => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/leads/pipeline`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPipeline(data);
      }
    } catch (error) { console.error('Pipeline error:', error); }
  };

  useEffect(() => {
    setLoading(true);
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchStats();
    fetchPipeline();
  }, []);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchLeads();
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Delete this lead?')) return;
    setDeletingId(leadId);
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/leads/${leadId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        if (expandedLead === leadId) setExpandedLead(null);
        fetchStats();
        fetchPipeline();
      }
    } catch (error) { console.error('Delete error:', error); }
    finally { setDeletingId(null); }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        fetchStats();
        fetchPipeline();
      }
    } catch (error) { console.error('Status error:', error); }
  };

  const handleSetFollowUp = async (leadId: string, date: string | null) => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();
      await fetch(`${backendUrl}/api/admin/leads/${leadId}/follow-up`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_follow_up: date }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, next_follow_up: date } : l));
      fetchPipeline();
    } catch (error) { console.error('Follow-up error:', error); }
  };

  const openComposer = (lead: Lead, type: 'email' | 'sms') => {
    setComposerLead(lead);
    setComposerType(type);
    setComposerOpen(true);
  };

  const handleOutreachSent = () => {
    fetchLeads();
    fetchStats();
    fetchPipeline();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
        setEditingLead(null);
        fetchStats();
        fetchPipeline();
      }
    } catch (error) { console.error('Save error:', error); }
    finally { setSaving(false); }
  };

  const editInputClass = "w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30 transition-colors";

  // ============================================================================
  // Queue totals
  // ============================================================================
  const queueTotal = pipeline
    ? (pipeline.queue.overdue.length + pipeline.queue.today.length + pipeline.queue.untouched.length + pipeline.queue.cold.length)
    : 0;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">Sales Pipeline</h1>
          <p className="mt-1 text-sm text-white/40">Prospective agencies to reach out to</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCSVImport(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/[0.06] hover:text-white transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* ============================================================================ */}
      {/* FOLLOW-UP QUEUE */}
      {/* ============================================================================ */}
      {queueTotal > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setQueueOpen(!queueOpen)}
            className="flex items-center gap-2 mb-3"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10">
              <Flame className="h-3 w-3 text-amber-400" />
            </div>
            <span className="text-sm font-semibold text-white/80">Action Required</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
              {queueTotal}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-white/30 transition-transform ${queueOpen ? '' : '-rotate-90'}`} />
          </button>

          {queueOpen && pipeline && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] p-4">
              <QueueSection
                title="Overdue"
                icon={AlertTriangle}
                iconColor="#f87171"
                leads={pipeline.queue.overdue}
                badge={(l) => {
                  const days = Math.abs(daysUntil(l.next_follow_up!));
                  return `${days}d overdue`;
                }}
                defaultOpen
                onEmail={(l) => openComposer(l, 'email')}
                onSms={(l) => openComposer(l, 'sms')}
                onSetFollowUp={(l) => handleSetFollowUp(l.id, null)}
              />
              <QueueSection
                title="Due Today"
                icon={Clock}
                iconColor="#fbbf24"
                leads={pipeline.queue.today}
                badge={() => 'Follow up today'}
                defaultOpen
                onEmail={(l) => openComposer(l, 'email')}
                onSms={(l) => openComposer(l, 'sms')}
                onSetFollowUp={(l) => handleSetFollowUp(l.id, null)}
              />
              <QueueSection
                title="Never Contacted"
                icon={Target}
                iconColor="#22d3ee"
                leads={pipeline.queue.untouched}
                badge={(l) => `Added ${timeAgo(l.created_at)}`}
                defaultOpen
                onEmail={(l) => openComposer(l, 'email')}
                onSms={(l) => openComposer(l, 'sms')}
                onSetFollowUp={(l) => handleSetFollowUp(l.id, null)}
              />
              <QueueSection
                title="Gone Cold"
                icon={Snowflake}
                iconColor="#94a3b8"
                leads={pipeline.queue.cold}
                badge={(l) => l.last_outreach_at ? `Last contact ${timeAgo(l.last_outreach_at)}` : 'No contact'}
                onEmail={(l) => openComposer(l, 'email')}
                onSms={(l) => openComposer(l, 'sms')}
                onSetFollowUp={(l) => handleSetFollowUp(l.id, null)}
              />
              {pipeline.queue.upcoming.length > 0 && (
                <QueueSection
                  title="Upcoming (7 days)"
                  icon={Calendar}
                  iconColor="#60a5fa"
                  leads={pipeline.queue.upcoming}
                  badge={(l) => `In ${daysUntil(l.next_follow_up!)}d`}
                  onEmail={(l) => openComposer(l, 'email')}
                  onSms={(l) => openComposer(l, 'sms')}
                  onSetFollowUp={(l) => handleSetFollowUp(l.id, null)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================================ */}
      {/* STATS BAR */}
      {/* ============================================================================ */}
      {stats && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 mb-6">
          {[
            { label: 'Total Leads', value: stats.total, icon: Target, color: '#22d3ee' },
            { label: 'Pipeline Value', value: formatCurrency(stats.totalValue || 0), icon: DollarSign, color: '#34d399' },
            { label: 'Active', value: stats.total - (stats.byStatus?.won || 0) - (stats.byStatus?.lost || 0), icon: BarChart3, color: '#a78bfa' },
            { label: 'Won', value: stats.byStatus?.won || 0, icon: Check, color: '#34d399' },
            { label: 'This Week', value: stats.recentlyAdded || 0, icon: Plus, color: '#fbbf24' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.1em]">{item.label}</p>
                  <p className="mt-1.5 text-xl font-semibold" style={{ color: typeof item.value === 'string' ? item.color : 'rgba(255,255,255,0.9)' }}>
                    {item.value}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${item.color}12` }}>
                  <item.icon className="h-4 w-4" style={{ color: item.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================================ */}
      {/* TABS + FILTERS */}
      {/* ============================================================================ */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-white/[0.02] border border-white/[0.06] p-1">
          {([
            { key: 'all', label: 'All' },
            { key: 'action', label: 'Action Needed', count: pipeline?.counts.action },
            { key: 'active', label: 'Active', count: pipeline?.counts.active },
            { key: 'closed', label: 'Closed', count: pipeline?.counts.closed },
          ] as { key: Tab; label: string; count?: number }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setStatusFilter(''); setLoading(true); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.key ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={`text-[9px] px-1 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-white/30'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30 transition-colors"
            />
          </div>
        </form>

        {/* Status filter (only on All tab) */}
        {tab === 'all' && (
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }}
            className="appearance-none rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-white focus:outline-none"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* ============================================================================ */}
      {/* TABLE */}
      {/* ============================================================================ */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 blur-2xl bg-emerald-500/10 rounded-full" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <Target className="h-7 w-7 text-white/20" />
              </div>
            </div>
            <p className="text-sm text-white/50">No leads found</p>
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setTab('all'); setLoading(true); }}
              className="mt-3 text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-6 py-3.5">Business</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Contact</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Status</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Last Activity</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Follow-Up</th>
                  <th className="text-right text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Value</th>
                  <th className="text-right text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {leads.map((lead) => (
                  <>
                    <tr
                      key={lead.id}
                      className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${expandedLead === lead.id ? 'bg-white/[0.02]' : ''}`}
                      onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    >
                      {/* Business */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/[0.08] shrink-0">
                            <span className="text-xs font-semibold text-cyan-400/80">
                              {(lead.business_name || '?').charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-white/85 truncate">{lead.business_name || 'Unnamed'}</p>
                            {lead.industry && (
                              <p className="text-[11px] text-white/30 truncate capitalize">{lead.industry}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="text-xs text-white/60 truncate">{lead.contact_name || '—'}</p>
                          {lead.email && <p className="text-[11px] text-white/30 truncate">{lead.email}</p>}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <InlineStatusSelect lead={lead} onChange={handleStatusChange} />
                      </td>

                      {/* Last Activity */}
                      <td className="px-4 py-3.5">
                        {lead.last_outreach_at ? (
                          <div className="flex items-center gap-1.5 text-xs text-white/50">
                            {lead.last_outreach_type === 'email' ? (
                              <Mail className="h-3 w-3 text-violet-400/50" />
                            ) : (
                              <MessageSquare className="h-3 w-3 text-cyan-400/50" />
                            )}
                            <span>{timeAgo(lead.last_outreach_at)}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-red-400/50">No outreach</span>
                        )}
                      </td>

                      {/* Follow-up */}
                      <td className="px-4 py-3.5">
                        <FollowUpPicker lead={lead} onSet={handleSetFollowUp} />
                      </td>

                      {/* Value */}
                      <td className="px-4 py-3.5 text-right text-xs text-white/60 tabular-nums">
                        {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          {lead.email && (
                            <button
                              onClick={() => openComposer(lead, 'email')}
                              className="p-1.5 rounded-lg hover:bg-violet-500/10 transition-colors"
                              title="Send email"
                            >
                              <Mail className="h-3.5 w-3.5 text-violet-400/50 hover:text-violet-400" />
                            </button>
                          )}
                          {lead.phone && (
                            <button
                              onClick={() => openComposer(lead, 'sms')}
                              className="p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
                              title="Send SMS"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-cyan-400/50 hover:text-cyan-400" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(lead.id)}
                            disabled={deletingId === lead.id}
                            className="p-1.5 rounded-lg hover:bg-red-500/[0.06] transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === lead.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-white/25" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-white/20 hover:text-red-400/80" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded */}
                    {expandedLead === lead.id && (
                      <tr key={`${lead.id}-detail`}>
                        <td colSpan={7} className="px-6 py-0">
                          {editingLead === lead.id ? (
                            <div className="py-5 border-t border-white/[0.03] space-y-4">
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                  { key: 'business_name', label: 'Business Name', type: 'text' },
                                  { key: 'contact_name', label: 'Contact Name', type: 'text' },
                                  { key: 'email', label: 'Email', type: 'email' },
                                  { key: 'phone', label: 'Phone', type: 'text' },
                                  { key: 'website', label: 'Website', type: 'text' },
                                  { key: 'industry', label: 'Industry', type: 'text' },
                                  { key: 'estimated_value', label: 'Value (cents)', type: 'number' },
                                  { key: 'next_follow_up', label: 'Follow-up Date', type: 'date' },
                                ].map((f) => (
                                  <div key={f.key}>
                                    <label className="block text-[10px] text-white/40 uppercase tracking-[0.1em] mb-1.5">{f.label}</label>
                                    <input
                                      type={f.type}
                                      value={(editForm as any)[f.key] || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                                      className={editInputClass}
                                    />
                                  </div>
                                ))}
                                <div>
                                  <label className="block text-[10px] text-white/40 uppercase tracking-[0.1em] mb-1.5">Source</label>
                                  <select
                                    value={editForm.source || ''}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, source: e.target.value }))}
                                    className={editInputClass}
                                  >
                                    <option value="">Select...</option>
                                    {['cold_outreach', 'csv_import', 'apollo', 'linkedin', 'google_maps', 'referral', 'social_media', 'website', 'event', 'other'].map(s => (
                                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] text-white/40 uppercase tracking-[0.1em] mb-1.5">Notes</label>
                                <textarea value={editForm.notes || ''} onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} className={`${editInputClass} resize-none`} />
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleSave(lead.id)} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#050505] hover:bg-emerald-400 disabled:opacity-40 transition-all">
                                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
                                </button>
                                <button onClick={() => setEditingLead(null)} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2 text-sm text-white/50 hover:text-white/70 transition-colors">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <ExpandedDetail
                              lead={lead}
                              onEdit={() => startEdit(lead)}
                              onDelete={() => handleDelete(lead.id)}
                              onEmail={() => openComposer(lead, 'email')}
                              onSms={() => openComposer(lead, 'sms')}
                              copiedId={copiedId}
                              onCopy={copyToClipboard}
                            />
                          )}
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

      {!loading && leads.length > 0 && (
        <p className="mt-4 text-xs text-white/30">Showing {leads.length} lead{leads.length !== 1 ? 's' : ''}</p>
      )}

      {/* Modals */}
      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        agencyId="platform"
        onImportComplete={() => { fetchLeads(); fetchStats(); fetchPipeline(); }}
        apiBase="/api/admin"
      />

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