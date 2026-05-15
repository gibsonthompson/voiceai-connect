'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ArrowUp, ChevronRight, DollarSign, Palette, Rocket, User, MessageCircle } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ DATA — pre-rendered, no API call needed
   ═══════════════════════════════════════════════════════════════════════════ */

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'Platform',
    question: 'How does white-labeling work?',
    answer: 'Every client-facing surface is branded to your agency — logo, color palette, custom domain with auto-provisioned SSL, transactional emails, marketing website, and the phone experience itself. Your clients interact only with your brand. VoiceAI Connect is never visible to the businesses you serve at any point — from signup through ongoing usage to billing.',
  },
  {
    category: 'Pricing',
    question: 'What do agencies charge their clients?',
    answer: 'Most agencies charge between $99 and $299 per month per client for AI receptionist services. Industry data shows the cost of a single missed call is roughly $500 for a small service business, and a full-time human receptionist runs approximately $3,000/month. AI receptionist coverage at $149/month is a clear yes for most local businesses — and your margins stay above 85%.',
  },
  {
    category: 'Setup',
    question: 'How fast can I onboard a client?',
    answer: 'Under sixty seconds. A local business fills out your branded signup form, and the platform automatically provisions their AI voice agent, dedicated phone number, dashboard credentials, and welcome email sequence. No A2P registration delay, no manual setup. Most agencies onboard their first client within an hour of activating their workspace.',
  },
  {
    category: 'Features',
    question: 'Is the AI demo line included?',
    answer: 'Yes — on the Pro tier and above. Each agency receives a dedicated demo phone number that prospects can call to experience the AI receptionist firsthand. It is the strongest conversion tool on the platform. Most prospects convert after calling the demo line without ever needing a sales call from you.',
  },
  {
    category: 'Compliance',
    question: 'Does it support HIPAA clients?',
    answer: 'Yes. HIPAA mode is available as a per-client toggle. When enabled, call recordings are not stored, data collection is limited to the caller\'s name and reason for visit, and appointment booking can be disabled. We provide a BAA template for your healthcare clients. VoiceAI Connect never uses call data for AI model training — on any plan, for any client.',
  },
  {
    category: 'Comparison',
    question: 'How is this different from GoHighLevel?',
    answer: 'GoHighLevel is a multi-purpose marketing platform designed for managing client campaigns. VoiceAI Connect is purpose-built for one thing: AI receptionist resale. Three concrete differences — end clients receive their own fully branded dashboard (GoHighLevel does not provide one), client onboarding completes in under sixty seconds (GoHighLevel requires per-client A2P registration that takes days), and the agency interface is mobile-first (GoHighLevel is desktop-bound).',
  },
  {
    category: 'Features',
    question: 'Does the AI book appointments?',
    answer: 'Yes — Google Calendar integration is included on every plan, including Free. When a caller requests an appointment, the AI checks the business owner\'s Google Calendar for available time slots in real time, offers options, and books it on the spot. The event appears instantly with the caller\'s name, phone number, and reason for the visit.',
  },
  {
    category: 'Pricing',
    question: 'What does it cost to get started?',
    answer: 'The Free tier has no platform fee — agencies pay $29.99 per client per month plus $0.12 per minute. The Pro tier costs $99/month with full white-label branding, marketing website, and demo line, with reduced per-client ($9.99) and per-minute ($0.10) rates. Pro and Scale include a 14-day free trial with no credit card required.',
  },
  {
    category: 'Platform',
    question: 'Do my clients know about VoiceAI Connect?',
    answer: 'No. The entire experience is branded to your agency. Your clients log into a dashboard with your logo, receive emails from your domain, and interact with an AI that greets callers using your brand name. VoiceAI Connect is the invisible infrastructure layer — your clients see you as the product provider.',
  },
  {
    category: 'Features',
    question: 'Can the AI handle Spanish-speaking callers?',
    answer: 'Yes — automatic English and Spanish on every plan, no configuration required. The AI detects when a caller speaks Spanish and switches languages for the entire conversation. It collects names, phone numbers, and appointment requests in Spanish, then sends the business owner a summary in English.',
  },
  {
    category: 'Data',
    question: 'Does VoiceAI Connect use call data for AI training?',
    answer: 'No. VoiceAI Connect never uses call data, transcriptions, or recordings to train AI models. The underlying AI providers we use also do not train on API-submitted data per their terms of service. Your data and your clients\' data is never used for model training — period.',
  },
  {
    category: 'Support',
    question: 'Who handles client support?',
    answer: 'You are the point of contact for your clients — that is the white-label model. Your clients interact with your brand and never contact VoiceAI Connect directly. On our side, we provide platform support to you as the agency operator. If you hit a technical issue, we resolve it behind the scenes.',
  },
];

const QUICK_ACTIONS = [
  { label: 'Agency pricing', icon: DollarSign, prompt: 'What does it cost to get started?' },
  { label: 'White-labeling', icon: Palette, prompt: 'How does white-labeling work?' },
  { label: 'Start free trial', icon: Rocket, href: '/signup' },
  { label: 'Existing agency', icon: User, prompt: 'I\'m an existing agency and need help with my account.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT MESSAGE TYPE
   ═══════════════════════════════════════════════════════════════════════════ */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'landing' | 'faq-answer' | 'chat'>('landing');
  const [activeFAQ, setActiveFAQ] = useState<FAQItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Teaser after 5s on first visit
  useEffect(() => {
    const dismissed = sessionStorage.getItem('widget-teaser-dismissed');
    if (dismissed) return;
    const timer = setTimeout(() => setShowTeaser(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const openWidget = useCallback(() => {
    setIsOpen(true);
    setShowTeaser(false);
    sessionStorage.setItem('widget-teaser-dismissed', '1');
  }, []);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openFAQ = useCallback((faq: FAQItem) => {
    setActiveFAQ(faq);
    setView('faq-answer');
  }, []);

  const backToLanding = useCallback(() => {
    setView('landing');
    setActiveFAQ(null);
  }, []);

  const startChat = useCallback((initialMessage?: string) => {
    setView('chat');
    if (initialMessage) {
      sendMessage(initialMessage);
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isStreaming) return;
    setInput('');

    const userMessage: ChatMessage = { role: 'user', content: msg };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsStreaming(true);

    try {
      const res = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversationHistory: updatedMessages.slice(-10), // last 10 messages for context
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
            return updated;
          });
        }
      }
    } catch {
      // Fallback: check FAQ data for a match
      const lowerMsg = msg.toLowerCase();
      const match = FAQ_DATA.find(f =>
        f.question.toLowerCase().includes(lowerMsg.slice(0, 20)) ||
        lowerMsg.includes(f.question.toLowerCase().slice(0, 20))
      );

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: match
            ? match.answer
            : 'I\'m having trouble connecting right now. You can email us at support@myvoiceaiconnect.com and a team member will respond within one business day.',
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleQuickAction = useCallback((action: typeof QUICK_ACTIONS[0]) => {
    if (action.href) {
      window.location.href = action.href;
      return;
    }
    if (action.prompt) {
      // Check if it matches a FAQ first
      const match = FAQ_DATA.find(f => f.question === action.prompt);
      if (match) {
        openFAQ(match);
      } else {
        startChat(action.prompt);
      }
    }
  }, [openFAQ, startChat]);

  /* ─── Render helpers ─── */

  const renderFAB = () => (
    <>
      {/* Teaser bubble */}
      {showTeaser && !isOpen && (
        <div
          className="fixed z-[9998] transition-all duration-300"
          style={{
            bottom: '80px',
            right: '20px',
            maxWidth: '240px',
          }}
        >
          <div
            style={{
              background: 'rgba(12, 16, 24, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '12.5px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: '1.5',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            Got questions about the platform? I can help.
            <button
              onClick={() => {
                setShowTeaser(false);
                sessionStorage.setItem('widget-teaser-dismissed', '1');
              }}
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={openWidget}
        aria-label="Open support chat"
        className="fixed z-[9999] transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          bottom: '20px',
          right: '20px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#4aeabc',
          border: 'none',
          cursor: 'pointer',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(74, 234, 188, 0.25)',
        }}
      >
        <MessageCircle className="w-[22px] h-[22px]" style={{ color: '#080b14' }} />
      </button>
    </>
  );

  const renderHeader = () => (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f1a2e, #0c1018)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #4aeabc, #047857)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 700,
          color: '#080b14',
          flexShrink: 0,
        }}
      >
        V
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>
          VoiceAI Connect
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4aeabc', display: 'inline-block' }} />
          Online
        </div>
      </div>
      {view !== 'landing' && (
        <button
          onClick={backToLanding}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            border: 'none',
            background: 'rgba(255,255,255,0.04)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '11px',
            fontFamily: "'Geist', system-ui, sans-serif",
          }}
        >
          ←
        </button>
      )}
      <button
        onClick={closeWidget}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: 'none',
          background: 'rgba(255,255,255,0.04)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const renderInputBar = () => (
    <div
      style={{
        padding: '10px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.01)',
        flexShrink: 0,
      }}
    >
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about the platform..."
        style={{
          flex: 1,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '8px 14px',
          fontSize: '12px',
          background: 'rgba(255,255,255,0.03)',
          color: 'rgba(255,255,255,0.8)',
          outline: 'none',
          fontFamily: "'Geist', system-ui, sans-serif",
        }}
        onFocus={e => {
          (e.target as HTMLInputElement).style.borderColor = 'rgba(74, 234, 188, 0.3)';
          if (view === 'landing') startChat();
        }}
        onBlur={e => {
          (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)';
        }}
      />
      <button
        onClick={() => sendMessage()}
        disabled={!input.trim() || isStreaming}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: input.trim() ? '#4aeabc' : 'rgba(255,255,255,0.06)',
          color: input.trim() ? '#080b14' : 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: input.trim() ? 'pointer' : 'default',
          border: 'none',
          transition: 'all 0.15s',
        }}
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const renderLanding = () => (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em' }}>
        How can we help?
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>
        Get instant answers about the platform
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginTop: '14px' }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action)}
            style={{
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11.5px',
              color: 'rgba(255,255,255,0.75)',
              background: 'rgba(255,255,255,0.015)',
              textAlign: 'left',
              fontFamily: "'Geist', system-ui, sans-serif",
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.035)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.015)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: action.icon === DollarSign ? 'rgba(74,234,188,0.1)' :
                            action.icon === Palette ? 'rgba(59,130,246,0.1)' :
                            action.icon === Rocket ? 'rgba(139,92,246,0.1)' :
                            'rgba(245,158,11,0.1)',
                color: action.icon === DollarSign ? '#4aeabc' :
                       action.icon === Palette ? '#3b82f6' :
                       action.icon === Rocket ? '#8b5cf6' :
                       '#f59e0b',
              }}
            >
              <action.icon className="w-[13px] h-[13px]" />
            </div>
            {action.label}
          </button>
        ))}
      </div>

      {/* FAQ list */}
      <div
        style={{
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          fontSize: '9px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: 'rgba(255,255,255,0.25)',
          marginTop: '18px',
          marginBottom: '8px',
        }}
      >
        Common questions
      </div>
      {FAQ_DATA.map((faq, i) => (
        <button
          key={i}
          onClick={() => openFAQ(faq)}
          style={{
            width: '100%',
            padding: '9px 0',
            borderBottom: i < FAQ_DATA.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            fontSize: '12.5px',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            borderBottomStyle: 'solid',
            borderBottomColor: 'rgba(255,255,255,0.04)',
            textAlign: 'left',
            fontFamily: "'Geist', system-ui, sans-serif",
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#4aeabc'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'; }}
        >
          {faq.question}
          <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0, marginLeft: '8px' }} />
        </button>
      ))}
    </div>
  );

  const renderFAQAnswer = () => (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      <div
        style={{
          fontFamily: "'Geist Mono', ui-monospace, monospace",
          fontSize: '9px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: '#4aeabc',
          marginBottom: '8px',
        }}
      >
        {activeFAQ?.category}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
        {activeFAQ?.question}
      </div>
      <div
        style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.65,
          marginTop: '14px',
        }}
      >
        {activeFAQ?.answer}
      </div>

      {/* Helpful / still have a question */}
      <div style={{ marginTop: '24px', padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '10px' }}>
          Was this helpful?
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={backToLanding}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(74,234,188,0.1)',
              border: '1px solid rgba(74,234,188,0.2)',
              color: '#4aeabc',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Geist', system-ui, sans-serif",
            }}
          >
            Yes, thanks
          </button>
          <button
            onClick={() => startChat(`I have a follow-up question about: ${activeFAQ?.question}`)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Geist', system-ui, sans-serif",
            }}
          >
            I have more questions
          </button>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {messages.length === 0 && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '40px' }}>
          Ask anything about VoiceAI Connect
        </div>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            maxWidth: '88%',
            padding: '10px 13px',
            borderRadius: '12px',
            fontSize: '12.5px',
            lineHeight: 1.55,
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
            borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
            ...(msg.role === 'user'
              ? {
                  background: 'rgba(74,234,188,0.12)',
                  border: '1px solid rgba(74,234,188,0.15)',
                  color: 'rgba(255,255,255,0.85)',
                }
              : {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.8)',
                }),
            whiteSpace: 'pre-wrap' as const,
            wordBreak: 'break-word' as const,
          }}
        >
          {msg.content || (isStreaming && i === messages.length - 1 ? '...' : '')}
        </div>
      ))}
      {isStreaming && messages[messages.length - 1]?.role === 'user' && (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            padding: '10px 13px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            borderBottomLeftRadius: '4px',
            width: 'fit-content',
          }}
        >
          {[0, 0.2, 0.4].map((delay, j) => (
            <span
              key={j}
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                animation: `widgetBounce 1.2s infinite ${delay}s`,
              }}
            />
          ))}
        </div>
      )}
      <div ref={chatEndRef} />

      <style>{`
        @keyframes widgetBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );

  return (
    <>
      {renderFAB()}

      {/* Widget panel */}
      <div
        className="fixed z-[9999]"
        style={{
          bottom: '14px',
          right: '14px',
          width: '340px',
          maxHeight: 'min(580px, calc(100vh - 40px))',
          borderRadius: '16px',
          background: '#0c1018',
          border: '1px solid rgba(255,255,255,0.08)',
          display: isOpen ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          fontFamily: "'Geist', system-ui, sans-serif",
          animation: isOpen ? 'widgetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
      >
        {renderHeader()}
        {view === 'landing' && renderLanding()}
        {view === 'faq-answer' && renderFAQAnswer()}
        {view === 'chat' && renderChat()}
        {renderInputBar()}

        <style>{`
          @keyframes widgetSlideUp {
            from { transform: translateY(16px) scale(0.96); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}