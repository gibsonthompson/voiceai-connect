'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ DATA
   ═══════════════════════════════════════════════════════════════════════════ */

interface FAQItem { question: string; answer: string; category: string; }

const FAQ_DATA: FAQItem[] = [
  { category: 'Platform', question: 'What is VoiceAI Connect?', answer: "VoiceAI Connect is a white-label AI receptionist platform built for agencies and resellers. Agencies use the platform to brand and resell AI receptionist subscriptions to local service businesses for $99 to $299 per month. The platform automatically provisions the AI voice agent, dedicated phone number, and client-facing dashboard at signup. Subscription payments flow directly to the agency through Stripe Connect. Fifteen enterprise vendors are integrated and shipped as a single agency-ready application." },
  { category: 'Platform', question: 'How does the white-label experience work?', answer: "Every client-facing surface is configured per agency: logo, color palette, custom domain with auto-provisioned SSL, transactional emails, marketing website, and the phone experience itself. End clients interact only with the agency's brand. VoiceAI Connect is not visible to the businesses you serve at any point in the lifecycle — from signup through ongoing usage to billing." },
  { category: 'Platform', question: 'Do my clients get their own dashboard?', answer: "Yes. Every business you onboard receives their own fully branded dashboard — call recordings, time-coded transcripts, AI-generated summaries with intent and sentiment, contact management, and configurable SMS and email alerts. They never see your other clients or your agency backend. You get a separate agency dashboard where you manage all clients, revenue, branding, and operations from one interface." },
  { category: 'Pricing', question: 'What does it cost to start an AI receptionist agency?', answer: "Three tiers. The Free tier has no platform fee — agencies pay $29.99 per client per month plus $0.12 per minute of voice usage, making it zero-risk to start. The Pro tier costs $99 per month and includes full white-label branding, a marketing website, and a demo phone line, with reduced per-client ($9.99) and per-minute ($0.10) rates. The Scale tier at $499 per month eliminates per-client fees entirely at $0.05 per minute. Pro and Scale both include a 14-day free trial with no credit card required." },
  { category: 'Pricing', question: 'How do free trials work?', answer: "Two separate trial systems. At the agency level, the Pro and Scale plans include a 14-day free trial with no credit card required — full access to white-label branding, marketing site, CRM, and all platform features. The Free plan has no trial because there is no platform fee. At the client level, every plan includes a 7-day free trial for the businesses you onboard. When a local business signs up through your branded page, they get seven days of full AI receptionist service before their first billing cycle begins." },
  { category: 'Features', question: 'Does the AI book appointments?', answer: "Yes — Google Calendar integration is included on every plan, including Free. When a caller requests an appointment, the AI checks the business owner's Google Calendar for available time slots in real time, offers options to the caller, and creates the calendar event automatically with the caller's name, phone number, and reason for the appointment. The booking appears in Google Calendar instantly." },
  { category: 'Features', question: 'Does the AI filter spam and robocalls?', answer: "Yes — automatically, on every plan. The AI detects telemarketers, robocalls, and solicitors and ends those calls immediately. Spam calls are not counted against the client's monthly limit. The business owner receives a notification when spam is blocked. No configuration required — it works out of the box." },
  { category: 'Features', question: 'Can the AI handle multiple calls at once?', answer: "Unlimited simultaneous calls. Unlike a human receptionist who can only answer one call at a time, the AI handles as many concurrent calls as needed — no busy signals, no hold music, no missed calls during peak hours. This is one of the strongest selling points to local businesses." },
  { category: 'Features', question: 'Does the AI work in Spanish?', answer: "Yes — automatic English and Spanish on every plan, no configuration required. The AI detects when a caller speaks Spanish and switches to Spanish for the entire conversation. It collects names, phone numbers, appointment requests, and everything else in Spanish, then sends the business owner a summary in English." },
  { category: 'Setup', question: 'What do I need from each client to get them set up?', answer: "Just the basics: business name, industry, phone number, and some information about their services, hours, and common questions. Everything is entered through the branded signup flow. If the client has a website, the AI scans it automatically. The entire client onboarding completes in under sixty seconds." },
  { category: 'Comparison', question: 'How is this different from GoHighLevel?', answer: "GoHighLevel is a multi-purpose marketing platform — CRM, funnels, email, SMS, websites. VoiceAI Connect is purpose-built for one product: AI receptionist resale. Three concrete differences: end clients receive their own branded dashboard (GoHighLevel does not), client onboarding completes in under sixty seconds (GoHighLevel requires per-client A2P registration that can take days), and the agency interface is mobile-first (GoHighLevel is desktop-bound)." },
  { category: 'Compliance', question: 'Does it support HIPAA clients?', answer: "Yes. HIPAA mode is available as a per-client toggle. When enabled, call recordings are not stored, data collection is limited to the caller's name and reason for visit, and appointment booking can be disabled. We provide a BAA template for healthcare clients. VoiceAI Connect never uses call data for AI model training — on any plan, for any client." },
  { category: 'Billing', question: 'How does Stripe Connect billing work?', answer: "Stripe Connect routes every client subscription directly into your bank account at the price tier you set. Zero revenue share, zero holdbacks, zero middleman. The platform never sees the money — your clients pay you. Automated invoicing on every client signup." },
  { category: 'Data', question: 'Does VoiceAI Connect use call data for AI training?', answer: "No. VoiceAI Connect never uses call data, transcriptions, or recordings to train AI models. The underlying AI providers also do not train on API-submitted data per their terms of service. Your data and your clients' data is never used for model training." },
  { category: 'Platform', question: 'Is this another make money with AI product?', answer: "No. VoiceAI Connect is software infrastructure, not a course or a coaching program. The platform functions as the operating system for an actual service business — comparable to how Shopify functions as the operating system for an e-commerce business. There are no upsells, community fees, or playbooks to purchase." },
  { category: 'Support', question: 'Who handles client support?', answer: "You are the point of contact for your clients — that is the white-label model. Your clients interact with your brand through their dashboard and never contact VoiceAI Connect directly. On our side, we provide platform support to you as the agency operator. If you hit a technical issue, we resolve it." },
];

const QUICK_ACTIONS = [
  { label: 'Agency pricing', sub: 'Plans from free to Scale', prompt: 'What does it cost to get started?' },
  { label: 'White-labeling', sub: 'Your brand, end to end', prompt: 'How does white-labeling work?' },
  { label: 'Start free trial', sub: 'No credit card required', href: '/signup' },
  { label: 'Existing agency', sub: 'Get platform support', prompt: "I'm an existing agency and need help with my account." },
];

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE SVG ICONS
   ═══════════════════════════════════════════════════════════════════════════ */

function WIcon({ type }: { type: string }) {
  const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'chat': return <svg {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
    case 'x': return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    case 'up': return <svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
    case 'chev': return <svg {...p} width={14} height={14}><path d="M9 18l6-6-6-6" /></svg>;
    case 'back': return <svg {...p} width={14} height={14}><path d="M15 18l-6-6 6-6" /></svg>;
    case 'check': return <svg {...p} width={18} height={18} strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>;
    default: return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   STYLES — matches globals.css design tokens exactly
   ═══════════════════════════════════════════════════════════════════════════ */

const font = "'Geist', system-ui, sans-serif";
const mono = "'Geist Mono', ui-monospace, monospace";
const em = '#4aeabc';

const css = `
@keyframes wBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-3px)}}
@keyframes wSlide{from{transform:translateY(12px) scale(0.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
@keyframes wPulse{0%,100%{box-shadow:0 0 0 0 rgba(74,234,188,0.25)}50%{box-shadow:0 0 0 8px rgba(74,234,188,0)}}
`;

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SupportWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'landing' | 'faq' | 'chat' | 'escalation'>('landing');
  const [activeFAQ, setActiveFAQ] = useState<FAQItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [escName, setEscName] = useState('');
  const [escContact, setEscContact] = useState('');
  const [escBusy, setEscBusy] = useState(false);
  const [escDone, setEscDone] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streaming]);
  useEffect(() => { if (sessionStorage.getItem('w-t')) return; const t = setTimeout(() => setTeaser(true), 5000); return () => clearTimeout(t); }, []);

  const open = () => { setIsOpen(true); setTeaser(false); sessionStorage.setItem('w-t', '1'); };
  const close = () => setIsOpen(false);
  const goLanding = () => { setView('landing'); setActiveFAQ(null); };
  const goFAQ = (f: FAQItem) => { setActiveFAQ(f); setView('faq'); };
  const goChat = (msg?: string) => { setView('chat'); msg ? send(msg) : setTimeout(() => inputRef.current?.focus(), 100); };
  const goEsc = () => { setView('escalation'); setEscDone(false); setEscName(''); setEscContact(''); };

  const send = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    setInput('');
    const user: ChatMessage = { role: 'user', content: msg };
    const all = [...messages, user];
    setMessages(all);
    setStreaming(true);
    try {
      const res = await fetch('/api/widget/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, conversationHistory: all.slice(-10) }) });
      if (!res.ok) throw new Error('');
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let c = '';
      setMessages(p => [...p, { role: 'assistant', content: '' }]);
      if (reader) { while (true) { const { done, value } = await reader.read(); if (done) break; c += dec.decode(value, { stream: true }); setMessages(p => { const u = [...p]; u[u.length - 1] = { role: 'assistant', content: c }; return u; }); } }
    } catch {
      const l = msg.toLowerCase();
      const m = FAQ_DATA.find(f => f.question.toLowerCase().includes(l.slice(0, 20)) || l.includes(f.question.toLowerCase().slice(0, 20)));
      setMessages(p => [...p, { role: 'assistant', content: m ? m.answer : "I'm having trouble connecting. Email support@myvoiceaiconnect.com and a team member will respond within one business day." }]);
    } finally { setStreaming(false); }
  }, [input, messages, streaming]);

  const doEsc = async () => {
    if (!escName.trim() || !escContact.trim() || escBusy) return;
    setEscBusy(true);
    const sum = messages.map(m => `${m.role === 'user' ? 'Visitor' : 'AI'}: ${m.content}`).join('\n');
    try { await fetch('/api/widget/escalate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: escName.trim(), contact: escContact.trim(), conversationSummary: sum || undefined }) }); } catch {}
    setEscDone(true); setEscBusy(false);
  };

  const qa = (a: typeof QUICK_ACTIONS[0]) => { if (a.href) { window.location.href = a.href; return; } const m = FAQ_DATA.find(f => f.question === a.prompt); m ? goFAQ(m) : goChat(a.prompt); };

  /* ─── Shared sub-components ─── */

  const LogoMark = () => (
    <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 1px rgba(74,234,188,0.15), 0 4px 12px -4px rgba(74,234,188,0.3)' }}>
      <Image src="/icon-512x512.png" alt="VoiceAI Connect" width={34} height={34} style={{ width: 34, height: 34, objectFit: 'cover' }} />
    </div>
  );

  const Eyebrow = ({ children, color }: { children: string; color?: string }) => (
    <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500, color: color || 'rgba(255,255,255,0.25)' }}>{children}</p>
  );

  const Btn = ({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${active ? 'rgba(74,234,188,0.2)' : 'rgba(255,255,255,0.06)'}`, background: active ? 'rgba(74,234,188,0.08)' : 'rgba(255,255,255,0.03)', color: active ? em : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: font, transition: 'all 0.15s' }}>
      {children}
    </button>
  );

  const InputField = ({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) => (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', marginTop: 7, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.025)', color: 'rgba(255,255,255,0.85)', fontSize: 13, outline: 'none', fontFamily: font, boxSizing: 'border-box' }}
        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(74,234,188,0.25)'; }}
        onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)'; }} />
    </div>
  );

  /* ─── Main render ─── */

  // Hide on dashboard routes
  if (pathname.startsWith('/agency') || pathname.startsWith('/client') || pathname.startsWith('/dashboard')) return null;

  return (
    <>
      <style>{css}</style>

      {/* Teaser */}
      {teaser && !isOpen && (
        <div style={{ position: 'fixed', bottom: 86, right: 20, maxWidth: 210, zIndex: 9998 }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.005))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '11px 14px', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, fontFamily: font, boxShadow: '0 16px 40px -10px rgba(0,0,0,0.6)' }}>
            Got questions about the platform?
            <button onClick={() => { setTeaser(false); sessionStorage.setItem('w-t', '1'); }} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={open} aria-label="Open support"
        className="support-widget-fab"
        style={{
          position: 'fixed', bottom: 20, right: 20, width: 54, height: 54, borderRadius: 16,
          border: '1px solid rgba(74,234,188,0.25)',
          background: 'linear-gradient(135deg, rgba(74,234,188,0.12), rgba(4,120,87,0.12))',
          cursor: 'pointer', display: isOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(74,234,188,0.08), 0 8px 24px -8px rgba(74,234,188,0.2)',
          transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', zIndex: 9999, color: em,
          animation: 'wPulse 3s ease-in-out 2',
        }}>
        <WIcon type="chat" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, width: 370, maxHeight: 'min(600px, calc(100vh - 40px))',
          borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 9999,
          background: 'linear-gradient(180deg, rgba(12,12,12,0.98), rgba(5,5,5,0.98))',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 80px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset',
          backdropFilter: 'blur(40px)', animation: 'wSlide 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}>

          {/* Header */}
          <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: 'linear-gradient(180deg, rgba(74,234,188,0.03), transparent)' }}>
            <LogoMark />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: '#fafaf9', letterSpacing: '-0.01em' }}>VoiceAI Connect</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: em, display: 'inline-block', boxShadow: '0 0 6px rgba(74,234,188,0.5)' }} />
                <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>Online now</span>
              </div>
            </div>
            {view !== 'landing' && (
              <button onClick={goLanding} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', transition: 'background 0.15s', marginRight: 4 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                <WIcon type="back" />
              </button>
            )}
            <button onClick={close} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
              <WIcon type="x" />
            </button>
          </div>

          {/* ── Landing ── */}
          {view === 'landing' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <p style={{ fontFamily: font, fontSize: 20, fontWeight: 500, color: '#fafaf9', letterSpacing: '-0.02em', lineHeight: 1.15 }}>How can we help?</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 6, fontFamily: font }}>Instant answers about the platform, pricing, and setup.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
                {QUICK_ACTIONS.map(a => (
                  <button key={a.label} onClick={() => qa(a)} style={{ borderRadius: 14, padding: '14px 12px', cursor: 'pointer', textAlign: 'left', background: 'linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.006))', border: '1px solid rgba(255,255,255,0.06)', fontFamily: font, display: 'flex', flexDirection: 'column', gap: 3, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,234,188,0.25)'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(74,234,188,0.04), rgba(74,234,188,0.01))'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.006))'; }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#fafaf9', letterSpacing: '-0.01em' }}>{a.label}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>{a.sub}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 24, marginBottom: 6 }}><Eyebrow>Frequently asked</Eyebrow></div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {FAQ_DATA.map((f, i) => (
                  <button key={i} onClick={() => goFAQ(f)} style={{ width: '100%', padding: '11px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textAlign: 'left', fontFamily: font, transition: 'color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = em; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}>
                    {f.question}
                    <span style={{ color: 'rgba(255,255,255,0.1)', flexShrink: 0, marginLeft: 8 }}><WIcon type="chev" /></span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── FAQ Answer ── */}
          {view === 'faq' && activeFAQ && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <div style={{ marginBottom: 10 }}><Eyebrow color={em}>{activeFAQ.category}</Eyebrow></div>
              <p style={{ fontFamily: font, fontSize: 17, fontWeight: 500, color: '#fafaf9', letterSpacing: '-0.01em', lineHeight: 1.25 }}>{activeFAQ.question}</p>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginTop: 14, fontFamily: font }}>{activeFAQ.answer}</p>
              <div style={{ marginTop: 24, borderRadius: 12, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', padding: 14 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontFamily: font }}>Was this helpful?</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn active onClick={goLanding}>Yes, thanks</Btn>
                  <Btn onClick={() => goChat(`Follow-up about: ${activeFAQ.question}`)}>More questions</Btn>
                </div>
              </div>
            </div>
          )}

          {/* ── Chat ── */}
          {view === 'chat' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: 40, fontFamily: font }}>Ask anything about VoiceAI Connect</p>}
              {messages.map((m, i) => (
                <div key={i} style={{
                  maxWidth: '85%', padding: '11px 14px', fontSize: 13, lineHeight: 1.6, fontFamily: font,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  ...(m.role === 'user' ? { borderRadius: '14px 14px 4px 14px', background: 'rgba(74,234,188,0.1)', border: '1px solid rgba(74,234,188,0.14)', color: 'rgba(255,255,255,0.85)' }
                    : { borderRadius: '14px 14px 14px 4px', background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)' }),
                }}>
                  {m.content || (streaming && i === messages.length - 1 ? '...' : '')}
                </div>
              ))}
              {streaming && messages[messages.length - 1]?.role === 'user' && (
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '11px 14px', width: 'fit-content', borderRadius: '14px 14px 14px 4px', background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {[0, 0.2, 0.4].map((d, j) => <span key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(74,234,188,0.4)', animation: `wBounce 1.2s infinite ${d}s` }} />)}
                </div>
              )}
              <div ref={endRef} />
              {messages.length >= 2 && !streaming && (
                <button onClick={goEsc} style={{ alignSelf: 'center', marginTop: 4, padding: '7px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', fontSize: 11, cursor: 'pointer', fontFamily: font, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = em; e.currentTarget.style.borderColor = 'rgba(74,234,188,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}>
                  Talk to a person
                </button>
              )}
            </div>
          )}

          {/* ── Escalation ── */}
          {view === 'escalation' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {escDone ? (
                <div style={{ textAlign: 'center', padding: '32px 12px' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(74,234,188,0.08)', border: '1px solid rgba(74,234,188,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: em }}><WIcon type="check" /></div>
                  <p style={{ fontFamily: font, fontSize: 16, fontWeight: 500, color: '#fafaf9' }}>Message received</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 8, lineHeight: 1.5, fontFamily: font }}>A team member will follow up within one business day.</p>
                  <button onClick={goLanding} style={{ marginTop: 18, padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: font }}>Back to help</button>
                </div>
              ) : (
                <>
                  <p style={{ fontFamily: font, fontSize: 17, fontWeight: 500, color: '#fafaf9', letterSpacing: '-0.01em' }}>Talk to our team</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 4, fontFamily: font }}>We respond within one business day.</p>
                  <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <InputField value={escName} onChange={setEscName} placeholder="Your name" label="Name" />
                    <InputField value={escContact} onChange={setEscContact} placeholder="you@agency.com" label="Email or phone" />
                    <button onClick={doEsc} disabled={!escName.trim() || !escContact.trim() || escBusy}
                      style={{ padding: 11, borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 500, cursor: escName.trim() && escContact.trim() ? 'pointer' : 'default', fontFamily: font, transition: 'all 0.15s', background: escName.trim() && escContact.trim() ? em : 'rgba(255,255,255,0.04)', color: escName.trim() && escContact.trim() ? '#050505' : 'rgba(255,255,255,0.15)' }}>
                      {escBusy ? 'Sending...' : 'Send message'}
                    </button>
                  </div>
                  <p style={{ marginTop: 18, fontSize: 11, color: 'rgba(255,255,255,0.18)', fontFamily: font }}>
                    Or email <a href="mailto:support@myvoiceaiconnect.com" style={{ color: 'rgba(74,234,188,0.5)', textDecoration: 'none' }}>support@myvoiceaiconnect.com</a>
                  </p>
                </>
              )}
            </div>
          )}

          {/* Input bar — hidden on escalation */}
          {view !== 'escalation' && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything..."
                style={{ flex: 1, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', fontSize: 13, background: 'rgba(255,255,255,0.025)', color: 'rgba(255,255,255,0.85)', outline: 'none', fontFamily: font }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(74,234,188,0.25)'; if (view === 'landing') goChat(); }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)'; }} />
              <button onClick={() => send()} disabled={!input.trim() || streaming}
                style={{ width: 34, height: 34, borderRadius: 10, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.15s', background: input.trim() ? em : 'rgba(255,255,255,0.04)', color: input.trim() ? '#050505' : 'rgba(255,255,255,0.15)' }}>
                <WIcon type="up" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}