'use client';

import { useState, useEffect } from 'react';
import { Phone, PhoneCall, Copy, Check, ChevronDown, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';

type Carrier = 'verizon' | 'gsm' | 'other';

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
 * Carrier-aware: the activation code is NOT the same on every network.
 *   Verizon / US Cellular use *72{number} (tap-to-dial works, no # in the code).
 *   AT&T / T-Mobile (GSM) use **21*{number}# . Phones block auto-dialing those
 *   #/USSD codes from an app link, so that path is copy-the-code-and-type-it.
 * The client picks their carrier first, then we show the right code and method.
 *
 * State is driven solely by clients.forwarding_confirmed, never by call volume.
 * Once confirmed it becomes a small, persistent, collapsible "You're live" bar.
 */
export function CallForwardingCard({ callsThisMonth = 0 }: CallForwardingCardProps) {
  const { client, refreshClient } = useClient();
  const theme = useClientTheme();

  const [confirmed, setConfirmed] = useState<boolean>(!!client?.forwarding_confirmed);
  const [liveOpen, setLiveOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [carrier, setCarrier] = useState<Carrier | null>(null);

  useEffect(() => {
    setConfirmed(!!client?.forwarding_confirmed);
  }, [client?.forwarding_confirmed]);

  // Remember the carrier choice so the steps and the disable code persist
  // across reloads. Client-side only, scoped per client.
  useEffect(() => {
    if (!client?.id) return;
    try {
      const v = localStorage.getItem(`fwd_carrier_${client.id}`);
      if (v === 'verizon' || v === 'gsm' || v === 'other') setCarrier(v);
    } catch {}
  }, [client?.id]);

  if (!client || !client.vapi_phone_number) return null;

  const formatted = formatPhoneNumber(client.vapi_phone_number);
  const digits = digitsFor(client.vapi_phone_number);

  // Per-carrier codes
  const VZ_DIAL = `*72${digits}`;        // Verizon / US Cellular, dialable
  const VZ_TEL = `tel:*72${digits}`;     // tap-to-dial works (no # in code)
  const GSM_CODE = `**21*${digits}#`;    // AT&T / T-Mobile, type on keypad
  const telTest = `tel:${digits}`;

  const offCode =
    carrier === 'gsm' ? '##21#' : carrier === 'verizon' ? '*73' : '*73 (Verizon) or ##21# (AT&T/T-Mobile)';

  const card = {
    backgroundColor: theme.card,
    border: `1px solid ${theme.border}`,
  };

  function chooseCarrier(c: Carrier | null) {
    setCarrier(c);
    try {
      if (c) localStorage.setItem(`fwd_carrier_${client!.id}`, c);
      else localStorage.removeItem(`fwd_carrier_${client!.id}`);
    } catch {}
  }

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

  const copyText = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  // ---------------------------------------------------------------------------
  // LIVE STATE: forwarding confirmed. Persistent + collapsible.
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
              {saving ? 'Saving…' : `Calls not coming through? Turn off with ${offCode} and set up again`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Shared header explaining the number relationship
  const intro = (
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
  );

  const stepRow = (n: number, text: string) => (
    <div key={n} className="flex items-start gap-2.5">
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{n}</div>
      <p className="text-[12px] sm:text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>{text}</p>
    </div>
  );

  const confirmButton = (
    <button onClick={() => save(true)} disabled={saving}
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
      style={{ border: `1px solid ${theme.border}`, color: theme.text }}>
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" style={{ color: theme.success }} />}
      {saving ? 'Saving…' : "I've turned it on"}
    </button>
  );

  // ---------------------------------------------------------------------------
  // CARRIER PICKER: shown before any code, because the code differs by carrier.
  // ---------------------------------------------------------------------------
  if (!carrier) {
    const options: { key: Carrier; label: string }[] = [
      { key: 'verizon', label: 'Verizon or US Cellular' },
      { key: 'gsm', label: 'AT&T or T-Mobile' },
      { key: 'other', label: 'Another carrier, or not sure' },
    ];
    return (
      <div className="rounded-2xl p-5 sm:p-6 mb-5 sm:mb-7 fu fu2" style={card}>
        {intro}
        <div className="mt-4">
          <p className="text-[12px] sm:text-[13px] font-semibold mb-2" style={{ color: theme.text }}>First, who is your phone carrier?</p>
          <div className="space-y-2">
            {options.map((opt) => (
              <button key={opt.key} onClick={() => chooseCarrier(opt.key)}
                className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-[13px] sm:text-sm font-medium transition hover:opacity-90"
                style={{ border: `1px solid ${theme.border}`, color: theme.text, backgroundColor: theme.card }}>
                {opt.label}
                <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted4 }} />
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed" style={{ color: theme.textMuted4 }}>
            The forwarding code is different on each carrier, so we show the right one for yours.
          </p>
        </div>
      </div>
    );
  }

  const carrierLabel = carrier === 'verizon' ? 'Verizon or US Cellular' : carrier === 'gsm' ? 'AT&T or T-Mobile' : 'Another carrier';

  // ---------------------------------------------------------------------------
  // SETUP STATE: carrier chosen. Show the matching code + method.
  // ---------------------------------------------------------------------------
  return (
    <div className="rounded-2xl p-5 sm:p-6 mb-5 sm:mb-7 fu fu2" style={card}>
      {intro}

      {/* Selected carrier + change */}
      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: theme.hover }}>
        <span className="text-[12px] font-medium" style={{ color: theme.textMuted }}>Carrier: <span style={{ color: theme.text }}>{carrierLabel}</span></span>
        <button onClick={() => chooseCarrier(null)} className="text-[12px] font-semibold transition hover:opacity-80" style={{ color: theme.primary }}>Change</button>
      </div>

      {/* VERIZON / US CELLULAR: tap-to-dial *72 */}
      {carrier === 'verizon' && (
        <>
          <div className="mt-4 space-y-2.5">
            {stepRow(1, `Tap "Turn on forwarding" below. Your phone dials *72 then your AI number, ${formatted}.`)}
            {stepRow(2, 'Wait for the confirmation tone, then hang up.')}
            {stepRow(3, 'Tap the confirm button below so your dashboard shows you as live.')}
          </div>

          <a href={VZ_TEL}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: theme.primary, color: theme.buttonText }}>
            <Phone className="h-5 w-5" />
            Turn on forwarding
          </a>
          <p className="mt-2 text-center text-[12px] sm:text-[13px]" style={{ color: theme.textMuted }}>
            Just press call when your dialer opens.
          </p>

          <button onClick={() => copyText(VZ_DIAL, 'vz')}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition hover:opacity-90"
            style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
            {copied === 'vz' ? <Check className="h-4 w-4" style={{ color: theme.success }} /> : <Copy className="h-4 w-4" />}
            {copied === 'vz' ? 'Copied' : 'Copy the code for another phone'}
          </button>
          <p className="mt-1.5 text-center text-[11px] leading-relaxed" style={{ color: theme.textMuted4 }}>
            Setting up a landline or a different phone? Copy the code and dial it on that phone instead.
          </p>
        </>
      )}

      {/* AT&T / T-MOBILE: copy the **21*...# code, type it on the keypad */}
      {carrier === 'gsm' && (
        <>
          <div className="mt-4 space-y-2.5">
            {stepRow(1, 'Copy the code below.')}
            {stepRow(2, 'Open your phone keypad, paste or type the code, and press call.')}
            {stepRow(3, 'Wait for the confirmation, then tap the confirm button below.')}
          </div>

          <div className="mt-4 rounded-xl px-4 py-3 text-center" style={{ backgroundColor: theme.hover }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: theme.textMuted4 }}>Forwarding code</p>
            <p className="text-base sm:text-lg font-mono font-bold break-all" style={{ color: theme.text }}>{GSM_CODE}</p>
          </div>

          <button onClick={() => copyText(GSM_CODE, 'gsm')}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: theme.primary, color: theme.buttonText }}>
            {copied === 'gsm' ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            {copied === 'gsm' ? 'Copied' : 'Copy forwarding code'}
          </button>
          <p className="mt-2 text-center text-[12px] sm:text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>
            Type or paste this on your phone keypad, then press call. On most phones these codes cannot be dialed automatically from an app, so enter it on the keypad yourself.
          </p>
        </>
      )}

      {/* OTHER / NOT SURE: show both, try one then the other */}
      {carrier === 'other' && (
        <>
          <p className="mt-4 text-[12px] sm:text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>
            Most carriers use one of these two codes. Try the first. If you hear &quot;your call cannot be completed,&quot; use the second instead. Type the code on your phone keypad and press call.
          </p>

          <div className="mt-3 rounded-xl px-4 py-3" style={{ backgroundColor: theme.hover }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: theme.textMuted4 }}>Verizon / US Cellular</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm sm:text-base font-mono font-bold break-all" style={{ color: theme.text }}>*72 {formatted}</p>
              <button onClick={() => copyText(VZ_DIAL, 'vz')} className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium" style={{ backgroundColor: theme.card, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                {copied === 'vz' ? <Check className="h-3.5 w-3.5" style={{ color: theme.success }} /> : <Copy className="h-3.5 w-3.5" />}
                {copied === 'vz' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="mt-2 rounded-xl px-4 py-3" style={{ backgroundColor: theme.hover }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: theme.textMuted4 }}>AT&amp;T / T-Mobile</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm sm:text-base font-mono font-bold break-all" style={{ color: theme.text }}>{GSM_CODE}</p>
              <button onClick={() => copyText(GSM_CODE, 'gsm')} className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium" style={{ backgroundColor: theme.card, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                {copied === 'gsm' ? <Check className="h-3.5 w-3.5" style={{ color: theme.success }} /> : <Copy className="h-3.5 w-3.5" />}
                {copied === 'gsm' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed" style={{ color: theme.textMuted4 }}>
            Once you hear the confirmation, tap the confirm button below. Still stuck? Search &quot;[your carrier] call forwarding code&quot; or ask your carrier to enable forwarding to an outside number.
          </p>
        </>
      )}

      {/* Confirm (all carriers) */}
      {confirmButton}

      {/* Disable helper line */}
      <p className="mt-4 text-center text-[12px] leading-relaxed" style={{ color: theme.textMuted4 }}>
        Same number for your customers. Turn forwarding off anytime by dialing {offCode}.
      </p>

      {/* Extra carrier help, tucked away */}
      <button onClick={() => setHelpOpen((v) => !v)}
        className="mt-1 flex w-full items-center justify-center gap-1.5 text-[12px] font-medium transition hover:opacity-80"
        style={{ color: theme.textMuted4 }}>
        Code not working?
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${helpOpen ? 'rotate-180' : ''}`} />
      </button>
      {helpOpen && (
        <p className="mt-2 rounded-xl px-4 py-3 text-[13px] leading-relaxed" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
          Enter the code on the keypad with no spaces or dashes, on cellular signal (not Wi-Fi calling), then wait for the confirmation. If it still fails, your plan may not include call forwarding. Call your carrier and ask them to enable forwarding all calls to an outside number.
        </p>
      )}
    </div>
  );
}