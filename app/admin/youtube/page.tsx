'use client';

// ============================================================================
// CONTENT (YouTube): a simple script workbench.
// Paste a script, edit it, record against the teleprompter. No idea generation,
// no hooks / talking-point structure, just the script you paste. The teleprompter
// overlay is deliberately dark (a white screen glares on camera) and it strips
// label noise ("Hook:", "Talking points:", screen directions, a duplicate title)
// so whatever you paste reads straight through.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown, ChevronRight, Trash2, Check, Archive, FileText, Copy, Loader2,
  RefreshCw, X, Play, Pause, Maximize2, Minus, Plus, RotateCcw, Type, Gauge,
  Monitor,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const STATUS_META: Record<string, { label: string; color: string }> = {
  idea:     { label: 'Draft',    color: '#5A6E62' },
  approved: { label: 'Draft',    color: '#5A6E62' },
  scripted: { label: 'Script',   color: '#0B9668' },
  recorded: { label: 'Recorded', color: '#0E9BB5' },
  archived: { label: 'Archived', color: '#93A69B' },
};

// Soft button style (deep text on a faint tint) for the emerald-on-white surface.
const soft = (color: string, bg: string, line: string): React.CSSProperties => ({
  color, background: bg, border: `1px solid ${line}`,
});
const SOFT = {
  em: soft('#0B9668', '#E7F8F0', '#BEEAD6'),
  cyan: soft('#0E9BB5', '#DBF1F6', '#BFE7F0'),
  red: soft('#D33A3F', '#FBE3E3', '#F3C9C9'),
  slate: soft('#5A6E62', '#EEF3EF', '#DDE7E0'),
};

interface Idea {
  id: string; title: string; script: string | null; status: string;
  posted_at?: string | null; caption?: string | null;
  created_at: string; updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// INLINE EDITABLE TEXT
// ═══════════════════════════════════════════════════════════════════
function InlineEdit({ value, onSave, multiline = false, placeholder = 'Click to edit...', className = '', style = {}, minHeight = 80 }: {
  value: string; onSave: (v: string) => void; multiline?: boolean;
  placeholder?: string; className?: string; style?: React.CSSProperties; minHeight?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const save = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} className={`cursor-text rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors hover:bg-[#F3F9F6] whitespace-pre-wrap ${className}`} style={style}>
        {value || <span className="text-[var(--a-dim)] italic">{placeholder}</span>}
      </div>
    );
  }

  if (multiline) {
    return (
      <textarea ref={ref as any} value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={save} onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={`w-full rounded-lg px-2 py-1 -mx-2 -my-1 text-[var(--a-ink)] focus:outline-none resize-y ${className}`}
        style={{ ...style, minHeight, background: 'var(--a-card)', border: '1px solid var(--a-em-line)' }} />
    );
  }

  return (
    <input ref={ref as any} value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      className={`w-full rounded-lg px-2 py-1 -mx-2 -my-1 text-[var(--a-ink)] focus:outline-none ${className}`}
      style={{ ...style, background: 'var(--a-card)', border: '1px solid var(--a-em-line)' }} />
  );
}

// ═══════════════════════════════════════════════════════════════════
// SCRIPT CLEANUP (teleprompter): strip label noise so the plain spoken
// script reads straight through, whatever format it was pasted in.
// ═══════════════════════════════════════════════════════════════════
// Line-start labels to strip ("Hook: ..." -> "...", a bare "Talking points:" -> dropped).
const LABEL_PREFIX = /^\s*(hooks?|talking\s*points?|key\s*points?|context|payload|bridge|intro|outro|cta|call\s*to\s*action|segment\s*\d*|screen|visual|b-?roll|on-?screen|note|title)\s*:\s*/i;
// Inline screen/visual directions like [SCREEN: ...] get removed entirely.
const DIRECTION = /\[(?:screen|visual|b-?roll|on-?screen|cut|show)\s*:[^\]]*\]/gi;

type TpWord = { text: string; trailing: string; globalIndex: number };
type TpLine = { words: TpWord[]; blank: boolean };

// Preserve the script's own line breaks so the teleprompter reads line for line,
// not as one continuous reflow. Each source line becomes its own display line;
// blank lines become spacing. Label prefixes ("Hook:", "Talking points:") and
// [SCREEN: ...] directions are stripped, but the first line is kept as-is.
function cleanScript(script: string): TpLine[] {
  const rawLines = script.split('\n');
  const out: TpLine[] = [];
  let globalIdx = 0;
  for (const raw of rawLines) {
    let line = raw.replace(DIRECTION, '').trim();
    if (!line) {
      if (out.length && out[out.length - 1].blank) continue; // collapse runs of blanks
      out.push({ words: [], blank: true });
      continue;
    }
    const m = line.match(LABEL_PREFIX);
    if (m) {
      line = line.slice(m[0].length).trim();
      if (!line) continue;                                   // a bare "Hook:" line -> drop
    }
    const words: TpWord[] = [];
    for (const token of line.split(/\s+/)) {
      if (!token) continue;
      words.push({ text: token.replace(/[*_`#]/g, ''), trailing: ' ', globalIndex: globalIdx++ });
    }
    if (words.length) out.push({ words, blank: false });
  }
  if (!out.some(l => l.words.length)) {
    return [{ words: script.split(/\s+/).filter(Boolean).map((w, i) => ({ text: w, trailing: ' ', globalIndex: i })), blank: false }];
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// TELEPROMPTER OVERLAY (kept dark on purpose: recording surface)
// ═══════════════════════════════════════════════════════════════════
function Teleprompter({ script, title, onClose }: { script: string; title: string; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [wpm, setWpm] = useState(130);
  const [fontSize, setFontSize] = useState(34);
  const [wordIndex, setWordIndex] = useState(-1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [mirrored, setMirrored] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const lines = cleanScript(script);
  const totalWords = lines.reduce((n, l) => n + l.words.length, 0);
  const progress = totalWords > 0 ? ((wordIndex + 1) / totalWords) * 100 : 0;

  const ACCENT = '#27F4D2';

  useEffect(() => {
    if (playing && wordIndex < totalWords - 1) {
      const msPerWord = 60000 / wpm;
      timerRef.current = setTimeout(() => setWordIndex(i => i + 1), msPerWord);
    } else if (wordIndex >= totalWords - 1) {
      setPlaying(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, wordIndex, wpm, totalWords]);

  useEffect(() => {
    if (wordIndex >= 0) {
      const el = document.getElementById(`tp-word-${wordIndex}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [wordIndex]);

  const handlePlayPause = useCallback(() => {
    if (!playing && wordIndex === -1) {
      setCountdown(3);
      let c = 3;
      const interval = setInterval(() => {
        c--;
        if (c <= 0) { clearInterval(interval); setCountdown(null); setWordIndex(0); setPlaying(true); }
        else setCountdown(c);
      }, 1000);
    } else {
      setPlaying(p => !p);
    }
  }, [playing, wordIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); handlePlayPause(); }
      if (e.code === 'ArrowUp') { e.preventDefault(); setWpm(w => Math.min(250, w + 10)); }
      if (e.code === 'ArrowDown') { e.preventDefault(); setWpm(w => Math.max(60, w - 10)); }
      if (e.code === 'ArrowRight') { e.preventDefault(); setWordIndex(i => Math.min(totalWords - 1, i + 1)); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); setWordIndex(i => Math.max(-1, i - 1)); }
      if (e.code === 'Escape') onClose();
      if (e.code === 'KeyR') { setWordIndex(-1); setPlaying(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [totalWords, handlePlayPause, onClose]);

  const restart = () => { setWordIndex(-1); setPlaying(false); };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ backgroundColor: '#0A0A0A', fontFamily: "'Rajdhani', system-ui, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap" />
      {countdown !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <span className="text-[160px] font-bold animate-pulse" style={{ color: ACCENT }}>{countdown}</span>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color: ACCENT }}>VoiceAI Connect<span className="text-white/25 ml-2.5 font-medium tracking-wider">TELEPROMPTER</span></p>
            <p className="text-sm text-white/80 font-semibold truncate max-w-md">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setMirrored(!mirrored)} className="p-2 rounded-lg transition-colors text-white/30 hover:text-white/60 hover:bg-white/[0.06]" style={mirrored ? { backgroundColor: 'rgba(39,244,210,0.15)', color: ACCENT } : undefined} title="Mirror mode">
            <Monitor className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-2 py-1">
            <Type className="w-3 h-3 text-white/30" />
            <button onClick={() => setFontSize(s => Math.max(18, s - 4))} className="text-white/40 hover:text-white p-0.5"><Minus className="w-3 h-3" /></button>
            <span className="text-[11px] text-white/50 font-mono w-8 text-center">{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(64, s + 4))} className="text-white/40 hover:text-white p-0.5"><Plus className="w-3 h-3" /></button>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-2 py-1">
            <Gauge className="w-3 h-3 text-white/30" />
            <button onClick={() => setWpm(w => Math.max(60, w - 10))} className="text-white/40 hover:text-white p-0.5"><Minus className="w-3 h-3" /></button>
            <span className="text-[11px] text-white/50 font-mono w-12 text-center">{wpm} wpm</span>
            <button onClick={() => setWpm(w => Math.min(250, w + 10))} className="text-white/40 hover:text-white p-0.5"><Plus className="w-3 h-3" /></button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.04] flex-shrink-0">
        <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00D2BE, #27F4D2)' }} />
      </div>

      {/* Script body: plain paragraphs, word-by-word highlight, no labels */}
      <div className="flex-1 overflow-y-auto px-8 lg:px-20 py-16" style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}>
        <div className="max-w-3xl mx-auto">
          {lines.map((ln, li) => ln.blank ? (
            <div key={li} style={{ height: `${fontSize * 0.7}px` }} />
          ) : (
            <p key={li} style={{ fontSize: `${fontSize}px`, lineHeight: 1.35, marginBottom: `${fontSize * 0.4}px` }}>
              {ln.words.map(w => {
                const isActive = w.globalIndex === wordIndex;
                const isPast = w.globalIndex < wordIndex;
                const isNear = Math.abs(w.globalIndex - wordIndex) <= 3 && wordIndex >= 0;
                return (
                  <span key={w.globalIndex} id={`tp-word-${w.globalIndex}`}
                    className="transition-all duration-150 cursor-pointer"
                    onClick={() => { setWordIndex(w.globalIndex); setPlaying(false); }}
                    style={{
                      color: isActive ? '#ffffff' : isPast ? 'rgba(255,255,255,0.25)' : isNear ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.46)',
                      backgroundColor: isActive ? 'rgba(39,244,210,0.18)' : 'transparent',
                      borderRadius: isActive ? '4px' : undefined,
                      padding: isActive ? '2px 4px' : '2px 0',
                      fontWeight: isActive ? 700 : 400,
                      textShadow: isActive ? `0 0 20px ${ACCENT}60` : 'none',
                    }}>
                    {w.text}{w.trailing}
                  </span>
                );
              })}
            </p>
          ))}
          <div className="h-[50vh]" />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-6 px-6 py-4 border-t border-white/[0.06] flex-shrink-0">
        <button onClick={restart} className="p-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors" title="Restart (R)">
          <RotateCcw className="w-5 h-5" />
        </button>
        <button onClick={handlePlayPause}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
          style={{ backgroundColor: playing ? 'rgba(255,255,255,0.1)' : ACCENT, color: playing ? '#ffffff' : '#0A0A0A' }}>
          {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
        <div className="text-[11px] font-mono text-white/30 w-24 text-center">
          {wordIndex >= 0 ? wordIndex + 1 : 0} / {totalWords}
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center justify-center gap-6 pb-3 text-[10px] text-white/15 font-mono">
        <span>SPACE play/pause</span>
        <span>↑↓ speed</span>
        <span>←→ word</span>
        <span>R restart</span>
        <span>ESC close</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════════════════
function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, color: '#5A6E62' };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider shrink-0"
      style={{ backgroundColor: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}>
      {meta.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function AdminYouTubePage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [teleprompterIdea, setTeleprompterIdea] = useState<Idea | null>(null);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [showPaste, setShowPaste] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteScript, setPasteScript] = useState('');
  const [creatingPaste, setCreatingPaste] = useState(false);

  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/yt/ideas?limit=200`);
      const data = await res.json();
      if (data.success) setIdeas(data.ideas || []);
    } catch (err) { console.error('Failed to fetch scripts:', err); }
  }, []);

  useEffect(() => { fetchIdeas().finally(() => setLoading(false)); }, [fetchIdeas]);

  const updateIdea = async (id: string, updates: Partial<Idea>) => {
    try {
      const res = await fetch(`${API}/api/yt/ideas/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) setIdeas(prev => prev.map(i => i.id === id ? { ...i, ...data.idea } : i));
    } catch (err) { console.error('Update failed:', err); }
  };

  const deleteIdea = async (id: string) => {
    if (!confirm('Delete this script?')) return;
    try {
      await fetch(`${API}/api/yt/ideas/${id}`, { method: 'DELETE' });
      setIdeas(prev => prev.filter(i => i.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleCreateFromPaste = async () => {
    if (!pasteScript.trim() && !pasteTitle.trim()) return;
    setCreatingPaste(true);
    try {
      const res = await fetch(`${API}/api/yt/ideas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: pasteTitle.trim() || undefined, script: pasteScript }),
      });
      const data = await res.json();
      if (data.success) {
        setPasteTitle(''); setPasteScript(''); setShowPaste(false);
        await fetchIdeas();
        if (data.idea?.id) setExpandedId(data.idea.id);
      } else {
        alert(data.error || 'Failed to create script');
      }
    } catch (e) {
      console.error('Create from paste error:', e);
      alert('Failed to create script');
    } finally {
      setCreatingPaste(false);
    }
  };

  const visible = ideas.filter(i => showArchived ? true : i.status !== 'archived');

  return (
    <div className="admin-scope min-h-screen p-5 lg:p-8">

      {/* Teleprompter overlay */}
      {teleprompterIdea?.script && (
        <Teleprompter script={teleprompterIdea.script} title={teleprompterIdea.title} onClose={() => setTeleprompterIdea(null)} />
      )}

      {/* Paste-a-script modal */}
      {showPaste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !creatingPaste && setShowPaste(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-5xl h-[88vh] rounded-2xl bg-white border border-[var(--a-line)] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--a-line)]">
              <h3 className="text-sm font-semibold text-[var(--a-ink)]">New script</h3>
              <button onClick={() => setShowPaste(false)} className="p-1 rounded-lg text-[var(--a-dim)] hover:text-[var(--a-ink)] transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 flex-1 flex flex-col gap-3 min-h-0">
              <input type="text" value={pasteTitle} onChange={e => setPasteTitle(e.target.value)}
                placeholder="Title (optional, uses the first line if left blank)"
                className="a-input w-full shrink-0" />
              <textarea value={pasteScript} onChange={e => setPasteScript(e.target.value)}
                placeholder="Paste your script here..."
                className="a-input w-full flex-1 resize-none font-mono text-sm leading-relaxed min-h-0"
                style={{ whiteSpace: 'pre-wrap' }}
                autoFocus />
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--a-line)]">
              <button onClick={() => setShowPaste(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--a-muted)] transition-colors">Cancel</button>
              <button onClick={handleCreateFromPaste} disabled={creatingPaste || !pasteScript.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40" style={SOFT.em}>
                {creatingPaste ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creatingPaste ? 'Saving...' : 'Save script'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--a-ink)]">YouTube Scripts</h1>
            <p className="text-sm text-[var(--a-muted)] mt-1">Paste a script, edit it, and record with the teleprompter.</p>
          </div>
          <button onClick={() => { setPasteTitle(''); setPasteScript(''); setShowPaste(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0"
            style={SOFT.em}>
            <Plus className="w-4 h-4" />Paste script
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-mono text-[var(--a-dim)]">{visible.length} {visible.length === 1 ? 'script' : 'scripts'}</span>
          <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--a-dim)] cursor-pointer select-none">
            <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="accent-[var(--a-em)]" />
            Show archived
          </label>
          <button onClick={() => fetchIdeas()} className="ml-auto rounded-lg p-1.5 text-[var(--a-dim)] hover:text-[var(--a-em-deep)] transition-colors" aria-label="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--a-em)]" /></div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 a-card">
            <FileText className="w-8 h-8 mx-auto text-[var(--a-dim)] mb-3" />
            <p className="text-sm text-[var(--a-muted)]">No scripts yet. Hit <span className="font-semibold text-[var(--a-ink)]">Paste script</span> to add your first one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(idea => {
              const isExpanded = expandedId === idea.id;
              return (
                <div key={idea.id} className="a-card overflow-hidden transition-all"
                  style={isExpanded ? { borderColor: 'var(--a-line-2)' } : undefined}>

                  {/* Header row */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : idea.id)}>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[var(--a-dim)] flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--a-dim)] flex-shrink-0" />}
                    <p className="text-sm text-[var(--a-ink)] font-medium flex-1 truncate">{idea.title || 'Untitled script'}</p>
                    <span className="text-[11px] font-mono text-[var(--a-dim)] hidden sm:block">{new Date(idea.created_at).toLocaleDateString()}</span>
                    <label onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 cursor-pointer select-none shrink-0" title={idea.posted_at ? `Posted ${new Date(idea.posted_at).toLocaleDateString()}` : 'Mark as posted'}>
                      <input type="checkbox" checked={!!idea.posted_at} onChange={e => updateIdea(idea.id, { posted_at: e.target.checked ? new Date().toISOString() : null })} className="accent-[var(--a-em)]" />
                      <span className="text-[11px] font-mono hidden sm:block" style={{ color: idea.posted_at ? 'var(--a-em-deep)' : 'var(--a-dim)' }}>{idea.posted_at ? `Posted ${new Date(idea.posted_at).toLocaleDateString()}` : 'Posted?'}</span>
                    </label>
                    <StatusBadge status={idea.status} />
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-2 border-t border-[var(--a-line)] space-y-4">

                      {/* Title */}
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--a-dim)] mb-1">Title</p>
                        <InlineEdit value={idea.title} onSave={v => updateIdea(idea.id, { title: v })}
                          className="text-base font-semibold text-[var(--a-ink)]" />
                      </div>

                      {/* Caption: the title + caption to publish with this post */}
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--a-dim)] mb-1">Caption</p>
                        <InlineEdit value={idea.caption || ''} onSave={v => updateIdea(idea.id, { caption: v })}
                          multiline minHeight={100} placeholder="Paste the title + caption you'll post with..."
                          className="text-[13px] text-[var(--a-ink)] leading-relaxed"
                          style={{ whiteSpace: 'pre-wrap' }} />
                      </div>

                      {/* Posted check-off + the date it was posted */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={!!idea.posted_at} onChange={e => updateIdea(idea.id, { posted_at: e.target.checked ? new Date().toISOString() : null })} className="accent-[var(--a-em)] w-4 h-4" />
                        <span className="text-[13px] text-[var(--a-ink)] font-medium">Posted</span>
                        {idea.posted_at && <span className="text-[11px] font-mono text-[var(--a-em-deep)]">on {new Date(idea.posted_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>}
                      </label>

                      {/* Script */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--a-dim)]">Script</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { navigator.clipboard.writeText(idea.script || ''); setCopiedScript(idea.id); setTimeout(() => setCopiedScript(c => c === idea.id ? null : c), 2000); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={SOFT.slate}>
                              {copiedScript === idea.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedScript === idea.id ? 'Copied' : 'Copy'}
                            </button>
                            <button onClick={() => idea.script && setTeleprompterIdea(idea)} disabled={!idea.script}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40" style={SOFT.em}>
                              <Maximize2 className="w-3 h-3" />Teleprompter
                            </button>
                          </div>
                        </div>
                        <InlineEdit value={idea.script || ''} onSave={v => updateIdea(idea.id, { script: v })}
                          multiline minHeight={240} placeholder="Click to add or edit the script..."
                          className="text-[14px] text-[var(--a-ink)] leading-relaxed"
                          style={{ whiteSpace: 'pre-wrap' }} />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {idea.status === 'archived' ? (
                          <button onClick={() => updateIdea(idea.id, { status: 'scripted' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={SOFT.slate}>
                            <RotateCcw className="w-3 h-3" />Unarchive
                          </button>
                        ) : (
                          <button onClick={() => updateIdea(idea.id, { status: 'archived' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={SOFT.slate}>
                            <Archive className="w-3 h-3" />Archive
                          </button>
                        )}
                        <button onClick={() => deleteIdea(idea.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-auto" style={SOFT.red}>
                          <Trash2 className="w-3 h-3" />Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
