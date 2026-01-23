// app/icon.tsx
// Dynamic favicon generation for Next.js App Router
// This generates the favicon at build/request time

import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050505',
          borderRadius: '8px',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="2" y="9" width="2" height="6" rx="1" fill="#10b981" opacity="0.6" />
          <rect x="5" y="7" width="2" height="10" rx="1" fill="#10b981" opacity="0.8" />
          <rect x="8" y="4" width="2" height="16" rx="1" fill="#10b981" />
          <rect x="11" y="6" width="2" height="12" rx="1" fill="#10b981" />
          <rect x="14" y="3" width="2" height="18" rx="1" fill="#10b981" />
          <rect x="17" y="7" width="2" height="10" rx="1" fill="#10b981" opacity="0.8" />
          <rect x="20" y="9" width="2" height="6" rx="1" fill="#10b981" opacity="0.6" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
