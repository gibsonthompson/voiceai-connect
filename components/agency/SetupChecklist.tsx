'use client';

import { useState, useEffect } from 'react';
import { 
  Check, ChevronRight, Upload, Palette, DollarSign, 
  CreditCard, UserPlus, Sparkles, X, ChevronDown, Rocket
} from 'lucide-react';

// ============================================================================
// SetupChecklist — Agency Dashboard Onboarding
// Place: app/components/agency/SetupChecklist.tsx
// Usage: <SetupChecklist agency={agency} clientCount={stats?.clientCount || 0} />
// ============================================================================

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  href: string;
}

interface SetupChecklistProps {
  agency: any;
  clientCount: number;
  theme: any;
  userRole?: string;
  demoMode?: boolean;
}

export default function SetupChecklist({ agency, clientCount, theme, userRole, demoMode }: SetupChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe: only read localStorage after mount
  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem('voiceai_setup_dismissed') === 'true') setDismissed(true);
      if (localStorage.getItem('voiceai_setup_complete') === 'true') setCelebrated(true);
    } catch {}
  }, []);

  // Don't render in demo mode — demo data makes everything look "complete"
  if (demoMode) return null;

  // Only show to agency owners (staff can't change settings)
  if (userRole && userRole !== 'agency_owner' && userRole !== 'super_admin') return null;

  // Don't render until hydrated (prevents flash)
  if (!mounted) return null;

  // ── Step definitions ────────────────────────────────────────────────
  const steps: SetupStep[] = [
    {
      id: 'logo',
      title: 'Upload your logo',
      description: 'Brand your dashboard and client experience',
      icon: Upload,
      completed: !!agency?.logo_url,
      href: '/agency/settings',
    },
    {
      id: 'colors',
      title: 'Set your brand colors',
      description: 'Match your agency\'s visual identity',
      icon: Palette,
      completed: !!(agency?.primary_color && agency.primary_color !== '#10b981'),
      href: '/agency/branding',
    },
    {
      id: 'pricing',
      title: 'Configure client pricing',
      description: 'Set prices for Starter, Pro, and Growth plans',
      icon: DollarSign,
      completed: !!(
        agency && (
          (agency.price_starter ?? 4900) !== 4900 ||
          (agency.price_pro ?? 9900) !== 9900 ||
          (agency.price_growth ?? 14900) !== 14900
        )
      ),
      href: '/agency/settings?tab=pricing',
    },
    {
      id: 'stripe',
      title: 'Connect Stripe',
      description: 'Start receiving payments from clients',
      icon: CreditCard,
      completed: !!agency?.stripe_account_id,
      href: '/agency/settings?tab=payments',
    },
    {
      id: 'client',
      title: 'Add your first client',
      description: 'Set up an AI receptionist for a client',
      icon: UserPlus,
      completed: clientCount > 0,
      href: '/agency/clients/new',
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const allComplete = completedCount === steps.length;
  const progressPercent = (completedCount / steps.length) * 100;

  // ── All complete + already celebrated → hide permanently ────────────
  if (allComplete && celebrated) return null;

  // ── All complete, first time → celebration card ─────────────────────
  if (allComplete && !celebrated) {
    return (
      <CelebrationCard
        theme={theme}
        onDismiss={() => {
          try { localStorage.setItem('voiceai_setup_complete', 'true'); } catch {}
          setCelebrated(true);
        }}
      />
    );
  }

  // ── Dismissed → collapsed bar ───────────────────────────────────────
  if (dismissed) {
    return (
      <button
        onClick={() => {
          setDismissed(false);
          try { localStorage.removeItem('voiceai_setup_dismissed'); } catch {}
        }}
        className="mb-6 sm:mb-8 w-full rounded-xl px-4 py-3 flex items-center justify-between transition-all"
        style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.border}`,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = `${theme.primary}40`)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = theme.border)}
      >
        <div className="flex items-center gap-3">
          {/* Mini progress dots */}
          <div className="flex items-center gap-1">
            {steps.map(s => (
              <div
                key={s.id}
                className="w-2 h-2 rounded-full transition-colors"
                style={{ backgroundColor: s.completed ? theme.primary : theme.border }}
              />
            ))}
          </div>
          <span className="text-sm font-medium" style={{ color: theme.textMuted }}>
            Complete setup — {completedCount}/{steps.length} done
          </span>
        </div>
        <ChevronDown className="h-4 w-4" style={{ color: theme.textMuted }} />
      </button>
    );
  }

  // ── Full checklist card ─────────────────────────────────────────────
  return (
    <div
      className="mb-6 sm:mb-8 rounded-xl overflow-hidden"
      style={{
        backgroundColor: theme.card,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header + progress */}
      <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${theme.primary}15` }}
            >
              <Rocket className="h-4.5 w-4.5" style={{ color: theme.primary }} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold" style={{ color: theme.text }}>
                Finish setting up your agency
              </h3>
              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                {completedCount} of {steps.length} steps — {steps.length - completedCount} remaining
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setDismissed(true);
              try { localStorage.setItem('voiceai_setup_dismissed', 'true'); } catch {}
            }}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: theme.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.hover)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Dismiss for now"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(progressPercent, 3)}%`,
              background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}cc)`,
            }}
          />
        </div>
      </div>

      {/* Step rows */}
      <div className="px-2 sm:px-3 pb-2 sm:pb-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <StepRow
              key={step.id}
              step={step}
              Icon={Icon}
              theme={theme}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Individual step row ───────────────────────────────────────────────
function StepRow({
  step,
  Icon,
  theme,
}: {
  step: SetupStep;
  Icon: React.ElementType;
  theme: any;
}) {
  const handleClick = () => {
    if (!step.completed) {
      window.location.href = step.href;
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors group"
      style={{ cursor: step.completed ? 'default' : 'pointer' }}
      onMouseEnter={e => {
        if (!step.completed) (e.currentTarget.style.backgroundColor = theme.hover);
      }}
      onMouseLeave={e => {
        (e.currentTarget.style.backgroundColor = 'transparent');
      }}
    >
      {/* Status icon */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 transition-colors"
        style={
          step.completed
            ? {
                backgroundColor: `${theme.primary}15`,
                border: `1px solid ${theme.primary}30`,
              }
            : {
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                border: `1px solid ${theme.border}`,
              }
        }
      >
        {step.completed ? (
          <Check className="h-4 w-4" style={{ color: theme.primary }} />
        ) : (
          <Icon className="h-4 w-4" style={{ color: theme.textMuted }} />
        )}
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium transition-colors"
          style={{
            color: step.completed ? theme.textMuted : theme.text,
            textDecoration: step.completed ? 'line-through' : 'none',
            opacity: step.completed ? 0.5 : 1,
          }}
        >
          {step.title}
        </p>
        {!step.completed && (
          <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
            {step.description}
          </p>
        )}
      </div>

      {/* Arrow for incomplete steps */}
      {!step.completed && (
        <ChevronRight
          className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: theme.primary }}
        />
      )}
    </div>
  );
}

// ── Celebration card ──────────────────────────────────────────────────
function CelebrationCard({
  theme,
  onDismiss,
}: {
  theme: any;
  onDismiss: () => void;
}) {
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="mb-6 sm:mb-8 rounded-xl p-5 sm:p-6 text-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.primary}12, ${theme.primary}06)`,
        border: `1px solid ${theme.primary}30`,
      }}
    >
      {/* Subtle shimmer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${theme.primary}08, transparent 60%)`,
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5" style={{ color: theme.primary }} />
          <h3 className="text-lg font-semibold" style={{ color: theme.primary }}>
            Setup Complete!
          </h3>
          <Sparkles className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <p className="text-sm" style={{ color: theme.textMuted }}>
          Your agency is fully configured. Start adding clients and growing your business.
        </p>
        <button
          onClick={onDismiss}
          className="mt-3 text-xs font-medium transition-colors"
          style={{ color: theme.textMuted }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}