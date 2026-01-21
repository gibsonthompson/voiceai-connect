'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Phone, Users, DollarSign, PhoneCall, 
  Settings, LogOut, TrendingUp, Search, 
  Plus, ChevronRight, Filter, Sun, Moon
} from 'lucide-react';

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  name: string;
}

interface ClientsPageClientProps {
  branding: Branding;
  agency: any;
  clients: any[];
}

// Helper to determine if a color is light
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

// Darken a color
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

// Add alpha to hex color
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ClientsPageClient({
  branding,
  agency,
  clients,
}: ClientsPageClientProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Load preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-theme');
    if (saved) {
      setDarkMode(saved === 'dark');
    }
  }, []);

  // Save preference
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('dashboard-theme', newMode ? 'dark' : 'light');
  };

  // Theme colors
  const theme = {
    bg: darkMode ? '#0a0a0a' : '#f8f8f6',
    text: darkMode ? '#f5f5f0' : '#1a1a1a',
    textMuted: darkMode ? 'rgba(245, 245, 240, 0.5)' : 'rgba(26, 26, 26, 0.5)',
    textMuted2: darkMode ? 'rgba(245, 245, 240, 0.3)' : 'rgba(26, 26, 26, 0.3)',
    textMuted4: darkMode ? 'rgba(245, 245, 240, 0.4)' : 'rgba(26, 26, 26, 0.4)',
    textMuted6: darkMode ? 'rgba(245, 245, 240, 0.6)' : 'rgba(26, 26, 26, 0.6)',
    textMuted7: darkMode ? 'rgba(245, 245, 240, 0.7)' : 'rgba(26, 26, 26, 0.7)',
    border: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    cardBg: darkMode ? '#111' : 'rgba(255, 255, 255, 0.8)',
    inputBg: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    hoverBg: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
  };

  // Brand colors
  const primaryLight = isLightColor(branding.primaryColor);
  const sidebarBg = darkenColor(branding.primaryColor, 65);
  const primaryBg = hexToRgba(branding.primaryColor, 0.1);
  const accentBg = hexToRgba(branding.accentColor, 0.1);

  const navItems = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: TrendingUp, active: false },
    { href: '/agency/clients', label: 'Clients', icon: Users, active: true },
    { href: '/agency/revenue', label: 'Revenue', icon: DollarSign, active: false },
    { href: '/agency/settings', label: 'Settings', icon: Settings, active: false },
  ];

  const getPlanPrice = (planType: string) => {
    switch (planType) {
      case 'starter':
        return agency.price_starter || 4900;
      case 'pro':
        return agency.price_pro || 9900;
      case 'growth':
        return agency.price_growth || 14900;
      default:
        return 0;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399' };
      case 'trial':
        return { backgroundColor: accentBg, color: branding.accentColor };
      case 'past_due':
        return { backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' };
      case 'suspended':
      case 'cancelled':
        return { backgroundColor: 'rgba(248, 113, 113, 0.1)', color: '#f87171' };
      default:
        return { backgroundColor: theme.inputBg, color: theme.textMuted6 };
    }
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || 
      client.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || client.subscription_status === statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Subtle grain overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Theme Toggle - Top Right */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full border transition-all hover:scale-105"
        style={{ 
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
        }}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <Sun className="h-4 w-4" style={{ color: theme.text }} />
        ) : (
          <Moon className="h-4 w-4" style={{ color: theme.text }} />
        )}
      </button>

      {/* Sidebar with brand colors - always dark */}
      <aside 
        className="fixed inset-y-0 left-0 z-40 w-64 border-r transition-colors duration-200"
        style={{ 
          backgroundColor: sidebarBg,
          borderColor: hexToRgba(branding.primaryColor, 0.2),
        }}
      >
        <div 
          className="flex h-16 items-center gap-3 border-b px-6"
          style={{ borderColor: hexToRgba(branding.primaryColor, 0.2) }}
        >
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Phone className="h-4 w-4" style={{ color: primaryLight ? '#0a0a0a' : '#f5f5f0' }} />
            </div>
          )}
          <span className="font-medium text-[#f5f5f0] truncate">{branding.name}</span>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: item.active ? hexToRgba(branding.primaryColor, 0.3) : 'transparent',
                color: item.active ? '#f5f5f0' : 'rgba(245, 245, 240, 0.6)',
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div 
          className="absolute bottom-0 left-0 right-0 border-t p-4"
          style={{ borderColor: hexToRgba(branding.primaryColor, 0.2) }}
        >
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium tracking-tight">Clients</h1>
              <p className="mt-1" style={{ color: theme.textMuted }}>{clients.length} total clients</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted4 }} />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-lg border pl-10 pr-4 py-2 text-sm transition-colors focus:outline-none"
                  style={{ 
                    borderColor: theme.border,
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                  }}
                />
              </div>
              
              {/* Filter */}
              <select
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value || null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus:outline-none"
                style={{ 
                  borderColor: theme.border,
                  backgroundColor: theme.inputBg,
                  color: theme.textMuted7,
                }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="past_due">Past Due</option>
                <option value="suspended">Suspended</option>
              </select>
              
              {/* Add Client */}
              <button 
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: branding.primaryColor,
                  color: primaryLight ? '#0a0a0a' : '#f5f5f0',
                }}
              >
                <Plus className="h-4 w-4" />
                Add Client
              </button>
            </div>
          </div>

          {/* Clients List */}
          <div 
            className="rounded-xl border transition-colors"
            style={{ 
              borderColor: theme.border,
              backgroundColor: theme.cardBg,
            }}
          >
            {filteredClients.length === 0 ? (
              <div className="py-20 text-center">
                <div 
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: primaryBg }}
                >
                  <Users className="h-8 w-8" style={{ color: branding.primaryColor }} />
                </div>
                <p className="mt-4 font-medium" style={{ color: theme.textMuted7 }}>
                  {searchQuery || statusFilter ? 'No clients match your search' : 'No clients yet'}
                </p>
                <p className="text-sm" style={{ color: theme.textMuted4 }}>
                  {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Share your signup link to get started!'}
                </p>
              </div>
            ) : (
              <div>
                {/* Table Header */}
                <div 
                  className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-medium uppercase tracking-wide border-b"
                  style={{ color: theme.textMuted4, borderColor: theme.border }}
                >
                  <div className="col-span-4">Business</div>
                  <div className="col-span-2">Plan</div>
                  <div className="col-span-2">Calls</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Added</div>
                </div>
                
                {/* Table Rows */}
                {filteredClients.map((client, index) => (
                  <Link
                    key={client.id}
                    href={`/agency/clients/${client.id}`}
                    className="grid grid-cols-12 gap-4 items-center px-6 py-4 transition-colors"
                    style={{ 
                      borderTop: index > 0 ? `1px solid ${theme.border}` : 'none',
                    }}
                  >
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: primaryBg }}
                        >
                          <span className="text-sm font-medium" style={{ color: branding.primaryColor }}>
                            {client.business_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{client.business_name}</p>
                          <p className="text-sm" style={{ color: theme.textMuted }}>{client.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <p className="text-sm capitalize">{client.plan_type || 'starter'}</p>
                      <p className="text-xs" style={{ color: theme.textMuted4 }}>
                        ${(getPlanPrice(client.plan_type) / 100).toFixed(0)}/mo
                      </p>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-4 w-4" style={{ color: theme.textMuted4 }} />
                        <span className="text-sm">{client.calls_this_month || 0}</span>
                        <span className="text-xs" style={{ color: theme.textMuted4 }}>this month</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <span 
                        className="inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize"
                        style={getStatusStyle(client.subscription_status || client.status)}
                      >
                        {client.subscription_status || client.status}
                      </span>
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="text-sm" style={{ color: theme.textMuted }}>
                        {new Date(client.created_at).toLocaleDateString()}
                      </span>
                      <ChevronRight className="h-4 w-4" style={{ color: theme.textMuted2 }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}