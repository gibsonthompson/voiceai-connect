'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

// Shared theming passed in by the host page so these components match whatever
// dashboard (agency or client) they render inside.
export type DropdownUI = {
  inputStyle: React.CSSProperties;
  text: string;
  muted: string;
  panelBg: string;
  panelBorder: string;
  hover: string;
  accent: string;
  isDark: boolean;
};

export type Option = { value: string; label: string };
export type Country = { code: string; name: string; flag: string };

// Custom single-select dropdown. Replaces the native <select> (which renders as
// an OS picker on iOS and is unstyleable) with a themed panel: keyboard nav,
// click-outside, disabled state, and a checkmark on the selected row.
export function CustomSelect({ value, onChange, options, placeholder, disabled, ui, size = 'md' }: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  ui: DropdownUI;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxH: number } | null>(null);
  const selected = options.find(o => o.value === value) || null;

  // Position the panel in a body-level portal so it is never clipped by an
  // overflow-hidden ancestor (rounded cards, the leads list, etc.). Opens below
  // the trigger, flips above when there isn't room.
  const measure = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const gap = 6;
    const below = window.innerHeight - r.bottom - gap - 8;
    const above = r.top - gap - 8;
    const openUp = below < 160 && above > below;
    const maxH = Math.max(120, Math.min(240, openUp ? above : below));
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
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => { if (open) setActive(Math.max(0, options.findIndex(o => o.value === value))); }, [open]);
  useEffect(() => {
    if (open && active >= 0 && listRef.current) {
      (listRef.current.children[active] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
    }
  }, [active, open]);

  const commit = (v: string) => { onChange(v); setOpen(false); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0 && options[active]) commit(options[active].value); }
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full rounded-xl flex items-center justify-between gap-2 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}`}
        style={ui.inputStyle}
      >
        <span className="truncate text-left" style={{ color: selected ? ui.text : ui.muted }}>{selected ? selected.label : (placeholder || 'Select...')}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: ui.muted }} />
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={listRef}
          role="listbox"
          className="rounded-xl overflow-y-auto py-1 shadow-xl"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxH, zIndex: 9999, backgroundColor: ui.panelBg, border: `1px solid ${ui.panelBorder}` }}
        >
          {options.map((o, i) => {
            const isSel = o.value === value;
            const isAct = i === active;
            return (
              <button
                type="button"
                key={o.value}
                role="option"
                aria-selected={isSel}
                onClick={() => commit(o.value)}
                onMouseEnter={() => setActive(i)}
                className={`w-full text-left flex items-center justify-between gap-2 transition-colors ${size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'}`}
                style={{ backgroundColor: isAct ? ui.hover : 'transparent', color: ui.text }}
              >
                <span className="truncate">{o.label}</span>
                {isSel && <Check className="h-4 w-4 flex-shrink-0" style={{ color: ui.accent }} />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

// Countries shown at the top of the list, before the full alphabetical set.
export const COMMON_COUNTRY_CODES = ['US', 'CA', 'GB', 'AU', 'NZ', 'IE'];

// Searchable country dropdown: a search box filters the list, and the most
// common countries are grouped first when not searching.
export function CountrySelect({ value, onChange, countries, disabled, ui }: {
  value: string;
  onChange: (v: string) => void;
  countries: Country[];
  disabled?: boolean;
  ui: DropdownUI;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = countries.find(c => c.code === value) || null;

  const common = COMMON_COUNTRY_CODES.map(code => countries.find(c => c.code === code)).filter(Boolean) as Country[];
  const rest = countries.filter(c => !COMMON_COUNTRY_CODES.includes(c.code));
  const ordered = [...common, ...rest];

  const q = query.trim().toLowerCase();
  const filtered = q ? ordered.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q) : ordered;
  const commonCount = q ? 0 : common.length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => { if (open) { setActive(0); setTimeout(() => searchRef.current?.focus(), 10); } }, [open]);
  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    if (open && listRef.current) {
      (listRef.current.querySelectorAll('[role="option"]')[active] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
    }
  }, [active, open]);

  const commit = (code: string) => { onChange(code); setOpen(false); setQuery(''); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) commit(filtered[active].code); }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full rounded-xl px-4 py-2.5 text-sm flex items-center justify-between gap-2 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={ui.inputStyle}
      >
        <span className="truncate text-left" style={{ color: selected ? ui.text : ui.muted }}>{selected ? `${selected.flag} ${selected.name}` : 'Select country...'}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: ui.muted }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl overflow-hidden shadow-xl" style={{ backgroundColor: ui.panelBg, border: `1px solid ${ui.panelBorder}` }}>
          <div className="p-2" style={{ borderBottom: `1px solid ${ui.panelBorder}` }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: ui.muted }} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search countries..."
                className="w-full rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none"
                style={{ backgroundColor: ui.isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', border: `1px solid ${ui.panelBorder}`, color: ui.text }}
              />
            </div>
          </div>
          <div ref={listRef} role="listbox" className="overflow-y-auto py-1" style={{ maxHeight: '14rem' }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: ui.muted }}>No countries found</div>
            ) : filtered.map((c, i) => {
              const isSel = c.code === value;
              const isAct = i === active;
              return (
                <div key={c.code}>
                  {commonCount > 0 && i === 0 && (
                    <div className="px-4 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: ui.muted }}>Common</div>
                  )}
                  {commonCount > 0 && i === commonCount && (
                    <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: ui.muted, borderTop: `1px solid ${ui.panelBorder}`, marginTop: '0.25rem' }}>All countries</div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onClick={() => commit(c.code)}
                    onMouseEnter={() => setActive(i)}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors"
                    style={{ backgroundColor: isAct ? ui.hover : 'transparent', color: ui.text }}
                  >
                    <span className="truncate">{c.flag} {c.name}</span>
                    {isSel && <Check className="h-4 w-4 flex-shrink-0" style={{ color: ui.accent }} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}