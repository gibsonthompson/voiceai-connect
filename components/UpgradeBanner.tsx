'use client';

// components/UpgradeBanner.tsx
// Reusable component to show upgrade prompts when features are gated

import Link from 'next/link';
import { Lock, ArrowRight, Sparkles, Zap, Crown } from 'lucide-react';
import { PLAN_NAMES, PLAN_PRICES, PlanType } from '@/lib/plan-limits';

interface UpgradeBannerProps {
  feature: string;
  requiredPlan: PlanType;
  currentPlan: PlanType;
  variant?: 'inline' | 'card' | 'modal' | 'subtle';
  className?: string;
}

export function UpgradeBanner({ 
  feature, 
  requiredPlan, 
  currentPlan,
  variant = 'card',
  className = ''
}: UpgradeBannerProps) {
  const planIcons = {
    starter: Zap,
    professional: Sparkles,
    scale: Crown,
  };
  
  const PlanIcon = planIcons[requiredPlan];
  const price = PLAN_PRICES[requiredPlan];
  const planName = PLAN_NAMES[requiredPlan];
  
  if (variant === 'subtle') {
    return (
      <div className={`flex items-center gap-2 text-sm text-[#fafaf9]/50 ${className}`}>
        <Lock className="h-3.5 w-3.5" />
        <span>Requires {planName} plan</span>
        <Link 
          href="/agency/settings/billing"
          className="text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Upgrade →
        </Link>
      </div>
    );
  }
  
  if (variant === 'inline') {
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 ${className}`}>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" />
          <span className="text-sm text-amber-200">
            {feature} requires {planName}
          </span>
        </div>
        <Link 
          href="/agency/settings/billing"
          className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          Upgrade
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }
  
  // Default card variant
  return (
    <div className={`rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <PlanIcon className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            Unlock {feature}
          </h3>
          <p className="text-sm text-[#fafaf9]/50 mb-4">
            This feature is available on the {planName} plan and above. 
            Upgrade to access {feature.toLowerCase()} and more powerful tools.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/agency/settings/billing"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-[#050505] hover:bg-emerald-400 transition-colors"
            >
              Upgrade to {planName}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-sm text-[#fafaf9]/40">
              ${price}/month
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// FeatureGate component - wraps content and shows upgrade banner if feature is gated
interface FeatureGateProps {
  feature: string;
  requiredPlan: PlanType;
  currentPlan: PlanType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeBanner?: boolean;
}

export function FeatureGate({
  feature,
  requiredPlan,
  currentPlan,
  children,
  fallback,
  showUpgradeBanner = true,
}: FeatureGateProps) {
  const planHierarchy: PlanType[] = ['starter', 'professional', 'scale'];
  const currentLevel = planHierarchy.indexOf(currentPlan);
  const requiredLevel = planHierarchy.indexOf(requiredPlan);
  
  const hasAccess = currentLevel >= requiredLevel;
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showUpgradeBanner) {
    return (
      <UpgradeBanner 
        feature={feature}
        requiredPlan={requiredPlan}
        currentPlan={currentPlan}
      />
    );
  }
  
  return null;
}

// ClientLimitBanner - shows when approaching or at client limit
interface ClientLimitBannerProps {
  currentClients: number;
  maxClients: number;
  currentPlan: PlanType;
  className?: string;
}

export function ClientLimitBanner({
  currentClients,
  maxClients,
  currentPlan,
  className = '',
}: ClientLimitBannerProps) {
  const remaining = maxClients - currentClients;
  const isAtLimit = remaining <= 0;
  const isNearLimit = remaining <= 3 && remaining > 0;
  
  if (!isAtLimit && !isNearLimit) {
    return null;
  }
  
  const nextPlan: PlanType = currentPlan === 'starter' ? 'professional' : 'scale';
  const nextPlanLimit = currentPlan === 'starter' ? 100 : '∞';
  
  if (isAtLimit) {
    return (
      <div className={`rounded-xl border border-red-500/20 bg-red-500/10 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/20">
            <Lock className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-red-200 mb-1">Client limit reached</h4>
            <p className="text-sm text-red-200/70 mb-3">
              You&apos;ve reached the maximum of {maxClients} clients on your {PLAN_NAMES[currentPlan]} plan.
              Upgrade to {PLAN_NAMES[nextPlan]} for up to {nextPlanLimit} clients.
            </p>
            <Link
              href="/agency/settings/billing"
              className="inline-flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Upgrade now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Near limit warning
  return (
    <div className={`rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
          <Sparkles className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-amber-200">
            <strong>{remaining} client{remaining !== 1 ? 's' : ''} remaining</strong> on your {PLAN_NAMES[currentPlan]} plan.{' '}
            <Link
              href="/agency/settings/billing"
              className="text-amber-400 hover:text-amber-300 transition-colors underline"
            >
              Upgrade for more
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default UpgradeBanner;