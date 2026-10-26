'use client';

import { useState, useEffect, useCallback } from 'react';

// White-label transactional email: lets an agency authenticate its own sending
// domain so the platform sends their clients' emails FROM the agency's domain.
// Gated behind the agency's paid flag (white_label_email_enabled); the backend
// GET returns `enabled` and the whole card renders a locked state when it's off.

type Theme = {
  text: string; textMuted: string; primary: string; primaryText: string;
  isDark: boolean; input: string; inputBorder: string; bg: string;
};
type DnsRecord = { label: string; type: string; host: string; value: string; status?: boolean };
type Status = 'none' | 'pending' | 'authenticated' | 'failed';

export default function EmailDomainCard({ theme, agencyId }: { theme: Theme; agencyId?: string }) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<Status>('none');
  const [domainInput, setDomainInput] = useState('');
  const [connectedDomain, setConnectedDomain] = useState<string | null>(null);
  const [fromAddress, setFromAddress] = useState<string | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const authHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  const applyState = (d: any) => {
    setEnabled(d.enabled === true);
    setStatus((d.status as Status) || 'none');
    setConnectedDomain(d.domain || null);
    setFromAddress(d.fromAddress || null);
    setRecords(Array.isArray(d.records) ? d.records : []);
    if (d.domain && !domainInput) setDomainInput(d.domain);
  };

  const load = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/email-domain`, { headers: authHeaders() });
      if (r.ok) applyState(await r.json());
    } catch { /* leave defaults */ }
    finally { setLoading(false); }
  }, [agencyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const connect = async () => {
    if (!agencyId || !domainInput.trim()) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/email-domain`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ domain: domainInput.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.message || d.error || 'Could not connect that domain.'); }
      else applyState(d);
    } catch { setError('Something went wrong connecting that domain.'); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    if (!agencyId) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/email-domain/verify`, { method: 'POST', headers: authHeaders() });
      const d = await r.json();
      if (!r.ok) { setError(d.message || d.error || 'Could not verify yet.'); }
      else {
        applyState(d);
        if (d.status !== 'authenticated') setError('Not verified yet. DNS changes can take a few minutes to a few hours. Add all the records, then check again.');
      }
    } catch { setError('Something went wrong checking the records.'); }
    finally { setBusy(false); }
  };

  const disconnect = async () => {
    if (!agencyId) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/email-domain`, { method: 'DELETE', headers: authHeaders() });
      if (r.ok) { setStatus('none'); setConnectedDomain(null); setFromAddress(null); setRecords([]); setDomainInput(''); }
    } catch { setError('Could not disconnect.'); }
    finally { setBusy(false); }
  };

  const copy = (text: string, key: string) => {
    try { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500); } catch { /* ignore */ }
  };

  const card: React.CSSProperties = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 12, padding: 20 };
  const fieldStyle: React.CSSProperties = { backgroundColor: theme.bg, border: `1px solid ${theme.inputBorder}`, color: theme.text };

  if (loading) {
    return <div style={card}><p className="text-sm" style={{ color: theme.textMuted }}>Loading email domain…</p></div>;
  }

  // Locked: feature not enabled for this agency.
  if (!enabled) {
    return (
      <div style={{ ...card, opacity: 0.85 }}>
        <h4 className="font-medium text-sm sm:text-base mb-1" style={{ color: theme.text }}>Send client emails from your own domain</h4>
        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: theme.textMuted }}>
          Add-on: send your clients&apos; transactional emails from your own domain (e.g. notifications@youragency.com) instead of a shared address, so they never see the platform&apos;s name. Contact us to turn this on for your account.
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <h4 className="font-medium text-sm sm:text-base mb-1" style={{ color: theme.text }}>Send client emails from your own domain</h4>
      <p className="text-xs sm:text-sm leading-relaxed mb-3" style={{ color: theme.textMuted }}>
        Authenticate a domain you own so your clients&apos; emails send from your brand (e.g. notifications@youragency.com). Add the DNS records below, then verify.
      </p>

      {status === 'authenticated' && (
        <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.inputBorder}` }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <span className="text-sm font-semibold" style={{ color: theme.text }}>Connected</span>
          </div>
          <p className="text-xs" style={{ color: theme.textMuted }}>Client emails send from <span style={{ color: theme.text }}>{fromAddress}</span></p>
        </div>
      )}

      {status === 'none' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text" value={domainInput} onChange={(e) => setDomainInput(e.target.value)}
            placeholder="youragency.com" spellCheck={false} autoCapitalize="none" autoCorrect="off"
            className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm focus:outline-none" style={fieldStyle}
          />
          <button type="button" onClick={connect} disabled={busy || !domainInput.trim()}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 flex-shrink-0"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            {busy ? 'Connecting…' : 'Connect domain'}
          </button>
        </div>
      )}

      {(status === 'pending' || status === 'failed') && records.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>Add these DNS records at your domain registrar</p>
          <div className="space-y-2">
            {records.map((rec, i) => (
              <div key={i} className="rounded-lg p-3" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.inputBorder}` }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: theme.text }}>{rec.label} <span style={{ color: theme.textMuted }}>({rec.type})</span></span>
                  {rec.status ? <span className="text-[11px] font-semibold" style={{ color: '#22c55e' }}>Verified</span> : <span className="text-[11px]" style={{ color: theme.textMuted }}>Pending</span>}
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]" style={{ color: theme.textMuted }}>
                  <span>Host</span>
                  <button type="button" onClick={() => copy(rec.host, `h${i}`)} className="text-left break-all hover:underline" style={{ color: theme.text }}>{rec.host || '@'}{copied === `h${i}` ? '  ✓ copied' : ''}</button>
                  <span>Value</span>
                  <button type="button" onClick={() => copy(rec.value, `v${i}`)} className="text-left break-all hover:underline" style={{ color: theme.text }}>{rec.value}{copied === `v${i}` ? '  ✓ copied' : ''}</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button type="button" onClick={verify} disabled={busy}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {busy ? 'Checking…' : 'Verify records'}
            </button>
            <button type="button" onClick={disconnect} disabled={busy} className="text-xs font-medium hover:opacity-70" style={{ color: theme.textMuted }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === 'authenticated' && (
        <button type="button" onClick={disconnect} disabled={busy} className="text-xs font-medium hover:opacity-70 mt-1" style={{ color: theme.textMuted }}>
          Disconnect domain
        </button>
      )}

      {error && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  );
}
