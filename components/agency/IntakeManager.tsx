'use client';

// ============================================================================
// IntakeManager - the shared intake dashboard, used on BOTH the agency's client
// detail page and the business owner's own client login. One builder, two
// surfaces. Props drive the API endpoints, the theme, and the capabilities:
//   isAgency: full control + lock toggle + reusable-template management.
//   client (default): edits its own form unless the agency LOCKED it; always
//   owns its SMS destination and sees its captured Orders & Requests.
// Theme-agnostic (takes the theme object as a prop) so it works with the agency
// theme and the client-branded theme alike. No native selects.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClipboardList, Loader2, Check, Plus, Trash2, ChevronUp, ChevronDown, ChevronDown as Caret, Sparkles, Phone, Lock, Save, BookmarkPlus,
} from 'lucide-react';

type FieldType = 'text' | 'choice' | 'phone' | 'number' | 'datetime' | 'address';
interface IntakeField {
  key: string; label: string; type: FieldType;
  options?: string[]; required?: boolean; hint?: string;
  showIf?: { field: string; equals?: string; in?: string[] };
}
interface TemplateOption { key: string; id?: string; label: string; industry?: string | null; intro?: string; fields: IntakeField[]; source: string; }
interface IntakeRecord { id: string; call_id?: string; template_key?: string; data: Record<string, any>; caller_phone?: string; created_at: string; }

interface IntakeManagerProps {
  theme: any;
  configUrl: string;         // GET + PUT the intake config
  recordsUrl: string;        // GET records
  templatesUrl: string;      // GET templates (platform + agency)
  isAgency?: boolean;        // agency capabilities
  templateCrudBase?: string; // agency only: POST / DELETE :id for reusable templates
  enableControl?: boolean;   // show the on/off toggle. false on the client Orders tab, where the toggle lives on My Business and the tab only renders when already on.
}

const TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'choice', label: 'Choice' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'datetime', label: 'Date / time' },
  { value: 'address', label: 'Address' },
];

function slugify(label: string, existing: Set<string>): string {
  const base = (label || 'field').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'field';
  let key = base; let i = 2;
  while (existing.has(key)) { key = `${base}_${i}`; i += 1; }
  return key;
}

// Normalize either theme (agency useTheme or client useClientTheme) to one token set.
function tokens(theme: any) {
  return {
    text: theme.text, card: theme.card, border: theme.border,
    muted: theme.cardTextMuted || theme.textMuted || '#6b7280',
    primary: theme.primary, primaryText: theme.primaryText || '#ffffff',
    primary15: theme.primary15 || 'rgba(0,0,0,0.06)',
    input: theme.input || theme.card, inputBorder: theme.inputBorder || theme.border,
    hover: theme.hover || theme.card, icon: theme.iconColor || theme.primary,
  };
}

function ThemedDropdown<T extends string>({ value, options, onChange, t, placeholder, disabled }: {
  value: T | ''; options: { value: T; label: string }[]; onChange: (v: T) => void; t: ReturnType<typeof tokens>; placeholder?: string; disabled?: boolean;
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
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
        style={{ backgroundColor: t.input, border: `1px solid ${t.inputBorder}`, color: current ? t.text : t.muted, opacity: disabled ? 0.6 : 1 }}>
        <span className="truncate">{current ? current.label : (placeholder || 'Select')}</span>
        <Caret className="h-4 w-4 flex-shrink-0" style={{ color: t.muted }} />
      </button>
      {open && !disabled && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-lg overflow-hidden py-1 max-h-64 overflow-y-auto shadow-lg" style={{ backgroundColor: t.card, border: `1px solid ${t.inputBorder}` }}>
          {options.map((o) => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm transition-colors" style={{ color: t.text, backgroundColor: o.value === value ? t.primary15 : 'transparent' }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IntakeManager({ theme, configUrl, recordsUrl, templatesUrl, isAgency = false, templateCrudBase, enableControl = true }: IntakeManagerProps) {
  const t = tokens(theme);
  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [templateKey, setTemplateKey] = useState('');
  const [fields, setFields] = useState<IntakeField[]>([]);
  const [intro, setIntro] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsNumber, setSmsNumber] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [locked, setLocked] = useState(false);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [records, setRecords] = useState<IntakeRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingTpl, setSavingTpl] = useState(false);
  // Price list for this form: lets the AI quote callers and total up orders.
  // Price is held as a string while editing, parsed to a number on save.
  const [pricing, setPricing] = useState<{ item: string; price: string; unit: string }[]>([]);
  const [pulling, setPulling] = useState(false);
  const [pullMsg, setPullMsg] = useState('');

  const editable = isAgency || !locked;

  const load = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token()}` };
      const [tplRes, cfgRes, recRes] = await Promise.all([
        fetch(templatesUrl, { headers }),
        fetch(configUrl, { headers }),
        fetch(recordsUrl, { headers }),
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
        setLocked(!!intake.locked);
        if (intake.config && Array.isArray(intake.config.fields)) {
          setFields(intake.config.fields); setIntro(intake.config.intro || '');
        } else if (intake.template_key) {
          const tpl = (tplData.templates || []).find((x: TemplateOption) => x.key === intake.template_key);
          if (tpl) { setFields(tpl.fields || []); setIntro(tpl.intro || ''); }
        }
        if (intake.config && Array.isArray(intake.config.pricing)) {
          setPricing(intake.config.pricing.map((p: any) => ({ item: String(p.item || ''), price: p.price != null ? String(p.price) : '', unit: String(p.unit || '') })));
        }
      }
      if (recRes.ok) { const { records: recs } = await recRes.json(); setRecords(recs || []); }
    } catch (e) {
      console.error('Failed to load intake:', e);
    } finally { setLoading(false); }
  }, [configUrl, recordsUrl, templatesUrl]);

  useEffect(() => { load(); }, [load]);

  const pickTemplate = (key: string) => {
    setTemplateKey(key);
    const tpl = templates.find((x) => x.key === key);
    if (tpl) { setFields(JSON.parse(JSON.stringify(tpl.fields || []))); setIntro(tpl.intro || ''); }
  };
  const updateField = (idx: number, patch: Partial<IntakeField>) => setFields((p) => p.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  const removeField = (idx: number) => setFields((p) => p.filter((_, i) => i !== idx));
  const moveField = (idx: number, dir: -1 | 1) => setFields((p) => { const j = idx + dir; if (j < 0 || j >= p.length) return p; const n = [...p]; [n[idx], n[j]] = [n[j], n[idx]]; return n; });
  const addField = () => setFields((p) => { const keys = new Set(p.map((f) => f.key)); return [...p, { key: slugify('new field', keys), label: 'New field', type: 'text', required: true }]; });

  const cleanFields = (): IntakeField[] => {
    const keys = new Set<string>();
    return fields.map((f) => {
      let key = f.key && f.key.trim() ? f.key : slugify(f.label, keys);
      if (keys.has(key)) key = slugify(f.label, keys);
      keys.add(key);
      const out: IntakeField = { key, label: f.label.trim() || key, type: f.type, required: f.required !== false };
      if (f.type === 'choice' && f.options && f.options.length) out.options = f.options.filter(Boolean);
      if (f.hint) out.hint = f.hint;
      if (f.showIf && f.showIf.field) out.showIf = f.showIf;
      return out;
    });
  };

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const config: any = { key: templateKey || 'intake', intro, fields: cleanFields() };
      const cleanedPricing = pricing
        .map((p) => ({ item: p.item.trim(), price: Number(p.price), unit: p.unit.trim() }))
        .filter((p) => p.item && Number.isFinite(p.price) && p.price >= 0)
        .map((p) => (p.unit ? p : { item: p.item, price: p.price }));
      if (cleanedPricing.length) config.pricing = cleanedPricing;
      // When the on/off control is hidden (client Orders tab) the form is already
      // on, and enabling lives on My Business, so never let a save here flip it off.
      const body: any = { enabled: enableControl ? enabled : true, template_key: templateKey || null, config, sms_enabled: smsEnabled, sms_number: smsNumber };
      if (isAgency) body.locked = locked;
      const res = await fetch(configUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(body) });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch (e) { console.error('Failed to save intake:', e); } finally { setSaving(false); }
  };

  // Read prices already written in this business's knowledge base and add any new
  // ones to the editor (deduped by item name). The owner reviews and Saves; this
  // never writes on its own.
  const pullFromKb = async () => {
    setPulling(true); setPullMsg('');
    try {
      const res = await fetch(`${configUrl}/pricing-from-kb`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) {
        const { pricing: found } = await res.json();
        if (Array.isArray(found) && found.length) {
          let added = 0;
          setPricing((prev) => {
            const have = new Set(prev.map((p) => p.item.trim().toLowerCase()).filter(Boolean));
            const additions = found
              .filter((p: any) => p && p.item && !have.has(String(p.item).trim().toLowerCase()))
              .map((p: any) => ({ item: String(p.item), price: p.price != null ? String(p.price) : '', unit: String(p.unit || '') }));
            added = additions.length;
            return [...prev, ...additions];
          });
          setPullMsg(added > 0 ? `Added ${added} price${added === 1 ? '' : 's'} from your knowledge base. Review and Save.` : 'Your prices already match your knowledge base.');
        } else {
          setPullMsg('No prices found in your knowledge base.');
        }
      } else { setPullMsg('Could not read your knowledge base.'); }
    } catch (e) { setPullMsg('Could not read your knowledge base.'); }
    finally { setPulling(false); setTimeout(() => setPullMsg(''), 6000); }
  };

  const saveAsTemplate = async () => {
    if (!templateCrudBase) return;
    const name = window.prompt('Name this reusable template (e.g. "Feed Store Orders")');
    if (!name) return;
    setSavingTpl(true);
    try {
      const res = await fetch(templateCrudBase, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name, schema: { intro, fields: cleanFields() } }),
      });
      if (res.ok) await load();
    } catch (e) { console.error('Failed to save template:', e); } finally { setSavingTpl(false); }
  };

  const deleteTemplate = async (id?: string) => {
    if (!templateCrudBase || !id) return;
    if (!window.confirm('Delete this reusable template? Clients already using it keep their copy.')) return;
    try {
      const res = await fetch(`${templateCrudBase}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) await load();
    } catch (e) { console.error('Failed to delete template:', e); }
  };

  const card = { backgroundColor: t.card, border: `1px solid ${t.border}` };
  const inputStyle = { backgroundColor: t.input, border: `1px solid ${t.inputBorder}`, color: t.text };
  const agencyTemplates = templates.filter((x) => x.source === 'agency');

  if (loading) {
    return <div className="rounded-xl p-6 flex items-center justify-center" style={card}><Loader2 className="h-5 w-5 animate-spin" style={{ color: t.primary }} /></div>;
  }

  const otherFieldOptions = (idx: number) => fields.slice(0, idx).map((f) => ({ value: f.key, label: f.label }));

  return (
    <div className="rounded-xl overflow-hidden" style={card}>
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" style={{ color: t.icon }} />
            <div>
              <h2 className="font-semibold text-sm sm:text-base" style={{ color: t.text }}>Intake Form</h2>
              <p className="text-xs mt-0.5" style={{ color: t.muted }}>Capture structured orders and requests on each call, one question at a time.</p>
            </div>
          </div>
          {enableControl && ((isAgency || !locked) ? (
            <button type="button" role="switch" aria-checked={enabled} onClick={() => setEnabled((v) => !v)}
              className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors" style={{ backgroundColor: enabled ? t.primary : t.inputBorder }}>
              <span className="inline-block h-5 w-5 rounded-full bg-white transition-transform" style={{ transform: enabled ? 'translateX(22px)' : 'translateX(2px)' }} />
            </button>
          ) : (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: t.primary15, color: t.primary }}>{enabled ? 'On' : 'Off'}</span>
          ))}
        </div>

        {!isAgency && locked && (
          <div className="mt-3 flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: t.hover, color: t.muted }}>
            <Lock className="h-3.5 w-3.5" /> Your agency manages this form. You can still choose where orders are texted below.
          </div>
        )}

        {(enabled || !enableControl) && (
          <div className="mt-5 space-y-5">
            {/* Template picker (hidden for a locked client) */}
            {editable && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: t.muted }}>Template</label>
                <ThemedDropdown value={templateKey} placeholder="Pick a template to start from"
                  options={templates.map((x) => ({ value: x.key, label: x.source === 'agency' ? `${x.label} (yours)` : x.label }))}
                  onChange={pickTemplate} t={t} />
                <p className="text-[11px] mt-1.5" style={{ color: t.muted }}>Pick one, then tweak the fields below. Changes only affect this business.</p>
              </div>
            )}

            {/* Field list: editable builder, or read-only for a locked client */}
            {fields.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: t.muted }}>What the AI collects (in order)</label>
                {editable ? (
                  <>
                    <div className="space-y-3">
                      {fields.map((f, idx) => (
                        <div key={idx} className="rounded-lg p-3" style={{ backgroundColor: t.hover, border: `1px solid ${t.border}` }}>
                          <div className="flex items-start gap-2">
                            <div className="flex flex-col gap-1 pt-1">
                              <button type="button" onClick={() => moveField(idx, -1)} disabled={idx === 0} style={{ color: t.muted, opacity: idx === 0 ? 0.3 : 1 }}><ChevronUp className="h-4 w-4" /></button>
                              <button type="button" onClick={() => moveField(idx, 1)} disabled={idx === fields.length - 1} style={{ color: t.muted, opacity: idx === fields.length - 1 ? 0.3 : 1 }}><ChevronDown className="h-4 w-4" /></button>
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input value={f.label} onChange={(e) => updateField(idx, { label: e.target.value })} placeholder="Field label" className="rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                                <ThemedDropdown value={f.type} options={TYPE_OPTIONS} onChange={(v) => updateField(idx, { type: v })} t={t} />
                              </div>
                              {f.type === 'choice' && (
                                <input value={(f.options || []).join(', ')} onChange={(e) => updateField(idx, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                                  placeholder="Choices, comma separated (e.g. Bulk delivery, Bagged, Tote)" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                              )}
                              <div className="flex flex-wrap items-center gap-3">
                                <label className="flex items-center gap-1.5 text-xs" style={{ color: t.text }}>
                                  <button type="button" role="switch" aria-checked={f.required !== false} onClick={() => updateField(idx, { required: f.required === false })}
                                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors" style={{ backgroundColor: f.required !== false ? t.primary : t.inputBorder }}>
                                    <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: f.required !== false ? 'translateX(18px)' : 'translateX(2px)' }} />
                                  </button>
                                  Required
                                </label>
                                {idx > 0 && (
                                  <div className="flex items-center gap-1.5 text-xs" style={{ color: t.muted }}>
                                    <span>Only ask if</span>
                                    <div className="w-36">
                                      <ThemedDropdown value={f.showIf?.field || ''} placeholder="(always)"
                                        options={[{ value: '', label: '(always)' }, ...otherFieldOptions(idx)]}
                                        onChange={(v) => updateField(idx, { showIf: v ? { field: v, equals: f.showIf?.equals || '' } : undefined })} t={t} />
                                    </div>
                                    {f.showIf?.field && (<><span>is</span>
                                      <input value={f.showIf?.equals || ''} onChange={(e) => updateField(idx, { showIf: { field: f.showIf!.field, equals: e.target.value } })} placeholder="value" className="w-28 rounded-lg px-2 py-1.5 text-xs focus:outline-none" style={inputStyle} /></>)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button type="button" onClick={() => removeField(idx)} className="pt-1" style={{ color: t.muted }}><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addField} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2" style={{ color: t.primary, border: `1px solid ${t.border}` }}><Plus className="h-3.5 w-3.5" /> Add field</button>
                  </>
                ) : (
                  <div className="rounded-lg p-3 space-y-1" style={{ backgroundColor: t.hover, border: `1px solid ${t.border}` }}>
                    {fields.map((f, idx) => (
                      <div key={idx} className="text-sm flex items-center gap-2" style={{ color: t.text }}>
                        <span className="text-xs w-5 flex-shrink-0 text-right" style={{ color: t.muted }}>{idx + 1}.</span>
                        {f.label}{f.type === 'choice' && f.options?.length ? <span style={{ color: t.muted }}> ({f.options.join(', ')})</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prices: lets the AI quote callers and total orders. Pull from the
                knowledge base so prices written there are never retyped. */}
            {editable ? (
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-medium" style={{ color: t.muted }}>Prices (so the AI can quote and total orders)</label>
                  <button type="button" onClick={pullFromKb} disabled={pulling} className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-2.5 py-1.5 flex-shrink-0" style={{ color: t.primary, border: `1px solid ${t.border}`, opacity: pulling ? 0.6 : 1 }}>
                    {pulling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Pull from knowledge base
                  </button>
                </div>
                {pricing.length > 0 && (
                  <div className="space-y-2">
                    {pricing.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input value={p.item} onChange={(e) => setPricing((arr) => arr.map((x, i) => (i === idx ? { ...x, item: e.target.value } : x)))} placeholder="Item (e.g. 16% HFG Laying Mash)" className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                        <div className="relative w-24 flex-shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: t.muted }}>$</span>
                          <input value={p.price} onChange={(e) => setPricing((arr) => arr.map((x, i) => (i === idx ? { ...x, price: e.target.value.replace(/[^0-9.]/g, '') } : x)))} inputMode="decimal" placeholder="0.00" className="w-full rounded-lg pl-6 pr-2 py-2 text-sm focus:outline-none" style={inputStyle} />
                        </div>
                        <input value={p.unit} onChange={(e) => setPricing((arr) => arr.map((x, i) => (i === idx ? { ...x, unit: e.target.value } : x)))} placeholder="unit" className="w-24 flex-shrink-0 rounded-lg px-2.5 py-2 text-sm focus:outline-none" style={inputStyle} />
                        <button type="button" onClick={() => setPricing((arr) => arr.filter((_, i) => i !== idx))} className="flex-shrink-0" style={{ color: t.muted }}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <button type="button" onClick={() => setPricing((arr) => [...arr, { item: '', price: '', unit: '' }])} className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2" style={{ color: t.primary, border: `1px solid ${t.border}` }}><Plus className="h-3.5 w-3.5" /> Add price</button>
                  {pullMsg && <span className="text-[11px]" style={{ color: t.muted }}>{pullMsg}</span>}
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: t.muted }}>Your AI quotes these exact prices on calls and totals up the order. Pull them from your knowledge base, then adjust.</p>
              </div>
            ) : (pricing.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: t.muted }}>Prices</label>
                <div className="rounded-lg p-3 space-y-1" style={{ backgroundColor: t.hover, border: `1px solid ${t.border}` }}>
                  {pricing.map((p, idx) => (
                    <div key={idx} className="text-sm flex items-center justify-between gap-2" style={{ color: t.text }}>
                      <span>{p.item}</span>
                      <span style={{ color: t.muted }}>${p.price}{p.unit ? ` ${p.unit}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* SMS destination (always the business's own to set) */}
            <div className="rounded-lg p-3" style={{ backgroundColor: t.hover, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="h-4 w-4 flex-shrink-0" style={{ color: t.icon }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: t.text }}>Text each order to the owner</p>
                    <p className="text-[11px]" style={{ color: t.muted }}>A clean summary of every captured order, as a text.</p>
                  </div>
                </div>
                <button type="button" role="switch" aria-checked={smsEnabled} onClick={() => setSmsEnabled((v) => !v)}
                  className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors" style={{ backgroundColor: smsEnabled ? t.primary : t.inputBorder }}>
                  <span className="inline-block h-5 w-5 rounded-full bg-white transition-transform" style={{ transform: smsEnabled ? 'translateX(22px)' : 'translateX(2px)' }} />
                </button>
              </div>
              {smsEnabled && (
                <input value={smsNumber} onChange={(e) => setSmsNumber(e.target.value)} placeholder={ownerPhone ? `Defaults to owner (${ownerPhone})` : 'Phone number for order texts'} className="mt-2 w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
              )}
            </div>

            {/* Agency: lock + reusable templates */}
            {isAgency && (
              <div className="rounded-lg p-3 space-y-3" style={{ backgroundColor: t.hover, border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="h-4 w-4 flex-shrink-0" style={{ color: t.icon }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: t.text }}>Lock this form (white-glove)</p>
                      <p className="text-[11px]" style={{ color: t.muted }}>The client can't edit the fields, only choose where orders are texted.</p>
                    </div>
                  </div>
                  <button type="button" role="switch" aria-checked={locked} onClick={() => setLocked((v) => !v)}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors" style={{ backgroundColor: locked ? t.primary : t.inputBorder }}>
                    <span className="inline-block h-5 w-5 rounded-full bg-white transition-transform" style={{ transform: locked ? 'translateX(22px)' : 'translateX(2px)' }} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button type="button" onClick={saveAsTemplate} disabled={savingTpl} className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5" style={{ color: t.primary, border: `1px solid ${t.border}` }}>
                    {savingTpl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5" />} Save as reusable template
                  </button>
                  {agencyTemplates.map((tpl) => (
                    <span key={tpl.key} className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1" style={{ backgroundColor: t.primary15, color: t.primary }}>
                      {tpl.label}
                      <button type="button" onClick={() => deleteTemplate(tpl.id)} title="Delete template"><Trash2 className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Save */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium" style={{ backgroundColor: t.primary, color: t.primaryText, opacity: saving ? 0.6 : 1 }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving' : 'Save Intake Form'}
              </button>
              {saved && <span className="text-xs" style={{ color: t.primary }}>Saved</span>}
            </div>
          </div>
        )}
      </div>

      {/* Captured records */}
      <div className="px-4 sm:px-6 py-4" style={{ borderTop: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4" style={{ color: t.icon }} />
          <h3 className="font-semibold text-sm" style={{ color: t.text }}>Orders & Requests</h3>
          {records.length > 0 && <span className="text-xs" style={{ color: t.muted }}>{records.length}</span>}
        </div>
        {records.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: t.muted }}>No captured orders yet. They appear here after calls.</p>
        ) : (
          <div className="space-y-2.5">
            {records.map((r) => (
              <div key={r.id} className="rounded-lg p-3" style={{ backgroundColor: t.hover, border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium" style={{ color: t.muted }}>{new Date(r.created_at).toLocaleString()}</span>
                  {r.caller_phone && <span className="text-[11px]" style={{ color: t.muted }}>{r.caller_phone}</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(r.data || {}).filter(([k, v]) => k !== 'order_items' && k !== 'order_total' && v !== null && v !== undefined && String(v).trim() !== '').map(([k, v]) => (
                    <div key={k} className="text-sm flex gap-1.5">
                      <span className="capitalize flex-shrink-0" style={{ color: t.muted }}>{k.replace(/_/g, ' ')}:</span>
                      <span style={{ color: t.text }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
                {Array.isArray((r.data as any)?.order_items) && (r.data as any).order_items.length > 0 && (
                  <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
                    {(r.data as any).order_items.map((li: any, i: number) => (
                      <div key={i} className="text-sm flex items-center justify-between gap-2">
                        <span style={{ color: t.text }}>{li.quantity} x {li.item}{li.unit ? ` (${li.unit})` : ''}</span>
                        <span style={{ color: t.muted }}>${Number(li.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                    {(r.data as any).order_total != null && (
                      <div className="text-sm flex items-center justify-between gap-2 mt-1 font-semibold" style={{ color: t.text }}>
                        <span>Total</span><span>${Number((r.data as any).order_total).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
