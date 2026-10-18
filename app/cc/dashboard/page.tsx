'use client';

// /cc/dashboard - the call-center operations home. Live-ops snapshot across
// every business the call center answers for: who is live now, today's volume
// and outcomes, busiest businesses, and the latest calls. No reseller widgets
// and no revenue (call centers do not use Stripe Connect).

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Radio, PhoneCall, Building2, Headset, Bot, PhoneForwarded, CalendarCheck, ShieldX, Clock, Moon, ChevronRight, Loader2 } from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';

interface Overview {
  businessesServed: number;
  live: number;
  agentsActive: number;
  today: { calls: number; aiHandled: number; escalated: number; transferred: number; booked: number; spam: number; afterHours: number; talkMinutes: number };
  recent: { id: string; clientId: string; businessName: string; caller: string | null; outcome: string; durationSeconds: number; at: string }[];
  busiest: { clientId: string; businessName: string; count: number }[];
}

const POLL_MS = 15000;

function fmtPhone(p: string | null): string {
  if (!p) return 'Unknown caller';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}
function fmtDur(s: number): string { if (!s) return '0:00'; const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }
function timeAgo(iso: string): string {
  const t = Date.parse(iso); if (!t) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function CallCenterDashboard() {
  const { agency, user } = useAgency();
  const theme = useTheme();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!agency?.id) return;
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${backendUrl}/api/agency/${agency.id}/cc/overview`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); if (d.success) setData(d); }
    } catch { /* keep last good */ } finally { setLoading(false); }
  }, [agency?.id]);

  useEffect(() => { load(); const p = setInterval(load, POLL_MS); return () => clearInterval(p); }, [load]);

  const firstName = user?.first_name || '';
  const t = data?.today;

  const outcomeColor = (o: string) => {
    if (o === 'Spam') return theme.textMuted;
    if (o === 'Transferred' || o === 'Agent took over') return '#f59e0b';
    if (o === 'Booked') return theme.primary;
    return '#22c55e';
  };

  const kpi = (label: string, value: number | string, Icon: any, color?: string, href?: string, live?: boolean) => {
    const card = (
      <div className="rounded-2xl p-4 sm:p-5 h-full" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: theme.textMuted }}>{label}</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: color ? `${color}1a` : theme.hover }}><Icon className="h-4 w-4" style={{ color: color || theme.textMuted }} /></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums" style={{ color: theme.text }}>{value}</span>
          {live && Number(value) > 0 && <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />}
        </div>
      </div>
    );
    return href ? <Link href={href} className="block h-full transition-opacity hover:opacity-90">{card}</Link> : card;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>{firstName ? `Welcome back, ${firstName}` : 'Call center overview'}</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>
            {data ? `Answering for ${data.businessesServed} ${data.businessesServed === 1 ? 'business' : 'businesses'} with ${data.agentsActive} ${data.agentsActive === 1 ? 'agent' : 'agents'}.` : 'Live operations across your businesses.'}
          </p>
        </div>
        <Link href="/cc/live-calls" className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          <Radio className="h-4 w-4" /> Live board
        </Link>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading the floor...</div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {/* Live + today headline KPIs (4) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpi('Live now', data?.live ?? 0, PhoneCall, '#22c55e', '/cc/live-calls', true)}
            {kpi('Calls today', t?.calls ?? 0, Radio, theme.primary)}
            {kpi('Handled by AI', t?.aiHandled ?? 0, Bot, '#22c55e')}
            {kpi('Escalated', t?.escalated ?? 0, PhoneForwarded, '#f59e0b')}
          </div>

          {/* Today breakdown (4) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpi('Booked', t?.booked ?? 0, CalendarCheck, theme.primary)}
            {kpi('Transferred', t?.transferred ?? 0, PhoneForwarded, '#f59e0b')}
            {kpi('Spam blocked', t?.spam ?? 0, ShieldX, theme.textMuted)}
            {kpi('After hours', t?.afterHours ?? 0, Moon, '#8b5cf6')}
          </div>

          {/* Busiest + Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {/* Busiest businesses today */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <Building2 className="h-4 w-4" style={{ color: theme.textMuted }} />
                <h2 className="text-sm font-semibold" style={{ color: theme.text }}>Busiest today</h2>
                <Link href="/cc/businesses" className="ml-auto text-xs font-medium" style={{ color: theme.primary }}>All businesses</Link>
              </div>
              {(!data || data.busiest.length === 0) ? (
                <div className="px-5 py-8 text-center text-[13px]" style={{ color: theme.textMuted }}>No calls yet today.</div>
              ) : (
                <div>
                  {data.busiest.map((b, i) => (
                    <Link key={b.clientId} href={`/live/${b.clientId}?mode=monitor&back=/cc/dashboard`} target="_blank" rel="noopener" className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 transition-colors" style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.hover; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                      <span className="text-sm truncate" style={{ color: theme.text }}>{b.businessName}</span>
                      <span className="text-xs font-semibold tabular-nums flex-shrink-0" style={{ color: theme.textMuted }}>{b.count} {b.count === 1 ? 'call' : 'calls'}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent calls */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <Clock className="h-4 w-4" style={{ color: theme.textMuted }} />
                <h2 className="text-sm font-semibold" style={{ color: theme.text }}>Latest calls</h2>
              </div>
              {(!data || data.recent.length === 0) ? (
                <div className="px-5 py-8 text-center text-[13px]" style={{ color: theme.textMuted }}>Calls will appear here as they finish.</div>
              ) : (
                <div className="max-h-[22rem] overflow-y-auto">
                  {data.recent.map((c, i) => (
                    <Link key={c.id} href={`/cc/calls/${c.id}`} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 transition-colors" style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.hover; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                      <div className="min-w-0">
                        <p className="text-sm truncate" style={{ color: theme.text }}>{c.businessName}</p>
                        <p className="text-[12px] truncate" style={{ color: theme.textMuted }}>{fmtPhone(c.caller)} · {fmtDur(c.durationSeconds)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[12px] font-semibold" style={{ color: outcomeColor(c.outcome) }}>{c.outcome}</p>
                        <p className="text-[11px]" style={{ color: theme.textMuted }}>{timeAgo(c.at)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
