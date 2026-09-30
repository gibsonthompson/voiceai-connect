'use client';

// Drop-in "How did you hear about us?" field for the AGENCY signup form.
//
// On selection it stores the answer in the vac_sr cookie, which the site-wide
// AttributionCapture flushes to Supabase when the signup reaches /onboarding.
// It does not depend on the form's state or submit handler, so it can be added
// without touching existing signup logic. Custom dropdown (matches ThemedSelect),
// so it never falls back to the native iOS wheel or the unstyleable OS popup.
// Pass onSelect if you also want the value in your own state.

import { useState, useRef, useEffect } from 'react';

const SR_COOKIE = 'vac_sr';
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

const OPTIONS = [
  'ChatGPT',
  'Claude',
  'Perplexity or other AI',
  'Google search',
  'YouTube',
  'Facebook or Instagram',
  'X / Twitter',
  'LinkedIn',
  'Reddit',
  'Friend or referral',
  'Other',
];

function writeSelfReport(value: string) {
  document.cookie = SR_COOKIE + '=' + encodeURIComponent(value) + '; path=/; max-age=' + MAX_AGE + '; samesite=lax';
}

export default function HowDidYouHear({
  label = 'How did you hear about us?',
  required = false,
  onSelect,
}: {
  label?: string;
  required?: boolean;
  onSelect?: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const pick = (v: string) => {
    setOpen(false);
    setValue(v);
    if (v) writeSelfReport(v);
    onSelect?.(v);
  };

  return (
    <div ref={ref}>
      <label className="block text-sm font-medium mb-2 text-[#fafaf9]/70">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full text-left rounded-xl border pl-4 pr-10 py-3.5 transition-all cursor-pointer focus:outline-none focus:ring-2 border-white/[0.08] bg-white/[0.03] text-[#fafaf9] focus:border-white/20"
          style={{ ['--tw-ring-color' as string]: '#10b98130' } as React.CSSProperties}
        >
          <span className={value ? '' : 'text-[#fafaf9]/40'}>{value || 'Select an option'}</span>
          <svg className={`absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-transform ${open ? 'rotate-180' : ''} text-[#fafaf9]/40`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>

        {/* Keep the value in the form data + native required validation */}
        <input type="hidden" name="how_heard" value={value} />
        {required && (
          <input tabIndex={-1} aria-hidden="true" required value={value} onChange={() => {}}
            style={{ position: 'absolute', opacity: 0, height: 1, width: 1, bottom: 0, left: '50%', pointerEvents: 'none' }} />
        )}

        {open && (
          <div role="listbox" className="absolute z-50 mt-1.5 w-full rounded-xl border shadow-xl overflow-hidden"
            style={{ backgroundColor: '#0e0e0e', borderColor: 'rgba(255,255,255,0.10)', maxHeight: '16rem', overflowY: 'auto' }}>
            {OPTIONS.map((o) => {
              const isSel = o === value;
              return (
                <button
                  key={o}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  onClick={() => pick(o)}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors text-[#fafaf9]"
                  style={{ background: isSel ? '#10b98122' : 'transparent' }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                >
                  {o}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}