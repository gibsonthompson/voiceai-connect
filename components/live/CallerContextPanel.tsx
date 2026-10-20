'use client';

// ============================================================================
// components/live/CallerContextPanel.tsx
//
// "About this caller" - a compact, insight-rich panel that shows who is on the
// line: their number, whether they are a returning caller and how many times
// they have called, when they last called, any status/tags, and a short summary
// of what has been discussed on past calls. Powered by the caller context the
// backend resolves at call start (and the same data a contact record holds), so
// it can be reused anywhere a caller is shown - the live monitor, the manager
// wall, a call detail.
//
// Theme-agnostic: it takes a small set of color tokens + an accent, so it slots
// into the live monitor's branded theme or any other surface.
// ============================================================================

import { User, Phone, Repeat, Clock, Mail, MessageSquareText, Sparkles } from 'lucide-react';

export interface CallerContext {
  number: string | null;
  name: string | null;
  priorCalls: number;
  recognized: boolean;
  email?: string | null;
  summary?: string | null;
  lastCallAt?: string | null;
  tags?: string[] | null;
  status?: string | null;
}

interface ThemeLike {
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  borderSubtle: string;
  surface: string;
  pillBg: string;
}

function fmtPhone(p: string | null): string {
  if (!p) return 'Unknown number';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}
function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}
function initials(name: string | null): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export default function CallerContextPanel({ caller, t, accent }: { caller: CallerContext | null; t: ThemeLike; accent: string }) {
  if (!caller) return null;

  const name = caller.name || null;
  const prior = caller.priorCalls || 0;
  const recognized = !!caller.recognized;
  const tags = Array.isArray(caller.tags) ? caller.tags.filter(Boolean).slice(0, 4) : [];

  const Chip = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: t.pillBg, color: t.textMuted }}>{children}</span>
  );

  return (
    <div className="flex flex-col min-h-0">
      <div className="px-4 sm:px-5 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: `1px solid ${t.borderSubtle}` }}>
        <User className="h-4 w-4" style={{ color: accent }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>About this caller</span>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-3 overflow-y-auto">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
            style={{ backgroundColor: `${accent}1f`, color: accent }}>
            {initials(name) || <User className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{name || 'Unknown caller'}</p>
            <p className="text-[12.5px] tabular-nums truncate flex items-center gap-1.5" style={{ color: t.textMuted }}>
              <Phone className="h-3 w-3 flex-shrink-0" /> {fmtPhone(caller.number)}
            </p>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-1.5">
          {recognized
            ? <Chip><Repeat className="h-3 w-3" style={{ color: accent }} /> Returning{prior ? ` · ${prior} prior call${prior === 1 ? '' : 's'}` : ''}</Chip>
            : <Chip><Sparkles className="h-3 w-3" /> First-time caller</Chip>}
          {caller.lastCallAt && <Chip><Clock className="h-3 w-3" /> Last called {fmtDate(caller.lastCallAt)}</Chip>}
          {caller.status && <Chip>{caller.status}</Chip>}
          {tags.map((tg) => <Chip key={tg}>{tg}</Chip>)}
        </div>

        {/* Email */}
        {caller.email && (
          <p className="text-[12.5px] truncate flex items-center gap-1.5" style={{ color: t.textMuted }}>
            <Mail className="h-3 w-3 flex-shrink-0" /> {caller.email}
          </p>
        )}

        {/* Past-conversation summary */}
        <div className="rounded-xl p-3" style={{ backgroundColor: t.surface, border: `1px solid ${t.borderSubtle}` }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5 mb-1.5" style={{ color: t.textMuted }}>
            <MessageSquareText className="h-3.5 w-3.5" /> Past conversations
          </p>
          {caller.summary
            ? <p className="text-[12.5px] leading-relaxed" style={{ color: t.text }}>{caller.summary}</p>
            : <p className="text-[12.5px] leading-relaxed" style={{ color: t.textFaint }}>
                {recognized ? 'No summary of past calls yet.' : 'No history for this number yet. This looks like their first call.'}
              </p>}
        </div>
      </div>
    </div>
  );
}
