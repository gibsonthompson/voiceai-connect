'use client';

import { useEffect } from 'react';

interface DynamicFaviconProps {
  logoUrl?: string | null;
  primaryColor?: string;
}

/**
 * Dynamically updates the page favicon based on agency branding.
 * Uses the agency's logo as favicon, falls back to a colored icon if no logo.
 */
export default function DynamicFavicon({ logoUrl, primaryColor }: DynamicFaviconProps) {
  useEffect(() => {
    if (!logoUrl && !primaryColor) return;

    // Remove existing favicons
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach(link => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    
    if (logoUrl) {
      // Use agency's logo as favicon
      link.href = logoUrl;
    } else if (primaryColor) {
      // Generate a simple colored favicon using SVG
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="6" fill="${primaryColor}"/>
          <path d="M16 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 12.5l-4-2.5v-6h1.5v5.2l3.5 2.1-.5 1.2z" fill="white"/>
        </svg>
      `;
      const encoded = encodeURIComponent(svg);
      link.href = `data:image/svg+xml,${encoded}`;
    }
    
    document.head.appendChild(link);

    // Also update apple-touch-icon if we have a logo
    if (logoUrl) {
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = logoUrl;
      document.head.appendChild(appleLink);
    }
  }, [logoUrl, primaryColor]);

  return null;
}