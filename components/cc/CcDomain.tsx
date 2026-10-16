'use client';

// Custom domain for the call-center white-label. Shows the connected domain and
// its verification state, lets the manager connect a domain (adds it to the
// platform's Vercel project and returns DNS records to set), verify it, or
// remove it. Uses the existing agency domain endpoints (Vercel-backed), which
// the call-center manager's token is authorized on. Self-contained card.

import { useState, useEffect, useCallback } from 'react';
import { Globe, Loader2, Check, AlertCircle, Link2Off, ShieldCheck } from 'lucide-react';

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

interface Status {
  configured: boolean;
  domain?: string;
  verified?: boolean;
  verification_records?: { type: string; name: string; value: string }[];
  dns_instructions?: Record<string, string>;
  misconfigured?: boolean;
}

export default function CcDomain({ agencyId, theme }: { agencyId: string; theme: any }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState<string | null>(null); // 'set' | 'verify' | 'remove'
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!agencyId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/domain/status`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) setStatus(await r.json());
    } catch { /* keep */ } finally { setLoading(false); }
  }, [agencyId]);

  useEffect(() => { load(); }, [load]);

  const act = async (kind: 'set' | 'verify' | 'remove') => {
    setBusy(kind); setErr(null);
    try {
      let r: Response;
      if (kind === 'set') {
        if (!input.trim()) { setErr('Enter a domain.'); setBusy(null); return; }
        r = await fetch(`${API()}/api/agency/${agencyId}/domain`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: JSON.stringify({ domain: input.trim() }) });
      } else if (kind === 'verify') {
        r = await fetch(`${API()}/api/agency/${agencyId}/domain/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: '{}' });
      } else {
        if (!confirm('Remove this custom domain?')) { setBusy(null); return; }
        r = await fetch(`${API()}/api/agency/${agencyId}/domain`, { method: 'DELETE', headers: { Authorization: `Bearer ${TOKEN()}` } });
      }
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || d.message || 'Request failed');
      if (kind === 'set') setInput('');
      await load();
    } catch (e: any) { setErr(e.message || 'Request failed'); } finally { setBusy(null); }
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={card}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Globe className="h-4 w-4" style={{ color: theme.primary }} /></div>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Custom domain</h2>
          <p className="text-[12px]" style={{ color: theme.textMuted }}>Run the dashboard on your own domain. SSL is provisioned automatically once DNS verifies.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-2" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Checking domain...</div>
      ) : status?.configured ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
            <div className="min-w-0 flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: status.verified ? theme.success : theme.warning }} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: theme.text }}>{status.domain}</p>
                <p className="text-[12px]" style={{ color: status.verified ? theme.success : theme.warning }}>{status.verified ? 'Verified and live' : 'Pending DNS verification'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!status.verified && <button onClick={() => act('verify')} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{busy === 'verify' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Verify</button>}
              <button onClick={() => act('remove')} disabled={!!busy} className="inline-flex items-center justify-center rounded-xl h-[34px] w-[34px] disabled:opacity-50" style={{ backgroundColor: theme.hover, color: theme.error }} title="Remove domain">{busy === 'remove' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />}</button>
            </div>
          </div>

          {!status.verified && (status.dns_instructions || status.verification_records?.length) && (
            <div className="rounded-xl px-4 py-3 text-[12.5px]" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>
              <p className="font-medium mb-1.5" style={{ color: theme.text }}>Add these DNS records at your registrar:</p>
              {status.dns_instructions && Object.values(status.dns_instructions).map((line, i) => <p key={i} className="font-mono text-[11.5px] leading-relaxed">{line}</p>)}
              {(status.verification_records || []).map((rec, i) => <p key={`v${i}`} className="font-mono text-[11.5px] leading-relaxed break-all">{rec.type} {rec.name} = {rec.value}</p>)}
              <p className="mt-1.5">DNS can take a few minutes to propagate, then hit Verify.</p>
            </div>
          )}
          {err && <p className="text-[12px] inline-flex items-center gap-1.5" style={{ color: theme.error }}><AlertCircle className="h-3.5 w-3.5" /> {err}</p>}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="dashboard.yourcallcenter.com" className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none" style={field} />
            <button onClick={() => act('set')} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold flex-shrink-0 disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{busy === 'set' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Connect</button>
          </div>
          {err && <p className="text-[12px] mt-2 inline-flex items-center gap-1.5" style={{ color: theme.error }}><AlertCircle className="h-3.5 w-3.5" /> {err}</p>}
          <p className="text-[11.5px] mt-2" style={{ color: theme.textSubtle }}>A subdomain like dashboard.yourcallcenter.com is easiest. You will get the DNS records to add after connecting.</p>
        </div>
      )}
    </div>
  );
}
