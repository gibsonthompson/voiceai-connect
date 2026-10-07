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
  Inbox, Search, Loader2, Loader, User, Mail, Phone,
  MessageSquare, ArrowLeft, ArrowRight, Check, Globe,
} from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';
import PlatformMessages from '@/components/agency/PlatformMessages';
import AgencyClientThread from '@/components/agency/AgencyClientThread';

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
  const [channel, setChannel] = useState<'clients' | 'platform'>('clients');
  const [platformUnread, setPlatformUnread] = useState(0);

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

  // Platform (VoiceAI Connect) unread, for the channel toggle badge. Kept in
  // sync by PlatformMessages via onUnreadChange once that channel is open.
  useEffect(() => {
    if (!agencyId) return;
    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${backendUrl}/api/agency/${agencyId}/platform-threads`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); setPlatformUnread(d.unread_total || 0); }
      } catch { /* non-blocking */ }
    })();
  }, [agencyId, backendUrl]);

  // Deep link from the dashboard nudge: /agency/inbox?channel=platform opens
  // straight on the VoiceAI Connect channel.
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('channel') === 'platform') setChannel('platform');
    } catch { /* ignore */ }
  }, []);

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
      <div className="flex items-start gap-3 mb-5 max-w-[1400px]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.primary15 }}><Inbox className="h-5 w-5" style={{ color: theme.primary }} /></div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Inbox</h1>
          <p className="mt-0.5 text-sm" style={{ color: theme.textMuted }}>
            Messages from your clients and website visitors, and from VoiceAI Connect.
          </p>
        </div>
      </div>

      {/* Channel toggle: client/prospect inbox vs two-way platform threads */}
      <div className="mb-5 flex items-center gap-2 max-w-[1400px]">
        {([
          { key: 'clients', label: 'From clients' },
          { key: 'platform', label: 'VoiceAI Connect' },
        ] as const).map((opt) => {
          const active = channel === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setChannel(opt.key)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              style={active
                ? { backgroundColor: theme.primary, color: '#fff' }
                : { backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}` }}
            >
              {opt.label}
              {opt.key === 'platform' && platformUnread > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: active ? 'rgba(255,255,255,0.25)' : theme.primary, color: '#fff' }}>
                  {platformUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {channel === 'platform' && (
        <PlatformMessages agencyId={agencyId as string} backendUrl={backendUrl} onUnreadChange={setPlatformUnread} />
      )}

      {channel === 'clients' && (() => {
        const openReq = expandedId ? requests.find((r) => r.id === expandedId) || null : null;

        // ---- Message detail (same panel + back-button layout as VoiceAI Connect) ----
        if (openReq) {
          const req = openReq;
          const ss = statusStyle(req.status);
          const isSaving = savingId === req.id;
          const isClient = req.user_type === 'client' || req.source === 'client_login';
          const sourceLabel = req.source === 'client_dashboard' ? 'Client dashboard' : req.source === 'client_login' ? 'Login page' : 'Website';
          return (
            <div className="max-w-[1400px]" style={panelStyle}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <button onClick={() => setExpandedId(null)} className="inline-flex items-center gap-1.5 text-sm" style={{ color: theme.textMuted }}>
                  <ArrowLeft className="h-4 w-4" /> All messages
                </button>
                <div className="ml-auto inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                  style={{ color: isClient ? theme.primary : '#7c3aed', backgroundColor: isClient ? hexToRgba(theme.primary, 0.1) : hexToRgba('#8b5cf6', 0.12), border: `1px solid ${isClient ? hexToRgba(theme.primary, 0.3) : hexToRgba('#8b5cf6', 0.4)}` }}>
                  {isClient ? <User className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />} {sourceLabel}
                </div>
              </div>

              <div className="px-4 py-4 max-h-[min(72vh,680px)] overflow-y-auto">
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
                              onClick={() => { if (!active) patchRequest(req.id, { status: opt.value }); }}
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
                        rows={3}
                        placeholder="Notes for yourself (not shown to the sender)..."
                        className="w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none resize-none"
                        style={inputStyle}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => patchRequest(req.id, { agency_notes: noteDraft })}
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
                      <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>From</span><span style={{ color: theme.text }}>{isClient ? 'Client' : 'Website visitor'}</span></div>
                      {req.requester_name && <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Name</span><span className="text-right truncate max-w-[150px]" style={{ color: theme.text }}>{req.requester_name}</span></div>}
                      {req.contact && <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Contact</span><span className="text-right truncate max-w-[150px]" style={{ color: theme.text }}>{req.contact}</span></div>}
                      <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Source</span><span style={{ color: theme.text }}>{sourceLabel}</span></div>
                      <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Status</span><span style={{ color: ss.color }}>{ss.label}</span></div>
                      {req.resolved_at && <div className="flex items-center justify-between gap-3"><span style={{ color: theme.textMuted }}>Resolved</span><span className="text-right" style={{ color: theme.text }}>{formatDateTime(req.resolved_at)}</span></div>}
                    </div>

                    {req.contact && (
                      isEmail(req.contact) ? (
                        <a href={`mailto:${req.contact}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                          style={{ backgroundColor: theme.card, border: `1px solid ${cardBorder}`, color: theme.text }}>
                          <Mail className="h-3 w-3" /> Reply by email
                        </a>
                      ) : (
                        <div className="flex items-center gap-2">
                          <a href={telHref(req.contact)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                            style={{ backgroundColor: theme.card, border: `1px solid ${cardBorder}`, color: theme.text }}>
                            <Phone className="h-3 w-3" /> Call
                          </a>
                          <a href={smsHref(req.contact)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                            style={{ backgroundColor: theme.card, border: `1px solid ${cardBorder}`, color: theme.text }}>
                            <MessageSquare className="h-3 w-3" /> Text
                          </a>
                        </div>
                      )
                    )}
                  </div>
                </div>
                {(req.client_id || (req.contact && !isEmail(req.contact))) && (
                  <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${cardBorder}` }}>
                    <AgencyClientThread agencyId={agencyId as string} backendUrl={backendUrl} requestId={req.id} requesterName={req.requester_name} recipientKind={(req.user_type === 'client' || req.client_id) ? 'client' : 'visitor'} onReplied={fetchRequests} />
                  </div>
                )}
              </div>
            </div>
          );
        }

        // ---- Message list (same list-row style as VoiceAI Connect) ----
        return (
          <>
            <div className="mb-5 text-sm max-w-[1400px]" style={{ color: theme.textMuted }}>
              {counts.total} message{counts.total !== 1 ? 's' : ''}
              {counts.new > 0 && <span> · <span style={{ color: '#b45309' }}>{counts.new} new</span></span>}
              {counts.in_progress > 0 && <span> · <span style={{ color: '#1d4ed8' }}>{counts.in_progress} in progress</span></span>}
              {counts.resolved > 0 && <span> · <span style={{ color: successColor }}>{counts.resolved} resolved</span></span>}
            </div>

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
                <div className="divide-y" style={{ borderColor: cardBorder }}>
                  {requests.map((req) => {
                    const ss = statusStyle(req.status);
                    const isClient = req.user_type === 'client' || req.source === 'client_login';
                    const unread = req.status === 'new';
                    return (
                      <button key={req.id} onClick={() => toggleRow(req)}
                        className="w-full text-left px-4 py-4 flex items-start gap-3 transition-colors"
                        style={{ borderColor: cardBorder, backgroundColor: unread ? hexToRgba(theme.primary, 0.05) : 'transparent' }}>
                        <div className="mt-1.5">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: unread ? ss.color : 'transparent', border: unread ? 'none' : `1px solid ${theme.border}` }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isClient
                              ? <User className="h-3.5 w-3.5 shrink-0" style={{ color: theme.textMuted }} />
                              : <Globe className="h-3.5 w-3.5 shrink-0" style={{ color: theme.textMuted }} />}
                            <span className="text-sm font-medium truncate" style={{ color: theme.text }}>{req.requester_name || (isClient ? 'Client' : 'Website visitor')}</span>
                            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium shrink-0"
                              style={{ backgroundColor: ss.bg, borderColor: ss.border, color: ss.color }}>{ss.label}</span>
                            <span className="ml-auto text-[11px] shrink-0" style={{ color: theme.textMuted }}>{timeAgo(req.created_at)}</span>
                          </div>
                          <p className="text-sm mt-0.5 truncate" style={{ color: unread ? theme.text : theme.textMuted, fontWeight: unread ? 500 : 400 }}>{req.message}</p>
                          {req.contact && <p className="text-[11px] mt-0.5 truncate" style={{ color: theme.textMuted }}>{req.contact}</p>}
                        </div>
                      </button>
                    );
                  })}
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
          </>
        );
      })()}
    </div>
  );
}