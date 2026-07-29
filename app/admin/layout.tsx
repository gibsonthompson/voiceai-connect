'use client';

// ============================================================================
// ADMIN LAYOUT (shell for every /admin page)
// Emerald-on-white. Imports admin-theme.css and applies .admin-scope on the
// root so the token system is available to every child page. All auth and
// sidebar logic is unchanged from the previous version; only the visual layer
// and the nav grouping changed, and the zoom:0.8 hack was removed.
//
// Nav links all point at pages that exist today, grouped under section headers
// that preview the target consolidation (Money, Growth, Messaging, Content).
// As each merged page is built, its section collapses to a single entry.
// ============================================================================

import './admin-theme.css';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Users, DollarSign, Target, Mail,
  MessageSquare, Youtube, LogOut, Loader2, Menu, X, PhoneCall, Sparkles,
} from 'lucide-react';

const AUTH_PAGES = ['/admin/login'];
interface Admin { id: string; email: string; name: string; role: string; }

function WaveformLogo({ size = 26, color = '#34d399' }: { size?: number; color?: string }) {
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

// Grouped nav. Each href resolves to a page that exists today. Merged pages
// (Money, Messaging) collapse to a single entry rather than a section.
const NAV: { section: string | null; items: { href: string; label: string; icon: any }[] }[] = [
  { section: null, items: [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/calls', label: 'Calls', icon: PhoneCall },
    { href: '/admin/agencies', label: 'Agencies', icon: Building2 },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/money', label: 'Money', icon: DollarSign },
  ]},
  { section: 'Growth', items: [
    { href: '/admin/leads', label: 'Leads', icon: Target },
    { href: '/admin/outreach', label: 'Outreach', icon: Mail },
    { href: '/admin/growth', label: 'Demos', icon: Sparkles },
  ]},
  { section: null, items: [
    { href: '/admin/messaging', label: 'Messaging', icon: MessageSquare },
  ]},
  { section: 'Content', items: [
    { href: '/admin/youtube', label: 'YouTube', icon: Youtube },
  ]},
];

function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) { router.push('/admin/login'); return; }
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/admin/verify`, { headers: { 'Authorization': `Bearer ${token}` } });
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

  const handleSignOut = () => { localStorage.removeItem('admin_token'); router.push('/admin/login'); };

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href));

  useEffect(() => { setSidebarOpen(false); }, [pathname]);
  useEffect(() => {
    if (sidebarOpen && isMobile) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen, isMobile]);

  if (loading) {
    return (
      <div className="admin-scope min-h-screen flex items-center justify-center">
        <link rel="manifest" href="/manifest-admin.json" />
        <div className="flex flex-col items-center gap-4">
          <WaveformLogo size={44} color="#10b981" />
          <Loader2 className="h-5 w-5 animate-spin text-[var(--a-dim)]" />
        </div>
      </div>
    );
  }

  const navLink = (item: { href: string; label: string; icon: any }) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className="group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-colors"
        style={active
          ? { background: 'var(--a-em)', color: '#04140D', fontWeight: 600 }
          : { color: 'rgba(255,255,255,0.66)' }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        <item.icon className="h-[17px] w-[17px]" style={{ color: active ? '#04140D' : 'rgba(255,255,255,0.7)' }} />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="admin-scope min-h-screen">
      <link rel="manifest" href="/manifest-admin.json" />

      {/* Mobile header */}
      <div className="sticky top-0 z-30 md:hidden bg-[var(--a-card)] border-b border-[var(--a-line)]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <header className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <div style={{ background: 'var(--a-sidebar)' }} className="h-8 w-8 rounded-lg flex items-center justify-center">
              <WaveformLogo size={18} />
            </div>
            <span className="text-sm font-semibold text-[var(--a-ink)] tracking-tight">VoiceAI Connect</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--a-muted)] hover:bg-[var(--a-em-soft)] transition-colors">
            <Menu className="h-5 w-5" />
          </button>
        </header>
      </div>

      {sidebarOpen && (<div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />)}

      {/* Sidebar (deep emerald) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[238px] transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ background: 'var(--a-sidebar)', paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0 }}
      >
        <div className="flex md:hidden items-center justify-between h-14 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-sm font-medium text-white/80">Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 h-[72px]">
          <WaveformLogo size={26} />
          <div>
            <span className="text-[15px] font-semibold text-white tracking-tight leading-none block">VoiceAI Connect</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] mt-1" style={{ color: 'var(--a-em-2)' }}>Admin</span>
          </div>
        </div>

        <nav className="px-3 pb-2 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 168px)' }}>
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <div className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.13em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  {group.section}
                </div>
              )}
              {group.items.map(navLink)}
            </div>
          ))}
        </nav>

        {/* User + sign out */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2" style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 0.75rem)' : '0.75rem' }}>
          <div className="rounded-[10px] p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--a-em)' }}>
                <span className="text-xs font-semibold" style={{ color: '#04140D' }}>{admin?.name?.charAt(0) || admin?.email?.charAt(0)?.toUpperCase() || 'A'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white/85 truncate">{admin?.name || 'Admin'}</p>
                <p className="text-[10px] text-white/45 truncate">{admin?.email}</p>
              </div>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] font-medium text-white/55 hover:bg-white/5 transition-colors w-full">
            <LogOut className="h-4 w-4" />Sign Out
          </button>
        </div>
      </aside>

      <main className="md:pl-[238px] min-h-screen">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.some(page => pathname?.startsWith(page));
  if (isAuthPage) return <>{children}</>;
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}