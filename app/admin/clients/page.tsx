'use client';

// ============================================================================
// CLIENTS PAGE (reskinned, emerald on white)
// All fetch, filter, and status-update logic is unchanged. Only the visual
// layer changed, and the inline formatPhone / getStatusColor were dropped in
// favor of the shared lib/admin/format and lib/admin/status helpers.
// ============================================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Filter, Phone, Building2, Loader2, ChevronRight, ChevronDown,
  MoreVertical, UserCheck, Ban, PhoneCall, FlaskConical, X,
} from 'lucide-react';
import { formatPhone, formatDate } from '@/lib/admin/format';
import { getStatusBadge } from '@/lib/admin/status';

interface Client {
  id: string;
  business_name: string;
  email: string;
  owner_name: string;
  owner_phone: string;
  vapi_phone_number: string | null;
  industry: string;
  plan_type: string;
  subscription_status: string;
  status: string;
  calls_this_month: number;
  monthly_call_limit: number;
  trial_ends_at: string | null;
  created_at: string;
  agency_id: string;
  is_test_client?: boolean;
  agencies: { id: string; name: string; slug: string };
}

export default function AdminClientsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { fetchClients(); }, [statusFilter]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      // Load the full client set so the list and header counts reflect every
      // client, not just the first page, and search runs over all of them.
      let url = `${backendUrl}/api/admin/clients?limit=1000`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to load clients');
      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Clients error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (clientId: string, newStatus: string, newSubStatus: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      await fetch(`${backendUrl}/api/admin/clients/${clientId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, subscription_status: newSubStatus }),
      });
      fetchClients();
      setActionMenu(null);
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const billableClients = clients.filter(c => !c.is_test_client);
  const testClients = clients.filter(c => c.is_test_client);

  // Live matcher shared by the table and the search typeahead. Matches business
  // name, email, owner, agency name, and the client / AI phone by digits.
  const matchClient = (c: Client, q: string) => {
    if (!q) return true;
    const t = q.trim().toLowerCase();
    const digits = t.replace(/\D/g, '');
    const phones = `${(c.owner_phone || '').replace(/\D/g, '')} ${(c.vapi_phone_number || '').replace(/\D/g, '')}`;
    return (
      (c.business_name || '').toLowerCase().includes(t) ||
      (c.email || '').toLowerCase().includes(t) ||
      (c.owner_name || '').toLowerCase().includes(t) ||
      (c.agencies?.name || '').toLowerCase().includes(t) ||
      (digits.length >= 3 && phones.includes(digits))
    );
  };

  const filteredClients = useMemo(() => clients.filter(c => matchClient(c, search)), [clients, search]);
  const suggestions = search.trim() ? filteredClients.slice(0, 7) : [];
  const showSuggestions = searchFocused && search.trim().length > 0 && suggestions.length > 0;

  const openClient = (id: string) => { setSearchFocused(false); setHighlightIndex(-1); router.push(`/admin/clients/${id}`); };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { if (highlightIndex >= 0 && suggestions[highlightIndex]) { e.preventDefault(); openClient(suggestions[highlightIndex].id); } }
    else if (e.key === 'Escape') { setSearchFocused(false); setHighlightIndex(-1); }
  };

  const badge = (status: string) => {
    const b = getStatusBadge(status);
    return (
      <span className="rounded-md border px-2 py-0.5 text-[10px] font-medium" style={{ color: b.color, background: b.bg, borderColor: b.border }}>
        {status || 'pending'}
      </span>
    );
  };

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-ink)]">Clients</h1>
        <p className="mt-1 text-sm text-[var(--a-dim)]">
          {billableClients.length} clients across all agencies
          {testClients.length > 0 && <span> &middot; <span className="text-[var(--a-violet)] font-semibold">{testClients.length} test</span></span>}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div ref={searchBoxRef} className="relative flex-1">
          <form onSubmit={(e) => { e.preventDefault(); setSearchFocused(false); setHighlightIndex(-1); setLoading(true); fetchClients(); }}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
            <input
              type="text"
              placeholder="Search by business, email, phone, or agency"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setHighlightIndex(-1); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
              onKeyDown={onSearchKeyDown}
              className="a-input !pl-10 !pr-9"
              autoComplete="off"
            />
            {search && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setSearch(''); setHighlightIndex(-1); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[var(--a-dim)] hover:text-[var(--a-muted)] hover:bg-[var(--a-em-soft)] transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl bg-white border border-[var(--a-line-2)] shadow-xl overflow-hidden max-h-[360px] overflow-y-auto">
              <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--a-dim)] border-b border-[var(--a-line)]">
                {suggestions.length} match{suggestions.length === 1 ? '' : 'es'}
              </div>
              {suggestions.map((c, i) => {
                const highlighted = i === highlightIndex;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlightIndex(i)}
                    onClick={() => openClient(c.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{ background: highlighted ? 'var(--a-em-soft)' : 'transparent' }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ background: c.is_test_client ? 'var(--a-violet-soft)' : 'var(--a-em-soft)' }}>
                      {c.is_test_client ? <FlaskConical className="h-3.5 w-3.5 text-[var(--a-violet)]" /> : <Users className="h-3.5 w-3.5 text-[var(--a-em-deep)]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-[var(--a-ink)] truncate">{c.business_name || 'Unnamed'}</span>
                        {c.is_test_client && <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-medium shrink-0" style={{ color: 'var(--a-violet)', background: 'var(--a-violet-soft)', borderColor: 'var(--a-violet-soft)' }}>Test</span>}
                      </span>
                      <span className="block text-[11px] text-[var(--a-dim)] truncate">
                        {[c.agencies?.name, c.email, c.vapi_phone_number ? formatPhone(c.vapi_phone_number) : null].filter(Boolean).join(' \u00b7 ')}
                      </span>
                    </span>
                    {badge(c.subscription_status)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative">
          <Filter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)] z-[1]" />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)] z-[1]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="a-input !pl-10 !pr-9 appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="trial_expired">Trial Expired</option>
            <option value="past_due">Past Due</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="a-panel">
        {loading ? (
          <div className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div>
        ) : filteredClients.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto mb-4" style={{ background: 'var(--a-em-soft)' }}>
              <Users className="h-7 w-7 text-[var(--a-em-deep)]" />
            </div>
            <p className="text-sm text-[var(--a-muted)]">{search ? 'No clients match your search' : 'No clients found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Client</th><th>Agency</th><th>Status</th><th>AI Phone</th>
                  <th>Calls</th><th>Created</th><th className="r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const isTest = client.is_test_client;
                  return (
                    <tr key={client.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background: isTest ? 'var(--a-violet-soft)' : 'var(--a-em-soft)' }}>
                            {isTest ? <FlaskConical className="h-4 w-4 text-[var(--a-violet)]" /> : <Users className="h-4 w-4 text-[var(--a-em-deep)]" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-semibold text-[var(--a-ink)]">{client.business_name}</p>
                              {isTest && <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-medium" style={{ color: 'var(--a-violet)', background: 'var(--a-violet-soft)', borderColor: 'var(--a-violet-soft)' }}>Test</span>}
                            </div>
                            <p className="text-[11px] text-[var(--a-dim)]">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Link href={`/admin/agencies?expand=${client.agency_id}`} className="flex items-center gap-1.5 text-[var(--a-muted)] hover:text-[var(--a-em-deep)] transition-colors">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="text-xs">{client.agencies?.name || 'Unknown'}</span>
                        </Link>
                      </td>
                      <td>{badge(client.subscription_status)}</td>
                      <td>
                        {client.vapi_phone_number ? (
                          <div className="flex items-center gap-1.5 text-[var(--a-muted)]">
                            <Phone className="h-3.5 w-3.5 text-[var(--a-em-deep)]" />
                            <span className="text-xs a-num">{formatPhone(client.vapi_phone_number)}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--a-dim)]">Not assigned</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-[var(--a-muted)]">
                          <PhoneCall className="h-3.5 w-3.5" />
                          <span className="text-xs a-num">{client.calls_this_month || 0} / {client.monthly_call_limit || (isTest ? 30 : 50)}</span>
                        </div>
                      </td>
                      <td className="text-xs text-[var(--a-dim)]">{formatDate(client.created_at)}</td>
                      <td className="r">
                        <div className="relative inline-block">
                          <button onClick={() => setActionMenu(actionMenu === client.id ? null : client.id)} className="p-1.5 hover:bg-[var(--a-em-soft)] rounded-lg transition-colors">
                            <MoreVertical className="h-4 w-4 text-[var(--a-dim)]" />
                          </button>
                          {actionMenu === client.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-[var(--a-line-2)] shadow-xl z-20 overflow-hidden">
                                <Link href={`/admin/clients/${client.id}`} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--a-muted)] hover:bg-[#F6FCF9]">
                                  <ChevronRight className="h-3.5 w-3.5" />View Details
                                </Link>
                                <div className="mx-2 border-t border-[var(--a-line)]" />
                                {client.status !== 'suspended' ? (
                                  <button onClick={() => handleStatusUpdate(client.id, 'suspended', 'canceled')} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] w-full text-left" style={{ color: 'var(--a-red)' }}>
                                    <Ban className="h-3.5 w-3.5" />Suspend Client
                                  </button>
                                ) : (
                                  <button onClick={() => handleStatusUpdate(client.id, 'active', 'active')} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] w-full text-left" style={{ color: 'var(--a-em-deep)' }}>
                                    <UserCheck className="h-3.5 w-3.5" />Activate Client
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && filteredClients.length > 0 && (<p className="mt-4 text-xs text-[var(--a-dim)]">Showing {filteredClients.length} client{filteredClients.length === 1 ? '' : 's'}</p>)}
    </div>
  );
}