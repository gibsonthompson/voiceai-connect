'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Loader2, Send, Bot, User, Zap, AlertCircle, Wrench, CreditCard,
  ArrowRight, Headphones, CheckCircle2, Inbox, Play, Sparkles,
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

// label is phrased as a real question (shown on the chips/rail);
// prompt is the fuller question actually sent to the assistant.
const QUICK_PROMPTS = [
  { label: 'How do I add a new client?', prompt: 'How do I add a new client to my agency?', icon: Zap },
  { label: 'Why isn\'t my AI answering calls?', prompt: 'My client\'s AI receptionist isn\'t answering calls. How do I troubleshoot this?', icon: AlertCircle },
  { label: 'How do I set up billing?', prompt: 'How do I set up Stripe Connect so I can charge my clients?', icon: CreditCard },
  { label: 'How do I connect a custom domain?', prompt: 'How do I connect a custom domain to my agency?', icon: Wrench },
];

// The dashboard walkthrough shown in the resources rail. id drives the YouTube
// thumbnail; duration renders as the pill on the thumbnail.
const WALKTHROUGH = { id: 'nHNHPCgaPB4', url: 'https://youtu.be/nHNHPCgaPB4', duration: '25 min' };

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
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Human escalation hands the conversation to the team (support_requests),
  // which lands in the admin inbox and the agency's own Inbox platform thread.
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [escalateError, setEscalateError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const cardShadow = theme.isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04), 0 10px 30px rgba(0,0,0,0.05)';

  // "Talk to a human" is live once there's anything to send: a bot exchange,
  // or even an unsent question sitting in the box.
  const canEscalate = !!agency && !escalating && !escalated && (messages.length > 0 || input.trim().length > 0);

  // Strip markdown styling so the escalation transcript reads cleanly in the
  // admin inbox, which shows raw text where "**bold**" would leak as literal
  // asterisks and look broken.
  const stripMd = (s: string) => String(s || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|\n)\s*[-*]\s+/g, '$1')
    .replace(/(^|\n)#{1,6}\s+/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
  // Flatten the chat into a readable transcript for the owner.
  const buildTranscript = () =>
    messages.map(m => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.role === 'assistant' ? stripMd(m.content) : m.content}`).join('\n\n');

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

  // Load the full conversation history from the server so it is always here:
  // across refreshes, new devices, and sign-outs. The owner can scroll up
  // through everything they have ever asked. New turns are logged server-side
  // as they happen, so this stays complete without any manual saving.
  useEffect(() => {
    if (!agency) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        const r = await fetch(`${api}/api/agency/${agency.id}/support/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok && !cancelled) {
          const d = await r.json();
          if (Array.isArray(d.messages)) setMessages(d.messages);
        }
      } catch { /* keep whatever is already on screen */ }
      finally { if (!cancelled) setHistoryLoaded(true); }
    })();
    return () => { cancelled = true; };
    // Keyed on the agency id (stable) so a context re-render never re-fetches
    // and clobbers a live conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agency?.id, api]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending || !agency) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: content.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    // A stalled request or a backend restart can drop a single call, surfacing
    // as a network/CORS error or a 502/503/504. Those are transient, so retry
    // once after a short backoff before showing an error. Real errors (4xx, 500)
    // are not retried.
    const RETRYABLE = new Set([408, 502, 503, 504]);
    const callChat = () => {
      const token = localStorage.getItem('auth_token') || '';
      return fetch(`${api}/api/agency/${agency.id}/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          // Display keeps the full history, but only the recent window is sent
          // as context so a long history never bloats the prompt.
          messages: newMessages.slice(-20).map(m => ({ role: m.role, content: m.content })),
          agencyName: agency.name,
          agencyPlan: effectivePlan,
        }),
      });
    };

    try {
      let r: Response | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          r = await callChat();
          if (r.ok || !RETRYABLE.has(r.status)) break;
        } catch (err) {
          r = null;
          if (attempt === 1) throw err;
        }
        if (attempt === 0) await new Promise(res => setTimeout(res, 1200));
      }

      if (r && r.ok) {
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

  const QuestionRow = ({ qp }: { qp: typeof QUICK_PROMPTS[number] }) => (
    <button onClick={() => sendMessage(qp.prompt)}
      className="group flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm transition-all"
      style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = hexToRgba(theme.primary, 0.45); }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; }}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
        <qp.icon className="h-4 w-4" style={{ color: theme.iconColor }} />
      </div>
      <span className="flex-1 font-medium leading-snug" style={{ color: theme.text }}>{qp.label}</span>
      <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" style={{ color: theme.iconColor }} />
    </button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8" style={{ backgroundColor: theme.bg }}>
      <div className="mx-auto max-w-6xl">

        {/* Page header, same chrome as every other dashboard tab */}
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Support</h1>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: theme.textMuted }}>
            Get instant answers about your dashboard, billing, clients, and troubleshooting, or send your chat to our team.
          </p>
        </div>

        {/* Support console: big chat on the left, a persistent resources rail on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 items-stretch">

          {/* Chat */}
          <section
            className="lg:col-span-2 flex flex-col rounded-2xl overflow-hidden h-[62vh] min-h-[460px] lg:h-[calc(100vh_-_13rem)] lg:min-h-[600px]"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: cardShadow }}
          >
            {/* Console top bar */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b flex-shrink-0" style={{ borderColor: theme.border }}>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
                <Bot className="h-5 w-5" style={{ color: theme.iconColor }} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full" style={{ backgroundColor: '#22c55e', boxShadow: `0 0 0 2px ${theme.card}` }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight" style={{ color: theme.text }}>Support Assistant</p>
                <p className="text-xs leading-tight mt-0.5" style={{ color: theme.textMuted }}>Trained on your dashboard · replies instantly</p>
              </div>
            </div>

            {/* Scroll area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="px-4 sm:px-8 py-6 sm:py-10">
                {!historyLoaded && !hasChat ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted }} />
                  </div>
                ) : !hasChat ? (
                  <div className="mx-auto max-w-xl text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.primary15 }}>
                      <Sparkles className="h-8 w-8" style={{ color: theme.iconColor }} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>How can I help?</h2>
                    <p className="mt-2.5 text-sm sm:text-[15px] leading-relaxed mx-auto max-w-md" style={{ color: theme.textMuted }}>
                      Ask me anything about running your agency. Every answer comes straight from the VoiceAI Connect knowledge base.
                    </p>

                    {/* Mobile-only quick questions (the rail carries them on desktop) */}
                    <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left lg:hidden">
                      {QUICK_PROMPTS.map(qp => <QuestionRow key={qp.label} qp={qp} />)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messages.map(m => (
                      <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {m.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: theme.primary15 }}>
                            <Bot className="h-3.5 w-3.5" style={{ color: theme.iconColor }} />
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
                          <Bot className="h-3.5 w-3.5" style={{ color: theme.iconColor }} />
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

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Composer, docked at the bottom of the console */}
            <div className="flex-shrink-0 border-t px-3 sm:px-4 py-3" style={{ borderColor: theme.border }}>
              <div className="flex items-end gap-2 rounded-2xl p-1.5 pl-4 transition-all mx-auto max-w-3xl" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
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
              <p className="mt-2 text-center text-[11px]" style={{ color: theme.textMuted }}>
                Press Enter to send, Shift + Enter for a new line. The assistant can occasionally be wrong, so confirm anything important.
              </p>
            </div>
          </section>

          {/* Resources rail */}
          <aside className="lg:col-span-1 flex flex-col gap-4 lg:gap-5">

            {/* Walkthrough video — real thumbnail, play affordance, duration */}
            <a href={WALKTHROUGH.url} target="_blank" rel="noopener noreferrer"
              className="group block overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: cardShadow }}>
              <div className="relative aspect-video w-full overflow-hidden" style={{ backgroundColor: '#000' }}>
                <img
                  src={`https://i.ytimg.com/vi/${WALKTHROUGH.id}/maxresdefault.jpg`}
                  onError={(e) => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb = '1'; t.src = `https://i.ytimg.com/vi/${WALKTHROUGH.id}/hqdefault.jpg`; } }}
                  alt="Dashboard walkthrough preview"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0) 55%)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
                    <Play className="h-6 w-6 translate-x-[1px]" style={{ color: '#0f0f0f', fill: '#0f0f0f' }} />
                  </div>
                </div>
                <span className="absolute bottom-2.5 right-2.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums" style={{ backgroundColor: 'rgba(0,0,0,0.82)', color: '#ffffff' }}>
                  {WALKTHROUGH.duration}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold" style={{ color: theme.text }}>Full Dashboard Walkthrough</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.textMuted }}>
                  A complete tour of your dashboard, tab by tab.
                </p>
              </div>
            </a>

            {/* Common questions (desktop; mobile shows them in the empty state) */}
            <div className="hidden lg:block rounded-2xl p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: cardShadow }}>
              <p className="mb-3 text-[13px] font-semibold" style={{ color: theme.text }}>Common questions</p>
              <div className="space-y-2">
                {QUICK_PROMPTS.map(qp => <QuestionRow key={qp.label} qp={qp} />)}
              </div>
            </div>

            {/* Talk to a human */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: cardShadow }}>
              {escalated ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: theme.iconColor }} />
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>Sent to the team</p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed" style={{ color: theme.textMuted }}>
                    We&apos;ve got your conversation. We&apos;ll reply right in your Inbox, and you&apos;ll get a text too.
                  </p>
                  <Link href="/agency/inbox?channel=platform"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: theme.primary }}>
                    <Inbox className="h-3.5 w-3.5" /> Go to Inbox
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4 flex-shrink-0" style={{ color: theme.iconColor }} />
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>Talk to a human</p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed" style={{ color: theme.textMuted }}>
                    Still stuck? Send this conversation to the VoiceAI Connect team and we&apos;ll reply right in your Inbox.
                  </p>
                  <button onClick={escalateToHuman} disabled={!canEscalate}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 hover:opacity-90"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                    {escalating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Headphones className="h-4 w-4" />}
                    Message the team
                  </button>
                  {!canEscalate && !escalating && (
                    <p className="mt-2 text-[11px] text-center" style={{ color: theme.textMuted }}>Ask a question first, or type one above.</p>
                  )}
                  {escalateError && <p className="mt-2 text-xs text-center" style={{ color: '#dc2626' }}>{escalateError}</p>}
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
