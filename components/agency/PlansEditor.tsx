'use client';

// ============================================================================
// PlansEditor — dynamic, any-count plan editor (Path B).
// Bound to the agency's `plans` array (UI shape below). Handles add / remove /
// reorder / rename / show-hide / price / limit (+unlimited) / setup fee / per-
// plan feature toggles / description. Emits the UI-shape list up via setPlans;
// settings.tsx converts to the API shape (cents, key handling) on save.
// ============================================================================

import { Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      {plans.map((p, idx) => (
        <div key={p._uid} className="rounded-2xl p-4 sm:p-5"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, opacity: p.visible ? 1 : 0.7 }}>
          {/* Card header: name + visibility + reorder + remove */}
          <div className="flex items-center gap-2 mb-4">
            <GripVertical className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
            <input value={p.name} onChange={(e) => update(p._uid, { name: e.target.value })} placeholder="Plan name"
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm font-medium" style={inputStyle} />
            <button type="button" onClick={() => update(p._uid, { visible: !p.visible })}
              title={p.visible ? 'Shown on your site' : 'Hidden from your site'}
              className="flex items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium flex-shrink-0"
              style={{ color: p.visible ? theme.primary : theme.textMuted, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
              {p.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{p.visible ? 'Visible' : 'Hidden'}</span>
            </button>
            <div className="flex flex-col flex-shrink-0">
              <button type="button" onClick={() => move(p._uid, -1)} disabled={idx === 0} className="disabled:opacity-30" style={{ color: theme.textMuted }}><ChevronUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(p._uid, 1)} disabled={idx === plans.length - 1} className="disabled:opacity-30" style={{ color: theme.textMuted }}><ChevronDown className="h-4 w-4" /></button>
            </div>
            <button type="button" onClick={() => remove(p._uid)} disabled={plans.length <= 1}
              title={plans.length <= 1 ? 'You need at least one plan' : 'Remove plan'}
              className="rounded-lg p-2 flex-shrink-0 disabled:opacity-30" style={{ color: theme.textMuted }}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Price / Calls / Minutes */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Price ($/mo)</label>
              <input type="number" min="0" value={p.price} onChange={(e) => update(p._uid, { price: e.target.value })}
                placeholder="—" className="w-full rounded-xl px-3 py-2 text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Calls/mo</label>
              {p.unlimited ? (
                <div className="w-full rounded-xl px-3 py-2 text-sm font-medium flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}>Unlimited</div>
              ) : (
                <input type="number" min="1" value={p.call_limit} onChange={(e) => update(p._uid, { call_limit: e.target.value })}
                  className="w-full rounded-xl px-3 py-2 text-sm" style={inputStyle} />
              )}
              <button type="button" onClick={() => update(p._uid, { unlimited: !p.unlimited })}
                className="mt-1.5 text-[10px] sm:text-xs" style={{ color: p.unlimited ? theme.primary : theme.textMuted }}>
                {p.unlimited ? '✓ Unlimited' : 'Set unlimited'}
              </button>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Incl. min/mo</label>
              <input type="number" min="0" value={p.included_minutes} onChange={(e) => update(p._uid, { included_minutes: e.target.value })}
                className="w-full rounded-xl px-3 py-2 text-sm" style={inputStyle} />
              <p className="mt-1.5 text-[10px]" style={{ color: theme.textMuted }}>0 = per-minute from first min</p>
            </div>
          </div>

          {/* Description (the card tagline) */}
          <div className="mb-4">
            <label className="block text-[10px] sm:text-xs mb-1" style={{ color: theme.textMuted }}>Plan tagline (blank = none)</label>
            <input value={p.description} onChange={(e) => update(p._uid, { description: e.target.value })}
              placeholder="e.g. Great for solo operators" className="w-full rounded-xl px-3 py-2 text-sm" style={inputStyle} />
          </div>

          {/* Setup fee */}
          <div className="rounded-lg px-3 py-2.5 mb-4" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            <div className="flex items-center justify-between">
              <label className="text-[10px] sm:text-xs font-medium" style={{ color: theme.textMuted }}>One-time setup fee</label>
              <Switch on={p.setupOn} onClick={() => update(p._uid, { setupOn: !p.setupOn })} label="Charge a setup fee" />
            </div>
            {p.setupOn && (
              <input type="number" min="0" value={p.setupFee} onChange={(e) => update(p._uid, { setupFee: e.target.value })}
                placeholder="0" className="w-full rounded-xl px-3 py-2 text-sm mt-2" style={inputStyle} />
            )}
          </div>

          {/* Features */}
          <div className="rounded-lg px-3 py-1" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            <p className="text-[10px] sm:text-xs font-medium py-2" style={{ color: theme.textMuted }}>Included Features</p>
            <div className="divide-y" style={{ borderColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
              {featureKeys.map((fk) => (
                <div key={fk} className="flex items-center justify-between py-2">
                  <span className="text-xs" style={{ color: theme.text }}>{featureLabels[fk] || fk}</span>
                  <Switch on={!!p.features[fk]} onClick={() => toggleFeature(p._uid, fk)} label={featureLabels[fk] || fk} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {plans.length < maxPlans && (
        <button type="button" onClick={add}
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
          style={{ border: `1px dashed ${theme.inputBorder}`, color: theme.primary, backgroundColor: 'transparent' }}>
          <Plus className="h-4 w-4" /> Add a plan
        </button>
      )}
    </div>
  );
}