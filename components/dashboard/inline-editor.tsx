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

import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

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

// ------------------------------------------------------------------ InlineText
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
  const [empty, setEmpty] = useState(!value);
  const [focused, setFocused] = useState(false);

  // Seed / re-seed the DOM from the value prop whenever it changes and the field
  // isn't being edited, so external saves reflect without clobbering the caret.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el && el.textContent !== value) {
      el.textContent = value || '';
    }
    setEmpty(!(el.textContent || '').trim());
  }, [value]);

  const commit = () => {
    const el = ref.current;
    if (!el) return;
    let text = (el.textContent || '').replace(/\n/g, multiline ? '\n' : ' ').trim();
    if (maxLength && text.length > maxLength) text = text.slice(0, maxLength);
    el.textContent = text;
    setEmpty(!text);
    setFocused(false);
    if (text !== value) onCommit(text);
  };

  return (
    <span style={{ position: 'relative', display: 'inline-block', minWidth: 24 }}>
      <span
        ref={ref}
        role="textbox"
        aria-label={ariaLabel}
        tabIndex={0}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onFocus={() => setFocused(true)}
        onInput={() => setEmpty(!((ref.current?.textContent || '').trim()))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (!multiline && e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); }
          if (e.key === 'Escape') { if (ref.current) ref.current.textContent = value || ''; (e.target as HTMLElement).blur(); }
        }}
        style={{
          outline: 'none', cursor: 'text', borderRadius: 4, padding: '0 2px',
          whiteSpace: multiline ? 'pre-wrap' : 'normal',
          ...style,
        }}
      />
      {empty && !focused && placeholder && (
        <span aria-hidden style={{ position: 'absolute', left: 2, top: 0, pointerEvents: 'none', opacity: 0.45, ...style }}>
          {placeholder}
        </span>
      )}
    </span>
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

// ------------------------------------------------------------------- ColorField
export function ColorField({
  label, value, fallback, onChange, theme,
}: {
  label: string;
  value?: string;            // the override, if any
  fallback: string;          // resolved default when no override
  onChange: (hex: string | undefined) => void;
  theme: EditorTheme;
}) {
  const current = value || fallback;
  const nativeRef = useRef<HTMLInputElement>(null);
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
          type="button"
          onClick={() => nativeRef.current?.click()}
          aria-label={`${label} color`}
          style={{ height: 32, width: 32, flexShrink: 0, borderRadius: 8, border: `1px solid ${theme.inputBorder}`, backgroundColor: current, cursor: 'pointer', position: 'relative' }}
        />
        <input
          ref={nativeRef}
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(current) ? current : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
        <input
          type="text"
          value={draft}
          placeholder={fallback}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
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
