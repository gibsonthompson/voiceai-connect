'use client';

// ============================================================================
// HeroDemo — a marketing-site SECTION where a visitor describes their business
// (or pastes its site), we build a working AI receptionist from it, and they
// have a live browser voice call with it. Public and anonymous.
//
// Redesigned to live inside the marketing design system instead of looking like
// a stray ChatGPT box: the site's signature two-column rhythm (left: eyebrow +
// racing-line + t-h2 + body + steps; right: a framed graphite "build console").
// The right panel morphs in place across phases (input -> receptionist card ->
// live call -> CTA). Accent is the real brand teal (#01f5d1) so it matches the
// rest of the page, type uses the globals.css system classes, and NO CSS or
// layout.tsx changes are required (every class used already exists).
//
// Flow (unchanged):
//   1. POST /api/public/demo-receptionist reads the site -> inline transient
//      VAPI assistant grounded in that business.
//   2. "Talk to it" starts a live web call (vapi.start(assistant)), 4-min cap.
//   3. On end, CTA to start a free trial.
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUp, Globe, Mic, Phone, PhoneOff, Loader2, Sparkles, AlertTriangle, ArrowUpRight } from 'lucide-react';

const EM = '#01f5d1';        // primary brand accent (matches --color-em-400 / text-em / btn-em)
const EM_INK = '#04120f';    // text on top of the teal accent
const MAX_SECONDS = 240;     // 4-minute demo cap
const EXAMPLES = ['Dental office', 'HVAC company', 'Med spa', 'Law firm'];

// The three-step explanation, shown in the left column (idle only).
const STEPS: [string, string, string][] = [
  ['01', 'Paste the website', "It reads the site and pulls the business's real details. No forms, no questionnaire."],
  ['02', 'It builds itself', 'Greeting, services, and knowledge, assembled on the spot. No scripting.'],
  ['03', 'Call it live', 'Pick up and talk to it, exactly what a caller hears on day one.'],
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
  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const remaining = `${Math.floor((MAX_SECONDS - seconds) / 60)}:${String((MAX_SECONDS - seconds) % 60).padStart(2, '0')}`;
  const hasText = !!query.trim();
  const onConsole = phase === 'idle' || phase === 'building';

  return (
    <section className="relative bg-ink py-20 sm:py-24 lg:py-32 border-t border-white/[0.04] overflow-hidden">
      {/* Ambient teal wash, tied to the top of the section (brand accent, matched to the rest of the page). */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(1000px 500px at 50% -6%, rgba(1,245,209,0.09), transparent 66%)' }} />

      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* ── LEFT: the marketing narrative + the three steps ───────────── */}
          <div className="lg:col-span-5">
            <p className="t-eyebrow text-em mb-5">Try it live</p>
            <span className="racing-line" />
            <h2 className="t-h2 text-white">Build the product you&rsquo;ll resell. Then call it.</h2>
            <p className="t-body mt-6 max-w-md">
              Paste any local business&rsquo;s website and a working AI receptionist is on the phone in under a minute, trained on what that business actually does: its services, its hours, the way it talks. It&rsquo;s the demo that closes clients, they hear their own receptionist before they ever pay you.
            </p>

            <div className="mt-10 space-y-6">
              {STEPS.map(([n, t, d]) => (
                <div key={n} className="flex gap-4">
                  <span className="font-mono text-[12px] tracking-[0.1em] pt-[3px] w-6 flex-shrink-0" style={{ color: EM }}>{n}</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-[15px] leading-snug">{t}</p>
                    <p className="text-[13.5px] leading-relaxed text-white/50 mt-1">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: the build console (framed graphite panel, morphs by phase) ── */}
          <div className="lg:col-span-7">
            <div className="calc-shell p-5 sm:p-7 lg:p-8 relative">
              {/* Instrument header */}
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-white/[0.07]">
                <span className="inline-flex items-center gap-2.5">
                  <span className="telemetry-dot" />
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/55">The 60-second build</span>
                </span>
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-white/35">No signup</span>
              </div>

              {/* IDLE / BUILDING: the input console */}
              {onConsole && (
                <div>
                  <p className="font-display text-[17px] sm:text-[18px] font-medium text-white tracking-tight">
                    Describe a business, or paste its website.
                  </p>

                  <form onSubmit={(e) => { e.preventDefault(); build(query); }} className="relative mt-4">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Globe className="h-[18px] w-[18px]" style={{ color: 'rgba(255,255,255,0.28)' }} />
                    </span>
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setError(''); }}
                      placeholder="acmedental.com, or Acme Dental in Austin"
                      autoComplete="off"
                      disabled={phase === 'building'}
                      className="w-full rounded-2xl pl-11 pr-14 py-4 text-[15px] text-white placeholder-white/35 focus:outline-none transition-colors"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = EM)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                    />
                    <button
                      type="submit" aria-label="Build" disabled={phase === 'building' || !hasText}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl inline-flex items-center justify-center transition-all disabled:cursor-default"
                      style={{ backgroundColor: hasText ? EM : 'rgba(255,255,255,0.06)', color: hasText ? EM_INK : 'rgba(255,255,255,0.45)', opacity: phase === 'building' ? 0.7 : 1, boxShadow: hasText ? '0 6px 18px -8px rgba(1,245,209,0.6)' : 'none' }}
                    >
                      {phase === 'building' ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <ArrowUp className="h-[18px] w-[18px]" />}
                    </button>
                  </form>

                  <p className="font-mono text-[11px] mt-3 text-white/40 leading-relaxed">
                    {phase === 'building' ? 'Reading the site and building the receptionist.' : 'Paste a website and it reads the site to fill in the details.'}
                  </p>

                  {/* Example chips: balanced 2x2, never an orphan row */}
                  <div className="mt-6">
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/35 mb-2.5">Or try one</p>
                    <div className="grid grid-cols-2 gap-2">
                      {EXAMPLES.map((ex) => (
                        <button
                          key={ex} type="button" onClick={() => { setQuery(ex); build(ex); }} disabled={phase === 'building'}
                          className="rounded-xl px-4 py-2.5 text-[13.5px] text-left text-white/70 transition-colors disabled:opacity-50"
                          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(1,245,209,0.5)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-[13px] mt-4" style={{ color: '#ff6b6b' }}>{error}</p>}

                  <p className="mt-6 pt-5 border-t border-white/[0.06] font-mono text-[11px] text-white/35">
                    Uses your microphone. Up to 4 minutes, no signup.
                  </p>
                </div>
              )}

              {/* READY / CALL: the receptionist, rendered in the same panel */}
              {biz && !onConsole && phase !== 'error' && (
                <div>
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(1,245,209,0.12)' }}><Sparkles className="h-5 w-5" style={{ color: EM }} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-[17px] leading-tight">{biz.name}&rsquo;s receptionist</p>
                      {biz.industry && <p className="text-[12px] mt-0.5" style={{ color: EM }}>{biz.industry}</p>}
                    </div>
                    {(phase === 'live' || phase === 'connecting') && <span className="ml-auto font-mono text-[12px] text-white/60 whitespace-nowrap">{phase === 'connecting' ? 'connecting' : `${mmss} · ${remaining} left`}</span>}
                  </div>

                  {biz.greeting && (phase === 'ready' || phase === 'ended') && (
                    <p className="text-white/75 text-[15px] mt-4 leading-relaxed rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      &ldquo;{biz.greeting}&rdquo;
                    </p>
                  )}

                  {(phase === 'live' || phase === 'connecting') && (
                    <div ref={transcriptRef} className="mt-4 max-h-44 overflow-y-auto space-y-2 pr-1">
                      {lines.length === 0 ? (
                        <p className="text-white/40 text-[13px]">{phase === 'connecting' ? 'Connecting your call.' : 'Say hello, ask about hours, or try to book an appointment.'}</p>
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

                  {phase === 'ready' && <p className="mt-6 pt-5 border-t border-white/[0.06] font-mono text-[11px] text-white/35">Uses your microphone. Up to 4 minutes, no signup.</p>}
                </div>
              )}

              {/* ERROR */}
              {phase === 'error' && (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                  <div><p className="text-white text-[14px]">{error || 'The live demo is unavailable right now.'}</p><button onClick={reset} className="text-[13px] mt-1" style={{ color: EM }}>Try again</button></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CTA row, under the whole composition ──────────────────────── */}
        <div className="mt-10 lg:mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-x-5 gap-y-3">
          <Link href="/signup" className="btn btn-em">Start your free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          <button type="button" onClick={() => inputRef.current?.focus()} className="text-[14px] text-white/55 hover:text-white transition-colors">
            or build one above, free
          </button>
        </div>
      </div>
    </section>
  );
}
