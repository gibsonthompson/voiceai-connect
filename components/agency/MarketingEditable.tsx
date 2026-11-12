'use client';

// ============================================================================
// Editable - click-to-type text for the agency marketing site, active ONLY when
// the site is rendered inside the dashboard Content-tab preview in editor mode
// (?preview=1&editor=1). On the real public site the context's `editor` is
// false, so Editable renders its children exactly as before: zero change to what
// visitors see, zero contentEditable, no listeners.
//
// In editor mode it renders the same tag/className but contentEditable, and
// posts each change up through the context's onEdit(field, value). The parent
// dashboard applies it to the content editor's config (and persists on save).
// Text is driven imperatively (ref + effect) and skipped while the node is
// focused, so the agency's cursor is never reset by the config echoing back.
// ============================================================================

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface EditorCtx {
  editor: boolean;
  onEdit: (field: string, value: string) => void;
  // Add/remove a repeatable item (feature, FAQ, step, etc.). path is the config
  // array address (e.g. "features"); index is required for remove. Optional so
  // older providers that only wire text editing still type-check.
  onItem?: (action: 'add' | 'remove', path: string, index?: number) => void;
}

const Ctx = createContext<EditorCtx>({ editor: false, onEdit: () => {} });

export function EditorProvider({ value, children }: { value: EditorCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEditor() { return useContext(Ctx); }

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type AsTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';

export function Editable({
  as = 'span', field, value, multiline = false, className, style, children,
}: {
  as?: AsTag;
  field: string;
  value: string;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // What the PUBLIC site renders (and the editor's fallback). Keeps each
  // template's exact hero markup (styled spans, line breaks) intact.
  children: React.ReactNode;
}) {
  const { editor, onEdit } = useEditor();
  const ref = useRef<HTMLElement | null>(null);

  // Keep the live DOM text in step with `value` whenever the node is NOT being
  // edited, so side-panel edits flow in but inline typing is never clobbered.
  useEffect(() => {
    if (!editor) return;
    const el = ref.current;
    if (!el || (typeof document !== 'undefined' && document.activeElement === el)) return;
    if (multiline) {
      const html = (value || '').split('\n').map(escapeHtml).join('<br>');
      if (el.innerHTML !== html) el.innerHTML = html;
    } else if (el.textContent !== (value || '')) {
      el.textContent = value || '';
    }
  }, [editor, value, multiline]);

  if (!editor) {
    return React.createElement(as, { className, style }, children);
  }

  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      className={className}
      style={{ ...style, cursor: 'text', outline: 'none' }}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-vai-edit
      title="Click to edit"
      onFocus={() => onEdit('__select__', field)}
      onInput={() => onEdit(field, multiline ? (ref.current?.innerText || '') : (ref.current?.textContent || ''))}
      onKeyDown={(e: React.KeyboardEvent) => { if (!multiline && e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); } }}
    />
  );
}

// Editable rich-text block for content that is stored as HTML (e.g. a FAQ
// answer with <p>/<ul>). On the public site it renders `children` (the template's
// own safe HTML renderer) unchanged. In editor mode it becomes a contentEditable
// region seeded with the HTML, and each change posts the element's innerHTML up
// so lists and paragraphs survive editing. Like Editable, the DOM is only
// re-synced from `html` while NOT focused, so the caret is never reset mid-type.
export function EditableHTML({
  field, html, className, style, children,
}: {
  field: string;
  html: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { editor, onEdit } = useEditor();
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!editor) return;
    const el = ref.current;
    if (!el || (typeof document !== 'undefined' && document.activeElement === el)) return;
    if (el.innerHTML !== (html || '')) el.innerHTML = html || '';
  }, [editor, html]);

  if (!editor) return <>{children}</>;

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, cursor: 'text', outline: 'none' }}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-vai-edit
      title="Click to edit"
      onFocus={() => onEdit('__select__', field)}
      onInput={() => onEdit(field, ref.current?.innerHTML || '')}
    />
  );
}

// Inline icon chooser shown in editor mode next to a repeatable item's icon
// (e.g. a feature). Renders nothing on the public site. Each option carries a
// key (the value stored in config) and the rendered icon node for that key.
// Picking one posts the new key through the normal edit channel (setByPath),
// so it persists and re-renders exactly like a text edit.
export function IconPicker({ field, value, options }: {
  field: string;
  value: string;
  options: { key: string; node: React.ReactNode }[];
}) {
  const { editor, onEdit } = useEditor();
  const [open, setOpen] = useState(false);
  if (!editor) return null;
  return (
    <div data-vai-ctl style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
          padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(127,127,127,0.4)',
          background: 'rgba(127,127,127,0.08)', color: 'inherit', cursor: 'pointer',
        }}
      >
        <span style={{ width: 13, height: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{options.find((o) => o.key === value)?.node}</span>
        Change icon
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', left: 0,
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: 8,
            background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12,
            boxShadow: '0 14px 34px rgba(0,0,0,0.2)',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              title={opt.key}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(field, opt.key); setOpen(false); }}
              style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 9, cursor: 'pointer', color: '#111827', background: '#fff',
                border: value === opt.key ? '2px solid #111827' : '1px solid rgba(0,0,0,0.12)',
              }}
            >
              <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{opt.node}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Convenience wrapper for a hard-coded UI label backed by the config.text
// override map. `k` is a stable key; `d` is the built-in default shown when the
// agency hasn't overridden it. Keeps the templates terse while making every
// label click-to-edit. On the public site it renders exactly `d` (or the
// override) with no extra markup.
export function TEdit({ config, as = 'span', k, d, className, style }: {
  config: { text?: Record<string, string> };
  as?: AsTag; k: string; d: string; className?: string; style?: React.CSSProperties;
}) {
  const v = (config.text && typeof config.text[k] === 'string') ? config.text[k] : d;
  return <Editable as={as} field={`text.${k}`} value={v} className={className} style={style}>{v}</Editable>;
}

// "+ Add" control placed at the end of a repeatable list. Renders nothing on
// the public site; in editor mode it asks the parent to append a new item to
// the config array at `path`.
export function ItemAdd({ path, label }: { path: string; label: string }) {
  const { editor, onItem } = useEditor();
  if (!editor || !onItem) return null;
  return (
    <button
      type="button"
      data-vai-ctl
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onItem('add', path); }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
        padding: '10px 16px', borderRadius: 10, border: '1.5px dashed rgba(127,127,127,0.5)',
        background: 'rgba(127,127,127,0.06)', color: 'inherit', cursor: 'pointer', marginTop: 16,
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add {label}
    </button>
  );
}

// Small remove control shown on each item in editor mode. Rendered in normal
// flow (no absolute positioning) so it never depends on the card being
// position:relative and can't break any template's layout.
export function ItemRemove({ path, index, label }: { path: string; index: number; label?: string }) {
  const { editor, onItem } = useEditor();
  if (!editor || !onItem) return null;
  return (
    <button
      type="button"
      data-vai-ctl
      title={label ? `Remove ${label}` : 'Remove'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onItem('remove', path, index); }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
        padding: '3px 9px', borderRadius: 999, border: '1px solid rgba(239,68,68,0.25)',
        background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', marginTop: 10,
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1 }}>&times;</span> Remove
    </button>
  );
}
