'use client';

import { useState, useEffect } from 'react';
import { 
  Phone, PhoneCall, Clock, Copy, 
  ChevronRight, CheckCircle,
  Loader2, PhoneOff, TrendingUp, ArrowUpRight,
  PhoneForwarded, ShieldX, Sparkles
} from 'lucide-react';
import { useClientTheme } from '@/hooks/useClientTheme';

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  agencyName: string;
  businessName?: string;
  supportEmail: string | null;
  supportPhone: string | null;
  websiteTheme?: 'light' | 'dark' | 'auto';
  clientHeaderMode?: 'agency_name' | 'business_name';
}

interface Stats {
  callsToday: number;
  callsThisMonth: number;
  highUrgency: number;
  callLimit: number;
  trialDaysLeft: number | null;
}

export interface ClientDashboardClientProps {
  client: any;
  branding: Branding;
  recentCalls: any[];
  stats: Stats;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  if (phone.startsWith('+')) return phone;
  return phone;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const callDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - callDay.getTime()) / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  if (diffDays < 7) return `${date.toLocaleDateString('en-US', { weekday: 'long' })}, ${timeStr}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(ownerName: string | null | undefined): string {
  if (!ownerName) return '';
  return ownerName.split(' ')[0];
}

export function ClientDashboardClient({
  client,
  branding,
  recentCalls,
  stats,
}: ClientDashboardClientProps) {
  const [copied, setCopied] = useState(false);
  const theme = useClientTheme();

  const copyPhoneNumber = () => {
    if (client.vapi_phone_number) {
      navigator.clipboard.writeText(client.vapi_phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpgrade = () => {
    window.location.href = '/client/upgrade';
  };

  const hasPhoneNumber = !!client.vapi_phone_number;
  const hasAssistant = !!client.vapi_assistant_id;
  const isProvisioned = hasPhoneNumber && hasAssistant;
  const isProvisioningPending = !isProvisioned && client.subscription_status !== 'cancelled';
  const formattedPhone = formatPhoneNumber(client.vapi_phone_number);
  const isUnlimited = stats.callLimit === -1;
  const firstName = getFirstName(client.owner_name);
  const greeting = getGreeting();

  // Usage percentage for the progress ring
  const usagePercent = isUnlimited ? 0 : stats.callLimit > 0 ? Math.min(100, (stats.callsThisMonth / stats.callLimit) * 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (usagePercent / 100) * circumference;

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .call-link-hover { transition: background-color 0.15s ease; }
        .call-link-hover:hover { background-color: ${theme.hover} !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease-out forwards; opacity: 0; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.1s; }
        .fade-up-3 { animation-delay: 0.15s; }
        .fade-up-4 { animation-delay: 0.2s; }
      `}} />

      {/* ================================================================
          HERO HEADER — Personalized greeting with business context
          ================================================================ */}
      <div className="mb-6 sm:mb-8 fade-up fade-up-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight" style={{ color: theme.text }}>
              {greeting}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1 text-sm sm:text-base" style={{ color: theme.textMuted }}>
              Here&apos;s how {client.business_name || 'your business'} is doing today.
            </p>
          </div>

          {/* Business logo badge — desktop only */}
          {client.logo_url && (
            <div
              className="hidden sm:flex items-center justify-center rounded-2xl overflow-hidden flex-shrink-0"
              style={{
                height: '56px',
                width: '56px',
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
                border: `1px solid ${theme.border}`,
              }}
            >
              <img src={client.logo_url} alt="" className="h-10 w-10 object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* ================================================================
          TRIAL BANNER
          ================================================================ */}
      {client.subscription_status === 'trial' && stats.trialDaysLeft !== null && (
        <div
          className="mb-6 sm:mb-8 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 fade-up fade-up-1"
          style={{
            background: theme.isDark
              ? `linear-gradient(135deg, ${hexToRgba(theme.primary, 0.12)}, ${hexToRgba(theme.primary, 0.04)})`
              : `linear-gradient(135deg, ${hexToRgba(theme.primary, 0.08)}, ${hexToRgba(theme.primary, 0.02)})`,
            border: `1px solid ${hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.15)}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: hexToRgba(theme.primary, 0.15) }}
            >
              <Sparkles className="h-5 w-5" style={{ color: theme.primary }} />
            </div>
            <div>
              <p className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>
                {stats.trialDaysLeft > 0 ? `${stats.trialDaysLeft} day${stats.trialDaysLeft !== 1 ? 's' : ''} left in your trial` : 'Your trial has ended'}
              </p>
              <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                Upgrade to keep your AI receptionist active.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* ================================================================
          PHONE NUMBER + STATS ROW
          ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 mb-6 sm:mb-8">
        {/* Phone Number — spans 3 cols */}
        <div
          className="lg:col-span-3 rounded-2xl p-5 sm:p-6 fade-up fade-up-2"
          style={{
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>
              Your AI Phone Number
            </p>
            {isProvisioned && (
              <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: theme.success }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: theme.success }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: theme.success }} />
                </span>
                Active
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div
                className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl flex-shrink-0"
                style={{
                  backgroundColor: isProvisioned ? theme.successBg : hexToRgba(theme.primary, 0.1),
                }}
              >
                {isProvisioned ? (
                  <Phone className="h-6 w-6" style={{ color: theme.success }} />
                ) : isProvisioningPending ? (
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
                ) : (
                  <PhoneOff className="h-6 w-6" style={{ color: theme.textMuted }} />
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight truncate" style={{ color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
                {formattedPhone || (isProvisioningPending ? 'Assigning...' : 'Not assigned')}
              </p>
            </div>

            {hasPhoneNumber && (
              <button
                onClick={copyPhoneNumber}
                className="flex items-center justify-center gap-2 rounded-xl border px-3 sm:px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
                style={{ borderColor: theme.border, color: theme.text, backgroundColor: 'transparent' }}
              >
                {copied ? <CheckCircle className="h-4 w-4" style={{ color: theme.success }} /> : <Copy className="h-4 w-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            )}
          </div>

          {isProvisioningPending && (
            <div className="mt-4 pt-4 flex items-center gap-4" style={{ borderTop: `1px solid ${theme.border}` }}>
              {[
                { label: 'Phone Number', done: hasPhoneNumber },
                { label: 'AI Assistant', done: hasAssistant },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-2">
                  {step.done ? (
                    <CheckCircle className="h-4 w-4" style={{ color: theme.success }} />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.primary }} />
                  )}
                  <span className="text-xs sm:text-sm" style={{ color: step.done ? theme.success : theme.textMuted }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isProvisioned && (
            <p className="mt-4 pt-4 text-xs sm:text-sm" style={{ color: theme.textMuted, borderTop: `1px solid ${theme.border}` }}>
              Forward your business calls to this number to get started. Dial <span className="font-mono font-medium" style={{ color: theme.text }}>*72</span> + this number from your office phone.
            </p>
          )}
        </div>

        {/* Stats — spans 2 cols, stacked */}
        <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
          {/* Calls Today */}
          <div
            className="rounded-2xl p-5 sm:p-6 fade-up fade-up-3"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>Today</p>
                <p className="text-3xl sm:text-4xl font-bold" style={{ color: theme.text, fontVariantNumeric: 'tabular-nums' }}>{stats.callsToday}</p>
                <p className="text-xs mt-1" style={{ color: theme.textMuted }}>call{stats.callsToday !== 1 ? 's' : ''} received</p>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}
              >
                <PhoneCall className="h-6 w-6" style={{ color: theme.primary }} />
              </div>
            </div>
          </div>

          {/* Monthly Usage */}
          <div
            className="rounded-2xl p-5 sm:p-6 fade-up fade-up-4"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>This Month</p>
                <p className="text-3xl sm:text-4xl font-bold" style={{ color: theme.text, fontVariantNumeric: 'tabular-nums' }}>{stats.callsThisMonth}</p>
                <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                  {isUnlimited ? 'unlimited plan' : `of ${stats.callLimit} calls`}
                </p>
              </div>
              {!isUnlimited && stats.callLimit > 0 ? (
                <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="36" fill="none" strokeWidth="5"
                      stroke={theme.isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'} />
                    <circle cx="40" cy="40" r="36" fill="none" strokeWidth="5"
                      stroke={theme.primary} strokeLinecap="round"
                      strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: theme.text }}>
                    {Math.round(usagePercent)}%
                  </span>
                </div>
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08) }}
                >
                  <TrendingUp className="h-6 w-6" style={{ color: theme.primary }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          RECENT CALLS
          ================================================================ */}
      <div
        className="rounded-2xl overflow-hidden fade-up fade-up-4"
        style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Recent Calls</h2>
          <a
            href="/client/calls"
            className="flex items-center gap-1 text-xs sm:text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: theme.primary }}
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {recentCalls.length === 0 ? (
          <div className="py-12 sm:py-16 text-center px-4">
            <div
              className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.12 : 0.06) }}
            >
              <PhoneCall className="h-7 w-7" style={{ color: theme.textMuted4 }} />
            </div>
            <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: theme.textMuted }}>No calls yet</p>
            <p className="text-xs sm:text-sm mt-1 max-w-xs mx-auto" style={{ color: theme.textMuted4 }}>
              {isProvisioned
                ? 'Forward calls to your AI number to get started!'
                : 'Your AI receptionist is being set up...'}
            </p>
          </div>
        ) : (
          <div>
            {recentCalls.slice(0, 5).map((call, idx) => {
              const isSpam = call.is_spam || call.call_status === 'spam';
              const wasTransferred = call.call_status === 'transferred' || call.transfer_status === 'transferred';

              const urgencyStyle =
                isSpam
                  ? { backgroundColor: theme.errorBg, color: theme.error }
                  : call.urgency_level === 'high' || call.urgency_level === 'emergency'
                  ? { backgroundColor: theme.errorBg, color: theme.error }
                  : call.urgency_level === 'medium'
                  ? { backgroundColor: theme.warningBg, color: theme.warning }
                  : { backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08), color: theme.textMuted };

              const relativeDate = formatRelativeDate(call.created_at);

              return (
                <a
                  key={call.id}
                  href={`/client/calls/${call.id}`}
                  className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3.5 sm:py-4 call-link-hover"
                  style={{ borderBottom: idx < Math.min(recentCalls.length, 5) - 1 ? `1px solid ${theme.borderSubtle}` : 'none' }}
                >
                  {/* Icon */}
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                    style={{
                      backgroundColor: isSpam ? theme.errorBg : wasTransferred
                        ? hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08)
                        : hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.08),
                    }}
                  >
                    {isSpam ? (
                      <ShieldX className="h-5 w-5" style={{ color: theme.error }} />
                    ) : wasTransferred ? (
                      <PhoneForwarded className="h-5 w-5" style={{ color: theme.primary }} />
                    ) : (
                      <PhoneCall className="h-5 w-5" style={{ color: theme.primary }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: theme.text }}>
                      {isSpam ? 'Spam Call' : (call.customer_name || 'Unknown Caller')}
                    </p>
                    <p className="text-xs truncate" style={{ color: theme.textMuted }}>
                      {formatPhoneNumber(call.customer_phone || call.caller_phone)}
                      <span className="hidden sm:inline"> · {relativeDate}</span>
                    </p>
                    <p className="text-[10px] sm:hidden mt-0.5" style={{ color: theme.textMuted4 }}>{relativeDate}</p>
                  </div>

                  {/* Badge */}
                  <span className="rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-medium capitalize flex-shrink-0" style={urgencyStyle}>
                    {isSpam ? 'spam' : (call.urgency_level || 'normal')}
                  </span>

                  <ChevronRight className="h-4 w-4 hidden sm:block flex-shrink-0" style={{ color: theme.textMuted4 }} />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}