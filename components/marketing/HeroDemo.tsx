'use client';

// ============================================================================
// HeroDemo — a centered, full-width marketing SECTION: a clean, modern prompt
// box (the kind the top AI products use) where a visitor describes a business
// or pastes its site, we build a working AI receptionist from it, and they have
// a live browser voice call with it. Public and anonymous.
//
// Visual language here is deliberately soft and modern (rounded prompt box with
// a focus glow, regular Plus Jakarta type, generous spacing). No mono labels,
// no "engineered" eyebrow/racing-line, and no dash/hyphen motifs.
//
// Flow (unchanged):
//   1. POST /api/public/demo-receptionist reads the site -> inline transient
//      VAPI assistant grounded in that business.
//   2. "Talk to it" starts a live web call (vapi.start(assistant)), 4 minute cap.
//   3. On end, CTA to start a free trial.
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUp, Globe, Mic, Phone, PhoneOff, Loader2, Sparkles, AlertTriangle, ArrowUpRight } from 'lucide-react';

const EM = '#01f5d1';        // primary brand accent (matches --color-em-400 / text-em / btn-em)
const EM_INK = '#04120f';    // text on top of the teal accent
const MAX_SECONDS = 240;     // 4 minute demo cap
const EXAMPLES = ['Dental office', 'HVAC company', 'Med spa', 'Law firm'];

const STEPS: [string, string, string][] = [
  ['1', 'Paste the website', 'It reads the site and pulls the real details. No forms, no questionnaire.'],
  ['2', 'It builds itself', 'Greeting, services, and knowledge, assembled on the spot.'],
  ['3', 'Call it live', 'Pick up and talk to it, exactly what a caller hears on day one.'],
];

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
  const inputRef = useRef<HTMLInputElement>(null);

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
  const remaining = `${Math.floor((MAX_SECONDS - seconds) / 60)}:${String((MAX_SECONDS - seconds) % 60).padStart(2, '0')}`;
  const hasText = !!query.trim();
  const onConsole = phase === 'idle' || phase === 'building';

  return (
    <section className="relative bg-ink py-20 sm:py-28 lg:py-32 border-t border-white/[0.04] overflow-hidden">
      {/* Soft ambient teal glow behind the prompt box. */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(760px 420px at 50% 8%, rgba(1,245,209,0.10), transparent 70%)' }} />

      <div className="max-w-[760px] mx-auto px-5 sm:px-6 relative text-center">

        <h2 className="t-h2 text-white mx-auto max-w-[18ch]">Build the product you&rsquo;ll resell.</h2>

        {onConsole && (
          <p className="mt-5 text-[15px] sm:text-[16px] leading-relaxed text-white/55 max-w-xl mx-auto">
            Paste any local business&rsquo;s website and talk to the AI receptionist it builds, live, in under a minute. No signup, no card. It&rsquo;s the demo that closes your clients.
          </p>
        )}

        {/* ── IDLE / BUILDING: the prompt box ─────────────────────────────── */}
        {onConsole && (
          <div>
            <form onSubmit={(e) => { e.preventDefault(); build(query); }} className="mt-9 max-w-[620px] mx-auto">
              <div
                className="rounded-[22px] bg-white/[0.03] px-5 pt-4 pb-3 text-left transition-all duration-200 border border-white/10 focus-within:border-[rgba(1,245,209,0.7)] focus-within:bg-white/[0.045] focus-within:shadow-[0_0_0_4px_rgba(1,245,209,0.10),0_20px_60px_-28px_rgba(1,245,209,0.5)]"
              >
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setError(''); }}
                  placeholder="Paste a website, or describe the business"
                  autoComplete="off"
                  disabled={phase === 'building'}
                  className="w-full bg-transparent text-[16px] text-white placeholder-white/35 focus:outline-none"
                />
                <div className="flex items-center justify-between gap-3 mt-3">
                  <span className="inline-flex items-center gap-2 text-[12.5px] text-white/40 min-w-0">
                    <Globe className="h-[15px] w-[15px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
                    <span className="truncate">{phase === 'building' ? 'Reading the site and building the receptionist' : 'Paste a URL and it reads the site for you'}</span>
                  </span>
                  <button
                    type="submit" aria-label="Build" disabled={phase === 'building' || !hasText}
                    className="h-10 w-10 rounded-full inline-flex items-center justify-center flex-shrink-0 transition-all disabled:cursor-default"
                    style={{ backgroundColor: hasText ? EM : 'rgba(255,255,255,0.08)', color: hasText ? EM_INK : 'rgba(255,255,255,0.45)', opacity: phase === 'building' ? 0.7 : 1, boxShadow: hasText ? '0 8px 22px -8px rgba(1,245,209,0.65)' : 'none' }}
                  >
                    {phase === 'building' ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <ArrowUp className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>
            </form>

            {/* Example chips, balanced (2 per row on mobile, one row on desktop) */}
            <div className="mt-6">
              <p className="text-[13px] text-white/40 mb-3">Try one</p>
              <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto sm:flex sm:flex-wrap sm:justify-center sm:max-w-none">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex} type="button" onClick={() => { setQuery(ex); build(ex); }} disabled={phase === 'building'}
                    className="rounded-full px-4 py-2 text-[13.5px] text-white/65 border border-white/10 bg-white/[0.02] transition-colors hover:text-white hover:border-[rgba(1,245,209,0.5)] disabled:opacity-50"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-[13px] mt-5" style={{ color: '#ff6b6b' }}>{error}</p>}

            {/* Framing: three steps, the agency value, and the CTA */}
            {phase === 'idle' && (
              <div className="mt-16 sm:mt-20">
                <div className="grid sm:grid-cols-3 gap-10 sm:gap-8 text-center max-w-3xl mx-auto">
                  {STEPS.map(([n, t, d]) => (
                    <div key={n}>
                      <div className="mx-auto h-9 w-9 rounded-full flex items-center justify-center text-[14px] font-semibold" style={{ backgroundColor: 'rgba(1,245,209,0.1)', color: EM, border: '1px solid rgba(1,245,209,0.25)' }}>{n}</div>
                      <p className="text-white font-semibold text-[15px] mt-4">{t}</p>
                      <p className="text-[13.5px] leading-relaxed text-white/50 mt-1.5 max-w-[26ch] mx-auto">{d}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-14 text-[15px] sm:text-[16px] leading-relaxed text-white/60 max-w-2xl mx-auto">
                  Onboarding a real client runs on these same steps. Sixty seconds from a website to a receptionist that sounds like it has worked there for years.
                </p>

                <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-x-5 gap-y-3">
                  <Link href="/signup" className="btn btn-em">Start your free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                  <button type="button" onClick={() => inputRef.current?.focus()} className="text-[14px] text-white/55 hover:text-white transition-colors">
                    or build one above, free
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── READY / CALL: the receptionist card ─────────────────────────── */}
        {biz && !onConsole && phase !== 'error' && (
          <div className="mt-9 max-w-[560px] mx-auto rounded-2xl p-6 sm:p-7 text-left" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(1,245,209,0.12)' }}><Sparkles className="h-5 w-5" style={{ color: EM }} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-[17px] leading-tight">{biz.name}&rsquo;s receptionist</p>
                {biz.industry && <p className="text-[12px] mt-0.5" style={{ color: EM }}>{biz.industry}</p>}
              </div>
              {(phase === 'live' || phase === 'connecting') && <span className="ml-auto text-[12.5px] font-medium text-white/60 whitespace-nowrap">{phase === 'connecting' ? 'connecting' : `${remaining} left`}</span>}
            </div>

            {biz.greeting && (phase === 'ready' || phase === 'ended') && (
              <p className="text-white/75 text-[15px] mt-4 leading-relaxed rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                &ldquo;{biz.greeting}&rdquo;
              </p>
            )}

            {(phase === 'live' || phase === 'connecting') && (
              <div ref={transcriptRef} className="mt-4 max-h-44 overflow-y-auto space-y-2.5 pr-1">
                {lines.length === 0 ? (
                  <p className="text-white/40 text-[13px]">{phase === 'connecting' ? 'Connecting your call.' : 'Say hello, ask about hours, or try to book an appointment.'}</p>
                ) : lines.map((l, i) => (
                  <p key={i} className="text-[14px] leading-snug" style={{ color: l.role === 'user' ? 'rgba(255,255,255,0.55)' : '#fff' }}>
                    <span className="text-[11px] font-semibold mr-2" style={{ color: l.role === 'user' ? 'rgba(255,255,255,0.4)' : EM }}>{l.role === 'user' ? 'You' : 'AI'}</span>{l.text}
                  </p>
                ))}
              </div>
            )}

            {error && <p className="text-[13px] mt-3" style={{ color: '#ff6b6b' }}>{error}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {phase === 'ready' && (
                <>
                  <button onClick={startCall} className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-all hover:brightness-105 active:scale-[0.98]" style={{ backgroundColor: EM, color: EM_INK, boxShadow: '0 10px 28px -12px rgba(1,245,209,0.6)' }}><Phone className="h-5 w-5" /> Talk to it</button>
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
                  <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-all hover:brightness-105" style={{ backgroundColor: EM, color: EM_INK, boxShadow: '0 10px 28px -12px rgba(1,245,209,0.6)' }}>Start your free trial <ArrowUpRight className="h-4 w-4" /></Link>
                  <button onClick={startCall} className="text-[13px] text-white/60 hover:text-white transition-colors">Call again</button>
                  <button onClick={reset} className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Try another business</button>
                </>
              )}
            </div>

            {phase === 'ready' && <p className="mt-5 text-[12px] text-white/40">Uses your microphone. Up to 4 minutes, no signup.</p>}
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div className="mt-9 max-w-[560px] mx-auto rounded-2xl p-5 flex items-start gap-3 text-left" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
            <div><p className="text-white text-[14px]">{error || 'The live demo is unavailable right now.'}</p><button onClick={reset} className="text-[13px] mt-1" style={{ color: EM }}>Try again</button></div>
          </div>
        )}
      </div>
    </section>
  );
}
