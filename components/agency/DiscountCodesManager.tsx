'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, Trash2, Tag, X } from 'lucide-react';

interface DiscountCode {
  id: string;
  code: string;
  percent_off: number | null;
  waive_setup: boolean;
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

const emptyForm = { code: '', percent_off: '', waive_setup: false, duration: 'forever', duration_months: '3', max_redemptions: '', expires_at: '' };

// Quiet, tucked-away discount-codes manager. Lives at the bottom of the Pricing
// tab in agency Settings (no standalone page, no nav item) so discounts stay a
// low-key tool rather than a headline feature.
export default function DiscountCodesManager({ theme, agencyId, isPaid }: Props) {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
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
        duration: form.duration,
        duration_months: form.duration === 'repeating' ? Number(form.duration_months) : null,
        max_redemptions: form.max_redemptions === '' ? null : Number(form.max_redemptions),
        expires_at: form.expires_at || null,
      };
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/discount-codes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create code'); return; }
      setForm({ ...emptyForm }); setShowForm(false); load();
    } catch { setError('Failed to create code'); }
    finally { setSaving(false); }
  };

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
          <button onClick={() => { setShowForm((s) => !s); setError(''); }} className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}>
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
                  <label className={labelClass} style={{ color: theme.textMuted }}>Percent off monthly</label>
                  <input type="number" min={1} max={100} value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: e.target.value })} placeholder="e.g. 10" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: theme.textMuted }}>Percent-off duration</label>
                  <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}>
                    <option value="forever">Ongoing (forever)</option>
                    <option value="once">First month only</option>
                    <option value="repeating">A set number of months</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={{ color: theme.textMuted }}>Number of months {form.duration !== 'repeating' && '(repeating only)'}</label>
                  <input type="number" min={1} max={36} value={form.duration_months} disabled={form.duration !== 'repeating'} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm disabled:opacity-40" style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: theme.textMuted }}>Max redemptions</label>
                  <input type="number" min={1} value={form.max_redemptions} onChange={(e) => setForm({ ...form, max_redemptions: e.target.value })} placeholder="Unlimited" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: theme.textMuted }}>Expires (optional)</label>
                  <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                </div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2 mt-0.5" style={{ color: theme.text }}>
                  <input type="checkbox" checked={form.waive_setup} onChange={(e) => setForm({ ...form, waive_setup: e.target.checked })} />
                  Waive the setup fee for this code
                </label>
              </div>
              {error && <p className="text-xs mt-2" style={{ color: theme.errorText || '#dc2626' }}>{error}</p>}
              <div className="mt-3 flex justify-end">
                <button onClick={create} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText || '#ffffff' }}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create code
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
