'use client';

import Link from 'next/link';
import { Calendar, Clock, Twitter, Linkedin, Link as LinkIcon, Check, ArrowUpRight, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';
import './article.css';

// ============================================================================
// TYPES
// ============================================================================
interface BlogPostMeta {
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  author: {
    name: string;
    role?: string;
    avatar?: string;
  };
  tags?: string[];
}

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

// ============================================================================
// SHARE BUTTON
// ============================================================================
function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const btnCls = 'p-2 rounded-lg border border-black/[0.08] bg-black/[0.02] hover:bg-black/[0.04] transition-colors text-black/55 hover:text-black';

  return (
    <div className="flex items-center gap-2">
      <button onClick={shareOnTwitter} className={btnCls} title="Share on Twitter" aria-label="Share on Twitter">
        <Twitter className="h-4 w-4" />
      </button>
      <button onClick={shareOnLinkedIn} className={btnCls} title="Share on LinkedIn" aria-label="Share on LinkedIn">
        <Linkedin className="h-4 w-4" />
      </button>
      <button onClick={handleCopy} className={btnCls} title="Copy link" aria-label="Copy link">
        {copied ? <Check className="h-4 w-4" style={{ color: '#10b981' }} /> : <LinkIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ============================================================================
// TABLE OF CONTENTS (light variant)
// ============================================================================
function TableOfContents({ items }: { items: TableOfContentsItem[] }) {
  return (
    <nav className="p-5 rounded-xl border border-black/[0.06] bg-black/[0.012]">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-black/45 mb-4">On this page</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block text-[13px] leading-snug transition-colors hover:text-em-deep ${
                item.level === 2 ? 'text-black/70' : 'text-black/45 pl-3'
              }`}
              style={item.level === 2 ? undefined : { color: 'rgba(0,0,0,0.45)' }}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ============================================================================
// CTA BOX (light variant for paper article body)
// ============================================================================
function CTABox() {
  return (
    <div className="p-6 rounded-2xl border border-black/[0.07] bg-gradient-to-br from-emerald-50/60 to-transparent">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase mb-3" style={{ color: '#047857' }}>
        Ready to launch?
      </p>
      <h4 className="font-display font-medium text-[20px] text-black leading-snug">
        Launch your AI receptionist agency.
      </h4>
      <p className="mt-3 text-[14px] text-black/60 leading-relaxed">
        White-label platform. Your brand. 60-second client onboarding. 14-day free trial, no credit card required.
      </p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link href="/signup" className="btn btn-ink">
          Start free trial <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
        <Link href="/interactive-demo" className="btn btn-ghost-light">
          Watch demo <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// CTA BOX (dark variant for sidebar)
// ============================================================================
function CTABoxDark() {
  return (
    <div className="p-5 rounded-xl border border-em-400/30 bg-gradient-to-br from-emerald-500/[0.08] to-transparent">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase mb-2.5" style={{ color: '#4aeabc' }}>
        Ready to launch?
      </p>
      <h4 className="font-display font-medium text-[15px] text-black leading-snug">
        Start a 14-day free trial.
      </h4>
      <p className="mt-2 text-[12px] text-black/55 leading-relaxed">
        White-label platform. Your brand. No credit card required.
      </p>
      <Link href="/signup" className="mt-4 inline-flex items-center justify-center gap-1.5 w-full rounded-full py-2.5 font-mono text-[10px] tracking-[0.14em] uppercase font-medium text-black transition-all hover:brightness-110" style={{ background: '#4aeabc' }}>
        Start free trial <ArrowUpRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ============================================================================
// BLOG POST LAYOUT
// ============================================================================
export default function BlogPostLayout({
  meta,
  tableOfContents,
  children,
}: {
  meta: BlogPostMeta;
  tableOfContents: TableOfContentsItem[];
  children: React.ReactNode;
}) {
  const categoryName = {
    guides: 'Guide',
    'case-studies': 'Case Study',
    industry: 'Industry Insights',
    product: 'Product Update',
  }[meta.category] || meta.category;

  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* ════════ ARTICLE HEADER — DARK ════════ */}
      <section className="canvas-dot relative pt-32 lg:pt-40 pb-16 lg:pb-20 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div className="max-w-3xl">
            <Link href="/blog" className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-white/45 hover:text-white transition-colors mb-7">
              ← Back to blog
            </Link>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase mb-5" style={{ color: '#4aeabc' }}>
              {categoryName}
            </p>
            <h1 className="font-display font-medium text-white tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', letterSpacing: '-0.025em' }}>
              {meta.title}
            </h1>
            <p className="mt-6 text-base sm:text-lg text-white/55 leading-relaxed max-w-2xl">
              {meta.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-white/40">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(meta.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              {meta.updatedAt && (
                <span className="text-white/25">
                  Updated {new Date(meta.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span className="hidden sm:inline text-white/20">·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {meta.readTime}
              </span>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full flex items-center justify-center font-display font-medium text-[13px]" style={{ background: 'rgba(74, 234, 188, 0.12)', color: '#4aeabc', border: '1px solid rgba(74, 234, 188, 0.25)' }}>
                {meta.author.name.charAt(0)}
              </div>
              <div>
                <p className="font-display text-[13px] font-medium text-white">{meta.author.name}</p>
                {meta.author.role && (
                  <p className="font-mono text-[10px] text-white/40 mt-0.5">{meta.author.role}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ ARTICLE BODY — LIGHT ════════ */}
      <section className="bg-paper">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-14 lg:py-20">
          <div className="grid lg:grid-cols-[1fr_280px] gap-10 lg:gap-14 max-w-6xl mx-auto">
            {/* Main content */}
            <div className="max-w-[720px] min-w-0">
              <div className="article-content">
                {children}
              </div>

              {/* Tags */}
              {meta.tags && meta.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-black/[0.06]">
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-black/40 mb-4">Tagged</p>
                  <div className="flex flex-wrap gap-2">
                    {meta.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full border border-black/[0.08] bg-black/[0.02] text-[12px] text-black/65">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-8 pt-6 border-t border-black/[0.06] flex items-center justify-between">
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-black/45">Share article</p>
                <ShareButton title={meta.title} url={typeof window !== 'undefined' ? window.location.href : ''} />
              </div>

              {/* End-of-post CTA */}
              <div className="mt-10">
                <CTABox />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                {tableOfContents.length > 0 && <TableOfContents items={tableOfContents} />}
                <CTABoxDark />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

// ============================================================================
// CONTENT COMPONENTS (for use in handcoded blog posts)
// ============================================================================
export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'tip' | 'warning';
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: { border: 'rgba(59, 130, 246, 0.25)', bg: 'rgba(59, 130, 246, 0.04)', titleColor: '#1d4ed8' },
    tip: { border: 'rgba(16, 185, 129, 0.3)', bg: 'rgba(16, 185, 129, 0.05)', titleColor: '#047857' },
    warning: { border: 'rgba(245, 158, 11, 0.3)', bg: 'rgba(245, 158, 11, 0.06)', titleColor: '#b45309' },
  }[type];

  return (
    <div
      className="my-7 p-5 sm:p-6 rounded-xl border"
      style={{ borderColor: styles.border, background: styles.bg }}
    >
      {title && (
        <p className="font-display font-medium text-[15px] mb-2.5" style={{ color: styles.titleColor }}>
          {title}
        </p>
      )}
      <div className="text-[14px] sm:text-[15px] text-black/70 leading-relaxed [&>p]:m-0 [&>p+p]:mt-3">
        {children}
      </div>
    </div>
  );
}

export function ComparisonTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="my-7">
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-black/[0.08]">
        <table className="w-full text-[14px]">
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="text-left font-display font-medium px-4 py-3 bg-black/[0.025] border-b border-black/[0.08] text-black whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-black/[0.05] last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-black/70 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-black/[0.08] bg-black/[0.012] p-4 space-y-2.5">
            {row.map((cell, j) => {
              if (!cell && cell !== 0) return null;
              const header = headers[j];
              if (j === 0) {
                return (
                  <div key={j}>
                    {header && <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-black/35 mb-0.5">{header}</p>}
                    <p className="font-display text-[14px] font-medium text-black">{cell}</p>
                  </div>
                );
              }
              return (
                <div key={j} className="flex justify-between items-start gap-3">
                  {header && <span className="font-mono text-[11px] text-black/40 shrink-0">{header}</span>}
                  <span className="text-[13px] text-black/70 text-right">{cell}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepList({
  steps,
}: {
  steps: { title: string; description: string }[];
}) {
  return (
    <div className="my-7 space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4 p-5 rounded-xl border border-black/[0.07] bg-black/[0.012]">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display font-medium text-[13px]"
            style={{ background: 'rgba(74, 234, 188, 0.14)', color: '#047857', border: '1px solid rgba(74, 234, 188, 0.25)' }}
          >
            {i + 1}
          </div>
          <div className="min-w-0">
            <p className="font-display font-medium text-[15px] text-black">{step.title}</p>
            <p className="mt-1.5 text-[14px] text-black/60 leading-relaxed">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
