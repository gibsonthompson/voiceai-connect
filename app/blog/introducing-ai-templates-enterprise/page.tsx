import { Metadata } from 'next';
import BlogPostLayout, { Callout, ComparisonTable } from '../blog-post-layout';

export const metadata: Metadata = {
  title: 'Introducing AI Templates: Custom Prompts for Enterprise Agencies | Product Update',
  description: 'Enterprise agencies can now customize AI receptionist prompts, voices, and conversation flows for each industry. Set once, apply to all new clients automatically.',
  keywords: 'AI receptionist templates, custom AI prompts, enterprise AI agency, white label AI customization, industry-specific AI receptionist, VAPI prompt templates',
  openGraph: {
    title: 'Introducing AI Templates: Custom Prompts for Enterprise Agencies',
    description: 'Enterprise agencies can now customize AI receptionist prompts for each industry. Set once, apply to all new clients.',
    type: 'article',
    publishedTime: '2026-02-05T00:00:00Z',
    authors: ['VoiceAI Connect'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Introducing AI Templates for Enterprise Agencies',
    description: 'Customize AI prompts, voices, and flows for each industry. New enterprise feature.',
  },
  alternates: {
    canonical: '/blog/introducing-ai-templates-enterprise',
  },
};

const meta = {
  title: 'Introducing AI Templates: Custom Prompts for Enterprise Agencies',
  description: 'Enterprise agencies can now customize AI receptionist prompts, voices, and conversation flows for each industry. Set once, apply to all new clients automatically.',
  category: 'product',
  publishedAt: '2026-02-05',
  readTime: '4 min read',
  author: {
    name: 'Gibson Thompson',
    role: 'Founder, VoiceAI Connect',
  },
  tags: ['Product Update', 'Enterprise', 'AI Templates', 'Customization'],
};

const tableOfContents = [
  { id: 'whats-new', title: "What's New", level: 2 },
  { id: 'how-it-works', title: 'How It Works', level: 2 },
  { id: 'supported-industries', title: 'Supported Industries', level: 2 },
  { id: 'what-you-can-customize', title: 'What You Can Customize', level: 2 },
  { id: 'getting-started', title: 'Getting Started', level: 2 },
  { id: 'faq', title: 'FAQ', level: 2 },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Introducing AI Templates: Custom Prompts for Enterprise Agencies",
  "description": "Enterprise agencies can now customize AI receptionist prompts for each industry.",
  "author": { "@type": "Organization", "name": "VoiceAI Connect" },
  "publisher": { "@type": "Organization", "name": "VoiceAI Connect" },
  "datePublished": "2026-02-05",
  "articleSection": "Product Updates"
};

export default function AITemplatesAnnouncementPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BlogPostLayout meta={meta} tableOfContents={tableOfContents}>
        
        <p className="lead">
          Today we're launching <strong>AI Templates</strong>—a new Enterprise feature that lets agencies customize AI receptionist prompts, voices, and conversation flows for each industry they serve. Set your preferences once, and every new client in that industry automatically gets your optimized configuration.
        </p>

        <h2 id="whats-new">What's New</h2>

        <p>
          Until now, all clients started with the same default AI configuration. Agencies serving multiple industries—say, plumbers and dentists—had to manually adjust each client's settings after signup.
        </p>

        <p>
          With AI Templates, you define industry-specific configurations upfront. When a plumber signs up, they get your plumbing template. When a dental office signs up, they get your dental template. No manual work required.
        </p>

        <Callout type="tip" title="Enterprise Feature">
          AI Templates is available on the Enterprise plan. Existing clients keep their current configuration—templates only apply to new signups.
        </Callout>

        <h2 id="how-it-works">How It Works</h2>

        <p>
          The new Templates section in your agency dashboard shows all 11 supported industries. Click any industry to customize:
        </p>

        <ol>
          <li><strong>Open Templates</strong> — Navigate to Agency → Templates in your dashboard</li>
          <li><strong>Select an Industry</strong> — Click the industry you want to customize</li>
          <li><strong>Edit the Prompt</strong> — Modify the system prompt, greeting, or any conversation element</li>
          <li><strong>Adjust Voice Settings</strong> — Choose voice, speed, and tone settings</li>
          <li><strong>Save</strong> — Your template is now active for all new clients in that industry</li>
        </ol>

        <p>
          Templates are version-controlled. You can see when each was last updated and revert if needed.
        </p>

        <h2 id="supported-industries">Supported Industries</h2>

        <p>
          We've built default templates for 11 industries based on thousands of real calls. You can use them as-is or customize to match your agency's approach:
        </p>

        <ComparisonTable
          headers={['Industry', 'Default Includes', 'Common Customizations']}
          rows={[
            ['Home Services', 'Emergency detection, service area checks, scheduling', 'After-hours protocols, pricing ranges'],
            ['Medical & Dental', 'HIPAA-aware language, appointment types, insurance handling', 'Specific providers, intake questions'],
            ['Legal', 'Confidentiality language, case type routing, consultation booking', 'Practice areas, retainer info'],
            ['Real Estate', 'Property inquiries, showing scheduling, lead qualification', 'Market areas, agent routing'],
            ['Financial Services', 'Compliance language, appointment booking, service descriptions', 'Advisor specialties, minimums'],
            ['Restaurants', 'Reservation handling, hours, menu questions', 'Special events, dietary info'],
            ['Fitness & Wellness', 'Class schedules, membership inquiries, trainer booking', 'Trial offers, pricing tiers'],
            ['Automotive', 'Service scheduling, parts inquiries, hours', 'Brands serviced, loaner availability'],
            ['Professional Services', 'Consultation booking, service descriptions, availability', 'Engagement types, team routing'],
            ['Retail', 'Store hours, product availability, returns', 'Promotions, loyalty programs'],
            ['General', 'Universal fallback for any business type', 'Fully customizable'],
          ]}
        />

        <h2 id="what-you-can-customize">What You Can Customize</h2>

        <p>
          Each template gives you control over the full AI configuration:
        </p>

        <h3>Prompt & Conversation</h3>
        <ul>
          <li><strong>System prompt</strong> — The core instructions that define AI behavior</li>
          <li><strong>Greeting</strong> — How the AI answers the phone</li>
          <li><strong>Closing</strong> — How calls end</li>
          <li><strong>Error handling</strong> — What happens when the AI doesn't understand</li>
          <li><strong>Escalation triggers</strong> — When to transfer to a human</li>
        </ul>

        <h3>Voice & Delivery</h3>
        <ul>
          <li><strong>Voice selection</strong> — Choose from available ElevenLabs voices</li>
          <li><strong>Speed</strong> — Adjust speaking pace (0.8x – 1.2x)</li>
          <li><strong>Stability</strong> — Control voice consistency</li>
          <li><strong>Style exaggeration</strong> — Adjust emotional expression</li>
        </ul>

        <h3>Behavior</h3>
        <ul>
          <li><strong>Temperature</strong> — Control response creativity (lower = more consistent)</li>
          <li><strong>Max tokens</strong> — Limit response length</li>
          <li><strong>Interrupt sensitivity</strong> — How easily callers can interrupt</li>
        </ul>

        <Callout type="info" title="Need Prompt Help?">
          Check out our <a href="/blog/ai-receptionist-prompt-guide">AI Receptionist Prompt Engineering Guide</a> and industry-specific guides for <a href="/blog/home-services-ai-receptionist-prompts">Home Services</a> and <a href="/blog/medical-dental-ai-receptionist-prompts">Medical & Dental</a>.
        </Callout>

        <h2 id="getting-started">Getting Started</h2>

        <p>
          If you're on the Enterprise plan, AI Templates is already available in your dashboard:
        </p>

        <ol>
          <li>Log in to your agency dashboard</li>
          <li>Navigate to <strong>Templates</strong> in the sidebar</li>
          <li>Click any industry to view or customize its template</li>
          <li>Start with one industry—we recommend your highest-volume vertical</li>
        </ol>

        <p>
          Not on Enterprise yet? <a href="/agency/settings/billing">Upgrade your plan</a> to access AI Templates and other enterprise features.
        </p>

        <h2 id="faq">FAQ</h2>

        <h3>Do templates affect existing clients?</h3>
        <p>
          No. Templates only apply to <em>new</em> clients who sign up after you save the template. Existing clients keep their current configuration unless you manually update them.
        </p>

        <h3>Can I have multiple templates for the same industry?</h3>
        <p>
          Not currently. Each industry has one template. If you need variations (e.g., different plumbing templates for residential vs. commercial), use the General template and customize per-client.
        </p>

        <h3>What happens if I don't customize a template?</h3>
        <p>
          Clients get our default template for that industry, which is already optimized based on thousands of real calls. Customization is optional.
        </p>

        <h3>Can I copy a template to another industry?</h3>
        <p>
          Yes. When editing a template, use the "Copy from..." dropdown to start from another industry's configuration.
        </p>

        <h3>How do I revert to the default?</h3>
        <p>
          Each template has a "Reset to default" button that restores the original configuration.
        </p>

        <hr />

        <p>
          AI Templates has been one of our most requested features from agencies serving multiple industries. We're excited to see how you use it to deliver even better experiences to your clients.
        </p>

        <p>
          Questions or feedback? Reply to this email or reach out at <a href="mailto:support@voiceaiconnect.com">support@voiceaiconnect.com</a>.
        </p>

      </BlogPostLayout>
    </>
  );
}