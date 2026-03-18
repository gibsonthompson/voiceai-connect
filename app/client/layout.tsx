'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Phone, TrendingUp, PhoneCall, Users, Bot, Settings, LogOut, Loader2,
  Menu, X, ChevronRight, Clock, CreditCard, AlertTriangle
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
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function ClientDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { client, branding, loading } = useClient();
  const theme = useClientTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Nav colors derived from actual sidebar bg, not page isDark mode
  // (sidebar can be dark via branding_overrides even when page is light)
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

  // Agency controls what name shows in client header
  // 'agency_name' (default) = show agency name, 'business_name' = show client's business name
  const displayName = branding.clientHeaderMode === 'business_name'
    ? (branding.businessName || branding.agencyName || 'Loading...')
    : (branding.agencyName || 'Loading...');
  const displayLogo = branding.logoUrl;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (sidebarOpen && isMobile) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen, isMobile]);

  useEffect(() => {
    if (displayLogo) setFavicon(displayLogo);
  }, [displayLogo]);

  useEffect(() => {
    document.documentElement.style.background = nav.bg;
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) metaThemeColor.setAttribute('content', nav.bg);
    return () => {
      document.documentElement.style.background = '#050505';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#050505');
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

  const navItems = [
    { href: '/client/dashboard', label: 'Dashboard', icon: TrendingUp },
    { href: '/client/calls', label: 'Calls', icon: PhoneCall },
    { href: '/client/contacts', label: 'Contacts', icon: Users },
    { href: '/client/ai-agent', label: 'AI Agent', icon: Bot },
    { href: '/client/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/client/dashboard') return pathname === '/client/dashboard' || pathname === '/client';
    return pathname?.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    setSidebarOpen(false);
    window.location.href = href;
  };

  // Save resolved theme to localStorage so skeleton can read it on next load
  useEffect(() => {
    if (!loading && theme) {
      try { localStorage.setItem('voiceai_ui_theme', theme.isDark ? 'dark' : 'light'); } catch {}
    }
  }, [loading, theme.isDark]);

  if (loading) {
    // Read saved theme from previous session — avoids hardcoding dark/light
    let isDark = true;
    try {
      const saved = localStorage.getItem('voiceai_ui_theme');
      if (saved === 'light') isDark = false;
    } catch {}

    const sk = isDark
      ? { bg: '#0a0a0a', card: '#111111', sidebar: '#0a0a0a', border: 'rgba(255,255,255,0.06)', pulse: 'rgba(255,255,255,0.06)', pulse2: 'rgba(255,255,255,0.03)' }
      : { bg: '#f9fafb', card: '#ffffff', sidebar: '#ffffff', border: '#e5e7eb', pulse: '#e5e7eb', pulse2: '#f3f4f6' };

    return (
      <div className="min-h-screen flex" style={{ backgroundColor: sk.bg }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes skPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          .sk-p { animation: skPulse 1.8s ease-in-out infinite; }
          .sk-p2 { animation: skPulse 1.8s ease-in-out 0.3s infinite; }
          .sk-p3 { animation: skPulse 1.8s ease-in-out 0.6s infinite; }
        `}} />
        {/* Sidebar skeleton — hidden on mobile */}
        <div className="hidden md:flex flex-col w-64 flex-shrink-0" style={{ backgroundColor: sk.sidebar, borderRight: `1px solid ${sk.border}` }}>
          {/* Logo area */}
          <div className="h-16 flex items-center gap-3 px-6" style={{ borderBottom: `1px solid ${sk.border}` }}>
            <div className="w-8 h-8 rounded-lg sk-p" style={{ backgroundColor: sk.pulse }} />
            <div className="h-4 w-24 rounded-md sk-p" style={{ backgroundColor: sk.pulse }} />
          </div>
          {/* Nav items */}
          <div className="p-4 space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${i <= 2 ? 'sk-p' : 'sk-p2'}`}>
                <div className="w-5 h-5 rounded" style={{ backgroundColor: i === 1 ? sk.pulse : sk.pulse2 }} />
                <div className="h-3.5 rounded-md" style={{ backgroundColor: i === 1 ? sk.pulse : sk.pulse2, width: `${60 + i * 12}px` }} />
              </div>
            ))}
          </div>
          {/* Bottom */}
          <div className="mt-auto p-4 space-y-2">
            <div className="rounded-xl p-3 sk-p3" style={{ border: `1px solid ${sk.border}` }}>
              <div className="h-2.5 w-16 rounded mb-1.5" style={{ backgroundColor: sk.pulse2 }} />
              <div className="h-3.5 w-24 rounded" style={{ backgroundColor: sk.pulse }} />
            </div>
            <div className="rounded-xl p-3 sk-p3" style={{ border: `1px solid ${sk.border}` }}>
              <div className="h-2.5 w-16 rounded mb-1.5" style={{ backgroundColor: sk.pulse2 }} />
              <div className="h-3.5 w-20 rounded" style={{ backgroundColor: sk.pulse }} />
            </div>
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="h-6 w-40 rounded-lg sk-p mb-2" style={{ backgroundColor: sk.pulse }} />
            <div className="h-3.5 w-56 rounded-md sk-p2" style={{ backgroundColor: sk.pulse2 }} />
          </div>
          {/* Phone number card */}
          <div className="rounded-xl p-5 mb-5 sk-p" style={{ backgroundColor: sk.card, border: `1px solid ${sk.border}` }}>
            <div className="h-3 w-28 rounded mb-3" style={{ backgroundColor: sk.pulse2 }} />
            <div className="h-7 w-44 rounded-lg" style={{ backgroundColor: sk.pulse }} />
            <div className="h-3 w-48 rounded mt-2" style={{ backgroundColor: sk.pulse2 }} />
          </div>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[1,2].map(i => (
              <div key={i} className={`rounded-xl p-5 ${i === 2 ? 'sk-p2' : 'sk-p'}`} style={{ backgroundColor: sk.card, border: `1px solid ${sk.border}` }}>
                <div className="h-3 w-20 rounded mb-3" style={{ backgroundColor: sk.pulse2 }} />
                <div className="h-8 w-12 rounded-lg mb-1" style={{ backgroundColor: sk.pulse }} />
                <div className="h-2.5 w-16 rounded" style={{ backgroundColor: sk.pulse2 }} />
              </div>
            ))}
          </div>
          {/* Recent calls */}
          <div className="rounded-xl sk-p3" style={{ backgroundColor: sk.card, border: `1px solid ${sk.border}` }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${sk.border}` }}>
              <div className="h-4 w-24 rounded" style={{ backgroundColor: sk.pulse }} />
              <div className="h-3 w-14 rounded" style={{ backgroundColor: sk.pulse2 }} />
            </div>
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: `1px solid ${sk.border}` }}>
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: sk.pulse2 }} />
                <div className="flex-1">
                  <div className="h-3.5 w-32 rounded mb-1.5" style={{ backgroundColor: sk.pulse }} />
                  <div className="h-2.5 w-20 rounded" style={{ backgroundColor: sk.pulse2 }} />
                </div>
                <div className="h-3 w-16 rounded" style={{ backgroundColor: sk.pulse2 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Dynamic ::selection color — matches agency branding */}
      <style dangerouslySetInnerHTML={{ __html: `::selection { background: ${theme.primary}40; } ::-moz-selection { background: ${theme.primary}40; }` }} />

      {/* Payment Failed Banner */}
      {clientPaymentFailed && (
        <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between gap-3"
          style={{ backgroundColor: theme.isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderBottom: `1px solid ${theme.isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}` }}>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 flex-shrink-0" style={{ color: '#ef4444' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: theme.isDark ? '#fca5a5' : '#dc2626' }}>Payment failed</p>
              <p className="text-xs" style={{ color: theme.isDark ? 'rgba(252,165,165,0.7)' : '#b91c1c' }}>Your AI receptionist may stop answering calls. Please update your payment method.</p>
            </div>
          </div>
          <a href="/client/settings" className="rounded-full px-4 py-2 text-sm font-medium transition-colors flex-shrink-0" style={{ backgroundColor: '#ef4444', color: '#ffffff' }}>Fix Payment</a>
        </div>
      )}

      {/* Trial Ending Soon Banner */}
      {clientOnTrial && trialDaysLeft !== null && trialDaysLeft <= 3 && !clientPaymentFailed && (
        <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between gap-3"
          style={{ backgroundColor: theme.isDark ? 'rgba(251,191,36,0.08)' : '#fffbeb', borderBottom: `1px solid ${theme.isDark ? 'rgba(251,191,36,0.2)' : '#fde68a'}` }}>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
            <p className="text-sm" style={{ color: theme.isDark ? '#fbbf24' : '#92400e' }}>
              Your free trial ends in <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}</strong>. Subscribe to keep your AI receptionist active.
            </p>
          </div>
          <a href="/client/upgrade-required" className="rounded-full px-4 py-2 text-sm font-medium transition-colors flex-shrink-0" style={{ backgroundColor: '#f59e0b', color: '#1c1917' }}>View Plans</a>
        </div>
      )}

      {/* Mobile Header — shows client business name + logo */}
      <div className="sticky z-30 md:hidden"
        style={{ backgroundColor: nav.bg, paddingTop: 'env(safe-area-inset-top)', top: (clientPaymentFailed || (clientOnTrial && trialDaysLeft !== null && trialDaysLeft <= 3)) ? '52px' : 0 }}>
        <header className="flex items-center justify-between h-16 px-4"
          style={{ boxShadow: theme.isDark ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', borderBottom: `1px solid ${nav.border}` }}>
          <div className="flex items-center gap-3">
            {displayLogo ? (
              <img src={displayLogo} alt={displayName} style={{ height: '40px', width: 'auto' }} className="object-contain flex-shrink-0" />
            ) : (
              <div className="flex items-center justify-center rounded-xl" style={{ height: '40px', width: '40px', backgroundColor: theme.isNavDark ? 'rgba(255,255,255,0.1)' : `${theme.primary}15` }}>
                <Phone className="h-6 w-6" style={{ color: theme.isNavDark ? '#ffffff' : theme.primary }} />
              </div>
            )}
            <span className="font-semibold text-lg truncate max-w-[180px]" style={{ color: nav.text }}>{displayName}</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors" style={{ color: nav.text }}>
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
        className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 transform transition-transform duration-300 ease-out ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`}
        style={{ backgroundColor: nav.bg, borderRight: `1px solid ${nav.border}`, paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0, top: !isMobile ? ((clientPaymentFailed || (clientOnTrial && trialDaysLeft !== null && trialDaysLeft <= 3)) ? '52px' : 0) : 0 }}>
        
        {/* Mobile Header in Sidebar */}
        <div className="flex md:hidden items-center justify-between h-16 px-4 border-b" style={{ borderColor: nav.border }}>
          <span className="font-semibold text-lg" style={{ color: nav.text }}>Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors" style={{ color: nav.text }}>
            <X className="h-7 w-7" />
          </button>
        </div>

        {/* Desktop Logo — shows client's business name + logo */}
        <div className="hidden md:flex h-16 items-center gap-3 border-b px-6" style={{ borderColor: nav.border }}>
          {displayLogo ? (
            <img src={displayLogo} alt={displayName} style={{ height: '32px', width: 'auto' }} className="object-contain flex-shrink-0" />
          ) : (
            <div className="flex items-center justify-center rounded-lg" style={{ height: '32px', width: '32px', backgroundColor: theme.isNavDark ? 'rgba(255,255,255,0.1)' : `${theme.primary}15` }}>
              <Phone className="h-4 w-4" style={{ color: theme.isNavDark ? '#ffffff' : theme.primary }} />
            </div>
          )}
          <span className="font-medium truncate" style={{ color: nav.text }}>{displayName}</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button key={item.href} onClick={() => handleNavClick(item.href)}
                className="w-full flex items-center justify-between rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-colors text-left"
                style={{ backgroundColor: active ? nav.activeItemBg : 'transparent', color: active ? nav.activeItemColor : nav.textMuted }}>
                <div className="flex items-center gap-3"><item.icon className="h-5 w-5" />{item.label}</div>
                {active && <ChevronRight className="h-4 w-4 md:hidden" style={{ color: nav.textMuted }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4" style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 1rem)' : '1rem' }}>
          {clientOnTrial && trialDaysLeft !== null && (
            <div className="rounded-xl p-3" style={{ backgroundColor: theme.isNavDark ? 'rgba(251,191,36,0.08)' : '#fffbeb', border: `1px solid ${theme.isNavDark ? 'rgba(251,191,36,0.15)' : '#fde68a'}` }}>
              <p className="text-xs" style={{ color: theme.isNavDark ? 'rgba(251,191,36,0.6)' : '#92400e' }}>Trial Period</p>
              <p className="text-sm font-medium" style={{ color: theme.isNavDark ? '#fbbf24' : '#78350f' }}>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining</p>
            </div>
          )}

          {clientPaymentFailed && (
            <a href="/client/settings" className="block rounded-xl p-3 transition-opacity hover:opacity-90" style={{ backgroundColor: theme.isNavDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', border: `1px solid ${theme.isNavDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}` }}>
              <p className="text-xs" style={{ color: theme.isNavDark ? 'rgba(252,165,165,0.6)' : '#b91c1c' }}>Payment Issue</p>
              <p className="text-sm font-medium" style={{ color: theme.isNavDark ? '#fca5a5' : '#dc2626' }}>Update payment method</p>
            </a>
          )}

          {/* Powered by — always shows AGENCY name, not client name */}
          <div className="rounded-xl border p-3" style={{ borderColor: nav.border, backgroundColor: nav.poweredByBg }}>
            <p className="text-xs" style={{ color: nav.textMuted }}>Powered by</p>
            <p className="text-sm font-medium" style={{ color: nav.text }}>{branding.agencyName}</p>
          </div>

          <button onClick={handleSignOut} className="flex items-center gap-3 rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-colors w-full" style={{ color: nav.textMuted }}>
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-64 min-h-screen" style={{ backgroundColor: theme.bg }}>
        {children}
      </main>

      {/* PWA Install Prompt — auto-triggers after 3rd visit */}
      {client && (
        <AddToHomeScreenModal clientId={client.id} theme={theme} />
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
        <link rel="manifest" href="/api/client-manifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <ClientDashboardLayout>{children}</ClientDashboardLayout>
    </ClientProvider>
  );
}