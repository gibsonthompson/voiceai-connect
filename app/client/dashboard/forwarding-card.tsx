'use client';

import { useState, useEffect } from 'react';
import {
  Phone, PhoneForwarded, PhoneCall, Copy, Check, ChevronDown,
  ArrowRight, CheckCircle, Headphones, User, Loader2,
} from 'lucide-react';
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
  /** Hide the card entirely once any call has come in — forwarding is clearly working. */
  callsThisMonth?: number;
}

/**
 * CallForwardingCard
 * -----------------------------------------------------------------------------
 * The primary activation step for a new client: forwarding their business line
 * to the AI number. Until this happens, the AI receives no calls.
 *
 *  - Reads the AI number, brand theme, and confirmed state from context.
 *  - Primary action is a `tel:` deep link that opens the dialer pre-loaded with
 *    the forwarding code + AI number, so the owner just presses call.
 *  - Persists "done" to clients.forwarding_confirmed via the backend, then
 *    refreshClient() so the state survives reloads and across devices.
 *  - Auto-hides once a call has been received this month (implicit confirmation).
 */
export function CallForwardingCard({ callsThisMonth = 0 }: CallForwardingCardProps) {
  const { client, refreshClient } = useClient();
  const theme = useClientTheme();

  const [confirmed, setConfirmed] = useState<boolean>(!!client?.forwarding_confirmed);
  const [copied, setCopied] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Keep local state in sync if the client object updates elsewhere.
  useEffect(() => {
    setConfirmed(!!client?.forwarding_confirmed);
  }, [client?.forwarding_confirmed]);

  if (!client || !client.vapi_phone_number) return null;

  // Once calls are flowing, forwarding obviously works — don't clutter the home screen.
  if (callsThisMonth > 0) return null;

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
      // Keep the optimistic value; a later refresh reconciles it.
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
  // LIVE STATE — forwarding confirmed (shown until first call arrives)
  // ---------------------------------------------------------------------------
  if (confirmed) {
    return (
      <div className="rounded-2xl p-5 sm:p-6 mb-5 sm:mb-7 fu fu2"
        style={{ ...card, borderColor: theme.successBorder }}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.successBg }}>
            <CheckCircle className="h-6 w-6" style={{ color: theme.success }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: theme.success }}>
              You&apos;re live
            </p>
            <h3 className="mt-0.5 text-lg sm:text-xl font-bold leading-tight" style={{ color: theme.text }}>
              Your AI is answering calls
            </h3>
          </div>
        </div>

        <p className="mt-4 text-[13px] sm:text-sm leading-relaxed" style={{ color: theme.textMuted }}>
          Forwarded calls now go straight to your receptionist, 24/7. Hear it for yourself —
          give your AI number a call and say hello.
        </p>

        <a href={telTest}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm sm:text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: theme.primary, color: theme.buttonText }}>
          <PhoneCall className="h-5 w-5" />
          Call {formatted} to test
        </a>

        <div className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: theme.hover }}>
          <p className="text-[13px] sm:text-sm" style={{ color: theme.textMuted }}>
            Need to turn forwarding off? Dial{' '}
            <span className="font-semibold" style={{ color: theme.text }}>{DISABLE_CODE}</span>{' '}
            from your business phone.
          </p>
        </div>

        <button onClick={() => save(false)} disabled={saving}
          className="mt-3 text-[13px] font-medium transition hover:opacity-80 disabled:opacity-50"
          style={{ color: theme.textMuted4 }}>
          {saving ? 'Saving…' : 'Calls not coming through? Set up forwarding again'}
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SETUP STATE — not yet forwarded (the activation hero)
  // ---------------------------------------------------------------------------
  return (
    <div className="rounded-2xl overflow-hidden mb-5 sm:mb-7 fu fu2" style={card}>
      {/* Accent strip */}
      <div className="flex items-center gap-2 px-5 sm:px-6 py-3" style={{ backgroundColor: theme.primary15 }}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute h-full w-full rounded-full opacity-60" style={{ backgroundColor: theme.primary }} />
          <span className="relative h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.primary }} />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.text }}>
          One step to go live
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.primary15 }}>
            <PhoneForwarded className="h-6 w-6" style={{ color: theme.primary }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: theme.text }}>
              Turn on call forwarding
            </h3>
            <p className="mt-1 text-[13px] sm:text-sm leading-relaxed" style={{ color: theme.textMuted }}>
              This sends your calls to your AI. Customers keep calling your same business
              number — we answer the ones you&apos;d miss.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-5 flex items-center justify-between gap-2 rounded-xl px-4 py-4" style={{ backgroundColor: theme.hover }}>
          <Node theme={theme} icon={User} label="Customer calls your number" />
          <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted4 }} />
          <Node theme={theme} icon={Headphones} label="Your AI answers 24/7" highlight />
        </div>

        {/* Primary action */}
        <a href={telActivate}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: theme.primary, color: theme.buttonText }}>
          <Phone className="h-5 w-5" />
          Turn on forwarding
        </a>
        <p className="mt-2 text-center text-[11px] sm:text-xs" style={{ color: theme.textMuted }}>
          Opens your dialer from this phone — then just press call.
        </p>

        {/* Dial sequence as one unbreakable, copyable unit */}
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: theme.textMuted4 }}>
            Or dial this from your business phone
          </p>
          <button onClick={copy}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:scale-[1.005]"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
            <span className="flex h-9 flex-shrink-0 items-center justify-center rounded-lg px-2.5 text-base font-bold"
              style={{ backgroundColor: theme.primary, color: theme.buttonText, fontVariantNumeric: 'tabular-nums' }}>
              {FORWARD_CODE}
            </span>
            <span className="flex-1 whitespace-nowrap text-lg font-bold tracking-tight"
              style={{ color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
              {formatted}
            </span>
            <span className="flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold" style={{ color: theme.textMuted }}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" style={{ color: theme.success }} />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </span>
          </button>
        </div>

        {/* Reassurance */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
          <Trust theme={theme} label="Same number for customers" />
          <Trust theme={theme} label="Takes 10 seconds" />
          <Trust theme={theme} label={`Undo anytime with ${DISABLE_CODE}`} />
        </div>

        {/* Confirm + carrier help */}
        <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${theme.borderSubtle}` }}>
          <button onClick={() => save(true)} disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            style={{ border: `1px solid ${theme.border}`, color: theme.text }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" style={{ color: theme.success }} />}
            {saving ? 'Saving…' : "I've turned on forwarding"}
          </button>

          <button onClick={() => setHelpOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-between text-[13px] font-medium transition hover:opacity-80"
            style={{ color: theme.textMuted }}>
            Using a different phone carrier?
            <ChevronDown className={`h-4 w-4 transition-transform ${helpOpen ? 'rotate-180' : ''}`} />
          </button>
          {helpOpen && (
            <div className="mt-2 space-y-2 rounded-xl px-4 py-3 text-[13px] leading-relaxed" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
              <p>
                <span className="font-semibold" style={{ color: theme.text }}>{FORWARD_CODE}</span>{' '}
                works on most U.S. carriers. If it doesn&apos;t take, your carrier may use a
                different code — search &quot;[your carrier] call forwarding.&quot;
              </p>
              <p>
                To switch forwarding off later, dial{' '}
                <span className="font-semibold" style={{ color: theme.text }}>{DISABLE_CODE}</span>{' '}
                from your business phone.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Node({ theme, icon: Icon, label, highlight }: { theme: any; icon: any; label: string; highlight?: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={highlight
          ? { backgroundColor: theme.primary, color: theme.buttonText }
          : { backgroundColor: theme.card, color: theme.textMuted, border: `1px solid ${theme.border}` }}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[11px] font-medium leading-snug" style={{ color: theme.textMuted }}>{label}</span>
    </div>
  );
}

function Trust({ theme, label }: { theme: any; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: theme.textMuted }}>
      <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.success }} />
      {label}
    </span>
  );
}