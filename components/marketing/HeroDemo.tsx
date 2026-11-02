'use client';

// ============================================================================
// HeroDemo — a centered, full-width marketing SECTION: a clean, modern prompt
// box where a visitor describes a business or pastes its site, we build a
// working AI receptionist from it, SHOW what the scraper learned, and then they
// have a live browser voice call with it. Public and anonymous.
//
// Phase flow:
//   idle/building -> ready (shows "What your receptionist already knows" from
//   the scrape, BEFORE calling) -> connecting -> live (improved live transcript
//   with interim text + merged bubbles) -> ended -> (error)
//
// Backend returns (POST /api/public/demo-receptionist):
//   { success, business_name, industry, city, greeting, read_website,
//     website_url, facts[], assistant }
//   `assistant` is a full inline transient VAPI assistant (no number, no acct).
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUp, Globe, Mic, Phone, PhoneOff, Loader2, Sparkles, AlertTriangle, ArrowUpRight, Check } from 'lucide-react';

const EM = '#01f5d1';        // primary brand accent (matches --color-em-400 / text-em / btn-em)
const EM_INK = '#04120f';    // text on top of the teal accent
const MAX_SECONDS = 240;     // 4 minute demo cap
const EXAMPLES = ['Dental office', 'HVAC company', 'Med spa', 'Law firm'];

const STEPS: [string, string, string][] = [
  ['1', 'Paste a website', 'We read the site and pull the real business details. No forms, nothing to fill in.'],
  ['2', 'It builds in seconds', 'Greeting, services, hours, and the questions it gets asked, all from what the site says.'],
  ['3', 'Call it and hear it', 'Pick up and talk to the receptionist, the same thing a caller gets on day one.'],
];

type Phase = 'idle' | 'building' | 'ready' | 'connecting' | 'live' | 'ended' | 'error';
interface Line { role: 'user' | 'assistant'; text: string }
interface Biz { name: string; industry: string; city: string; greeting: string; facts: string[]; readWebsite: boolean; websiteUrl: string | null }

function domainOf(url: string | null): string {
  if (!url) return '';
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '');
}

export default function HeroDemo() {
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  const vapiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

  const [phase, setPhase] = useState<Phase>('idle');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [biz, setBiz] = useState<Biz | null>(null);
  const [assistant, setAssistant] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [interim, setInterim] = useState<Line | null>(null);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const endCall = useCallback(() => { try { vapiRef.current?.stop(); } catch { /* ignore */ } stopTimer(); }, []);
  useEffect(() => () => { endCall(); }, [endCall]);
  useEffect(() => { if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight; }, [lines, interim]);

  async function build(q: string) {
    const text = (q || '').trim();
    if (!text) return;
    setPhase('building'); setError(''); setLines([]); setInterim(null);
    try {
      const res = await fetch(`${api}/api/public/demo-receptionist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: text }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.assistant) throw new Error(j.error || 'Could not build the demo. Try rephrasing.');
      setBiz({
        name: j.business_name, industry: j.industry || '', city: j.city || '', greeting: j.greeting || '',
        facts: Array.isArray(j.facts) ? j.facts.filter(Boolean) : [],
        readWebsite: !!j.read_website, websiteUrl: j.website_url || null,
      });
      setAssistant(j.assistant);
      setPhase('ready');
    } catch (e: any) { setError(e?.message || 'Something went wrong.'); setPhase('idle'); }
  }

  async function startCall() {
    if (!assistant) return;
    if (!vapiKey) { setError('Live demo is not configured yet.'); setPhase('error'); return; }
    setPhase('connecting'); setError(''); setLines([]); setInterim(null); setSeconds(0); setMuted(false);
    try {
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
        if (m.transcriptType === 'partial') {
          // Interim text updates live as the speaker talks (keeps the transcript current).
          setInterim({ role, text });
        } else if (m.transcriptType === 'final') {
          // Merge a finalized chunk into the previous bubble when the same speaker
          // is still talking, so one sentence is never split across lines.
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
      await v.start(assistant);
    } catch (e: any) { setError(e?.message || 'Could not start the call. Check mic permissions.'); setPhase('ended'); }
  }

  const toggleMute = () => { if (!vapiRef.current) return; const n = !muted; vapiRef.current.setMuted(n); setMuted(n); };
  const reset = () => { endCall(); setPhase('idle'); setBiz(null); setAssistant(null); setQuery(''); setLines([]); setInterim(null); setSeconds(0); setError(''); };
  const remaining = `${Math.floor((MAX_SECONDS - seconds) / 60)}:${String((MAX_SECONDS - seconds) % 60).padStart(2, '0')}`;
  const hasText = !!query.trim();
  const onConsole = phase === 'idle' || phase === 'building';
  const inCall = phase === 'connecting' || phase === 'live';
  const domain = domainOf(biz?.websiteUrl ?? null);

  return (
    <section className="relative bg-ink py-24 sm:py-32 lg:py-40">
      {/* Soft ambient teal glow. Bleeds UP past the top of this section (no hard
          divider) so the green wash carries into the section above. */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '-260px', height: '860px', background: 'radial-gradient(1100px 560px at 50% 38%, rgba(1,245,209,0.13), transparent 72%)' }} />

      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative text-center">

        <h2 className="font-display font-medium text-white mx-auto" style={{ fontSize: 'clamp(2.25rem, 5.6vw, 4.75rem)', lineHeight: 1.03, letterSpacing: '-0.04em' }}>
          Build a receptionist.<br />Then call it.
        </h2>

        {onConsole && (
          <p className="mt-6 text-[15px] leading-relaxed text-white/50 max-w-[34rem] mx-auto">
            Paste any local business&rsquo;s website and its AI receptionist is answering the phone in under a minute. This is the exact product you&rsquo;d resell, and the demo that gets a business owner to sign up.
          </p>
        )}

        {/* ── IDLE / BUILDING: the prompt box ─────────────────────────────── */}
        {onConsole && (
          <div>
            <form onSubmit={(e) => { e.preventDefault(); build(query); }} className="mt-11 max-w-[720px] mx-auto">
              <div
                className="rounded-[24px] bg-white/[0.03] px-6 pt-5 pb-4 text-left transition-all duration-200 border border-white/10 focus-within:border-[rgba(1,245,209,0.7)] focus-within:bg-white/[0.045] focus-within:shadow-[0_0_0_4px_rgba(1,245,209,0.10),0_20px_60px_-28px_rgba(1,245,209,0.5)]"
              >
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setError(''); }}
                  placeholder="Paste a business website, or describe the business"
                  autoComplete="off"
                  disabled={phase === 'building'}
                  className="w-full bg-transparent text-[16px] text-white placeholder-white/35 focus:outline-none"
                />
                <div className="flex items-center justify-between gap-3 mt-3">
                  <span className="inline-flex items-center gap-2 text-[12.5px] text-white/40 min-w-0">
                    <Globe className="h-[15px] w-[15px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
                    <span className="truncate">{phase === 'building' ? 'Reading the site and building the receptionist' : 'Paste a link and it reads the site for you'}</span>
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

            <div className="mt-7">
              <p className="text-[13px] text-white/40 mb-3">No website handy? Try one</p>
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

            {phase === 'idle' && (
              <div className="mt-20 lg:mt-28">
                <div className="grid sm:grid-cols-3 gap-12 sm:gap-10 lg:gap-16 text-center max-w-5xl mx-auto">
                  {STEPS.map(([n, t, d]) => (
                    <div key={n}>
                      <div className="mx-auto h-10 w-10 rounded-full flex items-center justify-center text-[15px] font-semibold" style={{ backgroundColor: 'rgba(1,245,209,0.1)', color: EM, border: '1px solid rgba(1,245,209,0.25)' }}>{n}</div>
                      <p className="text-white font-semibold text-[16px] mt-5">{t}</p>
                      <p className="text-[14px] leading-relaxed text-white/50 mt-2 max-w-[30ch] mx-auto">{d}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-16 text-[15px] leading-relaxed text-white/55 max-w-2xl mx-auto">
                  Signing up a paying client works exactly the same way. You paste their website, the receptionist builds itself, and it is ready to answer calls in about a minute. They hear it before they buy it.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-x-5 gap-y-3">
                  <Link href="/signup" className="btn btn-em">Start your free trial <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                  <button type="button" onClick={() => inputRef.current?.focus()} className="text-[14px] text-white/55 hover:text-white transition-colors">
                    or build one above first, free
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── READY / CALL: knowledge panel, then the live call ───────────── */}
        {biz && !onConsole && phase !== 'error' && (
          <div className="mt-11 max-w-[660px] mx-auto rounded-2xl text-left overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>

            {/* Header: who it is, and that it read the site */}
            <div className="flex items-start gap-3 p-6 sm:p-7 pb-5">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(1,245,209,0.12)' }}><Sparkles className="h-5 w-5" style={{ color: EM }} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-[17px] leading-tight">{biz.name}&rsquo;s receptionist</p>
                <p className="text-[13px] mt-0.5 text-white/55">
                  {[biz.industry, biz.city].filter(Boolean).join(' · ') || 'Ready to take calls'}
                </p>
              </div>
              {inCall ? (
                <span className="inline-flex items-center gap-2 flex-shrink-0">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: phase === 'live' ? '#ff6b6b' : 'rgba(255,255,255,0.4)', boxShadow: phase === 'live' ? '0 0 0 3px rgba(255,107,107,0.2)' : 'none' }} />
                  <span className="text-[12.5px] font-medium text-white/60 whitespace-nowrap">{phase === 'connecting' ? 'Connecting' : `${remaining} left`}</span>
                </span>
              ) : biz.readWebsite && domain ? (
                <span className="inline-flex items-center gap-1.5 flex-shrink-0 rounded-full px-2.5 py-1 text-[11.5px]" style={{ backgroundColor: 'rgba(1,245,209,0.1)', color: EM, border: '1px solid rgba(1,245,209,0.22)' }}>
                  <Check className="h-3 w-3" /> Read {domain}
                </span>
              ) : null}
            </div>

            {/* READY: what it already knows + the greeting */}
            {phase === 'ready' && (
              <div className="px-6 sm:px-7">
                {biz.facts.length > 0 && (
                  <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-white/45 mb-3">What it already knows</p>
                    <ul className="space-y-2.5">
                      {biz.facts.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-white/80">
                          <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: EM }} strokeWidth={2.5} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {biz.greeting && (
                  <div className="mt-4">
                    <p className="text-[12px] text-white/40 mb-1.5">It answers the phone with</p>
                    <p className="text-white/85 text-[15px] leading-relaxed rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(1,245,209,0.06)', border: '1px solid rgba(1,245,209,0.16)' }}>
                      &ldquo;{biz.greeting}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CALL: the live transcript */}
            {(inCall || phase === 'ended') && (
              <div className="px-6 sm:px-7">
                <div ref={transcriptRef} className="max-h-[300px] overflow-y-auto space-y-3 py-1">
                  {lines.length === 0 && !interim ? (
                    <p className="text-white/45 text-[14px] text-center py-8">
                      {phase === 'connecting' ? 'Connecting your call.' : phase === 'ended' ? 'Call ended. Build another, or start your trial.' : 'Say hello, ask about hours, or try to book an appointment.'}
                    </p>
                  ) : (
                    <>
                      {lines.map((l, i) => <Bubble key={i} line={l} />)}
                      {interim && <Bubble line={interim} live />}
                    </>
                  )}
                </div>
              </div>
            )}

            {error && <p className="text-[13px] px-6 sm:px-7 mt-2" style={{ color: '#ff6b6b' }}>{error}</p>}

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 p-6 sm:p-7 pt-5">
              {phase === 'ready' && (
                <>
                  <button onClick={startCall} className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-all hover:brightness-105 active:scale-[0.98]" style={{ backgroundColor: EM, color: EM_INK, boxShadow: '0 10px 28px -12px rgba(1,245,209,0.6)' }}><Phone className="h-5 w-5" /> Talk to it</button>
                  <button onClick={reset} className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Try another business</button>
                  <span className="ml-auto text-[12px] text-white/40 hidden sm:block">Uses your mic. 4 minutes, no signup.</span>
                </>
              )}
              {inCall && (
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
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div className="mt-11 max-w-[600px] mx-auto rounded-2xl p-5 flex items-start gap-3 text-left" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
            <div><p className="text-white text-[14px]">{error || 'The live demo is unavailable right now.'}</p><button onClick={reset} className="text-[13px] mt-1" style={{ color: EM }}>Try again</button></div>
          </div>
        )}
      </div>
    </section>
  );
}

// A single transcript turn, as a chat bubble aligned by speaker.
function Bubble({ line, live }: { line: Line; live?: boolean }) {
  const isUser = line.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[84%] rounded-2xl px-4 py-2.5"
        style={{
          backgroundColor: isUser ? 'rgba(255,255,255,0.06)' : 'rgba(1,245,209,0.08)',
          border: `1px solid ${isUser ? 'rgba(255,255,255,0.1)' : 'rgba(1,245,209,0.18)'}`,
          opacity: live ? 0.72 : 1,
        }}
      >
        <p className="text-[11px] font-semibold mb-1" style={{ color: isUser ? 'rgba(255,255,255,0.4)' : EM }}>{isUser ? 'You' : 'Receptionist'}</p>
        <p className="text-[14.5px] leading-relaxed" style={{ color: isUser ? 'rgba(255,255,255,0.85)' : '#fff' }}>
          {line.text}{live && <span className="inline-block ml-1 animate-pulse">…</span>}
        </p>
      </div>
    </div>
  );
}
