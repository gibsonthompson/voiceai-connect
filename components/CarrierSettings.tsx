'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, AlertCircle, Loader2, Trash2, Plus, Server, ChevronDown, Shield } from 'lucide-react';

// ============================================================================
// CarrierSettings — Bring Your Own Carrier (BYOC)
// Manage per-agency external SIP carrier profiles so clients can keep their
// existing number on their own/local carrier. Mirrors BYOTSettings' house style
// and theme prop. Dropdowns are custom (no native <select>, per standing rule).
// Talks to /api/agency/:agencyId/carriers (GET/POST/PATCH/DELETE + /:id/test).
// ============================================================================

interface Carrier {
  id: string;
  name: string;
  gateway_ips: string[];
  auth_type: 'ip' | 'credential';
  auth_username: string | null;
  has_auth_password: boolean;
  sip_realm: string | null;
  region: 'us' | 'eu';
  codec: string;
  credential_ready: boolean;
  verified_at: string | null;
  vapi_signaling_ips: string[];
  vapi_rtp_range: string;
}

interface CarrierSettingsProps {
  agencyId: string;
  theme: any;
}

interface TestResult {
  success: boolean;
  error?: string;
  message?: string;
  inbound_target_format?: string;
  allowlist_signaling_ips?: string[];
  allowlist_rtp?: string;
}

// Custom themed dropdown (no native <select>).
function ThemedSelect({
  value, onChange, options, theme, disabled, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  theme: any;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors disabled:opacity-50"
        style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: selected ? theme.text : theme.textMuted }}
      >
        <span>{selected ? selected.label : (placeholder || 'Select...')}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: theme.textMuted }} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: theme.isDark ? '#232321' : '#ffffff', border: `1px solid ${theme.inputBorder}` }}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors"
              style={{ color: theme.text, backgroundColor: o.value === value ? (theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = o.value === value ? (theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent'; }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  name: '', gateway_ips: '', auth_type: 'ip' as 'ip' | 'credential',
  auth_username: '', auth_password: '', sip_realm: '', region: 'us' as 'us' | 'eu', codec: 'g711',
};

export default function CarrierSettings({ agencyId, theme }: CarrierSettingsProps) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  const fetchCarriers = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/agency/${agencyId}/carriers`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setCarriers(Array.isArray(data.carriers) ? data.carriers : []);
      }
    } catch (err) {
      console.error('Failed to fetch carriers:', err);
    } finally {
      setLoading(false);
    }
  }, [agencyId, API_BASE]);

  useEffect(() => { fetchCarriers(); }, [fetchCarriers]);

  const resetForm = () => { setForm({ ...EMPTY_FORM }); setShowForm(false); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/agency/${agencyId}/carriers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          gateway_ips: form.gateway_ips,
          auth_type: form.auth_type,
          region: form.region,
          codec: form.codec,
          ...(form.auth_type === 'credential' ? { auth_username: form.auth_username, auth_password: form.auth_password, sip_realm: form.sip_realm } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: `Carrier "${data.carrier.name}" added.` });
        resetForm();
        fetchCarriers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save carrier' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    setTestResults((prev) => { const n = { ...prev }; delete n[id]; return n; });
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/agency/${agencyId}/carriers/${id}/test`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [id]: data }));
      if (data.success) fetchCarriers();
    } catch (err) {
      setTestResults((prev) => ({ ...prev, [id]: { success: false, message: 'Network error.' } }));
    } finally {
      setTesting(null);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove carrier "${name}"? Clients already using it keep working; their carrier link clears.`)) return;
    setRemoving(id);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/agency/${agencyId}/carriers/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { setMessage({ type: 'success', text: 'Carrier removed.' }); fetchCarriers(); }
      else setMessage({ type: 'error', text: 'Failed to remove carrier.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded" style={{ backgroundColor: theme.hover }} />
          <div className="h-4 w-full rounded" style={{ backgroundColor: theme.hover }} />
          <div className="h-10 w-full rounded" style={{ backgroundColor: theme.hover }} />
        </div>
      </div>
    );
  }

  const fieldStyle = { backgroundColor: theme.isDark ? '#050505' : '#f9fafb', border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-medium mb-1">Carriers (Bring Your Own Carrier)</h3>
        <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
          Connect a client&apos;s own or local carrier over SIP so they keep their existing number. When you add a client, pick the carrier under &quot;AI phone number&quot;.
        </p>
      </div>

      {/* Existing carriers */}
      {carriers.length > 0 && (
        <div className="space-y-3">
          {carriers.map((c) => {
            const tr = testResults[c.id];
            return (
              <div key={c.id} className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: theme.primary + '08', border: `1px solid ${theme.primary}30` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary + '15' }}>
                      <Server className="h-5 w-5" style={{ color: theme.iconColor }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{c.name}</p>
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>{c.region}</span>
                        {c.verified_at ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.primary + '15', color: theme.primary }}>
                            <Check className="h-3 w-3" /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.hover, color: theme.textMuted }}>Not tested</span>
                        )}
                      </div>
                      <p className="text-xs mt-1 font-mono truncate" style={{ color: theme.textMuted }}>
                        {(c.gateway_ips || []).join(', ') || 'no gateway IPs'} · {c.auth_type === 'credential' ? 'credential auth' : 'IP auth'} · {c.codec}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleTest(c.id)} disabled={testing === c.id} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                      {testing === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                      Test
                    </button>
                    <button onClick={() => handleRemove(c.id, c.name)} disabled={removing === c.id} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}`, color: theme.errorText }}>
                      {removing === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {tr && (
                  <div className="mt-3 rounded-xl p-3 text-xs" style={{ backgroundColor: tr.success ? theme.primary + '08' : theme.errorBg, border: `1px solid ${tr.success ? theme.primary + '30' : theme.errorBorder}`, color: tr.success ? theme.text : theme.errorText }}>
                    <p className="font-medium" style={{ color: tr.success ? theme.primary : theme.errorText }}>{tr.message || tr.error}</p>
                    {tr.success && (
                      <div className="mt-2 space-y-1" style={{ color: theme.textMuted }}>
                        <p>Point your carrier at: <span className="font-mono" style={{ color: theme.text }}>{tr.inbound_target_format}</span></p>
                        <p>Allowlist signaling IPs: <span className="font-mono" style={{ color: theme.text }}>{(tr.allowlist_signaling_ips || []).join(', ')}</span></p>
                        <p>Allowlist media: <span className="font-mono" style={{ color: theme.text }}>{tr.allowlist_rtp}</span></p>
                        <p>Then place one real inbound call to confirm the interconnect.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add-carrier form */}
      {showForm ? (
        <form onSubmit={handleSave} className="rounded-xl p-4 sm:p-5 space-y-4" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5">Carrier name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Digicel Bermuda" className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors" style={fieldStyle} required />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5">Region</label>
              <ThemedSelect value={form.region} onChange={(v) => setForm({ ...form, region: v as 'us' | 'eu' })} theme={theme} options={[{ value: 'us', label: 'US (sip.vapi.ai)' }, { value: 'eu', label: 'EU (sip.eu.vapi.ai, Premier only)' }]} />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5">SIP gateway IP addresses</label>
            <input type="text" value={form.gateway_ips} onChange={(e) => setForm({ ...form, gateway_ips: e.target.value })} placeholder="192.0.2.10, 198.51.100.20" className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-mono transition-colors" style={fieldStyle} required />
            <p className="mt-1 text-[10px]" style={{ color: theme.textMuted }}>IP addresses only, comma or space separated. Hostnames (e.g. sip.carrier.com) are rejected by VAPI.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5">Authentication</label>
              <ThemedSelect value={form.auth_type} onChange={(v) => setForm({ ...form, auth_type: v as 'ip' | 'credential' })} theme={theme} options={[{ value: 'ip', label: 'IP-based (allowlist)' }, { value: 'credential', label: 'Username / password' }]} />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5">Codec</label>
              <ThemedSelect value={form.codec} onChange={(v) => setForm({ ...form, codec: v })} theme={theme} options={[{ value: 'g711', label: 'G.711 (safe default)' }, { value: 'g711u', label: 'G.711 µ-law' }, { value: 'g711a', label: 'G.711 a-law' }, { value: 'opus', label: 'OPUS' }]} />
            </div>
          </div>

          {form.auth_type === 'credential' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">SIP username</label>
                <input type="text" value={form.auth_username} onChange={(e) => setForm({ ...form, auth_username: e.target.value })} className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors" style={fieldStyle} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">SIP password</label>
                <input type="password" value={form.auth_password} onChange={(e) => setForm({ ...form, auth_password: e.target.value })} className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-colors" style={fieldStyle} />
                <p className="mt-1 text-[10px]" style={{ color: theme.textMuted }}>Encrypted before storage, never shown again.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium mb-1.5">SIP realm <span className="font-normal" style={{ color: theme.textMuted }}>(optional)</span></label>
                <input type="text" value={form.sip_realm} onChange={(e) => setForm({ ...form, sip_realm: e.target.value })} placeholder="sip.carrier.com" className="w-full rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-mono transition-colors" style={fieldStyle} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {saving ? (<span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving...</span>) : 'Add carrier'}
            </button>
            <button type="button" onClick={resetForm} disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50" style={{ color: theme.textMuted }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => { setShowForm(true); setMessage(null); }} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          <Plus className="h-4 w-4" /> Add a carrier
        </button>
      )}

      {message && (
        <div className="rounded-xl p-3 flex items-center gap-2 text-xs" style={{ backgroundColor: message.type === 'success' ? theme.primary + '08' : theme.errorBg, border: `1px solid ${message.type === 'success' ? theme.primary + '30' : theme.errorBorder}`, color: message.type === 'success' ? theme.primary : theme.errorText }}>
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}
