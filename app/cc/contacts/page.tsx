'use client';

// ============================================================================
// /cc/contacts - the call-center CONTACTS book (mini-CRM).
//
// Everyone who has called or texted any business the center serves, in one
// place, plus contacts added by hand. Caller recognition already fills this in
// from calls (name, call count, last call, the AI's summary), so an inbound
// caller shows up here automatically; agents and managers can also add, edit,
// and text a contact. A manager sees every business; an agent sees only the
// businesses assigned to them (scoped server-side).
//
// Data: /api/agency/:id/cc/contacts (list/detail/create/update/delete).
// Two-pane: contact list on the left, detail + call history on the right.
// Theme-aware (white-labels). The "Text" action deep-links to /cc/sms.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Contact as ContactIcon, Search, Loader2, Building2, Plus, Phone, Mail,
  MapPin, MessageSquare, Pencil, Trash2, X, Check, ChevronLeft, AlertCircle,
  PhoneCall, CalendarCheck, Save,
} from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';
import { CustomSelect, type DropdownUI } from '@/components/ui/custom-select';

interface Row {
  id: string;
  clientId: string;
  businessName: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string | null;
  tags: string[];
  source: string | null;
  totalCalls: number;
  lastCallAt: string | null;
  aiSummary: string | null;
  createdAt: string | null;
}
interface CallRow { id: string; at: string; caller: string | null; durationSeconds: number; reason: string | null; status: string | null; booked: boolean; }
interface Biz { clientId: string; businessName: string; }

const SORTS = [
  { value: 'recent', label: 'Most recent call' },
  { value: 'calls', label: 'Most calls' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'oldest', label: 'Oldest added' },
];

function fmtPhone(p: string | null): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}
function fmtWhen(iso: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; }
}
function fmtDur(s: number): string { if (!s) return '0s'; const m = Math.floor(s / 60); const r = s % 60; return m ? `${m}m ${r}s` : `${r}s`; }

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => { try { return localStorage.getItem('auth_token'); } catch { return null; } };

export default function CallCenterContacts() {
  const { agency } = useAgency();
  const theme = useTheme();
  const router = useRouter();
  const agencyId = agency?.id || '';

  const [rows, setRows] = useState<Row[]>([]);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [business, setBusiness] = useState('');
  const [sort, setSort] = useState('recent');
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [active, setActive] = useState<Row | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<{ name: string; phone: string; email: string; address: string }>({ name: '', phone: '', email: '', address: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [aClient, setAClient] = useState('');
  const [aName, setAName] = useState('');
  const [aPhone, setAPhone] = useState('');
  const [aEmail, setAEmail] = useState('');
  const [aAddress, setAAddress] = useState('');

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { const chk = () => setIsMobile(window.innerWidth < 768); chk(); window.addEventListener('resize', chk); return () => window.removeEventListener('resize', chk); }, []);
  useEffect(() => { const t = setTimeout(() => setQDebounced(q.trim()), 350); return () => clearTimeout(t); }, [q]);

  const reqRef = useRef(0);
  const loadList = useCallback(async () => {
    if (!agencyId) return;
    const my = ++reqRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: '50' });
      if (qDebounced) params.set('q', qDebounced);
      if (business) params.set('business', business);
      const r = await fetch(`${API()}/api/agency/${agencyId}/cc/contacts?${params.toString()}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (my !== reqRef.current) return;
      if (r.ok) {
        const d = await r.json();
        if (d.success) { setRows(d.rows || []); setTotal(d.total || 0); if (Array.isArray(d.businesses)) setBusinesses(d.businesses); setListError(null); }
      } else setListError('Could not load contacts.');
    } catch { if (my === reqRef.current) setListError('Could not load contacts.'); }
    finally { if (my === reqRef.current) setLoading(false); }
  }, [agencyId, business, sort, qDebounced]);
  useEffect(() => { loadList(); }, [loadList]);

  const openContact = useCallback(async (id: string) => {
    setSelectedId(id); setEditing(false); setDetailLoading(true);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/cc/contacts/${id}`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); if (d.success) { setActive(d.contact); setCalls(Array.isArray(d.calls) ? d.calls : []); } }
    } catch { /* non-fatal */ } finally { setDetailLoading(false); }
  }, [agencyId]);

  const startEdit = () => { if (!active) return; setEdit({ name: active.name === 'Unknown' ? '' : active.name, phone: active.phone || '', email: active.email || '', address: active.address || '' }); setEditing(true); };
  const saveEdit = async () => {
    if (!active) return;
    setSavingEdit(true);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/cc/contacts/${active.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ name: edit.name, phone: edit.phone, email: edit.email, address: edit.address }),
      });
      const d = await r.json();
      if (r.ok && d.success) { setActive(d.contact); setEditing(false); setRows((list) => list.map((x) => (x.id === d.contact.id ? { ...x, ...d.contact } : x))); }
    } catch { /* non-fatal */ } finally { setSavingEdit(false); }
  };

  const removeContact = async () => {
    if (!active) return;
    if (!confirm(`Delete ${active.name}? This removes the contact, not their call history.`)) return;
    const id = active.id;
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/cc/contacts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { setRows((list) => list.filter((x) => x.id !== id)); setSelectedId(null); setActive(null); setCalls([]); }
    } catch { /* non-fatal */ }
  };

  const textContact = (c: { clientId: string; phone: string | null; name: string }) => {
    if (!c.phone) return;
    const p = new URLSearchParams({ client: c.clientId, to: c.phone });
    if (c.name && c.name !== 'Unknown') p.set('name', c.name);
    router.push(`/cc/sms?${p.toString()}`);
  };

  const addContact = async () => {
    if (!aClient) { setAddErr('Pick a business.'); return; }
    if (!aPhone.trim()) { setAddErr('A phone number is required.'); return; }
    setAdding(true); setAddErr(null);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/cc/contacts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ clientId: aClient, name: aName.trim() || null, phone: aPhone.trim(), email: aEmail.trim() || null, address: aAddress.trim() || null }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) { setAddErr(d.error || 'Could not add the contact.'); return; }
      setShowAdd(false); setAName(''); setAPhone(''); setAEmail(''); setAAddress(''); setAClient('');
      await loadList();
      if (d.contact?.id) openContact(d.contact.id);
    } catch { setAddErr('Could not add the contact.'); } finally { setAdding(false); }
  };

  const selStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const ddUI: DropdownUI = { inputStyle: selStyle, text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark };
  const Label = ({ children }: { children: React.ReactNode }) => (<label className="block text-[12px] font-medium mb-1.5" style={{ color: theme.textMuted }}>{children}</label>);

  // ---- list pane ------------------------------------------------------------
  const listPane = (
    <div className="flex flex-col min-h-0 h-full">
      <div className="space-y-3 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textSubtle }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, number, or email" className="w-full rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none" style={selStyle} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <CustomSelect value={business} onChange={setBusiness} options={[{ value: '', label: 'All businesses' }, ...businesses.map((b) => ({ value: b.clientId, label: b.businessName }))]} ui={ddUI} />
          <CustomSelect value={sort} onChange={setSort} options={SORTS} ui={ddUI} />
        </div>
      </div>
      <p className="text-[12px] mb-2" style={{ color: theme.textMuted }}>{loading ? 'Loading...' : `${total.toLocaleString()} contact${total === 1 ? '' : 's'}`}</p>
      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 space-y-2">
        {loading && rows.length === 0 ? (
          <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
        ) : listError ? (
          <div className="rounded-xl px-4 py-3 text-[13px] flex items-center gap-2" style={{ backgroundColor: `${theme.error}12`, border: `1px solid ${theme.error}40`, color: theme.error }}><AlertCircle className="h-4 w-4" /> {listError}</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl py-12 flex flex-col items-center justify-center text-center" style={{ border: `1px dashed ${theme.border}` }}>
            <ContactIcon className="h-8 w-8 mb-2.5" style={{ color: theme.textSubtle }} />
            <p className="text-sm font-medium" style={{ color: theme.text }}>No contacts yet</p>
            <p className="text-[13px] mt-1 max-w-[230px]" style={{ color: theme.textMuted }}>Callers show up here automatically, or add one with the button above.</p>
          </div>
        ) : rows.map((c) => {
          const on = selectedId === c.id;
          return (
            <button key={c.id} onClick={() => openContact(c.id)} className="w-full text-left rounded-xl p-3 transition" style={on ? { backgroundColor: theme.primary15, border: `1px solid ${theme.primary}55` } : { backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13.5px] font-semibold truncate" style={{ color: theme.text }}>{c.name || 'Unknown'}</p>
                {c.totalCalls > 0 && <span className="text-[11px] flex-shrink-0 inline-flex items-center gap-1" style={{ color: theme.textSubtle }}><PhoneCall className="h-3 w-3" />{c.totalCalls}</span>}
              </div>
              <p className="text-[12px] truncate mt-0.5" style={{ color: theme.textMuted }}>{fmtPhone(c.phone)}{c.phone ? ' · ' : ''}{c.businessName}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ---- detail pane ----------------------------------------------------------
  const detailPane = (
    <div className="flex flex-col min-h-0 h-full rounded-2xl" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      {!selectedId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <ContactIcon className="h-9 w-9 mb-3" style={{ color: theme.textSubtle }} />
          <p className="text-sm font-medium" style={{ color: theme.text }}>Pick a contact</p>
          <p className="text-[13px] mt-1 max-w-[260px]" style={{ color: theme.textMuted }}>Select someone on the left to see their details and call history.</p>
        </div>
      ) : detailLoading && !active ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-sm" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : active ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start gap-3 p-4 sm:p-5" style={{ borderBottom: `1px solid ${theme.borderSubtle}` }}>
            {isMobile && <button onClick={() => { setSelectedId(null); setActive(null); }} className="inline-flex items-center justify-center rounded-lg h-9 w-9 flex-shrink-0" style={{ backgroundColor: theme.hover, color: theme.textMuted }}><ChevronLeft className="h-5 w-5" /></button>}
            <div className="min-w-0 flex-1">
              {editing ? (
                <input value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} placeholder="Name" className="w-full rounded-lg px-2.5 py-1.5 text-sm font-semibold outline-none" style={selStyle} />
              ) : (
                <p className="text-base font-semibold truncate" style={{ color: theme.text }}>{active.name || 'Unknown'}</p>
              )}
              <p className="text-[12px] truncate flex items-center gap-1 mt-0.5" style={{ color: theme.textMuted }}><Building2 className="h-3 w-3" /> {active.businessName}</p>
            </div>
            {!editing && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {active.phone && <button onClick={() => textContact(active)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><MessageSquare className="h-3.5 w-3.5" /> Text</button>}
                <button onClick={startEdit} className="inline-flex items-center justify-center rounded-lg h-[32px] w-[32px]" style={{ backgroundColor: theme.hover, color: theme.textMuted }} title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={removeContact} className="inline-flex items-center justify-center rounded-lg h-[32px] w-[32px]" style={{ backgroundColor: theme.hover, color: theme.error }} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5 space-y-5">
            {/* Fields */}
            {editing ? (
              <div className="space-y-3">
                <div><Label>Phone</Label><input value={edit.phone} onChange={(e) => setEdit((s) => ({ ...s, phone: e.target.value }))} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={selStyle} /></div>
                <div><Label>Email</Label><input value={edit.email} onChange={(e) => setEdit((s) => ({ ...s, email: e.target.value }))} placeholder="name@email.com" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={selStyle} /></div>
                <div><Label>Address</Label><input value={edit.address} onChange={(e) => setEdit((s) => ({ ...s, address: e.target.value }))} placeholder="Street, city" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={selStyle} /></div>
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button onClick={() => setEditing(false)} className="rounded-xl px-4 py-2 text-sm font-medium" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Cancel</button>
                  <button onClick={saveEdit} disabled={savingEdit} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.inputBorder}` }}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Phone className="h-4 w-4 flex-shrink-0" style={{ color: theme.textSubtle }} />
                  {active.phone ? <a href={`tel:${active.phone}`} className="text-[13px] font-medium" style={{ color: theme.primary }}>{fmtPhone(active.phone)}</a> : <span className="text-[13px]" style={{ color: theme.textSubtle }}>No phone</span>}
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                  <Mail className="h-4 w-4 flex-shrink-0" style={{ color: theme.textSubtle }} />
                  {active.email ? <a href={`mailto:${active.email}`} className="text-[13px] truncate" style={{ color: theme.text }}>{active.email}</a> : <span className="text-[13px]" style={{ color: theme.textSubtle }}>No email</span>}
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
                  <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: theme.textSubtle }} />
                  <span className="text-[13px] truncate" style={{ color: active.address ? theme.text : theme.textSubtle }}>{active.address || 'No address'}</span>
                </div>
              </div>
            )}

            {/* Stats */}
            {!editing && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <p className="text-[11px]" style={{ color: theme.textMuted }}>Total calls</p>
                  <p className="text-lg font-semibold" style={{ color: theme.text }}>{active.totalCalls}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                  <p className="text-[11px]" style={{ color: theme.textMuted }}>Last call</p>
                  <p className="text-[15px] font-semibold" style={{ color: theme.text }}>{active.lastCallAt ? fmtWhen(active.lastCallAt) : '—'}</p>
                </div>
              </div>
            )}

            {/* AI summary */}
            {!editing && active.aiSummary && (
              <div>
                <Label>What they usually need</Label>
                <p className="text-[13px] leading-relaxed rounded-xl p-3" style={{ backgroundColor: theme.input, color: theme.textMuted, border: `1px solid ${theme.inputBorder}` }}>{active.aiSummary}</p>
              </div>
            )}

            {/* Call history */}
            {!editing && (
              <div>
                <Label>Call history</Label>
                {calls.length === 0 ? (
                  <p className="text-[12.5px]" style={{ color: theme.textSubtle }}>No calls recorded for this contact yet.</p>
                ) : (
                  <div className="space-y-2">
                    {calls.map((c) => (
                      <a key={c.id} href={`/cc/calls/${c.id}`} className="block rounded-xl p-3 transition" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12.5px] font-medium inline-flex items-center gap-1.5" style={{ color: theme.text }}>{c.booked && <CalendarCheck className="h-3.5 w-3.5" style={{ color: theme.primary }} />}{fmtWhen(c.at)}</span>
                          <span className="text-[11px]" style={{ color: theme.textSubtle }}>{fmtDur(c.durationSeconds)}</span>
                        </div>
                        {c.reason && <p className="text-[12px] mt-1 line-clamp-2" style={{ color: theme.textMuted }}>{c.reason}</p>}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[13px]" style={{ color: theme.textMuted }}>Couldn&apos;t load this contact.</div>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen flex flex-col" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><ContactIcon className="h-5 w-5" style={{ color: theme.primary }} /></div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Contacts</h1>
            <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Everyone who contacts your businesses, recognized automatically from calls.</p>
          </div>
        </div>
        <button onClick={() => { setShowAdd(true); setAddErr(null); }} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add contact</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Two-pane on desktop; one pane at a time on mobile. */}
      <div className="flex-1 min-h-0">
        {isMobile ? (
          <div className="h-[calc(100vh-180px)]">{selectedId ? detailPane : listPane}</div>
        ) : (
          <div className="grid grid-cols-[minmax(300px,380px)_1fr] gap-5 h-[calc(100vh-180px)]">
            {listPane}
            {detailPane}
          </div>
        )}
      </div>

      {/* Add-contact modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl p-5 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: theme.text }}>New contact</h2>
              <button onClick={() => setShowAdd(false)} style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>
            </div>
            {addErr && <div className="mb-3 rounded-xl px-3 py-2 text-[12.5px] flex items-center gap-2" style={{ backgroundColor: `${theme.error}12`, border: `1px solid ${theme.error}40`, color: theme.error }}><AlertCircle className="h-3.5 w-3.5" /> {addErr}</div>}
            <div className="space-y-3">
              <div><Label>Business</Label><CustomSelect value={aClient} onChange={setAClient} options={[{ value: '', label: 'Pick a business' }, ...businesses.map((b) => ({ value: b.clientId, label: b.businessName }))]} ui={ddUI} /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Name</Label><input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Jane Doe" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={selStyle} /></div>
                <div><Label>Phone</Label><input value={aPhone} onChange={(e) => setAPhone(e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={selStyle} /></div>
              </div>
              <div><Label>Email (optional)</Label><input value={aEmail} onChange={(e) => setAEmail(e.target.value)} placeholder="name@email.com" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={selStyle} /></div>
              <div><Label>Address (optional)</Label><input value={aAddress} onChange={(e) => setAAddress(e.target.value)} placeholder="Street, city" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={selStyle} /></div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="rounded-xl px-4 py-2 text-sm font-medium" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Cancel</button>
              <button onClick={addContact} disabled={adding} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add contact</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
