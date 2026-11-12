'use client';

// ============================================================================
// WebCallShell - the presentational idle/connecting card for the AI web-call
// widget. One renderer, driven entirely by a resolved WebCallPalette, shared by
// BOTH the live widget (app/webcall/page.tsx) and the dashboard inline editor,
// so the WYSIWYG preview is pixel-for-pixel what ships.
//
// Text is passed in as nodes (title/subtitle/phone/cta) so the live page can
// pass plain strings while the editor passes inline-editable nodes. The live
// call transcript / in-call / ended UI stays in the page; this shell only owns
// the idle + connecting presentation (the part an agency styles).
//
// Visual identity: a glossy brand orb with a sonar pulse, a small "voice
// equalizer" under it (the characteristic motif - this is a voice product, not
// a generic call button), a heavy display title, and a 24/7 live pill. All
// colors come from the palette so it stays on-brand for every agency.
// ============================================================================

import React from 'react';
import { Phone, Loader2, Sparkles } from 'lucide-react';
import { fontStack } from '@/lib/brandFonts';
import { WebCallPalette, WebCallBlock, hexA } from '@/lib/webcall-style';

export type WebCallRegion = 'card' | 'icon' | 'title' | 'subtitle' | WebCallBlock;

// Equalizer bar heights (px at scale 1) and their stagger, so the "voice" strip
// reads as sound rather than a flat row.
const EQ_BARS = [7, 14, 22, 12, 18, 9, 16];
const EQ_DELAY = [0, 0.12, 0.24, 0.36, 0.1, 0.28, 0.18];

export interface WebCallShellProps {
  palette: WebCallPalette;
  fonts?: { display?: string | null; body?: string | null };
  title: React.ReactNode;
  subtitle: React.ReactNode;
  phone?: React.ReactNode;        // formatted number node (hidden when palette.showPhone is false or this is empty)
  cta: React.ReactNode;
  connecting?: boolean;           // live: show spinner + "Calling..."
  interactive?: boolean;          // live: the call button starts a call; editor: false (click selects instead)
  onCall?: () => void;            // live start-call handler
  // Editor hook: wrap a region so it can be selected/outlined. Default = identity.
  selectable?: (region: WebCallRegion, node: React.ReactNode) => React.ReactNode;
}

export default function WebCallShell({
  palette, fonts, title, subtitle, phone, cta,
  connecting = false, interactive = false, onCall, selectable,
}: WebCallShellProps) {
  const p = palette;
  const wrap = selectable || ((_r: WebCallRegion, n: React.ReactNode) => n);
  const s = p.scale;

  const iconChip = p.showIcon ? wrap('icon', (
    <div style={{ height: 42 * s, width: 42 * s, borderRadius: 13, background: `linear-gradient(140deg, ${hexA(p.accent, 0.18)}, ${hexA(p.accent, 0.07)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `inset 0 0 0 1px ${hexA(p.accent, 0.22)}` }}>
      <Sparkles style={{ height: 20 * s, width: 20 * s, color: p.accent }} />
    </div>
  )) : null;

  // --- Body blocks, rendered in palette.order ---
  const renderBlock = (block: WebCallBlock): React.ReactNode => {
    if (block === 'button') {
      return wrap('button', (
        <div key="button" style={{ marginBottom: 18 }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Static concentric "signal" wells for depth */}
            <span style={{ position: 'absolute', height: 134 * s, width: 134 * s, borderRadius: '50%', border: `1px solid ${hexA(p.accent, 0.14)}` }} />
            <span style={{ position: 'absolute', height: 170 * s, width: 170 * s, borderRadius: '50%', border: `1px solid ${hexA(p.accent, 0.08)}` }} />
            {/* Animated sonar pulses */}
            <span className="va-ring" style={{ position: 'absolute', height: 104 * s, width: 104 * s, borderRadius: '50%', backgroundColor: hexA(p.accent, 0.26) }} />
            <span className="va-ring va-ring2" style={{ position: 'absolute', height: 104 * s, width: 104 * s, borderRadius: '50%', backgroundColor: hexA(p.accent, 0.15) }} />
            <button
              type="button"
              onClick={interactive && !connecting ? onCall : undefined}
              disabled={connecting}
              aria-label="Call"
              style={{ position: 'relative', height: 94 * s, width: 94 * s, borderRadius: '50%', background: `radial-gradient(circle at 32% 24%, rgba(255,255,255,0.45), rgba(255,255,255,0) 52%), ${p.buttonColor}`, border: 'none', cursor: interactive && !connecting ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.buttonIcon, boxShadow: `0 22px 48px -10px ${hexA(p.buttonColor, 0.6)}, inset 0 2px 1px rgba(255,255,255,0.4), inset 0 -10px 22px rgba(0,0,0,0.28)` }}
            >
              {connecting ? <Loader2 style={{ height: 30 * s, width: 30 * s, animation: 'vaspin 1s linear infinite' }} /> : <Phone style={{ height: 32 * s, width: 32 * s }} />}
            </button>
          </div>
          {/* Voice equalizer - the product's signature motif */}
          <div aria-hidden style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 * s, height: 20 * s, marginTop: 16 }}>
            {EQ_BARS.map((h, i) => (
              <span key={i} className="va-bar" style={{ width: 3.5 * s, height: h * s, borderRadius: 3, background: `linear-gradient(180deg, ${p.accent}, ${p.buttonColor})`, animationDelay: `${EQ_DELAY[i]}s` }} />
            ))}
          </div>
        </div>
      ));
    }
    if (block === 'phone') {
      if (!p.showPhone || !phone) return null;
      return wrap('phone', (
        <p key="phone" style={{ fontSize: 25 * s, fontWeight: 800, color: p.heading, margin: '0 0 6px', fontFamily: fontStack(fonts?.display, 'display'), letterSpacing: '0.2px', fontVariantNumeric: 'tabular-nums' }}>
          {phone}
        </p>
      ));
    }
    // cta
    return wrap('cta', (
      <p key="cta" style={{ fontSize: 13.5 * s, lineHeight: 1.5, color: p.muted, margin: '0 auto', maxWidth: 300, whiteSpace: 'pre-line', textWrap: 'balance' }}>
        {connecting ? 'Calling...' : cta}
      </p>
    ));
  };

  return (
    <div style={{ width: '100%', maxWidth: 440, position: 'relative', fontFamily: fontStack(fonts?.body, 'body') }}>
      {wrap('card', (
        <div style={{ position: 'relative', borderRadius: p.radius, border: `1px solid ${p.border}`, backgroundColor: p.cardBg, overflow: 'hidden', boxShadow: p.isDark ? '0 24px 60px rgba(0,0,0,0.5)' : `0 1px 0 rgba(255,255,255,0.7) inset, 0 30px 60px -22px rgba(2,6,23,0.24), 0 0 0 1px ${hexA(p.accent, 0.03)}` }}>
          {/* Thin brand accent line across the very top edge. */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${hexA(p.accent, 0.55)}, transparent)`, pointerEvents: 'none' }} />
          {/* Accent wash along the top edge, inside the card. */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150, background: `radial-gradient(120% 100% at 50% 0%, ${hexA(p.accent, 0.10)}, transparent 70%)`, pointerEvents: 'none' }} />
          {/* Header */}
          <div style={{ position: 'relative', padding: '20px 20px', borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            {iconChip}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.02em', fontFamily: fontStack(fonts?.display, 'display'), lineHeight: 1.2, color: p.heading }}>
                {wrap('title', title)}
              </div>
              <div style={{ fontSize: 12.5, color: p.muted, marginTop: 3 }}>
                {connecting ? 'Calling...' : wrap('subtitle', subtitle)}
              </div>
            </div>
            {/* 24/7 live pill (decorative, palette-driven) */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 8px', borderRadius: 999, backgroundColor: hexA(p.accent, 0.08), boxShadow: `inset 0 0 0 1px ${hexA(p.accent, 0.16)}`, flexShrink: 0 }}>
              <span style={{ position: 'relative', display: 'inline-flex', height: 7, width: 7 }}>
                <span className="va-dot" style={{ position: 'absolute', inset: -4, borderRadius: '50%', backgroundColor: hexA(p.accent, 0.4) }} />
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: p.accent }} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: p.heading, fontFamily: fontStack(fonts?.display, 'display') }}>24/7</span>
            </div>
          </div>
          {/* Body (idle) */}
          <div style={{ position: 'relative', padding: '30px 20px 26px' }}>
            <div style={{ textAlign: 'center' }}>
              {p.order.map((b) => renderBlock(b))}
            </div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes vaspin { to { transform: rotate(360deg); } }
        @keyframes vapulse { 0% { transform: scale(0.82); opacity: 0.6; } 70% { opacity: 0; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes vadot { 0% { transform: scale(0.6); opacity: 0.7; } 80% { opacity: 0; } 100% { transform: scale(1.9); opacity: 0; } }
        @keyframes vaeq { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1); } }
        .va-ring { animation: vapulse 1.9s ease-out infinite; }
        .va-ring2 { animation-delay: 0.95s; }
        .va-dot { animation: vadot 2s ease-out infinite; }
        .va-bar { animation: vaeq 1.1s ease-in-out infinite; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) { .va-ring, .va-dot, .va-bar { animation: none !important; } }
      `}</style>
    </div>
  );
}
