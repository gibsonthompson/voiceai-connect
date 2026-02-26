'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Building2, Users, Target, Mail, LogOut, Loader2,
  Menu, X, ChevronRight
} from 'lucide-react';

const AUTH_PAGES = ['/admin/login'];

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
}

// VoiceAI Connect Waveform Logo
function WaveformLogo({ size = 28, color = '#10b981' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="9" width="2" height="6" rx="1" fill={color} opacity="0.5" />
      <rect x="5" y="7" width="2" height="10" rx="1" fill={color} opacity="0.7" />
      <rect x="8" y="4" width="2" height="16" rx="1" fill={color} opacity="0.9" />
      <rect x="11" y="6" width="2" height="12" rx="1" fill={color} />
      <rect x="14" y="3" width="2" height="18" rx="1" fill={color} />
      <rect x="17" y="7" width="2" height="10" rx="1" fill={color} opacity="0.7" />
      <rect x="20" y="9" width="2" height="6" rx="1" fill={color} opacity="0.5" />
    </svg>
  );
}

function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) { router.push('/admin/login'); return; }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/admin/verify`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }

      const data = await response.json();
      setAdmin(data.admin);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/agencies', label: 'Agencies', icon: Building2 },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/leads', label: 'Leads', icon: Target },
    { href: '/admin/outreach', label: 'Outreach', icon: Mail },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 blur-xl bg-emerald-500/20 rounded-full" />
            <WaveformLogo size={48} />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 md:hidden bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <header className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <WaveformLogo size={22} />
            <span className="text-sm font-semibold text-white/90 tracking-tight">VoiceAI Connect</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0a0a0a] border-r border-white/[0.06]
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Mobile Close */}
        <div className="flex md:hidden items-center justify-between h-14 px-4 border-b border-white/[0.06]">
          <span className="text-sm font-medium text-white/80">Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="hidden md:flex h-[72px] items-center gap-3 px-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 -m-1 blur-lg bg-emerald-500/10 rounded-full" />
            <WaveformLogo size={26} />
          </div>
          <div>
            <span className="text-[15px] font-semibold text-white tracking-tight">VoiceAI Connect</span>
            <span className="block text-[10px] font-medium text-emerald-400/70 uppercase tracking-[0.15em] -mt-0.5">Admin</span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block mx-4 border-t border-white/[0.04]" />

        {/* Navigation */}
        <nav className="p-3 mt-2 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200
                  ${active 
                    ? 'bg-emerald-500/[0.08] text-emerald-400' 
                    : 'text-white/40 hover:bg-white/[0.03] hover:text-white/70'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-[18px] w-[18px] transition-colors ${active ? 'text-emerald-400' : 'text-white/25 group-hover:text-white/50'}`} />
                  {item.label}
                </div>
                {active && (
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
          {/* Admin Info */}
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                <span className="text-xs font-semibold text-emerald-400">
                  {admin?.name?.charAt(0) || admin?.email?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white/70 truncate">{admin?.name || 'Admin'}</p>
                <p className="text-[10px] text-white/30 truncate">{admin?.email}</p>
              </div>
            </div>
          </div>
          
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/30 hover:bg-white/[0.03] hover:text-white/50 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-[260px] min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.some(page => pathname?.startsWith(page));
  
  if (isAuthPage) return <>{children}</>;
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}