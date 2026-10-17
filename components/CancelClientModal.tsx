'use client';

// ============================================================================
// CANCEL CLIENT MODAL
// Destination: components/CancelClientModal.tsx
//
// Shared, themed confirmation modal for canceling a CLIENT subscription, used
// by both the client's own settings page (self-cancel, period-end only) and the
// agency client-detail page (period-end or immediate). Replaces the old native
// confirm() dialogs so every client cancellation can collect a free-text reason
// (no dropdowns). Presentational only: the parent owns the API call and passes
// the typed feedback straight through to /api/client/cancel-subscription.
// ============================================================================

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CancelClientModalProps {
  open: boolean;
  onClose: () => void;
  theme: any;
  title: string;
  warningLines: string[];
  // Label for the destructive confirm button. The caller already knows what the
  // action is (period-end vs immediate), so the modal just collects the reason.
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: (opts: { feedback: string }) => void;
}

export default function CancelClientModal({
  open,
  onClose,
  theme,
  title,
  warningLines,
  confirmLabel = 'Confirm cancellation',
  busy = false,
  error = null,
  onConfirm,
}: CancelClientModalProps) {
  const [feedback, setFeedback] = useState('');

  // Reset the box each time the modal opens so one cancellation's note never
  // carries into the next.
  useEffect(() => { if (open) setFeedback(''); }, [open]);

  if (!open) return null;

  const btnBase = 'rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!busy) onClose(); }} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.isDark ? '#0a0a0a' : '#ffffff', border: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.errorBg }}>
            <AlertTriangle className="h-6 w-6" style={{ color: theme.errorText }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: theme.text }}>{title}</h3>
        </div>

        {warningLines.length > 0 && (
          <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: theme.errorBg }}>
            <ul className="space-y-1 text-sm" style={{ color: theme.errorText }}>
              {warningLines.map((w, i) => <li key={i}>• {w}</li>)}
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded-xl p-3 mb-4 text-sm" style={{ backgroundColor: theme.errorBg, color: theme.errorText, border: `1px solid ${theme.errorBorder}` }}>
            {error}
          </div>
        )}

        {/* Free-text reason box. No dropdown. */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
            Reason for canceling? <span style={{ color: theme.textMuted }}>(optional)</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={busy}
            placeholder="What made you cancel, what was missing, or what would have made you stay."
            rows={4}
            maxLength={1000}
            className="w-full rounded-xl px-3 py-2.5 text-sm resize-none transition-colors"
            style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
          />
          <p className="mt-1 text-xs text-right" style={{ color: theme.textMuted }}>{feedback.length}/1000</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={busy} className={btnBase + ' flex-1'} style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}>
            Keep subscription
          </button>
          <button onClick={() => onConfirm({ feedback: feedback.trim() })} disabled={busy} className={btnBase + ' flex-1 text-white bg-red-600 hover:bg-red-700'}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Working…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}