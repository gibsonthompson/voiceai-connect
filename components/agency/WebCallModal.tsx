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
// Layout: the panel is a FIXED size. The transcript scrolls inside it, so the
// box never grows or shifts as lines stream in. Surfaces are solid (with a
// drop shadow) so nothing looks see-through, and labels use Title Case.
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
interface Info { assistant: any; assistantId: string | null; businessName: string; phone: string | null; primary: string; }

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
        const res = await fetch(`${API}/api/client/${clientId}/live/info?webcall=1`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || 'Could not load this client.');
        if (!alive) return;
        setInfo({
          // Prefer the fresh transient config; fall back to the static id.
          assistant: data.client?.assistant || null,
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
    const target = info?.assistant || info?.assistantId;
    if (!target) { setError('This client has no AI receptionist set up yet.'); return; }
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
      await v.start(target);
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

  // Solid, opaque surfaces so nothing reads as see-through.
  const isDark = theme?.isDark ?? true;
  const primary = info?.primary || theme?.primary || '#01f5d1';
  const primaryText = theme?.primaryText || '#ffffff';
  // Force a fully opaque panel. theme.card can be a semi-transparent value,
  // which made the popup look see-through, so we use a solid surface here.
  const card = isDark ? '#17171b' : '#ffffff';
  const border = theme?.border || theme?.inputBorder || (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)');
  const text = theme?.text || (isDark ? '#fafafa' : '#111111');
  const textMuted = theme?.textMuted || (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)');
  const aiBubble = isDark ? '#26262b' : '#f1f3f5';   // solid neutral, reads on any card
  const controlBg = isDark ? '#1c1c20' : '#f1f3f5';  // solid, for the mute button
  const subtle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');

  const renderLine = (ln: Line, key: string, dim?: boolean) => {
    const you = ln.role === 'user';
    return (
      <div key={key} className={`flex ${you ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[85%] md:max-w-[560px]">
          <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: textMuted, textAlign: you ? 'right' : 'left' }}>
            {you ? 'You' : (info?.businessName ? `${info.businessName} AI` : 'AI Receptionist')}
          </div>
          <div className="rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed" style={you
            ? { backgroundColor: primary, color: primaryText, opacity: dim ? 0.65 : 1 }
            : { backgroundColor: aiBubble, color: text, opacity: dim ? 0.65 : 1 }}>
            {ln.text}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: card, border: `1px solid ${border}`, boxShadow: '0 30px 90px rgba(0,0,0,0.55)', width: 'min(900px, 92vw)', height: 'min(820px, 90vh)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${border}`, backgroundColor: subtle }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: `${primary}22` }}>
              <Radio className="h-5 w-5" style={{ color: primary }} />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold truncate" style={{ color: text }}>Web Call</div>
              <div className="text-[12.5px] truncate" style={{ color: textMuted }}>{info?.businessName || 'Loading...'}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg flex-shrink-0 transition-colors" style={{ color: textMuted, backgroundColor: controlBg }} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        {/* Body (fills the fixed height; inner regions scroll, the panel does not grow) */}
        <div className="flex-1 min-h-0 flex flex-col">
          {phase === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: primary }} />
              <p className="text-sm" style={{ color: textMuted }}>Loading Receptionist...</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.14)' }}><PhoneOff className="h-5 w-5" style={{ color: '#ef4444' }} /></div>
              <p className="text-sm" style={{ color: text }}>{error || 'Something went wrong.'}</p>
              <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-medium" style={{ backgroundColor: controlBg, color: text, border: `1px solid ${border}` }}>Close</button>
            </div>
          )}

          {(phase === 'idle' || phase === 'ended') && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full mb-5" style={{ backgroundColor: `${primary}1a` }}>
                <Phone className="h-7 w-7" style={{ color: primary }} />
              </div>
              {info?.phone ? (
                <>
                  <p className="text-[12px] uppercase tracking-wide font-semibold" style={{ color: textMuted }}>Calling</p>
                  <p className="mt-1.5 text-3xl font-bold tracking-tight" style={{ color: text }}>{formatPhone(info.phone)}</p>
                </>
              ) : (
                <p className="text-lg font-semibold" style={{ color: text }}>{info?.businessName} AI Receptionist</p>
              )}
              <p className="mt-3 text-[13.5px] max-w-sm leading-relaxed" style={{ color: textMuted }}>
                {phase === 'ended' ? 'Call ended. Start another whenever you want.' : 'Talk to this client’s AI receptionist right in your browser to test it. Your microphone is used for the call.'}
              </p>
              {error && <p className="mt-3 text-[13px]" style={{ color: '#ef4444' }}>{error}</p>}
              <button type="button" onClick={startCall} disabled={!(info?.assistant || info?.assistantId)}
                className="mt-7 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-[15px] font-semibold transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: primary, color: primaryText }}>
                <Phone className="h-5 w-5" /> {phase === 'ended' ? 'Call Again' : 'Start Web Call'}
              </button>
              {!(info?.assistant || info?.assistantId) && phase === 'idle' && <p className="mt-4 text-[12.5px]" style={{ color: textMuted }}>This client has no AI receptionist set up yet.</p>}
            </div>
          )}

          {(phase === 'connecting' || phase === 'live') && (
            <>
              <div className="flex items-center justify-center gap-2 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${border}`, backgroundColor: subtle }}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ backgroundColor: phase === 'live' ? '#22c55e' : primary }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: phase === 'live' ? '#22c55e' : primary }} />
                </span>
                <span className="text-sm font-semibold" style={{ color: text }}>{phase === 'connecting' ? 'Connecting...' : `On Call ${mm}:${ss}`}</span>
              </div>

              <div ref={transcriptRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3.5">
                {lines.length === 0 && !interim && (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-center text-[13.5px] px-6" style={{ color: textMuted }}>{phase === 'connecting' ? 'Setting up the call...' : 'Say hello to start the conversation.'}</p>
                  </div>
                )}
                {lines.map((ln, i) => renderLine(ln, `l${i}`))}
                {interim && renderLine(interim, 'interim', true)}
              </div>

              <div className="flex items-center justify-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${border}`, backgroundColor: subtle }}>
                <button type="button" onClick={toggleMute} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: controlBg, color: text, border: `1px solid ${border}` }}>
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} {muted ? 'Unmute' : 'Mute'}
                </button>
                <button type="button" onClick={endCall} className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-transform active:scale-[0.98]" style={{ backgroundColor: '#ef4444', color: '#ffffff' }}>
                  <PhoneOff className="h-4 w-4" /> End Call
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
