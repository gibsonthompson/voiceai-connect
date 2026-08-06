'use client';

// ============================================================================
// CONTACT AGENCY MODAL (client dashboard -> owning agency)
// Destination: components/ContactAgencyModal.tsx
// ----------------------------------------------------------------------------
// A "Contact <agency>" button + modal for the client dashboard. Posts the
// client's message to the owning agency's dashboard Inbox
// (agency_support_requests, source='client_dashboard'). Prefilled from the
// client session (email + owner name). No email/SMS is sent; the agency reads
// it in their dashboard and follows up.
//
// POST /api/agency/:agencyId/support-requests/from-client  (Bearer auth_token)
// The agency id comes from client.agency_id; the backend re-verifies ownership.
//
// The overlay is rendered through a portal to document.body. The dashboard
// cards use backdrop-filter (the glass style), which creates stacking contexts,
// and the app is scaled; a plain fixed overlay nested inside that gets trapped
// (no full-page backdrop, anchors to the top, and the dashboard cards paint
// over it). Portaling to <body> escapes every ancestor stacking context so the
// overlay covers the real viewport and sits above everything.
//
// Styled with useClientTheme so it matches the client dashboard palette.
// Usage:  <ContactAgencyButton client={client} agencyName={branding.agencyName} />
// ============================================================================

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send, Loader2, Check } from 'lucide-react';
import { useClientTheme } from '@/hooks/useClientTheme';

// Above any app chrome (floating help bubble, sticky headers, etc.).
const OVERLAY_Z = 2147483000;

function hexToRgba(hex: string, alpha: number): string {
  const c = (hex || '#10b981').replace('#', '');
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(16,185,129,${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ContactAgencyButton({ client, agencyName }: { client: any; agencyName?: string }) {
  const theme = useClientTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(client?.owner_name || '');
  const [contact, setContact] = useState(client?.email || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Portals need document, which only exists in the browser.
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll and wire Escape-to-close while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const label = agencyName ? `Contact ${agencyName}` : 'Contact support';

  const reset = () => { setMessage(''); setDone(false); setError(''); setSending(false); };
  const close = () => { setOpen(false); setTimeout(reset, 200); };

  const submit = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/${client.agency_id}/support-requests/from-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: message.trim(),
          name: name.trim() || undefined,
          contact: contact.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setDone(true);
    } catch {
      setError('Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    border: `1px solid ${theme.border}`,
    color: theme.text,
  };

  const overlay = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: OVERLAY_Z, backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h3 className="text-sm font-semibold" style={{ color: theme.text }}>{label}</h3>
          <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: theme.textMuted }} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {done ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: hexToRgba(theme.primary, 0.15) }}>
                <Check className="h-7 w-7" style={{ color: theme.primary }} />
              </div>
              <h4 className="text-base font-semibold mb-1.5" style={{ color: theme.text }}>Message sent</h4>
              <p className="text-sm" style={{ color: theme.textMuted }}>
                {agencyName || 'Your provider'} will follow up with you directly.
              </p>
              <button onClick={close} className="mt-4 text-xs font-medium" style={{ color: theme.primary }}>
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
                Send a message to {agencyName || 'your provider'} and they will get back to you.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>Your name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>Email or phone</label>
                  <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@business.com"
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: theme.textMuted }}>Message</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
                    placeholder="How can we help?"
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors resize-none" style={inputStyle} />
                </div>
                {error && (
                  <div className="rounded-xl px-3.5 py-2.5 text-[12px] leading-snug"
                    style={{ backgroundColor: theme.errorBg, color: theme.error, border: `1px solid ${hexToRgba(theme.error || '#dc2626', 0.25)}` }}>
                    {error}
                  </div>
                )}
                <button
                  onClick={submit}
                  disabled={!message.trim() || sending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40"
                  style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                >
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {sending ? 'Sending...' : error ? 'Try Again' : 'Send Message'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
        style={{ backgroundColor: hexToRgba(theme.primary, 0.1), border: `1px solid ${hexToRgba(theme.primary, 0.25)}`, color: theme.primary }}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">Contact</span>
      </button>

      {mounted && open && createPortal(overlay, document.body)}
    </>
  );
}

export default ContactAgencyButton;