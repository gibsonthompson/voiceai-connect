'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Loader2, Trash2, Tag, X, Calendar, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';

interface DiscountCode {
  id: string;
  code: string;
  percent_off: number | null;
  waive_setup: boolean;
  setup_fee_percent_off?: number | null;
  duration: string;
  duration_months: number | null;
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

interface Props {
  theme: any;
  agencyId?: string;
  isPaid: boolean;
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

const emptyForm = { code: '', percent_off: '', waive_setup: false, setup_fee_percent_off: '', duration: 'forever', duration_months: '3', max_redemptions: '', expires_at: '' };

// Quiet, tucked-away discount-codes manager. Lives at the bottom of the Pricing
// tab in agency Settings (no standalone page, no nav item) so discounts stay a
// low-key tool rather than a headline feature.
function ThemedDropdown({ value, onChange, options, theme, disabled }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; theme: any; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const selected = options.find((o) => o.value === value);
  const menuBg = theme.card || theme.input || '#ffffff';
  const hover = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const selBg = (theme.primary || '#10b981') + '22';
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: theme.input || theme.bg, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text }}>
        <span>{selected ? selected.label : 'Select'}</span>
        <svg className={`h-4 w-4 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: theme.textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border shadow-lg overflow-hidden" style={{ backgroundColor: menuBg, borderColor: theme.inputBorder || theme.border }}>
          {options.map((o) => {
            const isSel = o.value === value;
            return (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
                style={{ color: theme.text, background: isSel ? selBg : 'transparent' }}
                onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = hover; }}
                onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ThemedDatePicker({ value, onChange, theme, placeholder = 'No expiry' }: { value: string; onChange: (v: string) => void; theme: any; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [view, setView] = useState<Date>(() => parsed || new Date());
  useEffect(() => { if (value) setView(new Date(value + 'T00:00:00')); }, [value]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const display = parsed ? parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : placeholder;
  const year = view.getFullYear(); const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selStr = parsed ? fmt(parsed) : '';
  const menuBg = theme.card || theme.input || '#ffffff';
  const prim = theme.primary || '#10b981';
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between"
        style={{ backgroundColor: theme.input || theme.bg, border: `1px solid ${theme.inputBorder || theme.border}`, color: value ? theme.text : theme.textMuted }}>
        <span>{display}</span>
        <Calendar className="h-4 w-4 flex-shrink-0 ml-2" style={{ color: theme.textMuted }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border shadow-xl p-3" style={{ backgroundColor: menuBg, borderColor: theme.inputBorder || theme.border, width: '15rem' }}>
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setView(new Date(year, month - 1, 1))} className="p-1 rounded-md" style={{ color: theme.text }}><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-medium" style={{ color: theme.text }}>{view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            <button type="button" onClick={() => setView(new Date(year, month + 1, 1))} className="p-1 rounded-md" style={{ color: theme.text }}><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => <div key={i} className="text-center text-[10px] font-medium" style={{ color: theme.textMuted }}>{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const cell = new Date(year, month, d);
              const cellStr = fmt(cell);
              const isSel = cellStr === selStr;
              const isToday = cell.getTime() === today.getTime();
              return (
                <button key={i} type="button" onClick={() => { onChange(cellStr); setOpen(false); }}
                  className="h-7 rounded-md text-xs transition-colors"
                  style={{ color: isSel ? (theme.primaryText || '#ffffff') : theme.text, backgroundColor: isSel ? prim : 'transparent', fontWeight: isToday ? 700 : 400, border: isToday && !isSel ? `1px solid ${prim}` : '1px solid transparent' }}
                  onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
                  onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  {d}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${theme.inputBorder || theme.border}` }}>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-xs font-medium" style={{ color: theme.textMuted }}>Clear</button>
            <button type="button" onClick={() => { onChange(fmt(today)); setOpen(false); }} className="text-xs font-medium" style={{ color: prim }}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DiscountCodesManager({ theme, agencyId, isPaid }: Props) {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/discount-codes`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      setCodes(res.ok ? (data.codes || []) : []);
    } catch { setCodes([]); }
    finally { setLoading(false); }
  }, [agencyId]);
  useEffect(() => { if (isPaid) load(); else setLoading(false); }, [isPaid, load]);

  const create = async () => {
    setSaving(true); setError('');
    try {
      const body = {
        code: form.code,
        percent_off: form.percent_off === '' ? null : Number(form.percent_off),
        waive_setup: form.waive_setup,
        setup_fee_percent_off: form.setup_fee_percent_off === '' ? null : Number(form.setup_fee_percent_off),
        duration: form.duration,
        duration_months: form.duration === 'repeating' ? Number(form.duration_months) : null,
        max_redemptions: form.max_redemptions === '' ? null : Number(form.max_redemptions),
        expires_at: form.expires_at || null,
      };
      const res = await fetch(
        editingId
          ? `${backendUrl}/api/agency/${agencyId}/discount-codes/${editingId}`
          : `${backendUrl}/api/agency/${agencyId}/discount-codes`,
        { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error || (editingId ? 'Failed to update code' : 'Failed to create code')); return; }
      setForm({ ...emptyForm }); setEditingId(null); setShowForm(false); load();
    } catch { setError(editingId ? 'Failed to update code' : 'Failed to create code'); }
    finally { setSaving(false); }
  };

  const startEdit = (c: DiscountCode) => {
    setEditingId(c.id);
    setForm({
      code: c.code || '',
      percent_off: c.percent_off != null ? String(c.percent_off) : '',
      waive_setup: !!c.waive_setup,
      setup_fee_percent_off: c.setup_fee_percent_off != null ? String(c.setup_fee_percent_off) : '',
      duration: c.duration || 'forever',
      duration_months: c.duration_months != null ? String(c.duration_months) : '3',
      max_redemptions: c.max_redemptions != null ? String(c.max_redemptions) : '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
    });
    setError(''); setShowForm(true);
  };
  const cancelForm = () => { setForm({ ...emptyForm }); setEditingId(null); setError(''); setShowForm(false); };

  const toggleActive = async (c: DiscountCode) => {
    try {
      await fetch(`${backendUrl}/api/agency/${agencyId}/discount-codes/${c.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ active: !c.active }),
      });
      setCodes((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));
    } catch { /* non-fatal */ }
  };

  const remove = async (c: DiscountCode) => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete code ${c.code}?`)) return;
    try {
      await fetch(`${backendUrl}/api/agency/${agencyId}/discount-codes/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      setCodes((prev) => prev.filter((x) => x.id !== c.id));
    } catch { /* non-fatal */ }
  };

  const describe = (c: DiscountCode) => {
    const parts: string[] = [];
    if (c.percent_off) {
      let p = `${c.percent_off}% off monthly`;
      if (c.duration === 'once') p += ' (first month)';
      else if (c.duration === 'repeating') p += ` (${c.duration_months} months)`;
      else p += ' (ongoing)';
      parts.push(p);
    }
    if (c.waive_setup) parts.push('setup fee waived');
    else if (c.setup_fee_percent_off) parts.push(`${c.setup_fee_percent_off}% off setup fee`);
    return parts.join(' + ') || 'No discount set';
  };

  const inputStyle = { backgroundColor: theme.input || theme.bg, border: `1px solid ${theme.inputBorder || theme.border}`, color: theme.text };
  const labelClass = 'block text-xs font-medium mb-1';

  return (
    <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${theme.border}` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-medium flex items-center gap-2" style={{ color: theme.text }}>
            <Tag className="h-4 w-4" style={{ color: theme.textMuted }} />Discount codes
          </h3>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: theme.textMuted }}>Optional. Codes a client can enter at signup to waive the setup fee or take a percentage off their monthly price.</p>
        </div>
        {isPaid && (
          <button onClick={() => { if (showForm) { cancelForm(); } else { setEditingId(null); setForm({ ...emptyForm }); setError(''); setShowForm(true); } }} className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{showForm ? 'Cancel' : 'New code'}
          </button>
        )}
      </div>

      {!isPaid ? (
        <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Available on Pro and Scale.</p>
      ) : (
        <>
          {showForm && (
            <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: theme.textMuted }}>Code</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="LAUNCH10" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: theme.textMuted }}>Percent Off Monthly</label>
                  <input type="number" min={1} max={100} value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: e.target.value })} placeholder="e.g. 10" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: theme.textMuted }}>Percent-Off Duration</label>
                  <ThemedDropdown value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} theme={theme} options={[{ value: 'forever', label: 'Ongoing (Forever)' }, { value: 'once', label: 'First Month Only' }, { value: 'repeating', label: 'A Set Number Of Months' }]} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: theme.textMuted }}>Number Of Months {form.duration !== 'repeating' && '(repeating only)'}</label>
                  <input type="number" min={1} max={36} value={form.duration_months} disabled={form.duration !== 'repeating'} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm disabled:opacity-40" style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: theme.textMuted }}>Max Redemptions</label>
                  <input type="number" min={1} value={form.max_redemptions} onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })} placeholder="Unlimited" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: theme.textMuted }}>Expires (Optional)</label>
                  <ThemedDatePicker value={form.expires_at} onChange={(v) => setForm({ ...form, expires_at: v })} theme={theme} placeholder="No expiry" />
                </div>
                <div className="sm:col-span-2 mt-0.5 space-y-2">
                  <label className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
                    <input type="checkbox" checked={form.waive_setup} onChange={(e) => setForm({ ...form, waive_setup: e.target.checked, setup_fee_percent_off: e.target.checked ? '' : form.setup_fee_percent_off })} />
                    Waive The Entire Setup Fee
                  </label>
                  {!form.waive_setup && (
                    <div className="ml-6">
                      <label className={labelClass} style={{ color: theme.textMuted }}>Or, Percent Off The Setup Fee</label>
                      <input type="number" min={1} max={100} value={form.setup_fee_percent_off} onChange={(e) => setForm({ ...form, setup_fee_percent_off: e.target.value })} placeholder="e.g. 50" className="w-full sm:w-40 rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                    </div>
                  )}
                  <p className="text-[11px] ml-6" style={{ color: theme.textMuted }}>Waive removes the setup fee entirely; a percent takes that much off it. Only applies if you charge a setup fee. The monthly percent above is separate.</p>
                </div>
              </div>
              {error && <p className="text-xs mt-2" style={{ color: theme.errorText || '#dc2626' }}>{error}</p>}
              <div className="mt-3 flex justify-end gap-2">
                {editingId && <button onClick={cancelForm} disabled={saving} className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50" style={{ backgroundColor: theme.hover, color: theme.text }}>Cancel</button>}
                <button onClick={create} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText || '#ffffff' }}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}{editingId ? 'Save changes' : 'Create code'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: theme.textMuted }} /></div>
          ) : codes.length === 0 ? (
            !showForm && <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>No codes yet.</p>
          ) : (
            <div className="space-y-2">
              {codes.map((c) => (
                <div key={c.id} className="rounded-xl p-3 flex items-center justify-between gap-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, opacity: c.active ? 1 : 0.6 }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm" style={{ color: theme.text }}>{c.code}</span>
                      {!c.active && <span className="text-[10px] rounded px-1.5 py-0.5" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Inactive</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                      {describe(c)}
                      {c.max_redemptions ? ` • ${c.redemption_count}/${c.max_redemptions} used` : c.redemption_count ? ` • ${c.redemption_count} used` : ''}
                      {c.expires_at ? ` • expires ${new Date(c.expires_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg" style={{ color: theme.textMuted }} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => toggleActive(c)} className="text-xs font-medium rounded-lg px-2.5 py-1.5" style={{ backgroundColor: theme.hover, color: theme.text }}>{c.active ? 'Disable' : 'Enable'}</button>
                    <button onClick={() => remove(c)} className="p-1.5 rounded-lg" style={{ color: theme.errorText || '#dc2626' }} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}