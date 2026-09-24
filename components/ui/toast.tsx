'use client';

import type { CSSProperties } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// Shared floating toast for save-success / error feedback across the client
// dashboard. Presentational: the page owns the message and the color style
// (success vs error) and tells it whether this is an error so the right icon
// shows. Renders nothing when message is empty. A leading check/cross emoji is
// stripped so the icon replaces it rather than doubling up.
export function Toast({ message, style, isError = false }: { message: string; style: CSSProperties; isError?: boolean }) {
  if (!message) return null;
  const Icon = isError ? AlertCircle : CheckCircle2;
  const display = message.replace(/^[\u2705\u274c]\s*/, '');
  return (
    <div
      className="fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <style>{`@keyframes vaicToastIn{from{opacity:0;transform:translateY(10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      <div
        key={message}
        className="pointer-events-auto flex items-center gap-2.5 rounded-xl pl-3.5 pr-4 py-3 text-sm font-medium shadow-lg max-w-md"
        style={{ ...style, animation: 'vaicToastIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)' }}
        role="status"
        aria-live="polite"
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" style={{ opacity: 0.9 }} />
        <span>{display}</span>
      </div>
    </div>
  );
}