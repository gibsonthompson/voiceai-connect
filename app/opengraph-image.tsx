// app/opengraph-image.tsx
// Open Graph image for social sharing on the PLATFORM host only.
// (On agency hosts, /signup and /auth re-base metadata to the agency host and
// middleware rewrites /opengraph-image to /api/agency-og, so this VoiceAI card
// never appears on an agency's domain. See app/api/agency-og/route.tsx and the
// OG_PATHS block in middleware.ts.)
//
// Redesigned 2026-08-17: uses the real VoiceAI app icon (public/icon-512x512.png)
// composited in, the Sora display face to match the marketing site, a single
// restrained emerald wash instead of the old muddy dual glows, and the correct
// myvoiceaiconnect.com domain (previously showed the wrong voiceaiconnect.com).

import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const alt = 'VoiceAI Connect - White-Label AI Receptionist Platform for Agencies';

export const size = { width: 1200, height: 630 };

export const contentType = 'image/png';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';

// Load a Google font as raw bytes for Satori. The css2 endpoint returns a TTF
// src when requested with a desktop UA, which is exactly what ImageResponse
// needs (it cannot consume woff2).
async function loadSora(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      `https://fonts.googleapis.com/css2?family=Sora:wght@${weight}&text=${encodeURIComponent(text)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    );
    const css = await cssRes.text();
    const url = css.match(/src:\s*url\((.+?)\)\s*format/)?.[1];
    if (!url) return null;
    const fontRes = await fetch(url);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

// Fetch the real app icon from the platform origin and return it as a data URI
// so Satori can render it via <img>. Falls back to null (the mark is simply
// omitted) if the asset cannot be fetched, so the card never fails to render.
async function loadIconDataUri(): Promise<string | null> {
  try {
    const res = await fetch(`https://${PLATFORM_DOMAIN}/icon-512x512.png`, {
      // Long cache: this asset is static and versioned by deploy.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const headline = 'Launch Your AI Voice Agency';
  const wordmark = 'VoiceAI Connect';
  const subtitle = 'White-label AI receptionists under your brand, your pricing, your revenue';
  const domainLabel = PLATFORM_DOMAIN;

  const glyphs = `${headline}${wordmark}${subtitle}${domainLabel}`;

  const [sora700, sora600, iconUri] = await Promise.all([
    loadSora(700, headline + wordmark),
    loadSora(600, subtitle + domainLabel + glyphs),
    loadIconDataUri(),
  ]);

  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: 'normal' }[] = [];
  if (sora700) fonts.push({ name: 'Sora', data: sora700, weight: 700, style: 'normal' });
  if (sora600) fonts.push({ name: 'Sora', data: sora600, weight: 600, style: 'normal' });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050505',
          position: 'relative',
          fontFamily: 'Sora',
        }}
      >
        {/* Single restrained emerald wash from the top */}
        <div
          style={{
            position: 'absolute',
            top: '-260px',
            left: '150px',
            width: '900px',
            height: '560px',
            background:
              'radial-gradient(ellipse at center, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.05) 45%, transparent 72%)',
          }}
        />
        {/* Hairline emerald accent along the very top edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.5) 50%, transparent 100%)',
          }}
        />

        {/* Logo row: real icon + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', marginBottom: '44px' }}>
          {iconUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconUri}
              width={96}
              height={96}
              style={{ borderRadius: '22px', boxShadow: '0 8px 40px rgba(16,185,129,0.15)' }}
              alt=""
            />
          ) : null}
          <span
            style={{
              fontSize: '46px',
              fontWeight: 600,
              color: '#fafaf9',
              letterSpacing: '-0.02em',
            }}
          >
            {wordmark}
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '60px',
            fontWeight: 700,
            color: '#fafaf9',
            textAlign: 'center',
            lineHeight: 1.12,
            maxWidth: '980px',
            letterSpacing: '-0.03em',
            marginBottom: '26px',
            display: 'flex',
          }}
        >
          {headline}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '27px',
            fontWeight: 600,
            color: 'rgba(250,250,249,0.55)',
            textAlign: 'center',
            maxWidth: '840px',
            lineHeight: 1.4,
            display: 'flex',
          }}
        >
          {subtitle}
        </div>

        {/* Domain pill */}
        <div
          style={{
            position: 'absolute',
            bottom: '44px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            padding: '9px 18px',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px rgba(16,185,129,0.8)',
            }}
          />
          <span style={{ fontSize: '19px', fontWeight: 600, color: 'rgba(250,250,249,0.65)' }}>
            {domainLabel}
          </span>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}