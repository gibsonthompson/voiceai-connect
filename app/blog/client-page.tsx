'use client';

import Link from 'next/link';
import { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowUpRight, ArrowRight, Search, Clock } from 'lucide-react';
import MarketingNav from '@/components/marketing-nav';
import MarketingFooter from '@/components/marketing-footer';

function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); obs.unobserve(el); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

const categories = [
  { id: 'all', name: 'All' },
  { id: 'guides', name: 'Guides' },
  { id: 'comparison', name: 'Comparisons' },
  { id: 'industry', name: 'Industry' },
  { id: 'product', name: 'Product Updates' },
];

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  featured?: boolean;
  generated?: boolean;
}

const blogPosts: BlogPost[] = [
  // White-Label Content Push (April 2026)
  {
    slug: 'white-label-ai-receptionist-pricing-breakdown',
    title: 'White-Label AI Receptionist Pricing: What Agencies Actually Pay (2026)',
    excerpt: 'Platform fees range from $29-$1,400/month plus $0.05-$0.15/minute for voice. Full pricing breakdown of every major white-label AI receptionist platform with margin calculations.',
    category: 'guides',
    publishedAt: '2026-04-09',
    readTime: '14 min',
    featured: true,
  },
  {
    slug: 'best-white-label-ai-receptionist-platforms-ranked',
    title: 'Best White-Label AI Receptionist Platforms Ranked (2026)',
    excerpt: '8 white-label AI receptionist platforms compared on pricing, branding depth, voice quality, and agency economics. Honest rankings with transparency about our own platform.',
    category: 'comparison',
    publishedAt: '2026-04-10',
    readTime: '16 min',
    featured: true,
  },
  {
    slug: 'how-to-resell-ai-receptionist-services',
    title: 'How to Resell AI Receptionist Services: Complete Agency Guide (2026)',
    excerpt: 'Step-by-step guide to reselling AI receptionist services under your own brand. Choose a white-label platform, set pricing at $99-$299/mo, and build recurring revenue with 80%+ margins.',
    category: 'guides',
    publishedAt: '2026-04-11',
    readTime: '15 min',
  },
  {
    slug: 'white-label-ai-receptionist-lead-gen-agencies',
    title: 'White-Label AI Receptionist for Lead Gen Agencies: The Perfect Add-On',
    excerpt: 'Lead gen agencies spend thousands driving calls that go unanswered. A white-label AI receptionist captures every lead, books appointments, and adds $149/client in recurring revenue.',
    category: 'guides',
    publishedAt: '2026-04-12',
    readTime: '12 min',
  },
  {
    slug: 'set-up-white-label-ai-receptionist-business-24-hours',
    title: 'Set Up a White-Label AI Receptionist Business in 24 Hours (Step-by-Step)',
    excerpt: 'Hour-by-hour guide to launching a white-label AI receptionist business. Platform signup, branding, pricing, demo setup, and first outreach — all in one day.',
    category: 'guides',
    publishedAt: '2026-04-13',
    readTime: '11 min',
  },
  {
    slug: 'white-label-ai-receptionist-compliance-guide',
    title: 'White-Label AI Receptionist Compliance Guide: HIPAA, SOC 2, TCPA, A2P 10DLC',
    excerpt: 'Which compliance certifications matter for AI receptionist agencies? HIPAA for healthcare, SOC 2 for enterprise, TCPA for calling, A2P 10DLC for SMS. Platform comparison included.',
    category: 'guides',
    publishedAt: '2026-04-14',
    readTime: '13 min',
  },
  // White-Label Guides (March 2026)
  {
    slug: 'how-to-choose-white-label-ai-receptionist-platform',
    title: 'How to Choose a White-Label AI Receptionist Platform in 2026',
    excerpt: 'The 9 evaluation criteria that separate platforms you can build a business on from ones that will cost you clients. Architecture, pricing transparency, branding depth, and the questions most buyers skip.',
    category: 'guides',
    publishedAt: '2026-03-21',
    readTime: '18 min',
  },
  {
    slug: 'white-label-ai-voice-agent-platform-agencies',
    title: 'White-Label AI Voice Agent Platform for Agencies: Complete Guide (2026)',
    excerpt: 'The market exploded from 4 platforms to 15+ in 12 months. Navigate wrapper vs. native architectures, hidden BYOK costs, and honest assessments of the 6 major platforms.',
    category: 'guides',
    publishedAt: '2026-03-21',
    readTime: '16 min',
  },
  // Competitor Comparisons (March 2026)
  {
    slug: 'voiceai-connect-vs-autocalls',
    title: 'VoiceAI Connect vs Autocalls: Which White-Label AI Receptionist Fits Your Agency?',
    excerpt: 'Both are native platforms with Stripe Connect billing. The difference: VoiceAI Connect focuses on inbound local business reception. Autocalls adds omnichannel and outbound capabilities.',
    category: 'comparison',
    publishedAt: '2026-03-21',
    readTime: '14 min',
  },
  {
    slug: 'voiceai-connect-vs-echowin',
    title: 'VoiceAI Connect vs echowin: White-Label AI Receptionist Comparison',
    excerpt: 'echowin offers voice + chatbot with partner success resources. VoiceAI Connect focuses on voice-first AI reception for local businesses. Compare pricing, branding, and compliance.',
    category: 'comparison',
    publishedAt: '2026-03-21',
    readTime: '12 min',
  },
  {
    slug: 'voiceai-connect-vs-voxtell',
    title: 'VoiceAI Connect vs Voxtell: White-Label AI Receptionist Comparison',
    excerpt: 'Voxtell leads with 7,000+ MCP integrations and multi-channel AI. VoiceAI Connect leads with industry-specific AI depth. Which matters more for your agency model?',
    category: 'comparison',
    publishedAt: '2026-03-21',
    readTime: '11 min',
  },
  {
    slug: 'voiceai-connect-vs-callin-io',
    title: 'VoiceAI Connect vs Callin.io: White-Label AI Receptionist Comparison',
    excerpt: 'Callin.io offers enterprise platform licensing with industry-vertical solutions. VoiceAI Connect offers self-service agency resale. Different models for different agency profiles.',
    category: 'comparison',
    publishedAt: '2026-03-21',
    readTime: '10 min',
  },
  {
    slug: 'voiceai-connect-vs-insighto',
    title: 'VoiceAI Connect vs Insighto: White-Label AI Agent Comparison',
    excerpt: 'Insighto is chat-first with voice add-on. VoiceAI Connect is voice-first for inbound reception. That architectural origin shapes everything about caller experience quality.',
    category: 'comparison',
    publishedAt: '2026-03-21',
    readTime: '11 min',
  },
  // International Market Posts
  {
    slug: 'start-ai-receptionist-agency-from-india',
    title: 'How to Start an AI Receptionist Agency from India (Sell to US Businesses)',
    excerpt: 'Indian entrepreneurs can build a $5,000-$15,000/month AI receptionist agency serving US businesses. Complete guide covering setup, payments, outreach, and earning in USD.',
    category: 'guides',
    publishedAt: '2026-02-13',
    readTime: '14 min',
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
  // Existing Comparisons
  {
    slug: 'voiceai-connect-vs-trillet',
    title: 'VoiceAI Connect vs Trillet: Which White-Label AI Platform Is Better?',
    excerpt: 'VoiceAI Connect focuses on simplicity and speed-to-revenue. Trillet offers outbound calling and multi-agent orchestration. Full comparison for agency owners.',
    category: 'comparison',
    publishedAt: '2026-02-10',
    readTime: '10 min',
  },
  {
    slug: 'voiceai-connect-vs-goodcall',
    title: 'VoiceAI Connect vs Goodcall: Agency Platform vs D2C — Which Is Right?',
    excerpt: 'Goodcall sells directly to businesses. VoiceAI Connect lets you build an agency. Why that distinction matters for your revenue.',
    category: 'comparison',
    publishedAt: '2026-02-10',
    readTime: '9 min',
  },
  {
    slug: 'best-ai-receptionist-platforms-compared-2026',
    title: 'Best AI Receptionist Platforms Compared (2026)',
    excerpt: 'Comprehensive comparison of every major AI receptionist platform. White-label and D2C solutions with real pricing and honest recommendations.',
    category: 'comparison',
    publishedAt: '2026-02-10',
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

function postUrl(post: BlogPost) {
  return `/blog/${post.slug}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BlogPage({ generatedPosts = [] }: { generatedPosts?: BlogPost[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const r1 = useInView();
  const r2 = useInView();

  const allPosts = useMemo(() => {
    const seen = new Set(blogPosts.map(p => p.slug));
    const merged = [...blogPosts];
    for (const g of generatedPosts) {
      if (!seen.has(g.slug)) merged.push(g);
    }
    return merged.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  }, [generatedPosts]);

  const filtered = useMemo(() => {
    let posts = allPosts;
    if (selectedCategory !== 'all') {
      posts = posts.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)
      );
    }
    return posts;
  }, [allPosts, selectedCategory, searchQuery]);

  const featured = filtered.find(p => p.featured);
  const rest = filtered.filter(p => p !== featured);

  const categoryLabel = (id: string) => {
    return ({ guides: 'Guide', comparison: 'Comparison', industry: 'Industry', product: 'Product' } as Record<string, string>)[id] || 'Article';
  };

  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-12 lg:pb-16 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={r1} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-7">The blog</p>
            <h1 className="t-h1 text-white max-w-[14ch]">Field notes from the AI agency frontier.</h1>
            <p className="t-body mt-7 max-w-xl text-[1rem]">
              Guides, comparisons, and industry analysis for operators building white-label AI receptionist agencies. {allPosts.length} posts and counting.
            </p>

            <div className="mt-9 relative max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts…"
                className="w-full pl-12 pr-5 py-3.5 rounded-full bg-white/[0.025] border border-white/[0.08] text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.25] transition-colors font-display"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section className="bg-ink border-y border-white/[0.05] py-5 sticky top-16 z-30 backdrop-blur-xl" style={{ background: 'rgba(5, 5, 5, 0.85)' }}>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-mono text-[11px] tracking-[0.12em] uppercase whitespace-nowrap border transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white/55 border-white/[0.12] hover:border-white/30 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* POSTS */}
      <section className="bg-ink py-12 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-[20px] text-white/65">No posts match your filters</p>
              <p className="font-mono text-[12px] text-white/35 mt-3">Try a different category or search term.</p>
            </div>
          ) : (
            <>
              {featured && !searchQuery && selectedCategory === 'all' && (
                <Link href={postUrl(featured)} className="group block mb-12 rounded-3xl border border-white/[0.07] bg-white/[0.018] hover:border-white/[0.18] transition-colors overflow-hidden">
                  <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 p-7 lg:p-10">
                    <div className="lg:col-span-7">
                      <div className="flex items-center gap-3 mb-5">
                        <span className="font-mono text-[10px] tracking-[0.16em] uppercase px-2.5 py-1 rounded-full" style={{ background: 'rgba(74, 234, 188, 0.1)', border: '1px solid rgba(74, 234, 188, 0.25)', color: '#4aeabc' }}>
                          Featured
                        </span>
                        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/40">{categoryLabel(featured.category)}</span>
                      </div>
                      <h2 className="font-display font-medium text-white tracking-tight leading-[1.1]" style={{ fontSize: 'clamp(1.625rem, 3vw, 2.5rem)', letterSpacing: '-0.025em' }}>
                        {featured.title}
                      </h2>
                      <p className="text-[15px] text-white/55 leading-relaxed mt-5 max-w-2xl">{featured.excerpt}</p>
                      <div className="mt-7 flex items-center gap-5 font-mono text-[11px] text-white/40">
                        <span>{formatDate(featured.publishedAt)}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{featured.readTime}</span>
                        <span className="flex items-center gap-1.5 ml-auto text-em group-hover:underline">
                          Read article <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                    <div className="hidden lg:flex lg:col-span-5 items-center justify-center">
                      <div className="w-full aspect-[5/3] rounded-2xl border border-white/[0.06]" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(74, 234, 188, 0.08), transparent 60%), linear-gradient(180deg, rgba(20,20,20,0.95), rgba(8,8,8,0.95))' }} />
                    </div>
                  </div>
                </Link>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rest.map(post => (
                  <Link key={post.slug} href={postUrl(post)} className="group rounded-2xl border border-white/[0.06] bg-white/[0.012] hover:border-white/[0.18] transition-colors p-6 flex flex-col">
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-em mb-4">{categoryLabel(post.category)}</span>
                    <h3 className="font-display text-[17px] font-medium text-white tracking-tight leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-[13.5px] text-white/55 leading-relaxed mt-3 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto pt-6 flex items-center gap-4 font-mono text-[10.5px] text-white/40">
                      <span>{formatDate(post.publishedAt)}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{post.readTime}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-white/40 group-hover:text-em transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink canvas-dot py-32 lg:py-40 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <div ref={r2} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Done reading?</p>
            <h2 className="t-h1 text-white">Start the agency you came here to research.</h2>
            <p className="t-body mt-7 max-w-lg">
              14-day free trial, no credit card. By Friday you could have a branded platform live and a Stripe account hooked up.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/platform" className="btn btn-ghost-dark">Platform overview <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
