'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare, Search, Loader2, Save, RotateCcw, Check, AlertCircle,
  ChevronDown, ChevronRight, Copy, Eye, EyeOff
} from 'lucide-react';

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

export default function AdminSmsTemplatesPage() {
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

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

      const response = await fetch(`${backendUrl}/api/admin/sms-templates`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to load templates');

      const data = await response.json();
      setCategories(data.categories || {});
      setTotal(data.total || 0);

      // Auto-expand first category
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
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

      const response = await fetch(`${backendUrl}/api/admin/sms-templates/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

      const response = await fetch(`${backendUrl}/api/admin/sms-templates/${key}/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  // Filter templates by search
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
    <div className="p-5 lg:p-8 max-w-[1000px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-white tracking-tight">SMS Templates</h1>
        <p className="mt-1 text-sm text-white/40">
          {total} templates across {Object.keys(categories).length} categories
          {customizedCount > 0 && <> · <span className="text-amber-400">{customizedCount} customized</span></>}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(filteredCategories).map(([catKey, cat]) => (
            <div key={catKey} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === catKey ? null : catKey)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-emerald-400/60" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white/80">{cat.label}</p>
                    <p className="text-[11px] text-white/30">{cat.templates.length} template{cat.templates.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cat.templates.some(t => t.is_customized) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      edited
                    </span>
                  )}
                  {expandedCategory === catKey ? (
                    <ChevronDown className="h-4 w-4 text-white/30" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/30" />
                  )}
                </div>
              </button>

              {/* Templates */}
              {expandedCategory === catKey && (
                <div className="border-t border-white/[0.04]">
                  {cat.templates.map((template) => {
                    const isEditing = editingKey === template.key;
                    const isSaving = saving === template.key;
                    const isResetting = resetting === template.key;
                    const isSuccess = successKey === template.key;
                    const isPreviewing = previewKey === template.key;

                    return (
                      <div
                        key={template.key}
                        className="px-5 py-4 border-t border-white/[0.03] first:border-t-0"
                      >
                        {/* Template Header */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-medium text-white/70 font-mono">{template.key}</p>
                              {template.is_customized && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  customized
                                </span>
                              )}
                              {isSuccess && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                  <Check className="h-2.5 w-2.5" /> saved
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-white/35 mt-0.5">{template.description}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isEditing ? (
                              <>
                                <button
                                  onClick={() => setPreviewKey(isPreviewing ? null : template.key)}
                                  className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                                  title={isPreviewing ? 'Hide default' : 'Show default'}
                                >
                                  {isPreviewing ? (
                                    <EyeOff className="h-3.5 w-3.5 text-white/30" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 text-white/30" />
                                  )}
                                </button>
                                <button
                                  onClick={() => startEditing(template)}
                                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-white/50 transition-colors"
                                >
                                  Edit
                                </button>
                                {template.is_customized && (
                                  <button
                                    onClick={() => handleReset(template.key)}
                                    disabled={isResetting}
                                    className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                                    title="Reset to default"
                                  >
                                    {isResetting ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30" />
                                    ) : (
                                      <RotateCcw className="h-3.5 w-3.5 text-white/30" />
                                    )}
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleSave(template.key)}
                                  disabled={isSaving}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[11px] text-emerald-400 transition-colors flex items-center gap-1"
                                >
                                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-white/40 transition-colors"
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
                                className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400/70 border border-cyan-500/15 font-mono cursor-pointer hover:bg-cyan-500/20 transition-colors"
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
                            className="w-full rounded-xl bg-white/[0.04] border border-emerald-500/20 px-4 py-3 text-[13px] text-white/80 font-mono leading-relaxed focus:outline-none focus:border-emerald-500/40 resize-y"
                            autoFocus
                          />
                        ) : (
                          <pre className="text-[12px] text-white/50 font-mono leading-relaxed whitespace-pre-wrap bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.03]">
                            {template.message}
                          </pre>
                        )}

                        {/* Default Message Preview (toggle) */}
                        {isPreviewing && !isEditing && template.is_customized && (
                          <div className="mt-2">
                            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Default</p>
                            <pre className="text-[11px] text-white/30 font-mono leading-relaxed whitespace-pre-wrap bg-white/[0.01] rounded-xl px-4 py-3 border border-white/[0.02]">
                              {template.default_message}
                            </pre>
                          </div>
                        )}

                        {/* Last updated */}
                        {template.is_customized && (
                          <p className="text-[10px] text-white/20 mt-2">
                            Last edited: {formatDate(template.updated_at)}
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