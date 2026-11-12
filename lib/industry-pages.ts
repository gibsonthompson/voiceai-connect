// ============================================================================
// lib/industry-pages.ts
// ----------------------------------------------------------------------------
// Industry-specific landing pages for each agency's white-label marketing site
// (e.g. covercall.ca/auto, /medspa, /law). Each page reuses the agency's own
// branding and template, but overlays industry-specific copy: headline, pain
// points, the sample call, and FAQs.
//
// SEO design (why these do not cannibalize each other or the homepage):
//   - Each page targets a DISTINCT long-tail intent ("AI receptionist for auto
//     shops" vs "...for med spas" vs "...for law firms"), so they never compete
//     for the same query as each other or the homepage.
//   - Each page carries GENUINELY unique content (not word-swaps): its own
//     headline, problems, sample call, and FAQs. That is what separates a real
//     page from a doorway page Google devalues.
//   - The route emits a self-referencing canonical and a unique title/meta, so
//     each page stands on its own instead of collapsing to the homepage.
//
// Adding a vertical is one entry below. Pure data (no React/node imports) so it
// is safe to import from edge middleware for slug routing.
// ============================================================================

export interface IndustryPageProblem {
  title: string;
  description: string;
}

export interface IndustryPageFaq {
  question: string;
  answer: string;
}

export interface IndustryPage {
  // URL slug on the agency host, e.g. 'auto' -> covercall.ca/auto
  slug: string;
  // Canonical industry value (matches lib/industries.ts + backend mapping).
  industryValue: string;
  // Human label used in copy and meta.
  label: string;
  // SEO title + description. agencyName is woven in so each agency's page is not
  // byte-identical to another agency's page for the same industry.
  metaTitle: (agencyName: string) => string;
  metaDescription: (agencyName: string) => string;
  // Hero headline, as separate lines (templates render each on its own line).
  headline: string[];
  subheadline: string;
  // Industry-specific pain points (replace the generic homepage ones).
  problems: IndustryPageProblem[];
  // The example call shown in the product mockup, tailored to the vertical.
  sampleCall: { customerName: string; service: string; summary: string };
  // Industry-specific FAQs (unique content that keeps the page out of doorway
  // territory). Answers are plain text; templates render them safely.
  faqs: IndustryPageFaq[];
}

const PAGES: Record<string, IndustryPage> = {
  auto: {
    slug: 'auto',
    industryValue: 'automotive',
    label: 'Auto Repair Shops',
    metaTitle: (a) => `AI Receptionist for Auto Repair Shops | ${a}`,
    metaDescription: (a) =>
      `${a} answers every call for your auto shop, books appointments, and texts you the details, so you never miss a customer while you are under a hood.`,
    headline: ['The AI Receptionist', 'for Auto Shops'],
    subheadline: 'Your phone keeps ringing while you are under the hood. We answer it.',
    problems: [
      { title: 'Calls Missed in the Bay', description: 'You are elbow-deep in an engine when the phone rings. Answer and stop the job, or let it go to voicemail and lose the customer.' },
      { title: 'Quotes That Never Come Back', description: 'Someone calls asking about a brake job, gets voicemail, and books with the shop down the road before you ever hear from them.' },
      { title: 'After-Hours Breakdowns', description: 'A stranded driver calls at 7pm needing a tow or a next-day slot. By morning they have already called someone else.' },
    ],
    sampleCall: {
      customerName: 'Marcus Reed',
      service: 'Brake inspection',
      summary: 'Caller heard grinding when braking and wanted the soonest appointment for an inspection. Asked for a rough estimate and a callback.',
    },
    faqs: [
      { question: 'Can it book service appointments?', answer: 'Yes. It checks your calendar, offers open slots, and books the appointment on the call, then texts you the details.' },
      { question: 'Can it quote repair prices?', answer: 'It shares the prices you have set and, for anything custom, takes the details and tells the caller your team will follow up with an exact quote.' },
      { question: 'What about towing or roadside calls after hours?', answer: 'It answers 24/7, captures the caller and the situation, flags anything urgent, and texts you right away so you can decide how to respond.' },
      { question: 'Does it work with my existing phone number?', answer: 'Yes. Forward your current line to the AI number, or use the AI number as a dedicated line. Nothing else about your setup has to change.' },
    ],
  },

  medspa: {
    slug: 'medspa',
    industryValue: 'med_spa',
    label: 'Med Spas & Aesthetic Clinics',
    metaTitle: (a) => `AI Receptionist for Med Spas & Aesthetic Clinics | ${a}`,
    metaDescription: (a) =>
      `${a} answers every call for your med spa, books consultations, and texts you the details, with the discretion and polish your clients expect.`,
    headline: ['The AI Receptionist', 'for Med Spas'],
    subheadline: 'Book more consultations without pulling a provider off a client.',
    problems: [
      { title: 'Calls During Treatments', description: 'Your front desk is helping a client when the phone rings. A new lead asking about Botox goes to voicemail and never calls back.' },
      { title: 'Consultations That Slip Away', description: 'Someone ready to book a consultation calls after hours, gets voicemail, and the excitement is gone by the next morning.' },
      { title: 'The Same Questions, All Day', description: 'Pricing, membership, what you offer, your team fields the same calls instead of focusing on clients in the chair.' },
    ],
    sampleCall: {
      customerName: 'Olivia Chen',
      service: 'Consultation booking',
      summary: 'Caller was interested in a first filler treatment and wanted to book a consultation. Asked about pricing and whether a provider reviews everything first.',
    },
    faqs: [
      { question: 'Can it book consultations?', answer: 'Yes. For most new treatments it books a consultation with a provider, checks your calendar for open times, and texts you the details.' },
      { question: 'Does it give medical advice?', answer: 'No. It never advises on whether a treatment is right for someone and never quotes a dose. It books a consultation with a licensed provider instead.' },
      { question: 'Is it discreet with what callers share?', answer: 'Yes. It does not repeat back or record medical details. If a caller starts sharing history, it lets them know the provider will go over that at the visit.' },
      { question: 'Can it explain pricing and memberships?', answer: 'It shares the general pricing and membership details you set, and for custom treatment plans it books a consultation for an exact quote.' },
    ],
  },

  law: {
    slug: 'law',
    industryValue: 'legal',
    label: 'Law Firms',
    metaTitle: (a) => `AI Receptionist for Law Firms | ${a}`,
    metaDescription: (a) =>
      `${a} answers every call for your firm, screens and intakes new matters, and texts you the details, so a real voice greets every potential client.`,
    headline: ['The AI Receptionist', 'for Law Firms'],
    subheadline: 'Every potential client reaches a professional, not a voicemail.',
    problems: [
      { title: 'First Impressions Lost to Voicemail', description: 'A potential client with a time-sensitive matter calls, reaches voicemail, and calls the next firm on their list instead.' },
      { title: 'Intake That Eats the Day', description: 'Your staff stops billable work to take the same intake details over and over, or those calls go unanswered.' },
      { title: 'After-Hours Inquiries Gone Cold', description: 'Someone searches for help at 9pm, finds your firm, calls, and gets nothing. By morning they have retained someone else.' },
    ],
    sampleCall: {
      customerName: 'Daniel Foster',
      service: 'New client intake',
      summary: 'Caller was in a minor car accident last week and wanted to speak with an attorney. The AI took their name, contact details, and a short description of the matter.',
    },
    faqs: [
      { question: 'Does it give legal advice?', answer: 'No. It never offers legal advice or opinions. It greets the caller, collects the basics of their matter, and hands off to your team.' },
      { question: 'Can it screen and intake new matters?', answer: 'Yes. It walks callers through the intake questions you set, captures a clean summary, and texts it to you so you can follow up quickly.' },
      { question: 'Is caller information kept confidential?', answer: 'It collects only what you ask it to and sends it straight to you. It does not read sensitive details back on the call.' },
      { question: 'Can it route urgent calls?', answer: 'Yes. You set the rules for what counts as urgent, and it can flag or transfer those calls while taking a message on everything else.' },
    ],
  },
};

export function getIndustryPage(slug: string): IndustryPage | null {
  if (!slug) return null;
  return PAGES[slug.toLowerCase()] || null;
}

// Slugs the middleware recognizes so it can route them to the industry page.
export const INDUSTRY_PAGE_SLUGS: string[] = Object.keys(PAGES);

// Slug + label pairs for UI pickers (e.g. the in-context editor's page switcher).
export const INDUSTRY_PAGE_LIST: { slug: string; label: string }[] = Object.values(PAGES).map((p) => ({ slug: p.slug, label: p.label }));
