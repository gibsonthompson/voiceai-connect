'use client';

import { useState, useEffect, useMemo } from 'react';
import '@/styles/marketing.css';

// ============================================================================
// TYPES
// ============================================================================
interface Agency {
  id: string;
  name: string;
  slug: string;
  status: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  website_theme: 'light' | 'dark' | 'auto' | null;
  logo_background_color: string | null;
  support_email: string | null;
  support_phone: string | null;
  price_starter: number | null;
  display_currency: string | null;
  marketing_domain: string | null;
  domain_verified: boolean | null;
  legal_overrides: Record<string, string> | null;
}

interface LegalTemplate {
  type: string;
  title: string;
  content: string;
  version: number;
  updatedAt: string;
}

interface LegalPageProps {
  type: 'terms' | 'privacy';
}

// ============================================================================
// HELPERS
// ============================================================================
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
// PLACEHOLDER REPLACEMENT
// ============================================================================
function replacePlaceholders(content: string, agency: Agency): string {
  const cs = agency.display_currency === 'GBP' ? '£' : agency.display_currency === 'EUR' ? '€' : '$';
  const lowestPrice = agency.price_starter ? Math.round(agency.price_starter / 100) : 49;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return content
    .replace(/\{\{AGENCY_NAME\}\}/g, agency.name)
    .replace(/\{\{SUPPORT_EMAIL\}\}/g, agency.support_email || 'support@example.com')
    .replace(/\{\{SUPPORT_PHONE\}\}/g, agency.support_phone || '')
    .replace(/\{\{CURRENCY_SYMBOL\}\}/g, cs)
    .replace(/\{\{LOWEST_PRICE\}\}/g, String(lowestPrice))
    .replace(/\{\{EFFECTIVE_DATE\}\}/g, today);
}

// ============================================================================
// SIMPLE MARKDOWN → HTML RENDERER
// Handles: headings, bold, italic, lists, tables, horizontal rules, links,
//          paragraphs. Safe for controlled content (not user input).
// ============================================================================
function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inList = false;
  let inTable = false;
  let tableHeaderDone = false;
  let inParagraph = false;

  function closeParagraph() {
    if (inParagraph) { html.push('</p>'); inParagraph = false; }
  }
  function closeList() {
    if (inList) { html.push('</ul>'); inList = false; }
  }
  function closeTable() {
    if (inTable) { html.push('</tbody></table></div>'); inTable = false; tableHeaderDone = false; }
  }

  function inlineFormat(text: string): string {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    text = text.replace(/`(.+?)`/g, '<code>$1</code>');
    // Links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (trimmed === '') {
      closeParagraph();
      closeList();
      closeTable();
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed)) {
      closeParagraph(); closeList(); closeTable();
      html.push('<hr/>');
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeParagraph(); closeList(); closeTable();
      const level = headingMatch[1].length;
      const text = inlineFormat(headingMatch[2]);
      const id = headingMatch[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      html.push(`<h${level} id="${id}">${text}</h${level}>`);
      continue;
    }

    // Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeParagraph(); closeList();
      const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());

      // Separator row (|---|---|)
      if (cells.every(c => /^-+$/.test(c))) {
        tableHeaderDone = true;
        continue;
      }

      if (!inTable) {
        html.push('<div class="legal-table-wrapper"><table class="legal-table"><thead><tr>');
        cells.forEach(c => html.push(`<th>${inlineFormat(c)}</th>`));
        html.push('</tr></thead><tbody>');
        inTable = true;
        continue;
      }

      html.push('<tr>');
      cells.forEach(c => html.push(`<td>${inlineFormat(c)}</td>`));
      html.push('</tr>');
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      closeParagraph(); closeTable();
      if (!inList) { html.push('<ul>'); inList = true; }
      const text = inlineFormat(trimmed.replace(/^[-*]\s+/, ''));
      html.push(`<li>${text}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      closeParagraph(); closeTable();
      // Switch to ordered list if not in list
      if (inList) { closeList(); }
      if (!inList) {
        html.push('<ol>');
        inList = true;
      }
      const text = inlineFormat(trimmed.replace(/^\d+\.\s+/, ''));
      html.push(`<li>${text}</li>`);
      continue;
    }

    // Regular paragraph text
    closeList(); closeTable();
    if (!inParagraph) {
      html.push('<p>');
      inParagraph = true;
    } else {
      html.push(' ');
    }
    html.push(inlineFormat(trimmed));
  }

  closeParagraph();
  closeList();
  closeTable();

  // Fix: ordered lists used <ul> close, replace
  let result = html.join('\n');
  // Replace <ol>...</ul> with <ol>...</ol>
  result = result.replace(/<ol>([\s\S]*?)<\/ul>/g, '<ol>$1</ol>');

  return result;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function LegalPage({ type }: LegalPageProps) {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [template, setTemplate] = useState<LegalTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agency data
  useEffect(() => {
    async function load() {
      try {
        const host = window.location.hostname;
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

        // Fetch agency data
        const cacheKey = `agency_site_${host}`;
        let agencyData: Agency | null = null;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data, ts } = JSON.parse(cached);
            if (Date.now() - ts < 5 * 60 * 1000) agencyData = data;
          } catch {}
        }
        if (!agencyData) {
          const res = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
          if (!res.ok) { setError('Site not found'); return; }
          const d = await res.json();
          if (!d.agency || ['suspended', 'deleted'].includes(d.agency.status)) { setError('Site not available'); return; }
          agencyData = d.agency;
          try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: d.agency, ts: Date.now() })); } catch {}
        }
        setAgency(agencyData);

        // Check for agency-specific legal override
        if (agencyData?.legal_overrides?.[type]) {
          setTemplate({
            type,
            title: type === 'terms' ? 'Terms of Service' : 'Privacy Policy',
            content: agencyData.legal_overrides[type],
            version: 1,
            updatedAt: new Date().toISOString(),
          });
          return;
        }

        // Fetch default template
        const templateRes = await fetch(`${backendUrl}/api/legal/template?type=${type}`);
        if (!templateRes.ok) { setError('Legal page not found'); return; }
        const templateData = await templateRes.json();
        setTemplate(templateData.template);
      } catch (err) {
        console.error('Legal page load error:', err);
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type]);

  // Set page title and favicon
  useEffect(() => {
    if (!agency) return;
    if (agency.logo_url) setFavicon(agency.logo_url);
    const pageTitle = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';
    document.title = `${pageTitle} — ${agency.name}`;
  }, [agency, type]);

  // Process content: replace placeholders and convert markdown
  const renderedHtml = useMemo(() => {
    if (!template || !agency) return '';
    const withPlaceholders = replacePlaceholders(template.content, agency);
    return markdownToHtml(withPlaceholders);
  }, [template, agency]);

  // Loading state
  if (loading) {
    const t = getCachedTheme();
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: t === 'dark' ? '#0f0f0f' : '#fff' }}>
        <div style={{ width: 40, height: 40, border: '3px solid transparent', borderTopColor: '#888', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error || !agency || !template) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{error || 'Not found'}</h1>
          <p style={{ color: '#6b7280' }}>This page is not available.</p>
        </div>
      </div>
    );
  }

  // Theme and colors
  const pc = agency.primary_color || '#10b981';
  const sc = agency.secondary_color || adjustColor(pc, -15);
  const theme = agency.website_theme || 'light';
  const isDark = theme === 'dark';
  const textOnPrimary = isLightColor(pc) ? '#1f2937' : '#ffffff';
  const homeUrl = resolveHomepageUrl(agency);
  const logoBgColor = agency.logo_background_color && agency.logo_background_color !== '#000000' && agency.logo_background_color !== '#000'
    ? agency.logo_background_color : 'transparent';

  const themeVars = {
    '--primary-color': pc,
    '--primary-hover': sc,
    '--accent-color': agency.accent_color || '#34d399',
    '--primary-rgb': hexToRgbString(pc),
    '--accent-rgb': hexToRgbString(agency.accent_color || '#34d399'),
    '--primary-text-color': textOnPrimary,
  } as React.CSSProperties;

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

      {/* ── LEGAL CONTENT ── */}
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '6rem 1.5rem 4rem',
      }}>
        <style>{`
          .legal-content h1 {
            font-family: var(--font-primary);
            font-size: clamp(1.75rem, 4vw, 2.5rem);
            font-weight: 800;
            color: var(--text-dark);
            margin-bottom: 0.5rem;
            line-height: 1.2;
          }
          .legal-content h2 {
            font-family: var(--font-primary);
            font-size: 1.375rem;
            font-weight: 700;
            color: var(--text-dark);
            margin-top: 2.5rem;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border-color);
          }
          .legal-content h3 {
            font-family: var(--font-primary);
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-dark);
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
          }
          .legal-content p {
            font-size: 0.9375rem;
            line-height: 1.75;
            color: var(--text-medium);
            margin-bottom: 1rem;
          }
          .legal-content ul, .legal-content ol {
            margin-left: 1.5rem;
            margin-bottom: 1rem;
            color: var(--text-medium);
          }
          .legal-content li {
            font-size: 0.9375rem;
            line-height: 1.75;
            margin-bottom: 0.375rem;
          }
          .legal-content strong {
            color: var(--text-dark);
            font-weight: 600;
          }
          .legal-content hr {
            border: none;
            border-top: 1px solid var(--border-color);
            margin: 2rem 0;
          }
          .legal-content a {
            color: var(--primary-color);
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          .legal-content a:hover {
            opacity: 0.8;
          }
          .legal-content code {
            background: var(--bg-secondary);
            padding: 0.125rem 0.375rem;
            border-radius: 4px;
            font-size: 0.875rem;
          }
          .legal-table-wrapper {
            overflow-x: auto;
            margin: 1rem 0;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
          }
          .legal-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
          }
          .legal-table th {
            background: var(--bg-secondary);
            padding: 0.75rem 1rem;
            text-align: left;
            font-weight: 600;
            color: var(--text-dark);
            border-bottom: 2px solid var(--border-color);
          }
          .legal-table td {
            padding: 0.625rem 1rem;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-medium);
          }
          .legal-table tr:last-child td {
            border-bottom: none;
          }
        `}</style>
        <div
          className="legal-content"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </main>

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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.813rem', marginTop: '0.5rem' }}>
              <a href={homeUrl} style={{ color: 'var(--text-medium)' }}>Home</a>
              <a href="/get-started" style={{ color: 'var(--text-medium)' }}>Get Started</a>
              <a href="/privacy" style={{ color: 'var(--text-medium)', fontWeight: type === 'privacy' ? 700 : 400 }}>Privacy</a>
              <a href="/terms" style={{ color: 'var(--text-medium)', fontWeight: type === 'terms' ? 700 : 400 }}>Terms</a>
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