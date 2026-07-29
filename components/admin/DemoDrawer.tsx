'use client';

// ============================================================================
// DEMO DRAWER (shared)
// Detail panel for a single demo call. Demos are leads, so this shows the sales
// signals (interest, score, business, service discussed, questions asked) plus
// the recording and transcript. Fetches /api/admin/demos/:id given a demoId.
// Used by the Growth demos surface (and can be reused by the Overview hot demos).
// ============================================================================

import { useEffect, useState } from 'react';
import { X, Loader2, FileText, Sparkles, Phone, Building2, HelpCircle, Gauge } from 'lucide-react';
import { formatPhone, timeAgo, formatDuration } from '@/lib/admin/format';
import { getDemoInterest } from '@/lib/admin/status';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

interface DemoDetail {
  demo: any;
  agency: { id: string; name: string };
}

export default function DemoDrawer({ demoId, onClose }: { demoId: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<DemoDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!demoId) { setDetail(null); return; }
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    (async () => {
      try {
        const res = await fetch(`${backendUrl()}/api/admin/demos/${demoId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (!res.ok) throw new Error('demo detail failed');
        const data = await res.json();
        if (!cancelled) setDetail(data);
      } catch (e) { console.error(e); } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [demoId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!demoId) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="admin-scope fixed top-0 right-0 h-full w-[512px] max-w-[92vw] z-50 overflow-y-auto border-l border-[var(--a-line)]" style={{ background: 'var(--a-bg)', boxShadow: '-12px 0 40px rgba(12,32,24,.12)' }}>
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

function DrawerBody({ detail, onClose }: { detail: DemoDetail; onClose: () => void }) {
  const d = detail.demo;
  const agency = detail.agency;
  const interest = getDemoInterest(d.interest_level);

  const captured: [string, string][] = [
    ['Business', d.business_name || 'Unknown'],
    ['Type', d.business_type ? String(d.business_type).replace(/_/g, ' ') : '\u2013'],
    ['Caller', d.caller_name || 'Unknown'],
    ['Location', d.caller_location || '\u2013'],
    ['Service discussed', d.service_discussed || '\u2013'],
    ['Demo score', d.vapi_success_score ? `${d.vapi_success_score}/10` : '\u2013'],
  ];

  return (
    <>
      <div className="sticky top-0 z-[2] p-5 border-b border-[var(--a-line)]" style={{ background: 'var(--a-bg)' }}>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold px-3 py-1.5 rounded-full" style={{ color: interest.color, background: interest.bg }}>
            <Sparkles className="h-3.5 w-3.5" />{interest.label}
          </span>
          <button onClick={onClose} className="a-btn-ghost !p-2 ml-auto"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="text-[19px] font-bold text-[var(--a-ink)]">{d.business_name || 'Unknown business'}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[12.5px] text-[var(--a-dim)]">
          <Phone className="h-3.5 w-3.5" /><span className="a-num">{formatPhone(d.caller_phone)}</span>
          <span>&middot;</span><Building2 className="h-3.5 w-3.5" />{agency?.name}
        </div>
        <div className="mt-1 text-[12.5px] text-[var(--a-dim)]">
          {timeAgo(d.created_at)} &nbsp;&middot;&nbsp; {formatDuration(d.duration_seconds)}
          {d.asked_questions && <> &nbsp;&middot;&nbsp; <HelpCircle className="inline h-3.5 w-3.5" /> asked questions</>}
        </div>
        <div className="mt-3 rounded-lg px-3 py-2 text-[12.5px] font-semibold" style={{ background: interest.bg, color: interest.color }}>
          {interest.followUp}
        </div>
      </div>

      <div className="p-5 space-y-5">
        <section>
          <h4 className="text-[10px] uppercase tracking-[.08em] font-bold text-[var(--a-em-deep)] mb-2.5">Recording</h4>
          {d.recording_url ? (
            <div className="rounded-[13px] p-3" style={{ background: 'var(--a-sidebar)' }}>
              <audio controls preload="none" src={d.recording_url} className="w-full" />
            </div>
          ) : (
            <div className="a-card p-4 text-[13px] text-[var(--a-dim)]">No recording available.</div>
          )}
        </section>

        <section>
          <h4 className="text-[10px] uppercase tracking-[.08em] font-bold text-[var(--a-em-deep)] mb-2.5">Demo details</h4>
          <div className="grid grid-cols-2 gap-2.5">
            {captured.map(([k, v]) => (
              <div key={k} className="a-card p-3">
                <div className="text-[10.5px] font-semibold text-[var(--a-dim)]">{k}</div>
                <div className="text-[13.5px] font-semibold text-[var(--a-ink)] mt-0.5 break-words capitalize">{v}</div>
              </div>
            ))}
          </div>
          {d.summary && (
            <div className="a-card p-3.5 mt-2.5">
              <div className="text-[10.5px] font-semibold text-[var(--a-dim)] mb-1">Summary</div>
              <div className="text-[13px] text-[var(--a-muted)] leading-relaxed">{d.summary}</div>
            </div>
          )}
        </section>

        <section>
          <h4 className="text-[10px] uppercase tracking-[.08em] font-bold text-[var(--a-em-deep)] mb-2.5">Transcript</h4>
          {d.transcript ? (
            <pre className="a-card p-4 text-[12.5px] text-[var(--a-muted)] leading-relaxed whitespace-pre-wrap max-h-[280px] overflow-y-auto font-sans">{d.transcript}</pre>
          ) : (
            <div className="a-card p-4 flex items-center gap-2.5 text-[13px] text-[var(--a-dim)]"><FileText className="h-4 w-4" /> No transcript captured.</div>
          )}
        </section>
      </div>
    </>
  );
}