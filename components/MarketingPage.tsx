// components/MarketingPage.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MarketingConfig, defaultMarketingConfig } from '@/types/marketing';
import '@/styles/marketing.css';

// ============================================================================
// COLOR UTILITIES
// ============================================================================
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace(/^#/, '');
  const fullHex = cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex;
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

/** Returns "r, g, b" string for use in CSS rgba(var(--x), alpha) */
function hexToRgbString(hex: string): string {
  const rgb = hexToRgb(hex);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '18, 32, 146';
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function isLightColor(hex: string): boolean { return getLuminance(hex) > 0.45; }
function getContrastTextColor(bgHex: string): string { return isLightColor(bgHex) ? '#1f2937' : '#ffffff'; }
function getContrastTextColorMuted(bgHex: string): string { return isLightColor(bgHex) ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)'; }
function getOverlayButtonBg(bgHex: string): string { return isLightColor(bgHex) ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'; }

// ============================================================================
// SVG ICONS
// ============================================================================
const Icons = {
  headphones: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>),
  phone: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>),
  x: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>),
  zap: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  clock: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  calendar: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  thumbsUp: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>),
  file: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>),
  cpu: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>),
  smartphone: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>),
  chart: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
  bell: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>),
  message: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  transfer: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>),
  training: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.8a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>),
  moon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>),
  mic: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>),
  wrench: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>),
  medical: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 1.5.5 3.5 2 5l5 5 5-5c1.5-1.5 2-3.5 2-5a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="1" fill="currentColor"/></svg>),
  restaurant: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>),
  briefcase: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>),
  store: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  pet: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/></svg>),
  star: (<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  user: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  close: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
};

// ============================================================================
// SHARED TYPES
// ============================================================================
interface ContrastColors {
  text: string;
  textMuted: string;
  buttonBg: string;
  isLight: boolean;
}

// ============================================================================
// SAFE FAQ RENDERER (replaces dangerouslySetInnerHTML)
// ============================================================================
function SafeFAQContent({ html }: { html: string }) {
  const parts = html.split(/(<\/?(?:p|ul|ol|li|strong|br)\s*\/?>)/gi);
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    const lower = part.toLowerCase().trim();

    if (lower === '<ul>' || lower === '<ol>') { inList = true; listItems = []; continue; }
    if (lower === '</ul>') { elements.push(<ul key={key++} style={{ marginLeft: '1.25rem', marginTop: '0.375rem' }}>{listItems}</ul>); inList = false; continue; }
    if (lower === '</ol>') { elements.push(<ol key={key++} style={{ marginLeft: '1.25rem', marginTop: '0.375rem' }}>{listItems}</ol>); inList = false; continue; }
    if (lower === '<li>') continue;
    if (lower === '</li>') continue;
    if (lower === '<p>') continue;
    if (lower === '</p>') { elements.push(<br key={key++} />); continue; }
    if (lower === '<br>' || lower === '<br/>') { elements.push(<br key={key++} />); continue; }
    if (lower === '<strong>' || lower === '</strong>') continue;

    if (part.trim() && !part.startsWith('<')) {
      const prevTag = i > 0 ? parts[i - 1]?.toLowerCase().trim() : '';
      const textNode = prevTag === '<strong>' ? <strong key={key++}>{part}</strong> : <span key={key++}>{part}</span>;
      if (inList) {
        listItems.push(<li key={key++} style={{ marginBottom: '0.375rem' }}>{textNode}</li>);
      } else {
        elements.push(textNode);
      }
    }
  }
  return <div className="faq-answer-content">{elements}</div>;
}

// ============================================================================
// SCHEMA.ORG STRUCTURED DATA
// ============================================================================
function SchemaOrg({ config }: { config: MarketingConfig }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer.replace(/<[^>]*>/g, '') },
    })),
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.branding.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: config.pricing.map(tier => ({
      '@type': 'Offer', name: tier.name, price: tier.price, priceCurrency: 'USD', description: tier.subtitle,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
    </>
  );
}

// ============================================================================
// ANALYTICS SCRIPTS
// ============================================================================
function AnalyticsScripts({ analytics }: { analytics?: MarketingConfig['analytics'] }) {
  if (!analytics) return null;
  const scripts: string[] = [];

  if (analytics.gtmId) {
    scripts.push(`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${analytics.gtmId}');`);
  }
  if (analytics.googleAnalyticsId) {
    scripts.push(`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analytics.googleAnalyticsId}');`);
  }
  if (analytics.fbPixelId) {
    scripts.push(`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${analytics.fbPixelId}');fbq('track','PageView');`);
  }

  return (
    <>
      {analytics.googleAnalyticsId && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${analytics.googleAnalyticsId}`} />
      )}
      {scripts.length > 0 && (
        <script dangerouslySetInnerHTML={{ __html: scripts.join('\n') }} />
      )}
      {analytics.customHeadScripts && (
        <script dangerouslySetInnerHTML={{ __html: analytics.customHeadScripts }} />
      )}
    </>
  );
}

// ============================================================================
// NAVIGATION
// ============================================================================
function Navigation({ config }: { config: MarketingConfig }) {
  const { branding } = config;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <a href="/" className="logo">
            {branding.logoUrl ? (
              <div className="logo-wrapper" style={{ backgroundColor: branding.logoBackgroundColor || 'transparent', padding: branding.logoBackgroundColor ? '8px 12px' : '0', borderRadius: '8px' }}>
                <img src={branding.logoUrl} alt={branding.name} className="logo-image" />
              </div>
            ) : (
              <span className="logo-text">{branding.name}</span>
            )}
          </a>

          <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <li><a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a></li>
            <li><a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a></li>
            <li><a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a></li>
            <li><a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a></li>
          </ul>

          <div className="nav-actions">
            {config.clientLoginPath && (
              <a href={config.clientLoginPath} className="client-login-link">Client Login</a>
            )}
            {config.footer.phone && (
              <a href={`tel:${config.footer.phone.replace(/\D/g, '')}`} className="btn-ghost">Call Us</a>
            )}
            <a href="/get-started" className="btn-primary">Start Free Trial</a>
          </div>

          <button className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`} aria-label="Toggle menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />}
    </nav>
  );
}

// ============================================================================
// HERO SECTION
// ============================================================================
function HeroSection({ config, contrastColors }: { config: MarketingConfig; contrastColors: ContrastColors }) {
  const { hero, branding } = config;

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>{hero.badge}</span>
          </div>

          <h1 className="hero-title">
            {hero.headline.map((line, i) => (<span key={i} style={{ display: 'block' }}>{line}</span>))}
          </h1>

          <p className="hero-subtitle">{hero.description}</p>

          <div className="hero-ctas">
            <a href="/get-started" className="btn-large btn-primary">Start Free Trial — 7 Days Free</a>
            {hero.demoPhone ? (
              <a href={`tel:+1${hero.demoPhone.replace(/\D/g, '')}`} className="btn-large btn-ghost">
                <span style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', display: 'inline-flex' }}>{Icons.phone}</span>
                Try Live Demo
              </a>
            ) : (
              <a href="#how-it-works" className="btn-large btn-ghost">See How It Works</a>
            )}
          </div>

          <div className="trust-bar">
            {hero.trustItems.map((item, i) => (<div key={i} className="trust-item">✓ {item}</div>))}
          </div>

          {hero.videoUrl && (
            <div className="hero-video">
              <div className="hero-video-wrapper">
                <iframe
                  src={hero.videoUrl}
                  title={`${branding.name} Demo Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {hero.demoPhone && (
            <div className="demo-cta">
              <div className="demo-box" style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.primaryHoverColor} 100%)`, color: contrastColors.text }}>
                <div className="demo-icon" style={{ color: contrastColors.text }}>{Icons.headphones}</div>
                <div className="demo-content">
                  <h3 style={{ color: contrastColors.text }}>HEAR IT IN ACTION:</h3>
                  <a href={`tel:+1${hero.demoPhone.replace(/\D/g, '')}`} className="demo-phone" style={{ color: contrastColors.text, background: contrastColors.buttonBg }}>
                    <span style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}>{Icons.phone}</span>
                    {hero.demoPhone}
                  </a>
                  {hero.demoInstructions && <p className="demo-instructions" style={{ color: contrastColors.textMuted }}>{hero.demoInstructions}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="hero-bg"><div className="hero-gradient"></div><div className="hero-pattern"></div></div>
    </section>
  );
}

// ============================================================================
// STATS SECTION
// ============================================================================
function StatsSection({ config }: { config: MarketingConfig }) {
  const { stats } = config;
  return (
    <section className="stats-section">
      <div className="container">
        <div className="live-stats">
          <div className="stat-item"><div className="stat-icon">{Icons.zap}</div><div className="stat-number">{stats.setupTime}</div><div className="stat-label">Setup Time</div></div>
          <div className="stat-item"><div className="stat-icon">{Icons.clock}</div><div className="stat-number">{stats.responseTime}</div><div className="stat-label">Avg Response</div></div>
          <div className="stat-item"><div className="stat-icon">{Icons.calendar}</div><div className="stat-number">{stats.businessesServed}</div><div className="stat-label">Businesses Served</div></div>
          <div className="stat-item"><div className="stat-icon">{Icons.thumbsUp}</div><div className="stat-number">{stats.satisfaction}</div><div className="stat-label">Satisfaction</div></div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PROBLEM/SOLUTION SECTION
// ============================================================================
function ProblemSolutionSection({ config, contrastColors }: { config: MarketingConfig; contrastColors: ContrastColors }) {
  const { problems, solution, branding } = config;
  return (
    <section className="problem-solution">
      <div className="container">
        <div className="section-header"><h2>You&apos;re Losing Customers Every Time Your Phone Rings</h2></div>
        <div className="problems-grid">
          {problems.map((problem, i) => (
            <div key={i} className="problem-card">
              <div className="problem-icon">{Icons.x}</div>
              <h3>{problem.title}</h3>
              <p>&quot;{problem.description}&quot;</p>
            </div>
          ))}
        </div>
        <div className="solution-box" style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.primaryHoverColor} 100%)`, color: contrastColors.text }}>
          <h2 style={{ color: contrastColors.text }}>{branding.name} Is {solution.headline}</h2>
          {solution.paragraphs.map((p, i) => (<p key={i} className="solution-text" style={{ color: contrastColors.textMuted }}>{p}</p>))}
          <p className="solution-highlight" style={{ background: contrastColors.buttonBg, color: contrastColors.text }}>
            <strong style={{ color: contrastColors.isLight ? branding.primaryHoverColor : branding.accentColor }}>And here&apos;s the best part:</strong>{' '}{solution.highlight}
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// HOW IT WORKS
// ============================================================================
function HowItWorksSection({ config }: { config: MarketingConfig }) {
  const { steps } = config;
  const stepIcons = [Icons.file, Icons.cpu, Icons.phone, Icons.smartphone];
  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <div className="section-header"><h2>From Signup to Your First Call: Under 10 Minutes</h2><p className="subtitle">No, Really. We Timed It.</p></div>
        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{i + 1}</div>
              <div className="step-icon">{stepIcons[i] || Icons.zap}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <div className="step-time"><span style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }}>{Icons.clock}</span>{step.time}</div>
            </div>
          ))}
        </div>
        <div className="cta-box">
          <a href="/get-started" className="btn-large btn-primary">Start Your 7-Day Free Trial</a>
          <p className="cta-subtext">No credit card required. Your AI receptionist is ready in 10 minutes.</p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// APP SHOWCASE — SVG mockup mirrors real Call Detail page
// ============================================================================
function AppShowcaseSection({ config }: { config: MarketingConfig }) {
  const { benefits, branding } = config;
  const benefitIcons: Record<string, React.ReactElement> = { smartphone: Icons.smartphone, phone: Icons.phone, chart: Icons.chart, bell: Icons.bell };

  // Derive lighter tint from primary for backgrounds
  const primaryRgb = hexToRgb(branding.primaryColor);
  const tintBg = primaryRgb ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.08)` : 'rgba(18, 32, 146, 0.08)';
  const tintBgStrong = primaryRgb ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)` : 'rgba(18, 32, 146, 0.15)';

  return (
    <section className="app-showcase">
      <div className="container">
        <div className="section-header">
          <h2>See Every Conversation. Manage Everything from Your Phone.</h2>
          <p>Unlike old-school answering services that just take messages, {branding.name} gives you a complete command center for every customer interaction.</p>
        </div>

        <div className="app-features">
          <div className="app-screenshot">
            <div className="dashboard-mockup">
              <svg viewBox="0 0 320 640" fill="none" className="dashboard-image" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                {/* Phone frame */}
                <rect x="8" y="8" width="304" height="624" rx="40" fill="#1a1a1a" stroke="#333" strokeWidth="2"/>
                <rect x="18" y="18" width="284" height="604" rx="32" fill="#f8fafc"/>
                {/* Notch */}
                <rect x="115" y="24" width="90" height="28" rx="14" fill="#1a1a1a"/>

                {/* ── Header bar ── */}
                <rect x="18" y="56" width="284" height="44" fill={branding.primaryColor}/>
                <path d="M36 78 L44 70 M36 78 L44 86" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <text x="160" y="82" textAnchor="middle" fontFamily="system-ui" fontSize="15" fontWeight="600" fill="white">Call Details</text>

                {/* ── Caller header ── */}
                <rect x="18" y="100" width="284" height="56" fill="white"/>
                <text x="32" y="124" fontFamily="system-ui" fontSize="15" fontWeight="700" fill="#1f2937">John Davidson</text>
                <text x="32" y="142" fontFamily="system-ui" fontSize="11" fill="#6b7280">Today, 2:34 PM · 3m 42s</text>
                <rect x="224" y="114" width="64" height="24" rx="12" fill={tintBg} stroke={tintBgStrong} strokeWidth="1"/>
                <text x="256" y="130" textAnchor="middle" fontFamily="system-ui" fontSize="10" fontWeight="600" fill={branding.primaryColor}>Normal</text>

                {/* ── AI Summary card ── */}
                <rect x="26" y="170" width="268" height="136" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                <rect x="38" y="182" width="28" height="28" rx="8" fill={tintBg}/>
                <path d="M48 192 L48 200 M52 192 L56 196 L52 200 M48 196 L56 196" stroke={branding.primaryColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <text x="74" y="201" fontFamily="system-ui" fontSize="12" fontWeight="700" fill="#1f2937">AI Summary</text>
                <text fontFamily="system-ui" fontSize="11" fill="#6b7280">
                  <tspan x="38" y="228">Caller interested in getting a quote</tspan>
                  <tspan x="38" dy="17">for a project starting next month.</tspan>
                  <tspan x="38" dy="17">Requested a callback at their</tspan>
                  <tspan x="38" dy="17">earliest convenience.</tspan>
                </text>

                {/* ── Recording card ── */}
                <rect x="26" y="320" width="268" height="64" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                <text x="38" y="345" fontFamily="system-ui" fontSize="12" fontWeight="700" fill="#1f2937">Call Recording</text>
                <rect x="38" y="356" width="244" height="14" rx="7" fill="#f3f4f6"/>
                <rect x="38" y="356" width="110" height="14" rx="7" fill={branding.primaryColor} opacity="0.4"/>
                <circle cx="148" cy="363" r="5" fill={branding.primaryColor}/>
                <text x="258" y="367" textAnchor="end" fontFamily="system-ui" fontSize="9" fill="#6b7280">1:24 / 3:42</text>

                {/* ── Contact Details card ── */}
                <rect x="26" y="398" width="268" height="136" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                <text x="38" y="422" fontFamily="system-ui" fontSize="12" fontWeight="700" fill="#1f2937">Contact Details</text>
                {/* Name */}
                <rect x="38" y="434" width="24" height="24" rx="6" fill="#f3f4f6"/>
                <circle cx="50" cy="442" r="4" stroke="#9ca3af" strokeWidth="1.2" fill="none"/>
                <path d="M44 451 Q50 447 56 451" stroke="#9ca3af" strokeWidth="1.2" fill="none"/>
                <text x="70" y="440" fontFamily="system-ui" fontSize="9" fill="#9ca3af">Name</text>
                <text x="70" y="453" fontFamily="system-ui" fontSize="11" fill="#1f2937">John Davidson</text>
                {/* Phone */}
                <rect x="38" y="468" width="24" height="24" rx="6" fill="#f3f4f6"/>
                <path d="M47 474 C47 474 47 480 51 484" stroke="#9ca3af" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <text x="70" y="476" fontFamily="system-ui" fontSize="9" fill="#9ca3af">Phone</text>
                <text x="70" y="489" fontFamily="system-ui" fontSize="11" fill={branding.primaryColor}>(555) 123-4567</text>
                {/* Service */}
                <rect x="38" y="502" width="24" height="24" rx="6" fill="#f3f4f6"/>
                <rect x="45" y="509" width="10" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.2" fill="none"/>
                <text x="70" y="510" fontFamily="system-ui" fontSize="9" fill="#9ca3af">Service</text>
                <text x="70" y="523" fontFamily="system-ui" fontSize="11" fill="#1f2937">Project Estimate</text>

                {/* ── Action buttons ── */}
                <rect x="26" y="550" width="130" height="40" rx="20" fill={branding.primaryColor}/>
                <text x="91" y="574" textAnchor="middle" fontFamily="system-ui" fontSize="12" fontWeight="600" fill="white">Call Back</text>
                <rect x="164" y="550" width="130" height="40" rx="20" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                <text x="229" y="574" textAnchor="middle" fontFamily="system-ui" fontSize="12" fontWeight="600" fill="#374151">Send SMS</text>

                {/* Home indicator */}
                <rect x="120" y="606" width="80" height="4" rx="2" fill="#1a1a1a"/>
              </svg>
            </div>
          </div>

          <div className="app-benefits">
            {benefits.map((benefit, i) => (
              <div key={i} className="benefit-item">
                <div className="benefit-icon">{benefitIcons[benefit.icon] || Icons.zap}</div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SMS Example */}
        <div className="sms-example">
          <div className="sms-mockup">
            <div className="sms-header" style={{ background: branding.primaryColor }}>Messages</div>
            <div className="sms-content">
              <div className="sms-message">
                <strong>{branding.name}</strong>
                <p>New call from Sarah M. at 2:47pm</p>
                <p><strong>Requested:</strong> Service estimate<br/><strong>Phone:</strong> (555) 123-4567<br/><strong>Appointment booked:</strong> Thursday at 10am</p>
                <a href="#" className="sms-link">View Full Call in App →</a>
              </div>
            </div>
          </div>
          <div className="sms-caption">
            <p><strong>You get a text summary within seconds of each call ending.</strong> Never miss important details.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES SECTION
// ============================================================================
function FeaturesSection({ config }: { config: MarketingConfig }) {
  const { features } = config;
  const featureIcons: Record<string, React.ReactElement> = { calendar: Icons.calendar, message: Icons.message, transfer: Icons.transfer, training: Icons.training, moon: Icons.moon, mic: Icons.mic };
  return (
    <section id="features" className="features">
      <div className="container">
        <div className="section-header"><h2>Everything You Need. Nothing You Don&apos;t.</h2></div>
        <div className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{featureIcons[feature.icon] || Icons.zap}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              {feature.integrations && <div className="feature-integrations">{feature.integrations.map((int, j) => <span key={j}>✓ {int}</span>)}</div>}
              {feature.highlight && <p className="feature-highlight">{feature.highlight}</p>}
              {feature.example && <div className="feature-example">{feature.example}</div>}
              {feature.stat && <div className="feature-stat"><strong>Real stat:</strong> {feature.stat.replace('Real stat: ', '')}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// INDUSTRIES SECTION
// ============================================================================
function IndustriesSection({ config }: { config: MarketingConfig }) {
  const { industries } = config;
  const industryIcons: Record<string, React.ReactElement> = { wrench: Icons.wrench, medical: Icons.medical, restaurant: Icons.restaurant, briefcase: Icons.briefcase, store: Icons.store, pet: Icons.pet };
  return (
    <section className="industries">
      <div className="container">
        <div className="section-header"><h2>Built for Small Businesses Who Can&apos;t Afford to Miss Calls</h2></div>
        <div className="industries-grid">
          {industries.map((industry, i) => (
            <div key={i} className="industry-card">
              <div className="industry-icon">{industryIcons[industry.icon] || Icons.briefcase}</div>
              <h3>{industry.title}</h3>
              <p className="industry-subtitle">{industry.subtitle}</p>
              <p>&quot;{industry.description}&quot;</p>
              <div className="industry-result"><strong>{industry.result}</strong></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// COMPARISON SECTION
// ============================================================================
function ComparisonSection({ config }: { config: MarketingConfig }) {
  const { branding, pricing } = config;
  const cs = config.currencySymbol || '$';
  const lowestPrice = pricing.length > 0 ? pricing[0].price : 49;
  const highestPrice = pricing.length > 0 ? pricing[pricing.length - 1].price : 197;

  const comparisonData = [
    { label: 'Monthly Cost', ours: `${cs}${lowestPrice}-${highestPrice}`, human: '$3,000-4,500', ruby: '$299-600', vm: '$0' },
    { label: 'Setup Time', ours: '10 min', human: '2-4 weeks', ruby: '3-5 days', vm: 'Instant' },
    { label: 'Available', ours: '24/7/365', human: 'Business hours', ruby: '24/7', vm: '24/7' },
    { label: 'Books Appointments', ours: '✓', human: '✓', ruby: '✓', vm: '✗' },
    { label: 'Calendar Access', ours: '✓', human: '✓', ruby: '✗', vm: '✗' },
    { label: 'Text Summaries', ours: '✓', human: '✗', ruby: '✗', vm: '✗' },
    { label: 'Mobile App', ours: '✓', human: '✗', ruby: '✗', vm: '✗' },
    { label: 'Trained on YOUR Biz', ours: '✓', human: 'After weeks', ruby: 'Generic', vm: 'N/A' },
    { label: 'Multiple Calls', ours: 'Unlimited', human: 'One at a time', ruby: 'Limited', vm: 'Unlimited' },
  ];

  return (
    <section className="comparison">
      <div className="container">
        <div className="section-header"><h2>Why {branding.name} Beats Every Other Option</h2></div>

        {/* Mobile cards */}
        <div className="comparison-cards">
          {[
            { name: branding.name, highlight: true, getData: (d: typeof comparisonData[0]) => d.ours },
            { name: 'Human Receptionist', highlight: false, getData: (d: typeof comparisonData[0]) => d.human },
            { name: 'Traditional Service', highlight: false, getData: (d: typeof comparisonData[0]) => d.ruby },
            { name: 'Voicemail', highlight: false, getData: (d: typeof comparisonData[0]) => d.vm },
          ].map((option, i) => (
            <div key={i} className={`comparison-card ${option.highlight ? 'comparison-card--highlight' : ''}`}>
              <div className="comparison-card-header">
                <h3>{option.name}</h3>
                <span className="comparison-card-price">{option.getData(comparisonData[0])}</span>
              </div>
              <ul className="comparison-card-features">
                {comparisonData.slice(1).map((row, j) => {
                  const val = option.getData(row);
                  const isYes = val === '✓' || val.includes('Unlimited') || val === '24/7/365' || val === '10 min';
                  const isNo = val === '✗' || val === 'N/A';
                  return (
                    <li key={j}>
                      <span className="feature-label">{row.label}</span>
                      <span className={`feature-value ${isYes ? 'feature-value--yes' : isNo ? 'feature-value--no' : ''}`}>{val}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th></th>
                <th className="highlight-col"><div className="table-header-highlight">{branding.name}</div></th>
                <th>Human Receptionist</th>
                <th>Traditional Service</th>
                <th>Just Voicemail</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr key={i}>
                  <td><strong>{row.label}</strong></td>
                  <td className="highlight-col"><strong>{row.ours}</strong></td>
                  <td>{row.human}</td>
                  <td>{row.ruby}</td>
                  <td>{row.vm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="comparison-summary">
          <h3>The Bottom Line</h3>
          <p><strong>You have three choices:</strong></p>
          <ol>
            <li><strong>Hire staff:</strong> Professional, but $36,000-54,000/year + benefits</li>
            <li><strong>Traditional service:</strong> 24/7 but generic, no appointments, $300-600/month</li>
            <li><strong>{branding.name}:</strong> Custom AI, books appointments, text summaries, mobile app—{cs}{lowestPrice}/month</li>
          </ol>
          <p className="comparison-conclusion">The choice is obvious.</p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// TESTIMONIALS SECTION
// ============================================================================
function TestimonialsSection({ config }: { config: MarketingConfig }) {
  const { testimonials } = config;
  return (
    <section className="testimonials">
      <div className="container">
        <div className="section-header"><h2>What Our Customers Are Saying</h2></div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-rating">
                {Array.from({ length: testimonial.rating }).map((_, j) => (<span key={j} style={{ color: '#f59e0b', width: '1.25rem', height: '1.25rem' }}>{Icons.star}</span>))}
              </div>
              <h3>&quot;{testimonial.headline}&quot;</h3>
              <p>&quot;{testimonial.quote}&quot;</p>
              <div className="testimonial-author">
                <div className="author-avatar">{Icons.user}</div>
                <div className="author-info">
                  <strong>{testimonial.authorName}</strong>
                  <span>{testimonial.authorTitle}</span>
                  <span className="author-stats">{testimonial.stats}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING SECTION
// ============================================================================
function PricingSection({ config }: { config: MarketingConfig }) {
  const { pricing, branding } = config;
  const cs = config.currencySymbol || '$';
  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <div className="section-header">
          <h2>Simple Pricing. No Hidden Fees.</h2>
          <p>All plans include the {branding.name} app, text summaries, call recordings, and 7-day free trial.</p>
        </div>
        <div className="pricing-grid">
          {pricing.map((tier, i) => (
            <div key={i} className={`pricing-card ${tier.isPopular ? 'pricing-popular' : ''}`}>
              {tier.isPopular && (<div className="pricing-badge"><span style={{ color: '#f59e0b', width: '1rem', height: '1rem' }}>{Icons.star}</span>Most Popular</div>)}
              <div className="pricing-header">
                <h3>{tier.name}</h3>
                <div className="pricing-price">
                  <span className="price-currency">{cs}</span>
                  <span className="price-amount">{tier.price}</span>
                  <span className="price-period">/month</span>
                </div>
                <p className="pricing-subtitle">{tier.subtitle}</p>
              </div>
              <ul className="pricing-features">
                {tier.features.map((feature, j) => (<li key={j}>{feature.startsWith('Everything') ? <strong>{feature}</strong> : `✓ ${feature}`}</li>))}
              </ul>
              {tier.note && <div className="pricing-note">{tier.note}</div>}
              <a href="/get-started" className={`btn-pricing ${tier.isPopular ? 'btn-primary' : ''}`}>Start 7-Day Free Trial</a>
              {tier.isPopular && <p className="pricing-recommendation">Most businesses choose {tier.name}</p>}
            </div>
          ))}
        </div>
        <div className="pricing-guarantee">
          <p><strong>All plans include:</strong> 7-day free trial (no credit card required) • Cancel anytime • Setup in under 10 minutes • 30-day money-back guarantee</p>
          {config.footer.email && <p className="pricing-custom">Have 500+ calls per month? <a href={`mailto:${config.footer.email}`}>Contact us for custom pricing →</a></p>}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FAQ SECTION
// ============================================================================
function FAQSection({ config }: { config: MarketingConfig }) {
  const { faqs } = config;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  return (
    <section id="faq" className="faq">
      <div className="container">
        <div className="section-header"><h2>Questions? We&apos;ve Got Answers.</h2></div>
        <div className="faq-grid">
          {faqs.map((faq, i) => (
            <div key={i} className={`faq-item ${activeIndex === i ? 'active' : ''}`}>
              <button className="faq-question" onClick={() => setActiveIndex(activeIndex === i ? null : i)}>
                <span>{faq.question}</span>
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <SafeFAQContent html={faq.answer} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FINAL CTA SECTION
// ============================================================================
function FinalCTASection({ config, contrastColors }: { config: MarketingConfig; contrastColors: ContrastColors }) {
  const { hero, branding } = config;
  return (
    <section className="final-cta" style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.primaryHoverColor} 100%)` }}>
      <div className="container">
        <div className="final-cta-content">
          <h2 style={{ color: contrastColors.text }}>Stop Losing Customers to Voicemail</h2>
          <p className="final-cta-text" style={{ color: contrastColors.textMuted }}>
            Every missed call is money out the door. While you&apos;re on the job, in a meeting, or closed for the night—<strong style={{ color: contrastColors.text }}>your competitors are answering their phones.</strong>
          </p>
          <div className="final-cta-boxes">
            {hero.demoPhone && (
              <>
                <div className="cta-box-primary">
                  <h3><span style={{ width: '1.5rem', height: '1.5rem' }}>{Icons.headphones}</span>Try It Right Now</h3>
                  <a href={`tel:+1${hero.demoPhone.replace(/\D/g, '')}`} className="cta-phone-large">
                    <span style={{ width: '1.5rem', height: '1.5rem' }}>{Icons.phone}</span>{hero.demoPhone}
                  </a>
                  <p>&quot;Hear it work before you sign up&quot;</p>
                </div>
                <div className="cta-box-divider" style={{ color: contrastColors.textMuted }}>or</div>
              </>
            )}
            <div className="cta-box-secondary" style={{ background: contrastColors.buttonBg }}>
              <a href="/get-started" className="btn-large btn-primary" style={{ background: contrastColors.isLight ? branding.primaryHoverColor : 'white', color: contrastColors.isLight ? 'white' : branding.primaryColor }}>
                Start Your 7-Day Free Trial
              </a>
              <div className="cta-benefits">
                <span style={{ color: contrastColors.text }}>✓ Setup in 10 minutes</span>
                <span style={{ color: contrastColors.text }}>✓ No credit card required</span>
                <span style={{ color: contrastColors.text }}>✓ Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// EXIT INTENT MODAL
// ============================================================================
function ExitIntentModal({ config, onClose }: { config: MarketingConfig; onClose: () => void }) {
  const { hero, branding } = config;
  const demoPhone = hero.demoPhone;

  return (
    <div className="exit-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="exit-modal" style={{ textAlign: 'center' }}>
        <button className="exit-modal-close" onClick={onClose} aria-label="Close">
          <span style={{ width: '1.5rem', height: '1.5rem' }}>{Icons.close}</span>
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <span style={{ width: '3rem', height: '3rem', color: branding.primaryColor }}>{Icons.headphones}</span>
        </div>
        <h3>Wait — Hear It Before You Leave!</h3>
        <p>Call our AI receptionist right now. No signup, no commitment — just see how it handles a real call for your business.</p>
        {demoPhone ? (
          <>
            <a
              href={`tel:+1${demoPhone.replace(/\D/g, '')}`}
              className="btn-large btn-primary"
              style={{ width: '100%', marginBottom: '0.75rem', fontSize: '1.125rem' }}
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).dataLayer) {
                  (window as any).dataLayer.push({ event: 'exit_intent_demo_call' });
                }
              }}
            >
              <span style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', display: 'inline-flex' }}>{Icons.phone}</span>
              {demoPhone}
            </a>
            <p style={{ fontSize: '0.813rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
              {hero.demoInstructions || 'Takes 30 seconds. Your phone will ring with a live demo.'}
            </p>
          </>
        ) : (
          <a href="/get-started" className="btn-large btn-primary" style={{ width: '100%', marginBottom: '0.75rem' }}>
            Start Your 7-Day Free Trial
          </a>
        )}
        <a href="/get-started" style={{ fontSize: '0.875rem', fontWeight: 600, color: branding.primaryColor }}>
          Or start your free trial →
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer({ config }: { config: MarketingConfig }) {
  const { footer, branding } = config;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              {branding.logoUrl ? (
                <div className="logo-wrapper" style={{ backgroundColor: branding.logoBackgroundColor || 'transparent', padding: branding.logoBackgroundColor ? '8px 12px' : '0', borderRadius: '8px', display: 'inline-block' }}>
                  <img src={branding.logoUrl} alt={branding.name} style={{ height: '40px' }} />
                </div>
              ) : (
                <span>{branding.name}</span>
              )}
            </div>
            <p className="footer-tagline">AI receptionist that never sleeps</p>
            <div className="footer-contact">
              {footer.address && <p>{footer.address}</p>}
              {footer.phone && <p><a href={`tel:${footer.phone.replace(/\D/g, '')}`}>{footer.phone}</a></p>}
              {footer.email && <p><a href={`mailto:${footer.email}`}>{footer.email}</a></p>}
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul className="footer-links">{footer.productLinks.map((link, i) => (<li key={i}><a href={link.href}>{link.label}</a></li>))}</ul>
          </div>
          <div className="footer-col">
            <h4>Industries</h4>
            <ul className="footer-links">{footer.industryLinks.map((link, i) => (<li key={i}><a href={link.href}>{link.label}</a></li>))}</ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              {footer.companyLinks.map((link, i) => (<li key={i}><a href={link.href}>{link.label}</a></li>))}
              {config.clientLoginPath && <li><a href={config.clientLoginPath}>Client Login</a></li>}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {branding.name}. All Rights Reserved.</p>
          <p>A2P 10DLC Compliant</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// STICKY CTA
// ============================================================================
function StickyCTA({ config }: { config: MarketingConfig }) {
  const [visible, setVisible] = useState(false);
  const { hero, branding } = config;
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <div className={`sticky-cta ${visible ? 'visible' : ''}`}>
      <span className="sticky-cta-text">Ready to try {branding.name}?</span>
      <div className="sticky-cta-actions">
        <a href="/get-started" className="btn-primary btn-small">Start Free Trial</a>
        {hero.demoPhone && (
          <a href={`tel:+1${hero.demoPhone.replace(/\D/g, '')}`} className="btn-ghost btn-small">
            <span style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }}>{Icons.phone}</span>Call Demo
          </a>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface MarketingPageProps {
  config?: Partial<MarketingConfig>;
}

export default function MarketingPage({ config: partialConfig }: MarketingPageProps) {
  const config: MarketingConfig = {
    ...defaultMarketingConfig,
    ...partialConfig,
    branding: { ...defaultMarketingConfig.branding, ...partialConfig?.branding },
    hero: { ...defaultMarketingConfig.hero, ...partialConfig?.hero },
    stats: { ...defaultMarketingConfig.stats, ...partialConfig?.stats },
    solution: { ...defaultMarketingConfig.solution, ...partialConfig?.solution },
    footer: { ...defaultMarketingConfig.footer, ...partialConfig?.footer },
  };

  const theme = config.theme || 'light';

  const contrastColors = useMemo<ContrastColors>(() => {
    const pc = config.branding.primaryColor || '#122092';
    return { text: getContrastTextColor(pc), textMuted: getContrastTextColorMuted(pc), buttonBg: getOverlayButtonBg(pc), isLight: isLightColor(pc) };
  }, [config.branding.primaryColor]);

  // Exit intent
  const [showExitModal, setShowExitModal] = useState(false);
  const exitShownRef = React.useRef(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShownRef.current) {
        if (window.innerWidth >= 768 && performance.now() > 30000) {
          exitShownRef.current = true;
          try { sessionStorage.setItem('exit_shown', '1'); } catch {}
          setShowExitModal(true);
        }
      }
    };
    try { if (sessionStorage.getItem('exit_shown')) { exitShownRef.current = true; } } catch {}
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  // Compute RGB channels for CSS rgba() usage
  const primaryRgbStr = hexToRgbString(config.branding.primaryColor || '#122092');
  const accentRgbStr = hexToRgbString(config.branding.accentColor || '#f6b828');

  const themeStyle = {
    '--primary-color': config.branding.primaryColor,
    '--primary-hover': config.branding.primaryHoverColor,
    '--accent-color': config.branding.accentColor,
    '--primary-rgb': primaryRgbStr,
    '--accent-rgb': accentRgbStr,
  } as React.CSSProperties;

  const dynamicStyles = `
    .marketing-page ::selection { background-color: ${config.branding.primaryColor}40; color: inherit; }
    .marketing-page ::-moz-selection { background-color: ${config.branding.primaryColor}40; color: inherit; }
    .marketing-page input:focus, .marketing-page select:focus, .marketing-page textarea:focus {
      outline: none; border-color: ${config.branding.primaryColor} !important; box-shadow: 0 0 0 3px ${config.branding.primaryColor}20 !important;
    }
  `;

  return (
    <div className={`marketing-page theme-${theme}`} style={themeStyle}>
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      <SchemaOrg config={config} />
      <AnalyticsScripts analytics={config.analytics} />
      <Navigation config={config} />
      <HeroSection config={config} contrastColors={contrastColors} />
      <StatsSection config={config} />
      <ProblemSolutionSection config={config} contrastColors={contrastColors} />
      <HowItWorksSection config={config} />
      <AppShowcaseSection config={config} />
      <FeaturesSection config={config} />
      {config.showIndustries && <IndustriesSection config={config} />}
      {config.showComparison && <ComparisonSection config={config} />}
      {config.showTestimonials && <TestimonialsSection config={config} />}
      <PricingSection config={config} />
      <FAQSection config={config} />
      <FinalCTASection config={config} contrastColors={contrastColors} />
      <Footer config={config} />
      <StickyCTA config={config} />
      {showExitModal && <ExitIntentModal config={config} onClose={() => setShowExitModal(false)} />}
    </div>
  );
}