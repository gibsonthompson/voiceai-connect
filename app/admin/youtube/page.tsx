'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Plus, ChevronDown, ChevronRight, Trash2, Check, Archive,
  FileText, Loader2, Filter, RefreshCw, Lightbulb, Target, BookOpen,
  Building2, ShieldQuestion, ArrowLeftRight, PenLine, X,
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
  id: string;
  pillar: string;
  title: string;
  hook: string;
  talking_points: string[];
  script: string | null;
  target_length: string;
  recording_mode: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function PillarBadge({ pillar }: { pillar: string }) {
  const meta = PILLAR_META[pillar] || { label: pillar, color: '#6b7280', icon: Lightbulb };
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
      style={{ backgroundColor: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}25` }}>
      <meta.icon className="w-2.5 h-2.5" />
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, color: '#6b7280' };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>
      {meta.label}
    </span>
  );
}

export default function AdminYouTubePage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number>; byPillar: Record<string, number> }>({ total: 0, byStatus: {}, byPillar: {} });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Generate panel
  const [genPillar, setGenPillar] = useState('mixed');
  const [genCount, setGenCount] = useState(5);
  const [genContext, setGenContext] = useState('');
  const [generating, setGenerating] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPillar, setFilterPillar] = useState('');

  // Script generation
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
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
    }
  }, [filterStatus, filterPillar]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/yt/ideas/stats/summary`);
      const data = await res.json();
      if (data.success) setStats({ total: data.total, byStatus: data.byStatus, byPillar: data.byPillar });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchIdeas(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchIdeas, fetchStats]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API}/api/yt/ideas/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillar: genPillar, count: genCount, context: genContext }),
      });
      const data = await res.json();
      if (data.success) {
        setGenContext('');
        await Promise.all([fetchIdeas(), fetchStats()]);
      } else {
        alert(data.error || 'Generation failed');
      }
    } catch (err) {
      alert('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const updateIdea = async (id: string, updates: Partial<Idea>) => {
    try {
      const res = await fetch(`${API}/api/yt/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setIdeas(prev => prev.map(i => i.id === id ? data.idea : i));
        setEditingId(null);
        fetchStats();
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const deleteIdea = async (id: string) => {
    if (!confirm('Delete this idea?')) return;
    try {
      await fetch(`${API}/api/yt/ideas/${id}`, { method: 'DELETE' });
      setIdeas(prev => prev.filter(i => i.id !== id));
      fetchStats();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const generateScript = async (id: string) => {
    setScriptingId(id);
    try {
      const res = await fetch(`${API}/api/yt/ideas/${id}/script`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIdeas(prev => prev.map(i => i.id === id ? data.idea : i));
        setExpandedId(id);
        fetchStats();
      } else {
        alert(data.error || 'Script generation failed');
      }
    } catch (err) {
      alert('Script generation failed');
    } finally {
      setScriptingId(null);
    }
  };

  const modeLabels: Record<string, string> = {
    figured_something_out: '💡 Figured something out',
    showing_screen: '🖥️ Showing screen',
    telling_friend: '💬 Telling a friend',
  };

  return (
    <div className="min-h-screen p-6 lg:p-10" style={{ backgroundColor: '#050505', color: '#e5e7eb' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white">YouTube Content</h1>
          <p className="text-sm text-white/40 mt-1">Generate ideas, write scripts, manage your content pipeline</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/35">Total</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          {Object.entries(STATUS_META).filter(([k]) => k !== 'archived').map(([key, meta]) => (
            <div key={key} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: `${meta.color}90` }}>{meta.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.byStatus[key] || 0}</p>
            </div>
          ))}
        </div>

        {/* Generate Panel */}
        <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Generate Ideas</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1.5">Pillar</label>
              <select value={genPillar} onChange={e => setGenPillar(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-emerald-500/50">
                <option value="mixed">Mixed (all pillars)</option>
                {Object.entries(PILLAR_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1.5">Count</label>
              <select value={genCount} onChange={e => setGenCount(Number(e.target.value))}
                className="w-full rounded-lg px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-emerald-500/50">
                {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} ideas</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleGenerate} disabled={generating}
                className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#10b981', color: '#000' }}>
                {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</> : <><Sparkles className="w-3.5 h-3.5" />Generate</>}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1.5">Context (optional — trends, angles, specific topics)</label>
            <input type="text" value={genContext} onChange={e => setGenContext(e.target.value)}
              placeholder="e.g. focus on HVAC companies, or reference the GoHighLevel comparison angle"
              className="w-full rounded-lg px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-3.5 h-3.5 text-white/30" />
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setTimeout(fetchIdeas, 0); }}
            className="rounded-lg px-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] text-white/70 focus:outline-none">
            <option value="">All statuses</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterPillar} onChange={e => { setFilterPillar(e.target.value); setTimeout(fetchIdeas, 0); }}
            className="rounded-lg px-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] text-white/70 focus:outline-none">
            <option value="">All pillars</option>
            {Object.entries(PILLAR_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => { fetchIdeas(); fetchStats(); }} className="ml-auto rounded-lg p-1.5 text-white/30 hover:text-white/60 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-white/30">{ideas.length} showing</span>
        </div>

        {/* Ideas List */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/30" />
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Lightbulb className="w-8 h-8 mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/40">No ideas yet. Generate your first batch above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ideas.map(idea => {
              const isExpanded = expandedId === idea.id;
              const isEditing = editingId === idea.id;
              const isScripting = scriptingId === idea.id;

              return (
                <div key={idea.id} className="rounded-xl overflow-hidden transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}` }}>

                  {/* Row header */}
                  <div className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : idea.id)}>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />}
                    <PillarBadge pillar={idea.pillar} />
                    <p className="text-sm text-white font-medium flex-1 truncate">{idea.title}</p>
                    <span className="text-[11px] font-mono text-white/25 hidden sm:block">{idea.target_length}</span>
                    <StatusBadge status={idea.status} />
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-white/[0.04]">

                      {/* Hook */}
                      <div className="mb-4">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Hook</p>
                        <p className="text-sm text-white/70 italic">&ldquo;{idea.hook}&rdquo;</p>
                      </div>

                      {/* Talking points */}
                      <div className="mb-4">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2">Talking Points</p>
                        <ul className="space-y-1.5">
                          {(idea.talking_points || []).map((tp, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                              <span className="font-mono text-[10px] text-white/25 mt-0.5 w-4 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                              {tp}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-4 mb-4 text-[11px] text-white/35">
                        <span>Mode: {modeLabels[idea.recording_mode] || idea.recording_mode}</span>
                        <span>Length: {idea.target_length}</span>
                        <span>Created: {new Date(idea.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Notes */}
                      {isEditing ? (
                        <div className="mb-4 space-y-3">
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Title</label>
                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                              className="w-full rounded-lg px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Notes</label>
                            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2}
                              className="w-full rounded-lg px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none resize-none" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateIdea(idea.id, { title: editTitle, notes: editNotes || null })}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Save</button>
                            <button onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-white/50 border border-white/[0.08]">Cancel</button>
                          </div>
                        </div>
                      ) : idea.notes ? (
                        <div className="mb-4">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Notes</p>
                          <p className="text-sm text-white/50">{idea.notes}</p>
                        </div>
                      ) : null}

                      {/* Script */}
                      {idea.script && (
                        <div className="mb-4">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-2">Script</p>
                          <div className="rounded-lg p-4 text-sm text-white/65 leading-relaxed whitespace-pre-wrap font-mono text-[12px]"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', maxHeight: '400px', overflowY: 'auto' }}>
                            {idea.script}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {idea.status === 'idea' && (
                          <button onClick={() => updateIdea(idea.id, { status: 'approved' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors">
                            <Check className="w-3 h-3" />Approve
                          </button>
                        )}
                        {(idea.status === 'approved' || idea.status === 'idea') && !idea.script && (
                          <button onClick={() => generateScript(idea.id)} disabled={isScripting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20 hover:bg-violet-500/25 transition-colors disabled:opacity-40">
                            {isScripting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            {isScripting ? 'Writing...' : 'Generate Script'}
                          </button>
                        )}
                        {idea.status === 'scripted' && (
                          <button onClick={() => updateIdea(idea.id, { status: 'recorded' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors">
                            <Check className="w-3 h-3" />Mark Recorded
                          </button>
                        )}
                        <button onClick={() => { setEditingId(idea.id); setEditTitle(idea.title); setEditNotes(idea.notes || ''); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08] transition-colors">
                          <PenLine className="w-3 h-3" />Edit
                        </button>
                        <button onClick={() => updateIdea(idea.id, { status: 'archived' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-white/30 border border-white/[0.06] hover:bg-white/[0.08] transition-colors">
                          <Archive className="w-3 h-3" />Archive
                        </button>
                        <button onClick={() => deleteIdea(idea.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400/60 border border-red-500/10 hover:bg-red-500/20 transition-colors ml-auto">
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
