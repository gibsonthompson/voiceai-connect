'use client';

// ============================================================================
// SignatureEditor - a compact rich-text editor for the agency's white-label
// email signature. Outputs HTML (stored in agency.outreach_signature) so the
// outreach copy can paste into Gmail/Outlook with the logo and formatting
// intact. Uses contentEditable + execCommand: deprecated but universally
// supported and exactly right for a small signature surface (no need for a
// full rich-text engine). The editor is uncommitted-controlled: it seeds from
// `valueHtml` when not focused and reports changes on input, so React state
// never fights the caret.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Link as LinkIcon, Image as ImageIcon, AlignLeft, AlignCenter, Type, Eraser } from 'lucide-react';

export interface SignatureEditorTokens {
  text: string; muted: string; card: string; border: string;
  input: string; inputBorder: string; primary: string; primary15: string;
}

export interface SignatureEditorProps {
  valueHtml: string;
  onChange: (html: string) => void;
  onBlurSave?: () => void;
  t: SignatureEditorTokens;
  logoUrl?: string | null;
  mergeFields?: { token: string; label: string }[];
}

export default function SignatureEditor({ valueHtml, onChange, onBlurSave, t, logoUrl, mergeFields = [] }: SignatureEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Seed / re-seed from the value when the editor isn't being edited, so an
  // external load reflects without clobbering the caret mid-type.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el && el.innerHTML !== valueHtml) {
      el.innerHTML = valueHtml || '';
    }
  }, [valueHtml]);

  const emit = () => { if (ref.current) onChange(ref.current.innerHTML); };

  const exec = (command: string, value?: string) => {
    ref.current?.focus();
    try { document.execCommand(command, false, value); } catch { /* ignore */ }
    emit();
  };

  const insertHtml = (html: string) => {
    ref.current?.focus();
    try { document.execCommand('insertHTML', false, html); } catch { /* ignore */ }
    emit();
  };

  const addLink = () => {
    const url = window.prompt('Link URL (https://...)');
    if (!url) return;
    const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    exec('createLink', safe);
  };

  const addImage = () => {
    const url = window.prompt('Image URL', logoUrl || '');
    if (!url) return;
    const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    insertHtml(`<img src="${safe}" alt="" style="max-height:52px;max-width:220px;display:inline-block" />`);
  };

  const setColor = (e: React.ChangeEvent<HTMLInputElement>) => exec('foreColor', e.target.value);

  const btn = (onClick: () => void, title: string, children: React.ReactNode) => (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 30, minWidth: 30, padding: '0 6px', borderRadius: 7, border: `1px solid ${t.inputBorder}`, backgroundColor: t.input, color: t.text, cursor: 'pointer' }}>
      {children}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, alignItems: 'center' }}>
        {btn(() => exec('bold'), 'Bold', <Bold className="h-3.5 w-3.5" />)}
        {btn(() => exec('italic'), 'Italic', <Italic className="h-3.5 w-3.5" />)}
        {btn(() => exec('underline'), 'Underline', <Underline className="h-3.5 w-3.5" />)}
        {btn(() => exec('fontSize', '2'), 'Small text', <Type className="h-3 w-3" />)}
        {btn(() => exec('fontSize', '4'), 'Large text', <Type className="h-4 w-4" />)}
        {btn(addLink, 'Add link', <LinkIcon className="h-3.5 w-3.5" />)}
        {btn(addImage, 'Insert logo or image', <ImageIcon className="h-3.5 w-3.5" />)}
        {btn(() => exec('justifyLeft'), 'Align left', <AlignLeft className="h-3.5 w-3.5" />)}
        {btn(() => exec('justifyCenter'), 'Align center', <AlignCenter className="h-3.5 w-3.5" />)}
        <label title="Text color" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 30, width: 30, borderRadius: 7, border: `1px solid ${t.inputBorder}`, backgroundColor: t.input, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: t.text }}>A</span>
          <input type="color" onChange={setColor} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        </label>
        {btn(() => exec('removeFormat'), 'Clear formatting', <Eraser className="h-3.5 w-3.5" />)}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={() => { emit(); onBlurSave?.(); }}
        style={{ minHeight: 120, borderRadius: 12, padding: '12px 14px', fontSize: 14, lineHeight: 1.5, outline: 'none', backgroundColor: t.input, border: `1px solid ${t.inputBorder}`, color: t.text, overflowWrap: 'anywhere' }}
      />

      {mergeFields.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: t.muted }}>Insert:</span>
          {mergeFields.map((f) => (
            <button key={f.token} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertHtml(f.token)} title={`Insert ${f.token}`}
              style={{ fontSize: 11, fontWeight: 500, borderRadius: 999, padding: '3px 9px', border: `1px solid ${t.inputBorder}`, backgroundColor: t.primary15, color: t.primary, cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
