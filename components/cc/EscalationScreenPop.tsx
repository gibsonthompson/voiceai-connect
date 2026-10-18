'use client';

// ============================================================================
// components/cc/EscalationScreenPop.tsx
//
// The escalation screen-pop. When the AI hands a call-center caller to a human,
// every assigned, available agent sees this card appear over whatever page they
// are on, with the caller, the business, the reason, and everything the AI
// collected - and one button to take the call. The first to click wins (the
// claim is atomic server-side); everyone else's card clears itself.
//
// Take-over routing:
//   - browser seat -> opens the live call monitor for that business, where the
//     agent is bridged straight onto the caller (reusing the existing jump-in).
//   - phone seat    -> the backend rings the agent's phone; the card says so.
//   - test offer    -> no real caller; the card just confirms the claim worked.
//
// Theme-aware (useTheme inline styles), so it white-labels in light and dark and
// never flashes platform colors. Mounted once in the /cc shell.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { PhoneCall, Building2, User, X, Loader2, CheckCircle2, PhoneForwarded, ArrowRight } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { EscalationOffer, ClaimResult } from '../../hooks/useAgentPresence';

function fmtPhone(p: string | null): string {
  if (!p) return 'Unknown caller';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return p;
}

// A short, soft double-beep so an agent not looking at the screen notices a pop.
// Best-effort: a blocked AudioContext (no user gesture yet) simply does nothing.
function playChime() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const beep = (at: number, freq: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.28);
      o.start(ctx.currentTime + at); o.stop(ctx.currentTime + at + 0.3);
    };
    beep(0, 880); beep(0.33, 1046);
    setTimeout(() => { try { ctx.close(); } catch {} }, 900);
  } catch { /* no audio; the visual pop still shows */ }
}

type CardState =
  | { kind: 'offer' }
  | { kind: 'claiming' }
  | { kind: 'won_browser' }
  | { kind: 'won_phone' }
  | { kind: 'won_test' }
  | { kind: 'lost'; by?: string };

function OfferCard({
  offer, claim, decline, onDone,
}: {
  offer: EscalationOffer;
  claim: (id: string) => Promise<ClaimResult>;
  decline: (id: string) => void;
  onDone: (id: string) => void;
}) {
  const theme = useTheme();
  const [state, setState] = useState<CardState>({ kind: 'offer' });

  const take = async () => {
    setState({ kind: 'claiming' });
    const r = await claim(offer.id);
    if (!r.won) { setState({ kind: 'lost', by: r.reason === 'taken' ? undefined : r.reason }); setTimeout(() => onDone(offer.id), 2200); return; }
    if (offer.test) { setState({ kind: 'won_test' }); setTimeout(() => onDone(offer.id), 2600); return; }
    if (r.delivery === 'phone') { setState({ kind: 'won_phone' }); setTimeout(() => onDone(offer.id), 4000); return; }
    // Browser seat: go to the live monitor for this call and auto-join.
    setState({ kind: 'won_browser' });
    const q = new URLSearchParams({ mode: 'monitor', autojoin: '1', back: '/cc/live-calls' });
    if (offer.vapiCallId) q.set('call', offer.vapiCallId);
    setTimeout(() => { window.location.href = `/live/${offer.clientId}?${q.toString()}`; }, 500);
  };

  const collected = offer.collected && typeof offer.collected === 'object'
    ? Object.entries(offer.collected).filter(([k]) => k !== 'test')
    : [];

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
      role="alertdialog"
      aria-label="Incoming call escalation"
    >
      {/* Accent header with a live pulse */}
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ backgroundColor: theme.primary }}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: theme.primaryText }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: theme.primaryText }} />
        </span>
        <span className="text-[13px] font-semibold tracking-wide" style={{ color: theme.primaryText }}>
          {offer.test ? 'Test escalation' : 'A caller needs a human'}
        </span>
        <button onClick={() => { decline(offer.id); onDone(offer.id); }} className="ml-auto -mr-1 p-1 rounded-lg" style={{ color: theme.primaryText }} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4">
        {/* Caller + business */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
            <PhoneCall className="h-5 w-5" style={{ color: theme.primary }} />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold truncate" style={{ color: theme.text }}>{fmtPhone(offer.callerNumber)}</p>
            <p className="text-[13px] truncate flex items-center gap-1.5" style={{ color: theme.textMuted }}>
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" /> {offer.businessName || 'Business'}
            </p>
          </div>
        </div>

        {/* Reason + what the AI collected */}
        {(offer.reason || offer.summary) && (
          <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: theme.hover }}>
            {offer.reason && <p className="text-[13px] font-medium" style={{ color: theme.text }}>{offer.reason}</p>}
            {offer.summary && <p className="text-[13px] mt-0.5 leading-snug" style={{ color: theme.textMuted }}>{offer.summary}</p>}
          </div>
        )}
        {collected.length > 0 && (
          <div className="mt-2.5 space-y-1">
            {collected.slice(0, 5).map(([k, v]) => (
              <div key={k} className="flex items-start gap-2 text-[12.5px]">
                <User className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: theme.textSubtle }} />
                <span style={{ color: theme.textMuted }}><span style={{ color: theme.textSubtle }}>{k}:</span> {String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action area reflects claim state */}
        <div className="mt-4">
          {state.kind === 'offer' && (
            <div className="flex items-center gap-2">
              <button
                onClick={take}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}
              >
                Take the call <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => { decline(offer.id); onDone(offer.id); }}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition"
                style={{ backgroundColor: theme.hover, color: theme.textMuted }}
              >
                Dismiss
              </button>
            </div>
          )}
          {state.kind === 'claiming' && (
            <div className="inline-flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
              <Loader2 className="h-4 w-4 animate-spin" /> Taking the call...
            </div>
          )}
          {state.kind === 'won_browser' && (
            <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: theme.primary }}>
              <CheckCircle2 className="h-4 w-4" /> Opening the call...
            </div>
          )}
          {state.kind === 'won_phone' && (
            <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: theme.primary }}>
              <PhoneForwarded className="h-4 w-4" /> Your phone is ringing - pick up to take the caller.
            </div>
          )}
          {state.kind === 'won_test' && (
            <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: theme.primary }}>
              <CheckCircle2 className="h-4 w-4" /> Test take-over worked. (No real caller.)
            </div>
          )}
          {state.kind === 'lost' && (
            <div className="inline-flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
              <CheckCircle2 className="h-4 w-4" /> A teammate took this one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EscalationScreenPop({
  offers, claim, decline, dismiss,
}: {
  offers: EscalationOffer[];
  claim: (id: string) => Promise<ClaimResult>;
  decline: (id: string) => void;
  dismiss: (id: string) => void;
}) {
  const prevCount = useRef(0);

  // Chime + title flash when a new offer arrives.
  useEffect(() => {
    if (offers.length > prevCount.current) {
      playChime();
      try {
        const orig = document.title;
        document.title = 'Caller waiting';
        const t = setTimeout(() => { document.title = orig; }, 4000);
        return () => clearTimeout(t);
      } catch { /* ignore */ }
    }
    prevCount.current = offers.length;
  }, [offers.length]);

  if (!offers.length) return null;

  return (
    <div className="fixed z-[100] flex flex-col gap-3 w-[min(92vw,380px)]" style={{ right: '1rem', bottom: '1rem' }}>
      {offers.map((o) => (
        <OfferCard key={o.id} offer={o} claim={claim} decline={decline} onDone={dismiss} />
      ))}
    </div>
  );
}
