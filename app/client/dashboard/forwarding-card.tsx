'use client';

import { useState, useEffect } from 'react';
import { Phone, PhoneCall, Copy, Check, ChevronDown, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';

type Carrier = 'verizon' | 'gsm' | 'other';
type Mode = 'all' | 'missed';
type Handoff = 'my_number' | 'other_number' | 'message';

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

// Progressive formatter for the "different number" input. Keeps the last 10 US
// digits (drops a leading 1 for display) and formats as the user types.
function formatAsTyped(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  const local = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  const p = local.slice(0, 10);
  if (p.length <= 3) return p;
  if (p.length <= 6) return `(${p.slice(0, 3)}) ${p.slice(3)}`;
  return `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`;
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
 * Two choices drive the exact carrier code:
 *
 *  1) Carrier (codes are not the same on every network):
 *       Verizon / US Cellular .... * codes, tap-to-dial works (no # in code)
 *       AT&T / T-Mobile (GSM) ..... ** / # codes, phones block auto-dialing
 *                                   these from an app, so copy-to-keypad
 *
 *  2) Who answers first:
 *       "AI answers every call" (unconditional, recommended default)
 *         Verizon *72 / GSM **21*#
 *       "I answer first, AI catches missed calls" (conditional / no-answer)
 *         Verizon *71 / GSM **61*#
 *
 * The conditional option is the correct path for an owner whose personal cell
 * IS their business number: the cell rings first, only missed calls roll to the
 * AI, and there is no call loop. (App Fallback would loop in that case, which is
 * why Settings locks Fallback off whenever forwarding is confirmed.)
 *
 * State is driven solely by clients.forwarding_confirmed, never by call volume.
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
  const [mode, setMode] = useState<Mode>('all');
  const [handoffChoice, setHandoffChoice] = useState<Handoff>('my_number');
  const [transferInput, setTransferInput] = useState('');
  const [handoffSaving, setHandoffSaving] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  useEffect(() => {
    setConfirmed(!!client?.forwarding_confirmed);
  }, [client?.forwarding_confirmed]);

  // Carrier + mode persist server-side so the choice follows the client across
  // devices. The saved client record is the source of truth; localStorage is an
  // instant fallback for the brief window before the record loads, and a default
  // of "all" if neither has a value yet.
  useEffect(() => {
    if (!client?.id) return;

    const sc = client.forwarding_carrier;
    let nextCarrier: Carrier | null = null;
    if (sc === 'verizon' || sc === 'gsm' || sc === 'other') {
      nextCarrier = sc;
    } else {
      try {
        const c = localStorage.getItem(`fwd_carrier_${client.id}`);
        if (c === 'verizon' || c === 'gsm' || c === 'other') nextCarrier = c;
      } catch {}
    }

    const sm = client.forwarding_mode;
    let nextMode: Mode = 'all';
    if (sm === 'all' || sm === 'missed') {
      nextMode = sm;
    } else {
      try {
        const m = localStorage.getItem(`fwd_mode_${client.id}`);
        if (m === 'all' || m === 'missed') nextMode = m;
      } catch {}
    }

    setCarrier(nextCarrier);
    setMode(nextMode);
  }, [client?.id, client?.forwarding_carrier, client?.forwarding_mode]);

  // Load the saved "needs a person" choice from the client record (the source of
  // truth). Message wins, then an explicit different number, otherwise the
  // default of the owner's own number. Keyed on the two relevant fields so an
  // unrelated refresh (like a carrier change) never resets a choice in progress.
  useEffect(() => {
    if (!client?.id) return;
    const ext = client as typeof client & {
      human_handoff?: 'transfer' | 'message' | null;
      transfer_phone?: string | null;
    };
    if (ext.human_handoff === 'message') {
      setHandoffChoice('message');
    } else if (ext.transfer_phone) {
      setHandoffChoice('other_number');
      setTransferInput(formatPhoneNumber(ext.transfer_phone));
    } else {
      setHandoffChoice('my_number');
    }
  }, [
    client?.id,
    (client as typeof client & { human_handoff?: string | null })?.human_handoff,
    (client as typeof client & { transfer_phone?: string | null })?.transfer_phone,
  ]);

  if (!client || !client.vapi_phone_number) return null;

  const formatted = formatPhoneNumber(client.vapi_phone_number);
  const digits = digitsFor(client.vapi_phone_number);
  const telTest = `tel:${digits}`;
  const isMissed = mode === 'missed';

  // Where "My number" transfers to. Confirmed present on the loaded client row
  // (getClientByVapiPhoneNumber selects *). Cast keeps this compiling whether or
  // not owner_phone is on the Client type yet.
  const ownerPhoneRaw =
    (client as typeof client & { owner_phone?: string | null }).owner_phone || '';
  const ownerFormatted = ownerPhoneRaw ? formatPhoneNumber(ownerPhoneRaw) : '';

  // Per-carrier, per-mode codes (verified June 2026)
  const vzCode = isMissed ? `*71${digits}` : `*72${digits}`;   // Verizon / US Cellular, dialable
  const vzTel = `tel:${vzCode}`;                                // tap-to-dial OK (no # in code)
  const gsmCode = isMissed ? `**61*${digits}#` : `**21*${digits}#`; // AT&T / T-Mobile, type on keypad
  const vzOff = '*73';
  const gsmOff = isMissed ? '##61#' : '##21#';
  const offCode =
    carrier === 'gsm' ? gsmOff : carrier === 'verizon' ? vzOff : `${vzOff} (Verizon) or ${gsmOff} (AT&T/T-Mobile)`;

  const card = {
    backgroundColor: theme.card,
    border: `1px solid ${theme.border}`,
  };

  // Writes the carrier/mode pick to the server (and refreshes context) so it
  // sticks across devices. localStorage is updated synchronously by the callers
  // for an instant UI, this just makes it durable.
  async function persistForwarding(body: Record<string, unknown>) {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${backendUrl}/api/client/${client!.id}/forwarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      await refreshClient();
    } catch (e) {
      console.error('Failed to persist forwarding choice:', e);
    }
  }

  // "When a caller needs a person" persistence. Writes human_handoff and
  // transfer_phone through the same forwarding endpoint (partial update), and
  // surfaces validation errors inline (the backend 400s on a bad number).
  async function saveHandoff(body: Record<string, unknown>): Promise<boolean> {
    setHandoffError(null);
    setHandoffSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${backendUrl}/api/client/${client!.id}/forwarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let msg = 'Could not save that. Please try again.';
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
          else if (data?.message) msg = data.message;
        } catch {}
        setHandoffError(msg);
        return false;
      }
      await refreshClient();
      return true;
    } catch (e) {
      console.error('Failed to save handoff choice:', e);
      setHandoffError('Something went wrong. Please try again.');
      return false;
    } finally {
      setHandoffSaving(false);
    }
  }

  function chooseMyNumber() {
    setHandoffChoice('my_number');
    setHandoffError(null);
    // null clears transfer_phone so the config builder falls back to owner_phone.
    saveHandoff({ human_handoff: 'transfer', transfer_phone: null });
  }

  function chooseOtherNumber() {
    // Reveal the input. Nothing persists until a valid number is entered and saved.
    setHandoffChoice('other_number');
    setHandoffError(null);
  }

  function chooseTakeMessage() {
    setHandoffChoice('message');
    setHandoffError(null);
    // Leave transfer_phone as-is; it is ignored in message mode.
    saveHandoff({ human_handoff: 'message' });
  }

  async function saveOtherNumber() {
    const raw = transferInput.replace(/\D/g, '');
    const valid = raw.length === 10 || (raw.length === 11 && raw.startsWith('1'));
    if (!valid) {
      setHandoffError('Enter a 10 digit US phone number.');
      return;
    }
    await saveHandoff({ human_handoff: 'transfer', transfer_phone: transferInput });
  }

  function chooseCarrier(c: Carrier | null) {
    setCarrier(c);
    try {
      if (c) localStorage.setItem(`fwd_carrier_${client!.id}`, c);
      else localStorage.removeItem(`fwd_carrier_${client!.id}`);
    } catch {}
    persistForwarding({ forwarding_carrier: c });
  }

  function chooseMode(m: Mode) {
    setMode(m);
    try { localStorage.setItem(`fwd_mode_${client!.id}`, m); } catch {}
    persistForwarding({ forwarding_mode: m });
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
        body: JSON.stringify({ forwarding_confirmed: next, forwarding_carrier: carrier, forwarding_mode: mode }),
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
            <p className="text-[13px]" style={{ color: theme.textMuted }}>
              {isMissed ? 'Your AI is catching the calls you miss' : 'Your AI is answering your calls'}
            </p>
          </div>
          <ChevronDown className={`h-5 w-5 flex-shrink-0 transition-transform ${liveOpen ? 'rotate-180' : ''}`}
            style={{ color: theme.textMuted4 }} />
        </button>

        {liveOpen && (
          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            <p className="text-[13px] sm:text-sm leading-relaxed" style={{ color: theme.textMuted }}>
              {isMissed
                ? 'Your phone rings first. Any call you do not pick up rolls to your receptionist. Want to hear it? Let a test call ring through without answering.'
                : 'Forwarded calls now go straight to your receptionist, 24/7. Want to hear it? Give your AI number a call and say hello.'}
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

  // "Who answers first" choice. Default "all" is recommended. "missed" routes a
  // personal-cell owner to conditional forwarding instead of the loop-prone app
  // Fallback.
  const modePicker = (
    <div className="mt-4">
      <p className="text-[12px] sm:text-[13px] font-semibold mb-2" style={{ color: theme.text }}>Who should answer first?</p>
      <div className="space-y-2">
        <button onClick={() => chooseMode('all')}
          className="w-full text-left rounded-xl border-2 px-3.5 py-3 transition"
          style={{ borderColor: mode === 'all' ? theme.primary : theme.border, backgroundColor: mode === 'all' ? theme.primary15 : theme.card }}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[13px] sm:text-sm" style={{ color: mode === 'all' ? theme.primary : theme.text }}>AI answers every call</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ backgroundColor: theme.primary15, color: theme.primary }}>Recommended</span>
          </div>
          <p className="mt-1 text-[11px] sm:text-[12px] leading-relaxed" style={{ color: theme.textMuted4 }}>Every call goes straight to your AI. Your phone does not ring.</p>
        </button>
        <button onClick={() => chooseMode('missed')}
          className="w-full text-left rounded-xl border-2 px-3.5 py-3 transition"
          style={{ borderColor: mode === 'missed' ? theme.primary : theme.border, backgroundColor: mode === 'missed' ? theme.primary15 : theme.card }}>
          <span className="font-semibold text-[13px] sm:text-sm" style={{ color: mode === 'missed' ? theme.primary : theme.text }}>I answer first, AI catches missed calls</span>
          <p className="mt-1 text-[11px] sm:text-[12px] leading-relaxed" style={{ color: theme.textMuted4 }}>Your phone rings first. Calls you do not pick up roll to the AI. Best if your business number is your personal cell.</p>
        </button>
      </div>
    </div>
  );

  // "When a caller needs a person" choice. Only meaningful in "all" mode; in
  // "missed" mode the config builder always takes a message (transferring would
  // ring back to the line that just missed the call), so we show one line.
  const handoffPicker = isMissed ? (
    <div className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: theme.hover }}>
      <p className="text-[12px] sm:text-[13px] font-semibold mb-1" style={{ color: theme.text }}>When a caller needs a person</p>
      <p className="text-[11px] sm:text-[12px] leading-relaxed" style={{ color: theme.textMuted }}>
        Calls you miss are answered by your AI, which takes a message. It will not transfer, since that would ring back to the line that just missed the call.
      </p>
    </div>
  ) : (
    <div className="mt-4">
      <p className="text-[12px] sm:text-[13px] font-semibold mb-2" style={{ color: theme.text }}>When a caller needs a person</p>
      <div className="space-y-2">
        {/* My number (default) */}
        <button onClick={chooseMyNumber} disabled={handoffSaving}
          className="w-full text-left rounded-xl border-2 px-3.5 py-3 transition disabled:opacity-60"
          style={{ borderColor: handoffChoice === 'my_number' ? theme.primary : theme.border, backgroundColor: handoffChoice === 'my_number' ? theme.primary15 : theme.card }}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[13px] sm:text-sm" style={{ color: handoffChoice === 'my_number' ? theme.primary : theme.text }}>My number</span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ backgroundColor: theme.primary15, color: theme.primary }}>Default</span>
          </div>
          <p className="mt-1 text-[11px] sm:text-[12px] leading-relaxed" style={{ color: theme.textMuted4 }}>
            {ownerFormatted
              ? `The AI offers to connect callers to you at ${ownerFormatted}.`
              : 'The AI offers to connect callers to the number on your account.'}
          </p>
        </button>

        {/* A different number */}
        <button onClick={chooseOtherNumber} disabled={handoffSaving}
          className="w-full text-left rounded-xl border-2 px-3.5 py-3 transition disabled:opacity-60"
          style={{ borderColor: handoffChoice === 'other_number' ? theme.primary : theme.border, backgroundColor: handoffChoice === 'other_number' ? theme.primary15 : theme.card }}>
          <span className="font-semibold text-[13px] sm:text-sm" style={{ color: handoffChoice === 'other_number' ? theme.primary : theme.text }}>A different number</span>
          <p className="mt-1 text-[11px] sm:text-[12px] leading-relaxed" style={{ color: theme.textMuted4 }}>Send callers who need a person to another line, like an office phone or a colleague.</p>
        </button>

        {handoffChoice === 'other_number' && (
          <div className="rounded-xl px-3.5 py-3" style={{ backgroundColor: theme.hover }}>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: theme.text }}>Transfer calls to</label>
            <div className="flex items-center gap-2">
              <input
                type="tel"
                inputMode="tel"
                value={transferInput}
                onChange={(e) => { setTransferInput(formatAsTyped(e.target.value)); if (handoffError) setHandoffError(null); }}
                placeholder="(555) 123-4567"
                className="flex-1 min-w-0 rounded-lg px-3 py-2 text-[13px] sm:text-sm outline-none"
                style={{ backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}
              />
              <button onClick={saveOtherNumber} disabled={handoffSaving}
                className="flex-shrink-0 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: theme.primary, color: theme.buttonText }}>
                {handoffSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: theme.textMuted4 }}>
              Use a line that is not forwarded to your AI, or calls will loop back to it.
            </p>
          </div>
        )}

        {/* Take a message */}
        <button onClick={chooseTakeMessage} disabled={handoffSaving}
          className="w-full text-left rounded-xl border-2 px-3.5 py-3 transition disabled:opacity-60"
          style={{ borderColor: handoffChoice === 'message' ? theme.primary : theme.border, backgroundColor: handoffChoice === 'message' ? theme.primary15 : theme.card }}>
          <span className="font-semibold text-[13px] sm:text-sm" style={{ color: handoffChoice === 'message' ? theme.primary : theme.text }}>Take a message</span>
          <p className="mt-1 text-[11px] sm:text-[12px] leading-relaxed" style={{ color: theme.textMuted4 }}>The AI never transfers. It collects the caller&apos;s details and sends them to you.</p>
        </button>

        {handoffError && (
          <p className="text-[12px] leading-relaxed" style={{ color: '#dc2626' }}>{handoffError}</p>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // SETUP STATE: carrier chosen. Show the matching code + method for the mode.
  // ---------------------------------------------------------------------------
  return (
    <div className="rounded-2xl p-5 sm:p-6 mb-5 sm:mb-7 fu fu2" style={card}>
      {intro}

      {/* Selected carrier + change */}
      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: theme.hover }}>
        <span className="text-[12px] font-medium" style={{ color: theme.textMuted }}>Carrier: <span style={{ color: theme.text }}>{carrierLabel}</span></span>
        <button onClick={() => chooseCarrier(null)} className="text-[12px] font-semibold transition hover:opacity-80" style={{ color: theme.primary }}>Change</button>
      </div>

      {/* Who answers first */}
      {modePicker}

      {/* When a caller needs a person */}
      {handoffPicker}

      {/* VERIZON / US CELLULAR: tap-to-dial (*72 all / *71 missed) */}
      {carrier === 'verizon' && (
        <>
          <div className="mt-4 space-y-2.5">
            {stepRow(1, isMissed
              ? `Tap "Turn on forwarding" below. Your phone dials *71 then your AI number, ${formatted}. Your phone keeps ringing first; missed calls roll to the AI.`
              : `Tap "Turn on forwarding" below. Your phone dials *72 then your AI number, ${formatted}.`)}
            {stepRow(2, 'Wait for the confirmation tone, then hang up.')}
            {stepRow(3, 'Tap the confirm button below so your dashboard shows you as live.')}
          </div>

          <a href={vzTel}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: theme.primary, color: theme.buttonText }}>
            <Phone className="h-5 w-5" />
            Turn on forwarding
          </a>
          <p className="mt-2 text-center text-[12px] sm:text-[13px]" style={{ color: theme.textMuted }}>
            Just press call when your dialer opens.
          </p>

          <button onClick={() => copyText(vzCode, 'vz')}
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

      {/* AT&T / T-MOBILE: copy the code, type it on the keypad (**21*# all / **61*# missed) */}
      {carrier === 'gsm' && (
        <>
          <div className="mt-4 space-y-2.5">
            {stepRow(1, 'Copy the code below.')}
            {stepRow(2, isMissed
              ? 'Open your phone keypad, paste or type the code, and press call. Your phone keeps ringing first; missed calls roll to the AI.'
              : 'Open your phone keypad, paste or type the code, and press call.')}
            {stepRow(3, 'Wait for the confirmation, then tap the confirm button below.')}
          </div>

          <div className="mt-4 rounded-xl px-4 py-3 text-center" style={{ backgroundColor: theme.hover }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: theme.textMuted4 }}>Forwarding code</p>
            <p className="text-base sm:text-lg font-mono font-bold break-all" style={{ color: theme.text }}>{gsmCode}</p>
          </div>

          <button onClick={() => copyText(gsmCode, 'gsm')}
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

      {/* OTHER / NOT SURE: show both for the chosen mode */}
      {carrier === 'other' && (
        <>
          <p className="mt-4 text-[12px] sm:text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>
            Most carriers use one of these two codes. Try the first. If you hear &quot;your call cannot be completed,&quot; use the second instead. Type the code on your phone keypad and press call.
          </p>

          <div className="mt-3 rounded-xl px-4 py-3" style={{ backgroundColor: theme.hover }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: theme.textMuted4 }}>Verizon / US Cellular</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm sm:text-base font-mono font-bold break-all" style={{ color: theme.text }}>{isMissed ? '*71' : '*72'} {formatted}</p>
              <button onClick={() => copyText(vzCode, 'vz')} className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium" style={{ backgroundColor: theme.card, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                {copied === 'vz' ? <Check className="h-3.5 w-3.5" style={{ color: theme.success }} /> : <Copy className="h-3.5 w-3.5" />}
                {copied === 'vz' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="mt-2 rounded-xl px-4 py-3" style={{ backgroundColor: theme.hover }}>
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: theme.textMuted4 }}>AT&amp;T / T-Mobile</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm sm:text-base font-mono font-bold break-all" style={{ color: theme.text }}>{gsmCode}</p>
              <button onClick={() => copyText(gsmCode, 'gsm')} className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium" style={{ backgroundColor: theme.card, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                {copied === 'gsm' ? <Check className="h-3.5 w-3.5" style={{ color: theme.success }} /> : <Copy className="h-3.5 w-3.5" />}
                {copied === 'gsm' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed" style={{ color: theme.textMuted4 }}>
            {isMissed
              ? 'These forward only the calls you miss; your phone rings first. '
              : 'These forward every call straight to your AI. '}
            Once you hear the confirmation, tap the confirm button below. Still stuck? Search &quot;[your carrier] call forwarding code&quot; or ask your carrier to enable forwarding to an outside number.
          </p>
        </>
      )}

      {/* Confirm (all carriers) */}
      {confirmButton}

      {/* Cancel helper line */}
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
          Enter the code on the keypad with no spaces or dashes, on cellular signal (not Wi-Fi calling), then wait for the confirmation. If it still fails, your plan may not include call forwarding. Call your carrier and ask them to enable forwarding to an outside number.
        </p>
      )}
    </div>
  );
}