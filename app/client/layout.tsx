'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Phone, TrendingUp, PhoneCall, Bot, Settings, LogOut, Loader2,
  Menu, X, ChevronRight
} from 'lucide-react';
import { ClientProvider, useClient } from './context';

// Darken a hex color
const darkenColor = (hex: string, percent: number): string => {
  const c = hex.replace('#', '');
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) - (255 * percent / 100));
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) - (255 * percent / 100));
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) - (255 * percent / 100));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

// Convert rgb to hex for meta tag
const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#050505';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

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

  // Nav colors based on agency primary color
  const navBg = darkenColor(branding.primaryColor, 40);
  const navTextColor = '#ffffff';
  const navTextMuted = 'rgba(255, 255, 255, 0.7)';
  const navBorder = 'rgba(255, 255, 255, 0.1)';

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

  // CRITICAL: Set html background color for status bar on iOS
  useEffect(() => {
    if (branding.primaryColor) {
      const bgColor = darkenColor(branding.primaryColor, 40);
      document.documentElement.style.background = bgColor;
      
      // Also update theme-color meta tag
      const hexColor = rgbToHex(bgColor);
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', hexColor);
      }
      
      return () => {
        document.documentElement.style.background = '#050505';
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', '#050505');
        }
      };
    }
  }, [branding.primaryColor]);

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
    // Use window.location for proper middleware handling
    window.location.href = href;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - STICKY (not fixed), extends into safe area */}
      <div 
        className="sticky top-0 z-30 md:hidden"
        style={{ 
          backgroundColor: navBg,
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <header className="flex items-center justify-between h-16 px-4 shadow-lg">
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
                style={{ height: '40px', width: '40px', backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Phone className="h-6 w-6 text-white" />
              </div>
            )}
            <span className="font-semibold text-lg text-white truncate max-w-[180px]">
              {client?.business_name || 'Loading...'}
            </span>
          </div>

          {/* Right - Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors"
            style={{ color: navTextColor }}
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
          fixed inset-y-0 left-0 z-50 w-72 md:w-64 border-r
          transform transition-transform duration-300 ease-out
          ${isMobile 
            ? `${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'translate-x-0'
          }
        `}
        style={{ 
          backgroundColor: navBg,
          borderColor: navBorder,
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0,
        }}
      >
        {/* Mobile Header in Sidebar */}
        <div 
          className="flex md:hidden items-center justify-between h-16 px-4 border-b"
          style={{ borderColor: navBorder }}
        >
          <span className="font-semibold text-lg" style={{ color: navTextColor }}>Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl transition-colors"
            style={{ color: navTextColor }}
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        {/* Desktop Logo & Business Name */}
        <div 
          className="hidden md:flex h-16 items-center gap-3 border-b px-6"
          style={{ borderColor: navBorder }}
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
              style={{ height: '32px', width: '32px', backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Phone className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="font-medium truncate" style={{ color: navTextColor }}>
            {client?.business_name || 'Loading...'}
          </span>
        </div>

        {/* Navigation - Use buttons with onClick for proper navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="w-full flex items-center justify-between rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-colors text-left"
                style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: active ? navTextColor : navTextMuted,
                }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {active && <ChevronRight className="h-4 w-4 md:hidden" style={{ color: navTextMuted }} />}
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
            style={{ borderColor: navBorder, backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <p className="text-xs" style={{ color: navTextMuted }}>Powered by</p>
            <p className="text-sm font-medium" style={{ color: navTextColor }}>{branding.agencyName}</p>
          </div>
          
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-colors w-full"
            style={{ color: navTextMuted }}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content - Light mode */}
      <main className="md:pl-64 min-h-screen">
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