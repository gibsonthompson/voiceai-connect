'use client';

// ============================================================================
// IndustryGating, the agency's control over which industries a client can pick
// at signup. Rendered in BOTH the pricing settings and the AI Lab; both read
// and write the same agencies.allowed_industries field via PUT /settings, so
// they stay in sync (saving in one updates the shared agency context the other
// reads). Pro and up only.
//
// Semantics of allowed_industries (server-normalized):
//   null / []  -> all industries available (default)
//   N keys     -> only those appear in the signup picker
//   exactly 1  -> fully vertical: the signup industry step is hidden and that
//                 industry is auto-assigned and provisioned
// Keys may be built-in industry values or the agency's own custom_<slug> keys.
// ============================================================================

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Check, Loader2, Info, Store, Lock, Layers } from 'lucide-react';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';
import { SELECTABLE_INDUSTRIES } from '@/lib/industries';

interface Opt { value: string; label: string; custom?: boolean }

export default function IndustryGating() {
  const { agency, effectivePlan, refreshAgency } = useAgency();
  const theme = useTheme();
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const isPro = effectivePlan !== 'free';

  const customs: { key: string; label: string }[] = Array.isArray((agency as any)?.custom_industries) ? (agency as any).custom_industries : [];
  const savedAllowed: string[] = Array.isArray((agency as any)?.allowed_industries) ? (agency as any).allowed_industries : [];

  const options: Opt[] = useMemo(() => ([
    ...SELECTABLE_INDUSTRIES.map((o) => ({ value: o.value, label: o.label })),
    ...customs.map((c) => ({ value: c.key, label: c.label, custom: true })),
  ]), [customs]);

  const [mode, setMode] = useState<'all' | 'limit'>(savedAllowed.length ? 'limit' : 'all');
  const [selected, setSelected] = useState<Set<string>>(new Set(savedAllowed));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  // Re-sync if the shared agency context changes (e.g. saved from the other page).
  const savedKey = JSON.stringify(savedAllowed);
  useEffect(() => {
    setMode(savedAllowed.length ? 'limit' : 'all');
    setSelected(new Set(savedAllowed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  const toggle = (v: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(v)) n.delete(v); else n.add(v); return n; });

  const single = mode === 'limit' && selected.size === 1;
  const singleLabel = single ? (options.find((o) => o.value === [...selected][0])?.label || [...selected][0]) : '';

  const dirty = useMemo(() => {
    const now = mode === 'all' ? [] : [...selected].sort();
    const was = [...savedAllowed].sort();
    return JSON.stringify(now) !== JSON.stringify(was);
  }, [mode, selected, savedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async () => {
    if (!agency) return;
    if (mode === 'limit' && selected.size === 0) { setErr('Pick at least one industry, or choose Allow all.'); return; }
    setSaving(true); setErr('');
    const payload = mode === 'all' ? null : [...selected];
    try {
      const token = localStorage.getItem('auth_token') || '';
      const res = await fetch(`${api}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ allowed_industries: payload }),
      });
      if (!res.ok) throw new Error('save failed');
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      await refreshAgency();
    } catch {
      setErr('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }, [agency, api, mode, selected, refreshAgency]);

  if (!agency) return null;

  const Header = (
    <div className="flex items-center gap-2 mb-1">
      <Store className="h-4 w-4" style={{ color: theme.primary }} />
      <h4 className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>Industries you sell to</h4>
    </div>
  );

  // Pro+ gate.
  if (!isPro) {
    return (
      <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
        {Header}
        <p className="text-[11px] sm:text-xs mb-3" style={{ color: theme.textMuted }}>
          Limit which industries clients can choose at signup, or lock your agency to a single vertical.
        </p>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ background: theme.primary15, color: theme.text }}>
          <Lock className="h-4 w-4 shrink-0" style={{ color: theme.primary }} />
          <span>Available on <strong>Pro</strong> and up. Upgrade to gate your signup by industry.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
      {Header}
      <p className="text-[11px] sm:text-xs mb-3" style={{ color: theme.textMuted }}>
        Control which industries a client can pick when they sign up on your site.
      </p>

      {/* Help / explainer */}
      <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-4 text-xs leading-relaxed" style={{ background: theme.primary15, color: theme.text }}>
        <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: theme.primary }} />
        <div>
          <span className="font-medium">Allow all</span> offers every industry. <span className="font-medium">Limit</span> shows only the ones you choose. Pick exactly <span className="font-medium">one</span> to run a fully vertical agency, the industry step disappears from signup and every client is set up for that vertical automatically.
        </div>
      </div>

      {/* Mode toggle */}
      <div className="inline-flex rounded-lg p-0.5 mb-4" style={{ background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        {([['all', 'Allow all'], ['limit', 'Limit to selected']] as const).map(([m, label]) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={mode === m ? { background: theme.card, color: theme.text, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { background: 'transparent', color: theme.textMuted }}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'limit' && (
        <>
          {single && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3 text-xs" style={{ background: theme.primary15, color: theme.text }}>
              <Layers className="h-3.5 w-3.5 shrink-0" style={{ color: theme.primary }} />
              <span>Fully vertical: clients skip the industry step and are all set up as <strong>{singleLabel}</strong>.</span>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {options.map((o) => {
              const on = selected.has(o.value);
              return (
                <button key={o.value} type="button" onClick={() => toggle(o.value)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
                  style={{ background: on ? theme.primary15 : theme.card, border: `1px solid ${on ? theme.primary : theme.inputBorder}`, color: theme.text }}>
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded" style={{ background: on ? theme.primary : 'transparent', border: `1px solid ${on ? theme.primary : theme.inputBorder}` }}>
                    {on && <Check className="h-3 w-3" style={{ color: theme.primaryText }} />}
                  </span>
                  <span className="truncate flex-1">{o.label}</span>
                  {o.custom && <span className="text-[9px] font-semibold px-1 py-0.5 rounded-full shrink-0" style={{ background: theme.isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', color: theme.textMuted }}>Custom</span>}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] mt-2.5" style={{ color: theme.textMuted }}>
            {selected.size === 0 ? 'None selected yet.' : `${selected.size} selected.`} Your own custom verticals from the AI Lab show up here too.
          </p>
        </>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button type="button" onClick={save} disabled={saving || !dirty}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40" style={{ background: theme.primary, color: theme.primaryText }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          {saved ? 'Saved' : 'Save'}
        </button>
        {err && <span className="text-xs" style={{ color: '#dc2626' }}>{err}</span>}
      </div>
    </div>
  );
}
