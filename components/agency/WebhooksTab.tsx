'use client';

import { useState, useEffect } from 'react';
import { Webhook, Plus, Copy, Trash2, Check, Loader2, AlertCircle, Lock, Send, Power } from 'lucide-react';
import UpgradeGate from './UpgradeGate';

// Self-contained webhooks panel. Rendered from Settings as a tab:
//   {activeTab === 'webhooks' && <WebhooksTab agency={agency} theme={theme} />}

interface Hook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'disabled';
  description: string | null;
  created_at: string;
  last_delivery_at: string | null;
  last_error: string | null;
}

export default function WebhooksTab({ agency, theme }: { agency: any; theme: any }) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const isTrialing = ['trialing', 'trial'].includes(agency?.subscription_status || '');
  const isScale = (isTrialing ? 'scale' : agency?.plan_type) === 'scale';

  const [hooks, setHooks] = useState<Hook[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [allEvents, setAllEvents] = useState(true);
  const [selEvents, setSelEvents] = useState<string[]>([]);
  const [freshSecret, setFreshSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pingMsg, setPingMsg] = useState<{ id: string; ok: boolean } | null>(null);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  });

  const load = async () => {
    if (!agency?.id || !isScale) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/webhooks`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setHooks(d.webhooks || []); setEventTypes(d.events || []); }
      else setError('Could not load webhooks.');
    } catch (e) { setError('Could not load webhooks.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [agency?.id, isScale]);

  const toggleEvent = (ev: string) => {
    setSelEvents((prev) => prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]);
  };

  const handleCreate = async () => {
    setCreating(true); setError(null);
    try {
      const events = allEvents ? ['*'] : selEvents;
      if (!allEvents && events.length === 0) { setError('Select at least one event.'); setCreating(false); return; }
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/webhooks`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ url: newUrl.trim(), events, description: newDesc.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.message || d.error || 'Could not create webhook.'); return; }
      setFreshSecret(d.secret);
      setHooks((prev) => [{ id: d.id, url: d.url, events: d.events, status: d.status, description: d.description, created_at: d.created_at, last_delivery_at: null, last_error: null }, ...prev]);
      setNewUrl(''); setNewDesc(''); setAllEvents(true); setSelEvents([]); setShowCreate(false);
    } catch (e) { setError('Could not create webhook.'); }
    finally { setCreating(false); }
  };

  const handlePing = async (id: string) => {
    setBusyId(id); setPingMsg(null);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/webhooks/${id}/ping`, { method: 'POST', headers: authHeaders() });
      const d = await res.json();
      setPingMsg({ id, ok: !!d.ok });
    } catch (e) { setPingMsg({ id, ok: false }); }
    finally { setBusyId(null); setTimeout(() => setPingMsg(null), 4000); }
  };

  const handleToggle = async (h: Hook) => {
    setBusyId(h.id);
    try {
      const next = h.status === 'active' ? 'disabled' : 'active';
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/webhooks/${h.id}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status: next }),
      });
      if (res.ok) setHooks((prev) => prev.map((x) => x.id === h.id ? { ...x, status: next } : x));
    } catch (e) { /* ignore */ }
    finally { setBusyId(null); }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/webhooks/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) setHooks((prev) => prev.filter((x) => x.id !== id));
    } catch (e) { /* ignore */ }
    finally { setBusyId(null); }
  };

  const copySecret = () => { if (freshSecret) { navigator.clipboard.writeText(freshSecret); setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  return (
    <UpgradeGate locked={!isScale} tier="scale" title="Unlock webhooks with Scale" description="Get a signed POST to your server the moment a call finishes, an appointment is booked, or a client is provisioned, so VoiceAI Connect can drive your CRM, notifications, and automations in real time instead of you polling for changes. Scale unlocks webhook endpoints." theme={theme}>
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="text-base sm:text-lg font-medium mb-1">Webhooks</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>We POST a signed event to your URL when things happen. Verify the signature with your secret.</p></div>
        {!showCreate && (<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><Plus className="h-4 w-4" />Add endpoint</button>)}
      </div>

      {error && (<div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-xs sm:text-sm" style={{ color: theme.errorText }}>{error}</p></div>)}

      {freshSecret && (
        <div className="rounded-xl p-4" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
          <div className="flex items-center gap-2 mb-2"><Check className="h-4 w-4" style={{ color: theme.primary }} /><p className="text-sm font-medium" style={{ color: theme.primary }}>Endpoint added. Copy your signing secret now, you won't see it again.</p></div>
          <div className="flex items-stretch gap-2">
            <code className="flex-1 min-w-0 rounded-lg px-3 py-2 text-xs font-mono break-all" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}>{freshSecret}</code>
            <button onClick={copySecret} className="inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-medium flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <button onClick={() => setFreshSecret(null)} className="mt-3 text-xs underline" style={{ color: theme.textMuted }}>Done</button>
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
          <div><label className="block text-xs sm:text-sm font-medium mb-1.5">Endpoint URL</label><input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://your-server.com/webhooks/voiceai" className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${theme.inputBorder}`, color: theme.text }} /></div>
          <div><label className="block text-xs sm:text-sm font-medium mb-1.5">Description (optional)</label><input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="e.g. CRM sync" className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${theme.inputBorder}`, color: theme.text }} /></div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5">Events</label>
            <label className="flex items-center gap-2 mb-2 cursor-pointer text-sm">
              <input type="checkbox" checked={allEvents} onChange={(e) => setAllEvents(e.target.checked)} />
              <span>All events</span>
            </label>
            {!allEvents && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {eventTypes.map((ev) => (
                  <label key={ev} className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm rounded-lg px-2 py-1.5" style={{ border: `1px solid ${theme.inputBorder}` }}>
                    <input type="checkbox" checked={selEvents.includes(ev)} onChange={() => toggleEvent(ev)} />
                    <span className="font-mono">{ev}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} disabled={creating} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4" />}Add endpoint</button>
            <button onClick={() => { setShowCreate(false); setNewUrl(''); setNewDesc(''); }} className="rounded-xl px-4 py-2 text-sm font-medium" style={{ backgroundColor: 'transparent', border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted }} /></div>
      ) : hooks.length === 0 ? (
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}><Webhook className="h-6 w-6 mx-auto mb-2" style={{ color: theme.textMuted }} /><p className="text-sm" style={{ color: theme.textMuted }}>No endpoints yet. Add one to receive events.</p></div>
      ) : (
        <div className="space-y-2">
          {hooks.map((h) => (
            <div key={h.id} className="rounded-xl px-4 py-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium font-mono truncate">{h.url}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: h.status === 'active' ? theme.primary15 : theme.errorBg, color: h.status === 'active' ? theme.primary : theme.errorText }}>{h.status}</span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: theme.textMuted }}>{(h.events || []).includes('*') ? 'All events' : (h.events || []).join(', ')}</p>
                  {h.description && <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>{h.description}</p>}
                  <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>{h.last_delivery_at ? `Last delivery ${new Date(h.last_delivery_at).toLocaleString()}` : 'No deliveries yet'}{h.last_error ? ` , last error: ${h.last_error}` : ''}</p>
                  {pingMsg && pingMsg.id === h.id && (<p className="text-[11px] mt-1 font-medium" style={{ color: pingMsg.ok ? theme.primary : theme.errorText }}>{pingMsg.ok ? 'Test event delivered.' : 'Test event failed to deliver.'}</p>)}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handlePing(h.id)} disabled={busyId === h.id} title="Send test event" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-50" style={{ backgroundColor: 'transparent', border: `1px solid ${theme.inputBorder}`, color: theme.text }}>{busyId === h.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Test</button>
                  <button onClick={() => handleToggle(h)} disabled={busyId === h.id} title={h.status === 'active' ? 'Disable' : 'Enable'} className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-50" style={{ backgroundColor: 'transparent', border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}><Power className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(h.id)} disabled={busyId === h.id} title="Delete" className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-50" style={{ backgroundColor: 'transparent', border: `1px solid ${theme.inputBorder}`, color: theme.errorText }}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </UpgradeGate>
  );
}