'use client';

// ============================================================================
// hooks/useAgentPresence.ts
//
// The agent side of call-center escalation. While an agent (or manager) has the
// /cc console open, this hook:
//   1. Heartbeats presence every ~15s, so the escalation router knows they are
//      online and available to take a caller.
//   2. Subscribes to their personal escalation channel over BOTH an SSE stream
//      (same instance) and Supabase Realtime (any instance) - identical to the
//      live monitor - so a screen-pop reaches them the instant the AI escalates,
//      wherever they are in the console.
//   3. Exposes the current open offers plus claim / decline / away controls.
//
// De-duplication: every event is stamped with one id on the server and arrives
// on both paths; we keep a seen-set so an offer never pops twice.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const HEARTBEAT_MS = 15000;

export interface EscalationOffer {
  id: string;
  clientId: string;
  vapiCallId: string | null;
  businessName: string | null;
  callerNumber: string | null;
  reason: string | null;
  summary: string | null;
  collected: Record<string, any> | null;
  createdAt: string | null;
  expiresAt: string | null;
  test?: boolean;
}

export interface ClaimResult {
  won: boolean;
  delivery?: 'browser' | 'phone';
  offer?: EscalationOffer;
  reason?: string;
}

function token(): string | null {
  try { return localStorage.getItem('auth_token'); } catch { return null; }
}

export function useAgentPresence(enabled: boolean) {
  const [offers, setOffers] = useState<EscalationOffer[]>([]);
  const [status, setStatusState] = useState<'available' | 'away'>('available');
  const [connected, setConnected] = useState(false);
  const [schedule, setScheduleState] = useState<{ onSchedule: boolean; enabled: boolean; override: boolean }>({ onSchedule: true, enabled: false, override: false });
  const notifySupported = typeof window !== 'undefined' && 'Notification' in window;
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission>(
    notifySupported ? Notification.permission : 'denied'
  );

  const seenRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const supaRef = useRef<any>(null);
  const statusRef = useRef<'available' | 'away'>('available');
  const expiryTimers = useRef<Record<string, any>>({});
  const notifiedRef = useRef<Set<string>>(new Set());       // one OS notification per offer
  const notifObjs = useRef<Record<string, Notification>>({}); // so we can close them

  // Fire a desktop notification for a NEW offer, but only when the /cc tab is
  // not the focused window (if the agent is looking at /cc they already see the
  // on-screen pop). One per offer id, ever, within the session.
  const maybeNotify = useCallback((offer: EscalationOffer) => {
    try {
      if (!notifySupported || Notification.permission !== 'granted') return;
      if (!offer || !offer.id || notifiedRef.current.has(offer.id)) return;
      const focused = typeof document !== 'undefined' && !document.hidden && (document.hasFocus ? document.hasFocus() : true);
      if (focused) return; // they can see the pop; don't double-alert
      notifiedRef.current.add(offer.id);
      const title = offer.test ? 'Test escalation' : 'A caller needs a human';
      const bodyBits = [offer.businessName, offer.reason || offer.summary].filter(Boolean);
      const n = new Notification(title, {
        body: bodyBits.join(' — ') || 'Open the console to take the call.',
        tag: `esc-${offer.id}`,
        requireInteraction: !offer.test,
      });
      n.onclick = () => { try { window.focus(); } catch {} try { n.close(); } catch {} };
      notifObjs.current[offer.id] = n;
    } catch { /* notifications are best-effort */ }
  }, [notifySupported]);

  const closeNotif = (offerId: string) => {
    try { notifObjs.current[offerId]?.close(); } catch {}
    delete notifObjs.current[offerId];
  };

  const dismiss = useCallback((offerId: string) => {
    setOffers((cur) => cur.filter((o) => o.id !== offerId));
    const t = expiryTimers.current[offerId];
    if (t) { clearTimeout(t); delete expiryTimers.current[offerId]; }
    closeNotif(offerId);
  }, []);

  const addOffer = useCallback((offer: EscalationOffer) => {
    if (!offer || !offer.id) return;
    setOffers((cur) => (cur.some((o) => o.id === offer.id) ? cur : [...cur, offer]));
    maybeNotify(offer);
    // Auto-clear the pop when the offer expires, so a stale card never lingers.
    if (offer.expiresAt) {
      const ms = Date.parse(offer.expiresAt) - Date.now();
      if (ms > 0 && !expiryTimers.current[offer.id]) {
        expiryTimers.current[offer.id] = setTimeout(() => dismiss(offer.id), ms + 500);
      }
    }
  }, [dismiss, maybeNotify]);

  // Ask the browser for notification permission (needs a user gesture).
  const requestNotify = useCallback(async () => {
    if (!notifySupported) return;
    try { const p = await Notification.requestPermission(); setNotifyPermission(p); }
    catch { /* ignore */ }
  }, [notifySupported]);

  // Route one inbound event (from either transport) through the seen-set.
  const applyEvent = useCallback((ev: any) => {
    if (!ev || typeof ev !== 'object') return;
    if (ev.id) { if (seenRef.current.has(ev.id)) return; seenRef.current.add(ev.id); }
    if (ev.type === 'offer' && ev.offer) addOffer(ev.offer as EscalationOffer);
    else if (ev.type === 'offer_taken' && ev.offerId) dismiss(ev.offerId);
    else if (ev.type === 'offer_cancelled' && ev.offerId) dismiss(ev.offerId);
  }, [addOffer, dismiss]);

  // ---- heartbeat loop -----------------------------------------------------
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;

    const beat = async () => {
      const t = token();
      if (!t) return;
      try {
        const r = await fetch(`${API}/api/cc/agent/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
          body: JSON.stringify({ status: statusRef.current }),
        });
        if (r.ok) {
          const d = await r.json();
          if (!stopped && d.success) {
            if (d.channel) channelRef.current = d.channel;
            if (Array.isArray(d.offers)) d.offers.forEach((o: EscalationOffer) => addOffer(o));
            if (typeof d.onSchedule === 'boolean') setScheduleState({ onSchedule: d.onSchedule, enabled: !!d.scheduleEnabled, override: !!d.override });
          }
        }
      } catch { /* best effort; next beat retries */ }
    };

    beat();
    const iv = setInterval(beat, HEARTBEAT_MS);
    // Background tabs get their timers throttled, so refresh presence the instant
    // the console regains focus/visibility - the agent is back and must not read
    // as stale while a call is being offered.
    const onActive = () => { if (typeof document === 'undefined' || !document.hidden) beat(); };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onActive);
    if (typeof window !== 'undefined') window.addEventListener('focus', onActive);
    return () => {
      stopped = true;
      clearInterval(iv);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onActive);
      if (typeof window !== 'undefined') window.removeEventListener('focus', onActive);
    };
  }, [enabled, addOffer]);

  // ---- SSE stream ---------------------------------------------------------
  useEffect(() => {
    if (!enabled) return;
    const t = token();
    if (!t) return;
    const es = new EventSource(`${API}/api/cc/agent/stream?token=${encodeURIComponent(t)}`);
    esRef.current = es;
    es.addEventListener('hello', () => setConnected(true));
    es.addEventListener('event', (e: MessageEvent) => {
      try { applyEvent(JSON.parse(e.data)); } catch { /* ignore */ }
    });
    es.onerror = () => { /* EventSource auto-reconnects; stay quiet */ };
    return () => { try { es.close(); } catch {} esRef.current = null; setConnected(false); };
  }, [enabled, applyEvent]);

  // ---- Supabase Realtime (cross-instance) ---------------------------------
  // Subscribe once we know our channel name (from the first heartbeat). Re-run
  // when the channel resolves.
  const [channelReady, setChannelReady] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const iv = setInterval(() => { if (channelRef.current) { setChannelReady((n) => (n === 0 ? 1 : n)); clearInterval(iv); } }, 500);
    return () => clearInterval(iv);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !channelRef.current || !SUPABASE_URL || !SUPABASE_ANON) return;
    let client: any = null;
    try {
      client = createClient(SUPABASE_URL, SUPABASE_ANON, { realtime: { params: { eventsPerSecond: 20 } } });
      const ch = client.channel(channelRef.current, { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'event' }, (msg: any) => {
        try { applyEvent(msg?.payload); } catch { /* ignore */ }
      });
      ch.subscribe();
      supaRef.current = { client, ch };
    } catch { /* realtime optional; SSE still covers same-instance */ }
    return () => {
      try { supaRef.current?.ch?.unsubscribe(); } catch {}
      try { supaRef.current?.client?.removeAllChannels?.(); } catch {}
      supaRef.current = null;
    };
  }, [enabled, channelReady, applyEvent]);

  // ---- controls -----------------------------------------------------------
  const setStatus = useCallback(async (next: 'available' | 'away') => {
    statusRef.current = next;
    setStatusState(next);
    const t = token();
    if (!t) return;
    try {
      await fetch(`${API}/api/cc/agent/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ status: next }),
      });
    } catch { /* presence will reconcile on the next heartbeat */ }
  }, []);

  const claim = useCallback(async (offerId: string): Promise<ClaimResult> => {
    const t = token();
    if (!t) return { won: false, reason: 'no_auth' };
    try {
      const r = await fetch(`${API}/api/cc/offer/${offerId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      });
      const d = await r.json().catch(() => ({}));
      // Whether we won or lost, the pop is done for us.
      dismiss(offerId);
      if (!r.ok || !d.success) return { won: false, reason: d.error || 'error' };
      return { won: !!d.won, delivery: d.delivery, offer: d.offer, reason: d.reason };
    } catch {
      return { won: false, reason: 'error' };
    }
  }, [dismiss]);

  const decline = useCallback(async (offerId: string) => {
    dismiss(offerId);
    const t = token();
    if (!t) return;
    try {
      await fetch(`${API}/api/cc/offer/${offerId}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      });
    } catch { /* non-fatal */ }
  }, [dismiss]);

  return { offers, status, setStatus, claim, decline, dismiss, connected, schedule, notifySupported, notifyPermission, requestNotify };
}