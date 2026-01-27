'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
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
        <header className="flex items-center justify-between h-14 px-4 shadow-lg">
          {/* Left - Logo & Business Name */}
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.agencyName}
                style={{ height: '36px', width: 'auto' }}
                className="object-contain flex-shrink-0"
              />
            ) : (
              <div 
                className="flex items-center justify-center rounded-xl"
                style={{ height: '36px', width: '36px', backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Phone className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="font-semibold text-white truncate max-w-[150px]">
              {client?.business_name || 'Loading...'}
            </span>
          </div>

          {/* Right - Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 -mr-2 rounded-xl transition-colors"
            style={{ color: navTextColor }}
          >
            <Menu className="h-6 w-6" />
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

      {/* Sidebar - Slides from RIGHT on mobile, LEFT on desktop */}
      <aside 
        className={`
          fixed inset-y-0 z-50 w-72 md:w-64
          transform transition-transform duration-300 ease-out
          md:left-0 md:translate-x-0 md:border-r
          right-0 border-l md:border-l-0
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
        style={{ 
          backgroundColor: navBg,
          borderColor: navBorder,
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0,
        }}
      >
        {/* Mobile Header in Sidebar */}
        <div 
          className="flex md:hidden items-center justify-between h-14 px-4 border-b"
          style={{ borderColor: navBorder }}
        >
          <span className="font-semibold" style={{ color: navTextColor }}>Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center w-10 h-10 -mr-2 rounded-xl transition-colors"
            style={{ color: navTextColor }}
          >
            <X className="h-6 w-6" />
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

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-colors"
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
              </Link>
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
      <ClientDashboardLayout>{children}</ClientDashboardLayout>
    </ClientProvider>
  );
}