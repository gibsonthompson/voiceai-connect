'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Loader2, ArrowLeft, Save, RotateCcw, Volume2, Play, AlertCircle,
  Check, Info, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';

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
  
  const { agency, branding, loading: contextLoading } = useAgency();
  
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
  
  // Form state
  const [systemPrompt, setSystemPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [temperature, setTemperature] = useState(0.7);

  // Theme
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';

  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

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
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/templates/${industry}`, {
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
      
      // Set form values
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
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/templates/voices`, {
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
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/templates/${industry}`, {
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
      
      // Refresh data
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
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/templates/${industry}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to reset template');
      }

      // Reset form to defaults
      if (defaults) {
        setSystemPrompt(defaults.system_prompt);
        setFirstMessage(defaults.first_message);
        setVoiceId(defaults.voice_id);
        setTemperature(defaults.temperature);
      }
      
      // Refresh data
      await fetchTemplateData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset');
    } finally {
      setResetting(false);
    }
  };

  // Check if form has changes from current saved state
  const hasChanges = template && (
    systemPrompt !== template.system_prompt ||
    firstMessage !== template.first_message ||
    voiceId !== template.voice_id ||
    temperature !== template.temperature
  );

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
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
          style={{ color: mutedTextColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {industryInfo?.label || 'Edit Template'}
            </h1>
            <p className="mt-1 text-sm" style={{ color: mutedTextColor }}>
              {industryInfo?.description}
            </p>
          </div>

          {template?.isCustom && (
            <span 
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium flex-shrink-0"
              style={{ 
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
              }}
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
            backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
            border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid #fecaca',
          }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: isDark ? '#f87171' : '#dc2626' }} />
          <p className="text-sm" style={{ color: isDark ? '#f87171' : '#dc2626' }}>{error}</p>
        </div>
      )}

      {/* Success */}
      {saved && (
        <div 
          className="mb-6 rounded-xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: `${primaryColor}15`,
            border: `1px solid ${primaryColor}30`,
          }}
        >
          <Check className="h-5 w-5" style={{ color: primaryColor }} />
          <p className="text-sm" style={{ color: primaryColor }}>Template saved! New clients will use this configuration.</p>
        </div>
      )}

      {/* Placeholder Info */}
      <div 
        className="mb-6 rounded-xl p-4"
        style={{
          backgroundColor: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: isDark ? '#93c5fd' : '#1e40af' }}>
              Available Placeholders
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {placeholders.map((p) => (
                <code 
                  key={p.variable}
                  className="text-xs px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.15)',
                    color: isDark ? '#93c5fd' : '#1d4ed8',
                  }}
                >
                  {p.variable}
                </code>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: isDark ? 'rgba(147,197,253,0.7)' : '#3b82f6' }}>
              These will be replaced with actual client data when the assistant is created.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div 
        className="rounded-xl p-6"
        style={{ 
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
        }}
      >
        <div className="space-y-6">
          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2">
              System Prompt
            </label>
            <p className="text-xs mb-3" style={{ color: mutedTextColor }}>
              Instructions that define how the AI receptionist behaves. Include role, conversation flow, and boundaries.
            </p>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={16}
              className="w-full rounded-xl px-4 py-3 text-sm font-mono transition-colors resize-y"
              style={{ 
                backgroundColor: inputBg, 
                border: `1px solid ${inputBorder}`, 
                color: textColor,
                minHeight: '300px',
              }}
              placeholder="Enter the system prompt..."
            />
          </div>

          {/* First Message */}
          <div>
            <label className="block text-sm font-medium mb-2">
              First Message (Greeting)
            </label>
            <p className="text-xs mb-3" style={{ color: mutedTextColor }}>
              The initial greeting the AI says when answering a call.
            </p>
            <textarea
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm transition-colors resize-y"
              style={{ 
                backgroundColor: inputBg, 
                border: `1px solid ${inputBorder}`, 
                color: textColor,
              }}
              placeholder="Hi, you've reached {businessName}..."
            />
          </div>

          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Voice
            </label>
            <p className="text-xs mb-3" style={{ color: mutedTextColor }}>
              Powered by <span style={{ color: primaryColor }}>ElevenLabs</span> text-to-speech technology.
            </p>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm transition-colors"
              style={{ 
                backgroundColor: inputBg, 
                border: `1px solid ${inputBorder}`, 
                color: textColor,
              }}
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
                style={{ 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                }}
              >
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Volume2 className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedVoice.name}</p>
                  <p className="text-xs" style={{ color: mutedTextColor }}>
                    {selectedVoice.gender} • {selectedVoice.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Temperature: {temperature}
            </label>
            <p className="text-xs mb-3" style={{ color: mutedTextColor }}>
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
              style={{ accentColor: primaryColor }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: mutedTextColor }}>
              <span>Precise (0)</span>
              <span>Creative (1)</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div 
          className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${borderColor}` }}
        >
          <button
            onClick={handleReset}
            disabled={resetting || !template?.isCustom}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
              isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]'
            }`}
            style={{ 
              backgroundColor: inputBg, 
              border: `1px solid ${inputBorder}`,
              color: mutedTextColor,
            }}
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
            style={{ 
              backgroundColor: primaryColor, 
              color: isDark ? '#050505' : '#ffffff',
            }}
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