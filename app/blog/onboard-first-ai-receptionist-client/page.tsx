// app/blog/onboard-first-ai-receptionist-client/page.tsx
//
// SEO Keywords: onboard AI receptionist client, first AI receptionist client,
// set up AI receptionist for client, AI agency client onboarding, AI receptionist client setup
//
// AI Search Optimization: Step-by-step with time estimates, checklist format,
// specific configuration instructions, common mistakes, first-week timeline

import BlogPostLayout, { Callout, ComparisonTable, StepList } from '../blog-post-layout';

export const metadata = {
  alternates: {
    canonical: "/blog/onboard-first-ai-receptionist-client",
  },
  title: 'How to Onboard Your First AI Receptionist Client (Step-by-Step)',
  description: 'The complete onboarding process from signed contract to live calls. What to collect from the client, how to configure the AI, testing protocol, and the first-week follow-up that prevents cancellation.',
  keywords: 'onboard AI receptionist client, AI receptionist client setup, first AI agency client, AI receptionist onboarding process, set up AI for client',
  openGraph: {
    title: 'How to Onboard Your First AI Receptionist Client',
    description: 'Step-by-step onboarding: what to collect, how to configure, how to test, and the first-week follow-up that prevents cancellation.',
    type: 'article',
    publishedTime: '2026-03-11',
    authors: ['Gibson Thompson'],
  },
};

const tableOfContents = [
  { id: 'before-you-start', title: 'Before You Start', level: 2 },
  { id: 'step-1-collect-info', title: 'Step 1: Collect Business Information', level: 2 },
  { id: 'step-2-configure-ai', title: 'Step 2: Configure the AI', level: 2 },
  { id: 'step-3-test-calls', title: 'Step 3: Test Calls', level: 2 },
  { id: 'step-4-go-live', title: 'Step 4: Go Live', level: 2 },
  { id: 'step-5-first-week', title: 'Step 5: The First Week', level: 2 },
  { id: 'step-6-thirty-day-review', title: 'Step 6: The 30-Day Review', level: 2 },
  { id: 'mistakes-that-cause-cancellation', title: 'Mistakes That Cause Early Cancellation', level: 2 },
  { id: 'onboarding-checklist', title: 'Onboarding Checklist', level: 2 },
];

export default function OnboardFirstAIReceptionistClient() {
  return (
    <BlogPostLayout
      meta={{
        title: 'How to Onboard Your First AI Receptionist Client (Step-by-Step)',
        description: 'The complete onboarding process from signed contract to live calls. What to collect, how to configure, testing protocol, and the first-week follow-up that prevents cancellation.',
        category: 'guides',
        publishedAt: '2026-03-11',
        readTime: '13 min read',
        author: {
          name: 'Gibson Thompson',
          role: 'Founder, VoiceAI Connect',
        },
        tags: ['Onboarding', 'AI Agency', 'Client Management', 'AI Receptionist', 'Operations'],
      }}
      tableOfContents={tableOfContents}
    >
      <p className="lead text-xl">
        <strong>Onboarding an AI receptionist client should take less than 24 hours from signed contract to live calls.</strong> You collect the client's business information, configure the AI with their knowledge base, run 3–5 test calls, activate call forwarding, and check in after the first day. The process is straightforward — but doing it well is what separates agencies with 3% monthly churn from agencies with 15% monthly churn.
      </p>

      <p>
        This guide walks through the complete onboarding process step by step, with time estimates for each phase and the specific mistakes that lead to early cancellation.
      </p>

      <h2 id="before-you-start">Before You Start: What You Need Ready</h2>

      <p>
        Before your first client signs up, make sure you have these pieces in place:
      </p>

      <ul>
        <li><strong>Your white-label platform account</strong> — fully configured with your branding, logo, colors, and custom domain (if applicable)</li>
        <li><strong>A client onboarding form</strong> — a document or form (Google Form, Typeform, or your platform's built-in intake) that collects everything you need in one shot</li>
        <li><strong>A welcome email template</strong> — sent immediately after signup, confirming what happens next and when they'll be live</li>
        <li><strong>Your test call script</strong> — a list of 5 scenarios you'll test before going live with every client</li>
      </ul>

      <p>
        Having these ready in advance means you spend the onboarding call configuring, not scrambling.
      </p>

      <h2 id="step-1-collect-info">Step 1: Collect Business Information (15 minutes)</h2>

      <p>
        Immediately after the client signs up, send them your intake form or walk through it together on a call. You need:
      </p>

      <p><strong>The basics:</strong></p>
      <ul>
        <li>Business name (exactly as they want it spoken aloud)</li>
        <li>Business address</li>
        <li>Phone number the AI will be answering for</li>
        <li>Business hours — per day, including weekends and any variations</li>
      </ul>

      <p><strong>The knowledge base content:</strong></p>
      <ul>
        <li>Services offered — with brief descriptions</li>
        <li>Pricing (ranges are fine, or "free estimates" if they don't share pricing)</li>
        <li>Service area — cities, zip codes, or radius</li>
        <li>Top 10 FAQ answers — the questions their staff answers most often. Ask the client: "When someone calls, what do they usually ask?" The answers are the knowledge base.</li>
      </ul>

      <p><strong>The operational rules:</strong></p>
      <ul>
        <li>What counts as an emergency? (And what phone number to transfer emergencies to)</li>
        <li>How should appointment requests be handled? (Book directly if calendar is connected, or capture details for callback)</li>
        <li>Any specific phrases or terminology the business uses</li>
        <li>Preferred greeting — or let you write one based on their brand</li>
      </ul>

      <Callout type="tip" title="Do this on a call, not asynchronously">
        <p>
          Sending a form and waiting for the client to fill it out can delay onboarding by days or weeks. The best approach: schedule a 20-minute onboarding call, share your screen, and fill in the form together while asking questions. You'll get better information, catch inconsistencies, and the client feels taken care of. Plus, you're live within hours instead of waiting for emails.
        </p>
      </Callout>

      <h2 id="step-2-configure-ai">Step 2: Configure the AI (20–30 minutes)</h2>

      <p>
        With the client's information collected, you configure the AI in your platform dashboard:
      </p>

      <StepList steps={[
        {
          title: 'Create the client account',
          description: 'Most platforms have a "Add Client" or "New Business" flow. Enter the business name, contact info, and plan tier. This provisions a phone number and dashboard for the client.',
        },
        {
          title: 'Set the greeting',
          description: 'Keep it under 10 seconds. Example: "Hi, thanks for calling [Business Name]. How can I help you today?" Short, warm, professional. Avoid listing services or hours in the greeting — the AI handles that conversationally.',
        },
        {
          title: 'Build the knowledge base',
          description: 'Enter services, hours, pricing, service area, and FAQ answers. Be specific. "We offer AC repair, AC installation, furnace repair, furnace installation, duct cleaning, and heat pump service" is much better than "we do HVAC work." The more detail, the better the AI performs.',
        },
        {
          title: 'Configure call handling rules',
          description: 'Set emergency keywords and transfer number. Configure after-hours behavior (take messages vs. book next-day). Set the notification method — most clients prefer SMS summaries after each call.',
        },
        {
          title: 'Connect calendar (if applicable)',
          description: 'If the client uses Google Calendar, Calendly, or another scheduling tool, connect it so the AI can book appointments in real time. If not, configure the AI to capture preferred date/time and contact info for manual confirmation.',
        },
        {
          title: 'Choose the voice',
          description: 'Most platforms offer multiple voice options — male/female, different accents, varying levels of warmth vs. professionalism. Let the client pick, or choose one that matches their brand. A law firm might want a more formal voice; a plumber might want something friendly and casual.',
        },
      ]} />

      <h2 id="step-3-test-calls">Step 3: Test Calls (10–15 minutes)</h2>

      <p>
        Never go live without testing. Call the AI phone number yourself and run through these five scenarios:
      </p>

      <ComparisonTable
        headers={['Test Scenario', 'What to Verify']}
        rows={[
          ['Ask about hours', 'AI provides correct hours including weekend variations'],
          ['Request an appointment', 'AI either books it (if calendar connected) or captures details correctly'],
          ['Ask a service question ("Do you do [X]?")', 'AI answers from the knowledge base, not with generic information'],
          ['Simulate an emergency ("My pipe burst")', 'AI detects urgency and attempts to transfer to the emergency number'],
          ['Ask something outside the knowledge base', 'AI gracefully says it doesn\'t have that info and offers to take a message'],
        ]}
      />

      <p>
        After each test call, check that the SMS/email summary arrived and the details are accurate. Fix any issues — wrong hours, missing services, awkward phrasing — before real callers experience them.
      </p>

      <Callout type="info" title="Involve the client in testing">
        <p>
          Have the client make a test call themselves. This serves two purposes: they hear what their callers will experience (which builds confidence), and they catch things you might miss — like a service they forgot to mention or a question they get frequently that wasn't in the FAQ. Their reaction during the test call is also a strong indicator of satisfaction.
        </p>
      </Callout>

      <h2 id="step-4-go-live">Step 4: Go Live (5 minutes)</h2>

      <p>
        Going live means activating call forwarding so real customer calls reach the AI. Two options:
      </p>

      <p>
        <strong>Full forwarding:</strong> All calls go to the AI. The AI handles everything and sends summaries. Best for businesses that don't have a receptionist and were previously going to voicemail.
      </p>

      <p>
        <strong>Conditional forwarding:</strong> Calls go to the AI only when the business doesn't answer (after 3–4 rings) or when the line is busy. The business tries to answer first; the AI catches what they miss. Best for businesses that have someone answering phones but miss calls during busy times and after hours.
      </p>

      <p>
        Walk the client through setting up forwarding on their phone carrier. For most carriers, it's a settings menu or a short code (*72 or *73 on many carriers). This takes under 5 minutes.
      </p>

      <p>
        Once forwarding is active, the client is live. Real calls will start being handled by the AI immediately.
      </p>

      <h2 id="step-5-first-week">Step 5: The First Week (Critical for Retention)</h2>

      <p>
        The first seven days determine whether this client stays for a year or cancels in month two. Here's the follow-up cadence:
      </p>

      <p>
        <strong>Day 1 (same day as go-live):</strong> Send a message checking in. "Your AI receptionist is live! You should start seeing call summaries come through. Let me know if anything looks off." This reassures the client that you're paying attention and catches issues early.
      </p>

      <p>
        <strong>Day 3:</strong> Review the call data. How many calls has the AI handled? Were there any issues? Send the client a quick summary: "In the first 3 days, your AI has answered 14 calls, including 3 after-hours calls that would have gone to voicemail. Here are the highlights." This demonstrates value before the client even thinks to question the cost.
      </p>

      <p>
        <strong>Day 7:</strong> Schedule a 10-minute call or send a detailed recap. Total calls answered, after-hours calls captured, common questions asked, any emergency transfers. Ask: "Is there anything the AI said that didn't sound right, or any questions callers asked that it couldn't answer?" Use their feedback to refine the knowledge base.
      </p>

      <p>
        The goal of the first week is to get the client to an "aha moment" — the first time they see a text summary of a call they would have missed, with a real customer name and a real job captured. Once they experience that, the value is concrete and cancellation becomes unlikely.
      </p>

      <h2 id="step-6-thirty-day-review">Step 6: The 30-Day Review</h2>

      <p>
        At 30 days, do a proper review:
      </p>

      <ul>
        <li><strong>Total calls answered</strong> — broken down by business hours vs. after hours</li>
        <li><strong>Calls that would have been missed</strong> — this is the value number. "Your AI answered 47 calls this month, including 12 after hours and 8 that came in while your lines were busy."</li>
        <li><strong>Revenue impact estimate</strong> — if those 12 after-hours calls converted at even 25% with an average job value of $400, that's $1,200 in captured revenue from a $149/month service</li>
        <li><strong>Knowledge base updates</strong> — add any new FAQ answers based on questions the AI encountered but couldn't answer well</li>
        <li><strong>Upsell opportunity</strong> — if the client is on a basic plan and seeing high volume, this is when you mention the next tier</li>
      </ul>

      <h2 id="mistakes-that-cause-cancellation">Mistakes That Cause Early Cancellation</h2>

      <ul>
        <li><strong>Slow onboarding.</strong> If it takes a week to get the client live, their excitement fades and buyer's remorse sets in. Aim for same-day activation. If information gathering takes longer, at least get the AI answering with basic details and refine over the next few days.</li>
        <li><strong>Thin knowledge base.</strong> If the AI can't answer common questions — "Do you do tankless water heaters?" and the AI says "I'm not sure" — the client loses confidence fast. The first caller who reports a bad experience triggers a support call. Prevent this with a thorough knowledge base.</li>
        <li><strong>No follow-up in week one.</strong> If the client doesn't hear from you after going live, they assume you don't care. They also won't tell you about issues — they'll just cancel. Proactive follow-up at day 1, 3, and 7 prevents this entirely.</li>
        <li><strong>Client doesn't see the summaries.</strong> If SMS notifications aren't working or going to the wrong number, the client has no visibility into what the AI is doing. They're paying $149/month and seeing nothing. Verify notification delivery on day one.</li>
        <li><strong>Emergency transfer doesn't work.</strong> If a real emergency call comes in and the transfer fails, the client will cancel immediately — and rightfully so. Test emergency transfer before going live, every time.</li>
      </ul>

      <h2 id="onboarding-checklist">Onboarding Checklist</h2>

      <ComparisonTable
        headers={['Step', 'Time', 'Status']}
        rows={[
          ['Collect business info (name, hours, address, services)', '15 min', '☐'],
          ['Collect FAQ answers and emergency rules', '10 min', '☐'],
          ['Create client account in platform', '5 min', '☐'],
          ['Configure greeting, knowledge base, and call handling', '20 min', '☐'],
          ['Connect calendar (if applicable)', '5 min', '☐'],
          ['Run 5 test calls', '10 min', '☐'],
          ['Fix any issues found in testing', '5–15 min', '☐'],
          ['Walk client through call forwarding setup', '5 min', '☐'],
          ['Verify SMS/email notification delivery', '2 min', '☐'],
          ['Send welcome email with next steps', '2 min', '☐'],
          ['Day 1 check-in', '—', '☐'],
          ['Day 3 performance summary', '—', '☐'],
          ['Day 7 review call', '—', '☐'],
          ['Day 30 performance review', '—', '☐'],
        ]}
      />

      <p>
        Total setup time: approximately 60–90 minutes. Total time to live calls: same day.
      </p>

      <Callout type="tip" title="This process gets faster with practice">
        <p>
          Your first client onboarding might take 2 hours as you learn the platform and figure out the flow. By client #5, you'll have it down to 45 minutes. By client #20, you'll be able to onboard in 30 minutes with your eyes closed. The key is building a repeatable process — same intake form, same configuration steps, same test scenarios, same follow-up cadence.
        </p>
      </Callout>

    </BlogPostLayout>
  );
}