'use client';

// ============================================================================
// MarketingWebCall - a dark-themed, browser voice-call card for the public
// marketing + demo pages. It resolves a VAPI assistant from the public
// webcall-config endpoint (agency demo assistant, or a specific client's
// assistant) and runs a live browser call, with transcript, mute and timer.
//
// No phone number is dialed or provisioned: the "number" shown is the real-
// looking line the backend already returns for the demo (a 404 placeholder on
// the skip-provisioning demo agency), purely for context. The live action is
// the web call. Two layouts: a full `card` for the demo page, and a compact
// `inline` button + call panel for slotting under an existing CTA.
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Mic, Loader2, AlertTriangle } from 'lucide-react';

const EM = '#01f5d1';
const EM_INK = '#04120f';
const MAX_SECONDS = 240;

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
  displayNumber?: string;   // override; otherwise uses the number from config
  hints?: string[];         // "what to try" prompts
  notConfiguredNote?: string; // shown when a client demo has no id yet
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
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState<Line | null>(null);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const notReady = mode === 'client' && !clientId;

  // Load the assistant + the display number up front, so the card can show the
  // number before the call and start instantly when clicked.
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
      } catch { /* non-fatal: the card still renders, call shows a clear error */ }
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
    setPhase('connecting'); setError(''); setLines([]); setInterim(null); setSeconds(0); setMuted(false);
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
      v.on('call-end', () => { stopTimer(); setInterim(null); setPhase('ended'); });
      v.on('error', (e: any) => { stopTimer(); setInterim(null); setError(e?.message || 'The call dropped. Try again.'); setPhase('ended'); });
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

  // ---- Shared call panel (transcript + controls), used in both variants ----
  const callPanel = (
    <>
      {(inCall || phase === 'ended') && (
        <div ref={transcriptRef} className="mt-5 min-h-[180px] max-h-[300px] overflow-y-auto space-y-2.5 text-left">
          {turns.length === 0 ? (
            <div className="min-h-[180px] flex items-center justify-center">
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
      )}
      {error && phase !== 'error' && <p className="text-[13px] mt-3" style={{ color: '#ff6b6b' }}>{error}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {(phase === 'idle' || phase === 'error') && (
          <button onClick={startCall} className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-all hover:brightness-105 active:scale-[0.98]" style={{ backgroundColor: EM, color: EM_INK, boxShadow: '0 10px 28px -12px rgba(1,245,209,0.6)' }}>
            <Phone className="h-5 w-5" /> Talk to it
          </button>
        )}
        {inCall && (
          <>
            <button onClick={endCall} className="inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-semibold transition-colors" style={{ backgroundColor: 'rgba(255,107,107,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' }}>
              {phase === 'connecting' ? <Loader2 className="h-5 w-5 animate-spin" /> : <PhoneOff className="h-5 w-5" />} {phase === 'connecting' ? 'Connecting' : 'End call'}
            </button>
            {phase === 'live' && <button onClick={toggleMute} className="inline-flex items-center gap-2 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: muted ? EM : '#fff', border: '1px solid rgba(255,255,255,0.12)' }}><Mic className="h-5 w-5" /> {muted ? 'Unmute' : 'Mute'}</button>}
            <span className="ml-auto text-[12.5px] font-medium text-white/60 tabular-nums">{phase === 'live' ? mmss : ''}</span>
          </>
        )}
        {phase === 'ended' && (
          <button onClick={startCall} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}><Phone className="h-4 w-4" /> Call again</button>
        )}
        {(phase === 'idle' || phase === 'error') && <span className="text-[12px] text-white/40">Uses your mic. No signup.</span>}
      </div>
    </>
  );

  // ---- Inline variant: just the button + call panel ----
  if (variant === 'inline') {
    if (notReady) return notConfiguredNote ? <p className="text-[13px] text-white/40 mt-4">{notConfiguredNote}</p> : null;
    return <div>{callPanel}</div>;
  }

  // ---- Card variant ----
  return (
    <div className="calc-shell p-7 lg:p-8 flex flex-col text-left">
      {eyebrow && <p className="t-eyebrow text-em mb-4">{eyebrow}</p>}
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(1,245,209,0.12)', border: '1px solid rgba(1,245,209,0.25)' }}><Phone className="h-5 w-5" style={{ color: EM }} /></div>
        <div className="min-w-0">
          {name && <h3 className="font-display text-[22px] sm:text-[24px] font-medium text-white leading-tight tracking-tight">{name}</h3>}
          {tagline && <p className="text-[13.5px] text-white/55 mt-1 leading-relaxed">{tagline}</p>}
        </div>
      </div>

      {notReady ? (
        <div className="mt-6 rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <p className="text-[13.5px] text-white/60">{notConfiguredNote || 'This demo is being set up.'}</p>
        </div>
      ) : (
        <>
          {number && (
            <div className="mt-6 inline-flex items-center gap-3 rounded-xl px-4 py-3 self-start" style={{ border: '1px solid rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
              <span>
                <span className="block font-mono text-[10px] tracking-[0.14em] uppercase text-white/40">Their AI line</span>
                <span className="block font-display text-[20px] sm:text-[22px] font-medium text-white tracking-tight whitespace-nowrap">{number}</span>
              </span>
            </div>
          )}
          {hints && hints.length > 0 && (phase === 'idle') && (
            <div className="mt-5">
              <p className="text-[12px] text-white/40 mb-2">Try asking it</p>
              <div className="flex flex-wrap gap-2">
                {hints.map((h) => <span key={h} className="rounded-full px-3 py-1.5 text-[12.5px] text-white/65 border border-white/10 bg-white/[0.02]">{h}</span>)}
              </div>
            </div>
          )}
          {callPanel}
        </>
      )}
    </div>
  );
}
