'use client';

import { useEffect } from 'react';

interface DynamicFaviconProps {
  logoUrl?: string | null;
  primaryColor?: string;
}

/**
 * Dynamically updates the page favicon based on agency branding.
 * 
 * IMPORTANT: Modifies existing <link> tags instead of removing/recreating them.
 * Next.js App Router's metadata system manages favicon <link> tags from the root
 * layout's static metadata export. If we remove those DOM nodes, Next.js
 * re-inserts them during hydration reconciliation. By modifying the href
 * attribute instead, the DOM nodes stay in place and Next.js doesn't interfere.
 */
export default function DynamicFavicon({ logoUrl, primaryColor }: DynamicFaviconProps) {
  useEffect(() => {
    if (!logoUrl && !primaryColor) return;

    let href: string;

    if (logoUrl) {
      href = logoUrl;
    } else if (primaryColor) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${primaryColor}"/><path d="M16 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 12.5l-4-2.5v-6h1.5v5.2l3.5 2.1-.5 1.2z" fill="white"/></svg>`;
      href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    } else {
      return;
    }

    // Modify existing icon links instead of removing them
    const iconLinks = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
    if (iconLinks.length > 0) {
      iconLinks.forEach(link => {
        link.setAttribute('href', href);
        link.setAttribute('type', logoUrl ? 'image/png' : 'image/svg+xml');
      });
    } else {
      // No existing icon links — create one
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = logoUrl ? 'image/png' : 'image/svg+xml';
      link.href = href;
      document.head.appendChild(link);
    }

    // Handle apple-touch-icon
    const appleLinks = document.querySelectorAll("link[rel='apple-touch-icon']");
    if (logoUrl) {
      if (appleLinks.length > 0) {
        appleLinks.forEach(link => link.setAttribute('href', logoUrl));
      } else {
        const appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        appleLink.href = logoUrl;
        document.head.appendChild(appleLink);
      }
    }
  }, [logoUrl, primaryColor]);

  return null;
}