'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, User, PhoneCall,
  MessageSquare, Clock, Loader2, ChevronRight,
  Edit3, Check, X,
} from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPhone(phone: string): string {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function formatDuration(s: number): string { return `${Math.floor(s / 60)}m ${s % 60}s`; }

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: '#3b82f6' },
  { value: 'active', label: 'Active', color: '#10b981' },
  { value: 'converted', label: 'Converted', color: '#8b5cf6' },
  { value: 'inactive', label: 'Inactive', color: '#6b7280' },
];

const TAG_COLORS: Record<string, string> = { emergency: '#ef4444', high_priority: '#f59e0b', repeat_caller: '#8b5cf6', appointment_booked: '#10b981' };

interface Contact { id: string; name: string; phone: string; email: string | null; address: string | null; status: string; tags: string[]; total_calls: number; last_call_at: string | null; ai_summary: string | null; notes: string | null; source: string; created_at: string; }
interface Call { id: string; customer_name: string | null; customer_phone: string | null; caller_phone: string | null; service_requested: string | null; urgency_level: string | null; ai_summary: string | null; duration_seconds: number | null; created_at: string; }

const ANIM_CSS = `@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .45s ease-out both}.fu1{animation-delay:40ms}.fu2{animation-delay:80ms}.fu3{animation-delay:120ms}`;

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;
  const { client, loading } = useClient();
  const theme = useClientTheme();
  const [contact, setContact] = useState<Contact | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (client && contactId) fetchContact(); }, [client, contactId]);

  const fetchContact = async () => {
    if (!client || !contactId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/client/${client.id}/contacts/${contactId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { window.location.href = '/client/contacts'; return; }
      const data = await response.json();
      setContact(data.contact); setCalls(data.calls || []); setNotesValue(data.contact.notes || ''); setNameValue(data.contact.name || '');
    } catch (error) { console.error('Error:', error); window.location.href = '/client/contacts'; }
    finally { setPageLoading(false); }
  };

  const updateContact = async (updates: Record<string, any>) => {
    if (!client || !contact) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/client/${client.id}/contacts/${contact.id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
      });
      if (response.ok) { const data = await response.json(); setContact(data.contact); }
    } catch (error) { console.error('Error updating:', error); }
    finally { setSaving(false); }
  };

  const glass = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
    WebkitBackdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
  };

  const InfoRow = ({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) => (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
        style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6' }}>
        <Icon className="h-4 w-4" style={{ color: theme.textMuted }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: theme.textMuted4 }}>{label}</p>
        {href ? <a href={href} className="text-[13px] sm:text-sm hover:underline truncate block" style={{ color: theme.primary }}>{value}</a>
          : <p className="text-[13px] sm:text-sm truncate" style={{ color: theme.text }}>{value}</p>}
      </div>
    </div>
  );

  if (loading || !client) return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /></div>;
  if (pageLoading) return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /><span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading contact...</span></div>;
  if (!contact) return <div className="p-6 text-center min-h-screen" style={{ backgroundColor: theme.bg }}><p style={{ color: theme.textMuted }}>Contact not found</p><a href="/client/contacts" className="text-sm mt-2 inline-block" style={{ color: theme.primary }}>← Back</a></div>;

  const currentStatus = STATUS_OPTIONS.find(s => s.value === contact.status) || STATUS_OPTIONS[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS + `.cr{transition:background .15s ease}.cr:hover{background:${theme.hover} !important}` }} />

      <a href="/client/contacts" className="inline-flex items-center gap-1.5 text-sm transition hover:opacity-80 mb-4 sm:mb-6 fu fu1" style={{ color: theme.textMuted }}>
        <ArrowLeft className="h-4 w-4" /> Back to Contacts
      </a>

      {/* Header */}
      <div className="mb-5 sm:mb-7 fu fu1">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full flex-shrink-0 text-lg sm:text-xl font-bold"
              style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.12 : 0.06), color: theme.primary }}>
              {(contact.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={nameValue} onChange={(e) => setNameValue(e.target.value)} autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') { updateContact({ name: nameValue.trim() }); setEditingName(false); } if (e.key === 'Escape') setEditingName(false); }}
                    className="rounded-xl px-3 py-1.5 text-lg font-semibold focus:outline-none" style={{ ...glass, color: theme.text }} />
                  <button onClick={() => { updateContact({ name: nameValue.trim() }); setEditingName(false); }} className="p-1" style={{ color: theme.success }}><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingName(false)} className="p-1" style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight truncate" style={{ color: theme.text }}>{contact.name || 'Unknown'}</h1>
                  <button onClick={() => { setNameValue(contact.name || ''); setEditingName(true); }} className="p-1 rounded" style={{ color: theme.textMuted4 }}><Edit3 className="h-3.5 w-3.5" /></button>
                </div>
              )}
              <p className="text-[13px]" style={{ color: theme.textMuted }}>{formatPhone(contact.phone)} · {contact.total_calls} call{contact.total_calls !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => updateContact({ status: opt.value })}
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all"
                style={{
                  backgroundColor: contact.status === opt.value ? hexToRgba(opt.color, theme.isDark ? 0.15 : 0.1) : 'transparent',
                  color: contact.status === opt.value ? opt.color : theme.textMuted4,
                  border: `1px solid ${contact.status === opt.value ? hexToRgba(opt.color, 0.3) : theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* AI Summary */}
          {contact.ai_summary && (
            <div className="rounded-2xl p-5 sm:p-6 fu fu2" style={glass}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06) }}>
                  <MessageSquare className="h-5 w-5" style={{ color: theme.primary }} />
                </div>
                <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight" style={{ color: theme.text }}>AI Call Summaries</h2>
              </div>
              <div className="space-y-2.5">
                {contact.ai_summary.split('\n\n').map((entry, i) => (
                  <div key={i} className="rounded-xl p-3.5" style={{ backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : '#f9fafb', border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : '#e5e7eb'}` }}>
                    <p className="text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>{entry}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call History */}
          <div className="rounded-2xl overflow-hidden fu fu2" style={glass}>
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5"
              style={{ borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
              <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight" style={{ color: theme.text }}>Call History ({calls.length})</h2>
            </div>

            {calls.length === 0 ? (
              <div className="py-14 text-center">
                <PhoneCall className="h-8 w-8 mx-auto mb-3" style={{ color: theme.textMuted4 }} />
                <p className="text-sm" style={{ color: theme.textMuted }}>No calls recorded yet</p>
              </div>
            ) : (
              <div>
                {calls.map((call, idx) => {
                  const urgColor = (call.urgency_level === 'high' || call.urgency_level === 'emergency') ? theme.error : call.urgency_level === 'medium' ? theme.warning : theme.primary;
                  const urgBg = (call.urgency_level === 'high' || call.urgency_level === 'emergency') ? theme.errorBg : call.urgency_level === 'medium' ? theme.warningBg : hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06);

                  return (
                    <a key={call.id} href={`/client/calls/${call.id}`} className="block cr"
                      style={{ borderBottom: idx < calls.length - 1 ? `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none' }}>
                      <div className="flex items-start gap-3 px-5 sm:px-6 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 mt-0.5" style={{ backgroundColor: urgBg }}>
                          <PhoneCall className="h-4 w-4" style={{ color: urgColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="text-[13px] font-medium truncate" style={{ color: theme.text }}>{call.service_requested || 'General inquiry'}</p>
                              <span className="rounded-full px-2 py-[2px] text-[10px] font-semibold flex-shrink-0" style={{ backgroundColor: urgBg, color: urgColor }}>
                                {call.urgency_level || 'normal'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {call.duration_seconds && <span className="text-[11px]" style={{ color: theme.textMuted4 }}>{formatDuration(call.duration_seconds)}</span>}
                              <ChevronRight className="h-3.5 w-3.5" style={{ color: theme.textMuted4 }} />
                            </div>
                          </div>
                          {call.ai_summary && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: theme.textMuted }}>{call.ai_summary}</p>}
                          <p className="text-[10px] mt-1.5" style={{ color: theme.textMuted4 }}>
                            {new Date(call.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-5">

          {/* Contact Info */}
          <div className="rounded-2xl p-5 sm:p-6 fu fu2" style={glass}>
            <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight mb-4" style={{ color: theme.text }}>Contact Info</h2>
            <div className="space-y-3.5">
              <InfoRow icon={Phone} label="Phone" value={formatPhone(contact.phone)} href={`tel:${contact.phone}`} />
              {contact.email && <InfoRow icon={Mail} label="Email" value={contact.email} href={`mailto:${contact.email}`} />}
              {contact.address && <InfoRow icon={MapPin} label="Address" value={contact.address} />}
              <InfoRow icon={Clock} label="First Contact" value={new Date(contact.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
              {contact.source && <InfoRow icon={User} label="Source" value={contact.source.replace(/_/g, ' ')} />}
            </div>
          </div>

          {/* Tags */}
          {contact.tags?.length > 0 && (
            <div className="rounded-2xl p-5 sm:p-6 fu fu3" style={glass}>
              <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight mb-3" style={{ color: theme.text }}>Tags</h2>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map(tag => (
                  <span key={tag} className="rounded-full px-3 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: hexToRgba(TAG_COLORS[tag] || theme.primary, 0.12), color: TAG_COLORS[tag] || theme.primary }}>
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="rounded-2xl p-5 sm:p-6 fu fu3" style={glass}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight" style={{ color: theme.text }}>Notes</h2>
              {!editingNotes && <button onClick={() => setEditingNotes(true)} className="p-1 rounded" style={{ color: theme.textMuted4 }}><Edit3 className="h-4 w-4" /></button>}
            </div>
            {editingNotes ? (
              <div>
                <textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} rows={4} autoFocus placeholder="Add notes about this contact..."
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none" style={{ ...glass, color: theme.text }} />
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => { updateContact({ notes: notesValue }); setEditingNotes(false); }} disabled={saving}
                    className="rounded-xl px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1 transition"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                  </button>
                  <button onClick={() => { setNotesValue(contact.notes || ''); setEditingNotes(false); }}
                    className="rounded-xl px-3.5 py-1.5 text-xs font-medium" style={{ color: theme.textMuted, ...glass }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[13px] leading-relaxed" style={{ color: contact.notes ? theme.textMuted : theme.textMuted4 }}>
                {contact.notes || 'No notes yet. Tap edit to add some.'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2.5 fu fu3">
            <a href={`tel:${contact.phone}`}
              className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              <Phone className="h-4 w-4" /> Call {contact.name !== 'Unknown' ? contact.name.split(' ')[0] : 'Contact'}
            </a>
            {contact.email && (
              <a href={`mailto:${contact.email}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium transition"
                style={{ ...glass, color: theme.textMuted }}>
                <Mail className="h-4 w-4" /> Send Email
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}