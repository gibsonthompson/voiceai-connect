'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, ChevronRight, Loader2, Phone, Mail,
  Plus, X, Tag, ArrowUpDown, Filter,
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
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return phone;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  new: { label: 'New', dot: '#3b82f6' },
  active: { label: 'Active', dot: '#10b981' },
  converted: { label: 'Converted', dot: '#8b5cf6' },
  inactive: { label: 'Inactive', dot: '#6b7280' },
};

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  tags: string[];
  total_calls: number;
  last_call_at: string | null;
  ai_summary: string | null;
  source: string;
  created_at: string;
}

interface Stats {
  total: number;
  new: number;
  active: number;
  converted: number;
  inactive: number;
}

export default function ClientContactsPage() {
  const { client, loading } = useClient();
  const theme = useClientTheme();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, active: 0, converted: 0, inactive: 0 });
  const [contactsLoading, setContactsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add contact form state
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchContacts = useCallback(async () => {
    if (!client) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

      const params = new URLSearchParams({
        sort: sortBy,
        limit: '100',
        offset: '0',
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`${backendUrl}/api/client/${client.id}/contacts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setStats(data.stats || { total: 0, new: 0, active: 0, converted: 0, inactive: 0 });
      }
    } catch (e) {
      console.error('Failed to fetch contacts:', e);
    } finally {
      setContactsLoading(false);
    }
  }, [client, sortBy, statusFilter, searchQuery]);

  useEffect(() => {
    if (client) {
      setContactsLoading(true);
      fetchContacts();
    }
  }, [client, fetchContacts]);

  const handleAddContact = async () => {
    if (!client || !addForm.phone.trim()) {
      setAddError('Phone number is required');
      return;
    }
    setAddLoading(true);
    setAddError('');
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${backendUrl}/api/client/${client.id}/contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addForm.name.trim() || 'Unknown',
          phone: addForm.phone.trim(),
          email: addForm.email.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAddError(data.error || 'Failed to add contact');
        return;
      }

      setShowAddModal(false);
      setAddForm({ name: '', phone: '', email: '' });
      fetchContacts();
    } catch {
      setAddError('Network error');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: theme.text }}>Contacts</h1>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {stats.total} total contacts from calls
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
          {[
            { label: 'New', value: stats.new, color: '#3b82f6', filterVal: 'new' },
            { label: 'Active', value: stats.active, color: '#10b981', filterVal: 'active' },
            { label: 'Converted', value: stats.converted, color: '#8b5cf6', filterVal: 'converted' },
            { label: 'Inactive', value: stats.inactive, color: '#6b7280', filterVal: 'inactive' },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setStatusFilter(statusFilter === s.filterVal ? 'all' : s.filterVal)}
              className="rounded-xl border p-3 sm:p-4 text-left transition-all"
              style={{
                borderColor: statusFilter === s.filterVal ? s.color : theme.border,
                backgroundColor: statusFilter === s.filterVal
                  ? hexToRgba(s.color, theme.isDark ? 0.15 : 0.05)
                  : theme.card,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs" style={{ color: theme.textMuted }}>{s.label}</span>
              </div>
              <p className="text-lg sm:text-xl font-semibold" style={{ color: theme.text }}>{s.value}</p>
            </button>
          ))}
        </div>
      )}

      {/* Search & Sort Bar */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted4 }} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 transition-colors"
            style={{ borderColor: theme.border, backgroundColor: theme.input, color: theme.text }}
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none appearance-none cursor-pointer"
          style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.textMuted }}
        >
          <option value="recent">Most Recent</option>
          <option value="calls">Most Calls</option>
          <option value="name">Name A-Z</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Contacts List */}
      <div
        className="rounded-xl border shadow-sm overflow-hidden"
        style={{ borderColor: theme.border, backgroundColor: theme.card }}
      >
        {contactsLoading ? (
          <div className="py-12 sm:py-20 flex items-center justify-center">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" style={{ color: theme.textMuted4 }} />
            <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading contacts...</span>
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-12 sm:py-20 text-center px-4">
            <div
              className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1) }}
            >
              <Users className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.textMuted4 }} />
            </div>
            <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: theme.textMuted }}>
              {searchQuery || statusFilter !== 'all' ? 'No matching contacts' : 'No contacts yet'}
            </p>
            <p className="text-xs sm:text-sm" style={{ color: theme.textMuted4 }}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Contacts are automatically created from incoming calls'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {contacts.map((contact) => {
              const statusConf = STATUS_CONFIG[contact.status] || STATUS_CONFIG.new;
              const tagColors: Record<string, string> = {
                emergency: '#ef4444',
                high_priority: '#f59e0b',
                repeat_caller: '#8b5cf6',
                appointment_booked: '#10b981',
              };

              return (
                <a
                  key={contact.id}
                  href={`/client/contacts/${contact.id}`}
                  className="block transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Mobile Layout */}
                  <div className="p-3 sm:hidden">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 text-sm font-semibold"
                        style={{
                          backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1),
                          color: theme.primary,
                        }}
                      >
                        {(contact.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-medium text-sm truncate" style={{ color: theme.text }}>
                            {contact.name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: statusConf.dot }}
                            />
                            <span className="text-[10px]" style={{ color: theme.textMuted4 }}>
                              {statusConf.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs truncate" style={{ color: theme.textMuted }}>
                          {formatPhone(contact.phone)}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px]" style={{ color: theme.textMuted4 }}>
                              {contact.total_calls} call{contact.total_calls !== 1 ? 's' : ''}
                            </span>
                            {contact.tags?.length > 0 && (
                              <div className="flex gap-1">
                                {contact.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full px-1.5 py-0.5 text-[8px] font-medium"
                                    style={{
                                      backgroundColor: hexToRgba(tagColors[tag] || theme.primary, 0.15),
                                      color: tagColors[tag] || theme.primary,
                                    }}
                                  >
                                    {tag.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] flex-shrink-0" style={{ color: theme.textMuted4 }}>
                            {contact.last_call_at ? timeAgo(contact.last_call_at) : '—'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className="h-4 w-4 flex-shrink-0 self-center"
                        style={{ color: theme.textMuted4 }}
                      />
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between p-4 lg:p-5">
                    <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
                      <div
                        className="flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-full flex-shrink-0 text-sm lg:text-base font-semibold"
                        style={{
                          backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1),
                          color: theme.primary,
                        }}
                      >
                        {(contact.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm lg:text-base truncate" style={{ color: theme.text }}>
                            {contact.name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: statusConf.dot }}
                            />
                            <span className="text-xs" style={{ color: theme.textMuted4 }}>
                              {statusConf.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs lg:text-sm" style={{ color: theme.textMuted }}>
                            {formatPhone(contact.phone)}
                          </span>
                          {contact.email && (
                            <span className="text-xs hidden lg:inline" style={{ color: theme.textMuted4 }}>
                              {contact.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                      {/* Tags */}
                      {contact.tags?.length > 0 && (
                        <div className="hidden lg:flex gap-1.5">
                          {contact.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor: hexToRgba(tagColors[tag] || theme.primary, 0.15),
                                color: tagColors[tag] || theme.primary,
                              }}
                            >
                              {tag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-right min-w-[70px]">
                        <p className="text-sm font-medium" style={{ color: theme.text }}>
                          {contact.total_calls} call{contact.total_calls !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs" style={{ color: theme.textMuted4 }}>
                          {contact.last_call_at ? timeAgo(contact.last_call_at) : 'No calls'}
                        </p>
                      </div>

                      <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: theme.textMuted4 }} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border p-5 sm:p-6"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-base" style={{ color: theme.text }}>
                Add Contact
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: theme.textMuted }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Contact name"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: theme.border, backgroundColor: theme.input, color: theme.text }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: theme.border, backgroundColor: theme.input, color: theme.text }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: theme.border, backgroundColor: theme.input, color: theme.text }}
                />
              </div>

              {addError && (
                <p className="text-sm" style={{ color: theme.error }}>
                  {addError}
                </p>
              )}

              <button
                onClick={handleAddContact}
                disabled={addLoading}
                className="w-full rounded-full px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}
              >
                {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {addLoading ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}