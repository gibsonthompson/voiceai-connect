'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Users, Search, Plus, ChevronDown, Loader2,
  Target, Phone, PhoneCall, Mail, MessageSquare, Calendar, Clock,
  AlertCircle, X, Check, Info, Filter, FileSpreadsheet, SkipForward,
  ExternalLink, Sparkles, MapPin, Globe, FileText, Copy,
} from 'lucide-react';
import { useAgency } from '../context';
import LockedFeatureOverlay from '@/components/LockedFeature';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useTheme } from '../../../hooks/useTheme';
import { CustomSelect } from '@/components/ui/custom-select';
import { getDemoLeads } from '../demoData';
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
// Inline status pill with a portaled dropdown (reused on the focus card and the
// queue rows). Portaled to document.body so the list card's overflow can't clip
// it; the --lp-* surface vars are re-applied on the portal element.
// ---------------------------------------------------------------------------
function InlineStatusSelect({ value, bg, text, options, onChange }: {
  value: string;
  bg: string;
  text: string;
  options: { value: string; label: string; color: string }[];
  onChange: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [surface, setSurface] = useState({ card: '#ffffff', border: '#e5e7eb', hover: 'rgba(0,0,0,0.05)', text: '#111827' });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onMove = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const el = btnRef.current;
          const r = el?.getBoundingClientRect();
          if (r) setCoords({ top: r.bottom + 4, left: r.left });
          if (el) {
            const cs = getComputedStyle(el);
            setSurface({
              card: cs.getPropertyValue('--lp-card').trim() || '#ffffff',
              border: cs.getPropertyValue('--lp-border').trim() || '#e5e7eb',
              hover: cs.getPropertyValue('--lp-hover').trim() || 'rgba(0,0,0,0.05)',
              text: cs.getPropertyValue('--lp-text').trim() || '#111827',
            });
          }
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1 rounded-full pl-3 pr-2 py-1 text-xs font-medium focus:outline-none cursor-pointer"
        style={{ backgroundColor: bg, color: text }}
        aria-label="Change lead status"
      >
        {current ? current.label : value}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>
      {open && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[100] min-w-[150px] rounded-lg py-1 shadow-xl bg-[var(--lp-card)] border border-[var(--lp-border)]"
          style={{ top: coords.top, left: coords.left, '--lp-card': surface.card, '--lp-border': surface.border, '--lp-hover': surface.hover, '--lp-text': surface.text } as CSSProperties}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(o.value); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-[var(--lp-hover)] cursor-pointer"
            >
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: o.color }} />
              <span style={{ color: 'var(--lp-text)', fontWeight: value === o.value ? 600 : 400 }}>{o.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Call outcomes. A couple of them move the lead's status so the queue reflects
// reality (interested -> qualified, not interested -> lost). The rest only log.
// ---------------------------------------------------------------------------
const CALL_OUTCOMES: { value: string; label: string; status?: string }[] = [
  { value: 'connected', label: 'Connected' },
  { value: 'interested', label: 'Interested', status: 'qualified' },
  { value: 'no_answer', label: 'No answer' },
  { value: 'voicemail', label: 'Left voicemail' },
  { value: 'callback', label: 'Call back later' },
  { value: 'not_interested', label: 'Not interested', status: 'lost' },
];

// ---------------------------------------------------------------------------
// Cold-call modal. Shows the agency's cold-call SCRIPT for this lead (pulled
// from their Outreach call_script templates, variables filled in), lets them
// dial from their own phone (tel:), then records the call through /outreach/log
// (type: call), the same path the composer uses for email and SMS, so the call
// counts toward the lead's history, updates "last contacted", and schedules the
// next follow-up. Nothing here places a call for the agency; it dials their
// device and logs the result.
// ---------------------------------------------------------------------------
function LogCallModal({ isOpen, onClose, lead, onLogged, isDark, primary, agencyId, readOnly }: {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onLogged: (outcome: string, note: string) => void;
  isDark: boolean;
  primary: string;
  agencyId: string;
  readOnly: boolean;
}) {
  const [outcome, setOutcome] = useState<string>('connected');
  const [note, setNote] = useState('');
  const [scripts, setScripts] = useState<{ id: string; name: string; body: string; sequence_order: number | null; created_at: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [scriptBody, setScriptBody] = useState('');
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [composing, setComposing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScript, setShowScript] = useState(true);

  // Substitute the chosen script's variables against this lead via the same
  // compose endpoint the email/SMS composer uses. Falls back to the raw body.
  const selectScript = async (id: string, list = scripts) => {
    setSelectedId(id);
    const tmpl = list.find((x) => x.id === id);
    setScriptBody(tmpl?.body || '');
    if (readOnly || !agencyId) return;
    setComposing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/outreach/compose`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: id, leadId: lead.id }),
      });
      if (res.ok) { const d = await res.json(); setScriptBody(d.body || tmpl?.body || ''); }
    } catch { /* keep the raw body */ }
    finally { setComposing(false); }
  };

  // Load the agency's cold-call scripts when the modal opens, ordered intro ->
  // follow-up -> close, and compose the first one against this lead.
  useEffect(() => {
    if (!isOpen) return;
    setOutcome('connected'); setNote(''); setCopied(false); setShowScript(true);
    setScripts([]); setSelectedId(''); setScriptBody('');
    if (readOnly || !agencyId) return;
    let cancelled = false;
    (async () => {
      setLoadingScripts(true);
      try {
        const token = localStorage.getItem('auth_token');
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${backendUrl}/api/agency/${agencyId}/templates?type=call_script`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok && !cancelled) {
          const data = await res.json();
          const list = (data.templates || []).slice().sort((a: { sequence_order: number | null; created_at: string }, b: { sequence_order: number | null; created_at: string }) => {
            const ao = a.sequence_order ?? 999, bo = b.sequence_order ?? 999;
            if (ao !== bo) return ao - bo;
            return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          });
          setScripts(list);
          if (list.length > 0) selectScript(list[0].id, list);
        }
      } catch { /* non-blocking: logging still works without a script */ }
      finally { if (!cancelled) setLoadingScripts(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lead.id, agencyId, readOnly]);

  const copyScript = async () => {
    if (!scriptBody) return;
    try { await navigator.clipboard.writeText(scriptBody); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  if (!isOpen) return null;
  const phone = formatPhone(lead.phone);
  const dialHref = lead.phone ? `tel:${lead.phone.replace(/[^\d+]/g, '')}` : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] bg-[var(--lp-card)] border border-[var(--lp-border)]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--lp-border-subtle)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 bg-[var(--lp-info-bg)]">
              <PhoneCall className="h-4 w-4 text-[var(--lp-info)]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm sm:text-base text-[var(--lp-text)]">Cold call</h2>
              <p className="text-xs truncate text-[var(--lp-muted)]">{lead.contact_name || lead.business_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Dial from your own phone */}
          {dialHref ? (
            <a href={dialHref} className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-[filter] hover:brightness-95" style={{ backgroundColor: 'var(--lp-info-bg)', border: '1px solid var(--lp-info)', color: 'var(--lp-info)' }}>
              <Phone className="h-4 w-4" />
              Call {phone} from your phone
            </a>
          ) : (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs bg-[var(--lp-hover)] text-[var(--lp-muted)]">
              <Info className="h-4 w-4 shrink-0" />
              No phone number on file for this lead.
            </div>
          )}

          {/* Cold-call script */}
          <div className="rounded-xl border border-[var(--lp-border)] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[var(--lp-hover)]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-[var(--lp-muted)]" />
                {scripts.length > 1 ? (
                  <select value={selectedId} onChange={(e) => selectScript(e.target.value)} className="bg-transparent text-xs font-medium focus:outline-none text-[var(--lp-text)] cursor-pointer max-w-[190px] truncate">
                    {scripts.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
                ) : (
                  <span className="text-xs font-medium truncate text-[var(--lp-text)]">{scripts[0]?.name || 'Call script'}</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {scriptBody && (
                  <button onClick={copyScript} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors text-[var(--lp-muted)] hover:bg-[var(--lp-card)]">
                    {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
                  </button>
                )}
                <button onClick={() => setShowScript((v) => !v)} className="rounded-md p-1 text-[var(--lp-muted)] hover:bg-[var(--lp-card)]" aria-label="Toggle script"><ChevronDown className={`h-4 w-4 transition-transform ${showScript ? '' : '-rotate-90'}`} /></button>
              </div>
            </div>
            {showScript && (
              <div className="px-3 py-3 max-h-56 overflow-y-auto">
                {loadingScripts || composing ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--lp-muted)]"><Loader2 className="h-4 w-4 animate-spin" />Loading script...</div>
                ) : scriptBody ? (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap text-[var(--lp-text)]">{scriptBody}</p>
                ) : (
                  <p className="text-xs text-[var(--lp-muted)]">{readOnly ? 'Your cold-call scripts show up here on a live plan.' : 'No call scripts yet. Add one under Outreach and it shows here.'}</p>
                )}
              </div>
            )}
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-2 text-[var(--lp-muted)]">How did it go?</label>
            <div className="grid grid-cols-2 gap-2">
              {CALL_OUTCOMES.map((oc) => {
                const active = outcome === oc.value;
                return (
                  <button
                    key={oc.value}
                    onClick={() => setOutcome(oc.value)}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-left transition-colors border"
                    style={{
                      backgroundColor: active ? 'var(--lp-primary-15)' : 'var(--lp-card)',
                      borderColor: active ? 'var(--lp-primary)' : 'var(--lp-border)',
                      color: active ? 'var(--lp-primary)' : 'var(--lp-text)',
                    }}
                  >
                    {oc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-2 text-[var(--lp-muted)]">Note <span className="normal-case font-normal">(optional)</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was said, next step, anything to remember..."
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm transition-colors focus:outline-none bg-[var(--lp-input)] border border-[var(--lp-input-border)] text-[var(--lp-text)]"
              style={{ resize: 'vertical', minHeight: '72px' }}
            />
          </div>
        </div>

        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--lp-border-subtle)]" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="flex-1 sm:flex-none rounded-xl px-4 py-2.5 text-sm font-medium transition-colors bg-[var(--lp-card)] border border-[var(--lp-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">Cancel</button>
            <button
              onClick={() => onLogged(outcome, note.trim())}
              className="flex-[1.3] sm:flex-none flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-[filter] hover:brightness-95"
              style={{ backgroundColor: primary, color: '#ffffff' }}
            >
              <Check className="h-4 w-4" />
              Log call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The focus card: one lead at a time, with the actions to work it. This is the
// centrepiece of the page, everything else exists to feed it the next lead.
// ---------------------------------------------------------------------------
function FocusCard({
  lead, position, total, statusOptions, getStatusStyle, onStatus, onEmail, onSms, onCall, onSkip, queueItem,
}: {
  lead: Lead;
  position: number;
  total: number;
  statusOptions: { value: string; label: string; color: string }[];
  getStatusStyle: (s: string) => { bg: string; text: string; border: string };
  onStatus: (leadId: string, status: string) => void;
  onEmail: () => void;
  onSms: () => void;
  onCall: () => void;
  onSkip: () => void;
  queueItem?: FollowUpItem;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const phone = formatPhone(lead.phone);
  const ss = getStatusStyle(lead.status);
  const followUpOverdue = !!(lead.next_follow_up && isOverdue(lead.next_follow_up) && !['won', 'lost'].includes(lead.status));
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
              <InlineStatusSelect value={lead.status} bg={ss.bg} text={ss.text} options={statusOptions} onChange={(s) => onStatus(lead.id, s)} />
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
          {lead.next_follow_up && !['won', 'lost'].includes(lead.status) && (
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
  const followUpOverdue = !!(lead.next_follow_up && isOverdue(lead.next_follow_up) && !['won', 'lost'].includes(lead.status));
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'new': return { bg: theme.infoBg, text: theme.info, border: theme.infoBorder };
      case 'contacted': return { bg: theme.warningBg, text: theme.warning, border: theme.warningBorder };
      case 'qualified': return { bg: theme.primary15, text: theme.primary, border: theme.primary30 };
      case 'proposal': return { bg: 'rgba(6,182,212,0.1)', text: theme.isDark ? '#22d3ee' : '#0891b2', border: 'rgba(6,182,212,0.2)' };
      case 'won': return { bg: theme.primary15, text: theme.primary, border: theme.primary30 };
      case 'lost': return { bg: theme.errorBg, text: theme.error, border: theme.errorBorder };
      default: return { bg: theme.hover, text: theme.textMuted, border: theme.border };
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', proposal: 'Proposal', won: 'Won', lost: 'Lost' };
    return labels[status] || status;
  };

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
    if (l.status === 'won' || l.status === 'lost') return [5, 0];
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

  // Build the work queue: filter, drop closed leads (unless explicitly filtered
  // to a status), then order by the chosen sort with skipped leads pushed down.
  const base = leads.filter((lead) => {
    const matchesSearch = !searchQuery ||
      lead.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const scoped = (statusFilter ? base : base.filter((l) => !['won', 'lost'].includes(l.status)))
    .filter((l) => !skippedIds.has(l.id));
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

  const totalActive = leads.filter((l) => !['won', 'lost'].includes(l.status)).length;
  const overdueCount = leads.filter((l) => l.next_follow_up && isOverdue(l.next_follow_up) && !['won', 'lost'].includes(l.status)).length;

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

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    if (readOnly || !agency) return;
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
  const handleLogCall = async (outcome: string, note: string) => {
    const lead = actionLeadId ? leads.find((l) => l.id === actionLeadId) : null;
    setLogCallOpen(false);
    setActionLeadId(null);
    if (!lead) return;

    const meta = CALL_OUTCOMES.find((o) => o.value === outcome);
    const label = meta?.label || 'Call';

    advanceFrom(lead.id);
    markContactedLocal(lead.id);
    if (meta?.status) setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: meta.status as string } : l)));

    if (readOnly || !agency) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await fetch(`${backendUrl}/api/agency/${agency.id}/outreach/log`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          type: 'call',
          toPhone: lead.phone || null,
          subject: `Call: ${label}`,
          body: note || label,
          call_outcome: outcome,
          call_notes: note || null,
          updateLeadStatus: meta?.status || null,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          userId: user.id,
        }),
      });
      fetchLeads();
      fetchFollowUpQueue();
    } catch (error) {
      console.error('Failed to log call:', error);
    }
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

  const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((v) => ({
    value: v, label: getStatusLabel(v), color: getStatusStyle(v).text,
  }));

  const hasFilters = Boolean(searchQuery || statusFilter);
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
                {totalActive} active
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
              value={statusFilter || ''}
              onChange={(v) => setStatusFilter(v || null)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'proposal', label: 'Proposal' },
                { value: 'won', label: 'Won' },
                { value: 'lost', label: 'Lost' },
              ]}
              ui={{ inputStyle: { backgroundColor: 'var(--lp-input)', border: '1px solid var(--lp-input-border)', color: 'var(--lp-muted)' }, text: 'var(--lp-text)', muted: 'var(--lp-muted)', panelBg: theme.isDark ? '#232321' : '#ffffff', panelBorder: 'var(--lp-input-border)', hover: theme.hover, accent: theme.primary, isDark: theme.isDark }}
            />
          </div>
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
          statusOptions={statusOptions}
          getStatusStyle={getStatusStyle}
          onStatus={handleStatusChange}
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
            {skippedIds.size > 0 ? 'Every lead here has been actioned or skipped.' : hasFilters ? 'Try adjusting your search or status filter.' : 'Find or import leads to start working your pipeline.'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {skippedIds.size > 0 ? (
              <button onClick={clearSkips} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[filter] bg-[var(--lp-primary)] text-[var(--lp-primary-text)] hover:brightness-95">
                <SkipForward className="h-4 w-4" />Bring back skipped
              </button>
            ) : hasFilters ? (
              <button onClick={() => { setSearchQuery(''); setStatusFilter(null); }} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors border border-[var(--lp-input-border)] text-[var(--lp-muted)] hover:bg-[var(--lp-hover)]">
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

      {/* Log-call modal */}
      {actionLeadId && logCallOpen && (() => {
        const l = leads.find((x) => x.id === actionLeadId);
        if (!l) return null;
        return (
          <LogCallModal
            isOpen={logCallOpen}
            onClose={() => { setLogCallOpen(false); setActionLeadId(null); }}
            lead={l}
            onLogged={handleLogCall}
            isDark={theme.isDark}
            primary={theme.primary}
            agencyId={agency?.id || ''}
            readOnly={readOnly}
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