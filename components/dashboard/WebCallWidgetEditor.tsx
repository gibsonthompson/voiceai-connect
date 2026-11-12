'use client';

// ============================================================================
// WebCallWidgetEditor - the GoHighLevel-style inline editor for the AI web-call
// widget, shown in the marketing Embed tab. The preview IS the editor: click
// any part to select it, edit text in place, and style it from the side panel.
// No input-field rows. Renders the exact shared WebCallShell the live widget
// uses, so what you see is what ships.
// ============================================================================

import React, { useState } from 'react';
import {
  InlineText, SelectableRegion, PropertyPanel, ColorField, ToggleField, SegmentField, ReorderField, EditorTheme, BrandColors,
} from '@/components/dashboard/inline-editor';
import WebCallShell, { WebCallRegion } from '@/components/widgets/WebCallShell';
import {
  WebCallStyle, WebCallBlock, WEBCALL_BLOCK_LABELS, resolveWebCallPalette,
} from '@/lib/webcall-style';

function formatPhone(raw?: string): string {
  const d = (raw || '').replace(/\D/g, '');
  const ten = d.length === 11 && d[0] === '1' ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return raw || '';
}

// Small uppercase group heading inside the editor panel.
function SectionLabel({ theme, children }: { theme: EditorTheme; children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: theme.muted, marginBottom: 10 }}>{children}</div>;
}

// A plain labeled text input styled to match the panel (the number field).
function PanelInput({ theme, label, value, placeholder, onChange }: {
  theme: EditorTheme; label: string; value: string; placeholder?: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 6, display: 'block' }}>{label}</label>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', borderRadius: 10, padding: '8px 12px', fontSize: 14, backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, outline: 'none' }} />
    </div>
  );
}

export interface WebCallWidgetEditorProps {
  title: string;
  subtitle: string;
  cta: string;
  onCommitText: (patch: { title?: string; subtitle?: string; cta?: string }) => void;
  style: WebCallStyle;
  onChangeStyle: (next: WebCallStyle) => void;
  primaryColor: string;
  websiteTheme: string;
  phoneNumber?: string;
  agencyName?: string;
  fonts?: { display?: string | null; body?: string | null };
  editorTheme: EditorTheme;
  brand?: BrandColors;
  disabled?: boolean;
  // "Visitors hear" control (demo vs a test client + client picker), rendered by
  // the parent so it owns the client list/state, shown on the canvas card panel.
  modeControl?: React.ReactNode;
}

export default function WebCallWidgetEditor(props: WebCallWidgetEditorProps) {
  const { style, onChangeStyle, primaryColor, websiteTheme, editorTheme: t } = props;
  const [selected, setSelected] = useState<WebCallRegion | null>(null);
  const palette = resolveWebCallPalette(style, { primaryColor, websiteTheme });

  const set = (patch: Partial<WebCallStyle>) => onChangeStyle({ ...style, ...patch });

  const selectable = (region: WebCallRegion, node: React.ReactNode) => (
    <SelectableRegion id={region} label={regionLabel(region)} selected={selected === region} onSelect={(id) => setSelected(id as WebCallRegion)} theme={t} padding={region === 'card' ? 0 : 4}>
      {node}
    </SelectableRegion>
  );

  const phoneDisplay = formatPhone(props.phoneNumber) || '(555) 123-4567';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 16 }} className="wce-grid">
      {/* Preview (click to select, edit text in place) */}
      <div
        onClick={() => setSelected(null)}
        style={{ borderRadius: 16, border: `1px solid ${t.inputBorder}`, backgroundColor: palette.pageBg, padding: '34px 16px 18px', display: 'flex', justifyContent: 'center' }}
      >
        <WebCallShell
          palette={palette}
          fonts={props.fonts}
          interactive={false}
          selectable={selectable}
          title={<InlineText value={props.title} placeholder={`Talk to ${props.agencyName || 'your business'}`} maxLength={60} onCommit={(v) => props.onCommitText({ title: v })} ariaLabel="Widget title" style={{ color: palette.heading }} />}
          subtitle={<InlineText value={props.subtitle} placeholder="AI receptionist" maxLength={60} onCommit={(v) => props.onCommitText({ subtitle: v })} ariaLabel="Widget subtitle" style={{ color: palette.muted }} />}
          cta={<InlineText value={props.cta} placeholder={'Talk to the AI right in your browser.\nAllow your mic when asked.'} maxLength={160} multiline onCommit={(v) => props.onCommitText({ cta: v })} ariaLabel="Widget prompt" style={{ color: palette.muted }} />}
          phone={<InlineText value={style.phoneText || ''} placeholder={phoneDisplay} maxLength={24} onCommit={(v) => set({ phoneText: v })} ariaLabel="Phone number" style={{ color: palette.heading }} />}
        />
      </div>

      {/* Editor panel: everything is here from the start, no click-to-reveal.
          You can still click text on the preview to edit it in place. */}
      <PropertyPanel title="Edit widget" theme={t}>
        {props.modeControl ? (
          <div style={{ paddingBottom: 14, borderBottom: `1px solid ${t.inputBorder}` }}>{props.modeControl}</div>
        ) : null}

        <div>
          <SectionLabel theme={t}>Content</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <PanelInput theme={t} label="Phone number shown" value={style.phoneText || ''} placeholder={phoneDisplay} onChange={(v) => set({ phoneText: v })} />
              {style.phoneText ? (
                <button type="button" onClick={() => set({ phoneText: '' })} style={{ marginTop: 6, fontSize: 12, fontWeight: 500, color: t.primary, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Use the real number</button>
              ) : (
                <p style={{ marginTop: 6, fontSize: 11.5, color: t.muted, lineHeight: 1.5 }}>Leave blank to show {props.modeControl ? 'the number for who visitors hear' : 'your real number'}. Type here for a custom one.</p>
              )}
            </div>
            <ToggleField label="Show phone number" checked={palette.showPhone} onChange={(v) => set({ showPhone: v })} theme={t} />
            <ToggleField label="Show icon" checked={palette.showIcon} onChange={(v) => set({ showIcon: v })} theme={t} />
          </div>
        </div>

        <div>
          <SectionLabel theme={t}>Colors</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ColorField label="Heading & number" value={style.headingColor} fallback={palette.heading} onChange={(v) => set({ headingColor: v })} theme={t} brand={props.brand} />
            <ColorField label="Subtitle & prompt" value={style.subTextColor} fallback={palette.muted} onChange={(v) => set({ subTextColor: v })} theme={t} brand={props.brand} />
            <ColorField label="Accent (icon + ring)" value={style.accentColor} fallback={palette.accent} onChange={(v) => set({ accentColor: v })} theme={t} brand={props.brand} />
            <ColorField label="Call button" value={style.buttonColor} fallback={palette.buttonColor} onChange={(v) => set({ buttonColor: v })} theme={t} brand={props.brand} />
            <ColorField label="Button icon" value={style.buttonIconColor} fallback={palette.buttonIcon} onChange={(v) => set({ buttonIconColor: v })} theme={t} brand={props.brand} />
            <ColorField label="Card background" value={style.cardBg} fallback={palette.cardBg} onChange={(v) => set({ cardBg: v })} theme={t} brand={props.brand} />
          </div>
        </div>

        <div>
          <SectionLabel theme={t}>Layout</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SegmentField label="Theme" value={style.theme || 'auto'} options={[{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} onChange={(v) => set({ theme: v })} theme={t} />
            <SegmentField label="Corners" value={style.radius || 'md'} options={[{ value: 'sm', label: 'Sharp' }, { value: 'md', label: 'Round' }, { value: 'lg', label: 'Soft' }]} onChange={(v) => set({ radius: v })} theme={t} />
            <SegmentField label="Size" value={style.size || 'md'} options={[{ value: 'sm', label: 'S' }, { value: 'md', label: 'M' }, { value: 'lg', label: 'L' }]} onChange={(v) => set({ size: v })} theme={t} />
            <ReorderField label="Body order (drag to reorder)" items={palette.order.map((b: WebCallBlock) => ({ id: b, label: WEBCALL_BLOCK_LABELS[b] }))} onChange={(ids) => set({ order: ids as WebCallBlock[] })} theme={t} />
          </div>
        </div>
      </PropertyPanel>

      <style>{`@media (min-width: 900px){ .wce-grid{ grid-template-columns: minmax(0,1fr) 300px !important; align-items: start; } }`}</style>
    </div>
  );
}

function regionLabel(r: WebCallRegion): string {
  switch (r) {
    case 'card': return 'Card';
    case 'icon': return 'Icon';
    case 'title': return 'Title';
    case 'subtitle': return 'Subtitle';
    case 'button': return 'Call button';
    case 'phone': return 'Phone number';
    case 'cta': return 'Prompt';
  }
}
