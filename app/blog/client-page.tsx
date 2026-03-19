'use client';

import Link from 'next/link';
import { ArrowRight, Search, ChevronRight, Menu, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

// ============================================================================ ============================================================================
// NAV LINKS (shared between desktop + mobile)
// ============================================================================
const navLinks = [
  { name: 'Platform', href: '/platform' },
  { name: 'How It Works', href: '/#how-it-works' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'Blog', href: '/blog' },
  { name: 'Referral Program', href: '/referral-program' },
];

// ============================================================================
// CATEGORIES
// ============================================================================
const categories = [
  { id: 'all', name: 'All Posts' },
  { id: 'guides', name: 'Guides' },
  { id: 'industry', name: 'Industry' },
  { id: 'product', name: 'Product Updates' },
];

// ============================================================================
// BLOG POSTS DATA
// ============================================================================
interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  // International Market Posts
  {
    slug: 'start-ai-receptionist-agency-from-india',
    title: 'How to Start an AI Receptionist Agency from India (Sell to US Businesses)',
    excerpt: 'Indian entrepreneurs can build a $5,000-$15,000/month AI receptionist agency serving US businesses. Complete guide covering setup, payments, outreach, and earning in USD.',
    category: 'guides',
    publishedAt: '2026-02-13',
    readTime: '14 min',
    featured: true,
  },
  {
    slug: 'start-ai-business-from-anywhere',
    title: 'Start a US-Facing AI Receptionist Business from Anywhere in the World',
    excerpt: "You don't need to live in the US to sell AI receptionists to US businesses. Complete guide for international entrepreneurs earning $3K-$15K/month in USD remotely.",
    category: 'guides',
    publishedAt: '2026-02-13',
    readTime: '16 min',
  },
  // Core Guides
  {
    slug: 'how-to-start-ai-receptionist-agency',
    title: 'How to Start an AI Receptionist Agency in 2026',
    excerpt: 'Complete guide from finding your first clients to scaling to $50k/month recurring revenue.',
    category: 'guides',
    publishedAt: '2026-01-28',
    readTime: '12 min',
    featured: true,
  },
  {
    slug: 'how-much-do-ai-receptionist-agencies-make',
    title: 'How Much Do AI Receptionist Agencies Make? Real Numbers',
    excerpt: 'Realistic income breakdown: $3,000-$15,000/month within 12 months. See month-by-month progression and profit margins.',
    category: 'guides',
    publishedAt: '2026-01-28',
    readTime: '12 min',
  },
  {
    slug: 'ai-receptionist-agency-vs-smma',
    title: 'AI Receptionist Agency vs SMMA: Which Model Wins?',
    excerpt: '80-96% margins vs 20-40%. Compare time requirements, competition, and which business model suits you.',
    category: 'guides',
    publishedAt: '2026-01-28',
    readTime: '14 min',
  },
  // Industry Posts
  {
    slug: 'ai-receptionist-for-plumbers',
    title: 'AI Receptionist for Plumbers: Never Miss an Emergency Call Again',
    excerpt: 'Plumbers miss 30-40% of incoming calls. Learn how AI receptionists capture every lead, book jobs, and handle after-hours emergencies.',
    category: 'industry',
    publishedAt: '2026-01-30',
    readTime: '10 min',
  },
  {
    slug: 'ai-receptionist-for-dentists',
    title: 'AI Receptionist for Dental Offices: Book More Patients Automatically',
    excerpt: 'Dental offices lose $200+ per missed call. See how AI receptionists handle appointment booking, insurance questions, and patient intake.',
    category: 'industry',
    publishedAt: '2026-01-30',
    readTime: '10 min',
  },
  {
    slug: 'ai-receptionist-for-lawyers',
    title: 'AI Receptionist for Law Firms: Capture Every Potential Client',
    excerpt: 'Law firms miss 35% of new client calls. AI receptionists qualify leads, schedule consultations, and handle intake 24/7.',
    category: 'industry',
    publishedAt: '2026-01-30',
    readTime: '10 min',
  },
  {
    slug: 'ai-receptionist-for-hvac',
    title: 'AI Receptionist for HVAC Companies: Win More Service Calls',
    excerpt: 'HVAC businesses lose thousands in missed calls during peak season. AI receptionists book appointments and dispatch technicians instantly.',
    category: 'industry',
    publishedAt: '2026-01-30',
    readTime: '10 min',
  },
  {
    slug: 'ai-receptionist-for-real-estate',
    title: 'AI Receptionist for Real Estate Agents: Never Lose a Lead',
    excerpt: 'Real estate leads go cold in minutes. AI receptionists qualify buyers, schedule showings, and respond to inquiries instantly.',
    category: 'industry',
    publishedAt: '2026-01-30',
    readTime: '10 min',
  },
  // Product Updates
  {
    slug: 'white-label-ai-receptionist-platform',
    title: 'White-Label AI Receptionist Platform: Everything You Need to Know',
    excerpt: 'A deep dive into what makes a white-label AI receptionist platform work, what to look for, and how VoiceAI Connect compares.',
    category: 'product',
    publishedAt: '2026-01-29',
    readTime: '11 min',
  },
];

// ============================================================================
// BLOG PAGE
// ============================================================================
export default function BlogPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const featuredPosts = blogPosts.filter((p) => p.featured);

  const categoryColor = (cat: string) => ({
    guides: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    industry: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    product: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  }[cat] || 'bg-white/10 border-white/20 text-white/70');

  const categoryName = (cat: string) => ({
    guides: 'Guide',
    industry: 'Industry',
    product: 'Product Update',
  }[cat] || cat);

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
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full blur-[128px]" />
      </div>

      {/* ─── Navigation (matches homepage exactly) ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled ? 'bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.06]' : 'bg-transparent'
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img src="/icon-512x512.png" alt="VoiceAI Connect" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-xl" />
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`px-4 py-2 text-sm transition-colors rounded-lg hover:bg-white/[0.03] ${
                    item.name === 'Blog' ? 'text-[#fafaf9]' : 'text-[#fafaf9]/60 hover:text-[#fafaf9]'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link href="/agency/login" className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="group relative inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:shadow-lg hover:shadow-white/10">
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -mr-2 text-[#fafaf9]/60 hover:text-[#fafaf9]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-50 bg-[#050505]/98 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="flex flex-col h-full px-6 pt-8 pb-10">
              <div className="space-y-1 flex-1">
                {navLinks.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-2 py-4 text-lg border-b border-white/[0.04] transition-colors ${
                      item.name === 'Blog' ? 'text-[#fafaf9]' : 'text-[#fafaf9]/80 hover:text-[#fafaf9]'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <Link 
                  href="/agency/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-2 py-4 text-lg text-[#fafaf9]/50 hover:text-[#fafaf9] transition-colors"
                >
                  Sign In
                </Link>
              </div>
              <div className="pt-6">
                <Link 
                  href="/signup" 
                  className="flex items-center justify-center gap-2 w-full bg-white text-[#050505] font-medium rounded-full py-4 text-base active:scale-[0.98] transition-transform"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <p className="mt-3 text-center text-xs text-[#fafaf9]/30">No credit card required</p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Main Content ─── */}
      <main className="relative pt-24 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-2 text-sm text-[#fafaf9]/40 mb-6">
            <Link href="/" className="hover:text-[#fafaf9] transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#fafaf9]/70">Blog</span>
          </nav>

          {/* Hero */}
          <div className="text-center mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Insights & Resources
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Guides, industry insights, and product updates to help you build and grow your AI receptionist agency.
            </p>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10 sm:mb-12">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#fafaf9]/30" />
              <input 
                type="text" 
                placeholder="Search articles..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-12 pr-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all" 
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button 
                  key={category.id} 
                  onClick={() => setSelectedCategory(category.id)} 
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-white text-[#050505]'
                      : 'bg-white/[0.05] text-[#fafaf9]/60 hover:bg-white/[0.1] hover:text-[#fafaf9] border border-white/[0.08]'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Posts (only show when no search/filter active) */}
          {selectedCategory === 'all' && searchQuery === '' && featuredPosts.length > 0 && (
            <section className="mb-12 sm:mb-16" aria-label="Featured articles">
              <h2 className="text-lg font-semibold text-[#fafaf9]/50 mb-5">Featured</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {featuredPosts.map((post) => (
                  <Link 
                    key={post.slug} 
                    href={`/blog/${post.slug}`}
                    className="group block rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 sm:p-7 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.06]"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${categoryColor(post.category)}`}>
                        {categoryName(post.category)}
                      </span>
                      <span className="text-xs text-[#fafaf9]/40">{post.readTime}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold group-hover:text-emerald-400 transition-colors leading-tight mb-3">
                      {post.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#fafaf9]/50 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="mt-5 flex items-center gap-2 text-sm text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Read article
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All Posts */}
          <section aria-label="All articles">
            {selectedCategory === 'all' && searchQuery === '' && (
              <h2 className="text-lg font-semibold text-[#fafaf9]/50 mb-5">All Articles</h2>
            )}

            {filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#fafaf9]/50 text-lg">No articles found.</p>
                <p className="text-[#fafaf9]/30 text-sm mt-2">Try a different search or category.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <Link 
                    key={post.slug} 
                    href={`/blog/${post.slug}`}
                    className="group block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${categoryColor(post.category)}`}>
                        {categoryName(post.category)}
                      </span>
                      <span className="text-xs text-[#fafaf9]/40">{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-[#fafaf9]/50 line-clamp-2">{post.excerpt}</p>
                    <div className="mt-4 flex items-center gap-1 text-sm text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Read more
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="mt-16 sm:mt-20 p-6 sm:p-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Ready to start your AI receptionist agency?
            </h2>
            <p className="mt-3 text-[#fafaf9]/50 max-w-lg mx-auto">
              Launch in under 24 hours. No tech skills. Keep 100% of what you charge.
            </p>
            <div className="mt-6">
              <Link 
                href="/signup" 
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#050505] hover:bg-[#fafaf9] hover:shadow-lg hover:shadow-white/10 transition-all"
              >
                Start Your Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="mt-4 text-xs text-[#fafaf9]/40">No credit card required · 14-day free trial</p>
          </section>
        </div>
      </main>

      {/* ─── Footer (matches homepage) ─── */}
      <footer className="border-t border-white/[0.06] py-10 sm:py-12 mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img src="/icon-512x512.png" alt="VoiceAI Connect" className="h-7 w-7 rounded-lg" />
              <span className="text-sm font-semibold">VoiceAI Connect</span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#fafaf9]/40">
              <Link href="/platform" className="hover:text-[#fafaf9] transition-colors">Platform</Link>
              <Link href="/features" className="hover:text-[#fafaf9] transition-colors">Features</Link>
              <Link href="/blog" className="hover:text-[#fafaf9] transition-colors">Blog</Link>
              <Link href="/referral-program" className="hover:text-[#fafaf9] transition-colors">Referral Program</Link>
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
              <a href="mailto:support@voiceaiconnect.com" className="hover:text-[#fafaf9] transition-colors">Contact</a>
            </div>
            <p className="text-xs text-[#fafaf9]/25">© 2026 VoiceAI Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}