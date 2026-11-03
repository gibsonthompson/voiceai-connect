import { NextRequest } from 'next/server';
import { isRateLimited } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/server';

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/widget/chat
   Receives user message + conversation history, calls Claude with
   knowledge base context, streams response back.
   Rate limited: 20 requests/minute per IP.

   Two modes:
   1. Default (no agencyName) — VoiceAI Connect platform support
   2. Agency (agencyName + agencyFaqs) — agency marketing site support

   Error-fallback rule: on an agency-branded site (agencyName present) the
   failure messages must NEVER print the platform support address. With an
   agency support email we point to it; without one we stay generic. Only the
   platform's own widget (no agencyName) shows the platform address.
   ═══════════════════════════════════════════════════════════════════════════ */

const PLATFORM_SUPPORT_EMAIL = 'support@myvoiceaiconnect.com';

// Build the trailing sentence for a fallback/error message without leaking the
// platform brand on an agency site. Priority: agency support email -> generic
// (agency site, no email) -> platform address (platform widget only).
function fallbackContactLine(agencyName?: string, supportEmail?: string): string {
  if (supportEmail) return `Please email ${supportEmail} for assistance.`;
  if (agencyName) return `Please try again in a moment.`;
  return `Please email ${PLATFORM_SUPPORT_EMAIL} for assistance.`;
}

// Log a public FAQ-bot exchange so prospect conversations show up in the admin
// inbox (widget_chat_log). Service-role client bypasses RLS. Only the PLATFORM
// bot is logged here (agency-branded site chats are that agency's own leads, not
// VoiceAI platform support). Best-effort and defensive: if the origin columns
// are not present yet, fall back to the original 3-column insert so nothing
// breaks. Never throws into the request path.
async function logMarketingChat(sessionId: string, userMessage: string, assistantText: string) {
  try {
    if (!sessionId || !userMessage) return;
    const supa = createAdminClient();
    const t0 = new Date();
    const t1 = new Date(t0.getTime() + 1); // keep user before assistant when sorted by created_at
    const rows: any[] = [
      { session_id: String(sessionId).slice(0, 100), role: 'user', content: String(userMessage).slice(0, 8000), created_at: t0.toISOString() },
    ];
    if (assistantText && assistantText.trim()) {
      rows.push({ session_id: String(sessionId).slice(0, 100), role: 'assistant', content: String(assistantText).slice(0, 8000), created_at: t1.toISOString() });
    }
    const withOrigin = rows.map((r) => ({ ...r, user_type: 'prospect', agency_id: null, source: 'marketing' }));
    const { error } = await supa.from('widget_chat_log').insert(withOrigin);
    if (error) {
      await supa.from('widget_chat_log').insert(rows); // origin columns not migrated yet
    }
  } catch (e: any) {
    console.error('marketing chat log failed (non-blocking):', e?.message);
  }
}

// ============================================================================
// PROSPECT LENS + shared knowledge. Facts come from the single master knowledge
// base served by the backend (same source the dashboard bot uses); this wrapper
// only sets who it is talking to. One brain, two lenses.
// ============================================================================
const PROSPECT_LENS = `You are the support assistant for VoiceAI Connect on the public marketing site.

## WHO YOU ARE TALKING TO
A prospect who does NOT have an account yet and cannot see any dashboard. Explain how the product works and what they get, and frame answers around what happens after they sign up. Never walk them through dashboard navigation they cannot follow. Keep it benefit-oriented and invite them to start a free trial or reach out to the team. This is real software infrastructure, not a course or a make-money-with-AI product.

## IMPORTANT, ANSWER DIRECTLY
When someone asks to hear a demo, try a demo, or what number to call, give them the public demo line (404) 201-7505 right away. Never send a prospect to email support just to get the demo number.

## FORMATTING (critical)
Reply in plain conversational text only. No markdown or symbols of any kind (no asterisks, bullets, list numbers, headers, or hashes), because the chat prints your reply exactly as written. List a few things in a sentence separated by commas. You may include a plain web link or phone number directly in the text.

## RULES
- Be concise and direct, two to three sentences preferred, expand only when the question needs it.
- Never invent information. If you do not know, say so and point to support@myvoiceaiconnect.com.
- Never reveal how the platform is built: no internal architecture, no infrastructure, no third-party tools by name. If asked about the technology, say it runs on proprietary technology and focus on what it does.
- If the visitor is frustrated or asks for a person, tell them to click the "Talk to a person" button at the bottom of the chat to leave their contact info, and someone replies within one business day.

## VIDEOS
Do not volunteer videos or links. Only share a video when the knowledge base lists one whose topic directly answers the question, and then share just that one. If none is listed, do not mention videos, and never invent a link.

Use the knowledge base below as your single source of truth.

KNOWLEDGE BASE:
`;

// Short fallback if the knowledge service is briefly unavailable, so the bot
// still answers the essentials (including the public demo number).
const FALLBACK_KNOWLEDGE = `VoiceAI Connect is a white-label platform for agencies to resell AI phone receptionists to local businesses under their own brand. To hear the AI right now, call the public demo line at (404) 201-7505, or use the build-a-receptionist demo on the homepage. Plans: Free (no platform fee, usage-based), Pro ($99/mo, full white-label, most popular), Scale ($499/mo, lowest per-minute rate). Pro and Scale include a 14-day free trial that needs a card but is not charged until it ends. The trial for the clients an agency onboards is set by that agency and fully customizable (0 to 365 days, 7 by default), so there is no single fixed client trial length. The AI answers 24/7 in English and Spanish, books into Google Calendar, texts a summary after every call, and blocks spam. No revenue share, cancel anytime. For anything else, email support@myvoiceaiconnect.com.`;

// Pull the shared master knowledge base from the backend, cached briefly.
let _kbCache: { text: string; at: number } | null = null;
async function getKnowledge(): Promise<string> {
  if (_kbCache && Date.now() - _kbCache.at < 5 * 60 * 1000) return _kbCache.text;
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${base}/api/public/support-knowledge`, { next: { revalidate: 300 } });
    if (res.ok) {
      const j = await res.json();
      if (j && typeof j.knowledge === 'string' && j.knowledge.length > 0) {
        _kbCache = { text: j.knowledge, at: Date.now() };
        return j.knowledge;
      }
    }
  } catch { /* fall through */ }
  return FALLBACK_KNOWLEDGE;
}

function buildAgencySystemPrompt(agencyName: string, agencyFaqs: string, supportEmail: string): string {
  return `You are the support assistant for ${agencyName}, an AI receptionist service provider. You help visitors and prospective customers understand the AI receptionist service.

IDENTITY:
- You represent ${agencyName} — never mention any other platform or provider name
- Be concise, direct, and helpful — 2-3 sentences preferred, expand only when the question requires detail
- Use a professional but approachable tone
- Never make up information — if you don't know, say so and suggest they contact the team${supportEmail ? ` at ${supportEmail}` : ''}

FORMATTING (critical):
Reply in plain conversational text only. No markdown or formatting symbols of any kind — no asterisks, bold, italics, bullet points, numbered lists, headers, or hashes. The chat widget prints your reply exactly as written, so any symbol shows up as a literal character.

WHAT ${agencyName.toUpperCase()} OFFERS:
${agencyName} provides an AI-powered phone receptionist that answers your business calls 24/7. The AI greets callers professionally, answers questions about your business, books appointments to your Google Calendar in real time, takes messages, and sends you instant text summaries after every call. It handles unlimited simultaneous calls with no busy signals and detects spam automatically.

KEY FEATURES:
- 24/7 AI receptionist that answers in under 2 seconds
- Automatic English and Spanish — detects and switches mid-call
- Google Calendar integration — books appointments during live calls
- Full call recordings with transcripts and AI-generated summaries
- Instant SMS notifications after every call
- Spam and robocall detection — blocked automatically
- Unlimited simultaneous calls — no busy signals ever
- Call transfer to your phone when needed, with AI fallback
- Your own branded dashboard to view calls, contacts, and settings
- Works from any device — phone, tablet, or desktop

SETUP:
Getting started takes under 10 minutes. Provide your business name, industry, phone number, and basic info about your services and hours. A dedicated AI phone number is provisioned automatically. No technical skills or website required.

${agencyFaqs ? `FREQUENTLY ASKED QUESTIONS:\n${agencyFaqs}\n` : ''}
ESCALATION:
If the visitor says "talk to a person", "speak to someone", "this isn't helping", or expresses frustration — acknowledge their request and let them know they can click the "Talk to a person" button to leave their contact info. Someone will respond within one business day.`;
}

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

    const { message, conversationHistory, agencyName, agencyFaqs, supportEmail, sessionId } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fallback contact line, computed once. Never leaks the platform address on
    // an agency-branded site (see fallbackContactLine).
    const contactLine = fallbackContactLine(agencyName, supportEmail);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(`I'm having trouble connecting right now. ${contactLine}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Select system prompt based on whether agency context is provided
    const systemPrompt = agencyName
      ? buildAgencySystemPrompt(agencyName, agencyFaqs || '', supportEmail || '')
      : PROSPECT_LENS + (await getKnowledge());

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
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return new Response(`I'm having trouble right now. ${contactLine}`, {
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
        let assistantText = ''; // full reply, accumulated for logging

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
                    assistantText += parsed.delta.text;
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
          // Log the exchange to the admin inbox. Only the platform bot (no
          // agencyName); agency-branded chats are that agency's own leads.
          if (!agencyName) {
            await logMarketingChat(sessionId, message, assistantText);
          }
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
    return new Response('Something went wrong. Please try again or contact support.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}