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
// ============================================================================

import React from 'react';
import { Phone, Loader2 } from 'lucide-react';
import { fontStack } from '@/lib/brandFonts';
import { WebCallPalette, WebCallBlock, hexA } from '@/lib/webcall-style';

export type WebCallRegion = 'card' | 'icon' | 'title' | 'subtitle' | WebCallBlock;

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
    <div style={{ height: 40 * s, width: 40 * s, borderRadius: 12, backgroundColor: hexA(p.accent, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Phone style={{ height: 20 * s, width: 20 * s, color: p.accent }} />
    </div>
  )) : null;

  // --- Body blocks, rendered in palette.order ---
  const renderBlock = (block: WebCallBlock): React.ReactNode => {
    if (block === 'button') {
      return wrap('button', (
        <div key="button" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <span className="va-ring" style={{ position: 'absolute', height: 104 * s, width: 104 * s, borderRadius: '50%', backgroundColor: hexA(p.accent, 0.35) }} />
          <span className="va-ring va-ring2" style={{ position: 'absolute', height: 104 * s, width: 104 * s, borderRadius: '50%', backgroundColor: hexA(p.accent, 0.22) }} />
          <button
            type="button"
            onClick={interactive && !connecting ? onCall : undefined}
            disabled={connecting}
            aria-label="Call"
            style={{ position: 'relative', height: 92 * s, width: 92 * s, borderRadius: '50%', backgroundColor: p.buttonColor, border: 'none', cursor: interactive && !connecting ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.buttonIcon, boxShadow: `0 12px 34px ${hexA(p.buttonColor, 0.45)}` }}
          >
            {connecting ? <Loader2 style={{ height: 30 * s, width: 30 * s, animation: 'vaspin 1s linear infinite' }} /> : <Phone style={{ height: 32 * s, width: 32 * s }} />}
          </button>
        </div>
      ));
    }
    if (block === 'phone') {
      if (!p.showPhone || !phone) return null;
      return wrap('phone', (
        <p key="phone" style={{ fontSize: 23 * s, fontWeight: 800, color: p.heading, margin: '0 0 4px', fontFamily: fontStack(fonts?.display, 'display'), letterSpacing: '0.3px' }}>
          {phone}
        </p>
      ));
    }
    // cta
    return wrap('cta', (
      <p key="cta" style={{ fontSize: 13.5 * s, color: p.muted, margin: '0 auto 2px', maxWidth: 320 }}>
        {connecting ? 'Calling...' : cta}
      </p>
    ));
  };

  return (
    <div style={{ width: '100%', maxWidth: 440, position: 'relative', fontFamily: fontStack(fonts?.body, 'body') }}>
      {/* Soft brand glow so the widget reads as intentional on any site. */}
      <div style={{ position: 'absolute', top: -36, left: 24, right: 24, height: 150, borderRadius: '50%', background: `radial-gradient(60% 100% at 50% 0%, ${hexA(p.accent, 0.18)}, transparent 72%)`, pointerEvents: 'none' }} />
      {wrap('card', (
        <div style={{ position: 'relative', borderRadius: p.radius, border: `1px solid ${p.border}`, backgroundColor: p.cardBg, overflow: 'hidden', boxShadow: p.isDark ? '0 20px 50px rgba(0,0,0,0.45)' : '0 18px 50px rgba(2,6,23,0.12)' }}>
          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            {iconChip}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, fontFamily: fontStack(fonts?.display, 'display'), lineHeight: 1.15, color: p.heading }}>
                {wrap('title', title)}
              </div>
              <div style={{ fontSize: 12.5, color: p.muted, marginTop: 2 }}>
                {connecting ? 'Calling...' : wrap('subtitle', subtitle)}
              </div>
            </div>
          </div>
          {/* Body (idle) */}
          <div style={{ padding: 20 }}>
            <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
              {p.order.map((b) => renderBlock(b))}
            </div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes vaspin { to { transform: rotate(360deg); } }
        @keyframes vapulse { 0% { transform: scale(0.85); opacity: 0.7; } 70% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1.5); opacity: 0; } }
        .va-ring { animation: vapulse 1.8s ease-out infinite; }
        .va-ring2 { animation-delay: 0.9s; }
      `}</style>
    </div>
  );
}
