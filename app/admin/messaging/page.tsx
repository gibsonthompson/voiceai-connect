'use client';

// ============================================================================
// MESSAGING (SMS Log + SMS Templates merged)
// One page, two tabs. Log is the platform-wide SMS delivery feed with filters
// and expandable detail. Templates is the editable message library grouped by
// category. Both reskinned to the emerald-on-white admin system and wired to
// the same endpoints the two original pages used:
//   GET  /api/admin/sms-log?limit&offset&type&recipient_type   -> { logs, total, types }
//   GET  /api/admin/sms-templates                              -> { categories, total }
//   PUT  /api/admin/sms-templates/:key       body { message }
//   POST /api/admin/sms-templates/:key/reset
// Type and delivery badges use the shared getSmsTypeLabel / getSmsDeliveryStyle.
// ============================================================================

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  MessageSquare, Search, Loader2, Save, RotateCcw, Check, AlertCircle,
  ChevronDown, ChevronRight, Eye, EyeOff, Phone, Building2, Clock,
  ArrowLeft, ArrowRight,
} from 'lucide-react';
import { formatPhone, timeAgo, formatDateTime } from '@/lib/admin/format';
import { getSmsTypeLabel, getSmsDeliveryStyle } from '@/lib/admin/status';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

// ============================================================================
// SMS LOG TAB
// ============================================================================
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

function SmsLogTab() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [types, setTypes] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', (page * limit).toString());
      if (typeFilter) params.set('type', typeFilter);
      if (recipientFilter) params.set('recipient_type', recipientFilter);

      const response = await fetch(`${backendUrl()}/api/admin/sms-log?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
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

  const sentCount = logs.filter(l => l.delivery_status === 'sent' || l.delivery_status === 'delivered').length;
  const failedCount = logs.filter(l => l.delivery_status === 'failed').length;

  return (
    <div>
      <p className="text-sm text-[var(--a-muted)] mb-5">
        {total.toLocaleString()} messages logged
        {sentCount > 0 && <span> &middot; <span style={{ color: 'var(--a-em-deep)' }}>{sentCount} sent</span></span>}
        {failedCount > 0 && <span> &middot; <span style={{ color: 'var(--a-red)' }}>{failedCount} failed</span></span>}
      </p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
          <input
            type="text"
            placeholder="Search phone, agency, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="a-input pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="a-input sm:w-[190px]"
        >
          <option value="">All Types</option>
          {types.map(t => (
            <option key={t} value={t}>{getSmsTypeLabel(t).label}</option>
          ))}
        </select>
        <select
          value={recipientFilter}
          onChange={(e) => { setRecipientFilter(e.target.value); setPage(0); }}
          className="a-input sm:w-[190px]"
        >
          <option value="">All Recipients</option>
          <option value="agency_owner">Agency Owner</option>
          <option value="prospect">Prospect</option>
          <option value="client_owner">Client Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="a-panel">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare className="h-7 w-7 mx-auto text-[var(--a-dim)] mb-3" />
            <p className="text-sm text-[var(--a-muted)]">No SMS logs found</p>
            <p className="text-xs text-[var(--a-dim)] mt-1">SMS will appear here as they are sent through the platform</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Agency</th>
                  <th>Recipient</th>
                  <th>Type</th>
                  <th>Preview</th>
                  <th className="r">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const typeStyle = getSmsTypeLabel(log.message_type);
                  const statusStyle = getSmsDeliveryStyle(log.delivery_status);
                  const isExpanded = expandedId === log.id;

                  return (
                    <Fragment key={log.id}>
                      <tr
                        className="cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-[var(--a-dim)]" />
                            <span className="text-[var(--a-muted)]">{timeAgo(log.created_at)}</span>
                          </div>
                        </td>
                        <td>
                          {log.agency_name ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-[var(--a-dim)]" />
                              <span className="text-[var(--a-ink)] truncate max-w-[140px]">{log.agency_name}</span>
                            </div>
                          ) : (
                            <span className="text-[var(--a-dim)]">{'\u2013'}</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-[var(--a-dim)]" />
                            <span className="text-[var(--a-ink)] a-num">{formatPhone(log.recipient_phone)}</span>
                          </div>
                          <span className="text-[10px] text-[var(--a-dim)] capitalize">{log.recipient_type?.replace(/_/g, ' ')}</span>
                        </td>
                        <td>
                          <span
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: typeStyle.bg, border: `1px solid ${typeStyle.border}`, color: typeStyle.color }}
                          >
                            {typeStyle.label}
                          </span>
                        </td>
                        <td>
                          <p className="text-[var(--a-muted)] truncate max-w-[250px]">
                            {log.message_body?.slice(0, 80)}{log.message_body?.length > 80 ? '...' : ''}
                          </p>
                        </td>
                        <td className="r">
                          <span
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.color }}
                          >
                            {statusStyle.label}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={6} style={{ background: '#F8FCFA' }}>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              {/* Full message */}
                              <div className="lg:col-span-2">
                                <p className="a-eyebrow mb-2">Full Message</p>
                                <pre className="text-[12px] text-[var(--a-muted)] font-mono leading-relaxed whitespace-pre-wrap bg-[var(--a-card)] rounded-xl px-4 py-3 border border-[var(--a-line)] max-h-[300px] overflow-y-auto">
                                  {log.message_body}
                                </pre>
                              </div>

                              {/* Details */}
                              <div className="space-y-3">
                                <div>
                                  <p className="a-eyebrow mb-2">Details</p>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[var(--a-dim)]">Sent</span>
                                      <span className="text-[var(--a-ink)]">{formatDateTime(log.created_at)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[var(--a-dim)]">Phone</span>
                                      <span className="text-[var(--a-ink)] a-num">{log.recipient_phone}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[var(--a-dim)]">Type</span>
                                      <span className="text-[var(--a-ink)]">{log.message_type}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[var(--a-dim)]">Recipient</span>
                                      <span className="text-[var(--a-ink)] capitalize">{log.recipient_type?.replace(/_/g, ' ')}</span>
                                    </div>
                                    {log.agency_name && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-[var(--a-dim)]">Agency</span>
                                        <span className="text-[var(--a-ink)]">{log.agency_name}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <span className="text-[var(--a-dim)]">Status</span>
                                      <span style={{ color: statusStyle.color }}>{statusStyle.label}</span>
                                    </div>
                                  </div>
                                </div>

                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div>
                                    <p className="a-eyebrow mb-2">Metadata</p>
                                    <pre className="text-[11px] text-[var(--a-muted)] font-mono whitespace-pre-wrap bg-[var(--a-card)] rounded-lg px-3 py-2 border border-[var(--a-line)]">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
          <p className="text-xs text-[var(--a-dim)]">
            Page {page + 1} of {totalPages} &middot; {total.toLocaleString()} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="a-btn-ghost"
              style={page === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="a-btn-ghost"
              style={page >= totalPages - 1 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SMS TEMPLATES TAB
// ============================================================================
interface SmsTemplate {
  id: string;
  key: string;
  category: string;
  description: string;
  message: string;
  default_message: string;
  variables: string[];
  is_customized: boolean;
  updated_at: string;
}

interface Category {
  label: string;
  templates: SmsTemplate[];
}

function SmsTemplatesTab() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${backendUrl()}/api/admin/sms-templates`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Failed to load templates');

      const data = await response.json();
      setCategories(data.categories || {});
      setTotal(data.total || 0);

      const firstCat = Object.keys(data.categories || {})[0];
      if (firstCat) setExpandedCategory(firstCat);
    } catch (err) {
      console.error('Templates error:', err);
      setError('Failed to load SMS templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    setError('');
    try {
      const response = await fetch(`${backendUrl()}/api/admin/sms-templates/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ message: editValue }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }
      setSuccessKey(key);
      setEditingKey(null);
      setTimeout(() => setSuccessKey(null), 2000);
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async (key: string) => {
    if (!confirm('Reset this template to its default message?')) return;
    setResetting(key);
    setError('');
    try {
      const response = await fetch(`${backendUrl()}/api/admin/sms-templates/${key}/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Failed to reset');
      setSuccessKey(key);
      setEditingKey(null);
      setTimeout(() => setSuccessKey(null), 2000);
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setResetting(null);
    }
  };

  const startEditing = (template: SmsTemplate) => {
    setEditingKey(template.key);
    setEditValue(template.message);
    setError('');
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditValue('');
    setError('');
  };

  const filteredCategories: Record<string, Category> = {};
  for (const [catKey, cat] of Object.entries(categories)) {
    if (!search) {
      filteredCategories[catKey] = cat;
      continue;
    }
    const q = search.toLowerCase();
    const filtered = cat.templates.filter(t =>
      t.key.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q)
    );
    if (filtered.length > 0) {
      filteredCategories[catKey] = { ...cat, templates: filtered };
    }
  }

  const customizedCount = Object.values(categories)
    .flatMap(c => c.templates)
    .filter(t => t.is_customized).length;

  return (
    <div className="max-w-[1000px]">
      <p className="text-sm text-[var(--a-muted)] mb-5">
        {total} templates across {Object.keys(categories).length} categories
        {customizedCount > 0 && <> &middot; <span style={{ color: 'var(--a-amber)' }}>{customizedCount} customized</span></>}
      </p>

      {/* Error */}
      {error && (
        <div
          className="mb-4 rounded-xl p-3 flex items-center gap-2 text-sm"
          style={{ background: 'var(--a-red-soft)', border: '1px solid #F3C9C9', color: 'var(--a-red)' }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="a-input pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" />
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(filteredCategories).map(([catKey, cat]) => (
            <div key={catKey} className="a-panel">
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === catKey ? null : catKey)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F6FCF9] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4" style={{ color: 'var(--a-em-deep)' }} />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[var(--a-ink)]">{cat.label}</p>
                    <p className="text-[11px] text-[var(--a-dim)]">{cat.templates.length} template{cat.templates.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cat.templates.some(t => t.is_customized) && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--a-amber-soft)', color: 'var(--a-amber)', border: '1px solid #F0DCA8' }}
                    >
                      edited
                    </span>
                  )}
                  {expandedCategory === catKey ? (
                    <ChevronDown className="h-4 w-4 text-[var(--a-dim)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--a-dim)]" />
                  )}
                </div>
              </button>

              {/* Templates */}
              {expandedCategory === catKey && (
                <div className="border-t border-[var(--a-line)]">
                  {cat.templates.map((template) => {
                    const isEditing = editingKey === template.key;
                    const isSaving = saving === template.key;
                    const isResetting = resetting === template.key;
                    const isSuccess = successKey === template.key;
                    const isPreviewing = previewKey === template.key;

                    return (
                      <div
                        key={template.key}
                        className="px-5 py-4 border-t border-[var(--a-line)] first:border-t-0"
                      >
                        {/* Template Header */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-semibold text-[var(--a-ink)] font-mono">{template.key}</p>
                              {template.is_customized && (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded-full"
                                  style={{ background: 'var(--a-amber-soft)', color: 'var(--a-amber)', border: '1px solid #F0DCA8' }}
                                >
                                  customized
                                </span>
                              )}
                              {isSuccess && (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1"
                                  style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)', border: '1px solid var(--a-em-line)' }}
                                >
                                  <Check className="h-2.5 w-2.5" /> saved
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--a-dim)] mt-0.5">{template.description}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isEditing ? (
                              <>
                                <button
                                  onClick={() => setPreviewKey(isPreviewing ? null : template.key)}
                                  className="p-1.5 rounded-lg hover:bg-[#F3F9F6] transition-colors"
                                  title={isPreviewing ? 'Hide default' : 'Show default'}
                                >
                                  {isPreviewing ? (
                                    <EyeOff className="h-3.5 w-3.5 text-[var(--a-dim)]" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 text-[var(--a-dim)]" />
                                  )}
                                </button>
                                <button
                                  onClick={() => startEditing(template)}
                                  className="a-btn-ghost"
                                  style={{ padding: '5px 12px', fontSize: 11 }}
                                >
                                  Edit
                                </button>
                                {template.is_customized && (
                                  <button
                                    onClick={() => handleReset(template.key)}
                                    disabled={isResetting}
                                    className="p-1.5 rounded-lg hover:bg-[#F3F9F6] transition-colors"
                                    title="Reset to default"
                                  >
                                    {isResetting ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--a-dim)]" />
                                    ) : (
                                      <RotateCcw className="h-3.5 w-3.5 text-[var(--a-dim)]" />
                                    )}
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleSave(template.key)}
                                  disabled={isSaving}
                                  className="a-btn"
                                  style={{ padding: '5px 12px', fontSize: 11 }}
                                >
                                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="a-btn-ghost"
                                  style={{ padding: '5px 12px', fontSize: 11 }}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Variables */}
                        {template.variables && template.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {template.variables.map((v) => (
                              <span
                                key={v}
                                className="text-[10px] px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors"
                                style={{ background: 'var(--a-cyan-soft)', color: 'var(--a-cyan)', border: '1px solid #BFE7F0' }}
                                onClick={() => {
                                  if (isEditing) {
                                    setEditValue(prev => prev + `{${v}}`);
                                  }
                                }}
                                title={isEditing ? `Click to insert {${v}}` : `Variable: {${v}}`}
                              >
                                {`{${v}}`}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Message Display / Edit */}
                        {isEditing ? (
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            rows={Math.max(4, editValue.split('\n').length + 1)}
                            className="w-full rounded-xl px-4 py-3 text-[13px] text-[var(--a-ink)] font-mono leading-relaxed resize-y focus:outline-none"
                            style={{ background: 'var(--a-card)', border: '1px solid var(--a-em-line)' }}
                            autoFocus
                          />
                        ) : (
                          <pre className="text-[12px] text-[var(--a-muted)] font-mono leading-relaxed whitespace-pre-wrap bg-[#F6FCF9] rounded-xl px-4 py-3 border border-[var(--a-line)]">
                            {template.message}
                          </pre>
                        )}

                        {/* Default Message Preview (toggle) */}
                        {isPreviewing && !isEditing && template.is_customized && (
                          <div className="mt-2">
                            <p className="text-[10px] text-[var(--a-dim)] uppercase tracking-wider mb-1">Default</p>
                            <pre className="text-[11px] text-[var(--a-dim)] font-mono leading-relaxed whitespace-pre-wrap bg-[#F8FCFA] rounded-xl px-4 py-3 border border-[var(--a-line)]">
                              {template.default_message}
                            </pre>
                          </div>
                        )}

                        {/* Last updated */}
                        {template.is_customized && (
                          <p className="text-[10px] text-[var(--a-dim)] mt-2">
                            Last edited: {formatDateTime(template.updated_at)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAGE SHELL (tab switch)
// ============================================================================
export default function AdminMessagingPage() {
  const [tab, setTab] = useState<'log' | 'templates'>('log');

  const tabs: { key: 'log' | 'templates'; label: string }[] = [
    { key: 'log', label: 'SMS Log' },
    { key: 'templates', label: 'Templates' },
  ];

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-ink)]">Messaging</h1>
      <p className="mt-1 text-sm text-[var(--a-dim)]">SMS delivery log and the editable template library</p>

      {/* Tab switch */}
      <div className="inline-flex gap-1 rounded-full border border-[var(--a-line-2)] bg-[var(--a-card)] p-1 mt-6 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
            style={tab === t.key ? { background: 'var(--a-em)', color: '#04140D' } : { color: 'var(--a-muted)', background: 'transparent' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'log' ? <SmsLogTab /> : <SmsTemplatesTab />}
    </div>
  );
}