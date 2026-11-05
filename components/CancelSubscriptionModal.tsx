'use client';

// ============================================================================
// CANCEL SUBSCRIPTION MODAL
// Destination: components/CancelSubscriptionModal.tsx
//
// The agency chooses WHEN the cancellation takes effect:
//   • Period end (default/recommended): the agency and ALL its clients stay
//     fully live and billing until the current paid period ends, then Stripe's
//     subscription.deleted runs the normal teardown. No new charge, no refund.
//     The agency KEEPS access, so we do NOT log them out: we close and let the
//     settings page show a "Plan cancels on <date> / Resume" banner.
//   • Immediately: everything tears down now (the original behavior). Access
//     ends now, so we clear the session and return to login.
//
// A required free-text box captures why they are leaving (sent as `feedback`).
// POSTs { agency_id, feedback, when } to /api/agency/cancel.
// ============================================================================

import { useState } from 'react';
import { AlertTriangle, Loader2, Check, CalendarClock, Zap } from 'lucide-react';

interface CancelSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  agencyId: string;
  isOnTrial: boolean;
  theme: any;
  backendUrl: string;
  // Called after a period-end cancellation is scheduled (agency keeps access),
  // so the settings page can refresh and show the "cancels on <date>" banner.
  onScheduled?: () => void;
}

type CancelWhen = 'period_end' | 'immediate';

function formatDate(iso: string | null): string {
  if (!iso) return 'the end of your billing period';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return 'the end of your billing period'; }
}

export default function CancelSubscriptionModal({
  open,
  onClose,
  agencyId,
  isOnTrial,
  theme,
  backendUrl,
  onScheduled,
}: CancelSubscriptionModalProps) {
  const [step, setStep] = useState<'confirm' | 'done_immediate' | 'done_scheduled'>('confirm');
  const [when, setWhen] = useState<CancelWhen>('period_end');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelsAt, setCancelsAt] = useState<string | null>(null);

  if (!open) return null;

  // On a trial there is nothing to keep paying for, so "period end" means "at the
  // end of the trial" (no charge either way). The wording adapts; the mechanism
  // is identical (cancel_at_period_end).
  const periodEndLabel = isOnTrial ? 'At the end of my trial' : 'At the end of my billing period';
  const periodEndDesc = isOnTrial
    ? 'Keep full access until your trial ends, then it cancels with no charge. You can resume anytime before then.'
    : 'You and all your clients stay live until your current paid period ends, then it cancels. No further charge, and you can resume anytime before then.';

  const handleCancel = async () => {
    if (!agencyId) return;
    if (!feedback.trim()) {
      setError('Please let us know why you are canceling before you confirm.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${backendUrl}/api/agency/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ agency_id: agencyId, feedback: feedback.trim(), when }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription');
      setLoading(false);
      if (data.scheduled) {
        setCancelsAt(data.cancels_at || null);
        setStep('done_scheduled');
      } else {
        setStep('done_immediate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
      setLoading(false);
    }
  };

  const finishImmediate = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('agency');
    localStorage.removeItem('user');
    window.location.href = '/agency/login?canceled=true';
  };

  const finishScheduled = () => {
    if (onScheduled) onScheduled();
    onClose();
  };

  const OptionCard = ({ value, icon, title, desc }: { value: CancelWhen; icon: React.ReactNode; title: string; desc: string }) => {
    const selected = when === value;
    return (
      <button
        type="button"
        onClick={() => setWhen(value)}
        className="w-full text-left rounded-xl p-3.5 transition-all"
        style={{
          backgroundColor: selected ? theme.primary15 : theme.input,
          border: `1.5px solid ${selected ? theme.primary : theme.inputBorder}`,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0" style={{ color: selected ? theme.primary : theme.textMuted }}>{icon}</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: theme.text }}>{title}</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.textMuted }}>{desc}</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (step === 'done_immediate') finishImmediate();
          else if (step === 'done_scheduled') finishScheduled();
          else if (!loading) onClose();
        }}
      />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.isDark ? '#0a0a0a' : '#ffffff', border: `1px solid ${theme.border}` }}
      >
        {step === 'confirm' ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.errorBg }}>
                <AlertTriangle className="h-6 w-6" style={{ color: theme.errorText }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
                  Cancel {isOnTrial ? 'Trial' : 'Subscription'}?
                </h3>
                <p className="text-sm" style={{ color: theme.textMuted }}>Choose when it takes effect.</p>
              </div>
            </div>

            {/* When to cancel */}
            <div className="space-y-2.5 mb-5">
              <OptionCard
                value="period_end"
                icon={<CalendarClock className="h-5 w-5" />}
                title={`${periodEndLabel} (recommended)`}
                desc={periodEndDesc}
              />
              <OptionCard
                value="immediate"
                icon={<Zap className="h-5 w-5" />}
                title="Immediately"
                desc="Your dashboard access ends now and every client AI receptionist goes offline right away. No refund for the current period."
              />
            </div>

            {error && (
              <div className="rounded-xl p-3 mb-4 text-sm" style={{ backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }}>
                {error}
              </div>
            )}

            {/* Required free-text box */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                Anything you want us to know? <span style={{ color: theme.errorText }}>(required)</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={loading}
                placeholder="Tell us why you're canceling, what was missing, or what would have made you stay."
                rows={4}
                maxLength={1000}
                className="w-full rounded-xl px-3 py-2.5 text-sm resize-none transition-colors"
                style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
              />
              <p className="mt-1 text-xs text-right" style={{ color: theme.textMuted }}>{feedback.length}/1000</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
              >
                Keep My {isOnTrial ? 'Trial' : 'Subscription'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading || !feedback.trim()}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Canceling...</>) : (when === 'immediate' ? 'Cancel Now' : 'Schedule Cancellation')}
              </button>
            </div>
          </>
        ) : step === 'done_scheduled' ? (
          <>
            <div className="text-center mb-5">
              <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.primary15 }}>
                <CalendarClock className="h-7 w-7" style={{ color: theme.primary }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
                Cancellation scheduled
              </h3>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: theme.textMuted }}>
                Your {isOnTrial ? 'trial' : 'plan'} will cancel on <span style={{ color: theme.text, fontWeight: 600 }}>{formatDate(cancelsAt)}</span>. You and your clients keep full access until then, and you can resume anytime before that date from billing settings.
              </p>
            </div>
            <button onClick={finishScheduled} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              Done
            </button>
          </>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.primary15 }}>
                <Check className="h-7 w-7" style={{ color: theme.primary }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
                Your {isOnTrial ? 'trial' : 'subscription'} has been canceled
              </h3>
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                You won&apos;t be charged. Your access ends now.
              </p>
            </div>
            <button onClick={finishImmediate} className="w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
