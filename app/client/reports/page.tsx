'use client';

// ============================================================================
// Client-facing reporting. Lives under the client shell, so it is automatically
// white-labeled by useClientTheme: the AGENCY's brand by default, or the
// business's own brand when the agency has enabled client branding and the
// business has set it. No VoiceAI branding ever appears here.
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { PhoneCall, CalendarCheck, AlertTriangle, ShieldX, Clock, BarChart3, Loader2 } from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';

type Period = '7' | '30' | '90';

export default function ClientReportsPage() {
  const { client, loading: clientLoading } = useClient();
  const theme = useClientTheme();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30');

  useEffect(() => {
    if (!client?.id) return;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${backendUrl}/api/client/${client.id}/calls`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); setCalls(Array.isArray(d.calls) ? d.calls : []); }
      } catch (e) { console.error('Reports fetch error:', e); } finally { setLoading(false); }
    })();
  }, [client?.id]);

  const periodDays = Number(period);
  const report = useMemo(() => {
    const now = Date.now();
    const since = now - periodDays * 86400000;
    const isSpam = (c: any) => c.is_spam || c.call_status === 'spam';
    const inPeriod = calls.filter((c) => new Date(c.created_at).getTime() >= since);

    const answered = inPeriod.filter((c) => !isSpam(c)).length;
    const appts = inPeriod.filter((c) => c.appointment_booked).length;
    const urgent = inPeriod.filter((c) => !isSpam(c) && (c.urgency_level === 'high' || c.urgency_level === 'emergency' || c.call_status === 'transferred' || c.transfer_status === 'transferred')).length;
    const spam = inPeriod.filter(isSpam).length;
    const afterHours = inPeriod.filter((c) => { if (isSpam(c)) return false; const d = new Date(c.created_at); const h = d.getHours(); const day = d.getDay(); return day === 0 || day === 6 || h < 8 || h >= 18; }).length;
    const talkSecs = inPeriod.reduce((s, c) => s + (Number(c.duration_seconds) || 0), 0);

    // Daily buckets for the chart.
    const days: { label: string; count: number }[] = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const count = inPeriod.filter((c) => new Date(c.created_at).toISOString().slice(0, 10) === key).length;
      days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, count });
    }
    return { answered, appts, urgent, spam, afterHours, talkSecs, days };
  }, [calls, periodDays]);

  const fmtTalk = (s: number) => (s < 3600 ? `${Math.round(s / 60)}m` : `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`);
  const maxDay = Math.max(1, ...report.days.map((d) => d.count));

  const cards = [
    { label: 'Calls answered', value: report.answered, icon: PhoneCall, color: theme.primary },
    { label: 'Appointments booked', value: report.appts, icon: CalendarCheck, color: theme.success },
    { label: 'Urgent calls flagged', value: report.urgent, icon: AlertTriangle, color: theme.warning },
    { label: 'After-hours calls caught', value: report.afterHours, icon: Clock, color: theme.primary },
    { label: 'Spam blocked', value: report.spam, icon: ShieldX, color: theme.textMuted4 },
    { label: 'Total talk time', value: fmtTalk(report.talkSecs), icon: Clock, color: theme.success },
  ];

  const periods: { id: Period; label: string }[] = [
    { id: '7', label: '7 days' }, { id: '30', label: '30 days' }, { id: '90', label: '90 days' },
  ];

  if (clientLoading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <div className="max-w-5xl">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-tight flex items-center gap-2.5" style={{ color: theme.text }}>
              <BarChart3 className="h-6 w-6" style={{ color: theme.primary }} /> Reports
            </h1>
            <p className="mt-0.5 text-[13px] sm:text-sm" style={{ color: theme.textMuted }}>
              What your AI receptionist handled{client?.business_name ? ` for ${client.business_name}` : ''}.
            </p>
          </div>
          <div className="inline-flex rounded-xl p-0.5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
            {periods.map((p) => {
              const active = period === p.id;
              return (
                <button key={p.id} onClick={() => setPeriod(p.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={active ? { backgroundColor: theme.primary, color: theme.primaryText } : { color: theme.textMuted }}>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {cards.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: `${c.color}1a` }}>
                        <Icon className="h-4.5 w-4.5" style={{ color: c.color }} />
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold" style={{ color: theme.text }}>{c.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{c.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl p-4 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: theme.text }}>Calls per day</h3>
              {report.days.every((d) => d.count === 0) ? (
                <p className="py-10 text-center text-sm" style={{ color: theme.textMuted }}>No calls in this period yet.</p>
              ) : (
                <div className="flex items-end gap-[3px] h-40">
                  {report.days.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end group relative" style={{ minWidth: 0 }}>
                      <div className="w-full rounded-t transition-all" title={`${d.label}: ${d.count}`}
                        style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count > 0 ? '4px' : '0', backgroundColor: theme.primary, opacity: d.count > 0 ? 0.85 : 0.15 }} />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-2 text-[10px]" style={{ color: theme.textMuted4 }}>
                <span>{report.days[0]?.label}</span>
                <span>{report.days[report.days.length - 1]?.label}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}