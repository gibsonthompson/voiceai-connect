'use client';

// ============================================================================
// Call-center dashboard shell - /cc/*
//
// A dedicated, operations-first dashboard for call-center agencies. It is a
// separate route tree (not a separate app): it reuses the same AgencyProvider,
// auth, theme engine and backend as /agency, but presents its own pages and nav.
//
// Access rules:
//   - Only call-center agencies (agency.is_call_center) belong here. A plain
//     reseller agency that lands on /cc is sent to the normal /agency dashboard.
//   - Agents (agency_staff in a call center) get a focused nav (Live Calls only)
//     and are confined to it; managers (agency_owner) get the full console.
//   - Suspended/cancelled agencies are bounced to the shared reactivation page.
// ============================================================================

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Headphones, Headset, Building2, BarChart3, Settings, LogOut, Menu, X, ChevronRight, Radio, type LucideIcon } from 'lucide-react';
import { AgencyProvider, useAgency } from '../agency/context';
import { useTheme } from '../../hooks/useTheme';
import DynamicFavicon from '@/components/DynamicFavicon';
import CcEscalationLayer from '@/components/cc/CcEscalationLayer';
import AgentPresenceBar from '@/components/cc/AgentPresenceBar';

function WaveformIcon({ className, color }: { className?: string; color?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" className={className}><rect x="2" y="9" width="2" height="6" rx="1" fill={color || 'currentColor'} opacity="0.6" /><rect x="5" y="7" width="2" height="10" rx="1" fill={color || 'currentColor'} opacity="0.8" /><rect x="8" y="4" width="2" height="16" rx="1" fill={color || 'currentColor'} /><rect x="11" y="6" width="2" height="12" rx="1" fill={color || 'currentColor'} /><rect x="14" y="3" width="2" height="18" rx="1" fill={color || 'currentColor'} /><rect x="17" y="7" width="2" height="10" rx="1" fill={color || 'currentColor'} opacity="0.8" /><rect x="20" y="9" width="2" height="6" rx="1" fill={color || 'currentColor'} opacity="0.6" /></svg>);
}

interface NavItem { href: string; label: string; icon: LucideIcon; }

function isSuspended(status: string | null | undefined): boolean {
  return status === 'suspended' || status === 'canceled' || status === 'cancelled';
}

function CallCenterShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { agency, branding, loading, user, isAgent } = useAgency();
  const theme = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const agencyIsSuspended = isSuspended(agency?.status);
  // Once loaded, send non-call-center agencies to the normal dashboard, and
  // suspended ones to reactivation. Both outside this shell.
  useEffect(() => {
    if (loading) return;
    if (agency && !agency.is_call_center) { window.location.href = '/agency/dashboard'; return; }
    if (agencyIsSuspended) { window.location.href = '/agency/reactivate'; }
  }, [loading, agency?.is_call_center, agencyIsSuspended]);

  useEffect(() => { const chk = () => setIsMobile(window.innerWidth < 768); chk(); window.addEventListener('resize', chk); return () => window.removeEventListener('resize', chk); }, []);
  useEffect(() => { setSidebarOpen(false); }, [pathname]);
  useEffect(() => { document.title = `Call Center | ${agency?.name || branding?.name || 'VoiceAI Connect'}`; }, [agency?.name]);
  useEffect(() => { document.documentElement.style.setProperty('background', theme.bg, 'important'); document.body.style.setProperty('background', theme.bg, 'important'); return () => { document.documentElement.style.removeProperty('background'); document.body.style.removeProperty('background'); }; }, [theme.bg]);

  const MANAGER_NAV: NavItem[] = [
    { href: '/cc/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cc/live-calls', label: 'Live Calls', icon: Headphones },
    { href: '/cc/businesses', label: 'Businesses', icon: Building2 },
    { href: '/cc/agents', label: 'Agents', icon: Headset },
    { href: '/cc/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/cc/settings', label: 'Settings', icon: Settings },
  ];
  const AGENT_NAV: NavItem[] = [{ href: '/cc/live-calls', label: 'Live Calls', icon: Headphones }];
  const navItems = isAgent ? AGENT_NAV : MANAGER_NAV;

  // Confine agents to their wallboard within this shell (direct-URL navigation
  // elsewhere bounces back). The per-call monitor lives at /live/* outside here.
  useEffect(() => {
    if (loading || !pathname) return;
    if (isAgent && !pathname.startsWith('/cc/live-calls')) { window.location.href = '/cc/live-calls'; }
  }, [loading, pathname, isAgent]);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');
  const handleSignOut = () => { try { localStorage.clear(); } catch {} window.location.href = '/agency/login'; };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
          <Radio className="h-4 w-4 animate-pulse" style={{ color: theme.primary }} /> Loading call center...
        </div>
      </div>
    );
  }

  // While the non-call-center / suspended redirects above run, render a plain
  // backdrop so no dashboard flashes.
  if ((agency && !agency.is_call_center) || agencyIsSuspended) {
    return <div className="min-h-screen" style={{ backgroundColor: theme.bg }} />;
  }

  const sidebar = (
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-60 flex flex-col transform transition-transform duration-300 ease-out ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`} style={{ backgroundColor: theme.sidebarBg, borderRight: `1px solid ${theme.sidebarBorder}`, paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0 }}>
      <div className="flex items-center justify-between h-16 px-5" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
        <div className="flex items-center gap-2.5 min-w-0">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} style={{ height: '28px', width: 'auto' }} className="object-contain flex-shrink-0" />
          ) : (
            <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ height: '30px', width: '30px', backgroundColor: theme.primary15 }}><WaveformIcon className="h-4 w-4" color={theme.primary} /></div>
          )}
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold truncate" style={{ color: theme.sidebarText }}>{branding.name}</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.primary }}>Call Center</p>
          </div>
        </div>
        {isMobile && <button onClick={() => setSidebarOpen(false)} className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg" style={{ color: theme.sidebarText }}><X className="h-6 w-6" /></button>}
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
        {navItems.map(item => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
              style={active ? { backgroundColor: theme.sidebarActiveItemBg, color: theme.sidebarActiveItemColor } : { color: theme.sidebarText }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = theme.sidebarHover; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
              <span className="flex items-center gap-3"><Icon className="h-5 w-5" />{item.label}</span>
              {active && <ChevronRight className="h-4 w-4 md:hidden" />}
            </Link>
          );
        })}
      </nav>

      <div className="flex-shrink-0 p-3" style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 0.75rem)' : '0.75rem' }}>
        {user && (
          <div className="px-3 py-2 mb-1 rounded-xl" style={{ backgroundColor: theme.hover }}>
            <p className="text-xs font-medium truncate" style={{ color: theme.sidebarText }}>{[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}</p>
            <p className="text-[10px] truncate" style={{ color: theme.sidebarTextMuted }}>{isAgent ? 'Agent' : 'Manager'}</p>
          </div>
        )}
        <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all" style={{ color: theme.sidebarTextMuted }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.sidebarHover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
          <LogOut className="h-5 w-5" /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {branding.logoUrl && <DynamicFavicon logoUrl={branding.logoUrl} appleIconUrl="/api/agency-app-icon?size=180" />}
      {/* Mobile header */}
      <div className="sticky top-0 z-30 md:hidden" style={{ backgroundColor: theme.sidebarBg, paddingTop: 'env(safe-area-inset-top)' }}>
        <header className="flex items-center justify-between h-16 px-4" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          <div className="flex items-center gap-2.5 min-w-0">
            {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.name} style={{ height: '30px', width: 'auto' }} className="object-contain" /> : <div className="flex items-center justify-center rounded-lg" style={{ height: '34px', width: '34px', backgroundColor: theme.primary15 }}><WaveformIcon className="h-5 w-5" color={theme.primary} /></div>}
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.primary }}>Call Center</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="w-11 h-11 -mr-2 flex items-center justify-center rounded-xl" style={{ color: theme.sidebarText }}><Menu className="h-7 w-7" /></button>
        </header>
      </div>

      {sidebarOpen && isMobile && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />}
      {sidebar}

      <main className="md:pl-60 min-h-screen" style={{ backgroundColor: theme.bg }}>
        {/* Managers see the floor at a glance; agents get their own pop + toggle. */}
        {!isAgent && <AgentPresenceBar agencyId={agency?.id} />}
        {children}
      </main>

      {/* Escalation screen-pop + presence heartbeat (self-gates to agents). */}
      <CcEscalationLayer />
    </div>
  );
}

export default function CallCenterLayout({ children }: { children: ReactNode }) {
  return (
    <AgencyProvider>
      <CallCenterShell>{children}</CallCenterShell>
    </AgencyProvider>
  );
}
