'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, Shield, PhoneForwarded, UserCheck, Moon,
  ChevronDown, Check, Send, X, MapPin, Globe, Star, DollarSign,
  MessageSquareText
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
  smsToCaller: boolean;
  smsInstructions: string;
  smsSnippets: { label: string; value: string }[];
  smsPresets: Record<string, { enabled: boolean; value: string }>;
}

interface Props {
  clientId: string;
  theme: any;
  compact?: boolean;
  industry?: string;
}

const DEFAULT_CONFIG: ToolConfig = {
  callerRecognition: true,
  spamDetection: true,
  transferCall: true,
  businessHoursRouting: true,
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

// Example custom-text label for the client's industry. These must be things the
// AI actually TEXTS to the caller's phone (a link or a short note it can send),
// not knowledge it just speaks (service area, hours, pricing live in the
// knowledge base, so they are never examples here). Keyed off client.industry,
// same keys the services/staff sections use, with a textable default fallback.
const INDUSTRY_SMS_EXAMPLES: Record<string, string> = {
  dental: 'New patient form',
  medical_practice: 'New patient form',
  mental_health: 'Intake form',
  veterinary: 'New client form',
  chiropractic: 'New patient form',
  optometry: 'New patient form',
  physical_therapy: 'Intake form',
  salon_spa: 'Booking link',
  legal: 'Intake form',
  real_estate: 'Listing link',
  automotive: 'Specials link',
  home_services: 'Financing link',
  fitness: 'Class schedule',
  restaurant: 'Menu link',
  healthcare: 'New patient form',
};
const DEFAULT_SMS_EXAMPLE = 'Booking link';

export default function ToolConfigSection({ clientId, theme, compact, industry }: Props) {
  const smsLabelExample = (industry && INDUSTRY_SMS_EXAMPLES[industry]) || DEFAULT_SMS_EXAMPLE;
  const [config, setConfig] = useState<ToolConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showTransferTip, setShowTransferTip] = useState(false);
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  // Address + website the AI already knows (from the knowledge base), used to
  // pre-fill the texting presets so the client doesn't re-type them.
  const [kbContact, setKbContact] = useState<{ address: string; website: string }>({ address: '', website: '' });
  const [autoFilled, setAutoFilled] = useState<Record<string, boolean>>({});

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
          const merged = { ...DEFAULT_CONFIG, ...data.tool_config };
          const kb = (data.kb_contact && typeof data.kb_contact === 'object')
            ? { address: String(data.kb_contact.address || ''), website: String(data.kb_contact.website || '') }
            : { address: '', website: '' };
          setKbContact(kb);
          // Snapshot the stored state first, so a pre-filled value shows as an
          // unsaved change and nudges the client to Save.
          setSmsSnapshot(smsKey(merged));
          // Pre-fill the address/website presets from the knowledge base when the
          // client has not typed a value yet. Never overwrites an existing one.
          const presets = { ...(merged.smsPresets || {}) };
          const filled: Record<string, boolean> = {};
          (['address', 'website'] as const).forEach((k) => {
            const val = kb[k];
            if (!val) return;
            const cur = presets[k] || { enabled: false, value: '' };
            if (!cur.value || !String(cur.value).trim()) { presets[k] = { ...cur, value: val }; filled[k] = true; }
          });
          setConfig({ ...merged, smsPresets: presets });
          setAutoFilled(filled);
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

  const [smsAdvancedOpen, setSmsAdvancedOpen] = useState(false);

  const togglePreset = (key: string) => {
    const cur = (config.smsPresets && config.smsPresets[key]) || { enabled: false, value: '' };
    const next = { ...(config.smsPresets || {}), [key]: { ...cur, enabled: !cur.enabled } };
    setConfig({ ...config, smsPresets: next });
  };
  const setPresetValue = (key: string, value: string) => {
    const cur = (config.smsPresets && config.smsPresets[key]) || { enabled: true, value: '' };
    setConfig({ ...config, smsPresets: { ...(config.smsPresets || {}), [key]: { ...cur, value } } });
    setAutoFilled(prev => prev[key] ? { ...prev, [key]: false } : prev);
  };

  // Explicit save for the SMS details (presets / custom texts / instructions),
  // so it is unambiguous whether they saved. The master toggle still auto-saves;
  // these details now save on a button with a persistent confirmation.
  const smsKey = (c: ToolConfig) => JSON.stringify({
    p: c.smsPresets || {},
    s: (c.smsSnippets || []).filter((x) => (x.label || '').trim() || (x.value || '').trim()),
    i: c.smsInstructions || '',
  });
  const [smsSnapshot, setSmsSnapshot] = useState('');
  const [smsJustSaved, setSmsJustSaved] = useState(false);
  const smsDirty = smsKey(config) !== smsSnapshot;

  const saveSms = async () => {
    setSaving(true);
    setSmsJustSaved(false);
    try {
      const token = localStorage.getItem('auth_token');
      const cleanedSnippets = (config.smsSnippets || []).filter((x) => (x.label || '').trim() || (x.value || '').trim());
      const res = await fetch(`${backendUrl}/api/client/${clientId}/tool-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ smsPresets: config.smsPresets || {}, smsInstructions: config.smsInstructions || '', smsSnippets: cleanedSnippets }),
      });
      if (res.ok) {
        const nc = { ...config, smsSnippets: cleanedSnippets };
        setConfig(nc);
        setSmsSnapshot(smsKey(nc));
        setSmsJustSaved(true);
        setTimeout(() => setSmsJustSaved(false), 5000);
      }
    } catch (e) {
      console.error('Failed to save SMS config:', e);
    } finally {
      setSaving(false);
    }
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

  type ToolRow = {
    key: keyof ToolConfig;
    icon: any;
    label: string;
    description: string;
    enabled: boolean;
    dependsOn?: keyof ToolConfig;
    details?: string;
  };

  const tools: ToolRow[] = [
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
      key: 'smsToCaller' as const,
      icon: Send,
      label: 'Text Callers',
      description: 'Let the AI text the caller during a call (booking links, confirmations, addresses, reminders). Sends to the number they called from.',
      enabled: config.smsToCaller,
    },
    {
      key: 'transferCall' as const,
      icon: PhoneForwarded,
      label: 'Call Transfer',
      description: 'Transfer calls to your phone for emergencies and complex requests',
      enabled: config.transferCall,
    },
    {
      key: 'businessHoursRouting' as const,
      icon: Moon,
      label: 'After-Hours Mode',
      description: 'How the AI behaves when you’re closed: still books and takes messages, but won’t transfer to a person',
      enabled: config.businessHoursRouting,
      details: "This is the AI’s closed-hours mode, based on your Business Hours. When you’re closed, the AI still answers, books appointments, and takes messages, then tells the caller someone will follow up. The one thing it skips is transferring the caller to a live person, since no one is in to take the call. Appointments are always booked inside your open hours. Only turn this off if someone can take live transfers 24/7.",
    },
  ];

  return (
    <section className={compact ? '' : 'mb-4 sm:mb-6'}>
      {!compact && (
      <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
        <Shield className="w-4 h-4" style={{ color: theme.primary }} />
        AI Tools
        {saved && (
          <span className="text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.successBg, color: theme.success }}>
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </h2>
      )}
      <div className={compact ? 'overflow-hidden' : 'rounded-xl border shadow-sm overflow-hidden'} style={compact ? {} : { borderColor: theme.border, backgroundColor: theme.card }}>
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

                {/* Transfer troubleshooting tip, under Call Transfer */}
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

                {/* "What's this?" explainer for the subtler tools */}
                {tool.details && (
                  <div className="ml-10 sm:ml-11 mt-1 mb-1">
                    <button
                      onClick={() => setOpenDetail(openDetail === tool.key ? null : tool.key)}
                      className="flex items-center gap-1.5 text-[10px] sm:text-xs transition hover:opacity-80"
                      style={{ color: theme.textMuted4 }}
                    >
                      <ChevronDown
                        className="w-3 h-3 transition-transform"
                        style={{ transform: openDetail === tool.key ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                      What&apos;s this?
                    </button>
                    {openDetail === tool.key && (
                      <div
                        className="mt-1.5 p-2.5 sm:p-3 rounded-lg text-[10px] sm:text-xs"
                        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
                      >
                        <p style={{ color: theme.textMuted }}>{tool.details}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Callers config: what the AI can text, directly under its own row */}
                {tool.key === 'smsToCaller' && config.smsToCaller && (
                  <div className="mt-2">
                    <div className="p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                      <p className="text-[10px] mb-2.5" style={{ color: theme.textMuted }}>Turn on what your AI can text callers during a call, then add the link or info. It only ever texts the person on the call.</p>

                      {/* Preset texts */}
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
                            {p.enabled && (() => {
                              const kbVal = (preset.key === 'address' || preset.key === 'website') ? (kbContact[preset.key] || '') : '';
                              const isEmpty = !p.value || !String(p.value).trim();
                              return (
                                <div className="px-2.5 pb-2">
                                  <input value={p.value} onChange={(e) => setPresetValue(preset.key, e.target.value)} placeholder={preset.placeholder} className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
                                  {autoFilled[preset.key] && !isEmpty && p.value === kbVal ? (
                                    <p className="text-[9px] mt-1 font-medium" style={{ color: theme.primary }}>Pulled from your knowledge base. Save to keep it.</p>
                                  ) : (kbVal && isEmpty ? (
                                    <button type="button" onClick={() => setPresetValue(preset.key, kbVal)} className="text-[9px] mt-1 font-medium" style={{ color: theme.primary }}>Use the {preset.label.toLowerCase()} from your knowledge base</button>
                                  ) : null)}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}

                      {/* Custom texts: same card format as the presets, listed with them */}
                      {(config.smsSnippets || []).map((snip, i) => {
                        const has = !!((snip.label || '').trim() || (snip.value || '').trim());
                        return (
                          <div key={`snip-${i}`} className="mb-2 rounded-lg overflow-hidden" style={{ border: `1px solid ${has ? theme.primary : theme.inputBorder}` }}>
                            <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <MessageSquareText className="h-4 w-4 flex-shrink-0" style={{ color: has ? theme.primary : theme.textMuted4 }} />
                                <input
                                  value={snip.label}
                                  onChange={(e) => { const s = [...(config.smsSnippets || [])]; s[i] = { ...s[i], label: e.target.value }; setConfig({ ...config, smsSnippets: s }); }}
                                  placeholder={`Label (e.g. ${smsLabelExample})`}
                                  className="min-w-0 flex-1 bg-transparent text-xs font-medium focus:outline-none"
                                  style={{ color: theme.text }}
                                />
                              </div>
                              <button type="button" onClick={() => { const s = (config.smsSnippets || []).filter((_, j) => j !== i); setConfig({ ...config, smsSnippets: s }); }} className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg hover:opacity-70" style={{ color: theme.textMuted4 }} title="Remove"><X className="h-3.5 w-3.5" /></button>
                            </div>
                            <div className="px-2.5 pb-2">
                              <input
                                value={snip.value}
                                onChange={(e) => { const s = [...(config.smsSnippets || [])]; s[i] = { ...s[i], value: e.target.value }; setConfig({ ...config, smsSnippets: s }); }}
                                placeholder="Exact text or link, sent word-for-word"
                                className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                                style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      <button type="button" onClick={() => setConfig({ ...config, smsSnippets: [...(config.smsSnippets || []), { label: '', value: '' }] })} className="text-[10px] font-medium" style={{ color: theme.primary }}>+ Add a custom text</button>
                      <p className="text-[9px] mt-1" style={{ color: theme.textMuted4 }}>Custom texts cover anything the options above don&apos;t. The exact text or link is sent word-for-word.</p>

                      <button type="button" onClick={() => setSmsAdvancedOpen(o => !o)} className="flex items-center gap-1 text-[10px] font-medium mt-3" style={{ color: theme.textMuted }}>
                        <ChevronDown className={`h-3 w-3 transition-transform ${smsAdvancedOpen ? 'rotate-180' : ''}`} /> Advanced
                      </button>
                      {smsAdvancedOpen && (
                        <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                          <label className="block text-[10px] font-medium mb-1" style={{ color: theme.textMuted }}>Extra instructions (optional)</label>
                          <textarea value={config.smsInstructions} onChange={(e) => setConfig({ ...config, smsInstructions: e.target.value })} rows={2} className="w-full rounded-lg px-2.5 py-2 text-xs resize-none focus:outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} placeholder="Fine-tune when or how the AI texts, e.g. always send a confirmation after booking." />
                        </div>
                      )}

                      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
                        {smsDirty ? (
                          <button type="button" onClick={saveSms} disabled={saving}
                            className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition disabled:opacity-60"
                            style={{ backgroundColor: theme.primary, color: theme.primaryText || '#ffffff' }}>
                            {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : 'Save texting settings'}
                          </button>
                        ) : smsJustSaved ? (
                          <div className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold"
                            style={{ backgroundColor: theme.successBg || 'rgba(16,185,129,0.12)', color: theme.successText || '#10b981', border: `1px solid ${theme.successBorder || 'rgba(16,185,129,0.3)'}` }}>
                            <Check className="h-3.5 w-3.5" /> Texting settings saved
                          </div>
                        ) : (
                          <p className="text-center text-[10px]" style={{ color: theme.textMuted4 }}>All texting settings saved</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>


      </div>
    </section>
  );
}