'use client';

// ============================================================================
// Inline editor framework (GoHighLevel-style) for widget previews.
// Reusable, presentational, theme-driven building blocks:
//   InlineText        - click-to-edit text, commits on blur (no input boxes)
//   SelectableRegion  - click a part of the preview to select + outline it
//   PropertyPanel     - themed side panel of controls for the selected part
//   ColorField        - swatch + hex + reset (override vs brand default)
//   ToggleField       - on/off switch
//   SegmentField      - segmented choice (never a native <select>)
//   ReorderField      - drag-and-drop (plus up/down) ordering
// The composing editor owns the data + selection state; these are controlled.
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, GripVertical, ChevronUp, ChevronDown, Shuffle } from 'lucide-react';

export interface EditorTheme {
  text: string;
  muted: string;
  border: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  cardBg: string;
  primary: string;
  isDark: boolean;
}

export interface BrandColors { primary: string; secondary: string; accent: string; }

// Shared swatch palette, matched to the Branding page picker: neutrals, brights,
// light tints, mids, darks. Nine per row.
const PALETTE: string[] = [
  '#ffffff', '#f3f4f6', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#111827', '#000000',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#78716c',
  '#fecaca', '#fed7aa', '#fde68a', '#fef08a', '#d9f99d', '#bbf7d0', '#a7f3d0', '#99f6e4', '#a5f3fc',
  '#bae6fd', '#bfdbfe', '#c7d2fe', '#ddd6fe', '#e9d5ff', '#f5d0fe', '#fbcfe8', '#fecdd2', '#e7e5e4',
  '#991b1b', '#9a3412', '#92400e', '#854d0e', '#3f6212', '#166534', '#065f46', '#115e59', '#155e75',
];

// ------------------------------------------------------------------ InlineText
// The placeholder is drawn by a :empty::before pseudo-element (see the injected
// stylesheet) so it lives INSIDE the editable box and inherits its width,
// alignment and whitespace. A previous version absolutely-positioned the
// placeholder inside a 24px-wide wrapper, which forced any long placeholder (a
// phone number, a title) to wrap one token per line and overlap its neighbours.
function ensureInlineStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('vai-inline-styles')) return;
  const el = document.createElement('style');
  el.id = 'vai-inline-styles';
  el.textContent =
    '.vai-inline:empty::before{content:attr(data-ph);opacity:.45;pointer-events:none;}' +
    '.vai-inline:focus:empty::before{content:"";}';
  document.head.appendChild(el);
}

export function InlineText({
  value, placeholder, onCommit, maxLength, multiline = false, style, ariaLabel,
}: {
  value: string;
  placeholder?: string;
  onCommit: (v: string) => void;
  maxLength?: number;
  multiline?: boolean;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { ensureInlineStyles(); }, []);

  // Seed / re-seed the DOM from the value prop whenever it changes and the field
  // isn't being edited, so external saves reflect without clobbering the caret.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el && el.textContent !== (value || '')) {
      el.textContent = value || '';
    }
  }, [value]);

  const commit = () => {
    const el = ref.current;
    if (!el) return;
    let text = (el.textContent || '').replace(/\n/g, multiline ? '\n' : ' ').trim();
    if (maxLength && text.length > maxLength) text = text.slice(0, maxLength);
    el.textContent = text;
    if (text !== (value || '')) onCommit(text);
  };

  return (
    <span
      ref={ref}
      role="textbox"
      aria-label={ariaLabel}
      tabIndex={0}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-ph={placeholder || ''}
      className="vai-inline"
      onBlur={commit}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); }
        if (e.key === 'Escape') { if (ref.current) ref.current.textContent = value || ''; (e.target as HTMLElement).blur(); }
      }}
      style={{
        display: 'inline-block', maxWidth: '100%', outline: 'none', cursor: 'text',
        borderRadius: 4, padding: '0 2px',
        whiteSpace: multiline ? 'pre-wrap' : 'normal',
        ...style,
      }}
    />
  );
}

// ------------------------------------------------------------- SelectableRegion
export function SelectableRegion({
  id, label, selected, onSelect, theme, children, padding = 4,
}: {
  id: string;
  label: string;
  selected: boolean;
  onSelect: (id: string) => void;
  theme: EditorTheme;
  children: React.ReactNode;
  padding?: number;
}) {
  const [hover, setHover] = useState(false);
  const ring = selected ? `0 0 0 2px ${theme.primary}` : hover ? `0 0 0 1px ${hexA(theme.primary, 0.5)}` : 'none';
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', display: 'block', borderRadius: 8, boxShadow: ring, transition: 'box-shadow 0.12s', cursor: 'pointer', padding }}
    >
      {selected && (
        <span style={{ position: 'absolute', top: -9, left: 8, zIndex: 5, fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff', backgroundColor: theme.primary, borderRadius: 4, padding: '1px 6px', pointerEvents: 'none' }}>
          {label}
        </span>
      )}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- PropertyPanel
export function PropertyPanel({
  title, theme, children, onClose,
}: {
  title: string;
  theme: EditorTheme;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${theme.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.muted }}>{title}</span>
        {onClose && <button type="button" onClick={onClose} style={{ fontSize: 11, color: theme.muted, background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>}
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children, theme }: { children: React.ReactNode; theme: EditorTheme }) {
  return <label style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 6, display: 'block' }}>{children}</label>;
}

// --------------------------------------------------------------- SwatchPopup
// Themed color-picker popup (matches the Branding page): a body-level portal so
// a card's overflow never clips it, brand swatches, shuffle, and a palette grid.
function SwatchPopup({ value, brand, theme, onPick, onClose, anchorRef }: {
  value?: string;
  brand?: BrandColors;
  theme: EditorTheme;
  onPick: (hex: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const WIDTH = 268;

  const measure = useCallback(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    const gap = 8;
    const below = window.innerHeight - r.bottom;
    const up = below < 320 && r.top > below;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - WIDTH - 8));
    setPos({ top: up ? r.top - gap : r.bottom + gap, left, up });
  }, [anchorRef]);

  useEffect(() => {
    measure();
    const h = () => measure();
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [measure]);

  useEffect(() => {
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc, { passive: true });
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('touchstart', onDoc); };
  }, [anchorRef, onClose]);

  if (!pos || typeof document === 'undefined') return null;
  const cur = (value || '').toLowerCase();
  const brandList = brand ? [{ name: 'Primary', color: brand.primary }, { name: 'Secondary', color: brand.secondary }, { name: 'Accent', color: brand.accent }].filter((b) => b.color) : [];
  const shuffle = () => onPick(PALETTE[Math.floor(Math.random() * PALETTE.length)]);

  return createPortal(
    <div ref={panelRef} style={{ position: 'fixed', left: pos.left, width: WIDTH, zIndex: 9999, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }), backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 14, boxShadow: '0 12px 34px rgba(0,0,0,0.28)', padding: 12 }}>
      {brandList.length > 0 && (<>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>Your brand</span>
          <button type="button" onClick={shuffle} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, borderRadius: 6, padding: '4px 8px', color: theme.muted, border: `1px solid ${theme.border}`, background: 'none', cursor: 'pointer' }}><Shuffle style={{ height: 12, width: 12 }} /> Shuffle</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {brandList.map((b) => (
            <button key={b.name} type="button" onClick={() => onPick(b.color)} title={`${b.name} (${b.color})`} style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: b.color, border: `2px solid ${cur === b.color.toLowerCase() ? theme.primary : theme.border}`, cursor: 'pointer' }} />
          ))}
        </div>
      </>)}
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: theme.text }}>Colors</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 6 }}>
        {PALETTE.map((c) => (
          <button key={c} type="button" onClick={() => onPick(c)} title={c} style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 6, backgroundColor: c, border: cur === c.toLowerCase() ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`, cursor: 'pointer' }} />
        ))}
      </div>
    </div>,
    document.body,
  );
}

// ------------------------------------------------------------------- ColorField
export function ColorField({
  label, value, fallback, onChange, theme, brand,
}: {
  label: string;
  value?: string;            // the override, if any
  fallback: string;          // resolved default when no override
  onChange: (hex: string | undefined) => void;
  theme: EditorTheme;
  brand?: BrandColors;
}) {
  const current = value || fallback;
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || '');
  useEffect(() => { setDraft(value || ''); }, [value]);
  const commitHex = (v: string) => {
    const t = v.trim();
    if (t === '') { onChange(undefined); return; }
    const hex = t.startsWith('#') ? t : `#${t}`;
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) onChange(hex);
  };
  return (
    <div>
      <FieldLabel theme={theme}>{label}</FieldLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={`Pick ${label}`}
          style={{ height: 32, width: 32, flexShrink: 0, borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: current, cursor: 'pointer' }}
        />
        {open && <SwatchPopup value={value} brand={brand} theme={theme} anchorRef={btnRef} onPick={(hex) => { setDraft(hex); onChange(hex); setOpen(false); }} onClose={() => setOpen(false)} />}
        <input
          type="text"
          value={draft}
          placeholder={fallback}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          spellCheck={false}
          style={{ flex: 1, minWidth: 0, borderRadius: 8, padding: '7px 10px', fontSize: 13, fontFamily: 'ui-monospace, monospace', backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText }}
        />
        {value && (
          <button type="button" onClick={() => onChange(undefined)} title="Reset to brand default" style={{ flexShrink: 0, height: 32, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBg, color: theme.muted, cursor: 'pointer' }}>
            <RotateCcw style={{ height: 14, width: 14 }} />
          </button>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ ToggleField
export function ToggleField({
  label, checked, onChange, theme,
}: { label: string; checked: boolean; onChange: (v: boolean) => void; theme: EditorTheme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: theme.text }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{ position: 'relative', height: 24, width: 44, flexShrink: 0, borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'background-color 0.15s', backgroundColor: checked ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db') }}
      >
        <span style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, height: 18, width: 18, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ SegmentField
export function SegmentField<T extends string>({
  label, value, options, onChange, theme,
}: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; theme: EditorTheme }) {
  return (
    <div>
      <FieldLabel theme={theme}>{label}</FieldLabel>
      <div style={{ display: 'inline-flex', borderRadius: 9, padding: 3, gap: 2, backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button key={o.value} type="button" onClick={() => onChange(o.value)} style={{ padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.12s', backgroundColor: on ? theme.primary : 'transparent', color: on ? '#fff' : theme.muted }}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ ReorderField
export function ReorderField({
  label, items, onChange, theme,
}: {
  label: string;
  items: { id: string; label: string }[];
  onChange: (orderIds: string[]) => void;
  theme: EditorTheme;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const ids = items.map((i) => i.id);

  const move = (id: string, dir: -1 | 1) => {
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const dropBefore = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const next = ids.filter((x) => x !== dragId);
    next.splice(next.indexOf(targetId), 0, dragId);
    onChange(next);
    setDragId(null);
  };

  return (
    <div>
      <FieldLabel theme={theme}>{label}</FieldLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it, idx) => (
          <div
            key={it.id}
            draggable
            onDragStart={() => setDragId(it.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dropBefore(it.id)}
            onDragEnd={() => setDragId(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9, backgroundColor: theme.inputBg, border: `1px solid ${dragId === it.id ? theme.primary : theme.inputBorder}`, cursor: 'grab', opacity: dragId === it.id ? 0.6 : 1 }}
          >
            <GripVertical style={{ height: 14, width: 14, color: theme.muted, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: theme.text }}>{it.label}</span>
            <button type="button" onClick={() => move(it.id, -1)} disabled={idx === 0} style={{ display: 'flex', padding: 2, border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: theme.muted, opacity: idx === 0 ? 0.3 : 1 }}><ChevronUp style={{ height: 15, width: 15 }} /></button>
            <button type="button" onClick={() => move(it.id, 1)} disabled={idx === items.length - 1} style={{ display: 'flex', padding: 2, border: 'none', background: 'none', cursor: idx === items.length - 1 ? 'default' : 'pointer', color: theme.muted, opacity: idx === items.length - 1 ? 0.3 : 1 }}><ChevronDown style={{ height: 15, width: 15 }} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function hexA(hex: string, a: number): string {
  const c = (hex || '').replace('#', '');
  if (c.length < 6) return `rgba(59,130,246,${a})`;
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
