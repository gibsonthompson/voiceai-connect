// app/agency-site/layout.tsx
// This layout wraps all agency marketing site pages
// Individual pages handle their own theme - this just provides metadata defaults

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
        Override the dark body background from globals.css for agency sites.
        Default to white - individual pages will set their own background.
        This prevents the black flash during initial load.
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body {
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
            /* Dark theme pages set their own bg via inline styles */
          `,
        }}
      />
      {children}
    </>
  );
}