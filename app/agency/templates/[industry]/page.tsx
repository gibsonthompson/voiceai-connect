'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Loader2, ArrowLeft, Save, RotateCcw, Volume2, Play, AlertCircle,
  Check, Info, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';

interface Voice {
  id: string;
  name: string;
  description: string;
  gender: string;
}

interface TemplateData {
  id: string | null;
  isCustom: boolean;
  isActive: boolean;
  system_prompt: string;
  first_message: string;
  voice_id: string;
  voice: Voice | null;
  temperature: number;
  updated_at: string | null;
}

interface IndustryInfo {
  frontendKey: string;
  backendKey: string;
  label: string;
  description: string;
  icon: string;
}

interface Defaults {
  system_prompt: string;
  first_message: string;
  voice_id: string;
  temperature: number;
}

interface Placeholder {
  variable: string;
  description: string;
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const industry = params.industry as string;
  
  const { agency, loading: contextLoading } = useAgency();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  
  const [industryInfo, setIndustryInfo] = useState<IndustryInfo | null>(null);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  
  const [systemPrompt, setSystemPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [temperature, setTemperature] = useState(0.7);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  const inputStyle = {
    backgroundColor: theme.input,
    border: `1px solid ${theme.inputBorder}`,
    color: theme.text,
  };

  useEffect(() => {
    if (agency && industry) {
      fetchTemplateData();
      fetchVoices();
    }
  }, [agency, industry]);

  const fetchTemplateData = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-templates/${industry}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/agency/templates');
          return;
        }
        throw new Error('Failed to fetch template');
      }

      const data = await response.json();
      
      setIndustryInfo(data.industry);
      setTemplate(data.template);
      setDefaults(data.defaults);
      setPlaceholders(data.placeholders || []);
      
      setSystemPrompt(data.template.system_prompt);
      setFirstMessage(data.template.first_message);
      setVoiceId(data.template.voice_id);
      setTemperature(data.template.temperature);
    } catch (error) {
      console.error('Failed to fetch template:', error);
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoices = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-templates/voices`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices || []);
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
    }
  };

  const handleSave = async () => {
    if (!agency) return;
    
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-templates/${industry}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          first_message: firstMessage,
          voice_id: voiceId,
          temperature,
          is_active: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchTemplateData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!agency) return;
    if (!confirm('Reset to default template? Your custom changes will be lost.')) return;
    
    setResetting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-templates/${industry}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to reset template');
      }

      if (defaults) {
        setSystemPrompt(defaults.system_prompt);
        setFirstMessage(defaults.first_message);
        setVoiceId(defaults.voice_id);
        setTemperature(defaults.temperature);
      }
      
      await fetchTemplateData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset');
    } finally {
      setResetting(false);
    }
  };

  const hasChanges = template && (
    systemPrompt !== template.system_prompt ||
    firstMessage !== template.first_message ||
    voiceId !== template.voice_id ||
    temperature !== template.temperature
  );

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const selectedVoice = voices.find(v => v.id === voiceId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/agency/templates"
          className="inline-flex items-center gap-2 text-sm mb-4 transition-colors"
          style={{ color: theme.textMuted }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>
              {industryInfo?.label || 'Edit Template'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {industryInfo?.description}
            </p>
          </div>

          {template?.isCustom && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium flex-shrink-0"
              style={{ backgroundColor: theme.primary15, color: theme.primary }}
            >
              <Check className="h-3 w-3" />
              Custom Template
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div 
          className="mb-6 rounded-xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: theme.errorBg,
            border: `1px solid ${theme.errorBorder}`,
          }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: theme.error }} />
          <p className="text-sm" style={{ color: theme.errorText }}>{error}</p>
        </div>
      )}

      {/* Success */}
      {saved && (
        <div 
          className="mb-6 rounded-xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: theme.primary15,
            border: `1px solid ${theme.primary30}`,
          }}
        >
          <Check className="h-5 w-5" style={{ color: theme.primary }} />
          <p className="text-sm" style={{ color: theme.primary }}>Template saved! New clients will use this configuration.</p>
        </div>
      )}

      {/* Placeholder Info */}
      <div 
        className="mb-6 rounded-xl p-4"
        style={{
          backgroundColor: theme.infoBg,
          border: `1px solid ${theme.infoBorder}`,
        }}
      >
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.info }} />
          <div>
            <p className="text-sm font-medium" style={{ color: theme.infoText }}>
              Available Placeholders
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {placeholders.map((p) => (
                <code 
                  key={p.variable}
                  className="text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: theme.isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.15)',
                    color: theme.info,
                  }}
                >
                  {p.variable}
                </code>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: theme.infoText, opacity: 0.7 }}>
              These will be replaced with actual client data when the assistant is created.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div 
        className="rounded-xl p-6"
        style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
      >
        <div className="space-y-6">
          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
              System Prompt
            </label>
            <p className="text-xs mb-3" style={{ color: theme.textMuted }}>
              Instructions that define how the AI receptionist behaves. Include role, conversation flow, and boundaries.
            </p>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={16}
              className="w-full rounded-xl px-4 py-3 text-sm font-mono transition-colors resize-y"
              style={{ ...inputStyle, minHeight: '300px' }}
              placeholder="Enter the system prompt..."
            />
          </div>

          {/* First Message */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
              First Message (Greeting)
            </label>
            <p className="text-xs mb-3" style={{ color: theme.textMuted }}>
              The initial greeting the AI says when answering a call.
            </p>
            <textarea
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm transition-colors resize-y"
              style={inputStyle}
              placeholder="Hi, you've reached {businessName}..."
            />
          </div>

          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
              Voice
            </label>
            <p className="text-xs mb-3" style={{ color: theme.textMuted }}>
              Powered by <span style={{ color: theme.primary }}>ElevenLabs</span> text-to-speech technology.
            </p>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm transition-colors"
              style={inputStyle}
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} - {voice.description}
                </option>
              ))}
            </select>
            
            {selectedVoice && (
              <div 
                className="mt-3 flex items-center gap-3 rounded-lg p-3"
                style={{ backgroundColor: theme.hover }}
              >
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: theme.primary15 }}
                >
                  <Volume2 className="h-5 w-5" style={{ color: theme.primary }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: theme.text }}>{selectedVoice.name}</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    {selectedVoice.gender} • {selectedVoice.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
              Temperature: {temperature}
            </label>
            <p className="text-xs mb-3" style={{ color: theme.textMuted }}>
              Lower = more consistent/predictable. Higher = more creative/varied. Recommended: 0.7
            </p>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: theme.primary }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: theme.textMuted }}>
              <span>Precise (0)</span>
              <span>Creative (1)</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div 
          className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <button
            onClick={handleReset}
            disabled={resetting || !template?.isCustom}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: theme.input, 
              border: `1px solid ${theme.inputBorder}`,
              color: theme.textMuted,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.input}
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Reset to Default
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}