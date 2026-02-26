'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, Mail, MessageSquare, Save, Info,
  Copy, Check
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
    if (formData.type === 'email' && !formData.subject.trim()) { setError('Subject is required'); return; }

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" />
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="mb-7">
        <Link 
          href="/admin/outreach"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Outreach
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-white tracking-tight">
              {isNew ? 'Create Template' : 'Edit Template'}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <div className={`flex h-5 w-5 items-center justify-center rounded ${
                formData.type === 'email' ? 'bg-violet-500/[0.1]' : 'bg-cyan-500/[0.1]'
              }`}>
                {formData.type === 'email' 
                  ? <Mail className="h-3 w-3 text-violet-400" />
                  : <MessageSquare className="h-3 w-3 text-cyan-400" />
                }
              </div>
              <span className="text-xs text-white/30">
                {formData.type === 'email' ? 'Email template' : 'SMS template'}
              </span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#050505] hover:bg-emerald-400 disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Template
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-500/[0.06] border border-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
            <h3 className="text-xs font-medium text-white/30 uppercase tracking-[0.1em] mb-5">Template Info</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-white/40 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Cold Email - Agency Pitch"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/30 transition-colors"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="When to use this template"
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/30 transition-colors"
                />
              </div>
              {/* Sequence settings */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-white/40 mb-2">Sequence Order</label>
                  <input
                    type="number"
                    value={formData.sequence_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sequence_order: e.target.value }))}
                    placeholder="1, 2, 3..."
                    className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/30 transition-colors"
                  />
                  <p className="text-[10px] text-white/20 mt-1.5">Position in outreach sequence</p>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2">Delay (days)</label>
                  <input
                    type="number"
                    value={formData.delay_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, delay_days: e.target.value }))}
                    placeholder="3"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/30 transition-colors"
                  />
                  <p className="text-[10px] text-white/20 mt-1.5">Days after previous step</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-medium text-white/30 uppercase tracking-[0.1em]">Content</h3>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="text-xs text-emerald-400/60 hover:text-emerald-400 transition-colors"
              >
                {showVariables ? 'Hide' : 'Show'} Variables
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.type === 'email' && (
                <div>
                  <label className="block text-xs text-white/40 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Quick question about {lead_business_name}"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-sm font-mono text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/30 transition-colors"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-white/40 mb-2">Body *</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Write your message here. Use {variables} to personalize."
                  rows={formData.type === 'email' ? 14 : 6}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm font-mono text-white/80 resize-y focus:outline-none focus:border-emerald-500/30 leading-relaxed placeholder:text-white/15 transition-colors"
                />
                {formData.type === 'sms' && (
                  <p className="text-[10px] text-white/20 mt-1.5 tabular-nums">
                    {formData.body.length} characters · {Math.ceil(formData.body.length / 160) || 1} segment{formData.body.length > 160 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Variables */}
        <div className="space-y-5">
          {showVariables && variables && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
              <h3 className="text-xs font-medium text-white/30 uppercase tracking-[0.1em] mb-1.5">Available Variables</h3>
              <p className="text-[10px] text-white/20 mb-5">Click to copy, paste into template</p>
              
              <div className="space-y-5">
                {[
                  { label: 'Lead Info', items: variables.lead, color: 'text-emerald-400/80', dotColor: 'bg-emerald-400' },
                  { label: 'Your Info', items: variables.sender, color: 'text-cyan-400/80', dotColor: 'bg-cyan-400' },
                  { label: 'Dynamic', items: variables.dynamic, color: 'text-violet-400/80', dotColor: 'bg-violet-400' },
                ].map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${group.dotColor} opacity-50`} />
                      <p className="text-[10px] font-medium text-white/25 uppercase tracking-[0.1em]">{group.label}</p>
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((v) => (
                        <button
                          key={v.key}
                          onClick={() => copyVariable(v.key)}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.03] transition-colors text-left group"
                        >
                          <div className="min-w-0">
                            <p className={`text-xs font-mono truncate ${group.color}`}>{v.key}</p>
                            <p className="text-[10px] text-white/20 truncate">{v.description}</p>
                          </div>
                          {copiedVar === v.key ? (
                            <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 shrink-0 text-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
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
          <div className="rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/[0.06] p-4">
            <div className="flex items-start gap-2.5">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400/50" />
              <div className="text-[11px] text-emerald-400/40 leading-relaxed">
                <p className="font-medium mb-1.5 text-emerald-400/60">Tips</p>
                <ul className="space-y-1">
                  <li>Keep subject lines under 50 chars</li>
                  <li>Personalize with first name</li>
                  <li>One clear call-to-action</li>
                  <li>Use sequence order for multi-step campaigns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}