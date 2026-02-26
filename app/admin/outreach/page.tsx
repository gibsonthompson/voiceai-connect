'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Mail, MessageSquare, Plus, Search, Loader2,
  MoreVertical, Copy, Trash2, Edit, Sparkles
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sms';
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

  useEffect(() => {
    fetchTemplates();
  }, []);

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
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
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
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` },
        }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  const renderTemplateRow = (template: Template, idx: number, total: number) => (
    <div
      key={template.id}
      className="flex items-center justify-between p-4 transition-colors hover:bg-white/5"
      style={{ borderBottom: idx < total - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
    >
      <Link
        href={`/admin/outreach/templates/${template.id}`}
        className="flex-1 min-w-0"
      >
        <div className="flex items-center gap-3">
          <div 
            className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
              template.type === 'email' ? 'bg-purple-500/10' : 'bg-cyan-500/10'
            }`}
          >
            {template.type === 'email' 
              ? <Mail className="h-5 w-5 text-purple-400" />
              : <MessageSquare className="h-5 w-5 text-cyan-400" />
            }
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm text-white truncate">{template.name}</p>
              {template.sequence_order && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                  Step {template.sequence_order}
                </span>
              )}
              {template.delay_days && template.delay_days > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                  +{template.delay_days}d
                </span>
              )}
            </div>
            <p className="text-sm text-white/40 truncate">
              {template.type === 'email' 
                ? (template.subject || template.description || 'No subject')
                : (template.body?.substring(0, 60) || 'No content') + '...'
              }
            </p>
          </div>
        </div>
      </Link>
      
      <div className="flex items-center gap-2 ml-2">
        <span className="text-xs text-white/30">
          {template.use_count || 0}x
        </span>
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)}
            className="rounded-lg p-2 text-white/40 hover:bg-white/5 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {activeDropdown === template.id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
              <div className="absolute right-0 mt-1 w-40 rounded-xl shadow-xl z-20 bg-gray-900 border border-white/10">
                <Link
                  href={`/admin/outreach/templates/${template.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                  onClick={() => setActiveDropdown(null)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors w-full text-left"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Outreach Templates</h1>
          <p className="mt-1 text-white/50">Email and SMS templates for your sales pipeline</p>
        </div>
        
        <Link
          href="/admin/outreach/templates/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Link>
      </div>

      {/* Quick Create */}
      <div className="grid gap-3 grid-cols-2 mb-6">
        <Link
          href="/admin/outreach/templates/new?type=email"
          className="rounded-xl bg-gray-900 border border-white/10 p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Mail className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-sm text-white">Email Template</p>
              <p className="text-xs text-white/40">Create new email</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/outreach/templates/new?type=sms"
          className="rounded-xl bg-gray-900 border border-white/10 p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-medium text-sm text-white">SMS Template</p>
              <p className="text-xs text-white/40">Create new SMS</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-gray-900 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-1">
          {[
            { value: null, label: 'All' },
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => setTypeFilter(filter.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                typeFilter === filter.value
                  ? 'bg-blue-500/10 text-blue-400'
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
        <div className="rounded-xl bg-gray-900 border border-white/10 py-16 text-center">
          <FileText className="h-12 w-12 mx-auto text-white/20 mb-3" />
          <p className="text-white/50 mb-1">
            {searchQuery || typeFilter ? 'No templates match' : 'No templates yet'}
          </p>
          <p className="text-sm text-white/30 mb-4">Create your first outreach template</p>
          <Link
            href="/admin/outreach/templates/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {emailTemplates.length > 0 && (!typeFilter || typeFilter === 'email') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-white/40" />
                <h3 className="text-sm font-medium text-white/60">Email Templates</h3>
                <span className="text-xs text-white/30">({emailTemplates.length})</span>
              </div>
              <div className="rounded-xl bg-gray-900 border border-white/10 overflow-hidden">
                {emailTemplates.map((t, idx) => renderTemplateRow(t, idx, emailTemplates.length))}
              </div>
            </div>
          )}
          {smsTemplates.length > 0 && (!typeFilter || typeFilter === 'sms') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-white/40" />
                <h3 className="text-sm font-medium text-white/60">SMS Templates</h3>
                <span className="text-xs text-white/30">({smsTemplates.length})</span>
              </div>
              <div className="rounded-xl bg-gray-900 border border-white/10 overflow-hidden">
                {smsTemplates.map((t, idx) => renderTemplateRow(t, idx, smsTemplates.length))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}