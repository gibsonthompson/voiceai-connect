'use client';

// /cc/analytics - deep call analytics for a call center. Pure call insight, no
// revenue (call centers do not use Stripe Connect): volume, AI deflection,
// escalation, booking, handle time, an hour-of-day peak chart, and per-business
// and per-agent breakdowns. Backed by /api/agency/:id/cc/analytics.

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Bot, PhoneForwarded, CalendarCheck, ShieldX, Clock, Moon, Radio, Loader2, Building2, Headset } from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';

interface Analytics {
  range: string;
  totals: { calls: number; aiHandled: number; escalated: number; transferred: number; booked: number; spam: number; afterHours: number; avgHandleSeconds: number; deflectionRate: number; escalationRate: number; bookingRate: number };
  byDay: { date: string; count: number }[];
  byHour: { hour: number; count: number }[];
  byBusiness: { clientId: string; businessName: string; calls: number; booked: number; transferred: number; spam: number; avgHandleSeconds: number }[];
  byAgent: { name: string; calls: number; tookOver: number; listened: number }[];
}

const RANGES = [{ id: '7d', label: '7 days' }, { id: '30d', label: '30 days' }, { id: '90d', label: '90 days' }];

function fmtDur(s: number): string { if (!s) return '0:00'; const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }
function hourLabel(h: number): string { const am = h < 12; const v = h % 12 === 0 ? 12 : h % 12; return `${v}${am ? 'a' : 'p'}`; }
function dayLabel(d: string): string { const parts = d.split('-'); return parts.length === 3 ? `${parseInt(parts[1])}/${parseInt(parts[2])}` : d; }

export default function CallCenterAnalytics() {
  const { agency } = useAgency();
  const theme = useTheme();
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!agency?.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${backendUrl}/api/agency/${agency.id}/cc/analytics?range=${range}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); if (d.success) setData(d); }
    } catch { /* keep last good */ } finally { setLoading(false); }
  }, [agency?.id, range]);

  useEffect(() => { load(); }, [load]);

  const t = data?.totals;
  const maxDay = Math.max(1, ...(data?.byDay || []).map(d => d.count));
  const maxHour = Math.max(1, ...(data?.byHour || []).map(h => h.count));

  const stat = (label: string, value: string | number, Icon: any, color: string, sub?: string) => (
    <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: theme.textMuted }}>{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1a` }}><Icon className="h-4 w-4" style={{ color }} /></span>
      </div>
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums" style={{ color: theme.text }}>{value}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>{sub}</div>}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><BarChart3 className="h-5 w-5" style={{ color: theme.primary }} /></div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Analytics</h1>
            <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Call performance across every business. Times shown in ET.</p>
          </div>
        </div>
        <div className="inline-flex rounded-xl p-0.5" style={{ backgroundColor: theme.hover }}>
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRange(r.id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors" style={range === r.id ? { backgroundColor: theme.card, color: theme.text, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } : { color: theme.textMuted }}>{r.label}</button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Crunching the numbers...</div>
      ) : (
        <div className="space-y-5 sm:space-y-6" style={{ opacity: loading ? 0.6 : 1 }}>
          {/* Rate KPIs (4) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stat('Total calls', t?.calls ?? 0, Radio, theme.primary)}
            {stat('AI deflection', `${t?.deflectionRate ?? 0}%`, Bot, '#22c55e', `${t?.aiHandled ?? 0} handled by AI`)}
            {stat('Escalation', `${t?.escalationRate ?? 0}%`, PhoneForwarded, '#f59e0b', `${t?.escalated ?? 0} to a person`)}
            {stat('Booking rate', `${t?.bookingRate ?? 0}%`, CalendarCheck, theme.primary, `${t?.booked ?? 0} booked`)}
          </div>
          {/* Volume KPIs (4) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stat('Avg handle time', fmtDur(t?.avgHandleSeconds ?? 0), Clock, theme.primary)}
            {stat('Transferred', t?.transferred ?? 0, PhoneForwarded, '#f59e0b')}
            {stat('Spam blocked', t?.spam ?? 0, ShieldX, theme.textMuted)}
            {stat('After hours', t?.afterHours ?? 0, Moon, '#8b5cf6')}
          </div>

          {/* Call volume by day */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Call volume</h2>
            {(!data || data.byDay.length === 0) ? <p className="text-[13px]" style={{ color: theme.textMuted }}>No data yet.</p> : (
              <div className="flex items-end gap-[2px] sm:gap-1" style={{ height: 140 }}>
                {data.byDay.map((d) => (
                  <div key={d.date} className="relative flex-1 min-w-0 flex flex-col items-center justify-end h-full group">
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg px-2 py-1 text-[11px] font-medium whitespace-nowrap shadow-lg" style={{ backgroundColor: theme.text, color: theme.bg }}>{dayLabel(d.date)}: {d.count} {d.count === 1 ? 'call' : 'calls'}</div>
                    <div className="w-full rounded-t transition-all" style={{ height: `${Math.max(2, (d.count / maxDay) * 100)}%`, backgroundColor: d.count ? theme.primary : theme.border, opacity: d.count ? 1 : 0.5 }} />
                  </div>
                ))}
              </div>
            )}
            {data && data.byDay.length > 0 && (
              <div className="flex justify-between mt-2 text-[10px]" style={{ color: theme.textMuted }}>
                <span>{dayLabel(data.byDay[0].date)}</span>
                <span>{dayLabel(data.byDay[Math.floor(data.byDay.length / 2)].date)}</span>
                <span>{dayLabel(data.byDay[data.byDay.length - 1].date)}</span>
              </div>
            )}
          </div>

          {/* Peak hours */}
          <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Busiest hours (ET)</h2>
            <div className="flex items-end gap-[2px] sm:gap-1" style={{ height: 110 }}>
              {(data?.byHour || []).map((h) => (
                <div key={h.hour} className="relative flex-1 min-w-0 flex flex-col items-center justify-end h-full group">
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg px-2 py-1 text-[11px] font-medium whitespace-nowrap shadow-lg" style={{ backgroundColor: theme.text, color: theme.bg }}>{hourLabel(h.hour)}: {h.count} {h.count === 1 ? 'call' : 'calls'}</div>
                  <div className="w-full rounded-t" style={{ height: `${Math.max(2, (h.count / maxHour) * 100)}%`, backgroundColor: h.count ? theme.primary : theme.border, opacity: h.count ? 0.9 : 0.4 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px]" style={{ color: theme.textMuted }}>
              <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span>
            </div>
          </div>

          {/* Per business + per agent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5" style={{ borderBottom: `1px solid ${theme.border}` }}><Building2 className="h-4 w-4" style={{ color: theme.textMuted }} /><h2 className="text-sm font-semibold" style={{ color: theme.text }}>By business</h2></div>
              {(!data || data.byBusiness.length === 0) ? <div className="px-5 py-8 text-center text-[13px]" style={{ color: theme.textMuted }}>No data yet.</div> : (
                <div className="max-h-[22rem] overflow-y-auto">
                  {data.byBusiness.map((b, i) => (
                    <div key={b.clientId} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}>
                      <div className="min-w-0"><p className="text-sm truncate" style={{ color: theme.text }}>{b.businessName}</p><p className="text-[11px]" style={{ color: theme.textMuted }}>{b.booked} booked · {b.transferred} transferred · {fmtDur(b.avgHandleSeconds)} avg</p></div>
                      <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: theme.text }}>{b.calls}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5" style={{ borderBottom: `1px solid ${theme.border}` }}><Headset className="h-4 w-4" style={{ color: theme.textMuted }} /><h2 className="text-sm font-semibold" style={{ color: theme.text }}>By agent</h2></div>
              {(!data || data.byAgent.length === 0) ? <div className="px-5 py-8 text-center text-[13px]" style={{ color: theme.textMuted }}>No agent activity in this range.</div> : (
                <div className="max-h-[22rem] overflow-y-auto">
                  {data.byAgent.map((a, i) => (
                    <div key={a.name} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}>
                      <div className="min-w-0"><p className="text-sm truncate" style={{ color: theme.text }}>{a.name}</p><p className="text-[11px]" style={{ color: theme.textMuted }}>{a.tookOver} took over · {a.listened} monitored</p></div>
                      <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: theme.text }}>{a.calls}</span>
                    </div>
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
