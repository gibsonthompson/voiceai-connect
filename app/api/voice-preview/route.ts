// app/api/voice-preview/route.ts
// ----------------------------------------------------------------------------
// Voice preview TTS, served from Vercel (NOT the DigitalOcean backend).
// DigitalOcean App Platform cannot make IPv6 outbound connections and
// ElevenLabs (behind Cloudflare) is reached over IPv6, so the call hangs there.
// Vercel has no such limit, so we proxy the ElevenLabs call here.
//
// Requires ELEVENLABS_API_KEY in this Vercel project's Environment Variables
// (Production), and a REDEPLOY after adding it. Optional ELEVENLABS_TTS_MODEL
// (defaults to eleven_flash_v2_5).
//
// UPDATED: 2026-09-17 - SECURITY: added the same per-IP rate limit the widget
//   chat route uses (@/lib/rate-limit). This endpoint was unauthenticated with
//   no request cap, so anyone could hammer it and run up the ElevenLabs bill on
//   our API key (the 500-char text cap does not bound how many requests you can
//   send, and varying the text/voice bypasses the response cache). The rate
//   limit is server-side and per-IP, so a real user previewing a handful of
//   voices is unaffected while automated abuse is throttled. This is the same
//   pattern app/api/widget/chat already uses.
// ----------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTS_MODEL_ID = process.env.ELEVENLABS_TTS_MODEL || 'eleven_flash_v2_5';

export async function POST(req: Request) {
  try {
    // Per-IP rate limit (same limiter as the widget chat route). Blocks
    // unauthenticated abuse of our ElevenLabs key without affecting normal
    // dashboard voice previews.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const apiKey = (process.env.ELEVENLABS_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'ELEVENLABS_API_KEY missing in this environment' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({} as any));
    const voice_id = body?.voice_id;
    const text = body?.text;

    if (!voice_id || typeof voice_id !== 'string') {
      return NextResponse.json({ success: false, error: 'voice_id required' }, { status: 400 });
    }
    const clean = String(text || '').trim().slice(0, 500);
    if (clean.length < 2) {
      return NextResponse.json({ success: false, error: 'text required' }, { status: 400 });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    let ttsRes: Response;
    try {
      ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice_id)}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: clean,
            model_id: TTS_MODEL_ID,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );
    } finally {
      clearTimeout(timer);
    }

    if (!ttsRes.ok) {
      const detail = await ttsRes.text().catch(() => '');
      console.error(`ElevenLabs TTS failed (HTTP ${ttsRes.status}): ${detail.slice(0, 300)}`);
      // Surface the REAL upstream reason so it's visible in the Network tab
      // instead of an opaque 502.
      return NextResponse.json(
        { success: false, error: 'Voice synthesis failed', upstream_status: ttsRes.status, upstream_detail: detail.slice(0, 300) },
        { status: 502 }
      );
    }

    const audio = await ttsRes.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json({ success: false, error: 'Voice synthesis timed out' }, { status: 504 });
    }
    console.error('Voice preview error:', err?.message);
    return NextResponse.json({ success: false, error: 'Server error', detail: String(err?.message || err) }, { status: 500 });
  }
}