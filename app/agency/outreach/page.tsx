'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Mail, MessageSquare, Plus, Search, Loader2,
  MoreVertical, Copy, Trash2, Edit, Sparkles
} from 'lucide-react';
import { useAgency } from '../context';

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
  use_count: number;
  created_at: string;
}

export default function OutreachPage() {
  const { agency, loading: contextLoading } = useAgency();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (agency) {
      fetchTemplates();
    }
  }, [agency]);

  const fetchTemplates = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/templates`, {
        headers: { 'Authorization': `Bearer ${token}` },
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
    if (!agency) return;
    setActiveDropdown(null);

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(
        `${backendUrl}/api/agency/${agency.id}/templates/${template.id}/duplicate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: `${template.name} (Copy)` }),
        }
      );

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!agency) return;
    if (!confirm('Are you sure you want to delete this template?')) return;
    setActiveDropdown(null);

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(
        `${backendUrl}/api/agency/${agency.id}/templates/${templateId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || template.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Group by type
  const emailTemplates = filteredTemplates.filter(t => t.type === 'email');
  const smsTemplates = filteredTemplates.filter(t => t.type === 'sms');

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Outreach</h1>
          <p className="mt-1 text-sm text-[#fafaf9]/50">
            Manage email and SMS templates for lead outreach
          </p>
        </div>
        
        <Link
          href="/agency/outreach/templates/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 mb-6 sm:mb-8">
        <Link
          href="/agency/outreach/templates/new?type=email"
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5 hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">Email Template</p>
              <p className="text-sm text-[#fafaf9]/50 truncate">Create new email template</p>
            </div>
          </div>
        </Link>
        
        <Link
          href="/agency/outreach/templates/new?type=sms"
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5 hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 shrink-0">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">SMS Template</p>
              <p className="text-sm text-[#fafaf9]/50 truncate">Create new SMS template</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fafaf9]/30" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter(null)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              !typeFilter 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'text-[#fafaf9]/50 hover:text-[#fafaf9]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('email')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              typeFilter === 'email' 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'text-[#fafaf9]/50 hover:text-[#fafaf9]'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setTypeFilter('sms')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              typeFilter === 'sms' 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'text-[#fafaf9]/50 hover:text-[#fafaf9]'
            }`}
          >
            SMS
          </button>
        </div>
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-16 sm:py-20 text-center px-4">
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-400/50" />
          </div>
          <p className="mt-4 font-medium text-[#fafaf9]/70">
            {searchQuery || typeFilter ? 'No templates match your search' : 'No templates yet'}
          </p>
          <p className="text-sm text-[#fafaf9]/40 mt-1 mb-4">
            Create your first outreach template to get started
          </p>
          <Link
            href="/agency/outreach/templates/new"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Email Templates */}
          {emailTemplates.length > 0 && (!typeFilter || typeFilter === 'email') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-[#fafaf9]/50" />
                <h3 className="text-sm font-medium text-[#fafaf9]/70">Email Templates</h3>
                <span className="text-xs text-[#fafaf9]/40">({emailTemplates.length})</span>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
                {emailTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 sm:p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <Link
                      href={`/agency/outreach/templates/${template.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-purple-500/10 shrink-0">
                          <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm sm:text-base truncate">{template.name}</p>
                            {template.is_default && (
                              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-400 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded">
                                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-[#fafaf9]/40 truncate">
                            {template.subject || template.description || 'No subject'}
                          </p>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
                      <span className="text-[10px] sm:text-xs text-[#fafaf9]/30 hidden sm:inline">
                        Used {template.use_count || 0}x
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)}
                          className="rounded-lg p-1.5 sm:p-2 text-[#fafaf9]/50 hover:bg-white/[0.06] hover:text-[#fafaf9] transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {activeDropdown === template.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 mt-1 w-36 sm:w-40 rounded-xl border border-white/[0.08] bg-[#0f0f0f] shadow-xl z-20">
                              <Link
                                href={`/agency/outreach/templates/${template.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.04] transition-colors"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDuplicate(template)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.04] transition-colors w-full text-left"
                              >
                                <Copy className="h-4 w-4" />
                                Duplicate
                              </button>
                              {!template.is_default && (
                                <button
                                  onClick={() => handleDelete(template.id)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SMS Templates */}
          {smsTemplates.length > 0 && (!typeFilter || typeFilter === 'sms') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-[#fafaf9]/50" />
                <h3 className="text-sm font-medium text-[#fafaf9]/70">SMS Templates</h3>
                <span className="text-xs text-[#fafaf9]/40">({smsTemplates.length})</span>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
                {smsTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 sm:p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <Link
                      href={`/agency/outreach/templates/${template.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-cyan-500/10 shrink-0">
                          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm sm:text-base truncate">{template.name}</p>
                            {template.is_default && (
                              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-400 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded">
                                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-[#fafaf9]/40 truncate">
                            {template.body?.substring(0, 60) || 'No content'}...
                          </p>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
                      <span className="text-[10px] sm:text-xs text-[#fafaf9]/30 hidden sm:inline">
                        Used {template.use_count || 0}x
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)}
                          className="rounded-lg p-1.5 sm:p-2 text-[#fafaf9]/50 hover:bg-white/[0.06] hover:text-[#fafaf9] transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {activeDropdown === template.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 mt-1 w-36 sm:w-40 rounded-xl border border-white/[0.08] bg-[#0f0f0f] shadow-xl z-20">
                              <Link
                                href={`/agency/outreach/templates/${template.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.04] transition-colors"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDuplicate(template)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.04] transition-colors w-full text-left"
                              >
                                <Copy className="h-4 w-4" />
                                Duplicate
                              </button>
                              {!template.is_default && (
                                <button
                                  onClick={() => handleDelete(template.id)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
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