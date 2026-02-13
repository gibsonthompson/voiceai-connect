'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  Tag,
  Search,
  ChevronRight
} from 'lucide-react';

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
interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  readTime: string;
  featured?: boolean;
  image?: string;
}

// ============================================================================
// CATEGORIES (removed case-studies)
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
const blogPosts: BlogPost[] = [
  // =========================================================================
  // SEO GAP POSTS (February 2026)
  // =========================================================================
  {
    slug: 'smma-profit-margins-2026',
    title: 'SMMA Profit Margins in 2026: Real Numbers & Why Agencies Are Pivoting to AI',
    excerpt: 'SMMA profit margins average 11-20% net in 2026. See real breakdowns by service type, why margins are compressing, and how AI receptionist reselling delivers 60-80% margins instead.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-12',
    readTime: '11 min read',
    featured: true,
  },
  {
    slug: 'ai-agency-profit-margins-2026',
    title: 'AI Agency Profit Margins in 2026: Real Revenue & Margin Data by Model',
    excerpt: 'AI agency profit margins range from 50-90% depending on the model. White-label AI receptionist reselling hits 60-80% net margins. See real numbers at every scale.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-12',
    readTime: '13 min read',
  },
  // =========================================================================
  // PILLAR 5: TRUST & SOCIAL PROOF (February 2026)
  // =========================================================================
  {
    slug: 'mistakes-new-ai-agency-owners-make',
    title: '9 Mistakes New AI Receptionist Agency Owners Make (and How to Avoid Them)',
    excerpt: 'The most common reasons AI receptionist agencies fail in the first 90 days and the simple fixes for each one. Real patterns, not theory.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '13 min read',
    featured: true,
  },
  {
    slug: 'signs-ai-receptionist-agency-is-right-for-you',
    title: '7 Signs an AI Receptionist Agency Is (or Isn\'t) Right for You',
    excerpt: 'An honest self-assessment for anyone considering starting an AI receptionist agency. Not everyone should do this — here are the signals that tell you.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '10 min read',
  },
  // =========================================================================
  // PILLAR 4: AEO DEFINITIVE GUIDES (February 2026)
  // =========================================================================
  {
    slug: 'ai-receptionist-vs-human-receptionist-cost',
    title: 'AI Receptionist vs Human Receptionist: The Complete Cost Comparison',
    excerpt: 'A human receptionist costs $32,000-$45,000/year. An AI receptionist costs $99-$299/month. Full comparison including capabilities, limitations, and when each makes sense.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '12 min read',
    featured: true,
  },
  {
    slug: 'ai-receptionist-agency-profit-calculator',
    title: 'AI Receptionist Agency Profit Calculator: Real Numbers at Every Scale',
    excerpt: 'Detailed profit analysis at 5, 15, 30, 50, and 100 clients. Real platform costs, client pricing strategies, and margin calculations — no hype, just math.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '13 min read',
  },
  {
    slug: 'complete-guide-white-label-ai-receptionist-business',
    title: 'The Complete Guide to White-Label AI Receptionist Businesses',
    excerpt: 'Everything about the white-label AI receptionist business model — what it is, how the value chain works, who makes money, and why it\'s one of the best agency models in 2026.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '16 min read',
  },
  // =========================================================================
  // PILLAR 3: INDUSTRY SALES PLAYBOOKS (February 2026)
  // =========================================================================
  {
    slug: 'sell-ai-receptionist-to-auto-shops',
    title: 'How to Sell AI Receptionists to Auto Repair Shops (Agency Playbook)',
    excerpt: 'Auto shops lose thousands in repairs when they can\'t answer the phone. The complete playbook for selling AI receptionists to mechanics, body shops, and dealers.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '10 min read',
  },
  {
    slug: 'sell-ai-receptionist-to-restaurants',
    title: 'How to Sell AI Receptionists to Restaurants (Agency Playbook)',
    excerpt: 'Restaurants miss calls during every rush. How to sell them AI phone answering that handles reservations, hours, and takeout orders. Scripts, objections, and pricing.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '10 min read',
  },
  {
    slug: 'sell-ai-receptionist-to-law-firms',
    title: 'How to Sell AI Receptionists to Law Firms (Agency Playbook)',
    excerpt: 'Law firms spend $500-2,000/month on answering services. How to sell them an AI receptionist at better margins. Pitch scripts, objections, and pricing for the legal niche.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '11 min read',
  },
  {
    slug: 'sell-ai-receptionist-to-dental-offices',
    title: 'How to Sell AI Receptionists to Dental Offices (Agency Playbook)',
    excerpt: 'The complete playbook for selling AI receptionist services to dentists. Pain points, pitch scripts, pricing, and why dental is a high-value niche for AI agencies.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '11 min read',
  },
  {
    slug: 'sell-ai-receptionist-to-plumbers',
    title: 'How to Sell AI Receptionists to Plumbers & Home Service Businesses',
    excerpt: 'The complete agency playbook for selling AI receptionists to plumbers, HVAC, electricians, and roofers. Scripts, objection handling, pricing, and why home services is the easiest niche.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '12 min read',
  },
  // =========================================================================
  // PILLAR 2: COMPETITOR COMPARISONS (February 2026)
  // =========================================================================
  {
    slug: 'why-agencies-switch-answering-services-to-ai',
    title: 'Why Agencies Are Switching From Answering Services to AI Receptionists',
    excerpt: 'Answering services charge $2-5 per call. AI receptionists handle unlimited calls for a flat fee. The economics behind the migration and how to make the switch.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '10 min read',
  },
  {
    slug: 'best-ai-receptionist-platforms-compared-2026',
    title: 'Best AI Receptionist Platforms Compared (2026): Pricing, Features & Reviews',
    excerpt: 'Comprehensive comparison of every major AI receptionist platform — white-label and D2C. Real pricing, honest pros/cons, and specific recommendations by use case.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '14 min read',
  },
  {
    slug: 'voiceai-connect-vs-smith-ai',
    title: 'VoiceAI Connect vs Smith.ai: AI-Only vs Human+AI — Which Wins for Agencies?',
    excerpt: 'Comparing a white-label AI platform with a hybrid human+AI answering service. Pricing, margins, scalability, and which model makes more sense for agencies.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '9 min read',
  },
  {
    slug: 'voiceai-connect-vs-goodcall',
    title: 'VoiceAI Connect vs Goodcall: Which AI Receptionist Platform Should Agencies Use?',
    excerpt: 'Goodcall is built for small businesses. VoiceAI Connect is built for agencies. Here\'s why that distinction matters and which platform fits your goals.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '9 min read',
  },
  {
    slug: 'voiceai-connect-vs-trillet',
    title: 'VoiceAI Connect vs Trillet: Which White-Label AI Platform Is Better for Agencies?',
    excerpt: 'Detailed comparison of VoiceAI Connect and Trillet for agencies building AI receptionist businesses. Pricing, features, white-label quality, and which delivers better margins.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '10 min read',
  },
  // =========================================================================
  // PILLAR 1: START A BUSINESS / MMO (February 2026)
  // =========================================================================
  {
    slug: 'can-you-start-ai-business-no-technical-skills',
    title: 'Can You Start an AI Business With No Technical Skills? (Yes — Here\'s How)',
    excerpt: 'The #1 objection to starting an AI business, answered honestly. What you actually need to know, what the platform handles, and where your time goes.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '10 min read',
  },
  {
    slug: 'first-month-ai-receptionist-agency',
    title: 'Your First Month Running an AI Receptionist Agency: What to Expect',
    excerpt: 'A realistic week-by-week breakdown of month one. What you\'ll do, what you\'ll earn, what will go wrong, and what separates people who make it from those who quit.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '11 min read',
  },
  {
    slug: 'recurring-revenue-business-no-code',
    title: 'How to Build a Recurring Revenue Business Without Writing Code',
    excerpt: 'Three no-code business models that generate predictable monthly income — and why white-label AI agencies have the best unit economics of any of them.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '12 min read',
  },
  {
    slug: 'ai-agency-vs-dropshipping',
    title: 'AI Agency vs Dropshipping in 2026: Which Business Model Actually Works?',
    excerpt: 'An honest comparison of AI receptionist agencies and dropshipping across 8 factors: startup cost, margins, time investment, competition, and long-term potential.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '11 min read',
  },
  {
    slug: 'best-online-businesses-no-experience',
    title: 'Best Online Businesses to Start With No Experience (2026 Guide)',
    excerpt: 'Seven online businesses ranked by startup cost, learning curve, and income potential. Why white-label AI agencies are the best option for complete beginners.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-10',
    readTime: '13 min read',
  },
  // =========================================================================
  // PRODUCT UPDATES (February 2026)
  // =========================================================================
  {
    slug: 'introducing-ai-templates-enterprise',
    title: 'Introducing AI Templates: Custom Prompts for Enterprise Agencies',
    excerpt: 'Enterprise agencies can now customize AI receptionist prompts, voices, and conversation flows for each industry. Set once, apply to all new clients automatically.',
    category: 'product',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-02-05',
    readTime: '4 min read',
  },
  // =========================================================================
  // INDUSTRY INSIGHTS (February 2026)
  // =========================================================================
  {
    slug: 'ai-receptionist-vs-answering-service',
    title: 'AI Receptionist vs Answering Service vs Virtual Receptionist',
    excerpt: 'Complete 2026 comparison: AI receptionists cost $30-300/month, answering services $200-2,000+, virtual receptionists $500-3,000+. Find the right fit for your business.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-04',
    readTime: '11 min read',
    featured: true,
  },
  {
    slug: 'ai-receptionist-cost-pricing-guide',
    title: 'How Much Does an AI Receptionist Cost? Complete Pricing Guide',
    excerpt: 'AI receptionist pricing from $30-500/month. Compare providers, understand pricing models (flat-rate vs per-minute), hidden fees, and calculate your ROI.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-03',
    readTime: '9 min read',
  },
  {
    slug: 'state-of-ai-receptionists-2026',
    title: 'The State of AI Receptionists in 2026: Market Size, Trends & Predictions',
    excerpt: 'AI receptionist market analysis: $1.2B market size, 34% CAGR, 2.4M businesses using AI. Adoption trends by industry and predictions for 2027.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-02-02',
    readTime: '12 min read',
  },
  // =========================================================================
  // GUIDES - PROMPT ENGINEERING (February 2026)
  // =========================================================================
  {
    slug: 'how-to-find-leads-google-maps',
    title: 'How to Find Leads on Google Maps (Free Method for AI Agencies)',
    excerpt: 'Step-by-step guide to finding unlimited local business leads on Google Maps. Free prospecting method for AI receptionist agencies—no tools required. Find 50+ qualified leads per hour.',
    category: 'guides',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-02-03',
    readTime: '11 min read',
    featured: true,
  },
  {
    slug: 'ai-receptionist-prompt-guide',
    title: 'AI Receptionist Prompt Engineering Guide',
    excerpt: 'Complete guide to AI receptionist prompts based on official VAPI and ElevenLabs documentation. Learn prompt structure, voice settings, conversation flow design, and production-ready templates.',
    category: 'guides',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-02-01',
    readTime: '18 min read',
  },
  {
    slug: 'home-services-ai-receptionist-prompts',
    title: 'Home Services AI Receptionist Prompts',
    excerpt: 'Ready-to-use AI receptionist templates for HVAC, plumbing, electrical, roofing, and general contractors. Emergency handling, scheduling flows, and service area verification.',
    category: 'guides',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-02-01',
    readTime: '16 min read',
  },
  {
    slug: 'medical-dental-ai-receptionist-prompts',
    title: 'Medical & Dental AI Receptionist Prompts',
    excerpt: 'HIPAA-aware AI receptionist prompts for medical practices and dental offices. Patient intake, insurance handling, appointment scheduling, and emergency triage templates.',
    category: 'guides',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-02-01',
    readTime: '15 min read',
  },
  // =========================================================================
  // GUIDES - BUSINESS (January 30, 2026)
  // =========================================================================
  {
    slug: 'best-recurring-revenue-business-ideas-2026',
    title: 'Best Recurring Revenue Business Ideas in 2026 (Ranked by Profit Margin)',
    excerpt: 'The 7 best recurring revenue business models for 2026, ranked by profit margin, startup cost, and time to profitability. From AI agencies to SaaS to digital products.',
    category: 'guides',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-01-30',
    readTime: '16 min read',
  },
  {
    slug: 'ai-receptionist-agency-vs-smma',
    title: 'AI Receptionist Agency vs SMMA: Which Business Model in 2026?',
    excerpt: 'Honest comparison of AI receptionist agencies vs social media marketing agencies. Profit margins, time requirements, competition, and which model suits you better.',
    category: 'guides',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-01-30',
    readTime: '14 min read',
  },
  {
    slug: 'how-much-do-ai-receptionist-agencies-make',
    title: 'How Much Do AI Receptionist Agencies Make? Real Numbers (2026)',
    excerpt: 'Realistic income breakdown for AI receptionist agencies: $3,000-$15,000/month is achievable within 12 months. See month-by-month progression, profit margins, and what top earners do differently.',
    category: 'guides',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-01-30',
    readTime: '12 min read',
  },
  {
    slug: 'white-label-ai-receptionist-platform',
    title: 'White Label AI Receptionist Platform: The Complete Guide (2026)',
    excerpt: 'Everything you need to know about white label AI receptionist platforms. Compare options, understand pricing models, and learn how to launch your own AI receptionist business.',
    category: 'guides',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-01-30',
    readTime: '15 min read',
  },
  {
    slug: 'phone-only-business-ai-agency',
    title: 'Phone-Only Business: How to Run an AI Agency Entirely From Your Phone',
    excerpt: 'The rise of phone-only businesses in 2026. Learn how to run a profitable AI receptionist agency without ever opening a laptop—true mobile-first entrepreneurship.',
    category: 'guides',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-01-30',
    readTime: '11 min read',
  },
  // =========================================================================
  // INDUSTRY (January 30, 2026)
  // =========================================================================
  {
    slug: 'my-ai-front-desk-alternative',
    title: 'My AI Front Desk Alternative: Compare White Label Options (2026)',
    excerpt: 'Looking for a My AI Front Desk alternative? Compare pricing, features, and white-label capabilities of the top AI receptionist platforms for agencies.',
    category: 'industry',
    author: { name: 'Gibson Thompson' },
    publishedAt: '2026-01-30',
    readTime: '10 min read',
  },
  // =========================================================================
  // GUIDES - SALES & OUTREACH (Earlier January 2026)
  // =========================================================================
  {
    slug: 'pitch-ai-receptionists-home-services',
    title: 'How to Pitch AI Receptionists to Home Service Businesses',
    excerpt: 'The pain points that matter, the ROI arguments that close deals, and the objections you\'ll face. Home service businesses miss 27% of calls—here\'s how to sell the solution.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-01-20',
    readTime: '10 min read',
  },
  {
    slug: 'cold-outreach-templates-that-work',
    title: '5 Cold Outreach Templates That Actually Work',
    excerpt: 'Data-backed email templates for reaching home service business owners. Average reply rates dropped to 5%—these templates hit 10-15%. Includes follow-up sequences.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-01-18',
    readTime: '12 min read',
  },
  {
    slug: 'building-referral-program-agency',
    title: 'Building a Referral Program for Your Agency',
    excerpt: '84% of B2B buyers enter the sales cycle through referrals. Learn how to build a systematic referral program with incentive structures, timing frameworks, and ready-to-use templates.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-01-16',
    readTime: '11 min read',
  },
  {
    slug: 'how-to-start-ai-receptionist-agency',
    title: 'How to Start an AI Receptionist Agency in 2026',
    excerpt: 'A complete guide to launching your white-label AI voice business, from finding your first clients to scaling to $50k/month.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-01-15',
    readTime: '12 min read',
  },
  {
    slug: 'how-to-price-ai-receptionist-services',
    title: 'How to Price Your AI Receptionist Services for Maximum Profit',
    excerpt: 'The psychology of pricing, what competitors charge, and how to position your agency for premium clients.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-01-08',
    readTime: '10 min read',
  },
  // =========================================================================
  // INDUSTRY (Earlier January 2026)
  // =========================================================================
  {
    slug: 'best-industries-ai-receptionist',
    title: 'The 10 Best Industries for AI Receptionist Services',
    excerpt: 'Not all businesses need AI receptionists equally. Here are the industries with the highest demand and willingness to pay.',
    category: 'industry',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-01-05',
    readTime: '7 min read',
  },
  {
    slug: 'white-label-vs-build-ai-receptionist',
    title: 'White Label vs Building Your Own AI Receptionist Platform',
    excerpt: 'Should you build your own AI receptionist platform or use a white-label solution? A detailed comparison of costs, timelines, and trade-offs.',
    category: 'guides',
    author: { name: 'VoiceAI Team' },
    publishedAt: '2026-01-03',
    readTime: '12 min read',
  },
];

// ============================================================================
// BLOG CARD COMPONENT
// ============================================================================
function BlogCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const categoryColor = {
    guides: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    industry: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    product: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }[post.category] || 'bg-white/10 text-white/70 border-white/20';

  if (featured) {
    return (
      <Link 
        href={`/blog/${post.slug}`}
        className="group relative block rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-white/[0.02] overflow-hidden transition-all hover:border-white/[0.15] hover:bg-white/[0.04]"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative p-6 sm:p-8">
          {/* Category badge */}
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${categoryColor}`}>
            <Tag className="h-3 w-3" />
            {categories.find(c => c.id === post.category)?.name || post.category}
          </div>

          {/* Title */}
          <h2 className="mt-4 text-xl sm:text-2xl font-semibold tracking-tight group-hover:text-emerald-400 transition-colors">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="mt-3 text-[#fafaf9]/50 line-clamp-2 sm:line-clamp-3">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-[#fafaf9]/40">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Read more
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`/blog/${post.slug}`}
      className="group relative block rounded-xl sm:rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      {/* Category badge */}
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${categoryColor}`}>
        {categories.find(c => c.id === post.category)?.name || post.category}
      </div>

      {/* Title */}
      <h3 className="mt-3 text-lg font-semibold tracking-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
        {post.title}
      </h3>

      {/* Excerpt */}
      <p className="mt-2 text-sm text-[#fafaf9]/50 line-clamp-2">
        {post.excerpt}
      </p>

      {/* Meta */}
      <div className="mt-4 flex items-center gap-3 text-xs text-[#fafaf9]/40">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(post.publishedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
          })}
        </span>
        <span>•</span>
        <span>{post.readTime}</span>
      </div>
    </Link>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = filteredPosts.filter(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      {/* Premium grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/[0.05] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[128px]" />
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

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">
                Pricing
              </Link>
              <Link href="/blog" className="text-sm text-[#fafaf9] font-medium">
                Blog
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link 
                href="/agency/login" 
                className="text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#050505] hover:bg-[#fafaf9] transition-colors"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Hero */}
          <div className="text-center mb-12 sm:mb-16">
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-2 text-sm text-[#fafaf9]/40 mb-6">
              <Link href="/" className="hover:text-[#fafaf9] transition-colors">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-[#fafaf9]/70">Blog</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Insights & Resources
            </h1>
            <p className="mt-4 text-lg text-[#fafaf9]/50 max-w-2xl mx-auto">
              Guides, industry insights, and product updates to help you build and grow your AI voice agency.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10 sm:mb-12">
            {/* Search */}
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

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-emerald-500 text-[#050505]'
                      : 'bg-white/[0.05] text-[#fafaf9]/70 hover:bg-white/[0.1] border border-white/[0.08]'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Posts */}
          {featuredPosts.length > 0 && selectedCategory === 'all' && !searchQuery && (
            <section className="mb-12 sm:mb-16">
              <h2 className="text-sm font-medium text-[#fafaf9]/40 uppercase tracking-wider mb-6">
                Featured
              </h2>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {featuredPosts.slice(0, 2).map((post) => (
                  <BlogCard key={post.slug} post={post} featured />
                ))}
              </div>
            </section>
          )}

          {/* All Posts */}
          <section>
            {(featuredPosts.length > 0 && selectedCategory === 'all' && !searchQuery) && (
              <h2 className="text-sm font-medium text-[#fafaf9]/40 uppercase tracking-wider mb-6">
                All Articles
              </h2>
            )}
            
            {filteredPosts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {(selectedCategory === 'all' && !searchQuery ? regularPosts : filteredPosts).map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-[#fafaf9]/50">No articles found matching your criteria.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>

          {/* Newsletter CTA */}
          <section className="mt-16 sm:mt-20">
            <div className="relative rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 sm:p-12 overflow-hidden">
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-emerald-500/[0.1] rounded-full blur-[100px]" />
              
              <div className="relative max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Stay in the loop
                </h2>
                <p className="mt-3 text-[#fafaf9]/50">
                  Get the latest guides, industry insights, and product updates delivered to your inbox.
                </p>

                <form className="mt-6 flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#050505] hover:bg-[#fafaf9] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Subscribe
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <p className="mt-4 text-xs text-[#fafaf9]/30">
                  No spam. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

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

            <div className="flex items-center gap-6 text-sm text-[#fafaf9]/40">
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-[#fafaf9] transition-colors">Contact</Link>
            </div>

            <p className="text-sm text-[#fafaf9]/30">
              © 2026 VoiceAI Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}