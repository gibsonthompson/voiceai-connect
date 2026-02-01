// components/MarketingPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MarketingConfig, defaultMarketingConfig } from '@/types/marketing';
import '@/styles/marketing.css';

// ============================================================================
// SVG ICONS
// ============================================================================
const Icons = {
  headphones: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  thumbsUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  cpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
      <rect x="9" y="9" width="6" height="6"></rect>
      <line x1="9" y1="1" x2="9" y2="4"></line>
      <line x1="15" y1="1" x2="15" y2="4"></line>
      <line x1="9" y1="20" x2="9" y2="23"></line>
      <line x1="15" y1="20" x2="15" y2="23"></line>
      <line x1="20" y1="9" x2="23" y2="9"></line>
      <line x1="20" y1="14" x2="23" y2="14"></line>
      <line x1="1" y1="9" x2="4" y2="9"></line>
      <line x1="1" y1="14" x2="4" y2="14"></line>
    </svg>
  ),
  smartphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  ),
  transfer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"></polyline>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
      <polyline points="7 23 3 19 7 15"></polyline>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
    </svg>
  ),
  training: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.8a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  ),
  wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  ),
  medical: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 0-7 7c0 1.5.5 3.5 2 5l5 5 5-5c1.5-1.5 2-3.5 2-5a7 7 0 0 0-7-7z"></path>
      <circle cx="12" cy="9" r="1" fill="currentColor"></circle>
    </svg>
  ),
  restaurant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  ),
  store: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  pet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"></path>
      <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"></path>
      <path d="M8 14v.5"></path>
      <path d="M16 14v.5"></path>
      <path d="M11.25 16.25h1.5L12 17l-.75-.75z"></path>
      <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"></path>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
};

const getIcon = (name: string) => {
  return Icons[name as keyof typeof Icons] || Icons.zap;
};

// ============================================================================
// NAVIGATION
// ============================================================================
interface NavProps {
  config: MarketingConfig;
}

function Navigation({ config }: NavProps) {
  const { branding } = config;
  const isDark = config.theme === 'dark';
  
  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <a href="/" className="logo">
            {branding.logoUrl ? (
              <div 
                className="logo-wrapper"
                style={{ 
                  backgroundColor: branding.logoBackgroundColor || 'transparent',
                  padding: branding.logoBackgroundColor ? '8px 12px' : '0',
                  borderRadius: '8px',
                }}
              >
                <img src={branding.logoUrl} alt={branding.name} className="logo-image" />
              </div>
            ) : (
              <span className="logo-text">{branding.name}</span>
            )}
          </a>
          
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          
          <div className="nav-actions">
            {config.footer.phone && (
              <a href={`tel:${config.footer.phone.replace(/\D/g, '')}`} className="btn-ghost">Call Us</a>
            )}
            <a href="/get-started" className="btn-primary">
              Start Free Trial
            </a>
          </div>
          
          <button className="mobile-menu-toggle" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// HERO SECTION
// ============================================================================
function HeroSection({ config }: { config: MarketingConfig }) {
  const { hero } = config;
  
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>{hero.badge}</span>
          </div>
          
          <h1 className="hero-title">
            {hero.headline.map((line, i) => (
              <span key={i} style={{ display: 'block' }}>{line}</span>
            ))}
            <span className="subtitle">{hero.subtitle}</span>
          </h1>
          
          <p className="hero-subtitle">{hero.description}</p>

          {/* Demo CTA */}
          {hero.demoPhone && (
            <div className="demo-cta">
              <div className="demo-box">
                <div className="demo-icon" style={{ color: 'white' }}>
                  {Icons.headphones}
                </div>
                <div className="demo-content">
                  <h3>EXPERIENCE IT LIVE:</h3>
                  <a href={`tel:+1${hero.demoPhone.replace(/\D/g, '')}`} className="demo-phone">
                    <span style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}>
                      {Icons.phone}
                    </span>
                    Call: {hero.demoPhone}
                  </a>
                  <p className="demo-instructions">{hero.demoInstructions}</p>
                </div>
              </div>
            </div>
          )}

          {/* Trust Bar */}
          <div className="trust-bar">
            {hero.trustItems.map((item, i) => (
              <div key={i} className="trust-item">✓ {item}</div>
            ))}
          </div>

          {/* CTAs */}
          <div className="hero-ctas">
            <a href="/get-started" className="btn-large btn-primary">
              Start Free Trial - 7 Days
            </a>
            <a href="#how-it-works" className="btn-large btn-ghost">See How It Works</a>
          </div>
        </div>
      </div>
      
      {/* Background */}
      <div className="hero-bg">
        <div className="hero-gradient"></div>
        <div className="hero-pattern"></div>
      </div>
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
          <div className="stat-item">
            <div className="stat-icon">{Icons.zap}</div>
            <div className="stat-number">{stats.setupTime}</div>
            <div className="stat-label">Setup Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">{Icons.clock}</div>
            <div className="stat-number">{stats.responseTime}</div>
            <div className="stat-label">Avg Response Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">{Icons.calendar}</div>
            <div className="stat-number">{stats.businessesServed}</div>
            <div className="stat-label">Businesses Served</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">{Icons.thumbsUp}</div>
            <div className="stat-number">{stats.satisfaction}</div>
            <div className="stat-label">Customer Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PROBLEM/SOLUTION SECTION
// ============================================================================
function ProblemSolutionSection({ config }: { config: MarketingConfig }) {
  const { problems, solution, branding } = config;
  
  return (
    <section className="problem-solution">
      <div className="container">
        <div className="section-header">
          <h2>You're Losing Customers Every Time Your Phone Rings</h2>
        </div>

        <div className="problems-grid">
          {problems.map((problem, i) => (
            <div key={i} className="problem-card">
              <div className="problem-icon">{Icons.x}</div>
              <h3>{problem.title}</h3>
              <p>"{problem.description}"</p>
            </div>
          ))}
        </div>

        <div className="solution-box">
          <h2>{branding.name} Is {solution.headline}</h2>
          {solution.paragraphs.map((p, i) => (
            <p key={i} className="solution-text">{p}</p>
          ))}
          <p className="solution-highlight">
            <strong>And here's the best part:</strong> {solution.highlight}
          </p>
          <p className="solution-text">You stay in control without being chained to your phone.</p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// HOW IT WORKS SECTION
// ============================================================================
function HowItWorksSection({ config }: { config: MarketingConfig }) {
  const { steps } = config;
  const stepIcons = [Icons.file, Icons.cpu, Icons.phone, Icons.smartphone];
  
  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2>From Signup to Your First Call: Under 10 Minutes</h2>
          <p className="subtitle">No, Really. We Timed It.</p>
        </div>

        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{i + 1}</div>
              <div className="step-icon">{stepIcons[i] || Icons.zap}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <div className="step-time">
                <span style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }}>{Icons.clock}</span>
                {step.time}
              </div>
            </div>
          ))}
        </div>

        <div className="cta-box">
          <a href="/get-started" className="btn-large btn-primary">
            Start Your 7-Day Free Trial
          </a>
          <p className="cta-subtext">No credit card required. Your AI receptionist is ready in 10 minutes.</p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// APP SHOWCASE SECTION
// ============================================================================
function AppShowcaseSection({ config }: { config: MarketingConfig }) {
  const { benefits, branding } = config;
  const benefitIcons: Record<string, React.ReactElement> = {
    smartphone: Icons.smartphone,
    phone: Icons.phone,
    chart: Icons.chart,
    bell: Icons.bell,
  };
  
  return (
    <section className="app-showcase">
      <div className="container">
        <div className="section-header">
          <h2>See Every Conversation. Manage Everything from Your Phone.</h2>
          <p>Unlike old-school answering services that just take messages, {branding.name} gives you a complete command center for every customer interaction.</p>
        </div>

        <div className="app-features">
          <div className="app-screenshot">
            <div className="dashboard-mockup" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/* Inline Phone Mockup SVG - PWA Style */}
              <svg viewBox="0 0 320 640" fill="none" className="dashboard-image" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                {/* Phone Frame */}
                <rect x="8" y="8" width="304" height="624" rx="40" fill="#1a1a1a" stroke="#333" strokeWidth="2"/>
                
                {/* Screen base - fill with primary color to avoid white corners */}
                <rect x="18" y="18" width="284" height="604" rx="32" fill="var(--primary-color, #10b981)"/>
                
                {/* Notch/Dynamic Island */}
                <rect x="115" y="24" width="90" height="28" rx="14" fill="#1a1a1a"/>
                
                {/* Status Bar Text */}
                <text x="160" y="44" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="600" fill="white">9:41</text>
                
                {/* App Header */}
                <rect x="18" y="56" width="284" height="52" fill="var(--primary-color, #10b981)"/>
                
                {/* Back Arrow */}
                <path d="M38 82 L48 72 L48 74 L40 82 L48 90 L48 92 Z" fill="white"/>
                
                {/* Header Title */}
                <text x="160" y="88" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="17" fontWeight="600" fill="white">Call Details</text>
                
                {/* AI Sparkle Icon */}
                <circle cx="272" cy="82" r="14" fill="rgba(255,255,255,0.2)"/>
                <text x="272" y="87" textAnchor="middle" fontSize="14">✨</text>
                
                {/* Content Area - white background for content */}
                <rect x="18" y="108" width="284" height="482" fill="#f8fafc"/>
                
                {/* Bottom safe area with rounded corners */}
                <path d="M18 590 L18 598 Q18 622 42 622 L278 622 Q302 622 302 598 L302 590 Z" fill="white"/>
                
                {/* Caller Card */}
                <rect x="30" y="120" width="260" height="88" rx="12" fill="white"/>
                
                {/* Avatar */}
                <circle cx="66" cy="164" r="24" fill="var(--primary-color, #10b981)"/>
                <text x="66" y="171" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="700" fill="white">JD</text>
                
                {/* Caller Info */}
                <text x="102" y="152" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="600" fill="#1f2937">John Davidson</text>
                <rect x="212" y="140" width="52" height="18" rx="9" fill="#dcfce7"/>
                <text x="238" y="152" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="600" fill="#16a34a">Normal</text>
                <text x="102" y="170" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fill="#6b7280">Today, 2:34 PM</text>
                <text x="102" y="186" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fill="#6b7280">Duration: 3:42</text>
                
                {/* Phone Number Card */}
                <rect x="30" y="220" width="260" height="50" rx="12" fill="white"/>
                <circle cx="56" cy="245" r="14" fill="#ecfdf5"/>
                <text x="56" y="250" textAnchor="middle" fontSize="12">📞</text>
                <text x="80" y="239" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11" fill="#6b7280">Phone</text>
                <text x="80" y="255" fontFamily="system-ui, -apple-system, sans-serif" fontSize="14" fontWeight="600" fill="var(--primary-color, #10b981)">(555) 123-4567</text>
                
                {/* AI Summary Card */}
                <rect x="30" y="282" width="260" height="148" rx="12" fill="white"/>
                
                {/* AI Summary Header */}
                <circle cx="50" cy="304" r="10" fill="#f0fdf4"/>
                <text x="50" y="308" textAnchor="middle" fontSize="9">🤖</text>
                <text x="68" y="308" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="600" fill="var(--primary-color, #10b981)">AI Summary</text>
                
                {/* Summary Text */}
                <text fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fill="#374151">
                  <tspan x="42" y="330">John called to inquire about your</tspan>
                  <tspan x="42" dy="16">services. He&apos;s interested in getting</tspan>
                  <tspan x="42" dy="16">a quote for a project starting next</tspan>
                  <tspan x="42" dy="16">month. Requested a callback.</tspan>
                </text>
                
                {/* Tags */}
                <rect x="42" y="398" width="68" height="22" rx="11" fill="#dbeafe"/>
                <text x="76" y="412" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="600" fill="#2563eb">New Lead</text>
                
                <rect x="116" y="398" width="72" height="22" rx="11" fill="#fef3c7"/>
                <text x="152" y="412" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="600" fill="#d97706">Callback</text>
                
                {/* Call Recording Card */}
                <rect x="30" y="442" width="260" height="86" rx="12" fill="white"/>
                
                {/* Recording Header */}
                <circle cx="50" cy="464" r="10" fill="#fef3c7"/>
                <text x="50" y="468" textAnchor="middle" fontSize="9">🎙️</text>
                <text x="68" y="468" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="600" fill="#1f2937">Call Recording</text>
                
                {/* Waveform */}
                <rect x="42" y="482" width="236" height="18" rx="4" fill="#f3f4f6"/>
                
                {/* Waveform bars - played */}
                <g fill="var(--primary-color, #10b981)">
                  <rect x="48" y="486" width="2" height="10" rx="1"/><rect x="53" y="488" width="2" height="6" rx="1"/>
                  <rect x="58" y="484" width="2" height="14" rx="1"/><rect x="63" y="487" width="2" height="8" rx="1"/>
                  <rect x="68" y="485" width="2" height="12" rx="1"/><rect x="73" y="489" width="2" height="4" rx="1"/>
                  <rect x="78" y="486" width="2" height="10" rx="1"/><rect x="83" y="488" width="2" height="6" rx="1"/>
                  <rect x="88" y="484" width="2" height="14" rx="1"/><rect x="93" y="489" width="2" height="4" rx="1"/>
                  <rect x="98" y="487" width="2" height="8" rx="1"/><rect x="103" y="485" width="2" height="12" rx="1"/>
                </g>
                {/* Waveform bars - unplayed */}
                <g fill="#d1d5db">
                  <rect x="108" y="488" width="2" height="6" rx="1"/><rect x="113" y="486" width="2" height="10" rx="1"/>
                  <rect x="118" y="484" width="2" height="14" rx="1"/><rect x="123" y="489" width="2" height="4" rx="1"/>
                  <rect x="128" y="487" width="2" height="8" rx="1"/><rect x="133" y="485" width="2" height="12" rx="1"/>
                  <rect x="138" y="489" width="2" height="4" rx="1"/><rect x="143" y="486" width="2" height="10" rx="1"/>
                  <rect x="148" y="488" width="2" height="6" rx="1"/><rect x="153" y="484" width="2" height="14" rx="1"/>
                  <rect x="158" y="489" width="2" height="4" rx="1"/><rect x="163" y="487" width="2" height="8" rx="1"/>
                  <rect x="168" y="485" width="2" height="12" rx="1"/><rect x="173" y="489" width="2" height="4" rx="1"/>
                  <rect x="178" y="486" width="2" height="10" rx="1"/><rect x="183" y="488" width="2" height="6" rx="1"/>
                  <rect x="188" y="484" width="2" height="14" rx="1"/><rect x="193" y="489" width="2" height="4" rx="1"/>
                  <rect x="198" y="486" width="2" height="10" rx="1"/><rect x="203" y="487" width="2" height="8" rx="1"/>
                  <rect x="208" y="485" width="2" height="12" rx="1"/><rect x="213" y="489" width="2" height="4" rx="1"/>
                  <rect x="218" y="486" width="2" height="10" rx="1"/><rect x="223" y="488" width="2" height="6" rx="1"/>
                  <rect x="228" y="484" width="2" height="14" rx="1"/><rect x="233" y="489" width="2" height="4" rx="1"/>
                  <rect x="238" y="487" width="2" height="8" rx="1"/><rect x="243" y="485" width="2" height="12" rx="1"/>
                  <rect x="248" y="489" width="2" height="4" rx="1"/><rect x="253" y="486" width="2" height="10" rx="1"/>
                  <rect x="258" y="488" width="2" height="6" rx="1"/><rect x="263" y="484" width="2" height="14" rx="1"/>
                  <rect x="268" y="489" width="2" height="4" rx="1"/><rect x="273" y="486" width="2" height="10" rx="1"/>
                </g>
                
                {/* Time labels */}
                <text x="42" y="514" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fill="#6b7280">1:24</text>
                <text x="272" y="514" textAnchor="end" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fill="#6b7280">3:42</text>
                
                {/* Play Button */}
                <circle cx="160" cy="508" r="12" fill="var(--primary-color, #10b981)"/>
                <path d="M157 502 L166 508 L157 514 Z" fill="white"/>
                
                {/* Action Buttons */}
                <rect x="30" y="540" width="125" height="38" rx="19" fill="var(--primary-color, #10b981)"/>
                <text x="92" y="564" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fontWeight="600" fill="white">📞 Call Back</text>
                
                <rect x="165" y="540" width="125" height="38" rx="19" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
                <text x="227" y="564" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fontWeight="600" fill="#374151">💬 SMS</text>
                
                {/* Home indicator */}
                <rect x="120" y="606" width="80" height="4" rx="2" fill="#1a1a1a"/>
              </svg>
            </div>
          </div>

          <div className="app-benefits">
            {benefits.map((benefit, i) => (
              <div key={i} className="benefit-item">
                <div className="benefit-icon">
                  {benefitIcons[benefit.icon] || Icons.zap}
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SMS Example */}
        <div className="sms-example">
          <div className="sms-mockup">
            <div className="sms-header">Messages</div>
            <div className="sms-content">
              <div className="sms-message">
                <strong>{branding.name}</strong>
                <p>New call from Sarah Martinez at 2:47pm</p>
                <p><strong>Requested:</strong> House painting estimate<br/>
                <strong>Phone:</strong> (555) 123-4567<br/>
                <strong>Appointment booked:</strong> Thursday 3/14 at 10am</p>
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
  const featureIcons: Record<string, React.ReactElement> = {
    calendar: Icons.calendar,
    message: Icons.message,
    transfer: Icons.transfer,
    training: Icons.training,
    moon: Icons.moon,
    mic: Icons.mic,
  };
  
  return (
    <section id="features" className="features">
      <div className="container">
        <div className="section-header">
          <h2>Everything You Need. Nothing You Don't.</h2>
        </div>

        <div className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">
                {featureIcons[feature.icon] || Icons.zap}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              
              {feature.integrations && (
                <div className="feature-integrations">
                  {feature.integrations.map((int, j) => (
                    <span key={j}>✓ {int}</span>
                  ))}
                </div>
              )}
              
              {feature.highlight && (
                <p className="feature-highlight">{feature.highlight}</p>
              )}
              
              {feature.example && (
                <div className="feature-example">{feature.example}</div>
              )}
              
              {feature.stat && (
                <div className="feature-stat">
                  <strong>Real stat:</strong> {feature.stat.replace('Real stat: ', '')}
                </div>
              )}
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
  const industryIcons: Record<string, React.ReactElement> = {
    wrench: Icons.wrench,
    medical: Icons.medical,
    restaurant: Icons.restaurant,
    briefcase: Icons.briefcase,
    store: Icons.store,
    pet: Icons.pet,
  };
  
  return (
    <section className="industries">
      <div className="container">
        <div className="section-header">
          <h2>Built for Small Businesses Who Can't Afford to Miss Calls</h2>
        </div>

        <div className="industries-grid">
          {industries.map((industry, i) => (
            <div key={i} className="industry-card">
              <div className="industry-icon">
                {industryIcons[industry.icon] || Icons.briefcase}
              </div>
              <h3>{industry.title}</h3>
              <p className="industry-subtitle">{industry.subtitle}</p>
              <p>"{industry.description}"</p>
              <div className="industry-result">
                <strong>{industry.result}</strong>
              </div>
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
  const lowestPrice = pricing.length > 0 ? pricing[0].price : 49;
  const highestPrice = pricing.length > 0 ? pricing[pricing.length - 1].price : 197;
  
  return (
    <section className="comparison">
      <div className="container">
        <div className="section-header">
          <h2>Why {branding.name} Beats Every Other Option</h2>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th></th>
                <th className="highlight-col">
                  <div className="table-header-highlight">{branding.name}</div>
                </th>
                <th>Human Receptionist</th>
                <th>Ruby/Smith.ai</th>
                <th>Just Voicemail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Monthly Cost</strong></td>
                <td className="highlight-col"><strong>${lowestPrice}-{highestPrice}</strong></td>
                <td>$3,000-4,500</td>
                <td>$299-600</td>
                <td>$0</td>
              </tr>
              <tr>
                <td><strong>Setup Time</strong></td>
                <td className="highlight-col"><strong>10 min</strong></td>
                <td>2-4 weeks</td>
                <td>3-5 days</td>
                <td>Instant</td>
              </tr>
              <tr>
                <td><strong>Available</strong></td>
                <td className="highlight-col"><strong>24/7/365</strong></td>
                <td>Business hours</td>
                <td>24/7</td>
                <td>24/7</td>
              </tr>
              <tr>
                <td><strong>Books Appointments</strong></td>
                <td className="highlight-col">✓ Yes</td>
                <td>✓ Yes</td>
                <td>✓ Yes</td>
                <td>✗ No</td>
              </tr>
              <tr>
                <td><strong>Access Your Calendar</strong></td>
                <td className="highlight-col">✓ Yes</td>
                <td>✓ Yes</td>
                <td>✗ No</td>
                <td>✗ No</td>
              </tr>
              <tr>
                <td><strong>Instant Text Summaries</strong></td>
                <td className="highlight-col">✓ Yes</td>
                <td>✗ No</td>
                <td>✗ No</td>
                <td>✗ No</td>
              </tr>
              <tr>
                <td><strong>Mobile App Dashboard</strong></td>
                <td className="highlight-col">✓ Yes</td>
                <td>✗ No</td>
                <td>✗ No</td>
                <td>✗ No</td>
              </tr>
              <tr>
                <td><strong>Trained on YOUR Business</strong></td>
                <td className="highlight-col">✓ Yes</td>
                <td>After weeks</td>
                <td>✗ Generic</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td><strong>Handles Multiple Calls</strong></td>
                <td className="highlight-col">✓ Unlimited</td>
                <td>✗ One at a time</td>
                <td>✗ Limited</td>
                <td>✓ Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="comparison-summary">
          <h3>The Bottom Line</h3>
          <p><strong>You have three choices:</strong></p>
          <ol>
            <li><strong>Hire staff:</strong> Professional, but $36,000-54,000 per year + benefits + time off</li>
            <li><strong>Traditional answering service:</strong> Available 24/7, but generic, can't book appointments, $300-600/month</li>
            <li><strong>{branding.name}:</strong> Custom AI trained on your business, books appointments, texts you summaries, all from an app—${lowestPrice}/month</li>
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
        <div className="section-header">
          <h2>Join 200+ Businesses Who Never Miss a Call</h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-rating">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <span key={j} style={{ color: '#f59e0b', width: '1.25rem', height: '1.25rem' }}>
                    {Icons.star}
                  </span>
                ))}
              </div>
              <h3>"{testimonial.headline}"</h3>
              <p>"{testimonial.quote}"</p>
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
              {tier.isPopular && (
                <div className="pricing-badge">
                  <span style={{ color: '#f59e0b', width: '1rem', height: '1rem' }}>{Icons.star}</span>
                  Most Popular
                </div>
              )}
              <div className="pricing-header">
                <h3>{tier.name}</h3>
                <div className="pricing-price">
                  <span className="price-currency">$</span>
                  <span className="price-amount">{tier.price}</span>
                  <span className="price-period">/month</span>
                </div>
                <p className="pricing-subtitle">{tier.subtitle}</p>
              </div>
              <ul className="pricing-features">
                {tier.features.map((feature, j) => (
                  <li key={j}>{feature.startsWith('Everything') ? <strong>{feature}</strong> : `✓ ${feature}`}</li>
                ))}
              </ul>
              {tier.note && <div className="pricing-note">{tier.note}</div>}
              <a 
                href="/get-started" 
                className={`btn-pricing ${tier.isPopular ? 'btn-primary' : ''}`}
              >
                Start 7-Day Free Trial
              </a>
              {tier.isPopular && (
                <p className="pricing-recommendation">Most businesses choose {tier.name}</p>
              )}
            </div>
          ))}
        </div>

        <div className="pricing-guarantee">
          <p><strong>All plans include:</strong> 7-day free trial (no credit card required) • Cancel anytime (no contracts) • Setup in under 10 minutes • 30-day money-back guarantee • Free migration support</p>
          <p className="pricing-custom">Have 500+ calls per month? <a href={`mailto:${config.footer.email}`}>Contact us for custom pricing →</a></p>
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
  
  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };
  
  return (
    <section id="faq" className="faq">
      <div className="container">
        <div className="section-header">
          <h2>Questions? We've Got Answers.</h2>
        </div>

        <div className="faq-grid">
          {faqs.map((faq, i) => (
            <div key={i} className={`faq-item ${activeIndex === i ? 'active' : ''}`}>
              <button className="faq-question" onClick={() => toggleFAQ(i)}>
                <span>{faq.question}</span>
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-answer">
                <div 
                  className="faq-answer-content"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
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
function FinalCTASection({ config }: { config: MarketingConfig }) {
  const { hero, branding } = config;
  
  return (
    <section className="final-cta">
      <div className="container">
        <div className="final-cta-content">
          <h2>Stop Losing Customers to Voicemail</h2>
          <p className="final-cta-text">
            Every missed call is money out the door. While you're on the job, helping a customer, in a meeting, closed for the night, or on vacation—<strong>your competitors are answering their phones.</strong>
          </p>
          <p className="final-cta-text">
            {branding.name} makes sure you never lose another opportunity because your phone went to voicemail.
          </p>

          <div className="final-cta-boxes">
            {hero.demoPhone && (
              <>
                <div className="cta-box-primary">
                  <h3>
                    <span style={{ width: '1.5rem', height: '1.5rem' }}>{Icons.headphones}</span>
                    Try {branding.name} Right Now (30 Seconds)
                  </h3>
                  <a href={`tel:+1${hero.demoPhone.replace(/\D/g, '')}`} className="cta-phone-large">
                    <span style={{ width: '1.5rem', height: '1.5rem' }}>{Icons.phone}</span>
                    Call: {hero.demoPhone}
                  </a>
                  <p>"Hear it work before you sign up"</p>
                </div>

                <div className="cta-box-divider">or</div>
              </>
            )}

            <div className="cta-box-secondary">
              <a href="/get-started" className="btn-large btn-primary">
                Start Your 7-Day Free Trial
              </a>
              <div className="cta-benefits">
                <span>✓ Setup in 10 minutes</span>
                <span>✓ No credit card required</span>
                <span>✓ Cancel anytime</span>
              </div>
            </div>
          </div>

          <div className="final-trust">
            <p><strong>Join 200+ businesses using {branding.name}:</strong></p>
            <div className="trust-stats">
              <span>✓ 96% customer satisfaction</span>
              <span>✓ 30-day money-back guarantee</span>
              <span>✓ A2P 10DLC compliant</span>
            </div>
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
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              {branding.logoUrl ? (
                <div 
                  className="logo-wrapper"
                  style={{ 
                    backgroundColor: branding.logoBackgroundColor || 'transparent',
                    padding: branding.logoBackgroundColor ? '8px 12px' : '0',
                    borderRadius: '8px',
                    display: 'inline-block',
                  }}
                >
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
            <ul className="footer-links">
              {footer.productLinks.map((link, i) => (
                <li key={i}><a href={link.href}>{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>Industries</h4>
            <ul className="footer-links">
              {footer.industryLinks.map((link, i) => (
                <li key={i}><a href={link.href}>{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              {footer.companyLinks.map((link, i) => (
                <li key={i}><a href={link.href}>{link.label}</a></li>
              ))}
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
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className={`sticky-cta ${visible ? 'visible' : ''}`}>
      <span className="sticky-cta-text">Ready to try {branding.name}?</span>
      <div className="sticky-cta-actions">
        <a href="/get-started" className="btn-primary btn-small">
          Start Free Trial
        </a>
        {hero.demoPhone && (
          <a href={`tel:+1${hero.demoPhone.replace(/\D/g, '')}`} className="btn-ghost btn-small">
            <span style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }}>{Icons.phone}</span>
            Call Demo
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
  // Merge with defaults
  const config: MarketingConfig = {
    ...defaultMarketingConfig,
    ...partialConfig,
    branding: { ...defaultMarketingConfig.branding, ...partialConfig?.branding },
    hero: { ...defaultMarketingConfig.hero, ...partialConfig?.hero },
    stats: { ...defaultMarketingConfig.stats, ...partialConfig?.stats },
    solution: { ...defaultMarketingConfig.solution, ...partialConfig?.solution },
    footer: { ...defaultMarketingConfig.footer, ...partialConfig?.footer },
  };
  
  // Determine theme
  const theme = config.theme || 'light';
  
  // Apply theme colors via CSS variables
  const themeStyle = {
    '--primary-color': config.branding.primaryColor,
    '--primary-hover': config.branding.primaryHoverColor,
    '--accent-color': config.branding.accentColor,
  } as React.CSSProperties;
  
  // Dynamic styles for selection and focus - uses agency primary color
  const dynamicStyles = `
    .marketing-page ::selection {
      background-color: ${config.branding.primaryColor}40;
      color: inherit;
    }
    .marketing-page ::-moz-selection {
      background-color: ${config.branding.primaryColor}40;
      color: inherit;
    }
    .marketing-page input:focus,
    .marketing-page select:focus,
    .marketing-page textarea:focus {
      outline: none;
      border-color: ${config.branding.primaryColor} !important;
      box-shadow: 0 0 0 3px ${config.branding.primaryColor}20 !important;
    }
    .marketing-page input::selection,
    .marketing-page textarea::selection {
      background-color: ${config.branding.primaryColor}40;
    }
  `;
  
  return (
    <div className={`marketing-page theme-${theme}`} style={themeStyle}>
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      <Navigation config={config} />
      <HeroSection config={config} />
      <StatsSection config={config} />
      <ProblemSolutionSection config={config} />
      <HowItWorksSection config={config} />
      <AppShowcaseSection config={config} />
      <FeaturesSection config={config} />
      {config.showIndustries && <IndustriesSection config={config} />}
      {config.showComparison && <ComparisonSection config={config} />}
      {config.showTestimonials && <TestimonialsSection config={config} />}
      <PricingSection config={config} />
      <FAQSection config={config} />
      <FinalCTASection config={config} />
      <Footer config={config} />
      <StickyCTA config={config} />
    </div>
  );
}