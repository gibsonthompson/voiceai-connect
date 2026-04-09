'use client';

import { useState } from 'react';
import { 
  Phone, PhoneCall, Copy, ChevronRight, CheckCircle,
  Loader2, PhoneOff, TrendingUp,
  PhoneForwarded, ShieldX, Sparkles, ArrowRight
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
  if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
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
  if (diffDays < 7) return `${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${timeStr}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(name: string | null | undefined): string {
  if (!name) return '';
  return name.split(' ')[0];
}

// Shared animation CSS injected once
const ANIM_CSS = `
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .45s ease-out both}.fu1{animation-delay:40ms}.fu2{animation-delay:80ms}.fu3{animation-delay:120ms}.fu4{animation-delay:160ms}.fu5{animation-delay:200ms}
`;

export function ClientDashboardClient({ client, branding, recentCalls, stats }: ClientDashboardClientProps) {
  const [copied, setCopied] = useState(false);
  const theme = useClientTheme();

  const copyPhoneNumber = () => {
    if (client.vapi_phone_number) {
      navigator.clipboard.writeText(client.vapi_phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasPhoneNumber = !!client.vapi_phone_number;
  const hasAssistant = !!client.vapi_assistant_id;
  const isProvisioned = hasPhoneNumber && hasAssistant;
  const isProvisioningPending = !isProvisioned && client.subscription_status !== 'cancelled';
  const formattedPhone = formatPhoneNumber(client.vapi_phone_number);
  const isUnlimited = stats.callLimit === -1;
  const firstName = getFirstName(client.owner_name);

  const usagePercent = isUnlimited ? 0 : stats.callLimit > 0 ? Math.min(100, (stats.callsThisMonth / stats.callLimit) * 100) : 0;
  const circ = 2 * Math.PI * 34;
  const offset = circ - (usagePercent / 100) * circ;

  // Glass card style helper
  const glass = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    backdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
    WebkitBackdropFilter: theme.isDark ? 'blur(20px)' : 'blur(12px)',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS + `
        .call-row{transition:background .15s ease}
        .call-row:hover{background:${theme.hover} !important}
      `}} />

      {/* ────────────────────────────────────────────────────────────────
          HEADER
          ──────────────────────────────────────────────────────────────── */}
      <div className="mb-5 sm:mb-7 fu fu1">
        <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold tracking-tight" style={{ color: theme.text }}>
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-0.5 text-[13px] sm:text-sm" style={{ color: theme.textMuted }}>
          Here&apos;s how {client.business_name || 'your business'} is doing today.
        </p>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          TRIAL BANNER
          ──────────────────────────────────────────────────────────────── */}
      {client.subscription_status === 'trial' && stats.trialDaysLeft !== null && (
        <div className="mb-5 sm:mb-7 rounded-2xl p-4 sm:p-5 fu fu1"
          style={{
            ...glass,
            background: theme.isDark
              ? `linear-gradient(135deg, ${hexToRgba(theme.primary, 0.1)}, ${hexToRgba(theme.primary, 0.03)})`
              : `linear-gradient(135deg, ${hexToRgba(theme.primary, 0.06)}, ${hexToRgba(theme.primary, 0.01)})`,
            border: `1px solid ${hexToRgba(theme.primary, theme.isDark ? 0.15 : 0.12)}`,
          }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: hexToRgba(theme.primary, 0.12) }}>
                <Sparkles className="h-5 w-5" style={{ color: theme.primary }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: theme.text }}>
                  {stats.trialDaysLeft > 0 ? `${stats.trialDaysLeft} day${stats.trialDaysLeft !== 1 ? 's' : ''} left in your trial` : 'Your trial has ended'}
                </p>
                <p className="text-xs" style={{ color: theme.textMuted }}>Upgrade to keep your AI receptionist active.</p>
              </div>
            </div>
            <a href="/client/upgrade"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
              style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
              Upgrade Now
            </a>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────
          PHONE NUMBER + STATS
          ──────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mb-5 sm:mb-7">

        {/* Phone Number Card — 7 cols on desktop */}
        <div className="lg:col-span-7 rounded-2xl p-5 sm:p-6 fu fu2" style={glass}>

          {/* Top row: label + status */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: theme.textMuted }}>
              Your AI Number
            </p>
            {isProvisioned && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: theme.success }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full opacity-60" style={{ backgroundColor: theme.success }} />
                  <span className="relative rounded-full h-2 w-2" style={{ backgroundColor: theme.success }} />
                </span>
                Active
              </span>
            )}
          </div>

          {/* Phone number + copy */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl flex-shrink-0"
                style={{ backgroundColor: isProvisioned ? theme.successBg : hexToRgba(theme.primary, 0.08) }}>
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
              <button onClick={copyPhoneNumber}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
                style={{ ...glass, color: theme.text }}>
                {copied ? <CheckCircle className="h-4 w-4" style={{ color: theme.success }} /> : <Copy className="h-4 w-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {/* Provisioning steps */}
          {isProvisioningPending && (
            <div className="flex items-center gap-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
              {[{ label: 'Phone Number', done: hasPhoneNumber }, { label: 'AI Assistant', done: hasAssistant }].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  {s.done ? <CheckCircle className="h-4 w-4" style={{ color: theme.success }} /> : <Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.primary }} />}
                  <span className="text-xs" style={{ color: s.done ? theme.success : theme.textMuted }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Forwarding instructions — fixed mobile layout */}
          {isProvisioned && (
            <div className="pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
              <p className="text-xs sm:text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>
                Forward your business calls to this number.
                <span className="hidden sm:inline"> Dial </span>
                <span className="sm:hidden block mt-1">Dial </span>
                <span className="font-mono font-semibold px-1.5 py-0.5 rounded-md text-[11px]"
                  style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: theme.text }}>
                  *72
                </span>
                {' '}+ this number from your office phone.
              </p>
            </div>
          )}
        </div>

        {/* Stats — 5 cols on desktop, 2-col grid on mobile */}
        <div className="lg:col-span-5 grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">

          {/* Calls Today */}
          <div className="rounded-2xl p-5 sm:p-6 fu fu3" style={glass}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: theme.textMuted }}>Today</p>
                <p className="text-3xl sm:text-4xl font-bold" style={{ color: theme.text, fontVariantNumeric: 'tabular-nums' }}>{stats.callsToday}</p>
                <p className="text-[11px] mt-1" style={{ color: theme.textMuted }}>call{stats.callsToday !== 1 ? 's' : ''} received</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06) }}>
                <PhoneCall className="h-6 w-6" style={{ color: theme.primary }} />
              </div>
            </div>
          </div>

          {/* Monthly Usage */}
          <div className="rounded-2xl p-5 sm:p-6 fu fu4" style={glass}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: theme.textMuted }}>This Month</p>
                <p className="text-3xl sm:text-4xl font-bold" style={{ color: theme.text, fontVariantNumeric: 'tabular-nums' }}>{stats.callsThisMonth}</p>
                <p className="text-[11px] mt-1" style={{ color: theme.textMuted }}>
                  {isUnlimited ? 'unlimited plan' : `of ${stats.callLimit} calls`}
                </p>
              </div>
              {!isUnlimited && stats.callLimit > 0 ? (
                <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
                  <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
                    <circle cx="38" cy="38" r="34" fill="none" strokeWidth="4.5"
                      stroke={theme.isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb'} />
                    <circle cx="38" cy="38" r="34" fill="none" strokeWidth="4.5"
                      stroke={theme.primary} strokeLinecap="round"
                      strokeDasharray={circ} strokeDashoffset={offset}
                      style={{ transition: 'stroke-dashoffset .6s ease' }} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: theme.text }}>
                    {Math.round(usagePercent)}%
                  </span>
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06) }}>
                  <TrendingUp className="h-6 w-6" style={{ color: theme.primary }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          RECENT CALLS
          ──────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden fu fu5" style={glass}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5"
          style={{ borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
          <h2 className="font-semibold text-sm sm:text-[15px] tracking-tight" style={{ color: theme.text }}>Recent Calls</h2>
          <a href="/client/calls"
            className="flex items-center gap-1 text-xs sm:text-sm font-medium transition hover:opacity-80"
            style={{ color: theme.primary }}>
            View all <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Empty state */}
        {recentCalls.length === 0 ? (
          <div className="py-14 sm:py-20 text-center px-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
              style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.08 : 0.05) }}>
              <PhoneCall className="h-7 w-7" style={{ color: theme.textMuted4 }} />
            </div>
            <p className="font-medium text-sm" style={{ color: theme.textMuted }}>No calls yet</p>
            <p className="text-xs mt-1 max-w-[240px] mx-auto" style={{ color: theme.textMuted4 }}>
              {isProvisioned ? 'Forward calls to your AI number to get started.' : 'Your AI receptionist is being set up...'}
            </p>
          </div>
        ) : (
          /* Call rows */
          <div>
            {recentCalls.slice(0, 5).map((call, idx) => {
              const isSpam = call.is_spam || call.call_status === 'spam';
              const wasTransferred = call.call_status === 'transferred' || call.transfer_status === 'transferred';

              const badgeStyle =
                isSpam ? { backgroundColor: theme.errorBg, color: theme.error }
                : (call.urgency_level === 'high' || call.urgency_level === 'emergency')
                ? { backgroundColor: theme.errorBg, color: theme.error }
                : call.urgency_level === 'medium'
                ? { backgroundColor: theme.warningBg, color: theme.warning }
                : { backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06), color: theme.textMuted };

              return (
                <a key={call.id} href={`/client/calls/${call.id}`}
                  className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3.5 sm:py-4 call-row"
                  style={{ borderBottom: idx < Math.min(recentCalls.length, 5) - 1 ? `1px solid ${theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none' }}>

                  {/* Icon */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                    style={{ backgroundColor: isSpam ? theme.errorBg : hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.06) }}>
                    {isSpam ? <ShieldX className="h-[18px] w-[18px]" style={{ color: theme.error }} />
                      : wasTransferred ? <PhoneForwarded className="h-[18px] w-[18px]" style={{ color: theme.primary }} />
                      : <PhoneCall className="h-[18px] w-[18px]" style={{ color: theme.primary }} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[13px] sm:text-sm truncate" style={{ color: theme.text }}>
                      {isSpam ? 'Spam Call' : (call.customer_name || 'Unknown Caller')}
                    </p>
                    <p className="text-[11px] sm:text-xs truncate mt-0.5" style={{ color: theme.textMuted }}>
                      {formatPhoneNumber(call.customer_phone || call.caller_phone)}
                      <span className="hidden sm:inline"> · {formatRelativeDate(call.created_at)}</span>
                    </p>
                    <p className="text-[10px] sm:hidden mt-0.5" style={{ color: theme.textMuted4 }}>{formatRelativeDate(call.created_at)}</p>
                  </div>

                  {/* Badge */}
                  <span className="rounded-full px-2.5 py-[3px] text-[10px] sm:text-[11px] font-semibold capitalize flex-shrink-0" style={badgeStyle}>
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