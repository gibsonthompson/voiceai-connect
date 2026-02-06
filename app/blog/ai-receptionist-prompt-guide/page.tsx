import { Metadata } from 'next';
import BlogPostLayout, { Callout, ComparisonTable } from '../BlogPostLayout';

export const metadata: Metadata = {
  title: 'AI Receptionist Prompt Engineering Guide 2026 | VAPI & ElevenLabs Best Practices',
  description: 'Complete guide to AI receptionist prompts based on official VAPI and ElevenLabs documentation. Learn prompt structure, voice settings (stability 0.50-0.65, similarity 0.75), conversation flow design, latency optimization (<500ms), and production-ready templates for home services, medical, legal, and more.',
  keywords: 'AI receptionist prompts, VAPI prompt engineering, ElevenLabs voice settings, voice AI latency optimization, AI phone answering system, virtual receptionist prompt template, voice agent conversation design, VAPI system prompt structure, ElevenLabs stability similarity settings, AI appointment booking prompts, voice AI turn detection, conversational AI best practices',
  openGraph: {
    title: 'AI Receptionist Prompt Engineering Guide 2026 | VAPI & ElevenLabs Best Practices',
    description: 'The definitive guide to writing AI receptionist prompts. Based on official VAPI and ElevenLabs documentation. Includes prompt structure, voice settings, latency optimization, and production-ready templates for 11 industries.',
    type: 'article',
    publishedTime: '2026-02-01T00:00:00Z',
    modifiedTime: '2026-02-05T00:00:00Z',
    authors: ['VoiceAI Connect'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Receptionist Prompt Engineering Guide 2026',
    description: 'Complete guide based on official VAPI & ElevenLabs documentation. Prompt structure, voice settings, latency optimization, and industry templates.',
  },
  alternates: {
    canonical: '/blog/ai-receptionist-prompt-guide',
  },
};

const meta = {
  title: 'AI Receptionist Prompt Engineering Guide',
  description: 'A comprehensive reference for writing effective AI receptionist prompts. Based on official VAPI and ElevenLabs documentation, with real-world templates and configuration recommendations.',
  category: 'guides',
  publishedAt: '2026-02-01',
  updatedAt: '2026-02-05',
  readTime: '18 min read',
  author: {
    name: 'Gibson Thompson',
    role: 'Founder, VoiceAI Connect',
  },
  tags: ['VAPI', 'ElevenLabs', 'Prompt Engineering', 'Voice AI', 'AI Receptionist', 'Conversational AI'],
};

const tableOfContents = [
  { id: 'fundamentals', title: 'Prompt Engineering Fundamentals', level: 2 },
  { id: 'structure', title: 'Prompt Structure & Sections', level: 2 },
  { id: 'voice-settings', title: 'Voice Settings (ElevenLabs)', level: 2 },
  { id: 'conversation-flow', title: 'Conversation Flow Design', level: 2 },
  { id: 'error-handling', title: 'Error Handling & Fallbacks', level: 2 },
  { id: 'industry-templates', title: 'Industry-Specific Templates', level: 2 },
  { id: 'optimization', title: 'Testing & Optimization', level: 2 },
  { id: 'common-mistakes', title: 'Common Mistakes to Avoid', level: 2 },
  { id: 'faq', title: 'Frequently Asked Questions', level: 2 },
];

// JSON-LD Structured Data
const structuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "AI Receptionist Prompt Engineering Guide 2026 | VAPI & ElevenLabs Best Practices",
  "description": "Complete guide to AI receptionist prompts based on official VAPI and ElevenLabs documentation.",
  "author": { "@type": "Organization", "name": "VoiceAI Connect" },
  "publisher": { "@type": "Organization", "name": "VoiceAI Connect" },
  "datePublished": "2026-02-01",
  "dateModified": "2026-02-05",
  "articleSection": "Voice AI",
  "keywords": "VAPI prompt engineering, ElevenLabs voice settings, AI receptionist, voice AI, conversational AI"
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are the best ElevenLabs voice settings for AI receptionists?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For professional AI receptionists, use Stability: 0.50-0.65, Similarity Boost: 0.75-0.80, Speed: 0.95-1.05, and Style Exaggeration: 0. Use eleven_flash_v2_5 for low-latency applications."
      }
    },
    {
      "@type": "Question",
      "name": "How should I structure a VAPI voice AI prompt?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Structure VAPI prompts into five sections: [Identity], [Style], [Response Guidelines], [Task], and [Error Handling]."
      }
    },
    {
      "@type": "Question",
      "name": "What is the ideal response latency for voice AI receptionists?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Target sub-500ms end-to-end latency. Vapi typically achieves 800ms with defaults, optimizable to ~465ms."
      }
    }
  ]
};

export default function AIReceptionistPromptGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <BlogPostLayout meta={meta} tableOfContents={tableOfContents}>
        
        <p className="lead">
          Prompt engineering for voice AI is fundamentally different from text-based AI. Voice conversations happen in real-time, require natural speech patterns, and must handle interruptions gracefully. This guide covers everything you need to write effective AI receptionist prompts—based on official VAPI and ElevenLabs documentation.
        </p>

        <h2 id="fundamentals">Prompt Engineering Fundamentals</h2>

        <p>
          The goal of prompt engineering is to create instructions that guide the AI to produce accurate, relevant responses while maintaining natural conversation flow. Your "success rate" is the percentage of requests your agent handles from start to finish without human intervention.
        </p>

        <Callout type="warning" title="Voice vs Text: Key Difference">
          Text-optimized prompts often sound robotic when spoken aloud. Voice-specific prompts should be concise (callers don't want long responses), use natural speech patterns, and guide turn-taking behavior.
        </Callout>

        <h3>The Design-Test-Refine Process</h3>

        <p>
          According to VAPI's official documentation, effective prompt engineering follows a structured iterative process:
        </p>

        <ol>
          <li><strong>Design:</strong> Craft your initial prompt considering the specific task, context, and desired outcome.</li>
          <li><strong>Test:</strong> Run the prompt through the AI and evaluate if responses align with expectations.</li>
          <li><strong>Refine:</strong> Adjust based on test results—reword, add detail, or change phrasing to avoid ambiguity.</li>
          <li><strong>Repeat:</strong> Iterate until the AI's output is accurate and relevant. Success rate should improve each cycle.</li>
        </ol>

        <h3>Measuring Success</h3>

        <p>
          Track these metrics to measure prompt effectiveness:
        </p>

        <ul>
          <li><strong>First-call resolution:</strong> Calls resolved without transfer or callback</li>
          <li><strong>Misroute rate:</strong> How often callers end up in the wrong place</li>
          <li><strong>User churn:</strong> How often users disengage from the conversation</li>
          <li><strong>Conversation repair attempts:</strong> How often the AI needs to clarify or repeat</li>
        </ul>

        <h2 id="structure">Prompt Structure & Sections</h2>

        <p>
          Well-structured prompts break down into clear sections, each focused on a specific aspect of the AI's behavior. This organization helps the AI understand its role and respond consistently.
        </p>

        <h3>Essential Prompt Sections</h3>

        <p>
          <strong>[Identity]</strong> — Define the AI's persona, name, and role. Example: "You are Sarah, a friendly and professional receptionist for Riverside Dental."
        </p>

        <p>
          <strong>[Style]</strong> — Set tone, communication style, and personality traits. Be warm and professional, keep responses concise, use a calm reassuring tone.
        </p>

        <p>
          <strong>[Response Guidelines]</strong> — Specify formatting, pacing, and structural rules. Ask one question at a time, spell out numbers, confirm important details, keep responses under 2-3 sentences.
        </p>

        <p>
          <strong>[Task]</strong> — Outline specific objectives and conversation steps. Define the greeting, intent detection, information collection, and closing sequence.
        </p>

        <p>
          <strong>[Error Handling]</strong> — Define fallback behavior for edge cases. What to do when the AI can't understand, when questions are outside its knowledge, when to transfer.
        </p>

        <h3>Complete Prompt Example</h3>

        <pre><code>{`[Identity]
You are Alex, a friendly and efficient receptionist for Summit Plumbing & HVAC. 
You help callers schedule service appointments, answer basic questions about 
services, and ensure urgent issues are prioritized appropriately.

[Style]
- Warm, professional, and efficient
- Conversational but not overly casual
- Empathetic when callers describe problems
- Concise—this is a phone conversation, not an email

[Response Guidelines]
- Ask one question at a time, then wait for response
- Spell out times and dates clearly (say "Tuesday, January fourteenth at two PM")
- Confirm critical details by repeating them back
- Never invent information—if unsure, offer to have someone call back
- Keep responses to 1-3 sentences maximum

[Task]
1. Greet caller warmly: "Thanks for calling Summit Plumbing and HVAC, this is Alex. How can I help you today?"
2. Determine if this is: scheduling, emergency, question, or existing appointment
3. For emergencies (no heat, flooding, gas smell): immediately collect address and transfer
4. For scheduling: collect name, phone, address, service type, and preferred timing
5. Confirm all details before ending: "Just to confirm, I have you down for..."

[Error Handling]
If the caller's response is unclear, ask a clarifying question: "I want to make sure I 
get this right—did you say Tuesday or Thursday?"
If asked something outside your knowledge, say: "That's a great question. Let me have 
one of our technicians call you back with the details. What's the best number to reach you?"`}</code></pre>

        <h2 id="voice-settings">Voice Settings (ElevenLabs)</h2>

        <p>
          Voice settings control how the AI sounds—not just what it says. These parameters significantly impact caller perception and trust. The following recommendations are based on ElevenLabs' official documentation.
        </p>

        <h3>Core Voice Parameters</h3>

        <p>
          <strong>Stability (0.0 - 1.0)</strong> — Controls consistency and emotional variation. Lower values (0.3-0.5) create more dynamic, expressive delivery but may occasionally sound unstable. Higher values (0.6-0.85) produce consistent but potentially monotonous output. <strong>Recommended for receptionists: 0.50-0.65</strong>
        </p>

        <p>
          <strong>Similarity Boost (0.0 - 1.0)</strong> — Determines how closely the AI adheres to the original voice characteristics. Higher values boost clarity and consistency. Very high values may introduce distortion. <strong>Recommended: 0.75-0.80</strong>
        </p>

        <p>
          <strong>Speed (0.7 - 1.2)</strong> — Adjusts speech rate. Natural conversations typically occur at 0.9-1.1x speed. Slow down for complex information like addresses. <strong>Recommended: 0.95-1.05</strong>
        </p>

        <p>
          <strong>Style Exaggeration (0.0 - 1.0)</strong> — Amplifies the style of the original speaker. Consumes additional resources and may increase latency. <strong>Keep at 0 for professional receptionist roles.</strong>
        </p>

        <h3>Recommended Settings by Use Case</h3>

        <ComparisonTable
          headers={['Use Case', 'Stability', 'Similarity', 'Speed', 'Style']}
          rows={[
            ['Professional Receptionist', '0.55', '0.75', '1.0', '0.0'],
            ['Medical/Dental Office', '0.50', '0.75', '0.95', '0.0'],
            ['Legal Services', '0.60', '0.80', '0.95', '0.0'],
            ['Home Services (HVAC, Plumbing)', '0.55', '0.75', '1.0', '0.05'],
            ['Restaurant/Hospitality', '0.45', '0.70', '1.05', '0.10'],
          ]}
        />

        <Callout type="tip" title="ElevenLabs Model Selection">
          For real-time voice AI receptionists, use <code>eleven_flash_v2_5</code> for ultra-low 75ms latency. If quality is more important than speed, use <code>eleven_multilingual_v2</code> for more nuanced expression.
        </Callout>

        <h2 id="conversation-flow">Conversation Flow Design</h2>

        <p>
          Conversation flow determines how the AI guides callers through interactions. Good flow design anticipates common paths, handles unexpected inputs, and creates natural turn-taking patterns.
        </p>

        <h3>The Acknowledge-Confirm-Prompt Pattern</h3>

        <p>
          Every AI response should follow this three-step rhythm, which mirrors natural human conversation:
        </p>

        <ol>
          <li><strong>Acknowledge:</strong> Show you heard them — "Got it..."</li>
          <li><strong>Confirm:</strong> Reflect understanding — "...you're looking for a Tuesday appointment..."</li>
          <li><strong>Prompt:</strong> Move to next step — "...is morning or afternoon better for you?"</li>
        </ol>

        <h3>Response Timing Control</h3>

        <p>
          VAPI allows you to control when the agent should wait for user response before proceeding. Use the <code>&lt;wait for user response&gt;</code> directive in your conversation flow:
        </p>

        <pre><code>{`[Conversation Flow]
1. Greet: "Thanks for calling! How can I help you today?"
   <wait for user response>
   
2. If scheduling appointment:
   Ask: "Great, I can help with that. What's your name?"
   <wait for user response>
   
3. Ask: "And what phone number should we use to reach you?"
   <wait for user response>
   
4. Ask: "What day works best for you?"
   <wait for user response>
   
5. Confirm: "Perfect. I have [name] scheduled for [day] at [time]. 
   We'll send a confirmation text to [phone]. Is there anything else?"
   <wait for user response>
   
6. Close: "Wonderful, you're all set. Have a great day!"`}</code></pre>

        <h3>Handling Branching Logic</h3>

        <p>
          Real conversations branch based on caller intent. Structure your flow to handle multiple paths without creating dead ends:
        </p>

        <pre><code>{`[Task]
After greeting, determine caller intent:

IF caller wants to schedule:
  → Proceed to [Scheduling Flow]
  
IF caller has emergency (no heat, flooding, gas smell):
  → Say: "I understand this is urgent. Let me get your address 
    and transfer you to our emergency line immediately."
  → Collect address, then trigger transfer tool
  
IF caller has question about services/pricing:
  → Answer from knowledge base if available
  → If unknown: "That's a great question. Let me have someone 
    call you back with those details. What's your number?"
    
IF caller wants to cancel/reschedule:
  → Ask for name and original appointment date
  → Proceed to [Reschedule Flow]`}</code></pre>

        <Callout type="warning" title="Avoid Infinite Loops">
          Always include escape paths in your conversation flow. If the AI can't get a clear answer after 2-3 attempts, offer to transfer or take a message rather than repeatedly asking the same question.
        </Callout>

        <h2 id="error-handling">Error Handling & Fallbacks</h2>

        <p>
          Error handling is what separates amateur setups from professional implementations. Every prompt needs explicit instructions for handling confusion, unclear input, and situations outside the AI's knowledge.
        </p>

        <h3>Conversation Repair Techniques</h3>

        <p>
          When something goes wrong, use this four-step repair sequence:
        </p>

        <ol>
          <li><strong>Acknowledge:</strong> "I apologize, I may have misunderstood."</li>
          <li><strong>Restate:</strong> "It sounded like you said Tuesday at 3 PM."</li>
          <li><strong>Clarify:</strong> "Was that correct, or did you mean something different?"</li>
          <li><strong>Confirm:</strong> "Perfect, I've updated that to Wednesday at 3 PM."</li>
        </ol>

        <h3>No-Match Handling</h3>

        <p>
          When the AI can't understand or match the caller's intent, use progressive fallbacks:
        </p>

        <pre><code>{`[Error Handling]

First no-match:
  "I didn't quite catch that. Could you tell me again what you're calling about?"

Second no-match:
  "I'm having a little trouble understanding. Are you calling to 
  schedule an appointment, ask a question, or something else?"

Third no-match:
  "I want to make sure I help you correctly. Let me transfer you 
  to someone who can assist. One moment please."
  → Trigger transfer to human

[Guardrails]
- Never invent information you weren't given
- If asked about pricing you don't know, offer to have someone call back
- Never confirm appointments without all required information
- If caller seems distressed, prioritize empathy over efficiency`}</code></pre>

        <h3>Silent Transfers</h3>

        <p>
          Per VAPI documentation: If the AI determines that the user needs to be transferred, it should not send any text response back to the user. Instead, silently call the transfer tool. This creates a seamless experience.
        </p>

        <Callout type="tip" title="Prompt Example for Silent Transfers">
          "If you think you are about to transfer the call, do not send any text response. Simply trigger the transfer tool silently. This is crucial for maintaining a smooth call experience."
        </Callout>

        <h2 id="industry-templates">Industry-Specific Templates</h2>

        <p>
          Different industries have unique requirements, terminology, and caller expectations. These templates provide starting points you can customize for specific businesses.
        </p>

        <h3>Medical & Dental</h3>

        <p>
          <strong>Key considerations:</strong> HIPAA awareness—never confirm patient details without verification. Calm, reassuring tone for anxious patients. Clear emergency protocols. Insurance and new patient questions.
        </p>

        <p>
          <strong>Sample greeting:</strong> "Thank you for calling Riverside Dental. I'm your virtual assistant. Are you calling to schedule an appointment, confirm an existing booking, or ask about our services?"
        </p>

        <p>
          <strong>Emergency handling:</strong> "If this is a dental emergency, please say 'emergency' now and I'll connect you immediately. Otherwise, how can I help you today?"
        </p>

        <h3>Legal Services</h3>

        <p>
          <strong>Key considerations:</strong> Professional, authoritative tone. Confidentiality awareness. Clear intake process for new clients. Attorney availability and callback expectations.
        </p>

        <p>
          <strong>Sample greeting:</strong> "Thank you for calling Smith & Associates Law Firm. How may I direct your call?"
        </p>

        <p>
          <strong>Boundary setting:</strong> "We do not provide legal advice over the phone. I can schedule a consultation with an attorney to discuss your situation."
        </p>

        <h3>Home Services (HVAC, Plumbing, Electrical)</h3>

        <p>
          <strong>Key considerations:</strong> Emergency prioritization (no heat, flooding, gas). Service area confirmation. Scheduling flexibility for service windows. Basic troubleshooting when appropriate.
        </p>

        <p>
          <strong>Sample greeting:</strong> "Thanks for calling Summit Plumbing. This is Alex. Are you calling about a service issue or to schedule an appointment?"
        </p>

        <p>
          <strong>Emergency detection:</strong> "If you smell gas or have active flooding, please stay on the line for immediate assistance."
        </p>

        <h3>Real Estate</h3>

        <p>
          <strong>Key considerations:</strong> Property inquiry handling. Showing scheduling. Agent availability and callback. Lead qualification questions.
        </p>

        <p>
          <strong>Sample greeting:</strong> "Thank you for calling Horizon Realty. I can help you with property information or connect you with an agent. Are you looking to buy, sell, or rent?"
        </p>

        <h3>Restaurant</h3>

        <p>
          <strong>Key considerations:</strong> Reservation handling with party size and time. Hours and location information. Menu and dietary restriction questions. Takeout/delivery options.
        </p>

        <p>
          <strong>Sample greeting:</strong> "Thanks for calling Bella Trattoria. Would you like to make a reservation or do you have a question about our menu?"
        </p>

        <p>
          <strong>Special handling:</strong> "For parties of 8 or more, I'll need to check availability with our manager. Let me get your contact information."
        </p>

        <h2 id="optimization">Testing & Optimization</h2>

        <p>
          Prompt engineering is an iterative process. Deploy, measure, and refine continuously based on real call data.
        </p>

        <h3>Testing Checklist</h3>

        <p><strong>Greeting tests:</strong></p>
        <ul>
          <li>Picks up within 2 rings</li>
          <li>States business name clearly</li>
          <li>Asks how to help</li>
        </ul>

        <p><strong>Intent recognition tests:</strong></p>
        <ul>
          <li>Correctly identifies scheduling requests</li>
          <li>Recognizes emergencies</li>
          <li>Handles FAQs appropriately</li>
        </ul>

        <p><strong>Information collection tests:</strong></p>
        <ul>
          <li>Captures name, phone, address accurately</li>
          <li>Confirms spelling of names</li>
          <li>Validates dates and times</li>
        </ul>

        <p><strong>Error recovery tests:</strong></p>
        <ul>
          <li>Handles mumbled input gracefully</li>
          <li>Recovers from misunderstandings</li>
          <li>Knows when to transfer</li>
        </ul>

        <h3>Latency Optimization</h3>

        <p>
          Target sub-500ms end-to-end latency for natural-feeling conversations. Key optimizations:
        </p>

        <ul>
          <li>Use low-latency models: ElevenLabs Flash v2.5 (75ms), GPT-4o-mini (80-150ms)</li>
          <li>Keep <code>maxTokens</code> at 150-200 for voice applications</li>
          <li>Disable unnecessary features like format turns</li>
          <li>Optimize turn detection settings—default settings can add 1.5+ seconds</li>
          <li>Use LLM temperature of 0.3-0.5 for consistent, predictable responses</li>
        </ul>

        <h3>Optimization Tips</h3>

        <ul>
          <li>Review call transcripts weekly—look for patterns in confusion or repeated questions</li>
          <li>Track where callers request human help—these are optimization opportunities</li>
          <li>Test with real phone calls, not just the playground—audio quality matters</li>
          <li>Start with your highest-volume use cases before handling edge cases</li>
          <li>Keep prompts as specific as possible to limit randomness</li>
        </ul>

        <h2 id="common-mistakes">Common Mistakes to Avoid</h2>

        <p>
          <strong>Responses that are too long.</strong> Callers get impatient listening to multi-sentence responses. Keep it under 2-3 sentences. Say "Got it, let me check that for you" instead of "Thank you so much for providing that information. I really appreciate your patience..."
        </p>

        <p>
          <strong>Not spelling out numbers.</strong> Text-to-speech reads "3:30" inconsistently. Some voices say "three colon thirty." Write "three thirty PM" in your prompts, not "3:30 PM".
        </p>

        <p>
          <strong>Asking multiple questions at once.</strong> Callers can only answer one question at a time. Ask "What day works for you?" then wait. Don't ask "What day and time works for you?"
        </p>

        <p>
          <strong>No fallback for unknown questions.</strong> Without explicit instructions, AI may invent information or go silent. Add: "If you don't know the answer, say: Let me have someone call you back with that information."
        </p>

        <p>
          <strong>Generic voice settings.</strong> Default settings (stability 0.5, similarity 0.5) aren't optimized for professional voice agents. Use stability 0.55-0.65 and similarity 0.75-0.80.
        </p>

        <p>
          <strong>Not testing on actual phone calls.</strong> Playground testing doesn't reveal audio quality issues, latency, or real-world caller behavior. Call your own number as if you're a customer.
        </p>

        <h2 id="faq">Frequently Asked Questions</h2>

        <h3>What are the best ElevenLabs voice settings for AI receptionists?</h3>
        <p>
          For professional AI receptionists, use Stability: 0.50-0.65, Similarity Boost: 0.75-0.80, Speed: 0.95-1.05, and Style Exaggeration: 0. These settings balance natural conversation flow with consistent, professional delivery. Use the <code>eleven_flash_v2_5</code> model for low-latency (75ms) real-time applications.
        </p>

        <h3>How should I structure a VAPI voice AI prompt?</h3>
        <p>
          Structure VAPI prompts into five sections: [Identity] - Define the AI's persona and role; [Style] - Set tone and communication guidelines; [Response Guidelines] - Specify formatting rules like spelling out numbers and keeping responses to 1-3 sentences; [Task] - Outline conversation flow with step-by-step instructions; [Error Handling] - Define fallback behavior for unclear inputs or edge cases.
        </p>

        <h3>What is the ideal response latency for voice AI receptionists?</h3>
        <p>
          Target sub-500ms end-to-end latency for natural-feeling conversations. Achieve this by using low-latency models (ElevenLabs Flash v2.5, GPT-4o-mini), keeping maxTokens at 150-200, disabling unnecessary features, and optimizing turn detection settings. Vapi typically achieves 800ms with defaults, optimizable to ~465ms.
        </p>

        <h3>How do I handle errors and fallbacks in AI receptionist prompts?</h3>
        <p>
          Include explicit fallback instructions. For unclear input: ask clarifying questions. After 2-3 failed attempts: offer to transfer to a human. For unknown questions: offer to have someone call back. Always include guardrails like "Never invent information you weren't given."
        </p>

        <h3>What temperature setting should I use for voice AI receptionists?</h3>
        <p>
          Use lower temperature (0.3-0.5) for consistent, predictable responses. This reduces randomness and ensures the AI follows scripts reliably. Higher temperatures add creativity but may cause unpredictable responses. For appointment booking and information collection, lower is better.
        </p>

        <h3>How do I make my AI receptionist sound more natural?</h3>
        <p>
          Keep responses to 1-3 sentences max. Spell out numbers ("three thirty PM" not "3:30 PM"). Add natural speech elements to prompts like hesitations. Use the Acknowledge-Confirm-Prompt pattern. Set voice stability around 0.50-0.55 to allow some emotional variation.
        </p>

        <h3>Can AI receptionists handle appointment booking?</h3>
        <p>
          Yes. Configure your prompt with a clear conversation flow: greet, identify intent, collect name/phone/date/time, confirm details, and close. Integrate with calendar APIs (Cal.com, Google Calendar, Calendly) via VAPI function calls. Include confirmation loops to verify dates and times before booking.
        </p>

        <h3>What's the difference between VAPI and Retell AI for voice agents?</h3>
        <p>
          VAPI is an orchestration layer that lets you combine any transcriber (Deepgram, AssemblyAI), LLM (GPT-4, Claude, Llama), and voice (ElevenLabs, PlayHT) providers. It focuses on low-latency optimization and provides advanced features like smart endpointing and backchanneling. Both platforms support similar use cases but VAPI offers more provider flexibility.
        </p>

        <hr />

        <h3>Quick Reference: Optimal Settings</h3>

        <ComparisonTable
          headers={['Parameter', 'Recommended Value']}
          rows={[
            ['ElevenLabs Stability', '0.50 - 0.65'],
            ['ElevenLabs Similarity', '0.75 - 0.80'],
            ['Target Latency', '< 500ms'],
            ['Max Response Tokens', '150 - 200'],
            ['LLM Temperature', '0.3 - 0.5'],
            ['Speech Speed', '0.95 - 1.05x'],
            ['Response Length', '1-3 sentences'],
            ['Style Exaggeration', '0.0'],
          ]}
        />

        <p>
          <em>This guide is based on official documentation from <a href="https://docs.vapi.ai/prompting-guide" target="_blank" rel="noopener noreferrer">VAPI</a> and <a href="https://elevenlabs.io/docs/speech-synthesis/voice-settings" target="_blank" rel="noopener noreferrer">ElevenLabs</a>.</em>
        </p>

      </BlogPostLayout>
    </>
  );
}