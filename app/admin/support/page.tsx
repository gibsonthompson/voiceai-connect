'use client';

// ============================================================================
// ADMIN SUPPORT + FEEDBACK PAGE
// Destination: app/admin/support/page.tsx
// Two tabs:
//   Support Requests - inbound help-widget escalations (support_requests),
//                      status open / in_progress / resolved + notes.
//   Feedback         - Settings > Feedback submissions (agency_feedback),
//                      status new / reviewed / archived + notes.
// Reads/writes:
//   GET  /api/admin/support-requests   PATCH /api/admin/support-requests/:id
//   GET  /api/admin/feedback           PATCH /api/admin/feedback/:id
// Auth: admin_token.
//
// UPDATED: 2026-08-03 - Recolored onto the admin theme tokens (admin-theme.css,
//          --a-*). The page had shipped in the old dark-theme convention
//          (text-white, text-white/NN, bg-white/[0.0N], bright accent hexes),
//          which rendered white-on-cream and invisible on the emerald-on-white
//          admin background. Only the color/surface layer changed; all data
//          logic, state, and structure are identical. Status chips use the
//          white-background accents (--a-amber/--a-cyan/--a-em-deep/--a-violet).
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminSupportThread from '@/components/admin/AdminSupportThread';
import AdminAgencyThread from '@/components/admin/AdminAgencyThread';
import {
  LifeBuoy, Search, Loader2, Loader, Clock, Building2,
  User, Mail, ArrowLeft, ArrowRight, Check, ExternalLink, Plus, X} from 'lucide-react';


// Gmail compose deep link so "Reply by email" opens Gmail with the message
// already composed and the recipient prefilled, instead of handing off to the
// OS default mail app (Apple Mail). authuser hints the support@ inbox.
function gmailComposeUrl(to: string | null, subject: string, body: string): string {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to: to || '', su: subject, body });
  return `https://mail.google.com/mail/?${params.toString()}&authuser=support@myvoiceaiconnect.com`;
}


const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// ============================================================================
// PAGE (tab shell + badge counts)
// ============================================================================
export default function AdminSupportPage() {
  const [tab, setTab] = useState<'support' | 'errors'>('support');
  const [supportOpen, setSupportOpen] = useState<number | null>(null);
  const [feedbackNew, setFeedbackNew] = useState<number | null>(null);
  const [errorsOpen, setErrorsOpen] = useState<number | null>(null);

  const reloadBadges = useCallback(async () => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();
      const [s, e] = await Promise.all([
        fetch(`${backendUrl}/api/admin/support-requests?limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/admin/error-reports?resolved=false`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (s.ok) { const d = await s.json(); setSupportOpen(d.counts?.open ?? 0); }
      if (e.ok) { const d = await e.json(); setErrorsOpen(d.unresolved ?? (d.reports?.length ?? 0)); }
    } catch (e) {
      // Badges are non-critical; leave them as-is on error.
    }
  }, []);

  useEffect(() => { reloadBadges(); }, [reloadBadges]);

  const tabBtn = (id: 'support' | 'errors', label: string, Icon: any, badge: number | null) => {
    const active = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        style={active
          ? { background: 'var(--a-em-soft)', border: '1px solid var(--a-em-line)', color: 'var(--a-em-deep)' }
          : { background: 'var(--a-card)', border: '1px solid var(--a-line-2)', color: 'var(--a-muted)' }}
      >
        <Icon className="h-4 w-4" />
        {label}
        {badge != null && badge > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-semibold"
            style={active
              ? { background: 'var(--a-em)', color: '#04140D' }
              : { background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      <div className="mb-5">
        <h1 className="text-[22px] font-semibold text-[var(--a-ink)] tracking-tight">Support</h1>
        <p className="mt-1 text-sm text-[var(--a-muted)]">Inbound help-widget escalations and feedback submissions</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {tabBtn('support', 'Support', LifeBuoy, (supportOpen || 0))}
      </div>

      <SupportTab onChanged={reloadBadges} />
    </div>
  );
}

// ============================================================================
// SUPPORT REQUESTS TAB
// ============================================================================
interface SupportRequest {
  id: string;
  agency_id: string | null;
  client_id: string | null;
  user_type: string | null;
  user_email: string | null;
  display_name: string | null;
  message: string;
  source: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

const SUPPORT_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

function supportStatusStyle(status: string) {
  switch (status) {
    case 'open': return { color: 'var(--a-amber)', bg: 'var(--a-amber-soft)', border: 'var(--a-amber)', label: 'Open' };
    case 'in_progress': return { color: 'var(--a-cyan)', bg: 'var(--a-cyan-soft)', border: 'var(--a-cyan)', label: 'In Progress' };
    case 'resolved': return { color: 'var(--a-em-deep)', bg: 'var(--a-em-soft)', border: 'var(--a-em-line)', label: 'Resolved' };
    default: return { color: 'var(--a-muted)', bg: '#F1F5F3', border: 'var(--a-line-2)', label: status };
  }
}

function typeStyle(userType: string | null) {
  if (userType === 'client') return { color: 'var(--a-violet)', bg: 'var(--a-violet-soft)', border: 'var(--a-violet)', label: 'Client' };
  return { color: 'var(--a-em-deep)', bg: 'var(--a-em-soft)', border: 'var(--a-em-line)', label: 'Agency' };
}

function SupportTab({ onChanged }: { onChanged: () => void }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const limit = 30;

  // Feedback has its own status words; map them onto the support vocabulary so the
  // whole queue reads as one Support list (new -> open, reviewed -> in progress,
  // archived -> resolved). Status writes map back to the right value per source.
  const FB_TO_UNIFIED: Record<string, string> = { new: 'open', reviewed: 'in_progress', archived: 'resolved' };
  const UNIFIED_TO_FB: Record<string, string> = { open: 'new', in_progress: 'reviewed', resolved: 'archived' };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      // Feedback now lives in support_requests (kind='feedback'), so one fetch
      // covers both and the kind field drives the label. No separate feedback
      // fetch (that would double-show migrated rows).
      const sRes = await fetch(`${getBackendUrl()}/api/admin/support-requests?limit=200`, { headers });
      const sData = sRes.ok ? await sRes.json() : {};
      const merged = (sData.requests || []).map((r: any) => ({
        _kind: r.kind === 'feedback' ? 'feedback' : 'support', id: r.id, agency_id: r.agency_id, message: r.message,
        created_at: r.created_at, display_name: r.display_name, user_email: r.user_email,
        user_type: r.user_type, unified_status: r.status || 'open', admin_notes: r.admin_notes,
        source: r.source || 'widget', resolved_at: r.resolved_at,
      })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(merged);
    } catch (e) {
      console.error('Support queue error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { setPage(0); }, [statusFilter, userTypeFilter, search]);

  const counts = {
    total: items.length,
    open: items.filter(i => i.unified_status === 'open').length,
    in_progress: items.filter(i => i.unified_status === 'in_progress').length,
    resolved: items.filter(i => i.unified_status === 'resolved').length,
  };

  const q = search.trim().toLowerCase();
  const filtered = items.filter(i => {
    if (statusFilter && i.unified_status !== statusFilter) return false;
    if (userTypeFilter && i.user_type !== userTypeFilter) return false;
    if (q && !`${i.message || ''} ${i.display_name || ''} ${i.user_email || ''}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / limit);
  const pageItems = filtered.slice(page * limit, page * limit + limit);

  // One row per agency: their whole conversation (support + feedback) collapsed
  // together, most-recently-active first. Anonymous widget rows (no agency)
  // group under a single "No agency" bucket and keep per-request threads.
  const agencyGroups = (() => {
    const map = new Map<string, any>();
    for (const it of filtered) {
      const key = it.agency_id || '__none__';
      if (!map.has(key)) map.set(key, { key, agency_id: it.agency_id, name: it.display_name || (it.agency_id ? 'Agency' : 'No agency'), items: [], last: it.created_at, open: 0, lastMessage: it.message });
      const g = map.get(key);
      g.items.push(it);
      if (new Date(it.created_at).getTime() > new Date(g.last).getTime()) { g.last = it.created_at; g.lastMessage = it.message; }
      if (it.unified_status !== 'resolved') g.open += 1;
      if (it.display_name && (g.name === 'Agency' || g.name === 'No agency')) g.name = it.display_name;
    }
    return [...map.values()].sort((a, b) => new Date(b.last).getTime() - new Date(a.last).getTime());
  })();
  const groupPages = Math.ceil(agencyGroups.length / limit);
  const pageGroups = agencyGroups.slice(page * limit, page * limit + limit);

  const keyOf = (it: any) => `${it._kind}-${it.id}`;
  const toggleRow = (it: any) => {
    const k = keyOf(it);
    if (expandedKey === k) setExpandedKey(null);
    else { setExpandedKey(k); setNoteDraft(it.admin_notes || ''); }
  };

  const patchItem = async (it: any, body: { status?: string; admin_notes?: string }) => {
    const k = keyOf(it);
    setSavingKey(k);
    try {
      const url = `${getBackendUrl()}/api/admin/support-requests/${it.id}`;
      const payload: any = {};
      if (body.status) payload.status = body.status;
      if (body.admin_notes !== undefined) payload.admin_notes = body.admin_notes;
      const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to update');
      await fetchAll();
      onChanged();
    } catch (e) {
      console.error('Update support item error:', e);
    } finally {
      setSavingKey(null);
    }
  };

  function renderDetail(it: any, isSaving: boolean) {
    const ss = supportStatusStyle(it.unified_status);
    return (
      <div className="py-4 border-t border-[var(--a-line)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Message</h4>
              <pre className="text-[12px] text-[var(--a-ink)] font-sans leading-relaxed whitespace-pre-wrap bg-[var(--a-card)] rounded-xl px-4 py-3 border border-[var(--a-line)] max-h-[300px] overflow-y-auto">{it.message}</pre>
            </div>
            <div>
              <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Set Status</h4>
              <div className="flex flex-wrap items-center gap-2">
                {SUPPORT_STATUS_OPTIONS.map(opt => {
                  const s = supportStatusStyle(opt.value);
                  const active = it.unified_status === opt.value;
                  return (
                    <button key={opt.value} onClick={(e) => { e.stopPropagation(); if (!active) patchItem(it, { status: opt.value }); }} disabled={isSaving || active} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default" style={{ backgroundColor: active ? s.bg : 'transparent', borderColor: active ? s.border : 'var(--a-line-2)', color: active ? s.color : 'var(--a-muted)' }}>
                      {active && <Check className="h-3 w-3" />}{opt.label}
                    </button>
                  );
                })}
                {isSaving && <Loader className="h-3.5 w-3.5 animate-spin text-[var(--a-dim)]" />}
              </div>
            </div>
            <div><AdminSupportThread requestId={it.id} agencyId={it.agency_id} /></div>
            <div>
              <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Internal Notes</h4>
              <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} onClick={(e) => e.stopPropagation()} rows={3} placeholder="Notes for your own reference (not shown to the user)..." className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-3 py-2.5 text-xs text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)] resize-none" />
              <div className="mt-2 flex justify-end">
                <button onClick={(e) => { e.stopPropagation(); patchItem(it, { admin_notes: noteDraft }); }} disabled={isSaving || noteDraft === (it.admin_notes || '')} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--a-em-soft)] border border-[var(--a-em-line)] px-3 py-1.5 text-xs font-medium text-[var(--a-em-deep)] transition-colors hover:bg-[var(--a-em-line)] disabled:opacity-40 disabled:cursor-default">
                  {isSaving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}Save Notes
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Details</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Received</span><span className="text-[var(--a-ink)] text-right">{formatDateTime(it.created_at)}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Channel</span><span className="text-[var(--a-ink)]">{it._kind === 'feedback' ? 'Feedback form' : 'Help widget'}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">User Type</span><span className="text-[var(--a-ink)] capitalize">{it.user_type || 'unknown'}</span></div>
              {it.display_name && <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">{it.user_type === 'client' ? 'Business' : 'Agency'}</span><span className="text-[var(--a-ink)] text-right truncate max-w-[150px]">{it.display_name}</span></div>}
              {it.user_email && <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Email</span><span className="text-[var(--a-ink)] text-right truncate max-w-[150px]">{it.user_email}</span></div>}
              <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Status</span><span style={{ color: ss.color }}>{ss.label}</span></div>
              {it.resolved_at && <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">{it._kind === 'feedback' ? 'Reviewed' : 'Resolved'}</span><span className="text-[var(--a-ink)] text-right">{formatDateTime(it.resolved_at)}</span></div>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {it.agency_id && (
                <Link href={`/admin/agencies?expand=${it.agency_id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--a-em-soft)] border border-[var(--a-em-line)] px-3 py-1.5 text-xs font-medium text-[var(--a-em-deep)] transition-colors hover:bg-[var(--a-em-line)]"><Building2 className="h-3 w-3" /> Open Agency <ExternalLink className="h-3 w-3" /></Link>
              )}
              {it.user_email && (
                <a href={gmailComposeUrl(it.user_email, 'Re: your message to VoiceAI Connect', `Hi ${it.display_name || 'there'},\n\n`)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--a-card)] border border-[var(--a-line-2)] px-3 py-1.5 text-xs font-medium text-[var(--a-muted)] transition-colors hover:bg-[var(--a-em-soft)]"><Mail className="h-3 w-3" /> Reply by email</a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-[var(--a-muted)]">
          {counts.total} item{counts.total !== 1 ? 's' : ''}
          {counts.open > 0 && <span> · <span className="text-[var(--a-amber)]">{counts.open} open</span></span>}
          {counts.in_progress > 0 && <span> · <span className="text-[var(--a-cyan)]">{counts.in_progress} in progress</span></span>}
          {counts.resolved > 0 && <span> · <span className="text-[var(--a-em-deep)]">{counts.resolved} resolved</span></span>}
        </div>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors hover:brightness-95" style={{ background: 'var(--a-em)', color: '#04140D' }}>
          <Plus className="h-4 w-4" /> New ticket
        </button>
      </div>

      {createOpen && (
        <CreateTicketModal onClose={() => setCreateOpen(false)} onCreated={async () => { setCreateOpen(false); setPage(0); await fetchAll(); onChanged(); }} />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
          <input type="text" placeholder="Search message, email, name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] pl-10 pr-4 py-2.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)] transition-colors" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-4 py-2.5 text-sm text-[var(--a-ink)] focus:outline-none focus:border-[var(--a-em-line)]">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)} className="appearance-none rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-4 py-2.5 text-sm text-[var(--a-ink)] focus:outline-none focus:border-[var(--a-em-line)]">
          <option value="">All Users</option>
          <option value="agency">Agency</option>
          <option value="client">Client</option>
        </select>
      </div>

      <div className="a-panel overflow-visible">
        {loading ? (
          <div className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div>
        ) : agencyGroups.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 blur-2xl bg-[var(--a-em-soft)] rounded-full" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--a-em-soft)] border border-[var(--a-em-line)]"><LifeBuoy className="h-7 w-7 text-[var(--a-dim)]" /></div>
            </div>
            <p className="text-sm text-[var(--a-muted)]">No support items found</p>
            <p className="text-xs text-[var(--a-dim)] mt-1">Help-widget escalations and feedback submissions appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--a-line)]">
            {pageGroups.map((g: any) => {
              const isExpanded = expandedKey === g.key;
              return (
                <div key={g.key}>
                  <button onClick={() => setExpandedKey(isExpanded ? null : g.key)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#F6FCF9] transition-colors" style={isExpanded ? { background: '#F6FCF9' } : undefined}>
                    <Building2 className="h-4 w-4 shrink-0 text-[var(--a-dim)]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-[var(--a-ink)] truncate max-w-[220px]">{g.name}</span>
                        {g.open > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium" style={{ color: 'var(--a-em-deep)', background: 'var(--a-em-soft)', borderColor: 'var(--a-em-line)' }}>{g.open} open</span>}
                        <span className="text-[10px] text-[var(--a-dim)]">{g.items.length} message{g.items.length > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-[11px] text-[var(--a-dim)] truncate mt-0.5">{g.lastMessage}</p>
                    </div>
                    <span className="text-[10px] text-[var(--a-dim)] shrink-0">{timeAgo(g.last)}</span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1">
                      {g.agency_id
                        ? <AdminAgencyThread agencyId={g.agency_id} />
                        : <div className="space-y-3">{g.items.map((it: any) => <AdminSupportThread key={it.id} requestId={it.id} agencyId={null} />)}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {groupPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[var(--a-dim)]">Page {page + 1} of {groupPages} · {agencyGroups.length} agencies</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--a-muted)] hover:bg-[var(--a-em-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ArrowLeft className="h-3 w-3" /> Prev</button>
            <button onClick={() => setPage(Math.min(groupPages - 1, page + 1))} disabled={page >= groupPages - 1} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--a-muted)] hover:bg-[var(--a-em-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Next <ArrowRight className="h-3 w-3" /></button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// CREATE TICKET MODAL (admin-authored support request)
// Writes to the same support_requests table via POST /api/admin/support-requests
// (source='admin'). Optionally attaches an agency so the ticket files under it
// and the "Open agency" deep-link works. Uses the shared status styles.
// ============================================================================
interface MiniAgency { id: string; name: string; email: string | null; }

function CreateTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('open');
  const [displayName, setDisplayName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [agencies, setAgencies] = useState<MiniAgency[]>([]);
  const [agencyQuery, setAgencyQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<MiniAgency | null>(null);
  const [agencyFocused, setAgencyFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/admin/agencies?limit=1000`, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (!res.ok) return;
        const data = await res.json();
        setAgencies((data.agencies || []).map((a: any) => ({ id: a.id, name: a.name, email: a.email })));
      } catch (e) { /* agency attach is optional */ }
    })();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = agencyQuery.trim().toLowerCase();
  const matches = q ? agencies.filter(a => (a.name || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q)).slice(0, 6) : [];
  const showMatches = agencyFocused && q.length > 0 && !selectedAgency && matches.length > 0;

  const pickAgency = (a: MiniAgency) => {
    setSelectedAgency(a);
    setAgencyQuery('');
    setAgencyFocused(false);
    if (!displayName) setDisplayName(a.name || '');
    if (!userEmail && a.email) setUserEmail(a.email);
  };

  const submit = async () => {
    if (!message.trim()) { setError('Message is required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${getBackendUrl()}/api/admin/support-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          message: message.trim(),
          agency_id: selectedAgency?.id || null,
          user_type: selectedAgency ? 'agency' : null,
          display_name: displayName.trim() || (selectedAgency?.name ?? null),
          user_email: userEmail.trim() || null,
          status,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to create ticket'); }
      onCreated();
    } catch (e: any) {
      setError(e.message || 'Failed to create ticket');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto" style={{ background: 'rgba(6,20,14,0.45)' }} onClick={onClose}>
      <div className="admin-scope w-full max-w-[520px] rounded-2xl bg-[var(--a-card)] border border-[var(--a-line-2)] shadow-xl mt-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--a-line)]">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-[var(--a-em-deep)]" />
            <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">New Support Ticket</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--a-dim)] hover:bg-[var(--a-em-soft)] transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-1.5">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} autoFocus placeholder="What is this ticket about?" className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-3 py-2.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)] resize-none" />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-1.5">Attach to agency (optional)</label>
            {selectedAgency ? (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--a-em-line)] bg-[var(--a-em-soft)] px-3 py-2">
                <Building2 className="h-3.5 w-3.5 text-[var(--a-em-deep)]" />
                <span className="text-sm text-[var(--a-ink)] truncate flex-1">{selectedAgency.name}</span>
                <button onClick={() => setSelectedAgency(null)} className="text-[var(--a-dim)] hover:text-[var(--a-muted)]"><X className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--a-dim)]" />
                <input value={agencyQuery} onChange={(e) => setAgencyQuery(e.target.value)} onFocus={() => setAgencyFocused(true)} onBlur={() => setTimeout(() => setAgencyFocused(false), 120)} placeholder="Search agencies..." autoComplete="off" className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] pl-9 pr-3 py-2.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)]" />
                {showMatches && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-10 rounded-xl bg-white border border-[var(--a-line-2)] shadow-xl overflow-hidden max-h-[240px] overflow-y-auto">
                    {matches.map(a => (
                      <button key={a.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickAgency(a)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#F6FCF9] transition-colors">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ background: 'var(--a-em-soft)' }}><Building2 className="h-3.5 w-3.5 text-[var(--a-em-deep)]" /></span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-[var(--a-ink)] truncate">{a.name}</span>
                          {a.email && <span className="block text-[11px] text-[var(--a-dim)] truncate">{a.email}</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-1.5">Reporter name (optional)</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Name or business" className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-3 py-2.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)]" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-1.5">Reporter email (optional)</label>
              <input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="name@example.com" className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-3 py-2.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)]" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-1.5">Status</label>
            <div className="flex flex-wrap gap-2">
              {SUPPORT_STATUS_OPTIONS.map(opt => {
                const s = supportStatusStyle(opt.value);
                const active = status === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => setStatus(opt.value)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors" style={{ backgroundColor: active ? s.bg : 'transparent', borderColor: active ? s.border : 'var(--a-line-2)', color: active ? s.color : 'var(--a-muted)' }}>
                    {active && <Check className="h-3 w-3" />}{opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs text-[var(--a-red)]">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--a-line)]">
          <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-medium text-[var(--a-muted)] hover:bg-[var(--a-em-soft)] transition-colors">Cancel</button>
          <button onClick={submit} disabled={submitting || !message.trim()} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover:brightness-95 disabled:opacity-40 disabled:cursor-default" style={{ background: 'var(--a-em)', color: '#04140D' }}>
            {submitting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Create Ticket
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// BACKEND ERRORS TAB - rows written by alertError() in lib/error-monitor.js
// ============================================================================
interface ErrorReport {
  id: string;
  context: string;
  message: string | null;
  stack: string | null;
  metadata: Record<string, any> | null;
  signature: string | null;
  resolved: boolean;
  created_at: string;
}

function ErrorsTab({ onChanged }: { onChanged: () => void }) {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/admin/error-reports?resolved=${showResolved}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) { const d = await res.json(); setReports(d.reports || []); }
    } catch { /* leave list as-is */ }
    finally { setLoading(false); }
  }, [showResolved]);

  useEffect(() => { fetchErrors(); }, [fetchErrors]);

  const resolve = async (id: string, resolved: boolean) => {
    setBusy(id);
    try {
      await fetch(`${getBackendUrl()}/api/admin/error-reports/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ resolved }),
      });
      await fetchErrors();
      onChanged();
    } catch { /* no-op */ } finally { setBusy(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--a-muted)]">{loading ? 'Loading…' : `${reports.length} ${showResolved ? 'resolved' : 'open'} error${reports.length === 1 ? '' : 's'}`}</p>
        <button onClick={() => setShowResolved(v => !v)} className="text-xs rounded-lg px-3 py-1.5" style={{ background: 'var(--a-card)', border: '1px solid var(--a-line-2)', color: 'var(--a-muted)' }}>
          {showResolved ? 'Show open' : 'Show resolved'}
        </button>
      </div>
      {!loading && reports.length === 0 && (
        <div className="rounded-xl p-8 text-center text-sm text-[var(--a-muted)]" style={{ background: 'var(--a-card)', border: '1px solid var(--a-line-2)' }}>
          No {showResolved ? 'resolved' : 'open'} backend errors.
        </div>
      )}
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-xl p-4" style={{ background: 'var(--a-card)', border: '1px solid var(--a-line-2)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--a-ink)] break-words">{r.context}</p>
                <p className="mt-1 text-sm text-[var(--a-muted)] break-words">{r.message}</p>
              </div>
              <button onClick={() => resolve(r.id, !r.resolved)} disabled={busy === r.id} className="flex-shrink-0 text-xs rounded-lg px-3 py-1.5 disabled:opacity-50" style={{ background: r.resolved ? 'var(--a-card)' : 'var(--a-em-soft)', border: '1px solid var(--a-em-line)', color: 'var(--a-em-deep)' }}>
                {r.resolved ? 'Reopen' : 'Resolve'}
              </button>
            </div>
            {r.metadata && Object.keys(r.metadata).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(r.metadata).map(([k, v]) => (
                  <span key={k} className="text-[11px] text-[var(--a-muted)] break-all"><span className="font-medium text-[var(--a-ink)]">{k}:</span> {String(v)}</span>
                ))}
              </div>
            )}
            {r.stack && (<pre className="mt-2 max-h-32 overflow-auto rounded-lg p-2 text-[10px] leading-relaxed text-[var(--a-muted)]" style={{ background: 'rgba(127,127,127,0.06)' }}>{r.stack}</pre>)}
            <p className="mt-2 text-[10px] text-[var(--a-muted)]">{new Date(r.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}