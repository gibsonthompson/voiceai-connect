'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Phone, Loader2, ArrowRight, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import DynamicFavicon from '@/components/DynamicFavicon';

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  website_theme?: 'light' | 'dark' | 'auto' | null;
  logo_background_color?: string | null;
}

function getContrastColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#0a0a0a' : '#f5f5f0';
}

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://urchin-app-bqb4i.ondigitalocean.app';
};

function ClientLoginContent() {
  const searchParams = useSearchParams();
  const signupSuccess = searchParams.get('signup') === 'success';
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const client = localStorage.getItem('client');
    if (token && client) { window.location.href = '/client/dashboard'; return; }

    const detectContext = async () => {
      try {
        const host = window.location.host;
        const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
        const platformDomains = [platformDomain, `www.${platformDomain}`, 'localhost:3000', 'localhost'];
        if (!platformDomains.includes(host)) {
          const backendUrl = getBackendUrl();
          const response = await fetch(`${backendUrl}/api/agency/by-host?host=${host}`);
          if (response.ok) {
            const data = await response.json();
            setAgency(data.agency);
          }
        }
      } catch (err) {
        console.error('Failed to detect context:', err);
      } finally {
        setPageLoading(false);
      }
    };
    detectContext();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/client/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Invalid credentials');
      if (!data.token) throw new Error('No token received from server');
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.client) localStorage.setItem('client', JSON.stringify(data.client));
      window.location.href = '/client/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const primaryColor = agency?.primary_color || '#2563eb';
  const primaryText = getContrastColor(primaryColor);
  const isDark = agency?.website_theme !== 'light';

  // Local theme (this page is outside ClientProvider)
  const theme = isDark ? {
    bg: '#0a0a0a',
    text: '#f5f5f0',
    textMuted: 'rgba(245,245,240,0.5)',
    textSubtle: 'rgba(245,245,240,0.3)',
    textLink: 'rgba(245,245,240,0.6)',
    textLinkHover: '#f5f5f0',
    label: 'rgba(245,245,240,0.7)',
    card: '#111111',
    cardBorder: 'rgba(255,255,255,0.1)',
    input: 'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(255,255,255,0.1)',
    headerBg: 'rgba(10,10,10,0.8)',
    headerBorder: 'rgba(255,255,255,0.05)',
    autofillBg: '#1a1a1a',
    autofillText: '#f5f5f0',
    errorBg: 'rgba(239,68,68,0.1)',
    errorBorder: 'rgba(239,68,68,0.2)',
    errorText: '#f87171',
    successBg: 'rgba(16,185,129,0.1)',
    successBorder: 'rgba(16,185,129,0.2)',
    successText: '#6ee7b7',
    helpText: 'rgba(245,245,240,0.4)',
  } : {
    bg: '#ffffff',
    text: '#111827',
    textMuted: '#6b7280',
    textSubtle: '#9ca3af',
    textLink: '#6b7280',
    textLinkHover: '#111827',
    label: '#374151',
    card: '#ffffff',
    cardBorder: '#e5e7eb',
    input: '#f9fafb',
    inputBorder: '#e5e7eb',
    headerBg: 'rgba(255,255,255,0.8)',
    headerBorder: '#e5e7eb',
    autofillBg: '#f9fafb',
    autofillText: '#111827',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    errorText: '#dc2626',
    successBg: 'rgba(16,185,129,0.1)',
    successBorder: 'rgba(16,185,129,0.3)',
    successText: '#059669',
    helpText: '#9ca3af',
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9ca3af' }} />
      </div>
    );
  }

  const dynamicStyles = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 9999px ${theme.autofillBg} inset !important;
      box-shadow: 0 0 0 9999px ${theme.autofillBg} inset !important;
      -webkit-text-fill-color: ${theme.autofillText} !important;
      background-color: ${theme.autofillBg} !important;
      border-color: ${theme.inputBorder} !important;
      caret-color: ${theme.autofillText} !important;
      transition: background-color 0s 600000s, color 0s 600000s !important;
    }
    .client-login input:focus {
      outline: none;
      border-color: ${primaryColor} !important;
      box-shadow: 0 0 0 3px ${primaryColor}20 !important;
    }
    .client-login ::selection {
      background-color: ${primaryColor};
      color: ${primaryText};
    }
    .client-login ::-moz-selection {
      background-color: ${primaryColor};
      color: ${primaryText};
    }
    .client-login input::placeholder {
      color: ${theme.textSubtle};
      opacity: 1;
    }
  `;

  return (
    <div className="client-login min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      <DynamicFavicon logoUrl={agency?.logo_url} primaryColor={primaryColor} />
      
      {isDark && (
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
        />
      )}

      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl" style={{ borderBottom: `1px solid ${theme.headerBorder}`, backgroundColor: theme.headerBg }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {agency?.logo_url ? (
                <div className="flex items-center justify-center rounded-lg overflow-hidden" style={{ backgroundColor: agency.logo_background_color || 'transparent', padding: agency.logo_background_color ? '6px' : '0' }}>
                  <img src={agency.logo_url} alt={agency.name} className="h-9 w-9 object-contain" />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: primaryColor }}>
                  <Phone className="h-4 w-4" style={{ color: primaryText }} />
                </div>
              )}
              <span className="text-lg font-medium tracking-tight">{agency?.name || 'Client Portal'}</span>
            </Link>
            <Link 
              href="/get-started" 
              className="text-sm transition-colors"
              style={{ color: theme.textLink }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.textLinkHover}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.textLink}
            >
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="relative min-h-screen flex items-center justify-center px-6 py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl" style={{ backgroundColor: primaryColor, opacity: isDark ? 0.07 : 0.1 }} />
        </div>

        <div className="relative w-full max-w-md">
          {signupSuccess && (
            <div className="mb-6 rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: theme.successBg, border: `1px solid ${theme.successBorder}` }}>
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: '#10b981' }} />
              <p className="text-sm" style={{ color: theme.successText }}>Account created! Check your email or SMS for password setup instructions.</p>
            </div>
          )}

          <div className="rounded-2xl p-8" style={{ backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-medium tracking-tight">Welcome back</h1>
              <p className="mt-2" style={{ color: theme.textMuted }}>Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.label }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: theme.textSubtle }} />
                  <input name="email" type="email" placeholder="you@business.com" value={formData.email} onChange={handleChange} required autoComplete="email"
                    className="w-full rounded-lg pl-11 pr-4 py-3 transition-colors"
                    style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.label }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: theme.textSubtle }} />
                  <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} required autoComplete="current-password"
                    className="w-full rounded-lg pl-11 pr-12 py-3 transition-colors"
                    style={{ backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: theme.helpText }}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link href="/auth/forgot-password" className="text-sm transition-colors" style={{ color: theme.textMuted }}>Forgot password?</Link>
              </div>

              {error && (
                <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: theme.errorBg, border: `1px solid ${theme.errorBorder}`, color: theme.errorText }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor, color: primaryText }}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</>
                ) : (
                  <>Sign In<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: theme.helpText }}>
            Need help? Contact {agency?.name || 'support'} for assistance.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9ca3af' }} />
      </div>
    }>
      <ClientLoginContent />
    </Suspense>
  );
}