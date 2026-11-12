// components/MarketingPage.tsx
'use client';
import { openAgencySupport, visibleFooterLinks, isSupportLink } from '@/lib/marketing-links';
import CustomScripts from './CustomScripts';
import { Editable, ItemAdd, ItemRemove } from '@/components/agency/MarketingEditable';
import { resolveSectionOrder } from '@/lib/marketing-sections';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MarketingConfig, defaultMarketingConfig } from '@/types/marketing';
import '@/styles/marketing.css';

// ============================================================================
// PHONE UTILITIES
// ============================================================================
// Build a dialable tel: href in E.164 without double-prefixing the country
// code. A demo number stored WITH its country code (e.g. "15058332344" or
// "+1 505 833 2344") would become "+11505..." if we blindly prepend "+1",
// that "+11" is why tapping the demo number failed to dial. Normalize instead.
function telHref(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return 'tel:';
  if (digits.length === 11 && digits[0] === '1') return `tel:+${digits}`; // already has US country code
  if (digits.length === 10) return `tel:+1${digits}`;                      // bare US 10-digit
  if ((phone || '').trim().startsWith('+')) return `tel:+${digits}`;       // already E.164 (intl)
  return `tel:+1${digits}`;                                                // fallback: assume US
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace(/^#/, '');
  const fullHex = cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex;
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

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
  car: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.5-1.5-1.5H18l-2-3.5c-.3-.6-.9-1-1.5-1H9c-.6 0-1.2.4-1.5 1L5.5 11.5H3.5C2.7 11.5 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/></svg>),
  medspa: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M5 16.5l.7 1.8 1.8.7-1.8.7L5 21.5l-.7-1.8-1.8-.7 1.8-.7z"/></svg>),
  legal: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M6 21h12"/><path d="M5 7l7-2 7 2"/><path d="M5 7l-2.5 5a2.5 2.5 0 0 0 5 0z"/><path d="M19 7l-2.5 5a2.5 2.5 0 0 0 5 0z"/></svg>),
  star: (<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  user: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  close: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
};

// ============================================================================
// SHARED TYPES
// ============================================================================
interface ContrastColors { text: string; textMuted: string; buttonBg: string; isLight: boolean; }

// ============================================================================
// SAFE FAQ RENDERER
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
    if (lower === '<li>' || lower === '</li>') continue;
    if (lower === '<p>') continue;
    if (lower === '</p>') { elements.push(<br key={key++} />); continue; }
    if (lower === '<br>' || lower === '<br/>') { elements.push(<br key={key++} />); continue; }
    if (lower === '<strong>' || lower === '</strong>') continue;
    if (part.trim() && !part.startsWith('<')) {
      const prevTag = i > 0 ? parts[i - 1]?.toLowerCase().trim() : '';
      const textNode = prevTag === '<strong>' ? <strong key={key++}>{part}</strong> : <span key={key++}>{part}</span>;
      if (inList) { listItems.push(<li key={key++} style={{ marginBottom: '0.375rem' }}>{textNode}</li>); } else { elements.push(textNode); }
    }
  }
  return <div className="faq-answer-content">{elements}</div>;
}

// ============================================================================
// SCHEMA.ORG STRUCTURED DATA
// ============================================================================
function SchemaOrg({ config }: { config: MarketingConfig }) {
  const priceCurrency = config.currencyCode || 'USD';
  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: config.faqs.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer.replace(/<[^>]*>/g, '') } })) };
  const productSchema = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: config.branding.name, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: config.pricing.map(tier => ({ '@type': 'Offer', name: tier.name, price: tier.price, priceCurrency, description: tier.subtitle })) };
  return (<><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} /></>);
}

// ============================================================================
// ANALYTICS SCRIPTS
// ============================================================================
function AnalyticsScripts({ analytics }: { analytics?: MarketingConfig['analytics'] }) {
  if (!analytics) return null;
  const scripts: string[] = [];
  if (analytics.gtmId) { scripts.push(`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${analytics.gtmId}');`); }
  if (analytics.googleAnalyticsId) { scripts.push(`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analytics.googleAnalyticsId}');`); }
  if (analytics.fbPixelId) { scripts.push(`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${analytics.fbPixelId}');fbq('track','PageView');`); }
  return (<>{analytics.googleAnalyticsId && <script async src={`https://www.googletagmanager.com/gtag/js?id=${analytics.googleAnalyticsId}`} />}{scripts.length > 0 && <script dangerouslySetInnerHTML={{ __html: scripts.join('\n') }} />}<CustomScripts html={analytics.customHeadScripts} target="head" /></>);
}

// ============================================================================
// NAVIGATION
// ============================================================================
function Navigation({ config }: { config: MarketingConfig }) {
  const { branding } = config;
  const homeUrl = config.homepageUrl || '/';
  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <a href={homeUrl} className="logo">
            {branding.logoUrl ? (
              <div className="logo-wrapper">
                <img src={branding.logoUrl} alt={branding.name} className="logo-image" />
              </div>
            ) : (
              <span className="logo-text">{branding.name}</span>
            )}
          </a>
          <ul className="nav-links">
            {(config.customNavLinks || []).filter((link) => { const u = (link.url || '').toLowerCase(); if (config.showHowItWorks === false && u.includes('#how-it-works')) return false; if (config.showFeatures === false && u.includes('#features')) return false; if (config.showPricing === false && u.includes('#pricing')) return false; if (config.showFAQ === false && u.includes('#faq')) return false; return true; }).map((link, i) => (
              <li key={`custom-nav-${i}`}>{isSupportLink(link.url, link.label) ? <a href="#support" onClick={(e) => { e.preventDefault(); openAgencySupport(); }}>{link.label}</a> : <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>}</li>
            ))}
            {config.showFeatures !== false && <li><a href="#features">Features</a></li>}
            {config.showHowItWorks !== false && <li><a href="#how-it-works">How It Works</a></li>}
            {config.hero?.demoPhone && <li><a href="/demo">Demo</a></li>}
            {config.showPricing !== false && <li><a href="#pricing">Pricing</a></li>}
            {config.showFAQ !== false && <li><a href="/faq">FAQ</a></li>}
          </ul>
          <div className="nav-actions">
            {config.footer.phone && <a href={`tel:${config.footer.phone.replace(/\D/g, '')}`} className="btn-ghost">Call Us</a>}
            <a href="/signup" className="btn-primary">Start Free Trial</a>
          </div>
        </div>
      </div>
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
          <div className="hero-badge"><span className="badge-dot"></span><Editable as="span" field="hero.badge" value={hero.badge}>{hero.badge}</Editable></div>
          <Editable as="h1" className="hero-title" field="hero.headline" multiline value={(Array.isArray(hero.headline) ? hero.headline : [hero.headline]).join('\n')}>
            {hero.headline.map((line, i) => (<span key={i} style={{ display: 'block' }}>{line}</span>))}
          </Editable>
          <Editable as="p" className="hero-subtitle" field="hero.description" value={hero.description}>{hero.description}</Editable>
          <div className="hero-ctas">
            <a href="/signup" className="btn-large btn-primary">{config.signup?.trialDays === 0 ? 'Get Started' : `Start Free Trial, ${config.signup?.trialDays ?? 7} Day${(config.signup?.trialDays ?? 7) === 1 ? '' : 's'} Free`}</a>
            {hero.demoPhone ? (
              <a href="/demo" className="btn-large btn-ghost">
                <span style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', display: 'inline-flex' }}>{Icons.phone}</span>Try Live Demo
              </a>
            ) : (config.showHowItWorks !== false ? <a href="#how-it-works" className="btn-large btn-ghost">See How It Works</a> : null)}
          </div>
          <div className="trust-bar">
            {hero.trustItems.map((item, i) => (<div key={i} className="trust-item">✓ <Editable as="span" field={`hero.trustItems.${i}`} value={item}>{item}</Editable></div>))}
          </div>
          {hero.videoUrl && (
            <div className="hero-video"><div className="hero-video-wrapper">
              <iframe src={hero.videoUrl} title={`${branding.name} Demo Video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div></div>
          )}
          {hero.demoPhone && (
            <div className="demo-cta">
              <div className="demo-box" style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.primaryHoverColor} 100%)`, color: contrastColors.text }}>
                <div className="demo-icon" style={{ color: contrastColors.text }}>{Icons.headphones}</div>
                <div className="demo-content">
                  <h3 style={{ color: contrastColors.text }}>HEAR IT IN ACTION:</h3>
                  <a href={telHref(hero.demoPhone)} className="demo-phone" style={{ color: contrastColors.text, background: contrastColors.buttonBg }}>
                    <span style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}>{Icons.phone}</span>{hero.demoPhone}
                  </a>
                  {hero.demoInstructions && <Editable as="p" className="demo-instructions" style={{ color: contrastColors.textMuted }} field="hero.demoInstructions" value={hero.demoInstructions}>{hero.demoInstructions}</Editable>}
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
// PROBLEM/SOLUTION SECTION
// ============================================================================
function ProblemSolutionSection({ config, contrastColors }: { config: MarketingConfig; contrastColors: ContrastColors }) {
  const { problems, solution, branding } = config;
  return (
    <section className="problem-solution">
      <div className="container">
        <div className="section-header"><Editable as="h2" field="sectionHeadings.problemHeadline" value={config.sectionHeadings?.problemHeadline ?? "You're Losing Customers Every Time Your Phone Rings"}>{config.sectionHeadings?.problemHeadline ?? "You're Losing Customers Every Time Your Phone Rings"}</Editable></div>
        <div className="problems-grid">
          {problems.map((problem, i) => (
            <div key={i} className="problem-card">
              <div className="problem-icon">{Icons.x}</div>
              <Editable as="h3" field={`problems.${i}.title`} value={problem.title}>{problem.title}</Editable>
              <p>&quot;<Editable as="span" field={`problems.${i}.description`} value={problem.description}>{problem.description}</Editable>&quot;</p>
              <ItemRemove path="problems" index={i} label="problem" />
            </div>
          ))}
        </div>
        <ItemAdd path="problems" label="problem" />
        <div className="solution-box" style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.primaryHoverColor} 100%)`, color: contrastColors.text }}>
          <h2 style={{ color: contrastColors.text }}>{branding.name} Is <Editable as="span" field="solution.headline" value={solution.headline}>{solution.headline}</Editable></h2>
          {solution.paragraphs.map((p, i) => (<Editable as="p" key={i} className="solution-text" style={{ color: contrastColors.textMuted }} field={`solution.paragraphs.${i}`} value={p}>{p}</Editable>))}
          <p className="solution-highlight" style={{ background: contrastColors.buttonBg, color: contrastColors.text }}>
            <strong style={{ color: contrastColors.isLight ? branding.primaryHoverColor : branding.accentColor }}>And here&apos;s the best part:</strong>{' '}<Editable as="span" field="solution.highlight" value={solution.highlight}>{solution.highlight}</Editable>
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
        <div className="section-header"><Editable as="h2" field="stepsHeading" value={config.stepsHeading || 'From signup to your first answered call'}>{config.stepsHeading || 'From signup to your first answered call'}</Editable><Editable as="p" className="subtitle" field="stepsSubheading" value={config.stepsSubheading || 'A few simple steps, no tech skills required.'}>{config.stepsSubheading || 'A few simple steps, no tech skills required.'}</Editable></div>
        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{i + 1}</div>
              <div className="step-icon">{stepIcons[i] || Icons.zap}</div>
              <Editable as="h3" field={`steps.${i}.title`} value={step.title}>{step.title}</Editable>
              <Editable as="p" field={`steps.${i}.description`} value={step.description}>{step.description}</Editable>
              <div className="step-time"><span style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }}>{Icons.clock}</span><Editable as="span" field={`steps.${i}.time`} value={step.time}>{step.time}</Editable></div>
              <ItemRemove path="steps" index={i} label="step" />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}><ItemAdd path="steps" label="step" /></div>
        <div className="cta-box">
          <a href="/signup" className="btn-large btn-primary">{config.signup?.trialDays === 0 ? 'Get Started' : `Start Your ${config.signup?.trialDays ?? 7}-Day Free Trial`}</a>
          <p className="cta-subtext">{config.signup?.cardRequired ? '' : 'No credit card required. '}Your AI receptionist is ready{config.stats?.setupTime ? ` in ${config.stats.setupTime}` : ''}.</p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// APP SHOWCASE
// ============================================================================
function AppShowcaseSection({ config, contrastColors }: { config: MarketingConfig; contrastColors: ContrastColors }) {
  const { benefits, branding } = config;
  const benefitIcons: Record<string, React.ReactElement> = { smartphone: Icons.smartphone, phone: Icons.phone, chart: Icons.chart, bell: Icons.bell };
  const primaryRgb = hexToRgb(branding.primaryColor);
  const tintBg = primaryRgb ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.08)` : 'rgba(18, 32, 146, 0.08)';
  const tintBgStrong = primaryRgb ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.15)` : 'rgba(18, 32, 146, 0.15)';

  return (
    <section className="app-showcase">
      <div className="container">
        <div className="section-header">
          <Editable as="h2" field="sectionHeadings.commandCenterHeadline" value={config.sectionHeadings?.commandCenterHeadline ?? 'See Every Conversation. Manage Everything from Your Phone.'}>{config.sectionHeadings?.commandCenterHeadline ?? 'See Every Conversation. Manage Everything from Your Phone.'}</Editable>
          <p>Unlike old-school answering services that just take messages, {branding.name} gives you a complete command center for every customer interaction.</p>
        </div>
        <div className="app-features">
          <div className="app-screenshot">
            <div className="dashboard-mockup">
              <svg viewBox="0 0 320 640" fill="none" className="dashboard-image" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                <rect x="8" y="8" width="304" height="624" rx="40" fill="#1a1a1a" stroke="#333" strokeWidth="2"/>
                <rect x="18" y="18" width="284" height="604" rx="32" fill="#f8fafc"/>
                <rect x="18" y="18" width="284" height="42" rx="32" fill="#1a1a1a"/>
                <rect x="18" y="40" width="284" height="16" fill="#1a1a1a"/>
                <rect x="115" y="24" width="90" height="28" rx="14" fill="#1a1a1a"/>
                <rect x="18" y="56" width="284" height="44" fill={branding.primaryColor}/>
                <path d="M36 78 L44 70 M36 78 L44 86" stroke={contrastColors.text} strokeWidth="2" strokeLinecap="round"/>
                <text x="160" y="82" textAnchor="middle" fontFamily="system-ui" fontSize="15" fontWeight="600" fill={contrastColors.text}>Call Details</text>
                <rect x="18" y="100" width="284" height="56" fill="white"/>
                <text x="32" y="124" fontFamily="system-ui" fontSize="15" fontWeight="700" fill="#1f2937">{config.sampleCall?.customerName || 'Jordan Blake'}</text>
                <text x="32" y="142" fontFamily="system-ui" fontSize="11" fill="#6b7280">Today, 2:34 PM · 3m 42s</text>
                <rect x="224" y="114" width="64" height="24" rx="12" fill={tintBg} stroke={tintBgStrong} strokeWidth="1"/>
                <text x="256" y="130" textAnchor="middle" fontFamily="system-ui" fontSize="10" fontWeight="600" fill={branding.primaryColor}>Normal</text>
                <rect x="26" y="170" width="268" height="136" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                <rect x="38" y="182" width="28" height="28" rx="8" fill={tintBg}/>
                <path d="M48 192 L48 200 M52 192 L56 196 L52 200 M48 196 L56 196" stroke={branding.primaryColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <text x="74" y="201" fontFamily="system-ui" fontSize="12" fontWeight="700" fill="#1f2937">AI Summary</text>
                <text fontFamily="system-ui" fontSize="11" fill="#6b7280">
                  <tspan x="38" y="228">Caller wanted to book an</tspan>
                  <tspan x="38" dy="17">appointment and asked for the</tspan>
                  <tspan x="38" dy="17">next available time. Requested a</tspan>
                  <tspan x="38" dy="17">callback to confirm.</tspan>
                </text>
                <rect x="26" y="320" width="268" height="64" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                <text x="38" y="345" fontFamily="system-ui" fontSize="12" fontWeight="700" fill="#1f2937">Call Recording</text>
                <rect x="38" y="356" width="244" height="14" rx="7" fill="#f3f4f6"/>
                <rect x="38" y="356" width="110" height="14" rx="7" fill={branding.primaryColor} opacity="0.4"/>
                <circle cx="148" cy="363" r="5" fill={branding.primaryColor}/>
                <text x="258" y="367" textAnchor="end" fontFamily="system-ui" fontSize="9" fill="#6b7280">1:24 / 3:42</text>
                <rect x="26" y="398" width="268" height="136" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                <text x="38" y="422" fontFamily="system-ui" fontSize="12" fontWeight="700" fill="#1f2937">Contact Details</text>
                <rect x="38" y="434" width="24" height="24" rx="6" fill="#f3f4f6"/>
                <circle cx="50" cy="442" r="4" stroke="#9ca3af" strokeWidth="1.2" fill="none"/>
                <path d="M44 451 Q50 447 56 451" stroke="#9ca3af" strokeWidth="1.2" fill="none"/>
                <text x="70" y="440" fontFamily="system-ui" fontSize="9" fill="#9ca3af">Name</text>
                <text x="70" y="453" fontFamily="system-ui" fontSize="11" fill="#1f2937">{config.sampleCall?.customerName || 'Jordan Blake'}</text>
                <rect x="38" y="468" width="24" height="24" rx="6" fill="#f3f4f6"/>
                <path d="M47 474 C47 474 47 480 51 484" stroke="#9ca3af" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <text x="70" y="476" fontFamily="system-ui" fontSize="9" fill="#9ca3af">Phone</text>
                <text x="70" y="489" fontFamily="system-ui" fontSize="11" fill={branding.primaryColor}>(555) 123-4567</text>
                <rect x="38" y="502" width="24" height="24" rx="6" fill="#f3f4f6"/>
                <rect x="45" y="509" width="10" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.2" fill="none"/>
                <text x="70" y="510" fontFamily="system-ui" fontSize="9" fill="#9ca3af">Service</text>
                <text x="70" y="523" fontFamily="system-ui" fontSize="11" fill="#1f2937">{config.sampleCall?.service || 'Appointment booking'}</text>
                <rect x="26" y="550" width="130" height="40" rx="20" fill={branding.primaryColor}/>
                <text x="91" y="574" textAnchor="middle" fontFamily="system-ui" fontSize="12" fontWeight="600" fill={contrastColors.text}>Call Back</text>
                <rect x="164" y="550" width="130" height="40" rx="20" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                <text x="229" y="574" textAnchor="middle" fontFamily="system-ui" fontSize="12" fontWeight="600" fill="#374151">Send SMS</text>
                <rect x="120" y="606" width="80" height="4" rx="2" fill="#1a1a1a"/>
              </svg>
            </div>
          </div>
          <div className="app-benefits">
            {benefits.map((benefit, i) => (
              <div key={i} className="benefit-item">
                <div className="benefit-icon">{benefitIcons[benefit.icon] || Icons.zap}</div>
                <Editable as="h3" field={`benefits.${i}.title`} value={benefit.title}>{benefit.title}</Editable>
                <Editable as="p" field={`benefits.${i}.description`} value={benefit.description}>{benefit.description}</Editable>
                <ItemRemove path="benefits" index={i} label="benefit" />
              </div>
            ))}
            <ItemAdd path="benefits" label="benefit" />
          </div>
        </div>
        <div className="sms-example">
          <div className="sms-mockup">
            <div className="sms-header" style={{ background: branding.primaryColor }}>Messages</div>
            <div className="sms-content">
              <div className="sms-message">
                <strong>{branding.name}</strong>
                <p>New call from <Editable as="span" field="sampleCall.customerName" value={config.sampleCall?.customerName || 'Jordan Blake'}>{config.sampleCall?.customerName || 'Jordan Blake'}</Editable> at 2:47pm</p>
                <p><strong>Requested:</strong> <Editable as="span" field="sampleCall.service" value={config.sampleCall?.service || 'Appointment booking'}>{config.sampleCall?.service || 'Appointment booking'}</Editable><br/><strong>Phone:</strong> (555) 123-4567<br/><strong>Appointment booked:</strong> Thursday at 10am</p>
                <span className="sms-link">View Full Call in App</span>
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
        <div className="section-header"><Editable as="h2" field="sectionHeadings.featuresHeadline" value={config.sectionHeadings?.featuresHeadline ?? "Everything You Need. Nothing You Don't."}>{config.sectionHeadings?.featuresHeadline ?? "Everything You Need. Nothing You Don't."}</Editable></div>
        <div className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{featureIcons[feature.icon] || Icons.zap}</div>
              <Editable as="h3" field={`features.${i}.title`} value={feature.title}>{feature.title}</Editable>
              <Editable as="p" field={`features.${i}.description`} value={feature.description}>{feature.description}</Editable>
              {feature.integrations && <div className="feature-integrations">{feature.integrations.map((int, j) => <span key={j}>✓ {int}</span>)}</div>}
              {feature.highlight && <Editable as="p" className="feature-highlight" field={`features.${i}.highlight`} value={feature.highlight}>{feature.highlight}</Editable>}
              {feature.example && <Editable as="div" className="feature-example" field={`features.${i}.example`} value={feature.example}>{feature.example}</Editable>}
              {feature.stat && <div className="feature-stat"><strong>Real stat:</strong> {feature.stat.replace('Real stat: ', '')}</div>}
              <ItemRemove path="features" index={i} label="feature" />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}><ItemAdd path="features" label="feature" /></div>
      </div>
    </section>
  );
}

// ============================================================================
// INDUSTRIES SECTION
// ============================================================================
function IndustriesSection({ config }: { config: MarketingConfig }) {
  const { industries } = config;
  const industryIcons: Record<string, React.ReactElement> = { wrench: Icons.wrench, medical: Icons.medical, restaurant: Icons.restaurant, briefcase: Icons.briefcase, store: Icons.store, pet: Icons.pet, car: Icons.car, medspa: Icons.medspa, legal: Icons.legal };
  return (
    <section className="industries">
      <div className="container">
        <div className="section-header"><Editable as="h2" field="sectionHeadings.industriesHeadline" value={config.sectionHeadings?.industriesHeadline ?? "Built for Small Businesses Who Can't Afford to Miss Calls"}>{config.sectionHeadings?.industriesHeadline ?? "Built for Small Businesses Who Can't Afford to Miss Calls"}</Editable></div>
        <div className="industries-grid">
          {industries.map((industry, i) => (
            <div key={i} className="industry-card">
              <div className="industry-icon">{industryIcons[industry.icon] || Icons.briefcase}</div>
              <Editable as="h3" field={`industries.${i}.title`} value={industry.title}>{industry.title}</Editable>
              <Editable as="p" className="industry-subtitle" field={`industries.${i}.subtitle`} value={industry.subtitle}>{industry.subtitle}</Editable>
              <Editable as="p" field={`industries.${i}.description`} value={industry.description}>{industry.description}</Editable>
              <div className="industry-result"><strong><Editable as="span" field={`industries.${i}.result`} value={industry.result}>{industry.result}</Editable></strong></div>
              <ItemRemove path="industries" index={i} label="industry" />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}><ItemAdd path="industries" label="industry" /></div>
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
  const rate = config.currencyRate || 1;
  const pos = config.currencySymbolPosition || 'before';
  // The competitor columns below are USD benchmarks. Convert them into the
  // agency's currency so a non-USD site doesn't render a literal "$" right next
  // to its own symbol. The agency's own price (lowestPrice/highestPrice) is
  // already stored in its local currency, so it is not rate-converted.
  const money = (usd: number) => {
    const v = Math.round(usd * rate).toLocaleString();
    return pos === 'after' ? `${v} ${cs}` : `${cs}${v}`;
  };
  const moneyRange = (lo: number, hi: number) => {
    const l = Math.round(lo * rate).toLocaleString();
    const h = Math.round(hi * rate).toLocaleString();
    return pos === 'after' ? `${l}-${h} ${cs}` : `${cs}${l}-${h}`;
  };
  const lowestPrice = pricing.length > 0 ? pricing[0].price : 49;
  const highestPrice = pricing.length > 0 ? pricing[pricing.length - 1].price : 197;
  const oursMonthly = lowestPrice === highestPrice
    ? (pos === 'after' ? `${lowestPrice} ${cs}` : `${cs}${lowestPrice}`)
    : (pos === 'after' ? `${lowestPrice}-${highestPrice} ${cs}` : `${cs}${lowestPrice}-${highestPrice}`);
  const oursLowest = pos === 'after' ? `${lowestPrice} ${cs}` : `${cs}${lowestPrice}`;
  const comparisonData = [
    { label: 'Monthly Cost', ours: oursMonthly, human: moneyRange(3000, 4500), ruby: moneyRange(299, 600), vm: money(0) },
    { label: 'Setup Time', ours: (config.stats?.setupTime || 'Minutes'), human: '2-4 weeks', ruby: '3-5 days', vm: 'Instant', ourWin: true },
    { label: 'Available', ours: '24/7', human: 'Business hours', ruby: '24/7', vm: '24/7' },
    { label: 'Answers live', ours: '✓', human: 'If free', ruby: 'Usually', vm: '✗' },
    { label: 'Books to Google Calendar', ours: '✓', human: '✓', ruby: '✓', vm: '✗' },
    { label: 'Text Summaries', ours: '✓', human: '✗', ruby: '✗', vm: '✗' },
    { label: 'Mobile App', ours: '✓', human: '✗', ruby: '✗', vm: '✗' },
    { label: 'Trained on YOUR Business', ours: '✓', human: 'After weeks', ruby: 'Generic', vm: 'N/A' },
    { label: 'Multiple Calls', ours: 'Unlimited', human: 'One at a time', ruby: 'Limited', vm: 'Unlimited' },
  ];
  return (
    <section className="comparison">
      <div className="container">
        <div className="section-header"><h2>Why {branding.name} Beats Every Other Option</h2></div>
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
                  const isYes = val === '✓' || val.includes('Unlimited') || val === '24/7' || (option.highlight && !!(row as any).ourWin);
                  const isNo = val === '✗' || val === 'N/A';
                  return (<li key={j}><span className="feature-label">{row.label}</span><span className={`feature-value ${isYes ? 'feature-value--yes' : isNo ? 'feature-value--no' : ''}`}>{val}</span></li>);
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead><tr><th></th><th className="highlight-col"><div className="table-header-highlight">{branding.name}</div></th><th>Human Receptionist</th><th>Traditional Service</th><th>Just Voicemail</th></tr></thead>
            <tbody>{comparisonData.map((row, i) => (<tr key={i}><td><strong>{row.label}</strong></td><td className="highlight-col"><strong>{row.ours}</strong></td><td>{row.human}</td><td>{row.ruby}</td><td>{row.vm}</td></tr>))}</tbody>
          </table>
        </div>
        <div className="comparison-summary">
          <h3>The Bottom Line</h3>
          <p><strong>You have three choices:</strong></p>
          <ol>
            <li><strong>Hire staff:</strong> Professional, but {moneyRange(36000, 54000)}/year + benefits</li>
            <li><strong>Traditional service:</strong> 24/7 but generic, no appointments, {moneyRange(300, 600)}/month</li>
            <li><strong>{branding.name}:</strong> Custom AI, books appointments, text summaries, mobile app, {oursLowest}/month</li>
          </ol>
          <p className="comparison-conclusion">The choice is obvious.</p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// ROI CALCULATOR
// ============================================================================
function ROICalculatorSection({ config }: { config: MarketingConfig }) {
  const { branding, pricing } = config;
  const cs = config.currencySymbol || '$';
  const lowestPrice = pricing.length > 0 ? pricing[0].price : 49;
  const [missedPerWeek, setMissedPerWeek] = useState(5);
  const COST_PER_MISSED = config.roi?.missedCallCost ?? 500;
  const monthlyMissed = Math.round(missedPerWeek * 4.33);
  const monthlyLost = monthlyMissed * COST_PER_MISSED;
  const annualLost = monthlyLost * 12;
  const annualAICost = lowestPrice * 12;
  const annualSavings = annualLost - annualAICost;
  const roiMultiple = annualAICost > 0 ? Math.round(annualSavings / annualAICost) : 0;
  const primaryRgb = hexToRgb(branding.primaryColor);
  const tintBg = primaryRgb ? `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.08)` : 'rgba(18, 32, 146, 0.08)';

  return (
    <section className="stats-section" style={{ scrollMarginTop: '6rem' }}>
      <div className="container">
        <div className="section-header">
          <Editable as="h2" field="sectionHeadings.roiHeadline" value={config.sectionHeadings?.roiHeadline ?? 'What Are Missed Calls Costing You?'}>{config.sectionHeadings?.roiHeadline ?? 'What Are Missed Calls Costing You?'}</Editable>
          <p>Industry research shows the average missed call costs a small business <strong>{cs}{COST_PER_MISSED.toLocaleString()}</strong> in lost revenue. Use the slider to see your potential losses.</p>
        </div>
        <div className="live-stats" style={{ display: 'block', padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-medium)' }}>Calls you miss per week</span>
              <span style={{ fontFamily: 'var(--font-primary)', fontSize: '2rem', fontWeight: 800, color: branding.primaryColor }}>{missedPerWeek}</span>
            </div>
            <input type="range" min={1} max={25} value={missedPerWeek} onChange={e => setMissedPerWeek(Number(e.target.value))} style={{ width: '100%', accentColor: branding.primaryColor, height: '6px', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}><span>1</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Revenue Lost</p>
              <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-primary)', lineHeight: 1.1 }}>{cs}{monthlyLost.toLocaleString()}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem', marginBottom: 0 }}>{missedPerWeek}/week is about {monthlyMissed} calls a month × {cs}{COST_PER_MISSED}</p>
            </div>
            <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Annual Revenue Lost</p>
              <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#dc2626', fontFamily: 'var(--font-primary)', lineHeight: 1.1 }}>{cs}{annualLost.toLocaleString()}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem', marginBottom: 0 }}>That&apos;s going to your competitors</p>
            </div>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: tintBg, border: `1px solid ${branding.primaryColor}25`, textAlign: 'center' }}>
            <div className="roi-summary-grid" style={{ display: 'grid', gap: '1rem', alignItems: 'center' }}>
              <div><p style={{ fontSize: '0.688rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{branding.name} Cost</p><p style={{ fontSize: '1.5rem', fontWeight: 800, color: branding.primaryColor, fontFamily: 'var(--font-primary)', marginBottom: 0 }}>{cs}{lowestPrice}/mo</p></div>
              <div><p style={{ fontSize: '0.688rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Annual Savings</p><p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-primary)', marginBottom: 0 }}>{cs}{annualSavings.toLocaleString()}</p></div>
              <div><p style={{ fontSize: '0.688rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Return on Investment</p><p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-primary)', marginBottom: 0 }}>{roiMultiple}x ROI</p></div>
            </div>
            <a href="/signup" className="btn-primary" style={{ marginTop: '1.25rem', display: 'inline-flex' }}>Stop Losing {cs}{monthlyLost.toLocaleString()}/month, Start Free Trial</a>
          </div>
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
  const annualAvailable = config.annualBillingAvailable === true;
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const isAnnual = annualAvailable && billingInterval === 'year';
  const signupHref = (planKey?: string) => {
    const base = planKey ? `/signup?plan=${planKey}` : '/signup';
    return isAnnual ? base + (planKey ? '&billing=year' : '?billing=year') : base;
  };
  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <div className="section-header">
          <Editable as="h2" field="sectionHeadings.pricingHeadline" value={config.sectionHeadings?.pricingHeadline ?? 'Simple Pricing. No Hidden Fees.'}>{config.sectionHeadings?.pricingHeadline ?? 'Simple Pricing. No Hidden Fees.'}</Editable>
          <p>All plans include the {branding.name} app, text summaries, call recordings{config.signup?.trialDays !== 0 ? `, and a ${config.signup?.trialDays ?? 7}-day free trial` : ''}.</p>
        </div>
        {annualAvailable && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(125,125,125,0.12)', borderRadius: '999px', padding: '0.25rem', border: '1px solid rgba(125,125,125,0.2)' }}>
              {(['month', 'year'] as const).map((iv) => (
                <button key={iv} type="button" onClick={() => setBillingInterval(iv)}
                  style={{ padding: '0.5rem 1.1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: billingInterval === iv ? branding.primaryColor : 'transparent',
                    color: billingInterval === iv ? '#fff' : 'var(--text-light)' }}>
                  {iv === 'month' ? 'Monthly' : 'Annual'}{iv === 'year' ? ' · 3 months free' : ''}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="pricing-grid">
          {pricing.map((tier, i) => {
            const annual = tier.annualPrice ?? Math.round(tier.price * 9);
            return (
            <div key={i} className={`pricing-card ${tier.isPopular ? 'pricing-popular' : ''}`}>
              {tier.isPopular && (<div className="pricing-badge"><span style={{ color: '#f59e0b', width: '1rem', height: '1rem' }}>{Icons.star}</span>Most Popular</div>)}
              <div className="pricing-header">
                <h3>{tier.name}</h3>
                <div className="pricing-price"><span className="price-currency">{cs}</span><span className="price-amount">{isAnnual ? annual : tier.price}</span><span className="price-period">{isAnnual ? '/year' : '/month'}</span></div>
                {isAnnual && tier.price > 0 ? <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.35rem', marginBottom: 0 }}>{cs}{Math.round(annual / 12)}/mo billed yearly{tier.price * 12 > annual ? ` · save ${cs}${(tier.price * 12 - annual).toLocaleString()}` : ''}</p> : null}
                {tier.setupFeeCents && tier.setupFeeCents > 0 ? <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.35rem', marginBottom: 0 }}>+ {cs}{Math.round(tier.setupFeeCents / 100)} one-time setup fee</p> : null}
                {tier.subtitle && <p className="pricing-subtitle">{tier.subtitle}</p>}
              </div>
              <ul className="pricing-features">{tier.features.map((feature, j) => (<li key={j}>{feature.startsWith('Everything') ? <strong>{feature}</strong> : `✓ ${feature}`}</li>))}</ul>
              {tier.note && <div className="pricing-note">{tier.note}</div>}
              <a href={signupHref(tier.planKey)} className={`btn-pricing ${tier.isPopular ? 'btn-primary' : ''}`}>{config.signup?.trialDays === 0 ? 'Get Started' : `Start ${config.signup?.trialDays ?? 7}-Day Free Trial`}</a>
              {tier.isPopular && <p className="pricing-recommendation">Most businesses choose {tier.name}</p>}
            </div>
            );
          })}
        </div>
        <div className="pricing-guarantee">
          <p><strong>All plans include:</strong> {[config.signup?.trialDays !== 0 ? `${config.signup?.trialDays ?? 7}-day free trial${config.signup?.cardRequired ? '' : ' (no credit card required)'}` : null, 'Cancel anytime', config.stats?.setupTime ? `Setup in ${config.stats.setupTime}` : null].filter(Boolean).join(' • ')}</p>
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
        <div className="section-header"><Editable as="h2" field="sectionHeadings.faqHeadline" value={config.sectionHeadings?.faqHeadline ?? "Questions? We've Got Answers."}>{config.sectionHeadings?.faqHeadline ?? "Questions? We've Got Answers."}</Editable></div>
        <div className="faq-grid">
          {faqs.map((faq, i) => (
            <div key={i} className={`faq-item ${activeIndex === i ? 'active' : ''}`}>
              <button className="faq-question" onClick={() => setActiveIndex(activeIndex === i ? null : i)}>
                <Editable as="span" field={`faqs.${i}.question`} value={faq.question}>{faq.question}</Editable><span className="faq-icon">+</span>
              </button>
              <div className="faq-answer"><SafeFAQContent html={faq.answer} /></div>
              <ItemRemove path="faqs" index={i} label="question" />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}><ItemAdd path="faqs" label="question" /></div>
      </div>
    </section>
  );
}

// ============================================================================
// FINAL CTA SECTION
// ============================================================================
// ============================================================================
// AI WEB CALL (opt-in). Embeds the same live web-call widget served at /webcall
// so visitors can talk to the agency's AI without leaving the page. Content is
// agency-editable (Embed tab); visibility is toggled from the Sections tab.
// ============================================================================
function AiWebCallSection({ config }: { config: MarketingConfig }) {
  const wc = config.aiWebCall || {};
  const agencyId = wc.agencyId || '';
  if (!agencyId) return null;
  const title = (wc.title || '').trim() || `Talk to ${config.branding.name}`;
  const subtitle = (wc.subtitle || '').trim() || 'Hear the AI answer live, right here in your browser. No app, nothing to dial.';
  const cta = (wc.cta || '').trim() || 'Talk to the AI right in your browser.\nAllow your mic when asked.';
  const primary = config.branding?.primaryColor || '#00a19b';
  const src = `/webcall?embed=true&agency=${encodeURIComponent(agencyId)}&mode=demo`;
  return (
    <section id="ai-web-call" className="how-it-works">
      <div className="container">
        <div className="section-header">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 600, color: primary, background: `${primary}18`, border: `1px solid ${primary}33`, borderRadius: '999px', padding: '5px 13px', marginBottom: '0.9rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '999px', background: primary, display: 'inline-block' }} />
            Live in your browser, no app, nothing to dial
          </span>
          <h2 style={{ textWrap: 'balance' }}>{title}</h2><p className="subtitle" style={{ textWrap: 'balance' }}>{subtitle}</p>
        </div>
        <div style={{ maxWidth: '34rem', margin: '0 auto' }}>
          <div style={{ borderRadius: '1.25rem', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 24px 60px rgba(0,0,0,0.14)', background: '#f6f7f9' }}>
            <iframe title="AI web call" src={src} loading="lazy" allow="microphone" style={{ display: 'block', width: '100%', height: '32rem', border: 0 }} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', opacity: 0.68, whiteSpace: 'pre-line' }}>{cta}</p>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection({ config, contrastColors }: { config: MarketingConfig; contrastColors: ContrastColors }) {
  const { hero, branding } = config;
  return (
    <section className="final-cta" style={{ background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.primaryHoverColor} 100%)` }}>
      <div className="container">
        <div className="final-cta-content">
          <Editable as="h2" style={{ color: contrastColors.text }} field="finalCta.heading" value={config.finalCta?.heading || 'Stop Losing Customers to Voicemail'}>{config.finalCta?.heading || 'Stop Losing Customers to Voicemail'}</Editable>
          <Editable as="p" className="final-cta-text" style={{ color: contrastColors.textMuted }} field="finalCta.body" value={config.finalCta?.body || 'Every missed call is money out the door. While you are busy or closed, your competitors are answering their phones.'}>
            {config.finalCta?.body || 'Every missed call is money out the door. While you are busy or closed, your competitors are answering their phones.'}
          </Editable>
          <div className="final-cta-boxes">
            {hero.demoPhone && (
              <>
                <a
                  href={telHref(hero.demoPhone)}
                  className="cta-box-primary"
                  style={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}
                >
                  <h3><span style={{ width: '1.5rem', height: '1.5rem' }}>{Icons.headphones}</span>Try It Right Now</h3>
                  <span className="cta-phone-large">
                    <span style={{ width: '1.5rem', height: '1.5rem' }}>{Icons.phone}</span>{hero.demoPhone}
                  </span>
                  <p>&quot;Hear it work before you sign up&quot;</p>
                </a>
                <div className="cta-box-divider" style={{ color: contrastColors.textMuted }}>or</div>
              </>
            )}
            <div className="cta-box-secondary" style={{ background: contrastColors.buttonBg }}>
              <a href="/signup" className="btn-large btn-primary" style={{ background: contrastColors.isLight ? branding.primaryHoverColor : 'white', color: contrastColors.isLight ? 'white' : branding.primaryColor }}>
                {config.signup?.trialDays === 0 ? 'Get Started' : `Start Your ${config.signup?.trialDays ?? 7}-Day Free Trial`}
              </a>
              <div className="cta-benefits">
                {config.stats?.setupTime && <span style={{ color: contrastColors.text }}>✓ Setup in {config.stats.setupTime}</span>}
                {!config.signup?.cardRequired && <span style={{ color: contrastColors.text }}>✓ No credit card required</span>}
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
  if (!demoPhone) return null;
  return (
    <div className="exit-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="exit-modal" style={{ textAlign: 'center' }}>
        <button className="exit-modal-close" onClick={onClose} aria-label="Close"><span style={{ width: '1.5rem', height: '1.5rem' }}>{Icons.close}</span></button>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><span style={{ width: '3rem', height: '3rem', color: branding.primaryColor }}>{Icons.headphones}</span></div>
        <h3>Wait, Hear It Before You Leave!</h3>
        <p>Call our AI receptionist right now. No signup, no commitment, just see how it handles a real call for your business.</p>
        {demoPhone ? (
          <>
            <a href={telHref(demoPhone)} className="btn-large btn-primary" style={{ width: '100%', marginBottom: '0.75rem', fontSize: '1.125rem' }}
              onClick={() => { if (typeof window !== 'undefined' && (window as any).dataLayer) { (window as any).dataLayer.push({ event: 'exit_intent_demo_call' }); } }}>
              <span style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', display: 'inline-flex' }}>{Icons.phone}</span>{demoPhone}
            </a>
            <p style={{ fontSize: '0.813rem', color: 'var(--text-light)', marginBottom: '1rem' }}>{hero.demoInstructions || 'Takes 30 seconds. Your phone will ring with a live demo.'}</p>
          </>
        ) : (<a href="/signup" className="btn-large btn-primary" style={{ width: '100%', marginBottom: '0.75rem' }}>{config.signup?.trialDays === 0 ? 'Get Started' : `Start Your ${config.signup?.trialDays ?? 7}-Day Free Trial`}</a>)}
        <a href="/signup" style={{ fontSize: '0.875rem', fontWeight: 600, color: branding.primaryColor }}>Or start your free trial →</a>
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
                <div className="logo-wrapper" style={{ display: 'inline-block' }}>
                  <img src={branding.logoUrl} alt={branding.name} style={{ height: '40px' }} />
                </div>
              ) : (<span>{branding.name}</span>)}
            </div>
            <p className="footer-tagline">Professional AI that answers every call, books appointments, and sends you instant summaries, 24/7.</p>
            <div className="footer-contact">
              {footer.address && <p>{footer.address}</p>}
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul className="footer-links">{footer.productLinks.map((link, i) => (<li key={i}><a href={link.href}>{link.label}</a></li>))}</ul>
          </div>
          {visibleFooterLinks(footer.industryLinks).length > 0 && (
          <div className="footer-col">
            <h4>Industries</h4>
            <ul className="footer-links">{visibleFooterLinks(footer.industryLinks).map((link, i) => (<li key={i}><a href={link.support ? '#support' : link.href} onClick={link.support ? (e) => { e.preventDefault(); openAgencySupport(); } : undefined}>{link.label}</a></li>))}</ul>
          </div>
          )}
          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              {(config.customNavLinks || []).map((link, i) => (<li key={`custom-footer-${i}`}>{isSupportLink(link.url, link.label) ? <a href="#support" onClick={(e) => { e.preventDefault(); openAgencySupport(); }}>{link.label}</a> : <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>}</li>))}
              {visibleFooterLinks(footer.companyLinks).map((link, i) => (<li key={i}><a href={link.support ? '#support' : link.href} onClick={link.support ? (e) => { e.preventDefault(); openAgencySupport(); } : undefined}>{link.label}</a></li>))}
              {config.clientLoginPath && <li><a href={config.clientLoginPath}>Client Login</a></li>}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {branding.name}. All Rights Reserved.</p>
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
  if (!hero.demoPhone) return null;
  return (
    <div className={`sticky-cta ${visible ? 'visible' : ''}`}>
      <span className="sticky-cta-text">Ready to try {branding.name}?</span>
      <div className="sticky-cta-actions">
        <a href="/demo" className="btn-ghost btn-small">
          <span style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }}>{Icons.phone}</span>Try Demo
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface MarketingPageProps { config?: Partial<MarketingConfig>; }

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

  const primaryRgbStr = hexToRgbString(config.branding.primaryColor || '#122092');
  const accentRgbStr = hexToRgbString(config.branding.accentColor || '#f6b828');

  const themeStyle = {
    '--primary-color': config.branding.primaryColor,
    '--primary-hover': config.branding.primaryHoverColor,
    '--accent-color': config.branding.accentColor,
    '--primary-rgb': primaryRgbStr,
    '--accent-rgb': accentRgbStr,
    '--primary-text-color': contrastColors.text,
    '--cta-phone-color': contrastColors.isLight ? '#1f2937' : (config.branding.primaryColor || '#122092'),
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
      {(() => {
        const nodes: Record<string, React.ReactNode> = {
          problemSolution: config.showProblemSolution !== false ? <ProblemSolutionSection key="problemSolution" config={config} contrastColors={contrastColors} /> : null,
          howItWorks: config.showHowItWorks !== false ? <HowItWorksSection key="howItWorks" config={config} /> : null,
          commandCenter: config.showCommandCenter !== false ? <AppShowcaseSection key="commandCenter" config={config} contrastColors={contrastColors} /> : null,
          features: config.showFeatures !== false ? <FeaturesSection key="features" config={config} /> : null,
          industries: config.showIndustries ? <IndustriesSection key="industries" config={config} /> : null,
          comparison: config.showComparison ? <ComparisonSection key="comparison" config={config} /> : null,
          roiCalculator: config.showROICalculator !== false ? <ROICalculatorSection key="roiCalculator" config={config} /> : null,
          aiWebCall: config.showAiWebCall === true ? <AiWebCallSection key="aiWebCall" config={config} /> : null,
          pricing: config.showPricing !== false ? <PricingSection key="pricing" config={config} /> : null,
          faq: config.showFAQ !== false ? <FAQSection key="faq" config={config} /> : null,
          finalCta: config.showFinalCTA !== false ? <FinalCTASection key="finalCta" config={config} contrastColors={contrastColors} /> : null,
        };
        return resolveSectionOrder(config.sectionOrder, 'classic').map((k) => nodes[k] || null);
      })()}
      <Footer config={config} />
      <StickyCTA config={config} />
      {showExitModal && <ExitIntentModal config={config} onClose={() => setShowExitModal(false)} />}
      <CustomScripts html={config.analytics?.customBodyScripts} target="body" />
    </div>
  );
}