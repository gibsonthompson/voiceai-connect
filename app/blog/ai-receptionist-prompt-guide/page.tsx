import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowLeft, BookOpen, Zap, MessageSquare, Settings, AlertCircle, 
  CheckCircle, Code, Mic, Phone, Clock, Users, ChevronRight,
  Lightbulb, Target, Volume2, Sliders, FileText, RefreshCw
} from 'lucide-react';

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
    tags: ['AI Receptionist', 'Voice AI', 'VAPI', 'ElevenLabs', 'Prompt Engineering', 'Conversational AI'],
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

// JSON-LD Structured Data for SEO and AI discoverability
const structuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "AI Receptionist Prompt Engineering Guide 2026 | VAPI & ElevenLabs Best Practices",
  "description": "Complete guide to AI receptionist prompts based on official VAPI and ElevenLabs documentation. Learn prompt structure, voice settings, conversation flow design, and production-ready templates.",
  "author": {
    "@type": "Organization",
    "name": "VoiceAI Connect"
  },
  "publisher": {
    "@type": "Organization",
    "name": "VoiceAI Connect"
  },
  "datePublished": "2026-02-01",
  "dateModified": "2026-02-05",
  "mainEntityOfPage": {
    "@type": "WebPage"
  },
  "articleSection": "Voice AI",
  "keywords": "VAPI prompt engineering, ElevenLabs voice settings, AI receptionist, voice AI, conversational AI",
  "about": [
    { "@type": "Thing", "name": "VAPI Voice AI" },
    { "@type": "Thing", "name": "ElevenLabs Text-to-Speech" },
    { "@type": "Thing", "name": "Prompt Engineering" },
    { "@type": "Thing", "name": "Conversational AI" }
  ]
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
        "text": "For professional AI receptionists, use Stability: 0.50-0.65, Similarity Boost: 0.75-0.80, Speed: 0.95-1.05, and Style Exaggeration: 0. These settings balance natural conversation flow with consistent, professional delivery. Use the eleven_flash_v2_5 model for low-latency (75ms) real-time applications."
      }
    },
    {
      "@type": "Question",
      "name": "How should I structure a VAPI voice AI prompt?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Structure VAPI prompts into five sections: [Identity] - Define the AI's persona and role; [Style] - Set tone and communication guidelines; [Response Guidelines] - Specify formatting rules like spelling out numbers and keeping responses to 1-3 sentences; [Task] - Outline conversation flow with step-by-step instructions; [Error Handling] - Define fallback behavior for unclear inputs or edge cases."
      }
    },
    {
      "@type": "Question",
      "name": "What is the ideal response latency for voice AI receptionists?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Target sub-500ms end-to-end latency for natural-feeling conversations. Achieve this by using low-latency models (ElevenLabs Flash v2.5, GPT-4o-mini), keeping maxTokens at 150-200, disabling unnecessary features like format turns, and optimizing turn detection settings. Vapi typically achieves 800ms end-to-end with default settings, optimizable to ~465ms."
      }
    },
    {
      "@type": "Question", 
      "name": "How do I handle errors and fallbacks in AI receptionist prompts?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Include explicit fallback instructions in your prompt. For unclear input: ask clarifying questions ('I didn't quite catch that. Could you repeat?'). After 2-3 failed attempts: offer to transfer to a human. For unknown questions: 'Let me have someone call you back with those details.' Always include guardrails like 'Never invent information you weren't given.'"
      }
    },
    {
      "@type": "Question",
      "name": "What temperature setting should I use for voice AI receptionists?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use lower temperature (0.3-0.5) for consistent, predictable responses in professional receptionist roles. This reduces randomness and ensures the AI follows scripts reliably. Higher temperatures (0.7-0.9) add creativity but may cause unpredictable responses. For appointment booking and information collection, lower is better."
      }
    }
  ]
};

export default function PromptGuidePage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      {/* Navigation */}
      <nav className="border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link 
              href="/blog" 
              className="flex items-center gap-2 text-sm text-[#fafaf9]/60 hover:text-[#fafaf9] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
            <Link 
              href="/" 
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              VoiceAI Connect
            </Link>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              Technical Guide
            </span>
            <span className="text-sm text-[#fafaf9]/40">Updated February 2026</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight mb-6">
            AI Receptionist Prompt Engineering Guide
          </h1>
          
          <p className="text-lg sm:text-xl text-[#fafaf9]/60 leading-relaxed">
            A comprehensive reference for writing effective AI receptionist prompts. 
            Based on official VAPI and ElevenLabs documentation, with real-world templates 
            and configuration recommendations for each industry.
          </p>
        </header>

        {/* Table of Contents */}
        <nav className="mb-12 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <h2 className="text-sm font-semibold text-[#fafaf9]/40 uppercase tracking-wider mb-4">
            Table of Contents
          </h2>
          <ol className="space-y-2 text-sm">
            {[
              { id: 'fundamentals', title: '1. Prompt Engineering Fundamentals' },
              { id: 'structure', title: '2. Prompt Structure & Sections' },
              { id: 'voice-settings', title: '3. Voice Settings (ElevenLabs)' },
              { id: 'conversation-flow', title: '4. Conversation Flow Design' },
              { id: 'error-handling', title: '5. Error Handling & Fallbacks' },
              { id: 'industry-templates', title: '6. Industry-Specific Templates' },
              { id: 'optimization', title: '7. Testing & Optimization' },
              { id: 'common-mistakes', title: '8. Common Mistakes to Avoid' },
              { id: 'faq', title: '9. Frequently Asked Questions' },
            ].map((item) => (
              <li key={item.id}>
                <a 
                  href={`#${item.id}`}
                  className="text-[#fafaf9]/70 hover:text-emerald-400 transition-colors"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Content */}
        <div className="prose prose-invert prose-emerald max-w-none">
          
          {/* Section 1: Fundamentals */}
          <section id="fundamentals" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Lightbulb className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">1. Prompt Engineering Fundamentals</h2>
            </div>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-6">
              Prompt engineering for voice AI is fundamentally different from text-based AI. 
              Voice conversations happen in real-time, require natural speech patterns, and must 
              handle interruptions gracefully. The goal is to create prompts that guide the AI 
              to produce accurate, relevant responses while maintaining a natural conversation flow.
            </p>

            <div className="p-5 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 mb-6">
              <h4 className="text-amber-300 font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Key Difference: Voice vs Text
              </h4>
              <p className="text-sm text-[#fafaf9]/60 m-0">
                Text-optimized prompts often produce responses that sound robotic when spoken aloud. 
                Voice-specific prompts should be concise (callers don't want to listen to long responses), 
                use natural speech patterns, and guide turn-taking behavior.
              </p>
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">The Design-Test-Refine Process</h3>
            
            <p className="text-[#fafaf9]/70 leading-relaxed mb-4">
              According to VAPI's official documentation, effective prompt engineering follows a structured 
              iterative process:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {[
                { 
                  step: '1. Design', 
                  desc: 'Craft your initial prompt considering the specific task, context, and desired outcome.' 
                },
                { 
                  step: '2. Test', 
                  desc: 'Run the prompt through the AI and evaluate if responses align with expectations.' 
                },
                { 
                  step: '3. Refine', 
                  desc: 'Adjust based on test results—reword, add detail, or change phrasing to avoid ambiguity.' 
                },
                { 
                  step: '4. Repeat', 
                  desc: 'Iterate until the AI\'s output is accurate and relevant. Success rate should improve each cycle.' 
                },
              ].map((item) => (
                <div key={item.step} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-emerald-400 font-medium text-sm mb-1">{item.step}</p>
                  <p className="text-sm text-[#fafaf9]/60 m-0">{item.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">Measuring Success</h3>
            
            <p className="text-[#fafaf9]/70 leading-relaxed">
              Your "success rate" is the percentage of requests your agent handles from start to finish 
              without human intervention. Track these metrics to measure prompt effectiveness:
            </p>

            <ul className="mt-4 space-y-2">
              {[
                'First-call resolution: Calls resolved without transfer or callback',
                'Misroute rate: How often callers end up in the wrong place',
                'User churn: How often users disengage from the conversation',
                'Conversation repair attempts: How often the AI needs to clarify or repeat',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[#fafaf9]/70">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-1 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2: Structure */}
          <section id="structure" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">2. Prompt Structure & Sections</h2>
            </div>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-6">
              Well-structured prompts break down into clear sections, each focused on a specific aspect 
              of the AI's behavior. This organization helps the AI understand its role and respond consistently.
            </p>

            <h3 className="text-lg font-semibold mt-8 mb-4">Essential Prompt Sections</h3>

            <div className="space-y-4 mb-8">
              {[
                {
                  section: '[Identity]',
                  purpose: 'Define the AI\'s persona, name, and role',
                  example: 'You are Sarah, a friendly and professional receptionist for Riverside Dental. Your role is to help callers with appointments, answer questions, and ensure they feel welcomed.',
                  color: 'emerald',
                },
                {
                  section: '[Style]',
                  purpose: 'Set tone, communication style, and personality traits',
                  example: '- Be warm and professional\n- Keep responses concise (this is a voice conversation)\n- Use a calm, reassuring tone\n- Avoid medical jargon when possible',
                  color: 'blue',
                },
                {
                  section: '[Response Guidelines]',
                  purpose: 'Specify formatting, pacing, and structural rules',
                  example: '- Ask one question at a time\n- Spell out numbers (say "three thirty" not "3:30")\n- Confirm important details by repeating them back\n- Keep responses under 2-3 sentences',
                  color: 'amber',
                },
                {
                  section: '[Task]',
                  purpose: 'Outline specific objectives and conversation steps',
                  example: '1. Greet the caller warmly\n2. Ask how you can help today\n3. If scheduling, collect name, preferred date/time, and service needed\n4. Confirm all details before ending call',
                  color: 'purple',
                },
                {
                  section: '[Error Handling]',
                  purpose: 'Define fallback behavior for edge cases',
                  example: 'If you cannot understand the caller, politely ask them to repeat. If a question is outside your knowledge, offer to transfer to a team member.',
                  color: 'rose',
                },
              ].map((item) => (
                <div key={item.section} className="rounded-xl border border-white/[0.06] overflow-hidden">
                  <div className={`px-4 py-2 bg-${item.color}-500/10 border-b border-white/[0.06]`}>
                    <code className={`text-${item.color}-400 font-mono text-sm`}>{item.section}</code>
                    <span className="text-[#fafaf9]/50 text-sm ml-3">{item.purpose}</span>
                  </div>
                  <div className="p-4 bg-[#0a0a0a]">
                    <pre className="text-sm text-[#fafaf9]/70 whitespace-pre-wrap m-0 font-mono">
                      {item.example}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">Complete Prompt Example</h3>

            <div className="rounded-xl border border-white/[0.06] overflow-hidden mb-6">
              <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-sm text-[#fafaf9]/60">Home Services Receptionist</span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Production Ready</span>
              </div>
              <div className="p-4 bg-[#0a0a0a] overflow-x-auto">
                <pre className="text-sm text-[#fafaf9]/80 whitespace-pre-wrap m-0 font-mono leading-relaxed">{`[Identity]
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
one of our technicians call you back with the details. What's the best number to reach you?"`}</pre>
              </div>
            </div>
          </section>

          {/* Section 3: Voice Settings */}
          <section id="voice-settings" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Sliders className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">3. Voice Settings (ElevenLabs)</h2>
            </div>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-6">
              Voice settings control how the AI sounds—not just what it says. These parameters 
              significantly impact caller perception and trust. The following recommendations 
              are based on ElevenLabs' official documentation and real-world testing.
            </p>

            <h3 className="text-lg font-semibold mt-8 mb-4">Core Voice Parameters</h3>

            <div className="space-y-6 mb-8">
              {[
                {
                  name: 'Stability',
                  range: '0.0 - 1.0',
                  recommended: '0.50 - 0.65 for receptionists',
                  description: 'Controls consistency and emotional variation. Lower values (0.3-0.5) create more dynamic, expressive delivery but may occasionally sound unstable. Higher values (0.6-0.85) produce consistent but potentially monotonous output.',
                  tips: [
                    'For professional receptionists: 0.50-0.65 balances warmth with consistency',
                    'For empathetic roles (medical, legal): 0.45-0.55 allows more emotional range',
                    'Avoid going above 0.75—voices can sound robotic',
                  ],
                },
                {
                  name: 'Similarity Boost',
                  range: '0.0 - 1.0',
                  recommended: '0.70 - 0.80 for most use cases',
                  description: 'Determines how closely the AI adheres to the original voice characteristics. Higher values boost clarity and consistency. Very high values may introduce distortion.',
                  tips: [
                    'Standard setting: 0.75 works well for most voices',
                    'If using a cloned voice, match to original audio quality',
                    'Lower if you notice artifacts or background noise',
                  ],
                },
                {
                  name: 'Speed',
                  range: '0.7 - 1.2',
                  recommended: '0.95 - 1.05 for natural conversation',
                  description: 'Adjusts speech rate. Natural conversations typically occur at 0.9-1.1x speed. Extreme values affect quality.',
                  tips: [
                    'Slow down (0.9-0.95) for complex information like addresses or times',
                    'Speed up slightly (1.05) for routine confirmations',
                    'Never go below 0.85 or above 1.15—sounds unnatural',
                  ],
                },
                {
                  name: 'Style Exaggeration',
                  range: '0.0 - 1.0',
                  recommended: '0.0 - 0.1 for receptionists',
                  description: 'Amplifies the style of the original speaker. Higher values increase dramatic emphasis. Consumes additional resources and may increase latency.',
                  tips: [
                    'Keep at 0 for professional receptionist roles',
                    'Only increase (0.1-0.3) for entertainment or character voices',
                    'Higher values can make the voice less stable',
                  ],
                },
              ].map((param) => (
                <div key={param.name} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-[#fafaf9]">{param.name}</h4>
                      <p className="text-xs text-[#fafaf9]/40 mt-1">Range: {param.range}</p>
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                      {param.recommended}
                    </span>
                  </div>
                  <p className="text-sm text-[#fafaf9]/60 mb-4">{param.description}</p>
                  <div className="space-y-1">
                    {param.tips.map((tip, i) => (
                      <p key={i} className="text-xs text-[#fafaf9]/50 flex items-start gap-2">
                        <span className="text-emerald-400">•</span>
                        {tip}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">Recommended Settings by Use Case</h3>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-4 text-[#fafaf9]/60 font-medium">Use Case</th>
                    <th className="text-left py-3 px-4 text-[#fafaf9]/60 font-medium">Stability</th>
                    <th className="text-left py-3 px-4 text-[#fafaf9]/60 font-medium">Similarity</th>
                    <th className="text-left py-3 px-4 text-[#fafaf9]/60 font-medium">Speed</th>
                    <th className="text-left py-3 px-4 text-[#fafaf9]/60 font-medium">Style</th>
                  </tr>
                </thead>
                <tbody className="text-[#fafaf9]/70">
                  <tr className="border-b border-white/[0.06]">
                    <td className="py-3 px-4">Professional Receptionist</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.55</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.75</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">1.0</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.0</td>
                  </tr>
                  <tr className="border-b border-white/[0.06]">
                    <td className="py-3 px-4">Medical/Dental Office</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.50</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.75</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.95</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.0</td>
                  </tr>
                  <tr className="border-b border-white/[0.06]">
                    <td className="py-3 px-4">Legal Services</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.60</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.80</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.95</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.0</td>
                  </tr>
                  <tr className="border-b border-white/[0.06]">
                    <td className="py-3 px-4">Home Services (HVAC, Plumbing)</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.55</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.75</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">1.0</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.05</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Restaurant/Hospitality</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.45</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.70</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">1.05</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">0.10</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-5 rounded-xl bg-blue-500/[0.08] border border-blue-500/20">
              <h4 className="text-blue-300 font-medium mb-2">ElevenLabs Model Selection</h4>
              <p className="text-sm text-[#fafaf9]/60 m-0">
                For real-time voice AI receptionists, use <code className="text-blue-300">eleven_flash_v2_5</code> for 
                ultra-low 75ms latency. If quality is more important than speed, use <code className="text-blue-300">eleven_multilingual_v2</code> for 
                more nuanced expression. Test both with your specific voice to find the best fit.
              </p>
            </div>
          </section>

          {/* Section 4: Conversation Flow */}
          <section id="conversation-flow" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">4. Conversation Flow Design</h2>
            </div>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-6">
              Conversation flow determines how the AI guides callers through interactions. 
              Good flow design anticipates common paths, handles unexpected inputs, and 
              creates natural turn-taking patterns.
            </p>

            <h3 className="text-lg font-semibold mt-8 mb-4">The Acknowledge-Confirm-Prompt Pattern</h3>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-4">
              Every AI response should follow this three-step rhythm, which mirrors natural human conversation:
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { 
                  step: 'Acknowledge', 
                  desc: 'Show you heard them',
                  example: '"Got it..."',
                },
                { 
                  step: 'Confirm', 
                  desc: 'Reflect understanding',
                  example: '"...you\'re looking for a Tuesday appointment..."',
                },
                { 
                  step: 'Prompt', 
                  desc: 'Move to next step',
                  example: '"...is morning or afternoon better for you?"',
                },
              ].map((item) => (
                <div key={item.step} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <p className="text-emerald-400 font-semibold mb-1">{item.step}</p>
                  <p className="text-sm text-[#fafaf9]/60 mb-2">{item.desc}</p>
                  <p className="text-xs text-[#fafaf9]/40 italic">{item.example}</p>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">Response Timing Control</h3>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-4">
              VAPI allows you to control when the agent should wait for user response before proceeding. 
              Use the <code className="text-emerald-400">&lt;wait for user response&gt;</code> directive in 
              your conversation flow:
            </p>

            <div className="rounded-xl border border-white/[0.06] overflow-hidden mb-6">
              <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.06]">
                <span className="text-sm text-[#fafaf9]/60">Conversation Flow Example</span>
              </div>
              <div className="p-4 bg-[#0a0a0a]">
                <pre className="text-sm text-[#fafaf9]/80 whitespace-pre-wrap m-0 font-mono">{`[Conversation Flow]
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
   
6. Close: "Wonderful, you're all set. Have a great day!"`}</pre>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">Handling Branching Logic</h3>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-4">
              Real conversations branch based on caller intent. Structure your flow to handle 
              multiple paths without creating dead ends:
            </p>

            <div className="rounded-xl border border-white/[0.06] overflow-hidden mb-6">
              <div className="p-4 bg-[#0a0a0a]">
                <pre className="text-sm text-[#fafaf9]/80 whitespace-pre-wrap m-0 font-mono">{`[Task]
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
  → Proceed to [Reschedule Flow]`}</pre>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-amber-500/[0.08] border border-amber-500/20">
              <h4 className="text-amber-300 font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Avoid Infinite Loops
              </h4>
              <p className="text-sm text-[#fafaf9]/60 m-0">
                Always include escape paths in your conversation flow. If the AI can't get a clear answer 
                after 2-3 attempts, offer to transfer or take a message rather than repeatedly asking 
                the same question.
              </p>
            </div>
          </section>

          {/* Section 5: Error Handling */}
          <section id="error-handling" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <AlertCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">5. Error Handling & Fallbacks</h2>
            </div>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-6">
              Error handling is what separates amateur setups from professional implementations. 
              Every prompt needs explicit instructions for handling confusion, unclear input, 
              and situations outside the AI's knowledge.
            </p>

            <h3 className="text-lg font-semibold mt-8 mb-4">Conversation Repair Techniques</h3>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-4">
              When something goes wrong, use this four-step repair sequence:
            </p>

            <div className="space-y-3 mb-8">
              {[
                { step: 'Acknowledge', example: '"I apologize, I may have misunderstood."' },
                { step: 'Restate', example: '"It sounded like you said Tuesday at 3 PM."' },
                { step: 'Clarify', example: '"Was that correct, or did you mean something different?"' },
                { step: 'Confirm', example: '"Perfect, I\'ve updated that to Wednesday at 3 PM."' },
              ].map((item, i) => (
                <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-[#fafaf9]">{item.step}</p>
                    <p className="text-sm text-[#fafaf9]/60 italic">{item.example}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">No-Match Handling</h3>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-4">
              When the AI can't understand or match the caller's intent, use progressive fallbacks:
            </p>

            <div className="rounded-xl border border-white/[0.06] overflow-hidden mb-6">
              <div className="p-4 bg-[#0a0a0a]">
                <pre className="text-sm text-[#fafaf9]/80 whitespace-pre-wrap m-0 font-mono">{`[Error Handling]

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
- If caller seems distressed, prioritize empathy over efficiency`}</pre>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">Silent Transfers</h3>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-4">
              Per VAPI documentation: If the AI determines that the user needs to be transferred, 
              it should not send any text response back to the user. Instead, silently call the 
              transfer tool. This creates a seamless experience.
            </p>

            <div className="p-5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
              <h4 className="text-emerald-300 font-medium mb-2">Prompt Example</h4>
              <p className="text-sm text-[#fafaf9]/60 m-0 font-mono">
                "If you think you are about to transfer the call, do not send any text response. 
                Simply trigger the transfer tool silently. This is crucial for maintaining a 
                smooth call experience."
              </p>
            </div>
          </section>

          {/* Section 6: Industry Templates */}
          <section id="industry-templates" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">6. Industry-Specific Templates</h2>
            </div>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-6">
              Different industries have unique requirements, terminology, and caller expectations. 
              These templates provide starting points that you can customize for specific businesses.
            </p>

            <div className="space-y-6">
              {[
                {
                  industry: 'Medical & Dental',
                  icon: '🏥',
                  considerations: [
                    'HIPAA awareness—never confirm patient details without verification',
                    'Calm, reassuring tone for anxious patients',
                    'Clear emergency protocols',
                    'Insurance and new patient questions',
                  ],
                  greeting: 'Thank you for calling [Practice Name]. This is [Name], how may I help you today?',
                  special: 'For medical emergencies, please hang up and dial 911.',
                },
                {
                  industry: 'Legal Services',
                  icon: '⚖️',
                  considerations: [
                    'Professional, authoritative tone',
                    'Confidentiality awareness',
                    'Clear intake process for new clients',
                    'Attorney availability and callback expectations',
                  ],
                  greeting: 'Thank you for calling [Firm Name]. How may I direct your call?',
                  special: 'We do not provide legal advice over the phone. I can schedule a consultation with an attorney.',
                },
                {
                  industry: 'Home Services',
                  icon: '🔧',
                  considerations: [
                    'Emergency prioritization (no heat, flooding, gas)',
                    'Service area confirmation',
                    'Scheduling flexibility for service windows',
                    'Basic troubleshooting when appropriate',
                  ],
                  greeting: 'Thanks for calling [Company]. This is [Name]. Are you calling about a service issue or to schedule an appointment?',
                  special: 'If you smell gas or have active flooding, please stay on the line for immediate assistance.',
                },
                {
                  industry: 'Real Estate',
                  icon: '🏠',
                  considerations: [
                    'Property inquiry handling',
                    'Showing scheduling',
                    'Agent availability and callback',
                    'Lead qualification questions',
                  ],
                  greeting: 'Thank you for calling [Agency]. I can help you with property information or connect you with an agent. What are you looking for?',
                  special: 'I can tell you about properties currently available. Are you looking to buy, sell, or rent?',
                },
                {
                  industry: 'Restaurant',
                  icon: '🍽️',
                  considerations: [
                    'Reservation handling with party size and time',
                    'Hours and location information',
                    'Menu and dietary restriction questions',
                    'Takeout/delivery options',
                  ],
                  greeting: 'Thanks for calling [Restaurant]. Would you like to make a reservation or do you have a question?',
                  special: 'For parties of 8 or more, I\'ll need to check availability with our manager.',
                },
              ].map((item) => (
                <div key={item.industry} className="rounded-xl border border-white/[0.06] overflow-hidden">
                  <div className="px-5 py-4 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <h3 className="font-semibold text-lg m-0">{item.industry}</h3>
                  </div>
                  <div className="p-5">
                    <h4 className="text-sm font-medium text-[#fafaf9]/60 uppercase tracking-wider mb-3">
                      Key Considerations
                    </h4>
                    <ul className="space-y-1 mb-4">
                      {item.considerations.map((c, i) => (
                        <li key={i} className="text-sm text-[#fafaf9]/70 flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-emerald-400 mt-1 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                    
                    <h4 className="text-sm font-medium text-[#fafaf9]/60 uppercase tracking-wider mb-2 mt-4">
                      Sample Greeting
                    </h4>
                    <p className="text-sm text-[#fafaf9]/70 italic bg-white/[0.02] p-3 rounded-lg mb-4">
                      "{item.greeting}"
                    </p>
                    
                    <h4 className="text-sm font-medium text-[#fafaf9]/60 uppercase tracking-wider mb-2">
                      Special Handling
                    </h4>
                    <p className="text-sm text-[#fafaf9]/70 italic bg-amber-500/[0.05] p-3 rounded-lg border border-amber-500/10">
                      "{item.special}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 7: Optimization */}
          <section id="optimization" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <RefreshCw className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">7. Testing & Optimization</h2>
            </div>

            <p className="text-[#fafaf9]/70 leading-relaxed mb-6">
              Prompt engineering is an iterative process. Deploy, measure, and refine continuously 
              based on real call data.
            </p>

            <h3 className="text-lg font-semibold mt-8 mb-4">Testing Checklist</h3>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { category: 'Greeting', tests: ['Picks up within 2 rings', 'States business name clearly', 'Asks how to help'] },
                { category: 'Intent Recognition', tests: ['Correctly identifies scheduling requests', 'Recognizes emergencies', 'Handles FAQs'] },
                { category: 'Information Collection', tests: ['Captures name, phone, address accurately', 'Confirms spelling of names', 'Validates dates and times'] },
                { category: 'Error Recovery', tests: ['Handles mumbled input gracefully', 'Recovers from misunderstandings', 'Knows when to transfer'] },
              ].map((item) => (
                <div key={item.category} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <h4 className="font-medium text-[#fafaf9] mb-3">{item.category}</h4>
                  <ul className="space-y-2">
                    {item.tests.map((test, i) => (
                      <li key={i} className="text-sm text-[#fafaf9]/60 flex items-center gap-2">
                        <div className="h-4 w-4 rounded border border-white/20" />
                        {test}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">Optimization Tips</h3>

            <ul className="space-y-3">
              {[
                'Review call transcripts weekly—look for patterns in confusion or repeated questions',
                'Track where callers request human help—these are optimization opportunities',
                'Test with real phone calls, not just the playground—audio quality matters',
                'Start with your highest-volume use cases (scheduling, FAQs) before handling edge cases',
                'Keep prompts as specific as possible to limit randomness and ensure consistent behavior',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-[#fafaf9]/70">
                  <Zap className="h-4 w-4 text-amber-400 mt-1 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 8: Common Mistakes */}
          <section id="common-mistakes" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                <AlertCircle className="h-5 w-5 text-rose-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">8. Common Mistakes to Avoid</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  mistake: 'Responses that are too long',
                  why: 'Callers get impatient listening to multi-sentence responses. Keep it under 2-3 sentences.',
                  fix: 'Say "Got it, let me check that for you" instead of "Thank you so much for providing that information. I really appreciate your patience. Let me take a moment to look that up in our system for you."',
                },
                {
                  mistake: 'Not spelling out numbers',
                  why: 'Text-to-speech reads "3:30" as "three thirty" inconsistently. Some voices say "three colon thirty."',
                  fix: 'Write "three thirty PM" in your prompts, not "3:30 PM"',
                },
                {
                  mistake: 'Asking multiple questions at once',
                  why: 'Callers can only answer one question at a time. Multiple questions cause confusion.',
                  fix: 'Ask "What day works for you?" then wait. Don\'t ask "What day and time works for you?"',
                },
                {
                  mistake: 'No fallback for unknown questions',
                  why: 'Without explicit instructions, AI may invent information or go silent.',
                  fix: 'Add: "If you don\'t know the answer, say: Let me have someone call you back with that information."',
                },
                {
                  mistake: 'Generic voice settings',
                  why: 'Default settings (stability 0.5, similarity 0.5) are not optimized for professional voice agents.',
                  fix: 'Use stability 0.55-0.65 and similarity 0.75-0.80 for natural, consistent receptionist voices.',
                },
                {
                  mistake: 'Not testing on actual phone calls',
                  why: 'Playground testing doesn\'t reveal audio quality issues, latency, or real-world caller behavior.',
                  fix: 'Test with real phone calls before going live. Call your own number as if you\'re a customer.',
                },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold shrink-0">
                      ✕
                    </span>
                    <h4 className="font-medium text-[#fafaf9] m-0">{item.mistake}</h4>
                  </div>
                  <p className="text-sm text-[#fafaf9]/50 mb-3 ml-9">{item.why}</p>
                  <div className="ml-9 p-3 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/10">
                    <p className="text-sm text-emerald-300 m-0">
                      <span className="font-medium">Fix:</span> {item.fix}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Footer CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-emerald-500/[0.08] to-transparent border border-emerald-500/20 text-center">
          <h3 className="text-xl font-semibold mb-3">Ready to build your AI receptionist agency?</h3>
          <p className="text-[#fafaf9]/60 mb-6 max-w-xl mx-auto">
            VoiceAI Connect provides white-label AI receptionists with optimized prompts for 11 industries. 
            Start your 14-day free trial.
          </p>
          <Link 
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#050505] hover:bg-[#fafaf9] transition-colors"
          >
            Start Free Trial
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Related Articles */}
        <div className="mt-12 pt-12 border-t border-white/[0.06]">
          <h3 className="text-lg font-semibold mb-6">Related Guides</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Home Services AI Prompts', href: '/blog/home-services-ai-prompts', desc: 'Specific templates for plumbers, HVAC, electricians' },
              { title: 'Medical & Dental AI Prompts', href: '/blog/medical-dental-ai-prompts', desc: 'HIPAA-aware prompts for healthcare' },
            ].map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors group"
              >
                <h4 className="font-medium text-[#fafaf9] group-hover:text-emerald-400 transition-colors">
                  {article.title}
                </h4>
                <p className="text-sm text-[#fafaf9]/50 mt-1">{article.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ Section for SEO */}
        <section id="faq" className="mt-16 pt-12 border-t border-white/[0.06] scroll-mt-24">
          <h2 className="text-2xl font-semibold mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                q: "What are the best ElevenLabs voice settings for AI receptionists?",
                a: "For professional AI receptionists, use Stability: 0.50-0.65, Similarity Boost: 0.75-0.80, Speed: 0.95-1.05, and Style Exaggeration: 0. These settings balance natural conversation flow with consistent, professional delivery. Use the eleven_flash_v2_5 model for low-latency (75ms) real-time applications."
              },
              {
                q: "How should I structure a VAPI voice AI prompt?",
                a: "Structure VAPI prompts into five sections: [Identity] - Define the AI's persona and role; [Style] - Set tone and communication guidelines; [Response Guidelines] - Specify formatting rules like spelling out numbers and keeping responses to 1-3 sentences; [Task] - Outline conversation flow with step-by-step instructions; [Error Handling] - Define fallback behavior for unclear inputs or edge cases."
              },
              {
                q: "What is the ideal response latency for voice AI receptionists?",
                a: "Target sub-500ms end-to-end latency for natural-feeling conversations. Achieve this by using low-latency models (ElevenLabs Flash v2.5, GPT-4o-mini), keeping maxTokens at 150-200, disabling unnecessary features, and optimizing turn detection settings. Vapi typically achieves 800ms with defaults, optimizable to ~465ms."
              },
              {
                q: "How do I handle errors and fallbacks in AI receptionist prompts?",
                a: "Include explicit fallback instructions. For unclear input: ask clarifying questions. After 2-3 failed attempts: offer to transfer to a human. For unknown questions: offer to have someone call back. Always include guardrails like 'Never invent information you weren't given.'"
              },
              {
                q: "What temperature setting should I use for voice AI receptionists?",
                a: "Use lower temperature (0.3-0.5) for consistent, predictable responses. This reduces randomness and ensures the AI follows scripts reliably. Higher temperatures add creativity but may cause unpredictable responses. For appointment booking and information collection, lower is better."
              },
              {
                q: "How do I make my AI receptionist sound more natural?",
                a: "Keep responses to 1-3 sentences max. Spell out numbers ('three thirty PM' not '3:30 PM'). Add natural speech elements to prompts like hesitations. Use the Acknowledge-Confirm-Prompt pattern ('Got it... you're looking for Tuesday... is morning or afternoon better?'). Set voice stability around 0.50-0.55 to allow some emotional variation."
              },
              {
                q: "Can AI receptionists handle appointment booking?",
                a: "Yes. Configure your prompt with a clear conversation flow: greet, identify intent, collect name/phone/date/time, confirm details, and close. Integrate with calendar APIs (Cal.com, Google Calendar, Calendly) via VAPI function calls. Include confirmation loops to verify dates and times before booking."
              },
              {
                q: "What's the difference between VAPI and Retell AI for voice agents?",
                a: "VAPI is an orchestration layer that lets you combine any transcriber (Deepgram, AssemblyAI), LLM (GPT-4, Claude, Llama), and voice (ElevenLabs, PlayHT) providers. It focuses on low-latency optimization and provides advanced features like smart endpointing and backchanneling. Both platforms support similar use cases but VAPI offers more provider flexibility."
              }
            ].map((faq, i) => (
              <div key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <h3 className="font-medium text-[#fafaf9] mb-3">{faq.q}</h3>
                <p className="text-sm text-[#fafaf9]/70 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Reference Card */}
        <section className="mt-16 p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08]">
          <h3 className="text-lg font-semibold mb-4">Quick Reference: Optimal Settings</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[#fafaf9]/50 mb-1">ElevenLabs Stability</p>
              <p className="font-mono text-emerald-400">0.50 - 0.65</p>
            </div>
            <div>
              <p className="text-[#fafaf9]/50 mb-1">ElevenLabs Similarity</p>
              <p className="font-mono text-emerald-400">0.75 - 0.80</p>
            </div>
            <div>
              <p className="text-[#fafaf9]/50 mb-1">Target Latency</p>
              <p className="font-mono text-emerald-400">&lt; 500ms</p>
            </div>
            <div>
              <p className="text-[#fafaf9]/50 mb-1">Max Response Tokens</p>
              <p className="font-mono text-emerald-400">150 - 200</p>
            </div>
            <div>
              <p className="text-[#fafaf9]/50 mb-1">LLM Temperature</p>
              <p className="font-mono text-emerald-400">0.3 - 0.5</p>
            </div>
            <div>
              <p className="text-[#fafaf9]/50 mb-1">Speech Speed</p>
              <p className="font-mono text-emerald-400">0.95 - 1.05x</p>
            </div>
            <div>
              <p className="text-[#fafaf9]/50 mb-1">Response Length</p>
              <p className="font-mono text-emerald-400">1-3 sentences</p>
            </div>
            <div>
              <p className="text-[#fafaf9]/50 mb-1">Style Exaggeration</p>
              <p className="font-mono text-emerald-400">0.0</p>
            </div>
          </div>
        </section>
      </article>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center text-sm text-[#fafaf9]/40">
          <p>© 2026 VoiceAI Connect. All rights reserved.</p>
          <p className="mt-2">
            Based on official documentation from{' '}
            <a href="https://docs.vapi.ai/prompting-guide" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">VAPI</a>
            {' '}and{' '}
            <a href="https://elevenlabs.io/docs/speech-synthesis/voice-settings" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">ElevenLabs</a>
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}