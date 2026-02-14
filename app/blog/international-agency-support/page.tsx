// app/blog/international-agency-support/page.tsx
//
// SEO Keywords: white label ai receptionist international, ai receptionist platform
// global agencies, voiceai connect international support, ai receptionist non-us agencies,
// sell ai receptionists from outside us
//
// AEO Optimization: Direct answers to "can I run an AI receptionist agency from outside
// the US", international agency setup, email summaries for global agencies, FAQ schema
//

import BlogPostLayout, { Callout, ComparisonTable, StepList } from '../blog-post-layout';

export const metadata = {
  alternates: {
    canonical: "/blog/international-agency-support",
  },
  title: 'VoiceAI Connect Now Supports International Agencies — Sell AI Receptionists from Anywhere',
  description: 'VoiceAI Connect now fully supports agencies outside the US with automatic email call summaries, international phone number provisioning via API, and multi-currency billing. Run your AI receptionist agency from anywhere in the world.',
  keywords: 'ai receptionist international agencies, white label ai receptionist global, voiceai connect international support, ai receptionist agency outside us, sell ai receptionists internationally, ai phone receptionist global platform',
  openGraph: {
    title: 'VoiceAI Connect Now Supports International Agencies',
    description: 'Run your AI receptionist agency from anywhere. Email summaries, international provisioning, and global billing — all built in.',
    type: 'article',
    publishedTime: '2026-02-14',
  },
};

const tableOfContents = [
  { id: 'whats-new', title: "What\u2019s New", level: 2 },
  { id: 'email-call-summaries', title: 'Email Call Summaries', level: 2 },
  { id: 'international-number-provisioning', title: 'International Number Provisioning', level: 2 },
  { id: 'how-it-works', title: 'How It Works', level: 2 },
  { id: 'supported-countries', title: 'Supported Countries', level: 2 },
  { id: 'getting-started', title: 'Getting Started', level: 2 },
  { id: 'faq', title: 'FAQ', level: 2 },
];

export default function InternationalSupportPost() {
  return (
    <BlogPostLayout
      meta={{
        title: 'VoiceAI Connect Now Supports International Agencies — Sell AI Receptionists from Anywhere',
        description: 'VoiceAI Connect now fully supports agencies outside the US with automatic email call summaries, international phone number provisioning via API, and multi-currency billing.',
        category: 'product',
        publishedAt: '2026-02-14',
        readTime: '5 min read',
        author: {
          name: 'Gibson Thompson',
          role: 'Founder, VoiceAI Connect',
        },
        tags: ['Product Update', 'International', 'Email Summaries', 'API', 'Global Agencies'],
      }}
      tableOfContents={tableOfContents}
    >
      <p className="lead">
        VoiceAI Connect now fully supports agencies outside the United States. If you&apos;re running an AI receptionist agency from India, the UK, Canada, Australia, or anywhere else in the world, you can now serve US businesses with the same tools and notifications as domestic agencies — plus new capabilities built specifically for international operators.
      </p>

      <p>
        This has been our most requested feature since launch. Over 30% of new agency signups come from outside the US, and until now they&apos;ve had to work around limitations with SMS delivery and phone number setup. That changes today.
      </p>

      {/* ============================================================ */}
      <h2 id="whats-new">What&apos;s New</h2>

      <p>
        This update includes three major changes for international agencies:
      </p>

      <ul>
        <li><strong>Automatic email call summaries</strong> — International agencies receive detailed email notifications after every call, replacing SMS notifications that don&apos;t work outside the US.</li>
        <li><strong>Phone number provisioning API</strong> — Agencies can provision US phone numbers for their clients programmatically, with no manual setup required.</li>
        <li><strong>Automatic country detection</strong> — The platform detects your agency&apos;s country during signup and configures the right notification method automatically.</li>
      </ul>

      <p>
        For US-based agencies, nothing changes. You still get SMS notifications after every call. International agencies now get the same information delivered via email — with even more detail than an SMS can provide.
      </p>

      {/* ============================================================ */}
      <h2 id="email-call-summaries">Email Call Summaries: More Detail Than SMS</h2>

      <p>
        Every time your client&apos;s AI receptionist handles a call, the agency owner and client receive a comprehensive email summary. These emails are branded with your agency&apos;s logo, colors, and name — your clients never see VoiceAI Connect.
      </p>

      <p>
        Each email includes:
      </p>

      <ul>
        <li><strong>Caller information</strong> — Name, phone number, and email (when provided by the caller)</li>
        <li><strong>AI-generated summary</strong> — A 2-3 sentence summary of what the caller needed, written by Claude AI</li>
        <li><strong>Urgency classification</strong> — Emergency, high, medium, or routine, so your client knows what to follow up on first</li>
        <li><strong>Call duration</strong> — How long the AI handled the conversation</li>
        <li><strong>Transcript preview</strong> — The first 500 characters of the call transcript, with a link to the full version in the dashboard</li>
        <li><strong>One-click dashboard link</strong> — Takes the client directly to the full call details in their branded portal</li>
      </ul>

      <Callout type="tip" title="More Information Than SMS">
        <p>SMS notifications are limited to ~160 characters. Email summaries include the full AI analysis, transcript preview, urgency badge, and direct links to the dashboard. International agencies actually get a richer notification experience than SMS-only agencies.</p>
      </Callout>

      {/* ============================================================ */}
      <h2 id="international-number-provisioning">Phone Number Provisioning API</h2>

      <p>
        International agencies can now provision US phone numbers for their clients through the VoiceAI Connect API. This is the first endpoint in our public API, and it&apos;s designed specifically for agencies that need to set up clients remotely without US-based infrastructure.
      </p>

      <p>
        The API handles the entire provisioning flow:
      </p>

      <ol>
        <li>Request a US phone number for a specific area code or let the system choose</li>
        <li>The number is automatically configured with AI call handling</li>
        <li>The number is assigned to the client&apos;s account in your agency</li>
        <li>Call forwarding and notification preferences are set up automatically</li>
      </ol>

      <p>
        Authentication uses a single API key per agency, scoped to your agency&apos;s data only. You&apos;ll find your API key in <strong>Settings → API</strong> in your agency dashboard.
      </p>

      <Callout type="info" title="API Access">
        <p>The phone number provisioning API is available on all plans. Full API documentation is available in your agency dashboard under Settings → API. Additional API endpoints for client management and call data are on our roadmap.</p>
      </Callout>

      {/* ============================================================ */}
      <h2 id="how-it-works">How International Detection Works</h2>

      <p>
        The platform handles international routing automatically. Here&apos;s what happens behind the scenes:
      </p>

      <StepList
        steps={[
          {
            title: 'Country Detection at Signup',
            description: 'When a new agency signs up, the platform checks the phone number and country field provided during registration. If the agency is outside the US, international mode is activated automatically.',
          },
          {
            title: 'Notification Routing',
            description: 'US agencies receive SMS notifications via Telnyx after every call. International agencies receive branded email summaries via Resend. The routing is automatic — no configuration needed.',
          },
          {
            title: 'Client Experience is Identical',
            description: 'Your clients see the same branded dashboard, the same call logs, and the same AI summaries regardless of where your agency is located. The only difference is how you (the agency owner) receive notifications.',
          },
          {
            title: 'Phone Numbers Are Always US-Based',
            description: 'AI receptionist phone numbers are US numbers, since they answer calls for US businesses. International agencies provision these numbers the same way US agencies do — through the dashboard or API.',
          },
        ]}
      />

      {/* ============================================================ */}
      <h2 id="supported-countries">Supported Countries</h2>

      <p>
        VoiceAI Connect supports agency signups from any country. Email notifications work globally — anywhere you can receive email, you can run an agency on our platform.
      </p>

      <p>
        The countries with the most active international agencies on VoiceAI Connect today:
      </p>

      <ComparisonTable
        headers={['Region', 'Top Countries', 'Notification Method']}
        rows={[
          ['North America', 'Canada, Mexico', 'Email (SMS for US only)'],
          ['Europe', 'UK, Germany, Netherlands, France', 'Email'],
          ['Asia-Pacific', 'India, Philippines, Australia', 'Email'],
          ['Middle East & Africa', 'UAE, South Africa, Nigeria', 'Email'],
          ['South America', 'Brazil, Colombia, Argentina', 'Email'],
        ]}
      />

      <p>
        Stripe payments are supported in <strong>46+ countries</strong>, so agencies in most regions can accept client payments directly through the platform&apos;s built-in Stripe Connect integration.
      </p>

      {/* ============================================================ */}
      <h2 id="getting-started">Getting Started as an International Agency</h2>

      <p>
        If you&apos;re already on VoiceAI Connect, international support is live now — no action needed. Your notification method was configured automatically based on your signup country.
      </p>

      <p>
        If you&apos;re new and want to start an AI receptionist agency from outside the US:
      </p>

      <ol>
        <li><strong>Sign up for a free trial</strong> at <a href="https://myvoiceaiconnect.com/signup">myvoiceaiconnect.com/signup</a> — no credit card required</li>
        <li><strong>Set up your branding</strong> — upload your logo, choose your colors, and set your agency name</li>
        <li><strong>Set your client pricing</strong> — choose what you&apos;ll charge for each plan tier</li>
        <li><strong>Connect Stripe</strong> — available in 46+ countries to receive client payments</li>
        <li><strong>Start onboarding clients</strong> — share your branded signup link or provision clients via API</li>
      </ol>

      <p>
        The entire setup takes under 15 minutes. Your first client can be live within an hour of creating your account.
      </p>

      {/* ============================================================ */}
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>Can I run an AI receptionist agency from outside the US?</h3>
      <p>
        Yes. VoiceAI Connect fully supports international agencies. You can run an AI receptionist business from any country and serve US-based clients. The platform handles all phone number provisioning, call handling, and notifications automatically.
      </p>

      <h3>How do international agencies receive call notifications?</h3>
      <p>
        International agencies receive <strong>branded email summaries</strong> after every call. These emails include caller information, an AI-generated call summary, urgency classification, call duration, transcript preview, and a direct link to the client dashboard. US agencies receive SMS notifications.
      </p>

      <h3>Can my clients outside the US use this platform?</h3>
      <p>
        The AI receptionist answers calls on US phone numbers, so it&apos;s designed for businesses that receive calls from US-based customers. Your agency can be located anywhere, but your end clients should be US businesses (or businesses with US customers who call a US number).
      </p>

      <h3>Do I need a US phone number to sign up?</h3>
      <p>
        No. You can sign up with any international phone number. The platform will detect your country automatically and configure email notifications instead of SMS.
      </p>

      <h3>Can I provision US phone numbers from outside the US?</h3>
      <p>
        Yes. Use the phone number provisioning API or the agency dashboard to provision US phone numbers for your clients. No US-based infrastructure is required on your end.
      </p>

      <h3>What payment methods are supported for international agencies?</h3>
      <p>
        VoiceAI Connect uses Stripe for billing, which supports agencies and payments in <strong>46+ countries</strong>. You can accept client payments in USD regardless of your local currency. Stripe handles the currency conversion automatically.
      </p>

      <h3>Is there any difference in features for international agencies?</h3>
      <p>
        No. International agencies have access to every feature available to US agencies. The only difference is the notification delivery method (email vs SMS for the agency owner). Client-facing features, dashboards, AI quality, and call handling are identical.
      </p>

      {/* JSON-LD Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'VoiceAI Connect Now Supports International Agencies — Sell AI Receptionists from Anywhere',
            description: 'VoiceAI Connect now fully supports agencies outside the US with automatic email call summaries, international phone number provisioning via API, and multi-currency billing.',
            author: { '@type': 'Person', name: 'Gibson Thompson' },
            publisher: { '@type': 'Organization', name: 'VoiceAI Connect', url: 'https://www.myvoiceaiconnect.com' },
            datePublished: '2026-02-14',
            mainEntityOfPage: 'https://www.myvoiceaiconnect.com/blog/international-agency-support',
          }),
        }}
      />

      {/* JSON-LD FAQ Schema for AEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Can I run an AI receptionist agency from outside the US?',
                acceptedAnswer: { '@type': 'Answer', text: 'Yes. VoiceAI Connect fully supports international agencies. You can run an AI receptionist business from any country and serve US-based clients. The platform handles all phone number provisioning, call handling, and notifications automatically.' },
              },
              {
                '@type': 'Question',
                name: 'How do international agencies receive call notifications?',
                acceptedAnswer: { '@type': 'Answer', text: 'International agencies receive branded email summaries after every call. These emails include caller information, an AI-generated call summary, urgency classification, call duration, transcript preview, and a direct link to the client dashboard.' },
              },
              {
                '@type': 'Question',
                name: 'Do I need a US phone number to sign up for VoiceAI Connect?',
                acceptedAnswer: { '@type': 'Answer', text: 'No. You can sign up with any international phone number. The platform will detect your country automatically and configure email notifications instead of SMS.' },
              },
              {
                '@type': 'Question',
                name: 'Can I provision US phone numbers from outside the US?',
                acceptedAnswer: { '@type': 'Answer', text: 'Yes. Use the phone number provisioning API or the agency dashboard to provision US phone numbers for your clients. No US-based infrastructure is required on your end.' },
              },
              {
                '@type': 'Question',
                name: 'What payment methods are supported for international AI receptionist agencies?',
                acceptedAnswer: { '@type': 'Answer', text: 'VoiceAI Connect uses Stripe for billing, which supports agencies and payments in 46+ countries. You can accept client payments in USD regardless of your local currency.' },
              },
              {
                '@type': 'Question',
                name: 'Is there any difference in features for international agencies?',
                acceptedAnswer: { '@type': 'Answer', text: 'No. International agencies have access to every feature available to US agencies. The only difference is the notification delivery method (email vs SMS). Client-facing features, dashboards, AI quality, and call handling are identical.' },
              },
            ],
          }),
        }}
      />

    </BlogPostLayout>
  );
}