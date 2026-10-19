'use client';

// ============================================================================
// /cc/calls - the call-center book of record.
//
// Every call across the businesses this call center answers for, searchable and
// filterable (business, outcome, date range, free text), paginated server-side.
// Managers see all businesses; an assigned agent sees only theirs (the backend
// scopes it). Each row opens the full call detail at /cc/calls/[id].
//
// Theme-aware (useTheme inline styles) so it white-labels in light and dark.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ClipboardList, Search, Loader2, ChevronLeft, ChevronRight, Building2,
  PhoneForwarded, UserCheck, CalendarCheck, ShieldX, Bot,
} from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';
import { CustomSelect, type DropdownUI } from '@/components/ui/custom-select';

interface Row {
  id: string;
  clientId: string;
  businessName: string;
  caller: string | null;
  callerPhone: string | null;
  outcome: string;
  handledBy: string | null;
  tookOver: boolean;
  transferred: boolean;
  booked: boolean;
  spam: boolean;
  sentiment: string | null;
  language: string | null;
  durationSeconds: number;
  at: string;
}
interface Biz { clientId: string; businessName: string; }

const OUTCOMES = [
  { v: '', label: 'All outcomes' },
  { v: 'booked', label: 'Booked' },
  { v: 'transferred', label: 'Transferred' },
  { v: 'took_over', label: 'Agent took over' },
  { v: 'spam', label: 'Spam' },
];
const RANGES = [
  { v: '7d', label: 'Last 7 days' },
  { v: '30d', label: 'Last 30 days' },
  { v: '90d', label: 'Last 90 days' },
  { v: 'all', label: 'All time' },
];

function fmtPhone(p: string | null): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}
function fmtDuration(s: number): string {
  if (!s) return '-';
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}
function fmtWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

export default function CallCenterCalls() {
  const { agency, isAgent } = useAgency();
  const theme = useTheme();

  const [rows, setRows] = useState<Row[]>([]);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [business, setBusiness] = useState('');
  const [outcome, setOutcome] = useState('');
  const [range, setRange] = useState('30d');
  const [page, setPage] = useState(1);

  // Debounce the search box so we are not firing a query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Any filter change resets to page 1.
  useEffect(() => { setPage(1); }, [qDebounced, business, outcome, range]);

  const reqIdRef = useRef(0);
  const load = useCallback(async () => {
    if (!agency?.id) return;
    const myReq = ++reqIdRef.current;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const params = new URLSearchParams({ range, page: String(page), limit: '25' });
      if (qDebounced) params.set('q', qDebounced);
      if (business) params.set('business', business);
      if (outcome) params.set('outcome', outcome);
      const r = await fetch(`${base}/api/agency/${agency.id}/cc/calls?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json();
        if (myReq !== reqIdRef.current) return; // a newer request superseded this one
        if (d.success) {
          setRows(Array.isArray(d.rows) ? d.rows : []);
          setTotal(d.total || 0);
          setTotalPages(d.totalPages || 1);
          if (Array.isArray(d.businesses)) setBusinesses(d.businesses);
        }
      }
    } catch { /* keep last good */ }
    finally { if (myReq === reqIdRef.current) setLoading(false); }
  }, [agency?.id, qDebounced, business, outcome, range, page]);

  useEffect(() => { load(); }, [load]);

  const outcomeStyle = (o: string): { bg: string; fg: string; Icon: any } => {
    if (o === 'Spam') return { bg: theme.errorBg, fg: theme.error, Icon: ShieldX };
    if (o === 'Transferred') return { bg: theme.primary15, fg: theme.primary, Icon: PhoneForwarded };
    if (o === 'Agent took over') return { bg: 'rgba(245,158,11,0.14)', fg: '#f59e0b', Icon: UserCheck };
    if (o === 'Booked') return { bg: theme.successBg, fg: theme.success, Icon: CalendarCheck };
    return { bg: theme.hover, fg: theme.textMuted, Icon: Bot };
  };

  const selectStyle = {
    backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text,
  } as React.CSSProperties;
  const ddUI: DropdownUI = { inputStyle: selectStyle, text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <ClipboardList className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Calls</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>
            Every call across {isAgent ? 'the businesses assigned to you' : 'your businesses'}. Search, filter, and open any call.
          </p>
        </div>
      </div>

      {/* Filters: search on its own full-width row, then a balanced 3-up row. */}
      <div className="mb-4 sm:mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textSubtle }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by caller name, phone, or summary"
            className="w-full rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none"
            style={selectStyle}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CustomSelect value={business} onChange={setBusiness} ui={ddUI}
            options={[{ value: '', label: 'All businesses' }, ...businesses.map((b) => ({ value: b.clientId, label: b.businessName }))]} />
          <CustomSelect value={outcome} onChange={setOutcome} ui={ddUI}
            options={OUTCOMES.map((o) => ({ value: o.v, label: o.label }))} />
          <CustomSelect value={range} onChange={setRange} ui={ddUI}
            options={RANGES.map((o) => ({ value: o.v, label: o.label }))} />
        </div>
      </div>

      {/* Count line */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[12px]" style={{ color: theme.textMuted }}>
          {loading ? 'Loading...' : `${total.toLocaleString()} call${total === 1 ? '' : 's'}`}
        </p>
      </div>

      {/* Results */}
      {loading && rows.length === 0 ? (
        <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: theme.textMuted }}>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading calls...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl py-12 flex flex-col items-center justify-center text-center" style={{ border: `1px dashed ${theme.border}` }}>
          <ClipboardList className="h-8 w-8 mb-2.5" style={{ color: theme.textSubtle }} />
          <p className="text-sm font-medium" style={{ color: theme.text }}>No calls match</p>
          <p className="text-[13px] mt-1" style={{ color: theme.textMuted }}>Try a wider date range or clearing filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.card }}>
          {rows.map((c, i) => {
            const os = outcomeStyle(c.outcome);
            const OIcon = os.Icon;
            return (
              <Link
                key={c.id}
                href={`/cc/calls/${c.id}`}
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 transition"
                style={{ borderTop: i === 0 ? 'none' : `1px solid ${theme.borderSubtle}` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.hover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                {/* Caller (name + number) + business */}
                {(() => {
                  const named = !!c.caller && c.caller !== c.callerPhone;
                  const phone = c.callerPhone
                    ? fmtPhone(c.callerPhone)
                    : (!named && c.caller && /\d/.test(c.caller) ? fmtPhone(c.caller) : '');
                  const primary = named ? (c.caller as string) : (phone || 'Unknown caller');
                  return (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate flex items-center gap-2" style={{ color: theme.text }}>
                        <span className="truncate">{primary}</span>
                        {named && phone && (
                          <span className="text-[12px] font-normal tabular-nums flex-shrink-0" style={{ color: theme.textMuted }}>{phone}</span>
                        )}
                      </p>
                      <p className="text-[12.5px] truncate flex items-center gap-1.5" style={{ color: theme.textMuted }}>
                        <Building2 className="h-3 w-3 flex-shrink-0" /> {c.businessName}
                        {c.handledBy && <span style={{ color: theme.textSubtle }}>· {c.handledBy}</span>}
                      </p>
                    </div>
                  );
                })()}

                {/* Outcome */}
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: os.bg, color: os.fg }}>
                  <OIcon className="h-3.5 w-3.5" /> {c.outcome}
                </span>

                {/* Duration + time */}
                <div className="text-right flex-shrink-0 w-[92px] sm:w-[120px]">
                  <p className="text-[12.5px] tabular-nums" style={{ color: theme.textMuted }}>{fmtWhen(c.at)}</p>
                  <p className="text-[11px] tabular-nums" style={{ color: theme.textSubtle }}>{fmtDuration(c.durationSeconds)}</p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textSubtle }} />
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-40"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-[13px]" style={{ color: theme.textMuted }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-40"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

