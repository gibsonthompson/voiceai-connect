'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, Shield, PhoneForwarded, UserCheck, Moon, MessageSquare,
  ChevronDown, Check, Send, X, MapPin, Globe, Star, DollarSign
} from 'lucide-react';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ToolConfig {
  callerRecognition: boolean;
  spamDetection: boolean;
  transferCall: boolean;
  businessHoursRouting: boolean;
  afterHoursMessage: string;
  transferFallbackToMessage: boolean;
  smsToCaller: boolean;
  smsInstructions: string;
  smsSnippets: { label: string; value: string }[];
  smsPresets: Record<string, { enabled: boolean; value: string }>;
}

interface Props {
  clientId: string;
  theme: any;
}

const DEFAULT_CONFIG: ToolConfig = {
  callerRecognition: true,
  spamDetection: true,
  transferCall: true,
  businessHoursRouting: false,
  afterHoursMessage: "We're currently closed, but I'd be happy to take a message and have someone call you back during business hours.",
  transferFallbackToMessage: true,
  smsToCaller: false,
  smsInstructions: '',
  smsSnippets: [],
  smsPresets: {},
};

// Common, pre-built texts the AI can send. The client toggles one on and adds
// the value; the trigger ("when a caller wants to book") is fixed server-side,
// so it fires reliably without the client writing instructions.
const SMS_PRESETS: { key: string; label: string; desc: string; placeholder: string; icon: any }[] = [
  { key: 'address', label: 'Address', desc: 'When a caller asks where you are', placeholder: '123 Main St, City, ST', icon: MapPin },
  { key: 'website', label: 'Website', desc: 'When a caller wants more info', placeholder: 'https://yourbiz.com', icon: Globe },
  { key: 'review', label: 'Review link', desc: 'To ask for a review after a good call', placeholder: 'https://g.page/r/...', icon: Star },
  { key: 'payment', label: 'Payment link', desc: 'When a caller needs to pay', placeholder: 'https://...', icon: DollarSign },
];

export default function ToolConfigSection({ clientId, theme }: Props) {
  const [config, setConfig] = useState<ToolConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showTransferTip, setShowTransferTip] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    fetchConfig();
  }, [clientId]);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/client/${clientId}/tool-config`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setConfig({ ...DEFAULT_CONFIG, ...data.tool_config });
        }
      }
    } catch (e) {
      console.error('Failed to fetch tool config:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (key: keyof ToolConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setSaving(true);
    setSaved(false);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/client/${clientId}/tool-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error('Failed to update tool config:', e);
      setConfig(config);
    } finally {
      setSaving(false);
    }
  };

  const updateAfterHoursMessage = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${backendUrl}/api/client/${clientId}/tool-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ afterHoursMessage: config.afterHoursMessage }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save after-hours message:', e);
    } finally {
      setSaving(false);
    }
  };

  const [smsAdvancedOpen, setSmsAdvancedOpen] = useState(false);

  const persistSms = async (
    presets: Record<string, { enabled: boolean; value: string }>,
    snippets: { label: string; value: string }[],
    instructions: string,
  ) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${backendUrl}/api/client/${clientId}/tool-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          smsPresets: presets || {},
          smsInstructions: instructions || '',
          smsSnippets: (snippets || []).filter(s => (s.label || '').trim() || (s.value || '').trim()),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save SMS config:', e);
    } finally {
      setSaving(false);
    }
  };

  const persistAllSms = () => persistSms(config.smsPresets || {}, config.smsSnippets, config.smsInstructions);
  const togglePreset = (key: string) => {
    const cur = (config.smsPresets && config.smsPresets[key]) || { enabled: false, value: '' };
    const next = { ...(config.smsPresets || {}), [key]: { ...cur, enabled: !cur.enabled } };
    setConfig({ ...config, smsPresets: next });
    persistSms(next, config.smsSnippets, config.smsInstructions);
  };
  const setPresetValue = (key: string, value: string) => {
    const cur = (config.smsPresets && config.smsPresets[key]) || { enabled: true, value: '' };
    setConfig({ ...config, smsPresets: { ...(config.smsPresets || {}), [key]: { ...cur, value } } });
  };

  if (loading) {
    return (
      <section className="mb-4 sm:mb-6">
        <div className="rounded-xl border p-4 shadow-sm flex items-center justify-center py-8" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.textMuted4 }} />
        </div>
      </section>
    );
  }

  const tools = [
    {
      key: 'callerRecognition' as const,
      icon: UserCheck,
      label: 'Caller Recognition',
      description: 'Greet returning callers by name with context from previous calls',
      enabled: config.callerRecognition,
    },
    {
      key: 'spamDetection' as const,
      icon: Shield,
      label: 'Spam Detection',
      description: 'Detect and block robocalls and telemarketers automatically',
      enabled: config.spamDetection,
    },
    {
      key: 'transferCall' as const,
      icon: PhoneForwarded,
      label: 'Call Transfer',
      description: 'Transfer calls to your phone for emergencies and complex requests',
      enabled: config.transferCall,
    },
    {
      key: 'transferFallbackToMessage' as const,
      icon: MessageSquare,
      label: 'Transfer Fallback',
      description: "If transfer isn't answered, AI stays on and takes a message instead",
      enabled: config.transferFallbackToMessage,
      dependsOn: 'transferCall' as const,
    },
    {
      key: 'businessHoursRouting' as const,
      icon: Moon,
      label: 'After-Hours Mode',
      description: 'Different behavior when your business is closed — message-taking only, no transfers',
      enabled: config.businessHoursRouting,
    },
    {
      key: 'smsToCaller' as const,
      icon: Send,
      label: 'Text Callers',
      description: 'Let the AI text the caller during a call (booking links, confirmations, addresses, reminders). Sends to the number they called from.',
      enabled: config.smsToCaller,
    },
  ];

  return (
    <section className="mb-4 sm:mb-6">
      <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Shield className="w-4 h-4" style={{ color: theme.primary }} />
        AI Tools
        {saved && (
          <span className="text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.successBg, color: theme.success }}>
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </h2>
      <div className="rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
        <div className="p-3 sm:p-4 space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isDisabled = tool.dependsOn && !config[tool.dependsOn];

            return (
              <div key={tool.key}>
                <div
                  className="flex items-center justify-between gap-3 p-3 sm:p-3 rounded-lg transition"
                  style={{
                    backgroundColor: tool.enabled && !isDisabled ? hexToRgba(theme.primary, theme.isDark ? 0.06 : 0.02) : 'transparent',
                    opacity: isDisabled ? 0.4 : 1,
                  }}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: tool.enabled && !isDisabled ? hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) : theme.bg }}
                    >
                      <Icon className="w-4 h-4" style={{ color: tool.enabled && !isDisabled ? theme.primary : theme.textMuted4 }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium" style={{ color: theme.text }}>{tool.label}</p>
                      <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>{tool.description}</p>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => !isDisabled && updateConfig(tool.key, !tool.enabled)}
                    disabled={saving || isDisabled}
                    className="relative rounded-full transition-colors flex-shrink-0 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: tool.enabled && !isDisabled ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'),
                      minWidth: '2.75rem',
                      width: '2.75rem',
                      height: '1.625rem',
                    }}
                  >
                    <span
                      className="absolute rounded-full transition-all duration-200 shadow-sm"
                      style={{
                        width: '1.375rem',
                        height: '1.375rem',
                        top: '0.125rem',
                        backgroundColor: '#fff',
                        left: tool.enabled && !isDisabled ? 'calc(100% - 1.5rem)' : '0.125rem',
                      }}
                    />
                  </button>
                </div>

                {/* Transfer troubleshooting tip — under Call Transfer */}
                {tool.key === 'transferCall' && config.transferCall && (
                  <div className="ml-10 sm:ml-11 mt-1 mb-1">
                    <button
                      onClick={() => setShowTransferTip(!showTransferTip)}
                      className="flex items-center gap-1.5 text-[10px] sm:text-xs transition hover:opacity-80"
                      style={{ color: theme.textMuted4 }}
                    >
                      <ChevronDown
                        className="w-3 h-3 transition-transform"
                        style={{ transform: showTransferTip ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                      Calls not transferring?
                    </button>
                    {showTransferTip && (
                      <div
                        className="mt-1.5 p-2.5 sm:p-3 rounded-lg text-[10px] sm:text-xs space-y-1.5"
                        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
                      >
                        <p style={{ color: theme.textMuted }}>
                          Make sure your phone allows calls from unknown numbers. Transferred calls come from your AI number, which your phone may silently block.
                        </p>
                        <p style={{ color: theme.textMuted4 }}>
                          <span className="font-medium" style={{ color: theme.textMuted }}>iPhone:</span> Settings → Phone → Silence Unknown Callers → Off
                        </p>
                        <p style={{ color: theme.textMuted4 }}>
                          <span className="font-medium" style={{ color: theme.textMuted }}>Android:</span> Phone → Settings → Caller ID &amp; spam → turn off spam filtering
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* After-hours message — shown when businessHoursRouting is on */}
        {config.businessHoursRouting && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
              <label className="block text-[10px] sm:text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>
                After-hours message
              </label>
              <textarea
                value={config.afterHoursMessage}
                onChange={(e) => setConfig({ ...config, afterHoursMessage: e.target.value })}
                onBlur={updateAfterHoursMessage}
                rows={2}
                className="w-full rounded-lg px-2.5 py-2 text-xs resize-none focus:outline-none focus:ring-2 transition"
                style={{
                  backgroundColor: theme.input,
                  border: `1px solid ${theme.inputBorder}`,
                  color: theme.text,
                }}
                placeholder="We're currently closed, but I'd be happy to take a message..."
              />
              <p className="text-[9px] mt-1" style={{ color: theme.textMuted4 }}>
                Your AI will say this when someone calls outside business hours. Make sure your business hours are set in settings.
              </p>
            </div>
          </div>
        )}

        {/* SMS to caller: pick what the AI can text, shown when Text Callers is on */}
        {config.smsToCaller && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
              <p className="text-[10px] mb-2.5" style={{ color: theme.textMuted }}>Turn on what your AI can text callers during a call, then add the link or info. It only ever texts the person on the call.</p>

              {SMS_PRESETS.map((preset) => {
                const p = (config.smsPresets && config.smsPresets[preset.key]) || { enabled: false, value: '' };
                const Icon = preset.icon;
                return (
                  <div key={preset.key} className="mb-2 rounded-lg overflow-hidden" style={{ border: `1px solid ${p.enabled ? theme.primary : theme.inputBorder}` }}>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: p.enabled ? theme.primary : theme.textMuted4 }} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium" style={{ color: theme.text }}>{preset.label}</p>
                          <p className="text-[9px]" style={{ color: theme.textMuted4 }}>{preset.desc}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => togglePreset(preset.key)} aria-pressed={p.enabled} className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors" style={{ backgroundColor: p.enabled ? theme.primary : theme.inputBorder }}>
                        <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: p.enabled ? '18px' : '2px' }} />
                      </button>
                    </div>
                    {p.enabled && (
                      <div className="px-2.5 pb-2">
                        <input value={p.value} onChange={(e) => setPresetValue(preset.key, e.target.value)} onBlur={persistAllSms} placeholder={preset.placeholder} className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                      </div>
                    )}
                  </div>
                );
              })}

              <button type="button" onClick={() => setSmsAdvancedOpen(o => !o)} className="flex items-center gap-1 text-[10px] font-medium mt-1" style={{ color: theme.textMuted }}>
                <ChevronDown className={`h-3 w-3 transition-transform ${smsAdvancedOpen ? 'rotate-180' : ''}`} /> Advanced
              </button>
              {smsAdvancedOpen && (
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                  <label className="block text-[10px] font-medium mb-1" style={{ color: theme.textMuted }}>Custom texts</label>
                  <p className="text-[9px] mb-1.5" style={{ color: theme.textMuted4 }}>For anything not above. A label and the exact text or link, sent word-for-word.</p>
                  {(config.smsSnippets || []).map((snip, i) => (
                    <div key={i} className="flex items-center gap-1.5 mb-1.5">
                      <input value={snip.label} onChange={(e) => { const s = [...(config.smsSnippets || [])]; s[i] = { ...s[i], label: e.target.value }; setConfig({ ...config, smsSnippets: s }); }} onBlur={persistAllSms} placeholder="Label" className="w-1/3 rounded-lg px-2 py-1.5 text-xs focus:outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                      <input value={snip.value} onChange={(e) => { const s = [...(config.smsSnippets || [])]; s[i] = { ...s[i], value: e.target.value }; setConfig({ ...config, smsSnippets: s }); }} onBlur={persistAllSms} placeholder="Exact text or link" className="flex-1 rounded-lg px-2 py-1.5 text-xs focus:outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                      <button onClick={() => { const s = (config.smsSnippets || []).filter((_, j) => j !== i); setConfig({ ...config, smsSnippets: s }); persistSms(config.smsPresets || {}, s, config.smsInstructions); }} className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg hover:opacity-70" style={{ color: theme.textMuted }} title="Remove"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setConfig({ ...config, smsSnippets: [...(config.smsSnippets || []), { label: '', value: '' }] })} className="text-[10px] font-medium mb-3" style={{ color: theme.primary }}>+ Add a custom text</button>

                  <label className="block text-[10px] font-medium mb-1 mt-1" style={{ color: theme.textMuted }}>Extra instructions (optional)</label>
                  <textarea value={config.smsInstructions} onChange={(e) => setConfig({ ...config, smsInstructions: e.target.value })} onBlur={persistAllSms} rows={2} className="w-full rounded-lg px-2.5 py-2 text-xs resize-none focus:outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} placeholder="Fine-tune when or how the AI texts, e.g. always send a confirmation after booking." />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}