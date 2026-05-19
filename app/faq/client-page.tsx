'use client';

import Link from 'next/link';
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowUpRight, ArrowRight, Search, Plus,
  HelpCircle, DollarSign, Zap, Shield, Bot,
  Building2, CreditCard, Settings,
  Users, Phone, Code, Headphones, Stethoscope, PhoneForwarded,
} from 'lucide-react';
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
        a: 'Yes. The Free plan has no platform fee at all—you can start immediately with no credit card required. For Pro and Scale plans, we offer a 14-day free trial with full access to all features. You can set up your branding, explore the platform, and even onboard test clients before committing.',
      },
      {
        q: 'Can I try the AI before signing up?',
        a: 'Absolutely. We have a public demo phone number you can call anytime to experience the AI receptionist firsthand. Additionally, once you sign up, Pro and Scale plans include a branded demo number for your own agency that you can share with potential clients.',
      },
      {
        q: 'What happens after my free trial ends?',
        a: 'At the end of your 14-day trial, your subscription will begin at your chosen plan level. If you decide VoiceAI Connect isn\'t right for you, simply cancel before the trial ends and you won\'t be charged. There\'s no commitment and no cancellation fees. The Free plan has no trial because there\'s no fee to trial against—it\'s free forever.',
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
        a: 'We offer three plans. The Free plan has zero platform fee—you pay $29.99 per client per month plus $0.12 per minute of voice usage. The Pro plan at $99/month includes full white-label branding, a marketing website, and a demo phone line with reduced rates at $9.99 per client and $0.10 per minute. The Scale plan at $499/month eliminates per-client fees entirely at just $0.05 per minute. Pro and Scale both include a 14-day free trial with no credit card required. Google Calendar integration is included on every plan.',
      },
      {
        q: 'What\'s the difference between the plans?',
        a: 'The Free plan lets you start with no risk—you only pay per-client and per-minute fees. Pro ($99/mo) adds full white-label branding, custom domain, a marketing website with an AI demo phone line, the lead generation CRM, and team member access. Scale ($499/mo) includes everything in Pro plus AI Lab with industry prompt templates, unlimited team members, Bring Your Own Twilio support, and priority support.',
      },
      {
        q: 'Do you take a percentage of my client revenue?',
        a: 'No, never. We charge a flat monthly platform fee plus usage-based pricing. If you charge 50 clients $149/month each, that\'s $7,450/month going directly to your Stripe account. We only collect our platform and usage fees separately.',
      },
      {
        q: 'How do payments work? How do I get paid?',
        a: 'You connect your own Stripe account during setup. When your clients subscribe through your branded signup page, payments go directly to your Stripe account—not to us. You set your own prices ($99, $149, $299, whatever you want) and keep 100% of what you charge.',
      },
      {
        q: 'Can I change my plan later?',
        a: 'Yes, you can upgrade or downgrade at any time. When upgrading, you get immediate access to new features and the prorated difference is charged. When downgrading, the change takes effect at your next billing cycle.',
      },
      {
        q: 'How much can I realistically charge my clients?',
        a: 'Most agencies charge between $99-299/month per client, with the sweet spot around $149/month. Some agencies targeting premium markets (medical, legal) charge $299-499/month. A single missed call can cost a business $500+, and a full-time human receptionist runs $3,000+/month—so $149/month for 24/7 AI coverage is a straightforward sell.',
      },
      {
        q: 'What\'s the ROI potential?',
        a: 'On the Pro plan ($99/mo), if you sign 20 clients at $149/month, that\'s $2,980/month in client revenue minus your $99 platform fee and $9.99 × 20 in per-client fees ($199.80) = roughly $2,681/month profit. At 50 clients the math gets even better. On the Scale plan, there are no per-client fees at all—your margin compounds as you grow.',
      },
      {
        q: 'Do my clients get a free trial too?',
        a: 'Yes. Every plan includes a 7-day free trial for the businesses you onboard. When a local business signs up through your branded page, they get seven days of full AI receptionist service before their first billing cycle begins. This gives your clients a risk-free way to experience the product, which increases your conversion rate significantly.',
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
        a: 'Yes, on Pro and Scale plans. You can use your own domain (e.g., app.youragency.com) for both your marketing site and client dashboards. On the Free plan, you\'ll use a subdomain.',
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
        a: 'When someone calls your client\'s AI number, our system answers within milliseconds using state-of-the-art conversational AI. The AI can have natural conversations, answer questions about the business using its knowledge base, capture caller information, detect spam, recognize returning callers by phone number, and book appointments directly to Google Calendar.',
      },
      {
        q: 'How natural does the AI sound?',
        a: 'Very natural. We use premium ElevenLabs voices with multiple voice options per client—male, female, different accents and speaking styles. The AI uses natural speech patterns, appropriate pauses, and handles interruptions gracefully. Most callers don\'t realize they\'re talking to an AI.',
      },
      {
        q: 'How does the AI know about each client\'s business?',
        a: 'When a client signs up, the system can automatically scan their website to build a knowledge base. But a website isn\'t required—clients can manually configure everything from their "My Business" tab: services with pricing and duration, staff members, business hours, FAQs, and additional information. Manual entries always supplement or override any scanned content.',
      },
      {
        q: 'Can clients configure the AI\'s personality and behavior?',
        a: 'Yes. From the AI Agent tab in their dashboard, clients can select a voice, customize the greeting message, choose a tone (professional, friendly, casual, or clinical), and configure tools like caller recognition, spam detection, and call transfer rules. From the My Business tab, they manage services, staff, hours, and the knowledge base that shapes what the AI knows.',
      },
      {
        q: 'What happens if the AI can\'t answer a question?',
        a: 'The AI is trained to handle unknown situations gracefully. It will acknowledge that it doesn\'t have that specific information and offer to take a message or have someone call back. It never makes up information or provides inaccurate answers.',
      },
      {
        q: 'Can the AI transfer calls to a human?',
        a: 'Yes. The AI can transfer urgent calls to the business owner\'s phone number. Agencies and clients can configure priority rules—for example, transfer immediately if someone mentions an emergency, a specific keyword, or is a VIP caller. If the transfer goes unanswered, the AI stays on the line and takes a message instead of sending the caller to voicemail.',
      },
      {
        q: 'Does the AI support Spanish?',
        a: 'Yes—fully, on every plan, with no configuration required. The AI automatically detects when a caller speaks Spanish and switches to Spanish for the entire conversation using Deepgram nova-2 real-time language detection. It collects all information in Spanish and sends the business owner a summary in English. This works for English and Spanish today, with additional languages on the roadmap.',
      },
      {
        q: 'How does the AI handle multiple calls at once?',
        a: 'The AI handles unlimited simultaneous calls. Unlike a human receptionist who can only answer one call at a time, the AI scales instantly. During peak hours, every caller gets answered immediately—no busy signals, no hold times. This is one of the strongest selling points for businesses with high call volume.',
      },
      {
        q: 'Does the AI filter spam and robocalls?',
        a: 'Yes—automatically, on every plan. The AI detects telemarketers, robocalls, and solicitors and ends those calls immediately. Spam calls are not counted against the client\'s monthly limit. Business owners receive a notification when spam is blocked. No configuration is required.',
      },
      {
        q: 'Is the AI available 24/7?',
        a: 'Yes. The AI answers calls 24 hours a day, 7 days a week, 365 days a year. It never sleeps, never takes breaks, and never calls in sick. Clients can also configure after-hours behavior separately—for example, a different greeting and message-only mode outside business hours.',
      },
    ],
  },
  {
    id: 'calendar-booking',
    name: 'Calendar & Booking',
    icon: CreditCard,
    description: 'Appointment scheduling and service-specific rules',
    faqs: [
      {
        q: 'How does appointment booking work?',
        a: 'The AI connects to Google Calendar. When a caller wants to book, the AI checks real-time availability, offers open slots, collects the caller\'s information, and creates the calendar event automatically—all during the live call. The event includes the caller\'s name, phone number, service type, and any notes. Google Calendar integration is included on every plan, including Free.',
      },
      {
        q: 'Can I set different booking rules per service?',
        a: 'Yes. From the My Business tab, clients define structured services with individual settings: name, duration (e.g., 30 min for a cleaning, 60 min for a deep clean), buffer time between appointments, and a booking mode per service. Some services can be booked directly by the AI, others can be set to "collect request" mode where the AI gathers the caller\'s preferred time and has the office confirm, and others can be marked as not bookable by phone at all.',
      },
      {
        q: 'Can the AI route bookings to specific staff or providers?',
        a: 'Yes. Clients can add staff members with names, roles, and availability in the My Business tab. When a caller wants to book, the AI asks if they have a preferred provider. The staff member\'s name is included in the calendar event title and details so the business knows who the appointment is with.',
      },
      {
        q: 'What if a client doesn\'t want the AI to book directly?',
        a: 'Clients can set their booking mode to "collect request" at the business level or per individual service. In this mode, the AI collects the caller\'s name, phone number, preferred date and time, and what service they need—then lets them know someone from the office will call to confirm. No calendar events are created. This is common for medical, legal, and high-touch service businesses.',
      },
      {
        q: 'Does booking work with calendars other than Google?',
        a: 'Google Calendar is the primary integration today. Since Google Calendar syncs natively with most CRMs and scheduling platforms (HubSpot, Salesforce, Calendly, etc.), appointments booked by the AI flow through automatically to connected tools.',
      },
    ],
  },
  {
    id: 'call-forwarding',
    name: 'Call Forwarding & Setup',
    icon: PhoneForwarded,
    description: 'How to route calls to your AI receptionist',
    faqs: [
      {
        q: 'How do calls get to the AI?',
        a: 'There are three options. (1) Forward your existing business number to the AI number using your phone\'s call forwarding—callers dial the same number they always have. (2) Use the AI number directly as your business number on your website, ads, and cards. (3) A hybrid approach: forward when you\'re busy or on a job, answer directly when you\'re available.',
      },
      {
        q: 'How do I set up call forwarding?',
        a: 'The simplest method is unconditional forwarding. On most carriers, dial *72, then the AI phone number, and press call. You\'ll hear a confirmation tone. To turn it off, dial *73. This works on AT&T, Verizon, T-Mobile, and most landline providers. Some carriers have slightly different codes—check your carrier\'s support page or call them and ask to set up call forwarding to a specific number.',
      },
      {
        q: 'Can I forward calls only when I don\'t answer?',
        a: 'Yes, this is called conditional forwarding. Your phone rings first, and if you don\'t pick up within a set number of rings, the call forwards to the AI. The platform also supports a built-in "Fallback" mode: the AI transfers to your phone first, and if you don\'t answer, the AI takes over—no carrier-level forwarding needed.',
      },
      {
        q: 'Carrier-specific forwarding codes',
        a: 'AT&T: *72 to activate, *73 to deactivate. Verizon: *72 to activate, *73 to deactivate. T-Mobile: *72 to activate, *73 to deactivate (or use the T-Mobile app under Call Settings). Spectrum/landline: *72 to activate, *73 to deactivate. Google Voice: Settings → Calls → Call Forwarding. For any carrier not listed, call their support line and say "I need to set up call forwarding to this number" and give them the AI phone number.',
      },
      {
        q: 'Do my clients need a website for this to work?',
        a: 'No. Clients just need a phone number. They forward their existing business line to the AI number, or use the AI number directly. There is nothing to install, no website required, and no technical setup on their end. If they do have a website, the AI can scan it automatically to learn about their business—but it\'s entirely optional.',
      },
      {
        q: 'Can one client have multiple phone numbers?',
        a: 'Yes, clients can have multiple AI numbers if needed—for example, different numbers for different locations or departments. Each additional number can be provisioned through the platform.',
      },
    ],
  },
  {
    id: 'client-features',
    name: 'Client Dashboard & Features',
    icon: Users,
    description: 'What your end clients get access to',
    faqs: [
      {
        q: 'What does the client dashboard include?',
        a: 'Clients get a fully branded dashboard organized into six tabs: Dashboard (stats and overview), Calls (recordings, transcripts, AI summaries), Contacts (caller history and notes), My Business (services, staff, hours, knowledge base), AI Agent (voice, greeting, tone, tools configuration), and Settings (account, calendar, billing). Everything is themed to your agency\'s brand.',
      },
      {
        q: 'Can agencies control what clients see in the dashboard?',
        a: 'Yes. Agencies can set dashboard access per client to full access, read-only (can see calls and data but can\'t change settings), or no access (the agency manages everything on their behalf). You can also grant team members within a client\'s account specific permissions.',
      },
      {
        q: 'How do SMS notifications work?',
        a: 'Immediately after each call, the business owner receives a text message with the key details: who called, why they called, the AI\'s summary, and how urgent it is. They can see at a glance whether they need to call back immediately or if it can wait. Demo and admin calls also send SMS summaries.',
      },
      {
        q: 'Can clients export their data?',
        a: 'Yes. Clients can export call logs (with transcripts, summaries, duration, and caller info), contacts, and analytics data as CSV files directly from their dashboard. Agency owners can also export data across all clients from the agency dashboard.',
      },
      {
        q: 'What kind of analytics do clients get?',
        a: 'Clients can see call volume trends, peak calling hours, common reasons people call, average call duration, spam vs. legitimate call ratios, and conversion metrics. The dashboard overview shows calls this month, new contacts, and key activity at a glance.',
      },
      {
        q: 'Can clients customize their AI\'s behavior?',
        a: 'Yes. From the AI Agent tab, clients choose their AI\'s voice, customize the greeting message, select a conversation tone (professional, friendly, casual, or clinical), set booking mode preferences, and configure tools like caller recognition, spam detection, and call transfer. From My Business, they manage services, staff, hours, and everything the AI references on calls.',
      },
      {
        q: 'Is there a mobile app for clients?',
        a: 'The client dashboard is fully responsive and works great on mobile devices. Clients can add it to their home screen for an app-like experience with one tap. SMS and email notifications work on all devices.',
      },
    ],
  },
  {
    id: 'hipaa-medical',
    name: 'HIPAA & Medical Practices',
    icon: Stethoscope,
    description: 'Compliance, privacy, and healthcare use cases',
    faqs: [
      {
        q: 'Is VoiceAI Connect HIPAA compliant?',
        a: 'Yes. VoiceAI Connect offers a HIPAA mode that can be enabled per client. When active, HIPAA mode disables call recording storage, forces all appointments into "collect request" mode (the AI gathers the caller\'s name, phone number, and general reason for the visit—no clinical details—and the office confirms), and suppresses transcript storage. The AI is trained to never ask about or discuss specific medical information on calls.',
      },
      {
        q: 'What data does the AI collect on medical calls?',
        a: 'In HIPAA mode, the AI collects only scheduling information: the caller\'s name, phone number, whether they are a new or existing patient, and a general reason for the visit (e.g., "checkup," "follow-up," "new patient appointment"). If a caller shares medical details, the AI redirects: "Our provider will discuss that at your appointment." No Protected Health Information (PHI) is stored in the platform.',
      },
      {
        q: 'Do you offer a Business Associate Agreement (BAA)?',
        a: 'Yes. We provide a BAA for agencies and clients handling healthcare calls. Contact support@myvoiceaiconnect.com to request a BAA before onboarding medical or dental clients.',
      },
      {
        q: 'Is call data used to train AI models?',
        a: 'No. Call recordings, transcripts, and conversation data are never used to train AI models. Your clients\' call data stays private and is only accessible to the client and the agency that manages their account.',
      },
      {
        q: 'How does the AI handle medical emergencies?',
        a: 'The AI is trained to recognize emergency language (difficulty breathing, severe pain, chest pain, etc.) and immediately directs the caller to call 911 or go to the nearest emergency room. It does not provide medical advice. For urgent but non-emergency situations, it collects the caller\'s information and notifies the practice owner immediately via SMS.',
      },
      {
        q: 'Can the AI distinguish between new and existing patients?',
        a: 'Yes. The AI asks "Are you a current patient or would this be your first visit?" and adjusts the conversation accordingly. With caller recognition enabled, it can also look up returning callers by phone number and greet them by name.',
      },
      {
        q: 'What about insurance questions?',
        a: 'Clients add their accepted insurance carriers to the knowledge base. The AI can answer "Do you accept Blue Cross?" using that information. For specific coverage or benefits questions, it redirects: "Coverage depends on your specific plan. Our billing team can verify your benefits—would you like me to take your information so they can reach out?"',
      },
    ],
  },
  {
    id: 'phone-numbers',
    name: 'Phone Numbers & Telephony',
    icon: Phone,
    description: 'Number provisioning, international, and routing',
    faqs: [
      {
        q: 'How do phone numbers work?',
        a: 'Each client gets a dedicated phone number provisioned automatically within seconds of signup. By default, numbers are US local numbers through Telnyx with no A2P registration delay. The number is ready to receive calls immediately.',
      },
      {
        q: 'Are international numbers available?',
        a: 'Yes. The default integration uses Telnyx for US numbers. For UK, Canadian, or other international numbers, agencies on the Scale plan can connect their own Twilio account. The platform routes calls through Twilio automatically for those clients—the AI behavior, dashboards, and billing all work identically.',
      },
      {
        q: 'Can VoiceAI Connect be used from outside the US?',
        a: 'Yes. The platform is available globally. Agency operators in any country can sign up and run a workspace. End-client coverage is available in the US, UK, and Canada. An operator based in India, the Philippines, or anywhere else can run a US-focused agency remotely. Stripe Connect supports payouts to most major countries.',
      },
      {
        q: 'What happens if the AI system goes down?',
        a: 'Our platform has 99.9% uptime with redundant systems. In the extremely rare event of an outage, calls can be configured to automatically forward to a backup number (like the client\'s cell phone) so no calls are lost.',
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
        a: 'The most effective methods are: (1) Cold email outreach to local businesses using our provided templates, (2) LinkedIn messaging to business owners, (3) Facebook and Instagram ads targeting local business owners, and (4) Letting prospects call your AI demo line—once they experience it firsthand, they typically convert without a sales call. The platform also includes a built-in lead generation CRM with Google Maps prospecting and 13 pre-written outreach email templates.',
      },
      {
        q: 'What types of businesses make the best clients?',
        a: 'Businesses that get lots of phone calls, can\'t afford a full-time receptionist, lose money when calls go unanswered, and need 24/7 coverage. This includes plumbers, HVAC contractors, electricians, dentists, chiropractors, lawyers, real estate agents, auto shops, salons, medical practices, restaurants, and veterinarians.',
      },
      {
        q: 'How do I explain this to potential clients?',
        a: 'Focus on the problem, not the technology. Say: "You know how you miss calls when you\'re on a job site? And how a missed call can cost you $500 or more? I have a solution that answers every call 24/7, takes messages, and can even book appointments—for less than the cost of one missed job per month." Then let them try your demo line.',
      },
      {
        q: 'Can I offer free trials to potential clients?',
        a: 'Yes, and we recommend it. Every plan includes a 7-day free trial for the businesses you onboard. Once they see missed calls drop to zero and experience the convenience, they almost always convert. Our data shows 68% of trials convert to paid.',
      },
      {
        q: 'How quickly can I expect to be profitable?',
        a: 'Most agencies become profitable within the first month. On the Free plan, there\'s no platform fee—you\'re profitable with your first client. On Pro ($99/mo), two clients at $99+ makes you profitable. The fastest agencies sign their first paying client within 1-2 weeks of launching.',
      },
      {
        q: 'Can agencies use their own website instead of the included marketing site?',
        a: 'Yes. The platform provides a white-label marketing site automatically, but agencies can use their own website for marketing and lead generation instead. The client signup API endpoint is public, and agencies can link to the /get-started signup flow from any external site. The included marketing site is optional—many agencies use both.',
      },
    ],
  },
  {
    id: 'data-integrations',
    name: 'Data, API & Integrations',
    icon: Code,
    description: 'Export, webhooks, API, and connecting other tools',
    faqs: [
      {
        q: 'What data export options are available?',
        a: 'Call logs (with transcripts, AI summaries, duration, and caller info), contacts, and analytics data can all be exported as CSV files. Both clients and agencies can export from their respective dashboards. Agency-level exports cover all clients in one download.',
      },
      {
        q: 'Do you have an API?',
        a: 'Yes, Pro and Scale plans include REST API access. You can use the API to manage clients programmatically, access call data, and integrate with your existing systems. Full API documentation is available in your agency dashboard.',
      },
      {
        q: 'Can agencies receive webhook notifications?',
        a: 'Yes. Agencies can configure webhook URLs to receive real-time POST notifications when calls end, appointments are booked, and other events occur. Payloads include full call data and are HMAC-signed for security. This allows agencies to pipe call events into their own CRMs, Zapier, Make, n8n, or any custom system.',
      },
      {
        q: 'What integrations are available?',
        a: 'Google Calendar for appointment booking (all plans), Stripe Connect for payments, and webhook/API support for connecting to CRMs, automation tools, and other systems. Since Google Calendar syncs natively with HubSpot, Salesforce, Calendly, and other platforms, appointments flow through automatically.',
      },
      {
        q: 'Does the platform support two-way SMS?',
        a: 'Currently, the platform sends one-way SMS notifications to business owners after each call (caller info, summary, urgency level). Two-way SMS—where business owners can text callers back through the platform—is actively in development and coming soon. For now, owners call back from their personal phone using the number in the notification.',
      },
      {
        q: 'What about website chat or other channels?',
        a: 'VoiceAI Connect is purpose-built for voice/phone calls, which is where most small businesses lose the most revenue. Website chat is not currently supported, but the webhook and API infrastructure allows agencies to connect the platform into broader multi-channel systems if needed.',
      },
    ],
  },
  {
    id: 'security',
    name: 'Security & Privacy',
    icon: Shield,
    description: 'Data security, compliance, and privacy',
    faqs: [
      {
        q: 'Is my data secure?',
        a: 'Yes, security is a top priority. All data is encrypted at rest and in transit. We use Supabase with Postgres row-level security, ensuring agencies and clients can only access their own data. Infrastructure runs on SOC 2-compliant vendors. PII is never persisted in application logs.',
      },
      {
        q: 'Where is data stored?',
        a: 'All data is stored in secure data centers in the United States with redundant backups. We use enterprise-grade cloud infrastructure with 99.9% uptime guarantees.',
      },
      {
        q: 'Is call data used to train AI models?',
        a: 'No. Call recordings, transcripts, and conversation data are never used to train AI models. Call data is private and only accessible to the client and their managing agency.',
      },
      {
        q: 'Can recordings be disabled?',
        a: 'Yes. HIPAA mode disables call recording storage entirely. Even outside HIPAA mode, the platform supports configuring recording preferences per client. When recordings are disabled, AI summaries and SMS notifications still function—the caller\'s information is captured without storing the audio file.',
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
        a: 'The Free plan includes email support. Pro plans add priority email support with faster response times. Scale plans include dedicated success managers, phone support, and SLA guarantees. All plans include access to documentation and onboarding resources.',
      },
      {
        q: 'Do you help with onboarding?',
        a: 'Yes. All plans include onboarding documentation and video tutorials. Pro plans include a guided onboarding session. Scale plans include white-glove onboarding with a dedicated success manager.',
      },
      {
        q: 'What if my clients have technical issues?',
        a: 'You handle client support to maintain your white-label positioning. For technical issues you can\'t resolve, submit support tickets on behalf of your clients. We work with you behind the scenes to resolve issues quickly—your clients never interact with us directly.',
      },
      {
        q: 'What happens if I need a feature that doesn\'t exist?',
        a: 'We ship new features regularly based on agency feedback. You can submit feature requests through your dashboard. Scale plan customers get priority consideration for feature requests.',
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
        a: 'You can cancel anytime from your dashboard settings with no cancellation fees. When you cancel, you retain access until the end of your current billing period. Your clients continue to work until then, giving you time to transition them if needed.',
      },
      {
        q: 'What happens to my clients if I cancel?',
        a: 'When you cancel, your clients lose access to the AI receptionist at the end of your billing period. We recommend giving them advance notice. We don\'t directly contact your clients—that relationship is yours.',
      },
      {
        q: 'Can I get a refund?',
        a: 'We offer a 14-day free trial so you can evaluate the platform before paying. After your trial, subscriptions are non-refundable, but you can cancel anytime to stop future charges. If you have concerns, contact us—we want you to succeed.',
      },
      {
        q: 'What happens if I don\'t pay my bill?',
        a: 'If a payment fails, we notify you and retry the charge. You have a 7-day grace period to update your payment method. After that, your account will be suspended and your clients\' AI receptionists will stop answering calls. Once you update payment, service resumes immediately.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const r1 = useInView();
  const r2 = useInView();

  const filteredCategories = useMemo(() => {
    let cats = faqCategories;
    if (activeCategory) cats = cats.filter(c => c.id === activeCategory);
    if (!searchQuery.trim()) return cats;
    const query = searchQuery.toLowerCase();
    return cats.map(category => ({
      ...category,
      faqs: category.faqs.filter(
        faq =>
          faq.q.toLowerCase().includes(query) ||
          faq.a.toLowerCase().includes(query)
      ),
    })).filter(category => category.faqs.length > 0);
  }, [searchQuery, activeCategory]);

  const totalQuestions = faqCategories.reduce((sum, cat) => sum + cat.faqs.length, 0);

  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      {/* HERO */}
      <section className="canvas-dot relative pt-40 lg:pt-48 pb-16 lg:pb-20 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={r1} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-7">Frequently asked questions</p>
            <h1 className="t-h1 text-white max-w-[14ch]">Everything you wanted to ask.</h1>
            <p className="t-body mt-7 max-w-xl text-[1rem]">
              {totalQuestions} answers across {faqCategories.length} categories. Start typing to filter, or pick a category below.
            </p>

            <div className="mt-9 relative max-w-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions and answers…"
                className="w-full pl-12 pr-5 py-4 rounded-full bg-white/[0.025] border border-white/[0.08] text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.25] transition-colors font-display"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section className="bg-ink border-y border-white/[0.05] py-5 sticky top-16 z-30 backdrop-blur-xl" style={{ background: 'rgba(5, 5, 5, 0.85)' }}>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full font-mono text-[11px] tracking-[0.12em] uppercase whitespace-nowrap border transition-colors ${
                activeCategory === null
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white/55 border-white/[0.12] hover:border-white/30 hover:text-white'
              }`}
            >
              All · {totalQuestions}
            </button>
            {faqCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`px-4 py-2 rounded-full font-mono text-[11px] tracking-[0.12em] uppercase whitespace-nowrap border transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-white/55 border-white/[0.12] hover:border-white/30 hover:text-white'
                }`}
              >
                {cat.name} · {cat.faqs.length}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES + Q&A */}
      <section className="bg-ink py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-[20px] text-white/65">No matches for &ldquo;{searchQuery}&rdquo;</p>
              <p className="font-mono text-[12px] text-white/35 mt-3">Try a broader search term, or pick a category above.</p>
            </div>
          ) : (
            <div className="space-y-16 lg:space-y-24 max-w-4xl">
              {filteredCategories.map(category => {
                const Icon = category.icon;
                return (
                  <div key={category.id} id={category.id}>
                    <div className="flex items-start gap-4 mb-8">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ background: 'rgba(74, 234, 188, 0.08)', border: '1px solid rgba(74, 234, 188, 0.2)' }}>
                        <Icon className="w-4 h-4 text-em" strokeWidth={1.9} />
                      </div>
                      <div>
                        <h2 className="font-display font-medium text-white tracking-tight" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                          {category.name}
                        </h2>
                        <p className="text-[14px] text-white/50 mt-2">{category.description}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {category.faqs.map((faq, i) => (
                        <details key={i} className="group border-b border-white/[0.06] hover:bg-white/[0.012] transition-colors">
                          <summary className="flex items-start justify-between gap-6 py-5 cursor-pointer select-none">
                            <span className="font-display text-[16px] sm:text-[17px] text-white/90 leading-snug font-medium">{faq.q}</span>
                            <Plus className="w-4 h-4 text-white/30 shrink-0 mt-1.5 transition-transform duration-300 group-open:rotate-45" />
                          </summary>
                          <div className="pb-5 pr-10 -mt-1">
                            <p className="text-[14px] text-white/55 leading-relaxed">{faq.a}</p>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink canvas-dot py-32 lg:py-40 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <div ref={r2} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Still have questions?</p>
            <h2 className="t-h1 text-white">Email us. A person reads it.</h2>
            <p className="t-body mt-7 max-w-lg">
              <a href="mailto:support@myvoiceaiconnect.com" className="text-em underline-offset-4 hover:underline">support@myvoiceaiconnect.com</a> — a team member responds within one business day.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/signup" className="btn btn-em">Start free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              <Link href="/interactive-demo" className="btn btn-ghost-dark">Watch demo <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}