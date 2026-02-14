// app/blog/customizable-plan-features/page.tsx
//
// SEO Keywords: white label ai receptionist plan tiers, ai receptionist agency
// custom pricing, voiceai connect plan features, ai receptionist feature gating,
// agency plan customization
//
// AEO Optimization: Direct answers to "how to customize ai receptionist plans
// for clients", plan tier features, agency pricing strategy, FAQ schema
//

import BlogPostLayout, { Callout, ComparisonTable, StepList } from '../blog-post-layout';

export const metadata = {
  alternates: {
    canonical: "/blog/customizable-plan-features",
  },
  title: 'Customizable Plan Features: Control Exactly What Each Client Tier Includes',
  description: 'VoiceAI Connect agencies can now customize which features are included in each client plan. Toggle email summaries, custom greetings, knowledge bases, business hours, and more per tier — enforced automatically across dashboard and backend.',
  keywords: 'ai receptionist plan features, white label ai receptionist pricing tiers, ai receptionist agency plans, customizable ai receptionist features, voiceai connect plan gating, ai agency client tiers',
  openGraph: {
    title: 'Customizable Plan Features — Control What Each Client Tier Includes',
    description: 'Toggle features per plan tier. Enforce them automatically. Give agencies real control over their product packaging.',
    type: 'article',
    publishedTime: '2026-02-14',
  },
};

const tableOfContents = [
  { id: 'whats-new', title: "What\u2019s New", level: 2 },
  { id: 'how-it-works', title: 'How It Works', level: 2 },
  { id: 'available-features', title: 'Available Features', level: 2 },
  { id: 'default-configuration', title: 'Default Plan Configuration', level: 2 },
  { id: 'enforcement', title: 'How Features Are Enforced', level: 2 },
  { id: 'pricing-strategy', title: 'Pricing Strategy Tips', level: 2 },
  { id: 'getting-started', title: 'Getting Started', level: 2 },
  { id: 'faq', title: 'FAQ', level: 2 },
];

export default function CustomizablePlanFeaturesPost() {
  return (
    <BlogPostLayout
      meta={{
        title: 'Customizable Plan Features: Control Exactly What Each Client Tier Includes',
        description: 'VoiceAI Connect agencies can now customize which features are included in each client plan tier. Toggle features per plan, enforced automatically across dashboard and backend.',
        category: 'product',
        publishedAt: '2026-02-14',
        readTime: '6 min read',
        author: {
          name: 'Gibson Thompson',
          role: 'Founder, VoiceAI Connect',
        },
        tags: ['Product Update', 'Plan Features', 'Pricing', 'Agency Dashboard', 'Feature Gating'],
      }}
      tableOfContents={tableOfContents}
    >
      <p className="lead">
        Every agency packages their AI receptionist service differently. Some want to keep the Starter plan simple and push clients to upgrade for advanced features. Others want every plan to feel premium. Until now, all VoiceAI Connect plans included the same features — the only difference was call limits. That changes today.
      </p>

      <p>
        Agencies can now <strong>customize exactly which features are included in each plan tier</strong> — Starter, Pro, and Growth — directly from the agency dashboard. Features are enforced automatically: if a Starter client doesn&apos;t have email summaries enabled, they won&apos;t receive them and won&apos;t see the option in their dashboard. No workarounds, no confusion.
      </p>

      {/* ============================================================ */}
      <h2 id="whats-new">What&apos;s New</h2>

      <p>
        Plan feature gating gives agencies control over their product packaging. Here&apos;s what shipped:
      </p>

      <ul>
        <li><strong>Per-plan feature toggles</strong> — Turn individual features on or off for Starter, Pro, and Growth plans from Settings → Pricing</li>
        <li><strong>Backend enforcement</strong> — Features are enforced at the webhook and API level, not just hidden in the UI</li>
        <li><strong>Client dashboard gating</strong> — Clients only see features their plan includes, with upgrade prompts for locked features</li>
        <li><strong>Smart defaults</strong> — New agencies get a sensible starting configuration out of the box</li>
        <li><strong>Instant application</strong> — Changes apply immediately to all existing clients on that plan</li>
      </ul>

      <p>
        The core AI receptionist — 24/7 call answering, a dedicated phone number, call history, recordings, and transcripts — is included in every plan regardless of configuration. The features you toggle are extras that differentiate your tiers.
      </p>

      {/* ============================================================ */}
      <h2 id="how-it-works">How It Works</h2>

      <p>
        Configuration lives in your agency dashboard under <strong>Settings → Pricing</strong>. Each plan card now includes a &ldquo;Included Features&rdquo; section with toggles for every configurable feature.
      </p>

      <StepList
        steps={[
          {
            title: 'Open Settings → Pricing',
            description: 'You\'ll see your three plan cards (Starter, Pro, Growth) with the price and call limit fields you already know.',
          },
          {
            title: 'Toggle Features Per Plan',
            description: 'Below the price and call limit fields, each plan shows feature toggles. Turn on the features you want included in that tier. Turn off features you want to reserve for higher tiers.',
          },
          {
            title: 'Save Changes',
            description: 'Hit Save. Your feature configuration is stored and immediately enforced for all clients on each plan.',
          },
          {
            title: 'Clients See the Difference',
            description: 'Clients on a plan with a feature disabled won\'t see the setting in their dashboard. They\'ll see an upgrade prompt instead, which drives natural upsells to higher tiers.',
          },
        ]}
      />

      <Callout type="tip" title="Changes Apply Immediately">
        <p>When you enable a feature for a plan, all clients on that plan gain access instantly. When you disable one, the feature is removed and the client sees an upgrade prompt. No need to update individual clients.</p>
      </Callout>

      {/* ============================================================ */}
      <h2 id="available-features">Configurable Features</h2>

      <p>
        Here are the features you can toggle per plan:
      </p>

      <ComparisonTable
        headers={['Feature', 'What It Does', 'Best For']}
        rows={[
          ['Email Summaries', 'Detailed email after every call with summary, transcript, and caller info', 'Pro and Growth — natural upsell from Starter'],
          ['Custom Greeting', 'Client writes their own AI opening message', 'Pro and Growth — gives clients personalization'],
          ['Custom Voice', 'Client chooses from multiple AI voice options', 'Growth — premium differentiator'],
          ['Knowledge Base', 'Client uploads business FAQs for the AI to reference during calls', 'Pro and Growth — high-value feature'],
          ['Business Hours', 'Client configures hours and after-hours behavior', 'Pro and Growth — operational control'],
          ['Advanced Analytics', 'Detailed reporting beyond basic call counts', 'Growth — data-driven clients'],
          ['Priority Support', 'Faster response times from your agency', 'Growth — premium service tier'],
        ]}
      />

      <p>
        Every plan always includes the core AI receptionist: 24/7 call answering, a dedicated US phone number, SMS notifications after every call, call history with recordings, AI-generated transcripts, and the client dashboard.
      </p>

      {/* ============================================================ */}
      <h2 id="default-configuration">Default Plan Configuration</h2>

      <p>
        New agencies start with a balanced default configuration that provides clear value differentiation between tiers:
      </p>

      <ComparisonTable
        headers={['Feature', 'Starter', 'Pro', 'Growth']}
        rows={[
          ['SMS Notifications', '✅ Always', '✅ Always', '✅ Always'],
          ['Email Summaries', '—', '✅', '✅'],
          ['Custom Greeting', '—', '✅', '✅'],
          ['Custom Voice', '—', '—', '✅'],
          ['Knowledge Base', '—', '✅', '✅'],
          ['Business Hours', '—', '✅', '✅'],
          ['Advanced Analytics', '—', '✅', '✅'],
          ['Priority Support', '—', '—', '✅'],
        ]}
      />

      <p>
        This default gives Starter clients a solid experience (AI answering + SMS alerts), while Pro unlocks the features most clients actually want (email summaries, custom greeting, knowledge base). Growth adds premium options for clients who want full control and priority service.
      </p>

      <p>
        You can change every toggle at any time. If you want Starter clients to have email summaries, turn it on. If you want to reserve knowledge base for Growth only, move the toggle. Your product, your packaging.
      </p>

      {/* ============================================================ */}
      <h2 id="enforcement">How Features Are Enforced</h2>

      <p>
        Feature gating isn&apos;t just cosmetic. It&apos;s enforced at every level of the platform:
      </p>

      <h3>Client Dashboard</h3>
      <p>
        Features that aren&apos;t included in a client&apos;s plan are hidden from their settings page. In place of the feature, clients see a clean upgrade prompt showing what they&apos;d get on the next tier. This creates a natural upsell path without being aggressive.
      </p>

      <h3>Backend & Webhook</h3>
      <p>
        When a call comes in, the webhook checks the client&apos;s plan features before sending notifications. If email summaries aren&apos;t enabled for their plan, the email simply isn&apos;t sent — regardless of whether the client has an email on file. This means you don&apos;t need to worry about clients getting features they haven&apos;t paid for.
      </p>

      <h3>API</h3>
      <p>
        API responses include the client&apos;s plan features, so if you&apos;re building custom integrations, you can check feature access programmatically. The <code>plan_features</code> object is returned with every client data response.
      </p>

      <Callout type="info" title="Fail-Open Design">
        <p>If a client&apos;s plan data is missing or corrupted, the system defaults to allowing the feature rather than blocking it. We&apos;d rather a client gets a notification they shouldn&apos;t than misses one they should. This edge case is rare but important for reliability.</p>
      </Callout>

      {/* ============================================================ */}
      <h2 id="pricing-strategy">Pricing Strategy Tips</h2>

      <p>
        Now that you control what each plan includes, here are proven strategies from agencies on VoiceAI Connect:
      </p>

      <h3>The &ldquo;Good, Better, Best&rdquo; Approach</h3>
      <p>
        Keep Starter simple (AI answering + SMS alerts only). Make Pro the obvious choice with email summaries, custom greeting, and knowledge base. Reserve custom voice and priority support for Growth. Most clients will self-select into Pro, which is exactly where you want them.
      </p>

      <h3>The &ldquo;Everything Included&rdquo; Approach</h3>
      <p>
        Some agencies enable all features on every plan and differentiate purely on call limits and price. This works well if your target market is price-sensitive — they see more value per dollar and are less likely to churn.
      </p>

      <h3>The &ldquo;Niche Premium&rdquo; Approach</h3>
      <p>
        If you serve a single vertical (like law firms or medical practices), enable knowledge base and business hours on all plans since those are table stakes for the industry. Reserve email summaries and analytics for higher tiers as your upsell path.
      </p>

      <h3>Pricing the Gap</h3>
      <p>
        The most effective agencies price Starter at $149-$199 and Pro at $299-$399 — a gap that&apos;s small enough that the feature difference makes Pro feel like an obvious upgrade. If the price gap is too large (e.g., $99 vs $499), clients stay on Starter even if they want the features.
      </p>

      {/* ============================================================ */}
      <h2 id="getting-started">Getting Started</h2>

      <p>
        Plan feature gating is live now for all agencies. No migration, no setup — your plans already have the default configuration applied.
      </p>

      <ol>
        <li>Go to <strong>Settings → Pricing</strong> in your agency dashboard</li>
        <li>Review the default feature toggles for each plan</li>
        <li>Adjust to match your pricing strategy</li>
        <li>Hit Save — changes apply immediately to all clients</li>
      </ol>

      <p>
        Existing clients on each plan will see the updated features (or upgrade prompts) the next time they load their dashboard.
      </p>

      {/* ============================================================ */}
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>Can I customize which features each client plan includes?</h3>
      <p>
        Yes. VoiceAI Connect agencies can toggle individual features on or off for each plan tier (Starter, Pro, Growth) from the Settings → Pricing page. Changes apply immediately to all clients on that plan.
      </p>

      <h3>What features can I gate by plan?</h3>
      <p>
        Configurable features include <strong>email summaries, custom greeting, custom voice, knowledge base, business hours, advanced analytics, and priority support</strong>. Core features (AI call answering, phone number, SMS notifications, call history, recordings, and transcripts) are always included in every plan.
      </p>

      <h3>What happens when I disable a feature for a plan?</h3>
      <p>
        Clients on that plan immediately lose access to the feature. In their dashboard, they see an upgrade prompt instead of the feature&apos;s settings. On the backend, the feature stops being delivered (e.g., email summaries won&apos;t be sent). Nothing is deleted — if you re-enable the feature later, it works again instantly.
      </p>

      <h3>Are features enforced on the backend or just hidden in the UI?</h3>
      <p>
        Both. Features are enforced at the webhook level (backend) and hidden in the client dashboard (frontend). For example, if email summaries are disabled for the Starter plan, the webhook won&apos;t send summary emails to Starter clients, and they won&apos;t see the email settings toggle in their dashboard.
      </p>

      <h3>Do all plans always include SMS notifications?</h3>
      <p>
        Yes. <strong>SMS notifications are included in every plan</strong> and cannot be disabled. Every client receives an SMS alert after each call (for US phone numbers). Email summaries are the configurable add-on that agencies can gate by plan tier.
      </p>

      <h3>Can I give different clients on the same plan different features?</h3>
      <p>
        Not currently. Feature configuration is per-plan, not per-client. All clients on the Starter plan get the same features, all Pro clients get the same features, etc. Per-client overrides are on our roadmap.
      </p>

      <h3>What if I want all plans to have the same features?</h3>
      <p>
        Just enable all toggles for all three plans. Many agencies differentiate purely on call limits and price rather than features. The feature toggles give you the option to differentiate, but they don&apos;t force you to.
      </p>

      {/* JSON-LD Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Customizable Plan Features: Control Exactly What Each Client Tier Includes',
            description: 'VoiceAI Connect agencies can now customize which features are included in each client plan tier. Toggle features per plan, enforced automatically across dashboard and backend.',
            author: { '@type': 'Person', name: 'Gibson Thompson' },
            publisher: { '@type': 'Organization', name: 'VoiceAI Connect', url: 'https://www.myvoiceaiconnect.com' },
            datePublished: '2026-02-14',
            mainEntityOfPage: 'https://www.myvoiceaiconnect.com/blog/customizable-plan-features',
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
                name: 'Can I customize which features each AI receptionist plan includes?',
                acceptedAnswer: { '@type': 'Answer', text: 'Yes. VoiceAI Connect agencies can toggle individual features on or off for each plan tier (Starter, Pro, Growth) from the Settings → Pricing page. Changes apply immediately to all clients on that plan.' },
              },
              {
                '@type': 'Question',
                name: 'What AI receptionist features can be gated by plan?',
                acceptedAnswer: { '@type': 'Answer', text: 'Configurable features include email summaries, custom greeting, custom voice, knowledge base, business hours, advanced analytics, and priority support. Core features like AI call answering, phone number, SMS notifications, call history, recordings, and transcripts are always included in every plan.' },
              },
              {
                '@type': 'Question',
                name: 'Are plan features enforced on the backend or just hidden in the UI?',
                acceptedAnswer: { '@type': 'Answer', text: 'Both. Features are enforced at the webhook level (backend) and hidden in the client dashboard (frontend). For example, if email summaries are disabled for the Starter plan, the webhook won\'t send emails and the setting won\'t appear in the dashboard.' },
              },
              {
                '@type': 'Question',
                name: 'Do all AI receptionist plans include SMS notifications?',
                acceptedAnswer: { '@type': 'Answer', text: 'Yes. SMS notifications are included in every plan and cannot be disabled. Every client receives an SMS alert after each call. Email summaries are the configurable add-on that agencies can gate by plan tier.' },
              },
              {
                '@type': 'Question',
                name: 'What happens when I disable a feature for a client plan?',
                acceptedAnswer: { '@type': 'Answer', text: 'Clients on that plan immediately lose access to the feature. They see an upgrade prompt in their dashboard. On the backend, the feature stops being delivered. Nothing is deleted — re-enabling the feature restores it instantly.' },
              },
              {
                '@type': 'Question',
                name: 'Can I give all plans the same features and differentiate only on price?',
                acceptedAnswer: { '@type': 'Answer', text: 'Yes. Just enable all toggles for all three plans. Many agencies differentiate purely on call limits and price rather than features. The feature toggles give you the option to differentiate, but don\'t force you to.' },
              },
            ],
          }),
        }}
      />

    </BlogPostLayout>
  );
}