// lib/support-kb.ts
// Structured knowledge base for the support widget
// Used for: (1) client-side FAQ search, (2) AI chatbot system context

export interface KBArticle {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  userType: 'agency' | 'client' | 'both';
}

export const KB_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', icon: 'Rocket' },
  { id: 'plans-pricing', label: 'Plans & Pricing', icon: 'CreditCard' },
  { id: 'billing', label: 'Billing & Payments', icon: 'Receipt' },
  { id: 'clients', label: 'Managing Clients', icon: 'Users' },
  { id: 'ai-lab', label: 'AI Lab & Configuration', icon: 'FlaskConical' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: 'BookOpen' },
  { id: 'phone-telephony', label: 'Phone Numbers', icon: 'Phone' },
  { id: 'branding', label: 'White-Label & Branding', icon: 'Palette' },
  { id: 'leads-outreach', label: 'Leads & Outreach', icon: 'Target' },
  { id: 'team', label: 'Team Members', icon: 'UserPlus' },
  { id: 'calls', label: 'Call Handling', icon: 'PhoneCall' },
  { id: 'integrations', label: 'Integrations', icon: 'Calendar' },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: 'Wrench' },
];

export const KB_ARTICLES: KBArticle[] = [
  // ── GETTING STARTED ─────────────────────────────────────────────
  {
    id: 'what-is-voiceai',
    category: 'getting-started',
    question: 'What is VoiceAI Connect?',
    answer: 'VoiceAI Connect is a white-label AI receptionist platform built for agencies and resellers. You brand the product as your own, onboard local businesses as clients, and collect monthly recurring revenue. The platform handles all the infrastructure — voice AI, phone numbers, billing, dashboards — so you focus on sales.',
    keywords: ['what', 'about', 'platform', 'overview', 'explain'],
    userType: 'both',
  },
  {
    id: 'how-to-signup',
    category: 'getting-started',
    question: 'How do I create an agency account?',
    answer: 'Go to myvoiceaiconnect.com/signup. Enter your name, email, and agency name. No credit card is required. You start on the Free plan with full access to core features and can upgrade anytime from Settings > Billing.',
    keywords: ['signup', 'register', 'create', 'account', 'start', 'join'],
    userType: 'agency',
  },
  {
    id: 'after-signup',
    category: 'getting-started',
    question: 'What should I do after signing up?',
    answer: 'After signup you land in your agency dashboard. Start by: (1) Creating a test client to explore the platform, (2) Uploading your logo and brand colors in Settings > Profile, (3) Setting your client pricing in Settings > Pricing, (4) Connecting Stripe in Settings > Payments to receive client payments, and (5) Turning on Demo Mode in Settings to see the platform with realistic sample data.',
    keywords: ['first', 'steps', 'setup', 'onboarding', 'next', 'started'],
    userType: 'agency',
  },
  {
    id: 'test-client',
    category: 'getting-started',
    question: 'What is a test client?',
    answer: 'A test client is automatically created when you sign up so you can explore the platform without affecting real data. It has a working AI assistant you can call and configure. It uses the home services industry template by default.',
    keywords: ['test', 'demo', 'sample', 'try', 'explore', 'sandbox'],
    userType: 'agency',
  },
  {
    id: 'try-before-commit',
    category: 'getting-started',
    question: 'Can I try the platform before committing?',
    answer: 'Yes. The Free plan requires no credit card and lets you add clients and configure AI receptionists. Pro and Scale plans include a 14-day free trial with no card required — you get full Scale-level access during the trial so you can experience every feature.',
    keywords: ['try', 'free', 'trial', 'test', 'demo', 'no credit card'],
    userType: 'agency',
  },

  // ── PLANS & PRICING ─────────────────────────────────────────────
  {
    id: 'plans-overview',
    category: 'plans-pricing',
    question: 'What plans are available?',
    answer: 'Three plans: Free ($0/mo platform, $29.99/client, $0.12/min), Pro ($99/mo platform, $9.99/client, $0.10/min — includes white-label, AI Lab, lead finder, marketing site, demo line, referrals, 5 team members), and Scale ($499/mo platform, $0/client, $0.05/min — everything in Pro plus unlimited team, BYOT, API access, priority support).',
    keywords: ['plans', 'pricing', 'cost', 'price', 'how much', 'tiers', 'free', 'pro', 'scale'],
    userType: 'agency',
  },
  {
    id: 'usage-billing',
    category: 'plans-pricing',
    question: 'How does usage-based billing work?',
    answer: 'You pay a flat monthly platform fee plus two usage charges: (1) a per-client fee for each active client, and (2) a per-minute fee for AI voice minutes across all clients. Your clients pay YOU whatever price you set — the difference is your profit. Free: $29.99/client + $0.12/min. Pro: $9.99/client + $0.10/min. Scale: $0/client + $0.05/min.',
    keywords: ['usage', 'billing', 'per minute', 'per client', 'cost', 'charges', 'metered'],
    userType: 'agency',
  },
  {
    id: 'my-cost-vs-client-price',
    category: 'plans-pricing',
    question: "What's the difference between what I pay and what my clients pay?",
    answer: 'You set your own client pricing in Settings > Pricing (e.g., $149/month per client). Your cost is the platform fee plus usage. For example, on Pro: you pay $99 platform + $9.99 per client + minutes. If you charge clients $149/month, the margin is yours — typically 80-96%.',
    keywords: ['margin', 'profit', 'revenue', 'earnings', 'cost', 'my price', 'client price'],
    userType: 'agency',
  },
  {
    id: 'change-plans',
    category: 'plans-pricing',
    question: 'Can I change plans?',
    answer: 'Yes. Go to Settings > Billing and use the upgrade cards or click "Manage Subscription." Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle.',
    keywords: ['change', 'switch', 'upgrade', 'downgrade', 'plan'],
    userType: 'agency',
  },
  {
    id: 'trial-ends',
    category: 'plans-pricing',
    question: 'What happens when my trial ends?',
    answer: 'After 14 days, your account reverts to the Free plan. You keep all your data and clients, but Pro/Scale features (white-label, AI Lab, lead finder, etc.) become locked behind an upgrade overlay. Subscribe to Pro or Scale from Settings > Billing to restore access.',
    keywords: ['trial', 'expires', 'end', 'after', 'revert', 'locked'],
    userType: 'agency',
  },
  {
    id: 'second-trial',
    category: 'plans-pricing',
    question: 'Can I get a second trial?',
    answer: 'No. Each agency gets one 14-day trial. After it expires, you need to subscribe to access Pro or Scale features.',
    keywords: ['second', 'another', 'trial', 'again', 'new trial'],
    userType: 'agency',
  },
  {
    id: 'contract',
    category: 'plans-pricing',
    question: 'Is there a contract or commitment?',
    answer: 'No. All plans are month-to-month with no long-term commitment. Cancel anytime from Settings > Billing.',
    keywords: ['contract', 'commitment', 'annual', 'yearly', 'lock-in', 'cancel'],
    userType: 'agency',
  },

  // ── BILLING & PAYMENTS ──────────────────────────────────────────
  {
    id: 'subscribe',
    category: 'billing',
    question: 'How do I subscribe to a plan?',
    answer: 'Go to Settings > Billing. Click "Upgrade to Pro" or "Upgrade to Scale." You\'ll be redirected to Stripe checkout. After payment, your plan activates immediately.',
    keywords: ['subscribe', 'pay', 'upgrade', 'checkout', 'purchase'],
    userType: 'agency',
  },
  {
    id: 'update-payment',
    category: 'billing',
    question: 'How do I update my payment method?',
    answer: 'Go to Settings > Billing and click "Manage Subscription." This opens the Stripe customer portal where you can update your card, view invoices, and manage your subscription.',
    keywords: ['payment', 'card', 'update', 'change', 'credit card', 'method'],
    userType: 'agency',
  },
  {
    id: 'invoices',
    category: 'billing',
    question: 'Where can I see my invoices?',
    answer: 'Click "Manage Subscription" in Settings > Billing. The Stripe customer portal shows all past invoices and upcoming charges.',
    keywords: ['invoice', 'receipt', 'history', 'charges', 'billing history'],
    userType: 'agency',
  },
  {
    id: 'cancel-subscription',
    category: 'billing',
    question: 'How do I cancel my subscription?',
    answer: 'Go to Settings > Billing and click "Manage Subscription" to cancel through the Stripe portal. If you\'re on a trial, you can also cancel directly from the trial banner. Cancellation takes effect at the end of your billing cycle. Your data is retained for 30 days in case you resubscribe.',
    keywords: ['cancel', 'stop', 'end', 'subscription', 'unsubscribe'],
    userType: 'agency',
  },
  {
    id: 'free-plan-payment-prompt',
    category: 'billing',
    question: "I'm on the Free plan — why am I being asked for payment when adding a client?",
    answer: 'The Free plan has no platform fee, but there IS a per-client charge ($29.99/month) and per-minute charge ($0.12/min). When you add your first client, the system creates a Stripe subscription for these usage charges, so you need to enter payment info at that point.',
    keywords: ['free', 'payment', 'billing required', 'add client', 'card', 'charge', 'why'],
    userType: 'agency',
  },
  {
    id: 'stripe-connect-setup',
    category: 'billing',
    question: 'How do I set up Stripe Connect to receive client payments?',
    answer: 'Go to Settings > Payments and click "Connect Stripe." You\'ll be redirected to Stripe\'s onboarding flow to complete business verification and bank details. Once done, you\'ll see "Active" status. Client subscription payments then go directly to your bank account — zero revenue share.',
    keywords: ['stripe', 'connect', 'setup', 'payments', 'receive', 'bank', 'payout'],
    userType: 'agency',
  },
  {
    id: 'stripe-incomplete',
    category: 'billing',
    question: 'My Stripe status says "Setup Incomplete" — what do I do?',
    answer: 'Stripe needs more information from you — usually identity verification or bank account details. Click "Complete" in Settings > Payments to return to Stripe and finish the setup. Both "Charges: OK" and "Payouts: OK" need to show green for you to receive payments.',
    keywords: ['stripe', 'incomplete', 'setup', 'restricted', 'verification', 'not working'],
    userType: 'agency',
  },

  // ── MANAGING CLIENTS ────────────────────────────────────────────
  {
    id: 'add-client',
    category: 'clients',
    question: 'How do I add a client?',
    answer: 'Click "Add Client" from the agency dashboard. Fill in the business name, owner name, phone, email, and industry. The platform will automatically create the account, provision a dedicated phone number, configure an AI assistant based on the industry, and send a welcome email with login credentials — all in about 60 seconds.',
    keywords: ['add', 'create', 'new', 'client', 'business', 'onboard'],
    userType: 'agency',
  },
  {
    id: 'self-serve-signup',
    category: 'clients',
    question: 'Can clients sign up on their own?',
    answer: 'Yes, if you have a marketing website (Pro/Scale). Clients can sign up through your branded signup page. The platform auto-provisions everything — AI assistant, phone number, dashboard access, and welcome sequence.',
    keywords: ['self', 'signup', 'own', 'automatic', 'landing page', 'marketing'],
    userType: 'agency',
  },
  {
    id: 'industries',
    category: 'clients',
    question: 'What industries are supported?',
    answer: 'The AI receptionist works for any business, but has optimized templates for: Home Services (HVAC, plumbing, electrical, roofing), Medical & Dental, Legal, Salons & Spas, Real Estate, Automotive, Restaurants, Fitness & Wellness, Accounting, Veterinary, Insurance, Property Management, Cleaning Services, and more.',
    keywords: ['industry', 'industries', 'type', 'business', 'template', 'vertical', 'niche'],
    userType: 'agency',
  },
  {
    id: 'client-limit',
    category: 'clients',
    question: 'Is there a limit on how many clients I can have?',
    answer: 'No. All plans support unlimited clients. The only difference is the per-client cost: $29.99 (Free), $9.99 (Pro), or $0 (Scale).',
    keywords: ['limit', 'max', 'unlimited', 'how many', 'clients', 'cap'],
    userType: 'agency',
  },
  {
    id: 'remove-client',
    category: 'clients',
    question: 'How do I remove a client?',
    answer: 'Open the client\'s detail page from your client list and use the delete option. This deactivates their AI receptionist and releases their phone number. This action cannot be undone.',
    keywords: ['remove', 'delete', 'client', 'deactivate', 'cancel'],
    userType: 'agency',
  },

  // ── AI LAB ──────────────────────────────────────────────────────
  {
    id: 'what-is-ai-lab',
    category: 'ai-lab',
    question: 'What is the AI Lab?',
    answer: 'The AI Lab (Pro/Scale) is where you configure, test, and deploy AI receptionists. It includes a system prompt editor, voice selection with preview, model selection (GPT-4o Mini, GPT-4.1 Mini, GPT-4o), knowledge base editor, live browser test calls, and call mode settings (primary vs. overflow).',
    keywords: ['ai lab', 'configure', 'setup', 'assistant', 'templates'],
    userType: 'agency',
  },
  {
    id: 'call-modes',
    category: 'ai-lab',
    question: "What's the difference between Primary and Secondary call modes?",
    answer: 'Primary mode means the AI answers all calls — this is the default. Secondary (Overflow) mode means the AI only answers when the business owner doesn\'t pick up. Secondary is useful for businesses that want to answer calls themselves during work hours but have AI coverage after hours or when they\'re busy.',
    keywords: ['primary', 'secondary', 'overflow', 'call mode', 'forward', 'fallback'],
    userType: 'agency',
  },
  {
    id: 'ai-models',
    category: 'ai-lab',
    question: 'What AI models are available?',
    answer: 'Three models: GPT-4o Mini (Default — fastest, lowest cost, best for real-time voice), GPT-4.1 Mini (Latest — better instruction following, same speed), and GPT-4o (Premium — strongest reasoning but slower, good for complex industries like legal or medical).',
    keywords: ['model', 'gpt', 'openai', 'ai', 'engine', 'which model'],
    userType: 'agency',
  },
  {
    id: 'temperature',
    category: 'ai-lab',
    question: 'What is the temperature setting?',
    answer: 'Temperature controls how creative vs. precise the AI is. Lower values (0.0–0.3) make responses more predictable and scripted. Higher values (0.7–1.0) make responses more natural and varied. Default is 0.7, which works well for most businesses.',
    keywords: ['temperature', 'creative', 'precise', 'random', 'setting'],
    userType: 'agency',
  },
  {
    id: 'system-prompt',
    category: 'ai-lab',
    question: 'How do I write a good system prompt?',
    answer: 'A good system prompt includes: the business name and type, services offered, how to handle common scenarios (appointments, pricing, emergencies), when to transfer calls to a human, what information to collect (name, phone, reason), and tone/personality guidelines. Check our prompting guide at myvoiceaiconnect.com/blog/ai-receptionist-prompt-guide for detailed examples.',
    keywords: ['prompt', 'system', 'write', 'instructions', 'configure', 'customize', 'script'],
    userType: 'agency',
  },
  {
    id: 'test-call',
    category: 'ai-lab',
    question: 'Can I test the AI without using a real phone?',
    answer: 'Yes. The AI Lab has a "Start Test Call" button that opens a live browser call to the AI. You can test voice, behavior, and configuration changes in real time without needing a phone. You can also temporarily route SMS notifications to your own phone during testing.',
    keywords: ['test', 'call', 'browser', 'try', 'preview', 'listen'],
    userType: 'agency',
  },
  {
    id: 'voices',
    category: 'ai-lab',
    question: 'What voices are available?',
    answer: 'VoiceAI Connect uses ElevenLabs voices with multiple options including male and female voices in various accents and styles (professional, friendly, warm). Each voice has a preview button so you can listen before selecting. Recommended voices are marked with a star.',
    keywords: ['voice', 'voices', 'sound', 'accent', 'male', 'female', 'elevenlabs'],
    userType: 'agency',
  },

  // ── KNOWLEDGE BASE ──────────────────────────────────────────────
  {
    id: 'what-is-kb',
    category: 'knowledge-base',
    question: 'What is the knowledge base?',
    answer: 'The knowledge base is business-specific information the AI uses to answer caller questions accurately. It includes: website URL, services with pricing, FAQs (question/answer pairs), business hours, and additional info like policies, service areas, and payment methods. The more detailed it is, the better the AI performs.',
    keywords: ['knowledge', 'base', 'faq', 'information', 'data', 'content'],
    userType: 'both',
  },
  {
    id: 'edit-kb',
    category: 'knowledge-base',
    question: "How do I edit a client's knowledge base?",
    answer: 'Open the AI Lab, select the client, and expand the "Knowledge Base" section. Add services with names, prices, and descriptions. Add FAQs with question/answer pairs. Set business hours and additional info. Changes take effect immediately after saving.',
    keywords: ['edit', 'update', 'change', 'knowledge', 'faq', 'services'],
    userType: 'agency',
  },
  {
    id: 'kb-detail-level',
    category: 'knowledge-base',
    question: 'How detailed should the knowledge base be?',
    answer: 'As detailed as possible. At minimum include: all services with pricing, business hours and holidays, service area, appointment process, emergency procedures, payment methods, and important policies (cancellation, warranties). The AI can only answer questions about information it has — gaps mean the AI will acknowledge it doesn\'t know and offer to take a message.',
    keywords: ['detail', 'how much', 'content', 'information', 'minimum', 'what to include'],
    userType: 'both',
  },

  // ── PHONE & TELEPHONY ──────────────────────────────────────────
  {
    id: 'phone-assignment',
    category: 'phone-telephony',
    question: 'How are phone numbers assigned?',
    answer: 'When a client is created, the platform automatically provisions a dedicated US phone number through Telnyx. This number is assigned exclusively to that client\'s AI receptionist. No manual setup or A2P registration is required.',
    keywords: ['phone', 'number', 'assigned', 'provision', 'get', 'new'],
    userType: 'agency',
  },
  {
    id: 'keep-existing-number',
    category: 'phone-telephony',
    question: 'Can clients keep their existing phone number?',
    answer: 'The AI phone number is a new dedicated number. Clients typically forward their existing business number to the AI number, or publish the AI number as their primary number. Call forwarding setup varies by phone provider — the client configures this on their end.',
    keywords: ['existing', 'keep', 'port', 'forward', 'current', 'business number'],
    userType: 'both',
  },
  {
    id: 'international',
    category: 'phone-telephony',
    question: 'Are international phone numbers available?',
    answer: 'US and Canadian numbers are provisioned automatically. For international numbers (UK, EU, Australia, etc.), use the BYOT (Bring Your Own Twilio) feature on the Scale plan. Connect your own Twilio account in Settings > Twilio to provision numbers in any country Twilio supports.',
    keywords: ['international', 'uk', 'europe', 'canada', 'australia', 'global', 'country', 'byot', 'twilio'],
    userType: 'agency',
  },

  // ── BRANDING ────────────────────────────────────────────────────
  {
    id: 'white-label',
    category: 'branding',
    question: 'What does white-label mean?',
    answer: 'White-label means your clients never see VoiceAI Connect\'s branding. Everything — the dashboard, emails, phone experience, marketing site — shows YOUR brand name, logo, and colors. White-label requires Pro or Scale. On the Free plan, dashboards show VoiceAI Connect default branding.',
    keywords: ['white label', 'branding', 'custom', 'my brand', 'logo', 'invisible'],
    userType: 'agency',
  },
  {
    id: 'upload-logo',
    category: 'branding',
    question: 'How do I set up my branding?',
    answer: 'Go to Settings > Profile. Upload your logo (PNG or JPG, under 2MB). The platform automatically extracts brand colors and suggests a light or dark theme. You can fine-tune the colors with color pickers. Save to apply across all dashboards. You can also set whether client dashboards show your agency name or each client\'s own business name in the header.',
    keywords: ['logo', 'upload', 'colors', 'brand', 'theme', 'customize', 'design'],
    userType: 'agency',
  },

  // ── LEADS & OUTREACH ────────────────────────────────────────────
  {
    id: 'lead-finder',
    category: 'leads-outreach',
    question: 'What is the Lead Finder?',
    answer: 'The Lead Finder (Pro/Scale) helps you find potential clients. It has two sources: Google Maps (search by industry and location to find local businesses) and Indeed (search by job title to find businesses actively hiring receptionists — spending money on the exact role your AI replaces). Each lead gets a fit score from 0-100.',
    keywords: ['lead', 'finder', 'find', 'prospect', 'search', 'google maps', 'indeed'],
    userType: 'agency',
  },
  {
    id: 'outreach-templates',
    category: 'leads-outreach',
    question: 'What outreach templates are included?',
    answer: 'Pro/Scale plans include 13 conversion-tested templates: 6 email templates (initial outreach + follow-up sequence + re-engagement), 3 SMS templates (intro, follow-up, demo invite), and 4 cold call scripts (opener, voicemail, follow-up, objection handling). All support merge variables like {lead_business_name} and {agency_name}. You can also create your own.',
    keywords: ['outreach', 'templates', 'email', 'sms', 'cold call', 'scripts', 'sequence'],
    userType: 'agency',
  },
  {
    id: 'csv-import',
    category: 'leads-outreach',
    question: 'Can I import or export leads?',
    answer: 'Yes. On the Leads page, click "Import CSV" to upload a CSV file with business name, contact name, email, phone, and industry columns. The importer maps your columns automatically. To export, click the "CSV" button in the Lead Finder results — you can export all results or just selected leads.',
    keywords: ['csv', 'import', 'export', 'upload', 'download', 'spreadsheet'],
    userType: 'agency',
  },

  // ── TEAM MEMBERS ────────────────────────────────────────────────
  {
    id: 'team-members',
    category: 'team',
    question: 'Can I add team members?',
    answer: 'Yes, on Pro and Scale. Pro allows 5 agency team members + 2 per client. Scale allows unlimited. Free plan has no team member access. Go to Settings > Team to invite members by email.',
    keywords: ['team', 'members', 'invite', 'add', 'staff', 'employees', 'access'],
    userType: 'agency',
  },

  // ── CALL HANDLING ───────────────────────────────────────────────
  {
    id: 'call-flow',
    category: 'calls',
    question: 'What happens when someone calls?',
    answer: 'The AI answers immediately (sub-2-second response), greets the caller with the configured opening message, engages in natural conversation using the knowledge base and system prompt, can transfer urgent calls to the business owner if configured, and after the call generates a summary with notifications sent via SMS and/or email.',
    keywords: ['call', 'answer', 'flow', 'happens', 'process', 'incoming'],
    userType: 'both',
  },
  {
    id: 'call-transfer',
    category: 'calls',
    question: 'Can the AI transfer calls to a human?',
    answer: 'Yes, when enabled. The system prompt controls when transfers happen (e.g., emergencies, specific requests). If the transfer fails (owner doesn\'t answer), the AI falls back to taking a message. Configure the transfer phone number in the AI Lab.',
    keywords: ['transfer', 'forward', 'human', 'live', 'person', 'owner', 'urgent'],
    userType: 'both',
  },
  {
    id: 'spam-detection',
    category: 'calls',
    question: 'Does the AI detect spam calls?',
    answer: 'Yes. Built-in spam detection identifies and blocks robocalls, telemarketers, and known spam numbers. This is included on all plans at no extra cost.',
    keywords: ['spam', 'block', 'robocall', 'telemarketer', 'junk', 'filter'],
    userType: 'both',
  },
  {
    id: 'call-recording',
    category: 'calls',
    question: 'Are calls recorded?',
    answer: 'Yes. All calls are recorded and available in the client dashboard with full audio, time-coded transcript, AI-generated summary with intent and sentiment analysis, caller phone number, and duration.',
    keywords: ['recording', 'recorded', 'transcript', 'audio', 'listen', 'playback'],
    userType: 'both',
  },
  {
    id: 'after-hours',
    category: 'calls',
    question: 'How are after-hours calls handled?',
    answer: 'Configure business hours in the client settings. The AI can switch to message-taking mode outside business hours with a different greeting, e.g., "Thank you for calling after hours. I\'ll take your message and someone will get back to you in the morning."',
    keywords: ['after hours', 'night', 'weekend', 'closed', 'business hours', 'schedule'],
    userType: 'both',
  },
  {
    id: 'compliance-disclaimer',
    category: 'calls',
    question: 'Is there a call recording compliance disclaimer?',
    answer: 'Yes. For compliance, the AI should state "This call may be recorded for quality and training purposes" at the beginning of the call. The AI Lab includes a one-click copy button for this text — add it to the opening greeting.',
    keywords: ['compliance', 'recording', 'disclaimer', 'legal', 'consent', 'notice'],
    userType: 'both',
  },
  {
    id: 'no-mention-ai',
    category: 'calls',
    question: 'Can the AI avoid mentioning it\'s an AI?',
    answer: 'Yes. The system prompt and opening greeting are fully customizable. Many agencies configure the AI to introduce itself as a "receptionist" or "assistant" without mentioning AI. For example: "Thank you for calling Smith Plumbing, this is Sarah, how can I help you?"',
    keywords: ['ai', 'mention', 'hide', 'human', 'name', 'receptionist', 'natural'],
    userType: 'agency',
  },

  // ── GOOGLE CALENDAR INTEGRATION ───────────────────────────────────
  {
    id: 'gcal-overview',
    category: 'integrations',
    question: 'Does VoiceAI Connect integrate with Google Calendar?',
    answer: 'Yes. VoiceAI Connect has a built-in Google Calendar integration that lets the AI receptionist check real-time availability and book appointments directly during phone calls. When a caller wants to schedule an appointment, the AI checks your Google Calendar for open slots and books it on the spot — no back-and-forth, no missed bookings.',
    keywords: ['google', 'calendar', 'integration', 'scheduling', 'appointment', 'booking', 'gcal'],
    userType: 'both',
  },
  {
    id: 'gcal-how-it-works',
    category: 'integrations',
    question: 'How does the Google Calendar booking work during calls?',
    answer: 'When a caller says they want to book an appointment, the AI checks your connected Google Calendar for available time slots. It offers the caller available times, confirms their preferred slot, and creates the calendar event automatically — including the caller\'s name, phone number, and reason for the appointment. The business owner sees the new booking appear in their Google Calendar instantly.',
    keywords: ['how', 'works', 'booking', 'appointment', 'schedule', 'available', 'slots', 'real-time'],
    userType: 'both',
  },
  {
    id: 'gcal-setup',
    category: 'integrations',
    question: 'How do I connect Google Calendar?',
    answer: 'Go to Settings and look for the Google Calendar section. Click "Connect Google Calendar" to authorize access through your Google account. Once connected, the AI receptionist can check availability and book appointments. You control which calendar it reads from and writes to.',
    keywords: ['connect', 'setup', 'google', 'calendar', 'authorize', 'link', 'enable'],
    userType: 'client',
  },
  {
    id: 'gcal-agency-setup',
    category: 'integrations',
    question: 'How do I enable Google Calendar for my clients?',
    answer: 'Google Calendar is a per-plan feature you control in Settings > Pricing. Toggle the "Google Calendar" feature on for the plan tiers where you want it available. Once enabled for a plan, clients on that tier can connect their own Google account from their dashboard. The integration uses Google\'s secure OAuth flow — you never see your client\'s credentials.',
    keywords: ['enable', 'calendar', 'clients', 'plan', 'feature', 'toggle', 'agency'],
    userType: 'agency',
  },
  {
    id: 'gcal-which-plans',
    category: 'integrations',
    question: 'Which client plans include Google Calendar?',
    answer: 'You decide. In Settings > Pricing, each plan tier has a "Google Calendar" toggle under the features list. You might include it only on your Pro or Growth tiers as a premium upsell, or enable it across all tiers. It\'s entirely up to you.',
    keywords: ['plans', 'which', 'calendar', 'tier', 'include', 'available'],
    userType: 'agency',
  },
  {
    id: 'gcal-not-working',
    category: 'integrations',
    question: 'Google Calendar integration isn\'t working',
    answer: 'Check these in order: (1) Verify the Google account is connected — look for a green "Connected" status in Settings. (2) Make sure the correct calendar is selected. (3) Verify the "Google Calendar" feature is enabled for the client\'s plan tier (agency controls this in Settings > Pricing). (4) Try disconnecting and reconnecting the Google account. If the issue persists, contact support.',
    keywords: ['not working', 'broken', 'calendar', 'fix', 'error', 'disconnect', 'reconnect'],
    userType: 'both',
  },
  {
    id: 'gcal-multiple-calendars',
    category: 'integrations',
    question: 'Can I use multiple Google Calendars?',
    answer: 'The integration connects to one Google account per client. The AI reads from and writes to the calendar you select during setup. If a business uses a shared team calendar, connect the Google account that owns that calendar.',
    keywords: ['multiple', 'calendars', 'shared', 'team', 'which', 'select'],
    userType: 'both',
  },

  // ── TROUBLESHOOTING ─────────────────────────────────────────────
  {
    id: 'ai-not-answering',
    category: 'troubleshooting',
    question: "My client's AI isn't answering calls",
    answer: 'Check in order: (1) Verify the client has an AI assistant configured in the AI Lab, (2) Verify the phone number is provisioned on the client detail page, (3) Verify the client subscription is active, (4) Try a test call from the AI Lab browser to isolate phone vs. AI issues, (5) Check that the greeting and system prompt are not empty. Contact support if the issue persists.',
    keywords: ['not answering', 'broken', 'down', 'silent', 'no answer', 'not working', 'calls'],
    userType: 'agency',
  },
  {
    id: 'wrong-answers',
    category: 'troubleshooting',
    question: 'The AI is giving wrong or inaccurate answers',
    answer: 'The AI answers based on the knowledge base and system prompt. To fix: (1) Open AI Lab and select the client, (2) Check the Knowledge Base for incorrect or missing info, (3) Check the System Prompt for unclear instructions, (4) Update with correct information, (5) Test with a browser call to verify. The AI can only use information it has been given.',
    keywords: ['wrong', 'incorrect', 'bad', 'inaccurate', 'mistake', 'answer', 'hallucinate'],
    userType: 'both',
  },
  {
    id: 'cant-add-client',
    category: 'troubleshooting',
    question: "I can't add a new client",
    answer: 'If you see "billing required," you need to set up payment first. On the Free plan, you\'ll be redirected to Stripe checkout for the per-client charge ($29.99/mo). On Pro/Scale, verify your subscription is active in Settings > Billing. If the issue persists, try refreshing the page or logging out and back in.',
    keywords: ['add', 'client', 'error', 'billing required', 'cant', 'fail'],
    userType: 'agency',
  },
  {
    id: 'locked-feature',
    category: 'troubleshooting',
    question: "I'm locked out of a feature",
    answer: 'Features are gated by plan. If you see a lock overlay: White-label, AI Lab, Lead Finder, Outreach, and Referrals require Pro. BYOT, API access, and unlimited team require Scale. Upgrade in Settings > Billing. During a trial, you have full Scale access — if features locked after trial, your plan reverted to Free.',
    keywords: ['locked', 'access', 'denied', 'upgrade', 'feature', 'blocked', 'overlay'],
    userType: 'agency',
  },
  {
    id: 'demo-mode-info',
    category: 'troubleshooting',
    question: "My dashboard shows fake data / I'm seeing sample data",
    answer: 'You likely have Demo Mode enabled. Go to Settings > Demo Mode and toggle it off. Demo Mode fills the dashboard with sample data for exploration purposes but doesn\'t affect your real data. A purple indicator appears in the sidebar when demo mode is active.',
    keywords: ['demo', 'fake', 'sample', 'data', 'not real', 'wrong data', 'test data'],
    userType: 'agency',
  },
  {
    id: 'referral-program',
    category: 'leads-outreach',
    question: 'How does the referral program work?',
    answer: 'Pro and Scale agencies earn 40% recurring commission by referring other agencies. Go to the Referrals page for your unique link (customizable code). When someone signs up and subscribes using your link, you earn 40% of their subscription every month. Request payouts from the Referrals page — processed through Stripe Connect.',
    keywords: ['referral', 'refer', 'commission', 'earn', 'affiliate', 'share', 'link'],
    userType: 'agency',
  },
  {
    id: 'marketing-website',
    category: 'branding',
    question: 'Do I get a marketing website?',
    answer: 'Pro and Scale plans include a complete white-label marketing website with your branding, custom pricing tiers, how-it-works section, FAQ, and call-to-action signup buttons. It also includes an interactive AI demo phone line where prospects can experience the product firsthand. Hosted and managed automatically — no setup needed.',
    keywords: ['marketing', 'website', 'landing page', 'site', 'homepage', 'demo line'],
    userType: 'agency',
  },
  {
    id: 'theme-toggle',
    category: 'branding',
    question: 'Can I switch between light and dark mode?',
    answer: 'Yes. Use the sun/moon toggle in the sidebar (above Sign Out). Works on all plans including Free. The theme applies to both your agency dashboard and client dashboards.',
    keywords: ['dark', 'light', 'mode', 'theme', 'toggle', 'switch', 'appearance'],
    userType: 'both',
  },
  {
    id: 'contact-support',
    category: 'troubleshooting',
    question: 'How do I contact support?',
    answer: 'Use this help widget to search FAQs, ask the AI assistant, or send a message to the support team. You can also go to Settings > Feedback to submit feedback or feature requests. Support messages are typically responded to within a few hours.',
    keywords: ['support', 'contact', 'help', 'human', 'talk', 'message', 'reach'],
    userType: 'both',
  },

  // ── CLIENT-SPECIFIC ARTICLES ──────────────────────────────────────
  {
    id: 'client-what-is-ai',
    category: 'calls',
    question: 'What is my AI receptionist?',
    answer: 'Your AI receptionist is a virtual phone assistant that answers your business calls 24/7. It greets callers professionally, answers common questions about your business, takes messages, and can transfer urgent calls to you. Every call is recorded with a full transcript and AI-generated summary delivered to you via SMS and email.',
    keywords: ['what', 'ai', 'receptionist', 'assistant', 'how', 'work'],
    userType: 'client',
  },
  {
    id: 'client-view-calls',
    category: 'calls',
    question: 'How do I view my call history?',
    answer: 'Click "Calls" in the sidebar to see all incoming calls. Each call shows the date, time, duration, caller number, and an AI-generated summary. Click any call to see the full recording, transcript, and detailed analysis including caller intent and sentiment.',
    keywords: ['calls', 'history', 'view', 'list', 'log', 'recent'],
    userType: 'client',
  },
  {
    id: 'client-listen-recording',
    category: 'calls',
    question: 'How do I listen to a call recording?',
    answer: 'Go to Calls and click on any call in the list. The call detail page includes an audio player at the top where you can listen to the full recording. Below it you\'ll find the time-coded transcript and AI summary.',
    keywords: ['listen', 'recording', 'audio', 'playback', 'play', 'hear'],
    userType: 'client',
  },
  {
    id: 'client-sms-notifications',
    category: 'calls',
    question: 'What are the text message notifications I receive?',
    answer: 'After every call, you receive an SMS with a summary of the call — who called, what they needed, and any action items. You can configure notification preferences in Settings. Email notifications with more detail are also available.',
    keywords: ['sms', 'text', 'notification', 'message', 'alert', 'summary'],
    userType: 'client',
  },
  {
    id: 'client-phone-number',
    category: 'phone-telephony',
    question: 'What phone number should I give to callers?',
    answer: 'Your dedicated AI receptionist phone number is shown on your Dashboard. You can either publish this number directly for your business, or forward your existing business number to this number so the AI picks up when you can\'t answer. Contact your phone provider to set up call forwarding.',
    keywords: ['phone', 'number', 'forward', 'callers', 'give', 'publish', 'my number'],
    userType: 'client',
  },
  {
    id: 'client-update-kb',
    category: 'knowledge-base',
    question: 'How do I update my business information?',
    answer: 'Go to AI Agent in the sidebar. Here you can update your business services, pricing, FAQs, business hours, and other information the AI uses to answer caller questions. Click "Save" after making changes — they take effect immediately on your next call.',
    keywords: ['update', 'business', 'info', 'services', 'hours', 'faq', 'knowledge', 'change'],
    userType: 'client',
  },
  {
    id: 'client-change-greeting',
    category: 'knowledge-base',
    question: 'How do I change what the AI says when it answers?',
    answer: 'Go to AI Agent and look for the "Greeting" or "Opening Message" field. This is what the AI says at the start of every call. For example: "Thank you for calling Smith Plumbing, how can I help you today?" Save your changes and they take effect immediately.',
    keywords: ['greeting', 'opening', 'message', 'answer', 'says', 'change', 'hello'],
    userType: 'client',
  },
  {
    id: 'client-wrong-info',
    category: 'troubleshooting',
    question: 'The AI is telling callers the wrong information',
    answer: 'The AI answers based on the business information you\'ve provided. Go to AI Agent and review your services, pricing, FAQs, and hours. Update any incorrect information and save. The AI will use the corrected information on the very next call.',
    keywords: ['wrong', 'incorrect', 'bad', 'information', 'fix', 'update', 'mistake'],
    userType: 'client',
  },
  {
    id: 'client-contacts',
    category: 'clients',
    question: 'What is the Contacts page?',
    answer: 'Contacts shows all the people who have called your business. The AI automatically creates a contact record for each unique caller, tracking their name, phone number, call history, and any notes from their conversations. This helps you keep track of your callers and follow up as needed.',
    keywords: ['contacts', 'callers', 'people', 'list', 'directory', 'who called'],
    userType: 'client',
  },
  {
    id: 'client-settings',
    category: 'troubleshooting',
    question: 'How do I change my account settings?',
    answer: 'Click "Settings" in the sidebar. Here you can update your notification preferences (SMS and email), business information, and account details. If you need to change your password, you can do that from Settings as well.',
    keywords: ['settings', 'account', 'preferences', 'password', 'notifications', 'change'],
    userType: 'client',
  },
  {
    id: 'client-billing',
    category: 'billing',
    question: 'How do I manage my subscription?',
    answer: 'Your subscription is managed by your agency provider. If you have billing questions, contact them directly. Your current plan and subscription status are shown in Settings.',
    keywords: ['billing', 'subscription', 'payment', 'plan', 'cancel', 'charge', 'invoice'],
    userType: 'client',
  },
  {
    id: 'client-not-answering',
    category: 'troubleshooting',
    question: 'My AI receptionist isn\'t answering calls',
    answer: 'If your AI isn\'t picking up calls, check that your phone number is correctly forwarded to the AI number shown on your Dashboard. If you\'re calling the AI number directly and it\'s not answering, contact your agency provider — there may be a configuration issue on their end.',
    keywords: ['not answering', 'down', 'broken', 'silent', 'no answer', 'not working'],
    userType: 'client',
  },

  // ── CLIENT: STAFF & USERS ──────────────────────────────────────
  {
    id: 'client-staff-directory',
    category: 'team',
    question: 'What is the Staff Directory?',
    answer: 'The Staff Directory is where you add the people your AI knows about. When a caller asks for a specific person by name, the AI can reference their role, transfer the call, or send them a text. Add staff in My Business under Staff Directory with their name, role, phone number, and any notes the AI should know.',
    keywords: ['staff', 'directory', 'people', 'team', 'employees', 'routing', 'add staff'],
    userType: 'client',
  },
  {
    id: 'client-add-staff',
    category: 'team',
    question: 'How do I add a staff member?',
    answer: 'Go to My Business and scroll to Staff Directory. Click "Add Staff Member" and enter their name, role or title, phone number, and any notes (like their specialty or schedule). The AI will use this information when callers ask for that person by name.',
    keywords: ['add', 'staff', 'member', 'new', 'create', 'employee', 'person'],
    userType: 'client',
  },
  {
    id: 'client-users',
    category: 'team',
    question: 'How do I add users who can log into the dashboard?',
    answer: 'Go to Settings and scroll to the Users section. Click "Add" and enter their name, email, and phone number. They will receive their login credentials via SMS. You can control which pages each user can access under Page Access, and toggle call notifications on or off per user.',
    keywords: ['users', 'login', 'dashboard', 'access', 'invite', 'add user', 'team'],
    userType: 'client',
  },
  {
    id: 'client-staff-vs-users',
    category: 'team',
    question: 'What is the difference between Staff and Users?',
    answer: 'Staff members (My Business > Staff Directory) are people your AI knows about and can reference on calls — for routing, scheduling, and referrals. They do not have dashboard login access. Users (Settings > Users) are people who can log into this dashboard with their own email and password to view calls, contacts, and settings. A person can be both.',
    keywords: ['staff', 'users', 'difference', 'between', 'vs', 'team', 'login', 'directory'],
    userType: 'client',
  },

  // ── CLIENT: APP & DASHBOARD ────────────────────────────────────
  {
    id: 'client-phone-desktop',
    category: 'getting-started',
    question: 'Can I use the app on my phone and desktop?',
    answer: 'Yes. The dashboard works on any device with a web browser — phone, tablet, or desktop. On your phone, you can add it to your home screen for instant access that works like a native app. Go to Settings and tap "Install" next to "Add to Home Screen" for step-by-step instructions.',
    keywords: ['phone', 'desktop', 'mobile', 'app', 'device', 'browser', 'pwa', 'home screen'],
    userType: 'client',
  },
  {
    id: 'client-add-home-screen',
    category: 'getting-started',
    question: 'How do I add the app to my home screen?',
    answer: 'Go to Settings and find the "Add to Home Screen" section. Tap "Install" for step-by-step instructions for your device (iPhone or Android). Once installed, the app appears on your home screen with your provider\'s icon and opens in full-screen mode — no browser bar, just like a regular app.',
    keywords: ['home screen', 'install', 'app', 'pwa', 'icon', 'shortcut', 'add'],
    userType: 'client',
  },
  {
    id: 'client-dashboard-overview',
    category: 'getting-started',
    question: 'What is on the Dashboard?',
    answer: 'The Dashboard is your home screen. It shows your AI phone number, recent calls with summaries, total calls this month, and quick stats. Use the sidebar to navigate to Calls (full call history), Contacts (caller directory), AI Agent (configure your AI), My Business (services, hours, staff), and Settings (account, users, billing).',
    keywords: ['dashboard', 'home', 'overview', 'main', 'page', 'what', 'see'],
    userType: 'client',
  },

  // ── CLIENT: BUSINESS CONFIGURATION ─────────────────────────────
  {
    id: 'client-add-services',
    category: 'knowledge-base',
    question: 'How do I add or edit my services?',
    answer: 'Go to My Business and find the Services section. Click "Add Service" to create a new one with a name, description, and price. Click any existing service to edit or remove it. Services you add here are what the AI references when callers ask about what you offer and how much things cost.',
    keywords: ['services', 'add', 'edit', 'pricing', 'offerings', 'what we do', 'cost'],
    userType: 'client',
  },
  {
    id: 'client-business-hours',
    category: 'knowledge-base',
    question: 'How do I set my business hours?',
    answer: 'Go to My Business and find the Business Hours section. Click "Edit" to set your open and close times for each day of the week. Mark days as "Closed" if applicable. The AI uses these hours to tell callers when you are open and can adjust its behavior for after-hours calls.',
    keywords: ['hours', 'business hours', 'open', 'close', 'schedule', 'days', 'time'],
    userType: 'client',
  },
  {
    id: 'client-add-faqs',
    category: 'knowledge-base',
    question: 'How do I add FAQs for my AI to answer?',
    answer: 'Go to My Business and scroll to the Knowledge Base section. Click "Edit" to expand it, then use "Add FAQ" to enter question-and-answer pairs. For example: Q: "Do you offer free estimates?" A: "Yes, we offer free on-site estimates for all services." The more FAQs you add, the better the AI handles common caller questions.',
    keywords: ['faq', 'question', 'answer', 'add', 'knowledge', 'common', 'frequently asked'],
    userType: 'client',
  },

  // ── CLIENT: CALL HANDLING ──────────────────────────────────────
  {
    id: 'client-call-forwarding',
    category: 'phone-telephony',
    question: 'How do I set up call forwarding to the AI?',
    answer: 'Your AI receptionist has its own dedicated phone number shown on your Dashboard. To have your existing business number forward to the AI, contact your phone provider and ask them to enable call forwarding to the AI number. On most carriers you can also dial *72 followed by the AI number from your business phone. The AI will then answer any calls you miss or cannot take.',
    keywords: ['forwarding', 'forward', 'redirect', 'existing number', 'setup', 'carrier', 'provider'],
    userType: 'client',
  },
  {
    id: 'client-call-mode',
    category: 'calls',
    question: 'What is the difference between Primary and Fallback mode?',
    answer: 'Primary mode means the AI answers every call immediately — best for 24/7 coverage. Fallback mode means your phone rings first, and the AI only picks up if you do not answer. You can switch between modes in Settings under Call Handling. Fallback mode requires your phone number to be set in Settings.',
    keywords: ['primary', 'fallback', 'mode', 'ring', 'first', 'overflow', 'call handling'],
    userType: 'client',
  },

  // ── CLIENT: SETTINGS & SECURITY ────────────────────────────────
  {
    id: 'client-change-password',
    category: 'troubleshooting',
    question: 'How do I change my password?',
    answer: 'Go to Settings and scroll to the Change Password section. Enter your current password, then enter and confirm your new password (minimum 6 characters). Click "Change Password" to save. If you have forgotten your current password, contact your provider for a reset.',
    keywords: ['password', 'change', 'reset', 'security', 'login', 'forgot', 'update'],
    userType: 'client',
  },
  {
    id: 'client-hipaa',
    category: 'calls',
    question: 'What is HIPAA mode?',
    answer: 'HIPAA mode is available for healthcare businesses. When enabled in Settings, call recordings and transcripts are not stored, caller recognition is disabled, and appointment booking switches to collect-request only (the office confirms all appointments). The AI only collects the caller\'s name, phone number, and general reason for visit — no medical details.',
    keywords: ['hipaa', 'healthcare', 'medical', 'privacy', 'recording', 'compliance', 'health'],
    userType: 'client',
  },
  {
    id: 'client-notifications',
    category: 'calls',
    question: 'How do I manage my notifications?',
    answer: 'Your primary notification preferences are tied to the phone number and email in Settings under Contact Information. SMS summaries are sent to your phone number after each call. If you have added users in Settings, each user has their own call notification toggle that you can turn on or off.',
    keywords: ['notifications', 'sms', 'email', 'alerts', 'text', 'preferences', 'manage'],
    userType: 'client',
  },
  {
    id: 'client-branding',
    category: 'branding',
    question: 'Can I customize the look of my dashboard?',
    answer: 'You can switch between light and dark mode using the toggle in the sidebar. Your provider may also have set up custom branding (logo, colors) that appears throughout your dashboard. If you want changes to the branding, contact your provider.',
    keywords: ['customize', 'branding', 'look', 'theme', 'colors', 'logo', 'dark mode', 'light mode'],
    userType: 'client',
  },
];

// ── Search function ───────────────────────────────────────────────
export function searchKB(query: string, userType?: 'agency' | 'client'): KBArticle[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return KB_ARTICLES
    .filter(a => !userType || a.userType === userType || a.userType === 'both')
    .map(article => {
      let score = 0;
      const questionLower = article.question.toLowerCase();
      const answerLower = article.answer.toLowerCase();

      // Exact question match
      if (questionLower.includes(q)) score += 10;
      // Keyword match
      article.keywords.forEach(kw => {
        if (q.includes(kw) || kw.includes(q)) score += 5;
      });
      // Word-level matching
      const words = q.split(/\s+/);
      words.forEach(word => {
        if (word.length < 2) return;
        if (questionLower.includes(word)) score += 3;
        if (answerLower.includes(word)) score += 1;
        if (article.keywords.some(kw => kw.includes(word))) score += 2;
      });

      return { article, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(r => r.article);
}

// ── Full KB text for AI chatbot context ────────────────────────────
export function getKBContextText(): string {
  return KB_ARTICLES.map(a =>
    `Q: ${a.question}\nA: ${a.answer}`
  ).join('\n\n');
}