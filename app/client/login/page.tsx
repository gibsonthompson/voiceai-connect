'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Phone, Loader2, ArrowRight, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import DynamicFavicon from '@/components/DynamicFavicon';

interface Agency { id: string; name: string; slug: string; logo_url: string | null; primary_color: string; secondary_color: string; accent_color: string; website_theme?: 'light' | 'dark' | 'auto' | null; logo_background_color?: string | null; }

function getContrastColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#0a0a0a' : '#f5f5f0';
}

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://urchin-app-bqb4i.ondigitalocean.app';

// -- FLASH FIX ------------------------------------------------------------
// A freshly installed PWA has an empty storage sandbox, so on first paint the
// theme is unknown and the page would default to dark before the agency
// resolves (a dark-to-light flash on a light-themed agency). We seed the
// initial background from the cached agency theme written on a previous visit,
// and we write that cache below once the agency resolves. After the first
// visit, the root blocking script and this loader both paint the correct color
// with no flash. (First-ever install still relies on the manifest splash.)
//
// IMPORTANT: this reads localStorage, so it must NOT run in a useState
// initializer. Doing that made the client's first paint diverge from the
// server's ('dark' on the server where window is undefined, but 'light' on a
// returning visitor to a light agency), which is a server/client hydration
// mismatch and is what surfaced as the React #419 Suspense-boundary bail on
// branded hosts. themeHint now starts at the constant the server also renders
// ('dark') and is updated from cache in an effect, so the first render is
// identical on both sides. The root blocking script still handles real flash
// prevention.
function getThemeHint(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  try { return localStorage.getItem('voiceai_ui_theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}

function ClientLoginContent() {
  const searchParams = useSearchParams();
  const signupSuccess = searchParams?.get('signup') === 'success';
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [themeHint, setThemeHint] = useState<'light' | 'dark'>('dark');
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Read the cached theme AFTER mount so the server render ('dark') and the
  // client's first render match. See getThemeHint comment above (#419 fix).
  useEffect(() => { setThemeHint(getThemeHint()); }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const client = localStorage.getItem('client');
    if (token && client) { window.location.href = '/client/dashboard'; return; }
    const detectContext = async () => {
      try {
        const host = window.location.host;
        const pd = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
        const pds = [pd, `www.${pd}`, 'localhost:3000', 'localhost'];
        if (!pds.includes(host)) {
          const r = await fetch(`${getBackendUrl()}/api/agency/by-host?host=${host}`);
          if (r.ok) {
            const d = await r.json();
            setAgency(d.agency);
            // Cache the resolved theme so the next launch (root blocking script
            // and this loader) paints the right background with no flash.
            try {
              const dark = d.agency?.website_theme !== 'light';
              localStorage.setItem('voiceai_ui_theme', dark ? 'dark' : 'light');
            } catch {}
          }
        }
      } catch {} finally { setPageLoading(false); }
    };
    detectContext();
  }, []);

  // -- PWA MANIFEST FIX ---------------------------------------------------
  // Auth pages render outside ClientProvider (app/client/layout.tsx short-
  // circuits them), so the dashboard's setManifestLink never runs here and the
  // login page inherits the ROOT platform manifest. Installing "Add to Home
  // Screen" from this page would then capture the platform manifest, whose
  // start_url is the platform origin, so the installed app opens the generic
  // agency-level login where a client can't sign in.
  //
  // Point the manifest at the host-resolved client manifest instead. With no
  // clientId, /api/client-manifest still resolves THIS agency by host, so
  // start_url becomes this subdomain's /client/login. Installing from the
  // login page now yields an agency-branded PWA that opens this subdomain and
  // lands on this branded login.
  //
  // Also pin the iOS home-screen name to "VoiceAI" (per request) regardless of
  // which page the install was triggered from.
  useEffect(() => {
    try {
      document.querySelectorAll('link[rel="manifest"]').forEach(el => el.remove());
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/api/client-manifest';
      document.head.appendChild(link);

      let m = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (m) { m.setAttribute('content', 'VoiceAI'); }
      else {
        m = document.createElement('meta');
        m.setAttribute('name', 'apple-mobile-web-app-title');
        m.setAttribute('content', 'VoiceAI');
        document.head.appendChild(m);
      }
    } catch {}
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const r = await fetch(`${getBackendUrl()}/api/auth/client/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || d.message || 'Invalid credentials');
      if (!d.token) throw new Error('No token received');
      localStorage.setItem('auth_token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));
      if (d.client) localStorage.setItem('client', JSON.stringify(d.client));
      window.location.href = '/client/dashboard';
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); setLoading(false); }
  };

  const primaryColor = agency?.primary_color || '#2563eb';
  const primaryText = getContrastColor(primaryColor);
  const isDark = agency?.website_theme !== 'light';

  const t = isDark ? {
    bg: '#050505', text: '#f5f5f0', textMuted: 'rgba(245,245,240,0.5)', textSubtle: 'rgba(245,245,240,0.3)',
    textLink: 'rgba(245,245,240,0.6)', label: 'rgba(245,245,240,0.7)',
    card: 'rgba(255,255,255,0.03)', cardBorder: 'rgba(255,255,255,0.06)',
    input: 'rgba(255,255,255,0.04)', inputBorder: 'rgba(255,255,255,0.08)',
    headerBg: 'rgba(10,10,10,0.8)', headerBorder: 'rgba(255,255,255,0.05)',
    autofillBg: '#1a1a1a', autofillText: '#f5f5f0',
    errorBg: 'rgba(239,68,68,0.1)', errorBorder: 'rgba(239,68,68,0.2)', errorText: '#f87171',
    successBg: 'rgba(16,185,129,0.1)', successBorder: 'rgba(16,185,129,0.2)', successText: '#6ee7b7',
    helpText: 'rgba(245,245,240,0.4)',
  } : {
    bg: '#ffffff', text: '#111827', textMuted: '#6b7280', textSubtle: '#9ca3af',
    textLink: '#6b7280', label: '#374151',
    card: 'rgba(255,255,255,0.8)', cardBorder: 'rgba(0,0,0,0.06)',
    input: '#f9fafb', inputBorder: '#e5e7eb',
    headerBg: 'rgba(255,255,255,0.8)', headerBorder: '#e5e7eb',
    autofillBg: '#f9fafb', autofillText: '#111827',
    errorBg: '#fef2f2', errorBorder: '#fecaca', errorText: '#dc2626',
    successBg: 'rgba(16,185,129,0.1)', successBorder: 'rgba(16,185,129,0.3)', successText: '#059669',
    helpText: '#9ca3af',
  };

  // Loader paints from the cached theme hint (not a hard dark default) so a
  // light agency doesn't flash dark before the agency fetch resolves.
  if (pageLoading) {
    const hintDark = themeHint === 'dark';
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: hintDark ? '#050505' : '#ffffff' }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9ca3af' }} /></div>;
  }

  const dynamicStyles = `
    input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus,input:-webkit-autofill:active{-webkit-box-shadow:0 0 0 9999px ${t.autofillBg} inset !important;box-shadow:0 0 0 9999px ${t.autofillBg} inset !important;-webkit-text-fill-color:${t.autofillText} !important;border-color:${t.inputBorder} !important;transition:background-color 0s 600000s,color 0s 600000s !important}
    .cl-login input:focus{outline:none;border-color:${primaryColor} !important;box-shadow:0 0 0 3px ${primaryColor}20 !important}
    .cl-login ::selection{background-color:${primaryColor};color:${primaryText}}
    .cl-login input::placeholder{color:${t.textSubtle};opacity:1}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .45s ease-out both}
  `;

  return (
    <div className="cl-login min-h-screen" style={{ backgroundColor: t.bg, color: t.text }}>
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      <DynamicFavicon logoUrl={agency?.logo_url} primaryColor={primaryColor} />

      {isDark && <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />}

      {/* Header -- paddingTop clears the iOS status bar / notch in standalone PWA mode */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl" style={{ borderBottom: `1px solid ${t.headerBorder}`, backgroundColor: t.headerBg, paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              {agency?.logo_url ? (
                <div className="flex items-center justify-center rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: agency.logo_background_color || 'transparent', padding: agency.logo_background_color ? '6px' : '0' }}>
                  <img src={agency.logo_url} alt={agency.name} className="h-9 w-9 object-contain" />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: primaryColor }}><Phone className="h-4 w-4" style={{ color: primaryText }} /></div>
              )}
              <span className="text-base sm:text-lg font-medium tracking-tight truncate">{agency?.name || 'Client Portal'}</span>
            </Link>
            <Link href="/get-started" className="text-sm transition-colors whitespace-nowrap flex-shrink-0" style={{ color: t.textLink }}>
              <span className="hidden sm:inline">Don&apos;t have an account? </span>Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="relative min-h-screen flex items-center justify-center px-6 py-32" style={{ paddingTop: 'calc(8rem + env(safe-area-inset-top))' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl" style={{ backgroundColor: primaryColor, opacity: isDark ? 0.07 : 0.1 }} />
        </div>

        <div className="relative w-full max-w-md fu">
          {signupSuccess && (
            <div className="mb-6 rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: t.successBg, border: `1px solid ${t.successBorder}` }}>
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: '#10b981' }} />
              <p className="text-sm" style={{ color: t.successText }}>Account created! Check your email or SMS for password setup instructions.</p>
            </div>
          )}

          <div className="rounded-2xl p-8" style={{
            backgroundColor: t.card, border: `1px solid ${t.cardBorder}`,
            backdropFilter: isDark ? 'blur(20px)' : 'blur(12px)', WebkitBackdropFilter: isDark ? 'blur(20px)' : 'blur(12px)',
            boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="mt-2 text-[15px]" style={{ color: t.textMuted }}>Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: t.label }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: t.textSubtle }} />
                  <input name="email" type="email" placeholder="you@business.com" value={formData.email} onChange={handleChange} required autoComplete="email"
                    className="w-full rounded-xl pl-11 pr-4 py-3 transition-colors text-sm" style={{ backgroundColor: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: t.label }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: t.textSubtle }} />
                  <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} required autoComplete="current-password"
                    className="w-full rounded-xl pl-11 pr-12 py-3 transition-colors text-sm" style={{ backgroundColor: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: t.helpText }}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <Link href="/auth/forgot-password" className="text-sm" style={{ color: t.textMuted }}>Forgot password?</Link>
              </div>
              {error && <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: t.errorBg, border: `1px solid ${t.errorBorder}`, color: t.errorText }}>{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: primaryColor, color: primaryText }}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : <>Sign In<ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: t.helpText }}>
            Need help? Contact {agency?.name || 'support'} for assistance.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9ca3af' }} /></div>}>
      <ClientLoginContent />
    </Suspense>
  );
}