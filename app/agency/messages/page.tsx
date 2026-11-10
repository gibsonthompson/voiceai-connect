'use client';

import { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Loader2, Check } from 'lucide-react';
import { useAgency } from '../context';
import { useTheme } from '@/hooks/useTheme';
import MessageEditor, { MsgDef } from '@/components/agency/MessageEditor';

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
        const res = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, { headers: { Authorization: `Bearer ${token}` } });
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

  // The post-demo (prospect) message is edited on the Demo Phone page. Everything
  // the agency sends to its CLIENTS lives here.
  const clientKeys = useMemo(() => order.filter((k) => defs[k]?.audience === 'client'), [order, defs]);

  // What we'd save. Built from ALL keys (not just the ones shown) so the
  // post-demo override set on the Demo Phone page is preserved untouched. A key
  // counts as an override only when non-blank and different from the default.
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
    const b = JSON.stringify(Object.fromEntries(Object.entries(initialOverrides).filter(([, v]) => typeof v === 'string' && v.trim())));
    return a !== b;
  }, [currentOverrides, initialOverrides]);

  const save = async () => {
    if (!agency?.id || !dirty) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message_overrides: currentOverrides }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to save'); }
      setInitialOverrides(currentOverrides);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <MessageSquare className="h-5 w-5" style={{ color: theme.iconColor }} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: theme.text }}>Messages</h1>
          <p className="mt-0.5 text-sm" style={{ color: theme.cardTextMuted }}>The automated texts you send to your clients. Edit any of them, or leave them on the default.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.iconColor }} /></div>
      ) : clientKeys.length === 0 ? (
        <p className="text-sm py-10" style={{ color: theme.cardTextMuted }}>No messages available.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start pb-24">
            {clientKeys.map((k) => (
              <MessageEditor
                key={k}
                def={defs[k]}
                value={values[k] ?? ''}
                onChange={(v) => { setValues((p) => ({ ...p, [k]: v })); setSaved(false); }}
                theme={theme}
                agencyName={agency?.name || ''}
              />
            ))}
          </div>

          {error && <p className="text-sm mb-3" style={{ color: theme.error || '#ef4444' }}>{error}</p>}

          <div className="fixed bottom-0 right-0 left-0 lg:left-64 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-end gap-3 z-20" style={{ backgroundColor: theme.bg, borderTop: `1px solid ${theme.border}` }}>
            {dirty && <span className="text-xs" style={{ color: theme.cardTextMuted }}>Unsaved changes</span>}
            <button onClick={save} disabled={saving || !dirty} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
