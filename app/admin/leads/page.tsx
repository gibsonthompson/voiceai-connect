'use client';

// ============================================================================
// LEADS / SALES PIPELINE (reskinned, emerald on white)
// The full CRM: pipeline queue, stats, tabs, search, inline status + follow-up
// editing, and expand-to-edit. All fetch and handler logic is unchanged. The
// only functional change is passing a light theme into CSVImportModal (which
// already accepts one) so the import dialog matches. ComposerModal is themed
// separately in its own file.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, Target, DollarSign, Plus, Trash2,
  FileSpreadsheet, BarChart3, Mail, Phone, Globe,
  ChevronDown, X, Check, Copy, ExternalLink,
  MessageSquare, Send, Clock, AlertTriangle, Flame, Snowflake,
  Calendar, Linkedin,
} from 'lucide-react';
import CSVImportModal from '@/components/CSVImportModal';
import ComposerModal from '@/components/ComposerModal';

// Light theme handed to CSVImportModal so the import dialog renders emerald on
// white. CSVImportModal defaults to a dark theme when none is passed, so this
// leaves agency-side usage untouched.
const ADMIN_LIGHT_THEME = {
  bg: '#FFFFFF', text: '#0C2018', textMuted: '#5A6E62',
  border: '#E3EFE8', hover: '#F6FCF9', card: '#FFFFFF',
  input: '#FFFFFF', inputBorder: '#D2E4DA',
  primary: '#10b981', primary15: '#E7F8F0', primary30: '#BEEAD6', primaryText: '#04140D',
  error: '#D33A3F', errorBg: '#FBE3E3', errorBorder: '#F3C9C9',
  warning: '#B8790A', warningBg: '#FBF0D6', warningBorder: '#F0DCA8',
  info: '#0E9BB5', infoBg: '#DBF1F6', infoBorder: '#BFE7F0',
  isDark: false,
};

interface Lead {
  id: string; business_name: string; contact_name: string; email: string; phone: string;
  website: string; linkedin_url: string | null; industry: string; source: string; status: string;
  estimated_value: number; notes: string; next_follow_up: string | null; last_outreach_at: string | null;
  last_outreach_type: string | null; created_at: string;
}
interface LeadStats { total: number; byStatus: Record<string, number>; totalValue: number; recentlyAdded: number; }
interface PipelineData {
  queue: { overdue: Lead[]; today: Lead[]; upcoming: Lead[]; untouched: Lead[]; cold: Lead[] };
  counts: { action: number; active: number; closed: number };
}
type Tab = 'action' | 'active' | 'closed' | 'all';

const formatCurrency = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
const formatDateShort = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function timeAgo(date: string): string {
  const diffMs = Date.now() - new Date(date).getTime();
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
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}
function formatLinkedinSlug(url: string): string {
  try { return url.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '').replace(/\/$/, ''); } catch { return url; }
}

// white-friendly status palette
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new: { label: 'New', color: '#0E9BB5', bg: '#DBF1F6', border: '#BFE7F0' },
  contacted: { label: 'Contacted', color: '#B8790A', bg: '#FBF0D6', border: '#F0DCA8' },
  qualified: { label: 'Qualified', color: '#7C4DEF', bg: '#EEE7FB', border: '#DBCCF6' },
  proposal: { label: 'Proposal', color: '#2563EB', bg: '#E7EEFC', border: '#CFE0FA' },
  won: { label: 'Won', color: '#0B9668', bg: '#E7F8F0', border: '#BEEAD6' },
  lost: { label: 'Lost', color: '#D33A3F', bg: '#FBE3E3', border: '#F3C9C9' },
};

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return <span className={`inline-flex items-center rounded-md border font-medium ${small ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]'}`} style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}>{cfg.label}</span>;
}

function QueueCard({ lead, accent, badge, onEmail, onSms, onLinkedin, onSetFollowUp }: { lead: Lead; accent: string; badge: string; onEmail: () => void; onSms: () => void; onLinkedin: () => void; onSetFollowUp: () => void; }) {
  return (
    <div className="rounded-xl p-3 flex items-center gap-3 group bg-white border border-[var(--a-line)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${accent}18` }}>
        <span className="text-sm font-semibold" style={{ color: accent }}>{(lead.business_name || lead.contact_name || '?').charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--a-ink)] truncate">{lead.business_name || lead.contact_name || 'Unnamed'}</p>
          <StatusBadge status={lead.status} small />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--a-dim)] mt-0.5">
          <span>{badge}</span>
          {lead.last_outreach_at && (<><span>&middot;</span><span>{lead.last_outreach_type === 'email' ? 'Email' : lead.last_outreach_type === 'linkedin' ? 'LinkedIn' : 'SMS'} {timeAgo(lead.last_outreach_at)}</span></>)}
          {!lead.last_outreach_at && <span>&middot; No outreach yet</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {lead.website && (<a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[11px] text-[var(--a-em-deep)] hover:underline"><Globe className="h-3 w-3" /><span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span><ExternalLink className="h-2.5 w-2.5" /></a>)}
          {lead.linkedin_url && (<button onClick={(e) => { e.stopPropagation(); onLinkedin(); }} className="inline-flex items-center gap-1 text-[11px] hover:underline" style={{ color: '#2563EB' }}><Linkedin className="h-3 w-3" /><span className="truncate">{formatLinkedinSlug(lead.linkedin_url)}</span></button>)}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {lead.linkedin_url && (<button onClick={(e) => { e.stopPropagation(); onLinkedin(); }} className="p-2 rounded-lg hover:bg-[#E7EEFC] transition-colors" title="LinkedIn outreach"><Linkedin className="h-4 w-4" style={{ color: '#2563EB' }} /></button>)}
        {lead.email && (<button onClick={(e) => { e.stopPropagation(); onEmail(); }} className="p-2 rounded-lg hover:bg-[var(--a-violet-soft)] transition-colors" title="Send email"><Mail className="h-4 w-4" style={{ color: 'var(--a-violet)' }} /></button>)}
        {lead.phone && (<button onClick={(e) => { e.stopPropagation(); onSms(); }} className="p-2 rounded-lg hover:bg-[var(--a-cyan-soft)] transition-colors" title="Send SMS"><MessageSquare className="h-4 w-4" style={{ color: 'var(--a-cyan)' }} /></button>)}
        <button onClick={(e) => { e.stopPropagation(); onSetFollowUp(); }} className="p-2 rounded-lg hover:bg-[var(--a-amber-soft)] transition-colors" title="Set follow-up"><Calendar className="h-4 w-4" style={{ color: 'var(--a-amber)' }} /></button>
      </div>
    </div>
  );
}

function QueueSection({ title, icon: Icon, iconColor, leads, badge, defaultOpen, onEmail, onSms, onLinkedin, onSetFollowUp }: { title: string; icon: any; iconColor: string; leads: Lead[]; badge: (lead: Lead) => string; defaultOpen?: boolean; onEmail: (lead: Lead) => void; onSms: (lead: Lead) => void; onLinkedin: (lead: Lead) => void; onSetFollowUp: (lead: Lead) => void; }) {
  const [open, setOpen] = useState(defaultOpen ?? leads.length > 0);
  if (leads.length === 0) return null;
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 mb-2 group">
        <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: iconColor }}>{title}</span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${iconColor}1F`, color: iconColor }}>{leads.length}</span>
        <ChevronDown className={`h-3 w-3 text-[var(--a-dim)] transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (<div className="space-y-1.5">{leads.map((lead) => (<QueueCard key={lead.id} lead={lead} accent={iconColor} badge={badge(lead)} onEmail={() => onEmail(lead)} onSms={() => onSms(lead)} onLinkedin={() => onLinkedin(lead)} onSetFollowUp={() => onSetFollowUp(lead)} />))}</div>)}
    </div>
  );
}

function FollowUpPicker({ lead, onSet }: { lead: Lead; onSet: (leadId: string, date: string | null) => void; }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(lead.next_follow_up?.split('T')[0] || '');
  if (!editing) {
    if (lead.next_follow_up) {
      const days = daysUntil(lead.next_follow_up);
      const isOverdue = days < 0;
      return (<button onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="text-[11px] flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-[#F6FCF9] transition-colors" style={{ color: isOverdue ? '#D33A3F' : days === 0 ? '#B8790A' : 'var(--a-muted)' }}><Calendar className="h-3 w-3" />{isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}</button>);
    }
    return (<button onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="text-[11px] text-[var(--a-dim)] hover:text-[var(--a-muted)] rounded-md px-1.5 py-0.5 hover:bg-[#F6FCF9] transition-colors flex items-center gap-1"><Calendar className="h-3 w-3" />Set</button>);
  }
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input type="date" value={value} onChange={(e) => setValue(e.target.value)} className="bg-white border border-[var(--a-line-2)] rounded-md px-1.5 py-0.5 text-[11px] text-[var(--a-ink)] focus:outline-none focus:border-[var(--a-em-line)] w-[130px]" autoFocus />
      <button onClick={() => { onSet(lead.id, value || null); setEditing(false); }} className="p-0.5 rounded hover:bg-[var(--a-em-soft)]" style={{ color: 'var(--a-em-deep)' }}><Check className="h-3 w-3" /></button>
      <button onClick={() => { setEditing(false); if (lead.next_follow_up) { onSet(lead.id, null); } }} className="p-0.5 rounded hover:bg-[var(--a-red-soft)] text-[var(--a-dim)]"><X className="h-3 w-3" /></button>
    </div>
  );
}

function InlineStatusSelect({ lead, onChange }: { lead: Lead; onChange: (leadId: string, status: string) => void; }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors hover:brightness-95" style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}>{cfg.label}<ChevronDown className="h-2.5 w-2.5" /></button>
      {open && (<><div className="fixed inset-0 z-10" onClick={() => setOpen(false)} /><div className="absolute z-20 mt-1 right-0 rounded-xl shadow-xl py-1 min-w-[120px] bg-white border border-[var(--a-line-2)]">{Object.entries(STATUS_CONFIG).map(([key, val]) => (<button key={key} onClick={() => { onChange(lead.id, key); setOpen(false); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#F6FCF9] flex items-center gap-2 transition-colors" style={{ color: lead.status === key ? val.color : 'var(--a-muted)' }}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: val.color }} />{val.label}</button>))}</div></>)}
    </div>
  );
}

function ExpandedDetail({ lead, onEdit, onDelete, onEmail, onSms, onLinkedin, copiedId, onCopy }: { lead: Lead; onEdit: () => void; onDelete: () => void; onEmail: () => void; onSms: () => void; onLinkedin: () => void; copiedId: string | null; onCopy: (text: string, id: string) => void; }) {
  return (
    <div className="py-5 border-t border-[var(--a-line)]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
        <div className="space-y-2">
          <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em]">Contact</h4>
          {lead.email && (<button onClick={() => onCopy(lead.email, `e-${lead.id}`)} className="flex items-center gap-2 text-xs text-[var(--a-muted)] hover:text-[var(--a-ink)] transition-colors"><Mail className="h-3.5 w-3.5" /><span className="truncate">{lead.email}</span>{copiedId === `e-${lead.id}` ? <Check className="h-3 w-3" style={{ color: 'var(--a-em-deep)' }} /> : <Copy className="h-3 w-3 text-[var(--a-dim)]" />}</button>)}
          {lead.phone && (<button onClick={() => onCopy(lead.phone, `p-${lead.id}`)} className="flex items-center gap-2 text-xs text-[var(--a-muted)] hover:text-[var(--a-ink)] transition-colors"><Phone className="h-3.5 w-3.5" /><span>{lead.phone}</span>{copiedId === `p-${lead.id}` ? <Check className="h-3 w-3" style={{ color: 'var(--a-em-deep)' }} /> : <Copy className="h-3 w-3 text-[var(--a-dim)]" />}</button>)}
          {lead.website && (<a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-[var(--a-em-deep)] hover:underline"><Globe className="h-3.5 w-3.5" /><span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span><ExternalLink className="h-3 w-3" /></a>)}
          {lead.linkedin_url && (<button onClick={onLinkedin} className="flex items-center gap-2 text-xs hover:underline" style={{ color: '#2563EB' }}><Linkedin className="h-3.5 w-3.5" /><span className="truncate">{formatLinkedinSlug(lead.linkedin_url)}</span></button>)}
        </div>
        <div className="space-y-2">
          <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em]">Details</h4>
          <div className="text-xs text-[var(--a-muted)] space-y-1">
            <p>Industry: <span className="text-[var(--a-ink)] capitalize">{lead.industry || '\u2013'}</span></p>
            <p>Source: <span className="text-[var(--a-ink)] capitalize">{(lead.source || '\u2013').replace(/_/g, ' ')}</span></p>
            <p>Value: <span style={{ color: 'var(--a-em-deep)' }}>{lead.estimated_value ? formatCurrency(lead.estimated_value) : '\u2013'}</span></p>
          </div>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em]">Notes</h4>
          <p className="text-xs text-[var(--a-muted)] whitespace-pre-wrap">{lead.notes || 'No notes yet'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[var(--a-line)]">
        <div className="flex items-center gap-2">
          {lead.linkedin_url && (<button onClick={onLinkedin} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium border transition-colors" style={{ background: '#E7EEFC', borderColor: '#CFE0FA', color: '#2563EB' }}><Linkedin className="h-3 w-3" /> LinkedIn <Send className="h-2.5 w-2.5" /></button>)}
          {lead.email && (<button onClick={onEmail} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium border transition-colors" style={{ background: 'var(--a-violet-soft)', borderColor: '#DBCCF6', color: 'var(--a-violet)' }}><Mail className="h-3 w-3" /> Email <Send className="h-2.5 w-2.5" /></button>)}
          {lead.phone && (<button onClick={onSms} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium border transition-colors" style={{ background: 'var(--a-cyan-soft)', borderColor: '#BFE7F0', color: 'var(--a-cyan)' }}><MessageSquare className="h-3 w-3" /> SMS <Send className="h-2.5 w-2.5" /></button>)}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="text-[11px] text-[var(--a-em-deep)] hover:underline transition-colors">Edit</button>
          <button onClick={onDelete} className="text-[11px] hover:underline transition-colors" style={{ color: 'var(--a-red)' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

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
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'email' | 'sms' | 'linkedin'>('email');
  const [composerLead, setComposerLead] = useState<Lead | null>(null);

  const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const getToken = () => localStorage.getItem('admin_token');

  const fetchLeads = useCallback(async () => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();
      let url = `${backendUrl}/api/admin/leads?limit=200`;
      if (tab === 'active') url += '&status=contacted&status=qualified&status=proposal';
      else if (tab === 'closed') url += '&status=won&status=lost';
      else if (tab === 'action') { /* shows all non-closed */ }
      else if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) { console.error('Leads error:', error); }
    finally { setLoading(false); }
  }, [tab, statusFilter, search]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/leads-stats`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (response.ok) { const data = await response.json(); setStats(data.stats || null); }
    } catch (error) { console.error('Stats error:', error); }
  };

  const fetchPipeline = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/leads/pipeline`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (response.ok) { const data = await response.json(); setPipeline(data); }
    } catch (error) { console.error('Pipeline error:', error); }
  };

  useEffect(() => { setLoading(true); fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchStats(); fetchPipeline(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setLoading(true); fetchLeads(); };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Delete this lead?')) return;
    setDeletingId(leadId);
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/leads/${leadId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (response.ok) { setLeads(prev => prev.filter(l => l.id !== leadId)); if (expandedLead === leadId) setExpandedLead(null); fetchStats(); fetchPipeline(); }
    } catch (error) { console.error('Delete error:', error); }
    finally { setDeletingId(null); }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/leads/${leadId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      if (response.ok) { setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l)); fetchStats(); fetchPipeline(); }
    } catch (error) { console.error('Status error:', error); }
  };

  const handleSetFollowUp = async (leadId: string, date: string | null) => {
    try {
      await fetch(`${getBackendUrl()}/api/admin/leads/${leadId}/follow-up`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ next_follow_up: date }) });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, next_follow_up: date } : l));
      fetchPipeline();
    } catch (error) { console.error('Follow-up error:', error); }
  };

  const openComposer = (lead: Lead, type: 'email' | 'sms' | 'linkedin') => { setComposerLead(lead); setComposerType(type); setComposerOpen(true); };
  const handleOutreachSent = () => { fetchLeads(); fetchStats(); fetchPipeline(); };
  const copyToClipboard = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  const startEdit = (lead: Lead) => {
    setEditingLead(lead.id);
    setEditForm({ business_name: lead.business_name || '', contact_name: lead.contact_name || '', email: lead.email || '', phone: lead.phone || '', website: lead.website || '', linkedin_url: lead.linkedin_url || '', industry: lead.industry || '', source: lead.source || '', notes: lead.notes || '', estimated_value: lead.estimated_value || 0, next_follow_up: lead.next_follow_up ? lead.next_follow_up.split('T')[0] : '' });
  };

  const handleSave = async (leadId: string) => {
    setSaving(true);
    try {
      const payload = { ...editForm, estimated_value: editForm.estimated_value ? Math.round(Number(editForm.estimated_value)) : null, next_follow_up: editForm.next_follow_up || null, linkedin_url: editForm.linkedin_url || null };
      const response = await fetch(`${getBackendUrl()}/api/admin/leads/${leadId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (response.ok) { const data = await response.json(); setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l)); setEditingLead(null); fetchStats(); fetchPipeline(); }
    } catch (error) { console.error('Save error:', error); }
    finally { setSaving(false); }
  };

  const editInputClass = "w-full rounded-xl bg-white border border-[var(--a-line-2)] px-3 py-2 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)] transition-colors";
  const queueTotal = pipeline ? (pipeline.queue.overdue.length + pipeline.queue.today.length + pipeline.queue.untouched.length + pipeline.queue.cold.length) : 0;

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--a-ink)] tracking-tight">Sales Pipeline</h1>
          <p className="mt-1 text-sm text-[var(--a-dim)]">Prospective agencies to reach out to</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCSVImport(true)} className="a-btn-ghost"><FileSpreadsheet className="h-4 w-4" />Import CSV</button>
        </div>
      </div>

      {queueTotal > 0 && (
        <div className="mb-6">
          <button onClick={() => setQueueOpen(!queueOpen)} className="flex items-center gap-2 mb-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: 'var(--a-amber-soft)' }}><Flame className="h-3 w-3" style={{ color: 'var(--a-amber)' }} /></div>
            <span className="text-sm font-semibold text-[var(--a-ink)]">Action Required</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border" style={{ background: 'var(--a-amber-soft)', color: 'var(--a-amber)', borderColor: '#F0DCA8' }}>{queueTotal}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-[var(--a-dim)] transition-transform ${queueOpen ? '' : '-rotate-90'}`} />
          </button>
          {queueOpen && pipeline && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-2xl bg-white border border-[var(--a-line)] p-4">
              <QueueSection title="Overdue" icon={AlertTriangle} iconColor="#D33A3F" leads={pipeline.queue.overdue} badge={(l) => `${Math.abs(daysUntil(l.next_follow_up!))}d overdue`} defaultOpen onEmail={(l) => openComposer(l, 'email')} onSms={(l) => openComposer(l, 'sms')} onLinkedin={(l) => openComposer(l, 'linkedin')} onSetFollowUp={(l) => handleSetFollowUp(l.id, null)} />
              <QueueSection title="Due Today" icon={Clock} iconColor="#B8790A" leads={pipeline.queue.today} badge={() => 'Follow up today'} defaultOpen onEmail={(l) => openComposer(l, 'email')} onSms={(l) => openComposer(l, 'sms')} onLinkedin={(l) => openComposer(l, 'linkedin')} onSetFollowUp={(l) => handleSetFollowUp(l.id, null)} />
              <QueueSection title="Never Contacted" icon={Target} iconColor="#0E9BB5" leads={pipeline.queue.untouched} badge={(l) => `Added ${timeAgo(l.created_at)}`} defaultOpen onEmail={(l) => openComposer(l, 'email')} onSms={(l) => openComposer(l, 'sms')} onLinkedin={(l) => openComposer(l, 'linkedin')} onSetFollowUp={(l) => handleSetFollowUp(l.id, null)} />
              <QueueSection title="Gone Cold" icon={Snowflake} iconColor="#5A6E62" leads={pipeline.queue.cold} badge={(l) => l.last_outreach_at ? `Last contact ${timeAgo(l.last_outreach_at)}` : 'No contact'} onEmail={(l) => openComposer(l, 'email')} onSms={(l) => openComposer(l, 'sms')} onLinkedin={(l) => openComposer(l, 'linkedin')} onSetFollowUp={(l) => handleSetFollowUp(l.id, null)} />
              {pipeline.queue.upcoming.length > 0 && (<QueueSection title="Upcoming (7 days)" icon={Calendar} iconColor="#2563EB" leads={pipeline.queue.upcoming} badge={(l) => `In ${daysUntil(l.next_follow_up!)}d`} onEmail={(l) => openComposer(l, 'email')} onSms={(l) => openComposer(l, 'sms')} onLinkedin={(l) => openComposer(l, 'linkedin')} onSetFollowUp={(l) => handleSetFollowUp(l.id, null)} />)}
            </div>
          )}
        </div>
      )}

      {stats && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 mb-6">
          {[
            { label: 'Total Leads', value: stats.total, icon: Target, color: '#0E9BB5' },
            { label: 'Pipeline Value', value: formatCurrency(stats.totalValue || 0), icon: DollarSign, color: '#0B9668' },
            { label: 'Active', value: stats.total - (stats.byStatus?.won || 0) - (stats.byStatus?.lost || 0), icon: BarChart3, color: '#7C4DEF' },
            { label: 'Won', value: stats.byStatus?.won || 0, icon: Check, color: '#0B9668' },
            { label: 'This Week', value: stats.recentlyAdded || 0, icon: Plus, color: '#B8790A' },
          ].map((item) => (
            <div key={item.label} className="a-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-[var(--a-dim)] uppercase tracking-[0.1em]">{item.label}</p>
                  <p className="mt-1.5 text-xl font-semibold a-num" style={{ color: typeof item.value === 'string' ? item.color : 'var(--a-ink)' }}>{item.value}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${item.color}18` }}><item.icon className="h-4 w-4" style={{ color: item.color }} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-1 rounded-xl bg-white border border-[var(--a-line)] p-1">
          {([{ key: 'all', label: 'All' }, { key: 'action', label: 'Action Needed', count: pipeline?.counts.action }, { key: 'active', label: 'Active', count: pipeline?.counts.active }, { key: 'closed', label: 'Closed', count: pipeline?.counts.closed }] as { key: Tab; label: string; count?: number }[]).map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setStatusFilter(''); setLoading(true); }} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${tab === t.key ? 'bg-[var(--a-em-soft)] text-[var(--a-em-deep)]' : 'text-[var(--a-dim)] hover:text-[var(--a-muted)]'}`}>
              {t.label}
              {t.count != null && t.count > 0 && (<span className={`text-[9px] px-1 py-0.5 rounded-full ${tab === t.key ? 'bg-[var(--a-em-line)] text-[var(--a-em-deep)]' : 'bg-[#EEF3EF] text-[var(--a-dim)]'}`}>{t.count}</span>)}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
            <input type="text" placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="a-input pl-10" />
          </div>
        </form>
        {tab === 'all' && (
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }} className="a-input sm:w-auto appearance-none">
            <option value="">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
          </select>
        )}
      </div>

      <div className="a-panel">
        {loading ? (
          <div className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto mb-4" style={{ background: 'var(--a-em-soft)' }}><Target className="h-7 w-7 text-[var(--a-em-deep)]" /></div>
            <p className="text-sm text-[var(--a-muted)]">No leads found</p>
            <button onClick={() => { setSearch(''); setStatusFilter(''); setTab('all'); setLoading(true); }} className="mt-3 text-xs text-[var(--a-em-deep)] hover:underline transition-colors">Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Business</th><th>Contact</th><th>Status</th><th>Last Activity</th><th>Follow-Up</th><th className="r">Value</th><th className="r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <>
                    <tr key={lead.id} className={`cursor-pointer ${expandedLead === lead.id ? 'bg-[#F6FCF9]' : ''}`} onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: 'var(--a-cyan-soft)' }}><span className="text-xs font-semibold" style={{ color: 'var(--a-cyan)' }}>{(lead.business_name || '?').charAt(0)}</span></div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-semibold text-[var(--a-ink)] truncate">{lead.business_name || 'Unnamed'}</p>
                              {lead.linkedin_url && (<button onClick={(e) => { e.stopPropagation(); openComposer(lead, 'linkedin'); }} className="shrink-0 hover:opacity-70 transition-opacity" style={{ color: '#2563EB' }} title="LinkedIn outreach"><Linkedin className="h-3.5 w-3.5" /></button>)}
                            </div>
                            {lead.industry && (<p className="text-[11px] text-[var(--a-dim)] truncate capitalize">{lead.industry}</p>)}
                          </div>
                        </div>
                      </td>
                      <td><div className="min-w-0"><p className="text-xs text-[var(--a-muted)] truncate">{lead.contact_name || '\u2013'}</p>{lead.email && <p className="text-[11px] text-[var(--a-dim)] truncate">{lead.email}</p>}</div></td>
                      <td onClick={(e) => e.stopPropagation()}><InlineStatusSelect lead={lead} onChange={handleStatusChange} /></td>
                      <td>
                        {lead.last_outreach_at ? (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--a-muted)]">
                            {lead.last_outreach_type === 'email' ? (<Mail className="h-3 w-3" style={{ color: 'var(--a-violet)' }} />) : lead.last_outreach_type === 'linkedin' ? (<Linkedin className="h-3 w-3" style={{ color: '#2563EB' }} />) : (<MessageSquare className="h-3 w-3" style={{ color: 'var(--a-cyan)' }} />)}
                            <span>{timeAgo(lead.last_outreach_at)}</span>
                          </div>
                        ) : (<span className="text-[11px]" style={{ color: 'var(--a-red)' }}>No outreach</span>)}
                      </td>
                      <td><FollowUpPicker lead={lead} onSet={handleSetFollowUp} /></td>
                      <td className="r a-num">{lead.estimated_value ? formatCurrency(lead.estimated_value) : '\u2013'}</td>
                      <td className="r" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          {lead.linkedin_url && (<button onClick={() => openComposer(lead, 'linkedin')} className="p-1.5 rounded-lg hover:bg-[#E7EEFC] transition-colors" title="LinkedIn outreach"><Linkedin className="h-3.5 w-3.5" style={{ color: '#2563EB' }} /></button>)}
                          {lead.email && (<button onClick={() => openComposer(lead, 'email')} className="p-1.5 rounded-lg hover:bg-[var(--a-violet-soft)] transition-colors" title="Send email"><Mail className="h-3.5 w-3.5" style={{ color: 'var(--a-violet)' }} /></button>)}
                          {lead.phone && (<button onClick={() => openComposer(lead, 'sms')} className="p-1.5 rounded-lg hover:bg-[var(--a-cyan-soft)] transition-colors" title="Send SMS"><MessageSquare className="h-3.5 w-3.5" style={{ color: 'var(--a-cyan)' }} /></button>)}
                          <button onClick={() => handleDelete(lead.id)} disabled={deletingId === lead.id} className="p-1.5 rounded-lg hover:bg-[var(--a-red-soft)] transition-colors disabled:opacity-50" title="Delete">
                            {deletingId === lead.id ? (<Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--a-dim)]" />) : (<Trash2 className="h-3.5 w-3.5 text-[var(--a-dim)] hover:text-[var(--a-red)]" />)}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedLead === lead.id && (
                      <tr key={`${lead.id}-detail`}>
                        <td colSpan={7} className="px-6 py-0">
                          {editingLead === lead.id ? (
                            <div className="py-5 border-t border-[var(--a-line)] space-y-4">
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {[{ key: 'business_name', label: 'Business Name', type: 'text' }, { key: 'contact_name', label: 'Contact Name', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'phone', label: 'Phone', type: 'text' }, { key: 'website', label: 'Website', type: 'text' }, { key: 'linkedin_url', label: 'LinkedIn URL', type: 'text' }, { key: 'industry', label: 'Industry', type: 'text' }, { key: 'estimated_value', label: 'Value (cents)', type: 'number' }, { key: 'next_follow_up', label: 'Follow-up Date', type: 'date' }].map((f) => (
                                  <div key={f.key}><label className="block text-[10px] text-[var(--a-dim)] uppercase tracking-[0.1em] mb-1.5">{f.label}</label><input type={f.type} value={(editForm as any)[f.key] || ''} onChange={(e) => setEditForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))} className={editInputClass} placeholder={f.key === 'linkedin_url' ? 'https://linkedin.com/in/...' : undefined} /></div>
                                ))}
                                <div><label className="block text-[10px] text-[var(--a-dim)] uppercase tracking-[0.1em] mb-1.5">Source</label><select value={editForm.source || ''} onChange={(e) => setEditForm(prev => ({ ...prev, source: e.target.value }))} className={editInputClass}><option value="">Select...</option>{['cold_outreach', 'csv_import', 'apollo', 'linkedin', 'google_maps', 'referral', 'social_media', 'website', 'event', 'other'].map(s => (<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>))}</select></div>
                              </div>
                              <div><label className="block text-[10px] text-[var(--a-dim)] uppercase tracking-[0.1em] mb-1.5">Notes</label><textarea value={editForm.notes || ''} onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} className={`${editInputClass} resize-none`} /></div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleSave(lead.id)} disabled={saving} className="a-btn">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save</button>
                                <button onClick={() => setEditingLead(null)} className="a-btn-ghost">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <ExpandedDetail lead={lead} onEdit={() => startEdit(lead)} onDelete={() => handleDelete(lead.id)} onEmail={() => openComposer(lead, 'email')} onSms={() => openComposer(lead, 'sms')} onLinkedin={() => openComposer(lead, 'linkedin')} copiedId={copiedId} onCopy={copyToClipboard} />
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

      {!loading && leads.length > 0 && (<p className="mt-4 text-xs text-[var(--a-dim)]">Showing {leads.length} lead{leads.length !== 1 ? 's' : ''}</p>)}

      <CSVImportModal isOpen={showCSVImport} onClose={() => setShowCSVImport(false)} agencyId="platform" onImportComplete={() => { fetchLeads(); fetchStats(); fetchPipeline(); }} apiBase="/api/admin" theme={ADMIN_LIGHT_THEME} />

      {composerLead && (
        <ComposerModal isOpen={composerOpen} onClose={() => { setComposerOpen(false); setComposerLead(null); }} agencyId="platform" lead={composerLead} type={composerType} onSent={handleOutreachSent} adminMode />
      )}
    </div>
  );
}