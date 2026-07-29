// ============================================================================
// SHARED ADMIN STATUS + DATA LOGIC
// The single source of truth for how a call, agency, client, plan, demo, or
// SMS is labeled and colored across the admin. Colors use the emerald-on-white
// palette as hex tints so components can apply them via inline style, matching
// the pattern the existing pages already use.
// Import from '@/lib/admin/status'.
// ============================================================================

export interface BadgeStyle {
  label: string;
  color: string;   // text color
  bg: string;      // background tint
  border: string;  // border tint
}

// ── Palette (mirrors admin-theme.css tokens) ───────────────────────────────
const C = {
  em: '#0B9668', emBg: '#E7F8F0', emLine: '#BEEAD6',
  cyan: '#0E9BB5', cyanBg: '#DBF1F6', cyanLine: '#BFE7F0',
  amber: '#B8790A', amberBg: '#FBF0D6', amberLine: '#F0DCA8',
  red: '#D33A3F', redBg: '#FBE3E3', redLine: '#F3C9C9',
  violet: '#7C4DEF', violetBg: '#EEE7FB', violetLine: '#DBCCF6',
  slate: '#5A6E62', slateBg: '#EEF3EF', slateLine: '#DDE7E0',
};

// ============================================================================
// PLAN TYPE
// Canonical vocabulary is free / pro / scale. Legacy starter / professional /
// enterprise map to the same three. enterprise is effectively dead in live
// logic and is treated as scale only for display.
// ============================================================================
const PLAN_DISPLAY: Record<string, string> = {
  free: 'Free', starter: 'Free',
  pro: 'Pro', professional: 'Pro',
  scale: 'Scale', enterprise: 'Scale', growth: 'Growth',
};

export function getPlanDisplayName(plan?: string | null): string {
  if (!plan) return 'Free';
  return PLAN_DISPLAY[plan] || (plan.charAt(0).toUpperCase() + plan.slice(1));
}

export function getPlanBadge(plan?: string | null): BadgeStyle {
  const name = getPlanDisplayName(plan);
  if (name === 'Pro') return { label: name, color: C.cyan, bg: C.cyanBg, border: C.cyanLine };
  if (name === 'Scale') return { label: name, color: C.violet, bg: C.violetBg, border: C.violetLine };
  if (name === 'Growth') return { label: name, color: C.em, bg: C.emBg, border: C.emLine };
  return { label: name, color: C.slate, bg: C.slateBg, border: C.slateLine };
}

// ============================================================================
// SUBSCRIPTION STATUS (agencies and clients)
// ============================================================================
export function getStatusBadge(status?: string | null): BadgeStyle {
  switch (status) {
    case 'active':
      return { label: 'Active', color: C.em, bg: C.emBg, border: C.emLine };
    case 'trial':
    case 'trialing':
      return { label: 'Trial', color: C.cyan, bg: C.cyanBg, border: C.cyanLine };
    case 'past_due':
      return { label: 'Past due', color: C.amber, bg: C.amberBg, border: C.amberLine };
    case 'trial_expired':
    case 'expired':
      return { label: 'Expired', color: C.amber, bg: C.amberBg, border: C.amberLine };
    case 'canceled':
    case 'suspended':
      return { label: status === 'suspended' ? 'Suspended' : 'Canceled', color: C.red, bg: C.redBg, border: C.redLine };
    case 'pending':
    case 'pending_payment':
      return { label: 'Pending', color: C.slate, bg: C.slateBg, border: C.slateLine };
    default:
      return { label: status || 'Unknown', color: C.slate, bg: C.slateBg, border: C.slateLine };
  }
}

// ============================================================================
// CALL OUTCOME
// The calls table has no single outcome column. The real outcome is derived
// from call_status, urgency_level, ended_reason, transfer_status, and is_spam,
// which the VAPI webhook writes. This is the one place that derivation lives.
//
// Outcomes:
//   spam        blocked as telemarketer or robocall
//   transferred handed to a human successfully
//   urgent      completed and flagged emergency or high urgency
//   completed   handled normally
//   failed      pipeline error or a transfer that failed to connect
//   unknown     saved but no usable outcome, treated as needs-attention
// ============================================================================
export type CallOutcomeKey = 'spam' | 'transferred' | 'urgent' | 'completed' | 'failed' | 'unknown';

export interface CallOutcome {
  key: CallOutcomeKey;
  label: string;
  color: string;
  bg: string;
  needsAttention: boolean;
}

export interface CallLike {
  call_status?: string | null;
  urgency_level?: string | null;
  ended_reason?: string | null;
  transfer_status?: string | null;
  is_spam?: boolean | null;
  ai_summary?: string | null;
}

const OUTCOME_META: Record<CallOutcomeKey, { label: string; color: string; bg: string }> = {
  spam: { label: 'Spam blocked', color: C.slate, bg: C.slateBg },
  transferred: { label: 'Transferred', color: C.violet, bg: C.violetBg },
  urgent: { label: 'Urgent', color: C.amber, bg: C.amberBg },
  completed: { label: 'Completed', color: C.em, bg: C.emBg },
  failed: { label: 'Failed', color: C.red, bg: C.redBg },
  unknown: { label: 'No outcome', color: C.red, bg: C.redBg },
};

export function deriveCallOutcome(call: CallLike): CallOutcome {
  const status = call.call_status || '';
  const urgency = call.urgency_level || '';
  const ended = call.ended_reason || '';
  const transfer = call.transfer_status || '';

  let key: CallOutcomeKey;

  if (call.is_spam === true || status === 'spam' || urgency === 'spam') {
    key = 'spam';
  } else if (transfer === 'transfer_failed' || ended === 'pipeline-error') {
    key = 'failed';
  } else if (status === 'transferred' || transfer === 'transferred') {
    key = 'transferred';
  } else if (urgency === 'emergency' || urgency === 'high') {
    key = 'urgent';
  } else if (status === 'completed') {
    key = 'completed';
  } else {
    key = 'unknown';
  }

  const meta = OUTCOME_META[key];
  return { key, label: meta.label, color: meta.color, bg: meta.bg, needsAttention: key === 'failed' || key === 'unknown' };
}

// Filter keys for the call feed chips. "attention" is a virtual filter that
// matches any outcome where needsAttention is true.
export const CALL_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Needs attention' },
  { key: 'completed', label: 'Completed' },
  { key: 'transferred', label: 'Transferred' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'spam', label: 'Spam' },
];

// ============================================================================
// DEMO CALLS
// demo_calls are leads, not production calls. interest_level drives follow-up
// priority. Used by the Overview hot-demos panel and the Growth demos view.
// ============================================================================
export interface DemoInterest {
  label: string;
  color: string;
  bg: string;
  followUp: string;
  rank: number; // higher is hotter, for sorting
}

export function getDemoInterest(level?: string | null): DemoInterest {
  switch (level) {
    case 'high':
      return { label: 'High interest', color: C.red, bg: C.redBg, followUp: 'Follow up within the hour', rank: 3 };
    case 'medium':
      return { label: 'Medium interest', color: C.amber, bg: C.amberBg, followUp: 'Follow up within 24 hours', rank: 2 };
    case 'low':
      return { label: 'Low interest', color: C.slate, bg: C.slateBg, followUp: 'Low priority', rank: 1 };
    default:
      return { label: 'Interest unknown', color: C.slate, bg: C.slateBg, followUp: 'Review', rank: 0 };
  }
}

// ============================================================================
// SMS TYPE LABELS
// Canonical map for the message_type values written by sms-logger, used by the
// SMS log and the per-agency SMS history. Kept in one place so a new sequence
// added to the backend only needs a label here.
// ============================================================================
export function getSmsTypeLabel(type?: string | null): BadgeStyle {
  if (!type) return { label: 'SMS', color: C.slate, bg: C.slateBg, border: C.slateLine };

  if (type.startsWith('activation_sms_')) {
    return { label: `Activation ${type.split('_').pop()}`, color: C.em, bg: C.emBg, border: C.emLine };
  }
  if (type.startsWith('onboarding_sms_')) {
    return { label: `Onboard ${type.split('_').pop()}`, color: C.cyan, bg: C.cyanBg, border: C.cyanLine };
  }
  if (type.startsWith('abandoned_cart_')) {
    return { label: `Cart ${type.split('_').pop()}`, color: C.amber, bg: C.amberBg, border: C.amberLine };
  }
  if (type.startsWith('trial_warning_day')) {
    return { label: `Trial ${type.replace('trial_warning_day', '')}d`, color: C.red, bg: C.redBg, border: C.redLine };
  }
  if (type.startsWith('demo_')) {
    const rest = type.replace('demo_', '').replace(/_/g, ' ');
    return { label: `Demo ${rest}`.trim(), color: C.violet, bg: C.violetBg, border: C.violetLine };
  }
  return { label: type.replace(/_/g, ' '), color: C.slate, bg: C.slateBg, border: C.slateLine };
}

// SMS delivery status.
export function getSmsDeliveryStyle(status?: string | null): BadgeStyle {
  if (status === 'sent' || status === 'delivered') {
    return { label: status, color: C.em, bg: C.emBg, border: C.emLine };
  }
  if (status === 'failed' || status === 'undelivered') {
    return { label: status, color: C.red, bg: C.redBg, border: C.redLine };
  }
  return { label: status || 'unknown', color: C.slate, bg: C.slateBg, border: C.slateLine };
}