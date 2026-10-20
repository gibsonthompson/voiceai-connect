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

import { ReactNode, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Headphones, Headset, Building2, BarChart3, Settings, Menu, X, ChevronRight, Radio, ClipboardList, Inbox, MessageSquare, Contact, type LucideIcon } from 'lucide-react';
import { AgencyProvider, useAgency } from '../agency/context';
import { useTheme } from '../../hooks/useTheme';
import DynamicFavicon from '@/components/DynamicFavicon';
import { googleFontsHref, fontStack } from '@/lib/brandFonts';
import { navIcon, iconsHidden, type NavRoute } from '@/components/cc/navIcons';
import CcEscalationLayer from '@/components/cc/CcEscalationLayer';
import AgentPresenceBar from '@/components/cc/AgentPresenceBar';
import CcLiveCallPops from '@/components/cc/CcLiveCallPops';
import CcCommandBar from '@/components/cc/CcCommandBar';

function WaveformIcon({ className, color }: { className?: string; color?: string }) {
  return (<svg viewBox="0 0 24 24" fill="none" className={className}><rect x="2" y="9" width="2" height="6" rx="1" fill={color || 'currentColor'} opacity="0.6" /><rect x="5" y="7" width="2" height="10" rx="1" fill={color || 'currentColor'} opacity="0.8" /><rect x="8" y="4" width="2" height="16" rx="1" fill={color || 'currentColor'} /><rect x="11" y="6" width="2" height="12" rx="1" fill={color || 'currentColor'} /><rect x="14" y="3" width="2" height="18" rx="1" fill={color || 'currentColor'} /><rect x="17" y="7" width="2" height="10" rx="1" fill={color || 'currentColor'} opacity="0.8" /><rect x="20" y="9" width="2" height="6" rx="1" fill={color || 'currentColor'} opacity="0.6" /></svg>);
}

interface NavItem { href: string; label: string; icon: LucideIcon; badge?: number; perm?: string; manageTeam?: boolean; }

// Maps each nav route to the key navIcon() uses to look up the icon in the
// chosen set (components/cc/navIcons.tsx). The icon package itself (Lucide,
// Phosphor, Heroicons, Tabler, Feather, Classic, or none) comes from the
// agency's brand kit, so switching it swaps the whole icon family.
const HREF_ROUTE: Record<string, NavRoute> = {
  '/cc/dashboard': 'dashboard',
  '/cc/live-calls': 'live',
  '/cc/calls': 'calls',
  '/cc/messages': 'messages',
  '/cc/sms': 'texts',
  '/cc/contacts': 'contacts',
  '/cc/businesses': 'businesses',
  '/cc/agents': 'agents',
  '/cc/analytics': 'analytics',
  '/cc/settings': 'settings',
};

function isSuspended(status: string | null | undefined): boolean {
  return status === 'suspended' || status === 'canceled' || status === 'cancelled';
}

function CallCenterShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { agency, branding, loading, user, isAgent, hasPermission, canManageTeam } = useAgency();
  const theme = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openFollowups, setOpenFollowups] = useState(0);
  const [unreadTexts, setUnreadTexts] = useState(0);
  // New-text toast: a call center works every inbound text in this dashboard
  // (the business owner is not texted), so a new text has to be visible here.
  const [textToast, setTextToast] = useState<{ caller: string | null; businessName: string; preview: string | null; conversationId: string } | null>(null);
  const lastTextAtRef = useRef<string | null>(null);
  const firstTextLoadRef = useRef(true);

  // Poll the open follow-up count + unread text count so the Messages and Texts
  // nav items show live backlog badges, and raise a toast when a new text lands.
  // All best-effort. Texts are async, so a short poll is the right, reliable
  // signal (no fragile stream), and it reaches managers and agents the same way.
  useEffect(() => {
    if (loading || !agency?.id || !agency.is_call_center) return;
    let stop = false;
    const token = () => localStorage.getItem('auth_token');
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    const load = async () => {
      try {
        const r = await fetch(`${base}/api/agency/${agency.id}/cc/messages/count`, { headers: { Authorization: `Bearer ${token()}` } });
        if (r.ok) { const d = await r.json(); if (!stop && d.success) setOpenFollowups(d.open || 0); }
      } catch { /* badge is best-effort */ }
      try {
        const r = await fetch(`${base}/api/agency/${agency.id}/cc/sms/unread`, { headers: { Authorization: `Bearer ${token()}` } });
        if (r.ok) {
          const d = await r.json();
          if (!stop && d.success) {
            setUnreadTexts(d.unread || 0);
            const at: string | null = d.latest?.at || null;
            if (firstTextLoadRef.current) {
              // Don't toast the backlog already waiting when the dashboard opens.
              firstTextLoadRef.current = false;
              lastTextAtRef.current = at;
            } else if (at && at !== lastTextAtRef.current && (!lastTextAtRef.current || new Date(at) > new Date(lastTextAtRef.current))) {
              lastTextAtRef.current = at;
              // Don't interrupt someone already working the Texts inbox.
              if (d.latest && !(pathname || '').startsWith('/cc/sms')) {
                setTextToast({ caller: d.latest.caller || null, businessName: d.latest.businessName || 'A business', preview: d.latest.preview || null, conversationId: d.latest.conversationId });
              }
            }
          }
        }
      } catch { /* badge is best-effort */ }
    };
    load();
    const iv = setInterval(load, 15000);
    return () => { stop = true; clearInterval(iv); };
  }, [loading, agency?.id, agency?.is_call_center]);

  // Auto-dismiss the new-text toast after a few seconds.
  useEffect(() => {
    if (!textToast) return;
    const t = setTimeout(() => setTextToast(null), 9000);
    return () => clearTimeout(t);
  }, [textToast]);

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

  // AI brand fonts: load the agency's chosen display + body fonts from Google
  // Fonts and expose them as CSS vars the .cc-shell rules (globals.css) apply.
  // Scoped to the cc dashboard, cleaned up on unmount, and all best-effort so a
  // missing/unknown font just falls back to Geist.
  const displayFont = agency?.display_font || null;
  const bodyFont = agency?.body_font || null;
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-display', fontStack(displayFont, 'display'));
    root.style.setProperty('--brand-body', fontStack(bodyFont, 'body'));
    const href = googleFontsHref([displayFont, bodyFont]);
    let link: HTMLLinkElement | null = null;
    if (href) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.id = 'cc-brand-fonts';
      link.href = href;
      document.head.appendChild(link);
    }
    return () => {
      root.style.removeProperty('--brand-display');
      root.style.removeProperty('--brand-body');
      if (link && link.parentNode) link.parentNode.removeChild(link);
    };
  }, [displayFont, bodyFont]);

  // Nav icon weight from the brand kit (fine / regular / bold).
  // Nav icon style: a Phosphor weight (outline / thin / bold / solid / duotone)
  // or no icons at all (text-only nav).
  const noIcons = iconsHidden(agency?.icon_style);
  const LogoutIcon = navIcon(agency?.icon_style, 'signout');

  // Manager/owner nav. Each item declares what grants it: `perm` is a Page Access
  // key, `manageTeam` means it needs the manage-team right (the owner always has
  // it). Core live-ops tabs (live calls, calls, messages) are always shown. The
  // owner sees everything; a manager sees only what their permissions allow.
  const MANAGER_NAV: NavItem[] = [
    { href: '/cc/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard' },
    { href: '/cc/live-calls', label: 'Live Calls', icon: Headphones },
    { href: '/cc/calls', label: 'Calls', icon: ClipboardList },
    { href: '/cc/messages', label: 'Callbacks', icon: Inbox, badge: openFollowups },
    { href: '/cc/sms', label: 'Texts', icon: MessageSquare, badge: unreadTexts },
    { href: '/cc/contacts', label: 'Contacts', icon: Contact },
    { href: '/cc/businesses', label: 'Businesses', icon: Building2, perm: 'clients' },
    { href: '/cc/agents', label: 'Agents', icon: Headset, manageTeam: true },
    { href: '/cc/analytics', label: 'Analytics', icon: BarChart3, perm: 'analytics' },
    { href: '/cc/settings', label: 'Settings', icon: Settings, perm: 'settings' },
  ];
  // Agents get their wallboard, the call history, and the follow-up inbox - all
  // scoped to the businesses assigned to them.
  const AGENT_NAV: NavItem[] = [
    { href: '/cc/live-calls', label: 'Live Calls', icon: Headphones },
    { href: '/cc/calls', label: 'Calls', icon: ClipboardList },
    { href: '/cc/messages', label: 'Callbacks', icon: Inbox, badge: openFollowups },
    { href: '/cc/sms', label: 'Texts', icon: MessageSquare, badge: unreadTexts },
    { href: '/cc/contacts', label: 'Contacts', icon: Contact },
    { href: '/cc/settings', label: 'Settings', icon: Settings },
  ];
  const canSeeNav = (item: NavItem) => {
    if (item.manageTeam) return canManageTeam;
    if (item.perm) return hasPermission(item.perm);
    return true;
  };
  const navItems = isAgent ? AGENT_NAV : MANAGER_NAV.filter(canSeeNav);

  // Sub-pages that live under a nav item but have their own route keep that nav
  // item highlighted, and inherit that item's access. Branding deep-links from
  // Settings, so it both lights Settings and requires the settings permission.
  const NAV_SUBPAGES: Record<string, string[]> = { '/cc/settings': ['/cc/branding'] };

  // Confinement. Agents are limited to their live-ops pages. Managers are limited
  // to the tabs their permissions grant (the owner's grants cover everything, so
  // the owner is never redirected). A direct URL to a forbidden tab bounces to
  // the first page the user can actually see.
  useEffect(() => {
    if (loading || !pathname || !user) return;
    if (isAgent) {
      const agentAllowed = pathname.startsWith('/cc/live-calls') || pathname.startsWith('/cc/calls') || pathname.startsWith('/cc/messages') || pathname.startsWith('/cc/sms') || pathname.startsWith('/cc/contacts') || pathname.startsWith('/cc/settings');
      if (!agentAllowed) window.location.href = '/cc/live-calls';
      return;
    }
    // Manager/owner: build the set of allowed path roots from the visible nav
    // (plus each item's declared subpages) and bounce anything outside it.
    const allowed = navItems.flatMap((i) => [i.href, ...(NAV_SUBPAGES[i.href] || [])]);
    const ok = allowed.some((h) => pathname === h || pathname.startsWith(h + '/'));
    if (!ok && navItems.length) window.location.href = navItems[0].href;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pathname, isAgent, canManageTeam, user?.id, JSON.stringify(user?.permissions || {})]);
  const isActive = (href: string) => {
    if (pathname === href || pathname?.startsWith(href + '/')) return true;
    const subs = NAV_SUBPAGES[href];
    return !!(subs && subs.some((s) => pathname === s || pathname?.startsWith(s + '/')));
  };
  const handleSignOut = () => { try { localStorage.clear(); } catch {} window.location.href = '/agency/login'; };

  if (loading) {
    // Theme-neutral: no explicit background (inherit the html bg the pre-paint
    // script already set to the correct light/dark), and a neutral gray spinner
    // instead of theme.primary, which falls back to the platform brand color
    // before the agency theme resolves and flashed VoiceAI Connect colors here.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
          <Radio className="h-4 w-4 animate-pulse" style={{ color: '#9ca3af' }} /> Loading call center...
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
    <aside className={`cc-shell cc-brand-display fixed inset-y-0 left-0 z-50 w-72 md:w-60 flex flex-col transform transition-transform duration-300 ease-out ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`} style={{ backgroundColor: theme.sidebarBg, borderRight: `1px solid ${theme.sidebarBorder}`, paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0 }}>
      <div className="flex items-center justify-between h-16 px-5" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
        {/* White-label brand: when a logo is set, show the logo ONLY (bigger, no
            name and no "Call Center" text beside it). With no logo, fall back to
            the mark plus the call-center name so the sidebar is never blank. */}
        <div className="flex items-center gap-2.5 min-w-0">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} style={{ height: '52px', width: 'auto', maxWidth: '196px' }} className="object-contain flex-shrink-0" />
          ) : (
            <>
              <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ height: '38px', width: '38px', backgroundColor: theme.primary15 }}><WaveformIcon className="h-5 w-5" color={theme.primary} /></div>
              <p className="text-sm font-semibold truncate min-w-0" style={{ color: theme.sidebarText }}>{branding.name}</p>
            </>
          )}
        </div>
        {isMobile && <button onClick={() => setSidebarOpen(false)} className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg" style={{ color: theme.sidebarText }}><X className="h-6 w-6" /></button>}
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
        {navItems.map(item => {
          const active = isActive(item.href);
          const NavIcon = navIcon(agency?.icon_style, HREF_ROUTE[item.href]);
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
              style={active ? { backgroundColor: theme.sidebarActiveItemBg, color: theme.sidebarActiveItemColor } : { color: theme.sidebarText }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = theme.sidebarHover; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
              <span className="flex items-center gap-3">{!noIcons && NavIcon && <NavIcon size={20} />}{item.label}</span>
              {item.badge ? (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : (active && <ChevronRight className="h-4 w-4 md:hidden" />)}
            </Link>
          );
        })}
      </nav>

      <div className="flex-shrink-0 p-3" style={{ paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 0.75rem)' : '0.75rem' }}>
        <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all" style={{ color: theme.sidebarTextMuted }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = theme.sidebarHover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
          {!noIcons && LogoutIcon && <LogoutIcon size={20} />} Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Favicon + home-screen icon from the agency's OWN branding in context.
          The square app icon (a data URL composited at upload) is the ideal tab
          favicon; fall back to the logo. We use context, not the host-resolving
          /api/agency-app-icon endpoint, because the dashboard is served on hosts
          that don't match the agency's subdomain, where that endpoint falls back
          to a generic initial tile. */}
      {(agency?.app_icon_url || branding.logoUrl) && (
        <DynamicFavicon
          logoUrl={branding.logoUrl}
          faviconUrl={agency?.app_icon_url || branding.logoUrl}
          appleIconUrl={agency?.app_icon_url || branding.logoUrl}
        />
      )}
      {/* Mobile header */}
      <div className="sticky top-0 z-30 md:hidden" style={{ backgroundColor: theme.sidebarBg, paddingTop: 'env(safe-area-inset-top)' }}>
        <header className="flex items-center justify-between h-16 px-4" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          <div className="flex items-center gap-2.5 min-w-0">
            {branding.logoUrl ? <img src={branding.logoUrl} alt={branding.name} style={{ height: '48px', width: 'auto', maxWidth: '190px' }} className="object-contain" /> : <><div className="flex items-center justify-center rounded-lg" style={{ height: '34px', width: '34px', backgroundColor: theme.primary15 }}><WaveformIcon className="h-5 w-5" color={theme.primary} /></div><span className="text-sm font-semibold truncate" style={{ color: theme.sidebarText }}>{branding.name}</span></>}
          </div>
          <button onClick={() => setSidebarOpen(true)} className="w-11 h-11 -mr-2 flex items-center justify-center rounded-xl" style={{ color: theme.sidebarText }}><Menu className="h-7 w-7" /></button>
        </header>
      </div>

      {sidebarOpen && isMobile && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />}
      {sidebar}

      <main className="cc-shell md:pl-60 min-h-screen" style={{ backgroundColor: theme.bg }}>
        {/* Managers see the floor at a glance; agents get their own pop + toggle. */}
        {!isAgent && <AgentPresenceBar agencyId={agency?.id} />}
        {/* Omni-search / command palette: managers only (self-gates internally). */}
        {!isAgent && <CcCommandBar />}
        {children}
      </main>

      {/* Escalation screen-pop + presence heartbeat (self-gates to agents). */}
      <CcEscalationLayer />

      {/* Live-call pop-ups for managers AND agents: a card for every call in
          progress (scoped server-side, so an agent only sees their assigned
          businesses) on any /cc page, always visible no matter the tab, plus
          desktop alerts for new calls even on another tab. */}
      <CcLiveCallPops agencyId={agency?.id} />

      {/* New-text toast. A call center works every inbound text in here, so a new
          one is surfaced to whoever is on the dashboard (manager or agent), with
          a tap straight into that thread. */}
      {textToast && (
        <div className="fixed z-[95] right-4 bottom-4 w-[320px] max-w-[calc(100vw-2rem)]">
          <Link
            href={`/cc/sms?c=${encodeURIComponent(textToast.conversationId)}`}
            onClick={() => setTextToast(null)}
            className="block rounded-2xl p-3.5 shadow-xl transition"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: theme.primary15 }}>
                <MessageSquare className="h-5 w-5" style={{ color: theme.primary }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate" style={{ color: theme.text }}>
                  New text{textToast.caller ? ` from ${textToast.caller}` : ''}
                </p>
                <p className="text-[11.5px] truncate" style={{ color: theme.textMuted }}>{textToast.businessName}</p>
                {textToast.preview && <p className="text-[12.5px] mt-1 truncate" style={{ color: theme.textMuted }}>{textToast.preview}</p>}
                <p className="text-[11px] mt-1.5 font-medium" style={{ color: theme.primary }}>Tap to reply</p>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTextToast(null); }}
                className="flex-shrink-0 -mt-1 -mr-1 p-1 rounded-lg"
                style={{ color: theme.textSubtle }}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Link>
        </div>
      )}
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