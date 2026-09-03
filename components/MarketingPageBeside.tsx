// ============================================================================
// components/MarketingPageBeside.tsx
// "Beside" white-label marketing template.
//
// Split-hero, product-led layout with an interactive feature explorer. Accepts
// the same MarketingConfig contract as the Classic template, so signup, demo,
// client login, pricing, currency, custom nav links, analytics, and light/dark
// theming all flow in from config with nothing hardcoded. Full section parity
// with Classic plus the Beside personality.
// ============================================================================
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MarketingConfig, defaultMarketingConfig } from '@/types/marketing';
import '@/styles/marketing-beside.css';

// ============================================================================
// COLOR UTILITIES (shared behavior with Classic so contrast stays identical)
// ============================================================================
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace(/^#/, '');
  const fullHex = cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex;
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}
function hexToRgbString(hex: string): string {
  const rgb = hexToRgb(hex);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '16, 185, 129';
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
function getContrastTextColorMuted(bgHex: string): string { return isLightColor(bgHex) ? 'rgba(31, 41, 55, 0.82)' : 'rgba(255, 255, 255, 0.9)'; }
function adjustColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const R = clamp(rgb.r + amt), G = clamp(rgb.g + amt), B = clamp(rgb.b + amt);
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

// ============================================================================
// SVG ICONS (same key set as Classic so feature/industry/benefit icons resolve)
// ============================================================================
const Icons: Record<string, React.ReactElement> = {
  headphones: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>),
  phone: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>),
  x: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>),
  zap: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  clock: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  calendar: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
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
  pet: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>),
  star: (<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  check: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  arrow: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>),
  close: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
};

const FEATURE_ICON_KEYS: Record<string, string> = { calendar: 'calendar', message: 'message', transfer: 'transfer', training: 'training', moon: 'moon', mic: 'mic' };
const BENEFIT_ICON_KEYS: Record<string, string> = { smartphone: 'smartphone', phone: 'phone', chart: 'chart', bell: 'bell' };
const INDUSTRY_ICON_KEYS: Record<string, string> = { wrench: 'wrench', medical: 'medical', restaurant: 'restaurant', briefcase: 'briefcase', store: 'store', pet: 'pet' };

// ============================================================================
// SAFE FAQ RENDERER (parses the small allowed HTML subset in FAQ answers)
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
    if (lower === '</ul>') { elements.push(<ul key={key++}>{listItems}</ul>); inList = false; continue; }
    if (lower === '</ol>') { elements.push(<ol key={key++}>{listItems}</ol>); inList = false; continue; }
    if (lower === '<li>' || lower === '</li>') continue;
    if (lower === '<p>') continue;
    if (lower === '</p>') { elements.push(<br key={key++} />); continue; }
    if (lower === '<br>' || lower === '<br/>') { elements.push(<br key={key++} />); continue; }
    if (lower === '<strong>' || lower === '</strong>') continue;
    if (part.trim() && !part.startsWith('<')) {
      const prevTag = i > 0 ? parts[i - 1]?.toLowerCase().trim() : '';
      const textNode = prevTag === '<strong>' ? <strong key={key++}>{part}</strong> : <span key={key++}>{part}</span>;
      if (inList) { listItems.push(<li key={key++}>{textNode}</li>); } else { elements.push(textNode); }
    }
  }
  return <div className="bsd-faq-a-inner">{elements}</div>;
}

// ============================================================================
// SCHEMA.ORG (FAQ + SoftwareApplication/Offer, parity with Classic)
// ============================================================================
function SchemaOrg({ config }: { config: MarketingConfig }) {
  const priceCurrency = config.currencyCode || 'USD';
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: config.faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer.replace(/<[^>]*>/g, '') } })) };
  const productSchema = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: config.branding.name, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: config.pricing.map(tier => ({ '@type': 'Offer', name: tier.name, price: tier.price, priceCurrency, description: tier.subtitle })) };
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} /></>);
}

// ============================================================================
// ANALYTICS SCRIPTS (GTM, GA4, FB pixel, custom head; parity with Classic)
// ============================================================================
function AnalyticsScripts({ analytics }: { analytics?: MarketingConfig['analytics'] }) {
  if (!analytics) return null;
  const scripts: string[] = [];
  if (analytics.gtmId) { scripts.push(`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${analytics.gtmId}');`); }
  if (analytics.googleAnalyticsId) { scripts.push(`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analytics.googleAnalyticsId}');`); }
  if (analytics.fbPixelId) { scripts.push(`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${analytics.fbPixelId}');fbq('track','PageView');`); }
  return (<>{analytics.googleAnalyticsId && <script async src={`https://www.googletagmanager.com/gtag/js?id=${analytics.googleAnalyticsId}`} />}{scripts.length > 0 && <script dangerouslySetInnerHTML={{ __html: scripts.join('\n') }} />}{analytics.customHeadScripts && <script dangerouslySetInnerHTML={{ __html: analytics.customHeadScripts }} />}</>);
}

// ============================================================================
// SCROLL REVEAL
// Adds bsd-js to the root so the hidden-until-revealed state only applies when
// JS is present. Crawlers and no-JS visitors get fully visible content. Hero is
// intentionally never a reveal target, so the critical first paint never hides.
// ============================================================================
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.classList.add('bsd-js');
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = Array.from(root.querySelectorAll('.bsd-reveal'));
    if (reduce || typeof IntersectionObserver === 'undefined') {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ============================================================================
// SHARED HELPERS
// ============================================================================
function telHref(phone: string) { return `tel:+1${phone.replace(/\D/g, '')}`; }
function priceString(cs: string, amount: number | string, pos: 'before' | 'after') {
  return pos === 'after' ? `${amount} ${cs}` : `${cs}${amount}`;
}

// ============================================================================
// NAVIGATION
// ============================================================================
function Nav({ config }: { config: MarketingConfig }) {
  const { branding } = config;
  const homeUrl = config.homepageUrl || '/';
  return (
    <nav className="bsd-nav">
      <div className="bsd-container bsd-nav-inner">
        <a href={homeUrl} className="bsd-logo">
          {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.name} /> : <span>{branding.name}</span>}
        </a>
        <ul className="bsd-nav-links">
          {(config.customNavLinks || []).map((link, i) => (
            <li key={`nav-custom-${i}`}><a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a></li>
          ))}
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="/faq">FAQ</a></li>
        </ul>
        <div className="bsd-nav-actions">
          {config.clientLoginPath && <a href={config.clientLoginPath} className="bsd-nav-login">Client login</a>}
          {config.footer.phone && <a href={`tel:${config.footer.phone.replace(/\D/g, '')}`} className="bsd-btn bsd-btn-ghost bsd-btn-sm bsd-nav-call">Call us</a>}
          <a href="/get-started" className="bsd-btn bsd-btn-primary bsd-btn-sm">Start free trial</a>
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// HERO (split copy + floating product cards)
// ============================================================================
function Hero({ config }: { config: MarketingConfig }) {
  const { hero, branding } = config;
  const cs = config.currencySymbol || '$';
  const firstPrice = config.pricing.length > 0 ? config.pricing[0].price : defaultMarketingConfig.pricing[0].price;
  const pos = config.currencySymbolPosition || 'before';
  const subtitle = hero.subtitle || `AI Receptionist starting at ${priceString(cs, firstPrice, pos)}/month`;

  return (
    <section className="bsd-hero">
      <div className="bsd-container bsd-hero-grid">
        <div className="bsd-hero-copy">
          <span className="bsd-eyebrow"><span className="bsd-eyebrow-dot" />{hero.badge}</span>
          <h1>{hero.headline.map((line, i) => <span key={i} className="line">{line}</span>)}</h1>
          <p className="bsd-hero-price">{subtitle}</p>
          <p className="bsd-hero-desc">{hero.description}</p>
          <div className="bsd-hero-ctas">
            <a href="/get-started" className="bsd-btn bsd-btn-primary bsd-btn-lg">Start free trial, 7 days free</a>
            {hero.demoPhone
              ? <a href="/demo" className="bsd-btn bsd-btn-ghost bsd-btn-lg">{Icons.phone}Try live demo</a>
              : <a href="#how" className="bsd-btn bsd-btn-ghost bsd-btn-lg">See how it works</a>}
          </div>
          {hero.demoPhone && (
            <div className="bsd-hero-demo">
              <span className="bsd-hero-demo-label">Hear it live</span>
              <a href={telHref(hero.demoPhone)} className="bsd-hero-demo-num">{Icons.phone}{hero.demoPhone}</a>
            </div>
          )}
          <div className="bsd-hero-trust">
            {hero.trustItems.map((item, i) => <span key={i}>{Icons.check}{item}</span>)}
          </div>
        </div>

        <div className="bsd-stage">
          <div className="bsd-stage-bloom" />
          {/* Main card: the AI call summary, the product's core artifact */}
          <div className="bsd-card bsd-card-main">
            <div className="bsd-card-head">
              <div className="bsd-card-caller">
                <div className="bsd-card-avatar">JD</div>
                <div>
                  <div className="bsd-card-name">John Davidson</div>
                  <div className="bsd-card-time">Today, 2:34 PM, 3m 42s</div>
                </div>
              </div>
              <span className="bsd-chip">Booked</span>
            </div>
            <div className="bsd-card-block">
              <h5>{Icons.zap}AI summary</h5>
              <p>Caller wanted a quote for a project starting next month. Qualified as a strong lead and asked to schedule an on-site estimate.</p>
            </div>
            <div className="bsd-card-block">
              <div className="bsd-card-row"><span>Service</span><span>Project estimate</span></div>
              <div className="bsd-card-row"><span>Appointment</span><span>Thu, 10:00 AM</span></div>
              <div className="bsd-card-row"><span>Callback number</span><span>{branding.name ? '(555) 123-4567' : ''}</span></div>
            </div>
          </div>

          {/* Floating accent: live call (wide screens only) */}
          <div className="bsd-card bsd-card-float bsd-card-call">
            <div className="bsd-card-head" style={{ marginBottom: '0.5rem' }}>
              <span className="bsd-card-name" style={{ fontSize: '0.85rem' }}>Live call</span>
              <span className="bsd-wave"><i /><i /><i /><i /><i /><i /></span>
            </div>
            <div className="bsd-card-row"><span>Answered in</span><span>0.4s</span></div>
          </div>

          {/* Floating accent: SMS summary (wide screens only) */}
          <div className="bsd-card bsd-card-float bsd-card-sms">
            <div className="bsd-card-block" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <h5>{Icons.message}Text summary sent</h5>
              <p style={{ fontSize: '0.8rem' }}>New call from Sarah M. Appointment booked for Thursday at 10 AM.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PROOF STRIP (agency-editable stats)
// ============================================================================
function ProofStrip({ config }: { config: MarketingConfig }) {
  const s = config.stats;
  const items = [
    { value: s.setupTime, label: 'Setup time' },
    { value: s.responseTime, label: 'Response time' },
    { value: s.businessesServed, label: 'Businesses served' },
    { value: s.satisfaction, label: 'Satisfaction rate' },
  ];
  return (
    <section className="bsd-proof">
      <div className="bsd-container bsd-proof-grid bsd-stagger">
        {items.map((it, i) => (
          <div key={i} className="bsd-proof-item bsd-reveal">
            <div className="bsd-proof-value">{it.value}</div>
            <div className="bsd-proof-label">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// PROBLEM + SOLUTION
// ============================================================================
function ProblemSolution({ config, textOnPrimary, mutedOnPrimary }: { config: MarketingConfig; textOnPrimary: string; mutedOnPrimary: string }) {
  const { problems, solution, branding } = config;
  return (
    <section className="bsd-section">
      <div className="bsd-container">
        <div className="bsd-section-head center">
          <span className="bsd-eyebrow">The cost of a missed call</span>
          <h2>You&rsquo;re losing customers every time your phone rings</h2>
        </div>
        <div className="bsd-problems bsd-stagger">
          {problems.map((p, i) => (
            <div key={i} className="bsd-problem bsd-reveal">
              <div className="bsd-problem-icon">{Icons.x}</div>
              <h3>{p.title}</h3>
              <p>&ldquo;{p.description}&rdquo;</p>
            </div>
          ))}
        </div>
        <div className="bsd-solution bsd-reveal">
          <h2 style={{ color: textOnPrimary }}>{branding.name} is {solution.headline}</h2>
          {solution.paragraphs.map((para, i) => <p key={i} style={{ color: mutedOnPrimary }}>{para}</p>)}
          <span className="bsd-solution-hi" style={{ color: textOnPrimary }}><strong>The best part:</strong> {solution.highlight}</span>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// HOW IT WORKS (steps)
// ============================================================================
function HowItWorks({ config }: { config: MarketingConfig }) {
  const { steps } = config;
  return (
    <section id="how" className="bsd-section bsd-section-soft">
      <div className="bsd-container">
        <div className="bsd-section-head center">
          <span className="bsd-eyebrow">How it works</span>
          <h2>From signup to your first call in under 10 minutes</h2>
          <p>No, really. We timed it.</p>
        </div>
        <div className="bsd-steps bsd-stagger">
          {steps.map((step, i) => (
            <div key={i} className="bsd-step bsd-reveal">
              <div className="bsd-step-num">{i + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <span className="bsd-step-time">{Icons.clock}{step.time}</span>
            </div>
          ))}
        </div>
        <div className="bsd-steps-cta">
          <a href="/get-started" className="bsd-btn bsd-btn-primary bsd-btn-lg">Start your 7-day free trial</a>
          <p>No credit card required. Your AI receptionist is ready in 10 minutes.</p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURE EXPLORER (interactive pill tabs, the second signature moment)
// ============================================================================
function FeatureExplorer({ config }: { config: MarketingConfig }) {
  const { features } = config;
  const [active, setActive] = useState(0);
  const safeActive = Math.min(active, Math.max(0, features.length - 1));
  const current = features[safeActive] || features[0];
  if (!current) return null;
  const iconKey = FEATURE_ICON_KEYS[current.icon] || 'zap';
  return (
    <section id="features" className="bsd-section">
      <div className="bsd-container">
        <div className="bsd-section-head center">
          <span className="bsd-eyebrow">Capabilities</span>
          <h2>Everything you need. Nothing you don&rsquo;t.</h2>
          <p>Tap through what your AI receptionist handles on every call.</p>
        </div>
        <div className="bsd-fx">
          <div className="bsd-fx-pills">
            {features.map((f, i) => (
              <button key={i} type="button" className={`bsd-fx-pill${i === safeActive ? ' active' : ''}`} onClick={() => setActive(i)} aria-pressed={i === safeActive}>
                {Icons[FEATURE_ICON_KEYS[f.icon] || 'zap']}{f.title}
              </button>
            ))}
          </div>
          <div className="bsd-fx-panel">
            <div className="bsd-fx-detail">
              <div className="bsd-fx-detail-icon">{Icons[iconKey]}</div>
              <h3>{current.title}</h3>
              <p>{current.description}</p>
            </div>
            <div className="bsd-fx-visual">{Icons[iconKey]}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// COMMAND CENTER (phone mockup + benefits + SMS card)
// ============================================================================
function CommandCenter({ config, primary, textOnPrimary }: { config: MarketingConfig; primary: string; textOnPrimary: string }) {
  const { benefits, branding } = config;
  return (
    <section className="bsd-section bsd-section-soft">
      <div className="bsd-container">
        <div className="bsd-section-head center">
          <span className="bsd-eyebrow">Your command center</span>
          <h2>See every conversation, manage it all from your phone</h2>
          <p>Unlike an answering service that just takes messages, {branding.name} gives you the full picture of every customer.</p>
        </div>
        <div className="bsd-cc">
          <div className="bsd-cc-phone bsd-reveal">
            <svg viewBox="0 0 320 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mobile dashboard">
              <rect x="8" y="8" width="304" height="624" rx="40" fill="#1a1a1a" stroke="#333" strokeWidth="2"/>
              <rect x="18" y="18" width="284" height="604" rx="32" fill="#f8fafc"/>
              <rect x="115" y="24" width="90" height="26" rx="13" fill="#1a1a1a"/>
              <rect x="18" y="60" width="284" height="46" fill={primary}/>
              <text x="160" y="88" textAnchor="middle" fontFamily="system-ui" fontSize="15" fontWeight="600" fill={textOnPrimary}>Call details</text>
              <text x="32" y="140" fontFamily="system-ui" fontSize="15" fontWeight="700" fill="#1f2937">John Davidson</text>
              <text x="32" y="158" fontFamily="system-ui" fontSize="11" fill="#6b7280">Today, 2:34 PM, 3m 42s</text>
              <rect x="224" y="128" width="66" height="24" rx="12" fill={primary} opacity="0.12"/>
              <text x="257" y="144" textAnchor="middle" fontFamily="system-ui" fontSize="10" fontWeight="600" fill={primary}>Booked</text>
              <rect x="26" y="176" width="268" height="120" rx="12" fill="#ffffff" stroke="#e5e7eb"/>
              <text x="40" y="202" fontFamily="system-ui" fontSize="12" fontWeight="700" fill="#1f2937">AI Summary</text>
              <text fontFamily="system-ui" fontSize="11" fill="#6b7280">
                <tspan x="40" y="226">Caller wants a quote for a project</tspan>
                <tspan x="40" dy="17">starting next month. Requested a</tspan>
                <tspan x="40" dy="17">callback at their convenience.</tspan>
              </text>
              <rect x="26" y="312" width="268" height="66" rx="12" fill="#ffffff" stroke="#e5e7eb"/>
              <text x="40" y="338" fontFamily="system-ui" fontSize="12" fontWeight="700" fill="#1f2937">Recording</text>
              <rect x="40" y="350" width="240" height="12" rx="6" fill="#f1f3f5"/>
              <rect x="40" y="350" width="110" height="12" rx="6" fill={primary} opacity="0.5"/>
              <circle cx="150" cy="356" r="6" fill={primary}/>
              <rect x="26" y="394" width="268" height="120" rx="12" fill="#ffffff" stroke="#e5e7eb"/>
              <text x="40" y="420" fontFamily="system-ui" fontSize="12" fontWeight="700" fill="#1f2937">Contact</text>
              <text x="40" y="446" fontFamily="system-ui" fontSize="10" fill="#9ca3af">Phone</text>
              <text x="40" y="462" fontFamily="system-ui" fontSize="11" fill={primary}>(555) 123-4567</text>
              <text x="40" y="486" fontFamily="system-ui" fontSize="10" fill="#9ca3af">Service</text>
              <text x="40" y="502" fontFamily="system-ui" fontSize="11" fill="#1f2937">Project estimate</text>
              <rect x="26" y="530" width="128" height="42" rx="21" fill={primary}/>
              <text x="90" y="556" textAnchor="middle" fontFamily="system-ui" fontSize="12" fontWeight="600" fill={textOnPrimary}>Call back</text>
              <rect x="166" y="530" width="128" height="42" rx="21" fill="#ffffff" stroke="#e5e7eb"/>
              <text x="230" y="556" textAnchor="middle" fontFamily="system-ui" fontSize="12" fontWeight="600" fill="#374151">Send SMS</text>
              <rect x="122" y="602" width="76" height="4" rx="2" fill="#1a1a1a"/>
            </svg>
          </div>
          <div>
            <div className="bsd-benefits bsd-stagger">
              {benefits.map((b, i) => (
                <div key={i} className="bsd-benefit bsd-reveal">
                  <div className="bsd-benefit-icon">{Icons[BENEFIT_ICON_KEYS[b.icon] || 'zap']}</div>
                  <div>
                    <h3>{b.title}</h3>
                    <p>{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bsd-sms bsd-reveal">
              <div className="bsd-sms-head">Messages</div>
              <div className="bsd-sms-body">
                <div className="bsd-sms-bubble">
                  <strong>{branding.name}</strong>
                  <p>New call from Sarah M. at 2:47 PM. Requested a service estimate. Appointment booked Thursday at 10 AM.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// INDUSTRIES
// ============================================================================
function Industries({ config }: { config: MarketingConfig }) {
  const { industries } = config;
  return (
    <section className="bsd-section">
      <div className="bsd-container">
        <div className="bsd-section-head center">
          <span className="bsd-eyebrow">Who it&rsquo;s for</span>
          <h2>Built for businesses that can&rsquo;t afford to miss calls</h2>
        </div>
        <div className="bsd-industries bsd-stagger">
          {industries.map((ind, i) => (
            <div key={i} className="bsd-industry bsd-reveal">
              <div className="bsd-industry-icon">{Icons[INDUSTRY_ICON_KEYS[ind.icon] || 'briefcase']}</div>
              <h3>{ind.title}</h3>
              <p className="bsd-industry-sub">{ind.subtitle}</p>
              <p>{ind.description}</p>
              <div className="bsd-industry-res">{ind.result}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// COMPARISON (currency-correct competitor benchmarks, parity with Classic)
// ============================================================================
function Comparison({ config }: { config: MarketingConfig }) {
  const { branding, pricing } = config;
  const cs = config.currencySymbol || '$';
  const rate = config.currencyRate || 1;
  const pos = config.currencySymbolPosition || 'before';
  const money = (usd: number) => priceString(cs, Math.round(usd * rate).toLocaleString(), pos);
  const moneyRange = (lo: number, hi: number) => priceString(cs, `${Math.round(lo * rate).toLocaleString()}-${Math.round(hi * rate).toLocaleString()}`, pos);
  const lowest = pricing.length > 0 ? pricing[0].price : 49;
  const highest = pricing.length > 0 ? pricing[pricing.length - 1].price : 197;
  const ours = priceString(cs, `${lowest}-${highest}`, pos);

  const rows = [
    { label: 'Monthly cost', us: ours, human: moneyRange(3000, 4500), svc: moneyRange(299, 600), vm: money(0) },
    { label: 'Setup time', us: '10 min', human: '2-4 weeks', svc: '3-5 days', vm: 'Instant' },
    { label: 'Available', us: '24/7/365', human: 'Business hours', svc: '24/7', vm: '24/7' },
    { label: 'Books appointments', us: 'Yes', human: 'Yes', svc: 'Yes', vm: 'No' },
    { label: 'Text summaries', us: 'Yes', human: 'No', svc: 'No', vm: 'No' },
    { label: 'Mobile app', us: 'Yes', human: 'No', svc: 'No', vm: 'No' },
    { label: 'Trained on your business', us: 'Yes', human: 'After weeks', svc: 'Generic', vm: 'N/A' },
    { label: 'Handles multiple calls', us: 'Unlimited', human: 'One at a time', svc: 'Limited', vm: 'Unlimited' },
  ];
  const cls = (v: string) => (v === 'Yes' || v === 'Unlimited' || v === '24/7/365' || v === '10 min' || v === 'Instant') ? 'yes' : (v === 'No' || v === 'N/A') ? 'no' : '';

  return (
    <section className="bsd-section bsd-section-soft">
      <div className="bsd-container">
        <div className="bsd-section-head center">
          <span className="bsd-eyebrow">The comparison</span>
          <h2>Why {branding.name} beats every other option</h2>
        </div>
        <div className="bsd-compare-wrap bsd-reveal">
          <table className="bsd-compare">
            <thead>
              <tr>
                <th></th>
                <th className="bsd-col-us">{branding.name}</th>
                <th>Human receptionist</th>
                <th>Traditional service</th>
                <th>Just voicemail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.label}</td>
                  <td className="bsd-col-us"><span className={cls(r.us)}>{r.us}</span></td>
                  <td><span className={cls(r.human)}>{r.human}</span></td>
                  <td><span className={cls(r.svc)}>{r.svc}</span></td>
                  <td><span className={cls(r.vm)}>{r.vm}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// ROI CALCULATOR (currency-correct)
// ============================================================================
function ROICalculator({ config }: { config: MarketingConfig }) {
  const { pricing } = config;
  const cs = config.currencySymbol || '$';
  const pos = config.currencySymbolPosition || 'before';
  const lowest = pricing.length > 0 ? pricing[0].price : 49;
  const [missed, setMissed] = useState(5);
  const COST = 500;
  const monthlyMissed = Math.round(missed * 4.33);
  const monthlyLost = monthlyMissed * COST;
  const annualLost = monthlyLost * 12;
  const annualCost = lowest * 12;
  const annualSavings = annualLost - annualCost;
  const roi = annualCost > 0 ? Math.round(annualSavings / annualCost) : 0;
  const m = (n: number) => priceString(cs, n.toLocaleString(), pos);

  return (
    <section className="bsd-section">
      <div className="bsd-container">
        <div className="bsd-section-head center">
          <span className="bsd-eyebrow">Do the math</span>
          <h2>What are missed calls costing you?</h2>
          <p>The average missed call costs a small business about {m(COST)} in lost revenue. Move the slider to see yours.</p>
        </div>
        <div className="bsd-roi bsd-reveal">
          <div className="bsd-roi-top">
            <span>Calls you miss per week</span>
            <span>{missed}</span>
          </div>
          <input type="range" min={1} max={25} value={missed} onChange={e => setMissed(Number(e.target.value))} aria-label="Calls missed per week" />
          <div className="bsd-roi-scale"><span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span></div>
          <div className="bsd-roi-cards">
            <div className="bsd-roi-loss">
              <p className="k">Monthly revenue lost</p>
              <p className="v">{m(monthlyLost)}</p>
              <p className="s">{monthlyMissed} missed calls x {m(COST)}</p>
            </div>
            <div className="bsd-roi-loss">
              <p className="k">Annual revenue lost</p>
              <p className="v">{m(annualLost)}</p>
              <p className="s">Going to your competitors</p>
            </div>
          </div>
          <div className="bsd-roi-summary">
            <div className="bsd-roi-summary-grid">
              <div><p className="k">{config.branding.name} cost</p><p className="v pri">{priceString(cs, lowest, pos)}/mo</p></div>
              <div><p className="k">Annual savings</p><p className="v pos">{m(annualSavings)}</p></div>
              <div><p className="k">Return on investment</p><p className="v pos">{roi}x</p></div>
            </div>
            <a href="/get-started" className="bsd-btn bsd-btn-primary" style={{ marginTop: '1.25rem' }}>Stop losing {m(monthlyLost)}/month</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING
// ============================================================================
function Pricing({ config }: { config: MarketingConfig }) {
  const { pricing, branding } = config;
  const cs = config.currencySymbol || '$';
  const pos = config.currencySymbolPosition || 'before';
  return (
    <section id="pricing" className="bsd-section bsd-section-soft">
      <div className="bsd-container">
        <div className="bsd-section-head center">
          <span className="bsd-eyebrow">Pricing</span>
          <h2>Simple pricing. No hidden fees.</h2>
          <p>All plans include the {branding.name} app, text summaries, call recordings, and a 7-day free trial.</p>
        </div>
        <div className="bsd-pricing bsd-stagger">
          {pricing.map((tier, i) => (
            <div key={i} className={`bsd-price bsd-reveal${tier.isPopular ? ' pop' : ''}`}>
              {tier.isPopular && <div className="bsd-price-badge">{Icons.star}Most popular</div>}
              <h3>{tier.name}</h3>
              <div className="bsd-price-amt">
                {pos !== 'after' && <span className="bsd-price-cur">{cs}</span>}
                <span className="bsd-price-num">{tier.price}</span>
                {pos === 'after' && <span className="bsd-price-cur" style={{ marginTop: 0, alignSelf: 'flex-end', marginBottom: '0.35rem' }}>{cs}</span>}
                <span className="bsd-price-per">/month</span>
              </div>
              {tier.subtitle && <p className="bsd-price-sub">{tier.subtitle}</p>}
              <ul className="bsd-price-feats">
                {tier.features.map((feat, j) => (
                  <li key={j}>{feat.startsWith('Everything') ? <strong>{feat}</strong> : <>{Icons.check}<span>{feat}</span></>}</li>
                ))}
              </ul>
              {tier.note && <p className="bsd-price-note">{tier.note}</p>}
              <a href="/get-started" className={`bsd-btn bsd-btn-block ${tier.isPopular ? 'bsd-btn-primary' : 'bsd-btn-ghost'}`}>Start 7-day free trial</a>
            </div>
          ))}
        </div>
        <div className="bsd-pricing-foot">
          <p>7-day free trial, no credit card required. Cancel anytime. Setup in under 10 minutes.</p>
          {config.footer.email && <p style={{ marginTop: '0.5rem' }}>Have 500+ calls per month? <a href={`mailto:${config.footer.email}`}>Contact us for custom pricing</a></p>}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FAQ
// ============================================================================
function FAQ({ config }: { config: MarketingConfig }) {
  const { faqs } = config;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bsd-section">
      <div className="bsd-container">
        <div className="bsd-section-head center">
          <span className="bsd-eyebrow">FAQ</span>
          <h2>Questions? We&rsquo;ve got answers.</h2>
        </div>
        <div className="bsd-faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className={`bsd-faq-item${open === i ? ' open' : ''}`}>
              <button type="button" className="bsd-faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span>{faq.question}</span>
                <span className="bsd-faq-icon">+</span>
              </button>
              <div className="bsd-faq-a"><SafeFAQContent html={faq.answer} /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FINAL CTA
// ============================================================================
function FinalCTA({ config, textOnPrimary, mutedOnPrimary }: { config: MarketingConfig; textOnPrimary: string; mutedOnPrimary: string }) {
  const { hero } = config;
  return (
    <section className="bsd-final">
      <div className="bsd-container bsd-final-inner">
        <h2 style={{ color: textOnPrimary }}>Stop losing customers to voicemail</h2>
        <p style={{ color: mutedOnPrimary }}>Every missed call is money out the door. While you are on the job or closed for the night, your competitors are answering their phones.</p>
        <div className="bsd-final-actions">
          <a href="/get-started" className="bsd-btn bsd-btn-lg bsd-final-btn">Start your 7-day free trial</a>
          {hero.demoPhone && <a href={telHref(hero.demoPhone)} className="bsd-final-demo">{Icons.phone}or call the live demo: {hero.demoPhone}</a>}
          <div className="bsd-final-trust">
            <span>Setup in 10 minutes</span>
            <span>No credit card required</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer({ config }: { config: MarketingConfig }) {
  const { footer, branding } = config;
  const homeUrl = config.homepageUrl || '/';
  const tagline = (footer as { tagline?: string }).tagline || 'Professional AI that answers every call, books appointments, and sends you instant summaries, 24/7.';
  return (
    <footer className="bsd-footer">
      <div className="bsd-container">
        <div className="bsd-footer-grid">
          <div>
            <a href={homeUrl} className="bsd-footer-brand">
              {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.name} /> : <span>{branding.name}</span>}
            </a>
            <p className="bsd-footer-tag">{tagline}</p>
            <div className="bsd-footer-contact">
              {footer.phone && <a href={`tel:${footer.phone.replace(/\D/g, '')}`}>{footer.phone}</a>}
              {footer.email && <a href={`mailto:${footer.email}`}>{footer.email}</a>}
            </div>
          </div>
          <div className="bsd-footer-col">
            <h4>Product</h4>
            {footer.productLinks.map((l, i) => <a key={i} href={l.href}>{l.label}</a>)}
          </div>
          <div className="bsd-footer-col">
            <h4>Industries</h4>
            {footer.industryLinks.map((l, i) => <a key={i} href={l.href}>{l.label}</a>)}
          </div>
          <div className="bsd-footer-col">
            <h4>Company</h4>
            {(config.customNavLinks || []).map((l, i) => <a key={`fc-${i}`} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>)}
            {footer.companyLinks.map((l, i) => <a key={i} href={l.href}>{l.label}</a>)}
            {config.clientLoginPath && <a href={config.clientLoginPath}>Client login</a>}
          </div>
        </div>
        <div className="bsd-footer-bottom">
          <p>&copy; {new Date().getFullYear()} {branding.name}. All rights reserved.</p>
          <p>A2P 10DLC compliant</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// STICKY CTA
// ============================================================================
function StickyCTA({ config }: { config: MarketingConfig }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={`bsd-sticky${show ? ' show' : ''}`}>
      <a href="/get-started" className="bsd-btn bsd-btn-primary bsd-btn-sm">Start free trial</a>
    </div>
  );
}

// ============================================================================
// EXIT INTENT MODAL (desktop, once per session, after 30s)
// ============================================================================
function ExitIntentModal({ config }: { config: MarketingConfig }) {
  const { hero } = config;
  const [show, setShow] = useState(false);
  const shownRef = useRef(false);
  useEffect(() => {
    try { if (sessionStorage.getItem('bsd_exit')) shownRef.current = true; } catch {}
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !shownRef.current && window.innerWidth >= 768 && performance.now() > 30000) {
        shownRef.current = true;
        try { sessionStorage.setItem('bsd_exit', '1'); } catch {}
        setShow(true);
      }
    };
    document.addEventListener('mouseleave', onLeave);
    return () => document.removeEventListener('mouseleave', onLeave);
  }, []);
  if (!show) return null;
  return (
    <div className="bsd-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}>
      <div className="bsd-modal">
        <button type="button" className="bsd-modal-close" onClick={() => setShow(false)} aria-label="Close">{Icons.close}</button>
        <div className="bsd-modal-icon">{Icons.headphones}</div>
        <h3>Hear it before you go</h3>
        <p>See how your AI receptionist handles a real call. No signup, no commitment.</p>
        {hero.demoPhone
          ? <a href={telHref(hero.demoPhone)} className="bsd-btn bsd-btn-primary bsd-btn-lg">{Icons.phone}{hero.demoPhone}</a>
          : <a href="/get-started" className="bsd-btn bsd-btn-primary bsd-btn-lg">Start your free trial</a>}
        <a href="/get-started" className="bsd-modal-alt">Or start your free trial</a>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================
interface MarketingPageBesideProps { config?: Partial<MarketingConfig>; }

export default function MarketingPageBeside({ config: partialConfig }: MarketingPageBesideProps) {
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
  const primary = config.branding.primaryColor || '#10b981';
  const hover = config.branding.primaryHoverColor || adjustColor(primary, -12);
  const accent = config.branding.accentColor || adjustColor(primary, 14);

  const textOnPrimary = useMemo(() => getContrastTextColor(primary), [primary]);
  const mutedOnPrimary = useMemo(() => getContrastTextColorMuted(primary), [primary]);

  const revealRef = useReveal<HTMLDivElement>();

  const themeStyle = {
    '--primary-color': primary,
    '--primary-hover': hover,
    '--accent-color': accent,
    '--primary-rgb': hexToRgbString(primary),
    '--accent-rgb': hexToRgbString(accent),
    '--primary-text-color': textOnPrimary,
  } as React.CSSProperties;

  return (
    <div ref={revealRef} className={`beside theme-${theme}`} style={themeStyle}>
      <SchemaOrg config={config} />
      <AnalyticsScripts analytics={config.analytics} />
      <Nav config={config} />
      <Hero config={config} />
      <ProofStrip config={config} />
      <ProblemSolution config={config} textOnPrimary={textOnPrimary} mutedOnPrimary={mutedOnPrimary} />
      <HowItWorks config={config} />
      <FeatureExplorer config={config} />
      <CommandCenter config={config} primary={primary} textOnPrimary={textOnPrimary} />
      {config.showIndustries && <Industries config={config} />}
      {config.showComparison && <Comparison config={config} />}
      <ROICalculator config={config} />
      <Pricing config={config} />
      <FAQ config={config} />
      <FinalCTA config={config} textOnPrimary={textOnPrimary} mutedOnPrimary={mutedOnPrimary} />
      <Footer config={config} />
      <StickyCTA config={config} />
      <ExitIntentModal config={config} />
      {config.analytics?.customBodyScripts && <script dangerouslySetInnerHTML={{ __html: config.analytics.customBodyScripts }} />}
    </div>
  );
}