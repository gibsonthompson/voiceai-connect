'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Search, Loader2, Filter, ChevronDown,
  ChevronRight, Check, X, Phone, Building2, Clock,
  ArrowLeft, ArrowRight
} from 'lucide-react';

interface SmsLogEntry {
  id: string;
  agency_id: string | null;
  agency_name: string | null;
  recipient_phone: string;
  recipient_type: string;
  message_type: string;
  message_body: string;
  delivery_status: string;
  metadata: any;
  created_at: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  activation_sms_1: { label: 'Activation 1', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  activation_sms_2: { label: 'Activation 2', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  activation_sms_3: { label: 'Activation 3', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  activation_sms_4: { label: 'Activation 4', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  activation_sms_5: { label: 'Activation 5', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  activation_sms_6: { label: 'Activation 6', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  activation_sms_7: { label: 'Activation 7', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  activation_sms_8: { label: 'Activation 8', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  activation_sms_9: { label: 'Activation 9', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  abandoned_cart_1: { label: 'Cart 1', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  abandoned_cart_2: { label: 'Cart 2', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  abandoned_cart_3: { label: 'Cart 3', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  abandoned_cart_4: { label: 'Cart 4', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  abandoned_cart_5: { label: 'Cart 5', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  trial_warning_day1: { label: 'Trial Day 1', color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
  trial_warning_day2: { label: 'Trial Day 2', color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
  trial_warning_day3: { label: 'Trial Day 3', color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
  demo_admin: { label: 'Demo Admin', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  demo_followup: { label: 'Demo Follow-up', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  demo_followup_industry: { label: 'Demo Industry', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  demo_followup_custom: { label: 'Demo Custom', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  onboarding_sms_1: { label: 'Onboard 1', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  onboarding_sms_2: { label: 'Onboard 2', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  onboarding_sms_3: { label: 'Onboard 3', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  onboarding_sms_4: { label: 'Onboard 4', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  onboarding_sms_5: { label: 'Onboard 5', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  onboarding_sms_6: { label: 'Onboard 6', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  onboarding_sms_7: { label: 'Onboard 7', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  onboarding_sms_8: { label: 'Onboard 8', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  onboarding_sms_9: { label: 'Onboard 9', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
};

function getTypeStyle(type: string) {
  return TYPE_LABELS[type] || { label: type.replace(/_/g, ' '), color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)' };
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'sent': case 'delivered': return { color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.15)' };
    case 'failed': case 'undelivered': return { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.15)' };
    default: return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)' };
  }
}

function formatPhone(phone: string): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  return phone;
}

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

export default function AdminSmsLogPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [types, setTypes] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const getToken = () => localStorage.getItem('admin_token');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const backendUrl = getBackendUrl();
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', (page * limit).toString());
      if (typeFilter) params.set('type', typeFilter);
      if (recipientFilter) params.set('recipient_type', recipientFilter);

      const response = await fetch(`${backendUrl}/api/admin/sms-log?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch SMS logs');

      const data = await response.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      if (data.types) setTypes(data.types);
    } catch (error) {
      console.error('SMS log error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, recipientFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  // Filter logs by search (client-side for phone/agency name)
  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.recipient_phone?.includes(q) ||
      log.agency_name?.toLowerCase().includes(q) ||
      log.message_type?.toLowerCase().includes(q) ||
      log.message_body?.toLowerCase().includes(q)
    );
  });

  // Stats
  const sentCount = logs.filter(l => l.delivery_status === 'sent' || l.delivery_status === 'delivered').length;
  const failedCount = logs.filter(l => l.delivery_status === 'failed').length;

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-white tracking-tight">SMS Log</h1>
        <p className="mt-1 text-sm text-white/40">
          {total} messages logged
          {sentCount > 0 && <span> · <span className="text-emerald-400">{sentCount} sent</span></span>}
          {failedCount > 0 && <span> · <span className="text-red-400">{failedCount} failed</span></span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
          <input
            type="text"
            placeholder="Search phone, agency, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30 transition-colors"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="appearance-none rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/30"
        >
          <option value="">All Types</option>
          {types.map(t => (
            <option key={t} value={t}>{getTypeStyle(t).label}</option>
          ))}
        </select>
        <select
          value={recipientFilter}
          onChange={(e) => { setRecipientFilter(e.target.value); setPage(0); }}
          className="appearance-none rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/30"
        >
          <option value="">All Recipients</option>
          <option value="agency_owner">Agency Owner</option>
          <option value="prospect">Prospect</option>
          <option value="client_owner">Client Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 blur-2xl bg-emerald-500/10 rounded-full" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <MessageSquare className="h-7 w-7 text-white/20" />
              </div>
            </div>
            <p className="text-sm text-white/50">No SMS logs found</p>
            <p className="text-xs text-white/30 mt-1">SMS will appear here as they're sent through the platform</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-5 py-3.5">Time</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Agency</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Recipient</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Type</th>
                  <th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Preview</th>
                  <th className="text-center text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredLogs.map((log) => {
                  const typeStyle = getTypeStyle(log.message_type);
                  const statusStyle = getStatusStyle(log.delivery_status);
                  const isExpanded = expandedId === log.id;

                  return (
                    <>
                      <tr
                        key={log.id}
                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-white/20" />
                            <span className="text-xs text-white/50">{timeAgo(log.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {log.agency_name ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-white/25" />
                              <span className="text-xs text-white/60 truncate max-w-[140px]">{log.agency_name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-white/25">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-white/25" />
                            <span className="text-xs text-white/50 tabular-nums">{formatPhone(log.recipient_phone)}</span>
                          </div>
                          <span className="text-[10px] text-white/25 capitalize">{log.recipient_type?.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: typeStyle.bg,
                              borderColor: `${typeStyle.color}20`,
                              color: typeStyle.color,
                            }}
                          >
                            {typeStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-white/40 truncate max-w-[250px]">
                            {log.message_body?.slice(0, 80)}{log.message_body?.length > 80 ? '...' : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: statusStyle.bg,
                              borderColor: statusStyle.border,
                              color: statusStyle.color,
                            }}
                          >
                            {log.delivery_status}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${log.id}-detail`}>
                          <td colSpan={6} className="px-5 py-0">
                            <div className="py-4 border-t border-white/[0.03]">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Full message */}
                                <div className="lg:col-span-2">
                                  <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Full Message</h4>
                                  <pre className="text-[12px] text-white/60 font-mono leading-relaxed whitespace-pre-wrap bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.03] max-h-[300px] overflow-y-auto">
                                    {log.message_body}
                                  </pre>
                                </div>

                                {/* Details */}
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Details</h4>
                                    <div className="space-y-1.5 text-xs">
                                      <div className="flex items-center justify-between">
                                        <span className="text-white/35">Sent</span>
                                        <span className="text-white/60">{formatDateTime(log.created_at)}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-white/35">Phone</span>
                                        <span className="text-white/60 tabular-nums">{log.recipient_phone}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-white/35">Type</span>
                                        <span className="text-white/60">{log.message_type}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-white/35">Recipient</span>
                                        <span className="text-white/60 capitalize">{log.recipient_type?.replace(/_/g, ' ')}</span>
                                      </div>
                                      {log.agency_name && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-white/35">Agency</span>
                                          <span className="text-white/60">{log.agency_name}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between">
                                        <span className="text-white/35">Status</span>
                                        <span style={{ color: statusStyle.color }}>{log.delivery_status}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div>
                                      <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] mb-2">Metadata</h4>
                                      <pre className="text-[11px] text-white/40 font-mono whitespace-pre-wrap bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.03]">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </pre>
                                    </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-white/30">
            Page {page + 1} of {totalPages} · {total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}