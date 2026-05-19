'use client';

import { useState, useEffect, useMemo } from 'react';
import { MarketingConfig, defaultMarketingConfig } from '@/types/marketing';
import { getCurrencySymbol } from '@/lib/currency-symbols';
import '@/styles/marketing.css';

// ============================================================================
// COLOR UTILITIES (same as MarketingPage)
// ============================================================================
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace(/^#/, '');
  const fullHex = cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex;
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}
function hexToRgbString(hex: string): string { const rgb = hexToRgb(hex); return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '18, 32, 146'; }
function getLuminance(hex: string): number { const rgb = hexToRgb(hex); if (!rgb) return 0.5; const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map(c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs; }
function isLightColor(hex: string): boolean { return getLuminance(hex) > 0.45; }
function getContrastTextColor(bgHex: string): string { return isLightColor(bgHex) ? '#1f2937' : '#ffffff'; }

// ============================================================================
// TYPES
// ============================================================================
interface Agency {
  id: string; name: string; slug: string; status: string; subscription_status: string | null;
  logo_url: string | null; primary_color: string; secondary_color: string; accent_color: string;
  company_tagline: string | null; website_theme: 'light' | 'dark' | 'auto' | null;
  support_email: string | null; support_phone: string | null; plan_type: string | null;
  logo_background_color: string | null;
}

// ============================================================================
// FAQ DATA — end-client (business owner) perspective
// ============================================================================
const faqCategories = [
  {
    name: 'Getting Started',
    faqs: [
      { q: 'What is an AI receptionist?', a: 'An AI receptionist is a virtual phone agent that answers your business calls 24/7. It sounds natural, can answer questions about your business, take messages, book appointments to your Google Calendar, and send you a text summary after every call. It works just like a human receptionist—except it never misses a call, handles unlimited simultaneous calls, and costs a fraction of the price.' },
      { q: 'How do I get set up?', a: 'Setup takes about 10 minutes. You\'ll enter your business name, industry, phone number, and some details about your services and hours. If you have a website, the AI can scan it automatically to learn about your business. Once you\'re set up, you just forward your existing phone number to your new AI number and you\'re live.' },
      { q: 'Do I need a website for this to work?', a: 'No. All you need is a phone number. You can forward your existing business line to your AI number, or use the AI number directly on your website, business cards, and ads. If you do have a website, the AI can scan it to learn about your business—but it\'s completely optional.' },
      { q: 'What information do I need to provide?', a: 'Just the basics: your business name, industry, phone number, and information about your services, hours, and common questions. Everything is entered through your dashboard—no files to send. The more detail you provide about your services and FAQs, the better the AI handles calls.' },
    ],
  },
  {
    name: 'How It Works',
    faqs: [
      { q: 'How does the AI answer my calls?', a: 'When someone calls your AI number, the system answers within milliseconds. The AI greets them with your custom message, has a natural conversation, answers questions using your knowledge base, captures their information, and can book appointments. After the call, you get a text with the summary.' },
      { q: 'How natural does the AI sound?', a: 'Very natural. We use premium voice technology that sounds virtually indistinguishable from a human. The AI uses natural speech patterns, appropriate pauses, and handles interruptions gracefully. Most callers don\'t realize they\'re talking to an AI.' },
      { q: 'Does the AI work in Spanish?', a: 'Yes—automatically, with no setup required. The AI detects when a caller speaks Spanish and switches to Spanish for the entire conversation. It collects all information in Spanish and sends you the summary in English. This works out of the box on every plan.' },
      { q: 'Can the AI handle multiple calls at the same time?', a: 'Yes—unlimited simultaneous calls. Unlike a human receptionist who can only answer one call at a time, the AI handles as many concurrent calls as needed. No busy signals, no hold music, no missed calls during your busiest hours.' },
      { q: 'Is the AI available 24/7?', a: 'Yes. The AI answers calls 24 hours a day, 7 days a week, 365 days a year—nights, weekends, and holidays. You can also set different behaviors for after-hours, like a different greeting or message-only mode.' },
      { q: 'Does the AI block spam and robocalls?', a: 'Yes—automatically. The AI detects telemarketers, robocalls, and solicitors and ends those calls immediately. Spam calls don\'t count against your monthly limit, and you get a notification when one is blocked.' },
    ],
  },
  {
    name: 'Call Forwarding & Setup',
    faqs: [
      { q: 'How do I forward my calls to the AI?', a: 'The simplest method: on your phone, dial *72 followed by your AI phone number and press call. You\'ll hear a confirmation tone. To turn it off later, dial *73. This works on AT&T, Verizon, T-Mobile, and most landline providers.' },
      { q: 'Can I forward calls only when I don\'t answer?', a: 'Yes. You can set up conditional forwarding so your phone rings first, and if you don\'t pick up, the call goes to the AI. We also offer a built-in "Fallback" mode where the AI tries your phone first, and if you don\'t answer, the AI takes over—no carrier settings needed.' },
      { q: 'What are the forwarding codes for my carrier?', a: 'AT&T: *72 to activate, *73 to deactivate. Verizon: *72 to activate, *73 to deactivate. T-Mobile: *72 to activate, *73 to deactivate (or use the T-Mobile app). Spectrum/landline: *72 to activate, *73 to deactivate. For any other carrier, call their support and ask to set up call forwarding to your AI number.' },
      { q: 'Can I turn forwarding on and off?', a: 'Yes. Dial *73 to stop forwarding and answer calls yourself. Dial *72 + your AI number to start forwarding again. Many business owners forward when they\'re on a job or busy, and answer directly when they\'re available.' },
    ],
  },
  {
    name: 'Appointments & Booking',
    faqs: [
      { q: 'How does appointment booking work?', a: 'The AI connects to your Google Calendar. When a caller wants to book, it checks your real-time availability, offers open time slots, collects the caller\'s information, and creates the event automatically. The appointment shows up in your calendar instantly with the caller\'s name, phone, and reason for the visit.' },
      { q: 'Can I set different rules for different services?', a: 'Yes. From your dashboard, you can define services with individual durations (e.g., 30 minutes for a cleaning, 60 minutes for a deep clean), buffer time between appointments, and booking rules per service. Some services can be booked directly by the AI, others can require office confirmation first.' },
      { q: 'Can callers request a specific staff member?', a: 'Yes. You can add staff members with names and roles in your dashboard. When booking, the AI asks if the caller has a preferred provider and includes their name in the appointment details.' },
      { q: 'What if I don\'t want the AI to book directly?', a: 'You can set booking mode to "collect request." The AI gathers the caller\'s name, phone, preferred time, and what they need—then lets them know your office will call to confirm. No calendar events are created until you approve. This is popular for medical, legal, and high-touch businesses.' },
      { q: 'Does it work with calendars other than Google?', a: 'Google Calendar is the primary integration. Since Google Calendar syncs with most CRMs and scheduling tools (HubSpot, Calendly, etc.), appointments flow through automatically to your connected systems.' },
    ],
  },
  {
    name: 'Your Dashboard',
    faqs: [
      { q: 'What can I see in my dashboard?', a: 'Your dashboard shows everything: call recordings you can play back, word-for-word transcripts, AI-generated summaries, a contact list of everyone who\'s called, and analytics on call volume and trends. You can manage your services, staff, business hours, and knowledge base all from one place.' },
      { q: 'How do text notifications work?', a: 'Immediately after each call, you get a text with who called, why they called, and how urgent it is. You can see at a glance whether you need to call back now or if it can wait.' },
      { q: 'Can I customize what the AI knows about my business?', a: 'Yes. Your dashboard has a "My Business" section where you manage services and pricing, staff members, business hours, and a knowledge base with FAQs and additional info. You also have an "AI Agent" section to change the voice, greeting, conversation tone, and call-handling rules.' },
      { q: 'Is there a mobile app?', a: 'The dashboard is fully mobile-friendly. You can add it to your home screen for an app-like experience. Text and email notifications work on all devices, so you\'re always in the loop even without opening the dashboard.' },
      { q: 'Can I export my call data?', a: 'Yes. You can export call logs, contacts, and analytics as CSV files directly from your dashboard.' },
    ],
  },
  {
    name: 'Call Handling',
    faqs: [
      { q: 'Can the AI transfer urgent calls to me?', a: 'Yes. You configure transfer rules—for example, transfer immediately if someone mentions an emergency or a specific keyword. If you don\'t answer the transfer, the AI stays on the line and takes a message instead of sending the caller to voicemail.' },
      { q: 'What happens if the AI can\'t answer a question?', a: 'It handles it gracefully: "I don\'t have that specific information, but I\'d be happy to have someone call you back with the details." Then you get a text summary so you know exactly what to address. The AI never makes up answers.' },
      { q: 'Can the AI recognize returning callers?', a: 'Yes. With caller recognition enabled, the AI identifies returning callers by their phone number and greets them by name. It also references their previous interactions so the conversation feels personal.' },
      { q: 'What happens after hours?', a: 'You can configure after-hours behavior separately. The AI can use a different greeting, let callers know you\'re closed and when you reopen, take messages, and still handle urgent transfers if needed.' },
    ],
  },
  {
    name: 'Medical & HIPAA',
    faqs: [
      { q: 'Is this HIPAA compliant for medical practices?', a: 'Yes. A HIPAA mode can be enabled that disables call recording storage, forces all appointments into "collect request" mode (the AI gathers name, phone, and general reason for the visit only), and prevents storage of clinical details. The AI is trained to redirect any specific medical questions to the provider.' },
      { q: 'What information does the AI collect on patient calls?', a: 'In HIPAA mode, only scheduling information: the caller\'s name, phone number, whether they\'re a new or existing patient, and a general reason for the visit (e.g., "checkup," "follow-up"). If a caller shares medical details, the AI redirects: "Our provider will discuss that at your appointment."' },
      { q: 'How does the AI handle medical emergencies?', a: 'The AI recognizes emergency language and immediately directs callers to call 911 or go to the nearest emergency room. It does not provide medical advice. For urgent but non-emergency situations, it takes the caller\'s information and notifies you immediately by text.' },
      { q: 'Can the AI handle insurance questions?', a: 'Yes, if you add your accepted carriers to the knowledge base. The AI can answer "Do you accept Blue Cross?" but redirects specific coverage questions: "Coverage varies by plan—our billing team can verify your benefits before your visit."' },
    ],
  },
  {
    name: 'Pricing & Billing',
    faqs: [
      { q: 'How much does this cost?', a: 'Pricing depends on the plan your provider offers. Most businesses pay between $49-299/month for 24/7 AI receptionist coverage including call recordings, transcripts, AI summaries, text notifications, and Google Calendar booking. Contact us for current pricing.' },
      { q: 'Is there a free trial?', a: 'Yes! New accounts include a free trial period so you can experience the AI receptionist with real calls before committing. No credit card is required to start.' },
      { q: 'What happens if I go over my call limit?', a: 'You\'ll be notified when you\'re approaching your limit. Depending on your plan, you can upgrade mid-cycle or pay a small per-call overage fee. No surprise bills—you\'ll always know before it happens.' },
      { q: 'Can I cancel anytime?', a: 'Yes. There are no long-term contracts or cancellation fees. You can cancel from your dashboard settings at any time.' },
    ],
  },
  {
    name: 'Security & Privacy',
    faqs: [
      { q: 'Is my data secure?', a: 'Yes. All data is encrypted at rest and in transit. Call recordings and transcripts are stored securely and only accessible to you. We follow healthcare-grade privacy practices and never sell or share your call data.' },
      { q: 'Are calls recorded?', a: 'Yes, by default every call is recorded and available in your dashboard. If you need recordings disabled (for HIPAA or other compliance reasons), that can be configured per account.' },
      { q: 'Is my call data used to train AI?', a: 'No. Your call recordings, transcripts, and conversation data are never used to train AI models. Your data stays private.' },
    ],
  },
];

// ============================================================================
// AGENCY FAQ PAGE
// ============================================================================
export default function AgencyFAQPage() {
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgency() {
      try {
        const host = window.location.hostname;
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const cacheKey = `agency_site_${host}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < 5 * 60 * 1000) {
              setAgency(data);
              setLoading(false);
              return;
            }
          } catch {}
        }
        const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        if (!response.ok) { setError('Site not found'); setLoading(false); return; }
        const data = await response.json();
        if (!data.agency || ['suspended', 'deleted'].includes(data.agency.status)) { setError('Site not available'); setLoading(false); return; }
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: data.agency, ts: Date.now() })); } catch {}
        setAgency(data.agency);
      } catch { setError('Failed to load site'); }
      finally { setLoading(false); }
    }
    loadAgency();
  }, []);

  const filteredCategories = useMemo(() => {
    let cats = faqCategories;
    if (activeCategory) cats = cats.filter(c => c.name === activeCategory);
    if (!searchQuery.trim()) return cats;
    const query = searchQuery.toLowerCase();
    return cats.map(cat => ({
      ...cat,
      faqs: cat.faqs.filter(f => f.q.toLowerCase().includes(query) || f.a.toLowerCase().includes(query)),
    })).filter(cat => cat.faqs.length > 0);
  }, [searchQuery, activeCategory]);

  const totalQuestions = faqCategories.reduce((sum, cat) => sum + cat.faqs.length, 0);

  if (loading) {
    const bg = (() => { try { return sessionStorage.getItem('agency_theme') === 'dark' ? '#0f0f0f' : '#ffffff'; } catch { return '#ffffff'; } })();
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: bg }}>
        <div style={{ width: 40, height: 40, border: '3px solid transparent', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{error || 'Site not found'}</h1>
          <p style={{ color: '#6b7280' }}>This site is not available.</p>
        </div>
      </div>
    );
  }

  const primaryColor = agency.primary_color || '#10b981';
  const primaryRgb = hexToRgbString(primaryColor);
  const accentColor = agency.accent_color || '#34d399';
  const accentRgb = hexToRgbString(accentColor);
  const theme = agency.website_theme || 'light';
  const isDark = theme === 'dark';

  const themeStyle = {
    '--primary-color': primaryColor,
    '--primary-hover': agency.secondary_color || primaryColor,
    '--accent-color': accentColor,
    '--primary-rgb': primaryRgb,
    '--accent-rgb': accentRgb,
    '--primary-text-color': getContrastTextColor(primaryColor),
  } as React.CSSProperties;

  const bg = isDark ? '#0f0f0f' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1f2937';
  const textSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb';
  const inputBg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const pillActiveBg = isDark ? '#ffffff' : '#1f2937';
  const pillActiveText = isDark ? '#000000' : '#ffffff';
  const pillBg = 'transparent';
  const pillText = textSecondary;

  return (
    <div className={`marketing-page theme-${theme}`} style={{ ...themeStyle, background: bg, minHeight: '100vh', fontFamily: 'var(--font-primary, system-ui, sans-serif)' }}>

      {/* NAV */}
      <nav style={{ borderBottom: `1px solid ${borderColor}`, padding: '1rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            {agency.logo_url ? (
              <img src={agency.logo_url} alt={agency.name} style={{ height: 32 }} />
            ) : (
              <span style={{ fontWeight: 600, fontSize: '1.1rem', color: textPrimary }}>{agency.name}</span>
            )}
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <a href="/" style={{ fontSize: '0.875rem', color: textSecondary, textDecoration: 'none' }}>Home</a>
            <a href="/#pricing" style={{ fontSize: '0.875rem', color: textSecondary, textDecoration: 'none' }}>Pricing</a>
            <a href="/faq" style={{ fontSize: '0.875rem', color: primaryColor, fontWeight: 600, textDecoration: 'none' }}>FAQ</a>
            <a href="/get-started" className="btn-primary" style={{ fontSize: '0.813rem', padding: '0.5rem 1.25rem', borderRadius: '999px', textDecoration: 'none' }}>Start Free Trial</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '4rem 0 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: textPrimary, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '1rem', color: textSecondary, marginTop: '1rem', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            {totalQuestions} answers to help you get the most out of your AI receptionist.
          </p>

          {/* Search */}
          <div style={{ marginTop: '2rem', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', position: 'relative' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search questions…"
              style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', borderRadius: 999, border: `1px solid ${borderColor}`, background: inputBg, color: textPrimary, fontSize: '0.875rem', outline: 'none' }}
            />
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section style={{ borderTop: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, padding: '0.75rem 0', position: 'sticky', top: 0, zIndex: 30, background: bg, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{ padding: '0.4rem 1rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${activeCategory === null ? pillActiveBg : borderColor}`, background: activeCategory === null ? pillActiveBg : pillBg, color: activeCategory === null ? pillActiveText : pillText, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            All ({totalQuestions})
          </button>
          {faqCategories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
              style={{ padding: '0.4rem 1rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${activeCategory === cat.name ? pillActiveBg : borderColor}`, background: activeCategory === cat.name ? pillActiveBg : pillBg, color: activeCategory === cat.name ? pillActiveText : pillText, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {cat.name} ({cat.faqs.length})
            </button>
          ))}
        </div>
      </section>

      {/* FAQ CONTENT */}
      <section style={{ padding: '3rem 0 4rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 1.5rem' }}>
          {filteredCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p style={{ fontSize: '1.125rem', color: textSecondary }}>No matches for &ldquo;{searchQuery}&rdquo;</p>
              <p style={{ fontSize: '0.813rem', color: textMuted, marginTop: '0.5rem' }}>Try a broader search term.</p>
            </div>
          ) : (
            filteredCategories.map(cat => (
              <div key={cat.name} style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: textPrimary, marginBottom: '1rem', letterSpacing: '-0.01em' }}>{cat.name}</h2>
                <div>
                  {cat.faqs.map((faq, i) => (
                    <details key={i} className="faq-item" style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <summary style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', padding: '1.125rem 0', cursor: 'pointer', listStyle: 'none' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: textPrimary, lineHeight: 1.4 }}>{faq.q}</span>
                        <span style={{ color: textMuted, flexShrink: 0, fontSize: '1.25rem', fontWeight: 300, marginTop: '0.1rem', transition: 'transform 0.2s' }} className="faq-icon">+</span>
                      </summary>
                      <div style={{ paddingBottom: '1.125rem', paddingRight: '2rem' }}>
                        <p style={{ fontSize: '0.875rem', color: textSecondary, lineHeight: 1.7 }}>{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '4rem 0', borderTop: `1px solid ${borderColor}`, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: textPrimary, letterSpacing: '-0.02em' }}>Still have questions?</h2>
          <p style={{ fontSize: '0.9375rem', color: textSecondary, marginTop: '0.75rem' }}>
            {agency.support_email ? (
              <>Reach out to <a href={`mailto:${agency.support_email}`} style={{ color: primaryColor, fontWeight: 600 }}>{agency.support_email}</a> and we&apos;ll get back to you within one business day.</>
            ) : (
              <>Contact us and we&apos;ll get back to you within one business day.</>
            )}
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/get-started" className="btn-primary" style={{ padding: '0.75rem 2rem', borderRadius: 999, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>Start Free Trial</a>
            {agency.support_phone && (
              <a href={`tel:${agency.support_phone.replace(/\D/g, '')}`} style={{ padding: '0.75rem 2rem', borderRadius: 999, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', border: `1px solid ${borderColor}`, color: textPrimary }}>Call Us</a>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${borderColor}`, padding: '2rem 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {agency.logo_url ? <img src={agency.logo_url} alt={agency.name} style={{ height: 24 }} /> : <span style={{ fontWeight: 600, color: textPrimary }}>{agency.name}</span>}
          </div>
          <p style={{ fontSize: '0.75rem', color: textMuted }}>&copy; {new Date().getFullYear()} {agency.name}. All rights reserved.</p>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <a href="/privacy" style={{ fontSize: '0.75rem', color: textMuted, textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" style={{ fontSize: '0.75rem', color: textMuted, textDecoration: 'none' }}>Terms</a>
            {agency.support_email && <a href={`mailto:${agency.support_email}`} style={{ fontSize: '0.75rem', color: textMuted, textDecoration: 'none' }}>Contact</a>}
          </div>
        </div>
      </footer>
    </div>
  );
}
