// app/api/voice-preview/route.ts
// ----------------------------------------------------------------------------
// Voice preview TTS, served from Vercel (NOT the DigitalOcean backend).
// DigitalOcean App Platform cannot make IPv6 outbound connections, and
// ElevenLabs (behind Cloudflare) is reached over IPv6, so the call hangs there
// until the 60s gateway timeout. Vercel has no such limit, so we proxy the
// ElevenLabs call here and return the audio to the browser.
//
// Requires ELEVENLABS_API_KEY in this Vercel project's Environment Variables.
// Optional: ELEVENLABS_TTS_MODEL (defaults to eleven_flash_v2_5).
// ----------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTS_MODEL_ID = process.env.ELEVENLABS_TTS_MODEL || 'eleven_flash_v2_5';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return Response.json({ success: false, error: 'Voice preview not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const voice_id = body?.voice_id;
    const text = body?.text;

    if (!voice_id || typeof voice_id !== 'string') {
      return Response.json({ success: false, error: 'voice_id required' }, { status: 400 });
    }
    const clean = String(text || '').trim().slice(0, 500);
    if (clean.length < 2) {
      return Response.json({ success: false, error: 'text required' }, { status: 400 });
    }

    // Hard timeout so a bad upstream can never hang the request.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    let ttsRes: globalThis.Response;
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
      console.error(`ElevenLabs TTS failed (HTTP ${ttsRes.status}): ${detail.slice(0, 200)}`);
      return Response.json({ success: false, error: 'Voice synthesis failed' }, { status: 502 });
    }

    const audio = await ttsRes.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.error('Voice preview timed out reaching ElevenLabs (8s)');
      return Response.json({ success: false, error: 'Voice synthesis timed out' }, { status: 504 });
    }
    console.error('Voice preview error:', err?.message);
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}