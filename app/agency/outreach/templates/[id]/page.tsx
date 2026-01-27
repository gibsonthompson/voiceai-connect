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
  
  const { agency, loading: contextLoading } = useAgency();
  
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link 
          href="/agency/outreach"
          className="inline-flex items-center gap-2 text-sm text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Outreach
        </Link>
        
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {isNew ? 'Create Template' : 'Edit Template'}
            </h1>
            <p className="mt-1 text-sm text-[#fafaf9]/50">
              {formData.type === 'email' ? 'Email template' : 'SMS template'}
            </p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors disabled:opacity-50 w-full sm:w-auto"
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
        <div className="mb-4 sm:mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 sm:p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6">
            <h3 className="font-medium text-sm sm:text-base mb-4 sm:mb-5">Template Info</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs sm:text-sm text-[#fafaf9]/50 mb-1.5">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Initial Outreach"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm text-[#fafaf9]/50 mb-1.5">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-[#fafaf9] focus:border-emerald-500/50 focus:outline-none"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-[#fafaf9]/50 mb-1.5">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of when to use this"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="font-medium text-sm sm:text-base">Content</h3>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {showVariables ? 'Hide' : 'Show'} Variables
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Subject (email only) */}
              {formData.type === 'email' && (
                <div>
                  <label className="block text-xs sm:text-sm text-[#fafaf9]/50 mb-1.5">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Quick question about {lead_business_name}"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* Body */}
              <div>
                <label className="block text-xs sm:text-sm text-[#fafaf9]/50 mb-1.5">
                  Body <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="template-body"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Write your message here. Use {variables} to personalize."
                  rows={formData.type === 'email' ? 10 : 5}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 sm:px-4 py-2 sm:py-3 text-sm text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:border-emerald-500/50 focus:outline-none resize-none font-mono"
                />
                {formData.type === 'sms' && (
                  <p className="text-[10px] sm:text-xs text-[#fafaf9]/40 mt-1">
                    {formData.body.length} characters (SMS limit: 160/segment)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Variables Panel */}
          {showVariables && variables && (
            <div className="lg:hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="font-medium text-sm mb-3">Variables</h3>
              <p className="text-[10px] text-[#fafaf9]/40 mb-3">Tap to copy</p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-medium text-[#fafaf9]/50 mb-1.5">Lead</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.lead.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                          copiedVar === v.key 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-white/[0.04] text-emerald-400 hover:bg-white/[0.08]'
                        }`}
                      >
                        {copiedVar === v.key ? '✓' : v.key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#fafaf9]/50 mb-1.5">Agency</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.agency.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                          copiedVar === v.key 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-white/[0.04] text-blue-400 hover:bg-white/[0.08]'
                        }`}
                      >
                        {copiedVar === v.key ? '✓' : v.key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-[#fafaf9]/50 mb-1.5">Dynamic</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variables.dynamic.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                          copiedVar === v.key 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-white/[0.04] text-purple-400 hover:bg-white/[0.08]'
                        }`}
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
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h3 className="font-medium mb-4">Available Variables</h3>
              <p className="text-xs text-[#fafaf9]/40 mb-4">
                Click to copy, then paste into your template
              </p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-[#fafaf9]/50 mb-2">Lead Info</p>
                  <div className="space-y-1">
                    {variables.lead.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-mono text-emerald-400 truncate">{v.key}</p>
                          <p className="text-xs text-[#fafaf9]/40 truncate">{v.description}</p>
                        </div>
                        {copiedVar === v.key ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-[#fafaf9]/30 opacity-0 group-hover:opacity-100 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#fafaf9]/50 mb-2">Your Info</p>
                  <div className="space-y-1">
                    {variables.agency.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-mono text-blue-400 truncate">{v.key}</p>
                          <p className="text-xs text-[#fafaf9]/40 truncate">{v.description}</p>
                        </div>
                        {copiedVar === v.key ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-[#fafaf9]/30 opacity-0 group-hover:opacity-100 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#fafaf9]/50 mb-2">Dynamic</p>
                  <div className="space-y-1">
                    {variables.dynamic.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => copyVariable(v.key)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-mono text-purple-400 truncate">{v.key}</p>
                          <p className="text-xs text-[#fafaf9]/40 truncate">{v.description}</p>
                        </div>
                        {copiedVar === v.key ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-[#fafaf9]/30 opacity-0 group-hover:opacity-100 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.08] p-4">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300/80">
                <p className="font-medium mb-1">Tips:</p>
                <ul className="space-y-1 text-blue-300/60">
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