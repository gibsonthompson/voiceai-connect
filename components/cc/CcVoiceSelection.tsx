'use client';

// Voice selection for the call-center business config. Mirrors the AI Lab voice
// section: lists the business's available ElevenLabs voices (grouped female /
// male), previews each, and saves the choice. Uses the agency/manager token,
// which the backend's requirePermissionIfAuthed('ai_agent') accepts for an
// agency owner, so no new endpoint is needed.

import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, Play, Pause, Loader2, Check, Save } from 'lucide-react';

const API = () => process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');

interface Voice {
  id: string;
  name: string;
  gender?: string;
  accent?: string;
  style?: string;
  previewUrl?: string;
  recommended?: boolean;
  custom?: boolean;
}

export default function CcVoiceSelection({ clientId, theme }: { clientId: string; theme: any }) {
  const [voices, setVoices] = useState<{ female: Voice[]; male: Voice[] }>({ female: [], male: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'female' | 'male'>('all');
  const [currentVoiceId, setCurrentVoiceId] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadVoices = useCallback(async () => {
    if (!clientId) return;
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`${API()}/api/client/${clientId}/voices`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      const d = await r.json();
      if (r.ok && d.success && d.grouped) setVoices({ female: d.grouped.female || [], male: d.grouped.male || [] });
      else throw new Error(d.error || 'Could not load voices.');
    } catch (e: any) { setErr(e.message || 'Could not load voices.'); } finally { setLoading(false); }
  }, [clientId]);

  const loadCurrent = useCallback(async () => {
    if (!clientId) return;
    try {
      const r = await fetch(`${API()}/api/client/${clientId}/voice`, { headers: { Authorization: `Bearer ${TOKEN()}` } });
      if (r.ok) { const d = await r.json(); if (d.success) { setCurrentVoiceId(d.voice_id || ''); setSelectedVoiceId(d.voice_id || ''); } }
    } catch { /* non-blocking */ }
  }, [clientId]);

  useEffect(() => { loadVoices(); loadCurrent(); }, [loadVoices, loadCurrent]);
  // Stop any preview playback on unmount.
  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

  const allVoices = (): Voice[] => [...(voices.female || []), ...(voices.male || [])];
  const total = allVoices().length;
  const filtered = (): Voice[] => {
    const f = filter === 'female' ? (voices.female || []) : filter === 'male' ? (voices.male || []) : allVoices();
    return f.slice().sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
  };

  // Always show the active voice, even if it is not in the standard list for
  // this business (e.g. a custom voice set directly on the assistant).
  const activeId = selectedVoiceId || currentVoiceId;
  const notInList = !!activeId && total > 0 && !allVoices().some((v) => v.id === activeId);
  const shown: Voice[] = notInList
    ? [{ id: activeId, name: 'Current voice', accent: 'Active', style: '' }, ...filtered()]
    : filtered();

  const stop = () => { if (audioRef.current) audioRef.current.pause(); setPlayingId(null); };
  const preview = (v: Voice) => {
    if (playingId === v.id) { stop(); return; }
    stop();
    if (!v.previewUrl) return;
    const a = new Audio(v.previewUrl);
    audioRef.current = a;
    a.onended = () => setPlayingId(null);
    a.onerror = () => setPlayingId(null);
    a.play().then(() => setPlayingId(v.id)).catch(() => setPlayingId(null));
  };

  const save = async () => {
    if (!selectedVoiceId || selectedVoiceId === currentVoiceId) return;
    setSaving(true); setErr(null); setSaved(false);
    try {
      const r = await fetch(`${API()}/api/client/${clientId}/voice`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` },
        body: JSON.stringify({ voice_id: selectedVoiceId }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.success) { setCurrentVoiceId(selectedVoiceId); setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else { setErr(d.error || 'Could not save voice.'); setSelectedVoiceId(currentVoiceId); }
    } catch { setErr('Could not save voice.'); setSelectedVoiceId(currentVoiceId); } finally { setSaving(false); }
  };

  const card = { backgroundColor: theme.card, border: `1px solid ${theme.border}` } as React.CSSProperties;
  const hasChange = !!selectedVoiceId && selectedVoiceId !== currentVoiceId;
  const FILTERS: Array<'all' | 'female' | 'male'> = ['all', 'female', 'male'];

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={card}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}><Mic className="h-4 w-4" style={{ color: theme.primary }} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm sm:text-[15px]" style={{ color: theme.text }}>Voice</h2>
          <p className="text-[12px]" style={{ color: theme.textMuted }}>The voice callers hear. Preview one, pick it, and save.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-6 justify-center" style={{ color: theme.textMuted }}><Loader2 className="h-4 w-4 animate-spin" /> Loading voices...</div>
      ) : err && total === 0 ? (
        <div className="py-6 text-center"><p className="text-sm mb-2" style={{ color: theme.error }}>{err}</p><button onClick={loadVoices} className="text-sm underline" style={{ color: theme.primary }}>Try again</button></div>
      ) : total === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: theme.textMuted }}>No voices available for this business yet.</p>
      ) : (
        <>
          <div className="flex items-center gap-1.5 mb-3">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition"
                style={{ backgroundColor: filter === f ? theme.primary : theme.hover, color: filter === f ? theme.primaryText : theme.textMuted }}>
                {f === 'all' ? `All (${total})` : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {shown.map((v) => {
              const sel = selectedVoiceId === v.id;
              const playing = playingId === v.id;
              const meta = v.custom ? 'Custom voice' : [v.accent, v.style].filter(Boolean).join(' · ');
              return (
                <div key={v.id} onClick={() => setSelectedVoiceId(v.id)} className="relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition"
                  style={{ border: `1px solid ${sel ? theme.primary : theme.border}`, backgroundColor: sel ? theme.primary15 : 'transparent' }}>
                  {v.recommended && <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded-full" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>★</span>}
                  {v.previewUrl && (
                    <button onClick={(e) => { e.stopPropagation(); preview(v); }} className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0" style={{ backgroundColor: theme.hover, color: theme.text }} title="Preview">
                      {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[13px] truncate" style={{ color: theme.text }}>{v.name}</span>
                      {v.custom && <span className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: theme.primary15, color: theme.primary }}>CUSTOM</span>}
                      {sel && <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.primary }} />}
                    </div>
                    {meta && <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>{meta}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <span className="text-[12px]" style={{ color: err ? theme.error : theme.success }}>
              {err ? err : saved ? <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> Saved. Callers hear it on the next call.</span> : hasChange ? <span style={{ color: theme.textMuted }}>Unsaved voice change.</span> : ''}
            </span>
            <button onClick={save} disabled={saving || !hasChange} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save voice
            </button>
          </div>
        </>
      )}
    </div>
  );
}
