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
  
  // Remove all non-digits except leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  
  // Handle US numbers (11 digits starting with 1, or 10 digits)
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
  
  // Return original if not standard format
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

  const copyPhoneNumber = () => {
    if (client.vapi_phone_number) {
      navigator.clipboard.writeText(client.vapi_phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle upgrade - create Stripe checkout
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
          planTier: client.plan_type || 'pro', // Use current plan tier
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

  // Light mode theme
  const theme = {
    bg: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    textMuted4: '#9ca3af',
    border: '#e5e7eb',
    cardBg: '#ffffff',
  };

  // Provisioning status
  const hasPhoneNumber = !!client.vapi_phone_number;
  const hasAssistant = !!client.vapi_assistant_id;
  const isProvisioned = hasPhoneNumber && hasAssistant;
  const isProvisioningPending = !isProvisioned && client.subscription_status !== 'cancelled';

  const formattedPhone = formatPhoneNumber(client.vapi_phone_number);

  return (
    <div className="p-8" style={{ backgroundColor: theme.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: theme.text }}>
          Welcome back! 👋
        </h1>
        <p className="mt-1" style={{ color: theme.textMuted }}>
          Here&apos;s your AI receptionist activity.
        </p>
      </div>

      {/* Trial Banner */}
      {client.subscription_status === 'trial' && stats.trialDaysLeft !== null && (
        <div 
          className="mb-8 rounded-xl border p-4 flex items-center justify-between"
          style={{ 
            borderColor: hexToRgba(branding.primaryColor, 0.3),
            backgroundColor: hexToRgba(branding.primaryColor, 0.05),
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: hexToRgba(branding.primaryColor, 0.15) }}
            >
              <Clock className="h-5 w-5" style={{ color: branding.primaryColor }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: theme.text }}>
                {stats.trialDaysLeft > 0 ? `${stats.trialDaysLeft} days left in your trial` : 'Your trial has ended'}
              </p>
              <p className="text-sm" style={{ color: theme.textMuted }}>
                Upgrade to keep your AI receptionist active.
              </p>
            </div>
          </div>
          <button 
            onClick={handleUpgrade}
            disabled={upgrading}
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: branding.primaryColor, 
              color: isLightColor(branding.primaryColor) ? '#111827' : '#ffffff' 
            }}
          >
            {upgrading ? (
              <span className="flex items-center gap-2">
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
        className="mb-8 rounded-xl border p-6 shadow-sm"
        style={{ 
          borderColor: isProvisioned ? 'rgba(52, 211, 153, 0.4)' : theme.border,
          backgroundColor: theme.cardBg,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ 
                backgroundColor: isProvisioned ? 'rgba(52, 211, 153, 0.15)' : hexToRgba(branding.primaryColor, 0.1),
              }}
            >
              {isProvisioned ? (
                <Phone className="h-7 w-7 text-emerald-500" />
              ) : isProvisioningPending ? (
                <Loader2 className="h-7 w-7 animate-spin" style={{ color: branding.primaryColor }} />
              ) : (
                <PhoneOff className="h-7 w-7" style={{ color: theme.textMuted }} />
              )}
            </div>
            <div>
              <p className="text-sm" style={{ color: theme.textMuted }}>Your AI Phone Number</p>
              <p className="text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>
                {formattedPhone || (isProvisioningPending ? 'Being assigned...' : 'Not assigned')}
              </p>
            </div>
          </div>
          
          {hasPhoneNumber && (
            <button 
              onClick={copyPhoneNumber}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Number'}
            </button>
          )}
        </div>

        {/* Provisioning Status */}
        {isProvisioningPending && (
          <div 
            className="mt-4 pt-4 border-t flex items-center gap-4"
            style={{ borderColor: theme.border }}
          >
            <div className="flex items-center gap-2">
              {hasPhoneNumber ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: branding.primaryColor }} />
              )}
              <span className="text-sm" style={{ color: hasPhoneNumber ? '#10b981' : theme.textMuted }}>
                Phone Number
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasAssistant ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: branding.primaryColor }} />
              )}
              <span className="text-sm" style={{ color: hasAssistant ? '#10b981' : theme.textMuted }}>
                AI Assistant
              </span>
            </div>
          </div>
        )}

        {isProvisioned && (
          <p className="mt-4 text-sm" style={{ color: theme.textMuted }}>
            Forward your business calls to this number
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
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
            className="rounded-xl border p-6 shadow-sm"
            style={{ borderColor: theme.border, backgroundColor: theme.cardBg }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: theme.textMuted }}>{stat.label}</p>
                <p className="mt-1 text-3xl font-semibold" style={{ color: theme.text }}>{stat.value}</p>
                <p className="mt-1 text-xs" style={{ color: theme.textMuted4 }}>{stat.subtext}</p>
              </div>
              <div 
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: hexToRgba(stat.color, 0.1) }}
              >
                <stat.icon 
                  className={`h-6 w-6 ${stat.icon === Loader2 ? 'animate-spin' : ''}`} 
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
          className="flex items-center justify-between border-b p-6"
          style={{ borderColor: theme.border }}
        >
          <h2 className="font-semibold" style={{ color: theme.text }}>Recent Calls</h2>
          <Link 
            href="/client/calls" 
            className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: branding.primaryColor }}
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="p-6">
          {recentCalls.length === 0 ? (
            <div className="py-12 text-center">
              <div 
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: hexToRgba(branding.primaryColor, 0.1) }}
              >
                <PhoneCall className="h-8 w-8" style={{ color: theme.textMuted4 }} />
              </div>
              <p className="mt-4 font-medium" style={{ color: theme.textMuted }}>No calls yet</p>
              <p className="text-sm" style={{ color: theme.textMuted4 }}>
                {isProvisioned 
                  ? 'Forward calls to your AI number to get started!'
                  : 'Your AI receptionist is being set up...'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/client/calls/${call.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                  style={{ borderColor: theme.border }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: hexToRgba(branding.primaryColor, 0.1) }}
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
                          ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }
                          : call.urgency_level === 'medium'
                          ? { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }
                          : { backgroundColor: hexToRgba(branding.primaryColor, 0.1), color: theme.textMuted }
                      }
                    >
                      {call.urgency_level || 'normal'}
                    </span>
                    <p className="mt-1 text-xs" style={{ color: theme.textMuted4 }}>
                      {new Date(call.created_at).toLocaleDateString()}
                    </p>
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