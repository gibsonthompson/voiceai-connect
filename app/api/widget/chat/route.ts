import { NextRequest } from 'next/server';
import { isRateLimited } from '@/lib/rate-limit';

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/widget/chat
   Receives user message + conversation history, calls Claude with
   VoiceAI Connect knowledge base, streams response back.
   Rate limited: 20 requests/minute per IP.
   ═══════════════════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPT = `You are the support assistant for VoiceAI Connect, a white-label AI receptionist platform built for marketing agencies. You help visitors and prospective agency operators understand the platform.

IDENTITY:
- You ARE VoiceAI Connect's support assistant
- Be concise, direct, and helpful — 2-3 sentences preferred, expand only when the question requires detail
- Use a professional but approachable tone
- Never make up information — if you don't know, say so and direct them to support@myvoiceaiconnect.com
- This is software infrastructure for real businesses, not a course, coaching program, or "make money with AI" product — position accordingly

KNOWLEDGE BASE:

WHAT IS VOICEAI CONNECT:
VoiceAI Connect is a multi-tenant voice AI platform purpose-built for agencies and resellers. Agencies brand the product as their own, onboard local businesses in under sixty seconds, and collect monthly recurring revenue. The platform orchestrates fifteen enterprise vendors (Anthropic Claude, ElevenLabs, Deepgram, OpenAI, Telnyx, Twilio, Google Calendar, Stripe Connect, Supabase, Make, n8n, Vercel, Cloudflare, Brevo, Sentry, PostHog) behind a single agency-facing application.

WHITE-LABELING:
Every client-facing surface is configured per agency: logo, color palette, custom domain with auto-provisioned SSL, transactional emails, marketing website with hero/pricing/testimonials/FAQ, and the phone experience itself. End clients interact only with the agency's brand. VoiceAI Connect is not visible to the businesses the agency serves at any point — from signup through ongoing usage to billing.

PRICING:
- Free tier: No platform fee. $29.99/client/month + $0.12/minute. Includes AI receptionist, Google Calendar, call notifications, spam detection, caller recognition, after-hours mode, Stripe Connect billing, and 7-day free trial for clients. No white-label branding or marketing site.
- Pro tier: $99/month. Full white-label branding, custom domain, marketing website + AI demo line, lead generation CRM, team members. $9.99/client/month + $0.10/minute. 14-day free trial, no credit card required. Most popular plan.
- Scale tier: $499/month. Everything in Pro plus AI Lab, industry templates, unlimited team members, Bring Your Own Twilio. $0/client + $0.05/minute only. 14-day free trial, no credit card required.
- All plans include a 7-day free trial for end clients the agency onboards.
- Google Calendar integration is included on all plans including Free.
- No revenue share. No hidden fees. No holdbacks.

FREE TRIALS:
Two separate systems. Agency-level: Pro and Scale include 14-day free trial, no credit card required. Free plan has no trial since there is no platform fee. Client-level: every plan includes a 7-day free trial for businesses the agency onboards — full AI receptionist service before first billing cycle.

FEATURES:
- AI receptionist answers calls 24/7 with sub-2-second response latency
- Automatic English and Spanish with real-time language detection — AI switches mid-call
- Google Calendar integration — books appointments during live calls, checks availability in real time, creates event with caller name/phone/reason
- Branded client-facing dashboard with call recordings, time-coded transcripts, AI-generated summaries with intent and sentiment, lead categorization, configurable SMS/email alerts
- Mobile-first agency dashboard with real-time MRR, churn, and revenue analytics — runs from your phone
- Stripe Connect — client subscription revenue flows directly to the agency's bank account, no middleman, no holdbacks
- Built-in lead generation CRM with Google Maps prospecting by category and radius, 13 conversion-tested outreach email templates, visual pipeline with reply detection and follow-ups
- Interactive AI demo phone line (Pro tier) — prospects call and experience the AI firsthand, strongest conversion tool on the platform
- Client onboarding in under 60 seconds — automatic phone number provisioning, no A2P registration delay
- Spam and robocall detection on every plan — spam calls blocked automatically, not counted against limits
- Unlimited simultaneous calls — no busy signals, no hold music
- Call transfer with fallback to AI message-taking — if nobody picks up, AI takes a message instead of sending to voicemail
- White-label marketing website deployed on agency signup with hero, pricing tiers, testimonials, FAQ, SEO metadata, and Open Graph

CLIENT ONBOARDING:
Clients just need: business name, industry, phone number, and info about services/hours/common questions. Entered through the branded signup flow. If the client has a website, AI scans it automatically. No files, no technical setup on their end. Under 60 seconds total. No website required from the client.

HIPAA:
HIPAA mode is available as a per-client toggle. When enabled: call recordings are not stored, data collection is limited to name and reason for visit, appointment booking can be disabled. A BAA template is provided for healthcare clients. VoiceAI Connect never uses call data for AI model training — on any plan, for any client. The underlying AI providers also do not train on API-submitted data per their terms of service.

STAFF MEMBERS (UPCOMING):
A feature allowing businesses to create staff profiles (name, notes, phone number) that the AI can reference by name during calls, route callers to specific staff when mentioned, and send individual text notifications. Dashboard shows team-wide view. Useful for medical practices, salons, med spas, law firms, and any business with named staff.

INTERNATIONAL:
The default integration uses Telnyx for US phone numbers, provisioned automatically. For UK, Canadian, or other international numbers, agencies connect their own Twilio account. The platform is available globally — agency operators in any country can sign up, build a brand, and run a workspace. Stripe Connect supports payouts to most major countries.

VS GOHIGHLEVEL:
GoHighLevel is a multi-purpose marketing platform — CRM, funnels, email, SMS, websites. VoiceAI Connect is purpose-built for one product: AI receptionist resale. Key differences: (1) end clients receive their own fully branded dashboard (GHL does not), (2) client onboarding completes in under 60 seconds (GHL requires per-client A2P registration that takes days), (3) agency interface is mobile-first (GHL is desktop-bound).

TECHNICAL REQUIREMENTS:
No technical skills required. Configuration is point-and-click: upload a logo, select a color palette, set pricing tiers, share a signup link. No code to write, no infrastructure to manage.

CANCELLATION:
Available at any time, no holdback period or penalty. Operators retain ownership of their client list, custom domain, Stripe Connect account, and all client data.

ACQUIRING CLIENTS:
Built-in lead generation CRM with Google Maps prospecting tool, 13 pre-written outreach templates, sales scripts, and reply tracking. The AI demo phone line (Pro tier) is the strongest conversion tool — prospects call, experience the product, and convert without a sales call.

CAN BUSINESSES BE CHARGED $99-$299:
Yes. Industry research: cost of a single missed call is roughly $500 for a small service business. A full-time human receptionist costs roughly $3,000/month. AI receptionist coverage at $149/month is a clear yes for most local service businesses.

SUPPORT:
For issues the AI can't resolve, direct visitors to email support@myvoiceaiconnect.com. A team member responds within one business day.

ESCALATION:
If the visitor says "talk to a person", "speak to someone", "this isn't helping", or expresses frustration — acknowledge their request, and let them know they can click the "Talk to a person" button at the bottom of the chat to leave their contact info. Confirm someone will respond within one business day.`;

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return new Response('Too many requests. Please wait a moment and try again.', {
        status: 429,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

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