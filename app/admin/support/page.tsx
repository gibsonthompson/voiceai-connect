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
import {
  LifeBuoy, MessageSquare, Search, Loader2, Loader, Clock, Building2,
  User, Mail, ArrowLeft, ArrowRight, Check, ExternalLink, Plus, X,
} from 'lucide-react';

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
  const [tab, setTab] = useState<'support' | 'feedback'>('support');
  const [supportOpen, setSupportOpen] = useState<number | null>(null);
  const [feedbackNew, setFeedbackNew] = useState<number | null>(null);

  const reloadBadges = useCallback(async () => {
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();
      const [s, f] = await Promise.all([
        fetch(`${backendUrl}/api/admin/support-requests?limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/admin/feedback?limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (s.ok) { const d = await s.json(); setSupportOpen(d.counts?.open ?? 0); }
      if (f.ok) { const d = await f.json(); setFeedbackNew(d.counts?.new ?? 0); }
    } catch (e) {
      // Badges are non-critical; leave them as-is on error.
    }
  }, []);

  useEffect(() => { reloadBadges(); }, [reloadBadges]);

  const tabBtn = (id: 'support' | 'feedback', label: string, Icon: any, badge: number | null) => {
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
        <h1 className="text-[22px] font-semibold text-[var(--a-ink)] tracking-tight">Support &amp; Feedback</h1>
        <p className="mt-1 text-sm text-[var(--a-muted)]">Inbound help-widget escalations and feedback submissions</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {tabBtn('support', 'Support Requests', LifeBuoy, supportOpen)}
        {tabBtn('feedback', 'Feedback', MessageSquare, feedbackNew)}
      </div>

      {tab === 'support' ? <SupportTab onChanged={reloadBadges} /> : <FeedbackTab onChanged={reloadBadges} />}
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
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ open: 0, in_progress: 0, resolved: 0, total: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const limit = 30;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', (page * limit).toString());
      if (statusFilter) params.set('status', statusFilter);
      if (userTypeFilter) params.set('user_type', userTypeFilter);
      if (search) params.set('search', search);
      const res = await fetch(`${getBackendUrl()}/api/admin/support-requests?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch support requests');
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      if (data.counts) setCounts(data.counts);
    } catch (e) {
      console.error('Support requests error:', e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, userTypeFilter, search]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { setPage(0); }, [statusFilter, userTypeFilter, search]);

  const totalPages = Math.ceil(total / limit);

  const toggleRow = (req: SupportRequest) => {
    if (expandedId === req.id) setExpandedId(null);
    else { setExpandedId(req.id); setNoteDraft(req.admin_notes || ''); }
  };

  const patchRequest = async (id: string, body: { status?: string; admin_notes?: string }) => {
    setSavingId(id);
    try {
      const res = await fetch(`${getBackendUrl()}/api/admin/support-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      setRequests(prev => prev.map(r => (r.id === id ? data.request : r)));
      await fetchRequests();
      onChanged();
    } catch (e) {
      console.error('Update support request error:', e);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-[var(--a-muted)]">
          {counts.total} request{counts.total !== 1 ? 's' : ''}
          {counts.open > 0 && <span> · <span className="text-[var(--a-amber)]">{counts.open} open</span></span>}
          {counts.in_progress > 0 && <span> · <span className="text-[var(--a-cyan)]">{counts.in_progress} in progress</span></span>}
          {counts.resolved > 0 && <span> · <span className="text-[var(--a-em-deep)]">{counts.resolved} resolved</span></span>}
        </div>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors hover:brightness-95" style={{ background: 'var(--a-em)', color: '#04140D' }}>
          <Plus className="h-4 w-4" /> New ticket
        </button>
      </div>

      {createOpen && (
        <CreateTicketModal
          onClose={() => setCreateOpen(false)}
          onCreated={async () => { setCreateOpen(false); setPage(0); await fetchRequests(); onChanged(); }}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
          <input
            type="text"
            placeholder="Search message, email, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] pl-10 pr-4 py-2.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="appearance-none rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-4 py-2.5 text-sm text-[var(--a-ink)] focus:outline-none focus:border-[var(--a-em-line)]"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={userTypeFilter}
          onChange={(e) => setUserTypeFilter(e.target.value)}
          className="appearance-none rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-4 py-2.5 text-sm text-[var(--a-ink)] focus:outline-none focus:border-[var(--a-em-line)]"
        >
          <option value="">All Users</option>
          <option value="agency">Agency</option>
          <option value="client">Client</option>
        </select>
      </div>

      <div className="a-panel">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 blur-2xl bg-[var(--a-em-soft)] rounded-full" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--a-em-soft)] border border-[var(--a-em-line)]">
                <LifeBuoy className="h-7 w-7 text-[var(--a-dim)]" />
              </div>
            </div>
            <p className="text-sm text-[var(--a-muted)]">No support requests found</p>
            <p className="text-xs text-[var(--a-dim)] mt-1">Escalations from the help widget will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--a-line)]" style={{ background: '#F8FCFA' }}>
                  <th className="text-left text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] px-5 py-3.5">Time</th>
                  <th className="text-left text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] px-4 py-3.5">User</th>
                  <th className="text-left text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] px-4 py-3.5">Type</th>
                  <th className="text-left text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] px-4 py-3.5">Message</th>
                  <th className="text-center text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-line)]">
                {requests.map((req) => {
                  const ss = supportStatusStyle(req.status);
                  const ts = typeStyle(req.user_type);
                  const isExpanded = expandedId === req.id;
                  const isSaving = savingId === req.id;
                  return (
                    <>
                      <tr
                        key={req.id}
                        className="hover:bg-[#F6FCF9] transition-colors cursor-pointer"
                        style={isExpanded ? { background: '#F6FCF9' } : undefined}
                        onClick={() => toggleRow(req)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-[var(--a-dim)]" />
                            <span className="text-xs text-[var(--a-muted)]">{timeAgo(req.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {req.user_type === 'client' ? <User className="h-3 w-3 text-[var(--a-dim)]" /> : <Building2 className="h-3 w-3 text-[var(--a-dim)]" />}
                            <span className="text-xs text-[var(--a-ink)] truncate max-w-[160px]">{req.display_name || 'Unknown'}</span>
                            {req.source === 'admin' && <span className="text-[8.5px] px-1.5 py-0.5 rounded-full border font-medium shrink-0" style={{ color: 'var(--a-em-deep)', background: 'var(--a-em-soft)', borderColor: 'var(--a-em-line)' }}>Manual</span>}
                          </div>
                          {req.user_email && <span className="text-[10px] text-[var(--a-dim)] truncate block max-w-[180px]">{req.user_email}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: ts.bg, borderColor: ts.border, color: ts.color }}>
                            {ts.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-[var(--a-muted)] truncate max-w-[280px]">
                            {req.message?.slice(0, 90)}{req.message?.length > 90 ? '...' : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: ss.bg, borderColor: ss.border, color: ss.color }}>
                            {ss.label}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${req.id}-detail`} style={{ background: '#F6FCF9' }}>
                          <td colSpan={5} className="px-5 py-0">
                            <div className="py-4 border-t border-[var(--a-line)]">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 space-y-4">
                                  <div>
                                    <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Message</h4>
                                    <pre className="text-[12px] text-[var(--a-ink)] font-sans leading-relaxed whitespace-pre-wrap bg-[var(--a-card)] rounded-xl px-4 py-3 border border-[var(--a-line)] max-h-[300px] overflow-y-auto">
                                      {req.message}
                                    </pre>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Set Status</h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {SUPPORT_STATUS_OPTIONS.map(opt => {
                                        const s = supportStatusStyle(opt.value);
                                        const active = req.status === opt.value;
                                        return (
                                          <button
                                            key={opt.value}
                                            onClick={(e) => { e.stopPropagation(); if (!active) patchRequest(req.id, { status: opt.value }); }}
                                            disabled={isSaving || active}
                                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default"
                                            style={{
                                              backgroundColor: active ? s.bg : 'transparent',
                                              borderColor: active ? s.border : 'var(--a-line-2)',
                                              color: active ? s.color : 'var(--a-muted)',
                                            }}
                                          >
                                            {active && <Check className="h-3 w-3" />}
                                            {opt.label}
                                          </button>
                                        );
                                      })}
                                      {isSaving && <Loader className="h-3.5 w-3.5 animate-spin text-[var(--a-dim)]" />}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Internal Notes</h4>
                                    <textarea
                                      value={noteDraft}
                                      onChange={(e) => setNoteDraft(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      rows={3}
                                      placeholder="Notes for your own reference (not shown to the user)..."
                                      className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-3 py-2.5 text-xs text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)] resize-none"
                                    />
                                    <div className="mt-2 flex justify-end">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); patchRequest(req.id, { admin_notes: noteDraft }); }}
                                        disabled={isSaving || noteDraft === (req.admin_notes || '')}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--a-em-soft)] border border-[var(--a-em-line)] px-3 py-1.5 text-xs font-medium text-[var(--a-em-deep)] transition-colors hover:bg-[var(--a-em-line)] disabled:opacity-40 disabled:cursor-default"
                                      >
                                        {isSaving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                        Save Notes
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Details</h4>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Received</span><span className="text-[var(--a-ink)] text-right">{formatDateTime(req.created_at)}</span></div>
                                    <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">User type</span><span className="text-[var(--a-ink)] capitalize">{req.user_type || 'unknown'}</span></div>
                                    {req.display_name && <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">{req.user_type === 'client' ? 'Business' : 'Agency'}</span><span className="text-[var(--a-ink)] text-right truncate max-w-[150px]">{req.display_name}</span></div>}
                                    {req.user_email && <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Email</span><span className="text-[var(--a-ink)] text-right truncate max-w-[150px]">{req.user_email}</span></div>}
                                    <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Source</span><span className="text-[var(--a-ink)]">{req.source || 'widget'}</span></div>
                                    <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Status</span><span style={{ color: ss.color }}>{ss.label}</span></div>
                                    {req.resolved_at && <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Resolved</span><span className="text-[var(--a-ink)] text-right">{formatDateTime(req.resolved_at)}</span></div>}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {req.agency_id && (
                                      <Link href={`/admin/agencies?expand=${req.agency_id}`} onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--a-em-soft)] border border-[var(--a-em-line)] px-3 py-1.5 text-xs font-medium text-[var(--a-em-deep)] transition-colors hover:bg-[var(--a-em-line)]">
                                        <Building2 className="h-3 w-3" /> Open agency <ExternalLink className="h-3 w-3" />
                                      </Link>
                                    )}
                                    {req.user_email && (
                                      <a href={`mailto:${req.user_email}`} onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--a-card)] border border-[var(--a-line-2)] px-3 py-1.5 text-xs font-medium text-[var(--a-muted)] transition-colors hover:bg-[var(--a-em-soft)]">
                                        <Mail className="h-3 w-3" /> Reply by email
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[var(--a-dim)]">Page {page + 1} of {totalPages} · {total} total</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--a-muted)] hover:bg-[var(--a-em-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ArrowLeft className="h-3 w-3" /> Prev
            </button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--a-muted)] hover:bg-[var(--a-em-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Next <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// FEEDBACK TAB
// ============================================================================
interface Feedback {
  id: string;
  agency_id: string | null;
  message: string;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  agency_name: string | null;
  agency_email: string | null;
}

const FEEDBACK_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'archived', label: 'Archived' },
];

function feedbackStatusStyle(status: string | null) {
  switch (status || 'new') {
    case 'new': return { color: 'var(--a-amber)', bg: 'var(--a-amber-soft)', border: 'var(--a-amber)', label: 'New' };
    case 'reviewed': return { color: 'var(--a-cyan)', bg: 'var(--a-cyan-soft)', border: 'var(--a-cyan)', label: 'Reviewed' };
    case 'archived': return { color: 'var(--a-muted)', bg: '#F1F5F3', border: 'var(--a-line-2)', label: 'Archived' };
    default: return { color: 'var(--a-muted)', bg: '#F1F5F3', border: 'var(--a-line-2)', label: status || 'new' };
  }
}

function FeedbackTab({ onChanged }: { onChanged: () => void }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ new: 0, reviewed: 0, archived: 0, total: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const limit = 30;

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', (page * limit).toString());
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`${getBackendUrl()}/api/admin/feedback?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch feedback');
      const data = await res.json();
      setItems(data.feedback || []);
      setTotal(data.total || 0);
      if (data.counts) setCounts(data.counts);
    } catch (e) {
      console.error('Feedback error:', e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);
  useEffect(() => { setPage(0); }, [statusFilter, search]);

  const totalPages = Math.ceil(total / limit);

  const toggleRow = (fb: Feedback) => {
    if (expandedId === fb.id) setExpandedId(null);
    else { setExpandedId(fb.id); setNoteDraft(fb.admin_notes || ''); }
  };

  const patchFeedback = async (id: string, body: { status?: string; admin_notes?: string }) => {
    setSavingId(id);
    try {
      const res = await fetch(`${getBackendUrl()}/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      setItems(prev => prev.map(f => (f.id === id ? { ...f, ...data.feedback } : f)));
      await fetchFeedback();
      onChanged();
    } catch (e) {
      console.error('Update feedback error:', e);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="mb-5 text-sm text-[var(--a-muted)]">
        {counts.total} submission{counts.total !== 1 ? 's' : ''}
        {counts.new > 0 && <span> · <span className="text-[var(--a-amber)]">{counts.new} new</span></span>}
        {counts.reviewed > 0 && <span> · <span className="text-[var(--a-cyan)]">{counts.reviewed} reviewed</span></span>}
        {counts.archived > 0 && <span> · <span className="text-[var(--a-muted)]">{counts.archived} archived</span></span>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
          <input
            type="text"
            placeholder="Search feedback message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] pl-10 pr-4 py-2.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="appearance-none rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-4 py-2.5 text-sm text-[var(--a-ink)] focus:outline-none focus:border-[var(--a-em-line)]"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="a-panel">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 blur-2xl bg-[var(--a-em-soft)] rounded-full" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--a-em-soft)] border border-[var(--a-em-line)]">
                <MessageSquare className="h-7 w-7 text-[var(--a-dim)]" />
              </div>
            </div>
            <p className="text-sm text-[var(--a-muted)]">No feedback found</p>
            <p className="text-xs text-[var(--a-dim)] mt-1">Submissions from Settings &gt; Feedback will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--a-line)]" style={{ background: '#F8FCFA' }}>
                  <th className="text-left text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] px-5 py-3.5">Time</th>
                  <th className="text-left text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] px-4 py-3.5">Agency</th>
                  <th className="text-left text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] px-4 py-3.5">Feedback</th>
                  <th className="text-center text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-line)]">
                {items.map((fb) => {
                  const fs = feedbackStatusStyle(fb.status);
                  const isExpanded = expandedId === fb.id;
                  const isSaving = savingId === fb.id;
                  return (
                    <>
                      <tr
                        key={fb.id}
                        className="hover:bg-[#F6FCF9] transition-colors cursor-pointer"
                        style={isExpanded ? { background: '#F6FCF9' } : undefined}
                        onClick={() => toggleRow(fb)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-[var(--a-dim)]" />
                            <span className="text-xs text-[var(--a-muted)]">{timeAgo(fb.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-[var(--a-dim)]" />
                            <span className="text-xs text-[var(--a-ink)] truncate max-w-[160px]">{fb.agency_name || 'Unknown'}</span>
                          </div>
                          {fb.agency_email && <span className="text-[10px] text-[var(--a-dim)] truncate block max-w-[180px]">{fb.agency_email}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-[var(--a-muted)] truncate max-w-[320px]">
                            {fb.message?.slice(0, 100)}{fb.message?.length > 100 ? '...' : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: fs.bg, borderColor: fs.border, color: fs.color }}>
                            {fs.label}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${fb.id}-detail`} style={{ background: '#F6FCF9' }}>
                          <td colSpan={4} className="px-5 py-0">
                            <div className="py-4 border-t border-[var(--a-line)]">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 space-y-4">
                                  <div>
                                    <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Feedback</h4>
                                    <pre className="text-[12px] text-[var(--a-ink)] font-sans leading-relaxed whitespace-pre-wrap bg-[var(--a-card)] rounded-xl px-4 py-3 border border-[var(--a-line)] max-h-[300px] overflow-y-auto">
                                      {fb.message}
                                    </pre>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Set Status</h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {FEEDBACK_STATUS_OPTIONS.map(opt => {
                                        const s = feedbackStatusStyle(opt.value);
                                        const active = (fb.status || 'new') === opt.value;
                                        return (
                                          <button
                                            key={opt.value}
                                            onClick={(e) => { e.stopPropagation(); if (!active) patchFeedback(fb.id, { status: opt.value }); }}
                                            disabled={isSaving || active}
                                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default"
                                            style={{
                                              backgroundColor: active ? s.bg : 'transparent',
                                              borderColor: active ? s.border : 'var(--a-line-2)',
                                              color: active ? s.color : 'var(--a-muted)',
                                            }}
                                          >
                                            {active && <Check className="h-3 w-3" />}
                                            {opt.label}
                                          </button>
                                        );
                                      })}
                                      {isSaving && <Loader className="h-3.5 w-3.5 animate-spin text-[var(--a-dim)]" />}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Internal Notes</h4>
                                    <textarea
                                      value={noteDraft}
                                      onChange={(e) => setNoteDraft(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      rows={3}
                                      placeholder="Notes for your own reference..."
                                      className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-3 py-2.5 text-xs text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)] resize-none"
                                    />
                                    <div className="mt-2 flex justify-end">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); patchFeedback(fb.id, { admin_notes: noteDraft }); }}
                                        disabled={isSaving || noteDraft === (fb.admin_notes || '')}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--a-em-soft)] border border-[var(--a-em-line)] px-3 py-1.5 text-xs font-medium text-[var(--a-em-deep)] transition-colors hover:bg-[var(--a-em-line)] disabled:opacity-40 disabled:cursor-default"
                                      >
                                        {isSaving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                        Save Notes
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] mb-2">Details</h4>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Received</span><span className="text-[var(--a-ink)] text-right">{formatDateTime(fb.created_at)}</span></div>
                                    {fb.agency_name && <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Agency</span><span className="text-[var(--a-ink)] text-right truncate max-w-[150px]">{fb.agency_name}</span></div>}
                                    {fb.agency_email && <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Email</span><span className="text-[var(--a-ink)] text-right truncate max-w-[150px]">{fb.agency_email}</span></div>}
                                    <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Status</span><span style={{ color: fs.color }}>{fs.label}</span></div>
                                    {fb.reviewed_at && <div className="flex items-center justify-between gap-3"><span className="text-[var(--a-dim)]">Reviewed</span><span className="text-[var(--a-ink)] text-right">{formatDateTime(fb.reviewed_at)}</span></div>}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {fb.agency_id && (
                                      <Link href={`/admin/agencies?expand=${fb.agency_id}`} onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--a-em-soft)] border border-[var(--a-em-line)] px-3 py-1.5 text-xs font-medium text-[var(--a-em-deep)] transition-colors hover:bg-[var(--a-em-line)]">
                                        <Building2 className="h-3 w-3" /> Open agency <ExternalLink className="h-3 w-3" />
                                      </Link>
                                    )}
                                    {fb.agency_email && (
                                      <a href={`mailto:${fb.agency_email}`} onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--a-card)] border border-[var(--a-line-2)] px-3 py-1.5 text-xs font-medium text-[var(--a-muted)] transition-colors hover:bg-[var(--a-em-soft)]">
                                        <Mail className="h-3 w-3" /> Reply by email
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[var(--a-dim)]">Page {page + 1} of {totalPages} · {total} total</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--a-muted)] hover:bg-[var(--a-em-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ArrowLeft className="h-3 w-3" /> Prev
            </button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--a-muted)] hover:bg-[var(--a-em-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Next <ArrowRight className="h-3 w-3" />
            </button>
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
            <h3 className="text-[15px] font-semibold text-[var(--a-ink)]">New support ticket</h3>
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
            {submitting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Create ticket
          </button>
        </div>
      </div>
    </div>
  );
}