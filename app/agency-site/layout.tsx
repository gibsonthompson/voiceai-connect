// app/agency-site/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Phone Answering',
  description: 'Professional AI receptionist that answers every call 24/7.',
};

export default function AgencySiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 
        Inline script to prevent white flash on dark-themed agency sites.
        Reads cached theme from sessionStorage BEFORE React hydrates.
        This runs synchronously before paint.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var t = sessionStorage.getItem('agency_theme');
                if (t === 'dark') {
                  document.documentElement.style.backgroundColor = '#0f0f0f';
                  document.documentElement.style.colorScheme = 'dark';
                }
              } catch(e) {}
            })();
          `,
        }}
      />
      <div style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </>
  );
}