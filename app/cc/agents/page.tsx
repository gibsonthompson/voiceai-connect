'use client';

// /cc/agents - agent management for the call center. Renders the shared team
// component (same team model, call-center labelling and per-agent business
// assignment). Self-contained so it has no cross-page import dependency.

import { useEffect, useState } from 'react';
import { Headset, Radio, Loader2, Send } from 'lucide-react';
import { useAgency } from '../../agency/context';
import { useTheme } from '../../../hooks/useTheme';
import AgencyTeamTab from '@/components/agency/AgencyTeamTab';

// A manager-only tool to fire a test escalation pop at the agents assigned to a
// chosen business, so the screen-pop + claim can be verified before a real
// caller ever triggers one. Harmless: it marks the offer as a test and never
// touches a live call.
function TestEscalationPop({ agencyId, theme }: { agencyId: string; theme: ReturnType<typeof useTheme> }) {
  const [businesses, setBusinesses] = useState<{ clientId: string; businessName: string }[]>([]);
  const [clientId, setClientId] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!agencyId) return;
    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const base = process.env.NEXT_PUBLIC_API_URL || '';
        const r = await fetch(`${base}/api/agency/${agencyId}/live-calls`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          const d = await r.json();
          const list = Array.isArray(d.businesses) ? d.businesses : [];
          setBusinesses(list);
          if (list[0]) setClientId(list[0].clientId);
        }
      } catch { /* ignore */ }
    })();
  }, [agencyId]);

  const send = async () => {
    if (!clientId) return;
    setSending(true); setResult(null);
    try {
      const token = localStorage.getItem('auth_token');
      const base = process.env.NEXT_PUBLIC_API_URL || '';
      const r = await fetch(`${base}/api/cc/${agencyId}/agents/test-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clientId }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) setResult(d.offered > 0 ? `Sent to ${d.offered} available agent${d.offered === 1 ? '' : 's'}.` : (d.note || 'No available agents assigned to that business.'));
      else setResult(d.error || 'Could not send the test pop.');
    } catch { setResult('Could not send the test pop.'); }
    finally { setSending(false); }
  };

  if (businesses.length === 0) return null;

  return (
    <div className="mt-8 max-w-3xl rounded-2xl p-4 sm:p-5" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Radio className="h-4 w-4" style={{ color: theme.primary }} />
        <h3 className="text-sm font-semibold" style={{ color: theme.text }}>Test the escalation pop</h3>
      </div>
      <p className="text-[13px] mb-3" style={{ color: theme.textMuted }}>
        Fire a sample pop at the available agents assigned to a business. They see the same screen-pop a real escalation produces, with no live caller.
      </p>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
        >
          {businesses.map((b) => <option key={b.clientId} value={b.clientId}>{b.businessName}</option>)}
        </select>
        <button
          onClick={send}
          disabled={sending || !clientId}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60"
          style={{ backgroundColor: theme.primary, color: theme.primaryText }}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send test pop
        </button>
      </div>
      {result && <p className="text-[13px] mt-2.5" style={{ color: theme.textMuted }}>{result}</p>}
    </div>
  );
}

export default function CallCenterAgents() {
  const { agency } = useAgency();
  const theme = useTheme();

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
          <Headset className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>Agents</h1>
          <p className="text-xs sm:text-[13px]" style={{ color: theme.textMuted }}>Add agents and assign each one the businesses they monitor and handle calls for.</p>
        </div>
      </div>
      <div className="max-w-3xl">
        <AgencyTeamTab agencyId={agency?.id || ''} theme={theme} />
      </div>
      <TestEscalationPop agencyId={agency?.id || ''} theme={theme} />
    </div>
  );
}
