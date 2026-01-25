'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Settings, LogOut, Loader2, BarChart3
} from 'lucide-react';
import { AgencyProvider, useAgency } from './context';

// Waveform icon component
function WaveformIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill="currentColor" />
      <rect x="11" y="6" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="14" y="3" width="2" height="18" rx="1" fill="currentColor" />
      <rect x="17" y="7" width="2" height="10" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function AgencyLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { agency, branding, loading } = useAgency();

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('agency');
    localStorage.removeItem('user');
    window.location.href = '/agency/login';
  };

  const navItems = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/agency/clients', label: 'Clients', icon: Users },
    { href: '/agency/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/agency/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/agency/dashboard') {
      return pathname === '/agency/dashboard' || pathname === '/agency';
    }
    if (href === '/agency/settings') {
      return pathname?.startsWith('/agency/settings');
    }
    return pathname?.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-[#fafaf9]/40 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafaf9]">
      {/* Grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-white/[0.06] bg-[#050505]">
        {/* Logo & Agency Name */}
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-6">
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.name} 
              className="h-8 w-8 rounded-lg object-contain" 
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <WaveformIcon className="h-5 w-5 text-[#fafaf9]" />
            </div>
          )}
          <span className="font-semibold text-[#fafaf9] truncate">
            {agency?.name || 'Loading...'}
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-[#fafaf9]/60 hover:bg-white/[0.04] hover:text-[#fafaf9]'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          {/* Trial/Plan Badge */}
          {agency?.subscription_status === 'trial' && agency.trial_ends_at && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-3">
              <p className="text-xs text-amber-400/80">Trial Period</p>
              <p className="text-sm font-medium text-amber-300">
                {Math.max(0, Math.ceil((new Date(agency.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left
              </p>
            </div>
          )}

          {/* Plan Badge */}
          {agency?.subscription_status === 'active' && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3">
              <p className="text-xs text-emerald-400/80">Current Plan</p>
              <p className="text-sm font-medium text-emerald-300 capitalize">
                {agency.plan_type || 'Starter'}
              </p>
            </div>
          )}
          
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#fafaf9]/50 hover:bg-white/[0.04] hover:text-[#fafaf9] transition-all border-t border-white/[0.06] pt-4"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function AgencyLayout({ children }: { children: ReactNode }) {
  return (
    <AgencyProvider>
      <AgencyLayoutInner>{children}</AgencyLayoutInner>
    </AgencyProvider>
  );
}