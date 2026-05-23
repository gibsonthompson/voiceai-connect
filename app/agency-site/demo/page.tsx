'use client';

import { useState, useEffect } from 'react';
import '@/styles/marketing.css';

// ============================================================================
// TYPES
// ============================================================================
interface Agency {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscription_status: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  website_theme: 'light' | 'dark' | 'auto' | null;
  logo_background_color: string | null;
  demo_phone: string | null;
  demo_phone_number: string | null;
  plan_type: string | null;
  price_starter: number | null;
  support_email: string | null;
  company_tagline: string | null;
  display_currency: string | null;
  marketing_domain: string | null;
  domain_verified: boolean | null;
}

const PLATFORM_DEMO_PHONE = '(470) 487-4561';

// ============================================================================
// HELPERS
// ============================================================================
function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return phone;
}

function hexToRgbString(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.45;
}

function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function getCachedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try { const c = sessionStorage.getItem('agency_theme'); if (c === 'dark') return 'dark'; } catch {}
  return 'light';
}

function setFavicon(url: string) {
  const existing = document.querySelectorAll("link[rel*='icon']");
  existing.forEach(l => l.remove());
  const link = document.createElement('link');
  link.rel = 'icon'; link.type = 'image/png'; link.href = url;
  document.head.appendChild(link);
}

function resolveHomepageUrl(agency: Agency): string {
  const domain = agency.marketing_domain?.trim();
  if (!domain || agency.domain_verified !== true) return '/';
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname.replace(/^www\./, '');
    if (currentHost === domain.replace(/^www\./, '')) return '/';
  }
  return `https://${domain}`;
}

// ============================================================================
// SVG ICONS — no inline sizing, parent controls dimensions
// ============================================================================
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const HeadphonesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const MessageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

// ============================================================================
// ICON WRAPPER — constrains SVG to a specific size
// ============================================================================
function Icon({ children, size = '1.5rem', color }: { children: React.ReactNode; size?: string; color?: string }) {
  return <div style={{ width: size, height: size, flexShrink: 0, color, display: 'inline-flex' }}>{children}</div>;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function DemoPage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callStarted, setCallStarted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const host = window.location.hostname;
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const cacheKey = `agency_site_${host}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < 5 * 60 * 1000) { setAgency(data); setLoading(false); return; }
          } catch {}
        }
        const res = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
        if (!res.ok) { setError('Site not found'); setLoading(false); return; }
        const d = await res.json();
        if (!d.agency || ['suspended', 'deleted'].includes(d.agency.status)) { setError('Site not available'); setLoading(false); return; }
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: d.agency, ts: Date.now() })); } catch {}
        setAgency(d.agency);
      } catch { setError('Failed to load'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!agency) return;
    if (agency.logo_url) setFavicon(agency.logo_url);
    document.title = `Try ${agency.name} — Live AI Demo`;
    const theme = agency.website_theme;
    document.documentElement.style.backgroundColor = theme === 'dark' ? '#0f0f0f' : '#ffffff';
    return () => { document.documentElement.style.backgroundColor = ''; };
  }, [agency]);

  if (loading) {
    const t = getCachedTheme();
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: t === 'dark' ? '#0f0f0f' : '#fff' }}>
        <div style={{ width: 40, height: 40, border: '3px solid transparent', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}><h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{error || 'Not found'}</h1><p style={{ color: '#6b7280' }}>This site is not available.</p></div>
      </div>
    );
  }

  const pc = agency.primary_color || '#10b981';
  const sc = agency.secondary_color || adjustColor(pc, -15);
  const ac = agency.accent_color || '#34d399';
  const theme = agency.website_theme || 'light';
  const isDark = theme === 'dark';
  const pcLight = isLightColor(pc);
  const textOnPrimary = pcLight ? '#1f2937' : '#ffffff';
  const rawDemo = agency.demo_phone || agency.demo_phone_number || PLATFORM_DEMO_PHONE;
  const demoPhone = formatPhoneDisplay(rawDemo);
  const demoHref = `tel:+1${rawDemo.replace(/\D/g, '')}`;
  const cs = agency.display_currency === 'GBP' ? '£' : agency.display_currency === 'EUR' ? '€' : '$';
  const lowestPrice = agency.price_starter ? Math.round(agency.price_starter / 100) : 49;
  const homeUrl = resolveHomepageUrl(agency);

  const themeVars = {
    '--primary-color': pc,
    '--primary-hover': sc,
    '--accent-color': ac,
    '--primary-rgb': hexToRgbString(pc),
    '--accent-rgb': hexToRgbString(ac),
    '--primary-text-color': textOnPrimary,
  } as React.CSSProperties;

  const logoBgColor = agency.logo_background_color && agency.logo_background_color !== '#000000' && agency.logo_background_color !== '#000'
    ? agency.logo_background_color : 'transparent';

  const steps = [
    { icon: <PhoneIcon />, title: 'Call the number below', desc: 'Our AI receptionist will pick up instantly — no waiting, no menus.' },
    { icon: <MicIcon />, title: 'Tell it about your business', desc: 'Share your business name, type, and what you do. The AI will adapt to you on the spot.' },
    { icon: <HeadphonesIcon />, title: 'Experience your AI receptionist', desc: 'Ask it questions as if you were a customer calling your business. It answers like a trained receptionist.' },
    { icon: <CalendarIcon />, title: 'Watch it book an appointment', desc: 'Ask to schedule something — the AI checks availability and books it to a real calendar in real time.' },
  ];

  const benefits = [
    'Answers every call 24/7 — no missed customers',
    'Books appointments to Google Calendar automatically',
    'Sends you an instant text summary after each call',
    'Speaks English and Spanish — auto-detects the language',
    'Blocks spam and robocalls automatically',
    'Handles unlimited calls at the same time',
  ];

  return (
    <div className={`marketing-page theme-${theme}`} style={themeVars}>

      {/* ── NAV ── */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <a href={homeUrl} className="logo">
              {agency.logo_url ? (
                <div className="logo-wrapper">
                  <img src={agency.logo_url} alt={agency.name} className="logo-image" style={{ backgroundColor: logoBgColor }} />
                </div>
              ) : (
                <span className="logo-text">{agency.name}</span>
              )}
            </a>
            <div className="nav-actions">
              <a href={homeUrl} className="btn-ghost btn-small">← Back to site</a>
              <a href="/get-started" className="btn-primary btn-small">Start Free Trial</a>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO — Phone number is the entire focus ── */}
      <section className="hero" style={{ paddingBottom: '2rem' }}>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>Live AI Demo — Call Now</span>
            </div>

            <h1 className="hero-title" style={{ marginBottom: '0.75rem' }}>
              <span style={{ display: 'block' }}>Hear Your AI</span>
              <span style={{ display: 'block' }}>Receptionist in Action</span>
            </h1>

            <p className="hero-subtitle" style={{ maxWidth: '560px', margin: '0 auto 1.5rem' }}>
              Call the number below and experience exactly how {agency.name} handles calls for your business. No signup required — just call.
            </p>

            {/* Demo phone — the main CTA */}
            <div style={{
              maxWidth: '480px', margin: '0 auto', borderRadius: 'var(--radius-lg)',
              background: `linear-gradient(135deg, ${pc} 0%, ${sc} 100%)`,
              padding: '2rem', boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)',
              textAlign: 'center', color: textOnPrimary,
            }}>
              <Icon size="3rem" color={textOnPrimary}><HeadphonesIcon /></Icon>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem', marginTop: '0.75rem', opacity: 0.85, color: textOnPrimary }}>
                Call now — it&apos;s free
              </p>
              <a
                href={demoHref}
                onClick={() => setCallStarted(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, fontFamily: 'var(--font-primary)',
                  padding: '0.875rem 1.5rem', borderRadius: 'var(--radius-full)', minHeight: '56px',
                  background: pcLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                  color: textOnPrimary, textDecoration: 'none', transition: 'all 0.2s',
                }}
              >
                <Icon size="1.5rem"><PhoneIcon /></Icon>
                {demoPhone}
              </a>
              <p style={{ fontSize: '0.813rem', marginTop: '0.75rem', opacity: 0.7, color: textOnPrimary, marginBottom: 0 }}>
                Takes 30 seconds. Your phone will ring with a live demo.
              </p>
            </div>

            {/* Trust items */}
            <div className="trust-bar" style={{ marginTop: '1.5rem' }}>
              <div className="trust-item">✓ No signup required</div>
              <div className="trust-item">✓ Free to call</div>
              <div className="trust-item">✓ Works on any phone</div>
            </div>
          </div>
        </div>
        <div className="hero-bg"><div className="hero-gradient"></div><div className="hero-pattern"></div></div>
      </section>

      {/* ── HOW THE DEMO WORKS ── */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>What Happens When You Call</h2>
            <p>The demo takes about 60 seconds. Here&apos;s what to expect.</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{i + 1}</div>
                <div className="step-icon"><Icon size="2.5rem">{step.icon}</Icon></div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ── */}
      <section className="features" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="container">
          <div className="section-header">
            <h2>What Your Business Gets</h2>
            <p>Everything included when you sign up — starting at {cs}{lowestPrice}/month.</p>
          </div>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            {benefits.map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 0',
                borderBottom: i < benefits.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}>
                <Icon size="1.25rem" color="var(--success-color)"><CheckIcon /></Icon>
                <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-dark)', fontWeight: 500 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALL-TO-ACTION BASED ON STATE ── */}
      <section className="final-cta" style={{ background: `linear-gradient(135deg, ${pc} 0%, ${sc} 100%)` }}>
        <div className="container">
          <div className="final-cta-content">
            {callStarted ? (
              <>
                <h2 style={{ color: textOnPrimary }}>Ready to Get Started?</h2>
                <p className="final-cta-text" style={{ color: textOnPrimary, opacity: 0.85 }}>
                  You just experienced what every caller to your business will hear — 24/7, no missed calls, no voicemail.
                  Start your 7-day free trial and have your own AI receptionist live in under 10 minutes.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '1.5rem' }}>
                  <a href="/get-started" className="btn-large" style={{
                    background: pcLight ? sc : 'white',
                    color: pcLight ? 'white' : pc,
                    borderRadius: 'var(--radius-full)', fontWeight: 700, textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    Start Your 7-Day Free Trial
                    <Icon size="1.25rem"><ArrowRightIcon /></Icon>
                  </a>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <span style={{ color: textOnPrimary, fontWeight: 500, fontSize: '0.875rem' }}>✓ Setup in 10 minutes</span>
                    <span style={{ color: textOnPrimary, fontWeight: 500, fontSize: '0.875rem' }}>✓ No credit card required</span>
                    <span style={{ color: textOnPrimary, fontWeight: 500, fontSize: '0.875rem' }}>✓ Cancel anytime</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ color: textOnPrimary }}>Still Haven&apos;t Called?</h2>
                <p className="final-cta-text" style={{ color: textOnPrimary, opacity: 0.85 }}>
                  The best way to understand what {agency.name} does is to experience it yourself. Call the demo — it takes 30 seconds.
                </p>
                <div className="final-cta-boxes">
                  <div className="cta-box-primary">
                    <h3>
                      <Icon size="1.5rem"><HeadphonesIcon /></Icon>
                      Try It Right Now
                    </h3>
                    <a href={demoHref} onClick={() => setCallStarted(true)} className="cta-phone-large" style={{ color: pc }}>
                      <Icon size="1.5rem"><PhoneIcon /></Icon>
                      {demoPhone}
                    </a>
                    <p>&quot;Hear it work before you sign up&quot;</p>
                  </div>
                  <div className="cta-box-divider" style={{ color: textOnPrimary, opacity: 0.6 }}>or</div>
                  <div className="cta-box-secondary" style={{ background: pcLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)' }}>
                    <a href="/get-started" className="btn-large btn-primary" style={{
                      background: pcLight ? sc : 'white', color: pcLight ? 'white' : pc,
                    }}>
                      Start Your 7-Day Free Trial
                    </a>
                    <div className="cta-benefits">
                      <span style={{ color: textOnPrimary }}>✓ Setup in 10 minutes</span>
                      <span style={{ color: textOnPrimary }}>✓ No credit card required</span>
                      <span style={{ color: textOnPrimary }}>✓ Cancel anytime</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <a href={homeUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-dark)', textDecoration: 'none' }}>
              {agency.logo_url ? (
                <img src={agency.logo_url} alt={agency.name} style={{ height: '48px', borderRadius: '8px', backgroundColor: logoBgColor }} />
              ) : (
                <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: '1.25rem' }}>{agency.name}</span>
              )}
            </a>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', maxWidth: '400px', margin: '0 auto 0.75rem' }}>
              Professional AI that answers every call, books appointments, and sends you instant summaries — 24/7.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.813rem' }}>
              <a href={homeUrl} style={{ color: 'var(--text-medium)' }}>Home</a>
              <a href="/get-started" style={{ color: 'var(--text-medium)' }}>Get Started</a>
              <a href="/privacy" style={{ color: 'var(--text-medium)' }}>Privacy</a>
              <a href="/terms" style={{ color: 'var(--text-medium)' }}>Terms</a>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '1rem' }}>
              © {new Date().getFullYear()} {agency.name}. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}