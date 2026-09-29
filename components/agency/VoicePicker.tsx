'use client';

import { Play, Pause, Check } from 'lucide-react';

// Shared voice picker for the AI receptionist editors (client config + industry
// templates). Extracted from the client editor so both pages render the exact
// same control: gender filter, audio previews, recommended stars, and a
// "Current voice" fallback card when the active voice isn't in the standard list.

function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch { return `rgba(0,0,0,${alpha})`; }
}

interface VoicePickerProps {
  theme: any;
  voices: any[];
  value: string;
  onChange: (id: string) => void;
  filter: 'all' | 'female' | 'male';
  onFilter: (f: 'all' | 'female' | 'male') => void;
  playingVoiceId: string | null;
  onPlay: (v: any) => void;
}

export default function VoicePicker({ theme, voices, value, onChange, filter, onFilter, playingVoiceId, onPlay }: VoicePickerProps) {
  const filtered = (filter === 'all' ? voices : voices.filter(v => v.gender === filter))
    .slice()
    .sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));

  const notInList = !!value && voices.length > 0 && !voices.some(v => v.id === value);
  const shown: any[] = notInList
    ? [{ id: value, name: 'Current voice', accent: 'Active', style: '', description: 'Set on this assistant but not in the standard list — pick one below to change it.', recommended: false }, ...filtered]
    : filtered;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium" style={{ color: theme.textMuted }}>Voice</label>
          {notInList && <span className="text-sm" style={{ color: '#f59e0b' }}>Live voice not in list — pick one to set it</span>}
        </div>
        <div className="flex gap-1">
          {(['all', 'female', 'male'] as const).map(f => (
            <button
              key={f}
              onClick={() => onFilter(f)}
              className="px-2.5 py-1 rounded-md text-sm font-medium transition"
              style={{ backgroundColor: filter === f ? theme.primary : theme.hover, color: filter === f ? theme.primaryText : theme.textMuted }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {shown.map((v: any) => {
          const isSelected = value === v.id;
          const isPlaying = playingVoiceId === v.id;
          return (
            <div
              key={v.id}
              onClick={() => onChange(v.id)}
              className="relative rounded-xl p-3 cursor-pointer transition-all border-2"
              style={{ borderColor: isSelected ? theme.primary : theme.border, backgroundColor: isSelected ? hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.03) : theme.card }}
            >
              {v.recommended && <span className="absolute -top-1.5 -right-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>★</span>}
              <div className="flex items-center gap-2 mb-1.5">
                <button
                  onClick={e => { e.stopPropagation(); onPlay(v); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition"
                  style={{ backgroundColor: isPlaying ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'), color: isPlaying ? theme.primaryText : theme.textMuted }}
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm truncate" style={{ color: theme.text }}>{v.name}</span>
                    {isSelected && <Check className="h-3 w-3 flex-shrink-0" style={{ color: theme.primary }} />}
                  </div>
                  <p className="text-[11px]" style={{ color: theme.textMuted }}>{v.accent || v.gender}{v.style ? ` · ${v.style}` : ''}</p>
                </div>
              </div>
              {v.description && <p className="text-[11px] leading-snug" style={{ color: theme.textMuted }}>{v.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}