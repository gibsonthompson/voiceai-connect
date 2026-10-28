'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Mail, MessageSquare, Save, Info,
  Copy, Check, Linkedin, ChevronDown
} from 'lucide-react';

interface TemplateVariable {
  key: string;
  label: string;
  description: string;
}

interface VariableGroup {
  lead: TemplateVariable[];
  sender: TemplateVariable[];
  dynamic: TemplateVariable[];
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'email': return <Mail className="h-3 w-3 text-[var(--a-violet)]" />;
    case 'sms': return <MessageSquare className="h-3 w-3 text-[var(--a-cyan)]" />;
    case 'linkedin': return <Linkedin className="h-3 w-3 text-blue-600" />;
    default: return <Mail className="h-3 w-3 text-[var(--a-violet)]" />;
  }
}

function getTypeBg(type: string) {
  switch (type) {
    case 'email': return 'bg-[var(--a-violet-soft)]';
    case 'sms': return 'bg-[var(--a-cyan-soft)]';
    case 'linkedin': return 'bg-blue-500/[0.1]';
    default: return 'bg-[var(--a-violet-soft)]';
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'email': return 'Email template';
    case 'sms': return 'SMS template';
    case 'linkedin': return 'LinkedIn template';
    default: return 'Email template';
  }
}

// Custom themed Type picker. Replaces the native <select> so the admin light
// theme is applied consistently and no OS/Safari picker UI appears anywhere.
function TypeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const options = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'linkedin', label: 'LinkedIn' },
  ];
  const current = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="a-input flex items-center justify-between text-left"
        style={{ cursor: 'pointer' }}
      >
        <span className="text-[var(--a-ink)]">{current.label}</span>
        <ChevronDown className={`h-4 w-4 text-[var(--a-dim)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 a-card overflow-hidden py-1">
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-[var(--a-ink)] hover:bg-[var(--a-em-soft)] transition-colors text-left"
              >
                {o.label}
                {o.value === value && <Check className="h-3.5 w-3.5 text-[var(--a-em-deep)]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminTemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = params.id as string;
  const isNew = templateId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [variables, setVariables] = useState<VariableGroup | null>(null);
  const [showVariables, setShowVariables] = useState(true);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: searchParams.get('type') || 'email',
    subject: '',
    body: '',
    is_follow_up: false,
    sequence_name: '',
    sequence_order: '',
    delay_days: '',
  });

  const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const getToken = () => localStorage.getItem('admin_token');

  useEffect(() => {
    fetchVariables();
    if (!isNew) fetchTemplate();
  }, [templateId]);

  const fetchVariables = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/outreach/variables`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
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
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/templates/${templateId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });

      if (!response.ok) { setError('Template not found'); setLoading(false); return; }

      const data = await response.json();
      setFormData({
        name: data.template.name || '',
        description: data.template.description || '',
        type: data.template.type || 'email',
        subject: data.template.subject || '',
        body: data.template.body || '',
        is_follow_up: data.template.is_follow_up || false,
        sequence_name: data.template.sequence_name || '',
        sequence_order: data.template.sequence_order?.toString() || '',
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
    if (!formData.name.trim()) { setError('Template name is required'); return; }
    if (!formData.body.trim()) { setError('Template body is required'); return; }
    if (formData.type === 'email' && !formData.subject.trim()) { setError('Subject is required for email templates'); return; }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        sequence_order: formData.sequence_order ? parseInt(formData.sequence_order) : null,
        delay_days: formData.delay_days ? parseInt(formData.delay_days) : null,
      };

      const url = isNew
        ? `${getBackendUrl()}/api/admin/templates`
        : `${getBackendUrl()}/api/admin/templates/${templateId}`;

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      router.push('/admin/outreach');
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

  if (loading) {
    return (
      <div className="admin-scope flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" />
      </div>
    );
  }

  const inputClass = "w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-4 py-2.5 text-sm text-[var(--a-ink)] placeholder:text-[var(--a-dim)] focus:outline-none focus:border-[var(--a-em-line)] transition-colors";

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="mb-7">
        <Link
          href="/admin/outreach"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--a-muted)] hover:text-[var(--a-ink)] transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Outreach
        </Link>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-[var(--a-ink)] tracking-tight">
              {isNew ? 'Create Template' : 'Edit Template'}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`flex h-5 w-5 items-center justify-center rounded ${getTypeBg(formData.type)}`}>
                {getTypeIcon(formData.type)}
              </div>
              <span className="text-xs text-[var(--a-muted)]">{getTypeLabel(formData.type)}</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="a-btn px-5 py-2.5 text-sm shrink-0"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Template
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-[var(--a-red-soft)] border border-[var(--a-red-soft)] p-4 text-sm text-[var(--a-red)]">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <div className="a-card p-6">
            <h3 className="text-xs font-medium text-[var(--a-muted)] uppercase tracking-[0.1em] mb-5">Template Info</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-[var(--a-muted)] mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={formData.type === 'linkedin' ? 'e.g., LinkedIn Connect - Agency Owner' : 'e.g., Cold Email - Agency Pitch'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--a-muted)] mb-2">Type</label>
                  <TypeSelect
                    value={formData.type}
                    onChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--a-muted)] mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={formData.type === 'linkedin' ? 'e.g., Connection request for agency owners' : 'When to use this template'}
                  className={inputClass}
                />
              </div>
              {/* Sequence settings */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-[var(--a-muted)] mb-2">Sequence Order</label>
                  <input
                    type="number"
                    value={formData.sequence_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sequence_order: e.target.value }))}
                    placeholder="1, 2, 3..."
                    className={inputClass}
                  />
                  <p className="text-[10px] text-[var(--a-dim)] mt-1.5">Position in outreach sequence</p>
                </div>
                <div>
                  <label className="block text-xs text-[var(--a-muted)] mb-2">Delay (days)</label>
                  <input
                    type="number"
                    value={formData.delay_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, delay_days: e.target.value }))}
                    placeholder="3"
                    className={inputClass}
                  />
                  <p className="text-[10px] text-[var(--a-dim)] mt-1.5">Days after previous step</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="a-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-medium text-[var(--a-muted)] uppercase tracking-[0.1em]">Content</h3>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="text-xs text-[var(--a-em-deep)] hover:text-[var(--a-em)] transition-colors"
              >
                {showVariables ? 'Hide' : 'Show'} Variables
              </button>
            </div>

            <div className="space-y-4">
              {formData.type === 'email' && (
                <div>
                  <label className="block text-xs text-[var(--a-muted)] mb-2">Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Quick question about {lead_business_name}"
                    className={`${inputClass} font-mono`}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-[var(--a-muted)] mb-2">
                  {formData.type === 'linkedin' ? 'Message *' : 'Body *'}
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder={
                    formData.type === 'linkedin'
                      ? 'Hi {lead_contact_first_name}, I noticed {lead_business_name}...'
                      : 'Write your message here. Use {variables} to personalize.'
                  }
                  rows={formData.type === 'email' ? 14 : formData.type === 'linkedin' ? 8 : 6}
                  className="w-full rounded-xl bg-[var(--a-card)] border border-[var(--a-line-2)] px-4 py-3 text-sm font-mono text-[var(--a-ink)] resize-y focus:outline-none focus:border-[var(--a-em-line)] leading-relaxed placeholder:text-[var(--a-dim)] transition-colors"
                />
                {(formData.type === 'sms' || formData.type === 'linkedin') && (
                  <p className="text-[10px] text-[var(--a-dim)] mt-1.5 tabular-nums">
                    {formData.body.length} characters
                    {formData.type === 'sms' && ` · ${Math.ceil(formData.body.length / 160) || 1} segment${formData.body.length > 160 ? 's' : ''}`}
                    {formData.type === 'linkedin' && ` · Connection requests: ~300 char limit · Messages: ~8,000`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Variables */}
        <div className="space-y-5">
          {showVariables && variables && (
            <div className="a-card p-5">
              <h3 className="text-xs font-medium text-[var(--a-muted)] uppercase tracking-[0.1em] mb-1.5">Available Variables</h3>
              <p className="text-[10px] text-[var(--a-dim)] mb-5">Click to copy, paste into template</p>

              <div className="space-y-5">
                {[
                  { label: 'Lead Info', items: variables.lead, color: 'text-[var(--a-em-deep)]', dotColor: 'bg-[var(--a-em)]' },
                  { label: 'Your Info', items: variables.sender, color: 'text-[var(--a-cyan)]', dotColor: 'bg-[var(--a-cyan)]' },
                  { label: 'Dynamic', items: variables.dynamic, color: 'text-[var(--a-violet)]', dotColor: 'bg-[var(--a-violet)]' },
                ].map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${group.dotColor} opacity-70`} />
                      <p className="text-[10px] font-medium text-[var(--a-muted)] uppercase tracking-[0.1em]">{group.label}</p>
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((v) => (
                        <button
                          key={v.key}
                          onClick={() => copyVariable(v.key)}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-[var(--a-em-soft)] transition-colors text-left group"
                        >
                          <div className="min-w-0">
                            <p className={`text-xs font-mono truncate ${group.color}`}>{v.key}</p>
                            <p className="text-[10px] text-[var(--a-dim)] truncate">{v.description}</p>
                          </div>
                          {copiedVar === v.key ? (
                            <Check className="h-3 w-3 shrink-0 text-[var(--a-em-deep)]" />
                          ) : (
                            <Copy className="h-3 w-3 shrink-0 text-[var(--a-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-2xl bg-[var(--a-em-soft)] border border-[var(--a-em-line)] p-4">
            <div className="flex items-start gap-2.5">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--a-em)]" />
              <div className="text-[11px] text-[var(--a-em-deep)] leading-relaxed">
                <p className="font-semibold mb-1.5 text-[var(--a-em-deep)]">Tips</p>
                <ul className="space-y-1">
                  {formData.type === 'linkedin' ? (
                    <>
                      <li>Connection notes: keep under 300 chars</li>
                      <li>Reference something specific about them</li>
                      <li>Don&apos;t pitch in the connection request</li>
                      <li>First message after connect: provide value</li>
                      <li>Use sequence order for multi-step campaigns</li>
                    </>
                  ) : (
                    <>
                      <li>Keep subject lines under 50 chars</li>
                      <li>Personalize with first name</li>
                      <li>One clear call-to-action</li>
                      <li>Use sequence order for multi-step campaigns</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
