// Shared call-status badges so the agency and client views render the SAME
// icons, labels and colors for a given call, driven by the stored call fields
// (so they persist everywhere). Returns badge descriptors; each page renders
// them however it lays out (chip, pill, etc.).
import { ShieldX, PhoneForwarded, CalendarCheck, AlertTriangle } from 'lucide-react';

export type CallBadge = { key: string; label: string; Icon: any; bg: string; color: string };

function rgba(hex: string, a: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } catch { return `rgba(0,0,0,${a})`; }
}

export function getCallBadges(call: any, theme: any): CallBadge[] {
  if (!call) return [];

  // Spam is exclusive, nothing else matters for a blocked call.
  if (call.call_status === 'spam' || call.is_spam) {
    return [{ key: 'spam', label: 'Spam', Icon: ShieldX, bg: theme.errorBg, color: theme.errorText || theme.error }];
  }

  const badges: CallBadge[] = [];

  const transferred = call.transfer_status === 'transferred' || call.call_status === 'transferred';
  const transferFailed = call.transfer_status === 'transfer_failed';
  if (transferred) {
    badges.push({
      key: 'transferred',
      label: 'Transferred',
      Icon: PhoneForwarded,
      bg: theme.primary15 || rgba(theme.primary || '#2563eb', 0.1),
      color: theme.primary || '#2563eb',
    });
  } else if (transferFailed) {
    badges.push({
      key: 'transfer_failed',
      label: 'Transfer failed',
      Icon: AlertTriangle,
      bg: theme.warningBg,
      color: theme.warningText || theme.warning,
    });
  }

  if (call.appointment_booked) {
    badges.push({
      key: 'booked',
      label: 'Booked',
      Icon: CalendarCheck,
      bg: theme.successBg,
      color: theme.successText || theme.success,
    });
  }

  return badges;
}