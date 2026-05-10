'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Search, Filter, Users, ExternalLink, Loader2, ChevronRight, ChevronDown, MoreVertical, UserCheck, Ban, Phone, DollarSign, Target, PhoneCall, Globe, Clock, CreditCard, Mail, Shield, TrendingUp, BarChart3, Calendar, Zap, Copy, Check, FlaskConical, MessageSquare, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

interface Agency { id: string; name: string; email: string; slug: string; phone: string | null; plan_type: string; subscription_status: string; status: string; stripe_charges_enabled: boolean; stripe_payouts_enabled: boolean; stripe_account_id: string | null; stripe_customer_id: string | null; stripe_subscription_id: string | null; stripe_onboarding_complete: boolean; onboarding_completed: boolean; onboarding_step: number | null; marketing_domain: string | null; domain_verified: boolean; primary_color: string | null; country: string | null; currency: string | null; timezone: string | null; trial_ends_at: string | null; current_period_end: string | null; last_login_at: string | null; created_at: string; referral_code: string | null; referred_by: string | null; referral_earnings_cents: number | null; referral_source: string | null; demo_phone_number: string | null; byot_enabled: boolean; abandoned_cart_step: number | null; abandoned_cart_last_sent_at: string | null; price_starter: number | null; price_pro: number | null; price_growth: number | null; limit_starter: number | null; limit_pro: number | null; limit_growth: number | null; client_count: number; call_count: number; lead_count: number; total_revenue: number; payment_count: number; user_count: number; }
interface Summary { total_agencies: number; active: number; trialing: number; past_due: number; canceled: number; pending: number; total_clients: number; total_calls: number; total_leads: number; total_revenue: number; stripe_connected: number; }
interface ExpandedData { clients: any[]; billable_client_count: number; sms_history: any[]; checklist: { items: Record<string, { done: boolean; label: string }>; done: number; total: number; complete: boolean }; test_client: { id: string; phone: string; calls_used: number; call_limit: number; status: string } | null; referral_chain: { referred_by: string | null; referred_agencies: any[]; earnings_cents: number }; activation: { step: number; last_sent: string | null; onboarding_completed_at: string | null } }

const US_AREA_CODES: Record<string, string> = {
  '201':'Jersey City, NJ','202':'Washington, DC','205':'Birmingham, AL','206':'Seattle, WA','210':'San Antonio, TX','212':'New York, NY','213':'Los Angeles, CA','214':'Dallas, TX','215':'Philadelphia, PA','216':'Cleveland, OH','224':'Chicago Suburbs, IL','225':'Baton Rouge, LA','234':'Akron, OH','239':'Fort Myers, FL','248':'Troy, MI','251':'Mobile, AL','253':'Tacoma, WA','254':'Killeen, TX','256':'Huntsville, AL','267':'Philadelphia, PA','281':'Houston, TX','301':'Maryland','303':'Denver, CO','305':'Miami, FL','310':'Los Angeles, CA','312':'Chicago, IL','313':'Detroit, MI','314':'St. Louis, MO','315':'Syracuse, NY','317':'Indianapolis, IN','321':'Orlando, FL','323':'Los Angeles, CA','330':'Akron, OH','334':'Montgomery, AL','336':'Greensboro, NC','346':'Houston, TX','347':'New York, NY','352':'Gainesville, FL','385':'Salt Lake City, UT','401':'Rhode Island','402':'Omaha, NE','404':'Atlanta, GA','405':'Oklahoma City, OK','407':'Orlando, FL','408':'San Jose, CA','410':'Baltimore, MD','412':'Pittsburgh, PA','414':'Milwaukee, WI','415':'San Francisco, CA','423':'Chattanooga, TN','424':'Los Angeles, CA','425':'Bellevue, WA','469':'Dallas, TX','470':'Atlanta, GA','478':'Macon, GA','480':'Mesa, AZ','501':'Little Rock, AR','502':'Louisville, KY','503':'Portland, OR','504':'New Orleans, LA','505':'Albuquerque, NM','508':'Worcester, MA','510':'Oakland, CA','512':'Austin, TX','513':'Cincinnati, OH','515':'Des Moines, IA','516':'Hempstead, NY','518':'Albany, NY','520':'Tucson, AZ','530':'Redding, CA','540':'Roanoke, VA','551':'Jersey City, NJ','559':'Fresno, CA','561':'West Palm Beach, FL','562':'Long Beach, CA','571':'Virginia','585':'Rochester, NY','586':'Warren, MI','601':'Jackson, MS','602':'Phoenix, AZ','612':'Minneapolis, MN','614':'Columbus, OH','615':'Nashville, TN','616':'Grand Rapids, MI','617':'Boston, MA','619':'San Diego, CA','623':'Phoenix, AZ','626':'Pasadena, CA','628':'San Francisco, CA','629':'Nashville, TN','646':'New York, NY','650':'San Mateo, CA','651':'St. Paul, MN','657':'Anaheim, CA','661':'Bakersfield, CA','669':'San Jose, CA','678':'Atlanta, GA','682':'Fort Worth, TX','702':'Las Vegas, NV','703':'Virginia','704':'Charlotte, NC','706':'Augusta, GA','708':'Chicago Suburbs, IL','713':'Houston, TX','714':'Anaheim, CA','716':'Buffalo, NY','717':'Harrisburg, PA','718':'New York, NY','719':'Colorado Springs, CO','720':'Denver, CO','725':'Las Vegas, NV','727':'St. Petersburg, FL','732':'New Brunswick, NJ','734':'Ann Arbor, MI','737':'Austin, TX','747':'Los Angeles, CA','754':'Fort Lauderdale, FL','757':'Virginia Beach, VA','760':'Oceanside, CA','770':'Atlanta Suburbs, GA','773':'Chicago, IL','775':'Reno, NV','786':'Miami, FL','801':'Salt Lake City, UT','803':'Columbia, SC','804':'Richmond, VA','805':'Santa Barbara, CA','808':'Hawaii','813':'Tampa, FL','816':'Kansas City, MO','817':'Fort Worth, TX','818':'Burbank, CA','828':'Asheville, NC','832':'Houston, TX','843':'Charleston, SC','847':'Chicago Suburbs, IL','850':'Tallahassee, FL','857':'Boston, MA','858':'San Diego, CA','859':'Lexington, KY','862':'Newark, NJ','863':'Lakeland, FL','864':'Greenville, SC','865':'Knoxville, TN','872':'Chicago, IL','901':'Memphis, TN','903':'Tyler, TX','904':'Jacksonville, FL','907':'Alaska','909':'San Bernardino, CA','910':'Fayetteville, NC','912':'Savannah, GA','913':'Kansas City, KS','914':'Westchester, NY','915':'El Paso, TX','916':'Sacramento, CA','917':'New York, NY','918':'Tulsa, OK','919':'Raleigh, NC','925':'Concord, CA','929':'New York, NY','936':'Conroe, TX','937':'Dayton, OH','941':'Sarasota, FL','949':'Irvine, CA','951':'Riverside, CA','954':'Fort Lauderdale, FL','970':'Fort Collins, CO','971':'Portland, OR','972':'Dallas, TX','973':'Newark, NJ','980':'Charlotte, NC','984':'Raleigh, NC',
};

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
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

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
      if (response.ok) {
        const data = await response.json();
        setExpandedData(prev => ({ ...prev, [agencyId]: data }));
      }
    } catch (error) { console.error('Expanded data error:', error); }
    finally { setExpandedLoading(null); }
  };

  const handleExpand = (agencyId: string) => {
    if (expandedRow === agencyId) { setExpandedRow(null); } else { setExpandedRow(agencyId); fetchExpandedData(agencyId); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setLoading(true); fetchAgencies(); };
  const handleStatusUpdate = async (agencyId: string, newStatus: string, newSubStatus: string) => { try { const token = localStorage.getItem('admin_token'); const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''; await fetch(`${backendUrl}/api/admin/agencies/${agencyId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus, subscription_status: newSubStatus }) }); fetchAgencies(); setActionMenu(null); } catch (error) { console.error('Status update error:', error); } };
  const handleImpersonate = async (agencyId: string) => { try { const token = localStorage.getItem('admin_token'); const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ''; const response = await fetch(`${backendUrl}/api/admin/agencies/${agencyId}/impersonate`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); const data = await response.json(); if (data.loginUrl) window.open(data.loginUrl, '_blank'); setActionMenu(null); } catch (error) { console.error('Impersonate error:', error); } };
  const copyToClipboard = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDateTime = (date: string) => new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const timeAgo = (date: string) => { const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000); if (seconds < 60) return 'just now'; if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`; if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`; return formatDate(date); };
  const formatCurrency = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
  const getCountryName = (code: string) => { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || code; } catch { return code; } };
  const formatPhone = (phone: string): string => { if (!phone) return '—'; const digits = phone.replace(/\D/g, ''); if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`; if (digits.length === 11 && digits.startsWith('1')) return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`; if (digits.length > 10) return `+${digits.slice(0, digits.length - 10)} ${digits.slice(-10, -7)} ${digits.slice(-7, -4)} ${digits.slice(-4)}`; return phone; };
  const getPhoneLocation = (phone: string, countryCode?: string | null): string | null => { if (!phone) return null; const digits = phone.replace(/\D/g, ''); let areaCode = ''; if (digits.length === 10) areaCode = digits.slice(0, 3); else if (digits.length === 11 && digits.startsWith('1')) areaCode = digits.slice(1, 4); if (areaCode && US_AREA_CODES[areaCode]) return US_AREA_CODES[areaCode]; if (countryCode) { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode.toUpperCase()) || null; } catch { return null; } } return null; };
  const getStatusColor = (status: string) => { switch (status) { case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'; case 'trialing': case 'trial': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'; case 'past_due': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'; case 'canceled': case 'suspended': return 'bg-red-500/10 text-red-400 border-red-500/20'; case 'pending': case 'pending_payment': return 'bg-white/[0.04] text-white/40 border-white/[0.06]'; default: return 'bg-white/[0.04] text-white/40 border-white/[0.06]'; } };
  const getPlanBadge = (plan: string) => { const colors: Record<string, string> = { free: 'bg-white/[0.04] text-white/40 border-white/[0.06]', pro: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', scale: 'bg-violet-500/10 text-violet-400 border-violet-500/20', starter: 'bg-white/[0.04] text-white/40 border-white/[0.06]', professional: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', enterprise: 'bg-violet-500/10 text-violet-400 border-violet-500/20' }; return colors[plan] || colors.free; };
  const getPlanDisplayName = (plan: string) => { const names: Record<string, string> = { free: 'Free', pro: 'Pro', scale: 'Scale', starter: 'Free', professional: 'Pro', enterprise: 'Scale' }; return names[plan] || plan || 'Free'; };
  const getOnboardingLabel = (step: number | null) => { const labels: Record<number, string> = { 0: 'Not Started', 1: 'Agency Name', 2: 'Plan Selection', 3: 'Password Setup' }; return labels[step ?? 0] || `Step ${step}`; };
  const filteredAgencies = agencies.filter(a => { if (!search) return true; const q = search.toLowerCase(); return a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.phone?.includes(q); });

  const getSmsTypeLabel = (type: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      activation_sms_1: { label: 'Activation 1', color: '#34d399' }, activation_sms_2: { label: 'Activation 2', color: '#34d399' }, activation_sms_3: { label: 'Activation 3', color: '#34d399' }, activation_sms_4: { label: 'Activation 4', color: '#34d399' }, activation_sms_5: { label: 'Activation 5', color: '#34d399' }, activation_sms_6: { label: 'Activation 6', color: '#34d399' }, activation_sms_7: { label: 'Activation 7', color: '#34d399' }, activation_sms_8: { label: 'Activation 8', color: '#34d399' }, activation_sms_9: { label: 'Activation 9', color: '#34d399' },
      abandoned_cart_1: { label: 'Cart 1', color: '#fbbf24' }, abandoned_cart_2: { label: 'Cart 2', color: '#fbbf24' }, abandoned_cart_3: { label: 'Cart 3', color: '#fbbf24' }, abandoned_cart_4: { label: 'Cart 4', color: '#fbbf24' }, abandoned_cart_5: { label: 'Cart 5', color: '#fbbf24' },
      trial_warning_day1: { label: 'Trial 1d', color: '#f87171' }, trial_warning_day2: { label: 'Trial 2d', color: '#f87171' }, trial_warning_day3: { label: 'Trial 3d', color: '#f87171' },
      demo_admin: { label: 'Demo', color: '#a78bfa' }, demo_followup: { label: 'Demo FU', color: '#a78bfa' },
    };
    return labels[type] || { label: type.replace(/_/g, ' ').slice(0, 15), color: 'rgba(255,255,255,0.4)' };
  };

  return (
    <div className="p-5 lg:p-8 max-w-[1400px]">
      <div className="mb-6"><h1 className="text-[22px] font-semibold text-white tracking-tight">Agencies</h1><p className="mt-1 text-sm text-white/40">Manage all platform agencies</p></div>

      {summary && (<div className="grid gap-3 grid-cols-2 lg:grid-cols-6 mb-6">
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"><p className="text-[10px] text-white/40 uppercase tracking-[0.1em]">Agencies</p><p className="mt-1.5 text-xl font-semibold text-white/90">{summary.total_agencies}</p><div className="mt-1 flex items-center gap-2 text-[11px]"><span className="text-emerald-400">{summary.active} active</span><span className="text-white/15">·</span><span className="text-cyan-400">{summary.trialing} trial</span></div></div>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"><p className="text-[10px] text-white/40 uppercase tracking-[0.1em]">Clients</p><p className="mt-1.5 text-xl font-semibold text-white/90">{summary.total_clients}</p><p className="mt-1 text-[11px] text-white/30">across all agencies</p></div>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"><p className="text-[10px] text-white/40 uppercase tracking-[0.1em]">Total Calls</p><p className="mt-1.5 text-xl font-semibold text-white/90">{summary.total_calls.toLocaleString()}</p><p className="mt-1 text-[11px] text-white/30">all time</p></div>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"><p className="text-[10px] text-white/40 uppercase tracking-[0.1em]">Leads</p><p className="mt-1.5 text-xl font-semibold text-white/90">{summary.total_leads}</p><p className="mt-1 text-[11px] text-white/30">in CRM</p></div>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"><p className="text-[10px] text-white/40 uppercase tracking-[0.1em]">Revenue</p><p className="mt-1.5 text-xl font-semibold text-emerald-400">{formatCurrency(summary.total_revenue)}</p><p className="mt-1 text-[11px] text-white/30">collected</p></div>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"><p className="text-[10px] text-white/40 uppercase tracking-[0.1em]">Stripe</p><p className="mt-1.5 text-xl font-semibold text-white/90">{summary.stripe_connected}</p><p className="mt-1 text-[11px] text-white/30">connected</p></div>
      </div>)}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1"><div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" /><input type="text" placeholder="Search agencies..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/30 transition-colors" /></div></form>
        <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" /><select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }} className="appearance-none rounded-xl bg-white/[0.04] border border-white/[0.06] pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/30"><option value="">All Status</option><option value="active">Active</option><option value="trialing">Trial</option><option value="past_due">Past Due</option><option value="pending">Pending</option><option value="canceled">Canceled</option></select></div>
      </div>

      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {loading ? (<div className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-500/50" /></div>) : filteredAgencies.length === 0 ? (<div className="p-16 text-center"><div className="relative inline-flex mb-4"><div className="absolute inset-0 blur-2xl bg-emerald-500/10 rounded-full" /><div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]"><Building2 className="h-7 w-7 text-white/20" /></div></div><p className="text-sm text-white/50">No agencies found</p></div>) : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-white/[0.06]"><th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-6 py-3.5">Agency</th><th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Plan</th><th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Status</th><th className="text-center text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-3 py-3.5">Clients</th><th className="text-center text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-3 py-3.5">Calls</th><th className="text-center text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-3 py-3.5">Leads</th><th className="text-right text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Revenue</th><th className="text-left text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-4 py-3.5">Last Login</th><th className="text-right text-[10px] font-medium text-white/40 uppercase tracking-[0.1em] px-6 py-3.5">Actions</th></tr></thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredAgencies.map((agency) => (<>
                <tr key={agency.id} ref={(el) => { rowRefs.current[agency.id] = el; }} className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${expandedRow === agency.id ? 'bg-white/[0.02]' : ''}`} onClick={() => handleExpand(agency.id)}>
                  <td className="px-6 py-3.5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0">{agency.primary_color ? (<div className="h-4 w-4 rounded" style={{ backgroundColor: agency.primary_color }} />) : (<Building2 className="h-4 w-4 text-white/35" />)}</div><div className="min-w-0"><div className="flex items-center gap-1.5"><p className="text-[13px] font-medium text-white/85 truncate">{agency.name}</p><ChevronDown className={`h-3 w-3 text-white/20 transition-transform shrink-0 ${expandedRow === agency.id ? 'rotate-180' : ''}`} /></div><p className="text-[11px] text-white/35 truncate">{agency.email}</p></div></div></td>
                  <td className="px-4 py-3.5"><span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${getPlanBadge(agency.plan_type)}`}>{getPlanDisplayName(agency.plan_type)}</span></td>
                  <td className="px-4 py-3.5"><span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${getStatusColor(agency.subscription_status || agency.status)}`}>{agency.subscription_status || agency.status || 'pending'}</span></td>
                  <td className="px-3 py-3.5 text-center"><span className="text-xs text-white/60 tabular-nums">{agency.client_count}</span></td>
                  <td className="px-3 py-3.5 text-center"><span className="text-xs text-white/60 tabular-nums">{agency.call_count}</span></td>
                  <td className="px-3 py-3.5 text-center"><span className="text-xs text-white/60 tabular-nums">{agency.lead_count}</span></td>
                  <td className="px-4 py-3.5 text-right"><span className={`text-xs tabular-nums ${agency.total_revenue > 0 ? 'text-emerald-400' : 'text-white/30'}`}>{agency.total_revenue > 0 ? formatCurrency(agency.total_revenue) : '—'}</span></td>
                  <td className="px-4 py-3.5"><span className="text-xs text-white/40">{agency.last_login_at ? timeAgo(agency.last_login_at) : 'Never'}</span></td>
                  <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block"><button onClick={() => setActionMenu(actionMenu === agency.id ? null : agency.id)} className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-colors"><MoreVertical className="h-4 w-4 text-white/35" /></button>
                      {actionMenu === agency.id && (<><div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} /><div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#111] border border-white/[0.08] shadow-2xl z-20 overflow-hidden">
                        <button onClick={() => { handleExpand(agency.id); setActionMenu(null); }} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/70 hover:bg-white/[0.04] w-full text-left"><ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedRow === agency.id ? 'rotate-180' : ''}`} />{expandedRow === agency.id ? 'Collapse Details' : 'View Details'}</button>
                        <button onClick={() => handleImpersonate(agency.id)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/70 hover:bg-white/[0.04] w-full text-left"><ExternalLink className="h-3.5 w-3.5" />Login as Agency</button>
                        {agency.marketing_domain && (<a href={`https://${agency.marketing_domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-white/70 hover:bg-white/[0.04]"><Globe className="h-3.5 w-3.5" />Visit Site</a>)}
                        <div className="mx-2 border-t border-white/[0.04]" />
                        {agency.status !== 'suspended' ? (<button onClick={() => handleStatusUpdate(agency.id, 'suspended', 'canceled')} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-red-400/80 hover:bg-red-500/[0.06] w-full text-left"><Ban className="h-3.5 w-3.5" />Suspend Agency</button>) : (<button onClick={() => handleStatusUpdate(agency.id, 'active', 'active')} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-emerald-400/80 hover:bg-emerald-500/[0.06] w-full text-left"><UserCheck className="h-3.5 w-3.5" />Activate Agency</button>)}
                      </div></>)}
                    </div>
                  </td>
                </tr>

                {expandedRow === agency.id && (<tr key={`${agency.id}-detail`}><td colSpan={9} className="px-6 py-0"><div className="py-5 border-t border-white/[0.03]">
                  {/* ── Existing 4-column grid ── */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Contact */}
                    <div className="space-y-3"><h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Contact</h4><div className="space-y-2 text-[13px]"><div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-white/25" /><span className="text-white/60 truncate">{agency.email}</span></div>{agency.phone && (<div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-white/25" /><span className="text-white/60">{formatPhone(agency.phone)}</span>{getPhoneLocation(agency.phone, agency.country) && (<span className="text-white/30 text-[11px]">· {getPhoneLocation(agency.phone, agency.country)}</span>)}</div>)}{agency.country && (<div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-white/25" /><span className="text-white/60">{getCountryName(agency.country)} {agency.currency ? `(${agency.currency.toUpperCase()})` : ''}</span></div>)}{agency.timezone && (<div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-white/25" /><span className="text-white/60">{agency.timezone}</span></div>)}</div></div>

                    {/* Billing */}
                    <div className="space-y-3"><h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Billing</h4><div className="space-y-2 text-[13px]"><div className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5 text-white/25" /><span className={agency.stripe_charges_enabled ? 'text-emerald-400/80' : 'text-white/30'}>{agency.stripe_charges_enabled ? 'Charges Enabled' : 'Charges Off'}</span></div><div className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 text-white/25" /><span className={agency.stripe_payouts_enabled ? 'text-emerald-400/80' : 'text-white/30'}>{agency.stripe_payouts_enabled ? 'Payouts Enabled' : 'Payouts Off'}</span></div><div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-white/25" /><span className={agency.stripe_onboarding_complete ? 'text-emerald-400/80' : 'text-white/30'}>{agency.stripe_onboarding_complete ? 'Connect Onboarded' : 'Connect Incomplete'}</span></div>{agency.stripe_account_id && (<button onClick={() => copyToClipboard(agency.stripe_account_id!, `stripe-${agency.id}`)} className="flex items-center gap-2 text-white/35 hover:text-white/50 transition-colors">{copiedId === `stripe-${agency.id}` ? (<Check className="h-3.5 w-3.5 text-emerald-400" />) : (<Copy className="h-3.5 w-3.5" />)}<span className="text-[11px] font-mono truncate">{agency.stripe_account_id.slice(0, 20)}...</span></button>)}{agency.current_period_end && (<div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-white/25" /><span className="text-white/40 text-[11px]">Period ends: {formatDate(agency.current_period_end)}</span></div>)}{agency.trial_ends_at && (<div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-cyan-400/40" /><span className="text-cyan-400/60 text-[11px]">Trial ends: {formatDate(agency.trial_ends_at)}</span></div>)}{(agency.price_starter || agency.price_pro || agency.price_growth) && (<div className="pt-2 mt-2 border-t border-white/[0.03]"><p className="text-[10px] text-white/30 uppercase tracking-[0.1em] mb-1.5">Client Pricing</p><div className="space-y-1 text-[11px]"><div className="flex items-center justify-between"><span className="text-white/35">Starter</span><span className="text-white/60 tabular-nums">{agency.price_starter ? formatCurrency(agency.price_starter) : '—'}/mo<span className="text-white/25 ml-1">({agency.limit_starter ?? 0} calls)</span></span></div><div className="flex items-center justify-between"><span className="text-white/35">Pro</span><span className="text-white/60 tabular-nums">{agency.price_pro ? formatCurrency(agency.price_pro) : '—'}/mo<span className="text-white/25 ml-1">({agency.limit_pro ?? 0} calls)</span></span></div><div className="flex items-center justify-between"><span className="text-white/35">Growth</span><span className="text-white/60 tabular-nums">{agency.price_growth ? formatCurrency(agency.price_growth) : '—'}/mo<span className="text-white/25 ml-1">({agency.limit_growth === -1 ? '∞' : agency.limit_growth ?? 0} calls)</span></span></div></div></div>)}</div></div>

                    {/* Platform */}
                    <div className="space-y-3"><h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Platform</h4><div className="space-y-2 text-[13px]">{agency.slug && (<div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-white/25" /><span className="text-white/40 text-[11px] font-mono">/{agency.slug}</span></div>)}{agency.marketing_domain && (<div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-white/25" /><a href={`https://${agency.marketing_domain}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400/70 text-[11px] hover:underline">{agency.marketing_domain}</a>{agency.domain_verified && (<Shield className="h-3 w-3 text-emerald-400/50" />)}</div>)}<div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-white/25" /><span className={agency.onboarding_completed ? 'text-emerald-400/80' : 'text-amber-400/80'}>{agency.onboarding_completed ? 'Onboarding Complete' : `Stalled: ${getOnboardingLabel(agency.onboarding_step)} (${agency.onboarding_step || 0}/3)`}</span></div>{!agency.onboarding_completed && agency.abandoned_cart_step && agency.abandoned_cart_step > 0 && (<div className="flex items-center gap-2"><Target className="h-3.5 w-3.5 text-amber-400/30" /><span className="text-amber-400/60 text-[11px]">Recovery SMS: {agency.abandoned_cart_step}/5 sent{agency.abandoned_cart_last_sent_at && (<> · {timeAgo(agency.abandoned_cart_last_sent_at)}</>)}</span></div>)}{agency.demo_phone_number && (<div className="flex items-center gap-2"><PhoneCall className="h-3.5 w-3.5 text-white/25" /><span className="text-white/40 text-[11px]">Demo: {agency.demo_phone_number}</span></div>)}{agency.byot_enabled && (<span className="inline-flex items-center rounded-md bg-violet-500/[0.08] px-2 py-0.5 text-[10px] text-violet-400/80">BYOT Enabled</span>)}{agency.referral_source && (<div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-white/25" /><span className="text-white/50 text-[11px] capitalize">{agency.referral_source.replace(/_/g, ' ')}</span></div>)}</div></div>

                    {/* Usage */}
                    <div className="space-y-3"><h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Usage</h4><div className="space-y-1.5 text-[13px]"><div className="flex items-center justify-between"><span className="text-white/35">Users</span><span className="text-white/60 tabular-nums">{agency.user_count}</span></div><div className="flex items-center justify-between"><span className="text-white/35">Clients</span><span className="text-white/60 tabular-nums">{agency.client_count}</span></div><div className="flex items-center justify-between"><span className="text-white/35">Total Calls</span><span className="text-white/60 tabular-nums">{agency.call_count}</span></div><div className="flex items-center justify-between"><span className="text-white/35">Leads</span><span className="text-white/60 tabular-nums">{agency.lead_count}</span></div><div className="flex items-center justify-between"><span className="text-white/35">Revenue</span><span className="text-emerald-400/80 tabular-nums">{formatCurrency(agency.total_revenue)}</span></div><div className="flex items-center justify-between"><span className="text-white/35">Payments</span><span className="text-white/60 tabular-nums">{agency.payment_count}</span></div>{agency.referral_code && (<div className="flex items-center justify-between"><span className="text-white/35">Referral</span><span className="text-white/40 text-[11px] font-mono">{agency.referral_code}</span></div>)}{agency.referral_code && agency.referral_earnings_cents != null && agency.referral_earnings_cents > 0 && (<div className="flex items-center justify-between"><span className="text-white/35">Ref. Earnings</span><span className="text-emerald-400/80 tabular-nums text-[11px]">{formatCurrency(agency.referral_earnings_cents)}</span></div>)}{agency.referred_by && (<div className="flex items-center justify-between"><span className="text-white/35">Referred By</span><span className="text-white/40 text-[11px] font-mono truncate max-w-[120px]">{agency.referred_by}</span></div>)}</div><div className="pt-2 border-t border-white/[0.03] text-[11px] text-white/30">Created: {formatDateTime(agency.created_at)}{agency.last_login_at && (<> · Last login: {timeAgo(agency.last_login_at)}</>)}</div></div>
                  </div>

                  {/* ── NEW: Expanded detail sections (lazy loaded) ── */}
                  {expandedLoading === agency.id && (
                    <div className="mt-5 pt-5 border-t border-white/[0.03] flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-500/40" />
                    </div>
                  )}

                  {expandedData[agency.id] && (
                    <div className="mt-5 pt-5 border-t border-white/[0.03] space-y-5">
                      {/* Setup Checklist */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="h-3.5 w-3.5 text-emerald-400/60" />
                          <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Setup Checklist</h4>
                          <span className="text-[10px] text-white/25">{expandedData[agency.id].checklist.done}/{expandedData[agency.id].checklist.total}</span>
                          {expandedData[agency.id].checklist.complete && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Complete</span>}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {Object.entries(expandedData[agency.id].checklist.items).filter(([key]) => key !== 'stripe_charges').map(([key, item]) => (
                            <div key={key} className="flex items-center gap-1.5">
                              {item.done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" /> : <Circle className="h-3.5 w-3.5 text-white/15" />}
                              <span className={`text-[11px] ${item.done ? 'text-white/40 line-through' : 'text-white/60'}`}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                        {expandedData[agency.id].activation.step > 0 && (
                          <p className="text-[10px] text-white/25 mt-2">Activation SMS: step {expandedData[agency.id].activation.step}/9{expandedData[agency.id].activation.last_sent && ` · last sent ${timeAgo(expandedData[agency.id].activation.last_sent!)}`}</p>
                        )}
                      </div>

                      {/* Test Client */}
                      {expandedData[agency.id].test_client && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FlaskConical className="h-3.5 w-3.5 text-violet-400/60" />
                            <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Test Client</h4>
                          </div>
                          <div className="flex items-center gap-4 text-[11px]">
                            <span className="text-white/50">📞 {expandedData[agency.id].test_client!.phone || 'No phone'}</span>
                            <span className="text-white/50">Calls: {expandedData[agency.id].test_client!.calls_used}/{expandedData[agency.id].test_client!.call_limit}</span>
                            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-medium ${getStatusColor(expandedData[agency.id].test_client!.status)}`}>{expandedData[agency.id].test_client!.status}</span>
                          </div>
                        </div>
                      )}

                      {/* Clients */}
                      {expandedData[agency.id].clients.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-3.5 w-3.5 text-emerald-400/60" />
                            <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Clients</h4>
                            <span className="text-[10px] text-white/25">{expandedData[agency.id].billable_client_count} billable</span>
                          </div>
                          <div className="space-y-1">
                            {expandedData[agency.id].clients.map((client: any) => (
                              <div key={client.id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/[0.02] border border-white/[0.03]">
                                <div className="flex items-center gap-2.5">
                                  <div className={`flex h-6 w-6 items-center justify-center rounded-md shrink-0 ${client.is_test_client ? 'bg-violet-500/[0.08]' : 'bg-emerald-500/[0.08]'}`}>
                                    {client.is_test_client ? <FlaskConical className="h-3 w-3 text-violet-400/70" /> : <span className="text-[9px] font-semibold text-emerald-400/70">{client.business_name?.charAt(0)}</span>}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-medium text-white/70">{client.business_name}</span>
                                      {client.is_test_client && <span className="text-[8px] px-1 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">Test</span>}
                                    </div>
                                    {client.industry && <span className="text-[10px] text-white/25 capitalize">{client.industry}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-[10px]">
                                  {client.vapi_phone_number && <span className="text-white/30 tabular-nums">{formatPhone(client.vapi_phone_number)}</span>}
                                  <span className="text-white/30 tabular-nums">{client.calls_this_month || 0} calls</span>
                                  <span className={`rounded-md border px-1.5 py-0.5 font-medium ${getStatusColor(client.subscription_status)}`}>{client.subscription_status}</span>
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
                            <MessageSquare className="h-3.5 w-3.5 text-cyan-400/60" />
                            <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">SMS History</h4>
                            <span className="text-[10px] text-white/25">Last {expandedData[agency.id].sms_history.length}</span>
                          </div>
                          <div className="space-y-1">
                            {expandedData[agency.id].sms_history.map((sms: any) => {
                              const typeInfo = getSmsTypeLabel(sms.message_type);
                              return (
                                <div key={sms.id} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-white/[0.02] border border-white/[0.03]">
                                  <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-medium shrink-0" style={{ backgroundColor: `${typeInfo.color}12`, borderColor: `${typeInfo.color}20`, color: typeInfo.color }}>{typeInfo.label}</span>
                                  <span className="text-[10px] text-white/30 truncate flex-1">{sms.message_body?.slice(0, 80)}...</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${sms.delivery_status === 'sent' || sms.delivery_status === 'delivered' ? 'text-emerald-400/60 bg-emerald-500/[0.06]' : 'text-red-400/60 bg-red-500/[0.06]'}`}>{sms.delivery_status}</span>
                                  <span className="text-[10px] text-white/20 shrink-0 tabular-nums">{timeAgo(sms.created_at)}</span>
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
                            <TrendingUp className="h-3.5 w-3.5 text-amber-400/60" />
                            <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.1em]">Referral Chain</h4>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            {expandedData[agency.id].referral_chain.referred_by && (
                              <div className="text-white/40">Referred by: <span className="text-white/60 font-mono">{expandedData[agency.id].referral_chain.referred_by}</span></div>
                            )}
                            {expandedData[agency.id].referral_chain.referred_agencies.map((ref: any) => (
                              <div key={ref.id} className="flex items-center justify-between rounded-lg px-3 py-1.5 bg-white/[0.02]">
                                <span className="text-white/50">{ref.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-medium ${getStatusColor(ref.subscription_status)}`}>{ref.subscription_status}</span>
                                  <span className="text-white/25">{timeAgo(ref.created_at)}</span>
                                </div>
                              </div>
                            ))}
                            {expandedData[agency.id].referral_chain.earnings_cents > 0 && (
                              <div className="text-white/40 mt-1">Total earnings: <span className="text-emerald-400/80">{formatCurrency(expandedData[agency.id].referral_chain.earnings_cents)}</span></div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-white/[0.03] flex items-center gap-3"><span className="text-[10px] text-white/30">ID:</span><button onClick={() => copyToClipboard(agency.id, `id-${agency.id}`)} className="flex items-center gap-1.5 text-[11px] font-mono text-white/35 hover:text-white/50 transition-colors">{agency.id}{copiedId === `id-${agency.id}` ? (<Check className="h-3 w-3 text-emerald-400" />) : (<Copy className="h-3 w-3" />)}</button></div>
                </div></td></tr>)}
              </>))}
            </tbody></table>
          </div>
        )}
      </div>
      {!loading && filteredAgencies.length > 0 && (<p className="mt-4 text-xs text-white/30">Showing {filteredAgencies.length} agenc{filteredAgencies.length === 1 ? 'y' : 'ies'}</p>)}
    </div>
  );
}