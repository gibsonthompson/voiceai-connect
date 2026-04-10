// ============================================================================
// COLOR EXTRACTION UTILITY
// Analyzes a logo image to detect background color, extract brand colors,
// and suggest a light/dark theme.
//
// FIX: Added isUsableBrandColor() to reject near-black/white results
// that are background/text colors, not actual brand colors.
// ============================================================================

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return rgbToHex(R, G, B);
}

/**
 * Check if a hex color is a usable brand color (not near-black, near-white, or gray).
 * Returns false for colors that are almost certainly background/text, not brand colors.
 */
export function isUsableBrandColor(hex: string): boolean {
  if (!hex || hex.length < 7) return false;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Too dark (near-black) — likely a background
  if (luminance < 0.12) return false;
  // Too light (near-white) — likely text on dark or background
  if (luminance > 0.88) return false;
  
  // Check saturation — grays are not brand colors
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation < 0.15) return false; // Too gray
  
  return true;
}

export function detectLogoBackground(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): { r: number; g: number; b: number; isTransparent: boolean } {
  const w = canvas.width;
  const h = canvas.height;
  const step = Math.max(1, Math.floor(Math.min(w, h) / 20));
  const edgePixels: ImageData[] = [];

  for (let x = 0; x < w; x += step) {
    edgePixels.push(ctx.getImageData(x, 0, 1, 1));
    edgePixels.push(ctx.getImageData(x, h - 1, 1, 1));
  }
  for (let y = 0; y < h; y += step) {
    edgePixels.push(ctx.getImageData(0, y, 1, 1));
    edgePixels.push(ctx.getImageData(w - 1, y, 1, 1));
  }

  const transparentCount = edgePixels.filter(p => p.data[3] < 128).length;
  if (transparentCount > edgePixels.length * 0.5) {
    return { r: 0, g: 0, b: 0, isTransparent: true };
  }

  let r = 0, g = 0, b = 0, count = 0;
  edgePixels.forEach(p => {
    if (p.data[3] >= 128) {
      r += p.data[0]; g += p.data[1]; b += p.data[2]; count++;
    }
  });

  return count > 0
    ? { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count), isTransparent: false }
    : { r: 255, g: 255, b: 255, isTransparent: false };
}

export interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
  logoBgColor: string;
  suggestedTheme: 'light' | 'dark';
}

export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  const fallback: ExtractedColors = {
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#60a5fa',
    logoBgColor: '#000000',
    suggestedTheme: 'dark',
  };

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(fallback); return; }

      const size = 150;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const bg = detectLogoBackground(canvas, ctx);
      const bgHex = bg.isTransparent ? '#000000' : rgbToHex(bg.r, bg.g, bg.b);

      let suggestedTheme: 'light' | 'dark' = 'dark';
      if (!bg.isTransparent) {
        const luminance = (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) / 255;
        suggestedTheme = luminance > 0.5 ? 'light' : 'dark';
      }

      const pixels = ctx.getImageData(0, 0, size, size).data;

      const colorData: Record<string, {
        count: number; r: number; g: number; b: number;
        saturation: number; lightness: number;
      }> = {};

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
        if (a < 128) continue;

        // Skip pixels too close to detected background
        const bgDist = Math.sqrt(
          Math.pow(r - bg.r, 2) + Math.pow(g - bg.g, 2) + Math.pow(b - bg.b, 2)
        );
        if (bgDist < 50) continue;

        const br = Math.round(r / 25) * 25;
        const bg2 = Math.round(g / 25) * 25;
        const bb = Math.round(b / 25) * 25;

        const max = Math.max(br, bg2, bb) / 255;
        const min = Math.min(br, bg2, bb) / 255;
        const lightness = (max + min) / 2;
        const saturation = max === min ? 0 : lightness > 0.5
          ? (max - min) / (2 - max - min)
          : (max - min) / (max + min);

        // Filter: skip too dark, too light, or too unsaturated
        if (lightness < 0.12 || lightness > 0.88) continue;
        if (saturation < 0.2) continue;

        const key = `${br},${bg2},${bb}`;
        if (!colorData[key]) {
          colorData[key] = { count: 0, r: br, g: bg2, b: bb, saturation, lightness };
        }
        colorData[key].count++;
      }

      // Sort by saturation × log(count) — prefer vibrant, common colors
      let colors = Object.values(colorData)
        .filter(c => c.count >= 5)
        .sort((a, b) => (b.saturation * Math.log(b.count)) - (a.saturation * Math.log(a.count)))
        .slice(0, 10)
        .map(c => rgbToHex(c.r, c.g, c.b));

      // CRITICAL: Filter out near-black/white/gray from final candidates
      colors = colors.filter(c => isUsableBrandColor(c));

      if (!colors.length) {
        resolve({ ...fallback, logoBgColor: bgHex, suggestedTheme });
        return;
      }

      const primary = colors[0];
      const secondary = colors[1] || adjustColorBrightness(primary, -25);
      const accent = colors[2] || adjustColorBrightness(primary, 30);
      resolve({ primary, secondary, accent, logoBgColor: bgHex, suggestedTheme });
    };

    img.onerror = () => { resolve(fallback); };
    img.src = imageUrl;
  });
}