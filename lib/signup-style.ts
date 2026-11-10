// ============================================================================
// Signup-form style model (shared source of truth)
// VoiceAI Connect
// ----------------------------------------------------------------------------
// The agency styles their embeddable signup form from the Embed tab. Text
// (headline/subtitle) lives on dedicated columns; everything VISUAL lives in
// this style object, stored under agency.marketing_config.signup (JSONB, no
// migration needed).
//
// Two surfaces consume this one model so the dashboard preview and the live
// /signup form look identical:
//   - app/signup/page.tsx                 (live embeddable form)
//   - app/agency/marketing/page.tsx       (Embed-tab style editor + preview)
// resolveSignupPalette() turns the (sparse, all-optional) style plus the
// agency's brand color + theme into a concrete, fully-populated palette, so no
// consumer has to know the fallback rules. Everything is optional: an empty
// style resolves to exactly the form's current look (purely additive).
// ============================================================================

export type SignupRadius = 'sm' | 'md' | 'lg';
export type SignupThemeMode = 'auto' | 'light' | 'dark';

export interface SignupStyle {
  theme?: SignupThemeMode;   // 'auto' follows the agency website theme
  brandColor?: string;       // primary/brand accent (focus rings, highlights); default = agency primary
  buttonColor?: string;      // submit-button fill; default = brand
  buttonTextColor?: string;  // submit-button text; default auto-contrast
  headingColor?: string;     // form headline color; default = theme text
  cardBg?: string;           // form surface background; default follows theme
  radius?: SignupRadius;     // input/button corner rounding; default 'md'
}

export interface SignupPalette {
  isDark: boolean;
  brand: string;
  button: string;
  buttonText: string;
  heading: string;
  text: string;
  muted: string;
  cardBg: string;
  pageBg: string;
  border: string;
  radius: number;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
export function isHex(v?: string | null): v is string {
  return typeof v === 'string' && HEX.test(v.trim());
}

function expand(hex: string): string {
  const c = hex.trim().replace('#', '');
  return c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
}

export function isLightHex(hex?: string | null): boolean {
  if (!isHex(hex)) return false;
  const c = expand(hex);
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 150;
}

const RADII: Record<SignupRadius, number> = { sm: 8, md: 12, lg: 18 };

export function resolveSignupPalette(
  style: SignupStyle | null | undefined,
  opts: { primaryColor?: string | null; websiteTheme?: string | null },
): SignupPalette {
  const s = style || {};
  const brandDefault = isHex(opts.primaryColor) ? opts.primaryColor! : '#01f5d1';
  const brand = isHex(s.brandColor) ? s.brandColor! : brandDefault;
  const mode: SignupThemeMode = s.theme && s.theme !== 'auto' ? s.theme : (opts.websiteTheme === 'dark' ? 'dark' : 'light');
  const isDark = mode === 'dark';

  const button = isHex(s.buttonColor) ? s.buttonColor! : brand;
  const buttonText = isHex(s.buttonTextColor) ? s.buttonTextColor! : (isLightHex(button) ? '#0a0a0a' : '#ffffff');
  const text = isDark ? '#fafaf9' : '#111111';
  const heading = isHex(s.headingColor) ? s.headingColor! : text;
  const cardBg = isHex(s.cardBg) ? s.cardBg! : (isDark ? '#0a0a0a' : '#ffffff');

  return {
    isDark,
    brand,
    button,
    buttonText,
    heading,
    text,
    muted: isDark ? 'rgba(250,250,249,0.6)' : '#6b7280',
    cardBg,
    pageBg: isDark ? '#050505' : '#f6f7f9',
    border: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
    radius: RADII[s.radius || 'md'],
  };
}

export const DEFAULT_SIGNUP_STYLE: SignupStyle = { theme: 'auto', radius: 'md' };
