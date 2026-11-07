'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MessageSquare, Loader2, Check, RotateCcw, Phone, Users, Eye } from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';

interface MsgVar { name: string; desc: string; }
interface MsgDef { label: string; audience: string; description: string; variables: MsgVar[]; template: string; }

// Sample values for the live preview only. These never send; they just show the
// agency roughly what a rendered message looks like. Precomputed fragments
// (for_business, recap_block, urgency_line, status_*) get representative values
// so the default copy previews correctly.
const SAMPLE: Record<string, string> = {
  agency_name: 'Acme AI', business_name: 'Joe Plumbing', brand: 'Acme AI', who: 'Joe',
  customer_name: 'Sarah Lee', customer_phone: '(555) 123-4567',
  summary: 'Wants a quote for a water heater install.',
  ai_number: '(555) 987-6543', login_url: 'https://acme.com/client/login', upgrade_url: 'acme.com/client/upgrade',
  signup_url: 'https://acme.com/get-started', trial_cta: 'Start your 7-day free trial, no credit card needed:',
  for_business: ' for Joe Plumbing', ready_suffix: ' for Joe Plumbing',
  recap_block: "Here's what we showed you:\n✅ booking jobs 24/7\n✅ Instant text summaries after every call\n✅ 24/7 coverage, never miss a call\n\n",
  urgency_line: '', caller: '(555) 000-1111', spam_reason: 'Robocall / telemarketer',
  status_headline: 'Acme AI Free Trial Started!',
  status_line: 'Hi Joe, your Pro plan free trial is active through June 1, 2026.',
  phone_line: '\n\nYour AI receptionist is answering calls 24/7 at:\n📞 (555) 987-6543',
};

function renderPreview(tpl: string, extra: Record<string, string>): string {
  const vars = { ...SAMPLE, ...extra };
  return String(tpl).replace(/\{([a-z0-9_]+)\}/gi, (m, n) => (n in vars ? vars[n] : m));
}

export default function AgencyMessagesPage() {
  const { agency } = useAgency();
  const theme = useTheme();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.myvoiceaiconnect.com';

  const [defs, setDefs] = useState<Record<string, MsgDef>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [initialOverrides, setInitialOverrides] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agency?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load messages');
        const data = await res.json();
        const d: Record<string, MsgDef> = (data.agency && data.agency.message_defs) || {};
        const ov: Record<string, string> = (data.agency && data.agency.message_overrides) || {};
        if (cancelled) return;
        const keys = Object.keys(d);
        const defs2: Record<string, string> = {};
        const vals: Record<string, string> = {};
        for (const k of keys) {
          defs2[k] = d[k].template;
          vals[k] = (typeof ov[k] === 'string' && ov[k].trim()) ? ov[k] : d[k].template;
        }
        setDefs(d); setOrder(keys); setDefaults(defs2); setInitialOverrides(ov || {}); setValues(vals);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load messages');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [agency?.id, backendUrl]);

  // The override set we would save: a key is an override only when its editor
  // content is non-blank AND differs from the shipped default (so "same as
  // default" or blank cleanly falls back to the default at send time).
  const currentOverrides = useMemo(() => {
    const out: Record<string, string> = {};
    for (const k of order) {
      const v = (values[k] || '').trim();
      if (v && v !== (defaults[k] || '').trim()) out[k] = values[k];
    }
    return out;
  }, [values, defaults, order]);

  const dirty = useMemo(() => {
    const a = JSON.stringify(currentOverrides);
    const b = JSON.stringify(
      Object.fromEntries(Object.entries(initialOverrides).filter(([, v]) => typeof v === 'string' && v.trim()))
    );
    return a !== b;
  }, [currentOverrides, initialOverrides]);

  const save = async () => {
    if (!agency?.id || !dirty) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message_overrides: currentOverrides }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to save'); }
      setInitialOverrides(currentOverrides);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const groups: { key: string; label: string; icon: any; note?: React.ReactNode }[] = [
    {
      key: 'prospect', label: 'To prospects', icon: Phone,
      note: (
        <>The signup link inside the post-demo text is set on the{' '}
          <Link href="/agency/demo-phone" className="underline" style={{ color: theme.primary }}>Demo Phone</Link> page.</>
      ),
    },
    { key: 'client', label: 'To clients', icon: Users },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <MessageSquare className="h-5 w-5" style={{ color: theme.iconColor }} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: theme.text }}>Messages</h1>
          <p className="mt-0.5 text-sm" style={{ color: theme.textMuted }}>Customize the automated texts your agency sends. Blank falls back to the default.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.iconColor }} /></div>
      ) : order.length === 0 ? (
        <p className="text-sm py-10" style={{ color: theme.textMuted }}>No messages available.</p>
      ) : (
        <>
          {groups.map((group) => {
            const keys = order.filter((k) => defs[k]?.audience === group.key);
            if (!keys.length) return null;
            const GroupIcon = group.icon;
            return (
              <div key={group.key} className="mt-6">
                <div className="flex items-center gap-2 mb-1">
                  <GroupIcon className="h-4 w-4" style={{ color: theme.iconColor }} />
                  <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.textMuted }}>{group.label}</h2>
                </div>
                {group.note && <p className="text-xs mb-3" style={{ color: theme.textMuted }}>{group.note}</p>}
                <div className="space-y-4">
                  {keys.map((k) => {
                    const def = defs[k];
                    const isOverridden = (values[k] || '').trim() && (values[k] || '').trim() !== (defaults[k] || '').trim();
                    return (
                      <div key={k} className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                        <div className="p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>{def.label}</h3>
                              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{def.description}</p>
                            </div>
                            {isOverridden ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.primary15, color: theme.primary }}>Custom</span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Default</span>
                            )}
                          </div>

                          <textarea
                            value={values[k] ?? ''}
                            onChange={(e) => { setValues((p) => ({ ...p, [k]: e.target.value })); setSaved(false); }}
                            rows={Math.min(14, Math.max(4, (values[k] || '').split('\n').length + 1))}
                            spellCheck={false}
                            className="mt-3 w-full rounded-lg px-3 py-2.5 text-sm font-mono leading-relaxed resize-y focus:outline-none"
                            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                          />

                          {/* Variables */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px]" style={{ color: theme.textMuted }}>Variables:</span>
                            {def.variables.map((v) => (
                              <button
                                key={v.name}
                                type="button"
                                title={v.desc}
                                onClick={() => { setValues((p) => ({ ...p, [k]: (p[k] || '') + `{${v.name}}` })); setSaved(false); }}
                                className="text-[11px] font-mono px-1.5 py-0.5 rounded transition-colors"
                                style={{ backgroundColor: theme.hover, color: theme.text, border: `1px solid ${theme.border}` }}
                              >{`{${v.name}}`}</button>
                            ))}
                          </div>

                          {/* Preview */}
                          <div className="mt-3 rounded-lg p-3" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Eye className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
                              <span className="text-[11px] font-medium" style={{ color: theme.textMuted }}>Preview</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap" style={{ color: theme.text }}>{renderPreview(values[k] || '', {})}</p>
                          </div>

                          {isOverridden && (
                            <button
                              type="button"
                              onClick={() => { setValues((p) => ({ ...p, [k]: defaults[k] })); setSaved(false); }}
                              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                              style={{ color: theme.textMuted }}
                            ><RotateCcw className="h-3.5 w-3.5" />Reset to default</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {error && <p className="mt-4 text-sm" style={{ color: theme.error || '#ef4444' }}>{error}</p>}

          {/* Sticky save bar */}
          <div className="sticky bottom-0 mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-end gap-3" style={{ backgroundColor: theme.bg, borderTop: `1px solid ${theme.border}` }}>
            {dirty && <span className="text-xs" style={{ color: theme.textMuted }}>Unsaved changes</span>}
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
