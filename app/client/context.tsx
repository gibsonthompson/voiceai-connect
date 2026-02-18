'use client';

import { useState } from 'react';
import { 
  Phone, PhoneCall, Clock, Copy, 
  ChevronRight, AlertCircle, CheckCircle,
  Loader2, PhoneOff, Zap
} from 'lucide-react';
import { useClientTheme } from '@/hooks/useClientTheme';

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  agencyName: string;
  supportEmail: string | null;
  supportPhone: string | null;
  websiteTheme?: 'light' | 'dark' | 'auto';
}

interface Stats {
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
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  } else if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return phone;
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .call-link-hover { transition: background-color 0.15s ease; }
        .call-link-hover:hover { background-color: ${theme.hover} !important; }
      `}} />

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: theme.text }}>
          Welcome back! 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
          Here&apos;s your AI receptionist activity.
        </p>
      </div>

      {/* Trial Banner */}
      {client.subscription_status === 'trial' && stats.trialDaysLeft !== null && (
        <div 
          className="mb-6 sm:mb-8 rounded-xl border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
          style={{ 
            borderColor: theme.primary30,
            backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.1 : 0.05),
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{ backgroundColor: theme.primary15 }}
            >
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: theme.primary }} />
            </div>
            <div>
              <p className="font-medium text-sm sm:text-base" style={{ color: theme.text }}>
                {stats.trialDaysLeft > 0 ? `${stats.trialDaysLeft} days left in your trial` : 'Your trial has ended'}
              </p>
              <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                Upgrade to keep your AI receptionist active.
              </p>
            </div>
          </div>
          <button 
            onClick={handleUpgrade}
            className="rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium transition-all hover:scale-105 w-full sm:w-auto"
            style={{ backgroundColor: theme.primary, color: theme.primaryText }}
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Phone Number Card */}
      <div 
        className="mb-6 sm:mb-8 rounded-xl border p-4 sm:p-6 shadow-sm"
        style={{ 
          borderColor: isProvisioned ? theme.successBorder : theme.border,
          backgroundColor: theme.card,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div 
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl flex-shrink-0"
              style={{ 
                backgroundColor: isProvisioned ? theme.successBg : hexToRgba(theme.primary, 0.1),
              }}
            >
              {isProvisioned ? (
                <Phone className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: theme.success }} />
              ) : isProvisioningPending ? (
                <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" style={{ color: theme.primary }} />
              ) : (
                <PhoneOff className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: theme.textMuted }} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>Your AI Phone Number</p>
              <p className="text-lg sm:text-2xl font-semibold tracking-tight truncate" style={{ color: theme.text }}>
                {formattedPhone || (isProvisioningPending ? 'Being assigned...' : 'Not assigned')}
              </p>
            </div>
          </div>
          
          {hasPhoneNumber && (
            <button 
              onClick={copyPhoneNumber}
              className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors w-full sm:w-auto"
              style={{ borderColor: theme.border, color: theme.text, backgroundColor: 'transparent' }}
            >
              {copied ? <CheckCircle className="h-4 w-4" style={{ color: theme.success }} /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Number'}
            </button>
          )}
        </div>

        {isProvisioningPending && (
          <div 
            className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3 sm:gap-4"
            style={{ borderColor: theme.border }}
          >
            <div className="flex items-center gap-2">
              {hasPhoneNumber ? (
                <CheckCircle className="h-4 w-4" style={{ color: theme.success }} />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.primary }} />
              )}
              <span className="text-xs sm:text-sm" style={{ color: hasPhoneNumber ? theme.success : theme.textMuted }}>
                Phone Number
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasAssistant ? (
                <CheckCircle className="h-4 w-4" style={{ color: theme.success }} />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: theme.primary }} />
              )}
              <span className="text-xs sm:text-sm" style={{ color: hasAssistant ? theme.success : theme.textMuted }}>
                AI Assistant
              </span>
            </div>
          </div>
        )}

        {isProvisioned && (
          <p className="mt-4 text-xs sm:text-sm" style={{ color: theme.textMuted }}>
            Forward your business calls to this number
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-3 mb-6 sm:mb-8">
        {[
          {
            label: 'Calls This Month',
            value: stats.callsThisMonth,
            subtext: `of ${stats.callLimit} included`,
            icon: PhoneCall,
            color: theme.primary,
          },
          {
            label: 'High Priority',
            value: stats.highUrgency,
            subtext: 'Urgent calls',
            icon: AlertCircle,
            color: '#f59e0b',
          },
          {
            label: 'Status',
            value: isProvisioned ? 'Active' : 'Setting Up',
            subtext: isProvisioned ? 'Receiving calls' : 'Almost ready',
            icon: isProvisioned ? Zap : Loader2,
            color: isProvisioned ? theme.success : theme.primary,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-3 sm:p-6 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.card }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm truncate" style={{ color: theme.textMuted }}>{stat.label}</p>
                <p className="mt-0.5 sm:mt-1 text-lg sm:text-3xl font-semibold" style={{ color: theme.text }}>{stat.value}</p>
                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs truncate" style={{ color: theme.textMuted4 }}>{stat.subtext}</p>
              </div>
              <div 
                className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: hexToRgba(stat.color, theme.isDark ? 0.2 : 0.1) }}
              >
                <stat.icon 
                  className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.icon === Loader2 ? 'animate-spin' : ''}`} 
                  style={{ color: stat.color }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Calls */}
      <div 
        className="rounded-xl border shadow-sm"
        style={{ borderColor: theme.border, backgroundColor: theme.card }}
      >
        <div 
          className="flex items-center justify-between border-b p-4 sm:p-6"
          style={{ borderColor: theme.border }}
        >
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
        
        <div className="p-4 sm:p-6">
          {recentCalls.length === 0 ? (
            <div className="py-8 sm:py-12 text-center">
              <div 
                className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1) }}
              >
                <PhoneCall className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: theme.textMuted4 }} />
              </div>
              <p className="mt-4 font-medium text-sm sm:text-base" style={{ color: theme.textMuted }}>No calls yet</p>
              <p className="text-xs sm:text-sm" style={{ color: theme.textMuted4 }}>
                {isProvisioned 
                  ? 'Forward calls to your AI number to get started!'
                  : 'Your AI receptionist is being set up...'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentCalls.map((call) => {
                const urgencyStyle = 
                  call.urgency_level === 'high' || call.urgency_level === 'emergency'
                    ? { backgroundColor: theme.errorBg, color: theme.error }
                    : call.urgency_level === 'medium'
                    ? { backgroundColor: theme.warningBg, color: theme.warning }
                    : { backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1), color: theme.textMuted };

                return (
                  <a
                    key={call.id}
                    href={`/client/calls/${call.id}`}
                    className="block rounded-lg border p-3 sm:p-4 call-link-hover"
                    style={{ borderColor: theme.border, backgroundColor: 'transparent' }}
                  >
                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="flex items-start gap-3">
                        <div 
                          className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0"
                          style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1) }}
                        >
                          <PhoneCall className="h-4 w-4" style={{ color: theme.primary }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-medium text-sm truncate" style={{ color: theme.text }}>
                              {call.customer_name || 'Unknown Caller'}
                            </p>
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0" style={urgencyStyle}>
                              {call.urgency_level || 'normal'}
                            </span>
                          </div>
                          <p className="text-xs truncate" style={{ color: theme.textMuted }}>
                            {call.customer_phone || call.caller_phone}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] truncate" style={{ color: theme.textMuted4 }}>
                              {call.service_requested || 'General inquiry'}
                            </p>
                            <p className="text-[10px] flex-shrink-0" style={{ color: theme.textMuted4 }}>
                              {new Date(call.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: hexToRgba(theme.primary, theme.isDark ? 0.2 : 0.1) }}
                        >
                          <PhoneCall className="h-5 w-5" style={{ color: theme.primary }} />
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: theme.text }}>
                            {call.customer_name || 'Unknown Caller'}
                          </p>
                          <p className="text-sm" style={{ color: theme.textMuted }}>
                            {call.customer_phone || call.caller_phone} • {call.service_requested || 'General inquiry'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full px-3 py-1 text-xs font-medium" style={urgencyStyle}>
                          {call.urgency_level || 'normal'}
                        </span>
                        <p className="mt-1 text-xs" style={{ color: theme.textMuted4 }}>
                          {new Date(call.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}