'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Settings, LogOut, Loader2, BarChart3, Target, Send, Globe, Phone,
  Menu, X, ChevronRight, Gift, CreditCard, Lock, Cpu, Eye, Zap, Paintbrush, Clock, Headphones,
  Check, Crown, Shield,
  type LucideIcon
} from 'lucide-react';
import { AgencyProvider, useAgency } from './context';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { useTheme } from '../../hooks/useTheme';
import { PLAN_PRICES, PLAN_NAMES } from '../../lib/plan-limits';
import DynamicFavicon from '@/components/DynamicFavicon';

// Waveform icon component with color prop
function WaveformIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill={color || 'currentColor'} opacity="0.6" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill={color || 'currentColor'} opacity="0.8" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill={color || 'currentColor'} />
      <rect x="11" y="6" width="2" height="12" rx="1" fill={color || 'currentColor'} />
      <rect x="14" y="3" width="2" height="18" rx="1" fill={color || 'currentColor'} />
      <rect x="17" y="7" width="2" height="10" rx="1" fill={color || 'currentColor'} opacity="0.8" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill={color || 'currentColor'} opacity="0.6" />
    </svg>
  );
}

function isTrialStatus(status: string | null | undefined): boolean {
  return status === 'trial' || status === 'trialing';
}

function isPaymentFailed(status: string | null | undefined): boolean {
  return status === 'past_due' || status === 'unpaid' || status === 'canceled' || status === 'cancelled';
}

function isSuspended(status: string | null | undefined): boolean {
  return status === 'suspended' || status === 'canceled' || status === 'cancelled';
}

function needsPlanSelection(agency: any): boolean {
  if (!agency) return false;
  if (agency.subscription_status === 'pending' || agency.status === 'pending_payment') {
    if (isTrialStatus(agency.subscription_status) || agency.subscription_status === 'active') {
      return false;
    }
    return true;
  }
  return false;
}

function isTrialExpiredNoCard(agency: any): boolean {
  if (!agency) return false;
  if (agency.stripe_subscription_id) return false;
  if (!isTrialStatus(agency.subscription_status)) return false;
  if (!agency.trial_ends_at) return false;
  return new Date(agency.trial_ends_at) < new Date();
}

function getTrialDaysLeft(trialEndsAt: string | null | undefined): number | null {
  if (!trialEndsAt) return null;
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

const ALWAYS_ACCESSIBLE_ROUTES = [
  '/agency/settings',
  '/agency/login',
];

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  locked?: boolean;
  upgradeRequired?: string;
  permissionKey?: string;
}

const AGENCY_PLAN_TIERS = [
  {
    id: 'starter' as const,
    name: PLAN_NAMES.starter,
    price: PLAN_PRICES.starter,
    icon: Zap,
    description: 'For new agencies',
    clients: '25',
    features: [
      'Up to 25 clients',
      'White-label branding',
      'Agency dashboard',
      'Email support',
    ],
  },
  {
    id: 'professional' as const,
    name: PLAN_NAMES.professional,
    price: PLAN_PRICES.professional,
    icon: Shield,
    popular: true,
    description: 'Most popular',
    clients: '100',
    features: [
      'Up to 100 clients',
      'Full marketing website',
      'Demo phone number',
      'Custom domain',
      'Priority support',
      'API access',
    ],
  },
  {
    id: 'enterprise' as const,
    name: PLAN_NAMES.enterprise,
    price: PLAN_PRICES.enterprise,
    icon: Crown,
    description: 'For established agencies',
    clients: 'Unlimited',
    features: [
      'Unlimited clients',
      'Everything in Professional',
      'Dedicated success manager',
      'Phone support',
      'SLA guarantee',
      'Custom AI templates',
    ],
  },
];

function AgencyDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { agency, branding, loading, demoMode, toggleDemoMode, effectivePlan, hasPermission } = useAgency();
  const { canUseMarketingSite, planName } = usePlanFeatures();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const theme = useTheme();

  const primaryColor = branding.primaryColor || '#10b981';
  const secondaryColor = branding.secondaryColor || '#059669';
  const accentColor = branding.accentColor || '#34d399';

  const trialDaysLeft = getTrialDaysLeft(agency?.trial_ends_at);
  const isOnTrial = isTrialStatus(agency?.subscription_status);
  
  const hasPaymentIssue = isPaymentFailed(agency?.subscription_status);
  const agencyIsSuspended = isSuspended(agency?.status);

  const agencyNeedsPlan = needsPlanSelection(agency);
  const agencyTrialExpiredNoCard = isTrialExpiredNoCard(agency);
  
  const isAccessibleRoute = ALWAYS_ACCESSIBLE_ROUTES.some(route => pathname?.startsWith(route));
  const shouldBlockAccess = (hasPaymentIssue || agencyIsSuspended) && !isAccessibleRoute;

  const isEnterprise = effectivePlan === 'enterprise';

  const navItems: NavItem[] = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'dashboard' },
    { href: '/agency/clients', label: 'Clients', icon: Users, permissionKey: 'clients' },
    { href: '/agency/leads', label: 'Leads', icon: Target, permissionKey: 'leads' },
    { href: '/agency/outreach', label: 'Outreach', icon: Send, permissionKey: 'outreach' },
    { href: '/agency/analytics', label: 'Analytics', icon: BarChart3, permissionKey: 'analytics' },
    { 
      href: '/agency/marketing', 
      label: 'Marketing Website', 
      icon: Globe,
      locked: !canUseMarketingSite,
      upgradeRequired: 'Professional',
      permissionKey: 'marketing',
    },
    { 
      href: '/agency/demo-phone', 
      label: 'Demo Phone', 
      icon: Phone,
      locked: !isEnterprise && agency?.subscription_status !== 'active',
      upgradeRequired: 'Professional',
    },
    { 
      href: '/agency/templates', 
      label: 'AI Lab', 
      icon: Cpu,
      locked: !isEnterprise,
      upgradeRequired: 'Enterprise',
    },
    { href: '/agency/branding', label: 'Branding', icon: Paintbrush },
    { href: '/agency/referrals', label: 'Referrals', icon: Gift },
    { href: '/agency/settings', label: 'Settings', icon: Settings },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.permissionKey) return true;
    return hasPermission(item.permissionKey);
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen, isMobile]);

  useEffect(() => {
    if (!loading && shouldBlockAccess) {
      window.location.href = '/agency/settings';
    }
  }, [loading, shouldBlockAccess]);

  // ══════════════════════════════════════════════════════════════════════
  // FIX: Immediate body-bg from localStorage on mount
  // Prevents dark flash on light-mode refresh. Runs BEFORE agency data
  // loads (when theme.bg would still default to dark).
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voiceai_ui_theme');
      if (saved === 'light') {
        document.documentElement.style.setProperty('background', '#f9fafb', 'important');
        document.body.style.setProperty('background', '#f9fafb', 'important');
      }
    } catch {}
  }, []);

  // Once agency loads and theme.bg is authoritative, keep body in sync
  useEffect(() => {
    document.documentElement.style.setProperty('background', theme.bg, 'important');
    document.body.style.setProperty('background', theme.bg, 'important');
    return () => {
      document.documentElement.style.removeProperty('background');
      document.body.style.removeProperty('background');
    };
  }, [theme.bg]);

  useEffect(() => {
    if (!loading) {
      try { localStorage.setItem('voiceai_ui_theme', theme.isDark ? 'dark' : 'light'); } catch {}
    }
  }, [loading, theme.isDark]);

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('agency');
    localStorage.removeItem('user');
    localStorage.removeItem('voiceai_ui_theme');
    window.location.href = '/agency/login';
  };

  const isActive = (href: string) => {
    if (href === '/agency/dashboard') {
      return pathname === '/agency/dashboard' || pathname === '/agency';
    }
    if (href === '/agency/settings') {
      return pathname?.startsWith('/agency/settings');
    }
    if (href === '/agency/templates') {
      return pathname?.startsWith('/agency/templates');
    }
    return pathname?.startsWith(href);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isLocked?: boolean, upgradeRequired?: string) => {
    e.preventDefault();
    setSidebarOpen(false);
    
    if (isLocked) {
      window.location.href = href;
    } else {
      window.location.href = href;
    }
  };

  // ==========================================================================
  // Skeleton loading screen
  // ==========================================================================
  if (loading) {
    let isDark = true;
    try {
      const saved = localStorage.getItem('voiceai_ui_theme');
      if (saved === 'light') isDark = false;
      else if (saved === 'dark') isDark = true;
      else {
        const stored = localStorage.getItem('agency');
        if (stored) {
          const parsed = JSON.parse(stored);
          isDark = parsed.website_theme !== 'light';
        }
      }
    } catch {}

    const sk = isDark
      ? { bg: '#050505', sidebar: '#050505', card: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', pulse: 'rgba(255,255,255,0.06)', pulse2: 'rgba(255,255,255,0.03)' }
      : { bg: '#f9fafb', sidebar: '#ffffff', card: '#ffffff', border: '#e5e7eb', pulse: '#e5e7eb', pulse2: '#f3f4f6' };

    return (
      <div className="min-h-screen flex" style={{ backgroundColor: sk.bg, zoom: 0.8 }}>
        <link rel="manifest" href="/manifest.json" />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes skPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          .sk-p { animation: skPulse 1.8s ease-in-out infinite; }
          .sk-p2 { animation: skPulse 1.8s ease-in-out 0.3s infinite; }
          .sk-p3 { animation: skPulse 1.8s ease-in-out 0.6s infinite; }
        `}} />
        <div className="hidden md:flex flex-col w-64 flex-shrink-0" style={{ backgroundColor: sk.sidebar, borderRight: `1px solid ${sk.border}` }}>
          <div className="h-16 flex items-center gap-3 px-6" style={{ borderBottom: `1px solid ${sk.border}` }}>
            <div className="w-8 h-8 rounded-lg sk-p" style={{ backgroundColor: sk.pulse }} />
            <div className="h-4 w-24 rounded-md sk-p" style={{ backgroundColor: sk.pulse }} />
          </div>
          <div className="p-4 space-y-1.5">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${i <= 3 ? 'sk-p' : i <= 8 ? 'sk-p2' : 'sk-p3'}`}>
                <div className="w-5 h-5 rounded" style={{ backgroundColor: i === 1 ? sk.pulse : sk.pulse2 }} />
                <div className="h-3 rounded-md" style={{ backgroundColor: i === 1 ? sk.pulse : sk.pulse2, width: `${50 + (i % 5) * 14}px` }} />
              </div>
            ))}
          </div>
          <div className="mt-auto p-4 space-y-2">
            <div className="rounded-xl p-3 sk-p3" style={{ border: `1px solid ${sk.border}` }}>
              <div className="h-2.5 w-16 rounded mb-1.5" style={{ backgroundColor: sk.pulse2 }} />
              <div className="h-3.5 w-28 rounded" style={{ backgroundColor: sk.pulse }} />
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 sk-p3">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: sk.pulse2 }} />
              <div className="h-3 w-16 rounded" style={{ backgroundColor: sk.pulse2 }} />
            </div>
          </div>
        </div>
        <div className="flex-1 p-6 md:p-8">
          <div className="mb-8">
            <div className="h-7 w-52 rounded-lg sk-p mb-2" style={{ backgroundColor: sk.pulse }} />
            <div className="h-3.5 w-72 rounded-md sk-p2" style={{ backgroundColor: sk.pulse2 }} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className={`rounded-xl p-5 ${i <= 2 ? 'sk-p' : 'sk-p2'}`} style={{ backgroundColor: sk.card, border: `1px solid ${sk.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 w-16 rounded" style={{ backgroundColor: sk.pulse2 }} />
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: sk.pulse2 }} />
                </div>
                <div className="h-8 w-16 rounded-lg mb-1" style={{ backgroundColor: sk.pulse }} />
                <div className="h-2.5 w-20 rounded" style={{ backgroundColor: sk.pulse2 }} />
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl sk-p2" style={{ backgroundColor: sk.card, border: `1px solid ${sk.border}` }}>
              <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${sk.border}` }}>
                <div className="h-4 w-28 rounded" style={{ backgroundColor: sk.pulse }} />
                <div className="h-3 w-16 rounded" style={{ backgroundColor: sk.pulse2 }} />
              </div>
              <div className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: `1px solid ${sk.border}` }}>
                <div className="h-2.5 w-32 rounded" style={{ backgroundColor: sk.pulse2 }} />
                <div className="h-2.5 w-16 rounded ml-auto" style={{ backgroundColor: sk.pulse2 }} />
                <div className="h-2.5 w-16 rounded" style={{ backgroundColor: sk.pulse2 }} />
                <div className="h-2.5 w-20 rounded" style={{ backgroundColor: sk.pulse2 }} />
              </div>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: `1px solid ${sk.border}` }}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: sk.pulse2 }} />
                    <div>
                      <div className="h-3.5 rounded mb-1" style={{ backgroundColor: sk.pulse, width: `${80 + i * 15}px` }} />
                      <div className="h-2.5 w-20 rounded" style={{ backgroundColor: sk.pulse2 }} />
                    </div>
                  </div>
                  <div className="h-5 w-14 rounded-full" style={{ backgroundColor: sk.pulse2 }} />
                  <div className="h-3 w-10 rounded" style={{ backgroundColor: sk.pulse2 }} />
                  <div className="h-3 w-16 rounded" style={{ backgroundColor: sk.pulse2 }} />
                </div>
              ))}
            </div>
            <div className="rounded-xl sk-p3" style={{ backgroundColor: sk.card, border: `1px solid ${sk.border}` }}>
              <div className="p-5" style={{ borderBottom: `1px solid ${sk.border}` }}>
                <div className="h-4 w-24 rounded" style={{ backgroundColor: sk.pulse }} />
              </div>
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5" style={{ borderBottom: `1px solid ${sk.border}` }}>
                  <div className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: sk.pulse2 }} />
                  <div className="flex-1">
                    <div className="h-3 rounded mb-1.5" style={{ backgroundColor: sk.pulse, width: `${70 + i * 10}%` }} />
                    <div className="h-2.5 w-16 rounded" style={{ backgroundColor: sk.pulse2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // PLAN SELECTION GATE — UPDATED: Links to /onboarding instead of /signup/plan
  // ============================================================================
  if (agencyNeedsPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
        <link rel="manifest" href="/manifest.json" />
        <div className="max-w-lg w-full rounded-2xl p-8 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}`, boxShadow: theme.isDark ? 'none' : '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div className="mb-6">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.name} style={{ height: '48px', width: 'auto' }} className="object-contain mx-auto" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: theme.primary15 }}>
                <WaveformIcon className="h-8 w-8" color={theme.primary} />
              </div>
            )}
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${theme.primary}12` }}>
            <Zap className="h-7 w-7" style={{ color: theme.primary }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: theme.text }}>Finish Setting Up Your Agency</h1>
          <p className="mb-2 text-base" style={{ color: theme.textMuted }}>
            You&apos;re almost there! Complete your setup to start your <strong style={{ color: theme.text }}>14-day free trial</strong> and unlock your agency dashboard.
          </p>
          <p className="mb-8 text-sm" style={{ color: theme.textMuted }}>No credit card required. Cancel anytime.</p>
          <a href={`/onboarding?agency=${agency?.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-semibold transition-all hover:opacity-90" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
            <Zap className="h-5 w-5" />Continue Setup &amp; Start Free Trial
          </a>
          <button onClick={handleSignOut} className="block w-full mt-5 text-sm transition-colors hover:opacity-70" style={{ color: theme.textMuted }}>Sign out</button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // TRIAL EXPIRED GATE
  // ============================================================================
  if (agencyTrialExpiredNoCard) {
    const handleSelectPlan = async (planId: string) => {
      setSelectedPlan(planId);
      setSubscribeLoading(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${backendUrl}/api/agency/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ agency_id: agency?.id, plan: planId, skipTrial: true }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error('No URL returned from checkout:', data);
          setSubscribeLoading(false);
          setSelectedPlan(null);
        }
      } catch (err) {
        console.error('Failed to create checkout session:', err);
        setSubscribeLoading(false);
        setSelectedPlan(null);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
        <link rel="manifest" href="/manifest.json" />
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="mb-6">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.name} style={{ height: '48px', width: 'auto' }} className="object-contain mx-auto" />
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: theme.primary15 }}>
                  <WaveformIcon className="h-8 w-8" color={theme.primary} />
                </div>
              )}
            </div>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: theme.isDark ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.1)' }}>
              <Clock className="h-7 w-7" style={{ color: '#fbbf24' }} />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: theme.text }}>Your Free Trial Has Ended</h1>
            <p className="mb-2 text-base max-w-lg mx-auto" style={{ color: theme.textMuted }}>Choose a plan to keep your agency, clients, and AI receptionists active.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {AGENCY_PLAN_TIERS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isLoading = subscribeLoading && isSelected;
              return (
                <div key={plan.id} className="relative rounded-2xl border p-5 sm:p-6 transition-all duration-200" style={{ backgroundColor: theme.card, borderColor: plan.popular ? (theme.isDark ? `${theme.primary}50` : theme.primary) : theme.border, boxShadow: plan.popular ? (theme.isDark ? `0 0 40px ${theme.primary}10` : '0 8px 30px rgba(0,0,0,0.08)') : 'none', transform: plan.popular ? 'scale(1.02)' : undefined }}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: theme.primary, color: theme.primaryText, boxShadow: `0 0 16px ${theme.primary}40` }}>Recommended</span>
                    </div>
                  )}
                  <div className="text-center mb-5">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: plan.popular ? `${theme.primary}20` : (theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') }}>
                      <plan.icon className="h-5 w-5" style={{ color: plan.popular ? theme.primary : theme.text }} />
                    </div>
                    <p className="text-xs mb-1" style={{ color: theme.textMuted }}>{plan.description}</p>
                    <h3 className="text-lg font-semibold" style={{ color: theme.text }}>{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold" style={{ color: theme.text }}>${plan.price}</span>
                      <span className="text-sm" style={{ color: theme.textMuted }}>/mo</span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>{plan.clients} clients</p>
                  </div>
                  <ul className="space-y-2.5 mb-5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full mt-0.5" style={{ backgroundColor: `${theme.primary}15` }}>
                          <Check className="h-3 w-3" style={{ color: theme.primary }} />
                        </div>
                        <span style={{ color: theme.textMuted }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleSelectPlan(plan.id)} disabled={subscribeLoading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={plan.popular ? { backgroundColor: theme.primary, color: theme.primaryText } : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: theme.text, border: `1px solid ${theme.border}` }}>
                    {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Redirecting...</>) : (<><CreditCard className="h-4 w-4" />Subscribe — ${plan.price}/mo</>)}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <p className="text-sm mb-4" style={{ color: theme.textMuted }}>All plans include a 14-day money-back guarantee. Cancel anytime.</p>
            <button onClick={handleSignOut} className="text-sm transition-colors hover:opacity-70" style={{ color: theme.textMuted }}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  // Show blocking screen while redirecting
  if (shouldBlockAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: theme.bg }}>
        <link rel="manifest" href="/manifest.json" />
        <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ backgroundColor: theme.card, border: `1px solid ${theme.isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'}` }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: theme.errorBg }}>
            <CreditCard className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: theme.text }}>Payment Required</h1>
          <p className="mb-6" style={{ color: theme.textMuted }}>
            {agencyIsSuspended 
              ? 'Your agency has been suspended. Please update your payment method to restore access.'
              : 'Your payment has failed. Please update your payment method to continue using your agency.'
            }
          </p>
          <a href="/agency/settings" className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium text-white transition-colors" style={{ backgroundColor: '#ef4444' }}>
            <CreditCard className="h-5 w-5" />Update Payment Method
          </a>
          <button onClick={handleSignOut} className="block w-full mt-4 text-sm transition-colors" style={{ color: theme.textMuted }}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        zoom: 0.8,
        '--color-primary': primaryColor,
        '--color-secondary': secondaryColor,
        '--color-accent': accentColor,
      } as React.CSSProperties}
    >
      <link rel="manifest" href="/manifest.json" />
      <DynamicFavicon logoUrl={branding.logoUrl} primaryColor={primaryColor} />
      <style dangerouslySetInnerHTML={{ __html: `::selection { background: ${theme.primary}40; } ::-moz-selection { background: ${theme.primary}40; }` }} />
      {theme.isDark && (
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Payment Failed Banner */}
      {hasPaymentIssue && isAccessibleRoute && (
        <div className="sticky z-40 px-4 py-3 flex items-center justify-between gap-3" style={{ top: 0, backgroundColor: theme.errorBg, borderBottom: `1px solid ${theme.errorBorder}` }}>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 flex-shrink-0" style={{ color: theme.error }} />
            <div>
              <p className="font-medium text-sm" style={{ color: theme.errorText }}>Payment failed</p>
              <p className="text-xs" style={{ color: theme.errorText, opacity: 0.7 }}>Please update your payment method to continue using your agency.</p>
            </div>
          </div>
          {!pathname?.startsWith('/agency/settings') && (
            <a href="/agency/settings" className="rounded-full px-4 py-2 text-sm font-medium transition-colors flex-shrink-0" style={{ backgroundColor: '#ef4444', color: '#ffffff' }}>Update Payment</a>
          )}
        </div>
      )}

      {/* Mobile Header */}
      <div className="sticky z-30 md:hidden" style={{ backgroundColor: theme.sidebarBg, paddingTop: 'env(safe-area-inset-top)', top: hasPaymentIssue && isAccessibleRoute ? '60px' : 0 }}>
        <header className="flex items-center justify-between h-16 px-4" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.name} style={{ height: '40px', width: 'auto' }} className="object-contain flex-shrink-0" />
            ) : (
              <div className="flex items-center justify-center rounded-xl" style={{ height: '40px', width: '40px', backgroundColor: theme.primary15, border: `1px solid ${theme.sidebarBorder}` }}>
                <WaveformIcon className="h-6 w-6" color={theme.primary} />
              </div>
            )}
            <span className="font-semibold text-lg truncate max-w-[180px]" style={{ color: theme.sidebarText }}>{agency?.name || 'Agency'}</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors" style={{ color: theme.sidebarText }}>
            <Menu className="h-7 w-7" />
          </button>
        </header>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 transform transition-transform duration-300 ease-out ${isMobile ? `${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` : 'translate-x-0'}`}
        style={{ backgroundColor: theme.sidebarBg, borderRight: `1px solid ${theme.sidebarBorder}`, paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0, top: !isMobile ? (hasPaymentIssue && isAccessibleRoute ? '60px' : 0) : 0 }}
      >
        {/* Mobile Header in Sidebar */}
        <div className="flex md:hidden items-center justify-between h-16 px-4" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          <span className="font-semibold text-lg" style={{ color: theme.sidebarText }}>Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors" style={{ color: theme.sidebarText }}>
            <X className="h-7 w-7" />
          </button>
        </div>

        {/* Desktop Logo & Agency Name */}
        <div className="hidden md:flex h-16 items-center gap-3 px-6" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} style={{ height: '32px', width: 'auto' }} className="object-contain flex-shrink-0" />
          ) : (
            <div className="flex items-center justify-center rounded-lg" style={{ height: '32px', width: '32px', backgroundColor: theme.primary15, border: `1px solid ${theme.sidebarBorder}` }}>
              <WaveformIcon className="h-5 w-5" color={theme.primary} />
            </div>
          )}
          <span className="font-semibold truncate" style={{ color: theme.sidebarText }}>{agency?.name || 'Agency'}</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const active = isActive(item.href);
            const isLocked = item.locked === true;
            const IconComponent = item.icon;
            
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, isLocked, item.upgradeRequired)}
                className="flex items-center justify-between rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-all"
                style={
                  isLocked 
                    ? { color: theme.sidebarTextMuted, opacity: 0.6, cursor: 'pointer' }
                    : active 
                      ? { backgroundColor: theme.sidebarActiveItemBg, color: theme.sidebarActiveItemColor }
                      : { color: theme.sidebarText }
                }
                onMouseEnter={(e) => {
                  if (!isLocked && !active) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = theme.sidebarHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLocked && !active) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }
                }}
                title={isLocked ? `Upgrade to ${item.upgradeRequired} to unlock` : undefined}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5" />
                  <span>{item.label}</span>
                  {isLocked && <Lock className="h-3.5 w-3.5 ml-1" />}
                </div>
                {active && !isLocked && <ChevronRight className="h-4 w-4 md:hidden" />}
                {isLocked && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: theme.sidebarHover, color: theme.sidebarTextMuted }}>
                    {item.upgradeRequired === 'Enterprise' ? 'Ent' : 'Pro'}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3" style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 1rem)' : '1rem' }}>
          {/* Demo Mode Toggle */}
          <button onClick={toggleDemoMode} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all" style={demoMode ? { backgroundColor: theme.sidebarActiveItemBg, border: `1px solid ${theme.primary30}` } : { backgroundColor: theme.sidebarHover, border: `1px solid ${theme.sidebarBorder}` }}
            onMouseEnter={(e) => { if (!demoMode) { (e.currentTarget as HTMLElement).style.backgroundColor = theme.sidebarHover; } }}
            onMouseLeave={(e) => { if (!demoMode) { (e.currentTarget as HTMLElement).style.backgroundColor = theme.sidebarHover; } }}
          >
            <div className="flex items-center gap-3">
              <Eye className="h-4 w-4" style={{ color: demoMode ? theme.primary : theme.sidebarTextMuted }} />
              <span style={{ color: demoMode ? theme.primary : theme.sidebarTextMuted }}>Demo Mode</span>
            </div>
            <div className="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200" style={{ backgroundColor: demoMode ? theme.primary : (theme.isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db') }}>
              <span className="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200" style={{ transform: demoMode ? 'translate(16px, 3px)' : 'translate(3px, 3px)' }} />
            </div>
          </button>

          {/* Trial Badge */}
          {isOnTrial && trialDaysLeft !== null && (
            <div className="rounded-xl p-3" style={{ backgroundColor: theme.infoBg, border: `1px solid ${theme.infoBorder}` }}>
              <p className="text-xs" style={{ color: theme.infoText, opacity: 0.8 }}>Trial Period</p>
              <p className="text-sm font-medium" style={{ color: theme.infoText }}>{trialDaysLeft} days remaining</p>
              <p className="text-xs mt-1" style={{ color: theme.infoText, opacity: 0.6 }}>
                {agency?.stripe_subscription_id ? 'Your card will be charged automatically' : 'Subscribe before your trial ends to keep access'}
              </p>
            </div>
          )}

          {/* Payment Issue Badge */}
          {hasPaymentIssue && (
            <a href="/agency/settings" className="block rounded-xl p-3 transition-opacity hover:opacity-90" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
              <p className="text-xs" style={{ color: theme.errorText, opacity: 0.8 }}>Payment Issue</p>
              <p className="text-sm font-medium" style={{ color: theme.errorText }}>Update payment method</p>
            </a>
          )}

          {/* Plan Badge */}
          {agency?.subscription_status === 'active' && (
            <div className="rounded-xl p-3" style={{ backgroundColor: theme.primary10, border: `1px solid ${theme.primary30}` }}>
              <p className="text-xs" style={{ color: theme.primary, opacity: 0.6 }}>Current Plan</p>
              <p className="text-sm font-medium capitalize" style={{ color: theme.primary }}>{planName || agency?.plan_type || 'Starter'}</p>
            </div>
          )}
          
          {/* Sign Out */}
          <button onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-all pt-4"
            style={{ color: theme.sidebarTextMuted, borderTop: `1px solid ${theme.sidebarBorder}` }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.sidebarHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function AgencyLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/agency/login') {
    return <>{children}</>;
  }

  return (
    <AgencyProvider>
      <AgencyDashboardLayout>{children}</AgencyDashboardLayout>
    </AgencyProvider>
  );
}