// app/agency-site/layout.tsx
// This layout wraps all agency marketing site pages and overrides dark body styles

import type { Metadata } from 'next';

export const metadata: Metadata = {
  // Default metadata - will be overridden by page.tsx dynamically
  title: 'AI Receptionist',
};

export default function AgencySiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 
        Override the dark body background from globals.css
        This style tag is server-rendered so it applies before hydration
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body {
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
            /* Re-apply dark bg for dark theme marketing pages */
            html:has(.marketing-page.theme-dark),
            html:has(.marketing-page.theme-dark) body {
              background: #0f0f0f !important;
              background-color: #0f0f0f !important;
            }
          `,
        }}
      />
      {children}
    </>
  );
}