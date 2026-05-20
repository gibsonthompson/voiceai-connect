// ============================================================================
// AURORA TEMPLATE — Dark Premium Marketing Page
// Stripe/Linear/Vercel-inspired: animated mesh gradients, glassmorphism 2.0,
// bento feature grid, scroll-triggered reveals, floating glass nav pill.
// Accepts the same MarketingConfig as the classic template.
// ============================================================================
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MarketingConfig, defaultMarketingConfig } from '@/types/marketing';
import '@/styles/marketing-aurora.css';

// ── Color utilities ──────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const c = hex.replace('#','');
  const f = c.length===3 ? c.split('').map(x=>x+x).join('') : c;
  const r = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(f);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '16,185,129';
}
function isLight(hex: string) {
  const c = hex.replace('#',''); if(c.length<6) return false;
  const r=parseInt(c.substring(0,2),16), g=parseInt(c.substring(2,4),16), b=parseInt(c.substring(4,6),16);
  return (0.299*r+0.587*g+0.114*b)/255>0.45;
}
function contrastText(hex: string) { return isLight(hex) ? '#050505' : '#ffffff'; }

// ── Scroll reveal hook ───────────────────────────────────────────────────────
function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); obs.unobserve(el); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

// ── Batch reveal for staggered children ──────────────────────────────────────
function useStaggerReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.08) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.querySelectorAll('.a-reveal').forEach(c => c.classList.add('in'));
        obs.unobserve(el);
      }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
const PhoneIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const XCircle = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const ClockIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const CalendarIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const MessageIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const TransferIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const MicIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const MoonIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const StarIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const FeatureIcons: Record<string, React.ReactNode> = {
  calendar: <CalendarIcon/>, message: <MessageIcon/>, transfer: <TransferIcon/>,
  training: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.8a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>,
  moon: <MoonIcon/>, mic: <MicIcon/>,
};

// ── Safe FAQ renderer ────────────────────────────────────────────────────────
function SafeFAQ({ html }: { html: string }) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return <p className="a-faq-answer">{text}</p>;
}

// ── Schema.org ───────────────────────────────────────────────────────────────
function SchemaOrg({ config }: { config: MarketingConfig }) {
  const faq = { '@context':'https://schema.org','@type':'FAQPage',mainEntity:config.faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer.replace(/<[^>]*>/g,'')}}))};
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faq)}}/>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface AuroraProps { config?: Partial<MarketingConfig>; }

export default function MarketingPageAurora({ config: partial }: AuroraProps) {
  const c: MarketingConfig = {
    ...defaultMarketingConfig, ...partial,
    branding: { ...defaultMarketingConfig.branding, ...partial?.branding },
    hero: { ...defaultMarketingConfig.hero, ...partial?.hero },
    stats: { ...defaultMarketingConfig.stats, ...partial?.stats },
    solution: { ...defaultMarketingConfig.solution, ...partial?.solution },
    footer: { ...defaultMarketingConfig.footer, ...partial?.footer },
  };

  const { branding, hero, problems, solution, steps, features, pricing, faqs, footer } = c;
  const cs = c.currencySymbol || '$';
  const primaryRgb = hexToRgb(branding.primaryColor);
  const accentRgb = hexToRgb(branding.accentColor);
  const primaryText = contrastText(branding.primaryColor);

  // Refs for scroll reveals
  const heroRef = useReveal();
  const statsRef = useStaggerReveal();
  const problemsRef = useStaggerReveal();
  const solutionRef = useReveal();
  const stepsRef = useStaggerReveal();
  const featuresRef = useStaggerReveal();
  const pricingRef = useStaggerReveal();
  const faqRef = useReveal();
  const ctaRef = useReveal();

  // Sticky CTA visibility
  const [stickyVisible, setStickyVisible] = useState(false);
  useEffect(() => {
    const h = () => setStickyVisible(window.scrollY > 600);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const cssVars = {
    '--a-primary': branding.primaryColor,
    '--a-primary-rgb': primaryRgb,
    '--a-primary-text': primaryText,
    '--a-accent': branding.accentColor,
    '--a-accent-rgb': accentRgb,
  } as React.CSSProperties;

  return (
    <div className="aurora" style={cssVars}>
      <SchemaOrg config={c} />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="a-nav">
        <a href="/" className="a-nav-logo">
          {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.name} /> : null}
          <span>{branding.name}</span>
        </a>
        <ul className="a-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="/faq">FAQ</a></li>
        </ul>
        <div className="a-nav-actions">
          {c.clientLoginPath && <a href={c.clientLoginPath} className="a-nav-login">Client Login</a>}
          <a href="/get-started" className="a-btn a-btn-primary">Start Free Trial</a>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="a-hero">
        <div className="a-hero-mesh">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        <div className="a-container">
          <div ref={heroRef} className="a-hero-content a-reveal">
            <div className="a-hero-badge">
              <span className="a-hero-badge-dot" />
              <span>{hero.badge}</span>
            </div>
            <h1>
              {hero.headline.map((line, i) => <span key={i}>{line}</span>)}
            </h1>
            <p className="a-hero-sub">{hero.description}</p>
            <div className="a-hero-ctas">
              <a href="/get-started" className="a-btn a-btn-primary a-btn-large">
                Start Free Trial — 7 Days Free
              </a>
              {hero.demoPhone ? (
                <a href={`tel:+1${hero.demoPhone.replace(/\D/g,'')}`} className="a-btn a-btn-ghost a-btn-large">
                  <span style={{width:'1rem',height:'1rem',display:'inline-flex'}}><PhoneIcon/></span>
                  Try Live Demo
                </a>
              ) : (
                <a href="#how-it-works" className="a-btn a-btn-ghost a-btn-large">See How It Works</a>
              )}
            </div>
            {hero.demoPhone && (
              <div className="a-demo-box">
                <p className="a-demo-label">Hear it in action — call now</p>
                <a href={`tel:+1${hero.demoPhone.replace(/\D/g,'')}`} className="a-demo-phone">
                  <PhoneIcon />
                  {hero.demoPhone}
                </a>
                <p className="a-demo-note">{hero.demoInstructions || 'Takes 30 seconds. Free to call.'}</p>
              </div>
            )}
            <div className="a-hero-trust">
              {hero.trustItems.map((item, i) => <span key={i}>✓ {item}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <section className="a-stats">
        <div className="a-container">
          <div ref={statsRef} className="a-stats-grid a-stagger">
            {[
              { value: c.stats.setupTime, label: 'Setup Time' },
              { value: c.stats.responseTime, label: 'Response Time' },
              { value: c.stats.businessesServed, label: 'Businesses Served' },
              { value: c.stats.satisfaction, label: 'Satisfaction Rate' },
            ].map((s, i) => (
              <div key={i} className="a-stat a-reveal">
                <div className="a-stat-value">{s.value}</div>
                <div className="a-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEMS + SOLUTION ──────────────────────────────────────────── */}
      <section className="a-problems">
        <div className="a-container">
          <div className="a-section-header">
            <h2>You&apos;re Losing Customers Every Time Your Phone Rings</h2>
          </div>
          <div ref={problemsRef} className="a-problems-grid a-stagger">
            {problems.map((p, i) => (
              <div key={i} className="a-glass a-problem-card a-reveal">
                <div className="a-problem-icon"><XCircle /></div>
                <h3>{p.title}</h3>
                <p>&quot;{p.description}&quot;</p>
              </div>
            ))}
          </div>
          <div ref={solutionRef} className="a-solution-box a-reveal" style={{color: primaryText}}>
            <h2 style={{color: primaryText}}>{branding.name} Is {solution.headline}</h2>
            {solution.paragraphs.map((p, i) => <p key={i} style={{color: primaryText}}>{p}</p>)}
            <div className="a-solution-highlight" style={{color: primaryText}}>
              <strong>And here&apos;s the best part:</strong> {solution.highlight}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="a-steps">
        <div className="a-container">
          <div className="a-section-header">
            <h2>From Signup to Your First Call: Under 10 Minutes</h2>
            <p>No, really. We timed it.</p>
          </div>
          <div ref={stepsRef} className="a-steps-grid a-stagger">
            {steps.map((step, i) => (
              <div key={i} className="a-glass a-step-card a-reveal">
                <div className="a-step-number">{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className="a-step-time">
                  <span style={{width:'0.875rem',height:'0.875rem',display:'inline-flex'}}><ClockIcon/></span>
                  {step.time}
                </span>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:'2.5rem'}}>
            <a href="/get-started" className="a-btn a-btn-primary a-btn-large">Start Your 7-Day Free Trial</a>
            <p style={{fontSize:'0.875rem',color:'var(--a-text-muted)',marginTop:'0.75rem'}}>No credit card required. Ready in 10 minutes.</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES (Bento Grid) ───────────────────────────────────────── */}
      <section id="features" className="a-features">
        <div className="a-container">
          <div className="a-section-header">
            <h2>Everything You Need. Nothing You Don&apos;t.</h2>
          </div>
          <div ref={featuresRef} className="a-bento a-stagger">
            {features.map((f, i) => (
              <div key={i} className="a-glass a-bento-card a-reveal">
                <div className="a-bento-icon">{FeatureIcons[f.icon] || <CalendarIcon/>}</div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="a-pricing">
        <div className="a-container">
          <div className="a-section-header">
            <h2>Simple Pricing. No Hidden Fees.</h2>
            <p>All plans include the {branding.name} app, text summaries, call recordings, and 7-day free trial.</p>
          </div>
          <div ref={pricingRef} className="a-pricing-grid a-stagger">
            {pricing.map((tier, i) => (
              <div key={i} className={`a-glass a-pricing-card a-reveal ${tier.isPopular ? 'popular' : ''}`}>
                {tier.isPopular && <div className="a-pricing-badge">★ Most Popular</div>}
                <div className="a-pricing-header">
                  <h3>{tier.name}</h3>
                  <div className="a-pricing-amount">
                    <span className="a-pricing-currency">{cs}</span>
                    <span className="a-pricing-value">{tier.price}</span>
                    <span className="a-pricing-period">/mo</span>
                  </div>
                  <p className="a-pricing-subtitle">{tier.subtitle}</p>
                </div>
                <ul className="a-pricing-features">
                  {tier.features.map((feat, j) => (
                    <li key={j}>{feat.startsWith('Everything') ? <strong>{feat}</strong> : `✓ ${feat}`}</li>
                  ))}
                </ul>
                <a href="/get-started" className={`a-btn a-pricing-cta ${tier.isPopular ? 'a-btn-primary' : 'a-btn-ghost'}`}>
                  Start 7-Day Free Trial
                </a>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:'2rem'}}>
            <p style={{fontSize:'0.875rem',color:'var(--a-text-muted)'}}>
              <strong>All plans include:</strong> 7-day free trial (no credit card required) · Cancel anytime · Setup in 10 minutes
            </p>
            {footer.email && (
              <p style={{fontSize:'0.875rem',color:'var(--a-primary)',fontWeight:600,marginTop:'0.5rem'}}>
                500+ calls/month? <a href={`mailto:${footer.email}`} style={{color:'inherit',textDecoration:'underline',textUnderlineOffset:'3px'}}>Contact us for custom pricing →</a>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="a-faq">
        <div className="a-container">
          <div className="a-section-header">
            <h2>Questions? We&apos;ve Got Answers.</h2>
          </div>
          <div ref={faqRef} className="a-faq-list a-reveal">
            {faqs.map((faq, i) => (
              <details key={i} className="a-faq-item">
                <summary>
                  <span>{faq.question}</span>
                  <span className="a-faq-icon">+</span>
                </summary>
                <SafeFAQ html={faq.answer} />
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="a-final-cta">
        <div className="a-container">
          <div ref={ctaRef} className="a-final-cta-content a-reveal">
            <h2 style={{color: primaryText}}>Stop Losing Customers to Voicemail</h2>
            <p style={{color: primaryText}}>
              Every missed call is money out the door. {branding.name} answers 24/7 so you never miss another opportunity.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem',alignItems:'center'}}>
              <a href="/get-started" className="a-btn a-btn-large" style={{
                background: isLight(branding.primaryColor) ? branding.primaryHoverColor : 'white',
                color: isLight(branding.primaryColor) ? 'white' : branding.primaryColor,
                fontWeight: 700,
              }}>
                Start Your 7-Day Free Trial
              </a>
              {hero.demoPhone && (
                <a href={`tel:+1${hero.demoPhone.replace(/\D/g,'')}`} style={{
                  fontSize:'0.875rem',fontWeight:600,color:primaryText,opacity:0.8,
                  display:'inline-flex',alignItems:'center',gap:'0.375rem',
                }}>
                  <span style={{width:'1rem',height:'1rem',display:'inline-flex'}}><PhoneIcon/></span>
                  or call demo: {hero.demoPhone}
                </a>
              )}
              <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'1rem',marginTop:'0.5rem'}}>
                <span style={{color:primaryText,fontWeight:500,fontSize:'0.875rem'}}>✓ Setup in 10 minutes</span>
                <span style={{color:primaryText,fontWeight:500,fontSize:'0.875rem'}}>✓ No credit card required</span>
                <span style={{color:primaryText,fontWeight:500,fontSize:'0.875rem'}}>✓ Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="a-footer">
        <div className="a-container">
          <div className="a-footer-grid">
            <div>
              <div className="a-footer-brand">
                {branding.logoUrl && <img src={branding.logoUrl} alt={branding.name} />}
                <span>{branding.name}</span>
              </div>
              <p className="a-footer-tagline">Professional AI that answers every call, books appointments, and sends instant summaries — 24/7.</p>
              {footer.email && <p style={{fontSize:'0.8125rem',color:'var(--a-text-muted)',marginTop:'0.75rem'}}><a href={`mailto:${footer.email}`} style={{color:'var(--a-text-secondary)'}}>{footer.email}</a></p>}
            </div>
            <div className="a-footer-col">
              <h4>Product</h4>
              {footer.productLinks.map((l, i) => <a key={i} href={l.href}>{l.label}</a>)}
            </div>
            <div className="a-footer-col">
              <h4>Industries</h4>
              {footer.industryLinks.map((l, i) => <a key={i} href={l.href}>{l.label}</a>)}
            </div>
            <div className="a-footer-col">
              <h4>Company</h4>
              {footer.companyLinks.map((l, i) => <a key={i} href={l.href}>{l.label}</a>)}
              {c.clientLoginPath && <a href={c.clientLoginPath}>Client Login</a>}
            </div>
          </div>
          <div className="a-footer-bottom">
            <p>© {new Date().getFullYear()} {branding.name}. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── STICKY CTA ──────────────────────────────────────────────────── */}
      <div className={`a-sticky ${stickyVisible ? 'visible' : ''}`}>
        <a href="/get-started" className="a-btn a-btn-primary" style={{boxShadow:'0 4px 20px rgba(0,0,0,0.4)'}}>
          Start Free Trial
        </a>
      </div>
    </div>
  );
}
