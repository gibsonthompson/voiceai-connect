'use client';

// ============================================================================
// CANCEL SUBSCRIPTION MODAL
// Destination: components/CancelSubscriptionModal.tsx
//
// Two steps:
//   1. Confirm - warning + a single REQUIRED free-text box (no reason dropdown).
//      Confirm Cancellation is disabled until it is filled. POSTs
//      { agency_id, feedback } to /api/agency/cancel. The backend logs its owner
//      SMS as message type 'agency_cancellation'.
//   2. Post-cancel - confirmation only. "Done" clears the session and returns to
//      login. (The old optional reason-category step was removed: the required
//      feedback above already captures the reason, so we don't ask twice.)
//
// Self-contained: manages its own state and API calls so the settings page only
// needs to render it. Session is cleared only on finish (Done / backdrop on the
// done step), so the category POST after cancel still carries a valid token.
// ============================================================================

import { useState } from 'react';
import { AlertTriangle, Loader2, Check } from 'lucide-react';

interface CancelSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  agencyId: string;
  isOnTrial: boolean;
  theme: any;
  backendUrl: string;
}

export default function CancelSubscriptionModal({
  open,
  onClose,
  agencyId,
  isOnTrial,
  theme,
  backendUrl,
}: CancelSubscriptionModalProps) {
  const [step, setStep] = useState<'confirm' | 'done'>('confirm');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

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
        body: JSON.stringify({ agency_id: agencyId, feedback: feedback.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      setLoading(false);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
      setLoading(false);
    }
  };

  const finish = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('agency');
    localStorage.removeItem('user');
    window.location.href = '/agency/login?canceled=true';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { if (step === 'done') finish(); else if (!loading) onClose(); }}
      />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.isDark ? '#0a0a0a' : '#ffffff', border: `1px solid ${theme.border}` }}
      >
        {step === 'confirm' ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.errorBg }}
              >
                <AlertTriangle className="h-6 w-6" style={{ color: theme.errorText }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
                  Cancel {isOnTrial ? 'Trial' : 'Subscription'}?
                </h3>
                <p className="text-sm" style={{ color: theme.textMuted }}>We&apos;re sorry to see you go.</p>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: theme.errorBg }}>
              <p className="text-sm" style={{ color: theme.errorText }}>If you cancel now:</p>
              <ul className="mt-2 space-y-1 text-sm" style={{ color: theme.errorText }}>
                <li>• You&apos;ll lose access to your agency dashboard immediately</li>
                <li>• All client AI receptionists will be disabled</li>
                <li>• You won&apos;t be charged</li>
              </ul>
            </div>

            {error && (
              <div
                className="rounded-xl p-3 mb-4 text-sm"
                style={{ backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }}
              >
                {error}
              </div>
            )}

            {/* Single REQUIRED free-text box. No reason dropdown. */}
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
                {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Canceling...</>) : ('Confirm Cancellation')}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Post-cancel screen */}
            <div className="text-center mb-5">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: theme.primary15 }}
              >
                <Check className="h-7 w-7" style={{ color: theme.primary }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: theme.text }}>
                Your {isOnTrial ? 'trial' : 'subscription'} has been canceled
              </h3>
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                You won&apos;t be charged. Your access ends now.
              </p>
            </div>

            <button
              onClick={finish}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}