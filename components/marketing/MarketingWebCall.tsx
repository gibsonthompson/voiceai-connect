'use client';

// ============================================================================
// MarketingWebCall - a polished, in-browser voice-call element for the public
// marketing + demo pages. It resolves a VAPI assistant from the public
// webcall-config endpoint (an agency's demo assistant, or a specific client's
// assistant) and runs a live browser call.
//
// The piece that makes it feel alive: during a live call it listens to VAPI's
// volume-level stream and drives a reactive orb + equalizer, so the UI visibly
// responds to the AI speaking. No phone number is dialed or provisioned; the
// number shown is the real-looking demo line the backend already returns,
// purely for context. Two layouts: a full `card` and a compact `inline`.
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Mic, Loader2, AlertTriangle, ArrowUpRight } from 'lucide-react';

const EM = '#01f5d1';
const EM_INK = '#04120f';
const MAX_SECONDS = 240;
const BARS = 9;

type Phase = 'idle' | 'connecting' | 'live' | 'ended' | 'error';
interface Line { role: 'user' | 'assistant'; text: string }

function formatPhone(raw?: string | null): string {
  const d = (raw || '').replace(/\D/g, '');
  const ten = d.length === 11 && d[0] === '1' ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return raw || '';
}

export interface MarketingWebCallProps {
  agencyId: string;
  mode: 'demo' | 'client';
  clientId?: string;
  variant?: 'card' | 'inline';
  eyebrow?: string;
  name?: string;
  tagline?: string;
  displayNumber?: string;
  hints?: string[];
  notConfiguredNote?: string;
}

// ---- Reactive call visualizer: orb + equalizer, driven by live volume. ------
function CallViz({ phase, volume, size }: { phase: Phase; volume: number; size: number }) {
  const live = phase === 'live';
  const connecting = phase === 'connecting';
  const scale = live ? 1 + Math.min(volume, 1) * 0.16 : 1;
  const glow = live ? 0.35 + Math.min(volume, 1) * 0.5 : 0.3;
  return (
    <div className="mwc-viz" style={{ width: size, height: size, ['--vol' as any]: Math.min(volume, 1) }}>
      {(live || connecting) && (<>
        <span className="mwc-ring" />
        <span className="mwc-ring mwc-ring-b" />
      </>)}
      <div
        className="mwc-orb"
        style={{
          width: size * 0.62, height: size * 0.62,
          transform: `scale(${scale})`,
          boxShadow: `0 10px 40px -8px rgba(1,245,209,${glow}), inset 0 0 20px rgba(255,255,255,0.08)`,
        }}
      >
        {connecting ? (
          <Loader2 className="mwc-spin" style={{ height: size * 0.22, width: size * 0.22, color: EM_INK }} />
        ) : live ? (
          <div className="mwc-eq" aria-hidden>
            {Array.from({ length: BARS }).map((_, i) => <span key={i} className="mwc-bar" style={{ ['--i' as any]: i }} />)}
          </div>
        ) : (
          <Phone style={{ height: size * 0.24, width: size * 0.24, color: EM_INK }} />
        )}
      </div>
    </div>
  );
}

export default function MarketingWebCall({
  agencyId, mode, clientId, variant = 'card', eyebrow, name, tagline, displayNumber, hints, notConfiguredNote,
}: MarketingWebCallProps) {
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const vapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [number, setNumber] = useState<string>(displayNumber || '');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState<Line | null>(null);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const notReady = mode === 'client' && !clientId;

  useEffect(() => {
    if (notReady) return;
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({ agency: agencyId, mode });
        if (mode === 'client' && clientId) qs.set('client', clientId);
        const res = await fetch(`${api}/api/agency/webcall-config?${qs.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.config) {
          setAssistantId(data.config.assistantId || null);
          if (!displayNumber && data.config.phoneNumber) setNumber(formatPhone(data.config.phoneNumber));
        }
      } catch { /* non-fatal */ }
    })();
    return () => { cancelled = true; };
  }, [api, agencyId, mode, clientId, displayNumber, notReady]);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const endCall = useCallback(() => { try { vapiRef.current?.stop(); } catch { /* ignore */ } stopTimer(); }, []);
  useEffect(() => () => { endCall(); }, [endCall]);
  useEffect(() => { if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight; }, [lines, interim]);

  async function startCall() {
    if (!vapiKey) { setError('The live demo is not configured yet.'); setPhase('error'); return; }
    let aId = assistantId;
    setPhase('connecting'); setError(''); setLines([]); setInterim(null); setSeconds(0); setMuted(false); setVolume(0);
    try {
      if (!aId) {
        const qs = new URLSearchParams({ agency: agencyId, mode });
        if (mode === 'client' && clientId) qs.set('client', clientId);
        const res = await fetch(`${api}/api/agency/webcall-config?${qs.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.config?.assistantId) throw new Error(data.error || 'This demo is not set up yet.');
        aId = data.config.assistantId;
        setAssistantId(aId);
      }
      if (!aId) throw new Error('This demo is not set up yet.');
      const { default: Vapi } = await import('@vapi-ai/web');
      const v = new Vapi(vapiKey);
      vapiRef.current = v;
      v.on('call-start', () => {
        setPhase('live');
        stopTimer();
        timerRef.current = setInterval(() => { setSeconds((s) => { if (s + 1 >= MAX_SECONDS) { endCall(); return MAX_SECONDS; } return s + 1; }); }, 1000);
      });
      v.on('call-end', () => { stopTimer(); setInterim(null); setVolume(0); setPhase('ended'); });
      v.on('error', (e: any) => { stopTimer(); setInterim(null); setVolume(0); setError(e?.message || 'The call dropped. Try again.'); setPhase('ended'); });
      v.on('volume-level', (vol: number) => { setVolume(typeof vol === 'number' ? vol : 0); });
      v.on('message', (m: any) => {
        if (m?.type !== 'transcript' || !m.transcript) return;
        const role: 'user' | 'assistant' = m.role === 'user' ? 'user' : 'assistant';
        const text = String(m.transcript).trim();
        if (!text) return;
        if (m.transcriptType === 'partial') { setInterim({ role, text }); }
        else if (m.transcriptType === 'final') {
          setLines((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === role) {
              const merged = prev.slice();
              merged[merged.length - 1] = { role, text: `${last.text} ${text}`.replace(/\s+/g, ' ').trim() };
              return merged.slice(-24);
            }
            return [...prev, { role, text }].slice(-24);
          });
          setInterim(null);
        }
      });
      await v.start(aId);
    } catch (e: any) { setError(e?.message || 'Could not start the call. Check mic permissions.'); setPhase('ended'); }
  }

  const toggleMute = () => { if (!vapiRef.current) return; const n = !muted; vapiRef.current.setMuted(n); setMuted(n); };
  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const inCall = phase === 'connecting' || phase === 'live';

  const turns: { role: 'user' | 'assistant'; text: string; tail?: string }[] = lines.map((l) => ({ role: l.role, text: l.text }));
  if (interim && interim.text) {
    const last = turns[turns.length - 1];
    if (last && last.role === interim.role) last.tail = interim.text;
    else turns.push({ role: interim.role, text: '', tail: interim.text });
  }

  const styleTag = (
    <style>{`
      .mwc-viz{position:relative;display:flex;align-items:center;justify-content:center}
      .mwc-orb{border-radius:9999px;display:flex;align-items:center;justify-content:center;background:radial-gradient(130% 130% at 30% 25%, #6ffbe6 0%, ${EM} 46%, #04b89b 100%);transition:transform .09s ease-out;will-change:transform}
      .mwc-ring{position:absolute;inset:0;border-radius:9999px;border:1px solid rgba(1,245,209,.45);opacity:0;animation:mwcPulse 2.4s ease-out infinite}
      .mwc-ring-b{animation-delay:1.2s}
      @keyframes mwcPulse{0%{transform:scale(.62);opacity:.55}80%{opacity:0}100%{transform:scale(1.15);opacity:0}}
      .mwc-spin{animation:mwcSpin 1s linear infinite}
      @keyframes mwcSpin{to{transform:rotate(360deg)}}
      .mwc-eq{display:flex;align-items:center;justify-content:center;gap:3px;height:52%}
      .mwc-bar{width:3px;border-radius:3px;background:${EM_INK};height:22%;transform-origin:center;animation:mwcBar 1s ease-in-out infinite;animation-delay:calc(var(--i) * .08s);transform:scaleY(calc(.35 + var(--vol,0) * 2.1))}
      @keyframes mwcBar{0%,100%{height:22%}50%{height:78%}}
      .mwc-console{position:relative;border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008));border:1px solid rgba(255,255,255,0.08);box-shadow:inset 0 1px 0 rgba(255,255,255,0.04),0 20px 50px -30px rgba(0,0,0,0.8);overflow:hidden}
      .mwc-console::after{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 80% at 50% -10%,rgba(1,245,209,0.10),transparent 60%)}
      .mwc-dot{position:relative;display:inline-flex;height:7px;width:7px;border-radius:9999px;background:${EM}}
      .mwc-dot::before{content:'';position:absolute;inset:-4px;border-radius:9999px;background:rgba(1,245,209,0.35);animation:mwcDot 2s ease-out infinite}
      @keyframes mwcDot{0%{transform:scale(.6);opacity:.7}80%{opacity:0}100%{transform:scale(1.8);opacity:0}}
      .mwc-well{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
      .mwc-arc{position:absolute;border-radius:9999px;border:1px solid rgba(1,245,209,0.14)}
      .mwc-arc-ping{animation:mwcArc 3s ease-out infinite}
      @keyframes mwcArc{0%{transform:scale(.7);opacity:.5}100%{transform:scale(1.25);opacity:0}}
    `}</style>
  );

  const transcript = (
    <div ref={transcriptRef} className="mt-5 min-h-[168px] max-h-[300px] overflow-y-auto space-y-2.5 text-left">
      {turns.length === 0 ? (
        <div className="min-h-[168px] flex items-center justify-center">
          <p className="text-white/45 text-[13.5px] text-center px-4">{phase === 'connecting' ? 'Connecting your call.' : phase === 'ended' ? 'Call ended.' : 'Say hello, ask about hours, or try to book an appointment.'}</p>
        </div>
      ) : turns.map((t, i) => {
        const isUser = t.role === 'user';
        return (
          <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[86%] rounded-2xl px-3.5 py-2" style={{ backgroundColor: isUser ? 'rgba(255,255,255,0.06)' : 'rgba(1,245,209,0.08)', border: `1px solid ${isUser ? 'rgba(255,255,255,0.1)' : 'rgba(1,245,209,0.18)'}` }}>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: isUser ? 'rgba(255,255,255,0.4)' : EM }}>{isUser ? 'You' : 'Receptionist'}</p>
              <p className="text-[14px] leading-relaxed" style={{ color: isUser ? 'rgba(255,255,255,0.85)' : '#fff' }}>{t.text}{t.tail ? <span style={{ opacity: 0.55 }}>{t.text ? ' ' : ''}{t.tail}</span> : null}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const controls = (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      {(phase === 'idle' || phase === 'error') && (
        <button onClick={startCall} className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[15px] font-semibold transition-all hover:brightness-105 active:scale-[0.98]" style={{ backgroundColor: EM, color: EM_INK, boxShadow: '0 12px 30px -10px rgba(1,245,209,0.7)' }}>
          <Phone className="h-[18px] w-[18px]" /> Talk to it
        </button>
      )}
      {phase === 'connecting' && (
        <button onClick={endCall} className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)' }}>
          <Loader2 className="h-[18px] w-[18px] animate-spin" /> Connecting
        </button>
      )}
      {phase === 'live' && (<>
        <button onClick={endCall} className="inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-semibold transition-colors" style={{ backgroundColor: 'rgba(255,107,107,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.32)' }}>
          <PhoneOff className="h-[18px] w-[18px]" /> End call
        </button>
        <button onClick={toggleMute} className="inline-flex items-center gap-2 rounded-full px-4 py-3.5 text-[15px] font-medium transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: muted ? EM : '#fff', border: '1px solid rgba(255,255,255,0.12)' }}>
          <Mic className="h-[18px] w-[18px]" /> {muted ? 'Unmute' : 'Mute'}
        </button>
      </>)}
      {phase === 'ended' && (
        <button onClick={startCall} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}>
          <Phone className="h-4 w-4" /> Call again
        </button>
      )}
      {(phase === 'idle' || phase === 'error') && <span className="text-[12px] text-white/40">Uses your mic. No signup.</span>}
    </div>
  );

  // After the call ends: the whole point of the demo was to get them here, so
  // make the next step obvious and personal. Shown in both variants.
  const endedCta = phase === 'ended' ? (
    <div className="mt-4 rounded-2xl p-5 text-center" style={{ background: 'rgba(1,245,209,0.05)', border: '1px solid rgba(1,245,209,0.18)' }}>
      <p className="text-[14px] text-white/80 leading-relaxed">That is the receptionist your clients would get, answering every call 24/7 under your brand.</p>
      <a href="/signup" className="mt-3.5 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14.5px] font-semibold transition-all hover:brightness-105 active:scale-[0.98]" style={{ backgroundColor: EM, color: EM_INK, boxShadow: '0 12px 30px -10px rgba(1,245,209,0.7)' }}>
        Start your 14-day free trial <ArrowUpRight className="h-4 w-4" />
      </a>
      <p className="mt-2.5 text-[12px] text-white/40">No card to start. Your first client can be live today.</p>
    </div>
  ) : null;

  // Live status chip (animated) used in headers.
  const liveChip = inCall ? (
    <span className="inline-flex items-center gap-2 flex-shrink-0 rounded-full px-2.5 py-1" style={{ backgroundColor: phase === 'live' ? 'rgba(255,107,107,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${phase === 'live' ? 'rgba(255,107,107,0.3)' : 'rgba(255,255,255,0.12)'}` }}>
      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: phase === 'live' ? '#ff6b6b' : 'rgba(255,255,255,0.5)' }} />
      <span className="text-[11.5px] font-medium tabular-nums" style={{ color: phase === 'live' ? '#ff9b9b' : 'rgba(255,255,255,0.6)' }}>{phase === 'connecting' ? 'Connecting' : mmss}</span>
    </span>
  ) : null;

  // ---- Inline variant ----
  if (variant === 'inline') {
    if (notReady) return notConfiguredNote ? <p className="text-[13px] text-white/40 mt-4">{notConfiguredNote}</p> : null;
    return (
      <div className="mt-2">
        {styleTag}
        {inCall && (
          <div className="flex items-center gap-3 mb-1">
            <CallViz phase={phase} volume={volume} size={44} />
            <span className="text-[13px] text-white/70">{phase === 'connecting' ? 'Connecting your call' : 'Live, talk to the receptionist'}</span>
            {liveChip}
          </div>
        )}
        {(inCall || phase === 'ended') && transcript}
        {error && phase !== 'error' && <p className="text-[13px] mt-3" style={{ color: '#ff6b6b' }}>{error}</p>}
        {endedCta}
        {controls}
      </div>
    );
  }

  // ---- Card variant ----
  const live = phase === 'live';
  return (
    <div className="calc-shell p-6 flex flex-col text-left">
      {styleTag}
      <div className="min-w-0">
        {eyebrow && <p className="t-eyebrow text-em mb-2.5">{eyebrow}</p>}
        {name && <h3 className="font-display text-[22px] sm:text-[23px] font-semibold text-white leading-tight tracking-tight">{name}</h3>}
        {tagline && <p className="text-[13.5px] text-white/55 mt-1.5 leading-relaxed max-w-md">{tagline}</p>}
      </div>

      {notReady ? (
        <div className="mt-6 rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <p className="text-[13.5px] text-white/60">{notConfiguredNote || 'This demo is being set up.'}</p>
        </div>
      ) : (
        <>
          {/* Call console: compact — reactive orb beside the live line */}
          <div className="mwc-console mt-5 p-5">
            <div className="relative z-[1] flex items-center gap-4 sm:gap-5">
              <div className="relative flex items-center justify-center flex-none" style={{ width: 76, height: 76 }}>
                {(phase === 'idle' || phase === 'error') && (
                  <span className="mwc-well" aria-hidden>
                    <span className="mwc-arc" style={{ width: 76, height: 76 }} />
                    <span className="mwc-arc mwc-arc-ping" style={{ width: 76, height: 76 }} />
                  </span>
                )}
                <CallViz phase={phase} volume={volume} size={54} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex flex-wrap items-center gap-x-1.5 text-[11.5px] font-medium" style={{ color: live ? '#ff9b9b' : 'rgba(255,255,255,0.6)' }}>
                  <span className="mwc-dot" style={live ? { background: '#ff6b6b' } : undefined} />
                  {live ? 'Live Call' : phase === 'connecting' ? 'Connecting' : phase === 'ended' ? 'Call Ended' : 'Online Now'}
                  {inCall ? <span className="text-white/35 tabular-nums">· {mmss}</span> : <span className="text-white/30">· Answers 24/7</span>}
                </span>
                {number && (phase === 'idle' || phase === 'error') ? (
                  <>
                    <p className="text-[10px] tracking-[0.14em] uppercase text-white/35 mt-2.5">Their AI Line</p>
                    <p className="font-display text-[22px] sm:text-[24px] font-semibold text-white tracking-tight tabular-nums leading-tight mt-0.5">{number}</p>
                  </>
                ) : (
                  <p className="text-[13px] text-white/50 mt-1.5">{phase === 'connecting' ? 'Connecting your call.' : phase === 'live' ? 'Listening. Just talk.' : 'Call ended.'}</p>
                )}
              </div>
            </div>
          </div>

          {hints && hints.length > 0 && phase === 'idle' && (
            <div className="mt-4">
              <p className="text-[11.5px] text-white/40 mb-2.5">Ask It Anything, Out Loud</p>
              <div className="flex flex-wrap gap-2">
                {hints.map((h) => <span key={h} className="rounded-full px-3.5 py-2 text-[12.5px] text-white/70 border border-white/10 bg-white/[0.02]">&ldquo;{h}&rdquo;</span>)}
              </div>
            </div>
          )}

          {(inCall || phase === 'ended') && transcript}
          {error && phase !== 'error' && <p className="text-[13px] mt-3" style={{ color: '#ff6b6b' }}>{error}</p>}

          {(phase === 'idle' || phase === 'error') ? (
            <>
              <button onClick={startCall} className="mt-5 w-full inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-[15px] font-semibold transition-all hover:brightness-105 active:scale-[0.98]" style={{ backgroundColor: EM, color: EM_INK, boxShadow: '0 10px 26px -10px rgba(1,245,209,0.7)' }}>
                <Phone className="h-[18px] w-[18px]" /> Talk To It
              </button>
              <p className="mt-2.5 text-center text-[12px] text-white/40">Uses your mic. No signup.</p>
            </>
          ) : (
            <div className="mt-5">{endedCta}{controls}</div>
          )}
        </>
      )}
    </div>
  );
}
