'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Loader2, Send, Bot, User, Phone, MessageCircle,
  HelpCircle, Zap, AlertCircle, Wrench, CreditCard, ArrowRight,
  Headphones, CheckCircle2, Inbox
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  { label: 'Add a client', prompt: 'How do I add a new client to my agency?', icon: Zap },
  { label: 'AI not answering', prompt: 'My client\'s AI receptionist isn\'t answering calls. How do I troubleshoot this?', icon: AlertCircle },
  { label: 'Set up billing', prompt: 'How do I set up Stripe Connect so I can charge my clients?', icon: CreditCard },
  { label: 'Custom domain', prompt: 'How do I connect a custom domain to my agency?', icon: Wrench },
];

const SUPPORT_PHONE = '(678) 316-1454';
const PHONE_REVEAL_THRESHOLD = 2;

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(128,128,128,0.15);padding:1px 5px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/\n/g, '<br/>');
}

export default function SupportPage() {
  const { agency, effectivePlan } = useAgency();
  const theme = useTheme();
  const api = process.env.NEXT_PUBLIC_API_URL || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);

  // Human escalation — hands the conversation to the team (support_requests),
  // which lands in the admin inbox and the agency's own Inbox platform thread.
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [escalateError, setEscalateError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const showPhone = userMessageCount >= PHONE_REVEAL_THRESHOLD;
  // "Talk to a human" is live once there's anything to send — a bot exchange,
  // or even an unsent question sitting in the box.
  const canEscalate = !!agency && !escalating && !escalated && (messages.length > 0 || input.trim().length > 0);

  // Flatten the chat into a readable transcript for the owner.
  const buildTranscript = () =>
    messages.map(m => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`).join('\n\n');

  const escalateToHuman = async () => {
    if (!agency || escalating || escalated) return;
    const transcript = buildTranscript();
    const note = input.trim();
    if (!transcript && !note) { inputRef.current?.focus(); return; }
    setEscalating(true);
    setEscalateError('');
    try {
      const token = localStorage.getItem('auth_token') || '';
      const r = await fetch(`${api}/api/agency/${agency.id}/support/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: note, transcript }),
      });
      if (r.ok) {
        setEscalated(true);
        if (note) setInput('');
      } else {
        setEscalateError('Could not send. Please try again, or call us.');
      }
    } catch {
      setEscalateError('Connection error. Please try again, or call us.');
    } finally {
      setEscalating(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Prefill from the dashboard command bar handoff: /agency/support?q=...
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) { setInput(q); inputRef.current?.focus(); }
    } catch { /* ignore */ }
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending || !agency) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: content.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserMessageCount(prev => prev + 1);
    setInput('');
    setSending(true);

    try {
      const token = localStorage.getItem('auth_token') || '';
      const r = await fetch(`${api}/api/agency/${agency.id}/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          agencyName: agency.name,
          agencyPlan: effectivePlan,
        }),
      });

      if (r.ok) {
        const d = await r.json();
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: d.reply, timestamp: Date.now() }]);
      } else {
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: 'Sorry, I\'m having trouble connecting. Please try again in a moment.', timestamp: Date.now() }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: 'Connection error. Please check your internet and try again.', timestamp: Date.now() }]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b" style={{ borderColor: theme.border }}>
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: theme.primary15 }}>
              <MessageCircle className="h-5 w-5" style={{ color: theme.primary }} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold" style={{ color: theme.text }}>Support</h1>
              <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>AI-powered help for your agency</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Phone — fades in after threshold (secondary) */}
            <a href={`tel:${SUPPORT_PHONE.replace(/\D/g, '')}`}
              className={`hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80 ${showPhone ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06), color: theme.primary, border: `1px solid ${hexToRgba(theme.primary, 0.2)}` }}>
              <Phone className="h-3.5 w-3.5" />
              {SUPPORT_PHONE}
            </a>

            {/* Talk to a human — always available, routes into the Inbox */}
            <button onClick={escalateToHuman} disabled={!canEscalate}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-40 hover:opacity-80"
              style={{ backgroundColor: 'transparent', color: theme.primary, border: `1px solid ${hexToRgba(theme.primary, 0.3)}` }}>
              {escalating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : escalated ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
              <span>{escalated ? 'Sent' : 'Talk to a human'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: theme.primary15 }}>
                <Bot className="h-8 w-8" style={{ color: theme.primary }} />
              </div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>How can I help?</h2>
              <p className="text-sm mb-8 text-center max-w-sm" style={{ color: theme.textMuted }}>
                Ask me anything about VoiceAI Connect — setup, troubleshooting, features, billing, or best practices.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {QUICK_PROMPTS.map(qp => (
                  <button key={qp.label} onClick={() => sendMessage(qp.prompt)}
                    className="flex items-center gap-3 rounded-xl p-3 text-left text-sm transition-all group"
                    style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = theme.primary + '60')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = theme.border)}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f5f5f5' }}>
                      <qp.icon className="h-4 w-4" style={{ color: theme.textMuted }} />
                    </div>
                    <span style={{ color: theme.text }}>{qp.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.primary }} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(m => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ backgroundColor: theme.primary15 }}>
                      <Bot className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                    </div>
                  )}
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={{
                        backgroundColor: m.role === 'user' ? theme.primary : theme.card,
                        color: m.role === 'user' ? theme.primaryText : theme.text,
                        border: m.role === 'assistant' ? `1px solid ${theme.border}` : 'none',
                        borderBottomRightRadius: m.role === 'user' ? '4px' : undefined,
                        borderBottomLeftRadius: m.role === 'assistant' ? '4px' : undefined,
                      }}
                      dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? formatMarkdown(m.content) : m.content.replace(/\n/g, '<br/>') }}
                    />
                  </div>
                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
                      <User className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                    </div>
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ backgroundColor: theme.primary15 }}>
                    <Bot className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                  </div>
                  <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderBottomLeftRadius: '4px' }}>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Human handoff — appears once the bot has replied at least once.
                  Flips to a confirmation (with an Inbox link) after escalating. */}
              {messages.length >= 2 && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 flex-shrink-0" />
                  {escalated ? (
                    <div className="rounded-xl p-4 max-w-sm"
                      style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.05), border: `1px solid ${hexToRgba(theme.primary, 0.2)}` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />
                        <p className="text-sm font-semibold" style={{ color: theme.text }}>Sent to the team</p>
                      </div>
                      <p className="text-xs mb-3 leading-relaxed" style={{ color: theme.textMuted }}>
                        We've got your conversation. We'll reply right in your Inbox — you'll see it there and get a text.
                      </p>
                      <Link href="/agency/inbox?channel=platform"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: theme.primary }}>
                        <Inbox className="h-3.5 w-3.5" /> Go to Inbox
                      </Link>
                    </div>
                  ) : (
                    <div className="rounded-xl p-4 max-w-sm"
                      style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                      <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>Still need a hand?</p>
                      <p className="text-xs mb-3 leading-relaxed" style={{ color: theme.textMuted }}>
                        Send this conversation to the VoiceAI Connect team — we'll reply right in your Inbox.
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <button onClick={escalateToHuman} disabled={!canEscalate}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-40 hover:opacity-90"
                          style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                          {escalating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Headphones className="h-3.5 w-3.5" />}
                          Message the team
                        </button>
                        <a href={`tel:${SUPPORT_PHONE.replace(/\D/g, '')}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline" style={{ color: theme.textMuted }}>
                          <Phone className="h-3.5 w-3.5" /> or call {SUPPORT_PHONE}
                        </a>
                      </div>
                      {escalateError && <p className="text-xs mt-2" style={{ color: '#dc2626' }}>{escalateError}</p>}
                    </div>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t px-4 sm:px-6 py-3" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows={1}
            className="flex-1 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition"
            style={{
              backgroundColor: theme.input,
              border: `1px solid ${theme.inputBorder}`,
              color: theme.text,
              maxHeight: '120px',
            }}
            onFocus={e => { e.currentTarget.style.border = `1px solid ${theme.primary}`; e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.primary}30`; }}
            onBlur={e => { e.currentTarget.style.border = `1px solid ${theme.inputBorder}`; e.currentTarget.style.boxShadow = 'none'; }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || sending}
            className="flex items-center justify-center w-11 h-11 rounded-xl transition-all disabled:opacity-30 flex-shrink-0 self-end"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}