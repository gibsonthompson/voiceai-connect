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
  BookOpen, PhoneForwarded, MessageSquare, Sparkles, Building2,
  CircleDot, Headphones, VolumeX, UserPlus, Undo2,
  UserCheck, ShieldAlert,
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
  // Browser human-barge ("jump in and talk") is only offered on own-the-call
  // numbers, where the backend owns the caller leg and can bridge the browser in.
  barge_supported?: boolean;
}

interface Line { id: string; role: 'caller' | 'assistant'; text: string; }
interface Activity { id: string; tool: string; label: string; detail: string | null; ts: number; }

type Theme = ReturnType<typeof palette>;

// Smoothly reveal streamed transcript text so it FLOWS WITH the spoken audio,
// without adding latency. VAPI sends partials in multi-word bursts, so replacing
// the whole string makes text snap in jerky chunks. We reveal characters on a
// rAF loop at a natural pace, tracked as a FRACTIONAL position so sub-one-char-
// per-frame rates are honored (advancing by a whole char every frame would force
// ~60 chars/sec and race far ahead of the voice). The rate has a natural floor
// and only accelerates when it is genuinely behind, so it can never fall behind
// the data (a new burst pulls the target forward) nor run ahead of speech. A
// fresh utterance (not an extension of what is shown) restarts from 0.
//   BASE_CPS   - natural reveal pace in chars/sec. ~20 reads like a person
//                speaking (natural speech is ~15); low enough that text tracks
//                the voice instead of anticipating it.
//   CATCH_UP_S - window to clear a real backlog, so it speeds up only when it
//                has fallen behind (keeps max lag ~1s) rather than racing.
const SMOOTH_BASE_CPS = 20;
const SMOOTH_CATCH_UP_S = 1.0;
function useSmoothReveal(target: string): string {
  const [shown, setShown] = useState('');
  const targetRef = useRef('');
  const posRef = useRef(0); // fractional reveal position (chars)
  const emittedRef = useRef('');
  const lastRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Update the target synchronously on each change; if the new text is not an
  // extension of what we have already shown, restart the reveal from 0.
  const shownNow = shown;
  if (targetRef.current !== target) {
    targetRef.current = target;
    if (!target.startsWith(shownNow)) { posRef.current = 0; emittedRef.current = ''; }
  }

  useEffect(() => {
    const tick = (now: number) => {
      if (!lastRef.current) lastRef.current = now;
      const dt = Math.min(0.1, (now - lastRef.current) / 1000);
      lastRef.current = now;
      const tgt = targetRef.current;
      let pos = posRef.current;
      if (pos > tgt.length) pos = tgt.length; // target shrank/reset: snap down
      if (pos < tgt.length) {
        const remaining = tgt.length - pos;
        const rate = Math.max(SMOOTH_BASE_CPS, remaining / SMOOTH_CATCH_UP_S);
        pos = Math.min(tgt.length, pos + rate * dt); // fractional: no forced min
      }
      posRef.current = pos;
      // Re-render only when the revealed text actually changes. Compare against
      // the ref (stable), never a captured `shown` (this effect runs once).
      const next = tgt.slice(0, Math.floor(pos));
      if (next !== emittedRef.current) {
        emittedRef.current = next;
        setShown(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastRef.current = 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return shown;
}

// Canonical tool -> friendly label + icon. Keeps the demo (client-side events)
// and the monitor (server events) showing the same language.
const TOOL_META: Record<string, { label: string; Icon: any }> = {
  check_availability: { label: 'Checking the calendar', Icon: Calendar },
  book_appointment: { label: 'Booking the appointment', Icon: CalendarCheck },
  search_knowledge_base: { label: 'Searching the knowledge base', Icon: BookOpen },
  request_human_transfer: { label: 'Connecting to the team', Icon: PhoneForwarded },
  transferCall: { label: 'Transferring the call', Icon: PhoneForwarded },
  send_sms: { label: 'Texting the caller', Icon: MessageSquare },
  barge_connected: { label: 'A teammate joined the call', Icon: UserPlus },
  barge_ended: { label: 'Teammate left the call', Icon: Undo2 },
  barge_dialing: { label: 'A teammate is listening in', Icon: Headphones },
  barge_returned: { label: 'Handed the call back to the AI', Icon: Undo2 },
  caller_recognized: { label: 'Recognized returning caller', Icon: UserCheck },
  spam_flagged: { label: 'Flagged as spam', Icon: ShieldAlert },
};
// The server's broadcast label is authoritative when present (it carries the
// real detail, e.g. WHO took over or WHICH link was texted); TOOL_META only
// supplies the icon and a fallback label for client-side (demo) events that
// pass no label.
function toolMeta(tool: string, fallbackLabel?: string) {
  const m = TOOL_META[tool];
  return { label: fallbackLabel || (m && m.label) || 'Working on it', Icon: (m && m.Icon) || Sparkles };
}

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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

export default function LiveCallMonitor({ clientId, mode, autoJoin = false, backHref = '' }: { clientId: string; mode: Mode; autoJoin?: boolean; backHref?: string }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [callState, setCallState] = useState<CallState>('idle');
  const [statusLabel, setStatusLabel] = useState<string>(mode === 'monitor' ? 'Waiting for a call' : 'Ready');
  // True ONLY while a human has actually taken over the call. Set from status
  // events (true on agent_connected, false on every other status) so the pill
  // can never claim someone is on the call when no one is.
  const [humanOnCall, setHumanOnCall] = useState(false);
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
  // Live delivery readout: which transport delivered the most recent transcript
  // line first (ws / sse / supabase) and how long it took from the backend
  // stamping it to arriving here. Proves the WebSocket fast path is actually
  // winning in production instead of silently falling back to buffered SSE.
  const [feedStat, setFeedStat] = useState<{ via: string; ms: number } | null>(null);
  // Smoothly revealed version of the in-progress partial, so live words stream
  // in instead of snapping in word-bursts. No added latency: it catches up to
  // whatever VAPI last sent (see useSmoothReveal).
  const smoothPartial = useSmoothReveal(partial?.text || '');

  // Note shown in the footer for demo-mode call errors (the old VAPI-channel
  // "take over" panel was removed; the conference barge flow is the one path).
  const [controlNote, setControlNote] = useState<string | null>(null);

  // ---- Live monitor seat (listen + jump-in), conference over WebRTC --------
  // The supervisor is seated on the real call as a WebRTC participant: muted =
  // listening (real-time audio, no sync knob), unmuted = talking to the caller.
  //   arming      = getting mic + token
  //   connecting  = backend seating us in the conference
  //   listening   = on the call, muted (hearing it live)
  //   barged      = talking to the caller (AI dropped)
  //   leaving     = handing back / ending
  const [bargeState, setBargeState] = useState<'idle' | 'arming' | 'connecting' | 'listening' | 'barged' | 'leaving'>('idle');
  const [bargeErr, setBargeErr] = useState<string | null>(null);
  // Agent onward-transfer: hand the live caller to the owner / staff / a number.
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTargets, setTransferTargets] = useState<{ owner: { label: string; number: string } | null; staff: { id: string; label: string; number: string }[] }>({ owner: null, staff: [] });
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferErr, setTransferErr] = useState<string | null>(null);
  const [transferCustom, setTransferCustom] = useState('');
  const [transferNote, setTransferNote] = useState('');
  // Consult (warm) transfer: when the business has it enabled, the agent speaks
  // privately with the recipient first (caller on hold), then connects or cancels.
  const [consultMode, setConsultMode] = useState(false);
  const [consultState, setConsultState] = useState<'idle' | 'briefing'>('idle');
  const [consultRecipient, setConsultRecipient] = useState('');
  const [consultBusy, setConsultBusy] = useState(false);
  const [consultErr, setConsultErr] = useState<string | null>(null);
  const [agentMuted, setAgentMuted] = useState(false);
  const telnyxRtcRef = useRef<any>(null);
  const telnyxCallRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const bargeStateRef = useRef<typeof bargeState>('idle');
  useEffect(() => { bargeStateRef.current = bargeState; }, [bargeState]);
  // One-shot guards for the escalation "take the call" auto-join (seat + jump in).
  const autoJoinStartedRef = useRef(false);
  const autoJoinJumpedRef = useRef(false);
  // Answer each inbound seat dial at most once, and never let the Telnyx
  // notification handler run re-entrantly. The SDK dispatches state changes
  // synchronously; without these guards a conference change could re-enter the
  // handler and recurse ("Maximum call stack size exceeded"), crashing the page.
  const bargeAnsweredRef = useRef<string | null>(null);
  const notifyBusyRef = useRef(false);

  const [prefersDark] = useState<boolean>(() => readPrefersDark());
  const t = useMemo(() => palette(prefersDark), [prefersDark]);

  const vapiRef = useRef<any>(null);
  const esRef = useRef<EventSource | null>(null);
  const callIdRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  // Sticky-to-bottom: true while the viewer is parked at the latest line. Set
  // from the viewer's own scrolling; a programmatic scroll-to-bottom keeps it
  // true, scrolling up turns it off so the feed never yanks them back down.
  const stickToBottomRef = useRef(true);
  const scrollQueuedRef = useRef(false);

  const token = useMemo(() => {
    try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
  }, []);
  // The logged-in user's display name, sent with listen-start so the monitor
  // attributes the listen / jump-in / hand-back events to this person (not an
  // anonymous "teammate") for everyone watching the call.
  const agentName = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return (u.name || u.full_name || u.firstName || u.email || '').toString().trim() || null;
    } catch { return null; }
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

  // Warm the Telnyx WebRTC SDK chunk as soon as we know this is a barge-capable
  // call, so pressing "Listen in" does not also wait for that JS to download.
  // Shaves the first-click delay; the dial/negotiation itself is unaffected.
  useEffect(() => {
    if (mode === 'monitor' && info?.barge_supported) {
      import('@telnyx/webrtc').catch(() => { /* best effort; startListen imports again */ });
    }
  }, [mode, info?.barge_supported]);

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

  // Tear down the browser WebRTC leg + mic. Safe to call repeatedly.
  const cleanupBarge = useCallback(() => {
    try { telnyxCallRef.current?.hangup(); } catch {}
    try { telnyxRtcRef.current?.disconnect(); } catch {}
    try { localStreamRef.current?.getTracks().forEach((tr) => tr.stop()); } catch {}
    telnyxCallRef.current = null; telnyxRtcRef.current = null; localStreamRef.current = null;
    bargeAnsweredRef.current = null; notifyBusyRef.current = false;
    setAgentMuted(false);
  }, []);

  useEffect(() => {
    // Keep the transcript pinned to the newest line WITHOUT touching the page.
    // We scroll the transcript container itself (not scrollIntoView, which
    // bubbles up and jerks the whole frame down on every partial), and only when
    // the viewer is already at the bottom, so reading back is never yanked.
    // Throttled to one scroll per frame so rapid partial updates don't thrash.
    if (!stickToBottomRef.current) return;
    if (scrollQueuedRef.current) return;
    scrollQueuedRef.current = true;
    requestAnimationFrame(() => {
      scrollQueuedRef.current = false;
      const el = transcriptScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [lines, partial]);

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
  const applyServerEvent = useCallback((ev: any, via: string = 'sse') => {
    if (!ev || !ev.type) return;
    // The same event can arrive on all three transports (WS / SSE / Supabase);
    // de-duplicate by its stamped id so it renders once. Whichever transport
    // delivers an id FIRST wins here, so recording the winner + latency at this
    // point measures the real path the viewer is actually getting.
    if (ev.id) {
      if (seenIdsRef.current.has(ev.id)) return;
      seenIdsRef.current.add(ev.id);
      if (seenIdsRef.current.size > 1000) seenIdsRef.current.clear();
    }
    if (ev.callId) callIdRef.current = ev.callId;
    if (ev.type === 'transcript' && typeof ev.ts === 'number') {
      const ms = Date.now() - ev.ts;
      if (ms >= 0 && ms < 120000) setFeedStat({ via, ms });
    }
    if (ev.type === 'transcript') {
      if (ev.final) { setPartial(null); addLine(ev.role === 'caller' ? 'caller' : 'assistant', ev.text || ''); }
      else setPartial({ role: ev.role === 'caller' ? 'caller' : 'assistant', text: ev.text || '' });
    } else if (ev.type === 'activity') {
      addActivity(ev.tool || 'tool', ev.detail, ev.label);
    } else if (ev.type === 'status') {
      const s = String(ev.status || '').toLowerCase();
      const lbl = ev.label ? String(ev.label) : null;
      if (s === 'in-progress') { setCallState('live'); setStatusLabel(lbl || 'Live'); setBridged(null); setHumanOnCall(false); }
      else if (s === 'ringing' || s === 'queued') { setCallState('connecting'); setStatusLabel(lbl || 'Ringing'); setHumanOnCall(false); }
      else if (s === 'forwarding') { setStatusLabel('Transferring'); addActivity('transferCall'); setHumanOnCall(false); }
      // Own-the-call warm transfer lifecycle (telnyx_cc): dialing the team, then
      // connected (bridged) to a person. Stay "live" throughout; the pill label
      // tells the viewer where the call is.
      else if (s === 'dialing_team' || s === 'transferring') { setCallState('live'); setStatusLabel(lbl || 'Transferring to the team'); setHumanOnCall(false); }
      else if (s === 'bridged') { setCallState('live'); setStatusLabel(lbl || 'Connected to the team'); setBridged(lbl || 'Connected to the team'); setPartial(null); setHumanOnCall(false); }
      // Browser human-barge: a teammate joined and is talking to the caller. Stay
      // "live"; the pill tells every viewer a person is on. The viewer who
      // actually jumped in gets their own live state from the WebRTC leg.
      else if (s === 'agent_connected') { setCallState('live'); setStatusLabel(lbl || 'A teammate is on the call'); setBridged(null); setPartial(null); setHumanOnCall(true); }
      else if (s === 'ended') { setCallState('ended'); setStatusLabel('Call ended'); setSpeaking(null); setPartial(null); setBridged(null); setHumanOnCall(false); if (bargeStateRef.current !== 'idle') { cleanupBarge(); setBargeState('idle'); } }
    } else if (ev.type === 'takeover') {
      if (ev.action === 'jump_in') addActivity('barge_connected', null, 'A teammate joined the call');
      else if (ev.action === 'jump_out') addActivity('barge_ended', null, ev.mode === 'end_call' ? 'Teammate ended the call' : 'Teammate handed back to the AI');
      else addActivity('request_human_transfer', ev.text || null, `You stepped in (${ev.action})`);
    }
  }, [addLine, addActivity, cleanupBarge]);

  useEffect(() => {
    if (mode !== 'monitor' || !info) return;
    resetFeed();
    const url = `${API}/api/client/${clientId}/live/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;
    es.addEventListener('hello', () => setStatusLabel('Waiting for a call'));
    es.addEventListener('event', (e: MessageEvent) => {
      try { applyServerEvent(JSON.parse(e.data), 'sse'); } catch { /* ignore */ }
    });
    es.onerror = () => { /* EventSource auto-reconnects; keep quiet */ };
    return () => { es.close(); esRef.current = null; };
  }, [mode, info, clientId, token, applyServerEvent, resetFeed]);

  // Direct WebSocket events stream: the fast path. DigitalOcean's proxy buffers
  // the SSE stream above, so transcript lines arrive late; a WebSocket upgrade is
  // passed through frame by frame, so the same events land in real time. The
  // browser de-dupes by id, so whichever path arrives first wins (this one), and
  // SSE + Supabase stay as fallbacks if the socket drops.
  useEffect(() => {
    if (mode !== 'monitor' || !info) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: any = null;
    const open = () => {
      if (closed) return;
      try {
        const wsBase = API.replace(/^http/, 'ws');
        ws = new WebSocket(`${wsBase}/api/live/events?client=${encodeURIComponent(clientId)}&token=${encodeURIComponent(token)}`);
        ws.onmessage = (e: MessageEvent) => {
          try {
            const ev = JSON.parse(e.data);
            if (ev && ev.type === 'hello') return;
            applyServerEvent(ev, 'ws');
          } catch { /* ignore */ }
        };
        ws.onclose = () => { if (!closed) { retry = setTimeout(open, 2000); } };
        ws.onerror = () => { try { ws?.close(); } catch {} };
      } catch { retry = setTimeout(open, 2000); }
    };
    open();
    return () => { closed = true; if (retry) clearTimeout(retry); try { ws?.close(); } catch {} };
  }, [mode, info, clientId, token, applyServerEvent]);

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
        try { applyServerEvent(msg?.payload, 'supabase'); } catch { /* ignore */ }
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

  // ---- take a seat on the live call (listen), over WebRTC -------------------
  const startListen = useCallback(async () => {
    const callId = callIdRef.current;
    if (!callId) { setBargeErr('No live call to join yet.'); return; }
    setBargeErr(null);
    setBargeState('arming');

    // 1) Mic permission first, so we fail fast with a clear message rather than
    //    half-joining a call with no audio.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setBargeState('idle');
      setBargeErr('Allow microphone access to join the call.');
      return;
    }
    localStreamRef.current = stream;

    try {
      // 2) Mint a short-lived WebRTC token for this call.
      const tokRes = await fetch(`${API}/api/client/${clientId}/live/webrtc-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callId }),
      });
      const tok = await tokRes.json();
      if (!tokRes.ok || !tok.success) throw new Error(tok.error || 'Could not set up browser audio.');

      // 3) Register as a Telnyx WebRTC endpoint.
      const mod: any = await import('@telnyx/webrtc');
      const TelnyxRTC = mod.TelnyxRTC;
      const rtc = new TelnyxRTC({ login_token: tok.login_token });
      telnyxRtcRef.current = rtc;
      // Play the caller's audio through the hidden <audio> element.
      try { rtc.remoteElement = 'barge-remote-audio'; } catch {}
      try { rtc.enableMicrophone?.(); } catch {}

      rtc.on('telnyx.ready', async () => {
        // 4) Ask the backend to seat us in the call's conference as a muted
        //    monitor (listen). It promotes the call to a conference and dials
        //    this browser in. We stay muted until the agent chooses to jump in.
        try {
          const lsRes = await fetch(`${API}/api/client/${clientId}/live/listen-start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ callId, agentName }),
          });
          const ls = await lsRes.json();
          if (!lsRes.ok || !ls.success) throw new Error(ls.error || 'Could not open live audio.');
          setBargeState('connecting');
        } catch (e: any) {
          setBargeErr(e?.message || 'Could not open live audio.');
          cleanupBarge();
          setBargeState('idle');
        }
      });

      rtc.on('telnyx.notification', (n: any) => {
        // Re-entrancy guard: if a notification arrives while we are still
        // handling one (the SDK dispatches synchronously), skip it instead of
        // recursing. We always act on the latest state via telnyxCallRef.
        if (notifyBusyRef.current) return;
        notifyBusyRef.current = true;
        try {
          const call = n?.call;
          if (!call) return;
          telnyxCallRef.current = call;
          const st = call.state;
          if (st === 'ringing') {
            // Inbound dial from our backend: answer it ONCE to take the seat.
            if (bargeAnsweredRef.current !== call.id) {
              bargeAnsweredRef.current = call.id;
              try { call.answer(); } catch {}
            }
          } else if (st === 'active') {
            try {
              const el: any = document.getElementById('barge-remote-audio');
              if (el && call.remoteStream && el.srcObject !== call.remoteStream) {
                el.srcObject = call.remoteStream; el.play?.().catch(() => {});
              }
            } catch {}
            // Seated: hearing the call live. Stay in 'barged' if we already
            // escalated (the audio leg is shared across listen and talk).
            setBargeState((s) => (s === 'barged' ? 'barged' : 'listening'));
          } else if (st === 'hangup' || st === 'destroy') {
            if (bargeStateRef.current !== 'idle' && bargeStateRef.current !== 'leaving') {
              cleanupBarge();
              setBargeState('idle');
            }
          }
        } catch { /* a bad notification must never crash the monitor */ }
        finally { notifyBusyRef.current = false; }
      });

      rtc.on('telnyx.error', () => { setBargeErr('Browser audio error. Try again.'); });
      rtc.connect();
    } catch (e: any) {
      setBargeErr(e?.message || 'Could not join the call.');
      cleanupBarge();
      setBargeState('idle');
    }
  }, [clientId, token, cleanupBarge, agentName]);

  // Jump in: flip the seat from listening to talking (the backend drops the AI
  // and unmutes us in the conference). The WebRTC leg stays up throughout.
  const jumpIn = useCallback(async () => {
    const callId = callIdRef.current;
    if (!callId) return;
    try {
      const r = await fetch(`${API}/api/client/${clientId}/live/jump-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callId }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Could not jump in.');
      setBargeState('barged');
      setAgentMuted(false);
    } catch (e: any) {
      setBargeErr(e?.message || 'Could not jump in.');
    }
  }, [clientId, token]);

  // ---- escalation auto-join -------------------------------------------------
  // When the agent arrived here from an escalation screen-pop (autoJoin), seat
  // them the moment the live call is up, then jump them in the moment the seat
  // is listening. Each step fires once, and only from a clean idle seat with no
  // human already on the call, so it never fights a manual takeover.
  useEffect(() => {
    if (!autoJoin || mode !== 'monitor' || !info?.barge_supported) return;
    if (autoJoinStartedRef.current) return;
    if (callState !== 'live' || humanOnCall) return;
    if (bargeStateRef.current !== 'idle') return;
    autoJoinStartedRef.current = true;
    startListen();
  }, [autoJoin, mode, info?.barge_supported, callState, humanOnCall, startListen]);

  useEffect(() => {
    if (!autoJoin || autoJoinJumpedRef.current) return;
    if (bargeState !== 'listening') return;
    autoJoinJumpedRef.current = true;
    jumpIn();
  }, [autoJoin, bargeState, jumpIn]);

  // Hand the caller back to the AI but STAY seated, listening.
  const handBack = useCallback(async () => {
    const callId = callIdRef.current;
    try {
      await fetch(`${API}/api/client/${clientId}/live/jump-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callId, mode: 'return_ai' }),
      });
    } catch {}
    setBargeState('listening');
  }, [clientId, token]);

  // End the call outright (hangs up the caller), then drop our seat.
  const endCall = useCallback(async () => {
    const callId = callIdRef.current;
    setBargeState('leaving');
    try {
      await fetch(`${API}/api/client/${clientId}/live/jump-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callId, mode: 'end_call' }),
      });
    } catch {}
    cleanupBarge();
    setBargeState('idle');
  }, [clientId, token, cleanupBarge]);

  // Stop listening: leave the seat. The call continues with the AI.
  const stopListen = useCallback(async () => {
    const callId = callIdRef.current;
    setBargeState('leaving');
    try {
      await fetch(`${API}/api/client/${clientId}/live/listen-stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callId }),
      });
    } catch {}
    cleanupBarge();
    setBargeState('idle');
  }, [clientId, token, cleanupBarge]);

  // Open the transfer picker and load who this caller can be handed to.
  const openTransfer = useCallback(async () => {
    setTransferErr(null); setTransferCustom(''); setTransferNote(''); setTransferOpen(true);
    try {
      const r = await fetch(`${API}/api/client/${clientId}/live/transfer-targets`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) { setTransferTargets({ owner: d.owner || null, staff: Array.isArray(d.staff) ? d.staff : [] }); setConsultMode(d.consultMode === true); }
    } catch { /* picker still allows a custom number */ }
  }, [clientId, token]);

  // Hand the caller onward. The backend puts the caller on hold, dials the
  // destination with a whisper, and drops our leg, so the WebRTC call ends.
  const doTransfer = useCallback(async (body: any) => {
    const callId = callIdRef.current;
    if (!callId) { setTransferErr('No live call.'); return; }
    setTransferBusy(true); setTransferErr(null);
    try {
      const r = await fetch(`${API}/api/client/${clientId}/live/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callId, note: transferNote || undefined, ...body }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) {
        setTransferOpen(false);
        setBargeState('leaving');
        cleanupBarge();
        setBargeState('idle');
      } else { setTransferErr(d.error || 'Could not start the transfer.'); }
    } catch { setTransferErr('Could not start the transfer.'); } finally { setTransferBusy(false); }
  }, [clientId, token, transferNote, cleanupBarge]);

  // Consult transfer: start the private brief. The backend puts the caller on
  // hold and dials the recipient into our conference, so our WebRTC leg stays
  // live (we're now talking to the recipient). The caller waits until we connect.
  const startConsult = useCallback(async (body: any, label: string) => {
    const callId = callIdRef.current;
    if (!callId) { setTransferErr('No live call.'); return; }
    setTransferBusy(true); setTransferErr(null);
    try {
      const r = await fetch(`${API}/api/client/${clientId}/live/consult/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callId, recipientName: label, note: transferNote || undefined, ...body }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) {
        setTransferOpen(false);
        setConsultErr(null);
        setConsultRecipient(label);
        setConsultState('briefing');
      } else { setTransferErr(d.error || 'Could not start the briefing.'); }
    } catch { setTransferErr('Could not start the briefing.'); } finally { setTransferBusy(false); }
  }, [clientId, token, transferNote]);

  // From the picker: a consult-enabled business briefs first; otherwise the
  // classic whisper transfer connects straight through.
  const pickTarget = useCallback((body: any, label: string) => {
    if (consultMode) return startConsult(body, label);
    return doTransfer(body);
  }, [consultMode, startConsult, doTransfer]);

  // Finish the consult: connect the caller to the recipient and drop our leg.
  const finishConsult = useCallback(async () => {
    const callId = callIdRef.current;
    setConsultBusy(true); setConsultErr(null);
    try {
      const r = await fetch(`${API}/api/client/${clientId}/live/consult/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callId }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) {
        setConsultState('idle'); setConsultRecipient('');
        setBargeState('leaving'); cleanupBarge(); setBargeState('idle');
      } else { setConsultErr(d.error || 'Could not complete the transfer.'); }
    } catch { setConsultErr('Could not complete the transfer.'); } finally { setConsultBusy(false); }
  }, [clientId, token, cleanupBarge]);

  // Abort the consult: drop the recipient and come back to the caller.
  const abortConsult = useCallback(async () => {
    const callId = callIdRef.current;
    setConsultBusy(true); setConsultErr(null);
    try {
      const r = await fetch(`${API}/api/client/${clientId}/live/consult/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ callId }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) { setConsultState('idle'); setConsultRecipient(''); }
      else { setConsultErr(d.error || 'Could not cancel the briefing.'); }
    } catch { setConsultErr('Could not cancel the briefing.'); } finally { setConsultBusy(false); }
  }, [clientId, token]);

  // Mute / unmute the supervisor's own microphone (only meaningful while barged).
  const toggleAgentMute = useCallback(() => {
    const call = telnyxCallRef.current;
    if (!call) return;
    try {
      if (agentMuted) { call.unmuteAudio(); setAgentMuted(false); }
      else { call.muteAudio(); setAgentMuted(true); }
    } catch {}
  }, [agentMuted]);

  // Clean up the seat if the component unmounts mid-call.
  useEffect(() => () => { cleanupBarge(); }, [cleanupBarge]);

  // Watchdog: if we ask to join but never go live (e.g. the backend dial is
  // refused, or the browser is never rung), don't sit on "Joining..." forever.
  // Reset after a grace period so the agent can try again.
  useEffect(() => {
    if (bargeState !== 'arming' && bargeState !== 'connecting') return;
    const timer = setTimeout(() => {
      if (bargeStateRef.current === 'arming' || bargeStateRef.current === 'connecting') {
        cleanupBarge();
        setBargeErr('Could not connect you to the call. Please try again.');
        setBargeState('idle');
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, [bargeState, cleanupBarge]);

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
  // Final guarantee: never show an "on the call" status unless a human really is
  // on. If a reset event were ever missed, fall back to a truthful label.
  const pillLabel = (!humanOnCall && /on the call/i.test(statusLabel))
    ? (callState === 'live' ? 'AI on the call' : statusLabel)
    : statusLabel;

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col" style={{ backgroundColor: t.bg, color: t.text }}>
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
          <StatusPill state={callState} label={pillLabel} t={t} />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 min-h-0">
        {/* Transcript */}
        <section className="flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r" style={{ borderColor: t.border }}>
          <div className="px-4 sm:px-6 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${t.borderSubtle}` }}>
            <Radio className="h-4 w-4" style={{ color: accent }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>Live transcript</span>
            {feedStat && (
              <span
                className="ml-auto text-[10px] font-semibold uppercase tracking-wider tabular-nums"
                title="Transport that delivered the latest line first, and its delay from the server. ws = real-time WebSocket; sse means the fast path isn't winning."
                style={{ color: feedStat.via === 'ws' && feedStat.ms < 800 ? '#16a34a' : t.textFaint }}
              >
                {feedStat.via} · {feedStat.ms}ms
              </span>
            )}
          </div>
          <div
            ref={transcriptScrollRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3"
          >
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
            {bridged && (
              <div className="rounded-lg px-3 py-2.5 text-xs leading-relaxed" style={{ backgroundColor: t.borderSubtle, color: t.textMuted }}>
                <span style={{ color: t.text, fontWeight: 600 }}>{bridged}.</span>{' '}
                The caller is now speaking with a team member. The live AI transcript pauses during the human conversation; a recorded recap is saved to this call once it ends.
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Live caption strip: pinned at the bottom of the transcript pane so
              the words being spoken RIGHT NOW are always on screen without
              scrolling. Finalized lines flow into the history above; this shows
              the in-progress partial live, which reads as real-time instead of
              waiting for a chat bubble to pop in. */}
          {(callState === 'live' || partial) && !bridged && (
            <div
              className="flex-none border-t px-4 sm:px-6 py-3 flex items-start"
              style={{ borderColor: t.borderSubtle, backgroundColor: 'rgba(127,127,127,0.06)', minHeight: '3.75rem' }}
            >
              {partial ? (
                <div className="flex items-start gap-2.5 w-full">
                  <span
                    className="mt-1.5 h-2 w-2 rounded-full flex-none animate-pulse"
                    style={{ backgroundColor: partial.role === 'caller' ? '#22c55e' : accent }}
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textFaint }}>
                      {partial.role === 'caller' ? 'Caller' : 'AI'} speaking
                    </span>
                    <p className="text-sm leading-snug" style={{ color: t.text }}>
                      {smoothPartial}
                      <span
                        className="inline-block w-[2px] h-[0.95em] align-text-bottom ml-0.5 rounded-sm"
                        style={{
                          backgroundColor: partial.role === 'caller' ? '#22c55e' : accent,
                          // Solid while still catching up to the latest words, dim once caught up.
                          opacity: smoothPartial.length < partial.text.length ? 0.9 : 0.3,
                        }}
                      />
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full flex-none animate-pulse" style={{ backgroundColor: accent }} />
                  <span className="text-xs" style={{ color: t.textFaint }}>Live. Words appear here the moment they are spoken.</span>
                </div>
              )}
            </div>
          )}
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

        </aside>
      </div>

      {/* Hidden sink for the caller's audio while an agent is barged in. */}
      <audio id="barge-remote-audio" autoPlay playsInline style={{ display: 'none' }} />

      {/* Footer controls */}
      <footer className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3" style={{ borderTop: `1px solid ${t.border}` }}>
        <div className="min-h-[1.25rem] text-xs truncate" style={{ color: bargeErr ? t.err : t.textMuted }}>
          {bargeErr || controlNote
            || (bargeState === 'barged' ? 'You are on the call, talking to the caller'
              : bargeState === 'listening' ? 'Listening live to the call'
              : bargeState === 'connecting' ? 'Connecting your audio...'
              : bargeState === 'arming' ? 'Preparing your audio...'
              : speaking === 'assistant' ? 'AI is speaking...'
              : live ? 'Call in progress' : '')}
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
        ) : info.barge_supported ? (
          <div className="flex items-center gap-2">
            {bargeState === 'idle' ? (
              <button
                onClick={startListen}
                disabled={callState !== 'live' || !!bridged}
                title={bridged ? 'The caller is already with a team member' : callState !== 'live' ? 'Available during a live call' : 'Listen in on this call'}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: accent, color: accentText }}>
                <Headphones className="h-4 w-4" /> Listen in
              </button>
            ) : bargeState === 'arming' || bargeState === 'connecting' ? (
              <button disabled className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold opacity-80" style={{ backgroundColor: accent, color: accentText }}>
                <Loader2 className="h-4 w-4 animate-spin" /> {bargeState === 'arming' ? 'Preparing...' : 'Connecting...'}
              </button>
            ) : bargeState === 'listening' ? (
              <>
                <button onClick={jumpIn} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ backgroundColor: accent, color: accentText }}>
                  <UserPlus className="h-4 w-4" /> Jump in and talk
                </button>
                <button onClick={stopListen} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>
                  <VolumeX className="h-4 w-4" /> Stop listening
                </button>
              </>
            ) : bargeState === 'barged' ? (
              consultState === 'briefing' ? (
                <>
                  <span className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>
                    <Loader2 className="h-4 w-4 animate-spin" /> Briefing {consultRecipient || 'the recipient'}, caller on hold
                  </span>
                  <button disabled={consultBusy} onClick={finishConsult} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'rgba(34,197,94,0.9)' }}>
                    <PhoneForwarded className="h-4 w-4" /> Connect them
                  </button>
                  <button disabled={consultBusy} onClick={abortConsult} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>
                    <Undo2 className="h-4 w-4" /> Cancel, back to caller
                  </button>
                  {consultErr && <span className="text-[12px]" style={{ color: 'rgb(239,68,68)' }}>{consultErr}</span>}
                </>
              ) : (
              <>
                <button onClick={toggleAgentMute} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>
                  {agentMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} {agentMuted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={handBack} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>
                  <Undo2 className="h-4 w-4" /> Hand back to AI
                </button>
                <button onClick={openTransfer} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>
                  <PhoneForwarded className="h-4 w-4" /> Transfer
                </button>
                <button onClick={endCall} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: 'rgba(239,68,68,0.9)' }}>
                  <PhoneOff className="h-4 w-4" /> End call
                </button>
              </>
              )
            ) : (
              <button disabled className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold opacity-80" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>
                <Loader2 className="h-4 w-4 animate-spin" /> Leaving...
              </button>
            )}
          {transferOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => { if (!transferBusy) setTransferOpen(false); }}>
              <div className="w-full max-w-sm rounded-2xl p-5" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }} onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-semibold mb-1" style={{ color: t.text }}>{consultMode ? 'Brief, then connect' : 'Transfer this caller'}</p>
                <p className="text-[12px] mb-3" style={{ color: t.textMuted }}>{consultMode ? 'You will speak with them privately first while the caller waits on hold, then connect the caller or cancel. If no one answers, the AI takes a message.' : 'They hear who is calling and why before they are connected. If no one answers, the AI takes a message.'}</p>
                {transferErr && <p className="text-[12px] mb-2" style={{ color: 'rgb(239,68,68)' }}>{transferErr}</p>}
                <textarea value={transferNote} onChange={(e) => setTransferNote(e.target.value)} rows={2} placeholder="Note for the person you're transferring to (optional)" className="w-full rounded-xl px-3 py-2 text-[13px] mb-3 outline-none resize-none" style={{ backgroundColor: t.surfaceStrong, color: t.text, border: `1px solid ${t.border}` }} />
                <div className="space-y-1.5">
                  {transferTargets.owner && (
                    <button disabled={transferBusy} onClick={() => pickTarget({ target: 'owner' }, transferTargets.owner!.label)} className="w-full text-left rounded-xl px-3 py-2.5 text-[13px] font-medium disabled:opacity-60" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>{transferTargets.owner.label}</button>
                  )}
                  {transferTargets.staff.map((s) => (
                    <button key={s.id} disabled={transferBusy} onClick={() => pickTarget({ target: 'staff', staffId: s.id }, s.label)} className="w-full text-left rounded-xl px-3 py-2.5 text-[13px] font-medium disabled:opacity-60" style={{ backgroundColor: t.surfaceStrong, color: t.text }}>{s.label}</button>
                  ))}
                  {!transferTargets.owner && transferTargets.staff.length === 0 && (
                    <p className="text-[12px] py-1" style={{ color: t.textMuted }}>No saved owner or staff numbers. Use a custom number below.</p>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input value={transferCustom} onChange={(e) => setTransferCustom(e.target.value)} placeholder="Custom number" className="flex-1 rounded-xl px-3 py-2 text-[13px] outline-none" style={{ backgroundColor: t.surfaceStrong, color: t.text, border: `1px solid ${t.border}` }} />
                  <button disabled={transferBusy || !transferCustom.trim()} onClick={() => pickTarget({ target: 'custom', number: transferCustom.trim() }, transferCustom.trim())} className="rounded-xl px-3 py-2 text-[13px] font-semibold disabled:opacity-50" style={{ backgroundColor: t.text, color: t.surface }}>{consultMode ? 'Brief' : 'Call'}</button>
                </div>
                <button disabled={transferBusy} onClick={() => setTransferOpen(false)} className="w-full mt-3 rounded-xl px-3 py-2 text-[13px] font-medium disabled:opacity-60" style={{ color: t.textMuted }}>Cancel</button>
                {transferBusy && <div className="flex items-center justify-center gap-2 mt-2 text-[12px]" style={{ color: t.textMuted }}><Loader2 className="h-3.5 w-3.5 animate-spin" /> {consultMode ? 'Starting briefing...' : 'Transferring...'}</div>}
              </div>
            </div>
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