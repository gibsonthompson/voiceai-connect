// ============================================================================
// components/MarketingPageEditorial.tsx
// "Editorial" white-label marketing template.
//
// A magazine-style layout: a serif display hero over organic wave art, a quiet
// logo bar, alternating feature spreads, a numbered process, value cards, one
// large testimonial, editorial pricing, an FAQ accordion, and an artistic
// closing CTA. Accepts the same MarketingConfig contract as Classic and Beside,
// so signup, demo, client login, pricing, currency, custom nav links, analytics
// and light/dark theming all flow in from config with nothing hardcoded. The
// agency's brand color rides through as the live accent over the near-black ink.
// ============================================================================
'use client';

import React, { useState } from 'react';
import { MarketingConfig, defaultMarketingConfig } from '@/types/marketing';
import '@/styles/marketing-editorial.css';

// ============================================================================
// COLOR UTILITIES (shared behavior with Classic/Beside so contrast is identical)
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
function getContrastTextColor(bgHex: string): string { return isLightColor(bgHex) ? '#141210' : '#ffffff'; }
function adjustColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const R = clamp(rgb.r + amt), G = clamp(rgb.g + amt), B = clamp(rgb.b + amt);
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

// ============================================================================
// ICONS (same key set as Classic/Beside so feature/benefit icons resolve)
// ============================================================================
const Icons: Record<string, React.ReactElement> = {
  phone: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>),
  calendar: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  message: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  transfer: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>),
  training: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.8a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>),
  moon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>),
  mic: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>),
  smartphone: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>),
  chart: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
  bell: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>),
  check: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  star: (<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  arrow: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>),
};
const FEATURE_ICON_KEYS: Record<string, string> = { calendar: 'calendar', message: 'message', transfer: 'transfer', training: 'training', moon: 'moon', mic: 'mic' };
const BENEFIT_ICON_KEYS: Record<string, string> = { smartphone: 'smartphone', phone: 'phone', chart: 'chart', bell: 'bell' };
function featureIcon(key: string) { return Icons[FEATURE_ICON_KEYS[key] || key] || Icons.check; }
function benefitIcon(key: string) { return Icons[BENEFIT_ICON_KEYS[key] || key] || Icons.check; }

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
  return <div className="ed-faq-a-inner">{elements}</div>;
}

// ============================================================================
// SCHEMA.ORG + ANALYTICS (parity with Classic/Beside)
// ============================================================================
function SchemaOrg({ config }: { config: MarketingConfig }) {
  const priceCurrency = config.currencyCode || 'USD';
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: config.faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer.replace(/<[^>]*>/g, '') } })) };
  const productSchema = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: config.branding.name, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: config.pricing.map(tier => ({ '@type': 'Offer', name: tier.name, price: tier.price, priceCurrency, description: tier.subtitle })) };
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} /></>);
}
function AnalyticsScripts({ analytics }: { analytics?: MarketingConfig['analytics'] }) {
  if (!analytics) return null;
  const scripts: string[] = [];
  if (analytics.gtmId) { scripts.push(`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${analytics.gtmId}');`); }
  if (analytics.googleAnalyticsId) { scripts.push(`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analytics.googleAnalyticsId}');`); }
  if (analytics.fbPixelId) { scripts.push(`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${analytics.fbPixelId}');fbq('track','PageView');`); }
  return (<>{analytics.googleAnalyticsId && <script async src={`https://www.googletagmanager.com/gtag/js?id=${analytics.googleAnalyticsId}`} />}{scripts.length > 0 && <script dangerouslySetInnerHTML={{ __html: scripts.join('\n') }} />}{analytics.customHeadScripts && <script dangerouslySetInnerHTML={{ __html: analytics.customHeadScripts }} />}</>);
}

// ============================================================================
// SHARED HELPERS
// ============================================================================
function telHref(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return 'tel:';
  if (digits.length === 11 && digits[0] === '1') return `tel:+${digits}`;
  if (digits.length === 10) return `tel:+1${digits}`;
  if ((phone || '').trim().startsWith('+')) return `tel:+${digits}`;
  return `tel:+1${digits}`;
}
function priceString(cs: string, amount: number | string, pos?: 'before' | 'after') {
  return pos === 'after' ? `${amount} ${cs}` : `${cs}${amount}`;
}

// Column count that never leaves a single item stranded on a row. If a leftover
// item would sit alone, it spans the full row instead (wideLast).
function balancedGrid(n: number): { cols: number; wideLast: boolean } {
  const cols = n % 3 === 0 ? 3 : n % 2 === 0 ? 2 : 3;
  return { cols, wideLast: n % cols === 1 };
}

// Organic wave illustration, the signature editorial device. Tinted with the
// agency accent so the brand carries through the artwork.
function Wave({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true" style={flip ? { transform: 'scaleY(-1)' } : undefined}>
      <path d="M0,96 C240,150 480,30 720,72 C960,114 1200,168 1440,120 L1440,180 L0,180 Z" fill="currentColor" opacity="0.10" />
      <path d="M0,120 C260,60 520,168 780,108 C1040,48 1240,120 1440,96" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
    </svg>
  );
}

// ============================================================================
// NAV
// ============================================================================
function Nav({ config }: { config: MarketingConfig }) {
  const { branding } = config;
  const homeUrl = config.homepageUrl || '/';
  return (
    <nav className="ed-nav">
      <div className="ed-container ed-nav-inner">
        <a href={homeUrl} className="ed-logo">
          {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.name} /> : <span>{branding.name}</span>}
        </a>
        <ul className="ed-nav-links">
          {(config.customNavLinks || []).map((link, i) => (
            <li key={`nav-custom-${i}`}><a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a></li>
          ))}
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="/faq">FAQ</a></li>
        </ul>
        <div className="ed-nav-actions">
          {config.clientLoginPath && <a href={config.clientLoginPath} className="ed-nav-login">Client login</a>}
          <a href="/signup" className="ed-btn ed-btn-primary ed-btn-sm">Start free trial</a>
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// HERO (serif display over wave art)
// ============================================================================
function Hero({ config }: { config: MarketingConfig }) {
  const { hero } = config;
  const hasDemo = Boolean(hero.demoPhone && hero.demoPhone.trim());
  return (
    <header className="ed-hero">
      <div className="ed-container ed-hero-inner">
        {hero.badge && <p className="ed-hero-badge">{hero.badge}</p>}
        <h1 className="ed-hero-title">{(Array.isArray(hero.headline) ? hero.headline : [hero.headline]).map((line, i) => <span key={i}>{line}</span>)}</h1>
        {hero.subtitle && <p className="ed-hero-sub">{hero.subtitle}</p>}
        {hero.description && <p className="ed-hero-desc">{hero.description}</p>}
        <div className="ed-hero-cta">
          <a href="/signup" className="ed-btn ed-btn-primary">Start free trial</a>
          {hasDemo
            ? <a href={telHref(hero.demoPhone)} className="ed-btn ed-btn-line">{hero.demoInstructions || `Hear it: ${hero.demoPhone}`}</a>
            : <a href="#how" className="ed-btn ed-btn-line">See how it works</a>}
        </div>
        {hero.trustItems && hero.trustItems.length > 0 && (
          <ul className="ed-hero-trust">
            {hero.trustItems.map((t, i) => <li key={i}><span className="ed-tick">{Icons.check}</span>{t}</li>)}
          </ul>
        )}
      </div>
      <div className="ed-hero-wave ed-accent"><Wave /></div>
    </header>
  );
}

// ============================================================================
// FEATURES (balanced editorial grid, icon-forward, never a lonely row)
// ============================================================================
function Features({ config }: { config: MarketingConfig }) {
  const features = config.features || [];
  if (features.length === 0) return null;
  const odd = features.length % 2 === 1;
  const lead = config.solution?.paragraphs?.[0];
  return (
    <section className="ed-features" id="features">
      <div className="ed-container">
        <div className="ed-feat-head">
          <h2 className="ed-h2">{config.solution?.headline || 'Everything the phone needs to do'}</h2>
          {lead && <p className="ed-feat-head-p">{lead}</p>}
        </div>
        <div className="ed-feat-grid">
          {features.map((f, i) => (
            <article className={`ed-feat ${odd && i === features.length - 1 ? 'ed-cell-wide' : ''}`} key={i}>
              <span className="ed-feat-ico">{featureIcon(f.icon)}</span>
              <div className="ed-feat-body">
                <h3 className="ed-feat-title">{f.title}</h3>
                <p className="ed-feat-desc">{f.description}</p>
                {f.example && <p className="ed-feat-eg">{f.example}</p>}
                {f.integrations && f.integrations.length > 0 && (
                  <ul className="ed-feat-tags">{f.integrations.map((t, j) => <li key={j}>{t}</li>)}</ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// NUMBERED STEPS (a real sequence, so the numbers are earned)
// ============================================================================
function Steps({ config }: { config: MarketingConfig }) {
  const steps = config.steps || [];
  if (steps.length === 0) return null;
  return (
    <section className="ed-steps" id="how">
      <div className="ed-container">
        <div className="ed-section-head"><h2 className="ed-h2">How it works</h2></div>
        <ol className="ed-step-list">
          {steps.map((s, i) => (
            <li className="ed-step" key={i}>
              <span className="ed-step-n">{String(i + 1).padStart(2, '0')}</span>
              <div className="ed-step-body">
                <h3 className="ed-h3">{s.title}</h3>
                <p>{s.description}</p>
                {s.time && <span className="ed-step-time">{s.time}</span>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ============================================================================
// VALUE PROP CARDS (benefits)
// ============================================================================
function ValueCards({ config }: { config: MarketingConfig }) {
  const benefits = config.benefits || [];
  if (benefits.length === 0) return null;
  const { cols, wideLast } = balancedGrid(benefits.length);
  return (
    <section className="ed-values">
      <div className="ed-container">
        <div className={`ed-value-grid ed-cols-${cols}`}>
          {benefits.map((b, i) => (
            <article className={`ed-value ${wideLast && i === benefits.length - 1 ? 'ed-cell-wide' : ''}`} key={i}>
              <span className="ed-value-ico ed-accent">{benefitIcon(b.icon)}</span>
              <h3 className="ed-h3">{b.title}</h3>
              <p>{b.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SINGLE LARGE TESTIMONIAL
// ============================================================================
function Testimonial({ config }: { config: MarketingConfig }) {
  const t = (config.testimonials || [])[0];
  if (!t) return null;
  return (
    <section className="ed-quote">
      <div className="ed-container ed-quote-inner">
        <div className="ed-quote-stars ed-accent">{Array.from({ length: t.rating || 5 }).map((_, i) => <span key={i}>{Icons.star}</span>)}</div>
        <blockquote className="ed-quote-text">{t.quote}</blockquote>
        <div className="ed-quote-by">
          <span className="ed-quote-name">{t.authorName}</span>
          {t.authorTitle && <span className="ed-quote-title">{t.authorTitle}</span>}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING (editorial, but a marketing site needs it)
// ============================================================================
function Pricing({ config }: { config: MarketingConfig }) {
  const tiers = config.pricing || [];
  const cs = config.currencySymbol || '$';
  const pos = config.currencySymbolPosition;
  if (tiers.length === 0) return null;
  const { cols, wideLast } = balancedGrid(tiers.length);
  return (
    <section className="ed-pricing" id="pricing">
      <div className="ed-container">
        <div className="ed-section-head"><h2 className="ed-h2">Simple pricing</h2></div>
        <div className={`ed-price-grid ed-cols-${cols}`}>
          {tiers.map((t, i) => (
            <article className={`ed-price ${t.isPopular ? 'ed-price-pop' : ''} ${wideLast && i === tiers.length - 1 ? 'ed-cell-wide' : ''}`} key={i}>
              {t.isPopular && <span className="ed-price-flag ed-accent-bg">Most popular</span>}
              <h3 className="ed-price-name">{t.name}</h3>
              {t.subtitle && <p className="ed-price-sub">{t.subtitle}</p>}
              <p className="ed-price-amt">{priceString(cs, t.price, pos)}<span>/mo</span></p>
              <ul className="ed-price-feats">
                {t.features.map((f, j) => <li key={j}><span className="ed-tick ed-accent">{Icons.check}</span>{f}</li>)}
              </ul>
              <a href={t.planKey ? `/signup?plan=${t.planKey}` : '/signup'} className={`ed-btn ${t.isPopular ? 'ed-btn-primary' : 'ed-btn-line'} ed-btn-full`}>Start free trial</a>
              {t.note && <p className="ed-price-note">{t.note}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FAQ ACCORDION
// ============================================================================
function FAQ({ config }: { config: MarketingConfig }) {
  const faqs = config.faqs || [];
  const [open, setOpen] = useState<number | null>(0);
  if (faqs.length === 0) return null;
  return (
    <section className="ed-faq" id="faq">
      <div className="ed-container ed-faq-inner">
        <div className="ed-section-head"><h2 className="ed-h2">Questions</h2></div>
        <div className="ed-faq-list">
          {faqs.map((f, i) => (
            <div className={`ed-faq-item ${open === i ? 'ed-open' : ''}`} key={i}>
              <button type="button" className="ed-faq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span>{f.question}</span>
                <span className="ed-faq-mark">{open === i ? '\u2212' : '+'}</span>
              </button>
              {open === i && <div className="ed-faq-a"><SafeFAQContent html={f.answer} /></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FINAL CTA (artistic close, wave art)
// ============================================================================
function FinalCTA({ config }: { config: MarketingConfig }) {
  const { hero, branding } = config;
  const hasDemo = Boolean(hero.demoPhone && hero.demoPhone.trim());
  return (
    <section className="ed-final ed-accent-bg">
      <div className="ed-final-wave"><Wave /></div>
      <div className="ed-container ed-final-inner">
        <h2 className="ed-final-title">Never miss another call</h2>
        <p className="ed-final-sub">Set up {branding.name} in minutes. Your AI answers the very next ring.</p>
        <div className="ed-final-cta">
          <a href="/signup" className="ed-btn ed-btn-on-accent">Start free trial</a>
          {hasDemo && <a href={telHref(hero.demoPhone)} className="ed-btn ed-btn-on-accent-line">{hero.demoInstructions || `Call ${hero.demoPhone}`}</a>}
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
  const year = new Date().getFullYear();
  const groups = [
    { head: 'Product', links: footer.productLinks || [] },
    { head: 'Industries', links: footer.industryLinks || [] },
    { head: 'Company', links: footer.companyLinks || [] },
  ].filter(g => g.links.length > 0);
  return (
    <footer className="ed-footer">
      <div className="ed-container ed-footer-grid">
        <div className="ed-footer-brand">
          <a href={homeUrl} className="ed-logo">{branding.logoUrl ? <img src={branding.logoUrl} alt={branding.name} /> : <span>{branding.name}</span>}</a>
          {footer.address && <p className="ed-footer-addr">{footer.address}</p>}
          <div className="ed-footer-contact">
            {footer.phone && <a href={`tel:${footer.phone.replace(/\D/g, '')}`}>{footer.phone}</a>}
            {footer.email && <a href={`mailto:${footer.email}`}>{footer.email}</a>}
          </div>
        </div>
        {groups.map((g, gi) => (
          <nav className="ed-footer-col" key={gi}>
            <h4 className="ed-footer-head">{g.head}</h4>
            <ul>
              {g.links.map((l, j) => <li key={j}><a href={l.href}>{l.label}</a></li>)}
              {gi === groups.length - 1 && config.clientLoginPath && <li><a href={config.clientLoginPath}>Client login</a></li>}
            </ul>
          </nav>
        ))}
      </div>
      <div className="ed-container ed-footer-legal"><span>&copy; {year} {branding.name}. All rights reserved.</span></div>
    </footer>
  );
}

// ============================================================================
// MAIN
// ============================================================================
export default function MarketingPageEditorial({ config: partial }: { config: Partial<MarketingConfig> }) {
  const config: MarketingConfig = { ...defaultMarketingConfig, ...partial } as MarketingConfig;
  const theme = config.theme === 'dark' ? 'dark' : 'light';
  const primary = config.branding.primaryColor || '#10b981';
  const hover = config.branding.primaryHoverColor || adjustColor(primary, -12);
  const accent = config.branding.accentColor || adjustColor(primary, 14);

  const themeStyle = {
    '--ed-primary': primary,
    '--ed-primary-hover': hover,
    '--ed-accent': accent,
    '--ed-primary-rgb': hexToRgbString(primary),
    '--ed-on-accent': getContrastTextColor(primary),
  } as React.CSSProperties;

  return (
    <div className={`editorial ed-theme-${theme}`} style={themeStyle}>
      <SchemaOrg config={config} />
      <AnalyticsScripts analytics={config.analytics} />
      <Nav config={config} />
      <Hero config={config} />
      {config.showFeatures !== false && <Features config={config} />}
      {config.showHowItWorks !== false && <Steps config={config} />}
      {config.showFeatures !== false && <ValueCards config={config} />}
      {config.showTestimonials !== false && <Testimonial config={config} />}
      {config.showPricing !== false && <Pricing config={config} />}
      {config.showFAQ !== false && <FAQ config={config} />}
      {config.showFinalCTA !== false && <FinalCTA config={config} />}
      <Footer config={config} />
      {config.analytics?.customBodyScripts && <script dangerouslySetInnerHTML={{ __html: config.analytics.customBodyScripts }} />}
    </div>
  );
}