'use client';

// ============================================================================
// OUTREACH TEMPLATES (reskinned, emerald on white)
// The template library for the sales pipeline. All fetch, duplicate, and delete
// logic and every route link are unchanged; only the visual layer changed. The
// three channel accents (email violet, SMS cyan, LinkedIn blue) are kept as
// soft tints that read on white.
// ============================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, Mail, MessageSquare, Plus, Search, Loader2,
  MoreVertical, Copy, Trash2, Edit, ArrowRight, Linkedin, Check, Users, GripVertical,
} from 'lucide-react';
import { BUYER_TYPES, getBuyerTypeLabel } from '@/lib/buyer-types';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'linkedin';
  subject: string;
  body: string;
  is_default: boolean;
  is_follow_up: boolean;
  sequence_name: string | null;
  sequence_order: number | null;
  delay_days: number | null;
  buyer_type: string | null;
  sort_order: number | null;
  use_count: number;
  created_at: string;
}

// channel accents that read on white
const TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  email: { color: 'var(--a-violet)', bg: 'var(--a-violet-soft)' },
  sms: { color: 'var(--a-cyan)', bg: 'var(--a-cyan-soft)' },
  linkedin: { color: '#2563EB', bg: '#E7EEFC' },
};

export default function AdminOutreachPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [agencyEmails, setAgencyEmails] = useState<{ key: string; name: string; subject: string; body: string }[]>([]);
  const [aeKey, setAeKey] = useState<string | null>(null);
  const [aeSubject, setAeSubject] = useState('');
  const [aeBody, setAeBody] = useState('');
  const [aeName, setAeName] = useState('');
  const [aeSaving, setAeSaving] = useState(false);
  const [aeSaved, setAeSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [buyerFilter, setBuyerFilter] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const getToken = () => localStorage.getItem('admin_token');

  useEffect(() => { fetchTemplates(); fetchAgencyEmails(); }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/templates`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (response.ok) { const data = await response.json(); setTemplates(data.templates || []); }
    } catch (error) { console.error('Failed to fetch templates:', error); }
    finally { setLoading(false); }
  };

  // Agency onboarding emails live in a separate system (email_templates, keyed),
  // sent per-agency from the Agencies page. Surfaced here so they can be managed
  // in one place alongside the lead-outreach templates.
  const fetchAgencyEmails = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/email-templates`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (response.ok) { const data = await response.json(); if (Array.isArray(data.templates)) setAgencyEmails(data.templates); }
    } catch (error) { console.error('Failed to fetch agency email templates:', error); }
  };
  const openAgencyEmail = (t: { key: string; name: string; subject: string; body: string }) => { setAeKey(t.key); setAeName(t.name || ''); setAeSubject(t.subject); setAeBody(t.body); setAeSaved(false); };
  const saveAgencyEmail = async () => {
    if (!aeKey) return;
    setAeSaving(true);
    try {
      await fetch(`${getBackendUrl()}/api/admin/email-templates/${aeKey}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: aeName, subject: aeSubject, body: aeBody }),
      });
      setAgencyEmails(prev => prev.map(t => (t.key === aeKey ? { ...t, name: aeName, subject: aeSubject, body: aeBody } : t)));
      setAeSaved(true); setTimeout(() => setAeSaved(false), 2000);
    } catch (error) { console.error('Save agency email error:', error); }
    finally { setAeSaving(false); }
  };

  const handleDuplicate = async (template: Template) => {
    setActiveDropdown(null);
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/templates/${template.id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${template.name} (Copy)` }),
      });
      if (response.ok) fetchTemplates();
    } catch (error) { console.error('Failed to duplicate template:', error); }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Delete this template?')) return;
    setActiveDropdown(null);
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/templates/${templateId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (response.ok) fetchTemplates();
    } catch (error) { console.error('Failed to delete template:', error); }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || template.type === typeFilter;
    // buyerFilter of '' matches templates with no buyer type set (All buyers).
    const matchesBuyer = buyerFilter === null || (template.buyer_type || '') === buyerFilter;
    return matchesSearch && matchesType && matchesBuyer;
  });

  // Manual order first (sort_order asc, nulls last), then oldest-created as a
  // stable fallback so new/un-ordered templates land at the end.
  const byOrder = (a: Template, b: Template) => {
    const ao = a.sort_order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.sort_order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  };

  const emailTemplates = filteredTemplates.filter(t => t.type === 'email').sort(byOrder);
  const smsTemplates = filteredTemplates.filter(t => t.type === 'sms').sort(byOrder);
  const linkedinTemplates = filteredTemplates.filter(t => t.type === 'linkedin').sort(byOrder);

  // Drag-to-reorder is only safe in the full (unfiltered) view, where each
  // channel group shows every template of that type. A search or buyer filter
  // shows a subset, so reindexing would corrupt the real order, disable it then.
  const dragEnabled = !searchQuery && buyerFilter === null;

  const persistOrder = async (ordered: Template[]) => {
    const items = ordered.map((t, i) => ({ id: t.id, sort_order: i }));
    try {
      await fetch(`${getBackendUrl()}/api/admin/templates/reorder`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch (error) { console.error('Failed to persist order:', error); }
  };

  const handleDrop = (target: Template, group: Template[]) => {
    const srcId = draggingId;
    setDraggingId(null);
    setDragOverId(null);
    if (!srcId || srcId === target.id) return;
    const src = group.find(t => t.id === srcId);
    if (!src) return; // dropped across channel groups, ignore
    const fromIdx = group.findIndex(t => t.id === srcId);
    const toIdx = group.findIndex(t => t.id === target.id);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...group];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, src);
    const orderMap = new Map(reordered.map((t, i) => [t.id, i] as [string, number]));
    setTemplates(prev => prev.map(t => orderMap.has(t.id) ? { ...t, sort_order: orderMap.get(t.id)! } : t));
    persistOrder(reordered);
  };

  const getTypeIcon = (type: string) => {
    const s = TYPE_STYLE[type] || TYPE_STYLE.email;
    if (type === 'sms') return <MessageSquare className="h-4 w-4" style={{ color: s.color }} />;
    if (type === 'linkedin') return <Linkedin className="h-4 w-4" style={{ color: s.color }} />;
    return <Mail className="h-4 w-4" style={{ color: s.color }} />;
  };

  if (loading) {
    return <div className="admin-scope flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div>;
  }

  const renderTemplateRow = (template: Template, idx: number, group: Template[]) => {
    const total = group.length;
    const s = TYPE_STYLE[template.type] || TYPE_STYLE.email;
    return (
      <div
        key={template.id}
        draggable={dragEnabled}
        onDragStart={() => dragEnabled && setDraggingId(template.id)}
        onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
        onDragOver={(e) => { if (dragEnabled) { e.preventDefault(); if (dragOverId !== template.id) setDragOverId(template.id); } }}
        onDrop={(e) => { if (dragEnabled) { e.preventDefault(); handleDrop(template, group); } }}
        className={`flex items-center gap-1 px-2.5 py-2 transition-colors hover:bg-[#F6FCF9] ${idx < total - 1 ? 'border-b border-[var(--a-line)]' : ''} ${draggingId === template.id ? 'opacity-40' : ''} ${dragOverId === template.id && draggingId && draggingId !== template.id ? 'bg-[var(--a-em-soft)]' : ''}`}
      >
        {dragEnabled && (
          <span className="shrink-0 cursor-grab active:cursor-grabbing text-[var(--a-dim)] hover:text-[var(--a-muted)] p-0.5" title="Drag to reorder">
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <Link draggable={false} href={`/admin/outreach/templates/${template.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ background: s.bg }}>{getTypeIcon(template.type)}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-[13px] leading-tight text-[var(--a-ink)]">{template.name}</p>
                {template.buyer_type && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium inline-flex items-center gap-1" style={{ background: '#EEF3EF', color: 'var(--a-muted)' }}><Users className="h-2.5 w-2.5" />{getBuyerTypeLabel(template.buyer_type)}</span>}
                {template.sequence_order && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)' }}>Step {template.sequence_order}</span>}
                {template.delay_days && template.delay_days > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: '#EEF3EF', color: 'var(--a-dim)' }}>+{template.delay_days}d</span>}
              </div>
              <p className="text-[11px] text-[var(--a-dim)] truncate leading-tight mt-0.5">{template.type === 'email' ? (template.subject || template.description || 'No subject') : (template.body?.substring(0, 60) || 'No content') + '...'}</p>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          <span className="text-[11px] text-[var(--a-dim)] a-num">{template.use_count || 0} sent</span>
          <div className="relative">
            <button onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)} className="rounded-lg p-1.5 text-[var(--a-dim)] hover:text-[var(--a-muted)] hover:bg-[var(--a-em-soft)] transition-colors"><MoreVertical className="h-4 w-4" /></button>
            {activeDropdown === template.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                <div className={`absolute right-0 w-40 rounded-xl shadow-xl z-20 bg-white border border-[var(--a-line-2)] overflow-hidden ${idx >= total - 2 ? 'bottom-full mb-1' : 'mt-1'}`}>
                  <Link href={`/admin/outreach/templates/${template.id}`} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--a-muted)] hover:bg-[#F6FCF9] transition-colors" onClick={() => setActiveDropdown(null)}><Edit className="h-3.5 w-3.5" /> Edit</Link>
                  <button onClick={() => handleDuplicate(template)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--a-muted)] hover:bg-[#F6FCF9] transition-colors w-full text-left"><Copy className="h-3.5 w-3.5" /> Duplicate</button>
                  <div className="mx-2 border-t border-[var(--a-line)]" />
                  <button onClick={() => handleDelete(template.id)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] w-full text-left" style={{ color: 'var(--a-red)' }}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const quickCreate = (type: 'email' | 'sms' | 'linkedin', label: string, sub: string) => {
    const s = TYPE_STYLE[type];
    return (
      <Link href={`/admin/outreach/templates/new?type=${type}`} className="group a-card p-4 hover:-translate-y-px transition-transform">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: s.bg }}>
            {type === 'email' ? <Mail className="h-5 w-5" style={{ color: s.color }} /> : type === 'sms' ? <MessageSquare className="h-5 w-5" style={{ color: s.color }} /> : <Linkedin className="h-5 w-5" style={{ color: s.color }} />}
          </div>
          <div><p className="font-semibold text-[13px] text-[var(--a-ink)]">{label}</p><p className="text-xs text-[var(--a-dim)]">{sub}</p></div>
          <ArrowRight className="h-3.5 w-3.5 ml-auto text-[var(--a-dim)] group-hover:text-[var(--a-em-deep)] transition-colors" />
        </div>
      </Link>
    );
  };

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--a-ink)] tracking-tight">Outreach Templates</h1>
          <p className="mt-1 text-sm text-[var(--a-dim)]">Email, SMS, and LinkedIn templates for your sales pipeline</p>
        </div>
        <Link href="/admin/outreach/templates/new" className="a-btn"><Plus className="h-4 w-4" /> New Template</Link>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 mb-6">
        {quickCreate('email', 'Email Template', 'Create new email')}
        {quickCreate('sms', 'SMS Template', 'Create new SMS')}
        {quickCreate('linkedin', 'LinkedIn Template', 'Create new LinkedIn')}
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
            <input type="text" placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="a-input pl-10" />
          </div>
          <div className="flex items-center gap-0.5 rounded-lg bg-white border border-[var(--a-line-2)] p-0.5">
            {[{ value: null, label: 'All' }, { value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }, { value: 'linkedin', label: 'LinkedIn' }].map((filter) => (
              <button key={filter.label} onClick={() => setTypeFilter(filter.value)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${typeFilter === filter.value ? 'bg-[var(--a-em-soft)] text-[var(--a-em-deep)]' : 'text-[var(--a-dim)] hover:text-[var(--a-muted)]'}`}>{filter.label}</button>
            ))}
          </div>
        </div>
        {/* Buyer-type filter: sort the library by who each message is written for. */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--a-dim)] shrink-0 pr-1"><Users className="h-3.5 w-3.5" /> Buyer</span>
          {[{ value: null, label: 'All' }, { value: '', label: 'Unassigned' }, ...BUYER_TYPES.map(b => ({ value: b.value, label: b.label }))].map((filter) => (
            <button
              key={filter.label}
              onClick={() => setBuyerFilter(filter.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors ${buyerFilter === filter.value ? 'bg-[var(--a-em-soft)] text-[var(--a-em-deep)] border-[var(--a-em-line)]' : 'text-[var(--a-dim)] border-[var(--a-line-2)] hover:text-[var(--a-muted)]'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="a-panel py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto mb-4" style={{ background: 'var(--a-em-soft)' }}><FileText className="h-7 w-7 text-[var(--a-em-deep)]" /></div>
          <p className="text-sm text-[var(--a-muted)] mb-1">{searchQuery || typeFilter || buyerFilter !== null ? 'No templates match' : 'No templates yet'}</p>
          <p className="text-xs text-[var(--a-dim)] mb-5">Create your first outreach template</p>
          <Link href="/admin/outreach/templates/new" className="a-btn inline-flex"><Plus className="h-4 w-4" /> Create Template</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {linkedinTemplates.length > 0 && (!typeFilter || typeFilter === 'linkedin') && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Linkedin className="h-3.5 w-3.5" style={{ color: '#2563EB' }} /><h3 className="text-xs font-medium text-[var(--a-dim)] uppercase tracking-[0.1em]">LinkedIn Templates</h3><span className="text-[10px] text-[var(--a-dim)]">({linkedinTemplates.length})</span></div>
              <div className="a-panel overflow-visible">{linkedinTemplates.map((t, idx) => renderTemplateRow(t, idx, linkedinTemplates))}</div>
            </div>
          )}
          {emailTemplates.length > 0 && (!typeFilter || typeFilter === 'email') && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Mail className="h-3.5 w-3.5" style={{ color: 'var(--a-violet)' }} /><h3 className="text-xs font-medium text-[var(--a-dim)] uppercase tracking-[0.1em]">Email Templates</h3><span className="text-[10px] text-[var(--a-dim)]">({emailTemplates.length})</span></div>
              <div className="a-panel overflow-visible">{emailTemplates.map((t, idx) => renderTemplateRow(t, idx, emailTemplates))}</div>
            </div>
          )}
          {smsTemplates.length > 0 && (!typeFilter || typeFilter === 'sms') && (
            <div>
              <div className="flex items-center gap-2 mb-2"><MessageSquare className="h-3.5 w-3.5" style={{ color: 'var(--a-cyan)' }} /><h3 className="text-xs font-medium text-[var(--a-dim)] uppercase tracking-[0.1em]">SMS Templates</h3><span className="text-[10px] text-[var(--a-dim)]">({smsTemplates.length})</span></div>
              <div className="a-panel overflow-visible">{smsTemplates.map((t, idx) => renderTemplateRow(t, idx, smsTemplates))}</div>
            </div>
          )}
          {agencyEmails.length > 0 && !typeFilter && (
            <div>
              <div className="flex items-center gap-2 mb-1.5"><Mail className="h-3.5 w-3.5" style={{ color: 'var(--a-em-deep)' }} /><h3 className="text-xs font-medium text-[var(--a-dim)] uppercase tracking-[0.1em]">Agency Emails</h3><span className="text-[10px] text-[var(--a-dim)]">({agencyEmails.length})</span></div>
              <p className="text-[11px] text-[var(--a-dim)] mb-3">Onboarding emails sent to signed-up agencies from the Agencies page. {'{name}'} fills with the agency name at send time.</p>
              <div className="a-panel overflow-visible">
                {agencyEmails.map((t) => (
                  <div key={t.key} className="border-b border-[var(--a-line)] last:border-0">
                    <button onClick={() => (aeKey === t.key ? setAeKey(null) : openAgencyEmail(t))} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F6FCF9] transition-colors">
                      <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--a-em-deep)' }} />
                      <div className="min-w-0 flex-1"><p className="text-[13px] font-medium text-[var(--a-ink)] truncate">{t.name}</p><p className="text-[11px] text-[var(--a-dim)] truncate">{t.subject}</p></div>
                      <Edit className="h-3.5 w-3.5 shrink-0 text-[var(--a-dim)]" />
                    </button>
                    {aeKey === t.key && (
                      <div className="px-4 pb-4 space-y-3">
                        <div><label className="block text-[10px] uppercase tracking-wide text-[var(--a-dim)] mb-1">Name</label><input value={aeName} onChange={(e) => setAeName(e.target.value)} className="a-input" /></div>
                        <div><label className="block text-[10px] uppercase tracking-wide text-[var(--a-dim)] mb-1">Subject</label><input value={aeSubject} onChange={(e) => setAeSubject(e.target.value)} className="a-input" /></div>
                        <div><label className="block text-[10px] uppercase tracking-wide text-[var(--a-dim)] mb-1">Body</label><textarea value={aeBody} onChange={(e) => setAeBody(e.target.value)} rows={12} className="a-input" style={{ whiteSpace: 'pre-wrap', resize: 'vertical', minHeight: '260px' }} /></div>
                        <div className="flex justify-end"><button onClick={saveAgencyEmail} disabled={aeSaving} className="a-btn">{aeSaved ? <><Check className="h-3.5 w-3.5" />Saved</> : aeSaving ? 'Saving...' : 'Save'}</button></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}