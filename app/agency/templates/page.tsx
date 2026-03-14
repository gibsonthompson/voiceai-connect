'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Loader2, Send, Trash2, ChevronDown, ChevronRight, Check, Copy,
  Sparkles, Bot, User, AlertCircle, Clock, Zap, Terminal, Code2,
  Volume2, Play, Wrench, Stethoscope, Scale, Home, Calculator,
  Briefcase, UtensilsCrossed, Dumbbell, ShoppingBag, Car, Building2,
  BookOpen, ExternalLink, Info, RotateCcw, Cpu, FlaskConical, Settings2,
  MessageSquare, ChevronUp, Hash, Timer, Gauge, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';
import LockedFeature from '@/components/LockedFeature';

// ============================================================================
// TYPES
// ============================================================================
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: ResponseMetadata;
  error?: string;
}

interface ResponseMetadata {
  api_latency_ms: number;
  total_latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
  system_prompt_chars: number;
  temperature: number;
  finish_reason: string;
  message_count: number;
}

interface Industry {
  frontendKey: string;
  backendKey: string;
  label: string;
  description: string;
  icon: string;
  hasCustomTemplate: boolean;
  isActive: boolean;
  updatedAt: string | null;
}

interface Voice {
  id: string;
  name: string;
  description: string;
  gender: string;
  recommended?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const ICON_MAP: Record<string, React.ElementType> = {
  Wrench, Stethoscope, Scale, Home, Calculator, Briefcase,
  UtensilsCrossed, Sparkles, Dumbbell, ShoppingBag, Car, Building2,
};

const INDUSTRY_OPTIONS = [
  { key: 'general', label: 'General Business' },
  { key: 'home_services', label: 'Home Services' },
  { key: 'medical', label: 'Medical / Dental' },
  { key: 'legal', label: 'Legal Services' },
  { key: 'real_estate', label: 'Real Estate' },
  { key: 'financial', label: 'Financial Services' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'salon_spa', label: 'Salon / Spa' },
  { key: 'automotive', label: 'Automotive' },
  { key: 'fitness', label: 'Fitness / Gym' },
  { key: 'retail', label: 'Retail / E-commerce' },
  { key: 'other', label: 'Other' },
];

const QUICK_SCENARIOS = [
  { label: 'Emergency', text: "Hi, I have an emergency — my pipes are bursting and water is everywhere!" },
  { label: 'Appointment', text: "I'd like to schedule an appointment for next week if possible." },
  { label: 'Pricing', text: "How much do you charge for a basic service call?" },
  { label: 'Hours', text: "What are your business hours?" },
  { label: 'Follow-up', text: "I'm calling about service you did at my house last month." },
  { label: 'New Client', text: "Hi, I've never used your services before. Can you tell me what you offer?" },
];

const TEST_PLACEHOLDERS: Record<string, string> = {
  '{businessName}': 'Acme Plumbing Services',
  '{ownerPhone}': '(555) 123-4567',
  '{ownerName}': 'John Smith',
  '{callerPhone}': '(555) 987-6543',
  '{city}': 'Atlanta',
  '{state}': 'GA',
};

const DEFAULT_SYSTEM_PROMPT = `You are a professional AI receptionist for {businessName}, located in {city}, {state}. You answer phone calls on behalf of the business.

Your responsibilities:
- Greet callers warmly and professionally
- Answer questions about the business, services, and availability
- Schedule appointments when requested
- Take detailed messages including caller name, phone number, and reason for calling
- Handle emergency/urgent requests by flagging them appropriately

Guidelines:
- Be friendly, patient, and professional at all times
- Keep responses concise (this is a phone call, not a text chat)
- If you don't know something specific, offer to take a message and have someone call back
- Always confirm the caller's contact information
- For emergencies, reassure the caller and prioritize getting their information

The business owner is {ownerName} and can be reached at {ownerPhone} for urgent matters.`;

const DEFAULT_FIRST_MESSAGE = "Hi, you've reached {businessName}! How can I help you today?";

function fillPlaceholders(text: string): string {
  let result = text;
  for (const [key, value] of Object.entries(TEST_PLACEHOLDERS)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ============================================================================
// TAB BUTTON
// ============================================================================
function TabButton({ active, onClick, icon: Icon, label, theme }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string; theme: any;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all"
      style={{
        backgroundColor: active ? theme.primary15 : 'transparent',
        color: active ? theme.primary : theme.textMuted,
        border: active ? `1px solid ${theme.primary}30` : '1px solid transparent',
      }}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ============================================================================
// DEBUG PANEL
// ============================================================================
function DebugPanel({ entries, systemPromptChars, theme }: {
  entries: ChatMessage[]; systemPromptChars: number; theme: any;
}) {
  const aiMessages = entries.filter(m => m.role === 'assistant' || m.error);
  const totalTokens = aiMessages.reduce((sum, m) => sum + (m.metadata?.total_tokens || 0), 0);
  const avgLatency = aiMessages.length > 0
    ? Math.round(aiMessages.reduce((sum, m) => sum + (m.metadata?.api_latency_ms || 0), 0) / aiMessages.length)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: theme.border }}>
        <Terminal className="h-4 w-4" style={{ color: theme.primary }} />
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: theme.textMuted }}>Debug Console</span>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-px border-b" style={{ borderColor: theme.border, backgroundColor: theme.border }}>
        {[
          { icon: Hash, label: 'Tokens', value: totalTokens.toLocaleString() },
          { icon: Timer, label: 'Avg Latency', value: avgLatency ? `${avgLatency}ms` : '—' },
          { icon: MessageSquare, label: 'Exchanges', value: aiMessages.length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: theme.card }}>
            <stat.icon className="h-3 w-3" style={{ color: theme.textMuted }} />
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>{stat.label}</p>
              <p className="text-xs font-semibold font-mono" style={{ color: theme.text }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Code2 className="h-8 w-8 mb-3" style={{ color: theme.textMuted, opacity: 0.3 }} />
            <p className="text-xs" style={{ color: theme.textMuted }}>Send a message to see debug output</p>
          </div>
        )}

        {aiMessages.map((msg, i) => (
          <div
            key={msg.id}
            className="rounded-lg p-3 text-xs font-mono"
            style={{
              backgroundColor: msg.error 
                ? (theme.isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2')
                : (theme.isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb'),
              border: `1px solid ${msg.error 
                ? (theme.isDark ? 'rgba(239,68,68,0.2)' : '#fecaca')
                : theme.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ 
                color: msg.error ? '#ef4444' : theme.primary 
              }}>
                {msg.error ? 'Error' : `Response #${i + 1}`}
              </span>
              <span className="text-[10px]" style={{ color: theme.textMuted }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {msg.error && (
              <p className="text-xs mb-2" style={{ color: '#f87171' }}>{msg.error}</p>
            )}

            {msg.metadata && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span style={{ color: theme.textMuted }}>Latency</span>
                  <span style={{ color: msg.metadata.api_latency_ms < 500 ? '#22c55e' : msg.metadata.api_latency_ms < 1500 ? '#f59e0b' : '#ef4444' }}>
                    {msg.metadata.api_latency_ms}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.textMuted }}>Tokens</span>
                  <span style={{ color: theme.text }}>
                    {msg.metadata.prompt_tokens}p + {msg.metadata.completion_tokens}c = {msg.metadata.total_tokens}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.textMuted }}>Model</span>
                  <span style={{ color: theme.text }}>{msg.metadata.model}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.textMuted }}>Temperature</span>
                  <span style={{ color: theme.text }}>{msg.metadata.temperature}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.textMuted }}>Finish</span>
                  <span style={{ color: msg.metadata.finish_reason === 'stop' ? '#22c55e' : '#f59e0b' }}>
                    {msg.metadata.finish_reason}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.textMuted }}>Prompt size</span>
                  <span style={{ color: theme.text }}>{msg.metadata.system_prompt_chars.toLocaleString()} chars</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// PLAYGROUND TAB
// ============================================================================
function PlaygroundTab({ agency, theme }: { agency: any; theme: any }) {
  const [industry, setIndustry] = useState('general');
  const [systemPrompt, setSystemPrompt] = useState(fillPlaceholders(DEFAULT_SYSTEM_PROMPT));
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState('gpt-4o-mini');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingPrompt, setFetchingPrompt] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch prompt when industry changes
  const fetchIndustryPrompt = useCallback(async (ind: string) => {
    if (!agency) return;
    setFetchingPrompt(true);
    try {
      const token = localStorage.getItem('auth_token');
      // Try templates endpoint (works for enterprise with custom templates)
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-templates/${ind}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const prompt = data.template?.system_prompt || data.defaults?.system_prompt;
        if (prompt) {
          setSystemPrompt(fillPlaceholders(prompt));
          if (data.template?.temperature) setTemperature(data.template.temperature);
          setFetchingPrompt(false);
          return;
        }
      }
    } catch (e) {
      // Fall through to default
    }
    // Fallback to default prompt
    setSystemPrompt(fillPlaceholders(DEFAULT_SYSTEM_PROMPT));
    setFetchingPrompt(false);
  }, [agency, backendUrl]);

  useEffect(() => {
    fetchIndustryPrompt(industry);
  }, [industry, fetchIndustryPrompt]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-playground/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          systemPrompt,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          temperature,
          model,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          error: data.message || data.error || 'Request failed',
          metadata: data.metadata,
        };
        setMessages(prev => [...prev, errorMsg]);
      } else {
        const aiMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
          metadata: data.metadata,
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        error: err instanceof Error ? err.message : 'Network error',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* Industry */}
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
        >
          {INDUSTRY_OPTIONS.map(opt => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>

        {/* Model */}
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
        >
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
          <option value="gpt-4.1">GPT-4.1</option>
        </select>

        {/* Temperature */}
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4" style={{ color: theme.textMuted }} />
          <input
            type="range" min="0" max="1" step="0.1" value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-20" style={{ accentColor: theme.primary }}
          />
          <span className="text-xs font-mono w-6" style={{ color: theme.textMuted }}>{temperature}</span>
        </div>

        {/* Clear */}
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
          style={{ color: theme.textMuted, backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}
        >
          <RotateCcw className="h-3 w-3" />
          Clear
        </button>

        {fetchingPrompt && (
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.primary }} />
        )}
      </div>

      {/* System Prompt (collapsible) */}
      <div className="mb-3 rounded-lg" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
        <button
          onClick={() => setPromptExpanded(!promptExpanded)}
          className="flex items-center justify-between w-full px-4 py-2.5 text-sm"
          style={{ color: theme.text }}
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" style={{ color: theme.primary }} />
            <span className="font-medium">System Prompt</span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
              {systemPrompt.length.toLocaleString()} chars
            </span>
          </div>
          {promptExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {promptExpanded && (
          <div className="px-4 pb-4">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={10}
              className="w-full rounded-lg px-3 py-2 text-xs font-mono resize-y"
              style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text, minHeight: '120px' }}
            />
          </div>
        )}
      </div>

      {/* Main Split: Chat + Debug */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col rounded-lg overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: theme.primary15 }}>
                  <FlaskConical className="h-7 w-7" style={{ color: theme.primary }} />
                </div>
                <p className="font-medium mb-1" style={{ color: theme.text }}>AI Playground</p>
                <p className="text-sm mb-6 max-w-xs" style={{ color: theme.textMuted }}>
                  Test how your AI receptionist handles calls. You play the caller.
                </p>
                {/* Quick Scenarios */}
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  {QUICK_SCENARIOS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleSend(s.text)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:scale-105"
                      style={{ backgroundColor: theme.hover, color: theme.text, border: `1px solid ${theme.border}` }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5" style={{ backgroundColor: theme.primary15 }}>
                    <Bot className="h-4 w-4" style={{ color: theme.primary }} />
                  </div>
                )}
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                  style={msg.role === 'user' ? {
                    backgroundColor: theme.primary,
                    color: theme.primaryText,
                    borderBottomRightRadius: '6px',
                  } : msg.error ? {
                    backgroundColor: theme.isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                    color: '#f87171',
                    border: `1px solid ${theme.isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`,
                    borderBottomLeftRadius: '6px',
                  } : {
                    backgroundColor: theme.hover,
                    color: theme.text,
                    borderBottomLeftRadius: '6px',
                  }}
                >
                  {msg.error ? (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{msg.error}</span>
                    </div>
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                  )}
                  {msg.metadata && (
                    <div className="mt-1.5 pt-1.5 flex items-center gap-3 text-[10px] font-mono" style={{ borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, color: theme.textMuted }}>
                      <span>{msg.metadata.api_latency_ms}ms</span>
                      <span>{msg.metadata.total_tokens} tok</span>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
                    <User className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primary15 }}>
                  <Bot className="h-4 w-4" style={{ color: theme.primary }} />
                </div>
                <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: theme.hover, borderBottomLeftRadius: '6px' }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: theme.border }}>
            {/* Scenario chips (show when chat has messages) */}
            {messages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {QUICK_SCENARIOS.slice(0, 4).map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.text)}
                    disabled={loading}
                    className="rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: theme.hover, color: theme.textMuted, border: `1px solid ${theme.border}` }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type as the caller..."
                disabled={loading}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm transition-colors"
                style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all disabled:opacity-40"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Debug Panel (hidden on small screens, shown as collapsible) */}
        <div className="hidden lg:flex w-80 flex-shrink-0 rounded-lg overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
          <DebugPanel entries={messages} systemPromptChars={systemPrompt.length} theme={theme} />
        </div>
      </div>

      {/* Mobile Debug Toggle */}
      <details className="lg:hidden mt-3 rounded-lg overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-medium" style={{ color: theme.text }}>
          <Terminal className="h-4 w-4" style={{ color: theme.primary }} />
          Debug Console
          {messages.filter(m => m.role === 'assistant').length > 0 && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
              {messages.filter(m => m.role === 'assistant').length}
            </span>
          )}
        </summary>
        <div style={{ height: '300px' }}>
          <DebugPanel entries={messages} systemPromptChars={systemPrompt.length} theme={theme} />
        </div>
      </details>
    </div>
  );
}

// ============================================================================
// TEMPLATES TAB
// ============================================================================
function TemplatesTab({ agency, theme, effectivePlan }: { agency: any; theme: any; effectivePlan: string }) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (!agency) return;
    const isEnterprise = effectivePlan === 'enterprise';
    setHasAccess(isEnterprise);
    if (isEnterprise) fetchIndustries();
    else setLoading(false);
  }, [agency, effectivePlan]);

  const fetchIndustries = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-templates/industries`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIndustries(data.industries || []);
      }
    } catch (e) {
      console.error('Failed to fetch industries:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <LockedFeature
        title="Custom AI Templates"
        description="Override default AI receptionist prompts, voices, and behavior for each industry your clients serve."
        requiredPlan="Enterprise"
        features={[
          'Custom prompts for 11 industries',
          'Voice selection per industry',
          'Fine-tune temperature & behavior',
          'New clients auto-use your templates',
        ]}
      >
        <div />
      </LockedFeature>
    );
  }

  return (
    <div>
      {/* Info Banner */}
      <div 
        className="mb-6 rounded-xl p-4 flex items-start gap-3"
        style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}
      >
        <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.info }} />
        <p className="text-sm" style={{ color: theme.infoText }}>
          Templates set the default AI configuration for <strong style={{ color: theme.text }}>new client signups</strong>. 
          To edit a live client&apos;s AI, go to{' '}
          <Link href="/agency/clients" className="font-medium underline underline-offset-2" style={{ color: theme.primary }}>Clients</Link> 
          {' '}and open their profile.
        </p>
      </div>

      {/* Industry Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((ind) => {
          const IconComponent = ICON_MAP[ind.icon] || Building2;
          return (
            <Link
              key={ind.frontendKey}
              href={`/agency/templates/${ind.frontendKey}`}
              className="group rounded-xl p-5 transition-all"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.card)}
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: ind.hasCustomTemplate ? theme.primary15 : theme.hover }}
                >
                  <IconComponent className="h-6 w-6" style={{ color: ind.hasCustomTemplate ? theme.primary : theme.textMuted }} />
                </div>
                <span 
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                  style={ind.hasCustomTemplate 
                    ? { backgroundColor: theme.primary15, color: theme.primary }
                    : { backgroundColor: theme.hover, color: theme.textMuted }}
                >
                  {ind.hasCustomTemplate && <Check className="h-3 w-3" />}
                  {ind.hasCustomTemplate ? 'Custom' : 'Default'}
                </span>
              </div>
              <h3 className="font-medium mb-1" style={{ color: theme.text }}>{ind.label}</h3>
              <p className="text-sm mb-4" style={{ color: theme.textMuted }}>{ind.description}</p>
              <ChevronRight className="h-5 w-5 ml-auto transition-transform group-hover:translate-x-1" style={{ color: theme.textMuted }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// VOICES TAB
// ============================================================================
function VoicesTab({ agency, theme }: { agency: any; theme: any }) {
  const [voices, setVoices] = useState<{ female: Voice[]; male: Voice[] }>({ female: [], male: [] });
  const [loading, setLoading] = useState(true);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/voices`);
      if (response.ok) {
        const data = await response.json();
        setVoices(data.grouped || { female: [], male: [] });
      }
    } catch (e) {
      console.error('Failed to fetch voices:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const renderVoiceGrid = (voiceList: Voice[], label: string) => (
    <div className="mb-8">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>{label}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {voiceList.map((voice) => (
          <div
            key={voice.id}
            className="rounded-xl p-4 transition-all"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: theme.primary15 }}>
                  <Volume2 className="h-5 w-5" style={{ color: theme.primary }} />
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: theme.text }}>{voice.name}</p>
                  <p className="text-xs capitalize" style={{ color: theme.textMuted }}>{voice.gender}</p>
                </div>
              </div>
              {voice.recommended && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs mt-2" style={{ color: theme.textMuted }}>{voice.description}</p>
            <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: theme.border }}>
              <code className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
                {voice.id.substring(0, 16)}...
              </code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6 rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
        <Volume2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.info }} />
        <p className="text-sm" style={{ color: theme.infoText }}>
          Voices are powered by <strong style={{ color: theme.text }}>ElevenLabs</strong>. 
          To change the default voice for an industry, go to{' '}
          <Link href="/agency/templates" className="font-medium underline underline-offset-2" style={{ color: theme.primary }}>Templates</Link>
          {' '}and edit the industry configuration.
        </p>
      </div>

      {voices.female.length > 0 && renderVoiceGrid(voices.female, `Female Voices (${voices.female.length})`)}
      {voices.male.length > 0 && renderVoiceGrid(voices.male, `Male Voices (${voices.male.length})`)}
      {voices.female.length === 0 && voices.male.length === 0 && (
        <div className="text-center py-12">
          <Volume2 className="h-8 w-8 mx-auto mb-3" style={{ color: theme.textMuted, opacity: 0.3 }} />
          <p className="text-sm" style={{ color: theme.textMuted }}>No voices loaded. Check your backend connection.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function AILabPage() {
  const { agency, loading: contextLoading, effectivePlan } = useAgency();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'playground' | 'templates' | 'voices'>('playground');

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15 }}>
            <FlaskConical className="h-5 w-5" style={{ color: theme.primary }} />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>
            AI Lab
          </h1>
        </div>
        <p className="text-sm mt-1 ml-12" style={{ color: theme.textMuted }}>
          Test, configure, and ship your AI receptionists
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
        <TabButton active={activeTab === 'playground'} onClick={() => setActiveTab('playground')} icon={FlaskConical} label="Playground" theme={theme} />
        <TabButton active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} icon={Cpu} label="Templates" theme={theme} />
        <TabButton active={activeTab === 'voices'} onClick={() => setActiveTab('voices')} icon={Volume2} label="Voices" theme={theme} />
      </div>

      {/* Tab Content */}
      {activeTab === 'playground' && agency && <PlaygroundTab agency={agency} theme={theme} />}
      {activeTab === 'templates' && agency && <TemplatesTab agency={agency} theme={theme} effectivePlan={effectivePlan} />}
      {activeTab === 'voices' && agency && <VoicesTab agency={agency} theme={theme} />}
    </div>
  );
}