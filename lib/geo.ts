// lib/geo.ts
// Country detection using Vercel's built-in geo headers + cookie persistence
// Works automatically on Vercel deployments (no API key needed)

import { countries } from './currency';

const GEO_COOKIE_NAME = 'vc_country';
const GEO_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Detect country from Vercel headers (server-side)
 * Use in API routes or server components
 */
export function detectCountryFromHeaders(headers: Headers): string {
  // Vercel automatically adds this header
  const country = headers.get('x-vercel-ip-country');
  
  if (country && countries.find(c => c.code === country)) {
    return country;
  }
  
  return 'US'; // Default fallback
}

/**
 * Get country from cookie (client-side)
 */
export function getCountryFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp(`${GEO_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * Set country cookie (client-side)
 */
export function setCountryCookie(countryCode: string): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${GEO_COOKIE_NAME}=${countryCode}; path=/; max-age=${GEO_COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * Get the user's detected country (client-side)
 * Priority: 1. Cookie (user override) → 2. Auto-detect → 3. Default US
 */
export function getDetectedCountry(): string {
  // Check cookie first (user may have manually selected)
  const cookieCountry = getCountryFromCookie();
  if (cookieCountry) return cookieCountry;
  
  // On client-side, we can't read Vercel headers
  // The country should be set via the middleware or initial page load
  return 'US';
}