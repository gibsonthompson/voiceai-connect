'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Delete, KeyRound, Grid3x3 } from 'lucide-react';

// ── Palette (Mercedes-AMG Petronas inspired) ───────────────────────────────
// Tiffany/Petronas teal is the core; a brighter teal drives glows. Silver +
// dark gray + near-black do the rest. Kept local to this page so it can read
// distinct from the emerald app theme without touching global tokens.
const C = {
  teal: '#00B98C',
  tealBright: '#1FE6A8',
  silver: '#C8CCCE',
  gray: '#565F64',
  bg: '#050505',
};

const GRID = 4;            // 4x4
const CELLS = GRID * GRID; // 16
const MIN_TAPS = 6;        // ~24 bits of entropy at 16^6, more than a 6-digit PIN

// ── Animated equalizer logo (the real waveform mark, in teal) ───────────────
function WaveformLogo({ size = 44 }: { size?: number }) {
  const bars = [
    { x: 2, h: 6, d: '0.9s' }, { x: 5, h: 10, d: '1.3s' }, { x: 8, h: 16, d: '0.7s' },
    { x: 11, h: 12, d: '1.1s' }, { x: 14, h: 18, d: '0.8s' }, { x: 17, h: 10, d: '1.4s' },
    { x: 20, h: 6, d: '1.0s' },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="VoiceAI Connect">
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={12 - b.h / 2}
          width="2"
          height={b.h}
          rx="1"
          fill={i === 4 ? C.tealBright : C.teal}
          className="vac-bar"
          style={{ animationDuration: b.d }}
        />
      ))}
    </svg>
  );
}

// ── Telemetry background: drifting teal particles wired into a faint web ────
function TelemetryBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; vx: number; vy: number };
    let pts: P[] = [];

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(64, Math.floor((w * h) / 22000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      // links
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(31,230,168,${0.10 * (1 - dist / 130)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // nodes
      for (const p of pts) {
        ctx.fillStyle = 'rgba(0,185,140,0.55)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'grid' | 'code'>('grid');
  const [seq, setSeq] = useState<number[]>([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [okFlash, setOkFlash] = useState(false);

  const tap = (i: number) => {
    if (loading) return;
    setError('');
    setSeq((s) => (s.length >= 24 ? s : [...s, i]));
  };
  const back = () => { setError(''); setSeq((s) => s.slice(0, -1)); };
  const clear = () => { setError(''); setSeq([]); };

  const submit = useCallback(async () => {
    // The secret is compared on the server. The grid is only an input method:
    // the tapped sequence serializes to a string and is sent as `pin` to the
    // same endpoint the PIN used, so verification stays server-side.
    const pin = mode === 'grid' ? seq.join('-') : code;
    if (mode === 'grid' && seq.length < MIN_TAPS) return;
    if (mode === 'code' && code.length < 4) return;

    setLoading(true); setError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Access denied');
      setOkFlash(true);
      localStorage.setItem('admin_token', data.token);
      setTimeout(() => router.push('/admin'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Access denied');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setSeq([]); setCode('');
      setLoading(false);
    }
  }, [mode, seq, code, router]);

  // Enter submits in code mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && mode === 'code') submit(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, submit]);

  const canSubmit = mode === 'grid' ? seq.length >= MIN_TAPS : code.length >= 4;

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-6" style={{ backgroundColor: C.bg }}>
      <style>{`
        @keyframes vacBar { 0%,100% { transform: scaleY(0.45); } 50% { transform: scaleY(1); } }
        .vac-bar { animation: vacBar ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes vacShake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-8px)} 40%,60%{transform:translateX(8px)} }
        .vac-shake { animation: vacShake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes vacPop { 0%{transform:scale(.85);opacity:.4} 60%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
        .vac-cell-on { animation: vacPop .22s ease-out; }
        @keyframes vacRise { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .vac-rise { animation: vacRise .5s ease-out both; }
        @keyframes vacSweep { 0%{transform:translateX(-120%)} 100%{transform:translateX(120%)} }
        .vac-sweep { animation: vacSweep 3.2s ease-in-out infinite; }
        @keyframes vacGlow { 0%,100%{opacity:.35} 50%{opacity:.7} }
        .vac-glow { animation: vacGlow 3s ease-in-out infinite; }
      `}</style>

      {/* Background */}
      <TelemetryBackground />
      <div className="pointer-events-none absolute inset-0">
        <div className="vac-glow absolute top-1/4 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full blur-[130px]" style={{ backgroundColor: 'rgba(0,185,140,0.10)' }} />
        <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
          <div className="vac-sweep h-px w-1/3" style={{ background: `linear-gradient(90deg, transparent, ${C.tealBright}, transparent)` }} />
        </div>
        {/* subtle scanline grain */}
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 3px)' }} />
      </div>

      <div className={`relative w-full max-w-[380px] ${shake ? 'vac-shake' : ''}`}>
        {/* Header */}
        <div className="text-center mb-8 vac-rise">
          <div className="inline-flex items-center justify-center mb-5 relative">
            <div className="absolute inset-0 -m-4 blur-2xl rounded-full" style={{ backgroundColor: 'rgba(31,230,168,0.18)' }} />
            <WaveformLogo size={46} />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-white">VoiceAI Connect</h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-px w-6" style={{ background: `linear-gradient(90deg, transparent, ${C.teal})` }} />
            <p className="text-[10px] font-mono uppercase tracking-[0.28em]" style={{ color: C.teal }}>Platform Administration</p>
            <span className="h-px w-6" style={{ background: `linear-gradient(90deg, ${C.teal}, transparent)` }} />
          </div>
        </div>

        {/* Card */}
        <div
          className="vac-rise rounded-2xl p-6 sm:p-7 backdrop-blur-xl"
          style={{
            animationDelay: '0.08s',
            backgroundColor: 'rgba(12,14,15,0.72)',
            border: `1px solid ${okFlash ? C.tealBright : 'rgba(200,204,206,0.10)'}`,
            boxShadow: okFlash
              ? `0 0 0 1px ${C.tealBright}, 0 30px 80px rgba(31,230,168,0.18)`
              : '0 30px 80px rgba(0,0,0,0.6)',
            transition: 'border-color .3s, box-shadow .3s',
          }}
        >
          {mode === 'grid' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: C.gray }}>
                  Access Pattern
                </label>
                {/* sequence length pips */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.max(MIN_TAPS, seq.length) }).map((_, i) => (
                    <span
                      key={i}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: i < seq.length ? 10 : 6,
                        backgroundColor: i < seq.length ? C.tealBright : 'rgba(200,204,206,0.18)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-4 gap-2.5">
                {Array.from({ length: CELLS }).map((_, i) => {
                  const count = seq.filter((x) => x === i).length;
                  const lastIsThis = seq[seq.length - 1] === i;
                  const active = count > 0;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => tap(i)}
                      disabled={loading}
                      className={`relative aspect-square rounded-xl flex items-center justify-center transition-colors ${lastIsThis ? 'vac-cell-on' : ''}`}
                      style={{
                        backgroundColor: active ? 'rgba(0,185,140,0.16)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${active ? C.teal : 'rgba(200,204,206,0.09)'}`,
                        boxShadow: active ? `0 0 18px rgba(31,230,168,0.25)` : 'none',
                      }}
                      aria-label={`cell ${i + 1}`}
                    >
                      <span
                        className="h-2 w-2 rounded-full transition-all"
                        style={{
                          backgroundColor: active ? C.tealBright : 'rgba(200,204,206,0.22)',
                          transform: active ? 'scale(1)' : 'scale(0.7)',
                        }}
                      />
                      {count > 0 && (
                        <span
                          className="absolute top-1 right-1.5 text-[9px] font-mono font-semibold"
                          style={{ color: C.tealBright }}
                        >
                          {count > 1 ? `${count}\u00d7` : ''}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Controls */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={back}
                  disabled={loading || seq.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors disabled:opacity-30"
                  style={{ color: C.silver, border: '1px solid rgba(200,204,206,0.12)' }}
                >
                  <Delete className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={clear}
                  disabled={loading || seq.length === 0}
                  className="rounded-xl px-3 py-2.5 text-xs font-medium transition-colors disabled:opacity-30"
                  style={{ color: C.gray, border: '1px solid rgba(200,204,206,0.12)' }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading || !canSubmit}
                  className="group ml-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ backgroundColor: C.teal, color: C.bg }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Authenticate <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
                </button>
              </div>
              {!canSubmit && !error && (
                <p className="mt-3 text-center text-[11px]" style={{ color: C.gray }}>
                  Tap at least {MIN_TAPS} cells in your sequence
                </p>
              )}
            </>
          ) : (
            <>
              <label className="block text-[10px] font-mono uppercase tracking-[0.2em] mb-2.5" style={{ color: C.gray }}>
                Access Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.gray }} />
                <input
                  type="password"
                  inputMode="text"
                  autoFocus
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(''); }}
                  placeholder="••••••"
                  className="w-full rounded-xl pl-11 pr-4 py-3.5 text-center text-lg tracking-[0.3em] text-white placeholder:tracking-[0.3em] focus:outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(200,204,206,0.12)` }}
                />
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={loading || code.length < 4}
                className="group mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all disabled:opacity-30"
                style={{ backgroundColor: C.teal, color: C.bg }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
              </button>
            </>
          )}

          {error && (
            <div className="mt-4 rounded-xl p-3 text-xs text-center" style={{ backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>
              {error}
            </div>
          )}
        </div>

        {/* Mode toggle + footer */}
        <div className="mt-5 flex items-center justify-center">
          <button
            type="button"
            onClick={() => { setMode((m) => (m === 'grid' ? 'code' : 'grid')); setError(''); setSeq([]); setCode(''); }}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:opacity-80"
            style={{ color: C.gray }}
          >
            {mode === 'grid' ? <><KeyRound className="h-3 w-3" /> Use access code instead</> : <><Grid3x3 className="h-3 w-3" /> Use access pattern</>}
          </button>
        </div>
        <p className="text-center mt-4 text-[10px] font-mono tracking-wider" style={{ color: 'rgba(200,204,206,0.18)' }}>
          SECURED TERMINAL · VOICEAI CONNECT
        </p>
      </div>
    </div>
  );
}