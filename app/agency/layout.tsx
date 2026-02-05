'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Settings, LogOut, Loader2, BarChart3, Target, Send, Globe,
  Menu, X, ChevronRight, Gift, CreditCard, Lock, Cpu,
  type LucideIcon
} from 'lucide-react';
import { AgencyProvider, useAgency } from './context';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';

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

// Helper to check if subscription is in trial state (handles both 'trial' and 'trialing')
function isTrialStatus(status: string | null | undefined): boolean {
  return status === 'trial' || status === 'trialing';
}

// Helper to check if payment has failed (these statuses require action)
function isPaymentFailed(status: string | null | undefined): boolean {
  return status === 'past_due' || status === 'unpaid' || status === 'canceled' || status === 'cancelled';
}

// Helper to check if agency is suspended and should be blocked
function isSuspended(status: string | null | undefined): boolean {
  return status === 'suspended' || status === 'canceled' || status === 'cancelled';
}

// Calculate trial days remaining
function getTrialDaysLeft(trialEndsAt: string | null | undefined): number | null {
  if (!trialEndsAt) return null;
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Routes that are always accessible (even when payment failed)
const ALWAYS_ACCESSIBLE_ROUTES = [
  '/agency/settings',
  '/agency/login',
];

// Nav item type with optional locked state
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  locked?: boolean;
  upgradeRequired?: string;
}

function AgencyDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { agency, branding, loading } = useAgency();
  const { canUseMarketingSite, planName } = usePlanFeatures();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Theme - default to dark unless explicitly light
  const isDark = agency?.website_theme !== 'light';

  // Agency colors with fallbacks
  const primaryColor = branding.primaryColor || '#10b981';
  const secondaryColor = branding.secondaryColor || '#059669';
  const accentColor = branding.accentColor || '#34d399';

  // Theme-based colors
  const bgColor = isDark ? '#050505' : '#f9fafb';
  const textColor = isDark ? '#fafaf9' : '#111827';
  const mutedTextColor = isDark ? 'rgba(250,250,249,0.5)' : '#6b7280';
  const sidebarBg = isDark ? '#050505' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';

  // Calculate trial status
  const trialDaysLeft = getTrialDaysLeft(agency?.trial_ends_at);
  const isOnTrial = isTrialStatus(agency?.subscription_status);
  
  // Check for payment/subscription issues
  const hasPaymentIssue = isPaymentFailed(agency?.subscription_status);
  const agencyIsSuspended = isSuspended(agency?.status);
  
  // Determine if current route should be blocked
  const isAccessibleRoute = ALWAYS_ACCESSIBLE_ROUTES.some(route => pathname?.startsWith(route));
  const shouldBlockAccess = (hasPaymentIssue || agencyIsSuspended) && !isAccessibleRoute;

  // Check if agency is on enterprise plan (for AI Templates)
  const isEnterprise = agency?.plan_type === 'enterprise';

  // Build nav items with feature gating
  // Order: Dashboard, Clients, Leads, Outreach, Analytics, Marketing Website, AI Templates, Referrals, Settings
  const navItems: NavItem[] = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/agency/clients', label: 'Clients', icon: Users },
    { href: '/agency/leads', label: 'Leads', icon: Target },
    { href: '/agency/outreach', label: 'Outreach', icon: Send },
    { href: '/agency/analytics', label: 'Analytics', icon: BarChart3 },
    { 
      href: '/agency/marketing', 
      label: 'Marketing Website', 
      icon: Globe,
      locked: !canUseMarketingSite,
      upgradeRequired: 'Professional',
    },
    { 
      href: '/agency/templates', 
      label: 'AI Templates', 
      icon: Cpu,
      locked: !isEnterprise,
      upgradeRequired: 'Enterprise',
    },
    { href: '/agency/referrals', label: 'Referrals', icon: Gift },
    { href: '/agency/settings', label: 'Settings', icon: Settings },
  ];

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen, isMobile]);

  // Redirect to billing if blocked
  useEffect(() => {
    if (!loading && shouldBlockAccess) {
      window.location.href = '/agency/settings';
    }
  }, [loading, shouldBlockAccess]);

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('agency');
    localStorage.removeItem('user');
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

  // Handle navigation - use window.location for proper middleware handling
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isLocked?: boolean, upgradeRequired?: string) => {
    e.preventDefault();
    setSidebarOpen(false);
    
    if (isLocked) {
      // For locked features, still navigate to the page - it will show the locked state
      window.location.href = href;
    } else {
      window.location.href = href;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <p className="text-sm text-neutral-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show blocking screen while redirecting
  if (shouldBlockAccess) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: bgColor }}
      >
        <div 
          className="max-w-md w-full rounded-2xl p-8 text-center"
          style={{ 
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'}`,
          }}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}
          >
            <CreditCard className="h-8 w-8 text-red-500" />
          </div>
          <h1 
            className="text-2xl font-bold mb-3"
            style={{ color: textColor }}
          >
            Payment Required
          </h1>
          <p 
            className="mb-6"
            style={{ color: mutedTextColor }}
          >
            {agencyIsSuspended 
              ? 'Your agency has been suspended. Please update your payment method to restore access.'
              : 'Your payment has failed. Please update your payment method to continue using your agency.'
            }
          </p>
          <a
            href="/agency/settings"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium text-white transition-colors"
            style={{ backgroundColor: '#ef4444' }}
          >
            <CreditCard className="h-5 w-5" />
            Update Payment Method
          </a>
          <button
            onClick={handleSignOut}
            className="block w-full mt-4 text-sm transition-colors"
            style={{ color: mutedTextColor }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        '--color-primary': primaryColor,
        '--color-secondary': secondaryColor,
        '--color-accent': accentColor,
      } as React.CSSProperties}
    >
      {/* Grain overlay - dark mode only */}
      {isDark && (
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Payment Failed Banner - Only shows if payment failed (not for trial) */}
      {hasPaymentIssue && isAccessibleRoute && (
        <div 
          className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between gap-3"
          style={{
            backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
            borderBottom: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm" style={{ color: isDark ? '#fca5a5' : '#991b1b' }}>
                Payment failed
              </p>
              <p className="text-xs" style={{ color: isDark ? 'rgba(252,165,165,0.7)' : '#b91c1c' }}>
                Please update your payment method to continue using your agency.
              </p>
            </div>
          </div>
          {!pathname?.startsWith('/agency/settings') && (
            <a 
              href="/agency/settings"
              className="rounded-full px-4 py-2 text-sm font-medium transition-colors flex-shrink-0"
              style={{ 
                backgroundColor: '#ef4444',
                color: '#ffffff',
              }}
            >
              Update Payment
            </a>
          )}
        </div>
      )}

      {/* Mobile Header */}
      <div 
        className="sticky top-0 z-30 md:hidden"
        style={{ 
          backgroundColor: sidebarBg, 
          paddingTop: 'env(safe-area-inset-top)',
          top: hasPaymentIssue && isAccessibleRoute ? '60px' : 0,
        }}
      >
        <header 
          className="flex items-center justify-between h-16 px-4"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.name}
                style={{ height: '40px', width: 'auto' }}
                className="object-contain flex-shrink-0"
              />
            ) : (
              <div 
                className="flex items-center justify-center rounded-xl" 
                style={{ 
                  height: '40px', 
                  width: '40px', 
                  backgroundColor: `${primaryColor}15`,
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${primaryColor}20`,
                }}
              >
                <WaveformIcon className="h-6 w-6" color={primaryColor} />
              </div>
            )}
            <span className="font-semibold text-lg truncate max-w-[180px]">
              {agency?.name || 'Agency'}
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors"
          >
            <Menu className="h-7 w-7" />
          </button>
        </header>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 md:w-64
          transform transition-transform duration-300 ease-out
          ${isMobile 
            ? `${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'translate-x-0'
          }
        `}
        style={{ 
          backgroundColor: sidebarBg, 
          borderRight: `1px solid ${borderColor}`,
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0,
          top: hasPaymentIssue && isAccessibleRoute && !isMobile ? '60px' : 0,
        }}
      >
        {/* Mobile Header in Sidebar */}
        <div 
          className="flex md:hidden items-center justify-between h-16 px-4"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <span className="font-semibold text-lg">Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        {/* Desktop Logo & Agency Name */}
        <div 
          className="hidden md:flex h-16 items-center gap-3 px-6"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.name}
              style={{ height: '32px', width: 'auto' }}
              className="object-contain flex-shrink-0"
            />
          ) : (
            <div 
              className="flex items-center justify-center rounded-lg" 
              style={{ 
                height: '32px', 
                width: '32px', 
                backgroundColor: `${primaryColor}15`,
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${primaryColor}20`,
              }}
            >
              <WaveformIcon className="h-5 w-5" color={primaryColor} />
            </div>
          )}
          <span className="font-semibold truncate">
            {agency?.name || 'Agency'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const isLocked = item.locked === true;
            const IconComponent = item.icon;
            
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, isLocked, item.upgradeRequired)}
                className={`flex items-center justify-between rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-all ${
                  isLocked 
                    ? 'cursor-pointer' 
                    : !active 
                      ? (isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]') 
                      : ''
                }`}
                style={
                  isLocked 
                    ? { color: mutedTextColor, opacity: 0.6 }
                    : active 
                      ? { backgroundColor: `${primaryColor}15`, color: primaryColor }
                      : { color: mutedTextColor }
                }
                title={isLocked ? `Upgrade to ${item.upgradeRequired} to unlock` : undefined}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5" />
                  <span>{item.label}</span>
                  {isLocked && (
                    <Lock className="h-3.5 w-3.5 ml-1" />
                  )}
                </div>
                {active && !isLocked && <ChevronRight className="h-4 w-4 md:hidden" />}
                {isLocked && (
                  <span 
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      color: mutedTextColor,
                    }}
                  >
                    {item.upgradeRequired === 'Enterprise' ? 'Ent' : 'Pro'}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-4 space-y-3"
          style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 1rem)' : '1rem' }}
        >
          {/* Trial Badge - Informational only (Stripe auto-charges when trial ends) */}
          {isOnTrial && trialDaysLeft !== null && (
            <div 
              className="rounded-xl p-3"
              style={{
                backgroundColor: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              <p className="text-xs" style={{ color: isDark ? 'rgba(147,197,253,0.8)' : '#1e40af' }}>
                Trial Period
              </p>
              <p className="text-sm font-medium" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                {trialDaysLeft} days remaining
              </p>
              <p className="text-xs mt-1" style={{ color: isDark ? 'rgba(147,197,253,0.6)' : '#3b82f6' }}>
                Your card will be charged automatically
              </p>
            </div>
          )}

          {/* Payment Issue Badge */}
          {hasPaymentIssue && (
            <a
              href="/agency/settings"
              className="block rounded-xl p-3 transition-opacity hover:opacity-90"
              style={{
                backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <p className="text-xs" style={{ color: isDark ? 'rgba(252,165,165,0.8)' : '#991b1b' }}>Payment Issue</p>
              <p className="text-sm font-medium" style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>
                Update payment method
              </p>
            </a>
          )}

          {/* Plan Badge - Show for active subscriptions */}
          {agency?.subscription_status === 'active' && (
            <div 
              className="rounded-xl p-3"
              style={{
                backgroundColor: `${primaryColor}10`,
                border: `1px solid ${primaryColor}30`,
              }}
            >
              <p className="text-xs" style={{ color: `${primaryColor}99` }}>Current Plan</p>
              <p className="text-sm font-medium capitalize" style={{ color: primaryColor }}>
                {planName || agency?.plan_type || 'Starter'}
              </p>
            </div>
          )}
          
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-all pt-4 ${
              isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.02]'
            }`}
            style={{ 
              color: mutedTextColor,
              borderTop: `1px solid ${borderColor}`,
            }}
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