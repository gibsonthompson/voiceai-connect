'use client';

// Knowledge base editor for the call-center business config. Edits the assembled
// knowledge_base_content the AI reads at call time, via the agency-scoped KB
// endpoint (GET/PUT /api/agency/:agencyId/clients/:clientId/knowledge-base), with
// a re-scan of the business website. Self-contained card with its own save.

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Loader2, Save, Check, RefreshCw } from 'lucide-react';

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

export default function CcKnowledgeBase({ agencyId, clientId, theme }: { agencyId: string; clientId: string; theme: any }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rescraping, setRescraping] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!agencyId || !clientId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/clients/${clientId}/knowledge-base`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); if (d.success) setContent(d.content || ''); }
    } catch { /* keep */ } finally { setLoading(false); }
  }, [agencyId, clientId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setErr(null); setSaved(false);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/clients/${clientId}/knowledge-base`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ content }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) { if (typeof d.content === 'string') setContent(d.content); setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setErr(d.error || 'Could not save.');
    } catch { setErr('Could not save.'); } finally { setSaving(false); }
  };

  const rescan = async () => {
    setRescraping(true); setErr(null);
    try {
      const r = await fetch(`${API()}/api/agency/${agencyId}/clients/${clientId}/knowledge-base/rescrape`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` }, body: '{}',
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) { await load(); }
      else setErr(d.error || 'Could not re-scan the website.');
    } catch { setErr('Could not re-scan the website.'); } finally { setRescraping(false); }
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const field = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text } as React.CSSProperties;

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={card}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><BookOpen className="h-4 w-4" style={{ color: theme.primary }} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Knowledge Base</h2>
          <p className="text-[12px]" style={{ color: theme.textMuted }}>What the AI knows about this business: services, FAQs, policies, anything a caller might ask.</p>
        </div>
        <button onClick={rescan} disabled={rescraping || loading} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium flex-shrink-0 disabled:opacity-50" style={{ backgroundColor: theme.hover, color: theme.textMuted }} title="Re-pull from the business website">
          {rescraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Re-scan site
        </button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm py-6 justify-center" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : (
        <>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} maxLength={20000}
            placeholder="Everything the AI should know to answer callers: what the business does, services and pricing, hours, policies, directions, common questions."
            className="w-full rounded-xl px-3 py-2.5 text-[13px] leading-relaxed outline-none resize-y font-mono" style={field} />
          <div className="flex items-center justify-between gap-3 mt-3">
            <span className="text-[12px]" style={{ color: err ? theme.error : theme.textMuted }}>
              {err ? err : saved ? <span className="inline-flex items-center gap-1.5" style={{ color: theme.success }}><Check className="h-4 w-4" /> Saved</span> : `${content.length.toLocaleString()} characters`}
            </span>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Knowledge Base
            </button>
          </div>
        </>
      )}
    </div>
  );
}
