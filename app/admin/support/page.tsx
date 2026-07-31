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
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy, MessageSquare, Search, Loader2, Loader, Clock, Building2,
  User, Mail, ArrowLeft, ArrowRight, Check,
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
          ? { background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }
          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
      >
        <Icon className="h-4 w-4" />
        {label}
        {badge != null && badge > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-semibold"
            style={active
              ? { background: 'rgba(52,211,153,0.20)', color: '#34d399' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
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
        <h1 className="text-[22px] font-semibold text-white tracking-tight">Support &amp; Feedback</h1>
        <p className="mt-1 text-sm text-white/40">Inbound help-widget escalations and feedback submissions</p>
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
    case 'open': return { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.20)', label: 'Open' };
    case 'in_progress': return { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.20)', label: 'In Progress' };
    case 'resolved': return { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.20)', label: 'Resolved' };
    default: return { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', label: status };
  }
}

function typeStyle(userType: string | null) {
  if (userType === 'client') return { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', label: 'Client' };
  return { color: '#34d399', bg: 'rgba(52,211,153,0.08)', label: 'Agency' };
}

function SupportTab({ onChanged }: { onChanged: () => void }) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ open: 0, in_progress: 0, resolved: 0, total: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
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
      <div className="mb-5 text-sm text-white/40">
        {counts.total} request{counts.total !== 1 ? 's' : ''}
        {counts.open > 0 && <span> · <span className="text-amber-400">{counts.open} open</span></span>}
        {counts.in_progress > 0 && <span> · <span className="text-blue-400">{counts.in_progress} in progress</span></span>}
        {counts.resolved > 0 && <span> · <span className="text-emerald-400">{counts.resolved} resolved</span></span>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
          <input
            type="text"
            placeholder="Search message, email, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="appearance-none rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/30"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={userTypeFilter}
          onChange={(e) => setUserTypeFilter(e.target.value)}
          className="appearance-none rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/30"
        >
          <option value="">All Users</option>
          <option value="agency">Agency</option>
          <option value="client">Client</option>
        </select>
      </div>

      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 blur-2xl bg-emerald-500/10 rounded-full" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <LifeBuoy className="h-7 w-7 text-white/20" />
              </div>
            </div>
            <p className="text-sm text-white/50">No support requests found</p>
            <p className="text-xs text-white/30 mt-1">Escalations from the help widget will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-5 py-3.5">Time</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">User</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Type</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Message</th>
                  <th className="text-center text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {requests.map((req) => {
                  const ss = supportStatusStyle(req.status);
                  const ts = typeStyle(req.user_type);
                  const isExpanded = expandedId === req.id;
                  const isSaving = savingId === req.id;
                  return (
                    <>
                      <tr
                        key={req.id}
                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                        onClick={() => toggleRow(req)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-white/20" />
                            <span className="text-xs text-white/50">{timeAgo(req.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {req.user_type === 'client' ? <User className="h-3 w-3 text-white/25" /> : <Building2 className="h-3 w-3 text-white/25" />}
                            <span className="text-xs text-white/60 truncate max-w-[160px]">{req.display_name || 'Unknown'}</span>
                          </div>
                          {req.user_email && <span className="text-[10px] text-white/25 truncate block max-w-[180px]">{req.user_email}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: ts.bg, borderColor: `${ts.color}20`, color: ts.color }}>
                            {ts.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-white/40 truncate max-w-[280px]">
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
                        <tr key={`${req.id}-detail`}>
                          <td colSpan={5} className="px-5 py-0">
                            <div className="py-4 border-t border-white/[0.03]">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 space-y-4">
                                  <div>
                                    <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Message</h4>
                                    <pre className="text-[12px] text-white/70 font-sans leading-relaxed whitespace-pre-wrap bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.03] max-h-[300px] overflow-y-auto">
                                      {req.message}
                                    </pre>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Set Status</h4>
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
                                              borderColor: active ? s.border : 'rgba(255,255,255,0.08)',
                                              color: active ? s.color : 'rgba(255,255,255,0.55)',
                                            }}
                                          >
                                            {active && <Check className="h-3 w-3" />}
                                            {opt.label}
                                          </button>
                                        );
                                      })}
                                      {isSaving && <Loader className="h-3.5 w-3.5 animate-spin text-white/30" />}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Internal Notes</h4>
                                    <textarea
                                      value={noteDraft}
                                      onChange={(e) => setNoteDraft(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      rows={3}
                                      placeholder="Notes for your own reference (not shown to the user)..."
                                      className="w-full rounded-xl bg-white/[0.02] border border-white/[0.06] px-3 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30 resize-none"
                                    />
                                    <div className="mt-2 flex justify-end">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); patchRequest(req.id, { admin_notes: noteDraft }); }}
                                        disabled={isSaving || noteDraft === (req.admin_notes || '')}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/15 disabled:opacity-40 disabled:cursor-default"
                                      >
                                        {isSaving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                        Save Notes
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Details</h4>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between gap-3"><span className="text-white/35">Received</span><span className="text-white/60 text-right">{formatDateTime(req.created_at)}</span></div>
                                    <div className="flex items-center justify-between gap-3"><span className="text-white/35">User type</span><span className="text-white/60 capitalize">{req.user_type || 'unknown'}</span></div>
                                    {req.display_name && <div className="flex items-center justify-between gap-3"><span className="text-white/35">{req.user_type === 'client' ? 'Business' : 'Agency'}</span><span className="text-white/60 text-right truncate max-w-[150px]">{req.display_name}</span></div>}
                                    {req.user_email && <div className="flex items-center justify-between gap-3"><span className="text-white/35">Email</span><span className="text-white/60 text-right truncate max-w-[150px]">{req.user_email}</span></div>}
                                    <div className="flex items-center justify-between gap-3"><span className="text-white/35">Source</span><span className="text-white/60">{req.source || 'widget'}</span></div>
                                    <div className="flex items-center justify-between gap-3"><span className="text-white/35">Status</span><span style={{ color: ss.color }}>{ss.label}</span></div>
                                    {req.resolved_at && <div className="flex items-center justify-between gap-3"><span className="text-white/35">Resolved</span><span className="text-white/60 text-right">{formatDateTime(req.resolved_at)}</span></div>}
                                  </div>
                                  {req.user_email && (
                                    <a href={`mailto:${req.user_email}`} onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.06]">
                                      <Mail className="h-3 w-3" /> Reply by email
                                    </a>
                                  )}
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
          <p className="text-xs text-white/30">Page {page + 1} of {totalPages} · {total} total</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ArrowLeft className="h-3 w-3" /> Prev
            </button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
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
    case 'new': return { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.20)', label: 'New' };
    case 'reviewed': return { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.20)', label: 'Reviewed' };
    case 'archived': return { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', label: 'Archived' };
    default: return { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', label: status || 'new' };
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
      <div className="mb-5 text-sm text-white/40">
        {counts.total} submission{counts.total !== 1 ? 's' : ''}
        {counts.new > 0 && <span> · <span className="text-amber-400">{counts.new} new</span></span>}
        {counts.reviewed > 0 && <span> · <span className="text-blue-400">{counts.reviewed} reviewed</span></span>}
        {counts.archived > 0 && <span> · <span className="text-white/50">{counts.archived} archived</span></span>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
          <input
            type="text"
            placeholder="Search feedback message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="appearance-none rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/30"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 blur-2xl bg-emerald-500/10 rounded-full" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <MessageSquare className="h-7 w-7 text-white/20" />
              </div>
            </div>
            <p className="text-sm text-white/50">No feedback found</p>
            <p className="text-xs text-white/30 mt-1">Submissions from Settings &gt; Feedback will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-5 py-3.5">Time</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Agency</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Feedback</th>
                  <th className="text-center text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {items.map((fb) => {
                  const fs = feedbackStatusStyle(fb.status);
                  const isExpanded = expandedId === fb.id;
                  const isSaving = savingId === fb.id;
                  return (
                    <>
                      <tr
                        key={fb.id}
                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                        onClick={() => toggleRow(fb)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-white/20" />
                            <span className="text-xs text-white/50">{timeAgo(fb.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-white/25" />
                            <span className="text-xs text-white/60 truncate max-w-[160px]">{fb.agency_name || 'Unknown'}</span>
                          </div>
                          {fb.agency_email && <span className="text-[10px] text-white/25 truncate block max-w-[180px]">{fb.agency_email}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-white/40 truncate max-w-[320px]">
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
                        <tr key={`${fb.id}-detail`}>
                          <td colSpan={4} className="px-5 py-0">
                            <div className="py-4 border-t border-white/[0.03]">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 space-y-4">
                                  <div>
                                    <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Feedback</h4>
                                    <pre className="text-[12px] text-white/70 font-sans leading-relaxed whitespace-pre-wrap bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.03] max-h-[300px] overflow-y-auto">
                                      {fb.message}
                                    </pre>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Set Status</h4>
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
                                              borderColor: active ? s.border : 'rgba(255,255,255,0.08)',
                                              color: active ? s.color : 'rgba(255,255,255,0.55)',
                                            }}
                                          >
                                            {active && <Check className="h-3 w-3" />}
                                            {opt.label}
                                          </button>
                                        );
                                      })}
                                      {isSaving && <Loader className="h-3.5 w-3.5 animate-spin text-white/30" />}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Internal Notes</h4>
                                    <textarea
                                      value={noteDraft}
                                      onChange={(e) => setNoteDraft(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      rows={3}
                                      placeholder="Notes for your own reference..."
                                      className="w-full rounded-xl bg-white/[0.02] border border-white/[0.06] px-3 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30 resize-none"
                                    />
                                    <div className="mt-2 flex justify-end">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); patchFeedback(fb.id, { admin_notes: noteDraft }); }}
                                        disabled={isSaving || noteDraft === (fb.admin_notes || '')}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/15 disabled:opacity-40 disabled:cursor-default"
                                      >
                                        {isSaving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                        Save Notes
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Details</h4>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between gap-3"><span className="text-white/35">Received</span><span className="text-white/60 text-right">{formatDateTime(fb.created_at)}</span></div>
                                    {fb.agency_name && <div className="flex items-center justify-between gap-3"><span className="text-white/35">Agency</span><span className="text-white/60 text-right truncate max-w-[150px]">{fb.agency_name}</span></div>}
                                    {fb.agency_email && <div className="flex items-center justify-between gap-3"><span className="text-white/35">Email</span><span className="text-white/60 text-right truncate max-w-[150px]">{fb.agency_email}</span></div>}
                                    <div className="flex items-center justify-between gap-3"><span className="text-white/35">Status</span><span style={{ color: fs.color }}>{fs.label}</span></div>
                                    {fb.reviewed_at && <div className="flex items-center justify-between gap-3"><span className="text-white/35">Reviewed</span><span className="text-white/60 text-right">{formatDateTime(fb.reviewed_at)}</span></div>}
                                  </div>
                                  {fb.agency_email && (
                                    <a href={`mailto:${fb.agency_email}`} onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.06]">
                                      <Mail className="h-3 w-3" /> Reply by email
                                    </a>
                                  )}
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
          <p className="text-xs text-white/30">Page {page + 1} of {totalPages} · {total} total</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ArrowLeft className="h-3 w-3" /> Prev
            </button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Next <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}