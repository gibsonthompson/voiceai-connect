'use client';

import { useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

// A promise-based replacement for the browser's native confirm(). Call the
// returned confirm() to get a Promise<boolean>, and render the returned
// confirmDialog once in the component. Drop-in at any old call site:
//   if (!(await confirm({ title, message }))) return;
// Reusable across the app so no feature has to ship its own confirm modal.

export type ConfirmTone = 'default' | 'danger';

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

export interface ConfirmUI {
  card: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  hover: string;
  dangerBg?: string;
  dangerText?: string;
  overlay?: string;
}

export function useConfirm(ui: ConfirmUI) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    setOptions(null);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(result);
  };

  const danger = options?.tone === 'danger';
  const dangerColor = ui.dangerBg || '#dc2626';
  const confirmBg = danger ? dangerColor : ui.primary;
  const confirmFg = danger ? (ui.dangerText || '#ffffff') : ui.primaryText;

  const confirmDialog = options ? (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: ui.overlay || 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) close(false); }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: ui.card, border: `1px solid ${ui.border}` }}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            {danger && (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0"
                style={{ backgroundColor: `${dangerColor}22` }}
              >
                <AlertTriangle className="h-5 w-5" style={{ color: dangerColor }} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base font-semibold" style={{ color: ui.text }}>{options.title}</h3>
              {options.message && (
                <div className="mt-1.5 text-sm leading-relaxed" style={{ color: ui.textMuted }}>{options.message}</div>
              )}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={() => close(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: ui.hover, color: ui.text }}
            >
              {options.cancelLabel || 'Cancel'}
            </button>
            <button
              onClick={() => close(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ backgroundColor: confirmBg, color: confirmFg }}
            >
              {options.confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, confirmDialog };
}