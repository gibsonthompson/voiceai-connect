'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, Wrench, Stethoscope, Scale, Home, Calculator, Briefcase,
  UtensilsCrossed, Sparkles, Dumbbell, ShoppingBag, Car, Building2,
  ChevronRight, Check, ExternalLink, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { useAgency } from '@/app/agency/context';
import { useTheme } from '@/hooks/useTheme';
import LockedFeature from '@/components/LockedFeature';

const ICON_MAP: Record<string, React.ElementType> = {
  Wrench, Stethoscope, Scale, Home, Calculator, Briefcase,
  UtensilsCrossed, Sparkles, Dumbbell, ShoppingBag, Car, Building2,
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

const DEMO_INDUSTRIES: Industry[] = [
  { frontendKey: 'home_services', backendKey: 'home_services', label: 'Home Services', description: 'Plumbing, HVAC, electrical, contractors', icon: 'Wrench', hasCustomTemplate: false, isActive: true, updatedAt: null },
  { frontendKey: 'medical_dental', backendKey: 'medical', label: 'Medical & Dental', description: 'Medical practices, dental offices', icon: 'Stethoscope', hasCustomTemplate: true, isActive: true, updatedAt: '2024-01-15' },
  { frontendKey: 'legal', backendKey: 'legal', label: 'Legal Services', description: 'Law firms, attorneys, consultants', icon: 'Scale', hasCustomTemplate: false, isActive: true, updatedAt: null },
  { frontendKey: 'real_estate', backendKey: 'real_estate', label: 'Real Estate', description: 'Agents, property management', icon: 'Home', hasCustomTemplate: true, isActive: true, updatedAt: '2024-01-10' },
  { frontendKey: 'financial_services', backendKey: 'financial_services', label: 'Financial Services', description: 'Accountants, financial advisors', icon: 'Calculator', hasCustomTemplate: false, isActive: true, updatedAt: null },
  { frontendKey: 'professional_services', backendKey: 'professional_services', label: 'Professional Services', description: 'Consultants, agencies, B2B', icon: 'Briefcase', hasCustomTemplate: false, isActive: true, updatedAt: null },
];

const PROMPT_GUIDES = [
  { icon: BookOpen, label: 'Prompt Engineering Guide', href: '/blog/ai-receptionist-prompt-guide', description: 'Fundamentals of writing effective AI prompts' },
  { icon: Wrench, label: 'Home Services Prompts', href: '/blog/home-services-ai-receptionist-prompts', description: 'HVAC, plumbing, electrical, contractors' },
  { icon: Stethoscope, label: 'Medical & Dental Prompts', href: '/blog/medical-dental-ai-receptionist-prompts', description: 'Healthcare practices and dental offices' },
];

export default function AITemplatesPage() {
  const { agency, loading: contextLoading, effectivePlan } = useAgency();
  const theme = useTheme();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (agency) {
      checkAccessAndFetch();
    }
  }, [agency, effectivePlan]);

  const checkAccessAndFetch = async () => {
    if (!agency) return;

    if (effectivePlan === 'enterprise') {
      setHasAccess(true);
      try {
        const token = localStorage.getItem('auth_token');
        const industriesResponse = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-templates/industries`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (industriesResponse.ok) {
          const data = await industriesResponse.json();
          setIndustries(data.industries || []);
        }
      } catch (error) {
        console.error('Failed to fetch industries:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');

      const checkResponse = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-templates/check`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        setHasAccess(checkData.hasAccess);

        if (checkData.hasAccess) {
          const industriesResponse = await fetch(`${backendUrl}/api/agency/${agency.id}/ai-templates/industries`, {
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

  const PageContent = ({ industryList, isInteractive = true }: { industryList: Industry[], isInteractive?: boolean }) => (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>
          AI Templates
        </h1>
        <p className="mt-1 text-sm sm:text-base" style={{ color: theme.textMuted }}>
          Customize AI receptionist prompts for each industry
        </p>
      </div>

      {/* Info Banner */}
      <div 
        className="mb-6 sm:mb-8 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{
          backgroundColor: theme.primary + '08',
          border: `1px solid ${theme.primary}20`,
        }}
      >
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
          style={{ backgroundColor: theme.primary15 }}
        >
          <Sparkles className="h-5 w-5" style={{ color: theme.primary }} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm" style={{ color: theme.text }}>
            Enterprise Feature
          </p>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            Custom templates only apply to <strong style={{ color: theme.text }}>new clients</strong>. Existing clients keep their current configuration.
          </p>
        </div>
        {isInteractive && (
          <Link
            href="/blog/ai-receptionist-prompt-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium flex-shrink-0"
            style={{ color: theme.primary }}
          >
            <BookOpen className="h-4 w-4" />
            Prompt Guide
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Industry Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {industryList.map((ind) => {
          const IconComponent = ICON_MAP[ind.icon] || Building2;
          
          const cardStyle = { 
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
          };
          
          const cardContent = (
            <>
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ 
                    backgroundColor: ind.hasCustomTemplate ? theme.primary15 : theme.hover,
                  }}
                >
                  <IconComponent 
                    className="h-6 w-6" 
                    style={{ color: ind.hasCustomTemplate ? theme.primary : theme.textMuted }} 
                  />
                </div>

                {ind.hasCustomTemplate ? (
                  <span 
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                    style={{ backgroundColor: theme.primary15, color: theme.primary }}
                  >
                    <Check className="h-3 w-3" />
                    Custom
                  </span>
                ) : (
                  <span 
                    className="rounded-full px-2 py-1 text-xs font-medium"
                    style={{ backgroundColor: theme.hover, color: theme.textMuted }}
                  >
                    Default
                  </span>
                )}
              </div>

              <h3 className="font-medium mb-1" style={{ color: theme.text }}>
                {ind.label}
              </h3>
              <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
                {ind.description}
              </p>

              <div className="flex items-center justify-between">
                {ind.updatedAt && (
                  <span className="text-xs" style={{ color: theme.textMuted }}>
                    Updated {new Date(ind.updatedAt).toLocaleDateString()}
                  </span>
                )}
                <ChevronRight 
                  className="h-5 w-5 ml-auto transition-transform group-hover:translate-x-1" 
                  style={{ color: theme.textMuted }} 
                />
              </div>
            </>
          );
          
          return isInteractive ? (
            <Link
              key={ind.frontendKey}
              href={`/agency/templates/${ind.frontendKey}`}
              className="group rounded-xl p-5 transition-all"
              style={cardStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.card}
            >
              {cardContent}
            </Link>
          ) : (
            <div
              key={ind.frontendKey}
              className="group rounded-xl p-5 transition-all"
              style={cardStyle}
            >
              {cardContent}
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <div 
        className="mt-8 rounded-xl p-6"
        style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
      >
        <h3 className="font-medium mb-2" style={{ color: theme.text }}>
          Need help with prompts?
        </h3>
        <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
          Check out our guides for writing effective AI receptionist prompts:
        </p>
        <div className="flex flex-wrap gap-3">
          {PROMPT_GUIDES.map((guide) => (
            <Link
              key={guide.label}
              href={guide.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sm rounded-lg px-4 py-2 transition-all"
              style={{ 
                backgroundColor: theme.hover,
                border: `1px solid ${theme.border}`,
                color: theme.text,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.hover}
            >
              <guide.icon className="h-4 w-4" style={{ color: theme.primary }} />
              <span>{guide.label}</span>
              <ExternalLink 
                className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" 
                style={{ color: theme.textMuted }} 
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.primary }} />
      </div>
    );
  }

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

  return <PageContent industryList={industries} isInteractive={true} />;
}