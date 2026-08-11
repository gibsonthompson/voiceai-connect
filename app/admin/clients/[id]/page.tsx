'use client';

// ============================================================================
// ADMIN CLIENT DETAIL (emerald on white, admin-scope)
// Reached from two places: the Clients list (/admin/clients row) and the agency
// panel's inline client rows (/admin/agencies expanded). Renders
// GET /api/admin/clients/:clientId which returns { client, calls }. Includes a
// "Log in as client" action that mints an impersonation token and opens the
// client's own dashboard through /client/preview.
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Mail, Phone, PhoneCall, User, Loader2, LogIn,
  CreditCard, Calendar, FlaskConical, Clock, Copy, Check, ChevronDown,
  MapPin, MessageSquare, AlertCircle,
} from 'lucide-react';
import { formatPhone, formatDate, formatDateTime, timeAgo } from '@/lib/admin/format';
import { getStatusBadge, getPlanBadge, getPlanDisplayName } from '@/lib/admin/status';

interface ClientDetail {
  id: string;
  business_name: string;
  email: string;
  owner_name: string | null;
  owner_phone: string | null;
  vapi_phone_number: string | null;
  industry: string | null;
  plan_type: string;
  subscription_status: string;
  status: string;
  calls_this_month: number;
  monthly_call_limit: number;
  trial_ends_at: string | null;
  created_at: string;
  agency_id: string;
  is_test_client?: boolean;
  greeting_message?: string | null;
  hipaa_mode?: boolean;
  agencies?: { id: string; name: string; slug: string; email: string } | null;
}

interface CallRow {
  id: string;
  created_at: string;
  [key: string]: any;
}

export default function AdminClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = String((params as any)?.id || '');

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  useEffect(() => { if (clientId) fetchClient(); }, [clientId]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/admin/clients/${clientId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.status === 404) { setNotFound(true); return; }
      if (!response.ok) throw new Error('Failed to load client');
      const data = await response.json();
      setClient(data.client || null);
      setCalls(Array.isArray(data.calls) ? data.calls : []);
    } catch (error) {
      console.error('Client detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!client) return;
    setImpersonating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/admin/clients/${client.id}/impersonate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to log in as client');
      const data = await response.json();
      if (data.token) window.open(`/client/preview?token=${data.token}`, '_blank');
    } catch (error) {
      console.error('Impersonate error:', error);
    } finally {
      setImpersonating(false);
    }
  };

  const copyId = () => {
    if (!client) return;
    navigator.clipboard.writeText(client.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Defensive accessors: the calls table columns are not guaranteed, so read a
  // Field names match the real calls table schema.
  const nameOf = (c: CallRow): string => c.customer_name || 'Unknown caller';
  const phoneOf = (c: CallRow): string | null => c.customer_phone || c.caller_phone || null;
  const durationOf = (c: CallRow): number | null =>
    typeof c.duration_seconds === 'number' ? c.duration_seconds : null;
  const fmtDuration = (secs: number | null) => {
    if (secs === null) return null;
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  const summaryOf = (c: CallRow): string | null => c.ai_summary || c.summary || null;
  const isSpamCall = (c: CallRow): boolean => c.is_spam === true || c.call_status === 'spam';

  const label = 'text-[10px] font-medium text-[var(--a-dim)] uppercase tracking-[0.1em]';

  const statusBadge = (status: string) => {
    const b = getStatusBadge(status);
    return (<span className="rounded-md border px-2 py-0.5 text-[10px] font-medium" style={{ color: b.color, background: b.bg, borderColor: b.border }}>{status || 'pending'}</span>);
  };
  const planBadge = (plan: string) => {
    const b = getPlanBadge(plan);
    return (<span className="rounded-md border px-2 py-0.5 text-[10px] font-medium" style={{ color: b.color, background: b.bg, borderColor: b.border }}>{getPlanDisplayName(plan)}</span>);
  };

  if (loading) {
    return (
      <div className="admin-scope p-5 lg:p-8 max-w-[1100px]">
        <div className="a-panel p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div>
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="admin-scope p-5 lg:p-8 max-w-[1100px]">
        <button onClick={() => router.push('/admin/clients')} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[var(--a-dim)] hover:text-[var(--a-muted)] transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Clients
        </button>
        <div className="a-panel p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto mb-4" style={{ background: 'var(--a-em-soft)' }}><User className="h-7 w-7 text-[var(--a-em-deep)]" /></div>
          <p className="text-sm text-[var(--a-muted)]">Client not found</p>
        </div>
      </div>
    );
  }

  const usagePct = client.monthly_call_limit > 0
    ? Math.min(100, Math.round(((client.calls_this_month || 0) / client.monthly_call_limit) * 100))
    : 0;

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1100px]">
      <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[var(--a-dim)] hover:text-[var(--a-muted)] transition-colors">
        <ArrowLeft className="h-4 w-4" />Back
      </button>

      {/* Header */}
      <div className="a-card p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0" style={{ background: client.is_test_client ? 'var(--a-violet-soft)' : 'var(--a-em-soft)' }}>
              {client.is_test_client ? <FlaskConical className="h-6 w-6 text-[var(--a-violet)]" /> : <span className="text-lg font-semibold text-[var(--a-em-deep)]">{client.business_name?.charAt(0) || '?'}</span>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] font-semibold text-[var(--a-ink)] tracking-tight truncate">{client.business_name}</h1>
                {client.is_test_client && <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-medium" style={{ color: 'var(--a-violet)', background: 'var(--a-violet-soft)', borderColor: 'var(--a-violet-soft)' }}>Test</span>}
              </div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                {planBadge(client.plan_type)}
                {statusBadge(client.subscription_status || client.status)}
                {client.industry && <span className="text-[11px] text-[var(--a-dim)] capitalize">{client.industry}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={handleImpersonate}
            disabled={impersonating}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors disabled:opacity-60 shrink-0"
            style={{ background: 'var(--a-em-soft)', color: 'var(--a-em-deep)', border: '1px solid var(--a-em-line)' }}
          >
            {impersonating ? <><Loader2 className="h-4 w-4 animate-spin" />Opening...</> : <><LogIn className="h-4 w-4" />Log in as client</>}
          </button>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mb-6">
        {/* Contact */}
        <div className="a-card p-5 space-y-3">
          <h4 className={label}>Contact</h4>
          <div className="space-y-2.5 text-[13px]">
            <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[var(--a-muted)] truncate">{client.email || '\u2013'}</span></div>
            <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[var(--a-muted)]">{client.owner_name || '\u2013'}</span></div>
            <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[var(--a-muted)] a-num">{client.owner_phone ? formatPhone(client.owner_phone) : '\u2013'}</span></div>
          </div>
        </div>

        {/* Telephony / usage */}
        <div className="a-card p-5 space-y-3">
          <h4 className={label}>Telephony</h4>
          <div className="space-y-2.5 text-[13px]">
            <div className="flex items-center gap-2"><PhoneCall className="h-3.5 w-3.5 text-[var(--a-em-deep)] shrink-0" /><span className="text-[var(--a-muted)] a-num">{client.vapi_phone_number ? formatPhone(client.vapi_phone_number) : 'No AI number'}</span></div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[var(--a-dim)] text-[11px]">Calls this month</span>
                <span className="text-[var(--a-muted)] a-num text-[11px]">{client.calls_this_month || 0} / {client.monthly_call_limit || 0}</span>
              </div>
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--a-line)' }}>
                <div className="h-full rounded-full" style={{ width: `${usagePct}%`, background: usagePct >= 100 ? 'var(--a-red)' : 'var(--a-em)' }} />
              </div>
            </div>
            {client.hipaa_mode && <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--a-violet)' }}><Clock className="h-3.5 w-3.5 shrink-0" />HIPAA mode on</div>}
          </div>
        </div>

        {/* Plan & agency */}
        <div className="a-card p-5 space-y-3">
          <h4 className={label}>Plan & Agency</h4>
          <div className="space-y-2.5 text-[13px]">
            <div className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[var(--a-muted)] capitalize">{client.plan_type || 'starter'}</span></div>
            {client.trial_ends_at && (<div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--a-cyan)' }} /><span className="text-[11px]" style={{ color: 'var(--a-cyan)' }}>Trial ends {formatDate(client.trial_ends_at)}</span></div>)}
            <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><Link href={`/admin/agencies?expand=${client.agency_id}`} className="text-[13px] hover:underline" style={{ color: 'var(--a-em-deep)' }}>{client.agencies?.name || 'View agency'}</Link></div>
            <div className="flex items-center gap-2 pt-1"><Calendar className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[11px] text-[var(--a-dim)]">Created {formatDate(client.created_at)}</span></div>
          </div>
        </div>
      </div>

      {/* Recent calls */}
      <div className="a-panel">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--a-line)]">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-[var(--a-em-deep)]" />
            <h2 className="text-[13px] font-semibold text-[var(--a-ink)]">Recent Calls</h2>
            <span className="text-[10px] text-[var(--a-dim)]">last {calls.length}</span>
          </div>
        </div>
        {calls.length === 0 ? (
          <div className="p-12 text-center"><p className="text-sm text-[var(--a-dim)]">No calls yet</p></div>
        ) : (
          <div className="divide-y divide-[var(--a-line)]">
            {calls.map((c) => {
              const dur = fmtDuration(durationOf(c));
              const summary = summaryOf(c);
              const phone = phoneOf(c);
              const spam = isSpamCall(c);
              const urgency = c.urgency_level;
              const highUrgency = urgency === 'high' || urgency === 'emergency';
              const open = expandedCall === c.id;
              return (
                <div key={c.id}>
                  <button
                    onClick={() => setExpandedCall(open ? null : c.id)}
                    className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-[#F6FCF9] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-[var(--a-ink)]">{nameOf(c)}</span>
                        {phone && <span className="text-[11px] text-[var(--a-dim)] a-num">{formatPhone(phone)}</span>}
                        {dur && <span className="text-[11px] text-[var(--a-dim)]">{dur}</span>}
                        {spam && <span className="rounded-md border px-1.5 py-0.5 text-[9px] font-medium" style={{ color: 'var(--a-red)', background: 'var(--a-red-soft)', borderColor: 'var(--a-red-soft)' }}>spam</span>}
                        {!spam && highUrgency && <span className="rounded-md border px-1.5 py-0.5 text-[9px] font-medium capitalize" style={{ color: 'var(--a-red)', background: 'var(--a-red-soft)', borderColor: 'var(--a-red-soft)' }}>{urgency}</span>}
                      </div>
                      {summary && !open && <p className="mt-0.5 text-[11px] text-[var(--a-dim)] line-clamp-1">{summary}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[var(--a-dim)] a-num">{timeAgo(c.created_at)}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-[var(--a-dim)] transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {open && (
                    <div className="px-5 pb-4 pt-1 space-y-3">
                      {summary && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1"><MessageSquare className="h-3 w-3 text-[var(--a-em-deep)]" /><span className={label}>Summary</span></div>
                          <p className="text-[12px] leading-relaxed text-[var(--a-muted)] whitespace-pre-wrap">{summary}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                        {phone && (<div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><a href={`tel:${phone}`} className="a-num hover:underline" style={{ color: 'var(--a-em-deep)' }}>{formatPhone(phone)}</a></div>)}
                        {c.customer_email && (<div className="flex items-center gap-2 min-w-0"><Mail className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[var(--a-muted)] truncate">{c.customer_email}</span></div>)}
                        {c.customer_address && (<div className="flex items-center gap-2 min-w-0 col-span-2"><MapPin className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[var(--a-muted)]">{c.customer_address}</span></div>)}
                        {c.service_requested && (<div className="flex items-center gap-2 min-w-0 col-span-2"><CreditCard className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[var(--a-muted)]">{c.service_requested}</span></div>)}
                        {dur && (<div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[var(--a-muted)]">{dur}</span></div>)}
                        {urgency && !spam && (<div className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[var(--a-muted)] capitalize">{urgency}</span></div>)}
                        <div className="flex items-center gap-2 col-span-2"><Calendar className="h-3.5 w-3.5 text-[var(--a-dim)] shrink-0" /><span className="text-[var(--a-dim)]">{formatDateTime(c.created_at)}</span></div>
                      </div>

                      {spam && c.spam_reason && (
                        <p className="text-[11px]" style={{ color: 'var(--a-red)' }}>Spam type: {c.spam_reason}</p>
                      )}

                      {c.transcript && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1"><span className={label}>Transcript</span></div>
                          <div className="rounded-lg p-3 max-h-72 overflow-y-auto" style={{ background: 'var(--a-em-soft)' }}>
                            <p className="text-[12px] leading-relaxed text-[var(--a-muted)] whitespace-pre-wrap">{c.transcript}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ID footer */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[10px] text-[var(--a-dim)]">ID:</span>
        <button onClick={copyId} className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--a-dim)] hover:text-[var(--a-muted)] transition-colors">
          {client.id}{copiedId ? <Check className="h-3 w-3" style={{ color: 'var(--a-em-deep)' }} /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}