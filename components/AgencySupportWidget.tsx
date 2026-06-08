'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircleQuestion, X, Search, ChevronLeft, ChevronRight,
  Send, Loader2, Bot, User, Sparkles, MessageSquare,
  HelpCircle, Check,
} from 'lucide-react';

interface FAQ { question: string; answer: string; }

const PROSPECT_FAQS: FAQ[] = [
  {
    question: 'How does the AI receptionist work?',
    answer: 'When someone calls your business number, the AI answers immediately — no rings, no hold music. It greets the caller, answers questions about your services using information you provide, books appointments to your calendar, takes messages, and sends you a text summary after every call.',
  },
  {
    question: 'Will callers know they are talking to an AI?',
    answer: 'Most callers do not notice. The AI uses natural speech patterns and sounds conversational, not robotic. Business owners regularly tell us customers compliment their "new receptionist." If a caller asks directly, the AI will be honest.',
  },
  {
    question: 'Can it book appointments to my calendar?',
    answer: 'Yes. The AI connects to your Google Calendar, checks your real-time availability, offers open slots to the caller, and creates the appointment automatically with the caller\'s name, phone number, and reason. No double-booking, no back-and-forth.',
  },
  {
    question: 'What happens after each call?',
    answer: 'You get an instant text message with a summary — who called, what they needed, and any action items. You also get full call recordings, word-for-word transcripts, and an AI-generated analysis in your dashboard.',
  },
  {
    question: 'Can the AI transfer calls to me?',
    answer: 'Yes. You set the rules — for example, transfer if the caller says it\'s urgent, mentions a specific keyword, or asks for you by name. If you do not pick up, the AI stays on the line and takes a message instead of sending the caller to voicemail.',
  },
  {
    question: 'Does it work after hours and on weekends?',
    answer: 'Yes, 24/7/365. The AI never sleeps, takes breaks, or calls in sick. Over a third of calls businesses receive come outside normal hours — this means you never miss an opportunity.',
  },
  {
    question: 'Does it speak Spanish?',
    answer: 'Yes. The AI automatically detects when a caller speaks Spanish and switches to Spanish for the entire conversation. No setup needed. Call summaries are still sent to you in English.',
  },
  {
    question: 'How long does setup take?',
    answer: 'About 10 minutes. You provide your business name, industry, services, hours, and common questions. The AI builds your custom receptionist and provisions a dedicated phone number. No technical skills or website required.',
  },
  {
    question: 'Can I use my existing business phone number?',
    answer: 'Yes. You get a dedicated AI phone number, then forward your existing business line to it. Callers dial your normal number and the AI answers. You can also publish the AI number directly if you prefer.',
  },
  {
    question: 'How many calls can it handle at once?',
    answer: 'Unlimited. Unlike a human receptionist who handles one call at a time, the AI takes as many simultaneous calls as needed. No busy signals, no hold music, no missed calls during your busiest hours.',
  },
  {
    question: 'Does it block spam and robocalls?',
    answer: 'Yes, automatically on every plan. The AI detects telemarketers and robocalls and ends those calls immediately. Spam calls are not counted against your usage.',
  },
  {
    question: 'Can I access this from my phone?',
    answer: 'Yes. The dashboard works on any device — phone, tablet, or desktop. You can add it to your home screen for instant access that works like a native app. You also get text and email notifications so you do not need to check the dashboard constantly.',
  },
];

interface AgencySupportWidgetProps {
  agencyName: string;
  agencyLogo: string | null;
  primaryColor: string;
  supportEmail: string | null;
  isDark: boolean;
  pricing?: { name: string; price: number; subtitle?: string; features?: string[] }[];
  currencySymbol?: string;
}

type WidgetView = 'home' | 'faq' | 'chat' | 'escalation';
interface ChatMessage { role: 'user' | 'assistant'; content: string; }

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Perceived-brightness check so we never put white text/icons on a light brand color.
function isLightHex(hex: string): boolean {
  const c = (hex || '').replace('#', '').trim();
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return false;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export default function AgencySupportWidget({
  agencyName,
  agencyLogo,
  primaryColor,
  supportEmail,
  isDark,
  pricing,
  currencySymbol,
}: AgencySupportWidgetProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<WidgetView>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [escName, setEscName] = useState('');
  const [escContact, setEscContact] = useState('');
  const [escSending, setEscSending] = useState(false);
  const [escDone, setEscDone] = useState(false);
  const [escError, setEscError] = useState('');
  const [teaser, setTeaser] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (open && view === 'home') {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
  }, [open, view]);

  // Show teaser after scrolling past 1000px, unless already dismissed in this session
  useEffect(() => {
    const handleScroll = () => {
      // Check dismissal on EVERY scroll event so once dismissed, teaser stays gone
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('agency-w-t')) return;
      if (window.scrollY > 1000 && !open) setTeaser(true);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [open]);

  // Contrast-correct text/icon color for surfaces filled with the brand color.
  const onPrimary = isLightHex(primaryColor) ? '#111827' : '#ffffff';
  const cs = currencySymbol || '$';
  const fabRing = isLightHex(primaryColor) ? ', 0 0 0 1px rgba(0,0,0,0.08)' : '';

  // Theme
  const t = {
    bg: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#fafaf9' : '#111827',
    textMuted: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280',
    textMuted2: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af',
    border: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
    hover: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
    cardBg: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
    shadow: isDark
      ? '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
    userBubbleBg: primaryColor,
    userBubbleText: onPrimary,
    aiBubbleBg: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
    aiBubbleText: isDark ? 'rgba(255,255,255,0.8)' : '#374151',
    successBg: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)',
    successText: isDark ? '#34d399' : '#059669',
    errorBg: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
    errorText: isDark ? '#f87171' : '#dc2626',
  };

  // Build a pricing FAQ (browsable + searchable) from the agency's configured tiers.
  const pricingFaq: FAQ | null = (pricing && pricing.length > 0)
    ? {
        question: 'How much does it cost? What plans are available?',
        answer:
          `${agencyName} offers ${pricing.length} plan${pricing.length > 1 ? 's' : ''}:<br/><br/>` +
          pricing
            .map(p => `<strong>${p.name}</strong> — ${cs}${p.price}/month${p.subtitle ? `<br/><span style="opacity:0.7">${p.subtitle}</span>` : ''}`)
            .join('<br/><br/>') +
          `<br/><br/>All plans include a 7-day free trial.` +
          (supportEmail ? ` Have a pricing question? Email ${supportEmail}.` : ''),
      }
    : null;

  // Displayed/searchable list: pricing first (when available), then prospect FAQs.
  const allFaqs: FAQ[] = pricingFaq ? [pricingFaq, ...PROSPECT_FAQS] : PROSPECT_FAQS;

  // Plain-text pricing block for the AI context.
  const pricingContext = (pricing && pricing.length > 0)
    ? 'PRICING & PLANS (these are the agency\'s actual prices — quote them exactly when asked about cost):\n' +
      pricing
        .map(p => {
          const feats = (p.features || []).filter(f => !f.toLowerCase().startsWith('everything')).slice(0, 5);
          return `- ${p.name}: ${cs}${p.price}/month${p.subtitle ? ` (${p.subtitle})` : ''}${feats.length ? ` — includes: ${feats.join(', ')}` : ''}`;
        })
        .join('\n') +
      '\nAll plans include a 7-day free trial.'
    : '';

  // Search
  const filteredFAQs = searchQuery.length >= 2
    ? allFaqs.filter(f => {
        const q = searchQuery.toLowerCase();
        return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      })
    : [];

  // Navigation
  const goHome = () => { setView('home'); setSelectedFAQ(null); setSearchQuery(''); };
  const openFAQ = (faq: FAQ) => { setSelectedFAQ(faq); setView('faq'); };
  const openChat = (msg?: string) => {
    setView('chat');
    if (chatMessages.length === 0) {
      setChatMessages([{
        role: 'assistant',
        content: `Hi! I can answer any questions about ${agencyName}'s AI receptionist service. What would you like to know?`,
      }]);
    }
    if (msg) handleChatSubmit(msg);
    else setTimeout(() => chatInputRef.current?.focus(), 200);
  };
  const openEscalation = () => { setView('escalation'); setEscDone(false); setEscError(''); setEscName(''); setEscContact(''); };

  // Build FAQ text for AI context, then fold in the agency's pricing.
  const faqContext = PROSPECT_FAQS.map(f => `Q: ${f.question}\nA: ${f.answer.replace(/<[^>]*>/g, '')}`).join('\n\n');
  const agencyContext = [faqContext, pricingContext].filter(Boolean).join('\n\n');

  // Chat
  const handleChatSubmit = async (overrideMsg?: string) => {
    const msg = overrideMsg || chatInput.trim();
    if (!msg || chatLoading) return;
    if (!overrideMsg) setChatInput('');

    const userMsg: ChatMessage = { role: 'user', content: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversationHistory: chatMessages.filter((m, i) => i > 0).slice(-10),
          agencyName,
          agencyFaqs: agencyContext,
          agencyPricing: pricingContext || undefined,
          supportEmail: supportEmail || '',
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let content = '';
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += dec.decode(value, { stream: true });
          setChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content };
            return updated;
          });
        }
      }
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: supportEmail
          ? `I'm having trouble connecting. You can reach us at ${supportEmail} and we'll respond within one business day.`
          : "I'm having trouble connecting right now. Please try again in a moment.",
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Escalation
  const handleEscalation = async () => {
    if (!escName.trim() || !escContact.trim() || escSending) return;
    setEscSending(true);
    setEscError('');
    const summary = chatMessages.map(m => `${m.role === 'user' ? 'Visitor' : 'AI'}: ${m.content}`).join('\n');

    try {
      const res = await fetch('/api/widget/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: escName.trim(),
          contact: escContact.trim(),
          conversationSummary: summary || undefined,
          agencyEmail: supportEmail || undefined,
          agencyName,
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setEscDone(true);
    } catch {
      setEscError(
        supportEmail
          ? `Something went wrong sending your message. Please email us directly at ${supportEmail} and we'll get right back to you.`
          : 'Something went wrong sending your message. Please try again in a moment.'
      );
    } finally {
      setEscSending(false);
    }
  };

  // Closed state — FAB button + teaser
  if (!open) {
    const dismissTeaser = () => { setTeaser(false); try { sessionStorage.setItem('agency-w-t', '1'); } catch {} };
    return (
      <>
        {teaser && (
          <div className="fixed bottom-[200px] md:bottom-[150px] right-5 z-[89] max-w-[210px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
              className="rounded-2xl px-3.5 py-3 text-[13px] leading-snug shadow-lg"
              style={{
                backgroundColor: isDark ? 'rgba(30,30,30,0.95)' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                color: isDark ? 'rgba(255,255,255,0.7)' : '#374151',
                boxShadow: isDark ? '0 12px 32px -8px rgba(0,0,0,0.5)' : '0 12px 32px -8px rgba(0,0,0,0.12)',
              }}
            >
              Have questions? We're here to help.
              <button
                onClick={dismissTeaser}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] leading-none"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb'}`,
                  color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af',
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => { setOpen(true); dismissTeaser(); }}
          className="fixed bottom-[140px] md:bottom-[90px] right-5 z-[90] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: primaryColor,
            color: onPrimary,
            boxShadow: `0 4px 20px ${hexToRgba(primaryColor, 0.4)}${fabRing}`,
            outline: 'none',
          }}
          aria-label="Help"
        >
          <MessageCircleQuestion className="h-6 w-6" />
        </button>
      </>
    );
  }

  return (
    <div
      className="fixed bottom-[140px] md:bottom-[90px] right-5 z-[90] w-[380px] max-w-[calc(100vw-2rem)] flex flex-col"
      style={{
        height: 'min(580px, calc(100vh - 12rem))',
        borderRadius: 20,
        backgroundColor: t.bg,
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <button
              onClick={goHome}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ backgroundColor: t.hover, color: t.textMuted }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            {agencyLogo && (
              <img
                src={agencyLogo}
                alt={agencyName}
                className="w-7 h-7 rounded-lg object-contain"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'transparent' }}
              />
            )}
            <div>
              <h3 className="text-sm font-semibold" style={{ color: t.text }}>
                {view === 'home' && 'Help'}
                {view === 'faq' && 'FAQ'}
                {view === 'chat' && 'Chat'}
                {view === 'escalation' && 'Contact Us'}
              </h3>
              {view === 'home' && (
                <p className="text-[10px]" style={{ color: t.textMuted2 }}>Questions about {agencyName}</p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          style={{ backgroundColor: t.hover, color: t.textMuted }}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* HOME */}
        {view === 'home' && (
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: t.textMuted }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm transition-colors focus:outline-none"
                style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text }}
              />
            </div>

            {searchQuery.length >= 2 ? (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
                  {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''}
                </p>
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-6">
                    <HelpCircle className="h-8 w-8 mx-auto mb-2" style={{ color: t.textMuted, opacity: 0.3 }} />
                    <p className="text-sm" style={{ color: t.textMuted }}>No matching questions</p>
                    <button onClick={() => openChat()} className="mt-3 text-xs font-medium" style={{ color: primaryColor }}>
                      Ask the AI assistant →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredFAQs.map((faq, i) => (
                      <button
                        key={i}
                        onClick={() => openFAQ(faq)}
                        className="w-full text-left rounded-xl p-3 transition-colors"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <p className="text-sm font-medium" style={{ color: t.text }}>{faq.question}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Quick actions */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => openChat()}
                    className="flex-1 flex items-center gap-2 rounded-xl p-3 transition-colors text-left"
                    style={{ backgroundColor: hexToRgba(primaryColor, 0.08), border: `1px solid ${hexToRgba(primaryColor, 0.2)}` }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(primaryColor, 0.15) }}>
                      <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: primaryColor }}>Ask AI</p>
                      <p className="text-[9px]" style={{ color: t.textMuted }}>Get instant answers</p>
                    </div>
                  </button>
                  <button
                    onClick={openEscalation}
                    className="flex-1 flex items-center gap-2 rounded-xl p-3 transition-colors text-left"
                    style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}` }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: t.hover }}>
                      <MessageSquare className="h-4 w-4" style={{ color: t.textMuted }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: t.text }}>Contact Us</p>
                      <p className="text-[9px]" style={{ color: t.textMuted }}>Message the team</p>
                    </div>
                  </button>
                </div>

                {/* FAQ list */}
                {allFaqs.length > 0 && (
                  <>
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
                      Frequently asked
                    </p>
                    <div className="space-y-0.5">
                      {allFaqs.map((faq, i) => (
                        <button
                          key={i}
                          onClick={() => openFAQ(faq)}
                          className="w-full text-left flex items-center justify-between gap-2 rounded-xl p-3 transition-colors"
                          style={{ backgroundColor: 'transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <p className="text-[13px]" style={{ color: t.text }}>{faq.question}</p>
                          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: t.textMuted2 }} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* FAQ DETAIL */}
        {view === 'faq' && selectedFAQ && (
          <div className="p-5">
            <h4 className="text-base font-semibold mb-3" style={{ color: t.text }}>{selectedFAQ.question}</h4>
            <div
              className="text-sm leading-relaxed"
              style={{ color: t.aiBubbleText }}
              dangerouslySetInnerHTML={{ __html: selectedFAQ.answer }}
            />
            <div className="mt-6 pt-4 space-y-2" style={{ borderTop: `1px solid ${t.border}` }}>
              <p className="text-[10px] font-medium" style={{ color: t.textMuted }}>Still need help?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => openChat(`I have a follow-up about: ${selectedFAQ.question}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors"
                  style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor, border: `1px solid ${hexToRgba(primaryColor, 0.2)}` }}
                >
                  <Sparkles className="h-3 w-3" /> Ask AI
                </button>
                <button
                  onClick={openEscalation}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors"
                  style={{ backgroundColor: t.hover, color: t.text, border: `1px solid ${t.border}` }}
                >
                  <MessageSquare className="h-3 w-3" /> Contact Us
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT */}
        {view === 'chat' && (
          <div className="flex flex-col" style={{ height: '100%' }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: hexToRgba(primaryColor, 0.15) }}>
                      <Bot className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                    </div>
                  )}
                  <div
                    className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                    style={{
                      backgroundColor: msg.role === 'user' ? t.userBubbleBg : t.aiBubbleBg,
                      color: msg.role === 'user' ? t.userBubbleText : t.aiBubbleText,
                      borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
                      borderBottomLeftRadius: msg.role === 'assistant' ? 4 : undefined,
                    }}
                  >
                    <span style={{ whiteSpace: 'pre-line' }}>{msg.content}</span>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: t.hover }}>
                      <User className="h-3.5 w-3.5" style={{ color: t.textMuted }} />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: hexToRgba(primaryColor, 0.15) }}>
                    <Bot className="h-3.5 w-3.5" style={{ color: primaryColor }} />
                  </div>
                  <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: t.aiBubbleBg }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: t.textMuted, animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: t.textMuted, animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: t.textMuted, animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="px-4 pt-2 pb-1">
              <button onClick={openEscalation} className="w-full text-center text-[10px] py-1 transition-colors" style={{ color: t.textMuted }}>
                Need a human? <span style={{ color: primaryColor }}>Contact us →</span>
              </button>
            </div>
          </div>
        )}

        {/* ESCALATION */}
        {view === 'escalation' && (
          <div className="p-5">
            {escDone ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: hexToRgba(primaryColor, 0.15) }}>
                  <Check className="h-7 w-7" style={{ color: primaryColor }} />
                </div>
                <h4 className="text-base font-semibold mb-2" style={{ color: t.text }}>Message sent!</h4>
                <p className="text-sm" style={{ color: t.textMuted }}>
                  We typically respond within one business day.
                </p>
                <button onClick={goHome} className="mt-4 text-xs font-medium" style={{ color: primaryColor }}>
                  ← Back
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm mb-4" style={{ color: t.textMuted }}>
                  Send us a message and we'll get back to you, typically within one business day.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: t.textMuted2 }}>Name</label>
                    <input
                      value={escName}
                      onChange={e => setEscName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                      style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: t.textMuted2 }}>Email or phone</label>
                    <input
                      value={escContact}
                      onChange={e => setEscContact(e.target.value)}
                      placeholder="you@business.com"
                      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                      style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text }}
                    />
                  </div>
                  {escError && (
                    <div
                      className="rounded-xl px-3.5 py-2.5 text-[12px] leading-snug"
                      style={{ backgroundColor: t.errorBg, color: t.errorText, border: `1px solid ${t.errorText}33` }}
                    >
                      {escError}
                    </div>
                  )}
                  <button
                    onClick={handleEscalation}
                    disabled={!escName.trim() || !escContact.trim() || escSending}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
                    style={{ backgroundColor: primaryColor, color: onPrimary }}
                  >
                    {escSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {escSending ? 'Sending...' : escError ? 'Try Again' : 'Send Message'}
                  </button>
                </div>
                {supportEmail && (
                  <p className="mt-4 text-[11px]" style={{ color: t.textMuted2 }}>
                    Or email <a href={`mailto:${supportEmail}`} style={{ color: primaryColor, textDecoration: 'none' }}>{supportEmail}</a>
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Chat input — only in chat view */}
      {view === 'chat' && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="flex items-end gap-2 rounded-xl p-1.5"
            style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}` }}>
            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSubmit();
                }
              }}
              placeholder="Ask a question..."
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none px-2 py-1.5 max-h-20"
              style={{ color: t.text }}
            />
            <button
              onClick={() => handleChatSubmit()}
              disabled={chatLoading || !chatInput.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-30"
              style={{ backgroundColor: primaryColor, color: onPrimary }}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}