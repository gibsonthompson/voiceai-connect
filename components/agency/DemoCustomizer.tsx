'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Loader2, Check, Plus, X } from 'lucide-react';
import VoicePicker from '@/components/agency/VoicePicker';

interface Voice {
  id: string;
  name: string;
  gender?: string;
  accent?: string;
  style?: string;
  description?: string;
  previewUrl?: string;
  recommended?: boolean;
  custom?: boolean;
}

interface Props {
  agencyId: string;
  theme: any;
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');
const PLATFORM_DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah, the demo default
const DEFAULT_PREVIEW = "Hi, thanks for calling! I'm the AI receptionist, how can I help you today?";

export default function DemoCustomizer({ agencyId, theme }: Props) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'male' | 'female'>('all');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [greeting, setGreeting] = useState('');
  const [promptAdditions, setPromptAdditions] = useState('');
  const [initial, setInitial] = useState({ voice: '', greeting: '', additions: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Add-custom-voice state
  const [showAddVoice, setShowAddVoice] = useState(false);
  const [newVoiceId, setNewVoiceId] = useState('');
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceGender, setNewVoiceGender] = useState('');
  const [addingVoice, setAddingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  // Voice list comes from the same endpoint the AI Lab uses, so it includes the
  // agency's custom ElevenLabs voices (and any added here show up there too).
  const fetchVoices = useCallback(async () => {
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/ai-templates/voices`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (r.ok) {
        const d = await r.json();
        setVoices(Array.isArray(d.voices) ? d.voices : []);
      }
    } catch {
      /* non-fatal */
    }
  }, [agencyId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [vRes, cRes] = await Promise.all([
          fetch(`${backendUrl}/api/agency/${agencyId}/ai-templates/voices`, { headers: { Authorization: `Bearer ${getToken()}` } }),
          fetch(`${backendUrl}/api/agency/${agencyId}/demo-phone/config`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        ]);
        const vData = vRes.ok ? await vRes.json() : {};
        const list: Voice[] = Array.isArray(vData.voices) ? vData.voices : [];
        const cData = cRes.ok ? await cRes.json() : {};
        if (cancelled) return;
        setVoices(list);
        const vid = cData.demo_voice_id || PLATFORM_DEFAULT_VOICE_ID;
        setSelectedVoiceId(vid);
        setGreeting(cData.demo_greeting || '');
        setPromptAdditions(cData.demo_prompt_additions || '');
        setInitial({ voice: vid, greeting: cData.demo_greeting || '', additions: cData.demo_prompt_additions || '' });
      } catch {
        if (!cancelled) setError('Could not load voices');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [agencyId]);

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingVoiceId(null);
  };
  useEffect(() => () => stopAudio(), []);

  // Preview the agency's actual demo greeting in the chosen voice, synthesized
  // through the Vercel voice-preview route (the DigitalOcean backend can't reach
  // ElevenLabs over IPv6). Falls back to the voice's stock sample only if
  // synthesis fails.
  const playVoice = useCallback(async (voice: Voice) => {
    if (playingVoiceId === voice.id) { stopAudio(); return; }
    stopAudio();
    const text = (greeting.trim() || DEFAULT_PREVIEW).slice(0, 300);
    const playUrl = (url: string, isBlob: boolean) => {
      const a = new Audio(url);
      audioRef.current = a;
      setPlayingVoiceId(voice.id);
      const done = () => { setPlayingVoiceId(null); if (isBlob) { try { URL.revokeObjectURL(url); } catch {} } };
      a.onended = done;
      a.onerror = done;
      a.play().catch(done);
    };
    try {
      const r = await fetch(`/api/voice-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_id: voice.id, text }),
      });
      if (r.ok) {
        const blob = await r.blob();
        playUrl(URL.createObjectURL(blob), true);
      } else if (voice.previewUrl) {
        playUrl(voice.previewUrl, false);
      } else {
        setError('Preview unavailable for this voice');
      }
    } catch {
      if (voice.previewUrl) playUrl(voice.previewUrl, false);
    }
  }, [playingVoiceId, greeting]);

  const handleAddVoice = async () => {
    if (!newVoiceId.trim()) return;
    setVoiceError(''); setAddingVoice(true);
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/ai-templates/voices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ voiceId: newVoiceId.trim(), name: newVoiceName.trim(), gender: newVoiceGender || undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setVoiceError(d.error || 'Could not add that voice. Double-check the ElevenLabs voice ID.');
        return;
      }
      const d = await res.json().catch(() => ({}));
      await fetchVoices();
      const addedId = d.voice?.id || newVoiceId.trim();
      setSelectedVoiceId(addedId);
      setNewVoiceId(''); setNewVoiceName(''); setNewVoiceGender('');
      setShowAddVoice(false);
    } catch {
      setVoiceError('Could not add that voice. Please try again.');
    } finally {
      setAddingVoice(false);
    }
  };

  const handleDeleteVoice = async (voiceId: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/agency/${agencyId}/ai-templates/voices/${encodeURIComponent(voiceId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        if (selectedVoiceId === voiceId) setSelectedVoiceId(PLATFORM_DEFAULT_VOICE_ID);
        await fetchVoices();
      }
    } catch {
      /* non-fatal */
    }
  };

  const dirty = selectedVoiceId !== initial.voice || greeting !== initial.greeting || promptAdditions !== initial.additions;

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const r = await fetch(`${backendUrl}/api/agency/${agencyId}/demo-phone/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ demo_voice_id: selectedVoiceId || null, demo_greeting: greeting, demo_prompt_additions: promptAdditions }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error || 'Failed to save'); return; }
      setInitial({ voice: selectedVoiceId, greeting, additions: promptAdditions });
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const labelCls = 'block text-xs sm:text-sm font-medium mb-1.5';
  const inputStyle = { backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text };

  return (
    <div className="rounded-xl p-5 sm:p-6 mb-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Mic className="h-4 w-4" style={{ color: theme.primary }} />
        <h3 className="font-semibold text-base sm:text-lg" style={{ color: theme.text }}>Customize your demo</h3>
      </div>
      <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>
        Pick the voice callers hear and, if you want, tweak the greeting and add a few instructions. Optional, the demo works great as-is.
      </p>

      {loading ? (
        <div className="py-8 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted }} /></div>
      ) : (
        <>
          <div className="mb-3">
            <VoicePicker
              theme={theme}
              voices={voices}
              value={selectedVoiceId}
              onChange={setSelectedVoiceId}
              filter={voiceFilter}
              onFilter={setVoiceFilter}
              playingVoiceId={playingVoiceId}
              onPlay={(v: Voice) => playVoice(v)}
              onDeleteCustom={handleDeleteVoice}
            />
            <p className="text-[11px] mt-2" style={{ color: theme.textMuted }}>
              Previews play your greeting in that voice, not a generic sample.
            </p>
          </div>

          <div className="mb-5">
            {!showAddVoice ? (
              <button
                onClick={() => { setShowAddVoice(true); setVoiceError(''); }}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium"
                style={{ color: theme.primary }}
              >
                <Plus className="h-3.5 w-3.5" /> Add a custom voice
              </button>
            ) : (
              <div className="rounded-xl p-3.5" style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}` }}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs sm:text-sm font-medium" style={{ color: theme.text }}>Add a custom ElevenLabs voice</span>
                  <button onClick={() => { setShowAddVoice(false); setVoiceError(''); }} style={{ color: theme.textMuted }}><X className="h-4 w-4" /></button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={newVoiceId}
                    onChange={(e) => setNewVoiceId(e.target.value)}
                    placeholder="ElevenLabs voice ID"
                    className="flex-1 rounded-lg px-2.5 py-1.5 text-sm"
                    style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
                  />
                  <input
                    value={newVoiceName}
                    onChange={(e) => setNewVoiceName(e.target.value)}
                    placeholder="Name (optional)"
                    className="rounded-lg px-2.5 py-1.5 text-sm sm:w-40"
                    style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
                  />
                  <select
                    value={newVoiceGender}
                    onChange={(e) => setNewVoiceGender(e.target.value)}
                    className="rounded-lg px-2.5 py-1.5 text-sm sm:w-28"
                    style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
                  >
                    <option value="">Gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                  <button
                    onClick={handleAddVoice}
                    disabled={!newVoiceId.trim() || addingVoice}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText || '#fff' }}
                  >
                    {addingVoice ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...</> : <><Plus className="h-3.5 w-3.5" /> Add voice</>}
                  </button>
                </div>
                <p className="text-[11px] mt-2" style={{ color: theme.textMuted }}>
                  Find the voice ID in your ElevenLabs dashboard (Voices &rarr; the voice &rarr; ID). Voices you add here are shared with the AI Lab.
                </p>
                {voiceError && <p className="text-[11px] mt-1.5" style={{ color: theme.errorText || '#dc2626' }}>{voiceError}</p>}
              </div>
            )}
          </div>

          <div className="mb-5">
            <label className={labelCls} style={{ color: theme.text }}>Greeting <span style={{ color: theme.textMuted }}>(optional)</span></label>
            <input
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              maxLength={300}
              placeholder="Leave blank to use the default greeting"
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={inputStyle}
            />
          </div>

          <div className="mb-5">
            <label className={labelCls} style={{ color: theme.text }}>Extra instructions <span style={{ color: theme.textMuted }}>(optional)</span></label>
            <textarea
              value={promptAdditions}
              onChange={(e) => setPromptAdditions(e.target.value)}
              maxLength={1500}
              rows={3}
              placeholder="e.g. Mention we offer free estimates. Keep the tone upbeat and casual."
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
              style={inputStyle}
            />
            <p className="text-[11px] mt-1.5" style={{ color: theme.textMuted }}>
              Added on top of the demo&apos;s built-in behavior, not a replacement. Small nudges only, the core script stays the same.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ backgroundColor: theme.primary, color: theme.primaryText || '#fff' }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Save changes
            </button>
            {saved && <span className="text-xs sm:text-sm font-medium" style={{ color: theme.primary }}>Saved. The next demo call uses it.</span>}
            {error && <span className="text-xs sm:text-sm" style={{ color: theme.errorText || '#dc2626' }}>{error}</span>}
          </div>
        </>
      )}
    </div>
  );
}