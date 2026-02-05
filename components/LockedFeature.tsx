'use client';

import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';

interface LockedFeatureProps {
  title: string;
  description: string;
  requiredPlan: string;
  icon?: React.ReactNode;
  upgradeUrl?: string;
  learnMoreUrl?: string;
  learnMoreText?: string;
}

export default function LockedFeature({
  title,
  description,
  requiredPlan = 'Enterprise',
  icon,
  upgradeUrl = '/agency/settings?tab=billing',
  learnMoreUrl,
  learnMoreText = 'Learn more',
}: LockedFeatureProps) {
  const { agency, branding } = useAgency();
  
  // Theme
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';
  
  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div 
        className="max-w-2xl mx-auto rounded-2xl p-8 sm:p-12 text-center"
        style={{ 
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
        }}
      >
        {/* Lock Icon */}
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ 
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${borderColor}`,
          }}
        >
          {icon || <Lock className="h-10 w-10" style={{ color: mutedTextColor }} />}
        </div>

        {/* Title */}
        <h1 
          className="text-2xl sm:text-3xl font-bold mb-3"
          style={{ color: textColor }}
        >
          {title}
        </h1>

        {/* Description */}
        <p 
          className="text-base sm:text-lg mb-8 max-w-md mx-auto"
          style={{ color: mutedTextColor }}
        >
          {description}
        </p>

        {/* Required Plan Badge */}
        <div 
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8"
          style={{ 
            backgroundColor: `${primaryColor}15`,
            border: `1px solid ${primaryColor}30`,
          }}
        >
          <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
          <span className="text-sm font-medium" style={{ color: primaryColor }}>
            {requiredPlan} Plan Feature
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={upgradeUrl}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all hover:opacity-90"
            style={{ 
              backgroundColor: primaryColor,
              color: isDark ? '#050505' : '#ffffff',
            }}
          >
            Upgrade to {requiredPlan}
            <ArrowRight className="h-4 w-4" />
          </Link>

          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all ${
                isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
              }`}
              style={{ 
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${borderColor}`,
                color: textColor,
              }}
            >
              {learnMoreText}
            </a>
          )}
        </div>

        {/* Current Plan Info */}
        <p 
          className="mt-8 text-sm"
          style={{ color: mutedTextColor }}
        >
          Current plan: <span className="capitalize font-medium">{agency?.plan_type || 'Starter'}</span>
        </p>
      </div>
    </div>
  );
}