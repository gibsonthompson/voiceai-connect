// types/marketing.ts

export interface MarketingBranding {
  name: string;
  logoUrl: string;
  logoBackgroundColor?: string;
  primaryColor: string;
  primaryHoverColor: string;
  accentColor: string;
}

export interface HeroConfig {
  badge: string;
  headline: string[];
  subtitle: string;
  description: string;
  demoPhone: string;
  demoInstructions: string;
  trustItems: string[];
  videoUrl?: string;
}

export interface StatsConfig {
  setupTime: string;
  responseTime: string;
  businessesServed: string;
  satisfaction: string;
}

export interface ProblemItem {
  title: string;
  description: string;
}

export interface SolutionConfig {
  headline: string;
  paragraphs: string[];
  highlight: string;
}

export interface StepItem {
  title: string;
  description: string;
  time: string;
}

export interface BenefitItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  integrations?: string[];
  highlight?: string;
  example?: string;
  stat?: string;
}

export interface IndustryItem {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  result: string;
}

export interface TestimonialItem {
  rating: number;
  headline: string;
  quote: string;
  authorName: string;
  authorTitle: string;
  stats: string;
}

export interface PricingTier {
  name: string;
  price: number;
  subtitle: string;
  isPopular?: boolean;
  features: string[];
  note?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterConfig {
  address: string;
  phone: string;
  email: string;
  productLinks: FooterLink[];
  industryLinks: FooterLink[];
  companyLinks: FooterLink[];
}

export interface AnalyticsConfig {
  gtmId?: string;
  fbPixelId?: string;
  googleAnalyticsId?: string;
  customHeadScripts?: string;
  customBodyScripts?: string;
}

export interface OGConfig {
  title?: string;
  description?: string;
  imageUrl?: string;
}

export interface MarketingConfig {
  theme?: 'auto' | 'light' | 'dark';
  currencySymbol?: string;
  branding: MarketingBranding;
  hero: HeroConfig;
  stats: StatsConfig;
  problems: ProblemItem[];
  solution: SolutionConfig;
  steps: StepItem[];
  benefits: BenefitItem[];
  features: FeatureItem[];
  industries: IndustryItem[];
  testimonials: TestimonialItem[];
  pricing: PricingTier[];
  faqs: FAQItem[];
  footer: FooterConfig;
  analytics?: AnalyticsConfig;
  og?: OGConfig;
  showIndustries?: boolean;
  showComparison?: boolean;
  showTestimonials?: boolean;
  clientLoginPath?: string;
}

// ============================================================================
// DEFAULT CONFIG
// UPDATED: 2026-05-14 — Multilingual (English & Spanish auto-detect) on all plans
// ============================================================================
export const defaultMarketingConfig: MarketingConfig = {
  theme: 'light',
  branding: {
    name: 'VoiceAI',
    logoUrl: '',
    logoBackgroundColor: '',
    primaryColor: '#10b981',
    primaryHoverColor: '#059669',
    accentColor: '#34d399',
  },
  hero: {
    badge: 'AI-Powered Phone Answering',
    headline: ['Never Miss', 'Another Call'],
    subtitle: 'AI Receptionist Starting at $49/month',
    description: 'Professional AI that answers every call, books appointments, and sends you instant summaries—24/7. Setup takes just 10 minutes.',
    demoPhone: '',
    demoInstructions: 'Call now to hear our AI in action.',
    trustItems: ['10-Minute Setup', 'No Credit Card Required', '24/7 Call Answering'],
  },
  stats: {
    setupTime: '10 min',
    responseTime: '< 1 sec',
    businessesServed: '200+',
    satisfaction: '96%',
  },
  problems: [
    {
      title: 'Missed Calls = Lost Revenue',
      description: "I was on another call when a $5,000 job went to voicemail. They called my competitor instead.",
    },
    {
      title: "Can't Answer While Working",
      description: "I'm elbow-deep in a project when the phone rings. Answer and lose focus, or ignore and lose business?",
    },
    {
      title: 'After-Hours Opportunities Gone',
      description: "Someone called at 8pm ready to book. By morning, they'd already hired someone else.",
    },
  ],
  solution: {
    headline: 'Your 24/7 AI Receptionist',
    paragraphs: [
      "Imagine having a professional receptionist who never sleeps, never takes breaks, and answers every call exactly the way you would.",
      "That's what you get. An AI assistant trained specifically on your business that handles calls while you focus on what matters.",
    ],
    highlight: "You get a text summary of every call within seconds, plus an app where you can see transcripts, listen to recordings, and manage everything.",
  },
  steps: [
    {
      title: 'Tell Us About Your Business',
      description: 'Answer a few questions so our AI knows how to represent you perfectly.',
      time: '2 minutes',
    },
    {
      title: 'We Train Your AI',
      description: 'Our system creates a custom AI receptionist that sounds natural and knows your business.',
      time: '5 minutes',
    },
    {
      title: 'Get Your Phone Number',
      description: 'Forward your calls to your new AI number, or use it as a dedicated line.',
      time: '1 minute',
    },
    {
      title: 'Start Taking Calls',
      description: 'Your AI handles calls 24/7. You get text summaries and full access via our app.',
      time: 'Instant',
    },
  ],
  benefits: [
    {
      icon: 'smartphone',
      title: 'Mobile App',
      description: 'See all calls, transcripts, and manage everything from your phone.',
    },
    {
      icon: 'phone',
      title: 'Instant SMS Summaries',
      description: 'Get a text within seconds of each call with all the important details.',
    },
    {
      icon: 'chart',
      title: 'Analytics Dashboard',
      description: 'Track call volume, peak hours, and customer trends.',
    },
    {
      icon: 'bell',
      title: 'Smart Notifications',
      description: 'Get alerted about urgent calls and important opportunities.',
    },
  ],
  features: [
    {
      icon: 'calendar',
      title: 'Appointment Booking',
      description: 'AI checks your Google Calendar in real time, offers available slots to callers, and books appointments automatically — no back-and-forth.',
      integrations: ['Google Calendar', 'Outlook', 'Calendly'],
    },
    {
      icon: 'message',
      title: 'Instant Text Summaries',
      description: 'Within seconds of each call ending, you get a text with all the important details.',
      highlight: 'Never wait for voicemails or return calls to find out what someone wanted.',
    },
    {
      icon: 'transfer',
      title: 'Smart Call Transfer',
      description: 'Set rules for when calls should be transferred to you immediately.',
      example: '"If someone says it\'s an emergency or mentions [keyword], transfer to my cell."',
    },
    {
      icon: 'training',
      title: 'Trained on YOUR Business',
      description: "This isn't a generic answering service. Your AI knows your services, hours, service area, and how you like to handle different situations.",
    },
    {
      icon: 'moon',
      title: '24/7 Coverage',
      description: '3am on a Sunday? Holiday weekend? Your AI never sleeps, never takes vacation.',
      stat: 'Real stat: 34% of our calls come outside business hours.',
    },
    {
      icon: 'mic',
      title: 'Natural Conversations',
      description: 'Our AI sounds human, not robotic. Callers often don\'t realize they\'re talking to an AI. Speaks English and Spanish — automatically detects the caller\'s language and responds naturally.',
    },
  ],
  industries: [
    {
      icon: 'wrench',
      title: 'Home Services',
      subtitle: 'Plumbers, HVAC, Electricians, Roofers',
      description: "I was losing 3-4 calls a day while on jobs. Now I get a text summary after each call and can call back qualified leads on my lunch break.",
      result: "→ Captured 47 new leads in first month",
    },
    {
      icon: 'medical',
      title: 'Medical & Dental',
      subtitle: 'Clinics, Dentists, Therapists',
      description: "Patients can book appointments 24/7 now. Our no-show rate dropped because people book when they're thinking about it, not when we're open.",
      result: "→ 23% increase in appointments booked",
    },
    {
      icon: 'restaurant',
      title: 'Restaurants',
      subtitle: 'Restaurants, Catering, Food Services',
      description: "During the dinner rush, we'd miss 10+ calls. Now every reservation request is captured, and catering inquiries get handled professionally.",
      result: "→ $8,400 in catering orders from after-hours calls",
    },
    {
      icon: 'briefcase',
      title: 'Professional Services',
      subtitle: 'Lawyers, Accountants, Consultants',
      description: "First impressions matter in my business. Having a professional AI answer instead of voicemail has elevated how clients perceive my firm.",
      result: "→ Client satisfaction up 31%",
    },
    {
      icon: 'store',
      title: 'Retail & Local Business',
      subtitle: 'Shops, Salons, Gyms, Studios',
      description: "People call about hours, availability, pricing—all day long. AI handles the routine stuff so my staff can focus on customers in the store.",
      result: "→ Staff now focused 100% on in-person customers",
    },
    {
      icon: 'pet',
      title: 'Pet Services',
      subtitle: 'Vets, Groomers, Pet Sitters',
      description: "Pet owners call at all hours—emergencies don't wait. Our AI triages calls and knows when to wake me up vs. book a morning appointment.",
      result: "→ Emergency response time down 65%",
    },
  ],
  testimonials: [
    {
      rating: 5,
      headline: 'Paid for itself in the first week',
      quote: "First call my AI handled was a $3,200 HVAC replacement. Customer said he almost hung up when it went to voicemail, but the AI caught him. That one call paid for a year of service.",
      authorName: 'Mike R.',
      authorTitle: 'HVAC Contractor, Phoenix AZ',
      stats: 'Using since March 2024 • 847 calls handled',
    },
    {
      rating: 5,
      headline: 'Finally have work-life balance',
      quote: "I used to answer my phone during dinner, on weekends, even on vacation. Now I actually disconnect knowing every call is handled professionally. The text summaries mean I never miss anything important.",
      authorName: 'Jennifer L.',
      authorTitle: 'Family Law Attorney, Denver CO',
      stats: 'Using since January 2024 • 1,200+ calls handled',
    },
    {
      rating: 5,
      headline: 'Better than my old receptionist',
      quote: "I hate to say it, but my AI handles calls better than the part-time receptionist I had before. Never sick, never distracted, and costs a fraction of the price.",
      authorName: 'David K.',
      authorTitle: 'Dental Practice Owner, Austin TX',
      stats: 'Using since February 2024 • 2,100+ calls handled',
    },
  ],
  pricing: [
    {
      name: 'Starter',
      price: 99,
      subtitle: 'Perfect for solo operators',
      features: [
        '1 AI phone number',
        'Up to 50 calls per month',
        'Basic appointment booking',
        'Google Calendar integration',
        'Emergency call transfer',
        'Text summaries after each call',
        'Mobile app access',
        'Call recordings & transcripts',
        'Email support',
      ],
    },
    {
      name: 'Professional',
      price: 149,
      subtitle: 'For growing businesses',
      isPopular: true,
      features: [
        'Everything in Starter, plus:',
        'Up to 150 calls per month',
        'Advanced appointment booking',
        'Google Calendar + multi-calendar support',
        'Custom business hours',
        'Lead qualification questions',
        'Priority call transfer rules',
        'Analytics dashboard',
        'Priority email support',
      ],
    },
    {
      name: 'Growth',
      price: 299,
      subtitle: 'For high-volume operations',
      features: [
        'Everything in Professional, plus:',
        'Up to 500 calls per month',
        'Up to 3 AI phone numbers',
        'Advanced CRM integration',
        'Google Calendar integration',
        'Custom AI training',
        'Dedicated account manager',
        'Custom reporting',
        'Priority phone support',
      ],
      note: 'Best value for high call volume',
    },
  ],
  faqs: [
    {
      question: 'Do callers know they\'re talking to an AI?',
      answer: '<p>Most don\'t. Our AI uses natural conversation patterns and voice that sounds human. We\'ve had business owners tell us customers complimented their "new receptionist." That said, if someone directly asks, the AI will be honest—we believe in transparency.</p>',
    },
    {
      question: 'What if I want the AI to transfer certain calls to me?',
      answer: '<p>You set the rules. Common ones we see:</p><ul><li>"Transfer if they say it\'s urgent or an emergency"</li><li>"Transfer if they mention they\'re a current customer with a problem"</li><li>"Transfer if the job sounds over $X"</li></ul><p>The AI follows your rules and gets smarter over time.</p>',
    },
    {
      question: 'How does appointment booking work?',
      answer: '<p>The AI connects to your Google Calendar, Outlook, or Calendly. When someone wants to book, it checks your real availability and offers times. No double-booking, no back-and-forth. The appointment appears on your calendar automatically.</p>',
    },
    {
      question: 'What happens if the AI can\'t answer something?',
      answer: '<p>It handles it gracefully: "I don\'t have that specific information, but I\'d be happy to have [your name] call you back with the details. Can I get your number?" Then you get a text summary so you know exactly what to address.</p>',
    },
    {
      question: 'Does it block spam and robocalls?',
      answer: '<p>Yes — automatically, on every plan. The AI detects telemarketers, robocalls, and solicitors and ends those calls immediately. Spam calls are not counted against your monthly call limit, and you get a notification when one is blocked so you know it\'s working.</p>',
    },
    {
      question: 'Can it handle multiple calls at the same time?',
      answer: '<p>Yes — unlimited simultaneous calls. Unlike a human receptionist who can only answer one call at a time, the AI handles as many concurrent calls as needed. No busy signals, no hold music, no missed calls during your busiest hours.</p>',
    },
    {
      question: 'Do I need a website for this to work?',
      answer: '<p>No. All you need is a phone number. You can forward your existing business line to your AI number, or use the AI number directly. There\'s nothing to install, no website required, and no technical setup on your end.</p>',
    },
    {
      question: 'What happens if the AI transfers a call and nobody picks up?',
      answer: '<p>The AI stays on the line. Instead of sending the caller to voicemail or dropping the call, it says something like "It looks like the team isn\'t available right now — I can take a message for you." It collects their name, number, and what they need, then sends you the summary by text. The caller never hits a dead end.</p>',
    },
    {
      question: 'Does it work in Spanish?',
      answer: '<p>Yes — on every plan, no setup required. The AI automatically detects when a caller speaks Spanish and switches to Spanish for the entire conversation. It collects names, phone numbers, appointment requests, and everything else in Spanish, then sends you the summary in English so you always know what happened.</p><p>This is especially valuable for home services, medical, dental, and restaurant businesses serving Spanish-speaking communities.</p>',
    },
    {
      question: 'Do I get a dashboard or app?',
      answer: '<p>Yes. You get a mobile-friendly dashboard where you can see every call, listen to recordings, read full transcripts, and review AI-generated summaries. You also get instant text and email notifications after every call, so you don\'t need to check the dashboard unless you want the full details.</p>',
    },
    {
      question: 'What information do you need from me to get started?',
      answer: '<p>Just the basics: your business name, industry, phone number, and some information about your services, hours, and common questions. Everything is entered through the dashboard — no files to send back and forth. If you have a website, the AI can scan it automatically to learn about your business. Setup takes about 10 minutes total.</p>',
    },
    {
      question: 'Can I try it before signing up?',
      answer: '<p>Absolutely. Call our demo line to experience exactly how it works. Then start your 7-day free trial — no credit card required. If it\'s not for you, just don\'t continue. No commitments, no hassle.</p>',
    },
    {
      question: 'How is this different from a regular answering service?',
      answer: '<p><strong>Traditional answering services:</strong> Generic scripts, operators handling dozens of businesses, limited hours, no calendar access, $300-600/month.</p><p><strong>Us:</strong> AI trained on YOUR specific business, available 24/7, books directly to your calendar, instant text summaries, full call recordings, and a mobile app — starting at $49/month.</p>',
    },
    {
      question: 'What if I go over my call limit?',
      answer: '<p>We\'ll let you know when you\'re approaching your limit. You can upgrade mid-cycle, or we\'ll charge a small per-call fee (typically $1-2 per call) for overages. No surprise bills — you\'ll always know before it happens.</p>',
    },
    {
      question: 'Is my data secure?',
      answer: '<p>Yes. All calls are encrypted. Recordings and transcripts are stored securely. We follow healthcare-grade privacy practices and never sell or share your call data.</p>',
    },
  ],
  footer: {
    address: '',
    phone: '',
    email: '',
    productLinks: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    industryLinks: [
      { label: 'Home Services', href: '#' },
      { label: 'Medical & Dental', href: '#' },
      { label: 'Restaurants', href: '#' },
      { label: 'Professional Services', href: '#' },
    ],
    companyLinks: [
      { label: 'Contact', href: '#' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
    ],
  },
  clientLoginPath: '/client/login',
  showIndustries: true,
  showComparison: true,
  showTestimonials: true,
};