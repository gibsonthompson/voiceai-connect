// ============================================================================
// lib/brandFonts.ts
//
// The curated Google Fonts catalog that the AI brand system picks from, plus the
// helpers that load those fonts at runtime and map an "icon style" to a stroke
// weight for the nav icons.
//
// Why a curated catalog (not "any font"): the vision model is constrained to
// choose a display + body font FROM THIS LIST, so we only ever get fonts we can
// actually load from Google Fonts, pairings stay tasteful, and the override
// dropdowns in the branding UI have a sane, finite set. Keep this file and the
// backend copy (src/lib/brand-fonts.js) in sync.
//
// Each entry:
//   family    - exact Google Fonts family name (what we load + render)
//   category  - the letterform family, used to match the logo's own type
//   vibes     - adjectives the vibe match keys off
//   role      - where it shines: 'display' (headlines/nav), 'body', or 'both'
//   pairs     - good body-font partners (families) for a display font
//   weights   - weights we request from Google (keep small for load speed)
// ============================================================================

export type FontCategory =
  | 'geometric-sans' | 'grotesque-sans' | 'humanist-sans' | 'rounded-sans'
  | 'serif' | 'slab-serif' | 'display' | 'condensed' | 'mono';

export type FontRole = 'display' | 'body' | 'both';

export interface BrandFont {
  family: string;
  category: FontCategory;
  vibes: string[];
  role: FontRole;
  pairs?: string[];
  weights: number[];
}

// The catalog. ~40 fonts spanning the full range of brand personalities.
export const BRAND_FONTS: BrandFont[] = [
  // ---- Geometric sans (modern, clean, friendly-tech) ----
  { family: 'Sora', category: 'geometric-sans', vibes: ['modern', 'techy', 'clean', 'confident'], role: 'display', pairs: ['Inter', 'DM Sans'], weights: [400, 600, 700, 800] },
  { family: 'Poppins', category: 'geometric-sans', vibes: ['friendly', 'modern', 'approachable', 'rounded'], role: 'both', pairs: ['Inter', 'Work Sans'], weights: [400, 500, 600, 700] },
  { family: 'Montserrat', category: 'geometric-sans', vibes: ['clean', 'professional', 'versatile'], role: 'display', pairs: ['Inter', 'Mulish'], weights: [400, 600, 700, 800] },
  { family: 'Outfit', category: 'geometric-sans', vibes: ['modern', 'minimal', 'sleek'], role: 'both', pairs: ['Inter'], weights: [400, 500, 600, 700] },
  { family: 'Urbanist', category: 'geometric-sans', vibes: ['modern', 'minimal', 'clean'], role: 'both', pairs: ['Inter'], weights: [400, 500, 600, 700] },
  { family: 'Lexend', category: 'geometric-sans', vibes: ['clean', 'approachable', 'readable'], role: 'both', pairs: ['Inter'], weights: [400, 500, 600, 700] },
  { family: 'Raleway', category: 'geometric-sans', vibes: ['elegant', 'light', 'sophisticated'], role: 'display', pairs: ['Inter', 'Lora'], weights: [400, 600, 700] },

  // ---- Grotesque / neo-grotesque sans (neutral, sharp, professional) ----
  { family: 'Inter', category: 'grotesque-sans', vibes: ['neutral', 'clean', 'professional', 'default'], role: 'both', pairs: ['Inter'], weights: [400, 500, 600, 700] },
  { family: 'Space Grotesk', category: 'grotesque-sans', vibes: ['techy', 'modern', 'distinctive'], role: 'display', pairs: ['Inter', 'DM Sans'], weights: [400, 500, 600, 700] },
  { family: 'Manrope', category: 'grotesque-sans', vibes: ['modern', 'clean', 'balanced'], role: 'both', pairs: ['Manrope', 'Inter'], weights: [400, 500, 600, 700] },
  { family: 'DM Sans', category: 'grotesque-sans', vibes: ['clean', 'geometric', 'friendly'], role: 'both', pairs: ['DM Sans', 'Inter'], weights: [400, 500, 700] },
  { family: 'Archivo', category: 'grotesque-sans', vibes: ['bold', 'industrial', 'strong'], role: 'display', pairs: ['Inter'], weights: [400, 600, 700, 800] },
  { family: 'Hanken Grotesk', category: 'grotesque-sans', vibes: ['modern', 'clean', 'warm'], role: 'both', pairs: ['Hanken Grotesk', 'Inter'], weights: [400, 500, 600, 700] },
  { family: 'Bricolage Grotesque', category: 'grotesque-sans', vibes: ['distinctive', 'editorial', 'modern'], role: 'display', pairs: ['Inter'], weights: [400, 600, 700, 800] },

  // ---- Humanist sans (warm, human, readable) ----
  { family: 'Work Sans', category: 'humanist-sans', vibes: ['warm', 'approachable', 'clean'], role: 'both', pairs: ['Work Sans', 'Inter'], weights: [400, 500, 600, 700] },
  { family: 'Source Sans 3', category: 'humanist-sans', vibes: ['neutral', 'readable', 'professional'], role: 'body', pairs: ['Source Sans 3'], weights: [400, 600, 700] },
  { family: 'Mulish', category: 'humanist-sans', vibes: ['clean', 'minimal', 'light'], role: 'body', pairs: ['Mulish'], weights: [400, 500, 700] },
  { family: 'Figtree', category: 'humanist-sans', vibes: ['friendly', 'modern', 'warm'], role: 'both', pairs: ['Figtree', 'Inter'], weights: [400, 500, 600, 700] },
  { family: 'Nunito Sans', category: 'humanist-sans', vibes: ['friendly', 'soft', 'approachable'], role: 'body', pairs: ['Nunito Sans'], weights: [400, 600, 700] },
  { family: 'Karla', category: 'humanist-sans', vibes: ['clean', 'quirky', 'readable'], role: 'body', pairs: ['Karla'], weights: [400, 500, 700] },
  { family: 'IBM Plex Sans', category: 'humanist-sans', vibes: ['techy', 'corporate', 'precise'], role: 'both', pairs: ['IBM Plex Sans'], weights: [400, 500, 600, 700] },

  // ---- Rounded sans (playful, friendly, soft) ----
  { family: 'Quicksand', category: 'rounded-sans', vibes: ['playful', 'soft', 'friendly', 'light'], role: 'display', pairs: ['Nunito Sans', 'Inter'], weights: [400, 500, 600, 700] },
  { family: 'Baloo 2', category: 'rounded-sans', vibes: ['playful', 'bold', 'friendly'], role: 'display', pairs: ['Mulish', 'Inter'], weights: [400, 500, 600, 700] },
  { family: 'Fredoka', category: 'rounded-sans', vibes: ['playful', 'fun', 'bold', 'friendly'], role: 'display', pairs: ['Nunito Sans', 'Inter'], weights: [400, 500, 600, 700] },
  { family: 'Comfortaa', category: 'rounded-sans', vibes: ['soft', 'minimal', 'playful'], role: 'display', pairs: ['Mulish'], weights: [400, 500, 700] },

  // ---- Serif (editorial, luxury, trustworthy, traditional) ----
  { family: 'Playfair Display', category: 'serif', vibes: ['luxury', 'elegant', 'editorial', 'high-end'], role: 'display', pairs: ['Inter', 'Source Sans 3', 'Mulish'], weights: [400, 600, 700, 800] },
  { family: 'Fraunces', category: 'serif', vibes: ['editorial', 'characterful', 'warm', 'premium'], role: 'display', pairs: ['Inter', 'Hanken Grotesk'], weights: [400, 600, 700] },
  { family: 'Cormorant', category: 'serif', vibes: ['luxury', 'refined', 'delicate', 'high-end'], role: 'display', pairs: ['Mulish', 'Inter'], weights: [400, 600, 700] },
  { family: 'Lora', category: 'serif', vibes: ['trustworthy', 'editorial', 'warm', 'readable'], role: 'both', pairs: ['Lora', 'Inter'], weights: [400, 500, 600, 700] },
  { family: 'Libre Baskerville', category: 'serif', vibes: ['traditional', 'trustworthy', 'classic'], role: 'both', pairs: ['Inter'], weights: [400, 700] },
  { family: 'Spectral', category: 'serif', vibes: ['editorial', 'refined', 'readable'], role: 'both', pairs: ['Spectral', 'Inter'], weights: [400, 500, 600] },

  // ---- Slab serif (sturdy, confident, approachable-strong) ----
  { family: 'Roboto Slab', category: 'slab-serif', vibes: ['sturdy', 'confident', 'modern'], role: 'both', pairs: ['Roboto Slab', 'Inter'], weights: [400, 500, 700] },
  { family: 'Zilla Slab', category: 'slab-serif', vibes: ['techy', 'sturdy', 'distinctive'], role: 'display', pairs: ['Inter'], weights: [400, 500, 600, 700] },

  // ---- Display / statement (bold, memorable, headline-only) ----
  { family: 'Syne', category: 'display', vibes: ['bold', 'artsy', 'futuristic', 'distinctive'], role: 'display', pairs: ['Inter', 'DM Sans'], weights: [400, 600, 700, 800] },
  { family: 'Unbounded', category: 'display', vibes: ['bold', 'futuristic', 'loud', 'modern'], role: 'display', pairs: ['DM Sans', 'Inter'], weights: [400, 600, 700] },
  { family: 'Clash Display', category: 'display', vibes: ['bold', 'modern', 'premium'], role: 'display', pairs: ['Inter'], weights: [400, 600, 700] },

  // ---- Condensed (impactful, space-efficient, athletic) ----
  { family: 'Bebas Neue', category: 'condensed', vibes: ['bold', 'impactful', 'athletic', 'loud'], role: 'display', pairs: ['Inter', 'Work Sans'], weights: [400] },
  { family: 'Anton', category: 'condensed', vibes: ['heavy', 'impactful', 'bold'], role: 'display', pairs: ['Inter'], weights: [400] },
  { family: 'Archivo Narrow', category: 'condensed', vibes: ['clean', 'efficient', 'modern'], role: 'both', pairs: ['Inter'], weights: [400, 500, 600, 700] },

  // ---- Mono (technical, precise, developer) ----
  { family: 'Space Mono', category: 'mono', vibes: ['techy', 'retro', 'distinctive'], role: 'display', pairs: ['Inter'], weights: [400, 700] },
  { family: 'JetBrains Mono', category: 'mono', vibes: ['techy', 'precise', 'developer'], role: 'body', pairs: ['Inter'], weights: [400, 500, 700] },
];

// Fallback stacks appended after the brand family, so text still renders if the
// webfont is slow or blocked.
export const DISPLAY_FALLBACK = "'Geist', system-ui, -apple-system, sans-serif";
export const BODY_FALLBACK = "'Geist', 'Inter', system-ui, -apple-system, sans-serif";

// Nav icon sets live in components/cc/navIcons.tsx (they pull real icon packages
// via react-icons). This file is fonts-only.

export function findFont(family?: string | null): BrandFont | undefined {
  if (!family) return undefined;
  const f = family.trim().toLowerCase();
  return BRAND_FONTS.find((x) => x.family.toLowerCase() === f);
}

// Build the font-family CSS value for a display/body slot (family + fallback).
export function fontStack(family: string | null | undefined, slot: 'display' | 'body'): string {
  const fallback = slot === 'display' ? DISPLAY_FALLBACK : BODY_FALLBACK;
  const f = findFont(family);
  return f ? `'${f.family}', ${fallback}` : fallback;
}

// Build a Google Fonts CSS2 href that loads the given families at the weights
// the catalog requests. Unknown families are skipped. Returns '' if nothing to
// load (so the caller can avoid injecting an empty link).
export function googleFontsHref(families: Array<string | null | undefined>): string {
  const seen = new Set<string>();
  const specs: string[] = [];
  for (const fam of families) {
    const f = findFont(fam);
    if (!f || seen.has(f.family)) continue;
    seen.add(f.family);
    const wght = (f.weights && f.weights.length ? f.weights : [400, 600, 700]).join(';');
    specs.push(`family=${encodeURIComponent(f.family).replace(/%20/g, '+')}:wght@${wght}`);
  }
  if (!specs.length) return '';
  return `https://fonts.googleapis.com/css2?${specs.join('&')}&display=swap`;
}

// Load every catalog font at a light weight so the font picker can render each
// option in its own typeface. One request, kept small (one weight per family).
export function allFontsHref(): string {
  const specs = BRAND_FONTS.map((f) => `family=${encodeURIComponent(f.family).replace(/%20/g, '+')}:wght@400;600`);
  return `https://fonts.googleapis.com/css2?${specs.join('&')}&display=swap`;
}

// Options for the override dropdowns, grouped so a user can swap to a same-vibe
// alternative. `role` filters to display- or body-appropriate families.
export function fontOptions(role: 'display' | 'body'): { value: string; label: string }[] {
  return BRAND_FONTS
    .filter((f) => f.role === 'both' || f.role === role)
    .map((f) => ({ value: f.family, label: f.family }));
}
