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
  { category: 'Platform', question: 'How does the white-label experience work?', answer: "Every client-facing surface is configured per agency: logo, color palette, custom domain with auto-provisioned SSL, transactional emails, marketing website, and the phone experience itself. End clients interact only with the agency's brand. VoiceAI Connect is not visible to the businesses you serve at any point in the lifecycle, from signup through ongoing usage to billing." },
  { category: 'Platform', question: 'Do my clients get their own dashboard?', answer: "Yes. Every business you onboard receives their own fully branded dashboard: call recordings, time-coded transcripts, AI-generated summaries with intent and sentiment, contact management, and configurable SMS and email alerts. They never see your other clients or your agency backend. You get a separate agency dashboard where you manage all clients, revenue, branding, and operations from one interface." },
  { category: 'Pricing', question: 'What does it cost to start an AI receptionist agency?', answer: "Three tiers. The Free tier has no platform fee, agencies pay $29.99 per client per month plus $0.12 per minute of voice usage, making it zero-risk to start. The Pro tier costs $99 per month and includes full white-label branding, a marketing website, and a demo phone line, with reduced per-client ($9.99) and per-minute ($0.10) rates. The Scale tier at $499 per month eliminates per-client fees entirely at $0.05 per minute. Pro and Scale both include a 14-day free trial (you add a card to start it and aren't charged until the trial ends)." },
  { category: 'Features', question: 'Does the AI book appointments?', answer: "Yes. Google Calendar integration is included on every plan, including Free. When a caller requests an appointment, the AI checks the business owner's Google Calendar for available time slots in real time, offers options to the caller, and creates the calendar event automatically with the caller's name, phone number, and reason for the appointment. The booking appears in Google Calendar instantly." },
  { category: 'Comparison', question: 'How is this different from GoHighLevel?', answer: "GoHighLevel is a multi-purpose marketing platform: CRM, funnels, email, SMS, websites. VoiceAI Connect is purpose-built for one product: AI receptionist resale. Three concrete differences: end clients receive their own branded dashboard (GoHighLevel does not), client onboarding completes in under sixty seconds (GoHighLevel requires per-client A2P registration that can take days), and the agency interface is mobile-first (GoHighLevel is desktop-bound)." },
  { category: 'Billing', question: 'How does Stripe Connect billing work?', answer: "Stripe Connect routes every client subscription directly into your bank account at the price tier you set. Zero revenue share, zero holdbacks, zero middleman. The platform never sees the money, your clients pay you. Automated invoicing on every client signup." },
];

const QUICK_ACTIONS = [
  { label: 'Agency pricing', sub: 'Plans from free to Scale', prompt: 'What does it cost to start an AI receptionist agency?' },
  { label: 'White-labeling', sub: 'Your brand, end to end', prompt: 'How does the white-label experience work?' },
  { label: 'Get started free', sub: 'No card to begin', href: '/signup' },
  { label: 'Existing agency', sub: 'Get platform support', prompt: "I'm an existing agency and need help with my account." },
];

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

/* ═══════════════════════════════════════════════════════════════════════════
   SVG ICONS, defined OUTSIDE component to prevent re-creation
   ═══════════════════════════════════════════════════════════════════════════ */

const font = "'Geist', system-ui, sans-serif";
const mono = "'Geist Mono', ui-monospace, monospace";
const em = '#10b981';
// Shared text treatment for solid green buttons: bold white with a crisp black outline.
const greenBtnText = { color: '#04120f', fontWeight: 800 } as React.CSSProperties;

function WIcon({ type }: { type: string }) {
  const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'chat': return <svg {...p}><g transform="translate(24,0) scale(-1,1)"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></g></svg>;
    case 'x': return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    case 'up': return <svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
    case 'chev': return <svg {...p} width={14} height={14}><path d="M9 18l6-6-6-6" /></svg>;
    case 'back': return <svg {...p} width={14} height={14}><path d="M15 18l-6-6 6-6" /></svg>;
    case 'check': return <svg {...p} width={18} height={18} strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>;
    default: return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS, defined OUTSIDE to prevent focus loss on re-render
   ═══════════════════════════════════════════════════════════════════════════ */

function WidgetLogoMark() {
  return (
    <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 1px rgba(16,185,129,0.15), 0 4px 12px -4px rgba(16,185,129,0.3)' }}>
      <Image src="/icon-512x512.png" alt="VoiceAI Connect" width={34} height={34} style={{ width: 34, height: 34, objectFit: 'cover' }} />
    </div>
  );
}

function WidgetEyebrow({ children, color }: { children: string; color?: string }) {
  return <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500, color: color || 'rgba(255,255,255,0.25)', margin: 0 }}>{children}</p>;
}

function WidgetBtn({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${active ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`, background: active ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', color: active ? em : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: font, transition: 'all 0.15s' }}>
      {children}
    </button>
  );
}

function WidgetInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div>
      <WidgetEyebrow>{label}</WidgetEyebrow>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', marginTop: 7, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.025)', color: 'rgba(255,255,255,0.85)', fontSize: 13, outline: 'none', fontFamily: font, boxSizing: 'border-box' }}
        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.25)'; }}
        onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CSS ANIMATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const css = `
@keyframes wBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-3px)}}
@keyframes wSlide{from{transform:translateY(12px) scale(0.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
@keyframes wPulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.25)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
@keyframes wFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
`;

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SupportWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'landing' | 'gate' | 'faq' | 'chat' | 'escalation'>('chat');
  const [activeFAQ, setActiveFAQ] = useState<FAQItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [escName, setEscName] = useState('');
  const [escContact, setEscContact] = useState('');
  const [escMsg, setEscMsg] = useState('');
  const [escBusy, setEscBusy] = useState(false);
  const [escDone, setEscDone] = useState(false);
  // Stable id so a prospect's full back-and-forth groups into one inbox thread.
  const [sessionId] = useState(() => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`));
  const [escErr, setEscErr] = useState('');
  // Public FAQ-bot lead capture: name + email collected before the AI chat so
  // every conversation reaches the admin inbox with who it was.
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadErr, setLeadErr] = useState('');
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [pendingMsg, setPendingMsg] = useState('');
  const [isAllowedDomain, setIsAllowedDomain] = useState(false);
  const [hideForClientSurface, setHideForClientSurface] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streaming]);
  useEffect(() => { if (sessionStorage.getItem('w-t')) return; const t = setTimeout(() => setTeaser(true), 5000); return () => clearTimeout(t); }, []);
  useEffect(() => { const h = window.location.hostname; if (h === 'myvoiceaiconnect.com' || h === 'www.myvoiceaiconnect.com' || h === 'localhost') setIsAllowedDomain(true); }, []);
  useEffect(() => { const mq = window.matchMedia('(max-width: 1023px)'); const u = () => setIsNarrow(mq.matches); u(); mq.addEventListener('change', u); return () => mq.removeEventListener('change', u); }, []);

  // Never render inside the embedded signup widget or on any client-scoped
  // signup/auth surface. The embed iframe loads /signup on the platform origin,
  // so the domain check above passes, and /signup is not a dashboard route, so
  // without this gate the widget leaks the VoiceAI Connect brand into an
  // agency's white-label form. Gate on embed mode (the iframe) and on
  // agency-scoped signup/auth routes (a direct client-signup link). Agency
  // self-signup to the platform (no agency param, not embed) still shows it.
  // Recomputed on pathname change so in-iframe step navigation stays gated.
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const isEmbed = sp.get('embed') === 'true';
      const path = window.location.pathname;
      const isSignupFlow = path.startsWith('/signup') || path.startsWith('/auth');
      const isClientScoped = !!sp.get('agency');
      setHideForClientSurface(isEmbed || (isSignupFlow && isClientScoped));
    } catch { /* noop */ }
  }, [pathname]);

  // Restore a name/email captured earlier this browser session so a returning
  // visitor isn't re-asked before every chat.
  useEffect(() => {
    try { const raw = sessionStorage.getItem('w-lead'); if (raw) { const lead = JSON.parse(raw); if (lead && lead.n && lead.e) { setLeadName(lead.n); setLeadEmail(lead.e); setLeadCaptured(true); } } } catch { /* noop */ }
  }, []);

  const open = useCallback(() => { setIsOpen(true); setTeaser(false); sessionStorage.setItem('w-t', '1'); }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const goLanding = useCallback(() => { setView('landing'); setActiveFAQ(null); }, []);
  const goFAQ = useCallback((f: FAQItem) => { setActiveFAQ(f); setView('faq'); }, []);
  const goEsc = useCallback(() => { setView('escalation'); setEscDone(false); setEscErr(''); setEscName(''); setEscContact(''); setEscMsg(''); }, []);

  const send = useCallback(async (text?: string, bypassGate?: boolean) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    // Backstop gate: every path into the chat (landing input, FAQ input, quick
    // actions) must capture name + email first.
    if (!leadCaptured && !bypassGate) { setPendingMsg(msg); setView('gate'); return; }
    setInput('');
    const user: ChatMessage = { role: 'user', content: msg };
    const all = [...messages, user];
    setMessages(all);
    setStreaming(true);
    try {
      const res = await fetch('/api/widget/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, conversationHistory: all.slice(-10), sessionId }) });
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
  }, [input, messages, streaming, leadCaptured]);

  const goChat = useCallback((msg?: string) => {
    // Gate the AI chat behind a quick name + email capture so every public
    // conversation reaches the inbox with who it was, not just the text.
    if (!leadCaptured) { if (msg) setPendingMsg(msg); setView('gate'); return; }
    setView('chat');
    if (msg) send(msg);
    else setTimeout(() => inputRef.current?.focus(), 100);
  }, [send, leadCaptured]);

  const submitGate = useCallback(() => {
    const nm = leadName.trim(); const em2 = leadEmail.trim();
    if (!nm) { setLeadErr('Please enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em2)) { setLeadErr('Please enter a valid email so we can follow up.'); return; }
    try { sessionStorage.setItem('w-lead', JSON.stringify({ n: nm, e: em2 })); } catch { /* noop */ }
    setLeadErr('');
    setLeadCaptured(true);
    // Record who this visitor is as a leading row in the admin inbox thread,
    // so the public FAQ conversation shows a name + email, not just the chat.
    try { fetch('/api/widget/visitor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, name: nm, contact: em2 }) }); } catch { /* non-blocking */ }
    const pm = pendingMsg; setPendingMsg('');
    setView('chat');
    if (pm) setTimeout(() => send(pm, true), 0);
    else setTimeout(() => inputRef.current?.focus(), 100);
  }, [leadName, leadEmail, pendingMsg, send]);

  const doEsc = useCallback(async () => {
    if (!escName.trim() || !escContact.trim() || escBusy) return;
    setEscBusy(true);
    setEscErr('');
    const sum = messages.map(m => `${m.role === 'user' ? 'Visitor' : 'AI'}: ${m.content}`).join('\n');
    try {
      const res = await fetch('/api/widget/escalate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: escName.trim(), contact: escContact.trim(), message: escMsg.trim() || undefined, conversationSummary: sum || undefined }) });
      if (!res.ok) throw new Error('Failed to send');
      // Also stamp the prospect's identity onto this session's inbox thread, so a
      // callback request shows the name in the admin inbox (not just the SMS).
      try { fetch('/api/widget/visitor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, name: escName.trim(), contact: escContact.trim(), reason: 'Callback requested (talk to a person)' }) }); } catch { /* non-blocking */ }
      setEscDone(true);
    } catch {
      setEscErr('Something went wrong sending your message. Please email support@myvoiceaiconnect.com and we\'ll respond within one business day.');
    } finally {
      setEscBusy(false);
    }
  }, [escName, escContact, escMsg, escBusy, messages]);

  const qa = useCallback((a: typeof QUICK_ACTIONS[0]) => {
    if (a.href) { window.location.href = a.href; return; }
    const m = FAQ_DATA.find(f => f.question === a.prompt);
    m ? goFAQ(m) : goChat(a.prompt);
  }, [goFAQ, goChat]);

  // Hide on dashboard routes
  if (pathname.startsWith('/agency') || pathname.startsWith('/client') || pathname.startsWith('/cc') || pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/live')) return null;

  // Hide on focused sign-up / onboarding / auth flows. These are single-purpose
  // steps (pick a plan, name your agency, set a password) where a floating help
  // chat only clutters the screen; support lives on the marketing site instead.
  if (pathname.startsWith('/signup') || pathname.startsWith('/onboarding') || pathname.startsWith('/auth')) return null;
  if (pathname === '/interactive-demo' && isNarrow) return null;

  // Never leak into the embedded widget or a client-scoped signup/auth surface
  if (hideForClientSurface) return null;

  // Only show on VoiceAI Connect domains, not on agency marketing sites
  if (!isAllowedDomain) return null;

  return (
    <>
      <style>{css}</style>

      {/* Teaser: solid dark so it stays legible over the page's light sections */}
      {teaser && !isOpen && (
        <div style={{ position: 'fixed', bottom: 86, right: 20, maxWidth: 210, zIndex: 9998 }}>
          <div style={{ background: 'linear-gradient(180deg, #161616, #0c0c0c)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '11px 14px', fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, fontFamily: font, boxShadow: '0 16px 40px -10px rgba(0,0,0,0.6)' }}>
            Got questions about the platform?
            <button onClick={() => { setTeaser(false); sessionStorage.setItem('w-t', '1'); }} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>
          </div>
        </div>
      )}

      {/* FAB: the standard chat-launcher pattern. A solid green rounded-square button
          (not a circle) with a clean white chat-bubble-with-dots glyph, the same mark
          Intercom / Messenger / Crisp use. No gloss, no gimmicks. */}
      <button onClick={open} aria-label="Open support"
        style={{
          position: 'fixed', bottom: 20, right: 20, width: 58, height: 58, borderRadius: 17, border: 'none',
          background: '#10b981', cursor: 'pointer', display: isOpen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 24px -8px rgba(16,185,129,0.55), 0 2px 6px rgba(0,0,0,0.2)',
          transition: 'transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s', zIndex: 9999, color: '#ffffff',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 14px 30px -8px rgba(16,185,129,0.65), 0 3px 8px rgba(0,0,0,0.24)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 24px -8px rgba(16,185,129,0.55), 0 2px 6px rgba(0,0,0,0.2)'; }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <g transform="translate(24,0) scale(-1,1)">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h.01" />
            <path d="M12 10h.01" />
            <path d="M16 10h.01" />
          </g>
        </svg>
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
          <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: 'linear-gradient(180deg, rgba(16,185,129,0.03), transparent)' }}>
            <WidgetLogoMark />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: '#fafaf9', letterSpacing: '-0.01em' }}>VoiceAI Connect</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: em, display: 'inline-block', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
                <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>Online now</span>
              </div>
            </div>
            {view !== 'landing' && (
              <button onClick={goLanding} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', transition: 'background 0.15s', marginRight: 4 }}>
                <WIcon type="back" />
              </button>
            )}
            <button onClick={close} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', transition: 'background 0.15s' }}>
              <WIcon type="x" />
            </button>
          </div>

          {/* ── Landing ── */}
          {view === 'landing' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <p style={{ fontFamily: font, fontSize: 20, fontWeight: 500, color: '#fafaf9', letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0 }}>How can we help?</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 6, fontFamily: font }}>Instant answers about the platform, pricing, and setup.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
                {QUICK_ACTIONS.map(a => (
                  <button key={a.label} onClick={() => qa(a)} style={{ borderRadius: 14, padding: '14px 12px', cursor: 'pointer', textAlign: 'left', background: 'linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.006))', border: '1px solid rgba(255,255,255,0.06)', fontFamily: font, display: 'flex', flexDirection: 'column', gap: 3, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(16,185,129,0.04), rgba(16,185,129,0.01))'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.006))'; }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#fafaf9', letterSpacing: '-0.01em' }}>{a.label}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>{a.sub}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 24, marginBottom: 6 }}><WidgetEyebrow>Frequently asked</WidgetEyebrow></div>
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
              <div style={{ marginBottom: 10 }}><WidgetEyebrow color={em}>{activeFAQ.category}</WidgetEyebrow></div>
              <p style={{ fontFamily: font, fontSize: 17, fontWeight: 500, color: '#fafaf9', letterSpacing: '-0.01em', lineHeight: 1.25, margin: 0 }}>{activeFAQ.question}</p>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginTop: 14, fontFamily: font }}>{activeFAQ.answer}</p>
              <div style={{ marginTop: 24, borderRadius: 12, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', padding: 14 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontFamily: font }}>Was this helpful?</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <WidgetBtn active onClick={goLanding}>Yes, thanks</WidgetBtn>
                  <WidgetBtn onClick={() => goChat(`Follow-up about: ${activeFAQ.question}`)}>More questions</WidgetBtn>
                </div>
              </div>
            </div>
          )}

          {/* ── Lead gate (name + email before chatting) ── */}
          {view === 'gate' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <p style={{ fontFamily: font, fontSize: 17, fontWeight: 500, color: '#fafaf9', letterSpacing: '-0.01em', margin: 0 }}>Before we start</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 4, fontFamily: font }}>Add your name and email so a team member can follow up on anything the chat can&apos;t fully answer.</p>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <WidgetInput value={leadName} onChange={setLeadName} placeholder="Your name" label="Name" />
                <WidgetInput value={leadEmail} onChange={setLeadEmail} placeholder="you@email.com" label="Email" />
                {leadErr && (
                  <p style={{ fontSize: 12, lineHeight: 1.5, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', margin: 0, fontFamily: font }}>{leadErr}</p>
                )}
                <button onClick={submitGate} disabled={!leadName.trim() || !leadEmail.trim()}
                  style={{ padding: 11, borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 500, cursor: leadName.trim() && leadEmail.trim() ? 'pointer' : 'default', fontFamily: font, transition: 'all 0.15s', background: leadName.trim() && leadEmail.trim() ? em : 'rgba(255,255,255,0.04)', color: leadName.trim() && leadEmail.trim() ? '#050505' : 'rgba(255,255,255,0.15)', ...(leadName.trim() && leadEmail.trim() ? greenBtnText : {}) }}>
                  Start chat
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', fontFamily: font, margin: '18px 0 0' }}>We&apos;ll only use this to follow up on your questions.</p>
            </div>
          )}

          {/* ── Chat ── */}
          {view === 'chat' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ maxWidth: '85%', padding: '12px 15px', fontSize: 13, lineHeight: 1.6, fontFamily: font, alignSelf: 'flex-start', borderRadius: '14px 14px 14px 4px', background: 'linear-gradient(180deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))', border: '1px solid rgba(16,185,129,0.18)', color: 'rgba(255,255,255,0.82)' }}>
                  Hey there! Ask me anything about VoiceAI Connect, pricing, white-labeling, or getting your agency started. What can I help with?
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{
                  maxWidth: '85%', padding: '11px 14px', fontSize: 13, lineHeight: 1.6, fontFamily: font,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  ...(m.role === 'user' ? { borderRadius: '14px 14px 4px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.14)', color: 'rgba(255,255,255,0.85)' }
                    : { borderRadius: '14px 14px 14px 4px', background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)' }),
                }}>
                  {m.content || (streaming && i === messages.length - 1 ? '...' : '')}
                </div>
              ))}
              {streaming && messages[messages.length - 1]?.role === 'user' && (
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '11px 14px', width: 'fit-content', borderRadius: '14px 14px 14px 4px', background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {[0, 0.2, 0.4].map((d, j) => <span key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(16,185,129,0.4)', animation: `wBounce 1.2s infinite ${d}s` }} />)}
                </div>
              )}
              <div ref={endRef} />
              {messages.length >= 2 && !streaming && (
                <button onClick={goEsc} style={{ alignSelf: 'center', marginTop: 4, padding: '7px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', fontSize: 11, cursor: 'pointer', fontFamily: font, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = em; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.15)'; }}
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
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: em }}><WIcon type="check" /></div>
                  <p style={{ fontFamily: font, fontSize: 16, fontWeight: 500, color: '#fafaf9', margin: 0 }}>Message received</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 8, lineHeight: 1.5, fontFamily: font }}>A team member will follow up within one business day.</p>
                  <button onClick={goLanding} style={{ marginTop: 18, padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', fontFamily: font }}>Back to help</button>
                </div>
              ) : (
                <>
                  <p style={{ fontFamily: font, fontSize: 17, fontWeight: 500, color: '#fafaf9', letterSpacing: '-0.01em', margin: 0 }}>Talk to our team</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 4, fontFamily: font }}>We respond within one business day.</p>
                  <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <WidgetInput value={escName} onChange={setEscName} placeholder="Your name" label="Name" />
                    <WidgetInput value={escContact} onChange={setEscContact} placeholder="you@agency.com" label="Email or phone" />
                    <div>
                      <WidgetEyebrow>How can we help? (optional)</WidgetEyebrow>
                      <textarea
                        value={escMsg}
                        onChange={e => setEscMsg(e.target.value)}
                        placeholder="e.g. Please call me ASAP, or send a demo number I can try."
                        rows={3}
                        maxLength={1000}
                        style={{ width: '100%', marginTop: 7, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.025)', color: 'rgba(255,255,255,0.85)', fontSize: 13, outline: 'none', fontFamily: font, boxSizing: 'border-box', resize: 'none' }}
                        onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(16,185,129,0.25)'; }}
                        onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      />
                    </div>
                    {escErr && (
                      <p style={{ fontSize: 12, lineHeight: 1.5, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', margin: 0, fontFamily: font }}>{escErr}</p>
                    )}
                    <button onClick={doEsc} disabled={!escName.trim() || !escContact.trim() || escBusy}
                      style={{ padding: 11, borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 500, cursor: escName.trim() && escContact.trim() ? 'pointer' : 'default', fontFamily: font, transition: 'all 0.15s', background: escName.trim() && escContact.trim() ? em : 'rgba(255,255,255,0.04)', color: escName.trim() && escContact.trim() ? '#050505' : 'rgba(255,255,255,0.15)', ...(escName.trim() && escContact.trim() ? greenBtnText : {}) }}>
                      {escBusy ? 'Sending...' : escErr ? 'Try again' : 'Send message'}
                    </button>
                  </div>
                  <p style={{ marginTop: 18, fontSize: 11, color: 'rgba(255,255,255,0.18)', fontFamily: font, margin: '18px 0 0' }}>
                    Or email <a href="mailto:support@myvoiceaiconnect.com" style={{ color: 'rgba(16,185,129,0.5)', textDecoration: 'none' }}>support@myvoiceaiconnect.com</a>
                  </p>
                </>
              )}
            </div>
          )}

          {/* Input bar: hidden on escalation and the lead gate */}
          {view !== 'escalation' && view !== 'gate' && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything..."
                style={{ flex: 1, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', fontSize: 13, background: 'rgba(255,255,255,0.025)', color: 'rgba(255,255,255,0.85)', outline: 'none', fontFamily: font }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.25)'; if (view === 'landing') goChat(); }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)'; }} />
              <button onClick={() => send()} disabled={!input.trim() || streaming}
                style={{ width: 34, height: 34, borderRadius: 10, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.15s', background: input.trim() ? em : 'rgba(255,255,255,0.04)', color: input.trim() ? '#04120f' : 'rgba(255,255,255,0.15)' }}>
                <WIcon type="up" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}