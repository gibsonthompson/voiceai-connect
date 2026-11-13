// ============================================================================
// Email provider preference (outreach composer).
// The agency picks which email app the composer's one-click opens. Stored on
// the agency row (outreach_email_provider) so it follows the account across
// devices, read back through the agency context. This module is the single
// source of truth for the provider list, their display labels, and how to build
// each one's web-compose URL.
//
// IMPORTANT: every provider's compose URL carries ONLY the recipient and the
// subject, never the body. A web-compose link can only hold plain text, so it
// would strip the signature's logo/HTML. The formatted body + signature go on
// the clipboard instead and the sender pastes them in, which is what preserves
// the logo. (See ComposerModal.)
// ============================================================================

export type EmailProviderId = 'gmail' | 'outlook365' | 'outlookcom' | 'yahoo' | 'default';

export interface EmailProviderOption {
  id: EmailProviderId;
  label: string;   // full name for the settings dropdown
  action: string;  // short verb+name for the composer button ("Open Gmail")
}

export const EMAIL_PROVIDERS: EmailProviderOption[] = [
  { id: 'gmail', label: 'Gmail', action: 'Open Gmail' },
  { id: 'outlook365', label: 'Outlook (Microsoft 365 / work)', action: 'Open Outlook' },
  { id: 'outlookcom', label: 'Outlook.com (personal)', action: 'Open Outlook' },
  { id: 'yahoo', label: 'Yahoo Mail', action: 'Open Yahoo' },
  { id: 'default', label: 'My computer’s mail app', action: 'Open your mail app' },
];

const VALID_IDS = EMAIL_PROVIDERS.map((p) => p.id);

export function normalizeProvider(v: unknown): EmailProviderId {
  return (typeof v === 'string' && (VALID_IDS as string[]).includes(v) ? v : 'gmail') as EmailProviderId;
}

export function providerLabel(id: EmailProviderId): string {
  return EMAIL_PROVIDERS.find((p) => p.id === id)?.label || 'Gmail';
}

export function providerAction(id: EmailProviderId): string {
  return EMAIL_PROVIDERS.find((p) => p.id === id)?.action || 'Open Gmail';
}

// Build the provider's web-compose URL (recipient + subject only). 'default'
// returns a mailto: that hands off to the OS mail client.
export function buildComposeUrl(id: EmailProviderId, to: string, subject: string): string {
  const t = encodeURIComponent(to || '');
  const s = encodeURIComponent(subject || '');
  switch (normalizeProvider(id)) {
    case 'outlook365':
      return `https://outlook.office.com/mail/deeplink/compose?to=${t}&subject=${s}`;
    case 'outlookcom':
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${t}&subject=${s}`;
    case 'yahoo':
      return `https://compose.mail.yahoo.com/?to=${t}&subject=${s}`;
    case 'default':
      return `mailto:${t}?subject=${s}`;
    case 'gmail':
    default: {
      const params = new URLSearchParams({ view: 'cm', fs: '1', tf: '1' });
      if (to) params.set('to', to);
      if (subject) params.set('su', subject);
      return `https://mail.google.com/mail/?${params.toString()}`;
    }
  }
}

// mailto hands off to a desktop client rather than opening a web popup.
export function providerOpensMailto(id: EmailProviderId): boolean {
  return normalizeProvider(id) === 'default';
}
