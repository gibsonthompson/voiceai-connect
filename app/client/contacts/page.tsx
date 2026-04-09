'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, ChevronRight, Loader2, Phone, Mail,
  Plus, X,
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
  if (d.length === 11 && d.startsWith('1')) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  new: { label: 'New', dot: '#3b82f6' },
  active: { label: 'Active', dot: '#10b981' },
  converted: { label: 'Converted', dot: '#8b5cf6' },
  inactive: { label: 'Inactive', dot: '#6b7280' },
};

const TAG_COLORS: Record<string, string> = {
  emergency: '#ef4444', high_priority: '#f59e0b', repeat_caller: '#8b5cf6', appointment_booked: '#10b981',
};

interface Contact { id: string; name: string; phone: string; email: string | null; status: string; tags: string[]; total_calls: number; last_call_at: string | null; ai_summary: string | null; source: string; created_at: string; }
interface Stats { total: number; new: number; active: number; converted: number; inactive: number; }

const ANIM_CSS = `@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .45s ease-out both}.fu1{animation-delay:40ms}.fu2{animation-delay:80ms}.fu3{animation-delay:120ms}`;

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
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchContacts = useCallback(async () => {
    if (!client) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const params = new URLSearchParams({ sort: sortBy, limit: '100', offset: '0' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      const response = await fetch(`${backendUrl}/api/client/${client.id}/contacts?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setContacts(data.contacts || []); setStats(data.stats || { total: 0, new: 0, active: 0, converted: 0, inactive: 0 }); }
    } catch (e) { console.error('Failed to fetch contacts:', e); }
    finally { setContactsLoading(false); }
  }, [client, sortBy, statusFilter, searchQuery]);

  useEffect(() => { if (client) { setContactsLoading(true); fetchContacts(); } }, [client, fetchContacts]);

  const handleAddContact = async () => {
    if (!client || !addForm.phone.trim()) { setAddError('Phone number is required'); return; }
    setAddLoading(true); setAddError('');
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${backendUrl}/api/client/${client.id}/contacts`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addForm.name.trim() || 'Unknown', phone: addForm.phone.trim(), email: addForm.email.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) { setAddError(data.error || 'Failed to add contact'); return; }
      setShowAddModal(false); setAddForm({ name: '', phone: '', email: '' }); fetchContacts();
    } catch { setAddError('Network error'); }
    finally { setAddLoading(false); }
  };

  const glass = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
    WebkitBackdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
  };

  if (loading || !client) return <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: theme.bg }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted4 }} /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS + `.cr{transition:background .15s ease}.cr:hover{background:${theme.hover} !important}` }} />

      {/* Header */}
      <div className="mb-5 sm:mb-7 fu fu1">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Contacts</h1>
            <p className="mt-0.5 text-[13px]" style={{ color: theme.textMuted }}>{stats.total} total from calls</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            <Plus className="h-4 w-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 sm:mb-7 fu fu1">
          {[
            { label: 'New', value: stats.new, color: '#3b82f6', key: 'new' },
            { label: 'Active', value: stats.active, color: '#10b981', key: 'active' },
            { label: 'Converted', value: stats.converted, color: '#8b5cf6', key: 'converted' },
            { label: 'Inactive', value: stats.inactive, color: '#6b7280', key: 'inactive' },
          ].map(s => (
            <button key={s.key} onClick={() => setStatusFilter(statusFilter === s.key ? 'all' : s.key)}
              className="rounded-2xl p-3.5 sm:p-4 text-left transition-all"
              style={{
                ...glass,
                borderColor: statusFilter === s.key ? s.color : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                backgroundColor: statusFilter === s.key ? hexToRgba(s.color, theme.isDark ? 0.12 : 0.06) : glass.backgroundColor,
              }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] font-medium" style={{ color: theme.textMuted }}>{s.label}</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: theme.text, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
            </button>
          ))}
        </div>
      )}

      {/* Search + Sort */}
      <div className="flex items-center gap-3 mb-5 sm:mb-7 fu fu2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted4 }} />
          <input type="text" placeholder="Search contacts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all" style={{ ...glass, color: theme.text }} />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm focus:outline-none cursor-pointer"
          style={{ ...glass, color: theme.textMuted }}>
          <option value="recent">Most Recent</option>
          <option value="calls">Most Calls</option>
          <option value="name">Name A-Z</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Contacts List */}
      <div className="rounded-2xl overflow-hidden fu fu2" style={glass}>
        {contactsLoading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted4 }} />
            <span className="ml-2 text-sm" style={{ color: theme.textMuted }}>Loading contacts...</span>
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
              style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.05) }}>
              <Users className="h-7 w-7" style={{ color: theme.textMuted4 }} />
            </div>
            <p className="font-medium text-sm" style={{ color: theme.textMuted }}>{searchQuery || statusFilter !== 'all' ? 'No matching contacts' : 'No contacts yet'}</p>
            <p className="text-xs mt-1" style={{ color: theme.textMuted4 }}>{searchQuery || statusFilter !== 'all' ? 'Try adjusting your search' : 'Contacts are created automatically from calls'}</p>
          </div>
        ) : (
          <div>
            {contacts.map((contact, idx) => {
              const sc = STATUS_CONFIG[contact.status] || STATUS_CONFIG.new;
              return (
                <a key={contact.id} href={`/client/contacts/${contact.id}`}
                  className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3.5 sm:py-4 cr"
                  style={{ borderBottom: idx < contacts.length - 1 ? `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none' }}>

                  {/* Avatar */}
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full flex-shrink-0 text-sm font-semibold"
                    style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.12 : 0.06), color: theme.primary }}>
                    {(contact.name || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-[13px] sm:text-sm truncate" style={{ color: theme.text }}>{contact.name || 'Unknown'}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.dot }} />
                        <span className="text-[10px] font-medium hidden sm:inline" style={{ color: theme.textMuted4 }}>{sc.label}</span>
                      </div>
                    </div>
                    <p className="text-[11px] sm:text-xs truncate" style={{ color: theme.textMuted }}>{formatPhone(contact.phone)}</p>
                    <div className="flex items-center gap-2 mt-1 sm:hidden">
                      <span className="text-[10px]" style={{ color: theme.textMuted4 }}>{contact.total_calls} call{contact.total_calls !== 1 ? 's' : ''}</span>
                      {contact.tags?.length > 0 && contact.tags.slice(0, 1).map(tag => (
                        <span key={tag} className="rounded-full px-1.5 py-0.5 text-[8px] font-semibold"
                          style={{ backgroundColor: hexToRgba(TAG_COLORS[tag] || theme.primary, 0.12), color: TAG_COLORS[tag] || theme.primary }}>
                          {tag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Desktop: tags + calls + time */}
                  <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                    {contact.tags?.length > 0 && (
                      <div className="hidden lg:flex gap-1.5">
                        {contact.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: hexToRgba(TAG_COLORS[tag] || theme.primary, 0.12), color: TAG_COLORS[tag] || theme.primary }}>
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-right min-w-[60px]">
                      <p className="text-sm font-medium" style={{ color: theme.text, fontVariantNumeric: 'tabular-nums' }}>{contact.total_calls}</p>
                      <p className="text-[10px]" style={{ color: theme.textMuted4 }}>{contact.last_call_at ? timeAgo(contact.last_call_at) : '—'}</p>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted4 }} />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 sm:p-6"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-base tracking-tight" style={{ color: theme.text }}>Add Contact</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg" style={{ color: theme.textMuted }}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>Name</label>
                <input type="text" placeholder="Contact name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={{ ...glass, color: theme.text }} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>Phone *</label>
                <input type="tel" placeholder="(555) 123-4567" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={{ ...glass, color: theme.text }} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>Email</label>
                <input type="email" placeholder="email@example.com" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none" style={{ ...glass, color: theme.text }} />
              </div>
              {addError && <p className="text-sm" style={{ color: theme.error }}>{addError}</p>}
              <button onClick={handleAddContact} disabled={addLoading}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
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