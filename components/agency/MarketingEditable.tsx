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

import React, { createContext, useContext, useEffect, useRef } from 'react';

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
