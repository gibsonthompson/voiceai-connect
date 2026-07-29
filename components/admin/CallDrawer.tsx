'use client';

// ============================================================================
// CALL DRAWER (shared)
// Slide-in detail panel for a single call: recording, captured info, AI summary,
// and transcript. Fetches /api/admin/calls/:id itself given a callId. Used by
// both the Overview and the Calls page so the drawer lives in exactly one place.
// HIPAA calls store no recording or transcript, so those render a hidden state.
// ============================================================================

import { useEffect, useState } from 'react';
import { X, Loader2, FileText, ShieldAlert } from 'lucide-react';
import { formatPhone, timeAgo, formatDuration, formatUSD } from '@/lib/admin/format';
import { deriveCallOutcome } from '@/lib/admin/status';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

interface CallDetail {
  call: any;
  outcome: string;
  client: { business_name: string; industry: string | null; hipaa_mode: boolean };
  agency: { name: string };
  cost: { vapi_cost: number | null; duration_seconds: number | null };
  contact: any;
}

export default function CallDrawer({ callId, onClose }: { callId: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!callId) { setDetail(null); return; }
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    (async () => {
      try {
        const res = await fetch(`${backendUrl()}/api/admin/calls/${callId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error('call detail failed');
        const data = await res.json();
        if (!cancelled) setDetail(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [callId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!callId) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div
        className="admin-scope fixed top-0 right-0 h-full w-[512px] max-w-[92vw] z-50 overflow-y-auto border-l border-[var(--a-line)]"
        style={{ background: 'var(--a-bg)', boxShadow: '-12px 0 40px rgba(12,32,24,.12)' }}
      >
        {loading || !detail ? (
          <div className="p-6">
            <button onClick={onClose} className="a-btn-ghost !p-2 float-right"><X className="h-4 w-4" /></button>
            <div className="pt-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--a-em)]" /></div>
          </div>
        ) : (
          <DrawerBody detail={detail} onClose={onClose} />
        )}
      </div>
    </>
  );
}

function DrawerBody({ detail, onClose }: { detail: CallDetail; onClose: () => void }) {
  const { call, client, agency, cost } = detail;
  const o = deriveCallOutcome(call);
  const hipaaHidden = client?.hipaa_mode === true;
  const captured: [string, string][] = [
    ['Name', call.customer_name || 'Unknown'],
    ['Phone', formatPhone(call.customer_phone)],
    ['Email', call.customer_email || '\u2013'],
    ['Urgency', call.urgency_level || '\u2013'],
  ];

  return (
    <>
      <div className="sticky top-0 z-[2] p-5 border-b border-[var(--a-line)]" style={{ background: 'var(--a-bg)' }}>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold px-3 py-1.5 rounded-full a-card" style={{ color: o.color }}>
            <span className="a-dot" style={{ background: o.color }} />{o.label}
          </span>
          <button onClick={onClose} className="a-btn-ghost !p-2 ml-auto"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="a-num text-[21px] font-bold text-[var(--a-ink)]">{formatPhone(call.customer_phone)}</span>
          <span className="text-[12px] text-[var(--a-dim)]">{client?.business_name} via {agency?.name}</span>
        </div>
        <div className="mt-1 text-[12.5px] text-[var(--a-dim)]">
          {timeAgo(call.created_at)} &nbsp;&middot;&nbsp; {formatDuration(call.duration_seconds)} &nbsp;&middot;&nbsp; {cost?.vapi_cost != null ? formatUSD(cost.vapi_cost) : 'cost not recorded'}
        </div>
      </div>

      <div className="p-5 space-y-5">
        <section>
          <h4 className="text-[10px] uppercase tracking-[.08em] font-bold text-[var(--a-em-deep)] mb-2.5">Recording</h4>
          {hipaaHidden ? (
            <div className="a-card p-4 flex items-center gap-2.5 text-[13px] text-[var(--a-muted)]">
              <ShieldAlert className="h-4 w-4 text-[var(--a-amber)]" /> Hidden for HIPAA mode
            </div>
          ) : call.recording_url ? (
            <div className="rounded-[13px] p-3" style={{ background: 'var(--a-sidebar)' }}>
              <audio controls preload="none" src={call.recording_url} className="w-full" />
            </div>
          ) : (
            <div className="a-card p-4 text-[13px] text-[var(--a-dim)]">No recording available.</div>
          )}
        </section>

        <section>
          <h4 className="text-[10px] uppercase tracking-[.08em] font-bold text-[var(--a-em-deep)] mb-2.5">Captured info</h4>
          <div className="grid grid-cols-2 gap-2.5">
            {captured.map(([k, v]) => (
              <div key={k} className="a-card p-3">
                <div className="text-[10.5px] font-semibold text-[var(--a-dim)]">{k}</div>
                <div className="text-[13.5px] font-semibold text-[var(--a-ink)] mt-0.5 break-words">{v}</div>
              </div>
            ))}
          </div>
          {call.ai_summary && (
            <div className="a-card p-3.5 mt-2.5">
              <div className="text-[10.5px] font-semibold text-[var(--a-dim)] mb-1">Summary</div>
              <div className="text-[13px] text-[var(--a-muted)] leading-relaxed">{call.ai_summary}</div>
            </div>
          )}
        </section>

        <section>
          <h4 className="text-[10px] uppercase tracking-[.08em] font-bold text-[var(--a-em-deep)] mb-2.5">Transcript</h4>
          {hipaaHidden ? (
            <div className="a-card p-4 flex items-center gap-2.5 text-[13px] text-[var(--a-muted)]">
              <ShieldAlert className="h-4 w-4 text-[var(--a-amber)]" /> Hidden for HIPAA mode
            </div>
          ) : call.transcript ? (
            <pre className="a-card p-4 text-[12.5px] text-[var(--a-muted)] leading-relaxed whitespace-pre-wrap max-h-[280px] overflow-y-auto font-sans">{call.transcript}</pre>
          ) : (
            <div className="a-card p-4 flex items-center gap-2.5 text-[13px] text-[var(--a-dim)]">
              <FileText className="h-4 w-4" /> No transcript captured.
            </div>
          )}
        </section>
      </div>
    </>
  );
}