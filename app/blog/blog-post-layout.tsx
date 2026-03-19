'use client';

import Link from 'next/link';
import { Calendar, Clock, Tag, Twitter, Linkedin, Link as LinkIcon, Check, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import './article.css';

// ============================================================================ ============================================================================
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

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={shareOnTwitter}
        className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </button>
      <button
        onClick={shareOnLinkedIn}
        className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
        title="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </button>
      <button
        onClick={handleCopy}
        className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
        title="Copy link"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <LinkIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ============================================================================
// TABLE OF CONTENTS
// ============================================================================
function TableOfContents({ items }: { items: TableOfContentsItem[] }) {
  return (
    <nav className="p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <h4 className="text-sm font-semibold text-[#fafaf9]/70 uppercase tracking-wider mb-3 sm:mb-4">
        On This Page
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block text-sm transition-colors hover:text-emerald-400 ${
                item.level === 2 ? 'text-[#fafaf9]/60' : 'text-[#fafaf9]/40 pl-4'
              }`}
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
// CTA BOX
// ============================================================================
function CTABox() {
  return (
    <div className="p-5 sm:p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05]">
      <h4 className="font-semibold text-base sm:text-lg">Launch your AI receptionist agency.</h4>
      <p className="mt-2 text-sm text-[#fafaf9]/60">
        White-label platform. Your brand. 60-second client onboarding. 14-day free trial, no credit card required.
      </p>
      <div className="mt-4 space-y-2">
        <Link
          href="/signup"
          style={{ color: '#050505' }}
          className="flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium hover:bg-emerald-400 transition-colors no-underline hover:no-underline"
        >
          Start Free Trial
        </Link>
        <Link
          href="/interactive-demo"
          style={{ color: '#fafaf9' }}
          className="flex items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.1] px-5 py-2.5 text-sm font-medium hover:bg-white/[0.1] transition-colors no-underline hover:no-underline"
        >
          See Live Demo
        </Link>
      </div>
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
  const categoryColor = {
    guides: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'case-studies': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    industry: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    product: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }[meta.category] || 'bg-white/10 text-white/70 border-white/20';

  const categoryName = {
    guides: 'Guide',
    'case-studies': 'Case Study',
    industry: 'Industry Insights',
    product: 'Product Update',
  }[meta.category] || meta.category;

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      {/* Grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[128px]" />
      </div>

      {/* Header — matches homepage logo pattern exactly */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img src="/icon-512x512.png" alt="VoiceAI Connect" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-xl" />
              </div>
              <span className="text-sm sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link 
                href="/blog" 
                className="text-xs sm:text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
              >
                ← Blog
              </Link>
              <Link 
                href="/signup"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#050505] hover:bg-[#fafaf9] transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="relative pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
            {/* Category */}
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium mb-4 sm:mb-6 ${categoryColor}`}>
              <Tag className="h-3 w-3" />
              {categoryName}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight leading-tight">
              {meta.title}
            </h1>

            {/* Description */}
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[#fafaf9]/60 max-w-2xl mx-auto">
              {meta.description}
            </p>

            {/* Meta */}
            <div className="mt-5 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#fafaf9]/50">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {new Date(meta.publishedAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              {meta.updatedAt && (
                <span className="text-[#fafaf9]/30">
                  (Updated {new Date(meta.updatedAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })})
                </span>
              )}
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {meta.readTime}
              </span>
            </div>

            {/* Author */}
            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-medium text-sm">
                {meta.author.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{meta.author.name}</p>
                {meta.author.role && (
                  <p className="text-xs text-[#fafaf9]/50">{meta.author.role}</p>
                )}
              </div>
            </div>
          </header>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-[1fr_280px] gap-8 lg:gap-10 max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="max-w-3xl min-w-0">
              {/* Article Content - styled via article.css */}
              <div className="article-content">
                {children}
              </div>

              {/* Tags */}
              {meta.tags && meta.tags.length > 0 && (
                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/[0.08]">
                  <div className="flex flex-wrap gap-2">
                    {meta.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 sm:px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs sm:text-sm text-[#fafaf9]/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-6 sm:mt-8 flex items-center justify-between">
                <p className="text-sm text-[#fafaf9]/50">Share this article</p>
                <ShareButton title={meta.title} url={typeof window !== 'undefined' ? window.location.href : ''} />
              </div>

              {/* CTA */}
              <div className="mt-8 sm:mt-12">
                <CTABox />
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block space-y-6">
              <div className="sticky top-28">
                <TableOfContents items={tableOfContents} />
                
                <div className="mt-6">
                  <CTABox />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.06] py-8 sm:py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/icon-512x512.png" alt="VoiceAI Connect" className="h-7 w-7 rounded-lg" />
              <span className="text-sm font-medium">VoiceAI Connect</span>
            </Link>

            <p className="text-xs text-[#fafaf9]/25">
              © 2026 VoiceAI Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// CONTENT COMPONENTS (for use in blog posts)
// ============================================================================
export function Callout({ 
  type = 'info', 
  title, 
  children 
}: { 
  type?: 'info' | 'tip' | 'warning'; 
  title?: string; 
  children: React.ReactNode 
}) {
  const styles = {
    info: 'border-blue-500/30 bg-blue-500/[0.08]',
    tip: 'border-emerald-500/30 bg-emerald-500/[0.08]',
    warning: 'border-amber-500/30 bg-amber-500/[0.08]',
  };

  const iconColors = {
    info: 'text-blue-400',
    tip: 'text-emerald-400',
    warning: 'text-amber-400',
  };

  return (
    <div className={`my-6 sm:my-8 p-4 sm:p-6 rounded-xl border ${styles[type]}`}>
      {title && (
        <p className={`font-semibold text-base sm:text-lg mb-2 sm:mb-3 ${iconColors[type]}`}>{title}</p>
      )}
      <div className="text-[#fafaf9]/70 text-sm sm:text-base leading-relaxed [&>p]:m-0">{children}</div>
    </div>
  );
}

export function ComparisonTable({ 
  headers, 
  rows 
}: { 
  headers: string[]; 
  rows: (string | React.ReactNode)[][] 
}) {
  return (
    <div className="my-6 sm:my-8">
      {/* Desktop: standard table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full text-sm md:text-base">
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="text-left font-semibold px-4 py-3 bg-white/[0.04] border-b border-white/[0.08] text-[#fafaf9] whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.04] last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-[#fafaf9]/70">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="sm:hidden space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2.5">
            {row.map((cell, j) => {
              if (!cell && cell !== 0) return null;
              const header = headers[j];
              if (j === 0) {
                return (
                  <div key={j}>
                    {header && <p className="text-[10px] uppercase tracking-wider text-[#fafaf9]/30 mb-0.5">{header}</p>}
                    <p className="text-sm font-semibold text-[#fafaf9]">{cell}</p>
                  </div>
                );
              }
              return (
                <div key={j} className="flex justify-between items-start gap-3">
                  {header && <span className="text-xs text-[#fafaf9]/40 shrink-0">{header}</span>}
                  <span className="text-sm text-[#fafaf9]/70 text-right">{cell}</span>
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
  steps 
}: { 
  steps: { title: string; description: string }[] 
}) {
  return (
    <div className="my-6 sm:my-8 space-y-3 sm:space-y-4">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-base sm:text-lg">
            {i + 1}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base sm:text-lg text-[#fafaf9]">{step.title}</p>
            <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-[#fafaf9]/60 leading-relaxed">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}