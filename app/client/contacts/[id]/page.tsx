'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, User, PhoneCall,
  MessageSquare, Tag, Clock, Loader2, ChevronRight,
  Edit3, Check, X, Trash2, AlertCircle,
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
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return phone;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: '#3b82f6' },
  { value: 'active', label: 'Active', color: '#10b981' },
  { value: 'converted', label: 'Converted', color: '#8b5cf6' },
  { value: 'inactive', label: 'Inactive', color: '#6b7280' },
];

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  status: string;
  tags: string[];
  total_calls: number;
  last_call_at: string | null;
  ai_summary: string | null;
  notes: string | null;
  source: string;
  created_at: string;
}

interface Call {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  caller_phone: string | null;
  service_requested: string | null;
  urgency_level: string | null;
  ai_summary: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;
  const { client, loading } = useClient();
  const theme = useClientTheme();

  const [contact, setContact] = useState<Contact | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Edit states
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client && contactId) fetchContact();
  }, [client, contactId]);

  const fetchContact = async () => {
    if (!client || !contactId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/client/${client.id}/contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        window.location.href = '/client/contacts';
        return;
      }
      const data = await response.json();
      setContact(data.contact);
      setCalls(data.calls || []);
      setNotesValue(data.contact.notes || '');
      setNameValue(data.contact.name || '');
    } catch (error) {
      console.error('Error loading contact:', error);
      window.location.href = '/client/contacts';
    } finally {
      setPageLoading(false);
    }
  };

  const updateContact = async (updates: Record<string, any>) => {
    if (!client || !contact) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/client/${client.id}/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const data = await response.json();
        setContact(data.contact);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateContact({ status: newStatus });
  };

  const handleSaveNotes = () => {
    updateContact({ notes: notesValue });
    setEditingNotes(false);
  };

  const handleSaveName = () => {
    if (nameValue.trim()) {
      updateContact({ name: nameValue.trim() });
    }
    setEditingName(false);
  };

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} />
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} />
        <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading contact...</span>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-4 sm:p-8 text-center min-h-screen" style={{ backgroundColor: theme.bg }}>
        <p style={{ color: theme.textMuted }}>Contact not found</p>
        <a href="/client/contacts" className="text-sm mt-2 inline-block" style={{ color: theme.primary }}>
          ← Back to Contacts
        </a>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === contact.status) || STATUS_OPTIONS[0];

  const tagColors: Record<string, string> = {
    emergency: '#ef4444',
    high_priority: '#f59e0b',
    repeat_caller: '#8b5cf6',
    appointment_booked: '#10b981',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Back Button */}
      <a
        href="/client/contacts"
        className="inline-flex items-center gap-2 text-sm transition-colors mb-4 sm:mb-6 hover:opacity-80"
        style={{ color: theme.textMuted }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contacts
      </a>

      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full flex-shrink-0 text-lg sm:text-xl font-semibold"
              style={{
                backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1),
                color: theme.primary,
              }}
            >
              {(contact.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="rounded-lg border px-2 py-1 text-lg font-semibold focus:outline-none focus:ring-2"
                    style={{ borderColor: theme.border, backgroundColor: theme.input, color: theme.text }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                  />
                  <button onClick={handleSaveName} className="p-1" style={{ color: theme.success }}>
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="p-1" style={{ color: theme.textMuted }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1
                    className="text-lg sm:text-xl lg:text-2xl font-semibold truncate"
                    style={{ color: theme.text }}
                  >
                    {contact.name || 'Unknown'}
                  </h1>
                  <button
                    onClick={() => {
                      setNameValue(contact.name || '');
                      setEditingName(true);
                    }}
                    className="p-1 rounded transition-colors"
                    style={{ color: theme.textMuted4 }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <p className="text-sm" style={{ color: theme.textMuted }}>
                {formatPhone(contact.phone)} · {contact.total_calls} call
                {contact.total_calls !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-2 self-start">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className="rounded-full px-3 py-1.5 text-xs font-medium border transition-all"
                style={{
                  borderColor: contact.status === opt.value ? opt.color : theme.border,
                  backgroundColor:
                    contact.status === opt.value
                      ? hexToRgba(opt.color, theme.isDark ? 0.2 : 0.1)
                      : 'transparent',
                  color: contact.status === opt.value ? opt.color : theme.textMuted4,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column — Call Timeline */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* AI Summary (rolling) */}
          {contact.ai_summary && (
            <div
              className="rounded-xl border p-4 sm:p-6 shadow-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.card }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1) }}
                >
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.primary }} />
                </div>
                <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>
                  AI Call Summaries
                </h2>
              </div>
              <div className="space-y-3">
                {contact.ai_summary.split('\n\n').map((entry, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-3"
                    style={{ borderColor: theme.border, backgroundColor: theme.bg }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                      {entry}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call Timeline */}
          <div
            className="rounded-xl border shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.card }}
          >
            <div
              className="flex items-center justify-between border-b p-4 sm:p-6"
              style={{ borderColor: theme.border }}
            >
              <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>
                Call History ({calls.length})
              </h2>
            </div>

            {calls.length === 0 ? (
              <div className="py-12 text-center px-4">
                <PhoneCall className="h-8 w-8 mx-auto mb-3" style={{ color: theme.textMuted4 }} />
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  No calls recorded yet
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: theme.border }}>
                {calls.map((call) => {
                  const urgColor =
                    call.urgency_level === 'high' || call.urgency_level === 'emergency'
                      ? theme.error
                      : call.urgency_level === 'medium'
                      ? theme.warning
                      : theme.primary;
                  const urgBg =
                    call.urgency_level === 'high' || call.urgency_level === 'emergency'
                      ? theme.errorBg
                      : call.urgency_level === 'medium'
                      ? theme.warningBg
                      : hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1);

                  return (
                    <a
                      key={call.id}
                      href={`/client/calls/${call.id}`}
                      className="block transition-colors"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.hover)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: urgBg }}
                          >
                            <PhoneCall className="h-4 w-4" style={{ color: urgColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: theme.text }}>
                                  {call.service_requested || 'General inquiry'}
                                </p>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0"
                                  style={{ backgroundColor: urgBg, color: urgColor }}
                                >
                                  {call.urgency_level || 'normal'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {call.duration_seconds && (
                                  <span className="text-xs" style={{ color: theme.textMuted4 }}>
                                    {formatDuration(call.duration_seconds)}
                                  </span>
                                )}
                                <ChevronRight className="h-4 w-4" style={{ color: theme.textMuted4 }} />
                              </div>
                            </div>
                            {call.ai_summary && (
                              <p
                                className="text-xs leading-relaxed line-clamp-2"
                                style={{ color: theme.textMuted }}
                              >
                                {call.ai_summary}
                              </p>
                            )}
                            <p className="text-[10px] mt-1.5" style={{ color: theme.textMuted4 }}>
                              {new Date(call.created_at).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Contact Info & Notes */}
        <div className="space-y-4 sm:space-y-6">
          {/* Contact Info Card */}
          <div
            className="rounded-xl border p-4 sm:p-6 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.card }}
          >
            <h2 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4" style={{ color: theme.text }}>
              Contact Info
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: theme.bg }}
                >
                  <Phone className="h-4 w-4" style={{ color: theme.textMuted }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>
                    Phone
                  </p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-xs sm:text-sm transition-colors hover:underline"
                    style={{ color: theme.primary }}
                  >
                    {formatPhone(contact.phone)}
                  </a>
                </div>
              </div>

              {contact.email && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <Mail className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>
                      Email
                    </p>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-xs sm:text-sm transition-colors hover:underline truncate block"
                      style={{ color: theme.primary }}
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}

              {contact.address && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <MapPin className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>
                      Address
                    </p>
                    <p className="text-xs sm:text-sm" style={{ color: theme.text }}>
                      {contact.address}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: theme.bg }}
                >
                  <Clock className="h-4 w-4" style={{ color: theme.textMuted }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>
                    First Contact
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: theme.text }}>
                    {new Date(contact.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {contact.source && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <User className="h-4 w-4" style={{ color: theme.textMuted }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted4 }}>
                      Source
                    </p>
                    <p className="text-xs sm:text-sm capitalize" style={{ color: theme.text }}>
                      {contact.source.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {contact.tags?.length > 0 && (
            <div
              className="rounded-xl border p-4 sm:p-6 shadow-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.card }}
            >
              <h2 className="font-semibold text-sm sm:text-base mb-3" style={{ color: theme.text }}>
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: hexToRgba(tagColors[tag] || theme.primary, 0.15),
                      color: tagColors[tag] || theme.primary,
                    }}
                  >
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div
            className="rounded-xl border p-4 sm:p-6 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.card }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>
                Notes
              </h2>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="p-1 rounded transition-colors"
                  style={{ color: theme.textMuted4 }}
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
            </div>

            {editingNotes ? (
              <div>
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this contact..."
                  className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
                  style={{ borderColor: theme.border, backgroundColor: theme.input, color: theme.text }}
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={saving}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setNotesValue(contact.notes || '');
                      setEditingNotes(false);
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors"
                    style={{ borderColor: theme.border, color: theme.textMuted }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: contact.notes ? theme.textMuted : theme.textMuted4 }}>
                {contact.notes || 'No notes yet. Click the edit icon to add some.'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 sm:space-y-3">
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center justify-center gap-2 w-full rounded-full px-4 py-2.5 sm:py-3 text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            >
              <Phone className="h-4 w-4" />
              Call {contact.name !== 'Unknown' ? contact.name.split(' ')[0] : 'Contact'}
            </a>
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center justify-center gap-2 w-full rounded-full border px-4 py-2.5 sm:py-3 text-sm font-medium transition-colors"
                style={{ borderColor: theme.border, color: theme.textMuted, backgroundColor: 'transparent' }}
              >
                <Mail className="h-4 w-4" />
                Send Email
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}