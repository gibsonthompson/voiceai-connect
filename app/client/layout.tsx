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

  const primaryLight = isLightColor(branding.primaryColor);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0]">
      {/* Subtle grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5 bg-[#0a0a0a]">
        {/* Logo & Business Name */}
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.agencyName} 
              className="h-8 w-8 rounded-lg object-contain" 
            />
          ) : (
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Phone 
                className="h-4 w-4" 
                style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} 
              />
            </div>
          )}
          <span className="font-medium text-[#f5f5f0] truncate">
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-[#f5f5f0]'
                    : 'text-[#f5f5f0]/60 hover:bg-white/5 hover:text-[#f5f5f0]'
                }`}
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
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <p className="text-xs text-[#f5f5f0]/40">Powered by</p>
            <p className="text-sm font-medium text-[#f5f5f0]/70">{branding.agencyName}</p>
          </div>
          
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f5f5f0]/60 hover:bg-white/5 hover:text-[#f5f5f0] transition-colors border-t border-white/5 pt-4 w-full"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
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