'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import DynamicFavicon from '@/components/DynamicFavicon';

// Agency brand resolved per host (same shape the client login uses), so an
// agent signing in on their agency's own domain sees that agency, never VoiceAI.
interface Agency {
  id: string; name: string; slug: string; logo_url: string | null;
  primary_color: string; secondary_color: string; accent_color: string;
  website_theme?: 'light' | 'dark' | 'auto' | null;
  app_name?: string | null;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function getContrastColor(hex: string): string {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#0a0a0a' : '#ffffff';
  } catch { return '#ffffff'; }
}

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://urchin-app-bqb4i.ondigitalocean.app';

// Seed the theme from the last visit so a light-themed agency never flashes dark
// before the host lookup resolves. Read after mount (not in a useState init) so
// the server and first client render match.
function getThemeHint(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  try { return localStorage.getItem('voiceai_ui_theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}

export default function AgencyLoginPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [themeHint, setThemeHint] = useState<'light' | 'dark'>('dark');
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => { setThemeHint(getThemeHint()); }, []);

  useEffect(() => {
    // Already signed in: route straight through (call centers to /cc).
    const token = localStorage.getItem('auth_token');
    const agencyStored = localStorage.getItem('agency');
    if (token && agencyStored) {
      let dest = '/agency/dashboard';
      try {
        const a = JSON.parse(agencyStored);
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (a && a.is_call_center) dest = u.role === 'agency_staff' ? '/cc/live-calls' : '/cc/dashboard';
      } catch {}
      window.location.href = dest;
      return;
    }

    const resolve = async () => {
      let resolved = false;
      try {
        const host = window.location.host;
        const pd = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'myvoiceaiconnect.com';
        const platformHosts = [pd, `www.${pd}`, 'localhost:3000', 'localhost'];
        if (!platformHosts.includes(host)) {
          const r = await fetch(`${getBackendUrl()}/api/agency/by-host?host=${host}`);
          if (r.ok) {
            const d = await r.json();
            if (d.agency) {
              setAgency(d.agency);
              resolved = true;
              try {
                localStorage.setItem('voiceai_agency_brand', JSON.stringify(d.agency));
                localStorage.setItem('voiceai_ui_theme', d.agency?.website_theme === 'dark' ? 'dark' : 'light');
              } catch {}
            }
          }
        }
      } catch {}
      // On the platform host, or if the lookup failed, fall back to the brand this
      // browser cached on a previous visit so a returning agent keeps their look.
      if (!resolved) {
        try { const cached = localStorage.getItem('voiceai_agency_brand'); if (cached) setAgency(JSON.parse(cached)); } catch {}
      }

      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get('error');
      if (errorParam) {
        const map: Record<string, string> = {
          google_auth_failed: 'Google sign-in failed. Please try again.',
          no_code: 'Google sign-in was cancelled.',
          no_email: 'Could not read an email from Google.',
          account_exists: 'An account with this email already exists.',
        };
        setError(map[errorParam] || 'Something went wrong.');
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());
      }
      setPageLoading(false);
    };
    resolve();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    window.location.href = `${getBackendUrl()}/api/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/agency/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      const data = await response.json();

      // Account exists but a password was never set: mint a fresh setup token and
      // send them to set-password instead of a dead end.
      if (!response.ok && data.error === 'Password not set') {
        try {
          const recoverRes = await fetch(`${backendUrl}/api/auth/recover-setup`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, scope: 'agency' }),
          });
          const recoverData = await recoverRes.json();
          if (recoverRes.ok && recoverData.needsSetup && recoverData.token) {
            const returnTo = encodeURIComponent('/agency/dashboard');
            window.location.href = `/auth/set-password?token=${encodeURIComponent(recoverData.token)}&returnTo=${returnTo}`;
            return;
          }
        } catch (recoverErr) { console.error('Setup recovery failed:', recoverErr); }
        setError('Invalid email or password'); setLoading(false); return;
      }

      if (!response.ok) throw new Error(data.error || data.message || 'Invalid credentials');
      if (!data.token) throw new Error('No token received from server');

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.agency) localStorage.setItem('agency', JSON.stringify(data.agency));

      // Lapsed billing: logged in, but route to Billing to reactivate.
      if (data.requires_upgrade) { window.location.href = data.redirect || '/agency/settings?tab=billing'; return; }

      // Call centers land in /cc (agents on the live board); resellers keep the
      // normal dashboard.
      if (data.agency && data.agency.is_call_center) {
        window.location.href = data.user?.role === 'agency_staff' ? '/cc/live-calls' : '/cc/dashboard';
        return;
      }
      window.location.href = '/agency/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  // Brand resolution. On a branded host we show the agency only; on the platform
  // host (no agency) we show VoiceAI Connect, Google, and the Sign Up link.
  const isBranded = !!agency;
  const brandName = agency?.name || 'VoiceAI Connect';
  const brandLogo = agency?.logo_url || (isBranded ? null : '/icon-512x512.png');
  const primaryColor = agency?.primary_color || '#10b981';
  const primaryText = getContrastColor(primaryColor);
  const isDark = isBranded ? agency?.website_theme === 'dark' : (themeHint === 'dark');

  const t = isDark ? {
    bg: '#09090b', text: '#fafaf9', textMuted: 'rgba(250,250,249,0.56)', textSubtle: 'rgba(250,250,249,0.34)',
    label: 'rgba(250,250,249,0.72)', input: 'rgba(255,255,255,0.04)', inputBorder: 'rgba(255,255,255,0.10)',
    divider: 'rgba(255,255,255,0.08)', autofillBg: '#17171a', autofillText: '#fafaf9',
    errorBg: 'rgba(239,68,68,0.12)', errorBorder: 'rgba(239,68,68,0.28)', errorText: '#fca5a5',
    googleBg: '#ffffff', googleText: '#1f2937',
  } : {
    bg: '#fbfbfa', text: '#111827', textMuted: '#6b7280', textSubtle: '#9ca3af',
    label: '#374151', input: '#ffffff', inputBorder: '#e5e7eb',
    divider: '#e5e7eb', autofillBg: '#ffffff', autofillText: '#111827',
    errorBg: '#fef2f2', errorBorder: '#fecaca', errorText: '#dc2626',
    googleBg: '#ffffff', googleText: '#1f2937',
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeHint === 'dark' ? '#09090b' : '#fbfbfa' }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: '#9ca3af' }} />
      </div>
    );
  }

  const styles = `
    input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 9999px ${t.autofillBg} inset !important;-webkit-text-fill-color:${t.autofillText} !important;border-color:${t.inputBorder} !important;transition:background-color 0s 600000s,color 0s 600000s !important}
    .ag-login input:focus{outline:none;border-color:${primaryColor} !important;box-shadow:0 0 0 3px ${primaryColor}26 !important}
    .ag-login input::placeholder{color:${t.textSubtle};opacity:1}
    .ag-login ::selection{background-color:${primaryColor};color:${primaryText}}
    @keyframes agRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .ag-rise{animation:agRise .5s cubic-bezier(.16,.84,.44,1) both}
    @media (prefers-reduced-motion: reduce){.ag-rise{animation:none}}
  `;

  // Dimensional brand wash: works on ANY brand color (lit top-left, shadowed
  // bottom-right over the flat primary), so even a single hex reads as crafted.
  const stageStyle: React.CSSProperties = {
    backgroundColor: primaryColor,
    backgroundImage: [
      'radial-gradient(130% 115% at 8% 0%, rgba(255,255,255,0.30), transparent 56%)',
      'radial-gradient(120% 120% at 100% 100%, rgba(0,0,0,0.38), transparent 58%)',
    ].join(','),
  };

  // Concentric "sound rings" — the voice/calls motif, tinted in the brand's own
  // contrast color, sitting quietly behind the logo.
  const rings = (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke={primaryText} strokeOpacity="0.14">
        {[90, 170, 250, 330, 410, 490].map((r) => (<circle key={r} cx="300" cy="300" r={r} />))}
      </g>
    </svg>
  );

  return (
    <div className="ag-login min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]" style={{ backgroundColor: t.bg, color: t.text }}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <DynamicFavicon logoUrl={agency?.logo_url} primaryColor={primaryColor} appleIconUrl="/api/agency-app-icon?size=180" />

      {/* Brand stage (desktop) */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16" style={{ ...stageStyle, color: primaryText }}>
        {rings}
        <div className="relative z-10 flex items-center gap-3">
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} className="h-10 w-auto max-w-[220px] object-contain" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }} />
          ) : (
            <span className="text-2xl font-semibold tracking-tight">{brandName}</span>
          )}
        </div>

        <div className="relative z-10 max-w-md ag-rise">
          <h2 className="text-[2.6rem] xl:text-5xl font-semibold leading-[1.05] tracking-tight">
            {brandName}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: primaryText, opacity: 0.78 }}>
            Sign in to pick up live calls, see every booking, and keep each business covered.
          </p>
        </div>

        <div className="relative z-10 text-[12px]" style={{ color: primaryText, opacity: 0.6 }}>
          {brandName}
        </div>
      </aside>

      {/* Sign-in column */}
      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16" style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top))' }}>
        {/* Compact brand header (mobile only) */}
        <div className="lg:hidden mb-10 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden" style={brandLogo ? { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff', border: `1px solid ${t.inputBorder}` } : stageStyle}>
            {brandLogo
              ? <img src={brandLogo} alt={brandName} className="h-11 w-11 object-contain" />
              : <span className="text-xl font-bold" style={{ color: primaryText }}>{brandName.charAt(0)}</span>}
          </div>
          <span className="text-lg font-semibold tracking-tight">{brandName}</span>
        </div>

        <div className="w-full max-w-sm ag-rise">
          <div className="mb-8">
            <h1 className="text-[1.75rem] font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-[15px]" style={{ color: t.textMuted }}>Sign in to your dashboard</p>
          </div>

          {!isBranded && (
            <>
              <button onClick={handleGoogleLogin} disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl px-5 py-3 text-sm font-medium transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                style={{ backgroundColor: t.googleBg, color: t.googleText, border: `1px solid ${t.inputBorder}` }}>
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
                Continue with Google
              </button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: t.divider }} /></div>
                <div className="relative flex justify-center"><span className="px-3 text-xs" style={{ backgroundColor: t.bg, color: t.textSubtle }}>or</span></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: t.label }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px]" style={{ color: t.textSubtle }} />
                <input id="email" name="email" type="email" placeholder="you@company.com" value={formData.email} onChange={handleChange} required autoComplete="email"
                  className="w-full rounded-xl pl-11 pr-4 py-3 text-sm transition-colors" style={{ backgroundColor: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }} />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: t.label }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px]" style={{ color: t.textSubtle }} />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={formData.password} onChange={handleChange} required autoComplete="current-password"
                  className="w-full rounded-xl pl-11 pr-12 py-3 text-sm transition-colors" style={{ backgroundColor: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: t.textSubtle }}>
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/auth/forgot-password" className="text-sm transition-colors hover:underline underline-offset-2" style={{ color: primaryColor }}>Forgot password?</Link>
            </div>

            {error && <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: t.errorBg, border: `1px solid ${t.errorBorder}`, color: t.errorText }}>{error}</div>}

            <button type="submit" disabled={loading || googleLoading}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-all hover:brightness-[1.05] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor, color: primaryText }}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : <>Sign in<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>
          </form>

          {!isBranded && (
            <p className="mt-8 text-center text-sm" style={{ color: t.textMuted }}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium transition-colors hover:underline underline-offset-2" style={{ color: primaryColor }}>Sign up</Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}