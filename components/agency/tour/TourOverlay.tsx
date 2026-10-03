'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight, ArrowLeft, X, Check, Sparkles } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useTour } from './TourProvider';

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(16,185,129,${alpha})`; }
}

const TOUR_CSS = `
@keyframes tourTipIn { from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes tourTipCenter { from { opacity: 0; transform: translate(-50%, -50%) scale(0.94); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
@keyframes tourPulse { 0%,100% { box-shadow: 0 0 0 3px var(--tcr), 0 0 26px var(--tcg); } 50% { box-shadow: 0 0 0 5px var(--tcr2), 0 0 44px var(--tcg2); } }
.tour-tip-in { animation: tourTipIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
.tour-tip-center { animation: tourTipCenter 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
.tour-ring { animation: tourPulse 2s ease-in-out infinite; }
`;

export default function TourOverlay() {
  const tour = useTour();
  const theme = useTheme();
  const pathname = usePathname();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const [drag, setDrag] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const step = tour && tour.active ? tour.steps[tour.stepIndex] : null;
  const isCentered = !step || step.placement === 'center' || !step.target;

  // Find the target on the current page, waiting out the route change + hydration.
  useEffect(() => {
    setReady(false); setRect(null); setDrag({ x: 0, y: 0 });
    if (!step) return;
    if (!step.target) { setReady(true); return; }
    let cancelled = false;
    const find = (): Element | null => {
      const all = document.querySelectorAll(`[data-tour="${step.target}"]`);
      const vw = window.innerWidth, vh = window.innerHeight;
      for (const el of Array.from(all)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.right > 0 && r.left < vw && r.bottom > 0 && r.top < vh) return el;
      }
      return null;
    };
    const existsInDom = () => document.querySelectorAll(`[data-tour="${step.target}"]`).length > 0;
    const started = Date.now();
    const tryFind = () => {
      if (cancelled) return;
      const el = find();
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { if (cancelled) return; setRect(el.getBoundingClientRect()); setReady(true); }, 350);
      } else if (existsInDom()) {
        setReady(true); // present but off-screen (e.g. the mobile drawer) -> centered card
      } else if (Date.now() - started < 4000) {
        setTimeout(tryFind, 150);
      } else {
        setReady(true); // never showed up -> centered card
      }
    };
    const t = setTimeout(tryFind, 150);
    const measure = () => { const el = find(); if (el) setRect(el.getBoundingClientRect()); };
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { cancelled = true; clearTimeout(t); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [step?.id, step?.target, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tour || !tour.active || !step) return null;

  const dx = drag.x, dy = drag.y;
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: dx, oy: dy };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return;
    setDrag({ x: dragStart.current.ox + e.clientX - dragStart.current.mx, y: dragStart.current.oy + e.clientY - dragStart.current.my });
  };
  const onUp = () => { setDragging(false); dragStart.current = null; };

  const pad = 8;
  const getClip = () => {
    if (!rect || isCentered) return 'none';
    const vw = window.innerWidth, vh = window.innerHeight, r = 12;
    const x = Math.max(0, rect.left - pad), y = Math.max(0, rect.top - pad);
    const x2 = Math.min(vw, rect.right + pad), y2 = Math.min(vh, rect.bottom + pad);
    const w = x2 - x, h = y2 - y;
    if (w <= 0 || h <= 0) return 'none';
    return `polygon(0 0, 0 100%, ${x}px 100%, ${x}px ${y + r}px, ${x + r}px ${y}px, ${x + w - r}px ${y}px, ${x + w}px ${y + r}px, ${x + w}px ${y + h - r}px, ${x + w - r}px ${y + h}px, ${x + r}px ${y + h}px, ${x}px ${y + h - r}px, ${x}px 100%, 100% 100%, 100% 0)`;
  };

  const tipStyle = (): React.CSSProperties => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const maxW = Math.min(360, vw - 24);
    if (isCentered || !rect) return { position: 'fixed', top: '50%', left: '50%', transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, maxWidth: maxW, zIndex: 100001 };
    const tipH = tipRef.current?.offsetHeight ?? 220;
    const gap = 14, margin = 14, headerH = 64;
    const spaceAbove = rect.top, spaceBelow = vh - rect.bottom, spaceRight = vw - rect.right, spaceLeft = rect.left;
    let pos = step.placement;
    if (pos === 'bottom' && spaceBelow < tipH + gap && spaceAbove > spaceBelow) pos = 'top';
    else if (pos === 'top' && spaceAbove < tipH + gap && spaceBelow > spaceAbove) pos = 'bottom';
    else if (pos === 'right' && spaceRight < maxW + gap && spaceLeft > spaceRight) pos = 'left';
    else if (pos === 'left' && spaceLeft < maxW + gap && spaceRight > spaceLeft) pos = 'right';
    if ((pos === 'top' && spaceAbove < tipH + gap) || (pos === 'bottom' && spaceBelow < tipH + gap)) {
      pos = spaceRight >= maxW + gap ? 'right' : spaceLeft >= maxW + gap ? 'left' : 'bottom';
    }
    const clampX = (x: number) => Math.max(margin, Math.min(x, vw - maxW - margin));
    const clampY = (y: number) => Math.max(headerH + margin, Math.min(y, vh - tipH - margin));
    const midX = rect.left + rect.width / 2, midY = rect.top + rect.height / 2;
    const s: React.CSSProperties = { position: 'fixed', maxWidth: maxW, zIndex: 100001 };
    switch (pos) {
      case 'bottom': s.top = clampY(rect.bottom + gap + dy); s.left = clampX(midX - maxW / 2 + dx); break;
      case 'top': s.top = clampY(rect.top - tipH - gap + dy); s.left = clampX(midX - maxW / 2 + dx); break;
      case 'right': s.top = clampY(midY - tipH / 2 + dy); s.left = clampX(rect.right + gap + dx); break;
      case 'left': s.top = clampY(midY - tipH / 2 + dy); s.left = clampX(rect.left - maxW - gap + dx); break;
    }
    return s;
  };

  const total = tour.steps.length;
  const pct = Math.round(((tour.stepIndex + 1) / total) * 100);
  const isLast = tour.stepIndex >= total - 1;

  const ringVars = {
    ['--tcr' as any]: hexToRgba(theme.primary, 0.18),
    ['--tcg' as any]: hexToRgba(theme.primary, 0.08),
    ['--tcr2' as any]: hexToRgba(theme.primary, 0.28),
    ['--tcg2' as any]: hexToRgba(theme.primary, 0.16),
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-[100000]" onClick={(e) => { if (e.target === e.currentTarget) tour.skip(); }}>
      <style dangerouslySetInnerHTML={{ __html: TOUR_CSS }} />
      {/* Dimmed backdrop with a cutout over the target */}
      <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.58)', clipPath: ready ? getClip() : 'none', backdropFilter: isCentered ? 'blur(3px)' : undefined }} />

      {ready && rect && !isCentered && (() => {
        const vw = window.innerWidth, vh = window.innerHeight;
        const x = Math.max(0, rect.left - pad), y = Math.max(0, rect.top - pad);
        const w = Math.min(vw, rect.right + pad) - x, h = Math.min(vh, rect.bottom + pad) - y;
        if (w <= 0 || h <= 0) return null;
        return <div className="fixed rounded-xl pointer-events-none tour-ring" style={{ left: x, top: y, width: w, height: h, border: `2px solid ${hexToRgba(theme.primary, 0.5)}`, ...ringVars }} />;
      })()}

      {ready && (
        <div
          ref={tipRef}
          className={isCentered ? 'tour-tip-center' : 'tour-tip-in'}
          style={{ ...tipStyle(), cursor: isCentered ? 'default' : dragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={isCentered ? undefined : onDown}
          onPointerMove={isCentered ? undefined : onMove}
          onPointerUp={isCentered ? undefined : onUp}
        >
          <div className={`rounded-2xl ${isCentered ? 'p-6 w-[92vw] max-w-md text-center' : 'p-4'}`} style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
            {isCentered ? (
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: theme.primary15 }}>
                  {isLast ? <Check className="h-6 w-6" style={{ color: theme.primary }} /> : <Sparkles className="h-6 w-6" style={{ color: theme.primary }} />}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{tour.stepIndex + 1}</div>
                  <div className="h-1 w-16 rounded-full overflow-hidden" style={{ backgroundColor: theme.hover }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: theme.primary }} />
                  </div>
                  <span className="text-[10px]" style={{ color: theme.textMuted }}>{tour.stepIndex + 1} of {total}</span>
                </div>
                <button onClick={tour.skip} className="p-1" style={{ color: theme.textMuted }} aria-label="Close tour"><X className="h-4 w-4" /></button>
              </div>
            )}

            <p className={`font-semibold ${isCentered ? 'text-lg' : 'text-sm'} mb-1`} style={{ color: theme.text }}>{step.title}</p>
            <p className="text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>{step.body}</p>

            <div className={`flex items-center gap-2 mt-4 ${isCentered ? 'justify-center' : 'justify-between'}`}>
              {!isCentered && (
                <button onClick={tour.skip} className="text-xs font-medium" style={{ color: theme.textMuted }}>Skip tour</button>
              )}
              <div className="flex items-center gap-2">
                {tour.stepIndex > 0 && (
                  <button onClick={tour.prev} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: theme.hover, color: theme.text }}>
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                )}
                <button onClick={tour.next} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  {isLast ? 'Finish' : <>Next <ArrowRight className="h-3.5 w-3.5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
