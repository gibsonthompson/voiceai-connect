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
//                      end) proxied to Vapi's live control channel, plus live
//                      audio listen.
//
// White-labeled AND theme-matched: it follows the agency's light/dark setting
// (read synchronously from localStorage so there is no mode flash) and the
// agency's brand color. The full UI is not painted until branding has loaded,
// so the agency never sees platform base colors before their logo appears.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Radio, Loader2, Calendar, CalendarCheck,
  BookOpen, PhoneForwarded, MessageSquare, Sparkles, Send, Building2,
  ChevronRight, CircleDot, Headphones, VolumeX,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
  realtime_channel?: string;
}

interface Line { id: string; role: 'caller' | 'assistant'; text: string; }
interface Activity { id: string; tool: string; label: string; detail: string | null; ts: number; }

type Theme = ReturnType<typeof palette>;

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

// ---- Live audio format detection -------------------------------------------
// VAPI's listen stream does not announce its format and it varies (8/16/24/32
// kHz, mono OR interleaved stereo). We detect it from the real-time byte rate
// and a channel heuristic, then play it. Assuming a fixed mono rate is what made
// the audio sound like garbled "waves" on a stereo or off-rate stream.
const STANDARD_RATES = [8000, 16000, 22050, 24000, 32000, 44100, 48000];
function nearestRate(r: number): number {
  let best = STANDARD_RATES[0];
  let bd = Infinity;
  for (const s of STANDARD_RATES) { const d = Math.abs(s - r); if (d < bd) { bd = d; best = s; } }
  return best;
}
// Interleaved stereo [L,R,L,R...] has neighbouring samples (cross-channel) less
// correlated than samples two apart (same channel), so neighbour diffs run
// bigger. Mono audio is the opposite.
function looksStereo(samples: Int16Array): boolean {
  const n = Math.min(samples.length - 2, 8000);
  if (n < 200) return false;
  let d1 = 0, d2 = 0;
  for (let i = 0; i < n; i++) {
    d1 += Math.abs(samples[i + 1] - samples[i]);
    d2 += Math.abs(samples[i + 2] - samples[i]);
  }
  return d1 > d2 * 1.15;
}
function concatInt16(chunks: Int16Array[]): Int16Array {
  let len = 0; for (const c of chunks) len += c.length;
  const out = new Int16Array(len); let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

// Read the agency's light/dark choice the same way useTheme does, synchronously,
// so the first paint is already in the right mode.
function readPrefersDark(): boolean {
  try { return localStorage.getItem('voiceai_ui_theme') === 'dark'; } catch { return false; }
}
function hexLuminance(hex: string): number {
  const c = (hex || '').replace('#', '');
  if (c.length < 6) return 0;
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function contrastOn(hex: string): string {
  return hexLuminance(hex) > 0.6 ? '#0f172a' : '#ffffff';
}

function palette(dark: boolean) {
  return dark
    ? {
        dark: true,
        bg: '#0a0b0f', text: '#f3f4f6', textMuted: 'rgba(255,255,255,0.55)', textFaint: 'rgba(255,255,255,0.35)',
        border: 'rgba(255,255,255,0.10)', borderSubtle: 'rgba(255,255,255,0.06)',
        surface: 'rgba(255,255,255,0.03)', surfaceStrong: 'rgba(255,255,255,0.07)',
        aiBubbleBg: 'rgba(255,255,255,0.07)', aiBubbleText: '#e5e7eb',
        pillBg: 'rgba(255,255,255,0.05)', inputBg: 'rgba(255,255,255,0.05)', logoBg: 'rgba(255,255,255,0.06)',
        err: '#fca5a5',
      }
    : {
        dark: false,
        bg: '#f6f7f9', text: '#0f172a', textMuted: '#64748b', textFaint: '#94a3b8',
        border: 'rgba(15,23,42,0.10)', borderSubtle: 'rgba(15,23,42,0.06)',
        surface: 'rgba(15,23,42,0.03)', surfaceStrong: 'rgba(15,23,42,0.06)',
        aiBubbleBg: '#eceff3', aiBubbleText: '#0f172a',
        pillBg: 'rgba(15,23,42,0.05)', inputBg: '#ffffff', logoBg: 'rgba(15,23,42,0.05)',
        err: '#dc2626',
      };
}

export default function LiveCallMonitor({ clientId, mode }: { clientId: string; mode: Mode }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [callState, setCallState] = useState<CallState>('idle');
  const [statusLabel, setStatusLabel] = useState<string>(mode === 'monitor' ? 'Waiting for a call' : 'Ready');
  const [isMuted, setIsMuted] = useState(false);
  const [speaking, setSpeaking] = useState<'assistant' | 'caller' | null>(null);

  const [lines, setLines] = useState<Line[]>([]);
  const [partial, setPartial] = useState<{ role: 'caller' | 'assistant'; text: string } | null>(null);
  // When the AI warm-transfers the caller to a person, VAPI (and its transcript)
  // drops off while the human conversation continues on the carrier. This holds
  // the "connected to X" note so the transcript pane explains the pause instead
  // of looking frozen. Cleared when the caller returns to the AI or the call ends.
  const [bridged, setBridged] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [takeoverOpen, setTakeoverOpen] = useState(false);
  const [sayText, setSayText] = useState('');
  const [transferNumber, setTransferNumber] = useState('');
  const [controlBusy, setControlBusy] = useState(false);
  const [controlNote, setControlNote] = useState<string | null>(null);

  const [listening, setListening] = useState(false);
  const [listenRate, setListenRate] = useState(0); // 0 = auto-detect format
  const [listenErr, setListenErr] = useState<string | null>(null);
  const [listenInfo, setListenInfo] = useState<string | null>(null);
  // Deliberately delay the audio so it lines up with the transcript (which
  // trails the live speech by the transcription lag). Seconds.
  const [syncDelay, setSyncDelay] = useState(1.5);

  const [prefersDark] = useState<boolean>(() => readPrefersDark());
  const t = useMemo(() => palette(prefersDark), [prefersDark]);

  const vapiRef = useRef<any>(null);
  const esRef = useRef<EventSource | null>(null);
  const callIdRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioWsRef = useRef<WebSocket | null>(null);
  const audioOutRef = useRef<AudioNode | null>(null);
  const nextTimeRef = useRef(0);
  const listenRateRef = useRef(0);
  const syncDelayRef = useRef(1.5);
  const detectRef = useRef<{ started: number; bytes: number; pending: Int16Array[]; channels: number; rate: number; done: boolean } | null>(null);
  const scrollQueuedRef = useRef(false);

  useEffect(() => { listenRateRef.current = listenRate; }, [listenRate]);
  useEffect(() => { syncDelayRef.current = syncDelay; }, [syncDelay]);

  const token = useMemo(() => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  }, []);

  const accent = info?.branding?.primary_color || '#6366f1';
  const accentText = useMemo(() => contrastOn(accent), [accent]);
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
    // Throttle to one scroll per animation frame and keep it instant, so rapid
    // partial-transcript updates do not queue smooth-scroll animations (which
    // read as lag). Keeps the newest line in view in real time.
    if (scrollQueuedRef.current) return;
    scrollQueuedRef.current = true;
    requestAnimationFrame(() => {
      scrollQueuedRef.current = false;
      transcriptEndRef.current?.scrollIntoView({ block: 'end' });
    });
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
    // The same event can arrive on both the SSE stream and the Supabase Realtime
    // channel; de-duplicate by its stamped id so it renders once.
    if (ev.id) {
      if (seenIdsRef.current.has(ev.id)) return;
      seenIdsRef.current.add(ev.id);
      if (seenIdsRef.current.size > 1000) seenIdsRef.current.clear();
    }
    if (ev.callId) callIdRef.current = ev.callId;
    if (ev.type === 'transcript') {
      if (ev.final) { setPartial(null); addLine(ev.role === 'caller' ? 'caller' : 'assistant', ev.text || ''); }
      else setPartial({ role: ev.role === 'caller' ? 'caller' : 'assistant', text: ev.text || '' });
    } else if (ev.type === 'activity') {
      addActivity(ev.tool || 'tool', ev.detail, ev.label);
    } else if (ev.type === 'status') {
      const s = String(ev.status || '').toLowerCase();
      const lbl = ev.label ? String(ev.label) : null;
      if (s === 'in-progress') { setCallState('live'); setStatusLabel(lbl || 'Live'); setBridged(null); }
      else if (s === 'ringing' || s === 'queued') { setCallState('connecting'); setStatusLabel(lbl || 'Ringing'); }
      else if (s === 'forwarding') { setStatusLabel('Transferring'); addActivity('transferCall'); }
      // Own-the-call warm transfer lifecycle (telnyx_cc): dialing the team, then
      // connected (bridged) to a person. Stay "live" throughout; the pill label
      // tells the viewer where the call is.
      else if (s === 'dialing_team' || s === 'transferring') { setCallState('live'); setStatusLabel(lbl || 'Transferring to the team'); }
      else if (s === 'bridged') { setCallState('live'); setStatusLabel(lbl || 'Connected to the team'); setBridged(lbl || 'Connected to the team'); setPartial(null); }
      else if (s === 'ended') { setCallState('ended'); setStatusLabel('Call ended'); setSpeaking(null); setPartial(null); setBridged(null); }
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

  // Supabase Realtime: the cross-instance delivery path. Subscribes to the same
  // events over a WebSocket straight to Supabase, so the monitor works even when
  // the backend runs multiple instances (the webhook may be on a different one
  // than this viewer's SSE). De-dup in applyServerEvent keeps events single.
  useEffect(() => {
    if (mode !== 'monitor' || !info?.realtime_channel || !SUPABASE_URL || !SUPABASE_ANON) return;
    let client: any = null;
    try {
      client = createClient(SUPABASE_URL, SUPABASE_ANON, { realtime: { params: { eventsPerSecond: 40 } } });
      const ch = client.channel(info.realtime_channel, { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'event' }, (msg: any) => {
        try { applyServerEvent(msg?.payload); } catch { /* ignore */ }
      });
      ch.subscribe();
      return () => { try { client.removeChannel(ch); } catch {} };
    } catch {
      return;
    }
  }, [mode, info, applyServerEvent]);

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
    audioOutRef.current = null; detectRef.current = null;
    setListening(false); setListenInfo(null);
  }, []);

  const startListen = useCallback(() => {
    const callId = callIdRef.current;
    if (!callId) { setListenErr('No live call to listen to yet.'); return; }
    setListenErr(null); setListenInfo(null);
    try {
      const Ctor: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) { setListenErr('This browser has no Web Audio support.'); return; }
      const ctx: AudioContext = new Ctor();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch {} }

      // Output chain: phone audio is quiet, so lift it and run a limiter so the
      // boost never clips.
      const gain = ctx.createGain(); gain.gain.value = 2.2;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -6; limiter.knee.value = 6; limiter.ratio.value = 12;
      limiter.attack.value = 0.003; limiter.release.value = 0.12;
      gain.connect(limiter); limiter.connect(ctx.destination);
      audioOutRef.current = gain;

      nextTimeRef.current = 0;
      // listenRateRef > 0 means the user forced a rate (mono); 0 means auto-detect.
      const forced = listenRateRef.current;
      detectRef.current = { started: 0, bytes: 0, pending: [], channels: 1, rate: forced || 0, done: forced > 0 };
      if (forced > 0) setListenInfo(`${forced / 1000}kHz mono (manual)`);

      const schedule = (int16: Int16Array) => {
        const c = audioCtxRef.current; const d = detectRef.current;
        if (!c || !d || !d.done || !d.rate) return;
        let frames: number; let f32: Float32Array;
        if (d.channels === 2) {
          frames = int16.length >> 1;
          f32 = new Float32Array(frames);
          for (let i = 0; i < frames; i++) f32[i] = ((int16[2 * i] + int16[2 * i + 1]) * 0.5) / 32768;
        } else {
          frames = int16.length;
          f32 = new Float32Array(frames);
          for (let i = 0; i < frames; i++) f32[i] = int16[i] / 32768;
        }
        if (!frames) return;
        const abuf = c.createBuffer(1, frames, d.rate);
        abuf.getChannelData(0).set(f32);
        const node = c.createBufferSource();
        node.buffer = abuf;
        node.connect(audioOutRef.current || c.destination);
        // Lead time = the sync delay (so audio lines up with the transcript),
        // floored at a small jitter buffer so playback never underruns.
        if (nextTimeRef.current === 0) nextTimeRef.current = c.currentTime + Math.max(syncDelayRef.current, 0.15);
        const at = Math.max(nextTimeRef.current, c.currentTime + 0.02);
        node.start(at);
        nextTimeRef.current = at + abuf.duration;
      };

      const wsBase = API.replace(/^http/, 'ws'); // https -> wss, http -> ws
      const url = `${wsBase}/api/live/audio?client=${encodeURIComponent(clientId)}&call=${encodeURIComponent(callId)}&token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';

      ws.onmessage = (e: MessageEvent) => {
        if (typeof e.data === 'string') {
          try { const m = JSON.parse(e.data); if (m.type === 'error') setListenErr(m.error || 'Listen error'); } catch {}
          return;
        }
        const raw = e.data as ArrayBuffer;
        if (!raw || (raw.byteLength & 1)) return; // need whole 16-bit samples
        const int16 = new Int16Array(raw);
        if (!int16.length) return;
        const d = detectRef.current;
        if (!d) return;
        if (d.done) { schedule(int16); return; }
        // Detection window: measure the real-time byte rate + channel layout over
        // the first ~1.5s, then derive the sample rate (bytes/sec / (2*channels)).
        const now = performance.now();
        if (d.started === 0) d.started = now; else d.bytes += int16.byteLength;
        d.pending.push(int16);
        if (now - d.started >= 1500 && d.bytes > 0) {
          const flat = d.pending.length === 1 ? d.pending[0] : concatInt16(d.pending);
          const channels = looksStereo(flat) ? 2 : 1;
          const secs = (now - d.started) / 1000;
          const rate = nearestRate((d.bytes / secs) / (2 * channels));
          d.channels = channels; d.rate = rate; d.done = true;
          setListenInfo(`${rate / 1000}kHz ${channels === 2 ? 'stereo' : 'mono'}`);
          nextTimeRef.current = 0;
          for (const chunk of d.pending) schedule(chunk);
          d.pending = [];
        }
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
      <div className="min-h-[100dvh] flex items-center justify-center p-6" style={{ backgroundColor: t.bg, color: t.text }}>
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
            <PhoneOff className="h-6 w-6" style={{ color: '#ef4444' }} />
          </div>
          <p className="font-medium">{loadErr}</p>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>Check that you are signed in and this client belongs to you.</p>
        </div>
      </div>
    );
  }

  // Do not paint the branded UI until branding has loaded, so the agency never
  // sees platform base colors or a logo pop-in. The loader is theme-matched.
  if (!info) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: t.bg }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: t.textMuted }} />
      </div>
    );
  }

  const live = callState === 'live';
  const isDemo = mode === 'demo';

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: t.bg, color: t.text }}>
      {/* Header: white-label brand + status */}
      <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-3 min-w-0">
          {info.branding?.logo_url ? (
            <img src={info.branding.logo_url} alt={agencyName} className="h-8 w-8 rounded-lg object-contain" style={{ backgroundColor: t.logoBg }} />
          ) : (
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent }}>
              <Phone className="h-4 w-4" style={{ color: accentText }} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{agencyName}</p>
            <p className="text-xs truncate" style={{ color: t.textMuted }}>{businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'monitor' && (
            <div className="flex items-center gap-1.5">
              <select
                value={listenRate}
                onChange={(e) => setListenRate(Number(e.target.value))}
                title="Audio format. Auto detects it; pick a kHz only if auto sounds wrong."
                className="rounded-lg text-xs px-2 py-1.5 outline-none"
                style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text }}
              >
                <option value={0}>Auto</option>
                <option value={8000}>8 kHz</option>
                <option value={16000}>16 kHz</option>
                <option value={24000}>24 kHz</option>
                <option value={32000}>32 kHz</option>
              </select>
              <select
                value={syncDelay}
                onChange={(e) => { setSyncDelay(Number(e.target.value)); nextTimeRef.current = 0; }}
                title="Delay the audio so it lines up with the transcript. Raise it if the voice runs ahead of the text."
                className="rounded-lg text-xs px-2 py-1.5 outline-none"
                style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text }}
              >
                <option value={0}>Live</option>
                <option value={0.5}>Sync +0.5s</option>
                <option value={1}>Sync +1s</option>
                <option value={1.5}>Sync +1.5s</option>
                <option value={2}>Sync +2s</option>
                <option value={2.5}>Sync +2.5s</option>
              </select>
              {!listening ? (
                <button onClick={startListen} disabled={callState !== 'live'}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                        style={{ backgroundColor: accent, color: accentText }}>
                  <Headphones className="h-4 w-4" /> Listen
                </button>
              ) : (
                <button onClick={stopListen}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ backgroundColor: t.surfaceStrong, color: t.text }}>
                  <VolumeX className="h-4 w-4" /> Stop
                </button>
              )}
            </div>
          )}
          <StatusPill state={callState} label={statusLabel} t={t} />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 min-h-0">
        {/* Transcript */}
        <section className="flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r" style={{ borderColor: t.border }}>
          <div className="px-4 sm:px-6 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${t.borderSubtle}` }}>
            <Radio className="h-4 w-4" style={{ color: accent }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>Live transcript</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
            {lines.length === 0 && !partial && !bridged && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <CircleDot className="h-8 w-8 mb-3" style={{ color: t.textFaint }} />
                <p className="text-sm" style={{ color: t.textMuted }}>
                  {isDemo ? 'Press Start call and talk to the AI. Everything it hears, says, and does shows up here live.'
                          : 'Waiting for the next call. When one comes in, it will appear here in real time.'}
                </p>
              </div>
            )}
            {lines.map((l) => <Bubble key={l.id} role={l.role} text={l.text} t={t} accent={accent} accentText={accentText} />)}
            {partial && <Bubble role={partial.role} text={partial.text} t={t} accent={accent} accentText={accentText} faded />}
            {bridged && (
              <div className="rounded-lg px-3 py-2.5 text-xs leading-relaxed" style={{ backgroundColor: t.borderSubtle, color: t.textMuted }}>
                <span style={{ color: t.text, fontWeight: 600 }}>{bridged}.</span>{' '}
                The caller is now speaking with a team member. The live AI transcript pauses during the human conversation; a recorded recap is saved to this call once it ends.
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </section>

        {/* Activity rail */}
        <aside className="flex flex-col min-h-0">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${t.borderSubtle}` }}>
            <Sparkles className="h-4 w-4" style={{ color: accent }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>What the AI is doing</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2">
            {activities.length === 0 && (
              <p className="text-sm" style={{ color: t.textMuted }}>Calendar checks, bookings, texts, and transfers appear here as they happen.</p>
            )}
            {activities.map((a, i) => {
              const meta = toolMeta(a.tool, a.label);
              const isLast = i === activities.length - 1;
              return (
                <div key={a.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                     style={{ backgroundColor: isLast && live ? t.surfaceStrong : t.surface, border: `1px solid ${t.borderSubtle}` }}>
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}22` }}>
                    <meta.Icon className="h-4 w-4" style={{ color: accent }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{a.label}</p>
                    {a.detail && <p className="text-xs mt-0.5 truncate" style={{ color: t.textMuted }}>{a.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Takeover (monitor mode only) */}
          {mode === 'monitor' && (
            <div className="px-4 sm:px-6 py-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <button onClick={() => setTakeoverOpen((v) => !v)}
                      className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide py-1"
                      style={{ color: t.textMuted }}>
                Take over the call
                <ChevronRight className={`h-4 w-4 transition-transform ${takeoverOpen ? 'rotate-90' : ''}`} />
              </button>
              {takeoverOpen && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={sayText} onChange={(e) => setSayText(e.target.value)}
                           placeholder="Make the AI say..." className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                           style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text }} />
                    <button disabled={controlBusy || !sayText.trim()} onClick={() => sendControl('say', { text: sayText })}
                            className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40" style={{ backgroundColor: accent, color: accentText }}>
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input value={transferNumber} onChange={(e) => setTransferNumber(e.target.value)}
                           placeholder="Transfer to +1..." className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                           style={{ backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text }} />
                    <button disabled={controlBusy || !transferNumber.trim()} onClick={() => sendControl('transfer', { number: transferNumber })}
                            className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>
                      <PhoneForwarded className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={controlBusy} onClick={() => sendControl('mute')} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>Mute AI</button>
                    <button disabled={controlBusy} onClick={() => sendControl('unmute')} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>Unmute</button>
                    <button disabled={controlBusy} onClick={() => sendControl('end')} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: 'rgba(239,68,68,0.85)' }}>End</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Footer controls */}
      <footer className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3" style={{ borderTop: `1px solid ${t.border}` }}>
        <div className="min-h-[1.25rem] text-xs truncate" style={{ color: listenErr ? t.err : t.textMuted }}>
          {listenErr || controlNote || (listening ? (listenInfo ? `Listening to the live call (${listenInfo})` : 'Listening to the live call...') : speaking === 'assistant' ? 'AI is speaking...' : live ? 'Call in progress' : '')}
        </div>
        {isDemo ? (
          <div className="flex items-center gap-2">
            {callState !== 'live' && callState !== 'connecting' ? (
              <button onClick={startDemo}
                      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ backgroundColor: accent, color: accentText }}>
                <Phone className="h-4 w-4" /> {callState === 'ended' ? 'Call again' : 'Start call'}
              </button>
            ) : (
              <>
                <button onClick={toggleMuteDemo} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={endDemo} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}>
                  {callState === 'connecting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />} End
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs" style={{ color: t.textMuted }}>
            <Building2 className="h-4 w-4" /> Monitoring live calls
          </div>
        )}
      </footer>
    </div>
  );
}

function StatusPill({ state, label, t }: { state: CallState; label: string; t: Theme }) {
  const live = state === 'live';
  const connecting = state === 'connecting';
  const color = live ? '#22c55e' : connecting ? '#f59e0b' : state === 'ended' ? '#ef4444' : '#9ca3af';
  return (
    <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: t.pillBg, border: `1px solid ${t.border}` }}>
      <span className="relative flex h-2.5 w-2.5">
        {live && <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ backgroundColor: color }} />}
        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
      </span>
      <span className="text-xs font-medium" style={{ color: t.text }}>{label}</span>
    </div>
  );
}

function Bubble({ role, text, t, accent, accentText, faded }: { role: 'caller' | 'assistant'; text: string; t: Theme; accent: string; accentText: string; faded?: boolean }) {
  const isAI = role === 'assistant';
  const labelColor = isAI
    ? t.textFaint
    : (accentText === '#ffffff' ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.6)');
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${faded ? 'opacity-60' : ''}`}
           style={{
             backgroundColor: isAI ? t.aiBubbleBg : accent,
             color: isAI ? t.aiBubbleText : accentText,
             borderBottomLeftRadius: isAI ? 4 : 16,
             borderBottomRightRadius: isAI ? 16 : 4,
           }}>
        <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: labelColor }}>
          {isAI ? 'AI' : 'Caller'}
        </p>
        {text}
      </div>
    </div>
  );
}