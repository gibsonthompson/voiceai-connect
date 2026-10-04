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

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare, Search, Loader2, Save, RotateCcw, Check, AlertCircle, X, Send,
  ChevronDown, ChevronRight, Eye, EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { formatPhone, timeAgo, formatDateTime } from '@/lib/admin/format';
import { getSmsTypeLabel, getSmsDeliveryStyle } from '@/lib/admin/status';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

// ============================================================================
// SMS LOG TAB
// ============================================================================
interface Conversation {
  phone: string;
  agency_id: string | null;
  agency_name: string | null;
  last_body: string;
  last_at: string;
  last_direction: string;
  count: number;
}

function SmsLogTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [thread, setThread] = useState<{ phone: string; agency_name: string | null; messages: any[] } | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const paneRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl()}/api/admin/sms-log/conversations`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setConversations(res.ok ? (data.conversations || []) : []);
    } catch { setConversations([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadConversations(); }, [loadConversations]);

  const openConversation = async (phone: string) => {
    setActivePhone(phone); setThread(null); setThreadLoading(true); setReplyText(''); setReplyError('');
    try {
      const res = await fetch(`${backendUrl()}/api/admin/sms-log/thread?phone=${encodeURIComponent(phone)}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setThread(res.ok ? data : { phone, agency_name: null, messages: [] });
    } catch { setThread({ phone, agency_name: null, messages: [] }); }
    finally { setThreadLoading(false); }
  };

  // Scroll the message pane (never the page) to the newest message on load/grow.
  useEffect(() => { const c = paneRef.current; if (c) c.scrollTop = c.scrollHeight; }, [thread]);

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || !activePhone) return;
    setSending(true); setReplyError('');
    try {
      const res = await fetch(`${backendUrl()}/api/admin/sms-log/thread/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ phone: activePhone, message: text }),
      });
      const data = await res.json();
      if (!res.ok) { setReplyError(data.error || 'Failed to send'); return; }
      setThread((prev) => prev ? { ...prev, messages: [...prev.messages, data.message] } : prev);
      setReplyText('');
      loadConversations();
    } catch { setReplyError('Failed to send'); }
    finally { setSending(false); }
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.agency_name || '').toLowerCase().includes(q) || (c.phone || '').includes(search);
  });

  return (
    <div className="flex rounded-2xl overflow-hidden h-[calc(100vh-210px)] min-h-[480px]" style={{ border: '1px solid var(--a-line)' }}>
      {/* Conversations list */}
      <div className={`${activePhone ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col shrink-0`} style={{ borderRight: '1px solid var(--a-line)', backgroundColor: 'var(--a-card)' }}>
        <div className="p-3" style={{ borderBottom: '1px solid var(--a-line)' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations"
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm" style={{ backgroundColor: 'var(--a-bg)', border: '1px solid var(--a-line)', color: 'var(--a-ink)' }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[var(--a-dim)]" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-center text-[var(--a-dim)] py-10">No conversations.</p>
          ) : filtered.map((c) => (
            <button key={c.phone} onClick={() => openConversation(c.phone)}
              className="w-full text-left px-3 py-2.5 flex flex-col gap-0.5 transition-colors"
              style={{ borderBottom: '1px solid var(--a-line)', backgroundColor: activePhone === c.phone ? 'var(--a-em-wash)' : 'transparent' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--a-ink)] truncate">{c.agency_name || formatPhone(c.phone)}</span>
                <span className="text-[10px] text-[var(--a-dim)] shrink-0">{timeAgo(c.last_at)}</span>
              </div>
              <span className="text-xs text-[var(--a-dim)] truncate">{c.last_direction === 'inbound' ? '' : 'You: '}{c.last_body}</span>
              {c.agency_name && <span className="text-[10px] text-[var(--a-dim)] a-num">{formatPhone(c.phone)}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Open conversation */}
      <div className={`${activePhone ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`} style={{ backgroundColor: 'var(--a-bg)' }}>
        {!activePhone ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-[var(--a-dim)] opacity-40" />
              <p className="text-sm text-[var(--a-dim)] mt-2">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--a-line)', backgroundColor: 'var(--a-card)' }}>
              <button onClick={() => setActivePhone(null)} className="md:hidden p-1 -ml-1 text-[var(--a-dim)]"><ArrowLeft className="h-4 w-4" /></button>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--a-ink)] truncate">{thread?.agency_name || formatPhone(activePhone)}</p>
                <p className="text-[11px] text-[var(--a-dim)] a-num">{formatPhone(activePhone)}</p>
              </div>
            </div>
            <div ref={paneRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {threadLoading ? (
                <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[var(--a-dim)]" /></div>
              ) : !thread || thread.messages.length === 0 ? (
                <p className="text-sm text-center text-[var(--a-dim)] py-10">No messages yet.</p>
              ) : thread.messages.map((m: any) => {
                const inbound = m.direction === 'inbound';
                return (
                  <div key={m.id} className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-[75%] rounded-2xl px-3.5 py-2" style={{ backgroundColor: inbound ? '#F1F5F4' : 'var(--a-em-deep)', color: inbound ? 'var(--a-ink)' : '#fff', border: inbound ? '1px solid var(--a-line)' : 'none' }}>
                      <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="text-[9px] mt-1" style={{ color: inbound ? 'var(--a-dim)' : 'rgba(255,255,255,0.7)' }}>{inbound ? 'Them' : 'Platform'} {'\u00b7'} {formatDateTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--a-line)', backgroundColor: 'var(--a-card)' }}>
              <div className="flex items-center gap-2">
                <input value={replyText} onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type a reply" className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: 'var(--a-bg)', border: '1px solid var(--a-line)', color: 'var(--a-ink)' }} />
                <button onClick={sendReply} disabled={sending || !replyText.trim()} className="rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5 shrink-0" style={{ backgroundColor: 'var(--a-em-deep)', color: '#fff' }}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              {replyError && <p className="text-[11px] mt-1" style={{ color: '#dc2626' }}>{replyError}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SMS TEMPLATES TAB
// ============================================================================
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