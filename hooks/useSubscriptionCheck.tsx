'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SubscriptionStatus {
  status: string;
  trialEndsAt: string | null;
  planType: string | null;
  isLoading: boolean;
  daysRemaining: number | null;
}

// Routes that don't require subscription check
const PUBLIC_ROUTES = [
  '/client/login',
  '/client/signup',
  '/client/upgrade',
  '/client/set-password',
  '/set-password',
];

export function useSubscriptionCheck(): SubscriptionStatus {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<SubscriptionStatus>({
    status: 'loading',
    trialEndsAt: null,
    planType: null,
    isLoading: true,
    daysRemaining: null,
  });

  useEffect(() => {
    // Skip check for public routes
    if (PUBLIC_ROUTES.some(route => pathname?.startsWith(route))) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const checkSubscription = async () => {
      try {
        const token = localStorage.getItem('client_auth_token');
        
        if (!token) {
          router.push('/client/login');
          return;
        }

        const response = await fetch('/api/client/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          router.push('/client/login');
          return;
        }

        const data = await response.json();
        const client = data.client;

        // Calculate days remaining
        let daysRemaining = null;
        if (client.trial_ends_at && client.subscription_status === 'trial') {
          const endDate = new Date(client.trial_ends_at);
          const now = new Date();
          const diffTime = endDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        setStatus({
          status: client.subscription_status || 'trial',
          trialEndsAt: client.trial_ends_at,
          planType: client.plan_type,
          isLoading: false,
          daysRemaining,
        });

        // Check if trial expired or subscription canceled
        const isTrialExpired = 
          client.subscription_status === 'trial' && 
          client.trial_ends_at && 
          new Date(client.trial_ends_at) < new Date();

        const needsUpgrade = 
          isTrialExpired || 
          client.subscription_status === 'trial_expired' ||
          client.subscription_status === 'canceled' ||
          client.subscription_status === 'past_due';

        if (needsUpgrade && !pathname?.startsWith('/client/upgrade')) {
          router.push('/client/upgrade');
        }

      } catch (error) {
        console.error('Subscription check failed:', error);
        setStatus(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkSubscription();
  }, [pathname, router]);

  return status;
}

// Component wrapper for protected routes
interface SubscriptionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SubscriptionGate({ children, fallback }: SubscriptionGateProps) {
  const { isLoading } = useSubscriptionCheck();

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If status check passed (didn't redirect), render children
  return <>{children}</>;
}