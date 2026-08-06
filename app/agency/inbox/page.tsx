'use client';

// ============================================================================
// AGENCY INBOX (client / prospect -> agency messages)
// Destination: app/agency/inbox/page.tsx
// ----------------------------------------------------------------------------
// One-tier-down mirror of the admin Support page. Lists messages sent to THIS
// agency from its clients (dashboard "Contact your agency") and prospects (the
// marketing-site support widget), with status (new / in_progress / resolved)
// and private agency notes. Reply is a mailto: / tel: / sms: link (the agency
// reaches out on their own); the app sends no email or SMS from here.
//
// Reads/writes:
//   GET   /api/agency/:agencyId/support-requests
//   PATCH /api/agency/:agencyId/support-requests/:id
// Auth: the agency auth_token. Backend enforces caller-owns-:agencyId.
//
// Styled with the agency theme tokens (useTheme + branding primary), NOT the
// admin emerald tokens, so it inherits each agency's white-label palette.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Inbox, Search, Loader2, Loader, Clock, Building2, User, Mail, Phone,
  MessageSquare, ArrowLeft, ArrowRight, Check, Globe,
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';

interface SupportRequest {
  id: string;
  agency_id: string;
  client_id: string | null;
  user_type: string | null;
  requester_name: string | null;
  contact: string | null;
  message: string;
  source: string | null;
  status: string;
  agency_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

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
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const c = (hex || '#10b981').replace('#', '');
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(16,185,129,${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const isEmail = (c: string | null): boolean => !!c && c.includes('@');
const telHref = (c: string): string => `tel:${c.replace(/[^\d+]/g, '')}`;
const smsHref = (c: string): string => `sms:${c.replace(/[^\d+]/g, '')}`;

export default function AgencyInboxPage() {
  const { agency, loading: agencyLoading } = useAgency();
  const theme = useTheme();
  // The agency theme may not expose a success token; fall back to a fixed green.
  const successColor = (theme as any).success || '#10b981';

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ new: 0, in_progress: 0, resolved: 0, total: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const limit = 30;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const agencyId = agency?.id;

  // Status chip colors. Fixed accessible accents (amber / blue) plus the
  // theme's success green for resolved, so they read on light or dark.
  const statusStyle = (status: string) => {
    switch (status) {
      case 'new':
        return { color: '#b45309', bg: hexToRgba('#f59e0b', theme.isDark ? 0.16 : 0.12), border: hexToRgba('#f59e0b', 0.5), label: 'New' };
      case 'in_progress':
        return { color: '#1d4ed8', bg: hexToRgba('#3b82f6', theme.isDark ? 0.16 : 0.12), border: hexToRgba('#3b82f6', 0.5), label: 'In Progress' };
      case 'resolved':
        return { color: successColor, bg: hexToRgba(successColor, theme.isDark ? 0.16 : 0.12), border: hexToRgba(successColor, 0.5), label: 'Resolved' };
      default:
        return { color: theme.textMuted, bg: hexToRgba('#94a3b8', 0.12), border: theme.border, label: status };
    }
  };

  const typeStyle = (userType: string | null) => {
    if (userType === 'client') {
      return { color: theme.primary, bg: hexToRgba(theme.primary, 0.12), border: hexToRgba(theme.primary, 0.4), label: 'Client' };
    }
    return { color: '#7c3aed', bg: hexToRgba('#8b5cf6', 0.12), border: hexToRgba('#8b5cf6', 0.4), label: 'Prospect' };
  };

  const fetchRequests = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', (page * limit).toString());
      if (statusFilter) params.set('status', statusFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      if (search) params.set('search', search);
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/support-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      if (data.counts) setCounts(data.counts);
    } catch (e) {
      console.error('Inbox fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [agencyId, backendUrl, page, statusFilter, sourceFilter, search]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { setPage(0); }, [statusFilter, sourceFilter, search]);

  const totalPages = Math.ceil(total / limit);

  const toggleRow = (req: SupportRequest) => {
    if (expandedId === req.id) setExpandedId(null);
    else { setExpandedId(req.id); setNoteDraft(req.agency_notes || ''); }
  };

  const patchRequest = async (id: string, body: { status?: string; agency_notes?: string }) => {
    if (!agencyId) return;
    setSavingId(id);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/support-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchRequests();
    } catch (e) {
      console.error('Inbox update error:', e);
    } finally {
      setSavingId(null);
    }
  };

  const cardBorder = theme.border;
  const panelStyle: React.CSSProperties = {
    backgroundColor: theme.card,
    border: `1px solid ${cardBorder}`,
    borderRadius: 16,
    overflow: 'hidden',
  };
  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : theme.card,
    border: `1px solid ${cardBorder}`,
    color: theme.text,
  };

  if (agencyLoading || !agency) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8" style={{ backgroundColor: theme.bg, minHeight: '100vh' }}>
      <div className="mb-5 max-w-[1400px]">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Inbox</h1>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
          Messages from your clients and website visitors. Reach out to them directly to follow up.
        </p>
      </div>

      {/* Summary line */}
      <div className="mb-5 text-sm max-w-[1400px]" style={{ color: theme.textMuted }}>
        {counts.total} message{counts.total !== 1 ? 's' : ''}
        {counts.new > 0 && <span> · <span style={{ color: '#b45309' }}>{counts.new} new</span></span>}
        {counts.in_progress > 0 && <span> · <span style={{ color: '#1d4ed8' }}>{counts.in_progress} in progress</span></span>}
        {counts.resolved > 0 && <span> · <span style={{ color: successColor }}>{counts.resolved} resolved</span></span>}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-[1400px]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
          <input
            type="text"
            placeholder="Search message, contact, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
            style={inputStyle}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="appearance-none rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle}>
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          className="appearance-none rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle}>
          <option value="">All Sources</option>
          <option value="client_dashboard">Clients</option>
          <option value="marketing_site">Website</option>
        </select>
      </div>

      <div className="max-w-[1400px]" style={panelStyle}>
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-flex mb-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: hexToRgba(theme.primary, 0.1), border: `1px solid ${hexToRgba(theme.primary, 0.25)}` }}>
                <Inbox className="h-7 w-7" style={{ color: theme.primary }} />
              </div>
            </div>
            <p className="text-sm" style={{ color: theme.textMuted }}>No messages yet</p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              Messages from your clients and website visitors will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${cardBorder}`, background: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}>
                  <th className="text-left text-[10px] font-medium uppercase tracking-[0.1em] px-5 py-3.5" style={{ color: theme.textMuted }}>Time</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-[0.1em] px-4 py-3.5" style={{ color: theme.textMuted }}>From</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-[0.1em] px-4 py-3.5" style={{ color: theme.textMuted }}>Type</th>
                  <th className="text-left text-[10px] font-medium uppercase tracking-[0.1em] px-4 py-3.5" style={{ color: theme.textMuted }}>Message</th>
                  <th className="text-center text-[10px] font-medium uppercase tracking-[0.1em] px-4 py-3.5" style={{ color: theme.textMuted }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const ss = statusStyle(req.status);
                  const ts = typeStyle(req.user_type);
                  const isExpanded = expandedId === req.id;
                  const isSaving = savingId === req.id;
                  const rowBorder = `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`;
                  return (
                    <>
                      <tr
                        key={req.id}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: rowBorder, background: isExpanded ? hexToRgba(theme.primary, 0.04) : undefined }}
                        onClick={() => toggleRow(req)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" style={{ color: theme.textMuted }} />
                            <span className="text-xs" style={{ color: theme.textMuted }}>{timeAgo(req.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {req.user_type === 'client'
                              ? <User className="h-3 w-3" style={{ color: theme.textMuted }} />
                              : <Globe className="h-3 w-3" style={{ color: theme.textMuted }} />}
                            <span className="text-xs truncate max-w-[160px]" style={{ color: theme.text }}>{req.requester_name || 'Unknown'}</span>
                          </div>
                          {req.contact && <span className="text-[10px] truncate block max-w-[180px]" style={{ color: theme.textMuted }}>{req.contact}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: ts.bg, borderColor: ts.border, color: ts.color }}>
                            {ts.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs truncate max-w-[280px]" style={{ color: theme.textMuted }}>
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
                        <tr key={`${req.id}-detail`} style={{ background: hexToRgba(theme.primary, 0.04) }}>
                          <td colSpan={5} className="px-5 py-0">
                            <div className="py-4" style={{ borderTop: rowBorder }}>
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 space-y-4">
                                  <div>
                                    <h4 className="text-[10px] font-medium uppercase tracking-[0.1em] mb-2" style={{ color: theme.textMuted }}>Message</h4>
                                    <pre className="text-[12px] font-sans leading-relaxed whitespace-pre-wrap rounded-xl px-4 py-3 max-h-[300px] overflow-y-auto"
                                      style={{ color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardBorder}` }}>
                                      {req.message}
                                    </pre>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-medium uppercase tracking-[0.1em] mb-2" style={{ color: theme.textMuted }}>Set Status</h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {STATUS_OPTIONS.map(opt => {
                                        const s = statusStyle(opt.value);
                                        const active = req.status === opt.value;
                                        return (
                                          <button
                                            key={opt.value}
                                            onClick={(e) => { e.stopPropagation(); if (!active) patchRequest(req.id, { status: opt.value }); }}
                                            disabled={isSaving || active}
                                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default"
                                            style={{
                                              backgroundColor: active ? s.bg : 'transparent',
                                              borderColor: active ? s.border : cardBorder,
                                              color: active ? s.color : theme.textMuted,
                                            }}
                                          >
                                            {active && <Check className="h-3 w-3" />}
                                            {opt.label}
                                          </button>
                                        );
                                      })}
                                      {isSaving && <Loader className="h-3.5 w-3.5 animate-spin" style={{ color: theme.textMuted }} />}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-medium uppercase tracking-[0.1em] mb-2" style={{ color: theme.textMuted }}>Private Notes</h4>
                                    <textarea
                                      value={noteDraft}
                                      onChange={(e) => setNoteDraft(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      rows={3}
                                      placeholder="Notes for yourself (not shown to the sender)..."
                                      className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none resize-none"
                                      style={inputStyle}
                                    />
                                    <div className="mt-2 flex justify-end">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); patchRequest(req.id, { agency_notes: noteDraft }); }}
                                        disabled={isSaving || noteDraft === (req.agency_notes || '')}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-default"
                                        style={{ backgroundColor: hexToRgba(theme.primary, 0.12), border: `1px solid ${hexToRgba(theme.primary, 0.3)}`, color: theme.primary }}
                                      >
                                        {isSaving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                        Save Notes
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-medium uppercase tracking-[0.1em] mb-2" style={{ color: theme.textMuted }}>Details</h4>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Received</span><span className="text-right" style={{ color: theme.text }}>{formatDateTime(req.created_at)}</span></div>
                                    <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>From</span><span style={{ color: theme.text }}>{req.user_type === 'client' ? 'Client' : 'Website visitor'}</span></div>
                                    {req.requester_name && <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Name</span><span className="text-right truncate max-w-[150px]" style={{ color: theme.text }}>{req.requester_name}</span></div>}
                                    {req.contact && <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Contact</span><span className="text-right truncate max-w-[150px]" style={{ color: theme.text }}>{req.contact}</span></div>}
                                    <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Source</span><span style={{ color: theme.text }}>{req.source === 'client_dashboard' ? 'Client dashboard' : 'Website'}</span></div>
                                    <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Status</span><span style={{ color: ss.color }}>{ss.label}</span></div>
                                    {req.resolved_at && <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Resolved</span><span className="text-right" style={{ color: theme.text }}>{formatDateTime(req.resolved_at)}</span></div>}
                                  </div>

                                  {req.contact && (
                                    isEmail(req.contact) ? (
                                      <a href={`mailto:${req.contact}`} onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                                        style={{ backgroundColor: theme.card, border: `1px solid ${cardBorder}`, color: theme.text }}>
                                        <Mail className="h-3 w-3" /> Reply by email
                                      </a>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <a href={telHref(req.contact)} onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                                          style={{ backgroundColor: theme.card, border: `1px solid ${cardBorder}`, color: theme.text }}>
                                          <Phone className="h-3 w-3" /> Call
                                        </a>
                                        <a href={smsHref(req.contact)} onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                                          style={{ backgroundColor: theme.card, border: `1px solid ${cardBorder}`, color: theme.text }}>
                                          <MessageSquare className="h-3 w-3" /> Text
                                        </a>
                                      </div>
                                    )
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
        <div className="mt-4 flex items-center justify-between max-w-[1400px]">
          <p className="text-xs" style={{ color: theme.textMuted }}>Page {page + 1} of {totalPages} · {total} total</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              style={{ color: theme.textMuted }}>
              <ArrowLeft className="h-3 w-3" /> Prev
            </button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              style={{ color: theme.textMuted }}>
              Next <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}