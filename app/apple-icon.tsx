// app/apple-icon.tsx
// Apple Touch Icon for iOS devices
// Generates a 180x180 icon for iPhone/iPad home screen

import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 100%)',
          borderRadius: '40px',
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <rect x="2" y="9" width="2" height="6" rx="1" fill="#34d399" opacity="0.6" />
          <rect x="5" y="7" width="2" height="10" rx="1" fill="#34d399" opacity="0.8" />
          <rect x="8" y="4" width="2" height="16" rx="1" fill="#10b981" />
          <rect x="11" y="6" width="2" height="12" rx="1" fill="#10b981" />
          <rect x="14" y="3" width="2" height="18" rx="1" fill="#10b981" />
          <rect x="17" y="7" width="2" height="10" rx="1" fill="#34d399" opacity="0.8" />
          <rect x="20" y="9" width="2" height="6" rx="1" fill="#34d399" opacity="0.6" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
