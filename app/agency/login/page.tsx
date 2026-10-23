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
// VoiceAI Connect brand color (emerald). Used on the platform (unbranded) login
// so it renders as true VoiceAI Connect, not a generic default.
const VAC_PRIMARY = '#10b981';

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
  // Set when the page is opened with ?switch=1 while a session already exists, so
  // we show the form (to sign in as a different agent) instead of auto-redirecting.
  const [switchingFrom, setSwitchingFrom] = useState<string | null>(null);

  useEffect(() => { setThemeHint(getThemeHint()); }, []);

  useEffect(() => {
    // Already signed in: route straight through (call centers to /cc) UNLESS the
    // link explicitly asks to switch accounts (?switch=1 or ?login=1). That lets a
    // manager open a second agent in another browser profile and reach this form
    // instead of being bounced back into the first session.
    const params0 = new URLSearchParams(window.location.search);
    const forceLogin = params0.get('switch') === '1' || params0.get('login') === '1';
    const token = localStorage.getItem('auth_token');
    const agencyStored = localStorage.getItem('agency');
    if (token && agencyStored && !forceLogin) {
      let dest = '/agency/dashboard';
      try {
        const a = JSON.parse(agencyStored);
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (a && a.is_call_center) dest = u.role === 'agency_staff' ? '/cc/live-calls' : '/cc/dashboard';
      } catch {}
      window.location.href = dest;
      return;
    }
    if (token && forceLogin) {
      try { const u = JSON.parse(localStorage.getItem('user') || '{}'); if (u && u.email) setSwitchingFrom(u.email); } catch {}
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
  const brandLogo = agency?.logo_url || (isBranded ? null : '/voiceai-connect-logo.png');
  // Tab + home-screen icon: the real VoiceAI Connect product icon on the platform
  // (never a generated mark), the agency's own on a branded host.
  const faviconSrc = agency?.logo_url || (isBranded ? null : '/icon-512x512.png');
  const appleIconSrc = isBranded ? '/api/agency-app-icon?size=180' : '/icon-512x512.png';
  const initial = (brandName.trim().charAt(0) || 'A').toUpperCase();
  const primaryColor = agency?.primary_color || VAC_PRIMARY;
  const primaryText = getContrastColor(primaryColor);
  // The platform login is the dark VoiceAI Connect brand; a branded host follows
  // its own agency theme.
  const isDark = isBranded ? agency?.website_theme === 'dark' : true;

  const c = isDark ? {
    bg: '#09090b', text: '#fafaf9', muted: 'rgba(250,250,249,0.56)', subtle: 'rgba(250,250,249,0.34)',
    label: 'rgba(250,250,249,0.72)', input: 'rgba(255,255,255,0.04)', inputBorder: 'rgba(255,255,255,0.10)',
    divider: 'rgba(255,255,255,0.08)', autofillBg: '#17171a', autofillText: '#fafaf9',
    errorBg: 'rgba(239,68,68,0.12)', errorBorder: 'rgba(239,68,68,0.28)', errorText: '#fca5a5',
    googleBg: '#ffffff', googleText: '#1f2937', monoFallbackBg: 'rgba(255,255,255,0.06)',
    // Background field (shared behind both columns)
    ring: 'rgba(255,255,255,0.07)', shade: 'rgba(0,0,0,0.5)', vignette: 'rgba(0,0,0,0.42)',
  } : {
    bg: '#fbfbfa', text: '#111827', muted: '#6b7280', subtle: '#9ca3af',
    label: '#374151', input: '#ffffff', inputBorder: '#e5e7eb',
    divider: '#ececec', autofillBg: '#ffffff', autofillText: '#111827',
    errorBg: '#fef2f2', errorBorder: '#fecaca', errorText: '#dc2626',
    googleBg: '#ffffff', googleText: '#1f2937', monoFallbackBg: '#ffffff',
    ring: 'rgba(17,24,39,0.06)', shade: 'rgba(17,24,39,0.05)', vignette: 'rgba(17,24,39,0.05)',
  };

  // One primary-tinted glow, stronger on dark, for the shared full-bleed field.
  const glowA = `${primaryColor}${isDark ? '2e' : '1c'}`;

  // CSS custom properties drive the stylesheet below, so the whole page restyles
  // from the resolved brand with no per-element inline overrides.
  const vars = {
    ['--primary' as any]: primaryColor,
    ['--primaryText' as any]: primaryText,
    ['--pGlow' as any]: `${primaryColor}26`,
    ['--bg' as any]: c.bg, ['--text' as any]: c.text, ['--muted' as any]: c.muted, ['--subtle' as any]: c.subtle,
    ['--label' as any]: c.label, ['--input' as any]: c.input, ['--inputBorder' as any]: c.inputBorder,
    ['--divider' as any]: c.divider, ['--afBg' as any]: c.autofillBg, ['--afText' as any]: c.autofillText,
    ['--errBg' as any]: c.errorBg, ['--errBorder' as any]: c.errorBorder, ['--errText' as any]: c.errorText,
    ['--gBg' as any]: c.googleBg, ['--gText' as any]: c.googleText, ['--monoBg' as any]: c.monoFallbackBg,
    ['--glowA' as any]: glowA, ['--shade' as any]: c.shade, ['--ring' as any]: c.ring, ['--vignette' as any]: c.vignette,
  } as React.CSSProperties;

  if (pageLoading) {
    return (
      <div className="al-loader" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: themeHint === 'dark' ? '#09090b' : '#fbfbfa' }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: '#9ca3af' }} />
      </div>
    );
  }

  const css = `
  .al-wrap{position:relative;min-height:100vh;display:grid;grid-template-columns:1fr;background:var(--bg);color:var(--text);font-family:inherit;overflow:hidden}
  /* Shared background field: one continuous layer behind BOTH columns, fluid edge to edge */
  .al-bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
  .al-bg>*{position:absolute;inset:0}
  .al-bg-grad{background-image:radial-gradient(70% 80% at 16% 18%,var(--glowA),transparent 60%),radial-gradient(75% 85% at 100% 100%,var(--shade),transparent 55%)}
  .al-bg-rings{width:100%;height:100%}
  .al-bg-rings circle{fill:none;stroke:var(--ring)}
  .al-bg-vignette{background:radial-gradient(135% 105% at 28% 42%,transparent 50%,var(--vignette) 100%)}
  .al-stage{display:none}
  .al-side{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:40px 24px calc(40px + env(safe-area-inset-bottom));padding-top:calc(40px + env(safe-area-inset-top))}
  .al-zone{max-width:372px;width:100%;margin:0 auto;text-align:center}
  .al-brand{display:flex;align-items:center;justify-content:center;gap:11px;margin-bottom:34px}
  .al-mono{height:40px;width:40px;border-radius:12px;background:var(--primary);color:var(--primaryText);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex:0 0 auto}
  .al-logo-img{height:40px;width:auto;max-width:190px;object-fit:contain}
  .al-bn{font-size:17px;font-weight:600;letter-spacing:-.01em;color:var(--text)}
  .al-h1{font-size:25px;line-height:1.2;font-weight:600;letter-spacing:-.02em}
  .al-sub{margin-top:7px;font-size:15px;color:var(--muted)}
  .al-form{margin-top:30px;display:flex;flex-direction:column;gap:17px;text-align:left}
  .al-form label{display:block;font-size:13.5px;font-weight:550;color:var(--label);margin-bottom:7px}
  .al-field{position:relative}
  .al-field>svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:var(--subtle)}
  .al-form input{width:100%;height:52px;border:1px solid var(--inputBorder);background:var(--input);border-radius:12px;padding:0 44px 0 42px;font-size:16px;color:var(--text);transition:border-color .15s,box-shadow .15s}
  .al-form input::placeholder{color:var(--subtle);opacity:1}
  .al-form input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px var(--pGlow)}
  .al-form input:-webkit-autofill,.al-form input:-webkit-autofill:hover,.al-form input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 9999px var(--afBg) inset !important;-webkit-text-fill-color:var(--afText) !important;border-color:var(--inputBorder) !important;transition:background-color 0s 600000s,color 0s 600000s !important}
  .al-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:0;color:var(--subtle);cursor:pointer;display:flex;padding:6px}
  .al-row{display:flex;justify-content:flex-start;margin-top:-5px}
  .al-link{font-size:13.5px;color:var(--primary);font-weight:550;text-decoration:none}
  .al-link:hover{text-decoration:underline;text-underline-offset:2px}
  .al-btn{height:52px;border:0;border-radius:12px;background:var(--primary);color:var(--primaryText);font-size:15.5px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:filter .15s,transform .05s;margin-top:3px}
  .al-btn:hover{filter:brightness(1.05)} .al-btn:active{transform:scale(.99)} .al-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;filter:none}
  .al-g{height:52px;border:1px solid var(--inputBorder);background:var(--gBg);color:var(--gText);border-radius:12px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:15px;font-weight:550;cursor:pointer;width:100%}
  .al-g:disabled{opacity:.5;cursor:not-allowed}
  .al-div{display:flex;align-items:center;gap:12px;margin:20px 0}
  .al-div:before,.al-div:after{content:"";flex:1;height:1px;background:var(--divider)}
  .al-div span{font-size:13px;color:var(--subtle)}
  .al-err{border-radius:12px;padding:12px;font-size:14px;background:var(--errBg);border:1px solid var(--errBorder);color:var(--errText);text-align:left}
  .al-foot{margin-top:28px;font-size:14.5px;color:var(--muted)}
  .al-foot a{color:var(--primary);font-weight:600;text-decoration:none}
  .al-foot a:hover{text-decoration:underline;text-underline-offset:2px}
  .al-switch{margin-top:16px;padding:11px 13px;border-radius:12px;font-size:13px;line-height:1.45;background:var(--monoBg);border:1px solid var(--inputBorder);color:var(--muted);text-align:left}
  .al-switch strong{color:var(--text);font-weight:600}
  .al-wrap ::selection{background:var(--primary);color:var(--primaryText)}
  @keyframes alRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .al-rise{animation:alRise .5s cubic-bezier(.16,.84,.44,1) both}
  @media (prefers-reduced-motion: reduce){.al-rise{animation:none}}
  @media(min-width:1024px){
    .al-wrap{grid-template-columns:1.05fr 1fr}
    .al-stage{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:center;padding:56px;overflow:hidden;color:var(--text)}
    .al-stage-center{position:relative;z-index:1;max-width:460px}
    .al-stage-logo{height:52px;width:auto;max-width:300px;object-fit:contain;display:block}
    .al-stage-name{font-size:44px;line-height:1.06;font-weight:600;letter-spacing:-.03em;color:var(--text)}
    .al-stage-tag{margin-top:26px;font-size:16px;line-height:1.5;color:var(--muted);max-width:34ch}
    .al-zone{text-align:left;max-width:384px}
    .al-brand{display:none}
    .al-h1{font-size:27px}
  }
  `;

  return (
    <div className="al-wrap" style={vars}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <DynamicFavicon logoUrl={faviconSrc} primaryColor={primaryColor} appleIconUrl={appleIconSrc} />

      {/* Shared full-bleed background, fluid edge to edge behind both columns */}
      <div className="al-bg" aria-hidden="true">
        <div className="al-bg-grad" />
        <svg className="al-bg-rings" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {[140, 260, 380, 500, 620, 740, 860].map((r) => <circle key={r} cx="330" cy="380" r={r} />)}
        </svg>
        <div className="al-bg-vignette" />
      </div>

      {/* Brand stage (desktop) */}
      <aside className="al-stage">
        <div className="al-stage-center al-rise">
          {brandLogo
            ? <img src={brandLogo} alt={brandName} className="al-stage-logo" />
            : <h2 className="al-stage-name">{brandName}</h2>}
          <p className="al-stage-tag">{isBranded ? 'Sign in to pick up live calls, see every booking, and keep each business covered.' : 'Sign in to run your white-label AI receptionist agency. Your clients, calls, and revenue in one place.'}</p>
        </div>
      </aside>

      {/* Sign-in column */}
      <main className="al-side">
        <div className="al-zone al-rise">
          <div className="al-brand">
            {brandLogo ? <img src={brandLogo} alt={brandName} className="al-logo-img" />
              : <><span className="al-mono">{initial}</span><span className="al-bn">{brandName}</span></>}
          </div>

          <h1 className="al-h1">Welcome back</h1>
          <p className="al-sub">Sign in to your dashboard</p>

          {switchingFrom && (
            <div className="al-switch">
              Signed in as <strong>{switchingFrom}</strong>. Sign in below to use a different agent. On this device it replaces that session, so to run two agents at once open this in a separate browser or a private window.
            </div>
          )}

          {!isBranded && (
            <>
              <button type="button" onClick={handleGoogleLogin} disabled={googleLoading || loading} className="al-g" style={{ marginTop: 30 }}>
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
                Continue with Google
              </button>
              <div className="al-div"><span>or</span></div>
            </>
          )}

          <form className="al-form" onSubmit={handleSubmit} style={!isBranded ? { marginTop: 0 } : undefined}>
            <div>
              <label htmlFor="email">Email</label>
              <div className="al-field">
                <Mail />
                <input id="email" name="email" type="email" placeholder="you@company.com" value={formData.email} onChange={handleChange} required autoComplete="email" />
              </div>
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <div className="al-field">
                <Lock />
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={formData.password} onChange={handleChange} required autoComplete="current-password" />
                <button type="button" className="al-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            <div className="al-row"><Link href="/auth/forgot-password" className="al-link">Forgot your password?</Link></div>

            {error && <div className="al-err">{error}</div>}

            <button type="submit" disabled={loading || googleLoading} className="al-btn">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : <>Sign in<ArrowRight className="h-[18px] w-[18px]" /></>}
            </button>
          </form>

          {!isBranded && (
            <p className="al-foot">New here? <Link href="/signup">Start your free trial</Link></p>
          )}
        </div>
      </main>
    </div>
  );
}
