// app/opengraph-image.tsx
// Open Graph image for social media sharing (Twitter, Facebook, LinkedIn)
// Generates a 1200x630 image

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'VoiceAI Connect - White-Label AI Receptionist Platform';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function OpenGraphImage() {
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
          background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #050505 100%)',
          position: 'relative',
        }}
      >
        {/* Ambient glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '200px',
            width: '500px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            right: '150px',
            width: '400px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo and icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="9" width="2" height="6" rx="1" fill="#fafaf9" opacity="0.6" />
              <rect x="5" y="7" width="2" height="10" rx="1" fill="#fafaf9" opacity="0.8" />
              <rect x="8" y="4" width="2" height="16" rx="1" fill="#fafaf9" />
              <rect x="11" y="6" width="2" height="12" rx="1" fill="#fafaf9" />
              <rect x="14" y="3" width="2" height="18" rx="1" fill="#fafaf9" />
              <rect x="17" y="7" width="2" height="10" rx="1" fill="#fafaf9" opacity="0.8" />
              <rect x="20" y="9" width="2" height="6" rx="1" fill="#fafaf9" opacity="0.6" />
            </svg>
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 600,
              color: '#fafaf9',
              letterSpacing: '-0.02em',
            }}
          >
            VoiceAI Connect
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: '#fafaf9',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '900px',
            marginBottom: '30px',
          }}
        >
          Launch Your AI Voice Agency
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: 'rgba(250, 250, 249, 0.6)',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          White-label platform to resell AI receptionists under your brand
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#10b981',
            }}
          />
          <span
            style={{
              fontSize: '20px',
              color: 'rgba(250, 250, 249, 0.5)',
            }}
          >
            voiceaiconnect.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
