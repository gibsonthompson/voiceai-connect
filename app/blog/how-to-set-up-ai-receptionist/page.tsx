// app/blog/how-to-set-up-ai-receptionist/page.tsx
//
// SEO Keywords: how to set up AI receptionist, AI receptionist setup guide,
// set up AI phone answering, configure AI receptionist business, AI receptionist getting started
//
// AI Search Optimization: Step-by-step numbered guide, prerequisite checklist,
// time estimates per step, common setup mistakes, industry-specific tips

import BlogPostLayout, { Callout, ComparisonTable, StepList } from '../blog-post-layout';

export const metadata = {
  alternates: {
    canonical: "/blog/how-to-set-up-ai-receptionist",
  },
  title: 'How to Set Up an AI Receptionist for Your Business (Step-by-Step)',
  description: 'Set up an AI receptionist in under an hour. What you need before you start, step-by-step configuration, how to test it, and common mistakes that make the AI sound bad.',
  keywords: 'set up AI receptionist, AI receptionist setup, configure AI phone answering, AI receptionist getting started, how to install AI receptionist',
  openGraph: {
    title: 'How to Set Up an AI Receptionist for Your Business',
    description: 'Step-by-step setup guide. What you need, how to configure it, how to test it, and common mistakes to avoid.',
    type: 'article',
    publishedTime: '2026-03-10',
    authors: ['Gibson Thompson'],
  },
};

const tableOfContents = [
  { id: 'what-you-need', title: 'What You Need Before You Start', level: 2 },
  { id: 'choose-a-provider', title: 'Step 1: Choose a Provider', level: 2 },
  { id: 'add-your-business-info', title: 'Step 2: Add Your Business Information', level: 2 },
  { id: 'write-your-greeting', title: 'Step 3: Write Your Greeting', level: 2 },
  { id: 'build-your-knowledge-base', title: 'Step 4: Build Your Knowledge Base', level: 2 },
  { id: 'configure-call-handling', title: 'Step 5: Configure Call Handling', level: 2 },
  { id: 'connect-your-phone', title: 'Step 6: Connect Your Phone Number', level: 2 },
  { id: 'test-it', title: 'Step 7: Test Before Going Live', level: 2 },
  { id: 'common-mistakes', title: 'Common Mistakes That Make the AI Sound Bad', level: 2 },
  { id: 'first-week', title: 'What to Expect in the First Week', level: 2 },
];

export default function HowToSetUpAIReceptionist() {
  return (
    <BlogPostLayout
      meta={{
        title: 'How to Set Up an AI Receptionist for Your Business (Step-by-Step)',
        description: 'Set up an AI receptionist in under an hour. What you need before you start, step-by-step configuration, how to test it, and common mistakes that make the AI sound bad.',
        category: 'guides',
        publishedAt: '2026-03-10',
        readTime: '12 min read',
        author: {
          name: 'Gibson Thompson',
          role: 'Founder, VoiceAI Connect',
        },
        tags: ['AI Receptionist', 'Setup Guide', 'Small Business', 'Phone Answering', 'Getting Started'],
      }}
      tableOfContents={tableOfContents}
    >
      {/* DIRECT ANSWER */}
      <p className="lead text-xl">
        <strong>You can set up an AI receptionist for your business in under an hour.</strong> You need your business information, a list of your most frequently asked questions, and a phone number to forward calls from. No technical skills required. Most providers walk you through a guided setup that involves typing in your details, picking a voice, and activating call forwarding.
      </p>

      <p>
        This guide covers the full process from choosing a provider to going live, including the specific setup steps that determine whether your AI sounds professional or awkward.
      </p>

      <h2 id="what-you-need">What You Need Before You Start</h2>

      <p>
        Gather this information before signing up for any provider. Having it ready turns a multi-hour project into a 30-minute one.
      </p>

      <ul>
        <li><strong>Your business name, address, and phone number</strong></li>
        <li><strong>Business hours</strong> — including any variations for weekends or holidays</li>
        <li><strong>List of services you offer</strong> — with short descriptions and price ranges if applicable</li>
        <li><strong>Service area</strong> — cities, zip codes, or radius you cover</li>
        <li><strong>Your top 10–15 FAQ answers</strong> — the questions your staff answers most often on the phone. Think: "Do you offer free estimates?" "Do you accept insurance?" "How quickly can someone come out?" "What forms of payment do you take?"</li>
        <li><strong>Emergency handling rules</strong> — what counts as urgent and what should happen (transfer to your cell, send an immediate text, etc.)</li>
        <li><strong>Calendar link</strong> (optional) — if you use Google Calendar, Calendly, or another scheduling tool and want the AI to book appointments directly</li>
      </ul>

      <Callout type="tip" title="The FAQ list is the most important part">
        <p>
          The quality of your AI receptionist depends almost entirely on the information you give it. A thin knowledge base ("we do plumbing") produces vague, unhelpful answers. A detailed one ("we handle leak repair, water heater installation and repair, drain cleaning, sewer line inspection, faucet installation, and emergency calls — we serve the greater Atlanta metro area within a 30-mile radius of downtown") produces an AI that sounds like it actually works at your business.
        </p>
      </Callout>

      <h2 id="choose-a-provider">Step 1: Choose a Provider</h2>

      <p>
        AI receptionist providers fall into a few categories based on how you get the service:
      </p>

      <p>
        <strong>Direct from a platform.</strong> Companies like Dialzara, Goodcall, Rosie, and others sell AI receptionist service directly to business owners. You sign up, configure it, and pay them monthly. Prices typically range from $29 to $299/month depending on call volume and features.
      </p>

      <p>
        <strong>Through a local agency or reseller.</strong> Many marketing agencies and IT providers now offer AI receptionist services under their own brand, powered by a white-label platform underneath. The advantage is local support — you're working with someone who understands your market and can help with configuration. Pricing is similar, typically $49–$199/month.
      </p>

      <p>
        <strong>Through your phone system provider.</strong> Some business phone platforms like GoTo Connect and OpenPhone (now Quo) have built AI receptionist features directly into their phone systems. If you already use one of these, it may be the simplest path.
      </p>

      <p>
        Key things to evaluate: voice quality (call the demo line — if it sounds robotic, move on), calendar integration support, how the knowledge base works, whether you get SMS/email summaries after each call, and the pricing model (flat rate vs. per minute).
      </p>

      <h2 id="add-your-business-info">Step 2: Add Your Business Information</h2>

      <p>
        Every provider starts by asking for your basic business details. This is what the AI uses to introduce itself and answer foundational questions.
      </p>

      <ul>
        <li><strong>Business name</strong> — exactly as you want it spoken aloud. "Smith Plumbing Co" not "Smith Plumbing Co., LLC."</li>
        <li><strong>Business type / industry</strong> — this helps the AI understand context. A "dental office" knows to expect questions about insurance and appointments. A "roofing company" knows to expect questions about estimates and weather delays.</li>
        <li><strong>Hours of operation</strong> — per day of the week, including any special hours. Be specific. "Monday through Friday 7 AM to 6 PM, Saturday 8 AM to 2 PM, closed Sunday" is much better than "business hours."</li>
        <li><strong>Address and service area</strong> — the AI needs this to answer "do you service my area?" which is one of the most common questions for service businesses.</li>
      </ul>

      <h2 id="write-your-greeting">Step 3: Write Your Greeting</h2>

      <p>
        The greeting is the first thing every caller hears. It sets the tone for the entire conversation. Keep it short, warm, and professional.
      </p>

      <p>
        <strong>Good greeting:</strong> "Hi, thanks for calling Smith Plumbing. How can I help you today?"
      </p>

      <p>
        <strong>Bad greeting:</strong> "Hello, you've reached Smith Plumbing Company LLC, your trusted plumbing partner for the greater Atlanta area since 2003. We offer a full range of residential and commercial plumbing services including leak repair, water heater installation, drain cleaning, and more. For hours and directions, press 1. To schedule an appointment, press 2. For all other inquiries, please stay on the line."
      </p>

      <p>
        The second greeting is what a phone tree sounds like. The AI doesn't need it — it can answer all those questions conversationally once the caller speaks. Keep the greeting under 15 words. Let the AI do the talking based on what the caller actually asks.
      </p>

      <h2 id="build-your-knowledge-base">Step 4: Build Your Knowledge Base</h2>

      <p>
        This is the step that makes or breaks the caller's experience. The knowledge base is everything the AI knows about your business. The more detailed and accurate it is, the better the AI performs.
      </p>

      <p>
        <strong>Services:</strong> List each service you offer with a 1–2 sentence description and a price range if you're comfortable sharing one. If you don't share pricing, tell the AI what to say instead: "Pricing depends on the scope of the job — we offer free estimates."
      </p>

      <p>
        <strong>FAQ answers:</strong> Write out the answers to your most common phone questions. Not just the question — the full answer the way you'd want your best employee to say it. For example:
      </p>

      <ul>
        <li><strong>Q: Do you offer free estimates?</strong> → "Yes, we offer free on-site estimates for all services. We can usually schedule an estimate within 1–2 business days."</li>
        <li><strong>Q: Do you accept insurance?</strong> → "We accept most major insurance plans. If you can give us your provider name, we can verify your coverage before your appointment."</li>
        <li><strong>Q: How quickly can someone come out?</strong> → "For emergencies, we can usually get someone there the same day. For non-urgent work, we typically schedule within 2–3 business days."</li>
      </ul>

      <p>
        <strong>What to say when the AI doesn't know:</strong> Set a fallback response like "I don't have that specific information, but I'd be happy to take your number and have someone from the team call you back with an answer." This prevents the AI from guessing.
      </p>

      <Callout type="info" title="Shortcut: point it at your website">
        <p>
          Many providers let you paste your website URL and the AI will automatically pull information from your site — services, hours, location, FAQ. This gives you a solid starting point that you can then edit and expand. It's not a substitute for manual review, but it saves 20–30 minutes of typing.
        </p>
      </Callout>

      <h2 id="configure-call-handling">Step 5: Configure Call Handling</h2>

      <p>
        Call handling rules tell the AI what to do beyond answering questions:
      </p>

      <p>
        <strong>Appointment booking:</strong> If you connect a calendar, the AI can check your live availability and book directly. If not, it captures the caller's preferred date/time and contact info so you can confirm manually.
      </p>

      <p>
        <strong>Emergency routing:</strong> Define what counts as urgent for your business. For a plumber, "burst pipe" or "flooding" should trigger an immediate call transfer to your cell phone. For a dental office, "severe pain" or "knocked out tooth" should do the same. The AI detects these based on keywords and caller urgency.
      </p>

      <p>
        <strong>After-hours behavior:</strong> Should the AI handle calls the same way at 9 PM as at 9 AM? Or should it adjust — perhaps mentioning that the office is closed but taking a message for the next business day? Most platforms let you set different behaviors for business hours vs. after hours.
      </p>

      <p>
        <strong>Call transfer rules:</strong> Decide when the AI should transfer to a live person (and to which number). Common triggers: the caller requests a human, the call involves a complaint, or the AI doesn't know the answer after two attempts.
      </p>

      <h2 id="connect-your-phone">Step 6: Connect Your Phone Number</h2>

      <p>
        You have two options for connecting the AI to your business phone:
      </p>

      <p>
        <strong>Option A: Call forwarding (most common).</strong> You keep your existing business number. Set up conditional call forwarding through your phone carrier so that when you can't answer (busy, no answer after 3 rings, after hours), the call automatically forwards to the AI's number. The caller never knows the call was forwarded. This takes 5 minutes to set up through your carrier's settings.
      </p>

      <p>
        <strong>Option B: Dedicated AI number.</strong> The provider gives you a new phone number that the AI answers directly. You post this number on your website, Google Business Profile, and ads. Your personal/office number stays separate for outbound calls and direct contacts. This is cleaner but requires updating your phone number in multiple places.
      </p>

      <p>
        Most businesses start with Option A because it requires no changes to their marketing materials and works immediately.
      </p>

      <h2 id="test-it">Step 7: Test Before Going Live</h2>

      <p>
        Do not skip this. Call the AI yourself — from your personal phone, not from the dashboard test button. Call it like a customer would.
      </p>

      <StepList steps={[
        {
          title: 'Call and ask a basic question',
          description: '"What are your hours?" — Verify the answer is accurate. If your Saturday hours are wrong, fix the knowledge base now.',
        },
        {
          title: 'Call and request a service',
          description: '"I need someone to look at my AC unit" — Does the AI respond appropriately for your industry? Does it capture your info correctly?',
        },
        {
          title: 'Call with an emergency scenario',
          description: '"My pipe just burst and water is everywhere" — Does the AI detect urgency and attempt to transfer? Does it handle the handoff smoothly?',
        },
        {
          title: 'Call and ask something obscure',
          description: 'Ask something outside the knowledge base. Verify the AI doesn\'t make up an answer. It should acknowledge it doesn\'t know and offer to take a message.',
        },
        {
          title: 'Check the summary notification',
          description: 'After each test call, check that you received the text/email summary and that the details are accurate.',
        },
      ]} />

      <p>
        Fix anything that sounds wrong before going live. Adjust the greeting if it's too long. Add FAQ answers for questions the AI stumbled on. Tweak the service descriptions if the AI gave vague responses.
      </p>

      <h2 id="common-mistakes">Common Mistakes That Make the AI Sound Bad</h2>

      <ul>
        <li><strong>Knowledge base is too thin.</strong> If you only give the AI your business name and hours, that's all it can talk about. Every other question gets a "I'm not sure about that." Spend the time to write detailed FAQ answers.</li>
        <li><strong>Greeting is too long.</strong> A 30-second greeting before the caller can speak makes the AI feel like an old-school phone tree. Keep it under 5 seconds.</li>
        <li><strong>Services listed are too vague.</strong> "We do home services" tells the AI nothing. "We do HVAC repair, AC installation, furnace maintenance, and duct cleaning" tells it everything it needs to answer specific questions.</li>
        <li><strong>No fallback answer configured.</strong> Without a fallback, some AI systems will try to answer from general knowledge, which can produce wrong information about your business. Always set an explicit "I don't have that info" response.</li>
        <li><strong>Never testing after setup.</strong> You'd be surprised how often a typo in the hours or a missing service causes a bad caller experience. Five test calls takes 10 minutes and catches most issues.</li>
        <li><strong>Setting it and forgetting it.</strong> Your business changes — new services, new hours, seasonal pricing. Update the knowledge base when things change, or the AI will give outdated answers.</li>
      </ul>

      <h2 id="first-week">What to Expect in the First Week</h2>

      <p>
        <strong>Day 1–2:</strong> The AI handles calls and you review every summary. You'll probably notice 1–2 questions it handles awkwardly. Add those answers to the knowledge base. This is normal.
      </p>

      <p>
        <strong>Day 3–5:</strong> The knowledge base gaps close. Most calls are handled cleanly. You start seeing the value — especially in after-hours calls you would have missed entirely.
      </p>

      <p>
        <strong>Day 6–7:</strong> Review your first week of data. How many calls were answered? How many would have gone to voicemail without the AI? What were the most common questions? This data tells you whether the AI is configured well or needs more training.
      </p>

      <Callout type="tip" title="The realization that sells itself">
        <p>
          Most business owners have an "aha moment" in the first week — they get a text summary of a call at 8 PM on a Tuesday from a customer who needed emergency service and got booked for the next morning. Without the AI, that call would have gone to voicemail, the customer would have called a competitor, and the business owner would never have known.
        </p>
      </Callout>

    </BlogPostLayout>
  );
}