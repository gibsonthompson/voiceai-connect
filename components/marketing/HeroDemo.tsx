'use client';

// ============================================================================
// HeroDemo — a full marketing-site SECTION: a large, centered, ChatGPT-style
// prompt bar where a visitor describes their business (or pastes their site),
// we build a receptionist for it, and they have a live browser voice call with
// it. Public and anonymous.
//   1. POST /api/public/demo-receptionist reads the site -> inline transient
//      VAPI assistant grounded in that business.
//   2. "Talk to it" starts a live web call (vapi.start(assistant)), 4-min cap.
//   3. On end, CTA to start a free trial.
// Styled for the dark marketing site (white text, mint #00E3AA accent).
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUp, Mic, Phone, PhoneOff, Loader2, Sparkles, AlertTriangle, ArrowUpRight } from 'lucide-react';

const EM = '#00E3AA';
const MAX_SECONDS = 240; // 4-minute demo cap
const EXAMPLES = ['Dental office', 'HVAC company', 'Med spa', 'Law firm'];

type Phase = 'idle' | 'building' | 'ready' | 'connecting' | 'live' | 'ended' | 'error';
interface Line { role: 'user' | 'assistant'; text: string }

export default function HeroDemo() {
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const vapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

  const [phase, setPhase] = useState<Phase>('idle');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [biz, setBiz] = useState<{ name: string; industry: string; greeting: string } | null>(null);
  const [assistant, setAssistant] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const endCall = useCallback(() => { try { vapiRef.current?.stop(); } catch { /* ignore */ } stopTimer(); }, []);
  useEffect(() => () => { endCall(); }, [endCall]);
  useEffect(() => { if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight; }, [lines]);

  async function build(q: string) {
    const text = (q || '').trim();
    if (!text) return;
    setPhase('building'); setError(''); setLines([]);
    try {
      const res = await fetch(`${api}/api/public/demo-receptionist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: text }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.assistant) throw new Error(j.error || 'Could not build the demo. Try rephrasing.');
      setBiz({ name: j.business_name, industry: j.industry || '', greeting: j.greeting || '' });
      setAssistant(j.assistant);
      setPhase('ready');
    } catch (e: any) { setError(e?.message || 'Something went wrong.'); setPhase('idle'); }
  }

  async function startCall() {
    if (!assistant) return;
    if (!vapiKey) { setError('Live demo is not configured yet.'); setPhase('error'); return; }
    setPhase('connecting'); setError(''); setLines([]); setSeconds(0); setMuted(false);
    try {
      const { default: Vapi } = await import('@vapi-ai/web');
      const v = new Vapi(vapiKey);
      vapiRef.current = v;
      v.on('call-start', () => {
        setPhase('live');
        stopTimer();
        timerRef.current = setInterval(() => { setSeconds((s) => { if (s + 1 >= MAX_SECONDS) { endCall(); return MAX_SECONDS; } return s + 1; }); }, 1000);
      });
      v.on('call-end', () => { stopTimer(); setPhase('ended'); });
      v.on('error', (e: any) => { stopTimer(); setError(e?.message || 'The call dropped. Try again.'); setPhase('ended'); });
      v.on('message', (m: any) => {
        if (m?.type === 'transcript' && m.transcriptType === 'final' && m.transcript) {
          const role: 'user' | 'assistant' = m.role === 'user' ? 'user' : 'assistant';
          setLines((prev) => [...prev, { role, text: String(m.transcript) }].slice(-8));
        }
      });
      await v.start(assistant);
    } catch (e: any) { setError(e?.message || 'Could not start the call. Check mic permissions.'); setPhase('ended'); }
  }

  const toggleMute = () => { if (!vapiRef.current) return; const n = !muted; vapiRef.current.setMuted(n); setMuted(n); };
  const reset = () => { endCall(); setPhase('idle'); setBiz(null); setAssistant(null); setQuery(''); setLines([]); setSeconds(0); setError(''); };
  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const remaining = `${Math.floor((MAX_SECONDS - seconds) / 60)}:${String((MAX_SECONDS - seconds) % 60).padStart(2, '0')}`;
  const hasText = !!query.trim();

  return (
    <section className="relative bg-ink py-16 sm:py-24 lg:py-32 border-t border-white/[0.04] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(1100px 520px at 50% 0%, rgba(0,227,170,0.10), transparent 70%)' }} />
      <div className="max-w-[760px] mx-auto px-5 sm:px-6 relative text-center">
        {/* LANDING (idle/building): a literal copy of the AI Lab builder's
            prompt screen — headline, prompt bar, helper line, example chips. */}
        {(phase === 'idle' || phase === 'building') && (
          <div className="w-full mx-auto" style={{ maxWidth: 680 }}>
            <h2 className="text-center font-bold tracking-tight mb-8 text-white" style={{ fontSize: 'clamp(30px, 5vw, 42px)', lineHeight: 1.1 }}>
              Let&rsquo;s Build Your Receptionist
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); build(query); }} className="relative">
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setError(''); }}
                placeholder="Describe the business, or paste its website"
                autoComplete="off"
                disabled={phase === 'building'}
                className="w-full rounded-[28px] pl-6 pr-16 py-5 text-[16px] text-white placeholder-white/40 focus:outline-none transition-colors text-left"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = EM)}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
              />
              <button type="submit" aria-label="Build" disabled={phase === 'building' || !hasText}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full inline-flex items-center justify-center transition-all disabled:cursor-default"
                style={{ backgroundColor: hasText ? EM : 'rgba(255,255,255,0.08)', color: hasText ? '#04110D' : 'rgba(255,255,255,0.5)', opacity: phase === 'building' ? 0.7 : 1 }}>
                {phase === 'building' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
              </button>
            </form>
            <p className="text-center text-[13px] mt-4 text-white/50">
              {phase === 'building' ? 'Reading the site and building the receptionist…' : 'Paste a website and we’ll read it to fill in the details.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => { setQuery(ex); build(ex); }} disabled={phase === 'building'}
                  className="rounded-full px-4 py-2 text-[14px] text-white/60 transition-colors disabled:opacity-50"
                  style={{ border: '1px solid rgba(255,255,255,0.14)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = EM; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                  {ex}
                </button>
              ))}
            </div>
            {error && <p className="text-center text-[13px] mt-4" style={{ color: '#ff6b6b' }}>{error}</p>}
          </div>
        )}

        {/* READY / CALL: the demo card, centered */}
        {biz && phase !== 'idle' && phase !== 'building' && (
          <div className="mt-7 sm:mt-10 max-w-xl mx-auto rounded-2xl p-5 sm:p-8 text-left" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(0,227,170,0.12)' }}><Sparkles className="h-5 w-5" style={{ color: EM }} /></div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-[17px] leading-tight">{biz.name}&rsquo;s receptionist</p>
                {biz.industry && <p className="text-[12px] mt-0.5" style={{ color: EM }}>{biz.industry}</p>}
              </div>
              {(phase === 'live' || phase === 'connecting') && <span className="ml-auto font-mono text-[12px] text-white/60">{phase === 'connecting' ? 'connecting…' : `${mmss} · ${remaining} left`}</span>}
            </div>

            {biz.greeting && (phase === 'ready' || phase === 'ended') && <p className="text-white/70 text-[15px] mt-4 italic">&ldquo;{biz.greeting}&rdquo;</p>}

            {(phase === 'live' || phase === 'connecting') && (
              <div ref={transcriptRef} className="mt-4 max-h-44 overflow-y-auto space-y-2 pr-1">
                {lines.length === 0 ? (
                  <p className="text-white/40 text-[13px]">{phase === 'connecting' ? 'Connecting your call…' : 'Say hello, ask about hours, or try to book an appointment.'}</p>
                ) : lines.map((l, i) => (
                  <p key={i} className="text-[14px] leading-snug" style={{ color: l.role === 'user' ? 'rgba(255,255,255,0.55)' : '#fff' }}>
                    <span className="font-mono text-[10px] uppercase tracking-wide mr-2" style={{ color: l.role === 'user' ? 'rgba(255,255,255,0.35)' : EM }}>{l.role === 'user' ? 'You' : 'AI'}</span>{l.text}
                  </p>
                ))}
              </div>
            )}

            {error && <p className="text-[13px] mt-3" style={{ color: '#ff6b6b' }}>{error}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {phase === 'ready' && (
                <>
                  <button onClick={startCall} className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: EM, color: '#04110D' }}><Phone className="h-5 w-5" /> Talk to it</button>
                  <button onClick={reset} className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Try another business</button>
                </>
              )}
              {(phase === 'connecting' || phase === 'live') && (
                <>
                  <button onClick={endCall} className="inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-semibold transition-colors" style={{ backgroundColor: 'rgba(255,107,107,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' }}><PhoneOff className="h-5 w-5" /> End call</button>
                  {phase === 'live' && <button onClick={toggleMute} className="inline-flex items-center gap-2 rounded-xl px-4 py-3.5 text-[15px] font-medium transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: muted ? EM : '#fff', border: '1px solid rgba(255,255,255,0.12)' }}><Mic className="h-5 w-5" /> {muted ? 'Unmute' : 'Mute'}</button>}
                </>
              )}
              {phase === 'ended' && (
                <>
                  <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-all hover:opacity-90" style={{ backgroundColor: EM, color: '#04110D' }}>Start your free trial <ArrowUpRight className="h-4 w-4" /></Link>
                  <button onClick={startCall} className="text-[13px] text-white/60 hover:text-white transition-colors">Call again</button>
                  <button onClick={reset} className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Try another business</button>
                </>
              )}
            </div>

            {phase === 'ready' && <p className="text-[12px] mt-4 text-white/40">Uses your microphone. Up to 4 minutes, no signup.</p>}
          </div>
        )}

        {phase === 'error' && (
          <div className="mt-7 sm:mt-10 max-w-xl mx-auto rounded-2xl p-4 flex items-start gap-3 text-left" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
            <div><p className="text-white text-[14px]">{error || 'The live demo is unavailable right now.'}</p><button onClick={reset} className="text-[13px] mt-1" style={{ color: EM }}>Try again</button></div>
          </div>
        )}
      </div>
    </section>
  );
}
