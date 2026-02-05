'use client';

import { Lock, Sparkles, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import { ReactNode } from 'react';

interface LockedFeatureOverlayProps {
  /** The actual page content to show as a preview */
  children: ReactNode;
  /** Feature title shown in the upgrade prompt */
  title: string;
  /** Brief description of what the feature does */
  description: string;
  /** Plan required to unlock */
  requiredPlan: 'Professional' | 'Enterprise';
  /** Optional list of features/benefits */
  features?: string[];
  /** URL to upgrade page */
  upgradeUrl?: string;
}

export default function LockedFeatureOverlay({
  children,
  title,
  description,
  requiredPlan,
  features = [],
  upgradeUrl = '/agency/settings?tab=billing',
}: LockedFeatureOverlayProps) {
  const { agency, branding } = useAgency();
  
  // Theme
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';
  
  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.6)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(10,10,10,0.98)' : 'rgba(255,255,255,0.98)';
  const overlayBg = isDark 
    ? 'rgba(5,5,5,0.75)' 
    : 'rgba(249,250,251,0.80)';

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background: Actual page content - visible as preview */}
      <div 
        className="pointer-events-none select-none"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Light overlay - just enough to indicate locked state */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: isDark 
            ? 'radial-gradient(ellipse at center, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.75) 100%)'
            : 'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.7) 100%)',
          backdropFilter: 'blur(1px)',
        }}
      />

      {/* Centered upgrade card - top on mobile, center on desktop */}
      <div className="absolute inset-0 flex items-start md:items-center justify-center p-4 pt-8 sm:p-6 md:pt-6">
        <div 
          className="w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl animate-scale-in"
          style={{ 
            backgroundColor: cardBg,
            border: `1px solid ${borderColor}`,
            boxShadow: isDark 
              ? '0 25px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' 
              : '0 25px 60px -12px rgba(0,0,0,0.18)',
          }}
        >
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5"
            style={{ 
              backgroundColor: `${primaryColor}12`,
              border: `1px solid ${primaryColor}25`,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: primaryColor }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>
              {requiredPlan} Feature
            </span>
          </div>

          {/* Lock Icon */}
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
            style={{ 
              backgroundColor: `${primaryColor}10`,
              border: `1px solid ${primaryColor}20`,
            }}
          >
            <Lock className="h-7 w-7" style={{ color: primaryColor }} />
          </div>

          {/* Title */}
          <h2 
            className="text-xl sm:text-2xl font-bold mb-2"
            style={{ color: textColor }}
          >
            Unlock {title}
          </h2>

          {/* Description */}
          <p 
            className="text-sm sm:text-base mb-5"
            style={{ color: mutedTextColor }}
          >
            {description}
          </p>

          {/* Features list */}
          {features.length > 0 && (
            <ul className="space-y-2.5 mb-6 text-left">
              {features.map((feature, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2.5 text-sm"
                  style={{ color: isDark ? 'rgba(250,250,249,0.8)' : '#374151' }}
                >
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Check className="w-3 h-3" style={{ color: primaryColor }} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          )}

          {/* CTA Button */}
          <Link
            href={upgradeUrl}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              backgroundColor: primaryColor,
              color: isDark ? '#050505' : '#ffffff',
            }}
          >
            Upgrade to {requiredPlan}
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Current plan */}
          <p 
            className="mt-4 text-center text-xs"
            style={{ color: mutedTextColor }}
          >
            You're on the <span className="font-medium capitalize">{agency?.plan_type || 'Starter'}</span> plan
          </p>
        </div>
      </div>
    </div>
  );
}