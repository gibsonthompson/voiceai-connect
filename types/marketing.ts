// types/marketing.ts
// Configuration types for white-label marketing websites

export interface AgencyBranding {
  name: string;
  logoUrl: string;
  primaryColor: string;      // e.g., '#122092'
  primaryHoverColor: string; // e.g., '#0d1666'
  accentColor: string;       // e.g., '#f6b828'
}

export interface HeroConfig {
  badge: string;             // e.g., 'Trusted by 200+ businesses'
  headline: string[];        // Array of lines, e.g., ['Run Your Business.', 'We\'ll Answer Your Calls.']
  subtitle: string;          // e.g., 'AI Receptionist • $49/Month'
  description: string;
  demoPhone: string;         // e.g., '770-809-2820'
  demoInstructions: string;
  trustItems: string[];      // e.g., ['10-Minute Setup', 'No Credit Card Required', '24/7 Call Answering']
}

export interface ProblemCard {
  title: string;
  description: string;
}

export interface SolutionConfig {
  headline: string;
  paragraphs: string[];
  highlight: string;
}

export interface StepCard {
  title: string;
  description: string;
  time: string;
}

export interface BenefitItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  highlight?: string;
  integrations?: string[];
  example?: string;
  stat?: string;
}

export interface IndustryCard {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  result: string;
  link?: string;
}

export interface TestimonialCard {
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
  features: string[];
  isPopular?: boolean;
  note?: string;
}

export interface FAQItem {
  question: string;
  answer: string;  // Can contain HTML
}

export interface FooterConfig {
  address: string;
  phone: string;
  email: string;
  productLinks: { label: string; href: string }[];
  industryLinks: { label: string; href: string }[];
  companyLinks: { label: string; href: string }[];
}

export interface StatsConfig {
  setupTime: string;
  responseTime: string;
  businessesServed: string;
  satisfaction: string;
}

export interface MarketingConfig {
  branding: AgencyBranding;
  hero: HeroConfig;
  stats: StatsConfig;
  problems: ProblemCard[];
  solution: SolutionConfig;
  steps: StepCard[];
  benefits: BenefitItem[];
  features: FeatureCard[];
  industries: IndustryCard[];
  testimonials: TestimonialCard[];
  pricing: PricingTier[];
  faqs: FAQItem[];
  footer: FooterConfig;
  // Feature toggles
  showIndustries: boolean;
  showTestimonials: boolean;
  showComparison: boolean;
}

// Default configuration (based on CallBird)
export const defaultMarketingConfig: MarketingConfig = {
  branding: {
    name: 'VoiceAI',
    logoUrl: '',
    primaryColor: '#122092',
    primaryHoverColor: '#0d1666',
    accentColor: '#f6b828',
  },
  hero: {
    badge: 'Trusted by 200+ businesses',
    headline: ['Run Your Business.', "We'll Answer Your Calls."],
    subtitle: 'AI Receptionist • $49/Month',
    description: 'Professional AI that answers every call, books appointments, and sends you instant summaries—24/7. Setup in 10 minutes.',
    demoPhone: '770-809-2820',
    demoInstructions: "Tell our AI your business, and it'll answer your test call like it's been your receptionist for years. Try it in 30 seconds.",
    trustItems: ['10-Minute Setup', 'No Credit Card Required', '24/7 Call Answering'],
  },
  stats: {
    setupTime: '10 min',
    responseTime: '1.2 sec',
    businessesServed: '200+',
    satisfaction: '96%',
  },
  problems: [
    {
      title: '62% of Business Calls Go Unanswered',
      description: "You're on a job, with a customer, or driving. The call goes to voicemail.",
    },
    {
      title: 'Hiring a Receptionist Costs $3,000+/Month',
      description: "You can't afford full-time staff, but you need someone to answer professionally.",
    },
    {
      title: 'Traditional Answering Services Cost $300-500/Mo',
      description: "They're scripted, robotic, and can't book appointments or access your calendar.",
    },
  ],
  solution: {
    headline: 'Your $49/Month AI Receptionist That Never Sleeps',
    paragraphs: [
      'No more missed opportunities. No more paying thousands for staff. No more generic answering services.',
      'Our AI answers every call with a human-sounding voice trained specifically on your business. It books appointments, answers questions, and handles emergencies—24/7, 365 days a year.',
    ],
    highlight: "And here's the best part: Every conversation shows up in your app with a full transcript. Plus, you get an instant text summary the moment each call ends.",
  },
  steps: [
    {
      title: 'Tell Us About Your Business',
      description: "2-minute signup form. Just your business name, industry, and phone number. That's it.",
      time: '2 minutes',
    },
    {
      title: 'We Build Your AI Receptionist',
      description: 'Our system reads your website, learns your services, and creates your custom AI voice. You can customize the greeting, tone, and what it says.',
      time: '5 minutes',
    },
    {
      title: 'Forward Your Calls',
      description: 'We give you a dedicated number, or forward your existing business line to us. Works with any phone system.',
      time: '30 seconds',
    },
    {
      title: 'Download the App',
      description: 'Available on iOS and Android. See every conversation, listen to call recordings, read transcripts, and manage appointments—all in one place.',
      time: '2 minutes',
    },
  ],
  benefits: [
    { icon: 'smartphone', title: 'Mobile App', description: 'iOS & Android. Access anywhere, anytime. Manage calls on the go.' },
    { icon: 'phone', title: 'Call Recordings', description: 'Listen to any call anytime. Review quality, train staff, or settle disputes.' },
    { icon: 'chart', title: 'Analytics Dashboard', description: 'Track call volume, peak times, conversion rates, and customer satisfaction.' },
    { icon: 'bell', title: 'Instant Alerts', description: 'Get text notifications for every call with customer details and actions taken.' },
  ],
  features: [
    {
      icon: 'calendar',
      title: 'Smart Appointment Booking',
      description: 'Your AI accesses your Google Calendar, Outlook, or our built-in scheduler in real-time. Customers book appointments during the call. You get a calendar invite. They get a confirmation text.',
      integrations: ['Google Calendar', 'Outlook', 'Apple Calendar'],
    },
    {
      icon: 'message',
      title: 'Instant Text Summaries',
      description: 'The second a call ends, you get a text with customer name and contact info, what they wanted, what action was taken, and a link to full transcript.',
      highlight: 'No more digging through voicemails or missed call lists.',
    },
    {
      icon: 'transfer',
      title: 'Emergency Call Transfer',
      description: "Our AI knows when to loop you in. Urgent calls, complex questions, or VIP customers get transferred immediately to your cell phone—with full context so you know what the call is about.",
      example: 'Example: "Transfer all calls with \'emergency\' in them"',
    },
    {
      icon: 'training',
      title: 'Industry-Specific Training',
      description: "We don't give you a generic AI. Your receptionist is trained on your website content, service list and pricing, FAQ answers, and booking policies.",
      highlight: 'It answers questions accurately because it knows YOUR business.',
    },
    {
      icon: 'moon',
      title: 'After-Hours Coverage',
      description: 'Most new customers call outside 9-5. Our AI answers at 11pm on Saturday just as professionally as 2pm on Tuesday.',
      stat: 'Real stat: 34% of booked appointments happen after 6pm or on weekends',
    },
    {
      icon: 'mic',
      title: 'Call Recording & Transcripts',
      description: 'Every single call is recorded (downloadable MP3), transcribed word-for-word, searchable in your app, and stored securely for 90 days.',
    },
  ],
  industries: [
    {
      icon: 'wrench',
      title: 'Home Services',
      subtitle: 'Plumbers • Electricians • HVAC • Contractors',
      description: "Books service calls, handles emergency requests, and collects job details while you're on site.",
      result: 'Average result: 23 more appointments/month',
    },
    {
      icon: 'medical',
      title: 'Medical & Dental',
      subtitle: 'Dentists • Doctors • Chiropractors • Therapists',
      description: 'HIPAA-compliant appointment booking. Patients get confirmed without tying up your front desk.',
      result: 'Average result: 40% fewer no-shows',
    },
    {
      icon: 'restaurant',
      title: 'Restaurants & Food',
      subtitle: 'Restaurants • Cafes • Catering • Food Trucks',
      description: 'Answer questions about hours, menu items, dietary options, and take-out availability 24/7.',
      result: 'Average result: 15% increase in orders',
    },
    {
      icon: 'briefcase',
      title: 'Professional Services',
      subtitle: 'Lawyers • Accountants • Consultants • Coaches',
      description: 'Qualify leads, book consultations, and screen calls so you only talk to serious prospects.',
      result: 'Average result: 3x more consultations',
    },
    {
      icon: 'store',
      title: 'Retail & E-Commerce',
      subtitle: 'Local shops • Boutiques • Service businesses',
      description: 'Answer product questions, store hours, and availability while you help in-store customers.',
      result: 'Average result: 28% less abandonment',
    },
    {
      icon: 'pet',
      title: 'Veterinary Clinics',
      subtitle: 'Vets • Animal Hospitals • Grooming',
      description: 'Book appointments, triage emergency cases, and refill prescription requests automatically.',
      result: 'Average result: 50+ hours saved/month',
    },
  ],
  testimonials: [
    {
      rating: 5,
      headline: 'We were missing 30% of our calls before',
      quote: "Now every patient gets through, our appointment book stays full, and I'm not chained to the front desk. The text summaries are game-changing—I know exactly who called and what they need before I even call back.",
      authorName: 'Dr. Sarah Chen',
      authorTitle: 'Riverside Dental Practice',
      stats: 'Using for 4 months • 487 calls handled',
    },
    {
      rating: 5,
      headline: 'Setup literally took 8 minutes',
      quote: "I signed up, forwarded my phone, and calls were being answered before I finished lunch. The first call was a $3,200 kitchen remodel job. Paid for itself in an hour.",
      authorName: 'Carlos Martinez',
      authorTitle: 'Elite Home Renovations',
      stats: 'Using for 2 months • 156 calls • 23 appointments booked',
    },
    {
      rating: 5,
      headline: 'Emergency calls get through, routine stuff is handled',
      quote: "As a vet, I need to know when there's a real emergency. The AI transfers those immediately, but handles appointment bookings and prescription refills automatically. My staff loves it because their phone isn't ringing off the hook.",
      authorName: 'Dr. James Park',
      authorTitle: 'Oakwood Animal Hospital',
      stats: 'Using for 6 months • 892 calls • 4.9/5 rating',
    },
  ],
  pricing: [
    {
      name: 'Starter',
      price: 49,
      subtitle: 'Perfect for solo operators and small teams',
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
      price: 99,
      subtitle: 'For growing businesses with higher call volume',
      isPopular: true,
      features: [
        'Everything in Starter, plus:',
        'Up to 300 calls per month',
        'Advanced appointment booking',
        'Multiple calendar integration',
        'Custom business hours',
        'Lead qualification questions',
        'Priority call transfer rules',
        'Analytics dashboard',
        'Priority email support',
      ],
    },
    {
      name: 'Enterprise',
      price: 197,
      subtitle: 'For high-volume and multi-location operations',
      features: [
        'Everything in Professional, plus:',
        'Unlimited calls per month',
        'Up to 5 AI phone numbers',
        'Advanced CRM integration',
        'Custom AI training',
        'Multi-language support',
        'Dedicated account manager',
        'Custom reporting',
        'Priority 24/7 phone support',
        'API access',
      ],
      note: 'Best value for high call volume',
    },
  ],
  faqs: [
    {
      question: 'How quickly can I get my AI phone number?',
      answer: `<p>Your number is ready within <strong>10 minutes</strong> of completing signup. That's not a typo—10 minutes from signup to answering your first call.</p>`,
    },
    {
      question: 'Does it integrate with my existing calendar?',
      answer: `<p>Yes! Works with Google Calendar, Microsoft Outlook, Apple Calendar, and our built-in calendar.</p>`,
    },
    {
      question: 'What happens if the AI gets a call it can\'t handle?',
      answer: `<p>Three safety nets: <strong>Instant Transfer</strong> for emergencies, <strong>Take a Message</strong> if you're unavailable, and <strong>Smart Escalation</strong> rules you define.</p>`,
    },
    {
      question: 'How does the AI know about my business?',
      answer: `<p>During setup, it reads your website, asks key questions, learns your booking rules, and stores your FAQs. The more you use it, the smarter it gets.</p>`,
    },
    {
      question: 'Can I customize how calls are answered?',
      answer: `<p>Absolutely. You control the greeting, voice, responses, and business rules. Changes take effect in under 60 seconds.</p>`,
    },
    {
      question: 'Do I need to change my phone number?',
      answer: `<p>No. You can use our dedicated number, forward your existing number, or use a hybrid approach—toggle forwarding on/off from the app.</p>`,
    },
  ],
  footer: {
    address: 'Atlanta, GA',
    phone: '(678) 316-1454',
    email: 'hello@example.com',
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
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms & Conditions', href: '#' },
    ],
  },
  showIndustries: true,
  showTestimonials: true,
  showComparison: true,
};