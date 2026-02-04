'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Phone, TrendingUp, PhoneCall, Bot, Settings, LogOut, Loader2,
  Menu, X, ChevronRight
} from 'lucide-react';
import { ClientProvider, useClient } from './context';

// Set dynamic favicon
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

// Auth pages that should NOT use the dashboard layout
const AUTH_PAGES = ['/client/login', '/client/signup', '/client/set-password', '/client/upgrade'];

function ClientDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { client, branding, loading } = useClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Determine if using light or dark theme
  // IMPORTANT: Check for 'light' explicitly since undefined should default to dark
  const isDark = branding.websiteTheme !== 'light';

  // Theme colors - clean and consistent
  const theme = isDark ? {
    // Dark theme
    navBg: '#111111',
    navText: '#fafaf9',
    navTextMuted: 'rgba(250, 250, 249, 0.7)',
    navBorder: 'rgba(255, 255, 255, 0.1)',
    navActiveItemBg: 'rgba(255, 255, 255, 0.1)',
    navActiveItemColor: '#ffffff',
    navHoverBg: 'rgba(255, 255, 255, 0.05)',
    mainBg: '#0a0a0a',
    poweredByBg: 'rgba(255, 255, 255, 0.05)',
  } : {
    // Light theme
    navBg: '#ffffff',
    navText: '#111827',
    navTextMuted: '#374151',
    navBorder: '#e5e7eb',
    navActiveItemBg: `${branding.primaryColor}15`,
    navActiveItemColor: branding.primaryColor,
    navHoverBg: '#f3f4f6',
    mainBg: '#f9fafb',
    poweredByBg: '#f3f4f6',
  };

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

  // Set favicon from agency branding (uses logo as favicon)
  useEffect(() => {
    if (branding.logoUrl) {
      setFavicon(branding.logoUrl);
    }
  }, [branding.logoUrl]);

  // Set html background color for status bar on iOS
  useEffect(() => {
    document.documentElement.style.background = theme.navBg;
    
    // Update theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.navBg);
    }
    
    return () => {
      document.documentElement.style.background = '#050505';
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#050505');
      }
    };
  }, [theme.navBg]);

  // Update apple-mobile-web-app-title dynamically
  useEffect(() => {
    if (branding.agencyName) {
      let metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (metaTitle) {
        metaTitle.setAttribute('content', branding.agencyName);
      } else {
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
    if (href === '/client/dashboard') {
      return pathname === '/client/dashboard' || pathname === '/client';
    }
    return pathname?.startsWith(href);
  };

  // Handle nav click - close sidebar and navigate
  const handleNavClick = (href: string) => {
    setSidebarOpen(false);
    window.location.href = href;
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.mainBg }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme.navTextMuted }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.mainBg }}>
      {/* Mobile Header - STICKY (not fixed), extends into safe area */}
      <div 
        className="sticky top-0 z-30 md:hidden"
        style={{ 
          backgroundColor: theme.navBg,
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <header 
          className="flex items-center justify-between h-16 px-4"
          style={{ 
            boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderBottom: `1px solid ${theme.navBorder}`,
          }}
        >
          {/* Left - Logo & Business Name */}
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.agencyName}
                style={{ height: '40px', width: 'auto' }}
                className="object-contain flex-shrink-0"
              />
            ) : (
              <div 
                className="flex items-center justify-center rounded-xl"
                style={{ 
                  height: '40px', 
                  width: '40px', 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : `${branding.primaryColor}15`,
                }}
              >
                <Phone className="h-6 w-6" style={{ color: isDark ? '#ffffff' : branding.primaryColor }} />
              </div>
            )}
            <span 
              className="font-semibold text-lg truncate max-w-[180px]"
              style={{ color: theme.navText }}
            >
              {client?.business_name || 'Loading...'}
            </span>
          </div>

          {/* Right - Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors"
            style={{ color: theme.navText }}
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

      {/* Sidebar - Desktop: LEFT, Mobile: slides from LEFT */}
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
          backgroundColor: theme.navBg,
          borderRight: `1px solid ${theme.navBorder}`,
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0,
        }}
      >
        {/* Mobile Header in Sidebar */}
        <div 
          className="flex md:hidden items-center justify-between h-16 px-4 border-b"
          style={{ borderColor: theme.navBorder }}
        >
          <span className="font-semibold text-lg" style={{ color: theme.navText }}>Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors"
            style={{ color: theme.navText }}
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        {/* Desktop Logo & Business Name */}
        <div 
          className="hidden md:flex h-16 items-center gap-3 border-b px-6"
          style={{ borderColor: theme.navBorder }}
        >
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.agencyName}
              style={{ height: '32px', width: 'auto' }}
              className="object-contain flex-shrink-0"
            />
          ) : (
            <div 
              className="flex items-center justify-center rounded-lg"
              style={{ 
                height: '32px', 
                width: '32px', 
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : `${branding.primaryColor}15`,
              }}
            >
              <Phone className="h-4 w-4" style={{ color: isDark ? '#ffffff' : branding.primaryColor }} />
            </div>
          )}
          <span className="font-medium truncate" style={{ color: theme.navText }}>
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
                style={{
                  backgroundColor: active ? theme.navActiveItemBg : 'transparent',
                  color: active ? theme.navActiveItemColor : theme.navTextMuted,
                }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {active && <ChevronRight className="h-4 w-4 md:hidden" style={{ color: theme.navTextMuted }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-4 space-y-4"
          style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 1rem)' : '1rem' }}
        >
          {/* Powered By */}
          <div 
            className="rounded-xl border p-3"
            style={{ 
              borderColor: theme.navBorder, 
              backgroundColor: theme.poweredByBg,
            }}
          >
            <p className="text-xs" style={{ color: theme.navTextMuted }}>Powered by</p>
            <p className="text-sm font-medium" style={{ color: theme.navText }}>{branding.agencyName}</p>
          </div>
          
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-colors w-full"
            style={{ color: theme.navTextMuted }}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className="md:pl-64 min-h-screen"
        style={{ backgroundColor: theme.mainBg }}
      >
        {children}
      </main>
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Auth pages render without the dashboard layout/provider
  const isAuthPage = AUTH_PAGES.some(page => pathname?.startsWith(page));
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <ClientProvider>
      {/* PWA Manifest and Meta Tags for Client Dashboard */}
      <head>
        <link rel="manifest" href="/api/client-manifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <ClientDashboardLayout>{children}</ClientDashboardLayout>
    </ClientProvider>
  );
}