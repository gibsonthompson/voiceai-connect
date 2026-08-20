'use client';

import Link from 'next/link';
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowUpRight, ArrowRight, Search, Plus, X,
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
      { q: 'What is VoiceAI Connect?', a: 'VoiceAI Connect is a complete white-label platform that lets you resell AI receptionists under your own brand. We provide the technology, AI voice agents that answer phone calls 24/7, and you sell it to local businesses as your own product. Your clients never see our name; everything is branded as your company.' },
      { q: 'Do I need any technical skills or coding experience?', a: "No technical skills are required whatsoever. If you can upload a logo and fill out a form, you can set up your agency. The entire platform is designed for non-technical users. There's no coding, no server management, and no complex configuration. Most agencies complete setup in under 30 minutes." },
      { q: 'How long does it take to set up my agency?', a: 'Most agencies complete the full setup process in 15-30 minutes. This includes creating your account, uploading your branding, connecting Stripe for payments, and customizing your marketing site. You can be ready to start selling the same day you sign up.' },
      { q: 'What do I need to get started?', a: "You need three things: (1) An email address to create your account, (2) Your logo and brand colors for customization, and (3) A Stripe account to receive payments from clients. If you don't have a Stripe account yet, you can create one for free during setup (it takes about 5 minutes)." },
      { q: 'Is there a free trial?', a: "Yes. The Free plan has no platform fee at all, so you can start immediately with no credit card required. For Pro and Scale plans, we offer a 14-day free trial with full access to all features. You can set up your branding, explore the platform, and even onboard test clients before committing." },
      { q: 'Can I try the AI before signing up?', a: 'Absolutely. We have a public demo phone number you can call anytime to experience the AI receptionist firsthand. Additionally, once you sign up, Pro and Scale plans include a branded demo number for your own agency that you can share with potential clients.' },
      { q: 'What happens after my free trial ends?', a: "At the end of your 14-day trial, your subscription will begin at your chosen plan level. If you decide VoiceAI Connect isn't right for you, simply cancel before the trial ends and you won't be charged. There's no commitment and no cancellation fees. The Free plan has no trial because there's no fee to trial against, it's free forever." },
    ],
  },
  {
    id: 'pricing-billing',
    name: 'Pricing & Billing',
    icon: DollarSign,
    description: 'Plans, payments, and how you make money',
    faqs: [
      { q: 'How much does VoiceAI Connect cost?', a: 'We offer three plans. The Free plan has zero platform fee, you pay $29.99 per client per month plus $0.12 per minute of voice usage. The Pro plan at $99/month includes full white-label branding, a marketing website, and a demo phone line with reduced rates at $9.99 per client and $0.10 per minute. The Scale plan at $499/month eliminates per-client fees entirely at just $0.05 per minute. Pro and Scale both include a 14-day free trial. Google Calendar integration is included on every plan.' },
      { q: "What's the difference between the plans?", a: 'The Free plan lets you start with no risk, you only pay per-client and per-minute fees. Pro ($99/mo) adds full white-label branding, custom domain, a marketing website with an AI demo phone line, the lead generation CRM, and team member access. Scale ($499/mo) includes everything in Pro plus AI Lab with industry prompt templates, unlimited team members, Bring Your Own Twilio support, and priority support.' },
      { q: 'Do you take a percentage of my client revenue?', a: "No, never. We charge a flat monthly platform fee plus usage-based pricing. If you charge 50 clients $149/month each, that's $7,450/month going directly to your Stripe account. We only collect our platform and usage fees separately." },
      { q: 'How do payments work? How do I get paid?', a: "You connect your own Stripe account during setup. When your clients subscribe through your branded signup page, payments go directly to your Stripe account, not to us. You set your own prices ($99, $149, $299, whatever you want) and keep 100% of what you charge." },
      { q: 'Can I change my plan later?', a: 'Yes, you can upgrade or downgrade at any time. When upgrading, you get immediate access to new features and the prorated difference is charged. When downgrading, the change takes effect at your next billing cycle.' },
      { q: 'Can I charge my clients a one-time setup fee?', a: "Yes. In your agency Settings under Pricing, you can set an optional one-time setup fee (for example $299) that new clients pay on top of their monthly plan. It is collected through your own Stripe account, so you keep 100 percent of it, and it appears as its own line on the client's checkout. The fee lands on the client's first paid invoice: right away for a client who signs up without a trial, or at the end of the 7-day trial (billed with their first month) if you require a card for trials. Leave it at zero for no setup fee." },
      { q: 'How much can I realistically charge my clients?', a: "Most agencies charge between $99-299/month per client, with the sweet spot around $149/month. Some agencies targeting premium markets (medical, legal) charge $299-499/month. A single missed call can cost a business $500+, and a full-time human receptionist runs $3,000+/month, so $149/month for 24/7 AI coverage is a straightforward sell." },
      { q: "What's the ROI potential?", a: "On the Pro plan ($99/mo), if you sign 20 clients at $149/month, that's $2,980/month in client revenue minus your $99 platform fee and $9.99 x 20 in per-client fees ($199.80), which is roughly $2,681/month profit. At 50 clients the math gets even better. On the Scale plan, there are no per-client fees at all, so your margin compounds as you grow." },
      { q: 'Do my clients get a free trial too?', a: "Yes. Every plan includes a 7-day free trial for the businesses you onboard. When a local business signs up through your branded page, they get seven days of full AI receptionist service before their first billing cycle begins. This gives your clients a risk-free way to experience the product, which increases your conversion rate significantly." },
    ],
  },
  {
    id: 'white-label',
    name: 'White-Labeling & Branding',
    icon: Building2,
    description: 'How your brand stays front and center',
    faqs: [
      { q: 'What exactly is white-labeled?', a: "Everything your clients see is branded as your company: the marketing website, signup pages, client dashboard, email notifications, SMS messages, invoices, and even the AI's greeting. VoiceAI Connect is completely invisible to your clients, they only see your brand." },
      { q: 'Can I use my own domain name?', a: "Yes, on Pro and Scale plans. You can use your own domain (e.g., app.youragency.com) for both your marketing site and client dashboards. On the Free plan, you'll use a subdomain." },
      { q: 'What branding elements can I customize?', a: "You can customize your logo, favicon, primary and accent colors, agency name, tagline, contact information, and all marketing copy on your site. You can also customize email templates and the AI's greeting scripts to match your brand voice." },
      { q: 'Will my clients ever see VoiceAI Connect mentioned anywhere?', a: "No. From your clients' perspective, VoiceAI Connect doesn't exist. The only place our name appears is in your agency dashboard (which only you see) and in your contract with us. Your clients will think you built the technology yourself." },
      { q: 'On the Free plan, where does VoiceAI Connect branding appear?', a: "On Free the platform is not white-labeled, so VoiceAI Connect branding appears in the surfaces you and your clients log in to and get alerts from: your agency dashboard, your clients' dashboards, the sign-up pages (which sit on a VoiceAI Connect subdomain instead of your own domain), and the per-call notifications your clients receive (the call-summary text and email). What your clients' own customers experience is never VoiceAI-branded on any plan: the AI answers each call as the client's business, texts to callers come from the client's own number, and appointments book into the calendar under the business's name. Upgrading to Pro or Scale white-labels all of those log-in and notification surfaces under your own brand and domain." },
      { q: 'Can I have different branding for different client segments?', a: 'The platform supports one brand identity per agency account. If you want to operate multiple brands (e.g., one for dental offices, another for law firms), you would need separate agency accounts, each with their own subscription.' },
    ],
  },
  {
    id: 'ai-technology',
    name: 'AI Technology',
    icon: Bot,
    description: 'How the AI receptionist works',
    faqs: [
      { q: 'How does the AI receptionist work?', a: "When someone calls your client's AI number, our system answers within milliseconds using state-of-the-art conversational AI. The AI can have natural conversations, answer questions about the business using its knowledge base, capture caller information, detect spam, recognize returning callers by phone number, and book appointments directly to Google Calendar." },
      { q: 'How natural does the AI sound?', a: "Very natural. We use premium ElevenLabs voices with multiple voice options per client: male, female, different accents and speaking styles. The AI uses natural speech patterns, appropriate pauses, and handles interruptions gracefully. Most callers don't realize they're talking to an AI." },
      { q: "How does the AI know about each client's business?", a: 'When a client signs up, the system can automatically scan their website to build a knowledge base. But a website isn\'t required, clients can manually configure everything from their "My Business" tab: services with pricing and duration, staff members, business hours, FAQs, and additional information. Manual entries always supplement or override any scanned content.' },
      { q: "Can clients configure the AI's personality and behavior?", a: 'Yes. From the AI Agent tab in their dashboard, clients can select a voice, customize the greeting message, choose a tone (professional, friendly, casual, or clinical), and configure tools like caller recognition, spam detection, and call transfer rules. From the My Business tab, they manage services, staff, hours, and the knowledge base that shapes what the AI knows.' },
      { q: "What happens if the AI can't answer a question?", a: "The AI is trained to handle unknown situations gracefully. It will acknowledge that it doesn't have that specific information and offer to take a message or have someone call back. It never makes up information or provides inaccurate answers." },
      { q: 'Can the AI transfer calls to a human?', a: "Yes. The AI can transfer urgent calls to the business owner's phone number. Agencies and clients can configure priority rules, for example, transfer immediately if someone mentions an emergency, a specific keyword, or is a VIP caller. If the transfer goes unanswered, the AI stays on the line and takes a message instead of sending the caller to voicemail." },
      { q: 'Does the AI support Spanish?', a: 'Yes, fully, on every plan, with no configuration required. The AI automatically detects when a caller speaks Spanish and switches to Spanish for the entire conversation using Deepgram nova-2 real-time language detection. It collects all information in Spanish and sends the business owner a summary in English. This works for English and Spanish today, with additional languages on the roadmap.' },
      { q: 'How does the AI handle multiple calls at once?', a: 'The AI handles unlimited simultaneous calls. Unlike a human receptionist who can only answer one call at a time, the AI scales instantly. During peak hours, every caller gets answered immediately: no busy signals, no hold times. This is one of the strongest selling points for businesses with high call volume.' },
      { q: 'Does the AI filter spam and robocalls?', a: "Yes, automatically, on every plan. The AI detects telemarketers, robocalls, and solicitors and ends those calls immediately. Spam calls are not counted against the client's monthly limit. Business owners receive a notification when spam is blocked. No configuration is required." },
      { q: 'Is the AI available 24/7?', a: 'Yes. The AI answers calls 24 hours a day, 7 days a week, 365 days a year. It never sleeps, never takes breaks, and never calls in sick. Clients can also configure after-hours behavior separately, for example, a different greeting and message-only mode outside business hours.' },
    ],
  },
  {
    id: 'calendar-booking',
    name: 'Calendar & Booking',
    icon: CreditCard,
    description: 'Appointment scheduling and service-specific rules',
    faqs: [
      { q: 'How does appointment booking work?', a: "The AI connects to Google Calendar. When a caller wants to book, the AI checks real-time availability, offers open slots, collects the caller's information, and creates the calendar event automatically, all during the live call. The event includes the caller's name, phone number, service type, and any notes. Google Calendar integration is included on every plan, including Free." },
      { q: 'Can I set different booking rules per service?', a: 'Yes. From the My Business tab, clients define structured services with individual settings: name, duration (e.g., 30 min for a cleaning, 60 min for a deep clean), buffer time between appointments, and a booking mode per service. Some services can be booked directly by the AI, others can be set to "collect request" mode where the AI gathers the caller\'s preferred time and has the office confirm, and others can be marked as not bookable by phone at all.' },
      { q: 'Can the AI route bookings to specific staff or providers?', a: "Yes. Clients can add staff members with names, roles, and availability in the My Business tab. When a caller wants to book, the AI asks if they have a preferred provider. The staff member's name is included in the calendar event title and details so the business knows who the appointment is with." },
      { q: "What if a client doesn't want the AI to book directly?", a: "Clients can set their booking mode to \"collect request\" at the business level or per individual service. In this mode, the AI collects the caller's name, phone number, preferred date and time, and what service they need, then lets them know someone from the office will call to confirm. No calendar events are created. This is common for medical, legal, and high-touch service businesses." },
      { q: 'Does booking work with calendars other than Google?', a: 'Google Calendar is the primary integration today. Since Google Calendar syncs natively with most CRMs and scheduling platforms (HubSpot, Salesforce, Calendly, etc.), appointments booked by the AI flow through automatically to connected tools.' },
    ],
  },
  {
    id: 'call-forwarding',
    name: 'Call Forwarding & Setup',
    icon: PhoneForwarded,
    description: 'How to route calls to your AI receptionist',
    faqs: [
      { q: 'How do calls get to the AI?', a: "There are three options. (1) Forward your existing business number to the AI number using your phone's call forwarding, so callers dial the same number they always have. (2) Use the AI number directly as your business number on your website, ads, and cards. (3) A hybrid approach: forward when you're busy or on a job, answer directly when you're available." },
      { q: 'How do I set up call forwarding?', a: "The simplest method is unconditional forwarding. On most carriers, dial *72, then the AI phone number, and press call. You'll hear a confirmation tone. To turn it off, dial *73. This works on AT&T, Verizon, T-Mobile, and most landline providers. Some carriers have slightly different codes, check your carrier's support page or call them and ask to set up call forwarding to a specific number." },
      { q: "Can I forward calls only when I don't answer?", a: 'Yes, this is called conditional forwarding. Your phone rings first, and if you don\'t pick up within a set number of rings, the call forwards to the AI. The platform also supports a built-in "Fallback" mode: the AI transfers to your phone first, and if you don\'t answer, the AI takes over, with no carrier-level forwarding needed.' },
      { q: 'Carrier-specific forwarding codes', a: "AT&T: *72 to activate, *73 to deactivate. Verizon: *72 to activate, *73 to deactivate. T-Mobile: *72 to activate, *73 to deactivate (or use the T-Mobile app under Call Settings). Spectrum/landline: *72 to activate, *73 to deactivate. Google Voice: Settings, Calls, Call Forwarding. For any carrier not listed, call their support line and say \"I need to set up call forwarding to this number\" and give them the AI phone number." },
      { q: 'Do my clients need a website for this to work?', a: "No. Clients just need a phone number. They forward their existing business line to the AI number, or use the AI number directly. There is nothing to install, no website required, and no technical setup on their end. If they do have a website, the AI can scan it automatically to learn about their business, but it's entirely optional." },
      { q: 'Can one client have multiple phone numbers?', a: 'Yes, clients can have multiple AI numbers if needed, for example, different numbers for different locations or departments. Each additional number can be provisioned through the platform.' },
    ],
  },
  {
    id: 'client-features',
    name: 'Client Dashboard & Features',
    icon: Users,
    description: 'What your end clients get access to',
    faqs: [
      { q: 'What does the client dashboard include?', a: "Clients get a fully branded dashboard organized into seven tabs: Dashboard (stats and overview), Calls (recordings, transcripts, AI summaries), Messages (two-way SMS with callers), Contacts (caller history and notes), My Business (services, staff, hours, knowledge base), AI Agent (voice, greeting, tone, tools configuration), and Settings (account, calendar, billing). Everything is themed to your agency's brand." },
      { q: 'Can agencies control what clients see in the dashboard?', a: "Yes. Agencies can set dashboard access per client to full access, read-only (can see calls and data but can't change settings), or no access (the agency manages everything on their behalf). You can also grant team members within a client's account specific permissions." },
      { q: 'How do call notifications work?', a: "Right after each call, the business owner gets a text message with the key details: who called, why they called, the AI's summary, and how urgent it is. An email summary with the full details and a transcript preview is sent as well. So you can tell at a glance whether you need to call back right away or if it can wait. Demo and admin calls also send summaries." },
      { q: 'Can clients text callers back through the platform?', a: "Yes. From the Messages tab or directly from a call detail page, business owners can send text messages to callers. The SMS is sent from the same AI phone number the caller recognizes. When the caller replies, it appears in the Messages tab as a threaded conversation, just like iMessage. This means business owners never need to share their personal phone number." },
      { q: 'Can clients export their data?', a: 'Yes. Clients can export call logs (with transcripts, summaries, duration, and caller info), contacts, and analytics data as CSV files directly from their dashboard. Agency owners can also export data across all clients from the agency dashboard.' },
      { q: 'What kind of analytics do clients get?', a: 'Clients can see call volume trends, peak calling hours, common reasons people call, average call duration, spam vs. legitimate call ratios, and conversion metrics. The dashboard overview shows calls this month, new contacts, and key activity at a glance.' },
      { q: "Can clients customize their AI's behavior?", a: 'Yes. From the AI Agent tab, clients choose their AI\'s voice, customize the greeting message, select a conversation tone (professional, friendly, casual, or clinical), set booking mode preferences, and configure tools like caller recognition, spam detection, and call transfer. From My Business, they manage services, staff, hours, and everything the AI references on calls.' },
      { q: 'Is there a mobile app for clients?', a: 'The client dashboard is a web app that works in any phone or computer browser, with nothing to download from an app store. It is fully responsive and clients can add it to their home screen in one tap for an app-like experience. SMS and email notifications work on all devices.' },
    ],
  },
  {
    id: 'medical-practices',
    name: 'Medical & High-Trust Practices',
    icon: Stethoscope,
    description: 'How the AI handles healthcare and other sensitive calls',
    faqs: [
      { q: 'Can I use this for a medical, dental, or other healthcare practice?', a: 'Yes. Healthcare offices use it to answer calls, take messages, and handle scheduling. The AI is set up to collect only scheduling information: the caller\'s name, phone number, whether they are a new or existing patient, and a general reason for the visit (for example "checkup," "follow-up," or "new patient appointment"). It is instructed not to ask about or discuss specific medical details. If a caller starts sharing medical information, the AI redirects: "Our provider can go over that at your appointment."' },
      { q: 'How does the AI handle medical emergencies?', a: "The AI is trained to recognize emergency language (difficulty breathing, severe pain, chest pain, etc.) and immediately directs the caller to call 911 or go to the nearest emergency room. It does not provide medical advice. For urgent but non-emergency situations, it collects the caller's information and notifies the practice owner immediately via SMS." },
      { q: 'Can the AI tell new patients from returning ones?', a: 'Yes. The AI asks "Are you a current patient or would this be your first visit?" and adjusts the conversation accordingly. With caller recognition enabled, it can also look up returning callers by phone number and greet them by name.' },
      { q: 'What about insurance questions?', a: 'Clients add their accepted insurance carriers to the knowledge base. The AI can answer "Do you accept Blue Cross?" using that information. For specific coverage or benefits questions, it redirects: "Coverage depends on your specific plan. Our billing team can verify your benefits, would you like me to take your information so they can reach out?"' },
      { q: 'Is call data used to train AI models?', a: "No. Call recordings, transcripts, and conversation data are never used to train AI models. Your clients' call data stays private and is only accessible to the client and the agency that manages their account." },
    ],
  },
  {
    id: 'phone-numbers',
    name: 'Phone Numbers & Telephony',
    icon: Phone,
    description: 'Number provisioning, international, and routing',
    faqs: [
      { q: 'How do phone numbers work?', a: 'Each client gets a dedicated phone number provisioned automatically within seconds of signup. By default, numbers are US local numbers through Telnyx with no A2P registration delay. The number is ready to receive calls and send/receive SMS immediately.' },
      { q: 'Are international numbers available?', a: "Yes. The default integration uses Telnyx for US numbers. For UK, Canadian, or other international numbers, agencies on the Scale plan can connect their own Twilio account. The platform routes calls through Twilio automatically for those clients, and the AI behavior, dashboards, and billing all work identically." },
      { q: 'Can VoiceAI Connect be used from outside the US?', a: 'Yes. The platform is available globally. Agency operators in any country can sign up and run a workspace. End-client coverage is available in the US, UK, and Canada. An operator based in India, the Philippines, or anywhere else can run a US-focused agency remotely. Stripe Connect supports payouts to most major countries.' },
      { q: 'Can I create a demo number if my agency is outside the US?', a: "Yes. US agencies get a demo number automatically on the platform's own telephony, chosen by area code. For agencies outside the US, the demo number is created on your own connected Twilio account. You connect Twilio in Settings first, then create the demo line, and the platform provisions a local number in your country and points it at your AI demo." },
      { q: 'Do I need a paid Twilio account for an international demo number?', a: "Yes. Twilio does not allow trial accounts to provision numbers automatically, so your Twilio account needs to be upgraded to a paid account before the platform can create your international demo number. US demo numbers do not need this, they run on the platform's own telephony." },
      { q: 'Do I need a regulatory bundle for a non-US demo number?', a: "Often, yes. Many countries, including the UK, require an approved Twilio regulatory bundle with a registered address before a number can be activated. You set this up in your Twilio Console under Regulatory Compliance before creating the number, and approval can take a little time, so start it early. If the bundle is not in place, Twilio refuses the number and the platform tells you exactly why." },
      { q: 'Do I buy the Twilio number myself?', a: "No. Once your Twilio account is connected and eligible, the platform searches for and provisions the number for you when you create the demo. You do not search for or purchase a number manually." },
      { q: 'Who pays for the Twilio number, calls, and texts?', a: "When you connect your own Twilio account for international numbers, Twilio bills you directly for the number, call minutes, and SMS at Twilio's own rates. VoiceAI Connect does not add any markup or separate international surcharge on top of that. Your VoiceAI Connect charges stay exactly what your plan describes (platform fee, per-client, and per-minute usage), the same as they are for US numbers." },
      { q: 'What happens if the AI system goes down?', a: "The platform runs on redundant infrastructure with high uptime. In the rare event of an outage, calls can be configured to automatically forward to a backup number (like the client's cell phone) so no calls are lost." },
    ],
  },
  {
    id: 'getting-clients',
    name: 'Getting Clients',
    icon: Users,
    description: 'How to grow your agency',
    faqs: [
      { q: 'How do I get my first clients?', a: 'The most effective methods are: (1) Cold email outreach to local businesses using our provided templates, (2) LinkedIn messaging to business owners, (3) Facebook and Instagram ads targeting local business owners, and (4) Letting prospects call your AI demo line, since once they experience it firsthand, they typically convert without a sales call. The platform also includes a built-in lead generation CRM with Google Maps prospecting and 13 pre-written outreach email templates.' },
      { q: 'What types of businesses make the best clients?', a: "Businesses that get lots of phone calls, can't afford a full-time receptionist, lose money when calls go unanswered, and need 24/7 coverage. This includes plumbers, HVAC contractors, electricians, dentists, chiropractors, lawyers, real estate agents, auto shops, salons, medical practices, restaurants, and veterinarians." },
      { q: 'How do I explain this to potential clients?', a: 'Focus on the problem, not the technology. Say: "You know how you miss calls when you\'re on a job site? And how a missed call can cost you $500 or more? I have a solution that answers every call 24/7, takes messages, and can even book appointments, for less than the cost of one missed job per month." Then let them try your demo line.' },
      { q: 'Can I offer free trials to potential clients?', a: 'Yes, and we recommend it. Every plan includes a 7-day free trial for the businesses you onboard. Once they see missed calls drop to zero and experience the convenience, they almost always convert.' },
      { q: 'How quickly can I expect to be profitable?', a: "Most agencies become profitable within the first month. On the Free plan, there's no platform fee, so you're profitable with your first client. On Pro ($99/mo), two clients at $99+ makes you profitable. The fastest agencies sign their first paying client within 1-2 weeks of launching." },
      { q: 'Can agencies use their own website instead of the included marketing site?', a: 'Yes. The platform provides a white-label marketing site automatically, but agencies can use their own website for marketing and lead generation instead. Your client sign-up flow is a public link, so agencies can point to the /get-started page from any external site. The included marketing site is optional, and many agencies use both.' },
    ],
  },
  {
    id: 'data-integrations',
    name: 'Data & Integrations',
    icon: Code,
    description: 'Data export and connecting other tools',
    faqs: [
      { q: 'What data export options are available?', a: 'Call logs (with transcripts, AI summaries, duration, and caller info), contacts, and analytics data can all be exported as CSV files. Both clients and agencies can export from their respective dashboards. Agency-level exports cover all clients in one download.' },
      { q: 'What integrations are available?', a: 'Google Calendar for appointment booking (on every plan) and Stripe Connect for payments. Since Google Calendar syncs natively with tools like HubSpot, Salesforce, and Calendly, appointments the AI books can flow through to those systems automatically.' },
      { q: 'Does the platform support two-way SMS?', a: "Yes. Business owners can text callers directly from the Messages tab in their dashboard. Messages are sent from the same AI phone number the caller recognizes. When callers reply, the response appears as a threaded conversation. Business owners also receive an SMS notification when a caller texts back." },
      { q: 'What about website chat or other channels?', a: 'VoiceAI Connect is purpose-built for voice and phone calls, which is where most small businesses lose the most revenue. Website chat and other channels are not currently supported.' },
    ],
  },
  {
    id: 'security',
    name: 'Security & Privacy',
    icon: Shield,
    description: 'Data security and privacy',
    faqs: [
      { q: 'Is my data secure?', a: 'Yes, security is a top priority. All data is encrypted at rest and in transit. We use Supabase with Postgres row-level security, so agencies and clients can only access their own data. Infrastructure runs on enterprise cloud providers, and PII is kept out of application logs.' },
      { q: 'Where is data stored?', a: 'Data is stored in secure data centers in the United States with redundant backups on enterprise-grade cloud infrastructure.' },
      { q: 'Is call data used to train AI models?', a: 'No. Call recordings, transcripts, and conversation data are never used to train AI models. Call data is private and only accessible to the client and their managing agency.' },
      { q: 'Can call recordings be turned off?', a: "Yes. Recording behavior is configurable per client. When recordings are turned off, AI summaries and SMS notifications still function, so the caller's information is captured without storing the audio file." },
    ],
  },
  {
    id: 'support',
    name: 'Support & Success',
    icon: Headphones,
    description: 'How we help you succeed',
    faqs: [
      { q: 'What kind of support do you offer?', a: 'Every plan includes email support at support@myvoiceaiconnect.com and an in-dashboard support widget that answers common questions and lets you reach the team directly. Scale plans add priority support with faster response times. All plans include access to documentation and onboarding resources.' },
      { q: 'Do you help with onboarding?', a: 'Yes. All plans include onboarding documentation and video tutorials. The setup flow walks you through branding, pricing, connecting Stripe, and adding your first client step by step.' },
      { q: 'What if my clients have technical issues?', a: "You handle client support to maintain your white-label positioning. For technical issues you can't resolve, reach the team through the in-dashboard support widget or email on behalf of your clients. We work with you behind the scenes to resolve issues quickly, and your clients never interact with us directly." },
      { q: "How do I request a feature or send feedback?", a: 'Open Settings and use the Feedback option to send a feature request, or use the in-dashboard support widget to reach the team directly. We ship new features regularly based on what agencies ask for.' },
    ],
  },
  {
    id: 'account',
    name: 'Account & Policies',
    icon: Settings,
    description: 'Account management and policies',
    faqs: [
      { q: 'How do I cancel my subscription?', a: 'You can cancel anytime from your dashboard settings with no cancellation fees. When you cancel, you retain access until the end of your current billing period. Your clients continue to work until then, giving you time to transition them if needed.' },
      { q: 'What happens to my clients if I cancel?', a: "When you cancel, your clients lose access to the AI receptionist at the end of your billing period. We recommend giving them advance notice. We don't directly contact your clients, that relationship is yours." },
      { q: 'Can I get a refund?', a: "We offer a 14-day free trial so you can evaluate the platform before paying. After your trial, subscriptions are non-refundable, but you can cancel anytime to stop future charges. If you have concerns, contact us, we want you to succeed." },
      { q: "What happens if I don't pay my bill?", a: "If a payment fails, we notify you and retry the charge. You have a 7-day grace period to update your payment method. After that, your account will be suspended and your clients' AI receptionists will stop answering calls. Once you update payment, service resumes immediately." },
    ],
  },
];

// ============================================================================
// SEARCH SCORING
// ============================================================================
interface ScoredFAQ {
  q: string; a: string; categoryId: string; categoryName: string; CategoryIcon: any; score: number;
}

function scoreFAQ(faq: { q: string; a: string }, query: string): number {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 1);
  let score = 0;
  if (faq.q.toLowerCase().includes(q)) score += 100;
  if (faq.a.toLowerCase().includes(q)) score += 30;
  for (const word of words) {
    if (faq.q.toLowerCase().includes(word)) score += 15;
    if (faq.a.toLowerCase().includes(word)) score += 3;
  }
  return score;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return text;
  const regex = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    words.some(w => part.toLowerCase() === w)
      ? <mark key={i} className="bg-transparent text-em font-medium">{part}</mark>
      : part
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const r1 = useInView();
  const r2 = useInView();
  const isSearching = searchQuery.trim().length > 1;

  const searchResults = useMemo((): ScoredFAQ[] => {
    if (!isSearching) return [];
    const results: ScoredFAQ[] = [];
    for (const cat of faqCategories) {
      for (const faq of cat.faqs) {
        const score = scoreFAQ(faq, searchQuery);
        if (score > 0) results.push({ ...faq, categoryId: cat.id, categoryName: cat.name, CategoryIcon: cat.icon, score });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }, [searchQuery, isSearching]);

  const browsedCategories = useMemo(() => {
    if (isSearching) return [];
    if (activeCategory) return faqCategories.filter(c => c.id === activeCategory);
    return faqCategories;
  }, [activeCategory, isSearching]);

  const totalQuestions = faqCategories.reduce((sum, cat) => sum + cat.faqs.length, 0);

  return (
    <main className="min-h-screen bg-ink">
      <MarketingNav />

      <section className="canvas-dot relative pt-40 lg:pt-48 pb-16 lg:pb-20 overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
          <div ref={r1} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-7">Frequently asked questions</p>
            <h1 className="t-h1 text-white max-w-[14ch]">Your questions, answered.</h1>
            <p className="t-body mt-7 max-w-xl text-[1rem]">
              {totalQuestions} answers across {faqCategories.length} categories. Search or browse below.
            </p>
            <div className="mt-9 relative max-w-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
              <input type="text" value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.trim().length > 1) setActiveCategory(null); }}
                placeholder="Search questions and answers..."
                className="w-full pl-12 pr-12 py-4 rounded-full bg-white/[0.025] border border-white/[0.08] text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.25] transition-colors font-display" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-white/[0.08] hover:bg-white/[0.15] transition-colors">
                  <X className="w-3 h-3 text-white/60" />
                </button>
              )}
            </div>
            {isSearching && (
              <p className="mt-4 font-mono text-[12px] tracking-wide text-white/40">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        </div>
      </section>

      {!isSearching && (
        <section className="bg-ink border-y border-white/[0.05] py-5 sticky top-16 z-30 backdrop-blur-xl" style={{ background: 'rgba(5, 5, 5, 0.85)' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => setActiveCategory(null)}
                className={`px-4 py-2 rounded-full font-mono text-[11px] tracking-[0.12em] uppercase whitespace-nowrap border transition-colors ${activeCategory === null ? 'bg-white text-black border-white' : 'bg-transparent text-white/55 border-white/[0.12] hover:border-white/30 hover:text-white'}`}>
                All &middot; {totalQuestions}
              </button>
              {faqCategories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`px-4 py-2 rounded-full font-mono text-[11px] tracking-[0.12em] uppercase whitespace-nowrap border transition-colors ${activeCategory === cat.id ? 'bg-white text-black border-white' : 'bg-transparent text-white/55 border-white/[0.12] hover:border-white/30 hover:text-white'}`}>
                  {cat.name} &middot; {cat.faqs.length}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-ink py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          {isSearching && (
            <>
              {searchResults.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-display text-[20px] text-white/65">No matches for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="font-mono text-[12px] text-white/35 mt-3">Try different keywords or <button onClick={() => setSearchQuery('')} className="text-em hover:underline underline-offset-4">browse all categories</button>.</p>
                </div>
              ) : (
                <div className="max-w-4xl space-y-1">
                  {searchResults.map((result, i) => {
                    const Icon = result.CategoryIcon;
                    return (
                      <details key={`${result.categoryId}-${i}`} open={i < 3} className="group border-b border-white/[0.06] hover:bg-white/[0.012] transition-colors">
                        <summary className="flex items-start justify-between gap-4 py-5 cursor-pointer select-none">
                          <div className="flex-1 min-w-0">
                            <span className="font-display text-[16px] sm:text-[17px] text-white/90 leading-snug font-medium block">
                              {highlightText(result.q, searchQuery)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.02]">
                              <Icon className="w-3 h-3 text-em" strokeWidth={2} />
                              <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-white/40">{result.categoryName}</span>
                            </span>
                          </div>
                          <Plus className="w-4 h-4 text-white/30 shrink-0 mt-1.5 transition-transform duration-300 group-open:rotate-45" />
                        </summary>
                        <div className="pb-5 pr-10 -mt-1">
                          <p className="text-[14px] text-white/55 leading-relaxed">{highlightText(result.a, searchQuery)}</p>
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!isSearching && (
            <>
              {browsedCategories.length === 0 ? (
                <div className="text-center py-20">
                  <p className="font-display text-[20px] text-white/65">No categories match</p>
                </div>
              ) : (
                <div className="space-y-16 lg:space-y-24 max-w-4xl">
                  {browsedCategories.map(category => {
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
            </>
          )}
        </div>
      </section>

      <section className="bg-ink canvas-dot py-32 lg:py-40 border-t border-white/[0.04] relative overflow-hidden">
        <div className="hero-aurora" />
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
          <div ref={r2} className="fade-up max-w-3xl">
            <p className="t-eyebrow text-em mb-6">Still have questions?</p>
            <h2 className="t-h1 text-white">Email us. A person reads it.</h2>
            <p className="t-body mt-7 max-w-lg">
              <a href="mailto:support@myvoiceaiconnect.com" className="text-em underline-offset-4 hover:underline">support@myvoiceaiconnect.com</a>, a team member responds within one business day.
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