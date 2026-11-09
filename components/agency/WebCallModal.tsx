'use client';

// ============================================================================
// WebCallModal: in-dashboard popup that places a browser web call to a
// client's AI receptionist, so the agency can test the live assistant without
// dialing a phone. Uses the VAPI web SDK (same engine as a real call).
//
// It resolves the client's assistant from /api/client/:id/live/info, shows the
// client's phone number (you're "calling" that line), and streams a live
// transcript. Transcript direction is natural: YOU are on the right, the AI
// receptionist is on the left, so it never reads backwards.
//
// Themed with the dashboard theme object (inline styles), so it white-labels in
// both light and dark exactly like the rest of the agency dashboard.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Phone, PhoneOff, Mic, MicOff, Loader2, Radio } from 'lucide-react';

interface Props {
  clientId: string;
  open: boolean;
  onClose: () => void;
  theme: any;
}

type Phase = 'loading' | 'idle' | 'connecting' | 'live' | 'ended' | 'error';
interface Line { role: 'user' | 'assistant'; text: string; }
interface Info { assistantId: string | null; businessName: string; phone: string | null; primary: string; }

function formatPhone(raw: string | null): string {
  if (!raw) return '';
  const d = raw.replace(/[^\d]/g, '');
  if (d.length === 11 && d.startsWith('1')) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
}

export default function WebCallModal({ clientId, open, onClose, theme }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [info, setInfo] = useState<Info | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState<Line | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.myvoiceaiconnect.com';
  const vapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

  const clearTimer = useCallback(() => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }, []);
  const endCall = useCallback(() => { try { vapiRef.current?.stop(); } catch {} clearTimer(); }, [clearTimer]);

  // Load the client's receptionist + number each time the popup opens.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setPhase('loading'); setError(''); setLines([]); setInterim(null); setSeconds(0); setMuted(false);
    (async () => {
      try {
        const token = (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '') || '';
        const res = await fetch(`${API}/api/client/${clientId}/live/info`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || 'Could not load this client.');
        if (!alive) return;
        setInfo({
          assistantId: data.client?.assistant_id || null,
          businessName: data.client?.business_name || 'this client',
          phone: data.client?.phone_number || null,
          primary: data.branding?.primary_color || theme?.primary || '#01f5d1',
        });
        setPhase('idle');
      } catch (e: any) {
        if (alive) { setError(e?.message || 'Could not load this client.'); setPhase('error'); }
      }
    })();
    return () => { alive = false; };
  }, [open, clientId, API, theme?.primary]);

  // Stop any active call when the popup closes or unmounts.
  useEffect(() => { if (!open) endCall(); }, [open, endCall]);
  useEffect(() => () => endCall(), [endCall]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => { if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight; }, [lines, interim]);

  const startCall = useCallback(async () => {
    if (!info?.assistantId) { setError('This client has no AI receptionist set up yet.'); return; }
    if (!vapiKey) { setError('Web calling is not configured.'); return; }
    setPhase('connecting'); setError(''); setLines([]); setInterim(null); setSeconds(0); setMuted(false);
    try {
      const { default: Vapi } = await import('@vapi-ai/web');
      const v = new Vapi(vapiKey);
      vapiRef.current = v;
      v.on('call-start', () => { setPhase('live'); clearTimer(); timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000); });
      v.on('call-end', () => { clearTimer(); setInterim(null); setPhase('ended'); });
      v.on('error', (e: any) => { clearTimer(); setInterim(null); setError(e?.message || 'The call dropped. Try again.'); setPhase('ended'); });
      v.on('message', (m: any) => {
        if (m?.type !== 'transcript' || !m.transcript) return;
        // VAPI 'user' = the person on the mic (you, testing). 'assistant' = the
        // AI receptionist. Kept as-is and rendered You-right / AI-left below.
        const role: 'user' | 'assistant' = m.role === 'user' ? 'user' : 'assistant';
        const text = String(m.transcript).trim();
        if (!text) return;
        if (m.transcriptType === 'partial') setInterim({ role, text });
        else if (m.transcriptType === 'final') { setLines((prev) => [...prev, { role, text }]); setInterim(null); }
      });
      await v.start(info.assistantId);
    } catch (e: any) {
      setError(e?.message || 'Could not start the call. Check microphone permissions.');
      setPhase('ended');
    }
  }, [info, vapiKey, clearTimer]);

  const toggleMute = useCallback(() => {
    const v = vapiRef.current; if (!v) return;
    const next = !muted; setMuted(next);
    try { v.setMuted(next); } catch {}
  }, [muted]);

  if (!open) return null;

  const primary = info?.primary || theme?.primary || '#01f5d1';
  const primaryText = theme?.primaryText || '#ffffff';
  const card = theme?.card || (theme?.isDark ? '#0a0a0a' : '#ffffff');
  const border = theme?.border || theme?.inputBorder || (theme?.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
  const text = theme?.text || (theme?.isDark ? '#fafafa' : '#111111');
  const muteBg = theme?.input || (theme?.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)');
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');

  const renderLine = (ln: Line, key: string, dim?: boolean) => {
    const you = ln.role === 'user';
    return (
      <div key={key} className={`flex ${you ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[80%]">
          <div className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: theme?.textMuted, textAlign: you ? 'right' : 'left' }}>
            {you ? 'You' : (info?.businessName ? `${info.businessName} AI` : 'AI receptionist')}
          </div>
          <div className="rounded-2xl px-3.5 py-2 text-[14px] leading-snug" style={you
            ? { backgroundColor: primary, color: primaryText, opacity: dim ? 0.6 : 1 }
            : { backgroundColor: muteBg, color: text, opacity: dim ? 0.6 : 1 }}>
            {ln.text}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: card, border: `1px solid ${border}`, maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: `${primary}1f` }}>
              <Radio className="h-4 w-4" style={{ color: primary }} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: text }}>Web Call</div>
              <div className="text-[12px] truncate" style={{ color: theme?.textMuted }}>{info?.businessName || 'Loading...'}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg flex-shrink-0" style={{ color: theme?.textMuted }} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col">
          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-3"><Loader2 className="h-6 w-6 animate-spin" style={{ color: primary }} /><p className="text-sm" style={{ color: theme?.textMuted }}>Loading receptionist...</p></div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center justify-center py-14 px-6 gap-3 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}><PhoneOff className="h-5 w-5" style={{ color: '#ef4444' }} /></div>
              <p className="text-sm" style={{ color: text }}>{error || 'Something went wrong.'}</p>
              <button type="button" onClick={onClose} className="mt-1 rounded-xl px-4 py-2 text-sm font-medium" style={{ backgroundColor: muteBg, color: text, border: `1px solid ${border}` }}>Close</button>
            </div>
          )}

          {(phase === 'idle' || phase === 'ended') && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              {info?.phone ? (
                <>
                  <p className="text-[12px] uppercase tracking-wide font-medium" style={{ color: theme?.textMuted }}>Calling</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: text }}>{formatPhone(info.phone)}</p>
                </>
              ) : (
                <p className="text-base font-semibold" style={{ color: text }}>{info?.businessName} AI receptionist</p>
              )}
              <p className="mt-2 text-[13px] max-w-xs" style={{ color: theme?.textMuted }}>
                {phase === 'ended' ? 'Call ended. Start another whenever you want.' : 'Talk to this client’s AI receptionist right in your browser to test it. Your mic is used for the call.'}
              </p>
              {error && <p className="mt-3 text-[13px]" style={{ color: '#ef4444' }}>{error}</p>}
              <button type="button" onClick={startCall} disabled={!info?.assistantId}
                className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: primary, color: primaryText }}>
                <Phone className="h-4 w-4" /> {phase === 'ended' ? 'Call again' : 'Start web call'}
              </button>
              {!info?.assistantId && phase === 'idle' && <p className="mt-3 text-[12px]" style={{ color: theme?.textMuted }}>This client has no AI receptionist set up yet.</p>}
            </div>
          )}

          {(phase === 'connecting' || phase === 'live') && (
            <>
              <div className="flex items-center justify-center gap-2 py-3" style={{ borderBottom: `1px solid ${border}` }}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: phase === 'live' ? '#22c55e' : primary }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: phase === 'live' ? '#22c55e' : primary }} />
                </span>
                <span className="text-sm font-medium" style={{ color: text }}>{phase === 'connecting' ? 'Connecting...' : `On call ${mm}:${ss}`}</span>
              </div>

              <div ref={transcriptRef} className="flex-1 min-h-[220px] overflow-y-auto px-4 py-4 space-y-3">
                {lines.length === 0 && !interim && (
                  <p className="text-center text-[13px] py-10" style={{ color: theme?.textMuted }}>{phase === 'connecting' ? 'Setting up the call...' : 'Say hello to start the conversation.'}</p>
                )}
                {lines.map((ln, i) => renderLine(ln, `l${i}`))}
                {interim && renderLine(interim, 'interim', true)}
              </div>

              <div className="flex items-center justify-center gap-3 px-5 py-4" style={{ borderTop: `1px solid ${border}` }}>
                <button type="button" onClick={toggleMute} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium" style={{ backgroundColor: muteBg, color: text, border: `1px solid ${border}` }}>
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} {muted ? 'Unmute' : 'Mute'}
                </button>
                <button type="button" onClick={endCall} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold" style={{ backgroundColor: '#ef4444', color: '#ffffff' }}>
                  <PhoneOff className="h-4 w-4" /> End call
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
