'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import { useState } from 'react';

// ============================================================================
// WAVEFORM ICON
// ============================================================================
function WaveformIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" />
      <rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" />
      <rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

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
    <nav className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <h4 className="text-sm font-semibold text-[#fafaf9]/70 uppercase tracking-wider mb-4">
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
    <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05]">
      <h4 className="font-semibold text-lg">Ready to start your AI voice agency?</h4>
      <p className="mt-2 text-sm text-[#fafaf9]/60">
        VoiceAI Connect gives you everything you need to launch, brand, and scale your agency — with zero coding required.
      </p>
      <Link
        href="/signup"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors"
      >
        Start Your 14-Day Free Trial
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

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                  <WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#fafaf9]" />
                </div>
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link 
                href="/blog" 
                className="text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
              >
                ← Back to Blog
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
      <article className="relative pt-28 sm:pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="max-w-3xl mx-auto text-center mb-12">
            {/* Category */}
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium mb-6 ${categoryColor}`}>
              <Tag className="h-3 w-3" />
              {categoryName}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
              {meta.title}
            </h1>

            {/* Description */}
            <p className="mt-4 text-lg text-[#fafaf9]/60 max-w-2xl mx-auto">
              {meta.description}
            </p>

            {/* Meta */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-[#fafaf9]/50">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
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
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {meta.readTime}
              </span>
            </div>

            {/* Author */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-medium">
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
          <div className="grid lg:grid-cols-[1fr_280px] gap-10 max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="max-w-3xl">
              {/* Prose - WITH PROPER SPACING */}
              <div className="
                prose prose-invert prose-lg max-w-none
                
                /* Headings */
                prose-headings:font-semibold 
                prose-headings:tracking-tight
                prose-headings:text-[#fafaf9]
                
                prose-h2:text-2xl 
                prose-h2:mt-14 
                prose-h2:mb-6 
                prose-h2:pt-6
                prose-h2:border-t
                prose-h2:border-white/[0.06]
                prose-h2:scroll-mt-24
                
                prose-h3:text-xl 
                prose-h3:mt-10 
                prose-h3:mb-4 
                prose-h3:scroll-mt-24
                
                /* Paragraphs - KEY SPACING FIX */
                prose-p:text-[#fafaf9]/70 
                prose-p:leading-relaxed
                prose-p:mb-6
                
                /* Lead paragraph */
                [&>.lead]:text-xl
                [&>.lead]:text-[#fafaf9]/80
                [&>.lead]:leading-relaxed
                [&>.lead]:mb-8
                
                /* Links */
                prose-a:text-emerald-400 
                prose-a:no-underline 
                hover:prose-a:underline
                
                /* Bold/Strong */
                prose-strong:text-[#fafaf9] 
                prose-strong:font-semibold
                
                /* Lists - KEY SPACING FIX */
                prose-ul:my-6
                prose-ul:text-[#fafaf9]/70 
                prose-ol:my-6
                prose-ol:text-[#fafaf9]/70
                prose-li:mb-3
                prose-li:leading-relaxed
                prose-li:marker:text-emerald-500
                
                /* Blockquotes */
                prose-blockquote:border-l-emerald-500 
                prose-blockquote:bg-white/[0.02] 
                prose-blockquote:py-1 
                prose-blockquote:px-4 
                prose-blockquote:rounded-r-lg
                prose-blockquote:my-8
                
                /* Code */
                prose-code:text-emerald-400 
                prose-code:bg-white/[0.05] 
                prose-code:px-1.5 
                prose-code:py-0.5 
                prose-code:rounded 
                prose-code:before:content-none 
                prose-code:after:content-none
                
                /* Code blocks */
                prose-pre:bg-[#0a0a0a] 
                prose-pre:border 
                prose-pre:border-white/[0.08]
                prose-pre:my-8
                
                /* Tables */
                prose-table:border-collapse
                prose-table:my-8
                prose-th:border 
                prose-th:border-white/[0.1] 
                prose-th:bg-white/[0.03] 
                prose-th:px-4 
                prose-th:py-2
                prose-td:border 
                prose-td:border-white/[0.08] 
                prose-td:px-4 
                prose-td:py-2
                
                /* HR */
                prose-hr:border-white/[0.08]
                prose-hr:my-12
              ">
                {children}
              </div>

              {/* Tags */}
              {meta.tags && meta.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-white/[0.08]">
                  <div className="flex flex-wrap gap-2">
                    {meta.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm text-[#fafaf9]/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-[#fafaf9]/50">Share this article</p>
                <ShareButton title={meta.title} url={typeof window !== 'undefined' ? window.location.href : ''} />
              </div>

              {/* CTA */}
              <div className="mt-12">
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
      <footer className="relative border-t border-white/[0.06] py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                <WaveformIcon className="w-4 h-4 text-[#fafaf9]" />
              </div>
              <span className="text-sm font-medium">VoiceAI Connect</span>
            </div>

            <p className="text-sm text-[#fafaf9]/30">
              © 2025 VoiceAI Connect. All rights reserved.
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
    info: 'border-blue-500/20 bg-blue-500/[0.05]',
    tip: 'border-emerald-500/20 bg-emerald-500/[0.05]',
    warning: 'border-amber-500/20 bg-amber-500/[0.05]',
  };

  const iconColors = {
    info: 'text-blue-400',
    tip: 'text-emerald-400',
    warning: 'text-amber-400',
  };

  return (
    <div className={`my-8 p-5 rounded-xl border ${styles[type]}`}>
      {title && (
        <p className={`font-semibold mb-2 ${iconColors[type]}`}>{title}</p>
      )}
      <div className="text-[#fafaf9]/70 text-sm leading-relaxed [&>p]:m-0">{children}</div>
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
    <div className="my-8 overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="text-left font-semibold px-4 py-3 bg-white/[0.03] border-b border-white/[0.08]">
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
  );
}

export function StepList({ 
  steps 
}: { 
  steps: { title: string; description: string }[] 
}) {
  return (
    <div className="my-8 space-y-4">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-sm">
            {i + 1}
          </div>
          <div>
            <p className="font-semibold text-[#fafaf9]">{step.title}</p>
            <p className="mt-1 text-sm text-[#fafaf9]/60 leading-relaxed">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}