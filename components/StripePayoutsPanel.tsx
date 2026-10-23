'use client';

// ---------------------------------------------------------------------------
// Embedded Stripe "Payouts" component.
//
// Renders Stripe's native Connect embedded Payouts UI: the account's balance,
// payout schedule, payout history, and crucially the "Pay out" button with the
// Instant option when the connected account is actually eligible. Stripe
// evaluates eligibility itself, so unlike the old "instant available" strip we
// never promise instant payouts the account can't really perform.
//
// The backend already mints the account session (POST
// /api/agency/connect/account-session/:agencyId) with the payouts + balances
// components and the instant_payouts feature enabled. This component just wires
// the browser side to it.
//
// Requires NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (the platform's publishable key,
// safe to expose). When it is not set, the parent falls back to the read-only
// payout list, so the page never breaks.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { ConnectComponentsProvider, ConnectPayouts } from '@stripe/react-connect-js';

interface StripePayoutsPanelProps {
  agencyId: string;
  backendUrl: string;
  primaryColor?: string;
  isDark?: boolean;
}

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function StripePayoutsPanel({ agencyId, backendUrl, primaryColor, isDark }: StripePayoutsPanelProps) {
  const [loadError, setLoadError] = useState<string | null>(null);

  // Create the Connect instance exactly once (Stripe's performance guidance).
  const [connectInstance] = useState(() => {
    if (!PUBLISHABLE_KEY) return null;
    return loadConnectAndInitialize({
      publishableKey: PUBLISHABLE_KEY,
      // Always mint a fresh account session; Connect.js also calls this to
      // refresh an expired session.
      fetchClientSecret: async () => {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${backendUrl}/api/agency/connect/account-session/${agencyId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Could not start a secure Stripe session.');
        }
        const d = await res.json();
        return d.client_secret as string;
      },
      appearance: {
        variables: {
          colorPrimary: primaryColor || '#007e77',
        },
      },
    });
  });

  if (!PUBLISHABLE_KEY || !connectInstance) {
    return (
      <p className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
        In-app payouts aren&apos;t configured yet.
      </p>
    );
  }

  return (
    <ConnectComponentsProvider connectInstance={connectInstance}>
      <ConnectPayouts onLoadError={(loadError) => setLoadError(loadError.error?.message ?? 'Failed to load payouts.')} />
      {loadError && (
        <p className="mt-3 text-xs" style={{ color: '#dc2626' }}>{loadError}</p>
      )}
    </ConnectComponentsProvider>
  );
}