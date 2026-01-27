'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Phone, TrendingUp, PhoneCall, Bot, Settings, LogOut, Loader2 
} from 'lucide-react';
import { ClientProvider, useClient } from './context';

// Helper to check if color is light
const isLightColor = (hex: string): boolean => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
};

// Darken a hex color
const darkenColor = (hex: string, percent: number): string => {
  const c = hex.replace('#', '');
  const r = Math.max(0, parseInt(c.substring(0, 2), 16) - (255 * percent / 100));
  const g = Math.max(0, parseInt(c.substring(2, 4), 16) - (255 * percent / 100));
  const b = Math.max(0, parseInt(c.substring(4, 6), 16) - (255 * percent / 100));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

// Auth pages that should NOT use the dashboard layout
const AUTH_PAGES = ['/client/login', '/client/signup', '/client/set-password', '/client/upgrade'];

function ClientDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { client, branding, loading } = useClient();

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

  // Nav colors based on agency primary color
  const navBg = darkenColor(branding.primaryColor, 40); // Darker version of primary
  const navTextColor = '#ffffff';
  const navTextMuted = 'rgba(255, 255, 255, 0.7)';
  const navBorder = 'rgba(255, 255, 255, 0.1)';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Agency branded */}
      <aside 
        className="fixed inset-y-0 left-0 z-40 w-64 border-r"
        style={{ 
          backgroundColor: navBg,
          borderColor: navBorder,
        }}
      >
        {/* Logo & Business Name */}
        <div 
          className="flex h-16 items-center gap-3 border-b px-6"
          style={{ borderColor: navBorder }}
        >
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.agencyName} 
              className="h-8 w-8 rounded-lg object-contain bg-white/10 p-0.5" 
            />
          ) : (
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: active ? navTextColor : navTextMuted,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
          {/* Powered By */}
          <div 
            className="rounded-lg border p-3"
            style={{ 
              borderColor: navBorder, 
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <p className="text-xs" style={{ color: navTextMuted }}>Powered by</p>
            <p className="text-sm font-medium" style={{ color: navTextColor }}>{branding.agencyName}</p>
          </div>
          
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full"
            style={{ color: navTextMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = navTextColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = navTextMuted;
            }}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content - Light mode */}
      <main className="pl-64">
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

  // Dashboard pages get the full layout with provider
  return (
    <ClientProvider>
      <ClientDashboardLayout>{children}</ClientDashboardLayout>
    </ClientProvider>
  );
}