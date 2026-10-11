'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Share, MoreVertical, Plus, Download, Smartphone, ChevronRight, Copy, Check } from 'lucide-react';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Platform = 'ios' | 'android' | 'desktop';

interface Props {
  clientId: string;
  theme: any;
  isOpen?: boolean;
  onClose?: () => void;
  manualTrigger?: boolean;
  appName?: string;
  /** The real home-screen icon (the square compositor). When set, the mock
   *  previews show this exact icon instead of a generic waveform, so the
   *  walkthrough matches what actually lands on the home screen. */
  iconUrl?: string;
}

// The real app icon in the mock previews, falling back to the agency-colored
// waveform tile only when no icon URL is available. Keeps the walkthrough fully
// white-labeled: the client sees their actual icon and name.
function MockAppIcon({ iconUrl, theme, px, radius }: { iconUrl?: string; theme: any; px: number; radius: string }) {
  if (iconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={iconUrl} alt="" width={px} height={px} style={{ borderRadius: radius, objectFit: 'cover' }} />;
  }
  return (
    <div className="flex items-center justify-center flex-shrink-0" style={{ width: px, height: px, borderRadius: radius, backgroundColor: theme.primary }}>
      <svg viewBox="0 0 24 24" fill="none" style={{ width: px * 0.5, height: px * 0.5 }}>
        <rect x="2" y="9" width="2" height="6" rx="1" fill="#fff" opacity="0.6" />
        <rect x="5" y="7" width="2" height="10" rx="1" fill="#fff" opacity="0.8" />
        <rect x="8" y="4" width="2" height="16" rx="1" fill="#fff" />
        <rect x="11" y="6" width="2" height="12" rx="1" fill="#fff" />
        <rect x="14" y="3" width="2" height="18" rx="1" fill="#fff" />
        <rect x="17" y="7" width="2" height="10" rx="1" fill="#fff" opacity="0.8" />
        <rect x="20" y="9" width="2" height="6" rx="1" fill="#fff" opacity="0.6" />
      </svg>
    </div>
  );
}

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if ('standalone' in window.navigator && (window.navigator as any).standalone) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
}

const VISIT_COUNT_KEY = 'voiceai_pwa_visits';
const DISMISSED_KEY = 'voiceai_pwa_dismissed';
const INSTALLED_KEY = 'voiceai_pwa_installed';
const TRIGGER_AFTER_VISITS = 3;

// ============================================================================
// MOCK IPHONE UI, renders themed to match agency branding
// ============================================================================
// Normalize whatever host we're handed (strip protocol, leading www., trailing
// slash) so the mock shows a clean address and never overflows the phone.
function cleanHost(domain: string): string {
  return (domain || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
}

function IPhoneMockStep({ step, theme, appName, iconUrl, domain }: { step: number; theme: any; appName: string; iconUrl?: string; domain: string }) {
  const isDark = theme.isDark;
  const mockBg = isDark ? '#1c1c1e' : '#f2f2f7';
  const mockCard = isDark ? '#2c2c2e' : '#ffffff';
  const mockText = isDark ? '#ffffff' : '#000000';
  const mockMuted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const mockBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const mockSep = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const fieldBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const accentBlue = '#007AFF';
  const host = cleanHost(domain);

  if (step === 0) {
    // Tap the Share button — a page in Safari with the real bottom toolbar.
    return (
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: mockBg, border: `1px solid ${mockBorder}` }}>
        {/* Safari address bar */}
        <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ backgroundColor: mockCard, borderBottom: `1px solid ${mockSep}` }}>
          <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: mockMuted }}>aA</span>
          <div className="flex-1 min-w-0 flex items-center justify-center gap-1 rounded-lg px-2 py-1" style={{ backgroundColor: fieldBg }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 flex-shrink-0" style={{ color: mockMuted }}><path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z"/></svg>
            <span className="text-[10px] font-medium truncate" style={{ color: mockText }}>{host}</span>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: mockMuted }}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        </div>
        {/* Page body — the branded app */}
        <div className="px-4 py-7 flex items-center justify-center" style={{ minHeight: '112px' }}>
          <div className="text-center max-w-full px-4">
            <div className="mb-2.5 flex justify-center">
              <MockAppIcon iconUrl={iconUrl} theme={theme} px={48} radius="12px" />
            </div>
            <p className="text-[11px] font-semibold truncate" style={{ color: mockText }}>{appName}</p>
            <p className="text-[9px] truncate mt-0.5" style={{ color: mockMuted }}>{host}</p>
          </div>
        </div>
        {/* Safari bottom toolbar: back, forward, share (highlighted), book, tabs */}
        <div className="flex items-center justify-between px-6 py-2.5" style={{ backgroundColor: isDark ? '#1c1c1e' : '#f7f7f8', borderTop: `1px solid ${mockSep}` }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={accentBlue} strokeWidth="2.5" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke={accentBlue} strokeWidth="2.5" className="w-4 h-4 opacity-40"><path d="M9 18l6-6-6-6"/></svg>
          {/* Share — highlighted with pulse */}
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(accentBlue, 0.15) }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={accentBlue} strokeWidth="2" className="w-4 h-4"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
            </div>
            <div className="absolute -inset-1 rounded-xl border-2 animate-pulse" style={{ borderColor: accentBlue, opacity: 0.45 }} />
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke={accentBlue} strokeWidth="2" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          <svg viewBox="0 0 24 24" fill="none" stroke={accentBlue} strokeWidth="2" className="w-4 h-4"><rect x="3" y="4" width="8" height="8" rx="1.5"/><rect x="13" y="4" width="8" height="8" rx="1.5"/><rect x="3" y="14" width="8" height="6" rx="1.5"/><rect x="13" y="14" width="8" height="6" rx="1.5"/></svg>
        </div>
      </div>
    );
  }

  if (step === 1) {
    // The iOS share sheet — page preview header + action list, "Add to Home
    // Screen" highlighted at the bottom.
    const rows = [
      { label: 'Copy', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> },
      { label: 'Add to Reading List', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="7" cy="12" r="3.2"/><circle cx="17" cy="12" r="3.2"/><path d="M10.2 12h3.6"/></svg> },
      { label: 'Add Bookmark', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> },
      { label: 'Add to Favourites', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
    ];
    return (
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: mockBg, border: `1px solid ${mockBorder}` }}>
        {/* Grab handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="rounded-full" style={{ width: 34, height: 4, backgroundColor: mockMuted, opacity: 0.4 }} />
        </div>
        {/* Page preview header */}
        <div className="mx-2 mb-1.5 flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ backgroundColor: mockCard }}>
          <MockAppIcon iconUrl={iconUrl} theme={theme} px={34} radius="8px" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold truncate" style={{ color: mockText }}>{appName}</p>
            <p className="text-[9px] truncate" style={{ color: mockMuted }}>{host}</p>
          </div>
          <span className="text-[10px] font-medium flex-shrink-0" style={{ color: accentBlue }}>Options</span>
        </div>
        {/* Action list */}
        <div className="mx-2 mb-2 rounded-xl overflow-hidden" style={{ backgroundColor: mockCard }}>
          {rows.map((r, i) => (
            <div key={r.label} className="flex items-center justify-between px-3.5 py-2.5" style={{ borderTop: i === 0 ? 'none' : `1px solid ${mockSep}` }}>
              <span className="text-[11px] truncate pr-2" style={{ color: mockText }}>{r.label}</span>
              <div className="w-4 h-4 flex-shrink-0" style={{ color: mockMuted }}>{r.icon}</div>
            </div>
          ))}
          {/* Add to Home Screen — highlighted */}
          <div className="relative flex items-center justify-between px-3.5 py-2.5" style={{ borderTop: `1px solid ${mockSep}`, backgroundColor: hexToRgba(accentBlue, isDark ? 0.16 : 0.08) }}>
            <span className="text-[11px] font-semibold truncate pr-2" style={{ color: accentBlue }}>Add to Home Screen</span>
            <div className="w-4 h-4 flex-shrink-0" style={{ color: accentBlue }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <div className="absolute inset-0 rounded-[2px] border-2 animate-pulse pointer-events-none" style={{ borderColor: accentBlue, opacity: 0.4 }} />
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    // The "Add to Home Screen" confirmation sheet. Nav bar uses a 3-column grid
    // so the centered title stays on one line and Cancel/Add never collide.
    return (
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: mockCard, border: `1px solid ${mockBorder}` }}>
        {/* Nav bar */}
        <div className="grid items-center gap-2 px-3.5 py-3" style={{ gridTemplateColumns: 'auto 1fr auto', borderBottom: `1px solid ${mockSep}` }}>
          <span className="text-[11px]" style={{ color: accentBlue }}>Cancel</span>
          <span className="text-[11px] font-semibold text-center truncate" style={{ color: mockText }}>Add to Home Screen</span>
          <div className="relative justify-self-end">
            <span className="text-[11px] font-bold" style={{ color: accentBlue }}>Add</span>
            <div className="absolute -inset-x-2 -inset-y-1 rounded-lg border-2 animate-pulse" style={{ borderColor: accentBlue, opacity: 0.45 }} />
          </div>
        </div>
        {/* Icon + editable name field + URL */}
        <div className="flex items-start gap-3 px-4 py-4">
          <MockAppIcon iconUrl={iconUrl} theme={theme} px={52} radius="12px" />
          <div className="min-w-0 flex-1">
            <div className="rounded-md px-2.5 py-1.5" style={{ backgroundColor: fieldBg, border: `1px solid ${mockSep}` }}>
              <p className="text-[12px] font-medium truncate" style={{ color: mockText }}>{appName}</p>
            </div>
            <p className="text-[10px] truncate mt-1.5" style={{ color: mockMuted }}>{host}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================================
// MOCK ANDROID UI
// ============================================================================
function AndroidMockStep({ step, theme, appName, iconUrl, domain }: { step: number; theme: any; appName: string; iconUrl?: string; domain: string }) {
  const mockBg = '#1f1f1f';
  const mockCard = '#2d2d2d';
  const mockText = '#e3e3e3';
  const mockMuted = 'rgba(255,255,255,0.5)';
  const mockBorder = 'rgba(255,255,255,0.08)';
  const accentGreen = theme.primary;

  if (step === 0) {
    // Step 1: Tap the three-dot menu
    return (
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: mockBg, border: `1px solid ${mockBorder}` }}>
        {/* Chrome top bar */}
        <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: '#2d2d2d', borderBottom: `1px solid ${mockBorder}` }}>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>
            </div>
            <div className="flex-1 min-w-0 rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[9px] block truncate" style={{ color: mockMuted }}>{cleanHost(domain)}</span>
            </div>
          </div>
          {/* Three-dot menu, highlighted */}
          <div className="relative ml-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: hexToRgba(accentGreen, 0.15) }}>
              <MoreVertical className="w-4 h-4" style={{ color: accentGreen }} />
            </div>
            <div className="absolute -inset-1 rounded-full border-2 animate-pulse" style={{ borderColor: accentGreen, opacity: 0.4 }} />
          </div>
        </div>
        {/* Page content */}
        <div className="px-4 py-6 flex items-center justify-center">
          <div className="text-center max-w-full px-4">
            <div className="mb-2 flex justify-center">
              <MockAppIcon iconUrl={iconUrl} theme={theme} px={40} radius="12px" />
            </div>
            <p className="text-[10px] font-semibold truncate" style={{ color: mockText }}>{appName}</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    // Step 2: Tap "Install App" or "Add to Home screen"
    return (
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: mockBg, border: `1px solid ${mockBorder}` }}>
        {/* Dropdown menu */}
        <div className="py-1">
          {['New tab', 'New incognito tab', 'Bookmarks', 'History', 'Downloads'].map((label) => (
            <div key={label} className="flex items-center gap-3 px-4 py-2">
              <div className="w-4 h-4 rounded opacity-30" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <span className="text-[11px]" style={{ color: mockText }}>{label}</span>
            </div>
          ))}
          {/* Install App, highlighted */}
          <div className="relative flex items-center gap-3 px-4 py-2 mx-1 rounded-lg" style={{ backgroundColor: hexToRgba(accentGreen, 0.12), border: `1.5px solid ${hexToRgba(accentGreen, 0.3)}` }}>
            <Download className="w-4 h-4" style={{ color: accentGreen }} />
            <span className="text-[11px] font-semibold" style={{ color: accentGreen }}>Install app</span>
            <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentGreen }} />
          </div>
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-4 h-4 rounded opacity-30" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <span className="text-[11px]" style={{ color: mockText }}>Desktop site</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    // Step 3: Confirm installation
    return (
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: mockCard, border: `1px solid ${mockBorder}` }}>
        <div className="p-4 text-center">
          {/* App icon */}
          <div className="mx-auto mb-3 flex justify-center">
            <MockAppIcon iconUrl={iconUrl} theme={theme} px={56} radius="16px" />
          </div>
          <p className="text-[13px] font-semibold mb-1 truncate" style={{ color: mockText }}>Install {appName}?</p>
          <p className="text-[10px] mb-4" style={{ color: mockMuted }}>This app will be added to your home screen</p>
          {/* Buttons */}
          <div className="flex gap-2">
            <div className="flex-1 py-2 rounded-lg text-center text-[11px] font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: mockMuted }}>
              Cancel
            </div>
            <div className="relative flex-1 py-2 rounded-lg text-center text-[11px] font-semibold" style={{ backgroundColor: accentGreen, color: '#fff' }}>
              Install
              <div className="absolute -inset-0.5 rounded-xl border-2 animate-pulse" style={{ borderColor: accentGreen, opacity: 0.4 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================================
// DESKTOP INSTALL ANIMATION
// A looping phone graphic that auto-plays the real iOS install flow (tap Share,
// scroll, Add to Home Screen, Add) so a desktop viewer sees exactly what to do
// on their phone. Reuses the themed IPhoneMockStep so the icon/name/domain stay
// white-labeled. Desktop only; the phone itself keeps the interactive steps.
// ============================================================================
function DesktopInstallAnimation({ theme, appName, iconUrl, domain }: { theme: any; appName: string; iconUrl?: string; domain: string }) {
  const [step, setStep] = useState(0);
  const reduceMotion = useRef(false);
  const isDark = theme.isDark;
  const bezel = isDark ? '#0a0a0b' : '#1a1a1c';
  const screenBg = isDark ? '#000000' : '#f2f2f7';
  const statusColor = isDark ? '#ffffff' : '#000000';

  const captions = ['Tap the Share button', 'Tap "Add to Home Screen"', 'Tap "Add" to finish'];

  useEffect(() => {
    try {
      reduceMotion.current =
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch { reduceMotion.current = false; }
    if (reduceMotion.current) return;
    const id = setInterval(() => setStep((s) => (s + 1) % 3), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Keyframes (scoped by unique names so they can't collide with Tailwind) */}
      <style>{`
        @keyframes a2hsStepIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ width: 228 }} className="relative">
        {/* Device bezel */}
        <div style={{ background: bezel, borderRadius: 40, padding: 7, boxShadow: '0 22px 45px -14px rgba(0,0,0,0.5)' }}>
          {/* Screen */}
          <div className="relative overflow-hidden" style={{ borderRadius: 33, backgroundColor: screenBg, height: 384 }}>
            {/* Notch */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1.5 z-20" style={{ width: 84, height: 20, borderRadius: 12, background: bezel }} />

            {/* Status bar */}
            <div className="relative z-10 flex items-center justify-between px-5 pt-2.5 pb-1" style={{ color: statusColor }}>
              <span className="text-[9px] font-semibold tracking-tight">9:41</span>
              <div className="flex items-center gap-1">
                {/* signal */}
                <svg width="13" height="9" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1" opacity="0.4"/><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.4"/></svg>
                {/* battery */}
                <svg width="16" height="9" viewBox="0 0 24 12" fill="none"><rect x="0.5" y="0.5" width="20" height="11" rx="3" stroke="currentColor" opacity="0.5"/><rect x="2" y="2" width="14" height="8" rx="1.5" fill="currentColor"/><rect x="21.5" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.5"/></svg>
              </div>
            </div>

            {/* Animated step content (re-keyed each step so it animates in) */}
            <div key={step} className="px-3 pt-2" style={{ animation: reduceMotion.current ? undefined : 'a2hsStepIn 560ms ease' }}>
              <IPhoneMockStep step={step} theme={theme} appName={appName} iconUrl={iconUrl} domain={domain} />
            </div>

            {/* Caption pill */}
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full shadow-sm" style={{ backgroundColor: theme.primary }}>
              <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: theme.primaryText }}>{captions[step]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots (auto-advance) */}
      <div className="flex items-center gap-1.5 mt-3.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-full transition-all duration-300" style={{ width: step === i ? '20px' : '7px', height: '7px', backgroundColor: step === i ? theme.primary : hexToRgba(theme.primary, 0.25) }} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN MODAL
// ============================================================================
export default function AddToHomeScreenModal({ clientId, theme, isOpen: controlledOpen, onClose, manualTrigger, appName = 'Your App', iconUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  // The real host shown in the mock previews, so the walkthrough matches this
  // agency's actual address instead of a placeholder.
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const displayHost = cleanHost(domain);
  // Brand the copy when we have a real white-label name (agency or client),
  // not the generic fallback.
  const brand = appName && appName !== 'Your App' ? appName : '';

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(originUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable, ignore */ }
  }, [originUrl]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  const trackEvent = useCallback((event: 'prompted' | 'installed') => {
    try {
      const token = localStorage.getItem('auth_token');
      fetch(`${backendUrl}/api/client/${clientId}/pwa-tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ event, platform }),
      }).catch(() => {});
    } catch {}
  }, [backendUrl, clientId, platform]);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    if (isStandalone()) {
      setAlreadyInstalled(true);
      if (!localStorage.getItem(INSTALLED_KEY)) {
        localStorage.setItem(INSTALLED_KEY, 'true');
        setTimeout(() => {
          try {
            const token = localStorage.getItem('auth_token');
            fetch(`${backendUrl}/api/client/${clientId}/pwa-tracking`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ event: 'installed', platform: p }),
            }).catch(() => {});
          } catch {}
        }, 1000);
      }
    }
  }, [backendUrl, clientId]);

  useEffect(() => {
    if (manualTrigger || alreadyInstalled || isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY) === 'permanent') return;
    const visits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visits));
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt && dismissedAt !== 'permanent') {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) return;
    }
    if (visits >= TRIGGER_AFTER_VISITS) {
      setTimeout(() => {
        setOpen(true);
        trackEvent('prompted');
      }, 2000);
    }
  }, [manualTrigger, alreadyInstalled, trackEvent]);

  useEffect(() => {
    if (controlledOpen !== undefined) {
      setOpen(controlledOpen);
      if (controlledOpen) {
        setStep(0);
        trackEvent('prompted');
      }
    }
  }, [controlledOpen, trackEvent]);

  const handleClose = () => {
    setOpen(false);
    setStep(0);
    if (!manualTrigger) {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }
    onClose?.();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(DISMISSED_KEY, 'permanent');
    handleClose();
  };

  if (alreadyInstalled && !manualTrigger) return null;
  if (!open) return null;

  const steps = platform === 'ios'
    ? [
        { title: 'Tap the Share button', description: 'At the bottom of Safari, tap the share icon.' },
        { title: 'Tap "Add to Home Screen"', description: 'Scroll down in the share menu and tap it.' },
        { title: 'Tap "Add"', description: 'Confirm the name and tap Add in the top right.' },
      ]
    : [
        { title: 'Tap the menu button', description: 'In Chrome, tap the three-dot icon in the top right.' },
        { title: 'Tap "Install app"', description: 'Look for "Install app" in the dropdown menu.' },
        { title: 'Confirm installation', description: 'Tap "Install" to add it to your home screen.' },
      ];

  const isDesktop = platform === 'desktop';

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="fixed inset-x-0 bottom-0 z-[61] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-[420px] sm:w-full">
        <div
          className="rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 p-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}>
                <Smartphone className="w-4.5 h-4.5" style={{ color: theme.primary }} />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm truncate" style={{ color: theme.text }}>
                  {alreadyInstalled ? 'App installed' : (brand ? `Get the ${brand} app` : 'Get the app')}
                </h2>
                <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>
                  {alreadyInstalled ? 'Running from your home screen' : 'Add it to your home screen for quick access'}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-lg transition hover:opacity-70 flex-shrink-0" style={{ backgroundColor: theme.bg }}>
              <X className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
            </button>
          </div>

          {/* Already installed */}
          {alreadyInstalled && (
            <div className="p-5 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}>
                <Smartphone className="w-7 h-7" style={{ color: theme.primary }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: theme.text }}>You&apos;re all set!</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>This app is already installed on your device.</p>
              <button onClick={handleClose} className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                Got it
              </button>
            </div>
          )}

          {/* Desktop: animated phone walkthrough + the URL to open on a phone */}
          {!alreadyInstalled && isDesktop && (
            <div className="p-5">
              <DesktopInstallAnimation theme={theme} appName={appName} iconUrl={iconUrl} domain={domain} />

              <div className="mt-5 text-center">
                <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>Add it to your home screen</p>
                <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
                  Open this link on your phone (iPhone or Android), then tap Share, then Add to Home Screen. No app store needed.
                </p>
              </div>

              {/* The URL to visit on the phone, with copy */}
              <div className="mt-4 flex items-center gap-2 rounded-xl p-1.5 pl-3" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                <span className="flex-1 min-w-0 text-xs font-medium truncate" style={{ color: theme.text }}>{displayHost}</span>
                <button
                  onClick={copyUrl}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition hover:opacity-90 flex-shrink-0"
                  style={{ backgroundColor: copied ? hexToRgba(theme.primary, 0.15) : theme.primary, color: copied ? theme.primary : theme.primaryText }}
                >
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy link</>}
                </button>
              </div>

              <button onClick={handleClose} className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition" style={{ backgroundColor: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}` }}>
                Got it
              </button>
            </div>
          )}

          {/* Mobile install steps with themed mock UI */}
          {!alreadyInstalled && !isDesktop && (
            <div className="p-4">
              {/* Themed mock phone UI */}
              <div className="mb-3">
                {platform === 'ios' ? (
                  <IPhoneMockStep step={step} theme={theme} appName={appName} iconUrl={iconUrl} domain={domain} />
                ) : (
                  <AndroidMockStep step={step} theme={theme} appName={appName} iconUrl={iconUrl} domain={domain} />
                )}
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-1.5 mb-3 justify-center">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setStep(idx)}
                    className="rounded-full transition-all"
                    style={{
                      width: step === idx ? '24px' : '8px',
                      height: '8px',
                      backgroundColor: step === idx ? theme.primary : hexToRgba(theme.primary, 0.2),
                    }}
                  />
                ))}
              </div>

              {/* Step text */}
              <div className="text-center mb-4">
                <p className="text-sm font-semibold mb-0.5" style={{ color: theme.text }}>
                  Step {step + 1}: {steps[step].title}
                </p>
                <p className="text-xs" style={{ color: theme.textMuted }}>
                  {steps[step].description}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium transition"
                    style={{ backgroundColor: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}
                  >
                    Back
                  </button>
                )}
                {step < steps.length - 1 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition hover:opacity-90 flex items-center justify-center gap-1"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                  >
                    Done
                  </button>
                )}
              </div>

              {!manualTrigger && (
                <button onClick={handleDontShowAgain} className="w-full mt-2.5 py-1.5 text-[10px] transition hover:opacity-70" style={{ color: theme.textMuted4 || theme.textMuted }}>
                  Don&apos;t show this again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}