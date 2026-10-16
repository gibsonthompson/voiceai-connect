'use client';

// Services editor for the call-center business config. Full CRUD over the
// business's client_services (name, price, duration, booking behavior, active),
// via the client-scoped endpoints which the call-center manager's token is
// allowed to call. Self-contained card. CustomSelect, never a native select.

import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { CustomSelect, type DropdownUI } from '@/components/ui/custom-select';

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

interface Service {
  id: string;
  name: string;
  price: string | null;
  description: string | null;
  duration_minutes: number | null;
  booking_mode: 'auto_book' | 'collect_request' | 'disabled' | null;
  is_active: boolean;
}
type Draft = { name: string; price: string; description: string; duration_minutes: string; booking_mode: 'auto_book' | 'collect_request' | 'disabled' };
const EMPTY: Draft = { name: '', price: '', description: '', duration_minutes: '', booking_mode: 'collect_request' };
const BOOKING_MODES = [
  { value: 'auto_book', label: 'Auto-book' },
  { value: 'collect_request', label: 'Collect request' },
  { value: 'disabled', label: 'No booking' },
];
const bmLabel = (m: string | null) => BOOKING_MODES.find((b) => b.value === m)?.label || 'Collect request';

export default function CcServices({ clientId, theme }: { clientId: string; theme: any }) {
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // service id, or 'new'
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API()}/api/client/${clientId}/services`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); setRows(Array.isArray(d.services) ? d.services : []); }
    } catch { /* keep */ } finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const ddUI: DropdownUI = { inputStyle: field, text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark };

  const startNew = () => { setDraft(EMPTY); setEditing('new'); setErr(null); };
  const startEdit = (s: Service) => {
    setDraft({ name: s.name || '', price: s.price || '', description: s.description || '', duration_minutes: s.duration_minutes != null ? String(s.duration_minutes) : '', booking_mode: s.booking_mode || 'collect_request' });
    setEditing(s.id); setErr(null);
  };

  const save = async () => {
    if (!draft.name.trim()) { setErr('Service name is required.'); return; }
    setBusy(true); setErr(null);
    const body = {
      name: draft.name.trim(),
      price: draft.price.trim() || null,
      description: draft.description.trim() || null,
      duration_minutes: draft.duration_minutes === '' ? null : Math.max(0, parseInt(draft.duration_minutes, 10) || 0),
      booking_mode: draft.booking_mode,
    };
    try {
      const url = editing === 'new' ? `${API()}/api/client/${clientId}/services` : `${API()}/api/client/${clientId}/services/${editing}`;
      const r = await fetch(url, { method: editing === 'new' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify(body) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Could not save'); }
      setEditing(null); setDraft(EMPTY); await load();
    } catch (e: any) { setErr(e.message || 'Could not save'); } finally { setBusy(false); }
  };

  const remove = async (s: Service) => {
    if (!confirm(`Remove "${s.name}"?`)) return;
    const prev = rows; setRows((list) => list.filter((x) => x.id !== s.id));
    try {
      const r = await fetch(`${API()}/api/client/${clientId}/services/${s.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (!r.ok) throw new Error();
    } catch { setRows(prev); setErr('Could not remove the service.'); }
  };

  const toggleActive = async (s: Service) => {
    const prev = rows; setRows((list) => list.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)));
    try {
      const r = await fetch(`${API()}/api/client/${clientId}/services/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify({ is_active: !s.is_active }) });
      if (!r.ok) throw new Error();
    } catch { setRows(prev); setErr('Could not update the service.'); }
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const Label = ({ children }: { children: React.ReactNode }) => (<label className="block text-[12px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>);

  const form = (
    <div className="rounded-xl p-4 mt-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Label>Service name</Label><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Haircut & style" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
        <div><Label>Price</Label><input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="$45 or Call for quote" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
        <div><Label>Duration (minutes)</Label><input type="number" min={0} value={draft.duration_minutes} onChange={(e) => setDraft({ ...draft, duration_minutes: e.target.value })} placeholder="30" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
        <div className="sm:col-span-2"><Label>Description</Label><input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What's included, who it's for" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
        <div className="sm:col-span-2"><Label>Booking behavior</Label><CustomSelect value={draft.booking_mode} onChange={(v) => setDraft({ ...draft, booking_mode: v as Draft['booking_mode'] })} options={BOOKING_MODES} ui={ddUI} /></div>
      </div>
      {err && <p className="text-[12px] mt-2" style={{ color: theme.error }}>{err}</p>}
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={() => { setEditing(null); setErr(null); }} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium" style={{ backgroundColor: theme.hover, color: theme.textMuted }}><X className="h-4 w-4" /> Cancel</button>
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save service</button>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={card}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Briefcase className="h-4 w-4" style={{ color: theme.primary }} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Services</h2>
          <p className="text-[12px]" style={{ color: theme.textMuted }}>What this business offers, so the AI can quote and book correctly.</p>
        </div>
        {editing !== 'new' && <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex-shrink-0" style={{ backgroundColor: theme.primary15, color: theme.primary }}><Plus className="h-3.5 w-3.5" /> Add</button>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-4" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : (
        <>
          {rows.length === 0 && editing !== 'new' && <p className="text-[13px] py-2" style={{ color: theme.textSubtle }}>No services yet. Add one so the AI can quote and book.</p>}
          <div className="space-y-2">
            {rows.map((s) => (
              editing === s.id ? <div key={s.id}>{form}</div> : (
                <div key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, opacity: s.is_active ? 1 : 0.6 }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{s.name}{s.price ? <span style={{ color: theme.textMuted }}> · {s.price}</span> : ''}</p>
                    <p className="text-[11.5px] truncate" style={{ color: theme.textSubtle }}>{s.duration_minutes ? `${s.duration_minutes} min · ` : ''}{bmLabel(s.booking_mode)}{s.description ? ` · ${s.description}` : ''}</p>
                  </div>
                  <button onClick={() => toggleActive(s)} className="text-[11px] font-semibold px-2 py-1 rounded-md flex-shrink-0" style={s.is_active ? { backgroundColor: `${theme.primary}1a`, color: theme.primary } : { backgroundColor: theme.hover, color: theme.textMuted }}>{s.is_active ? 'Active' : 'Off'}</button>
                  <button onClick={() => startEdit(s)} className="flex-shrink-0" style={{ color: theme.textMuted }}><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(s)} className="flex-shrink-0" style={{ color: theme.error }}><Trash2 className="h-4 w-4" /></button>
                </div>
              )
            ))}
          </div>
          {editing === 'new' && form}
        </>
      )}
    </div>
  );
}
