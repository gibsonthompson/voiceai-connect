'use client';

// ============================================================================
// AGENCIES PAGE (reskinned, emerald on white)
// Every feature preserved: enriched table, onboarding funnel, six summary
// tiles, expandable rows with the full detail grid, and the lazy-loaded
// checklist / test client / clients / SMS history / referral chain sections.
// The inline US_AREA_CODES map, formatters, and status/plan maps were removed
// in favor of lib/admin/format and lib/admin/status.
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Building2, Search, Filter, Users, ExternalLink, Loader2, ChevronDown, MoreVertical,
  UserCheck, Ban, Phone, DollarSign, Target, PhoneCall, Globe, Clock, CreditCard, Mail,
  Shield, TrendingUp, Calendar, Zap, Copy, Check, FlaskConical, MessageSquare,
  CheckCircle2, Circle, X,
} from 'lucide-react';
import {
  formatPhone, formatDate, formatDateTime, timeAgo, formatCurrencyCents,
  getCountryName, getPhoneLocation,
} from '@/lib/admin/format';
import {
  getStatusBadge, getPlanBadge, getPlanDisplayName, getSmsTypeLabel,
} from '@/lib/admin/status';

interface Agency { id: string; name: string; email: string; slug: string; phone: string | null; plan_type: string; subscription_status: string; status: string; stripe_charges_enabled: boolean; stripe_payouts_enabled: boolean; stripe_account_id: string | null; stripe_customer_id: string | null; stripe_subscription_id: string | null; stripe_onboarding_complete: boolean; onboarding_completed: boolean; onboarding_step: number | null; marketing_domain: string | null; domain_verified: boolean; primary_color: string | null; country: string | null; currency: string | null; timezone: string | null; trial_ends_at: string | null; current_period_end: string | null; last_login_at: string | null; created_at: string; referral_code: string | null; referred_by: string | null; referral_earnings_cents: number | null; referral_source: string | null; demo_phone_number: string | null; byot_enabled: boolean; abandoned_cart_step: number | null; abandoned_cart_last_sent_at: string | null; price_starter: number | null; price_pro: number | null; price_growth: number | null; limit_starter: number | null; limit_pro: number | null; limit_growth: number | null; client_count: number; call_count: number; lead_count: number; total_revenue: number; payment_count: number; user_count: number; }
interface Summary { total_agencies: number; active: number; trialing: number; past_due: number; canceled: number; pending: number; total_clients: number; total_calls: number; total_leads: number; total_revenue: number; stripe_connected: number; }
interface ExpandedData { clients: any[]; billable_client_count: number; sms_history: any[]; checklist: { items: Record<string, { done: boolean; label: string }>; done: number; total: number; complete: boolean }; test_client: { id: string; phone: string; calls_used: number; call_limit: number; status: string } | null; referral_chain: { referred_by: string | null; referred_agencies: any[]; earnings_cents: number }; activation: { step: number; last_sent: string | null; onboarding_completed_at: string | null } }

export default function AdminAgenciesPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Record<string, ExpandedData>>({});
  const [expandedLoading, setExpandedLoading] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { const expandId = searchParams.get('expand'); if (expandId) { setExpandedRow(expandId); fetchExpandedData(expandId); } }, [searchParams]);
  useEffect(() => { if (!loading && expandedRow && rowRefs.current[expandedRow]) { setTimeout(() => { rowRefs.current[expandedRow]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); } }, [loading, expandedRow, agencies]);
  useEffect(() => { fetchAgencies(); }, [statusFilter]);

  const fetchAgencies = async () => { try { const token = localStorage.getItem('admin_token'); const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''; let url = `${backendUrl}/api/admin/agencies?limit=100`; if (statusFilter) url += `&status=${statusFilter}`; if (search) url += `&search=${encodeURIComponent(search)}`; const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } }); if (!response.ok) throw new Error('Failed to load agencies'); const data = await response.json(); setAgencies(data.agencies || []); setSummary(data.summary || null); } catch (error) { console.error('Agencies error:', error); } finally { setLoading(false); } };

  const fetchExpandedData = async (agencyId: string) => {
    if (expandedData[agencyId]) return;
    setExpandedLoading(agencyId);
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/admin/agencies/${agencyId}/expanded`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setExpandedData(prev => ({ ...prev, [agencyId]: data })); }
    } catch (error) { console.error('Expanded data error:', error); }
    finally { setExpandedLoading(null); }
  };

  const handleExpand = (agencyId: string) => { if (expandedRow === agencyId) { setExpandedRow(null); } else { setExpandedRow(agencyId); fetchExpandedData(agencyId); } };
  // Force-open an agency's detail row (used by the search typeahead) and scroll to it.
  const openAgency = (agencyId: string) => {
    setExpandedRow(agencyId);
    fetchExpandedData(agencyId);
    setSearchFocused(false);
    setHighlightIndex(-1);
    setTimeout(() => { rowRefs.current[agencyId]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80);
  };
  const handleStatusUpdate = async (agencyId: string, newStatus: string, newSubStatus: string) => { try { const token = localStorage.getItem('admin_token'); const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''; await fetch(`${backendUrl}/api/admin/agencies/${agencyId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus, subscription_status: newSubStatus }) }); fetchAgencies(); setActionMenu(null); } catch (error) { console.error('Status update error:', error); } };
  const handleImpersonate = async (agencyId: string) => { try { const token = localStorage.getItem('admin_token'); const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''; const response = await fetch(`${backendUrl}/api/admin/agencies/${agencyId}/impersonate`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.loginUrl) window.open(data.loginUrl, '_blank'); setActionMenu(null); } catch (error) { console.error('Impersonate error:', error); } };
  const copyToClipboard = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  const getOnboardingLabel = (step: number | null) => { const labels: Record<number, string> = { 0: 'Not Started', 1: 'Agency Name', 2: 'Plan Selection', 3: 'Password Setup' }; return labels[step ?? 0] || `Step ${step}`; };

  // Single matcher used by both the table filter and the search typeahead so
  // they always agree. Matches name, email, slug, marketing domain, and the
  // phone by digits (so a formatted or raw query both work).
  const matchAgency = (a: Agency, q: string) => {
    if (!q) return true;
    const t = q.trim().toLowerCase();
    const digits = t.replace(/\D/g, '');
    const phoneDigits = (a.phone || '').replace(/\D/g, '');
    return (
      (a.name || '').toLowerCase().includes(t) ||
      (a.email || '').toLowerCase().includes(t) ||
      (a.slug || '').toLowerCase().includes(t) ||
      (a.marketing_domain || '').toLowerCase().includes(t) ||
      (digits.length >= 3 && phoneDigits.includes(digits))
    );
  };

  const filteredAgencies = agencies.filter(a => matchAgency(a, search));
  const suggestions = search.trim() ? filteredAgencies.slice(0, 7) : [];
  const showSuggestions = searchFocused && search.trim().length > 0 && suggestions.length > 0;

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { if (highlightIndex >= 0 && suggestions[highlightIndex]) { e.preventDefault(); openAgency(suggestions[highlightIndex].id); } }
    else if (e.key === 'Escape') { setSearchFocused(false); setHighlightIndex(-1); }
  };

  // ── Onboarding funnel (unchanged logic) ────────────────────────────────────
  const fnlTotal = agencies.length;
  const fnlCompleted = agencies.filter(a => a.onboarding_completed).length;
  const fnlNamed = agencies.filter(a => a.onboarding_completed || (a.onboarding_step ?? 0) >= 2).length;
  const fnlPreName = agencies.filter(a => !a.onboarding_completed && (a.onboarding_step ?? 0) < 2).length;
  const fnlPreFinish = agencies.filter(a => !a.onboarding_completed && (a.onboarding_step ?? 0) >= 2).length;
  const fnlBounced = fnlPreName + fnlPreFinish;
  const fnlPct = (n: number) => (fnlTotal > 0 ? Math.round((n / fnlTotal) * 100) : 0);

  // ── badge renderers using shared helpers ────────────────────────────────────
  const statusBadge = (status: string) => { const b = getStatusBadge(status); return (<span className="rounded-md border px-2 py-0.5 text-[10px] font-medium" style={{ color: b.color, background: b.bg, borderColor: b.border }}>{status || 'pending'}</span>); };
  const planBadge = (plan: string) => { const b = getPlanBadge(plan); return (<span className="rounded-md border px-2 py-0.5 text-[10px] font-medium" style={{ color: b.color, background: b.bg, borderColor: b.border }}>{getPlanDisplayName(plan)}</span>); };

  const label = "text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em]";
  const th = "text-left text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em] px-4 py-3.5";

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1400px]">
      <div className="mb-6"><h1 className="text-[22px] font-semibold text-[var(--a-ink)] tracking-tight">Agencies</h1><p className="mt-1 text-sm text-[var(--a-dim)]">Manage all platform agencies</p></div>

      {summary && (<div className="grid gap-3 grid-cols-2 lg:grid-cols-6 mb-6">
        <div className="a-card p-4"><p className={label}>Agencies</p><p className="mt-1.5 text-xl font-semibold text-[var(--a-ink)] a-num">{summary.total_agencies}</p><div className="mt-1 flex items-center gap-2 text-[11px]"><span className="text-[var(--a-em-deep)] font-semibold">{summary.active} active</span><span className="text-[var(--a-dim)]">&middot;</span><span className="text-[var(--a-cyan)] font-semibold">{summary.trialing} trial</span></div></div>
        <div className="a-card p-4"><p className={label}>Clients</p><p className="mt-1.5 text-xl font-semibold text-[var(--a-ink)] a-num">{summary.total_clients}</p><p className="mt-1 text-[11px] text-[var(--a-dim)]">across all agencies</p></div>
        <div className="a-card p-4"><p className={label}>Total Calls</p><p className="mt-1.5 text-xl font-semibold text-[var(--a-ink)] a-num">{summary.total_calls.toLocaleString()}</p><p className="mt-1 text-[11px] text-[var(--a-dim)]">all time</p></div>
        <div className="a-card p-4"><p className={label}>Leads</p><p className="mt-1.5 text-xl font-semibold text-[var(--a-ink)] a-num">{summary.total_leads}</p><p className="mt-1 text-[11px] text-[var(--a-dim)]">in CRM</p></div>
        <div className="a-card p-4"><p className={label}>Revenue</p><p className="mt-1.5 text-xl font-semibold text-[var(--a-em-deep)] a-num">{formatCurrencyCents(summary.total_revenue)}</p><p className="mt-1 text-[11px] text-[var(--a-dim)]">collected</p></div>
        <div className="a-card p-4"><p className={label}>Stripe</p><p className="mt-1.5 text-xl font-semibold text-[var(--a-ink)] a-num">{summary.stripe_connected}</p><p className="mt-1 text-[11px] text-[var(--a-dim)]">connected</p></div>
      </div>)}

      {!loading && fnlTotal > 0 && (
        <div className="a-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[13px] font-semibold text-[var(--a-ink)]">Onboarding Funnel</h2>
              <p className="text-[11px] text-[var(--a-dim)] mt-0.5">Where signups drop off before finishing password &amp; card{statusFilter ? ` \u00b7 filtered: ${statusFilter}` : ''}</p>
            </div>
            <span className="text-[11px] text-[var(--a-dim)]">{fnlTotal} loaded</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="a-card p-3.5">
              <p className={label}>Signed up</p>
              <p className="mt-1.5 text-2xl font-semibold text-[var(--a-ink)] a-num">{fnlTotal}</p>
              <p className="mt-1 text-[11px] text-[var(--a-dim)]">100%</p>
            </div>
            <div className="a-card p-3.5">
              <p className={label}>Named agency</p>
              <p className="mt-1.5 text-2xl font-semibold text-[var(--a-cyan)] a-num">{fnlNamed}</p>
              <p className="mt-1 text-[11px] text-[var(--a-dim)]">{fnlPct(fnlNamed)}% &middot; reached plan/password</p>
            </div>
            <div className="rounded-[18px] p-3.5 border" style={{ background: 'var(--a-em-soft)', borderColor: 'var(--a-em-line)' }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: 'var(--a-em-deep)' }}>Completed</p>
              <p className="mt-1.5 text-2xl font-semibold a-num" style={{ color: 'var(--a-em-deep)' }}>{fnlCompleted}</p>
              <p className="mt-1 text-[11px]" style={{ color: 'var(--a-em-deep)' }}>{fnlPct(fnlCompleted)}% &middot; password + card done</p>
            </div>
          </div>

          <div className="rounded-[14px] p-3.5 border" style={{ background: 'var(--a-amber-soft)', borderColor: '#F0DCA8' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" style={{ color: 'var(--a-amber)' }} />
                <p className="text-[12px] font-semibold" style={{ color: 'var(--a-amber)' }}>Bounced before password &amp; card</p>
              </div>
              <p className="text-lg font-semibold a-num" style={{ color: 'var(--a-amber)' }}>{fnlBounced}<span className="text-[12px] font-normal ml-1.5 opacity-70">{fnlPct(fnlBounced)}%</span></p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                <span className="text-[11px] text-[var(--a-muted)]">Named, never finished</span>
                <span className="text-[13px] font-semibold a-num" style={{ color: 'var(--a-amber)' }}>{fnlPreFinish}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                <span className="text-[11px] text-[var(--a-muted)]">Never named agency</span>
                <span className="text-[13px] font-semibold text-[var(--a-muted)] a-num">{fnlPreName}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search with live typeahead: matches name, email, phone, slug, and domain */}
        <div ref={searchBoxRef} className="relative flex-1">
          <form onSubmit={(e) => { e.preventDefault(); setSearchFocused(false); setHighlightIndex(-1); setLoading(true); fetchAgencies(); }}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)]" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or domain"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setHighlightIndex(-1); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
              onKeyDown={onSearchKeyDown}
              className="a-input pl-10 pr-9"
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
              {suggestions.map((a, i) => {
                const loc = getPhoneLocation(a.phone, a.country);
                const highlighted = i === highlightIndex;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlightIndex(i)}
                    onClick={() => openAgency(a.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{ background: highlighted ? 'var(--a-em-soft)' : 'transparent' }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 border border-[var(--a-line)] bg-white">
                      {a.primary_color ? <span className="h-3.5 w-3.5 rounded" style={{ backgroundColor: a.primary_color }} /> : <Building2 className="h-3.5 w-3.5 text-[var(--a-dim)]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-[var(--a-ink)] truncate">{a.name || 'Unnamed'}</span>
                        {planBadge(a.plan_type)}
                      </span>
                      <span className="block text-[11px] text-[var(--a-dim)] truncate">
                        {[a.email, a.phone ? formatPhone(a.phone) : null, loc].filter(Boolean).join(' \u00b7 ')}
                      </span>
                    </span>
                    {statusBadge(a.subscription_status || a.status)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Status filter: leading filter icon + trailing chevron (native arrow is hidden) */}
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)] z-[1]" />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--a-dim)] z-[1]" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }} className="a-input pl-10 pr-9 appearance-none cursor-pointer">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trial</option>
            <option value="past_due">Past Due</option>
            <option value="pending">Pending</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      <div className="a-panel">
        {loading ? (<div className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div>) : filteredAgencies.length === 0 ? (<div className="p-16 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto mb-4" style={{ background: 'var(--a-em-soft)' }}><Building2 className="h-7 w-7 text-[var(--a-em-deep)]" /></div><p className="text-sm text-[var(--a-muted)]">No agencies found</p></div>) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-[var(--a-line)]"><th className={th + ' px-6'}>Agency</th><th className={th}>Plan</th><th className={th}>Status</th><th className={th + ' text-center'}>Clients</th><th className={th + ' text-center'}>Calls</th><th className={th + ' text-center'}>Leads</th><th className={th + ' text-right'}>Revenue</th><th className={th}>Last Login</th><th className={th + ' text-right px-6'}>Actions</th></tr></thead>
            <tbody className="divide-y divide-[var(--a-line)]">
              {filteredAgencies.map((agency) => (
                <>
                <tr key={agency.id} ref={(el) => { rowRefs.current[agency.id] = el; }} className={`transition-colors cursor-pointer ${expandedRow === agency.id ? 'bg-[#F6FCF9]' : 'hover:bg-[#F6FCF9]'}`} onClick={() => handleExpand(agency.id)}>
                  <td className="px-6 py-3.5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 border border-[var(--a-line)] bg-white">{agency.primary_color ? (<div className="h-4 w-4 rounded" style={{ backgroundColor: agency.primary_color }} />) : (<Building2 className="h-4 w-4 text-[var(--a-dim)]" />)}</div><div className="min-w-0"><div className="flex items-center gap-1.5"><p className="text-[13px] font-semibold text-[var(--a-ink)] truncate">{agency.name}</p><ChevronDown className={`h-3 w-3 text-[var(--a-dim)] transition-transform shrink-0 ${expandedRow === agency.id ? 'rotate-180' : ''}`} /></div><p className="text-[11px] text-[var(--a-dim)] truncate">{agency.email}</p></div></div></td>
                  <td className="px-4 py-3.5">{planBadge(agency.plan_type)}</td>
                  <td className="px-4 py-3.5">{statusBadge(agency.subscription_status || agency.status)}</td>
                  <td className="px-3 py-3.5 text-center"><span className="text-xs text-[var(--a-muted)] a-num">{agency.client_count}</span></td>
                  <td className="px-3 py-3.5 text-center"><span className="text-xs text-[var(--a-muted)] a-num">{agency.call_count}</span></td>
                  <td className="px-3 py-3.5 text-center"><span className="text-xs text-[var(--a-muted)] a-num">{agency.lead_count}</span></td>
                  <td className="px-4 py-3.5 text-right"><span className="text-xs a-num" style={{ color: agency.total_revenue > 0 ? 'var(--a-em-deep)' : 'var(--a-dim)' }}>{agency.total_revenue > 0 ? formatCurrencyCents(agency.total_revenue) : '\u2013'}</span></td>
                  <td className="px-4 py-3.5"><span className="text-xs text-[var(--a-dim)]">{agency.last_login_at ? timeAgo(agency.last_login_at) : 'Never'}</span></td>
                  <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block"><button onClick={() => setActionMenu(actionMenu === agency.id ? null : agency.id)} className="p-1.5 hover:bg-[var(--a-em-soft)] rounded-lg transition-colors"><MoreVertical className="h-4 w-4 text-[var(--a-dim)]" /></button>
                      {actionMenu === agency.id && (<><div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} /><div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-[var(--a-line-2)] shadow-xl z-20 overflow-hidden">
                        <button onClick={() => { handleExpand(agency.id); setActionMenu(null); }} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--a-muted)] hover:bg-[#F6FCF9] w-full text-left"><ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedRow === agency.id ? 'rotate-180' : ''}`} />{expandedRow === agency.id ? 'Collapse Details' : 'View Details'}</button>
                        <button onClick={() => handleImpersonate(agency.id)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--a-muted)] hover:bg-[#F6FCF9] w-full text-left"><ExternalLink className="h-3.5 w-3.5" />Login as Agency</button>
                        {agency.marketing_domain && (<a href={`https://${agency.marketing_domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-[var(--a-muted)] hover:bg-[#F6FCF9]"><Globe className="h-3.5 w-3.5" />Visit Site</a>)}
                        <div className="mx-2 border-t border-[var(--a-line)]" />
                        {agency.status !== 'suspended' ? (<button onClick={() => handleStatusUpdate(agency.id, 'suspended', 'canceled')} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] w-full text-left" style={{ color: 'var(--a-red)' }}><Ban className="h-3.5 w-3.5" />Suspend Agency</button>) : (<button onClick={() => handleStatusUpdate(agency.id, 'active', 'active')} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] w-full text-left" style={{ color: 'var(--a-em-deep)' }}><UserCheck className="h-3.5 w-3.5" />Activate Agency</button>)}
                      </div></>)}
                    </div>
                  </td>
                </tr>

                {expandedRow === agency.id && (<tr key={`${agency.id}-detail`}><td colSpan={9} className="px-6 py-0"><div className="py-5 border-t border-[var(--a-line)]">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Contact */}
                    <div className="space-y-3"><h4 className={label}>Contact</h4><div className="space-y-2 text-[13px]"><div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span className="text-[var(--a-muted)] truncate">{agency.email}</span></div>{agency.phone && (<div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span className="text-[var(--a-muted)]">{formatPhone(agency.phone)}</span>{getPhoneLocation(agency.phone, agency.country) && (<span className="text-[var(--a-dim)] text-[11px]">&middot; {getPhoneLocation(agency.phone, agency.country)}</span>)}</div>)}{agency.country && (<div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span className="text-[var(--a-muted)]">{getCountryName(agency.country)} {agency.currency ? `(${agency.currency.toUpperCase()})` : ''}</span></div>)}{agency.timezone && (<div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span className="text-[var(--a-muted)]">{agency.timezone}</span></div>)}</div></div>

                    {/* Billing */}
                    <div className="space-y-3"><h4 className={label}>Billing</h4><div className="space-y-2 text-[13px]"><div className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span style={{ color: agency.stripe_charges_enabled ? 'var(--a-em-deep)' : 'var(--a-dim)' }}>{agency.stripe_charges_enabled ? 'Charges Enabled' : 'Charges Off'}</span></div><div className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span style={{ color: agency.stripe_payouts_enabled ? 'var(--a-em-deep)' : 'var(--a-dim)' }}>{agency.stripe_payouts_enabled ? 'Payouts Enabled' : 'Payouts Off'}</span></div><div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span style={{ color: agency.stripe_onboarding_complete ? 'var(--a-em-deep)' : 'var(--a-dim)' }}>{agency.stripe_onboarding_complete ? 'Connect Onboarded' : 'Connect Incomplete'}</span></div>{agency.stripe_account_id && (<button onClick={() => copyToClipboard(agency.stripe_account_id!, `stripe-${agency.id}`)} className="flex items-center gap-2 text-[var(--a-dim)] hover:text-[var(--a-muted)] transition-colors">{copiedId === `stripe-${agency.id}` ? (<Check className="h-3.5 w-3.5" style={{ color: 'var(--a-em-deep)' }} />) : (<Copy className="h-3.5 w-3.5" />)}<span className="text-[11px] font-mono truncate">{agency.stripe_account_id.slice(0, 20)}...</span></button>)}{agency.current_period_end && (<div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span className="text-[var(--a-dim)] text-[11px]">Period ends: {formatDate(agency.current_period_end)}</span></div>)}{agency.trial_ends_at && (<div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" style={{ color: 'var(--a-cyan)' }} /><span className="text-[11px]" style={{ color: 'var(--a-cyan)' }}>Trial ends: {formatDate(agency.trial_ends_at)}</span></div>)}{(agency.price_starter || agency.price_pro || agency.price_growth) && (<div className="pt-2 mt-2 border-t border-[var(--a-line)]"><p className={label + ' mb-1.5'}>Client Pricing</p><div className="space-y-1 text-[11px]"><div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Starter</span><span className="text-[var(--a-muted)] a-num">{agency.price_starter ? formatCurrencyCents(agency.price_starter) : '\u2013'}/mo<span className="text-[var(--a-dim)] ml-1">({agency.limit_starter ?? 0} calls)</span></span></div><div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Pro</span><span className="text-[var(--a-muted)] a-num">{agency.price_pro ? formatCurrencyCents(agency.price_pro) : '\u2013'}/mo<span className="text-[var(--a-dim)] ml-1">({agency.limit_pro ?? 0} calls)</span></span></div><div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Growth</span><span className="text-[var(--a-muted)] a-num">{agency.price_growth ? formatCurrencyCents(agency.price_growth) : '\u2013'}/mo<span className="text-[var(--a-dim)] ml-1">({agency.limit_growth === -1 ? '\u221e' : agency.limit_growth ?? 0} calls)</span></span></div></div></div>)}</div></div>

                    {/* Platform */}
                    <div className="space-y-3"><h4 className={label}>Platform</h4><div className="space-y-2 text-[13px]">{agency.slug && (<div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span className="text-[var(--a-dim)] text-[11px] font-mono">/{agency.slug}</span></div>)}{agency.marketing_domain && (<div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-[var(--a-dim)]" /><a href={`https://${agency.marketing_domain}`} target="_blank" rel="noopener noreferrer" className="text-[11px] hover:underline" style={{ color: 'var(--a-em-deep)' }}>{agency.marketing_domain}</a>{agency.domain_verified && (<Shield className="h-3 w-3" style={{ color: 'var(--a-em-deep)' }} />)}</div>)}<div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span style={{ color: agency.onboarding_completed ? 'var(--a-em-deep)' : 'var(--a-amber)' }}>{agency.onboarding_completed ? 'Onboarding Complete' : `Stalled: ${getOnboardingLabel(agency.onboarding_step)} (${agency.onboarding_step || 0}/3)`}</span></div>{!agency.onboarding_completed && agency.abandoned_cart_step && agency.abandoned_cart_step > 0 && (<div className="flex items-center gap-2"><Target className="h-3.5 w-3.5" style={{ color: 'var(--a-amber)' }} /><span className="text-[11px]" style={{ color: 'var(--a-amber)' }}>Recovery SMS: {agency.abandoned_cart_step}/5 sent{agency.abandoned_cart_last_sent_at && (<> &middot; {timeAgo(agency.abandoned_cart_last_sent_at)}</>)}</span></div>)}{agency.demo_phone_number && (<div className="flex items-center gap-2"><PhoneCall className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span className="text-[var(--a-dim)] text-[11px]">Demo: {agency.demo_phone_number}</span></div>)}{agency.byot_enabled && (<span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px]" style={{ background: 'var(--a-violet-soft)', color: 'var(--a-violet)' }}>BYOT Enabled</span>)}{agency.referral_source && (<div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-[var(--a-dim)]" /><span className="text-[var(--a-muted)] text-[11px] capitalize">{agency.referral_source.replace(/_/g, ' ')}</span></div>)}</div></div>

                    {/* Usage */}
                    <div className="space-y-3"><h4 className={label}>Usage</h4><div className="space-y-1.5 text-[13px]"><div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Users</span><span className="text-[var(--a-muted)] a-num">{agency.user_count}</span></div><div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Clients</span><span className="text-[var(--a-muted)] a-num">{agency.client_count}</span></div><div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Total Calls</span><span className="text-[var(--a-muted)] a-num">{agency.call_count}</span></div><div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Leads</span><span className="text-[var(--a-muted)] a-num">{agency.lead_count}</span></div><div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Revenue</span><span className="a-num" style={{ color: 'var(--a-em-deep)' }}>{formatCurrencyCents(agency.total_revenue)}</span></div><div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Payments</span><span className="text-[var(--a-muted)] a-num">{agency.payment_count}</span></div>{agency.referral_code && (<div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Referral</span><span className="text-[var(--a-dim)] text-[11px] font-mono">{agency.referral_code}</span></div>)}{agency.referral_code && agency.referral_earnings_cents != null && agency.referral_earnings_cents > 0 && (<div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Ref. Earnings</span><span className="a-num text-[11px]" style={{ color: 'var(--a-em-deep)' }}>{formatCurrencyCents(agency.referral_earnings_cents)}</span></div>)}{agency.referred_by && (<div className="flex items-center justify-between"><span className="text-[var(--a-dim)]">Referred By</span><span className="text-[var(--a-dim)] text-[11px] font-mono truncate max-w-[120px]">{agency.referred_by}</span></div>)}</div><div className="pt-2 border-t border-[var(--a-line)] text-[11px] text-[var(--a-dim)]">Created: {formatDateTime(agency.created_at)}{agency.last_login_at && (<> &middot; Last login: {timeAgo(agency.last_login_at)}</>)}</div></div>
                  </div>

                  {expandedLoading === agency.id && (
                    <div className="mt-5 pt-5 border-t border-[var(--a-line)] flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--a-em)]" />
                    </div>
                  )}

                  {expandedData[agency.id] && (
                    <div className="mt-5 pt-5 border-t border-[var(--a-line)] space-y-5">
                      {/* Setup Checklist */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="h-3.5 w-3.5" style={{ color: 'var(--a-em-deep)' }} />
                          <h4 className={label}>Setup Checklist</h4>
                          <span className="text-[10px] text-[var(--a-dim)]">{expandedData[agency.id].checklist.done}/{expandedData[agency.id].checklist.total}</span>
                          {expandedData[agency.id].checklist.complete && <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)', borderColor: 'var(--a-em-line)' }}>Complete</span>}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {Object.entries(expandedData[agency.id].checklist.items).filter(([key]) => key !== 'stripe_charges').map(([key, item]) => (
                            <div key={key} className="flex items-center gap-1.5">
                              {item.done ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--a-em-deep)' }} /> : <Circle className="h-3.5 w-3.5 text-[var(--a-dim)]" />}
                              <span className={`text-[11px] ${item.done ? 'text-[var(--a-dim)] line-through' : 'text-[var(--a-muted)]'}`}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                        {expandedData[agency.id].activation.step > 0 && (
                          <p className="text-[10px] text-[var(--a-dim)] mt-2">Activation SMS: step {expandedData[agency.id].activation.step}/9{expandedData[agency.id].activation.last_sent && ` \u00b7 last sent ${timeAgo(expandedData[agency.id].activation.last_sent!)}`}</p>
                        )}
                      </div>

                      {/* Test Client */}
                      {expandedData[agency.id].test_client && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FlaskConical className="h-3.5 w-3.5" style={{ color: 'var(--a-violet)' }} />
                            <h4 className={label}>Test Client</h4>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] flex-wrap">
                            <span className="text-[var(--a-muted)]">{expandedData[agency.id].test_client!.phone || 'No phone'}</span>
                            <span className="text-[var(--a-muted)]">Calls: {expandedData[agency.id].test_client!.calls_used}/{expandedData[agency.id].test_client!.call_limit}</span>
                            {(() => { const b = getStatusBadge(expandedData[agency.id].test_client!.status); return (<span className="rounded-md border px-1.5 py-0.5 text-[9px] font-medium" style={{ color: b.color, background: b.bg, borderColor: b.border }}>{expandedData[agency.id].test_client!.status}</span>); })()}
                          </div>
                        </div>
                      )}

                      {/* Clients */}
                      {expandedData[agency.id].clients.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-3.5 w-3.5" style={{ color: 'var(--a-em-deep)' }} />
                            <h4 className={label}>Clients</h4>
                            <span className="text-[10px] text-[var(--a-dim)]">{expandedData[agency.id].billable_client_count} billable</span>
                          </div>
                          <div className="space-y-1">
                            {expandedData[agency.id].clients.map((client: any) => (
                              <div key={client.id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-white border border-[var(--a-line)]">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md shrink-0" style={{ background: client.is_test_client ? 'var(--a-violet-soft)' : 'var(--a-em-soft)' }}>
                                    {client.is_test_client ? <FlaskConical className="h-3 w-3" style={{ color: 'var(--a-violet)' }} /> : <span className="text-[9px] font-semibold" style={{ color: 'var(--a-em-deep)' }}>{client.business_name?.charAt(0)}</span>}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-medium text-[var(--a-muted)]">{client.business_name}</span>
                                      {client.is_test_client && <span className="text-[8px] px-1 py-0.5 rounded-full border" style={{ background: 'var(--a-violet-soft)', color: 'var(--a-violet)', borderColor: 'var(--a-violet-soft)' }}>Test</span>}
                                    </div>
                                    {client.industry && <span className="text-[10px] text-[var(--a-dim)] capitalize">{client.industry}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-[10px]">
                                  {client.vapi_phone_number && <span className="text-[var(--a-dim)] a-num">{formatPhone(client.vapi_phone_number)}</span>}
                                  <span className="text-[var(--a-dim)] a-num">{client.calls_this_month || 0} calls</span>
                                  {(() => { const b = getStatusBadge(client.subscription_status); return (<span className="rounded-md border px-1.5 py-0.5 font-medium" style={{ color: b.color, background: b.bg, borderColor: b.border }}>{client.subscription_status}</span>); })()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SMS History */}
                      {expandedData[agency.id].sms_history.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-3.5 w-3.5" style={{ color: 'var(--a-cyan)' }} />
                            <h4 className={label}>SMS History</h4>
                            <span className="text-[10px] text-[var(--a-dim)]">Last {expandedData[agency.id].sms_history.length}</span>
                          </div>
                          <div className="space-y-1">
                            {expandedData[agency.id].sms_history.map((sms: any) => {
                              const typeInfo = getSmsTypeLabel(sms.message_type);
                              const del = getStatusBadge(sms.delivery_status === 'delivered' ? 'active' : sms.delivery_status);
                              const ok = sms.delivery_status === 'sent' || sms.delivery_status === 'delivered';
                              return (
                                <div key={sms.id} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-white border border-[var(--a-line)]">
                                  <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-medium shrink-0" style={{ backgroundColor: typeInfo.bg, borderColor: typeInfo.border, color: typeInfo.color }}>{typeInfo.label}</span>
                                  <span className="text-[10px] text-[var(--a-dim)] truncate flex-1">{sms.message_body?.slice(0, 80)}...</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ color: ok ? 'var(--a-em-deep)' : 'var(--a-red)', background: ok ? 'var(--a-em-soft)' : 'var(--a-red-soft)' }}>{sms.delivery_status}</span>
                                  <span className="text-[10px] text-[var(--a-dim)] shrink-0 a-num">{timeAgo(sms.created_at)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Referral Chain */}
                      {(expandedData[agency.id].referral_chain.referred_agencies.length > 0 || expandedData[agency.id].referral_chain.referred_by) && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--a-amber)' }} />
                            <h4 className={label}>Referral Chain</h4>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            {expandedData[agency.id].referral_chain.referred_by && (
                              <div className="text-[var(--a-dim)]">Referred by: <span className="text-[var(--a-muted)] font-mono">{expandedData[agency.id].referral_chain.referred_by}</span></div>
                            )}
                            {expandedData[agency.id].referral_chain.referred_agencies.map((ref: any) => (
                              <div key={ref.id} className="flex items-center justify-between rounded-lg px-3 py-1.5 bg-white border border-[var(--a-line)]">
                                <span className="text-[var(--a-muted)]">{ref.name}</span>
                                <div className="flex items-center gap-2">
                                  {(() => { const b = getStatusBadge(ref.subscription_status); return (<span className="rounded-md border px-1.5 py-0.5 text-[9px] font-medium" style={{ color: b.color, background: b.bg, borderColor: b.border }}>{ref.subscription_status}</span>); })()}
                                  <span className="text-[var(--a-dim)]">{timeAgo(ref.created_at)}</span>
                                </div>
                              </div>
                            ))}
                            {expandedData[agency.id].referral_chain.earnings_cents > 0 && (
                              <div className="text-[var(--a-dim)] mt-1">Total earnings: <span style={{ color: 'var(--a-em-deep)' }}>{formatCurrencyCents(expandedData[agency.id].referral_chain.earnings_cents)}</span></div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-[var(--a-line)] flex items-center gap-3"><span className="text-[10px] text-[var(--a-dim)]">ID:</span><button onClick={() => copyToClipboard(agency.id, `id-${agency.id}`)} className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--a-dim)] hover:text-[var(--a-muted)] transition-colors">{agency.id}{copiedId === `id-${agency.id}` ? (<Check className="h-3 w-3" style={{ color: 'var(--a-em-deep)' }} />) : (<Copy className="h-3 w-3" />)}</button></div>
                </div></td></tr>)}
                </>
              ))}
            </tbody></table>
          </div>
        )}
      </div>
      {!loading && filteredAgencies.length > 0 && (<p className="mt-4 text-xs text-[var(--a-dim)]">Showing {filteredAgencies.length} agenc{filteredAgencies.length === 1 ? 'y' : 'ies'}</p>)}
    </div>
  );
}