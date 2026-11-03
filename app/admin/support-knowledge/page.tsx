'use client';

// ============================================================================
// ADMIN SUPPORT KNOWLEDGE ("Support Brain")
// Destination: app/admin/support-knowledge/page.tsx
// Edit the single master knowledge base every support bot reads (the in-dashboard
// agency assistant and the marketing-site chat) plus a library of YouTube links
// the bots can share. Saves to platform_settings via the backend; edits go live
// within ~a minute, no deploy.
//   GET /api/admin/support-knowledge  -> { doc, videos }
//   PUT /api/admin/support-knowledge   { doc, videos }
// Auth: admin_token.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Save, Loader2, Check, Plus, Trash2, Video } from 'lucide-react';

const backendUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '');

interface VideoItem { title: string; url: string; }

export default function AdminSupportKnowledgePage() {
  const [doc, setDoc] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${backendUrl()}/api/admin/support-knowledge`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) throw new Error('load failed');
      const d = await r.json();
      setDoc(typeof d.doc === 'string' ? d.doc : '');
      setVideos(Array.isArray(d.videos) ? d.videos.map((v: any) => ({ title: String(v?.title || ''), url: String(v?.url || '') })) : []);
    } catch {
      setError('Could not load the knowledge base. Refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setError(null); setSaved(false);
    try {
      const clean = videos.filter(v => v.url.trim());
      const r = await fetch(`${backendUrl()}/api/admin/support-knowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ doc, videos: clean }),
      });
      if (!r.ok) throw new Error('save failed');
      setVideos(clean);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const addVideo = () => setVideos(v => [...v, { title: '', url: '' }]);
  const updateVideo = (i: number, f: 'title' | 'url', val: string) => setVideos(v => v.map((x, idx) => idx === i ? { ...x, [f]: val } : x));
  const removeVideo = (i: number) => setVideos(v => v.filter((_, idx) => idx !== i));

  const field = 'w-full rounded-xl px-3 py-2.5 text-sm bg-[var(--a-bg)] border border-[var(--a-line-2)] text-[var(--a-ink)] focus:outline-none focus:border-[var(--a-em-line)]';
  const label = 'text-[11px] font-semibold uppercase tracking-wider text-[var(--a-dim)]';

  return (
    <div className="admin-scope p-5 lg:p-8 max-w-[1000px] pb-28">
      <div className="flex items-center gap-2.5">
        <BookOpen className="h-5 w-5 text-[var(--a-em-deep)]" />
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-ink)]">Support Brain</h1>
      </div>
      <p className="mt-1 text-sm text-[var(--a-dim)] max-w-2xl">
        The single knowledge base every support bot reads: the in-dashboard agency assistant and the marketing-site chat. Edits go live within a minute, no deploy. Keep it user-facing (what things do and how to use them), never how the platform is built.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 mt-10 text-sm text-[var(--a-dim)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading the knowledge base…</div>
      ) : (
        <>
          {/* Master document */}
          <div className="mt-6 rounded-2xl border border-[var(--a-line-2)] bg-[var(--a-card)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={label}>Master document</span>
              <span className="text-[11px] text-[var(--a-dim)]">{doc.length.toLocaleString()} characters</span>
            </div>
            <textarea
              value={doc}
              onChange={e => setDoc(e.target.value)}
              rows={24}
              placeholder="Paste or write the full support knowledge here…"
              className="w-full rounded-xl px-4 py-3 text-[13px] leading-relaxed bg-[var(--a-bg)] border border-[var(--a-line-2)] text-[var(--a-ink)] focus:outline-none focus:border-[var(--a-em-line)] resize-y"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', minHeight: '360px' }}
            />
            <p className="mt-2 text-xs text-[var(--a-dim)]">Copy this out, update it anywhere, and paste the whole thing back. Keep the section headers.</p>
          </div>

          {/* Video library */}
          <div className="mt-5 rounded-2xl border border-[var(--a-line-2)] bg-[var(--a-card)] p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-2"><Video className="h-4 w-4 text-[var(--a-em-deep)]" /><span className={label}>Video library</span></span>
              <button onClick={addVideo} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--a-em-deep)] border border-[var(--a-line-2)] transition-colors hover:border-[var(--a-em-line)]">
                <Plus className="h-3.5 w-3.5" /> Add video
              </button>
            </div>
            <p className="text-xs text-[var(--a-dim)] mb-3.5 max-w-2xl">YouTube links the bots can offer when a question matches. Give each a short, clear title (for example, "How to add a client").</p>
            {videos.length === 0 ? (
              <p className="text-sm text-[var(--a-dim)] py-2">No videos yet. Add a YouTube link above.</p>
            ) : (
              <div className="space-y-2.5">
                {videos.map((v, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-2">
                    <input value={v.title} onChange={e => updateVideo(i, 'title', e.target.value)} placeholder="Title" className={`${field} sm:max-w-[280px]`} maxLength={200} />
                    <input value={v.url} onChange={e => updateVideo(i, 'url', e.target.value)} placeholder="https://youtu.be/…" className={field} maxLength={500} />
                    <button onClick={() => removeVideo(i)} aria-label="Remove video" className="inline-flex items-center justify-center h-9 w-9 rounded-lg flex-shrink-0 text-[var(--a-dim)] border border-[var(--a-line-2)] transition-colors hover:text-[var(--a-red)] hover:border-[var(--a-red)]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-[var(--a-red)]">{error}</p>}

          {/* Sticky save bar */}
          <div className="sticky bottom-0 z-20 mt-6 -mx-5 lg:-mx-8 px-5 lg:px-8 py-3 border-t border-[var(--a-line)] bg-[var(--a-card)] flex items-center justify-end gap-3">
            <span className="text-xs mr-auto flex items-center gap-1.5" style={{ color: saved ? 'var(--a-em-deep)' : 'var(--a-dim)' }}>
              {saved ? (<><Check className="h-3.5 w-3.5" /> Saved. The bots are using it now.</>) : 'Changes are not live until you save.'}
            </span>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50" style={{ backgroundColor: 'var(--a-em)', color: '#04140D' }}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : saved ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save knowledge base</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
