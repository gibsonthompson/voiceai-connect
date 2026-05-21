'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Loader2, X, Check, Trash2, UserPlus,
  Phone, Mail, Pencil, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
} from 'lucide-react';

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

interface StaffMember {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  google_calendar_id: string | null;
  created_at: string;
}

interface Props {
  clientId: string;
  theme: any;
  compact?: boolean;
  industry?: string;
}

const INDUSTRY_STAFF_PLACEHOLDERS: Record<string, { name: string; role: string; notes: string }> = {
  dental: { name: 'e.g. Dr. Sarah Johnson', role: 'e.g. Dentist, Hygienist, Dental Assistant', notes: 'e.g. Specializes in pediatric dentistry, available Mon-Thu' },
  medical_practice: { name: 'e.g. Dr. James Chen', role: 'e.g. Physician, Nurse Practitioner, MA', notes: 'e.g. Board certified internist, sees patients Tue-Fri' },
  mental_health: { name: 'e.g. Dr. Lisa Park', role: 'e.g. Therapist, Counselor, Psychiatrist', notes: 'e.g. Specializes in CBT, accepts new patients' },
  veterinary: { name: 'e.g. Dr. Mike Torres', role: 'e.g. Veterinarian, Vet Tech, Groomer', notes: 'e.g. Small animal specialist, surgery days Wed/Fri' },
  chiropractic: { name: 'e.g. Dr. Amy Reed', role: 'e.g. Chiropractor, Massage Therapist', notes: 'e.g. Sports injuries, available evenings' },
  optometry: { name: 'e.g. Dr. Kevin Patel', role: 'e.g. Optometrist, Optician, Technician', notes: 'e.g. Contact lens specialist' },
  physical_therapy: { name: 'e.g. Dr. Rachel Kim', role: 'e.g. Physical Therapist, PTA, Aide', notes: 'e.g. Post-surgical rehab specialist' },
  salon_spa: { name: 'e.g. Maria Garcia', role: 'e.g. Stylist, Colorist, Esthetician', notes: 'e.g. Balayage specialist, 10+ years experience' },
  legal: { name: 'e.g. John Mitchell, Esq.', role: 'e.g. Attorney, Paralegal, Legal Assistant', notes: 'e.g. Family law, available for consultations M-F' },
  real_estate: { name: 'e.g. Sarah Williams', role: 'e.g. Agent, Broker, Transaction Coordinator', notes: 'e.g. Residential specialist, covers North side' },
  automotive: { name: 'e.g. Mike Johnson', role: 'e.g. Mechanic, Service Advisor, Technician', notes: 'e.g. ASE certified, specializes in European cars' },
  home_services: { name: 'e.g. David Brown', role: 'e.g. Technician, Estimator, Project Manager', notes: 'e.g. Licensed electrician, 15+ years' },
  fitness: { name: 'e.g. Alex Rivera', role: 'e.g. Trainer, Instructor, Coach', notes: 'e.g. NASM certified, specializes in strength training' },
  restaurant: { name: 'e.g. Chef Marco', role: 'e.g. Chef, Manager, Event Coordinator', notes: 'e.g. Handles catering and private events' },
};
const DEFAULT_STAFF = { name: 'e.g. Jane Smith', role: 'e.g. Manager, Associate, Specialist', notes: 'e.g. Specialties, availability notes' };

const EMPTY_FORM = { name: '', role: '', phone: '', email: '', notes: '' };

export default function StaffMembersSection({ clientId, theme, compact, industry }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const ph = (industry && INDUSTRY_STAFF_PLACEHOLDERS[industry]) || DEFAULT_STAFF;

  const fetchStaff = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/client/${clientId}/staff`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setStaff(data.staff || []); }
    } catch (e) { console.error('Failed to fetch staff:', e); }
    finally { setLoading(false); }
  }, [clientId, backendUrl]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setError(''); setShowModal(true); };
  const openEdit = (member: StaffMember) => { setForm({ name: member.name, role: member.role || '', phone: member.phone || '', email: member.email || '', notes: member.notes || '' }); setEditingId(member.id); setError(''); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingId ? `${backendUrl}/api/client/${clientId}/staff/${editingId}` : `${backendUrl}/api/client/${clientId}/staff`;
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name.trim(), role: form.role.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null, notes: form.notes.trim() || null }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      setShowModal(false); fetchStaff();
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this staff member? This will also unassign them from any services.')) return;
    setDeletingId(id);
    try { const token = localStorage.getItem('auth_token'); await fetch(`${backendUrl}/api/client/${clientId}/staff/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchStaff(); } catch (e) { console.error('Delete failed:', e); }
    finally { setDeletingId(null); }
  };

  const handleToggleActive = async (member: StaffMember) => {
    setTogglingId(member.id);
    try { const token = localStorage.getItem('auth_token'); await fetch(`${backendUrl}/api/client/${clientId}/staff/${member.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !member.is_active }) }); fetchStaff(); } catch (e) { console.error('Toggle failed:', e); }
    finally { setTogglingId(null); }
  };

  const glass = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` };
  const inputStyle = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`, color: theme.text };

  return (
    <section className={compact ? '' : 'mb-4 sm:mb-6'}>
      {!compact && (
        <h2 className="text-sm sm:text-base font-semibold mb-1 flex items-center gap-2" style={{ color: theme.text }}>
          <Users className="w-4 h-4" style={{ color: theme.primary }} />Staff Directory
        </h2>
      )}
      {!compact && (
        <p className="text-[10px] sm:text-xs mb-2 sm:mb-3" style={{ color: theme.textMuted }}>
          People your AI knows about — for call routing, scheduling, and referrals
        </p>
      )}
      {compact && (
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" style={{ color: theme.primary }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Staff Directory</span>
        </div>
      )}

      <div className={compact ? '' : 'rounded-xl border p-3 sm:p-4 shadow-sm'} style={compact ? {} : { borderColor: theme.border, backgroundColor: theme.card }}>
        {loading ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.textMuted }} /><span className="ml-2 text-xs" style={{ color: theme.textMuted }}>Loading staff...</span></div>
        ) : (
          <>
            {staff.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-8 w-8 mx-auto mb-2" style={{ color: theme.textMuted, opacity: 0.2 }} />
                <p className="text-xs" style={{ color: theme.textMuted }}>No staff members yet</p>
                <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>Add your team so the AI can route calls and book the right person</p>
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {staff.map(member => (
                  <div key={member.id} className="rounded-xl p-3 flex items-center gap-3 transition-all" style={{ ...glass, opacity: member.is_active ? 1 : 0.5 }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.12 : 0.06), color: theme.primary }}>{member.name.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-medium truncate" style={{ color: theme.text }}>{member.name}</p>
                        {member.role && <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: hexToRgba(theme.primary, 0.08), color: theme.primary }}>{member.role}</span>}
                        {!member.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#ef4444' }}>Inactive</span>}
                        {member.google_calendar_id && <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', color: '#22c55e' }}>Calendar</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {member.phone && <span className="text-[10px] flex items-center gap-1" style={{ color: theme.textMuted }}><Phone className="h-2.5 w-2.5" />{member.phone}</span>}
                        {member.email && <span className="text-[10px] flex items-center gap-1 truncate" style={{ color: theme.textMuted }}><Mail className="h-2.5 w-2.5" />{member.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleToggleActive(member)} disabled={togglingId === member.id} className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: member.is_active ? '#22c55e' : theme.textMuted }} title={member.is_active ? 'Deactivate' : 'Activate'}>{togglingId === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : member.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}</button>
                      <button onClick={() => openEdit(member)} className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: theme.textMuted }} title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(member.id)} disabled={deletingId === member.id} className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: '#ef4444' }} title="Remove">{deletingId === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={openAdd} className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99]" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.05), color: theme.primary, border: `1px dashed ${hexToRgba(theme.primary, 0.3)}` }}><UserPlus className="h-3.5 w-3.5" /> Add Staff Member</button>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 sm:p-6" style={{ backgroundColor: theme.card || theme.cardBg || '#fff', border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-base tracking-tight" style={{ color: theme.text }}>{editingId ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg" style={{ color: theme.textMuted }}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Name *</label>
                <input type="text" placeholder={ph.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Role</label>
                <input type="text" placeholder={ph.role} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Phone</label>
                  <input type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Email</label>
                  <input type="email" placeholder="name@business.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Notes</label>
                <textarea placeholder={ph.notes} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none" style={inputStyle} />
              </div>
              {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}
              <button onClick={handleSave} disabled={saving} className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}{saving ? 'Saving...' : editingId ? 'Update' : 'Add Staff Member'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}