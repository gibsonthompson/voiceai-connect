'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Phone, TrendingUp, PhoneCall, Bot, Settings, LogOut, Loader2,
  Menu, X, ChevronRight
} from 'lucide-react';
import { ClientProvider, useClient } from './context';
import { useClientTheme } from '@/hooks/useClientTheme';

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

function ClientDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { client, branding, loading } = useClient();
  const theme = useClientTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Nav-specific colors (extend theme for nav elements)
  const nav = {
    bg: theme.navBg,
    text: theme.navText,
    textMuted: theme.isDark ? 'rgba(250,250,249,0.7)' : '#374151',
    border: theme.border,
    activeItemBg: theme.isDark ? 'rgba(255,255,255,0.1)' : `${theme.primary}15`,
    activeItemColor: theme.isDark ? '#ffffff' : theme.primary,
    hoverBg: theme.hover,
    poweredByBg: theme.isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
  };

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
    if (branding.logoUrl) setFavicon(branding.logoUrl);
  }, [branding.logoUrl]);

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
    if (branding.agencyName) {
      let metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (metaTitle) { metaTitle.setAttribute('content', branding.agencyName); }
      else {
        metaTitle = document.createElement('meta');
        metaTitle.setAttribute('name', 'apple-mobile-web-app-title');
        metaTitle.setAttribute('content', branding.agencyName);
        document.head.appendChild(metaTitle);
      }
    }
  }, [branding.agencyName]);

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('client');
    localStorage.removeItem('user');
    window.location.href = '/client/login';
  };

  const navItems = [
    { href: '/client/dashboard', label: 'Dashboard', icon: TrendingUp },
    { href: '/client/calls', label: 'Calls', icon: PhoneCall },
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.textMuted }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* Mobile Header */}
      <div 
        className="sticky top-0 z-30 md:hidden"
        style={{ backgroundColor: nav.bg, paddingTop: 'env(safe-area-inset-top)' }}
      >
        <header 
          className="flex items-center justify-between h-16 px-4"
          style={{ 
            boxShadow: theme.isDark ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
            borderBottom: `1px solid ${nav.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.agencyName} style={{ height: '40px', width: 'auto' }} className="object-contain flex-shrink-0" />
            ) : (
              <div className="flex items-center justify-center rounded-xl" style={{ height: '40px', width: '40px', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : `${theme.primary}15` }}>
                <Phone className="h-6 w-6" style={{ color: theme.isDark ? '#ffffff' : theme.primary }} />
              </div>
            )}
            <span className="font-semibold text-lg truncate max-w-[180px]" style={{ color: nav.text }}>
              {client?.business_name || 'Loading...'}
            </span>
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
        style={{ backgroundColor: nav.bg, borderRight: `1px solid ${nav.border}`, paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0 }}
      >
        {/* Mobile Header in Sidebar */}
        <div className="flex md:hidden items-center justify-between h-16 px-4 border-b" style={{ borderColor: nav.border }}>
          <span className="font-semibold text-lg" style={{ color: nav.text }}>Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors" style={{ color: nav.text }}>
            <X className="h-7 w-7" />
          </button>
        </div>

        {/* Desktop Logo */}
        <div className="hidden md:flex h-16 items-center gap-3 border-b px-6" style={{ borderColor: nav.border }}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.agencyName} style={{ height: '32px', width: 'auto' }} className="object-contain flex-shrink-0" />
          ) : (
            <div className="flex items-center justify-center rounded-lg" style={{ height: '32px', width: '32px', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : `${theme.primary}15` }}>
              <Phone className="h-4 w-4" style={{ color: theme.isDark ? '#ffffff' : theme.primary }} />
            </div>
          )}
          <span className="font-medium truncate" style={{ color: nav.text }}>
            {client?.business_name || 'Loading...'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="w-full flex items-center justify-between rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-colors text-left"
                style={{ backgroundColor: active ? nav.activeItemBg : 'transparent', color: active ? nav.activeItemColor : nav.textMuted }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {active && <ChevronRight className="h-4 w-4 md:hidden" style={{ color: nav.textMuted }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4" style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 1rem)' : '1rem' }}>
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