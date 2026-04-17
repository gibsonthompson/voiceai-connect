'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Phone, TrendingUp, PhoneCall, Users, Bot, Settings, LogOut, Loader2,
  Menu, X, ChevronRight, Clock, CreditCard
} from 'lucide-react';
import { ClientProvider, useClient } from '@/lib/client-context';
import { useClientTheme } from '@/hooks/useClientTheme';
import AddToHomeScreenModal from '@/components/client/AddToHomeScreenModal';

function setFavicon(url: string) {
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => link.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = url;
  document.head.appendChild(link);
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = url;
  document.head.appendChild(appleLink);
}

function setManifestLink(clientId: string | null) {
  const existing = document.querySelectorAll('link[rel="manifest"]');
  existing.forEach(el => el.remove());
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = clientId ? `/api/client-manifest?clientId=${clientId}` : '/api/client-manifest';
  document.head.appendChild(link);
}

const AUTH_PAGES = ['/client/login', '/client/signup', '/client/set-password', '/client/upgrade'];
const ALWAYS_ACCESSIBLE_ROUTES = ['/client/settings', '/client/upgrade-required', '/client/upgrade'];

function isTrialStatus(status: string | null | undefined): boolean {
  return status === 'trial' || status === 'trialing';
}
function isTrialActive(client: any): boolean {
  if (!client) return false;
  if (!isTrialStatus(client.subscription_status)) return false;
  if (!client.trial_ends_at) return false;
  return new Date(client.trial_ends_at) > new Date();
}
function isPaymentFailed(status: string | null | undefined): boolean {
  return status === 'past_due' || status === 'unpaid';
}
function isCanceled(status: string | null | undefined): boolean {
  return status === 'canceled' || status === 'cancelled';
}
function isTrialExpired(client: any): boolean {
  if (!client) return false;
  if (!isTrialStatus(client.subscription_status)) return false;
  if (!client.trial_ends_at) return false;
  return new Date(client.trial_ends_at) < new Date();
}
function getTrialDaysLeft(trialEndsAt: string | null | undefined): number | null {
  if (!trialEndsAt) return null;
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
function getInitial(name: string | null | undefined): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  permissionKey?: string;
}

function ClientDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { client, branding, loading, hasPermission } = useClient();
  const theme = useClientTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const nav = {
    bg: theme.navBg,
    text: theme.navText,
    textMuted: theme.navTextMuted,
    border: theme.navBorder,
    activeItemBg: theme.navActiveItemBg,
    activeItemColor: theme.navActiveColor,
    hoverBg: theme.navHover,
    poweredByBg: theme.isNavDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
  };

  const clientTrialExpired = isTrialExpired(client);
  const clientPaymentFailed = isPaymentFailed(client?.subscription_status);
  const clientCanceled = isCanceled(client?.subscription_status);
  const clientOnTrial = isTrialActive(client);
  const trialDaysLeft = getTrialDaysLeft(client?.trial_ends_at);
  const isAccessibleRoute = ALWAYS_ACCESSIBLE_ROUTES.some(route => pathname?.startsWith(route));

  // displayName: used for meta tags and PWA modal — NOT rendered in sidebar header
  const displayName = branding.clientHeaderMode === 'business_name'
    ? (branding.businessName || branding.agencyName || 'Dashboard')
    : (branding.agencyName || 'Dashboard');
  const displayLogo = branding.logoUrl;

  // ============================================================================
  // DEVICE DETECTION
  // ============================================================================
  useEffect(() => {
    const checkDevice = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (sidebarOpen && (isMobile || isTablet)) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen, isMobile, isTablet]);

  // ============================================================================
  // FAVICON + MANIFEST + META
  // ============================================================================
  useEffect(() => {
    if (displayLogo) setFavicon(displayLogo);
  }, [displayLogo]);

  // Dynamic PWA manifest with clientId so PWA install shows client's business name
  useEffect(() => {
    if (client?.id) setManifestLink(client.id);
  }, [client?.id]);

  useEffect(() => {
    document.documentElement.style.background = nav.bg;
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) metaThemeColor.setAttribute('content', nav.bg);
    return () => {
      // FIXED: default cleanup was dark (#050505), now light to match loading screen
      document.documentElement.style.background = '#f9fafb';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#f9fafb');
    };
  }, [nav.bg]);

  useEffect(() => {
    if (displayName) {
      let metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (metaTitle) { metaTitle.setAttribute('content', displayName); }
      else {
        metaTitle = document.createElement('meta');
        metaTitle.setAttribute('name', 'apple-mobile-web-app-title');
        metaTitle.setAttribute('content', displayName);
        document.head.appendChild(metaTitle);
      }
    }
  }, [displayName]);

  // ============================================================================
  // REDIRECTS
  // ============================================================================
  useEffect(() => {
    if (!loading && clientTrialExpired && !isAccessibleRoute) {
      window.location.href = '/client/upgrade-required?expired=true';
    }
  }, [loading, clientTrialExpired, isAccessibleRoute]);

  useEffect(() => {
    if (!loading && clientCanceled && !isAccessibleRoute) {
      window.location.href = '/client/upgrade-required?canceled=true';
    }
  }, [loading, clientCanceled, isAccessibleRoute]);

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('client');
    localStorage.removeItem('user');
    localStorage.removeItem('voiceai_ui_theme');
    window.location.href = '/client/login';
  };

  // ============================================================================
  // NAV ITEMS
  // ============================================================================
  const navItems: NavItem[] = [
    { href: '/client/dashboard', label: 'Dashboard', icon: TrendingUp, permissionKey: 'dashboard' },
    { href: '/client/calls', label: 'Calls', icon: PhoneCall, permissionKey: 'calls' },
    { href: '/client/contacts', label: 'Contacts', icon: Users, permissionKey: 'contacts' },
    { href: '/client/ai-agent', label: 'AI Agent', icon: Bot, permissionKey: 'ai_agent' },
    { href: '/client/settings', label: 'Settings', icon: Settings },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.permissionKey) return true;
    return hasPermission(item.permissionKey);
  });

  const isActive = (href: string) => {
    if (href === '/client/dashboard') return pathname === '/client/dashboard' || pathname === '/client';
    return pathname?.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    setSidebarOpen(false);
    window.location.href = href;
  };

  // Save theme to localStorage for skeleton
  useEffect(() => {
    if (!loading && theme) {
      try { localStorage.setItem('voiceai_ui_theme', theme.isDark ? 'dark' : 'light'); } catch {}
    }
  }, [loading, theme.isDark]);

  // ============================================================================
  // LOGO BADGE — Reusable logo display with initial fallback
  // ============================================================================
  const LogoBadge = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
    // Logo sizes: lg = desktop sidebar header, md = mobile header, sm = compact
    const logoStyle = size === 'lg'
      ? { maxHeight: '80px', maxWidth: '180px' }
      : size === 'md'
      ? { maxHeight: '36px', maxWidth: '140px' }
      : { maxHeight: '28px', maxWidth: '100px' };
    const initialSize = size === 'lg' ? { box: 56, font: 22 } : size === 'md' ? { box: 40, font: 16 } : { box: 32, font: 14 };
    const radius = size === 'lg' ? '16px' : '12px';

    if (displayLogo) {
      return (
        <img
          src={displayLogo}
          alt=""
          className="object-contain flex-shrink-0"
          style={{ ...logoStyle, width: 'auto', height: 'auto' }}
        />
      );
    }

    const initial = getInitial(branding.businessName || branding.agencyName);
    return (
      <div
        className="flex items-center justify-center flex-shrink-0 font-bold"
        style={{
          height: `${initialSize.box}px`,
          width: `${initialSize.box}px`,
          borderRadius: radius,
          backgroundColor: theme.isNavDark ? 'rgba(255,255,255,0.08)' : `${theme.primary}12`,
          color: theme.isNavDark ? '#ffffff' : theme.primary,
          fontSize: `${initialSize.font}px`,
        }}
      >
        {initial}
      </div>
    );
  };

  // ============================================================================
  // FIRST LOAD ONLY — neutral light spinner, no branding
  // FIXED: was dark navy (#0C1120) with white spinner → now light gray with subtle spinner
  // ============================================================================
  if (loading && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes ldSpin{to{transform:rotate(360deg)}}.ld-s{width:24px;height:24px;border-radius:50%;border:2.5px solid rgba(0,0,0,0.08);border-top-color:rgba(0,0,0,0.3);animation:ldSpin .7s linear infinite}` }} />
        <div className="ld-s" />
      </div>
    );
  }

  // ============================================================================
  // REDIRECT STATES
  // ============================================================================
  if ((clientTrialExpired || clientCanceled) && !isAccessibleRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: theme.primary }} />
          <p className="mt-4 text-sm" style={{ color: theme.textMuted }}>Redirecting...</p>
        </div>
      </div>
    );
  }

  const hasBanner = clientPaymentFailed || (clientOnTrial && trialDaysLeft !== null && trialDaysLeft <= 3 && !clientPaymentFailed);

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: `::selection { background: ${theme.primary}40; } ::-moz-selection { background: ${theme.primary}40; }` }} />

      {/* Payment Failed Banner */}
      {clientPaymentFailed && (
        <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between gap-3"
          style={{ backgroundColor: theme.isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderBottom: `1px solid ${theme.isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}` }}>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 flex-shrink-0" style={{ color: '#ef4444' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: theme.isDark ? '#fca5a5' : '#dc2626' }}>Payment failed</p>
              <p className="text-xs hidden sm:block" style={{ color: theme.isDark ? 'rgba(252,165,165,0.7)' : '#b91c1c' }}>Please update your payment method.</p>
            </div>
          </div>
          <a href="/client/settings" className="rounded-full px-4 py-2 text-sm font-medium flex-shrink-0" style={{ backgroundColor: '#ef4444', color: '#ffffff' }}>Fix Payment</a>
        </div>
      )}

      {/* Trial Ending Soon Banner */}
      {clientOnTrial && trialDaysLeft !== null && trialDaysLeft <= 3 && !clientPaymentFailed && (
        <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between gap-3"
          style={{ backgroundColor: theme.isDark ? 'rgba(251,191,36,0.08)' : '#fffbeb', borderBottom: `1px solid ${theme.isDark ? 'rgba(251,191,36,0.2)' : '#fde68a'}` }}>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
            <p className="text-sm" style={{ color: theme.isDark ? '#fbbf24' : '#92400e' }}>
              Trial ends in <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}</strong>
            </p>
          </div>
          <a href="/client/upgrade-required" className="rounded-full px-4 py-2 text-sm font-medium flex-shrink-0" style={{ backgroundColor: '#f59e0b', color: '#1c1917' }}>View Plans</a>
        </div>
      )}

      {/* ================================================================
          MOBILE / TABLET HEADER — Logo only, centered
          ================================================================ */}
      <div className="sticky z-30 lg:hidden"
        style={{ backgroundColor: nav.bg, paddingTop: 'env(safe-area-inset-top)', top: hasBanner ? '52px' : 0 }}>
        <header className="flex items-center justify-between h-14 sm:h-16 px-4"
          style={{ borderBottom: `1px solid ${nav.border}` }}>
          <LogoBadge size="md" />
          <button onClick={() => setSidebarOpen(true)} className="flex items-center justify-center w-10 h-10 -mr-1 rounded-xl" style={{ color: nav.text }}>
            <Menu className="h-6 w-6" />
          </button>
        </header>
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      {sidebarOpen && (isMobile || isTablet) && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ================================================================
          SIDEBAR
          ================================================================ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 transform transition-transform duration-300 ease-out ${
          (isMobile || isTablet) ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
        }`}
        style={{
          backgroundColor: nav.bg,
          borderRight: `1px solid ${nav.border}`,
          paddingTop: (isMobile || isTablet) ? 'env(safe-area-inset-top)' : 0,
          top: (!isMobile && !isTablet) ? (hasBanner ? '52px' : '0') : '0',
        }}>

        {/* Mobile/Tablet drawer close */}
        <div className="flex lg:hidden items-center justify-between h-14 px-4 border-b" style={{ borderColor: nav.border }}>
          <span className="font-semibold text-base" style={{ color: nav.text }}>Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="flex items-center justify-center w-10 h-10 -mr-1 rounded-xl" style={{ color: nav.text }}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop: Logo, centered, large */}
        <div className="hidden lg:flex h-24 items-center justify-center border-b px-4" style={{ borderColor: nav.border }}>
          <LogoBadge size="lg" />
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5">
          {filteredNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button key={item.href} onClick={() => handleNavClick(item.href)}
                className="w-full flex items-center justify-between rounded-xl px-3 py-3 lg:py-2.5 text-sm font-medium transition-colors text-left"
                style={{ backgroundColor: active ? nav.activeItemBg : 'transparent', color: active ? nav.activeItemColor : nav.textMuted }}>
                <div className="flex items-center gap-3"><item.icon className="h-5 w-5" />{item.label}</div>
                {active && <ChevronRight className="h-4 w-4 lg:hidden" style={{ color: nav.textMuted }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-3" style={{ paddingBottom: (isMobile || isTablet) ? 'calc(env(safe-area-inset-bottom) + 0.75rem)' : '0.75rem' }}>
          {clientOnTrial && trialDaysLeft !== null && (
            <div className="rounded-xl p-3" style={{ backgroundColor: theme.isNavDark ? 'rgba(251,191,36,0.08)' : '#fffbeb', border: `1px solid ${theme.isNavDark ? 'rgba(251,191,36,0.15)' : '#fde68a'}` }}>
              <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: theme.isNavDark ? 'rgba(251,191,36,0.6)' : '#92400e' }}>Trial Period</p>
              <p className="text-sm font-semibold" style={{ color: theme.isNavDark ? '#fbbf24' : '#78350f' }}>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining</p>
            </div>
          )}

          {clientPaymentFailed && (
            <a href="/client/settings" className="block rounded-xl p-3 transition-opacity hover:opacity-90" style={{ backgroundColor: theme.isNavDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', border: `1px solid ${theme.isNavDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}` }}>
              <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: theme.isNavDark ? 'rgba(252,165,165,0.6)' : '#b91c1c' }}>Payment Issue</p>
              <p className="text-sm font-semibold" style={{ color: theme.isNavDark ? '#fca5a5' : '#dc2626' }}>Update payment method</p>
            </a>
          )}

          {/* Powered by agency */}
          <div className="rounded-xl border p-3" style={{ borderColor: nav.border, backgroundColor: nav.poweredByBg }}>
            <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: nav.textMuted }}>Powered by</p>
            <p className="text-sm font-semibold" style={{ color: nav.text }}>{branding.agencyName}</p>
          </div>

          <button onClick={handleSignOut} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors w-full" style={{ color: nav.textMuted }}>
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen" style={{ backgroundColor: theme.bg }}>
        {children}
      </main>

      {/* PWA Install Prompt */}
      {client && (
        <AddToHomeScreenModal
          clientId={client.id}
          theme={theme}
          appName={branding.businessName || branding.agencyName || client.business_name || 'Your App'}
        />
      )}
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.some(page => pathname?.startsWith(page));
  
  if (isAuthPage) return <>{children}</>;

  return (
    <ClientProvider>
      <head>
        {/* Manifest is set dynamically via useEffect after client loads */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <ClientDashboardLayout>{children}</ClientDashboardLayout>
    </ClientProvider>
  );
}