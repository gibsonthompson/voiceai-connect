'use client';

// /cc/businesses - the book of businesses this call center answers for. Reads
// the same agency clients endpoint, framed for operations: find a business, see
// its number and this month's volume, and jump straight to its live monitor.

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Building2, Search, PhoneCall, Settings, Loader2, CircleDot, Plus } from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';

interface Biz {
  id: string;
  business_name: string;
  vapi_phone_number: string | null;
  plan_type: string | null;
  subscription_status: string | null;
  calls_this_month: number | null;
  monthly_call_limit: number | null;
}

function fmtPhone(p: string | null): string {
  if (!p) return 'No number yet';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}

export default function CallCenterBusinesses() {
  const { agency } = useAgency();
  const theme = useTheme();
  const [rows, setRows] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    if (!agency?.id) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${backendUrl}/api/agency/${agency.id}/clients`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        const list: Biz[] = (d.clients || []).map((c: any) => ({
          id: c.id, business_name: c.business_name || 'Business', vapi_phone_number: c.vapi_phone_number || null,
          plan_type: c.plan_type || null, subscription_status: c.subscription_status || null,
          calls_this_month: c.calls_this_month ?? 0, monthly_call_limit: c.monthly_call_limit ?? null,
        })).sort((a: Biz, b: Biz) => a.business_name.localeCompare(b.business_name));
        setRows(list);
      }
    } catch { /* keep last good */ } finally { setLoading(false); }
  }, [agency?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(b => b.business_name.toLowerCase().includes(s) || (b.vapi_phone_number || '').includes(s));
  }, [rows, q]);

  const statusColor = (s: string | null) => {
    if (s === 'active' || s === 'manual') return '#22c55e';
    if (s === 'trial' || s === 'trialing') return theme.primary;
    return theme.textMuted;
  };
  const statusLabel = (s: string | null) => {
    if (s === 'active' || s === 'manual') return 'Active';
    if (s === 'trial' || s === 'trialing') return 'Trial';
    if (!s) return 'Pending';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Building2 className="h-5 w-5" style={{ color: theme.primary }} /></div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Businesses</h1>
            <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Every business you answer for. {rows.length} total.</p>
          </div>
        </div>
        <Link href="/agency/clients/new" className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold flex-shrink-0 transition" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add business</span><span className="sm:hidden">Add</span>
        </Link>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search business or number..." className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }} />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading businesses...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-14 flex flex-col items-center justify-center text-center" style={{ border: `1px dashed ${theme.border}` }}>
          <CircleDot className="h-8 w-8 mb-2.5" style={{ color: theme.textSubtle }} />
          <p className="text-sm font-medium" style={{ color: theme.text }}>{q ? 'No matches' : 'No businesses yet'}</p>
          <p className="text-[13px] mt-1" style={{ color: theme.textMuted }}>{q ? 'Try a different search.' : 'Businesses you onboard will appear here.'}</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.card }}>
          {filtered.map((b, i) => {
            const pct = b.monthly_call_limit && b.monthly_call_limit > 0 ? Math.min(100, Math.round(((b.calls_this_month || 0) / b.monthly_call_limit) * 100)) : null;
            return (
              <div key={b.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5" style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{b.business_name}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold flex-shrink-0"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor(b.subscription_status) }} /><span style={{ color: theme.textMuted }}>{statusLabel(b.subscription_status)}</span></span>
                  </div>
                  <p className="text-[12px] truncate" style={{ color: theme.textMuted }}>{fmtPhone(b.vapi_phone_number)}</p>
                </div>
                <div className="hidden sm:block text-right flex-shrink-0 w-28">
                  <p className="text-sm font-semibold tabular-nums" style={{ color: theme.text }}>{b.calls_this_month ?? 0}{b.monthly_call_limit ? ` / ${b.monthly_call_limit}` : ''}</p>
                  <p className="text-[11px]" style={{ color: theme.textMuted }}>calls this month{pct !== null ? ` · ${pct}%` : ''}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link href={`/live/${b.id}?mode=monitor`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={{ backgroundColor: theme.primary15, color: theme.primary }} title="Open live monitor"><PhoneCall className="h-3.5 w-3.5" /><span className="hidden sm:inline">Monitor</span></Link>
                  <Link href={`/cc/businesses/${b.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ backgroundColor: theme.hover, color: theme.textMuted }} title="Configure this business"><Settings className="h-3.5 w-3.5" /><span className="hidden sm:inline">Configure</span></Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}