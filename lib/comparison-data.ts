// ============================================================================
// COMPARISON PAGE DATA: the single source of truth for every "VoiceAI Connect
// vs X" page. VoiceAI Connect's own pricing lives here ONCE (VAC_PRICING) so the
// comparison pages can never drift from reality the way the old hardcoded pages
// did. Competitor facts are kept accurate as of the `updated` date and leaned
// toward durable, structural positioning rather than volatile price tags.
// ============================================================================

// VoiceAI Connect agency pricing. Matches the platform and the support
// knowledge base. Update here and every comparison page follows.
export const VAC_PRICING = {
  trialDays: 14,
  free: { name: 'Free', platform: 0, perClient: 29.99, perMin: 0.12 },
  pro: { name: 'Professional', platform: 99, perClient: 9.99, perMin: 0.10 },
  scale: { name: 'Scale', platform: 499, perClient: 0, perMin: 0.05 },
};

export interface CompareRow {
  label: string;
  vac: string;
  them: string;
  vacGood?: boolean; // default true
  themGood?: boolean; // default false
}

export interface Competitor {
  slug: string; // url segment, no leading slash
  name: string; // "Bland AI"
  category: string; // short label under the name
  metaTitle: string;
  metaDescription: string;
  heroSub: string; // the positioning paragraph
  whatVac: string; // "what it is" card, VoiceAI Connect
  whatThem: string; // "what it is" card, competitor
  vacBestFor: string;
  themBestFor: string;
  rows: CompareRow[];
  chooseThem: string;
  chooseVac: string;
  faqs: { q: string; a: string }[];
  updated: string; // "November 2026"
}

const VAC_WHAT =
  'A white-label platform for starting and running an AI receptionist agency. You brand it as your own, onboard local businesses as clients in under a minute, set your own prices, and keep the margin.';
const VAC_BEST_FOR =
  'Agencies and operators who want to sell AI receptionists to local businesses under their own brand.';

// Shared row dimensions, filled per competitor. Keeping the same labels in the
// same order across all pages is what makes the table read as one system.
function rows(them: Partial<Record<string, [string, boolean]>>): CompareRow[] {
  const g = (k: string): [string, boolean] => them[k] || ['', false];
  return [
    { label: 'What it is', vac: 'White-label platform to resell AI receptionists', them: g('what')[0], vacGood: true, themGood: g('what')[1] },
    { label: 'Resell under your own brand', vac: 'Built for it, invisible white-label', them: g('resell')[0], vacGood: true, themGood: g('resell')[1] },
    { label: 'Dashboard for each client (their calls, recordings, transcripts)', vac: 'Included for every client', them: g('dash')[0], vacGood: true, themGood: g('dash')[1] },
    { label: 'Time to get a client live', vac: 'Under 60 seconds, automatic', them: g('onboard')[0], vacGood: true, themGood: g('onboard')[1] },
    { label: 'Built-in leads CRM and outreach templates', vac: 'Included', them: g('crm')[0], vacGood: true, themGood: g('crm')[1] },
    { label: 'Client payments (keep 100% via Stripe Connect)', vac: 'Included, paid directly to you', them: g('pay')[0], vacGood: true, themGood: g('pay')[1] },
    { label: 'Technical skill needed', vac: 'None, point and click', them: g('tech')[0], vacGood: true, themGood: g('tech')[1] },
    { label: 'Pricing', vac: 'Flat fee from $99/mo, no revenue share', them: g('price')[0], vacGood: true, themGood: g('price')[1] },
  ];
}

export const COMPETITORS: Record<string, Competitor> = {
  'bland-ai': {
    slug: 'voiceai-connect-vs-bland-ai',
    name: 'Bland AI',
    category: 'Developer voice API',
    metaTitle: 'VoiceAI Connect vs Bland AI',
    metaDescription:
      'VoiceAI Connect vs Bland AI: a ready-to-sell white-label receptionist business with client dashboards and 60-second onboarding, versus a raw developer voice API you build on yourself.',
    heroSub:
      'Bland AI hands developers raw voice infrastructure to build on. VoiceAI Connect hands you the finished business: your brand, client dashboards, billing, and onboarding, ready to sell. If you have engineers and want to build a product, look at Bland. If you want to sell AI receptionists as a service, this is built for that.',
    whatVac: VAC_WHAT,
    whatThem:
      'A developer-first API for building AI phone agents. You get the raw voice infrastructure and write the code around it.',
    vacBestFor: VAC_BEST_FOR,
    themBestFor: 'Engineering teams building their own custom voice product.',
    rows: rows({
      what: ['Developer API for building voice agents', false],
      resell: ['No, it is infrastructure to build on', false],
      dash: ['Only if your team builds one', false],
      onboard: ['A development project', false],
      crm: ['No', false],
      pay: ['Not built in', false],
      tech: ['Developers required', false],
      price: ['Start free, Build $299/mo, Scale $499/mo, plus per minute', false],
    }),
    chooseThem:
      'Choose Bland AI if you have developers and you are building your own voice product from the ground up, with full control over every call path.',
    chooseVac:
      'Choose VoiceAI Connect if you want to start selling AI receptionists now, under your own brand, without writing code or wiring up infrastructure.',
    faqs: [
      { q: 'Is VoiceAI Connect built on an API like Bland?', a: 'VoiceAI Connect is the whole business layer, not just the calling. You get branded client dashboards, onboarding, billing, a leads CRM, and the receptionist itself, all point and click. There is nothing to build.' },
      { q: 'Do I need developers to use VoiceAI Connect?', a: 'No. If you can use Instagram, you can run it. Onboarding a client, branding the platform, and setting prices are all done from the dashboard.' },
      { q: 'Can I resell to clients with Bland AI?', a: 'Bland gives you the raw API. Anything a client would log into, see, or be billed through, you would have to design and build yourself. VoiceAI Connect ships all of that.' },
      { q: 'What does VoiceAI Connect cost?', a: 'A flat platform fee: Free to start, Professional at $99 a month, or Scale at $499 a month. No revenue share, no per-client surprises beyond a small flat per-client fee.' },
    ],
    updated: 'November 2026',
  },

  'synthflow': {
    slug: 'voiceai-connect-vs-synthflow',
    name: 'Synthflow',
    category: 'Enterprise voice-AI platform',
    metaTitle: 'VoiceAI Connect vs Synthflow',
    metaDescription:
      'VoiceAI Connect vs Synthflow: a self-serve white-label platform to resell AI receptionists from $99/mo, versus an enterprise voice-AI platform that moved to sales-led pricing.',
    heroSub:
      'Synthflow moved upmarket in 2026: its old self-serve monthly plans were retired and pricing is now sales-led enterprise. It is a platform you buy to run AI calls for your own business. VoiceAI Connect is a self-serve platform you use to sell AI receptionists to other businesses under your brand, starting at $99 a month. Different goal, different price.',
    whatVac: VAC_WHAT,
    whatThem:
      'A voice-AI agent platform that moved to enterprise in 2026. Its older self-serve plans were retired, and pricing is now sales-led.',
    vacBestFor: VAC_BEST_FOR,
    themBestFor: 'Larger companies deploying voice AI for their own operations on an annual contract.',
    rows: rows({
      what: ['Enterprise voice-AI agent platform', false],
      resell: ['Limited, enterprise white-label', false],
      dash: ['Not a per-client reseller dashboard', false],
      onboard: ['Enterprise onboarding', false],
      crm: ['No', false],
      pay: ['Not built in', false],
      tech: ['Low-code, but enterprise-oriented', false],
      price: ['Sales-led enterprise, old self-serve plans retired', false],
    }),
    chooseThem:
      'Choose Synthflow if you are a larger company deploying voice AI across your own operations and you are comfortable with an enterprise contract.',
    chooseVac:
      'Choose VoiceAI Connect if you want to resell AI receptionists to local businesses, self-serve, affordably, and under your own brand.',
    faqs: [
      { q: 'Can I still get Synthflow cheaply like the old plans?', a: 'Synthflow retired its older self-serve monthly plans and moved to sales-led enterprise pricing in 2026. If you found it through an older review quoting low monthly prices, those plans are gone for new signups.' },
      { q: 'Is VoiceAI Connect for enterprises too?', a: 'It is built for agencies and operators reselling to local businesses, not for a single enterprise deploying internally. You start for free and grow into Professional or Scale as you add clients.' },
      { q: 'Does VoiceAI Connect white-label like Synthflow?', a: 'Yes, and it is the whole point. Your logo, colors, and domain across the client signup page, client dashboard, marketing site, and emails. Clients never see VoiceAI Connect.' },
      { q: 'What does VoiceAI Connect cost?', a: 'A flat fee: Free to start, Professional at $99 a month, or Scale at $499 a month, with no revenue share.' },
    ],
    updated: 'November 2026',
  },

  'autocalls': {
    slug: 'blog/voiceai-connect-vs-autocalls',
    name: 'Autocalls',
    category: 'AI calling platform',
    metaTitle: 'VoiceAI Connect vs Autocalls',
    metaDescription:
      'VoiceAI Connect vs Autocalls: a purpose-built platform to resell AI receptionists with a dashboard for every client, versus a broad inbound, outbound, and cold-calling tool with a white-label tier.',
    heroSub:
      'Autocalls is a broad AI-calling tool: inbound, outbound, and cold calling, with a white-label tier added on. VoiceAI Connect does one job well: reselling AI receptionists, with a dashboard every client logs into, a built-in leads CRM, and 60-second onboarding. A scalpel, not a Swiss Army knife.',
    whatVac: VAC_WHAT,
    whatThem:
      'A self-serve, no-code platform for inbound and outbound AI calling, including cold calling, with an agency white-label tier.',
    vacBestFor: VAC_BEST_FOR,
    themBestFor: 'Running your own inbound, outbound, and cold-calling campaigns.',
    rows: rows({
      what: ['Broad AI calling platform (inbound, outbound, cold)', false],
      resell: ['Yes, via a white-label tier', true],
      dash: ['No dashboard each client logs into', false],
      onboard: ['Manual setup per use case', false],
      crm: ['No dedicated leads CRM', false],
      pay: ['Not built in for client billing', false],
      tech: ['Low, no-code', true],
      price: ['Tiered self-serve plans plus a white-label tier', false],
    }),
    chooseThem:
      'Choose Autocalls if you want one tool to run your own inbound, outbound, and cold-calling campaigns, and white-label reselling is a secondary need.',
    chooseVac:
      'Choose VoiceAI Connect if reselling AI receptionists is the business, and you want a dashboard for every client, a leads CRM, and clients live in under a minute.',
    faqs: [
      { q: 'Does Autocalls do everything VoiceAI Connect does?', a: 'Autocalls is broader on calling types (it does cold calling and outbound campaigns), but it is not purpose-built for reselling receptionists. VoiceAI Connect gives each client their own branded dashboard, a leads CRM, and automatic 60-second onboarding.' },
      { q: 'Can my clients log in and see their own calls?', a: 'With VoiceAI Connect, yes, every client gets their own branded dashboard with recordings, transcripts, and summaries. That client-facing layer is what Autocalls does not focus on.' },
      { q: 'Which is easier to start an agency with?', a: 'VoiceAI Connect is built as the agency business itself: branding, client onboarding, payments, and outreach are all included and point and click.' },
      { q: 'What does VoiceAI Connect cost?', a: 'A flat fee: Free to start, Professional at $99 a month, or Scale at $499 a month, with no revenue share.' },
    ],
    updated: 'November 2026',
  },

  'echowin': {
    slug: 'blog/voiceai-connect-vs-echowin',
    name: 'echowin',
    category: 'AI receptionist for one business',
    metaTitle: 'VoiceAI Connect vs echowin',
    metaDescription:
      'VoiceAI Connect vs echowin: the white-label platform to resell AI receptionists to many clients under your brand, versus an AI answering service a single business runs for itself.',
    heroSub:
      'echowin is a receptionist you run for your own business, billed on usage credits. VoiceAI Connect is the platform you use to run receptionists for many businesses at once, each with their own branded dashboard, under your agency name. echowin answers your phone. VoiceAI Connect is how you sell answering your clients phones.',
    whatVac: VAC_WHAT,
    whatThem:
      'An AI answering service a single business uses to handle its own calls, billed on usage credits.',
    vacBestFor: VAC_BEST_FOR,
    themBestFor: 'A single business that wants to answer its own phones with AI.',
    rows: rows({
      what: ['AI receptionist for a single business', false],
      resell: ['No, built for one business', false],
      dash: ['For your own business, not per client', false],
      onboard: ['Set up for your own business', false],
      crm: ['No leads CRM for finding clients', false],
      pay: ['Not built for billing your own clients', false],
      tech: ['Low', true],
      price: ['From about $49/mo on usage credits', false],
    }),
    chooseThem:
      'Choose echowin if you run one business and simply want AI to answer your own phones.',
    chooseVac:
      'Choose VoiceAI Connect if you want to sell AI receptionists to other businesses, each under your brand, and run it as an agency.',
    faqs: [
      { q: 'Can I resell echowin to clients?', a: 'echowin is built for a single business to answer its own calls. VoiceAI Connect is built the other way around: you resell receptionists to many clients, each with their own branded dashboard and billing, under your agency name.' },
      { q: 'Do my clients get their own login?', a: 'With VoiceAI Connect, yes. Every client logs into their own branded dashboard to see calls, recordings, transcripts, and summaries.' },
      { q: 'Is VoiceAI Connect more expensive?', a: 'It is priced for an agency, not a single phone line: a flat platform fee from $99 a month plus a small per-client fee, and you set and keep whatever you charge your clients.' },
      { q: 'What does VoiceAI Connect cost?', a: 'Free to start, Professional at $99 a month, or Scale at $499 a month, with no revenue share.' },
    ],
    updated: 'November 2026',
  },
};
