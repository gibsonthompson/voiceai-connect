'use client';

// ============================================================================
// Embeddable AI web-call widget (bare page)
// VoiceAI Connect
// ----------------------------------------------------------------------------
// Rendered inside an iframe by public/embed.js on an agency's own site. It runs
// the browser call on OUR origin (so the VAPI public key, assistant resolution,
// and mic permission all stay here) and posts its height to the parent so the
// iframe can size to the content. Query params:
//   agency=<uuid>   required
//   mode=demo|client
//   client=<uuid>   when mode=client
//   embed=true      bare (no page chrome) when embedded
// The assistant to call and the branding come from /api/agency/webcall-config.
// ============================================================================

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Phone, PhoneOff, Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { fontStack, googleFontsHref } from '@/lib/brandFonts';

type Phase = 'loading' | 'idle' | 'connecting' | 'live' | 'ended' | 'error';
interface Line { role: 'user' | 'assistant'; text: string; }
interface WebcallConfig {
  assistantId: string; label: string; phoneNumber: string | null; agencyName: string | null; logoUrl: string | null;
  primaryColor: string; accentColor: string; websiteTheme: string;
  displayFont: string | null; bodyFont: string | null;
}

function hexToRgba(hex: string, a: number): string {
  const c = (hex || '').replace('#', '');
  if (c.length < 6) return `rgba(1,245,209,${a})`;
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function WebcallInner() {
  const params = useSearchParams();
  const agencyId = params.get('agency') || '';
  const mode = params.get('mode') || 'demo';
  const clientId = params.get('client') || '';
  const isEmbed = params.get('embed') === 'true';

  const [phase, setPhase] = useState<Phase>('loading');
  const [config, setConfig] = useState<WebcallConfig | null>(null);
  const [error, setError] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState<Line | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.myvoiceaiconnect.com';
  const vapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

  // Load the config (assistant + branding).
  useEffect(() => {
    if (!agencyId) { setPhase('error'); setError('Missing agency.'); return; }
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({ agency: agencyId, mode });
        if (mode === 'client' && clientId) qs.set('client', clientId);
        const res = await fetch(`${backendUrl}/api/agency/webcall-config?${qs.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not load the web call.');
        if (cancelled) return;
        setConfig(data.config);
        setPhase('idle');
      } catch (e: any) {
        if (!cancelled) { setError(e?.message || 'Could not load the web call.'); setPhase('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [agencyId, mode, clientId, backendUrl]);

  // Load brand fonts for the widget.
  useEffect(() => {
    const href = googleFontsHref([config?.displayFont, config?.bodyFont]);
    if (!href) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href;
    document.head.appendChild(link);
    return () => { if (link.parentNode) link.parentNode.removeChild(link); };
  }, [config?.displayFont, config?.bodyFont]);

  // Tell the parent frame our height so embed.js can size the iframe.
  useEffect(() => {
    const post = () => {
      const h = rootRef.current?.scrollHeight || document.body.scrollHeight;
      try { window.parent?.postMessage({ type: 'voiceai:resize', height: h }, '*'); } catch {}
    };
    post();
    const ro = new ResizeObserver(post);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [phase, lines, interim, config]);

  useEffect(() => { if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight; }, [lines, interim]);

  const stopTimer = useCallback(() => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }, []);

  const endCall = useCallback(() => {
    try { vapiRef.current?.stop(); } catch {}
    stopTimer();
  }, [stopTimer]);

  useEffect(() => () => { try { vapiRef.current?.stop(); } catch {} stopTimer(); }, [stopTimer]);

  const startCall = useCallback(async () => {
    if (!config?.assistantId || !vapiKey) { setError('This web call is not configured yet.'); setPhase('error'); return; }
    setPhase('connecting'); setError(''); setLines([]); setInterim(null); setSeconds(0); setMuted(false);
    try {
      const { default: Vapi } = await import('@vapi-ai/web');
      const v = new Vapi(vapiKey);
      vapiRef.current = v;
      v.on('call-start', () => {
        setPhase('live');
        stopTimer();
        timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      });
      v.on('call-end', () => { stopTimer(); setInterim(null); setPhase('ended'); });
      v.on('error', (e: any) => { stopTimer(); setInterim(null); setError(e?.message || 'The call dropped. Try again.'); setPhase('ended'); });
      v.on('message', (m: any) => {
        if (m?.type !== 'transcript' || !m.transcript) return;
        const role: 'user' | 'assistant' = m.role === 'user' ? 'user' : 'assistant';
        const text = String(m.transcript).trim();
        if (!text) return;
        if (m.transcriptType === 'partial') { setInterim({ role, text }); }
        else if (m.transcriptType === 'final') { setLines((prev) => [...prev, { role, text }]); setInterim(null); }
      });
      await v.start(config.assistantId);
    } catch (e: any) {
      setError(e?.message || 'Could not start the call. Check microphone permissions.');
      setPhase('ended');
    }
  }, [config, vapiKey, stopTimer]);

  const toggleMute = useCallback(() => {
    const v = vapiRef.current; if (!v) return;
    const next = !muted; setMuted(next);
    try { v.setMuted(next); } catch {}
  }, [muted]);

  const isDark = (config?.websiteTheme || 'dark') === 'dark';
  const primary = config?.primaryColor || '#01f5d1';
  const bg = isDark ? '#0a0a0a' : '#ffffff';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const text = isDark ? '#fafaf9' : '#111827';
  const muted2 = isDark ? 'rgba(250,249,249,0.6)' : '#6b7280';
  const border = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const rendered = [...lines]; if (interim) rendered.push(interim);

  return (
    <div
      ref={rootRef}
      style={{
        backgroundColor: isEmbed ? 'transparent' : bg,
        color: text,
        fontFamily: fontStack(config?.bodyFont, 'body'),
        minHeight: isEmbed ? undefined : '100vh',
        padding: isEmbed ? 0 : '24px 16px',
        display: 'flex', justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ borderRadius: 20, border: `1px solid ${border}`, backgroundColor: cardBg, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ height: 40, width: 40, borderRadius: 12, backgroundColor: hexToRgba(primary, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {config?.logoUrl ? <img src={config.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Phone style={{ height: 20, width: 20, color: primary }} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, fontFamily: fontStack(config?.displayFont, 'display'), lineHeight: 1.15 }}>
                Talk to {config?.label || 'our AI receptionist'}
              </div>
              <div style={{ fontSize: 12.5, color: muted2 }}>
                {phase === 'live' ? 'Live now' : phase === 'connecting' ? 'Connecting' : phase === 'ended' ? 'Call ended' : 'A real voice call, right in your browser'}
              </div>
            </div>
            {(phase === 'live' || phase === 'connecting') && (
              <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 600, color: muted2, fontVariantNumeric: 'tabular-nums' }}>{phase === 'connecting' ? 'Connecting' : mmss}</span>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: 20 }}>
            {phase === 'loading' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 0' }}><Loader2 style={{ height: 22, width: 22, color: primary, animation: 'vaspin 1s linear infinite' }} /></div>
            )}

            {phase === 'error' && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0' }}>
                <AlertCircle style={{ height: 18, width: 18, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 14, color: muted2, margin: 0 }}>{error || 'This web call is not available right now.'}</p>
              </div>
            )}

            {(phase === 'idle' || phase === 'connecting') && (
              <div style={{ textAlign: 'center', padding: '14px 0 6px' }}>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <span className="va-ring" style={{ position: 'absolute', height: 104, width: 104, borderRadius: '50%', backgroundColor: hexToRgba(primary, 0.35) }} />
                  <span className="va-ring va-ring2" style={{ position: 'absolute', height: 104, width: 104, borderRadius: '50%', backgroundColor: hexToRgba(primary, 0.22) }} />
                  <button
                    onClick={phase === 'connecting' ? undefined : startCall}
                    disabled={phase === 'connecting'}
                    aria-label="Start the call"
                    style={{ position: 'relative', height: 92, width: 92, borderRadius: '50%', backgroundColor: primary, border: 'none', cursor: phase === 'connecting' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#050505' : '#ffffff', boxShadow: `0 12px 34px ${hexToRgba(primary, 0.45)}` }}
                  >
                    {phase === 'connecting' ? <Loader2 style={{ height: 30, width: 30, animation: 'vaspin 1s linear infinite' }} /> : <Phone style={{ height: 32, width: 32 }} />}
                  </button>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: text, margin: '0 0 4px', fontFamily: fontStack(config?.displayFont, 'display') }}>
                  {phase === 'connecting' ? 'Connecting your call…' : 'Tap to Start a Live Call'}
                </p>
                <p style={{ fontSize: 13, color: muted2, margin: '0 auto', maxWidth: 320 }}>
                  {phase === 'connecting' ? 'Allow your microphone if your browser asks.' : 'Allow your mic, then say hello, ask about hours, or book an appointment.'}
                </p>
              </div>
            )}

            {(phase === 'live' || phase === 'ended') && (
              <>
                {phase === 'live' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 34, marginBottom: 14 }}>
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <span key={i} className="va-bar" style={{ width: 4, borderRadius: 3, backgroundColor: primary, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                )}
                <div ref={transcriptRef} style={{ minHeight: 180, maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '2px 0' }}>
                  {rendered.length === 0 ? (
                    <p style={{ fontSize: 13.5, color: muted2, textAlign: 'center', padding: '24px 0', margin: 0 }}>
                      {phase === 'connecting' ? 'Connecting your call.' : phase === 'ended' ? 'Call ended.' : 'Listening. Say hello to get started.'}
                    </p>
                  ) : rendered.map((ln, i) => (
                    <div key={i} style={{ alignSelf: ln.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      <div style={{
                        borderRadius: 14, padding: '8px 12px', fontSize: 14, lineHeight: 1.35,
                        backgroundColor: ln.role === 'user' ? hexToRgba(primary, 0.16) : (isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'),
                        color: text,
                      }}>{ln.text}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
                  {phase === 'live' && (
                    <button onClick={toggleMute} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '10px 18px', fontSize: 14, fontWeight: 600, color: text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6', border: `1px solid ${border}`, cursor: 'pointer' }}>
                      {muted ? <MicOff style={{ height: 16, width: 16 }} /> : <Mic style={{ height: 16, width: 16 }} />}{muted ? 'Unmute' : 'Mute'}
                    </button>
                  )}
                  {phase === 'live' ? (
                    <button onClick={endCall} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#ffffff', backgroundColor: '#ef4444', border: 'none', cursor: 'pointer' }}>
                      <PhoneOff style={{ height: 16, width: 16 }} />End call
                    </button>
                  ) : (
                    <button onClick={startCall} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '12px 24px', fontSize: 15, fontWeight: 600, color: isDark ? '#050505' : '#ffffff', backgroundColor: primary, border: 'none', cursor: 'pointer' }}>
                      <Phone style={{ height: 16, width: 16 }} />Call again
                    </button>
                  )}
                </div>
                {error && phase === 'ended' && <p style={{ fontSize: 12.5, color: '#ef4444', textAlign: 'center', marginTop: 10 }}>{error}</p>}
              </>
            )}
          </div>
          {config?.phoneNumber && (
            <div style={{ borderTop: `1px solid ${border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: muted2 }}>Prefer to call?</span>
              <a href={`tel:${config.phoneNumber.replace(/[^0-9+]/g, '')}`} style={{ fontSize: 13.5, fontWeight: 700, color: primary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Phone style={{ height: 14, width: 14 }} />{config.phoneNumber}
              </a>
            </div>
          )}
        </div>
        {!isEmbed && config?.agencyName && (
          <p style={{ textAlign: 'center', fontSize: 11.5, color: muted2, marginTop: 12 }}>Powered by {config.agencyName}</p>
        )}
      </div>
      <style>{`
        @keyframes vaspin { to { transform: rotate(360deg); } }
        @keyframes vapulse { 0% { transform: scale(0.85); opacity: 0.7; } 70% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes vabar { 0%, 100% { height: 8px; } 50% { height: 30px; } }
        .va-ring { animation: vapulse 1.8s ease-out infinite; }
        .va-ring2 { animation-delay: 0.9s; }
        .va-bar { height: 8px; animation: vabar 0.9s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default function WebcallPage() {
  return (
    <Suspense fallback={null}>
      <WebcallInner />
    </Suspense>
  );
}
