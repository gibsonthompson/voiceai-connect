'use client';

import Link from 'next/link';
import { 
  ArrowRight, ChevronRight, ChevronDown, Search, Menu, X,
  HelpCircle, DollarSign, Zap, Shield, Users, Phone, Bot,
  Building2, CreditCard, Headphones, Globe, Code, Settings,
  Clock, FileText, MessageSquare, BarChart3, Calendar, Lock,
  Sparkles, CheckCircle2
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

// Waveform icon component
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

// FAQ Categories and Questions
const faqCategories = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: Zap,
    description: 'Everything you need to know to launch your agency',
    faqs: [
      {
        q: 'What is VoiceAI Connect?',
        a: 'VoiceAI Connect is a complete white-label platform that lets you resell AI receptionists under your own brand. We provide the technology—AI voice agents that answer phone calls 24/7—and you sell it to local businesses as your own product. Your clients never see our name; everything is branded as your company.',
      },
      {
        q: 'Do I need any technical skills or coding experience?',
        a: 'No technical skills are required whatsoever. If you can upload a logo and fill out a form, you can set up your agency. The entire platform is designed for non-technical users. There\'s no coding, no server management, and no complex configuration. Most agencies complete setup in under 30 minutes.',
      },
      {
        q: 'How long does it take to set up my agency?',
        a: 'Most agencies complete the full setup process in 15-30 minutes. This includes creating your account, uploading your branding, connecting Stripe for payments, and customizing your marketing site. You can be ready to start selling the same day you sign up.',
      },
      {
        q: 'What do I need to get started?',
        a: 'You need three things: (1) An email address to create your account, (2) Your logo and brand colors for customization, and (3) A Stripe account to receive payments from clients. If you don\'t have a Stripe account yet, you can create one for free during setup—it takes about 5 minutes.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes! We offer a 14-day free trial with full access to all features in your chosen plan. No credit card is required to start the trial. You can set up your branding, explore the platform, and even onboard test clients before committing.',
      },
      {
        q: 'Can I try the AI before signing up?',
        a: 'Absolutely. We have a public demo phone number you can call anytime to experience the AI receptionist firsthand. Additionally, once you sign up for the trial, you get a demo number for your own agency that you can share with potential clients.',
      },
      {
        q: 'What happens after my free trial ends?',
        a: 'At the end of your 14-day trial, your subscription will begin at your chosen plan level. If you decide VoiceAI Connect isn\'t right for you, simply cancel before the trial ends and you won\'t be charged. There\'s no commitment and no cancellation fees.',
      },
    ],
  },
  {
    id: 'pricing-billing',
    name: 'Pricing & Billing',
    icon: DollarSign,
    description: 'Plans, payments, and how you make money',
    faqs: [
      {
        q: 'How much does VoiceAI Connect cost?',
        a: 'We offer three plans: Starter at $99/month (up to 15 clients), Professional at $199/month (up to 100 clients), and Scale at $499/month (unlimited clients). All plans include a 14-day free trial. There are no per-client fees, no revenue sharing, and no hidden costs.',
      },
      {
        q: 'What\'s the difference between the Starter and Professional plans?',
        a: 'Starter ($99/mo) includes up to 15 clients, an embeddable signup widget, basic analytics, and email support. Professional ($199/mo) adds up to 100 clients, a full marketing website with demo phone number, custom domain support, API access, webhooks, advanced analytics, and priority support. Most serious agencies choose Professional.',
      },
      {
        q: 'Do you take a percentage of my client revenue?',
        a: 'No, never. We charge a flat monthly platform fee regardless of how much you charge your clients or how many you have (within your plan limits). If you charge 50 clients $149/month each, that\'s $7,450/month going directly to your Stripe account. We only charge our flat platform fee.',
      },
      {
        q: 'How do payments work? How do I get paid?',
        a: 'You connect your own Stripe account during setup. When your clients subscribe through your branded signup page, payments go directly to your Stripe account—not to us. You set your own prices ($99, $149, $299, whatever you want) and keep 100% of what you charge.',
      },
      {
        q: 'Can I change my plan later?',
        a: 'Yes, you can upgrade or downgrade at any time. When upgrading, you get immediate access to new features and the prorated difference is charged. When downgrading, the change takes effect at your next billing cycle. If you exceed your client limit after downgrading, you\'ll need to reduce clients or stay on the higher plan.',
      },
      {
        q: 'Is there a discount for annual billing?',
        a: 'Yes! Annual billing saves you 20% compared to monthly billing. Contact our support team after signing up to switch to annual billing. For the Scale plan, we also offer custom enterprise pricing for agencies with specific needs.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards through Stripe, including Visa, Mastercard, American Express, and Discover. For Scale plan customers, we can also arrange invoice billing with net-30 terms.',
      },
      {
        q: 'How much can I realistically charge my clients?',
        a: 'Most agencies charge between $99-299/month per client, with the sweet spot around $149/month. Some agencies targeting premium markets (medical, legal) charge $299-499/month. Remember: a single missed call can cost a business $500+, so $149/month for 24/7 AI coverage is an easy sell.',
      },
      {
        q: 'What\'s the ROI potential?',
        a: 'Let\'s do the math: On the Professional plan ($199/mo), if you sign 20 clients at $149/month, that\'s $2,980/month in revenue minus your $199 platform fee = $2,781/month profit. At 50 clients, that\'s $7,251/month profit. The platform fee stays flat while your revenue scales.',
      },
    ],
  },
  {
    id: 'white-label',
    name: 'White-Labeling & Branding',
    icon: Building2,
    description: 'How your brand stays front and center',
    faqs: [
      {
        q: 'What exactly is white-labeled?',
        a: 'Everything your clients see is branded as your company: the marketing website, signup pages, client dashboard, email notifications, SMS messages, invoices, and even the AI\'s greeting. VoiceAI Connect is completely invisible to your clients—they only see your brand.',
      },
      {
        q: 'Can I use my own domain name?',
        a: 'Yes, on Professional and Scale plans. You can use your own domain (e.g., app.youragency.com) for both your marketing site and client dashboards. On the Starter plan, you\'ll use a subdomain (youragency.voiceaiconnect.com).',
      },
      {
        q: 'What branding elements can I customize?',
        a: 'You can customize your logo, favicon, primary and accent colors, agency name, tagline, contact information, and all marketing copy on your site. You can also customize email templates and the AI\'s greeting scripts to match your brand voice.',
      },
      {
        q: 'Will my clients ever see VoiceAI Connect mentioned anywhere?',
        a: 'No. From your clients\' perspective, VoiceAI Connect doesn\'t exist. The only place our name appears is in your agency dashboard (which only you see) and in your contract with us. Your clients will think you built the technology yourself.',
      },
      {
        q: 'Can I have different branding for different client segments?',
        a: 'The platform supports one brand identity per agency account. If you want to operate multiple brands (e.g., one for dental offices, another for law firms), you would need separate agency accounts, each with their own subscription.',
      },
      {
        q: 'Do emails come from my domain?',
        a: 'On the Scale plan, yes—all client emails (welcome messages, notifications, invoices) come from your domain. On Starter and Professional plans, emails come from a neutral address but display your agency name and branding in the content.',
      },
    ],
  },
  {
    id: 'ai-technology',
    name: 'AI Technology',
    icon: Bot,
    description: 'How the AI receptionist works',
    faqs: [
      {
        q: 'How does the AI receptionist work?',
        a: 'When someone calls your client\'s AI number, our system answers within 500 milliseconds using state-of-the-art conversational AI. The AI can have natural conversations, answer questions about the business (using a knowledge base built from their website), capture caller information, and even book appointments.',
      },
      {
        q: 'How natural does the AI sound?',
        a: 'Very natural. We use premium ElevenLabs voices that are virtually indistinguishable from humans. The AI uses natural speech patterns, appropriate pauses, and can handle interruptions gracefully. Most callers don\'t realize they\'re talking to an AI.',
      },
      {
        q: 'How does the AI know about each client\'s business?',
        a: 'When a client signs up, our system automatically scrapes their website to build a knowledge base. It learns their services, pricing, hours, location, and frequently asked questions. Clients can also manually add or edit information in their dashboard.',
      },
      {
        q: 'Can the AI book appointments?',
        a: 'Yes! The AI can integrate with Google Calendar to check real-time availability and book appointments during the call. The client gets notified immediately, and the appointment appears in their calendar. This is included on all plans.',
      },
      {
        q: 'What happens if the AI can\'t answer a question?',
        a: 'The AI is trained to handle unknown situations gracefully. It will acknowledge that it doesn\'t have that specific information and offer to take a message or have someone call back. It never makes up information or provides inaccurate answers.',
      },
      {
        q: 'Can the AI transfer calls to a human?',
        a: 'Yes, the AI can be configured to transfer urgent calls to a specific phone number. For example, if someone calls about an emergency plumbing situation, the AI can recognize the urgency and transfer directly to the business owner\'s cell phone.',
      },
      {
        q: 'What languages does the AI support?',
        a: 'Currently, the AI primarily supports English with excellent results. Spanish support is in beta. Additional languages are on our roadmap. Contact us if you have specific language requirements.',
      },
      {
        q: 'How does the AI handle multiple calls at once?',
        a: 'The AI can handle unlimited simultaneous calls. Unlike a human receptionist who can only answer one call at a time, the AI scales instantly. During peak hours, every caller gets answered immediately—no busy signals, no hold times.',
      },
      {
        q: 'Is the AI available 24/7?',
        a: 'Yes, the AI answers calls 24 hours a day, 7 days a week, 365 days a year. Nights, weekends, holidays—it never sleeps, never takes breaks, and never calls in sick. This is one of the biggest selling points for your clients.',
      },
    ],
  },
  {
    id: 'client-features',
    name: 'Client Features',
    icon: Users,
    description: 'What your clients get access to',
    faqs: [
      {
        q: 'What features do my clients get?',
        a: 'Your clients get a full-featured dashboard including: call recordings, complete transcripts, AI-generated call summaries, SMS notifications after each call, analytics and reporting, appointment booking integration, knowledge base management, and real-time alerts for urgent calls.',
      },
      {
        q: 'Are calls recorded?',
        a: 'Yes, every call is automatically recorded and stored. Clients can listen to any recording directly in their dashboard with one click. Recordings are retained according to your plan limits and can be downloaded for their records.',
      },
      {
        q: 'What are call transcripts?',
        a: 'Every call is transcribed word-for-word using advanced speech recognition. Clients can read the full conversation, search through transcripts, and export them as text files. This is invaluable for quality assurance and record-keeping.',
      },
      {
        q: 'What are AI call summaries?',
        a: 'After each call, our AI analyzes the conversation and generates a concise summary that includes: caller name, phone number, reason for calling, urgency level, and any action items. This saves clients from listening to entire recordings.',
      },
      {
        q: 'How do SMS notifications work?',
        a: 'Immediately after each call, your client receives a text message with the key details: who called, why they called, and how urgent it is. They can see at a glance whether they need to call back immediately or if it can wait.',
      },
      {
        q: 'What kind of analytics do clients get?',
        a: 'Clients can see call volume trends, peak calling hours, common reasons people call, average call duration, and conversion metrics. On Professional and Scale plans, advanced analytics include geographic data, repeat caller tracking, and custom reports.',
      },
      {
        q: 'Can clients customize their AI\'s behavior?',
        a: 'Yes, clients can customize the greeting message, set business hours (with different behaviors for after-hours), manage their knowledge base, configure urgency keywords, and set up call forwarding rules—all from their dashboard.',
      },
      {
        q: 'Is there a mobile app for clients?',
        a: 'The client dashboard is fully responsive and works great on mobile devices. While there isn\'t a dedicated native app, clients can add the dashboard to their home screen for an app-like experience. Push notifications work on mobile browsers.',
      },
    ],
  },
  {
    id: 'phone-numbers',
    name: 'Phone Numbers',
    icon: Phone,
    description: 'How phone number provisioning works',
    faqs: [
      {
        q: 'How do phone numbers work?',
        a: 'Each client gets a dedicated phone number when they sign up. This can be a local number (with an area code matching their location) or a toll-free number. The number is provisioned automatically within seconds of signup.',
      },
      {
        q: 'Can clients keep their existing phone number?',
        a: 'Yes, on Professional and Scale plans, clients can port their existing phone number to our system. The porting process typically takes 1-2 weeks. During this time, they can use a temporary number so service isn\'t interrupted.',
      },
      {
        q: 'How do calls get routed to the AI?',
        a: 'There are two options: (1) Clients can set up call forwarding from their existing business number to their AI number, or (2) They can publish the AI number as their new business number. Most clients start with forwarding and switch to the AI number once they\'re confident in the system.',
      },
      {
        q: 'Are toll-free numbers available?',
        a: 'Yes, toll-free numbers (800, 888, 877, etc.) are available on Professional and Scale plans. On the Starter plan, only local numbers are included, but toll-free can be added for an additional fee.',
      },
      {
        q: 'Can one client have multiple phone numbers?',
        a: 'Yes, clients can have multiple numbers if needed—for example, different numbers for different locations or departments. Each additional number may incur extra costs depending on your pricing structure.',
      },
      {
        q: 'What happens if the AI system goes down?',
        a: 'Our platform has 99.9% uptime SLA and redundant systems across multiple data centers. In the extremely rare event of an outage, calls can be configured to automatically forward to a backup number (like the client\'s cell phone).',
      },
    ],
  },
  {
    id: 'getting-clients',
    name: 'Getting Clients',
    icon: Users,
    description: 'How to grow your agency',
    faqs: [
      {
        q: 'How do I get my first clients?',
        a: 'The most effective methods for new agencies are: (1) Cold email outreach to local businesses, (2) LinkedIn messaging to business owners, (3) Facebook and Instagram ads targeting local business owners, and (4) Local networking events and chambers of commerce. We provide email templates and sales scripts to help you get started.',
      },
      {
        q: 'What types of businesses make the best clients?',
        a: 'The best clients are businesses that: get lots of phone calls, can\'t afford a full-time receptionist, lose money when calls go unanswered, and need 24/7 coverage. This includes plumbers, HVAC contractors, dentists, lawyers, real estate agents, auto shops, salons, and medical practices.',
      },
      {
        q: 'Do you provide sales training or resources?',
        a: 'Yes! We provide email templates, cold call scripts, objection handling guides, and sales training videos. Professional and Scale plans include more comprehensive training and one-on-one onboarding calls with our success team.',
      },
      {
        q: 'How do I explain this to potential clients?',
        a: 'Focus on the problem, not the technology. Say: "You know how you miss calls when you\'re on a job site? And how a missed call can cost you $500 or more? I have a solution that answers every call 24/7, takes messages, and can even book appointments—for less than the cost of one missed job per month." Then let them try your demo line.',
      },
      {
        q: 'What\'s a good conversion rate to expect?',
        a: 'Agencies using our recommended outreach methods typically see 2-5% email response rates and 10-20% demo-to-customer conversion. If you send 100 cold emails, you might get 3-5 demos and close 1-2 clients. Consistency is key—successful agencies do outreach daily.',
      },
      {
        q: 'Can I offer free trials to potential clients?',
        a: 'Yes, and we recommend it. You can set up prospects with a trial period before they commit. Once they see missed calls drop to zero and experience the convenience, they almost always convert. Our data shows 68% of trials convert to paid.',
      },
      {
        q: 'How quickly can I expect to be profitable?',
        a: 'Most agencies become profitable within the first month. On the Starter plan ($99/mo), you\'re profitable with just one client paying $99+. On Professional ($199/mo), two clients at $99 makes you profitable. The fastest agencies sign their first paying client within 1-2 weeks of launching.',
      },
    ],
  },
  {
    id: 'technical',
    name: 'Technical & Integrations',
    icon: Code,
    description: 'API, integrations, and technical details',
    faqs: [
      {
        q: 'Do you have an API?',
        a: 'Yes, Professional and Scale plans include full REST API access. You can use the API to manage clients programmatically, access call data, trigger webhooks, and integrate with your existing systems. Full API documentation is available in your dashboard.',
      },
      {
        q: 'What integrations are available?',
        a: 'We integrate with Google Calendar for appointment booking, Stripe for payments, and Zapier for connecting to 5,000+ other apps. On Scale plans, we can build custom integrations for CRM systems, practice management software, and other tools.',
      },
      {
        q: 'Can I use webhooks?',
        a: 'Yes, Professional and Scale plans include webhook support. You can receive real-time notifications when calls start, end, or when appointments are booked. This allows you to build custom workflows and connect to any system.',
      },
      {
        q: 'Is the data secure?',
        a: 'Yes, security is a top priority. All data is encrypted at rest and in transit using industry-standard AES-256 encryption. We\'re SOC 2 Type II compliant and HIPAA-ready for healthcare clients. Call recordings are stored in secure, redundant data centers.',
      },
      {
        q: 'Where is the data stored?',
        a: 'All data is stored in secure data centers in the United States with redundant backups. We use enterprise-grade cloud infrastructure with 99.9% uptime guarantees. Data is backed up daily and retained according to your plan.',
      },
      {
        q: 'Is this HIPAA compliant?',
        a: 'Our infrastructure is HIPAA-ready, meaning it meets the technical requirements for handling protected health information. If you\'re serving healthcare clients, contact us about our Business Associate Agreement (BAA) and specific compliance requirements.',
      },
      {
        q: 'What\'s the uptime guarantee?',
        a: 'We guarantee 99.9% uptime for the platform and AI services. This is backed by our SLA on Scale plans. In our entire history, we\'ve maintained over 99.95% actual uptime. Our status page is public and shows real-time system status.',
      },
    ],
  },
  {
    id: 'support',
    name: 'Support & Success',
    icon: Headphones,
    description: 'How we help you succeed',
    faqs: [
      {
        q: 'What kind of support do you offer?',
        a: 'Starter plans include email support with 24-48 hour response times. Professional plans add priority email support with 4-8 hour response times. Scale plans include dedicated success managers, phone support, and SLA guarantees with 1-hour response times for urgent issues.',
      },
      {
        q: 'Do you help with onboarding?',
        a: 'Yes! All plans include access to our onboarding documentation and video tutorials. Professional plans include a guided onboarding session. Scale plans include white-glove onboarding with a dedicated success manager who walks you through everything.',
      },
      {
        q: 'What if my clients have technical issues?',
        a: 'You can handle basic questions yourself using our knowledge base. For technical issues, you can submit support tickets on behalf of your clients (keeping your white-label positioning). We\'ll work with you behind the scenes to resolve issues quickly.',
      },
      {
        q: 'Is there a community or forum?',
        a: 'Yes, we have a private community for agency owners where you can share strategies, ask questions, and learn from other successful agencies. It\'s a valuable resource for both new and experienced agencies.',
      },
      {
        q: 'Do you offer training on selling AI receptionists?',
        a: 'Yes, we provide sales training resources including scripts, email templates, objection handling guides, and recorded training sessions. Professional and Scale plans include live training sessions and role-playing practice.',
      },
      {
        q: 'What happens if I need a feature that doesn\'t exist?',
        a: 'We\'re constantly adding new features based on agency feedback. You can submit feature requests through your dashboard, and our product team reviews all suggestions. Scale plan customers get priority consideration for feature requests.',
      },
    ],
  },
  {
    id: 'account',
    name: 'Account & Policies',
    icon: Settings,
    description: 'Account management and policies',
    faqs: [
      {
        q: 'How do I cancel my subscription?',
        a: 'You can cancel anytime from your dashboard settings with no cancellation fees. When you cancel, you\'ll retain access until the end of your current billing period. Your clients will continue to work until then, giving you time to transition them if needed.',
      },
      {
        q: 'What happens to my clients if I cancel?',
        a: 'When you cancel, your clients will lose access to the AI receptionist at the end of your billing period. We recommend giving them advance notice so they can make alternative arrangements. We don\'t directly contact your clients—that relationship is yours.',
      },
      {
        q: 'Can I pause my subscription?',
        a: 'We don\'t offer subscription pausing, but you can downgrade to the Starter plan if you need to reduce costs temporarily. If you have special circumstances, contact our support team and we\'ll work with you.',
      },
      {
        q: 'Can I get a refund?',
        a: 'We offer a 14-day free trial so you can evaluate the platform before paying. After your trial, subscriptions are non-refundable, but you can cancel anytime to stop future charges. If you have concerns about the platform, contact us—we want you to succeed.',
      },
      {
        q: 'Can I transfer my agency to someone else?',
        a: 'Yes, agency accounts can be transferred. Contact our support team to initiate a transfer. We\'ll verify both parties and update the billing information. Client relationships and settings remain intact during the transfer.',
      },
      {
        q: 'What happens if I don\'t pay my bill?',
        a: 'If a payment fails, we\'ll notify you and retry the charge. You have a 7-day grace period to update your payment method. After that, your account will be suspended, and your clients\' AI receptionists will stop answering calls. Once you update payment, service resumes immediately.',
      },
      {
        q: 'Do you offer any money-back guarantee?',
        a: 'We offer a 14-day free trial which serves as our satisfaction guarantee. If you\'re not seeing results after actively using the platform for a full month, reach out to our success team—we\'ll work with you on your strategy before you consider canceling.',
      },
    ],
  },
];

export default function FAQPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter FAQs based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;
    
    const query = searchQuery.toLowerCase();
    return faqCategories.map(category => ({
      ...category,
      faqs: category.faqs.filter(
        faq => 
          faq.q.toLowerCase().includes(query) || 
          faq.a.toLowerCase().includes(query)
      ),
    })).filter(category => category.faqs.length > 0);
  }, [searchQuery]);

  const toggleQuestion = (categoryId: string, index: number) => {
    const key = `${categoryId}-${index}`;
    setOpenQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const totalQuestions = faqCategories.reduce((sum, cat) => sum + cat.faqs.length, 0);

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9] overflow-hidden">
      {/* Premium grain overlay */}
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

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled ? 'bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.06]' : 'bg-transparent'
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-xl overflow-hidden border border-white/10">
                  <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <WaveformIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">VoiceAI Connect</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {[
                { name: 'Platform', href: '/platform' },
                { name: 'How It Works', href: '/how-it-works' },
                { name: 'Pricing', href: '/#pricing' },
                { name: 'FAQ', href: '/faq' },
              ].map((item) => (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`px-4 py-2 text-sm transition-colors rounded-lg hover:bg-white/[0.03] ${
                    item.href === '/faq' ? 'text-[#fafaf9]' : 'text-[#fafaf9]/60 hover:text-[#fafaf9]'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link 
                href="/agency/login" 
                className="px-4 py-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="group relative inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#050505] transition-all hover:bg-[#fafaf9] hover:shadow-lg hover:shadow-white/10"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -mr-2 text-[#fafaf9]/60 hover:text-[#fafaf9]"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden transition-all duration-300 ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-4 pb-6 pt-2 space-y-1 bg-[#050505]/95 backdrop-blur-xl border-b border-white/[0.06]">
            {[
              { name: 'Platform', href: '/platform' },
              { name: 'How It Works', href: '/how-it-works' },
              { name: 'Pricing', href: '/#pricing' },
              { name: 'FAQ', href: '/faq' },
            ].map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-[#fafaf9]/70 hover:text-[#fafaf9] hover:bg-white/[0.03] rounded-lg transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <Link 
                href="/agency/login" 
                className="px-4 py-3 text-center text-[#fafaf9]/70 hover:text-[#fafaf9] rounded-lg border border-white/10"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-4 py-3 text-center bg-white text-[#050505] font-medium rounded-full"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 lg:pt-40 pb-12 sm:pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/[0.07] via-amber-500/[0.03] to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5 text-sm mb-6">
              <HelpCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-300/90">{totalQuestions}+ Questions Answered</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
              Frequently Asked
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent">
                Questions
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-[#fafaf9]/60 max-w-2xl mx-auto">
              Everything you need to know about VoiceAI Connect. 
              Can&apos;t find the answer you&apos;re looking for? Contact our support team.
            </p>

            {/* Search */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#fafaf9]/30" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#fafaf9] placeholder:text-[#fafaf9]/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#fafaf9]/30 hover:text-[#fafaf9]/60"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-3 text-sm text-[#fafaf9]/40">
                  Found {filteredCategories.reduce((sum, cat) => sum + cat.faqs.length, 0)} results for &quot;{searchQuery}&quot;
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="border-y border-white/[0.06] bg-white/[0.01] py-4 sticky top-16 sm:top-20 z-30 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/[0.03] text-[#fafaf9]/60 hover:text-[#fafaf9] border border-white/[0.06]'
              }`}
            >
              All Topics
            </button>
            {faqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeCategory === category.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.03] text-[#fafaf9]/60 hover:text-[#fafaf9] border border-white/[0.06]'
                }`}
              >
                <category.icon className="h-4 w-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {(activeCategory ? filteredCategories.filter(c => c.id === activeCategory) : filteredCategories).map((category) => (
            <div key={category.id} className="mb-12" id={category.id}>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <category.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{category.name}</h2>
                  <p className="text-sm text-[#fafaf9]/40">{category.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                {category.faqs.map((faq, index) => {
                  const isOpen = openQuestions.has(`${category.id}-${index}`);
                  return (
                    <div 
                      key={index}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(category.id, index)}
                        className="w-full flex items-start justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <h3 className="font-medium pr-4 leading-relaxed">{faq.q}</h3>
                        <ChevronDown className={`h-5 w-5 text-[#fafaf9]/40 shrink-0 mt-0.5 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`} />
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-5 pb-5 pt-0">
                          <p className="text-[#fafaf9]/60 leading-relaxed whitespace-pre-line">{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-[#fafaf9]/20 mx-auto mb-4" />
              <p className="text-[#fafaf9]/40">No questions found matching &quot;{searchQuery}&quot;</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.08] to-transparent p-8 sm:p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20 mx-auto mb-6">
              <MessageSquare className="h-7 w-7 text-emerald-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
              Still have questions?
            </h2>
            <p className="text-[#fafaf9]/50 mb-8 max-w-lg mx-auto">
              Can&apos;t find the answer you&apos;re looking for? Our support team is here to help. 
              We typically respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="mailto:support@voiceaiconnect.com"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-medium text-[#050505] hover:bg-[#fafaf9] transition-colors"
              >
                Contact Support
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-base font-medium text-[#fafaf9] hover:bg-white/[0.06] transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 sm:py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold mb-8 text-center">Helpful Resources</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Zap, title: 'How It Works', description: 'Step-by-step guide to launching', href: '/how-it-works' },
              { icon: DollarSign, title: 'Pricing', description: 'Plans and pricing details', href: '/#pricing' },
              { icon: Sparkles, title: 'Platform Features', description: 'All 40+ features explained', href: '/platform' },
              { icon: CheckCircle2, title: 'Feature Comparison', description: 'Compare all plans side-by-side', href: '/features' },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all group"
              >
                <item.icon className="h-5 w-5 text-emerald-400 mb-3" />
                <h3 className="font-medium mb-1 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                <p className="text-sm text-[#fafaf9]/40">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                <WaveformIcon className="w-5 h-5" />
              </div>
              <span className="font-semibold">VoiceAI Connect</span>
            </Link>
            
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-[#fafaf9]/40">
              <Link href="/platform" className="hover:text-[#fafaf9] transition-colors">Platform</Link>
              <Link href="/how-it-works" className="hover:text-[#fafaf9] transition-colors">How It Works</Link>
              <Link href="/features" className="hover:text-[#fafaf9] transition-colors">Features</Link>
              <Link href="/faq" className="text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors">FAQ</Link>
              <Link href="/terms" className="hover:text-[#fafaf9] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#fafaf9] transition-colors">Privacy</Link>
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