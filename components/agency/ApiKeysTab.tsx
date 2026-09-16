'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Copy, Trash2, Check, Loader2, AlertCircle, Lock, Terminal } from 'lucide-react';

// Self-contained API-keys panel. Rendered from the agency Settings page as a tab:
//   {activeTab === 'developer' && <ApiKeysTab agency={agency} theme={theme} />}
// Takes agency + theme as props so it needs no context wiring.

interface ApiKey {
  id: string;
  name: string;
  scope: 'read' | 'read_write';
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiKeysTab({ agency, theme }: { agency: any; theme: any }) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const isTrialing = ['trialing', 'trial'].includes(agency?.subscription_status || '');
  const isScale = (isTrialing ? 'scale' : agency?.plan_type) === 'scale';

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newScope, setNewScope] = useState<'read' | 'read_write'>('read_write');
  const [showCreate, setShowCreate] = useState(false);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  });

  const loadKeys = async () => {
    if (!agency?.id || !isScale) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/api-keys`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setKeys(d.keys || []); }
      else setError('Could not load API keys.');
    } catch (e) { setError('Could not load API keys.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadKeys(); /* eslint-disable-next-line */ }, [agency?.id, isScale]);

  const handleCreate = async () => {
    setCreating(true); setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/api-keys`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ name: newName.trim() || 'API key', scope: newScope }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.message || d.error || 'Could not create key.'); return; }
      setFreshKey(d.key);
      setKeys((prev) => [{ id: d.id, name: d.name, scope: d.scope, key_prefix: d.key_prefix, last_used_at: null, created_at: d.created_at }, ...prev]);
      setNewName(''); setNewScope('read_write'); setShowCreate(false);
    } catch (e) { setError('Could not create key.'); }
    finally { setCreating(false); }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agency.id}/api-keys/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) { /* ignore */ }
    finally { setRevoking(null); }
  };

  const copyKey = () => { if (freshKey) { navigator.clipboard.writeText(freshKey); setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  // Non-Scale: show what the API is + an upgrade path.
  if (!isScale) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div><h3 className="text-base sm:text-lg font-medium mb-1">API Access</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Manage clients, pull call transcripts, and wire VoiceAI Connect into your own tools.</p></div>
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-3" style={{ backgroundColor: theme.primary15 }}><Lock className="h-5 w-5" style={{ color: theme.primary }} /></div>
          <p className="text-sm font-medium mb-1">The API is a Scale feature</p>
          <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>Upgrade to Scale to create API keys and integrate programmatically.</p>
          <a href="/agency/settings?tab=billing" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>Upgrade to Scale</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="text-base sm:text-lg font-medium mb-1">API Keys</h3><p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Authenticate requests to the VoiceAI Connect API. Keep keys secret, treat them like passwords.</p></div>
        {!showCreate && (<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}><Plus className="h-4 w-4" />New key</button>)}
      </div>

      {error && (<div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}><AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: theme.errorText }} /><p className="text-xs sm:text-sm" style={{ color: theme.errorText }}>{error}</p></div>)}

      {freshKey && (
        <div className="rounded-xl p-4" style={{ backgroundColor: theme.primary15, border: `1px solid ${theme.primary30}` }}>
          <div className="flex items-center gap-2 mb-2"><Check className="h-4 w-4" style={{ color: theme.primary }} /><p className="text-sm font-medium" style={{ color: theme.primary }}>Key created. Copy it now, you won't see it again.</p></div>
          <div className="flex items-stretch gap-2">
            <code className="flex-1 min-w-0 rounded-lg px-3 py-2 text-xs font-mono break-all" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}>{freshKey}</code>
            <button onClick={copyKey} className="inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-medium flex-shrink-0" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <button onClick={() => setFreshKey(null)} className="mt-3 text-xs underline" style={{ color: theme.textMuted }}>Done</button>
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
          <div><label className="block text-xs sm:text-sm font-medium mb-1.5">Key name</label><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. CRM sync" className="w-full rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${theme.inputBorder}`, color: theme.text }} /></div>
          <div><label className="block text-xs sm:text-sm font-medium mb-1.5">Access</label><div className="flex gap-2">
            {(['read_write', 'read'] as const).map((s) => (<button key={s} onClick={() => setNewScope(s)} className="flex-1 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium" style={{ backgroundColor: newScope === s ? theme.primary15 : 'transparent', border: `1px solid ${newScope === s ? theme.primary30 : theme.inputBorder}`, color: newScope === s ? theme.primary : theme.textMuted }}>{s === 'read_write' ? 'Read & write' : 'Read only'}</button>))}
          </div></div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCreate} disabled={creating} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}Create key</button>
            <button onClick={() => { setShowCreate(false); setNewName(''); }} className="rounded-xl px-4 py-2 text-sm font-medium" style={{ backgroundColor: 'transparent', border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted }} /></div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}><Key className="h-6 w-6 mx-auto mb-2" style={{ color: theme.textMuted }} /><p className="text-sm" style={{ color: theme.textMuted }}>No API keys yet. Create one to get started.</p></div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium truncate">{k.name}</p><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.primary15, color: theme.primary }}>{k.scope === 'read_write' ? 'read & write' : 'read only'}</span></div>
                <p className="text-xs font-mono mt-0.5" style={{ color: theme.textMuted }}>{k.key_prefix}...</p>
                <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>{k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}` : 'Never used'} &middot; Created {new Date(k.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleRevoke(k.id)} disabled={revoking === k.id} title="Revoke" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium flex-shrink-0 disabled:opacity-50" style={{ backgroundColor: 'transparent', border: `1px solid ${theme.inputBorder}`, color: theme.errorText }}>{revoking === k.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Revoke</button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl p-4" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.inputBorder}` }}>
        <div className="flex items-center gap-2 mb-2"><Terminal className="h-4 w-4" style={{ color: theme.textMuted }} /><p className="text-sm font-medium">Quick start</p></div>
        <code className="block rounded-lg px-3 py-2 text-[11px] font-mono break-all" style={{ backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : '#fff', border: `1px solid ${theme.inputBorder}`, color: theme.textMuted }}>curl {backendUrl}/api/v1/clients -H &quot;Authorization: Bearer YOUR_KEY&quot;</code>
      </div>
    </div>
  );
}