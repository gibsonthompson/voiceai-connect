'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles, ChevronDown, ChevronRight, Trash2, Check, Archive,
  FileText, Loader2, Filter, RefreshCw, Lightbulb, Target, BookOpen,
  Building2, ShieldQuestion, ArrowLeftRight, PenLine, X, Play, Pause,
  Maximize2, Minus, Plus, RotateCcw, Type, Gauge, Monitor,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const PILLAR_META: Record<string, { label: string; color: string; icon: any }> = {
  opportunity:  { label: 'Opportunity',  color: '#10b981', icon: Lightbulb },
  proof:        { label: 'Proof',        color: '#3b82f6', icon: Target },
  howto:        { label: 'How-To',       color: '#8b5cf6', icon: BookOpen },
  industry:     { label: 'Industry',     color: '#f59e0b', icon: Building2 },
  objection:    { label: 'Objection',    color: '#ef4444', icon: ShieldQuestion },
  comparison:   { label: 'Comparison',   color: '#06b6d4', icon: ArrowLeftRight },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  idea:     { label: 'Idea',     color: '#6b7280' },
  approved: { label: 'Approved', color: '#10b981' },
  scripted: { label: 'Scripted', color: '#8b5cf6' },
  recorded: { label: 'Recorded', color: '#3b82f6' },
  archived: { label: 'Archived', color: '#374151' },
};

interface Idea {
  id: string; pillar: string; title: string; hook: string;
  talking_points: string[]; script: string | null; target_length: string;
  recording_mode: string; status: string; notes: string | null;
  created_at: string; updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// INLINE EDITABLE TEXT
// ═══════════════════════════════════════════════════════════════════
function InlineEdit({ value, onSave, multiline = false, placeholder = 'Click to edit...', className = '', style = {} }: {
  value: string; onSave: (v: string) => void; multiline?: boolean;
  placeholder?: string; className?: string; style?: React.CSSProperties;
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
      <div onClick={() => setEditing(true)} className={`cursor-text rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors hover:bg-white/[0.04] ${className}`} style={style}>
        {value || <span className="text-white/20 italic">{placeholder}</span>}
      </div>
    );
  }

  if (multiline) {
    return (
      <textarea ref={ref as any} value={draft} onChange={e => setDraft(e.target.value)}
        onBlur={save} onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={`w-full rounded-lg px-2 py-1 -mx-2 -my-1 bg-white/[0.04] border border-emerald-500/30 text-white focus:outline-none resize-none ${className}`}
        style={{ ...style, minHeight: '80px' }} />
    );
  }

  return (
    <input ref={ref as any} value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      className={`w-full rounded-lg px-2 py-1 -mx-2 -my-1 bg-white/[0.04] border border-emerald-500/30 text-white focus:outline-none ${className}`}
      style={style} />
  );
}

// ═══════════════════════════════════════════════════════════════════
// TELEPROMPTER OVERLAY
// ═══════════════════════════════════════════════════════════════════
function Teleprompter({ script, title, onClose }: { script: string; title: string; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [wpm, setWpm] = useState(130);
  const [fontSize, setFontSize] = useState(32);
  const [wordIndex, setWordIndex] = useState(-1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [mirrored, setMirrored] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse script into structured segments
  const segments = parseScript(script);
  const allWords = segments.flatMap(s => s.words.map(w => ({ ...w, segmentType: s.type })));
  const totalWords = allWords.length;
  const progress = totalWords > 0 ? ((wordIndex + 1) / totalWords) * 100 : 0;

  // Auto-advance words
  useEffect(() => {
    if (playing && wordIndex < totalWords - 1) {
      const msPerWord = 60000 / wpm;
      timerRef.current = setTimeout(() => setWordIndex(i => i + 1), msPerWord);
    } else if (wordIndex >= totalWords - 1) {
      setPlaying(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, wordIndex, wpm, totalWords]);

  // Auto-scroll to keep current word centered
  useEffect(() => {
    if (wordIndex >= 0) {
      const el = document.getElementById(`tp-word-${wordIndex}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [wordIndex]);

  // Keyboard controls
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
  }, [totalWords, playing]);

  const handlePlayPause = () => {
    if (!playing && wordIndex === -1) {
      // Start countdown
      setCountdown(3);
      let c = 3;
      const interval = setInterval(() => {
        c--;
        if (c <= 0) {
          clearInterval(interval);
          setCountdown(null);
          setWordIndex(0);
          setPlaying(true);
        } else {
          setCountdown(c);
        }
      }, 1000);
    } else {
      setPlaying(!playing);
    }
  };

  const restart = () => { setWordIndex(-1); setPlaying(false); };

  const segmentColors: Record<string, string> = {
    hook: '#10b981', context: '#3b82f6', payload: '#8b5cf6',
    bridge: '#f59e0b', default: '#6b7280',
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#030303] flex flex-col">
      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <span className="text-[120px] font-bold text-white/90 animate-pulse">{countdown}</span>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs text-white/30 font-mono uppercase tracking-wider">Teleprompter</p>
            <p className="text-sm text-white/70 font-medium truncate max-w-md">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setMirrored(!mirrored)} className={`p-2 rounded-lg transition-colors ${mirrored ? 'bg-emerald-500/15 text-emerald-400' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.06]'}`} title="Mirror mode">
            <Monitor className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-2 py-1">
            <Type className="w-3 h-3 text-white/30" />
            <button onClick={() => setFontSize(s => Math.max(18, s - 4))} className="text-white/40 hover:text-white p-0.5"><Minus className="w-3 h-3" /></button>
            <span className="text-[11px] text-white/50 font-mono w-8 text-center">{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(56, s + 4))} className="text-white/40 hover:text-white p-0.5"><Plus className="w-3 h-3" /></button>
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
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Script body */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-8 lg:px-20 py-16"
        style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}>
        <div className="max-w-3xl mx-auto">
          {segments.map((segment, si) => {
            const segColor = segmentColors[segment.type] || segmentColors.default;
            return (
              <div key={si} className="mb-10">
                {segment.label && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-semibold" style={{ color: segColor }}>{segment.label}</span>
                    <span className="h-px flex-1" style={{ background: `${segColor}30` }} />
                  </div>
                )}
                <div style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }} className="leading-relaxed">
                  {segment.words.map(w => {
                    const isActive = w.globalIndex === wordIndex;
                    const isPast = w.globalIndex < wordIndex;
                    const isNear = Math.abs(w.globalIndex - wordIndex) <= 3 && wordIndex >= 0;
                    return (
                      <span key={w.globalIndex} id={`tp-word-${w.globalIndex}`}
                        className="transition-all duration-150 cursor-pointer"
                        onClick={() => { setWordIndex(w.globalIndex); setPlaying(false); }}
                        style={{
                          color: isActive ? '#ffffff' : isPast ? 'rgba(255,255,255,0.25)' : isNear ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)',
                          backgroundColor: isActive ? `${segColor}30` : 'transparent',
                          borderRadius: isActive ? '4px' : undefined,
                          padding: isActive ? '2px 4px' : '2px 0',
                          fontWeight: isActive ? 700 : 400,
                          textShadow: isActive ? `0 0 20px ${segColor}60` : 'none',
                        }}>
                        {w.text}{w.trailing}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
          style={{ backgroundColor: playing ? 'rgba(255,255,255,0.1)' : '#10b981', color: playing ? '#ffffff' : '#000000' }}>
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

// Parse script text into labeled segments with word indices
function parseScript(text: string): { type: string; label: string; words: { text: string; trailing: string; globalIndex: number }[] }[] {
  const lines = text.split('\n');
  const segments: { type: string; label: string; words: { text: string; trailing: string; globalIndex: number }[] }[] = [];
  let current: { type: string; label: string; words: { text: string; trailing: string; globalIndex: number }[] } | null = null;
  let globalIdx = 0;

  const sectionPattern = /^(#{1,3}\s+)?(HOOK|CONTEXT|PAYLOAD|BRIDGE|SEGMENT\s*\d*)/i;
  const subSectionPattern = /^\*\*Segment\s+\d+/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for section headers
    const sectionMatch = trimmed.match(sectionPattern);
    if (sectionMatch) {
      const label = trimmed.replace(/^#{1,3}\s+/, '').replace(/[*_#]/g, '').trim();
      let type = 'default';
      const lower = label.toLowerCase();
      if (lower.includes('hook')) type = 'hook';
      else if (lower.includes('context')) type = 'context';
      else if (lower.includes('payload') || lower.includes('segment')) type = 'payload';
      else if (lower.includes('bridge')) type = 'bridge';
      current = { type, label, words: [] };
      segments.push(current);
      continue;
    }

    if (subSectionPattern.test(trimmed)) {
      const label = trimmed.replace(/[*_#]/g, '').trim();
      current = { type: 'payload', label, words: [] };
      segments.push(current);
      continue;
    }

    if (!current) {
      current = { type: 'default', label: '', words: [] };
      segments.push(current);
    }

    // Skip screen direction markers but keep them visible
    const cleanLine = trimmed.replace(/^\[SCREEN:.*?\]\s*/i, '');
    if (trimmed.startsWith('[SCREEN:')) {
      const screenDir = trimmed;
      current.words.push({ text: screenDir, trailing: ' ', globalIndex: globalIdx++ });
      continue;
    }

    // Split line into words
    const rawWords = cleanLine.split(/(\s+)/);
    for (let i = 0; i < rawWords.length; i++) {
      const token = rawWords[i];
      if (!token || /^\s+$/.test(token)) continue;
      const trailing = (i + 1 < rawWords.length && /^\s+$/.test(rawWords[i + 1])) ? rawWords[i + 1] : ' ';
      current.words.push({ text: token.replace(/[*_]/g, ''), trailing, globalIndex: globalIdx++ });
    }
  }

  return segments.length > 0 ? segments : [{ type: 'default', label: '', words: text.split(/(\s+)/).filter(w => w.trim()).map((w, i) => ({ text: w, trailing: ' ', globalIndex: i })) }];
}

// ═══════════════════════════════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════════════════════════════
function PillarBadge({ pillar }: { pillar: string }) {
  const meta = PILLAR_META[pillar] || { label: pillar, color: '#6b7280', icon: Lightbulb };
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
      style={{ backgroundColor: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}25` }}>
      <meta.icon className="w-2.5 h-2.5" />{meta.label}
    </span>
  );
}

function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  const meta = STATUS_META[status] || { label: status, color: '#6b7280' };
  return (
    <span onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${onClick ? 'cursor-pointer hover:brightness-125' : ''}`}
      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>
      {meta.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function AdminYouTubePage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number>; byPillar: Record<string, number> }>({ total: 0, byStatus: {}, byPillar: {} });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [teleprompterIdea, setTeleprompterIdea] = useState<Idea | null>(null);

  // Generate panel
  const [genPillar, setGenPillar] = useState('mixed');
  const [genCount, setGenCount] = useState(5);
  const [genContext, setGenContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPillar, setFilterPillar] = useState('');
  const [scriptingId, setScriptingId] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterPillar) params.set('pillar', filterPillar);
      params.set('limit', '100');
      const res = await fetch(`${API}/api/yt/ideas?${params}`);
      const data = await res.json();
      if (data.success) setIdeas(data.ideas || []);
    } catch (err) { console.error('Failed to fetch ideas:', err); }
  }, [filterStatus, filterPillar]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/yt/ideas/stats/summary`);
      const data = await res.json();
      if (data.success) setStats({ total: data.total, byStatus: data.byStatus, byPillar: data.byPillar });
    } catch (err) { console.error('Failed to fetch stats:', err); }
  }, []);

  useEffect(() => { Promise.all([fetchIdeas(), fetchStats()]).finally(() => setLoading(false)); }, [fetchIdeas, fetchStats]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API}/api/yt/ideas/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillar: genPillar, count: genCount, context: genContext }),
      });
      const data = await res.json();
      if (data.success) { setGenContext(''); await Promise.all([fetchIdeas(), fetchStats()]); }
      else alert(data.error || 'Generation failed');
    } catch { alert('Generation failed'); }
    finally { setGenerating(false); }
  };

  const updateIdea = async (id: string, updates: Partial<Idea>) => {
    try {
      const res = await fetch(`${API}/api/yt/ideas/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) { setIdeas(prev => prev.map(i => i.id === id ? data.idea : i)); fetchStats(); }
    } catch (err) { console.error('Update failed:', err); }
  };

  const deleteIdea = async (id: string) => {
    if (!confirm('Delete this idea?')) return;
    try {
      await fetch(`${API}/api/yt/ideas/${id}`, { method: 'DELETE' });
      setIdeas(prev => prev.filter(i => i.id !== id));
      if (expandedId === id) setExpandedId(null);
      fetchStats();
    } catch (err) { console.error('Delete failed:', err); }
  };

  const generateScript = async (id: string) => {
    setScriptingId(id);
    try {
      const res = await fetch(`${API}/api/yt/ideas/${id}/script`, { method: 'POST' });
      const data = await res.json();
      if (data.success) { setIdeas(prev => prev.map(i => i.id === id ? data.idea : i)); setExpandedId(id); fetchStats(); }
      else alert(data.error || 'Script generation failed');
    } catch { alert('Script generation failed'); }
    finally { setScriptingId(null); }
  };

  const modeLabels: Record<string, string> = {
    figured_something_out: '💡 Discovery', showing_screen: '🖥️ Screen share', telling_friend: '💬 Friend mode',
  };

  return (
    <div className="min-h-screen p-5 lg:p-8" style={{ backgroundColor: '#050505', color: '#e5e7eb' }}>

      {/* Teleprompter overlay */}
      {teleprompterIdea?.script && (
        <Teleprompter script={teleprompterIdea.script} title={teleprompterIdea.title} onClose={() => setTeleprompterIdea(null)} />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">YouTube Content</h1>
          <p className="text-sm text-white/40 mt-1">Generate ideas, write scripts, record with the teleprompter</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div className="rounded-xl p-3.5" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/35">Total</p>
            <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          {Object.entries(STATUS_META).filter(([k]) => k !== 'archived').map(([key, meta]) => (
            <div key={key} className="rounded-xl p-3.5 cursor-pointer hover:brightness-110 transition-all"
              onClick={() => { setFilterStatus(filterStatus === key ? '' : key); setTimeout(fetchIdeas, 0); }}
              style={{ backgroundColor: filterStatus === key ? `${meta.color}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${filterStatus === key ? `${meta.color}30` : 'rgba(255,255,255,0.06)'}` }}>
              <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: `${meta.color}90` }}>{meta.label}</p>
              <p className="text-xl font-bold text-white mt-1">{stats.byStatus[key] || 0}</p>
            </div>
          ))}
        </div>

        {/* Generate Panel */}
        <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Generate Ideas</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <select value={genPillar} onChange={e => setGenPillar(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-emerald-500/50">
              <option value="mixed">Mixed (all pillars)</option>
              {Object.entries(PILLAR_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={genCount} onChange={e => setGenCount(Number(e.target.value))}
              className="rounded-lg px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-emerald-500/50">
              {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} ideas</option>)}
            </select>
            <button onClick={handleGenerate} disabled={generating}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#10b981', color: '#000' }}>
              {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</> : <><Sparkles className="w-3.5 h-3.5" />Generate</>}
            </button>
          </div>
          <input type="text" value={genContext} onChange={e => setGenContext(e.target.value)}
            placeholder="Optional context — trends, angles, specific topics..."
            className="w-full rounded-lg px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-3.5 h-3.5 text-white/30" />
          <select value={filterPillar} onChange={e => { setFilterPillar(e.target.value); setTimeout(fetchIdeas, 0); }}
            className="rounded-lg px-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] text-white/70 focus:outline-none">
            <option value="">All pillars</option>
            {Object.entries(PILLAR_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => { fetchIdeas(); fetchStats(); }} className="ml-auto rounded-lg p-1.5 text-white/30 hover:text-white/60 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-white/30">{ideas.length}</span>
        </div>

        {/* Ideas */}
        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto text-white/30" /></div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Lightbulb className="w-8 h-8 mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/40">No ideas yet. Generate your first batch above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ideas.map(idea => {
              const isExpanded = expandedId === idea.id;
              const isScripting = scriptingId === idea.id;

              return (
                <div key={idea.id} className="rounded-xl overflow-hidden transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}` }}>

                  {/* Header row */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : idea.id)}>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />}
                    <PillarBadge pillar={idea.pillar} />
                    <p className="text-sm text-white font-medium flex-1 truncate">{idea.title}</p>
                    <span className="text-[11px] font-mono text-white/20 hidden sm:block">{idea.target_length}</span>
                    <StatusBadge status={idea.status} />
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-2 border-t border-white/[0.04] space-y-5">

                      {/* Title — inline editable */}
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Title</p>
                        <InlineEdit value={idea.title} onSave={v => updateIdea(idea.id, { title: v })}
                          className="text-base font-semibold text-white" />
                      </div>

                      {/* Hook — inline editable */}
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Hook</p>
                        <InlineEdit value={idea.hook} onSave={v => updateIdea(idea.id, { hook: v })}
                          multiline className="text-sm text-white/70 italic" />
                      </div>

                      {/* Talking points — inline editable */}
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2">Talking Points</p>
                        <div className="space-y-1">
                          {(idea.talking_points || []).map((tp, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="font-mono text-[10px] text-white/20 mt-2 w-5 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                              <InlineEdit value={tp}
                                onSave={v => {
                                  const updated = [...idea.talking_points];
                                  updated[i] = v;
                                  updateIdea(idea.id, { talking_points: updated } as any);
                                }}
                                className="text-sm text-white/60 flex-1" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap gap-4 text-[11px] text-white/30">
                        <span>{modeLabels[idea.recording_mode] || idea.recording_mode}</span>
                        <span>{idea.target_length}</span>
                        <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Notes — inline editable */}
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Notes</p>
                        <InlineEdit value={idea.notes || ''} onSave={v => updateIdea(idea.id, { notes: v || null })}
                          multiline placeholder="Add notes..." className="text-sm text-white/50" />
                      </div>

                      {/* Script — inline editable */}
                      {idea.script && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">Script</p>
                            <button onClick={() => setTeleprompterIdea(idea)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors">
                              <Maximize2 className="w-3 h-3" />Teleprompter
                            </button>
                          </div>
                          <InlineEdit value={idea.script} onSave={v => updateIdea(idea.id, { script: v })}
                            multiline className="text-[13px] text-white/55 font-mono leading-relaxed"
                            style={{ whiteSpace: 'pre-wrap' }} />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {idea.status === 'idea' && (
                          <button onClick={() => updateIdea(idea.id, { status: 'approved' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors">
                            <Check className="w-3 h-3" />Approve
                          </button>
                        )}
                        {!idea.script && (
                          <button onClick={() => generateScript(idea.id)} disabled={isScripting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25 transition-colors disabled:opacity-40">
                            {isScripting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            {isScripting ? 'Writing...' : 'Generate Script'}
                          </button>
                        )}
                        {idea.script && !teleprompterIdea && (
                          <button onClick={() => setTeleprompterIdea(idea)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors">
                            <Play className="w-3 h-3" />Record Mode
                          </button>
                        )}
                        {idea.status === 'scripted' && (
                          <button onClick={() => updateIdea(idea.id, { status: 'recorded' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors">
                            <Check className="w-3 h-3" />Mark Recorded
                          </button>
                        )}
                        <button onClick={() => updateIdea(idea.id, { status: 'archived' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-white/30 border border-white/[0.06] hover:bg-white/[0.08] transition-colors">
                          <Archive className="w-3 h-3" />Archive
                        </button>
                        <button onClick={() => deleteIdea(idea.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400/60 border border-red-500/10 hover:bg-red-500/20 transition-colors ml-auto">
                          <Trash2 className="w-3 h-3" />
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