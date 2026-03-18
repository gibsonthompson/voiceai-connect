'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Share, MoreVertical, Plus, Download, Smartphone, Monitor, ChevronRight, Play } from 'lucide-react';

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
}

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  // iOS detection (iPhone, iPad, iPod)
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  // Android detection
  if (/Android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS standalone check
  if ('standalone' in window.navigator && (window.navigator as any).standalone) return true;
  // Android / desktop PWA check
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
}

const VISIT_COUNT_KEY = 'voiceai_pwa_visits';
const DISMISSED_KEY = 'voiceai_pwa_dismissed';
const INSTALLED_KEY = 'voiceai_pwa_installed';
const TRIGGER_AFTER_VISITS = 3;

export default function AddToHomeScreenModal({ clientId, theme, isOpen: controlledOpen, onClose, manualTrigger }: Props) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [step, setStep] = useState(0);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';

  // Track event to backend (fire-and-forget)
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

  // Platform detection on mount
  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    // Check if already running as PWA
    if (isStandalone()) {
      setAlreadyInstalled(true);
      // Track install if not already tracked
      if (!localStorage.getItem(INSTALLED_KEY)) {
        localStorage.setItem(INSTALLED_KEY, 'true');
        // Defer tracking to after state is set
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
      return;
    }
  }, [backendUrl, clientId]);

  // Auto-trigger logic (visit counting)
  useEffect(() => {
    // Skip if manual trigger mode, already installed, or already dismissed permanently
    if (manualTrigger || alreadyInstalled || isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY) === 'permanent') return;

    // Increment visit count
    const visits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visits));

    // Check if we've been temporarily dismissed (24h cooldown)
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt && dismissedAt !== 'permanent') {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) return;
    }

    // Trigger after N visits
    if (visits >= TRIGGER_AFTER_VISITS) {
      setTimeout(() => {
        setOpen(true);
        trackEvent('prompted');
      }, 2000); // Slight delay so the page loads first
    }
  }, [manualTrigger, alreadyInstalled, trackEvent]);

  // Handle controlled open from parent (manual trigger from settings)
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
    // Set 24h cooldown on auto-trigger dismissal
    if (!manualTrigger) {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }
    onClose?.();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(DISMISSED_KEY, 'permanent');
    handleClose();
  };

  // Don't render anything if already installed and not manually triggered
  if (alreadyInstalled && !manualTrigger) return null;
  if (!open) return null;

  const iosSteps = [
    {
      icon: Share,
      title: 'Tap the Share button',
      description: 'At the bottom of Safari, tap the share icon (the square with an arrow pointing up).',
    },
    {
      icon: Plus,
      title: 'Tap "Add to Home Screen"',
      description: 'Scroll down in the share menu and tap "Add to Home Screen".',
    },
    {
      icon: Smartphone,
      title: 'Tap "Add"',
      description: 'Confirm the name and tap "Add" in the top right. The app will appear on your home screen.',
    },
  ];

  const androidSteps = [
    {
      icon: MoreVertical,
      title: 'Tap the menu button',
      description: 'In Chrome, tap the three-dot menu icon in the top right corner.',
    },
    {
      icon: Download,
      title: 'Tap "Install App" or "Add to Home screen"',
      description: 'Look for "Install App" or "Add to Home screen" in the menu.',
    },
    {
      icon: Smartphone,
      title: 'Confirm installation',
      description: 'Tap "Install" to add the app to your home screen. It will work just like a native app.',
    },
  ];

  const steps = platform === 'ios' ? iosSteps : androidSteps;
  const isDesktop = platform === 'desktop';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-[61] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full">
        <div
          className="rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}
              >
                <Smartphone className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
              <div>
                <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>
                  {alreadyInstalled ? 'App Installed!' : 'Get the App'}
                </h2>
                <p className="text-[10px] sm:text-xs" style={{ color: theme.textMuted }}>
                  {alreadyInstalled
                    ? 'You\'re already using the app from your home screen'
                    : 'Add to your home screen for quick access'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition hover:opacity-70"
              style={{ backgroundColor: theme.bg }}
            >
              <X className="w-4 h-4" style={{ color: theme.textMuted }} />
            </button>
          </div>

          {/* Already installed state */}
          {alreadyInstalled && (
            <div className="p-5 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}
              >
                <Smartphone className="w-8 h-8" style={{ color: theme.primary }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: theme.text }}>You&apos;re all set!</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                This app is already installed on your device. You can find it on your home screen.
              </p>
              <button
                onClick={handleClose}
                className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}
              >
                Got it
              </button>
            </div>
          )}

          {/* Desktop message — no install steps, just info */}
          {!alreadyInstalled && isDesktop && (
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}
                >
                  <Monitor className="w-5 h-5" style={{ color: theme.primary }} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: theme.text }}>
                    Open on your phone for the best experience
                  </p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    Visit this same URL on your iPhone or Android to install the app on your home screen. It works just like a native app — instant access, no app store needed.
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: theme.primary, color: theme.primaryText }}
              >
                Got it
              </button>
            </div>
          )}

          {/* Mobile install steps */}
          {!alreadyInstalled && !isDesktop && (
            <div className="p-4 sm:p-5">
              {/* Video placeholder — swap with Remotion video later */}
              <div
                className="rounded-xl mb-4 flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: theme.bg,
                  border: `1px solid ${theme.border}`,
                  aspectRatio: '16/9',
                }}
              >
                {/* Replace this div with <video> or Remotion player when ready */}
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}
                  >
                    <Play className="w-5 h-5 ml-0.5" style={{ color: theme.primary }} />
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium" style={{ color: theme.textMuted }}>
                    {platform === 'ios' ? 'iPhone' : 'Android'} install guide
                  </p>
                  <p className="text-[9px]" style={{ color: theme.textMuted4 }}>Coming soon</p>
                </div>
              </div>

              {/* Step indicators */}
              <div className="flex items-center gap-1.5 mb-4 justify-center">
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

              {/* Current step */}
              <div className="mb-4">
                {steps.map((s, idx) => {
                  const StepIcon = s.icon;
                  if (idx !== step) return null;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}
                      >
                        <StepIcon className="w-5 h-5" style={{ color: theme.primary }} />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>
                          Step {idx + 1}: {s.title}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
                          {s.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
                    style={{ backgroundColor: theme.bg, color: theme.textMuted, border: `1px solid ${theme.border}` }}
                  >
                    Back
                  </button>
                )}
                {step < steps.length - 1 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: theme.primary, color: theme.primaryText }}
                  >
                    Done
                  </button>
                )}
              </div>

              {/* Don't show again — only on auto-trigger */}
              {!manualTrigger && (
                <button
                  onClick={handleDontShowAgain}
                  className="w-full mt-3 py-2 text-[10px] sm:text-xs transition hover:opacity-70"
                  style={{ color: theme.textMuted4 }}
                >
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