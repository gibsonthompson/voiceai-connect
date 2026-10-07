'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxH: number } | null>(null);

  const results = useMemo(() => searchTimezones(query, value), [query, value]);
  const selectedLabel = value ? getTimezoneLabel(value) : '';

  // Position the panel in a body-level portal so it is never clipped by an
  // overflow-hidden ancestor (the rounded section cards clip absolutely
  // positioned children). Opens below the trigger, flips above when tight.
  const measure = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const gap = 6;
    const below = window.innerHeight - r.bottom - gap - 8;
    const above = r.top - gap - 8;
    const openUp = below < 240 && above > below;
    const maxH = Math.max(160, Math.min(320, openUp ? above : below));
    setPos({ top: openUp ? Math.max(8, r.top - gap - maxH) : r.bottom + gap, left: r.left, width: r.width, maxH });
  }, []);

  useEffect(() => {
    if (!open) { setPos(null); return; }
    measure();
    const onScroll = () => measure();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', measure);
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', measure); };
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
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
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg focus:outline-none disabled:opacity-50 text-left"
        style={ui.inputStyle}
      >
        <span className="truncate" style={{ color: selectedLabel ? ui.text : ui.muted }}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: ui.muted }} />
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="rounded-xl overflow-hidden shadow-xl"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999, backgroundColor: ui.panelBg, border: `1px solid ${ui.panelBorder}`, display: 'flex', flexDirection: 'column', maxHeight: pos.maxH }}
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
          <div className="overflow-y-auto py-1" style={{ flex: 1 }}>
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
        </div>,
        document.body
      )}
    </div>
  );
}