'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { searchTimezones, getTimezoneLabel } from '@/lib/timezones';

export interface TimezoneSelectUI {
  inputStyle?: React.CSSProperties;
  text: string;
  muted: string;
  panelBg: string;
  panelBorder: string;
  hover: string;
  accent: string;
  isDark: boolean;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  ui: TimezoneSelectUI;
  disabled?: boolean;
  placeholder?: string;
}

export function TimezoneSelect({ value, onChange, ui, disabled, placeholder = 'Select time zone...' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchTimezones(query, value), [query, value]);
  const selectedLabel = value ? getTimezoneLabel(value) : '';

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => searchRef.current?.focus(), 20);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg focus:outline-none disabled:opacity-50 text-left"
        style={ui.inputStyle}
      >
        <span className="truncate" style={{ color: selectedLabel ? ui.text : ui.muted }}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: ui.muted }} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden shadow-xl"
          style={{ backgroundColor: ui.panelBg, border: `1px solid ${ui.panelBorder}` }}
        >
          <div className="p-2" style={{ borderBottom: `1px solid ${ui.panelBorder}` }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: ui.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
              <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: ui.muted }} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city, country, or offset..."
                className="w-full bg-transparent text-sm focus:outline-none"
                style={{ color: ui.text }}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {results.length === 0 ? (
              <div className="px-3 py-3 text-xs text-center" style={{ color: ui.muted }}>No matches</div>
            ) : (
              results.map((tz) => {
                const selected = tz.value === value;
                return (
                  <button
                    key={tz.value}
                    type="button"
                    onClick={() => { onChange(tz.value); setOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors"
                    style={{ color: ui.text, backgroundColor: selected ? (ui.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent' }}
                    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = ui.hover; }}
                    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span className="truncate">{tz.label}</span>
                    {selected && <Check className="h-4 w-4 flex-shrink-0" style={{ color: ui.accent }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}