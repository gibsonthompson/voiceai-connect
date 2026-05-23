'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Plus, Loader2, X, Check, Trash2, Clock, Shield,
  Pencil, ChevronDown, ChevronUp, Calendar, Users,
} from 'lucide-react';

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

interface ServiceItem {
  id: string;
  name: string;
  duration_minutes: number;
  buffer_minutes: number;
  booking_mode: string;
  assigned_staff: string[];
  is_active: boolean;
  sort_order: number;
}

interface Props {
  clientId: string;
  theme: any;
  compact?: boolean;
  industry?: string;
}

const BOOKING_MODES = [
  { value: 'auto_book', label: 'Auto-book', desc: 'AI books directly to calendar' },
  { value: 'collect_request', label: 'Collect request', desc: 'AI collects info, office confirms' },
  { value: 'disabled', label: 'No booking', desc: 'No scheduling for this service' },
];

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];
const BUFFER_OPTIONS = [0, 5, 10, 15, 30];

const INDUSTRY_SERVICE_EXAMPLES: Record<string, string> = {
  dental: 'e.g. Cleaning, Crown Prep, Root Canal, Whitening',
  medical_practice: 'e.g. Annual Physical, Follow-up Visit, Lab Work, Vaccination',
  mental_health: 'e.g. Initial Assessment, Therapy Session, Follow-up',
  veterinary: 'e.g. Wellness Exam, Vaccination, Surgery Consult, Grooming',
  chiropractic: 'e.g. Initial Consultation, Adjustment, X-Ray Review',
  optometry: 'e.g. Eye Exam, Contact Fitting, Frame Selection',
  physical_therapy: 'e.g. Evaluation, Treatment Session, Progress Check',
  salon_spa: 'e.g. Haircut, Color, Blowout, Facial, Manicure',
  legal: 'e.g. Initial Consultation, Case Review, Document Preparation',
  real_estate: 'e.g. Buyer Consultation, Listing Presentation, Showing',
  restaurant: 'e.g. Catering Quote, Private Event, Large Party Reservation',
  automotive: 'e.g. Oil Change, Brake Inspection, Diagnostic, Tire Rotation',
  home_services: 'e.g. Free Estimate, Inspection, Repair, Installation',
  fitness: 'e.g. Personal Training, Fitness Assessment, Group Class',
  healthcare: 'e.g. Consultation, Screening, Follow-up Appointment',
};
const DEFAULT_SERVICE_EXAMPLE = 'e.g. Consultation, Follow-up, Service Call';

const EMPTY_FORM = { name: '', duration_minutes: 30, buffer_minutes: 0, booking_mode: 'auto_book', assigned_staff: [] as string[] };

export default function ClientServicesSection({ clientId, theme, compact, industry }: Props) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [allStaff, setAllStaff] = useState<{ id: string; name: string }[]>([]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const servicePlaceholder = (industry && INDUSTRY_SERVICE_EXAMPLES[industry]) || DEFAULT_SERVICE_EXAMPLE;

  const fetchServices = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/client/${clientId}/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
        setStaffMap(data.staffMap || {});
      }
    } catch (e) {
      console.error('Failed to fetch services:', e);
    } finally {
      setLoading(false);
    }
  }, [clientId, backendUrl]);

  const fetchStaff = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/client/${clientId}/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllStaff((data.staff || []).filter((s: any) => s.is_active).map((s: any) => ({ id: s.id, name: s.name })));
      }
    } catch (e) {
      console.error('Failed to fetch staff for services:', e);
    }
  }, [clientId, backendUrl]);

  useEffect(() => { fetchServices(); fetchStaff(); }, [fetchServices, fetchStaff]);

  const openAdd = () => { setForm({ ...EMPTY_FORM, assigned_staff: [] }); setEditingId(null); setError(''); setShowModal(true); };
  const openEdit = (svc: ServiceItem) => { setForm({ name: svc.name, duration_minutes: svc.duration_minutes, buffer_minutes: svc.buffer_minutes, booking_mode: svc.booking_mode, assigned_staff: svc.assigned_staff || [] }); setEditingId(svc.id); setError(''); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Service name is required'); return; }
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingId ? `${backendUrl}/api/client/${clientId}/services/${editingId}` : `${backendUrl}/api/client/${clientId}/services`;
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name.trim(), duration_minutes: form.duration_minutes, buffer_minutes: form.buffer_minutes, booking_mode: form.booking_mode, assigned_staff: form.assigned_staff }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      setShowModal(false); fetchServices();
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this service?')) return;
    setDeletingId(id);
    try { const token = localStorage.getItem('auth_token'); await fetch(`${backendUrl}/api/client/${clientId}/services/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchServices(); } catch (e) { console.error('Delete failed:', e); }
    finally { setDeletingId(null); }
  };

  const toggleStaffAssignment = (staffId: string) => { setForm(prev => ({ ...prev, assigned_staff: prev.assigned_staff.includes(staffId) ? prev.assigned_staff.filter(id => id !== staffId) : [...prev.assigned_staff, staffId] })); };

  const getBookingModeStyle = (mode: string) => {
    if (mode === 'auto_book') return { bg: theme.isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', color: '#22c55e', label: 'Auto-book' };
    if (mode === 'collect_request') return { bg: theme.isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', color: '#3b82f6', label: 'Collect' };
    return { bg: theme.isDark ? 'rgba(107,114,128,0.1)' : '#f3f4f6', color: '#6b7280', label: 'No booking' };
  };

  const glass = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` };
  const inputStyle = { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`, color: theme.text };

  // ── Shared form fields (used by both modal and inline) ──────────────
  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Service Name *</label>
        <input type="text" placeholder={servicePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={inputStyle} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Duration</label>
          <select value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer" style={inputStyle}>{DURATION_OPTIONS.map(d => (<option key={d} value={d}>{d} minutes</option>))}</select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Buffer After</label>
          <select value={form.buffer_minutes} onChange={(e) => setForm({ ...form, buffer_minutes: parseInt(e.target.value) })} className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer" style={inputStyle}>{BUFFER_OPTIONS.map(b => (<option key={b} value={b}>{b === 0 ? 'No buffer' : `${b} minutes`}</option>))}</select>
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Booking Mode</label>
        <div className="space-y-2">
          {BOOKING_MODES.map(mode => (
            <button key={mode.value} onClick={() => setForm({ ...form, booking_mode: mode.value })} className="w-full text-left p-3 rounded-xl border-2 transition" style={{ borderColor: form.booking_mode === mode.value ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), backgroundColor: form.booking_mode === mode.value ? hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.03) : 'transparent' }}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: form.booking_mode === mode.value ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') }}>{form.booking_mode === mode.value && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.primary }} />}</div>
                <span className="text-xs font-medium" style={{ color: form.booking_mode === mode.value ? theme.primary : theme.text }}>{mode.label}</span>
              </div>
              <p className="text-[10px] mt-0.5 ml-6" style={{ color: theme.textMuted }}>{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>
      {allStaff.length > 0 && (
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Assigned Staff <span className="normal-case font-normal">(who performs this service)</span></label>
          <div className="flex flex-wrap gap-2">
            {allStaff.map(s => { const isAssigned = form.assigned_staff.includes(s.id); return (
              <button key={s.id} onClick={() => toggleStaffAssignment(s.id)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all" style={{ backgroundColor: isAssigned ? hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) : (theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6'), color: isAssigned ? theme.primary : theme.textMuted, border: `1px solid ${isAssigned ? hexToRgba(theme.primary, 0.3) : 'transparent'}` }}>{isAssigned ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}{s.name}</button>
            ); })}
          </div>
          {form.assigned_staff.length === 0 && <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>No staff assigned — any available provider can handle this service</p>}
        </div>
      )}
      {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}
      <button onClick={handleSave} disabled={saving} className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saving ? 'Saving...' : editingId ? 'Update Service' : 'Add Service'}</button>
    </div>
  );

  return (
    <section className={compact ? '' : 'mb-4 sm:mb-6'}>
      {!compact && (
        <h2 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: theme.text }}>
          <Briefcase className="w-4 h-4" style={{ color: theme.primary }} />Services
        </h2>
      )}
      {compact && (
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4" style={{ color: theme.primary }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>Services</span>
        </div>
      )}

      <div className={compact ? '' : 'rounded-xl border p-3 sm:p-4 shadow-sm'} style={compact ? {} : { borderColor: theme.border, backgroundColor: theme.card }}>
        {loading ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.textMuted }} /><span className="ml-2 text-xs" style={{ color: theme.textMuted }}>Loading services...</span></div>
        ) : (
          <>
            {/* Service list (hidden when inline form is open in compact mode) */}
            {!(compact && showModal) && (
              <>
                {services.length === 0 ? (
                  <div className="text-center py-6">
                    <Briefcase className="h-8 w-8 mx-auto mb-2" style={{ color: theme.textMuted, opacity: 0.2 }} />
                    <p className="text-xs" style={{ color: theme.textMuted }}>No services defined yet</p>
                    <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>Add services so your AI can ask callers what they need</p>
                  </div>
                ) : (
                  <div className="space-y-2 mb-3">
                    {services.map(svc => {
                      const modeStyle = getBookingModeStyle(svc.booking_mode);
                      const assignedNames = (svc.assigned_staff || []).map(id => staffMap[id]).filter(Boolean);
                      return (
                        <div key={svc.id} className="rounded-xl p-3 flex items-center gap-3 transition-all" style={{ ...glass, opacity: svc.is_active ? 1 : 0.5 }}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.12 : 0.06) }}><Briefcase className="h-4 w-4" style={{ color: theme.primary }} /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap"><p className="text-xs sm:text-sm font-medium truncate" style={{ color: theme.text }}>{svc.name}</p><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: modeStyle.bg, color: modeStyle.color }}>{modeStyle.label}</span></div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="text-[10px] flex items-center gap-1" style={{ color: theme.textMuted }}><Clock className="h-2.5 w-2.5" />{svc.duration_minutes}min</span>
                              {svc.buffer_minutes > 0 && <span className="text-[10px] flex items-center gap-1" style={{ color: theme.textMuted }}><Shield className="h-2.5 w-2.5" />{svc.buffer_minutes}min buffer</span>}
                              {assignedNames.length > 0 && <span className="text-[10px] flex items-center gap-1" style={{ color: theme.textMuted }}><Users className="h-2.5 w-2.5" />{assignedNames.join(', ')}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => openEdit(svc)} className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: theme.textMuted }} title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(svc.id)} disabled={deletingId === svc.id} className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: '#ef4444' }} title="Remove">{deletingId === svc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button onClick={openAdd} className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99]" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.05), color: theme.primary, border: `1px dashed ${hexToRgba(theme.primary, 0.3)}` }}><Plus className="h-3.5 w-3.5" /> Add Service</button>
              </>
            )}

            {/* ── Compact mode: inline form (replaces service list) ────── */}
            {showModal && compact && (
              <div className="rounded-xl p-4 sm:p-5" style={glass}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm" style={{ color: theme.text }}>{editingId ? 'Edit Service' : 'Add Service'}</h3>
                  <button onClick={() => setShowModal(false)} className="p-1 rounded-lg" style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>
                </div>
                {renderFormFields()}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Dashboard mode: modal overlay ────────────────────────────── */}
      {showModal && !compact && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto" style={{ backgroundColor: theme.card || theme.cardBg || '#fff', border: `1px solid ${theme.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-base tracking-tight" style={{ color: theme.text }}>{editingId ? 'Edit Service' : 'Add Service'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg" style={{ color: theme.textMuted }}><X className="h-5 w-5" /></button>
            </div>
            {renderFormFields()}
          </div>
        </div>
      )}
    </section>
  );
}