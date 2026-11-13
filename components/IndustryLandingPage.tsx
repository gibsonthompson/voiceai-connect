// ============================================================================
// components/IndustryLandingPage.tsx
// ----------------------------------------------------------------------------
// Dedicated, content-rich layout for the built-in industry landing pages
// (auto, medspa, law). Rendered by AgencySiteClient INSTEAD of the homepage
// template when a built-in industry page is requested, so each vertical is a
// substantial standalone page, not the homepage with swapped lines.
//
// Branded entirely through CSS variables set inline from the agency's colors
// (styles/industry.css), so it stays on-brand without mirroring whichever
// homepage template the agency picked. Shared chrome (nav, pricing, footer) is
// expected boilerplate; the unique body is the SEO weight. Emits FAQPage JSON-LD.
// ============================================================================
import type { IndustryPageData } from '@/lib/industry-pages';
import type { MarketingConfig } from '@/types/marketing';
import '@/styles/industry.css';

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

interface AgencyLite {
  name: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
}

export default function IndustryLandingPage({
  agency, content, config, isDark,
}: {
  agency: AgencyLite;
  content: IndustryPageData;
  config: Partial<MarketingConfig>;
  isDark: boolean;
}) {
  const branding: any = config.branding || {};
  const primary = agency.primary_color || branding.primaryColor || '#00a19b';
  const accent = agency.accent_color || '#01f5d1';
  const logo = branding.logoUrl || agency.logo_url || '';
  const name = agency.name;
  const cs = config.currencySymbol || '$';
  const pricing: any[] = Array.isArray(config.pricing) ? config.pricing : [];
  const signupHref = '/signup';

  const rootStyle = { ['--ind-primary' as any]: primary, ['--ind-accent' as any]: accent } as React.CSSProperties;

  // FAQPage schema so the unique Q&A can earn rich results and reinforce the
  // page as substantive, standalone content.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <div className={`ind-root${isDark ? ' ind-dark' : ''}`} style={rootStyle}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* NAV */}
      <nav className="ind-nav">
        <div className="ind-container ind-nav-inner">
          <a className="ind-brand" href="/">
            {logo ? <img src={logo} alt={name} /> : null}
            <span>{name}</span>
          </a>
          <a className="ind-nav-cta" href={signupHref}>Start Free Trial</a>
        </div>
      </nav>

      {/* HERO */}
      <header className="ind-hero">
        <div className="ind-container">
          <span className="ind-eyebrow">{content.label}</span>
          <h1>
            {content.headline.map((line, i) => (
              <span key={i} className={i === content.headline.length - 1 ? 'l2' : undefined}>{line}{i < content.headline.length - 1 ? ' ' : ''}</span>
            ))}
          </h1>
          <p className="ind-hero-sub">{content.subheadline}</p>
          <div className="ind-hero-cta">
            <a className="ind-btn ind-btn-primary" href={signupHref}>Start Free Trial</a>
            <a className="ind-btn ind-btn-ghost" href="#how">See How It Works</a>
          </div>
          <div className="ind-hero-bullets">
            {content.heroBullets.map((b, i) => <span key={i} className="ind-chip">{b}</span>)}
          </div>
        </div>
      </header>

      {/* INTRO */}
      <section className="ind-section ind-intro">
        <div className="ind-container">
          {content.intro.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* SCENARIOS */}
      <section className="ind-section soft" id="how">
        <div className="ind-container">
          <div className="ind-section-head">
            <span className="ind-eyebrow">What Comes In</span>
            <h2>{content.scenarios.heading}</h2>
            <p>{content.scenarios.intro}</p>
          </div>
          <div className="ind-grid">
            {content.scenarios.items.map((it, i) => (
              <div key={i} className="ind-cardrow">
                <h3><span className="ind-num">{i + 1}</span>{it.title}</h3>
                <p>{it.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="ind-section">
        <div className="ind-container">
          <div className="ind-section-head">
            <span className="ind-eyebrow">What It Does</span>
            <h2>{content.capabilities.heading}</h2>
            <p>{content.capabilities.intro}</p>
          </div>
          <div className="ind-grid">
            {content.capabilities.items.map((it, i) => (
              <div key={i} className="ind-cardrow">
                <h3>{it.title}</h3>
                <p>{it.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLE CALL */}
      <section className="ind-section soft">
        <div className="ind-container">
          <div className="ind-section-head">
            <span className="ind-eyebrow">Hear It</span>
            <h2>{content.exampleCall.heading}</h2>
          </div>
          <div className="ind-call">
            <div className="ind-transcript">
              {content.exampleCall.transcript.map((t, i) => (
                <div key={i} className={`ind-tline ${t.speaker}`}>
                  <span className="ind-bubble">{t.text}</span>
                </div>
              ))}
            </div>
            <div className="ind-call-side">
              <span className="ind-eyebrow">The Caller</span>
              <p className="ind-call-context">{content.exampleCall.callerName}. {content.exampleCall.context}</p>
              <div className="ind-summary">
                <p className="k">Texted To You</p>
                <p>{content.exampleCall.summary}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="ind-section">
        <div className="ind-container">
          <div className="ind-section-head">
            <span className="ind-eyebrow">No New Software</span>
            <h2>{content.workflow.heading}</h2>
            <p>{content.workflow.intro}</p>
          </div>
          <div className="ind-grid">
            {content.workflow.items.map((it, i) => (
              <div key={i} className="ind-cardrow">
                <h3>{it.title}</h3>
                <p>{it.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ECONOMICS */}
      <section className="ind-section soft">
        <div className="ind-container">
          <div className="ind-section-head">
            <span className="ind-eyebrow">The Math</span>
            <h2>{content.economics.heading}</h2>
          </div>
          <p className="ind-econ-body">{content.economics.body}</p>
          <div className="ind-stats">
            {content.economics.stats.map((s, i) => (
              <div key={i} className="ind-stat">
                <div className="v">{s.value}</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLIANCE (optional) */}
      {content.compliance ? (
        <section className="ind-section">
          <div className="ind-container">
            <div className="ind-callout">
              <h2>{content.compliance.heading}</h2>
              <p>{content.compliance.body}</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* PRICING */}
      {pricing.length > 0 ? (
        <section className="ind-section soft">
          <div className="ind-container">
            <div className="ind-section-head">
              <span className="ind-eyebrow">Pricing</span>
              <h2>Simple Pricing, No Hidden Fees</h2>
            </div>
            <div className="ind-pricing">
              {pricing.map((t, i) => (
                <div key={i} className={`ind-plan${t.isPopular ? ' pop' : ''}`}>
                  {t.isPopular ? <span className="ind-plan-badge">Most Popular</span> : null}
                  <h3>{t.name}</h3>
                  <div className="price">{cs}{t.price}<span>/mo</span></div>
                  {t.subtitle ? <p className="sub">{t.subtitle}</p> : null}
                  <ul>
                    {(Array.isArray(t.features) ? t.features : []).map((f: string, fi: number) => (
                      <li key={fi}><Check />{f}</li>
                    ))}
                  </ul>
                  <a className="ind-btn ind-btn-primary" href={signupHref}>Start Free Trial</a>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section className="ind-section">
        <div className="ind-container">
          <div className="ind-section-head">
            <span className="ind-eyebrow">Questions</span>
            <h2>Questions, Answered</h2>
          </div>
          <div className="ind-faq">
            {content.faqs.map((f, i) => (
              <div key={i} className="ind-faq-item">
                <h3>{f.question}</h3>
                <p>{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="ind-section">
        <div className="ind-container">
          <div className="ind-closing">
            <h2>{content.closing.heading}</h2>
            <p>{content.closing.body}</p>
            <a className="ind-btn" href={signupHref}>Start Free Trial</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ind-footer">
        <div className="ind-container ind-footer-inner">
          <span>{name}</span>
          <span>&copy; {new Date().getFullYear()} {name}. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
