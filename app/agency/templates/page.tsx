'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, Wrench, Stethoscope, Scale, Home, Calculator, Briefcase,
  UtensilsCrossed, Sparkles, Dumbbell, ShoppingBag, Car, Building2,
  ChevronRight, Check, ExternalLink, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import LockedFeature from '@/components/LockedFeature';

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  Wrench,
  Stethoscope,
  Scale,
  Home,
  Calculator,
  Briefcase,
  UtensilsCrossed,
  Sparkles,
  Dumbbell,
  ShoppingBag,
  Car,
  Building2,
};

interface Industry {
  frontendKey: string;
  backendKey: string;
  label: string;
  description: string;
  icon: string;
  hasCustomTemplate: boolean;
  isActive: boolean;
  updatedAt: string | null;
}

// Demo industries for preview when locked
const DEMO_INDUSTRIES: Industry[] = [
  { frontendKey: 'home_services', backendKey: 'home_services', label: 'Home Services', description: 'Plumbing, HVAC, electrical, contractors', icon: 'Wrench', hasCustomTemplate: false, isActive: true, updatedAt: null },
  { frontendKey: 'medical_dental', backendKey: 'medical', label: 'Medical & Dental', description: 'Medical practices, dental offices', icon: 'Stethoscope', hasCustomTemplate: true, isActive: true, updatedAt: '2024-01-15' },
  { frontendKey: 'legal', backendKey: 'legal', label: 'Legal Services', description: 'Law firms, attorneys, consultants', icon: 'Scale', hasCustomTemplate: false, isActive: true, updatedAt: null },
  { frontendKey: 'real_estate', backendKey: 'real_estate', label: 'Real Estate', description: 'Agents, property management', icon: 'Home', hasCustomTemplate: true, isActive: true, updatedAt: '2024-01-10' },
  { frontendKey: 'financial_services', backendKey: 'financial_services', label: 'Financial Services', description: 'Accountants, financial advisors', icon: 'Calculator', hasCustomTemplate: false, isActive: true, updatedAt: null },
  { frontendKey: 'professional_services', backendKey: 'professional_services', label: 'Professional Services', description: 'Consultants, agencies, B2B', icon: 'Briefcase', hasCustomTemplate: false, isActive: true, updatedAt: null },
];

export default function AITemplatesPage() {
  const { agency, branding, loading: contextLoading } = useAgency();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  // Theme
  const isDark = agency?.website_theme !== 'light';
  const primaryColor = branding.primaryColor || '#10b981';

  // Theme-based colors
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const cardBg = isDark ? 'rgba(255,255,255,0.02)' : '#ffffff';

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (agency) {
      checkAccessAndFetch();
    }
  }, [agency]);

  const checkAccessAndFetch = async () => {
    if (!agency) return;

    try {
      const token = localStorage.getItem('auth_token');

      // Check access first
      const checkResponse = await fetch(`${backendUrl}/api/agency/${agency.id}/templates/check`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        setHasAccess(checkData.hasAccess);

        if (checkData.hasAccess) {
          // Fetch industries
          const industriesResponse = await fetch(`${backendUrl}/api/agency/${agency.id}/templates/industries`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (industriesResponse.ok) {
            const data = await industriesResponse.json();
            setIndustries(data.industries || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Shared page content component (used for both preview and actual)
  const PageContent = ({ industryList, isInteractive = true }: { industryList: Industry[], isInteractive?: boolean }) => (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: textColor }}>
          AI Templates
        </h1>
        <p className="mt-1 text-sm sm:text-base" style={{ color: mutedTextColor }}>
          Customize AI receptionist prompts for each industry
        </p>
      </div>

      {/* Info Banner */}
      <div 
        className="mb-6 sm:mb-8 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{
          backgroundColor: `${primaryColor}08`,
          border: `1px solid ${primaryColor}20`,
        }}
      >
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Sparkles className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm" style={{ color: textColor }}>
            Enterprise Feature
          </p>
          <p className="text-sm" style={{ color: mutedTextColor }}>
            Custom templates only apply to <strong>new clients</strong>. Existing clients keep their current configuration.
          </p>
        </div>
        {isInteractive && (
          <a
            href="/blog/ai-receptionist-prompt-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium flex-shrink-0"
            style={{ color: primaryColor }}
          >
            <BookOpen className="h-4 w-4" />
            Prompt Guide
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Industry Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {industryList.map((industry) => {
          const IconComponent = ICON_MAP[industry.icon] || Building2;
          
          const CardWrapper = isInteractive ? Link : 'div';
          const cardProps = isInteractive 
            ? { href: `/agency/templates/${industry.frontendKey}` }
            : {};
          
          return (
            <CardWrapper
              key={industry.frontendKey}
              {...cardProps}
              className={`group rounded-xl p-5 transition-all ${
                isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
              }`}
              style={{ 
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ 
                    backgroundColor: industry.hasCustomTemplate 
                      ? `${primaryColor}15` 
                      : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <IconComponent 
                    className="h-6 w-6" 
                    style={{ 
                      color: industry.hasCustomTemplate ? primaryColor : mutedTextColor 
                    }} 
                  />
                </div>

                {industry.hasCustomTemplate ? (
                  <span 
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                    style={{ 
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                    }}
                  >
                    <Check className="h-3 w-3" />
                    Custom
                  </span>
                ) : (
                  <span 
                    className="rounded-full px-2 py-1 text-xs font-medium"
                    style={{ 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                      color: mutedTextColor,
                    }}
                  >
                    Default
                  </span>
                )}
              </div>

              <h3 className="font-medium mb-1" style={{ color: textColor }}>
                {industry.label}
              </h3>
              <p className="text-sm mb-4" style={{ color: mutedTextColor }}>
                {industry.description}
              </p>

              <div className="flex items-center justify-between">
                {industry.updatedAt && (
                  <span className="text-xs" style={{ color: mutedTextColor }}>
                    Updated {new Date(industry.updatedAt).toLocaleDateString()}
                  </span>
                )}
                <ChevronRight 
                  className="h-5 w-5 ml-auto transition-transform group-hover:translate-x-1" 
                  style={{ color: mutedTextColor }} 
                />
              </div>
            </CardWrapper>
          );
        })}
      </div>

      {/* Help Section */}
      <div 
        className="mt-8 rounded-xl p-6"
        style={{ 
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
        }}
      >
        <h3 className="font-medium mb-2" style={{ color: textColor }}>
          Need help with prompts?
        </h3>
        <p className="text-sm mb-4" style={{ color: mutedTextColor }}>
          Check out our guides for writing effective AI receptionist prompts:
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: BookOpen, label: 'Prompt Engineering Guide' },
            { icon: Wrench, label: 'Home Services Prompts' },
            { icon: Stethoscope, label: 'Medical & Dental Prompts' },
          ].map((guide) => (
            <div
              key={guide.label}
              className={`inline-flex items-center gap-2 text-sm rounded-lg px-4 py-2 ${
                isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'
              }`}
              style={{ 
                border: `1px solid ${borderColor}`,
                color: textColor,
              }}
            >
              <guide.icon className="h-4 w-4" />
              {guide.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  // Show locked overlay with preview content
  if (hasAccess === false) {
    return (
      <LockedFeature
        title="AI Templates"
        description="Customize AI receptionist prompts, voices, and conversation flows for each industry your clients serve."
        requiredPlan="Enterprise"
        features={[
          'Custom prompts for 11 industries',
          'Voice selection per industry',
          'Fine-tune temperature & behavior',
          'Industry-specific knowledge bases',
        ]}
      >
        <PageContent industryList={DEMO_INDUSTRIES} isInteractive={false} />
      </LockedFeature>
    );
  }

  // Full access - render interactive page
  return <PageContent industryList={industries} isInteractive={true} />;
}