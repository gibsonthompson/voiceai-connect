'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Loader2, Send, Bot, User, Zap, AlertCircle, Wrench, CreditCard,
  ArrowRight, Headphones, CheckCircle2, Inbox, PlayCircle, ExternalLink, Sparkles,
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
    .replace(/(https?:\/\/[^\s<>]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline">$1</a>')
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

  // Human escalation hands the conversation to the team (support_requests),
  // which lands in the admin inbox and the agency's own Inbox platform thread.
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [escalateError, setEscalateError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // "Talk to a human" is live once there's anything to send: a bot exchange,
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
        setEscalateError('Could not send. Please try again in a moment.');
      }
    } catch {
      setEscalateError('Connection error. Please try again.');
    } finally {
      setEscalating(false);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

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

  const hasChat = messages.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8" style={{ backgroundColor: theme.bg }}>
      <div className="mx-auto max-w-4xl">

        {/* Page header, same chrome as every other dashboard tab */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Support</h1>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: theme.textMuted }}>
              Instant answers about your dashboard, billing, and clients, or reach our team directly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button onClick={escalateToHuman} disabled={!canEscalate}
              className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}>
              {escalating ? <Loader2 className="h-4 w-4 animate-spin" /> : escalated ? <CheckCircle2 className="h-4 w-4" style={{ color: theme.primary }} /> : <Headphones className="h-4 w-4" style={{ color: theme.primary }} />}
              <span>{escalated ? 'Sent to team' : 'Talk to a human'}</span>
            </button>
          </div>
        </div>

        {/* Chat console: an elevated card that matches the dashboard's surface language */}
        <div
          className="flex flex-col rounded-2xl overflow-hidden h-[calc(100dvh_-_18rem)] sm:h-[calc(100dvh_-_15rem)] lg:h-[calc(100vh_-_14rem)] min-h-[460px]"
          style={{
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04), 0 10px 30px rgba(0,0,0,0.05)',
          }}
        >
          {/* Console top bar, identifies the assistant and gives it a product feel */}
          <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b flex-shrink-0" style={{ borderColor: theme.border }}>
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
              <Bot className="h-5 w-5" style={{ color: theme.primary }} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full" style={{ backgroundColor: '#22c55e', boxShadow: `0 0 0 2px ${theme.card}` }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight" style={{ color: theme.text }}>VoiceAI Assistant</p>
              <p className="text-xs leading-tight mt-0.5" style={{ color: theme.textMuted }}>Trained on your dashboard · replies instantly</p>
            </div>
          </div>

          {/* Scroll area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 py-5 sm:py-6">
              {!hasChat ? (
                <div className="mx-auto max-w-2xl">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.primary15 }}>
                      <Sparkles className="h-7 w-7" style={{ color: theme.primary }} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold tracking-tight" style={{ color: theme.text }}>How can I help?</h2>
                    <p className="mt-2 text-sm leading-relaxed mx-auto max-w-md" style={{ color: theme.textMuted }}>
                      Ask about onboarding clients, billing, branding, or troubleshooting. I answer from the VoiceAI Connect knowledge base.
                    </p>
                  </div>

                  <a href="https://youtu.be/nHNHPCgaPB4" target="_blank" rel="noopener noreferrer"
                    className="mt-7 flex items-center gap-4 rounded-2xl p-4 transition-all hover:opacity-95"
                    style={{ background: theme.isDark ? `linear-gradient(to right, ${hexToRgba(theme.primary, 0.1)}, transparent)` : `linear-gradient(to right, ${hexToRgba(theme.primary, 0.06)}, transparent)`, border: `1px solid ${theme.primary30}` }}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
                      <PlayCircle className="h-5 w-5" style={{ color: theme.primary }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: theme.text }}>Watch the full dashboard walkthrough</p>
                      <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>A complete tour of every part of your dashboard · 25 min</p>
                    </div>
                    <ExternalLink className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
                  </a>

                  <p className="mt-7 mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Popular questions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {QUICK_PROMPTS.map(qp => (
                      <button key={qp.label} onClick={() => sendMessage(qp.prompt)}
                        className="group flex items-center gap-3 rounded-xl p-3.5 text-left text-sm transition-all"
                        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = hexToRgba(theme.primary, 0.45); e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = 'none'; }}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
                          <qp.icon className="h-4 w-4" style={{ color: theme.primary }} />
                        </div>
                        <span className="flex-1 font-medium" style={{ color: theme.text }}>{qp.label}</span>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" style={{ color: theme.primary }} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(m => (
                    <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: theme.primary15 }}>
                          <Bot className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                        </div>
                      )}
                      <div className="max-w-[85%] sm:max-w-[78%]">
                        <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                          style={{
                            backgroundColor: m.role === 'user' ? theme.primary : theme.bg,
                            color: m.role === 'user' ? theme.primaryText : theme.text,
                            border: m.role === 'assistant' ? `1px solid ${theme.border}` : 'none',
                            borderBottomRightRadius: m.role === 'user' ? '6px' : undefined,
                            borderBottomLeftRadius: m.role === 'assistant' ? '6px' : undefined,
                          }}
                          dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? formatMarkdown(m.content) : m.content.replace(/\n/g, '<br/>') }}
                        />
                      </div>
                      {m.role === 'user' && (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
                          <User className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                        </div>
                      )}
                    </div>
                  ))}

                  {sending && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: theme.primary15 }}>
                        <Bot className="h-3.5 w-3.5" style={{ color: theme.primary }} />
                      </div>
                      <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderBottomLeftRadius: '6px' }}>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.textMuted, animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Human handoff appears once the bot has replied at least once.
                      Flips to a confirmation (with an Inbox link) after escalating. */}
                  {messages.length >= 2 && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 flex-shrink-0" />
                      {escalated ? (
                        <div className="rounded-2xl p-4 max-w-sm" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.05), border: `1px solid ${hexToRgba(theme.primary, 0.2)}` }}>
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: theme.primary }} />
                            <p className="text-sm font-semibold" style={{ color: theme.text }}>Sent to the team</p>
                          </div>
                          <p className="text-xs mb-3 leading-relaxed" style={{ color: theme.textMuted }}>
                            We&apos;ve got your conversation. We&apos;ll reply right in your Inbox, and you&apos;ll get a text too.
                          </p>
                          <Link href="/agency/inbox?channel=platform" className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: theme.primary }}>
                            <Inbox className="h-3.5 w-3.5" /> Go to Inbox
                          </Link>
                        </div>
                      ) : (
                        <div className="rounded-2xl p-4 max-w-sm" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                          <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>Still need a hand?</p>
                          <p className="text-xs mb-3 leading-relaxed" style={{ color: theme.textMuted }}>
                            Send this conversation to the VoiceAI Connect team, and we&apos;ll reply right in your Inbox.
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <button onClick={escalateToHuman} disabled={!canEscalate}
                              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-40 hover:opacity-90"
                              style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                              {escalating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Headphones className="h-3.5 w-3.5" />}
                              Message the team
                            </button>
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

          {/* Composer, docked at the bottom of the console */}
          <div className="flex-shrink-0 border-t px-3 sm:px-4 py-3" style={{ borderColor: theme.border }}>
            <div className="flex items-end gap-2 rounded-2xl p-1.5 pl-4 transition-all" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                rows={1}
                className="flex-1 bg-transparent py-2 text-sm resize-none focus:outline-none"
                style={{ color: theme.text, maxHeight: '140px' }}
                onFocus={e => { const box = e.currentTarget.parentElement as HTMLElement | null; if (box) { box.style.borderColor = theme.primary; box.style.boxShadow = `0 0 0 3px ${hexToRgba(theme.primary, 0.12)}`; } }}
                onBlur={e => { const box = e.currentTarget.parentElement as HTMLElement | null; if (box) { box.style.borderColor = theme.inputBorder; box.style.boxShadow = 'none'; } }}
                onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }}
              />
              <button onClick={() => sendMessage(input)} disabled={!input.trim() || sending}
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all disabled:opacity-30 flex-shrink-0"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px]" style={{ color: theme.textMuted }}>
          Press Enter to send, Shift + Enter for a new line. The assistant can occasionally be wrong, so confirm anything important.
        </p>
      </div>
    </div>
  );
}
