'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, Mail, MessageSquare, Save, Info,
  Copy, Check
} from 'lucide-react';
import { useAgency } from '../../../context';

interface TemplateVariable {
  key: string;
  label: string;
  description: string;
}

interface VariableGroup {
  lead: TemplateVariable[];
  agency: TemplateVariable[];
  dynamic: TemplateVariable[];
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = params.id as string;
  const isNew = templateId === 'new';
  
  const { agency, branding, loading: contextLoading } = useAgency();
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [variables, setVariables] = useState<VariableGroup | null>(null);
  const [showVariables, setShowVariables] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: searchParams.get('type') || 'email',
    subject: '',
    body: '',
    is_follow_up: false,
    sequence_name: '',
    delay_days: '',
  });

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

  useEffect(() => {
    if (agency) {
      fetchVariables();
      if (!isNew) {
        fetchTemplate();
      }
    }
  }, [agency, templateId]);

  const fetchVariables = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/outreach/variables`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVariables(data.variables);
      }
    } catch (error) {
      console.error('Failed to fetch variables:', error);
    }
  };

  const fetchTemplate = async () => {
    if (!agency || isNew) return;

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/templates/${templateId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        setError('Template not found');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setFormData({
        name: data.template.name || '',
        description: data.template.description || '',
        type: data.template.type || 'email',
        subject: data.template.subject || '',
        body: data.template.body || '',
        is_follow_up: data.template.is_follow_up || false,
        sequence_name: data.template.sequence_name || '',
        delay_days: data.template.delay_days?.toString() || '',
      });
    } catch (error) {
      console.error('Failed to fetch template:', error);
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agency) return;
    
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }
    if (!formData.body.trim()) {
      setError('Template body is required');
      return;
    }
    if (formData.type === 'email' && !formData.subject.trim()) {
      setError('Email subject is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const payload = {
        ...formData,
        delay_days: formData.delay_days ? parseInt(formData.delay_days) : null,
      };

      const url = isNew
        ? `${backendUrl}/api/agency/${agency.id}/templates`
        : `${backendUrl}/api/agency/${agency.id}/templates/${templateId}`;

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      router.push('/agency/outreach');
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
      setSaving(false);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 1500);
  };

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
        <Link 
          href="/agency/outreach"
          className="inline-flex items-center gap-2 text-sm transition-colors mb-4"
          style={{ color: mutedTextColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Outreach
        </Link>
        
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {isNew ? 'Create Template' : 'Edit Template'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
              {formData.type === 'email' ? 'Email template' : 'SMS template'}
            </p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto"
            style={{ backgroundColor: primaryColor, color: '#050505' }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Template
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="mb-4 sm:mb-6 rounded-xl p-3 sm:p-4 text-sm"
          style={{
            backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
            border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
            color: isDark ? '#f87171' : '#dc2626',
          }}
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <h3 className="font-medium text-sm sm:text-base mb-4 sm:mb-5">Template Info</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>
                    Name <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Initial Outreach"
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={{ 
                      backgroundColor: inputBg, 
                      border: `1px solid ${inputBorder}`,
                      color: textColor,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                    style={{ 
                      backgroundColor: inputBg, 
                      border: `1px solid ${inputBorder}`,
                      color: textColor,
                    }}
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of when to use this"
                  className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none"
                  style={{ 
                    backgroundColor: inputBg, 
                    border: `1px solid ${inputBorder}`,
                    color: textColor,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div 
            className="rounded-xl p-4 sm:p-6"
            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="font-medium text-sm sm:text-base">Content</h3>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="text-xs sm:text-sm transition-colors"
                style={{ color: primaryColor }}
              >
                {showVariables ? 'Hide' : 'Show'} Variables
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Subject (email only) */}
              {formData.type === 'email' && (
                <div>
                  <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>
                    Subject <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Quick question about {lead_business_name}"
                    className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-mono focus:outline-none"
                    style={{ 
                      backgroundColor: inputBg, 
                      border: `1px solid ${inputBorder}`,
                      color: textColor,
                    }}
                  />
                </div>
              )}

              {/* Body */}
              <div>
                <label className="block text-xs sm:text-sm mb-1.5" style={{ color: mutedTextColor }}>
                  Body <span style={{ color: isDark ? '#f87171' : '#dc2626' }}>*</span>
                </label>
                <textarea
                  id="template-body"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Write your message here. Use {variables} to personalize."
                  rows={formData.type === 'email' ? 10 : 5}
                  className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm font-mono resize-none focus:outline-none"
                  style={{ 
                    backgroundColor: inputBg, 
                    border: `1px solid ${inputBorder}`,
                    color: textColor,
                  }}
                />
                {formData.type === 'sms' && (
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: mutedTextColor }}>
                    {formData.body.length} characters (SMS limit: 160/segment)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Variables Panel */}
          {showVariables && variables && (
            <div 
              className="lg:hidden rounded-xl p-4"
              style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
            >
              <h3 className="font-medium text-sm mb-3">Variables</h3>
              <p className="text-[10px] mb-3" style={{ color: mutedTextColor }}>Tap to copy</p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: mutedTextColor }}>Lead</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.lead.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className="px-2 py-1 rounded text-[10px] font-mono transition-colors"
                        style={{
                          backgroundColor: copiedVar === v.key ? `${primaryColor}20` : (isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'),
                          color: copiedVar === v.key ? primaryColor : '#34d399',
                        }}
                      >
                        {copiedVar === v.key ? '✓' : v.key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: mutedTextColor }}>Agency</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.agency.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className="px-2 py-1 rounded text-[10px] font-mono transition-colors"
                        style={{
                          backgroundColor: copiedVar === v.key ? `${primaryColor}20` : (isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'),
                          color: copiedVar === v.key ? primaryColor : '#60a5fa',
                        }}
                      >
                        {copiedVar === v.key ? '✓' : v.key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: mutedTextColor }}>Dynamic</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.dynamic.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className="px-2 py-1 rounded text-[10px] font-mono transition-colors"
                        style={{
                          backgroundColor: copiedVar === v.key ? `${primaryColor}20` : (isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'),
                          color: copiedVar === v.key ? primaryColor : '#a78bfa',
                        }}
                      >
                        {copiedVar === v.key ? '✓' : v.key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block space-y-6">
          {/* Variables Reference */}
          {showVariables && variables && (
            <div 
              className="rounded-xl p-6"
              style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
            >
              <h3 className="font-medium mb-4">Available Variables</h3>
              <p className="text-xs mb-4" style={{ color: mutedTextColor }}>
                Click to copy, then paste into your template
              </p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: mutedTextColor }}>Lead Info</p>
                  <div className="space-y-1">
                    {variables.lead.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left group ${
                          isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-mono truncate" style={{ color: '#34d399' }}>{v.key}</p>
                          <p className="text-xs truncate" style={{ color: mutedTextColor }}>{v.description}</p>
                        </div>
                        {copiedVar === v.key ? (
                          <Check className="h-3.5 w-3.5 shrink-0" style={{ color: primaryColor }} />
                        ) : (
                          <Copy className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100" style={{ color: mutedTextColor }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: mutedTextColor }}>Your Info</p>
                  <div className="space-y-1">
                    {variables.agency.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left group ${
                          isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-mono truncate" style={{ color: '#60a5fa' }}>{v.key}</p>
                          <p className="text-xs truncate" style={{ color: mutedTextColor }}>{v.description}</p>
                        </div>
                        {copiedVar === v.key ? (
                          <Check className="h-3.5 w-3.5 shrink-0" style={{ color: primaryColor }} />
                        ) : (
                          <Copy className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100" style={{ color: mutedTextColor }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: mutedTextColor }}>Dynamic</p>
                  <div className="space-y-1">
                    {variables.dynamic.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left group ${
                          isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-mono truncate" style={{ color: '#a78bfa' }}>{v.key}</p>
                          <p className="text-xs truncate" style={{ color: mutedTextColor }}>{v.description}</p>
                        </div>
                        {copiedVar === v.key ? (
                          <Check className="h-3.5 w-3.5 shrink-0" style={{ color: primaryColor }} />
                        ) : (
                          <Copy className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100" style={{ color: mutedTextColor }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div 
            className="rounded-xl p-4"
            style={{ 
              backgroundColor: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)',
              border: isDark ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: isDark ? '#60a5fa' : '#2563eb' }} />
              <div className="text-xs" style={{ color: isDark ? 'rgba(147,197,253,0.8)' : '#1e40af' }}>
                <p className="font-medium mb-1">Tips:</p>
                <ul className="space-y-1" style={{ color: isDark ? 'rgba(147,197,253,0.6)' : '#1e40af' }}>
                  <li>Keep subject lines under 50 chars</li>
                  <li>Personalize with first name</li>
                  <li>One clear call-to-action</li>
                  <li>Keep emails under 200 words</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}