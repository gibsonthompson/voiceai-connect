'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Play, Pause, Loader2, Check, Sparkles } from 'lucide-react';

interface Voice {
  id: string;
  name: string;
  gender?: string;
  accent?: string;
  style?: string;
  description?: string;
  previewUrl?: string;
  recommended?: boolean;
}

interface Props {
  agencyId: string;
  theme: any;
}

const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '');
const DEFAULT_PREVIEW = "Hi, thanks for calling! I'm the AI receptionist, how can I help you today?";

export default function DemoCustomizer({ agencyId, theme }: Props) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [greeting, setGreeting] = useState('');
  const [promptAdditions, setPromptAdditions] = useState('');
  const [initial, setInitial] = useState({ voice: '', greeting: '', additions: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [vRes, cRes] = await Promise.all([
          fetch(`${backendUrl}/api/voices`, { headers: { Authorization: `Bearer ${getToken()}` } }),
          fetch(`${backendUrl}/api/agency/${agencyId}/demo-phone/config`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        ]);
        const vData = vRes.ok ? await vRes.json() : {};
        const list: Voice[] = vData.voices || [...(vData.female || []), ...(vData.male || [])];
        const cData = cRes.ok ? await cRes.json() : {};
        if (cancelled) return;
        setVoices(Array.isArray(list) ? list : []);
        const vid = cData.demo_voice_id || '';
        setSelectedVoiceId(vid);
        setGreeting(cData.demo_greeting || '');
        setPromptAdditions(cData.demo_prompt_additions || '');
        setInitial({ voice: vid, greeting: cData.demo_greeting || '', additions: cData.demo_prompt_additions || '' });
      } catch {
        if (!cancelled) setError('Could not load voice options');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [agencyId]);

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingId(null);
  };

  const playVoice = useCallback(async (voice: Voice) => {
    if (playingId === voice.id) { stopAudio(); return; }
    stopAudio();
    const text = (greeting.trim() || DEFAULT_PREVIEW).slice(0, 280);
    const playUrl = (url: string, isBlob: boolean) => {
      const a = new Audio(url);
      audioRef.current = a;
      setPlayingId(voice.id);
      const done = () => { setPlayingId(null); if (isBlob) { try { URL.revokeObjectURL(url); } catch {} } };
      a.onended = done;
      a.onerror = done;
      a.play().catch(done);
    };
    setPreviewLoadingId(voice.id);
    try {
      const r = await fetch(`${backendUrl}/api/voices/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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
    } finally {
      setPreviewLoadingId(null);
    }
  }, [playingId, greeting]);

  useEffect(() => () => stopAudio(), []);

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

  const VoiceRow = ({ voice, isDefault }: { voice?: Voice; isDefault?: boolean }) => {
    const id = isDefault ? '' : voice!.id;
    const selected = selectedVoiceId === id;
    return (
      <div
        onClick={() => setSelectedVoiceId(id)}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-colors"
        style={{ backgroundColor: selected ? theme.primary15 : theme.input, border: `1px solid ${selected ? theme.primary30 : theme.inputBorder}` }}
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ border: `2px solid ${selected ? theme.primary : theme.inputBorder}`, backgroundColor: selected ? theme.primary : 'transparent' }}>
          {selected && <Check className="h-3 w-3" style={{ color: theme.primaryText || '#fff' }} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium" style={{ color: theme.text }}>{isDefault ? 'Platform default' : voice!.name}</span>
            {!isDefault && voice!.recommended && (
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.primary15, color: theme.primary }}><Sparkles className="h-2.5 w-2.5" />Recommended</span>
            )}
            {!isDefault && (voice!.accent || voice!.style) && (
              <span className="text-[11px]" style={{ color: theme.textMuted }}>{[voice!.accent, voice!.style].filter(Boolean).join(' · ')}</span>
            )}
          </div>
          <p className="text-[11px] truncate mt-0.5" style={{ color: theme.textMuted }}>
            {isDefault ? 'Use the standard demo voice' : (voice!.description || '')}
          </p>
        </div>
        {!isDefault && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); playVoice(voice!); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
            style={{ backgroundColor: theme.primary15, color: theme.primary }}
            aria-label="Preview voice"
          >
            {previewLoadingId === voice!.id ? <Loader2 className="h-4 w-4 animate-spin" /> : playingId === voice!.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Mic className="h-4 w-4" style={{ color: theme.primary }} />
        <h3 className="font-semibold text-base sm:text-lg" style={{ color: theme.text }}>Customize your demo</h3>
      </div>
      <p className="text-xs sm:text-sm mb-4" style={{ color: theme.textMuted }}>
        Pick the voice callers hear and, if you want, tweak the greeting and add a few instructions. The demo works great as-is, this is optional.
      </p>

      {loading ? (
        <div className="py-8 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: theme.textMuted }} /></div>
      ) : (
        <>
          <div className="mb-5">
            <label className={labelCls} style={{ color: theme.text }}>Demo voice</label>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              <VoiceRow isDefault />
              {voices.map((v) => <VoiceRow key={v.id} voice={v} />)}
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: theme.textMuted }}>Tap a voice to hear it say your greeting.</p>
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
