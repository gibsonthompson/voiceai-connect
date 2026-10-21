'use client';

// ============================================================================
// ADDITIONAL DEMO NUMBERS (Pro / Scale)
// ----------------------------------------------------------------------------
// The agency's primary demo lives on the main Demo Phone screen. This lists any
// EXTRA demo numbers (one row per number in agency_demo_numbers), lets the
// agency add up to the cap, give each one a label (traffic source) and its own
// greeting / voice / prompt via the shared DemoCustomizer, and delete them.
// Backend: GET/POST /api/agency/:id/demo-numbers, GET/PATCH/DELETE .../:demoId.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { Phone, Plus, Loader2, Trash2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import DemoCustomizer from '@/components/agency/DemoCustomizer';

interface DemoRow {
  id: string;
  phone_number: string | null;
  label: string | null;
  status: 'provisioning' | 'active' | 'error';
  provisioning_error: string | null;
  country: string | null;
  call_count?: number;
  text_count?: number;
}

interface Props {
  agencyId: string;
  theme: any;
  country: string;      // agency country, decides US area-code vs BYOT
  byotEnabled: boolean;
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

function formatPhone(n: string | null): string {
  if (!n) return '';
  const d = n.replace(/\D/g, '');
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return n;
}

export default function AdditionalDemoNumbers({ agencyId, theme, country, byotEnabled }: Props) {
  const isUS = (country || 'US').toUpperCase() === 'US';
  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [max, setMax] = useState(4);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [areaCode, setAreaCode] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/demo-numbers`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.ok) {
        const d = await r.json();
        setDemos(Array.isArray(d.demos) ? d.demos : []);
        if (typeof d.max === 'number') setMax(d.max);
      }
    } catch { /* non-fatal */ } finally { setLoading(false); }
  }, [agencyId]);

  useEffect(() => { load(); }, [load]);

  // Poll a provisioning row until it goes active or errors, then refresh.
  const pollRow = useCallback(async (id: string) => {
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const r = await fetch(`${backendUrl}/api/agency/${agencyId}/demo-numbers/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (r.ok) {
          const d = await r.json();
          const st = d.demo?.status;
          if (st === 'active' || st === 'error') { await load(); setAdding(false); if (st === 'error') setError(d.demo?.provisioning_error || 'Provisioning failed.'); return; }
        }
      } catch { /* keep polling */ }
    }
    await load(); setAdding(false);
  }, [agencyId, load]);

  const handleAdd = async () => {
    setError('');
    if (isUS && areaCode && !/^\d{3}$/.test(areaCode)) { setError('Enter a valid 3-digit area code, or leave it blank.'); return; }
    setAdding(true);
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/demo-numbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...(isUS && areaCode ? { area_code: areaCode } : {}), label: label.trim() || undefined }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.message || d.error || 'Could not add a demo number.'); setAdding(false); return; }
      setShowAdd(false); setAreaCode(''); setLabel('');
      await load();
      if (d.id) pollRow(d.id);
      else setAdding(false);
    } catch {
      setError('Could not reach the server. Please try again.'); setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/demo-numbers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      if (r.ok) { if (expanded === id) setExpanded(null); await load(); }
      else { const d = await r.json().catch(() => ({})); setError(d.error || 'Could not remove that demo number.'); }
    } catch { setError('Could not reach the server. Please try again.'); }
  };

  const atCap = demos.length >= max;

  return (
    <div className="rounded-xl p-5 sm:p-6 mb-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Phone className="h-4 w-4" style={{ color: theme.primary }} />
        <h3 className="font-semibold text-base sm:text-lg" style={{ color: theme.text }}>Additional Demo Numbers</h3>
      </div>
      <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>
        Add more demo lines, each with its own greeting, voice, and instructions, so different traffic sources get different experiences. Up to {max} extra.
      </p>

      {loading ? (
        <div className="py-6 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted }} /></div>
      ) : (
        <>
          {demos.length > 0 && (
            <div className="space-y-3 mb-4">
              {demos.map((d) => (
                <div key={d.id} className="rounded-xl" style={{ border: `1px solid ${theme.border}` }}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate" style={{ color: theme.text }}>{d.label || 'Demo line'}</span>
                        {d.status === 'active' && d.phone_number && (
                          <span className="text-sm font-mono" style={{ color: theme.textMuted }}>{formatPhone(d.phone_number)}</span>
                        )}
                        {d.status === 'provisioning' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: theme.textMuted }}><Loader2 className="h-3 w-3 animate-spin" /> Setting up...</span>
                        )}
                        {d.status === 'error' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: theme.errorText || '#dc2626' }}><AlertCircle className="h-3 w-3" /> Failed</span>
                        )}
                      </div>
                      {d.status === 'active' && (
                        <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
                          {(d.call_count || 0)} call{(d.call_count || 0) === 1 ? '' : 's'} · {(d.text_count || 0)} text{(d.text_count || 0) === 1 ? '' : 's'} on this line
                        </p>
                      )}
                      {d.status === 'error' && d.provisioning_error && (
                        <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>{d.provisioning_error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {d.status === 'active' && (
                        <button onClick={() => setExpanded(expanded === d.id ? null : d.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium" style={{ border: `1px solid ${theme.border}`, color: theme.text }}>
                          {expanded === d.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />} Experience
                        </button>
                      )}
                      <button onClick={() => handleDelete(d.id)} className="inline-flex items-center justify-center rounded-lg p-1.5" style={{ border: `1px solid ${theme.border}`, color: theme.errorText || '#dc2626' }} title="Remove this demo number">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {d.status === 'active' && expanded === d.id && (
                    <div className="px-4 pb-4">
                      <DemoCustomizer agencyId={agencyId} theme={theme} demoNumberId={d.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-xs sm:text-sm mb-3" style={{ color: theme.errorText || '#dc2626' }}>{error}</p>}

          {!atCap ? (
            !showAdd ? (
              <button onClick={() => { setShowAdd(true); setError(''); }} disabled={adding} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText || '#fff' }}>
                {adding ? <><Loader2 className="h-4 w-4 animate-spin" /> Setting up...</> : <><Plus className="h-4 w-4" /> Add demo number</>}
              </button>
            ) : (
              <div className="rounded-xl p-4" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                {!isUS && !byotEnabled ? (
                  <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                    Demo numbers outside the US are provisioned on your own Twilio account. Connect Twilio in Settings, then add a demo number here.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                      <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="Label (e.g. Website, Google Ads)" className="flex-1 rounded-lg px-2.5 py-2 text-sm" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }} />
                      {isUS && (
                        <input value={areaCode} onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))} maxLength={3} placeholder="Area code (optional)" className="sm:w-44 rounded-lg px-2.5 py-2 text-sm" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }} />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleAdd} disabled={adding} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText || '#fff' }}>
                        {adding ? <><Loader2 className="h-4 w-4 animate-spin" /> Setting up...</> : <>Create demo number</>}
                      </button>
                      <button onClick={() => { setShowAdd(false); setError(''); }} className="text-sm" style={{ color: theme.textMuted }}>Cancel</button>
                    </div>
                    <p className="text-[11px] mt-2" style={{ color: theme.textMuted }}>
                      This provisions a new live number (about a minute). After it is set up, open Experience to give it its own greeting and voice.
                    </p>
                  </>
                )}
              </div>
            )
          ) : (
            <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>You have the maximum of {max} additional demo numbers.</p>
          )}
        </>
      )}
    </div>
  );
}
