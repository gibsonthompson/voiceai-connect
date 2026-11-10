// ============================================================================
// Web-call widget style model (shared source of truth)
// VoiceAI Connect
// ----------------------------------------------------------------------------
// The agency customizes the embeddable AI web-call widget from the Embed tab
// (inline editor). Text lives on dedicated agency columns (webcall_title /
// _subtitle / _cta); everything VISUAL lives in this style object, stored under
// agency.marketing_config.webcall (JSONB, no migration needed).
//
// Three surfaces consume this one model so the editor preview, the live
// /webcall page, and the on-site AI web-call section all look identical:
//   - components/widgets/WebCallShell.tsx   (renders the card from a palette)
//   - app/webcall/page.tsx                  (live widget)
//   - the dashboard editor                  (WYSIWYG preview)
// resolveWebCallPalette() turns the (sparse, all-optional) style plus the
// agency's brand color + theme into a concrete, fully-populated palette, so no
// consumer ever has to know the fallback rules.
// ============================================================================

export type WebCallBlock = 'button' | 'phone' | 'cta';
// The reorderable body elements, in their default order.
export const WEBCALL_BLOCKS: WebCallBlock[] = ['button', 'phone', 'cta'];
export const WEBCALL_BLOCK_LABELS: Record<WebCallBlock, string> = {
  button: 'Call button',
  phone: 'Phone number',
  cta: 'Prompt text',
};

export type WebCallSize = 'sm' | 'md' | 'lg';
export type WebCallRadius = 'sm' | 'md' | 'lg';
export type WebCallThemeMode = 'auto' | 'light' | 'dark';

export interface WebCallStyle {
  // 'auto' follows the agency's website theme; light/dark force it.
  theme?: WebCallThemeMode;
  cardBg?: string;          // card background (hex); default follows theme
  headingColor?: string;    // title color; default = main text color
  subTextColor?: string;    // subtitle + prompt color; default = muted text
  buttonColor?: string;     // call-button fill; default = brand primary
  buttonIconColor?: string; // icon inside the call button; default auto-contrast
  accentColor?: string;     // ring glow / brand accent; default = brand primary
  showIcon?: boolean;       // header icon chip; default true
  showPhone?: boolean;      // the big phone-number line; default true
  size?: WebCallSize;       // overall scale; default 'md'
  radius?: WebCallRadius;   // card corner rounding; default 'md'
  order?: WebCallBlock[];   // order of the body elements; default WEBCALL_BLOCKS
}

export interface WebCallPalette {
  isDark: boolean;
  primary: string;
  accent: string;
  buttonColor: string;
  buttonIcon: string;
  cardBg: string;
  pageBg: string;
  heading: string;
  text: string;
  muted: string;
  border: string;
  radius: number;   // card corner radius, px
  scale: number;    // size multiplier applied to the hero elements
  showIcon: boolean;
  showPhone: boolean;
  order: WebCallBlock[];
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
export function isHex(v?: string | null): v is string {
  return typeof v === 'string' && HEX.test(v.trim());
}

// Expand #abc -> #aabbcc so downstream math can assume 6 digits.
function expand(hex: string): string {
  const c = hex.trim().replace('#', '');
  return c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
}

export function hexA(hex: string, a: number): string {
  if (!isHex(hex)) return `rgba(1,245,209,${a})`;
  const c = expand(hex);
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// Perceived luminance test, used to pick a readable icon color on the button.
export function isLightHex(hex?: string | null): boolean {
  if (!isHex(hex)) return false;
  const c = expand(hex);
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 150;
}

function pick<T>(v: T | undefined, fallback: T): T {
  return v === undefined || v === null ? fallback : v;
}

// Keep only the three known blocks, de-duped, with any missing ones appended so
// the body never silently drops an element even if the stored order is partial.
function normalizeOrder(order?: WebCallBlock[]): WebCallBlock[] {
  if (!Array.isArray(order)) return [...WEBCALL_BLOCKS];
  const seen = new Set<WebCallBlock>();
  const out: WebCallBlock[] = [];
  for (const b of order) {
    if (WEBCALL_BLOCKS.includes(b) && !seen.has(b)) { seen.add(b); out.push(b); }
  }
  for (const b of WEBCALL_BLOCKS) if (!seen.has(b)) out.push(b);
  return out;
}

const RADII: Record<WebCallRadius, number> = { sm: 14, md: 22, lg: 30 };
const SCALES: Record<WebCallSize, number> = { sm: 0.9, md: 1, lg: 1.12 };

export function resolveWebCallPalette(
  style: WebCallStyle | null | undefined,
  opts: { primaryColor?: string | null; websiteTheme?: string | null },
): WebCallPalette {
  const s = style || {};
  const primary = isHex(opts.primaryColor) ? opts.primaryColor! : '#01f5d1';
  const mode: WebCallThemeMode = s.theme && s.theme !== 'auto' ? s.theme : (opts.websiteTheme === 'dark' ? 'dark' : 'light');
  const isDark = mode === 'dark';

  const accent = isHex(s.accentColor) ? s.accentColor! : primary;
  const buttonColor = isHex(s.buttonColor) ? s.buttonColor! : primary;
  const buttonIcon = isHex(s.buttonIconColor) ? s.buttonIconColor! : (isLightHex(buttonColor) ? '#050505' : '#ffffff');
  const cardBg = isHex(s.cardBg) ? s.cardBg! : (isDark ? '#15161a' : '#ffffff');
  const text = isDark ? '#f5f5f7' : '#0f172a';
  const heading = isHex(s.headingColor) ? s.headingColor! : text;
  const muted = isHex(s.subTextColor) ? s.subTextColor! : (isDark ? 'rgba(245,245,247,0.6)' : '#64748b');

  return {
    isDark,
    primary,
    accent,
    buttonColor,
    buttonIcon,
    cardBg,
    pageBg: isDark ? '#0b0c0f' : '#f6f7f9',
    heading,
    text,
    muted,
    border: isDark ? 'rgba(255,255,255,0.10)' : '#e8ebf0',
    radius: RADII[pick(s.radius, 'md')],
    scale: SCALES[pick(s.size, 'md')],
    showIcon: s.showIcon !== false,
    showPhone: s.showPhone !== false,
    order: normalizeOrder(s.order),
  };
}

export const DEFAULT_WEBCALL_STYLE: WebCallStyle = {
  theme: 'auto',
  showIcon: true,
  showPhone: true,
  size: 'md',
  radius: 'md',
  order: [...WEBCALL_BLOCKS],
};
