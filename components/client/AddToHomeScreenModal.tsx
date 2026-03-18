'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Share, MoreVertical, Plus, Download, Smartphone, Monitor, ChevronRight } from 'lucide-react';

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
// MOCK IPHONE UI — renders themed to match agency branding
// ============================================================================
function IPhoneMockStep({ step, theme, appName }: { step: number; theme: any; appName: string }) {
  const isDark = theme.isDark;
  const mockBg = isDark ? '#1c1c1e' : '#f2f2f7';
  const mockCard = isDark ? '#2c2c2e' : '#ffffff';
  const mockText = isDark ? '#ffffff' : '#000000';
  const mockMuted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const mockBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const mockRowBg = isDark ? '#2c2c2e' : '#ffffff';
  const accentBlue = '#007AFF';

  if (step === 0) {
    // Step 1: Tap the Share button — show Safari bottom bar with share icon highlighted
    return (
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: mockBg, border: `1px solid ${mockBorder}` }}>
        {/* Mini browser chrome */}
        <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${mockBorder}` }}>
          <div className="flex-1 rounded-lg px-2.5 py-1.5 text-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
            <span className="text-[9px] font-medium" style={{ color: mockMuted }}>yourdomain.com</span>
          </div>
        </div>
        {/* Page preview - shows the app with branding */}
        <div className="px-4 py-5 flex items-center justify-center" style={{ minHeight: '80px' }}>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <rect x="2" y="9" width="2" height="6" rx="1" fill="#fff" opacity="0.6" />
                <rect x="5" y="7" width="2" height="10" rx="1" fill="#fff" opacity="0.8" />
                <rect x="8" y="4" width="2" height="16" rx="1" fill="#fff" />
                <rect x="11" y="6" width="2" height="12" rx="1" fill="#fff" />
                <rect x="14" y="3" width="2" height="18" rx="1" fill="#fff" />
                <rect x="17" y="7" width="2" height="10" rx="1" fill="#fff" opacity="0.8" />
                <rect x="20" y="9" width="2" height="6" rx="1" fill="#fff" opacity="0.6" />
              </svg>
            </div>
            <p className="text-[10px] font-semibold" style={{ color: mockText }}>{appName}</p>
          </div>
        </div>
        {/* Safari bottom bar with share highlighted */}
        <div className="flex items-center justify-around px-4 py-2.5" style={{ backgroundColor: isDark ? '#1c1c1e' : '#f8f8f8', borderTop: `1px solid ${mockBorder}` }}>
          <div className="w-5 h-5 opacity-30" style={{ color: mockText }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </div>
          <div className="w-5 h-5 opacity-30" style={{ color: mockText }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
          {/* Share button — highlighted */}
          <div className="relative">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(accentBlue, 0.15) }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={accentBlue} strokeWidth="2.5" className="w-4 h-4">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            {/* Pulse ring */}
            <div className="absolute -inset-1 rounded-xl border-2 animate-pulse" style={{ borderColor: accentBlue, opacity: 0.4 }} />
          </div>
          <div className="w-5 h-5 opacity-30" style={{ color: mockText }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          </div>
          <div className="w-5 h-5 opacity-30" style={{ color: mockText }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    // Step 2: Scroll down and tap "Add to Home Screen"
    return (
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: mockBg, border: `1px solid ${mockBorder}` }}>
        {/* Share sheet rows */}
        <div className="px-1 py-2 space-y-[1px]">
          {['Copy', 'Add to Reading List', 'Add Bookmark', 'Add to Favorites'].map((label) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{ backgroundColor: mockRowBg }}>
              <span className="text-[11px]" style={{ color: mockText }}>{label}</span>
              <div className="w-4 h-4 opacity-30" style={{ color: mockMuted }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              </div>
            </div>
          ))}
          {/* Add to Home Screen — highlighted */}
          <div className="relative flex items-center justify-between px-4 py-2.5 rounded-lg" style={{ backgroundColor: hexToRgba(accentBlue, isDark ? 0.12 : 0.06), border: `1.5px solid ${hexToRgba(accentBlue, 0.3)}` }}>
            <span className="text-[11px] font-semibold" style={{ color: accentBlue }}>Add to Home Screen</span>
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: hexToRgba(accentBlue, 0.15) }}>
              <Plus className="w-3 h-3" style={{ color: accentBlue }} />
            </div>
            {/* Arrow indicator */}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentBlue }} />
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    // Step 3: Tap "Add" — confirmation dialog with app icon
    return (
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: mockBg, border: `1px solid ${mockBorder}` }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${mockBorder}` }}>
          <span className="text-[11px]" style={{ color: accentBlue }}>Cancel</span>
          <span className="text-[11px] font-semibold" style={{ color: mockText }}>Add to Home Screen</span>
          <div className="relative">
            <span className="text-[11px] font-semibold" style={{ color: accentBlue }}>Add</span>
            <div className="absolute -inset-x-2 -inset-y-1 rounded-lg border-2 animate-pulse" style={{ borderColor: accentBlue, opacity: 0.4 }} />
          </div>
        </div>
        {/* App preview */}
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.primary }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <rect x="2" y="9" width="2" height="6" rx="1" fill="#fff" opacity="0.6" />
              <rect x="5" y="7" width="2" height="10" rx="1" fill="#fff" opacity="0.8" />
              <rect x="8" y="4" width="2" height="16" rx="1" fill="#fff" />
              <rect x="11" y="6" width="2" height="12" rx="1" fill="#fff" />
              <rect x="14" y="3" width="2" height="18" rx="1" fill="#fff" />
              <rect x="17" y="7" width="2" height="10" rx="1" fill="#fff" opacity="0.8" />
              <rect x="20" y="9" width="2" height="6" rx="1" fill="#fff" opacity="0.6" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-semibold" style={{ color: mockText }}>{appName}</p>
            <p className="text-[10px]" style={{ color: mockMuted }}>yourdomain.com</p>
          </div>
        </div>
        {/* Description */}
        <div className="px-4 pb-3">
          <p className="text-[10px]" style={{ color: mockMuted }}>
            An icon will be added to your Home Screen so you can quickly access this app.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================================
// MOCK ANDROID UI
// ============================================================================
function AndroidMockStep({ step, theme, appName }: { step: number; theme: any; appName: string }) {
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
          <div className="flex-1 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>
            </div>
            <div className="flex-1 rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[9px]" style={{ color: mockMuted }}>yourdomain.com</span>
            </div>
          </div>
          {/* Three-dot menu — highlighted */}
          <div className="relative ml-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: hexToRgba(accentGreen, 0.15) }}>
              <MoreVertical className="w-4 h-4" style={{ color: accentGreen }} />
            </div>
            <div className="absolute -inset-1 rounded-full border-2 animate-pulse" style={{ borderColor: accentGreen, opacity: 0.4 }} />
          </div>
        </div>
        {/* Page content */}
        <div className="px-4 py-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <rect x="2" y="9" width="2" height="6" rx="1" fill="#fff" opacity="0.6" />
                <rect x="5" y="7" width="2" height="10" rx="1" fill="#fff" opacity="0.8" />
                <rect x="8" y="4" width="2" height="16" rx="1" fill="#fff" />
                <rect x="11" y="6" width="2" height="12" rx="1" fill="#fff" />
                <rect x="14" y="3" width="2" height="18" rx="1" fill="#fff" />
                <rect x="17" y="7" width="2" height="10" rx="1" fill="#fff" opacity="0.8" />
                <rect x="20" y="9" width="2" height="6" rx="1" fill="#fff" opacity="0.6" />
              </svg>
            </div>
            <p className="text-[10px] font-semibold" style={{ color: mockText }}>{appName}</p>
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
          {/* Install App — highlighted */}
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
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
              <rect x="2" y="9" width="2" height="6" rx="1" fill="#fff" opacity="0.6" />
              <rect x="5" y="7" width="2" height="10" rx="1" fill="#fff" opacity="0.8" />
              <rect x="8" y="4" width="2" height="16" rx="1" fill="#fff" />
              <rect x="11" y="6" width="2" height="12" rx="1" fill="#fff" />
              <rect x="14" y="3" width="2" height="18" rx="1" fill="#fff" />
              <rect x="17" y="7" width="2" height="10" rx="1" fill="#fff" opacity="0.8" />
              <rect x="20" y="9" width="2" height="6" rx="1" fill="#fff" opacity="0.6" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold mb-1" style={{ color: mockText }}>Install {appName}?</p>
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
// MAIN MODAL
// ============================================================================
export default function AddToHomeScreenModal({ clientId, theme, isOpen: controlledOpen, onClose, manualTrigger, appName = 'Your App' }: Props) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [step, setStep] = useState(0);

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
          <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}>
                <Smartphone className="w-4.5 h-4.5" style={{ color: theme.primary }} />
              </div>
              <div>
                <h2 className="font-semibold text-sm" style={{ color: theme.text }}>
                  {alreadyInstalled ? 'App Installed!' : 'Get the App'}
                </h2>
                <p className="text-[10px]" style={{ color: theme.textMuted }}>
                  {alreadyInstalled ? 'Running from your home screen' : 'Add to your home screen for quick access'}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-lg transition hover:opacity-70" style={{ backgroundColor: theme.bg }}>
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

          {/* Desktop message */}
          {!alreadyInstalled && isDesktop && (
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}>
                  <Monitor className="w-5 h-5" style={{ color: theme.primary }} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: theme.text }}>Open on your phone for the best experience</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>Visit this URL on your iPhone or Android to install it on your home screen. No app store needed.</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
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
                  <IPhoneMockStep step={step} theme={theme} appName={appName} />
                ) : (
                  <AndroidMockStep step={step} theme={theme} appName={appName} />
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