'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Phone, PhoneCall, Clock, Copy, 
  ChevronRight, AlertCircle, CheckCircle,
  Loader2, PhoneOff, Zap
} from 'lucide-react';

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

// Helper functions
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Format phone number: +12137155168 → +1 (213) 715-5168
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 11 && digits.startsWith('1')) {
    const country = '+1';
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7, 11);
    return `${country} (${area}) ${prefix}-${line}`;
  } else if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6, 10);
    return `+1 (${area}) ${prefix}-${line}`;
  }
  
  return phone;
}

export function ClientDashboardClient({
  client,
  branding,
  recentCalls,
  stats,
}: ClientDashboardClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Determine theme - default to light for client dashboard (cleaner look)
  const isDark = branding.websiteTheme === 'dark';

  // Theme colors based on agency setting
  const theme = isDark ? {
    bg: '#0a0a0a',
    text: '#fafaf9',
    textMuted: 'rgba(250, 250, 249, 0.7)',
    textMuted4: 'rgba(250, 250, 249, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    cardBg: '#111111',
    hoverBg: 'rgba(255, 255, 255, 0.05)',
  } : {
    bg: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    textMuted4: '#9ca3af',
    border: '#e5e7eb',
    cardBg: '#ffffff',
    hoverBg: '#f3f4f6',
  };

  const copyPhoneNumber = () => {
    if (client.vapi_phone_number) {
      navigator.clipboard.writeText(client.vapi_phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const response = await fetch('/api/client/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          clientId: client.id,
          planTier: client.plan_type || 'pro',
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
        setUpgrading(false);
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
      setUpgrading(false);
    }
  };

  const hasPhoneNumber = !!client.vapi_phone_number;
  const hasAssistant = !!client.vapi_assistant_id;
  const isProvisioned = hasPhoneNumber && hasAssistant;
  const isProvisioningPending = !isProvisioned && client.subscription_status !== 'cancelled';

  const formattedPhone = formatPhoneNumber(client.vapi_phone_number);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen" style={{ backgroundColor: theme.bg }}>
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
            borderColor: hexToRgba(branding.primaryColor, 0.3),
            backgroundColor: hexToRgba(branding.primaryColor, isDark ? 0.1 : 0.05),
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg flex-shrink-0"
              style={{ backgroundColor: hexToRgba(branding.primaryColor, 0.15) }}
            >
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: branding.primaryColor }} />
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
            disabled={upgrading}
            className="rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            style={{ 
              backgroundColor: branding.primaryColor, 
              color: isLightColor(branding.primaryColor) ? '#111827' : '#ffffff' 
            }}
          >
            {upgrading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              'Upgrade Now'
            )}
          </button>
        </div>
      )}

      {/* Phone Number Card */}
      <div 
        className="mb-6 sm:mb-8 rounded-xl border p-4 sm:p-6 shadow-sm"
        style={{ 
          borderColor: isProvisioned ? 'rgba(52, 211, 153, 0.4)' : theme.border,
          backgroundColor: theme.cardBg,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div 
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl flex-shrink-0"
              style={{ 
                backgroundColor: isProvisioned ? 'rgba(52, 211, 153, 0.15)' : hexToRgba(branding.primaryColor, 0.1),
              }}
            >
              {isProvisioned ? (
                <Phone className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-500" />
              ) : isProvisioningPending ? (
                <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" style={{ color: branding.primaryColor }} />
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
              style={{ 
                borderColor: theme.border, 
                color: theme.text,
                backgroundColor: 'transparent',
              }}
            >
              {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Number'}
            </button>
          )}
        </div>

        {/* Provisioning Status */}
        {isProvisioningPending && (
          <div 
            className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3 sm:gap-4"
            style={{ borderColor: theme.border }}
          >
            <div className="flex items-center gap-2">
              {hasPhoneNumber ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: branding.primaryColor }} />
              )}
              <span className="text-xs sm:text-sm" style={{ color: hasPhoneNumber ? '#10b981' : theme.textMuted }}>
                Phone Number
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasAssistant ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: branding.primaryColor }} />
              )}
              <span className="text-xs sm:text-sm" style={{ color: hasAssistant ? '#10b981' : theme.textMuted }}>
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
            color: branding.primaryColor,
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
            color: isProvisioned ? '#10b981' : branding.primaryColor,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-3 sm:p-6 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm truncate" style={{ color: theme.textMuted }}>{stat.label}</p>
                <p className="mt-0.5 sm:mt-1 text-lg sm:text-3xl font-semibold" style={{ color: theme.text }}>{stat.value}</p>
                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs truncate" style={{ color: theme.textMuted4 }}>{stat.subtext}</p>
              </div>
              <div 
                className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: hexToRgba(stat.color, isDark ? 0.2 : 0.1) }}
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
        style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
      >
        <div 
          className="flex items-center justify-between border-b p-4 sm:p-6"
          style={{ borderColor: theme.border }}
        >
          <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>Recent Calls</h2>
          <Link 
            href="/client/calls" 
            className="flex items-center gap-1 text-xs sm:text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: branding.primaryColor }}
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="p-4 sm:p-6">
          {recentCalls.length === 0 ? (
            <div className="py-8 sm:py-12 text-center">
              <div 
                className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: hexToRgba(branding.primaryColor, isDark ? 0.2 : 0.1) }}
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
              {recentCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/client/calls/${call.id}`}
                  className="block rounded-lg border p-3 sm:p-4 transition-colors"
                  style={{ 
                    borderColor: theme.border,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start gap-3">
                      <div 
                        className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0"
                        style={{ backgroundColor: hexToRgba(branding.primaryColor, isDark ? 0.2 : 0.1) }}
                      >
                        <PhoneCall className="h-4 w-4" style={{ color: branding.primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-medium text-sm truncate" style={{ color: theme.text }}>
                            {call.customer_name || 'Unknown Caller'}
                          </p>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium flex-shrink-0"
                            style={
                              call.urgency_level === 'high' || call.urgency_level === 'emergency'
                                ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
                                : call.urgency_level === 'medium'
                                ? { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }
                                : { backgroundColor: hexToRgba(branding.primaryColor, isDark ? 0.2 : 0.1), color: theme.textMuted }
                            }
                          >
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
                        style={{ backgroundColor: hexToRgba(branding.primaryColor, isDark ? 0.2 : 0.1) }}
                      >
                        <PhoneCall className="h-5 w-5" style={{ color: branding.primaryColor }} />
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
                      <span
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={
                          call.urgency_level === 'high' || call.urgency_level === 'emergency'
                            ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
                            : call.urgency_level === 'medium'
                            ? { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }
                            : { backgroundColor: hexToRgba(branding.primaryColor, isDark ? 0.2 : 0.1), color: theme.textMuted }
                        }
                      >
                        {call.urgency_level || 'normal'}
                      </span>
                      <p className="mt-1 text-xs" style={{ color: theme.textMuted4 }}>
                        {new Date(call.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}