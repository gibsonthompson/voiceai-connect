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
  const { agency, branding, loading: contextLoading } = useAgency();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';

  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const dropdownBg = isDark ? '#0f0f0f' : '#ffffff';

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

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || template.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const emailTemplates = filteredTemplates.filter(t => t.type === 'email');
  const smsTemplates = filteredTemplates.filter(t => t.type === 'sms');

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Outreach</h1>
            <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
              Manage email and SMS templates
            </p>
          </div>
          
          <Link
            href="/agency/outreach/templates/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors w-full sm:w-auto"
            style={{ backgroundColor: primaryColor, color: '#050505' }}
          >
            <Plus className="h-4 w-4" />
            New Template
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mb-6 sm:mb-8">
        <Link
          href="/agency/outreach/templates/new?type=email"
          className={`rounded-xl p-4 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'}`}
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
            >
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base">Email Template</p>
              <p className="text-xs sm:text-sm truncate" style={{ color: mutedTextColor }}>Create new email</p>
            </div>
          </div>
        </Link>
        
        <Link
          href="/agency/outreach/templates/new?type=sms"
          className={`rounded-xl p-4 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'}`}
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: 'rgba(6,182,212,0.1)' }}
            >
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base">SMS Template</p>
              <p className="text-xs sm:text-sm truncate" style={{ color: mutedTextColor }}>Create new SMS</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedTextColor }} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none"
            style={{ 
              backgroundColor: inputBg, 
              border: `1px solid ${inputBorder}`,
              color: textColor,
            }}
          />
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { value: null, label: 'All' },
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
          ].map((filter) => (
            <button
              key={filter.label}
              onClick={() => setTypeFilter(filter.value)}
              className="rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              style={typeFilter === filter.value ? {
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
              } : {
                color: mutedTextColor,
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div 
          className="rounded-xl py-12 sm:py-20 text-center px-4"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
        >
          <div 
            className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <FileText className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: `${primaryColor}80` }} />
          </div>
          <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>
            {searchQuery || typeFilter ? 'No templates match your search' : 'No templates yet'}
          </p>
          <p className="text-xs sm:text-sm mt-1 mb-4" style={{ color: mutedTextColor }}>
            Create your first outreach template
          </p>
          <Link
            href="/agency/outreach/templates/new"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: primaryColor, color: '#050505' }}
          >
            <Plus className="h-4 w-4" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Email Templates */}
          {emailTemplates.length > 0 && (!typeFilter || typeFilter === 'email') && (
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Mail className="h-4 w-4" style={{ color: mutedTextColor }} />
                <h3 className="text-xs sm:text-sm font-medium" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>Email Templates</h3>
                <span className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>({emailTemplates.length})</span>
              </div>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
              >
                {emailTemplates.map((template, idx) => (
                  <div
                    key={template.id}
                    className={`flex items-center justify-between p-3 sm:p-4 transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.01]'}`}
                    style={{ borderBottom: idx < emailTemplates.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'}` : 'none' }}
                  >
                    <Link
                      href={`/agency/outreach/templates/${template.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div 
                          className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
                          style={{ backgroundColor: 'rgba(168,85,247,0.1)' }}
                        >
                          <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">{template.name}</p>
                            {template.is_default && (
                              <span 
                                className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: isDark ? '#fbbf24' : '#d97706' }}
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-sm truncate" style={{ color: mutedTextColor }}>
                            {template.subject || template.description || 'No subject'}
                          </p>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-[10px] hidden sm:inline mr-1" style={{ color: mutedTextColor }}>
                        {template.use_count || 0}x
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)}
                          className={`rounded-lg p-1.5 sm:p-2 transition-colors ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'}`}
                          style={{ color: mutedTextColor }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {activeDropdown === template.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                            <div 
                              className="absolute right-0 mt-1 w-32 sm:w-40 rounded-xl shadow-xl z-20"
                              style={{ backgroundColor: dropdownBg, border: `1px solid ${inputBorder}` }}
                            >
                              <Link
                                href={`/agency/outreach/templates/${template.id}`}
                                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'}`}
                                onClick={() => setActiveDropdown(null)}
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDuplicate(template)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors w-full text-left ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'}`}
                              >
                                <Copy className="h-4 w-4" />
                                Duplicate
                              </button>
                              {!template.is_default && (
                                <button
                                  onClick={() => handleDelete(template.id)}
                                  className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors w-full text-left ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                                  style={{ color: isDark ? '#f87171' : '#dc2626' }}
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
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <MessageSquare className="h-4 w-4" style={{ color: mutedTextColor }} />
                <h3 className="text-xs sm:text-sm font-medium" style={{ color: isDark ? 'rgba(250,250,249,0.7)' : '#374151' }}>SMS Templates</h3>
                <span className="text-[10px] sm:text-xs" style={{ color: mutedTextColor }}>({smsTemplates.length})</span>
              </div>
              <div 
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
              >
                {smsTemplates.map((template, idx) => (
                  <div
                    key={template.id}
                    className={`flex items-center justify-between p-3 sm:p-4 transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.01]'}`}
                    style={{ borderBottom: idx < smsTemplates.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'}` : 'none' }}
                  >
                    <Link
                      href={`/agency/outreach/templates/${template.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div 
                          className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0"
                          style={{ backgroundColor: 'rgba(6,182,212,0.1)' }}
                        >
                          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate">{template.name}</p>
                            {template.is_default && (
                              <span 
                                className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: isDark ? '#fbbf24' : '#d97706' }}
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-sm truncate" style={{ color: mutedTextColor }}>
                            {template.body?.substring(0, 50) || 'No content'}...
                          </p>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <span className="text-[10px] hidden sm:inline mr-1" style={{ color: mutedTextColor }}>
                        {template.use_count || 0}x
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)}
                          className={`rounded-lg p-1.5 sm:p-2 transition-colors ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'}`}
                          style={{ color: mutedTextColor }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {activeDropdown === template.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                            <div 
                              className="absolute right-0 mt-1 w-32 sm:w-40 rounded-xl shadow-xl z-20"
                              style={{ backgroundColor: dropdownBg, border: `1px solid ${inputBorder}` }}
                            >
                              <Link
                                href={`/agency/outreach/templates/${template.id}`}
                                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'}`}
                                onClick={() => setActiveDropdown(null)}
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDuplicate(template)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors w-full text-left ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'}`}
                              >
                                <Copy className="h-4 w-4" />
                                Duplicate
                              </button>
                              {!template.is_default && (
                                <button
                                  onClick={() => handleDelete(template.id)}
                                  className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors w-full text-left ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                                  style={{ color: isDark ? '#f87171' : '#dc2626' }}
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