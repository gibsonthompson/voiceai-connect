'use client';

// A themed font picker where every option is rendered IN that font, so you can
// see what each typeface looks like before choosing. Loads the whole catalog at
// a light weight when opened. Custom dropdown (no native <select>), matches the
// dashboard theme via the shared DropdownUI shape.

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { type DropdownUI } from '@/components/ui/custom-select';
import { fontOptions, fontStack, allFontsHref } from '@/lib/brandFonts';

export default function FontSelect({
  value, onChange, slot, ui,
}: {
  value: string;
  onChange: (v: string) => void;
  slot: 'display' | 'body';
  ui: DropdownUI;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const opts = fontOptions(slot);

  // Load every catalog font (once, when first opened) so each option renders in
  // its own typeface.
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!open || loadedRef.current) return;
    const href = allFontsHref();
    if (!href) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    loadedRef.current = true;
    // Leave it in the head; the fonts are useful for the rest of the session.
  }, [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm outline-none"
        style={ui.inputStyle}
      >
        <span className="truncate" style={{ fontFamily: fontStack(value, slot), color: ui.text, fontSize: '0.95rem' }}>{value}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: ui.muted }} />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-xl py-1 shadow-xl"
          style={{ backgroundColor: ui.panelBg, border: `1px solid ${ui.panelBorder}` }}
        >
          {opts.map((o) => {
            const on = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors"
                style={{ backgroundColor: on ? ui.hover : 'transparent' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ui.hover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = on ? ui.hover : 'transparent'; }}
              >
                <span className="truncate" style={{ fontFamily: fontStack(o.value, slot), color: ui.text, fontSize: '1rem' }}>{o.label}</span>
                {on && <Check className="h-4 w-4 flex-shrink-0" style={{ color: ui.accent }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
