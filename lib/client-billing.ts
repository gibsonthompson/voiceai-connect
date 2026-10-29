// ============================================================================
// CLIENT BILLING CAPABILITIES — single source of truth
// ============================================================================
// Every client-facing page (dashboard, settings, upgrade-required, client-shell)
// reads what billing/subscription actions a client may take from THIS function
// instead of re-deriving the agency toggles on its own. Those ad-hoc derivations
// are what let the trial plan-picker drift away from the "Let clients change
// their own plan" toggle: the toggle gated active clients but not trial ones.
//
// Toggle priority (highest wins):
//   1. hide_client_billing      -> billing UI is entirely invisible (white-glove).
//   2. billing_mode: 'manual'   -> no self-serve billing ACTIONS (agency invoices
//      the client directly). The subscription card still renders a "billed by
//      your provider" message, so this gates actions, not card visibility.
//   3. allow_client_plan_changes-> client may choose/switch a plan TIER. This
//      applies to BOTH trial and active clients. When OFF, a trial client may
//      still ACTIVATE the plan the agency already assigned them, but cannot pick
//      a different tier (Option A). An active client cannot switch at all.
//
// Inputs are read defensively: the agency/client objects differ in shape from
// page to page, so this takes `any` and never assumes a field exists.

export interface ClientBillingCaps {
  /** Master switch. False => hide every billing/subscription surface + banners. */
  billingVisible: boolean;
  /** Whether the Settings "Subscription" card renders at all. */
  showSubscriptionCard: boolean;
  /** Agency invoices this client directly (no self-serve Stripe actions). */
  isManual: boolean;
  /** Client may choose/switch a plan TIER (trial AND active). */
  canChangeTier: boolean;
  /** Trial / expired / canceled client may add a card to activate their assigned plan. */
  canSelfActivate: boolean;
  /** Client may cancel their own subscription. */
  canCancel: boolean;
  /** Show the call-usage meter (limit / used / left). */
  showUsage: boolean;
  /** Show the discount-code field at checkout. */
  showDiscountCode: boolean;
  /** At upgrade, show plans priced below the current one (lets them downgrade). */
  showLowerPlans: boolean;
}

export function resolveClientBilling(agency: any, client: any): ClientBillingCaps {
  const a = agency || {};
  const c = client || {};

  const billingVisible = a.hide_client_billing !== true;
  // Dashboard also treats subscription_status 'manual' as manual; match that so
  // every surface agrees on who is agency-invoiced.
  const isManual = c.billing_mode === 'manual' || c.subscription_status === 'manual';
  const isTest = c.is_test_client === true;

  const showSubscriptionCard = billingVisible && a.show_client_subscription !== false;

  const canChangeTier =
    billingVisible && a.allow_client_plan_changes === true && !isManual && !isTest;

  // A client with no live subscription (trial / expired / canceled) can always
  // add a card to activate, as long as billing is visible and not agency-invoiced.
  // Whether they may pick a DIFFERENT tier is governed by canChangeTier; the UI
  // restricts the plan list to their assigned plan when canChangeTier is false.
  const canSelfActivate = billingVisible && !isManual;

  return {
    billingVisible,
    showSubscriptionCard,
    isManual,
    canChangeTier,
    canSelfActivate,
    canCancel: billingVisible && a.allow_client_cancel !== false,
    showUsage: billingVisible && a.show_client_call_usage !== false,
    showDiscountCode: billingVisible && a.show_client_discount_code !== false,
    showLowerPlans: a.show_lower_plans_on_upgrade === true,
  };
}
