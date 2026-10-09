'use client';

// ============================================================================
// components/live/LiveCallMonitor.tsx
//
// The live call console shown on the clean /live/[clientId] page. One UI, two
// sources:
//
//   mode="demo"     -> places a browser call to the client's assistant with the
//                      Vapi web SDK and renders its events. This is the tool to
//                      screenshare on a sales call: you talk to the AI, the
//                      whole room watches the transcript and what the AI is
//                      doing light up live.
//   mode="monitor"  -> opens an SSE stream to the backend and renders a REAL
//                      phone call in progress (transcript + status + tool
//                      activity), with optional takeover (speak, mute, transfer,
//                      end) proxied to Vapi's live control channel.
//
// White-labeled: the page wears the agency's brand, never the platform's.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Radio, Loader2, Calendar, CalendarCheck,
  BookOpen, PhoneForwarded, MessageSquare, Sparkles, Send, Building2,
  ChevronRight, CircleDot, Headphones, VolumeX,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

type Mode = 'demo' | 'monitor';
type CallState = 'idle' | 'connecting' | 'live' | 'ended';

interface Branding {
  agency_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
}
interface Info {
  client: { id: string; business_name: string; assistant_id: string | null; industry: string | null };
  branding: Branding;
  web_demo_available: boolean;
}

interface Line { id: string; role: 'caller' | 'assistant'; text: string; }
interface Activity { id: string; tool: string; label: string; detail: string | null; ts: number; }

// Canonical tool -> friendly label + icon. Keeps the demo (client-side events)
// and the monitor (server events) showing the same language.
const TOOL_META: Record<string, { label: string; Icon: any }> = {
  check_availability: { label: 'Checking the calendar', Icon: Calendar },
  book_appointment: { label: 'Booking the appointment', Icon: CalendarCheck },
  search_knowledge_base: { label: 'Searching the knowledge base', Icon: BookOpen },
  request_human_transfer: { label: 'Connecting to the team', Icon: PhoneForwarded },
  transferCall: { label: 'Transferring the call', Icon: PhoneForwarded },
  send_sms: { label: 'Texting the caller', Icon: MessageSquare },
};
function toolMeta(tool: string, fallbackLabel?: string) {
  return TOOL_META[tool] || { label: fallbackLabel || 'Working on it', Icon: Sparkles };
}

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function LiveCallMonitor({ clientId, mode }: { clientId: string; mode: Mode }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [callState, setCallState] = useState<CallState>('idle');
  const [statusLabel, setStatusLabel] = useState<string>(mode === 'monitor' ? 'Waiting for a call' : 'Ready');
  const [isMuted, setIsMuted] = useState(false);
  const [speaking, setSpeaking] = useState<'assistant' | 'caller' | null>(null);

  const [lines, setLines] = useState<Line[]>([]);
  const [partial, setPartial] = useState<{ role: 'caller' | 'assistant'; text: string } | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [takeoverOpen, setTakeoverOpen] = useState(false);
  const [sayText, setSayText] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [controlBusy, setControlBusy] = useState(false);
  const [controlNote, setControlNote] = useState<string | null>(null);

  const [listening, setListening] = useState(false);
  const [listenRate, setListenRate] = useState(16000);
  const [listenErr, setListenErr] = useState<string | null>(null);

  const vapiRef = useRef<any>(null);
  const esRef = useRef<EventSource | null>(null);
  const callIdRef = useRef<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioWsRef = useRef<WebSocket | null>(null);
  const nextTimeRef = useRef(0);
  const listenRateRef = useRef(16000);

  useEffect(() => { listenRateRef.current = listenRate; }, [listenRate]);

  const token = useMemo(() => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  }, []);

  const accent = info?.branding?.primary_color || '#6366f1';
  const agencyName = info?.branding?.agency_name || 'Live Receptionist';
  const businessName = info?.client?.business_name || 'your business';

  // ---- load the small boot payload ----------------------------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/client/${clientId}/live/info`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Could not load this client');
        if (alive) setInfo(data);
      } catch (e: any) {
        if (alive) setLoadErr(e?.message || 'Could not load this client');
      }
    })();
    return () => { alive = false; };
  }, [clientId, token]);

  // ---- helpers to append to the feed --------------------------------------
  const addLine = useCallback((role: 'caller' | 'assistant', text: string) => {
    if (!text.trim()) return;
    setLines((prev) => [...prev, { id: uid(), role, text }]);
  }, []);

  const addActivity = useCallback((tool: string, detail?: string | null, label?: string) => {
    const meta = toolMeta(tool, label);
    setActivities((prev) => [...prev, { id: uid(), tool, label: meta.label, detail: detail || null, ts: Date.now() }]);
  }, []);

  const resetFeed = useCallback(() => {
    setLines([]); setPartial(null); setActivities([]);
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, partial, activities]);

  // ---- DEMO mode: browser call via the Vapi web SDK ------------------------
  const startDemo = useCallback(() => {
    if (!info?.client?.assistant_id) { setControlNote('This client has no assistant set up yet.'); return; }
    if (!VAPI_PUBLIC_KEY) { setControlNote('Live demo needs NEXT_PUBLIC_VAPI_PUBLIC_KEY set.'); return; }
    const assistantId: string = info.client.assistant_id;
    resetFeed();
    setCallState('connecting');
    setStatusLabel('Connecting');
    import('@vapi-ai/web').then(({ default: Vapi }) => {
      const v = new Vapi(VAPI_PUBLIC_KEY);
      vapiRef.current = v;

      v.on('call-start', () => { setCallState('live'); setStatusLabel('Live'); });
      v.on('call-end', () => { setCallState('ended'); setStatusLabel('Call ended'); setSpeaking(null); setPartial(null); });
      v.on('speech-start', () => setSpeaking('assistant'));
      v.on('speech-end', () => setSpeaking(null));
      v.on('error', (err: any) => { setControlNote(err?.message || 'Call error'); setCallState('idle'); setStatusLabel('Ready'); });
      v.on('message', (msg: any) => handleVapiMessage(msg));

      try { v.start(assistantId); } catch (e: any) { setControlNote(e?.message || 'Could not start the call'); setCallState('idle'); }
    }).catch((e) => { setControlNote(e?.message || 'Could not load the calling library'); setCallState('idle'); });
  }, [info, resetFeed]);

  // Normalize a web-SDK message into transcript / activity.
  const handleVapiMessage = useCallback((msg: any) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'transcript') {
      const role: 'caller' | 'assistant' = msg.role === 'user' ? 'caller' : 'assistant';
      const text = msg.transcript || '';
      if (msg.transcriptType === 'final') { setPartial(null); addLine(role, text); }
      else setPartial({ role, text });
      return;
    }
    // Tool activity arrives as tool-calls / function-call on the same channel.
    if (msg.type === 'tool-calls' || msg.type === 'function-call' || msg.type === 'tool-call') {
      const calls =
        msg.toolCallList || msg.toolCalls ||
        (msg.functionCall ? [{ name: msg.functionCall.name, arguments: msg.functionCall.parameters }] : []) ||
        [];
      for (const c of calls) {
        const name = c?.function?.name || c?.name;
        if (!name) continue;
        let detail: string | null = null;
        try {
          const a = typeof (c.function?.arguments ?? c.arguments) === 'string'
            ? JSON.parse(c.function?.arguments ?? c.arguments)
            : (c.function?.arguments ?? c.arguments) || {};
          detail = [a.service_type, a.date, a.time, a.saved_text].filter(Boolean).join(' · ') || null;
        } catch { /* best effort */ }
        addActivity(name, detail);
      }
    }
  }, [addLine, addActivity]);

  // ---- MONITOR mode: SSE stream of a real call -----------------------------
  const applyServerEvent = useCallback((ev: any) => {
    if (!ev || !ev.type) return;
    if (ev.callId) callIdRef.current = ev.callId;
    if (ev.type === 'transcript') {
      if (ev.final) { setPartial(null); addLine(ev.role === 'caller' ? 'caller' : 'assistant', ev.text || ''); }
      else setPartial({ role: ev.role === 'caller' ? 'caller' : 'assistant', text: ev.text || '' });
    } else if (ev.type === 'activity') {
      addActivity(ev.tool || 'tool', ev.detail, ev.label);
    } else if (ev.type === 'status') {
      const s = String(ev.status || '').toLowerCase();
      if (s === 'in-progress') { setCallState('live'); setStatusLabel('Live'); }
      else if (s === 'ringing' || s === 'queued') { setCallState('connecting'); setStatusLabel('Ringing'); }
      else if (s === 'forwarding') { setStatusLabel('Transferring'); addActivity('transferCall'); }
      else if (s === 'ended') { setCallState('ended'); setStatusLabel('Call ended'); setSpeaking(null); setPartial(null); }
    } else if (ev.type === 'takeover') {
      addActivity('request_human_transfer', ev.text || null, `You stepped in (${ev.action})`);
    }
  }, [addLine, addActivity]);

  useEffect(() => {
    if (mode !== 'monitor' || !info) return;
    resetFeed();
    const url = `${API}/api/client/${clientId}/live/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;
    es.addEventListener('hello', () => setStatusLabel('Waiting for a call'));
    es.addEventListener('event', (e: MessageEvent) => {
      try { applyServerEvent(JSON.parse(e.data)); } catch { /* ignore */ }
    });
    es.onerror = () => { /* EventSource auto-reconnects; keep quiet */ };
    return () => { es.close(); esRef.current = null; };
  }, [mode, info, clientId, token, applyServerEvent, resetFeed]);

  // ---- controls ------------------------------------------------------------
  const endDemo = useCallback(() => {
    try { vapiRef.current?.stop(); } catch {}
    setCallState('ended'); setStatusLabel('Call ended'); setSpeaking(null);
  }, []);

  const toggleMuteDemo = useCallback(() => {
    try { vapiRef.current?.setMuted(!isMuted); setIsMuted(!isMuted); } catch {}
  }, [isMuted]);

  useEffect(() => () => { try { vapiRef.current?.stop(); } catch {} }, []);

  // ---- live audio listen (monitor mode): stream raw PCM from the backend ---
  const stopListen = useCallback(() => {
    try { audioWsRef.current?.close(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    audioWsRef.current = null; audioCtxRef.current = null;
    setListening(false);
  }, []);

  const startListen = useCallback(() => {
    const callId = callIdRef.current;
    if (!callId) { setListenErr('No live call to listen to yet.'); return; }
    setListenErr(null);
    try {
      const Ctor: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) { setListenErr('This browser has no Web Audio support.'); return; }
      const ctx: AudioContext = new Ctor();
      audioCtxRef.current = ctx;
      // Small lead so we schedule into the future and avoid underruns.
      nextTimeRef.current = ctx.currentTime + 0.25;

      const wsBase = API.replace(/^http/, 'ws'); // https -> wss, http -> ws
      const url = `${wsBase}/api/live/audio?client=${encodeURIComponent(clientId)}&call=${encodeURIComponent(callId)}&token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';

      ws.onmessage = (e: MessageEvent) => {
        if (typeof e.data === 'string') {
          try { const m = JSON.parse(e.data); if (m.type === 'error') setListenErr(m.error || 'Listen error'); } catch {}
          return;
        }
        const ctx2 = audioCtxRef.current;
        if (!ctx2) return;
        // Raw headerless PCM, signed 16-bit little-endian, mono. We choose the
        // sample rate (VAPI does not send it); the selector lets you tune it.
        const pcm = new Int16Array(e.data as ArrayBuffer);
        if (!pcm.length) return;
        const f32 = new Float32Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 32768;
        const rate = listenRateRef.current;
        const buf = ctx2.createBuffer(1, f32.length, rate);
        buf.getChannelData(0).set(f32);
        const node = ctx2.createBufferSource();
        node.buffer = buf;
        node.connect(ctx2.destination);
        const startAt = Math.max(nextTimeRef.current, ctx2.currentTime + 0.02);
        node.start(startAt);
        nextTimeRef.current = startAt + buf.duration;
      };
      ws.onclose = () => setListening(false);
      ws.onerror = () => setListenErr('Could not connect to the live audio.');
      audioWsRef.current = ws;
      setListening(true);
    } catch (e: any) {
      setListenErr(e?.message || 'Could not start listening.');
    }
  }, [clientId, token]);

  useEffect(() => () => {
    try { audioWsRef.current?.close(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
  }, []);

  const sendControl = useCallback(async (action: string, extra?: Record<string, any>) => {
    const callId = callIdRef.current;
    if (!callId) { setControlNote('No live call to control yet.'); return; }
    setControlBusy(true); setControlNote(null);
    try {
      const res = await fetch(`${API}/api/client/${clientId}/live/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callId, action, ...(extra || {}) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Control failed');
      if (action === 'say') setSayText('');
      if (action === 'transfer') setTransferNumber('');
    } catch (e: any) {
      setControlNote(e?.message || 'Control failed');
    } finally {
      setControlBusy(false);
    }
  }, [clientId, token]);

  // ---- render --------------------------------------------------------------
  if (loadErr) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0b0f] text-white p-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
            <PhoneOff className="h-6 w-6 text-red-400" />
          </div>
          <p className="font-medium">{loadErr}</p>
          <p className="text-sm text-white/50 mt-1">Check that you are signed in and this client belongs to you.</p>
        </div>
      </div>
    );
  }

  const live = callState === 'live';
  const isDemo = mode === 'demo';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0a0b0f] text-white" style={{ ['--accent' as any]: accent }}>
      {/* Header: white-label brand + status */}
      <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          {info?.branding?.logo_url ? (
            <img src={info.branding.logo_url} alt={agencyName} className="h-8 w-8 rounded-lg object-contain bg-white/5" />
          ) : (
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent }}>
              <Phone className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{agencyName}</p>
            <p className="text-xs text-white/50 truncate">{businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'monitor' && (
            <div className="flex items-center gap-1.5">
              <select
                value={listenRate}
                onChange={(e) => setListenRate(Number(e.target.value))}
                title="Audio pitch. If the voice sounds too fast (chipmunk) lower it, too slow raise it."
                className="rounded-lg bg-white/5 border border-white/10 text-xs px-2 py-1.5 outline-none"
              >
                <option value={8000}>8 kHz</option>
                <option value={16000}>16 kHz</option>
                <option value={24000}>24 kHz</option>
              </select>
              {!listening ? (
                <button onClick={startListen} disabled={callState !== 'live'}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                        style={{ backgroundColor: accent }}>
                  <Headphones className="h-4 w-4" /> Listen
                </button>
              ) : (
                <button onClick={stopListen}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/10">
                  <VolumeX className="h-4 w-4" /> Stop
                </button>
              )}
            </div>
          )}
          <StatusPill state={callState} label={statusLabel} accent={accent} />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 min-h-0">
        {/* Transcript */}
        <section className="flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-2 border-b border-white/5">
            <Radio className="h-4 w-4" style={{ color: accent }} />
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Live transcript</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
            {lines.length === 0 && !partial && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <CircleDot className="h-8 w-8 text-white/20 mb-3" />
                <p className="text-sm text-white/40">
                  {isDemo ? 'Press Start call and talk to the AI. Everything it hears, says, and does shows up here live.'
                          : 'Waiting for the next call. When one comes in, it will appear here in real time.'}
                </p>
              </div>
            )}
            {lines.map((l) => <Bubble key={l.id} role={l.role} text={l.text} accent={accent} />)}
            {partial && <Bubble role={partial.role} text={partial.text} accent={accent} faded />}
            <div ref={transcriptEndRef} />
          </div>
        </section>

        {/* Activity rail */}
        <aside className="flex flex-col min-h-0">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-2 border-b border-white/5">
            <Sparkles className="h-4 w-4" style={{ color: accent }} />
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">What the AI is doing</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2">
            {activities.length === 0 && (
              <p className="text-sm text-white/40">Calendar checks, bookings, texts, and transfers appear here as they happen.</p>
            )}
            {activities.map((a, i) => {
              const meta = toolMeta(a.tool, a.label);
              const isLast = i === activities.length - 1;
              return (
                <div key={a.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                     style={{ backgroundColor: isLast && live ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}22` }}>
                    <meta.Icon className="h-4 w-4" style={{ color: accent }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{a.label}</p>
                    {a.detail && <p className="text-xs text-white/50 mt-0.5 truncate">{a.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Takeover (monitor mode only) */}
          {mode === 'monitor' && (
            <div className="border-t border-white/10 px-4 sm:px-6 py-3">
              <button onClick={() => setTakeoverOpen((v) => !v)}
                      className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/60 py-1">
                Take over the call
                <ChevronRight className={`h-4 w-4 transition-transform ${takeoverOpen ? 'rotate-90' : ''}`} />
              </button>
              {takeoverOpen && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={sayText} onChange={(e) => setSayText(e.target.value)}
                           placeholder="Make the AI say..." className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none" />
                    <button disabled={controlBusy || !sayText.trim()} onClick={() => sendControl('say', { text: sayText })}
                            className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40" style={{ backgroundColor: accent }}>
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input value={transferNumber} onChange={(e) => setTransferNumber(e.target.value)}
                           placeholder="Transfer to +1..." className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none" />
                    <button disabled={controlBusy || !transferNumber.trim()} onClick={() => sendControl('transfer', { number: transferNumber })}
                            className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40 bg-white/10">
                      <PhoneForwarded className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={controlBusy} onClick={() => sendControl('mute')} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium bg-white/10 disabled:opacity-40">Mute AI</button>
                    <button disabled={controlBusy} onClick={() => sendControl('unmute')} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium bg-white/10 disabled:opacity-40">Unmute</button>
                    <button disabled={controlBusy} onClick={() => sendControl('end')} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium bg-red-500/80 disabled:opacity-40">End</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Footer controls */}
      <footer className="px-4 sm:px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
        <div className="min-h-[1.25rem] text-xs truncate" style={{ color: listenErr ? '#fca5a5' : 'rgba(255,255,255,0.5)' }}>
          {listenErr || controlNote || (listening ? 'Listening to the live call' : speaking === 'assistant' ? 'AI is speaking...' : live ? 'Call in progress' : '')}
        </div>
        {isDemo ? (
          <div className="flex items-center gap-2">
            {callState !== 'live' && callState !== 'connecting' ? (
              <button onClick={startDemo} disabled={!info}
                      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: accent }}>
                <Phone className="h-4 w-4" /> {callState === 'ended' ? 'Call again' : 'Start call'}
              </button>
            ) : (
              <>
                <button onClick={toggleMuteDemo} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white/10">
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={endDemo} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-red-500/90 text-white">
                  {callState === 'connecting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />} End
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Building2 className="h-4 w-4" /> Monitoring live calls
          </div>
        )}
      </footer>
    </div>
  );
}

function StatusPill({ state, label, accent }: { state: CallState; label: string; accent: string }) {
  const live = state === 'live';
  const connecting = state === 'connecting';
  const color = live ? '#22c55e' : connecting ? '#f59e0b' : state === 'ended' ? '#ef4444' : '#9ca3af';
  return (
    <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="relative flex h-2.5 w-2.5">
        {live && <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ backgroundColor: color }} />}
        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
      </span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function Bubble({ role, text, accent, faded }: { role: 'caller' | 'assistant'; text: string; accent: string; faded?: boolean }) {
  const isAI = role === 'assistant';
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${faded ? 'opacity-60' : ''}`}
           style={{
             backgroundColor: isAI ? 'rgba(255,255,255,0.06)' : accent,
             color: isAI ? '#e5e7eb' : '#fff',
             borderBottomLeftRadius: isAI ? 4 : 16,
             borderBottomRightRadius: isAI ? 16 : 4,
           }}>
        <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: isAI ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)' }}>
          {isAI ? 'AI' : 'Caller'}
        </p>
        {text}
      </div>
    </div>
  );
}