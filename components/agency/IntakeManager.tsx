'use client';

// ============================================================================
// IntakeManager - the agency-side intake dashboard for one client.
// Enable the structured intake, pick a template, customize its fields (the
// builder, with if-then conditions), set the owner-SMS, and see the captured
// Orders & Requests. All custom-themed, no native selects.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import {
  ClipboardList, Loader2, Check, Plus, Trash2, ChevronUp, ChevronDown, ChevronDown as Caret, Sparkles, Phone,
} from 'lucide-react';

type FieldType = 'text' | 'choice' | 'phone' | 'number' | 'datetime' | 'address';
interface IntakeField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  showIf?: { field: string; equals?: string; in?: string[] };
  hint?: string;
}
interface IntakeSchema { key?: string; label?: string; intro?: string; fields: IntakeField[]; }
interface TemplateOption { key: string; label: string; industry?: string | null; intro?: string; fields: IntakeField[]; source: string; }
interface IntakeRecord { id: string; call_id?: string; template_key?: string; data: Record<string, any>; caller_phone?: string; created_at: string; }

const TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'choice', label: 'Choice' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'datetime', label: 'Date / time' },
  { value: 'address', label: 'Address' },
];

function slugify(label: string, existing: Set<string>): string {
  let base = (label || 'field').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'field';
  let key = base; let i = 2;
  while (existing.has(key)) { key = `${base}_${i}`; i += 1; }
  return key;
}

// --- Small themed dropdown (never a native select) --------------------------
function ThemedDropdown<T extends string>({ value, options, onChange, theme, placeholder }: {
  value: T | '';
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  theme: ReturnType<typeof useTheme>;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  const current = options.find((o) => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
        style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: current ? theme.text : theme.cardTextMuted }}>
        <span className="truncate">{current ? current.label : (placeholder || 'Select')}</span>
        <Caret className="h-4 w-4 flex-shrink-0" style={{ color: theme.cardTextMuted }} />
      </button>
      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-lg overflow-hidden py-1 max-h-64 overflow-y-auto shadow-lg"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.inputBorder}` }}>
          {options.map((o) => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{ color: theme.text, backgroundColor: o.value === value ? theme.primary15 : 'transparent' }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IntakeManager({ agencyId, clientId }: { agencyId: string; clientId: string }) {
  const theme = useTheme();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [templateKey, setTemplateKey] = useState<string>('');
  const [fields, setFields] = useState<IntakeField[]>([]);
  const [intro, setIntro] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsNumber, setSmsNumber] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [records, setRecords] = useState<IntakeRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token()}` };
      const [tplRes, cfgRes, recRes] = await Promise.all([
        fetch(`${backendUrl}/api/agency/${agencyId}/intake/templates`, { headers }),
        fetch(`${backendUrl}/api/agency/${agencyId}/clients/${clientId}/intake`, { headers }),
        fetch(`${backendUrl}/api/agency/${agencyId}/clients/${clientId}/intake/records`, { headers }),
      ]);
      const tplData = tplRes.ok ? await tplRes.json() : { templates: [] };
      setTemplates(tplData.templates || []);
      if (cfgRes.ok) {
        const { intake } = await cfgRes.json();
        setEnabled(!!intake.enabled);
        setTemplateKey(intake.template_key || '');
        setSmsEnabled(!!intake.sms_enabled);
        setSmsNumber(intake.sms_number || '');
        setOwnerPhone(intake.owner_phone || '');
        if (intake.config && Array.isArray(intake.config.fields)) {
          setFields(intake.config.fields);
          setIntro(intake.config.intro || '');
        } else if (intake.template_key) {
          const t = (tplData.templates || []).find((x: TemplateOption) => x.key === intake.template_key);
          if (t) { setFields(t.fields || []); setIntro(t.intro || ''); }
        }
      }
      if (recRes.ok) { const { records: recs } = await recRes.json(); setRecords(recs || []); }
    } catch (e) {
      console.error('Failed to load intake:', e);
    } finally {
      setLoading(false);
    }
  }, [agencyId, clientId, backendUrl]);

  useEffect(() => { load(); }, [load]);

  const pickTemplate = (key: string) => {
    setTemplateKey(key);
    const t = templates.find((x) => x.key === key);
    if (t) { setFields(JSON.parse(JSON.stringify(t.fields || []))); setIntro(t.intro || ''); }
  };

  const updateField = (idx: number, patch: Partial<IntakeField>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };
  const removeField = (idx: number) => setFields((prev) => prev.filter((_, i) => i !== idx));
  const moveField = (idx: number, dir: -1 | 1) => {
    setFields((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };
  const addField = () => {
    setFields((prev) => {
      const keys = new Set(prev.map((f) => f.key));
      return [...prev, { key: slugify('new field', keys), label: 'New field', type: 'text', required: true }];
    });
  };

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      // Re-key any field whose label changed from the default so keys stay stable + unique.
      const keys = new Set<string>();
      const cleanFields = fields.map((f) => {
        let key = f.key && f.key.trim() ? f.key : slugify(f.label, keys);
        if (keys.has(key)) key = slugify(f.label, keys);
        keys.add(key);
        const out: IntakeField = { key, label: f.label.trim() || key, type: f.type, required: f.required !== false };
        if (f.type === 'choice' && f.options && f.options.length) out.options = f.options.filter(Boolean);
        if (f.hint) out.hint = f.hint;
        if (f.showIf && f.showIf.field) out.showIf = f.showIf;
        return out;
      });
      const config = { key: templateKey || 'intake', intro, fields: cleanFields };
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/clients/${clientId}/intake`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ enabled, template_key: templateKey || null, config, sms_enabled: smsEnabled, sms_number: smsNumber }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch (e) {
      console.error('Failed to save intake:', e);
    } finally {
      setSaving(false);
    }
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` };
  const inputStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text };

  if (loading) {
    return (
      <div className="rounded-xl p-6 flex items-center justify-center" style={card}>
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

  const otherFieldOptions = (idx: number) => fields.slice(0, idx).map((f) => ({ value: f.key, label: f.label }));

  return (
    <div className="rounded-xl overflow-hidden" style={card}>
      <div className="p-4 sm:p-6">
        {/* Header + enable */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" style={{ color: theme.iconColor }} />
            <div>
              <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Intake Form</h2>
              <p className="text-xs mt-0.5" style={{ color: theme.cardTextMuted }}>Capture structured orders and requests on each call, one question at a time.</p>
            </div>
          </div>
          <button type="button" role="switch" aria-checked={enabled} onClick={() => setEnabled((v) => !v)}
            className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors"
            style={{ backgroundColor: enabled ? theme.primary : theme.inputBorder }}>
            <span className="inline-block h-5 w-5 rounded-full bg-white transition-transform" style={{ transform: enabled ? 'translateX(22px)' : 'translateX(2px)' }} />
          </button>
        </div>

        {enabled && (
          <div className="mt-5 space-y-5">
            {/* Template picker */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: theme.cardTextMuted }}>Template</label>
              <ThemedDropdown
                value={templateKey as string}
                placeholder="Pick a template to start from"
                options={templates.map((t) => ({ value: t.key, label: t.source === 'agency' ? `${t.label} (yours)` : t.label }))}
                onChange={(v) => pickTemplate(v)}
                theme={theme}
              />
              <p className="text-[11px] mt-1.5" style={{ color: theme.cardTextMuted }}>Pick one, then tweak the fields below. Changes here only affect this client.</p>
            </div>

            {/* Field builder */}
            {fields.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: theme.cardTextMuted }}>What the AI collects (in order)</label>
                <div className="space-y-3">
                  {fields.map((f, idx) => (
                    <div key={idx} className="rounded-lg p-3" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col gap-1 pt-1">
                          <button type="button" onClick={() => moveField(idx, -1)} disabled={idx === 0} style={{ color: theme.cardTextMuted, opacity: idx === 0 ? 0.3 : 1 }}><ChevronUp className="h-4 w-4" /></button>
                          <button type="button" onClick={() => moveField(idx, 1)} disabled={idx === fields.length - 1} style={{ color: theme.cardTextMuted, opacity: idx === fields.length - 1 ? 0.3 : 1 }}><ChevronDown className="h-4 w-4" /></button>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input value={f.label} onChange={(e) => updateField(idx, { label: e.target.value })} placeholder="Field label"
                              className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                            <ThemedDropdown value={f.type} options={TYPE_OPTIONS} onChange={(v) => updateField(idx, { type: v })} theme={theme} />
                          </div>
                          {f.type === 'choice' && (
                            <input value={(f.options || []).join(', ')} onChange={(e) => updateField(idx, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                              placeholder="Choices, comma separated (e.g. Bulk delivery, Bagged, Tote)"
                              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                          )}
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-1.5 text-xs" style={{ color: theme.text }}>
                              <button type="button" role="switch" aria-checked={f.required !== false} onClick={() => updateField(idx, { required: f.required === false })}
                                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                                style={{ backgroundColor: f.required !== false ? theme.primary : theme.inputBorder }}>
                                <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: f.required !== false ? 'translateX(18px)' : 'translateX(2px)' }} />
                              </button>
                              Required
                            </label>
                            {idx > 0 && (
                              <div className="flex items-center gap-1.5 text-xs" style={{ color: theme.cardTextMuted }}>
                                <span>Only ask if</span>
                                <div className="w-36">
                                  <ThemedDropdown value={f.showIf?.field || ''} placeholder="(always)"
                                    options={[{ value: '', label: '(always)' }, ...otherFieldOptions(idx)]}
                                    onChange={(v) => updateField(idx, { showIf: v ? { field: v, equals: f.showIf?.equals || '' } : undefined })}
                                    theme={theme} />
                                </div>
                                {f.showIf?.field && (
                                  <>
                                    <span>is</span>
                                    <input value={f.showIf?.equals || ''} onChange={(e) => updateField(idx, { showIf: { field: f.showIf!.field, equals: e.target.value } })}
                                      placeholder="value" className="w-28 rounded-lg px-2 py-1.5 text-xs focus:outline-none" style={inputStyle} />
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button type="button" onClick={() => removeField(idx)} className="pt-1" style={{ color: theme.cardTextMuted }}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addField} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2"
                  style={{ color: theme.primary, border: `1px solid ${theme.border}` }}>
                  <Plus className="h-3.5 w-3.5" /> Add field
                </button>
              </div>
            )}

            {/* SMS to owner */}
            <div className="rounded-lg p-3" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="h-4 w-4 flex-shrink-0" style={{ color: theme.iconColor }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: theme.text }}>Text each order to the owner</p>
                    <p className="text-[11px]" style={{ color: theme.cardTextMuted }}>A clean summary of every captured order, as a text.</p>
                  </div>
                </div>
                <button type="button" role="switch" aria-checked={smsEnabled} onClick={() => setSmsEnabled((v) => !v)}
                  className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors"
                  style={{ backgroundColor: smsEnabled ? theme.primary : theme.inputBorder }}>
                  <span className="inline-block h-5 w-5 rounded-full bg-white transition-transform" style={{ transform: smsEnabled ? 'translateX(22px)' : 'translateX(2px)' }} />
                </button>
              </div>
              {smsEnabled && (
                <input value={smsNumber} onChange={(e) => setSmsNumber(e.target.value)} placeholder={ownerPhone ? `Defaults to owner (${ownerPhone})` : 'Phone number for order texts'}
                  className="mt-2 w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
              )}
            </div>

            {/* Save */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={save} disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: theme.primary, color: theme.primaryText, opacity: saving ? 0.6 : 1 }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Saving' : 'Save Intake Form'}
              </button>
              {saved && <span className="text-xs" style={{ color: theme.primary }}>Saved</span>}
            </div>
          </div>
        )}
      </div>

      {/* Captured records */}
      <div className="px-4 sm:px-6 py-4" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4" style={{ color: theme.iconColor }} />
          <h3 className="font-semibold text-sm" style={{ color: theme.text }}>Orders & Requests</h3>
          {records.length > 0 && <span className="text-xs" style={{ color: theme.cardTextMuted }}>{records.length}</span>}
        </div>
        {records.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: theme.cardTextMuted }}>No captured orders yet. They appear here after calls.</p>
        ) : (
          <div className="space-y-2.5">
            {records.map((r) => (
              <div key={r.id} className="rounded-lg p-3" style={{ backgroundColor: theme.hover, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium" style={{ color: theme.cardTextMuted }}>{new Date(r.created_at).toLocaleString()}</span>
                  {r.caller_phone && <span className="text-[11px]" style={{ color: theme.cardTextMuted }}>{r.caller_phone}</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(r.data || {}).filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '').map(([k, v]) => (
                    <div key={k} className="text-sm flex gap-1.5">
                      <span className="capitalize flex-shrink-0" style={{ color: theme.cardTextMuted }}>{k.replace(/_/g, ' ')}:</span>
                      <span style={{ color: theme.text }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
