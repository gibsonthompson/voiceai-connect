'use client';

// ============================================================================
// PlansEditor — dynamic, any-count plan editor (Path B).
// Side-by-side MATRIX layout: each plan is a COLUMN (name / price / calls /
// minutes / tagline / setup fee / visibility / reorder / delete), and the
// toggleable features are ROWS with one switch per plan. This lets you compare
// and flip a feature across every plan in a single row without scrolling back
// and forth. The whole matrix scrolls horizontally on narrow screens and the
// feature-label column stays pinned on the left, so it stays usable on mobile.
// Emits the UI-shape list up via setPlans; settings.tsx converts to the API
// shape (cents, key handling) on save.
// ============================================================================

import { Fragment } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Eye, EyeOff, Infinity as InfinityIcon } from 'lucide-react';

// UI shape of a plan (dollars as strings for editing; converted to cents on save)
export interface UiPlan {
  _uid: string;          // stable client-only id for React keys + reorder
  key: string;           // API key; '' for a not-yet-saved new plan
  name: string;
  price: string;         // dollars, '' = no price
  call_limit: string;    // integer string
  unlimited: boolean;
  description: string;
  setupOn: boolean;
  setupFee: string;      // dollars, '' = none
  included_minutes: string;
  features: Record<string, boolean>;
  visible: boolean;
}

export interface PlansEditorTheme {
  text: string;
  textMuted: string;
  input: string;
  inputBorder: string;
  primary: string;
  isDark: boolean;
  card: string;
  cardBorder: string;
}

interface Props {
  plans: UiPlan[];
  setPlans: (updater: (prev: UiPlan[]) => UiPlan[]) => void;
  theme: PlansEditorTheme;
  featureKeys: string[];              // ordered feature keys to expose as toggles
  featureLabels: Record<string, string>;
  maxPlans?: number;                  // default 12 (matches backend)
}

function newUid() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function makeEmptyPlan(): UiPlan {
  return {
    _uid: newUid(),
    key: '',
    name: '',
    price: '',
    call_limit: '50',
    unlimited: false,
    description: '',
    setupOn: false,
    setupFee: '',
    included_minutes: '0',
    features: {},
    visible: true,
  };
}

export default function PlansEditor({ plans, setPlans, theme, featureKeys, featureLabels, maxPlans = 12 }: Props) {
  const update = (uid: string, patch: Partial<UiPlan>) =>
    setPlans((prev) => prev.map((p) => (p._uid === uid ? { ...p, ...patch } : p)));

  const remove = (uid: string) =>
    setPlans((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p._uid !== uid)));

  const move = (uid: string, dir: -1 | 1) =>
    setPlans((prev) => {
      const i = prev.findIndex((p) => p._uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const add = () =>
    setPlans((prev) => (prev.length >= maxPlans ? prev : [...prev, makeEmptyPlan()]));

  const toggleFeature = (uid: string, fk: string) =>
    setPlans((prev) =>
      prev.map((p) => (p._uid === uid ? { ...p, features: { ...p.features, [fk]: !p.features[fk] } } : p))
    );

  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.isDark ? '#050505' : '#f9fafb',
    border: `1px solid ${theme.inputBorder}`,
    color: theme.text,
  };

  const Switch = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} title={label}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
      style={{ backgroundColor: on ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') }}>
      <span className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
        style={{ transform: on ? 'translateX(19px)' : 'translateX(3px)' }} />
    </button>
  );

  // Grid: pinned label column + one min-190px column per plan. minmax lets plans
  // share space when they fit and forces horizontal scroll when they don't.
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `minmax(140px, 180px) repeat(${plans.length}, minmax(190px, 1fr))`,
    minWidth: 'min-content',
  };
  // The label column is sticky so feature names stay visible while scrolling.
  const stickyLabel: React.CSSProperties = { position: 'sticky', left: 0, zIndex: 1, backgroundColor: theme.card };
  const planCell = (visible: boolean): React.CSSProperties => ({
    backgroundColor: theme.card,
    borderLeft: `1px solid ${theme.cardBorder}`,
    borderRight: `1px solid ${theme.cardBorder}`,
    borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
    opacity: visible ? 1 : 0.6,
  });

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div style={gridStyle}>
          {/* ── Header band: spacer + each plan's config column ── */}
          <div style={{ ...stickyLabel }} className="p-3 flex items-end">
            <p className="text-[11px] leading-snug" style={{ color: theme.textMuted }}>
              Set up each plan, then toggle its features in the rows below.
            </p>
          </div>
          {plans.map((p, idx) => (
            <div key={p._uid} className="p-3 rounded-t-xl"
              style={{ backgroundColor: theme.card, borderLeft: `1px solid ${theme.cardBorder}`, borderRight: `1px solid ${theme.cardBorder}`, borderTop: `1px solid ${theme.cardBorder}`, opacity: p.visible ? 1 : 0.6 }}>
              <input value={p.name} onChange={(e) => update(p._uid, { name: e.target.value })} placeholder="Plan name"
                className="w-full min-w-0 rounded-lg px-2 py-1.5 text-sm font-medium mb-2" style={inputStyle} />

              <div className="flex items-center gap-1 mb-3">
                <button type="button" onClick={() => update(p._uid, { visible: !p.visible })}
                  title={p.visible ? 'Shown on your site' : 'Hidden from your site'}
                  className="flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-[10px] font-medium"
                  style={{ color: p.visible ? theme.primary : theme.textMuted, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                  {p.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {p.visible ? 'Visible' : 'Hidden'}
                </button>
                <div className="flex-1" />
                <button type="button" onClick={() => move(p._uid, -1)} disabled={idx === 0} title="Move left" className="disabled:opacity-30 p-1" style={{ color: theme.textMuted }}><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(p._uid, 1)} disabled={idx === plans.length - 1} title="Move right" className="disabled:opacity-30 p-1" style={{ color: theme.textMuted }}><ChevronRight className="h-4 w-4" /></button>
                <button type="button" onClick={() => remove(p._uid)} disabled={plans.length <= 1}
                  title={plans.length <= 1 ? 'You need at least one plan' : 'Remove plan'}
                  className="p-1 disabled:opacity-30" style={{ color: theme.textMuted }}><Trash2 className="h-4 w-4" /></button>
              </div>

              <label className="block text-[10px] mb-1" style={{ color: theme.textMuted }}>Price ($/mo)</label>
              <input type="number" min="0" value={p.price} onChange={(e) => update(p._uid, { price: e.target.value })}
                placeholder="—" className="w-full rounded-lg px-2 py-1.5 text-sm mb-2.5" style={inputStyle} />

              <label className="block text-[10px] mb-1" style={{ color: theme.textMuted }}>Calls / mo</label>
              {p.unlimited ? (
                <button type="button" onClick={() => update(p._uid, { unlimited: false })}
                  title="Click to set a specific number instead"
                  className="w-full rounded-lg px-2 py-1.5 text-sm font-semibold flex items-center justify-center gap-1.5 mb-2.5"
                  style={{ backgroundColor: `${theme.primary}18`, color: theme.primary, border: `1px solid ${theme.primary}40` }}>
                  <InfinityIcon className="h-4 w-4" /> Unlimited
                </button>
              ) : (
                <div className="flex items-center gap-1 mb-2.5">
                  <input type="number" min="1" value={p.call_limit} onChange={(e) => update(p._uid, { call_limit: e.target.value })}
                    className="flex-1 min-w-0 rounded-lg px-2 py-1.5 text-sm" style={inputStyle} />
                  <button type="button" onClick={() => update(p._uid, { unlimited: true })} title="Set to unlimited"
                    className="rounded-lg px-2 py-1.5 flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${theme.primary}12`, color: theme.primary, border: `1px solid ${theme.primary}30` }}>
                    <InfinityIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              <label className="block text-[10px] mb-1" style={{ color: theme.textMuted }}>Included min / mo</label>
              <input type="number" min="0" value={p.included_minutes} onChange={(e) => update(p._uid, { included_minutes: e.target.value })}
                className="w-full rounded-lg px-2 py-1.5 text-sm" style={inputStyle} />
              <p className="mt-1 mb-2.5 text-[9px] leading-tight" style={{ color: theme.textMuted }}>0 = per-minute from first minute</p>

              <label className="block text-[10px] mb-1" style={{ color: theme.textMuted }}>Tagline (blank = none)</label>
              <input value={p.description} onChange={(e) => update(p._uid, { description: e.target.value })}
                placeholder="e.g. Great for solo operators" className="w-full rounded-lg px-2 py-1.5 text-sm mb-3" style={inputStyle} />

              <div className="rounded-lg px-2 py-2" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium" style={{ color: theme.textMuted }}>One-time setup fee</label>
                  <Switch on={p.setupOn} onClick={() => update(p._uid, { setupOn: !p.setupOn })} label="Charge a setup fee" />
                </div>
                {p.setupOn && (
                  <input type="number" min="0" value={p.setupFee} onChange={(e) => update(p._uid, { setupFee: e.target.value })}
                    placeholder="0" className="w-full rounded-lg px-2 py-1.5 text-sm mt-2" style={inputStyle} />
                )}
              </div>
            </div>
          ))}

          {/* ── Feature rows: pinned label + a switch under each plan ── */}
          <div style={{ ...stickyLabel }} className="px-3 pt-3 pb-1 flex items-end">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.textMuted }}>Features</p>
          </div>
          {plans.map((p) => (
            <div key={p._uid} className="pt-3 pb-1" style={planCell(p.visible)} />
          ))}

          {featureKeys.map((fk) => (
            <Fragment key={fk}>
              <div style={{ ...stickyLabel }} className="px-3 py-2.5 flex items-center">
                <span className="text-xs" style={{ color: theme.text }}>{featureLabels[fk] || fk}</span>
              </div>
              {plans.map((p) => (
                <div key={p._uid} className="px-3 py-2.5 flex items-center justify-center" style={planCell(p.visible)}>
                  <Switch on={!!p.features[fk]} onClick={() => toggleFeature(p._uid, fk)} label={featureLabels[fk] || fk} />
                </div>
              ))}
            </Fragment>
          ))}

          {/* ── Closing row: rounds off + bottom-borders each plan column ── */}
          <div style={{ ...stickyLabel }} className="h-2.5" />
          {plans.map((p) => (
            <div key={p._uid} className="h-2.5 rounded-b-xl"
              style={{ backgroundColor: theme.card, borderLeft: `1px solid ${theme.cardBorder}`, borderRight: `1px solid ${theme.cardBorder}`, borderBottom: `1px solid ${theme.cardBorder}`, borderTop: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, opacity: p.visible ? 1 : 0.6 }} />
          ))}
        </div>
      </div>

      {plans.length < maxPlans && (
        <button type="button" onClick={add}
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors mt-3"
          style={{ border: `1px dashed ${theme.inputBorder}`, color: theme.primary, backgroundColor: 'transparent' }}>
          <Plus className="h-4 w-4" /> Add a plan
        </button>
      )}
    </div>
  );
}