'use client';

import type { ReactNode } from 'react';

function hexToRgba(hex: string, alpha: number): string {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return `rgba(0, 0, 0, ${alpha})`;
  }
}

// The one consistent section card for the client dashboard: a solid surface with
// a tinted icon square, title, optional one-line description, a hairline divider,
// then the content. Everything is driven by the theme (agency accent + light or
// dark), so it adapts to any agency. Use it on every client page for a single,
// cohesive look. `accent` overrides the surface tint/border (e.g. an active
// HIPAA card); `action` renders on the right of the header (e.g. an Edit button).
export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  accent,
  theme,
  primaryColor,
  className = '',
  children,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  accent?: boolean;
  theme: any;
  primaryColor: string;
  className?: string;
  children: ReactNode;
}) {
  const borderColor = accent ? primaryColor : theme.border;
  const bg = accent ? hexToRgba(primaryColor, theme.isDark ? 0.06 : 0.02) : theme.card;
  return (
    <section className={`mb-4 sm:mb-5 ${className}`}>
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: bg, border: `1px solid ${borderColor}` }}>
        <div
          className="p-4 sm:p-5"
          style={{ borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: hexToRgba(primaryColor, theme.isDark ? 0.1 : 0.06) }}
            >
              <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" style={{ color: primaryColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm tracking-tight" style={{ color: theme.text }}>{title}</h3>
              {subtitle && <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted4 }}>{subtitle}</p>}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </section>
  );
}