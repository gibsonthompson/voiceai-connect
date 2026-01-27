'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Settings, LogOut, Loader2, BarChart3, Target, Send, Globe,
  Menu, X, ChevronRight
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

function AgencyDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { agency, branding, loading } = useAgency();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('agency');
    localStorage.removeItem('user');
    window.location.href = '/agency/login';
  };

  const navItems = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/agency/clients', label: 'Clients', icon: Users },
    { href: '/agency/leads', label: 'Leads', icon: Target },
    { href: '/agency/outreach', label: 'Outreach', icon: Send },
    { href: '/agency/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/agency/marketing', label: 'Marketing Website', icon: Globe },
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

      {/* Mobile Header - STICKY (not fixed), extends into safe area */}
      <div 
        className="sticky top-0 z-30 md:hidden bg-[#050505]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <header className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06]">
          {/* Left - Logo & Name */}
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt={branding.name}
                style={{ height: '40px', width: 'auto' }}
                className="object-contain flex-shrink-0"
              />
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5" style={{ height: '40px', width: '40px' }}>
                <WaveformIcon className="h-6 w-6 text-[#fafaf9]" />
              </div>
            )}
            <span className="font-semibold text-lg text-[#fafaf9] truncate max-w-[180px]">
              {agency?.name || 'Agency'}
            </span>
          </div>

          {/* Right - Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <Menu className="h-7 w-7 text-[#fafaf9]" />
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

      {/* Sidebar - Desktop: LEFT, Mobile: slides from RIGHT */}
      <aside 
        className={`
          fixed inset-y-0 z-50 w-72 md:w-64 bg-[#050505]
          transform transition-transform duration-300 ease-out
          ${isMobile 
            ? `right-0 border-l border-white/[0.06] ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`
            : 'left-0 border-r border-white/[0.06] translate-x-0'
          }
        `}
        style={{ paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0 }}
      >
        {/* Mobile Header in Sidebar */}
        <div className="flex md:hidden items-center justify-between h-16 px-4 border-b border-white/[0.06]">
          <span className="font-semibold text-lg text-[#fafaf9]">Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-7 w-7 text-[#fafaf9]" />
          </button>
        </div>

        {/* Desktop Logo & Agency Name */}
        <div className="hidden md:flex h-16 items-center gap-3 border-b border-white/[0.06] px-6">
          {branding.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={branding.name}
              style={{ height: '32px', width: 'auto' }}
              className="object-contain flex-shrink-0"
            />
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5" style={{ height: '32px', width: '32px' }}>
              <WaveformIcon className="h-5 w-5 text-[#fafaf9]" />
            </div>
          )}
          <span className="font-semibold text-[#fafaf9] truncate">
            {agency?.name || 'Agency'}
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
                className={`flex items-center justify-between rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-[#fafaf9]/60 hover:bg-white/[0.04] hover:text-[#fafaf9]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {active && <ChevronRight className="h-4 w-4 md:hidden" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-4 space-y-3"
          style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 1rem)' : '1rem' }}
        >
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
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 md:py-2.5 text-sm font-medium text-[#fafaf9]/50 hover:bg-white/[0.04] hover:text-[#fafaf9] transition-all border-t border-white/[0.06] pt-4"
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
  
  // Don't wrap login page with provider
  if (pathname === '/agency/login') {
    return <>{children}</>;
  }

  return (
    <AgencyProvider>
      <AgencyDashboardLayout>{children}</AgencyDashboardLayout>
    </AgencyProvider>
  );
}