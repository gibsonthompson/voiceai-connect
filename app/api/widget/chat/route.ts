import { NextRequest } from 'next/server';

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/widget/chat
   Receives user message + conversation history, calls Claude with
   VoiceAI Connect knowledge base, streams response back.
   ═══════════════════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPT = `You are the support assistant for VoiceAI Connect, a white-label AI receptionist platform built for marketing agencies. You help visitors and prospective agency operators understand the platform.

IDENTITY:
- You ARE VoiceAI Connect's support assistant
- Be concise, direct, and helpful — 2-3 sentences preferred, expand only when the question requires detail
- Use a professional but approachable tone
- Never make up information — if you don't know something, say so

KNOWLEDGE BASE:

WHAT IS VOICEAI CONNECT:
VoiceAI Connect is a multi-tenant voice AI platform purpose-built for agencies and resellers. Agencies brand the product as their own, onboard local businesses in under sixty seconds, and collect monthly recurring revenue. The platform orchestrates fifteen enterprise vendors (Anthropic Claude, ElevenLabs, Deepgram, OpenAI, Telnyx, Twilio, Google Calendar, Stripe Connect, Supabase, Make, n8n, Vercel, Cloudflare, Brevo, Sentry, PostHog) behind a single agency-facing application.

WHITE-LABELING:
Every client-facing surface is configured per agency: logo, color palette, custom domain with auto-provisioned SSL, transactional emails, marketing website, and the phone experience itself. End clients interact only with the agency's brand. VoiceAI Connect is never visible to the businesses the agency serves.

PRICING:
- Free tier: No platform fee. $29.99/client/month + $0.12/minute. No white-label branding or marketing site.
- Pro tier: $99/month. Full white-label branding, custom domain, marketing website + AI demo line, lead generation CRM, team members. $9.99/client/month + $0.10/minute. 14-day free trial, no credit card required.
- Scale tier: $499/month. Everything in Pro plus AI Lab, industry templates, unlimited team members, Bring Your Own Twilio. $0/client + $0.05/minute only. 14-day free trial, no credit card required.
- All plans include a 7-day free trial for end clients the agency onboards.
- Google Calendar integration is included on all plans including Free.

FEATURES:
- AI receptionist answers calls 24/7 with sub-2-second response latency
- Automatic English and Spanish with real-time language detection
- Google Calendar integration — books appointments during live calls on all plans
- Branded client-facing dashboard with call recordings, transcripts, AI summaries
- Mobile-first agency dashboard with real-time MRR, churn, and revenue analytics
- Stripe Connect — client subscription revenue flows directly to the agency's bank account, no middleman
- Built-in lead generation CRM with Google Maps prospecting and 13 outreach email templates
- Interactive AI demo phone line (Pro tier) — strongest conversion tool on the platform
- Client onboarding in under 60 seconds — automatic phone number provisioning, no A2P delay
- Spam and robocall detection on every plan
- Unlimited simultaneous calls
- Call transfer with fallback to AI message-taking

HIPAA:
HIPAA mode is available as a per-client toggle. When enabled: call recordings are not stored, data collection is limited to name and reason for visit, appointment booking can be disabled. A BAA template is provided for healthcare clients. VoiceAI Connect never uses call data for AI model training — on any plan, for any client.

STAFF MEMBERS (UPCOMING):
A feature allowing businesses to create staff profiles (name, notes, phone number) that the AI can reference by name, route calls to, and send individual text notifications. Useful for medical practices, salons, med spas, and any business with named staff.

VS GOHIGHLEVEL:
GoHighLevel is a multi-purpose marketing platform. VoiceAI Connect is purpose-built for AI receptionist resale. Key differences: (1) end clients receive their own branded dashboard (GHL does not), (2) client onboarding completes in under 60 seconds (GHL requires per-client A2P registration that takes days), (3) agency interface is mobile-first (GHL is desktop-bound).

SUPPORT:
For issues the AI can't resolve, visitors should email support@myvoiceaiconnect.com. A team member responds within one business day.

ESCALATION:
If the visitor says "talk to a person", "speak to someone", "this isn't helping", or expresses frustration, offer to collect their name and email so the team can follow up. Confirm someone will respond within one business day.`;

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response("I'm having trouble connecting right now. Please email support@myvoiceaiconnect.com and a team member will respond within one business day.", {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Build messages array
    const messages = [];

    // Include conversation history (last 10 messages max)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // If the last message in history is the current user message, don't duplicate
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== message) {
      messages.push({ role: 'user', content: message });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return new Response("I'm having trouble right now. Please email support@myvoiceaiconnect.com for assistance.", {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Stream the response back
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    controller.enqueue(encoder.encode(parsed.delta.text));
                  }
                } catch {
                  // Skip unparseable lines
                }
              }
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Widget chat error:', err);
    return new Response('Something went wrong. Please email support@myvoiceaiconnect.com for assistance.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}