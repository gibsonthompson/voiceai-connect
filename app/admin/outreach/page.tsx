'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Mail, MessageSquare, Plus, Search, Loader2,
  MoreVertical, Copy, Trash2, Edit, ArrowRight, Linkedin
} from 'lucide-react';

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
  use_count: number;
  created_at: string;
}

export default function AdminOutreachPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const getToken = () => localStorage.getItem('admin_token');

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/templates`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (template: Template) => {
    setActiveDropdown(null);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/admin/templates/${template.id}/duplicate`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${template.name} (Copy)` }),
        }
      );
      if (response.ok) fetchTemplates();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Delete this template?')) return;
    setActiveDropdown(null);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/admin/templates/${templateId}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } }
      );
      if (response.ok) fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || template.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const emailTemplates = filteredTemplates.filter(t => t.type === 'email');
  const smsTemplates = filteredTemplates.filter(t => t.type === 'sms');
  const linkedinTemplates = filteredTemplates.filter(t => t.type === 'linkedin');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4 text-violet-400" />;
      case 'sms': return <MessageSquare className="h-4 w-4 text-cyan-400" />;
      case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-400" />;
      default: return <Mail className="h-4 w-4 text-violet-400" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'email': return 'bg-violet-500/[0.08]';
      case 'sms': return 'bg-cyan-500/[0.08]';
      case 'linkedin': return 'bg-blue-500/[0.08]';
      default: return 'bg-violet-500/[0.08]';
    }
  };

  const renderTemplateRow = (template: Template, idx: number, total: number) => (
    <div
      key={template.id}
      className={`flex items-center justify-between p-4 transition-colors hover:bg-white/[0.02] ${idx < total - 1 ? 'border-b border-white/[0.03]' : ''}`}
    >
      <Link href={`/admin/outreach/templates/${template.id}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-3.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${getTypeBg(template.type)}`}>
            {getTypeIcon(template.type)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-[13px] text-white/85">{template.name}</p>
              {template.sequence_order && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/[0.08] text-emerald-400/80 font-medium">
                  Step {template.sequence_order}
                </span>
              )}
              {template.delay_days && template.delay_days > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/40">
                  +{template.delay_days}d
                </span>
              )}
            </div>
            <p className="text-xs text-white/35 truncate mt-0.5">
              {template.type === 'email' 
                ? (template.subject || template.description || 'No subject')
                : (template.body?.substring(0, 60) || 'No content') + '...'
              }
            </p>
          </div>
        </div>
      </Link>
      
      <div className="flex items-center gap-2 ml-2">
        <span className="text-[11px] text-white/30 tabular-nums">{template.use_count || 0} sent</span>
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)}
            className="rounded-lg p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {activeDropdown === template.id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
              <div className={`absolute right-0 w-40 rounded-xl shadow-2xl z-20 bg-[#111] border border-white/[0.08] overflow-hidden ${idx >= total - 2 ? 'bottom-full mb-1' : 'mt-1'}`}>
                <Link
                  href={`/admin/outreach/templates/${template.id}`}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/70 hover:bg-white/[0.04] transition-colors"
                  onClick={() => setActiveDropdown(null)}
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Link>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/70 hover:bg-white/[0.04] transition-colors w-full text-left"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <div className="mx-2 border-t border-white/[0.04]" />
                <button
                  onClick={() => handleDelete(template.id)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-400/80 hover:bg-red-500/[0.06] transition-colors w-full text-left"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">Outreach Templates</h1>
          <p className="mt-1 text-sm text-white/40">Email, SMS, and LinkedIn templates for your sales pipeline</p>
        </div>
        <Link
          href="/admin/outreach/templates/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#050505] hover:bg-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
        >
          <Plus className="h-4 w-4" /> New Template
        </Link>
      </div>

      {/* Quick Create */}
      <div className="grid gap-3 grid-cols-3 mb-6">
        <Link
          href="/admin/outreach/templates/new?type=email"
          className="group rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.03] hover:border-white/[0.1] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/[0.08]">
              <Mail className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-[13px] text-white/85 group-hover:text-white transition-colors">Email Template</p>
              <p className="text-xs text-white/35">Create new email</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-white/15 group-hover:text-white/40 transition-colors" />
          </div>
        </Link>
        <Link
          href="/admin/outreach/templates/new?type=sms"
          className="group rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.03] hover:border-white/[0.1] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/[0.08]">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-medium text-[13px] text-white/85 group-hover:text-white transition-colors">SMS Template</p>
              <p className="text-xs text-white/35">Create new SMS</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-white/15 group-hover:text-white/40 transition-colors" />
          </div>
        </Link>
        <Link
          href="/admin/outreach/templates/new?type=linkedin"
          className="group rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.03] hover:border-white/[0.1] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/[0.08]">
              <Linkedin className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-[13px] text-white/85 group-hover:text-white transition-colors">LinkedIn Template</p>
              <p className="text-xs text-white/35">Create new LinkedIn</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-white/15 group-hover:text-white/40 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.02] border border-white/[0.04] p-0.5">
          {[
            { value: null, label: 'All' },
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
            { value: 'linkedin', label: 'LinkedIn' },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => setTypeFilter(filter.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                typeFilter === filter.value
                  ? 'bg-white/[0.06] text-white/85 shadow-sm'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] py-20 text-center">
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 blur-2xl bg-emerald-500/10 rounded-full" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <FileText className="h-7 w-7 text-white/20" />
            </div>
          </div>
          <p className="text-sm text-white/50 mb-1">
            {searchQuery || typeFilter ? 'No templates match' : 'No templates yet'}
          </p>
          <p className="text-xs text-white/30 mb-5">Create your first outreach template</p>
          <Link
            href="/admin/outreach/templates/new"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#050505] hover:bg-emerald-400 transition-all"
          >
            <Plus className="h-4 w-4" /> Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {emailTemplates.length > 0 && (!typeFilter || typeFilter === 'email') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-3.5 w-3.5 text-violet-400/60" />
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-[0.1em]">Email Templates</h3>
                <span className="text-[10px] text-white/25">({emailTemplates.length})</span>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-visible">
                {emailTemplates.map((t, idx) => renderTemplateRow(t, idx, emailTemplates.length))}
              </div>
            </div>
          )}
          {smsTemplates.length > 0 && (!typeFilter || typeFilter === 'sms') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-3.5 w-3.5 text-cyan-400/60" />
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-[0.1em]">SMS Templates</h3>
                <span className="text-[10px] text-white/25">({smsTemplates.length})</span>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-visible">
                {smsTemplates.map((t, idx) => renderTemplateRow(t, idx, smsTemplates.length))}
              </div>
            </div>
          )}
          {linkedinTemplates.length > 0 && (!typeFilter || typeFilter === 'linkedin') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Linkedin className="h-3.5 w-3.5 text-blue-400/60" />
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-[0.1em]">LinkedIn Templates</h3>
                <span className="text-[10px] text-white/25">({linkedinTemplates.length})</span>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-visible">
                {linkedinTemplates.map((t, idx) => renderTemplateRow(t, idx, linkedinTemplates.length))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}