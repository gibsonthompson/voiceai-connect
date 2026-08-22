'use client';

// Drop-in "How did you hear about us?" field for the AGENCY signup form.
//
// On selection it stores the answer in the vac_sr cookie, which the site-wide
// AttributionCapture flushes to Supabase when the signup reaches /onboarding.
// It does not depend on the form's state or submit handler, so it can be added
// without touching existing signup logic. Styled to match the dark agency form
// (ThemedSelect). Pass onSelect if you also want the value in your own state.

import { useState } from 'react';

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

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-[#fafaf9]/70">{label}</label>
      <div className="relative">
        <select
          name="how_heard"
          value={value}
          required={required}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            if (v) writeSelfReport(v);
            onSelect?.(v);
          }}
          className="w-full rounded-xl border pl-4 pr-10 py-3.5 transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 border-white/[0.08] bg-white/[0.03] text-[#fafaf9] focus:border-white/20 focus:bg-white/[0.05]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            backgroundSize: '1.25rem',
            ['--tw-ring-color' as string]: '#10b98130',
          } as React.CSSProperties}
        >
          <option value="" className="bg-neutral-900">Select an option</option>
          {OPTIONS.map((o) => (
            <option key={o} value={o} className="bg-neutral-900">{o}</option>
          ))}
        </select>
      </div>
    </div>
  );
}