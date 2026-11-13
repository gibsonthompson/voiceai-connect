// ============================================================================
// lib/industry-pages.ts
// ----------------------------------------------------------------------------
// Industry-specific landing pages for each agency's white-label marketing site
// (e.g. covercall.ca/auto, /medspa, /law). Built-in pages (auto, medspa, law)
// render through a dedicated, content-rich layout (components/IndustryLandingPage),
// NOT the homepage template, so each one is a substantial standalone page rather
// than the homepage with a few swapped lines.
//
// SEO design:
//   - Each page targets a DISTINCT long-tail intent ("AI receptionist for auto
//     shops" vs "...for med spas" vs "...for law firms").
//   - The MAIN content is genuinely unique per vertical: a real intro, the exact
//     calls that vertical gets, what the AI does on those calls, an industry
//     example call, how it fits the business's workflow, the economics, and a
//     deep industry FAQ. Only the chrome (nav, pricing, footer) repeats, which
//     is expected boilerplate.
//   - Unique title + meta description + self-referencing canonical + FAQPage
//     schema per page.
//
// Honesty: direct integrations with Jane / Vagaro / Boulevard / Fresha / Clio /
// Tekmetric / Shopmonkey are NOT built yet, so no page claims a live sync. The
// real mechanism is calendar booking plus a clean texted handoff, and that is
// how the "fits your workflow" section is written. Industry tools are named only
// as the systems the business already runs on, never as integrations.
//
// Pure data (no React/node imports) so it is safe to import from edge middleware
// for slug routing. Adding a vertical is one entry below.
// ============================================================================

export interface IndustryPageFaq {
  question: string;
  answer: string;
}

// A named call type the vertical gets, or a capability, or a workflow note.
export interface IndustryItem {
  title: string;
  description: string;
}

export interface IndustryTranscriptLine {
  speaker: 'caller' | 'ai';
  text: string;
}

export interface IndustryStat {
  value: string;
  label: string;
}

export interface IndustrySection {
  heading: string;
  intro: string;
  items: IndustryItem[];
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

  // ── Hero ──
  headline: string[];        // rendered each line on its own
  subheadline: string;
  heroBullets: string[];     // 3 short proof/value chips under the hero CTA

  // ── Unique body (the SEO weight) ──
  intro: string[];                 // 1-2 paragraphs, unique per vertical
  scenarios: IndustrySection;      // "The calls your [vertical] gets"
  capabilities: IndustrySection;   // "What the AI does on every call"
  exampleCall: {                   // an example call written for this vertical
    heading: string;
    callerName: string;
    context: string;
    transcript: IndustryTranscriptLine[];
    summary: string;
  };
  workflow: IndustrySection;       // "How it fits the way you already work"
  economics: {                     // ROI in this vertical's own numbers
    heading: string;
    body: string;
    stats: IndustryStat[];
  };
  compliance?: {                   // HIPAA / confidentiality where it matters
    heading: string;
    body: string;
  };
  faqs: IndustryPageFaq[];         // 6-10 industry questions
  closing: {                       // final CTA section copy
    heading: string;
    body: string;
  };
}

// Serializable subset safe to pass from a Server Component to a Client Component.
// The metaTitle/metaDescription members are functions (used only server-side in
// generateMetadata) and CANNOT cross the RSC boundary, so they are omitted here.
export type IndustryPageData = Omit<IndustryPage, 'metaTitle' | 'metaDescription'> & {
  // Set by the route so the client knows a built-in (rich) page from a thin
  // agency-created custom page.
  custom?: boolean;
};

const PAGES: Record<string, IndustryPage> = {
  // ==========================================================================
  // AUTO REPAIR SHOPS
  // ==========================================================================
  auto: {
    slug: 'auto',
    industryValue: 'automotive',
    label: 'Auto Repair Shops',
    metaTitle: (a) => `AI Receptionist for Auto Repair Shops | ${a}`,
    metaDescription: (a) =>
      `${a} answers every call for your auto shop, quotes from your pricing, books appointments, and texts you the details, so a ringing phone never pulls you out from under a hood again.`,
    headline: ['The AI Receptionist', 'for Auto Shops'],
    subheadline: 'Your bays are full and the phone keeps ringing. It answers every call, books the work, and texts you what matters.',
    heroBullets: ['Answers while you are under the hood', 'Books straight into your calendar', 'Texts you every call in seconds'],
    intro: [
      'A busy shop loses more work to the phone than to any competitor. When both lifts are occupied and a tech is on the other line, an inbound call is a decision: stop a job to answer it, or let it ring and hope they leave a message. Most people do not leave a message. They call the next shop on the list.',
      'This is an AI receptionist built for how a repair shop actually runs. It answers on the first ring, every time, in a natural voice. It handles the quote question, books the drop-off, captures the year, make, model, and symptom, and texts you a clean summary before the caller has pulled out of the parking lot. You stay on the car in front of you and still catch the one on the phone.',
    ],
    scenarios: {
      heading: 'The Calls Your Shop Gets All Day',
      intro: 'Every one of these comes in while someone is busy. The AI takes them without anyone putting a wrench down.',
      items: [
        { title: 'Price and Estimate Questions', description: 'What does a brake job run, how much for an oil change, can you look at a check-engine light. It answers from the pricing you set and, for anything that needs eyes on the car, takes the details and promises a callback with an exact number.' },
        { title: 'Appointment Scheduling and Drop-Offs', description: 'It offers your open slots, books the appointment, and notes whether the customer is waiting or dropping off, so the morning is not a pile of surprises.' },
        { title: 'Repair Status Checks', description: 'A customer calls to ask if their car is ready. It takes the name and vehicle, logs the question, and texts you so you can answer without the front counter playing phone tag.' },
        { title: 'Tows and After-Hours Breakdowns', description: 'A stranded driver calls at 7pm. It captures the location, the vehicle, and the situation, flags it as urgent, and texts you immediately so a next-day slot or a tow referral does not wait until morning.' },
        { title: 'Parts, Warranty, and General Questions', description: 'Hours, location, whether you work on a particular make, whether a repair is under warranty. It answers the routine ones and routes the rest to you with the details already captured.' },
      ],
    },
    capabilities: {
      heading: 'What It Does on Every Call',
      intro: 'Not a voicemail box and not a generic phone tree. It does the job a sharp front-counter person would.',
      items: [
        { title: 'Quotes From Your Price List', description: 'It shares the prices you have set for common services and never makes a number up. Anything custom becomes a callback with the details in hand.' },
        { title: 'Captures the Vehicle and the Symptom', description: 'Year, make, model, mileage if offered, and what the car is doing. You get a summary you can act on, not a name and a shrug.' },
        { title: 'Books Into Your Calendar', description: 'It checks real availability on the calendar you connect, offers open times, and books on the call. No double-booked bays.' },
        { title: 'Texts You the Moment the Call Ends', description: 'Caller, vehicle, reason, and whether it is urgent, in a text, within seconds. The record is also in your dashboard with the full transcript and recording.' },
        { title: 'Flags the Urgent Ones', description: 'You set what counts as urgent (a tow, a safety issue, a fleet account). Those get flagged or transferred while everything else is taken as a message.' },
      ],
    },
    exampleCall: {
      heading: 'A Real Call, Start to Finish',
      callerName: 'Marcus Reed',
      context: 'Inbound call at 2:40pm. Both techs are on jobs.',
      transcript: [
        { speaker: 'ai', text: 'Thanks for calling. How can I help you today?' },
        { speaker: 'caller', text: 'Yeah, my brakes are grinding pretty bad. How soon can you look at it?' },
        { speaker: 'ai', text: 'I can get you in. Is this grinding when you brake, and is it the front, the back, or not sure?' },
        { speaker: 'caller', text: 'Front I think, when I press the pedal. What is a brake job gonna cost me?' },
        { speaker: 'ai', text: 'Front brake service starts at one eighty, and we will confirm once a tech sees the wear. What year and make is the vehicle?' },
        { speaker: 'caller', text: '2018 Honda Accord.' },
        { speaker: 'ai', text: 'Got it. I have tomorrow at 8am or 1pm open. Which works?' },
        { speaker: 'caller', text: '8am.' },
        { speaker: 'ai', text: 'Booked for 8am tomorrow, a 2018 Accord for a front brake inspection. You will get a text to confirm. Anything else?' },
      ],
      summary: 'Grinding front brakes on a 2018 Honda Accord. Booked tomorrow 8am for inspection. Quoted $180 starting, to confirm after teardown.',
    },
    workflow: {
      heading: 'Fits the Way You Already Run the Shop',
      intro: 'No new software to learn and nothing to rip out. It works with what you have.',
      items: [
        { title: 'Keeps Your Number', description: 'Forward your current shop line to the AI number, or run the AI number as a dedicated line. Nothing about how customers reach you changes.' },
        { title: 'Books Through Your Calendar', description: 'Connect the calendar your shop runs on and the AI books real open times into it. Whether you manage tickets in Tekmetric, Shopmonkey, or a whiteboard, the appointment and the details land where you can log them.' },
        { title: 'Hands You a Clean Summary', description: 'Every call comes to you as a text and a dashboard entry with the vehicle, the symptom, and the ask, ready to drop into your shop management system.' },
      ],
    },
    economics: {
      heading: 'What One Missed Call Actually Costs',
      body: 'The average repair order is a few hundred dollars, and a brake or suspension job can clear five hundred or more. One missed call a day that books somewhere else is real money walking out the door every week, far more than the receptionist costs. The phone does not stop ringing because the shop is busy. That is exactly when it rings most.',
      stats: [
        { value: '$300+', label: 'Average repair order' },
        { value: '1 call/day', label: 'Pays for itself many times over' },
        { value: '24/7', label: 'Every call answered, even after close' },
      ],
    },
    faqs: [
      { question: 'Can it actually book service appointments?', answer: 'Yes. It checks the calendar you connect, offers your real open slots, books on the call, and texts you the details. It notes whether the customer is waiting or dropping off.' },
      { question: 'Can it quote repair prices?', answer: 'It shares the prices you set for common services. For anything that needs a tech to see the car, it takes the vehicle and symptom and tells the caller your team will follow up with an exact quote.' },
      { question: 'What happens with a tow or breakdown after hours?', answer: 'It answers 24/7, captures the location, vehicle, and situation, flags it as urgent, and texts you right away so you can decide how to respond instead of finding out in the morning.' },
      { question: 'Will it know what year and make the car is?', answer: 'It asks. Every summary includes the vehicle details and the symptom the caller described, so you are never calling back blind.' },
      { question: 'Does it work with my current phone number?', answer: 'Yes. Forward your existing line to the AI number, or use the AI number as a dedicated line. Nothing else about your setup has to change.' },
      { question: 'What if a caller asks something it cannot answer?', answer: 'It takes the question and the caller details and texts them to you so you can follow up. It never guesses or makes up a price or a promise.' },
      { question: 'Can it handle calls in Spanish?', answer: 'Yes. It detects the language the caller is speaking and switches automatically, then sends your summary in English.' },
      { question: 'Does it sound like a robot?', answer: 'No. It speaks naturally and most callers do not realize it is an AI. If someone asks directly, it is honest about it.' },
    ],
    closing: {
      heading: 'Stop Losing Jobs to Voicemail',
      body: 'Every call answered, every quote captured, every appointment booked, while you stay on the car in front of you. Start a free trial and hear it on your own line.',
    },
  },

  // ==========================================================================
  // MED SPAS & AESTHETIC CLINICS
  // ==========================================================================
  medspa: {
    slug: 'medspa',
    industryValue: 'med_spa',
    label: 'Med Spas & Aesthetic Clinics',
    metaTitle: (a) => `AI Receptionist for Med Spas & Aesthetic Clinics | ${a}`,
    metaDescription: (a) =>
      `${a} answers every call for your med spa, books consultations, handles pricing and membership questions, and texts you the details, with the discretion and polish your clients expect.`,
    headline: ['The AI Receptionist', 'for Med Spas'],
    subheadline: 'Book more consultations without pulling a provider off a client. Every call answered with the polish your brand trades on.',
    heroBullets: ['Books consults around the clock', 'Never gives medical advice', 'Discreet with everything callers share'],
    intro: [
      'In an aesthetic practice the phone is the top of the funnel, and the front desk is almost always mid-conversation with the client in the chair. A new lead calling to ask about Botox or a first filler consult is worth real money over a lifetime of visits, and when that call hits voicemail the excitement is gone by the time anyone calls back.',
      'This is an AI receptionist built for how a med spa runs. It answers every call in a warm, on-brand voice, books consultations against your real availability, handles the pricing and membership questions your team hears forty times a day, and does it all with discretion. It never gives medical advice and never quotes a dose. It books the consult and lets your provider do the clinical part.',
    ],
    scenarios: {
      heading: 'The Calls Your Front Desk Juggles',
      intro: 'These come in while your team is with a client. The AI handles them so no one has to choose between the phone and the person in front of them.',
      items: [
        { title: 'New Consultation Inquiries', description: 'Someone interested in their first treatment calls to ask how it works and whether they can book. It explains the consult, offers times, and books it, so a warm lead never cools off in voicemail.' },
        { title: 'Pricing and Membership Questions', description: 'What does a syringe of filler run, do you have a membership, what is included. It shares the pricing and membership details you set and books a consult for anything that needs a custom plan.' },
        { title: 'Booking, Rescheduling, and Cancellations', description: 'It manages the calendar so a last-minute reschedule does not tie up your front desk, and it captures cancellations cleanly so the slot can be refilled.' },
        { title: 'Post-Treatment and Aftercare Calls', description: 'When a client calls with a question after a treatment, it takes the details and routes it straight to your provider rather than answering anything clinical itself.' },
        { title: 'The Same Questions, All Day', description: 'Hours, location, what you offer, whether you carry a particular treatment. It answers the routine ones so your team stays focused on the client in the room.' },
      ],
    },
    capabilities: {
      heading: 'What It Does on Every Call',
      intro: 'Built for a practice where tone and discretion are part of the product.',
      items: [
        { title: 'Books Consultations, Not Diagnoses', description: 'For any new treatment it books a consultation with a provider. It never advises whether a treatment is right for someone and never quotes a dose or an outcome.' },
        { title: 'Handles Pricing and Memberships', description: 'It shares the general pricing and membership details you set, and for custom treatment plans it books a consult for an exact quote. Callers get a straight answer, not a runaround.' },
        { title: 'Stays Discreet', description: 'It does not read sensitive details back on the call. If a caller starts sharing history, it lets them know the provider will go over that at the visit, and the details go straight to you.' },
        { title: 'Books Into Your Calendar', description: 'It checks real availability and books on the call, so a consult is locked in while the caller is still interested.' },
        { title: 'Texts You Every Lead', description: 'Caller, interest, and what they asked, in a text the moment the call ends, plus a full record in your dashboard. No lead sits unseen overnight.' },
      ],
    },
    exampleCall: {
      heading: 'A Real Call, Start to Finish',
      callerName: 'Olivia Chen',
      context: 'Inbound call at 11:15am. The front desk is checking in a client.',
      transcript: [
        { speaker: 'ai', text: 'Thank you for calling. How can I help you today?' },
        { speaker: 'caller', text: 'Hi, I have been thinking about getting lip filler but I have never done anything like this. Is that something you do?' },
        { speaker: 'ai', text: 'We do, and for a first treatment we always start with a consultation so a provider can talk through what you are looking for. Would you like me to book one?' },
        { speaker: 'caller', text: 'Yeah. Do you have anything this week? And roughly what does filler cost?' },
        { speaker: 'ai', text: 'Filler typically starts around six fifty a syringe, and the provider will confirm a plan at your consult. I have Thursday at 3pm or Friday at 10am open.' },
        { speaker: 'caller', text: 'Friday at 10 works.' },
        { speaker: 'ai', text: 'Booked for Friday at 10am for a filler consultation. You will get a confirmation text. We look forward to seeing you.' },
      ],
      summary: 'New client interested in first-time lip filler. Booked a consultation Friday 10am. Shared starting price, provider to confirm plan at visit.',
    },
    workflow: {
      heading: 'Fits the Way Your Practice Runs',
      intro: 'It wraps around your booking and your brand, not the other way around.',
      items: [
        { title: 'Keeps Your Number and Your Voice', description: 'Forward your current line to the AI number or run it as a dedicated line, with a greeting and tone set to match your brand.' },
        { title: 'Books Through Your Calendar', description: 'Connect the calendar your practice books on and the AI schedules real open times. Whether you run on Jane, Vagaro, Boulevard, or Fresha, the consult and the client details land where your team can log them.' },
        { title: 'Routes the Clinical to Your Provider', description: 'Anything medical, from aftercare to suitability, goes straight to your provider with the details captured. The AI never crosses into clinical ground.' },
      ],
    },
    economics: {
      heading: 'What One Missed Consult Is Worth',
      body: 'A single aesthetic client is not a one-time sale. Between the first treatment, the follow-ups, and a membership, the lifetime value runs into the thousands. One new consultation a week that would have gone to voicemail is a meaningful lift to the top of your funnel, and it costs a fraction of a part-time front-desk hire.',
      stats: [
        { value: '$1,000s', label: 'Lifetime value of one client' },
        { value: '1 consult/wk', label: 'More than covers the cost' },
        { value: '24/7', label: 'Captures leads after you close' },
      ],
    },
    compliance: {
      heading: 'Clinical Lines It Never Crosses',
      body: 'The AI books consultations and shares the pricing and logistics you set. It does not give medical advice, does not quote doses, does not read sensitive details back on the call, and does not decide whether a treatment is right for anyone. Anything clinical is handed to a licensed provider. That boundary is built in, not a setting you have to police.',
    },
    faqs: [
      { question: 'Can it book consultations?', answer: 'Yes. For new treatments it books a consultation with a provider, checks your calendar for real open times, and texts you the details. The client is booked while they are still on the call and still interested.' },
      { question: 'Does it give medical advice?', answer: 'No, by design. It never advises whether a treatment is right for someone and never quotes a dose. It books a consultation with a licensed provider instead.' },
      { question: 'Is it discreet with what callers share?', answer: 'Yes. It does not repeat sensitive details back on the call. If a caller starts sharing history, it lets them know the provider will go over that at the visit, and the details go straight to you.' },
      { question: 'Can it explain pricing and memberships?', answer: 'It shares the general pricing and membership details you set. For custom treatment plans it books a consultation so a provider can give an exact quote.' },
      { question: 'What about aftercare or post-treatment questions?', answer: 'It takes the details and routes them to your provider rather than answering anything clinical. You get the message with everything captured.' },
      { question: 'Will it match our brand tone?', answer: 'Yes. The greeting and voice are set to fit your practice, so callers get the same polish they expect when they walk in.' },
      { question: 'Does it work with our current phone number?', answer: 'Yes. Forward your existing line to the AI number, or use the AI number as a dedicated line. Nothing else changes.' },
      { question: 'Can it handle calls in Spanish?', answer: 'Yes. It detects the caller language and switches automatically, and sends your summary in English.' },
    ],
    closing: {
      heading: 'Never Send a New Client to Voicemail Again',
      body: 'Every consult booked, every price answered, every lead texted to you in seconds, with the discretion your brand runs on. Start a free trial and hear it on your own line.',
    },
  },

  // ==========================================================================
  // LAW FIRMS
  // ==========================================================================
  law: {
    slug: 'law',
    industryValue: 'legal',
    label: 'Law Firms',
    metaTitle: (a) => `AI Receptionist for Law Firms | ${a}`,
    metaDescription: (a) =>
      `${a} answers every call for your firm, runs new-client intake, screens for urgency, and texts you the details, so a real voice greets every potential client instead of a voicemail box.`,
    headline: ['The AI Receptionist', 'for Law Firms'],
    subheadline: 'Every potential client reaches a professional, not a voicemail. Intake handled, urgency screened, details in your inbox before the call ends.',
    heroBullets: ['Answers and intakes 24/7', 'Never gives legal advice', 'Keeps what callers share confidential'],
    intro: [
      'For a law firm the phone is the practice. A potential client with a time-sensitive matter is usually calling more than one firm, and the one that answers with a real, professional voice is the one that gets the consult. Voicemail loses that race almost every time, and the caller has retained someone else by the time anyone listens to the message.',
      'This is an AI receptionist built for how a firm runs. It answers every call professionally, walks a new caller through the intake questions you set, screens for urgency and conflicts the way you tell it to, and texts your team a clean summary so you can follow up fast. It never gives legal advice and never forms a relationship with the caller. It opens the door and hands the matter to you.',
    ],
    scenarios: {
      heading: 'The Calls Your Firm Cannot Afford to Miss',
      intro: 'Each of these is a potential client or a matter in motion. The AI handles them so none of them hit a voicemail box.',
      items: [
        { title: 'New Client Intake', description: 'A potential client calls about a new matter. It greets them, collects the intake details you specify, captures a clean summary, and texts it to your team so the follow-up is fast and informed.' },
        { title: 'Urgency and Conflict Screening', description: 'It asks the screening questions you set, flags anything time-sensitive, and captures the names involved so your team can clear conflicts before a consult is offered.' },
        { title: 'Consultation Scheduling', description: 'For matters that fit your criteria, it offers your real availability and books the consultation on the call, so a hot lead is locked in rather than chased.' },
        { title: 'Existing Client and Case Calls', description: 'When a current client calls, it takes the matter and the question and routes it to the right person with the details already captured, instead of interrupting billable work.' },
        { title: 'After-Hours and Weekend Inquiries', description: 'Someone searching for help at 9pm finds your firm and calls. It answers, runs intake, and texts you, so the inquiry is warm and waiting when you open, not lost to the night.' },
      ],
    },
    capabilities: {
      heading: 'What It Does on Every Call',
      intro: 'It does the front-desk and first-touch intake work, and stops exactly where the lawyering begins.',
      items: [
        { title: 'Runs Your Intake Script', description: 'It walks callers through the intake questions you define for each matter type, captures the answers cleanly, and never improvises the legal part.' },
        { title: 'Screens Without Advising', description: 'It screens for urgency and conflicts using your rules and flags what needs a fast response. It never offers a legal opinion or tells a caller what to do.' },
        { title: 'Books Consultations', description: 'For matters that meet your criteria it checks your calendar and books a consultation on the call, so qualified leads convert instead of cooling off.' },
        { title: 'Keeps It Confidential', description: 'It collects only what you ask it to, sends it straight to your team, and does not read sensitive details back on the call.' },
        { title: 'Texts You the Matter', description: 'Caller, contact details, matter type, urgency, and a clean summary, in a text the moment the call ends, with the full record in your dashboard.' },
      ],
    },
    exampleCall: {
      heading: 'A Real Call, Start to Finish',
      callerName: 'Daniel Foster',
      context: 'Inbound call at 6:50pm, after the office has closed.',
      transcript: [
        { speaker: 'ai', text: 'Thank you for calling. Are you reaching out about a new matter, or is this regarding an existing case?' },
        { speaker: 'caller', text: 'New. I was in a car accident last week and I think I need a lawyer.' },
        { speaker: 'ai', text: 'I am sorry to hear that. I can take down the details so an attorney can follow up with you quickly. Can I start with your full name and the best number to reach you?' },
        { speaker: 'caller', text: 'Daniel Foster, five five five, zero one four eight.' },
        { speaker: 'ai', text: 'Thank you. Briefly, what happened, and were you injured?' },
        { speaker: 'caller', text: 'Someone rear-ended me at a light. My back has been hurting since.' },
        { speaker: 'ai', text: 'Understood. I have everything our team needs to follow up. An attorney will reach out shortly. Is there anything else you would like me to pass along?' },
        { speaker: 'caller', text: 'No, that is it. Thank you.' },
      ],
      summary: 'New potential client, auto accident last week, rear-ended at a light, reports back pain. Contact captured. Flagged as a personal-injury intake for fast attorney follow-up.',
    },
    workflow: {
      heading: 'Fits the Way Your Firm Works',
      intro: 'It sits in front of your practice and hands clean work to your team.',
      items: [
        { title: 'Keeps Your Number', description: 'Forward your main line to the AI number or run it as a dedicated line. Callers reach you the same way they always have.' },
        { title: 'Books Through Your Calendar', description: 'Connect the calendar your firm runs on and the AI books consultations into real open times. Whether you manage matters in Clio or your own system, the intake summary lands where your team can log it.' },
        { title: 'Hands Off a Clean Intake', description: 'Every call comes to you as a text and a dashboard entry with the caller, the matter, the urgency, and the summary, ready to open a file from.' },
      ],
    },
    economics: {
      heading: 'What One Missed Intake Is Worth',
      body: 'A single signed matter can be worth thousands in fees, and in contingency practice a single case can be worth far more. Potential clients call several firms and retain the first one that answers like a professional. Winning even one additional matter a month that would otherwise have gone to voicemail dwarfs what the service costs.',
      stats: [
        { value: '$1,000s', label: 'Value of one signed matter' },
        { value: 'First to answer', label: 'Usually the firm that gets retained' },
        { value: '24/7', label: 'Intake runs after hours and weekends' },
      ],
    },
    compliance: {
      heading: 'Lines It Never Crosses',
      body: 'The AI greets callers, runs the intake you define, and screens using your rules. It does not give legal advice, does not form an attorney-client relationship, and does not read sensitive details back on the call. It collects only what you ask for and sends it straight to your team. The boundary between intake and legal judgment is built in.',
    },
    faqs: [
      { question: 'Does it give legal advice?', answer: 'No, by design. It never offers legal advice or an opinion and never forms an attorney-client relationship. It greets the caller, runs your intake, and hands the matter to your team.' },
      { question: 'Can it run new-client intake?', answer: 'Yes. It walks callers through the intake questions you set for each matter type, captures a clean summary, and texts it to your team so you can follow up quickly.' },
      { question: 'Can it screen for conflicts and urgency?', answer: 'It asks the screening questions you define, captures the names involved so your team can clear conflicts, and flags time-sensitive matters for a fast response.' },
      { question: 'Is caller information kept confidential?', answer: 'Yes. It collects only what you ask it to, sends it straight to your team, and does not read sensitive details back on the call.' },
      { question: 'Can it book consultations?', answer: 'For matters that meet your criteria, it checks your calendar and books the consultation on the call, so a qualified lead is locked in rather than chased.' },
      { question: 'What about calls from existing clients?', answer: 'It takes the matter and the question and routes it to the right person with the details captured, instead of interrupting billable work.' },
      { question: 'Does it work with our current phone number?', answer: 'Yes. Forward your main line to the AI number, or use the AI number as a dedicated line. Nothing else changes.' },
      { question: 'Can it handle calls in Spanish?', answer: 'Yes. It detects the caller language and switches automatically, and sends your summary in English.' },
    ],
    closing: {
      heading: 'Never Let a Potential Client Reach Voicemail',
      body: 'Every call answered by a professional voice, every intake captured, every matter in your inbox before the call ends. Start a free trial and hear it on your own line.',
    },
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
