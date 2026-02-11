'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { Phone, Loader2, ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff, Shield, CheckCircle2 } from 'lucide-react';
import DynamicFavicon from '@/components/DynamicFavicon';

// ============================================================================
// TYPES
// ============================================================================
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

// ============================================================================
// HELPERS
// ============================================================================
const isLightColor = (hex: string): boolean => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
};

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 
         process.env.NEXT_PUBLIC_API_URL || 
         'https://urchin-app-bqb4i.ondigitalocean.app';
};

// Waveform icon matching platform branding
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

// ============================================================================
// STEP 1: Enter Email
// ============================================================================
function EmailStep({ 
  email, setEmail, onSubmit, loading, error, 
  isDark, primaryColor, primaryLight, textColor, textMuted, textSubtle,
  inputBg, inputBorder, cardBg, cardBorder 
}: any) {
  return (
    <div 
      className="rounded-2xl p-8"
      style={{ 
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="text-center mb-8">
        <div 
          className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Mail className="h-6 w-6" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Forgot Password</h1>
        <p className="mt-3" style={{ color: textMuted }}>
          Enter your email and we&apos;ll send a verification code to your phone
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label 
            className="block text-sm font-medium mb-2" 
            style={{ color: isDark ? 'rgba(245,245,240,0.7)' : '#374151' }}
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: textSubtle }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              autoFocus
              className="w-full rounded-lg pl-11 pr-4 py-3 transition-colors focus:outline-none"
              style={{
                backgroundColor: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textColor,
              }}
            />
          </div>
        </div>

        {error && (
          <div 
            className="rounded-lg p-3 text-sm"
            style={{
              backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
              border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`,
              color: isDark ? '#f87171' : '#dc2626',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: primaryColor,
            color: primaryLight ? '#0a0a0a' : '#f5f5f0',
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending code...
            </>
          ) : (
            <>
              Send Verification Code
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// STEP 2: Enter Code + New Password
// ============================================================================
function CodeStep({ 
  code, setCode, password, setPassword, confirmPassword, setConfirmPassword,
  showPassword, setShowPassword, onSubmit, onResend, onBack,
  loading, resendLoading, resendCooldown, error, maskedPhone,
  isDark, primaryColor, primaryLight, textColor, textMuted, textSubtle,
  inputBg, inputBorder, cardBg, cardBorder 
}: any) {
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newCode = code.split('');
    newCode[index] = digit;
    setCode(newCode.join(''));

    // Auto-advance to next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setCode(pasted.padEnd(6, ' ').slice(0, 6).replace(/ /g, ''));
    
    // Focus last filled input or the next empty one
    const focusIndex = Math.min(pasted.length, 5);
    codeInputRefs.current[focusIndex]?.focus();
  };

  return (
    <div 
      className="rounded-2xl p-8"
      style={{ 
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="text-center mb-8">
        <div 
          className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Shield className="h-6 w-6" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Enter Verification Code</h1>
        <p className="mt-3" style={{ color: textMuted }}>
          We sent a 6-digit code to {maskedPhone || 'your phone'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* 6-digit code input */}
        <div>
          <label 
            className="block text-sm font-medium mb-3" 
            style={{ color: isDark ? 'rgba(245,245,240,0.7)' : '#374151' }}
          >
            Verification Code
          </label>
          <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                ref={(el) => { codeInputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[i] || ''}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                autoFocus={i === 0}
                className="w-12 h-14 text-center text-xl font-semibold rounded-lg transition-colors focus:outline-none"
                style={{
                  backgroundColor: inputBg,
                  border: `2px solid ${code[i] ? primaryColor : inputBorder}`,
                  color: textColor,
                }}
              />
            ))}
          </div>
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={onResend}
              disabled={resendLoading || resendCooldown > 0}
              className="text-sm transition-colors disabled:opacity-50"
              style={{ color: resendCooldown > 0 ? textSubtle : primaryColor }}
            >
              {resendLoading ? 'Resending...' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label 
            className="block text-sm font-medium mb-2" 
            style={{ color: isDark ? 'rgba(245,245,240,0.7)' : '#374151' }}
          >
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: textSubtle }} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full rounded-lg pl-11 pr-12 py-3 transition-colors focus:outline-none"
              style={{
                backgroundColor: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textColor,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: isDark ? 'rgba(245,245,240,0.4)' : '#9ca3af' }}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs" style={{ color: textSubtle }}>At least 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label 
            className="block text-sm font-medium mb-2" 
            style={{ color: isDark ? 'rgba(245,245,240,0.7)' : '#374151' }}
          >
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: textSubtle }} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full rounded-lg pl-11 pr-4 py-3 transition-colors focus:outline-none"
              style={{
                backgroundColor: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textColor,
              }}
            />
          </div>
        </div>

        {error && (
          <div 
            className="rounded-lg p-3 text-sm"
            style={{
              backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
              border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`,
              color: isDark ? '#f87171' : '#dc2626',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || code.replace(/ /g, '').length < 6}
          className="group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: primaryColor,
            color: primaryLight ? '#0a0a0a' : '#f5f5f0',
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            <>
              Reset Password
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 text-sm transition-colors"
          style={{ color: textMuted }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// STEP 3: Success
// ============================================================================
function SuccessStep({ 
  loginUrl, isDark, primaryColor, textColor, textMuted, cardBg, cardBorder, primaryLight
}: any) {
  return (
    <div 
      className="rounded-2xl p-8 text-center"
      style={{ 
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div 
        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${primaryColor}1A` }}
      >
        <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Password Reset!</h1>
      <p className="mb-8" style={{ color: textMuted }}>
        Your password has been updated. You can now sign in.
      </p>
      <a
        href={loginUrl}
        className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ 
          backgroundColor: primaryColor,
          color: primaryLight ? '#0a0a0a' : '#f5f5f0',
        }}
      >
        Sign In
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </a>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function ForgotPasswordContent() {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [userType, setUserType] = useState<'agency' | 'client'>('client');

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  const [agency, setAgency] = useState<Agency | null>(null);
  const [isAgencySubdomain, setIsAgencySubdomain] = useState(false);

  // Detect context (platform vs agency subdomain)
  useEffect(() => {
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
            setIsAgencySubdomain(true);
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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ---- Handlers ----

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Backend returns masked phone and a token for the reset step
      if (data.maskedPhone) setMaskedPhone(data.maskedPhone);
      if (data.resetToken) setResetToken(data.resetToken);
      if (data.userType) setUserType(data.userType);

      setResendCooldown(60);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      if (data.resetToken) setResetToken(data.resetToken);
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: code.trim(),
          password,
          resetToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ---- Theme ----

  const primaryColor = agency?.primary_color || (isAgencySubdomain ? '#2563eb' : '#10b981');
  const primaryLight = isLightColor(primaryColor);

  // On platform domain → dark theme (agency login style)
  // On agency subdomain → respect agency theme
  const isDark = isAgencySubdomain ? agency?.website_theme !== 'light' : true;

  const bgColor = isDark ? '#0a0a0a' : '#ffffff';
  const textColor = isDark ? '#f5f5f0' : '#111827';
  const textMuted = isDark ? 'rgba(245,245,240,0.5)' : '#6b7280';
  const textSubtle = isDark ? 'rgba(245,245,240,0.3)' : '#9ca3af';
  const cardBg = isDark ? '#111111' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const headerBg = isDark ? 'rgba(10,10,10,0.8)' : 'rgba(255,255,255,0.8)';
  const headerBorder = isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb';

  // Determine correct login URL
  const loginUrl = isAgencySubdomain ? '/client/login' : '/agency/login';

  const sharedStyleProps = {
    isDark, primaryColor, primaryLight, textColor, textMuted, textSubtle,
    inputBg, inputBorder, cardBg, cardBorder,
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9ca3af' }} />
      </div>
    );
  }

  // Dynamic autofill styles
  const autofillBg = isDark ? '#1a1a1a' : '#f9fafb';
  const autofillText = isDark ? '#f5f5f0' : '#111827';

  const dynamicStyles = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 9999px ${autofillBg} inset !important;
      box-shadow: 0 0 0 9999px ${autofillBg} inset !important;
      -webkit-text-fill-color: ${autofillText} !important;
      background-color: ${autofillBg} !important;
      border-color: ${inputBorder} !important;
      transition: background-color 0s 600000s, color 0s 600000s !important;
    }
    .forgot-pw input:focus {
      border-color: ${primaryColor} !important;
      box-shadow: 0 0 0 3px ${primaryColor}20 !important;
    }
    .forgot-pw input::placeholder {
      color: ${textSubtle};
      opacity: 1;
    }
  `;

  return (
    <div className="forgot-pw min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
      
      <DynamicFavicon logoUrl={agency?.logo_url} primaryColor={primaryColor} />
      
      {/* Grain overlay - dark mode only */}
      {isDark && (
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.015] z-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl"
        style={{ 
          borderBottom: `1px solid ${headerBorder}`,
          backgroundColor: headerBg,
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              {agency?.logo_url ? (
                <div
                  className="flex items-center justify-center rounded-lg overflow-hidden"
                  style={{
                    backgroundColor: agency.logo_background_color || 'transparent',
                    padding: agency.logo_background_color ? '6px' : '0',
                  }}
                >
                  <img src={agency.logo_url} alt={agency.name} className="h-9 w-9 object-contain" />
                </div>
              ) : (
                <div 
                  className="relative h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  }}
                >
                  <WaveformIcon className="h-5 w-5" />
                </div>
              )}
              <span className="text-base font-semibold tracking-tight">{agency?.name || 'VoiceAI Connect'}</span>
            </Link>
            <Link 
              href={loginUrl}
              className="text-sm transition-colors"
              style={{ color: textMuted }}
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen flex items-center justify-center px-6 py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl"
            style={{ 
              backgroundColor: primaryColor,
              opacity: isDark ? 0.07 : 0.1,
            }}
          />
        </div>

        <div className="relative w-full max-w-md">
          {step === 'email' && (
            <EmailStep
              email={email}
              setEmail={setEmail}
              onSubmit={handleEmailSubmit}
              loading={loading}
              error={error}
              {...sharedStyleProps}
            />
          )}

          {step === 'code' && (
            <CodeStep
              code={code}
              setCode={setCode}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onSubmit={handleCodeSubmit}
              onResend={handleResend}
              onBack={() => { setStep('email'); setError(''); setCode(''); }}
              loading={loading}
              resendLoading={resendLoading}
              resendCooldown={resendCooldown}
              error={error}
              maskedPhone={maskedPhone}
              {...sharedStyleProps}
            />
          )}

          {step === 'success' && (
            <SuccessStep
              loginUrl={loginUrl}
              {...sharedStyleProps}
            />
          )}

          {step !== 'success' && (
            <p className="mt-6 text-center text-sm" style={{ color: isDark ? 'rgba(245,245,240,0.4)' : '#9ca3af' }}>
              Remember your password?{' '}
              <Link href={loginUrl} className="font-medium transition-colors hover:opacity-80" style={{ color: primaryColor }}>
                Sign in
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#9ca3af' }} />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}