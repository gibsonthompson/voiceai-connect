// ============================================================================
// components/UpgradePrompt.tsx
// 
// Reusable component shown when a client tries to access a feature 
// not included in their plan. Shows what the feature does and a CTA
// to upgrade.
//
// Usage:
//   import UpgradePrompt from '@/components/UpgradePrompt';
//   import { useClientPlanFeatures } from '@/hooks/useClientPlanFeatures';
//   
//   const { isFeatureEnabled } = useClientPlanFeatures(client, agency);
//   
//   {!isFeatureEnabled('knowledge_base') ? (
//     <UpgradePrompt 
//       feature="knowledge_base" 
//       primaryColor={agency.primary_color}
//     />
//   ) : (
//     <KnowledgeBaseEditor ... />
//   )}
// ============================================================================

'use client';

import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import type { ClientFeatureKey } from '@/hooks/useClientPlanFeatures';

interface UpgradePromptProps {
  feature: ClientFeatureKey;
  primaryColor?: string;
  isDark?: boolean;
  /** Optional custom message override */
  message?: string;
  /** Optional custom CTA text */
  ctaText?: string;
}

const FEATURE_INFO: Record<ClientFeatureKey, { 
  title: string; 
  description: string;
  icon: string;
}> = {
  sms_notifications: {
    title: 'SMS Notifications',
    description: 'Get instant text messages after every call with caller name, reason, and urgency level.',
    icon: '📱',
  },
  email_summaries: {
    title: 'Email Summaries',
    description: 'Receive detailed email summaries with full call details, transcript preview, and action items.',
    icon: '📧',
  },
  custom_greeting: {
    title: 'Custom Greeting',
    description: 'Write your own AI opening message to match your brand voice and style.',
    icon: '👋',
  },
  custom_voice: {
    title: 'Custom Voice',
    description: 'Choose from multiple AI voice options to find the perfect voice for your business.',
    icon: '🎙️',
  },
  knowledge_base: {
    title: 'Knowledge Base',
    description: 'Upload your business FAQs, services, and pricing so the AI can answer customer questions accurately.',
    icon: '📚',
  },
  business_hours: {
    title: 'Business Hours',
    description: 'Set your availability and configure different AI behaviors for after-hours calls.',
    icon: '🕐',
  },
  advanced_analytics: {
    title: 'Advanced Analytics',
    description: 'Get detailed insights with call volume trends, peak hours, common reasons, and more.',
    icon: '📊',
  },
  priority_support: {
    title: 'Priority Support',
    description: 'Get faster response times and dedicated assistance when you need help.',
    icon: '⚡',
  },
};

export default function UpgradePrompt({ 
  feature, 
  primaryColor = '#2563eb',
  isDark = false,
  message,
  ctaText = 'Upgrade Your Plan',
}: UpgradePromptProps) {
  const info = FEATURE_INFO[feature];
  if (!info) return null;

  const bgColor = isDark ? 'rgba(255,255,255,0.02)' : '#fafafa';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const lockBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  return (
    <div
      className="rounded-xl p-5 sm:p-6 text-center"
      style={{
        backgroundColor: bgColor,
        border: `1px dashed ${borderColor}`,
      }}
    >
      <div 
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
        style={{ backgroundColor: lockBg }}
      >
        <div className="relative">
          <span className="text-2xl">{info.icon}</span>
          <div 
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff', border: `1px solid ${borderColor}` }}
          >
            <Lock className="h-3 w-3" style={{ color: mutedColor }} />
          </div>
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: textColor }}>
        {info.title}
      </h3>
      
      <p className="text-sm mb-5 max-w-sm mx-auto" style={{ color: mutedColor }}>
        {message || info.description}
      </p>

      <div 
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
        style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
      >
        <Sparkles className="h-3 w-3" />
        Available on higher plans
      </div>

      <div>
        <a
          href="/client/upgrade"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: primaryColor,
            color: '#ffffff',
          }}
        >
          {ctaText}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}