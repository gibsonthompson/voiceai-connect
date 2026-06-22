'use client';

import { useState, useEffect } from 'react';
import { Phone, PhoneCall, Copy, Check, ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';

const FORWARD_CODE = '*72';
const DISABLE_CODE = '*73';

function digitsFor(phone: string): string {
  const d = (phone || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return d.slice(1);
  return d;
}

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 11)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
  return phone;
}

interface CallForwardingCardProps {
  /** Accepted for backward compatibility with the dashboard; no longer used.
   *  State is driven solely by clients.forwarding_confirmed, not call volume. */
  callsThisMonth?: number;
}

/**
 * CallForwardingCard
 * -----------------------------------------------------------------------------
 * The primary activation step for a new client: forwarding their business line
 * to the AI number. Until this happens, the AI receives no calls.
 *
 * Design: one clear primary action (tap to dial the forwarding code), with
 * everything else kept quiet. Confirmation is an explicit button, and the card
 * never hides itself on call volume. Once confirmed it becomes a small,
 * persistent, collapsible "You're live" bar.
 */
export function CallForwardingCard({ callsThisMonth = 0 }: CallForwardingCardProps) {
  const { client, refreshClient } = useClient();
  const theme = useClientTheme();

  const [confirmed, setConfirmed] = useState<boolean>(!!client?.forwarding_confirmed);
  const [liveOpen, setLiveOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConfirmed(!!client?.forwarding_confirmed);
  }, [client?.forwarding_confirmed]);

  if (!client || !client.vapi_phone_number) return null;

  const formatted = formatPhoneNumber(client.vapi_phone_number);
  const digits = digitsFor(client.vapi_phone_number);
  const dialSeq = `${FORWARD_CODE}${digits}`;
  const telActivate = `tel:${dialSeq}`;
  const telTest = `tel:${digits}`;

  const card = {
    backgroundColor: theme.card,
    border: `1px solid ${theme.border}`,
  };

  async function save(next: boolean) {
    setSaving(true);
    setConfirmed(next); // optimistic
    if (next) setLiveOpen(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${backendUrl}/api/client/${client!.id}/forwarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ forwarding_confirmed: next }),
      });
      await refreshClient();
    } catch (e) {
      console.error('Failed to save forwarding state:', e);
    } finally {
      setSaving(false);
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(dialSeq);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // ---------------------------------------------------------------------------
  // LIVE STATE: forwarding confirmed. Persistent + collapsible, only reached
  // via the explicit confirm button. Collapsed by default on load.
  // ---------------------------------------------------------------------------
  if (confirmed) {
    return (
      <div className="rounded-2xl mb-5 sm:mb-7 fu fu2 overflow-hidden"
        style={{ ...card, borderColor: theme.successBorder }}>
        <button onClick={() => setLiveOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-5 sm:px-6 py-4 text-left transition hover:opacity-90">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: theme.successBg }}>
            <CheckCircle className="h-5 w-5" style={{ color: theme.success }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-tight" style={{ color: theme.text }}>You&apos;re live</p>
            <p className="text-[13px]" style={{ color: theme.textMuted }}>Your AI is answering calls</p>
          </div>
          <ChevronDown className={`h-5 w-5 flex-shrink-0 transition-transform ${liveOpen ? 'rotate-180' : ''}`}
            style={{ color: theme.textMuted4 }} />
        </button>

        {liveOpen && (
          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            <p className="text-[13px] sm:text-sm leading-relaxed" style={{ color: theme.textMuted }}>
              Forwarded calls now go straight to your receptionist, 24/7. Want to hear it? Give your AI number a call and say hello.
            </p>

            <a href={telTest}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm sm:text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ backgroundColor: theme.primary, color: theme.buttonText }}>
              <PhoneCall className="h-5 w-5" />
              Call {formatted} to test
            </a>
            <p className="mt-2 text-center text-[12px] leading-relaxed" style={{ color: theme.textMuted4 }}>
              Call from a different phone, not the one you forwarded.
            </p>

            <button onClick={() => save(false)} disabled={saving}
              className="mt-3 w-full text-center text-[13px] font-medium transition hover:opacity-80 disabled:opacity-50"
              style={{ color: theme.textMuted4 }}>
              {saving ? 'Saving…' : `Calls not coming through? Turn off with ${DISABLE_CODE} and set up again`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SETUP STATE: one clear primary action, everything else kept quiet.
  // ---------------------------------------------------------------------------
  return (
    <div className="rounded-2xl p-5 sm:p-6 mb-5 sm:mb-7 fu fu2" style={card}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.primary15 }}>
          <Phone className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: theme.text }}>
            Turn on call forwarding
          </h3>
          <p className="mt-1 text-[13px] sm:text-sm leading-relaxed" style={{ color: theme.textMuted }}>
            Your customers keep calling your usual business number. This sends those calls to your AI line so it can answer them. Your number never changes.
          </p>
        </div>
      </div>

      {/* How to do it, in three short steps */}
      <div className="mt-4 space-y-2.5">
        {[
          `Tap the button below. Your phone dials ${FORWARD_CODE} then your AI number, ${formatted}.`,
          'Wait for the confirmation tone or message, then hang up.',
          'Tap the confirm button below so your dashboard shows you as live.',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{i + 1}</div>
            <p className="text-[12px] sm:text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>{step}</p>
          </div>
        ))}
      </div>

      {/* Primary action */}
      <a href={telActivate}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{ backgroundColor: theme.primary, color: theme.buttonText }}>
        <Phone className="h-5 w-5" />
        Turn on forwarding
      </a>
      <p className="mt-2 text-center text-[12px] sm:text-[13px]" style={{ color: theme.textMuted }}>
        Just press call when your dialer opens.
      </p>

      {/* Secondary: copy for another phone */}
      <button onClick={copy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition hover:opacity-90"
        style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
        {copied ? <Check className="h-4 w-4" style={{ color: theme.success }} /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy the code for another phone'}
      </button>
      <p className="mt-1.5 text-center text-[11px] leading-relaxed" style={{ color: theme.textMuted4 }}>
        Setting up a landline or a different phone? Copy the code and dial it on that phone instead.
      </p>

      {/* Confirm */}
      <button onClick={() => save(true)} disabled={saving}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        style={{ border: `1px solid ${theme.border}`, color: theme.text }}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" style={{ color: theme.success }} />}
        {saving ? 'Saving…' : "I've turned it on"}
      </button>

      {/* One quiet helper line */}
      <p className="mt-4 text-center text-[12px] leading-relaxed" style={{ color: theme.textMuted4 }}>
        Same number for your customers. Turn it off anytime by dialing {DISABLE_CODE}.
      </p>

      {/* Carrier help, tucked away */}
      <button onClick={() => setHelpOpen((v) => !v)}
        className="mt-1 flex w-full items-center justify-center gap-1.5 text-[12px] font-medium transition hover:opacity-80"
        style={{ color: theme.textMuted4 }}>
        Using a different carrier?
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${helpOpen ? 'rotate-180' : ''}`} />
      </button>
      {helpOpen && (
        <p className="mt-2 rounded-xl px-4 py-3 text-[13px] leading-relaxed" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
          {FORWARD_CODE} works on most U.S. carriers. If it doesn&apos;t take, search &quot;[your carrier] call forwarding&quot; for the right code.
        </p>
      )}
    </div>
  );
}