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
          cta={<InlineText value={props.cta} placeholder="Tap to call and talk to the AI. Allow your mic when asked." maxLength={160} multiline onCommit={(v) => props.onCommitText({ cta: v })} ariaLabel="Widget prompt" style={{ color: palette.muted }} />}
          phone={<span>{phoneDisplay}</span>}
        />
      </div>

      {/* Property panel for the selected part */}
      <PropertyPanel title={selected ? regionLabel(selected) : 'Widget style'} theme={t} onClose={selected ? () => setSelected(null) : undefined}>
        {renderControls(selected, style, palette, set, t, props.brand)}
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

function renderControls(
  region: WebCallRegion | null,
  style: WebCallStyle,
  palette: ReturnType<typeof resolveWebCallPalette>,
  set: (patch: Partial<WebCallStyle>) => void,
  t: EditorTheme,
  brand?: BrandColors,
): React.ReactNode {
  const orderItems = palette.order.map((b: WebCallBlock) => ({ id: b, label: WEBCALL_BLOCK_LABELS[b] }));

  switch (region) {
    case 'icon':
      return (<>
        <ToggleField label="Show icon" checked={palette.showIcon} onChange={(v) => set({ showIcon: v })} theme={t} />
        <ColorField label="Accent (icon + ring)" value={style.accentColor} fallback={palette.accent} onChange={(v) => set({ accentColor: v })} theme={t} brand={brand} />
      </>);
    case 'title':
      return <ColorField label="Title color" value={style.headingColor} fallback={palette.heading} onChange={(v) => set({ headingColor: v })} theme={t} brand={brand} />;
    case 'subtitle':
      return <ColorField label="Subtitle color" value={style.subTextColor} fallback={palette.muted} onChange={(v) => set({ subTextColor: v })} theme={t} brand={brand} />;
    case 'button':
      return (<>
        <ColorField label="Button color" value={style.buttonColor} fallback={palette.buttonColor} onChange={(v) => set({ buttonColor: v })} theme={t} brand={brand} />
        <ColorField label="Button icon color" value={style.buttonIconColor} fallback={palette.buttonIcon} onChange={(v) => set({ buttonIconColor: v })} theme={t} brand={brand} />
      </>);
    case 'phone':
      return (<>
        <ToggleField label="Show phone number" checked={palette.showPhone} onChange={(v) => set({ showPhone: v })} theme={t} />
        <ColorField label="Number color" value={style.headingColor} fallback={palette.heading} onChange={(v) => set({ headingColor: v })} theme={t} brand={brand} />
      </>);
    case 'cta':
      return <ColorField label="Prompt color" value={style.subTextColor} fallback={palette.muted} onChange={(v) => set({ subTextColor: v })} theme={t} brand={brand} />;
    case 'card':
    default:
      return (<>
        <SegmentField label="Theme" value={style.theme || 'auto'} options={[{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} onChange={(v) => set({ theme: v })} theme={t} />
        <ColorField label="Card background" value={style.cardBg} fallback={palette.cardBg} onChange={(v) => set({ cardBg: v })} theme={t} brand={brand} />
        <SegmentField label="Corners" value={style.radius || 'md'} options={[{ value: 'sm', label: 'Sharp' }, { value: 'md', label: 'Round' }, { value: 'lg', label: 'Soft' }]} onChange={(v) => set({ radius: v })} theme={t} />
        <SegmentField label="Size" value={style.size || 'md'} options={[{ value: 'sm', label: 'S' }, { value: 'md', label: 'M' }, { value: 'lg', label: 'L' }]} onChange={(v) => set({ size: v })} theme={t} />
        <ReorderField label="Body order (drag to reorder)" items={orderItems} onChange={(ids) => set({ order: ids as WebCallBlock[] })} theme={t} />
      </>);
  }
}
