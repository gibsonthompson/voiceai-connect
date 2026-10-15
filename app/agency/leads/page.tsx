'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  Users, Search, Plus, ChevronDown, Loader2,
  Target, Phone, PhoneCall, Mail, MessageSquare, Calendar, Clock,
  AlertCircle, X, Check, Info, Filter, FileSpreadsheet, SkipForward,
  ExternalLink, Sparkles, MapPin, Globe, FileText,
} from 'lucide-react';
import { useAgency } from '../context';
import LockedFeatureOverlay from '@/components/LockedFeature';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useTheme } from '../../../hooks/useTheme';
import { CustomSelect } from '@/components/ui/custom-select';
import { getDemoLeads } from '../demoData';
import CSVImportModal from '@/components/CSVImportModal';
import ComposerModal from '@/components/ComposerModal';
import CallScriptModal from '@/components/CallScriptModal';

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
  notes?: string | null;
  website?: string | null;
  outreach?: {
    last_contacted?: string | null;
    email_count?: number;
    sms_count?: number;
    call_count?: number;
  };
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

function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return phone;
}

// Parse a date-only string ("YYYY-MM-DD") as LOCAL midnight. Plain new Date()
// treats it as UTC midnight, which renders (and sorts) as the previous day in
// western timezones, so a follow-up set for tomorrow shows up as due today.
function parseLocalDate(dateStr: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(dateStr);
}

function isToday(dateStr: string): boolean {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isOverdue(dateStr: string): boolean {
  const date = parseLocalDate(dateStr);
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

// Pull a human 'City, ST' from a lead's notes. The lead finder writes the
// business address into notes as an 'Address: ...' line (there's no dedicated
// column), so we parse that. Falls back to the raw address, or null if none.
function parseLocation(notes?: string | null): string | null {
  if (!notes) return null;
  const m = /(?:^|\n)\s*Address:\s*(.+)/i.exec(notes);
  if (!m) return null;
  let addr = m[1].trim().replace(/,?\s*(USA|United States)\s*$/i, '').trim();
  const parts = addr.split(',').map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const stateMatch = /([A-Za-z]{2})\b/.exec(last);
    const st = stateMatch ? stateMatch[1].toUpperCase() : last;
    const city = parts[parts.length - 2];
    if (city) return `${city}, ${st}`;
  }
  return addr || null;
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

// ---------------------------------------------------------------------------
// The focus card: one lead at a time, with the actions to work it. This is the
// centrepiece of the page, everything else exists to feed it the next lead.
// ---------------------------------------------------------------------------
function FocusCard({
  lead, position, total, onEmail, onSms, onCall, onSkip, queueItem,
}: {
  lead: Lead;
  position: number;
  total: number;
  onEmail: () => void;
  onSms: () => void;
  onCall: () => void;
  onSkip: () => void;
  queueItem?: FollowUpItem;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const phone = formatPhone(lead.phone);
  const followUpOverdue = !!(lead.next_follow_up && isOverdue(lead.next_follow_up));
  const followUpToday = !!(lead.next_follow_up && isToday(lead.next_follow_up) && !followUpOverdue);
  const lastContacted = lead.outreach?.last_contacted || null;
  const location = parseLocation(lead.notes);
  const websiteHref = lead.website ? (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`) : null;
  const websiteLabel = lead.website ? lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';

  const actionBtn = 'flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-colors';

  return (
    <div className="rounded-2xl overflow-hidden bg-[var(--lp-card)] border border-[var(--lp-border)]">
      {/* Top meta strip */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--lp-muted)]">
          <Target className="h-3.5 w-3.5 text-[var(--lp-primary)]" />
          Working lead {total > 0 ? `${position} of ${total}` : ''}
        </span>
        {followUpOverdue && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-[var(--lp-error-bg)] border border-[var(--lp-error-border)] text-[var(--lp-error)]"><AlertCircle className="h-3 w-3" />Overdue</span>
        )}
        {followUpToday && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-[var(--lp-warning-bg)] border border-[var(--lp-warning-border)] text-[var(--lp-warning)]"><Calendar className="h-3 w-3" />Due today</span>
        )}
        {!followUpOverdue && !followUpToday && queueItem && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-[var(--lp-primary-15)] border border-[var(--lp-primary-30)] text-[var(--lp-primary)]"><Mail className="h-3 w-3" />{queueItem.next_template_name}</span>
        )}
      </div>

      {/* Identity */}
      <div className="px-4 sm:px-6 pt-3">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl flex-shrink-0 bg-[var(--lp-primary-15)]">
            <span className="text-xl sm:text-2xl font-semibold text-[var(--lp-primary)]">{lead.business_name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight truncate text-[var(--lp-text)]">{lead.business_name}</h2>
            </div>
            {lead.industry && (
              <span className="mt-1 inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize bg-[var(--lp-hover)] text-[var(--lp-muted)]">{lead.industry.replace(/_/g, ' ')}</span>
            )}
          </div>
        </div>

        {/* Contact rows */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 bg-[var(--lp-hover)]">
            <Users className="h-4 w-4 shrink-0 text-[var(--lp-muted)]" />
            <span className="text-sm truncate text-[var(--lp-text)]">{lead.contact_name || 'No contact name'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 bg-[var(--lp-hover)]">
            <Phone className="h-4 w-4 shrink-0 text-[var(--lp-muted)]" />
            {phone ? <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`} className="text-sm truncate text-[var(--lp-text)] hover:underline">{phone}</a> : <span className="text-sm text-[var(--lp-muted)]">No phone</span>}
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 bg-[var(--lp-hover)] sm:col-span-2">
            <Mail className="h-4 w-4 shrink-0 text-[var(--lp-muted)]" />
            {lead.email ? <span className="text-sm truncate text-[var(--lp-text)]">{lead.email}</span> : <span className="text-sm text-[var(--lp-muted)]">No email</span>}
          </div>
          {location && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 bg-[var(--lp-hover)]">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--lp-muted)]" />
              <span className="text-sm truncate text-[var(--lp-text)]">{location}</span>
            </div>
          )}
          {websiteHref && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 bg-[var(--lp-hover)]">
              <Globe className="h-4 w-4 shrink-0 text-[var(--lp-muted)]" />
              <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="text-sm truncate text-[var(--lp-primary)] hover:underline">{websiteLabel}</a>
            </div>
          )}
        </div>

        {/* Last contacted / follow-up line */}
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--lp-muted)]">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {lastContacted ? <span>Last contacted {timeSince(lastContacted)}</span> : <span>Never contacted</span>}
          {lead.next_follow_up && (
            <span className="before:content-['·'] before:mx-1.5">Follow-up {parseLocalDate(lead.next_follow_up).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Primary actions */}
      <div className="px-4 sm:px-6 pt-4 grid grid-cols-3 gap-2">
        <button onClick={onEmail} className={`${actionBtn} bg-[var(--lp-primary-15)] border border-[var(--lp-primary-30)] text-[var(--lp-primary)] hover:brightness-95`}>
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">Draft Email</span><span className="sm:hidden">Email</span>
        </button>
        <button onClick={onSms} className={`${actionBtn}`} style={{ backgroundColor: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--lp-info)' }}>
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Draft Text</span><span className="sm:hidden">Text</span>
        </button>
        <button onClick={onCall} className={`${actionBtn} bg-[var(--lp-hover)] border border-[var(--lp-border)] text-[var(--lp-text)] hover:brightness-95`}>
          <PhoneCall className="h-4 w-4" />
          <span className="hidden sm:inline">Call + Log</span><span className="sm:hidden">Call</span>
        </button>
      </div>

      {/* "You send it" clarity, where the action actually happens */}
      <div className="px-4 sm:px-6 pt-3">
        <div className="rounded-xl p-3 bg-[var(--lp-primary-15)] border border-[var(--lp-border)]">
          <div className="flex items-start gap-2.5">
            <Info className="h-5 w-5 shrink-0 mt-0.5 text-[var(--lp-primary)]" />
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-[var(--lp-text)]">
                <span className="font-semibold">You send these, VoiceAI Connect doesn&apos;t.</span>{' '}
                It writes the email or text and keeps your follow-ups on track. Send it from your own email or phone, then log it here so the next step is scheduled for you.
              </p>
              <button onClick={() => setShowWhy((v) => !v)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[var(--lp-primary)]">
                {showWhy ? 'Hide' : 'Why you send it yourself'}
                <ChevronDown className={`h-3 w-3 transition-transform ${showWhy ? 'rotate-180' : ''}`} />
              </button>
              {showWhy && (
                <p className="mt-2 text-xs leading-relaxed text-[var(--lp-muted)]">
                  Cold emails and texts sent from a shared platform address or a pooled number land in spam and get numbers flagged fast. Sending from your own inbox and phone keeps your sender reputation, your deliverability, and your replies all in one place. VoiceAI Connect writes the message, keeps your sequence straight, and records every send so you always know where a lead stands. The one time the platform does message a person directly is the AI receptionist texting a caller back during a live call, from the client&apos;s own number.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary actions */}
      <div className="px-4 sm:px-6 py-4 grid grid-cols-2 gap-2">
        <button onClick={onSkip} className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors bg-[var(--lp-card)] border border-[var(--lp-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
          <SkipForward className="h-4 w-4" />
          Skip for now
        </button>
        <Link href={`/agency/leads/${lead.id}`} prefetch={false} className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors bg-[var(--lp-card)] border border-[var(--lp-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
          <ExternalLink className="h-4 w-4" />
          Full details
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact queue row. Clicking it promotes the lead into the focus card; the
// external-link icon opens the full lead detail page.
// ---------------------------------------------------------------------------
function QueueRow({ lead, onFocus, isLast, queueItem }: {
  lead: Lead;
  onFocus: () => void;
  isLast: boolean;
  queueItem?: FollowUpItem;
}) {
  const phone = formatPhone(lead.phone);
  const followUpOverdue = !!(lead.next_follow_up && isOverdue(lead.next_follow_up));
  const followUpToday = !!(lead.next_follow_up && isToday(lead.next_follow_up) && !followUpOverdue);
  const lastContacted = lead.outreach?.last_contacted || null;

  return (
    <div className={`group flex items-center gap-3 px-4 sm:px-6 py-3 transition-colors hover:bg-[var(--lp-hover)] ${isLast ? '' : 'border-b border-[var(--lp-border-subtle)]'}`}>
      <button onClick={onFocus} className="flex-1 min-w-0 flex items-center gap-3 text-left">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 bg-[var(--lp-hover)]">
          <span className="text-sm font-medium text-[var(--lp-muted)]">{lead.business_name?.charAt(0)?.toUpperCase() || '?'}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate text-[var(--lp-text)]">{lead.business_name}</p>
          <p className="text-xs truncate text-[var(--lp-muted)]">{lead.contact_name || phone || lead.email || 'No contact info'}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {followUpOverdue && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--lp-error)]"><AlertCircle className="h-3 w-3" />Overdue</span>}
          {followUpToday && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--lp-warning)]"><Calendar className="h-3 w-3" />Today</span>}
          {!followUpOverdue && !followUpToday && queueItem && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--lp-primary)]"><Mail className="h-3 w-3" />Step {queueItem.next_sequence_order}</span>}
          {!followUpOverdue && !followUpToday && !queueItem && (
            <span className="text-[11px] text-[var(--lp-muted)]">{lastContacted ? timeSince(lastContacted) : 'New'}</span>
          )}
        </div>
      </button>
      <button onClick={onFocus} className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors bg-[var(--lp-card)] border border-[var(--lp-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)] hover:text-[var(--lp-text)]" aria-label="Work this lead">
        <Target className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Work</span>
      </button>
      <Link href={`/agency/leads/${lead.id}`} prefetch={false} className="shrink-0 rounded-lg p-1.5 transition-colors text-[var(--lp-muted)] hover:bg-[var(--lp-card)] hover:text-[var(--lp-text)]" aria-label="Open full details">
        <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function AgencyLeadsPage() {
  const { agency, loading: contextLoading, demoMode } = useAgency();
  const theme = useTheme();
  const { canUseLeadFinder } = usePlanFeatures();
  const isFreePlan = !canUseLeadFinder;
  const readOnly = demoMode || isFreePlan;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [showCSVImport, setShowCSVImport] = useState(false);

  // Focus-station state
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  // Action modals
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<'email' | 'sms'>('email');
  const [actionLeadId, setActionLeadId] = useState<string | null>(null);
  const [logCallOpen, setLogCallOpen] = useState(false);

  // Follow-up queue (sequence-based), drives the "step due" badges.
  const [followUpQueue, setFollowUpQueue] = useState<FollowUpItem[]>([]);

  useEffect(() => {
    if (!agency) return;
    if (readOnly) {
      setLeads(getDemoLeads() as Lead[]);
      setLoading(false);
      return;
    }
    fetchLeads();
    fetchFollowUpQueue();
  }, [agency, demoMode, isFreePlan]);

  // Persist the work session's skipped leads and current position per agency,
  // so a refresh doesn't un-skip leads or bounce you back to the top of the
  // queue. localStorage is wrapped in try/catch (private mode / blocked storage).
  useEffect(() => {
    if (!agency) return;
    try {
      const rawSkip = localStorage.getItem(`vac_leads_skipped_${agency.id}`);
      if (rawSkip) setSkippedIds(new Set(JSON.parse(rawSkip)));
      const rawCur = localStorage.getItem(`vac_leads_current_${agency.id}`);
      if (rawCur) setCurrentId(rawCur);
    } catch { /* storage unavailable */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agency]);

  useEffect(() => {
    if (!agency) return;
    try { localStorage.setItem(`vac_leads_skipped_${agency.id}`, JSON.stringify(Array.from(skippedIds))); } catch { /* ignore */ }
  }, [agency, skippedIds]);

  useEffect(() => {
    if (!agency) return;
    try {
      if (currentId) localStorage.setItem(`vac_leads_current_${agency.id}`, currentId);
      else localStorage.removeItem(`vac_leads_current_${agency.id}`);
    } catch { /* ignore */ }
  }, [agency, currentId]);

  const fetchLeads = async () => {
    if (!agency) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
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
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/leads/follow-up-queue`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setFollowUpQueue(data.queue || []);
      }
    } catch (error) {
      console.error('Failed to fetch follow-up queue:', error);
    }
  };

  // Working order: overdue follow-ups and untouched leads rise, a lead you just
  // contacted (or that has a future follow-up) sinks. Skipped leads go last.
  const leadSortKey = (l: Lead): [number, number] => {
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    if (l.next_follow_up) {
      const nfDay = parseLocalDate(l.next_follow_up); nfDay.setHours(0, 0, 0, 0);
      const nfTime = parseLocalDate(l.next_follow_up).getTime();
      if (nfDay.getTime() < startOfToday.getTime()) return [0, nfTime];
      if (nfDay.getTime() === startOfToday.getTime()) return [1, 0];
      return [3, nfTime];
    }
    const lc = l.outreach?.last_contacted ? new Date(l.outreach.last_contacted).getTime() : null;
    if (lc == null) return [2, 0];
    return [4, lc];
  };

  // Build the work queue: filter by search, drop skipped leads, then order
  // by the chosen sort.
  const base = leads.filter((lead) => {
    const matchesSearch = !searchQuery ||
      lead.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  const scoped = base.filter((l) => !skippedIds.has(l.id));
  const workQueue = [...scoped].sort((a, b) => {
    if (sortBy === 'email') {
      const ea = a.email && a.email.includes('@') ? 0 : 1;
      const eb = b.email && b.email.includes('@') ? 0 : 1;
      if (ea !== eb) return ea - eb; // leads with an email first, junk sinks
    } else if (sortBy === 'industry') {
      const ia = (a.industry || '').toLowerCase(), ib = (b.industry || '').toLowerCase();
      if (ia !== ib) { if (!ia) return 1; if (!ib) return -1; return ia.localeCompare(ib); }
    } else if (sortBy === 'name') {
      const na = (a.business_name || '').toLowerCase(), nb = (b.business_name || '').toLowerCase();
      if (na !== nb) return na.localeCompare(nb);
    } else if (sortBy === 'newest') {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (ta !== tb) return tb - ta;
    }
    const ka = leadSortKey(a), kb = leadSortKey(b);
    if (ka[0] !== kb[0]) return ka[0] - kb[0];
    return ka[1] - kb[1];
  });

  const currentLead = workQueue.find((l) => l.id === currentId) || workQueue[0] || null;
  const currentIndex = currentLead ? workQueue.findIndex((l) => l.id === currentLead.id) : -1;
  const upNext = currentLead ? workQueue.filter((l) => l.id !== currentLead.id) : workQueue;

  const totalActive = leads.length;
  const overdueCount = leads.filter((l) => l.next_follow_up && isOverdue(l.next_follow_up)).length;

  // Move the focus to the lead after the one just acted on. currentId is an id,
  // so it survives the re-sort that the action triggers.
  const advanceFrom = (actedId: string) => {
    const idx = workQueue.findIndex((l) => l.id === actedId);
    const next = workQueue[idx + 1] || workQueue.find((l) => l.id !== actedId) || null;
    setCurrentId(next ? next.id : null);
  };

  // Optimistic: stamp last_contacted now so the acted lead sinks immediately,
  // before the refetch returns the authoritative counts/follow-up.
  const markContactedLocal = (leadId: string) => {
    const now = new Date().toISOString();
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, outreach: { ...(l.outreach || {}), last_contacted: now } } : l));
  };

  const openEmail = () => { if (!currentLead) return; setActionLeadId(currentLead.id); setComposerType('email'); setComposerOpen(true); };
  const openSms = () => { if (!currentLead) return; setActionLeadId(currentLead.id); setComposerType('sms'); setComposerOpen(true); };
  const openCall = () => { if (!currentLead) return; setActionLeadId(currentLead.id); setLogCallOpen(true); };

  // Fired when the composer logs an email/SMS. Advance, sink the lead, refetch.
  const handleComposerSent = () => {
    if (actionLeadId) { advanceFrom(actionLeadId); markContactedLocal(actionLeadId); }
    if (!readOnly) { fetchLeads(); fetchFollowUpQueue(); }
  };

  // Log a call through the same /outreach/log path the composer uses, so the
  // call counts, updates "last contacted", and schedules the next follow-up.
  // The call flow now uses the same CallScriptModal the lead detail page uses.
  // That modal loads the agency's scripts, dials (tel:), and logs the call to
  // /outreach/log itself, then fires onSent. We only advance the work queue and
  // refresh, identical to how a sent email/SMS is handled.
  const handleCallSent = () => {
    if (actionLeadId) { advanceFrom(actionLeadId); markContactedLocal(actionLeadId); }
    if (!readOnly) { fetchLeads(); fetchFollowUpQueue(); }
  };

  const focusLead = (id: string) => { setCurrentId(id); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const skipCurrent = () => { if (!currentLead) return; const id = currentLead.id; advanceFrom(id); setSkippedIds((prev) => new Set(prev).add(id)); };
  const clearSkips = () => setSkippedIds(new Set());

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

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
    '--lp-error': theme.error,
    '--lp-error-bg': theme.errorBg,
    '--lp-error-border': theme.errorBorder,
    '--lp-info': theme.info,
    '--lp-info-bg': theme.infoBg,
  } as CSSProperties;

  const hasFilters = Boolean(searchQuery);
  const currentQueueItem = currentLead ? followUpQueue.find((q) => q.lead_id === currentLead.id) : undefined;

  const pageContent = (
    <div className="p-4 sm:p-6 lg:p-8" style={lpVars}>
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 bg-[var(--lp-primary-15)]"><Users className="h-5 w-5 text-[var(--lp-primary)]" /></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--lp-text)]">Leads</h1>
              <p className="mt-0.5 text-sm text-[var(--lp-muted)]">
                {totalActive} {totalActive === 1 ? 'lead' : 'leads'}
                {overdueCount > 0 && <span className="ml-2 text-[var(--lp-warning)]">{overdueCount} overdue</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/agency/leads/finder" prefetch={false} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-[filter] bg-[var(--lp-primary)] text-[var(--lp-primary-text)] hover:brightness-95">
              <Search className="h-4 w-4" />Find Leads
            </Link>
            <button onClick={() => setShowCSVImport(true)} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors bg-[var(--lp-input)] border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
              <FileSpreadsheet className="h-4 w-4" />Import
            </button>
            <Link href="/agency/leads/new" prefetch={false} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors bg-[var(--lp-input)] border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
              <Plus className="h-4 w-4" />Add Lead
            </Link>
          </div>
        </div>
      </div>

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
          <div className="flex-1 sm:flex-none sm:w-44">
            <CustomSelect
              value={sortBy}
              onChange={(v) => setSortBy(v || 'priority')}
              options={[
                { value: 'priority', label: 'Sort: Priority' },
                { value: 'email', label: 'Sort: Has email' },
                { value: 'industry', label: 'Sort: Industry' },
                { value: 'name', label: 'Sort: Name (A to Z)' },
                { value: 'newest', label: 'Sort: Newest' },
              ]}
              ui={{ inputStyle: { backgroundColor: 'var(--lp-input)', border: '1px solid var(--lp-input-border)', color: 'var(--lp-muted)' }, text: 'var(--lp-text)', muted: 'var(--lp-muted)', panelBg: theme.isDark ? '#232321' : '#ffffff', panelBorder: 'var(--lp-input-border)', hover: theme.hover, accent: theme.primary, isDark: theme.isDark }}
            />
          </div>
        </div>
      </div>

      {/* Focus card */}
      {currentLead ? (
        <FocusCard
          lead={currentLead}
          position={currentIndex + 1}
          total={workQueue.length}
          onEmail={openEmail}
          onSms={openSms}
          onCall={openCall}
          onSkip={skipCurrent}
          queueItem={currentQueueItem}
        />
      ) : (
        <div className="rounded-2xl py-12 sm:py-16 text-center px-4 bg-[var(--lp-card)] border border-[var(--lp-border)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--lp-primary-15)]">
            {skippedIds.size > 0 ? <Check className="h-7 w-7 text-[var(--lp-primary)]" /> : hasFilters ? <Filter className="h-7 w-7 text-[var(--lp-primary)]" /> : <Sparkles className="h-7 w-7 text-[var(--lp-primary)]" />}
          </div>
          <p className="mt-4 font-medium text-base text-[var(--lp-text)]">
            {skippedIds.size > 0 ? 'You worked the whole queue' : hasFilters ? 'No leads match your filters' : 'No leads yet'}
          </p>
          <p className="text-sm mt-1 mb-4 text-[var(--lp-muted)]">
            {skippedIds.size > 0 ? 'Every lead here has been actioned or skipped.' : hasFilters ? 'Try adjusting your search.' : 'Find or import leads to start working your pipeline.'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {skippedIds.size > 0 ? (
              <button onClick={clearSkips} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[filter] bg-[var(--lp-primary)] text-[var(--lp-primary-text)] hover:brightness-95">
                <SkipForward className="h-4 w-4" />Bring back skipped
              </button>
            ) : hasFilters ? (
              <button onClick={() => { setSearchQuery(''); }} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
                <X className="h-4 w-4" />Clear filters
              </button>
            ) : (
              <>
                <Link href="/agency/leads/finder" prefetch={false} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[filter] bg-[var(--lp-primary)] text-[var(--lp-primary-text)] hover:brightness-95"><Search className="h-4 w-4" />Find Leads</Link>
                <button onClick={() => setShowCSVImport(true)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]"><FileSpreadsheet className="h-4 w-4" />Import Leads</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Up next queue */}
      {upNext.length > 0 && (
        <div className="mt-4 sm:mt-6 rounded-2xl overflow-hidden bg-[var(--lp-card)] border border-[var(--lp-border)]">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--lp-border)]">
            <h3 className="text-sm font-medium text-[var(--lp-text)]">Up next <span className="text-[var(--lp-muted)]">({upNext.length})</span></h3>
            {skippedIds.size > 0 && (
              <button onClick={clearSkips} className="inline-flex items-center gap-1 text-xs font-medium transition-colors text-[var(--lp-muted)] hover:text-[var(--lp-text)]">
                <SkipForward className="h-3.5 w-3.5" />Bring back {skippedIds.size} skipped
              </button>
            )}
          </div>
          <div>
            {upNext.map((lead, idx) => (
              <QueueRow
                key={lead.id}
                lead={lead}
                onFocus={() => focusLead(lead.id)}
                isLast={idx === upNext.length - 1}
                queueItem={followUpQueue.find((q) => q.lead_id === lead.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* CSV Import */}
      {agency && (
        <CSVImportModal
          isOpen={showCSVImport}
          onClose={() => setShowCSVImport(false)}
          agencyId={agency.id}
          onImportComplete={() => { fetchLeads(); fetchFollowUpQueue(); }}
          theme={theme}
        />
      )}

      {/* Email / SMS composer (shared, agency mode). It drafts + logs, it never sends. */}
      {agency && actionLeadId && composerOpen && (() => {
        const l = leads.find((x) => x.id === actionLeadId);
        if (!l) return null;
        return (
          <ComposerModal
            isOpen={composerOpen}
            onClose={() => { setComposerOpen(false); setActionLeadId(null); }}
            agencyId={agency.id}
            lead={l}
            type={composerType}
            onSent={handleComposerSent}
          />
        );
      })()}

      {/* Call modal: the same cold-call script modal used on the lead detail page */}
      {agency && actionLeadId && logCallOpen && (() => {
        const l = leads.find((x) => x.id === actionLeadId);
        if (!l) return null;
        return (
          <CallScriptModal
            isOpen={logCallOpen}
            onClose={() => { setLogCallOpen(false); setActionLeadId(null); }}
            agencyId={agency.id}
            lead={{ ...l, website: l.website ?? undefined, notes: l.notes ?? undefined }}
            onSent={handleCallSent}
          />
        );
      })()}
    </div>
  );

  if (!canUseLeadFinder) {
    return (
      <LockedFeatureOverlay
        title="Lead Generation"
        description="Find local businesses on Google Maps, run outreach sequences with conversion-tested templates, and track your entire pipeline from one dashboard."
        requiredPlan="Pro"
        features={[
          'Google Maps business prospecting',
          '13 email + SMS outreach templates',
          'Focused one-lead-at-a-time work queue',
          'CSV import and export',
        ]}
      >
        {pageContent}
      </LockedFeatureOverlay>
    );
  }

  return pageContent;
}