'use client';

// Staff directory editor for the call-center business config. CRUD over the
// business's staff_members (name, role, phone, email, whether the AI may
// transfer to them and when), via the client-scoped endpoints the call-center
// manager's token may call. Self-contained card.

import { useState, useEffect, useCallback } from 'react';
import { Users, Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

interface Staff {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  transferable: boolean;
  transfer_criteria: string | null;
  is_active: boolean;
}
type Draft = { name: string; role: string; phone: string; email: string; transferable: boolean; transfer_criteria: string };
const EMPTY: Draft = { name: '', role: '', phone: '', email: '', transferable: false, transfer_criteria: '' };

export default function CcStaff({ clientId, theme }: { clientId: string; theme: any }) {
  const [rows, setRows] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API()}/api/client/${clientId}/staff`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); setRows(Array.isArray(d.staff) ? d.staff : []); }
    } catch { /* keep */ } finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const Label = ({ children }: { children: React.ReactNode }) => (<label className="block text-[12px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>);

  const startNew = () => { setDraft(EMPTY); setEditing('new'); setErr(null); };
  const startEdit = (s: Staff) => { setDraft({ name: s.name || '', role: s.role || '', phone: s.phone || '', email: s.email || '', transferable: !!s.transferable, transfer_criteria: s.transfer_criteria || '' }); setEditing(s.id); setErr(null); };

  const save = async () => {
    if (!draft.name.trim()) { setErr('Name is required.'); return; }
    setBusy(true); setErr(null);
    const body = {
      name: draft.name.trim(), role: draft.role.trim() || null, phone: draft.phone.trim() || null,
      email: draft.email.trim() || null, transferable: draft.transferable,
      transfer_criteria: draft.transferable ? (draft.transfer_criteria.trim() || null) : null,
    };
    try {
      const url = editing === 'new' ? `${API()}/api/client/${clientId}/staff` : `${API()}/api/client/${clientId}/staff/${editing}`;
      const r = await fetch(url, { method: editing === 'new' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify(body) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Could not save'); }
      setEditing(null); setDraft(EMPTY); await load();
    } catch (e: any) { setErr(e.message || 'Could not save'); } finally { setBusy(false); }
  };

  const remove = async (s: Staff) => {
    if (!confirm(`Remove ${s.name}?`)) return;
    const prev = rows; setRows((list) => list.filter((x) => x.id !== s.id));
    try {
      const r = await fetch(`${API()}/api/client/${clientId}/staff/${s.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (!r.ok) throw new Error();
    } catch { setRows(prev); setErr('Could not remove.'); }
  };

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick} className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none" style={{ backgroundColor: on ? theme.primary : theme.hover }}>
      <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200" style={{ transform: on ? 'translate(22px, 4px)' : 'translate(4px, 4px)' }} />
    </button>
  );

  const form = (
    <div className="rounded-xl p-4 mt-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>Name</Label><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Dr. Alex Kim" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
        <div><Label>Role</Label><input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Stylist / Technician / Manager" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
        <div><Label>Phone</Label><input type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
        <div><Label>Email</Label><input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="alex@business.com" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
      </div>
      <div className="flex items-start justify-between gap-3 mt-3">
        <div className="flex-1 min-w-0"><p className="text-sm font-medium" style={{ color: theme.text }}>AI can transfer callers to them</p><p className="text-[11.5px] mt-0.5" style={{ color: theme.textSubtle }}>Needs a phone number. Describe when below.</p></div>
        <Toggle on={draft.transferable} onClick={() => setDraft({ ...draft, transferable: !draft.transferable })} />
      </div>
      {draft.transferable && (
        <div className="mt-3"><Label>Transfer when</Label><input value={draft.transfer_criteria} onChange={(e) => setDraft({ ...draft, transfer_criteria: e.target.value })} placeholder="Caller asks for them by name, or needs a clinical question" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={field} /></div>
      )}
      {err && <p className="text-[12px] mt-2" style={{ color: theme.error }}>{err}</p>}
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={() => { setEditing(null); setErr(null); }} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium" style={{ backgroundColor: theme.hover, color: theme.textMuted }}><X className="h-4 w-4" /> Cancel</button>
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={card}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Users className="h-4 w-4" style={{ color: theme.primary }} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Staff</h2>
          <p className="text-[12px]" style={{ color: theme.textMuted }}>Who works here, and who the AI may transfer a caller to.</p>
        </div>
        {editing !== 'new' && <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex-shrink-0" style={{ backgroundColor: theme.primary15, color: theme.primary }}><Plus className="h-3.5 w-3.5" /> Add</button>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-4" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : (
        <>
          {rows.length === 0 && editing !== 'new' && <p className="text-[13px] py-2" style={{ color: theme.textSubtle }}>No staff added yet.</p>}
          <div className="space-y-2">
            {rows.map((s) => (
              editing === s.id ? <div key={s.id}>{form}</div> : (
                <div key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{s.name}{s.role ? <span style={{ color: theme.textMuted }}> · {s.role}</span> : ''}</p>
                    <p className="text-[11.5px] truncate" style={{ color: theme.textSubtle }}>{s.transferable ? `Transferable${s.transfer_criteria ? `: ${s.transfer_criteria}` : ''}` : 'Not transferable'}</p>
                  </div>
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
