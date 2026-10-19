'use client';

// ============================================================================
// /cc/messages - the call-center messages & callbacks inbox.
//
// The worklist of calls the AI handled that still need a human to follow up
// (not spam, not transferred to a person, no appointment booked). Agents work
// the Open tab top to bottom: read what the caller wanted, call them back, add
// a note, and mark it done. Managers see every business; an agent sees only the
// businesses assigned to them (scoped server-side).
//
// Theme-aware (useTheme inline styles) so it white-labels in light and dark.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Inbox, Search, Loader2, Building2, Check, Undo2, StickyNote, ExternalLink,
  ChevronLeft, ChevronRight, ChevronDown, Phone, CircleDot, CheckCircle2,
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
  reason: string | null;
  service: string | null;
  urgency: string | null;
  sentiment: string | null;
  outcome: string | null;
  callerSpoke: boolean;
  durationSeconds: number;
  at: string;
  status: 'open' | 'done';
  note: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
}
interface Biz { clientId: string; businessName: string; }

// Why this call needs a human, shown as a labelled badge on each row.
const OUTCOME_LABELS: Record<string, string> = {
  message: 'Left a message',
  callback_requested: 'Callback requested',
  unanswered: 'Question unanswered',
  complaint: 'Complaint',
  abandoned: 'Hung up before finishing',
};

const TABS = [
  { v: 'open', label: 'Open' },
  { v: 'done', label: 'Done' },
  { v: 'all', label: 'All' },
];

function fmtPhone(p: string | null): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}
function fmtWhen(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return ''; }
}

export default function CallCenterMessages() {
  const { agency, isAgent } = useAgency();
  const theme = useTheme();

  const [rows, setRows] = useState<Row[]>([]);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [openTotal, setOpenTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [tab, setTab] = useState<'open' | 'done' | 'all'>('open');
  const [business, setBusiness] = useState('');
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [page, setPage] = useState(1);

  // Per-row UI state: which note editors are open, draft text, and which row is busy.
  const [noteOpen, setNoteOpen] = useState<Record<string, boolean>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setQDebounced(q.trim()), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [qDebounced, business, tab]);

  const reqRef = useRef(0);
  const load = useCallback(async () => {
    if (!agency?.id) return;
    const my = ++reqRef.current;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const params = new URLSearchParams({ status: tab, page: String(page), limit: '25', range: 'all' });
      if (qDebounced) params.set('q', qDebounced);
      if (business) params.set('business', business);
      const r = await fetch(`${base}/api/agency/${agency.id}/cc/messages?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        if (my !== reqRef.current) return;
        if (d.success) {
          setRows(Array.isArray(d.rows) ? d.rows : []);
          setTotal(d.total || 0);
          setOpenTotal(d.openTotal || 0);
          setTotalPages(d.totalPages || 1);
          if (Array.isArray(d.businesses)) setBusinesses(d.businesses);
        }
      }
    } catch { /* keep last good */ }
    finally { if (my === reqRef.current) setLoading(false); }
  }, [agency?.id, tab, business, qDebounced, page]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, path: 'resolve' | 'reopen', note?: string) => {
    if (!agency?.id) return;
    setBusyId(id);
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${base}/api/agency/${agency.id}/cc/messages/${id}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(note !== undefined ? { note } : {}),
      });
      setNoteOpen((s) => ({ ...s, [id]: false }));
      await load();
    } catch { /* non-fatal; reload will reconcile */ }
    finally { setBusyId(null); }
  };

  const urgencyStyle = (u: string | null) => {
    if (u === 'high' || u === 'emergency') return { bg: theme.errorBg, fg: theme.error };
    if (u === 'medium') return { bg: theme.warningBg, fg: theme.warning };
    return { bg: theme.hover, fg: theme.textMuted };
  };

  const selStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;
  const ddUI: DropdownUI = { inputStyle: selStyle, text: theme.text, muted: theme.textMuted, panelBg: theme.card, panelBorder: theme.border, hover: theme.hover, accent: theme.primary, isDark: theme.isDark };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
            <Inbox className="h-5 w-5" style={{ color: theme.primary }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Callbacks</h1>
            <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>
              Calls that need a callback across {isAgent ? 'your assigned businesses' : 'your businesses'}. Work them, note them, mark them done.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.primary15, color: theme.primary }}>
          <CircleDot className="h-3.5 w-3.5" /> {openTotal} open
        </span>
      </div>

      {/* Tabs + filters */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-1 p-1 rounded-xl w-full sm:w-auto sm:inline-flex" style={{ backgroundColor: theme.hover }}>
          {TABS.map((t) => {
            const on = tab === t.v;
            return (
              <button key={t.v} onClick={() => setTab(t.v as any)}
                className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition"
                style={on ? { backgroundColor: theme.card, color: theme.text, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: theme.textMuted }}>
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textSubtle }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search caller, phone, or reason"
              className="w-full rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none" style={selStyle} />
          </div>
          <CustomSelect value={business} onChange={setBusiness}
            options={[{ value: '', label: 'All businesses' }, ...businesses.map((b) => ({ value: b.clientId, label: b.businessName }))]}
            ui={ddUI} />
        </div>
      </div>

      <p className="text-[12px] mb-2.5" style={{ color: theme.textMuted }}>
        {loading ? 'Loading...' : `${total.toLocaleString()} ${tab === 'open' ? 'open' : tab === 'done' ? 'resolved' : ''} item${total === 1 ? '' : 's'}`.replace('  ', ' ')}
      </p>

      {/* List */}
      {loading && rows.length === 0 ? (
        <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: theme.textMuted }}>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl py-12 flex flex-col items-center justify-center text-center" style={{ border: `1px dashed ${theme.border}` }}>
          <CheckCircle2 className="h-8 w-8 mb-2.5" style={{ color: theme.textSubtle }} />
          <p className="text-sm font-medium" style={{ color: theme.text }}>{tab === 'open' ? 'Inbox zero' : 'Nothing here'}</p>
          <p className="text-[13px] mt-1" style={{ color: theme.textMuted }}>{tab === 'open' ? 'No calls are waiting on a callback right now.' : 'Try another tab or filter.'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((c) => {
            const done = c.status === 'done';
            const us = urgencyStyle(c.urgency);
            const editing = !!noteOpen[c.id];
            const draft = noteDraft[c.id] ?? (c.note || '');
            return (
              <div key={c.id} className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, opacity: done ? 0.82 : 1 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>
                        {c.caller && c.caller === c.callerPhone ? fmtPhone(c.caller) : (c.caller || 'Unknown caller')}
                      </p>
                      {c.outcome && OUTCOME_LABELS[c.outcome] && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{OUTCOME_LABELS[c.outcome]}</span>
                      )}
                      {c.urgency && (c.urgency === 'high' || c.urgency === 'emergency' || c.urgency === 'medium') && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize" style={{ backgroundColor: us.bg, color: us.fg }}>{c.urgency}</span>
                      )}
                    </div>
                    <p className="text-[12.5px] truncate flex items-center gap-1.5 mt-0.5" style={{ color: theme.textMuted }}>
                      <Building2 className="h-3 w-3 flex-shrink-0" /> {c.businessName}
                      <span style={{ color: theme.textSubtle }}>· {fmtWhen(c.at)}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {c.callerPhone && (
                      <a href={`tel:${c.callerPhone}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: theme.primary }}>
                        <Phone className="h-3.5 w-3.5" /> {fmtPhone(c.callerPhone)}
                      </a>
                    )}
                  </div>
                </div>

                {c.reason && <p className="text-[13px] mt-2.5 leading-snug" style={{ color: theme.textMuted }}>{c.reason}</p>}

                {/* Note (existing or editor) */}
                {done && c.note && !editing && (
                  <div className="mt-2.5 rounded-xl p-2.5 text-[12.5px] flex items-start gap-2" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
                    <StickyNote className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: theme.textSubtle }} /> {c.note}
                  </div>
                )}
                {editing && (
                  <div className="mt-2.5">
                    <textarea value={draft} onChange={(e) => setNoteDraft((s) => ({ ...s, [c.id]: e.target.value }))}
                      rows={2} maxLength={2000} placeholder="Add a note (what the caller needs, what you did)..."
                      className="w-full rounded-xl px-3 py-2 text-[13px] outline-none resize-none" style={selStyle} />
                  </div>
                )}

                {/* Footer: status + actions */}
                <div className="flex items-center justify-between gap-2 mt-3">
                  <div className="text-[11.5px]" style={{ color: theme.textSubtle }}>
                    {done && c.resolvedBy ? `Done by ${c.resolvedBy}${c.resolvedAt ? ` · ${fmtWhen(c.resolvedAt)}` : ''}` : ''}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/cc/calls/${c.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition" style={{ color: theme.textMuted }}>
                      <ExternalLink className="h-3.5 w-3.5" /> View call
                    </Link>
                    <button onClick={() => setNoteOpen((s) => ({ ...s, [c.id]: !s[c.id] }))}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition"
                      style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
                      <StickyNote className="h-3.5 w-3.5" /> {editing ? 'Cancel' : (c.note ? 'Edit note' : 'Note')}
                    </button>
                    {done ? (
                      <button onClick={() => act(c.id, 'reopen')} disabled={busyId === c.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition disabled:opacity-50"
                        style={{ backgroundColor: theme.hover, color: theme.text }}>
                        {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />} Reopen
                      </button>
                    ) : (
                      <button onClick={() => act(c.id, 'resolve', editing ? draft : undefined)} disabled={busyId === c.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition disabled:opacity-50"
                        style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                        {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Mark done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-40"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-[13px]" style={{ color: theme.textMuted }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-40"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}>
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}